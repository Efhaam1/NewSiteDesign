const PW = 'C:/Users/MUS/CurriculumWebsite/node_modules/playwright';
const { chromium } = require(PW);
const SEL = '.converge, .cv-col, .cv-who, .cv-seq, .cv-cost, .cv-bd, .cv-one, .cv-end, .cv-brand, .cv-fix, .cv-fx, .cv-open, .chaos-head, .chaos .d2, .chaos .lead-swap, .pad.chaos';
(async () => {
  const b = await chromium.launch({ args: ['--use-gl=angle','--use-angle=gl','--enable-unsafe-swiftshader'] });
  for (const [w,h] of [[1920,1080],[1920,700],[1600,821],[1600,720],[1440,900],[1366,600],[1219,543],[1244,620],[1150,720],[1149,700],[981,620],[901,821],[390,844],[320,620]]) {
    const p = await b.newPage({ viewport: { width: w, height: h } });
    await p.goto('http://127.0.0.1:4321/', { waitUntil: 'load' });
    await p.waitForTimeout(2400);
    await p.evaluate(() => { const a = window.__w.engine.acts[1]; scrollTo({ top: Math.round(a.top + a.len*0.68), behavior:'instant' }); });
    await p.waitForTimeout(1400);
    const r = await p.evaluate((SEL) => {
      const st = document.querySelector('.act-chaos .act-stage');
      const ink = (e) => { if (!e || getComputedStyle(e).display === 'none') return null;
        const rg = document.createRange(); rg.selectNodeContents(e);
        const rs = [...rg.getClientRects()];
        return rs.length ? Math.max(...rs.map((x) => x.bottom)) : e.getBoundingClientRect().bottom; };
      const boxes = [...document.querySelectorAll(SEL)];
      const bad = boxes.map((e) => ({ c: e.className.toString().split(' ')[0],
        y: e.scrollHeight - e.clientHeight, x: e.scrollWidth - e.clientWidth }))
        .filter((o) => o.y > 0 || o.x > 0);
      const one = document.querySelector('.cv-one');
      const or_ = one.getBoundingClientRect();
      const end = document.querySelector('.cv-end');
      const cost = [...document.querySelectorAll('.cv-cost')];
      return { over: st.scrollHeight - st.clientHeight, bad, n: cost.length, fold: innerHeight,
        lowCost: Math.round(Math.max(...cost.map((e) => ink(e) ?? -1e9))),
        lowEnd: end ? Math.round(ink(end)) : null,
        oneRight: Math.round(or_.right), oneW: Math.round(or_.width), mid: Math.round(innerWidth / 2),
        convW: Math.round(document.querySelector('.converge').getBoundingClientRect().width) };
    }, SEL);
    console.log(`${String(w+'x'+h).padEnd(10)} stage ${r.over} costs ${r.n} cost ${r.lowCost - r.fold} end ${r.lowEnd - r.fold} | conv ${r.convW} one ${r.oneW} dfile-clear ${r.mid - r.oneRight} | bad ${JSON.stringify(r.bad)}`);
    await p.close();
  }
  await b.close();
})();
