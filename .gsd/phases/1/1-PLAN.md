---
phase: 1
plan: 1
wave: 1
---

# Plan 1.1: Database Initialization & Schema

## Objective
Initialize the SQLite database using a CGO-free driver and execute the schema migrations upon server startup.

## Context
- .gsd/ROADMAP.md
- backend/main.go

## Tasks

<task type="auto">
  <name>Install CGO-free SQLite Driver</name>
  <files>
    - backend/go.mod
    - backend/go.sum
  </files>
  <action>
    - Run `cd backend && go get modernc.org/sqlite`
    - Run `cd backend && go mod tidy`
  </action>
  <verify>grep "modernc.org/sqlite" backend/go.mod</verify>
  <done>The modernc.org/sqlite driver is present in the backend module.</done>
</task>

<task type="auto">
  <name>Init DB and Define Schema</name>
  <files>
    - backend/main.go
  </files>
  <action>
    - Import `database/sql` and `_ "modernc.org/sqlite"`.
    - Create a global `db *sql.DB` variable.
    - Write an `initDB()` function called before starting the server in `main()`.
    - `initDB` should open a connection to `sqlite.db` and execute the schema initialization:
      - `CREATE TABLE IF NOT EXISTS matches (id TEXT PRIMARY KEY, type TEXT, best_of INTEGER, status TEXT, scheduled_date DATETIME, team1_p1_name TEXT, team1_p2_name TEXT, team2_p1_name TEXT, team2_p2_name TEXT, team1_games_won INTEGER, team2_games_won INTEGER)`
      - `CREATE TABLE IF NOT EXISTS games (id INTEGER PRIMARY KEY AUTOINCREMENT, match_id TEXT, game_number INTEGER, team1_score INTEGER, team2_score INTEGER, status TEXT, FOREIGN KEY(match_id) REFERENCES matches(id))`
      - `CREATE TABLE IF NOT EXISTS cards (id INTEGER PRIMARY KEY AUTOINCREMENT, match_id TEXT, team_index INTEGER, recipient TEXT, card_type TEXT, FOREIGN KEY(match_id) REFERENCES matches(id))`
  </action>
  <verify>cd backend && go build -o umpire_backend .</verify>
  <done>backend/main.go builds successfully and creates the sqlite.db file on startup.</done>
</task>

## Success Criteria
- [ ] Database drivers are installed.
- [ ] Database schema is initialized successfully on startup in `sqlite.db`.
