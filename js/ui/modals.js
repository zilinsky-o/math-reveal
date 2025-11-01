/**
 * ui/modals.js
 *
 * Modal dialogs and screens
 * - Level introduction modal
 * - Collection viewer modal
 * - Completion screen with reports
 *
 * Dependencies: core/game-state.js, data/levels.js, core/storage.js, core/question-generator.js
 */

(function() {
    'use strict';

    window.Game = window.Game || {};

    /**
     * Shows the collection viewer modal
     */
    Game.viewCollection = function() {
        const collection = Game.loadCollection();
        const grid = document.getElementById('collection-grid');
        if (!grid) return;

        grid.innerHTML = '';

        if (collection.length === 0) {
            grid.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: #9ca3af; font-size: 1.2rem;">No collectibles yet! Complete games to collect cute animals! 🎯</p>';
        } else {
            collection.forEach(item => {
                const div = document.createElement('div');
                div.className = 'collection-item';
                const bgColor = Game.rarityColors[item.rarity || 'common'];
                if (bgColor.startsWith('linear-gradient')) {
                    div.style.background = bgColor;
                } else {
                    div.style.backgroundColor = bgColor;
                }

                const emoji = document.createElement('div');
                emoji.textContent = item.emoji;
                div.appendChild(emoji);

                const tooltip = document.createElement('div');
                tooltip.className = 'collection-item-tooltip';
                tooltip.textContent = `${Game.rarityLabels[item.rarity || 'common']} - Found ${item.count || 1}x`;
                div.appendChild(tooltip);

                if ((item.count || 1) > 1) {
                    const badge = document.createElement('div');
                    badge.className = 'collectible-count-badge';
                    badge.textContent = item.count || 1;
                    div.appendChild(badge);
                }

                if (Game.testMode) {
                    const deleteBtn = document.createElement('button');
                    deleteBtn.className = 'delete-collectible';
                    deleteBtn.textContent = '×';
                    deleteBtn.onclick = (e) => {
                        e.stopPropagation();
                        if (confirm(`Remove ${item.name} from collection?`)) {
                            Game.removeFromCollection(item.emoji);
                        }
                    };
                    div.appendChild(deleteBtn);
                }

                grid.appendChild(div);
            });
        }

        const modal = document.getElementById('collection-modal');
        if (modal) {
            modal.classList.add('visible');
        }
    };

    /**
     * Closes the collection viewer modal
     */
    Game.closeCollection = function() {
        const modal = document.getElementById('collection-modal');
        if (modal) {
            modal.classList.remove('visible');
        }
    };

    /**
     * Shows the level introduction screen
     */
    Game.showLevelIntro = function() {
        const intro = document.getElementById('level-intro');
        const title = document.getElementById('level-intro-title');
        const desc = document.getElementById('level-intro-desc');
        const bossIntroEmoji = document.getElementById('boss-intro-emoji');

        if (!intro || !title || !desc) return;

        const currentLevel = Game.getCurrentLevel();
        const levelConfig = Game.LEVEL_CONFIG[currentLevel];

        document.body.className = '';
        if (levelConfig.theme === 'orange') document.body.classList.add('level-2');
        if (levelConfig.theme === 'green') document.body.classList.add('level-3');
        if (levelConfig.theme === 'indigo') document.body.classList.add('level-4');
        if (levelConfig.theme === 'red') document.body.classList.add('level-5');

        if (bossIntroEmoji) {
            if (currentLevel === 5) {
                bossIntroEmoji.style.display = 'block';
            } else {
                bossIntroEmoji.style.display = 'none';
            }
        }

        title.textContent = levelConfig.title;

        const practiceQuestions = Game.getPracticeQuestions();
        const description = typeof levelConfig.description === 'function'
            ? levelConfig.description(practiceQuestions.length)
            : levelConfig.description;
        desc.textContent = description;

        const levelBadge = document.getElementById('level-badge');
        if (levelBadge) {
            levelBadge.textContent = `Level ${currentLevel}`;
        }

        intro.classList.add('visible');
    };

    /**
     * Shows the completion screen with performance reports
     */
    Game.showCompletion = function() {
        Game.stopTimer();
        Game.playCompletionSound();

        const currentLevel = Game.getCurrentLevel();
        Game.saveHighestLevel(currentLevel);

        const currentBg = Game.getCurrentBg();
        if (currentBg) {
            Game.addToCollection(currentBg.emoji, currentBg.name);
        }

        const levelConfig = Game.LEVEL_CONFIG[currentLevel];

        if (levelConfig.sourceLevel === null) {
            const mistakeLog = Game.getMistakeLog();
            const slowLog = Game.getSlowLog();

            if (currentLevel === 1) {
                Game.setLevel1MistakeLog({ ...mistakeLog });
                Game.setLevel1SlowLog({ ...slowLog });
            } else if (currentLevel === 3) {
                Game.setLevel3MistakeLog({ ...mistakeLog });
                Game.setLevel3SlowLog({ ...slowLog });
            }

            const nextLevel = currentLevel + 1;
            if (Game.LEVEL_CONFIG[nextLevel]) {
                const practiceQuestions = Game.generatePracticeQuestions(currentLevel);
                Game.setPracticeQuestions(practiceQuestions);
            }
        }

        const questionBox = document.getElementById('question-box');
        const completion = document.getElementById('completion');
        const completionText = document.getElementById('completion-text');
        const newCollectible = document.getElementById('new-collectible');

        if (questionBox) questionBox.style.display = 'none';
        if (completion) completion.style.display = 'block';
        if (completionText && currentBg) completionText.textContent = `You revealed the ${currentBg.name}!`;
        if (newCollectible && currentBg) newCollectible.textContent = currentBg.emoji;

        const nextLevelBtn = document.getElementById('next-level-button');
        const nextLevel = currentLevel + 1;
        const practiceQuestions = Game.getPracticeQuestions();
        if (nextLevelBtn) {
            if (Game.LEVEL_CONFIG[nextLevel] && (levelConfig.sourceLevel === null ? practiceQuestions.length > 0 : true)) {
                nextLevelBtn.style.display = 'inline-block';
            } else {
                nextLevelBtn.style.display = 'none';
            }
        }

        const reportsContainer = document.getElementById('reports-container');
        if (!reportsContainer) return;

        let reportsHTML = '';
        const fastLog = Game.getFastLog();
        const mistakeLog = Game.getMistakeLog();
        const slowLog = Game.getSlowLog();
        const totalMistakes = Game.getTotalMistakes();

        if (Object.keys(fastLog).length > 0) {
            reportsHTML += '<div class="achievement-report"><h3>🌟 Speed Achievements (Under 5 seconds):</h3><ul>';
            const sortedFast = Object.entries(fastLog).sort((a, b) => {
                const avgA = a[1].reduce((sum, t) => sum + t, 0) / a[1].length;
                const avgB = b[1].reduce((sum, t) => sum + t, 0) / b[1].length;
                return avgA - avgB;
            });
            for (const [question, times] of sortedFast) {
                const avgTime = (times.reduce((sum, t) => sum + t, 0) / times.length).toFixed(1);
                reportsHTML += `<li>${question} (${avgTime}s avg)</li>`;
            }
            reportsHTML += '</ul></div>';
        }

        if (totalMistakes > 0) {
            reportsHTML += '<div class="mistake-report"><h3>Questions with Mistakes:</h3><ul>';
            const sortedMistakes = Object.entries(mistakeLog).sort((a, b) => b[1] - a[1]);
            for (const [question, count] of sortedMistakes) {
                reportsHTML += `<li>${question} (${count} mistake${count > 1 ? 's' : ''})</li>`;
            }
            reportsHTML += '</ul></div>';
        }

        if (Object.keys(slowLog).length > 0) {
            reportsHTML += '<div class="mistake-report"><h3>Questions That Took Time (20+ seconds):</h3><ul>';
            const sortedSlow = Object.entries(slowLog).sort((a, b) => {
                const avgA = a[1].reduce((sum, t) => sum + t, 0) / a[1].length;
                const avgB = b[1].reduce((sum, t) => sum + t, 0) / b[1].length;
                return avgB - avgA;
            });
            for (const [question, times] of sortedSlow) {
                const avgTime = Math.round(times.reduce((sum, t) => sum + t, 0) / times.length);
                reportsHTML += `<li>${question} (avg ${avgTime}s)</li>`;
            }
            reportsHTML += '</ul></div>';
        }

        if (totalMistakes === 0 && Object.keys(slowLog).length === 0 && Object.keys(fastLog).length === 0) {
            reportsHTML = '<div class="achievement-report"><h3>Perfect! 🌟</h3></div>';
        }

        reportsContainer.innerHTML = reportsHTML;
    };

})();
