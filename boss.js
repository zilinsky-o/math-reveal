// Boss Battle System for Math Picture Reveal Game (Level 6)
// Handles boss movement, combat mechanics, and victory/defeat

let bossPosition = 50;
let bossMovementInterval = null;
let bossStartTime = null;
let useSingleAdd = true;
let bossIsFrozen = false;
let webSlowActive = false;
let webSlowTimeout = null;

function initializeBossBattle() {
    bossPosition = 50;
    totalMistakes = 0;
    useSingleAdd = true;
    bossIsFrozen = false;
    webSlowActive = false;
    if (webSlowTimeout) clearTimeout(webSlowTimeout);
    document.getElementById('mistakes-text').textContent = 'Mistakes: 0';

    const bossChar = document.getElementById('boss-character');
    bossChar.style.left = bossPosition + '%';
    updateBossProgressBar();

    if (bossMovementInterval) clearInterval(bossMovementInterval);
    bossStartTime = Date.now();

    startBackgroundMusic();
    updateWeaponsUI();

    bossMovementInterval = setInterval(() => {
        if (!isPaused && !bossIsFrozen) {
            moveBossTowardsPlayer();
        }
    }, 1000);
}

function moveBossTowardsPlayer() {
    let movePerSecond = 40 / 40;  // Boss moves toward player at 1% per second
    if (webSlowActive) {
        movePerSecond *= 0.5;  // 50% slower with web
    }
    bossPosition -= movePerSecond;

    if (bossPosition <= 10) {
        bossPosition = 10;
        clearInterval(bossMovementInterval);
        stopBackgroundMusic();
        loseBossBattle();
        return;
    }

    const bossChar = document.getElementById('boss-character');
    bossChar.style.left = bossPosition + '%';
    updateBossProgressBar();

    const distanceFromPlayer = bossPosition - 10;
    if (distanceFromPlayer < 15) {
        document.getElementById('boss-danger-zone').textContent = '⚠️ DANGER! Boss is getting close! ⚠️';
    } else {
        document.getElementById('boss-danger-zone').textContent = '';
    }

    updateBackgroundMusicSpeed();
}

function moveBossAway() {
    const moveDistance = (100 / 15) * 1.5;  // Boss pushed back by ~6.67% per correct answer
    bossPosition += moveDistance;

    if (bossPosition >= 90) {
        bossPosition = 90;
        clearInterval(bossMovementInterval);
        stopBackgroundMusic();
        winBossBattle();
        return;
    }

    const bossChar = document.getElementById('boss-character');
    bossChar.style.left = bossPosition + '%';
    updateBossProgressBar();

    document.getElementById('boss-danger-zone').textContent = '';
    updateBackgroundMusicSpeed();
}

function updateBossProgressBar() {
    const progressFill = document.getElementById('boss-progress-fill');
    const progressPercent = ((bossPosition - 10) / (90 - 10)) * 100;
    progressFill.style.width = progressPercent + '%';

    if (bossPosition >= 90) {
        progressFill.textContent = '🎉 Victory! 🎉';
    } else if (bossPosition <= 10) {
        progressFill.textContent = '💀 Defeated 💀';
    } else {
        progressFill.textContent = `Boss at ${Math.round(bossPosition)}%`;
    }
}

