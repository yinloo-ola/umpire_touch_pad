# S03: Public Viewer Page

**Goal:** Build a public-facing match viewer page at `/public` that displays tournament matches in a WTT-inspired tabbed layout, with filters and manual refresh, working responsively on mobile/tablet/desktop.

**Demo:** Visitor opens `/public` in a browser (no login), sees matches organized in Completed/Scheduled/Live tabs, filters by table number and time, clicks refresh to update scores with a last-updated timestamp. Works at 375px, 768px, and 1280px+ viewports.

## Must-Haves

- `/public` route accessible without authentication
- Tabbed layout with Completed, Scheduled, and Live tabs
- Match cards showing title, table number, teams with countries, game scores
- Filter by table number dropdown
- Filter by time (Today/Upcoming)
- Refresh button with last-updated timestamp
- Responsive layout: mobile (375px, 1 column), tablet (768px, 2 columns), desktop (1280px+, 3 columns)
- WTT-inspired visual design distinct from admin/umpire interfaces

## Proof Level

- This slice proves: integration (frontend consuming real public API, no mocks)
- Real runtime required: yes (browser + backend)
- Human/UAT required: yes (visual verification on multiple viewports)

## Verification

- `curl http://localhost:8080/api/public/matches | jq` returns correct shape (S02 verification, already passing)
- Browser: navigate to `http://localhost:5173/public` without login — page loads
- Browser: tabs switch correctly between Completed/Scheduled/Live
- Browser: table filter dropdown filters matches
- Browser: refresh button updates lastUpdated timestamp
- Browser DevTools: test at 375px, 768px, 1280px viewports — cards reflow correctly
- Incognito window: `/public` loads without authentication prompt

## Observability / Diagnostics

- Runtime signals: Console logs on fetch success/failure, timestamp updates on refresh
- Inspection surfaces: Browser DevTools network tab shows `/api/public/matches` requests; Vue DevTools shows publicStore state
- Failure visibility: Error state displayed in UI with retry option; console.error on fetch failure
- Redaction constraints: None (public endpoint, no secrets)

## Integration Closure

- Upstream surfaces consumed: `GET /api/public/matches` from S02 (returns `{completed: [...], scheduled: [...], live: [...]}`)
- New wiring introduced: `/public` route in Vue Router (no auth guard), `publicStore.js` for data fetching, `PublicView.vue` component
- What remains before the milestone is truly usable end-to-end: Nothing — this is the final slice

## Tasks

- [x] **T01: Add public route and Pinia store** `est:30m`
  - Why: Establishes the entry point and data layer for the public viewer. Without this, the page cannot be accessed or fetch data.
  - Files: `frontend/src/router/index.js`, `frontend/src/stores/publicStore.js`
  - Do: Add `/public` route outside `/admin` and `/umpire` prefixes (no auth guard). Create publicStore with fetchPublicMatches() method that calls `/api/public/matches`, stores response in `completed`, `scheduled`, `live` refs, and tracks `lastUpdated` timestamp. Add `refresh()` method.
  - Verify: `npm run build` succeeds. Navigate to `/public` in browser without login — blank page loads (no auth redirect).
  - Done when: Route is accessible without auth; store can fetch and cache public match data with timestamp.

- [x] **T02: Build PublicView with tabs, filters, and match cards** `est:1.5h`
  - Why: Implements the core UI that displays matches, allows filtering, and supports manual refresh. This is the user-facing functionality.
  - Files: `frontend/src/views/public/PublicView.vue`, `frontend/src/stores/publicStore.js` (minor updates if needed)
  - Do: Create PublicView.vue with:
    - Header with title and refresh button (shows lastUpdated timestamp)
    - Filter bar with table number dropdown and time filter (Today/Upcoming)
    - Three tabs: Completed, Scheduled, Live — clicking switches active tab
    - Match card grid showing cards for active tab
    - Each card displays: title, table number, team1 vs team2 with countries, game scores (aggregate "4-1" for completed, current game for live), individual game breakdown
    - Empty state message when no matches in active tab
    - Loading state while fetching
    - Error state with retry button
  - Verify: Navigate to `/public`, see matches in tabs, switch tabs, filter by table, click refresh and see timestamp update.
  - Done when: All tabs display correct matches; filters work; refresh updates timestamp; empty/loading/error states render correctly.

- [x] **T03: Responsive layout and WTT-inspired styling** `est:1h`
  - Why: R003 requires responsive design (mobile/tablet/desktop) and WTT-style aesthetics. This task polishes the visual design.
  - Files: `frontend/src/views/public/PublicView.vue`, `frontend/src/style.css` (optional CSS variable additions)
  - Do: Apply mobile-first responsive design using CSS Grid:
    - 375px: 1 column, compact cards, stacked filters
    - 768px: 2 columns, expanded cards
    - 1280px+: 3 columns, full-width layout
  - Style with WTT-inspired aesthetics:
    - Lighter, spectator-friendly color scheme (distinguish from admin/umpire dark interface)
    - Card design with subtle shadows, rounded corners, hover effects
    - Clean typography with clear hierarchy
    - Status indicators with color coding
  - Load and follow the frontend-design skill for WTT-inspired visual direction.
  - Verify: Browser DevTools at 375px, 768px, 1280px viewports — cards reflow correctly, no horizontal scroll, text readable. Visual match against WTT reference (clean, professional, spectator-focused).
  - Done when: Page renders correctly at all three viewports; design is polished and WTT-inspired; no layout issues.

## Files Likely Touched

- `frontend/src/router/index.js` — Add `/public` route
- `frontend/src/stores/publicStore.js` — New file for public data fetching
- `frontend/src/views/public/PublicView.vue` — New file for public viewer page
- `frontend/src/style.css` — Optional CSS variable additions for public page theming
