import { useNavigate } from "react-router-dom";
import "../css/Landing.css";

function Landing() {
  const navigate = useNavigate();
  const token = localStorage.getItem("access_token");

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

  // Makem sure user is on Chrome
  const isChrome = /Chrome/.test(navigator.userAgent) && /Google Inc/.test(navigator.vendor);
  if (!isChrome) {
      alert("For the best experience as host, please use Chrome.");
  }

  return (
    <div className="landing-container">
      <div className="landing-card">
        <h1>Tune It</h1>
        <p className="tagline">
          A multiplayer music guessing game
        </p>

        <div className="button-group">
          <button onClick={() => window.location.href = `${import.meta.env.VITE_API_URL}/login`} id="spotify-login">Login with Spotify</button>
          <button onClick={handleCreateGame}>
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
