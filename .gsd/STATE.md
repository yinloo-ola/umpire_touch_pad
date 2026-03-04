## Current Position
- **Phase**: 2 (maintenance)
- **Task**: Auth/Redirection Bug Fix
- **Status**: Fixed & Verified

## Last Session Summary
Fixed issue where umpires were not redirected to login and saw 401 errors on the match list.

**Changes:**
- Guarded all frontend routes (`/`, `/setup`, `/scoring`) in `router/index.js`.
- Implemented role-based redirection and `redirect` query param handling in `AdminLogin.vue`.
- Migrated `MatchList.vue` to use authenticated `adminStore.fetchMatches()`.
- Updated Login UI to be more generic ("Umpire Portal").

## Next Steps
1. Proceed to Phase 3: Live Match Sync API & Touchpad Integration
2. `/plan 3` — create execution plans, or `/execute 3` if plans exist
