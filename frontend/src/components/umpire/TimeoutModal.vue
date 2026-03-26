<script setup>
import { computed } from 'vue'
import { useMatchStore } from '../../stores/matchStore'

const matchStore = useMatchStore()

const secondsLeft = computed(() => matchStore.timeoutTimeLeft)

// SVG pie progress — same math as SetupView warmup (r=25 → circumference ≈ 157.08)
const TOTAL = 60
const DASH_TOTAL = 157.08
const timerProgressValue = computed(() => {
  const elapsed = TOTAL - secondsLeft.value
  return (elapsed / TOTAL) * DASH_TOTAL
})

const callingTeamName = computed(() => {
  const num = matchStore.timeoutCallingTeam
  if (!num || !matchStore.currentMatch) return 'Team'
  const team = num === 1 ? matchStore.currentMatch.team1 : matchStore.currentMatch.team2
  if (matchStore.currentMatch.type === 'singles') return team[0].name
  return `${team[0].name} / ${team[1].name}`
})

const isExpired = computed(() => secondsLeft.value === 0)

// Closing the widget = dismiss (timeout is consumed)
const close = () => {
  matchStore.dismissTimeout()
}
</script>

<template>
  <div class="to-overlay">
    <div class="to-widget">
      <button class="to-close-x" @click="close" title="Dismiss">✕</button>

      <div class="to-team-label">{{ callingTeamName }}</div>
      <div class="to-subtitle">Time Out</div>

      <!-- Circular countdown — mirrors SetupView warmup SVG -->
      <div class="to-circle-wrap">
        <svg viewBox="0 0 100 100" class="to-svg">
          <!-- White fill base -->
          <circle cx="50" cy="50" r="48" fill="#f8fafc" />
          <!-- Orange pie slice (elapsed portion) -->
          <circle
            cx="50"
            cy="50"
            r="25"
            fill="none"
            stroke="#f58220"
            stroke-width="50"
            :stroke-dasharray="`${timerProgressValue} 158`"
            style="transition: stroke-dasharray 1s linear"
          />
          <!-- Fine tick marks -->
          <circle
            cx="50"
            cy="50"
            r="39"
            fill="none"
            stroke="var(--primary-color)"
            stroke-width="2"
            stroke-dasharray="0.5 3.585"
          />
          <!-- Bold tick marks -->
          <circle
            cx="50"
            cy="50"
            r="39"
            fill="none"
            stroke="var(--primary-color)"
            stroke-width="4"
            stroke-dasharray="1.5 18.913"
          />
          <!-- Outer ring -->
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke="var(--primary-color)"
            stroke-width="10"
          />
          <!-- Inner circle -->
          <circle cx="50" cy="50" r="20" fill="var(--primary-color)" />
        </svg>

        <!-- Centred text overlay -->
        <div class="to-circle-text">
          <span class="to-seconds" :class="{ 'to-expired': isExpired }">{{ secondsLeft }}</span>
          <span class="to-unit">Sec</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* === Blocking Overlay === */
.to-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.75); /* Darker blocking layer, matching modal style */
  z-index: 1500;
  display: flex;
  justify-content: flex-end;
  align-items: flex-start;
  padding: 12px;
  pointer-events: all; /* Blocks clicks to anything below */
}

/* === Floating corner widget === */
.to-widget {
  position: relative; /* Relative to the overlay corner */
  background: white;
  border-radius: 16px;
  padding: 0.85rem 1.1rem 1rem;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.35);
  border: 2px solid var(--primary-color, #219c06);

  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.4rem;
  width: 200px;
}

/* × dismiss button */
.to-close-x {
  position: absolute;
  top: 8px;
  right: 10px;
  background: transparent;
  border: none;
  font-size: 1rem;
  color: #aaa;
  cursor: pointer;
  line-height: 1;
  padding: 2px 4px;
}
.to-close-x:hover {
  color: #333;
}

.to-team-label {
  font-size: 0.9rem;
  font-weight: 700;
  color: #222;
  text-align: center;
  padding-right: 18px; /* avoid × overlap */
}

.to-subtitle {
  font-size: 0.72rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 1.5px;
  color: #f58220;
}

/* === Circle === */
.to-circle-wrap {
  position: relative;
  width: 150px;
  height: 150px;
  margin: 0.15rem auto 0.25rem;
}

.to-svg {
  width: 100%;
  height: 100%;
  transform: rotate(-90deg);
}

.to-circle-text {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  color: white;
  pointer-events: none;
}

.to-seconds {
  font-size: 2rem;
  font-weight: 700;
  line-height: 1;
  transition: color 0.3s;
}

.to-expired {
  color: #f58220;
}

.to-unit {
  font-size: 0.9rem;
  font-weight: 700;
}
</style>
