---
phase: 5
plan: 2
wave: 2
---

# Plan 5.2: Umpire Match List & Resume Logic

## Objective
Update the Umpire's match selection UI to allow resuming incomplete matches and ensure the `matchStore` can reconstruct the state from the backend.

## Context
- .gsd/SPEC.md
- frontend/src/stores/matchStore.js
- frontend/src/components/MatchList.vue

## Tasks

<task type="auto">
  <name>Implement State Loading in matchStore</name>
  <files>
    <file>frontend/src/stores/matchStore.js</file>
  </files>
  <action>
    - Add `fetchMatchState(id)` action to `matchStore.js`.
    - This action should:
      1. Call `GET /api/matches/{id}`.
      2. Set `currentMatch`.
      3. Populate points, game scores, and cards/timeouts based on the returned data.
      4. Correctly set `matchStatus`, `isStarted`, etc.
      5. Ensure doubles quadrant indices and serve rotation are correctly derived from the scores (or stored state if available).
  </action>
  <verify>Check matchStore.js for fetchMatchState implementation</verify>
  <done>matchStore can load its state from the backend API.</done>
</task>

<task type="auto">
  <name>Update MatchList UI for Resume Flow</name>
  <files>
    <file>frontend/src/components/MatchList.vue</file>
  </files>
  <action>
    - Update the table to include a "Status" column.
    - Change the "Start" button in the confirmation modal to "Resume" if the match is not `unstarted`.
    - When clicking "Start/Resume":
      - If `unstarted`, call `selectMatch(match)` and go to `/umpire/setup`.
      - If already `in_progress` or similar, call `fetchMatchState(match.id)` and go straight to `/umpire/scoring` (or `/umpire/setup` if they need to check quadrants first).
    - Ensure the visual styling clearly distinguishes between match states.
  </action>
  <verify>Visual check of MatchList.vue</verify>
  <done>Umpires can identify and resume matches from the list.</done>
</task>

## Success Criteria
- [ ] Umpires can resume an `in_progress` match.
- [ ] Resumed matches have correct scores and cards.
- [ ] Match list shows status for each match.
