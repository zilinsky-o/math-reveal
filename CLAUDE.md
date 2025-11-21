# CLAUDE.md - AI Assistant Guide for Math Reveal Game

This document provides comprehensive guidance for AI assistants working on the Math Picture Reveal Game codebase.

---

## 📋 Repository Overview

**Project Name:** Math Picture Reveal Game
**Version:** v3.0.0
**Type:** Multi-file educational web game
**Target Audience:** Elementary-age children (designed for a 9-year-old)
**Tech Stack:** Pure HTML5, CSS3, and Vanilla JavaScript (zero dependencies)

**Purpose:** An interactive educational game where children practice addition skills through a picture-reveal mechanic and pathfinding challenges, with collectible animal and jewelry rewards across 6 progressive levels, culminating in an exciting boss battle. Features a weapons/abilities system where players collect power-ups in Level 3 to use strategically during the Level 6 boss battle.

---

## 🗂️ Codebase Structure

### File Organization

```
/home/user/math-reveal/
├── index.html          # Main HTML structure (146 lines)
├── styles.css          # All CSS styling and animations (1223 lines)
├── config.js           # Game configuration and collectibles (267 lines)
├── storage.js          # localStorage management (240 lines)
├── audio.js            # Web Audio API sound system (194 lines)
├── boss.js             # Boss battle mechanics (207 lines)
├── test-mode.js        # Debug and test functionality (133 lines)
├── game.js             # Core game logic (747 lines)
├── README.md           # User-facing documentation
├── readme.md           # Detailed technical documentation
├── CLAUDE.md           # AI assistant guide (this file)
└── .git/               # Git repository metadata
```

### Architecture Overview

**This is a modular multi-file application** (refactored from single-file design).

- NO build process required
- NO package.json or npm dependencies
- NO external libraries or frameworks
- Deployment = copy all files to any web server or open index.html locally
- Clear separation of concerns for better maintainability
- All files use vanilla JavaScript (ES5 compatible)

**Key Benefits:**
- Easier to navigate and understand
- Better code organization by functionality
- Simplified debugging and testing
- Improved maintainability

---

## 📐 File Structure and Contents

### 1. **index.html** (146 lines)
Main HTML structure and markup:
- DOCTYPE and head section with CSS link
- Game board, question box, completion screen
- Pathfinding arena (Level 3)
- Boss arena (Level 6)
- Collection modal
- Level intro screens
- Test mode panel
- Script tags for JavaScript modules (loaded in dependency order)

### 2. **styles.css** (1,412 lines)
All styling and animations:
- Reset and base styles
- Layout (flexbox/grid)
- Component styles (game-board, question-box, etc.)
- Level themes (purple, orange, teal, green, indigo, red)
- Animations (fadeIn, scaleIn, bounce, pulse, throwBall, shake)
- Pathfinding arena styles (Level 3)
- Boss battle styles (Level 6)
- Responsive design (@media queries)

### 3. **config.js** (280+ lines)
Game configuration and static data:
- Constants (GRID_SIZE, CELLS_PER_ANSWER, PATHFINDING_GRID_SIZE, SECRET_SQUARES_COUNT, etc.)
- WEAPONS (pistol, jet, web - weapon/ability definitions)
- PRACTICE_TYPES (A: Practice, B: Challenge Review, C: Boss Challenge, D: Pathfinding)
- QUESTION_TYPES (single-add, double-add, etc.)
- LEVEL_CONFIG (6 level definitions)
- backgrounds array (99 collectibles: 87 animals + 12 jewelry items)
- rarityColors and rarityLabels

### 4. **storage.js** (307+ lines)
localStorage management:
- saveCollection() / loadCollection()
- addToCollection() / removeFromCollection()
- getHighestLevel() / saveHighestLevel()
- determineRarity() - Progressive rarity system
- selectRandomBackground(currentLevel) - Level-specific collectibles
- updateCollectionCount() / updateCollectiblesPane()
- viewCollection() / closeCollection()
- **Weapons Management:**
  - saveWeapons() / loadWeapons()
  - addWeapon(weaponType) / useWeapon(weaponType)
  - getWeaponCount(weaponType)
  - updateWeaponsUI()

