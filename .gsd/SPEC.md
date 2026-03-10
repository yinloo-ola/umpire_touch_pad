# SPEC.md — Project Specification

> **Status**: `FINALIZED`
> **Created**: 2026-02-27
> **Project**: Umpire Touchpad — Doubles Match Feature

---

## Vision

Complete the doubles match support in the Umpire Touchpad app so that umpires can officiate table tennis doubles matches with the correct ITTF serve/receive rotation, player position management on all four court quadrants, and mid-game player swap functionality — matching the full behaviour expected of a real digital umpire device.

Implement a comprehensive Card System (Timeout and Penalty cards) to handle player and coach disciplinary actions, award penalty points automatically, and manage match timeouts, fully integrating with existing match and score state.

---

## Background

The app already handles singles matches end-to-end. For doubles, the match list shows two players per team and the data model is partially in place, but the UI and logic are incomplete:
- SetupView shows only 2 slots (left/right) instead of 4 quadrants
- There are no "Swap Players within a side" buttons
- The serve rotation for doubles is hardcoded to the singles rotation (every 2 points, alternating teams) — it doesn't know about individual player rotation or the A→X→B→Y→A cycle
- The deciding-game mid-game side swap (at 5 points) is not implemented for either singles or doubles

---

## Goals

1. **Four-quadrant court view** for doubles in SetupView and Touchpad, showing each individual player in their correct corner
2. **Two "Swap Players" buttons** — one for left side (swaps top-left ↔ bottom-left), one for right side (swaps top-right ↔ bottom-right) — available both before warmup and during play
3. **Correct ITTF doubles serve rotation** — A→X→B→Y→A cycle, updating automatically every 2 points (every 1 point at deuce), with umpire-correction override
4. **Between-game serve choices** match ITTF rules (team that received first in previous game serves first; first receiver determined by who served to the current first server last game)
5. **Deciding-game mid-game side swap** — at 5 points in the final game (game 5 of Best-of-5, game 7 of Best-of-7), both pairs swap sides AND the receiving pair additionally swaps their receive order
6. **Singles deciding-game side swap** — same 5-point mid-game swap applies to singles (player swap left↔right)
7. **Card System** — Implement Timeout, Yellow, Yellow Red 1, Yellow Red 2 (for players/pairs) and Yellow, Red (for coaches on the bench).
8. **Penalty Points Logic** — YR1 awards 1 point, YR2 awards 2 points. Penalty points behave identically to regular points regarding server rotation (e.g. at 2-1, a penalty point makes it 2-2, triggering a server change). Auto-resolve win conditions if penalty points push the score beyond game/match limits (e.g., carrying over points to next game). Reverting penalty cards will also remove the automatically awarded points.
9. **Timeout Timer** — 1-minute countdown timer popup, cancelable, only triggerable during "Start of Play".
10. **Card UI & State** — Visual representation of awarded cards next to the card button. Cards side-swap when players swap. Revert logic is per-team, last in, first out (LIFO), which will also revert any automatically awarded penalty points. Timeouts are undone individually outside the main card LIFO stack. Player cards and coach cards are maintained on independent tracks.

---

## Non-Goals (Out of Scope)

- Expedite rule implementation
- Multi-device sync or real-time updates
- Player profile database or ID lookup (winner modal player ID hardcoding is a pre-existing debt item)
- UI for editing score history

---

## Users

Table tennis umpires using a touchpad device (tablet/touchscreen) to officiate matches during live competition. The umpire needs:
- Fast, touch-friendly controls
- Clear visual indication of who is currently serving and receiving (individual players, not just teams)
- Reliable automatic serve rotation that they can override if needed

---

## Constraints

- **Frontend**: Vue 3 + Pinia + Vue Router (no framework change)
- **State centralized**: all logic stays in `matchStore.js`; components only call actions
- **CSS**: Vanilla CSS with existing design tokens; scoped styles per component
- **No backend changes required** for this feature (match data structure already supports doubles via `team1[]`/`team2[]` arrays)
- **Backwards-compatible**: singles match behaviour must be unchanged

---

## Data Model Changes

### Player Positions (Quadrants)
Each team has 2 players. We track which player is in which quadrant via an index:

```
LEFT SIDE          |  RIGHT SIDE
─────────────────────────────────────────
top-left:  t1[p1Top]  | top-right:  t2[p2Top]
bottom-left: t1[p1Bot] | bottom-right: t2[p2Bot]
```

Where `p1Top`, `p1Bot`, `p2Top`, `p2Bot` are `0` or `1` (index into `team1[]` / `team2[]`).

"Swap left" swaps `p1Top` and `p1Bot`. "Swap right" swaps `p2Top` and `p2Bot`.

### Doubles Serve State
To track the full ITTF doubles serve rotation:

