# Tune It User Manual

## Overview

Tune It is a multiplayer web-based music guessing game inspired by Kahoot. A host creates a room, players join with a room code, everyone adds songs, and each round asks players to guess who added the current song. The application uses React/Vite, Express, Socket.IO, PostgreSQL, and the Spotify API.

## Requirements

- Node.js 20 or newer
- PostgreSQL
- A Spotify account for the host
- Spotify Premium for playback through the Spotify Web Playback SDK
- Spotify Developer app credentials
- A modern browser such as Chrome, Firefox, or Edge

## Quick Start Summary

1. Install Node.js, PostgreSQL, and ngrok.
2. Create the database and run `backend/db/start.sql`.
3. Start ngrok with `ngrok http 3000`.
4. Copy the ngrok forwarding URL.
5. Create `.env` using the ngrok URL.
6. Run `npm install`.
7. Start backend with `node backend/server.js`.
8. Start frontend with `npm run dev -- --host 0.0.0.0`.
9. Open the ngrok forwarding URL.

For full Spotify playback, the host must use a Spotify Premium account and valid Spotify Developer credentials.


## Project Structure

- `src/`: React frontend
- `backend/`: Express server, Socket.IO game logic, API routes, and database connection
- `backend/db/start.sql`: SQL schema used to create the database tables
- `backend/services/`: shared backend services for Spotify, sockets, and live game state

## Database Setup

Create a PostgreSQL database named `tuneit`, or use another name and update `.env` accordingly.

Run the schema file:

```bash
psql -U your_postgres_user -d tuneit -f backend/db/start.sql
```

If using pgAdmin or another SQL client, open `backend/db/start.sql` and run the full file against the database.

## Spotify Setup

1. Go to the Spotify Developer Dashboard.
2. Create an app.
3. Copy the Client ID and Client Secret.
4. Add this redirect URI using your ngrok forwarding URL:

```text
https://your-ngrok-url.ngrok-free.app/api/callback
```

The redirect URI in Spotify must exactly match the `SPOTIFY_REDIRECT_URI` value in `.env`. If the ngrok URL changes, update both `.env` and the Spotify Developer Dashboard.

## Environment Variables

Create a `.env` file in the project root. Replace `https://your-ngrok-url.ngrok-free.app` with the HTTPS forwarding URL from `ngrok http 3000`.

```env
VITE_API_URL=/api
VITE_FRONTEND_URL=https://your-ngrok-url.ngrok-free.app

SPOTIFY_CLIENT_ID=your_spotify_client_id
SPOTIFY_CLIENT_SECRET=your_spotify_client_secret
SPOTIFY_REDIRECT_URI=https://your-ngrok-url.ngrok-free.app/api/callback

PG_HOST=localhost
PG_PORT=5432
PG_DATABASE=tuneit
PG_USER=your_postgres_user
PG_PASSWORD=your_postgres_password
```

`VITE_API_URL=/api` works locally because Vite proxies `/api` and `/socket.io` to the backend server.

Example:

```env
VITE_FRONTEND_URL=https://peaceless-protrusive-raphael.ngrok-free.dev
SPOTIFY_REDIRECT_URI=https://peaceless-protrusive-raphael.ngrok-free.dev/api/callback
```

## Install Dependencies

From the project folder, run:

```bash
npm install
```

## Installing Ngrok

Ngrok is required for this project setup because Spotify redirects back through the public ngrok URL.

1. Create an account at `https://ngrok.com`.
2. Download and install ngrok for your operating system.
3. Open a terminal and authenticate ngrok:

```bash
ngrok config add-authtoken your_ngrok_auth_token
```

The auth token is available in the ngrok dashboard after creating an account.

## Running the Application

The program can be run from terminal windows without opening the project in a code editor.

Open three terminal windows.

Terminal 1, from the project folder, start the backend:

```bash
node backend/server.js
```

Terminal 2, from the project folder, start the frontend:

```bash
npm run dev -- --host 0.0.0.0
```

Terminal 3, start ngrok:

```bash
ngrok http 3000
```

Copy the HTTPS forwarding URL from ngrok and open it in a browser.

Example:

```text
https://your-ngrok-url.ngrok-free.app
```

With this setup, ngrok points to Vite on port `3000`, and Vite proxies backend API and Socket.IO traffic to `localhost:3001`.

If ngrok gives you a new URL, update `.env`, update the Spotify redirect URI, and restart the backend and frontend.

## How to Navigate the Application

### Host Flow

1. Open the application.
2. Click **Create Game**.
3. Enter the number of songs each player should add.
4. Enter the host name, game name, and game description.
5. Choose whether to save the playlist after the game.
6. Click **Create Game**.
7. Log in with Spotify if prompted.
8. After Spotify redirects back, the app creates the room and opens the lobby.
9. Share the room code with players.
10. Click **Start Game** when everyone has joined.
11. Add the required number of songs.
12. Wait for all players to finish adding songs.
13. The playback page starts the game.
14. Guess who added each song.
15. View the round result popup after each round.
16. After the final song, view the leaderboard.
17. Click **Play Again** to send everyone back to the lobby with the same room code.

Only the host browser controls Spotify playback. Other players can view the current song and submit guesses, but they do not need Spotify Premium.

### Player Flow

1. Open the application.
2. Click **Join Game**.
3. Enter a player name.
4. Enter the room code provided by the host.
5. Wait in the lobby until someone starts the game.
6. Add the required number of songs.
7. During playback, choose the player you think added the song.
8. View the round result popup and scores.
9. Continue until the leaderboard appears.
10. If someone clicks **Play Again**, all players return to the lobby automatically.

## Testing Notes

- For realistic local testing, use two different browsers, an incognito window, or a second device. Browser local storage stores whether the current user is the host.
- The host should use a Spotify Premium account.
- Keep the host browser open during gameplay.
- Keep the ngrok terminal running and do not restart it during the game.
- If the backend restarts, active game state is lost because live game data is stored in server memory.

## Common Issues

### Spotify Redirect Does Not Work

Check that `SPOTIFY_REDIRECT_URI` exactly matches a redirect URI in the Spotify Developer Dashboard.

### Players Cannot Join From Another Device

Use the ngrok URL, not `localhost`. `localhost` only works on the same computer.

### Playback Does Not Start

Make sure the host is logged in with Spotify Premium and that the browser allows Spotify Web Playback.

### Database Connection Fails

Confirm PostgreSQL is running and that the `.env` database values match the local database.

### Page Refresh Opens a Blank or Wrong Page

Use the Vite dev server URL, `http://localhost:3000`, and keep both terminal processes running.

## Stopping the Application

Press `Ctrl + C` in each terminal window running the backend, frontend, or ngrok.


## Legal & Attribution

### Copyright
© 2026 Andrew Presta. All rights reserved.

### Third-Party Services
This application uses the following third-party services:

- **Spotify Web API** — Used for song search, playlist creation, and music playback.  
  Spotify is a trademark of Spotify AB. This application is not affiliated with or endorsed by Spotify.  
  Use of the Spotify API is subject to the [Spotify Developer Terms of Service](https://developer.spotify.com/terms).

- **Spotify Web Playback SDK** — Used to stream audio in the browser.  
  Subject to the [Spotify Platform Guidelines](https://developer.spotify.com/documentation/design).

### Important Notes
- This application requires a **Spotify Premium** account for audio playback.
- This application is a personal/educational project and is not intended for commercial use.
- Song and album artwork displayed in this application are owned by their respective rights holders.