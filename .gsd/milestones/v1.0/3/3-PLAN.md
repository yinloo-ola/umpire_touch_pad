---
phase: 3
plan: 3
wave: 3
depends_on: [3.1, 3.2]
files_modified:
  - frontend/src/components/__tests__/SetupView.doubles.test.js
autonomous: true
user_setup: []

must_haves:
  truths:
    - "All new tests pass: make test exits 0"
    - "Quadrant rendering: correct player names appear in TL/BL/TR/BR for a doubles match"
    - "swappedSides: after toggleSwapSides(), the four quadrant slots show mirrored teams"
    - "swapLeftPlayers: after swapLeftPlayers(), TL and BL player names are exchanged"
    - "swapRightPlayers: after swapRightPlayers(), TR and BR player names are exchanged"
    - "setDoublesServerForNewGame: choosing a player in the between-game modal correctly calls the store action"
    - "Singles regression: singles layout still renders without the doubles quadrant grid"
  artifacts:
    - "frontend/src/components/__tests__/SetupView.doubles.test.js — new test file, all tests passing"
---

# Plan 3.3: SetupView Doubles — Integration Tests

<objective>
Write Vitest component integration tests for SetupView.vue that cover: doubles quadrant rendering, swap button wiring, serve indicator display, and between-game server choice modal. Also add a singles regression snapshot to guard against accidental regressions.

Purpose: Phase 3 requires component/store integration tests. This plan delivers that coverage.
Output: New test file frontend/src/components/__tests__/SetupView.doubles.test.js, all tests passing via `make test`.
</objective>

<context>
Load for context:
- frontend/src/stores/__tests__/matchStore.doubles.test.js (Phase 2 test file — look at how the store is set up with createTestingPinia, doubles match fixture, and how state is asserted)
- frontend/src/components/SetupView.vue (the component under test, after Plans 3.1 + 3.2)
- frontend/src/stores/matchStore.js (actions and getters used by the component)
- vite.config.js (test configuration: globals: true, environment: 'happy-dom')
</context>

<tasks>

<task type="auto">
  <name>Write SetupView doubles integration tests</name>
  <files>frontend/src/components/__tests__/SetupView.doubles.test.js</files>
  <action>
    Create the file with the following tests. Use `@vue/test-utils` mount() + `createTestingPinia` from `@pinia/testing` (same pattern as Phase 2 tests).

    **Setup helpers:**
    ```js
    import { mount } from '@vue/test-utils'
    import { createTestingPinia } from '@pinia/testing'
    import { createRouter, createWebHashHistory } from 'vue-router'
    import SetupView from '../SetupView.vue'
    import { useMatchStore } from '../../stores/matchStore'

    const doublesMatch = {
      type: 'doubles',
      event: 'Test Doubles',
      time: '10:00',
      bestOf: 5,
      team1: [
        { name: 'Alice', country: 'AUS' },
        { name: 'Bob',   country: 'AUS' },
      ],
      team2: [
        { name: 'Carol', country: 'CAN' },
        { name: 'Dave',  country: 'CAN' },
      ],
    }

    const singlesMatch = {
      type: 'singles',
      event: 'Test Singles',
      time: '11:00',
      bestOf: 5,
      team1: [{ name: 'Eve',   country: 'GBR' }],
      team2: [{ name: 'Frank', country: 'USA' }],
    }

    function mountComponent(match) {
      const router = createRouter({
        history: createWebHashHistory(),
        routes: [
          { path: '/', component: { template: '<div/>' } },
          { path: '/setup', component: SetupView },
        ],
      })
      const pinia = createTestingPinia({ stubActions: false })
      const wrapper = mount(SetupView, {
        global: { plugins: [pinia, router] },
      })
      const store = useMatchStore()
      store.selectMatch(match)
      return { wrapper, store }
    }
    ```

    **Tests to write:**

    ```
    describe('SetupView — doubles layout', () => {
      test('renders 4 player quadrant cards for a doubles match')
        // Assert: wrapper contains text 'Alice', 'Bob', 'Carol', 'Dave'

      test('does NOT render doubles quadrant grid for a singles match')
        // Assert: wrapper does NOT contain class .doubles-court-grid
        // Assert: wrapper DOES contain .court-grid (singles path)

      test('p-label badges reflect swappedSides=false: left=P1/P1D, right=P2/P2D')
        // Assert p-label text in TL=P1, BL=P1D, TR=P2, BR=P2D

      test('after toggleSwapSides(), left side shows team2 players and right shows team1')
        // store.toggleSwapSides()
        // await nextTick()
        // Assert: left top player is Carol, left bot is Dave (team2)
        // Assert: right top player is Alice, right bot is Bob (team1)

      test('Swap Players left button swaps TL and BL player names')
        // Find and click .swap-left-btn
        // await nextTick()
        // Assert: now TL = 'Bob', BL = 'Alice'

      test('Swap Players right button swaps TR and BR player names')
        // Find and click .swap-right-btn
        // await nextTick()
        // Assert: now TR = 'Dave', BR = 'Carol'

      test('serve indicator shows doublesServerName under S circle for doubles')
        // Assert: .s-player-name element exists and contains doublesServerName (default: 'Alice')

      test('between-game modal renders when doublesNextServingTeam is set')
        // store.doublesNextServingTeam = 1 (simulate post-nextGame())
        // await nextTick()
        // Assert: modal with id="doubles-server-choice-modal" is visible
        // Assert: buttons show 'Alice' and 'Bob' (team1 players)

      test('choosing a player in between-game modal calls setDoublesServerForNewGame and clears doublesNextServingTeam')
        // store.doublesNextServingTeam = 2
        // store.prevDoublesInitialServer = { team: 1, player: 0 }
        // store.prevDoublesInitialReceiver = { team: 2, player: 0 }
        // await nextTick()
        // Find button for team2[0] (Carol) and click
        // await nextTick()
        // Assert: store.doublesNextServingTeam === null
        // Assert: store.doublesInitialServer.team === 2 && store.doublesInitialServer.player === 0
    })
    ```

    AVOID: Do not use snapshot testing for the full component — it is too brittle. Use targeted text/class assertions.
    AVOID: Do not use `stubActions: true` in createTestingPinia — we need real store action execution.
    AVOID: Do not import vue-router naively without creating a proper router instance — SetupView uses `useRouter()` which requires a real or mock router in the plugin.
  </action>
  <verify>
    Run: `cd frontend && npm run test -- --run SetupView 2>&1`
    Expected: All describe('SetupView — doubles layout') tests pass, 0 failures.
  </verify>
  <done>
    - File frontend/src/components/__tests__/SetupView.doubles.test.js exists
    - All 9 tests pass when running `npm run test -- --run SetupView`
    - `make test` continues to exit 0 (39 existing + new tests all green)
  </done>
</task>

</tasks>

<verification>
After all tasks, verify:
- [ ] `make test` exits 0 (all tests pass including new SetupView tests)
- [ ] Tests cover: quadrant rendering, swappedSides, swapLeft, swapRight, serve indicator name, between-game modal render, between-game modal action
- [ ] Singles regression test exists and passes
</verification>

<success_criteria>
- [ ] All tasks verified
- [ ] make test exits 0 with new tests included
</success_criteria>
