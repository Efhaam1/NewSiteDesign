// P8 — the hero's residual band, heights 821-900 at wide aspect.
//
// Measures EXACTLY what gate.cjs assertion 1 measures: `.act-threshold .act-stage`
// overflow at rest, plus the lowest ink of `.hero-rule` and `.ticker` against the
// fold. PASS is `over === 0 && below <= 0`, the gate's own condition.
//
// Up to two states in the SAME page load — as shipped, and with candidate CSS
// injected as a <style> at the end of <head> (which wins same-specificity ties
// against every linked sheet) — so before and after are both real measurements of
// the same build rather than one run against a memory. inj.cjs's technique.
//
// usage: node .audit5/hero.cjs <widths> <heights>
//        node .audit5/hero.cjs 1600,1920 830,860
//   env: INJECT=path.css        candidate column
//        ONLY=shipped|candidate measure one column only
//        ROWS=1                 also print the hero's height budget, row by row
//        TSV=1                  one tab-separated row per window per state
const PW = 'C:/Users/MUS/CurriculumWebsite/node_modules/playwright';
const { chromium } = require(PW);
const fs = require('fs');
const WIDTHS = (process.argv[2] || '1920').split(',').map(Number);
const HEIGHTS = (process.argv[3] || '830').split(',').map(Number);
const INJECT = process.env.INJECT ? fs.readFileSync(process.env.INJECT, 'utf8') : '';
const ONLY = process.env.ONLY || '';
const ROWS = !!process.env.ROWS;
const TSV = !!process.env.TSV;
const STATES = ['shipped', INJECT ? 'candidate' : null]
  .filter(Boolean).filter((s) => !ONLY || s === ONLY);

const MEASURE = ({ state, inject, rows }) => {
  let el = null;
  if (state === 'candidate' && inject) {
    el = document.createElement('style'); el.id = '__cand'; el.textContent = inject;
    document.head.appendChild(el);
  }
  document.body.getBoundingClientRect();
  const ink = (sel) => {
    const e = document.querySelector(sel);
    if (!e || getComputedStyle(e).display === 'none') return null;
    const rg = document.createRange(); rg.selectNodeContents(e);
    const rs = [...rg.getClientRects()];
    return rs.length ? Math.max(...rs.map((x) => x.bottom)) : e.getBoundingClientRect().bottom;
  };
  const lines = (sel) => {
    const e = document.querySelector(sel);
    if (!e) return null;
    const rg = document.createRange(); rg.selectNodeContents(e);
    return [...rg.getClientRects()].filter((r) => r.height > 1).length;
  };
  const st = document.querySelector('.act-threshold .act-stage');
  const over = st.scrollHeight - st.clientHeight;
  const r = ink('.hero-rule'), t = ink('.ticker');
  const below = Math.max(r === null ? -1e4 : r - innerHeight, t === null ? -1e4 : t - innerHeight);
  const out = { over, below: Math.round(below * 100) / 100, pass: over === 0 && below <= 0 };
  if (rows) {
    const box = (sel) => {
      const e = document.querySelector(sel);
      if (!e) return null;
      const cs = getComputedStyle(e);
      return { h: Math.round(e.getBoundingClientRect().height * 100) / 100,
        fs: Math.round(parseFloat(cs.fontSize) * 100) / 100,
        mt: Math.round(parseFloat(cs.marginTop) * 100) / 100,
        mb: Math.round(parseFloat(cs.marginBottom) * 100) / 100,
        w: Math.round(e.getBoundingClientRect().width * 100) / 100 };
    };
    const pad = getComputedStyle(document.querySelector('.pad.hero'));
    out.rows = {
      padT: Math.round(parseFloat(pad.paddingTop) * 100) / 100,
      padB: Math.round(parseFloat(pad.paddingBottom) * 100) / 100,
      kicker: box('.hero .kicker'), d1: box('.hero .d1'),
      base: box('.hero-base'), foot: box('.hero-foot'),
      lead: box('.hero .lead'), leadLines: lines('.hero .lead'),
      cta: box('.hero .cta-row'), ticker: box('.hero .ticker'),
      tickerB: box('.hero .ticker b'), rule: box('.hero-rule'),
      stage: box('.act-threshold .act-stage'), padBox: box('.pad.hero'),
      content: Math.round(document.querySelector('.act-threshold .act-stage').scrollHeight * 100) / 100,
    };
  }
  if (el) el.remove();
  return out;
};

(async () => {
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=gl', '--enable-unsafe-swiftshader'] });
  for (const w of WIDTHS) {
    for (const h of HEIGHTS) {
      const p = await b.newPage({ viewport: { width: w, height: h } });
      await p.goto('http://127.0.0.1:4321/', { waitUntil: 'load' });
      await p.waitForTimeout(2400);
      const cells = [];
      for (const state of STATES) {
        const r = await p.evaluate(MEASURE, { state, inject: INJECT, rows: ROWS });
        if (TSV) {
          console.log([w, h, state, r.over, r.below, r.pass ? 'PASS' : 'FAIL'].join('\t'));
        } else {
          cells.push(`${state}: over ${r.over}px, ink ${r.below}px ${r.pass ? 'PASS' : 'FAIL'}`);
        }
        if (ROWS) console.log(`      ${w}x${h} ${state} rows ${JSON.stringify(r.rows)}`);
      }
      if (!TSV) console.log(`${w}x${h}  ${cells.join('   |   ')}`);
      await p.close();
    }
  }
  await b.close();
})().catch((e) => { console.error('FAILED', e.message); process.exit(1); });
