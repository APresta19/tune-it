import '../css/Song.css';

function Song({id, title, artist, onClick}) {
    return(
        <div className="song-container" onClick={onClick} data-id={id} data-title={title} data-artist={artist}>
            <h2>{title}</h2>
            <p>Artist: {artist}</p>
        </div>
    );
}

export default Song;