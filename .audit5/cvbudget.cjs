// One-off: how much room act 1's three columns actually have, at the five windows
// tools/gate.cjs asserts fit at. Read-only.
const PW = 'C:/Users/MUS/CurriculumWebsite/node_modules/playwright';
const { chromium } = require(PW);
const WINDOWS = [[1920,1080],[1440,900],[1244,620],[981,620],[390,844],[320,620]];
(async () => {
  const b = await chromium.launch({ args: ['--use-gl=angle','--use-angle=gl','--enable-unsafe-swiftshader'] });
  for (const [w,h] of WINDOWS) {
    const p = await b.newPage({ viewport: { width: w, height: h } });
    await p.goto('http://127.0.0.1:4321/', { waitUntil: 'load' });
    await p.waitForTimeout(2400);
    await p.evaluate(() => { const a = window.__w.engine.acts[1]; scrollTo({ top: Math.round(a.top + a.len*0.45) }); });
    await p.waitForTimeout(1500);
    const r = await p.evaluate(() => {
      const box = (s) => { const e = document.querySelector(s); if (!e) return null;
        const c = e.getBoundingClientRect(); const cs = getComputedStyle(e);
        return { w: Math.round(c.width), h: Math.round(c.height), t: Math.round(c.top), b: Math.round(c.bottom),
                 pad: cs.padding, over: e.scrollHeight - e.clientHeight }; };
      const st = document.querySelector('.act-chaos .act-stage');
      const pad = document.querySelector('.pad.chaos');
      const cols = [...document.querySelectorAll('.cv-col')].map((e) => { const c = e.getBoundingClientRect();
        return { w: Math.round(c.width), h: Math.round(c.height), t: Math.round(c.top) }; });
      const seqs = [...document.querySelectorAll('.cv-seq')].map((e) => { const c = e.getBoundingClientRect();
        return { w: Math.round(c.width), h: Math.round(c.height) }; });
      return { fold: innerHeight, stage: { over: st.scrollHeight - st.clientHeight, h: st.clientHeight },
        pad: box('.pad.chaos'), head: box('.chaos-head'), conv: box('.converge'), cols, seqs,
        one: box('.cv-one'), cost: box('.cv-cost'), gap: getComputedStyle(document.querySelector('.converge')).gap,
        padPad: getComputedStyle(pad).padding };
    });
    console.log(`\n=== ${w}x${h} ===`);
    console.log('stage', JSON.stringify(r.stage), 'fold', r.fold);
    console.log('pad   ', JSON.stringify(r.pad), 'padding', r.padPad);
    console.log('head  ', JSON.stringify(r.head));
    console.log('conv  ', JSON.stringify(r.conv), 'gap', r.gap);
    console.log('cols  ', JSON.stringify(r.cols));
    console.log('seqs  ', JSON.stringify(r.seqs));
    console.log('one   ', JSON.stringify(r.one));
    console.log('cost  ', JSON.stringify(r.cost));
    await p.close();
  }
  await b.close();
})();
