---
phase: 4
level: 2
researched_at: 2026-03-18
---

# Phase 4 Research

## Questions Investigated
1. **How is card data currently stored and synchronized?**
   - Investigated `00001_initial_schema.sql` and `match_svc.go`.
   - Cards are stored in the `cards` table with fields for `match_id`, `game_id`, `team_index`, `player_index`, and `card_type`.
   - Timeouts are stored as a special card type with `player_index = -2`.

2. **What is the current state of Admin UI for cards?**
   - Reflected in `MatchDetailView.vue`. It has an "Edit Match" mode that allows adding/deleting cards.
   - Currently uses non-standard labels like "Yellow-Red (1pt)" instead of the store's internal "YR1".

3. **What improvements are needed for Phase 4?**
   - Standardization of `cardType` strings between Umpire and Admin interfaces.
   - Displaying actual player names instead of indices in the Admin edit form.
   - Adding helper buttons to auto-adjust scores when issuing cards (smart editing).
   - Validating card sequences (e.g. Yellow before YR1).

## Findings

### 1. Unified Card & Timeout Schema
Timeout properties (`team1Timeout`, `team2Timeout`) are technically booleans in the `matchStore`, but are persisted as card records with `player_index: -2`. This allows history tracking (which game the timeout was taken in).

**Recommendation:** Continue using the `cards` table for both penalty cards and timeout markers to maintain consistent history.

### 2. Standardized Card Types
The Umpire UI uses specific internal strings (`YR1`, `YR2`) for logic and CSS styling. The current Admin UI uses friendlier labels that break this connection.

| Standard Type | Display Label | Effect |
|---------------|---------------|--------|
| `Yellow` | Yellow Card | Warning (no points) |
| `YR1` | Yellow-Red (1pt) | Warning + 1 point to opponent |
| `YR2` | Yellow-Red (2pt) | Warning + 2 points to opponent |
| `Red` | Red Card | Coach ejection |
| `Timeout` | Timeout | 60-second break |

## Decisions Made
| Decision | Choice | Rationale |
|----------|--------|-----------|
| **String Schema** | Standardize on `YR1`/`YR2` | Simplifies UI rendering and state reconstruction from `state_json`. |
| **Score Sync** | Manual with Helpers | Admin edits are overrides. Scores shouldn't *always* auto-update, but "Apply Penalty Points" buttons should be provided. |
| **Target Mapping** | Name-based lookup | Showing "Player 1/2" is confusing. Admin UI must show names from the `match` object. |

## Patterns to Follow
- **Component Reuse:** Reuse the CSS logic from `CardIndicators.vue` and `CardModal.vue` for consistent visual language (the same gradient for YR cards).
- **Snapshot Pattern:** Admin edits use the existing atomic `PUT /api/admin/matches/:id` endpoint.

## Anti-Patterns to Avoid
- **Hardcoding counts:** Do not assume Team 1 always has 2 players (Singles vs Doubles).
- **Breaking Umpire State:** Manual card edits must not break the Umpire's "last card" undo logic if they are currently live.

## Dependencies Identified
- None new. Standard Vue 3 / Pinia / Go stack.

## Risks
- **Desync:** Admin editing a LIVE match might confuse the Umpire if they both sync at the same time.
- **Mitigation:** The "Match is LIVE. Override?" confirmation already exists in `MatchDetailView.vue`.

## Ready for Planning
- [x] Questions answered
- [x] Approach selected
- [x] Dependencies identified
