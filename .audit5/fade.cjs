// The reviewer's stuck-both-ways window: at t=0.5 the answer auto-reveals (console.js AUTO_REVEAL
// 0.42) and the pane becomes cut; back at t=0.2 the answer is removed and the pane is whole again.
// The fade must follow both transitions, in both directions.
const PW = 'C:/Users/MUS/CurriculumWebsite/node_modules/playwright';
const { chromium } = require(PW);
const W = Number(process.argv[2] || 600), H = Number(process.argv[3] || 1180);
(async () => {
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=gl', '--enable-unsafe-swiftshader'] });
  const p = await b.newPage({ viewport: { width: W, height: H } });
  await p.goto('http://127.0.0.1:4321/', { waitUntil: 'load' });
  await p.waitForTimeout(2400);
  const read = () => p.evaluate(() => {
    const e = document.querySelector('.pane-ctl');
    return { ch: Math.round(e.clientHeight), sh: Math.round(e.scrollHeight),
      cut: Math.round(e.scrollHeight - e.clientHeight),
      cl: e.classList.contains('clipped'),
      mask: getComputedStyle(e).maskImage !== 'none' };
  });
  for (const t of [0.2, 0.5, 0.2, 0.6, 0.3]) {
    await p.evaluate((f) => {
      const a = window.__w.engine.acts[4];
      scrollTo({ top: Math.round(a.top + a.len * f), behavior: 'instant' });
    }, t);
    await p.waitForTimeout(900);
    const r = await read();
    const want = r.cut > 2;
    console.log(`  t=${t}  pane ${r.ch}/${r.sh} cut ${r.cut}px  clipped ${r.cl}  mask ${r.mask}` +
      `   ${r.cl === want ? 'CORRECT' : 'WRONG — should be ' + want}`);
  }
  await b.close();
})().catch((e) => { console.error('FAILED', e.message); process.exit(1); });
