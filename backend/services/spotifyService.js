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

export async function clearSpotifyPlaylist(token, playlist_id) {
  if (!token) {
    const error = new Error("No access token provided");
    error.status = 401;
    throw error;
  }

  const tracks = [];
  let nextUrl = `https://api.spotify.com/v1/playlists/${playlist_id}/tracks?fields=items(track(uri)),next&limit=100`;

  while (nextUrl) {
    const response = await fetch(nextUrl, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const text = await response.text();
    const data = text ? JSON.parse(text) : {};

    if (!response.ok) {
      const error = new Error(data.error?.message || "Spotify playlist fetch failed");
      error.status = response.status;
      throw error;
    }

    tracks.push(...data.items
          .map((item) => item.track?.uri)
          .filter(Boolean)
    );
    nextUrl = data.next;
  }

  for (let i = 0; i < tracks.length; i += 100) {
    const uris = tracks.slice(i, i + 100);
    const response = await fetch(`https://api.spotify.com/v1/playlists/${playlist_id}/tracks`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        tracks: uris.map((uri) => ({ uri }))
      })
    });

    const text = await response.text();
    const data = text ? JSON.parse(text) : {};

    if (!response.ok) {
      const error = new Error(data.error?.message || "Spotify playlist clearing failed");
      error.status = response.status;
      throw error;
    }
  }

  console.log("Playlist cleared:", playlist_id);
  return { removed: tracks.length };
}

export async function getAudioAnalysis(track_id)
{
  try {
    const token = localStorage.getItem("access_token");
    const response = await fetch(`https://api.spotify.com/v1/audio-analysis/${track_id}`, {
         headers: { Authorization: `Bearer ${token}` }
    });
    const data = await response.json();
    console.log(data);
    console.log("status: ", response.status);
    return data;
  } catch (err)
  {
    console.error("Cannot get audio analysis.", err);
  }  
}
