import { setActivePinia, createPinia } from 'pinia';
import { useMatchStore } from './src/stores/matchStore.js';

setActivePinia(createPinia());
const store = useMatchStore();
store.selectMatch({ type: 'doubles', bestOf: 1, team1: [{name: 'A'}, {name: 'B'}], team2: [{name: 'C'}, {name: 'D'}] });
store.startPoint();

// p1 to 4, p2 to 3
store.handleScore(1, 4);
store.handleScore(2, 3);
console.log("Score 4-3, swappedSides:", store.swappedSides);

// p1 to 5 -> triggers swap pending
store.handleScore(1, 1);
console.log("Score 5-3, pending:", store.midGameSwapPending);
store.applyMidGameSwap();
console.log("After apply: swappedSides", store.swappedSides, "decidingSwapDone", store.decidingSwapDone);

// undo p1 score -> should be 4-3 and unswapped
store.handleScore(1, -1);
console.log("Score 4-3, swappedSides:", store.swappedSides);
