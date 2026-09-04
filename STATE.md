# STATE — read this first

**The site is as-is from 2026-09-01. No more audits, no more review loops, no more build orders.**
Changes are made one at a time, on request: "change X to Y". Nothing on this page needs a plan.

This file replaces `FIXPLAN.md`, `HANDOFF.md`, `PITCH.md`, `RESUME.md`, `PASS2.md`, `findings.md`
and 236 other planning, review and log files. They are all in `.archive-2026-09-01/` if a decision
ever needs its paper trail. `README.md` still holds the architecture: the eight acts, the scroll
engine, the data files, how to run it.

## Run it

```sh
node tools/serve.cjs          # 127.0.0.1:4321, zero deps, usually already up
agentation-mcp server         # 127.0.0.1:4747, so annotations reach the agent over MCP
```

**Agentation is on for both routes** (`app/js/agentation.js`, loaded by `index.html` and
`teach/index.html`): open the site in a real browser on localhost and the toolbar is the round
button at the bottom-right — "Start feedback mode", click any element, type, then **Send
Annotations**, and the agent reads them over MCP. Nothing is needed for the copy-to-clipboard path.

**"Hide Until Restart" means restart the TAB, not the server.** That switch writes
`sessionStorage['agentation-session-toolbar-hidden'] = "1"`, and sessionStorage is per tab and
survives a reload — so F5 does not bring the button back, and neither does restarting
`agentation-mcp`. Close the tab and open the page again, or in DevTools run
`sessionStorage.removeItem('agentation-session-toolbar-hidden')` and reload. Verified all four
states (fresh tab / hidden + reload / key removed / new tab while the old one stays hidden).

It deliberately does **not** mount when `navigator.webdriver` is true, i.e. in Playwright, which is
every instrument in this file. Each page load registers a session on :4747 and one `gate.cjs` run
is ~50 of them; by 2026-09-04 the server held **3,205** sessions against the founder's handful, so
`agentation_list_sessions` returned 554 KB and the real session could not be found. Add
`?agentation=1` to force the toolbar on inside a driven browser.

Act 1's own instruments, added 2026-09-04:

```sh
node .audit5/cvfit2.cjs       # every act-1 box at 14 windows: overflow, fold, d-file clearance
node .audit5/cvbudget.cjs     # the space three cards actually have, at the gate's windows
node .audit5/cvtime.cjs       # every reveal band, swept on the engine's own k/120 grid
node .audit5/act1shot.cjs <w> <h> <tag>   # FRACS=0.42,0.68 picks the frames
```

Act 4's, added 2026-09-04. The founder's reference image is the spec for that act, so there are
instruments for reading the image as well as the page:

```sh
FRAC=0.8 node .audit5/boards.cjs <w> <h>     # board px, square px, pane overflow — the act-4 floor
node .ref/crop.cjs <tag> <x> <y> <w> <h> [zoom]   # zoom into the reference mock
node .ref/crop2.cjs <png> <tag> <x> <y> <w> <h> [zoom]   # the same, on any shot in shots/
node .ref/hist.cjs "x,y,w,h,label" ...       # the mock's own colours, by frequency
node .ref/pix.cjs  "x,y,label" ...           # one pixel, or the brightest in a box
node .ref/act4int.cjs [w] [h]                # clicks and keys the console, prints what changed
```

`.ref/` also holds the paper trail for the rebuild: `rep-r0..r3.md` (the gate, S115's record,
`/teach`'s exact DOM and strings, act 4's shell) and `critique.md`.

## Before and after any change

**There is no git.** `.audit5/snap/` is the only undo.

`.audit5/snap/` currently holds the tree as of **2026-09-03 19:11 — before the whole act-1
rebuild**. That is the only way back from it. Do not `take` a new snapshot until you have decided
to give that up.

```sh
sh .audit5/snap.sh take       # ALWAYS, before touching a file
sh .audit5/snap.sh diff       # what has changed since
sh .audit5/snap.sh revert     # undo it all
node tools/gate.cjs           # 54 assertions, ~8 min, must come back 54/54
```

