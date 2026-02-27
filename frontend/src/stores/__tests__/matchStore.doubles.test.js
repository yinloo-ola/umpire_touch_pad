import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useMatchStore } from '../matchStore'

const doublesMatch = {
    type: 'doubles',
    bestOf: 5,
    team1: [{ name: 'A', country: 'AU' }, { name: 'B', country: 'AU' }],
    team2: [{ name: 'X', country: 'CN' }, { name: 'Y', country: 'CN' }],
}

const singlesMatch = {
    type: 'singles',
    bestOf: 5,
    team1: [{ name: 'P1', country: 'AU' }],
    team2: [{ name: 'P2', country: 'CN' }],
}

function scorePoints(store, p1pts, p2pts) {
    store.p1Score = p1pts
    store.p2Score = p2pts
}

// ─── Plan 1.1 ───────────────────────────────────────────────────────────────

describe('Plan 1.1 – Quadrant state & swap actions', () => {
    let store

    beforeEach(() => {
        setActivePinia(createPinia())
        store = useMatchStore()
        store.selectMatch(doublesMatch)
    })

    it('initial quadrant indices reflect Alice/Server at bottom-left', () => {
        // server={team:1,player:0} (Alice), receiver={team:2,player:0} (X)
        // Team1 on Left -> Alice(0) @ Bot -> p1Bot=0, p1Top=1
        // Team2 on Right -> X(0) @ Top -> p2Top=0, p2Bot=1
        expect(store.p1Top).toBe(1)
        expect(store.p1Bot).toBe(0)
        expect(store.p2Top).toBe(0)
        expect(store.p2Bot).toBe(1)
    })

    it('swapLeftPlayers() toggles indices via server shift', () => {
        store.swapLeftPlayers()
        // Team1 is serving at 0-0. Swapping means opponent now expects B serving.
        // So p1Bot becomes 1 (B), p1Top becomes 0 (A)
        expect(store.p1Top).toBe(0)
        expect(store.p1Bot).toBe(1)
        // p2 unchanged
        expect(store.p2Top).toBe(0)
        expect(store.p2Bot).toBe(1)
    })

    it('swapLeftPlayers() twice returns to original', () => {
        store.swapLeftPlayers()
        store.swapLeftPlayers()
        expect(store.p1Top).toBe(1)
        expect(store.p1Bot).toBe(0)
    })

    it('swapRightPlayers() toggles via receiver shift', () => {
        store.swapRightPlayers()
        // Team2 is receiving. Swapping means Y(1) is now receiver @ Top.
        // So p2Top=1, p2Bot=0
        expect(store.p2Top).toBe(1)
        expect(store.p2Bot).toBe(0)
        // p1 unchanged (still A@Bot)
        expect(store.p1Top).toBe(1)
        expect(store.p1Bot).toBe(0)
    })

    it('quadrant getters return correct players when swappedSides=false', () => {
        // Left = team1, Right = team2
        expect(store.doublesLeftTopPlayer.name).toBe('B')   // team1[p1Top=1]
        expect(store.doublesLeftBotPlayer.name).toBe('A')   // team1[p1Bot=0] Alice is server
        expect(store.doublesRightTopPlayer.name).toBe('X')  // team2[p2Top=0] X is receiver
        expect(store.doublesRightBotPlayer.name).toBe('Y')  // team2[p2Bot=1]
    })

    it('quadrant getters swap sides correctly when swappedSides=true', () => {
        store.swappedSides = true
        store.syncDoublesQuadrants()
        // Left = team2. active=X(0)@Bot. Right = team1. active=A(0)@Top.
        expect(store.doublesLeftTopPlayer.name).toBe('Y')
        expect(store.doublesLeftBotPlayer.name).toBe('X')
        expect(store.doublesRightTopPlayer.name).toBe('A')
        expect(store.doublesRightBotPlayer.name).toBe('B')
    })

    it('quadrant getters reflect swapLeftPlayers() after side swap', () => {
        store.swapLeftPlayers()          // Changes server to B(1). p1Bot=1, p1Top=0.
        store.swappedSides = true
        store.syncDoublesQuadrants()
        // Left = team2, Right = team1. Server B(1) on Right side must be at TOP.
        // So p1Top=1.
        expect(store.doublesRightTopPlayer.name).toBe('B')
        expect(store.doublesRightBotPlayer.name).toBe('A')
    })

    it('decidingSwapDone resets to false on selectMatch()', () => {
        store.decidingSwapDone = true
        store.selectMatch(doublesMatch)
        expect(store.decidingSwapDone).toBe(false)
    })
})

