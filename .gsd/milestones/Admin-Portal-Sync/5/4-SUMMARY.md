# Phase 5.4: Frontend Organization & Routing Refactor

## Completed Tasks
- Maintained core logic but restructured frontend files grouping features naturally.
- Moved `SetupView.vue`, `MatchList.vue` (renamed to `MatchListView.vue`), and `Touchpad.vue` (renamed to `TouchpadView.vue`) into `src/views/umpire/`.
- Moved `AdminDashboard.vue` (renamed to `DashboardView.vue`), `AdminMatchDetail.vue` (renamed to `MatchDetailView.vue`), `AdminMatchForm.vue` (renamed to `MatchFormView.vue`), and `AdminLogin.vue` (renamed to `LoginView.vue`) into `src/views/admin/`.
- Created unified components directories: `src/components/umpire`, `src/components/admin`, and `src/components/common`. Moves unattached widgets to proper directories.
- Refactored imports in all moved Vue component files (`TouchpadView.vue`, `TimeoutModal.vue`, `CardModal.vue`, `SetupView.vue`, etc.) to correctly reference relative paths for the subcomponents and stores.
- Updated `router/index.js` to properly reflect the new file paths.
- Ran frontend tests and build scripts (`vite build`), ensuring all assets bundle securely.

## Verification
- Running `npm run build` exits cleanly asserting that all relative link changes and template resolutions map perfectly.
- Unit tests that test frontend views (`SetupView.doubles.test.js`, `Touchpad.doubles.test.js`) are fixed to point to exactly correct locations and resolve without issue.
- A functional review ensures that no broken links or missing assets surface. 
