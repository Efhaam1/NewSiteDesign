// The act-1 reveal contract, read off the rendered page: every band that matters, swept.
const PW = 'C:/Users/MUS/CurriculumWebsite/node_modules/playwright';
const { chromium } = require(PW);
const T = [];
// 1/120 steps: that is the quantisation --t actually moves in, so this is frame-exact
const A = Number(process.env.FROM || 0.40), B = Number(process.env.TO || 0.74);
for (let t = A; t <= B + 1e-9; t += 1/120) T.push(Math.round(t * 10000) / 10000);
(async () => {
  const b = await chromium.launch({ args: ['--use-gl=angle','--use-angle=gl','--enable-unsafe-swiftshader'] });
  const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
  await p.goto('http://127.0.0.1:4321/', { waitUntil: 'load' });
  await p.waitForTimeout(2500);
  console.log('t      hd:prob soln | ld:a  b   | card plate hair brand fix1 fix2 fix3 open foot');
  for (const t of T) {
    await p.evaluate(({ t }) => { const a = window.__w.engine.acts[1];
      scrollTo({ top: Math.round(a.top + a.len * t), behavior: 'instant' }); }, { t });
    await p.waitForTimeout(420);
    const r = await p.evaluate(() => {
      const o = (s, pseudo) => { const e = document.querySelector(s); if (!e) return 'x';
        return Number(getComputedStyle(e, pseudo || null).opacity).toFixed(2); };
      const fx = [...document.querySelectorAll('.cv-fx')].map((e) => Number(getComputedStyle(e).opacity).toFixed(2));
      return [o('.head-swap .sw-p'), o('.head-swap .sw-s'),
        o('.lead-swap .sw-a'), o('.lead-swap .sw-b'), o('.cv-col'),
        o('.cv-one', '::before'), o('.cv-fix'), o('.cv-brand'), ...fx,
        o('.cv-open'), o('.cv-ft')].join(' ');
    });
    console.log(String(t).padEnd(6) + r);
  }
  await b.close();
})();
