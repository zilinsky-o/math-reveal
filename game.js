// Core Game Logic for Math Picture Reveal Game
// Handles game state, questions, answers, cells, levels, and UI

// Global State Variables
let currentLevel = 1;
let currentBg = null;
let cells = {};
let currentQuestion = null;
let cellsDiscovered = 0;
let totalMistakes = 0;
let mistakeLog = {};
let slowLog = {};
let fastLog = {};
let questionsSinceLastMistake = 0;
let pendingRetry = null;
let questionStartTime = null;
let timerInterval = null;
let isPaused = false;
let isCheckingAnswer = false;
let lastAnswerSubmitTime = 0;
let pausedTime = 0;

// Pathfinding Level Variables (Level 3)
let pathfindingTiles = {};
let avatarPosition = { row: 4, col: 0 };
let chestPosition = { row: 4, col: 8 };
let pendingTileClick = null;
let secretSquares = [];  // { row, col, discovered } hidden weapon squares in the maze
let coinSquares = [];    // { row, col, collected } hidden coin squares in the maze

// Wheel of Fortune state
let wheelCycleTimer = null;
let wheelCycleIndex = 0;
let wheelStopping = false;
let wheelRunId = 0;  // bumped on every startWheelGame(), so a stale decel chain can't finish into a new spin
let forceWheelPrizeId = null;  // test-mode hook: forces the next spin's outcome

// Timer Functions
function updateTimer() {
    if (!questionStartTime || isPaused) return;
    const elapsed = Math.floor((Date.now() - questionStartTime - pausedTime) / 1000);
    document.getElementById('timer').textContent = `${elapsed}s`;
}

function startTimer() {
    questionStartTime = Date.now();
    pausedTime = 0;
    if (timerInterval) clearInterval(timerInterval);
    timerInterval = setInterval(updateTimer, 1000);
    updateTimer();
}

function stopTimer() {
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
    return questionStartTime ? Math.floor((Date.now() - questionStartTime - pausedTime) / 1000) : 0;
}

function togglePause() {
    isPaused = !isPaused;
    const overlay = document.getElementById('paused-overlay');
    const pauseButton = document.getElementById('pause-button');

    if (isPaused) {
        overlay.classList.add('visible');
        pauseButton.innerHTML = '▶️<span class="btn-label"> Resume</span>';
        const pauseStart = Date.now();
        pauseButton.dataset.pauseStart = pauseStart;
    } else {
        overlay.classList.remove('visible');
        pauseButton.innerHTML = '⏸️<span class="btn-label"> Pause</span>';
        const pauseDuration = Date.now() - parseInt(pauseButton.dataset.pauseStart);
        pausedTime += pauseDuration;
        updateTimer();
    }
}

// Cell Management
const THEME_COLORS = {
    purple: '#8b5cf6',
    orange: '#f59e0b',
    teal: '#14b8a6',
    green: '#10b981',
    indigo: '#6366f1',
    red: '#dc2626'
};

// Theme name -> body class whose CSS palette matches. '' means the default
// (purple) page theme. level-5 (red palette) is deliberately unused so that a
// red page always means a boss (level-6).
const THEME_BODY_CLASS = {
    purple: '',
    orange: 'level-2',
    teal: 'level-3',
    indigo: 'level-4',
    red: 'level-6'
};

function createCrackSVG() {
    const theme = LEVEL_CONFIG[currentLevel] ? LEVEL_CONFIG[currentLevel].theme : 'purple';
    const color = THEME_COLORS[theme] || '#8b5cf6';

    return `<svg width="100%" height="100%" viewBox="0 0 62.5 62.5" xmlns="http://www.w3.org/2000/svg">
        <path d="M 10 0 L 15 20 L 25 15 L 30 35 L 40 30"
              stroke="${color}" stroke-width="2" fill="none" opacity="0.8"/>
        <path d="M 30 0 L 35 25 L 45 20 L 50 40"
              stroke="${color}" stroke-width="2" fill="none" opacity="0.8"/>
        <path d="M 0 20 L 20 25 L 15 40 L 30 45"
              stroke="${color}" stroke-width="2" fill="none" opacity="0.8"/>
        <path d="M 20 50 L 30 55 L 40 50 L 50 62.5"
              stroke="${color}" stroke-width="2" fill="none" opacity="0.8"/>
    </svg>`;
}

function createGrid() {
    const grid = document.getElementById('grid');
    grid.innerHTML = '';

    for (let rowIndex = 0; rowIndex < GRID_SIZE; rowIndex++) {
        const row = rowIndex + GRID_OFFSET;
        const rowDiv = document.createElement('div');
        rowDiv.className = 'grid-row';

        for (let colIndex = 0; colIndex < GRID_SIZE; colIndex++) {
            const col = colIndex + GRID_OFFSET;
            const cellKey = `${row}-${col}`;

            const cellDiv = document.createElement('div');
            cellDiv.className = 'grid-cell';
            cellDiv.id = cellKey;

            const coverDiv = document.createElement('div');
            coverDiv.className = 'cell-cover';
            coverDiv.id = `${cellKey}-cover`;

            const cracksDiv = document.createElement('div');
            cracksDiv.className = 'cell-cracks';
            cracksDiv.id = `${cellKey}-cracks`;
            cracksDiv.innerHTML = createCrackSVG();

            cellDiv.appendChild(coverDiv);
            cellDiv.appendChild(cracksDiv);
            rowDiv.appendChild(cellDiv);
        }

        grid.appendChild(rowDiv);
    }
}

function updateCell(cellKey) {
    const cell = cells[cellKey];
    const coverDiv = document.getElementById(`${cellKey}-cover`);
    const cracksDiv = document.getElementById(`${cellKey}-cracks`);

    if (coverDiv && cracksDiv) {
        if (cell.correctAnswers === 0) {
            coverDiv.style.opacity = '1';
            cracksDiv.style.opacity = '0';
        } else if (cell.correctAnswers === 1) {
            coverDiv.style.opacity = '0.7';
            cracksDiv.style.opacity = '1';
        } else {
            coverDiv.style.opacity = '0';
            cracksDiv.style.opacity = '0';
        }
    }
}

