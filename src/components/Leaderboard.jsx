import { useEffect } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { getSocket } from "../../backend/services/socket.js";
import "../css/Leaderboard.css";

function Leaderboard() 
{
    const socket = getSocket();
    const navigate = useNavigate();
    const { state } = useLocation();
    const { scores = {}, players = [] } = state || {};
    const { gameId } = useParams();
    const rankedPlayers = [...players].sort((a, b) => {
        const scoreDiff = (scores[b.player_id] || 0) - (scores[a.player_id] || 0);
        if (scoreDiff !== 0) return scoreDiff;
        return a.player_name.localeCompare(b.player_name);
    });

    useEffect(() => {
        console.log("State:", state);
        // Get game state
        socket.on("gameState", (gameState) => {

        });
        // Listen for roundFinished
        socket.on("roundFinished", (data) => {
            console.log("Round finished, updating leaderboard:", data);
        });
        socket.on("playAgain", () => {
            navigate(`/lobby/${gameId}`);
        });

        // Cleanup on unmount
        return () => {
            socket.off("roundFinished");
            socket.off("playAgain");
        };
    }, []);

    function handlePlayAgain() {
        socket.emit("playAgain", {
            gameId,
            playerId: localStorage.getItem("playerId"),
        });
    }

    return(
        <div className="leaderboard-container">
            <h1 className="leaderboard-title">Leaderboard</h1>
            <div className="leaderboard-list">
                {rankedPlayers.map((player, index) => (
                    <div key={player.player_id} className="leaderboard-item">
                        <div className="leaderboard-rank">{index + 1}</div>
                        <div className="leaderboard-name">{player.player_name}</div>
                        <div className="leaderboard-score">{scores[player.player_id] || 0}</div>
                    </div>
                ))}
            </div>
            <div className="leaderboard-actions">
                <button className="primary" onClick={handlePlayAgain}>Play Again</button>
                <button className="secondary" onClick={() => window.location.href = "/"}>Return to Home</button>
            </div>
        </div>
     );
}

export default Leaderboard;
