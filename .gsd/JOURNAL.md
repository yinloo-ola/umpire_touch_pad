# JOURNAL.md — Development Journal

> Running log of sessions, decisions, and observations.

---

## 2026-02-27 — Project Initialization

- Ran `/map` to analyze brownfield codebase
- Identified 13 technical debt items in existing implementation
- User defined scope: complete doubles match feature with full ITTF serve rotation
- Created SPEC.md (finalized), ROADMAP.md (4 phases), DECISIONS.md, ARCHITECTURE.md, STACK.md
- Biggest complexity: the A→X→B→Y→A rotation cycle + between-game constrained receiver rule
- Decided on formula-based rotation (not event chain) for robustness

## 2026-03-07 — Phase 5 Execution & Buffer Fixes

- Executed Phase 5: implemented backend resume/history logic, umpire match list refinement, and admin dashboard history.
- Fixed a critical bug in Doubles Player Swap where rotation would desync if players weren't swapped correctly at game start.
- Reorganized frontend components and refactored routing under `/umpire/` and `/admin/` namespaces.

## 2026-03-09 — UX Polish: Names Visibility

- Implemented "Start Of Play" visibility logic: player names are now hidden while SOP is active and revealed only after the point starts.
- Verified visual behavior via `agent-browser`.

## 2026-03-11 — Infrastructure: Sync & Migration

- Fixed backend synchronization issues where `state_json` was not being correctly persisted.
- Manually applied database migration for `state_json` column in SQLite to avoid data loss.
- Fixed Vitest regression suite timing issues and fetch mocks.

## 2026-03-12 — GSD Maintenance

- Updated GSD framework to latest version.
- Audited and updated all `.gsd` state files to reflect completion of the Admin Portal & DB Sync milestone.

- Fixed bug where clicking "Let" on the touchpad did not trigger a state synchronization with the backend. Added `triggerLet` action to Pinia store.
