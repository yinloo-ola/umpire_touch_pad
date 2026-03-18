---
phase: 1
plan: 3
wave: 2
---

# Plan 1.3: Between-Game Serve Setup & Deciding-Game Swap

## Objective
Extend `nextGame()` to handle the ITTF doubles between-game serve rules, add `setDoublesServerForNewGame()` for the serving team's player choice, and implement the deciding-game mid-game side swap that fires at 5 points (for both singles and doubles) inside `handleScore()`.

## Context
- `.gsd/SPEC.md` — § Between-Game Rules, § Deciding-Game Mid-Game Swap
- `frontend/src/stores/matchStore.js` — Plans 1.1 and 1.2 already completed

### Between-Game Rules (ITTF)
- The team that **received** first in game N **serves** first in game N+1
- The serving team **chooses which player** serves
- The first receiver is **locked**: must be the player who served TO the chosen first server in game N
  - Example: In game 1, A served to X. In game 2 if new server is the player who A served to (X), then receiver must be A. If new server is Y, receiver must be B.
  - More precisely: in the previous game's cycle, find which player served TO the candidate new server. That player becomes the mandatory receiver.

### Finding the mandatory receiver
Given `prevDoublesInitialServer` (A) and `prevDoublesInitialReceiver` (X):
- If game N+1 server is X → receiver must be B (partner of A, because B→Y in cycle, no... let me re-examine)

The full cycle: A→X→B→Y→A
- A **served to** X
- X **served to** B
- B **served to** Y
- Y **served to** A

So "who served to player P in the previous game?" maps:
- Who served to X? → A (team1[A.player])
- Who served to B? → X
- Who served to Y? → B
- Who served to A? → Y

Therefore if the new server is P, the mandatory receiver is "who P served to in the previous game" = the player that P received FROM... wait, let me restate: the mandatory receiver is "the player who **served to** the new server in the previous game."

Concretely: if new server = X in game 2, then the player who served to X in game 1 was A → receiver must be A.
If new server = B in game 1... B wasn't a "first server" in game 1, so in game 2 if the receiving team before (team2) now serves, let's say they choose X to serve — then receiver is A (who served to X). Or if they choose Y to serve — then receiver is B (who served to Y).

### Deciding-Game Swap (at 5 points)
- Trigger: `isDecidingGame && !decidingSwapDone && (p1Score === 5 || p2Score === 5)`
- `isDecidingGame`: `game === currentMatch.bestOf` (e.g., game 5 in Best-of-5)
- Action (doubles):
  1. Toggle `swappedSides`
  2. Swap p1Top↔p1Bot AND p2Top↔p2Bot (both pairs change positions within their side)
  3. The receiving pair also swaps **again** (so they swap net position). Since we already swapped both in step 2, we need one extra swap for the receiver's side. If the receiver is on the left after the swap, do `swapLeftPlayers()` again. If on the right, do `swapRightPlayers()` again.
- Action (singles):
  1. Toggle `swappedSides` only (no within-side player swaps)
- Set `decidingSwapDone = true`

## Tasks

