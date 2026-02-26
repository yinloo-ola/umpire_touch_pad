// --- Mock Data ---
const matches = [
  {
    type: 'singles', // 'singles' or 'doubles'
    event: "Men's Singles",
    time: "09:00",
    bestOf: 5,
    team1: [{ name: "JEOUNG Youngsik", country: "KOR" }],
    team2: [{ name: "SAMSONOV Vladimir", country: "BLR" }]
  },
  {
    type: 'doubles',
    event: "Men's Doubles",
    time: "09:00",
    bestOf: 5,
    team1: [{ name: "HU Heming", country: "AUS" }, { name: "YAN Xin", country: "AUS" }],
    team2: [{ name: "NUYTINCK Cedric", country: "BEL" }, { name: "DYJAS Jakub", country: "POL" }]
  },
  {
    type: 'singles',
    event: "Men's Singles",
    time: "09:00",
    bestOf: 5,
    team1: [{ name: "CHUANG Chih-Yuan", country: "TPE" }],
    team2: [{ name: "FREITAS Marcos", country: "POR" }]
  },
  {
    type: 'doubles',
    event: "Men's Doubles",
    time: "09:00",
    bestOf: 5,
    team1: [{ name: "ALTO Gaston", country: "ARG" }, { name: "CIFUENTES Horacio", country: "ARG" }],
    team2: [{ name: "POWELL David", country: "AUS" }, { name: "TOWNSEND Kane", country: "AUS" }]
  }
];

// --- State ---
let currentMatch = null;
let matchState = {
  p1Score: 0,
  p2Score: 0,
  game: 1,
  scores: {
    g1: { p1: 0, p2: 0 },
    g2: { p1: null, p2: null },
    g3: { p1: null, p2: null },
    g4: { p1: null, p2: null },
    g5: { p1: null, p2: null }
  },
  server: 1, // 1 or 2
  isStarted: false,
  swappedSides: false // Track if players are physically swapped on screen
};

// --- DOM Elements ---
const matchListView = document.getElementById('match-list-view');
const touchpadView = document.getElementById('touchpad-view');
const setupView = document.getElementById('setup-view');
const matchConfirmModal = document.getElementById('match-confirm-modal');
const warmupConfirmModal = document.getElementById('warmup-confirm-modal');
const warmupTimerOverlay = document.getElementById('warmup-timer-overlay');
const matchTableBody = document.getElementById('match-table-body');
const backBtn = document.querySelector('.back-btn');

let warmupInterval = null;

// --- Initialization ---
function init() {
  renderMatchList();
  setupEventListeners();
  updateTime();
  setInterval(updateTime, 60000);
}

// --- Match List Rendering ---
function renderMatchList() {
  matchTableBody.innerHTML = '';
  matches.forEach((match, index) => {
    const tr = document.createElement('tr');
    tr.dataset.index = index;

    // Formatting players
    let p1HTML = '';
    let p2HTML = '';

    if (match.type === 'singles') {
      p1HTML = `<span class="player-name-main">${match.team1[0].name}</span> <span class="country-code">${match.team1[0].country}</span>`;
      p2HTML = `<span class="player-name-main">${match.team2[0].name}</span> <span class="country-code">${match.team2[0].country}</span>`;
    } else {
      p1HTML = `<div class="doubles-cell">
                  <div><span class="player-name-main">${match.team1[0].name}</span> <span class="country-code">${match.team1[0].country}</span></div>
                  <div><span class="player-name-main">${match.team1[1].name}</span> <span class="country-code">${match.team1[1].country}</span></div>
                </div>`;
      p2HTML = `<div class="doubles-cell">
                  <div><span class="player-name-main">${match.team2[0].name}</span> <span class="country-code">${match.team2[0].country}</span></div>
                  <div><span class="player-name-main">${match.team2[1].name}</span> <span class="country-code">${match.team2[1].country}</span></div>
                </div>`;
    }

    tr.innerHTML = `
      <td>${match.event}</td>
      <td>${match.time}</td>
      <td>${p1HTML}</td>
      <td>${p2HTML}</td>
      <td><strong>${match.bestOf}</strong></td>
    `;

    tr.addEventListener('click', () => openMatchConfirm(index));
    matchTableBody.appendChild(tr);
  });
}

