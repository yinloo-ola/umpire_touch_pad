---
id: T02
parent: S03
milestone: M001
provides:
  - Public viewer page with tabbed match display
  - Filter controls for table number and time
  - Match cards with team info and scores
  - Manual refresh with timestamp
key_files:
  - frontend/src/views/public/PublicView.vue
  - frontend/src/stores/publicStore.js
  - frontend/src/router/index.js
  - backend/internal/api/public_handlers.go
  - backend/internal/service/match_svc.go
key_decisions:
  - Implemented S02 backend endpoint inline to unblock frontend verification (endpoint was missing from worktree)
  - Used CSS Grid for responsive card layout (1/2/3 columns at mobile/tablet/desktop)
  - Aggregate score counts games where team leads, not just completed games (shows current leader)
patterns_established:
  - Public routes bypass auth by not matching /admin or /umpire prefixes
  - Public API returns matches grouped by status (completed/scheduled/live)
  - Match cards support both singles and doubles with country codes
observability_surfaces:
  - Console log on fetch: `[publicStore] Fetched matches: {completed: X, scheduled: Y, live: Z}`
  - Console error on failure: `[publicStore] Fetch failed: <error>`
  - Backend logs: `[handleGetPublicMatches] GET /api/public/matches - completed=X, scheduled=Y, live=Z`
duration: 45m
verification_result: passed
completed_at: 2026-03-18
blocker_discovered: false
---

# T02: Build PublicView with tabs, filters, and match cards

**Built full public viewer UI with tabbed navigation, filter controls, match cards displaying teams/scores, and refresh functionality**

## What Happened

Implemented the complete PublicView component with all required features:

1. **Header section**: Title "Tournament Matches", refresh button with spinning icon during load, last-updated timestamp formatted as HH:MM:SS

2. **Filter bar**: Table number dropdown populated from all matches, time filter with All/Today/Upcoming options

3. **Tab navigation**: Three tabs (Completed/Scheduled/Live) with count badges, active styling, keyboard accessible

4. **Match cards**: Display title, table number badge, team players with country codes, "vs" divider, aggregate scores for completed/live matches, individual game scores, scheduled time for upcoming matches, live indicator with pulsing dot

5. **State handling**: Loading spinner while fetching, empty state message per tab, error state with retry button

6. **Backend endpoint**: Discovered S02 public endpoint was missing from worktree, implemented `GET /api/public/matches` with status grouping to unblock verification

The component uses CSS Grid for responsive layout: 1 column at 375px, 2 columns at 768px, 3 columns at 1280px+.

## Verification

All must-haves verified via browser automation:

- **Tabs**: All three tabs switchable with correct count badges (0, 1, 1 after test data)
- **Table filter**: Selecting Table 1 filters to just that table's matches
- **Time filter**: "Today" filters out tomorrow's scheduled match
- **Match cards**: Singles and doubles render correctly with player names, country codes, table badges
- **Refresh**: Clicking refresh updates timestamp and fires network request
- **Empty state**: Tab with no matches shows "No [status] matches" message
- **Responsive**: Tested at 375px (mobile), 768px (tablet), 1280px (desktop) - cards reflow correctly

Browser assertions passed (26 total checks across all tests).

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `cd frontend && npm run build` | 0 | ✅ pass | ~1s |
| 2 | `curl http://localhost:8080/api/public/matches` | 0 | ✅ pass | ~0.1s |
| 3 | browser_assert (8 checks - header elements) | 0 | ✅ pass | ~0.5s |
| 4 | browser_assert (12 checks - match card content) | 0 | ✅ pass | ~0.5s |
| 5 | browser_assert (6 checks - live match scores) | 0 | ✅ pass | ~0.5s |
| 6 | browser_assert (2 checks - completed match) | 0 | ✅ pass | ~0.3s |
| 7 | browser viewport tests (3 sizes) | 0 | ✅ pass | ~1s |

## Diagnostics

- **Console logs:** `[publicStore] Fetched matches: {completed: X, scheduled: Y, live: Z}` on success
- **Vue DevTools:** publicStore exposes `completed`, `scheduled`, `live` arrays, `loading`, `error`, `lastUpdated`
- **Network tab:** Filter by `public/matches` to see request/response payloads
- **Backend logs:** `[handleGetPublicMatches] GET /api/public/matches - completed=X, scheduled=Y, live=Z`

## Deviations

- **S02 backend endpoint**: Task plan assumed S02 endpoint existed (marked complete in plan), but files were missing from worktree. Implemented inline: `public_handlers.go`, updated `match_svc.go` with `GetPublicMatches`, registered route in `handlers.go`.

## Known Issues

None. All must-haves implemented and verified.

## Files Created/Modified

- `frontend/src/stores/publicStore.js` — Pinia store for public match data with fetch/refresh methods
- `frontend/src/router/index.js` — Added /public route with PublicView component
- `frontend/src/views/public/PublicView.vue` — Full component with tabs, filters, match cards, state handling
- `backend/internal/api/public_handlers.go` — New handler for GET /api/public/matches
- `backend/internal/service/match_svc.go` — Added GetPublicMatches method and response types
- `backend/internal/api/handlers.go` — Registered public route without auth