function throwBombAtBoss() {
    const bomb = document.getElementById('boss-bomb');
    const explosion = document.getElementById('boss-explosion');
    const bossChar = document.getElementById('boss-character');
    const avatar = document.getElementById('boss-avatar');

    bomb.style.left = '10%';
    bomb.style.bottom = '140px';
    bomb.style.opacity = '1';

    const bossLeft = bossPosition;
    bomb.style.animation = 'none';
    setTimeout(() => {
        bomb.style.animation = `throwBall 0.8s ease-out`;
        bomb.style.left = bossLeft + '%';
    }, 10);

    avatar.classList.add('celebrating');

    setTimeout(() => {
        bomb.style.opacity = '0';
        explosion.style.left = bossLeft + '%';
        explosion.style.bottom = '140px';
        explosion.style.opacity = '1';
        explosion.style.transform = 'scale(1)';
        bossChar.classList.add('angry');

        playSound(100, 0.3, 'sawtooth', 0);

        setTimeout(() => {
            explosion.style.opacity = '0';
            explosion.style.transform = 'scale(0)';
            bomb.style.animation = 'none';
            bossChar.classList.remove('angry');
            avatar.classList.remove('celebrating');
        }, 400);
    }, 700);
}

function throwBombMiss() {
    const bomb = document.getElementById('boss-bomb');
    const avatar = document.getElementById('boss-avatar');

    bomb.style.left = '10%';
    bomb.style.bottom = '140px';
    bomb.style.opacity = '1';

    const missLeft = Math.min(bossPosition - 15, 35);
    bomb.style.animation = 'none';
    setTimeout(() => {
        bomb.style.animation = `throwBall 0.8s ease-out`;
        bomb.style.left = missLeft + '%';
    }, 10);

    setTimeout(() => {
        bomb.style.opacity = '0';
        bomb.style.animation = 'none';
    }, 800);
}

function winBossBattle() {
    stopTimer();
    if (bossMovementInterval) clearInterval(bossMovementInterval);
    playBossVictorySound();

    saveHighestLevel(currentLevel);

    // Skip adding boss collectible in test mode
    if (!testMode) {
        const collection = loadCollection();
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

        saveCollection(collection);
        updateCollectionCount();
    }

    document.getElementById('question-box').style.display = 'none';
    document.getElementById('completion').style.display = 'block';
    document.getElementById('completion-text').textContent = 'You defeated the Boss!';
    document.getElementById('new-collectible').textContent = '👹';

    const nextLevelBtn = document.getElementById('next-level-button');
    nextLevelBtn.style.display = 'none';

    const reportsContainer = document.getElementById('reports-container');
    let reportsHTML = '<div class="achievement-report"><h3>🎉 Boss Defeated! 🎉</h3>';
    reportsHTML += `<p>You captured the boss in the prison!</p>`;
    if (totalMistakes === 0) {
        reportsHTML += '<p>🌟 Perfect Victory - No Mistakes!</p>';
    } else {
        reportsHTML += `<p>Mistakes: ${totalMistakes}</p>`;
    }
    reportsHTML += '</div>';
    reportsContainer.innerHTML = reportsHTML;
}

function loseBossBattle() {
    stopTimer();
    if (bossMovementInterval) clearInterval(bossMovementInterval);
    stopBackgroundMusic();
    playFailSound();

    setTimeout(() => {
        document.getElementById('boss-loss-modal').style.display = 'flex';
    }, 500);
}

function restartFromBossLoss() {
    document.getElementById('boss-loss-modal').style.display = 'none';
    restartGame();
}

// Weapon Usage Functions
function useWeaponInBattle(weaponType) {
    if (isCheckingAnswer || isPaused) return;

    const success = useWeapon(weaponType);
    if (!success) return;

    // Trigger appropriate weapon animation
    switch (weaponType) {
        case 'pistol':
            usePistol();
            break;
        case 'jet':
            useJet();
            break;
        case 'web':
            useWeb();
            break;
    }
}

