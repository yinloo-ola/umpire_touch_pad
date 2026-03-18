---
id: T02
parent: S01
milestone: M001
provides:
  - Player name resolution from teamIndex/playerIndex using match data
  - Dynamic player dropdown options based on selected team
  - Read-only card log display with actual player names
key_files:
  - frontend/src/views/admin/MatchDetailView.vue
key_decisions:
  - Used helper function getPlayerName() for single source of truth on name resolution
  - Used method getPlayerOptions() to generate dynamic dropdown options based on team selection
patterns_established:
  - Player name resolution: getPlayerName(teamIndex, playerIndex) returns "Coach"/"Team" for special indices, actual name otherwise
  - Fallback pattern: Returns "Player N" when match data not loaded or player not found
observability_surfaces:
  - Browser console warning logged when player not found in team array
  - Dropdown options visible in DOM - inspect select elements to verify names
duration: 15m
verification_result: passed
completed_at: 2026-03-18
blocker_discovered: false
---

# T02: Display player names instead of indices

**Replaced generic "Player 1/2" labels with actual player names from match data in both edit-mode dropdown and read-only card log display.**

## What Happened

Added two helper functions to `MatchDetailView.vue`:

1. `getPlayerName(teamIndex, playerIndex)` - Resolves player name from match data, with special handling for Coach (-1) and Team (-2) indices. Falls back to "Player N" when match data unavailable or player not found.

2. `getPlayerOptions(teamIndex)` - Generates dropdown options dynamically based on selected team, reading player names from `matchData.match.team1` or `matchData.match.team2` arrays. Always includes Coach and Team options.

Updated the read-only card log display to use `getPlayerName()` instead of the inline ternary that only showed "Player" for non-special indices.

Updated the edit-mode player dropdown to use `getPlayerOptions()` with a v-for loop, making options reactive to team selection changes.

## Verification

Browser testing confirmed:
- Edit-mode player dropdown shows actual names ("Player One", "Player Two") instead of generic "Player 1/2"
- Dropdown options update correctly when switching between Team 1 and Team 2
- Read-only view shows resolved player names in the Target column
- "Coach" label displays correctly for coach cards (playerIndex -1)
- "Team" label displays correctly for team cards (playerIndex -2)
- Fallback to "Player N" works when match data not loaded

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | Browser: Navigate to admin match detail, enter edit mode | 0 | ✅ pass | 2s |
| 2 | Browser: Verify player dropdown shows "Player One" for Team 1 | 0 | ✅ pass | 1s |
| 3 | Browser: Change team to Team 2, verify dropdown shows "Player Two" | 0 | ✅ pass | 1s |
| 4 | Browser: Add cards, save, verify read-only shows player names | 0 | ✅ pass | 2s |
| 5 | Browser: Add coach card, verify "Coach" label displays | 0 | ✅ pass | 2s |
| 6 | Browser: Add team card, verify "Team" label displays | 0 | ✅ pass | 2s |

## Diagnostics

To verify player name resolution:
1. Start dev server: `cd frontend && npm run dev`
2. Navigate to `/admin`, click on a match
3. Click "Edit Match", inspect player dropdown options - should show actual names
4. In browser console: `document.querySelectorAll('.card-log-table tbody tr')` - check Target column text

## Deviations

None - implementation matched the task plan exactly.

## Known Issues

None - all must-haves verified.

## Files Created/Modified

- `frontend/src/views/admin/MatchDetailView.vue` — Added getPlayerName() and getPlayerOptions() helper functions; updated read-only display template to use getPlayerName(); updated edit-mode dropdown to use dynamic options from getPlayerOptions()
