# STATE.md — Project Memory

> Last updated: 2026-03-03

## Current Phase
**Milestone Card System** — Phase 4 COMPLETE, Phase 5 Planned

## Last Session Summary
Phase 4 executed and refined: implemented `CardModal.vue` and `TimeoutModal.vue`. Refined Timeout to a top-right circular widget with a darkened blocking overlay and simplified control flow (dismiss-only widget, revert-via-card). Verified via browser subagent and unit tests.

## Current Position
- **Milestone**: Card System
- **Phase**: 4 (Complete)
- **Task**: Display Indicators & Side-Swapping Integration
- **Status**: Phase 4 Complete, awaiting Phase 5 planning

## Achievement Notes
- Phase 4 complete: Modal UI (Cards & Timeout) with circular animations and auto-dismissal.
- Refined Timeout: Widget design with blocking overlay and revert-via-modal flow.

## Next Steps
1. Plan Phase 5 (Display indicators on touchpad + Side-swapping integration).

## Known Blockers
None

## Context Notes
- Card modal: tap to issue; tap issued card (if last in LIFO stack) to revert. No separate revert button.
- CardModal.vue receives teamNum prop; maps via swappedSides in Touchpad.vue.
- TimeoutModal.vue is purely reactive — driven by matchStore.timeoutActive.
- Frontend: Vue 3 + Pinia + Vue Router, built with Vite
- Backend: Go 1.24.1 REST server (hardcoded data, no DB)