| Field | Type | Purpose |
|-------|------|---------|
| `doublesServer` | `{team: 1|2, player: 0|1}` | Current server (team + player index) |
| `doublesReceiver` | `{team: 1|2, player: 0|1}` | Current receiver (team + player index) |
| `doublesInitialServer` | same | Server at start of THIS game (for rotation reset) |
| `doublesInitialReceiver` | same | Receiver at start of THIS game |

### Rotation Logic
Given initial server A (team1[0]) and initial receiver X (team2[0]):

**Before deuce (total points < 20):** each player in the cycle serves 2 consecutive points.

| Serves passed | Total pts range | Server | Receiver |
|---------------|-----------------|--------|----------|
| 0 | 0–1 | A | X |
| 1 | 2–3 | X | B |
| 2 | 4–5 | B | Y |
| 3 | 6–7 | Y | A |
| 4 | 8–9 | A | X |
| … | … | cycle of 4 | … |
| 9 | 18–19 | X | B |

**At deuce (both scores ≥ 10, total ≥ 20):** each player serves **1 serve only**, but the A→X→B→Y→A order is unchanged.

| Total pts | Score example | Server | Receiver |
|-----------|---------------|--------|----------|
| 20 | 10–10 | (position 10 mod 4 = 2) B | Y |
| 21 | 11–10 or 10–11 | Y | A |
| 22 | 11–11 | A | X |
| 23 | 12–11 or 11–12 | X | B |
| 24 | 12–12 | B | Y |
| … | … | cycle continues | … |

> **Note**: The user example "at 10-10 if A→X" is illustrative of the rotation continuing — the actual position depends on who was serving just before deuce started. The formula derives the correct position automatically.

**Formula (same structure as existing singles logic):**
```js
// servesPassed = how many 'serve slots' have elapsed
if (p1Score >= 10 && p2Score >= 10) {
  servesPassed = 10 + (p1Score + p2Score - 20)  // 1 serve per slot at deuce
} else {
  servesPassed = Math.floor((p1Score + p2Score) / 2)  // 2 serves per slot normally
}
// Position in 4-player cycle:
const cyclePos = servesPassed % 4
// Map cyclePos → {server, receiver} using doublesInitialServer/Receiver
```

The `cyclePos` maps to server/receiver relative to the initial pair:
- 0 → initial server serves to initial receiver
- 1 → initial receiver serves to partner of initial server
- 2 → partner of initial server serves to partner of initial receiver
- 3 → partner of initial receiver serves to initial server

### Between-Game Rules (Games 2+)
- **No Modal**: Eliminate the "Who serves first?" modal for between-game transitions.
- **Initial Serve Right**: The team that **received** first in game N **serves** first in game N+1.
- **Automatic Receiver (Games 2-5)**: 
    - At the start of a new game (before the first point is scored), when the umpire swaps the serving pair (using "Swap Players" buttons or clicking the server), the **receiver** on the other side is automatically changed.
    - The **first receiver** must be the player who served TO the chosen first server in game N (i.e., the receiver for that player in the previous game).
- **Control**: The umpire simply ensures the correct server is designated (by swapping players if needed) and the system keeps the receiver in sync based on ITTF rules.

### Deciding-Game Mid-Game Swap (at 5 points)
- Triggered when: `game === maxGame` AND `(p1Score + p2Score) === 10` (i.e., one team just reached 5, total hits 10... actually trigger when first team reaches 5: `p1Score === 5 || p2Score === 5`)
- Wait — ITTF rule: "when the first pair scores 5 points" means the first time **either** team's score reaches 5
- Trigger condition: `isDecidingGame && (p1Score === 5 || p2Score === 5) && !decidingSwapDone`
- **Action**:
  - **Both sides** swap: left side swaps top↔bottom, right side swaps top↔bottom; `swappedSides` toggles
  - **Receiving pair** additionally swaps their two players: `p2Top ↔ p2Bot` (if receiving is right) or `p1Top ↔ p1Bot` (if receiving is left)
  - `decidingSwapDone = true` (prevent double-trigger)
  - **Alert Modal**: Show a modal to inform the umpire:
    - Title: "Decider game of Match"
    - Body: "Decider game of Match, 5 points scored, swapping sides and players."
    - Button: "Close"
- For **singles**: same trigger, just `swappedSides` toggles (no player-within-side swap needed)

---

## Success Criteria