// ─── Plan 1.2 ───────────────────────────────────────────────────────────────

describe('Plan 1.2 – Doubles serve rotation formula', () => {
    let store

    beforeEach(() => {
        setActivePinia(createPinia())
        store = useMatchStore()
        store.selectMatch(doublesMatch)
        // doublesInitialServer = { team:1, player:0 } = A
        // doublesInitialReceiver = { team:2, player:0 } = X
    })

    it('at 0-0: A serves, X receives', () => {
        scorePoints(store, 0, 0)
        expect(store.doublesServerName).toBe('A')
        expect(store.doublesReceiverName).toBe('X')
    })

    it('at 2-0 (servesPassed=1): X serves, B receives', () => {
        scorePoints(store, 2, 0)
        expect(store.doublesServerName).toBe('X')
        expect(store.doublesReceiverName).toBe('B')
    })

    it('at 4-0 (servesPassed=2): B serves, Y receives', () => {
        scorePoints(store, 4, 0)
        expect(store.doublesServerName).toBe('B')
        expect(store.doublesReceiverName).toBe('Y')
    })

    it('at 6-0 (servesPassed=3): Y serves, A receives', () => {
        scorePoints(store, 6, 0)
        expect(store.doublesServerName).toBe('Y')
        expect(store.doublesReceiverName).toBe('A')
    })

    it('at 8-0 (servesPassed=4): cycle wraps — A serves again', () => {
        scorePoints(store, 8, 0)
        expect(store.doublesServerName).toBe('A')
    })

    it('deuce 10-10: servesPassed=10 → cyclePos=2 → B serves', () => {
        // Normal: floor((10+10)/2)=10, but deuce overrides: 10 + (20-20) = 10
        scorePoints(store, 10, 10)
        expect(store.doublesServerName).toBe('B')  // cycle[10%4=2]=B
    })

    it('deuce 10-11: servesPassed=11 → cyclePos=3 → Y serves', () => {
        scorePoints(store, 10, 11)
        expect(store.doublesServerName).toBe('Y')
    })

    it('at 11-11: servesPassed=12 → cyclePos=0 → A serves again', () => {
        scorePoints(store, 11, 11)
        expect(store.doublesServerName).toBe('A')
    })

    it('repro bug fix: at 2-0, quadrants swap automatically for new receiver Alto', () => {
        // 0-0: A serves to X. Left team is {A, B}, A is @Bot. Right is {X, Y}, X is @Top.
        expect(store.doublesLeftBotPlayer.name).toBe('A')
        expect(store.doublesRightTopPlayer.name).toBe('X')

        // Score 2 points -> 2-0. Serve rotates.
        // Rotation: X serves to B (Partner of A).
        // X is on Right Team. X(0) must move to Top quadrant on Right? No, Right active is Top.
        // B is on Left Team. B(1) must move to Bottom quadrant on Left.
        store.isStarted = true
        store.pointStarted = true
        store.handleScore(1, 1) // 1-0
        store.pointStarted = true
        store.handleScore(1, 1) // 2-0 -> Serve rotation triggered

        expect(store.doublesServerName).toBe('X')
        expect(store.doublesReceiverName).toBe('B')

        // VERIFY AUTOMATIC QUADRANT SWAP
        expect(store.doublesRightTopPlayer.name).toBe('X') // Server X @ Top-Right
        expect(store.doublesLeftBotPlayer.name).toBe('B')  // Receiver B @ Bottom-Left (Alto equivalent in user story)
    })
})

