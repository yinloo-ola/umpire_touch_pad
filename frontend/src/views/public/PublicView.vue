<script setup>
import { ref, computed, onMounted } from 'vue'
import { usePublicStore } from '../../stores/publicStore'

const publicStore = usePublicStore()

// Filter state
const tableFilter = ref('')
const timeFilter = ref('all')
const activeTab = ref('completed')

// Fetch data on mount
onMounted(() => {
  publicStore.fetchPublicMatches()
})

// Computed: all matches combined for table filter options
const allMatches = computed(() => [
  ...publicStore.completed,
  ...publicStore.scheduled,
  ...publicStore.live,
])

// Computed: unique table numbers for filter dropdown
const availableTables = computed(() => {
  const tables = allMatches.value.map((m) => m.tableNumber).filter((t) => t != null && t > 0)
  return [...new Set(tables)].sort((a, b) => a - b)
})

// Helper: check if date is today
function isToday(dateStr) {
  if (!dateStr) return false
  const date = new Date(dateStr)
  const today = new Date()
  return date.toDateString() === today.toDateString()
}

// Helper: check if date is in the future
function isFuture(dateStr) {
  if (!dateStr) return false
  const date = new Date(dateStr)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return date > today
}

// Computed: current tab's matches
const currentMatches = computed(() => {
  let matches = []
  if (activeTab.value === 'completed') matches = publicStore.completed
  else if (activeTab.value === 'scheduled') matches = publicStore.scheduled
  else matches = publicStore.live

  // Apply table filter
  if (tableFilter.value) {
    const tNum = parseInt(tableFilter.value)
    matches = matches.filter((m) => m.tableNumber === tNum)
  }

  // Apply time filter
  if (timeFilter.value === 'today') {
    matches = matches.filter((m) => isToday(m.scheduledDate))
  } else if (timeFilter.value === 'upcoming') {
    matches = matches.filter((m) => isFuture(m.scheduledDate))
  }

  return matches
})

// Format last updated timestamp
const formattedLastUpdated = computed(() => {
  if (!publicStore.lastUpdated) return 'Never'
  const date = new Date(publicStore.lastUpdated)
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  })
})

// Handle refresh
function handleRefresh() {
  publicStore.fetchPublicMatches()
}

// Format score for display
function formatGameScore(game) {
  return `${game.team1Score}-${game.team2Score}`
}

// Get aggregate score for completed matches
function getAggregateScore(match) {
  if (!match.games || match.games.length === 0) return null
  let team1Wins = 0
  let team2Wins = 0
  for (const game of match.games) {
    if (game.team1Score > game.team2Score) team1Wins++
    else if (game.team2Score > game.team1Score) team2Wins++
  }
  return { team1: team1Wins, team2: team2Wins }
}

// Get individual game scores string
function getGameScores(match) {
  if (!match.games || match.games.length === 0) return ''
  return match.games
    .filter((g) => g.status === 'completed' || g.team1Score > 0 || g.team2Score > 0)
    .map(formatGameScore)
    .join(', ')
}

// Switch tab
function setTab(tab) {
  activeTab.value = tab
}

// Retry after error
function handleRetry() {
  publicStore.fetchPublicMatches()
}
</script>

