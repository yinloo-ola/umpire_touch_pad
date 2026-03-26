import { setActivePinia, createPinia } from 'pinia'
import { describe, it, expect, beforeEach } from 'vitest'
import { useMatchStore } from '../matchStore'

describe('Penalty Points Logic', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('awards penalty points and handles game over and carry over', () => {
    const store = useMatchStore()
    store.selectMatch({ type: 'singles', bestOf: 3 })
    store.startPoint()

    // Get to 10-0
    for (let i = 0; i < 10; i++) {
      store.handleScore(1, 1)
      store.pointStarted = true
    }

    // issue Yellow Red 2 (2 penalty points) to player 2 -> player 1 gets 2 pts
    // P1 goes from 10 -> 11 (game over) and carries 1 point to next game
    store.applyPenaltyPoints(1, 2)

    expect(store.p1Score).toBe(11)
    expect(store.isGameOver).toBe(true)
    expect(store.carryOverPoints.p1).toBe(1)

    // next game
    store.nextGame()
    expect(store.p1Score).toBe(1)
    expect(store.p2Score).toBe(0)
    expect(store.carryOverPoints.p1).toBe(0)
  })

  it('reverts penalty points smoothly', () => {
    const store = useMatchStore()
    store.selectMatch({ type: 'singles', bestOf: 3 })
    store.startPoint()

    store.handleScore(1, 1)
    store.pointStarted = true
    store.handleScore(1, 1) // 2-0

    store.applyPenaltyPoints(1, 2) // 4-0
    expect(store.p1Score).toBe(4)

    store.revertPenaltyPoints(1, 2)
    expect(store.p1Score).toBe(2)
  })
})
