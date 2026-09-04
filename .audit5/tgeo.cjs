const PW = 'C:/Users/MUS/CurriculumWebsite/node_modules/playwright';
const { chromium } = require(PW);
(async () => {
  const b = await chromium.launch({ args: ['--use-gl=angle','--use-angle=gl','--enable-unsafe-swiftshader'] });
  for (const [w, h] of [[1440, 900], [1244, 620], [981, 620], [390, 844]]) {
    const p = await b.newPage({ viewport: { width: w, height: h } });
    await p.goto('http://127.0.0.1:4321/', { waitUntil: 'load' });
    await p.waitForTimeout(2600);
    const g = await p.evaluate(() => { const a = window.__w.engine.acts[1];
      return { len: a.len, top: a.top }; });
    console.log(`${w}x${h}  act1 len=${g.len}px  1 grid step (1/120) = ${(g.len/120).toFixed(1)}px`
      + `  0.014 of t = ${(g.len*0.014).toFixed(1)}px  0.007 of t = ${(g.len*0.007).toFixed(1)}px`
      + `  0.0003 of t = ${(g.len*0.0003).toFixed(2)}px`);
    // park in the comparison and measure the .cv-fix hairline against the cards
    await p.evaluate(() => { const a = window.__w.engine.acts[1];
      scrollTo({ top: Math.round(a.top + a.len * 0.42), behavior: 'instant' }); });
    await p.waitForTimeout(900);
    const r = await p.evaluate(() => {
      const f = document.querySelector('.cv-fix'); const c = document.querySelector('.cv-col');
      const fb = f.getBoundingClientRect(); const cb = c.getBoundingClientRect();
      const cs = getComputedStyle(f);
      return { fix: [Math.round(fb.x), Math.round(fb.y), Math.round(fb.width), Math.round(fb.height)],
        col: [Math.round(cb.x), Math.round(cb.y), Math.round(cb.width), Math.round(cb.height)],
        op: cs.opacity, bt: cs.borderTopColor + ' / ' + cs.borderTopWidth,
        inCard: fb.y > cb.y && fb.y < cb.bottom };
    });
    console.log('   .cv-fix box=' + r.fix.join(',') + '  opacity=' + r.op + '  border-top=' + r.bt
      + '  card box=' + r.col.join(',') + '  hairline inside the card row: ' + r.inCard);
    await p.close();
  }
  await b.close();
})();
