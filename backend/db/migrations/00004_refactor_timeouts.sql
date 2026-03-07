-- +goose Up
-- Drop the timeout columns from matches table
-- We can do this in SQLite 3.35+
ALTER TABLE matches DROP COLUMN team1_timeout;
ALTER TABLE matches DROP COLUMN team2_timeout;

-- +goose Down
ALTER TABLE matches ADD COLUMN team1_timeout BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE matches ADD COLUMN team2_timeout BOOLEAN NOT NULL DEFAULT FALSE;
