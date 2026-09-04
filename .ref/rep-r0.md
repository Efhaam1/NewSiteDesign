# `tools/gate.cjs` — 400 lines, 15 `record()` sites, 54 assertions

## 0. Mechanics (before the list)

| fact | line |
|---|---|
| Playwright borrowed from a **sibling** project: `const PW = 'C:/Users/MUS/CurriculumWebsite/node_modules/playwright'` (this project has no `node_modules`) | 8 |
| `const ONLY = process.argv[2] \|\| ''` | 10 |
| `const URL = 'http://127.0.0.1:4321'` — needs `tools/serve.cjs` up (`PORT` env, default 4321, serve.cjs:7) | 11 |
| `record = (id, ok, detail) => { results.push({id, ok, detail}) }` — **push order is print order** | 14 |
| `const inkBottom = () => {}` — dead placeholder, never called | 16 |
| `page(b,w,h,opts)` → `newPage({viewport})`, `goto(URL + (opts.route \|\| '/'), {waitUntil:'load'})`, then **`waitForTimeout(2400)`** | 18-23 |
| `park(p,i,f)` → `scrollTo({top: Math.round(a.top + a.len*f)})` on `window.__w.engine.acts[i]` — **smooth-scrolls** (base.css:9), the flaw the file records at 122-126 | 24-25 |
| Chromium launched `--use-gl=angle --use-angle=gl --enable-unsafe-swiftshader` | 28 |
| Act indices: `ACTS = ['threshold','chaos','spine','stages','session','system','terms','promotion']` (director.js:31) → **4 = session/console, 5 = system/bento, 6 = terms, 1 = chaos, 2 = spine** | 25, 64, 72, 93, 128, 178, 238, 289, 327, 370 |
| Every parking `evaluate` dereferences `window.__w.engine.acts[i]`; `window.__w` is only assigned at main.js:180, after GL boot. A boot failure (main.js:182 `gl-failed`) makes the gate **throw**, not FAIL. | 25, 128, 289, 327, 370 |

## 1. All 54 assertions, in push order

### Block 1 — `hero-fits-at-rest@WxH` (lines 30-48), 6 assertions
Act: **none** — measured at rest, scroll 0, no park. Windows array line 31.
Selectors (line 34, 41-42): `.act-threshold .act-stage`, `.hero-rule`, `.ticker`; `innerHeight`.
`ink(el)` = max bottom of `Range.selectNodeContents(el).getClientRects()`, else `getBoundingClientRect().bottom`; `null` if missing or `display:none` (35-40).
Predicate (line 45): `r.over === 0 && below <= 0` where `over = st.scrollHeight - st.clientHeight` and `below = Math.max(rule - fold, tick - fold)` (line 44).

1. `hero-fits-at-rest@1920x1080`
2. `hero-fits-at-rest@1920x993`
3. `hero-fits-at-rest@1920x945`
4. `hero-fits-at-rest@1920x900`
5. `hero-fits-at-rest@1600x950`
6. `hero-fits-at-rest@1440x900`

### Block 2 — `hero-lead-whole@WxH` (lines 50-59), 3 assertions
Act: none, at rest. Windows line 51. Selector line 54: `.hero .lead`.
Predicate line 57: `r.over <= 0`, `over = l.scrollHeight - l.clientHeight`. `tail` (last 12 chars of text) is **detail only**.

7. `hero-lead-whole@1244x620`
8. `hero-lead-whole@981x620`
9. `hero-lead-whole@1440x620`

### Blocks 3+4 — interleaved, 8 assertions (lines 61-80)
One window loop (line 62) records **two** ids per iteration.
`bento-cells-fit`: `park(p, 5, 0.5)` + 600ms (64-65). Selector `.bento .cell` (67). Rows `{id: c.className.split(' ')[1], over: c.scrollHeight - c.clientHeight}` filtered `over > 2` (68-69). Predicate line 70: `cells.length === 0`.
`board-pane-fits`: `park(p, 4, 0.5)` + 600ms (72-73) — **act 4**. Selector `.pane-board` (75). Predicate line 78: `bd.x <= 2` where `x = scrollWidth - clientWidth`. **Conditional: `if (bd) record(...)`** — a missing `.pane-board` drops the assertion instead of failing it.

10. `bento-cells-fit@1920x1080`
11. `board-pane-fits@1920x1080`
12. `bento-cells-fit@1440x900`
13. `board-pane-fits@1440x900`
14. `bento-cells-fit@1244x620`
15. `board-pane-fits@1244x620`
16. `bento-cells-fit@981x620`
17. `board-pane-fits@981x620`

### Block 5 — `readout-one-column@WxH` (lines 82-88), 2 assertions
Act: none, at rest. Windows line 83. Selector line 85: `#readout` (index.html:70, fixed global chrome, `writing-mode: vertical-rl` acts.css:142-146).
Predicate line 86: `rw <= 20`, `rw = Math.round(getBoundingClientRect().width)`.

18. `readout-one-column@1244x620`
19. `readout-one-column@1189x560`

