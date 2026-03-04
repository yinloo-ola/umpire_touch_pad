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
