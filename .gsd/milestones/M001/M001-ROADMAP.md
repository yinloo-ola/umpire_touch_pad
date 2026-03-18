# M001: Match Management & Public Viewer

**Vision:** Complete admin card editing with standardized types and player names, add unauthenticated public API endpoints, and ship a responsive public viewer page styled like World Table Tennis so spectators can find their table and see live scores.

## Success Criteria

- Admin can edit cards with player names displayed (not indices) and standardized type labels (YR1, YR2)
- Unauthenticated GET request to `/api/public/matches` returns matches grouped by status with player names, scores, table numbers, and times
- Visitor can open `/public` in a browser, see matches in a tabbed layout, filter by table number and time, and refresh to see updated scores with a timestamp

## Key Risks / Unknowns

- **Responsive design complexity** — Matching WTT-style layout on mobile requires careful CSS; may need iteration on breakpoints and card sizing

## Proof Strategy

- **Responsive design complexity** → retire in S03 by building the actual public viewer page and testing on mobile/tablet/desktop viewports

## Verification Classes

- Contract verification: Vitest tests for admin card editing component, API response shape tests
- Integration verification: Browser test loading public page and verifying data flows from real API
- Operational verification: Manual UAT on mobile/tablet/desktop viewports
- UAT / human verification: Visual match against WTT reference design

## Milestone Definition of Done

This milestone is complete only when all are true:

- Admin card editing UI shows player names and standardized type labels
- Public API returns correct match data without authentication
- Public viewer page renders on mobile/tablet/desktop with WTT-style layout
- Filters (table number, time) work and refresh updates the displayed data
- Success criteria are re-checked against live behavior in browser

## Requirement Coverage

- Covers: R001 (admin card polish), R002 (public API), R003 (public viewer page)
- Partially covers: none
- Leaves for later: R010 (expedite timer), R011 (player profiles), R012 (score history) — all deferred
- Orphan risks: none

## Slices

- [x] **S01: Admin Card Editing Polish** `risk:low` `depends:[]`
  > After this: Admin can edit cards in MatchDetailView with player names (not indices), standardized type dropdown (Yellow/YR1/YR2/Red/Timeout), and optional "Apply Penalty Points" helper buttons

- [x] **S02: Public Match API** `risk:low` `depends:[]`
  > After this: GET `/api/public/matches` returns `{completed: [...], scheduled: [...], live: [...]}` with player names, scores, table numbers, scheduled times — no auth required

- [x] **S03: Public Viewer Page** `risk:medium` `depends:[S02]`
  > After this: Visitor opens `/public`, sees WTT-style tabbed layout with match cards, filters by table number and time, clicks refresh to update data with last-updated timestamp — works on mobile/tablet/desktop

## Boundary Map

### S01 → (none)

Produces:
- `MatchDetailView.vue` — card editing UI with standardized types and player name display
- Card type enum: `Yellow`, `YR1`, `YR2`, `Red`, `Timeout` (consistent with umpire UI)

Consumes:
- nothing (standalone admin feature)

### S02 → S03

Produces:
- `GET /api/public/matches` — returns `{completed: [...], scheduled: [...], live: [...]}` where each match has `{id, title, scheduledDate, status, tableNumber, team1: [{name, country}], team2: [{name, country}], games: [{gameNumber, team1Score, team2Score, status}]}`

Consumes:
- `matches` table (SQLite)
- `games` table (SQLite)
- `cards` table (SQLite) — for timeout status

### S03 → (end user)

Produces:
- `/public` route — Vue page with tabbed layout, match cards, filters, refresh button
- Responsive CSS — works on mobile (375px), tablet (768px), desktop (1280px+)

Consumes from S02:
- `GET /api/public/matches` — fetches match data for display