Deeper rollbacks: `.bak/2026-08-29-prefix/app` is the tree before any fix in this whole effort;
`.bak/2026-08-29-pre213/app` is older still.

## Checking one change without running the whole gate

```sh
node tools/gate.cjs hero              # or chaos, console, bento, board, teach, ladder…
node tools/say.cjs <act> <w> <h> <t> <sel>...     # what the words on screen actually are
node tools/meas.cjs <w> <h> [act] [t] <sel>...   # boxes, overflow, computed styles, line counts
node tools/contrast.cjs <w> <h> [act] [t] <sel>...  # WCAG ratio from rendered pixels
node .audit5/cssom.cjs <w> <h> <sheet> [act t sel:prop ...]   # the browser's own parse
node .audit5/shot.cjs <tag> <w> <h> <act> <frac>  # a png in shots/
```

Act indices: 0 threshold · 1 chaos · 2 spine · 3 stages · 4 session · 5 system · 6 terms ·
7 promotion. `t` is the fraction through the act's pin, and it needs ~1400ms to settle before you
read anything off it.

Before/after in ONE page load, which is how you get an honest comparison with no git:
`.audit5/ab.cjs` and `.audit5/inj.cjs` inject candidate CSS; `.audit5/copyab.cjs`,
`heroline.cjs`, `act1ab.cjs` and `swap.cjs` restore the OLD strings into the DOM and re-measure;
`.audit5/pawn.cjs` measures whether the 3D pawn still clears the headline's last glyph.

## Rules that bind any edit

