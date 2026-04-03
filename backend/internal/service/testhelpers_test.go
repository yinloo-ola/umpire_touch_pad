package service

import (
	"database/sql"
	"testing"
	"time"

	"umpire-backend/internal/store"

	_ "modernc.org/sqlite"
)

// testSchemaSQL contains all CREATE TABLE statements needed by tests.
var testSchemaSQL = []string{
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

// openTestDB creates an in-memory SQLite DB with all tables.
func openTestDB(t *testing.T) *sql.DB {
	t.Helper()
	db, err := sql.Open("sqlite", ":memory:")
	if err != nil {
		t.Fatalf("open db: %v", err)
	}
	for _, schema := range testSchemaSQL {
		if _, err := db.Exec(schema); err != nil {
			t.Fatalf("create table: %v", err)
		}
	}
	return db
}

// seedTestMatch inserts a default match-1 for testing, scheduled today.
func seedTestMatch(t *testing.T, db *sql.DB) {
	t.Helper()
	now := time.Now().Format("2006-01-02T15:04:05")
	_, err := db.Exec(`INSERT INTO matches (id, title, scheduled_date, team1_p1_name, team2_p1_name)
		VALUES ('match-1', 'Test Match', ?, 'Alice', 'Bob')`, now)
	if err != nil {
		t.Fatalf("insert match: %v", err)
	}
}

// newTestMatchService creates a MatchService backed by the given DB.
func newTestMatchService(t *testing.T, db *sql.DB) *MatchService {
	t.Helper()
	return NewMatchService(store.New(db), db)
}
