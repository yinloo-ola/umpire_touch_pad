---
phase: 5
plan: fix-failing-tests
wave: 1
gap_closure: true
---

# Fix Plan: Fix Frontend Unit Tests (Unmocked Fetch)

## Problem
The `npm test` suite is currently failing with exit code 1. During Phase 5, `syncMatch()` inside `matchStore.js` was updated to perform API sync operations. Since `fetch` is not globally mocked in the Vitest environment, tests like `matchStore.penalty.test.js` attempt to hit the real endpoint `PUT http://localhost:8080/api/matches/undefined/sync`, which fails with a 401 Unauthorized or throws an AbortError during teardown.

## Tasks

<task type="auto">
  <name>Mock Global Fetch</name>
  <files>frontend/vitest.setup.js, frontend/src/stores/__tests__/*</files>
  <action>Add a global mock for `fetch` in the Vitest setup file, or provide robust mocking in `matchStore` tests to prevent real HTTP calls during `syncMatch`.</action>
  <verify>Run `npm test` and assert it exits with code 0 and 0 failed tests.</verify>
  <done>The test suite produces a clean run without 'Match sync error: Error: Sync failed'.</done>
</task>