- **Every figure must survive a count** against `app/data/*.json` (content bundle 1.1.0), or trace
  to a document in `C:\Users\MUS\CurriculumWebsite\docs\product\`. If it traces to neither, remove
  it rather than adjust it. The page's whole authority is that its numbers are checkable.
- **Scope every verification claim to chess legality.** `bundle:validate` still fails check B
  (147 of 213 sessions drift from `lesson.schema.json`) and check D (968 malformed puzzle ids), so
  nothing may say or imply the bundle passes every check. And the legality check itself covers six
  of the bundle's twenty-one FEN paths — 118 unique positions are checked by nothing — so
  "every position" is never sayable. "Every puzzle position" is.
- **Never edit the generated data files** — `catalog.json`, `stages.json`, `stage_index.json`,
  `showcase.json`, `variance.json`. `app/data/pricing.json` is the one authored exception.
- **Never link** `/pilot`, `/lesson`, `/curriculum` or a privacy page. They do not exist.
- **Never widen** the shared `@media (max-height: 820px) and (min-width: 901px)` tier. It appears
  three times and re-lays-out all eight acts.
- Design is settled: no act added, removed or reordered, no new palette VALUE, no typeface or type
  scale change. The 3D, the piece transformation, the camera path, the pinning and the reveals stay.

## What changed on 2026-08-31 / 09-01, and why it matters if you edit near it

- **The ten-row ladder walks.** `main.js:127` passes `aSpine.t`, not `spine.fill`. It used to light
  2 of 10 rows and print 13% under "213 of 213 sessions written".
- **Act 0 is the pitch, not a poster.** h1 is `07 §A`'s "Same session. / Every coach. / Every
  table."; the lead is "The complete five-stage curriculum for ages 5–14 — 213 of 213 sessions
  written, every puzzle position checked for legality, and identical in every coach's hands."; the
  ticker is `213` / `1,640` / `0` / `S001–S213`; `<title>` and `og:title` match the h1.
- **The `<noscript>` moved to the top of `<body>`.** Every act is `visibility: hidden` until
  `scroll.js` marks it live, so at the foot of the document it sat ~29 blank screens down.
- **Act 1 was three columns of beat-rules.** It is not any more: the 2026-09-03/04 section below
  replaces this bullet entirely.
- **Act 4 was a four-pane console for S042 under "This is what a coach is handed."** It is not any
  more either: the 2026-09-04 section below replaces this bullet, and act 4's whole authorship
  moved from `product.css` to `annot.css`.
- **`tools/gate.cjs` grew** from 49 to 54 assertions: act 1 had no fit assertion of its own.

## Act 1, rebuilt 2026-09-03 / 09-04 — read this before touching `.cv-*`

Rebuilt end to end across one session, in six founder passes. Every note below is a founder
instruction or a measured consequence of one; nothing here is a preference.

**What it is now.** Two frames in one pinned act.

*The problem* (t 0 → 0.58): three plated `.cv-col` cards, centred as a row. Each card is a
chess.com-style identity row (ringed `.cv-av` avatar, outlined `FM` chip, name at display size,
rating inline, years under it), an exaggerated method line `.cv-mo` ("A lecture every class." /
"Puzzles every class." / "A game every class."), a `.cv-bd` board, and a `.cv-cost` verdict
(`.cv-vd` word + two `.cv-cw` lines). Under the row, `.cv-end` closes the problem.

*The answer* (t 0.595 → 0.70): `.cv-one` is the FOURTH card and it takes the whole row — eyebrow,
the brand lockup (`.mark` + `Efhaam` + claim), three `.cv-fx` answers standing in the three coach
tracks, `.cv-open`, and the `.cv-ft` proof line. It is capped at 1040px and centred.

**The board is one `<svg>`, not 64 divs.** `.cv-bd` holds 32 dark rects, the men as cburnett
`<image>`s, rim coordinates in a `.cv-co` group, and the marks — all in one `0 0 8 8` user space,
so a mark's coordinates ARE squares. It is deliberately NOT `.board2d`: gate assertion 12 resolves
that class with `document.querySelector`, so an act-1 board carrying it would become the board the
gate measures in act 4.

**The marks are chess-site arrows, 18 / 8 / 2.** One translucent `--rook` fill over a thin `--ink`
halo, shaft 0.15-0.26 of a square, head 2.3x that long. The halo is conformance, not style: the two
square colours are 4.4:1 apart, so no single opaque ink clears 1.4.11's 3:1 against both. The
founder rejected the first pass ("these arrows look very weird") — it was a thin line inside a wide
casing, which hatches rather than annotates.

**Sizing is driven by HEIGHT, because the board is square.** `--cw` (on `.chaos`) is one card's
width: `min(34vh, 52vh - 163px)` plus its own padding. `.converge` is then
`min(58vw | 77vw ≥1200px, 1500px, 3 × --cw + 2 × --cg)`, centred — so the width the cards cannot
use becomes symmetric margin instead of an empty right half. Below 720px tall and at 1150px+ wide
the pad becomes TWO columns (head left at 290px, cards right), which is what buys the cards their
size in the founder's own ~1219x543 window. `.cv-col` is a container query context; its head
reflows at 205px and 150px of card CONTENT width, not viewport width.

**Timing — every band is a clamp() on `--t`, and compare.js writes custom properties once at
build. Nothing is written per frame.** In order: per-card `--c0` 0.06/0.11/0.16, `--bs`
0.17/0.22/0.27, `--dir` 1/0/-1, `--kw` 0.045/0.05/0.09 (all inline, so no media query can retime
them — change compare.js). Marks: `--d` is DERIVED so the last mark of every column closes at
t 0.40, which is n 1.40, the frame the room finishes sorting its pile (director.js:137). Verdict
`--cc` at `--bs + 0.075`. Then plate `--pn` 0.595, brand `--pt` 0.615, the three answers at
0.628 + k×0.018 over 0.035 (third closes 0.699), `.cv-open` and `.cv-ft` on `--pf` 0.665.
Everything has landed by t 0.70 and nothing moves until the handover at 0.75. Verify with
`node .audit5/cvtime.cjs` — it sweeps every band on the engine's own k/120 grid.

**The two crossfading slots must stay in phase.** The h2 is two states (`.sw-p` "The problem." /
`.sw-s` "The solution.") and so is the lead (`.sw-a` / `.sw-b`). The h2 is a CUT — 0.008 of `--t`,
under the 1/120 step, endpoints 1.4× the width apart so the crossing floor is 0.7 rather than the
0.5 that complementary bands give — because two 66px Fraunces lines that both begin "The " cannot
dissolve. The lead pair was re-phased +0.085 to cross with it; before that the headline said "The
problem." for six consecutive frames while the paragraph beside it already read the answer.
**Retime one and you must retime the other.**

**Every figure is counted at build.** `buildCompare(root, variance, catalog, stages)` — 213
sessions, 1,640 puzzles, 5 stages, 10 levels, ages 5-14, all off `catalog.json` / `stages.json`.
The coach ratings, years and method lines are ADR-0014's authored illustration and print no
figure. The boards show the standard starting position, which is a fact about chess rather than a
bundle figure; S012's own FEN was there until 09-04 and came off with "dont make it focused on any
session".

**What came off, and why, so it does not come back by accident.** The per-beat minute rules and
then the 25/48/32-of-50 meters (both an invented apportionment, and the founder's reference had
neither). Coach B's numbered puzzle chips ("remove 1234 thing"). A 213-cell field and then five
per-stage rails of the same 213 — both were pictures of the catalogue when the frame owes the
reader the fix ("the pawn knight bishop rook queen and these blocks infront is js bad").

## Act 4, rebuilt 2026-09-04 — read this before touching `.ses-*`, `.ca-*`, `.con-*` or `.pane-*`

Rebuilt to a founder reference image (`.claude/image-cache/…/13.png`, 1672x941, cropped into
`.ref/crops/` by `.ref/crop.cjs`). The mock is a screenshot of `/teach` at S115 with a copy
column beside it and six labels around it. **The mock is the spec.** Where this build departs
from it, the reason is written below and nowhere else.

**What it is now.** Two columns in one pinned act.

*Left, `.ses-copy`:* the eyebrow "What you get" (green — `--pawn`, glyph and word), the headline
`.ses-h` "This is what / a coach sees." at its own `clamp(1.55rem, 3.1vw, 3.1rem)` and 1.24
leading, a lead, five `.ses-f` rows (a ringed `.ses-ic` square with an inline SVG, a title, two
lines), and `.ses-more` "Explore the curriculum" with a boxed arrow, same green, to `#curriculum`.

