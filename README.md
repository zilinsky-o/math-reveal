# Math Picture Reveal Game

A fun, interactive math practice game where players answer addition questions to reveal hidden pictures and collect cute animals!

## Features

### 6 Progressive Levels

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

#### Level 3: Treasure Chest Pathfinding 🗺️
- **Type**: Pathfinding Level (Type D)
- **Focus**: Single-digit addition (2-10 + 2-10)
- **Gameplay**: Navigate a grid to reach a treasure chest!
- **Mechanics**:
  - 9×9 grid of covered tiles
  - Avatar starts at middle-left, chest is at middle-right
  - Click adjacent tiles to reveal math questions
  - **Correct answer**: Tile becomes a path you can walk on
  - **Wrong answer**: Tile becomes permanently blocked
  - Move your avatar by clicking on path tiles
  - **Secret Squares (?)**: 3 hidden weapon/ability tiles appear on the grid
    - Walk into these tiles to discover random weapons/abilities
    - Each secret square can only be collected once
    - Weapons collected here can be used in Level 6 boss battle!
  - Reach the treasure chest to complete the level!
- **Collectibles**: Jewelry and precious items (💍, 💎, 👑, etc.)

#### Level 4: Double Digit Addition
- **Type**: Practice Level (Type A)
- **Focus**: Double-digit addition (11-90 + 2-9)
- **Gameplay**: Answer questions to reveal cells of a hidden picture
- **Mechanics**: Same as Level 1, but with harder questions

#### Level 5: Challenge Review
- **Type**: Review Level (Type B)
- **Focus**: Double-digit addition review
- **Gameplay**: Practice challenging questions from Level 4
- **Mechanics**: Same as Level 2, but reviewing Level 4 questions

#### Level 6: Boss Battle 🎮
- **Type**: Boss Challenge (Type C)
- **Focus**: Mixed single and double-digit addition
- **Gameplay**: Defeat the boss by answering questions correctly!
- **Mechanics**:
  - Boss starts in the middle of the screen
  - Boss moves toward your avatar (left side) at 1% per second
  - Each correct answer:
    - Your avatar throws a ball at the boss
    - Boss is pushed back by ≈6.67%
  - Questions alternate between single-digit and double-digit addition
  - **Weapons/Abilities**: Use weapons collected from Level 3!
    - **Pistol (🔫)**: Fire a bullet at the boss - pushes boss back like a bomb hit
    - **Fighter Jet (🛩️)**: Airstrike! Jet flies in and drops a bomb - freezes boss movement until next question
    - **Spider Web (🕸️)**: Slows boss movement by 50% for 30 seconds
  - Click weapon circles (top-left) to use them during battle
- **Win Condition**: Push the boss to the prison (right side)
- **Lose Condition**: Boss reaches your avatar (left side) - Level restarts

## Game Mechanics

### Picture Reveal System (Levels 1, 2, 4, 5)
- 8×8 grid of cells covering a picture
- Each cell requires 2 correct answers to fully reveal
- First correct answer shows cracks, second reveals the cell
- Mistake tracking for performance review

### Pathfinding System (Level 3)
- 9×9 grid of covered tiles
- Click adjacent highlighted tiles to answer questions
- Correct answers unlock tiles as paths
- Wrong answers permanently block tiles
- Navigate strategically to reach the treasure chest!

### Boss Battle System (Level 6)
- Boss position tracked on screen (10% = avatar, 50% = start, 90% = prison)
- Real-time movement: Boss advances 1% per second (reaches avatar in 40 seconds)
- Ball throwing animation when you answer correctly
- Progress bar shows boss position
- Danger warning when boss gets close
- Use weapons/abilities collected from Level 3 to gain strategic advantages

### Weapons/Abilities System
- **Collection**: Find weapons in secret squares (?) during Level 3 pathfinding
- **3 Secret Squares**: Randomly placed on the Level 3 grid (avoiding start/end)
- **Usage**: Click weapon circles in top-left corner during Level 6 boss battle
- **Available Weapons**:
  - **Pistol (🔫)**: Instant shot that pushes boss back (same as correct answer)
  - **Fighter Jet (🛩️)**: Dramatic airstrike that freezes boss until next correct answer
  - **Spider Web (🕸️)**: Slows boss speed by 50% for 30 seconds
- Weapons are stored in localStorage and persist between sessions
- Each weapon can be used multiple times if collected multiple times
- Strategic use of weapons can make boss battle significantly easier!

### Collectibles System
- Random items revealed at the end of each level
- **Levels 1-2**: Cute animals
- **Level 3**: Jewelry and precious items
- **Levels 4-6**: More cute animals
- Rarity system: Common, Uncommon, Rare, Epic, Legendary, Mythical, Exotic, Secret
- 80+ unique collectibles to find
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
- Add all weapons/abilities (one of each)
- Access all levels without prerequisites
- Collectibles won't be added when completing levels (use "Add Collectible" button instead)
- Press 'R' key to toggle test panel visibility

## Technical Details

### Built With
- Pure HTML5, CSS3, and JavaScript
- No external dependencies
- Single-file application
- Local storage for persistence

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
6. Complete all cells to finish the level (or reach the treasure in Level 3!)
7. Collect your reward!
8. Progress through all 6 levels
9. Face the boss in Level 6!

## Level 3 Pathfinding Tips

- Plan your path carefully - blocked tiles are permanent!
- Highlight shows which tiles you can click
- You can move freely on any path tile
- Try to create a connected path to the treasure chest
- Wrong answers create dead ends, so take your time!

## Boss Battle Tips

- Boss moves 1% per second toward you (40% total distance in 40 seconds)
- You need approximately 6-7 correct answers to win (6.67% × 6 = 40%)
- Speed matters! Answer quickly before boss reaches you
- Mix of easy (single-digit) and harder (double-digit) questions
- Stay calm and focused - mistakes don't push boss back!
- **Strategic Weapon Use**:
  - Use Pistol for instant pushback when running out of time
  - Use Fighter Jet to freeze boss and buy time for harder questions
  - Use Spider Web early to slow boss throughout the battle
  - Collect weapons from Level 3 before attempting Level 6!

## Credits

Created as an educational math practice game. Features a progressive difficulty system, a strategic pathfinding level with collectible weapons/abilities, collectible rewards, and an exciting boss battle finale with strategic weapon usage!

Version: 3.0.0
