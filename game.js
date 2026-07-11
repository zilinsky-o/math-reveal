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
        pauseButton.textContent = '▶️ Resume';
        const pauseStart = Date.now();
        pauseButton.dataset.pauseStart = pauseStart;
    } else {
        overlay.classList.remove('visible');
        pauseButton.textContent = '⏸️ Pause';
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

    return `<svg width="62.5" height="62.5" xmlns="http://www.w3.org/2000/svg">
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

    pathfindingTiles = {};
    avatarPosition = { row: 4, col: 0 };
    chestPosition = { row: 4, col: 8 };

    for (let row = 0; row < PATHFINDING_GRID_SIZE; row++) {
        for (let col = 0; col < PATHFINDING_GRID_SIZE; col++) {
            const tileKey = `${row}-${col}`;
            pathfindingTiles[tileKey] = {
                state: 'covered',  // covered, path, blocked
                row: row,
                col: col
            };

            const tileDiv = document.createElement('div');
            tileDiv.className = 'pathfinding-tile covered';
            tileDiv.id = `pf-tile-${tileKey}`;
            tileDiv.dataset.row = row;
            tileDiv.dataset.col = col;
            tileDiv.addEventListener('click', () => handleTileClick(row, col));

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

function handleTileClick(row, col) {
    // Ignore clicks while a tile question is already open, so a fast second
    // click can't swap which tile is being answered.
    if (pendingTileClick || isCheckingAnswer) return;

    const tileKey = `${row}-${col}`;
    const tile = pathfindingTiles[tileKey];

    // Check if tile is adjacent to avatar and covered (for unlocking)
    const adjacent = getAdjacentTiles(avatarPosition.row, avatarPosition.col);
    const isAdjacent = adjacent.some(pos => pos.row === row && pos.col === col);

    if (isAdjacent && tile.state === 'covered') {
        // Show question to unlock this tile
        pendingTileClick = { row, col };
        generateQuestion();
    } else if (tile.state === 'path') {
        // Move avatar to this path tile
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

    // Check if reached the chest
    if (row === chestPosition.row && col === chestPosition.col) {
        setTimeout(() => {
            showCompletion();
        }, 500);
    }
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

    if (isBossLevel) {
        document.getElementById('game-board').style.display = 'none';
        document.getElementById('pathfinding-arena').style.display = 'none';
        document.getElementById('boss-arena').style.display = 'block';
        document.getElementById('progress-text').textContent = 'Boss Battle!';
        initializeBossBattle();
        generateQuestion();
    } else if (isPathfindingLevel) {
        document.getElementById('game-board').style.display = 'none';
        document.getElementById('boss-arena').style.display = 'none';
        document.getElementById('pathfinding-arena').style.display = 'block';

        currentBg = selectRandomBackground(currentLevel);
        totalMistakes = 0;
        document.getElementById('progress-text').textContent = 'Find the Treasure!';
        document.getElementById('mistakes-text').textContent = 'Mistakes: 0';

        createPathfindingGrid();
        // Don't generate question at start - wait for user to click adjacent tile
        document.getElementById('question').textContent = 'Click a yellow tile to start!';
        document.getElementById('answer-input').value = '';
        document.getElementById('feedback').textContent = '';
    } else {
        document.getElementById('game-board').style.display = 'block';
        document.getElementById('pathfinding-arena').style.display = 'none';
        document.getElementById('boss-arena').style.display = 'none';

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
    const isPathfindingLevel = levelConfig.type === 'treasure';

    // The picture-grid win check only applies to reveal levels. The pathfinding
    // level does not use `cells`, and a stale/empty grid would otherwise report
    // "all revealed" and win the level on the very first tile click.
    if (!isPathfindingLevel) {
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
    document.getElementById('answer-input').disabled = false;
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
    answerInput.disabled = true;
    answerInput.value = '';

    const levelConfig = LEVEL_CONFIG[currentLevel];
    const practiceType = PRACTICE_TYPES[levelConfig.practiceType];
    const isBossLevel = levelConfig.type === 'boss';
    const isPathfindingLevel = levelConfig.type === 'treasure';

    const timeSpent = stopTimer();
    const isCorrect = userAnswer === currentQuestion.answer;
    const feedbackDiv = document.getElementById('feedback');

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
                document.getElementById('answer-input').disabled = false;
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

                // Don't block - allow retry by generating a new question
                setTimeout(() => {
                    feedbackDiv.textContent = '';
                    generateQuestion();
                    isCheckingAnswer = false;
                    document.getElementById('answer-input').disabled = false;
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
                    document.getElementById('answer-input').disabled = false;
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
                document.getElementById('answer-input').disabled = false;
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
        document.getElementById('answer-input').disabled = false;
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
    document.getElementById('pause-button').textContent = '⏸️ Pause';
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
        document.getElementById('pause-button').textContent = '⏸️ Pause';

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
    createGrid();
    populateCollectibleSelector();

    // Returning players land on the home screen (Continue / Restart); brand-new
    // players go straight into Level 1.
    if (getReachedLevel() > 1) {
        showHomeScreen();
    } else {
        showLevelIntro();
    }
});
