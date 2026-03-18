---
estimated_steps: 6
estimated_files: 2
---

# T02: Build PublicView with tabs, filters, and match cards

**Slice:** S03 — Public Viewer Page
**Milestone:** M001

## Description

Build the full public viewer UI with tabbed navigation (Completed/Scheduled/Live), filter controls (table number, time), match cards displaying team and score information, and a refresh button with last-updated timestamp.

## Steps

1. **Add header section**:
   - Title: "Tournament Matches" or similar
   - Refresh button (icon + "Refresh" text)
   - Last updated timestamp display: "Last updated: HH:MM:SS" (formatted from store's `lastUpdated`)
   - On click refresh button: call `publicStore.refresh()`

2. **Add filter bar**:
   - Table number dropdown:
     - Options: "All Tables", then each unique table number from current matches
     - Compute available tables from combined `completed + scheduled + live` arrays
     - Handle `tableNumber: 0` gracefully (show as "Unassigned" or exclude from dropdown)
   - Time filter dropdown:
     - Options: "All", "Today", "Upcoming"
     - "Today": matches with `scheduledDate` today
     - "Upcoming": matches with `scheduledDate` in the future
   - Store filter values in component refs: `tableFilter`, `timeFilter`

3. **Add tab navigation**:
   - Three tabs: "Completed", "Scheduled", "Live"
   - Show count badge on each tab (e.g., "Completed (5)")
   - Active tab has distinct styling
   - Store active tab in component ref: `activeTab` (values: 'completed', 'scheduled', 'live')

4. **Build match card component logic**:
   - For active tab, filter matches by `tableFilter` and `timeFilter`
   - Each match card displays:
     - Match title (e.g., "Men's Singles - Final")
     - Table number badge
     - Team 1: player name(s) with country code(s)
     - "vs" divider
     - Team 2: player name(s) with country code(s)
     - Game score summary: for completed, show aggregate (e.g., "4-1"); for live, show current game score
     - Individual game scores: small row showing each game's score (e.g., "11-5, 11-8, 8-11, 11-9")
   - Handle singles vs doubles: singles shows one player per team, doubles shows two

5. **Add state handling**:
   - Loading state: show spinner or "Loading matches..." while `publicStore.loading === true`
   - Empty state: show "No [completed/scheduled/live] matches" when filtered array is empty
   - Error state: show error message with retry button when `publicStore.error` is set

6. **Wire up onMount**:
   - Call `publicStore.fetchPublicMatches()` on component mount
   - Ensure data loads before UI renders

## Must-Haves

- [ ] Three tabs (Completed/Scheduled/Live) with count badges, switchable
- [ ] Table number filter dropdown that filters matches
- [ ] Time filter dropdown (All/Today/Upcoming)
- [ ] Match cards with title, table, teams, countries, scores
- [ ] Refresh button that updates data and timestamp
- [ ] Loading, empty, and error states

## Verification

- Navigate to `/public`, see matches load
- Click each tab — correct matches appear
- Select table filter — matches filtered to that table
- Select time filter — matches filtered correctly
- Click refresh — timestamp updates, network request fires
- Empty tab shows "No matches" message

## Inputs

- `frontend/src/stores/publicStore.js` — Provides `completed`, `scheduled`, `live`, `lastUpdated`, `loading`, `error`, `refresh()`
- S02 API response shape — Each match has: `id`, `title`, `scheduledDate`, `status`, `tableNumber`, `team1: [{name, country}]`, `team2: [{name, country}]`, `games: [{gameNumber, team1Score, team2Score, status}]`
- `frontend/src/views/umpire/MatchListView.vue` — Reference for filter dropdown pattern, status badge styling

## Expected Output

- `frontend/src/views/public/PublicView.vue` — Full component with tabs, filters, cards, refresh
- Basic styling applied (responsive polish in T03)

## Observability Impact

- Signals added/changed: Console log on fetch success/failure; timestamp updates on refresh
- How a future agent inspects this: Browser DevTools network tab shows `/api/public/matches` requests; Vue DevTools shows publicStore state
- Failure state exposed: Error message in UI with retry button; `publicStore.error` contains error string
