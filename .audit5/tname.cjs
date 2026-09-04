const PW = 'C:/Users/MUS/CurriculumWebsite/node_modules/playwright';
const { chromium } = require(PW);
(async () => {
  const b = await chromium.launch({ args: ['--use-gl=angle','--use-angle=gl','--enable-unsafe-swiftshader'] });
  const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
  await p.goto('http://127.0.0.1:4321/', { waitUntil: 'load' });
  await p.waitForTimeout(2600);
  for (const t of [0.40, 0.5583, 0.72]) {
    await p.evaluate(({ t }) => { const a = window.__w.engine.acts[1];
      scrollTo({ top: Math.round(a.top + a.len * t), behavior: 'instant' }); }, { t });
    await p.waitForTimeout(800);
    const h = await p.locator('#h-chaos');
    const sec = await p.locator('section.act-chaos');
    console.log(`t=${t}  h2 accessible name = ${JSON.stringify(await h.evaluate((e) => e.textContent.replace(/\s+/g,' ').trim()))}`);
    const ax = { name: "(ax api unavailable)" };
    console.log('        section AX name = ' + JSON.stringify(ax && ax.name));
    const hd = await p.evaluate(() => { const e = document.querySelector('#h-chaos');
      const r = e.getBoundingClientRect(); const s = e.querySelectorAll('.sw');
      return { h: Math.round(r.height), spans: [...s].map((x) => Math.round(x.getBoundingClientRect().height) + 'px/' + getComputedStyle(x).opacity + '/aria-hidden=' + (x.getAttribute('aria-hidden') || 'none')) }; });
    console.log('        h2 height=' + hd.h + '  spans: ' + hd.spans.join('  '));
  }
  await b.close();
})();
