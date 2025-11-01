/**
 * core/game-state.js
 *
 * Central game state management
 * - All game state variables
 * - State getters and setters
 *
 * Dependencies: None
 */

(function() {
    'use strict';

    window.Game = window.Game || {};

    // Game state variables
    const gameState = {
        currentLevel: 1,
        currentBg: null,
        cells: {},
        currentQuestion: null,
        cellsDiscovered: 0,
        totalMistakes: 0,
        mistakeLog: {},
        slowLog: {},
        fastLog: {},
        allTimesLog: {},
        level1MistakeLog: {},
        level1SlowLog: {},
        level3MistakeLog: {},
        level3SlowLog: {},
        practiceQuestions: [],
        questionsSinceLastMistake: 0,
        pendingRetry: null,
        questionStartTime: null,
        timerInterval: null,
        audioContext: null,
        isPaused: false,
        isCheckingAnswer: false,
        lastAnswerSubmitTime: 0,
        pausedTime: 0,
        bossPosition: 50,
        bossMovementInterval: null,
        bossStartTime: null,
        useSingleAdd: true,
        backgroundMusicInterval: null,
        backgroundMusicOscillators: []
    };

    // State getters
    Game.getCurrentLevel = function() { return gameState.currentLevel; };
    Game.getCurrentBg = function() { return gameState.currentBg; };
    Game.getCells = function() { return gameState.cells; };
    Game.getCurrentQuestion = function() { return gameState.currentQuestion; };
    Game.getCellsDiscovered = function() { return gameState.cellsDiscovered; };
    Game.getTotalMistakes = function() { return gameState.totalMistakes; };
    Game.getMistakeLog = function() { return gameState.mistakeLog; };
    Game.getSlowLog = function() { return gameState.slowLog; };
    Game.getFastLog = function() { return gameState.fastLog; };
    Game.getAllTimesLog = function() { return gameState.allTimesLog; };
    Game.getLevel1MistakeLog = function() { return gameState.level1MistakeLog; };
    Game.getLevel1SlowLog = function() { return gameState.level1SlowLog; };
    Game.getLevel3MistakeLog = function() { return gameState.level3MistakeLog; };
    Game.getLevel3SlowLog = function() { return gameState.level3SlowLog; };
    Game.getPracticeQuestions = function() { return gameState.practiceQuestions; };
    Game.getQuestionsSinceLastMistake = function() { return gameState.questionsSinceLastMistake; };
    Game.getPendingRetry = function() { return gameState.pendingRetry; };
    Game.getQuestionStartTime = function() { return gameState.questionStartTime; };
    Game.getTimerInterval = function() { return gameState.timerInterval; };
    Game.getAudioContext = function() { return gameState.audioContext; };
    Game.getIsPaused = function() { return gameState.isPaused; };
    Game.getIsCheckingAnswer = function() { return gameState.isCheckingAnswer; };
    Game.getLastAnswerSubmitTime = function() { return gameState.lastAnswerSubmitTime; };
    Game.getPausedTime = function() { return gameState.pausedTime; };
    Game.getBossPosition = function() { return gameState.bossPosition; };
    Game.getBossMovementInterval = function() { return gameState.bossMovementInterval; };
    Game.getBossStartTime = function() { return gameState.bossStartTime; };
    Game.getUseSingleAdd = function() { return gameState.useSingleAdd; };
    Game.getBackgroundMusicInterval = function() { return gameState.backgroundMusicInterval; };
    Game.getBackgroundMusicOscillators = function() { return gameState.backgroundMusicOscillators; };

    // State setters
    Game.setCurrentLevel = function(value) { gameState.currentLevel = value; };
    Game.setCurrentBg = function(value) { gameState.currentBg = value; };
    Game.setCells = function(value) { gameState.cells = value; };
    Game.setCurrentQuestion = function(value) { gameState.currentQuestion = value; };
    Game.setCellsDiscovered = function(value) { gameState.cellsDiscovered = value; };
    Game.setTotalMistakes = function(value) { gameState.totalMistakes = value; };
    Game.setMistakeLog = function(value) { gameState.mistakeLog = value; };
    Game.setSlowLog = function(value) { gameState.slowLog = value; };
    Game.setFastLog = function(value) { gameState.fastLog = value; };
    Game.setAllTimesLog = function(value) { gameState.allTimesLog = value; };
    Game.setLevel1MistakeLog = function(value) { gameState.level1MistakeLog = value; };
    Game.setLevel1SlowLog = function(value) { gameState.level1SlowLog = value; };
    Game.setLevel3MistakeLog = function(value) { gameState.level3MistakeLog = value; };
    Game.setLevel3SlowLog = function(value) { gameState.level3SlowLog = value; };
    Game.setPracticeQuestions = function(value) { gameState.practiceQuestions = value; };
    Game.setQuestionsSinceLastMistake = function(value) { gameState.questionsSinceLastMistake = value; };
    Game.setPendingRetry = function(value) { gameState.pendingRetry = value; };
    Game.setQuestionStartTime = function(value) { gameState.questionStartTime = value; };
    Game.setTimerInterval = function(value) { gameState.timerInterval = value; };
    Game.setAudioContext = function(value) { gameState.audioContext = value; };
    Game.setIsPaused = function(value) { gameState.isPaused = value; };
    Game.setIsCheckingAnswer = function(value) { gameState.isCheckingAnswer = value; };
    Game.setLastAnswerSubmitTime = function(value) { gameState.lastAnswerSubmitTime = value; };
    Game.setPausedTime = function(value) { gameState.pausedTime = value; };
    Game.setBossPosition = function(value) { gameState.bossPosition = value; };
    Game.setBossMovementInterval = function(value) { gameState.bossMovementInterval = value; };
    Game.setBossStartTime = function(value) { gameState.bossStartTime = value; };
    Game.setUseSingleAdd = function(value) { gameState.useSingleAdd = value; };
    Game.setBackgroundMusicInterval = function(value) { gameState.backgroundMusicInterval = value; };
    Game.setBackgroundMusicOscillators = function(value) { gameState.backgroundMusicOscillators = value; };

    // Convenience methods for modifying state
    Game.incrementTotalMistakes = function() { gameState.totalMistakes++; };
    Game.incrementCellsDiscovered = function() { gameState.cellsDiscovered++; };
    Game.decrementCellsDiscovered = function() { gameState.cellsDiscovered--; };
    Game.incrementQuestionsSinceLastMistake = function() { gameState.questionsSinceLastMistake++; };
    Game.incrementPausedTime = function(value) { gameState.pausedTime += value; };

})();
