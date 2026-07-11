# Feature Plan: Coins + Wheel of Fortune

**Branch:** `claude/wheel-fortune-slot-machine-tuxwed`
**Status:** Planned — ready for implementation
**Plan by:** Opus (research + design). **Implementer:** Sonnet.

---

## Original spec (verbatim, from the product owner)

> * for each successful answer she gets 1 coin.
> * on the treasure-find you should add 3 cells that have a coin badge, where if
>   she successfully conquers them she gets +10 coins
> * when getting to 30 coins she gets a wheel-of-fortune present (or a
>   slot-machine or some other similar icon/emoji that you have) that she can
>   always use across the non-boss levels (so you'd need to add some button for
>   her to be able to use it, with a count of how many wheels-of-fortune she
>   got).
> * When clicking a wheel-of-fortune you should run a wheel-of-fortune animation
>   of gifts changing quickly. she can hit a button to stop the wheel and it
>   slows down until stopping on a gift. possible gifts are: +20 coins ; a
>   special emoji treasure of a new type (you can propose some new category/ies
>   of emojiis and then add 20 such collectibles that align with those
>   categories) ; a Free-Solution gift ; another wheel-of-fortune roll ; each one
>   of the weapons for the boss fight

Everything below is Opus's implementation design derived from this spec. Where
the spec left a choice open, the decision is noted (see §13 Appendix).

---

## 0. TL;DR

A coin-driven reward loop plus a stop-the-wheel bonus game:

1. **Earn coins** — +1 coin for every correct answer (all level types).
2. **Coin cells in treasure mazes** — 3 special tiles marked 🪙; conquering one
   grants **+10 coins** (in addition to the existing 3 weapon "?" tiles).
3. **Earn wheel tokens** — every time coins reach **30**, spend 30 and grant
   **+1 Wheel-of-Fortune token** (🎡). A token counter + Spin button are always
   visible on **non-boss** levels.
4. **Spin** — clicking Spin (when tokens > 0) opens a bonus game where prize
   icons **cycle rapidly**; the player hits **STOP**, the reel **decelerates**
   and lands on one prize.
5. **Prizes** — one of: **+20 coins**, a **special treasure** (new collectible
   categories, 20 added), a **Free Solution** token, **another wheel spin**, or
   **one of the three boss weapons** (pistol / jet / web).

No external deps, no build step, ES5-compatible vanilla JS, 2-space indent.
All `CLAUDE.md` constraints apply. Reuse existing grant helpers
(`addToCollection`, `addWeapon`) and the `weapon-discovery-modal` reveal
pattern.

---

## 1. New persistent state (storage.js)

Add three numeric localStorage keys, all defaulting to `0`, each with a
load/save/add helper mirroring the existing weapons functions
(`storage.js:299-340`). **Do not touch existing keys.**

| Key | Meaning |
|---|---|
| `mathGameCoins` | Current coin balance |
| `mathGameWheels` | Wheel-of-Fortune tokens owned |
| `mathGameFreeSolutions` | Free-Solution tokens owned |

```javascript
// --- Coins ---
function loadCoins()  { try { return parseInt(localStorage.getItem('mathGameCoins')) || 0; } catch (e) { return 0; } }
function saveCoins(n) { try { localStorage.setItem('mathGameCoins', String(n)); } catch (e) {} }

// Add coins, auto-converting every 30 into a wheel token. Returns the number
// of wheel tokens newly granted (so the caller can celebrate).
function addCoins(amount) {
    let coins = loadCoins() + amount;
    let newWheels = 0;
    while (coins >= COINS_PER_WHEEL) {   // COINS_PER_WHEEL = 30 (config.js)
        coins -= COINS_PER_WHEEL;
        newWheels++;
    }
    saveCoins(coins);
    if (newWheels > 0) addWheels(newWheels);
    updateResourcesUI();
    return newWheels;
}

// --- Wheel tokens ---  loadWheels/saveWheels/addWheels/useWheel(): bool
// --- Free solutions --- loadFreeSolutions/saveFreeSolutions/addFreeSolutions/useFreeSolution(): bool
```

`useWheel()` / `useFreeSolution()` decrement if > 0 and return `true`, else
`false` (mirror `useWeapon()` at storage.js:326). Each calls
`updateResourcesUI()`.

Add **`updateResourcesUI()`** (storage.js, near `updateWeaponsUI`): writes the
coin balance, wheel-token count, and free-solution count into the header UI and
enables/disables the Spin and Free-Solution buttons based on their counts.

