import { useNavigate } from "react-router-dom";
import "../css/Lobby.css";
import { getSocket } from "../../backend/services/socket.js";

function Lobby() {
  const navigate = useNavigate();
  const socket = getSocket();

  // Handle socket events here
  socket.on("connect", () => {
    console.log("Connected to server with ID:", socket.id);
  });

  // Mock
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
        <button onClick={() => navigate("/")}>
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
