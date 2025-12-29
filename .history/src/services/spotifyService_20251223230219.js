
async function createSpotifyPlaylist(token, name, description, isPublic)
{
    const { name, description, isPublic } = req.body;
  const token = req.access_token;

  if (!token) {
    return res.status(401).send("Unauthorized: No access token provided.");
  }

  try {
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
    console.log("Playlist created:", data);
    res.status(response.status).send({ playlistId: data.id, ...data });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
}

export default createSpotifyPlaylist;