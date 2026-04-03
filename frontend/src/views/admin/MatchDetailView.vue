<template>
  <div class="match-detail-page">
    <div class="detail-header">
      <router-link to="/admin" class="back-link"> ← Back to Dashboard </router-link>
      <div v-if="matchData" class="header-row">
        <h1 class="page-title">
          {{ matchData.match.event || 'Match Detail' }}
        </h1>
        <span v-if="!isEditing" :class="['status-badge', matchData.match.status || 'unstarted']">
          {{ formatStatus(matchData.match.status) }}
        </span>
        <select v-else v-model="editForm.status" class="status-select">
          <option value="unstarted">Unstarted</option>
          <option value="warming_up">Warming Up</option>
          <option value="in_progress">In Progress</option>
          <option value="completed">Completed</option>
        </select>

        <div class="header-actions">
          <!-- Inline Confirmation for Live Match -->
          <div v-if="showLiveConfirm" class="confirm-group">
            <span class="confirm-msg">Match is LIVE. Override?</span>
            <button class="confirm-yes-btn" @click="confirmToggleEdit">Yes</button>
            <button class="confirm-no-btn" @click="showLiveConfirm = false">No</button>
          </div>

          <button v-else-if="!isEditing" class="edit-btn" @click="toggleEdit">Edit Match</button>
          <template v-else>
            <button class="save-btn" :disabled="isSaving" @click="saveChanges">
              {{ isSaving ? 'Saving...' : 'Save Changes' }}
            </button>
            <button class="cancel-btn" :disabled="isSaving" @click="toggleEdit">Cancel</button>
          </template>

          <!-- Delete Match -->
          <div v-if="showDeleteConfirm" class="confirm-group delete-confirm">
            <span class="confirm-msg">Delete this match?</span>
            <button class="confirm-yes-btn" :disabled="isDeleting" @click="confirmDelete">
              Confirm
            </button>
            <button
              class="confirm-no-btn"
              :disabled="isDeleting"
              @click="showDeleteConfirm = false"
            >
              Cancel
            </button>
          </div>
          <button v-else-if="!isEditing" class="delete-match-btn" @click="showDeleteConfirm = true">
            Delete Match
          </button>
        </div>
      </div>
      <p class="page-subtitle">
        ID: <strong>{{ matchId }}</strong> •
        {{
          matchData?.match.scheduled_date
            ? new Date(matchData.match.scheduled_date).toLocaleDateString()
            : '—'
        }}
      </p>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="state-card">
      <p>Loading match details...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="state-card error">
      <p>{{ error }}</p>
      <router-link to="/admin" class="retry-btn"> Back to Dashboard </router-link>
    </div>

    <template v-else-if="matchData">
      <div v-if="saveError" class="save-error-banner">🛑 Error: {{ saveError }}</div>

      <div class="detail-grid">
        <!-- Match Info -->
        <section class="detail-card">
          <div class="card-header">
            <span class="card-icon">ℹ️</span>
            <h2 class="card-title">Match Overview</h2>
          </div>
          <div class="card-body">
            <div class="info-grid">
              <div class="info-item">
                <label>Players</label>
                <div class="teams-display">
                  <div class="team">
                    <div v-for="p in matchData.match.team1" :key="p.name" class="p-row">
                      <span class="p-name">{{ p.name }}</span>
                      <span class="p-country">{{ p.country }}</span>
                    </div>
                  </div>
                  <span class="vs">VS</span>
                  <div class="team">
                    <div v-for="p in matchData.match.team2" :key="p.name" class="p-row">
                      <span class="p-name">{{ p.name }}</span>
                      <span class="p-country">{{ p.country }}</span>
                    </div>
                  </div>
                </div>
              </div>
              <div class="info-item">
                <label>Best Of</label>
                <div class="val">
                  {{ matchData.match.bestOf }}
                </div>
              </div>
              <div v-if="matchData.match.status === 'in_progress'" class="info-item live-indicator">
                <label>Current Status</label>
                <div class="val active">LIVE: Game {{ matchData.match.currentGame }}</div>
              </div>
            </div>
          </div>
        </section>

        <!-- Scoreboard -->
        <section class="detail-card">
          <div class="card-header">
            <span class="card-icon">🏓</span>
            <h2 class="card-title">Scoreboard</h2>
          </div>
          <div class="card-body">
            <table class="score-table">
              <thead>
                <tr>
                  <th>Game</th>
                  <th>Team 1</th>
                  <th>Team 2</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody v-if="!isEditing">
                <tr
                  v-for="g in matchData.games"
                  :key="g.gameNumber"
                  :class="{ current: g.gameNumber === matchData.match.currentGame }"
                >
                  <td>Game {{ g.gameNumber }}</td>
                  <td :class="{ winner: g.team1Score > g.team2Score && g.status === 'completed' }">
                    {{ g.team1Score }}
                  </td>
                  <td :class="{ winner: g.team2Score > g.team1Score && g.status === 'completed' }">
                    {{ g.team2Score }}
                  </td>
                  <td>
                    <span :class="['mini-badge', g.status]">{{ g.status }}</span>
                  </td>
                </tr>
              </tbody>
              <tbody v-else>
                <tr v-for="(g, idx) in editForm.games" :key="idx">
                  <td>Game {{ idx + 1 }}</td>
                  <td>
                    <input
                      v-model.number="g.team1Score"
                      type="number"
                      class="score-input"
                      min="0"
                    />
                  </td>
                  <td>
                    <input
                      v-model.number="g.team2Score"
                      type="number"
                      class="score-input"
                      min="0"
                    />
                  </td>
                  <td><span class="auto-status-text">(Auto-determined on save)</span></td>
                  <td>
                    <button class="delete-btn" title="Delete Game" @click="deleteGame(idx)">
                      🗑️
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>

            <div v-if="isEditing" class="edit-actions">
              <button class="add-game-btn" @click="addGame">+ Add Game</button>
            </div>

            <div v-if="isEditing" class="edit-remarks">
              <label>Remarks (Force End/Retirement Reason):</label>
              <textarea
                v-model="editForm.remarks"
                placeholder="Enter reason if games don't follow normal scoring rules..."
                class="remarks-input"
              />
            </div>
          </div>
        </section>

        <!-- Cards & Timeouts -->
        <section class="detail-card">
          <div class="card-header">
            <span class="card-icon">🟨</span>
            <h2 class="card-title">Cards & Timeouts</h2>
          </div>
          <div class="card-body">
            <div
              v-if="!isEditing && (!matchData.cards || matchData.cards.length === 0)"
              class="empty-notif"
            >
              No cards or timeouts recorded for this match.
            </div>
            <table v-else class="card-log-table">
              <thead>
                <tr>
                  <th>Game</th>
                  <th>Team</th>
                  <th>Target</th>
                  <th>Type</th>
                </tr>
              </thead>
              <tbody v-if="!isEditing">
                <tr v-for="(c, idx) in matchData.cards" :key="idx">
                  <td>Game {{ c.gameNumber }}</td>
                  <td>Team {{ c.teamIndex }}</td>
                  <td>{{ getPlayerName(c.teamIndex, c.playerIndex) }}</td>
                  <td>
                    <span :class="['card-pill', c.cardType.toLowerCase().replace('-', '')]">
                      {{ c.cardType }}
                    </span>
                  </td>
                </tr>
              </tbody>
              <tbody v-else>
                <tr v-for="(c, idx) in editForm.cards" :key="idx">
                  <td>
                    <input
                      v-model.number="c.gameNumber"
                      type="number"
                      class="score-input"
                      min="1"
                      max="15"
                    />
                  </td>
                  <td>
                    <select v-model.number="c.teamIndex" class="status-select-sm">
                      <option :value="1">Team 1</option>
                      <option :value="2">Team 2</option>
                    </select>
                  </td>
                  <td>
                    <select v-model.number="c.playerIndex" class="status-select-sm">
                      <option
                        v-for="opt in getPlayerOptions(c.teamIndex)"
                        :key="opt.value"
                        :value="opt.value"
                      >
                        {{ opt.label }}
                      </option>
                    </select>
                  </td>
                  <td>
                    <select v-model="c.cardType" class="status-select-sm">
                      <option value="Yellow">Yellow</option>
                      <option value="YR1">YR1</option>
                      <option value="YR2">YR2</option>
                      <option value="Red">Red</option>
                      <option value="Timeout">Timeout</option>
                    </select>
                  </td>
                  <td>
                    <button
                      class="delete-btn"
                      title="Delete Card"
                      :data-testid="`delete-card-${idx}`"
                      @click="deleteCard(idx)"
                    >
                      🗑️
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>

            <div v-if="isEditing" class="edit-actions">
              <button class="add-game-btn" @click="addCard">+ Add Card/Timeout</button>
            </div>
          </div>
        </section>
      </div>
    </template>

    <div class="detail-footer">
      <router-link id="back-to-dashboard-link" to="/admin" class="back-btn">
        ← Back to Dashboard
      </router-link>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAdminStore } from '../../stores/adminStore'

