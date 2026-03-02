---
phase: 1
plan: 1
wave: 1
---

# Plan 1.1: Card State Management in matchStore

## Objective
Update `matchStore.js` to initialize card and timeout states, bound logically to teams (1 and 2), supporting per-team card tracking for players and coaches separately. Implement actions to issue and revert cards and timeouts, adhering to LIFO per-team and validation constraints.

## Context
- .gsd/SPEC.md
- .gsd/ROADMAP.md
- frontend/src/stores/matchStore.js

## Tasks

<task type="auto">
  <name>Card State Initialization</name>
  <files>frontend/src/stores/matchStore.js</files>
  <action>
    Update state and reset logic in `useMatchStore`:
    - Add arrays `team1Cards`, `team2Cards`, `team1CoachCards`, `team2CoachCards` initialized to empty arrays `[]`.
    - Add boolean flags `team1Timeout: false`, `team2Timeout: false`.
    - Ensure all the new state variables are fully cleared/reset inside `resetMatchState()`.
  </action>
  <verify>grep -q "team1Cards" frontend/src/stores/matchStore.js</verify>
  <done>All required fields exist in state and are cleared properly in resetMatchState.</done>
</task>

<task type="auto">
  <name>Issue and Revert Actions</name>
  <files>frontend/src/stores/matchStore.js; frontend/src/stores/__tests__/matchStore.cards.test.js</files>
  <action>
    Implement logic to manage cards securely per the spec rules (Wait with the penalty point granting/reverting for Phase 2, handle state arrays purely here):
    
    - `issueCard(teamNum, type, target = 'player')`: 
       Validate order constraints before pushing to the appropriate array (`teamNCards` or `teamNCoachCards`).
       Player sequence: 'Yellow' -> 'YR1' -> 'YR2'.
       Coach sequence: 'Yellow' -> 'Red'.
       Return false or error on invalid sequence. If valid, push to array.
       
    - `revertLastCard(teamNum, target = 'player')`: 
       Pops the last item off the respective team array (LIFO behavior per-team, per-track).
       
    - `issueTimeout(teamNum)` & `revertTimeout(teamNum)`:
       Manage the boolean state.
       
    - Create `frontend/src/stores/__tests__/matchStore.cards.test.js`:
       Write tests covering the new state toggles, validation rules, independent tracking between players and coaches, and per-team LIFO reverts.
  </action>
  <verify>npx vitest run frontend/src/stores/__tests__/matchStore.cards.test.js</verify>
  <done>Store actions correctly update state enforcing order and LIFO constraints, with all card unit tests passing.</done>
</task>

## Success Criteria
- [ ] Attempting to issue invalid cards returns early or throws error.
- [ ] Reverting cards pops the last item from that specific team's specific track.
- [ ] Coach and Player tracks are fully decoupled.
- [ ] Timeouts manage their own individual flags without using the array stacks.