// Pathfinding Level Functions (Level 3)
function createPathfindingGrid() {
    const grid = document.getElementById('pathfinding-grid');
    grid.innerHTML = '';

    const levelConfig = LEVEL_CONFIG[currentLevel];
    pathfindingTiles = {};
    avatarPosition = { row: 4, col: 0 };
    chestPosition = { row: 4, col: 8 };

    // Place hidden weapon squares (avoiding the start and chest tiles).
    secretSquares = [];
    const forbiddenPositions = [
        `${avatarPosition.row}-${avatarPosition.col}`,
        `${chestPosition.row}-${chestPosition.col}`
    ];
    while (secretSquares.length < SECRET_SQUARES_COUNT) {
        const row = Math.floor(Math.random() * PATHFINDING_GRID_SIZE);
        const col = Math.floor(Math.random() * PATHFINDING_GRID_SIZE);
        const key = `${row}-${col}`;
        if (!forbiddenPositions.includes(key) && !secretSquares.some(s => s.row === row && s.col === col)) {
            secretSquares.push({ row, col, discovered: false });
        }
    }
    secretSquares.forEach(s => forbiddenPositions.push(`${s.row}-${s.col}`));

    // Place hidden coin squares (avoiding start, chest, and weapon squares).
    coinSquares = [];
    while (coinSquares.length < COIN_SQUARES_COUNT) {
        const row = Math.floor(Math.random() * PATHFINDING_GRID_SIZE);
        const col = Math.floor(Math.random() * PATHFINDING_GRID_SIZE);
        const key = `${row}-${col}`;
        if (!forbiddenPositions.includes(key) && !coinSquares.some(s => s.row === row && s.col === col)) {
            coinSquares.push({ row, col, collected: false });
        }
    }

    for (let row = 0; row < PATHFINDING_GRID_SIZE; row++) {
        for (let col = 0; col < PATHFINDING_GRID_SIZE; col++) {
            const tileKey = `${row}-${col}`;
            pathfindingTiles[tileKey] = {
                state: 'covered',  // covered, path, blocked
                row: row,
                col: col,
                question: generateTierQuestion(levelConfig)  // fixed per-tile exercise
            };

            const tileDiv = document.createElement('div');
            tileDiv.className = 'pathfinding-tile covered';
            tileDiv.id = `pf-tile-${tileKey}`;
            tileDiv.dataset.row = row;
            tileDiv.dataset.col = col;
            tileDiv.addEventListener('click', () => handleTileClick(row, col));

            // Mark hidden weapon squares with a "?"
            if (secretSquares.some(s => s.row === row && s.col === col)) {
                const secretMarker = document.createElement('div');
                secretMarker.className = 'secret-square-marker';
                secretMarker.textContent = '?';
                secretMarker.id = `secret-marker-${tileKey}`;
                tileDiv.appendChild(secretMarker);
            }

            // Mark hidden coin squares with a 🪙
            if (coinSquares.some(s => s.row === row && s.col === col)) {
                const coinMarker = document.createElement('div');
                coinMarker.className = 'coin-square-marker';
                coinMarker.textContent = '🪙';
                coinMarker.id = `coin-marker-${tileKey}`;
                tileDiv.appendChild(coinMarker);
            }

            grid.appendChild(tileDiv);
        }
    }

    // Mark starting tile as path
    const startKey = `${avatarPosition.row}-${avatarPosition.col}`;
    pathfindingTiles[startKey].state = 'path';
    document.getElementById(`pf-tile-${startKey}`).className = 'pathfinding-tile path has-avatar';

    // Position avatar and chest after grid is fully rendered
    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            updateAvatarPosition();
            updateChestPosition();
            updateAdjacentTiles();
        });
    });
}

function updateAvatarPosition() {
    const avatar = document.getElementById('pathfinding-avatar');
    const tileKey = `${avatarPosition.row}-${avatarPosition.col}`;
    const tile = document.getElementById(`pf-tile-${tileKey}`);

    if (!tile) return;

    // Get the actual position and size of the tile
    const tileRect = tile.getBoundingClientRect();
    const arenaRect = document.getElementById('pathfinding-arena').getBoundingClientRect();

    // Position avatar at the center of the tile, relative to the arena
    const left = tileRect.left - arenaRect.left + (tileRect.width / 2);
    const top = tileRect.top - arenaRect.top + (tileRect.height / 2);

    avatar.style.left = left + 'px';
    avatar.style.top = top + 'px';
    avatar.style.transform = 'translate(-50%, -50%)';
}

function updateChestPosition() {
    const chest = document.getElementById('pathfinding-chest');
    const tileKey = `${chestPosition.row}-${chestPosition.col}`;
    const tile = document.getElementById(`pf-tile-${tileKey}`);

    if (!tile) return;

    // Measure the actual chest tile so the icon stays aligned on any screen size.
    // The chest runs a bounce animation whose transform overrides any inline
    // translate(-50%, -50%), so we center it with left/top math instead and leave
    // `transform` free for the animation.
    const tileRect = tile.getBoundingClientRect();
    const arenaRect = document.getElementById('pathfinding-arena').getBoundingClientRect();
    const chestRect = chest.getBoundingClientRect();

    const left = tileRect.left - arenaRect.left + (tileRect.width / 2) - (chestRect.width / 2);
    const top = tileRect.top - arenaRect.top + (tileRect.height / 2) - (chestRect.height / 2);

    chest.style.left = left + 'px';
    chest.style.top = top + 'px';
}

