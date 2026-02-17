import "../css/JoinGame.css";
import { useNavigate } from "react-router-dom";
import { useState } from "react";

function JoinGame()
{
    const navigate = useNavigate();
    const [roomCode, setRoomCode] = useState("");
    const [playerName, setPlayerName] = useState("");
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);

    function handleRoomCodeChange(e)
    {
        setRoomCode(e.target.value.toUpperCase());
    }

    function handlePlayerNameChange(e)
    {
        setPlayerName(e.target.value);
    }

    async function handleJoin()
    {
        setLoading(true);
        setError(null);
        // Join Game
        try {
            // Call backend to join game
            const response = await fetch(`${import.meta.env.VITE_API_URL}/game/join-by-code`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ roomCode: roomCode, playerName: playerName }),
            });
            
            if(!response.ok) {
                throw new Error("Failed to join game");
            }
            const data = await response.json();
            console.log("Joined game:", data);

            // Add to local storage
            localStorage.setItem("playerId", data.playerId);
            localStorage.setItem("playerName", playerName);
            localStorage.setItem("gameId", data.gameId);

            navigate(`/lobby/${data.gameId}`);

        } catch (err) {
            console.error(err);
            setError("Failed to join game. Please check the game code or try another name.");
        } finally {
            setLoading(false);
        }
    }

    return(
        <div className="join-container">
            <div className="join-form">
                <h1>Join Game</h1>
                <input type="text" placeholder="Enter your name" onChange={handlePlayerNameChange}/>
                <input type="text" placeholder="Enter game code" onChange={handleRoomCodeChange}/>
                {error && <span className="error-text">{error}</span>}
                <button onClick={handleJoin} disabled={loading}>
                    {loading ? "Joining" : "Join Game"}
                </button>
            </div>
        </div>
    );
}

export default JoinGame;