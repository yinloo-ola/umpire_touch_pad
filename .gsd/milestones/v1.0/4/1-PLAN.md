---
phase: 4
plan: 1
wave: 1
---

# Plan 4.1: Touchpad Doubles Live UI

## Objective
Update `Touchpad.vue` so that during a doubles match it:
1. Shows a 4-quadrant status box (same layout as SetupView) instead of the 2-slot singles box
2. Adds **Swap Players (left)** and **Swap Players (right)** buttons in the `top-row` of the interaction grid (visible for doubles only)
3. Clicking the **receiver** serve indicator in doubles calls `setDoublesServer()` (umpire serve-override) instead of the existing `setServer()` singles call

All singles behaviour must remain unchanged.

## Context
- `.gsd/SPEC.md` — REQ-UI-TOUCH-01 through REQ-UI-TOUCH-05
- `.gsd/ARCHITECTURE.md` — if it exists
- `frontend/src/components/Touchpad.vue` — the file to modify
- `frontend/src/components/SetupView.vue` — reference for doubles layout, serve indicator pattern, and how `swapLeft/swapRight/isLeftDoublesServer/doublesServerName/doublesReceiverName` are used
- `frontend/src/stores/matchStore.js` — getters available:
  - `doublesLeftTopPlayer`, `doublesLeftBotPlayer`, `doublesRightTopPlayer`, `doublesRightBotPlayer` (player objects with `.name`)
  - `doublesServerName` (string), `doublesReceiverName` (string)
  - `isLeftDoublesServer` (bool)
  - `isLeftServer` (bool — singles only, keep intact)
  - Actions: `swapLeftPlayers()`, `swapRightPlayers()`, `setDoublesServer(team, playerIdx)`

## Tasks

<task type="auto">
  <name>Add doubles computed properties and actions to Touchpad script</name>
  <files>frontend/src/components/Touchpad.vue</files>
  <action>
    In the `<script setup>` block, add:

    1. `const isDoubles = computed(() => matchStore.currentMatch?.type === 'doubles')`

    2. Quadrant computed refs (mirrors SetupView exactly):
       ```js
       const leftTopPlayer  = computed(() => matchStore.doublesLeftTopPlayer)
       const leftBotPlayer  = computed(() => matchStore.doublesLeftBotPlayer)
       const rightTopPlayer = computed(() => matchStore.doublesRightTopPlayer)
       const rightBotPlayer = computed(() => matchStore.doublesRightBotPlayer)
       ```

    3. Swap Players actions:
       ```js
       const swapLeftPlayers  = () => matchStore.swapLeftPlayers()
       const swapRightPlayers = () => matchStore.swapRightPlayers()
       ```

    4. Replace the existing `swapServer(side)` function with a doubles-aware version:
       ```js
       const swapServer = (side) => {
         if (isDoubles.value) {
           // Determine which player on that side is the receiver and make them server
           const isReceiverOnLeft = !matchStore.isLeftDoublesServer && side === 'left'
           const isReceiverOnRight = matchStore.isLeftDoublesServer && side === 'right'
           if (isReceiverOnLeft || isReceiverOnRight) {
             // Get receiver details from the pair and set as server
             const A = matchStore.doublesInitialServer
             const X = matchStore.doublesInitialReceiver
             const B = { team: A.team, player: 1 - A.player }
             const Y = { team: X.team, player: 1 - X.player }
             const total = matchStore.p1Score + matchStore.p2Score
             const servesPassed = (matchStore.p1Score >= 10 && matchStore.p2Score >= 10)
               ? 10 + (total - 20) : Math.floor(total / 2)
             const cycle = [
               { server: A, receiver: X },
               { server: X, receiver: B },
               { server: B, receiver: Y },
               { server: Y, receiver: A },
             ]
             const currentReceiver = cycle[servesPassed % 4].receiver
             matchStore.setDoublesServer(currentReceiver.team, currentReceiver.player)
           }
         } else {
           // Singles: existing logic
           const playerOnSide = side === 'left'
             ? (matchStore.swappedSides ? 2 : 1)
             : (matchStore.swappedSides ? 1 : 2)
           matchStore.setServer(playerOnSide)
         }
       }
       ```
  </action>
  <verify>grep -n "isDoubles\|leftTopPlayer\|doublesServerName\|swapLeftPlayers\|swapRightPlayers" frontend/src/components/Touchpad.vue | head -20</verify>
  <done>All new computed refs and actions are present in Touchpad.vue script block</done>
</task>

