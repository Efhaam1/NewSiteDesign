// One knob at a time: measure fps with a single subsystem disabled, so the cost
// is attributed by experiment instead of by guesswork.
const PW='C:/Users/MUS/CurriculumWebsite/node_modules/playwright';
const { chromium } = require(PW);
const W=Number(process.env.W||1920), H=Number(process.env.H||1080), DSF=Number(process.env.DSF||2);

const ONLY = (process.env.ONLY || '').split(',').filter(Boolean);
const ALL = [
  ['baseline',        null, null],
  ['dom only (no gl)','.gl{display:none!important}', null],
  ['gl only (no dom)','main{visibility:hidden!important}', null],
  ['shadows off',     null, () => { window.__w.world.setShadows(false); }],
  ['dust off',        null, () => { window.__w.world.dustAllowed = false; }],
  ['dpr 1',           null, () => { window.__w.world.setDpr(1); }],
];
const CASES = ONLY.length ? ALL.filter(c => ONLY.includes(c[0])) : ALL;

(async () => {
  const b = await chromium.launch({ args: ['--use-angle=d3d11','--ignore-gpu-blocklist',
    '--enable-gpu-rasterization','--disable-software-rasterizer'] });
  console.log(`${W}x${H} @dsf ${DSF}`);
  console.log('case'.padEnd(20), 'median'.padStart(7), 'p10'.padStart(6), 'min'.padStart(6), 'worstMs'.padStart(8));
  for (const [name, css, fn] of CASES) {
    const p = await b.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: DSF });
    await p.goto('http://127.0.0.1:4321/', { waitUntil: 'load' });
    await p.waitForTimeout(3200);
    if (css) await p.addStyleTag({ content: css });
    if (fn) await p.evaluate(fn);
    // freeze the adaptive ladder so it cannot mask the effect being measured
    await p.evaluate(() => { window.__frozen = true; });
    await p.waitForTimeout(600);
    const gpu = await p.evaluate(() => { const c=document.createElement('canvas');
      const g=c.getContext('webgl2'); const d=g&&g.getExtension('WEBGL_debug_renderer_info');
      return d ? g.getParameter(d.UNMASKED_RENDERER_WEBGL) : '?'; });
    if (/swiftshader|software/i.test(gpu)) { console.log(name.padEnd(20), 'SOFTWARE - skipped'); await p.close(); continue; }
    const r = await p.evaluate(async () => {
      const max = document.documentElement.scrollHeight - innerHeight;
      const out = [];
      let last = performance.now(), frames = 0, worst = 0;
      const tick = () => { const n = performance.now(); const d = n - last; last = n; frames++; if (d > worst) worst = d; requestAnimationFrame(tick); };
      requestAnimationFrame(tick);
      for (let i = 0; i <= 16; i++) {
        const t0 = performance.now(); frames = 0; worst = 0;
        window.scrollTo(0, Math.round(max * (i / 16)));
        await new Promise((r) => setTimeout(r, 220));
        out.push({ fps: frames / ((performance.now() - t0) / 1000), worst });
      }
      const fps = out.map(o => o.fps).sort((a, b) => a - b);
      return { median: fps[Math.floor(fps.length/2)], p10: fps[Math.floor(fps.length*0.1)], min: fps[0],
               worst: Math.max(...out.map(o => o.worst)) };
    });
    console.log(name.padEnd(20), r.median.toFixed(1).padStart(7), r.p10.toFixed(1).padStart(6),
      r.min.toFixed(1).padStart(6), r.worst.toFixed(0).padStart(8));
    await p.close();
  }
  await b.close();
})().catch(e => { console.error('FAILED', e.message); process.exit(1); });
