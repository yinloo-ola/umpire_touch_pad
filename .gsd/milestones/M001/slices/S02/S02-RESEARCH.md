# S02: Public Match API — Research

**Date:** 2026-03-18

## Summary

S02 adds an unauthenticated public API endpoint that returns matches grouped by status (completed, scheduled, live) for the public viewer page. The implementation is straightforward: add a new handler following the existing pattern, create a service method that queries matches with their games, and format the response to match the shape expected by S03's public viewer. No authentication middleware is applied — this is intentionally open for spectators.

The main work is data transformation: pulling matches from SQLite via sqlc, joining with games, and structuring the response into three status buckets with the correct field names and nested objects for teams and games.

## Recommendation

Add a new public handler in `internal/api/public_handlers.go` (separate file for clarity), a `GetPublicMatches()` method in the match service, and a new sqlc query to fetch all matches with their games in one call. Register the route without auth middleware in `SetupRoutes()`.

This approach:
- Follows the existing handler/service/store pattern exactly
- Keeps public endpoints separate from admin endpoints for maintainability
- Uses sqlc's join capabilities to fetch games efficiently
- Requires minimal changes to existing code (just one new route registration)

## Implementation Landscape

### Key Files

- `backend/internal/api/handlers.go` — Existing handler pattern to follow; shows how `SetupRoutes()` registers endpoints
- `backend/internal/api/middleware.go` — `RequireAuth()` wrapper; public endpoint will skip this
- `backend/internal/service/match_svc.go` — Add `GetPublicMatches()` method here; reuse `MatchRow` helper and player name construction logic
- `backend/internal/store/querier.go` — Generated sqlc interface; will need new query method
- `backend/db/query.sql` — Add new query `GetAllMatchesWithGames` to fetch matches + games
- `backend/cmd/server/main.go` — No changes needed; `SetupRoutes()` already called

### Build Order

1. **Add sqlc query** in `db/query.sql` to fetch all matches with games — use a LEFT JOIN to include matches without games (unstarted matches)
2. **Run sqlc generate** to update `store/querier.go` and `store/query.sql.go` with the new method
3. **Add service method** `GetPublicMatches()` in `service/match_svc.go` that calls the new store query and transforms data into the public response shape
4. **Create public handler** in `api/public_handlers.go` with `handleGetPublicMatches()` that calls the service and returns JSON
5. **Register route** in `SetupRoutes()` — add `mux.HandleFunc("GET /api/public/matches", handler.handleGetPublicMatches)` without `RequireAuth()` wrapper

### Response Shape

Per roadmap, the endpoint returns:
```json
{
  "completed": [
    {
      "id": "uuid",
      "title": "Men's Singles Round 1",
      "scheduledDate": "2026-03-18T14:00:00",
      "status": "completed",
      "tableNumber": 1,
      "team1": [{"name": "Player One", "country": "USA"}],
      "team2": [{"name": "Player Two", "country": "CHN"}],
      "games": [
        {"gameNumber": 1, "team1Score": 11, "team2Score": 9, "status": "completed"},
        {"gameNumber": 2, "team1Score": 11, "team2Score": 7, "status": "completed"}
      ]
    }
  ],
  "scheduled": [...],
  "live": [...]
}
```

**Field exclusions:** Do NOT include `state_json`, `remarks`, `currentGame`, or any internal umpire state. Only spectator-visible data.

### Status Grouping Logic

Based on match status field:
- `completed` → `completed` array
- `unstarted` → `scheduled` array
- `in_progress` → `live` array

### Verification Approach

1. **Unit test:** Add test in `backend/internal/service/match_svc_test.go` (create if needed) to verify status grouping and response shape
2. **Manual curl test:** Start server, run `curl http://localhost:8080/api/public/matches | jq` to verify:
   - No auth required (no cookie needed)
   - Response has `completed`, `scheduled`, `live` keys
   - Each match has required fields (id, title, tableNumber, teams, games)
   - No internal fields (state_json, remarks) are exposed
3. **Integration test:** After S03 is built, verify public viewer page loads data successfully

## Constraints

- **No authentication** — This is explicit in D004; the endpoint must work without any cookies or tokens
- **sqlc-generated queries** — All database access must go through sqlc; no raw SQL in service layer
- **CORS already configured** — The cors.New() wrapper in main.go allows localhost:5173/5174, which covers the Vue dev server
- **SQLite limitations** — No fancy JSON aggregation; fetch matches and games separately if JOIN proves complex with sqlc

## Common Pitfalls

- **Forgetting to exclude internal fields** — Double-check that `state_json` and `remarks` are not in the response struct; these contain umpire-specific state
- **Mismatched field names** — Roadmap specifies `scheduledDate` (camelCase) but database uses `scheduled_date` (snake_case); transform in service layer
- **Empty arrays vs null** — Return `[]` for empty status buckets, not `null`; frontend expects arrays
- **Missing games for unstarted matches** — Use LEFT JOIN or handle nil games slice gracefully; unstarted matches have no game rows yet

## Open Risks

- **N+1 query risk** — If sqlc JOIN is complex, may need separate queries (fetch matches, then fetch games for each). This is acceptable for typical match counts (<100 per day) but worth monitoring.
