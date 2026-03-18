# S02: Public Match API — UAT

**Milestone:** M001
**Written:** 2026-03-18

## UAT Type

- UAT mode: artifact-driven
- Why this mode is sufficient: This slice delivers a pure API endpoint with no UI. Verification is through automated tests and curl commands against the running server.

## Preconditions

1. Backend server running on port 8080
2. Database has at least one match seeded (any status)

## Smoke Test

```bash
curl -s http://localhost:8080/api/public/matches | jq 'keys'
```

**Expected:** `["completed", "live", "scheduled"]`

## Test Cases

### 1. Endpoint returns correct response structure

1. Start the backend server: `cd backend && go run ./cmd/server`
2. Run: `curl -s http://localhost:8080/api/public/matches | jq`
3. **Expected:** JSON response with three top-level keys: `completed`, `scheduled`, `live` (all arrays)

### 2. Match objects contain required fields

1. Run: `curl -s http://localhost:8080/api/public/matches | jq '.scheduled[0] | keys'`
2. **Expected:** Array containing: `id`, `title`, `scheduledDate`, `status`, `tableNumber`, `team1`, `team2`, `games`

### 3. Team objects contain player name and country

1. Run: `curl -s http://localhost:8080/api/public/matches | jq '.scheduled[0].team1[0] | keys'`
2. **Expected:** `["country", "name"]`

### 4. Game objects contain required fields

1. Run: `curl -s http://localhost:8080/api/public/matches | jq '.scheduled[0].games[0] | keys'`
2. **Expected:** Array containing: `gameNumber`, `team1Score`, `team2Score`, `status`

### 5. No authentication required

1. Run: `curl -s -w "\nHTTP_CODE: %{http_code}" http://localhost:8080/api/public/matches | tail -1`
2. **Expected:** `HTTP_CODE: 200` (no 401 Unauthorized)

### 6. Empty buckets return empty arrays

1. Ensure database has no live matches
2. Run: `curl -s http://localhost:8080/api/public/matches | jq '.live'`
3. **Expected:** `[]` (not `null`)

### 7. Internal fields are not exposed

1. Run: `curl -s http://localhost:8080/api/public/matches | jq '.scheduled[0] | has("stateJson")'`
2. **Expected:** `false`
3. Run: `curl -s http://localhost:8080/api/public/matches | jq '.scheduled[0] | has("remarks")'`
4. **Expected:** `false`

## Edge Cases

### No matches in database

1. Clear all matches from database
2. Run: `curl -s http://localhost:8080/api/public/matches | jq`
3. **Expected:** `{"completed": [], "scheduled": [], "live": []}`

### Match with no games (unstarted)

1. Ensure a match exists with status `unstarted` and no games
2. Run: `curl -s http://localhost:8080/api/public/matches | jq '.scheduled[] | select(.games | length == 0)'`
3. **Expected:** Match object with empty `games: []` array (LEFT JOIN handles this correctly)

## Failure Signals

- HTTP 401/403 — authentication incorrectly required
- HTTP 500 — server error (check logs)
- `null` instead of `[]` for empty buckets
- Missing `id`, `title`, `tableNumber`, `team1`, `team2`, or `games` fields
- Presence of `stateJson`, `remarks`, or `currentGame` fields

## Requirements Proved By This UAT

- **R002** — Endpoint returns matches grouped by status with player names, scores, table numbers, and scheduled times without authentication.

## Not Proven By This UAT

- Performance under load (no stress testing)
- Pagination (not implemented)
- Real-time updates (manual refresh only; S03 will add refresh button)

## Notes for Tester

- All verification is command-line based; no browser needed
- If server fails to start, check port 8080 is available
- Unit tests in `backend/internal/service/match_svc_test.go` provide additional coverage