### 5. **audio.js** (194 lines)
Web Audio API sound system:
- initAudio() - Initialize audio context
- playSound() - Core sound generation
- playSuccessSound() / playFailSound()
- playCellRevealSound()
- playCompletionSound() / playBossVictorySound()
- startBackgroundMusic() / updateBackgroundMusicSpeed()
- stopBackgroundMusic()

### 6. **boss.js** (392+ lines)
Boss battle mechanics (Level 6):
- initializeBossBattle() - Setup boss fight
- moveBossTowardsPlayer() - Boss advances at 1%/sec (affected by web slow)
- moveBossAway() - Push boss back ~6.67%
- updateBossProgressBar()
- throwBombAtBoss() / throwBombMiss() - Combat animations
- winBossBattle() / loseBossBattle()
- restartFromBossLoss()
- **Weapon System:**
  - useWeaponInBattle(weaponType) - Main weapon handler
  - usePistol() - Fire bullet at boss, pushes back
  - useJet() - Airstrike animation, freezes boss
  - useWeb() - Apply spider web, slows boss by 50% for 30s
  - unfreezeAndRemoveJetEffect() - Unfreeze boss after jet
  - State tracking: bossIsFrozen, webSlowActive, webSlowTimeout

### 7. **test-mode.js** (128+ lines)
Debug and testing tools:
- testMode detection from URL (?test=true)
- revealAll() - Complete all cells instantly
- jumpToLevel() - Switch between 6 levels
- populateCollectibleSelector()
- addTestCollectible()
- addAllWeapons() - Add one of each weapon/ability
- Panic button (R key) to toggle test panel
- Test mode now skips adding collectibles on level completion

### 8. **game.js** (955+ lines)
Core game logic and state:
- Global state variables (currentLevel, cells, currentQuestion, pathfindingTiles, avatarPosition, secretSquares, etc.)
- Timer functions (updateTimer, startTimer, stopTimer, togglePause)
- Cell management (createCrackSVG, createGrid, updateCell)
- **Pathfinding functions:**
  - createPathfindingGrid - Now generates 3 random secret squares
  - updateAvatarPosition, updateChestPosition
  - getAdjacentTiles, updateAdjacentTiles
  - handleTileClick, moveAvatarTo
  - showWeaponDiscovery() - Display weapon discovery modal
  - closeWeaponDiscovery()
- Level management (initializeLevel, showLevelIntro, startLevel)
- Question generation (generateRandomQuestionFromType, generateQuestion)
- Answer checking (checkAnswer) - Handles normal, pathfinding, and boss levels (unfreezes boss after jet use)
- generatePracticeQuestions() - For Levels 2 and 5
- showCompletion() / goToNextLevel() - Skip collectibles in test mode
- restartGame()
- Event listeners (DOMContentLoaded, Enter key, etc.)

---

## 🎮 Game Architecture

### 6 Level System

1. **Level 1** - Practice Addition (2-10 + 2-10)
   - Type A: Random practice
   - 8×8 grid (64 cells)
   - Tracks mistakes/slow answers for Level 2
   - Collectibles: Animals

2. **Level 2** - Challenge Review (from Level 1)
   - Type B: Practice-set review
   - Minimum 10 questions
   - Reviews mistakes + slow answers (20+ seconds)
   - Collectibles: Animals

3. **Level 3** - Treasure Chest Pathfinding
   - Type D: Pathfinding
   - 9×9 grid of tiles
   - Avatar starts at middle-left (row 4, col 0)
   - Treasure chest at middle-right (row 4, col 8)
   - **Secret Squares**: 3 random tiles marked with "?" contain weapons/abilities
     - Walk into secret squares to discover weapons
     - Each square gives one random weapon (pistol, jet, or web)
     - Secret squares can only be collected once each
     - Weapons saved to localStorage for use in Level 6
   - Click adjacent tiles to reveal math questions
   - Correct answer: Tile becomes path, avatar moves there
   - Wrong answer: Tile permanently blocked (except chest tile - allows retry)
   - Win: Reach the treasure chest
   - Collectibles: Jewelry and precious items (💍, 💎, 👑, etc.)

4. **Level 4** - Double-Digit Addition (11-90 + 2-9)
   - Type A: Random practice
   - Same grid mechanics as Level 1
   - Tracks mistakes/slow answers for Level 5
   - Collectibles: Animals

