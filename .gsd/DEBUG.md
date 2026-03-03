# Debug Session: Mid-Game Side Swap Undo Revert

## Symptom
In the final deciding game, a modal is shown when 1 player reaches 5 points. After the modal is dismissed, the players' sides are swapped (and server/receiver swapped correctly for Doubles). However, when the score is later reduced below 5 points (due to an umpire correction or penalty revert), the side is not swapped back.

**When:** An umpire uses the "minus" point button (or undoes a penalty point) after sides have already been swapped at 5 points in a deciding game.
**Expected:** The sides and player quadrants should be perfectly reverted back to the pre-swap state, and the deciding swap status reset.
**Actual:** The minus went through, but the players remained swapped.

## Hypotheses

| # | Hypothesis | Likelihood | Status |
|---|------------|------------|--------|
| 1 | The `handleScore()` logic simply did not contain reverting logic for the side swap when the score drops below 5. | 100% | FIXED |

## Attempts

### Attempt 1
**Testing:** H1 — The missing snapshot/revert mechanism inside the game state for `midGameSwap`.
**Action:** 
1. Added `midGameSwapSnapshot` to capture state immediately before the side swap is applied.
2. Modified `revertMidGameSwap()` to pull from this snapshot, fully restoring `swappedSides`, the quadrants (`p1Top`, `p1Bot`, etc.), and `server` settings.
3. Hooked `revertMidGameSwap()` into `handleScore` (when `delta < 0`) and `revertPenaltyPoints` (when decreasing the opponent's score) when both scores fall below 5.
**Result:** Worked perfectly. We also updated the swap conditions (`>= 5`) in case jumping the score triggers it.
**Conclusion:** CONFIRMED.

## Resolution

**Root Cause:** No snapshotting logic existed to capture the exact player quadrants right before the deciding game swap, nor was there code to reverse it when falling below 5 points.
**Fix:**
1. Introduced `midGameSwapSnapshot` to capture pre-swap sides and combinations.
2. Added `revertMidGameSwap()` action.
3. Updated `handleScore()` and `revertPenaltyPoints()` to check if scores fall below 5 and cleanly reverse the swap.
4. Added Vitest unit test coverage via `matchStore.midgame.test.js`.
**Verified:** `npm test` passed 80/80 tests, including explicit verifying that the side swap undoes properly.

**Regression Check:** Confirmed `matchStore.cards.test.js`, `matchStore.timeout.test.js`, and `matchStore.doubles.test.js` all pass without issue.
