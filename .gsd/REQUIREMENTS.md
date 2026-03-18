# Requirements

This file is the explicit capability and coverage contract for the project.

Use it to track what is actively in scope, what has been validated by completed work, what is intentionally deferred, and what is explicitly out of scope.

Guidelines:
- Keep requirements capability-oriented, not a giant feature wishlist.
- Requirements should be atomic, testable, and stated in plain language.
- Every **Active** requirement should be mapped to a slice, deferred, blocked with reason, or moved out of scope.
- Each requirement should have one accountable primary owner and may have supporting slices.
- Research may suggest requirements, but research does not silently make them binding.
- Validation means the requirement was actually proven by completed work and verification, not just discussed.

## Active

### R001 — Admin Card Editing Polish
- Class: admin/support
- Status: validated
- Description: Admin can edit cards with standardized type labels (YR1/YR2 instead of "Yellow-Red (1pt)"), see player names instead of indices, and optionally apply penalty points via helper buttons.
- Why it matters: Reduces confusion for admins editing matches post-hoc; ensures card data is consistent with umpire UI conventions.
- Source: research
- Primary owning slice: M001/S01
- Supporting slices: none
- Validation: browser — card dropdown shows Yellow/YR1/YR2/Red/Timeout, YR1/YR2 have gradient pills, player names display instead of indices
- Notes: Existing UI in `MatchDetailView.vue` has card editing but uses non-standard labels and shows indices.

### R002 — Public Match API
- Class: core-capability
- Status: validated
- Description: Unauthenticated API endpoints return matches grouped by status (completed, scheduled, live) with player names, scores, table numbers, and scheduled times.
- Why it matters: Enables public viewer page and potential future integrations without requiring auth.
- Source: user
- Primary owning slice: M001/S02
- Supporting slices: none
- Validation: curl + browser — GET /api/public/matches returns correct shape, public viewer consumes it successfully
- Notes: Must not expose internal state (state_json) or admin-only fields.

### R003 — Public Viewer Page
- Class: primary-user-loop
- Status: validated
- Description: A responsive public page shows matches in a tabbed layout (Completed/Scheduled/Live), styled like World Table Tennis. Visitors can filter by table number and scheduled time, and see a refresh button with last updated timestamp.
- Why it matters: Spectators at the venue can quickly find their table and see current scores without asking officials.
- Source: user
- Primary owning slice: M001/S03
- Supporting slices: M001/S02
- Validation: browser — tabs switch correctly, filters work, refresh updates timestamp, responsive at 375px/768px/1280px, WTT-style design verified
- Notes: Reference design: https://www.worldtabletennis.com/matches

## Deferred

### R010 — Expedite Rule Timer
- Class: core-capability
- Status: deferred
- Description: Implement expedite rule timer for matches exceeding time limits.
- Why it matters: Required for formal tournament play, but not blocking for current use case.
- Source: user
- Primary owning slice: none
- Supporting slices: none
- Validation: unmapped
- Notes: Deferred per `.planning/ROADMAP.md`.

### R011 — Player Profile Lookup by ID
- Class: admin/support
- Status: deferred
- Description: Look up player profiles by ID instead of hardcoded names.
- Why it matters: Enables richer player data and historical tracking.
- Source: user
- Primary owning slice: none
- Supporting slices: none
- Validation: unmapped
- Notes: Pre-existing debt item; deferred per `.planning/ROADMAP.md`.

### R012 — Edit Score History
- Class: admin/support
- Status: deferred
- Description: Admin can view and edit the full point-by-point score history.
- Why it matters: Useful for correcting errors, but complex to implement.
- Source: user
- Primary owning slice: none
- Supporting slices: none
- Validation: unmapped
- Notes: Deferred per `.planning/ROADMAP.md`.

## Out of Scope

### R020 — Multi-Device Real-Time Sync
- Class: integration
- Status: out-of-scope
- Description: Real-time sync between multiple umpire devices.
- Why it matters: Prevents scope creep; current sync model (umpire → backend) is sufficient.
- Source: inferred
- Primary owning slice: none
- Supporting slices: none
- Validation: n/a
- Notes: Explicitly excluded per `.planning/SPEC.md`.

### R021 — Player Profile Database
- Class: core-capability
- Status: out-of-scope
- Description: Centralized player database with IDs and historical stats.
- Why it matters: Prevents scope creep; current hardcoded names are sufficient for now.
- Source: user
- Primary owning slice: none
- Supporting slices: none
- Validation: n/a
- Notes: Explicitly excluded per `.planning/SPEC.md`.

## Traceability

| ID | Class | Status | Primary owner | Supporting | Proof |
|---|---|---|---|---|---|
| R001 | admin/support | validated | M001/S01 | none | browser |
| R002 | core-capability | validated | M001/S02 | none | curl + browser |
| R003 | primary-user-loop | validated | M001/S03 | M001/S02 | browser |
| R010 | core-capability | deferred | none | none | unmapped |
| R011 | admin/support | deferred | none | none | unmapped |
| R012 | admin/support | deferred | none | none | unmapped |
| R020 | integration | out-of-scope | none | none | n/a |
| R021 | core-capability | out-of-scope | none | none | n/a |

## Coverage Summary

- Active requirements: 0
- Mapped to slices: 3
- Validated: 3
- Unmapped active requirements: 0
