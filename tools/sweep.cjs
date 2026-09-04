// Sweep one act's boxes across a width x height grid and report only what clips.
// Written for the pass-2 banded items: the page's short-window tiers are keyed on both
// axes, so every fix has edges of its own and every edge needs both sides measured. The
// bento version of this (tools/bento.cjs) found three pockets that a five-width sample
// missed; this is the same thing for any act and any selector list.
//
// usage: node tools/sweep.cjs <act> <widths> <heights> <selector> [selector...]
//        node tools/sweep.cjs 4 1920,1600,1440,1101,901 860,900,940 '.pane-plan' '.pane-ctl'
//        node tools/sweep.cjs 6 901,950,1244 821,860,900 '.act-terms .act-stage'
//        FRAC=0.25 node tools/sweep.cjs 4 1440 860 '.pane-plan'
//
// Prints one line per window, and only the selectors whose own box overflows by more than
// TOL (default 2px, the threshold the gate's own cell assertion uses). A window with
// nothing over TOL prints `clean`, so `| grep -v clean` gives you the defect surface.
const PW = 'C:/Users/MUS/CurriculumWebsite/node_modules/playwright';
const { chromium } = require(PW);
const ACT = Number(process.argv[2]);
const WIDTHS = (process.argv[3] || '1920').split(',').map(Number);
const HEIGHTS = (process.argv[4] || '900').split(',').map(Number);
const SEL = process.argv.slice(5);
const FRAC = Number(process.env.FRAC || 0.5);
const TOL = Number(process.env.TOL || 2);

(async () => {
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=gl', '--enable-unsafe-swiftshader'] });
  for (const w of WIDTHS) {
    for (const h of HEIGHTS) {
      const p = await b.newPage({ viewport: { width: w, height: h } });
      await p.goto('http://127.0.0.1:4321/', { waitUntil: 'load' });
      await p.waitForTimeout(2300);
      await p.evaluate(({ act, frac }) => {
        const a = window.__w.engine.acts[act];
        scrollTo({ top: Math.round(a.top + a.len * frac), behavior: 'instant' });
      }, { act: ACT, frac: FRAC });
      await p.waitForTimeout(700);
      const rows = await p.evaluate(({ sels, tol }) => {
        const out = [];
        for (const s of sels) {
          for (const e of document.querySelectorAll(s)) {
            const cs = getComputedStyle(e);
            const oy = e.scrollHeight - e.clientHeight;
            const ox = e.scrollWidth - e.clientWidth;
            if (oy > tol || ox > tol) {
              out.push({ s, oy, ox, clips: cs.overflowY === 'hidden' || cs.overflowY === 'clip'
                || cs.overflow === 'hidden' || cs.overflow === 'clip',
                box: Math.round(e.getBoundingClientRect().height) });
            }
          }
        }
        return out;
      }, { sels: SEL, tol: TOL });
      const bad = rows.map((r) => `${r.s}${r.oy > TOL ? ' +' + r.oy + 'y' : ''}${r.ox > TOL ? ' +' + r.ox + 'x' : ''}`
        + (r.clips ? '' : '(visible)')).join(', ');
      console.log(`${w}x${h}  ${bad || 'clean'}`);
      await p.close();
    }
  }
  await b.close();
})().catch((e) => { console.error('FAILED', e.message); process.exit(1); });
