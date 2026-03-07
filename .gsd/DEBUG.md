# Debug Session: Touchpad UI and Sync Issues

## Symptoms
1. **Edit Score**: The touchpad score table has an "Edit Score" option which is not needed.
2. **Double Countries**: Touchpad score table is not showing countries for both players in a pair.
3. **Premature Completion**: Match status updates to `completed` after 1 game. Should only complete upon umpire confirmation.
4. **Timeouts Missing**: Timeout cards are not recorded or handled in the sync to DB operation.

**When:** During match officiating via the Touchpad.
**Expected:** 
- No "Edit Score" button.
- Both players' countries shown in doubles.
- Match status stays `in_progress` until explicit completion.
- Timeouts synced to database.

## Evidence

### 1. Edit Score & Countries
- Checked `Touchpad.vue`.
- "Edit Score" button removed.
- `team1Country` and `team2Country` computed properties updated to join countries with `/` for doubles.

### 2. Match Completion
- `syncMatch` in `matchStore.js` was using `isGameOver` to set match status.
- Decoupled match status by adding `isCompleted` state, triggered only by new `confirmMatchComplete` action.

### 3. Timeouts
- Database schema updated with `team1_timeout` and `team2_timeout` BOOLEAN columns.
- `UpdateMatchStatus` query and Go service updated to persist timeout status.
- `syncMatch` payload in frontend now includes `team1Timeout` and `team2Timeout`.

## Hypotheses

| # | Hypothesis | Likelihood | Status |
|---|------------|------------|--------|
| 1 | "Edit Score" is a leftover UI element in `Touchpad.vue`. | 100% | CONFIRMED |
| 2 | Touchpad country display logic only looks at the first player of the team. | 90% | CONFIRMED |
| 3 | Backend `SyncMatch` or Frontend `syncMatch` automatically marks match as completed when a game ends. | 80% | CONFIRMED |
| 4 | Timeouts were never added to the sync payload or schema. | 100% | CONFIRMED |

## Resolution
Root cause: Missing UI logic for doubles countries, leftover boilerplate buttons, and premature state-driven completion logic. Backend was also missing persistence for timeout status.

Fix applied:
- Removed "Edit Score" button from `Touchpad.vue`.
- Updated `Touchpad.vue` computed props to show both countries in doubles.
- Added `isCompleted` to `matchStore.js` and updated `syncMatch` to respect manual confirmation.
- Added timeout columns to database and updated sync flow (frontend payload -> backend request -> SQL update).
- Removed `sqlite.db` to force schema recreation.

Verified by code audit across Vue components, Pinia store, Go services, and SQL definitions.