### Block 6 — `terms-explains-bands@WxH` (lines 90-105), 3 assertions
Act **6**, `park(p, 6, 0.5)` + 600ms (93-94). Windows line 91.
Selectors 97-100: `.rate-band` (count), `.rate-adds` (count of visible), `.rate-cap`, `.rate-cta .cta`. `vis(e) = height > 2 && display !== 'none'` (96).
Predicate line 102: `r.adds >= r.bands && r.cap && r.cta`.

20. `terms-explains-bands@1440x900`
21. `terms-explains-bands@1244x620`
22. `terms-explains-bands@981x620`

### Block 6b — `terms-cta-on-stage@WxH` (lines 107-160), 7 assertions
Act **6**, but **inline `behavior: 'instant'`**, not `park()` (127-130), + 600ms.
Windows line 120. Selectors 133-138: `.rate-cta .cta`, `.act-terms .act-stage`, `.rate-cta .mono.tiny` (measured by Range rects), `.rate-bill-b` index `[1]`, `.rate`.
Measured twice: monthly (146), then annual — `[...querySelectorAll('.rate-bill-b')][1]` clicked if `height > 2`, else `.rate.classList.add('is-annual')` forced (147-152), + 500ms, re-read (154).
Predicate 155-157: `ok(x) = x.vis && x.bottom <= x.fold && x.top >= 0 && x.over <= 2 && x.micro !== null && x.micro <= x.fold`, asserted as `ok(mo) && ok(yr)`.

23. `terms-cta-on-stage@390x721`
24. `terms-cta-on-stage@390x780`
25. `terms-cta-on-stage@390x800`
26. `terms-cta-on-stage@901x821`
27. `terms-cta-on-stage@1244x661`
28. `terms-cta-on-stage@901x930`
29. `terms-cta-on-stage@1920x821`

### Block 7 — `chaos-claim-always-legible` (lines 162-190), 1 assertion
30. `chaos-claim-always-legible` — one window, 1244x620 (172). Act **1**, `park(p, 1, t)` + 300ms, **27 samples** `k = 48…74`, `t = k/120` (176-179) — the engine's own quantisation grid (scroll.js:82).
Pairs (173-174): `['lead', '.lead-swap .sw-a', '.lead-swap .sw-b']`, `['head', '.head-swap .sw-p', '.head-swap .sw-s']`.
Per sample, per pair: `Math.max(opacity(a), opacity(b))` (180-182); running minimum kept across both pairs (183-185).
Predicate line 187: `worst.v >= 0.6`.

### Block 7b — `chaos-fits-at-rest@WxH` (lines 192-231), 5 assertions
Act **1**, `park(p, 1, 0.45)` + **1400ms** (199-200). Windows line 197.
Selectors: `.act-chaos .act-stage` (202); `.cv-cost` (209); box list line 218 — `.converge, .cv-col, .cv-who, .cv-seq, .cv-cost, .cv-bd, .cv-one, .cv-brand, .cv-fix, .cv-end`. `.cv-mo` deliberately excluded (211-217).
Predicate line 228: `r.over === 0 && r.boxOver === 0 && r.n === 3 && below <= 0`, where `boxOver = Math.max(0, ...boxes.map(scrollHeight - clientHeight))` (221), `n = cost.length` (222), `below = Math.round(Math.max(...cost.map(ink)) - innerHeight)` (223, 227).

31. `chaos-fits-at-rest@1440x900`
32. `chaos-fits-at-rest@1244x620`
33. `chaos-fits-at-rest@981x620`
34. `chaos-fits-at-rest@390x844`
35. `chaos-fits-at-rest@320x620`

### Block 8 — `ladder-walks-ten-levels` (lines 233-249), 1 assertion
36. `ladder-walks-ten-levels` — 1440x900 (235). Act **2**, walked at `t = 0.2, 0.4, 0.6, 0.8, 0.95` × 420ms, then 500ms (238-239).
Selectors 241-242: `.levels li`, `.scrub-bar i`.
Predicate line 246: `r.reached >= r.rows`, `reached` = rows with class `on` **or** `past` (243). `bar.style.width` is detail only.

### Block 9 — `reduced-motion-stills-atmosphere` (lines 251-257), 1 assertion
37. `reduced-motion-stills-atmosphere` — 1244x620, `{reducedMotion: 'reduce'}` (253). No park. Selector `#atmos` (254, index.html:41-42).
Predicate line 255: `!v || v.paused`.

### Block 10 — `teach-no-silent-clip@1244x620` (lines 259-270), 1 assertion
38. `teach-no-silent-clip@1244x620` — **route `/teach`** (261). No park.
Selector: `document.querySelectorAll('*')` (262) — every element on the page.
Predicate line 268: `bad.length === 0`, where bad = elements with `overflowY === 'hidden' || 'clip'` **and** `height > 2` **and** `scrollHeight - clientHeight > 2` (263-266), reported as `tagName.firstClass` (267).

### Block 11 — `console-panes-fit@WxH` (lines 272-304), 5 assertions
Act **4**. Detailed in §2.

39. `console-panes-fit@1600x821`
40. `console-panes-fit@1600x860`
41. `console-panes-fit@901x860`
42. `console-panes-fit@1600x1001`
43. `console-panes-fit@1440x900`

