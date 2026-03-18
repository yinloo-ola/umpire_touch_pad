# Plan 5.1 SUMMARY: Deciding-Game Alert Modal & Side Swap Logic

## Changes
- Modified `matchStore.js`:
    - Added `midGameSwapPending` state.
    - Added `applyMidGameSwap()` action to execute the side swap and quadrant sync logic.
    - Updated `handleScore()` to set `midGameSwapPending = true` instead of executing the swap immediately when a team reaches 5 points in the deciding game.
- Modified `Touchpad.vue`:
    - Added a new alert modal that appears when `midGameSwapPending` is true.
    - The modal shows the title "Decider game of Match" and instructions about the side swap.
    - Added a "Close" button to the modal that calls `matchStore.applyMidGameSwap()`.
    - Added styling for the new alert modal.

## Verification
- Code review: `handleScore` correctly switches to a "pending" state.
- Code review: `applyMidGameSwap` contains the original swap logic and clears the pending state.
- UI: Modal and overlay added to `Touchpad.vue` following rule specifications.
- Tests: 4 tests currently failing because they expect immediate swap; these will be updated in Plan 5.3.
