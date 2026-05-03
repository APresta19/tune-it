import { use, useEffect, useRef, useState } from "react";
import "../css/Playback.css";
import ProgressBar from "./ProgressBar";
import PlayerGuess from "./PlayerGuess";
import { io } from "socket.io-client";
import { getSocket } from "../../backend/services/socket.js";
import { useParams, useNavigate } from "react-router-dom";

let sharedSpotifyPlayer = null;
let sharedSpotifyDeviceId = null;
let sharedActivationPromise = Promise.resolve();
const spotifyCallbacks = {
    onReady: null,
    onNotReady: null,
    onStateChange: null,
};

function Playback() 
{
    const player = useRef(null);
    const latestState = useRef(null);
    const latestStateTime = useRef(0);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const navigate = useNavigate();

    // Gamestate logic
    const [songs, setSongs] = useState([]);
    const [currentSongIndex, setCurrentSongIndex] = useState(0);
    const [roomPlayerList, setRoomPlayerList] = useState([]);
    const [guessedRoomPlayerList, setGuessedRoomPlayerList] = useState([]);
    const roomPlayerListRef = useRef([]);
    const [guessId, setGuessId] = useState(null);
    const [playerSong, setPlayerSong] = useState(null);
    const [revealed, setRevealed] = useState(false);
    const [scores, setScores] = useState({});
    const [displayTimer, setDisplayTimer] = useState(0);

    const [correctPlayer, setCorrectPlayer] = useState(null);

    const [playlistId, setPlaylistId] = useState(null);
    const deviceId = useRef(null);
    const pendingSong = useRef(null);
    const pendingSongIndex = useRef(null);
    const currentPlaybackKey = useRef(null);
    const inFlightPlaybackKey = useRef(null);
    const currentPlayRequest = useRef(0);

    const playerId = localStorage.getItem("playerId");
    const playerName = localStorage.getItem("playerName");
    const isHost = localStorage.getItem("isHost") === "true";
    const { gameId } = useParams();


    const socket = useRef(null);

    function buildPlaybackKey(song, songIndex) {
        return `${gameId}:${song.song_id || song.track_uri}:${songIndex ?? 0}`;
    }

    function queueOrPlaySong(song, songIndex) {
        if (!song) return;

        const playbackKey = buildPlaybackKey(song, songIndex);
        if (currentPlaybackKey.current === playbackKey || inFlightPlaybackKey.current === playbackKey) return;

        console.log("playSong event received with song:", song, "songIndex:", songIndex);
        setPlayerSong(song);
        setCurrentSongIndex(songIndex);
        setCurrentTime(song.position || 0);
        pendingSong.current = song;
        pendingSongIndex.current = songIndex;
        console.log("Playing song:", song); // this is right but display isnt
        console.log("song.duration_ms:", song.duration_ms);
        latestState.current = { position: 0, duration: song.duration_ms || 0, paused: false };
        latestStateTime.current = Date.now();
        setDuration((song.duration_ms || 0) / 1000);
        if (!deviceId.current) {
            if (isHost) {
                console.error("Device ID not ready yet");
                pendingSong.current = song;
                pendingSongIndex.current = songIndex;
            }
        }
        else if (isHost) {
            playSong(song, deviceId.current, playbackKey);
        }
    }

    useEffect(() => {
        // Socket setup

        socket.current = getSocket();

        function isCurrentGame(eventGameId) {
            return String(eventGameId) === String(gameId);
        }

        function handlePlaySong(song, songIndex) {
            queueOrPlaySong(song, songIndex);
        }

        const join = () => {
            console.log("Emitting joinGame...");
            socket.current.emit("joinGame", { gameId, playerId, playerName });
        };

        
        // Listen for events
        socket.current.on("gameState", (state) => {
            if (!isCurrentGame(state.game?.game_id)) return;

            console.log("Playback received game state:", state);
            setRoomPlayerList(state.players);
            setSongs(state.songs);
            console.log("State songs:", state.songs);
            setCurrentSongIndex(state.currentSongIndex);

            if (state.phase === "playing" && state.currentSong) {
                handlePlaySong(state.currentSong, state.currentSongIndex);
            }
        });

        socket.current.on("playSong", ({ gameId: eventGameId, song, songIndex }) => {
            if (!isCurrentGame(eventGameId)) return;
            handlePlaySong(song, songIndex);
        });
        socket.current.on("roundResult", ({ gameId: eventGameId, correct_player, scores }) => {
            if (!isCurrentGame(eventGameId)) return;
            setCorrectPlayer(correct_player);
            setScores(scores);
            // End the song
            endSong();
        });
        socket.current.on("roundFinished", ({ gameId: eventGameId, scores }) => {
            if (!isCurrentGame(eventGameId)) return;
            setScores(scores);
            // Maybe show some end of round screen here
            console.log("Round finished with scores:", scores);
            player.current?.pause();
            console.log("Navigating to leaderboard with scores:", scores, "and players:", roomPlayerList);
            navigate(`/leaderboard/${gameId}`, { state: { scores, players: roomPlayerListRef.current } });
        });

        if (socket.current.connected) {
            // Already connected
            join();
        } else {
            // First-time connect
            socket.current.on("connect", join);
        }

        return () => { 
            socket.current.off("connect");
            socket.current.off("gameState"); 
            socket.current.off("playSong");
            socket.current.off("roundResult");
            socket.current.off("roundFinished");
        }
    }, []);



    function shufflePlaylist()
    {

    }

    const songEnded = useRef(false);
    function endSong()
    {
        console.log("Before song ends. ");
        if (songEnded.current) return;
        songEnded.current = true;
         console.log("Song ended after.");
        // Update revealed state
        setRevealed(true);
        setDisplayTimer(4);
        setTimeout(() => {
            songEnded.current = false;
            console.log("Trying to start next song...");
            startNextSong();
        }, 4000);
    }

    // Countdown timer for next song display
    useEffect(() => {
        if (displayTimer === 0) return;
        const timerId = setInterval(() => {
            setDisplayTimer(prev => prev - 1);
        }, 1000);
        return () => clearInterval(timerId);
    }, [displayTimer]);

    function startNextSong()
    {
        console.log("startNextSong called");
        console.log("guessId before reset:", guessId);

        setGuessedRoomPlayerList([]);
        setRevealed(false);
        setCurrentSongIndex(i => i + 1);
        setCorrectPlayer(null);
        setGuessId(null);
    }

    // Initializes the Spotify Playback SDK
    useEffect(() => {
        if (!isHost) return;

        async function activateDevice(id) {
            const token = localStorage.getItem("access_token");
            deviceId.current = id;
            console.log('Ready with Device ID', id);

            sharedActivationPromise = (async () => {
                for (let i = 0; i < 5; i++) {
                    const transferRes = await fetch("https://api.spotify.com/v1/me/player", {
                        method: "PUT",
                        headers: {
                            Authorization: `Bearer ${token}`,
                            "Content-Type": "application/json"
                        },
                        body: JSON.stringify({
                            device_ids: [id],
                            play: false
                        })
                    });
                    if (transferRes.ok) {
                        console.log("Successfully transferred playback to Tune-It Player");
                        break;
                    }
                    console.warn(`Attempt ${i + 1} to transfer playback failed. Status: ${transferRes.status}`);
                    await new Promise(resolve => setTimeout(resolve, 1000));
                }
            })();

            await sharedActivationPromise;

            if(pendingSong.current) {
                console.log("Playing pending song:", pendingSong.current);
                const song = pendingSong.current;
                const playbackKey = buildPlaybackKey(song, pendingSongIndex.current);
                await playSong(song, id, playbackKey);
                pendingSong.current = null;
                pendingSongIndex.current = null;
            }

            fetch(`${import.meta.env.VITE_API_URL}/game/${gameId}/state`)
                .then(res => res.ok ? res.json() : null)
                .then(state => {
                    if (state?.phase === "playing" && state.currentSong) {
                        queueOrPlaySong(state.currentSong, state.currentSongIndex);
                    }
                })
                .catch(err => console.error("Failed to sync current playback state:", err));
        }

        function initializePlayer() {
            if (!sharedSpotifyPlayer) {
                sharedSpotifyPlayer = new Spotify.Player({
                    name: 'Tune-It Player',
                    getOAuthToken: cb => cb(localStorage.getItem("access_token")),
                    volume: 0.5
                });

                sharedSpotifyPlayer.addListener('ready', ({ device_id }) => {
                    sharedSpotifyDeviceId = device_id;
                    spotifyCallbacks.onReady?.({ device_id });
                });

                sharedSpotifyPlayer.addListener('not_ready', ({ device_id }) => {
                    if (sharedSpotifyDeviceId === device_id) {
                        sharedSpotifyDeviceId = null;
                    }
                    spotifyCallbacks.onNotReady?.({ device_id });
                });

                sharedSpotifyPlayer.addListener('player_state_changed', state => {
                    spotifyCallbacks.onStateChange?.(state);
                });

                sharedSpotifyPlayer.connect();
            }

            player.current = sharedSpotifyPlayer;

            if (sharedSpotifyDeviceId) {
                activateDevice(sharedSpotifyDeviceId);
            }
        }

        spotifyCallbacks.onReady = ({ device_id }) => activateDevice(device_id);
        spotifyCallbacks.onNotReady = ({ device_id }) => {
            console.log('Device ID has gone offline', device_id);
            if (deviceId.current === device_id) {
                deviceId.current = null;
            }
        };
        spotifyCallbacks.onStateChange = state => {
            if (!state) return;
            latestState.current = state;
            latestStateTime.current = Date.now();
            setDuration(state.duration / 1000);
        };
            
        if (window.Spotify) {
            console.log("SDK enabled");
            initializePlayer();
        } else {
            console.log("SDK disabled");
            window.onSpotifyWebPlaybackSDKReady = initializePlayer;
        }
        return () => {
            if (spotifyCallbacks.onReady) spotifyCallbacks.onReady = null;
            if (spotifyCallbacks.onNotReady) spotifyCallbacks.onNotReady = null;
            if (spotifyCallbacks.onStateChange) spotifyCallbacks.onStateChange = null;
        }
    }, []);

    // Playback status updates
    useEffect(() => {
        let animationFrame;
        let lastUpdate = 0;
        
        // Updates latestState.current to move slider
        function updatePlaybackSlider(timestamp) { // passed by requestAnimationFrame
            // 60 renders per second causes issues with playback, so we only update every 100ms
            if (timestamp - lastUpdate >= 100) {
                if(latestState.current && !latestState.current.paused) {
                    const elapsed = (Date.now() - latestStateTime.current) / 1000;
                    const time = (latestState.current.position / 1000) + elapsed;
                    setCurrentTime(Math.min(time, latestState.current.duration / 1000));
                    setDuration(latestState.current.duration / 1000);
                }
                lastUpdate = timestamp;
            }
            animationFrame = requestAnimationFrame(updatePlaybackSlider);
        }
        animationFrame = requestAnimationFrame(updatePlaybackSlider);

        return () => cancelAnimationFrame(animationFrame);
    }, []);

    function handleTogglePlay() {
        player.current?.togglePlay();
        console.log("Toggled play/pause");
    }

    function handleGuess(playerName)
    {
        setGuessedRoomPlayerList(prev =>
            prev.includes(playerName) ? prev : [...prev, playerName]
        );

        const gid = roomPlayerList.find(p => p.player_name === playerName)?.player_id;
        setGuessId(gid);

        console.log("Handling guess...");

        socket.current.emit("submitGuess", {
            gameId,
            playerId,
            guessedPlayerId: gid
        });
    }

    // useEffect(() => {
    //     if (!deviceId.curremt || !playerSong) return;
    //     console.log("Player song changed:", playerSong);
    //     pendingSong.current = playerSong;
    // }, [playerSong, deviceId.curre]);

    function renderCurrentSong() {
        const currentSong = playerSong;
        if (!currentSong) return <p>No song playing</p>;
        return (
            <div className="current-song">
                <img src={currentSong.image_url} alt={`${currentSong.track_name} by ${currentSong.track_artist} album art`} className="album-art" />
                <h3>{currentSong.track_name}</h3>
                <p>{currentSong.track_artist}</p>
            </div>
        );
    }

    function renderRoundResult() {
        if (!revealed) return null;

        const correctPlayerName = roomPlayerList.find(player => player.player_id === correctPlayer)?.player_name || "Unknown";
        const rankedPlayers = [...roomPlayerList].sort((a, b) => {
            return (scores[b.player_id] || 0) - (scores[a.player_id] || 0);
        });

        return (
            <div className="round-result-overlay">
                <div className="round-result-panel">
                    <p className="round-result-label">Correct Player</p>
                    <h2>{correctPlayerName}</h2>
                    <div className="round-score-list">
                        {rankedPlayers.map((player, index) => (
                            <div key={player.player_id} className="round-score-row">
                                <span className="round-score-rank">{index + 1}</span>
                                <span className="round-score-name">{player.player_name}</span>
                                <span className="round-score-value">{scores[player.player_id] || 0}</span>
                            </div>
                        ))}
                    </div>
                    {displayTimer > 0 && <p className="round-result-next">Next song in {displayTimer}</p>}
                </div>
            </div>
        );
    }

    function normalizeSpotifyText(value) {
        return String(value || "")
            .toLowerCase()
            .replace(/[^\w\s]/g, "")
            .replace(/\s+/g, " ")
            .trim();
    }

    function activeTrackMatchesSong(activeTrack, song) {
        if (!activeTrack || !song) return false;

        const activeName = normalizeSpotifyText(activeTrack.name);
        const requestedName = normalizeSpotifyText(song.track_name);
        const activeArtists = activeTrack.artists?.map(artist => normalizeSpotifyText(artist.name)).join(" ") || "";
        const requestedArtists = normalizeSpotifyText(song.track_artist);

        return activeName === requestedName && requestedArtists
            .split(" ")
            .filter(Boolean)
            .some(artistPart => activeArtists.includes(artistPart));
    }

    // Was having issues with Spotify not starting playback on the first song with Firefox
    // playSong will retry a few times to give Spotify some time
    async function playSong(song, deviceId, playbackKey) {
        const uri = song.track_uri;
        const token = localStorage.getItem("access_token");
        const requestId = currentPlayRequest.current + 1;
        currentPlayRequest.current = requestId;
        inFlightPlaybackKey.current = playbackKey;

        await sharedActivationPromise;
        if (requestId !== currentPlayRequest.current) {
            if (inFlightPlaybackKey.current === playbackKey) inFlightPlaybackKey.current = null;
            return;
        }

        console.log("play body:", JSON.stringify({ uris: [uri], position_ms: 0 }));

        for (let i = 0; i < 5; i++) { // retry a few times in case Spotify isn't ready
            const response = await fetch(`https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`, {
                method: "PUT",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ uris: [uri], position_ms: 0  })
            });

            const text = await response.text();
            console.log("playSong status:", response.status, "response:", text);

            if (!response.ok) {
                console.warn(`Attempt ${i + 1} to start playback failed. Status: ${response.status}`);
                await new Promise(resolve => setTimeout(resolve, 1000));
                continue;
            }

            if (requestId !== currentPlayRequest.current) {
                if (inFlightPlaybackKey.current === playbackKey) inFlightPlaybackKey.current = null;
                return;
            }

            await new Promise(resolve => setTimeout(resolve, 100));
            await fetch(`https://api.spotify.com/v1/me/player/seek?position_ms=0&device_id=${deviceId}`, {
                method: "PUT",
                headers: { Authorization: `Bearer ${token}` }
            });

            latestState.current = { position: 0, duration: song.duration_ms || 0, paused: false };
            latestStateTime.current = Date.now();
            setDuration((song.duration_ms || 0) / 1000);
            currentPlaybackKey.current = playbackKey;
            inFlightPlaybackKey.current = null;

            await new Promise(resolve => setTimeout(resolve, 800));
            const state = await player.current?.getCurrentState();
            const activeTrack = state?.track_window?.current_track;
            const activeUri = activeTrack?.uri;
            console.log("Current Spotify state after play:", state);

            if (state && !state.paused && (activeUri === uri || activeTrackMatchesSong(activeTrack, song))) {
                latestState.current = state;
                latestStateTime.current = Date.now();
                setDuration(state.duration / 1000);
                console.log("Successfully started Tune-It track:", uri);
            }

            if (state && activeUri && activeUri !== uri && !activeTrackMatchesSong(activeTrack, song)) {
                console.warn("Spotify state reported a different active track after Tune-It play request.", {
                    requestedUri: uri,
                    activeUri,
                    paused: state?.paused
                });
            }

            return;
        }

        if (inFlightPlaybackKey.current === playbackKey) {
            inFlightPlaybackKey.current = null;
        }
    }

    async function getDeviceId(device_id) {
        const token = localStorage.getItem("access_token");
        // Check device 
        const devicesRes = await fetch("https://api.spotify.com/v1/me/player/devices", {
            headers: { Authorization: `Bearer ${token}` }
        });
        const devicesData = await devicesRes.json();

        const tuneItDevice = devicesData.devices.find(d => d.name === "Tune-It Player");
        console.log("All devices:", devicesData.devices);
        console.log("Tune-It device:", tuneItDevice);
        const id = tuneItDevice ? tuneItDevice.id : device_id;
        console.log("ID to use:", id);
        return id;
    }

    useEffect(() => {
        roomPlayerListRef.current = roomPlayerList;
    }, [roomPlayerList]);

    useEffect(() => {
        console.log("Player song updated:", playerSong);
    }, [playerSong]);

    return (
        <>
            <div className="playback-container">
                {renderRoundResult()}

                <div className={revealed ? "playback-content hidden" : "playback-content"}>
                    <h2>Now Playing</h2>
                    {renderCurrentSong()}
                    <ProgressBar currentTime={currentTime} duration={duration} />

                    <div className="guess-container">
                        <h2>Guess Who</h2>
                        <div className="player-list">
                            {roomPlayerList.map(player => (
                                <PlayerGuess 
                                key={player.player_id} 
                                name={player.player_name} 
                                disabled={guessId !== null} 
                                isCorrect={revealed ? player.player_id === correctPlayer : null}
                                onClick={() => handleGuess(player.player_name)}/>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

export default Playback;
