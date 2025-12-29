CREATE TABLE games (
    id UUID PRIMARY KEY,
    host_name TEXT NOT NULL,
    game_name TEXT,
    game_desc TEXT,
    playlist_id TEXT,
    created_at TIMESTAMP DEFAULT NOW()
)

CREATE TABLE players (
    id UUID PRIMARY KEY,
    player_name TEXT NOT NULL,
    game_id UUID REFERENCES games(id) ON DELETE CASCADE,
    joi
)