5. **Level 5** - Challenge Review (from Level 4)
   - Type B: Practice-set review
   - Reviews Level 4 difficulties
   - Collectibles: Animals

6. **Level 6** - Boss Battle
   - Type C: Boss challenge
   - Mixed single-digit and double-digit questions
   - Boss moves toward player at 1% per second (affected by web slow)
   - **Weapons/Abilities**: Use weapons collected from Level 3
     - Click weapon circles (top-left) to activate
     - Pistol: Push boss back (~6.67%), same as correct answer
     - Fighter Jet: Airstrike animation, freezes boss until next correct answer
     - Spider Web: Slow boss speed by 50% for 30 seconds
   - Win: Push boss to 90% (prison)
   - Lose: Boss reaches 10% (player avatar)
   - Collectibles: Boss trophy (👹)

### Key Configuration Objects

**PRACTICE_TYPES** (config.js)
```javascript
{
  A: { name: 'Practice', cellsPerAnswer: 6, requiresRetry: true, questionSource: 'random' },
  B: { name: 'Challenge Review', cellsPerAnswer: 6, requiresRetry: false, questionSource: 'practice-set' },
  C: { name: 'Boss Challenge', cellsPerAnswer: 0, requiresRetry: false, questionSource: 'mixed' },
  D: { name: 'Pathfinding', cellsPerAnswer: 1, requiresRetry: false, questionSource: 'random' }
}
```

**QUESTION_TYPES** (config.js)
```javascript
{
  'single-add': { operation: '+', rowRange: [2, 10], ... },
  'double-add': { operation: '+', rowRange: [11, 90], ... },
  ...
}
```

**LEVEL_CONFIG** (config.js)
```javascript
{
  1: { practiceType: 'A', questionType: 'single-add', theme: 'purple', ... },
  2: { practiceType: 'B', questionType: 'single-add', theme: 'orange', sourceLevel: 1, ... },
  3: { practiceType: 'D', questionType: 'single-add', theme: 'teal', ... },
  4: { practiceType: 'A', questionType: 'double-add', theme: 'green', ... },
  5: { practiceType: 'B', questionType: 'double-add', theme: 'indigo', sourceLevel: 4, ... },
  6: { practiceType: 'C', questionType: 'mixed', theme: 'red', ... }
}
```

**backgrounds array** (config.js)
- 99 unique collectibles with emojis
  - 87 animals (indices 0-86)
  - 12 jewelry items (indices 87-98): 💍 Gold Ring, 💎 Diamond, 👑 Crown, 🪙 Gold Coin, 💖 Pink Gem, 💚 Emerald Heart, 🔮 Crystal Ball, 📿 Pearl Necklace, 🏆 Trophy, 💝 Ruby Box, ⚜️ Fleur-de-lis, 🌟 Glowing Star
- Rarity tiers: Common, Uncommon, Rare, Epic, Legendary, Mythical, Exotic, Secret
- Rarity weights: 60%, 25%, 10%, 4%, 1%, 0.5%, 0.35%, 0.1%
- Level 3 exclusively gives jewelry collectibles (indices 87-98)

### State Management

**Global state variables** (game.js):
```javascript
let currentLevel = 1;
let cells = {};  // { "0-0": { correctAnswers: 0-2, completed: false }, ... }
let currentQuestion = null;
let cellsDiscovered = 0;
let totalMistakes = 0;
let mistakeLog = {};
let slowLog = {};
let fastLog = {};
let isPaused = false;
let bossPosition = 50;  // Level 6 only (defined in boss.js)
let bossInterval = null;
// Pathfinding state (Level 3)
let pathfindingTiles = {};  // { "4-0": { state: 'path', row: 4, col: 0 }, ... }
let avatarPosition = { row: 4, col: 0 };
let chestPosition = { row: 4, col: 8 };
let pendingTileClick = null;
// ... and more
```

**Cell state system (Levels 1, 2, 4, 5):**
- 0 correct answers = covered
- 1 correct answer = cracked (70% opacity)
- 2 correct answers = revealed (transparent)

