## Phase 3 Verification

### Must-Haves
- [x] `make test` exits 0 with new SetupView tests included — VERIFIED (48/48 tests pass)
- [x] Quadrant rendering: correct player names appear in TL/BL/TR/BR for a doubles match — VERIFIED (test 1 + 4)
- [x] swappedSides: after toggleSwapSides(), the four quadrant slots show mirrored teams — VERIFIED (test 4)
- [x] swapLeftPlayers: after swapLeftPlayers(), TL and BL player names are exchanged — VERIFIED (test 5)
- [x] swapRightPlayers: after swapRightPlayers(), TR and BR player names are exchanged — VERIFIED (test 6)
- [x] setDoublesServerForNewGame: choosing a player in the between-game modal correctly calls the store action — VERIFIED (test 9)
- [x] Singles regression: singles layout still renders without the doubles quadrant grid — VERIFIED (test 2)

### Artifacts
- [x] `frontend/src/components/__tests__/SetupView.doubles.test.js` — new test file, all 9 tests passing

### Verdict: PASS ✅

All 7 must-haves verified. 48 total tests passing. Phase 3 complete.