describe('Plan 1.2 – isLeftDoublesServer getter', () => {
    let store

    beforeEach(() => {
        setActivePinia(createPinia())
        store = useMatchStore()
        store.selectMatch(doublesMatch)
    })

    it('at 0-0 with swappedSides=false: A (team1) is on left → isLeftDoublesServer=true', () => {
        scorePoints(store, 0, 0)
        expect(store.isLeftDoublesServer).toBe(true)
    })

    it('at 2-0 with swappedSides=false: X (team2) is on right → isLeftDoublesServer=false', () => {
        scorePoints(store, 2, 0)
        expect(store.isLeftDoublesServer).toBe(false)
    })

    it('swappedSides=true flips which team is left', () => {
        store.swappedSides = true
        scorePoints(store, 0, 0)
        // A is team1; with swapped, left = team2. team1 is now right.
        expect(store.isLeftDoublesServer).toBe(false)
    })
})

describe('Plan 1.2 – Singles guard in handleScore()', () => {
    let store

    beforeEach(() => {
        setActivePinia(createPinia())
        store = useMatchStore()
        store.selectMatch(doublesMatch)
        store.isStarted = true
    })

    it('handleScore() does NOT change store.server for doubles match', () => {
        store.server = 1
        store.startPoint()
        store.handleScore(1, 1)  // score a point
        // server should remain as-is (not auto-rotated by singles logic)
        expect(store.server).toBe(1)
        store.startPoint()
        store.handleScore(1, 1)
        expect(store.server).toBe(1)
    })
})

describe('Plan 1.2 – setDoublesServer() umpire override', () => {
    let store

    beforeEach(() => {
        setActivePinia(createPinia())
        store = useMatchStore()
        store.selectMatch(doublesMatch)
        // Initial state: doublesInitialServer={team:1,player:0}=A, doublesInitialReceiver={team:2,player:0}=X
    })

    it('at 0-0 (cyclePos=0): override to B(team1,p1) adjusts initialServer to B', () => {
        scorePoints(store, 0, 0)
        store.setDoublesServer(1, 1)  // override: B serves now
        expect(store.doublesServerName).toBe('B')
    })

    it('at 2-0 (cyclePos=1, X serving): override to Y(team2,p1) adjusts so Y serves', () => {
        scorePoints(store, 2, 0)
        store.setDoublesServer(2, 1)  // override: Y serves now
        expect(store.doublesServerName).toBe('Y')
    })

    it('setDoublesServer preserves opposite team receiver relationship', () => {
        scorePoints(store, 0, 0)
        store.setDoublesServer(1, 0)  // Keep A — no-op in effect
        expect(store.doublesServerName).toBe('A')
    })
})

// ─── Plan 1.3 ───────────────────────────────────────────────────────────────

describe('Plan 1.3 – setDoublesServerForNewGame() mandatory receiver', () => {
    let store
    // Previous game: A served to X initially
    const prevInit = { team: 1, player: 0 }   // A
    const prevRecv = { team: 2, player: 0 }    // X

    beforeEach(() => {
        setActivePinia(createPinia())
        store = useMatchStore()
        store.selectMatch(doublesMatch)
    })

    it('new server=X(team2,p0) → mandatory receiver is A (A served TO X)', () => {
        store.setDoublesServerForNewGame(2, 0, prevInit, prevRecv)
        expect(store.doublesInitialServer).toEqual({ team: 2, player: 0 })
        expect(store.doublesInitialReceiver).toEqual({ team: 1, player: 0 })  // A
    })

    it('new server=B(team1,p1) → mandatory receiver is X (X served TO B)', () => {
        store.setDoublesServerForNewGame(1, 1, prevInit, prevRecv)
        expect(store.doublesInitialServer).toEqual({ team: 1, player: 1 })
        expect(store.doublesInitialReceiver).toEqual({ team: 2, player: 0 })  // X
    })

    it('new server=Y(team2,p1) → mandatory receiver is B (B served TO Y)', () => {
        store.setDoublesServerForNewGame(2, 1, prevInit, prevRecv)
        expect(store.doublesInitialServer).toEqual({ team: 2, player: 1 })
        expect(store.doublesInitialReceiver).toEqual({ team: 1, player: 1 })  // B
    })

    it('new server=A(team1,p0) → mandatory receiver is Y (Y served TO A)', () => {
        store.setDoublesServerForNewGame(1, 0, prevInit, prevRecv)
        expect(store.doublesInitialServer).toEqual({ team: 1, player: 0 })
        expect(store.doublesInitialReceiver).toEqual({ team: 2, player: 1 })  // Y
    })
})

