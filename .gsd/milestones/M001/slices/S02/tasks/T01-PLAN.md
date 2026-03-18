---
estimated_steps: 3
estimated_files: 4
---

# T01: Add sqlc query for matches with games

**Slice:** S02 — Public Match API
**Milestone:** M001

## Description

Add a new sqlc query that fetches all matches with their associated games in a single call. This enables the public API to retrieve match data without N+1 queries. The query uses LEFT JOIN to include matches that have no games yet (unstarted matches).

## Steps

1. Add `GetAllMatchesWithGames` query to `backend/db/query.sql`:
   - SELECT match fields (id, title, scheduled_date, status, table_number, team player names and countries, best_of)
   - LEFT JOIN with games table on match_id
   - ORDER BY scheduled_date ASC, game_number ASC
   - Return multiple rows (one per match+game combination)

2. Run `sqlc generate` from `backend/` directory to generate Go code:
   - This creates `GetAllMatchesWithGamesRow` struct and `GetAllMatchesWithGames` method in the Querier interface

3. Verify the generated code compiles:
   - Run `go build ./...` to ensure no syntax errors

## Must-Haves

- [ ] Query uses LEFT JOIN to include matches without games
- [ ] Returns match fields: id, title, scheduled_date, status, table_number, team1/2 player names and countries, best_of
- [ ] Returns game fields: id, game_number, team1_score, team2_score, status (nullable for unstarted matches)
- [ ] `sqlc generate` succeeds without errors
- [ ] Generated method appears in `store/querier.go`

## Verification

- `cd backend && sqlc generate` exits 0
- `go build ./...` compiles without errors
- `grep "GetAllMatchesWithGames" internal/store/querier.go` shows the new method

## Observability Impact

None — this task only adds a database query, no runtime behavior changes yet.

## Inputs

- `backend/db/query.sql` — existing query patterns to follow
- `backend/internal/store/models.go` — existing Match and Game structs for reference

## Expected Output

- `backend/db/query.sql` — new `GetAllMatchesWithGames` query added
- `backend/internal/store/querier.go` — updated with new method signature (generated)
- `backend/internal/store/query.sql.go` — updated with implementation (generated)
