// A filmstrip of one act: scrolls it from t=0 to t=1 in N steps and shoots every
// step, so a shot can be watched frame by frame instead of guessed at.
// usage: node tools/film.cjs <act> <w> <h> [steps]
const PW = 'C:/Users/MUS/CurriculumWebsite/node_modules/playwright';
const { chromium } = require(PW);
const path = require('path'), fs = require('fs');
const ACT = process.argv[2] || 'chaos';
const W = Number(process.argv[3] || 1440), H = Number(process.argv[4] || 900);
const N = Number(process.argv[5] || 10);
const OUT = path.join(__dirname, '..', 'shots');
fs.mkdirSync(OUT, { recursive: true });

(async () => {
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=gl', '--enable-unsafe-swiftshader'] });
  const p = await b.newPage({ viewport: { width: W, height: H } });
  const errs = [];
  p.on('pageerror', (e) => errs.push('PAGEERROR ' + e.message));
  p.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); });
  await p.goto('http://127.0.0.1:4321/', { waitUntil: 'load' });
  await p.waitForTimeout(2600);

  const names = [];
  for (let i = 0; i <= N; i++) {
    const t = i / N;
    const info = await p.evaluate(([act, frac]) => {
      const a = document.querySelector(`[data-act="${act}"]`);
      const top = a.getBoundingClientRect().top + scrollY;
      const len = Math.max(1, a.offsetHeight - innerHeight);
      window.scrollTo(0, Math.round(top + len * frac));
      return { top, len };
    }, [ACT, t]);
    await p.waitForTimeout(1400);
    const st = await p.evaluate((act) => {
      const a = document.querySelector(`[data-act="${act}"]`);
      const cs = getComputedStyle(a);
      return { t: cs.getPropertyValue('--t').trim(), e: cs.getPropertyValue('--e').trim(),
        h: cs.getPropertyValue('--h').trim(), live: a.classList.contains('is-live') };
    }, ACT);
    const name = `${ACT}-${String(Math.round(t * 100)).padStart(3, '0')}.jpg`;
    await p.screenshot({ path: path.join(OUT, name), quality: 80, type: 'jpeg' });
    names.push(name);
    console.log(`t=${t.toFixed(2)} --t=${st.t} --e=${st.e} --h=${st.h} live=${st.live} -> ${name}`);
  }
  console.log(errs.length ? 'ERRORS: ' + [...new Set(errs)].slice(0, 8).join(' | ') : 'no console errors');
  await b.close();
})().catch((e) => { console.error('FAILED', e.message); process.exit(1); });
