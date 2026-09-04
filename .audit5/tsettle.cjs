const PW = 'C:/Users/MUS/CurriculumWebsite/node_modules/playwright';
const { chromium } = require(PW);
(async () => {
  const b = await chromium.launch({ args: ['--use-gl=angle','--use-angle=gl','--enable-unsafe-swiftshader'] });
  const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
  await p.goto('http://127.0.0.1:4321/', { waitUntil: 'load' });
  await p.waitForTimeout(2600);
  const rd = () => p.evaluate(() => {
    const sec = document.querySelector('.act-chaos'); const a = window.__w.engine.acts[1];
    return { t: sec.style.getPropertyValue('--t'), at: a.t, raw: window.__w.engine.raw, pp: window.__w.engine.p,
      qt: Math.round(a.t * 120) / 120,
      p: getComputedStyle(document.querySelector('.sw-p')).opacity,
      s: getComputedStyle(document.querySelector('.sw-s')).opacity };
  });
  // land on the frame that carries the floor, from below and from above
  for (const from of [0.40, 0.72]) {
    await p.evaluate(({ t }) => { const a = window.__w.engine.acts[1];
      scrollTo({ top: Math.round(a.top + a.len * t), behavior: 'instant' }); }, { t: from });
    await p.waitForTimeout(2200);
    await p.evaluate(() => { const a = window.__w.engine.acts[1];
      scrollTo({ top: Math.round(a.top + a.len * 0.5583333), behavior: 'instant' }); });
    for (const ms of [200, 400, 700, 1000, 1400, 2000, 3000]) {
      await p.waitForTimeout(ms === 200 ? 200 : 0);
      if (ms > 200) await p.waitForTimeout(0);
      const r = await rd();
      console.log(`from ${from} @~${ms}ms  --t="${r.t}"  a.t=${r.at.toFixed(6)} qt=${r.qt.toFixed(6)}  sw-p=${r.p} sw-s=${r.s}  max=${Math.max(+r.p, +r.s).toFixed(4)}`);
      await p.waitForTimeout(ms);
    }
  }
  // and the whole reachable set of --t values across the transition window, fully settled
  console.log('--- fully settled (2500ms) on every scroll pixel across 0.550..0.570 ---');
  const len = await p.evaluate(() => window.__w.engine.acts[1].len);
  for (let k = 66; k <= 69; k++) {
    const t = k / 120;
    await p.evaluate(({ t }) => { const a = window.__w.engine.acts[1];
      scrollTo({ top: Math.round(a.top + a.len * t), behavior: 'instant' }); }, { t });
    await p.waitForTimeout(2500);
    const r = await rd();
    console.log(`  k=${k} t=${t.toFixed(6)}  --t="${r.t}"  sw-p=${r.p} sw-s=${r.s}  max=${Math.max(+r.p, +r.s).toFixed(4)}`);
  }
  await b.close();
})();
