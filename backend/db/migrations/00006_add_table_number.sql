-- +goose Up
ALTER TABLE matches ADD COLUMN table_number INTEGER;

-- +goose Down
ALTER TABLE matches DROP COLUMN table_number;
