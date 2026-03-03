<script setup>
import { computed } from 'vue'
import { useMatchStore } from '../stores/matchStore'

const props = defineProps({ teamNum: { type: Number, required: true } })
const emit = defineEmits(['close'])

const matchStore = useMatchStore()

const playerCards = computed(() => matchStore[`team${props.teamNum}Cards`])
const coachCards  = computed(() => matchStore[`team${props.teamNum}CoachCards`])
const timeoutUsed = computed(() => matchStore[`team${props.teamNum}Timeout`])

const teamLabel = computed(() => {
  const match = matchStore.currentMatch
  if (!match) return `Team ${props.teamNum}`
  const team = props.teamNum === 1 ? match.team1 : match.team2
  if (match.type === 'singles') return team[0].name
  return `${team[0].name} / ${team[1].name}`
})

// Card visual state: 'locked' | 'available' | 'issued'
const cardState = (track, type) => {
  const arr = track === 'coach' ? coachCards.value : playerCards.value
  const playerOrder = ['Yellow', 'YR1', 'YR2']
  const coachOrder  = ['Yellow', 'Red']
  const order = track === 'coach' ? coachOrder : playerOrder
  const idx = order.indexOf(type)

  if (arr.includes(type)) return 'issued'
  if (idx === 0 && arr.length === 0) return 'available'
  if (idx > 0 && arr[idx - 1] === order[idx - 1]) return 'available'
  return 'locked'
}

// Tap handler: issue or LIFO-revert, then dismiss
const issueOrRevert = (track, type) => {
  const arr = track === 'coach' ? coachCards.value : playerCards.value
  if (arr.length > 0 && arr[arr.length - 1] === type) {
    matchStore.revertLastCard(props.teamNum, track)
    emit('close')
  } else if (!arr.includes(type)) {
    matchStore.issueCard(props.teamNum, type, track)
    emit('close')
  }
  // else: issued but not last → ignore out-of-order revert (no close)
}

const handleTimeout = () => {
  if (matchStore.timeoutActive || timeoutUsed.value) {
    // Timeout currently running OR already dismissed but remains in 'used' state
    // In both cases, the user wants to revert the fact that a timeout was taken.
    matchStore.revertTimeout(props.teamNum)
    emit('close')
  } else {
    // Issue a new timeout
    matchStore.issueTimeout(props.teamNum)
    emit('close')  // card modal closes; timeout widget appears
  }
}

// Visual state for the T (timeout) card
const timeoutCardState = computed(() => {
  // If timeout is active (widget showing) OR if it was taken but dismissed (revertable)
  if (matchStore.timeoutActive && matchStore.timeoutCallingTeam === props.teamNum) {
    return 'issued'   // active — orange ring, tappable to revert
  }
  if (timeoutUsed.value) {
    return 'issued'   // dismissed but remains 'taken' — orange ring, tappable to revert
  }
  return 'available'
})

// Whether the T card is interactive
const timeoutInteractive = computed(() =>
  // Can issue: not used, not pointStarted, not timerActive (warm-up timer)
  // Can revert: timeout is taken (used)
  timeoutUsed.value || (!timeoutUsed.value && !matchStore.pointStarted && !matchStore.timerActive)
)
</script>

<template>
  <div class="card-modal-overlay">
    <div class="card-modal-panel">
      <!-- Header -->
      <div class="cm-header">
        <span class="cm-player-label">{{ teamLabel }}</span>
        <button class="cm-close-btn" @click="emit('close')">✕</button>
      </div>

      <!-- Card row -->
      <div class="cm-card-row">

        <!-- Player track -->
        <div class="cm-track player-track">
          <!-- Timeout -->
          <div
            class="cm-card-item cm-timeout"
            :class="[
              timeoutCardState,
              { 'cm-disabled': !timeoutInteractive }
            ]"
            @click="timeoutInteractive && handleTimeout()"
          >
            <div class="cm-card-face cm-card-timeout">T</div>
            <span class="cm-card-label">Time<br>Out</span>
          </div>

          <!-- Yellow -->
          <div
            class="cm-card-item"
            :class="cardState('player', 'Yellow')"
            @click="issueOrRevert('player', 'Yellow')"
          >
            <div class="cm-card-face cm-yellow"></div>
            <span class="cm-card-label">Yellow<br>Card</span>
          </div>

          <!-- YR1 -->
          <div
            class="cm-card-item"
            :class="cardState('player', 'YR1')"
            @click="issueOrRevert('player', 'YR1')"
          >
            <div class="cm-card-face cm-yr1"><span class="cm-yr-num">1</span></div>
            <span class="cm-card-label">Yellow<br>Red 1</span>
          </div>

          <!-- YR2 -->
          <div
            class="cm-card-item"
            :class="cardState('player', 'YR2')"
            @click="issueOrRevert('player', 'YR2')"
          >
            <div class="cm-card-face cm-yr2"><span class="cm-yr-num">2</span></div>
            <span class="cm-card-label">Yellow<br>Red 2</span>
          </div>
        </div>

        <!-- Divider -->
        <div class="cm-divider"></div>

        <!-- Coach track -->
        <div class="cm-track coach-track">
          <div
            class="cm-card-item"
            :class="cardState('coach', 'Yellow')"
            @click="issueOrRevert('coach', 'Yellow')"
          >
            <div class="cm-card-face cm-yellow cm-coach-face">C</div>
            <span class="cm-card-label">Yellow<br>Card</span>
          </div>

          <div
            class="cm-card-item"
            :class="cardState('coach', 'Red')"
            @click="issueOrRevert('coach', 'Red')"
          >
            <div class="cm-card-face cm-red cm-coach-face">C</div>
            <span class="cm-card-label">Red<br>Card</span>
          </div>
        </div>

      </div>
    </div>
  </div>
