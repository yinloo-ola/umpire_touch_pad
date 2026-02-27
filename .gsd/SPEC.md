# SPEC.md — Project Specification

> **Status**: `FINALIZED`
> **Created**: 2026-02-27
> **Project**: Umpire Touchpad — Doubles Match Feature

---

## Vision

Complete the doubles match support in the Umpire Touchpad app so that umpires can officiate table tennis doubles matches with the correct ITTF serve/receive rotation, player position management on all four court quadrants, and mid-game player swap functionality — matching the full behaviour expected of a real digital umpire device.

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

---

## Non-Goals (Out of Scope)

- Card system (yellow/red cards) — already a debt item, not in this feature
- Expedite rule implementation
- Match result persistence to database
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

### Between-Game Rules
- The team that **received** first in game N **serves** first in game N+1
- The **serving team** in game N+1 **chooses which player** serves first (umpire selects in UI)
- The **first receiver** in game N+1 must be the player who served TO the chosen first server in game N (i.e., the receiver for that player in the previous game)
- This is presented to the umpire as a constrained choice: team chooses server, receiver is auto-determined

### Deciding-Game Mid-Game Swap (at 5 points)
- Triggered when: `game === maxGame` AND `(p1Score + p2Score) === 10` (i.e., one team just reached 5, total hits 10... actually trigger when first team reaches 5: `p1Score === 5 || p2Score === 5`)
- Wait — ITTF rule: "when the first pair scores 5 points" means the first time **either** team's score reaches 5
- Trigger condition: `isDecidingGame && (p1Score === 5 || p2Score === 5) && !decidingSwapDone`
- Action:
  - **Both sides** swap: left side swaps top↔bottom, right side swaps top↔bottom; `swappedSides` toggles
  - **Receiving pair** additionally swaps their two players: `p2Top ↔ p2Bot` (if receiving is right) or `p1Top ↔ p1Bot` (if receiving is left)
  - `decidingSwapDone = true` (prevent double-trigger)
- For **singles**: same trigger, just `swappedSides` toggles (no player-within-side swap needed)

---

## Success Criteria

- [ ] **Doubles SetupView** shows 4 quadrants with correct player names in each
- [ ] **Swap Players (left)** button swaps TL and BL players before and during the match
- [ ] **Swap Players (right)** button swaps TR and BR players before and during the match
- [ ] **Server/Receiver indicators** function identically to singles (don't need individual player names)
- [ ] **Serve rotation** follows A→X→B→Y→A cycle exactly; verified by playing through 8 serves manually
- [ ] **Between-game serve setup** correctly determines which player must receive based on previous game
- [ ] **Deciding game** triggers side swap at 5 points; both sides swap; receiving pair also swaps receive order
- [ ] **Singles deciding game** triggers player swap at 5 points
- [ ] **Singles behaviour unchanged** — all existing singles tests pass visually unchanged
- [ ] **Swap Players buttons** remain functional during live scoring

---

## UX Design Notes

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
