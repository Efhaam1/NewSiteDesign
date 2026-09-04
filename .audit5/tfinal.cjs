const PW = 'C:/Users/MUS/CurriculumWebsite/node_modules/playwright';
const { chromium } = require(PW);
(async () => {
  const b = await chromium.launch({ args: ['--use-gl=angle','--use-angle=gl','--enable-unsafe-swiftshader'] });
  const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
  await p.goto('http://127.0.0.1:4321/', { waitUntil: 'load' });
  await p.waitForTimeout(2600);
  const ks = [0, 60, 68, 69, 70, 71, 72, 73, 74, 75, 78, 82, 83, 84, 85, 86];
  console.log('  --t      sw-p  sw-s | col1  plate brand fix1  fix2  fix3  open  foot  cvfix');
  for (const k of ks) {
    await p.evaluate(({ t }) => { const a = window.__w.engine.acts[1];
      scrollTo({ top: Math.round(a.top + a.len * t), behavior: 'instant' }); }, { t: k / 120 });
    await p.waitForTimeout(1500);
    const r = await p.evaluate(() => {
      const o = (s, ps) => { const e = document.querySelector(s); return e ? Number(getComputedStyle(e, ps || null).opacity).toFixed(3) : 'x'; };
      const fx = [...document.querySelectorAll('.cv-fx')].map((e) => Number(getComputedStyle(e).opacity).toFixed(3));
      return [document.querySelector('.act-chaos').style.getPropertyValue('--t'),
        o('.sw-p'), o('.sw-s'), o('.cv-col'), o('.cv-one', '::before'), o('.cv-brand'),
        ...fx, o('.cv-open'), o('.cv-ft'), o('.cv-fix')].join(' ');
    });
    console.log('  ' + r);
  }
  await b.close();
})();
