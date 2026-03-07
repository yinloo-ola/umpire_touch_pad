# Debug Session: Missing Database Migrations

## Symptom
The current database initialization in `backend/cmd/server/main.go` uses `CREATE TABLE IF NOT EXISTS` with the contents of `db/schema.sql`. 
When the schema definition is updated (e.g., adding a new column), existing databases will not be updated automatically. 

**Expected:** The database schema should stay in sync with the code's data model across server restarts.
**Actual:** Structural changes to `schema.sql` are ignored if the table already exists, leading to "no such column" errors at runtime.

## Evidence
- `backend/cmd/server/main.go:L43-51` shows direct execution of `db/schema.sql`.
- SQL in `db/schema.sql` uses `CREATE TABLE IF NOT EXISTS`.
- Manual deletion of `sqlite.db` was required in previous tasks to apply schema updates.

## Hypotheses

| # | Hypothesis | Likelihood | Status |
|---|------------|------------|--------|
| 1 | Structural schema changes require manual DB deletion or ALTER statements. | 100% | CONFIRMED |
| 2 | Existing `sqlite.db` prevents `CREATE TABLE` from applying new column definitions. | 100% | CONFIRMED |

## Attempts

### Attempt 1
**Testing:** H1 — Implementing a simple migration mechanism using Goose.
**Action:** 
1.  Created `backend/db/migrations/` directory.
2.  Generated 3 versioned migrations (`00001`, `00002`, `00003`) representing the schema evolution.
3.  Added `github.com/pressly/goose/v3` to `go.mod`.
4.  Embedded migrations into the Go binary for portable deployment.
5.  Integrated Goose into `main.go` to auto-apply migrations on startup.
6.  Updated `sqlc.yaml` to point to the migrations folder as the schema source of truth.
7.  Deleted old `schema.sql` to avoid dual sources of truth.
**Result:** Migration system set up.
**Conclusion:** RESOLVED. 

## Resolution
The project now uses a versioned migration system powered by Goose. This is a common and professional way to handle Go project persistence with `sqlc`. Database structural changes are now automatically applied on server restart without data loss or manual intervention.
