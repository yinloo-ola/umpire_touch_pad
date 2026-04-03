# Match Lock Implementation Plan

> **REQUIRED SUB-SKILL:** Use the executing-plans skill to implement this plan task-by-task.

**Goal:** Prevent concurrent scoring from two devices by implementing per-match locking with session-based device identity.

**Architecture:** A `match_locks` table stores exclusive locks keyed by match ID. The frontend sends `X-Session-ID` (a per-tab UUID) on every API request. The backend checks/creates/touches locks in `SyncMatch` and filters locked matches in `GetTodayMatches`. Locks expire after 30 seconds of inactivity.

**Tech Stack:** Go (sqlc + SQLite), Vue 3 (Pinia), Vitest

---

### Task 1: Add migration for `match_locks` table

**TDD scenario:** Scenario 3 (trivial) — schema-only, no logic. Verify with sqlc generate.

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

**Step 2: Verify sqlc still generates cleanly**

Run: `cd backend && sqlc generate && go build ./...`
Expected: No errors.

**Step 3: Commit**

```bash
git add backend/db/migrations/00008_add_match_locks.sql
git commit -m "feat: add match_locks table migration"
```

---

### Task 2: Add lock SQL queries and regenerate sqlc

**TDD scenario:** Scenario 3 (trivial) — query definitions only. Verify sqlc output.

**Files:**
- Modify: `backend/db/query.sql`

**Step 1: Add lock queries to `query.sql`**

Append these queries to the end of `backend/db/query.sql`:

```sql
-- name: AcquireMatchLock :execresult
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

**Note:** `AcquireMatchLock` uses `:execresult` (not `:exec`) so sqlc generates `(sql.Result, error)` — we need `RowsAffected()` to detect whether the lock was acquired or the existing lock blocked us.

**Step 2: Regenerate sqlc**

Run: `cd backend && sqlc generate`

**Step 3: Verify the generated `AcquireMatchLock` signature**

Read `backend/internal/store/query.sql.go` and confirm:

```go
func (q *Queries) AcquireMatchLock(ctx context.Context, arg AcquireMatchLockParams) (sql.Result, error)
```

And that `AcquireMatchLockParams` has `MatchID string` and `SessionID string`.

**Step 4: Verify build**

Run: `cd backend && go build ./...`
Expected: No errors. New methods exist on `Querier` interface but aren't called yet.

**Step 5: Commit**

```bash
git add backend/db/query.sql backend/internal/store/
git commit -m "feat: add match lock SQL queries to query.sql"
```

---

### Task 3: Backend — `LockService` (Scenario 1: full TDD cycle)

**TDD scenario:** Scenario 1 — new file, new functions. Full red-green-refactor for each behavior.

We create a small `lock_svc.go` with pure lock logic (acquire, check, touch, release, prune) and test it against a real in-memory SQLite database.

**Files:**
- Create: `backend/internal/service/lock_svc.go`
- Create: `backend/internal/service/lock_svc_test.go`

#### RED — Write failing tests

Create `backend/internal/service/lock_svc_test.go`:

```go
package service

import (
	"database/sql"
	"testing"

	"umpire-backend/internal/store"

	_ "modernc.org/sqlite"
)

// openTestDB creates an in-memory SQLite DB with the match_locks table only.
func openTestDB(t *testing.T) *sql.DB {
	t.Helper()
	db, err := sql.Open("sqlite", ":memory:")
	if err != nil {
		t.Fatalf("open db: %v", err)
	}
	_, err = db.Exec(`CREATE TABLE IF NOT EXISTS match_locks (
		match_id   TEXT PRIMARY KEY,
		session_id TEXT NOT NULL,
		last_sync  TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
	)`)
	if err != nil {
		t.Fatalf("create table: %v", err)
	}
	return db
}

func TestAcquire_NewLock(t *testing.T) {
	db := openTestDB(t)
	defer db.Close()
	svc := NewLockService(store.New(db))

	err := svc.Acquire("match-1", "session-A")
	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}
}

func TestAcquire_RejectsWhenActive(t *testing.T) {
	db := openTestDB(t)
	defer db.Close()
	svc := NewLockService(store.New(db))

	err := svc.Acquire("match-1", "session-A")
	if err != nil {
		t.Fatalf("first acquire: %v", err)
	}

	err = svc.Acquire("match-1", "session-B")
	if err != ErrMatchLocked {
		t.Fatalf("expected ErrMatchLocked, got %v", err)
	}
}

func TestAcquire_TakeoverAfterExpiry(t *testing.T) {
	db := openTestDB(t)
	defer db.Close()
	svc := NewLockService(store.New(db))

	_, err := db.Exec(`INSERT INTO match_locks (match_id, session_id, last_sync)
		VALUES (?, ?, datetime('now', '-60 seconds'))`, "match-1", "session-A")
	if err != nil {
		t.Fatalf("insert expired lock: %v", err)
	}

	err = svc.Acquire("match-1", "session-B")
	if err != nil {
		t.Fatalf("expected takeover to succeed, got %v", err)
	}
}

func TestIsLockedBy_NoLock(t *testing.T) {
	db := openTestDB(t)
	defer db.Close()
	svc := NewLockService(store.New(db))

	locked, err := svc.IsLockedBy("match-1", "session-A")
	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}
	if locked {
		t.Fatal("expected false, got true")
	}
}

func TestIsLockedBy_OwnLock(t *testing.T) {
	db := openTestDB(t)
	defer db.Close()
	svc := NewLockService(store.New(db))

	svc.Acquire("match-1", "session-A")

	locked, err := svc.IsLockedBy("match-1", "session-A")
	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}
	if !locked {
		t.Fatal("expected true (own lock), got false")
	}
}

