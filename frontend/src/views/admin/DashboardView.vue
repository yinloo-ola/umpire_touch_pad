<template>
  <div class="admin-dashboard">
    <!-- Page Header -->
    <div class="page-header">
      <div class="page-header-left">
        <h1 class="page-title">Match Dashboard</h1>
        <div class="header-controls">
          <p class="page-subtitle">{{ showHistory ? 'Full Match History' : 'Today\'s scheduled matches' }}</p>
          <button @click="toggleHistory" class="history-toggle" :class="{ active: showHistory }">
             <i class="fa-solid" :class="showHistory ? 'fa-calendar-check' : 'fa-clock-rotate-left'"></i>
             {{ showHistory ? 'Showing History' : 'Show History' }}
          </button>
        </div>
      </div>
      <div class="header-actions">
        <div v-if="selectedMatches.length > 0" class="bulk-actions">
          <span class="selected-count">{{ selectedMatches.length }} selected</span>
          
          <div v-if="showBulkDeleteConfirm" class="confirm-group bulk-confirm">
            <span class="confirm-msg">Delete {{ selectedMatches.length }}?</span>
            <button @click="handleBulkDelete" class="confirm-yes-btn" :disabled="deleting">Yes</button>
            <button @click="showBulkDeleteConfirm = false" class="confirm-no-btn" :disabled="deleting">No</button>
          </div>
          
          <button v-else @click="showBulkDeleteConfirm = true" class="bulk-delete-btn" :disabled="deleting">
            <i class="fa-solid fa-trash-can"></i> Delete Selected
          </button>
        </div>
        <router-link id="create-match-btn" to="/admin/match/new" class="create-btn">
          <span>+</span> Create Match
        </router-link>
      </div>
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

    <template v-else>
      <!-- Filter Bar -->
      <div class="filter-bar">
        <div class="filter-group">
          <label>Status:</label>
          <div class="filter-chips">
            <button 
              v-for="status in ['all', 'unstarted', 'starting', 'warming_up', 'in_progress', 'completed']" 
              :key="status"
              @click="statusFilter = status"
              :class="['filter-chip', { active: statusFilter === status }]"
            >
              {{ status === 'all' ? 'All' : formatStatus(status) }}
            </button>
          </div>
        </div>
        <div class="filter-group table-filter-group">
          <label>Table:</label>
          <select v-model="tableFilter" class="filter-input select-filter">
            <option value="">All Tables</option>
            <option v-for="t in availableTables" :key="t" :value="t">Table {{ t }}</option>
          </select>
        </div>
      </div>

      <!-- Empty State -->
      <div v-if="!filteredMatches || filteredMatches.length === 0" class="state-card empty-state">
        <span class="empty-icon">🏓</span>
        <p class="empty-title">{{ showHistory ? 'No matches found in history' : 'No matches scheduled today' }}</p>
        <p class="empty-sub">Try changing your filters or create a new match.</p>
        <router-link to="/admin/match/new" class="create-btn">
          + Create Match
        </router-link>
      </div>

      <!-- Matches Table -->
      <div v-else class="matches-panel">
      <table class="admin-table">
        <thead>
          <tr>
            <th class="checkbox-cell">
              <input 
                type="checkbox" 
                :checked="isAllSelected" 
                :indeterminate="isPartiallySelected"
                @change="toggleSelectAll"
              >
            </th>
            <th>Event</th>
            <th>Type</th>
            <th>Table</th>
            <th>Scheduled Time</th>
            <th>Team 1</th>
            <th>Team 2</th>
            <th>Status</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="match in filteredMatches"
            :key="match.id"
            class="match-row"
            :class="{ selected: selectedMatches.includes(match.id) }"
            @click="goToMatch(match.id)"
          >
            <td class="checkbox-cell" @click.stop>
              <input 
                type="checkbox" 
                v-model="selectedMatches" 
                :value="match.id"
              >
            </td>
            <td class="event-cell">{{ match.event || '—' }}</td>
            <td><span class="type-badge" :class="match.type">{{ match.type }}</span></td>
            <td class="table-cell">
              <span v-if="match.tableNumber" class="table-tag">T{{ match.tableNumber }}</span>
              <span v-else>—</span>
            </td>
            <td class="time-cell">{{ formatTime(match.time) }}</td>
            <td>{{ formatTeam(match.team1) }}</td>
            <td>{{ formatTeam(match.team2) }}</td>
            <td>
              <span class="status-badge" :class="match.status || 'unstarted'">
                {{ formatStatus(match.status) }}
              </span>
            </td>
            <td class="action-cell">
              <span class="view-arrow">→</span>
            </td>
          </tr>
        </tbody>
      </table>
      </div>
    </template>
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
const deleting = ref(false)
const showHistory = ref(false)
const statusFilter = ref('all')
const tableFilter = ref('')
const selectedMatches = ref([])
const showBulkDeleteConfirm = ref(false)

async function load() {
  loading.value = true
  error.value = ''
  try {
    await adminStore.fetchMatches(showHistory.value)
  } catch (e) {
    error.value = e.message || 'Failed to load matches'
  } finally {
    loading.value = false
  }
}

async function toggleHistory() {
  showHistory.value = !showHistory.value
  selectedMatches.value = []
  await load()
}

