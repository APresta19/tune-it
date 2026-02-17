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
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);

    // Gamestate logic
    const [songs, setSongs] = useState([]);
    const [currentSongIndex, setCurrentSongIndex] = useState(0);
    const [roomPlayerList, setRoomPlayerList] = useState([]);
    const [guessedRoomPlayerList, setGuessedRoomPlayerList] = useState([]);
    const [playerSong, setPlayerSong] = useState(null);
    const [revealed, setRevealed] = useState(false);

    const [playlistId, setPlaylistId] = useState(null);

    const playerId = localStorage.getItem("playerId");
    const playerName = localStorage.getItem("playerName");
    const { gameId } = useParams();


    const socket = useRef(null);

    // Game Logic

    // mock
    // useEffect(() => {
    // setSongs([
    //     { trackId: "6zeeWid2sgw4lap2jV61PZ" },
    //     { trackId: "2L9N0zZnd37dwF0clgxMGI" }
    //     ]);
    // }, []);

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
            setCurrentSongIndex(state.currentSongIndex);
        });

        return () => { 
            socket.current.off("connect");
            socket.current.off("gameState"); 
        }
    }, []);



    function shufflePlaylist()
    {

    }

    function endRound()
    {
        // Update revealed state
        setRevealed(true);
    }

    function startNextRound()
    {
        setGuessedRoomPlayerList([]);
        setRevealed(false);
        setCurrentSongIndex(i => i + 1);

        // Play next song

        // Clear guesses
    }

    useEffect(() => {
        if (roomPlayerList.length > 0 && guessedRoomPlayerList.length === roomPlayerList.length)
        {
            // End the round
            endRound();
        }
    }, [guessedRoomPlayerList, roomPlayerList])

    // Initializes the Spotify Playback SDK
    useEffect(() => {
        function initializePlayer()
        {
            const token = localStorage.getItem("access_token");

            player.current = new Spotify.Player({
                name: 'Tune-It Player',
                getOAuthToken: cb => cb(token),
                volume: 0.5
            });

            // Ready
            player.current.addListener('ready', ({ device_id }) => {
                console.log('Ready with Device ID', device_id);
            });

            // Not Ready
            player.current.addListener('not_ready', ({ device_id }) => {
                console.log('Device ID has gone offline', device_id);
            });

            // Playback status updates
            player.current.addListener('player_state_changed', state => {
                if (!state) return;
                latestState.current = state;
                setCurrentTime(state.position / 1000); // convert ms to seconds
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
        function updatePlaybackSlider() {
            setCurrentTime(latestState.current ? latestState.current.position / 1000 : 0);
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

        // If everybody has guessed
    }

    return (
        <>
            <div className="playback-container">
                <button id="togglePlay" onClick={() => handleTogglePlay()}>Play/Pause</button>
                <h2>Now Playing</h2>
                <ProgressBar currentTime={currentTime} duration={duration} />
                <div className="guess-container">
                    <h2>Guess Who</h2>
                    {roomPlayerList.map(player => (
                        <PlayerGuess key={player.player_id} name={player.player_name} onClick={() => handleGuess(player.player_name)}/>
                    ))}
                </div>
                {revealed ? <h1 style={{ color: "green" }}>Revealed</h1> : <h1 style={{ color: "red" }}>Not Revealed</h1>}
            </div>
        </>
    );
}

export default Playback;