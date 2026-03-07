<template>
  <div class="match-detail-page">
    <div class="detail-header">
      <router-link to="/admin" class="back-link">← Back to Dashboard</router-link>
      <div v-if="matchData" class="header-row">
        <h1 class="page-title">{{ matchData.match.event || 'Match Detail' }}</h1>
        <span :class="['status-badge', matchData.match.status || 'unstarted']">
          {{ formatStatus(matchData.match.status) }}
        </span>
      </div>
      <p class="page-subtitle">ID: <strong>{{ matchId }}</strong> • {{ matchData?.match.scheduled_date ? new Date(matchData.match.scheduled_date).toLocaleDateString() : '—' }}</p>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="state-card">
       <p>Loading match details...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="state-card error">
       <p>{{ error }}</p>
       <router-link to="/admin" class="retry-btn">Back to Dashboard</router-link>
    </div>

    <template v-else-if="matchData">
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
                <div class="val">{{ matchData.match.bestOf }}</div>
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
              <tbody>
                <tr v-for="g in matchData.games" :key="g.gameNumber" :class="{ current: g.gameNumber === matchData.match.currentGame }">
                  <td>Game {{ g.gameNumber }}</td>
                  <td :class="{ winner: g.team1Score > g.team2Score && g.status === 'completed' }">{{ g.team1Score }}</td>
                  <td :class="{ winner: g.team2Score > g.team1Score && g.status === 'completed' }">{{ g.team2Score }}</td>
                  <td>
                    <span :class="['mini-badge', g.status]">{{ g.status }}</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <!-- Cards & Timeouts -->
        <section class="detail-card">
          <div class="card-header">
            <span class="card-icon">🟨</span>
            <h2 class="card-title">Cards & Timeouts</h2>
          </div>
          <div class="card-body">
            <div v-if="!matchData.cards || matchData.cards.length === 0" class="empty-notif">
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
              <tbody>
                <tr v-for="(c, idx) in matchData.cards" :key="idx">
                  <td>Game {{ c.gameNumber }}</td>
                  <td>Team {{ c.teamIndex }}</td>
                  <td>
                    {{ c.playerIndex === -1 ? 'Coach' : (c.playerIndex === -2 ? 'Team' : 'Player') }}
                  </td>
                  <td>
                    <span :class="['card-pill', c.cardType.toLowerCase().replace('-', '')]">
                      {{ c.cardType }}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </template>

    <div class="detail-footer">
      <router-link id="back-to-dashboard-link" to="/admin" class="back-btn">← Back to Dashboard</router-link>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const matchId = computed(() => route.params.id)
const matchData = ref(null)
const loading = ref(true)
const error = ref('')

async function load() {
  loading.value = true
  error.value = ''
  try {
    const resp = await fetch(`http://localhost:8080/api/matches/${route.params.id}`, {
      credentials: 'include'
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

onMounted(load)
</script>

<style scoped>
.match-detail-page {
  max-width: 1000px;
  margin: 0 auto;
  padding-bottom: 4rem;
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

.status-badge.unstarted { background: rgba(148, 163, 184, 0.1); color: #94a3b8; border: 1px solid rgba(148, 163, 184, 0.2); }
.status-badge.starting { background: rgba(59, 130, 246, 0.1); color: #60a5fa; border: 1px solid rgba(59, 130, 246, 0.2); }
.status-badge.warming_up { background: rgba(234, 179, 8, 0.1); color: #facc15; border: 1px solid rgba(234, 179, 8, 0.2); }
.status-badge.in_progress { background: rgba(34, 197, 94, 0.1); color: #4ade80; border: 1px solid rgba(34, 197, 94, 0.2); }
.status-badge.completed { background: rgba(139, 92, 246, 0.1); color: #a78bfa; border: 1px solid rgba(139, 92, 246, 0.2); }

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

.score-table, .card-log-table {
  width: 100%;
  border-collapse: collapse;
}

.score-table th, .card-log-table th {
  text-align: left;
  font-size: 0.75rem;
  color: #475569;
  padding: 0.5rem 1rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.score-table td, .card-log-table td {
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

.mini-badge.completed { color: #64748b; }
.mini-badge.in_progress { color: #4ade80; background: rgba(34, 197, 94, 0.1); }

.card-pill {
  font-size: 0.65rem;
  font-weight: 700;
  padding: 0.25rem 0.6rem;
  border-radius: 4px;
  text-transform: uppercase;
}

.card-pill.yellow { background: #facc15; color: #422006; }
.card-pill.yellowred { background: linear-gradient(to right, #facc15, #f87171); color: #450a0a; }
.card-pill.red { background: #f87171; color: #450a0a; }
.card-pill.timeout { background: #60a5fa; color: #1e3a8a; }

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
</style>

<style scoped>
.match-detail-page {
  max-width: 1000px;
  margin: 0 auto;
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
  gap: 1rem;
  margin-bottom: 0.4rem;
}

.page-title {
  font-size: 1.75rem;
  font-weight: 700;
  color: #f1f5f9;
}

.match-id-badge {
  font-size: 0.75rem;
  font-weight: 600;
  font-family: 'Courier New', monospace;
  background: rgba(255, 255, 255, 0.06);
  color: #64748b;
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.page-subtitle {
  color: #64748b;
  font-size: 0.9rem;
}

.page-subtitle strong {
  color: #94a3b8;
  font-family: 'Courier New', monospace;
  font-size: 0.85rem;
}

.detail-grid {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
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

.card-icon {
  font-size: 1.1rem;
}

.card-title {
  font-size: 0.95rem;
  font-weight: 700;
  color: #94a3b8;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.card-body {
  padding: 1.5rem;
}

.placeholder-body {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 80px;
}

.placeholder-text {
  color: #475569;
  font-size: 0.9rem;
  text-align: center;
  max-width: 600px;
  line-height: 1.6;
}

.placeholder-text code {
  background: rgba(255, 255, 255, 0.06);
  color: #64748b;
  padding: 0.1rem 0.4rem;
  border-radius: 4px;
  font-family: 'Courier New', monospace;
  font-size: 0.85em;
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
</style>
