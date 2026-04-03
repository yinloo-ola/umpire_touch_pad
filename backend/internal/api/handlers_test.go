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
		VALUES ('match-1', 'Test', '2026-04-03T12:00:00', 'Alice', 'Bob')`)
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

	mux := http.NewServeMux()
	mux.HandleFunc("PUT /api/matches/{id}/sync", h.handleSyncMatch)

	body := `{"matchId":"match-1","status":"starting","currentGame":1,"game":{"gameNumber":1,"team1Score":0,"team2Score":0,"status":"in_progress"},"cards":[]}`

	// First request acquires lock
	req1 := httptest.NewRequest("PUT", "/api/matches/match-1/sync", strings.NewReader(body))
	req1.Header.Set("X-Session-ID", "session-A")
	req1.Header.Set("Content-Type", "application/json")
	w1 := httptest.NewRecorder()
	mux.ServeHTTP(w1, req1)
	if w1.Code != http.StatusNoContent {
		t.Fatalf("first sync: expected 204, got %d: %s", w1.Code, w1.Body.String())
	}

	// Second request from different session gets 409
	req2 := httptest.NewRequest("PUT", "/api/matches/match-1/sync", strings.NewReader(body))
	req2.Header.Set("X-Session-ID", "session-B")
	req2.Header.Set("Content-Type", "application/json")
	w2 := httptest.NewRecorder()
	mux.ServeHTTP(w2, req2)

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
	lockSvc.Acquire(t.Context(), "match-1", "session-A")

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
