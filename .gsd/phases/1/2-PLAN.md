---
phase: 1
plan: 2
wave: 1
---

# Plan 1.2: Core APIs Read and Create Matches

## Objective
Update the `GET /api/matches` and `POST /api/match` routes in the backend to interact with the SQLite database.

## Context
- .gsd/ROADMAP.md
- backend/main.go

## Tasks

<task type="auto">
  <name>Implement POST /api/matches</name>
  <files>
    - backend/main.go
    - backend/go.mod
  </files>
  <action>
    - Run `cd backend && go get github.com/google/uuid` to generate match IDs.
    - Note `saveMatch` is exported on `/api/match` endpoint in `mux.HandleFunc`. Let's rename the function to `createMatch`.
    - Implement `createMatch` to parse a POST body mapping to a match structure.
    - Generate a pseudo-random UUID for the match ID.
    - Set default values: `status='unstarted'`, `teamX_games_won=0`, `scheduled_date=time.Now()`.
    - Insert a new row into the `matches` table mapping `Team1` and `Team2` slices into the flat columns (`team1_p1_name`, `team1_p2_name` etc).
    - Return the generated ID to the client as JSON `{ "id": "<uuid>" }`.
  </action>
  <verify>cd backend && go build</verify>
  <done>createMatch endpoint successfully inserts into DB and returns ID.</done>
</task>

<task type="auto">
  <name>Implement GET /api/matches</name>
  <files>
    - backend/main.go
  </files>
  <action>
    - Replace the hardcoded data in `getMatches` to SELECT from the `matches` table.
    - Fetch matches where `status='unstarted'`.
    - The returned JSON from `getMatches` must match the current frontend expectations (using the `Match` struct with `Team1 []Player`, `Team2 []Player`).
    - Specifically, populate `Match.Team1` and `Match.Team2` correctly. If `p2_name` is empty/null, omit it.
    - Construct the JSON payload and return it.
  </action>
  <verify>cd backend && go build</verify>
  <done>getMatches retrieves unstarted matches from the database instead of hardcoded data.</done>
</task>

## Success Criteria
- [ ] POST `/api/match` inserts records to SQLite.
- [ ] GET `/api/matches` reads records from SQLite and correctly constructs the `[]Player` layout required by the frontend.
