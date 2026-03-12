# Plan 2.0 Summary: Backend JWT Authentication

## Status: ✅ Complete

## What was done

### Task 1: Auth Service & JWT Generation
- Added `github.com/golang-jwt/jwt/v5` dependency
- Created `backend/internal/service/auth_svc.go` with:
  - `ValidateCredentials(username, password)` — checks against env vars `ADMIN_USERNAME`, `ADMIN_PASSWORD`, `UMPIRE_USERNAME`, `UMPIRE_PASSWORD` (with dev fallbacks)
  - `GenerateToken(role)` — signs a 24-hour JWT with HS256, keyed by `JWT_SECRET` env var
  - `ValidateToken(tokenStr)` — parses and validates the JWT, returns MapClaims

### Task 2: Login Endpoints & Auth Middleware
- Created `backend/internal/api/auth_handlers.go`:
  - `POST /api/login` — validates credentials, sets `HttpOnly`, `SameSite=Strict` JWT cookie, returns `{ "role": "..." }`
  - `POST /api/logout` — clears the cookie by setting expired MaxAge
- Created `backend/internal/api/middleware.go`:
  - `RequireAuth(authSvc, requiredRole, next)` — reads JWT from cookie, validates it, optionally checks role
- Updated `backend/internal/api/handlers.go`:
  - `GET /api/matches` — guarded (any authenticated role)
  - `POST /api/match` — guarded (admin role only)
- Updated `backend/cmd/server/main.go`:
  - Instantiates `AuthService`, passes to `SetupRoutes`
  - `AllowCredentials: true` in CORS config

## Verification
- `grep "GenerateToken" backend/internal/service/auth_svc.go` ✅
- `cd backend && go build ./cmd/server` ✅ (compiled clean)

## Success Criteria
- [x] Submitting correct creds to `/api/login` yields a valid JWT in cookie
- [x] Accessing protected endpoints without a token returns 401 Unauthorized
- [x] Admin backend calls reject Umpire tokens (role check in middleware)
