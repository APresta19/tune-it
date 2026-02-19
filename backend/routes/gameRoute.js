import express from "express";
import { createSpotifyPlaylist, addSpotifySongToPlaylist } from "../services/spotifyService.js";
import pool from "../db/pool.js";

const router = express.Router();
/*
Lobby
    Players join
    Songs added
Start Game
Playback
    Shuffle, play song
    Player make guess
    Guess is revealed
    Scores updated
    (Next round?)
Leaderboard

maybe fix duplication later
*/

function createRoomCode(length = 6)
{
    const charList = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let code = "";
    for (let i = 0; i < length; i++)
    {
        code += charList[Math.floor(Math.random() * charList.length)]; 
    }
    return code;
}

router.post("/create", async (req, res) => {
    // Create a game --> marked as host

    const { hostName, gameName, gameDescription } = req.body;
    const token = req.access_token;

    if(!hostName) { 
        return res.status(400).send("No hostname provided.")
    }
    if(!gameDescription) {
        return res.status(400).send("No description provided.")
    }
    if(!token) {
        return res.status(400).send("No token provided.")
    }

    try 
    {
        // Create playlist
        const playlist = await createSpotifyPlaylist(token, gameName, gameDescription, false);

        // Save game to DB
        // We need to allow room codes to be tried until it works
        let roomCode;
        let result;
        while (true)
        {
            try {
                roomCode = createRoomCode();
                result = await pool.query(`INSERT INTO games(game_name, game_desc, playlist_id, room_code) 
                                   VALUES ($1, $2, $3, $4)
                                   RETURNING game_id, game_name, game_desc, playlist_id, created_at`, 
                                   [gameName, gameDescription, playlist.id, roomCode]);
                break;
            } catch (err) {
                if (err.code !== "23505") throw err; // unique DB constraint
            }
        }
        
        // Return response
        const game = result.rows[0]; // Creating one game at a time so we can just grab the first row

        // Insert host into game
        const playerQuery = await pool.query(`
            INSERT INTO players (player_name, game_id, is_host)
            VALUES ($1, $2, $3)
            RETURNING player_id, player_name, is_host
            `, [hostName, game.game_id, true]);

        console.log("Host: ", playerQuery.rows[0]);
        console.log("Game: ", game);
        res.status(201).json({game, host: playerQuery.rows[0]});

    } catch (err)
    {
        console.error("Cannot create game", err);
        res.status(500).send("Internal server error");
    }

});

router.post("/:gameId/join", async (req, res) => {
    // Validate data
    const { playerName } = req.body;
    const gameId = req.params.gameId;
    if (!playerName) { return res.status(400).send("No player name provided."); }

    try {
        // Insert player into players table
        const result = await pool.query(`INSERT INTO players (player_name, game_id)
                                         VALUES ($1, $2)
                                         RETURNING *`, [playerName, gameId]);
        // Retrieve player list with the given game id
        const playerList = await pool.query(`SELECT player_name FROM players
                                             WHERE game_id = $1`, [gameId]);
        console.log(playerName, " joined: ", result.rows[0])
        const playerNames = playerList.rows.map(player => player.player_name);
        res.status(201).json({ players: playerNames });
    } catch (err) {
        console.log("Cannot join game, ", err);
        res.status(500).send("Internal server error.");
    }
});

router.post("/:gameId/add-songs", async (req, res) => {
    const { gameId } = req.params;
    const { playerId, trackUris } = req.body;
    const token = req.access_token;

    if (!playerId || !trackUris || !Array.isArray(trackUris)) { return res.status(400).send("Missing playerId or trackUri"); }

    try {
        // Get playlist from game
        const gameQuery = await pool.query(`
            SELECT playlist_id FROM games
            WHERE game_id = $1 
            `, [gameId]);

        // Check if the game exists
        if(gameQuery.rows.length <= 0)
        {
            return res.status(404).send("Game not found");
        }
        const playlistId = gameQuery.rows[0].playlist_id;

        // Get the player with the given player id and game id
        const playerQuery = await pool.query(`
            SELECT player_id FROM players WHERE player_id = $1 AND game_id = $2
            `, [playerId, gameId]);
        
        // Check if player adding the song is in the game
        if(playerQuery.rows.length <= 0)
        {
            return res.status(403).send("Player is not in game");
        }

        // Insert tracks into DB
        await pool.query("BEGIN"); // these ensure all tracks are added (or not)
        for (const trackUri of trackUris)
        {
            await pool.query(`
                INSERT INTO songs (game_id, player_id, track_uri)
                VALUES ($1, $2, $3)
            `, [gameId, playerId, trackUri])
        }
        await pool.query("COMMIT");

        // Add song to spotify playlist
        console.log("Addings songs to Spotify Playlist: ", trackUris);
        await addSpotifySongToPlaylist(token, trackUris, playlistId);

        // Fire event to room
        const room = `game:${gameId}`;
        req.io.to(room).emit("songAdded", { playerId, trackUris })

        res.status(201).send("Song added");

    } catch(err) {
        await pool.query("ROLLBACK");
        console.error("Cannot add song: ", err);
        res.status(500).send("Internal server error.");
    }
});

