# Design: Umpire Touch Pad Hosting (Cloud Run + Turso)

This document outlines the architecture, deployment, and configuration for hosting the Umpire Touch Pad web application on Google Cloud Run (Free Tier) and using Turso Cloud DB (Free Tier) for the database.

## Architecture

The application will be packaged into a single Docker container.

- **Frontend:** Vue 3 + Vite, built into static assets in the `dist/` folder.
- **Backend:** Go 1.24, which will:
  - Serve the static frontend assets from `dist/` using Go's `embed` package.
  - Provide the API for match scoring and management.
  - Connect to a Turso database (LibSQL) for persistent storage.
- **Database:** Turso Cloud DB (LibSQL), with a local `libsql.db` file for development.
- **Hosting:** Google Cloud Run (Free Tier).

## Components

### 1. Unified Docker Image

A multi-stage Dockerfile will handle the full build process:
- **Build Frontend:** Uses `node` to run `npm run build`.
- **Build Backend:** Uses `golang` to compile the Go binary, embedding the `dist/` folder.
- **Final Runtime:** A minimal `debian:bookworm-slim` or `alpine` image running the Go binary.

### 2. LibSQL Driver Integration

The Go backend will switch from `modernc.org/sqlite` to `github.com/tursodatabase/libsql-client-go/libsql`.
- **Connection String:**
  - Local: `file:libsql.db` (or `http://localhost:8080` if using `turso dev`).
  - Production: `libsql://<db-name>-<user>.turso.io`.
- **Authentication:** Uses the `TURSO_AUTH_TOKEN` environment variable for cloud connections.

### 3. CI/CD Pipeline (GitHub Actions)

A GitHub Actions workflow will automate the build and deployment:
- **Authentication:** Uses **Workload Identity Federation (WIF)** for keyless authentication to Google Cloud.
- **Build & Push:** Builds the Docker image and pushes it to **Google Artifact Registry**.
- **Deploy:** Deploys the image to **Cloud Run**.

## Environment Configuration

The following environment variables will be managed in the Cloud Run service console:
- `TURSO_DATABASE_URL`: The Turso Cloud URL.
- `TURSO_AUTH_TOKEN`: The Turso Auth Token.
- `PORT`: The port for the Go server (defaulting to 8080).

## Local Development Flow

1. Install the Turso CLI: `brew install tursodatabase/tap/turso`.
2. Run migrations locally: `cd backend && go run ./cmd/server` (will create `libsql.db`).
3. For a production-like environment: `turso dev --db-file libsql.db` and set `TURSO_DATABASE_URL=http://localhost:8080`.

## Implementation Tasks

- [ ] Update `backend/go.mod` and `go.sum` with `libsql` driver.
- [ ] Update `backend/cmd/server/main.go` to use `libsql` and `embed`.
- [ ] Create a multi-stage `Dockerfile` in the repository root.
- [ ] Create a `deploy.yml` GitHub Actions workflow.
- [ ] Provide `gcloud` commands for WIF and Artifact Registry setup.
- [ ] Provide instructions for creating the Turso database and getting credentials.
