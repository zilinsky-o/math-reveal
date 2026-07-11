# Feature Plan: Wheel of Fortune (Spin-to-Win Reward)

**Branch:** `claude/wheel-fortune-slot-machine-tuxwed`
**Status:** Planned — ready for implementation
**Author of plan:** Opus (research + design). **Implementer:** Sonnet.

---

## 0. TL;DR for the implementer

Add a **Wheel of Fortune** bonus spin that the player earns by **completing a
level**. After the existing collectible reward is shown on the completion
screen, a **"🎡 Spin the Wheel!"** button appears. Clicking it opens a modal
with an animated wheel that decelerates and lands on a prize wedge. Prizes are
drawn from the systems that already exist: **collectibles** (the `backgrounds`
array + rarity system) and **weapons** (the `WEAPONS` system), plus one
**jackpot** wedge. The award is granted using the existing
`addToCollection()` / `addWeapon()` functions.

This mirrors the existing `weapon-discovery-modal` reward pattern almost
exactly — the wheel is "just" a fancier reveal animation in front of the same
grant logic. No new dependencies, no build step, ES5-compatible vanilla JS,
2-space indentation. (See `CLAUDE.md` — all its constraints apply.)

---

## 1. Design decisions (defaults chosen — flip freely)

These were going to be confirmed interactively; the picker tool failed, so the
plan commits to sensible defaults. Each is isolated so it is cheap to change.

| Decision | Default chosen | Why / how to change |
|---|---|---|
| **Mechanic** | **Wheel of Fortune** (single spinning wheel, one prize per spin) | Cleanest fit for the existing modal-reward pattern and CSS-transform animation. A slot-machine variant is described in §9 as a stretch alternative. |
| **Trigger / economy** | **Free spin on every level completion** | Lowest friction, no new currency to balance. Designed to be extensible to a coin economy (see §8) without reworking the wheel itself. |
| **Prizes** | **Collectibles + Weapons + one Jackpot wedge** | Reuses both existing reward systems. Coins are only added if the coin economy (§8) is adopted. |
| **Persistence of "spin available"** | Spin is consumed immediately during the completion screen (no stored "pending spin") | Simplest. If you want spins to be bankable/home-screen-accessible, see §8. |

If any of these should change, the only files affected are `config.js`
(prize table), `game.js` (trigger point), and possibly `storage.js` (if a
currency is added). The wheel rendering/animation code is independent of all
four decisions.

---

## 2. How the current reward flow works (grounding)

Read these before editing so the new code matches house style:

- **`game.js:886` `showCompletion()`** — stops timer, plays completion sound,
  `saveHighestLevel()`, `addToCollection(currentBg.emoji, currentBg.name)`,
  hides `#question-box`, shows `#completion`, sets `#completion-text` /
  `#new-collectible`, toggles `#next-level-button` based on whether
  `LEVEL_CONFIG[currentLevel + 1]` exists, then renders speed/mistake reports.
- **`game.js:952` `goToNextLevel()`** — advances `currentLevel`, stops music,
  clears boss interval, hides completion, shows question box, `showLevelIntro()`.
- **`game.js:391` `showWeaponDiscovery()` / `:405` `closeWeaponDiscovery()`** —
  **the reference pattern.** Picks a random weapon, calls `addWeapon()`, sets
  emoji/name/desc on `#weapon-discovery-modal`, `display:flex`, plays a sound.
  The wheel modal should be structured the same way.
- **`storage.js:24` `addToCollection(emoji, name)`** — grant a collectible
  (handles dup counting + `updateCollectionCount()`).
- **`storage.js:319` `addWeapon(weaponType)`** — grant a weapon (increments +
  `updateWeaponsUI()`).
- **`storage.js:142` `determineRarity()` / `:181` `selectRandomBackground()`** —
  weighted rarity selection; reuse for the "collectible" wedges.
