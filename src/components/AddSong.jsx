import "../css/AddSong.css";
import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { getSocket } from "../../backend/services/socket.js";
import { useNavigate } from "react-router-dom";
import Song from "./Song";

function AddSong() {
  const navigate = useNavigate();
  const [searchValue, setSearchValue] = useState("");
  const [songs, setSongs] = useState([]);
  const [selectedSongs, setSelectedSongs] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState(null);

  const API_URL = import.meta.env.VITE_API_URL;
  const access_token = localStorage.getItem("access_token");
  const { gameId } = useParams();
  const socket = getSocket();

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchValue(value);

    if (value.trim() === "") {
      setIsSearching(false);
      setSongs([]);
      return;
    }

    setIsSearching(true);
    fetchSongs(value);
  };

  async function fetchSongs(query) {
    if (!query) return;

    const response = await fetch(
      `${API_URL}/spotify/search?q=${encodeURIComponent(query)}&gameId=${gameId}`,
    );
    console.log(response);

    const data = await response.json();

    if (!data || !data.tracks) {
      console.error("Invalid response from Spotify API");
      setIsSearching(false);
      return;
    }

    const songList = data.tracks.items.map((item) => ({
      id: item.id,
      title: item.name,
      artist: item.artists.map((artist) => artist.name).join(", "),
      duration_ms: item.duration_ms,
      image_url: item.album.images.length > 0 ? item.album.images[0].url : null,
    }));

    setSongs(songList);
    setIsSearching(true);
  }

  function handleSongClick(event) {
    const songElement = event.currentTarget;

    // Get the title and artist (can also use querySelector)
    const title = songElement.dataset.title;
    const artist = songElement.dataset.artist;
    const id = songElement.dataset.id;
    const duration_ms = songElement.dataset.duration_ms;
    const image_url = songElement.dataset.image_url;
    const newSong = { id, title, artist, duration_ms, image_url };

    // Check if the song is already in the selectedSongs array and add
    if (!selectedSongs.some((song) => song.id === id)) {
      setSelectedSongs([...selectedSongs, newSong]);
    }

    console.log("Selected songs: ", selectedSongs);
  }
  function handleSongRemove(event) {
    const buttonElement = event.currentTarget;
    const songElement = buttonElement.closest(".added-song");
    const id = songElement.dataset.id;

    const updatedSongs = selectedSongs.filter((song) => song.id !== id);
    setSelectedSongs(updatedSongs);
  }

  async function handleDone() {
    if (selectedSongs.length != 3) {
      setError("Please select exactly 3 songs before proceeding.");
      return;
    }

    console.log("Final selected songs: ", selectedSongs);
    //navigate(`/playback?song_ids=${encodeURIComponent(songIds)}&access_token=${encodeURIComponent(access_token)}`);

    // Store selected songs in local storage
    //localStorage.setItem("selectedSongs", JSON.stringify(selectedSongs));

    // Backend call
    const response = await fetch(`${API_URL}/game/${gameId}/add-songs`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        playerId: localStorage.getItem("playerId"),
        tracks: selectedSongs.map((song) => ({
          uri: `spotify:track:${song.id}`,
          title: song.title,
          artist: song.artist,
          duration_ms: song.duration_ms,
          image_url: song.image_url,
        })),
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      alert(
        errorData.message ||
          "Failed to add songs. If you deleted the playlist, create a new game.",
      );
      return;
    }

    const data = await response.text();
    console.log("Songs added successfully:", data);

    setError("Waiting for other players to add songs...");

    // Instead of navigating do the socket stuff
    //navigate(`/playback/${gameId}`);
    socket.emit("submitSongs", {
      gameId: gameId,
      playerId: localStorage.getItem("playerId"),
    });
  }

  useEffect(() => {
    socket.on("gameState", (state) => {
        if (state.phase === "playing") {
        navigate(`/playback/${gameId}`);
        }
    });

    return () => socket.off("gameState");
  }, []);

  return (
    <div className="add-container">
      <p>If no songs appear when searching, click this button.</p>
      <a href={`${API_URL}/login`}>
        <button>Login with Spotify</button>
      </a>

      <h1>Add Song</h1>
      <input
        id="add-search"
        type="text"
        placeholder="Song Title"
        value={searchValue}
        onChange={handleSearchChange}
      />

      {songs.length > 0 && (
        <div className="songs-list">
          {songs.map((song) => {
            return (
              <Song
                key={song.id}
                onClick={handleSongClick}
                id={song.id}
                title={song.title}
                artist={song.artist}
                duration_ms={song.duration_ms}
                image_url={song.image_url}
              />
            );
          })}
        </div>
      )}
      <hr></hr>
      <div className="added-songs">
        <h2>Added Songs</h2>
        {selectedSongs.map((songDiv, index) => (
          <div key={index} className="added-song" data-id={songDiv.id}>
            <div id="added-song-left">
              <h4>{songDiv.title}</h4>
              <p>{songDiv.artist}</p>
            </div>
            <div id="added-song-right">
              <button onClick={handleSongRemove}>Remove</button>
            </div>
          </div>
        ))}
      </div>
      <button
        style={{ fontSize: "16px", padding: "10px 50px" }}
        onClick={handleDone}
      >
        Done
      </button>
      {error && <p className="error-message">{error}</p>}
    </div>
  );
}

export default AddSong;
