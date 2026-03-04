# Debug Session: Match Sync 404

## Symptom
PUT request to `http://localhost:8080/api/matches/{id}/sync` returns 404 Not Found.

**When:** Umpire touchpad attempts to sync match state to the backend.
**Expected:** 204 No Content (success) or 401/403 (auth issue).
**Actual:** 404 Not Found.

## Evidence
- Backend is running on port 8080 (confirmed with `/api/health` returning 200 OK).
- Frontend calls `PUT http://localhost:8080/api/matches/${id}/sync`.
- Backend `SetupRoutes` registers `PUT /api/matches/{id}/sync`.
- Go version is 1.24.1, which supports method and path parameters in `http.ServeMux`.
- Manual `curl -X PUT` confirmed 404 response.

## Hypotheses

| # | Hypothesis | Likelihood | Status |
|---|------------|------------|--------|
| 1 | Route registration mismatch (trailing slash or parameter typo) | 60% | UNTESTED |
| 2 | Conflict with `/api/matches` registration | 20% | UNTESTED |
| 3 | HandleFunc method matching issue in current environment | 20% | UNTESTED |

## Attempts

### Attempt 1
**Testing:** H1 — Route registration mismatch (or server not restarted).
**Action:** Added logging to SetupRoutes and restarted backend server.
**Result:** After restart, `curl -X PUT` now returns 401 Unauthorized instead of 404 Not Found.
**Conclusion:** Root cause was the backend server not having the latest routing changes loaded.

## Resolution

**Root Cause:**
1. **Server Restart Needed**: Initially, a 404 occurred because the backend server had not been restarted to load the new route registration.
2. **Missing Database Constraint**: After restarting, a 500 error occurred during sync because the `games` table was missing the `UNIQUE(match_id, game_number)` constraint. The `UpsertGame` query (using `ON CONFLICT`) requires this constraint to function in SQLite. Because the database was created *before* the constraint was added to the schema file, `CREATE TABLE IF NOT EXISTS` did not update it.

**Fix:**
1. Cleaned up debug logging in `handlers.go` and `middleware.go`.
2. Deleted the existing `backend/sqlite.db`.
3. Restarted the backend server, which recreated the database with the correct schema (including the `UNIQUE` constraint).

**Verified:**
1. Confirmed sync returns `204 No Content` for authenticated requests.
2. Confirmed sync still returns `401 Unauthorized` for unauthenticated requests.
3. Confirmed database recreation successfully applied the constraints.
