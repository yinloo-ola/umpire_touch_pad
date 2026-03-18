---
id: T01
parent: S01
milestone: M001
provides:
  - Standardized card type labels (Yellow/YR1/YR2/Red/Timeout)
  - Gradient pill styling for YR1 and YR2 cards
key_files:
  - frontend/src/views/admin/MatchDetailView.vue
key_decisions:
  - Used horizontal gradient (to right) for YR1/YR2 pills to match existing yellowred pattern
patterns_established:
  - Card type CSS class binding: c.cardType.toLowerCase().replace('-', '') produces yr1, yr2, red, yellow, timeout
observability_surfaces:
  - Browser inspection of .card-pill elements shows computed gradient backgrounds for YR1/YR2
duration: 25m
verification_result: passed
completed_at: 2026-03-18
blocker_discovered: false
---

# T01: Standardize card type labels and styling

**Updated card type dropdown to use standardized labels (Yellow/YR1/YR2/Red/Timeout) and added gradient styling for YR1/YR2 pills.**

## What Happened

1. Updated the card type dropdown options in MatchDetailView.vue to replace `Yellow-Red` and `Yellow-Red-2` with `YR1` and `YR2`, and added the missing `Red` option.
2. Added CSS classes `.card-pill.yr1` and `.card-pill.yr2` with gradient yellow-to-red backgrounds matching the existing `.card-pill.yellowred` pattern.
3. Verified the CSS class binding works correctly: `c.cardType.toLowerCase().replace('-', '')` produces `yr1` and `yr2` for the new card types.
4. Tested in browser: added cards of each type (Yellow, YR1, YR2, Red, Timeout), saved, and verified read-only view shows correct pill styling.

## Verification

- Browser testing confirmed all must-haves:
  - Card type dropdown shows: Yellow, YR1, YR2, Red, Timeout
  - YR1 cards display with gradient yellow-red pill (linear-gradient to right, #facc15 to #f87171)
  - YR2 cards display with gradient yellow-red pill (same gradient)
  - Red cards display with solid red pill (#f87171)
  - Yellow cards display with solid yellow pill (#facc15)
  - Timeout cards display with solid blue pill (#60a5fa)

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | Browser: verify dropdown options include YR1, YR2, Red | 0 | ✅ pass | - |
| 2 | Browser: verify .card-pill.yr1 has gradient background | 0 | ✅ pass | - |
| 3 | Browser: verify .card-pill.yr2 has gradient background | 0 | ✅ pass | - |
| 4 | Browser: verify .card-pill.red has solid red background | 0 | ✅ pass | - |
| 5 | Browser: verify .card-pill.yellow has solid yellow background | 0 | ✅ pass | - |
| 6 | Browser: verify .card-pill.timeout has solid blue background | 0 | ✅ pass | - |

## Diagnostics

To verify card pill styling:
1. Start dev server: `cd frontend && npm run dev`
2. Navigate to `/admin`, click on a match
3. Click "Edit Match", add cards of each type, save
4. Inspect `.card-pill` elements in browser dev tools - YR1/YR2 should show `linear-gradient(to right, ...)` background

## Deviations

None. Implementation followed the task plan exactly.

## Known Issues

None.

## Files Created/Modified

- `frontend/src/views/admin/MatchDetailView.vue` — Updated card type dropdown options and added CSS for YR1/YR2 gradient pills
- `backend/cmd/server/main.go` — Added CORS origin for port 5174 (required for dev server testing)
