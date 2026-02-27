---
phase: 3
plan: 2
wave: 2
depends_on: [3.1]
files_modified:
  - frontend/src/components/SetupView.vue
autonomous: true
user_setup: []

must_haves:
  truths:
    - "For doubles: clicking the left serve/receive indicator calls setDoublesServer(leftTeam, playerIdx) where leftTeam is determined by swappedSides"
    - "For doubles: clicking the right serve/receive indicator calls setDoublesServer(rightTeam, playerIdx) for the opposing team"
    - "For doubles: serve indicator shows doublesServerName / doublesReceiverName beneath the S/R circle (individual player name, not team name)"
    - "For singles: serve indicator behaviour is exactly unchanged (calls setServer(1|2))"
    - "'Who serves first?' modal appears when nextGame() sets doublesNextServingTeam (between-game); user picks one of the two serving-team players; calls setDoublesServerForNewGame()"
    - "Between-game modal: only appears for doubles; closes after player selection"
  artifacts:
    - "frontend/src/components/SetupView.vue — script + template updated for doubles serve designation"
---

# Plan 3.2: SetupView Doubles — Serve Designation + Between-Game Modal

<objective>
Wire up the serve/receive indicator in SetupView to support doubles: show individual player names for server/receiver, allow clicking either indicator to designate a doubles server (calls setDoublesServer()), and add a between-game modal that lets the umpire choose which player on the serving team serves first (calls setDoublesServerForNewGame()).

Purpose: This completes Phase 3 by making the setup screen fully doubles-aware for serve designation.
Output: Updated SetupView.vue with doubles-aware serve indicators and a between-game server-choice modal.
</objective>

<context>
Load for context:
- .gsd/SPEC.md (§ UX Design Notes — Serve Indicator Detail, § Between-Game Rules)
- frontend/src/components/SetupView.vue (after Plan 3.1 changes)
- frontend/src/stores/matchStore.js
  - getters: doublesServerName, doublesReceiverName, isLeftDoublesServer, doublesNextServingTeam, doublesLeftTopPlayer, doublesLeftBotPlayer, doublesRightTopPlayer, doublesRightBotPlayer
  - actions: setDoublesServer(team, playerIdx), setDoublesServerForNewGame(team, playerIdx, prevIS, prevIR), swapLeftPlayers, swapRightPlayers
  - state: doublesNextServingTeam, prevDoublesInitialServer, prevDoublesInitialReceiver, swappedSides
</context>

<tasks>

<task type="auto">
  <name>Update serve indicator script — doubles-aware click handlers and display computeds</name>
  <files>frontend/src/components/SetupView.vue</files>
  <action>
    In `<script setup>`, add the following (alongside existing code):

    ```js
    // --- Doubles serve designation ---
    // Which physical team is on the left vs right, considering swappedSides
    const leftTeam  = computed(() => matchStore.swappedSides ? 2 : 1)
    const rightTeam = computed(() => matchStore.swappedSides ? 1 : 2)

    // For doubles: clicking left indicator designates that the left-team
    // BOTTOM player (the one whose quadrant position is p1Bot / p2Bot depending on side)
    // is the server. The bottom slot is the conventional serving position.
    // The umpire can also click the top player card to override — but for the
    // serve indicator click itself, we default to player index 0 of the left team
    // (the formula recalibrates via setDoublesServer at the CURRENT score).
    //
    // To allow both players to be designated: the indicator click rotates between
    // the two players on that side (toggle between player 0 and player 1).
    // Track which player index was last set for each side:
    const leftDoublesPlayerIdx  = ref(0)
    const rightDoublesPlayerIdx = ref(0)

    const setLeftServerDoubles = () => {
      // Toggle between 0 and 1 to allow either player on the left team to serve
      leftDoublesPlayerIdx.value = 1 - leftDoublesPlayerIdx.value
      matchStore.setDoublesServer(leftTeam.value, leftDoublesPlayerIdx.value)
    }
    const setRightServerDoubles = () => {
      rightDoublesPlayerIdx.value = 1 - rightDoublesPlayerIdx.value
      matchStore.setDoublesServer(rightTeam.value, rightDoublesPlayerIdx.value)
    }

    // Unified click handlers for the serve indicator (works for both singles and doubles)
    const onLeftIndicatorClick  = () => isDoubles.value ? setLeftServerDoubles()  : setLeftServer()
    const onRightIndicatorClick = () => isDoubles.value ? setRightServerDoubles() : setRightServer()

    // Doubles: display the individual player name beneath the S/R circle
    const leftIndicatorPlayerName = computed(() => {
      if (!isDoubles.value) return ''
      return matchStore.isLeftDoublesServer
        ? matchStore.doublesServerName
        : matchStore.doublesReceiverName
    })
    const rightIndicatorPlayerName = computed(() => {
      if (!isDoubles.value) return ''
      return matchStore.isLeftDoublesServer
        ? matchStore.doublesReceiverName
        : matchStore.doublesServerName
    })

    // --- Between-game server choice modal ---
    // Show when doublesNextServingTeam is set (nextGame() populates this)
    const showServerChoiceModal = computed(() => {
      return isDoubles.value && matchStore.doublesNextServingTeam !== null
    })

    // The two players on the serving team (in screen order)
    const servingTeamPlayers = computed(() => {
      if (!matchStore.doublesNextServingTeam || !matchStore.currentMatch) return []
      const t = matchStore.doublesNextServingTeam
      return t === 1
        ? matchStore.currentMatch.team1
        : matchStore.currentMatch.team2
    })

    const chooseNewGameServer = (playerIdx) => {
      matchStore.setDoublesServerForNewGame(
        matchStore.doublesNextServingTeam,
        playerIdx,
        matchStore.prevDoublesInitialServer,
        matchStore.prevDoublesInitialReceiver,
      )
      // Clear the flag so the modal closes
      matchStore.doublesNextServingTeam = null
    }
    ```

    AVOID: Do not create a local ref to copy doublesNextServingTeam — read it reactively from matchStore.
    AVOID: Do not gate leftDoublesPlayerIdx resets on anything — toggling is simple and deterministic for umpire correction.
  </action>
  <verify>`cd frontend && npx vue-tsc --noEmit 2>&1 | grep SetupView` returns 0 errors</verify>
  <done>All new computed refs and action handlers present in script setup with no type errors</done>
