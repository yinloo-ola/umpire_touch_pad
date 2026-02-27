.PHONY: dev dev-frontend dev-backend \
        lint lint-frontend lint-backend \
        fmt fmt-frontend fmt-backend \
        build build-frontend build-backend \
        install

# ── Directories ──────────────────────────────────────────────────────────────
FRONTEND_DIR := frontend
BACKEND_DIR  := backend

# ── Development ───────────────────────────────────────────────────────────────
## Start both frontend and backend dev servers concurrently
dev:
	$(MAKE) -j2 dev-frontend dev-backend

dev-frontend:
	@echo "▶ Starting frontend dev server…"
	cd $(FRONTEND_DIR) && npm run dev

dev-backend:
	@echo "▶ Starting backend dev server…"
	cd $(BACKEND_DIR) && go run .

# ── Linting ───────────────────────────────────────────────────────────────────
## Lint both frontend and backend
lint: lint-frontend lint-backend

lint-frontend:
	@echo "▶ Linting frontend…"
	cd $(FRONTEND_DIR) && npm run lint

lint-backend:
	@echo "▶ Linting backend…"
	cd $(BACKEND_DIR) && go vet ./...

# ── Formatting ───────────────────────────────────────────────────────────────
## Format both frontend and backend code
fmt: fmt-frontend fmt-backend

fmt-frontend:
	@echo "▶ Formatting frontend…"
	cd $(FRONTEND_DIR) && npm run fmt

fmt-backend:
	@echo "▶ Formatting backend…"
	cd $(BACKEND_DIR) && go fmt ./...

# ── Production Build ──────────────────────────────────────────────────────────
## Build both frontend and backend for production
build: build-frontend build-backend

build-frontend:
	@echo "▶ Building frontend…"
	cd $(FRONTEND_DIR) && npm run build

build-backend:
	@echo "▶ Building backend…"
	cd $(BACKEND_DIR) && go build -o ../bin/server .

# ── Setup ─────────────────────────────────────────────────────────────────────
## Install frontend dependencies
install:
	@echo "▶ Installing frontend dependencies…"
	cd $(FRONTEND_DIR) && npm install
