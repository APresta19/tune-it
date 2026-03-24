import { use, useEffect, useRef, useState } from "react";
import "../css/Playback.css";
import ProgressBar from "./ProgressBar";
import PlayerGuess from "./PlayerGuess";
import { io } from "socket.io-client";
import { getSocket } from "../../backend/services/socket.js";
import { useParams } from "react-router-dom";

function Playback() 
{
    const player = useRef(null);
    const latestState = useRef(null);
    const latestStateTime = useRef(0);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);

    // Gamestate logic
    const [songs, setSongs] = useState([]);
    const [currentSongIndex, setCurrentSongIndex] = useState(0);
    const [roomPlayerList, setRoomPlayerList] = useState([]);
    const [guessedRoomPlayerList, setGuessedRoomPlayerList] = useState([]);
    const [guessId, setGuessId] = useState(null);
    const [playerSong, setPlayerSong] = useState(null);
    const [revealed, setRevealed] = useState(false);
    const [scores, setScores] = useState({});
    const [displayTimer, setDisplayTimer] = useState(0);

    const [correctPlayer, setCorrectPlayer] = useState(null);

    const [playlistId, setPlaylistId] = useState(null);
    const deviceId = useRef(null);
    const pendingSong = useRef(null);

    const playerId = localStorage.getItem("playerId");
    const playerName = localStorage.getItem("playerName");
    const { gameId } = useParams();


    const socket = useRef(null);

    useEffect(() => {
        // Socket setup

        socket.current = getSocket();

        const join = () => {
            console.log("Emitting joinGame...");
            socket.current.emit("joinGame", { gameId, playerId, playerName });
        };

        if (socket.current.connected) {
            // Already connected
            join();
        } else {
            // First-time connect
            socket.current.on("connect", join);
        }

        
        // Listen for events
        socket.current.on("gameState", (state) => {
            console.log("Playback received game state:", state);
            setRoomPlayerList(state.players);
            setSongs(state.songs);
            console.log("State songs:", state.songs);
            setCurrentSongIndex(state.currentSongIndex);

            if (state.phase === "finished") {
                navigate(`/leaderboard/${gameId}`);
            }
        });

        socket.current.on("playSong", ({ song, songIndex }) => {
            console.log("playSong event received with song:", song, "songIndex:", songIndex);
            setPlayerSong(song);
            setCurrentSongIndex(songIndex);
            setCurrentTime(song.position || 0);
            pendingSong.current = song;
            console.log("Playing song:", song); // this is right but display isnt
            console.log("Songs: ", songs);
            console.log("song.duration_ms:", song.duration_ms);
            latestState.current = { position: 0, duration: song.duration_ms || 0, paused: false };
            latestStateTime.current = Date.now();
            setDuration((song.duration_ms || 0) / 1000);
            if (!deviceId.current) {
                console.error("Device ID not ready yet");
                pendingSong.current = song;
            }
            else {
                playSong(song.track_uri, deviceId.current);
            }
        });
        socket.current.on("roundResult", ({ correct_player, scores }) => {
            setCorrectPlayer(correct_player);
            setScores(scores);
            // End the song
            endSong();
        });
        socket.current.on("roundFinished", ({ scores }) => {
            setScores(scores);
            // Maybe show some end of round screen here
            console.log("Round finished with scores:", scores);
            player.current?.pause(); 
        });

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
        if (player.current) return; 
        function initializePlayer()
        {
            const token = localStorage.getItem("access_token");

            player.current = new Spotify.Player({
                name: 'Tune-It Player',
                getOAuthToken: cb => cb(token),
                volume: 0.5
            });

            // Ready
            player.current.addListener('ready', async ({ device_id }) => {
                const token = localStorage.getItem("access_token");
                const id = await getDeviceId(device_id);
                deviceId.current = id;
                console.log('Ready with Device ID', id);

                // Switch to Tune-It Player
                let transferred = false;
                for (let i = 0; i < 5; i++) { // retry a few times in case Spotify isn't ready
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
                        transferred = true;
                        break;
                    }
                    console.warn(`Attempt ${i + 1} to transfer playback failed. Status: ${transferRes.status}`);
                    await new Promise(resolve => setTimeout(resolve, 1000)); // wait before retrying
                }

                if(pendingSong.current) {
                    console.log("Playing pending song:", pendingSong.current);
                    await playSong(pendingSong.current.track_uri, id);
                    pendingSong.current = null;
                }
            });

            // Not Ready
            player.current.addListener('not_ready', ({ device_id }) => {
                console.log('Device ID has gone offline', device_id);
                deviceId.current = null;
            });

            // Playback status updates
            player.current.addListener('player_state_changed', state => {
                if (!state) return;
                latestState.current = state;
                latestStateTime.current = Date.now();
                setDuration(state.duration / 1000); // convert ms to seconds
            });

                // Look at spotify api for error listeners
                player.current.connect();
        }
            
        if (window.Spotify) {
            console.log("SDK enabled");
            initializePlayer();
        } else {
            console.log("SDK disabled");
            window.onSpotifyWebPlaybackSDKReady = initializePlayer;
        }
        return () => { player.current?.disconnect(); }
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
                <img src={currentSong.image_url} alt="album art" className="album-art" />
                <h3>{currentSong.track_name}</h3>
                <p>{currentSong.track_artist}</p>
            </div>
        );
    }

    // Was having issues with Spotify not starting playback on the first song with Firefox
    // playSong will retry a few times to give Spotify some time
    async function playSong(uri, deviceId) {
        const token = localStorage.getItem("access_token");
        console.log("play body:", JSON.stringify({ uris: [uri], position_ms: 0 }));

        let response;
        for (let i = 0; i < 5; i++) { // retry a few times in case Spotify isn't ready
            response = await fetch(`https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`, {
                method: "PUT",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ uris: [uri], position_ms: 0  })
            });
            if (response.ok) {
                console.log("Successfully started playback");
                break;
            }
            console.warn(`Attempt ${i + 1} to start playback failed. Status: ${response.status}`);
            await new Promise(resolve => setTimeout(resolve, 1000)); // wait before retrying
        }

        const text = await response.text();
        console.log("playSong status:", response.status, "response:", text);

         // Seek to 0 explicitly after starting
         // Had issues with playback starting mid song 
        await new Promise(resolve => setTimeout(resolve, 50));
        await fetch(`https://api.spotify.com/v1/me/player/seek?position_ms=0&device_id=${deviceId}`, {
            method: "PUT",
            headers: { Authorization: `Bearer ${token}` }
        });

        await player.current.resume(); // ensure resume?

        // Issues with navigation bar ONLY on navigation
        // This bit of code waits until we can get the state
        // If we still can't get it, we force a state change by pausing and resuming playback

        // Wait for playback to start then seed state
        await new Promise(resolve => setTimeout(resolve, 800)); // sleep
        const state = await player.current?.getCurrentState();
        console.log("Current Spotify state after play:", state);
        if (state) {
            latestState.current = state;
            latestStateTime.current = Date.now();
            setDuration(state.duration / 1000);
        } else {
            // Force a state change event
            await player.current?.pause();
            await new Promise(resolve => setTimeout(resolve, 200));
            await player.current?.resume();
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

    return (
        <>
            <div className="playback-container">
                {localStorage.getItem("isHost") === "true" && (
                    <button id="togglePlay" onClick={() => handleTogglePlay()}>Play/Pause</button>
                )}
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

                { revealed && <h2>Correct Player: {roomPlayerList.find(player => player.player_id === correctPlayer)?.player_name}</h2>}
                { revealed && <div className="scores">
                    <h2>Scores:</h2>
                    {Object.entries(scores).map(([pid, score]) => (
                        <div key={pid}>
                            <span className="p-name">{roomPlayerList.find(player => player.player_id === pid)?.player_name}</span>
                            <span className="score">{score}</span>
                        </div>
                    ))}
                </div>}
            </div>
        </>
    );
}

export default Playback;