**Tile state system (Level 3):**
- 'covered' = unvisited tile (teal)
- 'adjacent' = highlighted tile next to avatar (yellow, pulsing)
- 'path' = answered correctly, can walk on (green)
- 'blocked' = answered wrong, permanently blocked (red with ❌)
- Exception: chest tile never blocks, allows retry on wrong answer

### Data Persistence (localStorage)

**Keys:**
- `mathGameCollection` - Array of collected animals with metadata
- `mathGameHighestLevel` - Highest level completed (number)

**Functions:** (storage.js)
- `saveCollection(collection)`
- `loadCollection()`
- `addToCollection(emoji, name)`
- `removeFromCollection(emoji)`
- `getHighestLevel()`
- `saveHighestLevel(level)`
- `determineRarity(highestLevel)`
- `selectRandomBackground()`

---

## 🎨 Naming Conventions

**STRICT - Follow these patterns:**

| Type | Convention | Examples |
|------|-----------|----------|
| Constants | `UPPER_SNAKE_CASE` | `GRID_SIZE`, `PRACTICE_TYPES`, `COLLECTIBLES` |
| Functions | `camelCase` | `checkAnswer`, `generateQuestion`, `startLevel` |
| Variables | `camelCase` | `currentLevel`, `cellsDiscovered`, `isPaused` |
| CSS Classes | `kebab-case` | `.game-board`, `.boss-arena`, `.grid-cell` |
| HTML IDs | `kebab-case` | `#level-intro`, `#boss-character`, `#answer-input` |

---

## 🎯 Key Functions to Know

### Game Flow Functions (game.js)

**`initializeLevel()`**
- Initializes cell state for current level
- Resets mistakes and logs
- Prepares practice questions for review levels

**`showLevelIntro()`**
- Displays level intro screen with START button
- Sets up description and visual theme
- Shows boss emoji for Level 6

**`startLevel()`**
- Initializes cells for the current level
- Generates first question
- Sets up grid and UI
- Calls `initializeBossBattle()` for Level 6

**`generateQuestion()`**
- Creates questions based on QUESTION_TYPES
- Handles retry queue for wrong answers
- Alternates question types for Level 6
- Sources from practice set for Levels 2 and 4

**`checkAnswer()`**
- Validates player's answer
- Updates cells (progress or regress)
- Tracks mistakes, fast, and slow responses
- Checks for level completion
- Boss battle: Pushes boss back or lets boss advance

**`updateCell(cellKey)`** (game.js)
- Updates cell state (0=covered, 1=cracked, 2=revealed)
- Applies visual changes to DOM based on correctAnswers

**`showCompletion()`**
- Displays end-of-level report
- Awards collectible
- Shows "Next Level" or "View Collection" button
- Saves mistake/slow logs for Levels 1 and 3

**`generatePracticeQuestions(sourceLevel)`**
- Generates questions for Levels 2 and 4
- Combines mistakes and slow answers from previous level
- Ensures minimum 10 questions

### Boss Battle Functions (boss.js)

**`initializeBossBattle()`**
- Initializes boss position at 50%
- Starts boss movement interval (1% per second)
- Sets up boss arena UI
- Starts background music

**`moveBossTowardsPlayer()`**
- Moves boss toward player at 1%/sec
- Checks for defeat condition (boss reaches 10%)
- Shows danger warning when close
- Updates background music speed

**`moveBossAway()`**
- Pushes boss back by ~6.67% per correct answer
- Checks for victory condition (boss reaches 90%)
- Triggers win/lose battle functions

**`throwBombAtBoss()` / `throwBombMiss()`**
- Animations when player answers correctly/incorrectly
- Shows explosion effect on hit

**`winBossBattle()` / `loseBossBattle()`**
- Handles battle conclusion
- Awards boss collectible on win
- Shows restart modal on loss

### Audio Functions (audio.js)

**Uses Web Audio API**

**`playSound(frequency, duration, type, delay)`**
- Core tone generation function
- Creates oscillator and gain nodes

**Pre-composed sounds:**
- `playSuccessSound()` - Three ascending tones (C5, E5, G5)
- `playFailSound()` - Two descending tones (G4, F4)
- `playCellRevealSound()` - Four ascending tones
- `playCompletionSound()` - 10-note victory melody
- `playBossVictorySound()` - Extended victory fanfare

