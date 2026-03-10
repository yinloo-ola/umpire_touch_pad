# Debug Session: Verify Player Name Visibility During "Start of Play"

## Symptom
Verify if players' names are shown or hidden when the "Start of Play" status is active on the umpire touchpad.

**Expected:** Players' names should not be shown when "Start of Play" is shown (based on USER request).
**Actual:** Players' names ARE currently visible behind the "Start of Play" text.

## Hypotheses
| # | Hypothesis | Likelihood | Status |
|---|------------|------------|--------|
| 1 | Players' names are currently visible during "Start of Play" because `table-player-grid` condition only checks `!isGameOver`. | 100% | CONFIRMED |
| 2 | CSS or other logic hides the names even if they are in the DOM. | 0% | ELIMINATED |

## Attempts

### Attempt 1: Verify logic in TouchpadView.vue
**Action:** Checked `TouchpadView.vue` line 289.
**Result:** Condition `v-if="!matchStore.isGameOver && isDoubles"` allowed rendering names even when `pointStarted` was false.
**Conclusion:** FIXED by adding `matchStore.pointStarted` to the `v-if` condition.

### Attempt 2: Empirical Verification
**Action:** Used `agent-browser` to verify the fix.
1. Observed "Start of Play" with names hidden: [touchpad_verify_1.png](file:///Volumes/Ext/code/personal/umpire_touch_pad/touchpad_verify_1.png)
2. Clicked "Start of Play", confirmed names appear: [touchpad_verify_2.png](file:///Volumes/Ext/code/personal/umpire_touch_pad/touchpad_verify_2.png)
**Result:** SUCCESS.

## Resolution

**Root Cause:** The `v-if` condition for the `table-player-grid` only checked `!isGameOver`, which meant names were always visible during the "Start of Play" state (where the match is active but the first point hasn't started).
**Fix:** Added `matchStore.pointStarted` to the visibility condition for both singles and doubles layouts in `TouchpadView.vue`.
**Verified:** Verified via `agent-browser` screenshots showing names hidden during SOP and visible after toggling.
