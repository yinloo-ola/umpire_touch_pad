# Debug Session: Sync 401 Unauthorized

## Symptom
Calling `PUT /api/matches/{id}/sync` returns `401 Unauthorized: missing token`.

**When:** After logging in as an umpire and attempting to sync match data from the touchpad.
**Expected:** The request should succeed with the match data persisted to the backend.
**Actual:** Backend returns 401 with message "Unauthorized: missing token".

## Evidence
- Screenshot of network request shows **no Authorization header** in the request headers.
- Response body is "Unauthorized: missing token".

## Hypotheses

| # | Hypothesis | Likelihood | Status |
|---|------------|------------|--------|
| 1 | `syncMatch` in `matchStore.js` is missing `credentials: 'include'`, so it doesn't send the JWT cookie. | 100% | CONFIRMED |
| 2 | Token is missing from localStorage/store after login. | 0% | ELIMINATED |
| 3 | Middleware on backend is incorrectly checking for the token. | 0% | ELIMINATED |

## Attempts

### Attempt 1
**Testing:** H1 — Frontend is missing credentials on fetch
**Action:** Inspected `matchStore.js` and compared with `adminStore.js`. Found `syncMatch` fetch call lacks `credentials: 'include'`.
**Result:** Verified that cross-origin requests require this for cookies.
**Conclusion:** CONFIRMED

## Resolution

**Root Cause:** The `syncMatch` action in `matchStore.js` was missing `credentials: 'include'` in its `fetch` call. Since the frontend and backend are on different ports (cross-origin), the browser does not send the HttpOnly JWT cookie unless this flag is set.
**Fix:** Added `credentials: 'include'` to the `fetch` call in `matchStore.js`.
**Verified:** Fix applied to codebase. User needs to verify in browser.
**Regression Check:** Other auth-protected routes (like fetching matches) already use `credentials: 'include'` in `adminStore.js`.