// --- Match Confirmation ---
function openMatchConfirm(index) {
  const match = matches[index];
  currentMatch = match;

  const body = document.getElementById('confirm-match-body');
  let p1HTML = '';
  let p2HTML = '';

  if (match.type === 'singles') {
    p1HTML = `<strong>${match.team1[0].name}</strong> ${match.team1[0].country}`;
    p2HTML = `<strong>${match.team2[0].name}</strong> ${match.team2[0].country}`;
  } else {
    p1HTML = `<div>${match.team1[0].name}</div><div>${match.team1[1].name}</div>`;
    p2HTML = `<div>${match.team2[0].name}</div><div>${match.team2[1].name}</div>`;
  }

  body.innerHTML = `
    <tr>
      <td>${match.event}</td>
      <td>${match.time}</td>
      <td>${p1HTML}</td>
      <td>${p2HTML}</td>
      <td><strong>${match.bestOf}</strong></td>
    </tr>
  `;

  matchConfirmModal.classList.remove('hidden');
}

function closeMatchConfirm() {
  matchConfirmModal.classList.add('hidden');
}

// --- Navigation ---
function openSetupView() {
  closeMatchConfirm();
  resetMatchState();

  const match = currentMatch;
  const p1Name = match.type === 'singles' ? match.team1[0].name : `${match.team1[0].name} / ${match.team1[1].name.split(' ')[0]}`;
  const p2Name = match.type === 'singles' ? match.team2[0].name : `${match.team2[0].name} / ${match.team2[1].name.split(' ')[0]}`;

  document.getElementById('setup-p1-name').textContent = p1Name;
  document.getElementById('setup-p2-name').textContent = p2Name;
  document.getElementById('setup-bestof').textContent = `Best of ${match.bestOf}`;

  // Reset setup UI
  matchState.swappedSides = false;
  matchState.server = 1;
  updateSetupUI();

  // Transition
  matchListView.classList.remove('active');
  setTimeout(() => {
    matchListView.classList.add('hidden');
    setupView.classList.remove('hidden');
    setTimeout(() => {
      setupView.classList.add('active');
    }, 50);
  }, 400);
}

function updateSetupUI() {
  const quadTL = document.getElementById('quad-tl');
  const quadTR = document.getElementById('quad-tr');
  const quadBL = document.getElementById('quad-bl');
  const quadBR = document.getElementById('quad-br');
  const leftServe = document.getElementById('setup-left-serve');
  const rightServe = document.getElementById('setup-right-serve');
  const p1Slot = document.getElementById('setup-p1-slot');
  const p2Slot = document.getElementById('setup-p2-slot');

  // Move player slots to appropriate quadrants (appendChild automatically handles removal from current parent)

  // Reset names from match data in case they changed (though they usually don't here)
  const match = currentMatch;
  const p1Name = match.type === 'singles' ? match.team1[0].name : `${match.team1[0].name} / ${match.team1[1].name.split(' ')[0]}`;
  const p2Name = match.type === 'singles' ? match.team2[0].name : `${match.team2[0].name} / ${match.team2[1].name.split(' ')[0]}`;
  document.getElementById('setup-p1-name').textContent = p1Name;
  document.getElementById('setup-p2-name').textContent = p2Name;
  document.querySelector('#setup-p1-slot .p-country').textContent = match.team1[0].country;
  document.querySelector('#setup-p2-slot .p-country').textContent = match.team2[0].country;

  // Diagonal placement
  if (!matchState.swappedSides) {
    // P1 Left (Bottom), P2 Right (Top)
    quadBL.appendChild(p1Slot);
    quadTR.appendChild(p2Slot);
  } else {
    // P1 Right (Top), P2 Left (Bottom)
    quadTR.appendChild(p1Slot);
    quadBL.appendChild(p2Slot);
  }

  // Serve Indicator
  // If matchState.swappedSides is false: Left is P1 (server=1), Right is P2 (server=2)
  // If matchState.swappedSides is true: Left is P2 (server=2), Right is P1 (server=1)
  const isLeftServer = (!matchState.swappedSides && matchState.server === 1) || (matchState.swappedSides && matchState.server === 2);

  if (isLeftServer) {
    leftServe.classList.add('active');
    rightServe.classList.remove('active');
    leftServe.querySelector('.s-circle').textContent = 'S';
    leftServe.querySelector('.s-tag').textContent = 'Server';
    rightServe.querySelector('.s-circle').textContent = 'R';
    rightServe.querySelector('.s-tag').textContent = 'Receiver';
  } else {
    leftServe.classList.remove('active');
    rightServe.classList.add('active');
    leftServe.querySelector('.s-circle').textContent = 'R';
    leftServe.querySelector('.s-tag').textContent = 'Receiver';
    rightServe.querySelector('.s-circle').textContent = 'S';
    rightServe.querySelector('.s-tag').textContent = 'Server';
  }
}

