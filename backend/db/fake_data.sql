CREATE EXTENSION IF NOT EXISTS "pgcrypto"; -- Extension for random UUID's
INSERT INTO games (id, host_name, game_name, game_desc, playlist_id)
VALUES
  (gen_random_uuid(), 'Andrew', 'Tune It Night', 'Guess who added the song', 'playlist_123'),
  (gen_random_uuid(), 'Max', 'Friday Game', 'Music guessing game', 'playlist_456');

INSERT INTO players (id, player_name, game_id)
VALUES (gen_random_uuid(), 'Denny', 'd30224a8-a852-4492-b9fa-8362d16a9f79')