import '../css/Song.css';

function Song({id, title, artist, duration_ms, image_url, onClick}) {
    return(
        <div className="song-container" onClick={onClick} data-id={id} data-title={title} data-artist={artist} data-duration_ms={duration_ms} data-image_url={image_url}>
            <div>
                {image_url && <img src={image_url} alt={title} className="song-image" />}
            </div>
            <div>
                <h2>{title}</h2>
                <p>Artist: {artist}</p>
            </div>
        </div>
    );
}

export default Song;