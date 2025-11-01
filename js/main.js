/**
 * main.js
 *
 * Main game controller and initialization
 * - Answer checking logic
 * - Event listeners
 * - Game initialization
 * - Restart functionality
 *
 * Dependencies: All other modules
 */

(function() {
    'use strict';

    window.Game = window.Game || {};

    /**
     * Checks the user's answer
     */
    Game.checkAnswer = function() {
        // Prevent multiple rapid submissions with timestamp check (300ms debounce)
        const now = Date.now();
        const isPaused = Game.getIsPaused();
        const isCheckingAnswer = Game.getIsCheckingAnswer();
        const lastAnswerSubmitTime = Game.getLastAnswerSubmitTime();

        if (isPaused || isCheckingAnswer || (now - lastAnswerSubmitTime) < 300) return;

        Game.initAudio();
        const answerInput = document.getElementById('answer-input');
        const userAnswer = parseInt(answerInput.value);
        const currentQuestion = Game.getCurrentQuestion();
        if (!currentQuestion || isNaN(userAnswer)) return;

        // Prevent multiple submissions and clear input immediately
        Game.setIsCheckingAnswer(true);
        Game.setLastAnswerSubmitTime(now);
        answerInput.disabled = true;
        answerInput.value = '';

        const currentLevel = Game.getCurrentLevel();
        const levelConfig = Game.LEVEL_CONFIG[currentLevel];
        const practiceType = Game.PRACTICE_TYPES[levelConfig.practiceType];
        const isBossLevel = practiceType.questionSource === 'mixed';

        const timeSpent = Game.stopTimer();
        const isCorrect = userAnswer === currentQuestion.answer;
        const feedbackDiv = document.getElementById('feedback');

        if (isBossLevel) {
            if (isCorrect) {
                if (feedbackDiv) {
                    feedbackDiv.textContent = '✨ Correct! Great job!';
                    feedbackDiv.className = 'feedback correct';
                }
                Game.playSuccessSound();

                Game.throwBombAtBoss();
                setTimeout(() => {
                    Game.moveBossAway();
                }, 400);

                setTimeout(Game.generateQuestion, 1200);
            } else {
                if (feedbackDiv) {
                    feedbackDiv.textContent = '🤔 Not quite! Try again!';
                    feedbackDiv.className = 'feedback incorrect';
                }
                Game.playFailSound();

                Game.throwBombMiss();

                Game.incrementTotalMistakes();
                const mistakesText = document.getElementById('mistakes-text');
                if (mistakesText) mistakesText.textContent = `Mistakes: ${Game.getTotalMistakes()}`;

                setTimeout(() => {
                    // Re-enable input for retry
                    Game.setIsCheckingAnswer(false);
                    document.getElementById('answer-input').disabled = false;
                    document.getElementById('answer-input').focus();
                    Game.startTimer();
                }, 1000);
            }
            return;
        }

        const questionType = Game.QUESTION_TYPES[levelConfig.questionType];
        const cells = Game.getCells();

        if (isCorrect) {
            if (feedbackDiv) {
                feedbackDiv.textContent = '✨ Correct! Great job!';
                feedbackDiv.className = 'feedback correct';
            }

            const canProgress = Object.keys(cells).filter(key => cells[key].correctAnswers < 2);

            if (canProgress.length === 0) {
                Game.playSuccessSound();
                setTimeout(() => {
                    Game.showCompletion();
                }, 1000);
                return;
            }

            const cellsPerAnswer = typeof practiceType.cellsPerAnswer === 'function'
                ? practiceType.cellsPerAnswer(Game.getPracticeQuestions().length)
                : practiceType.cellsPerAnswer;

            const shuffled = canProgress.sort(() => Math.random() - 0.5);
            const numToProgress = Math.min(cellsPerAnswer, canProgress.length);

            let newlyCompleted = 0;
            for (let i = 0; i < numToProgress; i++) {
                const cellKey = shuffled[i];
                cells[cellKey].correctAnswers++;

                if (cells[cellKey].correctAnswers >= 2) {
                    cells[cellKey].completed = true;
                    Game.incrementCellsDiscovered();
                    newlyCompleted++;
                }

                Game.updateCell(cellKey);
            }

            if (newlyCompleted > 0) {
                Game.playCellRevealSound();
            } else {
                Game.playSuccessSound();
            }

            const cellsDiscovered = Game.getCellsDiscovered();
            const progressText = document.getElementById('progress-text');
            if (progressText) progressText.textContent = `${cellsDiscovered}/64 Cells Discovered!`;

            const questionKey = `${currentQuestion.row}${questionType.operationSymbol}${currentQuestion.col}`;

            if (practiceType.questionSource === 'random') {
                const allTimesLog = Game.getAllTimesLog();
                if (!allTimesLog[questionKey]) allTimesLog[questionKey] = [];
                allTimesLog[questionKey].push(timeSpent);
            }

            if (timeSpent < 5) {
                const fastLog = Game.getFastLog();
                if (!fastLog[questionKey]) fastLog[questionKey] = [];
                fastLog[questionKey].push(timeSpent);
            }

            if (timeSpent >= 20) {
                const slowLog = Game.getSlowLog();
                if (!slowLog[questionKey]) slowLog[questionKey] = [];
                slowLog[questionKey].push(timeSpent);
            }

            if (practiceType.requiresRetry) {
                Game.incrementQuestionsSinceLastMistake();
            }

            setTimeout(Game.generateQuestion, 1000);
        } else {
            if (feedbackDiv) {
                feedbackDiv.textContent = '🤔 Not quite! Try again!';
                feedbackDiv.className = 'feedback incorrect';
            }

            Game.playFailSound();

            Game.incrementTotalMistakes();
            const totalMistakes = Game.getTotalMistakes();
            const mistakesText = document.getElementById('mistakes-text');
            if (mistakesText) mistakesText.textContent = `Mistakes: ${totalMistakes}`;

            const questionKey = `${currentQuestion.row}${questionType.operationSymbol}${currentQuestion.col}`;
            const mistakeLog = Game.getMistakeLog();
            if (!mistakeLog[questionKey]) mistakeLog[questionKey] = 0;
            mistakeLog[questionKey]++;

            if (practiceType.requiresRetry) {
                const pendingRetry = Game.getPendingRetry();
                if (!pendingRetry || (pendingRetry.row !== currentQuestion.row || pendingRetry.col !== currentQuestion.col)) {
                    Game.setPendingRetry({ row: currentQuestion.row, col: currentQuestion.col, answer: currentQuestion.answer });
                    Game.setQuestionsSinceLastMistake(0);
                }
            }

            const cellsPerAnswer = typeof practiceType.cellsPerAnswer === 'function'
                ? practiceType.cellsPerAnswer(Game.getPracticeQuestions().length)
                : practiceType.cellsPerAnswer;

            const canRegress = Object.keys(cells).filter(key => cells[key].correctAnswers > 0);

            if (canRegress.length > 0) {
                const shuffled = canRegress.sort(() => Math.random() - 0.5);
                const numToRegress = Math.min(cellsPerAnswer, canRegress.length);

                for (let i = 0; i < numToRegress; i++) {
                    const cellKey = shuffled[i];

                    if (cells[cellKey].correctAnswers === 2) {
                        cells[cellKey].completed = false;
                        Game.decrementCellsDiscovered();
                    }

                    cells[cellKey].correctAnswers = Math.max(0, cells[cellKey].correctAnswers - 1);
                    Game.updateCell(cellKey);
                }
            }

            const cellsDiscovered = Game.getCellsDiscovered();
            const progressText = document.getElementById('progress-text');
            if (progressText) progressText.textContent = `${cellsDiscovered}/64 Cells Discovered!`;

            // Re-enable input for retry
            Game.setIsCheckingAnswer(false);
            document.getElementById('answer-input').disabled = false;
            document.getElementById('answer-input').focus();

            Game.startTimer();
        }
    };

    /**
     * Restarts the current level
     */
    Game.restartGame = function() {
        if (confirm('Are you sure you want to restart this level? Your current progress will be lost.')) {
            Game.stopTimer();
            const bossMovementInterval = Game.getBossMovementInterval();
            if (bossMovementInterval) clearInterval(bossMovementInterval);
            Game.stopBackgroundMusic();
            Game.setIsPaused(false);

            const overlay = document.getElementById('paused-overlay');
            const pauseButton = document.getElementById('pause-button');
            if (overlay) overlay.classList.remove('visible');
            if (pauseButton) pauseButton.textContent = '⏸️ Pause';

            const completion = document.getElementById('completion');
            const questionBox = document.getElementById('question-box');
            if (completion) completion.style.display = 'none';
            if (questionBox) questionBox.style.display = 'block';

            Game.showLevelIntro();
        }
    };

    /**
     * Initialize game when DOM is ready
     */
    function initGame() {
        // Set up event listeners
        const answerInput = document.getElementById('answer-input');
        if (answerInput) {
            answerInput.addEventListener('keypress', function(e) {
                if (e.key === 'Enter') {
                    // Prevent multiple rapid submissions
                    if (Game.getIsCheckingAnswer() || Game.getIsPaused()) {
                        e.preventDefault();
                        return;
                    }
                    e.preventDefault();
                    Game.checkAnswer();
                }
            });
        }

        // Panic button: Press R to toggle test panel visibility instantly (test mode only)
        document.addEventListener('keydown', function(e) {
            if ((e.key === 'r' || e.key === 'R') && Game.testMode) {
                const testPanel = document.getElementById('test-panel');
                if (testPanel) {
                    testPanel.classList.toggle('visible');
                }
            }
        });

        // Initialize UI
        Game.updateCollectionCount();
        Game.showLevelIntro();
        Game.createGrid();
        Game.populateCollectibleSelector();
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initGame);
    } else {
        initGame();
    }

})();
