// The stopping condition for the 2026-08-29 audit fix loop. Every assertion here is
// a defect that was measured on 2026-08-29 and must read PASS before that item is
// ticked in HANDOFF.md. Extend it as decisions land; never delete an assertion to
// make the gate green.
//
// usage: node tools/gate.cjs            all assertions
//        node tools/gate.cjs hero       only ids containing "hero"
const PW = 'C:/Users/MUS/CurriculumWebsite/node_modules/playwright';
const { chromium } = require(PW);
const ONLY = process.argv[2] || '';
const URL = 'http://127.0.0.1:4321';
const results = [];

const record = (id, ok, detail) => { results.push({ id, ok, detail }); };

const inkBottom = () => {}; // placeholder, defined in-page

async function page(b, w, h, opts = {}) {
  const p = await b.newPage({ viewport: { width: w, height: h }, ...opts });
  await p.goto(URL + (opts.route || '/'), { waitUntil: 'load' });
  await p.waitForTimeout(2400);
  return p;
}
const park = (p, i, f) =>
  p.evaluate(({ i, f }) => { const a = window.__w.engine.acts[i]; scrollTo({ top: Math.round(a.top + a.len * f) }); }, { i, f });

(async () => {
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=gl', '--enable-unsafe-swiftshader'] });

  // 1 — the hero fits its own stage at rest, and its last two rows stay above the fold
  for (const [w, h] of [[1920, 1080], [1920, 993], [1920, 945], [1920, 900], [1600, 950], [1440, 900]]) {
    const p = await page(b, w, h);
    const r = await p.evaluate(() => {
      const st = document.querySelector('.act-threshold .act-stage');
      const ink = (el) => {
        if (!el || getComputedStyle(el).display === 'none') return null;
        const rg = document.createRange(); rg.selectNodeContents(el);
        const rs = [...rg.getClientRects()];
        return rs.length ? Math.max(...rs.map((x) => x.bottom)) : el.getBoundingClientRect().bottom;
      };
      return { over: st.scrollHeight - st.clientHeight, rule: ink(document.querySelector('.hero-rule')),
        tick: ink(document.querySelector('.ticker')), fold: innerHeight };
    });
    const below = Math.max(r.rule ? r.rule - r.fold : 0, r.tick ? r.tick - r.fold : 0);
    record(`hero-fits-at-rest@${w}x${h}`, r.over === 0 && below <= 0,
      `stage over ${r.over}px, lowest ink ${Math.round(below)}px past the fold`);
    await p.close();
  }

  // 2 — the hero lead is never clamped mid-sentence
  for (const [w, h] of [[1244, 620], [981, 620], [1440, 620]]) {
    const p = await page(b, w, h);
    const r = await p.evaluate(() => {
      const l = document.querySelector('.hero .lead');
      return { over: l.scrollHeight - l.clientHeight, tail: l.textContent.trim().slice(-12) };
    });
    record(`hero-lead-whole@${w}x${h}`, r.over <= 0, `${r.over}px clamped away, sentence ends "${r.tail}"`);
    await p.close();
  }

  // 3 — no bento card cuts its own content; 4 — the console board pane fits its column
  for (const [w, h] of [[1920, 1080], [1440, 900], [1244, 620], [981, 620]]) {
    const p = await page(b, w, h);
    await park(p, 5, 0.5);
    await p.waitForTimeout(600);
    const cells = await p.evaluate(() =>
      [...document.querySelectorAll('.bento .cell')]
        .map((c) => ({ id: c.className.split(' ')[1], over: c.scrollHeight - c.clientHeight }))
        .filter((c) => c.over > 2));
    record(`bento-cells-fit@${w}x${h}`, cells.length === 0,
      cells.length ? cells.map((c) => `${c.id} +${c.over}px`).join(', ') : 'every card holds its content');
    await park(p, 4, 0.5);
    await p.waitForTimeout(600);
    const bd = await p.evaluate(() => {
      const e = document.querySelector('.pane-board');
      return e ? { x: e.scrollWidth - e.clientWidth, y: e.scrollHeight - e.clientHeight } : null;
    });
    if (bd) record(`board-pane-fits@${w}x${h}`, bd.x <= 2, `${bd.x}px of board past its pane`);
    await p.close();
  }

  // 5 — the vertical readout stays one column
  for (const [w, h] of [[1244, 620], [1189, 560]]) {
    const p = await page(b, w, h);
    const rw = await p.evaluate(() => Math.round(document.querySelector('#readout').getBoundingClientRect().width));
    record(`readout-one-column@${w}x${h}`, rw <= 20, `${rw}px wide (>20 means the string wrapped)`);
    await p.close();
  }

  // 6 — the licence sheet explains every band, and keeps its currency and billing controls
  for (const [w, h] of [[1440, 900], [1244, 620], [981, 620]]) {
    const p = await page(b, w, h);
    await park(p, 6, 0.5);
    await p.waitForTimeout(600);
    const r = await p.evaluate(() => {
      const vis = (e) => e && e.getBoundingClientRect().height > 2 && getComputedStyle(e).display !== 'none';
      return { bands: document.querySelectorAll('.rate-band').length,
        adds: [...document.querySelectorAll('.rate-adds')].filter(vis).length,
        cap: vis(document.querySelector('.rate-cap')),
        cta: vis(document.querySelector('.rate-cta .cta')) };
    });
    record(`terms-explains-bands@${w}x${h}`, r.adds >= r.bands && r.cap && r.cta,
      `${r.adds} of ${r.bands} bands explained, currency+billing row ${r.cap ? 'shown' : 'HIDDEN'}, CTA ${r.cta ? 'shown' : 'HIDDEN'}`);
    await p.close();
  }

  // 6b — the terms act keeps its one filled CTA on the pinned stage on a phone, in both
  // billing states. 721-833px tall was a band that the <=900px column layout and its
  // short-phone tier left unthinned: at 390x780 the stage overflowed 52px and the CTA sat
  // 29.89px below the fold, clipped by `.act-stage`. The annual state has to be measured
  // too, because pressing "2 months free" makes the sheet taller: 110px over at 390x780
  // against monthly's 52px. In this band the control is visible, so the annual half clicks
  // it. The force branch is for <=720px, where `.rate-cap` and therefore the toggle are
  // hidden (terms.css:241-242) but `.is-annual` survives a resize - so a reader who toggles
  // at a taller window, or whose URL bar collapses and returns, is still in that state.
  // P3 added the three desktop windows: at 901x821 the stage was over by 63px and the CTA sat 63px
  // past the fold, at 1244x661 by 34px, and at 901x930 only the annual state clipped (+2) — the
  // same block's own logic covers both billing states, so the desktop bands ride on it rather than
  // getting a second implementation.
  for (const [w, h] of [[390, 721], [390, 780], [390, 800], [901, 821], [1244, 661], [901, 930], [1920, 821]]) {
    const p = await page(b, w, h);
    // `behavior: instant`, not the shared park(): base.css:9 sets `scroll-behavior: smooth`
    // under no-preference, and on a ~19,000px document (19,032px at 390x780) a phone-height
    // park is still animating 600ms later - measured, it read the CTA at page coordinate
    // 3609 at scrollY 11520 instead of 621 at its parked 15676. The shared park() has the
    // same flaw; converge them when it is fixed and the gate is re-baselined.
    await p.evaluate(() => {
      const a = window.__w.engine.acts[6];
      scrollTo({ top: Math.round(a.top + a.len * 0.5), behavior: 'instant' });
    });
    await p.waitForTimeout(600);
    const read = () => p.evaluate(() => {
      const c = document.querySelector('.rate-cta .cta');
      const r = c.getBoundingClientRect();
      const st = document.querySelector('.act-terms .act-stage');
      // the CTA's box is not the whole row: `no email, no card` sits under it, and at 390 wide
      // it was the thing a 36px addition pushed off the stage while the button itself stayed on
      const m = document.querySelector('.rate-cta .mono.tiny');
      const rg = document.createRange(); rg.selectNodeContents(m);
      const rs = [...rg.getClientRects()];
      return { bottom: Math.round(r.bottom), top: Math.round(r.top), fold: innerHeight,
        vis: r.height > 2 && getComputedStyle(c).display !== 'none',
        micro: rs.length ? Math.round(Math.max(...rs.map((x) => x.bottom))) : null,
        over: st.scrollHeight - st.clientHeight };
    });
    const mo = await read();
    const how = await p.evaluate(() => {
      const t = [...document.querySelectorAll('.rate-bill-b')][1];
      if (t && t.getBoundingClientRect().height > 2) { t.click(); return 'clicked'; }
      document.querySelector('.rate').classList.add('is-annual');
      return 'forced';
    });
    await p.waitForTimeout(500);
    const yr = await read();
    const ok = (x) => x.vis && x.bottom <= x.fold && x.top >= 0 && x.over <= 2
      && x.micro !== null && x.micro <= x.fold;
    record(`terms-cta-on-stage@${w}x${h}`, ok(mo) && ok(yr),
      `monthly CTA ${mo.bottom} micro ${mo.micro} of ${mo.fold}, stage over ${mo.over}px; annual (${how}) CTA ${yr.bottom} micro ${yr.micro} of ${yr.fold}, stage over ${yr.over}px`);
    await p.close();
  }

  // 7 — act 1's TWO crossfading slots never leave a blank frame. Extended 2026-09-04, and the
  // old form could not witness either pair: it stepped 0.05 from 0.30, so on the lead pair it
  // reported a faintest point of 0.875 when the real floor is 0.667, and the h2 pair — added
  // the same day, a 0.008-wide cut — fell between two samples entirely and would have passed
  // without being looked at.
  // Now it walks the engine's OWN grid. scroll.js:82 quantises --t to k/120, so those are the
  // only values a reader can reach and 1/120 is the finest step worth sampling; 0.40 to 0.62
  // is the band both pairs cross in. Both pairs are measured and the worse of the two is what
  // the assertion reports, so retiming either one cannot hide behind the other.
  {
    const p = await page(b, 1244, 620);
    const PAIRS = [['lead', '.lead-swap .sw-a', '.lead-swap .sw-b'],
      ['head', '.head-swap .sw-p', '.head-swap .sw-s']];
    let worst = { t: 0, v: 1, pair: '-' };
    for (let k = Math.round(0.40 * 120); k <= Math.round(0.62 * 120); k++) {
      const t = k / 120;
      await park(p, 1, t);
      await p.waitForTimeout(300);
      const vs = await p.evaluate((pairs) => pairs.map(([name, a, b]) => [name, Math.max(
        Number(getComputedStyle(document.querySelector(a)).opacity),
        Number(getComputedStyle(document.querySelector(b)).opacity))]), PAIRS);
      for (const [name, v] of vs) {
        if (v < worst.v) worst = { t: Number(t.toFixed(4)), v: Number(v.toFixed(3)), pair: name };
      }
    }
    record('chaos-claim-always-legible', worst.v >= 0.6,
      `faintest slot is the ${worst.pair} pair, ${worst.v} opacity at t=${worst.t} (want >= 0.6)`);
    await p.close();
  }

  // 7b — act 1 fits its own pinned stage at the frame its third row is fullest, and the
  // cost lines stay above the fold. Added 2026-09-01 with PITCH step 5, which put three
  // per-column cost lines in the grid row a single shared caption used to span: act 1 was
  // the only act with no fit assertion of its own, and the phone widths are where its
  // columns are 89-110px wide.
  for (const [w, h] of [[1440, 900], [1244, 620], [981, 620], [390, 844], [320, 620]]) {
    const p = await page(b, w, h);
    await park(p, 1, 0.45);
    await p.waitForTimeout(1400);
    const r = await p.evaluate(() => {
      const st = document.querySelector('.act-chaos .act-stage');
      const ink = (el) => {
        if (!el || getComputedStyle(el).display === 'none') return null;
        const rg = document.createRange(); rg.selectNodeContents(el);
        const rs = [...rg.getClientRects()];
        return rs.length ? Math.max(...rs.map((x) => x.bottom)) : el.getBoundingClientRect().bottom;
      };
      const cost = [...document.querySelectorAll('.cv-cost')];
      // Extended 2026-09-03 with the board rebuild and again 2026-09-04 when the payoff
      // became a three-card-wide answer: `.cv-bd`, `.cv-one`, `.cv-brand`, `.cv-fix` and
      // `.cv-end` are the boxes that carry it.
      // `.cv-mo` is deliberately NOT here — its box is one line of a clamp()ed
      // font-size, so at 1440x900 it is 17.42px and reports scroll 18 / client 17. That
      // 1px is ceil - floor on a fractional line box, not a clip (nothing about a <p>
      // with visible overflow can cut), and its parent `.cv-seq` is in the list and
      // reads 0. Asserting it would assert browser rounding.
      const boxes = [...document.querySelectorAll('.converge, .cv-col, .cv-who, .cv-seq, .cv-cost, .cv-bd, .cv-one, .cv-brand, .cv-fix, .cv-end')];
      return {
        over: st.scrollHeight - st.clientHeight,
        boxOver: Math.max(0, ...boxes.map((e) => e.scrollHeight - e.clientHeight)),
        n: cost.length,
        low: Math.max(...cost.map((e) => ink(e) ?? -1e9)),
        fold: innerHeight,
      };
    });
    const below = Math.round(r.low - r.fold);
    record(`chaos-fits-at-rest@${w}x${h}`, r.over === 0 && r.boxOver === 0 && r.n === 3 && below <= 0,
      `stage over ${r.over}px, worst box over ${r.boxOver}px, ${r.n} cost lines, lowest ${below}px past the fold`);
    await p.close();
  }

  // 8 — the level ladder actually walks its ten levels while act 2 is on screen
  {
    const p = await page(b, 1440, 900);
    // Walk the act rather than jumping to its end: the fill is damped, so a single
    // park reads lower than a reader scrolling through ever sees.
    for (const t of [0.2, 0.4, 0.6, 0.8, 0.95]) { await park(p, 2, t); await p.waitForTimeout(420); }
    await p.waitForTimeout(500);
    const r = await p.evaluate(() => {
      const rows = [...document.querySelectorAll('.levels li')];
      const bar = document.querySelector('.scrub-bar i');
      return { rows: rows.length, reached: rows.filter((x) => x.classList.contains('on') || x.classList.contains('past')).length,
        bar: bar ? bar.style.width : '-' };
    });
    record('ladder-walks-ten-levels', r.reached >= r.rows,
      `${r.reached} of ${r.rows} rows reached by the end of the act, fill bar at ${r.bar}`);
    await p.close();
  }

  // 9 — nothing animates on its own for a reader who asked for no motion
  {
    const p = await page(b, 1244, 620, { reducedMotion: 'reduce' });
    const paused = await p.evaluate(() => { const v = document.getElementById('atmos'); return !v || v.paused; });
    record('reduced-motion-stills-atmosphere', paused, paused ? 'atmosphere video paused' : 'atmosphere video still playing');
    await p.close();
  }

  // 10 — regression guard: /teach cuts nothing without its own fade affordance
  {
    const p = await page(b, 1244, 620, { route: '/teach' });
    const bad = await p.evaluate(() => [...document.querySelectorAll('*')].filter((e) => {
      const s = getComputedStyle(e);
      if (s.overflowY !== 'hidden' && s.overflowY !== 'clip') return false;
      const r = e.getBoundingClientRect();
      return r.height > 2 && e.scrollHeight - e.clientHeight > 2;
    }).map((e) => e.tagName.toLowerCase() + '.' + (e.className || '').split(' ')[0]));
    record('teach-no-silent-clip@1244x620', bad.length === 0, bad.length ? bad.join(', ') : 'clean');
    await p.close();
  }

  // 11 — act 4's two annotated panes hold their own content in the band above the phone
  // stack. Nothing in this gate watched act 4's panes before P1b: `board-pane-fits` measures
  // the board's width only, and `.pane-plan` / `.pane-ctl` are both `overflow-y: hidden`, so
  // they cut silently — the item was found by a reviewer looking at a neighbour. Both scroll
  // fractions are asserted because `.mv-res` ("Wins the rook.") joins the move row from
  // t~0.75 and wraps it, which makes t=0.8 the worse state by up to 26px; a t=0.5-only
  // assertion would have called P1b's first attempt clean.
  // The windows: 1600x821 is the worst measured (`.pane-ctl` +74 before the fix) and the one
  // the head ceiling closes; 1600x860 is the window the item names; 901x860 is the narrow end,
  // where the pane is 248px wide (+155 before); 1600x1001 is the pocket attempt 1 left
  // uncovered above its own ceiling; 1440x900 is the reference window (+15 before).
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
    await p.close();
  }

  // 12 — the board is a board: eight squares of a size a reader can tell apart. P2's defect was
  // invisible to `board-pane-fits`, which measures horizontal overflow only: below 901px wide the
  // console stacks and the board's `minmax(0, 1fr)` row absorbs whatever the other panes leave,
  // so `.board2d` rendered **2 x 2px** at 601x620, 700x620, 900x620 and 900x720 with overflow of
  // 0 in the axis the old assertion watched. The bar here is the design's own worst acceptable
  // case in the same stacked layout — 390x844 ships 114px, 14px a square — rounded down to 64px
  // and 8px a square, and the board must still be square and inside its pane.
  // READ THE BAR FOR WHAT IT IS: a COLLAPSE detector, not a legibility bar. The piece art is
  // inset 6% and drawn at 88% (product.css:108), so 8px a square is a ~7px piece — enough to
  // prove a board exists, not enough to read a position. The design's own target in this layout
  // is nearer 14px a square, so a 65px PASS here is "not collapsed", not "fine".
  // Both scroll fractions, for the reason block 11 gives: at t=0.8 the board fell to 62.5px at
  // 601-700 x 845-848 where t=0.5 reads 80-88px, and only the two-fraction form catches it.
  // P16 added 390x660 and 600x760: the two windows PASS2's own item named, both of which read
  // a 2x2px board and a 3.1px board before the controls pane was bounded.
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
    record(`board-is-a-board@${w}x${h}`, ok,
      r && !r.bad ? `board ${r.w}x${r.h}, ${r.sq}px a square, pane over ${r.overY}y ${r.overX}x at its worse fraction t=${r.f} (want >= 64px, >= 8px, square, no overflow)`
        : 'board or pane missing');
    await p.close();
  }

  // 13 — act 5's cards trim their bodies with an ellipsis rather than slicing a line in half.
  // `bento-cells-fit` runs only at >=981 wide, so nothing watched the phone lattice: there each
  // cell gets the stage's height / 6 and the body is left 11-30px against a 15.23px line box, so
  // a `-webkit-line-clamp: 3` could not draw its ellipsis inside the box and the reader got the
  // first line sliced through the middle ("...0 errors. No"). This asserts the arithmetic that
  // makes a clamp honest: the box must hold at least as many lines as the clamp asks for whenever
  // the text is longer than the clamp. It is not a "does it overflow" check — a clamped element
  // always reports scrollHeight > clientHeight, which is the clamp working.
  // 390x700 is the phone-with-toolbar window and it is in the list because the fix's first pass
  // certified a band it did not test: a straggler clamp 170 lines later in product.css was still
  // asking for two lines in a one-line box there, so all eight bodies sliced. 664 is deliberately
  // NOT here — it cannot pass without a content decision, and a red line would be the honest
  // record for it rather than a window quietly omitted (see PASS2's P6 residual).
  for (const [w, h] of [[390, 780], [390, 844], [412, 800], [390, 700]]) {
    const p = await page(b, w, h);
    await p.evaluate(() => {
      const a = window.__w.engine.acts[5];
      scrollTo({ top: Math.round(a.top + a.len * 0.5), behavior: 'instant' });
    });
    await p.waitForTimeout(700);
    const bad = await p.evaluate(() => [...document.querySelectorAll('.bento .cell p.c-b')].map((e) => {
      const cs = getComputedStyle(e);
      if (cs.display === 'none') return null;
      const lh = parseFloat(cs.lineHeight);
      const clamp = cs.webkitLineClamp === 'none' ? null : parseInt(cs.webkitLineClamp, 10);
      const box = e.getBoundingClientRect().height;
      const rg = document.createRange(); rg.selectNodeContents(e);
      const lines = new Set([...rg.getClientRects()].map((r) => Math.round(r.top))).size;
      const holds = Math.floor((box + 0.6) / lh);
      const cut = lines > Math.min(clamp || lines, holds) && (clamp === null || clamp > holds);
      const cell = e.closest('.cell');
      return cut ? `${(cell.className.split(' ').find((c) => c.startsWith('b-')) || '?')} box ${Math.round(box)}px holds ${holds} of clamp ${clamp}` : null;
    }).filter(Boolean));
    record(`bento-bodies-trim-not-slice@${w}x${h}`, bad.length === 0,
      bad.length ? bad.join(', ') : 'every visible card body ends in its own ellipsis');
    await p.close();
  }

  await b.close();

  const shown = results.filter((r) => !ONLY || r.id.includes(ONLY));
  const pass = shown.filter((r) => r.ok).length;
  console.log('');
  for (const r of shown) console.log(`  ${r.ok ? 'PASS' : 'FAIL'}  ${r.id.padEnd(34)} ${r.detail}`);
  console.log(`\n  ${pass}/${shown.length} assertions pass. The loop stops when this reads all PASS.\n`);
  process.exit(pass === shown.length ? 0 : 1);
})();
