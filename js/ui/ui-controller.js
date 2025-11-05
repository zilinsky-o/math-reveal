/**
 * ui/ui-controller.js
 *
 * UI update and DOM manipulation functions
 * - Collection count updates
 * - Collectibles pane management
 * - Timer display
 * - Boss progress bar
 *
 * Dependencies: core/storage.js, data/collectibles.js
 */

(function() {
    'use strict';

    window.Game = window.Game || {};

    /**
     * Updates the collection count display
     */
    Game.updateCollectionCount = function() {
        const collection = Game.loadCollection();
        const totalCount = collection.reduce((sum, item) => sum + (item.count || 1), 0);
        const countElement = document.getElementById('collection-count');
        if (countElement) {
            countElement.textContent = `📚 Collection: ${totalCount}`;
        }
        Game.updateCollectiblesPane();
    };

    /**
     * Updates the collectibles pane with current collection
     */
    Game.updateCollectiblesPane = function() {
        const collection = Game.loadCollection();
        const paneGrid = document.getElementById('collectibles-pane-grid');
        if (!paneGrid) return;

        paneGrid.innerHTML = '';

        if (collection.length === 0) {
            paneGrid.innerHTML = '<div class="collectible-empty">Complete games to collect animals! 🎯</div>';
        } else {
            collection.forEach(item => {
                const div = document.createElement('div');
                div.className = 'collectible-item';
                div.innerHTML = item.emoji;
                div.title = `${item.name} - ${Game.rarityLabels[item.rarity || 'common']} (x${item.count || 1})`;
                const bgColor = Game.rarityColors[item.rarity || 'common'];
                if (bgColor.startsWith('linear-gradient')) {
                    div.style.background = bgColor;
                } else {
                    div.style.backgroundColor = bgColor;
                }
                div.onclick = () => Game.viewCollection();

                if ((item.count || 1) > 1) {
                    const badge = document.createElement('div');
                    badge.className = 'collectible-count-badge';
                    badge.textContent = item.count || 1;
                    div.appendChild(badge);
                }

                paneGrid.appendChild(div);
            });
        }
    };

    /**
     * Updates the timer display
     */
    Game.updateTimer = function() {
        const questionStartTime = Game.getQuestionStartTime();
        const isPaused = Game.getIsPaused();
        const pausedTime = Game.getPausedTime();

        if (!questionStartTime || isPaused) return;
        const elapsed = Math.floor((Date.now() - questionStartTime - pausedTime) / 1000);
        const timerElement = document.getElementById('timer');
        if (timerElement) {
            timerElement.textContent = `${elapsed}s`;
        }
    };

    /**
     * Updates the boss progress bar display
     */
    Game.updateBossProgressBar = function() {
        const bossPosition = Game.getBossPosition();
        const progressFill = document.getElementById('boss-progress-fill');
        if (!progressFill) return;

        const progressPercent = ((bossPosition - 10) / (90 - 10)) * 100;
        progressFill.style.width = progressPercent + '%';

        if (bossPosition >= 90) {
            progressFill.textContent = '🎉 Victory! 🎉';
        } else if (bossPosition <= 10) {
            progressFill.textContent = '💀 Defeated 💀';
        } else {
            progressFill.textContent = `Boss at ${Math.round(bossPosition)}%`;
        }
    };

})();
