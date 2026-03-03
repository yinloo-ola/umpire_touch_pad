# STATE.md — Project Memory

> Last updated: 2026-03-03

## Current Phase
**Milestone Card System** — ✅ COMPLETE

## Last Session Summary
Phase 5 executed and verified. Also ran a debug session and resolved an issue where the mid-game side swap (in decider games) would not cleanly revert when the score dropped below 5 points. Fixed by introducing `midGameSwapSnapshot` and wiring it to `handleScore` / `revertPenaltyPoints`.

## Current Position
- **Milestone**: Card System
- **Phase**: 5 (completed)
- **Task**: All tasks complete
- **Status**: Verified

## Achievement Notes
- Phase 1-5 complete for Card System Milestone.
- Full support for player/coach cards, timeouts, penalty point awarding, and visual indicators.
- Robust side-swapping integration for all UI elements.

## Next Steps
1. Review roadmap for future milestones (Expedite rule, Persistence, etc.).

## Known Blockers
None

## Context Notes
- Card modal: tap to issue; tap issued card to revert.
- Indicators: Reactive and side-agnostic (using `swappedSides`).
- Frontend: Vue 3 + Pinia + Vue Router.
- Backend: Go 1.24.1 (mocked data).
