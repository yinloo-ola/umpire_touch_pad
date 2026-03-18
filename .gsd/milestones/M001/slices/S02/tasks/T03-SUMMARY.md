---
id: T03
parent: S02
milestone: M001
provides:
  - Public HTTP handler for /api/public/matches endpoint
  - Route registration without authentication middleware
key_files:
  - backend/internal/api/public_handlers.go
  - backend/internal/api/handlers.go
key_decisions:
  - Used separate public_handlers.go file to isolate public endpoints from authenticated handlers
patterns_established:
  - Public routes registered directly on mux without RequireAuth() wrapper
  - Handler logging includes status counts for observability
observability_surfaces:
  - Log on each request with method, path, and match counts per status bucket
  - Direct curl to /api/public/matches for inspection
duration: 5m
verification_result: passed
completed_at: 2026-03-18
blocker_discovered: false
---

# T03: Create public handler and register route

**Added public handler for /api/public/matches endpoint with unauthenticated access.**

## What Happened

Created `public_handlers.go` with `handleGetPublicMatches` handler that calls the `GetPublicMatches` service method from T02. The handler logs request details with status counts and returns JSON responses. Updated `SetupRoutes` in `handlers.go` to register the route directly on the mux without the `RequireAuth()` wrapper, making it accessible to unauthenticated clients.

## Verification

- `go build ./...` — compilation passed
- `curl http://localhost:8080/api/public/matches` — returns 200 with JSON containing `completed`, `scheduled`, `live` arrays
- Verified response includes match objects with required fields (id, title, tableNumber, teams, games)
- Verified no internal fields (stateJson, remarks, currentGame) are exposed
- Verified endpoint works without authentication cookie

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | go build ./... | 0 | ✅ pass | ~2s |
| 2 | curl -s http://localhost:8080/api/public/matches \| jq | 0 | ✅ pass | ~0.1s |
| 3 | curl -w "%{http_code}" http://localhost:8080/api/public/matches | 0 | ✅ pass (200) | ~0.1s |

## Diagnostics

- Check server logs for `[handleGetPublicMatches]` entries showing request path and status counts
- Direct curl: `curl http://localhost:8080/api/public/matches | jq`
- Failure state: HTTP 500 with error message; logged with context

## Deviations

None — implemented exactly as planned.

## Known Issues

None.

## Files Created/Modified

- `backend/internal/api/public_handlers.go` — new file with handleGetPublicMatches handler
- `backend/internal/api/handlers.go` — updated SetupRoutes to register public route
