# COMPLETENESS CRITIQUE — ACT 4 REBUILD

I read the four reports, then read the two files nobody reported on (`app/js/ui/console.js`, 502 lines; `app/css/annot.css`, 709 lines), the act-4 shell, the tool inventory, and **the founder's reference mock**, and took three measurements. Findings below are sourced, not inferred.

---

## 0. The two things that were kept from you

**Only four of the six reports are in my context.** They are byte-identical to `C:\Users\MUS\Desktop\CurriculumWwebsitePrototype\.ref\rep-r0.md` (gate), `rep-r1.md` (S115 data), `rep-r2.md` (/teach), `rep-r3.md` (shell). The two missing reports would have had to cover the only two files this change actually *rewrites*:

- `C:\Users\MUS\Desktop\CurriculumWwebsitePrototype\app\js\ui\console.js` — 502 lines, `buildConsole` + 5 pane/control builders + the prep dialog + the `el()` helper.
- `C:\Users\MUS\Desktop\CurriculumWwebsitePrototype\app\css\annot.css` — 709 lines, of which ~400 are *measured* @media pockets for the current three-pane content, each with its own recorded window boundaries.

**There is a reference mock and it is in the repo, unreported.** `C:/Users/MUS/.claude/image-cache/393ae3e3-ecc3-44a6-9dd4-76cb5e1dba44/13.png`, 1672x941, already cropped into eight regions at `.ref\crops\` (`top-left`, `top-callouts`, `console-left`, `console-mid`, `console-right`, `bottom-callouts`, `bottomlink`, `feats`) by `.ref\crop.cjs`, with `.ref\pix.cjs` and `.ref\hist.cjs` beside it for pixel sampling. I opened four of the crops. **The prose brief you were given is a lossy summary of that mock, and it omits every conflict below.** Per the standing rule that a supplied mock is to be copied rather than improved, the mock is the spec — so read it before writing anything.

What the mock actually says, that the brief does not:

| element | mock | brief |
|---|---|---|
| eyebrow | `◆ WHAT YOU GET`, **pawn green**, green diamond dot | "mono eyebrow" |
| lead | "A step-by-step learning experience built for coaches and students." | "a lead" |
| feature rows | 5 rows, each with a **rounded-square icon box in a different hue**: book/**purple**, puzzle/**green**, target/**gold**, bar-chart/**blue**, clock/**grey** | "five icon+title+description feature rows" |
| row 5 body | "**50-minute sessions.** Every minute has a purpose." | — |
| row 4 body | "Plan, **assign, and track** every student's journey with ease." | — |
| link | "Explore the curriculum" + **arrow-into-box glyph**, **pawn green** | "an 'Explore the curriculum' link" |
| console accent | **bishop purple** throughout (crumb, S115 chip, TEACH chip, all six callout labels, active puzzle chip) | — |
| console plate | **rounded corners, ~10px radius** | "rounded plate" |
| board squares | measured **#e2d7c4 / #9f815f** — /teach's palette, not act 4's | — |
| left rail head | `60 MIN PLANNED · 42 TIMED` | — |
| lesson flow | `01 Warm-up / 02 Introduction / 03 Core explanation / 04 Discussion / 05 Guided practice …` — the **eight-row** model | "the numbered lesson flow" |
| centre rail | `06 / 08 · PUZZLES · POSITION 4 OF 8 · CORE`, the full 349-char P4 prompt, chips 1–8 with **4** active, S115-**P4** on the board | "puzzle-number chips" |
| callout dots | small **filled circles** on the console edge | "a dot" |
| header chips | `PUZZLES 6 OF 8`, `S001 S042 S115`, `TEACH PREP` — **two** mode buttons | "a puzzle counter … TEACH/PREP buttons" |

`node .ref/hist.cjs "0,0,1672,941,whole"` returns `#e2d7c4 x3651 #e3d8c5 x3237 #9f815f x2509 … #a08260 x1836` — the two most common colours in the entire mock are the board's cream and tan, and they are **not** act 4's squares.

---

## 1. What is still unknown that could break this rebuild

Each is *file → question*.

