---
phase: 2
plan: 0
wave: 1
---

# Plan 2.0: Backend JWT Authentication

## Objective
Implement role-based JSON Web Token (JWT) authentication for the Go backend. Guard both the admin endpoints and umpire endpoints, using credentials loaded from the environment variables.

## Context
- .gsd/DECISIONS.md
- backend/cmd/server/main.go
- backend/internal/api/handlers.go

## Tasks

<task type="auto">
  <name>Implement Auth Service & JWT Generation</name>
  <files>
    - backend/internal/service/auth_svc.go
  </files>
  <action>
    - Add `github.com/golang-jwt/jwt/v5` dependency (`cd backend && go get github.com/golang-jwt/jwt/v5`).
    - Create `auth_svc.go` defining a service to validate usernames/passwords against `UMPIRE_USERNAME`, `UMPIRE_PASSWORD`, `ADMIN_USERNAME`, and `ADMIN_PASSWORD` env vars.
    - Implement `GenerateToken(role string)` which returns a signed JWT containing claims like `role: "admin"` or `role: "umpire"`. Use a `JWT_SECRET` env var (with a default fallback for local dev).
  </action>
  <verify>grep "GenerateToken" backend/internal/service/auth_svc.go</verify>
  <done>Auth service correctly issues tokens based on role.</done>
</task>

<task type="auto">
  <name>Create Login Endpoints & Auth Middleware</name>
  <files>
    - backend/internal/api/auth_handlers.go
    - backend/internal/api/middleware.go
    - backend/cmd/server/main.go
  </files>
  <action>
    - Create `auth_handlers.go` with a unified `/api/login` endpoint that accepts `{ "username": "...", "password": "..." }`, checks credentials against `auth_svc.go`.
    - Upon successful login, set an `HttpOnly`, `Secure` (if in prod/or toggleable), `SameSite=Strict` cookie containing the token (e.g. `Set-Cookie: jwt=<token>; ...`). Return a basic `{ "role": "..." }` JSON payload.
    - Create `/api/logout` that clears the cookie by setting an expired Max-Age.
    - Create `middleware.go` providing `RequireAuth(role string, next http.HandlerFunc)` that reads the JWT from `r.Cookie("jwt")`, validates it, and ensures the token claim role matches the requirement.
    - Update `cmd/server/main.go` / router logic to map `POST /api/login` and `POST /api/logout` as completely open.
    - **Crucial CORS update:** Update `cors.Options` in `main.go` to have `AllowCredentials: true`.
    - Wrap the existing `GET /api/matches` and `POST /api/match` endpoints with `RequireAuth(role...)`. Align `POST /api/match` to admin.
  </action>
  <verify>cd backend && go build ./cmd/server</verify>
  <done>JWT login endpoints and middleware compile securely.</done>
</task>

## Success Criteria
- [ ] Submitting correct creds to `/api/login` yields a valid JWT.
- [ ] Accessing protected endpoints without a token returns 401 Unauthorized.
- [ ] Admin backend calls (like Match Formulation) reject Umpire tokens.