**Background music:**
- `startBackgroundMusic()` - Begins ominous boss music
- `updateBackgroundMusicSpeed()` - Speeds up as boss approaches
- `stopBackgroundMusic()` - Clears music intervals

### Storage Functions (storage.js)

**`selectRandomBackground()`**
- Weighted random selection based on rarity
- Progressive rarity bonuses (+2% per level completed)
- Returns animal from backgrounds array

**`addToCollection(emoji, name)`**
- Adds to collection or increments duplicate count
- Updates localStorage
- Tracks firstFound and lastFound timestamps
- Calls `updateCollectionCount()`

**`viewCollection()` / `closeCollection()`**
- Opens/closes collection modal
- Displays all collected animals with tooltips
- Shows delete buttons in test mode

### Test Mode Functions (test-mode.js)

**`revealAll()`**
- Completes all remaining cells instantly
- Triggers `showCompletion()`

**`jumpToLevel(level)`**
- Switches to specified level
- Validates prerequisites for Levels 2 and 4

**`addTestCollectible()`**
- Adds selected animal from dropdown to collection

---

## 🧪 Test Mode

**Access:** `index.html?test=true`

**Features:**
1. **Reveal All & End** - Completes current level instantly
2. **View Collection** - Opens collection modal
3. **Level Jump** - Dropdown to switch levels (validates prerequisites)
4. **Add Collectible** - Dropdown to add any animal to collection
5. **Delete Collectible** - Hover over collected animals to see × button
6. **Panic Button** - Press 'R' key to toggle test panel visibility (added in recent commits)

**Test Mode Implementation:** (test-mode.js)

**Important:** Test panel is visually distinct with red border and fixed top-left positioning.

---

## 🔧 Development Workflows

### Making Changes

**1. Locate the relevant file and function**
   - **HTML changes:** index.html
   - **Styling:** styles.css
   - **Configuration:** config.js (LEVEL_CONFIG, QUESTION_TYPES, backgrounds)
   - **Game logic:** game.js (questions, answers, levels, cells)
   - **Boss mechanics:** boss.js
   - **Storage/collection:** storage.js
   - **Audio:** audio.js
   - **Testing:** test-mode.js
   - Use file structure references from this guide
   - Search for function names or CSS class names

**2. Follow the existing patterns**
   - Match naming conventions
   - Use consistent indentation (2 spaces for all files)
   - Maintain modular structure

**3. Test thoroughly**
   - Open index.html in browser
   - Use test mode (`?test=true`) for debugging
   - Test all affected levels
   - Verify localStorage persistence
   - Check JavaScript console for errors

**4. Document changes**
   - Update version number if significant
   - Update README.md or readme.md if user-facing
   - Update this CLAUDE.md if architecture changes

### Common Modification Patterns

#### Adding a New Level

1. Add entry to `LEVEL_CONFIG` object in **config.js**
2. Create CSS theme in **styles.css** (follow pattern of levels 1-5)
3. Add level intro HTML in **index.html** (follow pattern of existing levels)
4. Update `showLevelIntro()` in **game.js** to handle new level
5. Update `showCompletion()` in **game.js** for next level navigation
6. Test progression from previous level

#### Adding New Question Types

1. Add entry to `QUESTION_TYPES` object in **config.js**
2. Update `generateQuestion()` in **game.js** to handle new type
3. Test answer validation in `checkAnswer()` in **game.js**

#### Adding New Collectibles

1. Add to `backgrounds` array in **config.js**
2. Follow structure: `{ gradient: '...', emoji: "🦄", name: "Unicorn", baseRarity: "legendary" }`
3. Ensure rarity matches existing tiers
4. Test selection with `selectRandomBackground()` in **storage.js**

#### Modifying Audio

1. Locate audio function in **audio.js**
2. Use `playSound(frequency, duration, type, delay)`
3. Frequencies: C4=262, D4=294, E4=330, F4=349, G4=392, A4=440, B4=494, C5=523
4. Keep volume at 0.3 for consistency
5. Test in multiple browsers (Web Audio API support)

#### Adjusting Boss Mechanics

