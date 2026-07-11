// Test Mode Functions for Math Picture Reveal Game
// Provides debugging and testing tools when ?test=true is in URL

const urlParams = new URLSearchParams(window.location.search);
const testMode = urlParams.get('test') === 'true';

// Initialize test mode UI
if (testMode) {
    document.addEventListener('DOMContentLoaded', () => {
        const testPanel = document.getElementById('test-panel');
        if (testPanel) {
            testPanel.classList.add('visible');
        }
        populateLevelSelector();
    });
}

function revealAll() {
    if (!confirm('This will complete all remaining cells and end the game. Continue?')) {
        return;
    }

    stopBackgroundMusic();
    if (bossMovementInterval) clearInterval(bossMovementInterval);

    for (let key in cells) {
        if (!cells[key].completed) {
            cells[key].correctAnswers = 2;
            cells[key].completed = true;
            updateCell(key);
        }
    }

    cellsDiscovered = 64;
    document.getElementById('progress-text').textContent = '64/64 Cells Discovered!';
    showCompletion();
}

function populateLevelSelector() {
    if (!testMode) return;

    const selector = document.getElementById('level-selector');
    if (!selector) return;

    selector.innerHTML = '';
    const typeLabel = { animal: 'Animal', treasure: 'Treasure', boss: 'Boss' };
    for (let level = 1; level <= TOTAL_LEVELS; level++) {
        const cfg = LEVEL_CONFIG[level];
        const option = document.createElement('option');
        option.value = level;
        const addendText = cfg.addendCeiling === 1 ? '+1' : `+1..+${cfg.addendCeiling}`;
        option.textContent = `Level ${level} — ${typeLabel[cfg.type]} (${addendText})`;
        selector.appendChild(option);
    }
    selector.value = currentLevel;
}

function jumpToLevel(level) {
    if (!testMode) return;

    stopTimer();
    if (bossMovementInterval) clearInterval(bossMovementInterval);
    stopBackgroundMusic();
    isPaused = false;
    document.getElementById('paused-overlay').classList.remove('visible');
    document.getElementById('pause-button').textContent = '⏸️ Pause';

    document.getElementById('completion').style.display = 'none';
    document.getElementById('question-box').style.display = 'block';

    currentLevel = level;
    showLevelIntro();
}

function populateCollectibleSelector() {
    if (!testMode) return;

    const selector = document.getElementById('collectible-selector');
    if (!selector) return;

    const sortedAnimals = [...backgrounds].sort((a, b) => a.name.localeCompare(b.name));

    sortedAnimals.forEach(animal => {
        const option = document.createElement('option');
        option.value = animal.emoji;
        option.textContent = `${animal.emoji} ${animal.name} (${rarityLabels[animal.baseRarity]})`;
        selector.appendChild(option);
    });
}

function addTestCollectible() {
    if (!testMode) return;

    const selector = document.getElementById('collectible-selector');
    if (!selector || !selector.value) return;

    const selectedEmoji = selector.value;
    const animal = backgrounds.find(bg => bg.emoji === selectedEmoji);

    if (animal) {
        addToCollection(animal.emoji, animal.name);

        const collectionBadge = document.getElementById('collection-count');
        collectionBadge.style.transform = 'scale(1.2)';
        collectionBadge.style.transition = 'transform 0.2s';
        setTimeout(() => {
            collectionBadge.style.transform = 'scale(1)';
        }, 200);
    }
}

function addAllWeapons() {
    if (!testMode) return;
    addWeapon('pistol');
    addWeapon('jet');
    addWeapon('web');
}

// Panic button: Press R to toggle test panel visibility instantly (test mode only)
if (testMode) {
    document.addEventListener('keydown', function(e) {
        if ((e.key === 'r' || e.key === 'R') && testMode) {
            const testPanel = document.getElementById('test-panel');
            testPanel.classList.toggle('visible');
        }
    });
}
