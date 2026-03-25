import express from "express";
import querystring from "querystring";
import cors from "cors";
import dotenv from "dotenv";
import fetch from "node-fetch";
import http from "http";
import pool from "./db/pool.js";
import { Server } from "socket.io";
import userRoute from "./routes/userRoute.js";
import spotifyRoute from "./routes/spotifyRoute.js";
import gameRoute from "./routes/gameRoute.js";
import { getGameState } from "./services/gameState.js";
import { PHASES, getOrCreateGame, getGame, deleteGame, getAllGames } from "./services/liveGames.js";
import { resumeToPipeableStream } from "react-dom/server";

// Load env
dotenv.config();

const app = express();
const client_id = process.env.SPOTIFY_CLIENT_ID;
const redirect_uri = process.env.SPOTIFY_REDIRECT_URI;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

app.use((req, res, next) => {
  // Attach io to routes
  req.io = io;
  next();
});

// The DB CANNOT handle live games
// So, we can create a memory object to make sure socket connection is good
io.on("connection", (socket) => {
  console.log("Connected user: ", socket.id);

  socket.on("joinGame", async ({ gameId, playerId, playerName }) => { 
    const gameMemory = getOrCreateGame(gameId);
    console.log(gameMemory);
    console.log("joinGame event fired.")
    console.log("gameId:", gameId);
    console.log("playerId:", playerId);

    if (!gameId || !playerId) {
      socket.emit("error", "Missing gameId or playerId");
      return;
    }

    // Verify player again
    const playerQuery = await pool.query(
      `
      SELECT player_id, player_name
      FROM players
      WHERE player_id = $1 AND game_id = $2
    `,
      [playerId, gameId],
    );

    if (playerQuery.rows.length === 0) {
      socket.emit("error", "Invalid player");
      return;
    }

    if (gameMemory.phase !== PHASES.LOBBY && !gameMemory.players[playerId]) {
      socket.emit("error", "Game already started");
      return;
    }

    gameMemory.players[playerId] = {
      socketId: socket.id,
      playerId,
      songsAdded: {},
      createdAt: Date.now()
    };

    const game = await getGameState(gameId);

    // Store metadata
    socket.gameId = gameId;
    socket.playerId = playerId;

    gameMemory.scores[playerId] = 0;

    socket.join(`game:${gameId}`);
    io.to(`game:${gameId}`).emit("gameState", game); // send to everyone (instead of socket.to)

    if (gameMemory.phase === PHASES.PLAYING) {
      console.log("Current song: ", gameMemory.currentSong);
      socket.emit("playSong", { 
        song: gameMemory.currentSong, 
        songIndex: gameMemory.currentSongIndex 
      });
    }
  });

  socket.on("startGame", async ({ gameId, playerId }) => {
    const gameMemory = getOrCreateGame(gameId);
    
    gameMemory.phase = PHASES.SELECTING;
    io.to(`game:${gameId}`).emit("gameStarted");

    const game = await getGameState(gameId);
    console.log("Game state: ", game);
    io.to(`game:${gameId}`).emit("gameState", {...game, phase: PHASES.SELECTING});
  });

  socket.on("submitSongs", async ({ gameId, playerId }) => {
    const gameMemory = getOrCreateGame(gameId);
    console.log("Player ", playerId, " is trying to start game: ", gameId);

    if (!gameMemory)
    { 
      console.log("No game memory obj.");
      return; 
    }

    // Get all songs per player
    const result = await pool.query(`
      SELECT player_id, COUNT(*) AS song_count
      FROM songs
      WHERE game_id = $1
      GROUP BY player_id
    `, [gameId]);

    console.log("Result: ", result.rows);
    for (const pid in gameMemory.players)
    {
      console.log("Result rows: ", result.rows);
      const playerSongs = result.rows.find(row => row.player_id == pid);
      console.log(pid, " id songs: ", playerSongs);
      if(!playerSongs || Number(playerSongs.song_count) !== gameMemory.songAmountToAdd)
      {
        console.log("A player doesn't have enough songs.")
        socket.emit("error", "A player doesn't have enough songs.")
        return;
      }
    }

    // Set the queue
    const queueQuery = await pool.query(`
      SELECT song_id, player_id, track_uri, track_name, track_artist, duration_ms, image_url
      FROM songs
      WHERE game_id = $1
      `, [gameId]);

    // Set the live object attributes
    gameMemory.queue = shuffleArray(queueQuery.rows);
    gameMemory.phase = PHASES.PLAYING;

    // just make sure
    gameMemory.currentSongIndex = 0;
    gameMemory.currentRound = 0;

    const curSong = gameMemory.queue[gameMemory.currentSongIndex];
    gameMemory.currentSong = curSong;
    gameMemory.correctPlayer = curSong.player_id;

    const game = await getGameState(gameId);
    console.log("Game state after submission: ", game);
    io.to(`game:${gameId}`).emit("gameState", game);

    const room = io.sockets.adapter.rooms.get(`game:${gameId}`);
    console.log("Room members:", room);
    io.to(`game:${gameId}`).emit("playSong", { gameId, song: gameMemory.currentSong, songIndex: gameMemory.currentSongIndex });
  });

  socket.on("submitGuess", async ({ gameId, playerId, guessedPlayerId }) => {
    const gameMemory = getOrCreateGame(gameId);

    if (!gameMemory.players[playerId]) {
      socket.emit("error", "Player doesn't exist.");
      return;
    }
    
    // Store guess
    gameMemory.who_guessed.push(playerId);

    console.log("submitGuess received. who_guessed:", gameMemory.who_guessed.length, "players:", Object.keys(gameMemory.players).length);

    // Check if all players guessed
      // calc scores
      // reveal correct player through emission
      // emit roundResult --> { who_guessed, correct_player, scores }
      // wait 3 seconds
      // nextSong()
    // Calculate scores
    const isRight = guessedPlayerId === gameMemory.correctPlayer;
    gameMemory.scores[playerId] = isRight ? gameMemory.scores[playerId] + 1 : gameMemory.scores[playerId];
    console.log("Score: ", gameMemory.scores[playerId]);
    if (gameMemory.who_guessed.length >= Object.keys(gameMemory.players).length)
    {
      console.log("roundResult triggered");
      io.to(`game:${gameId}`).emit("roundResult", { 
        correct_player: gameMemory.correctPlayer,
        scores: gameMemory.scores
      })
      setTimeout(() => nextSong(gameId), 3000);
    }
  });

  socket.on("leaveGame", async ({ gameId, playerId }) => {
    const gameMemory = getOrCreateGame(gameId);
    console.log("Socket connected?", socket.connected);
    console.log("Socket ID:", socket.id);
    console.log("Rooms before leaving:", socket.rooms);
    
    console.log(playerId, " is leaving the game.");
    if (!gameMemory || !gameMemory.players[playerId])
    {
      socket.emit("error", "Player is not in game.");
      return;
    }

    // If player is host, force everyone to leave

    await pool.query(`DELETE FROM players WHERE player_id = $1`, [playerId]);

    deleteGame(gameId);

    socket.leave(`game:${gameId}`);

    console.log("Rooms after leaving:", socket.rooms);
    console.log("Live game players after delete:", gameMemory.players);

    const game = await getGameState(gameId);
    io.to(`game:${gameId}`).emit("gameState", game);
  });

  socket.on("disconnect", async () => {
    console.log("Socket disconnected.");

    const { gameId, playerId } = socket;
    const allGames = getAllGames();

    if (!gameId || !playerId)
    {
      console.error("Missing gameId or playerId");
      return;
    }

    const playlistQuery = await pool.query(`SELECT playlist_id FROM games WHERE game_id = $1`, [gameId]);
    const playlistId = playlistQuery.rows[0]?.playlist_id;
    const token = hostTokens[gameId]?.access_token;

    // Delete or save spotify playlist
    const gameMemory = getOrCreateGame(gameId);
    console.log("Save? ", gameMemory.savePlaylist);
     if (token && playlistId && !gameMemory.savePlaylist) {
        // delete the Spotify playlist
        const token = hostTokens[gameId]?.access_token;
        await fetch(`https://api.spotify.com/v1/playlists/${playlistId}/followers`, {
            method: "DELETE",
            headers: { Authorization: `Bearer ${token}` }
        });
    }

    // Delete the songs
    await pool.query(`DELETE FROM songs WHERE player_id = $1`, [playerId]);
    // Delete the players
    await pool.query(`DELETE FROM players WHERE player_id = $1`, [playerId]);
    delete allGames[gameId].players[playerId];

    // Update game state
    const gameState = await getGameState(gameId);
    io.to(`game:${gameId}`).emit("gameState", gameState);

    // Remove empty games from memory
    if (Object.keys(allGames[gameId].players).length === 0) { // Objects in JS dont have a length but arrays do
      delete allGames[gameId];
    }
    console.log("Disconnected user: ", socket.id);
  });
});

