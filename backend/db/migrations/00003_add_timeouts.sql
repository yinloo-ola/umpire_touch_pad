-- +goose Up
ALTER TABLE matches ADD COLUMN team1_timeout BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE matches ADD COLUMN team2_timeout BOOLEAN NOT NULL DEFAULT FALSE;

-- +goose Down
-- Redundant in sqlite versions < 3.35, but we can keep it as documentation.
