// Read the browser's own parse of one stylesheet, and the computed value of the
// declarations a banded fix depends on. Written for P1b, whose first attempt shipped
// three declarations that never fired and whose second shipped a comment terminator
// that made the parser swallow a whole @media rule. A declaration you cannot see in
// the CSSOM is not in the cascade, and a rule you can see may still lose the tie.
//
// usage: node .audit5/cssom.cjs <w> <h> [file-substring] [act t sel:prop ...]
//        node .audit5/cssom.cjs 1600 860 annot.css
//        node .audit5/cssom.cjs 1600 860 annot.css 4 0.8 .pane-plan .routine:display
//
// Prints every @media rule in the matching sheet with its condition, whether it
// matches at this viewport, and its selectors; then, if a selector:prop pair is
// given, the computed value at that window (parked in the act when act/t are given).
const PW = 'C:/Users/MUS/CurriculumWebsite/node_modules/playwright';
const { chromium } = require(PW);
const A = process.argv.slice(2);
const W = Number(A[0] || 1440);
const H = Number(A[1] || 900);
const FILE = A[2] || 'annot.css';
let i = 3;
let act = null;
let t = null;
if (A[3] !== undefined && /^\d+$/.test(A[3]) && A[4] !== undefined && /^[\d.]+$/.test(A[4])) {
  act = Number(A[3]); t = Number(A[4]); i = 5;
}
const PAIRS = A.slice(i);

(async () => {
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=gl', '--enable-unsafe-swiftshader'] });
  const p = await b.newPage({ viewport: { width: W, height: H } });
  await p.goto('http://127.0.0.1:4321/', { waitUntil: 'load' });
  await p.waitForTimeout(2300);
  if (act !== null) {
    await p.evaluate(({ act, t }) => {
      const a = window.__w.engine.acts[act];
      scrollTo({ top: Math.round(a.top + a.len * t), behavior: 'instant' });
    }, { act, t });
    await p.waitForTimeout(800);
  }
  const out = await p.evaluate(({ file, pairs }) => {
    const sheets = [...document.styleSheets].filter((s) => (s.href || '').includes(file));
    const rules = [];
    for (const s of sheets) {
      let n = 0;
      for (const r of s.cssRules) {
        n++;
        if (r.constructor.name === 'CSSMediaRule') {
          rules.push({
            cond: r.conditionText,
            matches: matchMedia(r.conditionText).matches,
            sels: [...r.cssRules].map((x) => (x.selectorText || x.cssText || '').slice(0, 90)),
            decls: [...r.cssRules].map((x) => (x.style ? x.style.cssText : '').slice(0, 160)),
          });
        }
      }
      rules.push({ total: n, href: s.href });
    }
    const computed = [];
    for (const pr of pairs) {
      const ix = pr.lastIndexOf(':');
      const sel = pr.slice(0, ix);
      const prop = pr.slice(ix + 1);
      const els = [...document.querySelectorAll(sel)];
      if (!els.length) { computed.push({ pr, v: 'NO MATCH' }); continue; }
      els.slice(0, 4).forEach((e, k) => {
        const cs = getComputedStyle(e);
        const r = e.getBoundingClientRect();
        computed.push({
          pr: sel + (els.length > 1 ? '[' + k + ']' : '') + ':' + prop,
          v: cs.getPropertyValue(prop),
          box: Math.round(r.width) + 'x' + Math.round(r.height),
          over: (e.scrollHeight - e.clientHeight) + 'y ' + (e.scrollWidth - e.clientWidth) + 'x',
        });
      });
    }
    return { rules, computed, iw: innerWidth, ih: innerHeight };
  }, { file: FILE, pairs: PAIRS });
  console.log(`\n${W}x${H} (inner ${out.iw}x${out.ih})${act !== null ? ` act ${act} t=${t}` : ''}  sheet ~ ${FILE}`);
  for (const r of out.rules) {
    if (r.total !== undefined) { console.log(`  TOTAL top-level rules: ${r.total}  (${r.href})`); continue; }
    console.log(`  ${r.matches ? 'MATCH' : '     '}  @media ${r.cond}`);
    r.sels.forEach((s, k) => console.log(`           ${s}  {${r.decls[k]}}`));
  }
  for (const c of out.computed) {
    console.log(`  ${c.pr} = ${c.v}${c.box ? '   box ' + c.box + '  over ' + c.over : ''}`);
  }
  await b.close();
})().catch((e) => { console.error('FAILED', e.message); process.exit(1); });
