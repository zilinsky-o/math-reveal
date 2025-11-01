/**
 * test-mode.js
 *
 * Test mode and debugging functions
 * - Reveal all cells (cheat)
 * - Jump to specific level
 * - Add test collectibles
 * - Test panel initialization
 *
 * Dependencies: core/game-state.js, gameplay/picture-reveal.js, ui/modals.js,
 *               data/collectibles.js, core/storage.js
 */

(function() {
    'use strict';

    window.Game = window.Game || {};

    /**
     * Reveals all cells instantly (test mode only)
     */
    Game.revealAll = function() {
        if (!confirm('This will complete all remaining cells and end the game. Continue?')) {
            return;
        }

        Game.stopBackgroundMusic();
        const bossMovementInterval = Game.getBossMovementInterval();
        if (bossMovementInterval) clearInterval(bossMovementInterval);

        const cells = Game.getCells();
        for (let key in cells) {
            if (!cells[key].completed) {
                cells[key].correctAnswers = 2;
                cells[key].completed = true;
                Game.updateCell(key);
            }
        }

        Game.setCellsDiscovered(64);
        const progressText = document.getElementById('progress-text');
        if (progressText) progressText.textContent = '64/64 Cells Discovered!';
        Game.showCompletion();
    };

    /**
     * Jumps to a specific level (test mode only)
     */
    Game.jumpToLevel = function(level) {
        if (!Game.testMode) return;

        const resetSelector = () => {
            const selector = document.getElementById('level-selector');
            if (selector) selector.value = Game.getCurrentLevel();
        };

        if (level === 2 || level === 4) {
            const level1MistakeLog = Game.getLevel1MistakeLog();
            const level3MistakeLog = Game.getLevel3MistakeLog();

            if (level === 2 && (!level1MistakeLog || Object.keys(level1MistakeLog).length === 0)) {
                alert('Level 2 requires completing Level 1 first to generate practice questions.');
                resetSelector();
                return;
            }
            if (level === 4 && (!level3MistakeLog || Object.keys(level3MistakeLog).length === 0)) {
                alert('Level 4 requires completing Level 3 first to generate practice questions.');
                resetSelector();
                return;
            }
        }

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

        Game.setCurrentLevel(level);
        Game.showLevelIntro();
    };

    /**
     * Populates the collectible selector dropdown (test mode only)
     */
    Game.populateCollectibleSelector = function() {
        if (!Game.testMode) return;

        const selector = document.getElementById('collectible-selector');
        if (!selector) return;

        const sortedAnimals = [...Game.COLLECTIBLES].sort((a, b) => a.name.localeCompare(b.name));

        sortedAnimals.forEach(animal => {
            const option = document.createElement('option');
            option.value = animal.emoji;
            option.textContent = `${animal.emoji} ${animal.name} (${Game.rarityLabels[animal.baseRarity]})`;
            selector.appendChild(option);
        });
    };

    /**
     * Adds a test collectible to the collection (test mode only)
     */
    Game.addTestCollectible = function() {
        if (!Game.testMode) return;

        const selector = document.getElementById('collectible-selector');
        if (!selector || !selector.value) return;

        const selectedEmoji = selector.value;
        const animal = Game.COLLECTIBLES.find(bg => bg.emoji === selectedEmoji);

        if (animal) {
            Game.addToCollection(animal.emoji, animal.name);

            const collectionBadge = document.getElementById('collection-count');
            if (collectionBadge) {
                collectionBadge.style.transform = 'scale(1.2)';
                collectionBadge.style.transition = 'transform 0.2s';
                setTimeout(() => {
                    collectionBadge.style.transform = 'scale(1)';
                }, 200);
            }
        }
    };

})();
