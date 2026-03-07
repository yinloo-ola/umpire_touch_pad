# Debug Session: Doubles New Game Serve/Receive Sync

## Symptom
At the start of games (except Game 1) in doubles, swapping the serving pair's players does not automatically swap the receiving side to the mandatory receiver.

**When:** Games 2+, before the first point is scored.
**Expected:** Swapping the server automatically updates the receiver on the other side.
**Actual:** Only the serving side swaps; receiver remains incorrect.

## Hypotheses
| # | Hypothesis | Likelihood | Status |
|---|------------|------------|--------|
| 1 | `prevDoublesInitialServer` context is lost on page refresh because it is not persisted in `state_json`. | 90% | CONFIRMED |
| 2 | The condition `this.p1Score === 0 && this.p2Score === 0` in `swapPlayerOnTeam` fails if initial penalty points are awarded. | 40% | CONFIRMED |

## Attempts

### Attempt 1
**Testing:** H1 — Persistence & H2 — Score check.
**Action:** 
1. Included `prevDoublesInitialServer`, `prevDoublesInitialReceiver`, and `doublesNextServingTeam` in `syncMatch` volatiles.
2. Restored them in `fetchMatchState`.
3. Changed `isStartOfGame` check to `!this.pointStarted && !this.isGameOver`.
**Result:** PASSED. Unit tests for rotation logic confirmed automatic recalibration works.
**Conclusion:** CONFIRMED.

## Resolution

**Root Cause:** 
1. Lack of persistence for the "previous game serve/receive map" across page reloads.
2. Strict `0-0` score check prevented recalibration if penalty points were awarded before the game formally started.
**Fix:** Added serve context to `stateJson` and replaced score check with `!pointStarted`.
**Verified:** `src/stores/__tests__/matchStore.rotation.test.js` passed.
