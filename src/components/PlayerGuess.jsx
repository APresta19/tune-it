import "../css/PlayerGuess.css"
import { Check, X } from "lucide-react";

function PlayerGuess({name, disabled, isCorrect, onClick})
{
    function handleCorrectnessIcon(isCorrect) {
        if (isCorrect === true) {
            return <Check size={16} color="green" />;
        } else if (isCorrect === false) {
            return <X size={16} color="red" />;
        }
        return null;
    }

    return(
        <div className="player-guess-container">
            <button className="player-guess" onClick={onClick} 
            disabled={disabled} 
            style={{ opacity: disabled ? 0.5 : 1, cursor: disabled ? 'default' : 'pointer' }}>
                <h2>{name}</h2>
            </button>
            {isCorrect && handleCorrectnessIcon(isCorrect)}
        </div>
    );
}

export default PlayerGuess;