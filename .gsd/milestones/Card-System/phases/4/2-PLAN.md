---
phase: 4
plan: 2
wave: 1
depends_on: []
files_modified:
  - frontend/src/components/TimeoutModal.vue
autonomous: true
user_setup: []

must_haves:
  truths:
    - "TimeoutModal appears as a full-screen overlay when timeoutActive is true"
    - "It displays which team called the timeout and a countdown from 60s"
    - "Cancel/Revert button calls revertTimeout(callingTeam); Dismiss button calls dismissTimeout()"
    - "Both buttons hide the modal"
  artifacts:
    - "frontend/src/components/TimeoutModal.vue exists"
---

# Plan 4.2: TimeoutModal Component

<objective>
Build the TimeoutModal.vue Vue 3 component that renders a full-screen countdown overlay when a timeout is active.

Purpose: Let the umpire see the 60-second countdown and either cancel (revert the timeout) or dismiss (consume it) cleanly.

Output: A self-contained TimeoutModal.vue driven entirely by matchStore reactive state.
</objective>

<context>
Load for context:
- .gsd/phases/4/DECISIONS.md (Timeout Countdown Modal section)
- frontend/src/stores/matchStore.js (timeoutActive, timeoutTimeLeft, timeoutCallingTeam, revertTimeout, dismissTimeout, currentMatch)
- frontend/src/components/Touchpad.vue (existing modal overlay patterns and scoped CSS conventions)
</context>

<tasks>

<task type="auto">
  <name>Create TimeoutModal.vue with countdown display and action buttons</name>
  <files>frontend/src/components/TimeoutModal.vue</files>
  <action>
    Create a new Vue 3 SFC using `<script setup>`.

    ## No props needed
    TimeoutModal reads everything from the store. It is shown/hidden via `v-if="matchStore.timeoutActive"` in Touchpad.vue (Plan 4.3).

    ## Store bindings
    ```js
    import { computed } from 'vue'
    import { useMatchStore } from '../stores/matchStore'
    const matchStore = useMatchStore()
    ```

    ## Computed values
    ```js
    // Format seconds as "0:SS"
    const countdownDisplay = computed(() => {
      const t = matchStore.timeoutTimeLeft
      const mins = Math.floor(t / 60)
      const secs = String(t % 60).padStart(2, '0')
      return `${mins}:${secs}`
    })

    // Team that called the timeout
    const callingTeamName = computed(() => {
      const num = matchStore.timeoutCallingTeam
      if (!num || !matchStore.currentMatch) return 'Team'
      const team = num === 1 ? matchStore.currentMatch.team1 : matchStore.currentMatch.team2
      if (matchStore.currentMatch.type === 'singles') return team[0].name
      return `${team[0].name} / ${team[1].name}`
    })
    ```

    ## Actions
    ```js
    const cancelTimeout = () => {
      matchStore.revertTimeout(matchStore.timeoutCallingTeam)
    }
    const dismiss = () => {
      matchStore.dismissTimeout()
    }
    ```

    ## Template

    ```html
    <div class="modal-overlay timeout-overlay-bg">
      <div class="timeout-modal-content">
        <div class="tm-team-label">{{ callingTeamName }}</div>
        <div class="tm-subtitle">Time Out</div>
        <div class="tm-countdown" :class="{ 'tm-expired': matchStore.timeoutTimeLeft === 0 }">
          {{ countdownDisplay }}
        </div>
        <div class="tm-buttons">
          <button class="modal-btn tm-cancel-btn" @click="cancelTimeout">
            Cancel / Revert
          </button>
          <button class="modal-btn tm-dismiss-btn" @click="dismiss">
            Dismiss
          </button>
        </div>
      </div>
    </div>
    ```

    AVOID: Importing setInterval here — the countdown is driven by the store's `timeoutInterval`. This component is purely reactive/display.
    AVOID: `position:fixed` for the overlay — use the same `.modal-overlay` base class pattern that Touchpad.vue uses (or apply `position:absolute; inset:0` within the parent touchpad container which is `position:relative`).

    ## Scoped styles

    - `.timeout-overlay-bg`: dark semi-transparent bg `rgba(0,0,0,0.88)`, flex column center, z-index 1500
    - `.timeout-modal-content`: dark card `#2b2b2b`, border-radius 12px, padding 3rem, text-align center, border `1px solid #444`, box-shadow, min-width 320px
    - `.tm-team-label`: color white, font-size 1.4rem, font-weight 600, margin-bottom 0.3rem
    - `.tm-subtitle`: color #f58220, font-size 1rem, text-transform uppercase, letter-spacing 2px, margin-bottom 2rem
    - `.tm-countdown`: font-size 4rem, font-weight 800, color white, font-variant-numeric tabular-nums, margin-bottom 2.5rem
    - `.tm-expired`: color #f58220 (turns orange when hits 0)
    - `.tm-buttons`: display flex, gap 1.5rem, justify-content center
    - `.tm-cancel-btn`: background transparent, border `2px solid #888`, color #ccc, padding 0.8rem 2rem, border-radius 8px, font-weight 600; hover: border-color white, color white
    - `.tm-dismiss-btn`: background #f58220, color white, padding 0.8rem 2rem, border-radius 8px, font-weight 700, box-shadow `0 4px 15px rgba(245,130,32,0.4)`; hover: background #e07010
  </action>
  <verify>
    After wiring in Plan 4.3:
    - Start a match, ensure pointStarted is false (Start Of Play state).
    - Open Card Modal for a team, click Timeout.
    - Card modal closes; Timeout Modal overlay appears, showing team name and "0:60" countdown.
    - Watch it count down.
    - Click "Cancel / Revert" → modal disappears, team's timeout flag resets (team can timeout again).
    - Repeat, let it count to 0:00 — the number turns orange. Click "Dismiss" → modal disappears, timeout is consumed.
    - Confirm no console errors.
  </verify>
  <done>
    TimeoutModal.vue renders correctly driven by store state.
    Countdown displays correctly formatted time.
    Cancel resets timeout; Dismiss consumes it.
    Timer hits 0 → countdown turns orange; modal stays until umpire acts.
  </done>
</task>

</tasks>

<verification>
After task, verify:
- [ ] frontend/src/components/TimeoutModal.vue exists
- [ ] Countdown derives from matchStore.timeoutTimeLeft (no local timer)
- [ ] Cancel calls revertTimeout(callingTeam); Dismiss calls dismissTimeout()
- [ ] .tm-expired class applied when timeoutTimeLeft === 0
</verification>

<success_criteria>
- [ ] TimeoutModal.vue created with countdown display
- [ ] Both action buttons wired to correct store actions
- [ ] Correctly shows calling team name
- [ ] Overlay renders in the correct z-index layer
</success_criteria>
