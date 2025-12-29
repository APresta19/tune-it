import { useNavigate } from "react-router-dom";
import "../css/Landing.css";

function Landing() {
  const navigate = useNavigate();

  return (
    <div className="landing-container">
      <div className="landing-card">
        <h1>Tune-It</h1>
        <p className="tagline">
          A multiplayer music guessing game
        </p>

        <div className="button-group">
          <button onClick={() => navigate(`${import.meta.env.VITE_API_URL}/login`} id="spotify-login">Login with Spotify</button>
          <button onClick={() => navigate("/create")}>
            Create Game
          </button>

          <button
            className="secondary-button"
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