---

## 2. New config data (config.js)

Add near `WEAPONS` (config.js:30):

```javascript
// Coin economy
const COINS_PER_ANSWER = 1;     // per correct answer
const COIN_SQUARES_COUNT = 3;   // coin tiles per treasure maze
const COIN_SQUARE_REWARD = 10;  // coins per coin tile
const COINS_PER_WHEEL = 30;     // coins auto-convert into one wheel token

// Wheel of Fortune prize table. `weight` is relative (normalized at pick time).
// `type` drives resolveWheelPrize(). Order == the cycling order of icons.
const WHEEL_PRIZES = [
    { id: 'coins20',      type: 'coins',        emoji: '🪙', label: '+20 Coins',     weight: 22 },
    { id: 'special',      type: 'special',      emoji: '🎁', label: 'Special Gift',  weight: 12 },
    { id: 'freeSolution', type: 'freeSolution', emoji: '💡', label: 'Free Solution', weight: 15 },
    { id: 'extraRoll',    type: 'extraRoll',    emoji: '🎡', label: 'Extra Spin!',   weight: 12 },
    { id: 'pistol',       type: 'weapon', weapon: 'pistol', emoji: '🔫', label: 'Pistol', weight: 13 },
    { id: 'jet',          type: 'weapon', weapon: 'jet',    emoji: '🛩️', label: 'Jet',    weight: 13 },
    { id: 'web',          type: 'weapon', weapon: 'web',    emoji: '🕸️', label: 'Web',    weight: 13 }
];

const WHEEL_COINS_REWARD = 20;      // the "+20 coins" prize
const WHEEL_CYCLE_MS = 80;          // ms between icon swaps at full speed
const WHEEL_DECEL_STEPS = 22;       // how many swaps the deceleration takes
```

### New collectible categories (the "special treasure" prizes)

The wheel awards collectibles of **new types** distinct from the existing
animals (indices 0–86) and jewelry (87–98). **Proposed: two kid-friendly
categories, 10 each = 20 collectibles**, appended to the `backgrounds` array
(new indices 99–118):

- **Sweet Treats** 🍭 🍬 🧁 🍩 🍪 🎂 🍫 🍦 🍰 🍮
- **Cosmic Wonders** 🌙 🪐 ☄️ 🌠 💫 🌈 ⚡ ❄️ 🔥 🌊

(Checked against existing emojis — no duplicates. Existing sky items are
🌌/🌟/🔮/🕊️, none reused above.)

Each new entry follows the array shape `{ gradient, emoji, name, baseRarity }`.
Spread rarities across tiers so the collection stays interesting, e.g. per
category: 4 common/uncommon, 3 rare, 2 epic, 1 legendary. Suggested names:

```
Sweet Treats:  🍭 Lollipop(common) · 🍬 Candy(common) · 🧁 Cupcake(uncommon) ·
               🍩 Donut(uncommon) · 🍪 Cookie(common) · 🎂 Birthday Cake(rare) ·
               🍫 Chocolate(uncommon) · 🍦 Ice Cream(rare) · 🍰 Shortcake(epic) ·
               🍮 Custard(legendary)
Cosmic Wonders:🌙 Crescent Moon(uncommon) · 🪐 Ringed Planet(rare) ·
               ☄️ Comet(rare) · 🌠 Shooting Star(epic) · 💫 Dizzy Star(uncommon) ·
               🌈 Rainbow(common) · ⚡ Lightning(uncommon) · ❄️ Snowflake(common) ·
               🔥 Flame(rare) · 🌊 Wave(legendary)
```

Add index-range constants so selectors stay correct:

```javascript
const ANIMAL_RANGE   = [0, 87];    // slice bounds
const JEWELRY_RANGE  = [87, 99];
const SPECIAL_RANGE  = [99, 119];  // wheel-only special treasures
```

Add `rarityColors`/`rarityLabels` entries only if you introduce a **new**
rarity tier (not needed if you reuse existing tiers — recommended).

---

## 3. Awarding coins per answer (game.js `checkAnswer`)

`checkAnswer()` computes `isCorrect` once at **game.js:660**, before the three
type-specific branches (pathfinding / boss / normal). Award coins there, in a
single place that covers every level type:

```javascript
const isCorrect = userAnswer === currentQuestion.answer;
if (isCorrect) addCoins(COINS_PER_ANSWER);   // <-- add this line
```