1. **`.ref\crops\console-right.png` + the mock — which state is the right rail in?** THE ANSWER on /teach is gated (`segments.js:81` sets `gated: true` on every puzzle beat; `main.js:474` prints `hidden`). Is the mock's rail showing `hidden` with a Reveal button, or open? This decides whether act 4 keeps a reveal control at all, and therefore whether `AUTO_REVEAL` (`console.js:17`, t=0.42) survives.
2. **`app/js/ui/console.js:39`, `const P = L.puzzles[0]` → does the board show P4 or P1?** The mock unambiguously shows `POSITION 4 OF 8` and P4's prompt, i.e. `puzzles[3]`, `8/p3k3/1q2rpp1/8/1p2R3/8/PPP1Q2P/1K6 b - - 1 30`. Nothing in the brief says which. If P4: `P.solution.moves` is `["Qg1+","Qe1","Qxe1+","Rxe1","Rxe1#"]` — five moves, six frames.
3. **`app/js/ui/board2d.js:30`, `this.flip = !!opts.flip` → flip or not?** P4 is **black to move** and the mock draws it white-at-bottom (a7/e7/b6/e6 read as ranks 7 and 6 from the top). Confirm the mock's orientation before wiring, because `render()` also composes the `aria-label` and `name(i)` from `flip`.
4. **`app/js/ui/console.js:87` and `app/js/main.js:141` — is the new console scroll-driven at all?** `buildConsole` returns `play(now)`; `main.js:141` calls it every frame with `aSession.t`, and `main.js:69-70` calls it **twice at boot** (`playPuzzle(0.99); playPuzzle(0)`) to warm 64 cells and 32 SVG decodes. If the rebuilt console is static, those three call sites and the `--k2/--k3/--k4` consumers must be retired deliberately, not left dangling. If it is not static, what does `t` drive now?
5. **`app/js/ui/console.js:341-349` + `:358-428` — what is the PREP button?** On /teach, PREP is a *view toggle* that swaps `#t-teach` for `#t-prep` (`main.js:136-146`, `aria-pressed`). In act 4, prep is a *paper dialog* (`#cs-prep`, `role="dialog"`, Escape with `stopPropagation`, focus return, `position: absolute; right: 35.8%; width: min(478px, 42%)` — annot.css:176-180). Those percentages are of `.console`. Which one does the mock's PREP button mean, and what are the new percentages when the console is half-width?
6. **The mock's TEACH button — link or state?** If it is `href="/teach"` it needs no `aria-pressed`; if it is a state toggle it needs a second view that does not exist in act 4.
7. **Where do the six callouts live in the DOM?** `app/index.html:189` currently has one child, `<div class="console" id="console">`, inside `.pad.session` whose `grid-template-rows: auto minmax(0, 1fr)` (product.css:9). Are the callouts siblings of `.console` (new grid rows), absolutely positioned over it, or children of it (where `.pane { overflow: hidden }` and `.act-stage { overflow: clip; contain: layout paint style }` will silently eat them)? Everything in §3 about the height budget turns on this answer.
8. **`app/index.html:18-23` — does `teach.css` get loaded on `/`?** It is not loaded today. See §3.6 for why loading it is a site-wide regression, and note that *not* loading it means every `.t-*` look in the mock has to be re-authored against `/`'s tokens.
9. **The link target.** "Explore the curriculum" → `#curriculum` (which is **act 2**, `index.html:140`, i.e. backwards up the page) or `/teach`? It cannot be `/curriculum`. See §2.1.
10. **Do the class names `.pane-plan` / `.pane-board` / `.pane-ctl` / `.board2d` survive?** This single decision silently rearms or disarms **16 of the 54 gate assertions**. See §3.1.
11. **`app/js/gl/director.js:174` and `:280` — does the room follow the console to Bishop?** The mock's console is purple; `--hue` in act 4 is knight blue, and gold before t=0.25. See §2.4.
12. **`.audit5\snap\` — do you spend the only rollback?** `STATE.md:29-31`: *"`.audit5/snap/` currently holds the tree as of 2026-09-03 19:11 — before the whole act-1 rebuild. That is the only way back from it. Do not `take` a new snapshot until you have decided to give that up."* And two lines later: *"`sh .audit5/snap.sh take` — ALWAYS, before touching a file."* **There is no git.** You must resolve this before the first edit, not after.

---

## 2. Reported constraints that conflict with the planned change

### 2.1 The link
> `STATE.md:74` — **"Never link** `/pilot`, `/lesson`, `/curriculum` or a privacy page. **They do not exist."**

> Brief — "and an **'Explore the curriculum' link**"; mock renders it as a green link with an arrow-into-box glyph.

Only two legal targets exist: `#curriculum` (act 2 — *backwards*) or `/teach`. `index.html` contains exactly five hrefs to real destinations: `#curriculum`, `#session`, `#system`, `#terms`, `#top`, `/teach`.

### 2.2 The 50 minutes
> Mock, feature row 5 — "**50-minute sessions.** Every minute has a purpose."

> Mock, left rail of the very same figure — "`60 MIN PLANNED · 42 TIMED`", from `app/data/showcase.json` `S115.estimated_duration_min: 60`.

> `STATE.md:66-68` — "**Every figure must survive a count** against `app/data/*.json` … If it traces to neither, remove it rather than adjust it. The page's whole authority is that its numbers are checkable."

50 *does* survive a count — it is `variance.json` `session.slotMinutes: 50` for **S012**, ages 5-7, which act 1 uses ("Same 50-minute session", `index.html:127`). So both figures are countable and they contradict each other **one column apart inside one act**. `STATE.md:181-184` records the identical defect as an open decision for act 1: *"Act 1 prints two age bands one frame apart… Both survive a count, so the figure rule is satisfied; they just disagree on screen."* Do not ship a second instance of the thing already on the open-decisions list.