function getAdjacentTiles(row, col) {
    const adjacent = [];
    const directions = [
        { dr: -1, dc: 0 },  // up
        { dr: 1, dc: 0 },   // down
        { dr: 0, dc: -1 },  // left
        { dr: 0, dc: 1 }    // right
    ];

    for (const dir of directions) {
        const newRow = row + dir.dr;
        const newCol = col + dir.dc;

        if (newRow >= 0 && newRow < PATHFINDING_GRID_SIZE &&
            newCol >= 0 && newCol < PATHFINDING_GRID_SIZE) {
            adjacent.push({ row: newRow, col: newCol });
        }
    }

    return adjacent;
}

function updateAdjacentTiles() {
    // Remove all adjacent highlights
    document.querySelectorAll('.pathfinding-tile.adjacent').forEach(tile => {
        tile.classList.remove('adjacent');
    });

    // Highlight adjacent covered tiles
    const adjacent = getAdjacentTiles(avatarPosition.row, avatarPosition.col);
    for (const pos of adjacent) {
        const tileKey = `${pos.row}-${pos.col}`;
        const tile = pathfindingTiles[tileKey];

        if (tile.state === 'covered') {
            document.getElementById(`pf-tile-${tileKey}`).classList.add('adjacent');
        }
    }
}

// Display a tile's own fixed question (does not generate a new one), so the
// same tile always shows the same exercise.
function showTileQuestion(question) {
    currentQuestion = question;
    document.getElementById('question').textContent = `What is ${question.row} ${question.op} ${question.col}?`;
    document.getElementById('answer-input').value = '';
    document.getElementById('feedback').textContent = '';
    isCheckingAnswer = false;
    document.getElementById('answer-input').focus();
    startTimer();
}

function handleTileClick(row, col) {
    // Only block while an answer is being validated. Selecting is otherwise free
    // so she can click between adjacent yellow tiles and preview each one's
    // question, and re-clicking a tile shows the same question again.
    if (isCheckingAnswer) return;

    const tileKey = `${row}-${col}`;
    const tile = pathfindingTiles[tileKey];

    const adjacent = getAdjacentTiles(avatarPosition.row, avatarPosition.col);
    const isAdjacent = adjacent.some(pos => pos.row === row && pos.col === col);

    if (isAdjacent && tile.state === 'covered') {
        // Select this tile and show its own (fixed) question.
        pendingTileClick = { row, col };
        showTileQuestion(tile.question);
    } else if (tile.state === 'path') {
        // Navigate onto an already-unlocked tile; drop any pending selection.
        pendingTileClick = null;
        stopTimer();
        document.getElementById('question').textContent = 'Click a yellow tile!';
        document.getElementById('feedback').textContent = '';
        moveAvatarTo(row, col);
    }
}

function moveAvatarTo(row, col) {
    // Remove has-avatar class from old position
    const oldKey = `${avatarPosition.row}-${avatarPosition.col}`;
    const oldTile = document.getElementById(`pf-tile-${oldKey}`);
    if (oldTile) oldTile.classList.remove('has-avatar');

    // Update avatar position
    avatarPosition = { row, col };

    // Add has-avatar class to new position
    const newKey = `${row}-${col}`;
    const newTile = document.getElementById(`pf-tile-${newKey}`);
    if (newTile) newTile.classList.add('has-avatar');

    updateAvatarPosition();
    updateAdjacentTiles();

    // Check if walked onto a hidden coin square
    const coinSquare = coinSquares.find(s => s.row === row && s.col === col && !s.collected);
    if (coinSquare) {
        coinSquare.collected = true;
        const marker = document.getElementById(`coin-marker-${newKey}`);
        if (marker) marker.style.display = 'none';
        const newWheelsFromCoinSquare = addCoins(COIN_SQUARE_REWARD);
        showCoinToast(`+${COIN_SQUARE_REWARD} 🪙`);
        playSuccessSound();
        if (newWheelsFromCoinSquare > 0) {
            // Stagger behind the coin toast (1200ms show + 300ms fade) so the two
            // notifications don't overlap in the same fixed toast position.
            setTimeout(() => {
                playWheelEarnedSound();
                showCoinToast(`+${newWheelsFromCoinSquare} 🎡 Wheel earned!`, 2400);
            }, 1500);
        }
        // Don't return - the chest/weapon-square checks below must still run.
    }

    // Check if walked into a hidden weapon square
    const secretSquare = secretSquares.find(s => s.row === row && s.col === col && !s.discovered);
    if (secretSquare) {
        secretSquare.discovered = true;
        const marker = document.getElementById(`secret-marker-${newKey}`);
        if (marker) marker.style.display = 'none';
        setTimeout(() => {
            showWeaponDiscovery();
        }, 300);
        return;
    }

    // Check if reached the chest
    if (row === chestPosition.row && col === chestPosition.col) {
        setTimeout(() => {
            showCompletion();
        }, 500);
    }
}

function showWeaponDiscovery() {
    const weaponTypes = ['pistol', 'jet', 'web'];
    const randomWeapon = weaponTypes[Math.floor(Math.random() * weaponTypes.length)];
    const weapon = WEAPONS[randomWeapon];

    addWeapon(randomWeapon);

    document.getElementById('weapon-discovery-emoji').textContent = weapon.emoji;
    document.getElementById('weapon-discovery-name').textContent = weapon.name;
    document.getElementById('weapon-discovery-desc').textContent = weapon.description;
    document.getElementById('weapon-discovery-modal').style.display = 'flex';
    playSuccessSound();
}

function closeWeaponDiscovery() {
    document.getElementById('weapon-discovery-modal').style.display = 'none';
}

// Brief, non-blocking notification for coin pickups and wheel-token conversions.
function showCoinToast(text, duration = 1200) {
    const toast = document.createElement('div');
    toast.className = 'coin-toast';
    toast.textContent = text;
    document.body.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add('visible'));
    setTimeout(() => {
        toast.classList.remove('visible');
        setTimeout(() => toast.remove(), 300);
    }, duration);
}

// Wheel of Fortune bonus game
function openWheelFromButton() {
    if (isCheckingAnswer) return;
    if (!useWheel()) return;
    startWheelGame();
}