const route = useRoute()
const router = useRouter()
const adminStore = useAdminStore()
const matchId = computed(() => route.params.id)
const matchData = ref(null)
const loading = ref(true)
const error = ref('')

const isSaving = ref(false)
const isEditing = ref(false)
const isDeleting = ref(false)
const saveError = ref('')
const showLiveConfirm = ref(false)
const showDeleteConfirm = ref(false)
const editForm = ref({
  status: 'unstarted',
  remarks: '',
  games: [],
  cards: [],
})

function toggleEdit(e) {
  if (e) e.preventDefault()

  if (isEditing.value) {
    isEditing.value = false
    saveError.value = ''
    showLiveConfirm.value = false
    return
  }

  if (matchData.value.match.status === 'in_progress' && !showLiveConfirm.value) {
    showLiveConfirm.value = true
    return
  }

  enterEditMode()
}

function confirmToggleEdit() {
  showLiveConfirm.value = false
  enterEditMode()
}

function enterEditMode() {
  editForm.value = {
    status: matchData.value.match.status || 'unstarted',
    remarks: matchData.value.match.remarks || '',
    games: JSON.parse(JSON.stringify(matchData.value.games || [])),
    cards: JSON.parse(JSON.stringify(matchData.value.cards || [])),
  }
  isEditing.value = true
}

