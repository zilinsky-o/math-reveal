# Plan: Hebrew Translation + RTL Layout

**Target:** Translate the Math Reveal game fully to Hebrew and lay it out right-to-left (RTL) on both desktop and mobile.

**Base branch:** This plan is written against `claude/mobile-ui-implementation-dl3if1` (the mobile UX branch). **Assume that branch has been merged into `main`** before this work starts; branch off the merged `main`.

**Confirmed product decisions:**
1. **Hebrew-only, in-place replacement.** Replace English strings directly — no language toggle, no i18n framework. This keeps the zero-dependency, no-build ethos.
2. **Keep the game arenas left-to-right.** Only text, HUD, menus, modals, and reading flow become RTL. The boss battle and treasure maze keep their current LTR spatial layout and JS pixel/percent positioning **untouched**. This is the low-risk path and requires **no changes to gameplay math**.

**Non-goals:** No new dependencies, no build step, no external fonts/CDNs (per `CLAUDE.md`), no changes to level progression, scoring, boss mechanics, or localStorage keys/schema.

---

## 1. Strategy overview

The work splits into three independent workstreams:

- **A. RTL layout** — one attribute on `<html>` plus a small, contained block of CSS overrides. Most of the flip is automatic once `dir="rtl"` is set; the effort is (a) *protecting* the spatial arenas from the flip and (b) fixing a handful of physical `left/right` rules.
- **B. String translation** — replace every user-facing English string with Hebrew across `index.html`, `game.js`, `boss.js`, `storage.js`, `config.js`, and (optionally) `test-mode.js`. `audio.js` has no user-facing text.
- **C. Bidi-safe math + font** — make sure `2 + 2` / `15 - 3` render correctly inside RTL text, and that Hebrew glyphs render in a child-friendly way (Comic Sans MS has **no** Hebrew glyphs).

Translation tables for **every** string are in §4 (UI strings) and §5 (collectible names + labels). The executor should be able to apply them mechanically.

---

## 2. Workstream A — RTL layout

### A1. Set document direction + language
In `index.html`, change:
```html
<html lang="en">
```
to:
```html
<html lang="he" dir="rtl">
```
This alone flips: text alignment (`start`/`end`), flex-row visual order (the header HUD, collection header, resources bar), list bullets, and logical margins/padding that already use logical properties. Everything else below is cleanup.

### A2. Protect the spatial arenas (critical)
The reveal grid, treasure maze, and boss arena rely on physical `left` positioning set from JS (`boss.js` sets `style.left = bossPosition + '%'`; `game.js` positions the avatar/chest via `getBoundingClientRect`). CSS Grid auto-placement would also mirror column order under RTL. To keep these exactly as designed, **force them back to LTR** in `styles.css`:

```css
/* Gameplay arenas stay LTR; only the surrounding UI is RTL. */
.game-board,
.grid-overlay,
.pathfinding-arena,
.pathfinding-grid,
.boss-arena {
    direction: ltr;
}
```
Add this near the top of `styles.css` (after the reset) so it is easy to find. With this in place, **no `boss.js` / `game.js` positioning code changes are needed.**

> Note: `getBoundingClientRect()` returns physical viewport coords, so avatar/chest math is already direction-agnostic — but forcing `direction: ltr` also stops the grid *cells* from reordering, which is what preserves the intended "start on the left" maze layout.

The `.weapons-container` (mobile: normal-flow strip; desktop: absolute) is symmetric/centered — leave it to inherit RTL; no action needed.

### A3. Fix explicit physical text alignment
Search `styles.css` for `text-align: left` and `text-align: right` on **content** blocks and convert to logical values so they follow RTL:
- Line ~1047 `.mistake-report, .achievement-report { text-align: left; }` → `text-align: start;` (report body should be right-aligned in Hebrew). *(Reports are hidden on mobile via `#reports-container { display: none }`, so this is desktop-only.)*
- Leave `text-align: center` rules as-is (direction-neutral).

