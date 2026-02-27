# Plan 5.2 SUMMARY: Automatic Between-Game Receiver & Polish

## Changes
- Modified `matchStore.js`:
    - Updated `nextGame()` to automatically compute the mandatory receiver at the start of games 2-5 using `setDoublesServerForNewGame()`.
    - Updated `swapPlayerOnTeam()` to recalibrate the mandatory receiver when the server is manually swapped pre-play in games 2-5.
    - Cleaned up comments and unused variables in `applyMidGameSwap()`.
- Modified `SetupView.vue`:
    - Removed `showServerChoiceModal` and related logic.
    - Removed the "Who serves first?" modal from the template, as computation is now automatic.
- Modified `.gsd/ARCHITECTURE.md`:
    - Registered `midGameSwapPending` and other Phase 5 state fields.
    - Documented automated receiver logic and decider-game swap behavior.
    - Updated testing status to reflect existing Vitest coverage for `matchStore.js`.

## Verification
- Code review: `nextGame` and `swapPlayerOnTeam` correctly handle mandatory receiver rules.
- UI: Modal removed from `SetupView.vue`.
- Documentation: `ARCHITECTURE.md` updated and reflects current state of project.
