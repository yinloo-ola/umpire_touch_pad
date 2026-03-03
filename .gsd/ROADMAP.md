# ROADMAP.md

> **Current Milestone**: Card System
> **Goal**: Implement the penalty card and timeout system natively into the touch pad, with automatic penalty point awarding and timeout management.

---

## Must-Haves (from SPEC)

- [ ] Card modal UI with Timeout, Yellow, YR1, YR2 (players) & Yellow, Red (coaches).
- [ ] Card constraints: independent tracks for players vs. coaches, greyed out once given, granted in specific order, reversed in per-team LIFO order (Timeouts reverted independently).
- [ ] Penalty point awarding & reverting: YR1 = 1 pt, YR2 = 2 pts (opponent), reverting cards also removes the awarded points. Triggers standard serve rotation. Handled up to game/match boundaries.
- [ ] Display assigned cards on the touchpad next to the toggle button.
- [ ] Card alignments swap sides synchronously when players swap sides.
- [ ] Timeout System: 1-minute cancelable countdown, restricted to the "Start of play" state.

---

## Phases

### Phase 1: State Management & Game Data Structure
**Status**: ✅ Complete
**Objective**: Update Pinia stores to handle card arrays (stack), ordered issuance limits, and logical ties to the Player/Side entities.

### Phase 2: Penalty Points Tracking & Edge Cases
**Status**: ✅ Complete
**Objective**: Implement logical triggers to automatically award opponent points upon YR1/YR2 issuance. Resolve edge cases where penalty points cascade into game wins or carry over to the subsequent game. (Achievement: Added "Undo Next Game" cross-game revert).

### Phase 3: Timeout Logic
**Status**: ✅ Complete
**Objective**: Build out the state and timer restrictions for match Timeouts (1 per match/player, 60s max, only in `Start Of Play`).

### Phase 4: Modal UI (Cards & Timeout)
**Status**: ✅ Complete
**Objective**: Build the visual Card Modal and the Timeout Countdown Modal as refined in Part 2, including the top-right widget style and auto-dismissal logic.

### Phase 5: Display Indicators & Side-Swapping Integration
**Status**: ⬜ Not Started
**Objective**: Ensure given cards populate visually next to the card button on the touchpad, and successfully swap visual sides alongside player side-swaps.

---

## Deferred (Future Milestones)

- Expedite rule timer
- Match result persistence (backend database)
- Player profile lookup by ID
- Edit score history

