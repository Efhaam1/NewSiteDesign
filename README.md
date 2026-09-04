# Efhaam — landing prototype

> Same session. Every coach. Every table.

A scroll-driven landing experience for the Efhaam chess curriculum. The page is
not a stack of sections with animations added afterwards: it is one continuous
shot down a single file of a chessboard, and scroll position is the timeline.

## Run it

```bash
node tools/serve.cjs          # http://127.0.0.1:4321
```

No build step, no install. `app/` is served as-is: ES modules, an import map for
three.js and chess.js (both vendored under `app/vendor/`), and hand-written CSS.
Iteration is a hard refresh.

**From a fresh clone.** The site itself needs nothing but Node. The measurement
instruments in `tools/` and `.audit5/` do: each one opens Playwright from a hard-coded
path to a sibling checkout on the machine this was authored on —

```js
const PW = 'C:/Users/MUS/CurriculumWebsite/node_modules/playwright';
```

— so on any other machine, `npm i -D playwright && npx playwright install chromium` and
point that constant at your own `node_modules/playwright`. `node tools/gate.cjs` is the
one that matters: 54 assertions, ~10 minutes, and it has to come back 54/54.

This repo is the site. The local scaffolding it was built with — 191 MB of measurement
screenshots, the `.bak/` and `.audit5/snap/` rollbacks, and the 236-file planning
archive — is excluded by `.gitignore` and lives only on that machine. `STATE.md` is the
file to read first.

## The concept

The curriculum's five stages are already named for chess pieces — Pawn, Knight,
Bishop, Rook, Queen — and a child *graduates* from one to the next. That is pawn
promotion. So the site is the promotion: the reader travels up one file of an
enormous board, crossing a lit rank gate on every rank as the file fills, and
the piece standing on the file becomes the next piece up at every graduation.
At rank eight it promotes.

Eight acts, each pinned for as long as its shot needs:

| # | Act | What the world does | What the page says |
|---|-----|--------------------|--------------------|
| 0 | `threshold` | the board assembles out of the dark; a pawn condenses on the d-file and comes *through* the headline | Same session. Every coach. Every table. |
| 1 | `chaos` | three kinds of paper settle on three files, converge onto the d-file as one ruled column, then close into the line act 2 lights | Your best coach is a dependency. |

Act 1 carries the argument the product actually turns on, so the argument happens
twice on the same frames — once at board scale and once at reading scale — and it
resolves into the product rather than into a sentence. Four beats:

**The problem, with substance.** Three columns of four beats each deal in one at a
time — Explain / Explain / Puzzles / Play against Puzzles / Puzzles / Puzzles /
Discuss against Play / Discuss / Puzzles / Play — and every beat carries a hairline
rule of its share of the hour, so three coaches read as three visibly different
*shapes* of the same fifty minutes with the words blurred out. In the room the 88
sheets settle into three lanes that are three *kinds* of material: written A4 on
one file, a spilled box of index cards on another, printed screen-grabs on a third.

**The convergence.** The middle column leaves first and in place, so the outer two
never print a second word on top of one that is still there; they walk one grid
track inward while every sheet lerps onto the d-file, shedding its yaw, its scale
and its tone. Three kinds of material become one written session, and the file
lights as they arrive — the d-file is deliberately empty until then, so the
ignition reads as arrival rather than as illumination of something already there.

**The product.** The composed column resolves, in the track the middle column
vacated, into a real surface: S012's own flow — its id, its title, its five
segments with their minute budget drawn as proportional rules, and a foot that
closes an arithmetic that does not close neatly (42 of 50, because that is what the
bundle says). It is capped at 348px so it can never become a dashboard.

**The handover.** The five blocks close into one continuous rail up the d-file, the
file's glow gathers into a wedge at rank 1, and act 2's headline arrives over a
literal line. The product hands the line to the spine instead of dissolving beside it.

Every figure in the product surface comes from `variance.json`. The twelve minute
shares on the problem side are an apportionment written for the shot, are labelled
as such in `compare.js`, and are never printed as numbers.

