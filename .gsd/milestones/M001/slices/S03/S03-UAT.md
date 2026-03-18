# S03: Public Viewer Page — UAT

**Milestone:** M001
**Written:** 2026-03-18

## UAT Type

- UAT mode: live-runtime
- Why this mode is sufficient: The slice is a user-facing web page that must be verified in a real browser with the backend running. All features (tabs, filters, refresh, responsive layout) require live interaction to validate.

## Preconditions

1. Backend server running on port 8080 (`cd backend && go run ./cmd/server`)
2. Frontend dev server running on port 5173 (`cd frontend && npm run dev`)
3. At least one match exists in each status category (completed, scheduled, live) for meaningful testing
4. Browser with DevTools available for viewport testing

## Smoke Test

1. Open `http://localhost:5173/public` in an incognito/private window
2. **Expected:** Page loads without authentication prompt, shows "Tournament Matches" heading

## Test Cases

### 1. Tab Navigation

1. Observe the three tabs at the top: Completed, Scheduled, Live
2. Note the count badges on each tab
3. Click "Scheduled" tab
4. **Expected:** Scheduled matches display, "Scheduled" tab shows active styling
5. Click "Live" tab
6. **Expected:** Live matches display (or empty state if none), "Live" tab shows active styling
7. Click "Completed" tab
8. **Expected:** Completed matches display, "Completed" tab shows active styling

### 2. Table Filter

1. Note the Table dropdown shows "All Tables" by default
2. Click the Table dropdown and select "Table 1"
3. **Expected:** Only matches at Table 1 are shown
4. Select "All Tables"
5. **Expected:** All matches shown again

### 3. Time Filter

1. Click the Time dropdown
2. Observe options: All, Today, Upcoming
3. Select "Today"
4. **Expected:** Only matches scheduled for today are shown
5. Select "Upcoming"
6. **Expected:** Only future matches are shown
7. Select "All"
8. **Expected:** All matches shown

### 4. Refresh Functionality

1. Note the "Last updated: HH:MM:SS" timestamp
2. Wait 2 seconds
3. Click the "Refresh" button
4. **Expected:** Timestamp updates to current time, network request fires to `/api/public/matches`

### 5. Match Card Content (Completed Match)

1. Navigate to "Completed" tab
2. Find a completed match card
3. **Expected:** Card shows:
   - Match title (e.g., "Men Singles - Final")
   - Table badge (e.g., "T1")
   - Team 1 player name with country code (e.g., "Fan Zhendong CHN")
   - Team 2 player name with country code
   - Aggregate score (e.g., "4" vs "1")
   - Game scores breakdown (e.g., "11-8, 11-9, 8-11, 11-7, 11-5")

### 6. Match Card Content (Scheduled Match)

1. Navigate to "Scheduled" tab
2. Find a scheduled match card
3. **Expected:** Card shows match title, table badge, teams with countries, and scheduled time

### 7. Responsive Layout - Mobile (375px)

1. Open browser DevTools, set viewport to 375×812 (iPhone X)
2. Refresh the page
3. **Expected:**
   - Match cards display in single column
   - No horizontal scrollbar
   - Text is readable (not truncated)
   - Filter controls are stacked vertically

### 8. Responsive Layout - Tablet (768px)

1. Set viewport to 768×1024 (iPad)
2. Refresh the page
3. **Expected:**
   - Match cards display in 2 columns
   - No horizontal scrollbar
   - Filter controls are horizontal

### 9. Responsive Layout - Desktop (1280px)

1. Set viewport to 1280×800 (desktop)
2. Refresh the page
3. **Expected:**
   - Match cards display in 3 columns
   - No horizontal scrollbar
   - Full-width layout with comfortable spacing

### 10. Visual Design (WTT-Inspired)

1. View the page at desktop viewport
2. **Expected:**
   - Navy gradient header with white text
   - Light background (distinct from admin dark theme)
   - Match cards with subtle shadows and rounded corners
   - Hover over a card: lift effect with enhanced shadow
   - Tab colors: green for Completed, purple for Scheduled, red for Live

### 11. Unauthenticated Access

1. Open an incognito/private browser window
2. Navigate to `http://localhost:5173/public`
3. **Expected:** Page loads immediately without login prompt or redirect

### 12. Empty State

1. If any tab has 0 matches:
2. **Expected:** Tab shows "No [status] matches" message (e.g., "No live matches")

### 13. Error Handling

1. Stop the backend server
2. Refresh the public page
3. **Expected:** Error message displays with retry button
4. Restart backend and click retry
5. **Expected:** Data loads successfully

## Edge Cases

### No matches in database

1. Clear all matches from database
2. Navigate to `/public`
3. **Expected:** All tabs show count of 0, each tab displays empty state message

### Doubles match

1. View a doubles match card (if available)
2. **Expected:** Two players shown per team with country codes

### Live match indicator

1. View a live match card (if available)
2. **Expected:** Animated pulse indicator on card border, current game score displayed

## Failure Signals

- Authentication redirect when accessing `/public`
- Horizontal scrollbar at any viewport
- Cards not reflowing to correct column count at breakpoints
- Refresh button not updating timestamp
- Filter dropdowns not filtering matches
- Tab switching not changing displayed matches
- Console errors about failed API requests
- Missing player names or country codes on cards

## Requirements Proved By This UAT

- **R003** — All aspects: public page accessible, tabbed layout, WTT-style design, filters work, refresh with timestamp, responsive at all viewports

## Not Proven By This UAT

- Auto-refresh or real-time score updates (not implemented)
- Server-side pagination (all matches loaded client-side)
- Multi-day tournament filtering (time filter is client-side only)

## Notes for Tester

- The 401 error in console for other routes is expected—admin routes require auth, public route does not
- Test data should include at least one match in each status for meaningful verification
- The responsive breakpoints are exactly 768px and 1280px—test at these exact widths
- Live match animation is a subtle pulse effect on the card border
