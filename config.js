// Configuration for Math Picture Reveal Game
// This file contains all game configuration, level definitions, and collectible data

const GRID_SIZE = 8;
const GRID_OFFSET = 2;
const CELLS_PER_ANSWER = 6;
const PATHFINDING_GRID_SIZE = 9;

// Level progression: the journey is built from repeating 5-level blocks
// (animal-reveal + treasure-find duo, another duo, then a boss). Each duo
// introduces one new addend, ramping the "+N" tier up to MAX_ADDEND, at which
// point the journey ends on a final boss.
const BLOCK_SIZE = 5;
const MAX_ADDEND = 9;
const TOTAL_LEVELS = 25;
const SINGLE_DIGIT_RANGE = [1, 9];
const DOUBLE_DIGIT_RANGE = [10, 99];
const ANIMAL_THEMES = ['purple', 'orange', 'green', 'indigo'];

const PRACTICE_TYPES = {
    A: {
        name: 'Practice',
        cellsPerAnswer: 6,
        requiresRetry: true,
        questionSource: 'random'
    },
    B: {
        name: 'Challenge Review',
        cellsPerAnswer: (totalQuestions) => Math.ceil(64 / totalQuestions),
        requiresRetry: false,
        questionSource: 'practice-set',
        minQuestions: 10
    },
    C: {
        name: 'Boss Challenge',
        cellsPerAnswer: 4,
        requiresRetry: true,
        questionSource: 'mixed',
        timeLimit: null
    },
    D: {
        name: 'Pathfinding',
        cellsPerAnswer: 1,
        requiresRetry: false,
        questionSource: 'random'
    }
};

const QUESTION_TYPES = {
    'single-add': {
        operation: '+',
        operationFn: (a, b) => a + b,
        rowRange: [2, 10],
        colRange: [2, 10],
        label: 'Single-Digit Addition',
        operationSymbol: '+'
    },
    'double-add': {
        operation: '+',
        operationFn: (a, b) => a + b,
        rowRange: [11, 90],
        colRange: [2, 9],
        label: 'Double-Digit Addition',
        operationSymbol: '+'
    },
    'single-sub': {
        operation: '-',
        operationFn: (a, b) => a - b,
        rowRange: [2, 10],
        colRange: [2, 10],
        label: 'Single-Digit Subtraction',
        operationSymbol: '-'
    },
    'double-sub': {
        operation: '-',
        operationFn: (a, b) => a - b,
        rowRange: [11, 90],
        colRange: [2, 9],
        label: 'Double-Digit Subtraction',
        operationSymbol: '-'
    },
    'mixed-add': {
        operation: '+',
        operationFn: (a, b) => a + b,
        rowRange: [2, 90],
        colRange: [2, 10],
        label: 'Mixed Addition',
        operationSymbol: '+'
    },
    'mixed-sub': {
        operation: '-',
        operationFn: (a, b) => a - b,
        rowRange: [2, 90],
        colRange: [2, 10],
        label: 'Mixed Subtraction',
        operationSymbol: '-'
    },
    'mixed': {
        operation: '+',
        operationFn: (a, b) => a + b,
        rowRange: [2, 90],
        colRange: [2, 10],
        label: 'Mixed Addition',
        operationSymbol: '+'
    }
};

