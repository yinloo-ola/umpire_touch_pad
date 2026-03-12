- [x] Dedicated Admin Portal frontend UI to create/view matches — VERIFIED
- [x] Double-confirm match status sync and real-time touchpad hooks — VERIFIED
- [x] **Timeout Recording Refactor**:
    - [x] Migration `00004` drops `teamX_timeout` from `matches` — VERIFIED
    - [x] Timeouts recorded as cards in `cards` table with game context — VERIFIED
    - [x] Pinia store tracks `timeoutGame` and sends it in `syncMatch` — VERIFIED (frontend/src/stores/matchStore.js)
    - [x] Backend `SyncMatch` handler links cards (including timeouts) to correct `game_id` — VERIFIED (backend/internal/service/match_svc.go)

### Verdict: PASS
