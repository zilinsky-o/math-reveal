// Configuration for Math Picture Reveal Game
// This file contains all game configuration, level definitions, and collectible data

const GRID_SIZE = 8;
const GRID_OFFSET = 2;
const CELLS_PER_ANSWER = 6;
const MIN_LEVEL_2_QUESTIONS = 10;
const MIN_LEVEL_4_QUESTIONS = 10;

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
    }
};

const LEVEL_CONFIG = {
    1: {
        practiceType: 'A',
        questionType: 'single-add',
        theme: 'purple',
        sourceLevel: null,
        title: 'LEVEL 1',
        description: 'Practice Addition!'
    },
    2: {
        practiceType: 'B',
        questionType: 'single-add',
        theme: 'orange',
        sourceLevel: 1,
        title: 'LEVEL 2',
        description: (numQuestions) => `Practice ${numQuestions} Challenging Questions!`
    },
    3: {
        practiceType: 'A',
        questionType: 'double-add',
        theme: 'green',
        sourceLevel: null,
        title: 'LEVEL 3',
        description: 'Double Digit Addition!'
    },
    4: {
        practiceType: 'B',
        questionType: 'double-add',
        theme: 'indigo',
        sourceLevel: 3,
        title: 'LEVEL 4',
        description: (numQuestions) => `Practice ${numQuestions} Challenging Questions!`
    },
    5: {
        practiceType: 'C',
        questionType: 'mixed',
        theme: 'red',
        sourceLevel: null,
        title: 'BOSS LEVEL 5',
        description: 'Defeat the Boss!'
    }
};

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
    { gradient: 'linear-gradient(135deg, #454545 0%, #374151 50%, #1f2937 100%)', emoji: '🌟', name: 'Celestial Spirit', baseRarity: 'secret' }
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