func TestIsLockedBy_OtherLock(t *testing.T) {
	db := openTestDB(t)
	defer db.Close()
	svc := NewLockService(store.New(db))

	svc.Acquire("match-1", "session-A")

	locked, err := svc.IsLockedBy("match-1", "session-B")
	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}
	if locked {
		t.Fatal("expected false (other session's lock), got true")
	}
}

func TestTouch_OwnLock(t *testing.T) {
	db := openTestDB(t)
	defer db.Close()
	svc := NewLockService(store.New(db))

	svc.Acquire("match-1", "session-A")

	err := svc.Touch("match-1", "session-A")
	if err != nil {
		t.Fatalf("touch own lock: %v", err)
	}
}

func TestTouch_WrongSession(t *testing.T) {
	db := openTestDB(t)
	defer db.Close()
	svc := NewLockService(store.New(db))

	svc.Acquire("match-1", "session-A")

	err := svc.Touch("match-1", "session-B")
	if err == nil {
		t.Fatal("expected error when touching other session's lock")
	}
}

func TestRelease(t *testing.T) {
	db := openTestDB(t)
	defer db.Close()
	svc := NewLockService(store.New(db))

	svc.Acquire("match-1", "session-A")

	err := svc.Release("match-1")
	if err != nil {
		t.Fatalf("release: %v", err)
	}

	locked, _ := svc.IsLockedBy("match-1", "session-A")
	if locked {
		t.Fatal("expected lock to be released")
	}
}

func TestPrune(t *testing.T) {
	db := openTestDB(t)
	defer db.Close()
	svc := NewLockService(store.New(db))

	_, err := db.Exec(`INSERT INTO match_locks (match_id, session_id, last_sync)
		VALUES (?, ?, datetime('now', '-60 seconds'))`, "match-1", "session-A")
	if err != nil {
		t.Fatalf("insert expired lock: %v", err)
	}

	svc.Prune()

	locked, _ := svc.IsLockedBy("match-1", "session-A")
	if locked {
		t.Fatal("expected expired lock to be pruned")
	}
}
```

#### Verify RED — watch tests fail

Run: `cd backend && go test ./internal/service/ -run "Test(Acquire|IsLockedBy|Touch|Release|Prune)" -v`

Expected: **Compilation error** — `NewLockService`, `Acquire`, `IsLockedBy`, `Touch`, `Release`, `Prune`, `ErrMatchLocked` all undefined.

```
undefined: NewLockService
undefined: svc.Acquire
undefined: ErrMatchLocked
```

If the error is anything else (e.g., syntax error in test file), fix the test, not production code.

#### GREEN — minimal implementation

Create `backend/internal/service/lock_svc.go`:

```go
package service

import (
	"context"
	"database/sql"
	"errors"
	"fmt"

	"umpire-backend/internal/store"
)

var ErrMatchLocked = errors.New("match is being umpired on another device")

type LockService struct {
	store store.Querier
}

func NewLockService(q store.Querier) *LockService {
	return &LockService{store: q}
}

func (s *LockService) Acquire(matchID, sessionID string) error {
	ctx := context.Background()
	_ = s.store.PruneExpiredLocks(ctx)

	res, err := s.store.AcquireMatchLock(ctx, store.AcquireMatchLockParams{
		MatchID:   matchID,
		SessionID: sessionID,
	})
	if err != nil {
		return fmt.Errorf("lock acquisition failed: %w", err)
	}
	rows, _ := res.RowsAffected()
	if rows == 0 {
		return ErrMatchLocked
	}
	return nil
}

func (s *LockService) IsLockedBy(matchID, sessionID string) (bool, error) {
	ctx := context.Background()
	lock, err := s.store.GetMatchLock(ctx, matchID)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return false, nil
		}
		return false, err
	}
	return lock.SessionID == sessionID, nil
}

func (s *LockService) Touch(matchID, sessionID string) error {
	ctx := context.Background()
	return s.store.TouchMatchLock(ctx, store.TouchMatchLockParams{
		MatchID:   matchID,
		SessionID: sessionID,
	})
}

func (s *LockService) Release(matchID string) error {
	ctx := context.Background()
	return s.store.ReleaseMatchLock(ctx, matchID)
}

