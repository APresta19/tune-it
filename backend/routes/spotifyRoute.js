import express from "express";

const router = express.Router();

router.post("/playlist/create", async (req, res) => {
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
});
router.post("/playlist/:playlistId/tracks", async (req, res) => {
  const { trackIds } = req.body;
  const token = req.access_token;
  const playlistId = req.params.id;

  if (!token) {
    return res.status(401).send("Unauthorized: No access token provided.");
  }

  if (
    !playlistId ||
    !trackIds ||
    !Array.isArray(trackIds) ||
    trackIds.length === 0
  ) {
    return res.status(400).send("Invalid playlist ID or track IDs.");
  }

  try {
    const response = await fetch(
      `https://api.spotify.com/v1/playlists/${playlistId}/tracks`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          // Examples:
          // uris=spotify:track:4iV5W9uYEdYUVa79Axb7Rh
          // spotify:episode:512ojhOuo1ktJprKbVcKyQ
          uris: trackIds.map((id) => `spotify:track:${id}`),
        }),
      }
    );

    const text = await response.text();
    const data = text ? JSON.parse(text) : {};
    console.log("Songs added to playlist:", data);
    res.status(response.status).send(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
