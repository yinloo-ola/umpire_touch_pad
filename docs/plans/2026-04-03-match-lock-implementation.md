# Match Lock Implementation Plan

> **REQUIRED SUB-SKILL:** Use the executing-plans skill to implement this plan task-by-task.

**Goal:** Prevent concurrent scoring from two devices by implementing per-match locking with session-based device identity.

**Architecture:** A `match_locks` table stores exclusive locks keyed by match ID. The frontend sends `X-Session-ID` (a per-tab UUID) on every API request. The backend checks/creates/touches locks in `SyncMatch` and filters locked matches in `GetTodayMatches`. Locks expire after 30 seconds of inactivity.

**Tech Stack:** Go (sqlc + SQLite), Vue 3 (Pinia), Vitest

---

### Task 1: Add migration for `match_locks` table

**TDD scenario:** Trivial change — schema-only, verify with manual inspection.

**Files:**
- Create: `backend/db/migrations/00008_add_match_locks.sql`

**Step 1: Create the migration file**

```sql
-- +goose Up
CREATE TABLE IF NOT EXISTS match_locks (
    match_id    TEXT PRIMARY KEY,
    session_id  TEXT NOT NULL,
    last_sync   TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- +goose Down
DROP TABLE IF EXISTS match_locks;
```

**Step 2: Regenerate sqlc and verify it compiles**

Run: `cd backend && sqlc generate`
Then: `cd backend && go build ./...`
Expected: No errors.

**Step 3: Commit**

```bash
git add backend/db/migrations/00008_add_match_locks.sql
git commit -m "feat: add match_locks table migration"
```

---

### Task 2: Add lock SQL queries to query.sql

**TDD scenario:** Modifying generated code — verify sqlc output compiles.

**Files:**
- Modify: `backend/db/query.sql`

**Step 1: Add lock queries to `query.sql`**

Append these queries to the end of `backend/db/query.sql`:

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

**Step 2: Regenerate sqlc**

Run: `cd backend && sqlc generate`
Expected: New methods appear on the `Querier` interface: `AcquireMatchLock`, `GetMatchLock`, `TouchMatchLock`, `ReleaseMatchLock`, `PruneExpiredLocks`.

**Step 3: Verify it compiles**

