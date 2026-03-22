import '../css/Song.css';

function Song({id, title, artist, duration_ms, onClick}) {
    return(
        <div className="song-container" onClick={onClick} data-id={id} data-title={title} data-artist={artist} data-duration_ms={duration_ms}>
            <h2>{title}</h2>
            <p>Artist: {artist}</p>
        </div>
    );
}

export default Song;