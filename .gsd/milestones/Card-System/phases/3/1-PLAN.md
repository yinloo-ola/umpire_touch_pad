---
phase: 3
plan: 1
wave: 1
---

# Plan 3.1: Timeout Logic & State Management

## Objective
Implement a dedicated timeout timer system in `matchStore.js` with specific lifecycle rules (1 per match, "Start of Play" restriction, non-overlapping with warmup).

## Context
- .gsd/SPEC.md
- .gsd/ROADMAP.md
- .gsd/phases/3/DECISIONS.md
- frontend/src/stores/matchStore.js

## Tasks

<task type="auto">
  <name>Extend Store State for Timeouts</name>
  <files>frontend/src/stores/matchStore.js</files>
  <action>
    Add to state:
    - `timeoutActive: false`
    - `timeoutTimeLeft: 60`
    - `timeoutCallingTeam: null` (track who called the current/last timeout: 1 or 2)
    
    Add these new fields to `resetMatchState`.
    
    Add these new fields to the `gameHistory` snapshot in `nextGame()` and restore them in `undoNextGame()`.
  </action>
  <verify>grep -q "timeoutActive" frontend/src/stores/matchStore.js</verify>
  <done>State is prepared and persistent through game boundaries.</done>
</task>

<task type="auto">
  <name>Implement Timeout Actions</name>
  <files>frontend/src/stores/matchStore.js</files>
  <action>
    Update `issueTimeout(teamNum)`:
    - Guard: Check `!this.pointStarted`.
    - Guard: Check `!this.timerActive` (no warmup overlap).
    - Guard: Check `!this.timeoutActive` (no double trigger).
    - Guard: Check `this.team1Timeout` / `this.team2Timeout` haven't already been used.
    - Set `this.timeoutActive = true`, `this.timeoutTimeLeft = 60`, `this.timeoutCallingTeam = teamNum`.
    - Set the respective used flag: `this.team1Timeout = true` or `this.team2Timeout = true`.
    - Start an interval that decrements `timeoutTimeLeft` down to 0 (stop at 0, do not auto-close).
    
    Update `revertTimeout(teamNum)`:
    - Reset the used flag: `this.team1Timeout = false` or `this.team2Timeout = false`.
    - If `timeoutCallingTeam === teamNum`, stop the interval and reset `timeoutActive = false`, `timeoutTimeLeft = 60`.
    
    Create `dismissTimeout()`:
    - Simply set `timeoutActive = false`.
  </action>
  <verify>grep -q "dismissTimeout" frontend/src/stores/matchStore.js</verify>
  <done>Timeout lifecycle logic is fully implemented with guards.</done>
</task>

<task type="auto">
  <name>Verify Timeout Logic</name>
  <files>frontend/src/stores/__tests__/matchStore.timeout.test.js</files>
  <action>
    Create a new test file `matchStore.timeout.test.js`:
    - Test that `issueTimeout` fails during a point.
    - Test that `issueTimeout` fails if already used for that team.
    - Test that `revertTimeout` resets the timer state.
    - Test that `undoNextGame` restores timeout availability.
  </action>
  <verify>npx vitest run frontend/src/stores/__tests__/matchStore.timeout.test.js --passWithNoTests</verify>
  <done>Timeout logic is empirically verified.</done>
</task>

## Success Criteria
- [ ] Timeouts can only be called when no point is active.
- [ ] Timeouts are limited to 1 per pair/player per match.
- [ ] Timeout timer is independent of warmup timer.
- [ ] Reverting a timeout makes it usable again and resets its timer.
- [ ] Undoing a game boundary correctly restores timeout availability/state from the previous game.
