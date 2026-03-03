## Phase 4 Decisions

**Date:** 2026-03-03

---

### Scope

- Phase 4 covers **Card Modal UI** and **Timeout Countdown Modal** only.
- Card badge display on the touchpad (next to the Cards button) is deferred to **Phase 5**.

---

### Card Modal Layout

The Card Modal is triggered by pressing the "Cards" button on the touchpad (one per side/team).

**Header**
- Displays the **player or pair name** at the top of the modal to make it unambiguous who the umpire is acting on.
  - Singles: `<Player Name>` (e.g. "Chen Long")
  - Doubles: `<Player A> / <Player B>` (e.g. "Chen Long / Ma Lin")

**Card Layout — single horizontal row, two sections**

```
┌──────────────────────────────────────────────────────────────────────┐
│  Chen Long / Ma Lin                                              [X]  │
│                                                                       │
│  [ T ]  [ Yellow ]  [ YR1 ]  [ YR2 ]  │  [ C-Yellow ]  [ C-Red ]   │
│  Time    Yellow     Yellow    Yellow   │    Yellow        Red        │
│  Out     Card       Red 1     Red 2    │    Card          Card       │
│  ←── Player / Pair track ──────────────│──── Coach track ───────────│
└──────────────────────────────────────────────────────────────────────┘
```

**Card Visual States**

| State | Appearance |
|---|---|
| Not yet available (locked) | Greyed out, reduced opacity, no interaction |
| Available to issue | Full color, tappable |
| Already issued (can revert) | Full color with a subtle highlight/check ring, tappable to revert |

**Card Ordering & Issuance Rules (enforced by store)**

Player track:
- `Yellow` → first card, always available (if none issued)
- `YR1` → only after `Yellow` is issued; greys out Yellow once YR1 is tapped
- `YR2` → only after `YR1` is issued; greys out YR1 & Yellow once YR2 is tapped

Coach track (independent):
- `Yellow` → first, always available (if none issued)
- `Red` → only after `Yellow` is issued

Timeout (leftmost in player section):
- Displayed as a grey "T" card-shaped button
- Enabled only in "Start Of Play" state (not `pointStarted`, not `timerActive`)
- Greyed out once used (1 per match per team)
- **No revert from within the card modal** — timeout revert is managed by the Timeout Modal's Cancel button

---

### Revert Mechanism

**No dedicated "Revert" button** in the modal.

- Umpire **taps an already-issued card** to revert it.
- The store enforces LIFO order: can only revert the **most recently issued card** on each track independently.
- Example: if both `Yellow` and `YR1` are issued, tapping `Yellow` does nothing (out-of-order). Only tapping `YR1` (the last issued) works.
- Visual feedback: non-revertable issued cards remain colored but do not respond to taps (or show a subtle disabled cursor).

---

### Timeout Countdown Modal

When `issueTimeout(teamNum)` is called:
- A full-screen overlay Timeout Modal appears (separate from the card modal, which closes).
- Shows: which team called the timeout, countdown display (`:SS` or `MM:SS` format, counting down from 60).
- Two buttons:
  - **Cancel / Revert**: calls `revertTimeout(teamNum)` — resets usage flag and clears timer. Available at any time (even after timer hits 0).
  - **Dismiss**: calls `dismissTimeout()` — hides the modal, timer result is retained (team's timeout is consumed).

---

### Dismiss / Close

- Card Modal: dismissed via the **✕ (orange X) button** in the top-right corner only. No tap-outside-to-close (prevents accidental dismissal on a touchpad).
- Timeout Modal: dismissed via the **Dismiss button** only (same reasoning).

---

### Component Architecture

- `CardModal.vue` — new component, imported and used inside `Touchpad.vue`.
- `TimeoutModal.vue` — new component, imported and used inside `Touchpad.vue`.
- Both components receive `teamNum` (1 or 2) as a prop and read all state from `matchStore`.
- All mutations go through store actions (`issueCard`, `revertLastCard`, `issueTimeout`, `revertTimeout`, `dismissTimeout`).
