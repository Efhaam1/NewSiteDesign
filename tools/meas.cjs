// Measure boxes and computed styles for one or more selectors, at one window, at
// rest or parked in an act. The complement to say.cjs: say.cjs reads the words,
// this reads the geometry. Read-only; it never touches the page.
//
// usage: node tools/meas.cjs <w> <h> [actIndex] [t] <selector> [selector...]
//        node tools/meas.cjs 1244 620 .hero .lead          (at rest, scrollY 0)
//        node tools/meas.cjs 1440 900 5 0.5 .b-paper .c-ink (parked in act 5)
//        ROUTE=/teach node tools/meas.cjs 1244 620 .t-panel
//        REDUCED=1 node tools/meas.cjs 1440 900 '#atmos'
//
// Prints, per matched element (first 8): rect, overflow in x and y
// (scroll - client), and the computed props in PROPS.
const PW = 'C:/Users/MUS/CurriculumWebsite/node_modules/playwright';
const { chromium } = require(PW);

const A = process.argv.slice(2);
const W = Number(A[0] || 1440);
const H = Number(A[1] || 900);
let i = 2;
let act = null;
let t = null;
if (A[2] !== undefined && /^\d+$/.test(A[2]) && A[3] !== undefined && /^[\d.]+$/.test(A[3])) {
  act = Number(A[2]); t = Number(A[3]); i = 4;
}
const SEL = A.slice(i);
const PROPS = (process.env.PROPS || 'font-size,line-height,max-width,width,opacity,display,white-space,-webkit-line-clamp,overflow-y,color,visibility').split(',');
const ROUTE = process.env.ROUTE || '/';

(async () => {
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=gl', '--enable-unsafe-swiftshader'] });
  const opts = { viewport: { width: W, height: H } };
  if (process.env.REDUCED) opts.reducedMotion = 'reduce';
  const p = await b.newPage(opts);
  const errs = [];
  p.on('pageerror', (e) => errs.push('PAGEERROR ' + e.message));
  await p.goto('http://127.0.0.1:4321' + ROUTE, { waitUntil: 'load' });
  await p.waitForTimeout(2400);
  if (act !== null) {
    await p.evaluate(({ act, t }) => {
      const a = window.__w.engine.acts[act];
      // `behavior: instant` on purpose: base.css:9 sets `scroll-behavior: smooth` under
      // no-preference, so a plain scrollTo animates and a flat wait can read a frame that
      // has not finished parking - which mislabelled three rows of a B7 measurement by one
      // 1/120 step of --t before this was found.
      scrollTo({ top: Math.round(a.top + a.len * t), behavior: 'instant' });
    }, { act, t });
    await p.waitForTimeout(900);
  }
  const out = await p.evaluate(({ sels, props }) => {
    const res = [];
    for (const s of sels) {
      const els = [...document.querySelectorAll(s)];
      if (!els.length) { res.push({ sel: s, n: 0 }); continue; }
      els.slice(0, 8).forEach((e, k) => {
        const r = e.getBoundingClientRect();
        const cs = getComputedStyle(e);
        const row = {
          sel: s + (els.length > 1 ? `[${k}]` : ''),
          n: els.length,
          w: Math.round(r.width * 100) / 100,
          h: Math.round(r.height * 100) / 100,
          top: Math.round(r.top * 100) / 100,
          bottom: Math.round(r.bottom * 100) / 100,
          overX: e.scrollWidth - e.clientWidth,
          overY: e.scrollHeight - e.clientHeight,
          lines: null,
          text: (e.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 60),
        };
        // how many line boxes the text actually paints, which is what a clamp cuts
        const rg = document.createRange(); rg.selectNodeContents(e);
        const rects = [...rg.getClientRects()];
        if (rects.length) {
          const tops = [...new Set(rects.map((x) => Math.round(x.top)))];
          row.lines = tops.length;
          row.inkBottom = Math.round(Math.max(...rects.map((x) => x.bottom)));
        }
        for (const pr of props) row[pr] = cs.getPropertyValue(pr);
        if (e.tagName === 'VIDEO') { row.paused = e.paused; row.currentTime = e.currentTime; }
        res.push(row);
      });
    }
    return { res, innerHeight, innerWidth, scrollY };
  }, { sels: SEL, props: PROPS });
  console.log(`\n${W}x${H}${act !== null ? ` act ${act} t=${t}` : ' at rest'} route=${ROUTE}  (scrollY ${out.scrollY}, fold ${out.innerHeight})`);
  for (const r of out.res) {
    if (r.n === 0) { console.log(`  ${r.sel}  NOT FOUND`); continue; }
    const geo = `${r.w}x${r.h} top ${r.top} bottom ${r.bottom} overX ${r.overX} overY ${r.overY} lines ${r.lines}`;
    const cs = PROPS.map((pr) => `${pr}: ${r[pr]}`).join('; ');
    console.log(`  ${r.sel}  ${geo}`);
    console.log(`      ${cs}`);
    if (r.paused !== undefined) console.log(`      paused: ${r.paused}  currentTime: ${r.currentTime}`);
    console.log(`      "${r.text}"`);
  }
  if (errs.length) console.log('  ERRORS: ' + [...new Set(errs)].slice(0, 4).join(' | '));
  await b.close();
})().catch((e) => { console.error('FAILED', e.message); process.exit(1); });
