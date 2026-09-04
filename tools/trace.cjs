// Record a real Chrome trace while scrolling and report where the time goes.
const PW='C:/Users/MUS/CurriculumWebsite/node_modules/playwright';
const { chromium } = require(PW);
const fs=require('fs'), path=require('path');
const W=Number(process.argv[2]||1920), H=Number(process.argv[3]||1080), DSF=Number(process.argv[4]||2);
const FROM=Number(process.argv[5]||0), TO=Number(process.argv[6]||0.25);
(async () => {
  const b = await chromium.launch({ args: ['--use-angle=d3d11','--ignore-gpu-blocklist',
    '--enable-gpu-rasterization','--disable-software-rasterizer'] });
  const p = await b.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: DSF });
  if (process.env.NOVARS) {
    await p.addInitScript(() => {
      const set = CSSStyleDeclaration.prototype.setProperty;
      const blocked = new Set(String('--t,--e,--h').split(','));
      CSSStyleDeclaration.prototype.setProperty = function (k, v, pr) {
        if (blocked.has(k)) return;
        return set.call(this, k, v, pr);
      };
    });
  }
  await p.goto('http://127.0.0.1:4321/', { waitUntil: 'load' });
  if (process.env.CSS) await p.addStyleTag({ content: process.env.CSS });
  await p.waitForTimeout(3500);
  await p.evaluate((f) => { const m = document.documentElement.scrollHeight - innerHeight; window.scrollTo(0, Math.round(m*f)); }, FROM);
  await p.waitForTimeout(800);

  const out = path.join('shots','trace.json');
  await b.startTracing(p, { path: out, screenshots: false,
    categories: ['devtools.timeline','disabled-by-default-devtools.timeline','blink.user_timing','gpu'] });
  // a realistic slow scroll through the requested range
  const steps = 40;
  for (let i = 0; i <= steps; i++) {
    await p.evaluate((f) => { const m = document.documentElement.scrollHeight - innerHeight; window.scrollTo(0, Math.round(m*f)); },
      FROM + (TO - FROM) * (i / steps));
    await p.waitForTimeout(90);
  }
  await b.stopTracing();
  await b.close();

  const raw = JSON.parse(fs.readFileSync(out, 'utf8'));
  const evs = (raw.traceEvents || raw).filter(e => e.ph === 'X' && e.dur > 0);
  // Only the events that mean something on their own, so nested wrappers like
  // RunTask cannot double-count the whole trace.
  const KEEP = new Set(['UpdateLayoutTree','Layout','PrePaint','Paint','PaintImage',
    'RasterTask','CompositeLayers','Commit','LayerTreeHostImpl::CalculateRenderPasses',
    'FireAnimationFrame','FunctionCall','GPUTask','GLES2::ReadPixels','ScheduledAction::execute',
    'MajorGC','MinorGC','V8.GC_MC_BACKGROUND_MARKING','DecodeImage','ParseHTML','EvaluateScript',
    'UpdateLayerTree','HitTest','ScrollDocumentLoop','BeginMainThreadFrame','DrawFrame']);
  const byName = new Map();
  const t0 = Math.min(...evs.map(e => e.ts));
  const t1 = Math.max(...evs.map(e => e.ts + e.dur));
  for (const e of evs) {
    if (!KEEP.has(e.name)) continue;
    const v = byName.get(e.name) || { total: 0, n: 0, max: 0 };
    v.total += e.dur; v.n++; if (e.dur > v.max) v.max = e.dur;
    byName.set(e.name, v);
  }
  console.log('trace wall clock: ' + ((t1 - t0) / 1000).toFixed(0) + ' ms');
  const rows = [...byName.entries()]
    .map(([name, v]) => ({ name, ms: +(v.total/1000).toFixed(1), n: v.n, maxMs: +(v.max/1000).toFixed(1) }))
    .sort((a, b) => b.ms - a.ms).slice(0, 14);
  console.log((process.env.NOVARS ? '[act vars frozen] ' : '') + `range ${FROM}..${TO} @ ${W}x${H} dsf ${DSF}` + (process.env.CSS ? ' | css: ' + process.env.CSS : ''));
  console.log('name'.padEnd(34), 'total ms'.padStart(9), 'count'.padStart(7), 'max ms'.padStart(8));
  for (const r of rows) console.log(r.name.slice(0,33).padEnd(34), String(r.ms).padStart(9), String(r.n).padStart(7), String(r.maxMs).padStart(8));
})().catch(e => { console.error('FAILED', e.message); process.exit(1); });