Run: `cd backend && go build ./...`
Expected: No errors. (Methods exist on the interface but aren't called yet.)

**Step 4: Commit**

```bash
git add backend/db/query.sql backend/internal/store/
git commit -m "feat: add match lock SQL queries"
```

---

### Task 3: Backend service — add `sessionID` parameter to `SyncMatch`

**TDD scenario:** Modifying existing code — run existing build to verify.

**Files:**
- Modify: `backend/internal/service/match_svc.go`

**Step 1: Add lock logic to `SyncMatch`**

Change the `SyncMatch` signature to accept `sessionID string`, and add lock checking before the existing sync logic. The design document specifies:

1. On entry, call `PruneExpiredLocks`, then `GetMatchLock`.
2. No lock and status is transitioning to `starting` → attempt `AcquireMatchLock`. If 0 rows affected, return error.
3. Lock exists and owned by this session → call `TouchMatchLock`, proceed with sync.
4. Lock exists and owned by different session → return error.
5. Status is `completed` → call `ReleaseMatchLock` after sync.

Update the `SyncMatch` method signature and add lock logic at the top:

```go
var ErrMatchLocked = fmt.Errorf("match is being umpired on another device")

func (s *MatchService) SyncMatch(ctx context.Context, sessionID string, req SyncMatchRequest) error {
	tx, err := s.db.BeginTx(ctx, nil)
	if err != nil {
		return err
	}
	defer tx.Rollback()

	qtx := store.New(tx)

	// --- Lock logic (before sync) ---
	_ = qtx.PruneExpiredLocks(ctx)

	lock, lockErr := qtx.GetMatchLock(ctx, req.MatchID)
	if lockErr != nil && lockErr != sql.ErrNoRows {
		return fmt.Errorf("lock check failed: %w", lockErr)
	}

	if lockErr == sql.ErrNoRows {
		// No lock exists
		if req.Status == "starting" || req.Status == "warming_up" || req.Status == "in_progress" {
			// Acquire lock
			res, acqErr := qtx.AcquireMatchLock(ctx, store.AcquireMatchLockParams{
				MatchID:   req.MatchID,
				SessionID: sessionID,
			})
			if acqErr != nil {
				return fmt.Errorf("lock acquisition failed: %w", acqErr)
			}
			rows, _ := res.RowsAffected()
			if rows == 0 {
				return ErrMatchLocked
			}
		}
		// No lock needed for unstarted/completed
	} else {
		// Lock exists
		if lock.SessionID != sessionID {
			return ErrMatchLocked
		}
		// Touch the lock
		_ = qtx.TouchMatchLock(ctx, store.TouchMatchLockParams{
			MatchID:   req.MatchID,
			SessionID: sessionID,
		})
	}

	// --- Existing sync logic (unchanged) ---
	// (the rest of SyncMatch body stays exactly the same)
	// ...

	// Before commit: release lock if match completed
	if req.Status == "completed" {
		_ = qtx.ReleaseMatchLock(ctx, req.MatchID)
	}

	return tx.Commit()
}
```

**Important:** The `store` package may use `sql.ErrNoRows` — verify the generated code returns that for `GetMatchLock` when no row is found. If sqlc wraps differently, adjust the nil check accordingly. Check by reading the generated `query.sql.go` after running sqlc in Task 2.

Also update `AcquireMatchLock` — the generated code will return `(sql.Result, error)` since it's an `:exec` query. But SQLite's `ON CONFLICT ... DO UPDATE WHERE` that affects 0 rows returns a valid result with 0 rows affected. Verify this.

**Step 2: Update `AdminUpdateMatch` to release lock when status is reset to `unstarted`**

After the existing `AdminUpdateMatch` logic (after `tx.Commit()` or inside before commit), add:

```go
// Inside AdminUpdateMatch, after the status update (before commit):
if req.Status == "unstarted" {
    _ = qtx.ReleaseMatchLock(ctx, matchID)
}
```

This requires adding `qtx` to the admin update transaction. Check the existing code — it already uses `qtx := store.New(tx)`.

**Step 3: Verify it compiles**

Run: `cd backend && go build ./...`
Expected: Compilation error in `handlers.go` because `SyncMatch` now takes a `sessionID` parameter. This is expected — fix it in Task 4.

**Step 4: Commit**

```bash
git add backend/internal/service/match_svc.go
git commit -m "feat: add lock logic to SyncMatch and AdminUpdateMatch"
```

---

### Task 4: Backend API — extract `X-Session-ID` and pass to service

**TDD scenario:** Modifying existing code — verify build succeeds.

**Files:**
- Modify: `backend/internal/api/handlers.go`

**Step 1: Update `handleSyncMatch` to extract session ID**

```go
func (h *APIHandler) handleSyncMatch(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPut {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	id := r.PathValue("id")
	if id == "" {
		http.Error(w, "Match ID required", http.StatusBadRequest)
		return
	}

	var req service.SyncMatchRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}
	req.MatchID = id

	sessionID := r.Header.Get("X-Session-ID")

	if err := h.svc.SyncMatch(r.Context(), sessionID, req); err != nil {
		if err == service.ErrMatchLocked {
			http.Error(w, err.Error(), http.StatusConflict)
			return
		}
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}
```

**Step 2: Update `handleGetMatches` to filter locked matches**

Update `GetTodayMatches` service method signature to accept `sessionID string`. In the service, after fetching matches, prune expired locks, then for each match check if it has a lock owned by a different session — if so, exclude it.

Add `sessionID` parameter to `GetTodayMatches`:

```go
func (s *MatchService) GetTodayMatches(ctx context.Context, sessionID string, history bool) ([]Match, error) {
	// ... existing code to fetch matches ...

	// After building results, filter out locked matches (non-history only)
	if !history && sessionID != "" {
		_ = s.store.PruneExpiredLocks(ctx)
		var filtered []Match
		for _, m := range results {
			lock, err := s.store.GetMatchLock(ctx, m.ID)
			if err == sql.ErrNoRows {
				filtered = append(filtered, m)
			} else if err == nil && lock.SessionID == sessionID {
				filtered = append(filtered, m)
			}
			// If lock exists and belongs to another session, exclude
		}
		results = filtered
	}

	return results, nil
}
```

Then update the handler:

```go
func (h *APIHandler) handleGetMatches(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	history := r.URL.Query().Get("history") == "true"
	sessionID := r.Header.Get("X-Session-ID")
	matches, err := h.svc.GetTodayMatches(r.Context(), sessionID, history)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(matches)
}
```

**Step 3: Add `X-Session-ID` to CORS allowed headers**

In `backend/cmd/server/main.go`, add `"X-Session-ID"` to `AllowedHeaders`:

```go
AllowedHeaders: []string{"Accept", "Authorization", "Content-Type", "X-CSRF-Token", "X-Session-ID"},
```

**Step 4: Verify it compiles**

Run: `cd backend && go build ./...`
Expected: No errors.

**Step 5: Commit**

```bash
git add backend/internal/api/handlers.go backend/internal/service/match_svc.go backend/cmd/server/main.go
git commit -m "feat: pass X-Session-ID through API layer, filter locked matches"
```

---

### Task 5: Backend — manual integration test via curl

**TDD scenario:** Manual verification against running server.

**Files:** None (verification only)

**Step 1: Start the server**

Run: `cd backend && go run ./cmd/server`

**Step 2: Test lock acquisition**

```bash
# Create a match first (login as admin)
# Then sync with a session ID:
curl -X PUT http://localhost:8080/api/matches/{match_id}/sync \
  -H "Content-Type: application/json" \
  -H "X-Session-ID: session-A" \
  -H "Cookie: jwt=<token>" \
  -d '{"matchId":"<id>","status":"starting","currentGame":1,"game":{"gameNumber":1,"team1Score":0,"team2Score":0,"status":"in_progress"},"cards":[]}'

# Expected: 204 No Content
```

**Step 3: Test lock conflict**

```bash
# Same match, different session:
curl -X PUT http://localhost:8080/api/matches/{match_id}/sync \
  -H "Content-Type: application/json" \
  -H "X-Session-ID: session-B" \
  -H "Cookie: jwt=<token>" \
  -d '{"matchId":"<id>","status":"in_progress","currentGame":1,"game":{"gameNumber":1,"team1Score":1,"team2Score":0,"status":"in_progress"},"cards":[]}'

# Expected: 409 Conflict with "match is being umpired on another device"
```

**Step 4: Test that locked match is filtered from list**

```bash
curl http://localhost:8080/api/matches \
  -H "X-Session-ID: session-B" \
  -H "Cookie: jwt=<token>"

# Expected: The locked match does NOT appear in the JSON response
```

**Step 5: Test that owning session still sees the match**

```bash
curl http://localhost:8080/api/matches \
  -H "X-Session-ID: session-A" \
  -H "Cookie: jwt=<token>"

# Expected: The locked match DOES appear (owned by session-A)
```

---

### Task 6: Frontend — generate session ID and send on API calls

**TDD scenario:** Modifying existing code — verify frontend builds.

**Files:**
- Modify: `frontend/src/main.js`
- Modify: `frontend/src/stores/matchStore.js`

**Step 1: Add session ID generation to `main.js`**

```js
function getOrCreateSessionId() {
  let id = sessionStorage.getItem('umpire-session-id')
  if (!id) {
    id = crypto.randomUUID()
    sessionStorage.setItem('umpire-session-id', id)
  }
  return id
}

// Expose globally for stores to use
window.__umpireSessionId = getOrCreateSessionId()
```

Add this code at the top of `frontend/src/main.js`, before `createApp`.

**Step 2: Update `matchStore.js` — `syncMatch` to send session ID and handle 409**

In the `syncMatch` action, modify the fetch call:

```js
async syncMatch() {
  if (!this.currentMatch) return
  this.syncStatus = 'syncing'

  // ... existing cards/volatiles/payload code unchanged ...

  try {
    const resp = await fetch(`/api/matches/${this.currentMatch.id}/sync`, {
      method: 'PUT',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        'X-Session-ID': window.__umpireSessionId,
      },
      body: JSON.stringify(payload),
    })

    if (resp.status === 409) {
      alert('This match is being umpired on another device.')
      this.$router.push('/')
      return
    }

    if (!resp.ok) throw new Error('Sync failed')
    this.syncStatus = 'synced'
  } catch (err) {
    console.error('Match sync error:', err)
    this.syncStatus = 'error'
  }
},
```

**Step 3: Update `fetchMatchState` to send session ID**

```js
async fetchMatchState(id) {
  try {
    const resp = await fetch(`/api/matches/${id}`, {
      credentials: 'include',
      headers: {
        'X-Session-ID': window.__umpireSessionId,
      },
    })
    // ... rest unchanged ...
  }
}
```

**Step 4: Check `adminStore.js` for any match-related fetches**

Read `frontend/src/stores/adminStore.js` to see if it calls sync or match endpoints. If so, add the `X-Session-ID` header there too.

**Step 5: Verify frontend builds**

Run: `cd frontend && npm run build`
Expected: No errors.

**Step 6: Commit**

```bash
git add frontend/src/main.js frontend/src/stores/matchStore.js frontend/src/stores/adminStore.js
git commit -m "feat: send X-Session-ID header, handle 409 conflict on sync"
```

---

### Task 7: Frontend — add header to all other authenticated fetches

**TDD scenario:** Modifying existing code — verify frontend builds.

**Files:**
- Modify: `frontend/src/stores/adminStore.js` (if needed)
- Modify: any view files making direct fetch calls

**Step 1: Audit all fetch calls in frontend**

Run: `cd frontend && grep -rn "fetch(" src/ --include="*.js" --include="*.vue"`

For every `fetch` call that hits `/api/matches` or `/api/matches/`, add the header:

```js
headers: {
  ...existingHeaders,
  'X-Session-ID': window.__umpireSessionId,
},
```

**Step 2: Verify build**

Run: `cd frontend && npm run build`

**Step 3: Commit (if any changes)**

```bash
git add frontend/
git commit -m "feat: add X-Session-ID to all match API fetch calls"
```

---

### Task 8: End-to-end verification

**TDD scenario:** Manual E2E test.

**Files:** None (verification only)

**Step 1: Start backend and frontend**

```bash
# Terminal 1
cd backend && go run ./cmd/server

# Terminal 2
cd frontend && npm run dev
```

**Step 2: Open two browser tabs at http://localhost:5173**

- Log in with the same account in both tabs.
- In Tab A, select a match and start scoring.
- In Tab B, verify the selected match disappears from the match list.
- In Tab B, try navigating directly to the match URL `/match/{id}` — verify the 409 alert appears and redirects to `/`.

**Step 3: Verify lock expiry**

- In Tab A, stop interacting (let 30 seconds pass).
- In Tab B, refresh the match list — the match should reappear.
- In Tab B, select and sync the match — should succeed.

**Step 4: Verify match completion releases lock**

- In Tab A, complete the match.
- In Tab B, refresh and verify the match appears as completed in history view.

---

## Implementation Notes

### sqlc Type Mapping for `AcquireMatchLock`

The `ON CONFLICT ... DO UPDATE WHERE` pattern in SQLite returns `sql.Result` via `:exec`. When the WHERE clause filters out the update (lock not expired), `RowsAffected()` returns 0. The generated Go code will look like:

```go
func (q *Queries) AcquireMatchLock(ctx context.Context, arg AcquireMatchLockParams) (sql.Result, error)
```

If sqlc generates it differently (e.g., returns just `error`), the lock-acquisition check needs adjustment. Verify the generated output in Task 2.

### `GetMatchLock` nil vs `sql.ErrNoRows`

sqlc `:one` queries return `sql.ErrNoRows` when no row is found. Verify by checking the generated `GetMatchLock` implementation. The service code checks `lockErr == sql.ErrNoRows` to distinguish "no lock" from "actual DB error".

### Session ID in `fetchMatchState`

When a user navigates directly to a match URL (deep link), `fetchMatchState` is called. The session ID header ensures the backend can check the lock. If the match is locked by another session, the `fetchMatchState` response succeeds (it's a GET), but the next `syncMatch` will fail with 409. This is acceptable — the user sees the match state briefly, then gets redirected on their first action.

If we want to prevent even viewing a locked match, we could add lock checking to `GetMatchState` too, but the design doc explicitly says: "Locked matches are excluded from the API response" — this applies to the list, not to individual match state.
