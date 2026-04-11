# Local Turso Dev — Implementation Plan

## Prerequisites
- Install Turso CLI: `brew install tursodatabase/tap/turso`

---

## Task 1: Make main.go require TURSO_DATABASE_URL

**Scenario:** Modifying tested code — run existing backend tests first.

**File:** `backend/cmd/server/main.go`

1. Run backend tests to confirm current baseline:
   ```bash
   cd backend && go test ./... -count=1
   ```

2. Replace the `file:sqlite.db` fallback with a fatal error. Change:
   ```go
   dbURL := os.Getenv("TURSO_DATABASE_URL")
   if dbURL == "" {
       dbURL = "file:sqlite.db"
   }
   ```
   To:
   ```go
   dbURL := os.Getenv("TURSO_DATABASE_URL")
   if dbURL == "" {
       log.Fatal("TURSO_DATABASE_URL is not set. Run 'turso dev' and set TURSO_DATABASE_URL=http://127.0.0.1:8080")
   }
   ```

3. Add a startup log after driver selection (after the `driver := ...` block, before `sql.Open`):
   ```go
   log.Printf("Using database: %s (driver: %s)", dbURL, driver)
   ```

4. Run backend tests — they set `TURSO_DATABASE_URL` or use their own DB, so should still pass. If any fail due to the missing env var, add `os.Setenv("TURSO_DATABASE_URL", "file:test.db")` in the test helper or adjust as needed.

   ```bash
   cd backend && go test ./... -count=1
   ```

5. Commit:
   ```bash
   git add backend/cmd/server/main.go
   git commit -m "feat(infra): require TURSO_DATABASE_URL, remove SQLite file fallback"
   ```

---

## Task 2: Add turso-dev and turso-stop Makefile targets

**Scenario:** New feature (Makefile targets) — trivial, no tests needed.

**File:** `Makefile`

1. Add `turso-dev` target. This starts `turso dev` in the background, waits for it to be ready, and writes the URL to an env file:
   ```makefile
   TURSO_URL    := http://127.0.0.1:8080
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
   ```

2. Update `dev-backend` to pass `TURSO_DATABASE_URL`:
   ```makefile
   dev-backend:
   	@echo "▶ Starting backend dev server…"
   	cd $(BACKEND_DIR) && TURSO_DATABASE_URL=$(TURSO_URL) go run ./cmd/server
   ```

3. Update `dev` target to include `turso-dev` and add `.PHONY` entries:
   ```makefile
   .PHONY: dev dev-frontend dev-backend turso-dev turso-stop \
           lint lint-frontend lint-backend \
           fmt fmt-frontend fmt-backend \
           build build-frontend build-backend \
           test install

   dev:
   	$(MAKE) -j3 turso-dev dev-frontend dev-backend
   ```

4. Add `.turso-dev.pid` to `.gitignore`:
   ```bash
   echo ".turso-dev.pid" >> .gitignore
   ```

5. Commit:
   ```bash
   git add Makefile .gitignore
   git commit -m "feat(infra): add turso-dev and turso-stop Makefile targets"
   ```

---

## Task 3: Update AGENTS.md

**Scenario:** Trivial (docs update).

**File:** `AGENTS.md`

1. In the "Commands" section, add a prerequisite note at the top:
   ```
   **Prerequisites:** Install the Turso CLI (`brew install tursodatabase/tap/turso`). Local dev requires `turso dev` to be running — use `make dev` which starts it automatically.
   ```

2. In the "Common Pitfalls" section, add:
   ```
   6. **Starting the backend without `turso dev`** — The server will exit with an error if `TURSO_DATABASE_URL` is not set. Use `make dev` which starts `turso dev` automatically, or run `turso dev` manually and set the env var.
   ```

3. Commit:
   ```bash
   git add AGENTS.md
   git commit -m "docs: update AGENTS.md for local turso dev setup"
   ```

---

## Task 4: Smoke test

**Scenario:** Manual verification.

1. Run `make dev` — verify:
   - `turso dev` starts and prints "turso dev is ready"
   - Backend starts and logs `"Using database: http://127.0.0.1:8080 (driver: libsql)"`
   - Frontend starts on port 5173
   - `curl http://127.0.0.1:8080/api/health` returns `OK`

2. Run `make turso-stop` — verify it stops the process.

3. Run backend tests (should still work without `turso dev`):
   ```bash
   cd backend && go test ./... -count=1
   ```

4. Commit any fixes if needed, otherwise tag as done.
