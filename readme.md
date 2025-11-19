# Math Picture Reveal Game

**Version:** 2.0.0
**Created for:** Elementary-age children (designed for a 9-year-old)

An engaging educational math game that combines addition practice with collectible mechanics and progressive difficulty to maintain motivation and track learning progress.

---

## 🎮 Game Overview

Players solve addition problems to reveal hidden pictures by progressively uncovering an 8×8 grid (64 cells). Each revealed picture is added to a persistent collection with rarity-based rewards. The game features four levels with increasing difficulty and targeted practice modes.

---

## 📚 Level System

### Level 1: Practice Addition (2-9)
- **Focus:** Single-digit addition (2+2 through 9+9)
- **Grid:** 8×8 cells, each representing one addition problem
- **Mechanics:** 6 random cells progress per correct answer
- **Tracking:** Records mistakes and slow responses (20+ seconds) for Level 2

### Level 2: Practice Challenging Questions (from Level 1)
- **Focus:** Targeted remediation of Level 1 difficulties
- **Questions:** Problems that had mistakes OR took 20+ seconds
- **Minimum:** 10 questions (fills with slowest responses if needed)
- **Grid:** 64 cells with proportional progression (64/X cells per answer, where X = number of practice questions)
- **Theme:** Golden/orange visual theme

### Level 3: Double-Digit Addition
- **Focus:** Adding numbers 11-90 with single digits 2-9
- **Grid:** 8×8 cells with random cell progression
- **Mechanics:** 6 random cells progress per correct answer
- **Tracking:** Records mistakes and slow responses for Level 4
- **Theme:** Green visual theme

### Level 4: Practice Challenging Questions (from Level 3)
- **Focus:** Targeted remediation of Level 3 difficulties
- **Questions:** Problems that had mistakes OR took 20+ seconds
- **Minimum:** 10 questions (fills with slowest responses if needed)
- **Grid:** 64 cells with proportional progression
- **Theme:** Blue/indigo visual theme

### Level 5: Boss Battle 🎮
- **Focus:** Mixed single-digit and double-digit addition
- **Type:** Boss Challenge (Type C)
- **Mechanics:**
  - Boss starts at 50% position (center of screen)
  - Boss advances toward player at 2% per second (40% total movement)
  - Each correct answer pushes boss back by 6.67%
  - Questions alternate between single-digit (2-10 + 2-10) and double-digit (11-90 + 2-9)
  - Wrong answers don't push boss back
- **Win Condition:** Push boss to 90% position (prison on right side)
- **Lose Condition:** Boss reaches 10% position (player avatar on left side) - Level restarts
- **Theme:** Red/crimson visual theme
- **UI:** Real-time position bar, ball-throwing animation, danger warnings

---

## 🎯 Core Mechanics

### Cell Reveal System
Each cell has 3 states:
1. **Covered** (0 correct) - Fully opaque pink/gold/green/blue cover
2. **Cracked** (1 correct) - 70% opacity with visible crack pattern
3. **Revealed** (2 correct) - Transparent, picture visible

### Question Flow
- **Correct Answer:** 
  - Levels 1 & 3: Progress 6 random incomplete cells
  - Levels 2 & 4: Progress cells proportionally (64 ÷ question count)
  - Play success sound (or cell reveal sound if cells completed)
  
- **Wrong Answer:**
  - Regress cells using same logic
  - Clear input box for retry
  - Track mistake for reports and practice levels
  - Schedule retry after 2 other questions (Levels 1 & 3 only)

### Timer & Tracking
- Timer starts when question displays
- Paused time excluded from total
- Speed categories:
  - **Fast:** < 5 seconds (reported as achievement)
  - **Normal:** 5-20 seconds
  - **Slow:** 20+ seconds (used for practice level selection)

---

## 🎨 Collectibles System

