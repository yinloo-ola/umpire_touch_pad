# ROADMAP.md

> **Current Milestone**: Admin Portal & Database Synchronization — ✅ **COMPLETE**
> **Summary**: [Admin Portal & Database Synchronization Summary](milestones/Admin-Portal-Sync-SUMMARY.md)

---

## Must-Haves
- [ ] `matches`, `games`, and `cards` tables stored in an SQLite database (using a CGO-free driver, e.g., `modernc.org/sqlite`).
- [ ] Backend API endpoints to handle creating a new match, querying `getMatches` for unstarted matches for the current day, and updating match/game states.
- [ ] Dedicated Admin Portal frontend UI to create matches and manually edit/update completed matches.
- [ ] Real-time synchronization hooks from the Umpire Touchpad (Vue app) to the backend API.

---

## Phases

### Phase 1: Backend Database Setup & Core APIs
**Status**: ✅ Complete
**Objective**: Integrate a CGO-free SQLite driver (e.g., `modernc.org/sqlite`) into the Go backend. Define the schema and write migration scripts for `matches`, `games`, and `cards`. Implement `GET /matches` (to fetch today's unstarted matches) and `POST /matches` (to create matches).

### Phase 2: Admin Portal Frontend (UI)
**Status**: ✅ Complete
**Objective**: Build out the Admin frontend layout. Add a dashboard view to list matches, a form to create new matches (singles/doubles), and a view to update/edit completed match data.

### Phase 3: Live Match Sync API & Touchpad Integration
**Status**: ✅ Complete
**Objective**: Implement `PUT /matches/:id/sync` endpoint. Hook it up to the `matchStore.js` in the Umpire Touchpad so that whenever a score, game, or card changes, it asynchronously syncs the current state (or game state) to the database.

### Phase 3.5: Umpire Routing & UX Polish
**Status**: ✅ Complete
**Objective**: Refactor the frontend routing to group umpire-specific views under the `/umpire/` prefix. Update the navigation guards and login redirection logic to ensure a seamless experience for umpires, separating their workspace from the admin portal.

### Phase 4: Match Status Transitions & Completion
Status: ✅ Complete
Objective: Implement the full lifecycle of match status changes from match selection to final confirmation, ensuring the backend database reflects the current state of play.

### Phase 5: Match Lists & Frontend Organization
**Status**: ✅ Complete
**Objective**: Refine match selection logic to allow umpires to see and resume uncompleted matches from today's schedule, ensure the Admin Dashboard displays comprehensive match history, and reorganize frontend components for better structure.
**Depends on**: Phase 4

**Tasks**:
- [x] Backend infrastructure for resume & history (Plan 5.1)
- [x] Umpire match list refinement & resume logic (Plan 5.2)
- [x] Admin dashboard match history (Plan 5.3)
- [x] Frontend organization & routing refactor (Plan 5.4)

**Verification**:
- [ ] Emulate match selection and verify resume state.
- [ ] Verify historical matches appear in Admin Dashboard.
- [ ] Verify frontend build passes after reorganization.

---

## Deferred (Future Milestones)

- Expedite rule timer
- Player profile lookup by ID
- Edit score history
