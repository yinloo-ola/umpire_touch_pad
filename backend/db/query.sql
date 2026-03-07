-- name: CreateMatch :exec
INSERT INTO matches (
    id, title, scheduled_date, status, current_game,
    team1_p1_name, team1_p2_name, team2_p1_name, team2_p2_name,
    best_of, team1_p1_country, team1_p2_country, team2_p1_country, team2_p2_country
) VALUES (
    ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
);

-- name: GetMatch :one
SELECT id, title, scheduled_date, status, current_game, team1_p1_name, team1_p2_name, team2_p1_name, team2_p2_name, best_of, team1_p1_country, team1_p2_country, team2_p1_country, team2_p2_country, created_at, updated_at, state_json FROM matches WHERE id = ?;

-- name: GetIncompleteMatchesForPeriod :many
SELECT id, title, scheduled_date, status, current_game, team1_p1_name, team1_p2_name, team2_p1_name, team2_p2_name, best_of, team1_p1_country, team1_p2_country, team2_p1_country, team2_p2_country, created_at, updated_at, state_json FROM matches 
WHERE status != 'completed' 
  AND scheduled_date >= ? 
  AND scheduled_date <= ?;

-- name: GetAllMatchesForPeriod :many
SELECT id, title, scheduled_date, status, current_game, team1_p1_name, team1_p2_name, team2_p1_name, team2_p2_name, best_of, team1_p1_country, team1_p2_country, team2_p1_country, team2_p2_country, created_at, updated_at, state_json FROM matches 
WHERE scheduled_date >= ? 
  AND scheduled_date <= ?;

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

