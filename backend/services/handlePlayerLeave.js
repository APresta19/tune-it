import { deleteGame, getAllGames } from "./liveGames.js";
import pool from "../db/pool.js";
import { getGameState } from "./gameState.js";

async function handlePlayerLeave(io, hostTokens, playerId, gameId)
{
    const allGames = getAllGames();

    // Delete the songs
    await pool.query(`DELETE FROM songs WHERE player_id = $1 AND game_id = $2`, [playerId, gameId]);

    // Delete the players
    await pool.query(`DELETE FROM players WHERE player_id = $1`, [playerId]);
    delete allGames[gameId].players[playerId];

    // No players
    if (Object.keys(allGames[gameId].players).length === 0)
    {
        console.log("No players left. Destroying game.");
        await pool.query(`DELETE FROM games WHERE game_id = $1`, [gameId]);
        delete hostTokens[gameId]
        deleteGame(gameId);
    }

    // Update game state
    const gameState = await getGameState(gameId);
    io.to(`game:${gameId}`).emit("gameState", gameState);
}

export { handlePlayerLeave };