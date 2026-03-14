-- +goose Up
ALTER TABLE matches ADD COLUMN remarks TEXT;

-- +goose Down
ALTER TABLE matches DROP COLUMN remarks;
