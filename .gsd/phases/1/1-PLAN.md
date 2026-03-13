---
phase: 1
plan: 1
wave: 1
---

# Plan 1.1: Database Schema & Backend APIs for Table Number

## Objective
Introduce the `table_number` field to the database schema, update the Go SQL queries to read and insert it, and update the backend service to handle this property.

## Context
- .gsd/SPEC.md
- backend/db/migrations/00001_initial_schema.sql
- backend/db/query.sql
- backend/internal/service/match_svc.go

## Tasks

<task type="auto">
  <name>Database Migration for Table Number</name>
  <files>
    backend/db/migrations/00006_add_table_number.sql
    backend/db/query.sql
  </files>
  <action>
    - Create a new migration file `00006_add_table_number.sql` via Goose.
    - Write an `ALTER TABLE matches ADD COLUMN table_number INTEGER` statement (Up) and appropriate drop/rollback (Down).
    - Update `backend/db/query.sql` to include `table_number` in SELECTs (`GetMatch`, `GetIncompleteMatchesForPeriod`, `GetAllMatches`) and INSERT (`CreateMatch`).
  </action>
  <verify>make sqlc</verify>
  <done>sqlc generates updated models and queries successfully</done>
</task>

<task type="auto">
  <name>Update Backend Handlers</name>
  <files>
    backend/internal/service/match_svc.go
  </files>
  <action>
    - Ensure that incoming JSON requests for creating a match parse `tableNumber` and pass it to the SQL query.
    - Check the payload mappings where Match representations are converted to/from JSON to include `tableNumber`.
  </action>
  <verify>go test ./...</verify>
  <done>Backend compiles successfully and tableNumber logic is added without errors</done>
</task>

## Success Criteria
- [ ] New go-goose migration exists for adding `table_number`.
- [ ] SQLc model for Match contains `table_number`.
- [ ] Backend handler handles `tableNumber` from requests successfully.
