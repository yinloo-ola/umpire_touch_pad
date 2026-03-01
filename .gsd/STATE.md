# STATE.md — Project Memory

> Last updated: 2026-03-02

## Current Phase
**Milestone v1.0** — Complete

## Last Session Summary
Milestone v1.0 successfully complete. 5 out of 5 phases finished, verified, and archived.

## Current Position
- **Milestone**: v1.0
- **Task**: Finished
- **Status**: ✅ Complete

## Next Steps
1. Run /new-milestone to start compiling the next roadmap.

## Known Blockers
None

## Context Notes
- Brownfield project — singles flow is complete; doubles is the target feature
- Frontend: Vue 3 + Pinia + Vue Router, built with Vite
- Backend: Go 1.24.1 REST server (hardcoded data, no DB)
- Dev workflow: `make dev` | Test workflow: `make test`
- Key complexity: A→X→B→Y→A rotation formula + between-game constrained receiver
- Phase 1 key decisions: All new getters use `(state) =>` arrow form (never `this.`); setDoublesServer() uses backward-calculation from cyclePos; setDoublesServerForNewGame() uses "served-to" map for mandatory receiver derivation
- Phase 2 key decisions: `scorePoints()` helper directly sets store state to bypass pointStarted guard for fast rotation tests; full handleScore() flow used for deciding-game swap tests
- Phase 3 key decisions: SetupView uses `v-if="isDoubles"` branching to keep singles path untouched; Swap Players buttons rendered alongside court grid (flex row); serve indicator click toggles leftDoublesPlayerIdx/rightDoublesPlayerIdx to allow umpire to pick either player; between-game modal reads doublesNextServingTeam from store (set by nextGame()); component tests use real store actions (stubActions: false) + a real vue-router instance
- Phase 3 deviations: @vue/test-utils and @pinia/testing installed (were missing from dev deps); both Plans 3.1 and 3.2 executed together in one SetupView.vue write (they both modify the same file, no benefit to splitting)
- Phase 4 key decisions: Touchpad uses the same 4-quadrant grid pattern as SetupView, conditioned on `isDoubles`; Swap Players buttons replace Cards buttons in `top-row` for doubles; `swapServer` logic for doubles calculates the receiver on the clicked side and calls `setDoublesServer` to allow umpire override; integration tests mirror SetupView pattern with `createTestingPinia({ stubActions: false })` and a mock router.
- Phase 5 key decisions: `midGameSwapPending` introduced to decouple score trigger from visual side-flip, ensuring umpire controls timing; `setDoublesServerForNewGame` moved from manual UI choice to automatic store update in `nextGame`; `swapPlayerOnTeam` updated to dynamically recalibrate mandatory receiver at game start (0-0); `ARCHITECTURE.md` updated to reflect the formalized doubles rotation and state machine expansions.
- Debug Session 2: Decoupled UI manual state overrrides in SetupView and Touchpad from `syncDoublesQuadrants()` to prevent visually jumping players when toggling independent settings (Sides, Players, S/R).
- Debug Session 3: Resolved issue where automatic receiver did not properly recalibrate upon swapping active server at start of games >= 2 by updating UI logic to funnel through swapPlayerOnTeam() logic.
