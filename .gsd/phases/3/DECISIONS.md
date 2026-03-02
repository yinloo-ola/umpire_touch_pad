## Phase 3 Decisions

**Date:** 2026-03-03

### Scope
- **"Start of Play"**: Timeouts are only allowed when `pointStarted === false`.
- **Concurrency**: 1 timeout per player/pair per match.
- **Timer Behavior**: 
    - 60-second countdown.
    - When 60s is up, the UI stays visible until dismissed by the umpire.
    - Reverting a timeout resets its timer state completely.
    - No overlap with warmup timer (cannot trigger both).

### Approach
- **Chose**: Dedicated Timeout Timer State.
- **Reason**: Using `timeoutTimeLeft` and `timeoutActive` prevents interference with the warmup timer and makes the "Cancel/Reset" logic cleaner and more robust for the Undo system.

### Constraints
- No need to snapshot timeout state into `gameHistory` snapshots since timeouts will not cross game boundaries.
- UI dismissal is manual even after timer reaches 0.
