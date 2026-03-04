<template>
  <div class="match-detail-page">
    <div class="detail-header">
      <router-link to="/admin" class="back-link">← Back to Dashboard</router-link>
      <div class="header-row">
        <h1 class="page-title">Match Detail</h1>
        <span class="match-id-badge">ID: {{ matchId }}</span>
      </div>
      <p class="page-subtitle">Viewing match data for record <strong>{{ matchId }}</strong></p>
    </div>

    <!-- Placeholder Detail Sections -->
    <div class="detail-grid">
      <section class="detail-card">
        <div class="card-header">
          <span class="card-icon">ℹ️</span>
          <h2 class="card-title">Match Info</h2>
        </div>
        <div class="card-body placeholder-body">
          <p class="placeholder-text">Match metadata (event name, type, scheduled time, status) will be displayed here once a <code>GET /api/match/:id</code> endpoint is implemented in Phase 4.</p>
        </div>
      </section>

      <section class="detail-card">
        <div class="card-header">
          <span class="card-icon">🏓</span>
          <h2 class="card-title">Games</h2>
        </div>
        <div class="card-body placeholder-body">
          <p class="placeholder-text">Per-game score breakdown (team1 score vs team2 score per game) will be listed here in Phase 4.</p>
        </div>
      </section>

      <section class="detail-card">
        <div class="card-header">
          <span class="card-icon">🟨</span>
          <h2 class="card-title">Cards</h2>
        </div>
        <div class="card-body placeholder-body">
          <p class="placeholder-text">Cards issued during the match (Yellow, Yellow-Red, Red) and associated penalty points will appear here in Phase 4.</p>
        </div>
      </section>
    </div>

    <div class="detail-footer">
      <router-link id="back-to-dashboard-link" to="/admin" class="back-btn">← Back to Dashboard</router-link>
    </div>
  </div>
</template>

<script setup>
import { useRoute } from 'vue-router'
import { computed } from 'vue'

const route = useRoute()
const matchId = computed(() => route.params.id)
</script>

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
