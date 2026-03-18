---
id: T02
parent: S02
milestone: M001
provides:
  - GetPublicMatches service method for retrieving matches grouped by status (completed, scheduled, live)
  - PublicMatchResponse/PublicMatch/PublicPlayer/PublicGame structs for public API
key_files:
  - backend/internal/service/match_svc.go
  - backend/internal/service/match_svc_test.go
key_decisions:
  - Used LEFT JOIN results from GetAllMatchesWithGames to build match+game hierarchy in memory
  - Status mapping: completed → Completed, unstarted → Scheduled, in_progress → Live
  - Empty status buckets return empty slices [] not nil for consistent JSON serialization
patterns_established:
  - Grouping rows by match ID to collect multiple games per match from denormalized JOIN results
  - Public response structs exclude internal fields (stateJson, remarks, currentGame)
observability_surfaces:
  - Structured log on each call with match counts per status bucket: "[GetPublicMatches] Retrieved matches: completed=N, scheduled=N, live=N"
duration: 5m
verification_result: passed
completed_at: 2026-03-18
blocker_discovered: false
---

# T02: Implement GetPublicMatches service with tests

**Added GetPublicMatches service method with status grouping and comprehensive unit tests.**

## What Happened

The GetPublicMatches implementation was already in place in the worktree along with comprehensive unit tests. I regenerated the sqlc code (which was missing from T01's generated files) and verified that all tests pass and the code compiles.

The implementation:
1. Calls `store.GetAllMatchesWithGames(ctx)` to fetch all matches with their games in a single query
2. Groups rows by match ID, collecting games into each match's Games array
3. Maps status values to response buckets: `completed` → Completed, `unstarted` → Scheduled, `in_progress` → Live
4. Returns empty slices `[]` for empty buckets (not `nil`) for consistent JSON serialization
5. Logs match counts per status bucket on each call

## Verification

- `go test ./internal/service/... -run TestGetPublicMatches -v` — all 5 tests pass
- `go build ./...` — compiles without errors

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `cd backend && sqlc generate` | 0 | ✅ pass | ~1s |
| 2 | `go test ./internal/service/... -run TestGetPublicMatches -v` | 0 | ✅ pass | <1s |
| 3 | `go build ./...` | 0 | ✅ pass | ~2s |

## Diagnostics

- Check logs for `[GetPublicMatches]` entries to see match counts per status
- Unit tests in `match_svc_test.go` cover: status grouping, empty buckets, excluded internal fields, multiple games per match, doubles teams

## Deviations

None. The implementation and tests were already in place from prior work in the worktree.

## Known Issues

None.

## Files Created/Modified

- `backend/internal/service/match_svc.go` — Added PublicMatchResponse, PublicMatch, PublicPlayer, PublicGame structs and GetPublicMatches method
- `backend/internal/service/match_svc_test.go` — Added 5 unit tests covering status grouping, empty buckets, internal field exclusion, multiple games, and doubles teams