| 2 | `spine` | the d-file lights from rank 1, session notches ignite as the head passes, unit stems branch off | A curriculum is a line, not a library. |
| 3 | `stages` | five gates. Crossing one relights the room in that stage's colour and the piece graduates | one escalating claim per stage |
| 4 | `session` | one square lifts out of the board and becomes the teaching console, named from the outside | This is what a coach sees. |
| 5 | `system` | the room lifts to paper and the board is seen from above as an 8-column lattice | Sixty-four squares. One operating system. |
| 6 | `terms` | the paper stays up and the price is printed on it as a ruled licence schedule | Every licence is the whole curriculum. |
| 7 | `promotion` | the rook on rank eight burns off and the queen condenses out of the light | Promotion. |

Two tonal states, and the cut between them means something: **dark is what the
coach teaches from, light is what the parent and the photocopier get.** `--lift`
interpolates the whole page and the 3D room together, so it is one room changing
its light rather than two different designs.

## Everything on screen is real

All copy numbers and every product surface come from curriculum bundle 1.1.0
(`app/data/`, exported from `CurriculumWebsite/content/bundles/1.1.0`):

- `catalog.json` — 213 authored sessions of 213 planned, with real ids, titles,
  objectives, units, levels, puzzle counts and minutes. Drives the spine
  scrubber and the bento drill.
- `stages.json` — the five stages with their real age bands, rating bands,
  levels and six units each. Drives the stage panels.
- `showcase.json` — full lesson JSON for S001 / S042 / S115. Act 4's console renders
  **S115 Three-Move Combinations** verbatim, through the same `buildSegments` /teach
  uses: the eight segments and their minutes (60 planned, 42 timed), the `THE PLAN`
  thinking routine, all eight puzzles with their real FENs, prompts, forced lines and
  explanations — it opens on **S115-P4**, the x-ray battery — and the real coach notes on
  the prep sheet. The three session chips in its header link to `/teach?s=…`, which is the
  same three lessons at full size.
- `pricing.json` — the licence schedule: four tiers, the six-week pilot and the
  ledger notes, every figure quoted from `docs/product/05-pricing-and-funnel.md`
  section A. The only derived numbers are the effective monthly prices, which are
  the annual figure over twelve.
- `variance.json` — S012 *Is My Piece Safe? (THE LOOK)*, the invariant half of the
  act-1 comparison: its real segments, puzzle count, homework minutes and answer.

The two commands that produce and check that bundle, in order:

```bash
node scripts/export-bundle.js --version 1.1.0   # in ChessCurriculumProject
npm run bundle:validate                          # in CurriculumWebsite
```

Bundle 1.1.0 counts 213 of 213 sessions, 1,640 puzzles, 1,996 unique FENs across
3,062 uses, 1,170 concepts and 20 model games. Check C — FEN legality and every
solution line — reports **4,702 checks, 0 errors**, and that is the claim the
page makes. What the validator does *not* pass is check B (schema) and check D
(puzzle ids): 147 of the 213 sessions drift from `lesson.schema.json`, 103 of them
baselined back in 1.0.0 and 44 new with the Stage 4-5 batch, and 968 puzzle ids
are malformed. That drift is a curriculum-repo matter, it reaches no published
surface, and `drift-baseline.json` was left alone on purpose — its own contract
reads "shrink this list, never grow it". So no copy on this site may say the
bundle passes every check; it says only what check C proves.

Stage colours are not brand choices: `stage_index.json` declares a colour per
stage, so the room's light is curriculum data resolved to hex.

## Architecture

