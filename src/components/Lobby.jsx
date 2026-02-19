import { useNavigate, useParams } from "react-router-dom";
import "../css/Lobby.css";
import { getSocket } from "../../backend/services/socket.js";
import { use, useEffect, useState } from "react";

function Lobby() {
  const navigate = useNavigate();
  const socket = getSocket();
  const { gameId } = useParams();

  const [players, setPlayers] = useState([]);
  const [roomCode, setRoomCode] = useState(gameId);
  const [gameName, setGameName] = useState("");
  const [gameDescription, setGameDescription] = useState("");
  const [gameState, setGameState] = useState(null);

  // Handle socket events here
  socket.on("connect", () => {
    console.log("Connected to server with ID:", socket.id);
  });

  useEffect(() => {
    socket.on("gameState", handleGameState);

    return () => {
      socket.off("gameState", handleGameState);
    };
  }, []);

  function handleGameState(state) {
    console.log("Received game state:", state);
    setGameState(state);
  }

  function handleGameStart() {
    const playerId = localStorage.getItem("playerId");
    socket.emit("startGame", { gameId: gameId, playerId: playerId });
  }

  useEffect(() => {
    socket.on("gameStarted", () => {
      navigate(`/add-songs/${gameId}`);
    });

    return () => socket.off("gameStarted");
  }, []);



  useEffect(() => {
    // Fetch initial game state from backend
    async function fetchGameState() {
      try {
        const response = await fetch(
          `${import.meta.env.VITE_API_URL}/game/${gameId}/state`
        );
        if (!response.ok) {
          throw new Error("Failed to fetch game state");
        }
        const data = await response.json();
        setPlayers(data.players.map(player => player.player_name));
        setRoomCode(data.game.room_code);
        setGameName(data.game.game_name);
        setGameDescription(data.game.game_desc);
      } catch (err) {
        console.error(err);
      }
    }
    fetchGameState();
  }, [gameId]);

  useEffect(() => {
    // Join game via socket
    const playerName = localStorage.getItem("playerName");
    const playerId = localStorage.getItem("playerId");
    socket.emit("joinGame", { gameId: gameId, playerId: playerId, playerName: playerName });
  }, [gameId]);

  function handleLeaveLobby() {
    // Clear local storage
    socket.emit("leaveGame", { gameId: gameId, playerId: localStorage.getItem("playerId") });
    navigate("/");
  }

  return (
    <div className="lobby-container">
      <h1 className="lobby-title">Tune-It Lobby</h1>

      <h2>{gameName}</h2>
      <h4>{gameDescription}</h4>

      <div className="room-info">
        <span>Room Code:</span>
        <strong>{roomCode}</strong>
      </div>

      <div className="players-section">
        <h2>Players</h2>
        <ul className="player-list">
          {gameState?.players?.map((player) => (
            <li key={player.player_id}>{player.player_name}</li>
          ))}
        </ul>
      </div>

      <div className="lobby-actions">
        <button onClick={handleLeaveLobby}>
          Leave Lobby
        </button>
        <button onClick={() => handleGameStart()}>
          Start Game
        </button>
      </div>
    </div>
  );
}

export default Lobby;