### Block 12 — `board-is-a-board@WxH` (lines 306-352), 7 assertions
Act **4**. Detailed in §2.

44. `board-is-a-board@900x620`
45. `board-is-a-board@700x660`
46. `board-is-a-board@661x731`
47. `board-is-a-board@601x620`
48. `board-is-a-board@390x844`
49. `board-is-a-board@390x660`
50. `board-is-a-board@600x760`

### Block 13 — `bento-bodies-trim-not-slice@WxH` (lines 354-390), 4 assertions
Act **5**, inline `behavior` default (369-372: `scrollTo({top: …})` — **no `behavior` key**, so smooth applies) + 700ms.
Windows line 367. Selector line 374: `.bento .cell p.c-b`.
Per element (375-385): `lh = parseFloat(lineHeight)`; `clamp = webkitLineClamp === 'none' ? null : parseInt(...)`; `box = getBoundingClientRect().height`; `lines = new Set(Range rects.map(r => Math.round(r.top))).size`; `holds = Math.floor((box + 0.6) / lh)`; `cut = lines > Math.min(clamp || lines, holds) && (clamp === null || clamp > holds)`.
Predicate line 387: `bad.length === 0`. 664px height deliberately excluded (365-366).

51. `bento-bodies-trim-not-slice@390x780`
52. `bento-bodies-trim-not-slice@390x844`
53. `bento-bodies-trim-not-slice@412x800`
54. `bento-bodies-trim-not-slice@390x700`

---

## 2. Everything that touches act 4 / `.console` / `.pane*` / `.board2d` / the teaching console

Act 4 is `<section class="act act-session" data-act="session" id="session">` (index.html:182-193), whose only content pane is `<div class="console" id="console">` (index.html:189), built by `buildConsole(document.getElementById('console'), showcase.data.S042)` at **main.js:37**. `console.js:36-91` appends in order: `.pane.pane-plan` (child 1), `.pane.pane-board` (child 2), `.pane.pane-ctl` (child 3), `.prep#cs-prep` (child 4), `p.sr[role=status]` (child 5). `.pane { … overflow: hidden; }` (product.css:42) — **all three panes clip silently**.

Selector-uniqueness check on `/`: **there is exactly one `.board2d` in the document and it is act 4's**. compare.js:264-269 states this deliberately — *"Deliberately NOT `.board2d` and not act 4's component. `.board2d` is asserted by … the board that gate measures in act 4."* Act 1's coach boards are `svg.cv-bd` (compare.js:273). `#readout` is global chrome (index.html:70), not act 4. No other gate selector collides with act-4 content.

### 2a. `board-pane-fits@WxH` — assertions 11, 13, 15, 17 (lines 72-78)

```js
    await park(p, 4, 0.5);
    await p.waitForTimeout(600);
    const bd = await p.evaluate(() => {
      const e = document.querySelector('.pane-board');
      return e ? { x: e.scrollWidth - e.clientWidth, y: e.scrollHeight - e.clientHeight } : null;
    });
    if (bd) record(`board-pane-fits@${w}x${h}`, bd.x <= 2, `${bd.x}px of board past its pane`);
```
Horizontal only — `y` is computed and **discarded**. Uses the smooth `park()` with a 600ms settle. Runs at 1920x1080, 1440x900, 1244x620, 981x620.

### 2b. `console-panes-fit@WxH` — assertions 39-43 (lines 272-304)

```js
  for (const [w, h] of [[1600, 821], [1600, 860], [901, 860], [1600, 1001], [1440, 900]]) {
    const p = await page(b, w, h);
    const bad = [];
    for (const f of [0.5, 0.8]) {
      // `behavior: instant` for the reason block 6b gives: the shared park() animates.
      await p.evaluate(({ f }) => {
        const a = window.__w.engine.acts[4];
        scrollTo({ top: Math.round(a.top + a.len * f), behavior: 'instant' });
      }, { f });
      await p.waitForTimeout(700);
      const rows = await p.evaluate(() => ['.pane-plan', '.pane-ctl', '.pane-board']
        .map((s) => {
          const e = document.querySelector(s);
          return e ? { s, y: e.scrollHeight - e.clientHeight, x: e.scrollWidth - e.clientWidth } : null;
        })
        .filter((r) => r && (r.y > 2 || r.x > 2)));
      for (const r of rows) bad.push(`t=${f} ${r.s} +${r.y}y +${r.x}x`);
    }
    record(`console-panes-fit@${w}x${h}`, bad.length === 0,
      bad.length ? bad.join(', ') : 'both panes and the board hold their content at t=0.5 and t=0.8');
```
Both axes, all three panes, **two scroll fractions** (0.5 and 0.8) — 30 measurements across 5 windows. A `display:none` pane reports `0 - 0 = 0` and passes silently (`.pane-plan` is `display:none` at ≤600px, annot.css:562, and at 601-900 × ≤730/760, annot.css:701-705 — none of these 5 windows).
Its own header comment names the S042 string it is timed against, line 275-277:
```js
  // fractions are asserted because `.mv-res` ("Wins the rook.") joins the move row from
  // t~0.75 and wraps it, which makes t=0.8 the worse state by up to 26px; a t=0.5-only
  // assertion would have called P1b's first attempt clean.
```