</task>

<task type="auto">
  <name>Update serve indicator template for doubles names + add between-game modal</name>
  <files>frontend/src/components/SetupView.vue</files>
  <action>
    **1. Update the `.setup-serve-indicators` section** (inside the doubles `<template v-if="isDoubles">` block, below the court grid):

    Replace (or add alongside for doubles only) the serve indicator HTML to show individual player names:

    ```html
    <!-- Doubles serve indicators -->
    <div class="setup-serve-indicators">
      <div
        class="setup-serve-box left-serve"
        :class="{ active: matchStore.isLeftDoublesServer }"
        @click="onLeftIndicatorClick"
        id="doubles-left-serve-indicator"
      >
        <div class="s-circle">{{ matchStore.isLeftDoublesServer ? 'S' : 'R' }}</div>
        <span class="s-tag">{{ matchStore.isLeftDoublesServer ? 'Server' : 'Receiver' }}</span>
        <span class="s-player-name">{{ leftIndicatorPlayerName }}</span>
      </div>
      <div
        class="setup-serve-box right-serve"
        :class="{ active: !matchStore.isLeftDoublesServer }"
        @click="onRightIndicatorClick"
        id="doubles-right-serve-indicator"
      >
        <div class="s-circle">{{ !matchStore.isLeftDoublesServer ? 'S' : 'R' }}</div>
        <span class="s-tag">{{ !matchStore.isLeftDoublesServer ? 'Server' : 'Receiver' }}</span>
        <span class="s-player-name">{{ rightIndicatorPlayerName }}</span>
      </div>
    </div>
    ```

    The existing singles serve indicators (the original `.setup-serve-indicators` div) stays as-is inside the `v-else` (singles) branch.

    **2. Add the between-game server choice modal** (at the same level as the existing Warmup Modal and Timer Overlay, after the main section content):

    ```html
    <!-- Between-game: doubles server choice modal -->
    <div v-if="showServerChoiceModal" class="modal-overlay" id="doubles-server-choice-modal">
      <div class="modal-content small-modal">
        <div class="modal-header">
          <h3>Who serves first?</h3>
        </div>
        <div class="modal-body">
          <p class="modal-prompt-bold">
            Team {{ matchStore.doublesNextServingTeam }} serves first this game.
            Choose the first server:
          </p>
          <div class="server-choice-btns">
            <button
              v-for="(player, idx) in servingTeamPlayers"
              :key="idx"
              @click="chooseNewGameServer(idx)"
              class="modal-btn primary-btn server-choice-btn"
              :id="`server-choice-player-${idx}`"
            >
              {{ player.name }}
            </button>
          </div>
        </div>
      </div>
    </div>
    ```

    **3. Add styles** in `<style scoped>`:
    ```css
    .s-player-name {
      font-size: 0.65rem;
      font-weight: 600;
      margin-top: 2px;
      text-align: center;
      max-width: 80px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .server-choice-btns {
      display: flex;
      gap: 0.75rem;
      justify-content: center;
      margin-top: 0.5rem;
    }
    .server-choice-btn {
      flex: 1;
    }
    ```

    AVOID: Do not put the between-game modal inside the `v-if="isDoubles"` template — it's a top-level overlay, should be a sibling of the warmup modal overlay.
    AVOID: Do not mutate doublesNextServingTeam directly in the template — always call `chooseNewGameServer(idx)`.
  </action>
  <verify>
    1. Open a doubles match → /setup → serve indicators show individual player name beneath S/R.
    2. Click left serve indicator twice — the designated player toggles between the two left-team players.
    3. Simulate a game end (or manually set matchStore.doublesNextServingTeam = 1 in Vue DevTools) — modal appears with two player name buttons.
    4. Click a player name button — modal closes, doublesNextServingTeam is null, doublesInitialServer updated.
    5. Open a singles match → /setup — zero visual change in serve indicator (no player name shown, original click handlers fire).
  </verify>
  <done>
    - Doubles serve indicator shows player name; clicking toggles between player 0 / player 1 for that side's team
    - Between-game modal renders when doublesNextServingTeam !== null; closes after chooseNewGameServer() call
    - Singles layout: zero change in serve indicator visual or behaviour
  </done>
</task>

</tasks>

<verification>
After all tasks, verify:
- [ ] Left/right serve indicator in doubles mode shows individual doublesServerName / doublesReceiverName
- [ ] Clicking left indicator calls setDoublesServer(leftTeam, toggledIdx) — serve designation recalibrates
- [ ] Between-game modal renders when doublesNextServingTeam is set
- [ ] Choosing a player in the modal calls setDoublesServerForNewGame and clears doublesNextServingTeam
- [ ] Singles serve indicator unchanged (calls setServer(1|2), no player name sub-text)
</verification>

<success_criteria>
- [ ] All tasks verified (visual check + Vue DevTools inspection)
- [ ] No lint errors in SetupView.vue
- [ ] Between-game modal functional end-to-end (trigger → choose → state updated)
</success_criteria>
