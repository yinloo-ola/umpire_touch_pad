## Symptom (New)
**Issue:** Clicking "Edit Match" for an In-Progress match shows the dialog briefly then closes it (flickering).

**When:** Match status is `in_progress`.
**Expected:** Confirmation dialog stays open; once accepted, UI enters Edit mode and stays there.
**Actual:** Dialog appears to auto-dismiss or the resulting Edit mode is immediately toggled back to read-only.

## Hypotheses
| # | Hypothesis | Likelihood | Status |
|---|------------|------------|--------|
| 1 | Double-triggering: `touchstart` + `click` events both fire `toggleEdit`. The delay of `window.confirm` allows the second click to hit the "Cancel" button in the same spot, toggling it back to false. | 90% | UNTESTED |
| 2 | Polling/Refresh: Background refresh (if it exists) unmounts the component or resets `isEditing` during the dialog. | 20% | UNTESTED |
| 3 | Browser native dialog quirks: `window.confirm` is being auto-dismissed or causing focus issues on touch devices. | 40% | UNTESTED |

## Resolution
1. **Best of 3 sequence**: Backend `AdminUpdateMatch` logic now tracks `t1Wins` and `t2Wins` during game loop and rejects if a game exists after a match is won.
2. **Remarks validation**: Fixed `req.Status == "completed"` check to require trimmed remarks if the match is a tie or not objectively completed. Corrected frontend to show the error banner.
3. **Auto status**: Backend now computes `g.Status` during validation based on scores (11 points, leader by 2). Frontend removed manual dropdown.
4. **Cards editing**: Added `Cards` sync to `AdminUpdateMatch`. Backend now clears all cards and re-inserts from payload. Frontend cards list is now editable.
5. **Card Section Visibility**: Fixed `MatchDetailView.vue` to show the table if `isEditing` is true, regardless of existing cards.
6. **Backend Structs**: Added `Remarks` and `CurrentGame` to `Match` and `MatchRow` structs to ensure full data persistence and retrieval.
7. **Date Format**: Fixed `MatchFormView.vue` to use separate Date and Time inputs for consistent cross-browser behavior and explicit DD/MM/YYYY guidance.
8. **Edit Flicker**: Replaced native `window.confirm` with a custom UI state `showLiveConfirm` and added an event guard to `toggleEdit` to prevent rapid double-triggering. Cleaned up duplicate styles in `MatchDetailView.vue`.

**Status: VERIFIED**


