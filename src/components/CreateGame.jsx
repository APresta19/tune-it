import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../css/CreateGame.css";

function CreateGame() {
  const [hostName, setHostName] = useState("");
  const [gameName, setGameName] = useState("");
  const [gameDescription, setGameDescription] = useState("");
  const [savePlaylist, setSavePlaylist] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pendingCreate, setPendingCreate] = useState(false);

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
      if (savedGame) {
        const parsed = JSON.parse(savedGame);
        setHostName(parsed.hostName);
        setGameName(parsed.gameName);
        setGameDescription(parsed.gameDescription);
        setSavePlaylist(parsed.savePlaylist);
        setPendingCreate(true);
        localStorage.removeItem("pending_game");
      }

      // Clean URL for token
      window.history.replaceState({}, document.title, "/create");
    }

  }, []);

  useEffect(() => {
      if (pendingCreate && hostName) {
          setPendingCreate(false);
          handleCreateGame();
      }
  }, [pendingCreate, hostName]);

  async function handleCreateGame() {
    const token = localStorage.getItem("access_token");

    console.log("Creating game with:", { hostName, gameName, gameDescription, savePlaylist, token });
    if (!hostName.trim()) {
      setError("Please enter your name");
      return;
    }

    if (!token) {
      const draft = { hostName, gameName, gameDescription, savePlaylist };
      localStorage.setItem("pending_game", JSON.stringify(draft));
      console.log(localStorage.getItem("pending_game"));
      sendToSpotifyLogin();
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/game/create`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ hostName, gameName, gameDescription, access_token: localStorage.getItem("access_token"), savePlaylist }),
        }
      );

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
      localStorage.setItem("playerName", hostName);
      localStorage.setItem("gameId", data.game.game_id);
      localStorage.setItem("isHost", "true");

      // Navigate to lobby page with gameId
      navigate(`/lobby/${data.game.game_id}`);
    } catch (err) {
      console.error(err);
      setError("Something went wrong creating the game");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="create-game-container">
      <div className="create-game-card">
        <h1>Tune-It</h1>
        <p>Create a new game</p>

        <input
          type="text"
          placeholder="Enter your name"
          value={hostName}
          onChange={(e) => setHostName(e.target.value)}
        />

        <input
          type="text"
          placeholder="Enter game name"
          value={gameName}
          onChange={(e) => setGameName(e.target.value)}
        />

        <input
          type="text"
          placeholder="Enter game description"
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
