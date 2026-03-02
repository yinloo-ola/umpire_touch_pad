# STATE.md — Project Memory

> Last updated: 2026-03-02

## Current Phase
**Milestone Card System** — Planned

## Last Session Summary
Milestone v1.0 successfully complete. Started new milestone to implement the Card System.

## Current Position
- **Milestone**: Card System
- **Phase**: 1
- **Task**: Planning complete
- **Status**: Ready for execution

## Next Steps
1. /execute 1

## Known Blockers
None

## Context Notes
- Point penalty edge cases require careful attention to existing match end / next game boundary logic.
- Card state needs to be linked to players/pairs rather than physical sides to support side-swapping.
- Reverting cards should follow per-team Last-In-First-Out (LIFO) order, which also reverts awarded points. Timeouts are reverted independently. Coaches and players have separated card tracks.
- Frontend: Vue 3 + Pinia + Vue Router, built with Vite
- Backend: Go 1.24.1 REST server (hardcoded data, no DB)