- **`index.html:60-70`** — the `weapon-discovery-modal` markup to copy from.
- **`index.html:173-180`** — the `#completion` block where the Spin button goes.
- **`config.js`** — where the prize table (`WHEEL_PRIZES`) and constants go.

---

## 3. Data model (config.js)

Add near the `WEAPONS` block:

```javascript
// Wheel of Fortune: bonus spin awarded on level completion.
// Each wedge has a `type` (how the prize is granted), a display emoji/label,
// and a `weight` (relative probability). Weights need not sum to anything;
// selection normalizes them. Order in this array === clockwise order of the
// wedges drawn on the wheel, so keep it stable for the CSS angles to line up.
const WHEEL_PRIZES = [
    { id: 'collectible',      type: 'collectible', label: 'Mystery Friend', emoji: '🎁', weight: 34, color: '#a78bfa' },
    { id: 'weapon',           type: 'weapon',      label: 'Weapon',         emoji: '⚔️', weight: 22, color: '#f97316' },
    { id: 'collectible-rare', type: 'collectible', label: 'Rare Friend',    emoji: '✨', weight: 12, color: '#38bdf8', rarityBoost: true },
    { id: 'weapon',           type: 'weapon',      label: 'Weapon',         emoji: '🕸️', weight: 22, color: '#14b8a6' },
    { id: 'collectible',      type: 'collectible', label: 'Mystery Friend', emoji: '🐾', weight: 34, color: '#fbbf24' },
    { id: 'jackpot',          type: 'jackpot',     label: 'JACKPOT!',       emoji: '💎', weight: 4,  color: '#dc2626' }
];

const WHEEL_SPIN_DURATION_MS = 4200;   // deceleration time
const WHEEL_MIN_TURNS = 5;             // full rotations before landing
```

Notes for the implementer:
- **Even wedge count is easiest** for the conic-gradient math (6 above). If you
  change the count, update the CSS `conic-gradient` and the per-wedge label
  rotation together.
- `rarityBoost: true` wedges should bias toward higher rarity. Simplest
  implementation: for a boosted collectible, call `selectRandomBackground()`
  but re-roll a few times keeping the highest-rarity result, OR temporarily
  treat `getHighestLevel()` as higher. Keep it simple; exact tuning is not
  critical for a kids' game.
- **Jackpot** = grant a guaranteed high-tier collectible **and** one random
  weapon (a "bundle"). Define its behavior in `resolveWheelPrize()` (§5).

---

## 4. HTML (index.html)

Add a new modal, copying the structure/classes of `#weapon-discovery-modal`
(insert right after it, ~line 70). Keep IDs `kebab-case`.

```html
<div class="wheel-modal" id="wheel-modal">
    <div class="wheel-modal-content">
        <h2 id="wheel-title">🎡 Spin the Wheel!</h2>
        <div class="wheel-stage">
            <div class="wheel-pointer">▼</div>
            <div class="wheel" id="wheel"><!-- wedges drawn via CSS / JS --></div>
        </div>
        <button class="start-level-button" id="wheel-spin-btn" onclick="spinWheel()">SPIN!</button>
        <div class="wheel-result" id="wheel-result" style="display:none;">
            <div class="wheel-result-emoji" id="wheel-result-emoji">🎁</div>
            <p id="wheel-result-text">You won!</p>
            <button class="start-level-button" id="wheel-collect-btn" onclick="closeWheel()">COLLECT!</button>
        </div>
    </div>
</div>
```

Add the **Spin button** to the `#completion` block (index.html:178, next to
`#next-level-button`):

```html
<button class="next-level-button" id="wheel-open-btn" onclick="openWheel()"
        style="background: linear-gradient(135deg, #f59e0b 0%, #dc2626 100%);">🎡 Spin the Wheel!</button>
```

**Cache-busting:** bump the `?v=` query on `styles.css` and every `<script>` in
`index.html` (currently `v=2.3.1`) and the `.version-info` text — this repo
does that on every deploy (commit `d596ec3`). Suggest `v=2.4.0`.

