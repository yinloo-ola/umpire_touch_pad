# Quick Task: when the frontend calls API, they should use relative path @frontend/src/stores/ 
ensure vite is proxied to the correct backend port during dev

**Date:** 2026-03-23
**Branch:** gsd/quick/2-when-the-frontend-calls-api-they-should

## What Changed
- Removed all hardcoded `http://localhost:8080` absolute URLs from stores and views — replaced with relative `/api/...` paths
- Added Vite dev server proxy in `vite.config.js`: `/api` → `http://localhost:8080` with `changeOrigin: true`
- Fixed hardcoded URLs in `frontend/src/views/admin/MatchDetailView.vue`

## Files Modified
- `frontend/src/stores/publicStore.js`
- `frontend/src/stores/adminStore.js`
- `frontend/src/stores/matchStore.js`
- `frontend/src/views/admin/MatchDetailView.vue`
- `frontend/vite.config.js`

## Verification
- All 81 vitest unit tests pass (`npm test -- --run`)
- Vite proxy config confirmed present in `vite.config.js`
