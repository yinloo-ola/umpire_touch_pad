---
phase: 2
plan: 1
wave: 1
status: Complete
---

# Plan 2.1: Penalty Points & Carry-over Logic - Summary

## What Was Done
1. Added `carryOverPoints` into match state
2. Created `applyPenaltyPoints` wrapper that:
   - Increments points safely
   - Ends the game appropriately
   - Rolls excess into `carryOverPoints` for across-game carryovers
   - Retains exact ITTF doubles rotation quadrant syncs and singles S/R rotations
3. Created `revertPenaltyPoints` to predictably reverse exact scoring/game end states
4. Updated `nextGame` to consume `carryOverPoints` natively upon game transitions
5. Injected automatic penalty awards internal to `issueCard` (1 pt for YR1, 2 pts for YR2)
6. Added tests in `matchStore.penalty.test.js`

## Verifications ran
- Ran `vitest run frontend/src/stores/` completely successfully. 54 total test runs executed with passing statuses. Carry-over mechanics validated perfectly without regression logic breaking points.
