<script setup>
import { computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useMatchStore } from '../stores/matchStore'

const router = useRouter()
const matchStore = useMatchStore()
const showWinnerModal = ref(false)

// Auto-show winner modal when match ends
watch(
  () => matchStore.matchWinner,
  (newWinner) => {
    if (newWinner !== null) {
      showWinnerModal.value = true
    }
  },
)

const time = computed(() => {
  const now = new Date()
  return {
    date: now.toLocaleDateString(),
    clock: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  }
})

// UI Computed Properties
const team1Name = computed(() => {
  if (!matchStore.currentMatch) return 'Player 1'
  const match = matchStore.currentMatch
  return match.type === 'singles'
    ? match.team1[0].name
    : `${match.team1[0].name} / ${match.team1[1].name.split(' ')[0]}`
})

const team2Name = computed(() => {
  if (!matchStore.currentMatch) return 'Player 2'
  const match = matchStore.currentMatch
  return match.type === 'singles'
    ? match.team2[0].name
    : `${match.team2[0].name} / ${match.team2[1].name.split(' ')[0]}`
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

const games = computed(() => {
  const bestOf = matchStore.currentMatch?.bestOf || 5
  return Array.from({ length: bestOf }, (_, i) => i + 1)
})

// Actions
const goBack = () => router.push('/setup')

const quitMatch = () => {
  matchStore.resetMatchState()
  router.push('/')
}

const confirmMatchResult = () => {
  matchStore.resetMatchState()
  router.push('/')
}

const handleStartPlay = () => {
  if (!matchStore.isGameOver) {
    matchStore.startPoint()
  }
}

const handleLet = () => {
  if (matchStore.pointStarted && !matchStore.isGameOver) {
    matchStore.pointStarted = false
  }
}

const addLeft = () => matchStore.handleScore(matchStore.swappedSides ? 2 : 1, 1)
const minusLeft = () => matchStore.handleScore(matchStore.swappedSides ? 2 : 1, -1)

const addRight = () => matchStore.handleScore(matchStore.swappedSides ? 1 : 2, 1)
const minusRight = () => matchStore.handleScore(matchStore.swappedSides ? 1 : 2, -1)

const swapSides = () => matchStore.toggleSwapSides()

const nextGame = () => {
  matchStore.nextGame()
}

// Allows receiver to be designated as server mid-game (umpire correction)
const swapServer = (side) => {
  // side: 'left' or 'right' — the physical side clicked
  // determine which player (1 or 2) is on that side
  const playerOnSide =
    side === 'left' ? (matchStore.swappedSides ? 2 : 1) : matchStore.swappedSides ? 1 : 2
  matchStore.setServer(playerOnSide)
}

// Display logic helpers
const getScoreP1 = (g) => matchStore.scores[`g${g}`]?.p1
const getScoreP2 = (g) => matchStore.scores[`g${g}`]?.p2
</script>

<template>
  <section id="touchpad-view" class="view active ds-dark">
    <div class="touchpad-container ds-dark">
      <!-- Touchpad Header bar -->
      <div class="tp-header">
        <div class="tp-time">
          <span id="tp-date">{{ time.date }}</span>
          <span id="tp-clock" class="accent-text">{{ time.clock }}</span>
        </div>
        <button @click="quitMatch" class="icon-btn power-btn tp-power-btn">
          <i class="fa-solid fa-power-off"></i>
        </button>
      </div>

      <!-- Score Summary -->
      <div class="score-summary-container">
        <table class="score-summary-table">
          <thead>
            <tr>
              <th class="tools-col">
                <button class="text-btn edit-score-btn">
                  <i class="fa-solid fa-pen-to-square"></i> Edit Score
                </button>
              </th>
              <th v-for="g in games" :key="g" class="game-col">G{{ g }}</th>
            </tr>
          </thead>
          <tbody>
            <tr class="summary-row-p1">
              <td class="player-name-cell">
                <span class="player-name">{{ team1Name }}</span>
                <span class="player-country">{{ team1Country }}</span>
              </td>
              <td
                v-for="g in games"
                :key="g"
                class="game-score"
                :class="{ 'active-game': matchStore.game === g }"
              >
                {{ getScoreP1(g) !== null ? getScoreP1(g) : '' }}
              </td>
            </tr>
            <tr class="summary-row-p2">
              <td class="player-name-cell">
                <span class="player-name">{{ team2Name }}</span>
                <span class="player-country">{{ team2Country }}</span>
              </td>
              <td
                v-for="g in games"
                :key="g"
                class="game-score"
                :class="{ 'active-game': matchStore.game === g }"
              >
                {{ getScoreP2(g) !== null ? getScoreP2(g) : '' }}
              </td>
            </tr>
          </tbody>
        </table>

        <!-- Let Button sits as flex sibling, never overlaps table -->
        <div class="let-btn-cell">
          <button
            class="let-btn-large"
            :disabled="!matchStore.pointStarted || matchStore.isGameOver"
            @click="handleLet"
          >
            Let
          </button>
        </div>
      </div>

      <!-- Main Interaction Area -->
      <div class="interaction-grid">
        <!-- Top Row -->
        <div class="grid-row top-row">
          <div class="side-controls left-side">
            <button class="card-btn">Cards</button>
          </div>
          <div class="side-controls right-side">
            <button class="card-btn">Cards</button>
          </div>
        </div>

        <!-- Middle Row: Table (Status Box) -->
        <div class="grid-row middle-row" style="display: flex; justify-content: center; gap: 30px">
          <div
            class="serve-indicator-tp left-tp"
            :class="{
              active: matchStore.isLeftServer,
              'receiver-clickable': matchStore.isStarted && !matchStore.isLeftServer,
            }"
            style="align-self: flex-end; margin-bottom: 20px"
            @click="matchStore.isStarted && !matchStore.isLeftServer ? swapServer('left') : null"
          >
            <div class="s-circle-tp">{{ matchStore.isLeftServer ? 'S' : 'R' }}</div>
            <span class="s-label-tp">{{ matchStore.isLeftServer ? 'Server' : 'Receiver' }}</span>
          </div>

          <!-- Status Box -->
          <div
            class="status-box-tp glass-panel-green"
            id="main-status-box"
            @click="handleStartPlay"
          >
            <span class="status-text-tp" v-if="matchStore.isGameOver">Game Over</span>
            <span class="status-text-tp" v-else-if="!matchStore.pointStarted">Start Of Play</span>

            <!-- Player names when started -->
            <div class="table-player-grid" v-if="matchStore.pointStarted && !matchStore.isGameOver">
              <div class="table-quad bottom-left">
                <div class="table-player-info">
                  <span class="tp-p-label">{{
                    matchStore.swappedSides ? 'Player 2' : 'Player 1'
                  }}</span>
                  <span class="tp-p-name">{{ leftPlayerName }}</span>
                  <span class="tp-p-country">{{ leftCountry }}</span>
                </div>
              </div>
              <div class="table-quad top-right">
                <div class="table-player-info">
                  <span class="tp-p-label">{{
                    matchStore.swappedSides ? 'Player 1' : 'Player 2'
                  }}</span>
                  <span class="tp-p-name">{{ rightPlayerName }}</span>
                  <span class="tp-p-country">{{ rightCountry }}</span>
                </div>
              </div>
              <div class="table-net-line"></div>
              <div class="table-horizontal-line"></div>
            </div>
          </div>

          <div
            class="serve-indicator-tp right-tp"
            :class="{
              active: !matchStore.isLeftServer,
              'receiver-clickable': matchStore.isStarted && matchStore.isLeftServer,
            }"
            style="align-self: flex-start; margin-top: 20px"
            @click="matchStore.isStarted && matchStore.isLeftServer ? swapServer('right') : null"
          >
            <div class="s-circle-tp">{{ !matchStore.isLeftServer ? 'S' : 'R' }}</div>
            <span class="s-label-tp">{{ !matchStore.isLeftServer ? 'Server' : 'Receiver' }}</span>
          </div>
        </div>

        <!-- Bottom Row -->
        <div class="grid-row bottom-row">
          <div class="side-plus-minus left-pm">
            <button
              class="score-btn-large plus-btn"
              @click="addLeft"
              :disabled="!matchStore.pointStarted || matchStore.isGameOver"
            >
              +
            </button>
            <button class="score-btn-small minus-btn" @click="minusLeft">-</button>
          </div>

          <div class="center-score-display">
            <div class="game-pts-row">
              <span>{{ matchStore.leftGames }}</span>
              <div class="pts-divider"></div>
              <span>{{ matchStore.rightGames }}</span>
            </div>
            <div class="current-pts-row">
              <span>{{ matchStore.leftPoints }}</span>
              <div class="pts-divider"></div>
              <span>{{ matchStore.rightPoints }}</span>
            </div>
          </div>

          <div class="side-plus-minus right-pm">
            <button class="score-btn-small minus-btn" @click="minusRight">-</button>
            <button
              class="score-btn-large plus-btn"
              @click="addRight"
              :disabled="!matchStore.pointStarted || matchStore.isGameOver"
            >
              +
            </button>
          </div>
        </div>
      </div>

      <!-- Bottom Actions -->
      <div v-if="matchStore.matchWinner === null" class="bottom-action-bar">
        <button class="action-btn swap-sides-btn" @click="swapSides">
          <i class="fa-solid fa-arrow-right-arrow-left"></i> Swap Sides
        </button>
        <button class="action-btn expedite-btn">
          <i class="fa-solid fa-stopwatch"></i> Expedite
        </button>
        <div class="divider"></div>
        <button
          class="action-btn next-game-btn"
          :class="{ disabled: !matchStore.isGameOver }"
          @click="nextGame"
        >
          Next Game <i class="fa-solid fa-forward-step"></i>
        </button>
        <button @click="quitMatch" class="action-btn end-match-btn">End Match</button>
      </div>
      <div v-else class="bottom-action-bar match-over-bar">
        <div style="flex: 1"></div>
        <div class="divider"></div>
        <div style="flex: 1; display: flex; justify-content: center">
          <button @click="showWinnerModal = true" class="action-btn confirm-winner-btn">
            Confirm Winner
          </button>
        </div>
      </div>
    </div>

    <!-- Winner Modal -->
    <div v-if="showWinnerModal" class="modal-overlay winner-overlay-bg">
      <div class="winner-modal-view">
        <!-- Back icon in topper -->
        <button @click="showWinnerModal = false" class="winner-back-btn">
          <i class="fa-solid fa-arrow-left"></i>
        </button>

        <div class="winner-modal-content">
          <div class="winner-badges">
            <div class="match-bestof-badge">Best of {{ matchStore.currentMatch?.bestOf }}</div>
          </div>
          <h2 class="winner-title">Winner Is</h2>
          <div class="winner-profile">
            <div class="wp-flag-container">
              <div class="wp-flag">
                {{ matchStore.matchWinner === 1 ? team1Country : team2Country }}
              </div>
              <div class="wp-label">Player {{ matchStore.matchWinner }}</div>
            </div>
            <div class="wp-info">
              <div class="wp-name">{{ matchStore.matchWinner === 1 ? team1Name : team2Name }}</div>
              <div class="wp-id">108246</div>
              <div class="wp-country">
                {{ matchStore.matchWinner === 1 ? team1Country : team2Country }}
              </div>
            </div>
          </div>

          <div class="winner-score-summary">
            <table class="winner-score-table">
              <thead>
                <tr>
                  <th class="w-tools-col"><span>SSQ</span></th>
                  <th v-for="g in games" :key="g">G{{ g }}</th>
                  <th class="w-final-result-col">Final<br />Result</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td class="w-player-name-cell">
                    <span class="player-name">{{ team1Name }}</span>
                  </td>
                  <td v-for="g in games" :key="g" class="w-game-score">
                    {{ getScoreP1(g) !== null ? getScoreP1(g) : '-' }}
                  </td>
                  <td class="w-final-score">{{ matchStore.gamesWon.p1 }}</td>
                </tr>
                <tr>
                  <td class="w-player-name-cell">
                    <span class="player-name">{{ team2Name }}</span>
                  </td>
                  <td v-for="g in games" :key="g" class="w-game-score">
                    {{ getScoreP2(g) !== null ? getScoreP2(g) : '-' }}
                  </td>
                  <td class="w-final-score">{{ matchStore.gamesWon.p2 }}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="modal-footer winner-modal-footer">
            <button @click="confirmMatchResult" class="modal-btn winner-confirm-btn">
              Confirm
            </button>
            <button @click="showWinnerModal = false" class="modal-btn winner-cancel-btn">
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.view {
  position: relative;
  opacity: 1;
  pointer-events: all;
  transform: scale(1);
}
button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.bottom-left {
  grid-column: 1;
  grid-row: 2;
}
.top-right {
  grid-column: 2;
  grid-row: 1;
}

