# Debug Session: Umpire List UI Refinement

## Symptom
1. **Filter Visibility**: Under the "Filter by Table" dropdown, the table numbers (options) appear white or invisible against the background.
2. **Filter Alignment**: The "Filter by Table" box is not correctly aligned with the matches table below (likely right-aligned instead of left, or off-center).
3. **Header Missing/Misaligned**: The "Welcome Umpire..." header is currently missing or poorly positioned relative to the match list table. It should be left-aligned with the table.

**When:** After replacing the numeric input with a dropdown filter in Phase 1 cleanup.
**Expected:** High-contrast text in dropdowns; left-aligned headers and filters; consistent UI hierarchy.
**Actual:** Invisible dropdown text; misaligned layout components.

### Attempt 2: Stacking and Alignment Refinements
- Stacked the "Welcome" header and "Filter by Table" on separate lines.
- Left-aligned both elements with the match table.
- Increased `max-width` of the main containers to `1200px` to reduce empty side space.
- Fixed the logo text color for better visibility in the light theme.
- Removed the background/border from the filter box for a cleaner look.

## Resolution

**Root Cause:** 
1. Header and filter were competing for horizontal space in a flex row.
2. Global `max-width: 1000px` was leaving too much "empty space" on modern wide displays.
3. Suboptimal contrast on logo text and dropdown elements in light mode.

**Fix:** 
1. Changed `list-header-row` to `flex-direction: column` and `align-items: flex-start`.
2. Updated `main-container` and `glass-panel` to `max-width: 1200px`.
3. Improved visibility of logo and dropdown options.
4. Simplified filter box styling.

**Verified:**
- Umpire Match List view: Clean stacked layout, high contrast, and better space utilization.
- Screenshots: [umpire_list_final_v7.png](file:///Volumes/Ext/code/personal/umpire_touch_pad/umpire_list_final_v7.png) and [admin_dashboard_final_v7.png](file:///Volumes/Ext/code/personal/umpire_touch_pad/admin_dashboard_final_v7.png).