<template>
  <div class="public-view">
    <!-- Header -->
    <header class="public-header">
      <div class="header-content">
        <h1 class="page-title">Tournament Matches</h1>
        <div class="header-actions">
          <button class="refresh-btn" :disabled="publicStore.loading" @click="handleRefresh">
            <svg
              class="refresh-icon"
              :class="{ spinning: publicStore.loading }"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <path
                d="M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"
              />
            </svg>
            <span>Refresh</span>
          </button>
          <span class="last-updated">Last updated: {{ formattedLastUpdated }}</span>
        </div>
      </div>
    </header>

    <!-- Filter Bar -->
    <div class="filter-bar">
      <div class="filter-group">
        <label for="table-filter">Table:</label>
        <select id="table-filter" v-model="tableFilter" class="filter-select">
          <option value="">All Tables</option>
          <option v-for="t in availableTables" :key="t" :value="t">Table {{ t }}</option>
        </select>
      </div>
      <div class="filter-group">
        <label for="time-filter">Time:</label>
        <select id="time-filter" v-model="timeFilter" class="filter-select">
          <option value="all">All</option>
          <option value="today">Today</option>
          <option value="upcoming">Upcoming</option>
        </select>
      </div>
    </div>

    <!-- Tab Navigation -->
    <nav class="tab-nav">
      <button
        :class="['tab-btn', { active: activeTab === 'completed' }]"
        @click="setTab('completed')"
      >
        <span class="tab-label">Completed</span>
        <span class="tab-count">{{ publicStore.completed.length }}</span>
      </button>
      <button
        :class="['tab-btn', { active: activeTab === 'scheduled' }]"
        @click="setTab('scheduled')"
      >
        <span class="tab-label">Scheduled</span>
        <span class="tab-count">{{ publicStore.scheduled.length }}</span>
      </button>
      <button :class="['tab-btn', { active: activeTab === 'live' }]" @click="setTab('live')">
        <span class="tab-label">Live</span>
        <span class="tab-count">{{ publicStore.live.length }}</span>
      </button>
    </nav>

    <!-- Content Area -->
    <main class="content-area">
      <!-- Loading State -->
      <div v-if="publicStore.loading" class="loading-state">
        <div class="spinner" />
        <p>Loading matches...</p>
      </div>

      <!-- Error State -->
      <div v-else-if="publicStore.error" class="error-state">
        <svg
          class="error-icon"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
        >
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
        <p>{{ publicStore.error }}</p>
        <button class="retry-btn" @click="handleRetry">Try Again</button>
      </div>

      <!-- Empty State -->
      <div v-else-if="currentMatches.length === 0" class="empty-state">
        <svg
          class="empty-icon"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="1.5"
        >
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
        <p>No {{ activeTab }} matches{{ tableFilter ? ` for Table ${tableFilter}` : '' }}</p>
      </div>

      <!-- Match Cards -->
      <div v-else class="match-cards">
        <div
          v-for="match in currentMatches"
          :key="match.id"
          class="match-card"
          :class="{ 'is-live': activeTab === 'live' }"
        >
          <!-- Card Header: Title & Table -->
          <div class="card-header">
            <h3 class="match-title">
              {{ match.title || match.event || 'Match' }}
            </h3>
            <span v-if="match.tableNumber" class="table-badge"> T{{ match.tableNumber }} </span>
            <span v-else class="table-badge unassigned"> -- </span>
          </div>

          <!-- Teams Section -->
          <div class="teams-section">
            <!-- Team 1 -->
            <div class="team team-1">
              <div class="players">
                <template v-if="match.team1 && match.team1.length > 0">
                  <div v-for="(player, idx) in match.team1" :key="idx" class="player">
                    <span class="player-name">{{ player.name }}</span>
                    <span v-if="player.country" class="country-code">{{ player.country }}</span>
                  </div>
                </template>
                <div v-else class="player tbd">TBD</div>
              </div>
              <div v-if="activeTab === 'completed' || activeTab === 'live'" class="team-score">
                <template v-if="getAggregateScore(match)">
                  {{ getAggregateScore(match).team1 }}
                </template>
              </div>
            </div>

            <!-- VS Divider -->
            <div class="vs-divider">
              <span>vs</span>
            </div>

            <!-- Team 2 -->
            <div class="team team-2">
              <div class="players">
                <template v-if="match.team2 && match.team2.length > 0">
                  <div v-for="(player, idx) in match.team2" :key="idx" class="player">
                    <span class="player-name">{{ player.name }}</span>
                    <span v-if="player.country" class="country-code">{{ player.country }}</span>
                  </div>
                </template>
                <div v-else class="player tbd">TBD</div>
              </div>
              <div v-if="activeTab === 'completed' || activeTab === 'live'" class="team-score">
                <template v-if="getAggregateScore(match)">
                  {{ getAggregateScore(match).team2 }}
                </template>
              </div>
            </div>
          </div>

          <!-- Game Scores -->
          <div
            v-if="(activeTab === 'completed' || activeTab === 'live') && getGameScores(match)"
            class="game-scores"
          >
            <span class="scores-label">Games:</span>
            <span class="scores-value">{{ getGameScores(match) }}</span>
          </div>

          <!-- Scheduled Time -->
          <div v-if="activeTab === 'scheduled' && match.scheduledDate" class="scheduled-time">
            <svg
              class="clock-icon"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            <span>{{
              new Date(match.scheduledDate).toLocaleString('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })
            }}</span>
          </div>

          <!-- Live Indicator -->
          <div v-if="activeTab === 'live'" class="live-indicator">
            <span class="live-dot" />
            <span>In Progress</span>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<style scoped>
/* CSS Variables for WTT-inspired theming */
.public-view {
  /* WTT brand-inspired palette: clean, professional, spectator-friendly */
  --wtt-navy: #1a2744;
  --wtt-blue: #2563eb;
  --wtt-cyan: #06b6d4;
  --wtt-orange: #f97316;
  --wtt-green: #22c55e;
  --wtt-purple: #8b5cf6;
  --wtt-red: #ef4444;

  --primary: var(--wtt-blue);
  --primary-dark: #1d4ed8;
  --accent: var(--wtt-orange);
  --accent-live: var(--wtt-red);
  --accent-completed: var(--wtt-green);
  --accent-scheduled: var(--wtt-purple);

  --bg-main: #f1f5f9;
  --bg-card: #ffffff;
  --bg-header: linear-gradient(135deg, var(--wtt-navy) 0%, #2d3a52 100%);
  --text-primary: #0f172a;
  --text-secondary: #475569;
  --text-muted: #94a3b8;
  --border: #e2e8f0;
  --border-light: #f1f5f9;

  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
  --shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.07), 0 2px 4px -2px rgba(0, 0, 0, 0.05);
  --shadow-md: 0 6px 12px -2px rgba(0, 0, 0, 0.08), 0 4px 8px -4px rgba(0, 0, 0, 0.04);
  --shadow-lg: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.05);
  --shadow-hover: 0 12px 24px -4px rgba(37, 99, 235, 0.15), 0 6px 12px -4px rgba(0, 0, 0, 0.08);

  --radius: 14px;
  --radius-sm: 8px;
  --radius-pill: 999px;

  height: 100%;
  display: flex;
  flex-direction: column;
  background: var(--bg-main);
  font-family:
    'Outfit',
    system-ui,
    -apple-system,
    sans-serif;
  color: var(--text-primary);
  overflow: hidden;
  /* Subtle background texture for depth */
  background-image:
    radial-gradient(ellipse at top, rgba(37, 99, 235, 0.03) 0%, transparent 50%),
    radial-gradient(ellipse at bottom right, rgba(249, 115, 22, 0.02) 0%, transparent 50%);
}

