---
estimated_steps: 4
estimated_files: 1
---

# T01: Standardize card type labels and styling

**Slice:** S01 — Admin Card Editing Polish
**Milestone:** M001

## Description

Update the card type dropdown in MatchDetailView.vue to use standardized labels (Yellow/YR1/YR2/Red/Timeout) aligned with umpire UI conventions (decision D001). Add CSS styling for YR1 and YR2 card pills with gradient yellow-red backgrounds matching CardModal.vue patterns.

## Steps

1. Update card type dropdown options in edit mode (lines ~181-186): replace `Yellow-Red` and `Yellow-Red-2` options with `YR1` and `YR2`, add missing `Red` option
2. Add CSS classes `.card-pill.yr1` and `.card-pill.yr2` with gradient styling (yellow-to-red, matching `.card-pill.yellowred` pattern)
3. Verify CSS class binding works: the existing binding `c.cardType.toLowerCase().replace('-', '')` produces `yr1` and `yr2` for the new types
4. Test read-only display renders YR1/YR2 cards with correct gradient pills

## Must-Haves

- [x] Card type dropdown shows: `Yellow`, `YR1`, `YR2`, `Red`, `Timeout`
- [x] YR1 cards display with gradient yellow-red pill in read-only view
- [x] YR2 cards display with gradient yellow-red pill in read-only view
- [x] Red cards display with solid red pill in read-only view
- [x] Existing Yellow and Timeout styling unchanged

## Verification

- Start dev server: `cd frontend && npm run dev`
- Navigate to `/admin`, click on a match to open detail view
- Click "Edit Match" button
- Verify card type dropdown shows exactly: Yellow, YR1, YR2, Red, Timeout
- Add cards of each type, save, verify read-only view shows correct pill styling
- For YR1/YR2: verify gradient yellow-red background (not solid color)

## Inputs

- `frontend/src/views/admin/MatchDetailView.vue` — current implementation with non-standard card types
- `frontend/src/components/umpire/CardModal.vue` — reference for YR1/YR2 gradient styling pattern

## Expected Output

- `frontend/src/views/admin/MatchDetailView.vue` — updated card type dropdown and CSS with YR1/YR2 gradient styling

## Observability Impact

- **Signals changed:** Card type dropdown now emits YR1/YR2/Red values instead of Yellow-Red/Yellow-Red-2; backend must accept these values (already compatible)
- **How to inspect later:** Browser dev tools → inspect `.card-pill` elements in read-only view → YR1/YR2 should show `linear-gradient(to right, #facc15, #f87171)` background
- **Failure visibility:** If CSS classes are missing, pills will have no background color; if dropdown options are wrong, card type will show as raw value without styling
