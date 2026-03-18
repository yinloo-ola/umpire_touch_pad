# S03: Public Viewer Page — Research

**Date:** 2026-03-18

## Summary

S03 builds a public-facing match viewer page at `/public` that displays tournament matches in a WTT-inspired tabbed layout. The page consumes the public API from S02 (`GET /api/public/matches`) which returns matches grouped by status (completed, scheduled, live). The primary challenge is responsive design — the page must work on mobile (375px), tablet (768px), and desktop (1280px+) viewports with a card-based layout that adapts gracefully.

The implementation is straightforward: create a new Vue view with a Pinia store for data fetching, add the route without authentication guards, and build responsive match cards with filters. The existing codebase provides clear patterns to follow (Vue 3 SFCs, Pinia stores, CSS variables, glass-panel styling).

## Recommendation

Follow mobile-first responsive design with CSS Grid for the match card layout. Create three new files:
1. `PublicView.vue` — the main page component with tabs, filters, and match cards
2. `publicStore.js` — Pinia store for fetching and caching public match data
3. Add `/public` route to router without authentication guard

Style with the existing CSS variable system (glass-panel, primary/accent colors) but add a lighter, spectator-friendly variant that distinguishes the public page from the admin/umpire interfaces. Use the frontend-design skill for WTT-inspired aesthetics.

## Implementation Landscape

### Key Files

- `frontend/src/router/index.js` — Add `/public` route without auth guard (pattern: route outside `/admin` and `/umpire` prefixes, no `beforeEach` check)
- `frontend/src/stores/adminStore.js` — Reference for API fetch pattern (API_BASE constant, async fetch, error handling)
- `frontend/src/views/umpire/MatchListView.vue` — Reference for match table rendering, filter dropdown pattern, status badge styling
- `frontend/src/style.css` — CSS variables, glass-panel, status-badge patterns to extend
- `.gsd/worktrees/M001/backend/internal/service/match_svc.go` (lines 608-700) — PublicMatchResponse/PublicMatch/PublicPlayer/PublicGame structs defining API shape
- `.gsd/worktrees/M001/backend/internal/api/public_handlers.go` — Public handler at `/api/public/matches`

### API Response Shape (from S02)

```json
{
  "completed": [
    {
      "id": "uuid",
      "title": "Men's Singles - Final",
      "scheduledDate": "2026-03-18T14:00:00",
      "status": "completed",
      "tableNumber": 1,
      "team1": [{"name": "Felix LEBRUN", "country": "FRA"}],
      "team2": [{"name": "WEN Ruibo", "country": "CHN"}],
      "games": [
        {"gameNumber": 1, "team1Score": 11, "team2Score": 5, "status": "completed"},
        {"gameNumber": 2, "team1Score": 11, "team2Score": 8, "status": "completed"}
      ]
    }
  ],
  "scheduled": [...],
  "live": [...]
}
```

### Build Order

1. **Add route first** — `/public` in router without auth guard. This is a 5-minute change that establishes the entry point.
2. **Create publicStore.js** — Fetches from `/api/public/matches`, stores response with `lastUpdated` timestamp. Include a `refresh()` method for manual refresh button.
3. **Build PublicView.vue skeleton** — Tabs (Completed/Scheduled/Live), filter dropdowns (table number, time), refresh button with timestamp. No styling yet.
4. **Style match cards** — Mobile-first card layout with responsive grid. Each card shows title, table number, teams with countries, game scores (e.g., "4-1" for completed, current game for live), and individual game scores.
5. **Add responsive breakpoints** — 375px (1 column), 768px (2 columns), 1280px+ (3 columns). Use CSS Grid with `auto-fit` or explicit media queries.
6. **Final polish** — Last-updated timestamp, loading states, empty state messaging, hover effects on cards.

### Verification Approach

1. **API integration**: `curl http://localhost:8080/api/public/matches | jq` confirms backend returns correct shape
2. **Browser verification**: Navigate to `http://localhost:5173/public`, verify tabs switch, filters work, refresh button updates timestamp
3. **Responsive testing**: Use browser DevTools to test at 375px, 768px, 1280px viewports — cards should reflow correctly
4. **No auth required**: Open incognito window, navigate to `/public` — should load without login

## Don't Hand-Roll

| Problem | Existing Solution | Why Use It |
|---------|------------------|------------|
| Responsive layout | CSS Grid + media queries (responsive-design skill) | Mobile-first pattern with standard breakpoints |
| Match display | Status badges, player name formatting from MatchListView.vue | Consistent styling with existing admin/umpire UI |
| API fetch pattern | adminStore.js with API_BASE constant | Same origin, same error handling |

## Constraints

- **No authentication** — The `/public` route must not trigger the router's `beforeEach` auth check. Add it as a top-level route outside `/admin` and `/umpire` prefixes.
- **CORS** — Public API already returns proper CORS headers from S02; frontend fetch should work without changes.
- **Timestamp display** — D006 specifies manual refresh + last updated timestamp. No auto-refresh or polling.
- **Table numbers** — Currently many matches have `tableNumber: 0` (data issue noted in S02 summary). Filter should handle this gracefully (show "Unassigned" or exclude from filter options).

## Common Pitfalls

- **Forgetting to bypass auth guard** — The router's `beforeEach` checks all routes starting with `/admin` or `/umpire`. The `/public` route must be a sibling, not a child.
- **Empty state handling** — API returns `[]` for empty buckets, not `null`. Ensure UI handles empty arrays correctly (show "No matches" message).
- **Time filtering complexity** — Filtering by scheduled time requires parsing `scheduledDate` strings. Consider a simple "Today/Upcoming" filter instead of complex date pickers.
- **Game score display** — For completed matches, show aggregate score (e.g., "4-1" games won). For live matches, show current game score. Requires conditional rendering based on match status.

## Open Risks

- **WTT visual fidelity** — Matching WTT's exact aesthetic may require iteration. The reference shows player avatars, rankings, and detailed game-by-game scores. We may need to simplify for MVP (no avatars, simplified scores).
- **Mobile card density** — Fitting team names, countries, and game scores on 375px screens may require truncation or a "tap to expand" pattern.

## Skills Discovered

| Technology | Skill | Status |
|------------|-------|--------|
| Responsive CSS | responsive-design | installed (project-level) |
| Frontend aesthetics | frontend-design | installed (user-level) |
