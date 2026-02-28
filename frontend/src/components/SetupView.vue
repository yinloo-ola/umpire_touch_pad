<script setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useMatchStore } from '../stores/matchStore'

const router = useRouter()
const matchStore = useMatchStore()
const showWarmupModal = ref(false)

const time = computed(() => {
  const now = new Date()
  return {
    date: now.toLocaleDateString(),
    clock: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  }
})

// UI Computed Properties based on side swap
const team1Name = computed(() => {
  if (!matchStore.currentMatch) return 'Player 1'
  const match = matchStore.currentMatch
  if (match.type === 'singles') return match.team1[0].name
  return `${match.team1[0].name} / ${match.team1[1].name.split(' ')[0]}`
})

const team2Name = computed(() => {
  if (!matchStore.currentMatch) return 'Player 2'
  const match = matchStore.currentMatch
  if (match.type === 'singles') return match.team2[0].name
  return `${match.team2[0].name} / ${match.team2[1].name.split(' ')[0]}`
})

const team1Country = computed(() => matchStore.currentMatch?.team1[0].country || 'KOR')
const team2Country = computed(() => matchStore.currentMatch?.team2[0].country || 'BLR')

const leftPlayerName = computed(() => (matchStore.swappedSides ? team2Name.value : team1Name.value))
const rightPlayerName = computed(() =>
  matchStore.swappedSides ? team1Name.value : team2Name.value,
)

const leftCountry = computed(() =>
  matchStore.swappedSides ? team2Country.value : team1Country.value,
)
const rightCountry = computed(() =>
  matchStore.swappedSides ? team1Country.value : team2Country.value,
)

// ── Doubles: quadrant player computeds ────────────────────────────────────────
const isDoubles = computed(() => matchStore.currentMatch?.type === 'doubles')

const leftTopPlayer  = computed(() => matchStore.doublesLeftTopPlayer)
const leftBotPlayer  = computed(() => matchStore.doublesLeftBotPlayer)
const rightTopPlayer = computed(() => matchStore.doublesRightTopPlayer)
const rightBotPlayer = computed(() => matchStore.doublesRightBotPlayer)

const swapLeft  = () => matchStore.swapLeftPlayers()
const swapRight = () => matchStore.swapRightPlayers()

// ── Doubles serve designation ────────────────────────────────────────────────
const leftTeam  = computed(() => matchStore.swappedSides ? 2 : 1)
const rightTeam = computed(() => matchStore.swappedSides ? 1 : 2)

// Unified click handlers (works for both singles and doubles)
const onLeftIndicatorClick  = () => matchStore.calibrateServeStateFromUI('left')
const onRightIndicatorClick = () => matchStore.calibrateServeStateFromUI('right')

// Doubles: display individual player name beneath the S/R circle
const leftIndicatorPlayerName = computed(() => {
  if (!isDoubles.value) return ''
  return matchStore.isLeftDoublesServer
    ? matchStore.doublesServerName
    : matchStore.doublesReceiverName
})
const rightIndicatorPlayerName = computed(() => {
  if (!isDoubles.value) return ''
  return matchStore.isLeftDoublesServer
    ? matchStore.doublesReceiverName
    : matchStore.doublesServerName
})

// ── Shared actions ───────────────────────────────────────────────────────────
const goBack = () => router.push('/')
const toggleSwap = () => matchStore.toggleSwapSides()

const promptWarmup = () => {
  showWarmupModal.value = true
}

const cancelWarmup = () => {
  showWarmupModal.value = false
}

const startWarmupCountdown = () => {
  showWarmupModal.value = false
  matchStore.startTimer()
}

const proceedToMatch = () => {
  matchStore.timerActive = false
  router.push('/scoring')
}

// Circle SVG math
const timerProgressValue = computed(() => {
  const totalDash = 157.08
  const elapsed = 120 - matchStore.timeLeft
  return (elapsed / 120) * totalDash
})
</script>

