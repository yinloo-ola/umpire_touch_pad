import { defineStore } from 'pinia'

export const useMatchStore = defineStore('match', {
  state: () => ({
    currentMatch: null,

    // Core game state
    p1Score: 0,
    p2Score: 0,
    game: 1,
    scores: {
      g1: { p1: 0, p2: 0 },
      g2: { p1: null, p2: null },
      g3: { p1: null, p2: null },
      g4: { p1: null, p2: null },
      g5: { p1: null, p2: null },
      g6: { p1: null, p2: null },
      g7: { p1: null, p2: null },
    },
    initialServer: 1, // 1 or 2
    server: 1, // 1 or 2

    // Flow state
    isStarted: false,
    swappedSides: false,
    pointStarted: false,
    isGameOver: false,
    carryOverPoints: { p1: 0, p2: 0 },

    // Warmup timer
    timerActive: false,
    timeLeft: 120, // seconds

    // Doubles quadrant indices (0 or 1, index into team1[]/team2[])
    // p1Top: which team1 player is in the top-left quadrant
    // p1Bot: which team1 player is in the bottom-left quadrant
    // p2Top: which team2 player is in the top-right quadrant
    // p2Bot: which team2 player is in the bottom-right quadrant
    p1Top: 0,
    p1Bot: 1,
    p2Top: 0,
    p2Bot: 1,
    // Flag to prevent double-triggering the deciding-game mid-game swap
    decidingSwapDone: false,

    // Doubles serve rotation: server/receiver at the START of this game
    // Each is { team: 1|2, player: 0|1 } where player is index into team1[]/team2[]
    doublesInitialServer: { team: 1, player: 0 },    // default: team1[0] serves
    doublesInitialReceiver: { team: 2, player: 0 },  // default: team2[0] receives

    // For doubles between-game: the team that must serve first in next game
    doublesNextServingTeam: null,   // 1 or 2, set by nextGame(), consumed by modal
    // Previous game's initial server/receiver (needed for mandatory receiver lookup)
    prevDoublesInitialServer: null,
    prevDoublesInitialReceiver: null,

    // Deciding-game mid-game swap alert state
    midGameSwapPending: false,
    midGameSwapSnapshot: null,

    // Undo history
    gameHistory: [],

    // Cards & Timeouts
    team1Cards: [],
    team2Cards: [],
    team1CoachCards: [],
    team2CoachCards: [],
    team1Timeout: false,
    team2Timeout: false,
    timeoutActive: false,
    timeoutTimeLeft: 60,
    timeoutCallingTeam: null,
  }),

  getters: {
    gamesWon(state) {
      let p1 = 0
      let p2 = 0
      for (let i = 1; i <= 7; i++) {
        const s = state.scores[`g${i}`]
        if (s && s.p1 !== null && s.p2 !== null) {
          if ((s.p1 >= 11 || s.p2 >= 11) && Math.abs(s.p1 - s.p2) >= 2) {
            if (s.p1 > s.p2) p1++
            else p2++
          }
        }
      }
      return { p1, p2 }
    },
    p1GamesWon() {
      return this.gamesWon.p1
    },
    p2GamesWon() {
      return this.gamesWon.p2
    },
    matchWinner(state) {
      const req = state.currentMatch ? Math.ceil(state.currentMatch.bestOf / 2) : 3
      if (this.gamesWon.p1 >= req) return 1
      if (this.gamesWon.p2 >= req) return 2
      return null
    },

    // UI Getters considering side swapping
    leftPoints: (state) => (state.swappedSides ? state.p2Score : state.p1Score),
    rightPoints: (state) => (state.swappedSides ? state.p1Score : state.p2Score),
    leftGames(state) {
      return state.swappedSides ? this.gamesWon.p2 : this.gamesWon.p1
    },
    rightGames(state) {
      return state.swappedSides ? this.gamesWon.p1 : this.gamesWon.p2
    },
    isLeftServer: (state) => {
      return (
        (!state.swappedSides && state.server === 1) || (state.swappedSides && state.server === 2)
      )
    },

    formattedTime(state) {
      const min = Math.floor(state.timeLeft / 60)
      const sec = state.timeLeft % 60
      return `${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`
    },

    // Doubles: which team1 player object is on the LEFT SIDE (top quadrant)
    doublesLeftTopPlayer: (state) => {
      if (!state.currentMatch) return null
      const idx = state.swappedSides ? state.p2Top : state.p1Top
      const team = state.swappedSides ? state.currentMatch.team2 : state.currentMatch.team1
      return team[idx]
    },

    // Doubles: which team1 player object is on the LEFT SIDE (bottom quadrant)
    doublesLeftBotPlayer: (state) => {
      if (!state.currentMatch) return null
      const idx = state.swappedSides ? state.p2Bot : state.p1Bot
      const team = state.swappedSides ? state.currentMatch.team2 : state.currentMatch.team1
      return team[idx]
    },

    // Doubles: which team2 player object is on the RIGHT SIDE (top quadrant)
    doublesRightTopPlayer: (state) => {
      if (!state.currentMatch) return null
      const idx = state.swappedSides ? state.p1Top : state.p2Top
      const team = state.swappedSides ? state.currentMatch.team1 : state.currentMatch.team2
      return team[idx]
    },

    // Doubles: which team2 player object is on the RIGHT SIDE (bottom quadrant)
    doublesRightBotPlayer: (state) => {
      if (!state.currentMatch) return null
      const idx = state.swappedSides ? state.p1Bot : state.p2Bot
      const team = state.swappedSides ? state.currentMatch.team1 : state.currentMatch.team2
      return team[idx]
    },

    // Doubles: computed current server and receiver derived from formula
    doublesCurrentPair: (state) => {
      const A = state.doublesInitialServer
      const X = state.doublesInitialReceiver
      const B = { team: A.team, player: 1 - A.player }
      const Y = { team: X.team, player: 1 - X.player }

      const total = state.p1Score + state.p2Score
      let servesPassed
      if (state.p1Score >= 10 && state.p2Score >= 10) {
        servesPassed = 10 + (total - 20)
      } else {
        servesPassed = Math.floor(total / 2)
      }

      const cycle = [
        { server: A, receiver: X },
        { server: X, receiver: B },
        { server: B, receiver: Y },
        { server: Y, receiver: A },
      ]
      return cycle[servesPassed % 4]
    },

    // Doubles: is the current server's team on the LEFT side (considering swappedSides)?
    isLeftDoublesServer: (state) => {
      // doublesCurrentPair is another getter — but in (state)=> form we can't
      // call other getters with 'this'. Inline the calc instead.
      const A = state.doublesInitialServer
      const X = state.doublesInitialReceiver
      const B = { team: A.team, player: 1 - A.player }
      const Y = { team: X.team, player: 1 - X.player }
      const total = state.p1Score + state.p2Score
      let servesPassed = (state.p1Score >= 10 && state.p2Score >= 10)
        ? 10 + (total - 20)
        : Math.floor(total / 2)
      const cycle = [
        { server: A, receiver: X },
        { server: X, receiver: B },
        { server: B, receiver: Y },
        { server: Y, receiver: A },
      ]
      const serverTeam = cycle[servesPassed % 4].server.team
      // leftTeam is team1 when NOT swapped, team2 when swapped
      const leftTeam = state.swappedSides ? 2 : 1
      return serverTeam === leftTeam
    },

    // Doubles: name of the current server's player (for display in serve indicator)
    doublesServerName: (state) => {
      if (!state.currentMatch) return ''
      const A = state.doublesInitialServer
      const X = state.doublesInitialReceiver
      const B = { team: A.team, player: 1 - A.player }
      const Y = { team: X.team, player: 1 - X.player }
      const total = state.p1Score + state.p2Score
      let servesPassed = (state.p1Score >= 10 && state.p2Score >= 10)
        ? 10 + (total - 20)
        : Math.floor(total / 2)
      const cycle = [
        { server: A }, { server: X }, { server: B }, { server: Y },
      ]
      const sv = cycle[servesPassed % 4].server
      const team = sv.team === 1 ? state.currentMatch.team1 : state.currentMatch.team2
      return team[sv.player]?.name ?? ''
    },

    // Doubles: name of the current receiver's player
    doublesReceiverName: (state) => {
      if (!state.currentMatch) return ''
      const A = state.doublesInitialServer
      const X = state.doublesInitialReceiver
      const B = { team: A.team, player: 1 - A.player }
      const Y = { team: X.team, player: 1 - X.player }
      const total = state.p1Score + state.p2Score
      let servesPassed = (state.p1Score >= 10 && state.p2Score >= 10)
        ? 10 + (total - 20)
        : Math.floor(total / 2)
      const cycle = [
        { receiver: X }, { receiver: B }, { receiver: Y }, { receiver: A },
      ]
      const rv = cycle[servesPassed % 4].receiver
      const team = rv.team === 1 ? state.currentMatch.team1 : state.currentMatch.team2
      return team[rv.player]?.name ?? ''
    },
  },

  actions: {
    selectMatch(match) {
      this.currentMatch = match
      this.resetMatchState()
      this.syncDoublesQuadrants()
    },

    resetMatchState() {
      this.p1Score = 0
      this.p2Score = 0
      this.game = 1
      this.scores = {
        g1: { p1: 0, p2: 0 },
        g2: { p1: null, p2: null },
        g3: { p1: null, p2: null },
        g4: { p1: null, p2: null },
        g5: { p1: null, p2: null },
        g6: { p1: null, p2: null },
        g7: { p1: null, p2: null },
      }
      this.initialServer = 1
      this.server = 1
      this.isStarted = false
      this.swappedSides = false
      this.pointStarted = false
      this.isGameOver = false
      this.carryOverPoints = { p1: 0, p2: 0 }
      this.timerActive = false
      this.timeLeft = 120
      this.p1Top = 0
      this.p1Bot = 1
      this.p2Top = 0
      this.p2Bot = 1
      this.decidingSwapDone = false
      this.doublesInitialServer = { team: 1, player: 0 }
      this.doublesInitialReceiver = { team: 2, player: 0 }
      this.doublesNextServingTeam = null
      this.prevDoublesInitialServer = null
      this.prevDoublesInitialReceiver = null
      this.midGameSwapPending = false
      this.midGameSwapSnapshot = null

      this.gameHistory = []

      this.team1Cards = []
      this.team2Cards = []
      this.team1CoachCards = []
      this.team2CoachCards = []
      this.team1Timeout = false
      this.team2Timeout = false
      this.timeoutActive = false
      this.timeoutTimeLeft = 60
      this.timeoutCallingTeam = null

      if (this.timeoutInterval) {
        clearInterval(this.timeoutInterval)
        this.timeoutInterval = null
      }
    },

    nextGame() {
      if (this.isGameOver && this.game < (this.currentMatch?.bestOf || 7)) {
        // --- DOUBLES: record previous game serve state for between-game modal ---
        if (this.currentMatch?.type === 'doubles') {
          // The team that received first in THIS game serves first NEXT game
          this.doublesNextServingTeam = this.doublesInitialReceiver.team
          // Save context for mandatory receiver lookup in setDoublesServerForNewGame
          this.prevDoublesInitialServer = { ...this.doublesInitialServer }
          this.prevDoublesInitialReceiver = { ...this.doublesInitialReceiver }
        }

        // Snapshot state for Undo Next Game
        this.gameHistory.push({
          game: this.game,
          p1Score: this.p1Score,
          p2Score: this.p2Score,
          initialServer: this.initialServer,
          server: this.server,
          swappedSides: this.swappedSides,
          pointStarted: this.pointStarted,
          isGameOver: this.isGameOver,
          carryOverPoints: { ...this.carryOverPoints },
          p1Top: this.p1Top,
          p1Bot: this.p1Bot,
          p2Top: this.p2Top,
          p2Bot: this.p2Bot,
          decidingSwapDone: this.decidingSwapDone,
          midGameSwapPending: this.midGameSwapPending,
          doublesInitialServer: { ...this.doublesInitialServer },
          doublesInitialReceiver: { ...this.doublesInitialReceiver },
          prevDoublesInitialServer: this.prevDoublesInitialServer ? { ...this.prevDoublesInitialServer } : null,
          prevDoublesInitialReceiver: this.prevDoublesInitialReceiver ? { ...this.prevDoublesInitialReceiver } : null,
          doublesNextServingTeam: this.doublesNextServingTeam,
          timeoutActive: this.timeoutActive,
          timeoutTimeLeft: this.timeoutTimeLeft,
          timeoutCallingTeam: this.timeoutCallingTeam,
          midGameSwapSnapshot: this.midGameSwapSnapshot ? JSON.parse(JSON.stringify(this.midGameSwapSnapshot)) : null,
          scores: JSON.parse(JSON.stringify(this.scores))
        })

        this.game++
        this.p1Score = this.carryOverPoints.p1
        this.p2Score = this.carryOverPoints.p2
        this.carryOverPoints = { p1: 0, p2: 0 }
        this.isGameOver = false
        this.pointStarted = false
        this.decidingSwapDone = false

        // Requirement 5 & 6: Cycle sides and initial server (singles)
        this.swappedSides = !this.swappedSides
        this.initialServer = this.initialServer === 1 ? 2 : 1
        this.server = this.initialServer

        // For doubles: automate initial receiver selection for new game
        if (this.currentMatch?.type === 'doubles') {
          // Reset initial indices to ensure sync starts from clean state
          this.p1Top = 0
          this.p1Bot = 1
          this.p2Top = 0
          this.p2Bot = 1

          // Automate receiver selection based on previous game served-to mapping
          this.setDoublesServerForNewGame(
            this.doublesNextServingTeam,
            0,
            this.prevDoublesInitialServer,
            this.prevDoublesInitialReceiver
          )
        }

        // Initialize next game score in proxy
        this.scores[`g${this.game}`] = { p1: this.p1Score, p2: this.p2Score }
      }
    },

    undoNextGame() {
      if (!this.gameHistory || this.gameHistory.length === 0) return

      const prev = this.gameHistory.pop()

      this.game = prev.game
      this.p1Score = prev.p1Score
      this.p2Score = prev.p2Score
      this.initialServer = prev.initialServer
      this.server = prev.server
      this.swappedSides = prev.swappedSides
      this.pointStarted = prev.pointStarted
      this.isGameOver = prev.isGameOver
      this.carryOverPoints = { ...prev.carryOverPoints }
      this.p1Top = prev.p1Top
      this.p1Bot = prev.p1Bot
      this.p2Top = prev.p2Top
      this.p2Bot = prev.p2Bot
      this.decidingSwapDone = prev.decidingSwapDone
      this.midGameSwapPending = prev.midGameSwapPending

      this.doublesInitialServer = { ...prev.doublesInitialServer }
      this.doublesInitialReceiver = { ...prev.doublesInitialReceiver }
      this.prevDoublesInitialServer = prev.prevDoublesInitialServer ? { ...prev.prevDoublesInitialServer } : null
      this.prevDoublesInitialReceiver = prev.prevDoublesInitialReceiver ? { ...prev.prevDoublesInitialReceiver } : null
      this.doublesNextServingTeam = prev.doublesNextServingTeam
      this.timeoutActive = prev.timeoutActive
      this.timeoutTimeLeft = prev.timeoutTimeLeft
      this.timeoutCallingTeam = prev.timeoutCallingTeam
      this.midGameSwapSnapshot = prev.midGameSwapSnapshot ? JSON.parse(JSON.stringify(prev.midGameSwapSnapshot)) : null

      this.scores = JSON.parse(JSON.stringify(prev.scores))

      for (let i = this.game + 1; i <= 7; i++) {
        this.scores[`g${i}`] = { p1: null, p2: null }
      }
      this.syncDoublesQuadrants()
    },

    syncDoublesQuadrants() {
      if (!this.currentMatch || this.currentMatch.type !== 'doubles') return

      const pair = this.doublesCurrentPair
      const t1IsLeft = !this.swappedSides

      // ITTF rules: Server serves diagonally from their right-half court.
      // In our UI grid from umpire perspective:
      // Left side: bottom quadrant (pXBot) is the "Right" half.
      // Right side: top quadrant (pXTop) is the "Right" half.

      if (t1IsLeft) {
        // Team 1 is Left. Active player (server/receiver) must be in p1Bot.
        const t1Active = (pair.server.team === 1) ? pair.server.player : pair.receiver.player
        this.p1Bot = t1Active
        this.p1Top = 1 - t1Active

        // Team 2 is Right. Active player (server/receiver) must be in p2Top.
        const t2Active = (pair.server.team === 2) ? pair.server.player : pair.receiver.player
        this.p2Top = t2Active
        this.p2Bot = 1 - t2Active
      } else {
        // Team 1 is Right. Active player must be in p1Top.
        const t1Active = (pair.server.team === 1) ? pair.server.player : pair.receiver.player
        this.p1Top = t1Active
        this.p1Bot = 1 - t1Active

        // Team 2 is on Left. Active player must be in p2Bot.
        const t2Active = (pair.server.team === 2) ? pair.server.player : pair.receiver.player
        this.p2Bot = t2Active
        this.p2Top = 1 - t2Active
      }
    },

    // Manual overrides for UI (Setup & Umpire corrections)
    // Decouples the physical quadrants from the logical S/R state so UI doesn't jump

    calibrateServeStateFromUI(servingSide) {
      if (!this.currentMatch) return

      const leftTeam = this.swappedSides ? 2 : 1
      const rightTeam = this.swappedSides ? 1 : 2

      const serverTeamNum = servingSide === 'left' ? leftTeam : rightTeam

      if (this.currentMatch.type === 'singles') {
        this.setServer(serverTeamNum)
        return
      }

      // Doubles active UI slots:
      const leftActiveIdx = leftTeam === 1 ? this.p1Bot : this.p2Bot
      const rightActiveIdx = rightTeam === 1 ? this.p1Top : this.p2Top

      let serverPlayerIdx, receiverPlayerIdx
      if (servingSide === 'left') {
        serverPlayerIdx = leftActiveIdx
        receiverPlayerIdx = rightActiveIdx
      } else {
        serverPlayerIdx = rightActiveIdx
        receiverPlayerIdx = leftActiveIdx
      }

      const total = this.p1Score + this.p2Score
      let servesPassed = (this.p1Score >= 10 && this.p2Score >= 10)
        ? 10 + (total - 20) : Math.floor(total / 2)
      const cyclePos = servesPassed % 4

      const desiredS = { team: serverTeamNum, player: serverPlayerIdx }
      const desiredR = { team: serverTeamNum === 1 ? 2 : 1, player: receiverPlayerIdx }
      const partnerS = { team: desiredS.team, player: 1 - desiredS.player }
      const partnerR = { team: desiredR.team, player: 1 - desiredR.player }

      let A, X
      if (cyclePos === 0) { A = desiredS; X = desiredR; }
      else if (cyclePos === 1) { X = desiredS; A = partnerR; }
      else if (cyclePos === 2) { A = partnerS; X = partnerR; }
      else if (cyclePos === 3) { X = partnerS; A = desiredR; }

      this.doublesInitialServer = A
      this.doublesInitialReceiver = X
    },

    toggleSwapSides() {
      // Remember which visual side was serving
      const wasLeftServing = this.currentMatch?.type === 'doubles'
        ? this.isLeftDoublesServer
        : this.isLeftServer

      this.swappedSides = !this.swappedSides

      // Keep serving on the same visual side by calibrating state to match UI
      this.calibrateServeStateFromUI(wasLeftServing ? 'left' : 'right')
    },

    // Doubles only: swap which player is top vs bottom on the LEFT side (team1)
    swapLeftPlayers() {
      if (this.currentMatch?.type !== 'doubles') return
      const teamNum = this.swappedSides ? 2 : 1
      this.swapPlayerOnTeam(teamNum)
    },

    // Doubles only: swap which player is top vs bottom on the RIGHT side (team2)
    swapRightPlayers() {
      if (this.currentMatch?.type !== 'doubles') return
      const teamNum = this.swappedSides ? 1 : 2
      this.swapPlayerOnTeam(teamNum)
    },

    // Helper for manual quadrant corrections: toggles player indices and re-calibrates rotation
    swapPlayerOnTeam(teamNum) {
      const pair = this.doublesCurrentPair
      const isServerTeam = pair.server.team === teamNum
      const currentPlayerIdx = isServerTeam ? pair.server.player : pair.receiver.player
      const nextPlayerIdx = 1 - currentPlayerIdx

      if (isServerTeam) {
        // At start of game (before play), swap server triggers mandatory receiver recalibration
        const isStartOfGame = this.p1Score === 0 && this.p2Score === 0
        if (isStartOfGame && this.game > 1 && this.prevDoublesInitialServer) {
          this.setDoublesServerForNewGame(
            teamNum,
            nextPlayerIdx,
            this.prevDoublesInitialServer,
            this.prevDoublesInitialReceiver
          )
        } else {
          this.setDoublesServer(teamNum, nextPlayerIdx)
        }
      } else {
        // Calibrate rotation so the partner becomes the receiver instead
        if (teamNum === this.doublesInitialReceiver.team) {
          this.doublesInitialReceiver.player = 1 - this.doublesInitialReceiver.player
        } else {
          this.doublesInitialServer.player = 1 - this.doublesInitialServer.player
        }
        this.syncDoublesQuadrants()
      }
    },

    setServer(s) {
      this.server = s
      // Calibrate initialServer based on current serve rotation parity,
      // so future auto-rotation (every 2 pts) continues correctly from s.
      const totalPoints = this.p1Score + this.p2Score
      let servesPassed = 0
      if (this.p1Score >= 10 && this.p2Score >= 10) {
        servesPassed = 10 + Math.max(0, totalPoints - 20)
      } else {
        servesPassed = Math.floor(totalPoints / 2)
      }
      // handleScore computes: even servesPassed → initialServer, odd → opposite.
      // Working backwards: if we want server = s now...
      if (servesPassed % 2 === 0) {
        this.initialServer = s // at even, initialServer IS the server
      } else {
        this.initialServer = s === 1 ? 2 : 1 // at odd, initialServer is the OTHER player
      }
    },

    // Doubles umpire correction: set a specific player as server right now.
    // Recalibrates doublesInitialServer/Receiver so the formula produces this
    // player as server at the CURRENT score.
    setDoublesServer(serverTeam, serverPlayerIdx) {
      const total = this.p1Score + this.p2Score
      let servesPassed
      if (this.p1Score >= 10 && this.p2Score >= 10) {
        servesPassed = 10 + (total - 20)
      } else {
        servesPassed = Math.floor(total / 2)
      }
      const cyclePos = servesPassed % 4

      // The desired server at cyclePos. We need to find doublesInitialServer such that
      // cycle[cyclePos].server === { team: serverTeam, player: serverPlayerIdx }.
      //
      // The cycle relative to A (initial server) and X (initial receiver):
      // pos 0: server=A  pos 1: server=X  pos 2: server=B(partner of A)  pos 3: server=Y(partner of X)
      //
      // Working backwards from cyclePos to what A and X must be:
      const desired = { team: serverTeam, player: serverPlayerIdx }
      const partnerOfDesired = { team: serverTeam, player: 1 - serverPlayerIdx }

      // Other team
      const otherTeam = serverTeam === 1 ? 2 : 1
      // The receiver at cyclePos is determined by the cycle:
      // pos 0: receiver=X  pos 1: receiver=B  pos 2: receiver=Y  pos 3: receiver=A
      // So X's team and partner relationships:
      let newInitialServer, newInitialReceiver

      switch (cyclePos) {
        case 0:
          // server=A=desired, receiver=X (other team, we don't know which player; keep current receiver player)
          newInitialServer = desired
          newInitialReceiver = {
            team: otherTeam, player: this.doublesInitialReceiver.team === otherTeam
              ? this.doublesInitialReceiver.player : 0
          }
          break
        case 1:
          // server=X=desired → A is on other team, B=partner of A
          // receiver=B → B's team is A's team = otherTeam → partner of A
          // X=desired, so X.team=serverTeam. A's team=otherTeam.
          newInitialReceiver = desired  // X is initial receiver
          newInitialServer = {
            team: otherTeam, player: this.doublesInitialServer.team === otherTeam
              ? this.doublesInitialServer.player : 0
          }
          break
        case 2:
          // server=B=desired → B is partner of A → A=partnerOfDesired (same team)
          newInitialServer = partnerOfDesired
          newInitialReceiver = {
            team: otherTeam, player: this.doublesInitialReceiver.team === otherTeam
              ? this.doublesInitialReceiver.player : 0
          }
          break
        case 3:
          // server=Y=desired → Y is partner of X → X=partnerOfDesired (same team)
          newInitialReceiver = partnerOfDesired  // X = partner of Y
          newInitialServer = {
            team: otherTeam, player: this.doublesInitialServer.team === otherTeam
              ? this.doublesInitialServer.player : 0
          }
          break
      }
      this.doublesInitialServer = newInitialServer
      this.doublesInitialReceiver = newInitialReceiver
      this.syncDoublesQuadrants()
    },

    // Changes which team is serving without changing any player's quadrant position.
    // The player currently in the right-half court of the new serving team becomes the server.
    // The player currently in the right-half court of the new receiving team becomes the receiver.
    changeServingTeamTo(teamNum) {
      if (this.currentMatch?.type !== 'doubles') return

      const pair = this.doublesCurrentPair
      if (pair.server.team === teamNum) return // already serving

      const t1IsLeft = !this.swappedSides
      const t1Active = t1IsLeft ? this.p1Bot : this.p1Top
      const t2Active = t1IsLeft ? this.p2Top : this.p2Bot

      const newServerPlayerIdx = teamNum === 1 ? t1Active : t2Active
      const newReceiverPlayerIdx = teamNum === 1 ? t2Active : t1Active

      const total = this.p1Score + this.p2Score
      let servesPassed = (this.p1Score >= 10 && this.p2Score >= 10)
        ? 10 + (total - 20)
        : Math.floor(total / 2)
      const cyclePos = servesPassed % 4

      const desiredS = { team: teamNum, player: newServerPlayerIdx }
      const desiredR = { team: teamNum === 1 ? 2 : 1, player: newReceiverPlayerIdx }

      const partnerS = { team: desiredS.team, player: 1 - desiredS.player }
      const partnerR = { team: desiredR.team, player: 1 - desiredR.player }

      let A, X
      if (cyclePos === 0) {
        A = desiredS; X = desiredR;
      } else if (cyclePos === 1) {
        X = desiredS; A = partnerR;
      } else if (cyclePos === 2) {
        A = partnerS; X = partnerR;
      } else if (cyclePos === 3) {
        X = partnerS; A = desiredR;
      }

      this.doublesInitialServer = A
      this.doublesInitialReceiver = X
      this.syncDoublesQuadrants()
    },

    // Called at the START of a new game once the serving team has chosen their server.
    // serverTeam: 1 or 2 (which team is serving first this game)
    // serverPlayerIdx: 0 or 1 (which player on that team serves first)
    //
    // The mandatory receiver is determined by the PREVIOUS game's rotation:
    // "the player who served TO the chosen server in the previous game" becomes the receiver.
    // We use prevInitialServer/Receiver (passed in) to look this up.
    setDoublesServerForNewGame(serverTeam, serverPlayerIdx, prevInitialServer, prevInitialReceiver) {
      const newServer = { team: serverTeam, player: serverPlayerIdx }
      const otherTeam = serverTeam === 1 ? 2 : 1

      // Build the previous game's full cycle to find "who served to newServer"
      const A = prevInitialServer
      const X = prevInitialReceiver
      const B = { team: A.team, player: 1 - A.player }
      const Y = { team: X.team, player: 1 - X.player }

      // "Served to" mapping: A→X, X→B, B→Y, Y→A
      // Find which player's "served to" target matches newServer
      const servedToMap = [
        { from: A, to: X },
        { from: X, to: B },
        { from: B, to: Y },
        { from: Y, to: A },
      ]

      let mandatoryReceiver = null
      for (const entry of servedToMap) {
        if (entry.to.team === newServer.team && entry.to.player === newServer.player) {
          // The player who served TO newServer is entry.from — they must receive
          mandatoryReceiver = entry.from
          break
        }
      }

      // Fallback: if newServer wasn't in prev cycle (e.g. game 1 fresh start), default
      if (!mandatoryReceiver) {
        mandatoryReceiver = { team: otherTeam, player: 0 }
      }

      this.doublesInitialServer = newServer
      this.doublesInitialReceiver = mandatoryReceiver
      this.syncDoublesQuadrants()
    },

    applyMidGameSwap() {
      // Create snapshot to fully revert if score falls below 5
      this.midGameSwapSnapshot = {
        swappedSides: this.swappedSides,
        p1Top: this.p1Top,
        p1Bot: this.p1Bot,
        p2Top: this.p2Top,
        p2Bot: this.p2Bot,
        doublesInitialServer: { ...this.doublesInitialServer },
        doublesInitialReceiver: { ...this.doublesInitialReceiver },
        server: this.server,
        initialServer: this.initialServer
      }

      this.swappedSides = !this.swappedSides

      if (this.currentMatch?.type === 'doubles') {
        const pair = this.doublesCurrentPair
        const recTeamAtWait = pair.receiver.team

        if (recTeamAtWait === this.doublesInitialReceiver.team) {
          this.doublesInitialReceiver.player = 1 - this.doublesInitialReceiver.player
        } else {
          this.doublesInitialServer.player = 1 - this.doublesInitialServer.player
        }
      }
      this.syncDoublesQuadrants()
      this.midGameSwapPending = false
      this.decidingSwapDone = true
    },

    revertMidGameSwap() {
      if (!this.midGameSwapSnapshot) return

      this.swappedSides = this.midGameSwapSnapshot.swappedSides
      this.p1Top = this.midGameSwapSnapshot.p1Top
      this.p1Bot = this.midGameSwapSnapshot.p1Bot
      this.p2Top = this.midGameSwapSnapshot.p2Top
      this.p2Bot = this.midGameSwapSnapshot.p2Bot
      this.doublesInitialServer = { ...this.midGameSwapSnapshot.doublesInitialServer }
      this.doublesInitialReceiver = { ...this.midGameSwapSnapshot.doublesInitialReceiver }
      this.server = this.midGameSwapSnapshot.server
      this.initialServer = this.midGameSwapSnapshot.initialServer

      this.decidingSwapDone = false
      this.midGameSwapPending = false
      this.midGameSwapSnapshot = null
      this.syncDoublesQuadrants()
    },

    startTimer(callback) {
      this.timerActive = true
      this.timeLeft = 120
      const interval = setInterval(() => {
        if (this.timeLeft > 0) {
          this.timeLeft--
        } else {
          clearInterval(interval)
          if (callback) callback()
        }
      }, 1000)
    },

    startPoint() {
      this.isStarted = true
      this.pointStarted = true
    },

    handleScore(player, delta) {
      if (!this.isStarted || (!this.pointStarted && delta > 0)) return

      if (delta < 0) {
        const playerScore = player === 1 ? this.p1Score : this.p2Score
        if (playerScore === 0 && this.game > 1 && this.gameHistory && this.gameHistory.length > 0) {
          const prev = this.gameHistory[this.gameHistory.length - 1]
          if (this.p1Score <= prev.carryOverPoints.p1 && this.p2Score <= prev.carryOverPoints.p2) {
            this.undoNextGame()
            this.handleScore(player, delta)
            return
          }
        }
      }

      if (player === 1) {
        this.p1Score = Math.max(0, this.p1Score + delta)
      } else {
        this.p2Score = Math.max(0, this.p2Score + delta)
      }

      // Update current game score proxy
      this.scores[`g${this.game}`] = { p1: this.p1Score, p2: this.p2Score }

      // Recalculate Server (singles only — doubles uses getter-based formula)
      if (this.currentMatch?.type !== 'doubles') {
        const totalPoints = this.p1Score + this.p2Score
        let servesPassed = 0
        if (this.p1Score >= 10 && this.p2Score >= 10) {
          servesPassed = 10 + Math.max(0, totalPoints - 20)
        } else {
          servesPassed = Math.floor(totalPoints / 2)
        }
        if (servesPassed % 2 === 0) {
          this.server = this.initialServer
        } else {
          this.server = this.initialServer === 1 ? 2 : 1
        }
      }

      // Check Game End
      this.isGameOver = false
      if (
        (this.p1Score >= 11 || this.p2Score >= 11) &&
        Math.abs(this.p1Score - this.p2Score) >= 2
      ) {
        this.isGameOver = true
      }

      if (delta > 0) {
        this.pointStarted = false
      } else if (delta < 0 && this.p1Score < 11 && this.p2Score < 11) {
        this.isGameOver = false
        this.pointStarted = false
      }

      // Deciding-game mid-game side swap: triggers when first team reaches 5 points
      const isDecidingGame = this.game === (this.currentMatch?.bestOf ?? 5)

      if (delta < 0 && isDecidingGame && this.p1Score < 5 && this.p2Score < 5) {
        if (this.midGameSwapPending) {
          this.midGameSwapPending = false
        } else if (this.decidingSwapDone && this.midGameSwapSnapshot) {
          this.revertMidGameSwap()
        }
      }

      if (delta > 0 && isDecidingGame && !this.decidingSwapDone && (this.p1Score >= 5 || this.p2Score >= 5)) {
        this.midGameSwapPending = true
      }
      // Apply quadrant updates if scores changed
      this.syncDoublesQuadrants()
    },

    applyPenaltyPoints(scoringTeamNum, points) {
      if (!this.currentMatch) return

      for (let i = 0; i < points; i++) {
        if (this.isGameOver) {
          if (scoringTeamNum === 1) this.carryOverPoints.p1 += 1
          else this.carryOverPoints.p2 += 1
        } else {
          if (scoringTeamNum === 1) this.p1Score += 1
          else this.p2Score += 1

          // Check if the current addition triggers game over
          if ((this.p1Score >= 11 || this.p2Score >= 11) && Math.abs(this.p1Score - this.p2Score) >= 2) {
            this.isGameOver = true
          }
        }
      }

      // Update current game proxy
      this.scores[`g${this.game}`] = { p1: this.p1Score, p2: this.p2Score }

      // Update singles server rotation
      if (this.currentMatch?.type !== 'doubles') {
        const totalPoints = this.p1Score + this.p2Score
        let servesPassed = 0
        if (this.p1Score >= 10 && this.p2Score >= 10) {
          servesPassed = 10 + Math.max(0, totalPoints - 20)
        } else {
          servesPassed = Math.floor(totalPoints / 2)
        }
        this.server = (servesPassed % 2 === 0) ? this.initialServer : (this.initialServer === 1 ? 2 : 1)
      }

      const isDecidingGame = this.game === (this.currentMatch?.bestOf ?? 5)

      if (isDecidingGame && !this.decidingSwapDone && (this.p1Score >= 5 || this.p2Score >= 5)) {
        this.midGameSwapPending = true
      }
      this.syncDoublesQuadrants()
    },

    revertPenaltyPoints(scoringTeamNum, points) {
      if (!this.currentMatch) return

      const availableInCurrent = scoringTeamNum === 1
        ? (this.carryOverPoints.p1 + this.p1Score)
        : (this.carryOverPoints.p2 + this.p2Score)

      let canUndo = false
      if (this.game > 1 && this.gameHistory && this.gameHistory.length > 0) {
        const prev = this.gameHistory[this.gameHistory.length - 1]
        if (this.p1Score <= prev.carryOverPoints.p1 && this.p2Score <= prev.carryOverPoints.p2) {
          canUndo = true
        }
      }

      if (availableInCurrent < points && canUndo) {
        this.undoNextGame()
        this.revertPenaltyPoints(scoringTeamNum, points)
        return
      }

      for (let i = 0; i < points; i++) {
        const carry = scoringTeamNum === 1 ? this.carryOverPoints.p1 : this.carryOverPoints.p2
        if (carry > 0) {
          if (scoringTeamNum === 1) this.carryOverPoints.p1 -= 1
          else this.carryOverPoints.p2 -= 1
        } else {
          if (scoringTeamNum === 1) {
            if (this.p1Score > 0) this.p1Score -= 1
          } else {
            if (this.p2Score > 0) this.p2Score -= 1
          }
          // If reversing brought us below win threshold, clear isGameOver
          if (this.isGameOver) {
            if (!(this.p1Score >= 11 || this.p2Score >= 11) || Math.abs(this.p1Score - this.p2Score) < 2) {
              this.isGameOver = false
            }
          }
        }
      }

      // Update proxy map
      if (!this.isGameOver) {
        this.pointStarted = false
      }
      this.scores[`g${this.game}`] = { p1: this.p1Score, p2: this.p2Score }

      // Update singles server rotation
      if (this.currentMatch?.type !== 'doubles') {
        const totalPoints = this.p1Score + this.p2Score
        let servesPassed = 0
        if (this.p1Score >= 10 && this.p2Score >= 10) {
          servesPassed = 10 + Math.max(0, totalPoints - 20)
        } else {
          servesPassed = Math.floor(totalPoints / 2)
        }
        this.server = (servesPassed % 2 === 0) ? this.initialServer : (this.initialServer === 1 ? 2 : 1)
      }

      const isDecidingGame = this.game === (this.currentMatch?.bestOf ?? 5)
      if (isDecidingGame && this.p1Score < 5 && this.p2Score < 5) {
        if (this.midGameSwapPending) {
          this.midGameSwapPending = false
        } else if (this.decidingSwapDone && this.midGameSwapSnapshot) {
          this.revertMidGameSwap()
        }
      }

      this.syncDoublesQuadrants()
    },

    issueCard(teamNum, type, target = 'player') {
      const arr = target === 'coach' ? this[`team${teamNum}CoachCards`] : this[`team${teamNum}Cards`]

      if (target === 'player') {
        if (type === 'Yellow' && arr.length !== 0) return false
        if (type === 'YR1' && (arr.length !== 1 || arr[0] !== 'Yellow')) return false
        if (type === 'YR2' && (arr.length !== 2 || arr[1] !== 'YR1')) return false
      } else if (target === 'coach') {
        if (type === 'Yellow' && arr.length !== 0) return false
        if (type === 'Red' && (arr.length !== 1 || arr[0] !== 'Yellow')) return false
      } else {
        return false
      }

      arr.push(type)

      // Award penalty points for YR1 and YR2
      if (target === 'player') {
        const opponent = teamNum === 1 ? 2 : 1
        if (type === 'YR1') {
          this.applyPenaltyPoints(opponent, 1)
        } else if (type === 'YR2') {
          this.applyPenaltyPoints(opponent, 2)
        }
      }

      return true
    },

    revertLastCard(teamNum, target = 'player') {
      const arr = target === 'coach' ? this[`team${teamNum}CoachCards`] : this[`team${teamNum}Cards`]
      if (arr.length > 0) {
        const popped = arr.pop()

        // Revert penalty points if applicable
        if (target === 'player') {
          const opponent = teamNum === 1 ? 2 : 1
          if (popped === 'YR1') {
            this.revertPenaltyPoints(opponent, 1)
          } else if (popped === 'YR2') {
            this.revertPenaltyPoints(opponent, 2)
          }
        }
      }
    },

    issueTimeout(teamNum) {
      if (this.pointStarted || this.timerActive || this.timeoutActive) return false
      const used = teamNum === 1 ? this.team1Timeout : this.team2Timeout
      if (used) return false

      this.timeoutActive = true
      this.timeoutTimeLeft = 60
      this.timeoutCallingTeam = teamNum
      if (teamNum === 1) this.team1Timeout = true
      else this.team2Timeout = true

      if (this.timeoutInterval) clearInterval(this.timeoutInterval)
      this.timeoutInterval = setInterval(() => {
        if (this.timeoutTimeLeft > 0) {
          this.timeoutTimeLeft--
        } else {
          clearInterval(this.timeoutInterval)
          this.timeoutInterval = null
        }
      }, 1000)
      return true
    },

    revertTimeout(teamNum) {
      if (teamNum === 1) this.team1Timeout = false
      else this.team2Timeout = false

      if (this.timeoutCallingTeam === teamNum) {
        if (this.timeoutInterval) {
          clearInterval(this.timeoutInterval)
          this.timeoutInterval = null
        }
        this.timeoutActive = false
        this.timeoutTimeLeft = 60
        this.timeoutCallingTeam = null
      }
    },

    dismissTimeout() {
      this.timeoutActive = false
    },
  },
})
