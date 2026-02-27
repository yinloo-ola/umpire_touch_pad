# ROADMAP.md

> **Current Phase**: Phase 3 — SetupView Doubles Four-Quadrant Court
> **Milestone**: v1.0 — Complete Doubles Match Feature

---

## Must-Haves (from SPEC)

- [ ] Four-quadrant court for doubles (SetupView + Touchpad)
- [ ] Left/Right "Swap Players" buttons (pre-warmup and during play)
- [ ] ITTF doubles serve rotation (A→X→B→Y→A, auto + override)
- [ ] Between-game serve setup (constrained by previous game)
- [ ] Deciding-game mid-game side swap (at 5 points, doubles + singles)

---

## Phases

### Phase 1: Store Foundation — Doubles State & Quadrant Model
**Status**: ✅ Complete
**Objective**: Extend `matchStore.js` with all new state fields and core logic for doubles: quadrant positions, doubles server/receiver tracking, and the A→X→B→Y→A rotation engine. No UI changes yet — just the data layer.

**Tasks**:
- Add state: `p1Top`, `p1Bot`, `p2Top`, `p2Bot` (player indices within each team)
- Add state: `doublesServer`, `doublesReceiver`, `doublesInitialServer`, `doublesInitialReceiver`
- Add state: `decidingSwapDone` (flag to prevent double-trigger in deciding game)
- Add action: `swapLeftPlayers()` — swaps `p1Top ↔ p1Bot`
- Add action: `swapRightPlayers()` — swaps `p2Top ↔ p2Bot`
- Extend `handleScore()`: branch on `currentMatch.type === 'doubles'` to use new rotation logic
- Implement doubles rotation engine: given `doublesInitialServer` + total points, compute current `doublesServer` and `doublesReceiver`
- Extend `nextGame()`: implement between-game doubles logic (serving team choice, constrained receiver)
- Add action: `setDoublesServerForNewGame(serverTeam, serverPlayerIdx)` — sets server for start of new game, auto-derives receiver
- Implement deciding-game trigger: in `handleScore()`, detect `isDecidingGame && (p1Score===5 || p2Score===5) && !decidingSwapDone` and apply mid-game swap
- Add getters: `doublesLeftTopPlayer`, `doublesLeftBotPlayer`, `doublesRightTopPlayer`, `doublesRightBotPlayer` — computed from `swappedSides` + quadrant indices
- Add getter: `isDoublesLeftServer` (person on left side who is current server)
- Add getter: `doublesCurrentServerName`, `doublesCurrentReceiverName`
- **Requirement**: REQ-STORE-01 through REQ-STORE-10

**Requirements Link**: SPEC § Data Model Changes, § Rotation Logic, § Deciding-Game Mid-Game Swap

---

### Phase 2: Testing — Vitest Setup & Phase 1 Store Tests
**Status**: ✅ Complete
**Objective**: Install Vitest in the frontend project, wire up Pinia test helpers, and write a comprehensive unit test suite for all `matchStore.js` doubles logic introduced in Phase 1. Tests must pass and be runnable via `make test`.

**Tasks**:
- Install `vitest` + `@vitest/ui` + `@pinia/testing` as dev dependencies
- Add `test` and `test:watch` scripts to `package.json`
- Add `make test` target to the root `Makefile`
- Configure `vite.config.js` with a `test` block (globals, environment)
- Write `frontend/src/stores/__tests__/matchStore.doubles.test.js` covering:
  - `swapLeftPlayers()` / `swapRightPlayers()` index toggling (Plan 1.1)
  - Quadrant getters: correct player returned with `swappedSides` false and true (Plan 1.1)
  - Rotation formula: `doublesServerName` / `doublesReceiverName` at scores 0-0, 2-0, 4-0, 6-0 (full cycle) (Plan 1.2)
  - Deuce rotation: at 10-10 and beyond, every single point advances the rotation (Plan 1.2)
  - Singles guard: `server` state is NOT mutated by `handleScore()` when `type === 'doubles'` (Plan 1.2)
  - `setDoublesServer()` umpire override: correct recalibration at cyclePos 0, 1, 2, 3 (Plan 1.2)
  - `setDoublesServerForNewGame()`: mandatory receiver derived correctly from prev-game cycle (Plan 1.3)
  - `nextGame()` for doubles: records `prevDoublesInitialServer/Receiver`, sets `doublesNextServingTeam`, resets quadrant indices (Plan 1.3)
  - Deciding-game swap (singles): `swappedSides` toggles, no quadrant index changes (Plan 1.3)
  - Deciding-game swap (doubles): all four indices swap + one extra swap on receiving side (Plan 1.3)
  - `decidingSwapDone` prevents double-trigger (Plan 1.3)