<task type="auto">
  <name>Update Touchpad template for doubles UI</name>
  <files>frontend/src/components/Touchpad.vue</files>
  <action>
    Make the following two template changes:

    **A. top-row: Add Swap Players buttons for doubles**

    Replace the existing `top-row` div (which currently has two `Cards` buttons) with:
    ```html
    <div class="grid-row top-row">
      <div class="side-controls left-side">
        <!-- Doubles: Swap Players left button; Singles: Cards button -->
        <button v-if="isDoubles" @click="swapLeftPlayers" class="swap-players-btn-tp swap-left-tp" id="tp-swap-left-btn">
          <i class="fa-solid fa-arrows-up-down"></i> Swap
        </button>
        <button v-else class="card-btn">Cards</button>
      </div>
      <div class="side-controls right-side">
        <button v-if="isDoubles" @click="swapRightPlayers" class="swap-players-btn-tp swap-right-tp" id="tp-swap-right-btn">
          <i class="fa-solid fa-arrows-up-down"></i> Swap
        </button>
        <button v-else class="card-btn">Cards</button>
      </div>
    </div>
    ```

    **B. status-box-tp: Add doubles 4-quadrant layout inside the status box**

    Inside `.status-box-tp`, the current `table-player-grid` div shows 2 players (bottom-left and top-right). Replace the contents of that `v-if="matchStore.pointStarted && !matchStore.isGameOver"` block:
    ```html
    <!-- Doubles 4-quadrant layout -->
    <div class="table-player-grid" v-if="matchStore.pointStarted && !matchStore.isGameOver && isDoubles">
      <div class="table-quad top-left">
        <div class="table-player-info">
          <span class="tp-p-label">{{ matchStore.swappedSides ? 'P2' : 'P1' }}</span>
          <span class="tp-p-name">{{ leftTopPlayer?.name ?? '—' }}</span>
        </div>
      </div>
      <div class="table-quad top-right">
        <div class="table-player-info">
          <span class="tp-p-label">{{ matchStore.swappedSides ? 'P1' : 'P2' }}</span>
          <span class="tp-p-name">{{ rightTopPlayer?.name ?? '—' }}</span>
        </div>
      </div>
      <div class="table-net-line"></div>
      <div class="table-horizontal-line"></div>
      <div class="table-quad bottom-left">
        <div class="table-player-info">
          <span class="tp-p-label">{{ matchStore.swappedSides ? 'P2D' : 'P1D' }}</span>
          <span class="tp-p-name">{{ leftBotPlayer?.name ?? '—' }}</span>
        </div>
      </div>
      <div class="table-quad bottom-right">
        <div class="table-player-info">
          <span class="tp-p-label">{{ matchStore.swappedSides ? 'P1D' : 'P2D' }}</span>
          <span class="tp-p-name">{{ rightBotPlayer?.name ?? '—' }}</span>
        </div>
      </div>
    </div>
    <!-- Singles 2-slot layout (unchanged) -->
    <div class="table-player-grid" v-if="matchStore.pointStarted && !matchStore.isGameOver && !isDoubles">
      <div class="table-quad bottom-left">
        <div class="table-player-info">
          <span class="tp-p-label">{{ matchStore.swappedSides ? 'Player 2' : 'Player 1' }}</span>
          <span class="tp-p-name">{{ leftPlayerName }}</span>
          <span class="tp-p-country">{{ leftCountry }}</span>
        </div>
      </div>
      <div class="table-quad top-right">
        <div class="table-player-info">
          <span class="tp-p-label">{{ matchStore.swappedSides ? 'Player 1' : 'Player 2' }}</span>
          <span class="tp-p-name">{{ rightPlayerName }}</span>
          <span class="tp-p-country">{{ rightCountry }}</span>
        </div>
      </div>
      <div class="table-net-line"></div>
      <div class="table-horizontal-line"></div>
    </div>
    ```

    **C. Serve indicators click and active/status updates**

    Update the LEFT serve indicator's click condition and the RIGHT serve indicator's click condition so
    doubles uses `isLeftDoublesServer` and singles uses `isLeftServer`:
    - Left indicator: active when `(isDoubles && matchStore.isLeftDoublesServer) || (!isDoubles && matchStore.isLeftServer)`
    - Right indicator: active when `(isDoubles && !matchStore.isLeftDoublesServer) || (!isDoubles && !matchStore.isLeftServer)`
    - Left indicator shows 'S' when `(isDoubles ? matchStore.isLeftDoublesServer : matchStore.isLeftServer)`
    - Right indicator shows 'S' when `(isDoubles ? !matchStore.isLeftDoublesServer : !matchStore.isLeftServer)`
    - Left clickable (receiver click) when: `matchStore.isStarted && (isDoubles ? !matchStore.isLeftDoublesServer : !matchStore.isLeftServer)`
    - Right clickable when: `matchStore.isStarted && (isDoubles ? matchStore.isLeftDoublesServer : matchStore.isLeftServer)`

    **D. Add scoped CSS** for the new elements at bottom of `<style scoped>`:
    ```css
    .swap-players-btn-tp {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 4px;
      padding: 0.4rem 0.3rem;
      font-size: 0.65rem;
      background: var(--accent-orange, #f59e0b);
      color: #000;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      writing-mode: vertical-rl;
      text-orientation: mixed;
      min-width: 30px;
    }
    .swap-players-btn-tp:active { opacity: 0.7; }
    .top-left { grid-column: 1; grid-row: 1; }
    .bottom-right { grid-column: 2; grid-row: 2; }
    ```
  </action>
  <verify>grep -n "isDoubles\|swap-players-btn-tp\|leftTopPlayer\|tp-swap-left-btn\|top-left\|bottom-right" frontend/src/components/Touchpad.vue | head -30</verify>
  <done>
    - top-row has conditional Swap Players buttons for doubles
    - status box has separate doubles (4-quad) and singles (2-slot) layouts conditioned on isDoubles
    - serve indicator active/S/R classes use isLeftDoublesServer for doubles and isLeftServer for singles
    - CSS classes added for new elements
  </done>
</task>

## Success Criteria
- [ ] During a doubles match, top-row shows two "Swap" buttons (swap-left-tp, swap-right-tp) instead of Cards buttons
- [ ] Clicking "Swap" left during doubles calls `swapLeftPlayers()` — visually exchanges TL/BL names in status box
- [ ] During a doubles match with pointStarted, status box shows 4 named quadrant slots (TL, TR, BL, BR)
- [ ] Singles status box still shows 2-slot layout unchanged
- [ ] Clicking the receiver indicator in doubles correctly invokes `setDoublesServer()` (not `setServer()`)
- [ ] `make test` still exits 0 (no regressions)
