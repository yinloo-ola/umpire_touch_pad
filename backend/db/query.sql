-- name: CreateMatch :exec
INSERT INTO matches (
    id, title, scheduled_date, status, current_game,
    team1_p1_name, team1_p2_name, team2_p1_name, team2_p2_name
) VALUES (
    ?, ?, ?, ?, ?, ?, ?, ?, ?
);

-- name: GetUnstartedMatchesForPeriod :many
SELECT * FROM matches 
WHERE status = 'unstarted' 
  AND scheduled_date >= ? 
  AND scheduled_date <= ?;

-- name: UpdateMatchStatus :exec
UPDATE matches 
SET status = ?, current_game = ?, updated_at = CURRENT_TIMESTAMP
WHERE id = ?;

-- name: UpsertGame :exec
INSERT INTO games (id, match_id, game_number, team1_score, team2_score, status)
VALUES (?, ?, ?, ?, ?, ?)
ON CONFLICT(match_id, game_number) DO UPDATE SET
    team1_score = excluded.team1_score,
    team2_score = excluded.team2_score,
    status = excluded.status,
    updated_at = CURRENT_TIMESTAMP;

-- name: ClearCardsForMatch :exec
DELETE FROM cards WHERE match_id = ?;

-- name: CreateCard :exec
INSERT INTO cards (id, match_id, game_id, team_index, player_index, card_type, reason)
VALUES (?, ?, ?, ?, ?, ?, ?);