<task type="auto">
  <name>Add setDoublesServerForNewGame() action</name>
  <files>frontend/src/stores/matchStore.js</files>
  <action>
    After `setDoublesServer()`, add this new action. It is called when the umpire designates who serves first at the start of a new game (between-game modal choice):

    ```js
    // Called at the START of a new game once the serving team has chosen their server.
    // serverTeam: 1 or 2 (which team is serving first this game)
    // serverPlayerIdx: 0 or 1 (which player on that team serves first)
    //
    // The mandatory receiver is determined by the PREVIOUS game's rotation:
    // "the player who served TO the chosen server in the previous game" becomes the receiver.
    // We use prevInitialServer/Receiver (passed in) to look this up.
    setDoublesServerForNewGame(serverTeam, serverPlayerIdx, prevInitialServer, prevInitialReceiver) {
      const newServer = { team: serverTeam, player: serverPlayerIdx }
      const otherTeam = serverTeam === 1 ? 2 : 1

      // Build the previous game's full cycle to find "who served to newServer"
      const A = prevInitialServer
      const X = prevInitialReceiver
      const B = { team: A.team, player: 1 - A.player }
      const Y = { team: X.team, player: 1 - X.player }

      // "Served to" mapping: A→X, X→B, B→Y, Y→A
      // Find which player's "served to" target matches newServer
      const servedToMap = [
        { from: A, to: X },
        { from: X, to: B },
        { from: B, to: Y },
        { from: Y, to: A },
      ]

      let mandatoryReceiver = null
      for (const entry of servedToMap) {
        if (entry.to.team === newServer.team && entry.to.player === newServer.player) {
          // The player who served TO newServer is entry.from — they must receive
          mandatoryReceiver = entry.from
          break
        }
      }

      // Fallback: if newServer wasn't in prev cycle (e.g. game 1 fresh start), default
      if (!mandatoryReceiver) {
        mandatoryReceiver = { team: otherTeam, player: 0 }
      }

      this.doublesInitialServer = newServer
      this.doublesInitialReceiver = mandatoryReceiver
    },
    ```
  </action>
  <verify>grep -c "setDoublesServerForNewGame" frontend/src/stores/matchStore.js</verify>
  <done>Command outputs ≥ 1</done>
</task>

<task type="auto">
  <name>Extend nextGame() for doubles between-game serve rules</name>
  <files>frontend/src/stores/matchStore.js</files>
  <action>
    The current `nextGame()` action resets scores and computes `swappedSides` and `initialServer` for singles. Extend it so that for doubles:
    1. It records the previous game's `doublesInitialServer`/`doublesInitialReceiver` on a new state field `prevDoublesInitialServer`/`prevDoublesInitialReceiver` (so the UI modal can pass them to `setDoublesServerForNewGame`)
    2. It determines `nextServingTeam` (the team that RECEIVED first in the previous game) and stores it as `doublesNextServingTeam`
    3. It does NOT auto-set `doublesInitialServer`/`doublesInitialReceiver` — that happens when the umpire makes their choice in the UI modal (Plan 2)

    First add two new state fields (add to state block and resetMatchState):
    ```js
    // For doubles between-game: the team that must serve first in next game
    doublesNextServingTeam: null,   // 1 or 2, set by nextGame(), consumed by modal
    // Previous game's initial server/receiver (needed for mandatory receiver lookup)
    prevDoublesInitialServer: null,
    prevDoublesInitialReceiver: null,
    ```
    Reset in resetMatchState():
    ```js
    this.doublesNextServingTeam = null
    this.prevDoublesInitialServer = null
    this.prevDoublesInitialReceiver = null
    ```

    Then modify `nextGame()`. Find the existing action and add a doubles branch. The existing singles code (`this.swappedSides = ...`, `this.initialServer = ...`) must remain. Add BEFORE the existing reset block (before `this.game++`):

    ```js
    nextGame() {
      if (this.isGameOver && this.game < (this.currentMatch?.bestOf || 7)) {
        // --- DOUBLES: record previous game serve state for between-game modal ---
        if (this.currentMatch?.type === 'doubles') {
          // The team that received first in THIS game serves first NEXT game
          this.doublesNextServingTeam = this.doublesInitialReceiver.team
          // Save context for mandatory receiver lookup in setDoublesServerForNewGame
          this.prevDoublesInitialServer = { ...this.doublesInitialServer }
          this.prevDoublesInitialReceiver = { ...this.doublesInitialReceiver }
        }

        this.game++
        this.p1Score = 0
        this.p2Score = 0
        this.isGameOver = false
        this.pointStarted = false
        this.decidingSwapDone = false

        // Requirement 5 & 6: Cycle sides and initial server (singles)
        this.swappedSides = this.game % 2 === 0
        this.initialServer = this.game % 2 === 0 ? 2 : 1
        this.server = this.initialServer

        // For doubles: also reset quadrant swap for new game start
        // (sides swapped via swappedSides above, within-side positions reset to default)
        if (this.currentMatch?.type === 'doubles') {
          this.p1Top = 0
          this.p1Bot = 1
          this.p2Top = 0
          this.p2Bot = 1
          // doublesInitialServer/Receiver will be set by setDoublesServerForNewGame()
          // when the umpire selects the server in the UI modal
        }

        // Initialize next game score in proxy
        this.scores[`g${this.game}`] = { p1: 0, p2: 0 }
      }
    },
    ```

    IMPORTANT: Replace the ENTIRE existing `nextGame()` action with the above — do not duplicate it.
  </action>
  <verify>grep -c "doublesNextServingTeam\|prevDoublesInitialServer\|prevDoublesInitialReceiver" frontend/src/stores/matchStore.js</verify>
  <done>Command outputs ≥ 6 (3 fields × appearing in state + reset + nextGame)</done>