<template>
  <section class="view active ds-dark" v-if="matchStore.currentMatch">
    <div class="setup-container">
      <div class="tp-header">
        <div class="tp-time">
          <span class="setup-date">{{ time.date }}</span>
          <span class="setup-clock accent-text">{{ time.clock }}</span>
        </div>
        <button @click="goBack" class="icon-btn power-btn setup-power-btn">
          <i class="fa-solid fa-power-off"></i>
        </button>
      </div>

      <div class="setup-toolbar">
        <button @click="goBack" class="back-to-list-btn icon-btn">
          <i class="fa-solid fa-arrow-left"></i>
        </button>
        <div class="match-bestof-badge" id="setup-bestof">
          Best of {{ matchStore.currentMatch.bestOf }}
        </div>
        <button class="setup-menu-btn icon-btn">
          <i class="fa-solid fa-table-tennis-paddle-ball"></i>
        </button>
      </div>

      <div class="court-area">
        <!-- DOUBLES layout -->
        <template v-if="isDoubles">
          <div class="doubles-court-wrapper">
            <button @click="swapLeft" class="swap-players-btn swap-left-btn">
              <i class="fa-solid fa-arrow-down"></i> Swap Players <i class="fa-solid fa-arrow-up"></i>
            </button>

            <div class="doubles-court-grid">
              <!-- Top-Left -->
              <div class="court-quadrant doubles-tl">
                <div class="player-slot">
                  <div class="player-info">
                    <span class="p-label">{{ matchStore.swappedSides ? 'P2' : 'P1' }}</span>
                    <span class="p-name">{{ leftTopPlayer?.name ?? '—' }}</span>
                    <span class="p-country">{{ leftTopPlayer?.country ?? '' }}</span>
                  </div>
                </div>
              </div>
              <!-- Top-Right -->
              <div class="court-quadrant doubles-tr">
                <div class="player-slot">
                  <div class="player-info">
                    <span class="p-label">{{ matchStore.swappedSides ? 'P1' : 'P2' }}</span>
                    <span class="p-name">{{ rightTopPlayer?.name ?? '—' }}</span>
                    <span class="p-country">{{ rightTopPlayer?.country ?? '' }}</span>
                  </div>
                </div>
              </div>
              <!-- Net line -->
              <div class="net-line"></div>
              <div class="horizontal-line"></div>
              <!-- Bottom-Left -->
              <div class="court-quadrant doubles-bl">
                <div class="player-slot">
                  <div class="player-info">
                    <span class="p-label">{{ matchStore.swappedSides ? 'P2D' : 'P1D' }}</span>
                    <span class="p-name">{{ leftBotPlayer?.name ?? '—' }}</span>
                    <span class="p-country">{{ leftBotPlayer?.country ?? '' }}</span>
                  </div>
                </div>
              </div>
              <!-- Bottom-Right -->
              <div class="court-quadrant doubles-br">
                <div class="player-slot">
                  <div class="player-info">
                    <span class="p-label">{{ matchStore.swappedSides ? 'P1D' : 'P2D' }}</span>
                    <span class="p-name">{{ rightBotPlayer?.name ?? '—' }}</span>
                    <span class="p-country">{{ rightBotPlayer?.country ?? '' }}</span>
                  </div>
                </div>
              </div>
            </div>

            <button @click="swapRight" class="swap-players-btn swap-right-btn">
              <i class="fa-solid fa-arrow-down"></i> Swap Players <i class="fa-solid fa-arrow-up"></i>
            </button>
          </div>

          <!-- Serve indicators live as a sibling overlay (identical to singles) -->
          <div class="setup-serve-indicators">
            <div
              class="setup-serve-box left-serve"
              :class="{ active: matchStore.isLeftDoublesServer }"
              @click="onLeftIndicatorClick"
              id="doubles-left-serve-indicator"
            >
              <div class="s-circle">{{ matchStore.isLeftDoublesServer ? 'S' : 'R' }}</div>
              <span class="s-tag">{{ matchStore.isLeftDoublesServer ? 'Server' : 'Receiver' }}</span>
            </div>
            <div
              class="setup-serve-box right-serve"
              :class="{ active: !matchStore.isLeftDoublesServer }"
              @click="onRightIndicatorClick"
              id="doubles-right-serve-indicator"
            >
              <div class="s-circle">{{ !matchStore.isLeftDoublesServer ? 'S' : 'R' }}</div>
              <span class="s-tag">{{ !matchStore.isLeftDoublesServer ? 'Server' : 'Receiver' }}</span>
            </div>
          </div>
        </template>

        <!-- SINGLES layout (unchanged) -->
        <template v-else>
          <div class="court-grid">
            <!-- Left side slot (Bottom-Left) -->
            <div class="court-quadrant bottom-left">
              <div class="player-slot">
                <div class="player-info">
                  <span class="p-label">{{ matchStore.swappedSides ? 'Player 2' : 'Player 1' }}</span>
                  <span class="p-name">{{ leftPlayerName }}</span>
                  <span class="p-country">{{ leftCountry }}</span>
                </div>
              </div>
            </div>
            <!-- Right side slot (Top-Right typically in standard view) -->
            <div class="court-quadrant top-right">
              <div class="player-slot">
                <div class="player-info">
                  <span class="p-label">{{ matchStore.swappedSides ? 'Player 1' : 'Player 2' }}</span>
                  <span class="p-name">{{ rightPlayerName }}</span>
                  <span class="p-country">{{ rightCountry }}</span>
                </div>
              </div>
            </div>
            <div class="net-line"></div>
            <div class="horizontal-line"></div>
          </div>

          <div class="setup-serve-indicators">
            <div
              class="setup-serve-box left-serve"
              :class="{ active: matchStore.isLeftServer }"
              @click="onLeftIndicatorClick"
            >
              <div class="s-circle">{{ matchStore.isLeftServer ? 'S' : 'R' }}</div>
              <span class="s-tag">{{ matchStore.isLeftServer ? 'Server' : 'Receiver' }}</span>
            </div>
            <div
              class="setup-serve-box right-serve"
              :class="{ active: !matchStore.isLeftServer }"
              @click="onRightIndicatorClick"
            >
              <div class="s-circle">{{ !matchStore.isLeftServer ? 'S' : 'R' }}</div>
              <span class="s-tag">{{ !matchStore.isLeftServer ? 'Server' : 'Receiver' }}</span>
            </div>
          </div>
        </template>
      </div>

      <div class="setup-actions">
        <button @click="toggleSwap" class="setup-btn swap-btn">Swap Sides</button>
        <button @click="promptWarmup" class="setup-btn warmup-btn">Start Warm Up</button>
        <button class="setup-btn end-btn">End Match</button>
      </div>
    </div>

    <!-- Warmup Modal -->
    <div v-if="showWarmupModal" class="modal-overlay">
      <div class="modal-content small-modal">
        <div class="modal-header">
          <h3>Player positions</h3>
        </div>
        <div class="modal-body">
          <p class="warning-text">
            Note: Can't set players positions after warmup. please set players positions before
            warmup.
          </p>
          <p class="modal-prompt-bold">Is Players Positions Set?</p>
        </div>
        <div class="modal-footer">
          <button @click="startWarmupCountdown" class="modal-btn primary-btn">Confirm</button>
          <button @click="cancelWarmup" class="modal-btn cancel-btn">Cancel</button>
        </div>
      </div>
    </div>



    <!-- Warmup Timer Overlay -->
    <div v-if="matchStore.timerActive" class="timer-overlay">
      <div class="timer-content">
        <h2>Warm up</h2>
        <div
          class="circular-timer"
          style="position: relative; width: 300px; height: 300px; margin: 0 auto 3rem"
        >
          <svg
            class="timer-svg"
            viewBox="0 0 100 100"
            style="transform: rotate(-90deg); width: 100%; height: 100%"
          >
            <circle cx="50" cy="50" r="48" fill="#f8fafc" />
            <!-- Orange Pie Slice -->
            <circle
              cx="50"
              cy="50"
              r="25"
              fill="none"
              stroke="var(--accent-orange)"
              stroke-width="50"
              :stroke-dasharray="`${timerProgressValue} 158`"
              style="transition: stroke-dasharray 1s linear"
            />
            <!-- Tick marks (inner edge of border) -->
            <circle
              cx="50"
              cy="50"
              r="39"
              fill="none"
              stroke="var(--primary-color)"
              stroke-width="2"
              stroke-dasharray="0.5 3.585"
            />
            <circle
              cx="50"
              cy="50"
              r="39"
              fill="none"
              stroke="var(--primary-color)"
              stroke-width="4"
              stroke-dasharray="1.5 18.913"
            />
            <!-- Outer Ring -->
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke="var(--primary-color)"
              stroke-width="10"
            />
            <!-- Inner Circle -->
            <circle cx="50" cy="50" r="20" fill="var(--primary-color)" />
          </svg>
          <div
            class="timer-text"
            style="
              position: absolute;
              top: 50%;
              left: 50%;
              transform: translate(-50%, -50%);
              display: flex;
              flex-direction: column;
              align-items: center;
              color: white;
            "
          >
            <span style="font-size: 2.5rem; font-weight: 700; line-height: 1">{{
              120 - matchStore.timeLeft
            }}</span>
            <span style="font-size: 1.2rem; font-weight: 700">Sec</span>
          </div>
        </div>
        <button @click="proceedToMatch" class="start-match-btn">Start Match</button>
      </div>
    </div>
  </section>
  <section v-else class="view active">
    <!-- Fast fallback if loaded without match -->
    <button @click="goBack" class="back-to-list-btn icon-btn">
      <i class="fa-solid fa-arrow-left"></i> No Match Selected - Go Back
    </button>
  </section>
