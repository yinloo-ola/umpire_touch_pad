import { describe, test, expect, beforeEach } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useMatchStore } from '../matchStore'

describe('matchStore rotation logic', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  test('doubles Game 2: swapping server automatically determines mandatory receiver', () => {
    const store = useMatchStore()
    store.selectMatch({
      id: 'm1',
      type: 'doubles',
      team1: [{ name: 'A' }, { name: 'B' }],
      team2: [{ name: 'X' }, { name: 'Y' }],
      bestOf: 5,
      status: 'starting'
    })

    // Game 1: Serve 1 (A) -> Receive 0 (X)
    store.doublesInitialServer = { team: 1, player: 0 } // A
    store.doublesInitialReceiver = { team: 2, player: 0 } // X
    store.syncDoublesQuadrants()

    // Map: A -> X, X -> B, B -> Y, Y -> A

    // End Game 1
    store.isGameOver = true
    store.nextGame() // Increments game to 2, resets scores, sets prevInitialServer/Receiver

    expect(store.game).toBe(2)
    expect(store.prevDoublesInitialServer).toEqual({ team: 1, player: 0 })
    expect(store.prevDoublesInitialReceiver).toEqual({ team: 2, player: 0 })

    // Rule: The team that RECEIVED first in G1 (Team 2) SERVES first in G2.
    expect(store.doublesNextServingTeam).toBe(2)
    // nextGame automatically initialized server to player 0 of team 2 (X)
    expect(store.doublesInitialServer).toEqual({ team: 2, player: 0 }) 

    // Who must receive? A or B?
    // In G1: A served to X.
    // In G2: If X serves, he must serve to whoever served to him in G1.
    // X received FROM A in G1.
    // So if X serves in G2, he serves to A.
    expect(store.doublesInitialReceiver).toEqual({ team: 1, player: 0 }) // A

    // NOW TEST THE MANUAL SWAP IN SETUP
    // Umpire decides Y (Player 1 of Team 2) should serve instead of X.
    // Clicking "Swap Players" on Team 2 (which is the serving team)
    store.swapPlayerOnTeam(2)

    // New server is Y (Team 2, Player 1).
    expect(store.doublesInitialServer).toEqual({ team: 2, player: 1 })

    // mandatory receiver recalibration:
    // In G1: Y received FROM B. (Y->A, A->X, X->B, B->Y cycle)
    // Wait, let's trace: A->X, X->B, B->Y, Y->A.
    // Who served to Y? B.
    // So if Y serves in G2, Y serves to B.
    expect(store.doublesInitialReceiver.player).toBe(1) // B (Player 1 of Team 1)
  })
})
