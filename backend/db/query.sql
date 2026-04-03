-- name: CreateMatch :exec
INSERT INTO matches (
    id, title, scheduled_date, status, current_game,
    team1_p1_name, team1_p2_name, team2_p1_name, team2_p2_name,
    best_of, team1_p1_country, team1_p2_country, team2_p1_country, team2_p2_country,
    table_number
) VALUES (
    ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
);

-- name: GetMatch :one
SELECT id, title, scheduled_date, status, current_game, team1_p1_name, team1_p2_name, team2_p1_name, team2_p2_name, best_of, team1_p1_country, team1_p2_country, team2_p1_country, team2_p2_country, created_at, updated_at, state_json, table_number, remarks FROM matches WHERE id = ?;

-- name: GetIncompleteMatchesForPeriod :many
SELECT id, title, scheduled_date, status, current_game, team1_p1_name, team1_p2_name, team2_p1_name, team2_p2_name, best_of, team1_p1_country, team1_p2_country, team2_p1_country, team2_p2_country, created_at, updated_at, state_json, table_number, remarks FROM matches 
WHERE status != 'completed' 
  AND scheduled_date >= ? 
  AND scheduled_date <= ?;

-- name: GetAllMatches :many
SELECT id, title, scheduled_date, status, current_game, team1_p1_name, team1_p2_name, team2_p1_name, team2_p2_name, best_of, team1_p1_country, team1_p2_country, team2_p1_country, team2_p2_country, created_at, updated_at, state_json, table_number, remarks FROM matches 
ORDER BY scheduled_date DESC;

-- name: UpdateMatchStatus :exec
UPDATE matches 
SET status = ?, 
    current_game = ?, 
    updated_at = CURRENT_TIMESTAMP
WHERE id = ?;

-- name: UpdateMatchState :exec
UPDATE matches 
SET status = ?, 
    current_game = ?, 
    state_json = ?,
    updated_at = CURRENT_TIMESTAMP
WHERE id = ?;

-- name: GetGamesForMatch :many
SELECT * FROM games 
WHERE match_id = ? 
ORDER BY game_number;

-- name: GetCardsForMatch :many
SELECT * FROM cards 
WHERE match_id = ?;

-- name: UpsertGame :one
INSERT INTO games (id, match_id, game_number, team1_score, team2_score, status)
VALUES (?, ?, ?, ?, ?, ?)
ON CONFLICT(match_id, game_number) DO UPDATE SET
    team1_score = excluded.team1_score,
    team2_score = excluded.team2_score,
    status = excluded.status,
    updated_at = CURRENT_TIMESTAMP
RETURNING id;

-- name: ClearCardsForMatch :exec
DELETE FROM cards WHERE match_id = ?;

-- name: CreateCard :exec
INSERT INTO cards (id, match_id, game_id, team_index, player_index, card_type, reason)
VALUES (?, ?, ?, ?, ?, ?, ?);

-- name: GetGameIDByNumber :one
SELECT id FROM games WHERE match_id = ? AND game_number = ?;

-- name: AdminUpdateMatch :exec
UPDATE matches SET status = ?, remarks = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?;

-- name: DeleteGamesForMatch :exec
DELETE FROM games WHERE match_id = ?;

-- name: DeleteMatch :exec
DELETE FROM matches WHERE id = ?;
-- name: DeleteMatches :exec
DELETE FROM matches WHERE id IN (sqlc.slice('ids'));

-- name: GetAllMatchesWithGames :many
SELECT
    m.id, m.title, m.scheduled_date, m.status, m.table_number,
    m.team1_p1_name, m.team1_p2_name, m.team2_p1_name, m.team2_p2_name,
    m.team1_p1_country, m.team1_p2_country, m.team2_p1_country, m.team2_p2_country,
    m.best_of,
    g.id AS game_id, g.game_number, g.team1_score, g.team2_score, g.status AS game_status
FROM matches m
LEFT JOIN games g ON m.id = g.match_id
ORDER BY m.scheduled_date ASC, g.game_number ASC;

-- name: AcquireMatchLock :execresult
INSERT INTO match_locks (match_id, session_id, last_sync)
VALUES (?, ?, CURRENT_TIMESTAMP)
ON CONFLICT(match_id) DO UPDATE SET
    session_id = excluded.session_id,
    last_sync = excluded.last_sync
WHERE match_locks.last_sync < datetime('now', '-30 seconds');

-- name: GetMatchLock :one
SELECT match_id, session_id, last_sync FROM match_locks WHERE match_id = ?;

-- name: TouchMatchLock :execresult
UPDATE match_locks SET last_sync = CURRENT_TIMESTAMP
WHERE match_id = ? AND session_id = ?;

-- name: ReleaseMatchLock :exec
DELETE FROM match_locks WHERE match_id = ?;

-- name: PruneExpiredLocks :exec
DELETE FROM match_locks WHERE last_sync < datetime('now', '-30 seconds');