*Right, `.ses-fig`:* three rows — `.ca-top`, `.console`, `.ca-bot`. **Every one of those rows and
every rail child is placed with an explicit `grid-row`**, because half of them are `display: none`
at one window or another and auto-placement slides the `minmax(0, 1fr)` onto whatever is left.
That one mistake rendered the board 2x2px at all seven `board-is-a-board` windows and made the
plate content-sized — 356px of a 429px row — at 900x620.

*The console is the console `/teach` opens.* `.con-top` carries the lockup, the crumb, the title,
the segment counter, the three free-session chips (real links to `/teach?s=…`) and the two views.
Then three rails, whose class names are `gate.cjs`'s and must not change: `.pane-plan` (rail head,
the eight-segment `.con-flow`, the position/FEN panel), `.pane-board` (beat head, prompt,
`.con-beats` 1-8, the board, caption, key hint), `.pane-ctl` (THE FOCUS, THE ANSWER, STEP THE
SESSION, SEGMENT CLOCK). `.prep` is the same paper sheet as before, moved to the bottom-left so it
never covers the PREP control that opens it.

**It renders S115, position 4 of 8.** `main.js` passes `showcase.data.S115` and the flow comes from
`teach/segments.js`'s `buildSegments` — the same function `/teach` uses, so the eight rows and
their minutes cannot drift between the two routes. The board opens on `puzzles[3]`, S115-P4,
because that is the position the mock names. `AUTO_REVEAL` is 0.56, so the first half of the act is
the gated state the diagram is of; the forced line then plays over t 0.58-0.77.

**The plate does not take the paper lift.** `director.js` ramps `--fg`, `--fg-dim`, `--fg-faint`,
`--fg-inv`, `--line`, `--line-2` and `--glass` as the room lifts. The old console was `--glass` and
became a translucent ivory panel with mid-grey type on it. This one is opaque `--ebony`, so it is
an artefact rather than a surface in the room, and `.console` re-declares those tokens locally with
tokens.css's static equivalents. Every rule inside can keep saying `var(--line)`.

