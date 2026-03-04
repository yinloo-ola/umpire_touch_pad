import { defineStore } from 'pinia'
import { ref } from 'vue'

const API_BASE = 'http://localhost:8080'

export const useAdminStore = defineStore('admin', () => {
    const isAuthenticated = ref(false)
    const role = ref('')
    const matches = ref([])

    async function login(username, password) {
        const res = await fetch(`${API_BASE}/api/login`, {
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
        return data.role
    }

    async function logout() {
        await fetch(`${API_BASE}/api/logout`, {
            method: 'POST',
            credentials: 'include',
        })
        isAuthenticated.value = false
        role.value = ''
        matches.value = []
    }

    async function fetchMatches() {
        const res = await fetch(`${API_BASE}/api/matches`, {
            credentials: 'include',
        })
        if (!res.ok) {
            throw new Error('Failed to fetch matches')
        }
        matches.value = await res.json()
    }

    async function createMatch(payload) {
        const res = await fetch(`${API_BASE}/api/match`, {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
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
        if (isAuthenticated.value) return true  // already hydrated this session
        try {
            const res = await fetch(`${API_BASE}/api/me`, {
                credentials: 'include',
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

    return {
        isAuthenticated,
        role,
        matches,
        login,
        logout,
        fetchMatches,
        createMatch,
        checkAuth,
    }
})
