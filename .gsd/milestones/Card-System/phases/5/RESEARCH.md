---
phase: 5
level: 2
researched_at: 2026-03-03
---

# Phase 5 Research: Display Indicators & Side-Swapping Integration

## Questions Investigated
1. **Indicator Design**: How to represent cards visually in a compact way next to the card button?
2. **Placement**: Where exactly in the `Touchpad.vue` layout should indicators be inserted?
3. **Side-Swapping**: How to ensure indicators accurately reflect team side-swaps without duplication or delay?
4. **Data Binding**: Which store fields should trigger visual updates?

## Findings

### 1. Indicator Visual Representation
- Reusing colors/gradients from `CardModal.vue`:
  - **Timeout**: Grey (#bbb) with 'T'.
  - **Yellow**: Yellow (#f5c400).
  - **YR1/YR2**: Yellow/Red vertical split with '1' or '2'.
  - **Coach Cards**: Yellow or Red with 'C'.
- **Recommendation**: Create a small `CardIndicators.vue` component that accepts a `teamNum` and renders all active cards for that team in a row. Use high-contrast fonts for the small labels ('T', 'C', '1', '2').

### 2. Layout & Placement
- Current `Touchpad.vue` has a `.top-row` with `.side-controls` on left and right.
- `.side-controls` is a flex container with `gap: 2rem`.
- **Recommendation**:
  - Insert indicators as a sibling to the `.card-btn`.
  - Left side: `[Button] [Indicators]`
  - Right side: `[Indicators] [Button]`
  - Use `flex-direction: row-reverse` on the right side container or simply swap order in template.

### 3. Side-Swapping Integration
- `matchStore` uses `swappedSides` (Boolean).
- Visual "Left" maps to `team2` if `swappedSides` is true, else `team1`.
- **Recommendation**: Use computed properties `leftTeamNum` and `rightTeamNum` in `Touchpad.vue` to drive the `teamNum` prop of the new indicator components.

### 4. Logic & State
- **Triggering Fields**:
  - `team1Cards`, `team2Cards` (Players)
  - `team1CoachCards`, `team2CoachCards` (Coaches)
  - `team1Timeout`, `team2Timeout` (Boolean)
- **Recommendation**: Use a `watch` or simple reactive binding in the component. The `matchStore` actions already update these arrays/flags.

## Decisions Made
| Decision | Choice | Rationale |
|----------|--------|-----------|
| Component | `CardIndicators.vue` | Encapsulates complex conditional rendering and styling of small icons. |
| Placement | Flex siblings of `card-btn` | Maintains visual proximity to the action that issues them. |
| Order | Timeout → Player Cards → Coach Cards | Consistent logical grouping. |
| Sizing | ~18px x 24px | Small enough for the header but legible for the umpire. |

## Patterns to Follow
- **Composition API**: Use `<script setup>` for the new component.
- **Side-Agnostic Store Binding**: Always derive "Side" data from `swappedSides` + `teamNum`.
- **SCSS-like Vanilla CSS**: Use scoped styles for the indicators.

## Dependencies Identified
None. No new libraries needed.

## Risks
- **Visual Clutter**: Too many small icons might look messy. *Mitigation: Group them tightly and use distinct labels.*
- **Jitter during swaps**: If not bound correctly to `swappedSides`, cards might stay on the wrong side for a frame. *Mitigation: Use the same computed team mappings as names/scores.*

## Ready for Planning
- [x] Questions answered
- [x] Approach selected
- [x] Dependencies identified
