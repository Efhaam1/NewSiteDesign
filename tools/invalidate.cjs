// Why is style being recalculated every frame? Ask the invalidation tracker.
const PW='C:/Users/MUS/CurriculumWebsite/node_modules/playwright';
const { chromium } = require(PW);
const fs=require('fs'), path=require('path');
const W=1920,H=1080,DSF=1.5;
(async () => {
  const b = await chromium.launch({ args: ['--use-angle=d3d11','--ignore-gpu-blocklist',
    '--enable-gpu-rasterization','--disable-software-rasterizer'] });
  const p = await b.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: DSF });
  await p.goto('http://127.0.0.1:4321/', { waitUntil: 'load' });
  await p.waitForTimeout(4000);
  const out = path.join('shots','inval.json');
  await b.startTracing(p, { path: out, screenshots: false, categories: [
    'devtools.timeline',
    'disabled-by-default-devtools.timeline.invalidationTracking',
    'disabled-by-default-devtools.timeline.stack',
  ]});
  for (let i = 0; i <= 12; i++) {
    await p.evaluate((f) => { const m = document.documentElement.scrollHeight - innerHeight; window.scrollTo(0, Math.round(m*f)); }, 0.02 + i*0.012);
    await p.waitForTimeout(150);
  }
  await b.stopTracing();
  await b.close();

  const raw = JSON.parse(fs.readFileSync(out,'utf8'));
  const evs = raw.traceEvents || raw;
  const reasons = new Map();
  const selectors = new Map();
  let styleEvents = 0, styleElems = 0;
  for (const e of evs) {
    if (e.name === 'UpdateLayoutTree') { styleEvents++; styleElems += (e.args && e.args.elementCount) || 0; }
    if (e.name === 'StyleInvalidatorInvalidationTracking' || e.name === 'StyleRecalcInvalidationTracking') {
      const d = e.args && e.args.data;
      if (!d) continue;
      const r = d.reason || d.invalidationSet || 'unknown';
      reasons.set(r, (reasons.get(r)||0)+1);
      const sel = (d.selectorPart || d.extraData || d.changedAttribute || d.changedClass || d.changedId || '').toString();
      if (sel) selectors.set(sel, (selectors.get(sel)||0)+1);
    }
  }
  console.log('UpdateLayoutTree events:', styleEvents, '| elements recalculated:', styleElems,
    '| avg per event:', styleEvents ? Math.round(styleElems/styleEvents) : 0);
  console.log('\ntop invalidation reasons:');
  for (const [k,v] of [...reasons].sort((a,b)=>b[1]-a[1]).slice(0,12)) console.log('  ', String(v).padStart(6), k);
  console.log('\ntop invalidating selectors / attributes:');
  for (const [k,v] of [...selectors].sort((a,b)=>b[1]-a[1]).slice(0,16)) console.log('  ', String(v).padStart(6), k.slice(0,70));
})().catch(e => { console.error('FAILED', e.message); process.exit(1); });