```
app/
├── index.html            all eight acts, in the DOM, in order
├── css/
│   ├── tokens.css        palette, type, the driver variables
│   ├── base.css          canvases, scrim, grain, atmosphere, sticky acts
│   ├── acts.css          per-act layout + the chrome (nav, rank ladder)
│   ├── product.css       bento, paper lift, mobile
│   ├── terms.css         the licence schedule (act 6)
│   └── annot.css         act 4 end to end: the copy column, the console, the six callouts
├── js/
│   ├── scroll.js         native scroll, damped animation values
│   ├── gl/world.js       two renderers, two scenes, lights, bloom, quality tier
│   ├── gl/board.js       instanced board + glow plates + the table it sits on
│   ├── gl/spine.js       the d-file groove, 213 notches, 30 unit stems, 9 gates
│   ├── gl/pieces.js      GLB loading, normal rebuild, the dissolve shader
│   ├── gl/debris.js      the chaos pile and its snap to the lattice
│   ├── gl/camera.js      keyframed rig + portrait framing
│   ├── gl/director.js    the shot list and every scroll → state mapping
│   └── ui/*.js           console, stage panels, bento, dial, ladder, board2d
├── data/                 the curriculum bundle slices listed above
└── vendor/               three.js 0.180, chess.js 1.4 (ESM builds)
```

Three decisions worth knowing:

**Two canvases, two scenes.** `#gl-back` paints the room behind the type;
`#gl-front` paints a transparent plate on top of it. Moving a piece between
`world.scene` and `world.front` is how it comes *through* a headline instead of
sitting politely behind it. They have to be separate scenes, not two layers of
one: a shadow map and a PMREM environment belong to the context that created
them, and read from the other renderer every object turns black.

**Native scroll is never hijacked.** Only the animation values are damped
(`approach()` in `util.js`), which is what gives the motion weight while
keyboards, trackpads, screen readers and mobile momentum all keep working.
`prefers-reduced-motion` sets the damping to 1 and the whole story is still
legible frame by frame.

**Acts overlap by exactly one viewport** (`.act + .act { margin-top: -100vh }`),
so a stage unpins at the instant the next one pins. The scroll engine publishes
three drivers per act — `--t` (pinned progress), `--e` (slid in), `--h`
(handover) — and every reveal is a `clamp()` on one of them. No durations, no
`IntersectionObserver` opacity toggles: scrolling back runs the shot backwards
exactly as it ran forwards.

## Tools

```bash
node tools/serve.cjs                       # static server
node tools/shoot.cjs <tag> <w> <h> <fracs> # screenshot at scroll fractions
node tools/sheet.cjs <tag> <cols> <cellW>  # tile those shots into a contact sheet
node tools/frame.cjs <w> <h> <narr...>     # where the live piece lands on screen
node tools/film.cjs <act> <w> <h> [steps]  # one act, t=0..1, a frame per step
node tools/clip.cjs <w> <h> [fracs]        # anything whose box escapes the window
node tools/audit.cjs <w> <h> [outDir]      # anything a box cuts INSIDE its own container
node tools/gate.cjs [filter]               # the 2026-08-29 audit fix loop, as assertions
node tools/box.cjs <w> <h> <frac> <sel...> # measured boxes, and the act's drivers
node tools/say.cjs <act> <w> <h> <t> <sel> # the text and aria-labels actually on screen
node tools/perf.cjs <w> <h> <dsf>          # fps walk; aborts on a software renderer
node tools/ablate.cjs                      # fps with one subsystem disabled at a time
node tools/trace.cjs <w> <h> <dsf> <a> <b> # Chrome trace, summarised by event
node tools/invalidate.cjs                  # what is invalidating style, and how much
node tools/gpu.cjs                         # which renderer Chromium actually picked
REDUCED=1 node tools/shoot.cjs ...         # with prefers-reduced-motion
AR=2.164 node tools/sheet.cjs m1 6 250     # portrait contact sheet
```

`tools/frame.cjs` exists because the shot list should be tuned numerically, not
by eye: it scrolls for real and reports the active piece's screen x, top, bottom
and height as a percentage of the viewport at any narrative position.

`tools/clip.cjs` exists because this page has twice shipped content cut off at the
bottom of a short window. It walks every act, parks the scroll mid-pin and reports
every visible element whose box escapes the viewport, so "nothing is cut off" is
an assertion rather than an impression. `tools/film.cjs` does the same for time:
it films one act from `t=0` to `t=1` and prints the three drivers per frame, which
is the only honest way to review a shot that only exists while scrolling.
`tools/say.cjs` reads the text and the accessible names actually on screen, for
checking a rendered figure against `app/data/` rather than squinting at a JPEG.