function startWheelGame() {
    document.getElementById('wheel-result').style.display = 'none';
    const stopBtn = document.getElementById('wheel-stop-btn');
    stopBtn.style.display = 'inline-block';
    stopBtn.disabled = false;
    document.getElementById('wheel-modal').style.display = 'flex';
    wheelStopping = false;
    wheelRunId++;
    wheelCycleIndex = Math.floor(Math.random() * WHEEL_PRIZES.length);
    renderReel(wheelCycleIndex);
    if (wheelCycleTimer) clearInterval(wheelCycleTimer);
    wheelCycleTimer = setInterval(() => {
        wheelCycleIndex = (wheelCycleIndex + 1) % WHEEL_PRIZES.length;
        renderReel(wheelCycleIndex);
    }, WHEEL_CYCLE_MS);
}

function renderReel(i) {
    const prize = WHEEL_PRIZES[i];
    document.getElementById('wheel-reel-emoji').textContent = prize.emoji;
    document.getElementById('wheel-reel-label').textContent = prize.label;
}

// STOP: pick the weighted winner, then decelerate the cycling until it lands on it.
function stopWheel() {
    if (wheelStopping) return;
    wheelStopping = true;
    document.getElementById('wheel-stop-btn').disabled = true;
    if (wheelCycleTimer) clearInterval(wheelCycleTimer);

    const winner = pickWheelPrizeIndex();
    const runId = wheelRunId;
    let stepsLeft = WHEEL_DECEL_STEPS + ((winner - wheelCycleIndex + WHEEL_PRIZES.length) % WHEEL_PRIZES.length);
    let delay = WHEEL_CYCLE_MS;

    const tick = () => {
        if (runId !== wheelRunId) return;  // a newer spin started; abandon this chain
        wheelCycleIndex = (wheelCycleIndex + 1) % WHEEL_PRIZES.length;
        stepsLeft--;
        if (stepsLeft <= 0) {
            // Force the final render to the actual winner, since the ease-out
            // step count isn't guaranteed to be a multiple of the prize count.
            wheelCycleIndex = winner;
            renderReel(wheelCycleIndex);
            finishWheel(WHEEL_PRIZES[winner]);
            return;
        }
        renderReel(wheelCycleIndex);
        delay = Math.round(delay * 1.14);
        setTimeout(tick, delay);
    };
    setTimeout(tick, delay);
}

function pickWheelPrizeIndex() {
    if (forceWheelPrizeId) {
        const idx = WHEEL_PRIZES.findIndex(p => p.id === forceWheelPrizeId);
        if (idx >= 0) return idx;
    }
    const total = WHEEL_PRIZES.reduce((sum, p) => sum + p.weight, 0);
    let r = Math.random() * total;
    for (let i = 0; i < WHEEL_PRIZES.length; i++) {
        r -= WHEEL_PRIZES[i].weight;
        if (r < 0) return i;
    }
    return WHEEL_PRIZES.length - 1;
}

function finishWheel(prize) {
    const awarded = resolveWheelPrize(prize);
    document.getElementById('wheel-stop-btn').style.display = 'none';
    document.getElementById('wheel-result-emoji').textContent = awarded.emoji;
    document.getElementById('wheel-result-text').textContent = awarded.message;
    document.getElementById('wheel-result').style.display = 'block';
    playSuccessSound();

    const collectBtn = document.getElementById('wheel-collect-btn');
    if (awarded.extraRoll) {
        collectBtn.textContent = 'SPIN AGAIN!';
        collectBtn.onclick = () => { startWheelGame(); };
    } else {
        collectBtn.textContent = 'COLLECT!';
        collectBtn.onclick = closeWheel;
    }
}

function resolveWheelPrize(prize) {
    switch (prize.type) {
        case 'coins':
            addCoins(WHEEL_COINS_REWARD);
            return { emoji: '🪙', message: `You won ${WHEEL_COINS_REWARD} coins!` };
        case 'weapon':
            addWeapon(prize.weapon);
            return { emoji: WEAPONS[prize.weapon].emoji, message: `You won a ${WEAPONS[prize.weapon].name}!` };
        case 'freeSolution':
            addFreeSolutions(1);
            return { emoji: '💡', message: 'You won a Free Solution! Use it to auto-solve a question.' };
        case 'extraRoll':
            return { emoji: '🎡', message: 'Another spin! Go again!', extraRoll: true };
        case 'special':
        default:
            const bg = selectSpecialTreasure();
            addToCollection(bg.emoji, bg.name);
            return { emoji: bg.emoji, message: `You won ${bg.name} — a special treasure!` };
    }
}

function closeWheel() {
    if (wheelCycleTimer) clearInterval(wheelCycleTimer);
    document.getElementById('wheel-modal').style.display = 'none';
    document.getElementById('wheel-collect-btn').textContent = 'COLLECT!';
    document.getElementById('wheel-collect-btn').onclick = closeWheel;
    updateResourcesUI();
}

// Free-Solution token: auto-answers the current question.
function useFreeSolutionNow() {
    if (isCheckingAnswer || !currentQuestion) return;
    const levelConfig = LEVEL_CONFIG[currentLevel];
    if (levelConfig.type === 'treasure' && !pendingTileClick) {
        showCoinToast('Pick a yellow tile first!');
        return;
    }
    if (!useFreeSolution()) return;
    document.getElementById('answer-input').value = currentQuestion.answer;
    checkAnswer();
}

// Level Initialization and Management
function initializeLevel() {
    cells = {};

    for (let row = GRID_OFFSET; row < GRID_SIZE + GRID_OFFSET; row++) {
        for (let col = GRID_OFFSET; col < GRID_SIZE + GRID_OFFSET; col++) {
            cells[`${row}-${col}`] = { correctAnswers: 0, completed: false };
        }
    }
    cellsDiscovered = 0;

    totalMistakes = 0;
    mistakeLog = {};
    slowLog = {};
    fastLog = {};
    questionsSinceLastMistake = 0;
    pendingRetry = null;

    document.getElementById('progress-text').textContent = `${cellsDiscovered}/64 Cells Discovered!`;
    document.getElementById('mistakes-text').textContent = 'Mistakes: 0';
}

