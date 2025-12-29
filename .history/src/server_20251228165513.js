import express from "express";
import querystring from "querystring";
import cors from "cors";
import dotenv from "dotenv";
import fetch from "node-fetch";
import userRoute from "./routes/userRoute.js";
import spotifyRoute from "./routes/spotifyRoute.js";
import gameRoute from "./routes/gameRoute.js";

// Load env
dotenv.config();
console.log("PG_URL:", process.env.PG_URL);

const app = express();
const client_id = process.env.VITE_SPOTIFY_API_KEY;
const API_URL = process.env.VITE_API_URL;
const redirect_uri = `${API_URL}/callback`;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

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

app.listen(3001, () => {
  console.log(`Server running on localhost:3001`);
});

import pool from './db/pool.js'

async function testDB()
{
  const q = await pool.query("SELECT * FROM PLAYERS")
  console.log(q.rows)
}
testDB();