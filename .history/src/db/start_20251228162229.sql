CREATE TABLE games (
    id UUID PRIMARY KEY,
    host_name TEXT,
    game_name TEXT,
    game_desc TEXT,
    playlist_id TEXT,
    created_at TIMESTAMP DEFAU
)