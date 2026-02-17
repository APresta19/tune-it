import pool from '../db/pool.js'

export async function getGameState(gameId)
{
    const gameObjQuery = await pool.query(`
        SELECT game_id, game_name, game_desc, playlist_id, room_code
        FROM games
        WHERE game_id = $1
        `, [gameId]);

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

    return gameState;
}