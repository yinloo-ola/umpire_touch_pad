# Implementation Plan: Fix Card State Comparison Bug

**Design:** `docs/plans/2026-04-16-fix-card-state-comparison-design.md`

---

## Task 1: Fix `cardState()` — extract `.type` from card objects

**File:** `frontend/src/components/umpire/CardModal.vue`
**Scenario:** Modifying tested code (no new tests needed — existing store tests already validate card sequences)

1. Run existing tests to confirm baseline: `cd frontend && npm test`
2. In `cardState()`, add `const cardTypes = arr.map(c => c.type)` after getting `arr`
3. Replace all `arr` comparisons with `cardTypes`:
   - `arr.includes(type)` → `cardTypes.includes(type)`
   - `arr.length === 0` → `cardTypes.length === 0`
   - `arr[idx - 1] === order[idx - 1]` → `cardTypes[idx - 1] === order[idx - 1]`
4. Run tests: `cd frontend && npm test` — all should pass (store logic unchanged)
5. Commit: `git add -A && git commit -m "fix: cardState() compares .type not object identity"`

---

## Task 2: Fix `issueOrRevert()` — extract `.type` from card objects

**File:** `frontend/src/components/umpire/CardModal.vue`
**Scenario:** Modifying tested code

1. In `issueOrRevert()`, fix the revert check:
   - `arr.length > 0 && arr[arr.length - 1] === type` → `arr.length > 0 && arr[arr.length - 1].type === type`
2. Fix the "already issued" check:
   - `!arr.includes(type)` → `!arr.some(c => c.type === type)`
3. Run tests: `cd frontend && npm test`
4. Run lint: `cd frontend && npm run lint`
5. Commit: `git add -A && git commit -m "fix: issueOrRevert() compares .type not object identity"`

---

## Task 3: Manual smoke test

Open the app in browser and verify:
1. Player track: issue Yellow → YR1 unlocks → issue YR1 → YR2 unlocks
2. Coach track: issue Yellow → Red unlocks → issue Red
3. Revert: tap an issued card → it reverts and previous card reappears
4. Timeout: still works independently
