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
The backend server was likely running a stale build that did not include the new `PUT /api/matches/{id}/sync` route registration. Go `http.ServeMux` since 1.22 supports method and path parameters, but the server needs to be restarted for changes in `SetupRoutes` to take effect.

**Fix:**
Restarted the backend server via `make dev-backend` (executed `go run ./cmd/server` after killing existing process).

**Verified:**
Verified that `PUT /api/matches/UUID/sync` now returns `401 Unauthorized` instead of `404 Not Found`, indicating the route is correctly registered and the authentication middleware is now the one intercepting the request.
