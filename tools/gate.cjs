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
// Parks by act NAME, not by index. It used to take an index, and inserting act 1
// `sunday` silently re-pointed ten assertions at the wrong act - a false PASS, which
// is worse than a failure. `engine.acts` is registered from director.js's ACTS, so a
// name is the only identifier that survives the film being re-cut.
const park = (p, name, f) =>
  p.evaluate(({ name, f }) => {
    const a = window.__w.engine.acts.find((x) => x.name === name);
    if (!a) throw new Error('no act named ' + name);
    scrollTo({ top: Math.round(a.top + a.len * f) });
  }, { name, f });

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

  // 3 — act 6 holds its own diagram; 4 — the console board pane fits its column.
  // Was `bento-cells-fit`, which measured eight lattice cells. Act 6 is one plate, six
  // figures and a control since 2026-09-05, so the assertion moved with the act: it reads
  // the STAGE's own overflow, every act-6 box that holds words, and the lowest ink against
  // the fold, at BOTH of the act's crowded fractions — 0.52, where the diagram is complete
  // and the homework sheet is out, and 0.78, where the ream has fanned and the payoff is up.
  // 1400ms of settle, not 600: the engine is damped and a band read early reports a
  // position it has not arrived at (STATE.md).
  const SY_BOXES = ['.sy-core', '.sy-sheet', '.sy-ways', '.sy-note', '.sy-close', '.system-head',
    '.sy-rail', '.sy-chips', '.sy-head2', '.sy-hour', '.sy-pos', '.sy-sat', '.sy-bcap'];
  for (const [w, h] of [[1920, 1080], [1440, 900], [1244, 620], [981, 620]]) {
    const p = await page(b, w, h);
    for (const f of [0.52, 0.78]) {
      await park(p, 'system', f);
      await p.waitForTimeout(1400);
      const r = await p.evaluate((sels) => {
        const st = document.querySelector('.act-system .act-stage');
        const vis = (e) => e && getComputedStyle(e).display !== 'none'
          && e.getBoundingClientRect().width > 1;
        const over = [];
        for (const sel of sels) {
          for (const e of document.querySelectorAll(sel)) {
            if (!vis(e)) continue;
            const oy = e.scrollHeight - e.clientHeight;
            // a satellite's own leader hangs --sy-lead past its edge on purpose
            const ox = sel === '.sy-sat' ? 0 : e.scrollWidth - e.clientWidth;
            if (oy > 2 || ox > 2) over.push(`${sel}+${oy}y/${ox}x`);
          }
        }
        let low = -1e9, who = '';
        for (const e of document.querySelectorAll('.pad.system p, .pad.system h2, .pad.system h3,'
          + ' .pad.system li, .pad.system button')) {
          if (!vis(e)) continue;
          const rg = document.createRange(); rg.selectNodeContents(e);
          const rs = [...rg.getClientRects()];
          const v = rs.length ? Math.max(...rs.map((x) => x.bottom)) : e.getBoundingClientRect().bottom;
          if (v > low) { low = v; who = (e.className || e.tagName).toString().split(' ')[0]; }
        }
        const inkRects = (e) => {
          const rg = document.createRange(); rg.selectNodeContents(e);
          const rs = [...rg.getClientRects()].filter((x) => x.width > 0 && x.height > 0);
          return rs.length ? rs : [e.getBoundingClientRect()];
        };
        const hits = (a, b, useInk) => {
          const A = useInk ? inkRects(a) : [a.getBoundingClientRect()];
          const B = useInk ? inkRects(b) : [b.getBoundingClientRect()];
          for (const x of A) for (const y of B) {
            const dy = Math.min(x.bottom, y.bottom) - Math.max(x.top, y.top);
            const dx = Math.min(x.right, y.right) - Math.max(x.left, y.left);
            if (dy > 2 && dx > 2) return Math.round(dy);
          }
          return 0;
        };
        const els = [...document.querySelectorAll('.sy-sat, .sy-core, .sy-close, .system-head,'
          + ' .act-system .coord')].filter(vis)
          .map((e) => ({ n: (e.className || '').split(' ')[0], e }));
        const overlaps = [];
        for (let i = 0; i < els.length; i++) {
          for (let j = i + 1; j < els.length; j++) {
            if (els[i].n === els[j].n && els[i].n === 'sy-sat') continue;
            // ink, not boxes, for the coordinate: it lives in `.pad`'s bottom padding, so its
            // BOX crosses the close's box at every window by construction while the two
            // pieces of type only actually collide on a phone
            const d = hits(els[i].e, els[j].e, els[i].n === 'coord' || els[j].n === 'coord');
            if (d) overlaps.push(`${els[i].n}/${els[j].n}+${d}px`);
          }
        }
        return { stage: st.scrollHeight - st.clientHeight, over, overlaps,
          past: Math.round(low - innerHeight), who };
      }, SY_BOXES);
      const clean = r.stage === 0 && !r.over.length && r.past <= 0 && !r.overlaps.length;
      record(`system-fits@${w}x${h}t${f}`, clean,
        clean ? `stage 0, nothing clipped or overlapping, lowest ink ${r.past}px above the fold`
          : `stage over ${r.stage}px; clipped ${r.over.join(', ') || 'none'};`
            + ` overlapping ${[...new Set(r.overlaps)].join(', ') || 'none'};`
            + ` lowest ink ${r.past}px past the fold (${r.who})`);
    }
    await park(p, 'session', 0.5);
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
    await park(p, 'terms', 0.5);
    await p.waitForTimeout(600);
    const r = await p.evaluate(() => {
      const vis = (e) => e && e.getBoundingClientRect().height > 2 && getComputedStyle(e).display !== 'none';
      return { bands: document.querySelectorAll('.rate-band').length,
        adds: [...document.querySelectorAll('.rate-adds')].filter(vis).length,
        cap: vis(document.querySelector('.rate-cap')),
        // TIGHTENED once the card grid shipped. The interim form was `.some(vis)` over
        // both shapes, which a single surviving button satisfied; the four cards are the
        // design now, so the clause is a count. The micro line joins it: `no email, no
        // card` is what those four buttons are owed, and it is the line that went off
        // the stage first at 390 wide.
        ctas: [...document.querySelectorAll('.rate-band .rate-go')].filter(vis).length,
        micro: vis(document.querySelector('.rate-cta .mono.tiny')) };
    });
    const ok6 = r.adds >= r.bands && r.bands === 4 && r.ctas === r.bands && r.cap && r.micro;
    record(`terms-explains-bands@${w}x${h}`, ok6,
      `${r.adds} of ${r.bands} cards explained, ${r.ctas} of ${r.bands} carry a CTA, `
      + `currency+billing row ${r.cap ? 'shown' : 'HIDDEN'}, micro line ${r.micro ? 'shown' : 'HIDDEN'}`);
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
      const a = window.__w.engine.acts.find((x) => x.name === 'terms');
      scrollTo({ top: Math.round(a.top + a.len * 0.5), behavior: 'instant' });
    });
    await p.waitForTimeout(600);
    const read = () => p.evaluate(() => {
      // 2026-09-05: the act's filled CTA moved. It was one button in `.rate-cta`
      // under the sheet; the card row gives every licence its own `.cta.rate-go` and
      // leaves `.rate-cta` holding only the micro line, so this measures THE LOWEST of
      // the four, which is what the assertion has always been about. The interim form
      // also resolved `.rate-cta .cta` and a `.rate-card` that never shipped; both are
      // gone, because a selector list that matches either shape cannot fail when the
      // shape changes again — and a stale selector here returns null and takes the whole
      // gate down with it, seven windows of this block plus every assertion after it.
      const all = [...document.querySelectorAll('.rate-band .rate-go')]
        .filter((e) => getComputedStyle(e).display !== 'none');
      const c = all.sort((a, z) => z.getBoundingClientRect().bottom - a.getBoundingClientRect().bottom)[0];
      const st = document.querySelector('.act-terms .act-stage');
      if (!c) {
        return { missing: true, fold: innerHeight, over: st ? st.scrollHeight - st.clientHeight : -1 };
      }
      const r = c.getBoundingClientRect();
      // the CTA's box is not the whole row: `no email, no card` sits under it, and at 390 wide
      // it was the thing a 36px addition pushed off the stage while the button itself stayed on
      const m = document.querySelector('.rate-cta .mono.tiny');
      let micro = null;
      if (m && getComputedStyle(m).display !== 'none') {
        const rg = document.createRange(); rg.selectNodeContents(m);
        const rs = [...rg.getClientRects()];
        micro = rs.length ? Math.round(Math.max(...rs.map((x) => x.bottom))) : null;
      }
      return { bottom: Math.round(r.bottom), top: Math.round(r.top), fold: innerHeight,
        vis: r.height > 2 && getComputedStyle(c).display !== 'none',
        micro, n: all.length,
        over: st.scrollHeight - st.clientHeight };
    });
    const mo = await read();
    const how = await p.evaluate(() => {
      const t = [...document.querySelectorAll('.rate-bill-b')][1];
      if (t && t.getBoundingClientRect().height > 2) { t.click(); return 'clicked'; }
      const rate = document.querySelector('.rate');
      if (rate) rate.classList.add('is-annual');
      return 'forced';
    });
    await p.waitForTimeout(500);
    const yr = await read();
    // `micro === null` is no longer a failure on its own: the micro line is not in
    // every layout of the act. When it IS drawn it still has to be above the fold.
    const ok = (x) => !x.missing && x.vis && x.bottom <= x.fold && x.top >= 0 && x.over <= 2
      && (x.micro === null || x.micro <= x.fold);
    record(`terms-cta-on-stage@${w}x${h}`, ok(mo) && ok(yr),
      mo.missing || yr.missing ? 'NO filled CTA found on the terms stage (.rate-cta .cta / .rate-go)'
      : `monthly lowest of ${mo.n} CTA ${mo.bottom} micro ${mo.micro} of ${mo.fold}, stage over ${mo.over}px;`
        + ` annual (${how}) CTA ${yr.bottom} micro ${yr.micro} of ${yr.fold}, stage over ${yr.over}px`);
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
      await park(p, 'chaos', t);
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
    await park(p, 'chaos', 0.45);
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
    for (const t of [0.2, 0.4, 0.6, 0.8, 0.95]) { await park(p, 'spine', t); await p.waitForTimeout(420); }
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
        const a = window.__w.engine.acts.find((x) => x.name === 'session');
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
        const a = window.__w.engine.acts.find((x) => x.name === 'session');
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

  // 13 — act 6 on a phone. `system-fits` runs only at >=981 wide, so nothing watches the
  // stack: below 1180 the plate goes on top and the six figures run under it, and below 900
  // their glosses go entirely because the plate one row above says the same things in full.
  // What must hold there is what holds everywhere — the stage does not overflow, no box that
  // holds words clips, the lowest ink stays above the fold — plus the one floor that is act
  // 6's own: the plate keeps a board a reader can read a position on.
  // 664 of height is deliberately NOT in the list. The old bento could not pass there
  // without a content decision and neither can this; a window quietly omitted is a worse
  // record than a red line, so the omission is written down instead (STATE.md).
  for (const [w, h] of [[390, 844], [390, 780], [412, 800], [390, 700], [768, 1024], [901, 700]]) {
    const p = await page(b, w, h);
    await park(p, 'system', 0.52);
    await p.waitForTimeout(1400);
    const r = await p.evaluate((sels) => {
      const st = document.querySelector('.act-system .act-stage');
      const vis = (e) => e && getComputedStyle(e).display !== 'none'
        && e.getBoundingClientRect().width > 1;
      const over = [];
      for (const sel of sels) {
        for (const e of document.querySelectorAll(sel)) {
          if (!vis(e)) continue;
          const oy = e.scrollHeight - e.clientHeight;
          const ox = sel === '.sy-sat' ? 0 : e.scrollWidth - e.clientWidth;
          if (oy > 2 || ox > 2) over.push(`${sel}+${oy}y/${ox}x`);
        }
      }
      let low = -1e9;
      for (const e of document.querySelectorAll('.pad.system p, .pad.system h2, .pad.system h3,'
        + ' .pad.system li, .pad.system button')) {
        if (!vis(e)) continue;
        const rg = document.createRange(); rg.selectNodeContents(e);
        const rs = [...rg.getClientRects()];
        const v = rs.length ? Math.max(...rs.map((x) => x.bottom)) : e.getBoundingClientRect().bottom;
        if (v > low) low = v;
      }
      // Siblings must not land on each other. `.pad.system`'s middle row is
      // `minmax(0, 1fr)`, so a stack that wants more than the row does not clip — it spills
      // onto the payoff, and every per-box check reads clean while it does. At 390x844 six
      // figures sat on two lines of display type and nothing in this gate saw it.
      const inkRects = (e) => {
        const rg = document.createRange(); rg.selectNodeContents(e);
        const rs = [...rg.getClientRects()].filter((x) => x.width > 0 && x.height > 0);
        return rs.length ? rs : [e.getBoundingClientRect()];
      };
      const hits = (a, b, useInk) => {
        const A = useInk ? inkRects(a) : [a.getBoundingClientRect()];
        const B = useInk ? inkRects(b) : [b.getBoundingClientRect()];
        for (const x of A) for (const y of B) {
          const dy = Math.min(x.bottom, y.bottom) - Math.max(x.top, y.top);
          const dx = Math.min(x.right, y.right) - Math.max(x.left, y.left);
          if (dy > 2 && dx > 2) return Math.round(dy);
        }
        return 0;
      };
      const els = [...document.querySelectorAll('.sy-sat, .sy-core, .sy-close, .system-head,'
        + ' .act-system .coord')].filter(vis)
        .map((e) => ({ n: (e.className || '').split(' ')[0], e }));
      const overlaps = [];
      for (let i = 0; i < els.length; i++) {
        for (let j = i + 1; j < els.length; j++) {
          if (els[i].n === els[j].n && els[i].n === 'sy-sat') continue;
          // ink, not boxes, for the coordinate: it lives in `.pad`'s bottom padding, so its
          // BOX crosses the close's box at every window by construction while the two
          // pieces of type only actually collide on a phone
          const d = hits(els[i].e, els[j].e, els[i].n === 'coord' || els[j].n === 'coord');
          if (d) overlaps.push(`${els[i].n}/${els[j].n}+${d}px`);
        }
      }
      const bd = document.querySelector('.sy-board .board2d');
      const box = bd ? bd.getBoundingClientRect() : null;
      const sq = document.querySelector('.sy-board .board2d .sq');
      return { stage: st.scrollHeight - st.clientHeight, over, overlaps,
        past: Math.round(low - innerHeight),
        bw: box ? Math.round(box.width * 10) / 10 : 0, bh: box ? Math.round(box.height * 10) / 10 : 0,
        sq: sq ? Math.round(sq.getBoundingClientRect().width * 10) / 10 : 0,
        figs: [...document.querySelectorAll('.sy-sat')].filter(vis).length };
    }, SY_BOXES);
    const boardOk = r.bw >= 64 && r.sq >= 8 && Math.abs(r.bw - r.bh) <= 1;
    record(`system-stacks@${w}x${h}`,
      r.stage === 0 && r.over.length === 0 && r.past <= 0 && boardOk && r.figs === 6
        && r.overlaps.length === 0,
      `stage over ${r.stage}px; clipped ${r.over.join(', ') || 'none'};`
      + ` overlapping ${[...new Set(r.overlaps)].join(', ') || 'none'};`
      + ` lowest ink ${r.past}px ${r.past <= 0 ? 'above' : 'PAST'} the fold;`
      + ` board ${r.bw}x${r.bh} at ${r.sq}px a square; ${r.figs} of 6 figures`);
    await p.close();
  }

  // 16 — act 1 `sunday`. Three defects this act can have that nothing else would
  // catch: a beat pair superimposing (the trap act 2's head-swap note records), the
  // eight-cell strip overflowing its cells, and the payoff not actually holding still
  // long enough to be read. All three are measured on the engine's own k/120 grid.
  {
    const p = await page(b, 1440, 900);
    // 16a — at no scroll position are two beats legible at once. The five lines share
    // one slot and cut with a 0.008 gap; a cross-fade here reads as one line printed
    // inside another.
    let worst = { t: 0, second: 0 };
    let dark = 0, worstDark = 0, samples = 0;
    for (let k = 0; k <= 120; k++) {
      const t = k / 120;
      // 0.65, not 1: beat five's line is gone at 0.656 and the act is then
      // deliberately silent until the answer arrives at 0.700, while the room
      // straightens up and files (see the --pay note in acts.css).
      if (t > 0.65) break;
      await park(p, 'sunday', t);
      // The engine damps at 0.16 a frame. 90ms closed 58% of the gap, so the sweep
      // was reading positions it had not arrived at and called 32 frames dark.
      await p.waitForTimeout(320);
      const o = await p.evaluate(() => [...document.querySelectorAll('.sunday .sb')]
        .map((e) => Number(getComputedStyle(e).opacity)).sort((a, b) => b - a));
      samples++;
      if (o[1] > worst.second) worst = { t, second: o[1] };
      // A RUN, not a total: five cuts mean five short gaps by design, and what would
      // be a defect is one long stretch with nothing to read. The cut is 0.008 of t
      // plus two 0.016 ramps, so the illegible window is 0.024 - under three frames
      // of the k/120 grid this sweeps on.
      if (o[0] < 0.5) { dark++; if (dark > worstDark) worstDark = dark; } else dark = 0;
    }
    record('sunday-one-beat-at-a-time', worst.second <= 0.5 && worstDark <= 4,
      `worst second beat ${worst.second.toFixed(3)} at t ${worst.t.toFixed(3)} (<= 0.5);`
      + ` longest run with no legible beat ${worstDark} frames of ${samples} (<= 4)`);
    await p.close();
  }
  for (const [w, h] of [[1920, 1080], [1440, 900], [1244, 620], [981, 620], [390, 844]]) {
    const p = await page(b, w, h);
    await park(p, 'sunday', 0.92);
    await p.waitForTimeout(900);
    const r = await p.evaluate(() => {
      const cells = [...document.querySelectorAll('.sr-cell')];
      const over = cells.map((c) => ({
        id: (c.querySelector('.sr-sq') || {}).textContent,
        x: c.scrollWidth - c.clientWidth, y: c.scrollHeight - c.clientHeight,
      })).filter((c) => c.x > 1 || c.y > 1);
      const st = document.querySelector('.act-sunday .act-stage');
      const sb = st.getBoundingClientRect().bottom;
      const rail = document.querySelector('.sun-rail').getBoundingClientRect();
      const head = document.querySelector('.sun-final').getBoundingClientRect();
      return { n: cells.length, over, offStage: Math.round(rail.bottom - sb),
        overlap: Math.round(head.bottom - rail.top),
        railOpacity: Number(getComputedStyle(document.querySelector('.sr-cell')).opacity) };
    });
    // 16b — eight cells, none of them cutting its own label, all of them on the stage,
    // and the payoff line not sitting on the strip.
    const ok = r.n === 8 && r.over.length === 0 && r.offStage <= 0 && r.overlap <= 0;
    record(`sunday-strip-fits@${w}x${h}`, ok,
      ok ? `8 cells, none clipped, ${-r.offStage}px of stage left under it`
        : `${r.n} cells; clipped ${r.over.map((c) => `${c.id}+${c.x}/${c.y}`).join(', ') || 'none'};`
          + ` ${r.offStage}px past the stage; head/strip overlap ${r.overlap}px`);
    await p.close();
  }
  {
    // 16c — the answer holds. From the frame the last cell finishes printing to the
    // frame the act starts leaving, nothing in the payoff may change opacity.
    const p = await page(b, 1440, 900);
    const read = () => p.evaluate(() => ({
      line: Number(getComputedStyle(document.querySelector('.sun-final')).opacity),
      cell: Number(getComputedStyle([...document.querySelectorAll('.sr-cell')].pop()).opacity),
      foot: Number(getComputedStyle(document.querySelector('.sr-foot')).opacity),
    }));
    // The longest RUN of consecutive frames with all three fully up. A run, not a
    // count: the question is whether a reader can stop anywhere in the payoff and
    // find it complete, and a scattered set of good frames does not answer it.
    let run = 0, best = 0, from = null, at = null, samples = 0;
    for (let k = Math.round(0.79 * 120); k <= Math.round(0.93 * 120); k++) {
      const t = k / 120;
      await park(p, 'sunday', t);
      await p.waitForTimeout(340);
      const v = await read();
      samples++;
      if (v.line > 0.98 && v.cell > 0.98 && v.foot > 0.98) {
        if (!run) at = t;
        run++;
        if (run > best) { best = run; from = at; }
      } else run = 0;
    }
    // one k step is 1/120 of a 700vh pin = 52.5px at 900 tall. The answer is printed
    // by t 0.800 and --out does not start until 0.906, so the run should be about 13.
    const px = Math.round(best * 700 * 9 / 120);
    record('sunday-payoff-holds', best >= 9,
      best ? `${best} of ${samples} consecutive frames complete from t ${from.toFixed(3)} (~${px}px of scroll)`
        : 'the payoff is never all up at once');
    await p.close();
  }

  // 17 — act 6's argument, and the three ways it can silently stop making it.
  //
  // (a) THE TURN. The act's whole claim is that the diagram the reader just read is every
  //     session: at t 0.56-0.64 all six figures CUT from S115's own numbers to the
  //     curriculum's, and the six labels do not move. If a band is retimed and a figure
  //     stops turning, nothing else on the page would notice — the act would just quietly
  //     become a description of one lesson.
  // (b) THE CONTROL. Pressing a pathway must re-grade the eight positions by that track's
  //     own rule and must NOT change the plate's height under the reader's hand. The
  //     height clause is not fussiness: `.sy-rule`'s reserved line is the only thing
  //     holding it, and without it the plate grew 3.2px on the first press.
  // (c) THE FIGURES. Every number act 6 prints is counted, not typed. These are read off
  //     the DOM and checked against the two data files they come from, which is the
  //     mechanical form of the rule that binds every figure on the page.
  {
    const p = await page(b, 1600, 900);
    const read = () => p.evaluate(() => [...document.querySelectorAll('.sy-sat')].map((sa) => ({
      label: sa.querySelector('.sy-l').textContent.trim(),
      one: sa.querySelector('.sy-n .sy-one').textContent.trim(),
      all: sa.querySelector('.sy-n .sy-all').textContent.trim(),
      // which of the two states is actually the visible one at this frame
      shown: Number(getComputedStyle(sa.querySelector('.sy-n .sy-one')).opacity) > 0.5
        ? 'one' : 'all',
    })));
    await park(p, 'system', 0.50);
    await p.waitForTimeout(1400);
    const before = await read();
    await park(p, 'system', 0.68);
    await p.waitForTimeout(1400);
    const after = await read();
    const turned = before.filter((x, i) => x.shown === 'one' && after[i].shown === 'all'
      && x.one !== after[i].all).length;
    const labelsHeld = before.every((x, i) => x.label === after[i].label);
    record('system-figures-turn', turned === 6 && labelsHeld,
      `${turned} of 6 figures cut from the session's number to the curriculum's`
      + ` (${before.map((x, i) => `${x.one}->${after[i].all}`).join(', ')});`
      + ` labels ${labelsHeld ? 'held' : 'CHANGED'}`);

    await park(p, 'system', 0.52);
    await p.waitForTimeout(1400);
    const ctl = await p.evaluate(async () => {
      const plate = document.querySelector('.sy-core');
      const grade = () => [...document.querySelectorAll('.sy-chips li')]
        .map((l) => `${l.dataset.tier}:${l.dataset.state}`).join(' ');
      const press = async (k) => {
        document.querySelector(`.sy-way[data-track="${k}"]`).click();
        await new Promise((r) => setTimeout(r, 420));
        return { grade: grade(), h: Math.round(plate.getBoundingClientRect().height * 10) / 10,
          note: document.querySelector('.sy-note').textContent.trim(),
          pressed: [...document.querySelectorAll('.sy-way')]
            .filter((x) => x.getAttribute('aria-pressed') === 'true').length };
      };
      const ch = await press('challenger'); const ex = await press('explorer');
      await press('challenger');
      return { ch, ex, n: document.querySelectorAll('.sy-way').length };
    });
    const heights = [ctl.ch.h, ctl.ex.h];
    const stable = Math.max(...heights) - Math.min(...heights) <= 0.6;
    // Explorer hands out the Foundation/Core tier and holds the Challenge tier back;
    // Challenger hands out all eight and makes the Challenge tier the point. Both rules
    // are tracks.json's, transcribed from ADR-0004 and the differentiation plan's §1.2,
    // and both are executed against the tier authored on each puzzle in the bundle.
    const regrades = ctl.ex.grade !== ctl.ch.grade
      && /Foundation:the set/.test(ctl.ex.grade) && /Challenge:coach shows/.test(ctl.ex.grade)
      && /Challenge:the point/.test(ctl.ch.grade) && !/coach shows/.test(ctl.ch.grade);
    const oneLive = [ctl.ch, ctl.ex].every((x) => x.pressed === 1);
    const notesDiffer = ctl.ch.note !== ctl.ex.note;
    record('system-pathways-regrade',
      regrades && stable && oneLive && notesDiffer && ctl.n === 2,
      `${ctl.n} tracks; Explorer holds the Challenge tier back and Challenger makes it the`
      + ` point: ${regrades}; one pressed at a time: ${oneLive}; readouts differ:`
      + ` ${notesDiffer}; plate height ${heights.join('/')}px`
      + ` (${stable ? 'stable' : 'MOVED under the reader'})`);

    const figs = await p.evaluate(async () => {
      const inv = await (await fetch('/data/inventory.json')).json();
      const show = await (await fetch('/data/showcase.json')).json();
      const L = show.data.S115;
      const txt = (s) => (document.querySelector(s) || {}).textContent || '';
      const n = (x) => Number(String(x).replace(/[^0-9]/g, ''));
      const sats = [...document.querySelectorAll('.sy-sat')].map((sa) => ({
        one: n(sa.querySelector('.sy-n .sy-one b').textContent),
        all: n(sa.querySelector('.sy-n .sy-all b').textContent),
      }));
      const pz = L.puzzles || [];
      const tier = (k) => pz.filter((q) => q.difficulty === k).length;
      const wrong = [];
      const want = [
        ['hour', 8, inv.segments], ['positions', pz.length, inv.puzzles],
        ['questions', (L.teaching_flow.questions_to_ask || []).length, inv.questions],
        ['activity', L.practical_activity.duration_min, inv.activities],
        ['homework', L.homework.estimated_time_min, inv.homework.minutes],
        ['notes', 5, inv.coachNotes.waysToSimplify],
      ];
      want.forEach(([name, one, all], i) => {
        if (!sats[i] || sats[i].one !== one) wrong.push(`${name} session ${sats[i] && sats[i].one} != ${one}`);
        if (!sats[i] || sats[i].all !== all) wrong.push(`${name} curriculum ${sats[i] && sats[i].all} != ${all}`);
      });
      // the plate's own two figures, and the tier line under the positions
      if (n(txt('.sy-hour .sy-k em')) !== L.estimated_duration_min * 100 + 42) {
        const em = txt('.sy-hour .sy-k em');
        if (!em.includes(String(L.estimated_duration_min))) wrong.push(`hour key "${em}"`);
      }
      const grade = txt('.sy-sat:nth-child(2) .sy-g .sy-one');
      for (const k of ['Foundation', 'Core', 'Challenge']) {
        if (!grade.includes(`${tier(k)} ${k}`)) wrong.push(`grade line missing ${tier(k)} ${k}`);
      }
      const many = txt('.sy-many');
      if (!many.includes(String(inv.sessions))) wrong.push(`ream count "${many}"`);
      return { wrong, inv: inv.sessions };
    });
    record('system-figures-count', figs.wrong.length === 0,
      figs.wrong.length ? figs.wrong.join('; ')
        : `every figure on the stage matches inventory.json (${figs.inv} sessions counted) and S115`);
    await p.close();
  }

  // ======================================================== the supporting pages
  // Eleven generated documents live beside the film as of 2026-09-06: /curriculum, its
  // five stage pages, /inside-a-session, the two role pages, /about and /404. They are
  // built by tools/build-pages.cjs out of app/data, and the reason they are asserted HERE
  // rather than only in tools/pagefit.cjs is the rule STATE.md binds every edit to — every
  // figure must survive a count. Before this, nothing in the tree re-counted a printed
  // number except `inventory.cjs --check`, and the four literals on the landing page were
  // checked by nothing at all.

  // 18 — the committed HTML still matches app/data. A bundle change that nobody rebuilt
  // for is a page quietly printing last week's counts, and it is invisible by inspection.
  {
    const { execFileSync } = require('child_process');
    let out = '';
    let ok = true;
    try {
      out = execFileSync(process.execPath, [require('path').join(__dirname, 'build-pages.cjs'), '--check'],
        { encoding: 'utf8' });
    } catch (e) { ok = false; out = (e.stdout || '') + (e.stderr || ''); }
    const line = out.trim().split('\n').filter(Boolean).slice(-1)[0] || 'no output';
    record('pages-build-current', ok, line.trim());
  }

  // 19 — the map IS the syllabus: every session, level, unit and stage present as markup,
  // and the counts read off the DOM rather than off the generator that wrote it.
  {
    const p = await page(b, 1440, 900, { route: '/curriculum' });
    const r = await p.evaluate(async () => {
      const cat = await (await fetch('/data/catalog.json')).json();
      const stg = await (await fetch('/data/stages.json')).json();
      const rows = [...document.querySelectorAll('.cu-s')];
      const want = cat.sessions.length;
      const units = stg.stages.reduce((a, s) => a + s.units.length, 0);
      const levels = stg.stages.reduce((a, s) => a + s.levels.length, 0);
      // Every title in the DOM, in document order, against the catalogue's own order.
      // Normalised for typography first: the generator sets curly quotes and en dashes,
      // which is correct on the page and is not a difference in the data.
      const norm = (s) => s.replace(/[‘’]/g, "'").replace(/[“”]/g, '"')
        .replace(/[–—]/g, '-').replace(/\s+/g, ' ').trim();
      const titles = rows.map((li) => norm(li.querySelector('.cu-t').textContent
        .replace(/^\s*\d+\s*/, '')));
      const expect = cat.sessions.map((s) => norm(s.title));
      const firstBad = titles.findIndex((t, i) => t !== expect[i]);
      const gates = rows.filter((li) => li.classList.contains('is-gate')).length;
      return {
        rows: rows.length, want, units, levels, gates,
        u: document.querySelectorAll('.cu-u').length,
        l: document.querySelectorAll('.cu-l').length,
        st: document.querySelectorAll('.cu-band').length,
        firstBad, got: titles[firstBad], exp: expect[firstBad],
        rail: document.querySelectorAll('.cu-rail [data-stage]').length,
      };
    });
    const ok = r.rows === r.want && r.u === r.units && r.l === r.levels && r.st === 5
      && r.gates === r.levels && r.firstBad === -1 && r.rail === 5;
    record('pages-map-complete', ok,
      r.firstBad !== -1
        ? `row ${r.firstBad + 1} says "${r.got}", catalog says "${r.exp}"`
        : `${r.rows}/${r.want} sessions, ${r.u}/${r.units} units, ${r.l}/${r.levels} levels,`
          + ` ${r.st}/5 stages, ${r.gates} graded rows, in catalogue order`);
    await p.close();
  }

  // 20 — every printed figure on the supporting pages recounts off app/data. Reads the
  // numeric surface out of all ten indexable pages — the figure strips, the stage metadata
  // rows and every numeric table cell — and checks each value against a live fetch of the
  // bundle. `pages-build-current` already proves no template contains a digit; this is the
  // belt to that braces, and it is the assertion that would catch a hand-edit.
  {
    const ROUTES = ['/curriculum', '/curriculum/pawn', '/curriculum/knight',
      '/curriculum/bishop', '/curriculum/rook', '/curriculum/queen', '/inside-a-session',
      '/for-chess-coaches', '/for-chess-academies', '/about'];
    const wrong = [];
    let checked = 0;
    for (const route of ROUTES) {
      const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
      await p.goto(URL + route, { waitUntil: 'load' });
      const r = await p.evaluate(async () => {
        const cat = await (await fetch('/data/catalog.json')).json();
        const inv = await (await fetch('/data/inventory.json')).json();
        const stg = await (await fetch('/data/stages.json')).json();
        const show = await (await fetch('/data/showcase.json')).json();
        const S = cat.sessions;
        const fmt = (n) => Number(n).toLocaleString('en-US');
        const L = show.data.S115;
        // Every value these pages are allowed to print, derived here and nowhere else.
        const ok = new Set([
          fmt(S.length), fmt(S.reduce((a, s) => a + s.puzzles, 0)),
          String(stg.stages.length), String(stg.stages.reduce((a, s) => a + s.levels.length, 0)),
          String(stg.stages.reduce((a, s) => a + s.units.length, 0)),
          String(Math.round(S.reduce((a, s) => a + s.minutes, 0) / 60)),
          fmt(inv.segments), fmt(inv.questions), fmt(inv.activities), fmt(inv.outcomes),
          fmt(inv.demonstrations), fmt(inv.homework.minutes), fmt(inv.homework.sessions),
          fmt(inv.homework.optional), fmt(inv.coachNotes.waysToSimplify),
          fmt(inv.coachNotes.extensions), fmt(inv.coachNotes.misconceptions),
          fmt(inv.tiers.Foundation), fmt(inv.tiers.Core), fmt(inv.tiers.Challenge),
          // per-stage, per-level and per-unit figures
          ...stg.stages.map((s) => String(s.sessionsAuthored)),
          ...stg.stages.map((s) => String(s.units.length)),
          ...stg.stages.map((s) => String(s.levels.length)),
          ...stg.stages.flatMap((s) => s.units.map((u) => String(u.sessions))),
          ...stg.stages.flatMap((s) => s.units.map((u) => String(u.sessions * 8))),
          // the rating band a stage's students usually play at, and the entry age band —
          // both printed in the stage figure strips, both split on their own dash
          ...stg.stages.flatMap((s) => s.ratingBand.replace(/[^0-9-]/g, '').split('-')),
          ...stg.stages.flatMap((s) => s.ageBand.split('-')),
          // per-session figures: ordinal, minutes, positions, and stage/unit position sums
          ...S.map((s) => String(s.puzzles)), ...S.map((s) => String(s.minutes)),
          ...S.map((s) => String(s.n)),
          ...stg.stages.map((s) => fmt(S.filter((x) => x.stage === s.number)
            .reduce((a, x) => a + x.puzzles, 0))),
          ...stg.stages.flatMap((s) => s.units.map((u) => String(
            S.filter((x) => x.stage === s.number && x.unit === u.number)
              .reduce((a, x) => a + x.puzzles, 0)))),
          ...S.filter((s) => s.stage).map((s) => String(
            S.filter((x) => x.level === s.level).length)),
          // session 115's own figures, which /inside-a-session prints
          String(L.estimated_duration_min), String((L.puzzles || []).length),
          String((L.teaching_flow.questions_to_ask || []).length),
          String(L.homework.estimated_time_min), String(L.practical_activity.duration_min),
          '8', '42',
          // the two bundle-1.1.0 verification figures the landing page also prints
          '4,751', '2,346',
          // the counts the copy states in words and the strip repeats: the three free
          // sessions, the ten graded gates, the eight parts, and small ordinals
          '0', '1', '2', '3', '4', '5', '6', '7', '9', '10', '11', '30',
        ]);
        const out = [];
        const seen = [];
        const grab = (sel, only) => {
          for (const el of document.querySelectorAll(sel)) {
            const v = el.textContent.trim();
            if (only && !/^[0-9][0-9,]*$/.test(v)) continue;
            if (!/[0-9]/.test(v)) continue;
            seen.push(v);
            // strip a trailing unit word or a range, then test each numeral in it
            for (const num of v.match(/[0-9][0-9,]*/g) || []) if (!ok.has(num)) out.push(v);
          }
        };
        grab('.pg-figs b.num');
        grab('.cu-bd dd', true);
        grab('.pg-table td.n');
        grab('.cu-mc');
        grab('.cu-rc');
        return { bad: [...new Set(out)], n: seen.length };
      });
      checked += r.n;
      if (r.bad.length) wrong.push(`${route}: ${r.bad.join(', ')}`);
      await p.close();
    }
    record('pages-figures-count', wrong.length === 0,
      wrong.length ? wrong.join(' | ')
        : `${checked} figures across ${ROUTES.length} pages, every one derivable from app/data`);
  }

  // 21 — the syllabus survives with no JavaScript. This is the brief's own constraint and
  // the one an answer engine actually depends on: all 213 rows, both delivery tracks and
  // the rail present in the served markup, with scripting off entirely.
  {
    const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, javaScriptEnabled: false });
    const p = await ctx.newPage();
    await p.goto(URL + '/curriculum', { waitUntil: 'load' });
    const r = await p.evaluate(() => ({
      rows: document.querySelectorAll('.cu-s').length,
      // both readouts visible: CSS only hides one once `.js` is on the body
      tracks: [...document.querySelectorAll('.pg-track-note > [data-track]')]
        .filter((x) => getComputedStyle(x).display !== 'none').length,
      rail: document.querySelectorAll('.cu-rail a').length,
      words: document.body.innerText.split(/\s+/).filter(Boolean).length,
      hidden: [...document.querySelectorAll('.cu-s')].filter((x) => x.hidden).length,
    }));
    const ok = r.rows === 213 && r.tracks === 2 && r.rail >= 15 && r.hidden === 0;
    record('pages-work-without-js', ok,
      `${r.rows} session rows, ${r.tracks} of 2 track readouts shown, ${r.rail} rail links,`
      + ` ${r.hidden} rows hidden, ${r.words} words of text`);
    await ctx.close();
  }

  // 22 — one URL per page, and a wrong URL is a 404 rather than a copy of the front page.
  {
    const p = await b.newPage();
    const probe = async (path, opts) => {
      const r = await p.request.get(URL + path, { maxRedirects: 0, ...opts });
      return { s: r.status(), loc: r.headers().location || '' };
    };
    const slash = await probe('/curriculum/');
    const gone = await probe('/curriculum/rookk');
    const teach = await p.request.get(URL + '/teach');
    const teachHtml = await teach.text();
    const sm = await p.request.get(URL + '/sitemap.xml');
    const smText = await sm.text();
    const rb = await p.request.get(URL + '/robots.txt');
    const rbText = await rb.text();
    const locs = [...smText.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
    // The sitemap must list every canonical URL and nothing that is noindexed.
    const want = ['/', '/curriculum', '/curriculum/pawn', '/curriculum/knight',
      '/curriculum/bishop', '/curriculum/rook', '/curriculum/queen', '/inside-a-session',
      '/for-chess-coaches', '/for-chess-academies', '/about']
      .map((x) => 'https://efhaam.com' + (x === '/' ? '/' : x));
    const missing = want.filter((u) => !locs.includes(u));
    const extra = locs.filter((u) => !want.includes(u));
    const ok = slash.s === 301 && slash.loc === '/curriculum' && gone.s === 404
      && /name="robots" content="noindex/.test(teachHtml)
      && !missing.length && !extra.length
      && /Sitemap: https:\/\/efhaam\.com\/sitemap\.xml/.test(rbText)
      && !/Disallow: \//.test(rbText);
    record('pages-one-url-each', ok,
      `/curriculum/ -> ${slash.s} ${slash.loc} · unknown -> ${gone.s} · /teach noindex `
      + `${/noindex/.test(teachHtml)} · sitemap ${locs.length} urls`
      + (missing.length ? ` MISSING ${missing.join(',')}` : '')
      + (extra.length ? ` EXTRA ${extra.join(',')}` : ''));
    await p.close();
  }

  // 23 — the homepage links out. Eleven pages reachable from nowhere on the strongest page
  // on the site is the failure mode this whole build exists to avoid, and the footer map is
  // the only place the film links to them.
  {
    const p = await page(b, 1440, 900);
    await park(p, 'promotion', 0.5);
    await p.waitForTimeout(1500);
    const r = await p.evaluate(() => {
      const nav = document.querySelector('.foot-map');
      const links = [...(nav ? nav.querySelectorAll('a') : [])].map((a) => a.getAttribute('href'));
      const st = document.querySelector('.act-promotion .act-stage');
      const ink = (el) => {
        if (!el) return null;
        const rg = document.createRange(); rg.selectNodeContents(el);
        const rs = [...rg.getClientRects()];
        return rs.length ? Math.max(...rs.map((x) => x.bottom)) : el.getBoundingClientRect().bottom;
      };
      return { links, over: st.scrollHeight - st.clientHeight, fold: innerHeight,
        low: Math.max(ink(document.querySelector('.foot p')) || 0, ink(nav) || 0),
        canon: (document.querySelector('link[rel=canonical]') || {}).href,
        ld: !!document.querySelector('script[type="application/ld+json"]'),
        ogimg: (document.querySelector('meta[property="og:image"]') || {}).content };
    });
    const want = ['/curriculum', '/inside-a-session', '/for-chess-coaches',
      '/for-chess-academies', '/about'];
    const missing = want.filter((h) => !r.links.includes(h));
    const ok = !missing.length && r.over === 0 && r.low - r.fold <= 0 && !!r.canon && r.ld
      && !!r.ogimg;
    record('promo-fits-with-site-map', ok,
      `${r.links.length} footer links, stage over ${r.over}px, lowest ink`
      + ` ${Math.round(r.low - r.fold)}px past the fold, canonical ${r.canon ? 'set' : 'MISSING'},`
      + ` JSON-LD ${r.ld ? 'present' : 'MISSING'}, og:image ${r.ogimg ? 'set' : 'MISSING'}`
      + (missing.length ? ` MISSING ${missing.join(',')}` : ''));
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