import { computed } from 'vue'

const isAllSelected = computed(() => {
  return filteredMatches.value.length > 0 && selectedMatches.value.length === filteredMatches.value.length
})

const isPartiallySelected = computed(() => {
  return selectedMatches.value.length > 0 && selectedMatches.value.length < filteredMatches.value.length
})

function toggleSelectAll() {
  if (isAllSelected.value) {
    selectedMatches.value = []
  } else {
    selectedMatches.value = filteredMatches.value.map(m => m.id)
  }
}

async function handleBulkDelete() {
  if (!selectedMatches.value.length) return
  
  deleting.value = true
  error.value = ''
  try {
    await adminStore.deleteMatches(selectedMatches.value)
    selectedMatches.value = []
    showBulkDeleteConfirm.value = false
    await load()
  } catch (e) {
    error.value = e.message || 'Failed to delete matches'
  } finally {
    deleting.value = false
  }
}
const availableTables = computed(() => {
  const tables = adminStore.matches
    .map(m => m.tableNumber)
    .filter(t => t != null && t > 0)
  return [...new Set(tables)].sort((a, b) => a - b)
})

const filteredMatches = computed(() => {
  let list = adminStore.matches
  
  if (statusFilter.value !== 'all') {
    list = list.filter(m => (m.status || 'unstarted') === statusFilter.value)
  }
  
  if (tableFilter.value) {
    const tNum = parseInt(tableFilter.value)
    list = list.filter(m => m.tableNumber === tNum)
  }
  
  return list
})

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

function formatStatus(status) {
  if (!status) return 'Unstarted'
  return status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')
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
  align-items: center;
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
}

.header-controls {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  margin-top: 0.25rem;
}

.history-toggle {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: #94a3b8;
  padding: 0.4rem 0.8rem;
  border-radius: 8px;
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.history-toggle:hover {
  background: rgba(255, 255, 255, 0.1);
  color: #cbd5e1;
}

.history-toggle.active {
  background: rgba(33, 156, 6, 0.15);
  color: #4ade80;
  border-color: rgba(33, 156, 6, 0.3);
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

.header-actions {
  display: flex;
  align-items: center;
}

.filter-bar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 2.5rem 2rem; /* Vertical 2.5rem, Horizontal 2rem */
  margin-bottom: 2rem;
  padding: 1.25rem 1.5rem;
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 12px;
}

.table-filter-group {
  /* margin-left: auto; Removed to allow justify-content: space-between to handle it */
}

.filter-group {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.filter-group label {
  font-size: 0.8rem;
  font-weight: 700;
  color: #475569;
  text-transform: uppercase;
}

.filter-chips {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.filter-chip {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.08);
  color: #64748b;
  padding: 0.35rem 0.75rem;
  border-radius: 100px;
  font-size: 0.75rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.filter-chip:hover {
  background: rgba(255, 255, 255, 0.1);
  color: #94a3b8;
}

.filter-chip.active {
  border-color: #219c06;
}

.filter-input {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: #f1f5f9;
  padding: 0.35rem 0.75rem;
  border-radius: 8px;
  font-size: 0.85rem;
  width: 120px;
  outline: none;
  font-family: inherit;
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

.filter-input:focus {
  border-color: #219c06;
  background: rgba(33, 156, 6, 0.05);
}

.table-tag {
  background: rgba(255, 255, 255, 0.05);
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
  font-weight: 700;
  font-size: 0.85rem;
  color: #94a3b8;
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
.match-row.selected {
  background: rgba(33, 156, 6, 0.08);
}

.match-row.selected td {
  color: #f1f5f9;
}

.bulk-actions {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding-right: 1.5rem;
  border-right: 1px solid rgba(255, 255, 255, 0.1);
  margin-right: 1.5rem;
}

.selected-count {
  font-size: 0.85rem;
  font-weight: 600;
  color: #4ade80;
}

.bulk-delete-btn {
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.2);
  color: #ef4444;
  padding: 0.4rem 0.8rem;
  border-radius: 8px;
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.bulk-delete-btn:hover:not(:disabled) {
  background: rgba(239, 68, 68, 0.2);
  border-color: rgba(239, 68, 68, 0.3);
}

.bulk-delete-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.checkbox-cell {
  width: 48px;
  padding-right: 0 !important;
  text-align: center !important;
}

.checkbox-cell input[type="checkbox"] {
  width: 16px;
  height: 16px;
  cursor: pointer;
  accent-color: #219c06;
}

.confirm-group {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  background: rgba(244, 63, 94, 0.1);
  padding: 0.35rem 0.75rem;
  border-radius: 8px;
  border: 1px solid rgba(244, 63, 94, 0.2);
}

.confirm-msg {
  font-size: 0.75rem;
  font-weight: 700;
  color: #fb7185;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.confirm-yes-btn {
  background: #e11d48;
  color: white;
  border: none;
  padding: 0.25rem 0.6rem;
  border-radius: 4px;
  font-size: 0.7rem;
  font-weight: 700;
  cursor: pointer;
}

.confirm-no-btn {
  background: #475569;
  color: white;
  border: none;
  padding: 0.25rem 0.6rem;
  border-radius: 4px;
  font-size: 0.7rem;
  font-weight: 700;
  cursor: pointer;
}
</style>
