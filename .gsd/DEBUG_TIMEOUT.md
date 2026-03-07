# Debug Session: Timeout Recording Improvement

## Symptom
Timeout recording is currently boolean flags in the `matches` table (`team1_timeout`, `team2_timeout`).
It does not capture:
1. Which game the timeout was taken in.
2. Multiple timeouts (though typically only 1 allowed, some rules might vary or it's better to log it as an event).
3. Linking it to other cards (Yellow, Red).

**When:** Syncing match data.
**Expected:** Timeout recorded with game context in the `cards` table.
**Actual:** Recorded at match level without game reference.

## Evidence
- `00003_add_timeouts.sql` added boolean flags to `matches`.
- `query.sql` uses these flags in `UpdateMatchStatus`.

## Hypotheses

| # | Hypothesis | Likelihood | Status |
|---|------------|------------|--------|
| 1 | Moving timeout to `cards` table provides game_id and precise timestamp. | 100% | IN PROGRESS |
| 2 | Frontend update is needed to send timeout as a card event with game info. | 100% | UNTESTED |
| 3 | `SyncMatch` payload needs to include `gameNumber` for all cards. | 100% | UNTESTED |

## Attempts

### Attempt 1: Schema & Backend Updates
**Testing:** Refactoring DB and `SyncMatch` Go handler.
**Action:** 
1. Created `00004_refactor_timeouts.sql` (move timeouts to cards).
2. Updated `query.sql` (UpdateMatchStatus should remove timeout fields).
3. Updated `match_svc.go` (types and handler).
4. Regenerated manual store files (models.go, query.sql.go, querier.go).
**Result:** Backend builds successfully and logic is updated to link cards to game IDs.
**Conclusion:** CONFIRMED

### Attempt 2: Frontend Store Update
**Testing:** Updating Pinia state to store cards with game context.
**Action:** 
1. Updated `teamXCards` to store objects `{ type, game }`.
2. Updated `issueCard`, `revertLastCard` (handles game context).
3. Updated `issueTimeout`, `revertTimeout` to track `timeoutGame`.
4. Updated `syncMatch` to send formatted cards with game numbers (including timeouts).
**Result:** Frontend now tracks exactly which game each card/timeout occurred in and sends it to the backend.
**Conclusion:** CONFIRMED

## Resolution

**Root Cause:** Timeout recording was at the match level without game context.
**Fix:** 
- Removed timeout flags from `matches` table.
- Added game context tracking to `cards` in both frontend and backend.
- Timeouts are now recorded as cards with `card_type = 'Timeout'` and a link to the specific `game_id`.
**Verified:** Backend compilation and code analysis.
**Regression Check:** Regular cards (Yellow, etc.) now also have game context in the database, which is an improvement!
