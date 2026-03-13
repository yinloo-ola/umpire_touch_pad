---
phase: 1
plan: 2
wave: 1
---

# Plan 1.2: Frontend UI & Filtering for Table Number

## Objective
Update the Vue frontend to allow administrators to assign a `tableNumber` during match creation, and add filtering capabilities on both the Admin Dashboard and the Umpire Match List.

## Context
- .gsd/SPEC.md
- frontend/src/views/admin/MatchFormView.vue
- frontend/src/views/admin/DashboardView.vue
- frontend/src/views/umpire/MatchList.vue
- frontend/src/stores/adminStore.js

## Tasks

<task type="auto">
  <name>Update Match Creation Form</name>
  <files>
    frontend/src/views/admin/MatchFormView.vue
    frontend/src/stores/adminStore.js
  </files>
  <action>
    - Add a `tableNumber` input field to the Match Details section.
    - Validate that it gets passed in the `buildPayload` object payload (string integer or text).
    - Ensure `adminStore.js` correctly sends this parameter down to the `POST /api/matches` endpoint.
  </action>
  <verify>npm run build</verify>
  <done>Frontend builds successfully with new payload mapping</done>
</task>

<task type="auto">
  <name>Dashboard & Umpire Match Filtering</name>
  <files>
    frontend/src/views/admin/DashboardView.vue
    frontend/src/views/umpire/MatchList.vue
  </files>
  <action>
    - Add a `tableNumber` filter dropdown or input field to both the Admin Dashboard (`DashboardView.vue`) and the Umpire Match List (`MatchList.vue`).
    - Use the Vue computed list to filter matches where `match.tableNumber` partially limits the full listing, if a filter is selected.
    - Ensure the UI renders `Table Number` properly in the match card or list headers.
  </action>
  <verify>npm run build</verify>
  <done>Filtered match components display properly and correctly hide unmatched options</done>
</task>

## Success Criteria
- [ ] Table number input exists when an Admin creates a match.
- [ ] List views render matching constraints successfully depending on chosen Table Number input.
