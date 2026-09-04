// What does the terms act actually measure on screen? Boxes, not guesses.
// usage: node tools/box.cjs <w> <h> <scrollFraction> [selectors...]
const PW = 'C:/Users/MUS/CurriculumWebsite/node_modules/playwright';
const { chromium } = require(PW);
const W = Number(process.argv[2] || 1440), H = Number(process.argv[3] || 900);
const F = Number(process.argv[4] || 0.83);
const SEL = process.argv.slice(5);
const DEF = ['.pad.terms', '.terms-head', '.rate', '.rate-table', '.rate-cap',
  '.rate-table thead', '.rate-table tbody', '.rate-foot', '.rate-cta', '.rate-strip'];
(async () => {
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=gl', '--enable-unsafe-swiftshader'] });
  const p = await b.newPage({ viewport: { width: W, height: H } });
  const errs = [];
  p.on('pageerror', (e) => errs.push('PAGEERROR ' + e.message));
  p.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); });
  await p.goto('http://127.0.0.1:4321/', { waitUntil: 'load' });
  await p.waitForTimeout(2400);
  await p.evaluate((f) => {
    const max = document.documentElement.scrollHeight - innerHeight;
    window.scrollTo(0, Math.round(max * f));
  }, F);
  await p.waitForTimeout(1600);
  const out = await p.evaluate((sels) => {
    const act = document.querySelector('[data-act="terms"]');
    const cs = act ? getComputedStyle(act) : null;
    const r = { viewport: [innerWidth, innerHeight],
      drivers: cs ? { t: cs.getPropertyValue('--t').trim(), e: cs.getPropertyValue('--e').trim(),
        h: cs.getPropertyValue('--h').trim(), live: act.classList.contains('is-live') } : null,
      boxes: {} };
    for (const s of sels) {
      const el = document.querySelector(s);
      if (!el) { r.boxes[s] = 'MISSING'; continue; }
      const b = el.getBoundingClientRect();
      r.boxes[s] = { top: Math.round(b.top), bottom: Math.round(b.bottom),
        h: Math.round(b.height), w: Math.round(b.width),
        offBottom: Math.round(b.bottom) > innerHeight,
        opacity: Number(getComputedStyle(el).opacity).toFixed(2) };
    }
    return r;
  }, SEL.length ? SEL : DEF);
  console.log(JSON.stringify(out, null, 1));
  if (errs.length) console.log('ERRORS:', [...new Set(errs)].slice(0, 5).join(' | '));
  await b.close();
})().catch((e) => { console.error('FAILED', e.message); process.exit(1); });