### 2c. `board-is-a-board@WxH` — assertions 44-50 (lines 306-352)

```js
  for (const [w, h] of [[900, 620], [700, 660], [661, 731], [601, 620], [390, 844],
    [390, 660], [600, 760]]) {
    const p = await page(b, w, h);
    let worst = null;
    for (const f of [0.5, 0.8]) {
      await p.evaluate(({ f }) => {
        const a = window.__w.engine.acts[4];
        scrollTo({ top: Math.round(a.top + a.len * f), behavior: 'instant' });
      }, { f });
      await p.waitForTimeout(700);
      const r = await p.evaluate(() => {
        const bd = document.querySelector('.board2d');
        const pb = document.querySelector('.pane-board');
        const sq = document.querySelector('.board2d .sq');
        if (!bd || !pb) return null;
        const box = bd.getBoundingClientRect();
        return { w: Math.round(box.width * 10) / 10, h: Math.round(box.height * 10) / 10,
          sq: sq ? Math.round(sq.getBoundingClientRect().width * 10) / 10 : 0,
          overY: pb.scrollHeight - pb.clientHeight, overX: pb.scrollWidth - pb.clientWidth };
      });
      if (!r) { worst = { f, bad: true }; break; }
      r.f = f;
      if (!worst || r.w < worst.w) worst = r;
    }
    const r = worst;
    const ok = !!r && !r.bad && r.w >= 64 && r.sq >= 8 && Math.abs(r.w - r.h) <= 1
      && r.overY <= 2 && r.overX <= 2;
```
Five clauses: board width ≥ 64px, first square ≥ 8px, square within 1px (`|w - h| <= 1`), `.pane-board` overflow ≤ 2 in both axes. The **worse of the two fractions by board width** is what gets reported (343). Missing `.board2d`/`.pane-board` → `bad: true` → FAIL (341). `.board2d` is `.b-slot` with the class added by the `Board2D` constructor (console.js:157, board2d.js:31); it always builds 64 `.sq` divs regardless of FEN (board2d.js:33-39), so `.sq` presence is FEN-independent. Sizing is `height: min(100%, 100cqw)` against `.pane-board { container-type: inline-size; grid-template-rows: auto minmax(0,1fr) auto auto }` (product.css:87-95) — **the board's row is the `1fr`, so anything else in the pane growing shrinks the board**. The 64px/8px bar is documented as a collapse detector, not a legibility bar (313-316).

### 2d. `teach-no-silent-clip@1244x620` — assertion 38 (lines 259-270)

```js
    const p = await page(b, 1244, 620, { route: '/teach' });
    const bad = await p.evaluate(() => [...document.querySelectorAll('*')].filter((e) => {
      const s = getComputedStyle(e);
      if (s.overflowY !== 'hidden' && s.overflowY !== 'clip') return false;
      const r = e.getBoundingClientRect();
      return r.height > 2 && e.scrollHeight - e.clientHeight > 2;
    }).map((e) => e.tagName.toLowerCase() + '.' + (e.className || '').split(' ')[0]));
    record('teach-no-silent-clip@1244x620', bad.length === 0, bad.length ? bad.join(', ') : 'clean');
```
`/teach` is a separate document (`app/teach/index.html`) in its own `t-*` namespace under `teach.css` only. It shares **one** component with act 4: `Board2D` (teach/main.js:1, 50 → `.t-board` gains `.board2d`). It does **not** contain `.pane-*`, `.ic-*`, `.an-*`, or act 4's `.prep`; its prep view is `#t-prep.t-prep`. Because the predicate is `*`, any `overflow-y: hidden` box on `/teach` — including the shared `.board2d` — is in scope.

### 2e. Not act 4, for the record
`readout-one-column` (18-19) resolves `#readout`, which main.js:120 feeds the literal string `'knight stage'` **while act 4 is active** — but the assertion measures at scroll 0 with no park, where `n < 3` yields `''` (chrome.js:139) and the text is just `d1`. `chaos-fits-at-rest`'s box list contains `.cv-bd` (a compare.js SVG), not act 4's board.

---

## 3. Dependence on the session act 4 currently renders (S042)