func (s *LockService) Prune() error {
	ctx := context.Background()
	return s.store.PruneExpiredLocks(ctx)
}
```

#### Verify GREEN — watch tests pass

Run: `cd backend && go test ./internal/service/ -run "Test(Acquire|IsLockedBy|Touch|Release|Prune)" -v`

Expected: All 10 tests PASS, no warnings, no errors.

#### REFACTOR

No refactoring needed — the implementation is minimal.

#### Commit

```bash
git add backend/internal/service/lock_svc.go backend/internal/service/lock_svc_test.go
git commit -m "feat: add LockService with unit tests"
```

---

### Task 4: Backend — `SyncMatch` lock integration (Scenario 1: full TDD cycle)

**TDD scenario:** Scenario 1 — modifying untested code (SyncMatch has no tests). Write failing tests first for lock behavior, then implement. Existing sync behavior isn't being changed — lock logic is additive and gated behind the new `sessionID` parameter.

**Files:**
- Create: `backend/internal/service/match_lock_test.go`
- Modify: `backend/internal/service/match_svc.go`

#### Test helper

The tests need a full schema (matches + games + cards + match_locks). Add a shared test helper file — but since Go test files in the same package can share symbols, define the helper in the test file itself:

```go
// matchTestDB creates an in-memory SQLite DB with all tables needed by MatchService.
func matchTestDB(t *testing.T) *sql.DB {
	t.Helper()
	db, err := sql.Open("sqlite", ":memory:")
	if err != nil {
		t.Fatalf("open db: %v", err)
	}

	schemas := []string{
		`CREATE TABLE matches (
			id TEXT PRIMARY KEY, title TEXT NOT NULL, scheduled_date TEXT NOT NULL,
			status TEXT NOT NULL DEFAULT 'unstarted', current_game INTEGER NOT NULL DEFAULT 1,
			team1_p1_name TEXT NOT NULL, team1_p2_name TEXT,
			team2_p1_name TEXT NOT NULL, team2_p2_name TEXT,
			best_of INTEGER NOT NULL DEFAULT 5,
			created_at TEXT DEFAULT CURRENT_TIMESTAMP, updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
			state_json TEXT, table_number INTEGER, remarks TEXT
		)`,
		`CREATE TABLE games (
			id TEXT PRIMARY KEY,
			match_id TEXT NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
			game_number INTEGER NOT NULL,
			team1_score INTEGER NOT NULL DEFAULT 0, team2_score INTEGER NOT NULL DEFAULT 0,
			status TEXT NOT NULL DEFAULT 'in_progress',
			created_at TEXT DEFAULT CURRENT_TIMESTAMP, updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
			UNIQUE(match_id, game_number)
		)`,
		`CREATE TABLE cards (
			id TEXT PRIMARY KEY,
			match_id TEXT NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
			game_id TEXT REFERENCES games(id) ON DELETE CASCADE,
			team_index INTEGER NOT NULL, player_index INTEGER NOT NULL,
			card_type TEXT NOT NULL, reason TEXT,
			created_at TEXT DEFAULT CURRENT_TIMESTAMP
		)`,
		`CREATE TABLE match_locks (
			match_id TEXT PRIMARY KEY, session_id TEXT NOT NULL,
			last_sync TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
		)`,
	}
	for _, schema := range schemas {
		if _, err := db.Exec(schema); err != nil {
			t.Fatalf("create table: %v", err)
		}
	}

	_, err = db.Exec(`INSERT INTO matches (id, title, scheduled_date, team1_p1_name, team2_p1_name)
		VALUES ('match-1', 'Test Match', '2026-04-03', 'Alice', 'Bob')`)
	if err != nil {
		t.Fatalf("insert match: %v", err)
	}

	return db
}