function openTouchpad() {
  const match = currentMatch;
  matchState.initialServer = matchState.server; // Sync initial server for match logic

  // Populate names (using primary player for doubles for simplicity right now, or combine them)
  const p1Name = match.type === 'singles' ? match.team1[0].name : `${match.team1[0].name} / ${match.team1[1].name.split(' ')[0]}`;
  const p2Name = match.type === 'singles' ? match.team2[0].name : `${match.team2[0].name} / ${match.team2[1].name.split(' ')[0]}`;
  const p1Country = match.team1[0].country;
  const p2Country = match.team2[0].country;

  document.getElementById('tp-player1-name').textContent = p1Name;
  document.getElementById('tp-player1-country').textContent = p1Country;
  document.getElementById('tp-player2-name').textContent = p2Name;
  document.getElementById('tp-player2-country').textContent = p2Country;

  // We no longer have side-p1-name or side-p2-name in the new HTML layout.

  updateUI();

  // Transition
  setupView.classList.remove('active');
  warmupTimerOverlay.classList.add('hidden');
  setTimeout(() => {
    setupView.classList.add('hidden');
    touchpadView.classList.remove('hidden');
    setTimeout(() => {
      touchpadView.classList.add('active');
    }, 50);
  }, 400);
}

function closeTouchpad() {
  touchpadView.classList.remove('active');
  setTimeout(() => {
    touchpadView.classList.add('hidden');
    matchListView.classList.remove('hidden');
    setTimeout(() => {
      matchListView.classList.add('active');
    }, 50);
  }, 400);
}

// --- Scoring Logic & Utilities ---
function resetMatchState() {
  matchState = {
    p1Score: 0,
    p2Score: 0,
    game: 1,
    scores: {
      g1: { p1: 0, p2: 0 },
      g2: { p1: null, p2: null },
      g3: { p1: null, p2: null },
      g4: { p1: null, p2: null },
      g5: { p1: null, p2: null }
    },
    initialServer: 1, // original starting server for the current game
    server: 1, // current point server
    isStarted: false,
    swappedSides: false,
    pointStarted: false // Tracks if play has commenced for the current point
  };

  // Reset view visibility
  document.getElementById('main-status-box').style.background = '#006b3c';
  document.getElementById('status-text').classList.remove('hidden');
  document.getElementById('status-text').textContent = 'Start Of Play';
  document.getElementById('table-player-grid').classList.add('hidden');

  // Disable score buttons initially
  toggleScoreButtons(true);
}

function toggleScoreButtons(disabled) {
  document.getElementById('p1-plus').disabled = disabled;
  document.getElementById('p2-plus').disabled = disabled;
}

