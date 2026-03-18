---
id: S01
parent: M001
milestone: M001
provides:
  - Standardized card type labels (Yellow/YR1/YR2/Red/Timeout)
  - Gradient pill styling for YR1 and YR2 cards
  - Player name resolution from teamIndex/playerIndex using match data
  - Dynamic player dropdown options based on selected team
requires: []
affects:
  - S02
  - S03
key_files:
  - frontend/src/views/admin/MatchDetailView.vue
key_decisions:
  - D001 — Card types use standardized labels YR1/YR2 (not Yellow-Red/Yellow-Red-2) consistent with umpire UI
  - D003 — Player targets display actual player names from match data, not generic indices
patterns_established:
  - Card type CSS class binding: c.cardType.toLowerCase().replace('-', '') produces yr1, yr2, red, yellow, timeout
  - Player name resolution: getPlayerName(teamIndex, playerIndex) returns "Coach"/"Team" for special indices (-1, -2), actual name otherwise
  - Fallback pattern: Returns "Player N" when match data not loaded or player not found
observability_surfaces:
  - Browser inspection of .card-pill elements shows computed gradient backgrounds for YR1/YR2
  - Browser console warning logged when player not found in team array
drill_down_paths:
  - .gsd/milestones/M001/slices/S01/tasks/T01-SUMMARY.md
  - .gsd/milestones/M001/slices/S01/tasks/T02-SUMMARY.md
duration: 40m
verification_result: passed
completed_at: 2026-03-18
---

# S01: Admin Card Editing Polish

**Card editing UI now shows player names and standardized type labels with YR1/YR2 gradient pills.**

## What Happened

Updated MatchDetailView.vue in two focused tasks:

1. **T01 — Standardized card types:** Replaced non-standard dropdown labels (Yellow-Red, Yellow-Red-2) with YR1 and YR2. Added missing Red card option. Added CSS gradient styling for YR1/YR2 pills using `linear-gradient(to right, #facc15, #f87171)` matching the existing yellowred pattern.

2. **T02 — Player name resolution:** Added helper functions `getPlayerName()` and `getPlayerOptions()` to resolve player names from match data. Updated read-only display and edit-mode dropdowns to show actual names ("Player One", "Player Two") instead of generic "Player 1/2". Preserved special labels for Coach (-1) and Team (-2) indices.

## Verification

Browser testing confirmed all must-haves:

| Check | Result |
|-------|--------|
| Card type dropdown shows Yellow/YR1/YR2/Red/Timeout | ✅ |
| YR1 pill has gradient yellow-red background | ✅ |
| YR2 pill has gradient yellow-red background | ✅ |
| Red pill has solid red background | ✅ |
| Yellow pill has solid yellow background | ✅ |
| Player dropdown shows actual names | ✅ |
| Read-only view shows player names | ✅ |
| Coach/Team labels preserved | ✅ |

Diagnostic verification:
```javascript
// browser_evaluate result
document.querySelectorAll('.card-pill')[0] // YR1: linear-gradient(to right, rgb(250, 204, 21), rgb(248, 113, 113))
document.querySelectorAll('.card-pill')[1] // YR2: linear-gradient(to right, rgb(250, 204, 21), rgb(248, 113, 113))
```

## Requirements Advanced

- R001 — Implemented standardized card type labels and player name display per requirement spec

## Requirements Validated

- R001 — Browser verification confirmed: card dropdown shows correct types (Yellow/YR1/YR2/Red/Timeout), YR1/YR2 have gradient pills, player names display instead of indices

## New Requirements Surfaced

- none

## Requirements Invalidated or Re-scoped

- none

## Deviations

None. Implementation followed the task plans exactly.

## Known Limitations

- Player names come from hardcoded match data (team1/team2 arrays). Future work (R011) would add player profile lookup by ID.

## Follow-ups

- none (slice complete per plan)

## Files Created/Modified

- `frontend/src/views/admin/MatchDetailView.vue` — Updated card type dropdown options; added CSS for YR1/YR2 gradient pills; added getPlayerName() and getPlayerOptions() helper functions; updated read-only and edit-mode templates to use player names

## Forward Intelligence

### What the next slice should know
- Card type values stored in database are: "Yellow", "YR1", "YR2", "Red", "Timeout" — downstream slices (S02 public API, S03 public viewer) should use these exact values for consistency
- Player name resolution uses `match.team1` and `match.team2` arrays — the public API (S02) will need similar logic to resolve player names from teamIndex/playerIndex
- CSS class binding pattern `c.cardType.toLowerCase().replace('-', '')` produces class names `yr1`, `yr2`, `red`, `yellow`, `timeout`

### What's fragile
- Player name fallback — if match data is not loaded or player index is out of bounds, falls back to "Player N" without explicit error. This is acceptable for admin UI but public API (S02) should handle more gracefully.

### Authoritative diagnostics
- Browser dev tools → inspect `.card-pill` elements → computed `background` property shows gradient for YR1/YR2, solid colors for others
- Accessibility tree → card dropdown options show exact text values being used

### What assumptions changed
- Assumed coach cards would use playerIndex -1 and team cards would use -2 — confirmed this pattern is already established and preserved