func newTestMatchService(t *testing.T, db *sql.DB) *MatchService {
	t.Helper()
	return NewMatchService(store.New(db), db)
}
```

#### RED — Write failing tests

Create `backend/internal/service/match_lock_test.go` with the imports, helper above, then these tests:

```go
func TestSyncMatch_AcquiresLockOnStarting(t *testing.T) {
	db := matchTestDB(t)
	defer db.Close()
	svc := newTestMatchService(t, db)

	req := SyncMatchRequest{
		MatchID:     "match-1",
		Status:      "starting",
		CurrentGame: 1,
		Game:        SyncGameRequest{GameNumber: 1, Team1Score: 0, Team2Score: 0, Status: "in_progress"},
		Cards:       []SyncCardRequest{},
	}

	err := svc.SyncMatch(t.Context(), "session-A", req)
	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}

	lockSvc := NewLockService(store.New(db))
	locked, err := lockSvc.IsLockedBy("match-1", "session-A")
	if err != nil {
		t.Fatalf("IsLockedBy: %v", err)
	}
	if !locked {
		t.Fatal("expected lock to be acquired by session-A")
	}
}
```

#### Verify RED

Run: `cd backend && go test ./internal/service/ -run TestSyncMatch_AcquiresLockOnStarting -v`

Expected: **Compilation error** — `SyncMatch` takes 2 arguments, called with 3:

```
too many arguments in call to svc.SyncMatch
```

Do NOT proceed until you see this exact error.

#### GREEN — Change `SyncMatch` signature and add lock logic

In `backend/internal/service/match_svc.go`, change the signature from:

```go
func (s *MatchService) SyncMatch(ctx context.Context, req SyncMatchRequest) error {
```

to:

```go
func (s *MatchService) SyncMatch(ctx context.Context, sessionID string, req SyncMatchRequest) error {
```

Then insert lock orchestration after `qtx := store.New(tx)` and before the existing `UpdateMatchStatus` call:

```go
	// --- Lock orchestration ---
	lockSvc := NewLockService(qtx)
	_ = lockSvc.Prune()

	isLocked, lockErr := lockSvc.IsLockedBy(req.MatchID, sessionID)
	if lockErr != nil {
		return lockErr
	}

	if isLocked {
		_ = lockSvc.Touch(req.MatchID, sessionID)
	} else {
		if req.Status == "starting" || req.Status == "warming_up" || req.Status == "in_progress" {
			if err := lockSvc.Acquire(req.MatchID, sessionID); err != nil {
				return err
			}
		}
	}
	// --- End lock orchestration ---
```

Also add lock release before `tx.Commit()`:

```go
	if req.Status == "completed" {
		_ = lockSvc.Release(req.MatchID)
	}

	return tx.Commit()
```

#### Verify GREEN

Run: `cd backend && go test ./internal/service/ -run TestSyncMatch_AcquiresLockOnStarting -v`

Expected: PASS.

#### REFACTOR

No refactoring needed yet.

---

#### RED — Test: different session rejected

Add to `match_lock_test.go`:

```go
func TestSyncMatch_RejectsDifferentSession(t *testing.T) {
	db := matchTestDB(t)
	defer db.Close()
	svc := newTestMatchService(t, db)

	req := SyncMatchRequest{
		MatchID:     "match-1",
		Status:      "starting",
		CurrentGame: 1,
		Game:        SyncGameRequest{GameNumber: 1, Team1Score: 0, Team2Score: 0, Status: "in_progress"},
		Cards:       []SyncCardRequest{},
	}
	err := svc.SyncMatch(t.Context(), "session-A", req)
	if err != nil {
		t.Fatalf("first sync: %v", err)
	}

	err = svc.SyncMatch(t.Context(), "session-B", req)
	if err != ErrMatchLocked {
		t.Fatalf("expected ErrMatchLocked, got %v", err)
	}
}
```

#### Verify RED

Run: `cd backend && go test ./internal/service/ -run TestSyncMatch_RejectsDifferentSession -v`

Expected: PASS — this should already pass from the lock orchestration in the previous GREEN step. If it does, that's fine — the lock logic is already in place.

If it FAILS, debug before proceeding.

---

#### RED — Test: same session can continue

```go
func TestSyncMatch_OwnSessionCanContinue(t *testing.T) {
	db := matchTestDB(t)
	defer db.Close()
	svc := newTestMatchService(t, db)

	req := SyncMatchRequest{
		MatchID:     "match-1",
		Status:      "starting",
		CurrentGame: 1,
		Game:        SyncGameRequest{GameNumber: 1, Team1Score: 0, Team2Score: 0, Status: "in_progress"},
		Cards:       []SyncCardRequest{},
	}
	err := svc.SyncMatch(t.Context(), "session-A", req)
	if err != nil {
		t.Fatalf("first sync: %v", err)
	}

	req.Status = "in_progress"
	req.Game.Team1Score = 1
	err = svc.SyncMatch(t.Context(), "session-A", req)
	if err != nil {
		t.Fatalf("second sync from same session: %v", err)
	}
}
```

#### Verify RED → GREEN (should pass immediately)

Run: `cd backend && go test ./internal/service/ -run TestSyncMatch_OwnSessionCanContinue -v`

---

#### RED — Test: lock released on completion

```go
func TestSyncMatch_ReleasesLockOnCompleted(t *testing.T) {
	db := matchTestDB(t)
	defer db.Close()
	svc := newTestMatchService(t, db)

	req := SyncMatchRequest{
		MatchID:     "match-1",
		Status:      "in_progress",
		CurrentGame: 1,
		Game:        SyncGameRequest{GameNumber: 1, Team1Score: 11, Team2Score: 5, Status: "completed"},
		Cards:       []SyncCardRequest{},
	}
	err := svc.SyncMatch(t.Context(), "session-A", req)
	if err != nil {
		t.Fatalf("sync: %v", err)
	}

	// Complete the match
	req.Status = "completed"
	err = svc.SyncMatch(t.Context(), "session-A", req)
	if err != nil {
		t.Fatalf("complete sync: %v", err)
	}

	lockSvc := NewLockService(store.New(db))
	locked, _ := lockSvc.IsLockedBy("match-1", "session-A")
	if locked {
		t.Fatal("expected lock to be released after completion")
	}
}
```

#### Verify RED → GREEN (should pass immediately)

Run: `cd backend && go test ./internal/service/ -run TestSyncMatch_ReleasesLockOnCompleted -v`

#### Run ALL SyncMatch tests

Run: `cd backend && go test ./internal/service/ -run TestSyncMatch -v`
Expected: All 4 PASS.

#### Commit

```bash
git add backend/internal/service/match_svc.go backend/internal/service/match_lock_test.go
git commit -m "feat: integrate lock into SyncMatch with tests"
```

---

### Task 5: Backend — `GetTodayMatches` lock filtering (Scenario 1: full TDD cycle)

**TDD scenario:** Scenario 1 — modifying untested code. Write failing tests for lock filtering, then implement.

**Files:**
- Create: `backend/internal/service/match_lock_list_test.go`
- Modify: `backend/internal/service/match_svc.go`

#### RED — Write failing tests

Create `backend/internal/service/match_lock_list_test.go`. Reuses `matchTestDB` and `newTestMatchService` from Task 4 (same package).

```go
package service

import (
	"testing"

	"umpire-backend/internal/store"
)

func TestGetTodayMatches_FiltersLockedByOthers(t *testing.T) {
	db := matchTestDB(t)
	defer db.Close()
	svc := newTestMatchService(t, db)

	_, err := db.Exec(`INSERT INTO matches (id, title, scheduled_date, team1_p1_name, team2_p1_name)
		VALUES ('match-2', 'Test Match 2', '2026-04-03', 'Carol', 'Dave')`)
	if err != nil {
		t.Fatalf("insert match-2: %v", err)
	}

	lockSvc := NewLockService(store.New(db))
	lockSvc.Acquire("match-1", "session-A")

	matches, err := svc.GetTodayMatches(t.Context(), "session-B", false)
	if err != nil {
		t.Fatalf("GetTodayMatches: %v", err)
	}

	for _, m := range matches {
		if m.ID == "match-1" {
			t.Fatal("match-1 should be filtered out for session-B")
		}
	}

	found := false
	for _, m := range matches {
		if m.ID == "match-2" {
			found = true
		}
	}
	if !found {
		t.Fatal("match-2 should be present")
	}
}

func TestGetTodayMatches_OwnLockVisible(t *testing.T) {
	db := matchTestDB(t)
	defer db.Close()
	svc := newTestMatchService(t, db)

	lockSvc := NewLockService(store.New(db))
	lockSvc.Acquire("match-1", "session-A")

	matches, err := svc.GetTodayMatches(t.Context(), "session-A", false)
	if err != nil {
		t.Fatalf("GetTodayMatches: %v", err)
	}

	found := false
	for _, m := range matches {
		if m.ID == "match-1" {
			found = true
		}
	}
	if !found {
		t.Fatal("match-1 should be visible to session-A (lock owner)")
	}
}

func TestGetTodayMatches_HistoryIncludesAll(t *testing.T) {
	db := matchTestDB(t)
	defer db.Close()
	svc := newTestMatchService(t, db)

	lockSvc := NewLockService(store.New(db))
	lockSvc.Acquire("match-1", "session-A")

	matches, err := svc.GetTodayMatches(t.Context(), "session-B", true)
	if err != nil {
		t.Fatalf("GetTodayMatches: %v", err)
	}

	if len(matches) == 0 {
		t.Fatal("history mode should return matches regardless of locks")
	}
}
```

#### Verify RED

Run: `cd backend && go test ./internal/service/ -run TestGetTodayMatches -v`

Expected: **Compilation error** — `GetTodayMatches` takes 2 arguments, called with 3:

```
too many arguments in call to svc.GetTodayMatches
```

#### GREEN — Modify `GetTodayMatches`

Change signature from:

```go
func (s *MatchService) GetTodayMatches(ctx context.Context, history bool) ([]Match, error) {
```

to:

```go
func (s *MatchService) GetTodayMatches(ctx context.Context, sessionID string, history bool) ([]Match, error) {
```

Then add lock filtering **after** the `results` slice is fully built, **before** the `if results == nil` check at the end:

```go
	// Lock filtering: non-history mode, exclude matches locked by other sessions
	if !history && sessionID != "" {
		lockSvc := NewLockService(s.store)
		_ = lockSvc.Prune()

		var filtered []Match
		for _, m := range results {
			isLockedByOther := false
			if lock, err := lockSvc.store.GetMatchLock(ctx, m.ID); err == nil {
				if lock.SessionID != sessionID {
					isLockedByOther = true
				}
			}
			if !isLockedByOther {
				filtered = append(filtered, m)
			}
		}
		results = filtered
	}
```

#### Verify GREEN

Run: `cd backend && go test ./internal/service/ -run TestGetTodayMatches -v`
Expected: All 3 PASS.

#### Run ALL backend tests

Run: `cd backend && go test ./internal/service/ -v`
Expected: All PASS (lock_svc: 10 + match_lock: 4 + match_lock_list: 3 = 17 tests).

#### Commit

```bash
git add backend/internal/service/match_svc.go backend/internal/service/match_lock_list_test.go
git commit -m "feat: filter locked matches in GetTodayMatches with tests"
```

---

### Task 6: Backend — `AdminUpdateMatch` lock release (Scenario 1: full TDD cycle)

**TDD scenario:** Scenario 1 — modifying untested code (AdminUpdateMatch has no tests). Write failing test, then implement.

**Files:**
- Modify: `backend/internal/service/match_lock_test.go`
- Modify: `backend/internal/service/match_svc.go`

#### RED — Write failing test

Add to `backend/internal/service/match_lock_test.go`:

```go
func TestAdminUpdateMatch_ReleasesLockOnReset(t *testing.T) {
	db := matchTestDB(t)
	defer db.Close()
	svc := newTestMatchService(t, db)

	lockSvc := NewLockService(store.New(db))
	lockSvc.Acquire("match-1", "session-A")

	err := svc.AdminUpdateMatch(t.Context(), "match-1", AdminMatchUpdateRequest{
		Status:  "unstarted",
		Remarks: "",
		Games: []SyncGameRequest{
			{GameNumber: 1, Team1Score: 0, Team2Score: 0, Status: "unstarted"},
		},
		Cards: []SyncCardRequest{},
	})
	if err != nil {
		t.Fatalf("AdminUpdateMatch: %v", err)
	}

	locked, _ := lockSvc.IsLockedBy("match-1", "session-A")
	if locked {
		t.Fatal("expected lock to be released when admin resets match to unstarted")
	}
}
```

#### Verify RED

Run: `cd backend && go test ./internal/service/ -run TestAdminUpdateMatch_ReleasesLockOnReset -v`

Expected: **PASS but t.Fatal fires** — the test runs without compilation error but the assertion fails because the lock still exists:

```
match_lock_test.go:XX: expected lock to be released when admin resets match to unstarted
```

This confirms the feature is missing (not a compilation error). The test correctly exercises the desired behavior.

#### GREEN — Add lock release to `AdminUpdateMatch`

In `backend/internal/service/match_svc.go`, inside `AdminUpdateMatch`, after the `qtx.AdminUpdateMatch(...)` call and before the games/cards clearing, add:

```go
	// Release lock if admin resets match to unstarted
	if req.Status == "unstarted" {
		_ = qtx.ReleaseMatchLock(ctx, matchID)
	}
```

#### Verify GREEN

Run: `cd backend && go test ./internal/service/ -run TestAdminUpdateMatch_ReleasesLockOnReset -v`
Expected: PASS.

#### Run ALL backend tests

Run: `cd backend && go test ./internal/service/ -v`
Expected: All 18 tests PASS.

#### Commit

```bash
git add backend/internal/service/match_svc.go backend/internal/service/match_lock_test.go
git commit -m "feat: release lock on admin match reset with test"
```

---

### Task 7: Backend — API handlers and CORS (Scenario 1: handler tests)

**TDD scenario:** Scenario 1 — handlers have no existing tests. The 409 error mapping is new behavior. Write a failing handler test first, then implement.

**Files:**
- Create: `backend/internal/api/handlers_test.go`
- Modify: `backend/internal/api/handlers.go`
- Modify: `backend/cmd/server/main.go`

#### RED — Write failing handler test

Create `backend/internal/api/handlers_test.go`:

```go
package api

import (
	"database/sql"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"umpire-backend/internal/service"
	"umpire-backend/internal/store"

	_ "modernc.org/sqlite"
)

func openTestDBForHandlers(t *testing.T) *sql.DB {
	t.Helper()
	db, err := sql.Open("sqlite", ":memory:")
	if err != nil {
		t.Fatalf("open db: %v", err)
	}
	schemas := []string{
		`CREATE TABLE matches (
			id TEXT PRIMARY KEY, title TEXT NOT NULL, scheduled_date TEXT NOT NULL,
			status TEXT NOT NULL DEFAULT 'unstarted', current_game INTEGER NOT NULL DEFAULT 1,
			team1_p1_name TEXT NOT NULL, team1_p2_name TEXT,
			team2_p1_name TEXT NOT NULL, team2_p2_name TEXT,
			best_of INTEGER NOT NULL DEFAULT 5,
			created_at TEXT DEFAULT CURRENT_TIMESTAMP, updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
			state_json TEXT, table_number INTEGER, remarks TEXT
		)`,
		`CREATE TABLE games (
			id TEXT PRIMARY KEY,
			match_id TEXT NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
			game_number INTEGER NOT NULL,
			team1_score INTEGER NOT NULL DEFAULT 0, team2_score INTEGER NOT NULL DEFAULT 0,
			status TEXT NOT NULL DEFAULT 'in_progress',
			created_at TEXT DEFAULT CURRENT_TIMESTAMP, updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
			UNIQUE(match_id, game_number)
		)`,
		`CREATE TABLE cards (
			id TEXT PRIMARY KEY,
			match_id TEXT NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
			game_id TEXT REFERENCES games(id) ON DELETE CASCADE,
			team_index INTEGER NOT NULL, player_index INTEGER NOT NULL,
			card_type TEXT NOT NULL, reason TEXT,
			created_at TEXT DEFAULT CURRENT_TIMESTAMP
		)`,
		`CREATE TABLE match_locks (
			match_id TEXT PRIMARY KEY, session_id TEXT NOT NULL,
			last_sync TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
		)`,
	}
	for _, schema := range schemas {
		if _, err := db.Exec(schema); err != nil {
			t.Fatalf("create table: %v", err)
		}
	}
	_, err = db.Exec(`INSERT INTO matches (id, title, scheduled_date, team1_p1_name, team2_p1_name)
		VALUES ('match-1', 'Test', '2026-04-03', 'Alice', 'Bob')`)
	if err != nil {
		t.Fatalf("insert match: %v", err)
	}
	return db
}

func TestHandleSyncMatch_Returns409OnLockConflict(t *testing.T) {
	db := openTestDBForHandlers(t)
	defer db.Close()
	svc := service.NewMatchService(store.New(db), db)
	authSvc := service.NewAuthService()
	h := NewAPIHandler(svc, authSvc)

	body := `{"matchId":"match-1","status":"starting","currentGame":1,"game":{"gameNumber":1,"team1Score":0,"team2Score":0,"status":"in_progress"},"cards":[]}`

	// First request acquires lock
	req1 := httptest.NewRequest("PUT", "/api/matches/match-1/sync", strings.NewReader(body))
	req1.Header.Set("X-Session-ID", "session-A")
	req1.Header.Set("Content-Type", "application/json")
	w1 := httptest.NewRecorder()
	h.handleSyncMatch(w1, req1)
	if w1.Code != http.StatusNoContent {
		t.Fatalf("first sync: expected 204, got %d", w1.Code)
	}

	// Second request from different session gets 409
	req2 := httptest.NewRequest("PUT", "/api/matches/match-1/sync", strings.NewReader(body))
	req2.Header.Set("X-Session-ID", "session-B")
	req2.Header.Set("Content-Type", "application/json")
	w2 := httptest.NewRecorder()
	h.handleSyncMatch(w2, req2)

	if w2.Code != http.StatusConflict {
		t.Fatalf("expected 409 Conflict, got %d: %s", w2.Code, w2.Body.String())
	}
}

func TestHandleGetMatches_FiltersLockedMatches(t *testing.T) {
	db := openTestDBForHandlers(t)
	defer db.Close()
	svc := service.NewMatchService(store.New(db), db)
	authSvc := service.NewAuthService()
	h := NewAPIHandler(svc, authSvc)

	// Acquire lock on match-1
	lockSvc := service.NewLockService(store.New(db))
	lockSvc.Acquire("match-1", "session-A")

	// session-B should not see match-1
	req := httptest.NewRequest("GET", "/api/matches", nil)
	req.Header.Set("X-Session-ID", "session-B")
	w := httptest.NewRecorder()
	h.handleGetMatches(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", w.Code)
	}

	var matches []map[string]interface{}
	json.Unmarshal(w.Body.Bytes(), &matches)
	for _, m := range matches {
		if m["id"] == "match-1" {
			t.Fatal("match-1 should be filtered out for session-B")
		}
	}
}
```

#### Verify RED

Run: `cd backend && go test ./internal/api/ -run "TestHandle" -v`

Expected: **Compilation error** — `handleSyncMatch` doesn't pass `sessionID` to `SyncMatch`, so it calls `SyncMatch(ctx, req)` with 2 args instead of 3:

```
not enough arguments in call to h.svc.SyncMatch
```

#### GREEN — Update handlers

Replace `handleSyncMatch`:

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

Replace `handleGetMatches`:

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

Add `X-Session-ID` to CORS in `backend/cmd/server/main.go`:

```go
AllowedHeaders: []string{"Accept", "Authorization", "Content-Type", "X-CSRF-Token", "X-Session-ID"},
```

#### Verify GREEN

Run: `cd backend && go test ./internal/api/ -run "TestHandle" -v`
Expected: Both PASS.

#### Run ALL backend tests

Run: `cd backend && go test ./... -v`
Expected: All PASS (service: 18 + api: 2 = 20 tests).

#### Commit

```bash
git add backend/internal/api/handlers.go backend/internal/api/handlers_test.go backend/cmd/server/main.go
git commit -m "feat: extract X-Session-ID in handlers, return 409, add to CORS with tests"
```

---

### Task 8: Frontend — session ID generation (Scenario 1: full TDD cycle)

**TDD scenario:** Scenario 1 — new module. Extract `getOrCreateSessionId` to its own file so it's importable and testable. Test first.

**Files:**
- Create: `frontend/src/lib/sessionId.js`
- Create: `frontend/src/lib/__tests__/sessionId.test.js`
- Modify: `frontend/src/main.js`

#### RED — Write failing test

Create `frontend/src/lib/__tests__/sessionId.test.js`:

```js
import { describe, it, expect, beforeEach } from 'vitest'
import { getOrCreateSessionId } from '../sessionId'

describe('getOrCreateSessionId', () => {
  beforeEach(() => {
    sessionStorage.clear()
  })

  it('creates a new UUID and stores it in sessionStorage', () => {
    const id = getOrCreateSessionId()

    expect(id).toBeDefined()
    expect(id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    )
    expect(sessionStorage.getItem('umpire-session-id')).toBe(id)
  })

  it('returns the same UUID on subsequent calls', () => {
    const first = getOrCreateSessionId()
    const second = getOrCreateSessionId()
    expect(first).toBe(second)
  })

  it('generates different UUIDs across cleared sessions', () => {
    const first = getOrCreateSessionId()
    sessionStorage.clear()
    const second = getOrCreateSessionId()
    expect(first).not.toBe(second)
  })
})
```

#### Verify RED

Run: `cd frontend && npx vitest run src/lib/__tests__/sessionId.test.js`

Expected: **FAIL** — module `../sessionId` not found:

```
Error: Cannot find module ../sessionId
```

#### GREEN — Implement `sessionId.js`

Create `frontend/src/lib/sessionId.js`:

```js
export function getOrCreateSessionId() {
  let id = sessionStorage.getItem('umpire-session-id')
  if (!id) {
    id = crypto.randomUUID()
    sessionStorage.setItem('umpire-session-id', id)
  }
  return id
}
```

#### Verify GREEN

Run: `cd frontend && npx vitest run src/lib/__tests__/sessionId.test.js`
Expected: All 3 PASS.

#### Wire into `main.js`

In `frontend/src/main.js`, add before `createApp`:

```js
import { getOrCreateSessionId } from './lib/sessionId'
window.__umpireSessionId = getOrCreateSessionId()
```

#### Run ALL frontend tests

Run: `cd frontend && npm test`
Expected: All PASS (existing + 3 new).

#### Commit

```bash
git add frontend/src/lib/sessionId.js frontend/src/lib/__tests__/sessionId.test.js frontend/src/main.js
git commit -m "feat: extract getOrCreateSessionId to module with tests"
```

---

### Task 9: Frontend — `syncMatch` sends header and handles 409 (Scenario 1: full TDD cycle)

**TDD scenario:** Scenario 1 — modifying untested code. The 409 handling and `X-Session-ID` header are new behavior. Write failing tests first.

**Files:**
- Create: `frontend/src/stores/__tests__/matchStore.lock.test.js`
- Modify: `frontend/src/stores/matchStore.js`

#### RED — Write failing tests

Create `frontend/src/stores/__tests__/matchStore.lock.test.js`:

```js
import { setActivePinia, createPinia } from 'pinia'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useMatchStore } from '../matchStore'

beforeAll(() => {
  window.__umpireSessionId = 'test-session-123'
})

afterAll(() => {
  delete window.__umpireSessionId
})

function makeStoreWithMatch() {
  const store = useMatchStore()
  store.currentMatch = {
    id: 'match-1',
    bestOf: 5,
    type: 'singles',
    team1: [{ name: 'Alice', country: 'SG' }],
    team2: [{ name: 'Bob', country: 'SG' }],
  }
  store.matchStatus = 'in_progress'
  store.p1Score = 1
  store.p2Score = 0
  store.game = 1
  store.isStarted = true
  return store
}

describe('matchStore - syncMatch sends X-Session-ID header', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.restoreAllMocks()
  })

  it('includes X-Session-ID in the sync request headers', async () => {
    const store = makeStoreWithMatch()
    global.fetch = vi.fn().mockResolvedValue({ ok: true, status: 204 })

    await store.syncMatch()

    expect(global.fetch).toHaveBeenCalledWith(
      '/api/matches/match-1/sync',
      expect.objectContaining({
        headers: expect.objectContaining({
          'X-Session-ID': 'test-session-123',
          'Content-Type': 'application/json',
        }),
      }),
    )
    expect(store.syncStatus).toBe('synced')
  })
})

