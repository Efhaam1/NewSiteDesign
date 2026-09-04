# ACT 4 — shell, primitives, drivers

## 0. Sheet order (settles every tie below)

`index.html:18-23` — tokens.css → base.css → acts.css → **product.css** → terms.css → **annot.css**. Equal-specificity ties go to the later file. Act 4's composition is almost entirely **product.css:7-133** and **annot.css:1-707**; acts.css contributes only the act's height (see §6).

Act 4 markup, `index.html:182-193`:
```html
<section class="act act-session" data-act="session" id="session" aria-labelledby="h-session">
  <div class="act-stage">
    <div class="pad session">
      <div class="session-head">
        <p class="kicker mono"><span class="dot"></span>One session, opened</p>
        <h2 class="display d3" id="h-session">This is what a coach is handed.</h2>
      </div>
      <div class="console" id="console"></div>
      <p class="coord mono">d8 &middot; session</p>
```
`.console` is filled by `console.js:37-94` with exactly three in-flow grid children — `.pane.pane-plan` (`console.js:110-112`), `.pane.pane-board` (`:153-156`), `.pane.pane-ctl` (`:170-172`) — plus two out-of-flow siblings, `.prep` (`:359`, `position:absolute` annot.css:177) and `.sr` (`:45-46`).

---

## 1. SHELL: `.act`, `.act-stage`, `.pad`, `.act-session`

**`.act`** — `base.css:69` `.act { position: relative; }`
**`.act + .act`** — `acts.css:425` `margin-top: -100vh;` (consecutive acts overlap by one viewport; this is why act N's `--h` and act N+1's `--e` are the same scroll window).

**`.act-stage`** — `base.css:70-84`:
```
position: sticky; top: 0; height: 100vh; overflow: clip;
display: grid; grid-template-columns: 1fr; grid-template-rows: minmax(0, 1fr);
contain: layout paint style;
```
`grid-template-rows: minmax(0,1fr)` is deliberate (base.css:77-81: an `auto` row grew past the stage and halved the console on short windows). `contain: layout` makes the stage the containing block for any `position:fixed` descendant.

**Live-gating** — `base.css:90-91`:
```
.act:not(.is-live) .act-stage { visibility: hidden; }
.act:not(.is-live) .act-stage * { animation-play-state: paused !important; }
```
`is-live` is toggled by `scroll.js:59-62` when `y` is within `innerHeight * 1.15` of the act.

**`.pad`** — `acts.css:8-15`:
```
position: relative; width: 100%; height: 100%;
padding: clamp(84px, 9vh, 132px) var(--gut) clamp(28px, 5vh, 64px);
display: grid; align-content: start;
```
No `grid-template-columns` (one implicit column). No `overflow` — clipping is `.act-stage`'s. `--gut` = `clamp(20px, 4.4vw, 92px)` (tokens.css:47), → `clamp(16px, 5vw, 30px)` at ≤900px (product.css:381).

`.pad` media overrides — three, one of which is dead:
- `product.css:396` `@media (max-width: 900px)` → `padding: clamp(62px, 10vh, 88px) var(--gut) clamp(18px, 3vh, 30px);`
- `acts.css:402` `@media (max-height: 820px) and (min-width: 901px)` → `padding-top: clamp(64px, 8vh, 100px); padding-bottom: clamp(16px, 2.6vh, 40px);` — **fully shadowed**: same selector, same specificity, same media condition, and product.css loads later.
- `product.css:575` same tier → `padding-top: clamp(64px, 9vh, 92px); padding-bottom: clamp(14px, 2.4vh, 26px);` — **this is the live 820-tier padding.**
- `base.css:136` `body.gl-failed .pad { min-height: 0; padding-block: clamp(48px, 8vh, 96px); }`

