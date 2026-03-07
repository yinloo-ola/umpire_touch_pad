---
phase: 5
plan: 3
wave: 2
---

# Plan 5.3: Admin Dashboard History

## Objective
Enhance the Admin Dashboard to display comprehensive match history and improve the management interface.

## Context
- .gsd/SPEC.md
- frontend/src/stores/adminStore.js
- frontend/src/components/admin/AdminDashboard.vue

## Tasks

<task type="auto">
  <name>Update adminStore for History</name>
  <files>
    <file>frontend/src/stores/adminStore.js</file>
  </files>
  <action>
    - Update `fetchMatches()` to accept an optional `history` boolean.
    - If `history` is true, call `GET /api/matches?history=true`.
    - Update state management if separate lists for "Today" and "History" are desired, or just use filters on the client side.
  </action>
  <verify>Check adminStore.js for fetchMatches changes</verify>
  <done>adminStore can fetch historical match data.</done>
</task>

<task type="auto">
  <name>Enhance Admin Dashboard UI</name>
  <files>
    <file>frontend/src/components/admin/AdminDashboard.vue</file>
  </files>
  <action>
    - Add a "History" toggle or filter to show all matches vs today's matches.
    - Add a "Status" filter (e.g., Scheduled, In Progress, Completed).
    - Ensure the "Status" badges are consistently colored across the app.
    - Improve the layout to handle larger lists of matches effectively.
  </action>
  <verify>Visual check of AdminDashboard.vue</verify>
  <done>Admin Dashboard displays match history with filtering.</done>
</task>

## Success Criteria
- [ ] Admins can view completed matches from previous days.
- [ ] Filtering by status is functional.
- [ ] Status badges are visually distinct and accurate.
