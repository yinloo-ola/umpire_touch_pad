import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useAdminStore = defineStore('admin', () => {
  const isAuthenticated = ref(false)
  const role = ref('')
  const matches = ref([])

  function authHeaders() {
    const token = sessionStorage.getItem('jwt')
    return token ? { Authorization: `Bearer ${token}` } : {}
  }

  async function login(username, password) {
    const res = await fetch(`/api/login`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    })
    if (!res.ok) {
      throw new Error('Invalid credentials')
    }
    const data = await res.json()
    role.value = data.role
    isAuthenticated.value = true
    // Store the JWT for Authorization header (needed when cookies are stripped by proxy)
    const setCookieHeader = res.headers.get('set-cookie') || ''
    const match = setCookieHeader.match(/jwt=([^;]+)/)
    if (match) {
      sessionStorage.setItem('jwt', match[1])
    }
    return data.role
  }

  async function logout() {
    await fetch(`/api/logout`, {
      method: 'POST',
      credentials: 'include',
      headers: authHeaders(),
    })
    sessionStorage.removeItem('jwt')
    isAuthenticated.value = false
    role.value = ''
    matches.value = []
  }

  async function fetchMatches(history = false) {
    const url = history ? `/api/matches?history=true` : `/api/matches`
    const res = await fetch(url, {
      credentials: 'include',
      headers: { 'X-Session-ID': window.__umpireSessionId, ...authHeaders() },
    })
    if (!res.ok) {
      throw new Error('Failed to fetch matches')
    }
    matches.value = await res.json()
  }

  async function createMatch(payload) {
    const res = await fetch(`/api/match`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json', 'X-Session-ID': window.__umpireSessionId, ...authHeaders() },
      body: JSON.stringify(payload),
    })
    if (!res.ok) {
      const text = await res.text()
      throw new Error(text || 'Failed to create match')
    }
    return res.json()
  }

  // checkAuth calls GET /api/me to rehydrate auth state from the existing
  // HttpOnly JWT cookie. Called by the router guard on every navigation so
  // that a page refresh doesn't wipe the in-memory isAuthenticated flag.
  async function checkAuth() {
    if (isAuthenticated.value) return true // already hydrated this session
    try {
      const res = await fetch(`/api/me`, {
        credentials: 'include',
        headers: authHeaders(),
      })
      if (!res.ok) {
        isAuthenticated.value = false
        return false
      }
      const data = await res.json()
      role.value = data.role
      isAuthenticated.value = true
      return true
    } catch {
      isAuthenticated.value = false
      return false
    }
  }

  async function deleteMatch(id) {
    const res = await fetch(`/api/matches/${id}`, {
      method: 'DELETE',
      credentials: 'include',
      headers: { 'X-Session-ID': window.__umpireSessionId, ...authHeaders() },
    })
    if (!res.ok) {
      const text = await res.text()
      throw new Error(text || 'Failed to delete match')
    }
  }

  async function deleteMatches(ids) {
    const res = await fetch(`/api/matches/bulk-delete`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json', 'X-Session-ID': window.__umpireSessionId, ...authHeaders() },
      body: JSON.stringify({ ids }),
    })
    if (!res.ok) {
      const text = await res.text()
      throw new Error(text || 'Failed to delete matches')
    }
  }

  return {
    isAuthenticated,
    role,
    matches,
    login,
    logout,
    fetchMatches,
    createMatch,
    deleteMatch,
    deleteMatches,
    checkAuth,
  }
})
