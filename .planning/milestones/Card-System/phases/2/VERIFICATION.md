## Phase 2 Verification

### Must-Haves
- [x] Penalty point awarding & reverting: YR1 = 1 pt, YR2 = 2 pts (opponent) — VERIFIED (evidence: `matchStore.js` logic implemented, `matchStore.penalty.test.js` passes perfectly testing scoring increments and game ends upon YR1/YR2 being issued internally within the logic).
- [x] Triggers standard serve rotation and quadrant allocations — VERIFIED (evidence: `applyPenaltyPoints` explicitly performs singles rotation evaluation on `servesPassed` and calls `syncDoublesQuadrants`).
- [x] Handled up to game/match boundaries and carry-over mechanics — VERIFIED (evidence: `applyPenaltyPoints` identifies `isGameOver` state and places excessive scores sequentially to `carryOverPoints`, which is processed immediately in `nextGame`).

### Verdict: PASS
