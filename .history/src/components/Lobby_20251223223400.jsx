import { useNavigate } from "react-router-dom";
import "../css/Lobby.css";

function Lobby() {
  const navigate = useNavigate();

  // Mock data for now (later comes from backend / socket)
  const players = ["Player 1", "Player 2", "Player 3"];
  const roomCode = "ABCD1234";

  return (
    <div className="lobby-container">
      <h1 className="lobby-title">Tune-It Lobby</h1>

      <div className="room-info">
        <span>Room Code:</span>
        <strong>{roomCode}</strong>
      </div>

      <div className="players-section">
        <h2>Players</h2>
        <ul className="player-list">
          {players.map((player, index) => (
            <li key={index}>{player}</li>
          ))}
        </ul>
      </div>

      <div className="lobby-actions">
        <button onClick={() => navigate("/create-game")}>
          Leave Lobby
        </button>
        <button onClick={() => navigate("/playback")}>
          Start Game
        </button>
      </div>
    </div>
  );
}

export default Lobby;
