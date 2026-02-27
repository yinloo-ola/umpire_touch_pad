# STATE.md — Project Memory

> Last updated: 2026-02-27

## Current Phase
**Phase 3** — SetupView Doubles Four-Quadrant Court

## Last Session Summary
Phase 2 executed and verified successfully.
- 2 plans, 5 tasks completed
- Vitest + @pinia/testing + happy-dom installed
- `vite.config.js` configured with `test: { globals: true, environment: 'happy-dom' }`
- 39 unit tests written for all Phase 1 matchStore doubles logic — 0 failures
- `make test` wired and passing from root

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
- [ ] Phase 3: SetupView Doubles UI ← **NEXT**
- [ ] Phase 4: Touchpad Doubles UI
- [ ] Phase 5: Deciding-game swap + polish

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