### 2.3 Five hues at once
> `app/css/tokens.css:26-33` — "The five hues are **not chosen here** — `indexes/stage_index.json` declares a colour per stage, so **stage colour is curriculum data** resolved to hex. **Gold is reserved for promotion.**"

> `app/js/gl/director.js:170-172` — "Act 4 shows session S042, which lives in the Knight stage — so the room wears Knight blue while that console is open. **The light always agrees with the data on screen.**"

> Mock — purple book, green puzzle, gold target, blue bar-chart, grey clock icon boxes; green eyebrow and green link; purple console.

The page's architecture is one live `--hue` per moment. The mock spends all five stage hues plus the reserved promotion gold as decoration in a single act, while the GL room light — which is separately eased and drives `spine.hue`, `board.hueColor`, `world.hue.color`, `world.fHue.color` (director.js:176-179) — sits on one of them. `STATE.md:78` : *"no new palette VALUE"* is satisfied by the letter (these are existing tokens) and broken in spirit.

### 2.4 The purple console is not reachable
> `app/js/gl/director.js:280` — `const hueIdx = sessionAct > 0.5 ? 1 : idx;` with `:173` `sessionAct = band(n, 4.1, 4.4) * (1 - band(n, 4.95, 5.2))` and `:162-163` `idx = clamp(Math.floor(clamp((n - 3.0)/1.0) * 5), 0, 4)`.

> Report (shell), HARD CONSTRAINTS — "`--hue` is `#c9a227` (queen gold) for t < 0.25 and `#4a8bd0` (KNIGHT) for t >= 0.25, as a hard cut. **It is NEVER `#9070ce` (bishop) in act 4** — that requires `idx === 2`, i.e. n in [3.4, 3.6)."

To copy the mock you must edit `director.js:174` and `:280` to `HUES[2]`, **and** retime `band(n, 4.1, 4.4)` so it is already >0.5 at n=4.0 — otherwise the mock's purple console renders **gold** for the first quarter of the pin (t 0 → 0.25), and cuts to purple one frame before the first callout arrives at t=0.28. Both edits move the GL light and `--hue-soft` with them.

### 2.5 The rounded plate
> `app/css/annot.css:97-98` — act 4's nested-panel idiom is stated in writing: "a hairline box with **a 2px accent edge, no radius, no shadow, no fill**."

> Whole page, verified by grep across all six sheets `/` loads: **two** `border-radius` declarations exist — `base.css:125` `:focus-visible … border-radius: 2px` and `acts.css:914` `.cv-ti … border-radius: 2px` — plus `acts.css:23` `.kicker .dot { … border-radius: 0 }`, set to zero on purpose.

> Brief — "the console for session S115, in a **rounded plate**"; mock also shows five rounded icon boxes and six circular dots.

### 2.6 The board's squares
> `app/css/product.css:97-98` — `.board2d .sq.l { background: #cfc3ac } .board2d .sq.d { background: #6f6152 }`

> `app/css/acts.css:1000-1001` — act 1's board hardcodes `--sq-l: #cfc3ac; --sq-d: #6f6152` with the comment "**act 4's own (product.css:97-98)**".

> Mock, measured — `#e2d7c4 / #9f815f`, i.e. `teach.css:186-187`'s `#e8dcc4 / #a98a63` under the mock's wash.

Copy the mock and act 1's board silently stops matching act 4's, and the acts.css annotation becomes false.

### 2.7 The ratio the code refused
> `app/js/ui/console.js:143-147` — "'planned' plus the count of timed parts, **not "47 of 60"**: two of the eight segments carry no minutes in the bundle, so **a ratio here reads as a shortfall** in the one act whose job is to show the artefact is finished."

> Mock — `60 MIN PLANNED · 42 TIMED`.

The mock reinstates exactly the ratio this file deliberately declined. It is defensible for S115 (42 is a true sum) but it is a reversal of a recorded decision, not an oversight — say so out loud.

### 2.8 The callouts' whole rationale inverts
> `app/css/annot.css:44-47` — "Two columns: the label gutter, then the control. **The callout and the control it names sit in the same grid row, so nothing is positioned over anything** — a callout cannot cover the thing it points at because it was never on top of it."

> `app/css/annot.css:19-23` — "Taking width off the board pane for the annotation gutter looked free … at 1366x768 the pane is the narrower side and the board is already losing part of its h-file. **The gutter is cut out of the controls pane instead, and the board keeps every pixel it had.**"

> Brief — "**SIX** mono callout labels arranged **OUTSIDE** it (three above, three below), each with a thin **vertical** leader line."

The new arrangement takes the cost in **height** instead of width, in a stage that is exactly `100vh` with `overflow: clip`. §3.2 prices it.

### 2.9 The flow model
> `app/js/ui/console.js:5-10` — `SEGMENTS` is four keys; `flowRows()` appends `practical_activity` → five rows, and `:100-101` `if (!m) continue` drops any untimed segment.

> Mock — eight numbered rows including `05 Guided practice` (no `duration_min` in the bundle, renders `—`).

