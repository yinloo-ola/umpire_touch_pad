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
		VALUES ('match-2', 'Test Match 2', '2026-04-03T12:00:00', 'Carol', 'Dave')`)
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