function addGame() {
  editForm.value.games.push({
    gameNumber: editForm.value.games.length + 1,
    team1Score: 0,
    team2Score: 0,
    status: 'unstarted',
  })
}

function deleteGame(idx) {
  editForm.value.games.splice(idx, 1)
  editForm.value.games.forEach((g, i) => (g.gameNumber = i + 1))
}

function addCard() {
  editForm.value.cards.push({
    gameNumber: matchData.value.match.currentGame || 1,
    teamIndex: 1,
    playerIndex: 0,
    cardType: 'Yellow',
  })
  // Let DOM update then scroll
  setTimeout(() => {
    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' })
  }, 50)
}

function deleteCard(idx) {
  editForm.value.cards.splice(idx, 1)
}

async function saveChanges() {
  isSaving.value = true
  saveError.value = ''

  console.log('Saving match payload:', {
    status: editForm.value.status,
    games: editForm.value.games.length,
    cards: editForm.value.cards.length,
    remarks: editForm.value.remarks,
  })

  try {
    const resp = await fetch(`/api/admin/matches/${route.params.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'X-Session-ID': window.__umpireSessionId,
      },
      body: JSON.stringify({
        status: editForm.value.status,
        remarks: editForm.value.remarks,
        games: editForm.value.games,
        cards: editForm.value.cards,
      }),
      credentials: 'include',
    })

    if (!resp.ok) {
      const errText = await resp.text()
      console.error('Save failed:', errText)
      throw new Error(errText || 'Failed to update match')
    }

    isEditing.value = false
    await load()
  } catch (e) {
    console.error('Error saving match:', e)
    saveError.value = e.message || 'Failed to update match'
    window.scrollTo({ top: 0, behavior: 'smooth' })
  } finally {
    isSaving.value = false
  }
}

async function confirmDelete() {
  isDeleting.value = true
  saveError.value = ''
  try {
    await adminStore.deleteMatch(route.params.id)
    router.push('/admin')
  } catch (e) {
    console.error('Error deleting match:', e)
    saveError.value = e.message || 'Failed to delete match'
    showDeleteConfirm.value = false
    window.scrollTo({ top: 0, behavior: 'smooth' })
  } finally {
    isDeleting.value = false
  }
}

async function load() {
  loading.value = true
  error.value = ''
  try {
    const resp = await fetch(`/api/matches/${route.params.id}`, {
      credentials: 'include',
      headers: { 'X-Session-ID': window.__umpireSessionId },
    })
    if (!resp.ok) throw new Error('Match detail not found')
    matchData.value = await resp.json()
  } catch (e) {
    error.value = e.message
  } finally {
    loading.value = false
  }
}

function formatStatus(status) {
  if (!status) return 'Unstarted'
  return status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')
}

/**
 * Resolve player name from teamIndex and playerIndex.
 * Special cases: -1 = Coach, -2 = Team
 */
function getPlayerName(teamIndex, playerIndex) {
  if (playerIndex === -1) return 'Coach'
  if (playerIndex === -2) return 'Team'

  if (!matchData.value?.match) {
    return `Player ${playerIndex + 1}`
  }

  const team = teamIndex === 1 ? matchData.value.match.team1 : matchData.value.match.team2
  if (!team || !team[playerIndex]) {
    console.warn(`Player not found: teamIndex=${teamIndex}, playerIndex=${playerIndex}`)
    return `Player ${playerIndex + 1}`
  }

  return team[playerIndex].name || `Player ${playerIndex + 1}`
}

/**
 * Get player options for dropdown based on team selection.
 * Returns array of { value, label } objects.
 */
function getPlayerOptions(teamIndex) {
  const options = []

  if (!matchData.value?.match) {
    options.push({ value: 0, label: 'Player 1' })
    options.push({ value: 1, label: 'Player 2' })
  } else {
    const team = teamIndex === 1 ? matchData.value.match.team1 : matchData.value.match.team2
    if (team && team.length > 0) {
      team.forEach((player, idx) => {
        options.push({ value: idx, label: player.name || `Player ${idx + 1}` })
      })
    } else {
      options.push({ value: 0, label: 'Player 1' })
      options.push({ value: 1, label: 'Player 2' })
    }
  }

  // Add special options
  options.push({ value: -1, label: 'Coach' })
  options.push({ value: -2, label: 'Team' })

  return options
}

onMounted(load)
</script>

<style scoped>
.match-detail-page {
  max-width: 1000px;
  margin: 0 auto;
  padding-bottom: 4rem;
}

.save-error-banner {
  background: rgba(248, 113, 113, 0.1);
  border: 1px solid rgba(248, 113, 113, 0.4);
  color: #f87171;
  padding: 1rem 1.5rem;
  border-radius: 8px;
  margin-bottom: 1.5rem;
  font-weight: 600;
}

.header-actions {
  display: flex;
  gap: 0.5rem;
  margin-left: auto;
}

.edit-btn,
.save-btn,
.cancel-btn {
  padding: 0.5rem 1rem;
  border-radius: 6px;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  border: none;
  transition: all 0.2s;
}

.edit-btn {
  background: #3b82f6;
  color: white;
}
.edit-btn:hover {
  background: #2563eb;
}
.save-btn {
  background: #22c55e;
  color: white;
}
.save-btn:hover {
  background: #16a34a;
}
.save-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
.cancel-btn:hover {
  background: #334155;
}

.delete-match-btn {
  padding: 0.5rem 1rem;
  border-radius: 6px;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  border: 1px solid rgba(248, 113, 113, 0.4);
  background: rgba(248, 113, 113, 0.1);
  color: #f87171;
  transition: all 0.2s;
}

.delete-match-btn:hover {
  background: #ef4444;
  color: white;
}

.delete-confirm {
  background: rgba(239, 68, 68, 0.1) !important;
  border: 1px solid rgba(239, 68, 68, 0.3) !important;
}

.delete-confirm .confirm-msg {
  color: #ef4444 !important;
}

.status-select {
  padding: 0.35rem;
  border-radius: 6px;
  background: #1e293b;
  color: #f1f5f9;
  border: 1px solid #475569;
}

.score-input {
  width: 60px;
  padding: 0.35rem;
  border-radius: 6px;
  background: #0f172a;
  color: white;
  border: 1px solid #475569;
  text-align: center;
}

.status-select-sm {
  padding: 0.25rem;
  border-radius: 4px;
  background: #0f172a;
  color: #f1f5f9;
  border: 1px solid #475569;
  font-size: 0.8rem;
}

.auto-status-text {
  font-size: 0.75rem;
  color: #64748b;
  font-style: italic;
}

.delete-btn {
  background: none;
  border: none;
  cursor: pointer;
  opacity: 0.7;
  transition: opacity 0.2s;
}
.delete-btn:hover {
  opacity: 1;
}

.edit-actions {
  margin-top: 1rem;
}

.add-game-btn {
  background: rgba(255, 255, 255, 0.05);
  border: 1px dashed #475569;
  color: #94a3b8;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.85rem;
  transition: all 0.2s;
  width: 100%;
}

.add-game-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  color: #f1f5f9;
}

.edit-remarks {
  margin-top: 1.5rem;
  padding-top: 1.5rem;
  border-top: 1px solid rgba(255, 255, 255, 0.05);
}

.edit-remarks label {
  display: block;
  font-size: 0.8rem;
  font-weight: 700;
  color: #94a3b8;
  margin-bottom: 0.5rem;
  text-transform: uppercase;
}

.remarks-input {
  width: 100%;
  min-height: 80px;
  padding: 0.75rem;
  border-radius: 8px;
  background: #0f172a;
  border: 1px solid #475569;
  color: #f1f5f9;
  font-family: inherit;
  resize: vertical;
}

.detail-header {
  margin-bottom: 2rem;
}

.back-link {
  display: inline-block;
  color: #64748b;
  font-size: 0.9rem;
  text-decoration: none;
  margin-bottom: 0.75rem;
  transition: color 0.2s;
}

.back-link:hover {
  color: #94a3b8;
}

.header-row {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  margin-bottom: 0.4rem;
}

.page-title {
  font-size: 2rem;
  font-weight: 800;
  color: #f1f5f9;
}

.status-badge {
  padding: 0.35rem 0.75rem;
  border-radius: 8px;
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
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

.page-subtitle {
  color: #64748b;
  font-size: 0.9rem;
}

.detail-grid {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.detail-card {
  background: #1e293b;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 16px;
  overflow: hidden;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  padding: 1.1rem 1.5rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  background: rgba(255, 255, 255, 0.02);
}

.card-title {
  font-size: 0.9rem;
  font-weight: 700;
  color: #94a3b8;
  text-transform: uppercase;
  letter-spacing: 0.8px;
}

.card-body {
  padding: 1.5rem;
}

.info-grid {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr;
  gap: 2rem;
}

.info-item label {
  display: block;
  font-size: 0.7rem;
  font-weight: 700;
  color: #475569;
  text-transform: uppercase;
  margin-bottom: 0.5rem;
}

.teams-display {
  display: flex;
  align-items: center;
  gap: 1.5rem;
}

.team {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.vs {
  font-weight: 800;
  color: #334155;
  font-size: 0.8rem;
}

.p-name {
  font-weight: 600;
  color: #cbd5e1;
}

.p-country {
  font-size: 0.7rem;
  color: #475569;
  margin-left: 0.5rem;
  background: rgba(255, 255, 255, 0.05);
  padding: 0.1rem 0.3rem;
  border-radius: 4px;
}

.val {
  font-size: 1.1rem;
  font-weight: 600;
  color: #f1f5f9;
}

.val.active {
  color: #4ade80;
}

.score-table,
.card-log-table {
  width: 100%;
  border-collapse: collapse;
}

.score-table th,
.card-log-table th {
  text-align: left;
  font-size: 0.75rem;
  color: #475569;
  padding: 0.5rem 1rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.score-table td,
.card-log-table td {
  padding: 1rem;
  color: #94a3b8;
  border-bottom: 1px solid rgba(255, 255, 255, 0.03);
}

.score-table tr.current {
  background: rgba(34, 197, 94, 0.03);
}

.score-table tr.current td {
  color: #f1f5f9;
}

.winner {
  color: #4ade80 !important;
  font-weight: 700;
}

.mini-badge {
  font-size: 0.65rem;
  font-weight: 700;
  text-transform: uppercase;
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.05);
}

.mini-badge.completed {
  color: #64748b;
}
.mini-badge.in_progress {
  color: #4ade80;
  background: rgba(34, 197, 94, 0.1);
}

.card-pill {
  font-size: 0.65rem;
  font-weight: 700;
  padding: 0.25rem 0.6rem;
  border-radius: 4px;
  text-transform: uppercase;
}

.card-pill.yellow {
  background: #facc15;
  color: #422006;
}
.card-pill.yellowred {
  background: linear-gradient(to right, #facc15, #f87171);
  color: #450a0a;
}
.card-pill.yr1 {
  background: linear-gradient(to right, #facc15, #f87171);
  color: #450a0a;
}
.card-pill.yr2 {
  background: linear-gradient(to right, #facc15, #f87171);
  color: #450a0a;
}
.card-pill.red {
  background: #f87171;
  color: #450a0a;
}
.card-pill.timeout {
  background: #60a5fa;
  color: #1e3a8a;
}

.empty-notif {
  color: #475569;
  font-style: italic;
  font-size: 0.9rem;
}

.detail-footer {
  margin-top: 2rem;
  padding-top: 1.5rem;
  border-top: 1px solid rgba(255, 255, 255, 0.06);
}

.back-btn {
  display: inline-flex;
  align-items: center;
  padding: 0.65rem 1.4rem;
  border-radius: 10px;
  font-size: 0.9rem;
  font-weight: 600;
  text-decoration: none;
  background: rgba(255, 255, 255, 0.06);
  color: #94a3b8;
  transition: all 0.2s;
}

.back-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  color: #f1f5f9;
}

.state-card {
  background: rgba(255, 255, 255, 0.02);
  padding: 3rem;
  text-align: center;
  border-radius: 16px;
  color: #64748b;
}

.state-card.error {
  color: #f87171;
  background: rgba(248, 113, 113, 0.05);
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

.card-icon {
  font-size: 1.1rem;
}

.page-subtitle strong {
  color: #94a3b8;
  font-family: 'Courier New', monospace;
  font-size: 0.85rem;
}
</style>
