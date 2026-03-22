import { useEffect } from "react";
import { getSocket } from "../../backend/services/socket.js";
import "../css/Leaderboard.css";

function Leaderboard() 
{
    const socket = getSocket();

    useEffect(() => {
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
                <div className="leaderboard-item">
                    <div className="leaderboard-rank">1</div>
                    <div className="leaderboard-name">Player 1</div>
                    <div className="leaderboard-score">10</div>
                </div>
            </div>
        </div>
     );
}

export default Leaderboard;
