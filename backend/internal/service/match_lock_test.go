package service

import (
	"database/sql"
	"testing"

	"umpire-backend/internal/store"

	_ "modernc.org/sqlite"
)

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
			team1_p1_country TEXT DEFAULT '', team1_p2_country TEXT DEFAULT '',
			team2_p1_country TEXT DEFAULT '', team2_p2_country TEXT DEFAULT '',
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
		VALUES ('match-1', 'Test Match', '2026-04-03T12:00:00', 'Alice', 'Bob')`)
	if err != nil {
		t.Fatalf("insert match: %v", err)
	}

	return db
}

func newTestMatchService(t *testing.T, db *sql.DB) *MatchService {
	t.Helper()
	return NewMatchService(store.New(db), db)
}

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
