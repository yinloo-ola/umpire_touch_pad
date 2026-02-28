# Debug Session: Doubles Receiver Not Updating

## Symptom
For doubles, after the first game, at the start of the second game when the score is 0-0, if I click "swap players" for the server, the receiver should be changed automatically, but it doesn't.

**When:** Start of second game (score 0-0), click "swap players" on server's side.
**Expected:** The receiver changes automatically to match the mandatory receiver for the new server based on the previous game's rotation.
**Actual:** The receiver does not change automatically.

## Evidence
- The UI (e.g., `SetupView.vue` and `Touchpad.vue`) calls `matchStore.swapLeftPlayers()` and `matchStore.swapRightPlayers()`.
- These functions manually toggle physical quadrant variables (`p1Top`, `p1Bot`) and then call `calibrateServeStateFromUI()`.
- `calibrateServeStateFromUI()` blindly assigns players based on the physical quadrant layout without applying the strict start-of-game mandatory receiver rules.
- The correct logic (which uses `setDoublesServerForNewGame` to look up the mandatory receiver) is implemented in `swapPlayerOnTeam(teamNum)`, but this function is NEVER called by the UI.

## Hypotheses

| # | Hypothesis | Likelihood | Status |
|---|------------|------------|--------|
| 1 | UI is calling `swapLeftPlayers`/`swapRightPlayers` which bypass the correct logic in `swapPlayerOnTeam`. Refactoring them to use `swapPlayerOnTeam` will fix it. | 95% | CONFIRMED |

## Attempts

### Attempt 1
**Testing:** H1 — Rewrite `swapLeftPlayers` and `swapRightPlayers` to call `swapPlayerOnTeam(teamNum)`.
**Action:** Changed `frontend/src/stores/matchStore.js` `swapLeftPlayers()` and `swapRightPlayers()` to use `swapPlayerOnTeam` instead of physical quadrant swapping + UI calibration.
**Result:** Passes the comprehensive doubles test suite. By leveraging `swapPlayerOnTeam`, the system correctly executes the mandatory receiver recalibration check (`this.setDoublesServerForNewGame`).
**Conclusion:** CONFIRMED

## Resolution

**Root Cause:** The UI swap functions bypassed the store's strict logic for recalculating mandatory receivers, opting for a physical quadrant manual swap instead.
**Fix:** Refactored `swapLeftPlayers` and `swapRightPlayers` to properly delegate to `swapPlayerOnTeam(teamNum)` which contains all necessary state syncing and start-of-game receptor hooks.
**Verified:** Tests (`npm run test`) pass with 100% success rate.
**Regression Check:** Verified no single or double tests broke, meaning the existing UI side effects of `swapPlayerOnTeam` match the intended behavior.
