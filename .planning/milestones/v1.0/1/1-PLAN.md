---
phase: 1
plan: 1
wave: 1
---

# Plan 1.1: Quadrant State, Swap Actions & Player Getters

## Objective
Add the doubles player-position model to `matchStore.js`. This gives the store knowledge of which player (index 0 or 1 within their team) occupies each of the four court quadrants (top-left, bottom-left, top-right, bottom-right). Add swap actions and computed getters so components can read and mutate quadrant positions without knowing the internal indices.

This plan does NOT touch serve rotation — that's Plan 1.2.

## Context
- `.gsd/SPEC.md` — § Data Model Changes (Quadrants), § Goals
- `frontend/src/stores/matchStore.js` — existing store to extend
- Existing pattern: `swappedSides` bool flips which "side" is displayed as left/right. The new quadrant state lives on top of this.

## Tasks

<task type="auto">
  <name>Add quadrant state fields and extend resetMatchState()</name>
  <files>frontend/src/stores/matchStore.js</files>
  <action>
    In the `state: () => ({...})` block, add these four fields after `swappedSides`:

    ```js
    // Doubles quadrant indices (0 or 1, index into team1[]/team2[])
    // p1Top: which team1 player is in the top-left quadrant
    // p1Bot: which team1 player is in the bottom-left quadrant
    // p2Top: which team2 player is in the top-right quadrant
    // p2Bot: which team2 player is in the bottom-right quadrant
    p1Top: 0,
    p1Bot: 1,
    p2Top: 0,
    p2Bot: 1,
    // Flag to prevent double-triggering the deciding-game mid-game swap
    decidingSwapDone: false,
    ```

    In `resetMatchState()`, reset all five new fields:
    ```js
    this.p1Top = 0
    this.p1Bot = 1
    this.p2Top = 0
    this.p2Bot = 1
    this.decidingSwapDone = false
    ```

    Do NOT change any other existing state or reset logic.
  </action>
  <verify>grep -E "p1Top|p1Bot|p2Top|p2Bot|decidingSwapDone" frontend/src/stores/matchStore.js | wc -l</verify>
  <done>Command outputs 10 (each field appears in state init + resetMatchState = 5×2 = 10 lines)</done>
</task>

<task type="auto">
  <name>Add swapLeftPlayers() and swapRightPlayers() actions</name>
  <files>frontend/src/stores/matchStore.js</files>
  <action>
    In the `actions: { ... }` block, add two new actions after `toggleSwapSides()`:

    ```js
    // Doubles only: swap which player is top vs bottom on the LEFT side (team1)
    swapLeftPlayers() {
      ;[this.p1Top, this.p1Bot] = [this.p1Bot, this.p1Top]
    },

    // Doubles only: swap which player is top vs bottom on the RIGHT side (team2)
    swapRightPlayers() {
      ;[this.p2Top, this.p2Bot] = [this.p2Bot, this.p2Top]
    },
    ```

    The semicolon before the destructured assignment is intentional — it prevents ASI issues when the previous line has no semicolon.
  </action>
  <verify>grep -c "swapLeftPlayers\|swapRightPlayers" frontend/src/stores/matchStore.js</verify>
  <done>Command outputs 2</done>
</task>

<task type="auto">
  <name>Add quadrant player getters for doubles</name>
  <files>frontend/src/stores/matchStore.js</files>
  <action>
    In the `getters: { ... }` block, add these getters after the existing `formattedTime` getter.
    These getters account for `swappedSides` so components always read "left side / right side" in display terms:

    ```js
    // Doubles: which team1 player object is on the LEFT SIDE (top quadrant)
    doublesLeftTopPlayer: (state) => {
      if (!state.currentMatch) return null
      const idx = state.swappedSides ? state.p2Top : state.p1Top
      const team = state.swappedSides ? state.currentMatch.team2 : state.currentMatch.team1
      return team[idx]
    },

    // Doubles: which team1 player object is on the LEFT SIDE (bottom quadrant)
    doublesLeftBotPlayer: (state) => {
      if (!state.currentMatch) return null
      const idx = state.swappedSides ? state.p2Bot : state.p1Bot
      const team = state.swappedSides ? state.currentMatch.team2 : state.currentMatch.team1
      return team[idx]
    },

    // Doubles: which team2 player object is on the RIGHT SIDE (top quadrant)
    doublesRightTopPlayer: (state) => {
      if (!state.currentMatch) return null
      const idx = state.swappedSides ? state.p1Top : state.p2Top
      const team = state.swappedSides ? state.currentMatch.team1 : state.currentMatch.team2
      return team[idx]
    },

    // Doubles: which team2 player object is on the RIGHT SIDE (bottom quadrant)
    doublesRightBotPlayer: (state) => {
      if (!state.currentMatch) return null
      const idx = state.swappedSides ? state.p1Bot : state.p2Bot
      const team = state.swappedSides ? state.currentMatch.team1 : state.currentMatch.team2
      return team[idx]
    },
    ```

    IMPORTANT: These getters return the full player object `{ name, country }` — not just a name string — so components can access `.name` and `.country`.

    IMPORTANT: Do NOT use `this.` inside these getters — they use the `(state) =>` arrow form, which cannot use `this`. Use `state.` instead.
  </action>
  <verify>grep -c "doublesLeft\|doublesRight" frontend/src/stores/matchStore.js</verify>
  <done>Command outputs 4</done>
</task>

## Success Criteria
- [ ] `p1Top`, `p1Bot`, `p2Top`, `p2Bot`, `decidingSwapDone` exist in state and are reset by `resetMatchState()`
- [ ] `swapLeftPlayers()` and `swapRightPlayers()` actions toggle the correct index pairs
- [ ] Four quadrant getters (`doublesLeftTopPlayer`, `doublesLeftBotPlayer`, `doublesRightTopPlayer`, `doublesRightBotPlayer`) exist and return player objects
- [ ] `cd frontend && npm run dev` starts without errors
