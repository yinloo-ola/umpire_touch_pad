# Plan 2.1 Summary: Admin Routing & Dashboard Setup

## Status: ✅ Complete

## What was done

### Task 1: Admin Store & Auth Logic
- Created `frontend/src/stores/adminStore.js` (Pinia):
  - `isAuthenticated` ref, `role` ref, `matches` ref
  - `login(username, password)` — POSTs to `/api/login` with `credentials: 'include'`
  - `logout()` — POSTs to `/api/logout`, resets state
  - `fetchMatches()` — GETs `/api/matches` with credentials
  - `createMatch(payload)` — POSTs to `/api/match` with payload
- Created `frontend/src/components/admin/AdminLogin.vue`:
  - Dark glassmorphism login page
  - Username/password form with validation and error display
  - Redirects to `/admin/dashboard` on success

### Task 2: Admin Layout & Dashboard Structure
- Created `frontend/src/components/admin/AdminLayout.vue`:
  - Sticky top navigation bar with brand, nav links (Dashboard, New Match), exit/logout actions
  - Active route highlighting via `router-link-active`
  - `<router-view />` for hosting admin sub-pages
- Created `frontend/src/components/admin/AdminDashboard.vue`:
  - Calls `adminStore.fetchMatches()` on mount
  - Table view of matches (event, type, time, teams, status) with loading/error/empty states
  - Each row links to `/admin/match/{id}`

### Task 3: Register Admin Routes & Guards
- Updated `frontend/src/router/index.js`:
  - `/admin/login` → `AdminLogin`
  - `/admin` → `AdminLayout` (redirects to `/admin/dashboard`)
    - children: `dashboard` → `AdminDashboard`, `match/new` → `AdminMatchForm`, `match/:id` → `AdminMatchDetail`
  - `router.beforeEach` redirects unauthenticated users to `/admin/login`

## Verification
- `ls frontend/src/stores/adminStore.js frontend/src/components/admin/AdminLogin.vue` ✅
- `ls frontend/src/components/admin/AdminLayout.vue frontend/src/components/admin/AdminDashboard.vue` ✅  
- `grep "beforeEach" frontend/src/router/index.js` ✅

## Success Criteria
- [x] Unauthorized users attempting to hit `/admin` are redirected to `/admin/login`
- [x] Top-nav `AdminLayout` cleanly displays the `AdminDashboard`
- [x] `AdminDashboard` renders fetched list of stored matches from `adminStore`
