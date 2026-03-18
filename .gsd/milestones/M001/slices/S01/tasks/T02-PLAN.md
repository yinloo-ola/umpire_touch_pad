---
estimated_steps: 5
estimated_files: 1
---

# T02: Display player names instead of indices

**Slice:** S01 — Admin Card Editing Polish
**Milestone:** M001

## Description

Replace generic "Player 1/2" labels with actual player names from the match object. This affects both the edit-mode player target dropdown and the read-only card log display. Preserve special labels "Coach" (-1) and "Team" (-2) for non-player targets.

## Steps

1. Create computed property or helper function to resolve player name from `teamIndex` and `playerIndex` using `matchData.match.team1` and `matchData.match.team2` arrays
2. Update edit-mode player dropdown options: replace "Player 1" / "Player 2" with actual names from the selected team (teamIndex determines which team array to use; playerIndex 0/1 maps to team[0].name / team[1].name)
3. Update read-only display in card log table: replace generic "Player" label with resolved player name
4. Preserve "Coach" label for `playerIndex === -1` and "Team" label for `playerIndex === -2`
5. Handle edge cases: match data may not be loaded yet, team may have fewer than 2 players (doubles vs singles)

## Must-Haves

- [ ] Edit-mode player dropdown shows actual player names (e.g., "Ma Long") instead of "Player 1/2"
- [ ] Dropdown updates correctly when team selection changes (Team 1 vs Team 2)
- [ ] Read-only view shows resolved player name instead of generic "Player"
- [ ] "Coach" label preserved for coach cards (playerIndex -1)
- [ ] "Team" label preserved for team cards (playerIndex -2)
- [ ] Handles missing/incomplete match data gracefully

## Verification

- Start dev server: `cd frontend && npm run dev`
- Navigate to `/admin`, open a match detail page with known player names
- Click "Edit Match", verify player dropdown shows actual names from match data
- Switch team selection, verify dropdown updates to show that team's players
- Add cards for different players, save, verify read-only view shows names correctly
- Add a coach card (playerIndex -1), verify "Coach" displays
- Add a team card (playerIndex -2), verify "Team" displays

## Inputs

- `frontend/src/views/admin/MatchDetailView.vue` — current implementation with index-based player labels
- `matchData.match.team1` and `matchData.match.team2` arrays — player name source (each player has `name` and `country` properties)
- Task T01 completion — card type standardization (this task is independent but builds on same file)

## Expected Output

- `frontend/src/views/admin/MatchDetailView.vue` — player name resolution helper and updated dropdown/display templates

## Observability Impact

**What changes:**
- Player dropdown options become dynamic computed properties based on selected team
- Read-only card log shows resolved player names instead of generic "Player" label
- `getPlayerName(teamIndex, playerIndex)` helper provides single source of truth for name resolution

**How to inspect:**
- Browser dev tools → inspect dropdown options in edit mode → should show actual player names (e.g., "Ma Long")
- Browser console → `document.querySelectorAll('.card-log-table td:nth-child(3)')` → check textContent for resolved names
- Edit-mode: change team dropdown, verify player dropdown options update to show that team's players

**Failure visibility:**
- If helper fails, dropdown shows empty options or fallback indices
- If matchData not loaded, shows "Player 1/2" fallback labels
- Console warning logged if team array is empty or player index out of bounds