**`.session` (act 4's own `.pad` variant)** — `product.css:8-26`:
```
grid-template-rows: auto minmax(0, 1fr);   /* head, then everything left */
align-content: stretch;                     /* overrides .pad's align-content: start */
```
`.session-head` — `product.css:27` `max-width: 30ch; opacity: calc(var(--in2) * (1 - var(--out)));`
`.console` — `product.css:28-40`: `position: relative; margin-top: clamp(14px, 2vh, 26px); display: grid; grid-template-columns: minmax(0,1.02fr) minmax(0,1.28fr) minmax(0,1fr); gap: 1px; background: var(--line); border: 1px solid var(--line-2); opacity: calc(var(--in2) * (1 - var(--out))); transform: perspective(2200px) rotateX(calc((1 - var(--in)) * 22deg)) translateY(calc((1 - var(--in)) * 8vh)) scale(calc(0.94 + var(--in) * 0.06))); transform-origin: 50% 0%; min-height: 0;` (the 1px gap over a line-coloured ground is what draws the hairlines between panes).

**Height / pin — `.act-session`:**
- `acts.css:444` `.act-session { height: 540vh; }`
- `acts.css:454` inside `@media (max-width: 900px)` (`:449`) → `.act-session { height: 460vh; }`
- `base.css:134` `body.gl-failed .act { height: auto !important; }`; `base.css:135` un-sticks the stage.

Pin length = `offsetHeight - innerHeight` (`scroll.js:37`) = **440vh desktop / 360vh at ≤900px**. At 1440x900 that is 3960px of pin, and one `--t` step (1/120, `scroll.js:82`) is 33px.

Other act-4 shell rules: `annot.css:39` `.act-session .coord { pointer-events: none; }`; `annot.css:482` `.act-session .session-head .d3 { font-size: min(clamp(2rem, 4.6vw, 4.6rem), 8vh); }` inside `@media (min-width: 901px) and (min-height: 821px) and (max-height: 920px)` (`:481`); `annot.css:505-510, 527` re-cut `.session .console` at ≤900px to one column, `grid-template-rows: auto minmax(0,1fr) auto`, `height: auto; margin-bottom: clamp(16px, 2.6vh, 28px)`; `annot.css:561` `.session .console { grid-template-rows: minmax(0, 1fr) auto; }` at ≤600px.

---

## 2. Shared layout / type primitives

**`.kicker`** — `acts.css:17-21`: `display: flex; align-items: center; gap: 0.7em; color: var(--fg-faint); margin: 0 0 clamp(18px, 2.6vh, 34px);`
Colour is re-declared at `product.css:224-225` (`.mono, .coord, .kicker, … { color: var(--fg-faint) }`) — same value, later sheet, so a single-class `color` in acts.css would lose. Act 4's is `class="kicker mono"`, so it also takes `.mono`. Overrides: `acts.css:176-179` (`.hero`), `:180`, `:181`, `:356` (`.promo`), `:723` + `:1499` (`.chaos-head`), `product.css:147` (`.system-head`), `product.css:405-406` (`.hero`, ≤900px), `terms.css:25`. **No `.kicker` override in the 820 tier and none scoped to `.session`.**

**`.kicker .dot`** — `acts.css:22-26`: `width: 6px; height: 6px; background: var(--hue); border-radius: 0; box-shadow: 0 0 14px var(--hue); transform: rotate(45deg);` (a filled diamond). Only override: `acts.css:181` `.hero .kicker .dot { width: 7px; height: 7px; }`.

**`.lead`** — `base.css:114-121`: `font-size: clamp(1.02rem, 1.34vw, 1.32rem); line-height: 1.5; color: var(--on-dark-dim); max-width: 34ch; margin: 0; text-wrap: pretty;`
`product.css:223` recolours it to `var(--fg-dim)` (later sheet wins; `--on-dark-dim` does not ramp, `--fg-dim` does). Global override: `product.css:397` (≤900px) `font-size: 0.95rem; max-width: none;`. Everything else is per-act (`acts.css:405` spine/820; `product.css:583-584` chaos/820; `product.css:640-641`, `:781` hero; `terms.css:27/192/213/302/312/377/404`). **Act 4 has no `.lead` in its markup and no `.session .lead` rule anywhere.**

**`.display`** — `base.css:94-102`: `font-family: var(--display); font-variation-settings: "SOFT" 0, "WONK" 0, "opsz" 144; font-weight: 300; letter-spacing: -0.028em; line-height: 0.86; text-wrap: balance; margin: 0;` (`--display` = `"Fraunces", "Playfair Display", Georgia, serif`, tokens.css:50). **No media overrides at all.**

**`.d1`** `base.css:103` `clamp(3.2rem, 11.2vw, 12.4rem)` → `product.css:393` ≤900px `clamp(2.5rem, 12.4vw, 4.4rem)` → `product.css:576` 820 tier `clamp(2.6rem, 7.6vw, 7rem)`. Per-act: `acts.css:183` `.hero .d1 { max-width: 15ch; font-size: min(clamp(3rem, 9.9vw, 11rem), 17vh) }`, `acts.css:357` `.promo .d1 { max-width: 14ch; font-size: clamp(3rem, 8.4vw, 8.6rem) }`, `product.css:407`, `product.css:634`.

**`.d2`** `base.css:104` `clamp(2.6rem, 7.6vw, 8.2rem)` → `product.css:394` ≤900px `clamp(1.9rem, 9vw, 3.2rem)` → `product.css:577` 820 tier `clamp(2rem, 5.4vw, 5rem)`. Per-act: `acts.css:254`, `acts.css:403`, `acts.css:724`, `product.css:428`, `product.css:581`.

**`.d3`** — **act 4's headline class.** `base.css:105` `font-size: clamp(2rem, 4.6vw, 4.6rem); letter-spacing: -0.02em; line-height: 0.94;`
Full cascade for `.session-head .d3`, by window:
- width ≥901, height >920: base `clamp(2rem, 4.6vw, 4.6rem)`
- `product.css:395` `@media (max-width: 900px)` → `clamp(1.45rem, 6.6vw, 2.3rem)`
- `annot.css:482` `@media (min-width: 901px) and (min-height: 821px) and (max-height: 920px)` → `min(clamp(2rem, 4.6vw, 4.6rem), 8vh)` — specificity (0,3,0), beats everything
- `product.css:578` `@media (max-height: 820px) and (min-width: 901px)` → `clamp(1.3rem, 2.4vw, 2.1rem)`
Other `.d3` scopes (not act 4): `acts.css:289` `.stages-head` `clamp(1.6rem, 3.1vw, 3.05rem)`, `product.css:148` `.system-head` `clamp(1.5rem, 3vw, 2.8rem)`, `terms.css:26/214/303/311`.

**`.d4` does not exist** — zero matches for `.d4` in any of the six sheets.

**`.mono`** — `base.css:107-113`: `font-family: var(--mono); font-size: 0.66rem; letter-spacing: 0.19em; text-transform: uppercase; font-weight: 500;` (`--mono` = `"JetBrains Mono", ui-monospace, "SF Mono", Menlo, monospace`, tokens.css:52). **Colour comes from `product.css:224-225` → `var(--fg-faint)`, not from base.css, which sets none.** `acts.css:39` `.mono.tiny { color: var(--fg-dim); }` (0,2,0, deliberately — acts.css:33-38). `.tiny` = `font-size: 0.58rem` (`acts.css:32`). `annot.css:188` `.prep .mono { color: var(--on-light-dim); }`. `terms.css:352` scoped size override.

**`.num`** — `base.css:122`: `font-family: var(--mono); font-variant-numeric: tabular-nums; font-feature-settings: "tnum";` No colour, no size, no media overrides. Used in act 4 at `console.js:140` (`${m}m` in the flow rows) and `:206` (`.clk num`).

**`.coord`** — `acts.css:27-31`: `position: absolute; right: var(--gut); bottom: clamp(20px, 3.4vh, 40px); color: var(--fg-faint); opacity: calc(0.72 * var(--in2) * (1 - var(--out))); margin: 0; letter-spacing: 0.26em;` (out of flow, so it takes no `.session` grid row). Overrides: `product.css:224` colour; `product.css:463` (≤900px) `.stages-coord, .coord { font-size: 0.5rem }`; **`product.css:644` (820 tier) `.coord { display: none }`**; `acts.css:1464` `.chaos .coord { display: none }`; `acts.css:346` `.stages-coord { bottom: clamp(20px, 3.4vh, 40px) }`; `annot.css:39` act-4 `pointer-events: none`.

**`.cta`** — declared in three places, all live:
- `acts.css:103-110`: `display: inline-flex; align-items: center; gap: 0.6em; padding: 0.86em 1.35em; font-size: 0.9rem; font-weight: 500; letter-spacing: -0.005em;` + a five-property transition. `acts.css:111` `:hover { transform: translateY(-2px); border-color: var(--hue); }`
- `product.css:228`: `background: var(--fg); color: var(--fg-inv); border: 1px solid var(--fg);`
- `product.css:266-290` (the "milled plate"): pointer-tracked `radial-gradient(150% 210% at var(--mx,50%) var(--my,-28%), …)` face plus four zero-blur inset hairlines as a bevel; `transition-property: transform, background-color, color, border-color, box-shadow, background-image`. Hover `:292-303`, active `:306-314`, ghost `:321-333`/`:334-346`, focus `:349` `border-color: var(--hue)`.
- Variants: `.cta.ghost` `acts.css:112-120` (`background-color: transparent; border-color: var(--line-2); padding: 0.6em 1em; font-size: 0.8rem`), `.cta-sm` `acts.css:122` (same metric), `.cta-row` `acts.css:123`. Media: `product.css:412-414` (≤900px `padding: 0.78em 1.1em; font-size: 0.86rem`), `product.css:815-816` (reduced motion), `terms.css:355/359`.
- **Act 4 uses no `.cta`.** Its buttons are `.ic-b` (annot.css:116-127) and `.prep-x` (annot.css:191-197).

**`.sr`** — `base.css:127-130`: `position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap;` Act 4 uses it for its live region (`console.js:45-48`, `role="status"`, appended last on purpose per `:42-44`).

**`.acc`** — not a shared primitive. One rule: `product.css:59` `.cs-chain li.acc { color: var(--hue); border-color: var(--hue); }`, applied to the first chain chip at `console.js:119`.

---

## 3. `scroll.js`: how `--t`, `--e`, `--h` are computed (and where `--in/--in2/--out` come from)

Measurement (`scroll.js:32-39`, re-run on resize `:21` and orientationchange `:22`):
```
this.height = Math.max(1, document.documentElement.scrollHeight - innerHeight)   // :33
a.top = r.top + scrollY                                                          // :36
a.len = Math.max(1, a.el.offsetHeight - innerHeight)                             // :37
```

Per frame (`scroll.js:41-93`):
```
raw = clamp(scrollY / height)                                    // :45
rate = reduced ? 1 : 0.16                                        // :46
p = approach(p, raw, rate, dt)                                   // :48
y = p * height                                                   // :56  ← damped px position
a.t = clamp(inv(a.top, a.top + a.len, y))                        // :58
a.e = clamp(inv(a.top - innerHeight, a.top, y))                  // :75
a.h = clamp(inv(a.top + a.len - innerHeight, a.top + a.len, y))  // :76
```
with `inv(a,b,v) = clamp((v-a)/(b-a))` (`util.js:3`) and `approach(cur,target,rate,dt) = cur + (target-cur)*(1 - (1-rate)^(dt*60))` (`util.js:11-12`). All three are already clamped to [0,1].

Written on the `<section class="act …">` element, quantised to 1/120, only on change:
```
qt = Math.round(a.t * 120) / 120  → style.setProperty('--t', qt.toFixed(4))   // :82,85
qe … '--e'  // :83,86     qh … '--h'  // :84,87
```
Only while the act is live (`on`, `:59`, `:64`). A never-visited act inherits `:root`'s `--t: 0; --e: 1; --h: 0` (tokens.css:80-82).

**What each is**
- **`t = 0`** — `y == a.top`: the act's top edge reaches the top of the viewport; the sticky stage pins.
- **`t = 1`** — `y == a.top + a.len` = `a.top + offsetHeight - innerHeight`: the act's bottom edge reaches the bottom of the viewport; the stage unpins. `t` spans the *whole pin*, `offsetHeight - 100vh`. **Act 4: 440vh desktop, 360vh at ≤900px.**
- **`e`** — the one viewport *before* the pin. `e = 0` when the act's top edge is at the bottom of the viewport, `e = 1` at the pin. **`e` is pinned at 1 for the entire pin** — anything keyed to `e` has finished before `t` starts moving.
- **`h`** — the *last viewport of the pin*. `h = 0` at `t = (len - innerHeight)/len`, `h = 1` at `t = 1`. **Act 4: `h` opens at t = 340/440 = 0.77273 desktop, 260/360 = 0.72222 at ≤900px**, spanning 0.22727 / 0.27778 of `t`. Because of `acts.css:425`, act 4's `h` window is byte-identically act 5's `e` window.
- No `x` is written despite the comment at `scroll.js:72`. `has-entered` is added once, on the first live frame (`:88`).

**`--in`, `--in2`, `--out` are not written by JS.** Defaults are `:root`'s `--in: 1; --in2: 1; --out: 0` (tokens.css:83-85); each act redeclares them as `clamp()`s on its own drivers. Act 4's set, `product.css:18-25`:
```
--out: clamp(0, calc((var(--h) - 0.3) / 0.4), 1);   /* :18  DEAD — redeclared at :25 */
--in:  clamp(0, calc((var(--e) - 0.46) / 0.46), 1); /* :19  0 at e<=0.46, 1 at e=0.92 */
--in2: clamp(0, calc((var(--e) - 0.2)  / 0.42), 1); /* :20  1 at e=0.62 */
--k1:  clamp(0, calc((var(--e) - 0.5)  / 0.4),  1); /* :21  1 at e=0.90 */
--k2:  clamp(0, calc((var(--e) - 0.68) / 0.4),  1); /* :22  MAX 0.8 — see below */
--k3:  clamp(0, calc((var(--t) - 0.26) / 0.14), 1); /* :23  0 -> 1 over t 0.26-0.40 */
--k4:  clamp(0, calc((var(--t) - 0.1)  / 0.16), 1); /* :24  0 -> 1 over t 0.10-0.26 */
--out: clamp(0, calc(var(--h) / 0.42), 1);          /* :25  WINS */
```
Two consequences that fall straight out of the arithmetic:
- **`--out` is `h/0.42`, not the delayed `(h-0.3)/0.4` the comment at product.css:14-17 describes.** The "cover, not a dissolve" behaviour is not in force: the console starts fading the instant `h` leaves 0 (t = 0.7727) and is fully gone at h = 0.42 → **t = 0.86818** desktop, **0.83889** at ≤900px.
- **`--k2` can never exceed 0.8**, because `e` caps at 1 and `(1 - 0.68)/0.4 = 0.8`. Everything bound to it renders at 80%: `.board2d { opacity: var(--k2); transform: scale(calc(0.96 + var(--k2) * 0.04)) }` → opacity 0.8, scale 0.992 (product.css:95); `.flow .track i { width: calc(var(--w) * var(--k2) * 1%) }` → 80% of the intended fill (product.css:68); `.prompt { opacity: var(--k2) }` (product.css:116).

annot.css layers four more on the same drivers, declared on `.session .console` (`annot.css:26-34`):
```
--a1..--a4: clamp(0, (t - 0.28|0.38|0.48|0.58) / 0.09, 1)
--z4..--z1: clamp(0, (h - 0|0.05|0.10|0.15) / 0.1, 1)
```
In `t` (desktop): callouts arrive over 0.28→0.37, 0.38→0.47, 0.48→0.57, 0.58→0.67; they retract last-in-first-out over t 0.7727→0.8295 — entirely before `--out` closes.

---

## 4. `director.js` at act 4 (`'session'`, index 4)

`ACTS` — `director.js:31` `['threshold','chaos','spine','stages','session','system','terms','promotion']`.

**`n` (narrative position)** — `director.js:104-113`:
```
const y = engine.p * engine.height;
for (i…) if (y >= a.top) n = i + clamp((y - a.top) / a.len);
```
Same `y` and `a.len` as `a.t`, so **`n = 4 + t` for act 4; n ∈ [4, 5]**. Because acts overlap by 100vh, `n` reaches 4.0 at the instant act 4's `t` reaches 0.

**`--hue` — KNIGHT, and it is a hard cut at t = 0.25.**
```
director.js:33  const HUES = [0x3fa57a, 0x4a8bd0, 0x9070ce, 0xd2604b, 0xc9a227];
director.js:34  const HUE_CSS = ['#3fa57a', '#4a8bd0', '#9070ce', '#d2604b', '#c9a227'];
director.js:162 const gate = clamp((n - 3.0) / 1.0) * 5;
director.js:163 const idx = clamp(Math.floor(gate), 0, 4);
director.js:173 const sessionAct = band(n, 4.1, 4.4) * (1 - band(n, 4.95, 5.2));
director.js:174 this._target.setHex(sessionAct > 0.5 ? HUES[1] : HUES[idx]);
director.js:280 const hueIdx = sessionAct > 0.5 ? 1 : idx;
director.js:285-290
  if (hueIdx !== c.hue) {
    c.hue = hueIdx;
    this.root.style.setProperty('--hue', HUE_CSS[hueIdx]);
    this.root.style.setProperty('--hue-soft', HUE_SOFT[hueIdx]);
  }
```
- `clamp((n-3)/1)` saturates at 1 for all n ≥ 4, so `gate = 5` and **`idx = 4` (queen) for the whole of act 4**; `idx` last changed at n = 3.8, so no `onStage` callback (`:166-169`) fires inside act 4.
- `band(v,a,b) = smooth(inv(a,b,v))` with `smooth(t)=t²(3-2t)` (`util.js:15`, `:4`), and `smooth(0.5)=0.5`, so `sessionAct` crosses 0.5 at exactly **n = 4.25**.
- Therefore **t ∈ [0, 0.25) → `--hue: #c9a227` (QUEEN gold), `--hue-soft: rgb(201 162 39 / 0.15)`; t ∈ [0.25, 1] → `--hue: #4a8bd0` (KNIGHT blue), `--hue-soft: rgb(74 139 208 / 0.15)`** (HUE_SOFT, `director.js:35-38`). The falling term only reaches 0.5 at n = 5.075, inside act 5, so knight holds to the end of act 4's pin. Corroborated at `main.js:130`: `updateReadout(n, aSession?.active ? 'knight stage' : …)`.
- **`--hue` is never BISHOP `#9070ce` in act 4.** `HUE_CSS[2]` requires `idx === 2`, i.e. `gate ∈ [2,3)` → `n ∈ [3.4, 3.6)` — inside act 3, unreachable for n ≥ 3.8.
- The CSS token is a **discrete switch** (written only on index change). The GL colour is separately eased — `director.js:175` `this.hue.lerp(this._target, 1 - Math.pow(1 - 0.09, dt * 60))`, fed to `spine.hue`, `board.hueColor`, `world.hue.color`, `world.fHue.color` (`:176-179`) — so the room crossfades while the page cuts.

**`--lift` is not written to CSS.** `director.js:308-310`: *"--narr and --lift used to be written here too. Nothing consumed them"*. `tokens.css:76 --lift: 0` is inert. What reaches CSS instead:
```
director.js:242 const lift = band(n, 4.62, 5.06) * (1 - band(n, 6.86, 6.99));
director.js:291 const qLift = Math.round(lift * 12) / 12;
director.js:292-299
  if (qLift !== c.lift) {
    c.lift = qLift;
    document.body.classList.toggle('is-paper', qLift > 0.5);
    for (const [name, a, b] of RAMPS) this.root.style.setProperty(name, mixCss(a, b, qLift));
  }
```
`RAMPS` (`director.js:13-21`) = **`--fg`, `--fg-dim`, `--fg-faint`, `--fg-inv`, `--line`, `--line-2`, `--glass`**. Inside act 4 the second factor is 1, so `lift = smooth(clamp((n - 4.62)/0.44))`:
- lift starts at **t = 0.62**; first non-zero `qLift` (1/12) at lift ≥ 0.04167 → **t ≈ 0.673**
- `body.is-paper` flips on at `qLift > 0.5`, i.e. lift ≥ 0.5417 → **t ≈ 0.852** (this swaps `#nav::before` to the ivory gradient, acts.css:47-49)
- at t = 1, lift = 0.9493 → `qLift = 11/12 = 0.9167`, giving `--fg ≈ rgb(39 38 45)` and **`--glass ≈ rgb(233 231 227 / 0.958)`**
So **the console's three `.pane` plates (product.css:41, product.css:226) travel from near-black glass to near-white paper across t 0.67 → 1.0, inside act 4's own pin**, and `--line`/`--line-2` invert with them.

**Scrim (it moves mid-act)** — `director.js:281-284`, applied `:306` `this.world.setScrim(scrim, lift)`:
```
scrim = 1 - 0.18*window_(n,1.06,1.44,1.84,2.0)
          - 0.22*window_(n,2.9,3.2,3.9,4.2)
          - 0.12*window_(n,7.55,7.8,7.95,8.0);
```
Only the middle term is live at the start of act 4: at n = 4.0 it is 0.7407, so **scrim = 0.8370 at t = 0, rising to exactly 1.0 at n = 4.2 (t = 0.20) and holding 1.0 for the rest of the act.** The wash gets *stronger* over act 4's first fifth. There is no CSS scrim: base.css:40-42 records that the wash and grain live in the GL pass, and `#scrim`/`#grain` are `display: none` unless `body.gl-failed`. `tokens.css:54 --scrim: 1` is never written.

**Everything else the director does across n 4.0–5.0**

| n (= 4 + t) | code | effect |
|---|---|---|
| 4.14 → 4.62 (t 0.14→0.62) | `:237-238` `open = window_(n, 4.14, 4.62, 5.06, 5.34)`; `board.focus = {f: FOCUS.f, r: FOCUS.r, amount: open}` | the **d8** square (`FOCUS = { f: SPINE_FILE, r: 8 }` `:41`; `SPINE_FILE = 3` board.js:9) lifts out of the board, then holds |
| 4.55 → 4.95 (t 0.55→0.95) | `:153` `spine.visible = band(n,1.94,2.2) * (1 - band(n,4.55,4.95))` | the lit d-file goes out; `:256-262` rank glows and `:211` the hue lamp are both scaled by it |
| constant | `:155-158` | `spine.fill = 0.97` for all of act 4 |
| < 4.62 | `:192-211` | graduation branch: `held = min(idx,3) = 3` → `ORDER[3] = 'rook'` (pieces.js:6), `enter = 1` (held ≠ idx), `morph = 0`, lamp intensity `9 * spine.visible`; piece at `spine.at(0.97).z` |
| ≥ 4.62 (t ≥ 0.62) | `:225-234` | else-branch: same rook, re-placed at `rankZ(8)`, `setReveal(…,1,1)`, lamp intensity 6 |
| 4.2 → 4.6 (t 0.2→0.6) | `:302-305` | dust falls to 0 (`0.3 * window_(n,2.1,2.6,4.2,4.6)`), further scaled by `(1 - lift)` |
| 4.00 / 4.30 / 4.70 / 5.00 | `:66-69` | camera keys `pos(4.0,9.0,-10.0) look(-0.8,2.0,-30) fov 32` → `pos(-2,11.5,-15) look(-2,0.8,-27.6) fov 38` → `pos(-2,8.6,-18.4) look(-2,1.8,-28.2) fov 42` → `pos(-2,26,-10) look(-2,0,-15) fov 34`, eased by `rig.update(n, dt, 0.12)` (`:126`) |

The console's DOM is driven separately: `main.js:141` `if (aSession?.active) playPuzzle(aSession.t);` — act 4's `t`, not `n`, and only while `is-live`.

---

## 5. The shared `@media (max-height: 820px) and (min-width: 901px)` tier

**Three copies in the sheets index.html loads**, plus one near-miss that is not loaded:

1. **`acts.css:399-416`** — the "short windows" tier. `.pad` (**dead**, §1), `.spine .d2` `:403`, `.spine .col-left` `:404`, `.spine .lead` `:405`, `.levels`/`.levels li`/`.lv-name`/`.levels code`/`.levels-foot` `:406-410` (the `.levels-foot` line loses to `acts.css:557-585` on source order — recorded at acts.css:558-561), `.proof`/`.proof b` `:411-412`, `.foot` `:413`, `.promo-lead` `:414`, `.promo-cta` `:415`. **Nothing act-4.**
2. **`product.css:574-645`** — the big one, and the only copy that touches act 4:
 - `.pad { padding-top: clamp(64px, 9vh, 92px); padding-bottom: clamp(14px, 2.4vh, 26px) }` `:575` (live)
 - `.d1` `:576`, `.d2` `:577`, **`.d3 { font-size: clamp(1.3rem, 2.4vw, 2.1rem) }` `:578`** ← act 4's h2
 - **`.session-head, .system-head { margin-bottom: 2px }` `:579`**
 - **`.pane { gap: 6px; padding: 10px 12px }` `:596`**, **`.routine { padding: 7px 9px }` `:597`**, **`.notes { gap: 6px }` `:598`**
 - **`.coord { display: none }` `:644`** ← act 4's `d8 · session` label disappears
 - the rest is acts 0/1/3/5: `.chaos .d2` `:581`, `.chaos .lead-swap` `:582`, `.chaos .lead` 5-line clamp `:583-584`, `.cmp-*` `:585-591`, `.stages-head .stage-sub` `:592`, `.gates` `:593`, `.stage-panels` `:594`, `.sp-units, .sp-theme` `:595`, `.cell` `:599-600`, `.drill-foot` `:601`, the 4x3 bento re-lattice `:605-613`, `.c-ink, .flow.mini, .gate-names, .stack, .tracks` `:621`, `.tracks *` `:622-623`, `.cell .c-n`/`.c-b` `:624-626`, `.drill li` `:627`, `.ticker` `:628`, `.hero .d1` `:634`, `.hero .lead` `:640-641`, `.hero-foot` `:642`, `.hero-rule` `:643`.
3. **`acts.css:1528-1536`** — act 1 only: `.cv-mo`, `.cv-vd`, `.cv-cw`, `.cv-who`, `.cv-end`, `.cv-one { gap: 4px; padding: 9px 12px 8px }`, `.cv-title`.

Not this tier: `teach.css:398` is `@media (min-width: 1100px) and (max-height: 820px)` and **teach.css is not loaded by app/index.html** (index.html:18-23). Neighbouring height tiers that do fire on act 4: `annot.css:367` `(max-height: 920px) and (min-width: 901px)`, `annot.css:383` `(max-height: 660px) and (min-width: 901px)`, `annot.css:405` `(min-width: 1460px) and (max-height: 940px)`, `annot.css:466/470/481/493` (the 821–1070 band, which sets `.pane { padding: 11px; gap: 6px }` and `.pane-ctl { row-gap: 2px }`), `product.css:796` `(max-height: 640px) and (min-width: 901px)`, `acts.css:1514` `(max-height: 900px) and (min-width: 901px)` (act 1 only).

---

## 6. Every rule in **acts.css** that mentions `.session`, `.console` or act 4

Two live declarations, both act length:
- `acts.css:444` `.act-session { height: 540vh; }`
- `acts.css:454` `.act-session { height: 460vh; }` (inside `@media (max-width: 900px)`, `:449`)

Everything else is comment prose: `:291-292` (act 3's panels fading before the console arrives), `:493`, `:569`, `:611`, `:689`, `:830`, `:993`, `:997`, `:1009`, `:1013`, `:1037`, `:1102-1103`. Four of those are load-bearing cross-references: act 1 reuses act 4's **square colours** (`.cv-bd { --sq-l: #cfc3ac; --sq-d: #6f6152 }` acts.css:1000-1001, "act 4's own (product.css:97-98)"), act 4's **coordinate treatment** (`.cv-co { fill: rgb(20 18 14 / 0.5) }` acts.css:1012 = product.css:104-106), act 4's **piece inset/scale** (acts.css:1013-1015 = product.css:108), and act 4's **ink ring on from/to squares** (acts.css:1037 = product.css:101-103). `.cv-one` (acts.css:1101-1151) is explicitly a miniature of act 4's plan pane.

**There are no `.session`, `.console`, `.pane`, `.cs-*`, `.flow`, `.notes`, `.mv`, `.prompt` or `.solve` selectors in acts.css at all.** Act 4's inner composition lives in `product.css:7-133` (three panes, board, notes) and `annot.css:1-707` (the controls pane, the four callouts, the `.ic` control boxes, the prep sheet, and every desktop/tablet/phone tier for them).

---

## 7. Existing icon / glyph idioms

**Inline SVG — exactly one file draws any.** `grep createElementNS` over app/js returns only `compare.js:206-212` (`const NS = 'http://www.w3.org/2000/svg'; const sv = (parent, tag, at) => …`). Nothing in console.js, board2d.js, bento.js, stages.js, rate.js or chrome.js creates SVG.

- **The line-icon idiom** — `compare.js:314-320`:
```js
function avatar(parent) {
  const s = sv(parent, 'svg', { class: 'cv-av', viewBox: '0 0 24 24', 'aria-hidden': 'true' });
  sv(s, 'circle', { class: 'cv-ar-o', cx: 12, cy: 12, r: 11.4 });
  sv(s, 'circle', { class: 'cv-ai', cx: 12, cy: 9.4, r: 3.5 });
  sv(s, 'path',   { class: 'cv-ai', d: 'M4.9 20.6a7.6 7.6 0 0 1 14.2 0' });
}
```
 styled `acts.css:869-875`: `.cv-av { grid-row: 1 / 3; align-self: center; justify-self: start; width: 2.1em; height: 2.1em; display: block; overflow: visible }`, `.cv-ar-o { fill: none; stroke: var(--line-2); stroke-width: 1 }`, `.cv-ai { fill: none; stroke: var(--fg-dim); stroke-width: 1.4; stroke-linecap: round }`. This is the page's **only** outlined-glyph idiom: square viewBox, sized in `em` so it tracks the type, `fill: none`, stroke on a token, stroke-width 1 / 1.4, `stroke-linecap: round`, `aria-hidden="true"`, no asset fetch. Rationale at acts.css:864-868 and compare.js:309-313.
- **Board / chess arrows** — `compare.js:240-253` (`arrow()`), styled `acts.css:1045-1049` `.cv-sh, .cv-hd { fill: var(--rook); fill-opacity: 0.82; stroke: var(--ink); stroke-width: 0.05; paint-order: stroke }`, drawn on at `acts.css:1068-1069`. Board-space marks in a `0 0 8 8` user space, not a UI arrow.
- **Board** — `compare.js:272-307` → `<svg class="cv-bd" viewBox="0 0 8 8" role="img" aria-label=…>` with `<rect>` squares, `<image href="/assets/cburnett/…svg">` men (`.cv-pc`, opacity 0.92, acts.css:1015) and a `<g class="cv-co">` of `<text font-size="0.3">` coordinates.

**Mask-based mark (the only "logo" icon)** — `acts.css:76-82`:
```
.mark { width: 26px; height: 26px; display: block; background: var(--fg);
  -webkit-mask: url('/assets/monogram.png') center/contain no-repeat;
  mask-mode: luminance; }
```
Markup `<span class="mark" aria-hidden="true"></span>` (index.html:51, 242). Size variants `#nav .mark` acts.css:71-75 (36px, `mask-size: 124%`), `product.css:392` (30px on phone), `.cv-brand .mark` acts.css:1211-1216.

**Small outlined square / chip badge — the page's dominant badge idiom.** 1px border on a line or hue token, mono, uppercase, tight tracking, `em` padding, and **no border-radius anywhere except `.cv-ti`'s 2px**:

| selector | file:line | spec |
|---|---|---|
| `.cs-chain li` (act 4) | product.css:56-58 | mono / 0.48rem / 0.1em / uppercase, `var(--fg-faint)`, `border: 1px solid var(--line)`, `padding: 0.3em 0.44em` |
| `.cs-chain li.acc` | product.css:59 | `color` + `border-color: var(--hue)` |
| `.mv` (act 4) | product.css:112-114 | mono / 0.68rem / 0.08em, `border: 1px solid var(--line-2)`, `padding: 0.34em 0.55em`, `var(--fg-dim)`; `.mv.on` → hue border + hue text |
| `.ic-b` (act 4 buttons) | annot.css:116-127 | `background: transparent`, `border: 1px solid var(--line-2)`, mono 500 / 0.54rem / 0.12em / uppercase, `padding: 0.56em 0.7em`; `.ic-go` and `:hover` → hue border |
| `.sp-status` | acts.css:310-311 | mono / 0.52rem / 0.16em, `border: 1px solid var(--line-2)`, `padding: 0.28em 0.5em` |
| `.sp-units li` | acts.css:327-330 | mono / 0.5rem / 0.08em, `border: 1px solid var(--line)`, `padding: 0.3em 0.46em` |
| `.cv-ti` | acts.css:900-915 | mono 600 / 0.5rem / 0.1em, `color: var(--fg)`, `background: none`, `border: 1px solid var(--bishop)`, `padding: 0.2em 0.36em 0.16em`, `border-radius: 2px` — the outline is what carries AA (acts.css:904-911) |
| `#ladder .rungs li` | acts.css:133-139 | **11x11px square**, `border: 1px solid var(--line-2)`; `.on` → `background`+`border-color: var(--hue)` + `box-shadow: 0 0 12px var(--hue-soft)`; `.past` → `background: var(--line-2)` — the page's small square *status marker* |
| `.kicker .dot` | acts.css:22-26 | 6x6px, `background: var(--hue)`, `border-radius: 0`, `box-shadow: 0 0 14px var(--hue)`, `transform: rotate(45deg)` |
| `.prep-x` | annot.css:191-197 | paper-side version: `border: 1px solid rgb(20 20 28 / 0.3)`, mono 0.5rem / 0.14em, `padding: 0.42em 0.6em` |
| `.ic` (nested panel) | annot.css:99-103 | `border: 1px solid var(--line); border-left: 2px solid var(--hue)`; annot.css:97-98 states the rule — "a hairline box with a 2px accent edge, no radius, no shadow, no fill" |

**Hairline marks used where an icon would go** — the page substitutes 5x1px rules for bullets and 1px rules for pointers:
- `.notes li::before` product.css:128-129 `content: ''; position: absolute; left: 0; top: 0.58em; width: 5px; height: 1px; background: var(--hue);` — act 4's own bullet; `.notes .warn li::before` → `var(--rook)` (product.css:130)
- `.sol-l li::before` annot.css:159-160 (same, on `--rook`); `.prep-s li::before` annot.css:215-216 (same, on `rgb(20 20 28 / 0.5)`)
- `.an-r` + `.an-r::after` annot.css:84-91 — act 4's leader: `flex: 1 1 auto; min-width: 6px; height: 1px; background: var(--hue); transform-origin: 0 50%`, with a pseudo-element continuing it `width: var(--an-gap)` across the gutter onto the control's accent edge; drawn on by `scaleX(var(--a1..--a4))` (annot.css:69-72). Markup `console.js:454`: `el(h, 'i', 'an-r').setAttribute('aria-hidden', 'true')`
- `.hero-rule span:last-child::after` acts.css:235-238 — `width: 30px; height: 1px; background: linear-gradient(90deg, var(--hue), transparent)`
- 2px accent edge as a state marker: `.scrub` acts.css:264, `.stage-panel` acts.css:299, `.levels li.on` acts.css:527 (`box-shadow: inset 2px 0 0 var(--lc)`), `.cv-one::after` acts.css:1165-1170, `.ic` annot.css:102, `.gates li.on` product.css:459
- Progress rails, not gauges: `.scrub-bar i` acts.css:277-278, `.flow .track i` product.css:67-68, `.clk-bar i` annot.css:136-137 (`transform: scaleX(0)`; `.over i` → `var(--rook)`)

**Arrow glyphs** — only three, all HTML entities inside `.coord` text: `index.html:160` `d1 &rarr; d8`, `:176` `d2 &rarr; d8`, `:206` `a1 &rarr; h8`. **Act 4's own coord uses `&middot;`, not an arrow** (`index.html:190` `d8 &middot; session`). A unicode scan of every `.js`/`.css`/`.html` under `app/` (vendor excluded) for arrows, chevrons, checkmarks, crosses and geometric shapes returns **comment text only** (acts.css:603/607/610/613/1096, main.js:134/137/138, gl/debris.js:84). Act 4's five buttons are all words — `'Start segment'`, `'Reset'` (console.js:216-217), `'Copy FEN'` (`:318`), `'Open prep sheet'`/`'Hide prep sheet'` (`:345`, `:420`), `'Close'` (`:368`) — with no glyph on any of them.

## HARD CONSTRAINTS
- Act 4's stage is one viewport and clips: `.act-stage { position: sticky; top: 0; height: 100vh; overflow: clip; display: grid; grid-template-rows: minmax(0, 1fr); contain: layout paint style; }` — base.css:70-84. The `minmax(0,1fr)` row is not optional; base.css:77-81 records that an `auto` row is what halved the console on short windows.
- `.act-session { height: 540vh; }` acts.css:444 and `.act-session { height: 460vh; }` acts.css:454 (max-width: 900px). Pin length is `offsetHeight - innerHeight` (scroll.js:37) = 440vh / 360vh — every `--t` band below is a fraction of that, not of the act height.
- `.act + .act { margin-top: -100vh; }` acts.css:425. Act 4's `--h` window is byte-identically act 5's `--e` window; retiming one retimes the handover.
- `--out: clamp(0, calc(var(--h) / 0.42), 1);` product.css:25 — this WINS over `--out: clamp(0, calc((var(--h) - 0.3) / 0.4), 1);` at product.css:18 (same block, later declaration). The console begins fading at t = 0.77273 and is fully gone at t = 0.86818 desktop / 0.83889 at ≤900px. The 'cover, not a dissolve' behaviour described at product.css:14-17 is not in force.
- `--k2: clamp(0, calc((var(--e) - 0.68) / 0.4), 1);` product.css:22. `--e` caps at 1 (scroll.js:75), so `--k2` can never exceed 0.8. Anything bound to it renders at 80%: `.board2d { opacity: var(--k2) }` product.css:95, `.flow .track i { width: calc(var(--w) * var(--k2) * 1%) }` product.css:68, `.prompt { opacity: var(--k2) }` product.css:116.
- `--in: clamp(0, calc((var(--e) - 0.46) / 0.46), 1)` and `--in2: clamp(0, calc((var(--e) - 0.2) / 0.42), 1)` product.css:19-20, likewise `--k1` :21 and `--k2` :22, are ALL keyed to `--e`, which is pinned at 1 for the entire pin. Anything on `--e` has finished before `--t` moves at all; only `--k3` (t 0.26→0.40), `--k4` (t 0.10→0.26) and annot.css's `--a1..--a4` (t 0.28→0.67) are scrubbable.
- `const hueIdx = sessionAct > 0.5 ? 1 : idx;` director.js:280, with `sessionAct = band(n, 4.1, 4.4) * (1 - band(n, 4.95, 5.2))` :173 and `idx = clamp(Math.floor(clamp((n - 3.0) / 1.0) * 5), 0, 4)` :162-163. `--hue` is `#c9a227` (queen gold) for t < 0.25 and `#4a8bd0` (KNIGHT) for t >= 0.25, as a hard cut. It is NEVER `#9070ce` (bishop) in act 4 — that requires idx === 2, i.e. n in [3.4, 3.6).
- `const lift = band(n, 4.62, 5.06) * (1 - band(n, 6.86, 6.99));` director.js:242 with `for (const [name, a, b] of RAMPS) this.root.style.setProperty(name, mixCss(a, b, qLift));` :296-298. `--fg`, `--fg-dim`, `--fg-faint`, `--fg-inv`, `--line`, `--line-2` and `--glass` all ramp to their paper ends from t ≈ 0.673, and `body.is-paper` turns on at t ≈ 0.852. At t = 1, `--glass` ≈ `rgb(233 231 227 / 0.958)` — act 4's own panes are near-white paper before the act ends.
- `director.js:308-310` — '--narr and --lift used to be written here too. Nothing consumed them'. Nothing writes `--lift` to CSS; `tokens.css:76 --lift: 0` is inert. The tonal cut reaches CSS only via the seven RAMPS tokens and `body.is-paper`.
- `const scrim = 1 - 0.18*window_(n,1.06,1.44,1.84,2.0) - 0.22*window_(n,2.9,3.2,3.9,4.2) - 0.12*window_(n,7.55,7.8,7.95,8.0);` director.js:281-284. The scrim is 0.8370 at t = 0 and reaches exactly 1.0 by t = 0.20 — the wash strengthens over act 4's opening fifth, and it carries no per-act input.
- `const open = window_(n, 4.14, 4.62, 5.06, 5.34); this.board.focus = open > 0.002 ? { f: FOCUS.f, r: FOCUS.r, amount: open } : null;` director.js:237-238 with `export const FOCUS = { f: SPINE_FILE, r: 8 };` :41 (SPINE_FILE = 3, board.js:9). The d8 square lifts out of the board over t 0.14 → 0.62 and holds; the composition sits over that.
- `this.spine.visible = band(n, 1.94, 2.2) * (1 - band(n, 4.55, 4.95));` director.js:153. The lit d-file, its rank glows (:256-262) and the hue lamp (:211) all go out over t 0.55 → 0.95, so act 4's second half loses its backlight.
- `const qt = Math.round(a.t * 120) / 120;` … `a.el.style.setProperty('--t', qt.toFixed(4))` scroll.js:82, 85. Every band is quantised to 1/120 of the pin (33px at 1440x900); a window narrower than 0.00833 renders in at most one frame.
- `.act:not(.is-live) .act-stage { visibility: hidden; }` base.css:90, with `is-live` toggled inside ±1.15 viewports (scroll.js:59-62). Before first entry act 4 inherits `:root`'s `--t: 0; --e: 1; --h: 0` (tokens.css:80-82), which makes `--in`/`--in2` compute to 1 — the console is fully composed and only the visibility rule hides it.
- `.coord { display: none; }` product.css:644, inside `@media (max-height: 820px) and (min-width: 901px)`. Act 4's `d8 · session` label is off-screen below 821px of height; `annot.css:39` also strips its pointer events because a control now sits at that edge.
- `.pad { padding-top: clamp(64px, 9vh, 92px); padding-bottom: clamp(14px, 2.4vh, 26px); }` product.css:575 is the live 820-tier padding; the identical-selector copy at acts.css:402 is fully shadowed because product.css loads later (index.html:20-21).
- Act 4's headline size is set in three disjoint bands: base `.d3 { font-size: clamp(2rem, 4.6vw, 4.6rem); letter-spacing: -0.02em; line-height: 0.94; }` base.css:105; `.act-session .session-head .d3 { font-size: min(clamp(2rem, 4.6vw, 4.6rem), 8vh); }` annot.css:482 (901+ wide, 821-920 tall); `.d3 { font-size: clamp(1.3rem, 2.4vw, 2.1rem); }` product.css:578 (820 tier). `.d4` does not exist in any sheet.
- `.mono, .coord, .kicker, .ticker span, .facts dt, .scraps li, .cell .c-k, .flow li, .notes h4, .hw .hw-t, .drill li, .sp-units li, .pane-h, .gates li { color: var(--fg-faint); }` product.css:224-225. A single-class `color` in acts.css on any element carrying `mono` loses this tie; acts.css:894-899, :548-556 and :1171-1178 all record paying for it. The fix used three times is to drop the class and set `font-family: var(--mono)` explicitly.
- The only outlined-glyph idiom on the page: `.cv-ar-o { fill: none; stroke: var(--line-2); stroke-width: 1; }` and `.cv-ai { fill: none; stroke: var(--fg-dim); stroke-width: 1.4; stroke-linecap: round; }` on a `viewBox="0 0 24 24"` svg sized `width: 2.1em; height: 2.1em` — acts.css:869-875, built at compare.js:314-320. Only compare.js:206-212 creates SVG anywhere in the app.
- The badge idiom is a 1px border on a token with mono uppercase type and em padding, no border-radius except `.cv-ti`'s 2px: `.cs-chain li { … border: 1px solid var(--line); padding: 0.3em 0.44em; }` product.css:56-58, `.mv { … border: 1px solid var(--line-2); padding: 0.34em 0.55em; }` product.css:112-114, `.ic-b { background: transparent; border: 1px solid var(--line-2); … padding: 0.56em 0.7em; }` annot.css:116-119, `.sp-status` acts.css:310-311, `.sp-units li` acts.css:327-330.
- Act 4's bullet is a hairline, not a glyph: `.notes li::before { content: ''; position: absolute; left: 0; top: 0.58em; width: 5px; height: 1px; background: var(--hue); }` product.css:128-129, repeated on `--rook` at annot.css:159-160 and on ink at annot.css:215-216. There is no arrow, chevron, caret or checkmark anywhere in the page's own CSS, JS or HTML; the only arrows are three `&rarr;` entities in `.coord` text at index.html:160, 176, 206, and act 4's coord uses `&middot;`.
- `.ic { border: 1px solid var(--line); border-left: 2px solid var(--hue); }` annot.css:99-103, stated there as act 4's nested-panel idiom: 'a hairline box with a 2px accent edge, no radius, no shadow, no fill'. The same 2px accent edge is `.scrub` acts.css:264, `.stage-panel` acts.css:299, `.levels li.on` acts.css:527 and `.cv-one::after` acts.css:1165-1170.
- `.console` has exactly three in-flow grid children — `.pane-plan`, `.pane-board`, `.pane-ctl` (console.js:110-112, :153-156, :170-172) — in `grid-template-columns: minmax(0, 1.02fr) minmax(0, 1.28fr) minmax(0, 1fr)` with `gap: 1px; background: var(--line)` (product.css:30-31), the 1px gap over a line-coloured ground being what draws the hairlines between panes. `.prep` (annot.css:176-183) and `.sr` are absolutely positioned and take no track.
- `if (aSession?.active) playPuzzle(aSession.t);` main.js:141. The console's DOM is driven by act 4's own `t`, not by the director's `n`, and only while the act carries `is-live`.

## UNKNOWNS
- Whether the duplicate `--out` at product.css:18 vs product.css:25 is an intentional revert or an editing residue. The comment at product.css:14-17 argues for the :18 form, the cascade delivers the :25 form, and no comment anywhere records the conflict.
- Whether `--k2` topping out at 0.8 (product.css:22 against `--e`'s hard cap of 1) is intended. No comment in product.css or annot.css mentions it, and I did not render the board to confirm the 0.8 opacity is visible rather than compensated downstream.
- Whether the rook's position is continuous at t = 0.62, where director.js switches from the `n < 4.62` branch (piece at `this.spine.at(0.97).z`, director.js:198-211) to the `else` branch (piece at `rankZ(8)`, director.js:229-233). That needs spine.js's `at()` and board.js's `rankZ()` read together, which I did not do.
- I did not read console.js:215-336 (the clock, solution and FEN block internals) or bento.js/stages.js/rate.js, so the DOM inventory for panes 1-3 is complete only for the elements I quoted. No SVG is created in any of them (verified by grep for createElementNS across app/js), but individual element/class lists inside those ranges are unverified.
- All contrast, box-overflow and paper-side colour figures here are computed from the source (token values, the RAMPS mix at director.js:23-29, the clamp arithmetic). I ran none of the project's own tools (.audit5/cssom.cjs, tools/contrast.cjs, tools/gate.cjs, .audit5/boards.cjs) and rendered nothing, so no measured number is independently confirmed.
- Whether the annot.css desktop micro-tiers (annot.css:307-311, :342-346, :359-362, :466-495) still hold after an act-4 rebuild is unknowable from the files: each is a measured response to a specific `.pane-ctl`/`.pane-plan` overflow at a named window, and their comments say so. I could not determine which branches would still be needed against different content.
- Whether the `--fg-rung` token (tokens.css:70) may be used in act 4. Its comment says 'Deliberately NOT in the director's RAMPS list: act 2 is dark-room for its whole life (lift is 0 until n~4.62) … If this is ever used in acts 5-7, give it a ramp entry' — act 4 crosses lift from t = 0.62, the boundary the comment does not name.
- The rendered effect of `--hue` being queen gold for act 4's first quarter (t < 0.25) — whether it is visible or masked by low `--in2`/`--k*` at that point. `--k1`/`--k2` are already complete at the pin and `--k4` reaches 1 at t = 0.26, so at least the plan pane's hue elements are fully drawn while the token is gold, but I did not render it.