
function ProgressBar({currentTime, duration}) {
    const progressPercent = duration ? (currentTime / duration) * 100 : 0;

    return (
        <div className="progress-bar-container">
            <div
                className="progress-bar-fill"
                style={{ width: `${progressPercent}%` }}
            ></div>
        </div>
    );
}

export default ProgressBar;