function showLevelIntro() {
    const intro = document.getElementById('level-intro');
    const title = document.getElementById('level-intro-title');
    const desc = document.getElementById('level-intro-desc');
    const bossIntroEmoji = document.getElementById('boss-intro-emoji');

    const levelConfig = LEVEL_CONFIG[currentLevel];

    // Map each theme to the body class whose CSS palette actually matches it.
    // (level-5 is a red palette, so it is intentionally not used here — red is
    // reserved for bosses via level-6.)
    document.body.className = '';
    const bodyClass = THEME_BODY_CLASS[levelConfig.theme];
    if (bodyClass) document.body.classList.add(bodyClass);

    if (levelConfig.type === 'boss') {
        bossIntroEmoji.style.display = 'block';
    } else {
        bossIntroEmoji.style.display = 'none';
    }

    title.textContent = levelConfig.title;
    desc.textContent = levelConfig.description;

    document.getElementById('level-badge').textContent = `Level ${currentLevel}`;

    // Remember how far she has come so Continue can return here (test jumps excluded).
    if (!testMode) saveReachedLevel(currentLevel);

    intro.classList.add('visible');
}

function startLevel() {
    document.getElementById('level-intro').classList.remove('visible');

    const levelConfig = LEVEL_CONFIG[currentLevel];
    const isBossLevel = levelConfig.practiceType === 'C';
    const isPathfindingLevel = levelConfig.practiceType === 'D';

    document.getElementById('wheel-btn').style.display = isBossLevel ? 'none' : 'inline-block';
    document.getElementById('freesol-btn').style.display = isBossLevel ? 'none' : 'inline-block';
    updateResourcesUI();

    if (isBossLevel) {
        document.getElementById('game-board').style.display = 'none';
        document.getElementById('pathfinding-arena').style.display = 'none';
        document.getElementById('boss-arena').style.display = 'block';
        document.getElementById('weapons-container').style.display = 'flex';
        document.getElementById('progress-text').textContent = 'Boss Battle!';
        initializeBossBattle();
        generateQuestion();
    } else if (isPathfindingLevel) {
        document.getElementById('game-board').style.display = 'none';
        document.getElementById('boss-arena').style.display = 'none';
        document.getElementById('weapons-container').style.display = 'none';
        document.getElementById('pathfinding-arena').style.display = 'block';

        currentBg = selectRandomBackground(currentLevel);
        totalMistakes = 0;
        document.getElementById('progress-text').textContent = 'Find the Treasure!';
        document.getElementById('mistakes-text').textContent = 'Mistakes: 0';

        createPathfindingGrid();
        // Clear any answer-in-progress state carried over from the previous level;
        // otherwise the tile-click guard (pendingTileClick || isCheckingAnswer)
        // blocks every tile and the maze can't be played.
        isCheckingAnswer = false;
        pendingTileClick = null;

        // Don't generate question at start - wait for user to click adjacent tile
        document.getElementById('question').textContent = 'Click a yellow tile to start!';
        document.getElementById('answer-input').value = '';
        document.getElementById('feedback').textContent = '';
    } else {
        document.getElementById('game-board').style.display = 'block';
        document.getElementById('pathfinding-arena').style.display = 'none';
        document.getElementById('boss-arena').style.display = 'none';
        document.getElementById('weapons-container').style.display = 'none';

        currentBg = selectRandomBackground(currentLevel);
        document.getElementById('background').style.background = currentBg.gradient;
        document.getElementById('emoji').textContent = currentBg.emoji;

        initializeLevel();
        createGrid();
        generateQuestion();
    }
}

// Question Generation
// Draw the "+N" addend for this level. Uniform for now; Phase 2 will bias this
// toward the facts the player has found harder.
function pickAddend(ceiling) {
    return Math.floor(Math.random() * ceiling) + 1;
}

// Parse a stored question key like "45+3" or "12-9" back into its parts.
function parseQuestionKey(key) {
    const op = key.indexOf('+') !== -1 ? '+' : '-';
    const parts = key.split(op);
    if (parts.length !== 2) return null;
    const base = Number(parts[0]);
    const addend = Number(parts[1]);
    if (!Number.isFinite(base) || !Number.isFinite(addend)) return null;
    return { base, addend, op };
}

// Weighted draw from the difficulty memory, limited to facts that are valid for
// this level (right digit range, addend within tier, subtraction stays >= 0).
// Harder facts (higher score) are more likely. Returns null if none apply.
function pickHardQuestion(levelConfig) {
    const map = loadDifficulty();
    const [baseMin, baseMax] = levelConfig.digitClass === 'double'
        ? DOUBLE_DIGIT_RANGE
        : SINGLE_DIGIT_RANGE;
    const ceiling = levelConfig.addendCeiling;

    const candidates = [];
    let totalWeight = 0;
    for (const key in map) {
        const score = map[key];
        if (score <= 0) continue;
        const p = parseQuestionKey(key);
        if (!p) continue;
        if (p.addend < 1 || p.addend > ceiling) continue;
        if (p.base < baseMin || p.base > baseMax) continue;
        if (p.op === '-' && p.base < p.addend) continue;
        const answer = p.op === '+' ? p.base + p.addend : p.base - p.addend;
        candidates.push({ q: { row: p.base, col: p.addend, op: p.op, answer }, weight: score });
        totalWeight += score;
    }
    if (candidates.length === 0) return null;

    let r = Math.random() * totalWeight;
    for (const c of candidates) {
        r -= c.weight;
        if (r <= 0) return c.q;
    }
    return candidates[candidates.length - 1].q;
}

