---
phase: 5
plan: 1
wave: 1
---

# Plan 5.1: Card Indicators & Touchpad Integration

## Objective
Ensure that issued cards and timeouts are visually represented on the touchpad next to the "Cards" button. These indicators must accurately reflect side-swaps and maintain visual proximity to the corresponding team controls.

## Context
- .gsd/SPEC.md (Requirements)
- .gsd/phases/5/RESEARCH.md (Design decisions)
- frontend/src/components/Touchpad.vue (Integration target)
- frontend/src/components/CardModal.vue (Reference for card styles)
- frontend/src/stores/matchStore.js (State source)

## Tasks

<task type="auto">
  <name>Create CardIndicators.vue component</name>
  <files>
    <file>frontend/src/components/CardIndicators.vue</file>
  </files>
  <action>
    Create a new component `CardIndicators.vue` that:
    - Accepts a `teamNum` prop (1 or 2).
    - Uses Pinia store to access `teamXCards`, `teamXCoachCards`, and `teamXTimeout`.
    - Renders a horizontal row of small card icons (approx 18x24px).
    - Icons to include:
        - "T" (grey) if `timeoutUsed` is true.
        - Yellow, YR1, YR2 based on the `teamCards` array.
        - Yellow/Red with "C" label based on `teamCoachCards` array.
    - Styling should reuse colors from `CardModal.vue`:
        - Timeout: #bbb
        - Yellow: #f5c400
        - Red: #d32f2f
        - YR1/YR2: linear-gradient gradient (Yellow-Red) with "1" or "2" label.
    - Handle empty state (render nothing if no cards/timeouts).
  </action>
  <verify>Component exists and imports successfully into Touchpad.vue.</verify>
  <done>
    `CardIndicators.vue` is created with proper reactive bindings to the matchStore.
  </done>
</task>

<task type="auto">
  <name>Integrate indicators into Touchpad.vue</name>
  <files>
    <file>frontend/src/components/Touchpad.vue</file>
  </files>
  <action>
    - Import `CardIndicators` in `Touchpad.vue`.
    - Locate the `.side-controls` containers in the `.top-row`.
    - Add `<CardIndicators :teamNum="leftTeamNum" />` and `<CardIndicators :teamNum="rightTeamNum" />`.
    - Derivation of `leftTeamNum` and `rightTeamNum`:
        - `leftTeamNum`: `matchStore.swappedSides ? 2 : 1`
        - `rightTeamNum`: `matchStore.swappedSides ? 1 : 2`
    - Adjust layout so indicators are next to the "Cards" button:
        - Left side: `[Cards Button] [Indicators]`
        - Right side: `[Indicators] [Cards Button]`
    - Ensure `gap` or margins provide clean spacing.
  </action>
  <verify>
    Cards given to Team 1 appear on the visual "Left" initially, and move to the visual "Right" if "Swap Sides" is clicked.
  </verify>
  <done>
    Touchpad UI shows active cards/timeouts on the correct side, updating reactively.
  </done>
</task>

<task type="auto">
  <name>Verify side-swapping and persistence</name>
  <files>
    <file>frontend/src/components/Touchpad.vue</file>
  </files>
  <action>
    Perform empirical testing (via browser or manual verification if needed):
    - Start a match.
    - Issue a Yellow card and a Timeout to Team 1.
    - Verify they appear on the visual Left.
    - Swap Sides. Verify they move to the visual Right.
    - In a deciding game, verify they move correctly when the 5-point swap triggers.
    - Undo a card in the modal and verify it disappears from the indicators.
    - Revert a timeout and verify the 'T' disappears.
  </action>
  <verify>Indicators handle all side-swap scenarios with 100% accuracy.</verify>
  <done>
    Empirical proof of side-swapping correctness documented.
  </done>
</task>

## Success Criteria
- [ ] Issued cards (Yellow, YR1, YR2, Coach Yellow, Coach Red) appear visually on the touchpad header.
- [ ] Timeout "T" indicator appears when a timeout is issued/consumed.
- [ ] Indicators always stay on the same side as the team name/score (correct swap-side integration).
- [ ] Visual design is compact and premium, not interfering with existing controls.
