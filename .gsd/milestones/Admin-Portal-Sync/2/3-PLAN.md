---
phase: 2
plan: 3
wave: 2
---

# Plan 2.3: Admin Match Detail View

## Objective
Establish a read-only or stub view capable of displaying a breakdown summary of past matches or current live data, enabling Phase 4 editing later.

## Context
- .gsd/SPEC.md
- frontend/src/components/admin/AdminDashboard.vue
- frontend/src/router/index.js

## Tasks

<task type="auto">
  <name>Create Match Detail View</name>
  <files>
    - frontend/src/components/admin/AdminMatchDetail.vue
  </files>
  <action>
    - Create `AdminMatchDetail.vue` stub.
    - Read `route.params.id`. Since a `GET /api/match/:id` is deferred/stubbed, just display the parameter ID prominently and allow manual fallback viewing for now.
    - Outline basic headers: "Match Info", "Games", "Cards".
    - Include a simple "Back to Dashboard" router-link redirecting to `/admin`.
  </action>
  <verify>ls frontend/src/components/admin/AdminMatchDetail.vue</verify>
  <done>The AdminMatchDetail.vue component renders without errors outlining future structures.</done>
</task>

<task type="auto">
  <name>Wire Detail Route</name>
  <files>
    - frontend/src/router/index.js
    - frontend/src/components/admin/AdminDashboard.vue
  </files>
  <action>
    - Add child route `/match/:id` inside the `/admin` route block mapping to `AdminMatchDetail.vue`.
    - In `AdminDashboard.vue`, turn each row/item into a clickable context extending to `/admin/match/{match.id}`.
  </action>
  <verify>grep "path: 'match/:id'" frontend/src/router/index.js</verify>
  <done>Clicking a match in the Admin Dashboard takes you to the stub detail view parameterizing its UUID.</done>
</task>

## Success Criteria
- [ ] Users can browse individual match detail views based on their generated UUIDs off the Dashboard.
