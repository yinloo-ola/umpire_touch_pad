# S01: Admin Card Editing Polish

**Goal:** Admin can edit cards in MatchDetailView with player names (not indices), standardized type dropdown (Yellow/YR1/YR2/Red/Timeout), and correct styling.

**Demo:** Open admin match detail page, click Edit Match. Card type dropdown shows `Yellow`, `YR1`, `YR2`, `Red`, `Timeout`. Player target dropdown shows actual player names (e.g., "Ma Long") instead of "Player 1/2". Read-only view shows player names and YR1/YR2 cards render with gradient yellow-red pill styling.

## Must-Haves

- Card type dropdown shows `Yellow`, `YR1`, `YR2`, `Red`, `Timeout` (decision D001)
- Read-only view shows standardized card type labels with correct styling
- CSS gradient styling for YR1 and YR2 card pills
- Player target dropdown shows actual player names from match object
- Read-only view shows player names instead of generic "Player" label
- Red card option available for coach track (was missing)

## Proof Level

- This slice proves: operational
- Real runtime required: yes
- Human/UAT required: yes (visual verification of styling and names)

## Verification

- `npm run dev` → navigate to `/admin/match/:id` → click Edit Match → verify card type dropdown options
- Verify player dropdown shows actual names from match data
- Create/edit a YR1 or YR2 card, save, reload → verify gradient pill styling renders
- Create/edit a Red card for coach → verify red pill styling
- Save/load roundtrip: edit card types, save, reload page → verify persistence
- **Diagnostic check:** Browser console → run `Array.from(document.querySelectorAll('.card-pill')).map(p => ({text: p.textContent, bg: getComputedStyle(p).background}))` → verify YR1/YR2 show gradient, others show solid colors

## Integration Closure

- Upstream surfaces consumed: `matchData.match.team1/team2` arrays for player name lookup
- New wiring introduced: none (UI-only changes)
- What remains before the milestone is truly usable end-to-end: S02 (Public API) and S03 (Public Viewer Page)

## Observability / Diagnostics

- **Runtime signals:** Card type dropdown emits YR1/YR2/Red values; pills render with CSS gradients
- **Inspection surfaces:** Browser dev tools → inspect `.card-pill` elements → computed background shows gradient for YR1/YR2, solid colors for others
- **Failure visibility:** If CSS missing, pills have no background; if dropdown wrong, raw values display without styling
- **Diagnostic command:** `browser_evaluate: document.querySelectorAll('.card-pill')` → inspect classList and computed background
- **Redaction constraints:** None (no sensitive data in card styling)

## Tasks

- [x] **T01: Standardize card type labels and styling** `est:30m`
  - Why: Align admin UI with umpire UI conventions per decision D001; current dropdown uses non-standard labels and omits Red card option
  - Files: `frontend/src/views/admin/MatchDetailView.vue`
  - Do: Update card type dropdown options from `Yellow/Yellow-Red/Yellow-Red-2/Timeout` to `Yellow/YR1/YR2/Red/Timeout`. Add CSS classes `.card-pill.yr1` and `.card-pill.yr2` with gradient yellow-red styling matching CardModal.vue patterns.
  - Verify: Start dev server, navigate to admin match detail, enter edit mode, verify dropdown shows correct options and YR1/YR2 cards render with gradient pills
  - Done when: Card dropdown shows `Yellow`, `YR1`, `YR2`, `Red`, `Timeout`; YR1/YR2 read-only pills have gradient styling

- [x] **T02: Display player names instead of indices** `est:30m`
  - Why: Reduce admin confusion per decision D003; "Player 1/2" is ambiguous when editing cards
  - Files: `frontend/src/views/admin/MatchDetailView.vue`
  - Do: Create computed helper to map `(teamIndex, playerIndex)` to player name using `matchData.match.team1/team2`. Update player target dropdown to show names. Update read-only display to show resolved name. Preserve "Coach" and "Team" labels for special indices (-1, -2).
  - Verify: Load match with known players, enter edit mode, verify dropdown shows player names; view read-only mode, verify names display instead of "Player"
  - Done when: Player dropdown options and read-only view show actual player names; Coach/Team labels preserved for special cases

## Files Likely Touched

- `frontend/src/views/admin/MatchDetailView.vue`
