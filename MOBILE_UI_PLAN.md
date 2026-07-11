# Mobile-Friendly UI Plan — Math Reveal

**Goal:** make the game fully playable and comfortable on a phone (portrait,
~360–430 px wide), without regressing the desktop experience.

**Scope:** almost entirely `styles.css`, plus a small `index.html` tweak and a
one-line JS/CSS change for the reveal grid. No game logic, no localStorage, no
file-load-order changes. Keep the zero-dependency, vanilla architecture.

**Strategy:** desktop layout stays exactly as-is. Everything mobile lives inside
a single breakpoint block appended to the end of `styles.css`:

```css
@media (max-width: 768px) { ... }
```

The viewport meta tag is already correct (`index.html:5`), so no change needed
there.

---

## Confirmed product decisions (from the user)

These are settled — implement them, don't re-ask:

1. **Hide the "Mistakes" counter** on mobile.
2. **Hide the big page title** (`<h1>Math Picture Reveal! ✨</h1>`) on mobile —
   the level badge already communicates location.
3. **Collapse Pause / Restart / Home into compact emoji-only icon buttons** in a
   single row (⏸️ / 🔄 / 🏠, no text labels).
4. **Keep the coins / wheel / free-solution resources bar**, just make it
   compact.
5. **Remove the end-of-level success/fail report** (`#reports-container`) on
   mobile.
6. **Stack order on gameplay screens: question + input on TOP, picture/arena
   BELOW.**

---

## Global changes (inside the mobile breakpoint)

| What | Current | Mobile |
|------|---------|--------|
| `body` padding | `2rem` (`styles.css:11`) | `0.5rem` — reclaim ~48 px of width |
| `.main-content` | `flex` row, `gap: 2rem` (`:44`) | `flex-direction: column`, `gap: 1rem`, `align-items: stretch` |
| `.game-area` | `min-width: 600px` (`:504`) | `min-width: 0; width: 100%` — this is the single most important fix; the 600 px floor is what forces horizontal overflow today |
| `.header` | `margin-bottom: 2rem` (`:297`) | `margin-bottom: 1rem` |
| `.container` | `max-width: 1400px` (`:38`) | `width: 100%` |

**Ordering trick for "question on top":** the DOM order in `index.html` is
`.game-area` (board/arena) *then* `.question-box`. Rather than move markup, put
`.main-content { flex-direction: column }` and give the question box
`order: -1` (or `.game-area { order: 2 }`) inside the media query. That keeps
desktop untouched and flips the stack on mobile only.

---

## Screen-by-screen

### 1. Home screen (`#home-screen`) & Level intro (`#level-intro`)
Shared `.level-intro` / `.level-intro-content` modal (`styles.css:172`, `:195`).

- `.level-intro-content`: `padding: 3rem` → `1.5rem`; add `max-width: 90vw` and
  `width: 90vw`.
- `.level-intro h1`: `4rem` → `2.5rem` (`:210`).
- `.level-intro p`: `1.5rem` → `1.15rem` (`:251`).
- `.start-level-button`: `font-size 2rem / padding 1rem 3rem` → `1.4rem /
  0.85rem 2rem` (`:257`). Ensure min tap height ≥ 44 px.
- Boss intro emoji `8rem` and home `🧮✨` `6rem` → clamp to ~`4.5rem` so they
  don't dominate a short viewport.
- The two stacked home buttons (Continue / Restart) already stack via `<br>` —
  just add vertical `gap`/`margin` so they don't crowd.

### 2. Gameplay HUD / header (`.header`, `.progress-bar`)
`.progress-bar` (`styles.css:361`) is a `flex-wrap` row of pills. On mobile:

- **Hide** `h1.header title` → `display: none`.
- **Hide** `.mistakes` → `display: none` (`:402`).
- Keep `.progress` (cells discovered), `.collection-badge`, and
  `.resources-bar` but shrink: pill `font-size` ~`1.5rem`→`1rem`, `padding`
  `0.5rem 1.5rem`→`0.4rem 0.9rem`.
- `.resources-bar` (`:434`): reduce gaps/padding; keep coins + 🎡 + 💡.
- **Pause / Restart / Home → icon-only.** In the media query, hide the text by
  giving each button a fixed square size and relying on the leading emoji.
  Cleanest approach for Sonnet: wrap the three buttons' text in a
  `<span class="btn-label">` in `index.html` (lines 129–131) and
  `display:none` that span on mobile, leaving the emoji. Buttons become
  ~`44×44px` circles. (Alternative with zero HTML change: set
  `font-size:0` on the button and `font-size:1.3rem` on nothing won't keep the
  emoji — so the `<span>` wrap is the robust path.)
