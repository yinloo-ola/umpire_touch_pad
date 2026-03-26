import { setActivePinia, createPinia } from 'pinia'
import { describe, it, expect, beforeEach } from 'vitest'
import { useMatchStore } from '../matchStore'

describe('matchStore - Cards and Timeouts', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('initializes card and timeout states correctly', () => {
    const store = useMatchStore()
    expect(store.team1Cards).toEqual([])
    expect(store.team2Cards).toEqual([])
    expect(store.team1CoachCards).toEqual([])
    expect(store.team2CoachCards).toEqual([])
    expect(store.team1Timeout).toBe(false)
    expect(store.team2Timeout).toBe(false)
  })

  it('resets card and timeout states correctly', () => {
    const store = useMatchStore()
    store.team1Cards.push('Yellow')
    store.team1Timeout = true

    store.resetMatchState()

    expect(store.team1Cards).toEqual([])
    expect(store.team1Timeout).toBe(false)
  })

  it('issues player cards in the correct sequence', () => {
    const store = useMatchStore()

    // Valid sequence: Yellow -> YR1 -> YR2
    expect(store.issueCard(1, 'Yellow', 'player')).toBe(true)
    expect(store.team1Cards).toEqual([{ type: 'Yellow', game: 1 }])

    expect(store.issueCard(1, 'YR1', 'player')).toBe(true)
    expect(store.team1Cards).toEqual([
      { type: 'Yellow', game: 1 },
      { type: 'YR1', game: 1 },
    ])

    expect(store.issueCard(1, 'YR2', 'player')).toBe(true)
    expect(store.team1Cards).toEqual([
      { type: 'Yellow', game: 1 },
      { type: 'YR1', game: 1 },
      { type: 'YR2', game: 1 },
    ])

    // Cannot issue any more cards or invalid sequence
    // Although YR2 is the max, trying to issue another YR2 or Yellow should fail
    expect(store.issueCard(1, 'Yellow', 'player')).toBe(false)
  })

  it('rejects invalid player card sequences', () => {
    const store = useMatchStore()

    // Cannot issue YR1 directly
    expect(store.issueCard(2, 'YR1', 'player')).toBe(false)
    expect(store.team2Cards).toEqual([])

    // Cannot issue YR2 directly
    expect(store.issueCard(2, 'YR2', 'player')).toBe(false)
    expect(store.team2Cards).toEqual([])
  })

  it('issues coach cards in the correct sequence', () => {
    const store = useMatchStore()

    expect(store.issueCard(1, 'Yellow', 'coach')).toBe(true)
    expect(store.team1CoachCards).toEqual([{ type: 'Yellow', game: 1 }])

    expect(store.issueCard(1, 'Red', 'coach')).toBe(true)
    expect(store.team1CoachCards).toEqual([
      { type: 'Yellow', game: 1 },
      { type: 'Red', game: 1 },
    ])

    // Reject invalid sequences
    expect(store.issueCard(1, 'Yellow', 'coach')).toBe(false)
  })

  it('rejects invalid coach card sequences', () => {
    const store = useMatchStore()

    // Cannot issue Red directly
    expect(store.issueCard(2, 'Red', 'coach')).toBe(false)
    expect(store.team2CoachCards).toEqual([])
  })

  it('reverts player cards in LIFO order', () => {
    const store = useMatchStore()

    store.issueCard(1, 'Yellow', 'player')
    store.issueCard(1, 'YR1', 'player')
    expect(store.team1Cards).toEqual([
      { type: 'Yellow', game: 1 },
      { type: 'YR1', game: 1 },
    ])

    store.revertLastCard(1, 'player')
    expect(store.team1Cards).toEqual([{ type: 'Yellow', game: 1 }])

    store.revertLastCard(1, 'player')
    expect(store.team1Cards).toEqual([])

    // Does nothing if empty
    store.revertLastCard(1, 'player')
    expect(store.team1Cards).toEqual([])
  })

  it('reverts coach cards correctly', () => {
    const store = useMatchStore()

    store.issueCard(2, 'Yellow', 'coach')
    expect(store.team2CoachCards).toEqual([{ type: 'Yellow', game: 1 }])

    store.revertLastCard(2, 'coach')
    expect(store.team2CoachCards).toEqual([])
  })

  it('issues and reverts timeouts correctly', () => {
    const store = useMatchStore()

    store.issueTimeout(1)
    expect(store.team1Timeout).toBe(true)
    expect(store.team2Timeout).toBe(false) // Independent

    store.revertTimeout(1)
    expect(store.team1Timeout).toBe(false)

    store.issueTimeout(2)
    expect(store.team2Timeout).toBe(true)
  })
})