`tools/audit.cjs` is `clip.cjs`'s blind spot. `clip.cjs` asks whether a box escapes
the *window*; a card with `overflow: hidden` that cuts its own last line never does,
so the 2026-08-29 audit found six of those the older tool had reported clean. It walks
every act at one window size and reports, per element, container clipping, truncated
line clamps, real video dimensions and copy density, into `.audit5/<w>x<h>.json` with
one frame per act. `tools/gate.cjs` turns the findings into assertions with numbers and
exits non-zero while any fails: it is the stopping condition for that fix loop, and
`HANDOFF.md` carries the checklist and the eight decisions it is waiting on. Neither
tool writes to `app/`.

Numbers and method are in **Performance notes** below. Measure at the device
scale factor of the screen it will be looked at on, not at 1 — that mistake hid a
7x regression in this prototype for an entire session.

## Performance notes

The first version of this prototype ran at **8 fps on an Iris Xe at 1920x1080**,
while the harness reported 60. The harness was wrong: it measured 1440x900 at
devicePixelRatio 1 — about a sixth of the pixels of the panel it was going to be
looked at on — and Chromium had silently fallen back to SwiftShader on some runs.
`tools/perf.cjs` now takes a device scale factor, prints the GPU string, and
aborts if it sees a software renderer.

What actually cost the frames, in the order the fixes mattered:

1. **MSAA — a wrong turn worth recording.** Switching `antialias` off was the
   first big win and it was misattributed: MSAA looked expensive only because it
   was compounding with everything below. Once the rest was fixed, the matrix said
   4x MSAA at dpr 1.25 costs nothing measurable (59.8 fps median / 57.6 p10 against
   59.9 / 55.0 with it off) — it supersamples coverage, not shading, and this scene
   is shading-bound. It is back on, because without it every tile edge and piece
   silhouette stair-steps. What is *not* affordable is resolution: dpr 1.5 with
   MSAA falls to 54.3 / 38. The ceiling is 1.25.
2. **Style recalculation of the whole document, every frame.** A trace showed
   `UpdateLayoutTree` recalculating **535 elements per frame**. Two causes:
   mutating inline custom properties on `<html>` (which invalidates everything
   that inherits them, i.e. the document), and a `transition` on a registered
   custom property on the root element. The six paper-lift colours are now
   resolved in JS and written as concrete `rgb()` strings — no `color-mix()`
   survives in the stylesheet — `--narr` and `--lift` are gone (nothing consumed
   them), and the opening's `--b` transition lives on the hero act instead of on
   `<html>`. 535 elements per pass became 86.
3. **Shader compilation mid-scroll.** `renderer.compile` walks `traverseVisible`,
   so pieces parked under a hidden group were never warmed and each one stalled
   for several hundred milliseconds the first time it appeared. `world.warm()`
   forces the whole graph visible, compiles both contexts — parking every piece
   on the front plate so its no-fog variant compiles too — and draws one frame of
   each before the loop starts.
4. **The adaptive ladder demoting itself.** Changing the pixel ratio reallocates
   both framebuffers, which is a ~100 ms hitch, which the ladder read as a reason
   to demote again. Measured 35 fps adaptive against 46 fps at a fixed ratio.
   It now needs 2.4 s of sustained overrun and holds a 2.6 s cooldown.
5. **Six pinned full-screen stages painting while invisible.** `opacity: 0` still
   paints. Offscreen acts get `visibility: hidden` from the `is-live` class the
   scroll engine already maintained.
6. **Fill rate.** Post-processing removed (`EffectComposer` alone was two
   full-screen blits); the scrim and grain moved out of DOM layers into one
   clip-space quad in the pass that was already running; both overlay quads were
   sized against a frustum guess and were rasterising 2-3x the screen with their
   masks landing off-camera; the board's additive glow plate drew all 216
   instances when at most three ranks are ever lit; the table went to Lambert and
   is drawn last so the board occludes it; a rim spot that only ever landed on the
   pieces was removed; `king.glb` was being loaded, normal-rebuilt and never drawn.
   The board itself went from `MeshStandardMaterial` to `MeshPhongMaterial` —
   measured 34.5 fps median / 15.2 min against 42 / 33 — because what the board
   needs from its material is one raking specular highlight, not a GGX lobe per
   light plus two cubeUV environment samples on ~72% of the frame. Lambert scored
   higher still and was rejected: it lost the sheen the board is lit by.
