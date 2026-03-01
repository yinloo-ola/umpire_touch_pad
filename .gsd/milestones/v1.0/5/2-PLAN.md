---
phase: 5
plan: 2
wave: 1
---

# Plan 5.2: Automatic Between-Game Receiver & Polish

## Objective
Automatically determine the doubles receiver at the start of games 2-5 without projecting an unnecessary modal, seamlessly complying with ITTF rules based on the previous game.

## Context
- `frontend/src/stores/matchStore.js`
- `frontend/src/components/SetupView.vue`
- `frontend/src/components/Touchpad.vue`
- `.gsd/ARCHITECTURE.md`

## Tasks

<task type="auto">
  <name>Automate Receiver Calculation in Store</name>
  <files>frontend/src/stores/matchStore.js</files>
  <action>
    - In `nextGame()`, for doubles, after saving `prevDoublesInitialServer` and `prevDoublesInitialReceiver`, explicitly invoke `this.setDoublesServerForNewGame(this.doublesNextServingTeam, 0, this.prevDoublesInitialServer, this.prevDoublesInitialReceiver)` to preemptively formulate the core mandatory receiver instead of awaiting a modal callback.
    - Keep `doublesNextServingTeam` strictly for internal checks.
    - Inside `swapPlayerOnTeam(teamNum)`, within the `if (isServerTeam)` scope:
      - Assess whether it's perfectly the start of a matched game: `const isStartOfGame = this.p1Score === 0 && this.p2Score === 0`.
      - If it is the start of the game, `this.game > 1` holds true, and `this.prevDoublesInitialServer` exists: execute `this.setDoublesServerForNewGame(teamNum, nextPlayerIdx, this.prevDoublesInitialServer, this.prevDoublesInitialReceiver)` to seamlessly adapt the mandatory receiver dependent on the recently switched server.
      - If conditions fail, cascade to a standard `this.setDoublesServer(teamNum, nextPlayerIdx)`.
  </action>
  <verify>npm run test</verify>
  <done>The store consistently computes receivers at the start of a new game dynamically and recalibrates upon a manual pre-match swap.</done>
</task>

<task type="auto">
  <name>Clean Up Obsolete Modal Logic</name>
  <files>frontend/src/components/SetupView.vue, frontend/src/components/Touchpad.vue</files>
  <action>
    - Open `SetupView.vue` and forcefully rip out `showServerChoiceModal`, `chooseNewGameServer()`, and the explicit `<div ... id="doubles-server-choice-modal">` DOM node entirely.
    - Verify `Touchpad.vue` is scrubbed clean of any orphaned choice modals that replicate this pattern.
  </action>
  <verify>npm run dev</verify>
  <done>Umpire transitions smoothly into the next game completely devoid of the server choice modal.</done>
</task>

<task type="auto">
  <name>Synchronize Technical Architecture</name>
  <files>.gsd/ARCHITECTURE.md</files>
  <action>
    - Register definitions regarding `midGameSwapPending`.
    - Describe the migration from the `Server Choice Modal` to autonomous computation via `setDoublesServerForNewGame`.
    - Document the unique context evaluation executed within `swapPlayerOnTeam()`.
  </action>
  <verify>cat .gsd/ARCHITECTURE.md</verify>
  <done>ARCHITECTURE.md is accurately up-to-date showcasing Phase 5 alterations.</done>
</task>

## Success Criteria
- [ ] Transiting to "Next Game" natively transitions state to ready instantly.
- [ ] Receiver computation is flawless based on historical served-to mapping.
- [ ] Umpire manual server swaps natively correct the mandatory receiver pre-warmup.