**The console wears its session's stage colour, and so does the room.** `--hue: var(--bishop)` is
set on `.ses-fig` — not on the plate, so the six labels share it — and `director.js:174`/`:280` now
pick `HUES[2]` for act 4 instead of `HUES[1]`: S115 is stage 3, the crumb says so, and
`director.js`'s own comment requires the light to agree with the data on screen. The local override
is still needed, because `--hue` is queen **gold** for t < 0.25 in this act — `sessionAct` does not
cross 0.5 until n = 4.25.

**Timing.** Copy rows `--f1..--f5` at t 0.010 / 0.045 / 0.080 / 0.115 / 0.150 over 0.055;
`.ses-more` `--fm` at 0.195. Callouts `--c1..--c6` at t 0.20 + k×0.05 over 0.06, so the last lands
at 0.51. They retract on `--z6..--z1`, **on `--t` at 0.700 + k×0.012 over 0.045, not on `--h`**: the
room starts lifting at t 0.62 and by t 0.80 the squares under those labels measure 0.185 relative
luminance against 0.019 at t 0.5. No ink survives both, so the labels leave first — all six are
gone by t 0.805 and the plate does not begin to fade until 0.773. The plate itself is on `--in2` /
`--in` / `--out` exactly as before.

**The top label band sits inside the nav's scrim, and that is measured, not guessed.**
`#nav::before` is 240% of #nav's own height; #nav measures 76.8px at 1600x900, so the gradient runs
to y 184 and the plate's top edge lands at 184.8. With the band flush to the pad, the three labels
measured **1.6:1** rendered (`tools/contrast.cjs` strips `text-shadow`, by design). Two things fixed
most of it: `--bishop-hi`, a legibility tint declared in tokens.css with its reasoning, and
`.ca-top { padding-top: clamp(8px, 4.4vh, 44px) }`, paid for by widening `.ca` to 240px so every
gloss in both bands is two lines rather than three. Now **2.8-4.8:1 top, 4.5-6.8:1 bottom**. The top
three still do not reach AA and cannot: pure white through 0.43 of that gradient tops out near
4.9:1. See open decision 13.

**Board sizes, `FRAC=0.8 node .audit5/boards.cjs <w> <h>`:** 1920x1080 380px · 1440x900 274px ·
1600x900 241px · 1244x620 214px · 981x620 146px · 1219x543 145px · 390x844 155px · 900x620 103px.
The floors are `board-is-a-board`'s 64px and 8px a square, and both fractions are checked because
the caption gains a clause at t 0.8.

**The responsive ladder, and what each step spends.**
- **≥1180 wide:** the mock. Two columns, six labels with glosses.
- **≤920 tall (≥901 wide):** panel and rail metrics tighten; the prompt caps at 5 lines.
- **≤800 tall (≥901 wide):** `.ca-n` goes — the labels are what makes the act a diagram, the glosses
  are not. Same trade the four-callout build made at 660.
- **≤700 tall (≥901 wide):** the prompt caps at 3 of its 5 lines, inside its own scroller.
- **901-1179 wide:** the split stops being a split. The copy becomes a head above the plate
  (headline left, lead right), the five rows run across it as icon + title, the glosses go.
- **901-1179 wide and ≤760 tall:** the five rows go too. At 981x620 the head and the two bands took
  234px of a 542px pad and left the board 73px; without them it is 146px.
- **≤900 wide:** no diagram — six leaders at 900px is a tangle. The bands go, the copy column keeps
  the argument, the console stacks to header / board / controls with the controls rail bounded at
  42% and scrolling inside it (`.clipped` fades its foot), and `.pane-plan` goes: every line on it
  is on the prep sheet, one control away in the same console.
- **≤900 wide and ≤820 tall:** the lead and the five rows go, and the headline takes the step act
  4's own `.d3` used to take here.
- **≤600 wide:** the lead and the rows go at any height — 48px of board with them on at 390x844,
  155px with them off — and THE FOCUS panel goes.

