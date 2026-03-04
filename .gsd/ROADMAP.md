# ROADMAP.md

> **Current Milestone**: Admin Portal & Database Synchronization
> **Goal**: Develop an admin portal for administrators to create and manage table tennis matches. Ensure all scheduled matches are stored in an SQLite database, and integrate the Umpire Touchpad to synchronize running match data (scores, games, and granted cards) with the database in real-time. The database driver must be CGO-free.

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
**Status**: ⬜ Not Started
**Objective**: Implement `PUT /matches/:id/sync` endpoint. Hook it up to the `matchStore.js` in the Umpire Touchpad so that whenever a score, game, or card changes, it asynchronously syncs the current state (or game state) to the database.

### Phase 4: Completed Match Operations
**Status**: ⬜ Not Started
**Objective**: Implement a backend API for finishing a match that formally sets the `matches.status` to `completed`. Combine it with the "End Match" feature in the touchpad to finalize the match summary with its games, scores, and penalty cards.

---

## Deferred (Future Milestones)

- Expedite rule timer
- Player profile lookup by ID
- Edit score history
