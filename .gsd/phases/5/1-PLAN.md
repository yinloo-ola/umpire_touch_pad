---
phase: 5
plan: 1
wave: 1
---

# Plan 5.1: Backend Infrastructure for Resume & History

## Objective
Enhance the backend to support fetching incomplete matches (for resume) and all matches (for history), along with fetching full match details for state reconstruction. This provides the data necessary for umpires to resume matches and for admins to see match history.

## Context
- .gsd/SPEC.md
- backend/db/query.sql
- backend/internal/service/match_svc.go
- backend/internal/api/handlers.go
- backend/internal/store/query.sql.go

## Tasks

<task type="auto">
  <name>Update SQL Queries</name>
  <files>
    <file>backend/db/query.sql</file>
  </files>
  <action>
    Add the following queries to `backend/db/query.sql`:
    - `GetIncompleteMatchesForPeriod`: Fetch matches with status != 'completed'.
    - `GetAllMatchesForPeriod`: Fetch all matches in a date range.
    - `GetMatch`: Fetch a single match by ID.
    - `GetGamesForMatch`: Fetch all games for a match ID ordered by game_number.
    - `GetCardsForMatch`: Fetch all cards for a match ID.
    
    Update `GetUnstartedMatchesForPeriod` to include 'starting', 'warming_up', and 'in_progress' statuses if suitable, or replace its usage with `GetIncompleteMatchesForPeriod`.
  </action>
  <verify>grep "GetIncompleteMatchesForPeriod" backend/db/query.sql</verify>
  <done>New queries are present in the .sql file.</done>
</task>

<task type="auto">
  <name>Regenerate Store Code</name>
  <files>
    <file>backend/internal/store/query.sql.go</file>
    <file>backend/internal/store/querier.go</file>
  </files>
  <action>
    Try running `sqlc generate` in the `backend` directory. 
    If successful, verified that `backend/internal/store/query.sql.go` is updated.
    If `sqlc` is not available, manually update the `Queries` struct and methods in `query.sql.go` and `querier.go` to match the new SQL queries.
  </action>
  <verify>grep "GetIncompleteMatchesForPeriod" backend/internal/store/query.sql.go</verify>
  <done>Store methods for the new queries are available in Go.</done>
</task>

<task type="auto">
  <name>Update Match Service & Handlers</name>
  <files>
    <file>backend/internal/service/match_svc.go</file>
    <file>backend/internal/api/handlers.go</file>
  </files>
  <action>
    - In `match_svc.go`:
      - Update `GetTodayUnstartedMatches` to use `GetIncompleteMatchesForPeriod` (and rename to `GetTodayIncompleteMatches` if appropriate).
      - Add `GetAllMatches(ctx, start, end)` method.
      - Add `GetMatchState(ctx, id)` method which returns the `Match` info along with its `Games` and `Cards` (reusing `SyncMatchRequest` or a similar struct).
    - In `handlers.go`:
      - Update `handleGetMatches` to support an optional `history=true` query param to return all matches.
      - Add `handleGetMatchState` for `GET /api/matches/{id}`.
      - Register the new route in `SetupRoutes`.
  </action>
  <verify>curl -s http://localhost:8080/api/matches (locally if running)</verify>
  <done>Backend API supports fetching match state and history.</done>
</task>

## Success Criteria
- [ ] Backend can return incomplete matches for today.
- [ ] Backend can return historical matches for a date range.
- [ ] Backend provides a full state snapshot for a specific match ID.
