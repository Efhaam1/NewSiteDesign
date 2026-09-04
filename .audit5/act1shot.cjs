// One-off: act 1 at several fractions, at several windows, to look at the redraw.
// usage: node .audit5/act1shot.cjs [w] [h] [tag]
const PW = 'C:/Users/MUS/CurriculumWebsite/node_modules/playwright';
const { chromium } = require(PW);
const W = Number(process.argv[2] || 1440);
const H = Number(process.argv[3] || 900);
const TAG = process.argv[4] || 'a1';
const FRACS = (process.env.FRACS || '0.20,0.30,0.42,0.50,0.62').split(',').map(Number);
(async () => {
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=gl', '--enable-unsafe-swiftshader'] });
  const p = await b.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 2 });
  const errs = [];
  p.on('pageerror', (e) => errs.push('PAGEERROR ' + e.message));
  p.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); });
  await p.goto('http://127.0.0.1:4321/', { waitUntil: 'load' });
  await p.waitForTimeout(2600);
  for (const f of FRACS) {
    await p.evaluate(({ f }) => {
      const a = window.__w.engine.acts[1];
      scrollTo({ top: Math.round(a.top + a.len * f), behavior: 'instant' });
    }, { f });
    await p.waitForTimeout(1500);
    const name = `shots/${TAG}-${W}x${H}-${String(Math.round(f * 100)).padStart(3, '0')}.png`;
    await p.screenshot({ path: name });
    console.log('wrote', name);
  }
  if (errs.length) console.log('ERRORS:\n' + errs.join('\n'));
  else console.log('no console errors');
  await b.close();
})();