**What the mock asks for that this page did not have, and what was done about it.**
- **A radius.** `.console` is 14px (10px below 901), the five icon squares are 6px, the six leader
  dots are circles. Before this the whole page had two `border-radius` declarations, both 2px, and
  act 4's own nested-panel note read "no radius, no shadow, no fill". Copied anyway.
- **Five hues at once** — bishop, pawn, gold, knight and a neutral, as decoration, while the GL room
  light sits on one of them. Every value is a token; the one-live-`--hue` architecture is not what
  the mock draws.
- **`60 MIN PLANNED · 42 TIMED`.** `/teach` ships this string. `console.js` used to refuse the ratio
  in writing — "a ratio here reads as a shortfall in the one act whose job is to show the artefact
  is finished". The mock reinstates it; 42 is a true sum for S115. Reversed knowingly.
- **`/teach`'s board squares** (#e8dcc4 / #a98a63), so the same position reads the same on both
  routes. Act 1's board keeps #cfc3ac / #6f6152 — its 28 arrow marks are measured against exactly
  that pair — so `acts.css`'s claim that they match act 4's is corrected in place.
- **Three copy lines changed, and only these three.** "Teach, prepare, or present" → "Teach or
  prepare — the same session, both ways", because there are two views. "Plan, assign, and track
  every student's journey" → "Plan the hour, assign the homework, and know what comes next", because
  nothing assigns or tracks and there are no child accounts. "50-minute sessions" → "50 to 75
  minutes a session", because `catalog.json` runs 50-75 with a mode of 60 and the left rail of the
  same figure says 60. Every other string in the mock ships verbatim.
- **Act 5's console card followed the session.** `bento.js` printed S042's "47 min in five parts"
  one scroll later; it now prints S115's 42 and the same five timed rows.

**Traps this rebuild paid for, on top of the ones above.**
- `container-type: size` on `.b-slot`, not `height: min(100%, 100cqw)` on the board. A percentage
  height inside a `place-content: center` grid resolves against a row the item itself sizes, and the
  board came out 0x0.
- `[hidden]` has no rule on `/`. Anything given a `display` here has to say what hidden means for
  itself — `.sol-body`, `.prep` and `.reveal` all do.
- `.pane` is `overflow: hidden`, never `auto`: `console-panes-fit` asserts five windows at exactly 0.
  Everything that can grow scrolls in a CHILD — `.con-flow`, `.b-prompt`, `.sol-body` — so the pane
  the gate watches never reports a pixel.
- The gate goes QUIET, not red, if a rail is renamed: `console-panes-fit` filters nulls before its
  predicate and `board-pane-fits` is the file's only conditional `record`, so nine assertions
  vanish and the run prints "45/45 pass" and exits 0. Nothing asserts `results.length`.

## Traps that have cost real time here

- **A text-mode python write flips the whole file LF→CRLF.** Pass `newline=''` both ways and assert
  the byte count.
- **Bash heredocs mangle backslashes and silently truncate** past ~60 lines. Use small asserted
  `python -` edits, or the Write/Edit tools.
- **Whitespace in the markup is not always a space.** Act 0's h1 held a U+200A hair space and an
  exact-match edit against a plain space matched zero times.
- **`product.css` loads AFTER `acts.css`,** and `product.css:224` colours `.mono`, `.kicker`,
  `.ticker span` and `.coord` `--fg-faint`. A single-class `color` rule in `acts.css` on any element
  carrying one of those classes silently loses the tie. Prove colour with `cssom.cjs`, never by
  reading the file.
- **Small type over the lit board fails contrast.** Anything under ~10px needs `--fg-dim` at
  minimum, and a plate if it can have one. Measure with `contrast.cjs`; the P28 wash means rendered
  is 20-35% below declared.
- **A new element with no reveal band is on screen from the act's first frame,** and nothing will
  tell you. `.cv-title` lost its rule in a rebuild and the wordmark "Efhaam" sat over the three
  coach cards for the whole comparison; `.cv-fix` had no band and painted its 1px hairline across
  them from t 0. Before shipping any element in a pinned act, grep it for an `opacity:` band.
