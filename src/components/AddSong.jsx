import '../css/AddSong.css';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Song from './Song';

function AddSong() {
    const navigate = useNavigate();
    const [searchValue, setSearchValue] = useState("");
    const [songs, setSongs] = useState([]);
    const [selectedSongs, setSelectedSongs] = useState([]);
    const [isSearching, setIsSearching] = useState(false);

    const API_URL = import.meta.env.VITE_API_URL;
    const access_token = localStorage.getItem("access_token");

    async function fetchFromAPI(endpoint, method = "GET", body) {
        if(!access_token) {
            console.error("No access token found.");
            return;
        }
        
        const res = await fetch(`https://api.spotify.com/v1/${endpoint}`, {
            headers: {
                Authorization: `Bearer ${access_token}`,
            },
            method: method,
            body: body ? JSON.stringify(body) : null,
        })
        return await res.json();
    }

   const handleSearchChange = (e) => {
        const value = e.target.value;
        setSearchValue(value);

        if(value.trim() === "") {
            setIsSearching(false);
            setSongs([]);
            return;
        }

        setIsSearching(true);
        fetchSongs(value);
    };

    async function fetchSongs(query) {
        if (!query) return;
        
        const response = await fetchFromAPI(`search?q=${encodeURIComponent(query)}&type=track`);
        console.log(response);
        
        if(!response || !response.tracks) {
            console.error("Invalid response from Spotify API");
            setIsSearching(false);
            return;
        }

        const songList = response.tracks.items.map(item => ({
            id: item.id,
            title: item.name,
            artist: item.artists.map(artist => artist.name).join(", "),
        }));

        setSongs(songList);
        setIsSearching(true);
    }

    function handleSongClick(event) 
    {
        const songElement = event.currentTarget;

        // Get the title and artist (can also use querySelector)
        const title = songElement.dataset.title;
        const artist = songElement.dataset.artist;
        const id = songElement.dataset.id;

        const newSong = { id, title, artist };

        // Check if the song is already in the selectedSongs array and add
        if (!selectedSongs.some(song => song.id === id)) {
            setSelectedSongs([...selectedSongs, newSong]);
        }

        console.log("Selected songs: ", selectedSongs);
    }
    function handleSongRemove(event) {
        const buttonElement = event.currentTarget;
        const songElement = buttonElement.closest('.added-song');
        const id = songElement.dataset.id;

        const updatedSongs = selectedSongs.filter(song => song.id !== id);
        setSelectedSongs(updatedSongs);
    }

    async function handleDone() {
        if(selectedSongs.length != 3) {
            alert("Please select exactly 3 songs before proceeding.");
            return;
        }

        console.log("Final selected songs: ", selectedSongs);
        //navigate(`/playback?song_ids=${encodeURIComponent(songIds)}&access_token=${encodeURIComponent(access_token)}`);

        // Store selected songs in local storage
        //localStorage.setItem("selectedSongs", JSON.stringify(selectedSongs));

        // Backend call
        const response = await fetch(`${API_URL}/game/${localStorage.getItem("gameId")}/add-songs`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ 
                    playerId: localStorage.getItem("playerId"),
                    trackUris: selectedSongs.map(song => `spotify:track:${song.id}`),
                }),
            })

        if (!response.ok) {
            const errorData = await response.json();
            alert(errorData.message || "Failed to add songs. If you deleted the playlist, create a new game.");
            return;
        }

        const data = await response.json();
        console.log("Songs added successfully:", data);

        // Navigate to playback page
        const gameId = localStorage.getItem("gameId");

        // Instead of navigating do the socket stuff
        navigate(`/playback/${gameId}`);
    }

    return (
        <div className="add-container">
            <p>If no songs appear when searching, click this button.</p>
            <a href={`${API_URL}/login`}>
                <button>Login with Spotify</button>
            </a>

            <h1>Add Song</h1>
            <input id="add-search" type="text" placeholder="Song Title" value={searchValue} onChange={handleSearchChange}/>

            {songs.length > 0 && <div className="songs-list">
                {songs.map((song) => {
                    return <Song key={song.id}
                                 onClick={handleSongClick} 
                                 id={song.id}
                                 title={song.title}
                                 artist={song.artist}/>;
                })}
            </div>}
            <hr></hr>
            <div className="added-songs">
                <h2>Added Songs</h2>
                {selectedSongs.map((songDiv, index) => 
                    <div key={index} className="added-song" data-id={songDiv.id}>
                        <div id="added-song-left">
                            <h4>{songDiv.title}</h4>
                            <p>{songDiv.artist}</p>
                        </div>
                        <div id="added-song-right">
                            <button onClick={handleSongRemove}>Remove</button>
                        </div>
                    </div>)}
            </div>
            <button style={{fontSize: '16px', padding: '10px 50px'}} onClick={handleDone}>Done</button>
        </div>
    )
}

export default AddSong;