You must swap in `app/js/teach/segments.js`'s `buildSegments`, which is a different model (8 rows, `orOne`, hardcoded labels, `minutes: null` on homework). That instantly staleness-flags `bento.js:61` (`'47<small>min in five parts</small>'`), `bento.js:68` (`[6,8,13,6,14]`, and `:74` divides bar widths by the literal `47`), and `annot.css:625`'s "47 of 60 min scripted".

### 2.10 Two product claims with nothing behind them
- "Teach, **prepare, or present** — all in one place" — /teach has exactly **two** views (`app/teach/index.html:32-33`, `aria-pressed`), and the mock's own header bar shows two buttons.
- "Plan, **assign, and track** every student's journey with ease" — no assignment or tracking exists anywhere in the bundle or the prototype. Against `STATE.md:66-68` and the scoping rule at `:70-75`, this is the riskiest sentence in the mock.

---

## 3. What will break silently — nobody listed these

### 3.1 The gate can come back green over a broken act
`tools/gate.cjs:293-301` measures `['.pane-plan', '.pane-ctl', '.pane-board']` and **filters nulls before the predicate**: `.filter((r) => r && (r.y > 2 || r.x > 2))`, then `record(…, bad.length === 0, …)`. Rename the panes and all **five** `console-panes-fit@*` assertions measure nothing and PASS.

`gate.cjs:78` is the file's only **conditional** record: `if (bd) record('board-pane-fits@…')`. Lose `.pane-board` and **four** assertions cease to exist. Nothing asserts `results.length`, and `:398-399` prints `${pass}/${shown.length}` and exits on `pass === shown.length` — so the run prints **"50/50 assertions pass"** and **exit 0**.

`board-is-a-board` (7 assertions) does fail loudly (`if (!bd || !pb) return null` → `bad: true`), but only at its seven windows, all ≤900px wide.

Net: **16 of 54 assertions are in play; 9 of them can go quiet rather than red.** The only safe move is to carry `.pane-plan`, `.pane-board`, `.pane-ctl` and `.board2d` onto the new rails — and then check the next item.

### 3.2 `.pane:nth-child(3) { display: none }`
`product.css:471`, inside `@media (max-width: 900px)`. `annot.css:527` brings the controls pane back **by class** (`.session .pane-ctl { display: grid }`), so the hide is positional and the restore is not. `console.js:41-44` says so in writing: the live region is appended **last** "because product.css hides the third *child* pane on a phone and a stray first child would shift what 'third' means."

The mock adds a **header bar as the console's first child**. Under `.pane:nth-child(3)`, the third child becomes the **board pane** → `display: none` at every window ≤900px → `.board2d` measures 0x0 → `board-is-a-board` fails at all seven of its windows, and `board-pane-fits` reports `0` and passes. This is the single most likely way to break the rebuild in one line of markup.

### 3.3 There is no minimum-board assertion at desktop short windows
`board-pane-fits@981x620` and `@1244x620` assert `bd.x <= 2` only — **`y` is computed and discarded** (`gate.cjs:75-78`). `board-is-a-board`'s seven windows are all ≤900px wide. So at 981x620 and 1244x620 — both gate windows — a board collapsed by a taller header bar or a callout band is caught by **nothing**. I measured the current state: at 981x620 the console gets 468.6px and the board 325.2px (40.7px a square). That is your entire margin.

### 3.4 The accessible names are the callouts
`console.js:439-451`: `callout()` gives the label span `id="an-<key>-l"` and the note `id="an-<key>-n"`; `ic()` then sets `role="group"` + `aria-labelledby` + `aria-describedby` from them. `clockBlock` additionally does `bar.setAttribute('aria-labelledby', c.labelId)` — **the progressbar's accessible name is callout 1's label.**

Move the labels outside as decoration and you leave, in the accessibility tree: five unnamed `role="group"`s and one unnamed `role="progressbar"`. IDREFs still resolve document-wide, so the fix is cheap — but only if someone remembers the wiring exists. Also:

- `console.js:440` makes each callout an **`<h4>`**. Six of them plus five feature-row titles gives act 4 eleven headings under one `<h2>` with no `<h3>`. Decide which of the two sets are headings.
- `index.html:182` — `<section … aria-labelledby="h-session">`. The act's landmark name is `#h-session`'s text. Keep `id="h-session"` on whatever holds "Every session. / Every detail." or the landmark goes nameless.
- `STATE.md:174-180` (decision 10): opacity 0 does **not** remove text from the accessibility tree. Six callouts that are invisible until t=0.28 are in the name/reading order from the first frame.

### 3.5 `[hidden]` does not work on `/`
`teach.css:46` has `[hidden] { display: none !important }` and calls it load-bearing. **On `/` there is no such rule.** Grepped all six sheets: the only `[hidden]` rule is `annot.css:147` `.sol-body[hidden], .prep[hidden] { display: none }`, with the reason stated at `:145-146`: "An author `display` beats the UA's `[hidden]` rule, so every block this file gives a display to has to say what hidden means for itself."