### A4. Audit remaining physical `left`/`right` (low priority polish)
Most absolute-positioned decorative elements can stay physical. Review these and decide per-item; **none block launch**:
- `.version-info { right: 0.25rem }` — badge sits top-right; optionally move to `left` for RTL. Cosmetic.
- `.test-panel { left: 0 }` — dev-only overlay; leave as-is.
- `.collection-header` uses `justify-content: space-between` → the `×` close button **auto-moves** to the visual left under RTL. No change needed, but verify visually.
- `.wheel-reel-pointer { left: 0.5rem }` — decorative pointer inside the (LTR-neutral) reel; leave as-is.
- Boss progress bar / danger zone are centered — no change.

**Rule of thumb:** anything inside an arena forced LTR in A2 keeps physical coords; anything in the RTL chrome should prefer logical properties (`inset-inline-start/end`, `margin-inline-*`, `padding-inline-*`, `text-align: start/end`) if touched.

### A5. Mobile check
The mobile media query (`@media (max-width: 768px)`) is layout/size only — it contains no directional logic that fights RTL. The `.question-box { order: -1 }` (question on top) still works under RTL. Re-verify the header HUD wraps sensibly when reversed (icons/buttons may now sit mirrored — expected and fine).

---

## 3. Workstream C — bidi-safe math + font

### C1. Keep math expressions LTR inside Hebrew questions
The question text becomes e.g. `כמה זה 2 + 2?`. Digits render LTR naturally, but subtraction (`15 - 3`) inside RTL flow can visually reorder. Wrap the math in an explicit LTR isolate at the **two** question-render sites in `game.js` (currently `~line 348` and `~line 825`), switching from `textContent` to `innerHTML`:

```js
// before:
questionEl.textContent = `What is ${q.row} ${q.op} ${q.col}?`;
// after:
questionEl.innerHTML = `כמה זה <span dir="ltr">${q.row} ${q.op} ${q.col}</span>?`;
```
Values are game-generated integers/operators (not user input), so `innerHTML` here is safe. Verify a subtraction level renders `15 - 3` (not `3 - 15`).

