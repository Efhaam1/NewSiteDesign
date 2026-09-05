// Act 7 only: park by act NAME, screenshot and measure the licence sheet.
// usage: node tools/terms.cjs <tag> [w] [h] [t] [annual?]
//        node tools/terms.cjs before 1440 900 0.5
//        node tools/terms.cjs after  1440 900 0.5 annual
const path = require('path');
const fs = require('fs');
const PW = 'C:/Users/MUS/CurriculumWebsite/node_modules/playwright';
const { chromium } = require(PW);
const tag = process.argv[2] || 'terms';
const W = Number(process.argv[3] || 1440);
const H = Number(process.argv[4] || 900);
const T = Number(process.argv[5] || 0.5);
const ANNUAL = (process.argv[6] || '') === 'annual';
const OUT = path.join(__dirname, '..', 'shots');
fs.mkdirSync(OUT, { recursive: true });

(async () => {
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=gl', '--enable-unsafe-swiftshader'] });
  const p = await b.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
  const errs = [];
  p.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); });
  p.on('pageerror', (e) => errs.push('PAGEERROR ' + e.message));
  await p.goto('http://127.0.0.1:4321/', { waitUntil: 'load', timeout: 45000 });
  await p.waitForTimeout(2600);
  await p.evaluate((t) => {
    const a = window.__w.engine.acts.find((x) => x.name === 'terms');
    scrollTo({ top: Math.round(a.top + a.len * t), behavior: 'instant' });
  }, T);
  // the engine damps at 0.16 a frame; a park needs to settle before it is measured
  await p.waitForTimeout(1600);
  if (ANNUAL) {
    await p.evaluate(() => {
      const t = [...document.querySelectorAll('.rate-bill-b')].find((x) => /year|annual|month.*free/i.test(x.textContent));
      if (t && t.getBoundingClientRect().height > 2) t.click();
      else document.querySelector('.rate').classList.add('is-annual');
    });
    await p.waitForTimeout(700);
  }
  const name = `${tag}-${W}x${H}-t${T}${ANNUAL ? '-yr' : ''}.png`;
  await p.screenshot({ path: path.join(OUT, name) });
  const r = await p.evaluate(() => {
    const ink = (el) => {
      if (!el) return null;
      const cs = getComputedStyle(el);
      if (cs.display === 'none' || cs.visibility === 'hidden') return null;
      const rg = document.createRange(); rg.selectNodeContents(el);
      const rs = [...rg.getClientRects()];
      return rs.length ? Math.round(Math.max(...rs.map((x) => x.bottom))) : Math.round(el.getBoundingClientRect().bottom);
    };
    const st = document.querySelector('.act-terms .act-stage');
    const q = (s) => document.querySelector(s);
    const all = (s) => [...document.querySelectorAll(s)];
    const box = (e) => { const b = e.getBoundingClientRect();
      return { w: Math.round(b.width), h: Math.round(b.height), t: Math.round(b.top), b: Math.round(b.bottom),
        over: e.scrollHeight - e.clientHeight }; };
    return {
      fold: innerHeight,
      stageOver: st.scrollHeight - st.clientHeight,
      cards: all('.rate-band').map((e) => ({ id: (e.className.match(/is-\w+/) || ['-'])[0], ...box(e) })),
      lowestInk: Math.max(...all('.rate-band, .rate-cta, .rate-led, .rate-pilot, .rate-foot')
        .map(ink).filter((x) => x !== null), 0),
      addsVisible: all('.rate-adds').filter((e) => e.getBoundingClientRect().height > 2
        && getComputedStyle(e).display !== 'none').length,
      bandCount: all('.rate-band').length,
      cap: !!q('.rate-cap') && q('.rate-cap').getBoundingClientRect().height > 2,
      ctas: all('.rate-band .cta, .rate-cta .cta').map((e) => box(e)),
      clipped: all('.rate-band, .rate-adds, .rate-cap, .rate-inv, .rate-led')
        .map((e) => ({ c: e.className.split(' ').slice(0, 2).join('.'), y: e.scrollHeight - e.clientHeight,
          x: e.scrollWidth - e.clientWidth }))
        .filter((o) => o.y > 2 || o.x > 2),
    };
  });
  console.log(`\n${name}   fold ${r.fold}  stage over ${r.stageOver}px  lowest ink ${r.lowestInk}`
    + `  (${r.lowestInk - r.fold > 0 ? 'PAST FOLD by ' + (r.lowestInk - r.fold) : 'inside fold by ' + (r.fold - r.lowestInk)}px)`);
  console.log(`  bands ${r.bandCount}, adds visible ${r.addsVisible}, cap ${r.cap}, ctas ${r.ctas.length}`);
  for (const c of r.cards) console.log(`  ${String(c.id).padEnd(10)} ${c.w}x${c.h} @${c.t}..${c.b}  over ${c.over}`);
  if (r.clipped.length) console.log('  CLIPPED: ' + r.clipped.map((o) => `${o.c} +${o.y}y/+${o.x}x`).join(', '));
  if (errs.length) console.log('  CONSOLE: ' + errs.slice(0, 6).join(' | '));
  await b.close();
})();
