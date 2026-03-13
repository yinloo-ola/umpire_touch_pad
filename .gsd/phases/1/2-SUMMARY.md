# Plan 1.2 Summary: Frontend UI & Filtering for Table Number

## Accomplishments
- Updated `MatchFormView.vue` to include a `Table Number` input field.
- Updated `MatchFormView.vue`'s `buildPayload` logic to parse and send `tableNumber` as an integer to the backend.
- Updated `DashboardView.vue` (Admin) to include a `Table` filter input in the filter bar.
- Updated `DashboardView.vue` to display the table number in the matches table.
- Updated `MatchListView.vue` (Umpire) to include a `Filter by Table` input.
- Updated `MatchListView.vue` to display the table number in the matches list.
- Implemented computed filtering logic in both Admin and Umpire views for the `tableNumber` property.

## Verification Results
- `npm run build` succeeded, confirming no template or script errors in the updated Vue files.
- UI elements (inputs, filters, tags) were added following the existing design system.
