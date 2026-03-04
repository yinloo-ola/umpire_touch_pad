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
