// The act-1 claim swap, measured. sw-a and sw-b share one grid cell (.swap > * { grid-area: 1/1 })
// and cross-fade on --sa / --sb, which B7 tuned so neither slot is ever blank. That trade is
// legible when both sentences are two lines; PITCH step 5 made them four and three, so this
// measures how much ink is superimposed and for how much scroll.
//
// usage: node .audit5/swap.cjs <w> <h>
const PW = 'C:/Users/MUS/CurriculumWebsite/node_modules/playwright';
const { chromium } = require(PW);
const W = Number(process.argv[2] || 1440), H = Number(process.argv[3] || 900);

(async () => {
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=gl', '--enable-unsafe-swiftshader'] });
  const p = await b.newPage({ viewport: { width: W, height: H } });
  await p.goto('http://127.0.0.1:4321', { waitUntil: 'load' });
  await p.waitForTimeout(2600);
  console.log(`${W}x${H}  act 1 claim swap`);
  console.log('    t     --sa   --sb   both>0.25?   a lines  b lines  overlapping line-boxes');
  const rows = [];
  for (let f = 0.36; f <= 0.581; f += 0.02) {
    await p.evaluate((t) => {
      const a = window.__w.engine.acts[1];
      scrollTo({ top: Math.round(a.top + a.len * t) });
    }, f);
    await p.waitForTimeout(900);
    const r = await p.evaluate(() => {
      const cs = getComputedStyle(document.querySelector('.act-chaos'));
      const boxes = (sel) => {
        const el = document.querySelector(sel);
        const rg = document.createRange(); rg.selectNodeContents(el);
        return [...rg.getClientRects()].map((x) => [Math.round(x.top), Math.round(x.bottom)]);
      };
      const A = boxes('.sw-a'), B = boxes('.sw-b');
      let ov = 0;
      for (const a of A) for (const bb of B) if (a[0] < bb[1] && bb[0] < a[1]) ov++;
      return {
        t: Number(cs.getPropertyValue('--t')),
        sa: Number(getComputedStyle(document.querySelector('.sw-a')).opacity),
        sb: Number(getComputedStyle(document.querySelector('.sw-b')).opacity),
        an: A.length, bn: B.length, ov,
      };
    });
    rows.push(r);
    const both = r.sa > 0.25 && r.sb > 0.25;
    console.log(`  ${r.t.toFixed(3)}  ${r.sa.toFixed(3)}  ${r.sb.toFixed(3)}   ${both ? 'BOTH' : '  - '}         ${r.an}        ${r.bn}        ${r.ov}`);
  }
  const bothRows = rows.filter((r) => r.sa > 0.25 && r.sb > 0.25);
  if (bothRows.length) {
    const t0 = Math.min(...bothRows.map((r) => r.t)), t1 = Math.max(...bothRows.map((r) => r.t));
    console.log(`  both above 0.25 from t ${t0.toFixed(3)} to ${t1.toFixed(3)} = ${((t1 - t0) * 400).toFixed(0)}vh of a 400vh pin`
      + ` = ${Math.round((t1 - t0) * 4 * H)}px of scroll at ${H} tall`);
  }
  await b.close();
})();
