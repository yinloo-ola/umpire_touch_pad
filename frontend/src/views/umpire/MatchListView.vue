<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useMatchStore } from '../../stores/matchStore'
import { useAdminStore } from '../../stores/adminStore'

const router = useRouter()
const matchStore = useMatchStore()
const adminStore = useAdminStore()

onMounted(async () => {
  try {
    await adminStore.fetchMatches()
  } catch (err) {
    console.error('Failed to fetch matches:', err)
  }
})

const tableFilter = ref('')

const availableTables = computed(() => {
  const tables = adminStore.matches.map((m) => m.tableNumber).filter((t) => t != null && t > 0)
  return [...new Set(tables)].sort((a, b) => a - b)
})

const matches = computed(() => {
  if (!tableFilter.value) return adminStore.matches
  const tNum = parseInt(tableFilter.value)
  return adminStore.matches.filter((m) => m.tableNumber === tNum)
})

const selectedMatch = ref(null)
const showModal = ref(false)

const openMatchConfirm = (match) => {
  selectedMatch.value = match
  showModal.value = true
}

const closeMatchConfirm = () => {
  showModal.value = false
  selectedMatch.value = null
}

const startMatch = async () => {
  if (selectedMatch.value) {
    if (selectedMatch.value.status === 'unstarted' || !selectedMatch.value.status) {
      matchStore.selectMatch(selectedMatch.value)
      router.push(`/umpire/setup/${selectedMatch.value.id}`)
    } else {
      loading.value = true
      const ok = await matchStore.fetchMatchState(selectedMatch.value.id)
      loading.value = false
      if (ok) {
        if (matchStore.matchStatus === 'in_progress') {
          router.push(`/umpire/scoring/${selectedMatch.value.id}`)
        } else {
          router.push(`/umpire/setup/${selectedMatch.value.id}`)
        }
      }
    }
  }
}

const loading = ref(false)

const formatStatus = (status) => {
  if (!status) return 'Unstarted'
  return status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')
}

async function onLogout() {
  await adminStore.logout()
  router.push('/admin/login')
}
</script>

<template>
  <header class="app-header">
    <div class="header-left">
      <span class="logo-text">🏓 Umpire Touchpad</span>
    </div>
    <div class="header-right">
      <router-link v-if="adminStore.role === 'admin'" to="/admin/dashboard" class="nav-link">
        Admin Dashboard
      </router-link>
      <button @click="onLogout" class="logout-btn">
        <i class="fa-solid fa-right-from-bracket"></i> Logout
      </button>
    </div>
  </header>

  <section id="match-list-view" class="view active">
    <div class="main-container">
      <div class="list-header-row">
        <h2 class="greeting">
          Welcome {{ adminStore.role === 'admin' ? 'Admin' : 'Umpire' }}, today's matches are
        </h2>
        <div class="filter-box">
          <label>Filter by Table:</label>
          <select v-model="tableFilter" class="table-filter-input select-filter">
            <option value="">All Tables</option>
            <option v-for="t in availableTables" :key="t" :value="t">Table {{ t }}</option>
          </select>
        </div>
      </div>
      <div class="table-container glass-panel">
        <table class="match-table">
          <thead>
            <tr>
              <th>Event</th>
              <th>Table</th>
              <th>Time</th>
              <th>Player 1</th>
              <th>Player 2</th>
              <th>Best Of</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(match, index) in matches" :key="index" @click="openMatchConfirm(match)">
              <td>{{ match.event }}</td>
              <td>
                <span v-if="match.tableNumber" class="table-tag">T{{ match.tableNumber }}</span>
                <span v-else>—</span>
              </td>
              <td>{{ match.time }}</td>
              <td>
                <template v-if="match.type === 'singles'">
                  <span class="player-name-main">{{ match.team1[0].name }}</span>
                  <span class="country-code">{{ match.team1[0].country }}</span>
                </template>
                <template v-else>
                  <div class="doubles-cell">
                    <div>
                      <span class="player-name-main">{{ match.team1[0].name }}</span>
                      <span class="country-code">{{ match.team1[0].country }}</span>
                    </div>
                    <div>
                      <span class="player-name-main">{{ match.team1[1].name }}</span>
                      <span class="country-code">{{ match.team1[1].country }}</span>
                    </div>
                  </div>
                </template>
              </td>
              <td>
                <template v-if="match.type === 'singles'">
                  <span class="player-name-main">{{ match.team2[0].name }}</span>
                  <span class="country-code">{{ match.team2[0].country }}</span>
                </template>
                <template v-else>
                  <div class="doubles-cell">
                    <div>
                      <span class="player-name-main">{{ match.team2[0].name }}</span>
                      <span class="country-code">{{ match.team2[0].country }}</span>
                    </div>
                    <div>
                      <span class="player-name-main">{{ match.team2[1].name }}</span>
                      <span class="country-code">{{ match.team2[1].country }}</span>
                    </div>
                  </div>
                </template>
              </td>
              <td>
                <strong>{{ match.bestOf }}</strong>
              </td>
              <td>
                <span :class="['status-badge', match.status || 'unstarted']">
                  {{ formatStatus(match.status) }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div class="footer-actions">
        <button class="text-btn back-btn"><i class="fa-solid fa-chevron-left"></i> Back</button>
      </div>
    </div>
    <!-- end main-container -->

    <!-- Match Confirmation Modal -->
    <div v-if="showModal" id="match-confirm-modal" class="modal-overlay">
      <div class="modal-content glass-panel">
        <div class="modal-header">
          <h3>You have chosen match</h3>
        </div>
        <div class="modal-body">
          <div class="confirm-match-info">
            <table class="match-table mini-table">
              <thead>
                <tr>
                  <th>Event</th>
                  <th>Time</th>
                  <th>Player 1</th>
                  <th>Player 2</th>
                  <th>Best Of</th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="selectedMatch">
                  <td>{{ selectedMatch.event }}</td>
                  <td>{{ selectedMatch.time }}</td>
                  <td>
                    <template v-if="selectedMatch.type === 'singles'">
                      <strong>{{ selectedMatch.team1[0].name }}</strong>
                      {{ selectedMatch.team1[0].country }}
                    </template>
                    <template v-else>
                      <div>{{ selectedMatch.team1[0].name }}</div>
                      <div>{{ selectedMatch.team1[1].name }}</div>
                    </template>
                  </td>
                  <td>
                    <template v-if="selectedMatch.type === 'singles'">
                      <strong>{{ selectedMatch.team2[0].name }}</strong>
                      {{ selectedMatch.team2[0].country }}
                    </template>
                    <template v-else>
                      <div>{{ selectedMatch.team2[0].name }}</div>
                      <div>{{ selectedMatch.team2[1].name }}</div>
                    </template>
                  </td>
                  <td>
                    <strong>{{ selectedMatch.bestOf }}</strong>
                  </td>
                </tr>
              </tbody>
            </table>
            <p class="modal-prompt">
              Are you sure you want to
              {{
                selectedMatch?.status === 'unstarted' || !selectedMatch?.status
                  ? 'start'
                  : 'resume'
              }}?
            </p>
          </div>
        </div>
        <div class="modal-footer">
          <button @click="startMatch" class="modal-btn primary-btn" :disabled="loading">
            {{
              loading
                ? 'Loading...'
                : selectedMatch?.status === 'unstarted' || !selectedMatch?.status
                  ? 'Start'
                  : 'Resume'
            }}
          </button>
          <button @click="closeMatchConfirm" class="modal-btn secondary-btn" :disabled="loading">
            Reset
          </button>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.view {
  position: relative;
  opacity: 1;
  pointer-events: all;
  transform: scale(1);
  padding: 2rem;
  overflow-y: auto;
}

.main-container {
  max-width: 1200px;
  margin: 0 auto;
  width: 100%;
}

.app-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 2rem;
  background: rgba(255, 255, 255, 0.03);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  position: sticky;
  top: 0;
  z-index: 100;
}

