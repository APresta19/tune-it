import { useEffect, useRef, useState } from "react";
import "../css/Playback.css";
import ProgressBar from "./ProgressBar";
import PlayerGuess from "./PlayerGuess";

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

    // Game Logic

    // mock
    useEffect(() => {
    setSongs([
        { trackId: "6zeeWid2sgw4lap2jV61PZ" },
        { trackId: "2L9N0zZnd37dwF0clgxMGI" }
        ]);
    }, []);


    useEffect(() => {
        // Create playlist will be moved to when you create the game, but temporarily here
        async function createPlaylist()
        {
            // Get all user songs and add to songs list

            // Use api to create a playlist with the songs list
            const response = await fetch(`${import.meta.env.VITE_API_URL}/spotify/playlist/create`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    name: "Tune-It Playlist",
                    description: "Guess Who Added the Song",
                    public: false,
                })
            })
            const data = await response.json();
            console.log("Playlist created: ", data)

            // Update playlist id
            setPlaylistId(data.playlistId);
        }
        createPlaylist();
    }, [])

    useEffect(() => {
        async function addTracksToPlaylist() 
        {
            if (!playlistId || !songs || songs.length === 0) return;

            const response = await fetch(`${import.meta.env.VITE_API_URL}/spotify/playlist/${playlistId}/tracks`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({trackIds: songs.map(song => song.trackId)}),
            });

            const data = await response.json();
            console.log("Added songs: ", data);
        }
        addTracksToPlaylist();
    }, [playlistId, songs])
    

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
    }

    return (
        <>
            <div className="playback-container">
                <button id="togglePlay" onClick={() => handleTogglePlay()}>Play/Pause</button>
                <h2>Now Playing</h2>
                <ProgressBar currentTime={currentTime} duration={duration} />
                <div className="guess-container">
                    <h2>Guess Who</h2>
                    <PlayerGuess name="Player 1" onClick={() => handleGuess("Player 1")}/>
                    <PlayerGuess name="Player 2" onClick={() => handleGuess("Player 2")}/>
                    <PlayerGuess name="Player 3" onClick={() => handleGuess("Player 3")}/>
                </div>
                {revealed ? <h1 style={{ color: "green" }}>Revealed</h1> : <h1 style={{ color: "red" }}>Not Revealed</h1>}
            </div>
        </>
    );
}

export default Playback;