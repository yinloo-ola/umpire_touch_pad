---
phase: 1
plan: 3
wave: 2
---

# Plan 1.3: Core API & Service Layer

## Objective
Implement the `internal/api` Handlers and `internal/service` Business Logic mapping to fulfill the `POST /api/match` and `GET /api/matches` frontend requests cleanly on top of the `.store` layer.

## Context
- .gsd/ARCHITECTURE.md
- backend/internal/store/models.go (from wave 1)
- backend/cmd/server/main.go (from wave 1)

## Tasks

<task type="auto">
  <name>Service Layer Translation (`internal/service`)</name>
  <files>
    - backend/internal/service/match_svc.go
  </files>
  <action>
    - Design a `MatchService` struct containing a `store.Querier` instance.
    - Implement `CreateMatch` method handling UUID generation and mapping the nested `[]Player` lists to the flattened store model (e.g. `team1_p1_name = Team1[0].Name`, `team2_p2_name = Team2[1].Name` -- remember to safe boundary check slice lengths).
    - Implement `GetTodayUnstartedMatches` logic: fetch `time.Now()` at the Start of Day boundary `00:00:00` and End of Day `23:59:59` (in the local timezone of the server) and call `store.GetUnstartedMatchesForPeriod`.
    - Map the flat database records returned by the store back into the deeply nested `Match` Object (where `Team1: []Player{ {Name: DB.team1_p1_name}, ...}`). Handle Nullability/empty strings cleanly so singles don't get 2 records.
  </action>
  <verify>grep "MatchService struct" backend/internal/service/match_svc.go</verify>
  <done>Service layer handles formatting properly without exposing underlying flattening to HTTP router.</done>
</task>

<task type="auto">
  <name>API Routing and Handlers (`internal/api`)</name>
  <files>
    - backend/internal/api/handlers.go
    - backend/cmd/server/main.go
  </files>
  <action>
    - Design an `APIHandler` struct holding the `MatchService`.
    - Implement `handleGetMatches(w, r)` calling `svc.GetTodayUnstartedMatches()` and rendering JSON output via `json.NewEncoder`.
    - Implement `handleCreateMatch(w, r)` decoding JSON layout, delegating to `svc.CreateMatch(match)`, returning `201 Created` with the `{ "id": "<uuid>" }`.
    - Implement a `SetupRoutes(mux *http.ServeMux)` returning endpoints.
    - Mount `api.SetupRoutes` tightly inside `cmd/server/main.go`.
    - Validate `cors` middleware covers everything as before.
  </action>
  <verify>cd backend && go build ./cmd/server</verify>
  <done>API Routes are compiled and mapped to the business logic service handler cleanly.</done>
</task>

## Success Criteria
- [ ] POST `/api/match` is functional and delegates ID mapping down through `MatchService`.
- [ ] GET `/api/matches` automatically queries today's unstarted games cleanly.
- [ ] Nested Vue data-model representations are effectively shielded from SQLite representation logic.
