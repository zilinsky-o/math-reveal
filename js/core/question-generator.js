/**
 * core/question-generator.js
 *
 * Question generation logic
 * - Generate random questions based on type
 * - Generate practice questions from previous levels
 * - Main question generation controller
 *
 * Dependencies: data/levels.js, core/game-state.js, ui/modals.js
 */

(function() {
    'use strict';

    window.Game = window.Game || {};

    /**
     * Generates a random question from a specific question type
     */
    Game.generateRandomQuestionFromType = function(questionType) {
        const qType = Game.QUESTION_TYPES[questionType];
        const [rowMin, rowMax] = qType.rowRange;
        const [colMin, colMax] = qType.colRange;

        const row = Math.floor(Math.random() * (rowMax - rowMin + 1)) + rowMin;
        const col = Math.floor(Math.random() * (colMax - colMin + 1)) + colMin;
        const answer = qType.operationFn(row, col);

        return { row, col, answer };
    };

    /**
     * Generates practice questions from a source level's mistakes and slow answers
     */
    Game.generatePracticeQuestions = function(sourceLevel) {
        const sourceLevelConfig = Game.LEVEL_CONFIG[sourceLevel];
        const targetLevel = sourceLevel + 1;
        const targetLevelConfig = Game.LEVEL_CONFIG[targetLevel];
        const practiceType = Game.PRACTICE_TYPES[targetLevelConfig.practiceType];
        const questionType = Game.QUESTION_TYPES[sourceLevelConfig.questionType];

        const mistakeLogVar = sourceLevel === 1 ? Game.getLevel1MistakeLog() : Game.getLevel3MistakeLog();
        const slowLogVar = sourceLevel === 1 ? Game.getLevel1SlowLog() : Game.getLevel3SlowLog();

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
            const allTimesLog = Game.getAllTimesLog();
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
    };

    /**
     * Main question generation controller
     * Generates the next question based on level type and practice mode
     */
    Game.generateQuestion = function() {
        const currentLevel = Game.getCurrentLevel();
        const levelConfig = Game.LEVEL_CONFIG[currentLevel];
        const practiceType = Game.PRACTICE_TYPES[levelConfig.practiceType];

        if (practiceType.questionSource === 'mixed') {
            const questionTypeKey = Game.getUseSingleAdd() ? 'single-add' : 'double-add';
            Game.setUseSingleAdd(!Game.getUseSingleAdd());

            const currentQuestion = Game.generateRandomQuestionFromType(questionTypeKey);
            Game.setCurrentQuestion(currentQuestion);
            const questionType = Game.QUESTION_TYPES[questionTypeKey];

            document.getElementById('question').textContent = `What is ${currentQuestion.row} ${questionType.operationSymbol} ${currentQuestion.col}?`;
            document.getElementById('answer-input').value = '';
            document.getElementById('feedback').textContent = '';

            // Re-enable input for new question
            Game.setIsCheckingAnswer(false);
            document.getElementById('answer-input').disabled = false;
            document.getElementById('answer-input').focus();
            Game.startTimer();
            return;
        }

        const questionType = Game.QUESTION_TYPES[levelConfig.questionType];
        const cells = Game.getCells();

        const allRevealed = Object.values(cells).every(cell => cell.correctAnswers >= 2);
        if (allRevealed) {
            Game.showCompletion();
            return;
        }

        if (practiceType.questionSource === 'random') {
            const pendingRetry = Game.getPendingRetry();
            const questionsSinceLastMistake = Game.getQuestionsSinceLastMistake();

            if (pendingRetry && questionsSinceLastMistake >= 2) {
                Game.setCurrentQuestion(pendingRetry);
                Game.setPendingRetry(null);
                Game.setQuestionsSinceLastMistake(0);
            } else {
                const currentQuestion = Game.generateRandomQuestionFromType(levelConfig.questionType);
                Game.setCurrentQuestion(currentQuestion);
            }
        } else if (practiceType.questionSource === 'practice-set') {
            const practiceQuestions = Game.getPracticeQuestions();
            if (practiceQuestions.length === 0) {
                Game.showCompletion();
                return;
            }

            const randomQ = practiceQuestions[Math.floor(Math.random() * practiceQuestions.length)];
            const answer = questionType.operationFn(randomQ.row, randomQ.col);
            Game.setCurrentQuestion({ row: randomQ.row, col: randomQ.col, answer: answer });
        }

        const currentQuestion = Game.getCurrentQuestion();
        document.getElementById('question').textContent = `What is ${currentQuestion.row} ${questionType.operationSymbol} ${currentQuestion.col}?`;
        document.getElementById('answer-input').value = '';
        document.getElementById('feedback').textContent = '';

        // Re-enable input for new question
        Game.setIsCheckingAnswer(false);
        document.getElementById('answer-input').disabled = false;
        document.getElementById('answer-input').focus();
        Game.startTimer();
    };

})();
