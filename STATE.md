# STATE — read this first

## 2026-09-06 (later): the curriculum QA landed — the bundle was re-exported and every figure re-counted

The founder ran a final QA pass on ChessCurriculumProject (2026-09-05, 245 files, uncommitted
in that repo) which **restructured the teaching flow**: the first guided example of ~170
sessions moved into a new `core_explanation.demonstrations` card, warm-up review items
carrying FENs became the norm, puzzle contents were swapped (295 of them different
positions), and two model games were added. The founder's own table decodes exactly against
the tree: positions 2,630 → **2,927** (1,640 puzzles + 297 demonstrations + 345 guided
examples + 645 warm-up items, each a FEN-bearing card; 2,927 is card count, not unique
FENs); graded puzzles still 1,640 with 295 different positions inside them.

What was done here, in order:

- **The chain was re-run end to end**: `build-indexes.js` → `export-bundle.js --version
  1.1.0` → `npm run bundle:validate` → `bundle:showcase` / `bundle:catalog` / `bundle:stages`
  / `bundle:variance` (all `--out app/data`, the generators' own `--out` flag), then
  `tools/inventory.cjs` recounted. `showcase.json` had gone STALE — S115's teaching flow no
  longer matched the repo (its guided example had become a demonstration card) — and
  `catalog.json`'s concept/objective/minutes fields had drifted in 112 sessions. All
  regenerated; the eleven pages rebuilt byte-identical because none of the changed fields
  reaches a printed surface.
- **The figures that moved on the site:** check C is now **4,751** checks (3,111 FEN
  legality + 1,640 solution lines) — printed on the landing ticker, act 0's proof list, act
  2's panel foot, and `/about`; unique positions **2,346** (was 1,996) — act 0's proof list.
  `gate.cjs`'s `pages-figures-count` allowlist was updated with both. The bundle validator's
  drift picture improved: 147 → 124 non-conformant sessions (the QA fixed 23 that were
  baselined) and `validate.js` in the curriculum repo now runs the schema check itself.
  Checks B and D still fail — that is upstream drift, documented in README, unchanged here.
- **The minutes disagreement closed**: inventory 12,630 vs catalog 12,575 was the QA'd tree
  vs the stale bundle; re-exporting made catalog sum to 12,630 too. The pages still print
  `210 hours` (both support it), not the minutes.
- **`demonstrations: 642` in inventory.json** is 297 core-explanation demonstration cards +
  345 guided examples — the field has always counted both, and the QA's split of the same
  two into separate table rows does not change what the field means. No page prints 642
  except via `D.demonstrations`, which is alive in `data.cjs`'s derivation list.

## 2026-09-06: the plain-copy pass — the register is settled, do not write it back

The founder called the copy register out twice in one day ("weird word play going on
across the site that confuses the user" / "these feel like riddle wordplay u can be more
straightforward"). What shipped from that, all browser-verified, gate 76/76:

- **The word "written" is no longer a label anywhere.** It was on ~30 surfaces (hero
  kicker, ticker, proof list, every footer, robots.txt, five OG cards, page H1s and
  figure strips). The label is now "complete", "ready to teach" or "in total". The word
  survives ONLY where it argues: about's thesis ("written down 213 times"), "Five things
  that vary when nothing is written down", "When the hour is written, cover is a reading
  task", "A written curriculum, licensed to an academy", "Reading the session replaces
  writing it". Do not reintroduce it as an adjective for the product.
- **Act 1's five beats are plain declaratives now.** "Each week starts / with an empty
  hour." · "Every session is / built from scratch." · "Nothing tells you / what comes
  next." · "Plenty of material. / No curriculum." · "Eventually, / planning takes over."
  The `.sb-h` slot is ~393px wide at 1440 and the old beats already wrapped to 3–4 lines
  there, so do not judge a beat by the author's line breaks — measure it
  (`node tools/meas.cjs 1440 900 1 <t> '.sbN .sb-h'`); three lines is the act's norm.
- **Act 5's mock copy is superseded for everything but the lead.** The founder's rule
  "the mock is the spec" was overridden by their own instruction on 2026-09-06 —
  "A step-by-step learning experience…" is the ONE string kept verbatim from the
  reference; every feature title, body and callout around the console is now plain
  ("Nothing to Plan", "Puzzles Included", "Timed Sessions", "Where You Are", "The Eight
  Steps", "Copy Any Position", "The Answer Key"). Bodies hold 2 lines at ≥1180px; the
  row-2 body that ran 3 was shortened to fit. STATE's older "only these three lines
  changed" note is history.
- **Act 6** reads "Everything in the session / is already prepared." (the lead and
  payoff sentence were already plain and stayed); **act 2**'s claim is "Planned once.
  Taught the same." and its eyebrow "213 of 213 ready to teach"; **act 3**'s scrub says
  "one session, in full"; the **hero lead** opens with the GEO sentence: "Efhaam is a
  complete chess curriculum for academies — …", which grew the stage past the fold at
  1920 and had to be tightened; the hero-fit assertions are the ones to re-run after
  touching that lead.
- **The supporting pages were edited at the generator and rebuilt** (never hand-edited):
  footers and robots now say "a complete chess curriculum for academies"; the coaches
  nav label is "The planning is already done"; `/inside-a-session`'s H1 is "A session is
  not a topic. It is a full hour, ready to teach." and its questions section "The
  questions come with the session"; the academies gradebook note is "The assessment is
  content, not software."; the coaches "Five steps become five different steps" heading
  is "What Sunday night becomes"; metas were de-tic'd and given "ready to teach" /
  "included" / "No planning needed", with the keyword phrases ("chess lesson plans",
  "chess academy curriculum", "chess curriculum") intact. OG cards re-shot; sitemap
  unchanged.
- **The SEO/GEO rationale:** the first sentence of the front door and `/curriculum` now
  name the entity, the category and the numbers in one declarative sentence, which is
  the shape answer engines quote. If "geo" ever means *geographic*, no location is
  documented anywhere in the product and none may be invented — ask the founder for the
  target regions before writing any.

## 2026-09-05: an act was inserted. Every act index below this note is the OLD one.

`sunday` is now act 1, between `threshold` and `chaos`, on the founder's explicit
instruction. That overrides the "no act added, removed or reordered" rule further down —
the rule stands for everything else, and this is the one exception, recorded here rather
than quietly edited away.

`n` is act index + local progress, so inserting at index 1 moved the whole film one unit
up the narrative axis. **Everything in this file written before 2026-09-05 uses the old
numbering.** The map, once:

| old | new | act |
|-----|-----|-----|
| 0 | 0 | `threshold` |
| — | 1 | `sunday` &nbsp;*(new)* |
| 1 | 2 | `chaos` |
| 2 | 3 | `spine` |
| 3 | 4 | `stages` |
| 4 | 5 | `session` |
| 5 | 6 | `system` |
| 6 | 7 | `terms` |
| 7 | 8 | `promotion` |

What moved with it, all verified by `node tools/gate.cjs` reading 61/61:

- `ACTS` in `director.js`, and the DOM order in `index.html` — these two MUST agree or
  `narrative()` returns a non-monotonic `n` and the camera snaps backwards. Nothing
  asserts it.
- Every `at` in `SHOTS` at or above 1.00, plus eight new keys for 1.00–1.94.
- 23 `band()` / `window_()` / comparison thresholds in `director.update()`. Not a
  find-replace: 148 numeric literals in that function are ≥ 1 and only 71 are in `n`
  space. Two were partial — `debris.presence` and the first `atmos` window rise in act 0
  and fall after the new act, and `debris.presence` was moved to 1.90–2.04 rather than
  shifted, so act 2's paper does not arrive on top of act 1's overload.
- `main.js`'s readout suppression (`n > 5.7 || n < 4`).
- **`chrome.js`'s rank ladder, which was the silent one.** It mapped `n / ACTS.length` onto
  eight rungs; with nine acts that still produced a valid `d1`–`d8` with no error, but rung
  5 landed on `session` and act 4 `stages` had no rung at all. It is an authored map now
  (`RUNG_ACT`), and `promotion` has no rung of its own — correct, because promotion is what
  happens *past* rank eight.
- **`tools/gate.cjs` parks by act NAME now, not by index.** Ten assertions were pointing at
  the act next door, which is a false PASS and worse than a failure.
- Stale comments that named an act index: `debris.js`'s "idx is 0 for all n < 3" (now 4)
  and `compare.js`'s "t = LAST = 0.40, which is n 1.40" (now 2.40; the value is act-local
  `t`, so that one was only ever a comment).
- The `.audit5/` act-1 instruments still take an act INDEX on argv, so the recorded
  invocations further down this file now point one act early. They were not rewritten.

New files: `app/js/gl/load.js` (the act's material, its stacks and its thirty candidate
moves), `app/js/ui/sunday.js` (the product strip, built from `showcase.json` S115 and
`catalog.json`). New CSS lives in the `ACT 1 — the week before the lesson` block of
`acts.css`. `board.js` gained `setTileGlow`/`clearTileGlow` and `unrest`.

Its own instruments live in `.tmpwork/` (gitignored, like `/shots`):

```sh
node .tmpwork/shootn.cjs <tag> <w> <h> "1.04,1.30,1.58,1.74,1.90"   # shoot by narrative n
node .tmpwork/bands.cjs 1200        # what --t actually is after a park, and every band there
node .tmpwork/payoff.cjs <w> <h> '[null]'   # pawn / lit rank / strip screen positions
node .tmpwork/reduced.cjs           # the act under prefers-reduced-motion
node .tmpwork/boot.cjs              # act geometry, the strip's real text, console errors
```

`bands.cjs` is the one that matters. Parking and reading a computed style 90ms later measures
a position the damped engine has not arrived at yet: it reported 32 of 92 frames with no
legible beat where the truth was 3, and the gate assertion built on it was wrong twice before
it was right. Nothing about a reveal band is true until `bands.cjs` prints it with a settle of
at least 300ms.

Three things about the act worth knowing before touching it:

- **It owns the RANK; act 2 owns the FILE.** A file is the curriculum, a rank is one hour —
  eight squares, which is exactly the eight segments S115 is written in. Do not converge
  anything onto the d-file here: act 2's ignition depends on that file being empty until
  its own `converge`.
- **The camera stops before the material lands.** Keys 1.76 and 1.90 are a near-held pair,
  and `resolve` runs 1.76–1.83 underneath them. A lens moving through the snap makes the
  resolution read as something the camera did.
- **The beats CUT, they do not dissolve.** Ramps are 0.016 wide with a 0.008 gap, for the
  reason the act-2 head-swap note gives: two lines of Fraunces at this size superimpose.
  At 0.030 neither line was above half opacity for 0.034 of t at every crossing — 214px,
  measured, five times.


**The site is as-is from 2026-09-01. No more audits, no more review loops, no more build orders.**
Changes are made one at a time, on request: "change X to Y". Nothing on this page needs a plan.

This file replaces `FIXPLAN.md`, `HANDOFF.md`, `PITCH.md`, `RESUME.md`, `PASS2.md`, `findings.md`
and 236 other planning, review and log files. They are all in `.archive-2026-09-01/` if a decision
ever needs its paper trail. `README.md` still holds the architecture: the nine acts, the scroll
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

**There IS git now, as of 2026-09-04, and it changes this whole section.** The tree is a repo
on `main` at `https://github.com/Efhaam1/NewSiteDesign` (private, owned by Efhaam1), one commit,
`e67e98c`. So `git diff`, `git stash` and `git checkout -- <file>` all work, and they are cheaper
than everything below. Identity is set LOCALLY on this repo only (`Efhaam Ahsan`,
`112851287+Efhaam1@users.noreply.github.com`) and the global git config is still empty;
`core.autocrlf` is `false` and `.gitattributes` pins `eol=lf`, because a line-ending flip is on
the trap list further down.

What git does NOT cover: `.gitignore` excludes `/shots`, `/.bak`, `/.audit5/snap`,
`/.archive-2026-09-01`, `/research` and the generated output, so the two rollbacks below and the
paper trail are still local-only and still the only copies that exist. The commit predates
nothing — the whole history before 2026-09-04 is in those directories, not in git.

`.audit5/snap/` is the other undo.

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
node tools/sysfit.cjs [wide|phone|all] [fracs]    # act 6: stage overflow, every box, the fold
node tools/inventory.cjs --check                  # act 6's figures still count off the 213 files
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
  three times and re-lays-out all nine acts.
- Design is settled: no new palette VALUE, no typeface or type scale change. "No act added,
  removed or reordered" held until 2026-09-05, when the founder asked for act 1 `sunday`; see the
  note at the top of this file. It is not a standing licence to add a tenth. The 3D, the piece transformation, the camera path, the pinning and the reveals stay.

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

## Act 7, rebuilt 2026-09-05 — read this before touching `.rate-*`

It was a ruled ledger: five bands, cheapest first, hairlines, one prose column per band. A
founder reference replaced it with a card grid ("redo the pricing section use this reference img
i want nice and traditional card based pricing"), and the standing instruction applies — copy it.
`rate.js` and `terms.css` were rewritten; `pricing.json` gained one field.

**What came from the mock.** A centred head. A pill billing control with the live segment on a
raised chip and the discount as a note in the same track. Four equal cards in one row. The
recommended card lifted out of the row on both edges, tinted, on a coloured edge, with a badge on
the plan name's line. The last card inverted to an ink plate with a light button. A tick list per
card. A full-width plate at the bottom of every card. A radius — 10px on the cards, 6px on the
plates — on the precedent decision 12 records: when the founder's reference draws a rounded plate,
the plate is rounded.

**What did not, and why.**

- **Five bands, four cards.** The six-week pilot is an offer, not a tier. It keeps the ruled-off
  strip under the row that it has always had, and it still has no button, because `/pilot` has no
  route (README, "links to nowhere"). It is also the one price the control does not touch, so it
  carries no yearly figure and the P5/P24 exception it needed for one is gone with it.
- **The badge says what we know.** The mock's says "Most Popular". Growth keeps the chip it
  already had — "What the pilot runs on" — in the badge's position.
- **The buttons say what they do.** The mock's say "Get started". There is no signup, so all four
  carry the site's one CTA to `/teach`, each with an `aria-label` naming its own licence, and the
  `no email, no card` line sits centred under the row they share.
- **The tick rows invent nothing.** `items` in `pricing.json` is each band's own `adds` sentence
  itemised, clause for clause. The sentence survives as `addsShort` and takes the column back
  below 732px of height, so no window ever loses a claim — it reads it as prose instead of as rows.
- **The control swaps a pair, not an emphasis.** Monthly reads `$39 a month` over
  `$390 a year`; yearly reads `$390 a year` over `$32.50 a month`, which is `effective` in
  `pricing.json` and the figure a buyer compares. Printing the monthly PLAN price under the
  yearly one as well — which is what the ruled ledger did — put two different `a month`
  figures in one card. Two lines in both states, so the card does not change height when
  the control is pressed, and the default state still carries the whole schedule.
- **Nothing gets a tick that is not built.** Ledger note 2 lists what is not built yet, and
  a ticked row reads as shipped in a way a prose sentence does not: Growth's owner dashboard
  and academy naming and Scale's exports now carry Starter's own qualifier, "when it/they
  ships". Enterprise's `SSO and localization are planned, not built` came OUT of `items` —
  a checkmark beside a negation contradicts itself — and is the card's `aside` instead,
  which is the same slot Growth's ROI line uses and carries no mark. `addsShort`, which the
  short windows print instead of the rows, was rewritten to carry every claim the rows do.
- **Ink still comes from the ramp.** Every colour resolves from `--fg`, `--fg-dim`, `--fg-faint`,
  `--line`, `--glass` and `--hue`, so the sheet turns with the room. The inverted card is the
  room's own inverse rather than a hardcoded black: it sets `background: var(--fg)` and re-points
  six `--c-*` tokens at the other end of the ramp, which is why no rule inside a card is written
  twice. `--fg` itself is deliberately NOT overridden there — overriding it would make that
  element's own `background: var(--fg)` resolve to the ivory end.

**The height ladder is new and it is measured.** `node tools/tsweep.cjs [wide|phone]` reads the
stage's own overflow and the sheet's lowest ink against the fold in both billing states. Act 7 is
a pinned 100vh stage and the card row is the tallest thing on it, so before the ladder every
window under about 935px of height overflowed: +16 at 901x891, +70 at 821, +120 at 1001x721, +208
at 901x620, +241 at 1920x580 — and the overflow is a function of HEIGHT, not width (+72 at
1920x821 against +70 at 901x821). Five height blocks at 901px and up, cheapest first: spacing,
then the head's lead and the sheet's provenance, then a step on the headline and the invariant's
second sentence, then the tick rows become `addsShort` and the footnotes go, then the spacing
floor and Growth's ROI line. 28/28 wide windows and 13/13 phone windows clean.

**A phone keeps the cards and scrolls them sideways.** Four cards will not stand side by side
under 901px and four stacked is 1,100px on an 844px stage, so `.rate-list` becomes an inline-axis
scroller with `overscroll-behavior-x: contain`. Two sizing traps came with it, both now fixed in
`terms.css` and both worth knowing about before adding another scroller to a pinned act:
`grid-auto-columns: 66%` is circular during intrinsic sizing and falls back to the items'
max-content; and `overflow-x: auto` gives a box an automatic MINIMUM size of zero but does not
change what it CONTRIBUTES to an ancestor's intrinsic width. Between them, `.pad` measured 1,189px
on a 390px viewport and the stage carried 799px of horizontal overflow. The fixes are a `vw`
track and `minmax(0, 1fr)` on the stage column and on `.pad`'s own implicit column, scoped to
`.act-terms`.

**Its own instruments**, both zero-install like the rest of `tools/`:

```sh
node tools/terms.cjs <tag> <w> <h> [t] [annual]   # park act 7, shoot it, print every card box
node tools/tsweep.cjs [wide|phone|all] [t]        # the ladder: overflow and lowest ink, both states
```

`interact.cjs` gained the billing pill: it presses it and checks that the promoted figure changes,
that neither figure leaves the page, that `aria-pressed` follows, that the card row does not change
height under the reader, and that the inverted card keeps its own figure promoted. It also stopped
parking act 2 by INDEX — `acts[1]` has been `sunday` since the insertion, so its dial read threw on
a null and took steps 3 to 5 with it. That dial block is stale in a second way and is now guarded
rather than fixed: `.improv-cost`, `.dial-card` and `.beats .beat` are not in the DOM at all any
more, and re-pointing it at act 2's current instrument is a separate job.

**Three cascade traps this act found, all of them the same shape — a later or more specific
rule in this file quietly beating product.css or itself.** Worth reading before adding a rule
to `terms.css`:

- **`background` on a `.cta` deletes the plate.** product.css:166 puts the milled face on
  `background-image` (the radial gradient whose light source is `--mx`/`--my`), so
  `background: var(--c-plate)` on the card button reset it to `none` and the four plates were
  flat fills at rest — the face came back only on `:hover`, where product.css re-declares the
  image. `background-color` is the only safe way to refill a `.cta`.
- **A card's own resting shadow ties with `:hover`.** `.rate-band.is-fit` and
  `.rate-band.is-invert` are (0,2,0), the same as `.rate-band:hover`, and they are declared
  later — so the two MARKED cards were the only two whose shadow did not open under the
  pointer. Both now have (0,3,0) hover rules.
- **`.mono` reaches inside a card and undoes its ramp.** product.css:107 colours `.mono` with
  the PAGE's `--fg-faint`, which beats anything inherited from a parent: the caption line
  under the pill kept rendering at 2.12:1 after `.rate-cap` was set to `--fg-dim`, and the
  units beside the demoted figure rendered in an ink-side grey on the inverted card's plate.
  Any `.mono` element inside this act needs its colour declared on its own selector.

**Two gate assertions were retargeted, not relaxed.** `terms-explains-bands` counted one CTA and
now counts four plus the micro line; `terms-cta-on-stage` measured one button and now measures the
lowest of the four. Both read PASS at 61/61.

## Act 6, rebuilt 2026-09-05 — read this before touching `.sy-*`

It was an eight-card bento: curriculum, teaching console, puzzles, checkpoints, two tracks,
print pack, child privacy, every coach — a paragraph in each box on the plan-view paper
board. Every card was true. The founder's verdict was that the section was a specification
sheet on the one screen whose job is to make an academy want the thing, and that it was
*wrong twice*: the tracks and the printable homework were both being sold as unfinished.
The whole act was rebuilt. `bento.js` and `tools/bento.cjs` are gone; act 6 is authored in
its own file, `app/css/system.css`, which loads LAST for the same reason act 4 moved to
`annot.css` — the plate, the six figures, their leaders, the ream and the pathway control
are all measured against each other and belong in one place.

**What it is now. One object, six figures, and a turn.**

The middle of the stage holds S115 as an opaque **ink plate** (`.sy-core`) — the artefact a
coach teaches from — standing on the paper room the parent and the photocopier get. That
figure/ground inversion is the film's own tonal cut used as composition rather than
decoration: the act is entirely on the paper side (`lift` reaches 1 at n 6.06). The plate
carries a real `Board2D` at **S115-P4**, the same position act 5's console opens on; the
crumb; the title and subtitle; the sessions it is taught after; the **eight parts of the
hour** as an equal-width rail with the authored minutes and `60 MIN PLANNED · 42 TIMED`;
the **eight positions as graded chips**; and the **three delivery pathways** as a live
control.

Three figures a side (`.sy-sat`), each joined to the plate by a hairline leader that draws
itself out of the label — annot.css's callout construction turned ninety degrees. Each is a
real count off S115: the hour's 8 parts, its 8 graded positions, its 6 questions to ask, its
16-minute activity, its 15 minutes of homework, its 5 coach notes.

**Then the turn, and it is the only thing this act does.** From t 0.53 the plate fans out
into a **ream** of itself and, in a wave staggered 0.014 apart, all six figures **CUT** to
the curriculum's own totals: 8 parts → **1,701**, 8 positions → **1,640**, 6 questions →
**1,247**, one activity → **213**, 15 minutes → **4,243**, 5 notes → **213**. The six
labels do not move and the sentence under each one changes. The reader is not asked to learn
a second diagram; they learn the one they just read is every session.

**Two new data files, and both are the product's, not this repo's.**

- `app/data/pathways.json` is **copied verbatim** from
  `ChessCurriculumProject/curriculum/pathways.json` (generated 2026-09-05). Three delivery
  tracks over one syllabus — A Foundation 5–7 at 45 min, B Standard 7–9 at 60, C Accelerated
  9–12 at 60 with Stage 1 in 24 classes instead of 41 (17 of them paired) — plus the full
  24-row accelerated map and `from S042 all tracks converge`. `docs/PATHWAYS.md` in the same
  repo is the authored form of it.
- `app/data/inventory.json` is **generated** by the new `tools/inventory.cjs`, which counts
  the curriculum repo's 213 authored session files. `node tools/inventory.cjs --check`
  re-counts and exits 1 on drift — and it earned its keep the same day: all 213 session files
  were rewritten upstream at 21:28 while this act was being built, and `--check` caught it.
  Four figures moved (Foundation/Core/Challenge 556/649/435 → 557/646/437, demonstrations
  639 → 642, homework minutes 4,572 → 4,243, minutes planned 12,575 → 12,630) and the page
  re-printed all of them from the regenerated file with no edit to a single string. **Run
  `--check` before trusting any figure in this section.** Same contract `catalog.json` has — a script's output, never
  edited by hand — and it exists because `catalog.json` carries metadata only: no
  `teaching_flow`, no puzzle tiers, no homework, so a roll-up cannot be counted from
  `app/data` alone.

**EXPLORER / CHALLENGER, ON THE FOUNDER'S RULING — and the disagreement behind it is worth
keeping.** What the curriculum repo shipped on 2026-09-05 is `pathways.json`: **three**
tracks named Foundation / Standard / Accelerated. Explorer and Challenger are ADR-0004's
names (`CurriculumWebsite/docs/decisions/0004-two-track-delivery.md`, accepted 2026-07-26,
still unamended) and that ADR's *mechanism* was never executed — its own plan document opens
"**Status: PLANNED — no session files have been touched**", `curriculum/track_map.json` does
not exist, no session file carries a track key, and the string "Challenger" occurs nowhere in
the curriculum repo. The act was built on the product's three first; the founder was shown
that finding and ruled **"explorer vs challenger 2 paths are good enough"**. So the control
is ADR-0004's two, and the ruling is recorded here rather than argued again.

What that costs and how it is paid: **every word the control prints traces to a document.**
`app/data/tracks.json` is authored the way `pricing.json` is, and every field carries a
`from` naming the record it was transcribed out of — the two names, the two bands and
"Both tracks reach the same educational outcomes; the difference is HOW, not WHAT" from
ADR-0004; the segment blocks (5–8 min / 10–15 min), the puzzle rule ("a subset — 4-5 of the
8, the Foundation/Core tier" / "all 8, Challenge tier emphasized"), the notation and
full-game timing from the differentiation plan's §1.2 axis table; "set per group · a coach
can override per child" from its §5. Challenger's readout ends on the one piece of its
compression that is *executed* rather than planned — `pathways.json`'s Stage-1 map, 41
sessions delivered as 24 classes — which is why that file is still imported.

**And the switch is not a mock.** The tier on every one of the 1,640 puzzles is authored in
the bundle, so pressing a track re-grades S115's eight positions by that track's own rule
against real data: Explorer lights the Foundation and Core five and marks the Challenge three
`coach shows`; Challenger lights all eight, dims the Foundation two to `warm-up` and marks
the Challenge three `the point`. The plan calls this lever "the single biggest one, and it's
nearly free" — five of eight for Explorer is exactly its stated "4-5 of the 8".

**Two residuals of the ruling, both deliberate.** The bands print as ADR-0004 writes them,
5–7 and 8–12, while the curriculum's own session age bands run to 11–14 and the hero says
ages 5–14 — resolved by the §5 line in the control's own aside, since age is not level. And
the site now names two tracks where the product's newest artefact names three; if the
curriculum repo ever executes ADR-0004, `tracks.json` is the one file that changes.

**PRINT IS NOT BUILT EITHER, and act 6 no longer mentions it.**
`CurriculumWebsite/site/src/components/player/LessonPlayer.tsx:15` reads "Print — not here;
it is the PDF route in Phase C", and the only `@media print` in either tree hides one
decorative grid. So there is no print pack, no worksheet, no parent summary, and the section
says nothing about any of them. What it sells instead is the homework that **is** written:
authored for **213 of 213** sessions — online practice in 213, over-the-board in 213,
reflection questions in 213, an optional challenge in 171 — and it leaves the plate as an
ivory **sheet** carrying S115's real homework, because dark is what the coach teaches from
and light is what goes home. "The print pack itself is still being built" is gone, and so is
"the track switch is still being built"; `compare.js`'s two comments that pointed at
`bento.js:136` for that claim now point at `LessonPlayer.tsx:15`.

**The act is 760vh, up from 460vh.** `--h` opens at `(H - 200vh)/(H - 100vh)`, so at 460vh
the whole story had to be told by t 0.722 and each of the six figures got 0.048 × 360vh =
17vh — a flick of a trackpad. At 760vh the same beat is 32vh, the story closes at t 0.715,
and 0.13 of the pin (86vh) passes with the diagram complete and motionless before the
handover. Act heights carry no narrative weight — `n` is act index plus local progress — so
this moved no camera key and no band in `director.js`. 760 is act 4's own value, not a new one.

**Nothing is written per frame.** Every beat is a `clamp()` on `--t` / `--e` / `--h`,
including the ream. `system.js` runs once at build and after that the act is CSS and two
click handlers. The pathway control is the only thing on the stage that mutates the DOM.

**Traps this rebuild paid for, all measured:**

- **The ream is nine box-shadows, not nine elements.** A negative-z-index child paints ABOVE
  its own parent's background, so a DOM ream covered the plate it was a copy of. And the fan
  is **strictly vertical** (offset up, increasing negative spread for the perspective): a fan
  with a horizontal component walked over the left column's three leaders and the last word of
  two of its sentences — the leader dot lands 21px from the plate's edge at 1440 and the fan
  was 63px wide. For the same reason the plate does **not** scale on the ream: the leaders are
  positioned off the side columns' fixed edges, so shrinking the plate opens a gap between
  every dot and the edge it is supposed to land on.
- **The homework sheet is a SIBLING of the plate**, inside `.sy-corewrap`, for the same
  negative-z reason. It is anchored to the plate's foot and hidden behind it at rest.
- **`--hw` is a window, not a ramp.** The sheet goes back in over t 0.545–0.60. Out, it reaches
  within a few pixels of where the payoff arrives at 0.66 — and it is a detail of one session,
  which is the thing the turn stops the act being about.
- **The leaders had `right: 0`, which is INSIDE the satellite.** They struck the figure through
  like a cancellation rule. They want `right: calc(-1 * var(--sy-lead))`, and the side columns
  carry that lead as their own padding rather than the grid carrying it as a gap — a leader has
  to land on the plate's edge from a known distance, and a grid gap plus a centred plate is not
  a known distance.
- **`grid-auto-rows: minmax(0, auto)` lets a row be smaller than its own content.** A figure
  whose unit wrapped overflowed its satellite by 3px on every phone.
- **Line boxes, three times.** JetBrains Mono's content area is taller than its em, so a numeral
  at `line-height: 1.1` hangs its inline box below the flex line it is baseline-aligned in: 1.3
  on the figure, its `b` and its unit is where that reaches zero. Fraunces inks 3px past a
  1.06em box in the head, and 1.2 is where THAT reaches zero. `.sy-rule`'s `line-height` and
  `min-height` are the same figure on purpose — at the inherited 1.55 the plate grew 3.2px the
  moment a reader pressed Foundation.
- **The plate's own `THE HOUR` / `THE POSITIONS` keys are hidden at ≥1181** and come back below
  it. The leader IS the label while there is a leader; when the sides move under the plate, the
  naming has to move inside.

**The ladder, and what each step spends.** `node tools/sysfit.cjs [wide|phone|all] [fracs]` is
act 6's own instrument — it replaces `tools/bento.cjs` — and it reads the stage's own overflow,
every box that holds words, the plate, the board's square and the lowest ink against the fold at
**both** crowded fractions (0.52, the diagram complete with the sheet out; 0.78, the ream fanned
with the payoff up). 26 windows, both fractions, all clean.

- **≥1181 wide:** the diagram. Three columns, six leaders, six glosses.
- **≤1180:** the split stops being a split — plate on top, six figures in two rows of three,
  **leaders and glosses both gone**, plate blocks renamed. The gloss goes at the same
  breakpoint as the leader and for the same reason: stacked, the plate sits directly above the
  figures saying the same things in full, so the sentence under each one is the only redundant
  thing on the stage — and it is also the 80px the stack needs.
- **≤900:** three rows of two. The plate loses its subtitle, its board caption, its
  prerequisites row and its sheet, the chips go to one row of eight, and the figure's unit
  stacks under its number. All of that used to be the `(max-height: 800px)` block; a phone is
  a phone, and 390x844 needed it too.
- **≤600:** the rail's part names go and its minutes stay.
- **≤389 wide and ≤799 tall, ≤340 wide at any height, or ≤720 tall:** the readout swaps to
  tracks.json's one-line `short` form. Not a clamp — a clamped claim is a lost claim, so both
  forms are authored and CSS picks one. Same device as `pricing.json`'s `addsShort`.
- **≤360 wide:** the chips' rule word goes; eight chips across 268px is 31px each, which
  holds "P1" and its stars and nothing else. The lit/dimmed state carries the track's decision.
- **≤690 tall on a phone:** the floor. Two row gaps and the eyebrow's margin, nothing else.
- **≤820 tall (≥901 wide):** spacing, the sheet's third line, glosses to three lines.
- **≤700:** the subtitle, the board's caption, the payoff's mono under-line, glosses to two.
- **≤620:** the sheet and the prerequisites. `.sy-many` — the ream's count, which the turn
  needs — stays on the row the prerequisites vacate.
- **≤560:** the type scale, and nothing else. **1219x543, the founder's own window, is clean.**
- **≤1180 and ≤700:** the band where the stack and the short tier meet; the last few pixels
  at 981x620 and 901x620 come out of the row gaps.

**THE TRAP THIS LADDER WAS BUILT BLIND TO, and it is the one worth reading twice.**
`.pad.system`'s middle row is `minmax(0, 1fr)`. When the stack wants more than the row, it
**does not clip — it spills onto the payoff**, and every per-box overflow check reads clean
while it does. At 390x844 six figures sat on top of two lines of display type and the fit
sweep said "all frames clean"; the same thing was true at 1180x800 (54px), 1100x900 (34px),
981x620 (8px) and 901x620 (3px). Both `tools/sysfit.cjs` and the gate now compare every
`.sy-sat` / `.sy-core` / `.sy-close` / `.system-head` pair for intersection, which is the
check that would have caught it. Two things about it:

- **Read it at t 0.78, not just 0.52.** `.sy-close` arrives by translating UP 8px, so at 0.52
  the transform holds it clear of the row and its RESTING position is the one that collides.
  981x620 read clean at 0.52 and 5px over at 0.78.
- **The fix for it hit this file's cascade trap for the fourth time.** `.sy-g { display: none }`
  written inside the `(max-width: 1180px)` block was beaten by the `(max-height: 820px)` tier's
  own `.sy-g { display: grid }` — declared later, equal specificity — and the sweep read the
  same 54px before and after. It lives at the foot of the file carrying `.act-system` now.

**The gate moved with the act, it was not quieted.** `bento-cells-fit` and
`bento-bodies-trim-not-slice` named selectors that no longer exist, and a renamed selector makes
this gate go QUIET rather than red. They are now `system-fits@WxHtF` (four windows × two
fractions) and `system-stacks@WxH` (six stacked windows, including the board floor of 64px and
8px a square), plus three assertions the bento never had:

- `system-figures-turn` — all six figures cut from the session's number to the curriculum's
  across t 0.50 → 0.68, and the six labels do not change. If a band is retimed and one figure
  stops turning, nothing else on the page would notice: the act would quietly become a
  description of one lesson.
- `system-pathways-regrade` — Foundation regrades the eight positions by PATHWAYS.md's own rule,
  one track is pressed at a time, the three readouts differ, and the plate's height does not
  move under the reader's hand.
- `system-figures-count` — every figure on the stage is checked against `inventory.json` and
  `showcase.json` at run time. This is the mechanical form of the rule that binds every number
  on the page.

**What came off, and why, so it does not come back by accident.** The eight card titles and
their paragraphs. The ten checkpoint names (`.gate-names`) — act 3's five gates already name the
levels, and ten rows of prose in a card was the shape the founder rejected. The child privacy
card: it is true, it is in the footer, and a privacy notice is not what makes an academy buy a
curriculum. The five-stage drill (`.drill`) — act 2's ladder and act 3's panels are the
curriculum's own shape, and a third printing of it is the "picture of the catalogue" act 1
already had rejected. `210 hours of class`, `1,640 puzzles` as a card figure and `213 sessions`
as a card figure: all three are printed elsewhere, and the act's own six figures are new counts
instead. "Sixty-four squares. One system." went with them — the eyebrow is now the nav's own
promise, `What's included`.

## The supporting site, built 2026-09-06 — read this before touching `app/curriculum/`, `pages.css` or `tools/pages/`

Eleven generated documents now sit beside the film. The film creates desire; these prove it.
They were built in one pass on the founder's instruction ("BUILD THE ENTIRE SUPPORTING SEO /
GEO SITE … I want to be able to basically FORGET about these pages after you finish them"),
which is why this section is long: it is the record that lets them be forgotten.

### The eleven pages, and why each exists

| URL | Owns | Why it is a URL |
|---|---|---|
| `/curriculum` | "chess curriculum" | The index: all 213 sessions in teaching order under unit / level / stage, plus the four-word explainer and the track control. |
| `/curriculum/{pawn,knight,bishop,rook,queen}` | "chess curriculum for beginners", "chess tactics lessons", … | The detail: each stage's arc, its two graded sessions, its six units, and every one of its ~43 sessions with the objective it is written against. ~11 KB of unique prose per page. |
| `/inside-a-session` | "chess lesson structure", "what a chess lesson contains" | One real session in full, with a photograph of the console as the hero. |
| `/for-chess-coaches` | "chess lesson plans for coaches" | One hour and one person's week. |
| `/for-chess-academies` | "chess academy curriculum" | Variance, and the standard that removes it. |
| `/about` | "Efhaam" | The name, the origin, the method, and what is not built. |
| `/404.html` | — | Served with a real 404 by `serve.cjs`. |

**The split between `/curriculum` and the five stage pages is the whole architecture.** The map
prints titles, type and position counts; the stage pages print objectives and concepts. Nothing
is duplicated between them except the titles, which is what makes the map a map. This is also
the blueprint's own structure — `01-information-architecture.md §A` lists `/curriculum` and
`/curriculum/<stage>` — so the page count is documented rather than invented.

**No individual session pages, and that was a decision.** A session's unique content in
`catalog.json` is one objective sentence and one concept phrase. 213 pages of that is the thin
programmatic set the brief forbids and Google's scaled-content policy names. The three sessions
that DO have full content are public where you can teach them, at `/teach`. **No `/resources`
and no blog** either: the real material (design principles, the routines ladder, session
anatomy) belongs inside the pages that already argue with it.

**`/teach` stays `noindex, follow`.** It renders entirely from `fetch('/data/showcase.json')`,
so its markup is an empty shell — indexing it would put a contentless page in front of readers
who searched for what `/inside-a-session` answers in prose. There is deliberately no
`Disallow: /teach` in robots.txt: blocking the path is what would stop a crawler ever reading
the `noindex`.

### They are generated, and `--check` is what keeps them honest

```sh
node tools/build-pages.cjs            # write the 13 files
node tools/build-pages.cjs --check    # fail if a committed file drifts from app/data
node tools/pagefit.cjs [route]        # 110 assertions: fit, head, links, console
SHOT=1 node tools/pagefit.cjs         # the same, plus shots/pg-*.jpg
node tools/shotproduct.cjs            # re-shoot the console AND re-measure the callout boxes
node tools/ogshoot.cjs                # the 11 social cards
```

`tools/pages/data.cjs` is the only place a figure is derived and **no template contains a
digit**. `tools/build-pages.cjs --check` is wired into `gate.cjs` as `pages-build-current`, so a
bundle change nobody rebuilt for fails the gate instead of quietly printing last week's counts.
Before this, `210`, `4,702` and `1,996` on the landing page were checked by nothing at all.
(The founder's final curriculum QA of 2026-09-05 restructured the teaching flow — guided
examples moved into `demonstrations` cards — so bundle 1.1.0 was re-exported and every
derived figure re-counted on 2026-09-06: the check-C count is now **4,751** (3,111 FENs +
1,640 solution lines), unique positions **2,346**, uses **3,111**. The inventory's own
`demonstrations: 642` is the QA's 297 demonstration cards + 345 guided examples, counted
together because that is what the field has always meant.)

**Which data file owns which figure**, because two of them disagree and the pages must not:
`catalog.json` owns everything the pages LIST (sessions, titles, objectives, minutes, puzzle
counts) because a total beside a list has to be that list's own sum; `stages.json` owns the
stages, levels and units; `inventory.json` owns the roll-ups the catalogue cannot give
(segments, questions, activities, homework, the tier split, the routines). `inventory` and
the re-exported catalog now agree at **12,630** planned minutes — the 12,575 gap closed when
the bundle was re-exported from the QA'd tree. The pages print **neither**; they print
`210 hours`, which both support, and that is the landing page's own figure.
`stage_index.json` is deliberately unused for session content: its
`primary_concepts` is 30 of 44 for stage 4 and 15 of 40 for stage 5, and nine of its entries
disagree with `catalog`'s own `concept` at the same index.

### They are paper, and that is not a second identity

`director.js`'s RAMPS take `--fg` to `#14141c` and `--glass` to near-white as the room lifts,
and acts 5-8 are entirely on that side. So the film ends where these pages begin: **dark is what
a coach teaches FROM (`/teach`, the console, a projector) and paper is what gets read.** Every
value in `pages.css` is one of the two ends of a token `tokens.css` already declares.

**One value is new and it is a legibility tint.** `--fg-faint` is re-declared locally as
`#6b6875`. The ramp's paper faint (`#86828f`) measures **2.86:1** on `#f2ece0` — an SC 1.4.3
failure the film gets away with only because its faint text is provenance and its own note says
so. There is no GL wash here. `#6b6875` measures **4.62:1** on the ground and **5.13:1** on the
plate, and stays 1.9:1 under `--fg-dim` so three tiers still read as three. Same precedent as
`--fg-rung` and `--bishop-hi`.

**The five stage hues are marks only, never words.** On `#f2ece0` they measure 2.06:1 (queen) to
3.31:1 (bishop). A stage's colour is its band edge, its rail tick, its chart bar and its kicker
diamond; the stage's NAME is ink every time, and no hue ever carries information on its own.
Same trade act 7 recorded for gold.

### What is on each page that is worth not breaking

- **The map's sticky rail** marks the stage a reader is in with an `IntersectionObserver` at
  `rootMargin: -32% 0 -60%`, not a scroll listener: the page is ~14,600px tall. Below 980px it
  becomes a horizontal strip of five chips pinned under the header.
- **The filter** is the only thing on the site that removes anything. It hides rows and then
  hides any unit, level or band left holding nothing — a head over an empty list reads as a bug.
- **The stage-length chart** in the `/curriculum` hero is one bar per stage, split at the level
  boundary, with 2px of ink where each level's graded session sits. It is the only chart on the
  site and it answers what the figure strip does not: how the 213 are distributed.
- **`/inside-a-session`'s hero is a photograph with a legend, not a mockup with labels.**
  `tools/shotproduct.cjs` takes the screenshot AND prints the bounding box of every element the
  page points at as a percentage, which is where `CALLS` in `tools/pages/session.cjs` comes
  from. **Re-run it after any change to `/teach` and paste the new boxes in.** The pins are
  `aria-hidden` markers; the legend is the content. Below 1080px the pins go and the legend
  becomes a two-column list — a 21px disc over a 300px board is furniture.
- **The screenshot is sticky** inside its column, so it is still there while eight legend
  entries go past it, which is also what makes the hover pin-lift useful rather than decorative.
- **Every board on these pages is one `<svg>`** in a `0 0 8 8` user space, generated at build
  time from the session's own FEN (`tools/pages/board.cjs`) — act 1's idiom, `/teach`'s square
  colours, no JavaScript, and the accessible name says the position out loud.

### What the pages may and may not say

Everything below was established from primary sources on 2026-09-06, and each one is a place a
page would otherwise have lied.

- **Print packs are NOT built.** Confirmed three ways: no export path in either product app,
  `LessonPlayer.tsx:15` "Print — not here; it is the PDF route in Phase C", and `pricing.json`'s
  own ledger. The founder's brief asked for printable homework to be sold as built. **What IS
  built is the homework** — set for all 213 sessions in three named forms, 4,243 written minutes
  — and that is what the pages sell. The print pack's status is stated once, on
  `/inside-a-session`, in the licence schedule's own words. **This is the one place the build
  knowingly departs from the brief, and it departs because the brief's own §1 says the
  implementation wins and its §31 forbids the site contradicting itself one click apart.**
- **Explorer / Challenger stands**, on the founder's ruling of 2026-09-05 ("explorer vs
  challenger 2 paths are good enough"), sourced to `app/data/tracks.json` where every clause
  carries the record it was transcribed from. Two live artefacts still disagree — ADR-0004's two
  names versus `pathways.json`'s Foundation/Standard/Accelerated — and every auditor who has not
  been told about the ruling raises it. The pages present the tracks as a **delivery decision
  executed against the authored puzzle tiers**, which is true, and never as a software toggle.
- **"Eight parts" is what the console lays out**, and the pages say it that way. The session
  FILE also carries a `reflection` block in all 213 that `teach/segments.js` does not read, and
  three sessions carry no positions, so they run seven. That last fact is stated on
  `/inside-a-session` rather than papered over — the landing page's own "in that order, every
  time" is the phrasing that overclaims, and it was not touched.
- **Verification is scoped every single time.** `4,751 checks, 0 errors` reproduces exactly
  against the re-exported bundle 1.1.0 (3,111 FENs + 1,640 solution lines, `validate-bundle.ts:269-305`)
  and is printed once, on `/about`, immediately followed by what it does not prove. The bundle fails
  two of its own five checks. "Every puzzle position checked for legality" is sayable; "every
  position", "validated", "schema-clean" and "error-free" are not.
- **A stage's `ageBand` is the ENTRY band, not the ages it teaches** — stage 2 declares 7-9 and
  34 of its 44 sessions are labelled 8-10. Every page says "entry age". The curriculum-wide
  `5–14` is safe and is derived, not typed.
- **`ratingBand` is "plays at", never "reaches".** The manifesto calls the bands "a correlation
  benchmark, not a gating mechanism".
- **No named author anywhere.** The 213 sessions are unattributed: 128 files say "Lead Curriculum
  Author" and 85 name "Curriculum Engine v1", and neither is a person. 50 of the 213 had machine
  gates only, with no line-by-line human read. So `/about`'s authority is the structure and the
  checking — things a reader can verify — and it never claims a byline, credentials, experience,
  peer review or expert validation.
- **The academy whose syllabus started this is not named.** The audit is internal analysis of an
  identifiable third party with no documented permission. The finding is quoted verbatim; the
  subject is not.
- **Nothing else was invented either:** no person, no location, no legal entity, no contact, no
  ®/™ (clearance is documented as still outstanding), no customer, no pilot, no testimonial, no
  logo, no award, no accreditation, no student outcome, no cognitive claim, no time-saved figure,
  no market size. `/about`'s "six things you will not find on this site" says all of it out loud,
  which on a page with no proof is the proof.

### SEO decisions, and the research behind each

Checked against Google's own supported-features gallery and each vendor's publisher
documentation on 2026-09-06, not against habit.

- **Structured data is four types and no more:** `Organization` (full node on `/` and `/about`, a
  bare `@id` anchor elsewhere, per Google's own placement guidance), `WebSite` on the root page
  only (it is the site-name signal; its SearchAction use was retired in 2024), `BreadcrumbList`,
  and a **Course list** — an `ItemList` of five stage URLs on `/curriculum` with a `Course` on
  each stage page. Course list is the only education rich result Google still consumes; **Course
  info was retired in 2025** and it never applied anyway, because Efhaam runs no classes and has
  no enrolment. Course-list cards show only the first 60 characters of a description, so each
  stage's own subject leads it.
- **Deliberately absent:** `FAQPage` (results stopped appearing 2026-05-07, docs deleted
  2026-06-15), `EducationalOccupationalProgram` / `Syllabus` / `LearningResource` (real
  vocabulary, no consumer), any `aggregateRating` or `review` (self-serving ratings about your
  own organisation are the exact case that earns a structured-data manual action), and an
  **`llms.txt`** — Google states it neither helps nor harms, 97% of the files across 137,210
  measured domains were never fetched once in a month, and no vendor documents a markup pattern
  that buys an AI citation. The documented levers are: be crawlable, be indexable, and write
  something that is not a commodity.
- **robots.txt allows everything, including every AI crawler.** Anthropic's own wording is that
  blocking Claude-SearchBot "may reduce your site's visibility and accuracy in user search
  results", and OpenAI and Perplexity say the same about theirs.
- **One URL per page.** Canonical is the unslashed form; `serve.cjs` now 301s `/x/` to `/x` and
  returns a real 404 for an unknown path. Before this an unknown path served the homepage with a
  **200**, which is a soft 404 — a crawler storing a copy of the front door under every wrong URL
  anyone ever links to.
- **The sitemap carries `lastmod` and neither `priority` nor `changefreq`,** which Google ignores.
  `lastmod` is the mtime of the files that actually produce each page.
- **The landing page's head was missing four things** and they were added without touching a pixel
  of the page: `rel=canonical`, `og:url`, `og:image` and any JSON-LD. `twitter:card` went from
  `summary` to `summary_large_image` because there is now an image to show. `og:title` is also one
  of the nine sources Google draws a title link from, so this is search metadata and not only
  social.
- **The footer site map is the only link from the film to the documents,** and without it eleven
  pages would be reachable from nowhere on the strongest page on the site. It is the blueprint's
  own spec (`01 §B`, "Footer: full map"). It takes its own line above the brand row, at the credit
  line's `0.56rem / 0.1em` rather than `.mono`'s `0.66rem / 0.19em`: at `.mono`'s metric the five
  links wrapped to two lines in every container under ~1150px and the 42px that cost put act 8
  into **11px of stage overflow at 1219x543**, the founder's own window. Asserted by
  `promo-fits-with-site-map`.

### Traps this build paid for

- **A class that names a column count has to be a grid by itself.** `.pg-cols-2` set
  `grid-template-columns` on a class that never declared `display: grid`, so every element
  carrying it alone laid out as a block and both columns stacked. `/about`'s origin section
  shipped that way for one build.
- **Every child of a `display: grid` list item becomes a grid item, including a bare text node.**
  `.pg-ticks li` was a two-column grid, so an item written as `<b>Lead-in.</b> then a sentence`
  put the marker in column 1, the `<b>` in column 2, and the trailing text into an anonymous item
  on row 2 — a 1.1em track. It rendered one word per line on three pages. The marker is
  absolutely positioned now.
- **`auto-fit` does not collapse a track that a full-width sibling spans.** `.st-gates` had a
  label above the pair and a note below it, both `grid-column: 1 / -1`, so all three repeated
  tracks were non-empty and the two plates sat in 65% of the row. Every stage has exactly two
  levels, so the template says `repeat(2, …)`.
- **`.pg-figs` is a strip of FIGURES.** Its cell floor is 96px on a phone, and a session title
  dropped into one overflowed by 32px at 360 wide. `.pg-list` is the component for links.
- **`setContent` on `about:blank` has an opaque origin,** and the monogram's CSS mask silently
  resolved to nothing there: the OG cards rendered a wordmark with no mark and raised no error
  anywhere. `ogshoot.cjs` lands on the server first.
- **Git Bash rewrites a leading-slash argv into a Windows path.** `node script.cjs /curriculum`
  arrives as `C:/Program Files/Git/curriculum`. Prefix with `MSYS_NO_PATHCONV=1`.

### What was deliberately NOT done

- **No privacy or child-safety page.** The blueprint plans one (`01 §A`) and a buyer will want it,
  but authoring privacy policy for a real company is the founder's to write, not a generator's.
  The documented facts that matter to a buyer — no child accounts, no child emails, ever — are on
  `/for-chess-academies` and in every footer.
- **No `/pricing` page.** The licence schedule is act 7 of the film, and every supporting page
  links to `/#terms`.
- **No contact, form, email capture or "book a pilot" anywhere.** There is nothing behind any of
  those verbs in the built tree, and `/teach` is the only working destination.
- **IndexNow** is a legitimate zero-build push for Bing and is worth doing at launch: host a key
  file at the root and GET the ping URL. It needs a live domain, so it is a launch step and not a
  build step.
- **The GitHub Pages artifact is a preview, not an address.** `.github/workflows/pages.yml`
  rewrites every internal href to `/NewSiteDesign/…` **with a trailing slash**, because Pages
  serves a directory only at its slashed form and without that rewrite every link on the eleven
  new pages 404s on the deployed artifact while working perfectly on 127.0.0.1:4321. The
  canonical URLs are deliberately left at `https://efhaam.com/…`, so the artifact points at the
  real site rather than competing with it. If the Pages URL ever has to be public, the change
  belongs in `shell.cjs`'s `ORIGIN` and in `serve.cjs`'s redirect direction — one value and one
  line, not a hand-edit of the artifact.
- **The landing page's own four unprotected literals** (`210`, `4,751`, `2,346`, and act 6's
  strings) were left where they are. `pages-figures-count` now recounts every figure on the eleven
  new pages; extending it to the film's own is a separate job.


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
17. **Act 7 spends gold on marks, not on words.** Gold on ivory is 2.31:1 nominal before the GL
   wash is counted, so every string the card grid needed a reader to READ came off the hue and onto
   ink: the badge label (measured 1.77:1 rendered at 8px), Growth's ROI line, the pilot's figure and
   its credit sentence. What keeps the hue is what a reader does not have to read to get the claim —
   the rotated-square marks, the pilot strip's left edge, the recommended card's edge and wash, and
   two short mono lead-ins (`IN EVERY LICENCE`, `PILOT`) whose sentences restate them immediately.
   Those two are the residual, and they are the act's, not the grid's.
18. **The sheet's own small print cannot reach AA where the composition puts it.** `.rate-cap-l` is
   8-9px of mono on the BOARD rather than on a plate: `--fg-faint` measured 2.09:1 rendered against
   a nominal 2.66:1, and the one-token swap to `--fg-dim` that STATE's under-10px rule prescribes
   lands near 3:1, not 4.5:1. Only `--fg` clears 4.5 unplated in this act — measured 4.69:1 on
   `.rate-inv-c` and 4.94:1 on the headline — and full ink on a 9px tracked caption reads as a spec
   line, not a caption. Same accepted-residual class as decision 13, and the lever is the same one:
   a plate under the line, or the wash.
19. **The no-WebGL fallback renders nothing, and it has been that way since before act 6.**
   Found while testing act 6's own `body.gl-failed` rules, and it is the whole page's, not
   this act's. `base.css:90` is `.act:not(.is-live) .act-stage { visibility: hidden }`, and
   `is-live` is written by `scroll.js` inside the frame loop — which never starts, because
   `boot()` adds `gl-failed` from the `catch` around `new World()`. So every one of the nine
   stages stays `visibility: hidden` and a reader with no WebGL gets the nav, the `<noscript>`
   and nothing else. Confirmed pre-existing at `git show HEAD:app/css/base.css`. The fix is
   one additive line in the fallback block (`body.gl-failed .act-stage { visibility: visible }`),
   it cannot regress anything that currently paints, and base.css's own comment already states
   the intent it fails — "If WebGL never comes up, the story still has to be readable." It is
   left as a decision rather than done because it changes all nine acts at once and this was a
   one-section job. Act 6's own fallback rules are in place and correct for when it is fixed.

