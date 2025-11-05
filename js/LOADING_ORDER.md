# JavaScript Module Loading Order

This document specifies the correct order to load JavaScript modules in your HTML file.

## Loading Order (Add to HTML in this sequence)

```html
<!-- 1. Configuration (no dependencies) -->
<script src="js/config.js"></script>

<!-- 2. Data Layer -->
<script src="js/data/collectibles.js"></script>
<script src="js/data/levels.js"></script>
<script src="js/data/pictures.js"></script>

<!-- 3. Core Layer -->
<script src="js/core/game-state.js"></script>
<script src="js/core/storage.js"></script>
<script src="js/core/question-generator.js"></script>

<!-- 4. UI Layer -->
<script src="js/ui/animations.js"></script>
<script src="js/ui/ui-controller.js"></script>
<script src="js/ui/modals.js"></script>

<!-- 5. Gameplay Layer -->
<script src="js/gameplay/picture-reveal.js"></script>
<script src="js/gameplay/performance-tracker.js"></script>
<script src="js/gameplay/boss-battle.js"></script>
<script src="js/gameplay/level-controller.js"></script>

<!-- 6. Test Mode -->
<script src="js/test-mode.js"></script>

<!-- 7. Main Controller (must be last) -->
<script src="js/main.js"></script>
```

## Module Dependency Tree

```
config.js (no dependencies)
│
├── data/collectibles.js
│   └── data/pictures.js
│
├── data/levels.js
│
├── core/game-state.js
│
├── core/storage.js
│   └── ui/ui-controller.js
│       └── ui/modals.js
│
├── ui/animations.js
│
├── core/question-generator.js
│
├── gameplay/picture-reveal.js
│
├── gameplay/performance-tracker.js
│
├── gameplay/boss-battle.js
│
├── gameplay/level-controller.js
│
├── test-mode.js
│
└── main.js (depends on everything)
```

## Module Descriptions

### Configuration
- **config.js**: Global constants, grid size, test mode initialization

### Data Layer
- **data/collectibles.js**: All animal collectibles, rarity system
- **data/levels.js**: Level configurations, practice types, question types
- **data/pictures.js**: Background selection logic

### Core Layer
- **core/game-state.js**: Centralized state management with getters/setters
- **core/storage.js**: LocalStorage operations for persistence
- **core/question-generator.js**: Question generation logic

### UI Layer
- **ui/animations.js**: Sound effects and visual animations
- **ui/ui-controller.js**: UI updates, collection display, timer
- **ui/modals.js**: Modal dialogs (intro, completion, collection viewer)

### Gameplay Layer
- **gameplay/picture-reveal.js**: Grid creation and cell reveal mechanics
- **gameplay/performance-tracker.js**: Timer and performance tracking
- **gameplay/boss-battle.js**: Boss battle mechanics (Level 5)
- **gameplay/level-controller.js**: Level initialization and transitions

### Other
- **test-mode.js**: Debug and test functions
- **main.js**: Main controller, answer checking, event listeners, initialization

## Global Namespace

All modules attach to the global `window.Game` object:

```javascript
window.Game = {
    // Config
    GRID_SIZE, GRID_OFFSET, testMode, etc.

    // Data
    COLLECTIBLES, LEVEL_CONFIG, PRACTICE_TYPES, QUESTION_TYPES,
    rarityColors, rarityLabels,

    // State (getters/setters)
    getCurrentLevel(), setCurrentLevel(),
    getCells(), setCells(), etc.

    // Functions
    generateQuestion(), checkAnswer(), startLevel(),
    playSound(), updateUI(), saveCollection(), etc.
}
```

## Features Preserved

✅ All 5 levels (single-add, review, double-add, review, boss)
✅ Picture reveal mechanics with crack animations
✅ Boss battle with movement and combat
✅ Collectibles system with 80+ animals
✅ Rarity system (common to secret)
✅ Performance tracking (mistakes, speed, slow questions)
✅ Test mode with debugging tools
✅ LocalStorage persistence
✅ Pause functionality
✅ Sound effects (all generated in-browser)
✅ Responsive grid system
✅ Practice question generation from mistakes

## Migration Notes

1. Replace your old `<script>` tags with the loading order above
2. All functionality is preserved - no breaking changes
3. The code is now organized into logical modules
4. Each module has clear dependencies documented in comments
5. All functions are accessible via the global `Game` object
