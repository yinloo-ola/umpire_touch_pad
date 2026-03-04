---
phase: 2
plan: 2
wave: 2
---

# Plan 2.2: Admin Match Creation Form

## Objective
Build out the UI form for Match Creation, handling both Singles and Doubles configurations properly.

## Context
- .gsd/SPEC.md
- frontend/src/components/admin/AdminDashboard.vue
- frontend/src/router/index.js

## Tasks

<task type="auto">
  <name>Create Match Form View</name>
  <files>
    - frontend/src/components/admin/AdminMatchForm.vue
  </files>
  <action>
    - Build `AdminMatchForm.vue` using Vue reactivity to handle dynamic input lists.
    - Fields: `title` (string, maps to API 'event'), `type` (radio: singles/doubles), `scheduled_date` (datetime-local mapping to 'time').
    - If Singles: show inputs for Player 1 (Name, Country) under Team 1 and Team 2.
    - If Doubles: show inputs for Player 1 and Player 2 (Name, Country) for both Team 1 and Team 2.
    - On submission, format payload correctly to `POST http://localhost:8080/api/match`:
      - Payload Format: `{ "type": "singles", "event": "Finals", "time": "2026-03-04T12:00:00Z", "bestOf": 5, "team1": [{"name":"P1"}], "team2": [{"name":"P2"}] }`
    - Upon HTTP Status OK/201, use `router.push('/admin')` to return to dashboard.
  </action>
  <verify>ls frontend/src/components/admin/AdminMatchForm.vue</verify>
  <done>AdminMatchForm handles API request assembly successfully and routes correctly.</done>
</task>

<task type="auto">
  <name>Wire Creation Route</name>
  <files>
    - frontend/src/router/index.js
    - frontend/src/components/admin/AdminDashboard.vue
  </files>
  <action>
    - Add child route `/match/new` inside the `/admin` route block mapping to `AdminMatchForm.vue`.
    - Add a `<router-link>` or `@click` action in `AdminDashboard.vue` pointing to the `/admin/match/new` path from the "Create Match" button.
  </action>
  <verify>grep "path: 'match/new'" frontend/src/router/index.js</verify>
  <done>The 'Create Match' functionality is connected via routing correctly.</done>
</task>

## Success Criteria
- [ ] Submitting the `AdminMatchForm` correctly POSTs a JSON object structurally matching the Phase 1 Backend requirements to `/api/match`.
- [ ] The dashboard navigates to the form naturally.
