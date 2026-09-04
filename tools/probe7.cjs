const PW='C:/Users/MUS/CurriculumWebsite/node_modules/playwright';
const { chromium } = require(PW);
(async () => {
  const b = await chromium.launch({ args: ['--use-gl=angle','--use-angle=gl','--enable-unsafe-swiftshader'] });
  const p = await b.newPage({ viewport: { width: 1200, height: 800 } });
  await p.goto('http://127.0.0.1:4321/', { waitUntil: 'load' });
  await p.waitForTimeout(2600);
  await p.evaluate(() => { const m = document.documentElement.scrollHeight - innerHeight; window.scrollTo(0, Math.round(m*0.82)); });
  await p.waitForTimeout(1600);
  const out = await p.evaluate(() => {
    const cell = document.querySelector('.cell');
    const cs = getComputedStyle(cell);
    const bs = getComputedStyle(document.body);
    const hs = getComputedStyle(document.documentElement);
    return {
      lift: hs.getPropertyValue('--lift'),
      isPaper: document.body.classList.contains('is-paper'),
      cellBg: cs.backgroundColor,
      cellColor: cs.color,
      fg: bs.getPropertyValue('--fg'),
      narr: hs.getPropertyValue('--narr'),
      title: getComputedStyle(document.querySelector('.cell .c-t')).color,
      bentoRect: document.querySelector('.bento').getBoundingClientRect().toJSON(),
      headRect: document.querySelector('.system-head').getBoundingClientRect().toJSON(),
    };
  });
  console.log(JSON.stringify(out, null, 1));
  await b.close();
})().catch(e => { console.error('FAILED', e.message); process.exit(1); });