describe('matchStore - syncMatch handles 409 Conflict', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.restoreAllMocks()
  })

  it('alerts and redirects on 409', async () => {
    const store = makeStoreWithMatch()
    global.fetch = vi.fn().mockResolvedValue({ ok: false, status: 409 })
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {})
    const pushMock = vi.fn()
    store.$router = { push: pushMock }

    await store.syncMatch()

    expect(alertSpy).toHaveBeenCalledWith('This match is being umpired on another device.')
    expect(pushMock).toHaveBeenCalledWith('/')
    expect(store.syncStatus).toBe('error')
  })

  it('sets error status for non-409 server errors', async () => {
    const store = makeStoreWithMatch()
    global.fetch = vi.fn().mockResolvedValue({ ok: false, status: 500 })

    await store.syncMatch()

    expect(store.syncStatus).toBe('error')
  })
})

describe('matchStore - fetchMatchState sends X-Session-ID header', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.restoreAllMocks()
  })

  it('includes X-Session-ID in the fetchMatchState request', async () => {
    const store = useMatchStore()
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          match: {
            id: 'match-1',
            status: 'in_progress',
            bestOf: 5,
            type: 'singles',
            team1: [{ name: 'Alice', country: 'SG' }],
            team2: [{ name: 'Bob', country: 'SG' }],
          },
          games: [{ gameNumber: 1, team1Score: 1, team2Score: 0, status: 'in_progress' }],
          cards: [],
        }),
    })

    await store.fetchMatchState('match-1')

    expect(global.fetch).toHaveBeenCalledWith(
      '/api/matches/match-1',
      expect.objectContaining({
        headers: expect.objectContaining({
          'X-Session-ID': 'test-session-123',
        }),
      }),
    )
  })
})
```

#### Verify RED

Run: `cd frontend && npx vitest run src/stores/__tests__/matchStore.lock.test.js`

Expected: **FAIL** — The `syncMatch` fetch call doesn't include `X-Session-ID` header:

```
Expected: "X-Session-ID": "test-session-123"
Received: headers did not contain key "X-Session-ID"
```

#### GREEN — Update `syncMatch` in `matchStore.js`

In the `syncMatch` action, change the fetch call's headers to include `X-Session-ID` and add 409 handling:

```js
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
```

#### GREEN — Update `fetchMatchState` in `matchStore.js`

Change the fetch call to include headers:

```js
    const resp = await fetch(`/api/matches/${id}`, {
      credentials: 'include',
      headers: {
        'X-Session-ID': window.__umpireSessionId,
      },
    })
