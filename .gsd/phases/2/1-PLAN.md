---
phase: 2
plan: 1
wave: 1
---

# Plan 2.1: Admin Routing & Dashboard Setup

## Objective
Establish the Admin Portal layout and a central Dashboard view listing all matches, separated cleanly from the main umpire tools.

## Context
- .gsd/SPEC.md
- .gsd/ARCHITECTURE.md
- frontend/src/router/index.js
- .gsd/ROADMAP.md

## Tasks

<task type="auto">
  <name>Create Admin Layout & Dashboard Structure</name>
  <files>
    - frontend/src/components/admin/AdminLayout.vue
    - frontend/src/components/admin/AdminDashboard.vue
  </files>
  <action>
    - Create `frontend/src/components/admin` folder natively if it doesn't exist.
    - `AdminLayout.vue`: Implement a basic wrapper featuring a fixed sidebar or top nav bar with links to `Admin Dashboard` and an `Exit to App` routing back to `/`. Ensure a `<router-view />` manages internal admin content.
    - `AdminDashboard.vue`: Connect a `fetch` directly to `http://localhost:8080/api/matches`, displaying a table of matches similar to `MatchList.vue` but with styling fit for a management console. Include a placeholder button for "Create Match".
  </action>
  <verify>ls frontend/src/components/admin/AdminLayout.vue frontend/src/components/admin/AdminDashboard.vue</verify>
  <done>AdminLayout and AdminDashboard Vue component files are written correctly.</done>
</task>

<task type="auto">
  <name>Register Admin Routes</name>
  <files>
    - frontend/src/router/index.js
  </files>
  <action>
    - Import `AdminLayout` and `AdminDashboard`.
    - Add a new top-level route `/admin` pointing to the `AdminLayout` component.
    - Map children routes under `/admin`:
      - Path `''` (empty) to `AdminDashboard` with a name of `admin-dashboard`.
  </action>
  <verify>grep "path: '/admin'" frontend/src/router/index.js</verify>
  <done>The router correctly nests the admin dashboard inside the admin layout.</done>
</task>

## Success Criteria
- [ ] `/admin` route loads successfully.
- [ ] `AdminDashboard` displays matches from the API.
- [ ] Users can navigate between the main MatchList app and the Admin Portal.
