<template>
  <div class="match-form-page">
    <div class="form-header">
      <router-link to="/admin/dashboard" class="back-link">← Back to Dashboard</router-link>
      <h1 class="page-title">Create New Match</h1>
      <p class="page-subtitle">Configure match details and player information.</p>
    </div>

    <form class="match-form" @submit.prevent="onSubmit">
      <!-- Basic Info -->
      <section class="form-section">
        <h2 class="section-title">Match Details</h2>

        <div class="form-row">
          <div class="form-group">
            <label for="match-event">Event / Title</label>
            <input
              id="match-event"
              v-model="form.event"
              type="text"
              placeholder="e.g. Men's Singles Finals"
              required
            />
          </div>

          <div class="form-group">
            <label for="match-time">Scheduled Time</label>
            <input
              id="match-time"
              v-model="form.scheduledTime"
              type="datetime-local"
              required
            />
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label>Match Type</label>
            <div class="radio-group">
              <label class="radio-option" :class="{ active: form.type === 'singles' }">
                <input v-model="form.type" type="radio" value="singles" />
                Singles
              </label>
              <label class="radio-option" :class="{ active: form.type === 'doubles' }">
                <input v-model="form.type" type="radio" value="doubles" />
                Doubles
              </label>
            </div>
          </div>

          <div class="form-group">
            <label for="match-best-of">Best Of</label>
            <select id="match-best-of" v-model="form.bestOf">
              <option :value="3">3</option>
              <option :value="5">5</option>
              <option :value="7">7</option>
            </select>
          </div>

          <div class="form-group">
            <label for="match-table-number">Table Number</label>
            <input
              id="match-table-number"
              v-model="form.tableNumber"
              type="number"
              placeholder="e.g. 1"
              min="1"
            />
          </div>
        </div>
      </section>

      <!-- Players -->
      <section class="form-section">
        <h2 class="section-title">Players</h2>
        <div class="teams-grid">
          <!-- Team 1 -->
          <div class="team-card">
            <div class="team-header">
              <span class="team-label team1-label">Team 1</span>
            </div>
            <div
              v-for="(player, i) in form.team1"
              :key="`t1-${i}`"
              class="player-fields"
            >
              <div class="form-group">
                <label :for="`t1-name-${i}`">{{ form.type === 'doubles' ? `Player ${i + 1} Name` : 'Name' }}</label>
                <input
                  :id="`t1-name-${i}`"
                  v-model="player.name"
                  type="text"
                  placeholder="Full name"
                  required
                />
              </div>
              <div class="form-group">
                <label :for="`t1-country-${i}`">Country (optional)</label>
                <input
                  :id="`t1-country-${i}`"
                  v-model="player.country"
                  type="text"
                  placeholder="e.g. SGP"
                  maxlength="4"
                />
              </div>
            </div>
          </div>

          <div class="vs-divider">VS</div>

          <!-- Team 2 -->
          <div class="team-card">
            <div class="team-header">
              <span class="team-label team2-label">Team 2</span>
            </div>
            <div
              v-for="(player, i) in form.team2"
              :key="`t2-${i}`"
              class="player-fields"
            >
              <div class="form-group">
                <label :for="`t2-name-${i}`">{{ form.type === 'doubles' ? `Player ${i + 1} Name` : 'Name' }}</label>
                <input
                  :id="`t2-name-${i}`"
                  v-model="player.name"
                  type="text"
                  placeholder="Full name"
                  required
                />
              </div>
              <div class="form-group">
                <label :for="`t2-country-${i}`">Country (optional)</label>
                <input
                  :id="`t2-country-${i}`"
                  v-model="player.country"
                  type="text"
                  placeholder="e.g. CHN"
                  maxlength="4"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      <p v-if="error" class="form-error">{{ error }}</p>

      <div class="form-actions">
        <router-link to="/admin/dashboard" class="cancel-btn">Cancel</router-link>
        <button id="submit-match-btn" type="submit" class="submit-btn" :disabled="loading">
          <span v-if="loading">Creating…</span>
          <span v-else>Create Match</span>
        </button>
      </div>
    </form>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAdminStore } from '../../stores/adminStore'

const adminStore = useAdminStore()
const router = useRouter()

const form = ref({
  event: '',
  scheduledTime: '',
  type: 'singles',
  bestOf: 5,
  team1: [{ name: '', country: '' }],
  team2: [{ name: '', country: '' }],
  tableNumber: null,
})

// Adjust team size on type change
watch(
  () => form.value.type,
  (type) => {
    if (type === 'singles') {
      form.value.team1 = [{ name: '', country: '' }]
      form.value.team2 = [{ name: '', country: '' }]
    } else {
      form.value.team1 = [{ name: '', country: '' }, { name: '', country: '' }]
      form.value.team2 = [{ name: '', country: '' }, { name: '', country: '' }]
    }
  }
)