### Collection Mechanics
- One collectible earned per level completion
- 72 unique animals with emojis
- Persistent storage via localStorage
- Animals can be collected multiple times (shows count badge)
- Rarity-based rewards with progression bonuses

### Rarity Tiers
1. **Common** (60% base) - Light gray background
2. **Uncommon** (25% base) - Light green background
3. **Rare** (10% base) - Light blue background
4. **Epic** (4% base) - Light purple background
5. **Legendary** (1% base) - Light yellow background
6. **Mythical** (0.5% base) - Light cyan background
7. **Exotic** (0.35% base) - Light pink background
8. **Secret** (0.1% base) - Light gold background

### Rarity Progression
- Each level completed increases chances for rarer items
- Formula: +2% per level distributed to Rare/Epic/Legendary
- Highest level completed tracked in localStorage

### Animal Examples
- **Common:** Cat, Dog, Pig, Bee, Butterfly, Frog
- **Uncommon:** Bear, Fox, Penguin, Hedgehog, Owl
- **Rare:** Lion, Dolphin, Elephant, Koala, Shark
- **Epic:** Whale, Tiger, Rhino
- **Legendary:** Unicorn, Dinosaur, T-Rex

---

## 📊 Reporting System

End-of-level reports show:

### Achievement Report (Green)
- Questions answered in under 5 seconds
- Shows average time for each fast question
- Sorted by speed (fastest first)

### Mistakes Report (Yellow)
- Questions with incorrect answers
- Shows mistake count per question
- Sorted by mistake count (most mistakes first)

### Slow Response Report (Yellow)
- Questions taking 20+ seconds
- Shows average time for each slow question
- Sorted by time (slowest first)

### Perfect Score
- Displays if no mistakes and no slow responses

---

## 🎵 Audio System

Uses Web Audio API with tone generation:

1. **Success Sound** - Three ascending tones (C5, E5, G5)
2. **Cell Reveal Sound** - Four ascending tones (C5, E5, G5, C6)
3. **Fail Sound** - Two descending tones (G4, F4)
4. **Completion Sound** - Extended 10-note victory melody
5. **Boss Victory Sound** - Extended fanfare for defeating the boss

All sounds use sine waves at 30% volume.

---

## 🎨 Visual Design

### Color Themes by Level
- **Level 1:** Purple/pink gradient
- **Level 2:** Golden/orange gradient
- **Level 3:** Green gradient
- **Level 4:** Blue/indigo gradient
- **Level 5:** Red/crimson gradient (Boss Battle)

### UI Components
- **Font:** Comic Sans MS (playful, child-friendly)
- **Style:** Rounded corners, soft shadows, pastel colors
- **Progress:** "X/64 Cells Discovered!"
- **Mistakes:** "Mistakes: X"
- **Collection Badge:** "📚 Collection: X" (clickable)
- **Controls:** Pause (⏸️/▶️), Restart (🔄)

### Responsive Design
- **Desktop (>1200px):** Collectibles pane visible on left
- **Mobile/Tablet:** Collectibles accessible via badge click
- Game board: 500×500px
- Question box: 400px wide

---

## 🔧 Test Mode

Access via `?test=true` in URL

### Features:
1. **Reveal All & End** - Completes all cells and ends level
2. **View Collection** - Opens collection modal
3. **Delete Collectibles** - Hover shows red X button (confirmation required)
4. **Level Jumping** - Dropdown to jump between levels
   - Validates practice level prerequisites (must complete L1 for L2, L3 for L4)
5. **Add Collectible** - Dropdown to add any animal to collection
6. **Panic Button** - Press 'R' key to toggle test panel visibility

### Test Panel Location
Fixed position in top-left corner with red border.

---

## 💾 Data Persistence

### localStorage Keys:
- `mathGameCollection` - Array of collected animals with metadata
  ```javascript
  {
    emoji: "🦄",
    name: "Unicorn", 
    rarity: "legendary",
    count: 2,
    firstFound: "2025-01-15T10:30:00Z",
    lastFound: "2025-01-20T14:45:00Z"
  }
  ```
