---
phase: 1
plan: 2
wave: 1
---

# Plan 1.2: Doubles Serve Rotation Engine

## Objective
Implement the A→X→B→Y→A doubles serve rotation as a formula-based computed getter, extend `handleScore()` to branch on match type, and add an umpire-correction override action for doubles. After this plan, the store knows the correct server and receiver at every point in a doubles game.

## Context
- `.gsd/SPEC.md` — § Rotation Logic (with formula), § Data Model Changes
- `frontend/src/stores/matchStore.js` — existing store; Plan 1.1 already added quadrant state

### The Rotation Formula
```
servesPassed:
  if (p1Score >= 10 && p2Score >= 10):  servesPassed = 10 + (p1Score + p2Score - 20)
  else:                                  servesPassed = floor((p1Score + p2Score) / 2)

cyclePos = servesPassed % 4

Given doublesInitialServer = A = { team, player }
      doublesInitialReceiver = X = { team, player }

B = { team: A.team, player: 1 - A.player }   // partner of A
Y = { team: X.team, player: 1 - X.player }   // partner of X

cycle[0] = { server: A, receiver: X }
cycle[1] = { server: X, receiver: B }
cycle[2] = { server: B, receiver: Y }
cycle[3] = { server: Y, receiver: A }

currentServer   = cycle[cyclePos].server
currentReceiver = cycle[cyclePos].receiver
```

This formula is idempotent — calling it with current scores always produces the correct answer. Umpire corrections simply recalibrate `doublesInitialServer`/`doublesInitialReceiver` to make the formula produce whatever the umpire selects, working backwards from the current `servesPassed`.

## Tasks

