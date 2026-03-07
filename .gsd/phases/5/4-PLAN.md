---
phase: 5
plan: 4
wave: 3
---

# Plan 5.4: Frontend Organization & Routing Refactor

## Objective
Reorganize the frontend components and views into a logical directory structure to improve maintainability and separate concerns between Umpire and Admin portals.

## Objective
{What this plan delivers and why}

## Context
- frontend/src/router/index.js
- frontend/src/components/
- frontend/src/App.vue

## Tasks

<task type="auto">
  <name>Directory Restructuring</name>
  <files>
    <file>frontend/src/components/</file>
    <file>frontend/src/views/</file>
  </files>
  <action>
    - Create `frontend/src/views` if it doesn't exist.
    - Move "Page-level" components to `src/views`:
      - `MatchList.vue` -> `src/views/umpire/MatchListView.vue`
      - `SetupView.vue` -> `src/views/umpire/SetupView.vue`
      - `Touchpad.vue` -> `src/views/umpire/TouchpadView.vue`
      - `AdminDashboard.vue` -> `src/views/admin/DashboardView.vue`
      - `AdminMatchDetail.vue` -> `src/views/admin/MatchDetailView.vue`
      - `AdminMatchForm.vue` -> `src/views/admin/MatchFormView.vue`
      - `AdminLogin.vue` -> `src/views/admin/LoginView.vue`
    - Organize remaining components in `src/components`:
      - `common/`: Shared UI components (Modals, Buttons, etc.)
      - `umpire/`: Umpire-specific sub-components
      - `admin/`: Admin-specific sub-components (Layouts, etc.)
  </action>
  <verify>ls -R frontend/src/views</verify>
  <done>Frontend files are reorganized into logical directories.</done>
</task>

<task type="auto">
  <name>Update Routes and Imports</name>
  <files>
    <file>frontend/src/router/index.js</file>
    <file>frontend/src/main.js</file>
  </files>
  <action>
    - Update `router/index.js` to point to the new view locations.
    - Update all relative imports in the moved files.
    - Ensure `App.vue` and `main.js` correctly reference the refactored structure.
    - Fix any broken links or asset references.
  </action>
  <verify>npm run build (in frontend) to ensure no import errors</verify>
  <done>Application runs correctly with the new structure.</done>
</task>

## Success Criteria
- [ ] Codebase follows the new `views/` and `components/` separation.
- [ ] No broken routes or missing component errors.
- [ ] Admin and Umpire portals remain fully functional.
