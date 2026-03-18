---
id: T01
parent: S03
milestone: M001
provides:
  - Public route accessible without authentication
  - Pinia store for public match data with loading/error states
key_files:
  - frontend/src/router/index.js
  - frontend/src/stores/publicStore.js
  - frontend/src/views/public/PublicView.vue
key_decisions:
  - Pattern-matched adminStore for publicStore API fetch structure but without credentials
patterns_established:
  - Public routes bypass auth by not matching /admin or /umpire path prefixes in router guard
observability_surfaces:
  - Console logs on fetch success/failure from publicStore
  - Vue DevTools exposes publicStore state arrays and lastUpdated timestamp
  - Backend logs [GetPublicMatches] and [handleGetPublicMatches] with match counts
duration: 15m
verification_result: passed
completed_at: 2026-03-18
blocker_discovered: false
---

# T01: Add public route and Pinia store

**Added /public route with publicStore for unauthenticated match data access**

## What Happened

The task plan was already partially executed in a previous attempt. All three files existed and were correctly implemented:

1. **publicStore.js** — Pinia store with `completed`, `scheduled`, `live` arrays, `lastUpdated` timestamp, `loading` boolean, and `error` string. Implements `fetchPublicMatches()` that calls the public API endpoint without credentials, and `refresh()` as an alias.

2. **router/index.js** — Added `/public` route as a sibling to `/umpire` and `/admin` routes. The existing `beforeEach` guard only checks routes starting with `/admin` or `/umpire`, so the public route is accessible without authentication.

3. **PublicView.vue** — Placeholder component that calls `fetchPublicMatches()` on mount and displays match counts for each category with a last-updated timestamp.

Verification confirmed the wiring works:
- Build compiles without errors
- `/public` loads without login redirect (browser assertions pass)
- API fetch succeeds (backend logs show GET requests with correct data)
- Store populates arrays and sets lastUpdated timestamp

## Verification

- `cd frontend && npm run build` — succeeded, no errors
- Browser navigate to `http://localhost:5173/public` — page loads without login redirect
- Browser assertions (5/5 pass): Public Viewer heading, match counts for all three categories, last updated timestamp visible
- Backend logs confirm API requests: `[handleGetPublicMatches] GET /api/public/matches - completed=0, scheduled=1, live=0`
- curl to `http://localhost:8080/api/public/matches` returns correct JSON shape

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `cd frontend && npm run build` | 0 | ✅ pass | ~1s |
| 2 | `curl -s http://localhost:8080/api/public/matches` | 0 | ✅ pass | ~0.1s |
| 3 | browser_assert (5 checks) | 0 | ✅ pass | ~0.5s |

## Diagnostics

- **Console logs:** `[publicStore] Fetched matches: {completed: X, scheduled: Y, live: Z}` on success, `[publicStore] Fetch failed: <error>` on failure
- **Vue DevTools:** publicStore exposes `completed`, `scheduled`, `live` arrays, `loading`, `error`, and `lastUpdated` timestamp
- **Backend logs:** `[GetPublicMatches]` and `[handleGetPublicMatches]` with match counts per category
- **Network tab:** Filter by `public/matches` to see request/response payloads

## Deviations

None. Implementation matched the task plan exactly.

## Known Issues

None.

## Files Created/Modified

- `frontend/src/stores/publicStore.js` — New Pinia store for public match data with fetch logic and state management
- `frontend/src/router/index.js` — Added `/public` route with dynamic import of PublicView component
- `frontend/src/views/public/PublicView.vue` — New placeholder component displaying match counts and last-updated timestamp
