---
phase: 3
plan: 1
wave: 1
depends_on: []
---

# Plan 3.1: Backend Sync API & SQL Upserts

## Objective
Implement the backend infrastructure to receive and persist live match state updates from the touchpad. Use `Upsert` logic for games to ensure the current game score is always up-to-date.

## Context
- `backend/db/query.sql` (Add new queries)
- `backend/internal/service/match_svc.go` (Add SyncMatch service)
- `backend/internal/api/handlers.go` (Add Sync endpoint)
- `backend/internal/api/handlers.go:SetupRoutes` (Register route)

## Tasks

<task type="auto">
  <name>Add SQL Queries for Sync</name>
  <files>
    - backend/db/query.sql
  </files>
  <action>
    - Add `-- name: UpdateMatchStatus :exec` to update `status` and `current_game` in `matches`.
    - Add `-- name: UpsertGame :exec` to update or insert a score for a specific `match_id` and `game_number`.
    - Add `-- name: ClearCardsForMatch :exec` to delete existing cards for a match before re-syncing.
    - Add `-- name: CreateCard :exec` to insert a card record.
  </action>
  <verify>grep "name: CreateCard" backend/db/query.sql && grep "name: ClearCardsForMatch" backend/db/query.sql</verify>
  <done>SQL queries are present for syncing matches and games.</done>
</task>

<task type="auto">
  <name>Generate SQLC Code</name>
  <files>
    - backend/internal/store/query.sql.go
  </files>
  <action>
    - Run `docker run --rm -v $(pwd):/src -w /src kjconroy/sqlc generate` or equivalent local `sqlc generate` in the `backend` directory.
  </action>
  <verify>grep "func (q *Queries) UpsertGame" backend/internal/store/query.sql.go</verify>
  <done>Go code generated from SQL queries.</done>
</task>

<task type="auto">
  <name>Implement SyncMatch Service</name>
  <files>
    - backend/internal/service/match_svc.go
  </files>
  <action>
    - Add `SyncMatchRequest` struct with `Game` and `Cards` fields.
    - Implement a transaction in `SyncMatch` that:
        1. Updates match status.
        2. Upserts current game.
        3. Clears old cards for the match and inserts current cards.
  </action>
  <verify>grep "func (s *MatchService) SyncMatch" backend/internal/service/match_svc.go</verify>
  <done>Service layer handles sync logic.</done>
</task>

<task type="auto">
  <name>Expose Sync Endpoint</name>
  <files>
    - backend/internal/api/handlers.go
  </files>
  <action>
    - Add `handleSyncMatch` handler.
    - Register `PUT /api/matches/:id/sync` in `SetupRoutes`.
  </action>
  <verify>grep "PUT /api/matches/:id/sync" backend/internal/api/handlers.go</verify>
  <done>API is reachable for live sync updates.</done>
</task>

## Success Criteria
- [ ] `PUT /api/matches/:id/sync` responds with 200/204 on valid payload.
- [ ] Match status and game scores are updated in the database.