`addCoins` handles the 30→token conversion and UI refresh automatically. If a
conversion happens, show a brief non-blocking toast (see §7) — do **not**
interrupt gameplay with a modal.

---

## 4. Coin cells in treasure mazes (game.js pathfinding)

Treasure mazes already scatter 3 hidden weapon "?" tiles via `secretSquares`
(`game.js:174-186`, revealed in `moveAvatarTo` at `game.js:372-381`). **Mirror
that exactly for coin tiles.**

**State** (top of game.js, near `let secretSquares` at game.js:28):
```javascript
let coinSquares = [];  // { row, col, collected } coin tiles in the maze
```

**In `createPathfindingGrid()` (game.js:164):**
- After placing `secretSquares`, place `COIN_SQUARES_COUNT` coin squares with
  the same rejection loop, adding the weapon-square keys to `forbiddenPositions`
  so coin and weapon tiles never overlap (and still avoid start + chest).
- In the tile render loop (game.js:206), add a second marker: if the tile is a
  coin square, append `<div class="coin-square-marker">🪙</div>` with id
  `coin-marker-${tileKey}` (parallels `secret-square-marker`).

**In `moveAvatarTo()` (game.js:371, right beside the secret-square check):**
```javascript
const coinSquare = coinSquares.find(s => s.row === row && s.col === col && !s.collected);
if (coinSquare) {
    coinSquare.collected = true;
    const marker = document.getElementById(`coin-marker-${newKey}`);
    if (marker) marker.style.display = 'none';
    addCoins(COIN_SQUARE_REWARD);
    showCoinToast(`+${COIN_SQUARE_REWARD} 🪙`);   // brief, non-blocking (§7)
    playSuccessSound();
    // NOTE: do not `return` — a tile could in theory be both, and the chest
    // check below must still run. (Coin tiles won't be the chest/start.)
}
```

**CSS:** add `.coin-square-marker` mirroring `.secret-square-marker` (a badge on
the tile), styled with a gold tint so it reads as distinct from the `?`.

---

## 5. Wheel-of-Fortune bonus game (game.js + index.html + styles.css)

### 5a. Trigger / access

A **Spin button** with a live token count sits in the header resources bar
(§7), shown on **animal + treasure** levels and **hidden on boss** levels
(reveal/hide it in `startLevel()` alongside the arena switches, game.js:463).
The button is disabled when `loadWheels() === 0`.

### 5b. The reel animation (cycle → STOP → decelerate → land)

This matches the requested "gifts changing quickly, hit a button to stop, slows
down until stopping on a gift." Implement as a single reel display, not a
rotating disc.

**HTML** — add after `#weapon-discovery-modal` (index.html:70):
```html
<div class="wheel-modal" id="wheel-modal">
    <div class="wheel-modal-content">
        <h2 id="wheel-title">🎡 Wheel of Fortune!</h2>
        <div class="wheel-reel-frame">
            <div class="wheel-reel-pointer">▶</div>
            <div class="wheel-reel" id="wheel-reel">
                <span class="wheel-reel-emoji" id="wheel-reel-emoji">🎁</span>
                <span class="wheel-reel-label" id="wheel-reel-label"></span>
            </div>
        </div>
        <button class="start-level-button" id="wheel-stop-btn" onclick="stopWheel()">STOP!</button>
        <div class="wheel-result" id="wheel-result" style="display:none;">
            <div class="wheel-result-emoji" id="wheel-result-emoji">🎁</div>
            <p id="wheel-result-text">You won!</p>
            <button class="start-level-button" id="wheel-collect-btn" onclick="closeWheel()">COLLECT!</button>
        </div>
    </div>
</div>
```

