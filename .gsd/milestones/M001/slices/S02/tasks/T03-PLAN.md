---
estimated_steps: 4
estimated_files: 2
---

# T03: Create public handler and register route

**Slice:** S02 — Public Match API
**Milestone:** M001

## Description

Create a new public handler file with an HTTP handler for the `/api/public/matches` endpoint, and register it in SetupRoutes without authentication middleware. This exposes the public match data to unauthenticated clients.

## Steps

1. Create `backend/internal/api/public_handlers.go`:
   - Add `handleGetPublicMatches(w http.ResponseWriter, r *http.Request)` method on APIHandler
   - Call `h.svc.GetPublicMatches(r.Context())`
   - On error: log error, return HTTP 500 with error message
   - On success: set `Content-Type: application/json`, encode response as JSON
   - Add request logging (method, path, status counts)

2. Update `backend/internal/api/handlers.go`:
   - In `SetupRoutes()`, add new route registration:
     ```go
     mux.HandleFunc("GET /api/public/matches", handler.handleGetPublicMatches)
     ```
   - Do NOT wrap with `RequireAuth()` — this is intentionally public

3. Build and verify compilation:
   - `go build ./...`

4. Manual verification with curl:
   - Start server: `./server` (or `go run ./cmd/server`)
   - Test: `curl http://localhost:8080/api/public/matches | jq`
   - Verify response has `completed`, `scheduled`, `live` keys
   - Verify no auth cookie is required

## Must-Haves

- [ ] `handleGetPublicMatches` handler exists in `public_handlers.go`
- [ ] Route registered as `GET /api/public/matches` without `RequireAuth()` wrapper
- [ ] Returns 200 with JSON response on success
- [ ] Returns 500 with error message on failure
- [ ] Request works without authentication cookie

## Verification

- `go build ./...` compiles without errors
- `curl http://localhost:8080/api/public/matches` returns JSON with status groups
- Response includes `completed`, `scheduled`, `live` arrays
- No authentication required (test without cookie)

## Observability Impact

- Signals added: Log on each request with method, path, and match counts per status
- How a future agent inspects this: `curl` endpoint directly; check server logs
- Failure state exposed: HTTP 500 with error message; logged with context

## Inputs

- `backend/internal/api/handlers.go` — existing SetupRoutes function to modify
- `backend/internal/service/match_svc.go` — GetPublicMatches method from T02

## Expected Output

- `backend/internal/api/public_handlers.go` — new file with public handler
- `backend/internal/api/handlers.go` — updated SetupRoutes with public route