const loading = ref(false)
const error = ref('')

function buildPayload() {
  // Format time as naive local time string — no UTC "Z" suffix
  let timeStr = form.value.scheduledTime
  if (timeStr) {
    // datetime-local gives "YYYY-MM-DDTHH:mm" — append :00 for seconds
    if (timeStr.length === 16) timeStr += ':00'
  }

  const cleanPlayers = (list) =>
    list.map((p) => {
      const obj = { name: p.name.trim() }
      if (p.country?.trim()) obj.country = p.country.trim().toUpperCase()
      return obj
    })

  return {
    type: form.value.type,
    event: form.value.event.trim(),
    time: timeStr,
    bestOf: form.value.bestOf,
    team1: cleanPlayers(form.value.team1),
    team2: cleanPlayers(form.value.team2),
    tableNumber: form.value.tableNumber ? parseInt(form.value.tableNumber) : null,
  }
}

async function onSubmit() {
  loading.value = true
  error.value = ''
  try {
    const payload = buildPayload()
    await adminStore.createMatch(payload)
    router.push('/admin/dashboard')
  } catch (e) {
    error.value = e.message || 'Failed to create match'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.match-form-page {
  max-width: 900px;
  margin: 0 auto;
}

.form-header {
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

.page-title {
  font-size: 1.75rem;
  font-weight: 700;
  color: #f1f5f9;
}

.page-subtitle {
  color: #64748b;
  font-size: 0.95rem;
  margin-top: 0.3rem;
}

.match-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.form-section {
  background: #1e293b;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 16px;
  padding: 1.75rem;
}

.section-title {
  font-size: 1rem;
  font-weight: 700;
  color: #94a3b8;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 1.25rem;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.25rem;
  margin-bottom: 1.25rem;
}

.form-row:last-child {
  margin-bottom: 0;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-group label {
  font-size: 0.82rem;
  font-weight: 600;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.form-group input,
.form-group select {
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 10px;
  padding: 0.75rem 1rem;
  color: #f1f5f9;
  font-size: 0.95rem;
  font-family: 'Outfit', sans-serif;
  outline: none;
  transition: border-color 0.2s;
  color-scheme: dark;
}

.form-group input::placeholder {
  color: #334155;
}

.form-group input:focus,
.form-group select:focus {
  border-color: #219c06;
  background: rgba(33, 156, 6, 0.06);
}

.form-group select option {
  background: #1e293b;
}

.radio-group {
  display: flex;
  gap: 0.75rem;
}

.radio-option {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.7rem 1rem;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: #64748b;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.radio-option input[type='radio'] {
  display: none;
}

.radio-option.active {
  background: rgba(33, 156, 6, 0.15);
  border-color: rgba(33, 156, 6, 0.4);
  color: #4ade80;
}

.teams-grid {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  gap: 1.5rem;
  align-items: start;
}

.team-card {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.team-header {
  margin-bottom: 0.25rem;
}

.team-label {
  font-size: 0.8rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
}

.team1-label {
  background: rgba(99, 179, 237, 0.12);
  color: #63b3ed;
}

.team2-label {
  background: rgba(154, 117, 234, 0.12);
  color: #9a75ea;
}

.player-fields {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.06);
}

.vs-divider {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1rem;
  font-weight: 800;
  color: #475569;
  padding-top: 2rem;
}

.form-error {
  color: #f87171;
  font-size: 0.9rem;
  text-align: center;
  padding: 0.75rem;
  background: rgba(248, 113, 113, 0.1);
  border-radius: 10px;
  border: 1px solid rgba(248, 113, 113, 0.2);
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  padding-top: 0.5rem;
}

.cancel-btn {
  display: inline-flex;
  align-items: center;
  padding: 0.7rem 1.5rem;
  border-radius: 10px;
  font-size: 0.95rem;
  font-weight: 600;
  text-decoration: none;
  background: rgba(255, 255, 255, 0.06);
  color: #94a3b8;
  transition: all 0.2s;
}

.cancel-btn:hover {
  background: rgba(255, 255, 255, 0.1);
}

.submit-btn {
  background: linear-gradient(135deg, #219c06, #1e8706);
  color: white;
  font-size: 0.95rem;
  font-weight: 700;
  font-family: 'Outfit', sans-serif;
  padding: 0.7rem 2rem;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 4px 15px rgba(33, 156, 6, 0.35);
}

.submit-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(33, 156, 6, 0.5);
}

.submit-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
