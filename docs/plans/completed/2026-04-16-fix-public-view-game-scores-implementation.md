# Implementation Plan: Fix Public View Game Scores

## Task 1: Add status check to getAggregateScore() [Trivial]

**File:** `frontend/src/views/public/PublicView.vue`

**Change:** Add `if (game.status !== 'completed') continue` as the first line inside the `for` loop in `getAggregateScore()`.

```diff
  function getAggregateScore(match) {
    if (!match.games || match.games.length === 0) return null
    let team1Wins = 0
    let team2Wins = 0
    for (const game of match.games) {
+     if (game.status !== 'completed') continue
      if (game.team1Score > game.team2Score) team1Wins++
      else if (game.team2Score > game.team1Score) team2Wins++
    }
    return { team1: team1Wins, team2: team2Wins }
  }
```

**Verify:** `cd frontend && npm run build`

**Commit:** `fix: only count completed games in public view match score`
