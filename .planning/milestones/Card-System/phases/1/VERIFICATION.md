## Phase 1 Verification

### Objective
Update Pinia stores to handle card arrays (stack), ordered issuance limits, and logical ties to the Player/Side entities.

### Must-Haves
- [x] Card constraints: independent tracks for players vs. coaches, granted in specific order, reversed in per-team LIFO order (Timeouts reverted independently) — VERIFIED (evidence: `matchStore.js` implements `issueCard`, `revertLastCard`, `issueTimeout`, `revertTimeout` with the required LIFO arrays and conditional sequence checks. Unit tests confirm isolation between player/coach and timeouts).

### Verdict: PASS