**JS** (game.js, new section near `showWeaponDiscovery`):
```javascript
let wheelCycleTimer = null;
let wheelCycleIndex = 0;
let wheelStopping = false;

function openWheelFromButton() {
    if (!useWheel()) return;          // consume a token; false => none left
    startWheelGame();
}

function startWheelGame() {
    document.getElementById('wheel-result').style.display = 'none';
    const stopBtn = document.getElementById('wheel-stop-btn');
    stopBtn.style.display = 'inline-block';
    stopBtn.disabled = false;
    document.getElementById('wheel-modal').style.display = 'flex';
    wheelStopping = false;
    wheelCycleIndex = Math.floor(Math.random() * WHEEL_PRIZES.length);
    renderReel(wheelCycleIndex);
    wheelCycleTimer = setInterval(() => {
        wheelCycleIndex = (wheelCycleIndex + 1) % WHEEL_PRIZES.length;
        renderReel(wheelCycleIndex);
        // optional: playSound(short tick)
    }, WHEEL_CYCLE_MS);
}

function renderReel(i) {
    const p = WHEEL_PRIZES[i];
    document.getElementById('wheel-reel-emoji').textContent = p.emoji;
    document.getElementById('wheel-reel-label').textContent = p.label;
}

// STOP: pick the weighted winner, then decelerate the cycling until it lands
// on that winner. Deceleration = advance one step at a time with growing delay.
function stopWheel() {
    if (wheelStopping) return;
    wheelStopping = true;
    document.getElementById('wheel-stop-btn').disabled = true;
    clearInterval(wheelCycleTimer);

    const winner = pickWheelPrizeIndex();          // weighted (§ below)
    // number of extra steps so it visibly slows before landing on `winner`
    let stepsLeft = WHEEL_DECEL_STEPS + ((winner - wheelCycleIndex + WHEEL_PRIZES.length) % WHEEL_PRIZES.length);
    let delay = WHEEL_CYCLE_MS;
    const tick = () => {
        wheelCycleIndex = (wheelCycleIndex + 1) % WHEEL_PRIZES.length;
        renderReel(wheelCycleIndex);
        stepsLeft--;
        if (stepsLeft <= 0) { finishWheel(WHEEL_PRIZES[winner]); return; }
        delay = Math.round(delay * 1.14);          // ease-out
        setTimeout(tick, delay);
    };
    setTimeout(tick, delay);
}

function pickWheelPrizeIndex() {
    // honor a test override if set (test-mode), else weighted random
    if (typeof forceWheelPrizeId === 'string') {
        const idx = WHEEL_PRIZES.findIndex(p => p.id === forceWheelPrizeId);
        if (idx >= 0) return idx;
    }
    const total = WHEEL_PRIZES.reduce((s, p) => s + p.weight, 0);
    let r = Math.random() * total;
    for (let i = 0; i < WHEEL_PRIZES.length; i++) {
        r -= WHEEL_PRIZES[i].weight;
        if (r < 0) return i;
    }
    return WHEEL_PRIZES.length - 1;
}

function finishWheel(prize) {
    const awarded = resolveWheelPrize(prize);      // grants + returns {emoji,message,extraRoll?}
    document.getElementById('wheel-stop-btn').style.display = 'none';
    document.getElementById('wheel-result-emoji').textContent = awarded.emoji;
    document.getElementById('wheel-result-text').textContent = awarded.message;
    document.getElementById('wheel-result').style.display = 'block';
    playSuccessSound();
    if (awarded.extraRoll) {
        // "another wheel-of-fortune roll" => immediate free re-spin, no token cost
        document.getElementById('wheel-collect-btn').textContent = 'SPIN AGAIN!';
        document.getElementById('wheel-collect-btn').onclick = () => { startWheelGame(); resetCollectBtn(); };
    }
}

function resolveWheelPrize(prize) {
    switch (prize.type) {
        case 'coins':
            addCoins(WHEEL_COINS_REWARD);
            return { emoji: '🪙', message: `You won ${WHEEL_COINS_REWARD} coins!` };
        case 'weapon':
            addWeapon(prize.weapon);
            return { emoji: WEAPONS[prize.weapon].emoji, message: `You won a ${WEAPONS[prize.weapon].name}!` };
        case 'freeSolution':
            addFreeSolutions(1);
            return { emoji: '💡', message: 'You won a Free Solution! Use it to auto-solve a question.' };
        case 'extraRoll':
            return { emoji: '🎡', message: 'Another spin! Go again!', extraRoll: true };
        case 'special':
        default:
            const bg = selectSpecialTreasure();      // from SPECIAL_RANGE
            addToCollection(bg.emoji, bg.name);
            return { emoji: bg.emoji, message: `You won ${bg.name} — a special treasure!` };
    }
}

function closeWheel() {
    if (wheelCycleTimer) clearInterval(wheelCycleTimer);
    document.getElementById('wheel-modal').style.display = 'none';
    resetCollectBtn();
    updateResourcesUI();
}
```

`resetCollectBtn()` restores the COLLECT label + `onclick=closeWheel`.
`forceWheelPrizeId` is a module-level test hook (default `undefined`).

