# Phase 2: Admin Portal Frontend (UI) Research

## Objective
Determine the structural layout, routing architecture, and form requirements for the Admin Portal module within the existing Umpire Touchpad Vue SPA.

## Context & Needs
- **Dashboard:** Display existing matches (`status` unstarted, in_progress, completed). Currently, Phase 1 backend provides `GET /api/matches` (unstarted today). The Admin Portal may need broader fetch capabilities eventually.
- **Match Form:** A dynamic form capable of handling:
  - Match type: Singles (1v1) or Doubles (2v2)
  - Time/Event metadata
  - Player Names and Countries for Team 1 and Team 2 based on Match Type.
- **Match Edit:** View for updating/editing returned data from completed matches.

## Approach
1.  **Architecture Integration:** The existing Vue SPA lacks layout structuring. We should introduce an overarching Admin Layout wrapper that provides basic navigation (e.g. sidebar or navbar with "Dashboard", "New Match") specifically on `/admin` routes.
2.  **Routing:** 
    - `/admin` -> Admin Dashboard (List matches)
    - `/admin/match/new` -> Match Form Setup (Create operation mapping to `/api/match`)
    - `/admin/match/:id` -> Match View/Edit (Viewing games/scores/cards).
3.  **UI & State:** Admin module can use simple isolated state or standard Pinia/`fetch` calls. Since `matchStore` is heavily geared towards "live match operation", keeping Admin specific API calls localized to their corresponding components will prevent bloating the live umpire application logic.

## Technical Tasks
We can structure Phase 2 into two atomic Waves:
- **Wave 1: Layout & Core Routing**
  - Implement basic Admin router scaffolding in `frontend/src/router/index.js` aiming at a new `src/components/admin` folder.
  - Implement `AdminDashboard.vue` pulling matches and displaying them.
- **Wave 2: Data Input Modules**
  - Implement `AdminMatchForm.vue` connected to the `/api/match` POST endpoint. Provide reactive switching between Singles & Doubles arrays.
  - Implement `AdminMatchDetail.vue` stub for viewing or editing an existing match.
