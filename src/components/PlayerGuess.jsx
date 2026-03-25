import "../css/PlayerGuess.css"
import { Check, X } from "lucide-react";

function PlayerGuess({name, disabled, isCorrect, onClick})
{
    function handleCorrectnessIcon(isCorrect) {
        if (isCorrect === true) {
            return <Check size={32} className="guess-marker" color="green" />;
        } else if (isCorrect === false) {
            return <X size={32} className="guess-marker" color="red" />;
        }
        return null;
    }

    return(
        <div className="player-guess-container">
            <button className="player-guess primary" onClick={onClick} 
            disabled={disabled} 
            style={{ opacity: disabled ? 0.5 : 1, cursor: disabled ? 'default' : 'pointer' }}>
                <h2>{name}</h2>
            </button>
            {handleCorrectnessIcon(isCorrect)}
        </div>
    );
}

export default PlayerGuess;