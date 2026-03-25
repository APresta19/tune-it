import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import "../css/Landing.css";

function Landing() {
  const navigate = useNavigate();
  const token = localStorage.getItem("access_token");
  const API_URL = import.meta.env.VITE_API_URL;

  useEffect(() => {
    fetch(`${API_URL}/health`).catch(() => console.log("Server waking up..."));
  }, []);

  const handleCreateGame = () => {
    if (!token) {
      alert("Please log in with Spotify to create a game.");
      return;
    }
    navigate("/create");
  };

  return (
    <div className="landing-container">
      <div className="landing-card">
        <h1>Tune It</h1>
        <p className="tagline">
          A multiplayer music guessing game
        </p>

        <div className="button-group">
          <button onClick={handleCreateGame} className="tertiary">
            Create Game
          </button>

          <button
            className="tertiary"
            onClick={() => navigate("/join")}
          >
            Join Game
          </button>
        </div>
      </div>
    </div>
  );
}

export default Landing;