// Every level mixes `base + addend` and `base - addend`. Animal levels use a
// single-digit base, treasure and boss levels use a double-digit base; the
// addend ("+N"/"-N") is drawn from this level's tier (1..addendCeiling).
// Subtraction always keeps the result >= 0.
function generateTierQuestion(levelConfig) {
    // Sometimes re-serve a fact the player has found hard.
    if (Math.random() < HARD_PICK_PROBABILITY) {
        const hard = pickHardQuestion(levelConfig);
        if (hard) return hard;
    }

    const [baseMin, baseMax] = levelConfig.digitClass === 'double'
        ? DOUBLE_DIGIT_RANGE
        : SINGLE_DIGIT_RANGE;
    const addend = pickAddend(levelConfig.addendCeiling);

    if (Math.random() < 0.5) {
        // Subtraction: draw the base from [addend, baseMax] so base - addend >= 0.
        const min = Math.max(baseMin, addend);
        const base = Math.floor(Math.random() * (baseMax - min + 1)) + min;
        return { row: base, col: addend, op: '-', answer: base - addend };
    }

    const base = Math.floor(Math.random() * (baseMax - baseMin + 1)) + baseMin;
    return { row: base, col: addend, op: '+', answer: base + addend };
}

function questionKeyOf(question) {
    return `${question.row}${question.op}${question.col}`;
}

function recordMistake(question) {
    const key = questionKeyOf(question);
    if (!mistakeLog[key]) mistakeLog[key] = 0;
    mistakeLog[key]++;
    bumpDifficulty(key, MISTAKE_WEIGHT);
}

function generateQuestion() {
    const levelConfig = LEVEL_CONFIG[currentLevel];
    const practiceType = PRACTICE_TYPES[levelConfig.practiceType];

    // The picture-grid win check only applies to reveal levels. Treasure levels
    // don't use `cells`, and boss levels don't reset it on entry, so a stale
    // "all revealed" grid left over from the previous animal level would
    // otherwise immediately end the boss fight instead of asking a question.
    if (levelConfig.type === 'animal') {
        const allRevealed = Object.values(cells).every(cell => cell.correctAnswers >= 2);
        if (allRevealed) {
            showCompletion();
            return;
        }
    }

    // Spaced repetition: on retry levels, re-ask a missed question after two
    // others have gone by.
    if (practiceType.requiresRetry && pendingRetry && questionsSinceLastMistake >= 2) {
        currentQuestion = pendingRetry;
        pendingRetry = null;
        questionsSinceLastMistake = 0;
    } else {
        currentQuestion = generateTierQuestion(levelConfig);
    }

    document.getElementById('question').textContent = `What is ${currentQuestion.row} ${currentQuestion.op} ${currentQuestion.col}?`;
    document.getElementById('answer-input').value = '';
    document.getElementById('feedback').textContent = '';

    isCheckingAnswer = false;
    document.getElementById('answer-input').focus();
    startTimer();
}

