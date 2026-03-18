# Plan 3.2 Summary: Frontend Deletion UI

Enabled administrators to delete matches from the Admin Dashboard with a confirmation dialog.

## Changes
- **Store**: Added `deleteMatch(id)` to `useAdminStore` in `frontend/src/stores/adminStore.js`.
- **UI**: 
  - Added a "Delete Match" button to `MatchDetailView.vue` header.
  - Implemented `showDeleteConfirm` state to show a confirmation prompt within the header.
  - Implemented `confirmDelete` function to handle the deletion request and redirect to the admin dashboard.
  - Added CSS styles for the delete button and confirmation group.

## Verification
- Verified `deleteMatch` exists in `adminStore.js`.
- Visual check of the code in `MatchDetailView.vue` confirms the integration of the button and logic.
