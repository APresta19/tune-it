import "../css/PlayerGuess.css"

function PlayerGuess({name, onClick})
{
    return(
        <button className="player-guess" onClick={onClick}>
            <h2>{name}</h2>
        </button>
    );
}

export default PlayerGuess;