describe('Plan 1.3 – nextGame() for doubles', () => {
    let store

    beforeEach(() => {
        setActivePinia(createPinia())
        store = useMatchStore()
        store.selectMatch(doublesMatch)
        store.isStarted = true
        // Force game over state
        store.p1Score = 11
        store.p2Score = 0
        store.isGameOver = true
    })

    it('records doublesNextServingTeam = receiver.team from prev game', () => {
        // Initial receiver is team2 (X), so next serving team = 2
        store.nextGame()
        expect(store.doublesNextServingTeam).toBe(2)
    })

    it('saves prevDoublesInitialServer and prevDoublesInitialReceiver', () => {
        store.doublesInitialServer = { team: 1, player: 0 }
        store.doublesInitialReceiver = { team: 2, player: 1 }
        store.nextGame()
        expect(store.prevDoublesInitialServer).toEqual({ team: 1, player: 0 })
        expect(store.prevDoublesInitialReceiver).toEqual({ team: 2, player: 1 })
    })

    it('resets and syncs quadrant indices for new game', () => {
        store.p1Top = 1  // simulate a swap
        store.p2Bot = 0
        store.nextGame()
        // nextGame() resets to 0,1,0,1 THEN calls syncDoublesQuadrants()
        // In Game 2, swappedSides=true, Team 2 serves (X). 
        // Team 2 on Left -> X(0) is @Bot. So p2Bot=0, p2Top=1.
        // Team 1 on Right -> A(0) is @Top. So p1Top=0, p1Bot=1.
        expect(store.p1Top).toBe(0)
        expect(store.p1Bot).toBe(1)
        expect(store.p2Top).toBe(1)
        expect(store.p2Bot).toBe(0)
    })

    it('resets decidingSwapDone to false', () => {
        store.decidingSwapDone = true
        store.nextGame()
        expect(store.decidingSwapDone).toBe(false)
    })

    it('scores and isGameOver are reset', () => {
        store.nextGame()
        expect(store.p1Score).toBe(0)
        expect(store.p2Score).toBe(0)
        expect(store.isGameOver).toBe(false)
    })
})

