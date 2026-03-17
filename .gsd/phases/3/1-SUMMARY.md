# Plan 3.1 Summary: Backend Deletion Endpoint

Implemented a secure backend endpoint to delete a match and all its associated data.

## Changes
- **Database**: Added `DeleteMatch` query to `backend/db/query.sql`.
- **Store**: Regenerated `sqlc` code, adding `DeleteMatch` to the `Querier` interface.
- **Service**: Added `DeleteMatch` method to `MatchService` in `backend/internal/service/match_svc.go`.
- **API**: Implemented `handleDeleteMatch` in `backend/internal/api/handlers.go` and registered the `DELETE /api/matches/{id}` route with admin requirement.

## Verification
- Verified `sqlc` generation.
- Verified `go build ./cmd/server` succeeds.
