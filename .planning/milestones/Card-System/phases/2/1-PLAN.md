---
phase: 2
plan: 1
wave: 1
---

# Plan 2.1: Penalty Points & Carry-over Logic

## Objective
Implement a dedicated wrapper function to handle penalty points safely without disrupting `handleScore`. Integrate this penalty logic tightly into the `issueCard` and `revertLastCard` actions.

## Context
- .gsd/SPEC.md
- .gsd/ROADMAP.md
- .gsd/phases/2/DECISIONS.md
- frontend/src/stores/matchStore.js

## Tasks

<task type="auto">
  <name>Implement Penalty Point Functions</name>
  <files>frontend/src/stores/matchStore.js</files>
  <action>
    Add new state: `carryOverPoints: { p1: 0, p2: 0 }` (and reset it in `resetMatchState`).
    
    Create `applyPenaltyPoints(scoringPlayer, points)`:
    - Add points to the current game without checking `pointStarted`.
    - Automatically determine if the added points trigger a game win.
    - If points exceed what's needed to win the game (e.g., scoringPlayer reaches 11 with a 2-point lead with leftover points), save the remainder into `carryOverPoints`.
    - Ensure `this.isGameOver` correctly updates and `this.syncDoublesQuadrants()` or singles server rotation logic still fires properly to change server/sides.
    
    Create `revertPenaltyPoints(scoringPlayer, points)`:
    - Reverse the above logic.
    - Prioritize removing points from `carryOverPoints` first.
    - If `carryOverPoints` is empty, remove points from the actual score.
    - Handle reverting game over status (setting `isGameOver = false`) if scores fall below the win threshold.

    Update `nextGame()`:
    - Apply `carryOverPoints` securely as the baseline points for the next game.
    - Reset `carryOverPoints` after applying.
  </action>
  <verify>grep -q "applyPenaltyPoints" frontend/src/stores/matchStore.js</verify>
  <done>applyPenaltyPoints and revertPenaltyPoints handle intra-game scores and carry overs directly.</done>
</task>

<task type="auto">
  <name>Integrate Cards with Penalty Logic</name>
  <files>frontend/src/stores/matchStore.js; frontend/src/stores/__tests__/matchStore.cards.test.js</files>
  <action>
    Wire up `applyPenaltyPoints` internally inside `issueCard` and `revertLastCard`.
    
    In `issueCard(teamNum, type, target)`:
    - If `target === 'player'`, award points to the OPPONENT:
      - 'YR1' -> `this.applyPenaltyPoints(opponentTeam, 1)`
      - 'YR2' -> `this.applyPenaltyPoints(opponentTeam, 2)`
      
    In `revertLastCard(teamNum, target)`:
    - If reverting a player card, reverse the penalty applied:
      - 'YR1' popped -> `this.revertPenaltyPoints(opponentTeam, 1)`
      - 'YR2' popped -> `this.revertPenaltyPoints(opponentTeam, 2)`

    Add tests to `matchStore.cards.test.js` or create `matchStore.penalty.test.js` to explicitly cover normal penalty awards, game boundary triggers, carry overs, and reversions.
  </action>
  <verify>npx vitest run frontend/src/stores/ --passWithNoTests</verify>
  <done>Penalty points are awarded correctly on YR1/YR2, trigger server rotation/game end changes natively, support cross-game carry-over, and are completely reversible.</done>
</task>

## Success Criteria
- [ ] YR1 gives 1 point to opponent.
- [ ] YR2 gives 2 points to opponent.
- [ ] Excessive penalty points that end a game carry over to the subsequent game.
- [ ] Reverting YR1/YR2 perfectly undoes score changes, removes carry overs, and "un-ends" games if applicable.
