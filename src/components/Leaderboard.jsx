import { useEffect } from "react";
import { useLocation, useParams } from "react-router-dom";
import { getSocket } from "../../backend/services/socket.js";
import "../css/Leaderboard.css";

function Leaderboard() 
{
    const socket = getSocket();
    const { state } = useLocation();
    const { scores, players } = state;
    const { gameId } = useParams();

    useEffect(() => {
        console.log("State:", state);
        // Get game state
        socket.on("gameState", (gameState) => {

        });
        // Listen for roundFinished
        socket.on("roundFinished", (data) => {
            console.log("Round finished, updating leaderboard:", data);
        });

        // Cleanup on unmount
        return () => {
            socket.off("roundFinished");
        };
    }, []);

    return(
        <div className="leaderboard-container">
            <h1 className="leaderboard-title">Leaderboard</h1>
            <div className="leaderboard-list">
                {players.map((player, index) => (
                    <div key={player.player_id} className="leaderboard-item">
                        <div className="leaderboard-rank">{index + 1}</div>
                        <div className="leaderboard-name">{player.player_name}</div>
                        <div className="leaderboard-score">{scores[player.player_id] || 0}</div>
                    </div>
                ))}
            </div>
            {/* <button className="primary" onClick={handleNextRound}>Play Again</button> */}
            <button className="secondary" onClick={() => window.location.href = "/"}>Return to Home</button>
        </div>
     );
}

export default Leaderboard;
