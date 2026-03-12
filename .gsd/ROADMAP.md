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

### Phase 1: [Name]
**Status**: Not Started
**Objective**: [Objective]

## Deferred (Future Milestones)

- Expedite rule timer
- Player profile lookup by ID
- Edit score history
