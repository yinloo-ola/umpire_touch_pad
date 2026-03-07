# Debug Session: Card Indicators TypeError

## Symptom
`Uncaught (in promise) TypeError: card.toLowerCase is not a function` in `CardIndicators.vue`.

**When:** When rendering the `TouchpadView` (Scoring page) after resuming or issuing a card.
**Expected:** Card indicators should show yellow/red cards.
**Actual:** App crashes because it tries to call `.toLowerCase()` on an object.

## Hypotheses
| # | Hypothesis | Likelihood | Status |
|---|------------|------------|--------|
| 1 | `matchStore` arrays (`team1Cards`, etc.) now contain objects `{ type, game }` instead of strings, but `CardIndicators.vue` still treats them as strings. | 100% | CONFIRMED |

## Attempts

### Attempt 1
**Testing:** H1 — card array objects vs strings.
**Action:** Changed `CardIndicators.vue` template to access `card.type` for CSS classes and comparisons.
**Result:** Success.
**Conclusion:** CONFIRMED. Fixed the render loop and specific card-type logic (YR1/YR2).

## Resolution

**Root Cause:** Refactoring of the card system to support Undo/Sync changed the store state from simple strings (e.g., `'Yellow'`) to objects (e.g., `{ type: 'Yellow', game: 1 }`).
**Fix:** Updated `CardIndicators.vue` to use `.type`.
**Verified:** Manual verification in browser (user reported) & regression test suite.
