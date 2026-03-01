---
phase: 3
plan: 1
wave: 1
depends_on: []
files_modified:
  - frontend/src/components/SetupView.vue
autonomous: true
user_setup: []

must_haves:
  truths:
    - "When match type is 'doubles', SetupView renders 4 player cards (TL, BL, TR, BR) instead of 2 slots"
    - "When match type is 'singles', SetupView renders EXACTLY the same layout as before (no regression)"
    - "Left 'Swap Players' button calls matchStore.swapLeftPlayers() and changes which player is shown in TL vs BL"
    - "Right 'Swap Players' button calls matchStore.swapRightPlayers() and changes which player is shown in TR vs BR"
    - "swappedSides toggle (Swap Sides button) still correctly reflects all 4 quadrant players"
  artifacts:
    - "frontend/src/components/SetupView.vue modified — singles branch untouched, doubles branch added"
---

# Plan 3.1: SetupView Doubles Layout — 4-Quadrant Court + Swap Buttons

<objective>
Add conditional doubles layout to SetupView.vue that shows four individual player quadrants (TL, BL, TR, BR) with dedicated Swap Players buttons on left and right sides.

Purpose: Phase 3 goal is the SetupView doubles UI. This plan lays the structural foundation — the grid and swap buttons — without touching the serve designation UI (that is Plan 3.2).

Output: Modified SetupView.vue with a `v-if="isDoubles"` branch in the court area and two new Swap Players buttons.
</objective>

<context>
Load for context:
- .gsd/SPEC.md (§ UX Design Notes, § Data Model Changes — quadrant layout)
- frontend/src/components/SetupView.vue (current file — full content)
- frontend/src/stores/matchStore.js (getters: doublesLeftTopPlayer, doublesLeftBotPlayer, doublesRightTopPlayer, doublesRightBotPlayer, swappedSides; actions: swapLeftPlayers, swapRightPlayers)
</context>

<tasks>

<task type="auto">
  <name>Add isDoubles computed + doubles quadrant data computed properties to SetupView script</name>
  <files>frontend/src/components/SetupView.vue</files>
  <action>
    In the `<script setup>` block, add:

    1. `const isDoubles = computed(() => matchStore.currentMatch?.type === 'doubles')`

    2. Four quadrant player computeds that read from store getters:
       ```js
       const leftTopPlayer  = computed(() => matchStore.doublesLeftTopPlayer)
       const leftBotPlayer  = computed(() => matchStore.doublesLeftBotPlayer)
       const rightTopPlayer = computed(() => matchStore.doublesRightTopPlayer)
       const rightBotPlayer = computed(() => matchStore.doublesRightBotPlayer)
       ```
       These getters already exist in matchStore and correctly respect `swappedSides`.

    3. Two swap actions (these store actions already exist):
       ```js
       const swapLeft  = () => matchStore.swapLeftPlayers()
       const swapRight = () => matchStore.swapRightPlayers()
       ```

    AVOID: Do not add local ref state for quadrant positions — the store owns all state.
    AVOID: Do not modify the existing team1Name/team2Name/leftPlayerName/rightPlayerName computeds — they are still used in the singles branch.
  </action>
  <verify>No lint errors: `cd frontend && npx vue-tsc --noEmit 2>&1 | grep SetupView` returns nothing (or 0 errors)</verify>
  <done>isDoubles, leftTopPlayer/leftBotPlayer/rightTopPlayer/rightBotPlayer computeds, swapLeft/swapRight functions all present in script setup block</done>
</task>

