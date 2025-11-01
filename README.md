# Math Picture Reveal Game

A fun, interactive math practice game where players answer addition questions to reveal hidden pictures and collect cute animals!

## Features

### 5 Progressive Levels

#### Level 1: Practice Addition
- **Type**: Practice Level (Type A)
- **Focus**: Single-digit addition (2-10 + 2-10)
- **Gameplay**: Answer questions to reveal cells of a hidden picture
- **Mechanics**:
  - Correct answers reveal 6 cells
  - Incorrect answers cover 6 cells
  - Questions that cause mistakes are retried after 2 correct answers

#### Level 2: Challenge Review
- **Type**: Review Level (Type B)
- **Focus**: Single-digit addition review
- **Gameplay**: Practice challenging questions from Level 1
- **Mechanics**:
  - Reviews questions that took longest or had mistakes
  - Minimum 10 practice questions
  - Each correct answer reveals more cells

#### Level 3: Double Digit Addition
- **Type**: Practice Level (Type A)
- **Focus**: Double-digit addition (11-90 + 2-9)
- **Gameplay**: Answer questions to reveal cells of a hidden picture
- **Mechanics**: Same as Level 1, but with harder questions

#### Level 4: Challenge Review
- **Type**: Review Level (Type B)
- **Focus**: Double-digit addition review
- **Gameplay**: Practice challenging questions from Level 3
- **Mechanics**: Same as Level 2, but reviewing Level 3 questions

#### Level 5: Boss Battle 🎮
- **Type**: Boss Challenge (Type C)
- **Focus**: Mixed single and double-digit addition
- **Gameplay**: Defeat the boss by answering questions correctly!
- **Mechanics**:
  - Boss starts in the middle of the screen
  - Boss moves toward your avatar (left side) over 20 seconds
  - Each correct answer:
    - Your avatar throws a ball at the boss
    - Boss is pushed back by 1/15 of screen width (≈6.67%)
  - Questions alternate between single-digit and double-digit addition
- **Win Condition**: Push the boss to the prison (right side)
- **Lose Condition**: Boss reaches your avatar (left side) - Level restarts

## Game Mechanics

### Picture Reveal System (Levels 1-4)
- 8×8 grid of cells covering a picture
- Each cell requires 2 correct answers to fully reveal
- First correct answer shows cracks, second reveals the cell
- Mistake tracking for performance review

### Boss Battle System (Level 5)
- Boss position tracked on screen (10% = avatar, 50% = start, 90% = prison)
- Real-time movement: Boss advances 2% per second (reaches avatar in 20 seconds)
- Ball throwing animation when you answer correctly
- Progress bar shows boss position
- Danger warning when boss gets close

### Collectibles System
- Random animals revealed at the end of each level
- Rarity system: Common, Uncommon, Rare, Epic, Legendary
- 50+ unique animals to collect
- Collection persists across sessions
- Can collect duplicates (tracked with count badges)

### Performance Tracking
- Mistakes logged per question
- Answer time tracked (fast <5s, slow >20s)
- End-of-level reports:
  - Speed achievements (fast answers)
  - Questions with mistakes
  - Questions that took time

## Controls

- **Type answer**: Use number input
- **Submit**: Click "Check Answer" or press Enter
- **Pause**: Click pause button (⏸️)
- **Restart**: Click restart button (🔄)
- **View Collection**: Click collection badge

## Test Mode

Enable test mode by adding `?test=true` to the URL:

```
index.html?test=true
```

Test mode features:
- Reveal all cells instantly
- Jump between levels
- Add any collectible to your collection
- Access all levels without prerequisites

## Technical Details

### Built With
- Pure HTML5, CSS3, and JavaScript
- No external dependencies
- Modular file architecture (v2.1.0+)
- Local storage for persistence

### Project Structure (v2.1.0)

```
math-reveal/
├── index.html                    # Main HTML (177 lines)
├── css/                          # Stylesheets (6 files)
│   ├── main.css                 # Base styles & layout
│   ├── levels.css               # Level-specific styling
│   ├── game-board.css           # Grid & picture reveal
│   ├── boss.css                 # Boss battle styles
│   ├── ui-components.css        # Buttons, modals, UI
│   └── collectibles.css         # Collection system
├── js/                          # JavaScript modules (16 files)
│   ├── config.js                # Configuration
│   ├── data/                    # Game data
│   │   ├── collectibles.js      # 80+ animals
│   │   ├── levels.js            # Level definitions
│   │   └── pictures.js          # Backgrounds
│   ├── core/                    # Core logic
│   │   ├── game-state.js        # State management
│   │   ├── storage.js           # LocalStorage
│   │   └── question-generator.js # Math questions
│   ├── ui/                      # User interface
│   │   ├── ui-controller.js     # UI updates
│   │   ├── modals.js            # Dialogs
│   │   └── animations.js        # Effects
│   ├── gameplay/                # Game mechanics
│   │   ├── level-controller.js  # Level progression
│   │   ├── picture-reveal.js    # Grid mechanics
│   │   ├── boss-battle.js       # Boss fight
│   │   └── performance-tracker.js # Stats tracking
│   ├── test-mode.js             # Debug tools
│   └── main.js                  # Initialization
└── README.md                    # Documentation
```

### Browser Support
- Modern browsers with ES6 support
- Audio API for sound effects
- CSS animations and transitions

## How to Play

1. Open `index.html` in a web browser
2. Start with Level 1
3. Read the math question
4. Type your answer
5. Press Enter or click "Check Answer"
6. Complete all cells to finish the level
7. Collect your animal reward!
8. Progress through levels 2-5
9. Face the boss in Level 5!

## Boss Battle Tips

- Boss moves 2% per second toward you (40% total distance)
- You need approximately 6-7 correct answers to win (6.67% × 6 = 40%)
- Speed matters! Answer quickly before boss reaches you
- Mix of easy (single-digit) and harder (double-digit) questions
- Stay calm and focused - mistakes don't push boss back!

## Credits

Created as an educational math practice game. Features a progressive difficulty system, collectible rewards, and an exciting boss battle finale!

## Version History

- **v2.1.0** - Refactored to modular architecture (6 CSS files, 16 JS modules)
- **v2.0.0** - Added Level 5 Boss Battle & collectibles system

---

Version: 2.1.0
