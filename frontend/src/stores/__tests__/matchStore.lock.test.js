import { setActivePinia, createPinia } from 'pinia'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useMatchStore } from '../matchStore'

beforeAll(() => {
  window.__umpireSessionId = 'test-session-123'
})

afterAll(() => {
  delete window.__umpireSessionId
})

function makeStoreWithMatch() {
  const store = useMatchStore()
  store.currentMatch = {
    id: 'match-1',
    bestOf: 5,
    type: 'singles',
    team1: [{ name: 'Alice', country: 'SG' }],
    team2: [{ name: 'Bob', country: 'SG' }],
  }
  store.matchStatus = 'in_progress'
  store.p1Score = 1
  store.p2Score = 0
  store.game = 1
  store.isStarted = true
  return store
}

describe('matchStore - syncMatch sends X-Session-ID header', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.restoreAllMocks()
  })

  it('includes X-Session-ID in the sync request headers', async () => {
    const store = makeStoreWithMatch()
    global.fetch = vi.fn().mockResolvedValue({ ok: true, status: 204 })

    await store.syncMatch()

    expect(global.fetch).toHaveBeenCalledWith(
      '/api/matches/match-1/sync',
      expect.objectContaining({
        headers: expect.objectContaining({
          'X-Session-ID': 'test-session-123',
          'Content-Type': 'application/json',
        }),
      }),
    )
    expect(store.syncStatus).toBe('synced')
  })
})

describe('matchStore - syncMatch handles 409 Conflict', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.restoreAllMocks()
  })

  it('alerts and redirects on 409', async () => {
    const store = makeStoreWithMatch()
    global.fetch = vi.fn().mockResolvedValue({ ok: false, status: 409 })
    const alertSpy = vi.fn()
    globalThis.alert = alertSpy
    const pushMock = vi.fn()
    store.router = { push: pushMock }

    await store.syncMatch()

    expect(alertSpy).toHaveBeenCalledWith('This match is being umpired on another device.')
    expect(pushMock).toHaveBeenCalledWith('/')
    expect(store.syncStatus).toBe('error')
  })

  it('sets error status for non-409 server errors', async () => {
    const store = makeStoreWithMatch()
    global.fetch = vi.fn().mockResolvedValue({ ok: false, status: 500 })

    await store.syncMatch()

    expect(store.syncStatus).toBe('error')
  })
})

describe('matchStore - fetchMatchState sends X-Session-ID header', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.restoreAllMocks()
  })

  it('includes X-Session-ID in the fetchMatchState request', async () => {
    const store = useMatchStore()
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          match: {
            id: 'match-1',
            status: 'in_progress',
            bestOf: 5,
            type: 'singles',
            team1: [{ name: 'Alice', country: 'SG' }],
            team2: [{ name: 'Bob', country: 'SG' }],
          },
          games: [{ gameNumber: 1, team1Score: 1, team2Score: 0, status: 'in_progress' }],
          cards: [],
        }),
    })

    await store.fetchMatchState('match-1')

    expect(global.fetch).toHaveBeenCalledWith(
      '/api/matches/match-1',
      expect.objectContaining({
        headers: expect.objectContaining({
          'X-Session-ID': 'test-session-123',
        }),
      }),
    )
  })
})