/* Header - WTT-inspired with gradient and premium feel */
.public-header {
  background: var(--bg-header);
  color: white;
  padding: 1.25rem 1rem;
  position: sticky;
  top: 0;
  z-index: 100;
  box-shadow: var(--shadow-md);
}

.header-content {
  max-width: 1280px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

/* Tablet+: horizontal layout */
@media (min-width: 768px) {
  .header-content {
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
    padding: 0 1rem;
    gap: 1rem;
  }
}

/* Desktop: larger padding */
@media (min-width: 1280px) {
  .public-header {
    padding: 1.5rem 2rem;
  }
  .header-content {
    padding: 0 2rem;
  }
}

.page-title {
  font-size: 1.5rem;
  font-weight: 700;
  margin: 0;
  letter-spacing: -0.03em;
  background: linear-gradient(135deg, #ffffff 0%, #e0e7ff 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

/* Desktop: larger title */
@media (min-width: 1280px) {
  .page-title {
    font-size: 1.75rem;
  }
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.refresh-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  background: rgba(255, 255, 255, 0.12);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: white;
  padding: 0.5rem 1rem;
  border-radius: var(--radius-sm);
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.refresh-btn:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.2);
  border-color: rgba(255, 255, 255, 0.3);
  transform: translateY(-1px);
}

.refresh-btn:active:not(:disabled) {
  transform: translateY(0);
}

.refresh-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.refresh-icon {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
}

.refresh-icon.spinning {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.last-updated {
  font-size: 0.75rem;
  opacity: 0.85;
  font-weight: 500;
}

/* Filter Bar - responsive stacking on mobile */
.filter-bar {
  background: var(--bg-card);
  border-bottom: 1px solid var(--border);
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

/* Tablet+: horizontal layout */
@media (min-width: 768px) {
  .filter-bar {
    flex-direction: row;
    gap: 1.5rem;
    padding: 1rem 1.5rem;
  }
}

/* Desktop: larger padding */
@media (min-width: 1280px) {
  .filter-bar {
    padding: 1.25rem 2rem;
  }
}

.filter-group {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.filter-group label {
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--text-secondary);
  white-space: nowrap;
}

.filter-select {
  background: var(--bg-main);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  padding: 0.5rem 2.25rem 0.5rem 0.75rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--text-primary);
  cursor: pointer;
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%23475569'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2.5' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 0.5rem center;
  background-size: 1.125rem;
  transition:
    border-color 0.15s,
    box-shadow 0.15s;
  min-width: 120px;
}

.filter-select:focus {
  outline: none;
  border-color: var(--primary);
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.12);
}

.filter-select:hover {
  border-color: var(--text-muted);
}

/* Tab Navigation - pill-style with clear active state */
.tab-nav {
  padding: 0 1rem;
  display: flex;
  gap: 0.5rem;
  background: var(--bg-card);
  border-bottom: 1px solid var(--border);
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}

/* Tablet+: more padding */
@media (min-width: 768px) {
  .tab-nav {
    padding: 0 1.5rem;
    gap: 0.25rem;
  }
}

/* Desktop: even more padding */
@media (min-width: 1280px) {
  .tab-nav {
    padding: 0 2rem;
  }
}

.tab-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 1rem 1rem;
  background: transparent;
  border: none;
  border-bottom: 3px solid transparent;
  color: var(--text-secondary);
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.tab-btn:hover {
  color: var(--text-primary);
  background: rgba(37, 99, 235, 0.04);
}

.tab-btn.active {
  color: var(--primary);
  border-bottom-color: var(--primary);
}

.tab-label {
  font-weight: 600;
}

.tab-count {
  background: var(--bg-main);
  padding: 0.125rem 0.5rem;
  border-radius: var(--radius-pill);
  font-size: 0.7rem;
  font-weight: 700;
  min-width: 1.5rem;
  text-align: center;
}

.tab-btn.active .tab-count {
  background: var(--primary);
  color: white;
}

/* Tab-specific colors for active state */
.tab-btn:has(.tab-count) {
  position: relative;
}

.tab-btn:nth-child(1).active .tab-count {
  background: var(--accent-completed);
}
.tab-btn:nth-child(1).active {
  color: var(--accent-completed);
  border-bottom-color: var(--accent-completed);
}

.tab-btn:nth-child(2).active .tab-count {
  background: var(--accent-scheduled);
}
.tab-btn:nth-child(2).active {
  color: var(--accent-scheduled);
  border-bottom-color: var(--accent-scheduled);
}

.tab-btn:nth-child(3).active .tab-count {
  background: var(--accent-live);
}
.tab-btn:nth-child(3).active {
  color: var(--accent-live);
  border-bottom-color: var(--accent-live);
}

/* Content Area */
.content-area {
  max-width: 1280px;
  margin: 0 auto;
  padding: 1.25rem 1rem;
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  width: 100%;
}

/* Desktop: larger padding */
@media (min-width: 1280px) {
  .content-area {
    padding: 1.5rem 2rem;
  }
}

/* Loading State */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  color: var(--text-secondary);
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid var(--border);
  border-top-color: var(--primary);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin-bottom: 1rem;
}

/* Error State */
.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  color: var(--accent-live);
  text-align: center;
}