- **Requirement**: REQ-TEST-01 through REQ-TEST-11

**Requirements Link**: Plans 1.1, 1.2, 1.3 success criteria

---

### Phase 3: SetupView — Doubles Four-Quadrant Court
**Status**: ✅ Complete
**Objective**: Update SetupView to show 4 player quadrants for doubles matches, with two "Swap Players" buttons (left and right) and correct server/receiver designation UI that handles both singles and doubles.

**Tasks**:
- Detect match type in `SetupView.vue`; conditionally render doubles layout vs singles layout
- Add 4-quadrant court grid for doubles: TL, TR, BL, BR positions using store getters
- Add `[↓↑ Swap Players]` button on left side → calls `matchStore.swapLeftPlayers()`
- Add `[↓↑ Swap Players]` button on right side → calls `matchStore.swapRightPlayers()`
- Move serve/receive indicators to bottom-left and bottom-right of court (matching reference image)
- For doubles: clicking the Server box designates which player on the **left side** serves first; clicking Receiver box is constrained (or also designable)
- For between-game (doubles): show a "Who serves first?" modal for the serving team with the two player choices; auto-set receiver based on choice
- Style the player cards in each quadrant to show: player label (P1, P1D, P2, P2D), flag/icon, name, country
- Ensure Swap sides button still works (swaps all 4 players across the net)
- Write component/store integration tests for SetupView doubles layout, quadrant rendering, swap button behaviour, and `setDoublesServerForNewGame()` being called correctly from the modal
- **Requirement**: REQ-UI-SETUP-01 through REQ-UI-SETUP-06

**Requirements Link**: SPEC § UX Design Notes (SetupView)

---

### Phase 4: Touchpad — Doubles Live Scoring UI
**Status**: ⬜ Not Started
**Objective**: Update the live scoring Touchpad view to correctly show 4 quadrants during doubles play, display the current individual server and receiver by name, and keep the Swap Players buttons accessible during the game.

**Tasks**:
- 4-quadrant status box during doubles play (show player names in each quadrant, same layout as SetupView)
- Update serve indicator display: show individual player name below S/R circle for doubles
- Keep Swap Players (left) and Swap Players (right) buttons visible in the `top-row` of the interaction grid during doubles
- Swap Players buttons call `swapLeftPlayers()` / `swapRightPlayers()` — store updates all affected positions
- Serve indicator override for doubles: clicking the Receiver indicator calls the new `setDoublesServerForNewGame`-style override, adjusting `doublesServer`/`doublesReceiver` directly
- Score summary table: show "T1" / "T2" team names (since player count doesn't fit); already works
- Mid-game deciding swap: no UI trigger needed (auto-triggers at 5 points); potentially show a brief toast/flash to inform the umpire
- Write component/store integration tests for Touchpad doubles: quadrant display, serve indicator name update per rotation point, Swap Players buttons wiring, and serve override callback
- **Requirement**: REQ-UI-TOUCH-01 through REQ-UI-TOUCH-05

**Requirements Link**: SPEC § UX Design Notes (Touchpad), § Deciding-Game Mid-Game Swap

---

### Phase 5: Deciding-Game Swap + Between-Game Modal + Polish
**Status**: ⬜ Not Started
**Objective**: Implement the deciding-game side-swap for both singles and doubles (at 5 points), build the between-game serve selection modal for doubles, verify the full match flow works end-to-end, and handle edge cases.

**Tasks**:
- Verify deciding-game mid-game swap fires correctly for both singles and doubles
- Build "New Game — Choose Server" modal for doubles: appears when "Next Game" is tapped for a doubles match
  - Shows which team is serving first (auto-determined by ITTF rule)
  - Offers the two player choices from that team
  - On selection, calls `setDoublesServerForNewGame(team, playerIdx)`
- For singles: `nextGame()` already handles correctly — verify no regression
- Edge cases:
  - Best-of-7: deciding game is game 7
  - Deuce (10-10+): rotation continues at 1-point intervals using same formula
  - Umpire correction mid-game: override `doublesServer` + recalibrate rotation
- Smoke test: manually play through a full 3-game doubles match and verify all rotations are correct
- Update `ARCHITECTURE.md` with new store fields and component changes
- Write end-to-end store-level tests for edge cases: Best-of-7 deciding game, deuce rotation at 10-10+, umpire mid-game correction via `setDoublesServer()`, and full 3-game doubles match rotation walkthrough
- **Requirement**: REQ-EDGE-01 through REQ-EDGE-05

**Requirements Link**: SPEC § Deciding-Game Mid-Game Swap, § Between-Game Rules

---

## Deferred (Future Milestones)

- Card system (yellow/red/white cards per player)
- Expedite rule timer
- Match result persistence (backend database)
- Player profile lookup by ID
- Edit score history
