# Project Learnings

## 2026-04-03: Match Lock Implementation (PR #2)

### SQLite Specifics

- **`UPDATE ... WHERE` with 0 matching rows does NOT return an error in SQLite.**
  sqlc's `:exec` won't detect this. Use `:execresult` and check `RowsAffected()`.
  Applied to: `TouchMatchLock` and `AcquireMatchLock`.

- **String comparison: `'2026-04-03' < '2026-04-03T00:00:00'`** in SQLite.
  Period queries (`WHERE scheduled_date >= '2026-04-03'`) will miss date-only values
  like `CURRENT_TIMESTAMP`. Always use full ISO timestamps (`2026-04-03T12:00:00`)
  in test seed data, or use `time.Now().Format("2006-01-02T15:04:05")` to avoid
  date rollover brittleness.

### Go Testing

- **`r.PathValue("id")` requires a registered route** on `http.ServeMux`.
  You can't call handlers directly — must use `httptest.NewRequest` with a path
  that matches a registered pattern.

- **Test DB schema duplication**: Extract shared helpers into a `testhelpers_test.go`
  file in the same package. Functions like `openTestDB()`, `seedTestMatch()`,
  `newTestMatchService()` eliminate 3x copy-paste of DDL.

### Frontend / Vitest

- **`window.alert` is not defined in vitest's jsdom environment.**
  Must mock with `globalThis.alert = vi.fn()` in tests.

- **Optional chaining for `$router`**: `this.$router?.push('/')` — Pinia stores
  don't always have `$router` injected (depends on how the store is created).

### Architecture

- **Context propagation**: Pass `ctx context.Context` through service methods
  rather than creating `context.Background()` internally. Enables proper
  cancellation and timeout propagation.

- **Lock expiry in SQL**: SQLite can't reference Go constants, so lock expiry
  (30s) is embedded as `'-30 seconds'` in `query.sql`. Mitigate with:
  - A Go `const LockExpiry` documenting the value
  - SQL references to this constant
  - Manual sync between Go/SQL

### 2026-04-04: Cloud Run + Turso Infrastructure (PR #3)

- **Go 1.24 `embed` with directories**: Embedding a directory (`//go:embed dist`) requires `fs.Sub(StaticFS, "dist")` if you want to serve its content from the root (`/`). This ensures path prefixing works correctly for static file serving.
- **LibSQL for Go**: The `libsql` driver is mostly compatible with `sqlite` driver logic. However, when appending the `authToken` to the `dbURL`, care must be taken if the URL already contains existing query parameters. Using `strings.Contains(dbURL, "?")` to choose between `?` or `&` is a simple fix, but `net/url` is more robust.
- **WIF for Deployment**: Using Google Cloud Workload Identity Federation (WIF) for GitHub Actions is the modern, secure alternative to long-lived service account keys. It provides short-lived tokens and eliminates the need to manage secret key files in CI/CD.
- **Multi-stage Docker Builds**: Combining Node.js (Frontend) and Go (Backend) builds into a single multi-stage Dockerfile is highly efficient for single-binary deployments. The final image should be a minimal runtime (like `debian:bookworm-slim` or `alpine`) for production readiness.
