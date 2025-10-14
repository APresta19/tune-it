import '../css/AddSong.css';
import { useState } from 'react';
import Song from './Song';

function AddSong() {
    const [searchValue, setSearchValue] = useState("");
    const [songs, setSongs] = useState([]);

    const API_URL = import.meta.env.VITE_API_URL;
    const params = new URLSearchParams(window.location.search);
    const access_token = params.get("access_token");

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
        fetchSongs(value);
    };

    async function fetchSongs(query) {
        if (!query) return;
        
        const response = await fetchFromAPI(`search?q=${encodeURIComponent(query)}&type=track`);
        console.log(response);
        
        if(!response || !response.tracks) {
            console.error("Invalid response from Spotify API");
            return;
        }

        const songList = response.tracks.items.map(item => ({
            id: item.id,
            title: item.name,
            artist: item.artists.map(artist => artist.name).join(", "),
        }));

        setSongs(songList);
        console.log(songList);
    }



    return (
        <div className="add-container">
            <a href={`${API_URL}/login`}>
                <button>Login with Spotify</button>
            </a>

            <h1>Add Song</h1>
            <input type="text" placeholder="Song Title" value={searchValue} onChange={handleSearchChange}/>

            <div className="songs-list">
                {songs.map((song) => {
                    return<Song className="song-container" key={song.id} title={song.title} artist={song.artist}/>
                })}
            </div>
        </div>
    )
}

export default AddSong;