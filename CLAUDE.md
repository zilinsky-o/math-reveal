# CLAUDE.md - AI Assistant Guide for Math Reveal Game

This document provides comprehensive guidance for AI assistants working on the Math Picture Reveal Game codebase.

---

## 📋 Repository Overview

**Project Name:** Math Picture Reveal Game
**Version:** v2.0.0
**Type:** Single-file educational web game
**Target Audience:** Elementary-age children (designed for a 9-year-old)
**Tech Stack:** Pure HTML5, CSS3, and Vanilla JavaScript (zero dependencies)

**Purpose:** An interactive educational game where children practice addition skills through a picture-reveal mechanic with collectible animal rewards across 5 progressive levels, culminating in an exciting boss battle.

---

## 🗂️ Codebase Structure

### File Organization

```
/home/user/math-reveal/
├── index.html          # ENTIRE APPLICATION (3006 lines)
│                       # Contains all HTML, CSS (~1231 lines), and JavaScript (~1642 lines)
├── README.md           # User-facing documentation (143 lines)
├── readme.md           # Detailed technical documentation (333 lines)
└── .git/               # Git repository metadata
```

### Critical Architecture Decision

**This is a monolithic single-file application by design.**

- NO build process required
- NO package.json or npm dependencies
- NO external libraries or frameworks
- Deployment = copy index.html to any web server or open locally
- Easy for non-technical users to run

**DO NOT refactor into multiple files unless explicitly requested.**

---

## 📐 Code Layout in index.html

The single file is organized in this order:

1. **HTML Structure** (lines 1-133)
   - DOCTYPE and head section
   - Game board, question box, completion screen
   - Boss arena (Level 5)
   - Collection modal
   - Level intro screens
   - Test mode panel

2. **CSS Styles** (lines 134-1364)
   - Reset and base styles
   - Layout (flexbox/grid)
   - Component styles (game-board, question-box, etc.)
   - Level themes (purple, orange, green, blue, red)
   - Animations (fadeIn, scaleIn, bounce, throwBall, shake)
   - Boss battle styles
   - Responsive design (@media queries)

3. **JavaScript Code** (lines 1365-3006)
   - Configuration objects (PRACTICE_TYPES, QUESTION_TYPES, LEVEL_CONFIG, COLLECTIBLES)
   - State variables (currentLevel, cells, currentQuestion, etc.)
   - Data persistence functions (localStorage)
   - Audio functions (Web Audio API)
   - Game logic functions (initGame, generateQuestion, checkAnswer, etc.)
   - Boss battle mechanics
   - Test mode functions
   - Initialization (DOMContentLoaded)

---

## 🎮 Game Architecture

### 5 Level System

1. **Level 1** - Practice Addition (2-10 + 2-10)
   - Type A: Random practice
   - 8×8 grid (64 cells)
   - Tracks mistakes/slow answers for Level 2

2. **Level 2** - Challenge Review (from Level 1)
   - Type B: Practice-set review
   - Minimum 10 questions
   - Reviews mistakes + slow answers (20+ seconds)

3. **Level 3** - Double-Digit Addition (11-90 + 2-9)
   - Type A: Random practice
   - Same grid mechanics as Level 1
   - Tracks mistakes/slow answers for Level 4

4. **Level 4** - Challenge Review (from Level 3)
   - Type B: Practice-set review
   - Reviews Level 3 difficulties

5. **Level 5** - Boss Battle
   - Type C: Boss challenge
   - Mixed single-digit and double-digit questions
   - Boss moves toward player at 2% per second
   - Win: Push boss to 90% (prison)
   - Lose: Boss reaches 10% (player avatar)

### Key Configuration Objects

**PRACTICE_TYPES** (lines 1369-1390)
```javascript
{
  A: { name: 'Practice', cellsPerAnswer: 6, ... },
  B: { name: 'Challenge Review', ... },
  C: { name: 'Boss Challenge', ... }
}
```

**QUESTION_TYPES** (lines 1392-1441)
```javascript
{
  'single-add': { operation: '+', rowRange: [2, 10], ... },
  'double-add': { operation: '+', rowRange: [11, 90], ... },
  ...
}
```

**LEVEL_CONFIG** (lines 1443-1484)
```javascript
{
  1: { practiceType: 'A', questionType: 'single-add', theme: 'purple', ... },
  2: { practiceType: 'B', questionType: 'single-add', theme: 'orange', ... },
  ...
}
```

**COLLECTIBLES** (lines 1486-1676)
- 72 unique animals with emojis
- Rarity tiers: Common, Uncommon, Rare, Epic, Legendary, Mythical, Exotic, Secret
- Rarity weights: 60%, 25%, 10%, 4%, 1%, 0.5%, 0.35%, 0.1%

### State Management