// Answer Checking
function checkAnswer() {
    const now = Date.now();
    if (isPaused || isCheckingAnswer || (now - lastAnswerSubmitTime) < 300) return;

    initAudio();
    const answerInput = document.getElementById('answer-input');
    const userAnswer = parseInt(answerInput.value);
    if (!currentQuestion || isNaN(userAnswer)) return;

    isCheckingAnswer = true;
    lastAnswerSubmitTime = now;
    answerInput.value = '';
    // Re-focus synchronously, still inside this click's call stack: mobile
    // Safari only honors a programmatic focus()-reopens-the-keypad request
    // when it's triggered directly by a user gesture, not from a later
    // setTimeout. This keeps the keypad up through the whole answer cycle.
    answerInput.focus();

    const levelConfig = LEVEL_CONFIG[currentLevel];
    const practiceType = PRACTICE_TYPES[levelConfig.practiceType];
    const isBossLevel = levelConfig.type === 'boss';
    const isPathfindingLevel = levelConfig.type === 'treasure';

    const timeSpent = stopTimer();
    const isCorrect = userAnswer === currentQuestion.answer;
    const feedbackDiv = document.getElementById('feedback');

    if (isCorrect) {
        const newWheels = addCoins(COINS_PER_ANSWER);
        if (newWheels > 0) {
            playWheelEarnedSound();
            showCoinToast(`+${newWheels} 🎡 Wheel earned!`, 2400);
        }
    }

    if (isPathfindingLevel) {
        if (isCorrect && pendingTileClick) {
            feedbackDiv.textContent = '✨ Correct! Tile unlocked!';
            feedbackDiv.className = 'feedback correct';
            playSuccessSound();

            // Unlock the tile as a path
            const tileKey = `${pendingTileClick.row}-${pendingTileClick.col}`;
            pathfindingTiles[tileKey].state = 'path';
            const tileDiv = document.getElementById(`pf-tile-${tileKey}`);
            tileDiv.className = 'pathfinding-tile path';

            // Move avatar to the newly unlocked tile
            const targetRow = pendingTileClick.row;
            const targetCol = pendingTileClick.col;
            pendingTileClick = null;

            setTimeout(() => {
                moveAvatarTo(targetRow, targetCol);
                feedbackDiv.textContent = '';
                isCheckingAnswer = false;
                document.getElementById('question').textContent = 'Click a yellow tile!';
                document.getElementById('answer-input').value = '';
            }, 500);
        } else if (!isCorrect && pendingTileClick) {
            // Check if this is the chest tile - don't block it, allow retry
            const isChestTile = (pendingTileClick.row === chestPosition.row &&
                                 pendingTileClick.col === chestPosition.col);

            if (isChestTile) {
                feedbackDiv.textContent = '❌ Wrong! Try again!';
                feedbackDiv.className = 'feedback incorrect';
                playFailSound();

                totalMistakes++;
                document.getElementById('mistakes-text').textContent = `Mistakes: ${totalMistakes}`;
                recordMistake(currentQuestion);

                // Don't block - allow retry by re-showing the chest's own question
                const chestKey = `${chestPosition.row}-${chestPosition.col}`;
                setTimeout(() => {
                    feedbackDiv.textContent = '';
                    showTileQuestion(pathfindingTiles[chestKey].question);
                }, 1000);
            } else {
                feedbackDiv.textContent = '❌ Wrong! Tile blocked!';
                feedbackDiv.className = 'feedback incorrect';
                playFailSound();

                // Block the tile permanently
                const tileKey = `${pendingTileClick.row}-${pendingTileClick.col}`;
                pathfindingTiles[tileKey].state = 'blocked';
                const tileDiv = document.getElementById(`pf-tile-${tileKey}`);
                tileDiv.className = 'pathfinding-tile blocked';

                totalMistakes++;
                document.getElementById('mistakes-text').textContent = `Mistakes: ${totalMistakes}`;
                recordMistake(currentQuestion);

                updateAdjacentTiles();
                pendingTileClick = null;

                setTimeout(() => {
                    feedbackDiv.textContent = '';
                    isCheckingAnswer = false;
                    document.getElementById('question').textContent = 'Click a yellow tile!';
                    document.getElementById('answer-input').value = '';
                }, 1000);
            }
        }
        return;
    }

    if (isBossLevel) {
        if (isCorrect) {
            feedbackDiv.textContent = '✨ Correct! Great job!';
            feedbackDiv.className = 'feedback correct';
            playSuccessSound();

            // A jet airstrike freezes the boss only until the next question.
            if (bossIsFrozen) {
                unfreezeAndRemoveJetEffect();
            }

            throwBombAtBoss();
            setTimeout(() => {
                moveBossAway();
            }, 400);

            setTimeout(generateQuestion, 1200);
        } else {
            feedbackDiv.textContent = '🤔 Not quite! Try again!';
            feedbackDiv.className = 'feedback incorrect';
            playFailSound();

            throwBombMiss();

            totalMistakes++;
            document.getElementById('mistakes-text').textContent = `Mistakes: ${totalMistakes}`;
            recordMistake(currentQuestion);

            setTimeout(() => {
                isCheckingAnswer = false;
                document.getElementById('answer-input').focus();
                startTimer();
            }, 1000);
        }
        return;
    }

    if (isCorrect) {
        feedbackDiv.textContent = '✨ Correct! Great job!';
        feedbackDiv.className = 'feedback correct';

        const canProgress = Object.keys(cells).filter(key => cells[key].correctAnswers < 2);

        if (canProgress.length === 0) {
            playSuccessSound();
            setTimeout(() => {
                showCompletion();
            }, 1000);
            return;
        }

        const cellsPerAnswer = practiceType.cellsPerAnswer;

        const shuffled = canProgress.sort(() => Math.random() - 0.5);
        const numToProgress = Math.min(cellsPerAnswer, canProgress.length);

        let newlyCompleted = 0;
        for (let i = 0; i < numToProgress; i++) {
            const cellKey = shuffled[i];
            cells[cellKey].correctAnswers++;

            if (cells[cellKey].correctAnswers >= 2) {
                cells[cellKey].completed = true;
                cellsDiscovered++;
                newlyCompleted++;
            }

            updateCell(cellKey);
        }

        if (newlyCompleted > 0) {
            playCellRevealSound();
        } else {
            playSuccessSound();
        }

        document.getElementById('progress-text').textContent = `${cellsDiscovered}/64 Cells Discovered!`;

        const questionKey = questionKeyOf(currentQuestion);

        if (timeSpent < 5) {
            if (!fastLog[questionKey]) fastLog[questionKey] = [];
            fastLog[questionKey].push(timeSpent);
        }

        if (timeSpent >= 20) {
            if (!slowLog[questionKey]) slowLog[questionKey] = [];
            slowLog[questionKey].push(timeSpent);
            bumpDifficulty(questionKey, SLOW_WEIGHT);
        }

        if (practiceType.requiresRetry) {
            questionsSinceLastMistake++;
        }

        setTimeout(generateQuestion, 1000);
    } else {
        feedbackDiv.textContent = '🤔 Not quite! Try again!';
        feedbackDiv.className = 'feedback incorrect';

        playFailSound();

        totalMistakes++;
        document.getElementById('mistakes-text').textContent = `Mistakes: ${totalMistakes}`;

        recordMistake(currentQuestion);

        if (practiceType.requiresRetry) {
            if (!pendingRetry || pendingRetry.row !== currentQuestion.row ||
                pendingRetry.col !== currentQuestion.col || pendingRetry.op !== currentQuestion.op) {
                pendingRetry = { ...currentQuestion };
                questionsSinceLastMistake = 0;
            }
        }

        const cellsPerAnswer = practiceType.cellsPerAnswer;

        const canRegress = Object.keys(cells).filter(key => cells[key].correctAnswers > 0);

        if (canRegress.length > 0) {
            const shuffled = canRegress.sort(() => Math.random() - 0.5);
            const numToRegress = Math.min(cellsPerAnswer, canRegress.length);

            for (let i = 0; i < numToRegress; i++) {
                const cellKey = shuffled[i];

                if (cells[cellKey].correctAnswers === 2) {
                    cells[cellKey].completed = false;
                    cellsDiscovered--;
                }

                cells[cellKey].correctAnswers = Math.max(0, cells[cellKey].correctAnswers - 1);
                updateCell(cellKey);
            }
        }

        document.getElementById('progress-text').textContent = `${cellsDiscovered}/64 Cells Discovered!`;

        isCheckingAnswer = false;
        document.getElementById('answer-input').focus();

        startTimer();
    }
}

