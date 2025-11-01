/**
 * gameplay/performance-tracker.js
 *
 * Performance tracking and analysis
 * - Mistake tracking
 * - Time tracking (fast/slow questions)
 * - Timer management
 *
 * Dependencies: core/game-state.js, ui/ui-controller.js
 */

(function() {
    'use strict';

    window.Game = window.Game || {};

    /**
     * Starts the question timer
     */
    Game.startTimer = function() {
        Game.setQuestionStartTime(Date.now());
        Game.setPausedTime(0);

        const oldInterval = Game.getTimerInterval();
        if (oldInterval) clearInterval(oldInterval);

        const interval = setInterval(Game.updateTimer, 1000);
        Game.setTimerInterval(interval);
        Game.updateTimer();
    };

    /**
     * Stops the timer and returns elapsed time
     */
    Game.stopTimer = function() {
        const interval = Game.getTimerInterval();
        if (interval) {
            clearInterval(interval);
            Game.setTimerInterval(null);
        }

        const questionStartTime = Game.getQuestionStartTime();
        const pausedTime = Game.getPausedTime();
        return questionStartTime ? Math.floor((Date.now() - questionStartTime - pausedTime) / 1000) : 0;
    };

    /**
     * Toggles pause state
     */
    Game.togglePause = function() {
        const isPaused = Game.getIsPaused();
        Game.setIsPaused(!isPaused);

        const overlay = document.getElementById('paused-overlay');
        const pauseButton = document.getElementById('pause-button');

        if (!isPaused) {
            if (overlay) overlay.classList.add('visible');
            if (pauseButton) {
                pauseButton.textContent = '▶️ Resume';
                const pauseStart = Date.now();
                pauseButton.dataset.pauseStart = pauseStart;
            }
        } else {
            if (overlay) overlay.classList.remove('visible');
            if (pauseButton) {
                pauseButton.textContent = '⏸️ Pause';
                const pauseDuration = Date.now() - parseInt(pauseButton.dataset.pauseStart);
                Game.incrementPausedTime(pauseDuration);
                Game.updateTimer();
            }
        }
    };

})();
