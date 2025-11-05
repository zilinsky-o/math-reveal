/**
 * gameplay/boss-battle.js
 *
 * Boss battle mechanics (Level 5)
 * - Boss initialization
 * - Boss movement
 * - Combat animations
 * - Victory/defeat conditions
 *
 * Dependencies: core/game-state.js, ui/ui-controller.js, ui/animations.js,
 *               core/storage.js, ui/modals.js
 */

(function() {
    'use strict';

    window.Game = window.Game || {};

    /**
     * Initializes the boss battle
     */
    Game.initializeBossBattle = function() {
        Game.setBossPosition(50);
        Game.setTotalMistakes(0);
        Game.setUseSingleAdd(true);

        const mistakesText = document.getElementById('mistakes-text');
        if (mistakesText) mistakesText.textContent = 'Mistakes: 0';

        const bossChar = document.getElementById('boss-character');
        if (bossChar) bossChar.style.left = '50%';
        Game.updateBossProgressBar();

        const oldInterval = Game.getBossMovementInterval();
        if (oldInterval) clearInterval(oldInterval);
        Game.setBossStartTime(Date.now());

        Game.startBackgroundMusic();

        const interval = setInterval(() => {
            if (!Game.getIsPaused()) {
                Game.moveBossTowardsPlayer();
            }
        }, 1000);
        Game.setBossMovementInterval(interval);
    };

    /**
     * Moves boss towards player (called every second)
     */
    Game.moveBossTowardsPlayer = function() {
        const movePerSecond = 40 / 40;
        let bossPosition = Game.getBossPosition();
        bossPosition -= movePerSecond;
        Game.setBossPosition(bossPosition);

        if (bossPosition <= 10) {
            Game.setBossPosition(10);
            const interval = Game.getBossMovementInterval();
            if (interval) clearInterval(interval);
            Game.stopBackgroundMusic();
            Game.loseBossBattle();
            return;
        }

        const bossChar = document.getElementById('boss-character');
        if (bossChar) bossChar.style.left = bossPosition + '%';
        Game.updateBossProgressBar();

        const distanceFromPlayer = bossPosition - 10;
        const dangerZone = document.getElementById('boss-danger-zone');
        if (dangerZone) {
            if (distanceFromPlayer < 15) {
                dangerZone.textContent = '⚠️ DANGER! Boss is getting close! ⚠️';
            } else {
                dangerZone.textContent = '';
            }
        }

        Game.updateBackgroundMusicSpeed();
    };

    /**
     * Moves boss away from player (on correct answer)
     */
    Game.moveBossAway = function() {
        const moveDistance = (100 / 15) * 1.5;
        let bossPosition = Game.getBossPosition();
        bossPosition += moveDistance;
        Game.setBossPosition(bossPosition);

        if (bossPosition >= 90) {
            Game.setBossPosition(90);
            const interval = Game.getBossMovementInterval();
            if (interval) clearInterval(interval);
            Game.stopBackgroundMusic();
            Game.winBossBattle();
            return;
        }

        const bossChar = document.getElementById('boss-character');
        if (bossChar) bossChar.style.left = bossPosition + '%';
        Game.updateBossProgressBar();

        const dangerZone = document.getElementById('boss-danger-zone');
        if (dangerZone) dangerZone.textContent = '';
        Game.updateBackgroundMusicSpeed();
    };

    /**
     * Animates throwing bomb at boss (correct answer)
     */
    Game.throwBombAtBoss = function() {
        const bomb = document.getElementById('boss-bomb');
        const explosion = document.getElementById('boss-explosion');
        const bossChar = document.getElementById('boss-character');
        const avatar = document.getElementById('boss-avatar');

        if (!bomb || !explosion) return;

        const bossPosition = Game.getBossPosition();
        bomb.style.left = '10%';
        bomb.style.bottom = '140px';
        bomb.style.opacity = '1';

        const bossLeft = bossPosition;
        bomb.style.animation = 'none';
        setTimeout(() => {
            bomb.style.animation = 'throwBall 0.8s ease-out';
            bomb.style.left = bossLeft + '%';
        }, 10);

        if (avatar) avatar.classList.add('celebrating');

        setTimeout(() => {
            bomb.style.opacity = '0';
            explosion.style.left = bossLeft + '%';
            explosion.style.bottom = '140px';
            explosion.style.opacity = '1';
            explosion.style.transform = 'scale(1)';
            if (bossChar) bossChar.classList.add('angry');

            Game.playSound(100, 0.3, 'sawtooth', 0);

            setTimeout(() => {
                explosion.style.opacity = '0';
                explosion.style.transform = 'scale(0)';
                bomb.style.animation = 'none';
                if (bossChar) bossChar.classList.remove('angry');
                if (avatar) avatar.classList.remove('celebrating');
            }, 400);
        }, 700);
    };

    /**
     * Animates throwing bomb miss (incorrect answer)
     */
    Game.throwBombMiss = function() {
        const bomb = document.getElementById('boss-bomb');
        const avatar = document.getElementById('boss-avatar');

        if (!bomb) return;

        const bossPosition = Game.getBossPosition();
        bomb.style.left = '10%';
        bomb.style.bottom = '140px';
        bomb.style.opacity = '1';

        const missLeft = Math.min(bossPosition - 15, 35);
        bomb.style.animation = 'none';
        setTimeout(() => {
            bomb.style.animation = 'throwBall 0.8s ease-out';
            bomb.style.left = missLeft + '%';
        }, 10);

        setTimeout(() => {
            bomb.style.opacity = '0';
            bomb.style.animation = 'none';
        }, 800);
    };

    /**
     * Handles boss battle victory
     */
    Game.winBossBattle = function() {
        Game.stopTimer();
        const interval = Game.getBossMovementInterval();
        if (interval) clearInterval(interval);
        Game.playBossVictorySound();

        const currentLevel = Game.getCurrentLevel();
        Game.saveHighestLevel(currentLevel);

        const collection = Game.loadCollection();
        const existing = collection.find(item => item.emoji === '👹');

        if (existing) {
            existing.count = (existing.count || 1) + 1;
            existing.lastFound = new Date().toISOString();
        } else {
            const newItem = {
                emoji: '👹',
                name: 'Boss',
                rarity: 'boss',
                count: 1,
                firstFound: new Date().toISOString(),
                lastFound: new Date().toISOString()
            };
            collection.push(newItem);
        }

        Game.saveCollection(collection);
        Game.updateCollectionCount();

        const questionBox = document.getElementById('question-box');
        const completion = document.getElementById('completion');
        const completionText = document.getElementById('completion-text');
        const newCollectible = document.getElementById('new-collectible');

        if (questionBox) questionBox.style.display = 'none';
        if (completion) completion.style.display = 'block';
        if (completionText) completionText.textContent = 'You defeated the Boss!';
        if (newCollectible) newCollectible.textContent = '👹';

        const nextLevelBtn = document.getElementById('next-level-button');
        if (nextLevelBtn) nextLevelBtn.style.display = 'none';

        const reportsContainer = document.getElementById('reports-container');
        if (reportsContainer) {
            const totalMistakes = Game.getTotalMistakes();
            let reportsHTML = '<div class="achievement-report"><h3>🎉 Boss Defeated! 🎉</h3>';
            reportsHTML += '<p>You captured the boss in the prison!</p>';
            if (totalMistakes === 0) {
                reportsHTML += '<p>🌟 Perfect Victory - No Mistakes!</p>';
            } else {
                reportsHTML += `<p>Mistakes: ${totalMistakes}</p>`;
            }
            reportsHTML += '</div>';
            reportsContainer.innerHTML = reportsHTML;
        }
    };

    /**
     * Handles boss battle defeat
     */
    Game.loseBossBattle = function() {
        Game.stopTimer();
        const interval = Game.getBossMovementInterval();
        if (interval) clearInterval(interval);
        Game.stopBackgroundMusic();
        Game.playFailSound();

        setTimeout(() => {
            const lossModal = document.getElementById('boss-loss-modal');
            if (lossModal) lossModal.style.display = 'flex';
        }, 500);
    };

    /**
     * Restarts game after boss loss
     */
    Game.restartFromBossLoss = function() {
        const lossModal = document.getElementById('boss-loss-modal');
        if (lossModal) lossModal.style.display = 'none';
        Game.restartGame();
    };

})();
