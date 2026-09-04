// Antialiasing vs pixel ratio: which combination is crispest per frame?
const PW='C:/Users/MUS/CurriculumWebsite/node_modules/playwright';
const { chromium } = require(PW);
const W=1920,H=1080,DSF=1.5;
const CASES = [
  ['aa0 dpr1.25', 'aa=0&dpr=1.25'],
  ['aa1 dpr1.0',  'aa=1&dpr=1'],
  ['aa1 dpr1.25', 'aa=1&dpr=1.25'],
  ['aa0 dpr1.5',  'aa=0&dpr=1.5'],
  ['aa1 dpr1.5',  'aa=1&dpr=1.5'],
];
(async () => {
  const b = await chromium.launch({ args: ['--use-angle=d3d11','--ignore-gpu-blocklist',
    '--enable-gpu-rasterization','--disable-software-rasterizer'] });
  console.log(`${W}x${H} @dsf ${DSF}`);
  console.log('case'.padEnd(14), 'median'.padStart(7), 'p10'.padStart(6), 'min'.padStart(6), 'samples'.padStart(8));
  for (const [name, qs] of CASES) {
    const p = await b.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: DSF });
    await p.goto('http://127.0.0.1:4321/?' + qs, { waitUntil: 'load' });
    await p.waitForTimeout(3400);
    await p.evaluate(() => { window.__frozen = true; });
    const samples = await p.evaluate(() => {
      const g = window.__w.world.rBack.getContext();
      return g.getParameter(g.SAMPLES);
    });
    const r = await p.evaluate(async () => {
      const max = document.documentElement.scrollHeight - innerHeight;
      const out = []; let frames = 0;
      const tick = () => { frames++; requestAnimationFrame(tick); };
      requestAnimationFrame(tick);
      for (let i = 0; i <= 16; i++) {
        const t0 = performance.now(); frames = 0;
        window.scrollTo(0, Math.round(max * (i / 16)));
        await new Promise((r) => setTimeout(r, 230));
        out.push(frames / ((performance.now() - t0) / 1000));
      }
      out.sort((a, b) => a - b);
      return { median: out[Math.floor(out.length/2)], p10: out[1], min: out[0] };
    });
    console.log(name.padEnd(14), r.median.toFixed(1).padStart(7), r.p10.toFixed(1).padStart(6),
      r.min.toFixed(1).padStart(6), String(samples).padStart(8));
    // a crop of the board edge at the same place every time, for a like-for-like look
    await p.evaluate(() => { const m = document.documentElement.scrollHeight - innerHeight; window.scrollTo(0, Math.round(m*0.28)); });
    await p.waitForTimeout(1100);
    await p.screenshot({ path: 'shots/aa-' + name.replace(/[ .]/g,'') + '.jpg', quality: 92, type: 'jpeg',
      clip: { x: 700, y: 300, width: 620, height: 380 } });
    await p.close();
  }
  await b.close();
})().catch(e => { console.error('FAILED', e.message); process.exit(1); });