// Build the level map programmatically. Within each 5-level block (index `b`):
//   offset 0: animal-reveal (single digit),  addends 1..(2b+1)
//   offset 1: treasure-find (double digit),  addends 1..(2b+1)
//   offset 2: animal-reveal (single digit),  addends 1..(2b+2)
//   offset 3: treasure-find (double digit),  addends 1..(2b+2)
//   offset 4: boss (double digit),           addends 1..(2b+2)
// The addend ceiling is clamped to MAX_ADDEND, so the final block is all "+9"
// and the journey ends on the block's boss.
function buildLevelConfig() {
    const config = {};

    for (let level = 1; level <= TOTAL_LEVELS; level++) {
        const block = Math.floor((level - 1) / BLOCK_SIZE);
        const offset = (level - 1) % BLOCK_SIZE;

        let type, digitClass, theme, practiceType;
        const rawCeiling = offset < 2 ? (2 * block + 1) : (2 * block + 2);
        const addendCeiling = Math.min(MAX_ADDEND, rawCeiling);

        if (offset === 4) {
            type = 'boss';
            digitClass = 'double';
            theme = 'red';
            practiceType = 'C';
        } else if (offset % 2 === 0) {
            type = 'animal';
            digitClass = 'single';
            theme = ANIMAL_THEMES[(addendCeiling - 1) % ANIMAL_THEMES.length];
            practiceType = 'A';
        } else {
            type = 'treasure';
            digitClass = 'double';
            theme = 'teal';
            practiceType = 'D';
        }

        const addendText = addendCeiling === 1 ? '+1' : `+1 to +${addendCeiling}`;
        let title, description;
        if (type === 'boss') {
            title = `BOSS — LEVEL ${level}`;
            description = `Defeat the Boss! Double-digit ${addendText}`;
        } else if (type === 'treasure') {
            title = `LEVEL ${level}`;
            description = `Find the Treasure! Double-digit ${addendText}`;
        } else {
            title = `LEVEL ${level}`;
            description = `Reveal a Friend! Single-digit ${addendText}`;
        }

        config[level] = {
            level,
            type,
            practiceType,
            digitClass,
            addendCeiling,
            theme,
            title,
            description
        };
    }

    return config;
}

const LEVEL_CONFIG = buildLevelConfig();

