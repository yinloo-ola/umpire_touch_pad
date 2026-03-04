---
phase: 4
plan: 1
wave: 1
depends_on: []
files_modified:
  - frontend/src/components/CardModal.vue
autonomous: true
user_setup: []

must_haves:
  truths:
    - "CardModal renders a player/pair name header"
    - "Player track shows: Timeout (T), Yellow, YR1, YR2"
    - "Coach track shows: Yellow, Red — separated by a vertical divider"
    - "Cards are greyed out (locked) when not yet eligible per issuance rules"
    - "Tapping an available card calls issueCard and the card becomes active"
    - "Tapping the last-issued card (LIFO) calls revertLastCard; out-of-order taps do nothing"
    - "Timeout button calls issueTimeout; greyed if used or pointStarted is true"
    - "Orange X button closes the modal"
  artifacts:
    - "frontend/src/components/CardModal.vue exists"
---

# Plan 4.1: CardModal Component

<objective>
Build the CardModal.vue Vue 3 component that presents the card-issuance grid for one team.

Purpose: Give the umpire a clear, touch-friendly panel to issue and revert disciplinary cards and timeouts for a specific player/pair.

Output: A self-contained CardModal.vue that receives `teamNum` (1 or 2) as a prop and reads/writes state via `matchStore`.
</objective>

<context>
Load for context:
- .gsd/SPEC.md (Card Modal UX Design Notes section)
- .gsd/phases/4/DECISIONS.md (full layout spec, revert interaction, visual states)
- frontend/src/stores/matchStore.js (issueCard, revertLastCard, issueTimeout, revertTimeout, dismissTimeout, team1Cards, team2Cards, team1CoachCards, team2CoachCards, team1Timeout, team2Timeout, timeoutActive, pointStarted, timerActive, currentMatch)
- frontend/src/components/Touchpad.vue (existing modal markup patterns and scoped CSS to follow)
</context>

<tasks>

