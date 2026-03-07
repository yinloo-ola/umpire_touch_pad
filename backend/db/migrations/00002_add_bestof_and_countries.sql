-- +goose Up
ALTER TABLE matches ADD COLUMN best_of INTEGER NOT NULL DEFAULT 5;
ALTER TABLE matches ADD COLUMN team1_p1_country TEXT;
ALTER TABLE matches ADD COLUMN team1_p2_country TEXT;
ALTER TABLE matches ADD COLUMN team2_p1_country TEXT;
ALTER TABLE matches ADD COLUMN team2_p2_country TEXT;

-- +goose Down
-- Dropping columns is not supported in SQLite until version 3.35+
-- For older sqlite we would need to recreate the table, but since we are just starting, we can leave this or just skip Down.
