## Phase 3 Decisions

**Date:** 2026-03-05

### Scope
- **Live Sync**: Every score change, game change, and card issuance will trigger a sync to the backend.
- **Finalization**: Formal match finalization (preventing further edits) is deferred to Phase 4.
- **UI Feedback**: A subtle "Sync Status" (cloud icon) will be added to the touchpad to indicate successful persistence.

### Approach
- **Chose**: Snapshot Approach
- **Reason**: More robust than incremental updates; ensures the database is always an exact mirror of the current Pinia state. Self-healing from any intermittent network failures.
- **Error Handling**: Log to console and retry on the next state change (Option B).

### Constraints
- Sync calls must include credentials to pass through the `RequireAuth` middleware.
- Database updates will use a transaction to clear and re-insert cards to maintain stack integrity.

## Phase 5 Decisions

**Date:** 2026-03-07

### Scope
- **Exact Resume**: Umpire touchpad must be able to resume match state exactly (scores, cards, sides, server/receiver, doubles quadrants) after a refresh.
- **Admin Visibility**: Admin Details View must show live score/state for in-progress matches.
- **State Recovery**: Undo history is NOT persisted; only the current instantaneous state is recovered.

### Approach
- **Chose**: Approach B (state_json blob)
- **Reason**: Storing a JSON blob of the volatile state (quadrants, flags, serve logic) in the `matches` table is more efficient and flexible than creating dozens of columns for every minor UI flag. This allows "exact" reconstruction of the Pinia store.

### Constraints
- Timers (warmup/timeout) are not required to resume exactly.

## Phase 1 Decisions

**Date:** 2026-03-13

### Scope
- `table_number` is strictly an integer, avoiding arbitrary string names.
- On the Umpire Match List and Admin Dashboard, the table number will be displayed to the right of the "Event" name column.

### Approach
- **Chose:** Strict Integer for Database and Vue store.
- **Reason:** Simplifies filtering and sorting behavior across lists. Ensures strict schema constraints for data entries.