- **`scrollHeight > clientHeight` with every child inside the box means the FONT overflows its own
  line box.** Fraunces at `opsz 72` inks past a 1.02em (and a 1.1em, and a 1.18em) line — 1.24 was
  the measured floor. Isolate it by hiding one child at a time; the parent that reads 0 is not
  proof the child is clean, and `tools/gate.cjs` asserts several of these boxes at exactly 0.
- **An absolutely-positioned `::before` with negative insets adds its bottom and right bleed to the
  parent's scrollable overflow.** A -10px/-14px scrim bled 14px of vertical and 12-17px of
  horizontal overflow into `.cv-col` and 7px into `.converge`. Use a `background` on the element.
- **An `auto` grid column takes its children's largest min-content contribution.** One unbreakable
  Fraunces word ("Unexplained.") stretched a 320px card 15px past its own plate. `minmax(0, 1fr)`
  on every single-column grid in a narrow card.
- **Grid `align-content` defaults to stretch,** so a column shorter than its row spreads the slack
  BETWEEN its own rows. That is what knocked one of three boards 7px off the line at 390x844;
  `align-content: start` collects it at the foot instead, where there is nothing to see.
- **A container query measures the CONTENT box.** `@container (max-width: 225px)` fired on a 248px
  card because its content box was 224px, and hid the avatars nobody asked to hide.
- **44 `1fr` columns do not divide a 250px track cleanly** — 1-2px of phantom horizontal overflow
  that no gap change fixes. Not in the gate's box list; do not add a box that reports it.

## Open decisions — the founder's, not the next session's

1. **Act 1's headline — SETTLED by the founder on 2026-09-04, and worth a second look.** It ships
   as two states, "The problem." then "The solution.", on their instruction ("replace the hour is
   whoever teaches it with something like THE PROBLEM" / "it still says the problem but this is the
   solutionn"). A reviewer's objection, on the record and not acted on: both lines are the weakest
   copy on the page, "The solution." is the one string here that could be pasted onto any B2B page
   unchanged, and the change promoted a 10.5px kicker label into 66px of display type without a
   rewrite for the size. Its counter-proposal was to hold the SUBJECT constant so the pair reads as
   one sentence changing its predicate — "The hour is whoever teaches it." then "The hour is
   written." — which would also repair the accessible name (see 10). Yours to judge.
2. **Act 1's two crossfades — RESOLVED 2026-09-04.** The h2 pair is a cut and the lead pair was
   re-phased +0.085 to cross with it; `chaos-claim-always-legible` now walks the engine's own k/120
   grid over both pairs instead of sampling 0.05 steps over one. The lead pair still superimposes
   four line-boxes over four for ~0.08 of the pin at its own crossing, at a measured 0.667 floor;
   that part is unchanged and still a choice. Options for it, unchanged: shorten both to two lines,
   or give them separate vertical slots (~32px, which the head has spare).
3. **Ages 5–14 or 5–12.** The hero says 5–14 because stage 5 (Queen, S174–S213) is `ageBand` 11-14
   and act 3's own panel prints "ages 11–14". `00-product-blueprint.md:9` and
   `04-brand-identity.md:161` both publish 5–12. If the front door should say 5–12, what disagrees
   is the bundle and act 3, not the hero.
4. **Four verification claims are still unscoped** — `bento.js:77` and `:79`, `chrome.js:110`,
   `teach/main.js:678` and `/teach`'s meta description. Act 0 is scoped; they are not, so the page
   currently disagrees with itself one screen apart.
5. **`210 hours of class`** now lives only in `bento.js:32`, inside a `.drill-foot` that is hidden
   below 901px wide. Act 7's `12,575` minutes is the same datum if you want it back.
6. **The hero ticker's `0` and `S001–S213`** put their meaning in a 9.52px label — smaller than the
   10.56px kicker the audit called act 0's central defect.
7. **P28**, the legibility wash: the scrim quad sits in the front GL pass, so every glyph renders
   ~20% dimmer than declared. Moving it to the back pass changes no design value and lifts every
   surface at once. **P27**: the ladder's eight rung buttons are 27x19 on an 18px pitch and fail
   SC 2.5.8; the measured fix grows the rail 184→226px.
8. **A boot failure still yields a blank page.** `body.gl-failed` restores height, opacity and
   transform but never `visibility`, and `base.css:90` is the only `visibility` rule in the sheet.
   One declaration: `body.gl-failed .act-stage { visibility: visible }`.
9. **No currency is documented** anywhere, and prices publish as USD on the terms act.
10. **Act 1's section name reads "The problem. The solution." at every scroll position.** Opacity 0
   does not remove text from the accessibility tree and neither headline span is `aria-hidden`, so
   no frame of the act produces a name that matches what is on screen. Fixing it with a per-frame
   `aria-hidden` write would break the act's own no-JS-per-frame contract; fixing it in the copy
   (see 1) would not. The same is true of every other opacity reveal in the act — the coach
   verdicts and the closing pair are all still in the tree at t 0.70 — so this is the architecture,
   not this change, and the heading is simply the one surface where it shows.
11. **Act 1 prints two age bands one frame apart:** the kicker's "ages 5–7" (S012's, from
   `variance.json`) and the answer card's "ages 5–14" (counted off `catalog.json`). Both survive a
   count, so the figure rule is satisfied; they just disagree on screen. One word fixes it if it is
   wanted — "this session · ages 5–7" — and it is entangled with decision 3.
