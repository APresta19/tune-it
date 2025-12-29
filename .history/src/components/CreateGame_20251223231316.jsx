import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../css/CreateGame.css";

function CreateGame() {
  const [hostName, setHostName] = useState("");
  const [gameName, setHosName] = useState("");
  const [hostName, setHostName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const navigate = useNavigate();

  async function handleCreateGame() {
    if (!hostName.trim()) {
      setError("Please enter your name");
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
          body: JSON.stringify({ hostName }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to create game");
      }

      const data = await response.json();

      // Navigate to lobby page with gameId
      navigate(`/lobby/${data.gameId}`);
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

        {error && <span className="error-text">{error}</span>}

        <button onClick={handleCreateGame} disabled={loading}>
          {loading ? "Creating..." : "Create Game"}
        </button>
      </div>
    </div>
  );
}

export default CreateGame;
