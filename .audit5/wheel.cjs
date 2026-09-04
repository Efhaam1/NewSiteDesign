// Does the wheel actually reach `.pane-ctl` now that overscroll-behavior is gone, and does the
// page still advance past it? Real wheel events, one notch at a time with the page settled.
const PW = 'C:/Users/MUS/CurriculumWebsite/node_modules/playwright';
const { chromium } = require(PW);
const W = Number(process.argv[2] || 390), H = Number(process.argv[3] || 620);
(async () => {
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=gl', '--enable-unsafe-swiftshader'] });
  const p = await b.newPage({ viewport: { width: W, height: H } });
  await p.goto('http://127.0.0.1:4321/', { waitUntil: 'load' });
  await p.waitForTimeout(2400);
  await p.evaluate(() => {
    const a = window.__w.engine.acts[4];
    scrollTo({ top: Math.round(a.top + a.len * 0.8), behavior: 'instant' });
  });
  await p.waitForTimeout(900);
  const box = await p.evaluate(() => {
    const e = document.querySelector('.pane-ctl'); const r = e.getBoundingClientRect();
    return { x: Math.round(r.x + 40), y: Math.round(r.y + 30), ch: e.clientHeight, sh: e.scrollHeight };
  });
  console.log(`${W}x${H} pane ${box.ch}/${box.sh}, hovering ${box.x},${box.y}`);
  await p.mouse.move(box.x, box.y);
  await p.waitForTimeout(300);
  for (let i = 1; i <= 4; i++) {
    await p.mouse.wheel(0, 100);
    await p.waitForTimeout(500);
    const r = await p.evaluate(() => ({
      pt: Math.round(document.querySelector('.pane-ctl').scrollTop), sy: Math.round(scrollY),
      cl: document.querySelector('.pane-ctl').classList.contains('clipped') }));
    console.log(`  notch ${i}: paneScrollTop ${r.pt}  scrollY ${r.sy}  clipped ${r.cl}`);
  }
  const prog = await p.evaluate(() => {
    const e = document.querySelector('.pane-ctl'); e.scrollTop = 150; return Math.round(e.scrollTop);
  });
  console.log(`  programmatic scrollTop = 150 -> ${prog} (the pane is scrollable either way)`);
  await b.close();
})().catch((e) => { console.error('FAILED', e.message); process.exit(1); });
