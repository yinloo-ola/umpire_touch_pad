# S01: Admin Card Editing Polish — Research

**Date:** 2026-03-18

## Summary

The admin card editing UI in `MatchDetailView.vue` needs three changes to align with umpire UI conventions and reduce admin confusion:

1. **Card type labels** — Replace `Yellow-Red (1pt)` and `Yellow-Red-2` with standardized `YR1` and `YR2` (decision D001)
2. **Player display** — Show actual player names from the match object instead of "Player 1/2" indices (decision D003)
3. **Penalty point helpers** — Add optional buttons to apply/revert penalty points when editing YR1/YR2 cards (decision D002)

The umpire UI already uses the correct conventions. This is a straightforward alignment task with no architectural changes.

## Recommendation

Update `MatchDetailView.vue` in place. The changes are localized to the card editing section (lines 150-200). Follow the patterns from `CardModal.vue` (umpire UI) for card type labels and player name display.

## Implementation Landscape

### Key Files

- `frontend/src/views/admin/MatchDetailView.vue` — **Primary target.** Contains the card editing table with type dropdown and player/target selects. Lines 150-200 define the edit-mode card table; lines 70-80 define the read-only display.
- `frontend/src/components/umpire/CardModal.vue` — **Reference implementation.** Shows how to display player names via computed property and uses `Yellow/YR1/YR2/Red/Timeout` card types.
- `frontend/src/stores/matchStore.js` — **Penalty logic.** Contains `applyPenaltyPoints(scoringTeamNum, points)` and `revertPenaltyPoints(scoringTeamNum, points)` methods. Admin UI can reuse this pattern for helper buttons.
- `backend/internal/store/models.go` — **Data model.** `Card` struct has `CardType string`, `TeamIndex int64`, `PlayerIndex int64`. No backend changes needed — the admin UI just needs to send the correct string values.

### Current State Analysis

**Card type dropdown (MatchDetailView.vue:181-186):**
```vue
<select v-model="c.cardType" class="status-select-sm">
  <option value="Yellow">Yellow</option>
  <option value="Yellow-Red">Yellow-Red (1pt)</option>
  <option value="Yellow-Red-2">Yellow-Red (2pt)</option>
  <option value="Timeout">Timeout</option>
</select>
```
- Uses non-standard labels `Yellow-Red` and `Yellow-Red-2`
- Missing `Red` option (for coach cards)

**Player target dropdown (MatchDetailView.vue:169-177):**
```vue
<select v-model.number="c.playerIndex" class="status-select-sm">
  <option :value="0">Player 1</option>
  <option :value="1">Player 2</option>
  <option :value="-1">Coach</option>
  <option :value="-2">Team</option>
</select>
```
- Shows indices instead of actual player names
- Player names are available in `matchData.match.team1` and `matchData.match.team2` arrays

**Read-only display (MatchDetailView.vue:139-147):**
```vue
<td>
  {{ c.playerIndex === -1 ? 'Coach' : (c.playerIndex === -2 ? 'Team' : 'Player') }}
</td>
<td>
  <span :class="['card-pill', c.cardType.toLowerCase().replace('-', '')]">
    {{ c.cardType }}
  </span>
</td>
```
- Shows generic "Player" label instead of name
- CSS class mapping uses `yellowred` which works for `Yellow-Red` but needs update for `YR1`/`YR2`

**CSS classes (MatchDetailView.vue:388-391):**
```css
.card-pill.yellow { background: #facc15; color: #422006; }
.card-pill.yellowred { background: linear-gradient(to right, #facc15, #f87171); color: #450a0a; }
.card-pill.red { background: #f87171; color: #450a0a; }
.card-pill.timeout { background: #60a5fa; color: #1e3a8a; }
```

### Build Order

1. **Update card type dropdown** — Replace options with `Yellow`, `YR1`, `YR2`, `Red`, `Timeout`. This is the core change and unblocks CSS updates.

2. **Update CSS class mapping** — Add `.card-pill.yr1` and `.card-pill.yr2` classes. Update the class binding to handle new type strings.

3. **Show player names** — Create computed helper to map `(teamIndex, playerIndex)` to player name using `matchData.match.team1/team2`. Update both dropdown options and read-only display.

4. **Add penalty point helpers** — Add conditional buttons below the card table when any YR1 or YR2 cards exist. Buttons call backend to adjust game scores. Optional enhancement, can be deferred.

### Verification Approach

1. **Visual check** — Start dev server, navigate to admin match detail, enter edit mode. Verify card type dropdown shows `Yellow`, `YR1`, `YR2`, `Red`, `Timeout`.

2. **Player name display** — Verify dropdown shows actual player names (e.g., "Ma Long" instead of "Player 1") and read-only view shows names.

3. **CSS rendering** — Verify YR1/YR2 cards show gradient yellow-red pill styling.

4. **Save/load roundtrip** — Edit a card, save, reload page. Verify card type persists correctly in database.

5. **Unit tests** — Add tests to `matchStore.cards.test.js` if needed for any new penalty helper logic.

## Constraints

- **Backend expects string card types** — The `CardType` field in the database stores the raw string value. Changing from `Yellow-Red` to `YR1` is a data migration concern for existing records, but new records will use the new format.
- **No authentication changes** — Admin routes already require auth; no changes needed.
- **Match state_json compatibility** — The match state JSON may reference card types. Verify `state_json` reconstruction handles both old and new formats during transition.

## Common Pitfalls

- **Forgetting Red card option** — The current dropdown omits `Red` (coach track). Ensure it's added for completeness.
- **CSS class mismatch** — The current binding does `c.cardType.toLowerCase().replace('-', '')` which turns `Yellow-Red` into `yellowred`. For `YR1`/`YR2`, the class will be `yr1`/`yr2` — ensure CSS defines these.
- **Player index edge cases** — `-1` is coach, `-2` is team. Don't try to look up player names for these; display "Coach" and "Team" as before.

## Open Risks

- **Existing data migration** — Matches already stored with `Yellow-Red` card types will display the old label in read-only mode until manually edited. Consider a backend migration script or frontend fallback display logic.
