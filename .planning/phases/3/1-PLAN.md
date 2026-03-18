---
phase: 3
plan: 1
wave: 1
---

# Plan 3.1: Backend Deletion Endpoint

## Objective
Implement a secure backend endpoint to delete a match and all its associated data (games, cards) from the database.

## Context
- .gsd/SPEC.md
- backend/db/query.sql
- backend/internal/service/match_svc.go
- backend/internal/api/handlers.go

## Tasks

<task type="auto">
  <name>Add DeleteQuery to store</name>
  <files>
    - backend/db/query.sql
  </files>
  <action>
    Add a new query `DeleteMatch` to `backend/db/query.sql`:
    ```sql
    -- name: DeleteMatch :exec
    DELETE FROM matches WHERE id = ?;
    ```
    Then run `sqlc generate` in the `backend` directory to regenerate the store code.
  </action>
  <verify>grep "DeleteMatch" backend/internal/store/querier.go</verify>
  <done>The `DeleteMatch` method exists in the `Querier` interface.</done>
</task>

<task type="auto">
  <name>Implement DeleteMatch in Service and Handler</name>
  <files>
    - backend/internal/service/match_svc.go
    - backend/internal/api/handlers.go
  </files>
  <action>
    1. In `backend/internal/service/match_svc.go`, add `DeleteMatch(ctx context.Context, id string) error` method to `MatchService`.
    2. In `backend/internal/api/handlers.go`, implement `handleDeleteMatch(w http.ResponseWriter, r *http.Request)` that extracts the ID from the path and calls the service.
    3. Update `SetupRoutes` in `handlers.go` to register `DELETE /api/matches/{id}` with `admin` role requirement.
  </action>
  <verify>go build ./backend/cmd/api</verify>
  <done>The backend compiles and the delete route is registered.</done>
</task>

## Success Criteria
- [ ] `DELETE /api/matches/{id}` endpoint exists and requires admin auth.
- [ ] Deleting a match also deletes its games and cards (via CASCADE).
- [ ] Backend compiles successfully.
