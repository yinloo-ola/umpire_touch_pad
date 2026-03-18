---
id: M001
provides:
  - Standardized card type labels (Yellow/YR1/YR2/Red/Timeout) with gradient pill styling
  - Player name resolution in admin card editing UI
  - Unauthenticated GET /api/public/matches endpoint returning matches grouped by status
  - Public viewer page at /public with WTT-inspired responsive design
  - Tabbed match display with table/time filters and manual refresh
key_decisions:
  - D001 — Card types use standardized labels YR1/YR2 (not Yellow-Red/Yellow-Red-2) consistent with umpire UI
  - D003 — Player targets display actual player names from match data, not generic indices
  - D004 — No authentication required for public endpoint
  - D005 — Response grouped by status (completed, scheduled, live) to match UI tabs
  - D006 — Manual refresh button + last updated timestamp for public viewer
  - D007 — Routes not matching /admin or /umpire prefixes skip auth guard
  - D008 — Responsive breakpoints at 768px and 1280px
  - D009 — WTT-inspired color palette: navy header gradient, blue primary, status-specific accents
patterns_established:
  - Card type CSS class binding: c.cardType.toLowerCase().replace('-', '') produces yr1, yr2, red, yellow, timeout
  - Player name resolution via getPlayerName(teamIndex, playerIndex) with Coach/Team special indices
  - Public handlers in separate file from authenticated handlers
  - Route registration without RequireAuth() wrapper for public endpoints
  - Mobile-first CSS Grid with explicit 768px/1280px breakpoints
  - CSS custom properties for WTT-style theming
observability_surfaces:
  - Browser inspection of .card-pill elements shows computed gradient backgrounds for YR1/YR2
  - Console: [publicStore] Fetched matches: {completed: X, scheduled: Y, live: Z}
  - Backend logs: [handleGetPublicMatches] GET /api/public/matches - completed=X, scheduled=Y, live=Z
  - Direct curl: curl http://localhost:8080/api/public/matches | jq
requirement_outcomes:
  - id: R001
    from_status: active
    to_status: validated
    proof: Browser verification in S01 — card dropdown shows Yellow/YR1/YR2/Red/Timeout, YR1/YR2 have gradient pills, player names display instead of indices
  - id: R002
    from_status: active
    to_status: validated
    proof: Unit tests in S02 + curl verification + successful consumption by S03 public viewer — correct response shape, no auth required, empty buckets are [] not null
  - id: R003
    from_status: active
    to_status: validated
    proof: Browser automation in S03 — tabs switch correctly, filters work, refresh updates timestamp, responsive at 375px/768px/1280px, WTT-style design verified, no auth prompt in incognito
duration: 3h
verification_result: passed
completed_at: 2026-03-18
---

# M001: Match Management & Public Viewer

**Admin card editing with standardized types and player names, unauthenticated public API, and responsive WTT-style spectator viewer page.**

## What Happened

Completed three slices that together deliver a polished admin experience and a complete public-facing spectator interface:

**S01 — Admin Card Editing Polish:** Updated MatchDetailView.vue to use standardized card type labels (Yellow/YR1/YR2/Red/Timeout) instead of non-standard variants. Added gradient pill styling for YR1/YR2 cards using yellow-to-red linear gradients. Implemented player name resolution that displays actual player names from match data instead of generic "Player 1/2" indices, while preserving special labels for Coach (-1) and Team (-2) targets.

**S02 — Public Match API:** Created unauthenticated GET /api/public/matches endpoint using sqlc-generated queries with LEFT JOIN to fetch all matches and games efficiently. Response groups matches by status (completed/scheduled/live) to match the UI tab structure. Each match includes player names, countries, scores, table numbers, and game details. Empty status buckets return `[]` not `null` for consistent JSON handling.

**S03 — Public Viewer Page:** Built responsive spectator page at /public with WTT-inspired design. Implemented tabbed navigation (Completed/Scheduled/Live) with count badges, filter controls for table number and time period, and manual refresh with last-updated timestamp. Applied mobile-first CSS Grid layout with 768px/1280px breakpoints (1/2/3 columns). Used navy header gradient, blue primary, and status-specific accent colors. Route bypasses auth by not matching /admin or /umpire prefixes.

One deviation: S02 endpoint code was missing from the worktree despite being marked complete — implemented it inline during S03 to unblock verification.

## Cross-Slice Verification

All success criteria verified against live behavior:

