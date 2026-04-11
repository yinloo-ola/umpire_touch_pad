# Umpire Touch Pad — Agent Guide

> Context file for AI coding agents working on this project.

## Project Overview

Table tennis umpire scoring application. Two-device mode lets one person manage the match (setup/scoring) while a second device shows a live touchpad for the umpire. Per-match locking prevents concurrent scoring from two tabs.

## Architecture

```
┌──────────────┐      ┌──────────────┐
│   Frontend   │      │   Backend    │
│   Vue 3 +    │ HTTP │   Go +       │
│   Pinia      ├─────►│   sqlc +     │
│              │ /api │   SQLite     │
└──────────────┘      └──────────────┘
```

### Monorepo Structure

```
backend/                  # Go 1.24 — sqlc + SQLite
  cmd/server/main.go      # Entry point, CORS, migration runner
  db/migrations/          # Goose SQL migrations (00001–00008)
  db/query.sql            # sqlc query definitions — source of truth for data layer
  sqlc.yaml               # sqlc config: engine=sqlite, package=store
  internal/
    store/                # sqlc-generated code (DO NOT EDIT MANUALLY)
      querier.go          # Querier interface
      query.sql.go        # Generated query implementations
      models.go           # Generated model structs
    api/                  # HTTP handlers
      handlers.go         # Match CRUD + sync + auth routes
      public_handlers.go  # Public display routes
      middleware.go       # Auth middleware
    service/              # Business logic
      match_svc.go        # Match scoring, lock orchestration, admin ops
      lock_svc.go         # Per-match locking (acquire/touch/release/prune)
      auth_svc.go         # JWT auth

frontend/                 # Vue 3 + Vite
  src/
    stores/               # Pinia stores
      matchStore.js       # Scoring state machine, sync loop, 409 handling
      adminStore.js       # Match management, auth
      publicStore.js      # Live display
    views/
      umpire/             # SetupView, MatchListView, TouchpadView
      admin/              # DashboardView, LoginView, MatchFormView, MatchDetailView
      public/             # PublicView
    lib/
      sessionId.js        # Per-tab UUID for X-Session-ID header
    router/index.js       # Vue Router
```

## Commands

**Prerequisites:** Install the Turso CLI (`brew install tursodatabase/tap/turso`). Local dev requires `turso dev` to be running — use `make dev` which starts it automatically.

All commands must run from the correct subdirectory. **The Go module is in `backend/`, not the repo root.**

```bash
# Backend
cd backend
go test ./... -count=1          # Run all tests (20 tests)
go test ./... -count=1 -v       # Verbose
go build ./...                  # Verify compilation
go run ./cmd/server             # Start dev server (port 8080)
sqlc generate                   # Regenerate store from query.sql

# Frontend
cd frontend
npm test                        # Run all tests (88 tests) via vitest
npm run build                   # Production build to dist/
npm run dev                     # Dev server (port 5173, proxies /api to :8080)
npm run lint                    # ESLint
npm run fmt                     # Prettier

# Root
make dev                        # Start both servers concurrently
make build                      # Build both
make test                       # Frontend tests only
make lint                       # Lint both
```

## Deployment (Cloud Run + Turso)

The application is deployed to Google Cloud Run and uses Turso for storage.

### Environment Variables

- `TURSO_DATABASE_URL`: Turso connection string (`libsql://...` or `https://...`)
- `TURSO_AUTH_TOKEN`: Turso auth token
- `PORT`: (Managed by Cloud Run, default 8080)

### GitHub Actions Secrets

- `GCP_PROJECT_ID`: Your Google Cloud Project ID
- `GCP_WIF_PROVIDER`: Workload Identity Provider ID
- `GCP_WIF_SA_EMAIL`: Service Account Email for WIF
- `TURSO_DATABASE_URL`: Production Turso URL
- `TURSO_AUTH_TOKEN`: Production Turso Auth Token

### Manual Build

```bash
docker build -t umpire-touch-pad .
```

## Data Layer (sqlc)

**Workflow:** Edit `backend/db/query.sql` → run `cd backend && sqlc generate` → generated code appears in `backend/internal/store/`.