### C2. Font stack for Hebrew (Comic Sans MS has no Hebrew glyphs)
Comic Sans MS will silently fall back to the OS default for Hebrew, which looks inconsistent. Update every `font-family: 'Comic Sans MS', cursive;` in `styles.css` (and the inline ones in `index.html`'s test panel) to a stack that keeps the playful Latin/digit look but provides a decent Hebrew fallback:
```css
font-family: 'Comic Sans MS', 'Arial Rounded MT Bold', 'Arial Hebrew', 'Alef', 'Segoe UI', system-ui, sans-serif;
```
Do a global find/replace of the existing `'Comic Sans MS', cursive` token so it stays consistent everywhere.

**Optional polish (allowed, not a CDN):** bundle a self-hosted rounded Hebrew webfont file (e.g. Varela Round / Fredoka, downloaded into the repo as a static `.woff2`) and register it with `@font-face`. This is a local asset — it does **not** violate the no-external-dependency rule — and gives a uniform playful Hebrew look. Recommend shipping the system stack first; add the webfont only if the client wants pixel-consistent typography.

---

## 4. Workstream B — UI string translations

Apply these replacements. Location column gives file + anchor text to search for. Emojis stay as-is; only text changes. Where a string is a JS template with `${...}`, keep the interpolation and translate only the words.

### 4a. `index.html` (static markup)

| English | Hebrew |
|---|---|
| `<title>Math Picture Reveal Game</title>` | `משחק חשיפת התמונה` |
| `🔧 Test Panel` | `🔧 פאנל בדיקה` *(dev; optional)* |
| Home `<h1>Math Reveal</h1>` | `חשיפה במתמטיקה` |
| `Welcome back!` (`#home-desc`) | `ברוכים השבים!` |
| `▶️ Continue` | `▶️ המשך` |
| `🔄 Restart Journey` | `🔄 להתחיל מחדש` |
| `LEVEL 1` (`#level-intro-title`) | `שלב 1` |
| `Practice Addition!` (`#level-intro-desc`) | `מתאמנים בחיבור!` |
| `START` | `התחלה` |
| `DEFEATED!` | `הובסתם!` |
| `The boss reached you!` | `הבוס השיג אתכם!` |
| `TRY AGAIN` | `נסו שוב` |
| `Weapon Found!` (`#weapon-discovery-name`) | `נשק נמצא!` |
| `A powerful weapon!` (`#weapon-discovery-desc`) | `נשק עוצמתי!` |
| `AWESOME!` | `מעולה!` |
| `🎡 Wheel of Fortune!` (`#wheel-title`) | `🎡 גלגל המזל!` |
| `STOP!` (`#wheel-stop-btn`) | `עצור!` |
| `You won!` (`#wheel-result-text`) | `זכיתם!` |
| `COLLECT!` (`#wheel-collect-btn`) | `אסוף!` |
| `🎨 My Collection` | `🎨 האוסף שלי` |
| `Level 1` (`#level-badge`) | `שלב 1` |
| `Math Picture Reveal! ✨` (header h1) | `חושפים את התמונה! ✨` |
| `0/64 Cells Discovered!` (`#progress-text`) | `0/64 משבצות נחשפו!` |
| `Mistakes: 0` (`#mistakes-text`) | `טעויות: 0` |
| `📚 Collection: 0` (`#collection-count`) | `📚 אוסף: 0` |
| `⏸️ Pause` (`.btn-label`) | `⏸️ השהיה` |
| `🔄 Restart` | `🔄 מחדש` |
| `🏠 Home` | `🏠 בית` |
| `🎨 Collection` (collectibles-pane h3) | `🎨 אוסף` |
| `Boss Position` (`#boss-progress-fill`) | `מיקום הבוס` |
| `title="Pistol"` | `title="אקדח"` |
| `title="Fighter Jet"` | `title="מטוס קרב"` |
| `title="Spider Web"` | `title="קורי עכביש"` |
| `⏸️ Paused` (`.paused-text`) | `⏸️ מושהה` |
| `What is 2 + 2?` (`#question` placeholder text) | `כמה זה 2 + 2?` |
| `Check Answer!` (`.check-button`) | `בדקו תשובה!` |
| `🎉 Amazing Work! 🎉` (completion h2) | `🎉 עבודה מדהימה! 🎉` |
| `You revealed the Unicorn!` (`#completion-text`) | `חשפתם את חד-הקרן!` |
| `Added to your collection!` | `נוסף לאוסף שלכם!` |
| `Next Level →` (`#next-level-button`) | `← השלב הבא` *(arrow flips to point left)* |

### 4b. `game.js` (dynamic strings)

| English (search) | Hebrew |
|---|---|
| `▶️<span class="btn-label"> Resume` | `▶️<span class="btn-label"> המשך` |
| `⏸️<span class="btn-label"> Pause` (all occurrences) | `⏸️<span class="btn-label"> השהיה` |
| timer `` `${elapsed}s` `` | `` `${elapsed} שנ׳` `` |
| `` `What is ${...} ${...} ${...}?` `` (×2) | see C1: `` `כמה זה <span dir="ltr">${...} ${...} ${...}</span>?` `` |
| `Click a yellow tile!` | `לחצו על משבצת צהובה!` |
| `SPIN AGAIN!` | `סובבו שוב!` |
| `COLLECT!` (×2) | `אסוף!` |
| `` `${cellsDiscovered}/64 Cells Discovered!` `` (all) | `` `${cellsDiscovered}/64 משבצות נחשפו!` `` |
| `Mistakes: 0` | `טעויות: 0` |
| `` `Mistakes: ${totalMistakes}` `` (all) | `` `טעויות: ${totalMistakes}` `` |
| `` `Level ${currentLevel}` `` (badge) | `` `שלב ${currentLevel}` `` |
| `Boss Battle!` | `קרב בוס!` |
| `Find the Treasure!` | `מצאו את האוצר!` |
| `Click a yellow tile to start!` | `לחצו על משבצת צהובה כדי להתחיל!` |
| `✨ Correct! Tile unlocked!` | `✨ נכון! המשבצת נפתחה!` |
| `❌ Wrong! Try again!` | `❌ טעות! נסו שוב!` |
| `❌ Wrong! Tile blocked!` | `❌ טעות! המשבצת נחסמה!` |
| `✨ Correct! Great job!` (all) | `✨ נכון! כל הכבוד!` |
| `🤔 Not quite! Try again!` (all) | `🤔 כמעט! נסו שוב!` |
| `` `You ${foundVerb} ${currentBg.name}!` `` | See note ▼ |
| `foundVerb = 'found the'` / `'revealed the'` | Restructure ▼ |
| home desc `` `Continue from Level ${reached} — ${typeLabel}` `` | `` `המשך משלב ${reached} — ${typeLabel}` `` |
| home desc `Ready to start your journey?` | `מוכנים להתחיל את המסע?` |
| typeLabel ternary `'Boss'`/`'Treasure'`/`'Animal'` | `'בוס'` / `'אוצר'` / `'חיה'` |
| restartJourney confirm `Restart your whole journey from Level 1? Your collection is kept.` | `להתחיל את כל המסע מחדש משלב 1? האוסף שלכם יישמר.` |
| restartGame confirm `Are you sure you want to restart this level? Your current progress will be lost.` | `בטוחים שברצונכם להתחיל את השלב מחדש? ההתקדמות הנוכחית תאבד.` |

**Completion sentence (`foundVerb`) — Hebrew word order differs.** Replace the `found the`/`revealed the` pattern with a full-sentence ternary so it reads naturally:
```js
const msg = levelConfig.type === 'treasure'
    ? `מצאתם את ${currentBg.name}!`
    : `חשפתם את ${currentBg.name}!`;
document.getElementById('completion-text').textContent = msg;
```

**Completion reports (desktop-only; `#reports-container` hidden on mobile):**

| English | Hebrew |
|---|---|
| `🌟 Speed Achievements (Under 5 seconds):` | `🌟 הישגי מהירות (מתחת ל-5 שניות):` |
| `` `${question} (${avgTime}s avg)` `` | `` `${question} (ממוצע ${avgTime} שנ׳)` `` |
| `Questions with Mistakes:` | `שאלות עם טעויות:` |
| `` `${question} (${count} mistake${count>1?'s':''})` `` | `` `${question} (${count} טעויות)` `` — drop the `s` pluralization; Hebrew uses one form here |
| `Questions That Took Time (20+ seconds):` | `שאלות שלקחו זמן (20+ שניות):` |
| `` `${question} (avg ${avgTime}s)` `` | `` `${question} (ממוצע ${avgTime} שנ׳)` `` |
| `Perfect! 🌟` | `מושלם! 🌟` |

### 4c. `boss.js`

| English | Hebrew |
|---|---|
| `Mistakes: 0` | `טעויות: 0` |
| `⚠️ DANGER! Boss is getting close! ⚠️` | `⚠️ סכנה! הבוס מתקרב! ⚠️` |
| `🎉 Victory! 🎉` | `🎉 ניצחון! 🎉` |
| `💀 Defeated 💀` | `💀 הובסתם 💀` |
| `` `Boss at ${...}%` `` | `` `הבוס ב-${...}%` `` |
| `You defeated the Boss!` | `הבסתם את הבוס!` |
| `⏸️<span class="btn-label"> Pause` | `⏸️<span class="btn-label"> השהיה` |

### 4d. `storage.js`

| English | Hebrew |
|---|---|
| `` `📚 Collection: ${totalCount}` `` | `` `📚 אוסף: ${totalCount}` `` |
| `Complete games to collect animals! 🎯` | `השלימו משחקים כדי לאסוף חיות! 🎯` |
| `No collectibles yet! Complete games to collect cute animals! 🎯` | `עדיין אין פריטים! השלימו משחקים כדי לאסוף חיות חמודות! 🎯` |
| pane tooltip `` `${item.name} - ${rarityLabels[...]} (x${count})` `` | `` `${displayName} · ${rarityLabels[...]} (x${count})` `` (see §5 note on `displayName`) |
| modal tooltip `` `${rarityLabels[...]} - Found ${count}x` `` | `` `${rarityLabels[...]} · נאסף ${count} פעמים` `` |
| delete confirm `` `Remove ${item.name} from collection?` `` | `` `להסיר את ${displayName} מהאוסף?` `` |

### 4e. `test-mode.js` (developer-facing — translate for consistency, low priority)

| English | Hebrew |
|---|---|
| revealAll confirm `This will complete all remaining cells and end the game. Continue?` | `הפעולה תשלים את כל המשבצות ותסיים את המשחק. להמשיך?` |
| `64/64 Cells Discovered!` | `64/64 משבצות נחשפו!` |
| typeLabel map `Animal`/`Treasure`/`Boss` | `חיה` / `אוצר` / `בוס` |

---

## 5. `config.js` — labels, weapons, wheel, and collectible names

### 5a. `rarityLabels`
```js
const rarityLabels = {
    common: 'נפוץ',
    uncommon: 'לא נפוץ',
    rare: 'נדיר',
    epic: 'אפי',
    legendary: 'אגדי',
    mythical: 'מיתי',
    exotic: 'אקזוטי',
    secret: 'סודי',
    boss: 'בוס'
};
```

### 5b. `WEAPONS` (name + description)
```js
pistol: { name: 'אקדח',      description: 'יורה כדור בבוס — הודף אותו כמו פגיעת פצצה' }
jet:    { name: 'מטוס קרב',  description: 'תקיפה אווירית! מקפיא את הבוס עד השאלה הבאה' }
web:    { name: 'קורי עכביש', description: 'מאט את תנועת הבוס ב-50% למשך 30 שניות' }
```

### 5c. `WHEEL_PRIZES` labels
| id | English | Hebrew |
|---|---|---|
| coins20 | `+20 Coins` | `+20 מטבעות` |
| special | `Special Gift` | `מתנה מיוחדת` |
| freeSolution | `Free Solution` | `פתרון חינם` |
| extraRoll | `Extra Spin!` | `סיבוב נוסף!` |
| pistol | `Pistol` | `אקדח` |
| jet | `Jet` | `מטוס` |
| web | `Web` | `קורים` |

### 5d. Generated level titles/descriptions (`buildLevelConfig`)
Translate the template literals inside `buildLevelConfig()`:
```js
const addendText = addendCeiling === 1 ? '+1' : `+1 עד +${addendCeiling}`;
if (type === 'boss') {
    title = `בוס — שלב ${level}`;
    description = `הביסו את הבוס! דו-ספרתי ${addendText}`;
} else if (type === 'treasure') {
    title = `שלב ${level}`;
    description = `מצאו את האוצר! דו-ספרתי ${addendText}`;
} else {
    title = `שלב ${level}`;
    description = `חשפו חבר! חד-ספרתי ${addendText}`;
}
```

### 5e. Collectible `name` fields (119 entries, in file order)
Replace each `name:` value. Emoji shown for disambiguation only — **do not change emojis**.

| Emoji | English | Hebrew |
|---|---|---|
| 🦄 | Unicorn | חד-קרן |
| 🐱 | Kitty | חתלתול |
| 🐬 | Dolphin | דולפין |
| 🐻 | Bear | דוב |
| 🦊 | Fox | שועל |
| 🦋 | Butterfly | פרפר |
| 🐝 | Bee | דבורה |
| 🦁 | Lion | אריה |
| 🐧 | Penguin | פינגווין |
| 🐸 | Frog | צפרדע |
| 🐷 | Pig | חזיר |
| 🐘 | Elephant | פיל |
| 🦕 | Dinosaur | דינוזאור |
| 🦩 | Flamingo | פלמינגו |
| 🐥 | Chick | אפרוח |
| 🦉 | Owl | ינשוף |
| 🦘 | Kangaroo | קנגורו |
| 🐋 | Whale | לווייתן |
| 🐤 | Baby Chick | גוזל |
| 🦀 | Crab | סרטן |
| 🐟 | Fish | דג |
| 🐢 | Turtle | צב |
| 🐭 | Mouse | עכבר |
| 🐹 | Hamster | אוגר |
| 🐰 | Rabbit | ארנב |
| 🦔 | Hedgehog | קיפוד |
| 🦎 | Lizard | לטאה |
| 🐙 | Octopus | תמנון |
| 🦈 | Shark | כריש |
| 🐨 | Koala | קואלה |
| 🦇 | Bat | עטלף |
| 🦞 | Lobster | לובסטר |
| 🐊 | Crocodile | תנין |
| 🦒 | Giraffe | ג'ירפה |
| 🦏 | Rhino | קרנף |
| 🦛 | Hippo | היפופוטם |
| 🐯 | Tiger | נמר |
| 🐵 | Monkey | קוף |
| 🦙 | Llama | למה |
| 🦚 | Peacock | טווס |
| 🐦 | Bird | ציפור |
| 🐴 | Horse | סוס |
| 🦗 | Cricket | צרצר |
| 🦟 | Mosquito | יתוש |
| 🐌 | Snail | חילזון |
| 🦆 | Duck | ברווז |
| 🦢 | Swan | ברבור |
| 🦜 | Parrot | תוכי |
| 🦖 | T-Rex | טי-רקס |
| 🐿️ | Squirrel | סנאי |
| 🐺 | Wolf | זאב |
| 🦝 | Raccoon | דביבון |
| 🐑 | Sheep | כבשה |
| 🐮 | Cow | פרה |
| 🪲 | Beetle | חיפושית |
| 🐛 | Caterpillar | זחל |
| 🪰 | Fly | זבוב |
| 🦡 | Badger | גירית |
| 🦫 | Beaver | בונה |
| 🐻‍❄️ | Polar Bear | דוב קוטב |
| 🦦 | Otter | לוטרה |
| 🦨 | Skunk | בואש |
| 🐗 | Boar | חזיר בר |
| 🦃 | Turkey | תרנגול הודו |
| 🦅 | Eagle | נשר |
| 🦌 | Deer | צבי |
| 🐪 | Camel | גמל |
| 🦬 | Bison | ביזון |
| 🐆 | Leopard | ברדלס |
| 🦣 | Mammoth | ממותה |
| 🐉 | Dragon | דרקון |
| 🐍 | Basilisk | בזיליסק |
| 🐲 | Chinese Dragon | דרקון סיני |
| 🕊️ | Phoenix | עוף החול |
| 🦎 | Gecko | שממית |
| 🐕 | Dog | כלב |
| 🐈‍⬛ | Black Cat | חתול שחור |
| 🦭 | Harbor Seal | כלב ים |
| 🪿 | Wild Goose | אווז בר |
| 🐅 | Frost Tiger | נמר קרח |
| 🍄 | Forest Sprite | שדון יער |
| 🦂 | Fire Scorpion | עקרב אש |
| 🐕‍🦺 | Shadow Wolf | זאב צללים |
| 🐐 | Manticore | מנטיקור |
| 🐏 | Star Stag | אייל כוכבים |
| 🌌 | Cosmic Whale | לווייתן קוסמי |
| 🌟 | Celestial Spirit | רוח שמימית |
| 💍 | Gold Ring | טבעת זהב |
| 💎 | Diamond | יהלום |
| 👑 | Crown | כתר |
| 🪙 | Gold Coin | מטבע זהב |
| 💖 | Pink Gem | אבן ורודה |
| 💚 | Emerald Heart | לב אמרלד |
| 🔮 | Crystal Ball | כדור בדולח |
| 📿 | Golden Beads | חרוזי זהב |
| 🏆 | Trophy | גביע |
| 💝 | Ruby Box | תיבת אודם |
| ⚜️ | Silver Fleur | פרח כסף |
| 🌟 | Star Jewel | תכשיט כוכב |
| 🍭 | Lollipop | סוכרייה על מקל |
| 🍬 | Candy | ממתק |
| 🧁 | Cupcake | קאפקייק |
| 🍩 | Donut | דונאט |
| 🍪 | Cookie | עוגייה |
| 🎂 | Birthday Cake | עוגת יום הולדת |
| 🍫 | Chocolate | שוקולד |
| 🍦 | Ice Cream | גלידה |
| 🍰 | Shortcake | עוגת שכבות |
| 🍮 | Custard | פודינג |
| 🌙 | Crescent Moon | סהר |
| 🪐 | Ringed Planet | כוכב טבעות |
| ☄️ | Comet | שביט |
| 🌠 | Shooting Star | כוכב נופל |
| 💫 | Dizzy Star | כוכב מסתחרר |
| 🌈 | Rainbow | קשת |
| ⚡ | Lightning | ברק |
| ❄️ | Snowflake | פתית שלג |
| 🔥 | Flame | להבה |
| 🌊 | Wave | גל |

> If any Hebrew name above reads awkwardly to the client, it can be tweaked freely — names are display-only and not used as keys.

### 5f. localStorage name-migration note (collection display)
`addToCollection(emoji, name)` stores the **name** into `localStorage` (`mathGameCollection`). Collections saved before this change keep their **English** names, so the collection pane/modal tooltips would show mixed languages for returning players. To guarantee all-Hebrew display without touching the storage schema, add a tiny lookup helper and use it wherever a collectible name is shown (§4d references `displayName`):

```js
// storage.js — resolve current (Hebrew) name from backgrounds by emoji,
// falling back to whatever was stored.
function displayNameFor(item) {
    const bg = backgrounds.find(b => b.emoji === item.emoji);
    return (bg && bg.name) || item.name;
}
```
Use `displayNameFor(item)` in `updateCollectiblesPane`, `viewCollection`, and the delete confirm. This keeps `localStorage` keys/values unchanged (no data loss) while always rendering Hebrew. The 👹 boss collectible (added in `boss.js`) has no `backgrounds` entry — it will fall back to its stored name, so set that stored name to Hebrew too (e.g. `'בוס'`) where `boss.js` pushes it.

---

## 6. Files touched (summary)
- **`index.html`** — `dir`/`lang` attribute; ~35 static strings; font stack in inline test-panel styles.
- **`styles.css`** — LTR-arena guard block (A2); `text-align` logical fix (A3); global font-stack replace (C2); optional physical-position polish (A4).
- **`game.js`** — ~30 dynamic strings; completion sentence restructure; two math-question `innerHTML` wraps (C1).
- **`boss.js`** — 7 strings; boss collectible stored name → Hebrew.
- **`storage.js`** — ~6 strings; `displayNameFor` helper + 3 call sites.
- **`config.js`** — `rarityLabels`, `WEAPONS`, `WHEEL_PRIZES`, `buildLevelConfig` templates, 119 collectible names.
- **`test-mode.js`** — 3 strings (optional).
- **`audio.js`** — none.

Bump the asset cache-busting version (`?v=2.5.0` → next) in `index.html`'s `<link>` and `<script>` tags, per the existing deploy convention.

---

## 7. Testing checklist
Open `index.html` (and `?test=true`). Verify on **desktop and a mobile viewport**:
- [ ] Page reads RTL; Hebrew text is right-aligned; header HUD/resources bar mirror sensibly.
- [ ] Home screen, level intro, START, Continue, Restart Journey — all Hebrew.
- [ ] **Reveal (animal) level:** question reads `כמה זה N + M?`; grid reveals correctly (arena still LTR); correct/wrong feedback in Hebrew; completion says `חשפתם את …`.
- [ ] **Treasure (maze) level:** maze layout unchanged (avatar starts left, chest right); tile feedback Hebrew; completion says `מצאתם את …`.
- [ ] **Boss level:** boss/avatar positions unchanged; danger warning, victory/defeat text Hebrew; weapon tooltips + weapon-discovery modal Hebrew.
- [ ] **Subtraction level** (if reachable): `15 - 3` renders left-to-right, not reversed.
- [ ] Wheel of Fortune: title, STOP, prize labels, result — Hebrew.
- [ ] Collection modal + pane: names & rarities in Hebrew, including a pre-existing/English-era item (via `displayNameFor`).
- [ ] Confirm dialogs (restart level, restart journey, delete collectible) in Hebrew.
- [ ] Hebrew glyphs render in the chosen font stack (no tofu/□); digits stay in the playful Latin face.
- [ ] No JavaScript console errors; localStorage collection persists across refresh.

---

## 8. Risks & mitigations
- **Arena breakage under RTL** → mitigated entirely by the A2 LTR guard; do **not** remove it. If a maze/boss ever looks mirrored, the guard selector is missing an element.
- **Bidi-reversed subtraction** → mitigated by C1 LTR span; verify on a subtraction level.
- **Missing Hebrew glyphs / ugly fallback** → system font stack (C2); optional self-hosted webfont if higher polish is wanted.
- **Mixed-language old collections** → `displayNameFor` (5f) resolves display to Hebrew without a data migration.
- **Untranslated leftovers** → after edits, grep the JS/HTML for stray `[A-Za-z]{4,}` inside quotes to catch missed strings (ignore code identifiers, CSS, and the LTR math span).
