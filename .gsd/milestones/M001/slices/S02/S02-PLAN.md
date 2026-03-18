# S02: Public Match API

**Goal:** Create an unauthenticated GET endpoint `/api/public/matches` that returns matches grouped by status (completed, scheduled, live) with player names, scores, table numbers, and scheduled times.

**Demo:** `curl http://localhost:8080/api/public/matches` returns JSON with `completed`, `scheduled`, and `live` arrays containing match objects with teams, games, and scores — no authentication required.

## Must-Haves

- GET `/api/public/matches` returns `{completed: [...], scheduled: [...], live: [...]}`
- Each match includes: `id`, `title`, `scheduledDate`, `status`, `tableNumber`, `team1`, `team2`, `games`
- Teams contain `{name, country}` for each player; games contain `{gameNumber, team1Score, team2Score, status}`
- No internal fields (`stateJson`, `remarks`, `currentGame`) are exposed
- Endpoint works without authentication (no cookie/token required)
- Empty status buckets return `[]`, not `null`

## Proof Level

- This slice proves: contract
- Real runtime required: yes
- Human/UAT required: no

## Verification

- `go test ./internal/service/... -run TestGetPublicMatches` — unit test for status grouping and response shape
- `curl http://localhost:8080/api/public/matches | jq` — manual verification of:
  - Response has `completed`, `scheduled`, `live` keys
  - Each match has required fields (id, title, tableNumber, teams, games)
  - No internal fields (stateJson, remarks) are exposed
  - Empty buckets are `[]` not `null`

## Observability / Diagnostics

- Runtime signals: Structured log on each request with match counts per status bucket
- Inspection surfaces: Direct curl to `/api/public/matches`
- Failure visibility: HTTP 500 with error message; service logs include error context
- Redaction constraints: None — all data is public spectator info

## Integration Closure

- Upstream surfaces consumed: `matches` table, `games` table via sqlc queries
- New wiring introduced in this slice: `GET /api/public/matches` route registered without `RequireAuth()` wrapper
- What remains before the milestone is truly usable end-to-end: S03 (Public Viewer Page) consumes this endpoint

## Tasks

- [x] **T01: Add sqlc query for matches with games** `est:30m`
  - Why: Need a single query to fetch all matches with their games for the public API, avoiding N+1 queries
  - Files: `backend/db/query.sql`, `backend/internal/store/*.go` (generated)
  - Do: Add `GetAllMatchesWithGames` query using LEFT JOIN to include matches without games (unstarted). Run `sqlc generate` to update store package. The query should return match fields plus game fields in a joined structure.
  - Verify: `sqlc generate` succeeds without errors; new method appears in `store/querier.go`
  - Done when: `GetAllMatchesWithGames` method exists in Querier interface and compiles

- [x] **T02: Implement GetPublicMatches service with tests** `est:1h`
  - Why: Service layer transforms database rows into the public API response shape, grouping by status and excluding internal fields
  - Files: `backend/internal/service/match_svc.go`, `backend/internal/service/match_svc_test.go` (new)
  - Do: Add `PublicMatchResponse`, `PublicMatch`, `PublicPlayer`, `PublicGame` structs. Add `GetPublicMatches(ctx) (*PublicMatchResponse, error)` method that calls the new store query, groups matches by status (`completed` → completed, `unstarted` → scheduled, `in_progress` → live), and builds the response. Add unit test with mock data covering all three status buckets and empty state handling.
  - Verify: `go test ./internal/service/... -run TestGetPublicMatches -v` passes
  - Done when: Service method returns correctly grouped response; test covers status grouping and empty arrays

- [x] **T03: Create public handler and register route** `est:30m`
  - Why: Expose the service method as an HTTP endpoint without authentication
  - Files: `backend/internal/api/public_handlers.go` (new), `backend/internal/api/handlers.go`
  - Do: Create `public_handlers.go` with `handleGetPublicMatches()` that calls `svc.GetPublicMatches()` and returns JSON. In `SetupRoutes()`, add `mux.HandleFunc("GET /api/public/matches", handler.handleGetPublicMatches)` WITHOUT `RequireAuth()` wrapper. Add request logging.
  - Verify: `go build ./...` succeeds; `curl http://localhost:8080/api/public/matches` returns expected JSON shape without auth
  - Done when: Endpoint returns 200 with grouped matches; no auth cookie required

## Files Likely Touched

- `backend/db/query.sql` — new query for matches with games
- `backend/internal/store/querier.go` — generated interface (sqlc)
- `backend/internal/store/query.sql.go` — generated implementation (sqlc)
- `backend/internal/service/match_svc.go` — new GetPublicMatches method + response structs
- `backend/internal/service/match_svc_test.go` — new test file
- `backend/internal/api/public_handlers.go` — new handler file
- `backend/internal/api/handlers.go` — route registration in SetupRoutes
