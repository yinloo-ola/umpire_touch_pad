# Fix Card State Comparison Bug

**Date:** 2026-04-16

## Problem

After assigning a Yellow card to a player or coach, all subsequent card buttons appear locked and unclickable. Revert-on-tap also doesn't work.

## Root Cause

`frontend/src/components/umpire/CardModal.vue` — `cardState()` and `issueOrRevert()` treat card arrays as `string[]` but they are `{ type: string, game: number }[]`.

```js
// cardState: object !== string → always false
arr.includes(type)           // [{type:'Yellow',game:1}].includes('Yellow') → false
arr[idx - 1] === order[idx-1] // {type:'Yellow',game:1} === 'Yellow' → false

// issueOrRevert: same mismatch
arr[arr.length - 1] === type // can never revert
```

## Fix

Single file: `frontend/src/components/umpire/CardModal.vue`.

### `cardState(track, type)`

Add `const cardTypes = arr.map(c => c.type)` and use `cardTypes` for all comparisons:

- `cardTypes.includes(type)` instead of `arr.includes(type)`
- `cardTypes[idx - 1] === order[idx - 1]` instead of `arr[idx - 1] === order[idx - 1]`

### `issueOrRevert(track, type)`

Compare `.type` property:

- `arr[arr.length - 1].type === type` instead of `arr[arr.length - 1] === type`
- `arr.some(c => c.type === type)` instead of `arr.includes(type)`

## Not in scope

- No backend changes
- No matchStore changes (`issueCard`/`revertLastCard` already correct)
- No CSS changes
- No new tests (existing tests cover store logic)

## Edge cases

| Scenario | Before | After |
|---|---|---|
| Yellow issued → YR1 available | ❌ locked | ✅ available |
| YR1 issued → YR2 available | ❌ locked | ✅ available |
| Coach Yellow issued → Red available | ❌ locked | ✅ available |
| Tap issued card to revert | ❌ no-op | ✅ reverts |
| Tap locked card | ✅ ignored | ✅ ignored |
