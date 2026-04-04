# Cloud Run + Turso Implementation Plan

> **REQUIRED SUB-SKILL:** Use the executing-plans skill to implement this plan task-by-task.

**Goal:** Package the Umpire Touch Pad application for Cloud Run deployment using Turso for storage.

**Architecture:** A single Go binary serving both the API and the static Vue frontend. The frontend is embedded at build time. The database connection is updated to support Turso/LibSQL.

**Tech Stack:** Go 1.24, Vue 3, LibSQL, Docker, Google Cloud Run.

---

### Task 1: Add LibSQL dependency to backend

**TDD scenario:** Modifying existing code (dependencies)

**Files:**
- Modify: `backend/go.mod`
- Modify: `backend/go.sum`

**Step 1: Add the dependency**
Run: `cd backend && go get github.com/tursodatabase/libsql-client-go/libsql`
Expected: `go.mod` updated.

**Step 2: Run tidy**
Run: `cd backend && go mod tidy`
Expected: PASS.

**Step 3: Commit**
Run: `git commit -am "feat(infra): add libsql dependency"`

---

### Task 2: Implement static file embedding and serving in Go backend

**TDD scenario:** New feature

**Files:**
- Create: `backend/internal/api/static.go`

**Step 1: Create the static file handler**

```go
package api

import (
	"embed"
	"io/fs"
	"net/http"
	"strings"
)

// StaticFS will be injected from main.go
var StaticFS embed.FS

func RegisterStaticRoutes(mux *http.ServeMux) {
	// Sub-folder "dist" from the embedded FS
	subFS, err := fs.Sub(StaticFS, "dist")
	if err != nil {
		// If dist is missing, we might be in dev mode without embed
		return
	}

	server := http.FileServer(http.FS(subFS))

	// Catch-all for SPA routing (send to index.html if file doesn't exist)
	mux.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		// Check if it's an API route - if so, let it fall through (it shouldn't get here though)
		if strings.HasPrefix(r.URL.Path, "/api/") {
			http.NotFound(w, r)
			return
		}

		// Try to serve the file
		f, err := subFS.Open(strings.TrimPrefix(r.URL.Path, "/"))
		if err == nil {
			f.Close()
			server.ServeHTTP(w, r)
			return
		}

		// Fallback to index.html for SPA
		r.URL.Path = "/"
		server.ServeHTTP(w, r)
	})
}
```

**Step 2: Commit**
Run: `git add backend/internal/api/static.go && git commit -m "feat(infra): add static file serving logic"`

---

### Task 3: Update main.go to support Turso/LibSQL connection and serve static files

**TDD scenario:** Modifying existing code

**Files:**
- Modify: `backend/cmd/server/main.go`

**Step 1: Update imports and add embed**

```go
import (
    "embed"
    "fmt"
    "log"
    "net/http"
    "os"
    "strings"
    "umpire-backend/db/migrations"
    "umpire-backend/internal/api"
    "umpire-backend/internal/service"
    "umpire-backend/internal/store"

    "github.com/pressly/goose/v3"
    _ "github.com/tursodatabase/libsql-client-go/libsql"
    _ "modernc.org/sqlite"
)

//go:embed dist/*
var distFS embed.FS
```

**Step 2: Update database connection logic**

```go
	dbURL := os.Getenv("TURSO_DATABASE_URL")
	if dbURL == "" {
		dbURL = "file:sqlite.db"
	}

	driver := "sqlite"
	if strings.HasPrefix(dbURL, "libsql://") || strings.HasPrefix(dbURL, "http://") || strings.HasPrefix(dbURL, "https://") {
		driver = "libsql"
		authToken := os.Getenv("TURSO_AUTH_TOKEN")
		if authToken != "" {
			dbURL = fmt.Sprintf("%s?authToken=%s", dbURL, authToken)
		}
	}

	db, err := sql.Open(driver, dbURL)
    // ...
```