- Let the badge + trimmed pills + icon row wrap to at most ~2 tidy rows.

### 3. Animal-reveal screen (Type A) — the 8×8 picture grid
This needs the one **structural** change: the grid is fixed-pixel today.

- `.game-board` (`styles.css:507`): `500px × 500px` → `width: min(90vw, 500px)`
  and `height: min(90vw, 500px)` (keep it square). Use `aspect-ratio: 1 / 1`
  for robustness.
- `.emoji` (`:551`): `font-size: 400px; line-height: 500px` are fixed. Change to
  `font-size: 80%` won't work for emoji; instead use
  `font-size: min(72vw, 400px); line-height: 1` and center via the existing
  flex on `.background`. Verify the emoji still fills the board.
- **Grid cells must stop being 62.5 px.** `.grid-row` (`:567`) and `.grid-cell`
  (`:572`) hard-code `62.5px`. Replace with fluid sizing so 8 cells always span
  the board:
  - `.grid-overlay` → make it a `display:flex; flex-direction:column`.
  - `.grid-row` → `flex: 1; height: auto` (or `height: 12.5%`).
  - `.grid-cell` → `flex: 1; width: auto; height: 100%` (or `width: 12.5%`).
  - This works on desktop too (12.5% of 500 = 62.5), so it can live in the base
    stylesheet rather than the media query — a clean, low-risk refactor.
  - The crack SVG (`game.js:105`, `width="62.5"`) is injected as cell content
    scaled to 100%; confirm it still stretches. If it's a background-size issue,
    set the SVG to `width:100%;height:100%`.

### 4. Treasure / pathfinding screen (Type D)
`.pathfinding-arena` (`styles.css:1369`) is `max-width:600px` but a fixed
`height:600px`; its grid is already `%`-based and the avatar/chest are
recomputed from `getBoundingClientRect` (`game.js:270`, `:293`) — **so it scales
for free once the container is square-fluid.**

- `.pathfinding-arena`: `height: 600px` → `height: auto; aspect-ratio: 1 / 1;
  width: 100%; max-width: 600px`.
- Reduce tile `font-size` (`:1401`, `1.5rem`) and avatar/chest `40px`
  (`:1434`, `:1444`) slightly on the smallest widths so glyphs fit ~34 px tiles.
- After resize the avatar/chest are repositioned on the next `updateAvatar/
  ChestPosition` call; confirm they also reposition on `window.resize`
  (add a lightweight resize handler if they don't — otherwise a rotate leaves
  them offset). **Flag for testing.**

### 5. Boss battle screen (Type C) — the hardest, but mostly free
`.boss-arena` is `800×400 px` fixed (`styles.css:1243`) — the main overflow.
All internals already use `%` (`boss.js` sets `left: N%` everywhere), so a fluid
arena Just Works for positioning; only fixed px sizes/fonts need attention.

- `.boss-arena`: `width: 800px; height: 400px` → `width: 100%; max-width:
  800px; aspect-ratio: 2 / 1; height: auto`.
- `.boss-progress-bar` (`:1316`) `width: 600px` and `.boss-danger-zone`
  (`:1341`) `width: 600px` → `width: 90%` (they're already centered with
  `left:50%; translateX(-50%)`).
- Shrink emoji fonts on mobile: `.boss-avatar` `80px`→~`44px` (`:1264`),
  `.boss-character` `120px`→~`60px` (`:1274`), `.boss-prison` `100px`→~`54px`
  (`:1283`). Consider scaling these with `vw` (e.g. `clamp(40px, 12vw, 80px)`).
- `.weapons-container` (`:1547`) is `position:absolute; top:100px; left:20px`
  with `80px` circles — on a short arena these overlap the progress bar. On
  mobile: reduce `top`, shrink `.weapon-circle` to ~`54px` (`:1558`), tighten
  `gap`. Alternatively pull the weapons row *out* of the arena and render it as
  a compact strip directly below the arena on mobile (nicer thumb target). Lead
  with the in-arena shrink; note the "move below" option as a fallback if it
  still feels cramped. **Flag for a design check on a real device.**
- The `@keyframes throwBall` uses fixed `bottom: 140px/200px` (`:1299`) tuned
  for the 400 px arena; on a shorter arena the bomb arc may clip. Low priority
  (cosmetic) — note it, don't block on it.

### 6. Completion screen (`.completion`)
- `.completion` (`styles.css:918`): `width: 500px` → `width: 100%; max-width:
  500px`; `padding: 2rem`→`1.25rem`.
