import '../css/Song.css';

function Song({id, title, artist}) {
    return(
        <div className="song-container">
            <h2>{title}</h2>
            <p>Artist: {artist}</p>
        </div>
    );
}

export default Song;