.let-btn-cell {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 0.75rem;
  flex-shrink: 0;
}

.let-btn-large {
  width: clamp(60px, 9vh, 90px);
  height: clamp(60px, 9vh, 90px);
  border-radius: 50%;
  background: #8b5cf6; /* Purple for enabled state */
  color: white;
  font-size: clamp(1.2rem, 2vh, 1.8rem);
  font-weight: 700;
  box-shadow: 0 4px 15px rgba(139, 92, 246, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  border: none;
  cursor: pointer;
}

.let-btn-large:not(:disabled):hover {
  background: #7c3aed;
  transform: scale(1.05);
}

.let-btn-large:disabled {
  background: #444; /* Grey out when disabled */
  color: #888;
  cursor: not-allowed;
  box-shadow: none;
}

.confirm-winner-btn {
  background: #f58220 !important;
  color: white !important;
  min-width: 250px;
}

.winner-overlay-bg {
  background: rgba(30, 30, 30, 0.95);
  display: flex;
  flex-direction: column;
}

.winner-modal-view {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
  padding: 1rem;
}

.winner-back-btn {
  position: absolute;
  top: 1rem;
  left: 1rem;
  width: 44px;
  height: 44px;
  background: #333;
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.3);
}

.winner-modal-content {
  background: #2b2b2b;
  width: 95%;
  max-width: 850px;
  border-radius: 4px;
  overflow: visible;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.7);
  display: flex;
  flex-direction: column;
  position: relative;
  margin-top: 40px;
  border: 1px solid #444;
}

