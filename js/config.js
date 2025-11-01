/**
 * config.js
 *
 * Configuration constants and global settings
 * - Grid dimensions and game parameters
 * - URL parameter parsing for test mode
 */

(function() {
    'use strict';

    // Initialize global Game namespace
    window.Game = window.Game || {};

    // Grid configuration
    Game.GRID_SIZE = 8;
    Game.GRID_OFFSET = 2;
    Game.CELLS_PER_ANSWER = 6;
    Game.MIN_LEVEL_2_QUESTIONS = 10;
    Game.MIN_LEVEL_4_QUESTIONS = 10;

    // Parse URL parameters for test mode
    const urlParams = new URLSearchParams(window.location.search);
    Game.testMode = urlParams.get('test') === 'true';

    // Initialize test mode UI if enabled
    if (Game.testMode) {
        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', function() {
                const testPanel = document.getElementById('test-panel');
                if (testPanel) {
                    testPanel.classList.add('visible');
                }
            });
        } else {
            const testPanel = document.getElementById('test-panel');
            if (testPanel) {
                testPanel.classList.add('visible');
            }
        }
    }

})();