.error-icon {
  width: 48px;
  height: 48px;
  margin-bottom: 1rem;
  opacity: 0.8;
}

.retry-btn {
  margin-top: 1rem;
  background: var(--accent-live);
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: var(--radius-sm);
  font-weight: 600;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.retry-btn:hover {
  opacity: 0.9;
  transform: translateY(-1px);
}

/* Empty State */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  color: var(--text-muted);
}

.empty-icon {
  width: 48px;
  height: 48px;
  margin-bottom: 1rem;
  opacity: 0.6;
}

/* Match Cards Grid - Mobile-first responsive */
.match-cards {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1rem;
}

/* Tablet (768px+): 2 columns */
@media (min-width: 768px) {
  .match-cards {
    grid-template-columns: repeat(2, 1fr);
    gap: 1.25rem;
  }
}

/* Desktop (1280px+): 3 columns */
@media (min-width: 1280px) {
  .match-cards {
    grid-template-columns: repeat(3, 1fr);
    gap: 1.5rem;
  }
}

/* Match Card - WTT-inspired premium design */
.match-card {
  background: var(--bg-card);
  border-radius: var(--radius);
  box-shadow: var(--shadow);
  overflow: hidden;
  transition:
    transform 0.25s ease,
    box-shadow 0.25s ease;
  position: relative;
}

