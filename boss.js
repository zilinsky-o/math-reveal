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

    // Update web position if active
    if (webSlowActive) {
        const web = document.getElementById('weapon-web-element');
        if (web) {
            web.style.left = bossPosition + '%';
        }
    }

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

    // Update web position if active
    if (webSlowActive) {
        const web = document.getElementById('weapon-web-element');
        if (web) {
            web.style.left = bossPosition + '%';
        }
    }

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
        // Fire bullet with trail effect
        bullet.style.left = '12%'; // Start slightly ahead of pistol
        bullet.style.bottom = '150px';
        bullet.style.opacity = '1';
        bullet.style.display = 'block';
        bullet.textContent = '—'; // Horizontal line for bullet trail
        bullet.style.fontSize = '30px';
        bullet.style.color = '#fbbf24';

        const bossLeft = bossPosition;
        bullet.style.transition = 'left 0.5s linear, opacity 0.5s linear';
        setTimeout(() => {
            bullet.style.left = bossLeft + '%';
        }, 10);

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

    playSound(600, 0.5, 'sawtooth', 0);

    // Start jet flying animation
    jet.style.transition = 'left 2s linear';
    setTimeout(() => {
        jet.style.left = bossPosition + '%';
    }, 10);

    // Wait for jet to reach boss position (2s), then drop bomb
    setTimeout(() => {
        // Drop bomb from jet position
        jetBomb.style.left = bossPosition + '%';
        jetBomb.style.top = '20%';
        jetBomb.style.opacity = '1';
        jetBomb.style.display = 'block';
        jetBomb.style.fontSize = '40px';
        jetBomb.style.transform = 'rotate(0deg)';

        // Bomb falls down with rotation
        jetBomb.style.transition = 'top 0.8s ease-in, transform 0.8s ease-in';
        setTimeout(() => {
            jetBomb.style.top = '50%';
            jetBomb.style.transform = 'rotate(180deg)';
        }, 10);

        // Explosion when bomb hits boss
        setTimeout(() => {
            jetBomb.style.opacity = '0';
            explosion.style.left = bossPosition + '%';
            explosion.style.bottom = '140px';
            explosion.style.opacity = '1';
            explosion.style.transform = 'scale(1.5)';
            bossChar.classList.add('angry');

            playSound(80, 0.5, 'sawtooth', 0);

            // Cleanup after explosion
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
    }, 2000); // Wait for jet to arrive (2s transition time)
}

function useWeb() {
    const web = document.getElementById('weapon-web-element');
    const bossChar = document.getElementById('boss-character');

    // Show web on boss - positioned exactly like boss character
    web.style.left = bossPosition + '%';
    web.style.bottom = '60px'; // Match boss bottom position
    web.style.opacity = '1';
    web.style.display = 'block';
    web.style.fontSize = '80px';
    web.style.transform = 'translateX(-50%) scale(0)'; // Start small, centered

    bossChar.classList.add('webbed');

    // Grow animation
    web.style.transition = 'transform 0.3s ease-out';
    setTimeout(() => {
        web.style.transform = 'translateX(-50%) scale(1)';
    }, 10);

    // Activate slow effect
    webSlowActive = true;
    if (webSlowTimeout) clearTimeout(webSlowTimeout);

    playSuccessSound();

    // Remove after 30 seconds
    webSlowTimeout = setTimeout(() => {
        webSlowActive = false;
        web.style.opacity = '0';
        web.style.transform = 'translateX(-50%) scale(0)';
        bossChar.classList.remove('webbed');
        setTimeout(() => {
            web.style.display = 'none';
        }, 500);
    }, 30000);
}

function unfreezeAndRemoveJetEffect() {
    bossIsFrozen = false;
}
