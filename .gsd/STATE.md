# STATE.md — Project Memory

> Last updated: 2026-02-27

## Current Phase
**Phase 2** — Vitest Setup & Phase 1 Store Tests (ready for `/execute 2`)

## Last Session Summary
Phase 1 executed and verified successfully.
- 3 plans, 8 tasks completed in one session
- Full matchStore.js rewritten: 221 → 358 lines
- Build passes: `✓ built in 371ms`
- Phase 2 (testing) inserted; old phases 2→3, 3→4, 4→5

## Current Status
- [x] Codebase mapped → ARCHITECTURE.md, STACK.md
- [x] SPEC.md created (FINALIZED)
- [x] ROADMAP.md created (now 5 phases)
- [x] DECISIONS.md, JOURNAL.md, TODO.md initialized
- [x] Phase 1: Store Foundation ✅ COMPLETE (commit 58ccda1)
  - 1.1: Quadrant state + swap actions + getters ✅
  - 1.2: Doubles serve rotation engine ✅
  - 1.3: Between-game serve setup + deciding-game swap ✅
- [ ] Phase 2: Vitest Setup & Phase 1 Store Tests ← **NEXT**
- [ ] Phase 3: SetupView Doubles UI
- [ ] Phase 4: Touchpad Doubles UI
- [ ] Phase 5: Deciding-game swap + polish

## Known Blockers
None

## Context Notes
- Brownfield project — singles flow is complete; doubles is the target feature
- Frontend: Vue 3 + Pinia + Vue Router, built with Vite
- Backend: Go 1.24.1 REST server (hardcoded data, no DB)
- Dev workflow: `make dev`
- Key complexity: A→X→B→Y→A rotation formula + between-game constrained receiver
- Phase 1 key decisions: All new getters use `(state) =>` arrow form (never `this.`); setDoublesServer() uses backward-calculation from cyclePos; setDoublesServerForNewGame() uses "served-to" map for mandatory receiver derivation
