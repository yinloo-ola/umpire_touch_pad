---
phase: 5
plan: 3
wave: 2
---

# Plan 5.3: Phase 5 Comprehensive Testing

## Objective
Author exhaustive tests targeting the modernized mid-game swap modal mechanics and intelligent between-game receiver logic.

## Context
- `frontend/src/stores/__tests__/matchStore.doubles.test.js`
- `frontend/src/stores/__tests__/matchStore.singles.test.js` (if applicable)
- `frontend/src/stores/matchStore.js`

## Tasks

<task type="auto">
  <name>Update and Scale Store Tests</name>
  <files>frontend/src/stores/__tests__/matchStore.doubles.test.js</files>
  <action>
    - Refactor old deciding-game mid-game tests: Instead of expecting an instant side flip, attest that `midGameSwapPending === true` holds true exactly at 5 points while positions remain identical.
    - Follow-up with executing `applyMidGameSwap()` and evaluating final parity across swapping logic.
    - Draft distinct tests for testing Best-of-7 (Game 7) triggers perfectly executing.
    - Append systematic test assessing automatic receiver synchronization covering consecutive actions:
      - Traverse natively through `nextGame` to start Game 2.
      - Ensure `setDoublesServerForNewGame` automatically triggered correctly checking standard variables.
      - Run `swapPlayerOnTeam(serverTeam)` manually assessing resilient reconfiguration due to the 0-0 parity guard.
  </action>
  <verify>make test</verify>
  <done>Vitest runner confidently exits 0 with complete reliability across all intricate store pathways.</done>
</task>

## Success Criteria
- [ ] Store rigorously retains previous state when pending swap.
- [ ] Applying swap faithfully triggers UI adjustments.
- [ ] Testing suite effectively traps bugs involving premature evaluation outside 0-0 start frames.