**Step 3: Register static routes**

```go
	querier := store.New(db)
	svc := service.NewMatchService(querier, db)
	authSvc := service.NewAuthService()
	api.SetupRoutes(mux, svc, authSvc)

    // New: Serve static files
    api.StaticFS = distFS
    api.RegisterStaticRoutes(mux)
```

**Step 4: Verify compilation**
Run: `cd backend && mkdir -p dist && touch dist/placeholder && go build ./cmd/server`
Expected: PASS.

**Step 5: Commit**
Run: `git add backend/cmd/server/main.go && git commit -m "feat(infra): support turso and serve static files"`

---

### Task 4: Create multi-stage Dockerfile in root

**TDD scenario:** New feature

**Files:**
- Create: `Dockerfile`

**Step 1: Write the Dockerfile**

```dockerfile
# Stage 1: Build Frontend
FROM node:22-alpine AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build

# Stage 2: Build Backend
FROM golang:1.24-bookworm AS backend-builder
WORKDIR /app/backend
COPY backend/go.mod backend/go.sum ./
RUN go mod download
COPY backend/ ./
# Copy frontend build into backend/dist for embedding
COPY --from=frontend-builder /app/frontend/dist ./dist
RUN go build -o server ./cmd/server

# Stage 3: Runtime
FROM debian:bookworm-slim
RUN apt-get update && apt-get install -y ca-certificates && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY --from=backend-builder /app/backend/server ./server
EXPOSE 8080
ENV PORT=8080
CMD ["./server"]
```

**Step 2: Verify Docker build (local if possible, or just commit)**
Run: `docker build -t umpire-touch-pad .` (optional)
Expected: Docker image built successfully.

**Step 3: Commit**
Run: `git add Dockerfile && git commit -m "feat(infra): add multi-stage Dockerfile"`

---

### Task 5: Set up GitHub Actions deployment workflow

**TDD scenario:** New feature

**Files:**
- Create: `.github/workflows/deploy.yml`

**Step 1: Write the workflow**

```yaml
name: Deploy to Cloud Run

on:
  push:
    branches:
      - main
      - infra/cloud-run-turso

env:
  PROJECT_ID: ${{ secrets.GCP_PROJECT_ID }}
  SERVICE_NAME: umpire-touch-pad
  REGION: europe-west1

jobs:
  deploy:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      id-token: write

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Auth to Google Cloud
        id: auth
        uses: google-github-actions/auth@v2
        with:
          workload_identity_provider: ${{ secrets.GCP_WIF_PROVIDER }}
          service_account: ${{ secrets.GCP_WIF_SA_EMAIL }}

      - name: Set up Docker buildx
        uses: docker/setup-buildx-action@v3

      - name: Auth to Artifact Registry
        run: gcloud auth configure-docker europe-west1-docker.pkg.dev

      - name: Build and Push
        uses: docker/build-push-action@v5
        with:
          context: .
          push: true
          tags: europe-west1-docker.pkg.dev/${{ env.PROJECT_ID }}/umpire-touch-pad/server:${{ github.sha }}

      - name: Deploy to Cloud Run
        uses: google-github-actions/deploy-cloudrun@v2
        with:
          service: ${{ env.SERVICE_NAME }}
          image: europe-west1-docker.pkg.dev/${{ env.PROJECT_ID }}/umpire-touch-pad/server:${{ github.sha }}
          region: ${{ env.REGION }}
```

**Step 2: Commit**
Run: `git add .github/workflows/deploy.yml && git commit -m "feat(infra): add deployment workflow"`

---

### Task 6: Verify build and deployment setup instructions

**TDD scenario:** Documentation

**Files:**
- Modify: `AGENTS.md` (Update instructions for Cloud Run deployment)

**Step 1: Add deployment instructions to AGENTS.md**
Include details about required secrets and environment variables.

**Step 2: Commit**
Run: `git commit -am "docs(infra): update deployment instructions"`