function updateUI() {
  // Update Live Score Variables
  const p1Score = matchState.p1Score;
  const p2Score = matchState.p2Score;

  let p1GamesWon = 0;
  let p2GamesWon = 0;
  for (let i = 1; i < matchState.game; i++) {
    const s = matchState.scores[`g${i}`];
    if (s && s.p1 !== null) {
      if (s.p1 > s.p2) p1GamesWon++; else p2GamesWon++;
    }
  }

  const leftPoints = matchState.swappedSides ? p2Score : p1Score;
  const rightPoints = matchState.swappedSides ? p1Score : p2Score;
  const leftGames = matchState.swappedSides ? p2GamesWon : p1GamesWon;
  const rightGames = matchState.swappedSides ? p1GamesWon : p2GamesWon;

  document.getElementById('ls-p1').textContent = leftPoints;
  document.getElementById('ls-p2').textContent = rightPoints;
  document.getElementById('tp-p1-games').textContent = leftGames;
  document.getElementById('tp-p2-games').textContent = rightGames;

  // Update Summary Table (Top)
  for (let i = 1; i <= 5; i++) {
    const key = `g${i}`;
    const p1El = document.getElementById(`p1-${key}`);
    const p2El = document.getElementById(`p2-${key}`);

    if (matchState.scores[key].p1 !== null) {
      let s1 = matchState.scores[key].p1;
      let s2 = matchState.scores[key].p2;
      if (i === matchState.game) {
        s1 = matchState.p1Score;
        s2 = matchState.p2Score;
      }
      p1El.textContent = s1;
      p2El.textContent = s2;
    } else {
      p1El.textContent = '';
      p2El.textContent = '';
    }

    if (i === matchState.game) {
      p1El.classList.add('active-game');
      p2El.classList.add('active-game');
    } else {
      p1El.classList.remove('active-game');
      p2El.classList.remove('active-game');
    }
  }

  // Update Serve Indicators (Diagonal Top Corners)
  const p1ServeTp = document.getElementById('p1-serve-tp');
  const p2ServeTp = document.getElementById('p2-serve-tp');
  const isLeftServer = (!matchState.swappedSides && matchState.server === 1) || (matchState.swappedSides && matchState.server === 2);

  if (isLeftServer) {
    p1ServeTp.classList.add('active');
    p2ServeTp.classList.remove('active');
    p1ServeTp.querySelector('.s-circle-tp').textContent = 'S';
    p1ServeTp.querySelector('.s-label-tp').textContent = 'Server';
    p2ServeTp.querySelector('.s-circle-tp').textContent = 'R';
    p2ServeTp.querySelector('.s-label-tp').textContent = 'Receiver';
  } else {
    p1ServeTp.classList.remove('active');
    p2ServeTp.classList.add('active');
    p1ServeTp.querySelector('.s-circle-tp').textContent = 'R';
    p1ServeTp.querySelector('.s-label-tp').textContent = 'Receiver';
    p2ServeTp.querySelector('.s-circle-tp').textContent = 'S';
    p2ServeTp.querySelector('.s-label-tp').textContent = 'Server';
  }
}

function renderTablePlayers() {
  const match = currentMatch;
  const p1Name = match.type === 'singles' ? match.team1[0].name : `${match.team1[0].name} / ${match.team1[1].name.split(' ')[0]}`;
  const p2Name = match.type === 'singles' ? match.team2[0].name : `${match.team2[0].name} / ${match.team2[1].name.split(' ')[0]}`;
  const p1Country = match.team1[0].country;
  const p2Country = match.team2[0].country;

  const player1HTML = `
    <div class="table-player-info">
      <span class="tp-p-label">Player 1</span>
      <span class="tp-p-name">${p1Name}</span>
      <span class="tp-p-country">${p1Country}</span>
    </div>
  `;

  const player2HTML = `
    <div class="table-player-info">
      <span class="tp-p-label">Player 2</span>
      <span class="tp-p-name">${p2Name}</span>
      <span class="tp-p-country">${p2Country}</span>
    </div>
  `;

  const quadTL = document.getElementById('table-quad-tl');
  const quadTR = document.getElementById('table-quad-tr');
  const quadBL = document.getElementById('table-quad-bl');
  const quadBR = document.getElementById('table-quad-br');

  quadTL.innerHTML = '';
  quadTR.innerHTML = '';
  quadBL.innerHTML = '';
  quadBR.innerHTML = '';

  if (!matchState.swappedSides) {
    // P1 Bottom-Left, P2 Top-Right
    quadBL.innerHTML = player1HTML;
    quadTR.innerHTML = player2HTML;
  } else {
    // P1 Top-Right, P2 Bottom-Left
    quadTR.innerHTML = player1HTML;
    quadBL.innerHTML = player2HTML;
  }
}

