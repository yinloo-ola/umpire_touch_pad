<template>
  <div class="admin-dashboard">
    <!-- Page Header -->
    <div class="page-header">
      <div class="page-header-left">
        <h1 class="page-title">Match Dashboard</h1>
        <p class="page-subtitle">Today's scheduled matches</p>
      </div>
      <router-link id="create-match-btn" to="/admin/match/new" class="create-btn">
        <span>+</span> Create Match
      </router-link>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="state-card loading-state">
      <span class="spinner">⏳</span>
      <p>Loading matches…</p>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="state-card error-state">
      <span>⚠️</span>
      <p>{{ error }}</p>
      <button class="retry-btn" @click="load">Retry</button>
    </div>

    <!-- Empty State -->
    <div v-else-if="!adminStore.matches || adminStore.matches.length === 0" class="state-card empty-state">
      <span class="empty-icon">🏓</span>
      <p class="empty-title">No matches scheduled today</p>
      <p class="empty-sub">Create a new match to get started.</p>
      <router-link to="/admin/match/new" class="create-btn">
        + Create Match
      </router-link>
    </div>

    <!-- Matches Table -->
    <div v-else class="matches-panel">
      <table class="admin-table">
        <thead>
          <tr>
            <th>Event</th>
            <th>Type</th>
            <th>Scheduled Time</th>
            <th>Team 1</th>
            <th>Team 2</th>
            <th>Status</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="match in adminStore.matches"
            :key="match.id"
            class="match-row"
            @click="goToMatch(match.id)"
          >
            <td class="event-cell">{{ match.event || '—' }}</td>
            <td><span class="type-badge" :class="match.type">{{ match.type }}</span></td>
            <td class="time-cell">{{ formatTime(match.time) }}</td>
            <td>{{ formatTeam(match.team1) }}</td>
            <td>{{ formatTeam(match.team2) }}</td>
            <td><span class="status-badge" :class="match.status">{{ match.status }}</span></td>
            <td class="action-cell">
              <span class="view-arrow">→</span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAdminStore } from '../../stores/adminStore'

const adminStore = useAdminStore()
const router = useRouter()
const loading = ref(false)
const error = ref('')

async function load() {
  loading.value = true
  error.value = ''
  try {
    await adminStore.fetchMatches()
  } catch (e) {
    error.value = e.message || 'Failed to load matches'
  } finally {
    loading.value = false
  }
}

function goToMatch(id) {
  router.push(`/admin/match/${id}`)
}

function formatTime(timeStr) {
  if (!timeStr) return '—'
  const d = new Date(timeStr)
  return isNaN(d) ? timeStr : d.toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })
}

function formatTeam(players) {
  if (!players || players.length === 0) return '—'
  return players.map((p) => p.name).join(' / ')
}

onMounted(load)
</script>

<style scoped>
.admin-dashboard {
  max-width: 1200px;
  margin: 0 auto;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin-bottom: 2rem;
}

.page-title {
  font-size: 1.75rem;
  font-weight: 700;
  color: #f1f5f9;
}

.page-subtitle {
  font-size: 0.95rem;
  color: #64748b;
  margin-top: 0.25rem;
}

.create-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  background: linear-gradient(135deg, #219c06, #1e8706);
  color: white;
  padding: 0.65rem 1.4rem;
  border-radius: 10px;
  font-size: 0.95rem;
  font-weight: 600;
  text-decoration: none;
  box-shadow: 0 4px 15px rgba(33, 156, 6, 0.35);
  transition: all 0.2s;
}

.create-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(33, 156, 6, 0.5);
}

.state-card {
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 16px;
  padding: 4rem 2rem;
  text-align: center;
  color: #64748b;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
}

.empty-icon {
  font-size: 3rem;
}

.empty-title {
  font-size: 1.1rem;
  font-weight: 600;
  color: #94a3b8;
}

.empty-sub {
  font-size: 0.9rem;
  color: #475569;
}

.retry-btn {
  margin-top: 0.5rem;
  background: rgba(255, 255, 255, 0.08);
  color: #94a3b8;
  padding: 0.5rem 1.2rem;
  border-radius: 8px;
  font-family: 'Outfit', sans-serif;
  cursor: pointer;
  transition: all 0.2s;
}

.retry-btn:hover {
  background: rgba(255, 255, 255, 0.12);
}

.matches-panel {
  background: #1e293b;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 16px;
  overflow: hidden;
}

.admin-table {
  width: 100%;
  border-collapse: collapse;
}

.admin-table th {
  background: rgba(255, 255, 255, 0.04);
  padding: 1rem 1.25rem;
  text-align: left;
  font-size: 0.8rem;
  font-weight: 700;
  letter-spacing: 0.5px;
  text-transform: uppercase;
  color: #64748b;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}

.admin-table td {
  padding: 1rem 1.25rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.04);
  color: #cbd5e1;
  font-size: 0.95rem;
}

.match-row {
  cursor: pointer;
  transition: background 0.15s;
}

.match-row:hover {
  background: rgba(255, 255, 255, 0.04);
}

.match-row:last-child td {
  border-bottom: none;
}

.event-cell {
  font-weight: 600;
  color: #f1f5f9 !important;
}

.time-cell {
  font-variant-numeric: tabular-nums;
  color: #94a3b8 !important;
}

.type-badge {
  display: inline-block;
  padding: 0.2rem 0.6rem;
  border-radius: 6px;
  font-size: 0.8rem;
  font-weight: 600;
  text-transform: capitalize;
  background: rgba(148, 163, 184, 0.12);
  color: #94a3b8;
}

.type-badge.singles {
  background: rgba(99, 179, 237, 0.12);
  color: #63b3ed;
}

.type-badge.doubles {
  background: rgba(154, 117, 234, 0.12);
  color: #9a75ea;
}

.status-badge {
  display: inline-block;
  padding: 0.2rem 0.6rem;
  border-radius: 6px;
  font-size: 0.8rem;
  font-weight: 600;
  text-transform: capitalize;
}

.status-badge.scheduled,
.status-badge.not_started {
  background: rgba(245, 158, 11, 0.12);
  color: #fbbf24;
}

.status-badge.in_progress {
  background: rgba(33, 156, 6, 0.15);
  color: #4ade80;
}

.status-badge.completed {
  background: rgba(148, 163, 184, 0.1);
  color: #64748b;
}

.action-cell {
  text-align: right;
  color: #475569 !important;
}

.view-arrow {
  font-size: 1.1rem;
  transition: transform 0.2s;
}

.match-row:hover .view-arrow {
  transform: translateX(4px);
  color: #94a3b8;
}
</style>
