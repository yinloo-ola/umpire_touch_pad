---
estimated_steps: 5
estimated_files: 2
---

# T02: Implement GetPublicMatches service with tests

**Slice:** S02 — Public Match API
**Milestone:** M001

## Description

Add a `GetPublicMatches()` method to the match service that retrieves all matches with games, groups them by status (completed, scheduled, live), and returns a response shape suitable for the public viewer. Add unit tests to verify status grouping and response structure.

## Steps

1. Define response structs in `match_svc.go`:
   - `PublicMatchResponse` with `Completed`, `Scheduled`, `Live` fields (slices of PublicMatch)
   - `PublicMatch` with `ID`, `Title`, `ScheduledDate`, `Status`, `TableNumber`, `Team1`, `Team2`, `Games`
   - `PublicPlayer` with `Name`, `Country`
   - `PublicGame` with `GameNumber`, `Team1Score`, `Team2Score`, `Status`

2. Implement `GetPublicMatches(ctx context.Context) (*PublicMatchResponse, error)`:
   - Call `s.store.GetAllMatchesWithGames(ctx)` to get raw rows
   - Group rows by match ID, collecting games into each match
   - Build `PublicMatch` objects:
     - Transform `scheduled_date` → `scheduledDate` (camelCase)
     - Build `Team1`/`Team2` arrays from player name/country fields
     - Build `Games` array from joined game data
   - Group matches by status: `completed` → Completed, `unstarted` → Scheduled, `in_progress` → Live
   - Return empty slices `[]` for empty buckets (not `nil`)

3. Create `match_svc_test.go` with unit tests:
   - `TestGetPublicMatches_GroupsByStatus`: Mock data with matches in each status, verify correct grouping
   - `TestGetPublicMatches_EmptyBuckets`: No matches in one status, verify empty array not null
   - `TestGetPublicMatches_ExcludesInternalFields`: Verify no stateJson/remarks in output

4. Run tests to verify implementation:
   - `go test ./internal/service/... -v`

5. Build to verify compilation:
   - `go build ./...`

## Must-Haves

- [ ] `PublicMatchResponse` struct with Completed, Scheduled, Live fields
- [ ] `PublicMatch` struct excludes stateJson, remarks, currentGame
- [ ] Status mapping: `completed` → Completed, `unstarted` → Scheduled, `in_progress` → Live
- [ ] Empty buckets return `[]`, not `nil`
- [ ] Unit tests pass for status grouping and empty bucket handling

## Verification

- `go test ./internal/service/... -run TestGetPublicMatches -v` passes all tests
- `go build ./...` compiles without errors

## Observability Impact

- Signals added: Log entry with match counts per status bucket on each call
- How a future agent inspects this: Check server logs for "[GetPublicMatches]" entries
- Failure state exposed: Error logged with context; HTTP 500 returned to client

## Inputs

- `backend/internal/service/match_svc.go` — existing service to extend
- `backend/internal/store/querier.go` — GetAllMatchesWithGames method from T01
- `backend/internal/store/query.sql.go` — generated row struct from T01

## Expected Output

- `backend/internal/service/match_svc.go` — new GetPublicMatches method + response structs
- `backend/internal/service/match_svc_test.go` — new test file with 3+ test cases
