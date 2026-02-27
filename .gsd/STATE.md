# STATE.md — Project Memory

> Last updated: 2026-02-27

## Current Phase
**Phase 4** — Touchpad Doubles Live Scoring UI

## Last Session Summary
Phase 3 complete (3 plans, 3 waves, all verified).
- 3.1: Doubles court layout (4-quadrant grid + Swap Players buttons) ✅
- 3.2: Doubles serve designation (indicator names + between-game modal) ✅
- 3.3: SetupView integration tests — 9 tests, all passing ✅
- `make test` exits 0 with 48 total tests (39 store + 9 component)
- Dependencies added: `@vue/test-utils`, `@pinia/testing`

## Current Status
- [x] Codebase mapped → ARCHITECTURE.md, STACK.md
- [x] SPEC.md created (FINALIZED)
- [x] ROADMAP.md created (now 5 phases)
- [x] DECISIONS.md, JOURNAL.md, TODO.md initialized
- [x] Phase 1: Store Foundation ✅ COMPLETE (commit 58ccda1)
  - 1.1: Quadrant state + swap actions + getters ✅
  - 1.2: Doubles serve rotation engine ✅
  - 1.3: Between-game serve setup + deciding-game swap ✅
- [x] Phase 2: Vitest Setup & Phase 1 Store Tests ✅ COMPLETE (commits 0f2b115, 361a41f)
  - 2.1: Vitest install, vite config, make test ✅
  - 2.2: 39 unit tests, all passing ✅
- [x] Phase 3: SetupView Doubles UI ✅ COMPLETE (commits fdded05, 1992989)
  - 3.1: Doubles court layout — 4-quadrant grid + Swap Players buttons ✅
  - 3.2: Doubles serve designation + between-game modal ✅
  - 3.3: SetupView integration tests (9 tests) ✅
- [ ] Phase 4: Touchpad Doubles UI ← **NEXT UP**
- [ ] Phase 5: Deciding-game swap + polish

## Next Steps
1. `/plan 4` — plan Touchpad Doubles UI, or
2. `/execute 4` — execute directly if plans exist

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
