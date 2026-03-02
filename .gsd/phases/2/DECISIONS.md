## Phase 2 Decisions

**Date:** 2026-03-02

### Scope
- **Carry-over Points**: According to ITTF rules, penalty points DO carry over to the next game if they exceed what is needed to win the current game (e.g., starting the next game at 0-1).
- **Reverting**: Existing `handleScore` logic (`isGameOver = false` on score drop) is sufficient for reverting game-ending points. If a penalty is reverted, the awarded points (and any carried-over points) will be subtracted.

### Approach
- **Chose**: Dedicated Penalty Function / Wrapper (`applyPenaltyPoint`)
- **Reason**: Modifying `handleScore` directly to handle multi-point carry-overs across game boundaries, while bypassing the `pointStarted` guard, would make the core scoring logic highly brittle and difficult to maintain. Creating a dedicated function keeps `handleScore` purely for point-by-point live play, while the penalty logic can explicitly handle the math for game constraints and carry-overs.
- **Implementation**: The `issueCard` function will call this dedicated penalty logic.

### Constraints
- The `pointStarted` guard in `handleScore` prevents scoring between points. The newly isolated penalty function will safely bypass this guard without breaking live scoring guarantees.
