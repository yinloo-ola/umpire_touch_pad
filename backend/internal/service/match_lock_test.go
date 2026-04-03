package service

import (
	"testing"

	"umpire-backend/internal/store"
)

func TestSyncMatch_AcquiresLockOnStarting(t *testing.T) {
	db := openTestDB(t)
	defer db.Close()
	seedTestMatch(t, db)
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
	locked, err := lockSvc.IsLockedBy(t.Context(), "match-1", "session-A")
	if err != nil {
		t.Fatalf("IsLockedBy: %v", err)
	}
	if !locked {
		t.Fatal("expected lock to be acquired by session-A")
	}
}

func TestSyncMatch_RejectsDifferentSession(t *testing.T) {
	db := openTestDB(t)
	defer db.Close()
	seedTestMatch(t, db)
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

func TestSyncMatch_OwnSessionCanContinue(t *testing.T) {
	db := openTestDB(t)
	defer db.Close()
	seedTestMatch(t, db)
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

func TestSyncMatch_ReleasesLockOnCompleted(t *testing.T) {
	db := openTestDB(t)
	defer db.Close()
	seedTestMatch(t, db)
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
	locked, _ := lockSvc.IsLockedBy(t.Context(), "match-1", "session-A")
	if locked {
		t.Fatal("expected lock to be released after completion")
	}
}

func TestAdminUpdateMatch_ReleasesLockOnReset(t *testing.T) {
	db := openTestDB(t)
	defer db.Close()
	seedTestMatch(t, db)
	svc := newTestMatchService(t, db)

	lockSvc := NewLockService(store.New(db))
	lockSvc.Acquire(t.Context(), "match-1", "session-A")

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

	locked, _ := lockSvc.IsLockedBy(t.Context(), "match-1", "session-A")
	if locked {
		t.Fatal("expected lock to be released when admin resets match to unstarted")
	}
}
