const PW='C:/Users/MUS/CurriculumWebsite/node_modules/playwright';
const { chromium } = require(PW);
const W=Number(process.argv[2]||1440), H=Number(process.argv[3]||900);
const DSF=Number(process.argv[4]||1);
(async () => {
  // Default to the same ANGLE backend a real Chrome on Windows uses (D3D11), not
  // the OpenGL one headless picks, or the numbers are pessimistic by ~2x.
  const b = await chromium.launch({
    // Chromium silently falls back to SwiftShader when the GPU path fails, and a
    // software run is not comparable to a hardware one. Ask for D3D11 explicitly
    // and forbid the fallback, then assert what we actually got.
    args: (process.env.GLARGS || [
      '--use-angle=d3d11', '--ignore-gpu-blocklist', '--enable-gpu-rasterization',
      '--disable-software-rasterizer', '--enable-zero-copy',
    ].join(',')).split(','),
    headless: process.env.HEADFUL ? false : true,
  });
  const p = await b.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: DSF });
  await p.goto('http://127.0.0.1:4321/', { waitUntil: 'load' });
  await p.waitForTimeout(3000);
  const r = await p.evaluate(async () => {
    const out = { samples: [] };
    const max = document.documentElement.scrollHeight - innerHeight;
    let frames = 0, worst = 0, last = performance.now();
    const tick = () => { const n = performance.now(); const d = n - last; last = n; frames++; if (d > worst) worst = d; requestAnimationFrame(tick); };
    requestAnimationFrame(tick);
    // walk the whole page at a realistic scroll speed
    for (let i = 0; i <= 60; i++) {
      const t0 = performance.now(); frames = 0; worst = 0;
      window.scrollTo(0, Math.round(max * (i / 60)));
      await new Promise((r) => setTimeout(r, 250));
      const dt = performance.now() - t0;
      out.samples.push({ at: +(i / 60).toFixed(2), fps: +(frames / (dt / 1000)).toFixed(1), worstMs: +worst.toFixed(1) });
    }
    const fps = out.samples.map(s => s.fps).sort((a, b) => a - b);
    out.median = fps[Math.floor(fps.length / 2)];
    out.p10 = fps[Math.floor(fps.length * 0.1)];
    out.min = fps[0];
    out.worstFrameMs = Math.max(...out.samples.map(s => s.worstMs));
    const w = window.__w;
    out.gpu = (() => { const c=document.createElement('canvas'); const g=c.getContext('webgl2');
      const d=g && g.getExtension('WEBGL_debug_renderer_info');
      return d ? g.getParameter(d.UNMASKED_RENDERER_WEBGL) : 'unknown'; })();
    const pf = window.__prof;
    out.prof = pf ? { jsMs: +(pf.js / pf.n).toFixed(2), glMs: +(pf.gl / pf.n).toFixed(2), n: pf.n } : null;
    out.warmed = w.warmed;
    out.info = { calls: w.world.rBack.info.render.calls + w.world.rFront.info.render.calls,
                 tris: w.world.rBack.info.render.triangles + w.world.rFront.info.render.triangles,
                 progs: w.world.rBack.info.programs.length,
                 dpr: w.world.rBack.getPixelRatio(),
                 bloom: !!w.world.bloom };
    return out;
  });
  if (/swiftshader|software/i.test(r.gpu)) {
    console.log('ABORT: software renderer (' + r.gpu + ') — numbers would be meaningless');
    await b.close();
    process.exit(2);
  }
  console.log('median fps', r.median, '| p10', r.p10, '| min', r.min, '| worst frame', r.worstFrameMs + 'ms');
  console.log('viewport', W+'x'+H, '@dsf', DSF, '|', r.gpu);
  console.log('avg per frame:', JSON.stringify(r.prof), '(js = engine+director, gl = renderer.render)');
  console.log('programs after warm', JSON.stringify(r.warmed), '-> at end', r.info.progs);
  console.log('draw calls', r.info.calls, '| triangles', r.info.tris, '| programs', r.info.progs, '| dpr', r.info.dpr, '| bloom', r.info.bloom);
  const bad = r.samples.filter(s => s.fps < 45);
  if (bad.length) console.log('slow points:', JSON.stringify(bad.slice(0, 12)));
  else console.log('no sample below 45fps');
  await b.close();
})().catch(e => { console.error('FAILED', e.message); process.exit(1); });
