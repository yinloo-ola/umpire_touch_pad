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

    it('initial quadrant indices are 0, 1, 0, 1', () => {
        expect(store.p1Top).toBe(0)
        expect(store.p1Bot).toBe(1)
        expect(store.p2Top).toBe(0)
        expect(store.p2Bot).toBe(1)
    })

    it('swapLeftPlayers() toggles p1Top ↔ p1Bot', () => {
        store.swapLeftPlayers()
        expect(store.p1Top).toBe(1)
        expect(store.p1Bot).toBe(0)
        // p2 unchanged
        expect(store.p2Top).toBe(0)
        expect(store.p2Bot).toBe(1)
    })

    it('swapLeftPlayers() twice returns to original', () => {
        store.swapLeftPlayers()
        store.swapLeftPlayers()
        expect(store.p1Top).toBe(0)
        expect(store.p1Bot).toBe(1)
    })

    it('swapRightPlayers() toggles p2Top ↔ p2Bot', () => {
        store.swapRightPlayers()
        expect(store.p2Top).toBe(1)
        expect(store.p2Bot).toBe(0)
        // p1 unchanged
        expect(store.p1Top).toBe(0)
        expect(store.p1Bot).toBe(1)
    })

    it('quadrant getters return correct players when swappedSides=false', () => {
        // Left = team1, Right = team2
        expect(store.doublesLeftTopPlayer.name).toBe('A')   // team1[p1Top=0]
        expect(store.doublesLeftBotPlayer.name).toBe('B')   // team1[p1Bot=1]
        expect(store.doublesRightTopPlayer.name).toBe('X')  // team2[p2Top=0]
        expect(store.doublesRightBotPlayer.name).toBe('Y')  // team2[p2Bot=1]
    })

    it('quadrant getters swap sides correctly when swappedSides=true', () => {
        store.swappedSides = true
        // Left = team2 (using p2 indices), Right = team1 (using p1 indices)
        expect(store.doublesLeftTopPlayer.name).toBe('X')   // team2[p2Top=0]
        expect(store.doublesLeftBotPlayer.name).toBe('Y')   // team2[p2Bot=1]
        expect(store.doublesRightTopPlayer.name).toBe('A')  // team1[p1Top=0]
        expect(store.doublesRightBotPlayer.name).toBe('B')  // team1[p1Bot=1]
    })

    it('quadrant getters reflect swapLeftPlayers() after side swap', () => {
        store.swapLeftPlayers()          // p1Top=1, p1Bot=0
        store.swappedSides = true
        // Left is now team2, Right is now team1 (using p1 indices after swap)
        expect(store.doublesRightTopPlayer.name).toBe('B')  // team1[p1Top=1]
        expect(store.doublesRightBotPlayer.name).toBe('A')  // team1[p1Bot=0]
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

    it('deuce 11-11: servesPassed=12 → cyclePos=0 → A serves again', () => {
        scorePoints(store, 11, 11)
        expect(store.doublesServerName).toBe('A')
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

    it('resets quadrant indices to 0,1,0,1 for new game', () => {
        store.p1Top = 1  // simulate a swap
        store.p2Bot = 0
        store.nextGame()
        expect(store.p1Top).toBe(0)
        expect(store.p1Bot).toBe(1)
        expect(store.p2Top).toBe(0)
        expect(store.p2Bot).toBe(1)
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
        const match = matchType === 'doubles' ? doublesMatch : singlesMatch
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

    it('singles: swappedSides toggles at score 5', () => {
        const store = buildStore('singles')
        store.p1Score = 4
        store.startPoint()
        store.handleScore(1, 1)  // p1Score → 5
        expect(store.swappedSides).toBe(true)
        expect(store.decidingSwapDone).toBe(true)
    })

    it('singles: NO quadrant index changes (p1Top stays 0)', () => {
        const store = buildStore('singles')
        store.p1Score = 4
        store.startPoint()
        store.handleScore(1, 1)
        expect(store.p1Top).toBe(0)
        expect(store.p1Bot).toBe(1)
        expect(store.p2Top).toBe(0)
        expect(store.p2Bot).toBe(1)
    })

    it('doubles: swappedSides toggles at score 5', () => {
        const store = buildStore('doubles')
        store.p1Score = 4
        store.startPoint()
        store.handleScore(1, 1)
        expect(store.swappedSides).toBe(true)
        expect(store.decidingSwapDone).toBe(true)
    })

    it('doubles: initial receiver (team2) ends up on left after swap — receives extra swap', () => {
        const store = buildStore('doubles')
        // Initial: server=team1, receiver=team2. swappedSides=false → left=team1.
        // After toggle: swappedSides=true → left=team2 (receiver side).
        // Receiver on left → extra swapLeft → net effect: p1Top=0,p1Bot=1 (cancelled) + p2 swaps once
        store.p1Score = 4
        store.startPoint()
        store.handleScore(1, 1)
        // After toggle (swappedSides=true), receivingTeam=2, leftTeam=2 → swap left again
        // p1: swapped then swapped back = 0,1  p2: swapped once = 1,0
        expect(store.p1Top).toBe(0)
        expect(store.p1Bot).toBe(1)
        expect(store.p2Top).toBe(1)
        expect(store.p2Bot).toBe(0)
    })

    it('decidingSwapDone prevents double-trigger on next point', () => {
        const store = buildStore('singles')
        store.p1Score = 4
        store.startPoint()
        store.handleScore(1, 1)  // triggers swap, swappedSides=true
        const sideBefore = store.swappedSides
        store.startPoint()
        store.handleScore(1, 1)  // p1Score=6, should NOT re-trigger
        expect(store.swappedSides).toBe(sideBefore)  // unchanged
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
        store.p2Score = 4
        store.startPoint()
        store.handleScore(2, 1)  // p2Score → 5
        expect(store.swappedSides).toBe(true)
        expect(store.decidingSwapDone).toBe(true)
    })
})