7. **Shadows.** There were none — `shadowMap.enabled` was never set, so the whole
   shadow subsystem was inert. Rather than switch it on and pay a second scene
   render plus a PCF tap on every board pixel, `pieces.js` draws a soft contact
   disc under each piece.

8. **A grid row that was not what it looked like.** `.act-stage` was `height: 100vh`
   with an implicit `auto` row, and an auto row grows past its container when the
   content is taller — so `.pad`'s `height: 100%` was resolving against a 971 px row
   inside a 595 px stage, and every nested `minmax(0, 1fr)` inside it resolved to
   max-content instead of to the space left over. That one line
   (`grid-template-rows: minmax(0, 1fr)`) is why the console and the bento were
   being cut in half on short windows. Sizing anything against `100vh - <constant>`
   was the symptom, not the cause; those calculations are gone too.
9. **First-touch costs.** The spine's four instanced buffers (252 instances) and
   the console's board (64 cells, up to 32 SVG decodes) each stalled ~100-150 ms
   the first time the reader scrolled into them, and the dust video's play/pause
   churn added another ~100 ms every time its window reopened. All three are
   warmed at boot; the video now stops only after being unwanted for two seconds.

Measured after all of that, same machine, Iris Xe via D3D11, 4x MSAA on:

| viewport | median | p10 | worst frame |
|---|---|---|---|
| 1920x1080 @ dsf 1.5 | 59 fps | 51 | 121 ms |
| 1440x900 @ dsf 1.5 | 60 fps | 56 | ~90 ms |
| 390x844 @ dsf 3 | 59 fps | 46 | 201 ms |

Started at **8.3 fps** on the first of those. Per-frame cost of this project's own
code is now **1.0 ms of JS and 0.8 ms of `renderer.render`** — everything else is
the browser and the GPU process. The DOM alone (WebGL switched off) runs the same
scroll at 56 fps, so that is roughly where the page sits without further work on
the reveals, which currently invalidate style for a whole act's subtree because
they read inherited custom properties. Driving the dozen elements that actually
animate from JS-written inline styles is the next real gain.

Two hitches remain, both single frames in the GPU process rather than on the main
thread: ~120 ms where the spine first lights (n≈2.1) and ~90 ms where the console
arrives (n≈4.6).

`?debug=1` shows fps, the current tier, the pixel ratio, draw calls and triangles.

## Known gaps

- **The atmosphere videos are uncompressed.** `dust-shaft.mp4` is 16 MB and
  `ink-bloom.mp4` is 7 MB, straight from the previous build's asset folder.
  Before this ships they want transcoding to ~1–2 MB each (and an AV1/HEVC
  pair), or replacing with a shader.
- **The chess piece GLBs ship position-only.** The upstream pipeline decimated
  them and dropped normals, so `pieces.js` rebuilds smooth vertex normals at
  load. Re-exporting them with normals would be cheaper and would fix the faint
  lathe banding on the pawn's base.
- No logo work beyond masking the existing `Chess King E Monogram` PNG to
  `currentColor`. It survives at 26 px but it is a raster; it wants tracing.
- `/lesson`, `/curriculum` and the pilot form are links to nowhere. The console
  in act 4 is a rendering of a real session, not the playable player.
- Copy has been audited against `app/data/` and `docs/product/`: the position
  count is unique FENs (1,996, not the 3,062 occurrences), stage counts print
  authored-of-planned, and the two cards that described unbuilt machinery now
  say so. What is *not* fixed is the `/lesson`, `/curriculum` and pilot
  destinations above, so the pilot is prose on the terms sheet rather than a
  button.
