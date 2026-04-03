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
