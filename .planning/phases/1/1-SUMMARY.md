# Plan 1.1 Summary: Database Schema & Backend APIs for Table Number

## Accomplishments
- Created migration `00006_add_table_number.sql` to add `table_number` column to `matches` table.
- Updated `backend/db/query.sql` with new `table_number` column in `CreateMatch`, `GetMatch`, `GetIncompleteMatchesForPeriod`, and `GetAllMatches`.
- Generated updated Go code with `sqlc generate`.
- Updated `Match` and `MatchRow` structs in `backend/internal/service/match_svc.go`.
- Updated mapping logic in `CreateMatch`, `GetTodayMatches`, and `GetMatchState` to handle `table_number`.

## Verification Results
- `sqlc generate` succeeded.
- `go test ./...` compiled successfully.
- Database migration file created and matches schema requirements.
