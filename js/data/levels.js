/**
 * data/levels.js
 *
 * Level configuration and question types
 * - Practice type definitions (A, B, C)
 * - Question type configurations (single-add, double-add, etc.)
 * - Level configurations (1-5)
 *
 * Dependencies: None
 */

(function() {
    'use strict';

    window.Game = window.Game || {};

    // Practice type definitions
    Game.PRACTICE_TYPES = {
        A: {
            name: 'Practice',
            cellsPerAnswer: 6,
            requiresRetry: true,
            questionSource: 'random'
        },
        B: {
            name: 'Challenge Review',
            cellsPerAnswer: (totalQuestions) => Math.ceil(64 / totalQuestions),
            requiresRetry: false,
            questionSource: 'practice-set',
            minQuestions: 10
        },
        C: {
            name: 'Boss Challenge',
            cellsPerAnswer: 4,
            requiresRetry: true,
            questionSource: 'mixed',
            timeLimit: null
        }
    };

    // Question type configurations
    Game.QUESTION_TYPES = {
        'single-add': {
            operation: '+',
            operationFn: (a, b) => a + b,
            rowRange: [2, 10],
            colRange: [2, 10],
            label: 'Single-Digit Addition',
            operationSymbol: '+'
        },
        'double-add': {
            operation: '+',
            operationFn: (a, b) => a + b,
            rowRange: [11, 90],
            colRange: [2, 9],
            label: 'Double-Digit Addition',
            operationSymbol: '+'
        },
        'single-sub': {
            operation: '-',
            operationFn: (a, b) => a - b,
            rowRange: [2, 10],
            colRange: [2, 10],
            label: 'Single-Digit Subtraction',
            operationSymbol: '-'
        },
        'double-sub': {
            operation: '-',
            operationFn: (a, b) => a - b,
            rowRange: [11, 90],
            colRange: [2, 9],
            label: 'Double-Digit Subtraction',
            operationSymbol: '-'
        },
        'mixed-add': {
            operation: '+',
            operationFn: (a, b) => a + b,
            rowRange: [2, 90],
            colRange: [2, 10],
            label: 'Mixed Addition',
            operationSymbol: '+'
        },
        'mixed-sub': {
            operation: '-',
            operationFn: (a, b) => a - b,
            rowRange: [2, 90],
            colRange: [2, 10],
            label: 'Mixed Subtraction',
            operationSymbol: '-'
        }
    };

    // Level configurations
    Game.LEVEL_CONFIG = {
        1: {
            practiceType: 'A',
            questionType: 'single-add',
            theme: 'purple',
            sourceLevel: null,
            title: 'LEVEL 1',
            description: 'Practice Addition!'
        },
        2: {
            practiceType: 'B',
            questionType: 'single-add',
            theme: 'orange',
            sourceLevel: 1,
            title: 'LEVEL 2',
            description: (numQuestions) => `Practice ${numQuestions} Challenging Questions!`
        },
        3: {
            practiceType: 'A',
            questionType: 'double-add',
            theme: 'green',
            sourceLevel: null,
            title: 'LEVEL 3',
            description: 'Double Digit Addition!'
        },
        4: {
            practiceType: 'B',
            questionType: 'double-add',
            theme: 'indigo',
            sourceLevel: 3,
            title: 'LEVEL 4',
            description: (numQuestions) => `Practice ${numQuestions} Challenging Questions!`
        },
        5: {
            practiceType: 'C',
            questionType: 'mixed',
            theme: 'red',
            sourceLevel: null,
            title: 'BOSS LEVEL 5',
            description: 'Defeat the Boss!'
        }
    };

})();
