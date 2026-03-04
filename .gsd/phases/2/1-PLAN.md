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
  <name>Create Admin Store & Auth Logic</name>
  <files>
    - frontend/src/stores/adminStore.js
    - frontend/src/components/admin/AdminLogin.vue
  </files>
  <action>
    - Create `adminStore.js` (Pinia) to manage an `isAuthenticated` boolean and cache `matches` fetched from the API.
    - Implement an `adminStore.login(password)` function that checks against a hardcoded string (e.g. `'admin123'`) and sets `isAuthenticated = true` if successful.
    - Implement `adminStore.fetchMatches()` which calls `http://localhost:8080/api/matches` and stores the resulting array.
    - Create `AdminLogin.vue` showing a simple password input and login button, calling `adminStore.login()`.
  </action>
  <verify>ls frontend/src/stores/adminStore.js frontend/src/components/admin/AdminLogin.vue</verify>
  <done>adminStore.js structure validates.</done>
</task>

<task type="auto">
  <name>Create Admin Layout & Dashboard Structure</name>
  <files>
    - frontend/src/components/admin/AdminLayout.vue
    - frontend/src/components/admin/AdminDashboard.vue
  </files>
  <action>
    - Create `frontend/src/components/admin` folder natively if it doesn't exist.
    - `AdminLayout.vue`: Implement a wrapper featuring a fixed **top bar navigation** with links to `Dashboard` and `New Match`, plus an `Exit to App` button returning to `/`. Use `<router-view />` below the top navigation to host internal admin content.
    - `AdminDashboard.vue`: Display the cached `matches` from `adminStore` in a table view. Call `adminStore.fetchMatches()` on mount. Include a placeholder button or router-link for "Create Match".
  </action>
  <verify>ls frontend/src/components/admin/AdminLayout.vue frontend/src/components/admin/AdminDashboard.vue</verify>
  <done>AdminLayout and AdminDashboard Vue component files are written correctly.</done>
</task>

<task type="auto">
  <name>Register Admin Routes & Guards</name>
  <files>
    - frontend/src/router/index.js
  </files>
  <action>
    - Import `AdminLayout`, `AdminDashboard`, and `AdminLogin`.
    - Map routes:
      - `/admin/login` -> `AdminLogin`
      - `/admin` -> `AdminLayout` (redirects empty to `/admin/dashboard`)
        - children: `path: 'dashboard'` -> `AdminDashboard`
    - Implement a `router.beforeEach` globally. If the target route starts with `/admin` and is NOT `/admin/login`, check `adminStore().isAuthenticated`. If false, redirect to `/admin/login`.
  </action>
  <verify>grep "beforeEach" frontend/src/router/index.js</verify>
  <done>Router logic prevents unwanted access to the administration dashboard without auth.</done>
</task>

## Success Criteria
- [ ] Unauthorized users attempting to hit `/admin` are redirected to `/admin/login`.
- [ ] Top-nav `AdminLayout` cleanly displays the `AdminDashboard`.
- [ ] `AdminDashboard` renders fetched list of stored matches from `adminStore`.