---

## 5. Game logic (game.js)

Add a self-contained wheel section (near `showWeaponDiscovery`, ~line 391).
Global state near the other `let` declarations at the top of game.js:

```javascript
let wheelSpinning = false;
let wheelRotation = 0;        // accumulated degrees, so each spin continues forward
let wheelLandedPrize = null;
```

Functions:

```javascript
// Build the wheel wedges once (or rebuild if WHEEL_PRIZES changes).
function buildWheel() { /* create labeled wedge elements; set conic-gradient */ }

// Called by the completion-screen button.
function openWheel() {
    document.getElementById('completion').style.display = 'none';
    buildWheel();
    document.getElementById('wheel-result').style.display = 'none';
    document.getElementById('wheel-spin-btn').style.display = 'inline-block';
    document.getElementById('wheel-modal').style.display = 'flex';
}

// Weighted pick of a wedge index.
function pickWheelPrizeIndex() { /* normalize weights, Math.random() */ }

// Spin: pick target, compute final rotation so the pointer lands mid-wedge,
// apply CSS transition, resolve prize on transitionend / setTimeout.
function spinWheel() {
    if (wheelSpinning) return;
    wheelSpinning = true;
    document.getElementById('wheel-spin-btn').disabled = true;
    const idx = pickWheelPrizeIndex();
    const wedgeAngle = 360 / WHEEL_PRIZES.length;
    // pointer at top (12 o'clock). Land wedge center under it:
    const target = (WHEEL_MIN_TURNS * 360) + (360 - (idx * wedgeAngle) - wedgeAngle / 2);
    wheelRotation += target;
    const wheel = document.getElementById('wheel');
    wheel.style.transition = `transform ${WHEEL_SPIN_DURATION_MS}ms cubic-bezier(0.17, 0.67, 0.12, 0.99)`;
    wheel.style.transform = `rotate(${wheelRotation}deg)`;
    playSound(/* rising tick or reuse a sound */);
    setTimeout(() => finishSpin(WHEEL_PRIZES[idx]), WHEEL_SPIN_DURATION_MS + 100);
}

// Grant the prize and show the result panel.
function finishSpin(prize) {
    const awarded = resolveWheelPrize(prize);   // does the actual addToCollection/addWeapon
    wheelSpinning = false;
    document.getElementById('wheel-spin-btn').style.display = 'none';
    document.getElementById('wheel-result-emoji').textContent = awarded.emoji;
    document.getElementById('wheel-result-text').textContent = awarded.message;
    document.getElementById('wheel-result').style.display = 'block';
    playSuccessSound();   // or playBossVictorySound() for jackpot
}

// Map a wedge to a concrete reward and grant it. Returns {emoji, message}.
function resolveWheelPrize(prize) {
    if (prize.type === 'weapon') {
        const types = ['pistol', 'jet', 'web'];
        const t = types[Math.floor(Math.random() * types.length)];
        addWeapon(t);
        return { emoji: WEAPONS[t].emoji, message: `You won a ${WEAPONS[t].name}!` };
    }
    if (prize.type === 'jackpot') {
        // bundle: a high-tier collectible + a weapon
        const bg = selectRandomBackground(/* bias high */);
        addToCollection(bg.emoji, bg.name);
        const t = ['pistol', 'jet', 'web'][Math.floor(Math.random() * 3)];
        addWeapon(t);
        return { emoji: '💎', message: `JACKPOT! ${bg.name} + a ${WEAPONS[t].name}!` };
    }
    // collectible (optionally rarity-boosted)
    const bg = selectRandomBackground(prize.rarityBoost ? /* boost */ null : currentLevel);
    addToCollection(bg.emoji, bg.name);
    return { emoji: bg.emoji, message: `You won a ${bg.name}!` };
}

function closeWheel() {
    document.getElementById('wheel-modal').style.display = 'none';
    // Return to completion screen so Next Level / Home remain reachable.
    document.getElementById('completion').style.display = 'block';
    // Hide the spin button now that the spin is used up this level.
    document.getElementById('wheel-open-btn').style.display = 'none';
}
```

