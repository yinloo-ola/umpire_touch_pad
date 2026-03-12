# Phase 4 Plan — Match Status Transitions & Completion

> **Status**: `PLANNING`
> **Objective**: Implement the full lifecycle of match status changes from match selection to final confirmation, ensuring the backend database reflects the current state of play.

---

## Requirements

The match status should transition through the following states:

1.  **Selection**: When "Start" is clicked in `MatchList` -> `starting`
2.  **Warmup**: When warmup timer is started in `SetupView` -> `warming_up`
3.  **In-Play**: When "Start Match" is clicked in the warmup overlay -> `in_progress`
4.  **Completion**: When match winner is confirmed in the winner modal -> `completed`

---

## Technical Approach

### 1. State Management (`matchStore.js`)
- Add `matchStatus` field to the state (default: `'unstarted'`).
- Update `selectMatch(match)`: Set `matchStatus = 'starting'`.
- Update `startTimer()`: Set `matchStatus = 'warming_up'` at the beginning.
- Add `startMatch()`: New action to set `matchStatus = 'in_progress'`.
- Update `confirmMatchComplete()`: Set `matchStatus = 'completed'`.
- Update `syncMatch()`: Replace the hardcoded `this.isCompleted ? 'completed' : 'in_progress'` with `this.matchStatus`.
- Update `resetMatchState()`: Reset `matchStatus = 'unstarted'`.

### 2. Component Integration
- **`MatchList.vue`**: No change needed to calls, as it already calls `matchStore.selectMatch()`.
- **`SetupView.vue`**:
    - Update `proceedToMatch` to call `matchStore.startMatch()` before routing to scoring.
- **`Touchpad.vue`**: No change needed to calls, as it already calls `matchStore.confirmMatchComplete()`.

---

## Workflow (Wave 1)

| Task | Description | File |
|------|-------------|------|
| T1 | Add `matchStatus` state and reset logic | `matchStore.js` |
| T2 | Update `selectMatch` and `startTimer` actions | `matchStore.js` |
| T3 | Implement `startMatch` action and update `confirmMatchComplete` | `matchStore.js` |
| T4 | Update `syncMatch` to use `matchStatus` | `matchStore.js` |
| T5 | Hook up `startMatch` in `SetupView.vue` | `SetupView.vue` |

---

## Verification Plan

### Automated
- None (manual UI verification required)

### Manual (Empirical)
1. **Selection Sync**:
    - Open browser, select a match, click Start.
    - Check DB: `SELECT status FROM matches WHERE id = '...'` should be `starting`.
2. **Warmup Sync**:
    - Click "Start Warm Up" then "Confirm".
    - Check DB: `status` should be `warming_up`.
3. **In-Progress Sync**:
    - Click "Start Match" in warmup overlay.
    - Check DB: `status` should be `in_progress`.
4. **Completion Sync**:
    - Play match to end (or use a test shortcut if any).
    - Open "Confirm Winner" modal, click "Confirm".
    - Check DB: `status` should be `completed`.

---

## Risk & Assumptions
- **Visibility**: Once a match status changes from `unstarted`, it will disappear from the Umpire's match list based on current backend filtering (`WHERE status = 'unstarted'`). This means umpires cannot "re-select" a match they are currently officiating if the app refreshes.
- **Backend Compatibility**: The backend `SyncMatch` endpoint already accepts a `Status` string and updates the DB, so no backend code changes are strictly required, but we should verify the backend doesn't have any enum-like checks that might reject the new strings. (Checked `match_svc.go`, it just passes the string to SQL).