<task type="auto">
  <name>Create CardModal.vue with card grid, interaction, and scoped styles</name>
  <files>frontend/src/components/CardModal.vue</files>
  <action>
    Create a new Vue 3 SFC using `<script setup>`.

    ## Props
    ```js
    const props = defineProps({ teamNum: { type: Number, required: true } })
    const emit = defineEmits(['close'])
    ```

    ## Store bindings
    ```js
    import { computed } from 'vue'
    import { useMatchStore } from '../stores/matchStore'
    const matchStore = useMatchStore()
    ```

    Derive from props.teamNum:
    - `playerCards` → `matchStore[`team${teamNum}Cards`]`  (reactive array, e.g. ['Yellow', 'YR1'])
    - `coachCards`  → `matchStore[`team${teamNum}CoachCards`]`
    - `timeoutUsed` → `matchStore[`team${teamNum}Timeout`]`

    ## Player/pair name header
    Compute `teamLabel`:
    - If `matchStore.currentMatch.type === 'singles'`:
      - teamNum 1 → `matchStore.currentMatch.team1[0].name`
      - teamNum 2 → `matchStore.currentMatch.team2[0].name`
    - If doubles:
      - `team1[0].name + ' / ' + team1[1].name` (or team2)

    ## Card interaction logic

    ### issueOrRevert(track, type)
    Called when any card button is tapped.

    ```js
    const issueOrRevert = (track, type) => {
      const arr = track === 'coach' ? coachCards.value : playerCards.value
      if (arr.length > 0 && arr[arr.length - 1] === type) {
        // Last card in stack — revert it
        matchStore.revertLastCard(props.teamNum, track)
      } else if (!arr.includes(type)) {
        // Not issued yet — attempt to issue
        matchStore.issueCard(props.teamNum, type, track)
      }
      // else: already issued but not the last → ignore (out-of-order revert)
    }
    ```

    ### handleTimeout()
    ```js
    const handleTimeout = () => {
      matchStore.issueTimeout(props.teamNum)
      emit('close')   // card modal closes; timeout modal takes over
    }
    ```

    ## Card visual state helper
    ```js
    const cardState = (track, type) => {
      const arr = track === 'coach' ? coachCards.value : playerCards.value
      // Determine eligibility per issuance rules (mirror store logic):
      const playerOrder = ['Yellow', 'YR1', 'YR2']
      const coachOrder  = ['Yellow', 'Red']
      const order = track === 'coach' ? coachOrder : playerOrder
      const idx = order.indexOf(type)

      if (arr.includes(type)) return 'issued'             // already issued
      if (idx === 0 && arr.length === 0) return 'available'  // first card, nothing issued
      if (idx > 0 && arr[idx - 1] === order[idx - 1]) return 'available'  // previous issued
      return 'locked'                                       // not yet eligible
    }
    ```

    ## Template structure

    ```html
    <div class="card-modal-overlay">
      <div class="card-modal-panel">
        <!-- Header -->
        <div class="cm-header">
          <span class="cm-player-label">{{ teamLabel }}</span>
          <button class="cm-close-btn" @click="emit('close')">✕</button>
        </div>

        <!-- Card row -->
        <div class="cm-card-row">

          <!-- Player track -->
          <div class="cm-track player-track">
            <!-- Timeout -->
            <div class="cm-card-item"
                 :class="['cm-timeout', { 'cm-disabled': timeoutUsed || matchStore.pointStarted || matchStore.timerActive }]"
                 @click="!timeoutUsed && !matchStore.pointStarted && !matchStore.timerActive && handleTimeout()">
              <div class="cm-card-face cm-card-timeout">T</div>
              <span class="cm-card-label">Time<br>Out</span>
            </div>
            <!-- Yellow -->
            <div class="cm-card-item" :class="cardState('player','Yellow')"
                 @click="issueOrRevert('player','Yellow')">
              <div class="cm-card-face cm-yellow"></div>
              <span class="cm-card-label">Yellow<br>Card</span>
            </div>
            <!-- YR1 -->
            <div class="cm-card-item" :class="cardState('player','YR1')"
                 @click="issueOrRevert('player','YR1')">
              <div class="cm-card-face cm-yr1"><span class="cm-yr-num">1</span></div>
              <span class="cm-card-label">Yellow<br>Red 1</span>
            </div>
            <!-- YR2 -->
            <div class="cm-card-item" :class="cardState('player','YR2')"
                 @click="issueOrRevert('player','YR2')">
              <div class="cm-card-face cm-yr2"><span class="cm-yr-num">2</span></div>
              <span class="cm-card-label">Yellow<br>Red 2</span>
            </div>
          </div>

          <!-- Divider -->
          <div class="cm-divider"></div>

          <!-- Coach track -->
          <div class="cm-track coach-track">
            <div class="cm-card-item" :class="cardState('coach','Yellow')"
                 @click="issueOrRevert('coach','Yellow')">
              <div class="cm-card-face cm-yellow cm-coach-face">C</div>
              <span class="cm-card-label">Yellow<br>Card</span>
            </div>
            <div class="cm-card-item" :class="cardState('coach','Red')"
                 @click="issueOrRevert('coach','Red')">
              <div class="cm-card-face cm-red cm-coach-face">C</div>
              <span class="cm-card-label">Red<br>Card</span>
            </div>
          </div>

        </div>
      </div>
    </div>
    ```

    AVOID: using v-model on store arrays directly — always go through actions.
    AVOID: using `position:fixed` for the overlay — use the existing `.modal-overlay` pattern from Touchpad.vue (`position:absolute` within the `.touchpad-container` which is `position:relative`). The overlay must cover only the touchpad view. Check Touchpad.vue and global CSS for `.modal-overlay` class; reuse it if present.

    ## Scoped styles

    Style the card faces to match the reference screenshot:
    - `.cm-card-face`: rounded rectangle ~70×90px, display flex, center content, font-weight 800, font-size 1.8rem
    - `.cm-yellow`: background #f5c400 (deep yellow), color #222
    - `.cm-yr1`: top-half yellow (#f5c400), bottom-half red (#d32f2f) — use linear-gradient or two-tone approach via pseudo-element. Display "1" in white bold on the red portion.
    - `.cm-yr2`: same split but "2"
    - `.cm-red`: background #d32f2f, color white
    - `.cm-card-timeout`: background #bbb, color #333 (grey T card)
    - `.locked` state: `opacity: 0.35; cursor: not-allowed; pointer-events: none`
    - `.available` state: full color, `cursor: pointer`; on hover `transform: translateY(-3px); box-shadow: 0 6px 15px rgba(0,0,0,0.3)`
    - `.issued` state: full color + `outline: 3px solid #f58220` ring to indicate it's active/revertable
    - `.cm-disabled` (timeout only, already-used): `opacity: 0.35; cursor: not-allowed`

    Panel: white background, border-radius 12px, padding 1.5rem, box-shadow, max-width 680px, centered.
    Overlay: same as `.modal-overlay` in global CSS — semi-transparent dark background, flex center.
  </action>
  <verify>
    Open the app in browser. Set up a match. On the Touchpad view, confirm:
    - (After wiring in Plan 4.3) Cards button opens CardModal.
    - Player name displayed at top.
    - 4 items in player track (T, Yellow, YR1, YR2) + 2 in coach track; vertical divider between.
    - Tapping Yellow issues it (store team1Cards becomes ['Yellow']), Yellow gets orange ring, YR1 becomes available.
    - Tapping Yellow again reverts it (LIFO, it IS the last card) → store resets to [].
    - Tapping YR1 when only Yellow issued → YR1 gets ring; tapping Yellow now (out-of-order) does nothing.
    - Timeout disabled when pointStarted; enabled at Start Of Play.

    Also run: `npx vitest run` to confirm no regressions.
  </verify>
  <done>
    CardModal.vue renders correctly for both singles and doubles.
    Card issuance and LIFO revert work through store actions.
    Visual states (locked/available/issued/disabled) render correctly.
    All existing tests still pass.
  </done>
</task>

</tasks>

<verification>
After task, verify:
- [ ] frontend/src/components/CardModal.vue exists and has no console errors
- [ ] Player/coach tracks render with correct card count (4 + divider + 2)
- [ ] issueCard and revertLastCard called correctly through issueOrRevert logic
- [ ] Timeout calls issueTimeout and emits 'close'
- [ ] Locked cards are non-interactive (pointer-events: none)
- [ ] Issued cards have orange ring; are revertable only if last in stack
</verification>

<success_criteria>
- [ ] CardModal.vue created with correct structure
- [ ] All card states render correctly (locked/available/issued)
- [ ] Store actions wired correctly (issueCard, revertLastCard, issueTimeout)
- [ ] Component closes via X button (emit 'close')
</success_criteria>