- `.completion h2` `2.5rem`→`1.8rem`; `.new-collectible` `5rem`→`4rem`.
- **Hide `#reports-container`** on mobile per decision #5:
  `#reports-container { display: none }`. (Leaves the JS untouched — it just
  isn't shown.)

### 7. Modals — Wheel / Weapon discovery / Collection
- `.wheel-modal-content` (`:1651`) & `.weapon-discovery-content` (`:1493`):
  `padding: 3rem` → `1.5rem`; add `max-width: 90vw`; reduce big emoji
  (`.wheel-reel-emoji` `5rem`, `.weapon-discovery-emoji` `8rem`) to ~`4rem`.
- `.collection-content` (`:1099`): already `max-width:800px; max-height:80vh` —
  add `width: 92vw; padding: 1.25rem`.
- `.collection-grid` (`:1135`) `minmax(100px,1fr)` → `minmax(72px,1fr)` so more
  fit per row; `.collection-item` `font-size:3rem`→`2.2rem`.
- Collection/weapon **tooltips are hover-based** (`:1169`) — no hover on touch.
  Non-blocking (names are nice-to-have), but note that delete `×` buttons in the
  collection also reveal on hover (`:1192`); test-mode delete is desktop-only, so
  acceptable to leave.

### 8. Test panel (`.test-panel`) & version badge
- `.test-panel` (`:1196`) is `position:fixed; top/left:1rem`. It's `?test=true`
  only and overlaps gameplay on a phone. Low priority: cap its width
  (`max-width:90vw`), make it scrollable (`max-height:90vh; overflow:auto`), or
  simply leave it — it's a dev tool. Recommend: quick `max-width/overflow` guard.
- `.version-info` (`:1229`) fixed bottom-right — shrink font, harmless.

---

## Touch & input polish (small but high-value for a 9-year-old)

- Every tappable control ≥ **44×44 px** (Apple/Google min target). Audit
  `.check-button`, icon HUD buttons, weapon circles, resource buttons.
- `.answer-input` (`:785`) is `type="number"` — good, triggers the numeric
  keypad. Keep `font-size ≥ 16px` (it's `2rem`, fine) to stop iOS auto-zoom on
  focus.
- Consider `inputmode="numeric"` on the input for a cleaner keypad (optional).
- When the soft keyboard opens, the "question on top" order keeps the input and
  Check button reachable — verify the Check button isn't hidden under the
  keyboard; if it is, that's the payoff of the chosen stack order.
- Add `-webkit-tap-highlight-color: transparent` and ensure `:active` states
  give feedback since `:hover` won't fire on touch.

---

## Suggested implementation order (for Sonnet)

1. **Foundation:** add the `@media (max-width:768px)` block; set `body`,
   `.container`, `.main-content` (column + stack order), `.game-area` min-width
   fix. → verify no horizontal scroll on any screen.
2. **Reveal grid refactor** (percentage cells) + fluid `.game-board`/`.emoji`.
   → verify Type A level reveals correctly and stays square.
3. **HUD trim:** hide title + mistakes, shrink pills, icon-ify Pause/Restart/
   Home (add `<span class="btn-label">` wrap in `index.html`).
4. **Pathfinding** arena aspect-ratio fix + resize reposition check.
5. **Boss arena** fluid width/aspect + emoji/weapon shrink.
6. **Completion** (hide report) + **modals** shrink.
7. **Touch polish** pass (tap sizes, active states).
8. Bump asset `?v=` query in `index.html` (currently `2.4.0`) so mobile users
   get the new CSS.

## Testing checklist (real device or DevTools device mode)

- [ ] iPhone SE (375 px) and a ~360 px Android: **no horizontal scrolling** on
      any screen.
- [ ] Type A reveal grid aligns to the picture, cells reveal correctly.
- [ ] Type D maze is square, tiles tappable, avatar/chest positioned right —
      including after a rotate/resize.
- [ ] Boss arena fits, boss/avatar/weapons visible and usable; weapons don't
      overlap the progress bar.
- [ ] Question + input sit above the picture; Check button reachable with
      keyboard open.
- [ ] HUD shows badge + cells + collection + resources + 3 icon buttons; no
      title, no mistakes counter; wraps to ≤ 2 tidy rows.
- [ ] Wheel, weapon-discovery, collection modals fit within 90vw.
- [ ] Completion screen fits; no success/fail report shown.
- [ ] Desktop (≥ 1200 px) unchanged, including the side collectibles pane.

## Risk notes

- **Grid refactor** is the only change touching layout math shared with desktop;
  keep it as percentage/flex so `12.5% × 500px = 62.5px` and desktop is
  pixel-identical.
- **Pathfinding/boss** rely on JS-computed or `%` positions — the main risk is a
  missing `window.resize` reposition for the maze avatar/chest; add one if
  absent.
- No localStorage keys, no file order, no dependencies change. Fully reversible.
