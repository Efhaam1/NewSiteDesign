// Generic A/B: the same selectors measured twice in ONE page load — as shipped, and with a
// candidate stylesheet injected at the end of <head>. Injecting the OLD value is how you get an
// honest "before" out of a tree that has already been edited, which matters here because there is
// no git repo to diff against.
//
// usage: INJECT=path.css node .audit5/ab.cjs <w> <h> [act t] <selector>...
//   env: PROPS=align-content,font-size   computed properties to print
//        ROUTE=/teach  REDUCED=1
const PW = 'C:/Users/MUS/CurriculumWebsite/node_modules/playwright';
const { chromium } = require(PW);
const fs = require('fs');
const A = process.argv.slice(2);
const W = Number(A[0]); const H = Number(A[1]);
let i = 2, act = null, t = null;
if (/^\d+$/.test(A[2] || '') && /^[\d.]+$/.test(A[3] || '')) { act = Number(A[2]); t = Number(A[3]); i = 4; }
const SEL = A.slice(i);
const INJECT = process.env.INJECT ? fs.readFileSync(process.env.INJECT, 'utf8') : '';
const PROPS = (process.env.PROPS || '').split(',').filter(Boolean);

const READ = ({ sels, props, state, inject }) => {
  let el = null;
  if (state === 'candidate' && inject) {
    el = document.createElement('style'); el.textContent = inject; document.head.appendChild(el);
  }
  document.body.getBoundingClientRect();
  const out = [];
  for (const s of sels) {
    [...document.querySelectorAll(s)].slice(0, 8).forEach((e, n) => {
      const r = e.getBoundingClientRect(); const cs = getComputedStyle(e);
      out.push(`${s}[${n}] ${Math.round(r.width * 100) / 100}x${Math.round(r.height * 100) / 100}` +
        ` top ${Math.round(r.top * 100) / 100} bottom ${Math.round(r.bottom * 100) / 100}` +
        ` right ${Math.round(r.right * 100) / 100} over ${e.scrollHeight - e.clientHeight}y ${e.scrollWidth - e.clientWidth}x` +
        (props.length ? '  ' + props.map((p) => `${p}=${cs.getPropertyValue(p)}`).join(' ') : ''));
    });
  }
  if (el) el.remove();
  return out;
};

(async () => {
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=gl', '--enable-unsafe-swiftshader'] });
  const p = await b.newPage({ viewport: { width: W, height: H },
    reducedMotion: process.env.REDUCED ? 'reduce' : 'no-preference' });
  await p.goto('http://127.0.0.1:4321' + (process.env.ROUTE || '/'), { waitUntil: 'load' });
  await p.waitForTimeout(2400);
  if (process.env.CLICK) {
    // click a control before measuring — e.g. act 6's annual toggle, whose second .rate-bill-b
    // is the one that sets .is-annual (rate.js:57-72)
    // CLICK=sel or CLICK=sel@n to pick the nth match (act 6's annual toggle is @1)
    const did = await p.evaluate((spec) => {
      const at = spec.lastIndexOf('@');
      const sel = at > 0 ? spec.slice(0, at) : spec;
      const n = at > 0 ? Number(spec.slice(at + 1)) : null;
      const all = [...document.querySelectorAll(sel)].filter((x) => x.getBoundingClientRect().height > 2);
      const e = n === null ? all[0] : all[n];
      if (!e) return 'not found';
      e.click(); return 'clicked "' + e.textContent.trim() + '"';
    }, process.env.CLICK);
    console.log(`  CLICK ${process.env.CLICK}: ${did}`);
    await p.waitForTimeout(400);
  }
  if (act !== null) {
    await p.evaluate(({ a, f }) => { const x = window.__w.engine.acts[a];
      scrollTo({ top: Math.round(x.top + x.len * f), behavior: 'instant' }); }, { a: act, f: t });
    await p.waitForTimeout(700);
  }
  const cols = {};
  for (const state of ['shipped', INJECT ? 'candidate' : null].filter(Boolean)) {
    cols[state] = await p.evaluate(READ, { sels: SEL, props: PROPS, state, inject: INJECT });
  }
  const n = cols.shipped.length;
  for (let k = 0; k < n; k++) {
    const a2 = cols.shipped[k]; const b2 = cols.candidate ? cols.candidate[k] : null;
    if (!b2) { console.log(`  ${a2}`); continue; }
    console.log(`  ${a2}\n  ${b2}${a2 === b2 ? '   <-- IDENTICAL' : ''}`);
  }
  await b.close();
})().catch((e) => { console.error('FAILED', e.message); process.exit(1); });