12. **Act 4's radius is the only radius on the page.** The founder's reference draws a rounded plate,
   five rounded icon squares and six circular leader dots. Before 2026-09-04 the whole site had two
   `border-radius` declarations, both 2px, plus one set to 0 on purpose, and act 4's own note said
   "no radius, no shadow, no fill". Copied from the mock as instructed. If the radius stays, the
   other panel surfaces — `.cell`, `.cmp-card`, `.stage-panel`, `.scrub`, `.t-panel` — are the
   inconsistency, not act 4.
13. **Act 4's three TOP callout labels cannot reach AA where the composition puts them.** `#nav::before`
   is 240% of #nav's height of near-opaque gradient, so it runs to y 184 and act 4's plate starts at
   184.8 — the whole top band is inside it. Measured with `tools/contrast.cjs`, which strips
   text-shadow: 2.8-4.8:1 for the top three against 4.5-6.8:1 for the bottom three, and pure white
   through 0.43 of that gradient tops out near 4.9:1, so no ink fixes it. Three levers exist, all
   with a price: another ~40px of `.ca-top` padding (about 40px of board), shortening `#nav::before`
   (shared chrome — every act's kicker sits in it and every kicker measures ~2.1:1 today), or
   dropping the top band to labels alone. Yours to judge. Note the same gradient is why act 4's own
   eyebrow measures 2.2:1 rendered against 6.7:1 nominal.
14. **Act 4 spends five stage hues at once.** `tokens.css` says the five are curriculum data, one per
   stage, and "gold is reserved for promotion"; the GL room light carries exactly one of them at a
   time. The mock's five feature icons use bishop, pawn, gold, knight and a neutral as decoration
   inside a single act whose room light is bishop. Every value is an existing token, so the letter of
   "no new palette VALUE" holds; the spirit is the founder's call.
15. **Act 4 reinstates a ratio the code refused in writing.** `60 MIN PLANNED · 42 TIMED` is
   `/teach`'s own shipped string and 42 is a true sum for S115, but the old `console.js` deliberately
   printed "60 min planned / 5 timed parts" instead, because "a ratio here reads as a shortfall in
   the one act whose job is to show the artefact is finished". The mock prints the ratio. Reversed
   knowingly; say the word and the count comes back.
16. **`--bishop-hi` is a new token.** #c9b3ec, a legibility tint of `--bishop`, for act 4's six
   callout labels and nothing else. Same precedent as `--gold-hi` and `--fg-rung`, and the reasoning
   is in `tokens.css` beside it. If decision 13 is resolved geometrically instead, this can go back
   to `--bishop` and the token can be deleted.
