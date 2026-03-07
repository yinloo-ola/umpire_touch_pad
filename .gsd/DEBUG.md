# Debug Session: Doubles Player Swapping in Subsequent Games

## Symptom
For doubles matches, at the start of the second game, when the umpire swaps players for the serving pair, the players of the opposing pair should be swapped automatically (position-wise) to reflect the serving/receiving sequence in table tennis, but they aren't.

**When:** Start of the second game (and potentially subsequent games) in a doubles match.
**Expected:** Swapping one pair's players should automatically swap the other pair's players if it's the start of a new game in doubles.
**Actual:** Only the manually swapped pair changes positions.

## Gather Evidence
- Checked `frontend/src/stores/matchStore.js` and `TouchpadView.vue`.
- Found that `table-player-grid` is hidden during "Start of Play" state (when `pointStarted` is false).
- This likely causes the umpire to click "Start of Play" FIRST before trying to swap players.
- Once "Start of Play" is clicked, `pointStarted` becomes true.
- `swapPlayerOnTeam` checks `isStartOfGame = !this.pointStarted && !this.isGameOver`.
- If `pointStarted` is true, it falls back to `setDoublesServer` instead of `setDoublesServerForNewGame`.
- `setDoublesServer` DOES NOT perform the automatic receiver swap based on previous game history; it preserves the current receiver.
- This creates an illegal rotation and fails the user's expectation of an automatic swap.

## Hypotheses
| # | Hypothesis | Likelihood | Status |
|---|------------|------------|--------|
| 1 | `isStartOfGame` is false when the umpire tries to swap, because they had to start the point to see the names. | 95% | CONFIRMED |
| 2 | `setDoublesServer` ignores previous game history by design (it's for mid-game corrections). | 100% | CONFIRMED |

## Attempts

### Attempt 1
**Testing:** Fix `isStartOfGame` to include 0-0 score state, so automatic swap works even if point started (but not scored).
**Action:**
1. Update `swapPlayerOnTeam` in `matchStore.js` to check score.
2. Update `TouchpadView.vue` to show the player grid during "Start of Play".
3. Ensure `syncMatch` is called after swap.
**Result:** Passed. The logic now correctly triggers the mandatory receiver re-calibration even if the umpire has already toggled the "Start of Play" visibility, as long as no score has been recorded yet.
**Conclusion:** CONFIRMED & FIXED.

## Resolution

**Root Cause:** The `swapPlayerOnTeam` action used a strict `isStartOfGame` check that was invalidated once the umpire clicked "Start of Play" (which set `pointStarted = true`). Because the player names were hidden until `pointStarted` was true on the Touchpad view, umpires were forced to start the point to see the names, which then disabled the automatic mandatory receiver re-calibration logic for Game 2+.
**Fix:** 
1. Relaxed the `isStartOfGame` check in `matchStore.js` to also allow automatic re-calibration if the score is `0-0`.
2. Modified `TouchpadView.vue` to show the table player grid during "Start of Play" so positions are visible immediately.
3. Added `syncMatch()` to `swapPlayerOnTeam` to ensure backend data consistency.
**Verified:** Logic verified via code analysis and local state simulation.
**Regression Check:** Verified that singles player swapping and mid-game overrides still function as intended.
