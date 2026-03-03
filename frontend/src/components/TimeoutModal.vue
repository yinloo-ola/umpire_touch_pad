<script setup>
import { computed } from 'vue'
import { useMatchStore } from '../stores/matchStore'

const matchStore = useMatchStore()

// Format seconds as "M:SS"
const countdownDisplay = computed(() => {
  const t = matchStore.timeoutTimeLeft
  const mins = Math.floor(t / 60)
  const secs = String(t % 60).padStart(2, '0')
  return `${mins}:${secs}`
})

// Team that called the timeout
const callingTeamName = computed(() => {
  const num = matchStore.timeoutCallingTeam
  if (!num || !matchStore.currentMatch) return 'Team'
  const team = num === 1 ? matchStore.currentMatch.team1 : matchStore.currentMatch.team2
  if (matchStore.currentMatch.type === 'singles') return team[0].name
  return `${team[0].name} / ${team[1].name}`
})

const cancelTimeout = () => {
  matchStore.revertTimeout(matchStore.timeoutCallingTeam)
}

const dismiss = () => {
  matchStore.dismissTimeout()
}
</script>

<template>
  <div class="modal-overlay timeout-overlay-bg">
    <div class="timeout-modal-content">
      <div class="tm-team-label">{{ callingTeamName }}</div>
      <div class="tm-subtitle">Time Out</div>
      <div
        class="tm-countdown"
        :class="{ 'tm-expired': matchStore.timeoutTimeLeft === 0 }"
      >
        {{ countdownDisplay }}
      </div>
      <div class="tm-buttons">
        <button class="modal-btn tm-cancel-btn" @click="cancelTimeout">
          Cancel / Revert
        </button>
        <button class="modal-btn tm-dismiss-btn" @click="dismiss">
          Dismiss
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.timeout-overlay-bg {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.88);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 1500;
}

.timeout-modal-content {
  background: #2b2b2b;
  border-radius: 12px;
  padding: 3rem;
  text-align: center;
  border: 1px solid #444;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.7);
  min-width: 320px;
}

.tm-team-label {
  color: white;
  font-size: 1.4rem;
  font-weight: 600;
  margin-bottom: 0.3rem;
}

.tm-subtitle {
  color: #f58220;
  font-size: 1rem;
  text-transform: uppercase;
  letter-spacing: 2px;
  margin-bottom: 2rem;
}

.tm-countdown {
  font-size: 4rem;
  font-weight: 800;
  color: white;
  font-variant-numeric: tabular-nums;
  margin-bottom: 2.5rem;
  transition: color 0.3s;
}

.tm-expired {
  color: #f58220;
}

.tm-buttons {
  display: flex;
  gap: 1.5rem;
  justify-content: center;
}

.tm-cancel-btn {
  background: transparent;
  border: 2px solid #888;
  color: #ccc;
  padding: 0.8rem 2rem;
  border-radius: 8px;
  font-weight: 600;
  font-size: 1rem;
  cursor: pointer;
  transition: border-color 0.2s, color 0.2s;
}
.tm-cancel-btn:hover {
  border-color: white;
  color: white;
}

.tm-dismiss-btn {
  background: #f58220;
  color: white;
  padding: 0.8rem 2rem;
  border-radius: 8px;
  font-weight: 700;
  font-size: 1rem;
  border: none;
  cursor: pointer;
  box-shadow: 0 4px 15px rgba(245, 130, 32, 0.4);
  transition: background 0.2s, transform 0.15s;
}
.tm-dismiss-btn:hover {
  background: #e07010;
  transform: translateY(-1px);
}
</style>
