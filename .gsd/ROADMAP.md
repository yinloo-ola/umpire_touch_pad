# ROADMAP.md

> **Current Milestone**: Match Management & Public Viewer
> **Goal**: Enable administrators to update matches, add table number properties, and provide a responsive public viewer page.

---

## Must-Haves
- [ ] Admin can manually update a match's status.
- [ ] Admin can edit scores of each game and add or delete games.
- [ ] Admin can manually add or remove cards.
- [ ] Ensure other match state components (timeouts, server/receiver allocations) are fully updateable.
- [ ] A match has a Table Number property (Admin creation, Admin filter, Umpire filter).
- [ ] A public viewable page showing complete, scheduled, and live matches without authentication.
- [ ] The public page must be responsive, following provided design references.

---

## Phases

### Phase 1: Table Number Properties
**Status**: ✅ Complete
**Objective**: Introduce the `table_number` field to the match database. Update the Admin match creation form to include it. Allow filtering by table number on both the Admin Dashboard and Umpire Match List.

### Phase 2: Admin Match Editing Capabilities (Scores & Status)
**Status**: ✅ Complete
**Objective**: Build backend endpoints and an administrative UI page to manually override a match's status, add or delete games, and edit any specific game score.

### Phase 3: Match Deletion
**Status**: ⬜ Not Started
**Objective**: Enable administrators to delete matches from the database via the Admin Dashboard. Include confirmation dialogs to prevent accidental deletion.

### Phase 4: Admin Match Editing Capabilities (Cards & Advanced Status)
**Status**: ⬜ Not Started
**Objective**: Extend the administrative UI to allow an admin to issue or remove penalty cards and timeout properties.

### Phase 5: Public Matches Dashboard (Backend & Structure)
**Status**: ⬜ Not Started
**Objective**: Create unauthenticated API endpoints that aggregate complete, scheduled, and live matches. Set up the Vue frontend routing and initial layout for the public viewer.

### Phase 6: Public Matches Dashboard (UI & Responsiveness)
**Status**: ⬜ Not Started
**Objective**: Implement the detailed responsive UI referencing the sample designs. Organize matches visually into sections (Completed, Scheduled, Live). Ensure styling matches the premium design and search/filtering inputs are functional.

## Deferred (Future Milestones)

- Expedite rule timer
- Player profile lookup by ID
- Edit score history