describe('Plan 1.3 – Deciding-game side swap', () => {
    function buildStore(matchType) {
        setActivePinia(createPinia())
        const store = useMatchStore()
        const match = matchType === 'doubles' ? { ...doublesMatch } : { ...singlesMatch }
        store.selectMatch(match)
        store.isStarted = true
        // Advance to the deciding game (game 5 for bestOf=5)
        store.game = 5
        store.swappedSides = false
        store.p1Top = 0; store.p1Bot = 1
        store.p2Top = 0; store.p2Bot = 1
        store.decidingSwapDone = false
        return store
    }

    it('singles: midGameSwapPending becomes true at score 5', () => {
        const store = buildStore('singles')
        store.p1Score = 4
        store.startPoint()
        store.handleScore(1, 1)  // p1Score → 5
        expect(store.midGameSwapPending).toBe(true)
        expect(store.swappedSides).toBe(false) // Not swapped yet

        store.applyMidGameSwap()
        expect(store.swappedSides).toBe(true)
        expect(store.decidingSwapDone).toBe(true)
    })

    it('singles: NO quadrant index changes (p1Top stays 0)', () => {
        const store = buildStore('singles')
        store.p1Score = 4
        store.startPoint()
        store.handleScore(1, 1)
        store.applyMidGameSwap()
        expect(store.p1Top).toBe(0)
        expect(store.p1Bot).toBe(1)
        expect(store.p2Top).toBe(0)
        expect(store.p2Bot).toBe(1)
    })

    it('doubles: midGameSwapPending becomes true at score 5', () => {
        const store = buildStore('doubles')
        store.p1Score = 4
        store.startPoint()
        store.handleScore(1, 1)
        expect(store.midGameSwapPending).toBe(true)
        expect(store.swappedSides).toBe(false)

        store.applyMidGameSwap()
        expect(store.swappedSides).toBe(true)
        expect(store.decidingSwapDone).toBe(true)
    })

    it('doubles: receiver changes according to deciding game rule', () => {
        const store = buildStore('doubles')
        // Initial rotation: A->X, X->B, B->Y, Y->A
        // Suppose swap at score 5-0 (server=B, receiver=Y - wait, cyclePos=2 is 4-5 pts)
        // total=4 -> servesPassed=2. cycle[2] = {S:B, R:Y}.
        // Next would be cycle[3] = {S:Y, R:A}.
        scorePoints(store, 4, 1)
        expect(store.doublesServerName).toBe('B')
        expect(store.doublesReceiverName).toBe('Y')

        store.pointStarted = true
        store.handleScore(1, 1) // 5-1. TRIGGER SWAP.
        store.applyMidGameSwap()

        // Before swap, at 5-1, it was cyclePos=3 (total=6 -> servesPassed=3).
        // Cycle[3] servedTo was Y->A.
        // Post-swap rule: "pair having right to receive next shall change...".
        // Next serving team is team1 (was receiver).
        // Rule: A (receiver) should swap with B.
        // So receiver becomes B.
        expect(store.doublesServerName).toBe('Y')
        expect(store.doublesReceiverName).toBe('B') // WAS A before swap logic
    })

    it('Best-of-7: swap fires in game 7 at 5 points', () => {
        const store = buildStore('singles')
        store.currentMatch.bestOf = 7
        store.game = 7
        store.p1Score = 4
        store.startPoint()
        store.handleScore(1, 1)  // p1Score → 5
        expect(store.midGameSwapPending).toBe(true)
    })

    it('decidingSwapDone prevents double-trigger on next point', () => {
        const store = buildStore('singles')
        store.p1Score = 4
        store.startPoint()
        store.handleScore(1, 1)  // triggers pending
        store.applyMidGameSwap()
        const sideBefore = store.swappedSides
        store.startPoint()
        store.handleScore(1, 1)  // p1Score=6, should NOT re-trigger
        expect(store.swappedSides).toBe(sideBefore)  // unchanged
        expect(store.midGameSwapPending).toBe(false)
    })

    it('swap does NOT fire in non-deciding game', () => {
        const store = buildStore('singles')
        store.game = 1  // not deciding game
        store.p1Score = 4
        store.startPoint()
        store.handleScore(1, 1)
        expect(store.swappedSides).toBe(false)
        expect(store.decidingSwapDone).toBe(false)
    })

    it('swap fires when p2 reaches 5 (not just p1)', () => {
        const store = buildStore('singles')
        scorePoints(store, 0, 4) // Use helper to ensure scores proxy is updated
        store.startPoint()
        store.handleScore(2, 1)  // p2Score → 5
        expect(store.p2Score).toBe(5)
        expect(store.midGameSwapPending).toBe(true)
    })
})

describe('Plan 5.2/5.3 – Automated between-game receiver', () => {
    let store
    beforeEach(() => {
        setActivePinia(createPinia())
        store = useMatchStore()
        store.selectMatch(doublesMatch)
        // Game 1: A serves to X.
        store.isStarted = true
        store.p1Score = 11
        store.p2Score = 0
        store.isGameOver = true
    })

    it('nextGame() automatically sets mandatory receiver for Game 2', () => {
        // Game 1: Initial receiver was Team 2 player 0 (X). 
        // Rule: Team that received first in Game 1 serves first in Game 2.
        // So Team 2 serves first in Game 2.
        // Rotation in Game 1: A->X, X->B, B->Y, Y->A.
        // Umpire chooses server for Game 2: Suppose X(Team 2, player 0) serves.
        // Mandatory receiver: The player who served TO X in previous game = A.

        store.nextGame() // game -> 2
        // nextGame should have called setDoublesServerForNewGame(2, 0, ...) internally
        expect(store.game).toBe(2)
        expect(store.doublesInitialServer).toEqual({ team: 2, player: 0 }) // X
        expect(store.doublesInitialReceiver).toEqual({ team: 1, player: 0 }) // A
    })

    it('swapPlayerOnTeam() recalibrates receiver when server swapped pre-play in Game 2', () => {
        store.nextGame()
        // Game 2 starts: X serves to A.
        // Manual swap on Team 2 -> Y serves instead of X.
        // Mandatory receiver: The player who served TO Y in previous game = B.

        store.swapPlayerOnTeam(2) // Y becomes server
        expect(store.doublesInitialServer).toEqual({ team: 2, player: 1 }) // Y
        expect(store.doublesInitialReceiver).toEqual({ team: 1, player: 1 }) // B
    })
})
