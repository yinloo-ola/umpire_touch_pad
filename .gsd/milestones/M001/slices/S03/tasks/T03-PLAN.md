---
estimated_steps: 5
estimated_files: 2
---

# T03: Responsive layout and WTT-inspired styling

**Slice:** S03 — Public Viewer Page
**Milestone:** M001

## Description

Apply mobile-first responsive design using CSS Grid for the match card layout, and style the page with WTT-inspired aesthetics that are lighter and more spectator-friendly than the admin/umpire interfaces.

## Steps

1. **Load and follow the frontend-design skill**:
   - Read `~/.gsd/agent/skills/frontend-design/SKILL.md`
   - Commit to a WTT-inspired aesthetic: clean, professional, spectator-focused with a lighter theme
   - Choose typography: distinctive but readable (avoid Inter, Roboto, Arial)
   - Define color palette: lighter background, accent colors for status, card shadows

2. **Implement mobile-first responsive grid**:
   - Default (mobile 375px): 1 column, cards stack vertically
   - Tablet (768px): 2 columns using `grid-template-columns: repeat(2, 1fr)`
   - Desktop (1280px+): 3 columns using `grid-template-columns: repeat(3, 1fr)`
   - Use CSS Grid with `gap: 1rem` (mobile) to `1.5rem` (desktop)
   - Pattern from responsive-design skill:
     ```css
     .match-grid {
       display: grid;
       grid-template-columns: 1fr;
       gap: 1rem;
     }
     @media (min-width: 768px) {
       .match-grid { grid-template-columns: repeat(2, 1fr); }
     }
     @media (min-width: 1280px) {
       .match-grid { grid-template-columns: repeat(3, 1fr); gap: 1.5rem; }
     }
     ```

3. **Style match cards with WTT-inspired design**:
   - Card container: white/light background, subtle shadow, rounded corners (12px)
   - Hover effect: slight lift (transform: translateY(-2px)), enhanced shadow
   - Typography: clear hierarchy — title bold, player names prominent, scores highlighted
   - Status indicators: color-coded badges (completed: purple/green, live: orange/red, scheduled: blue/gray)
   - Team layout: players on left and right, "vs" in center, scores below
   - Game scores: compact row showing each game, current game highlighted for live matches

4. **Style header and filters**:
   - Header: clean, minimal — title left, refresh button right, timestamp below
   - Filter bar: horizontal on desktop, stacked on mobile
   - Dropdowns: consistent styling with existing app (border-radius, focus states)
   - Tabs: pill-style or underline style with active state clearly visible

5. **Test responsive breakpoints**:
   - Use browser DevTools device emulation
   - Test at 375px (iPhone SE), 768px (tablet), 1280px (desktop)
   - Verify: no horizontal scroll, text readable, cards don't overflow
   - Check: filter bar wraps correctly on mobile

## Must-Haves

- [x] Responsive grid: 1 column (375px), 2 columns (768px), 3 columns (1280px+)
- [x] WTT-inspired card design with hover effects
- [x] Light, spectator-friendly color scheme (distinct from admin dark theme)
- [x] Clean typography with clear hierarchy
- [x] Status badges with color coding
- [x] No horizontal scroll at any viewport

## Verification

- Browser DevTools at 375px: 1 column, cards readable, no overflow
- Browser DevTools at 768px: 2 columns, layout balanced
- Browser DevTools at 1280px: 3 columns, full-width utilization
- Visual inspection: clean, professional design that looks like WTT (not generic AI slop)
- Hover effects work on cards
- Filters and tabs are usable on mobile

## Inputs

- `frontend/src/views/public/PublicView.vue` — Component from T02 with functional UI
- `frontend/src/style.css` — Existing CSS variables and patterns
- `~/.gsd/agent/skills/frontend-design/SKILL.md` — Design guidance for WTT-inspired aesthetics
- `.agents/skills/responsive-design/SKILL.md` — Mobile-first responsive patterns

## Expected Output

- `frontend/src/views/public/PublicView.vue` — Updated with responsive grid and WTT styling
- `frontend/src/style.css` — Optional additions for public page theming (if needed)

## Observability Impact

**What signals change:**
- Visual design transformation: new color palette (navy header, status-specific accent colors), premium card styling with hover effects, animated live indicator pulse
- Responsive breakpoints: grid columns change at 768px (2-col) and 1280px (3-col)

**How to inspect this task:**
- Browser DevTools: verify `grid-template-columns` on `.match-cards` at different viewport widths
- Browser DevTools: check computed styles for CSS custom properties (`--wtt-navy`, `--wtt-blue`, etc.)
- Visual: hover over match cards to observe lift animation and shadow enhancement
- Visual: switch tabs to see status-specific accent colors (green=completed, purple=scheduled, red=live)

**Failure state visibility:**
- If responsive breakpoints fail: cards may overflow or not reflow at expected viewport widths
- If hover effects fail: cards won't respond to mouse hover with lift/shadow animation
- If live indicator fails: no pulsing animation on live match cards
- All failures are visually observable in browser; no console logging required for styling issues