**Wiring into `showCompletion()` (game.js:886):**
- After the existing reward is shown, make the spin button visible:
  `document.getElementById('wheel-open-btn').style.display = 'inline-block';`
- Reset `wheelSpinning = false;` and re-enable `#wheel-spin-btn` at the top of
  `openWheel()` so a fresh spin is possible each level.

**One-spin-per-level guard:** because `closeWheel()` hides `#wheel-open-btn`,
and `showCompletion()` re-shows it only on the next completion, the player gets
exactly one spin per completed level. No persistence needed. (If a level can
re-show completion without re-entry, add a `spinUsedThisLevel` boolean reset in
`startLevel()`.)

**Boss/treasure/animal parity:** `showCompletion()` is shared by all level
types, so the spin is granted uniformly. Confirm treasure levels (which call
`showCompletion()` from `moveAvatarTo`, game.js:386) and bosses
(`winBossBattle()` in boss.js — verify it routes through `showCompletion()` or
grant the spin there too) both surface the button. **Action item:** grep
`boss.js` for how a boss win ends; if it does not call `showCompletion()`, add
the `wheel-open-btn` reveal there as well.

---

## 6. CSS (styles.css)

Add a wheel section following the existing modal conventions (Comic Sans, bright
palette, `@keyframes`). Key pieces:

