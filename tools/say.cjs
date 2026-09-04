// Read text out of one act at one scroll position. For asserting that what is on
// screen is what the data says, rather than squinting at a jpeg.
// usage: node tools/say.cjs <act> <w> <h> <t> <selector> [selector...]
const PW = 'C:/Users/MUS/CurriculumWebsite/node_modules/playwright';
const { chromium } = require(PW);
const ACT = process.argv[2] || 'session';
const W = Number(process.argv[3] || 1440), H = Number(process.argv[4] || 900);
const T = Number(process.argv[5] || 0.75);
const SEL = process.argv.slice(6);
(async () => {
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=gl', '--enable-unsafe-swiftshader'] });
  const p = await b.newPage({ viewport: { width: W, height: H } });
  const errs = [];
  p.on('pageerror', (e) => errs.push('PAGEERROR ' + e.message));
  p.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); });
  await p.goto('http://127.0.0.1:4321/', { waitUntil: 'load' });
  await p.waitForTimeout(2600);
  await p.evaluate(([act, frac]) => {
    const a = document.querySelector(`[data-act="${act}"]`);
    const top = a.getBoundingClientRect().top + scrollY;
    const len = Math.max(1, a.offsetHeight - innerHeight);
    window.scrollTo(0, Math.round(top + len * frac));
  }, [ACT, T]);
  await p.waitForTimeout(1500);
  const out = await p.evaluate((sels) => {
    const r = {};
    for (const s of sels) {
      const els = [...document.querySelectorAll(s)];
      r[s] = els.slice(0, 6).map((e) => ({
        text: (e.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 220),
        label: e.getAttribute('aria-label') || undefined,
        hidden: e.hidden || undefined,
      }));
    }
    return r;
  }, SEL);
  console.log(JSON.stringify(out, null, 1));
  if (errs.length) console.log('ERRORS: ' + [...new Set(errs)].slice(0, 5).join(' | '));
  await b.close();
})().catch((e) => { console.error('FAILED', e.message); process.exit(1); });
