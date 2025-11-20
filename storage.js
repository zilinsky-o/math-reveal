// Local Storage Management for Math Picture Reveal Game
// Handles saving/loading collection data and highest level reached

function saveCollection(collection) {
    try {
        localStorage.setItem('mathGameCollection', JSON.stringify(collection));
    } catch (e) {
        console.error('Error saving collection:', e);
    }
}

function loadCollection() {
    try {
        const saved = localStorage.getItem('mathGameCollection');
        if (saved) {
            return JSON.parse(saved);
        }
    } catch (e) {
        console.error('Error loading collection:', e);
    }
    return [];
}

function addToCollection(emoji, name) {
    const collection = loadCollection();
    const existing = collection.find(item => item.emoji === emoji);

    if (existing) {
        existing.count = (existing.count || 1) + 1;
        existing.lastFound = new Date().toISOString();
    } else {
        const animal = backgrounds.find(bg => bg.emoji === emoji);
        const rarity = animal ? animal.baseRarity : 'common';

        const newItem = {
            emoji,
            name,
            rarity,
            count: 1,
            firstFound: new Date().toISOString(),
            lastFound: new Date().toISOString()
        };
        collection.push(newItem);
    }

    saveCollection(collection);
    updateCollectionCount();
}

function removeFromCollection(emoji) {
    if (!testMode) return;
    const collection = loadCollection();
    const item = collection.find(c => c.emoji === emoji);

    if (item) {
        if ((item.count || 1) > 1) {
            item.count--;
        } else {
            const index = collection.indexOf(item);
            collection.splice(index, 1);
        }
        saveCollection(collection);
        updateCollectionCount();
        viewCollection();
    }
}

function getHighestLevel() {
    try {
        const saved = localStorage.getItem('mathGameHighestLevel');
        return saved ? parseInt(saved) : 1;
    } catch (e) {
        return 1;
    }
}

function saveHighestLevel(level) {
    try {
        const current = getHighestLevel();
        if (level > current) {
            localStorage.setItem('mathGameHighestLevel', level.toString());
        }
    } catch (e) {
        console.error('Error saving highest level:', e);
    }
}

function determineRarity(highestLevel) {
    let probabilities = {
        common: 60,
        uncommon: 25,
        rare: 10,
        epic: 4,
        legendary: 1,
        mythical: 0.5,
        exotic: 0.35,
        secret: 0.1
    };

    if (highestLevel > 1) {
        const levelBonus = (highestLevel - 1) * 2;
        const reduction = levelBonus / 2;

        probabilities.common = Math.max(30, probabilities.common - reduction);
        probabilities.uncommon = Math.max(15, probabilities.uncommon - reduction);
        probabilities.rare += levelBonus * 0.5;
        probabilities.epic += levelBonus * 0.3;
        probabilities.legendary += levelBonus * 0.2;
        probabilities.mythical += levelBonus * 0.1;
        probabilities.exotic += levelBonus * 0.05;
        probabilities.secret += levelBonus * 0.02;
    }

    const random = Math.random() * 100;
    let cumulative = 0;

    for (const [rarity, probability] of Object.entries(probabilities)) {
        cumulative += probability;
        if (random < cumulative) {
            return rarity;
        }
    }

    return 'common';
}

function selectRandomBackground(currentLevel = null) {
    const highestLevel = getHighestLevel();
    const targetRarity = determineRarity(highestLevel);

    // Level 3 gives jewelry collectibles (indices 87-97)
    let availableBackgrounds = backgrounds;
    if (currentLevel === 3) {
        availableBackgrounds = backgrounds.slice(87, 98);
    }

    const matchingRarity = availableBackgrounds.filter(bg => bg.baseRarity === targetRarity);

    if (matchingRarity.length > 0) {
        return matchingRarity[Math.floor(Math.random() * matchingRarity.length)];
    } else {
        return availableBackgrounds[Math.floor(Math.random() * availableBackgrounds.length)];
    }
}

function updateCollectionCount() {
    const collection = loadCollection();
    const totalCount = collection.reduce((sum, item) => sum + (item.count || 1), 0);
    document.getElementById('collection-count').textContent = `📚 Collection: ${totalCount}`;
    updateCollectiblesPane();
}

function updateCollectiblesPane() {
    const collection = loadCollection();
    const paneGrid = document.getElementById('collectibles-pane-grid');
    paneGrid.innerHTML = '';

    if (collection.length === 0) {
        paneGrid.innerHTML = '<div class="collectible-empty">Complete games to collect animals! 🎯</div>';
    } else {
        collection.forEach(item => {
            const div = document.createElement('div');
            div.className = 'collectible-item';
            div.innerHTML = item.emoji;
            div.title = `${item.name} - ${rarityLabels[item.rarity || 'common']} (x${item.count || 1})`;
            const bgColor = rarityColors[item.rarity || 'common'];
            if (bgColor.startsWith('linear-gradient')) {
                div.style.background = bgColor;
            } else {
                div.style.backgroundColor = bgColor;
            }
            div.onclick = () => viewCollection();

            if ((item.count || 1) > 1) {
                const badge = document.createElement('div');
                badge.className = 'collectible-count-badge';
                badge.textContent = item.count || 1;
                div.appendChild(badge);
            }

            paneGrid.appendChild(div);
        });
    }
}

function viewCollection() {
    const collection = loadCollection();
    const grid = document.getElementById('collection-grid');
    grid.innerHTML = '';

    if (collection.length === 0) {
        grid.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: #9ca3af; font-size: 1.2rem;">No collectibles yet! Complete games to collect cute animals! 🎯</p>';
    } else {
        collection.forEach(item => {
            const div = document.createElement('div');
            div.className = 'collection-item';
            const bgColor = rarityColors[item.rarity || 'common'];
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
            tooltip.textContent = `${rarityLabels[item.rarity || 'common']} - Found ${item.count || 1}x`;
            div.appendChild(tooltip);

            if ((item.count || 1) > 1) {
                const badge = document.createElement('div');
                badge.className = 'collectible-count-badge';
                badge.textContent = item.count || 1;
                div.appendChild(badge);
            }

            if (testMode) {
                const deleteBtn = document.createElement('button');
                deleteBtn.className = 'delete-collectible';
                deleteBtn.textContent = '×';
                deleteBtn.onclick = (e) => {
                    e.stopPropagation();
                    if (confirm(`Remove ${item.name} from collection?`)) {
                        removeFromCollection(item.emoji);
                    }
                };
                div.appendChild(deleteBtn);
            }

            grid.appendChild(div);
        });
    }

    document.getElementById('collection-modal').classList.add('visible');
}

function closeCollection() {
    document.getElementById('collection-modal').classList.remove('visible');
}
