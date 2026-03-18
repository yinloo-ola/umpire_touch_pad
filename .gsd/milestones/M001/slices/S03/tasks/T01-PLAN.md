---
estimated_steps: 4
estimated_files: 2
---

# T01: Add public route and Pinia store

**Slice:** S03 — Public Viewer Page
**Milestone:** M001

## Description

Establish the entry point and data layer for the public viewer by adding a `/public` route that bypasses authentication and creating a Pinia store to fetch and cache match data from the public API endpoint created in S02.

## Steps

1. **Create publicStore.js** in `frontend/src/stores/`:
   - Define store with `defineStore('public', ...)`
   - Create refs: `completed`, `scheduled`, `live` (arrays), `lastUpdated` (Date|null), `loading` (boolean), `error` (string|null)
   - Implement `fetchPublicMatches()` that:
     - Sets `loading = true`, clears `error`
     - Calls `GET http://localhost:8080/api/public/matches` (no credentials needed)
     - On success: populates `completed`, `scheduled`, `live` from response, sets `lastUpdated = new Date()`
     - On failure: sets `error` with message
     - Always sets `loading = false`
   - Implement `refresh()` that calls `fetchPublicMatches()`
   - Pattern matches adminStore.js but without authentication

2. **Add /public route** to `frontend/src/router/index.js`:
   - Add route object as a sibling to `/umpire` and `/admin` (NOT nested)
   - Path: `/public`, name: `public`, component: dynamically import `../views/public/PublicView.vue`
   - The existing `beforeEach` guard only checks routes starting with `/admin` or `/umpire`, so this route will be publicly accessible

3. **Create placeholder PublicView.vue** in `frontend/src/views/public/`:
   - Minimal component that imports and uses publicStore
   - Call `fetchPublicMatches()` on mount
   - Display "Public Viewer" heading and "Loading..." or match count for each category
   - This ensures the route/store wiring works before T02 builds the full UI

4. **Verify the wiring**:
   - Run `npm run build` in frontend directory
   - Start dev server and navigate to `/public` without logging in
   - Confirm page loads (no redirect to login)
   - Check browser console for any errors

## Must-Haves

- [ ] `/public` route accessible without authentication (no redirect to login)
- [ ] publicStore fetches from `/api/public/matches` and stores response
- [ ] Store tracks `lastUpdated` timestamp
- [ ] Store handles loading and error states

## Verification

- `cd frontend && npm run build` succeeds without errors
- Navigate to `http://localhost:5173/public` in incognito window — page loads without login
- Vue DevTools shows publicStore with `completed`, `scheduled`, `live` arrays populated after fetch
- Network tab shows successful GET to `/api/public/matches`

## Inputs

- `frontend/src/router/index.js` — Current router config with auth guard pattern
- `frontend/src/stores/adminStore.js` — Reference for API fetch pattern
- S02 summary — Confirms API returns `{completed: [...], scheduled: [...], live: [...]}`

## Expected Output

- `frontend/src/router/index.js` — Updated with `/public` route
- `frontend/src/stores/publicStore.js` — New file with fetch logic and state
- `frontend/src/views/public/PublicView.vue` — New placeholder component