function handleScore(player, delta) {
  if (!matchState.isStarted || !matchState.pointStarted && delta > 0) return; // Prevent scoring before start

  if (player === 1) {
    matchState.p1Score = Math.max(0, matchState.p1Score + delta);
  } else {
    matchState.p2Score = Math.max(0, matchState.p2Score + delta);
  }

  // Recalculate Server
  const totalPoints = matchState.p1Score + matchState.p2Score;
  let servesPassed = 0;

  if (matchState.p1Score >= 10 && matchState.p2Score >= 10) {
    // After 10-10, serve changes every 1 point. Total points before this phase = 20.
    // So base passes = 10 (since 2 points each up to 20).
    // Plus 1 pass for every point after 20.
    servesPassed = 10 + Math.max(0, totalPoints - 20);
  } else {
    // Before 10-10, serve changes every 2 points.
    servesPassed = Math.floor(totalPoints / 2);
  }

  // Determine current server
  if (servesPassed % 2 === 0) {
    matchState.server = matchState.initialServer;
  } else {
    matchState.server = matchState.initialServer === 1 ? 2 : 1;
  }

  // Check Game End
  let isGameEnd = false;
  if ((matchState.p1Score >= 11 || matchState.p2Score >= 11) && Math.abs(matchState.p1Score - matchState.p2Score) >= 2) {
    isGameEnd = true;
  }

  // Reset to "Start Of Play" if a point was just scored
  if (delta > 0) {
    matchState.pointStarted = false;

    if (isGameEnd) {
      document.getElementById('status-text').textContent = 'Game Over';
      document.getElementById('status-text').classList.remove('hidden');
      document.getElementById('table-player-grid').classList.add('hidden');
      document.getElementById('btn-next').classList.remove('disabled');
      toggleScoreButtons(true);
    } else {
      document.getElementById('status-text').textContent = 'Start Of Play';
      document.getElementById('status-text').classList.remove('hidden');
      document.getElementById('table-player-grid').classList.add('hidden');
      toggleScoreButtons(true);
    }
  } else if (delta < 0) {
    if (!isGameEnd && document.getElementById('status-text').textContent === 'Game Over') {
      document.getElementById('status-text').textContent = 'Start Of Play';
      document.getElementById('status-text').classList.remove('hidden');
      document.getElementById('table-player-grid').classList.add('hidden');
      document.getElementById('btn-next').classList.add('disabled');
      toggleScoreButtons(true);
      matchState.pointStarted = false;
    }
  }

  updateUI();
}

