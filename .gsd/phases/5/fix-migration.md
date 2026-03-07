---
phase: 5
plan: fix-backend-migration
wave: 1
gap_closure: true
---

# Fix Plan: Apply Backend Migrations

## Problem
The backend SQL schema update containing `00005_add_match_state_json.sql` was not applied because the `make dev` process has been running continuously without a restart since before the phase began. As a result, the `state_json` column does not exist on the `matches` table, preventing match data synchronization and queries from functioning correctly.

## Tasks

<task type="auto">
  <name>Restart Backend to Apply Migrations</name>
  <files>N/A</files>
  <action>Instruct the user to manually restart their `make dev` terminal process, or run the migration manually if an external tool is used. Once restarted, standard `go run ./cmd/server` will trigger the `goose` or native SQLite migrations logic automatically on boot.</action>
  <verify>Run `sqlite3 backend/sqlite.db "SELECT state_json FROM matches LIMIT 1"` and assert it returns successfully instead of throwing a 'no such column' error.</verify>
  <done>The database contains the `state_json` column and the backend successfully accepts and returns `state_json` string blobs.</done>
</task>
