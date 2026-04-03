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
  - SQL comments cross-referencing the constant
  - Keep both in sync manually
