---
id: S02
parent: M001
milestone: M001
provides:
  - GET /api/public/matches endpoint returning matches grouped by status
  - PublicMatchResponse/PublicMatch/PublicPlayer/PublicGame structs for public API
requires: []
affects:
  - S03
key_files:
  - backend/db/query.sql
  - backend/internal/store/querier.go
  - backend/internal/service/match_svc.go
  - backend/internal/service/match_svc_test.go
  - backend/internal/api/public_handlers.go
  - backend/internal/api/handlers.go
key_decisions:
  - No authentication required for public endpoint (D004)
  - Response grouped by status (completed, scheduled, live) to match UI tabs (D005)
  - LEFT JOIN for matches+games to include unstarted matches without N+1 queries
  - Empty status buckets return [] not null for consistent JSON
patterns_established:
  - Public handlers in separate file from authenticated handlers
  - Route registration without RequireAuth() wrapper for public endpoints
  - Grouping denormalized JOIN rows by match ID in service layer
observability_surfaces:
  - Structured log on each request: "[GetPublicMatches] Retrieved matches: completed=N, scheduled=N, live=N"
  - Handler log: "[handleGetPublicMatches] GET /api/public/matches"
  - Direct curl inspection: curl http://localhost:8080/api/public/matches | jq
drill_down_paths:
  - .gsd/milestones/M001/slices/S02/tasks/T01-SUMMARY.md
  - .gsd/milestones/M001/slices/S02/tasks/T02-SUMMARY.md
  - .gsd/milestones/M001/slices/S02/tasks/T03-SUMMARY.md
duration: 15m
verification_result: passed
completed_at: 2026-03-18
---

# S02: Public Match API

**Unauthenticated GET /api/public/matches endpoint returning matches grouped by status (completed, scheduled, live) with player names, scores, table numbers, and games.**

## What Happened

Created a complete public API for retrieving match data without authentication:

1. **T01** added `GetAllMatchesWithGames` sqlc query using LEFT JOIN to fetch all matches with their games in a single call, avoiding N+1 queries. The query includes unstarted matches (no games yet).

2. **T02** implemented `GetPublicMatches` service method with response structs that:
   - Group matches by status: `completed` → Completed, `unstarted` → Scheduled, `in_progress` → Live
   - Include player names and countries for both teams
   - Include all games with scores and status
   - Exclude internal fields (stateJson, remarks, currentGame)
   - Return empty slices `[]` for empty buckets (not null)

3. **T03** created `public_handlers.go` with the HTTP handler and registered the route directly on the mux without `RequireAuth()` wrapper, making it publicly accessible.

## Verification

| Check | Result |
|-------|--------|
| `go test ./internal/service/... -run TestGetPublicMatches -v` | ✅ 5 tests pass |
| `go build ./...` | ✅ Compiles |
| `curl http://localhost:8080/api/public/matches` | ✅ 200 with correct JSON shape |
| Response has completed/scheduled/live keys | ✅ Verified |
| Each match has required fields (id, title, tableNumber, teams, games) | ✅ Verified |
| No internal fields exposed | ✅ Verified |
| Empty buckets are [] not null | ✅ Verified |
| No auth required | ✅ Verified |

## Requirements Advanced

- **R002** — Advanced to validated. The public API endpoint now returns matches grouped by status with all required fields and no authentication barrier.

## Requirements Validated

- **R002** — Validated by unit tests (status grouping, empty buckets, excluded fields, multiple games, doubles teams) and live curl verification confirming response shape matches spec.

## New Requirements Surfaced

- None

## Requirements Invalidated or Re-scoped

- None

## Deviations

None. Implemented exactly as planned across all three tasks.

## Known Limitations

- No pagination yet — returns all matches. Acceptable for current tournament scale.
- No caching — each request hits the database. Can add later if load becomes an issue.

## Follow-ups

- None discovered during execution. S03 (Public Viewer Page) will consume this endpoint.

## Files Created/Modified

- `backend/db/query.sql` — Added GetAllMatchesWithGames query with LEFT JOIN
- `backend/internal/store/querier.go` — Generated interface with new method (auto-generated)
- `backend/internal/store/query.sql.go` — Generated implementation with GetAllMatchesWithGamesRow struct (auto-generated)
- `backend/internal/service/match_svc.go` — Added PublicMatchResponse, PublicMatch, PublicPlayer, PublicGame structs and GetPublicMatches method
- `backend/internal/service/match_svc_test.go` — Added 5 unit tests
- `backend/internal/api/public_handlers.go` — New file with handleGetPublicMatches handler
- `backend/internal/api/handlers.go` — Updated SetupRoutes to register public route

## Forward Intelligence

### What the next slice should know
- The public API returns matches in exactly the shape needed for tabbed UI: `{completed: [...], scheduled: [...], live: [...]}`
- Each match includes full team rosters (team1/team2 arrays of {name, country}) and all games with scores
- Status values in response are lowercase strings: "completed", "unstarted", "in_progress"
- Table numbers are currently 0 for most matches (data issue, not API issue)

### What's fragile
- None identified — straightforward implementation with good test coverage

### Authoritative diagnostics
- Server logs show match counts per status on each request
- Direct curl to `/api/public/matches | jq` for immediate inspection

### What assumptions changed
- None — implementation matched plan exactly