<task type="auto">
  <name>Add doubles court grid template with 4 quadrants + Swap Players buttons</name>
  <files>frontend/src/components/SetupView.vue</files>
  <action>
    In the `<template>`, inside the `.court-area` div, wrap the existing court grid in a `v-else` and add a new doubles branch using `v-if="isDoubles"`.

    Target structure (replace the `.court-grid` div and its siblings inside `.court-area`):

    ```html
    <!-- DOUBLES layout -->
    <template v-if="isDoubles">
      <div class="doubles-court-wrapper">
        <button @click="swapLeft" class="swap-players-btn swap-left-btn">
          <i class="fa-solid fa-arrows-up-down"></i> Swap
        </button>

        <div class="doubles-court-grid">
          <!-- Top-Left -->
          <div class="court-quadrant doubles-tl">
            <div class="player-slot">
              <div class="player-info">
                <span class="p-label">{{ swappedSides ? 'P2' : 'P1' }}</span>
                <span class="p-name">{{ leftTopPlayer?.name ?? '—' }}</span>
                <span class="p-country">{{ leftTopPlayer?.country ?? '' }}</span>
              </div>
            </div>
          </div>
          <!-- Top-Right -->
          <div class="court-quadrant doubles-tr">
            <div class="player-slot">
              <div class="player-info">
                <span class="p-label">{{ swappedSides ? 'P1' : 'P2' }}</span>
                <span class="p-name">{{ rightTopPlayer?.name ?? '—' }}</span>
                <span class="p-country">{{ rightTopPlayer?.country ?? '' }}</span>
              </div>
            </div>
          </div>
          <!-- Net line -->
          <div class="net-line"></div>
          <div class="horizontal-line"></div>
          <!-- Bottom-Left -->
          <div class="court-quadrant doubles-bl">
            <div class="player-slot">
              <div class="player-info">
                <span class="p-label">{{ swappedSides ? 'P2D' : 'P1D' }}</span>
                <span class="p-name">{{ leftBotPlayer?.name ?? '—' }}</span>
                <span class="p-country">{{ leftBotPlayer?.country ?? '' }}</span>
              </div>
            </div>
          </div>
          <!-- Bottom-Right -->
          <div class="court-quadrant doubles-br">
            <div class="player-slot">
              <div class="player-info">
                <span class="p-label">{{ swappedSides ? 'P1D' : 'P2D' }}</span>
                <span class="p-name">{{ rightBotPlayer?.name ?? '—' }}</span>
                <span class="p-country">{{ rightBotPlayer?.country ?? '' }}</span>
              </div>
            </div>
          </div>
        </div>

        <button @click="swapRight" class="swap-players-btn swap-right-btn">
          <i class="fa-solid fa-arrows-up-down"></i> Swap
        </button>
      </div>
    </template>

    <!-- SINGLES layout (unchanged) -->
    <template v-else>
      <div class="court-grid">
        <!-- existing quadrant slots keep exactly as-is -->
        ...existing singles HTML...
      </div>
    </template>
    ```

    Then add styles in the `<style scoped>` block:
    ```css
    /* Doubles layout */
    .doubles-court-wrapper {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      width: 100%;
    }
    .doubles-court-grid {
      flex: 1;
      display: grid;
      grid-template-columns: 1fr 1fr;
      grid-template-rows: 1fr 1fr;
      position: relative;
      border: 2px solid var(--border-color, #444);
      border-radius: 4px;
      min-height: 160px;
    }
    .doubles-tl { grid-column: 1; grid-row: 1; }
    .doubles-tr { grid-column: 2; grid-row: 1; }
    .doubles-bl { grid-column: 1; grid-row: 2; }
    .doubles-br { grid-column: 2; grid-row: 2; }
    .swap-players-btn {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 4px;
      padding: 0.5rem 0.4rem;
      font-size: 0.7rem;
      background: var(--accent-orange, #f59e0b);
      color: #000;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      writing-mode: vertical-rl;
      text-orientation: mixed;
      min-width: 36px;
    }
    .swap-players-btn:active {
      opacity: 0.7;
    }
    ```

    AVOID: Do not touch the `.court-grid`, `.bottom-left`, `.top-right`, or `.net-line` CSS rules — they remain for the singles path.
    AVOID: Do not hard-code player names or indices in template — always read from the computed refs.
  </action>
  <verify>
    1. Run `make dev` (already running) — open browser at localhost:5173, select a doubles match, navigate to /setup — confirm 4 player cards visible with correct names and two Swap buttons visible.
    2. Click Left Swap button — top-left and bottom-left names swap.
    3. Click Right Swap button — top-right and bottom-right names swap.
    4. Click "Swap Sides" — all 4 names reflect correct mirror state.
    5. Select a singles match, navigate to /setup — layout identical to before.
  </verify>
  <done>
    - Doubles match: 4 quadrant player cards render with correct names from store getters
    - Left swap button swaps TL/BL players visually
    - Right swap button swaps TR/BR players visually
    - Swap Sides button still works for all 4 quadrants
    - Singles match: zero visual change
  </done>
</task>

</tasks>

<verification>
After all tasks, verify:
- [ ] `isDoubles` computed correctly gates between doubles/singles layout
- [ ] 4 player quadrant cards show correct names (doublesLeftTopPlayer etc. getters)
- [ ] swappedSides is respected (siding toggle reorders all 4 cards correctly)
- [ ] Left Swap button calls swapLeftPlayers() — TL/BL names exchange
- [ ] Right Swap button calls swapRightPlayers() — TR/BR names exchange
- [ ] Singles layout is visually unchanged (no regression)
</verification>

<success_criteria>
- [ ] All tasks verified (manual visual check per verify steps above)
- [ ] No lint/type errors in SetupView.vue
- [ ] Singles match flow untouched
</success_criteria>
