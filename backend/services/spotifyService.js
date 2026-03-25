export async function createSpotifyPlaylist(token, gameName, description, isPublic) {
  if (!token) {
    const error = new Error("No access token provided");
    error.status = 401; // ensure error is 401, since that's what we are expecting
    throw error;
  }

  console.log("Token status2: ", token);
  const response = await fetch("https://api.spotify.com/v1/me/playlists", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name: gameName || "New Playlist",
      description: description || "Playlist created via Tune It app",
      public: isPublic ?? false, // goes to the default only when null or undefined (not 0 or "")
    }),
  });

  const text = await response.text();
  const data = text ? JSON.parse(text) : {};

  if (!response.ok) {
    const err = new Error(data.error?.message || "Spotify playlist creation failed");
    err.status = response.status;
    throw err;
  }

  console.log("Playlist created:", data);
  return data;
}

export async function addSpotifySongToPlaylist(token, uri_list, playlist_id) {
  const response = await fetch(`https://api.spotify.com/v1/playlists/${playlist_id}/tracks`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      uris: uri_list || []
    })
  })

  const text = await response.text();
  const data = text ? JSON.parse(text) : {};

  if (!response.ok) {
    throw new Error(data.error?.message || "Spotify track adding failed");
  }

  console.log("Track added:", data);
  return data;
}