1. Boss movement rate: Modify `moveBossTowardsPlayer()` in **boss.js**
2. Boss pushback: Modify `moveBossAway()` in **boss.js**
3. Boss starting position: Change `bossPosition = 50` in **boss.js**
4. Win/lose thresholds: Modify conditions in `moveBossTowardsPlayer()` and `moveBossAway()` in **boss.js**

---

## 🚨 Critical Rules & Gotchas

### DO NOT:

1. **❌ Add external dependencies**
   - No npm packages, no CDN links, no frameworks
   - Keep it pure HTML/CSS/JS
   - All code must work in browsers without build steps

2. **❌ Break localStorage compatibility**
   - Changing keys or data structures will lose user collections
   - Always migrate data if structure changes
   - Current keys: `mathGameCollection`, `mathGameHighestLevel`

3. **❌ Change file load order**
   - JavaScript files must load in dependency order (see index.html)
   - config.js → storage.js → audio.js → boss.js → test-mode.js → game.js
   - Breaking this order will cause reference errors

4. **❌ Remove or bypass test mode**
   - Critical for debugging and development
   - Used by developers and power users

5. **❌ Hard-code magic numbers without constants**
   - Use configuration objects (LEVEL_CONFIG, PRACTICE_TYPES, etc.)
   - Define constants at top of JavaScript section

6. **❌ Use `console.log` for user communication**
   - Use DOM updates for all user-facing messages
   - Console is for debugging only

### DO:

1. **✅ Preserve educational design principles**
   - Non-punitive errors (always allow progress)
   - Spaced repetition (wrong answers retry after 2 questions)
   - Targeted practice (review mistakes/slow answers)
   - Immediate feedback (visual + audio)

2. **✅ Maintain child-friendly UX**
   - Comic Sans MS font
   - Bright, cheerful colors
   - Large, clear buttons
   - Emoji rewards
   - Encouraging messages

3. **✅ Test across browsers**
   - Chrome/Edge (recommended)
   - Firefox
   - Safari
   - Verify Web Audio API works

4. **✅ Keep performance smooth**
   - 8×8 grid should render instantly
   - Animations should be smooth (60fps)
   - No lag on answer checking

5. **✅ Maintain backward compatibility**
   - Don't break existing localStorage data
   - Don't remove features without migration path

---

## 🐛 Bug Fixes & Known Issues

### Recently Fixed (per git history)

