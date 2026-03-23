import { defineStore } from 'pinia'
import { ref } from 'vue'

export const usePublicStore = defineStore('public', () => {
    const completed = ref([])
    const scheduled = ref([])
    const live = ref([])
    const loading = ref(false)
    const error = ref(null)
    const lastUpdated = ref(null)

    async function fetchPublicMatches() {
        loading.value = true
        error.value = null
        try {
            const res = await fetch(`/api/public/matches`, {
                // No credentials - public endpoint
            })
            if (!res.ok) {
                throw new Error(`Failed to fetch matches: ${res.status}`)
            }
            const data = await res.json()
            completed.value = data.completed || []
            scheduled.value = data.scheduled || []
            live.value = data.live || []
            lastUpdated.value = new Date()
            console.log('[publicStore] Fetched matches:', {
                completed: completed.value.length,
                scheduled: scheduled.value.length,
                live: live.value.length
            })
        } catch (err) {
            console.error('[publicStore] Fetch failed:', err)
            error.value = err.message || 'Failed to load matches'
        } finally {
            loading.value = false
        }
    }

    function refresh() {
        return fetchPublicMatches()
    }

    return {
        completed,
        scheduled,
        live,
        loading,
        error,
        lastUpdated,
        fetchPublicMatches,
        refresh,
    }
})