</template>

<style scoped>
/* === Overlay === */
.card-modal-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.80);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

/* === Panel === */
.card-modal-panel {
  background: #ffffff;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.55);
  max-width: 680px;
  width: 95%;
}

/* === Header === */
.cm-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.25rem;
}

.cm-player-label {
  font-size: 1.3rem;
  font-weight: 700;
  color: #222;
  letter-spacing: 0.3px;
}

.cm-close-btn {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  background: #f58220;
  color: white;
  font-size: 1.1rem;
  font-weight: 800;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
  transition: background 0.2s, transform 0.15s;
  flex-shrink: 0;
}
.cm-close-btn:hover {
  background: #e07010;
  transform: scale(1.1);
}

/* === Card row layout === */
.cm-card-row {
  display: flex;
  align-items: flex-start;
  gap: 0;
}

.cm-track {
  display: flex;
  gap: 0.75rem;
  align-items: flex-start;
}

.cm-divider {
  width: 2px;
  background: #ddd;
  align-self: stretch;
  margin: 0 1rem;
  border-radius: 2px;
  flex-shrink: 0;
}

/* === Individual card item === */
.cm-card-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  transition: transform 0.15s;
}

.cm-card-label {
  font-size: 0.72rem;
  font-weight: 600;
  color: #555;
  text-align: center;
  line-height: 1.3;
}

/* === Card face base === */
.cm-card-face {
  width: 70px;
  height: 90px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 800;
  font-size: 1.8rem;
  transition: box-shadow 0.15s, transform 0.15s;
  position: relative;
  overflow: hidden;
}

/* === Card colors === */
.cm-yellow { background: #f5c400; color: #222; }
.cm-red    { background: #d32f2f; color: white; }

/* YR1 — top half yellow, bottom half red, "1" in red portion */
.cm-yr1 {
  background: linear-gradient(to bottom, #f5c400 50%, #d32f2f 50%);
  color: transparent;
}
.cm-yr2 {
  background: linear-gradient(to bottom, #f5c400 50%, #d32f2f 50%);
  color: transparent;
}
.cm-yr-num {
  position: absolute;
  bottom: 10px;
  color: white;
  font-size: 1.5rem;
  font-weight: 900;
  text-shadow: 0 1px 3px rgba(0,0,0,0.4);
}

.cm-card-timeout { background: #bbb; color: #333; font-size: 1.6rem; }

/* Coach face badge */
.cm-coach-face {
  font-size: 1.5rem;
}

/* === Visual states === */

/* locked */
.cm-card-item.locked {
  opacity: 0.35;
  cursor: not-allowed;
  pointer-events: none;
}

/* available */
.cm-card-item.available { cursor: pointer; }
.cm-card-item.available:hover .cm-card-face {
  transform: translateY(-3px);
  box-shadow: 0 6px 15px rgba(0, 0, 0, 0.30);
}

/* issued */
.cm-card-item.issued .cm-card-face {
  outline: 3px solid #f58220;
  outline-offset: 2px;
}
.cm-card-item.issued { cursor: pointer; }

/* timeout disabled */
.cm-timeout.cm-disabled {
  opacity: 0.35;
  cursor: not-allowed;
  pointer-events: none;
}

/* permanently consumed (timeout used and done) */
.cm-card-item.used {
  opacity: 0.35;
  cursor: not-allowed;
  pointer-events: none;
}
</style>