router.get("/:gameId/songs/:playerId", async (req, res) => {
    const { gameId, playerId } = req.params;

    if (!gameId || !playerId) { 
        return res.status(400).send("Missing gameId or playerId");
    }

    try {
        const playerSongQuery = await pool.query(`
            SELECT players.player_id, players.player_name, songs.song_id, songs.track_uri
            FROM players LEFT JOIN songs USING (player_id)
            WHERE players.game_id = $1 AND players.player_id = $2
            `, [gameId, playerId]);
        if (playerSongQuery.rows.length === 0)
        {
            return res.status(403).send("Player songs cannot be found.");
        }

        const playerSongs = playerSongQuery.rows.map(row => ({
            songId: row.song_id,
            trackUri: row.track_uri
        }));

        res.status(200).json(playerSongs);
    } catch (err) {
        console.error("Player songs cannot be found: ", err);
        res.status(500).send("Internal server error");
    }
})

router.post("/:gameId/start", async (req, res) => {
    const { gameId } = req.params;

    try {
        const gameQuery = await pool.query(`SELECT * FROM games WHERE game_id = $1`, [gameId]);
        if (gameQuery.rows.length === 0) return res.status(404).send("Game not found");

        const playersQuery = await pool.query(`SELECT player_id FROM players WHERE game_id = $1`, [gameId]);
        if (playersQuery.rows.length === 0) return res.status(400).send("No players in the game");

        const songsQuery = await pool.query(`SELECT song_id FROM songs WHERE game_id = $1`, [gameId]);
        if (songsQuery.rows.length === 0) return res.status(400).send("No songs in the game");

        res.status(200).send("Game started");
    } catch (err) {
        console.error("Cannot start game:", err);
        res.status(500).send("Internal server error");
    }
});

router.get("/:gameId/state", async (req, res) => {
    const { gameId } = req.params;

    try {
        const gameObjQuery = await pool.query(`
            SELECT game_id, game_name, game_desc, playlist_id, room_code
            FROM games
            WHERE game_id = $1
            `, [gameId]);

        if(gameObjQuery.rows.length <= 0) { return res.status(404).send("Game cannot be found") }

        const playersListQuery = await pool.query(`
            SELECT player_id, player_name
            FROM players
            WHERE game_id = $1
            `, [gameId])
        
        const songsListQuery = await pool.query(`
            SELECT song_id, player_id, track_uri
            FROM songs
            WHERE game_id = $1
            `, [gameId]);
        
        const gameState = {
            game: gameObjQuery.rows[0],
            players: playersListQuery.rows,
            songs: songsListQuery.rows,
        }
        res.status(200).json(gameState)
    } catch (err)
    {
        console.error("Game state cannot be found: ", err);
        res.status(500).send("Internal server error");
    }

});

router.post("/join-by-code", async (req, res) => {
    const { roomCode, playerName } = req.body;

    if (!roomCode || !playerName) { return res.status(400).send("Missing roomCode or playerName"); }

    try {
        // Get gameId from DB
        const gameFromRoomQuery = await pool.query(`
            SELECT game_id FROM games WHERE room_code = $1
            `, [roomCode])
        if(gameFromRoomQuery.rows.length === 0) { return res.status(404).send("Cannot get gameId from room"); }

        const gameId = gameFromRoomQuery.rows[0].game_id;
        // Insert player into players table
        const result = await pool.query(`INSERT INTO players (player_name, game_id)
                                         VALUES ($1, $2)
                                         RETURNING *`, [playerName, gameId]);
        // Retrieve player list with the given game id
        const playerList = await pool.query(`SELECT player_name FROM players
                                             WHERE game_id = $1`, [gameId]);
        console.log(playerName, " joined: ", result.rows[0])
        const playerNames = playerList.rows.map(player => player.player_name);
        res.status(201).json({ gameId: gameId, playerId: result.rows[0].player_id, players: playerNames });
    } catch (err) {
        console.error("Error joining room by code.")
        res.status(500).send("Internal server error");
    }

});


export default router;