</task>

<task type="auto">
  <name>Add deciding-game mid-game swap trigger in handleScore()</name>
  <files>frontend/src/stores/matchStore.js</files>
  <action>
    At the END of `handleScore()`, after the existing game-over check block but BEFORE the `pointStarted` reset at the bottom, add the deciding-game swap trigger:

    Find the existing end of handleScore() which looks like:
    ```js
      if (delta > 0) {
        this.pointStarted = false
      } else if (delta < 0 && this.p1Score < 11 && this.p2Score < 11) {
        this.isGameOver = false
        this.pointStarted = false
      }
    },
    ```

    Replace with:
    ```js
      if (delta > 0) {
        this.pointStarted = false
      } else if (delta < 0 && this.p1Score < 11 && this.p2Score < 11) {
        this.isGameOver = false
        this.pointStarted = false
      }

      // Deciding-game mid-game side swap: triggers when first team reaches 5 points
      const isDecidingGame = this.game === (this.currentMatch?.bestOf ?? 5)
      if (isDecidingGame && !this.decidingSwapDone && (this.p1Score === 5 || this.p2Score === 5)) {
        this.decidingSwapDone = true
        this.swappedSides = !this.swappedSides

        if (this.currentMatch?.type === 'doubles') {
          // Both pairs swap within their side (everyone moves to the new position)
          ;[this.p1Top, this.p1Bot] = [this.p1Bot, this.p1Top]
          ;[this.p2Top, this.p2Bot] = [this.p2Bot, this.p2Top]

          // Receiving pair gets ONE ADDITIONAL swap (to adjust receive rotation)
          // Determine which side the receiving team is on AFTER the swappedSides toggle
          const receivingTeam = this.doublesInitialReceiver.team
          const leftTeam = this.swappedSides ? 2 : 1
          if (receivingTeam === leftTeam) {
            // Receiver is now on the left — swap left players again
            ;[this.p1Top, this.p1Bot] = [this.p1Bot, this.p1Top]
          } else {
            // Receiver is now on the right — swap right players again
            ;[this.p2Top, this.p2Bot] = [this.p2Bot, this.p2Top]
          }
        }
        // For singles: only swappedSides toggled above — no within-side player swaps
      }
    },
    ```

    IMPORTANT: The trailing `,` closes the handleScore action — keep it.
  </action>
  <verify>grep -c "decidingSwapDone\|isDecidingGame" frontend/src/stores/matchStore.js</verify>
  <done>Command outputs ≥ 4</done>
</task>

## Success Criteria
- [ ] `doublesNextServingTeam`, `prevDoublesInitialServer`, `prevDoublesInitialReceiver` in state + reset
- [ ] `setDoublesServerForNewGame()` action correctly derives mandatory receiver from previous game cycle
- [ ] `nextGame()` records previous serve state for doubles and resets quadrant positions
- [ ] Deciding-game trigger fires at `p1Score === 5` or `p2Score === 5` in the final game only
- [ ] Singles deciding-game only toggles `swappedSides` (no player index swaps)
- [ ] Doubles deciding-game swaps all four quadrant indices then does one extra swap on the receiver side
- [ ] `cd frontend && npm run dev` starts without errors
