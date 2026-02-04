DROP TABLE IF EXISTS guesses;
DROP TABLE IF EXISTS rounds;
DROP TABLE IF EXISTS songs;
DROP TABLE IF EXISTS players;
DROP TABLE IF EXISTS games;

CREATE TYPE game_state_enum AS ENUM ('lobby', 'playing', 'finished');


CREATE TABLE IF NOT EXISTS games (
    game_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_code TEXT NOT NULL UNIQUE,
    host_name TEXT NOT NULL,
    game_name TEXT,
    game_desc TEXT,
    playlist_id TEXT,
    game_state game_state_enum NOT NULL DEFAULT 'lobby',
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS players (
    player_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    player_name TEXT NOT NULL,
    game_id UUID REFERENCES games(game_id) ON DELETE CASCADE,
    total_points INTEGER DEFAULT 0,
    joined_at TIMESTAMP DEFAULT NOW(),
    UNIQUE (player_name, game_id)
);

CREATE TABLE IF NOT EXISTS songs (
    song_id UUID PRIMARY KEY, /* auto increments */
    game_id UUID REFERENCES games(game_id) ON DELETE CASCADE,
    player_id UUID REFERENCES players(player_id),
    track_uri TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS rounds (
    round_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    current_round INTEGER NOT NULL,
    total_rounds INTEGER,
    game_id UUID REFERENCES games(game_id) ON DELETE CASCADE,
    song_id UUID REFERENCES songs(song_id) ON DELETE CASCADE,
    UNIQUE(game_id, current_round)
);

CREATE TABLE IF NOT EXISTS guesses (
    guess_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    player_id UUID REFERENCES players(player_id) ON DELETE CASCADE,
    round_id UUID REFERENCES rounds(round_id) ON DELETE CASCADE,
    guessed_player_id UUID REFERENCES players(player_id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(round_id, player_id)
);


/*
CREATE USER tune_it_user WITH PASSWORD 'password';
CREATE DATABASE tune_it OWNER tune_it_user;
GRANT ALL PRIVILEGES ON DATABASE tune_it TO tune_it_user;
*/