---
phase: 1
plan: 1
wave: 1
---

# Plan 1.1: Database Schemas & `sqlc` Generation

## Objective
Establish the Clean Architecture schema and generate the database access layer (`internal/store`) using `sqlc`.

## Context
- .gsd/ARCHITECTURE.md
- .gsd/DECISIONS.md
- .gsd/phases/1/RESEARCH.md

## Tasks

<task type="auto">
  <name>Initialize DB Folders and `sqlc.yaml`</name>
  <files>
    - backend/db/schema.sql
    - backend/db/query.sql
    - backend/sqlc.yaml
  </files>
  <action>
    - Create `db` and `internal/store` directories within `backend/`.
    - Create `backend/sqlc.yaml` configuring `engine: sqlite`, `schema: db/schema.sql`, `queries: db/query.sql`, `out: internal/store`, and `package: store` with `emit_interface: true` and `emit_json_tags: true`.
    - In `schema.sql`, write the `CREATE TABLE IF NOT EXISTS` schemas for `matches`, `games`, and `cards` (as decided in DECISIONS.md). Ensure datatypes match the flattened fields (`team1_p1_name TEXT NOT NULL`, etc.).
    - In `query.sql`, write the `sqlc` queries::
      - `-- name: CreateMatch :exec` (INSERT INTO matches... returning nothing to stay compliant with simple exec if ID is provided beforehand)
      - `-- name: GetUnstartedMatchesForPeriod :many` (SELECT * FROM matches WHERE status='unstarted' AND scheduled_date >= ? AND scheduled_date <= ?;)
  </action>
  <verify>ls backend/sqlc.yaml backend/db/schema.sql backend/db/query.sql</verify>
  <done>sqlc configuration files and SQL statements exist.</done>
</task>

<task type="auto">
  <name>Generate `sqlc` Datastore</name>
  <files>
    - backend/internal/store/models.go
    - backend/internal/store/query.sql.go
  </files>
  <action>
    - Execute `cd backend && sqlc generate`.
    - Run `go get github.com/google/uuid` and `modernc.org/sqlite` so the generated structures can be backed.
  </action>
  <verify>test -f backend/internal/store/models.go && cd backend && go build ./internal/store</verify>
  <done>sqlc correctly generated the golang implementation inside internal/store without compilation errors.</done>
</task>

## Success Criteria
- [ ] `schema.sql` and `query.sql` are written correctly.
- [ ] `sqlc generate` succeeds and populates `internal/store`.