function usePistol() {
    const pistol = document.getElementById('weapon-pistol-element');
    const bullet = document.getElementById('weapon-bullet');
    const bossChar = document.getElementById('boss-character');
    const explosion = document.getElementById('boss-explosion');

    // Show pistol next to avatar
    pistol.style.left = '10%';
    pistol.style.bottom = '140px';
    pistol.style.opacity = '1';
    pistol.style.display = 'block';

    setTimeout(() => {
        // Fire bullet
        bullet.style.left = '10%';
        bullet.style.bottom = '150px';
        bullet.style.opacity = '1';
        bullet.style.display = 'block';

        const bossLeft = bossPosition;
        bullet.style.transition = 'all 0.5s linear';
        bullet.style.left = bossLeft + '%';

        playSound(800, 0.1, 'square', 0);

        setTimeout(() => {
            // Hit boss
            bullet.style.opacity = '0';
            explosion.style.left = bossLeft + '%';
            explosion.style.bottom = '140px';
            explosion.style.opacity = '1';
            explosion.style.transform = 'scale(1)';
            bossChar.classList.add('angry');

            playSound(100, 0.3, 'sawtooth', 0);

            // Push boss back
            moveBossAway();

            setTimeout(() => {
                explosion.style.opacity = '0';
                explosion.style.transform = 'scale(0)';
                bossChar.classList.remove('angry');
                pistol.style.opacity = '0';
                bullet.style.display = 'none';
                bullet.style.transition = 'none';
                pistol.style.display = 'none';
            }, 400);
        }, 500);
    }, 200);
}

function useJet() {
    const jet = document.getElementById('weapon-jet-element');
    const jetBomb = document.getElementById('weapon-jet-bomb');
    const bossChar = document.getElementById('boss-character');
    const explosion = document.getElementById('boss-explosion');

    // Freeze boss movement
    bossIsFrozen = true;

    // Jet flies in from left
    jet.style.left = '-10%';
    jet.style.top = '20%';
    jet.style.opacity = '1';
    jet.style.display = 'block';

    jet.style.transition = 'all 2s linear';
    setTimeout(() => {
        jet.style.left = bossPosition + '%';

        playSound(600, 0.5, 'sawtooth', 0);

        setTimeout(() => {
            // Drop bomb
            jetBomb.style.left = bossPosition + '%';
            jetBomb.style.top = '20%';
            jetBomb.style.opacity = '1';
            jetBomb.style.display = 'block';

            jetBomb.style.transition = 'all 0.8s ease-in';
            setTimeout(() => {
                jetBomb.style.top = '50%';

                setTimeout(() => {
                    // Explosion
                    jetBomb.style.opacity = '0';
                    explosion.style.left = bossPosition + '%';
                    explosion.style.bottom = '140px';
                    explosion.style.opacity = '1';
                    explosion.style.transform = 'scale(1.5)';
                    bossChar.classList.add('angry');

                    playSound(80, 0.5, 'sawtooth', 0);

                    // Boss stays frozen until next question
                    setTimeout(() => {
                        explosion.style.opacity = '0';
                        explosion.style.transform = 'scale(0)';
                        bossChar.classList.remove('angry');
                        jet.style.opacity = '0';
                        jet.style.left = '110%';
                        jet.style.transition = 'none';
                        jet.style.display = 'none';
                        jetBomb.style.display = 'none';
                        jetBomb.style.transition = 'none';
                    }, 600);
                }, 800);
            }, 10);
        }, 1000);
    }, 10);
}

function useWeb() {
    const web = document.getElementById('weapon-web-element');
    const bossChar = document.getElementById('boss-character');

    // Show web on boss
    web.style.left = bossPosition + '%';
    web.style.bottom = '140px';
    web.style.opacity = '1';
    web.style.display = 'block';
    web.style.fontSize = '80px';

    bossChar.classList.add('webbed');

    // Activate slow effect
    webSlowActive = true;
    if (webSlowTimeout) clearTimeout(webSlowTimeout);

    playSuccessSound();

    // Remove after 30 seconds
    webSlowTimeout = setTimeout(() => {
        webSlowActive = false;
        web.style.opacity = '0';
        bossChar.classList.remove('webbed');
        setTimeout(() => {
            web.style.display = 'none';
        }, 500);
    }, 30000);
}

function unfreezeAndRemoveJetEffect() {
    bossIsFrozen = false;
}
