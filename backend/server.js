import express from "express";
import querystring from "querystring";
import cors from "cors";
import dotenv from "dotenv";
import fetch from "node-fetch";
import http from "http";
import { Server } from "socket.io";
import userRoute from "./routes/userRoute.js";
import spotifyRoute from "./routes/spotifyRoute.js";
import gameRoute from "./routes/gameRoute.js";

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
    origin: "*"
  }
})

app.use((req, res, next) => {
  // Attach io to routes
  req.io = io;
  next();
})
const games = {};
io.on("connection", (socket) => {
  console.log("Connected user: ", socket.id);

  socket.on("joinGame", ({gameId, playerName}) => {
    const playerId = socket.id;
    if (!gameId || !playerId || !playerName) {
      socket.emit("error", "Missing join data");
      return;
    }

    if (!(gameId in games))
    {
      socket.emit("error", "Game socket doesn't exist");
      return;
    }
    const game = games[gameId];

    console.log("Joined game ", gameId, " by user ", playerName);
 
    if (playerId in game.players)
    {
      socket.emit("error", "Player already in game");
    }

    const isNameTaken = Object.values(game.players).some(p => p.playerName === playerName);

    if(isNameTaken)
    {
      socket.emit("error", "Player name is taken");
      return
    }

    // Add player to game
    game.players[playerId] = {
      playerId,
      playerName
    };

    socket.join(`game:${gameId}`);
    io.to(`game:${gameId}`).emit("gameState", game); // send to everyone (instead of socket.to)
  })

  socket.on("disconnect", () => {
    console.log("Disconnected user: ", socket.id);
  })
})


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
    "streaming"
  ].join(" ");

  console.log("Redirecting to Spotify for authentication...");
  console.log({state, scope});
  console.log({client_id, redirect_uri});
  res.redirect(
    "https://accounts.spotify.com/authorize?" +
      querystring.stringify({
        response_type: "code",
        client_id: client_id,
        scope: scope,
        redirect_uri: redirect_uri,
        state: state,
      })
  );
});

app.use("/users", (req, res, next) => {
    req.access_token = access_token;
    next();
}, userRoute);

app.use("/spotify", (req, res, next) => {
    req.access_token = access_token;
    next();
}, spotifyRoute);

app.use("/game", (req, res, next) => {
    req.access_token = access_token;
    next();
}, gameRoute);

server.listen(3001, () => {
  console.log(`HTTP + Socket.io server running on localhost:3001`);
});