Any new element in the rebuilt console that gets `display: grid|flex` **and** is toggled with `el.hidden = true` will be **visible from the first paint**. That is exactly how the gated answer and the prep sheet would both leak.

### 3.6 Loading `teach.css` on `/` is a site-wide regression
Tempting, because the mock *is* /teach. `teach.css` has these **unscoped** selectors: `.mono` (37), `.num` (39), `a` (40), `:focus-visible` (41), `button` (42), `[hidden]` (46), `.sr` (48), `#t-top`, `#t-main`, and **`.board2d` plus all seven of its descendants (182-199)**. Consequences at any link position after `base.css`:

- `.mono { letter-spacing: 0.16em }` beats `base.css:107-113`'s `0.19em` → **every mono string in all eight acts reflows**, including `.ticker` (asserted at *exactly* 0 overflow by `hero-fits-at-rest`, 6 assertions), `.rate-cta .mono.tiny` (measured by Range rects in `terms-cta-on-stage`, 7 assertions), `#readout` (asserted ≤20px wide), `.coord`, `.cs-chain`, `.flow li`, `.pane-h`.
- `.board2d .sq.l/.d` → the §2.6 palette change, plus `img { inset: 5%; width: 90% }`, coordinates at `0.56rem` in `rgb(24 16 10 / 0.9)`, and `box-shadow: inset 0 0 0 5px var(--accent)`.
- `:focus-visible { outline: 2px solid var(--accent) }` — **`--accent` does not exist anywhere on `/`** (only inside `body.teach`). Invalid at computed-value time → outline-color falls back to `currentcolor`, and this rule beats `base.css:125`'s `var(--hue)` ring **on every focusable element on the site**.

Do not load it. Re-author against `/`'s tokens.

### 3.7 The reveal bands nobody can scrub
`product.css:19-22` — `--in`, `--in2`, `--k1`, `--k2` are all keyed to `--e`, and `--e` is **pinned at 1 for the entire pin** (`scroll.js:75`). Everything on them is already finished at t=0. Only `--k3` (t 0.26→0.40), `--k4` (t 0.10→0.26) and `annot.css:26-29`'s `--a1..--a4` (t 0.28→0.67) actually move. Also `--k2` **can never exceed 0.8** (`(1-0.68)/0.4`), so `.board2d { opacity: var(--k2) }` renders the board at 80% forever.

Six callouts need `--a5`/`--a6` and `--z5`/`--z6`. Every band must be **≥ 0.00833** of `t` (`scroll.js:82` quantises to 1/120 — 33px of scroll at 1440x900) or it renders in at most one frame, and every arrival must close before **t = 0.7727**, where `--out` opens.

And the trap `STATE.md:130-134` names explicitly: *"A new element with no reveal band is on screen from the act's first frame, and nothing will tell you."* Grep every new element for an `opacity:` band before shipping. The left copy column, the five feature rows, the link, the six labels, the six leaders and the six dots are **19 new elements**.

### 3.8 `--out` is not the expression its comment describes
`product.css:18` declares `--out: clamp(0, calc((var(--h) - 0.3) / 0.4), 1)` and `product.css:25` **redeclares it** as `clamp(0, calc(var(--h) / 0.42), 1)`. The later wins. The console begins fading the instant `h` leaves 0 (**t = 0.77273**) and is gone at **t = 0.86818** (0.83889 at ≤900px). Anything new must fade on the same expression or it survives the handover and paints over act 5's bento — and `.act + .act { margin-top: -100vh }` (`acts.css:425`) means act 4's `--h` window *is* act 5's `--e` window.

### 3.9 The console turns to paper before the act ends
`director.js:242` `lift = band(n, 4.62, 5.06) …`, `:291-298` writes seven RAMPS tokens and toggles `body.is-paper`. `--glass` runs `rgb(7 7 10 / 0.88)` → `rgb(253 251 246 / 0.965)`; `--fg`, `--fg-dim`, `--fg-faint`, `--fg-inv`, `--line`, `--line-2` invert with it. Lift starts at **t ≈ 0.673** and `is-paper` flips at **t ≈ 0.852**.

The six callout labels sit on the **stage**, not on a plate — they have no `--glass` under them at all. Any hardcoded colour there is wrong at one end of the ramp:
- hardcoded ivory label → invisible on paper.
- the mock's **green link `#3fa57a` on ivory `rgb(253 251 246)` is 2.3:1** — a flat 1.4.3 failure if the copy column has no `--out` band.
- bishop `#9070ce` on near-black is ~4.7:1 *declared*, and `STATE.md:120-122` records that the P28 wash makes rendered **20-35% below declared** → ~3.2:1 for the six 0.5rem labels. Measure, do not argue.