- **`.wheel-modal`** — full-screen overlay, `display:none` default, `flex`
  centered when shown (copy `.weapon-discovery-modal`'s overlay rules).
- **`.wheel-stage`** — relative container holding pointer + wheel.
- **`.wheel-pointer`** — absolutely positioned at top center, `z-index` above
  the wheel, colored triangle (the `▼`).
- **`.wheel`** — a circle (e.g. `280px`, `border-radius:50%`) with a
  **`conic-gradient`** background split into N equal color stops using the
  `color` fields from `WHEEL_PRIZES`. `transform-origin:center`. The
  `transition` is set inline by `spinWheel()` so it can be cleared/reset.
- **Wedge labels** — either (a) draw emoji/label as child elements rotated by
  `idx * (360/N)` degrees and translated outward, or (b) keep it simple and
  rely on the color wedges + the result panel for the reveal. **Recommended:
  (a) emoji only** (no text) for clarity at kid-friendly sizes.
- **`.wheel-result`** — reuse `.weapon-discovery-content` styling (big emoji,
  sparkle). A jackpot could add a `pulse`/`shake` animation (both already exist
  in styles.css per CLAUDE.md).

Keep it responsive: the wheel should shrink on small screens (`@media` query,
e.g. `220px` under 600px width). No horizontal scroll.

---

## 7. Audio (audio.js)

Optional but nice. Either reuse existing sounds (`playSuccessSound`,
`playCompletionSound`, `playBossVictorySound`) or add:

- **`playWheelTick()`** — a short click; call repeatedly with decreasing
  frequency during the spin to simulate the ratchet (optional, can skip).
- Jackpot → `playBossVictorySound()` for extra fanfare.

Use `playSound(frequency, duration, type, delay)` at volume 0.3 per house
convention. Do **not** create new AudioContexts (CLAUDE.md gotcha).

---

## 8. Test mode (test-mode.js) — required by CLAUDE.md

Add a test-panel button so the wheel can be exercised without finishing a level:

- **`index.html`** test panel (~line 16): add
  `<button class="test-button" onclick="openWheel()">🎡 Open Wheel</button>`.
- Optionally a "Force Jackpot" toggle: a module-level `forceWheelPrizeId` that
  `pickWheelPrizeIndex()` honors when set, so QA can verify each wedge's grant
  logic deterministically.

Verify the panic-button (`R`) test-panel toggle still works and the wheel modal
does not trap focus.

---

## 9. Optional / stretch (not in default scope)

- **Coin economy** (if "Both"/"Coins" was wanted): add `mathGameCoins`
  localStorage key + `loadCoins/saveCoins/addCoins/spendCoins` in `storage.js`
  (mirror the weapons functions), a coin counter in the header
  (`index.html:82-100`), award coins on level completion, and a "Spin (10 🪙)"
  button on the **home screen** (`#home-screen`, index.html:31) that calls
  `openWheel()` when affordable. Add a `coins` prize type to `WHEEL_PRIZES`.
  This is additive and does not change the wheel rendering.
- **Bankable spins:** store `mathGamePendingSpins`; increment on completion,
  decrement on spin; show a "Spins: N" badge and allow spinning from home.
- **Slot-machine variant:** replace the single `.wheel` with three `.reel`
  columns of symbols animated by `translateY`; matching the middle row pays
  out. Reuse the same `resolveWheelPrize()` grant logic. Higher animation cost;
  only pursue if the wheel is rejected.

---

## 10. Implementation checklist (order of work)

1. **config.js** — add `WHEEL_PRIZES`, `WHEEL_SPIN_DURATION_MS`,
   `WHEEL_MIN_TURNS`.
2. **index.html** — add `#wheel-modal` markup; add `#wheel-open-btn` to
   `#completion`; add test-panel button; bump all `?v=` to `2.4.0`; update
   `.version-info`.
3. **styles.css** — add `.wheel-modal`, `.wheel`, `.wheel-pointer`,
   `.wheel-result`, responsive `@media`; bump handled in HTML.
4. **game.js** — add wheel state + `buildWheel/openWheel/pickWheelPrizeIndex/`
   `spinWheel/finishSpin/resolveWheelPrize/closeWheel`; reveal `#wheel-open-btn`
   in `showCompletion()`.
5. **boss.js** — confirm boss win surfaces the spin button (route through
   `showCompletion()` or reveal button in `winBossBattle()`).
6. **audio.js** — (optional) wheel sounds.
7. **test-mode.js** — (optional) force-prize hook.
8. **Docs** — bump version in `CLAUDE.md`/`readme.md`/`README.md` if desired;
   note the new `WHEEL_PRIZES` config and (if added) `mathGameCoins` key.

## 11. Manual test checklist (`index.html?test=true`)

- [ ] Complete an **animal** level → Spin button appears → wheel spins →
      lands on a wedge → correct collectible/weapon granted (check collection
      badge / weapons UI) → COLLECT returns to completion → Next Level works.
- [ ] Same for a **treasure** level (jewelry pool) and a **boss** level.
- [ ] Each wedge type grants correctly (use Force-Jackpot / force-prize hook).
- [ ] Jackpot grants both a collectible and a weapon; plays fanfare.
- [ ] Only **one** spin per level (button hidden after use; reappears next
      completion).
- [ ] Spin animation is smooth (~4s, 60fps), pointer visually matches the
      awarded wedge.
- [ ] localStorage persists new items after refresh; no console errors.
- [ ] Responsive: wheel fits and does not cause horizontal scroll on mobile.
- [ ] Test-panel "Open Wheel" button works; panic-button (`R`) still toggles.

---

## 12. Guardrails (from CLAUDE.md — do not violate)

- No external deps, no build step, ES5-compatible vanilla JS, 2-space indent.
- Don't change the JS **load order** in index.html.
- Don't break existing localStorage keys; new keys only, with safe defaults.
- Keep errors non-punitive and UX child-friendly (big buttons, emoji, Comic
  Sans, encouraging copy).
- Clear any intervals/timeouts you create (the spin `setTimeout` is one-shot,
  fine; if you add a tick loop, clear it in `closeWheel`).
- User-facing messages via DOM, never `console.log`.
