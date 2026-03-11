# TODO.md — Pending Items

> Items captured for later. Not part of active roadmap phases.

---

## Backlog

- [x] Implement card system (yellow/red/white) per player
- [x] Admin dashboard "Show History" is restricted to today's completed matches; should show all matches. `high` — 2026-03-11
- [x] Umpire Touchpad: Manual server change (clicking "R") does not trigger `syncMatch`. `high` — 2026-03-11
- [x] Umpire Touchpad: Swap players (doubles) and Swap sides (all) do not trigger `syncMatch`, causing state to revert on refresh. `high` — 2026-03-11
- [x] Admin dashboard has duplicate "Team 1" column in `DashboardView.vue`. `medium` — 2026-03-11
- [x] Umpire Touchpad: Do not show countries if they are empty (currently defaults to KOR/BLR). `medium` — 2026-03-11
- [ ] Implement Expedite rule (15-minute timer; serve rotation changes)
- [ ] Wire up "Edit Score" button in score summary header
- [ ] Replace hardcoded player ID `108246` in winner modal
- [x] Add match result persistence to Go backend (requires DB)
- [ ] Add structured error logging (replace `console.error` in MatchList.vue)
- [ ] Add input validation to backend `saveMatch` endpoint
- [ ] Configurable CORS origins (move out of hardcoded `main.go`)
- [ ] Add tests (Vitest for frontend store logic, Go table tests for backend)
- [x] Doubles pre-warmup UI should be identical in style to singles pre-warmup — same dark background, same table court look — but with 4 players in 4 quadrants and "Swap Players" buttons (left/right sides) `medium` — 2026-02-27
- [x] Refactor `frontend/src/router/index.js`: Move umpire routes under `/umpire/` and redirect to `/umpire/match-list` upon login. `medium` — 2026-03-07
