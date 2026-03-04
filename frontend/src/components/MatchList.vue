<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useMatchStore } from '../stores/matchStore'
import { useAdminStore } from '../stores/adminStore'

const router = useRouter()
const matchStore = useMatchStore()
const adminStore = useAdminStore()

onMounted(async () => {
  try {
    await adminStore.fetchMatches()
  } catch (err) {
    console.error('Failed to fetch matches:', err)
  }
})

const matches = computed(() => adminStore.matches)

const selectedMatch = ref(null)
const showModal = ref(false)

const openMatchConfirm = (match) => {
  selectedMatch.value = match
  showModal.value = true
}

const closeMatchConfirm = () => {
  showModal.value = false
  selectedMatch.value = null
}

const startMatch = () => {
  if (selectedMatch.value) {
    matchStore.selectMatch(selectedMatch.value)
    router.push('/setup')
  }
}
</script>

<template>
  <section id="match-list-view" class="view active">
    <h2 class="greeting">Welcome Umpire, today's matches are</h2>
    <div class="table-container glass-panel">
      <table class="match-table">
        <thead>
          <tr>
            <th>Event</th>
            <th>Time</th>
            <th>Player 1</th>
            <th>Player 2</th>
            <th>Best Of</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(match, index) in matches" :key="index" @click="openMatchConfirm(match)">
            <td>{{ match.event }}</td>
            <td>{{ match.time }}</td>
            <td>
              <template v-if="match.type === 'singles'">
                <span class="player-name-main">{{ match.team1[0].name }}</span>
                <span class="country-code">{{ match.team1[0].country }}</span>
              </template>
              <template v-else>
                <div class="doubles-cell">
                  <div>
                    <span class="player-name-main">{{ match.team1[0].name }}</span>
                    <span class="country-code">{{ match.team1[0].country }}</span>
                  </div>
                  <div>
                    <span class="player-name-main">{{ match.team1[1].name }}</span>
                    <span class="country-code">{{ match.team1[1].country }}</span>
                  </div>
                </div>
              </template>
            </td>
            <td>
              <template v-if="match.type === 'singles'">
                <span class="player-name-main">{{ match.team2[0].name }}</span>
                <span class="country-code">{{ match.team2[0].country }}</span>
              </template>
              <template v-else>
                <div class="doubles-cell">
                  <div>
                    <span class="player-name-main">{{ match.team2[0].name }}</span>
                    <span class="country-code">{{ match.team2[0].country }}</span>
                  </div>
                  <div>
                    <span class="player-name-main">{{ match.team2[1].name }}</span>
                    <span class="country-code">{{ match.team2[1].country }}</span>
                  </div>
                </div>
              </template>
            </td>
            <td>
              <strong>{{ match.bestOf }}</strong>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <div class="footer-actions">
      <button class="text-btn back-btn"><i class="fa-solid fa-chevron-left"></i> Back</button>
    </div>

    <!-- Match Confirmation Modal -->
    <div v-if="showModal" id="match-confirm-modal" class="modal-overlay">
      <div class="modal-content glass-panel">
        <div class="modal-header">
          <h3>You have chosen match</h3>
        </div>
        <div class="modal-body">
          <div class="confirm-match-info">
            <table class="match-table mini-table">
              <thead>
                <tr>
                  <th>Event</th>
                  <th>Time</th>
                  <th>Player 1</th>
                  <th>Player 2</th>
                  <th>Best Of</th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="selectedMatch">
                  <td>{{ selectedMatch.event }}</td>
                  <td>{{ selectedMatch.time }}</td>
                  <td>
                    <template v-if="selectedMatch.type === 'singles'">
                      <strong>{{ selectedMatch.team1[0].name }}</strong>
                      {{ selectedMatch.team1[0].country }}
                    </template>
                    <template v-else>
                      <div>{{ selectedMatch.team1[0].name }}</div>
                      <div>{{ selectedMatch.team1[1].name }}</div>
                    </template>
                  </td>
                  <td>
                    <template v-if="selectedMatch.type === 'singles'">
                      <strong>{{ selectedMatch.team2[0].name }}</strong>
                      {{ selectedMatch.team2[0].country }}
                    </template>
                    <template v-else>
                      <div>{{ selectedMatch.team2[0].name }}</div>
                      <div>{{ selectedMatch.team2[1].name }}</div>
                    </template>
                  </td>
                  <td>
                    <strong>{{ selectedMatch.bestOf }}</strong>
                  </td>
                </tr>
              </tbody>
            </table>
            <p class="modal-prompt">Are you sure you want to start?</p>
          </div>
        </div>
        <div class="modal-footer">
          <button @click="startMatch" class="modal-btn primary-btn">Start</button>
          <button @click="closeMatchConfirm" class="modal-btn secondary-btn">Reset</button>
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
.modal-overlay {
  opacity: 1;
  pointer-events: all;
}
</style>
