import { setActivePinia, createPinia } from 'pinia'
import { describe, it, expect, beforeEach } from 'vitest'
import { useMatchStore } from '../matchStore'

describe('Boundary debug', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('undo next game brings us back to game 1 at 10-0 if we revert YR2 in game 2', () => {
    const store = useMatchStore()
    store.selectMatch({ type: 'singles', bestOf: 3 })
    store.startPoint()

    // Get to 9-0
    for (let i = 0; i < 9; i++) {
      store.handleScore(1, 1)
      store.pointStarted = true
    }

    // Y gives nothing. YR1 gives 1 pt -> 10-0
    store.issueCard(2, 'Yellow')
    store.issueCard(2, 'YR1')

    expect(store.p1Score).toBe(10)
    expect(store.isGameOver).toBe(false)

    // YR2 gives 2 points. Score requires 1 to win this game (11-0) and 1 carry over.
    store.issueCard(2, 'YR2')

    expect(store.isGameOver).toBe(true)
    expect(store.p1Score).toBe(11)
    expect(store.carryOverPoints.p1).toBe(1)

    // Move to next game.
    store.nextGame()
    expect(store.game).toBe(2)
    expect(store.p1Score).toBe(1)
    expect(store.p2Score).toBe(0)

    // Reverting YR2 should revert 2 points. We are at 1-0 in Game 2.
    // Reverting 2 points means we have to go back to Game 1 to revert the other point.
    // The state in Game 1 before YR2 was 10-0.
    store.revertLastCard(2, 'player')

    expect(store.game).toBe(1)
    expect(store.p1Score).toBe(10)
    expect(store.isGameOver).toBe(false)
  })
})
