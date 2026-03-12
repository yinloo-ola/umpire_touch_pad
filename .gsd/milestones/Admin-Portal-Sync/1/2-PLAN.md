---
phase: 1
plan: 2
wave: 1
---

# Plan 1.2: Server Entrypoint & DB Wiring

## Objective
Wire up the `cmd/server/main.go` entrypoint, initialize the SQLite connection pool using ENV variables, and automatically apply the `schema.sql`.

## Context
- .gsd/ARCHITECTURE.md
- backend/main.go (existing flat structure)

## Tasks

<task type="auto">
  <name>Refactor Server Entrypoint (`cmd/server/main.go`)</name>
  <files>
    - backend/cmd/server/main.go
    - backend/main.go
  </files>
  <action>
    - Move `backend/main.go` to `backend/cmd/server/main.go`.
    - Update the imports to include `database/sql`, `os`, and `_ "modernc.org/sqlite"`.
    - Fetch DB path from `os.Getenv("DB_PATH")`, defaulting to `sqlite.db` in the local directory.
    - Fetch Port from `os.Getenv("PORT")`, defaulting to `8080`.
    - Use `sql.Open("sqlite", dbPath)` to connect.
    - Read `backend/db/schema.sql` from disk and execute it against the open connection `db.Exec(...)` to autoupdate/initialize tables on startup.
    - Strip out the old hardcoded endpoints for now, replacing them with a temporary placeholder or comment where `api.RegisterRoutes(mux)` will eventually spawn.
  </action>
  <verify>cd backend && go build -o umpire_backend ./cmd/server</verify>
  <done>cmd/server/main.go compiles and successfully connects/migrates the SQLite database upon startup.</done>
</task>

## Success Criteria
- [ ] Server configuration is driven by `os.Getenv` for dynamic injection.
- [ ] The `modernc.org/sqlite` database creates `sqlite.db` and bootstraps `schema.sql` automatically when the application boots.
