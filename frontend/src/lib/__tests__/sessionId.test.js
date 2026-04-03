import { describe, it, expect, beforeEach } from 'vitest'
import { getOrCreateSessionId } from '../sessionId'

describe('getOrCreateSessionId', () => {
  beforeEach(() => {
    sessionStorage.clear()
  })

  it('creates a new UUID and stores it in sessionStorage', () => {
    const id = getOrCreateSessionId()

    expect(id).toBeDefined()
    expect(id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    )
    expect(sessionStorage.getItem('umpire-session-id')).toBe(id)
  })

  it('returns the same UUID on subsequent calls', () => {
    const first = getOrCreateSessionId()
    const second = getOrCreateSessionId()
    expect(first).toBe(second)
  })

  it('generates different UUIDs across cleared sessions', () => {
    const first = getOrCreateSessionId()
    sessionStorage.clear()
    const second = getOrCreateSessionId()
    expect(first).not.toBe(second)
  })
})
