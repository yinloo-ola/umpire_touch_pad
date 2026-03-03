# STATE.md — Project Memory

> Last updated: 2026-03-03

## Current Phase
**Milestone Card System** — Phase 4 Planned

## Last Session Summary
Phase 3 executed successfully: implemented timeout state management, interval timer, and lifecycle restrictions in `matchStore.js`. Phase 4 discussion held and plans created.

## Current Position
- **Milestone**: Card System
- **Phase**: 4 (planned, ready for execution)
- **Task**: Modal UI (Cards & Timeout)
- **Status**: Plans created, awaiting /execute 4

## Achievement Notes
- Phase 2 complete: penalty points with carry-over + "Undo Next Game".
- Phase 3 complete: timeout state, 60s timer, lifecycle restrictions.
- Phase 4 DECISIONS.md created with full card modal layout reference.

## Next Steps
1. /execute 4

## Known Blockers
None

## Context Notes
- Card modal: tap to issue; tap issued card (if last in LIFO stack) to revert. No separate revert button.
- CardModal.vue receives teamNum prop; maps via swappedSides in Touchpad.vue.
- TimeoutModal.vue is purely reactive — driven by matchStore.timeoutActive.
- Frontend: Vue 3 + Pinia + Vue Router, built with Vite
- Backend: Go 1.24.1 REST server (hardcoded data, no DB)
