# DECISIONS.md — Architecture Decision Record

> Log of key technical decisions made during this project.

---

## ADR-001: Centralize Doubles Logic in matchStore

**Date**: 2026-02-27
**Status**: Accepted

**Context**: Doubles-specific state (quadrant positions, individual server/receiver) could be kept in component-local data, but SetupView and Touchpad both need it.

**Decision**: All doubles state and rotation logic lives in `matchStore.js`. Components only call store actions and read store getters.

**Consequences**: Consistent state across views; allows hot-reload without losing positions; test logic is in one place.

---

## ADR-002: Quadrant Model as Player Indices

**Date**: 2026-02-27
**Status**: Accepted

**Context**: Need to track which player (team1[0] or team1[1]) is at which quadrant position.

**Decision**: Use `p1Top` and `p1Bot` (values 0 or 1) as indices into `team1[]`/`team2[]`. "Swap left" = `[p1Top, p1Bot] = [p1Bot, p1Top]`. This is simpler than duplicating player objects.

**Consequences**: Any computed player reference goes through the store getter. No data duplication risk.

---

## ADR-003: Rotation via Serve-Count Formula

**Date**: 2026-02-27
**Status**: Accepted

**Context**: The doubles serve cycle A→X→B→Y→A can be implemented as an event-driven chain (track last server) or as a formula (derive current server from total serves passed).

**Decision**: Use the formula approach (same pattern as existing singles logic): given `doublesInitialServer` and `servesPassed`, derive the current position in the 4-player cycle. This is idempotent and handles umpire corrections gracefully (recalibrate `doublesInitialServer/Receiver`).

**Consequences**: Easier to test, no risk of "getting out of sync" with event chain; umpire override is a simple recalibration.

---

## Phase 5 Decisions: Display Indicators

**Date:** 2026-03-03

### Scope & Layout
- **Placement**: Card indicators will be placed to the **right** of the left-side "Cards" button and to the **left** of the right-side "Cards" button.
- **Structure**: Two rows of indicators:
    - **Row 1 (Top)**: Timeout (T), Yellow (Y), Yellow-Red 1 (YR1), Yellow-Red 2 (YR2).
    - **Row 2 (Bottom)**: Coach Yellow (CY), Coach Red (CR).
- **Appearance**: Small, high-contrast indicators that mirror the colors and markings (1, 2, C, T) used in the Card Modal.
- **Interactivity**: Read-only visual feedback only.

### Side-Swapping
- Derivation of "Left" and "Right" teams based on `matchStore.swappedSides` will be handled in `Touchpad.vue` and passed to a reusable `CardIndicators.vue` component.

---

## Phase 1 Decisions

**Date:** 2026-03-04

### Scope
- **Database Location:** Configurable via environment variable.
- **Date Filtering:** `GET /matches` will be timezone-aware to correctly resolve "today's matches".

### Approach
- **Chose:** `sqlc` combined with standard `database/sql` using the `modernc.org/sqlite` driver, structured using Clean Architecture (API, Service, Datastore layers).
- **Reason:** `sqlc` provides type-safe code generation straight from SQL without the runtime bloat of a full ORM. It cleanly splits the Datastore concerns into an interface, forcing a strict separation between the API handlers, Business Logic API, and Data Access Logic.
- **Migrations:** Handled via `initDB()` on startup using simple `CREATE TABLE IF NOT EXISTS...` queries for the immediate small-scale setup.

### Constraints
- The backend API must map the flattened DB rows into the nested `Team1: []Player` and `Team2: []Player` JSON structure required by the existing frontend store.

---

## Phase 2 Decisions

**Date:** 2026-03-04

### Scope
- **Layout Approach:** Use a Top Navigation Bar in `AdminLayout.vue` instead of a sidebar, allowing more horizontal width for displaying match tables.
- **Security:** Requires an authentication layer for the admin panel. Will implement a simple login page and router guards to restrict access to `/admin` routes.

### Approach
- **State Management:** Creates and utilizes a new Pinia store (`adminStore.js`) for the Admin portal independently from the live-play `matchStore.js`. `adminStore` handles authentication state and fetching/caching the match list for the dashboard.
- **Timezone Discrepancy Recommendation:** Recommends formatting the HTML5 `<input type="datetime-local">` directly into naive string sequences matching local server time without "Z" trailing UTC identifiers before they hit the API. This guarantees SQLite string checks naturally align with the server's Start of Day/End of Day limits.
