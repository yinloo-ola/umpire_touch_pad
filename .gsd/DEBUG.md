# Debug Session: Auth/Redirection Issue

## Symptom
Navigating to the umpire page does not forward to the umpire login. An API call to `http://localhost:8080/api/matches` returns 401 Unauthorized.

**When:** During navigation to `/umpire` (presumed route).
**Expected:** Automatic redirection to login or display of login page if unauthorized.
**Actual:** Navigation occurs but API call fails with 401.

## Evidence

## Hypotheses

## Resolution

**Root Cause:** 
1. The root route (`/`) was not guarded in the frontend router, allowing unauthenticated users to access `MatchList.vue`.
2. `MatchList.vue` performed a direct `fetch` call without credentials (`credentials: 'include'`), causing the backend to return 401 Unauthorized even if a session existed.
3. `AdminLogin.vue` always redirected to the admin dashboard, breaking the flow for umpires.

**Fix:**
1. Updated `router/index.js` to guard all routes and redirect to `/admin/login` with a `redirect` query parameter.
2. Updated `AdminLogin.vue` to handle the `redirect` query parameter and perform role-based default redirection.
3. Updated `MatchList.vue` to use `adminStore.fetchMatches()` which correctly handles credentials and uses shared state.
4. Updated `AdminLogin.vue` UI to use more generic "Umpire Portal" titles.

**Verified:**
1. Confirmed unauthenticated users are redirected to `/admin/login`.
2. Confirmed logging in as `umpire`/`umpire123` redirects back to `/`.
3. Confirmed match list is correctly populated (no more 401).
4. Confirmed admins still get redirected to `/admin/dashboard`.

**Regression Check:**
- Admin dashboard still accessible and protected.
- Scoring and Setup routes are now also protected.
