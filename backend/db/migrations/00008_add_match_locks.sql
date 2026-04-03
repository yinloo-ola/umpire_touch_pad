-- +goose Up
CREATE TABLE IF NOT EXISTS match_locks (
    match_id    TEXT PRIMARY KEY,
    session_id  TEXT NOT NULL,
    last_sync   TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- +goose Down
DROP TABLE IF EXISTS match_locks;
