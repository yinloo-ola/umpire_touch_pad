# Debug Session: Cross-Game Revert Boundary

## Symptom
The user inquired whether undoing/reverting points when a new game has already started (e.g., at 1-0 due to carry-overs) will appropriately revert the match back to the previous game (Game 1 at 10-0).

**When:** A game ends and `Next Game` is clicked, but an umpire wants to revert the scoring action that ended the previous game.
**Expected:** State should revert across the `this.game` boundary.
**Actual:** Implemented and Verified.

## Hypotheses

| # | Hypothesis | Likelihood | Status |
|---|------------|------------|--------|
| 1 | `matchStore` does not track previous game states to fully re-hydrate. | 100% | FIXED |

## Attempts

### Attempt 1
**Testing:** H1 — Reverting a penalty point in Game 2.
**Action:** Wrote `matchStore.debug.test.js`.
**Result:** Initial implementation did not support boundary crossing.
**Conclusion:** Confirmed need for `gameHistory` snapshotting.

## Resolution

**Root Cause:** The `matchStore` was not snapshotting state on `nextGame()`, making reverts bounded to the current game frame (minimum 0 points).
**Fix:** 
1. Added `gameHistory` array to state.
2. `nextGame()` now pushes a snapshot including `scores`, `server`, `quadrants`, and `carryOverPoints`.
3. Added `undoNextGame()` to pop and restore state.
4. Integrated `undoNextGame()` call natively into both `handleScore` (minus) and `revertPenaltyPoints` if current points are insufficient for a reduction.
**Verified:** `matchStore.debug.test.js` passes. 9-0 -> YR1 (10-0) -> YR2 (11-0) -> Next Game (Game 2 1-0) -> Revert YR2 -> Game 1 10-0.

**Regression Check:** All 55 tests pass (Cards, Doubles, Penalty, Debug).