```

#### Verify GREEN

Run: `cd frontend && npx vitest run src/stores/__tests__/matchStore.lock.test.js`
Expected: All 4 PASS.

#### Run ALL frontend tests

Run: `cd frontend && npm test`
Expected: All PASS (existing + session ID + lock handling).

#### Commit

```bash
git add frontend/src/stores/__tests__/matchStore.lock.test.js frontend/src/stores/matchStore.js
git commit -m "feat: send X-Session-ID header, handle 409 on sync with tests"
```

---

### Task 10: Frontend — add header to remaining fetch calls (Scenario 2: verify after)

**TDD scenario:** Scenario 2 — no logic change, just adding a header to `adminStore.js` fetch calls. Run existing tests after.

**Files:**
- Modify: `frontend/src/stores/adminStore.js`

**Step 1: Audit all fetch calls**

Run: `cd frontend && grep -rn "fetch(" src/ --include="*.js" --include="*.vue"`

**Step 2: Add `X-Session-ID` header to `adminStore.js`**

For `fetchMatches` and `deleteMatch` that hit `/api/matches`, add:

```js
headers: {
  'X-Session-ID': window.__umpireSessionId,
},
```

**Step 3: Verify build and tests**

Run: `cd frontend && npm run build && npm test`
Expected: Build succeeds, all tests pass.

**Step 4: Commit (if any changes)**

```bash
git add frontend/
git commit -m "feat: add X-Session-ID to admin match API calls"
```

---

### Task 11: Full test suite verification + E2E smoke test

**TDD scenario:** Verification only.

**Files:** None

**Step 1: Run all backend tests**

Run: `cd backend && go test ./... -v`
Expected: All PASS — service (18) + api (2) = 20 tests, pristine output.

**Step 2: Run all frontend tests**

Run: `cd frontend && npm test`
Expected: All PASS — existing tests + session ID (3) + lock handling (4), pristine output.

**Step 3: E2E — two browser tabs**

```bash
# Terminal 1
cd backend && go run ./cmd/server

# Terminal 2
cd frontend && npm run dev
```

- Log in with same account in two tabs.
- Tab A: select a match and start scoring.
- Tab B: verify the selected match disappears from the list.
- Tab B: try navigating directly to `/match/{id}` — verify 409 alert redirects to `/`.
- Tab A: complete the match.
- Tab B: verify match appears in history.

**Step 4: E2E — lock expiry**

- Tab A: start a match, then stop interacting for 30+ seconds.
- Tab B: refresh the list — match should reappear.
- Tab B: select and sync — should succeed.

---

## TDD Verification Checklist

- [ ] Every new function/method has a test (`LockService`, session ID module)
- [ ] Watched each test fail for the correct reason (feature missing, not typo)
- [ ] Wrote minimal code to pass each test
- [ ] All 20 backend tests pass
- [ ] All frontend tests pass (existing + 7 new)
- [ ] Output pristine (no errors, no warnings)
- [ ] Edge cases covered: expiry takeover, same-session continue, release on complete, admin reset
- [ ] Handler tests verify 409 response and match filtering at HTTP layer
