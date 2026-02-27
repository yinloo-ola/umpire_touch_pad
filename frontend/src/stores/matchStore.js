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

    // Warmup timer
    timerActive: false,
    timeLeft: 120, // seconds
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
  },

  actions: {
    selectMatch(match) {
      this.currentMatch = match
      this.resetMatchState()
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
      this.timerActive = false
      this.timeLeft = 120
    },

    nextGame() {
      if (this.isGameOver && this.game < (this.currentMatch?.bestOf || 7)) {
        this.game++
        this.p1Score = 0
        this.p2Score = 0
        this.isGameOver = false
        this.pointStarted = false

        // Requirement 5 & 6: Cycle sides and initial server
        // G1: idServer=1, swap=false
        // G2: idServer=2, swap=true
        this.swappedSides = this.game % 2 === 0
        this.initialServer = this.game % 2 === 0 ? 2 : 1
        this.server = this.initialServer

        // Initialize next game score in proxy
        this.scores[`g${this.game}`] = { p1: 0, p2: 0 }
      }
    },

    toggleSwapSides() {
      this.swappedSides = !this.swappedSides
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

      if (player === 1) {
        this.p1Score = Math.max(0, this.p1Score + delta)
      } else {
        this.p2Score = Math.max(0, this.p2Score + delta)
      }

      // Update current game score proxy
      this.scores[`g${this.game}`] = { p1: this.p1Score, p2: this.p2Score }

      // Recalculate Server
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
    },
  },
})