- ✅ Level 1 CSS corruption (PR #20)
- ✅ Duplicate emojis issue
- ✅ Test mode delete buttons visibility
- ✅ Panic button (R key toggle) added

### Testing Checklist

When making changes, test:

- [ ] Level 1-5 progression works
- [ ] Cell reveal mechanics (covered → cracked → revealed)
- [ ] Mistake tracking and retry queue
- [ ] Timer pause/resume
- [ ] Level restart with confirmation
- [ ] Collection persistence (refresh page)
- [ ] Collectible rarity distribution
- [ ] Duplicate collectible counting
- [ ] Boss battle win/lose conditions
- [ ] Test mode all features
- [ ] Panic button (R key) in test mode
- [ ] Audio in different browsers
- [ ] Responsive design (mobile, tablet, desktop)

---

## 🔀 Git Workflow

### Branch Naming Convention

**Pattern:** `claude/feature-description-<session-id>`

**Examples:**
- `claude/fix-level1-css-corruption-011CUgyGfu7i9QJnEPrGJTh9`
- `claude/add-new-level-three-011CUgyGfu7i9QJnEPrGJTh9`

**Current working branch:** `claude/claude-md-mi68tf71uq02n4ap-01QoJK6EEUqRhBtgaTpDZN1e`

### Commit Message Style

**Analyze recent commits for style:**
```
Update index.html - fix and go back to panic button commit
Fix: Restore Level 1 CSS and apply clean level restructure
Add new pathfinding level 3 with tile-based gameplay
```

**Pattern:**
- Use imperative mood ("Add", "Fix", "Update")
- Be specific about what changed
- Reference level numbers or features
- Keep under 72 characters for first line

### Push Requirements

**CRITICAL:**
- Always use: `git push -u origin <branch-name>`
- Branch MUST start with `claude/` and end with session ID
- Otherwise, push will fail with 403 HTTP error
- Retry logic: 2s, 4s, 8s, 16s exponential backoff on network errors

### Creating Pull Requests

**Via git operations:**
1. Commit changes with descriptive message
2. Push to feature branch
3. User will create PR via GitHub UI (gh CLI not available)

**PR Description should include:**
- Summary of changes
- Which levels are affected
- Testing performed
- Any breaking changes or migrations needed

---

## 📊 Performance Considerations

### Current Performance Profile

**Excellent:**
- Fast file loading (8 small files vs 1 large)
- No HTTP requests for dependencies
- Minimal DOM manipulation
- Efficient cell updates (only affected cells)
- Modular code allows better browser caching

**Watch out for:**
- Excessive `updateCell()` calls in loops (game.js)
- Creating too many audio contexts (audio.js)
- Memory leaks in intervals (always clear intervals)
- Boss battle interval must be cleared on level end (boss.js)

### Optimization Tips

1. **Batch DOM updates** when revealing multiple cells (game.js)
2. **Clear intervals** when leaving Level 6 in boss battle (boss.js)
3. **Limit audio context creation** - reuse existing contexts (audio.js)
4. **Use CSS transitions** instead of JavaScript animations when possible (styles.css)
5. **Keep localStorage writes minimal** - only on significant changes (storage.js)

---

## 🎓 Educational Design Principles

**These are CORE to the project - do not violate:**

1. **Spaced Repetition**
   - Wrong answers appear again after 2 other questions
   - Implementation: retry queue in `generateQuestion()` (game.js)

2. **Targeted Practice**
   - Levels 2 & 4 focus on mistakes and slow answers
   - Minimum 10 questions ensures sufficient practice
   - Implementation: `generatePracticeQuestions()` (game.js)

3. **Non-Punitive Errors**
   - Mistakes regress cells but don't end the game
   - Always allow progress eventually
   - No "game over" except boss battle (which restarts level)

4. **Immediate Feedback**
   - Visual: Cell changes, colors, animations (styles.css, game.js)
   - Audio: Success/fail tones (audio.js)
   - Text: Mistake counter, progress indicator (game.js)

5. **Progress Visibility**
   - "X/64 Cells Discovered!"
   - Collection count badge
   - Level intro shows what's ahead

6. **Motivation Through Rewards**
   - Collectible animals with rarity system (config.js)
   - Progressive rarity bonuses (storage.js)
   - Duplicate tracking with count badges (storage.js)
   - Boss battle as finale challenge (boss.js)

---

## 🔍 Finding Code Quickly

### By File and Functionality

| Feature | File | Key Functions/Variables |
|---------|------|------------------------|
| **HTML Structure** | index.html | Game board, modals, test panel |
| **CSS Styles** | styles.css | All styling, themes, animations |
| **Game Configuration** | config.js | PRACTICE_TYPES, QUESTION_TYPES, LEVEL_CONFIG, backgrounds |
| **State Variables** | game.js | currentLevel, cells, currentQuestion, etc. |
| **localStorage** | storage.js | saveCollection, loadCollection, rarity system |
| **Audio System** | audio.js | playSound, playSuccessSound, background music |
| **Game Logic** | game.js | generateQuestion, checkAnswer, updateCell |
| **Level Management** | game.js | initializeLevel, showLevelIntro, startLevel |
| **Cell Management** | game.js | createGrid, updateCell, cell state tracking |
| **Boss Battle** | boss.js | initializeBossBattle, moveBossTowardsPlayer, throwBombAtBoss |
| **Test Mode** | test-mode.js | revealAll, jumpToLevel, addTestCollectible |

### Search Tips

**For CSS (styles.css):**
- Search for class name: `.game-board`, `.boss-arena`
- Search for level theme: `body.level-2`, `body.level-3`
- Search for animation: `@keyframes fadeIn`
- File is organized: reset → layout → components → themes → animations → responsive

**For JavaScript:**
- **config.js**: Search for `LEVEL_CONFIG`, `QUESTION_TYPES`, `backgrounds`
- **storage.js**: Search for `Collection`, `Rarity`, `localStorage`
- **audio.js**: Search for `playSound`, `Music`
- **boss.js**: Search for `Boss`, `throw`, `win`, `lose`
- **test-mode.js**: Search for `test`, `reveal`, `jump`
- **game.js**: Search for function names, `currentLevel`, `cells`, etc.

**For HTML (index.html):**
- Search for ID: `id="answer-input"`
- Search for class: `class="game-board"`
- Search for emoji: `🎮`, `📚`, `🔥`
- HTML is now concise (146 lines) with script tags at bottom

---

## 🚀 Future Development Ideas

**From readme.md (not yet implemented):**
- Additional levels (Level 6+)
- Other operations (subtraction, multiplication, division)
- Difficulty settings
- Multiple player profiles
- Statistics dashboard
- More achievements/badges
- Sound effects toggle
- Background music
- Enhanced animations
- Hint system
- Customizable grid sizes
- Timed challenge modes

**When implementing new features:**
1. Choose the appropriate file for the change (see file structure above)
2. Ensure it aligns with educational principles
3. Maintain child-friendly UX
4. Maintain modular architecture (avoid cross-file dependencies when possible)
4. Add to test mode for debugging
5. Document in README.md and readme.md
6. Update version number

---

## 📝 Documentation Updates

**When to update documentation:**

1. **README.md** - User-facing changes
   - New levels or game modes
   - Changed controls
   - New features visible to players

2. **readme.md** - Technical details
   - Architecture changes
   - New mechanics or systems
   - Configuration changes
   - Version history

3. **CLAUDE.md** (this file) - Developer guidance
   - New development patterns
   - Changed conventions
   - New functions or systems
   - Updated line number references

---

## 🎯 Quick Reference

### Useful Constants

```javascript
GRID_SIZE = 8  // 8×8 = 64 cells
CELLS_PER_ANSWER = 6  // For Type A levels
MIN_PRACTICE_QUESTIONS = 10  // For Type B levels
PATHFINDING_GRID_SIZE = 9  // 9×9 pathfinding grid
SECRET_SQUARES_COUNT = 3  // Number of weapon squares in Level 3
BOSS_START_POSITION = 50  // Level 6
BOSS_MOVE_RATE = 1  // % per second (base speed)
BOSS_PUSHBACK = 6.67  // % per correct answer
FAST_THRESHOLD = 5000  // milliseconds
SLOW_THRESHOLD = 20000  // milliseconds
```

### localStorage Keys

```javascript
'mathGameCollection'  // Array of collectibles
'mathGameHighestLevel'  // Number (1-6)
'mathGameWeapons'  // Object { pistol: 0, jet: 0, web: 0 }
```

### Test Mode URL

```
index.html?test=true
```

### Common DOM IDs

```javascript
'#answer-input'         // Input field for answers
'#check-btn'            // Check answer button
'#pause-btn'            // Pause button
'#restart-btn'          // Restart button
'#cells-discovered'     // Progress text
'#total-mistakes'       // Mistake counter
'#collection-badge'     // Collection count badge
'#boss-character'       // Boss element (Level 6)
'#player-avatar'        // Player element (Level 6)
'#boss-progress-bar'    // Boss position bar (Level 6)
```

---

## ✅ Final Checklist for AI Assistants

Before completing any task:

- [ ] Changes maintain single-file architecture
- [ ] No external dependencies added
- [ ] Educational principles preserved
- [ ] Child-friendly UX maintained
- [ ] Naming conventions followed
- [ ] Code is in the correct section (HTML/CSS/JS)
- [ ] Indentation is consistent (2 spaces)
- [ ] Test mode still works
- [ ] localStorage compatibility preserved
- [ ] Changes tested in browser
- [ ] All 6 levels still work
- [ ] Documentation updated if needed
- [ ] Commit message follows conventions
- [ ] Ready to push to claude/* branch

---

## 🤝 Questions or Issues?

**For AI Assistants:**
1. Re-read the relevant section of this guide
2. Search index.html for similar patterns
3. Check README.md and readme.md for context
4. Test changes in test mode before committing
5. Ask user for clarification if design decision is ambiguous

**For Users:**
- Report issues at: https://github.com/anthropics/claude-code/issues
- Use `/help` for Claude Code assistance

---

**Document Version:** 1.1.0
**Last Updated:** 2025-11-21
**Codebase Version:** v3.0.0
**Maintained for:** Claude Code AI Assistants

**Happy coding! 🎮✨**
