import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useMatchStore } from '../matchStore'

describe('Decider Game Mid-game Swap Revert', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('undoes mid-game side swap if score reverted below 5', () => {
    const store = useMatchStore()
    store.selectMatch({
      type: 'doubles',
      bestOf: 1, // Deciding game
      team1: [{ name: 'A' }, { name: 'B' }],
      team2: [{ name: 'C' }, { name: 'D' }],
    })

    // Setup: score goes to 4-4
    store.startPoint()
    store.handleScore(1, 4)
    store.startPoint()
    store.handleScore(2, 4)

    expect(store.swappedSides).toBe(false)
    expect(store.midGameSwapPending).toBe(false)

    // Trigger swap: P1 reaches 5
    store.startPoint()
    store.handleScore(1, 1) // 5-4
    expect(store.p1Score).toBe(5)
    expect(store.midGameSwapPending).toBe(true)

    // User confirms swap modal
    store.applyMidGameSwap()
    expect(store.swappedSides).toBe(true)
    expect(store.decidingSwapDone).toBe(true)
    expect(store.midGameSwapPending).toBe(false)

    // Now user realizes 5th point was a mistake and undoes it
    store.handleScore(1, -1) // 4-4
    expect(store.p1Score).toBe(4)

    // The side swap should be reverted!
    expect(store.swappedSides).toBe(false)
    expect(store.decidingSwapDone).toBe(false)
    expect(store.midGameSwapPending).toBe(false)
  })
})
