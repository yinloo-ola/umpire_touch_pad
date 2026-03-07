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

## 2026-03-07 — Router Refactoring Planning

- Captured a todo for refactoring `frontend/src/router/index.js` to structure umpire routes under `/umpire/` and handle post-login redirection to match-list view.
