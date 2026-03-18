---
id: T01
parent: S02
milestone: M001
provides:
  - Database query for fetching all matches with their associated games in a single call
key_files:
  - backend/db/query.sql
  - backend/internal/store/querier.go
  - backend/internal/store/query.sql.go
key_decisions:
  - Used LEFT JOIN to include matches without games (unstarted matches) rather than inner join
patterns_established:
  - Multi-row query returning one row per match+game combination for N+1 prevention
observability_surfaces:
  - none (database query only, no runtime behavior)
duration: 5m
verification_result: passed
completed_at: 2026-03-18
blocker_discovered: false
---

# T01: Add sqlc query for matches with games

**Added sqlc query GetAllMatchesWithGames with LEFT JOIN for efficient match+game retrieval.**

## What Happened

Added a new sqlc query `GetAllMatchesWithGames` that fetches all matches with their associated games in a single database call. The query uses LEFT JOIN to include matches that have no games yet (unstarted matches), ordered by scheduled_date ASC and game_number ASC. The generated `GetAllMatchesWithGamesRow` struct includes all match fields plus nullable game fields (GameID, GameNumber, Team1Score, Team2Score, GameStatus) to handle the LEFT JOIN semantics.

## Verification

- `cd backend && sqlc generate` exits 0
- `go build ./...` compiles without errors
- `grep "GetAllMatchesWithGames" internal/store/querier.go` confirms method signature in Querier interface
- `grep "GetAllMatchesWithGames" internal/store/query.sql.go` confirms implementation generated

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `cd backend && sqlc generate` | 0 | ✅ pass | ~1s |
| 2 | `cd backend && go build ./...` | 0 | ✅ pass | ~2s |
| 3 | `grep "GetAllMatchesWithGames" internal/store/querier.go` | 0 | ✅ pass | <1s |
| 4 | `grep "GetAllMatchesWithGames" internal/store/query.sql.go` | 0 | ✅ pass | <1s |

## Diagnostics

None required — this task only adds a database query. The generated code can be inspected at:
- `backend/internal/store/querier.go` — interface definition
- `backend/internal/store/query.sql.go` — implementation

## Deviations

None. Executed exactly as planned.

## Known Issues

None.

## Files Created/Modified

- `backend/db/query.sql` — Added `GetAllMatchesWithGames` query with LEFT JOIN
- `backend/internal/store/querier.go` — Generated with new method signature (auto-generated)
- `backend/internal/store/query.sql.go` — Generated with implementation and `GetAllMatchesWithGamesRow` struct (auto-generated)
