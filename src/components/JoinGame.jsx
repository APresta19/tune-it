import "../css/JoinGame.css";

function JoinGame()
{
    return(
        <div className="join-container">
            <div className="join-form">
                <h1>Join Game</h1>
                <input type="text" placeholder="Enter your name" />
                <input type="text" placeholder="Enter game code" />
                <button>Join Game</button>
            </div>
        </div>
    );
}

export default JoinGame;