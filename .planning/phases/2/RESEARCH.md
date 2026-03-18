# Phase 2 Research: Admin Match Editing Capabilities

## Context
Phase 2 involves building backend endpoints and an administrative UI page to manually override a match's status, edit game scores, add or delete games, and handle manual force-completions (retirements). 

From `DECISIONS.md`:
- **UI Integration**: Edit capabilities within `MatchDetailView.vue`.
- **Restrictions**: `SCHEDULED` and `COMPLETED` can be edited freely. `IN_PROGRESS` requires a "Force Override" confirmation.
- **Traceability**: A manual change flag / `remarks` field is required for force completions.
- **Backend Approach**: Single Unified "Save Changes" endpoint.
- **Validation**: Strict score validation (e.g., 11-5) required *unless* a valid remark is provided for a forced end/retirement. Deleted middle games must auto re-index remaining games.

## Needed Schema Changes
The `matches` table needs a new column: `remarks TEXT`.
This requires a Goose migration (e.g. `00007_add_remarks.sql`).
We will also need a query in `db/query.sql` to support a full match replacement by an admin, possibly something like `AdminUpdateMatch` or just modifying the existing upsert methods.

## Backend Service Changes
The `MatchService` will need an `AdminUpdateMatch` method. 
It must:
- Accept a full state request (similar to `SyncMatchRequest` but covering the whole matches model).
- Validate scores (unless `remarks` is present and it's a forced completion).
- Re-index the games to ensure `game_number` is sequential (1, 2, 3...) if an admin deleted a middle game.
- Begin a transaction to clear existing games and insert the submitted games, or upsert them while deleting missing ones.

## API Endpoint
`PUT /api/admin/matches/{id}` handled by `APIHandler`.
Protected by `RequireAuth(authSvc, "admin", ...)`.

## Frontend UI Changes
`frontend/src/views/admin/MatchDetailView.vue`:
1. "Edit Match" button toggle.
2. If `status === 'in_progress'`, click "Edit Match" prompts a confirmation modal: "This match is currently live. Force Override?"
3. In Edit Mode:
   - Match Status dropdown.
   - Text boxes for Team 1 and Team 2 scores per game.
   - "Delete" button per game.
   - "Add Game" button.
   - "Remarks (Reason for manual change/retirement)" textarea.
4. "Save Changes" triggers `PUT /api/admin/matches/{id}` and exits edit mode upon success.
