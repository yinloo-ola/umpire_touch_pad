import { setActivePinia, createPinia } from 'pinia'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useMatchStore } from '../matchStore'

describe('matchStore - Timeout Logic', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.useFakeTimers()
  })

  it('initializes timeout state correctly', () => {
    const store = useMatchStore()
    expect(store.timeoutActive).toBe(false)
    expect(store.timeoutTimeLeft).toBe(60)
    expect(store.timeoutCallingTeam).toBe(null)
    expect(store.team1Timeout).toBe(false)
    expect(store.team2Timeout).toBe(false)
  })

  it('issues timeout correctly and starts timer', () => {
    const store = useMatchStore()
    const result = store.issueTimeout(1)

    expect(result).toBe(true)
    expect(store.timeoutActive).toBe(true)
    expect(store.timeoutTimeLeft).toBe(60)
    expect(store.timeoutCallingTeam).toBe(1)
    expect(store.team1Timeout).toBe(true)

    vi.advanceTimersByTime(1000)
    expect(store.timeoutTimeLeft).toBe(59)

    vi.advanceTimersByTime(59000)
    expect(store.timeoutTimeLeft).toBe(0)

    // Timer should stop at 0
    vi.advanceTimersByTime(1000)
    expect(store.timeoutTimeLeft).toBe(0)
  })

  it('guards against issuing timeout during a point', () => {
    const store = useMatchStore()
    store.isStarted = true
    store.pointStarted = true

    const result = store.issueTimeout(1)
    expect(result).toBe(false)
    expect(store.timeoutActive).toBe(false)
  })

  it('guards against issuing timeout during warmup', () => {
    const store = useMatchStore()
    store.timerActive = true // Warmup active

    const result = store.issueTimeout(1)
    expect(result).toBe(false)
    expect(store.timeoutActive).toBe(false)
  })

  it('guards against double issuing timeout for the same team', () => {
    const store = useMatchStore()
    store.issueTimeout(1)
    store.dismissTimeout() // active=false, but team1Timeout=true

    const result = store.issueTimeout(1)
    expect(result).toBe(false)
  })

  it('reverts timeout correctly', () => {
    const store = useMatchStore()
    store.issueTimeout(1)
    vi.advanceTimersByTime(10000)
    expect(store.timeoutTimeLeft).toBe(50)

    store.revertTimeout(1)
    expect(store.team1Timeout).toBe(false)
    expect(store.timeoutActive).toBe(false)
    expect(store.timeoutTimeLeft).toBe(60)
    expect(store.timeoutCallingTeam).toBe(null)

    // Timer should be stopped
    vi.advanceTimersByTime(1000)
    expect(store.timeoutTimeLeft).toBe(60)
  })

  it('reverts only the calling team state if revertTimeout called for other team', () => {
    const store = useMatchStore()
    store.issueTimeout(1)

    store.revertTimeout(2)
    expect(store.team2Timeout).toBe(false)
    expect(store.timeoutActive).toBe(true) // Team 1 still active
    expect(store.timeoutCallingTeam).toBe(1)
  })

  it('dismisses timeout correctly', () => {
    const store = useMatchStore()
    store.issueTimeout(1)
    store.dismissTimeout()

    expect(store.timeoutActive).toBe(false)
    expect(store.team1Timeout).toBe(true) // Still used
  })

  it('persists timeout state through cross-game undo', () => {
    const store = useMatchStore()
    store.currentMatch = { bestOf: 5, type: 'singles' }
    store.isStarted = true

    // End game 1 with team 1 having used timeout
    store.issueTimeout(1)
    store.dismissTimeout()

    // Simulating game end
    store.p1Score = 11
    store.p2Score = 0
    store.isGameOver = true
    store.nextGame()

    expect(store.game).toBe(2)
    expect(store.team1Timeout).toBe(true)

    // Undo back to game 1
    store.undoNextGame()
    expect(store.game).toBe(1)
    expect(store.team1Timeout).toBe(true)

    // Revert timeout in game 1
    store.revertTimeout(1)
    expect(store.team1Timeout).toBe(false)
  })

  it('clears interval on reset', () => {
    const store = useMatchStore()
    store.issueTimeout(1)
    store.resetMatchState()

    expect(store.timeoutActive).toBe(false)
    vi.advanceTimersByTime(1000)
    expect(store.timeoutTimeLeft).toBe(60) // Should not have decremented
  })
})
