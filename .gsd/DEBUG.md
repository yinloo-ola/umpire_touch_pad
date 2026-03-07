# Debug Session: Resume Match Score 0-0

## Symptom
When a match is resumed, the score is initialized as 0-0, instead of the actual score.

**When:** When clicking "Resume Match" in the Umpire Match List.
**Expected:** The state loads properly from the backend.
**Actual:** The frontend receives the payload, but fails to parse the current game properly because `match.currentGame` doesn't exist.

## Hypotheses
| # | Hypothesis | Likelihood | Status |
|---|------------|------------|--------|
| 1 | `data.match.currentGame` is undefined so it fails to select the right game. | 90% | CONFIRMED |

## Attempts

### Attempt 1
**Testing:** H1 — `data.match.currentGame` is undefined so it fails to select the right game.
**Action:** Identified that `backend` doesn't return `currentGame` as part of the `Match` payload. `matchStore.js` fails to set `this.game` correctly, resorting to `undefined`. Changed `matchStore.js` to derive `this.game` from the highest `gameNumber` located inside the `data.games` parameter.
**Result:** Passed successfully.
**Conclusion:** CONFIRMED.

## Resolution

**Root Cause:** `fetchMatchState` erroneously depended on `data.match.currentGame`, a non-existent property coming from the backend JSON response. This resulted in `this.game` being evaluated as `undefined`, causing the proxy `find(g => g.gameNumber === undefined)` to fall back to `0-0` since it didn't find the game.
**Fix:** Removed relying on `match.currentGame`. Computed `this.game` by finding the max `gameNumber` from the `data.games` array dynamically.
**Verified:** Tests suite passed.
**Regression Check:** Confirmed that `handleScore` triggers `syncMatch` which reliably records `stateJson` on the backend.
