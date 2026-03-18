---
phase: 3
plan: 2
wave: 1
---

# Plan 3.2: Frontend Deletion UI

## Objective
Enable administrators to delete matches from the Admin Dashboard with a confirmation dialog to prevent accidental deletion.

## Context
- .gsd/SPEC.md
- frontend/src/stores/adminStore.js
- frontend/src/views/admin/MatchDetailView.vue

## Tasks

<task type="auto">
  <name>Add deleteMatch to adminStore</name>
  <files>
    - frontend/src/stores/adminStore.js
  </files>
  <action>
    Implement `deleteMatch(id)` in `useAdminStore` which sends a `DELETE` request to `/api/matches/${id}`.
  </action>
  <verify>grep "deleteMatch" frontend/src/stores/adminStore.js</verify>
  <done>`deleteMatch` function is exported from `adminStore`.</done>
</task>

<task type="auto">
  <name>Implement Delete Match UI in Detail View</name>
  <files>
    - frontend/src/views/admin/MatchDetailView.vue
  </files>
  <action>
    1. Add a "Delete Match" button to the header actions in `MatchDetailView.vue`.
    2. Style the button with a "danger" appearance (red).
    3. Implement a confirmation state/modal. When clicked, show "Are you sure? This cannot be undone." with "Confirm Delete" and "Cancel" buttons.
    4. Upon confirmation, call `adminStore.deleteMatch` and redirect to the dashboard on success.
  </action>
  <verify>Build or visual check (manual verification in next phase)</verify>
  <done>Delete button exists, triggers confirmation, and deletes match on confirm.</done>
</task>

## Success Criteria
- [ ] Admin can delete a match from the `MatchDetailView`.
- [ ] Confirmation dialog prevents accidental deletion.
- [ ] Successful deletion redirects to the dashboard.
