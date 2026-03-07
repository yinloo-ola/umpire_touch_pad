-- +goose Up
ALTER TABLE matches ADD COLUMN state_json TEXT;

-- +goose Down
ALTER TABLE matches DROP COLUMN state_json;
