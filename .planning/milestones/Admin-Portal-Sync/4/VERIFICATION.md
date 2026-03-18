## Phase 4 Verification

### Must-Haves
- [x] Selection Sync: `matchStatus` becomes `'starting'` and syncs on match selection.
- [x] Warmup Sync: `matchStatus` becomes `'warming_up'` and syncs on warmup start.
- [x] In-Progress Sync: `matchStatus` becomes `'in_progress'` and syncs on "Start Match".
- [x] Completion Sync: `matchStatus` becomes `'completed'` and syncs on final confirmation.

### Verdict: PASS

### Evidence
- **matchStore.js**: Added `matchStatus` state and transition logic in `selectMatch`, `startTimer`, `startMatch`, and `confirmMatchComplete`.
- **SetupView.vue**: Call `matchStore.startMatch()` in `proceedToMatch`.
- **syncMatch**: Modified to send `this.matchStatus` instead of hardcoded derived status.
