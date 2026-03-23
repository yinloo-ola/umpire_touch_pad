# Quick Task: @frontend/src/stores/

**Date:** 2026-03-23
**Branch:** gsd/quick/1-frontend-src-stores

## What Changed
- Removed hardcoded `const API_BASE = 'http://localhost:8080'` from `publicStore.js` and `adminStore.js`
- Replaced all `${API_BASE}/api/...` fetch calls with relative `/api/...` paths
- Fixed inline hardcoded `http://localhost:8080/api/...` URLs in `matchStore.js`

## Files Modified
- `frontend/src/stores/publicStore.js`
- `frontend/src/stores/adminStore.js`
- `frontend/src/stores/matchStore.js`

## Verification
- All 81 vitest unit tests pass (`npm test -- --run`)