**`selectSpecialTreasure()`** (storage.js) — picks from
`backgrounds.slice(SPECIAL_RANGE[0], SPECIAL_RANGE[1])`, reusing
`determineRarity(getHighestLevel())` to bias, falling back to a uniform pick if
no entry matches the rolled rarity (same shape as `selectRandomBackground`,
storage.js:181).

**Fix `selectRandomBackground()` (storage.js:181)** so the new indices never
leak into normal level rewards: treasure levels must use
`backgrounds.slice(JEWELRY_RANGE[0], JEWELRY_RANGE[1])` (i.e. `slice(87, 99)`),
**not** the current open-ended `slice(87)` which would now include the special
treasures. Animals stay `slice(0, 87)`.

---

## 6. Free-Solution token (game.js)

A **💡 Free Solution** button with a count sits in the resources bar (§7), shown
on non-boss levels, disabled when `loadFreeSolutions() === 0`. Clicking auto-
answers the **current** question:

```javascript
function useFreeSolutionNow() {
    if (isCheckingAnswer || !currentQuestion) return;
    // Treasure levels require a selected (pending) tile to answer against.
    if (LEVEL_CONFIG[currentLevel].type === 'treasure' && !pendingTileClick) {
        showCoinToast('Pick a yellow tile first!');
        return;
    }
    if (!useFreeSolution()) return;              // consume token
    document.getElementById('answer-input').value = currentQuestion.answer;
    checkAnswer();                               // reuse the normal correct path
}
```

This works for animal and treasure levels because both route correct answers
through `checkAnswer()`. It is hidden on boss levels (no free-solution there,
per spec: usable "across the non-boss levels").

---

## 7. UI: resources bar + toasts (index.html + styles.css)

**Resources bar** — add to the header, near the collection badge
(index.html:93). One compact row, visible during play:

```html
<div class="resources-bar" id="resources-bar">
    <span class="resource" id="res-coins">🪙 <b id="coins-count">0</b></span>
    <button class="resource-btn" id="wheel-btn" onclick="openWheelFromButton()">🎡 Spin <b id="wheels-count">0</b></button>
    <button class="resource-btn" id="freesol-btn" onclick="useFreeSolutionNow()">💡 <b id="freesol-count">0</b></button>
</div>
```

- **`updateResourcesUI()`** (storage.js) sets the three counts and toggles the
  `disabled` class on `#wheel-btn` / `#freesol-btn` by their counts.
- **Show/hide by level type:** in `startLevel()` (game.js:463), show
  `#wheel-btn` and `#freesol-btn` for `type !== 'boss'`, hide them for boss
  levels. The coin count can stay visible everywhere. Call `updateResourcesUI()`
  in `startLevel()` and on `DOMContentLoaded`.

**Toast** — a small, auto-dismissing message for coin pickups / conversions
(non-blocking, unlike the modals):
```javascript
function showCoinToast(text) { /* create .coin-toast, append, fade out ~1.2s */ }
```
Use it for coin-tile pickups (§4), the "+1 🎡 wheel earned!" conversion moment
(call from `addCoins` when `newWheels > 0` — but since `addCoins` lives in
storage.js, either put `showCoinToast` in game.js and guard with
`typeof showCoinToast === 'function'`, or return `newWheels` and toast at the
call site). **Recommended:** `addCoins` returns `newWheels`; callers toast.

**CSS additions (styles.css):** `.resources-bar`, `.resource`, `.resource-btn`
(+ `.disabled`), `.wheel-modal` / `.wheel-modal-content` (copy
`.weapon-discovery-modal`), `.wheel-reel-frame`, `.wheel-reel`,
`.wheel-reel-emoji` (large), `.wheel-reel-pointer`, `.wheel-result`,
`.coin-square-marker`, `.coin-toast` (+ fade keyframes). Keep Comic Sans, bright
palette, responsive (`@media` shrink; no horizontal scroll).

---

## 8. Audio (audio.js) — optional

Reuse existing sounds: `playSuccessSound` (coin pickup, prize win),
`playCellRevealSound` (reel tick, optional). A jackpot-ish flourish for the
special-treasure win could use `playBossVictorySound`. Keep volume 0.3; do not
create extra AudioContexts (CLAUDE.md gotcha).

---

## 9. Test mode (test-mode.js + index.html panel) — required by CLAUDE.md

Add test-panel buttons (index.html:16 area):
- `+50 Coins` → `addCoins(50)`
- `+1 Wheel` → `addWheels(1); updateResourcesUI()`
- `Open Wheel` → `startWheelGame()` (bypasses token cost)
- A `<select id="force-wheel-prize">` that sets `forceWheelPrizeId` so QA can
  force each prize outcome deterministically (blank = random).

