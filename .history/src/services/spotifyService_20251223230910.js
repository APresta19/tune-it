
async function createSpotifyPlaylist(token, name, description, isPublic) {
  if (!token) {
    return new Error("No access token provided");
  }

  const response = await fetch("https://api.spotify.com/v1/me/playlists", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: name || "New Playlist",
        description: description || "Playlist created via Tune It app",
        public: isPublic ?? false, // goes to the default only when null or undefined (not 0 or "")
      }),
    });

    const text = await response.text();
    const data = text ? JSON.parse(text) : {};

    if(!response.ok)
    {
        
    }

    console.log("Playlist created:", data);
    return data;
  
}

export default createSpotifyPlaylist;
