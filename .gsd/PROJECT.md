# Project

## What This Is

Umpire Touchpad — a Vue 3 + Go application for officiating table tennis matches. Umpires use it on tablets to manage scoring, cards, timeouts, and serve rotation. Admins manage match schedules via a dashboard. Spectators view match status on a public page.

## Core Value

Umpires can officiate matches quickly and accurately with touch-friendly controls and automatic ITTF-compliant serve rotation. Spectators can find their table and see live scores without asking officials.

## Current State

**Completed:**
- Full umpire workflow: match list → setup → live scoring with ITTF doubles rotation
- Card system: timeouts, yellow/red cards with penalty point logic
- Admin dashboard: create matches, edit scores/status, delete matches, table number filtering
- Admin card editing: standardized types (Yellow/YR1/YR2/Red/Timeout), player names, gradient pills
- Match persistence + real-time sync to SQLite backend
- Public API endpoints (unauthenticated): GET /api/public/matches returns matches grouped by status
- Public viewer page: responsive WTT-style design with tabs, filters, and refresh at /public

**In progress:**
- Nothing — M001 complete

## Architecture / Key Patterns

- **Frontend:** Vue 3 + Pinia + Vue Router, vanilla CSS with design tokens
- **Backend:** Go with SQLite (sqlc-generated queries)
- **State:** Centralized in `matchStore.js`; components call actions
- **Sync:** Umpire touchpad syncs to backend after every point/event
- **Auth:** Cookie-based session auth for admin/umpire routes; public routes bypass auth

## Capability Contract

See `.gsd/REQUIREMENTS.md` for the explicit capability contract, requirement status, and coverage mapping.

## Milestone Sequence

- [x] M001: Match Management & Public Viewer — Complete admin card editing, add public API and responsive viewer page