<task type="auto">
  <name>Add doubles initial server/receiver state + helper getters</name>
  <files>frontend/src/stores/matchStore.js</files>
  <action>
    In the `state: () => ({...})` block, add after the `decidingSwapDone` field from Plan 1.1:

    ```js
    // Doubles serve rotation: server/receiver at the START of this game
    // Each is { team: 1|2, player: 0|1 } where player is index into team1[]/team2[]
    doublesInitialServer: { team: 1, player: 0 },    // default: team1[0] serves
    doublesInitialReceiver: { team: 2, player: 0 },  // default: team2[0] receives
    ```

    In `resetMatchState()`, reset these:
    ```js
    this.doublesInitialServer = { team: 1, player: 0 }
    this.doublesInitialReceiver = { team: 2, player: 0 }
    ```

    In the `getters: { ... }` block, add after the four quadrant getters from Plan 1.1:

    ```js
    // Doubles: computed current server and receiver derived from formula
    doublesCurrentPair: (state) => {
      const A = state.doublesInitialServer
      const X = state.doublesInitialReceiver
      const B = { team: A.team, player: 1 - A.player }
      const Y = { team: X.team, player: 1 - X.player }

      const total = state.p1Score + state.p2Score
      let servesPassed
      if (state.p1Score >= 10 && state.p2Score >= 10) {
        servesPassed = 10 + (total - 20)
      } else {
        servesPassed = Math.floor(total / 2)
      }

      const cycle = [
        { server: A, receiver: X },
        { server: X, receiver: B },
        { server: B, receiver: Y },
        { server: Y, receiver: A },
      ]
      return cycle[servesPassed % 4]
    },

    // Doubles: is the current server's team on the LEFT side (considering swappedSides)?
    isLeftDoublesServer: (state) => {
      // doublesCurrentPair is another getter — but in (state)=> form we can't
      // call other getters with 'this'. Inline the calc instead.
      const A = state.doublesInitialServer
      const X = state.doublesInitialReceiver
      const B = { team: A.team, player: 1 - A.player }
      const Y = { team: X.team, player: 1 - X.player }
      const total = state.p1Score + state.p2Score
      let servesPassed = (state.p1Score >= 10 && state.p2Score >= 10)
        ? 10 + (total - 20)
        : Math.floor(total / 2)
      const cycle = [
        { server: A, receiver: X },
        { server: X, receiver: B },
        { server: B, receiver: Y },
        { server: Y, receiver: A },
      ]
      const serverTeam = cycle[servesPassed % 4].server.team
      // leftTeam is team1 when NOT swapped, team2 when swapped
      const leftTeam = state.swappedSides ? 2 : 1
      return serverTeam === leftTeam
    },

    // Doubles: name of the current server's player (for display in serve indicator)
    doublesServerName: (state) => {
      if (!state.currentMatch) return ''
      const A = state.doublesInitialServer
      const X = state.doublesInitialReceiver
      const B = { team: A.team, player: 1 - A.player }
      const Y = { team: X.team, player: 1 - X.player }
      const total = state.p1Score + state.p2Score
      let servesPassed = (state.p1Score >= 10 && state.p2Score >= 10)
        ? 10 + (total - 20)
        : Math.floor(total / 2)
      const cycle = [
        { server: A }, { server: X }, { server: B }, { server: Y },
      ]
      const sv = cycle[servesPassed % 4].server
      const team = sv.team === 1 ? state.currentMatch.team1 : state.currentMatch.team2
      return team[sv.player]?.name ?? ''
    },

    // Doubles: name of the current receiver's player
    doublesReceiverName: (state) => {
      if (!state.currentMatch) return ''
      const A = state.doublesInitialServer
      const X = state.doublesInitialReceiver
      const B = { team: A.team, player: 1 - A.player }
      const Y = { team: X.team, player: 1 - X.player }
      const total = state.p1Score + state.p2Score
      let servesPassed = (state.p1Score >= 10 && state.p2Score >= 10)
        ? 10 + (total - 20)
        : Math.floor(total / 2)
      const cycle = [
        { receiver: X }, { receiver: B }, { receiver: Y }, { receiver: A },
      ]
      const rv = cycle[servesPassed % 4].receiver
      const team = rv.team === 1 ? state.currentMatch.team1 : state.currentMatch.team2
      return team[rv.player]?.name ?? ''
    },
    ```

    CRITICAL: All four new getters use `(state) =>` arrow form — never `this.` inside them.
  </action>
  <verify>grep -c "doublesInitialServer\|doublesInitialReceiver\|doublesCurrentPair\|isLeftDoublesServer\|doublesServerName\|doublesReceiverName" frontend/src/stores/matchStore.js</verify>
  <done>Command outputs ≥ 12 (each name appears multiple times)</done>
</task>

