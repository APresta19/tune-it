CREATE TABLE games (
    id UUID PRIMARY KEY,
    host_name TEXT,
    game_name TEXT,
    game_desc TEXT,
    playlist_id TEXT,
    created_at TIMESTAMP DEFAULT NOW()
)

CREATE TABLE players (
    id UUID PRIMARY KEY,
    name
)