const backgrounds = [
    { gradient: 'linear-gradient(135deg, #ffc0cb 0%, #e9d5ff 50%, #bfdbfe 100%)', emoji: '🦄', name: 'Unicorn', baseRarity: 'legendary' },
    { gradient: 'linear-gradient(135deg, #fef3c7 0%, #fed7aa 50%, #ffc0cb 100%)', emoji: '🐱', name: 'Kitty', baseRarity: 'common' },
    { gradient: 'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 50%, #bfdbfe 100%)', emoji: '🐬', name: 'Dolphin', baseRarity: 'rare' },
    { gradient: 'linear-gradient(135deg, #fef08a 0%, #fde047 50%, #fcd34d 100%)', emoji: '🐻', name: 'Bear', baseRarity: 'uncommon' },
    { gradient: 'linear-gradient(135deg, #fecaca 0%, #fca5a5 50%, #f87171 100%)', emoji: '🦊', name: 'Fox', baseRarity: 'uncommon' },
    { gradient: 'linear-gradient(135deg, #ddd6fe 0%, #c4b5fd 50%, #a78bfa 100%)', emoji: '🦋', name: 'Butterfly', baseRarity: 'common' },
    { gradient: 'linear-gradient(135deg, #fde68a 0%, #fcd34d 50%, #fbbf24 100%)', emoji: '🐝', name: 'Bee', baseRarity: 'common' },
    { gradient: 'linear-gradient(135deg, #fed7aa 0%, #fdba74 50%, #fb923c 100%)', emoji: '🦁', name: 'Lion', baseRarity: 'rare' },
    { gradient: 'linear-gradient(135deg, #bae6fd 0%, #7dd3fc 50%, #38bdf8 100%)', emoji: '🐧', name: 'Penguin', baseRarity: 'uncommon' },
    { gradient: 'linear-gradient(135deg, #d9f99d 0%, #bef264 50%, #a3e635 100%)', emoji: '🐸', name: 'Frog', baseRarity: 'common' },
    { gradient: 'linear-gradient(135deg, #fecdd3 0%, #fda4af 50%, #fb7185 100%)', emoji: '🐷', name: 'Pig', baseRarity: 'common' },
    { gradient: 'linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 50%, #a5b4fc 100%)', emoji: '🐘', name: 'Elephant', baseRarity: 'rare' },
    { gradient: 'linear-gradient(135deg, #ccfbf1 0%, #99f6e4 50%, #5eead4 100%)', emoji: '🦕', name: 'Dinosaur', baseRarity: 'legendary' },
    { gradient: 'linear-gradient(135deg, #fce7f3 0%, #fbcfe8 50%, #f9a8d4 100%)', emoji: '🦩', name: 'Flamingo', baseRarity: 'uncommon' },
    { gradient: 'linear-gradient(135deg, #fef9c3 0%, #fef08a 50%, #fde047 100%)', emoji: '🐥', name: 'Chick', baseRarity: 'common' },
    { gradient: 'linear-gradient(135deg, #f5f3ff 0%, #ede9fe 50%, #ddd6fe 100%)', emoji: '🦉', name: 'Owl', baseRarity: 'uncommon' },
    { gradient: 'linear-gradient(135deg, #ffedd5 0%, #fed7aa 50%, #fdba74 100%)', emoji: '🦘', name: 'Kangaroo', baseRarity: 'rare' },
    { gradient: 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 50%, #93c5fd 100%)', emoji: '🐋', name: 'Whale', baseRarity: 'epic' },
    { gradient: 'linear-gradient(135deg, #fef3c7 0%, #fde047 50%, #facc15 100%)', emoji: '🐤', name: 'Baby Chick', baseRarity: 'common' },
    { gradient: 'linear-gradient(135deg, #fed7aa 0%, #fb923c 50%, #f97316 100%)', emoji: '🦀', name: 'Crab', baseRarity: 'common' },
    { gradient: 'linear-gradient(135deg, #e0f2fe 0%, #7dd3fc 50%, #0ea5e9 100%)', emoji: '🐟', name: 'Fish', baseRarity: 'common' },
    { gradient: 'linear-gradient(135deg, #d1fae5 0%, #6ee7b7 50%, #10b981 100%)', emoji: '🐢', name: 'Turtle', baseRarity: 'uncommon' },
    { gradient: 'linear-gradient(135deg, #fef08a 0%, #facc15 50%, #eab308 100%)', emoji: '🐭', name: 'Mouse', baseRarity: 'common' },
    { gradient: 'linear-gradient(135deg, #fecaca 0%, #f87171 50%, #ef4444 100%)', emoji: '🐹', name: 'Hamster', baseRarity: 'common' },
    { gradient: 'linear-gradient(135deg, #ddd6fe 0%, #a78bfa 50%, #8b5cf6 100%)', emoji: '🐰', name: 'Rabbit', baseRarity: 'common' },
    { gradient: 'linear-gradient(135deg, #fed7aa 0%, #fdba74 50%, #f97316 100%)', emoji: '🦔', name: 'Hedgehog', baseRarity: 'uncommon' },
    { gradient: 'linear-gradient(135deg, #d9f99d 0%, #a3e635 50%, #84cc16 100%)', emoji: '🦎', name: 'Lizard', baseRarity: 'common' },
    { gradient: 'linear-gradient(135deg, #fbcfe8 0%, #f472b6 50%, #ec4899 100%)', emoji: '🐙', name: 'Octopus', baseRarity: 'uncommon' },
    { gradient: 'linear-gradient(135deg, #bae6fd 0%, #38bdf8 50%, #0284c7 100%)', emoji: '🦈', name: 'Shark', baseRarity: 'rare' },
    { gradient: 'linear-gradient(135deg, #fde68a 0%, #fbbf24 50%, #f59e0b 100%)', emoji: '🐨', name: 'Koala', baseRarity: 'rare' },
    { gradient: 'linear-gradient(135deg, #c7d2fe 0%, #818cf8 50%, #6366f1 100%)', emoji: '🦇', name: 'Bat', baseRarity: 'uncommon' },
    { gradient: 'linear-gradient(135deg, #fecdd3 0%, #fb7185 50%, #f43f5e 100%)', emoji: '🦞', name: 'Lobster', baseRarity: 'uncommon' },
    { gradient: 'linear-gradient(135deg, #ccfbf1 0%, #5eead4 50%, #14b8a6 100%)', emoji: '🐊', name: 'Crocodile', baseRarity: 'rare' },
    { gradient: 'linear-gradient(135deg, #fef9c3 0%, #fde047 50%, #facc15 100%)', emoji: '🦒', name: 'Giraffe', baseRarity: 'rare' },
    { gradient: 'linear-gradient(135deg, #e0e7ff 0%, #a5b4fc 50%, #818cf8 100%)', emoji: '🦏', name: 'Rhino', baseRarity: 'epic' },
    { gradient: 'linear-gradient(135deg, #d1fae5 0%, #6ee7b7 50%, #34d399 100%)', emoji: '🦛', name: 'Hippo', baseRarity: 'rare' },
    { gradient: 'linear-gradient(135deg, #fed7aa 0%, #fb923c 50%, #ea580c 100%)', emoji: '🐯', name: 'Tiger', baseRarity: 'epic' },
    { gradient: 'linear-gradient(135deg, #fef3c7 0%, #fcd34d 50%, #f59e0b 100%)', emoji: '🐵', name: 'Monkey', baseRarity: 'uncommon' },
    { gradient: 'linear-gradient(135deg, #fecaca 0%, #fca5a5 50%, #f87171 100%)', emoji: '🦙', name: 'Llama', baseRarity: 'uncommon' },
    { gradient: 'linear-gradient(135deg, #ddd6fe 0%, #c4b5fd 50%, #a78bfa 100%)', emoji: '🦚', name: 'Peacock', baseRarity: 'rare' },
    { gradient: 'linear-gradient(135deg, #bae6fd 0%, #7dd3fc 50%, #38bdf8 100%)', emoji: '🐦', name: 'Bird', baseRarity: 'common' },
    { gradient: 'linear-gradient(135deg, #fde68a 0%, #fbbf24 50%, #f59e0b 100%)', emoji: '🐴', name: 'Horse', baseRarity: 'common' },
    { gradient: 'linear-gradient(135deg, #d9f99d 0%, #bef264 50%, #a3e635 100%)', emoji: '🦗', name: 'Cricket', baseRarity: 'common' },
    { gradient: 'linear-gradient(135deg, #fbcfe8 0%, #f9a8d4 50%, #f472b6 100%)', emoji: '🦟', name: 'Mosquito', baseRarity: 'common' },
    { gradient: 'linear-gradient(135deg, #ccfbf1 0%, #99f6e4 50%, #5eead4 100%)', emoji: '🐌', name: 'Snail', baseRarity: 'common' },
    { gradient: 'linear-gradient(135deg, #fef9c3 0%, #fef08a 50%, #fde047 100%)', emoji: '🦆', name: 'Duck', baseRarity: 'common' },
    { gradient: 'linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 50%, #a5b4fc 100%)', emoji: '🦢', name: 'Swan', baseRarity: 'uncommon' },
    { gradient: 'linear-gradient(135deg, #fed7aa 0%, #fdba74 50%, #fb923c 100%)', emoji: '🦜', name: 'Parrot', baseRarity: 'uncommon' },
    { gradient: 'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 50%, #6ee7b7 100%)', emoji: '🦖', name: 'T-Rex', baseRarity: 'legendary' },
    { gradient: 'linear-gradient(135deg, #fde68a 0%, #fcd34d 50%, #fbbf24 100%)', emoji: '🐿️', name: 'Squirrel', baseRarity: 'common' },
    { gradient: 'linear-gradient(135deg, #e5e7eb 0%, #d1d5db 50%, #9ca3af 100%)', emoji: '🐺', name: 'Wolf', baseRarity: 'common' },
    { gradient: 'linear-gradient(135deg, #d1d5db 0%, #9ca3af 50%, #6b7280 100%)', emoji: '🦝', name: 'Raccoon', baseRarity: 'common' },
    { gradient: 'linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 50%, #d1d5db 100%)', emoji: '🐑', name: 'Sheep', baseRarity: 'common' },
    { gradient: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 50%, #d97706 100%)', emoji: '🐮', name: 'Cow', baseRarity: 'common' },
    { gradient: 'linear-gradient(135deg, #6ee7b7 0%, #34d399 50%, #059669 100%)', emoji: '🪲', name: 'Beetle', baseRarity: 'common' },
    { gradient: 'linear-gradient(135deg, #d9f99d 0%, #a3e635 50%, #65a30d 100%)', emoji: '🐛', name: 'Caterpillar', baseRarity: 'common' },
    { gradient: 'linear-gradient(135deg, #9ca3af 0%, #6b7280 50%, #4b5563 100%)', emoji: '🪰', name: 'Fly', baseRarity: 'common' },
    { gradient: 'linear-gradient(135deg, #6b7280 0%, #4b5563 50%, #374151 100%)', emoji: '🦡', name: 'Badger', baseRarity: 'common' },
    { gradient: 'linear-gradient(135deg, #d97706 0%, #b45309 50%, #92400e 100%)', emoji: '🦫', name: 'Beaver', baseRarity: 'uncommon' },
    { gradient: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 50%, #bae6fd 100%)', emoji: '🐻‍❄️', name: 'Polar Bear', baseRarity: 'uncommon' },
    { gradient: 'linear-gradient(135deg, #92400e 0%, #78350f 50%, #451a03 100%)', emoji: '🦦', name: 'Otter', baseRarity: 'uncommon' },
    { gradient: 'linear-gradient(135deg, #1f2937 0%, #111827 50%, #030712 100%)', emoji: '🦨', name: 'Skunk', baseRarity: 'uncommon' },
    { gradient: 'linear-gradient(135deg, #78350f 0%, #451a03 50%, #292524 100%)', emoji: '🐗', name: 'Boar', baseRarity: 'uncommon' },
    { gradient: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 50%, #991b1b 100%)', emoji: '🦃', name: 'Turkey', baseRarity: 'uncommon' },
    { gradient: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 50%, #d97706 100%)', emoji: '🦅', name: 'Eagle', baseRarity: 'rare' },
    { gradient: 'linear-gradient(135deg, #d97706 0%, #92400e 50%, #78350f 100%)', emoji: '🦌', name: 'Deer', baseRarity: 'rare' },
    { gradient: 'linear-gradient(135deg, #fef3c7 0%, #fde047 50%, #d97706 100%)', emoji: '🐪', name: 'Camel', baseRarity: 'rare' },
    { gradient: 'linear-gradient(135deg, #92400e 0%, #78350f 50%, #451a03 100%)', emoji: '🦬', name: 'Bison', baseRarity: 'rare' },
    { gradient: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 50%, #1f2937 100%)', emoji: '🐆', name: 'Leopard', baseRarity: 'epic' },
    { gradient: 'linear-gradient(135deg, #78350f 0%, #57534e 50%, #44403c 100%)', emoji: '🦣', name: 'Mammoth', baseRarity: 'epic' },
    { gradient: 'linear-gradient(135deg, #dc2626 0%, #f97316 50%, #fbbf24 100%)', emoji: '🐉', name: 'Dragon', baseRarity: 'legendary' },
    { gradient: 'linear-gradient(135deg, #10b981 0%, #059669 50%, #fbbf24 100%)', emoji: '🐍', name: 'Basilisk', baseRarity: 'legendary' },
    { gradient: 'linear-gradient(135deg, #fbbf24 0%, #dc2626 50%, #7c2d12 100%)', emoji: '🐲', name: 'Chinese Dragon', baseRarity: 'mythical' },
    { gradient: 'linear-gradient(135deg, #ff6b00 0%, #fbbf24 50%, #fef3c7 100%)', emoji: '🕊️', name: 'Phoenix', baseRarity: 'mythical' },
    { gradient: 'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 50%, #6ee7b7 100%)', emoji: '🦎', name: 'Gecko', baseRarity: 'common' },
    { gradient: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 50%, #fcd34d 100%)', emoji: '🐕', name: 'Dog', baseRarity: 'common' },
    { gradient: 'linear-gradient(135deg, #d1d5db 0%, #9ca3af 50%, #6b7280 100%)', emoji: '🐈‍⬛', name: 'Black Cat', baseRarity: 'common' },
    { gradient: 'linear-gradient(135deg, #fed7aa 0%, #fdba74 50%, #fb923c 100%)', emoji: '🦭', name: 'Harbor Seal', baseRarity: 'common' },
    { gradient: 'linear-gradient(135deg, #bae6fd 0%, #7dd3fc 50%, #38bdf8 100%)', emoji: '🪿', name: 'Wild Goose', baseRarity: 'uncommon' },
    { gradient: 'linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 50%, #d1d5db 100%)', emoji: '🐅', name: 'Frost Tiger', baseRarity: 'uncommon' },
    { gradient: 'linear-gradient(135deg, #d9f99d 0%, #bef264 50%, #a3e635 100%)', emoji: '🍄', name: 'Forest Sprite', baseRarity: 'uncommon' },
    { gradient: 'linear-gradient(135deg, #fca5a5 0%, #f87171 50%, #ef4444 100%)', emoji: '🦂', name: 'Fire Scorpion', baseRarity: 'rare' },
    { gradient: 'linear-gradient(135deg, #9ca3af 0%, #6b7280 50%, #4b5563 100%)', emoji: '🐕‍🦺', name: 'Shadow Wolf', baseRarity: 'rare' },
    { gradient: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 50%, #d97706 100%)', emoji: '🐐', name: 'Manticore', baseRarity: 'epic' },
    { gradient: 'linear-gradient(135deg, #fef3c7 0%, #fde047 50%, #facc15 100%)', emoji: '🐏', name: 'Star Stag', baseRarity: 'legendary' },
    { gradient: 'linear-gradient(135deg, #2BEFFF 0%, #0ea5e9 50%, #0284c7 100%)', emoji: '🌌', name: 'Cosmic Whale', baseRarity: 'exotic' },
    { gradient: 'linear-gradient(135deg, #454545 0%, #374151 50%, #1f2937 100%)', emoji: '🌟', name: 'Celestial Spirit', baseRarity: 'secret' },
    { gradient: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 50%, #d97706 100%)', emoji: '💍', name: 'Gold Ring', baseRarity: 'uncommon' },
    { gradient: 'linear-gradient(135deg, #c7d2fe 0%, #a5b4fc 50%, #818cf8 100%)', emoji: '💎', name: 'Diamond', baseRarity: 'rare' },
    { gradient: 'linear-gradient(135deg, #fef3c7 0%, #fde047 50%, #facc15 100%)', emoji: '👑', name: 'Crown', baseRarity: 'epic' },
    { gradient: 'linear-gradient(135deg, #fed7aa 0%, #fdba74 50%, #fb923c 100%)', emoji: '🪙', name: 'Gold Coin', baseRarity: 'common' },
    { gradient: 'linear-gradient(135deg, #fce7f3 0%, #fbcfe8 50%, #f9a8d4 100%)', emoji: '💖', name: 'Pink Gem', baseRarity: 'uncommon' },
    { gradient: 'linear-gradient(135deg, #d1fae5 0%, #6ee7b7 50%, #10b981 100%)', emoji: '💚', name: 'Emerald Heart', baseRarity: 'rare' },
    { gradient: 'linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 50%, #a5b4fc 100%)', emoji: '🔮', name: 'Crystal Ball', baseRarity: 'epic' },
    { gradient: 'linear-gradient(135deg, #fef9c3 0%, #fde047 50%, #eab308 100%)', emoji: '📿', name: 'Golden Beads', baseRarity: 'common' },
    { gradient: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 50%, #d97706 100%)', emoji: '🏆', name: 'Trophy', baseRarity: 'rare' },
    { gradient: 'linear-gradient(135deg, #fecaca 0%, #fca5a5 50%, #f87171 100%)', emoji: '💝', name: 'Ruby Box', baseRarity: 'uncommon' },
    { gradient: 'linear-gradient(135deg, #d1d5db 0%, #9ca3af 50%, #6b7280 100%)', emoji: '⚜️', name: 'Silver Fleur', baseRarity: 'uncommon' },
    { gradient: 'linear-gradient(135deg, #fef3c7 0%, #fcd34d 50%, #f59e0b 100%)', emoji: '🌟', name: 'Star Jewel', baseRarity: 'legendary' }
];

const rarityColors = {
    common: '#f3f4f6',
    uncommon: '#d1fae5',
    rare: '#dbeafe',
    epic: '#e9d5ff',
    legendary: '#fef3c7',
    mythical: 'linear-gradient(135deg, #AB0E0E 0%, #DC2626 50%, #EF4444 100%)',
    exotic: '#2BEFFF',
    secret: '#454545',
    boss: 'linear-gradient(135deg, #3d0a2e 0%, #4a0e3a 50%, #5a1045 100%)'
};

const rarityLabels = {
    common: 'Common',
    uncommon: 'Uncommon',
    rare: 'Rare',
    epic: 'Epic',
    legendary: 'Legendary',
    mythical: 'Mythical',
    exotic: 'Exotic',
    secret: 'Secret',
    boss: 'Boss'
};
