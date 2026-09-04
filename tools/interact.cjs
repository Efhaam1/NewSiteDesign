const PW='C:/Users/MUS/CurriculumWebsite/node_modules/playwright';
const { chromium } = require(PW);
(async () => {
  const b = await chromium.launch({ args: ['--use-gl=angle','--use-angle=gl','--enable-unsafe-swiftshader'] });
  const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
  const errs=[]; p.on('pageerror',e=>errs.push(e.message)); p.on('console',m=>{if(m.type()==='error')errs.push(m.text())});
  await p.goto('http://127.0.0.1:4321/', { waitUntil: 'load' });
  await p.waitForTimeout(2600);

  // 1. rank ladder navigation
  const before = await p.evaluate(() => scrollY);
  await p.click('#ladder .rungs li[data-rank="5"] .rung-hit');
  await p.waitForTimeout(1400);
  const after = await p.evaluate(() => scrollY);
  console.log('ladder d5:', before, '->', after, after > before ? 'OK' : 'FAIL');

  // 2. the coach dial actually swaps the improvised half and not the session
  await p.evaluate(() => { const e = window.__w.engine; const a = e.acts[1]; window.scrollTo(0, Math.round(a.top + a.len * 0.75)); });
  await p.waitForTimeout(1500);
  const read = () => p.evaluate(() => ({
    beats: [...document.querySelectorAll('.beats .beat')].map(b => b.textContent).join('/'),
    cost: document.querySelector('.improv-cost').textContent.slice(0, 40),
    session: document.querySelector('.dial-card .dc-title').textContent,
    segs: [...document.querySelectorAll('.dial-seg div .num')].map(n => n.textContent).join(','),
  }));
  const a1 = await read();
  await p.click('.dial-row button:nth-child(3)');
  await p.waitForTimeout(500);
  const a2 = await read();
  console.log('dial improv changed:', a1.beats !== a2.beats ? 'OK' : 'FAIL');
  console.log('dial session unchanged:', a1.session === a2.session && a1.segs === a2.segs ? 'OK' : 'FAIL');
  console.log('  ', a1.cost, '=>', a2.cost);

  // 3. keyboard: focus ring reachable
  await p.keyboard.press('Tab'); await p.keyboard.press('Tab');
  const focus = await p.evaluate(() => { const a = document.activeElement; return a.tagName + '.' + (a.className||'') + ' "' + (a.textContent||'').trim().slice(0,24) + '"'; });
  console.log('second tab stop:', focus);

  // 4. nav anchor
  await p.click('.nav-links a[href="#system"]');
  await p.waitForTimeout(1600);
  const at = await p.evaluate(() => Math.round(scrollY / (document.documentElement.scrollHeight - innerHeight) * 100));
  console.log('nav #system ->', at + '% of page', at > 60 && at < 95 ? 'OK' : 'CHECK');

  console.log(errs.length ? 'ERRORS: ' + errs.slice(0,5).join(' | ') : 'no runtime errors');
  await b.close();
})().catch(e => { console.error('FAILED', e.message); process.exit(1); });
