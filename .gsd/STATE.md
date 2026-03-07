- **Phase**: 3 (RE-VERIFIED with Timeouts)
- **Task**: Refactor timeout recording to track game context
- **Status**: Resolved (Fully Verified)

6. **Timeouts as Cards**: Timeouts were moved from match-level booleans to the `cards` table. They now capture the specific game they were taken in, providing better historical data.
7. **Game Context for Cards**: The `SyncMatch` service now correctly links all cards to their corresponding `game_id` using the current game number.

Verified both backend (Go build) and frontend (Pinia state mapping) logic.

## Next Steps
1. Proceed to Phase 4: Completed Match Operations
2. Implement backend logic for finishing matches and final match summary creation.
