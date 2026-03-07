<script setup>
import { computed } from 'vue'
import { useMatchStore } from '../../stores/matchStore'

const props = defineProps({
  teamNum: { type: Number, required: true },
  align: { type: String, default: 'left' } // 'left' or 'right' alignment of the stack
})

const matchStore = useMatchStore()

const playerCards = computed(() => matchStore[`team${props.teamNum}Cards`]);
const coachCards = computed(() => matchStore[`team${props.teamNum}CoachCards`]);
const timeoutUsed = computed(() => matchStore[`team${props.teamNum}Timeout`]);

const hasAny = computed(() => timeoutUsed.value || playerCards.value.length > 0 || coachCards.value.length > 0)
</script>

<template>
  <div v-if="hasAny" class="card-indicators-stack" :class="'align-' + align">
    <!-- Row 1: Player Track & Timeout (T, Y, YR1, YR2) -->
    <div class="ci-row">
      <!-- Timeout -->
      <div v-if="timeoutUsed" class="ci-icon ci-timeout">T</div>

      <!-- Player Cards -->
      <div v-for="(card, index) in playerCards" :key="'p'+index" class="ci-icon" :class="'ci-' + card.toLowerCase()">
        <span v-if="card === 'YR1'" class="ci-num">1</span>
        <span v-if="card === 'YR2'" class="ci-num">2</span>
      </div>
    </div>

    <!-- Row 2: Coach Track (Coach Yellow, Coach Red) -->
    <div class="ci-row" v-if="coachCards.length > 0">
      <div v-for="(card, index) in coachCards" :key="'c'+index" class="ci-icon ci-coach" :class="'ci-' + card.toLowerCase()">
        C
      </div>
    </div>
  </div>
</template>

<style scoped>
.card-indicators-stack {
  display: flex;
  flex-direction: column;
  gap: 5px;
  min-width: 100px;
}

/* Alignment logic: Stack children towards the button side */
.align-left { align-items: flex-start; }
.align-right { align-items: flex-end; }

.ci-row {
  display: flex;
  gap: 8px;
}

.ci-icon {
  width: 28px;
  height: 38px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  font-weight: 850;
  color: #222;
  position: relative;
  box-shadow: 0 3px 6px rgba(0,0,0,0.6);
  border: 1px solid rgba(255,255,255,0.15);
  flex-shrink: 0;
}

.ci-timeout { background: #bbb; color: #333; font-size: 20px; }
.ci-yellow  { background: #f5c400; }
.ci-red     { background: #d32f2f; color: white; }

/* Vertically split gradient for YR1/YR2 */
.ci-yr1, .ci-yr2 {
  background: linear-gradient(180deg, #f5c400 50%, #d32f2f 50%);
  color: transparent;
}

.ci-num {
  position: absolute;
  bottom: 0px;
  color: white;
  font-size: 14px;
  font-weight: 950;
  text-shadow: 0 1px 3px rgba(0,0,0,0.9);
}

.ci-coach {
  font-size: 16px;
}
</style>