function nextSong(gameId)
{
  const gameMemory = getOrCreateGame(gameId);
  console.log("Switching to next song.");
  gameMemory.who_guessed = [];

  // Update current song index
  gameMemory.currentSongIndex++;
  const nextSong = gameMemory.queue[gameMemory.currentSongIndex];

  // If last song --> roundOver
  // If not --> playSong(nextSong, nextSongIndex)
  if(!nextSong)
  {
    console.log("No next song.");
    gameMemory.phase = PHASES.FINISHED;
    io.to(`game:${gameId}`).emit("roundFinished", { scores: gameMemory.scores });
    // Updates total_points in DB
    return;
  }
  else
  {
    gameMemory.currentSong = nextSong;
    gameMemory.correctPlayer = nextSong.player_id;
    io.to(`game:${gameId}`).emit("playSong", { 
      song: nextSong,
      currentSongIndex: gameMemory.currentSongIndex
    });
  }
}

// Fisher-Yates shuffle
function shuffleArray(arr)
{
  let currentIndex = arr.length;
  while(currentIndex != 0)
  {
    currentIndex--;
    const randomIndex = Math.floor(Math.random() * (currentIndex+1));

    // Swap
    [arr[currentIndex], arr[randomIndex]] = [arr[randomIndex], arr[currentIndex]]
  }
  return arr;
}

