---
phase: 3
plan: 2
wave: 2
depends_on: ["1"]
---

# Plan 3.2: Touchpad Sync Integration

## Objective
Integrate the Umpire Touchpad with the backend Sync API. Automatically push state changes (scores, game progression) to the server during live play.

## Context
- `frontend/src/stores/matchStore.js` (Main state logic)
- `frontend/src/components/Touchpad.vue` (UI for icon)
- `backend/internal/api/handlers.go` (Endpoint URL)

## Tasks

<task type="auto">
  <name>Implement syncMatch Action</name>
  <files>
    - frontend/src/stores/matchStore.js
  </files>
  <action>
    - Add `syncStatus` string state ('synced', 'syncing', 'error').
    - Add `async syncMatch()` action.
    - Set `syncStatus = 'syncing'` at start.
    - Fetch `PUT http://localhost:8080/api/matches/:id/sync` with `credentials: 'include'`.
    - Payload should include current game, status, game score, and flattened cards.
    - Set `syncStatus = 'synced'` on success, `'error'` on failure.
  </action>
  <verify>grep "syncStatus" frontend/src/stores/matchStore.js && grep "async syncMatch" frontend/src/stores/matchStore.js</verify>
  <done>Store manages sync state and performs the API call.</done>
</task>

<task type="auto">
  <name>Add Sync Status Icon to Touchpad</name>
  <files>
    - frontend/src/components/Touchpad.vue
  </files>
  <action>
    - Add a subtle cloud icon (font-awesome `fa-cloud` or similar) in the status bar/header of the touchpad.
    - Animate or change color based on `matchStore.syncStatus` (e.g., pulsing while syncing, red dot for error, solid/faded for synced).
  </action>
  <verify>Confirm icon is visible in browser at http://localhost:5173/scoring</verify>
  <done>Subtle visual feedback for sync status is implemented.</done>
</task>

<task type="auto">
  <name>Hook Sync to State Changes</name>
  <files>
    - frontend/src/stores/matchStore.js
  </files>
  <action>
    - Call `this.syncMatch()` at the end of `handleScore`, `undoScore`, `nextGame`, `undoNextGame`, and all card issuance/reversion actions.
  </action>
  <verify>grep "this.syncMatch()" frontend/src/stores/matchStore.js</verify>
  <done>State changes are automatically synced to the backend.</done>
</task>

## Success Criteria
- [ ] Scoring a point in the touchpad updates the database `games` table.
- [ ] Advancing a game updates the database `matches.current_game` and `games` tables.
- [ ] Undoing a point or game reflects in the database.
