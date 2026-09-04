const PW='C:/Users/MUS/CurriculumWebsite/node_modules/playwright';
const { chromium } = require(PW);
(async () => {
  const b = await chromium.launch({ args: ['--ignore-gpu-blocklist'] });
  const p = await b.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1.5 });
  await p.goto('http://127.0.0.1:4321/', { waitUntil: 'load' });
  await p.waitForTimeout(3200);
  const r = await p.evaluate(() => {
    const q = (sel) => { const e = document.querySelector(sel); if (!e) return 'missing';
      const c = getComputedStyle(e); return `${c.display} op=${c.opacity} blend=${c.mixBlendMode} vis=${c.visibility}`; };
    const acts = [...document.querySelectorAll('.act')].map(a =>
      `${a.dataset.act}: ${a.classList.contains('is-live') ? 'LIVE' : 'hidden'} vis=${getComputedStyle(a.querySelector('.act-stage')).visibility}`);
    return {
      scrim: q('#scrim'), grain: q('#grain'), atmos: q('#atmos'),
      glBack: q('#gl-back'), glFront: q('#gl-front'),
      acts,
      domNodes: document.querySelectorAll('main *').length,
      blend: [...document.querySelectorAll('*')].filter(e => getComputedStyle(e).mixBlendMode !== 'normal').length,
      bfilter: [...document.querySelectorAll('*')].filter(e => getComputedStyle(e).backdropFilter !== 'none').length,
    };
  });
  console.log(JSON.stringify(r, null, 1));
  await b.close();
})();