- `mathGameHighestLevel` - Highest level completed (number)

### Session-Only Data:
- Level 1 mistakes/slow responses (for Level 2)
- Level 3 mistakes/slow responses (for Level 4)
- Current game state (cells, progress, mistakes)

---

## 🎮 Controls

### Keyboard
- **Enter** - Submit answer
- **Number keys** - Input answer

### Mouse/Touch
- **Check Answer button** - Submit answer
- **Pause button** - Pause/resume timer
- **Restart button** - Restart current level (with confirmation)
- **Collection badge** - View collection modal
- **START button** - Begin level from intro screen
- **Next Level button** - Progress to next level (if available)

---

## 🎓 Educational Design Principles

1. **Spaced Repetition** - Wrong answers re-appear after 2 questions
2. **Targeted Practice** - Practice levels focus on challenging problems
3. **Non-Punitive** - Mistakes help learning, always allow progress
4. **Immediate Feedback** - Visual and audio cues for all actions
5. **Progress Visibility** - Clear indicators of progress and achievement
6. **Motivation** - Collection mechanics and rarity system encourage completion
7. **Adaptive Difficulty** - Minimum question counts ensure sufficient practice

---

## 🚀 Future Development Considerations

Potential features (not yet implemented):
- Additional levels (Level 5+)
- Subtraction, multiplication, division
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

---

## 📱 Browser Compatibility

- Requires modern browser with:
  - Web Audio API support
  - localStorage support
  - CSS3 animations
  - ES6 JavaScript

- Tested on:
  - Chrome/Edge (recommended)
  - Firefox
  - Safari

---

## 🐛 Known Issues & Edge Cases

- ✅ Test mode delete buttons now show correctly on hover
- ✅ Practice levels require previous level completion
- ✅ Collection resets automatically when all 50 animals collected
- ✅ Timer properly handles pause/resume cycles
- ✅ Level 2/4 only appear if there are challenging questions
- ✅ Minimum 10 questions enforced for practice levels

---

## 📝 Version History

- **v2.0.0** - Added Level 5 Boss Battle with real-time mechanics, expanded to 72 collectibles with 8 rarity tiers
- **v1.6.1** - Bug fix: collectibles delete buttons in test mode
- **v1.6.0** - Added Level 4 (practice challenging from Level 3)
- **v1.5.0** - Added Level 3 (double-digit addition)
- **v1.4.0** - Minimum practice questions with slowest-time filling
- **v1.3.1** - Bug fix: collectibles pane scrolling
- **v1.3.0** - Rarity system with progression bonuses
- **v1.2.0** - Level 2 system (practice challenging questions)
- **v1.1.0** - Collectibles system (50 animals, localStorage)
- **v1.0.0** - Core game complete (Level 1, grid, timer, sounds)

---

## 👨‍💻 Technical Stack

- **Pure HTML5** - No framework dependencies
- **CSS3** - Gradients, animations, flexbox, grid
- **Vanilla JavaScript** - ES6+ features
- **Web Audio API** - Tone generation for sounds
- **localStorage API** - Data persistence
- **Comic Sans MS** - System font (fallback: cursive)

---

## 🎯 Target Audience

**Primary:** Elementary school children (ages 6-10)  
**Designed for:** 9-year-old girl learning addition

**Learning Goals:**
- Master single-digit addition facts (2-9)
- Build fluency with double-digit addition
- Develop speed and accuracy
- Practice error correction
- Build confidence through achievement

---

## 📄 License

Created for personal educational use.

---

## 🙏 Acknowledgments

Designed with love for a 9-year-old learner. Built with pedagogical principles emphasizing:
- Engagement through gamification
- Targeted practice through data tracking
- Positive reinforcement through collections
- Non-punitive error handling
- Clear progress visualization

**Happy Learning! ✨📚🎉**