| Criterion | Verification |
|-----------|--------------|
| Admin can edit cards with player names and standardized type labels (YR1, YR2) | ✅ Browser testing in S01: card dropdown shows Yellow/YR1/YR2/Red/Timeout, YR1/YR2 have gradient pills, player names display |
| Unauthenticated GET /api/public/matches returns matches grouped by status | ✅ S02 unit tests (5 passing) + curl verification + S03 successful consumption |
| Visitor can open /public, see tabbed layout, filter by table/time, refresh for updates | ✅ Browser automation in S03: tabs switch, filters work, refresh updates timestamp, no auth prompt |

Definition of done verified:

| DoD Item | Status |
|----------|--------|
| Admin card editing UI shows player names and standardized type labels | ✅ Verified S01 |
| Public API returns correct match data without authentication | ✅ Verified S02 |
| Public viewer page renders on mobile/tablet/desktop with WTT-style layout | ✅ Verified S03 at 375px/768px/1280px |
| Filters work and refresh updates displayed data | ✅ Verified S03 |
| Success criteria re-checked against live behavior in browser | ✅ All slices had browser verification |

## Requirement Changes

- **R001:** active → validated — Browser verification in S01 confirmed card dropdown shows correct types (Yellow/YR1/YR2/Red/Timeout), YR1/YR2 have gradient pills, player names display instead of indices
- **R002:** active → validated — Unit tests in S02 plus curl verification plus successful consumption by S03 public viewer confirmed correct response shape, no auth required, empty buckets are [] not null
- **R003:** active → validated — Browser automation in S03 confirmed tabs switch correctly, filters work, refresh updates timestamp, responsive at all three viewports, WTT-style design verified, no auth prompt in incognito window

## Forward Intelligence

### What the next milestone should know
- Card type values stored in database are: "Yellow", "YR1", "YR2", "Red", "Timeout" — downstream code should use these exact values
- Player name resolution uses `match.team1` and `match.team2` arrays with special indices -1 (Coach) and -2 (Team)
- Public API endpoint is at `/api/public/matches` and returns `{completed: [...], scheduled: [...], live: [...]}`
- Public viewer route `/public` bypasses auth by not matching `/admin` or `/umpire` prefixes in the router guard
- Responsive breakpoints are at 768px and 1280px (mobile-first CSS Grid)
- WTT-style theming uses CSS custom properties defined in PublicView.vue scoped styles

### What's fragile
- The public route depends on the router guard not matching `/public` prefix — any changes to guard logic need to preserve this exemption
- Player name fallback returns "Player N" when match data not loaded — acceptable for admin UI but public API handles more gracefully with proper resolution

### Authoritative diagnostics
- Browser dev tools → inspect `.card-pill` elements → computed `background` shows gradient for YR1/YR2
- Console: `[publicStore] Fetched matches: {completed: X, scheduled: Y, live: Z}` on successful fetch
- Backend logs: `[handleGetPublicMatches] GET /api/public/matches - completed=X, scheduled=Y, live=Z`
- Direct curl: `curl http://localhost:8080/api/public/matches | jq` for immediate API inspection

### What assumptions changed
- Assumed S02 endpoint existed in worktree (marked complete in roadmap), but files were missing — implemented inline during S03 to unblock verification
- Responsive design risk (WTT-style on mobile) was retired successfully — no major iteration needed, breakpoints and card sizing worked as planned

## Files Created/Modified

- `frontend/src/views/admin/MatchDetailView.vue` — Standardized card type dropdown; added CSS for YR1/YR2 gradient pills; added getPlayerName() and getPlayerOptions() helper functions; updated templates to use player names
- `backend/db/query.sql` — Added GetAllMatchesWithGames query with LEFT JOIN
- `backend/internal/store/querier.go` — Generated interface with new method (auto-generated)
- `backend/internal/store/query.sql.go` — Generated implementation (auto-generated)
- `backend/internal/service/match_svc.go` — Added PublicMatchResponse, PublicMatch, PublicPlayer, PublicGame structs and GetPublicMatches method
- `backend/internal/service/match_svc_test.go` — Added 5 unit tests for public API
- `backend/internal/api/public_handlers.go` — New file with handleGetPublicMatches handler
- `backend/internal/api/handlers.go` — Updated SetupRoutes to register public route without auth
- `frontend/src/router/index.js` — Added /public route with PublicView component
- `frontend/src/stores/publicStore.js` — New Pinia store for public match data
- `frontend/src/views/public/PublicView.vue` — Full public viewer component with tabs, filters, cards, responsive design