.logo-text {
  font-weight: 700;
  font-size: 1.2rem;
  color: #334155;
}

.header-right {
  display: flex;
  gap: 1.5rem;
  align-items: center;
}

.nav-link {
  color: #219c06;
  text-decoration: none;
  font-weight: 600;
  font-size: 0.9rem;
  transition: opacity 0.2s;
}

.nav-link:hover {
  opacity: 0.8;
}

.logout-btn {
  background: rgba(248, 113, 113, 0.1);
  border: 1px solid rgba(248, 113, 113, 0.2);
  color: #f87171;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.logout-btn:hover {
  background: rgba(248, 113, 113, 0.2);
  border-color: rgba(248, 113, 113, 0.4);
}

.modal-overlay {
  opacity: 1;
  pointer-events: all;
}

.status-badge {
  padding: 0.3rem 0.6rem;
  border-radius: 6px;
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  display: inline-block;
}

.status-badge.unstarted {
  background: rgba(148, 163, 184, 0.1);
  color: #94a3b8;
  border: 1px solid rgba(148, 163, 184, 0.2);
}

.status-badge.starting {
  background: rgba(59, 130, 246, 0.1);
  color: #60a5fa;
  border: 1px solid rgba(59, 130, 246, 0.2);
}

.status-badge.warming_up {
  background: rgba(234, 179, 8, 0.1);
  color: #facc15;
  border: 1px solid rgba(234, 179, 8, 0.2);
}

.status-badge.in_progress {
  background: rgba(34, 197, 94, 0.1);
  color: #4ade80;
  border: 1px solid rgba(34, 197, 94, 0.2);
}

.status-badge.completed {
  background: rgba(139, 92, 246, 0.1);
  color: #a78bfa;
  border: 1px solid rgba(139, 92, 246, 0.2);
}

.list-header-row {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 1.5rem;
  margin-bottom: 2rem;
  width: 100%;
}

.greeting {
  font-size: 1.5rem;
  font-weight: 700;
  color: #334155; /* Darker color for visibility */
  margin: 0;
  text-align: left;
}

.filter-box {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0;
}

.filter-box label {
  font-size: 0.8rem;
  font-weight: 700;
  color: #475569;
  text-transform: uppercase;
}

.table-filter-input {
  background: white; /* White background for better contrast with dark text */
  border: 1px solid #cbd5e1;
  color: #334155; /* Dark text */
  padding: 0.35rem 2.5rem 0.35rem 0.75rem;
  border-radius: 8px;
  font-size: 0.9rem;
  width: 140px;
  outline: none;
  font-family: inherit;
}

.table-filter-input option {
  color: #334155;
  background: white;
}

.select-filter {
  cursor: pointer;
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2364748b'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 0.75rem center;
  background-size: 1rem;
  padding-right: 2.5rem;
}

.table-filter-input:focus {
  border-color: #219c06;
}

.table-tag {
  background: rgba(255, 255, 255, 0.05);
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
  font-weight: 700;
  font-size: 0.85rem;
  color: #94a3b8;
}
</style>
