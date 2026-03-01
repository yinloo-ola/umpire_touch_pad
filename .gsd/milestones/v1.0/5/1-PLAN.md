---
phase: 5
plan: 1
wave: 1
---

# Plan 5.1: Deciding-Game Alert Modal & Side Swap Logic

## Objective
Delay the deciding-game side swap (at 5 points) until after the umpire dismisses an alert modal, preventing immediate visual jerking during competitive play.

## Context
- `frontend/src/stores/matchStore.js`
- `frontend/src/components/Touchpad.vue`

## Tasks

<task type="auto">
  <name>Update Store Logic for Mid-Game Swap Pending</name>
  <files>frontend/src/stores/matchStore.js</files>
  <action>
    - Add `midGameSwapPending: false` to the store state.
    - Inside `resetMatchState`, set `this.midGameSwapPending = false`.
    - Modify `handleScore()`:
      - Replace immediate swap execution for deciding-game 5-point trigger.
      - Instead of directly assigning `this.swappedSides = !this.swappedSides` and changing the active players, set `this.midGameSwapPending = true`.
    - Create a new action `applyMidGameSwap()` which executes the actual side swap logic:
      - Toggles `this.swappedSides`
      - If `this.currentMatch?.type === 'doubles'`, adjusts receivers (swaps `p1Top`/`p1Bot` or `p2Top`/`p2Bot` appropriately)
      - Calls `this.syncDoublesQuadrants()`
      - Sets `this.midGameSwapPending = false` and `this.decidingSwapDone = true`
  </action>
  <verify>npm run test</verify>
  <done>Game state correctly pauses state changes until `applyMidGameSwap()` is triggered.</done>
</task>

<task type="auto">
  <name>Add Alert Modal to Touchpad</name>
  <files>frontend/src/components/Touchpad.vue</files>
  <action>
    - Add a modal block to the template (guarded by `v-if="matchStore.midGameSwapPending"`).
    - Implement a `.modal-overlay` with `.modal-content`.
    - Modal text must match exactly: Title: "Decider game of Match", Body: "Decider game of Match, 5 points scored, swapping sides and players."
    - Insert a "Close" button triggering `matchStore.applyMidGameSwap()`.
  </action>
  <verify>npm run dev</verify>
  <done>UI reliably presents the modal at exactly 5 points and executes the side swap strictly after Close is pressed.</done>
</task>

## Success Criteria
- [ ] At exactly 5 points in a deciding game (e.g., game 5 of Best-of-5), the interface presents a modal overlay showing "Decider game of Match".
- [ ] No visual side swap occurs until the umpire explicitly clicks "Close".
