// Try a few live material/light variants and measure each, so the choice is made
// from numbers and a screenshot rather than intuition.
const PW='C:/Users/MUS/CurriculumWebsite/node_modules/playwright';
const { chromium } = require(PW);
const W=1920,H=1080,DSF=1.5;
const CASES = [
  ['as-is', () => {}],
  ['board lambert', async () => {
    const T = await import('three'); const w = window.__w;
    const m = new T.MeshLambertMaterial({ color: 0xffffff, reflectivity: 0 });
    w.board.mesh.material = m;
  }],
  ['no hemisphere', () => { window.__w.world.fill.visible = false; }],
  ['no hue point', () => { window.__w.world.hue.visible = false; }],
  ['no env on scene', () => { window.__w.world.scene.environment = null; }],
  ['no dust', () => { window.__w.world.dustAllowed = false; }],
  ['no scrim quad', () => { window.__w.world.scrim.visible = false; }],
];
(async () => {
  const b = await chromium.launch({ args: ['--use-angle=d3d11','--ignore-gpu-blocklist',
    '--enable-gpu-rasterization','--disable-software-rasterizer'] });
  console.log(`${W}x${H} @dsf ${DSF}`);
  for (const [name, fn] of CASES) {
    const p = await b.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: DSF });
    await p.goto('http://127.0.0.1:4321/', { waitUntil: 'load' });
    await p.waitForTimeout(3200);
    await p.evaluate(() => { window.__frozen = true; window.__w.world.setDpr(1.25); });
    await p.evaluate(fn);
    await p.waitForTimeout(500);
    const r = await p.evaluate(async () => {
      const max = document.documentElement.scrollHeight - innerHeight;
      const out = []; let last = performance.now(), frames = 0;
      const tick = () => { const n = performance.now(); last = n; frames++; requestAnimationFrame(tick); };
      requestAnimationFrame(tick);
      for (let i = 0; i <= 14; i++) {
        const t0 = performance.now(); frames = 0;
        window.scrollTo(0, Math.round(max * (0.02 + (i / 14) * 0.5)));
        await new Promise((r) => setTimeout(r, 240));
        out.push(frames / ((performance.now() - t0) / 1000));
      }
      out.sort((a, b) => a - b);
      return { median: out[Math.floor(out.length/2)], p10: out[1], min: out[0] };
    });
    console.log(name.padEnd(18), r.median.toFixed(1).padStart(6), r.p10.toFixed(1).padStart(6), r.min.toFixed(1).padStart(6));
    if (name !== 'as-is') { await p.evaluate(() => { const m = document.documentElement.scrollHeight - innerHeight; window.scrollTo(0, Math.round(m*0.36)); }); await p.waitForTimeout(900);
      await p.screenshot({ path: 'shots/expt-' + name.replace(/ /g,'-') + '.jpg', quality: 74, type: 'jpeg' }); }
    await p.close();
  }
  await b.close();
})().catch(e => { console.error('FAILED', e.message); process.exit(1); });
