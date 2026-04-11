# Local Turso Dev — Design

## Problem

The dev server defaults to a local SQLite file (`file:sqlite.db`), which has subtle behavioral differences from the libSQL backend used in production (Turso). This creates a risk of production-only bugs.

## Solution

Use `turso dev` as the local database server, making the dev environment identical to production (same driver, same protocol). Remove the SQLite file fallback so the server errors out if `TURSO_DATABASE_URL` isn't set.

## Changes

### 1. `backend/cmd/server/main.go`
- Remove `file:sqlite.db` fallback. If `TURSO_DATABASE_URL` is empty, `log.Fatalf` with a message telling the user to run `turso dev`.
- Add startup log: `"Using database: <url> (driver: <driver>)"`.

### 2. `Makefile`
- Add `turso-dev` target: start `turso dev` in the background, wait for readiness (curl loop), export `TURSO_DATABASE_URL=http://127.0.0.1:8080`.
- Add `turso-stop` target: kill the background `turso dev` process.
- Update `dev` target to run `turso-dev`, `dev-frontend`, `dev-backend` with `-j3`.
- Export `TURSO_DATABASE_URL` for the backend process.

### 3. `AGENTS.md`
- Update "Commands" section: document `turso dev` as a prerequisite.
- Add "Local Development" section with setup instructions.

## No changes to tests
Tests continue using `modernc.org/sqlite` with `:memory:` — fast, self-contained, no external dependencies.