const hostTokens = {};
let access_token = null;
app.get("/callback", async (req, res) => {
  const code = req.query.code || null;

  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code: code,
    redirect_uri: redirect_uri,
    client_id: client_id,
    client_secret: process.env.SPOTIFY_CLIENT_SECRET,
  });

  const response = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: body.toString(),
  });

  const data = await response.json();
  console.log("Tokens received:", data);
  access_token = data.access_token;
  if (!access_token) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  // Redirect to frontend with access token
  const FRONTEND_URL = process.env.VITE_FRONTEND_URL;
  res.redirect(`${FRONTEND_URL}/create?access_token=${data.access_token}`);
});

app.get("/login", (req, res) => {
  const state = Math.random().toString(36).substring(2, 15);
  const scope = [
    "user-read-email",
    "user-read-private",
    "playlist-modify-public",
    "playlist-modify-private",
    "streaming",
    "user-modify-playback-state",
    "user-read-playback-state",
  ].join(" ");

  console.log("Redirecting to Spotify for authentication...");
  console.log({ state, scope });
  console.log({ client_id, redirect_uri });
  res.redirect(
    "https://accounts.spotify.com/authorize?" +
      querystring.stringify({
        response_type: "code",
        client_id: client_id,
        scope: scope,
        redirect_uri: redirect_uri,
        state: state,
      }),
  );
});

app.use(
  "/users",
  (req, res, next) => {
    req.hostTokens = hostTokens;
    next();
  },
  userRoute,
);

app.use(
  "/spotify",
  (req, res, next) => {
    req.hostTokens = hostTokens;
    next();
  },
  spotifyRoute,
);

app.use(
  "/game",
  (req, res, next) => {
    req.hostTokens = hostTokens;
    next();
  },
  gameRoute,
);

app.get("/health", (req, res) => res.send("ok"));

server.listen(process.env.PORT || 3001, () => {
  console.log(`HTTP + Socket.io server running on localhost:${process.env.PORT || 3001}`);
});
