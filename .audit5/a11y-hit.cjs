// Hit target + geometry check for the .cta candidates. Read-only.
// For each variant: every .cta's border-box size (SC 2.5.8 minimum 24x24 CSS px),
// and an elementFromPoint probe at 9 points inside the box, so a pseudo-element that
// forgot pointer-events:none would show up as the hit target instead of the anchor.
// usage: node .audit5/a11y-hit.cjs <w> <h> [act] [t]
const PW = 'C:/Users/MUS/CurriculumWebsite/node_modules/playwright';
const { chromium } = require(PW);
const fs = require('fs');
const A = process.argv.slice(2);
const W = Number(A[0] || 1440), H = Number(A[1] || 900);
const act = A[2] === undefined ? null : Number(A[2]);
const t = A[3] === undefined ? null : Number(A[3]);
const CANDS = (process.env.CANDS || 'shipped,.audit5/fb-btn-1.css,.audit5/fb-btn-3.css').split(',');

(async () => {
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=gl', '--enable-unsafe-swiftshader'] });
  const p = await b.newPage({ viewport: { width: W, height: H } });
  await p.goto('http://127.0.0.1:4321/', { waitUntil: 'load' });
  await p.waitForTimeout(2500);
  if (act !== null) {
    await p.evaluate(({ act, t }) => { const a = window.__w.engine.acts[act];
      scrollTo({ top: Math.round(a.top + a.len * t), behavior: 'instant' }); }, { act, t });
    await p.waitForTimeout(1100);
  }
  console.log(`\n=== HIT TARGETS ${W}x${H} ${act === null ? 'at rest' : `act ${act} t=${t}`}`);
  for (const cand of CANDS) {
    await p.evaluate(() => { const s = document.getElementById('cand-css'); if (s) s.remove(); });
    if (cand !== 'shipped') await p.evaluate((c) => { const s = document.createElement('style');
      s.id = 'cand-css'; s.textContent = c; document.head.appendChild(s); }, fs.readFileSync(cand, 'utf8'));
    await p.waitForTimeout(650);
    const rows = await p.evaluate(() => [...document.querySelectorAll('.cta')].map((e, i) => {
      const r = e.getBoundingClientRect(), cs = getComputedStyle(e);
      const label = `${i}:${e.className.replace(/\s+/g, '.')}`;
      if (r.width < 1 || cs.visibility === 'hidden' || cs.display === 'none') return { label, off: true, w: r.width, h: r.height };
      const hits = [];
      for (const fy of [0.06, 0.5, 0.94]) for (const fx of [0.03, 0.5, 0.97]) {
        const x = r.left + r.width * fx, y = r.top + r.height * fy;
        if (x < 0 || y < 0 || x > innerWidth || y > innerHeight) { hits.push('oob'); continue; }
        const el = document.elementFromPoint(Math.round(x), Math.round(y));
        hits.push(el === e ? 'self' : (el && el.closest && el.closest('.cta') === e ? 'child' : (el ? el.tagName.toLowerCase() + '.' + String(el.className || '').split(' ')[0] : 'null')));
      }
      return { label, w: r.width, h: r.height, pad: cs.padding, fs: cs.fontSize,
        hits, ok24: r.width >= 24 && r.height >= 24, notSelf: hits.filter((x) => x !== 'self' && x !== 'oob').length };
    }));
    console.log(`--- ${cand === 'shipped' ? 'SHIPPED' : cand} ---`);
    for (const r of rows) {
      if (r.off) { console.log(`  ${r.label.padEnd(22)} not rendered (${r.w}x${r.h})`); continue; }
      console.log(`  ${r.label.padEnd(22)} ${r.w.toFixed(2)}x${r.h.toFixed(2)}  pad ${r.pad}  fs ${r.fs}`
        + `  SC2.5.8(24x24) ${r.ok24 ? 'PASS' : 'FAIL'}  hits ${r.hits.join(',')}`
        + (r.notSelf ? `   <-- ${r.notSelf} probe point(s) NOT the anchor` : ''));
    }
  }
  await b.close();
})().catch((e) => { console.error('FAILED', e.message); process.exit(1); });
