# Fix: Public View Match Score Counts Incomplete Games

## Bug

The public view match score (e.g. "1-0") counts incomplete games as wins. For example, with the first game at 2-0, the match score already shows player 1 leading 1-0.

## Root Cause

`getAggregateScore()` in `PublicView.vue` compares scores without checking the game's `status` field:

```js
for (const game of match.games) {
    if (game.team1Score > game.team2Score) team1Wins++   // ← counts 2-0 as a win
    else if (game.team2Score > game.team1Score) team2Wins++
}
```

The backend correctly sets `game.status = "completed"` only when `maxScore >= 11 && maxScore - minScore >= 2`. The API returns `"completed"`, `"in_progress"`, or `"unstarted"` per game — but the frontend ignores it.

## Fix

**One-line change** in `frontend/src/views/public/PublicView.vue`, inside `getAggregateScore()`:

```diff
  for (const game of match.games) {
+   if (game.status !== 'completed') continue
    if (game.team1Score > game.team2Score) team1Wins++
    else if (game.team2Score > game.team1Score) team2Wins++
  }
```

## Scope

- **Backend:** No changes. Game completion logic is already correct.
- **Frontend:** One line added to `PublicView.vue`.
- **Tests:** No existing tests for this view function; no tests to update.
- **Other views:** `getGameScores()` already filters by `g.status === 'completed'` for display, so individual game score strings are fine.
