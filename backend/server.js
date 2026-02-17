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

const PHASES = {
  LOBBY: "lobby",
  PLAYING: "playing",
  SCORING: "scoring",
  FINISHED: "finished",
};

// The DB CANNOT handle live games
// So, we can create a memory object to make sure socket connection is good
const liveGames = {};
io.on("connection", (socket) => {
  console.log("Connected user: ", socket.id);

  socket.on("joinGame", async ({ gameId, playerId, playerName }) => { 
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

    if (!liveGames[gameId]) {
      liveGames[gameId] = { 
                            phase: PHASES.LOBBY,
                            players: {},
                            createdAt: Date.now() 
                          };
    }

    if (liveGames[gameId].phase !== PHASES.LOBBY && !liveGames[gameId].players[playerId]) {
      socket.emit("error", "Game already started");
      return;
    }


    // Sockets only need the ids
    liveGames[gameId].players[playerId] = {
      socketId: socket.id,
      playerId,
      createdAt: Date.now()
    };

    const game = await getGameState(gameId);

    socket.join(`game:${gameId}`);
    io.to(`game:${gameId}`).emit("gameState", game); // send to everyone (instead of socket.to)
  });

  socket.on("startGame", async ({ gameId }) => {
    console.log("Starting game: ", gameId);

    if (!liveGames[gameId]) { return; }

    liveGames[gameId].phase = PHASES.PLAYING;

    const game = await getGameState(gameId);
    io.to(`game:${gameId}`).emit("gameState", {...game, phase: PHASES.PLAYING});
  });

  socket.on("leaveGame", async ({ gameId, playerId }) => {
    console.log("Socket connected?", socket.connected);
    console.log("Socket ID:", socket.id);
    console.log("Rooms before leaving:", socket.rooms);
    
    console.log(playerId, " is leaving the game.");
    if (!liveGames[gameId] || !liveGames[gameId].players[playerId])
    {
      socket.emit("error", "Player is not in game.");
      return;
    }

    await pool.query(`DELETE FROM players WHERE player_id = $1`, [playerId]);

    delete liveGames[gameId].players[playerId];

    socket.leave(`game:${gameId}`);

    console.log("Rooms after leaving:", socket.rooms);
    console.log("Live game players after delete:", liveGames[gameId].players);

    const game = await getGameState(gameId);
    io.to(`game:${gameId}`).emit("gameState", game);
  });

  socket.on("disconnect", async () => {
    console.log("Socket disconnected.");
    // Disconnect is global so we need to loop through all players and disconnect the one with the same socket id
    for (const gameId in liveGames)
    {
      const game = liveGames[gameId];
      for (const playerId in game.players)
      {
        if (game.players[playerId].socketId === socket.id)
        {
          await pool.query(`DELETE FROM players WHERE player_id = $1`, [playerId]);
          
          // Remove player from memory
          delete game.players[playerId];

          // Update game state
          const gameState = await getGameState(gameId);
          io.to(`game:${gameId}`).emit("gameState", gameState);

          break;
        }
      }

      // Remove empty games from memory
      if (Object.keys(liveGames[gameId].players).length === 0) { // Objects in JS dont have a length but arrays do
        delete liveGames[gameId];
      }
    }

    console.log("Disconnected user: ", socket.id);
  });
});

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

  // Redirect to frontend with access token
  const FRONTEND_URL = process.env.VITE_FRONTEND_URL;
  res.redirect(`${FRONTEND_URL}?access_token=${data.access_token}`);
});

app.get("/login", (req, res) => {
  const state = Math.random().toString(36).substring(2, 15);
  const scope = [
    "user-read-email",
    "user-read-private",
    "playlist-modify-public",
    "playlist-modify-private",
    "streaming",
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
    req.access_token = access_token;
    next();
  },
  userRoute,
);

app.use(
  "/spotify",
  (req, res, next) => {
    req.access_token = access_token;
    next();
  },
  spotifyRoute,
);

app.use(
  "/game",
  (req, res, next) => {
    req.access_token = access_token;
    next();
  },
  gameRoute,
);

server.listen(3001, () => {
  console.log(`HTTP + Socket.io server running on localhost:3001`);
});
