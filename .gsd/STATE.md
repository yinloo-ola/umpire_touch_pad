# STATE.md — Project Memory

> Last updated: 2026-03-02

## Current Phase
**Milestone Card System** — Planned

## Last Session Summary
Phase 1 executed successfully. 1 plan, 2 tasks completed.

## Current Position
- **Milestone**: Card System
- **Phase**: 1 (completed)
- **Task**: All tasks complete
- **Status**: Verified

## Next Steps
1. /plan 2
2. /execute 2

## Known Blockers
None

## Context Notes
- Point penalty edge cases require careful attention to existing match end / next game boundary logic.
- Card state needs to be linked to players/pairs rather than physical sides to support side-swapping.
- Reverting cards should follow per-team Last-In-First-Out (LIFO) order, which also reverts awarded points. Timeouts are reverted independently. Coaches and players have separated card tracks.
- Frontend: Vue 3 + Pinia + Vue Router, built with Vite
- Backend: Go 1.24.1 REST server (hardcoded data, no DB)
