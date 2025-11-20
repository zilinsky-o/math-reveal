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
let allTimesLog = {};
let level1MistakeLog = {};
let level1SlowLog = {};
let level4MistakeLog = {};
let level4SlowLog = {};
let practiceQuestions = [];
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
function createCrackSVG() {
    let color = '#8b5cf6';
    if (currentLevel === 2) color = '#f59e0b';
    if (currentLevel === 3) color = '#14b8a6';
    if (currentLevel === 4) color = '#10b981';
    if (currentLevel === 5) color = '#6366f1';
    if (currentLevel === 6) color = '#dc2626';

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

    // Position avatar and chest
    updateAvatarPosition();
    updateChestPosition();
    updateAdjacentTiles();
}

function updateAvatarPosition() {
    const avatar = document.getElementById('pathfinding-avatar');
    const tileSize = 600 / PATHFINDING_GRID_SIZE;  // Approximate tile size
    const offset = 4;  // Gap between tiles

    avatar.style.left = (avatarPosition.col * (tileSize + offset) + tileSize / 2) + 'px';
    avatar.style.top = (avatarPosition.row * (tileSize + offset) + tileSize / 2) + 'px';
    avatar.style.transform = 'translate(-50%, -50%)';
}

function updateChestPosition() {
    const chest = document.getElementById('pathfinding-chest');
    const tileSize = 600 / PATHFINDING_GRID_SIZE;
    const offset = 4;

    chest.style.left = (chestPosition.col * (tileSize + offset) + tileSize / 2) + 'px';
    chest.style.top = (chestPosition.row * (tileSize + offset) + tileSize / 2) + 'px';
    chest.style.transform = 'translate(-50%, -50%)';
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

    const levelConfig = LEVEL_CONFIG[currentLevel];
    const practiceType = PRACTICE_TYPES[levelConfig.practiceType];

    if (practiceType.questionSource === 'random') {
        allTimesLog = {};
    }
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

    document.body.className = '';
    if (levelConfig.theme === 'orange') document.body.classList.add('level-2');
    if (levelConfig.theme === 'teal') document.body.classList.add('level-3');
    if (levelConfig.theme === 'green') document.body.classList.add('level-4');
    if (levelConfig.theme === 'indigo') document.body.classList.add('level-5');
    if (levelConfig.theme === 'red') document.body.classList.add('level-6');

    if (currentLevel === 6) {
        bossIntroEmoji.style.display = 'block';
    } else {
        bossIntroEmoji.style.display = 'none';
    }

    title.textContent = levelConfig.title;

    const description = typeof levelConfig.description === 'function'
        ? levelConfig.description(practiceQuestions.length)
        : levelConfig.description;
    desc.textContent = description;

    document.getElementById('level-badge').textContent = `Level ${currentLevel}`;
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
        generateQuestion();
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
function generateRandomQuestionFromType(questionType) {
    const qType = QUESTION_TYPES[questionType];
    const [rowMin, rowMax] = qType.rowRange;
    const [colMin, colMax] = qType.colRange;

    const row = Math.floor(Math.random() * (rowMax - rowMin + 1)) + rowMin;
    const col = Math.floor(Math.random() * (colMax - colMin + 1)) + colMin;
    const answer = qType.operationFn(row, col);

    return { row, col, answer };
}

function generateQuestion() {
    const levelConfig = LEVEL_CONFIG[currentLevel];
    const practiceType = PRACTICE_TYPES[levelConfig.practiceType];

    if (practiceType.questionSource === 'mixed') {
        const questionTypeKey = useSingleAdd ? 'single-add' : 'double-add';
        useSingleAdd = !useSingleAdd;

        currentQuestion = generateRandomQuestionFromType(questionTypeKey);
        const questionType = QUESTION_TYPES[questionTypeKey];

        document.getElementById('question').textContent = `What is ${currentQuestion.row} ${questionType.operationSymbol} ${currentQuestion.col}?`;
        document.getElementById('answer-input').value = '';
        document.getElementById('feedback').textContent = '';

        isCheckingAnswer = false;
        document.getElementById('answer-input').disabled = false;
        document.getElementById('answer-input').focus();
        startTimer();
        return;
    }

    const questionType = QUESTION_TYPES[levelConfig.questionType];

    const allRevealed = Object.values(cells).every(cell => cell.correctAnswers >= 2);
    if (allRevealed) {
        showCompletion();
        return;
    }

    if (practiceType.questionSource === 'random') {
        if (pendingRetry && questionsSinceLastMistake >= 2) {
            currentQuestion = pendingRetry;
            pendingRetry = null;
            questionsSinceLastMistake = 0;
        } else {
            currentQuestion = generateRandomQuestionFromType(levelConfig.questionType);
        }
    } else if (practiceType.questionSource === 'practice-set') {
        if (practiceQuestions.length === 0) {
            showCompletion();
            return;
        }

        const randomQ = practiceQuestions[Math.floor(Math.random() * practiceQuestions.length)];
        const answer = questionType.operationFn(randomQ.row, randomQ.col);
        currentQuestion = { row: randomQ.row, col: randomQ.col, answer: answer };
    }

    document.getElementById('question').textContent = `What is ${currentQuestion.row} ${questionType.operationSymbol} ${currentQuestion.col}?`;
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
    const isBossLevel = practiceType.questionSource === 'mixed';
    const isPathfindingLevel = levelConfig.practiceType === 'D';

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

            updateAdjacentTiles();
            pendingTileClick = null;

            setTimeout(() => {
                feedbackDiv.textContent = '';
                isCheckingAnswer = false;
                document.getElementById('answer-input').disabled = false;
                document.getElementById('answer-input').focus();
            }, 1000);
        } else if (!isCorrect && pendingTileClick) {
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

            updateAdjacentTiles();
            pendingTileClick = null;

            setTimeout(() => {
                feedbackDiv.textContent = '';
                isCheckingAnswer = false;
                document.getElementById('answer-input').disabled = false;
                document.getElementById('answer-input').focus();
            }, 1000);
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

            setTimeout(() => {
                isCheckingAnswer = false;
                document.getElementById('answer-input').disabled = false;
                document.getElementById('answer-input').focus();
                startTimer();
            }, 1000);
        }
        return;
    }

    const questionType = QUESTION_TYPES[levelConfig.questionType];

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

        const cellsPerAnswer = typeof practiceType.cellsPerAnswer === 'function'
            ? practiceType.cellsPerAnswer(practiceQuestions.length)
            : practiceType.cellsPerAnswer;

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

        const questionKey = `${currentQuestion.row}${questionType.operationSymbol}${currentQuestion.col}`;

        if (practiceType.questionSource === 'random') {
            if (!allTimesLog[questionKey]) allTimesLog[questionKey] = [];
            allTimesLog[questionKey].push(timeSpent);
        }

        if (timeSpent < 5) {
            if (!fastLog[questionKey]) fastLog[questionKey] = [];
            fastLog[questionKey].push(timeSpent);
        }

        if (timeSpent >= 20) {
            if (!slowLog[questionKey]) slowLog[questionKey] = [];
            slowLog[questionKey].push(timeSpent);
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

        const questionKey = `${currentQuestion.row}${questionType.operationSymbol}${currentQuestion.col}`;
        if (!mistakeLog[questionKey]) mistakeLog[questionKey] = 0;
        mistakeLog[questionKey]++;

        if (practiceType.requiresRetry) {
            if (!pendingRetry || (pendingRetry.row !== currentQuestion.row || pendingRetry.col !== currentQuestion.col)) {
                pendingRetry = { row: currentQuestion.row, col: currentQuestion.col, answer: currentQuestion.answer };
                questionsSinceLastMistake = 0;
            }
        }

        const cellsPerAnswer = typeof practiceType.cellsPerAnswer === 'function'
            ? practiceType.cellsPerAnswer(practiceQuestions.length)
            : practiceType.cellsPerAnswer;

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

// Practice Question Generation for Level 2 and Level 4
function generatePracticeQuestions(sourceLevel) {
    const sourceLevelConfig = LEVEL_CONFIG[sourceLevel];
    const targetLevel = sourceLevel + 1;
    const targetLevelConfig = LEVEL_CONFIG[targetLevel];
    const practiceType = PRACTICE_TYPES[targetLevelConfig.practiceType];
    const questionType = QUESTION_TYPES[sourceLevelConfig.questionType];

    const mistakeLogVar = sourceLevel === 1 ? level1MistakeLog : level4MistakeLog;
    const slowLogVar = sourceLevel === 1 ? level1SlowLog : level4SlowLog;

    const questions = [];
    const questionSet = new Set();

    const operationSymbol = questionType.operationSymbol;

    for (const questionKey in mistakeLogVar) {
        const [row, col] = questionKey.split(operationSymbol).map(Number);
        const key = `${row}-${col}`;
        if (!questionSet.has(key)) {
            questions.push({ row, col });
            questionSet.add(key);
        }
    }

    for (const questionKey in slowLogVar) {
        const [row, col] = questionKey.split(operationSymbol).map(Number);
        const key = `${row}-${col}`;
        if (!questionSet.has(key)) {
            questions.push({ row, col });
            questionSet.add(key);
        }
    }

    if (questions.length < practiceType.minQuestions) {
        const avgTimes = [];
        for (const questionKey in allTimesLog) {
            const times = allTimesLog[questionKey];
            const avgTime = times.reduce((sum, t) => sum + t, 0) / times.length;
            const [row, col] = questionKey.split(operationSymbol).map(Number);
            const key = `${row}-${col}`;

            if (!questionSet.has(key)) {
                avgTimes.push({ row, col, avgTime, key });
            }
        }

        avgTimes.sort((a, b) => b.avgTime - a.avgTime);

        const needed = practiceType.minQuestions - questions.length;
        for (let i = 0; i < Math.min(needed, avgTimes.length); i++) {
            questions.push({ row: avgTimes[i].row, col: avgTimes[i].col });
            questionSet.add(avgTimes[i].key);
        }
    }

    return questions;
}

// Level Completion
function showCompletion() {
    stopTimer();
    playCompletionSound();

    saveHighestLevel(currentLevel);

    addToCollection(currentBg.emoji, currentBg.name);

    const levelConfig = LEVEL_CONFIG[currentLevel];

    if (levelConfig.sourceLevel === null) {
        if (currentLevel === 1) {
            level1MistakeLog = { ...mistakeLog };
            level1SlowLog = { ...slowLog };
        } else if (currentLevel === 4) {
            level4MistakeLog = { ...mistakeLog };
            level4SlowLog = { ...slowLog };
        }

        const nextLevel = currentLevel + 1;
        if (LEVEL_CONFIG[nextLevel]) {
            practiceQuestions = generatePracticeQuestions(currentLevel);
        }
    }

    document.getElementById('question-box').style.display = 'none';
    document.getElementById('completion').style.display = 'block';
    document.getElementById('completion-text').textContent = `You revealed the ${currentBg.name}!`;
    document.getElementById('new-collectible').textContent = currentBg.emoji;

    const nextLevelBtn = document.getElementById('next-level-button');
    const nextLevel = currentLevel + 1;
    if (LEVEL_CONFIG[nextLevel] && (levelConfig.sourceLevel === null ? practiceQuestions.length > 0 : true)) {
        nextLevelBtn.style.display = 'inline-block';
    } else {
        nextLevelBtn.style.display = 'none';
    }

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

    if (totalMistakes > 0) {
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
    showLevelIntro();
    createGrid();
    populateCollectibleSelector();
});