</template>

<style scoped>
.view {
  position: relative;
  opacity: 1;
  pointer-events: all;
  transform: scale(1);
}
.modal-overlay {
  opacity: 1;
  pointer-events: all;
}
.timer-overlay {
  opacity: 1;
  pointer-events: all;
}
.bottom-left {
  grid-column: 1;
  grid-row: 2;
}
.top-right {
  grid-column: 2;
  grid-row: 1;
}

.doubles-court-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  width: 100%;
}


.doubles-court-grid {
  /* Match singles .court-grid exactly */
  flex: none;
  width: 650px;
  height: 400px;
  background: #006b3c;
  border: 5px solid white;
  display: grid;
  grid-template-columns: 1fr 1fr;
  grid-template-rows: 1fr 1fr;
  position: relative;
}
.doubles-tl { grid-column: 1; grid-row: 1; }
.doubles-tr { grid-column: 2; grid-row: 1; }
.doubles-bl { grid-column: 1; grid-row: 2; }
.doubles-br { grid-column: 2; grid-row: 2; }
.swap-players-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 0.6rem 1rem;
  font-size: 1.1rem;
  font-weight: 700;
  background: #6ab04c;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  white-space: nowrap;
}
.swap-players-btn i {
  font-size: 1rem;
}
.swap-players-btn:active {
  opacity: 0.8;
}
.server-choice-btns {
  display: flex;
  gap: 0.75rem;
  justify-content: center;
  margin-top: 0.5rem;
}
.server-choice-btn {
  flex: 1;
}
</style>
