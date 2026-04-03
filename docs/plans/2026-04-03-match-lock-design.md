# Match Lock Design

## Problem

The same umpire account can be used on two devices simultaneously. Both devices can select and score the same match, with last-write-wins on every sync. This causes data races where score updates from one device silently overwrite the other.

## Solution

Implement per-match locking. When a device starts umpiring a match, it acquires an exclusive lock. Other devices are blocked from scoring the same match and it disappears from their match list.

## Device Identity

- On app load, the frontend generates a random UUID and stores it in `sessionStorage`.
- Sent as `X-Session-ID` header on every API request.
- Same account, different tabs/devices = different session IDs.
- `sessionStorage` naturally resets per tab.

## Lock Table

```sql
CREATE TABLE IF NOT EXISTS match_locks (
    match_id    TEXT PRIMARY KEY,
    session_id  TEXT NOT NULL,
    last_sync   TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

## Lock Lifecycle

| Event | Action |
|---|---|
| Match transitions to `starting` | Acquire lock (INSERT with expiry check) |
| Any sync while lock held | Touch lock (update `last_sync`) |
| Match reaches `completed` | Release lock (DELETE row) |
| Match reset to `unstarted` (admin) | Release lock |
| 30 seconds of no syncs | Lock expires (pruned on next check) |

## SQL Queries

```sql
-- name: AcquireMatchLock :exec
INSERT INTO match_locks (match_id, session_id, last_sync)
VALUES (?, ?, CURRENT_TIMESTAMP)
ON CONFLICT(match_id) DO UPDATE SET
    session_id = excluded.session_id,
    last_sync = excluded.last_sync
WHERE match_locks.last_sync < datetime('now', '-30 seconds');

-- name: GetMatchLock :one
SELECT match_id, session_id, last_sync FROM match_locks WHERE match_id = ?;

-- name: TouchMatchLock :exec
UPDATE match_locks SET last_sync = CURRENT_TIMESTAMP
WHERE match_id = ? AND session_id = ?;

-- name: ReleaseMatchLock :exec
DELETE FROM match_locks WHERE match_id = ?;

-- name: PruneExpiredLocks :exec
DELETE FROM match_locks WHERE last_sync < datetime('now', '-30 seconds');
```

The `AcquireMatchLock` query uses `ON CONFLICT ... DO UPDATE WHERE` — the upsert silently fails (0 rows affected) if the existing lock hasn't expired. The service layer checks `rows affected` to determine if the lock was acquired.

## Backend Changes

### New migration: `00008_add_match_locks.sql`

Creates the `match_locks` table.

### `match_svc.go` — `SyncMatch` changes

1. Extract `X-Session-ID` from the request (passed as a parameter to the service method).
2. On entry, call `PruneExpiredLocks`, then `GetMatchLock`.
3. **No lock exists** and status is transitioning to `starting` → attempt `AcquireMatchLock`. If 0 rows affected, return error (another device holds the lock).
4. **Lock exists and owned by this session** → call `TouchMatchLock`, proceed with sync.
5. **Lock exists and owned by a different session** → return error ("Match is being umpired on another device").
6. Status is `completed` → call `ReleaseMatchLock`.

### `match_svc.go` — `GetTodayMatches` changes

- Call `PruneExpiredLocks` first.
- For each match returned, check `GetMatchLock`.
- Exclude any match that has an active lock owned by a session other than the caller's.

### `handlers.go` — API changes

- Extract `X-Session-ID` from request header in `handleSyncMatch` and pass to `SyncMatch`.
- Extract `X-Session-ID` in `handleGetMatches` and pass to `GetTodayMatches`.
- Return **409 Conflict** when lock acquisition fails or when a different session holds the lock.

### `models.go`

No changes needed — lock logic lives in the service layer, not on the Match model.

## Frontend Changes

### Session ID generation (`main.js`)

```js
function getOrCreateSessionId() {
  let id = sessionStorage.getItem('umpire-session-id')
  if (!id) {
    id = crypto.randomUUID()
    sessionStorage.setItem('umpire-session-id', id)
  }
  return id
}
```

### `matchStore.js` — `syncMatch`

- Include `X-Session-ID` header in the fetch call.
- On 409 response, show alert: "This match is being umpired on another device."
- Force-navigate to the match list.

### Match list

No UI changes. Locked matches are excluded from the API response, so they won't appear. When the user is force-navigated back after a 409, the list re-fetches and the locked match is gone.

## Edge Cases

| Scenario | Behavior |
|---|---|
| Server restarts | All locks lost, but 30s expiry means they'd be pruned quickly anyway. Safe to restart. |
| Admin resets match to `unstarted` | Lock released — `AdminUpdateMatch` calls `ReleaseMatchLock` when status is set back to `unstarted`. |
| Network hiccup on owning device | Lock expires after 30s of no syncs. Other device can then take over. |
| Tab closed (no explicit logout) | `sessionStorage` clears. Syncs stop. Lock expires after 30s. |
| Both devices click the same match simultaneously | First sync to arrive wins the lock. Second gets 409. |
