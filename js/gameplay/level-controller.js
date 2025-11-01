/**
 * gameplay/level-controller.js
 *
 * Level initialization and progression
 * - Level initialization
 * - Starting levels
 * - Level transitions
 *
 * Dependencies: core/game-state.js, data/levels.js, gameplay/picture-reveal.js,
 *               gameplay/boss-battle.js, core/question-generator.js, data/pictures.js
 */

(function() {
    'use strict';

    window.Game = window.Game || {};

    /**
     * Initializes the current level's state
     */
    Game.initializeLevel = function() {
        const cells = {};

        for (let row = Game.GRID_OFFSET; row < Game.GRID_SIZE + Game.GRID_OFFSET; row++) {
            for (let col = Game.GRID_OFFSET; col < Game.GRID_SIZE + Game.GRID_OFFSET; col++) {
                cells[`${row}-${col}`] = { correctAnswers: 0, completed: false };
            }
        }
        Game.setCells(cells);
        Game.setCellsDiscovered(0);

        Game.setTotalMistakes(0);
        Game.setMistakeLog({});
        Game.setSlowLog({});
        Game.setFastLog({});

        const currentLevel = Game.getCurrentLevel();
        const levelConfig = Game.LEVEL_CONFIG[currentLevel];
        const practiceType = Game.PRACTICE_TYPES[levelConfig.practiceType];

        if (practiceType.questionSource === 'random') {
            Game.setAllTimesLog({});
        }
        Game.setQuestionsSinceLastMistake(0);
        Game.setPendingRetry(null);

        const progressText = document.getElementById('progress-text');
        const mistakesText = document.getElementById('mistakes-text');
        if (progressText) progressText.textContent = '0/64 Cells Discovered!';
        if (mistakesText) mistakesText.textContent = 'Mistakes: 0';
    };

    /**
     * Starts the current level
     */
    Game.startLevel = function() {
        const levelIntro = document.getElementById('level-intro');
        if (levelIntro) {
            levelIntro.classList.remove('visible');
        }

        const currentLevel = Game.getCurrentLevel();
        const levelConfig = Game.LEVEL_CONFIG[currentLevel];
        const isBossLevel = levelConfig.practiceType === 'C';

        const gameBoard = document.getElementById('game-board');
        const bossArena = document.getElementById('boss-arena');

        if (isBossLevel) {
            if (gameBoard) gameBoard.style.display = 'none';
            if (bossArena) bossArena.style.display = 'block';
            const progressText = document.getElementById('progress-text');
            if (progressText) progressText.textContent = 'Boss Battle!';
            Game.initializeBossBattle();
        } else {
            if (gameBoard) gameBoard.style.display = 'block';
            if (bossArena) bossArena.style.display = 'none';

            const currentBg = Game.selectRandomBackground();
            Game.setCurrentBg(currentBg);

            const background = document.getElementById('background');
            const emoji = document.getElementById('emoji');
            if (background) background.style.background = currentBg.gradient;
            if (emoji) emoji.textContent = currentBg.emoji;

            Game.initializeLevel();
            Game.createGrid();
        }

        Game.generateQuestion();
    };

    /**
     * Advances to the next level
     */
    Game.goToNextLevel = function() {
        const currentLevel = Game.getCurrentLevel();
        const nextLevel = currentLevel + 1;
        if (Game.LEVEL_CONFIG[nextLevel]) {
            Game.setCurrentLevel(nextLevel);
        }

        Game.stopBackgroundMusic();
        const bossMovementInterval = Game.getBossMovementInterval();
        if (bossMovementInterval) {
            clearInterval(bossMovementInterval);
        }

        const completion = document.getElementById('completion');
        const questionBox = document.getElementById('question-box');
        if (completion) completion.style.display = 'none';
        if (questionBox) questionBox.style.display = 'block';

        Game.showLevelIntro();
    };

})();
