# Debug Session: Create New Match Scrollbar Truncation

## Symptom
The "Create New Match" page (AdminMatchForm.vue) does not have a scrollbar. The two buttons at the bottom are truncated and cannot be seen in full on smaller screens or when the form content exceeds the viewport height.

**When:** When viewing the AdminMatchForm component, especially on screens with limited vertical space or when the number of players/fields grows.
**Expected:** The page or the form container should be scrollable so all fields and actions (buttons) are accessible.
**Actual:** No scrollbar is visible, and the bottom buttons are partially or fully hidden.

## Evidence
- Need to inspect `AdminMatchForm.vue` and its parent `AdminLayout.vue` for CSS constraints like `overflow: hidden`, `height: 100vh` without scroll, or fixed positioning issues.

## Hypotheses

| # | Hypothesis | Likelihood | Status |
|---|------------|------------|--------|
| 1 | `AdminLayout.vue` or `AdminMatchForm.vue` has `overflow: hidden` on a container. | 80% | UNTESTED |
| 2 | The main content area in `AdminLayout.vue` is set to `height: 100%` or `100vh` without allowing vertical scroll. | 70% | UNTESTED |
| 3 | The buttons are positioned absolutely or fixed without enough space/padding at the bottom of the container. | 30% | UNTESTED |

## Attempts

### Attempt 1
**Testing:** H2 — `AdminLayout` root has `min-height: 100dvh` instead of `height: 100%`.
**Action:** Changed `.admin-shell` to `height: 100%` in `AdminLayout.vue`.
**Result:** User confirmed "it's working now!".
**Conclusion:** CONFIRMED

## Resolution

**Root Cause:** The `.admin-shell` in `AdminLayout.vue` used `min-height: 100dvh`. Since the `body` is fixed to `height: 100dvh` with `overflow: hidden`, a `min-height` that exceeds the viewport height would cause the shell to grow, but because its parent (`body`) clips it, the internal scrollable container (`.admin-content`) didn't realize it needed to scroll. Changing to `height: 100%` forces the shell to stay within the viewport, allowing `overflow-y: auto` on `.admin-content` to trigger.
**Fix:** Changed `min-height: 100dvh` to `height: 100%` in `.admin-shell` class in `AdminLayout.vue`.
**Verified:** Confirmed by user after manual inspection.
**Regression Check:** Verified that the layout still fills the screen and topbar remains sticky.
