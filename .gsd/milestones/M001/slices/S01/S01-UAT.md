# S01: Admin Card Editing Polish — UAT

**Milestone:** M001
**Written:** 2026-03-18

## UAT Type

- UAT mode: live-runtime
- Why this mode is sufficient: This slice is a UI polish with visual styling changes. Verification requires running the dev server and inspecting actual rendered elements — static artifact review cannot confirm CSS gradients or dropdown options.

## Preconditions

1. Backend server running on port 8080: `cd backend && go run cmd/server/main.go`
2. Frontend dev server running on port 5173: `cd frontend && npm run dev`
3. Match exists in database with players in team1 and team2 arrays (seed data or manually created)
4. Admin logged in (default credentials: admin/admin123)

## Smoke Test

Navigate to `/admin`, click on a match, click "Edit Match". Card type dropdown shows Yellow/YR1/YR2/Red/Timeout. Player dropdown shows actual player names.

## Test Cases

### 1. Card Type Dropdown Options

1. Navigate to `/admin`
2. Click on a match to open match detail
3. Click "Edit Match" button
4. Scroll to "Cards & Timeouts" section
5. Click on the card type dropdown (Type column)
6. **Expected:** Dropdown shows exactly: Yellow, YR1, YR2, Red, Timeout (no Yellow-Red or Yellow-Red-2)

### 2. Player Dropdown Shows Names

1. In edit mode, look at the Target column dropdown for an existing card
2. **Expected:** Options show actual player names from match data (e.g., "Player One", "Player Two"), not generic "Player 1/2"
3. **Expected:** Options include "Coach" and "Team" for special cases
4. Change the Team dropdown from Team 1 to Team 2
5. **Expected:** Player dropdown options update to show Team 2 player names

### 3. YR1/YR2 Gradient Pill Styling

1. In edit mode, add a new card with type "YR1" for Team 1, any player
2. Click "Save Changes"
3. In read-only view, locate the YR1 card in the Cards & Timeouts table
4. Open browser Dev Tools → Elements → inspect the `.card-pill.yr1` element
5. **Expected:** Computed `background` shows `linear-gradient(to right, rgb(250, 204, 21), rgb(248, 113, 113))` (yellow to red gradient)
6. Repeat for YR2 card type
7. **Expected:** Same gradient background for YR2

### 4. Solid Color Pills (Yellow/Red)

1. Add cards with types "Yellow" and "Red"
2. Save and view in read-only mode
3. Inspect `.card-pill.yellow` element
4. **Expected:** Computed `background` shows solid `rgb(250, 204, 21)` (yellow)
5. Inspect `.card-pill.red` element
6. **Expected:** Computed `background` shows solid `rgb(248, 113, 113)` (red)

### 5. Read-Only Player Names

1. View a saved card in read-only mode (not edit mode)
2. Look at the Target column
3. **Expected:** Shows actual player name (e.g., "Player One"), not "Player"
4. If coach card exists, **Expected:** Shows "Coach"
5. If team card exists, **Expected:** Shows "Team"

### 6. Save/Load Roundtrip

1. In edit mode, add cards of each type (Yellow, YR1, YR2, Red)
2. Click "Save Changes"
3. Reload the page (F5)
4. **Expected:** All cards persist with correct types and player names
5. Click "Edit Match"
6. **Expected:** Dropdown values match saved data

## Edge Cases

### Coach Card

1. In edit mode, add a card with Team 1, Target "Coach", Type "Red"
2. Save and view in read-only mode
3. **Expected:** Target column shows "Coach" (not a player name or index)

### Team Card

1. In edit mode, add a card with Team 1, Target "Team", Type "Yellow"
2. Save and view in read-only mode
3. **Expected:** Target column shows "Team"

### Missing Player Data

1. If match has no players loaded (edge case), player dropdown falls back to "Player 1", "Player 2"
2. **Expected:** No JavaScript errors in console; graceful fallback

## Failure Signals

- Card type dropdown shows "Yellow-Red" or "Yellow-Red-2" instead of YR1/YR2 → labels not updated
- YR1/YR2 pills show solid yellow or solid red → CSS gradient missing
- Player dropdown shows "Player 1/2" instead of names → getPlayerOptions() not implemented
- Read-only view shows "Player" instead of actual name → getPlayerName() not called
- JavaScript errors in browser console → check MatchDetailView.vue for syntax issues

## Requirements Proved By This UAT

- R001 — Confirms admin can edit cards with standardized type labels (YR1/YR2), see player names instead of indices

## Not Proven By This UAT

- Penalty point helper buttons (optional feature, not implemented in this slice)
- Public API card data format (S02 responsibility)
- Responsive layout on mobile/tablet (not in scope for admin UI)

## Notes for Tester

- The match used for testing should have players defined in team1 and team2 arrays. The seed data creates matches with "Player One" and "Player Two" by default.
- CSS gradients may appear slightly different depending on browser, but should clearly show yellow-to-red transition.
- Dev Tools inspection is required to verify exact gradient values — visual inspection alone may not distinguish gradient from solid colors.