function updateTime() {
  const now = new Date();
  document.getElementById('tp-date').textContent = now.toLocaleDateString();
  document.getElementById('tp-clock').textContent = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

// --- Event Listeners ---
function setupEventListeners() {
  backBtn.addEventListener('click', closeTouchpad);

  document.getElementById('main-status-box').addEventListener('click', () => {
    if ((matchState.p1Score >= 11 || matchState.p2Score >= 11) && Math.abs(matchState.p1Score - matchState.p2Score) >= 2) {
      return; // Game over, do nothing
    }

    matchState.isStarted = true;
    matchState.pointStarted = true;

    // Hide "Start of Play"
    document.getElementById('status-text').classList.add('hidden');
    // Show Table Player Names
    renderTablePlayers();
    document.getElementById('table-player-grid').classList.remove('hidden');

    // Enable Score Buttons
    toggleScoreButtons(false);

    updateUI();
  });

  document.getElementById('p1-plus').addEventListener('click', () => {
    handleScore(matchState.swappedSides ? 2 : 1, 1);
  });
  document.getElementById('p1-minus').addEventListener('click', () => {
    handleScore(matchState.swappedSides ? 2 : 1, -1);
  });
  document.getElementById('p2-plus').addEventListener('click', () => {
    handleScore(matchState.swappedSides ? 1 : 2, 1);
  });
  document.getElementById('p2-minus').addEventListener('click', () => {
    handleScore(matchState.swappedSides ? 1 : 2, -1);
  });


  document.getElementById('btn-swap').addEventListener('click', () => {
    matchState.swappedSides = !matchState.swappedSides;

    // Physically swap the names on the DOM for the top summary table if needed,
    // actually updateUI() handles most live scores, but tp-player1-name is static.
    // Let's just swap them in the top score summary table.

    if (matchState.swappedSides) {
      document.getElementById('tp-player1-name').textContent = p2NameText;
      document.getElementById('tp-player2-name').textContent = p1NameText;
    } else {
      document.getElementById('tp-player1-name').textContent = p1NameText;
      document.getElementById('tp-player2-name').textContent = p2NameText;
    }

    updateUI();
  });

  // --- New Event Listeners ---
  document.getElementById('confirm-start-btn').addEventListener('click', openSetupView);
  document.getElementById('confirm-reset-btn').addEventListener('click', closeMatchConfirm);

  document.getElementById('setup-swap-btn').addEventListener('click', () => {
    matchState.swappedSides = !matchState.swappedSides;
    updateSetupUI();
  });

  document.getElementById('setup-right-serve').addEventListener('click', () => {
    matchState.server = matchState.swappedSides ? 1 : 2;
    updateSetupUI();
  });

  document.getElementById('setup-left-serve').addEventListener('click', () => {
    matchState.server = matchState.swappedSides ? 2 : 1;
    updateSetupUI();
  });

  document.getElementById('setup-warmup-btn').addEventListener('click', () => {
    warmupConfirmModal.classList.remove('hidden');
  });

  document.getElementById('warmup-cancel-btn').addEventListener('click', () => {
    warmupConfirmModal.classList.add('hidden');
  });

  document.getElementById('warmup-confirm-start-btn').addEventListener('click', () => {
    warmupConfirmModal.classList.add('hidden');
    startWarmUp();
  });

  document.getElementById('start-match-btn').addEventListener('click', () => {
    if (warmupInterval) clearInterval(warmupInterval);
    openTouchpad();
  });

  document.querySelector('.setup-power-btn').addEventListener('click', () => {
    setupView.classList.remove('active');
    setTimeout(() => {
      setupView.classList.add('hidden');
      matchListView.classList.remove('hidden');
      setTimeout(() => matchListView.classList.add('active'), 50);
    }, 400);
  });

  document.querySelector('.back-to-list-btn').addEventListener('click', () => {
    setupView.classList.remove('active');
    setTimeout(() => {
      setupView.classList.add('hidden');
      matchListView.classList.remove('hidden');
      setTimeout(() => matchListView.classList.add('active'), 50);
    }, 400);
  });
}

function startWarmUp() {
  warmupTimerOverlay.classList.remove('hidden');
  let timeLeft = 120; // 2 minutes
  const display = document.getElementById('timer-countdown');
  const circle = document.querySelector('.timer-progress');
  const totalDash = 283; // Circumference roughly

  if (warmupInterval) clearInterval(warmupInterval);

  warmupInterval = setInterval(() => {
    timeLeft--;
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    display.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

    // Update circle
    const offset = totalDash - (timeLeft / 120) * totalDash;
    circle.style.strokeDashoffset = offset;

    if (timeLeft <= 0) {
      clearInterval(warmupInterval);
    }
  }, 1000);
}

// Boot
init();