.winner-badges {
  position: absolute;
  top: -20px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 20;
}

.winner-title {
  text-align: center;
  color: #f58220;
  font-size: 2.2rem;
  font-family: serif;
  margin-top: 2rem;
  margin-bottom: 1rem;
  font-weight: 700;
  letter-spacing: 1px;
}

.winner-profile {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 20px;
  color: white;
  margin-bottom: 1.5rem;
}

.wp-flag-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
}

.wp-flag {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: #219c06;
  border: 4px solid #f58220;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 800;
  font-size: 1.4rem;
  box-shadow: 0 6px 15px rgba(0, 0, 0, 0.4);
}

.wp-info {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.wp-name {
  font-size: 1.6rem;
  font-weight: 700;
  letter-spacing: 0.5px;
}
.wp-id,
.wp-country {
  font-size: 1.1rem;
  color: #ddd;
  font-weight: 700;
}
.wp-label {
  color: #f58220;
  font-weight: 800;
  font-size: 1.2rem;
  text-transform: uppercase;
}

.winner-score-summary {
  background: #333;
  padding: 1.5rem;
}

.winner-score-table {
  width: 100%;
  border-collapse: collapse;
  text-align: center;
  background: #eee;
  color: #333;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
}

.winner-score-table th {
  background: #219c06;
  color: white;
  padding: 0.6rem 0.5rem;
  border: 1px solid rgba(0, 0, 0, 0.1);
  font-size: 1rem;
  font-weight: 700;
}

.w-final-result-col {
  background: #f58220 !important;
}

.winner-score-table td {
  padding: 0.6rem 0.5rem;
  border: 1px solid rgba(0, 0, 0, 0.1);
  font-weight: 800;
  font-size: 1.1rem;
}

.w-player-name-cell {
  text-align: left;
  padding-left: 2rem !important;
}

.w-final-score {
  background: #f58220;
  color: white;
  font-size: 1.2rem;
}

.winner-modal-footer {
  background: #e5e0d8;
  padding: 1rem;
  display: flex;
  justify-content: center;
  gap: 2rem;
}

.winner-confirm-btn {
  background: #f58220;
  color: white;
  font-size: 1.3rem;
  padding: 0.8rem 4rem;
  border-radius: 8px;
  font-weight: 700;
  box-shadow: 0 4px 15px rgba(245, 130, 32, 0.4);
}
.winner-confirm-btn:hover {
  background: #e07010;
  transform: translateY(-2px);
}

.winner-cancel-btn {
  background: white;
  color: #666;
  font-size: 1.3rem;
  padding: 0.8rem 4rem;
  border: 1px solid #ccc;
  border-radius: 8px;
  font-weight: 700;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}
.winner-cancel-btn:hover {
  background: #f8f8f8;
  transform: translateY(-2px);
}
</style>
```
