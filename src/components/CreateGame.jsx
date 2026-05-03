import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../css/CreateGame.css";

function CreateGame() {
  const [songAmountToAdd, setSongAmountToAdd] = useState("");
  const [hostName, setHostName] = useState("");
  const [gameName, setGameName] = useState("");
  const [gameDescription, setGameDescription] = useState("");
  const [savePlaylist, setSavePlaylist] = useState(false);
  const [promptMode, setPromptMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const navigate = useNavigate();

  function sendToSpotifyLogin() {
    console.log("Redirecting to Spotify login...");
    window.location.href = `${import.meta.env.VITE_API_URL}/login`;
  }

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("access_token");

    if (token) {
      // Save token
      localStorage.setItem("access_token", token);
      console.log("Spotify token saved", token);

      const savedGame = localStorage.getItem("pending_game");
      console.log("Saved game:", savedGame);
      if (savedGame) {
        const parsed = JSON.parse(savedGame);
        setHostName(parsed.hostName);
        setGameName(parsed.gameName);
        setGameDescription(parsed.gameDescription);
        setSavePlaylist(parsed.savePlaylist);
        setPromptMode(parsed.promptMode);
        setSongAmountToAdd(parsed.songAmountToAdd);
        handleCreateGame({ ...parsed, token });
      }

      // Clean URL for token
      window.history.replaceState({}, document.title, "/create");
    }

  }, []);

  async function handleCreateGame(overrides = {}) {
    const token = overrides.token || localStorage.getItem("access_token");
    const name = overrides.hostName || hostName;
    const game = overrides.gameName || gameName;
    const desc = overrides.gameDescription || gameDescription;
    const songAmount = overrides.songAmountToAdd || songAmountToAdd;
    const save = overrides.savePlaylist ?? savePlaylist;
    console.log("Overrides in handleCreateGame:", overrides.promptMode);
    const promptMode = overrides.promptMode;

    console.log("overrides:", overrides);
    console.log("name:", name);
    console.log("token:", token);

    const amount = Number(songAmount);
    if (!amount || amount < 1 || amount > 10) {
      setError("Number of songs must be between 1 and 10");
      return;
    }

    if (!name.trim()) {
      setError("Please enter your name");
      return;
    }

    if (!token) {
      const draft = { hostName: name, gameName: game, gameDescription: desc, savePlaylist: save, promptMode, songAmountToAdd: amount };
      localStorage.setItem("pending_game", JSON.stringify(draft));
      console.log("Pending game saved:", localStorage.getItem("pending_game"));
      sendToSpotifyLogin();
      return;
    }

    setLoading(true);
    setError(null);

    try {
      let response;
      for (let attempt = 0; attempt < 3; attempt++) {
        response = await fetch(
          `${import.meta.env.VITE_API_URL}/game/create`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ hostName: name, gameName: game, 
                                   gameDescription: desc, access_token: token, 
                                   savePlaylist: save, promptMode, songAmountToAdd: songAmount }),
          }
        );

        if (response.ok || response.status === 401) break;
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      if (response.status === 401) {
        // Token is stale. Clear and re-auth
        localStorage.removeItem("access_token");
        sendToSpotifyLogin();
        return;
      }

      if (!response.ok) {
        throw new Error("Failed to create game");
      }

      const data = await response.json();

      // Add to local storage
      localStorage.setItem("playerId", data.host.player_id);
      localStorage.setItem("playerName", name);
      localStorage.setItem("gameId", data.game.game_id);
      localStorage.setItem("isHost", "true");
      localStorage.removeItem("pending_game");

      // Navigate to lobby page with gameId
      navigate(`/lobby/${data.game.game_id}`);
    } catch (err) {
      console.error(err);
      setError("Something went wrong creating the game");
    } finally {
      setLoading(false);
    }
  }

  function handleSongAmountChange(e) {
    let value = Number(e.target.value);
    setSongAmountToAdd(value);
  }

  return (
    <div className="create-game-container">
      <div className="create-game-card">
        <h1>Tune-It</h1>
        <p>Create a new game</p>

        <input
          type="number"
          min="1"
          max="10"
          pattern="\d+"
          placeholder="Number of songs"
          value={songAmountToAdd}
          onChange={(e) => handleSongAmountChange(e)}
        />

        <input
          type="text"
          placeholder="Name"
          value={hostName}
          onChange={(e) => setHostName(e.target.value)}
        />

        <input
          type="text"
          placeholder="Game name"
          value={gameName}
          onChange={(e) => setGameName(e.target.value)}
        />

        <input
          type="text"
          placeholder="Game description"
          value={gameDescription}
          onChange={(e) => setGameDescription(e.target.value)}
        />

        <label>
          <input 
              type="checkbox" 
              checked={savePlaylist} 
              onChange={e => setSavePlaylist(e.target.checked)} 
          />
          Save playlist after game
        </label>

        {error && <span className="error-text">{error}</span>}

        <button onClick={handleCreateGame} disabled={loading} className="primary">
          {loading ? "Creating..." : "Create Game"}
        </button>
      </div>
    </div>
  );
}

export default CreateGame;
