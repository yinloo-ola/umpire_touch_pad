# STATE.md — Project Memory

> Last updated: 2026-02-27

## Current Phase
**Phase 1** — Store Foundation (not started)

## Last Session Summary
Project fully initialized via `/new-project`.
- Codebase mapped: 5 components, 13 debt items
- SPEC.md finalized: doubles match feature with full ITTF serve rotation
- ROADMAP.md created: 4 phases
- All GSD docs initialized

## Current Status
- [x] Codebase mapped → ARCHITECTURE.md, STACK.md
- [x] SPEC.md created (FINALIZED)
- [x] ROADMAP.md created (4 phases)
- [x] DECISIONS.md, JOURNAL.md, TODO.md initialized
- [ ] Phase 1: Store Foundation
- [ ] Phase 2: SetupView Doubles UI
- [ ] Phase 3: Touchpad Doubles UI
- [ ] Phase 4: Deciding-game swap + polish

## Known Blockers
None

## Context Notes
- Brownfield project — singles flow is complete; doubles is the target feature
- Frontend: Vue 3 + Pinia + Vue Router, built with Vite
- Backend: Go 1.24.1 REST server (hardcoded data, no DB)
- Dev workflow: `make dev`
- Key complexity: A→X→B→Y→A rotation formula + between-game constrained receiver