### 3.10 The stage clips silently, and Fraunces already overflows
`base.css:70-84` — `.act-stage { height: 100vh; overflow: clip; contain: layout paint style }`. A leader or a dot that lands outside the stage is clipped with no scrollbar and no assertion (act 4's stage is **not** in any gate box list; only act 0's and act 1's are asserted at exactly 0).

Measured just now at 1440x900, act 4, t=0.8: **`.session-head` reads `overY 9`** — the head already overflows its own box by 9px. `STATE.md:135-140`: *"`scrollHeight > clientHeight` with every child inside the box means the FONT overflows its own line box. Fraunces at `opsz 72` inks past a 1.02em (and 1.1em, and 1.18em) line — 1.24 was the measured floor."* A two-line Fraunces headline in a new left column with `overflow: hidden` (which any `minmax(0,1fr)` two-column grid invites) becomes a silent clip. `teach-no-silent-clip` sweeps `*` on **`/teach` only** — `/` has no equivalent gate assertion. `tools/audit.cjs` is the only instrument that asks the question on `/`.

### 3.11 Container queries move with the board
`product.css:87-90` — `.pane-board { container-type: inline-size }` and `.board2d { height: min(100%, 100cqw) }`. Move the board into a new rail and the query container must move with it, or `100cqw` resolves against the wrong box. Two recorded traps apply: `STATE.md:155-157` (*"A container query measures the CONTENT box"* — a `max-width: 225px` query fired on a 248px card) and `teach.css:167-168` (*"a size-contained box in an auto row is a box whose contents cannot give it a height, i.e. zero"*).

### 3.12 The prep sheet's geometry is a percentage of the console
`annot.css:178` — `right: 35.8%; width: min(478px, 42%)`, of `.console`. Halve the console's width and the sheet is ~270px wide, and `right: 35.8%` no longer stops at the controls pane (which is the stated reason it exists: "the sheet never covers the control that opened it"). Also `annot.css:697-704` records that `overscroll-behavior: contain` on a **pinned** act turned the bottom 46% of the stage into a dead zone — 13 wheel notches moved `scrollY` by 0. Do not copy it onto a new scroller.

### 3.13 ~400 lines of measured @media pockets become inert lies
`annot.css` carries, all measured window-by-window with recorded boundaries: three `.pane-plan .routine` hide branches (307-311), three `.sol-k, .sol-l` branches (359-362), a 5-line `.solve` clamp (367-370), the `(max-height: 920px)` and `(max-height: 660px)` control-metric tiers, the `(min-width: 1460px)` wide-and-short tier, the **post-tier** spacing block plus its paired `.an { padding-top: 6px }` (468-478 — annot.css calls the pairing "not optional": unpaired, every leader moves 2px off the line it points at), the `8vh` head ceiling (479-481), the `row-gap: 1px` narrow branch (492-494), the `(max-width: 600px)` `minmax(0, 46%)` board-row fix (706-713), and the 601-900 two-lever tablet band (750-761).

Every one names selectors that will not exist. Left in place they are dead; **the pockets they were measured to cover come back**, at boundaries listed in the file as: widths 900/901, 934/935, 949/950, 1000/1001, 1159/1160, 1399/1400, 1459/1460, 1584/1585, 981; heights 660, 730, 760, 820/821, 840, 845/846, 848, 869/870, 895/896, 920/921, 940, 975/976, 1030/1031, 1064/1065, 1070/1071. `annot.css:225-238` records that two earlier attempts lost five declarations to same-specificity ties and one lost a whole `@media` rule to a comment terminator. Delete these blocks deliberately, and re-measure the surface — do not leave them.

### 3.14 `el()` cannot make an SVG
`console.js:495-501` — `el()` calls `document.createElement`. `document.createElement('svg')` produces an `HTMLUnknownElement` that renders **nothing, with no error**. The only `createElementNS` in the whole app is `compare.js:206-212`, and `acts.css:869-875` is the page's only outlined-glyph idiom (`viewBox="0 0 24 24"`, `width/height: 2.1em`, `fill: none`, stroke on a token at 1 / 1.4, `stroke-linecap: round`, `aria-hidden="true"`). The mock needs **six** new glyphs (book, puzzle, target, bar-chart, clock, arrow-into-box) and the shell report's unicode scan established there is no arrow, chevron, caret or checkmark anywhere in the page's own CSS, JS or HTML.

### 3.15 The kicker's colour will lose its tie
`product.css:224-225` colours `.mono, .coord, .kicker, … .pane-h` `var(--fg-faint)`. The mock's `WHAT YOU GET` is **green**. `STATE.md:116-119`: *"A single-class `color` rule in `acts.css` on any element carrying one of those classes silently loses the tie. Prove colour with `cssom.cjs`, never by reading the file."* Same for the six purple callout labels if they carry `.mono`.

### 3.16 Small stale facts that will read as errors
- `main.js:130` — `updateReadout(n, aSession?.active ? 'knight stage' : …)` prints the literal `'knight stage'` while act 4 is live. A Bishop console contradicts the rail. `readout-one-column` measures at **rest** (`n < 3` yields `''`), so the gate never sees it.
- `gate.cjs:276` — the comment that justifies the two-fraction assertion cites `.mv-res` ("Wins the rook."), S042's `solution.result`. S115's is "Checkmate."
- `annot.css:263`, `:661`, `:678` — all three tier rationales are measured against that same t≈0.75 growth event.
- `board2d.js:24-26` — the cburnett CC BY-SA credit "still has to ship in the footer, and there is no ATTRIBUTION file in this prototype." A second, larger board deepens the debt.
- The instruments go blind: `.audit5\fade.cjs:13`, `.audit5\leaders.cjs:18-19`, `.audit5\wheel.cjs:17-32`, `.audit5\fitprobe2.cjs:11`, `.audit5\boards.cjs:29-31` and `tools\sweep.cjs`'s own usage line all resolve act-4 class names with `querySelector`. Rename and they throw or report `null`.
- Reduced motion: `product.css:810-812` (`.console { transform: none }`) and `annot.css:706-708` are the only entries. New transforms need adding.
- The brand appears twice: `#nav .brand .word` is fixed chrome and always on screen; the mock's console header adds a second Fraunces "Efhaam" + `.mark`. `STATE.md:130-133` records the last time a stray wordmark sat over an act for its whole run.
- `PUZZLES 6 OF 8` is the **segment** counter (`.t-seg`, segment 6 of 8), not a puzzle counter. The brief calls it "a puzzle counter." Build it as puzzle 6 of 8 and it is a wrong figure sitting next to `POSITION 4 OF 8`.

---

## 4. The measurement to take before writing any code

**Take the height budget, at three windows, with `tools/meas.cjs`.** I already ran it, so here is your baseline — act 4, `FRAC` 0.8, current build:

```
node tools/meas.cjs <w> <h> 4 0.8 '.pad.session' '.session-head' '.console' '.pane-board' '.board2d'
```

| window | `.session-head` | console row | `.console` | `.board2d` | square |
|---|---|---|---|---|---|
| 1440x900 (reference) | 226.5 (**overY 9**) | 544.5 | 526.5 | 433.9 | 54.4px |
| 1600x821 (gate, worst) | 222.9 (**overY 9**) | 473.0 | 456.6 | 364.6 | 45.7px |
| 981x620 (gate) | 58.5 (overY 3) | 482.6 | 468.6 | 325.2 | 40.7px |

`.pane-board`'s rows at 1440x900 are `12.39 / 437.39 / 22.33 / 12.39` — the board **is** the `minmax(0,1fr)`, so every pixel any sibling gains comes out of it.

**The question this number has to answer before you write CSS:** three callout bands above and three below (each ≈ a 0.5rem label + two 0.62rem note lines ≈ 44px, plus a leader ≈ 26px ≈ **70px a side, ≈140px total**) come out of that row. At 1600x821 that leaves the console **≈333px** in which to fit a header bar plus /teach's three rails plus a board — against the 456.6px it has today for three panes. Halve the width for the copy column and the three rails are ≈148 / 328 / 172px wide, and /teach's right rail alone carries THE FOCUS (785 characters), THE ANSWER, STEP THE SESSION and SEGMENT CLOCK — which on /teach only survives because `.t-focus` is capped at `26vh` **with internal scroll** (teach.css:374), while on `/` `.pane { overflow: hidden }` (product.css:42) clips it with no cue.

If that arithmetic does not close, the design has to change before the code does. Then, in order:

| tool | what it answers |
|---|---|
| `node tools/gate.cjs` | **Baseline 54/54 first.** ~8 min. Without it you cannot tell your regressions from someone else's. |
| `node .audit5/anat.cjs 1440 900 4 0.8 .console` | what the 140px is *made of*, row by row |
| `FRAC=0.8 INJECT=cand.css node .audit5/inj.cjs 4 <widths> <heights> '.pane-plan' '.pane-ctl' '.pane-board'` | shipped / ablated / candidate in **one page load** — the honest before/after with no git |
| `FRAC=0.8 node .audit5/boards.cjs <widths> <heights>` | board px, square px and pane overflow across a grid — the `board-is-a-board` floors |
| `TOL=2 FRAC=0.8 node tools/sweep.cjs 4 <widths> <heights> <sel>…` | two-axis defect surface; `\| grep -v clean` is the answer |
| `node .audit5/cssom.cjs 1600 860 annot.css 4 0.8 '.kicker:color' …` | which `@media` the browser **actually parsed**, and the **computed** value — the only proof of a cascade tie |
| `node tools/contrast.cjs 1440 900 4 0.9 '.an-l' '<link sel>'` | rendered WCAG ratio over the lit board and the paper lift, not declared |
| `node .audit5/targets.cjs 1440 900 4 0.8 '.console'` | SC 2.5.8 on the new header chips. `annot.css:441-445` and `:753-755` twice **refused** to shrink `.ic-b` because those buttons already measure 20-21px |
| `node .audit5/leaders.cjs <w> <h> 0.8` | leader-to-target offset (currently 0.4px). Rewrite it for vertical leaders — it is the only instrument for the six-dot geometry |
| `node .ref/crop.cjs <tag> <x> <y> <w> <h> [zoom]`, `pix.cjs`, `hist.cjs` | the mock's own geometry and pixels. This is how the square-colour conflict was proven |
| `sh .audit5/snap.sh take` | **read §1.12 first** — it spends the only pre-act-1 rollback |

Preconditions: `node tools/serve.cjs` on 127.0.0.1:4321 (up now, returns 200) and the sibling Playwright at `C:/Users/MUS/CurriculumWebsite/node_modules/playwright` (present). `t` needs ~1400ms to settle before any read. Always measure at **t=0.8**, not 0.5 — `annot.css:270-272` and `gate.cjs:275-277` both record that t=0.5 understates the worst case by up to 26px.

---

## 5. Riskiest parts, most dangerous first

1. **Renaming the panes disarms the gate instead of failing it.** 9 of 54 assertions can go vacuous (`console-panes-fit` filters nulls; `board-pane-fits` is the only conditional `record`), the suite silently shrinks to 50 and prints **"50/50 assertions pass", exit 0**. Nothing asserts `results.length`. You lose your only safety net at the exact moment you need it, and you lose it *quietly*. — §3.1
2. **`.pane:nth-child(3) { display: none }` (product.css:471) + a header bar as child 1.** One line of markup makes the **board** vanish at every window ≤900px. The restore at `annot.css:527` is by class and only covers `.pane-ctl`. `console.js:41-44` warns about this in writing and the warning is about a *different* element. — §3.2
3. **The height budget does not obviously close.** 140px of callout bands out of a 456.6px console row at 1600x821, into which /teach's three rails and a board must fit at ~52% width, with `.pane { overflow: hidden }` clipping instead of scrolling. Measure before designing. — §4
4. **The hue.** The mock is bishop purple; `--hue` in act 4 is knight blue after t=0.25 and **gold before it**, and never purple. Fixing it means editing `director.js:174` and `:280`, retiming `band(n, 4.1, 4.4)`, and moving the GL room light, `spine.hue`, `board.hueColor` and `--hue-soft` with it. Meanwhile the mock also wants green and gold and blue *at the same time*, which the one-`--hue` architecture cannot express. — §2.3, §2.4
5. **Deleting `annot.css`'s twelve measured pockets without re-measuring.** ~400 lines of window-by-window measurement, with two recorded prior attempts that lost five declarations to specificity ties and one that lost a whole `@media` rule to a comment terminator. Left in place the rules are inert and the clips they covered return at 9 width and 15 height boundaries. — §3.13
6. **The accessibility wiring you cannot see.** Five `role="group"`s and one `role="progressbar"` named by callout IDREFs; `aria-labelledby="h-session"` on the section; six `<h4>` callouts plus five feature titles under one `<h2>`; and `[hidden]` **does not work on `/`** — the only rule is `annot.css:147`, scoped to two selectors. A gated answer will leak from the first paint. — §3.4, §3.5
7. **Loading `teach.css` on `/`.** The obvious shortcut, and it silently reflows every mono string in all eight acts (`.mono` 0.16em vs 0.19em), repaints the board's squares, and replaces the site-wide focus ring with `currentcolor` because `--accent` does not exist outside `body.teach`. It would break `hero-fits-at-rest` (6 assertions asserted at *exactly* 0) and `terms-cta-on-stage` (7) in acts nobody was touching. — §3.6
8. **Nineteen new elements with no reveal band.** `--in/--in2/--k1/--k2` are all pinned at 1 for the whole pin, so anything on them is fully composed at t=0; `--out` is `h/0.42`, not the delayed expression its own comment describes; bands narrower than 0.00833 of `t` render in one frame. `STATE.md`: *"nothing will tell you."* — §3.7, §3.8
9. **The copy.** "50-minute sessions" beside "60 MIN PLANNED" in the same act; "Explore the curriculum" against `STATE.md:74`; "assign, and track" and "present" as claims with nothing behind them; `PUZZLES 6 OF 8` read as a puzzle counter when it is the segment counter. These survive the gate perfectly — the gate has **no text predicate at all** — and they are the only failures the founder reads directly. — §2.1, §2.2, §2.10, §3.16
10. **The paper lift under unplated labels.** Six callout labels and a green link sit on the stage with no `--glass` beneath them while `--fg*`/`--line*`/`--glass` invert from t≈0.673 and `is-paper` flips at t≈0.852. Green `#3fa57a` on ivory is 2.3:1. `contrast.cjs`, not judgement. — §3.9
11. **The rounded plate, rounded icon boxes and circular dots** on a page with exactly two `border-radius` declarations, both 2px, one of which is `border-radius: 0` set on purpose — against `annot.css:97-98`'s "no radius, no shadow, no fill" and `STATE.md:78`'s "Design is settled." Cheap to implement, and the first thing a reviewer will say is not in the system. — §2.5
12. **`.audit5/snap/`.** `STATE.md` tells you to `take` before touching a file and, thirty words earlier, tells you that doing so discards the only way back from the act-1 rebuild. There is no git. Resolve it before edit one. — §1.12