Verify the panic-button (`R`) toggle still works and the wheel modal doesn't
trap focus or block it.

---

## 10. Cache-busting & versioning

Bump every `?v=` in index.html (`styles.css` + all 6 `<script>` tags, currently
`2.3.1`) and the `.version-info` text to a new version (suggest **`2.4.0`**).
This repo does this on every deploy (commit `d596ec3`).

---

## 11. Implementation checklist (suggested order)

1. **config.js** — coin/wheel constants, `WHEEL_PRIZES`, `ANIMAL/JEWELRY/`
   `SPECIAL_RANGE`, append 20 special-treasure entries to `backgrounds`.
2. **storage.js** — coins/wheels/freeSolutions load/save/add/use helpers,
   `addCoins` auto-convert, `selectSpecialTreasure()`, fix
   `selectRandomBackground` jewelry bound, `updateResourcesUI()`.
3. **index.html** — resources bar, `#wheel-modal`, test-panel buttons; bump
   `?v=` and version text.
4. **styles.css** — resources bar, wheel modal/reel, coin marker, toast,
   responsive.
5. **game.js** — `addCoins(COINS_PER_ANSWER)` at line 660; coin squares in
   `createPathfindingGrid` + `moveAvatarTo`; wheel game functions;
   `useFreeSolutionNow`; show/hide resource buttons + `updateResourcesUI()` in
   `startLevel`; toasts; init on `DOMContentLoaded`.
6. **test-mode.js** — `forceWheelPrizeId` hook + populate selector.
7. **audio.js** — optional sounds.
8. **Docs** — update `CLAUDE.md` / `readme.md` / `README.md` (new keys,
   `WHEEL_PRIZES`, new collectible categories, coin economy) + version.

---

## 12. Manual test checklist (`index.html?test=true`)

- [ ] Correct answer on animal / treasure / boss level → coin count +1 each.
- [ ] Reaching 30 coins auto-grants +1 🎡 (coins roll over correctly, e.g.
      35 → 5 coins + 1 wheel; a big `addCoins` grants multiple wheels).
- [ ] Treasure maze shows 3 🪙 tiles distinct from 3 `?` tiles; walking onto a
      🪙 tile grants +10 coins and hides the badge; toast shows.
- [ ] Spin button hidden on boss levels, shown/disabled correctly elsewhere by
      token count.
- [ ] Spin: icons cycle fast → STOP → decelerates smoothly → lands on a prize;
      STOP can't be double-fired; token was consumed.
- [ ] Each prize grants correctly (use force-prize hook): +20 coins; special
      treasure added to collection (from the new categories only); Free Solution
      count +1; Extra Spin re-spins free (no token); each weapon added (check
      boss weapons UI).
- [ ] Free Solution button auto-solves current question on animal & treasure;
      requires a selected tile on treasure; hidden on boss; count decrements.
- [ ] Special treasures never appear as normal level-completion rewards;
      jewelry still appears only on treasure completions.
- [ ] All counts persist after refresh; no console errors; no horizontal
      scroll; mobile layout OK.

---

## 13. Guardrails (CLAUDE.md — do not violate)

- No external deps, no build step, ES5-compatible vanilla JS, 2-space indent.
- Don't change the JS load order in index.html.
- New localStorage keys only, safe defaults; never break existing keys/collection.
- Clear every interval/timeout you create (`wheelCycleTimer`, decel `setTimeout`
  chain, toast timers) — especially in `closeWheel()` and on level exit.
- Non-punitive, child-friendly UX (big buttons, emoji, Comic Sans, encouraging
  copy). User-facing messages via DOM, never `console.log`.

---

## Appendix: open choices for the implementer (safe to decide inline)

- **Special-treasure rarity bias** — reuse `determineRarity` as-is, or force
  special treasures to skew higher (they're a premium wheel prize). Default:
  reuse as-is.
- **Extra Spin** implemented as an immediate free re-spin (chosen) vs. `+1`
  token. Immediate re-spin feels better for a kid.
- **Coin toast vs. modal on wheel-earned** — toast chosen to avoid interrupting
  play; a tiny modal is acceptable if preferred.
- **Weapon prizes** — kept as three separate wedges (pistol/jet/web) so each is
  distinctly winnable, per "each one of the weapons."