// Level Completion
function showCompletion() {
    stopTimer();
    playCompletionSound();

    saveHighestLevel(currentLevel);

    addToCollection(currentBg.emoji, currentBg.name);

    const levelConfig = LEVEL_CONFIG[currentLevel];

    document.getElementById('question-box').style.display = 'none';
    document.getElementById('completion').style.display = 'block';
    const foundVerb = levelConfig.type === 'treasure' ? 'found the' : 'revealed the';
    document.getElementById('completion-text').textContent = `You ${foundVerb} ${currentBg.name}!`;
    document.getElementById('new-collectible').textContent = currentBg.emoji;

    const nextLevelBtn = document.getElementById('next-level-button');
    nextLevelBtn.style.display = LEVEL_CONFIG[currentLevel + 1] ? 'inline-block' : 'none';

    const reportsContainer = document.getElementById('reports-container');
    let reportsHTML = '';

    if (Object.keys(fastLog).length > 0) {
        reportsHTML += '<div class="achievement-report"><h3>🌟 Speed Achievements (Under 5 seconds):</h3><ul>';
        const sortedFast = Object.entries(fastLog).sort((a, b) => {
            const avgA = a[1].reduce((sum, t) => sum + t, 0) / a[1].length;
            const avgB = b[1].reduce((sum, t) => sum + t, 0) / b[1].length;
            return avgA - avgB;
        });
        for (const [question, times] of sortedFast) {
            const avgTime = (times.reduce((sum, t) => sum + t, 0) / times.length).toFixed(1);
            reportsHTML += `<li>${question} (${avgTime}s avg)</li>`;
        }
        reportsHTML += '</ul></div>';
    }

    if (Object.keys(mistakeLog).length > 0) {
        reportsHTML += '<div class="mistake-report"><h3>Questions with Mistakes:</h3><ul>';
        const sortedMistakes = Object.entries(mistakeLog).sort((a, b) => b[1] - a[1]);
        for (const [question, count] of sortedMistakes) {
            reportsHTML += `<li>${question} (${count} mistake${count > 1 ? 's' : ''})</li>`;
        }
        reportsHTML += '</ul></div>';
    }

    if (Object.keys(slowLog).length > 0) {
        reportsHTML += '<div class="mistake-report"><h3>Questions That Took Time (20+ seconds):</h3><ul>';
        const sortedSlow = Object.entries(slowLog).sort((a, b) => {
            const avgA = a[1].reduce((sum, t) => sum + t, 0) / a[1].length;
            const avgB = b[1].reduce((sum, t) => sum + t, 0) / b[1].length;
            return avgB - avgA;
        });
        for (const [question, times] of sortedSlow) {
            const avgTime = Math.round(times.reduce((sum, t) => sum + t, 0) / times.length);
            reportsHTML += `<li>${question} (avg ${avgTime}s)</li>`;
        }
        reportsHTML += '</ul></div>';
    }

    if (totalMistakes === 0 && Object.keys(slowLog).length === 0 && Object.keys(fastLog).length === 0) {
        reportsHTML = '<div class="achievement-report"><h3>Perfect! 🌟</h3></div>';
    }

    reportsContainer.innerHTML = reportsHTML;
}

function goToNextLevel() {
    const nextLevel = currentLevel + 1;
    if (LEVEL_CONFIG[nextLevel]) {
        currentLevel = nextLevel;
    }

    stopBackgroundMusic();
    if (bossMovementInterval) clearInterval(bossMovementInterval);

    document.getElementById('completion').style.display = 'none';
    document.getElementById('question-box').style.display = 'block';
    showLevelIntro();
}

// Home screen: always-available Continue (jump to furthest level reached) or
// Restart Journey (start the levels over from 1, keeping collection + memory).
function showHomeScreen() {
    stopTimer();
    if (bossMovementInterval) clearInterval(bossMovementInterval);
    stopBackgroundMusic();
    isPaused = false;
    document.getElementById('paused-overlay').classList.remove('visible');
    document.getElementById('pause-button').innerHTML = '⏸️<span class="btn-label"> Pause</span>';
    document.getElementById('completion').style.display = 'none';
    document.getElementById('level-intro').classList.remove('visible');

    const reached = getReachedLevel();
    const cfg = LEVEL_CONFIG[reached];
    const typeLabel = cfg
        ? (cfg.type === 'boss' ? 'Boss' : (cfg.type === 'treasure' ? 'Treasure' : 'Animal'))
        : '';
    document.getElementById('home-desc').textContent = reached > 1
        ? `Continue from Level ${reached} — ${typeLabel}`
        : 'Ready to start your journey?';

    document.getElementById('home-screen').classList.add('visible');
}

function continueJourney() {
    document.getElementById('home-screen').classList.remove('visible');
    currentLevel = getReachedLevel();
    showLevelIntro();
}

function restartJourney() {
    if (!confirm('Restart your whole journey from Level 1? Your collection is kept.')) return;
    setReachedLevel(1);
    currentLevel = 1;
    document.getElementById('home-screen').classList.remove('visible');
    showLevelIntro();
}

function restartGame() {
    if (confirm('Are you sure you want to restart this level? Your current progress will be lost.')) {
        stopTimer();
        if (bossMovementInterval) clearInterval(bossMovementInterval);
        stopBackgroundMusic();
        isPaused = false;
        document.getElementById('paused-overlay').classList.remove('visible');
        document.getElementById('pause-button').innerHTML = '⏸️<span class="btn-label"> Pause</span>';

        document.getElementById('completion').style.display = 'none';
        document.getElementById('question-box').style.display = 'block';

        showLevelIntro();
    }
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    // Initialize audio context on first user interaction
    document.addEventListener('click', initAudio, { once: true });

    // Answer input enter key listener
    const answerInput = document.getElementById('answer-input');
    if (answerInput) {
        answerInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                if (isCheckingAnswer || isPaused) {
                    e.preventDefault();
                    return;
                }
                e.preventDefault();
                checkAnswer();
            }
        });
    }

    // Initialize game
    updateCollectionCount();
    updateResourcesUI();
    createGrid();
    populateCollectibleSelector();

    // Returning players land on the home screen (Continue / Restart); brand-new
    // players go straight into Level 1.
    if (getReachedLevel() > 1) {
        showHomeScreen();
    } else {
        showLevelIntro();
    }

    // The maze arena is fluid-width on mobile, so a rotate/resize can leave the
    // avatar and chest icons offset from their tiles until repositioned.
    window.addEventListener('resize', () => {
        if (document.getElementById('pathfinding-arena').style.display !== 'none') {
            updateAvatarPosition();
            updateChestPosition();
        }
    });
});