.match-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-hover);
}

.match-card.is-live {
  border: 2px solid var(--accent-live);
  animation: live-border-pulse 2s ease-in-out infinite;
}

@keyframes live-border-pulse {
  0%,
  100% {
    border-color: var(--accent-live);
  }
  50% {
    border-color: rgba(239, 68, 68, 0.4);
  }
}

/* Card Header - match title and table number */
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.875rem 1rem;
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  border-bottom: 1px solid var(--border-light);
}

.match-title {
  font-size: 0.875rem;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  letter-spacing: -0.01em;
}

.table-badge {
  background: var(--wtt-navy);
  color: white;
  padding: 0.25rem 0.6rem;
  border-radius: var(--radius-sm);
  font-size: 0.75rem;
  font-weight: 700;
  margin-left: 0.75rem;
  flex-shrink: 0;
  letter-spacing: 0.02em;
}

.table-badge.unassigned {
  background: var(--text-muted);
}

/* Teams Section - player display with scores */
.teams-section {
  padding: 1rem;
}

.team {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 0.5rem;
}

.players {
  flex: 1;
  min-width: 0;
}

.player {
  display: flex;
  align-items: baseline;
  gap: 0.375rem;
  margin-bottom: 0.125rem;
}

.player:last-child {
  margin-bottom: 0;
}

.player-name {
  font-weight: 600;
  font-size: 0.9rem;
  color: var(--text-primary);
  letter-spacing: -0.01em;
}

.player.tbd {
  color: var(--text-muted);
  font-style: italic;
  font-weight: 500;
}

.country-code {
  font-size: 0.7rem;
  font-weight: 700;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.team-score {
  font-size: 1.75rem;
  font-weight: 800;
  color: var(--primary);
  min-width: 2.5rem;
  text-align: right;
  letter-spacing: -0.02em;
  line-height: 1;
}

.vs-divider {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.625rem 0;
}

.vs-divider span {
  font-size: 0.65rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  color: var(--text-muted);
  background: var(--bg-main);
  padding: 0.25rem 0.875rem;
  border-radius: var(--radius-pill);
}

/* Game Scores - compact row with each game result */
.game-scores {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  background: var(--bg-main);
  border-top: 1px solid var(--border-light);
  font-size: 0.8rem;
}

.scores-label {
  color: var(--text-muted);
  font-weight: 600;
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.scores-value {
  color: var(--text-secondary);
  font-variant-numeric: tabular-nums;
  font-weight: 600;
  letter-spacing: 0.02em;
}

/* Scheduled Time - for upcoming matches */
.scheduled-time {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  background: var(--bg-main);
  border-top: 1px solid var(--border-light);
  font-size: 0.8rem;
  color: var(--text-secondary);
  font-weight: 500;
}

.clock-icon {
  width: 14px;
  height: 14px;
  color: var(--accent-scheduled);
  flex-shrink: 0;
}

/* Live Indicator - pulsing dot for in-progress matches */
.live-indicator {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  background: rgba(239, 68, 68, 0.08);
  border-top: 1px solid var(--border-light);
  font-size: 0.8rem;
  font-weight: 700;
  color: var(--accent-live);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.live-dot {
  width: 8px;
  height: 8px;
  background: var(--accent-live);
  border-radius: 50%;
  animation: live-pulse 1.5s ease-in-out infinite;
  box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.4);
}

@keyframes live-pulse {
  0% {
    opacity: 1;
    transform: scale(1);
    box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.4);
  }
  50% {
    opacity: 0.8;
    transform: scale(0.9);
    box-shadow: 0 0 0 4px rgba(239, 68, 68, 0);
  }
  100% {
    opacity: 1;
    transform: scale(1);
    box-shadow: 0 0 0 0 rgba(239, 68, 68, 0);
  }
}
</style>
