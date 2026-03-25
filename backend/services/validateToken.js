import { createSpotifyPlaylist } from "./spotifyService.js";

// Validates the spotify token
export async function validateToken(access_token, gameName, gameDescription, isPublic)
{
    let playlist;
    try {
        playlist = await createSpotifyPlaylist(access_token, gameName, gameDescription, isPublic);
    } catch (spotifyErr) {
        // Check if Spotify returned a 401
        if (spotifyErr.response && spotifyErr.response.status === 401) {
            console.error("Spotify Token Expired/Invalid");
            return res.status(401).json({ error: "Spotify session expired" });
        }
        throw spotifyErr;
    }
}