**Global state variables** (lines 1678-1707):
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
let bossPosition = 50;  // Level 5 only
let bossInterval = null;
// ... and more
```

**Cell state system:**
- 0 correct answers = covered
- 1 correct answer = cracked (70% opacity)
- 2 correct answers = revealed (transparent)

### Data Persistence (localStorage)

**Keys:**
- `mathGameCollection` - Array of collected animals with metadata
- `mathGameHighestLevel` - Highest level completed (number)

**Functions:** (lines 1709-1753)
- `saveCollection(collection)`
- `loadCollection()`
- `addToCollection(emoji, name, rarity)`
- `saveHighestLevel(level)`
- `loadHighestLevel()`

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

### Game Flow Functions

**`initGame()`** (line ~1755)
- Loads collection and highest level from localStorage
- Sets up test mode if `?test=true`
- Shows level intro or starts level 1

**`showLevelIntro(level)`** (line ~2060)
- Displays level intro screen with START button
- Sets up description and visual theme

**`startLevel()`** (line ~2233)
- Initializes cells for the current level
- Generates first question
- Sets up grid and UI

**`generateQuestion()`** (line ~2476)
- Creates questions based on QUESTION_TYPES
- Handles retry queue for wrong answers
- Alternates question types for Level 5

**`checkAnswer()`** (line ~2537)
- Validates player's answer
- Updates cells (progress or regress)
- Tracks mistakes, fast, and slow responses
- Checks for level completion
- Boss battle: Pushes boss back or lets boss advance

**`updateCell(cellKey, delta, isCorrect)`** (line ~2155)
- Updates cell state (0=covered, 1=cracked, 2=revealed)
- Applies visual changes to DOM

**`showCompletion()`** (line ~2794)
- Displays end-of-level report
- Awards collectible
- Shows "Next Level" or "View Collection" button

### Boss Battle Functions (Level 5)

**`startBossBattle()`** (line ~2281)
- Initializes boss position at 50%
- Starts boss movement interval (2% per second)
- Sets up boss arena UI

**`updateBossPosition()`** (line ~2366)
- Updates boss visual position
- Checks win/lose conditions
- Shows danger warning

**`throwBall()`** (line ~2448)
- Animation when player answers correctly
- Pushes boss back by 6.67%

### Audio Functions

**Uses Web Audio API** (lines 1884-2058)

**`playSound(frequency, duration, type, delay)`** (line ~1884)
- Core tone generation function

**Pre-composed sounds:**
- `playSuccessSound()` - Three ascending tones (C5, E5, G5)
- `playFailSound()` - Two descending tones (G4, F4)
- `playCellRevealSound()` - Four ascending tones
- `playCompletionSound()` - 10-note victory melody
- `playBossVictorySound()` - Extended victory fanfare

### Collectibles Functions

**`selectCollectible(level)`** (line ~1755)
- Weighted random selection based on rarity
- Progressive rarity bonuses (+2% per level completed)
- Returns `{ emoji, name, rarity }`

**`addToCollection(emoji, name, rarity)`** (line ~1730)
- Adds to collection or increments duplicate count
- Updates localStorage
- Tracks firstFound and lastFound timestamps

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

**Test Mode Implementation:** (lines ~2890-3006)

**Important:** Test panel is visually distinct with red border and fixed top-left positioning.

---

## 🔧 Development Workflows

### Making Changes

**1. Locate the relevant section in index.html**
   - Use line number references from this guide
   - Search for function names or CSS class names
   - Understand the context before editing

**2. Follow the existing patterns**
   - Match naming conventions
   - Use consistent indentation (2 spaces for HTML/CSS, 2 spaces for JS)
   - Keep code within the monolithic structure

**3. Test thoroughly**
   - Open index.html in browser
   - Use test mode (`?test=true`) for debugging
   - Test all affected levels
   - Verify localStorage persistence

**4. Document changes**
   - Update version number if significant
   - Update README.md or readme.md if user-facing
   - Update this CLAUDE.md if architecture changes

### Common Modification Patterns

#### Adding a New Level

1. Add entry to `LEVEL_CONFIG` object (~line 1443)
2. Create CSS theme (follow pattern of levels 1-5)
3. Add level intro HTML (follow pattern ~lines 50-130)
4. Update `showLevelIntro()` to handle new level
5. Update `showCompletion()` for next level navigation
6. Test progression from previous level

#### Adding New Question Types

1. Add entry to `QUESTION_TYPES` object (~line 1392)
2. Update `generateQuestion()` to handle new type
3. Test answer validation in `checkAnswer()`

#### Adding New Collectibles

1. Add to `COLLECTIBLES` array (~line 1486)
2. Follow structure: `{ emoji: "🦄", name: "Unicorn", rarity: "legendary" }`
3. Ensure rarity matches existing tiers
4. Test selection with `selectCollectible()`

#### Modifying Audio

1. Locate audio function (~lines 1884-2058)
2. Use `playSound(frequency, duration, type, delay)`
3. Frequencies: C4=262, D4=294, E4=330, F4=349, G4=392, A4=440, B4=494, C5=523
4. Keep volume at 0.3 for consistency
5. Test in multiple browsers (Web Audio API support)

#### Adjusting Boss Mechanics

1. Boss movement rate: Change `2` in `setInterval` (~line 2290)
2. Boss pushback: Change `6.67` in `checkAnswer()` (~line 2600)
3. Boss starting position: Change `bossPosition = 50` (~line 1707)
4. Win/lose thresholds: Modify conditions in `updateBossPosition()` (~line 2380)

---

## 🚨 Critical Rules & Gotchas

### DO NOT:

1. **❌ Split into multiple files** unless explicitly requested
   - This breaks the "single-file portability" design principle
   - Users should be able to copy one HTML file and run it

2. **❌ Add external dependencies**
   - No npm packages, no CDN links, no frameworks
   - Keep it pure HTML/CSS/JS

3. **❌ Break localStorage compatibility**
   - Changing keys or data structures will lose user collections
   - Always migrate data if structure changes

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
- Single file loads instantly
- No HTTP requests for dependencies
- Minimal DOM manipulation
- Efficient cell updates (only affected cells)

**Watch out for:**
- Excessive `updateCell()` calls in loops
- Creating too many audio contexts
- Memory leaks in intervals (always clear intervals)
- Boss battle interval must be cleared on level end

### Optimization Tips

1. **Batch DOM updates** when revealing multiple cells
2. **Clear intervals** when leaving Level 5 (boss battle)
3. **Limit audio context creation** - reuse existing contexts
4. **Use CSS transitions** instead of JavaScript animations when possible
5. **Keep localStorage writes minimal** - only on significant changes

---

## 🎓 Educational Design Principles

**These are CORE to the project - do not violate:**

1. **Spaced Repetition**
   - Wrong answers appear again after 2 other questions
   - Implementation: retry queue in `generateQuestion()`

2. **Targeted Practice**
   - Levels 2 & 4 focus on mistakes and slow answers
   - Minimum 10 questions ensures sufficient practice

3. **Non-Punitive Errors**
   - Mistakes regress cells but don't end the game
   - Always allow progress eventually
   - No "game over" except boss battle (which restarts level)

4. **Immediate Feedback**
   - Visual: Cell changes, colors, animations
   - Audio: Success/fail tones
   - Text: Mistake counter, progress indicator

5. **Progress Visibility**
   - "X/64 Cells Discovered!"
   - Collection count badge
   - Level intro shows what's ahead

6. **Motivation Through Rewards**
   - Collectible animals with rarity system
   - Progressive rarity bonuses
   - Duplicate tracking with count badges
   - Boss battle as finale challenge

---

## 🔍 Finding Code Quickly

### By Functionality

| Feature | Approximate Line Range | Key Functions |
|---------|----------------------|---------------|
| HTML Structure | 1-133 | N/A |
| CSS Styles | 134-1364 | N/A |
| Configuration | 1369-1676 | PRACTICE_TYPES, QUESTION_TYPES, LEVEL_CONFIG, COLLECTIBLES |
| State Variables | 1678-1707 | Global state |
| localStorage | 1709-1753 | saveCollection, loadCollection |
| Audio System | 1884-2058 | playSound, playSuccessSound, etc. |
| Game Initialization | 1755-1883 | initGame, showLevelIntro |
| Cell Management | 2155-2232 | updateCell |
| Level Start | 2233-2280 | startLevel |
| Boss Battle | 2281-2474 | startBossBattle, updateBossPosition, throwBall |
| Question Generation | 2476-2536 | generateQuestion |
| Answer Checking | 2537-2793 | checkAnswer |
| Level Completion | 2794-2889 | showCompletion |
| Test Mode | 2890-3006 | Test mode functions |

### Search Tips

**For CSS:**
- Search for class name: `.game-board`, `.boss-arena`
- Search for level theme: `body.level-2`, `body.level-3`
- Search for animation: `@keyframes fadeIn`

**For JavaScript:**
- Search for function: `function checkAnswer(`
- Search for variable: `let currentLevel`
- Search for constant: `const GRID_SIZE`
- Search for localStorage: `localStorage.getItem`

**For HTML:**
- Search for ID: `id="answer-input"`
- Search for class: `class="game-board"`
- Search for emoji: `🎮`, `📚`, `🔥`

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
1. Check if it fits the single-file architecture
2. Ensure it aligns with educational principles
3. Maintain child-friendly UX
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
BOSS_START_POSITION = 50  // Level 5
BOSS_MOVE_RATE = 2  // % per second
BOSS_PUSHBACK = 6.67  // % per correct answer
FAST_THRESHOLD = 5000  // milliseconds
SLOW_THRESHOLD = 20000  // milliseconds
```

### localStorage Keys

```javascript
'mathGameCollection'  // Array of collectibles
'mathGameHighestLevel'  // Number (1-5)
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
'#boss-character'       // Boss element (Level 5)
'#player-avatar'        // Player element (Level 5)
'#boss-progress-bar'    // Boss position bar (Level 5)
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
- [ ] All 5 levels still work
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

**Document Version:** 1.0.0
**Last Updated:** 2025-11-19
**Codebase Version:** v2.0.0
**Maintained for:** Claude Code AI Assistants

**Happy coding! 🎮✨**
