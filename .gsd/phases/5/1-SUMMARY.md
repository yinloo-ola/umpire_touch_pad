# Summary - Plan 5.1: Backend Infrastructure for Resume & History

## Completed Tasks

1.  **Database Migration**: Created `00005_add_match_state_json.sql` to add the `state_json` column to the `matches` table.
2.  **SQL Queries**: Updated `backend/db/query.sql` with new queries:
    *   `GetMatch`: Fetch a single match with its state.
    *   `GetIncompleteMatchesForPeriod`: Support for resume list.
    *   `GetAllMatchesForPeriod`: Support for history list.
    *   `UpdateMatchState`: Persist the full state snapshot.
    *   `GetGamesForMatch` & `GetCardsForMatch`: For full match reconstruction.
3.  **Code Generation**: Installed `sqlc` CLI via Homebrew and ran `sqlc generate` to update the store layer.
4.  **Service Layer**:
    *   Updated `Match` and `MatchService` to handle `StateJson`.
    *   Refactored `GetTodayMatches` to support a `history` toggle.
    *   Implemented `GetMatchState` to reconstruct the complete match state (metadata, games, and cards).
5.  **API Layer**:
    *   Updated `handleGetMatches` to respect the `history` query parameter.
    *   Implemented `handleGetMatchState` for `GET /api/matches/{id}`.
    *   Registered the new route in `SetupRoutes`.

## Verification Results

*   `cd backend && go build ./...` passed successfully.
*   SQL schemas and queries are generated correctly by `sqlc`.
*   Routes are registered and handler logic is in place to support frontend requirements in subsequent plans.

## Next Steps

Proceed to **Plan 5.2: Umpire Match List Refinement (Resume Support)**.
