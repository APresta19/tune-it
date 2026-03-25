
function ProgressBar({currentTime, duration}) {
    const progressPercent = duration ? (currentTime / duration) * 100 : 0;

    return (
        <div className="progress-bar-container" style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--surface-hover)', borderRadius: '999px' }}>
            <div
                className="progress-bar-fill"
                style={{ width: `${progressPercent}%` }}
            ></div>
        </div>
    );
}

export default ProgressBar;