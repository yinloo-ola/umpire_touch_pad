.PHONY: dev dev-frontend dev-backend turso-dev turso-stop \
        lint lint-frontend lint-backend \
        fmt fmt-frontend fmt-backend \
        build build-frontend build-backend \
        test install

# ── Turso Dev ───────────────────────────────────────────────────────────────
TURSO_URL      := http://127.0.0.1:8080
TURSO_PID_FILE := .turso-dev.pid

## Start local Turso dev database server
turso-dev:
	@echo "▶ Starting turso dev…"
	@turso dev --port 8080 & echo $$! > $(TURSO_PID_FILE)
	@for i in 1 2 3 4 5 6 7 8 9 10; do \
		if curl -s $(TURSO_URL) > /dev/null 2>&1; then \
			echo "✓ turso dev is ready on $(TURSO_URL)"; \
			exit 0; \
		fi; \
		sleep 0.5; \
	done; \
	echo "✗ turso dev failed to start"; exit 1

## Stop local Turso dev database server
turso-stop:
	@if [ -f $(TURSO_PID_FILE) ]; then \
		kill $$(cat $(TURSO_PID_FILE)) 2>/dev/null; \
		rm $(TURSO_PID_FILE); \
		echo "▶ turso dev stopped"; \
	else \
		echo "▶ No turso dev process found"; \
	fi

# ── Directories ──────────────────────────────────────────────────────────────
FRONTEND_DIR := frontend
BACKEND_DIR  := backend

# ── Development ───────────────────────────────────────────────────────────────
## Start turso dev, frontend, and backend concurrently
dev:
	$(MAKE) -j3 turso-dev dev-frontend dev-backend

dev-frontend:
	@echo "▶ Starting frontend dev server…"
	cd $(FRONTEND_DIR) && npm run dev

dev-backend:
	@echo "▶ Starting backend dev server…"
	cd $(BACKEND_DIR) && TURSO_DATABASE_URL=$(TURSO_URL) go run ./cmd/server

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

# ── Testing ──────────────────────────────────────────────────────────────────
## Run Vitest test suite
test:
	cd $(FRONTEND_DIR) && npm run test

# ── Setup ─────────────────────────────────────────────────────────────────────
## Install frontend dependencies
install:
	@echo "▶ Installing frontend dependencies…"
	cd $(FRONTEND_DIR) && npm install