- `:exec` → returns `error`
- `:one` → returns `(Model, error)`
- `:many` → returns `([]Model, error)`
- `:execresult` → returns `(sql.Result, error)` — use when you need `RowsAffected()`

**SQLite gotcha:** `UPDATE ... WHERE` with 0 matching rows returns no error. Use `:execresult` + `RowsAffected()` to detect this.

**SQLite gotcha:** String comparison `'2026-04-03'` < `'2026-04-03T00:00:00'`. Always use full ISO timestamps in test seed data, or `time.Now().Format("2006-01-02T15:04:05")`.

## Key Conventions

### Backend (Go)
- **No frameworks** — uses stdlib `net/http` with `http.ServeMux` (Go 1.22+ patterns)
- **Context propagation** — pass `ctx context.Context` through all service methods
- **Transaction pattern** — `MatchService.SyncMatch` opens a `sql.Tx`, wraps everything (including lock ops), commits at the end
- **Handler tests** — must use `http.ServeMux` because `r.PathValue("id")` requires registered route patterns. Can't call handlers directly.
- **Test helpers** — shared DB setup in `backend/internal/service/testhelpers_test.go`: `openTestDB()`, `seedTestMatch()`, `newTestMatchService()`
- **Migrations** — numbered `00001_*.sql` through `00008_*.sql`, run by Goose with embedded FS

### Frontend (Vue 3)
- **State management** — Pinia stores in `src/stores/`
- **Session identity** — `window.__umpireSessionId` (per-tab UUID) sent as `X-Session-ID` header on all `/api` calls
- **409 handling** — `matchStore.syncMatch` alerts and redirects to `/` on lock conflict
- **Router access** — stores may not have `$router` injected; use `this.$router?.push()`
- **Vitest** — `happy-dom` environment, globals enabled, setup in `vitest.setup.js`
- **Mocking `window.alert`** — jsdom doesn't define it; use `globalThis.alert = vi.fn()`
- **Test files** — colocated: `__tests__/` dirs next to source files

### Same-Origin

All frontend API calls use relative paths (`/api/...`). In dev, Vite proxies `/api` to `:8080` (same-origin). In production, the Go server serves the static frontend build directly. No CORS middleware needed.

If cross-origin access is ever required (e.g., embedding the scoreboard on an external site), re-add the `github.com/rs/cors` middleware.

## Match Locking

Per-match exclusive lock prevents two devices from scoring simultaneously.

- Lock acquired on first `SyncMatch` with status `starting`/`warming_up`/`in_progress`
- Lock touched on subsequent syncs from the same session
- Lock released when match reaches `completed`, or admin resets to `unstarted`
- Lock expires after 10 minutes of inactivity (pruned on each lock operation)
- `GetTodayMatches` filters out matches locked by other sessions (non-history mode)
- 409 Conflict returned when a different session tries to sync a locked match
- Lock expiry is `600s` — defined as Go `const LockExpiry` in `lock_svc.go` and as `'-600 seconds'` in `query.sql`. Keep in sync.

## Test Counts

| Suite | Tests | Location |
|-------|-------|----------|
| Backend service | 18 | `backend/internal/service/*_test.go` |
| Backend API | 2 | `backend/internal/api/handlers_test.go` |
| Frontend | 88 | `frontend/src/**/__tests__/*.test.js` |

## Common Pitfalls

1. **Running Go commands from repo root** — will fail. Always `cd backend` first.
2. **Editing generated store files** — changes are overwritten by `sqlc generate`. Edit `query.sql` instead.
3. **Hardcoded dates in tests** — will break after midnight. Use `time.Now()` or `t.Context()` deadlines.
4. **Forgetting `X-Session-ID` header** on new API calls — the backend won't filter locks correctly.
5. **SQLite `:exec` vs `:execresult`** — use `:execresult` when you need to know if rows were affected.
6. **Starting the backend without `turso dev`** — The server will exit with an error if `TURSO_DATABASE_URL` is not set. Use `make dev` which starts `turso dev` automatically, or run `turso dev` manually and set the env var.