`showcase.data.S042` is consumed at exactly **one** place on `/`: `main.js:37`. Every other builder is fed `catalog.json`, `stages.json`, `variance.json` or `pricing.json` (main.js:34-46). Act 1's `.cv-*` panels come from `variance.json`, whose session is **S012** (variance.json `id: "S012"`, compare.js:405 `const s = variance.session`), so `chaos-fits-at-rest` is S042-independent. `bento.js:57-73` hardcodes S042's figures as literal strings (`'47<small>min in five parts</small>'`, `[['warm-up',6],['introduce',8],['explain',13],['discuss',6],['practice',14]]`) — so `bento-cells-fit` and `bento-bodies-trim-not-slice` are unaffected by a data swap and would only go **factually** stale (S115's five parts total 42, not 47).

### Would break if act 4 switched to S115

Field growth, S042 → S115 (measured from `app/data/showcase.json`):

| field | element | S042 | S115 |
|---|---|---|---|
| `thinking_routine.focus` | `.routine .r-f` (console.js:126) | 121 ch | **785 ch** |
| `puzzles[0].prompt` | `.prompt` in `.pane-board` (console.js:158) | 47 ch | **318 ch** |
| `puzzles[0].explanation` | `.solve` in `.pane-ctl` (console.js:277) | 115 ch | **399 ch** |
| `coach_notes.typical_mistakes[0]` | `.sol-l li` (console.js:283) | 46 ch | **216 ch** |
| `solution.moves` | `.mv` chips in `.mv-row` (console.js:275) | 3 | **5** |
| `solution.result` | `.mv-res` (console.js:276) | `"Wins the rook."` | `"Checkmate."` |
| `fen` | `code.fen-v` (console.js:315) | 36 ch | **47 ch** |
| `title` | `.cs-title` (console.js:112) | 12 ch | **23 ch** |
| `stage` / `level` / `unit` | `.cs-id`, `.cs-chain li.acc` | 2 Knight / 2A / 1 Double Attacks | 3 Bishop / 3B / 5 Advanced Tactics & Sacrifice |

Unchanged and therefore safe: `estimated_duration_min` 60, `puzzles.length` 8, `prerequisites.sessions` 3 ids of equal width, `flowRows()` length 5 (console.js:94-105 → `${rows.length} timed parts`), `difficulty_stars` 1, `side_to_move` `w`.

**39-43 `console-panes-fit@1600x821 / 1600x860 / 901x860 / 1600x1001 / 1440x900`** — the direct break. Line 301:
```js
    record(`console-panes-fit@${w}x${h}`, bad.length === 0,
```
against line 296:
```js
          return e ? { s, y: e.scrollHeight - e.clientHeight, x: e.scrollWidth - e.clientWidth } : null;
```
- `.pane-plan` carries the 785-char `.r-f`. `annot.css:307-311` hides `.pane-plan .routine` only at (901-1000 × 821-845), (1140-1559 × 821-895) and (≥1560 × 821-975) — so the routine **renders in full at 901x860, 1440x900 and 1600x1001**, three of the five windows.
- `.pane-ctl` carries the 399-char `.solve`. It is clamped only at 901-934 × 821-869 (5 lines, annot.css:359-362), ≥1460 × ≤940 (4 lines, annot.css:405, 413-416) and ≤900px (3 lines, annot.css:520) — so `.solve` is **unclamped at 1440x900 and 1600x1001**. `.sol-k`/`.sol-l` (the 216-char mistake) are hidden at 901x860 (annot.css:342), 1600x821 and 1600x860 (annot.css:405-406) but **shown at 1440x900 and 1600x1001**. Two extra `.mv` chips wrap in `flex-wrap: wrap` (product.css:110).
- `.pane-board` carries the 318-char `.prompt`, which has **no clamp at any breakpoint** (only `product.css:116` and `product.css:475`).

**44-50 `board-is-a-board@*`** — line 346:
```js
    const ok = !!r && !r.bad && r.w >= 64 && r.sq >= 8 && Math.abs(r.w - r.h) <= 1
      && r.overY <= 2 && r.overX <= 2;
```
`.pane-plan` is `display: none` at all seven windows (annot.css:562 at ≤600px; annot.css:701-705 at 601-900 × ≤730 and 601-700 × ≤760 — covers 900x620, 700x660, 661x731, 601x620), so the routine cannot reach them. The 318-char prompt can: `.board2d`'s row is the `minmax(0,1fr)` of `.pane-board`'s `auto minmax(0,1fr) auto auto` (product.css:88), so a prompt six times longer takes its height directly out of the board — the exact collapse mechanism the block was written for (309-312: *"the board's `minmax(0, 1fr)` row absorbs whatever the other panes leave, so `.board2d` rendered **2 x 2px**"*). Both `r.w >= 64` and `r.sq >= 8` are at risk, and `r.overY <= 2` with them.

**11, 13, 15, 17 `board-pane-fits@*`** — line 78:
```js
    if (bd) record(`board-pane-fits@${w}x${h}`, bd.x <= 2, `${bd.x}px of board past its pane`);
```
Horizontal only. The longer FEN (`code.fen-v`, 36 → 47 chars, `.fen-v { font-size: 0.48rem }` annot.css:412) is in `.pane-ctl`, not `.pane-board`, so the risk here is limited to the prompt forcing a min-content width — lower than the vertical ones, but S042-derived all the same.

**38 `teach-no-silent-clip@1244x620`** — S042-coupled today only through `/teach`'s own default, `app/js/teach/main.js:49`:
```js
  S.id = FREE.includes(wanted) ? wanted : 'S042';
```
with `const FREE = ['S001', 'S042', 'S115']` (teach/main.js:15). The gate loads `/teach` with no `?s=` query (line 261), so it measures S042 there too. Changing only main.js:37 leaves this assertion untouched; changing teach/main.js:49 as well brings S115's strings under an `overflow-y: hidden` sweep of every element on the page.

### Comments that name S042's data and would go stale (not assertions)
- `tools/gate.cjs:276` — `` `.mv-res` ("Wins the rook.") `` — S042's `solution.result`.
- `app/js/gl/director.js:170-172` — *"Act 4 shows session S042, which lives in the Knight stage"*; `HUES[1]` (Knight blue) is hardcoded for the session band at director.js:173-174. Nothing in the gate measures hue.
- `app/css/annot.css:263`, `:661`, `:678` — all three cite `.mv-res` "Wins the rook." as the t≈0.75 growth event the tiers are measured against.
- `app/css/annot.css:625` — `.pane-foot`'s "47 of 60 min scripted"; `app/js/ui/bento.js:57-58` — *"S042, the session act 4 renders: the same five timed rows, and the same 47 of 60 minutes"*.

---

## 4. Assertions that count, assert exactly-0 overflow, or assert text

### Counting elements (in the predicate)
| # | id | line | count |
|---|---|---|---|
| 10,12,14,16 | `bento-cells-fit` | 70 | `cells.length === 0` — `.bento .cell` with `over > 2` |
| 20-22 | `terms-explains-bands` | 102 | `r.adds >= r.bands` — visible `.rate-adds` count vs `.rate-band` count. **Vacuous if both are 0** |
| 31-35 | `chaos-fits-at-rest` | 228 | `r.n === 3` — **exact** count of `.cv-cost` |
| 36 | `ladder-walks-ten-levels` | 246 | `r.reached >= r.rows` — `.levels li` with `.on`/`.past` vs total. **`0 >= 0` passes if the list is empty**; the "ten" in the name is nowhere in the predicate |
| 38 | `teach-no-silent-clip` | 268 | `bad.length === 0` over `querySelectorAll('*')` |
| 39-43 | `console-panes-fit` | 301 | `bad.length === 0` over 3 selectors × 2 fractions |
| 51-54 | `bento-bodies-trim-not-slice` | 387, and line-box count at 381 | `bad.length === 0`; inside it, `lines = new Set(Range rects.map(r => Math.round(r.top))).size` counts rendered line boxes |

Structural count fact: **`board-pane-fits` is the only conditional `record`** (line 78). If `.pane-board` vanished, `results` would hold 50 entries and the gate would print `50/50 assertions pass` and `exit 0`. Nothing in the file asserts `results.length === 54`.

### Exactly 0 overflow
| # | id | line | box |
|---|---|---|---|
| 1-6 | `hero-fits-at-rest` | 45 | `r.over === 0` on `.act-threshold .act-stage` |
| 31-35 | `chaos-fits-at-rest` | 228 | `r.over === 0` on `.act-chaos .act-stage` **and** `r.boxOver === 0` on the 10-selector list at line 218 |

Everything else carries a tolerance: `<= 0` (line 57, `.hero .lead`), `<= 2` (lines 69, 78, 144/155, 266, 298, 347), `<= 20` px width (line 86), `<= 1` px squareness (line 346).

### Text content
**No assertion's predicate compares text.** The one text read is line 55:
```js
      return { over: l.scrollHeight - l.clientHeight, tail: l.textContent.trim().slice(-12) };
```
and `tail` is used only in the detail string at line 57 (`sentence ends "${r.tail}"`). Other string reads are also detail-only: `bar.style.width` (244, printed at 247), the bento cell class at 68/385, the `'clicked'`/`'forced'` route at 147-152 (printed at 158). The nearest thing to a text predicate is computed-style parsing: `cs.webkitLineClamp` (378) and `parseFloat(cs.lineHeight)` (377), plus `getComputedStyle(...).opacity` (181-182).

---

## 5. Running one assertion or a group

```js
 10  const ONLY = process.argv[2] || '';
...
394  const shown = results.filter((r) => !ONLY || r.id.includes(ONLY));
395  const pass = shown.filter((r) => r.ok).length;
396  console.log('');
397  for (const r of shown) console.log(`  ${r.ok ? 'PASS' : 'FAIL'}  ${r.id.padEnd(34)} ${r.detail}`);
398  console.log(`\n  ${pass}/${shown.length} assertions pass. The loop stops when this reads all PASS.\n`);
399  process.exit(pass === shown.length ? 0 : 1);
```

- One positional argument, `process.argv[2]`. No flags, no `--help`; `argv[3]` and beyond are ignored. Usage is the comment at lines 6-7. STATE.md:38 and :47 are the project's own record: `node tools/gate.cjs` = 54 assertions, ~8 min, must come back 54/54; `node tools/gate.cjs hero # or chaos, console, bento, board, teach, ladder…`.
- The match is a **case-sensitive substring of the id** (`r.id.includes(ONLY)`), not a regex or a prefix.
- **Filtering does not skip work.** The filter is applied at line 394, after `await b.close()` at line 392. All 54 assertions execute, every page loads, the full ~8 minutes elapses; only the printed rows and the pass count shrink.
- Group sizes by argument: `hero` → 9 (1-9); `board` → 11 (`board-pane-fits` 4 + `board-is-a-board` 7); `console` → 5; `bento` → 8 (`bento-cells-fit` 4 + `bento-bodies-trim-not-slice` 4); `terms` → 10 (3 + 7); `chaos` → 6 (1 + 5); `teach` → 1; `ladder` → 1; `readout` → 2; `reduced` → 1; `board-is-a-board` → 7; `board-pane-fits` → 4.
- A window can be used as the filter — `node tools/gate.cjs 1440x900` → 6 rows (`hero-fits-at-rest`, `bento-cells-fit`, `board-pane-fits`, `terms-explains-bands`, `chaos-fits-at-rest`, `console-panes-fit`). The three suffix-less ids (`chaos-claim-always-legible`, `ladder-walks-ten-levels`, `reduced-motion-stills-atmosphere`, plus `teach-no-silent-clip@1244x620` which carries its window in the literal id) are unreachable by window filter even though `ladder-walks-ten-levels` runs at 1440x900.
- **Exit code is scoped to the filter**: `pass === shown.length` (line 399). A filtered run exits 0 while unshown assertions fail. A filter matching nothing gives `shown.length === 0`, `pass === 0`, `0 === 0` → prints `0/0 assertions pass` and **exits 0** — a typo'd filter reads green.
- `padEnd(34)` (line 397) does not truncate; ids of 35 chars (`bento-bodies-trim-not-slice@390x844`) push their detail column out of alignment.
- Preconditions: `tools/serve.cjs` listening on 127.0.0.1:4321 (serve.cjs:7, 67); the sibling Playwright install at `C:/Users/MUS/CurriculumWebsite/node_modules/playwright` (line 8) — this project has no `node_modules`.

## HARD CONSTRAINTS
- 54 assertions from 15 record() sites; the count is the sum of the window arrays at gate.cjs:31 (6), :51 (3), :62 (4x2=8), :83 (2), :91 (3), :120 (7), :172 (1), :197 (5), :235 (1), :253 (1), :261 (1), :283 (5), :321-322 (7), :367 (4). Nothing asserts results.length, so a dropped record silently shrinks the suite.
- gate.cjs:78 — `if (bd) record(`board-pane-fits@${w}x${h}`, bd.x <= 2, ...)` — the only conditional record. A missing `.pane-board` yields 50/50 PASS and exit 0, not a FAIL.
- gate.cjs:45 — `record(`hero-fits-at-rest@${w}x${h}`, r.over === 0 && below <= 0, ...)` — `.act-threshold .act-stage` must overflow EXACTLY 0, and `.hero-rule`/`.ticker` ink must not pass innerHeight, at all six windows.
- gate.cjs:228 — `record(`chaos-fits-at-rest@${w}x${h}`, r.over === 0 && r.boxOver === 0 && r.n === 3 && below <= 0, ...)` — `.act-chaos .act-stage` and every box in the ten-selector list at gate.cjs:218 must overflow EXACTLY 0, and `.cv-cost` must number EXACTLY 3.
- gate.cjs:218 — the act-1 box list is `[...document.querySelectorAll('.converge, .cv-col, .cv-who, .cv-seq, .cv-cost, .cv-bd, .cv-one, .cv-brand, .cv-fix, .cv-end')]`; `.cv-mo` is deliberately excluded (gate.cjs:211-217) because its 1px is line-box rounding.
- gate.cjs:301 — `record(`console-panes-fit@${w}x${h}`, bad.length === 0, ...)` over `['.pane-plan', '.pane-ctl', '.pane-board']` at t=0.5 AND t=0.8, both axes, tolerance 2px, at 1600x821 / 1600x860 / 901x860 / 1600x1001 / 1440x900.
- gate.cjs:346 — `const ok = !!r && !r.bad && r.w >= 64 && r.sq >= 8 && Math.abs(r.w - r.h) <= 1 && r.overY <= 2 && r.overX <= 2;` — board >= 64px, first `.sq` >= 8px, square within 1px, `.pane-board` clean in both axes, at the worse of t=0.5/t=0.8, across seven stacked-layout windows.
- gate.cjs:268 — `record('teach-no-silent-clip@1244x620', bad.length === 0, ...)` over `document.querySelectorAll('*')`: no element on /teach may be `overflow-y: hidden|clip`, taller than 2px, and overflowing by more than 2px.
- gate.cjs:187 — `record('chaos-claim-always-legible', worst.v >= 0.6, ...)`: across k=48..74 of t=k/120, `max(opacity(.lead-swap .sw-a), opacity(.lead-swap .sw-b))` and `max(opacity(.head-swap .sw-p), opacity(.head-swap .sw-s))` must both stay >= 0.6.
- gate.cjs:155-157 — `const ok = (x) => x.vis && x.bottom <= x.fold && x.top >= 0 && x.over <= 2 && x.micro !== null && x.micro <= x.fold; record(`terms-cta-on-stage@${w}x${h}`, ok(mo) && ok(yr), ...)` — asserted in BOTH billing states, monthly then annual.
- gate.cjs:102 — `record(`terms-explains-bands@${w}x${h}`, r.adds >= r.bands && r.cap && r.cta, ...)` — every `.rate-band` explained, plus `.rate-cap` and `.rate-cta .cta` visible.
- gate.cjs:387 with gate.cjs:383 — `cut = lines > Math.min(clamp || lines, holds) && (clamp === null || clamp > holds)`: every visible `.bento .cell p.c-b` box must hold at least as many line boxes as its `-webkit-line-clamp` asks for.
- gate.cjs:57 — `record(`hero-lead-whole@${w}x${h}`, r.over <= 0, ...)` on `.hero .lead`.
- gate.cjs:86 — `record(`readout-one-column@${w}x${h}`, rw <= 20, ...)` — `#readout` must stay one vertical column (>20px means the string wrapped).
- gate.cjs:246 — `record('ladder-walks-ten-levels', r.reached >= r.rows, ...)` — every `.levels li` must carry `on` or `past` after walking act 2 at t=0.2/0.4/0.6/0.8/0.95.
- gate.cjs:255 — `record('reduced-motion-stills-atmosphere', paused, ...)` — under `reducedMotion: 'reduce'`, `#atmos` must be absent or paused.
- gate.cjs:24-25 — `park` uses smooth scrolling; gate.cjs:127-130, :288-291, :326-329 use `behavior: 'instant'` instead. gate.cjs:122-126 records that the shared park() is unreliable on a ~19,000px document and must be converged only with a re-baseline.
- gate.cjs:394 and :399 — `const shown = results.filter((r) => !ONLY || r.id.includes(ONLY))` then `process.exit(pass === shown.length ? 0 : 1)`: the filter is applied after all 54 have run, and the exit code is scoped to the filtered subset. An unmatched filter prints 0/0 and exits 0.
- gate.cjs:8 — `const PW = 'C:/Users/MUS/CurriculumWebsite/node_modules/playwright'` and gate.cjs:11 — `const URL = 'http://127.0.0.1:4321'`: Playwright is borrowed from a sibling tree and the server (tools/serve.cjs:7, :67) must be listening.
- app/js/main.js:37 — `const playPuzzle = buildConsole(document.getElementById('console'), showcase.data.S042);` is the single point where act 4's session is chosen on `/`.
- app/js/teach/main.js:49 — `S.id = FREE.includes(wanted) ? wanted : 'S042';` is /teach's default, which is what `teach-no-silent-clip` measures (gate.cjs:261 loads /teach with no query).
- app/css/product.css:42 — `.pane { ... overflow: hidden; min-width: 0; }`: all three console panes clip silently, which is why gate.cjs:293-298 has to read scrollHeight/scrollWidth rather than look for a scrollbar.
- app/css/product.css:87-90 — `.pane-board { container-type: inline-size; align-content: stretch; grid-template-rows: auto minmax(0, 1fr) auto auto; }` with `.board2d { height: min(100%, 100cqw) }`: the board occupies the `1fr` row, so any growth in `.prompt` or the pane header comes straight out of the board's size.
- app/js/ui/compare.js:264-267 — act 1's coach boards are `.cv-bd`, "Deliberately NOT `.board2d` and not act 4's component. `.board2d` is asserted by ... the board that gate measures in act 4." There must remain exactly one `.board2d` on `/`, act 4's.

## UNKNOWNS
- I did not run the gate. Whether it currently reads 54/54 is unverified — no server was confirmed listening on 127.0.0.1:4321, and STATE.md:38 quotes ~8 min for a full run.
- Whether `.pane-board` actually resolves at all four `board-pane-fits` windows (1920x1080, 1440x900, 1244x620, 981x620) is inferred from the markup and CSS, not measured. If it ever does not, the suite becomes 50 assertions and still exits 0.
- The S115 breakage in section 3 is derived statically — from measured field lengths in app/data/showcase.json plus the media-query tiers in annot.css/product.css — not from a rendered measurement. I did not swap main.js:37 and re-run, so the exact px overflow per window is unknown; only the mechanism and which windows leave the growing elements visible are established.
- Whether the smooth-scroll flaw the file records at gate.cjs:122-126 currently mismeasures `bento-cells-fit` (gate.cjs:64, shared park, 600ms) or `bento-bodies-trim-not-slice` (gate.cjs:369-372, `scrollTo` with no `behavior` key, 700ms) is unverified — both use the animating path with a settle shorter than the 1400ms STATE.md:56-58 says a parked frame needs.
- For `terms-cta-on-stage`, which of the seven windows take the `clicked` branch versus the `forced` branch (gate.cjs:147-152) was not measured; the file's own comment at 107-119 says <=720px height hides `.rate-cap` per terms.css:241-242, which I did not open.
- Whether `.routine` / `.sol-k` / `.sol-l` / `.solve` visibility at 901x860, 1440x900 and 1600x1001 is affected by any later-cascading rule I did not read (I read annot.css:300-712 and product.css:41-120, 380-490 only). acts.css and the remainder of product.css were not audited for act-4 overrides.
- The count of `.rate-band` elements and whether `r.adds >= r.bands` can currently go vacuous (both zero) — app/js/ui/rate.js was not read.
- Whether any tool other than gate.cjs is expected to be re-baselined alongside it (the gate references `.audit5/cssom.cjs`, tools/meas.cjs, tools/say.cjs indirectly via STATE.md:44-52); their coupling to the 54 ids was not examined.