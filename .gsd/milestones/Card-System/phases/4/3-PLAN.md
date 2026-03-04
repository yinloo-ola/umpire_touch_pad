---
phase: 4
plan: 3
wave: 2
depends_on: ["1", "2"]
files_modified:
  - frontend/src/components/Touchpad.vue
autonomous: true
user_setup: []

must_haves:
  truths:
    - "Left 'Cards' button opens CardModal for the left side's team"
    - "Right 'Cards' button opens CardModal for the right side's team"
    - "CardModal receives the correct teamNum accounting for swappedSides"
    - "TimeoutModal is shown whenever matchStore.timeoutActive is true"
    - "Only one modal is visible at a time (card modal closes when timeout is issued)"
    - "All existing Touchpad behaviour is unchanged"
  artifacts:
    - "CardModal imported and used in Touchpad.vue"
    - "TimeoutModal imported and used in Touchpad.vue"
---

# Plan 4.3: Wire Modals into Touchpad

<objective>
Import CardModal and TimeoutModal into Touchpad.vue and wire them to the existing "Cards" buttons and timeout state.

Purpose: Complete the end-to-end user flow — umpire presses Cards button → modal opens for the correct team → issues/reverts cards → (optionally) triggers timeout → countdown modal takes over.

Output: Fully functional card and timeout workflows accessible from the touchpad.
</objective>

<context>
Load for context:
- .gsd/phases/4/DECISIONS.md
- frontend/src/components/Touchpad.vue (full file — particularly the top-row "Cards" buttons at lines ~204-210, the script setup section, and existing modal patterns)
- frontend/src/components/CardModal.vue (just created in Plan 4.1)
- frontend/src/components/TimeoutModal.vue (just created in Plan 4.2)
- frontend/src/stores/matchStore.js (swappedSides, timeoutActive)
</context>

<tasks>

<task type="auto">
  <name>Import components, add modal state, and wire Cards buttons in Touchpad.vue</name>
  <files>frontend/src/components/Touchpad.vue</files>
  <action>
    ## 1. Import new components (in <script setup>)

    ```js
    import CardModal from './CardModal.vue'
    import TimeoutModal from './TimeoutModal.vue'
    ```

    ## 2. Add modal state (in <script setup>)

    ```js
    const showCardModal = ref(false)
    const cardModalTeamNum = ref(1)   // which team the open modal is for

    const openCardModal = (side) => {
      // Map visual side → logical team number
      // Left side team: swappedSides ? 2 : 1
      // Right side team: swappedSides ? 1 : 2
      cardModalTeamNum.value = side === 'left'
        ? (matchStore.swappedSides ? 2 : 1)
        : (matchStore.swappedSides ? 1 : 2)
      showCardModal.value = true
    }

    const closeCardModal = () => {
      showCardModal.value = false
    }
    ```

    ## 3. Update the "Cards" button in the top row

    In the template, replace the two existing static `<button class="card-btn">Cards</button>` placeholders:

    Left button (inside `.left-side`):
    ```html
    <button class="card-btn" @click="openCardModal('left')">Cards</button>
    ```

    Right button (inside `.right-side`):
    ```html
    <button class="card-btn" @click="openCardModal('right')">Cards</button>
    ```

    ## 4. Add modal mount points (inside `<section id="touchpad-view">`, after existing modals)

    ```html
    <!-- Card Modal -->
    <CardModal
      v-if="showCardModal"
      :teamNum="cardModalTeamNum"
      @close="closeCardModal"
    />

    <!-- Timeout Modal -->
    <TimeoutModal v-if="matchStore.timeoutActive" />
    ```

    Place these after the existing `<!-- Deciding Game Swap Modal -->` block, before `</section>`.

    AVOID: Placing the modals outside `<section id="touchpad-view">` — they must stack within the touchpad's own positioning context so the overlay covers only the touchpad, not the browser viewport.
    AVOID: Watching `matchStore.timeoutActive` to auto-close the card modal — the CardModal's `handleTimeout` already emits 'close' before calling issueTimeout, which is the correct sequencing.
  </action>
  <verify>
    Run `npm run dev` in /Volumes/Ext/code/personal/umpire_touch_pad/frontend.
    Open a singles match in the browser. On the Touchpad:
    1. Click left "Cards" button → CardModal opens, shows Player 1's name.
    2. Click right "Cards" button → CardModal opens, shows Player 2's name.
    3. Swap sides, then click left "Cards" → modal now shows Player 2 (sides swapped).
    4. In CardModal, click Yellow Card → Yellow gets issued (orange ring). Close modal.
    5. Reopen modal → Yellow still shows as issued.
    6. Click Timeout in CardModal → card modal closes; TimeoutModal countdown overlay appears.
    7. Click "Dismiss" → TimeoutModal disappears.
    8. Run `npx vitest run` from the frontend directory → all tests pass.
  </verify>
  <done>
    Left/right Cards buttons open CardModal with the correct teamNum (accounting for swappedSides).
    TimeoutModal appears reactively when matchStore.timeoutActive becomes true.
    All existing touchpad functionality (scoring, server indicators, swap sides, next game, winner modal, deciding game modal) remains unchanged.
    All vitest tests pass.
  </done>
</task>

<task type="checkpoint:human-verify">
  <name>Visual and interaction verification on device</name>
  <action>
    Please verify the following on the running app (npm run dev):

    1. **Card modal layout** matches the reference screenshot:
       - Player/pair name at top
       - T | Yellow | YR1 | YR2 | ─── | C-Yellow | C-Red
       - Correct colors: Yellow = deep yellow, YR1/YR2 = split yellow/red, Red = solid red, T = grey
       - Orange ✕ closes modal

    2. **Issuance flow** (singles match):
       - Click Yellow → it gets orange ring; YR1 becomes available; YR2 stays locked
       - Click YR1 → it gets ring; Yellow becomes non-revertable (ring remains but tap does nothing)
       - Click YR1 again (it IS last) → reverts; both YR1 and YR2 locked again
       - Score reflects penalty points from YR1 (+1 opponent)

    3. **Timeout flow**:
       - Click T during Start Of Play → card modal closes, timeout countdown appears
       - Countdown ticks from 0:60 → 0:59 → ...
       - Cancel → timeout reverted, can timeout again
       - Dismiss → modal gone, T button in card modal now greyed permanently this match

    4. **Doubles match**: Card modal header shows "PlayerA / PlayerB" pair name

    Confirm: PASS or describe any issues.
  </action>
</task>

</tasks>

<verification>
After all tasks, verify:
- [ ] Left Cards button → correct team (unswapped: team1; swapped: team2)
- [ ] Right Cards button → correct team (unswapped: team2; swapped: team1)
- [ ] CardModal receives correct teamNum prop
- [ ] TimeoutModal appears when timeoutActive = true
- [ ] TimeoutModal disappears on cancel or dismiss
- [ ] No regression in existing scoring, serve rotation, or swap logic
- [ ] npx vitest run passes (no test failures)
</verification>

<success_criteria>
- [ ] Both Cards buttons wired to openCardModal with correct side argument
- [ ] CardModal and TimeoutModal imported and rendered conditionally
- [ ] swappedSides correctly maps side → teamNum
- [ ] All vitest tests pass
- [ ] Human visual verification: PASS
</success_criteria>
