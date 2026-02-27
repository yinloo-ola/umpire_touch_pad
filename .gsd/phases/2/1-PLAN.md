---
phase: 2
plan: 1
wave: 1
---

# Plan 2.1: Vitest Setup

## Objective
Install Vitest and Pinia testing helpers into the frontend project, configure it to work with Vite's existing `vite.config.js`, add npm scripts for running tests, and wire up a root `make test` target. After this plan, `make test` runs the full suite.

## Context
- `frontend/package.json` — add devDependencies + scripts
- `frontend/vite.config.js` — add `test` block
- `Makefile` (root) — add `test` target

## Tasks

<task type="auto">
  <name>Install vitest and pinia testing helpers</name>
  <files>frontend/package.json</files>
  <action>
    Run in `frontend/`:
    ```bash
    npm install --save-dev vitest @vitest/ui @pinia/testing happy-dom
    ```

    Then add to `package.json` scripts:
    ```json
    "test": "vitest run",
    "test:watch": "vitest",
    "test:ui": "vitest --ui"
    ```
  </action>
  <verify>cd frontend && node -e "require('./node_modules/vitest/package.json'); console.log('vitest ok')"</verify>
  <done>Prints "vitest ok"</done>
</task>

<task type="auto">
  <name>Configure Vitest in vite.config.js</name>
  <files>frontend/vite.config.js</files>
  <action>
    Add a `test` block to the existing Vite config. The file currently looks like:
    ```js
    import { defineConfig } from 'vite'
    import vue from '@vitejs/plugin-vue'

    export default defineConfig({
      plugins: [vue()],
    })
    ```

    Update to:
    ```js
    import { defineConfig } from 'vite'
    import vue from '@vitejs/plugin-vue'

    export default defineConfig({
      plugins: [vue()],
      test: {
        globals: true,
        environment: 'happy-dom',
      },
    })
    ```
  </action>
  <verify>grep -c "globals\|happy-dom" frontend/vite.config.js</verify>
  <done>Command outputs 2</done>
</task>

<task type="auto">
  <name>Add make test target to root Makefile</name>
  <files>Makefile</files>
  <action>
    Add a `test` target to the root Makefile that runs Vitest inside `frontend/`:

    ```makefile
    test:
    	cd frontend && npm run test
    ```

    Add it alongside the existing targets (after `lint` or at the end).
  </action>
  <verify>grep -c "^test:" Makefile</verify>
  <done>Command outputs 1</done>
</task>

## Success Criteria
- [ ] `vitest`, `@pinia/testing`, `happy-dom` installed in `frontend/node_modules`
- [ ] `vite.config.js` has `test: { globals: true, environment: 'happy-dom' }`
- [ ] `package.json` has `test`, `test:watch`, `test:ui` scripts
- [ ] `make test` runs without error (will pass once 2.2 adds test files)
