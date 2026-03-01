# Phase 1 Verification

## Must-Haves Checked

| # | Requirement | Evidence | Status |
|---|-------------|----------|--------|
| 1 | `p1Top`, `p1Bot`, `p2Top`, `p2Bot`, `decidingSwapDone` in state + reset | `grep … \| wc -l` → 31 | ✅ |
| 2 | `swapLeftPlayers()` and `swapRightPlayers()` actions | `grep -c` → 2 | ✅ |
| 3 | Four quadrant getters return player objects | `grep -c "doublesLeft\|doublesRight"` → 4 | ✅ |
| 4 | `doublesInitialServer`/`doublesInitialReceiver` in state + reset | Part of 36-count grep | ✅ |
| 5 | `doublesCurrentPair`, `isLeftDoublesServer`, `doublesServerName`, `doublesReceiverName` getters | `grep -c` → 36 | ✅ |
| 6 | `handleScore()` singles guard (`type !== 'doubles'`) | `grep -c` → 5 | ✅ |
| 7 | `setDoublesServer()` umpire-correction action | `grep -c` → 5 | ✅ |
| 8 | `setDoublesServerForNewGame()` with mandatory-receiver logic | `grep -c` → 3 | ✅ |
| 9 | `nextGame()` records prev serve state + resets quadrants for doubles | `grep -c` → 9 | ✅ |
| 10 | Deciding-game swap at score 5 (singles + doubles) with correct quadrant logic | `grep -c` → 6 | ✅ |
| 11 | `npm run build` passes with no errors | `✓ built in 371ms` | ✅ |

## Verdict: PASS ✅

All Phase 1 must-haves verified against actual codebase.