- [x] **Doubles SetupView** shows 4 quadrants with correct player names in each
- [x] **Swap Players (left)** button swaps TL and BL players before and during the match
- [x] **Swap Players (right)** button swaps TR and BR players before and during the match
- [x] **Server/Receiver indicators** function identically to singles (don't need individual player names)
- [x] **Serve rotation** follows A→X→B→Y→A cycle exactly; verified by playing through 8 serves manually
- [x] **Between-game serve setup** correctly determines which player must receive based on previous game, triggered by swapping serving players without an extra modal
- [x] **Deciding game** triggers side swap at 5 points; both sides swap; receiving pair also swaps receive order
- [x] **Deciding game alert** shows modal "Decider game of Match, 5 points scored..." at 5-point swap
- [x] **Singles deciding game** triggers player swap at 5 points
- [x] **Singles behaviour unchanged** — all existing singles tests pass visually unchanged
- [x] **Swap Players buttons** remain functional during live scoring
- [x] **Names hidden during SOP**: Player names are hidden when "Start of Play" is displayed; clicking SOP reveals names and hides text.

---

## UX Design Notes

### Card Modal (Phase 4)

Triggered by the **Cards button** on the touchpad (one button per side/team). Opens `CardModal.vue`.

**Header**: Player or pair name is displayed at the top of the modal.
- Singles: `<Player Name>`
- Doubles: `<Player A> / <Player B>`

**Card Layout** — a single horizontal row, split into two sections by a vertical divider:

```
┌──────────────────────────────────────────────────────────────────┐
│  Chen Long / Ma Lin                                         [X]  │
│                                                                   │
│  [ T ]  [ Yellow ]  [ YR1 ]  [ YR2 ]  │  [ C-Yellow ]  [ C-Red ]│
│  Time    Yellow     Yellow    Yellow   │  Yellow          Red    │
│  Out     Card       Red 1     Red 2    │  Card            Card   │
│  ←─ Player / Pair track ──────────────│──── Coach track ───────│
└──────────────────────────────────────────────────────────────────┘
```

**Card Visual States:**

| State | Appearance |
|---|---|
| Locked (not yet eligible) | Greyed out, reduced opacity, non-interactive |
| Available to issue | Full color, tappable |
| Already issued (last in stack, revertable) | Full color, tappable to revert |
| Already issued (not last in stack) | Full color, non-interactive (cannot revert out of order) |

**Revert Interaction (no Revert button):**
- Umpire taps an **already-issued card** to revert it.
- LIFO enforced: only the **last issued card on each track** responds to a tap.
- Out-of-order taps are silently ignored (card stays highlighted, no action).

**Issuance Order:**
- Player track: `Yellow → YR1 → YR2` (each locks the previous)
- Coach track: `Yellow → Red` (independent of player track)
- Timeout (`T`): leftmost in player section; greyed once used (1 per match per team); only enabled in Start Of Play state

**Close:** Orange ✕ button in top-right corner only (no tap-outside-to-close).

---

### Timeout Countdown Modal (Phase 4)

Shown as a full-screen overlay when `issueTimeout` is called. Separate from the Card Modal (card modal closes first).

**Contents:**
- Label: which team called the timeout
- Countdown display: counts down from 60s (format: `0:SS`)
- **Cancel / Revert** button: calls `revertTimeout` — clears usage flag and timer. Available at any time.
- **Dismiss** button: calls `dismissTimeout` — hides modal; timeout is consumed.

---

### SetupView (Doubles)
```
[← Back]   [Best of 5]   [⚽]

┌──────────────────────────────────────────────────────┐
│  [↓↑ Swap Players]    Court    [↓↑ Swap Players]     │
│                  ┌────────┬────────┐                  │
│                  │ P1Top  │ P2Top  │                  │
│                  ├────────┼────────┤                  │
│                  │ P1Bot  │ P2Bot  │                  │
│                  └────────┴────────┘                  │
│  [S Server]                           [R Receiver]   │
└──────────────────────────────────────────────────────┘
[Swap Sides]   [Start Warm Up]   [End Match]
```

> **No flag icons or player ID numbers** are needed — show only player name and country code text.

### Touchpad (Doubles, during play)
- Status box shows 4 mini-quadrants with player positions (same as singles but 4 slots)
- **UX Rule**: Player names are hidden when the center status box says "Start Of Play". They are revealed once the status box is clicked.
- Swap Players buttons remain visible on left/right sides of the court area

### Serve Indicator Detail (Doubles)
- Just like in singles, the indicator shows "S" for Server and "R" for Receiver. No individual player names are needed below the circle.

---

## Implementation Notes

- Doubles vs singles detection: `matchStore.currentMatch.type === 'doubles'`
- All quadrant state lives in `matchStore` (not component-local) so both SetupView and Touchpad share it
- The`setServer()` umpire-correction action needs a doubles-aware version that takes `{team, player}` instead of just `1|2`
- `handleScore()` must branch on match type: singles uses existing logic; doubles uses the new rotation cycle
- `nextGame()` must implement between-game serve choice logic for doubles
