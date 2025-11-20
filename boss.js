// Boss Battle System for Math Picture Reveal Game (Level 6)
// Handles boss movement, combat mechanics, and victory/defeat

let bossPosition = 50;
let bossMovementInterval = null;
let bossStartTime = null;
let useSingleAdd = true;

function initializeBossBattle() {
    bossPosition = 50;
    totalMistakes = 0;
    useSingleAdd = true;
    document.getElementById('mistakes-text').textContent = 'Mistakes: 0';

    const bossChar = document.getElementById('boss-character');
    bossChar.style.left = bossPosition + '%';
    updateBossProgressBar();

    if (bossMovementInterval) clearInterval(bossMovementInterval);
    bossStartTime = Date.now();

    startBackgroundMusic();

    bossMovementInterval = setInterval(() => {
        if (!isPaused) {
            moveBossTowardsPlayer();
        }
    }, 1000);
}

function moveBossTowardsPlayer() {
    const movePerSecond = 40 / 40;  // Boss moves toward player at 1% per second
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