<task type="auto">
  <name>Branch handleScore() for doubles + add setDoublesServer() umpire override</name>
  <files>frontend/src/stores/matchStore.js</files>
  <action>
    ### Modify handleScore()
    The current `handleScore()` has a "Recalculate Server" block that references `this.initialServer` (singles only). For doubles, this block is not needed — server is derived from getters. Wrap the singles-only server recalculation block in a type guard so it only runs for singles:

    Find this block in handleScore() (roughly lines 187-201):
    ```js
    // Recalculate Server
    const totalPoints = this.p1Score + this.p2Score
    let servesPassed = 0
    if (this.p1Score >= 10 && this.p2Score >= 10) {
      servesPassed = 10 + Math.max(0, totalPoints - 20)
    } else {
      servesPassed = Math.floor(totalPoints / 2)
    }
    if (servesPassed % 2 === 0) {
      this.server = this.initialServer
    } else {
      this.server = this.initialServer === 1 ? 2 : 1
    }
    ```

    Wrap it to only run for singles:
    ```js
    // Recalculate Server (singles only — doubles uses getter-based formula)
    if (this.currentMatch?.type !== 'doubles') {
      const totalPoints = this.p1Score + this.p2Score
      let servesPassed = 0
      if (this.p1Score >= 10 && this.p2Score >= 10) {
        servesPassed = 10 + Math.max(0, totalPoints - 20)
      } else {
        servesPassed = Math.floor(totalPoints / 2)
      }
      if (servesPassed % 2 === 0) {
        this.server = this.initialServer
      } else {
        this.server = this.initialServer === 1 ? 2 : 1
      }
    }
    ```

    No other changes to handleScore() in this plan.

    ### Add setDoublesServer() action
    After the existing `setServer()` action, add:

    ```js
    // Doubles umpire correction: set a specific player as server right now.
    // Recalibrates doublesInitialServer/Receiver so the formula produces this
    // player as server at the CURRENT score.
    setDoublesServer(serverTeam, serverPlayerIdx) {
      const total = this.p1Score + this.p2Score
      let servesPassed
      if (this.p1Score >= 10 && this.p2Score >= 10) {
        servesPassed = 10 + (total - 20)
      } else {
        servesPassed = Math.floor(total / 2)
      }
      const cyclePos = servesPassed % 4

      // The desired server at cyclePos. We need to find doublesInitialServer such that
      // cycle[cyclePos].server === { team: serverTeam, player: serverPlayerIdx }.
      //
      // The cycle relative to A (initial server) and X (initial receiver):
      // pos 0: server=A  pos 1: server=X  pos 2: server=B(partner of A)  pos 3: server=Y(partner of X)
      //
      // Working backwards from cyclePos to what A and X must be:
      const desired = { team: serverTeam, player: serverPlayerIdx }
      const partnerOfDesired = { team: serverTeam, player: 1 - serverPlayerIdx }

      // Other team
      const otherTeam = serverTeam === 1 ? 2 : 1
      // The receiver at cyclePos is determined by the cycle:
      // pos 0: receiver=X  pos 1: receiver=B  pos 2: receiver=Y  pos 3: receiver=A
      // So X's team and partner relationships:
      let newInitialServer, newInitialReceiver

      switch (cyclePos) {
        case 0:
          // server=A=desired, receiver=X (other team, we don't know which player; keep current receiver player)
          newInitialServer = desired
          newInitialReceiver = { team: otherTeam, player: this.doublesInitialReceiver.team === otherTeam
            ? this.doublesInitialReceiver.player : 0 }
          break
        case 1:
          // server=X=desired → A is on other team, B=partner of A
          // receiver=B → B's team is A's team = otherTeam → partner of A
          // X=desired, so X.team=serverTeam. A's team=otherTeam.
          newInitialReceiver = desired  // X is initial receiver
          newInitialServer = { team: otherTeam, player: this.doublesInitialServer.team === otherTeam
            ? this.doublesInitialServer.player : 0 }
          break
        case 2:
          // server=B=desired → B is partner of A → A=partnerOfDesired (same team)
          newInitialServer = partnerOfDesired
          newInitialReceiver = { team: otherTeam, player: this.doublesInitialReceiver.team === otherTeam
            ? this.doublesInitialReceiver.player : 0 }
          break
        case 3:
          // server=Y=desired → Y is partner of X → X=partnerOfDesired (same team)
          newInitialReceiver = partnerOfDesired  // X = partner of Y
          newInitialServer = { team: otherTeam, player: this.doublesInitialServer.team === otherTeam
            ? this.doublesInitialServer.player : 0 }
          break
      }
      this.doublesInitialServer = newInitialServer
      this.doublesInitialReceiver = newInitialReceiver
    },
    ```
  </action>
  <verify>grep -c "setDoublesServer\|type !== 'doubles'" frontend/src/stores/matchStore.js</verify>
  <done>Command outputs ≥ 2</done>
</task>

## Success Criteria
- [ ] `doublesInitialServer` and `doublesInitialReceiver` in state and reset by `resetMatchState()`
- [ ] `doublesCurrentPair`, `isLeftDoublesServer`, `doublesServerName`, `doublesReceiverName` getters exist
- [ ] `handleScore()` only runs singles server recalculation when `type !== 'doubles'`
- [ ] `setDoublesServer(team, playerIdx)` action exists
- [ ] `cd frontend && npm run dev` starts without errors
