# Decisions Register

<!-- Append-only. Never edit or remove existing rows.
     To reverse a decision, add a new row that supersedes it.
     Read this file at the start of any planning or research phase. -->

| # | When | Scope | Decision | Choice | Rationale | Revisable? |
|---|------|-------|----------|--------|-----------|------------|
| D001 | M001/S01 | convention | Card type strings | Standardize on `Yellow`, `YR1`, `YR2`, `Red`, `Timeout` | Simplifies UI rendering and state reconstruction from `state_json`; matches existing Umpire UI conventions | No |
| D002 | M001/S01 | pattern | Score sync on card edit | Manual with helper buttons | Admin edits are overrides. Scores shouldn't always auto-update, but "Apply Penalty Points" buttons provide convenience without forcing changes | Yes |
| D003 | M001/S01 | pattern | Player display in admin | Show player names from match object, not indices | "Player 1/2" is confusing; admin needs to see actual names to make informed edits | No |
| D004 | M001/S02 | api | Public API auth | No authentication required | Public viewer is for spectators; no auth barrier | No |
| D005 | M001/S02 | api | Public API response shape | Grouped by status (completed, scheduled, live) | Matches the tabbed UI layout; reduces client-side filtering | Yes |
| D006 | M001/S03 | pattern | Public viewer refresh | Manual refresh button + last updated timestamp | Simpler than auto-refresh; sufficient for spectators checking scores | Yes |
| D007 | M001/S03 | routing | Public route auth bypass | Routes not matching /admin or /umpire prefixes skip auth guard | Allows unauthenticated access to public viewer without modifying existing guard logic | Yes |
| D008 | M001/S03 | css | Responsive breakpoints | 768px (tablet) and 1280px (desktop) | Standard breakpoints that cover common device sizes; mobile-first approach | Yes |
| D009 | M001/S03 | design | WTT-inspired color palette | Navy header gradient, blue primary, status-specific accents (green/purple/red) | Clean, professional spectator experience distinct from admin dark theme | Yes |
