// fb-cliff.cjs — where the hero headline ACTUALLY wraps, and what one wrapped line costs
// gate assertion 1. Also prints candidate J's per-line ink at 1440x900 (a claim check).
const PW = 'C:/Users/MUS/CurriculumWebsite/node_modules/playwright';
const { chromium } = require(PW);
const WINDOWS = [[1198, 546], [1440, 900], [1920, 1080]];
const PROBES = [
  'Every coach, every table.',        // 25
  'Same session, every coach.',       // 26
  'Every coach, every table, x',      // 27
  'One standard for every coach.',    // 29
  'Every single coach, every table.', // 32
  'No Sunday prep, no improvising.',  // 31
];
(async () => {
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=gl', '--enable-unsafe-swiftshader'] });
  for (const [W, H] of WINDOWS) {
    const p = await b.newPage({ viewport: { width: W, height: H } });
    await p.goto('http://127.0.0.1:4321/', { waitUntil: 'load' });
    await p.waitForTimeout(2600);
    const M = (t) => p.evaluate((tx) => {
      const els = [...document.querySelectorAll('.hero .d1 .ln i')];
      const old = els.map((e) => e.textContent);
      if (tx !== null) els[0].textContent = tx;
      document.body.getBoundingClientRect();
      const per = els.map((e) => {
        const rg = document.createRange(); rg.selectNodeContents(e);
        const rs = [...rg.getClientRects()].filter((x) => x.height > 1);
        return { rects: rs.length,
          w: Math.round((Math.max(...rs.map((x) => x.right)) - Math.min(...rs.map((x) => x.left))) * 10) / 10 };
      });
      const d1 = document.querySelector('.hero .d1');
      const st = document.querySelector('.act-threshold .act-stage');
      const ink = (s) => { const e = document.querySelector(s); const g = document.createRange();
        g.selectNodeContents(e); return Math.max(...[...g.getClientRects()].map((x) => x.bottom)); };
      const out = { per, h1: Math.round(d1.getBoundingClientRect().height * 100) / 100,
        over: st.scrollHeight - st.clientHeight,
        below: Math.round((Math.max(ink('.hero-rule'), ink('.ticker')) - innerHeight) * 100) / 100 };
      els.forEach((e, i) => { e.textContent = old[i]; });
      return out;
    }, t);
    const base = await M(null);
    console.log(`\n=== ${W}x${H}  shipped h1 ${base.h1}px  over ${base.over} below ${base.below}`);
    for (const s of PROBES) {
      const r = await M(s);
      const pass = r.over === 0 && r.below <= 0;
      console.log(`    ${String([...s].length).padStart(2)}ch "${s}"`.padEnd(44)
        + ` ink ${String(r.per[0].w).padEnd(8)} rects ${r.per[0].rects}  h1 ${String(r.h1).padEnd(7)}`
        + ` (+${Math.round((r.h1 - base.h1) * 10) / 10})  over ${String(r.over).padEnd(4)} below ${String(r.below).padEnd(8)} ${pass ? 'PASS' : 'GATE1 FAIL'}`);
    }
    // claim check: candidate J's three lines in place
    const j = await p.evaluate(() => {
      const t = ['No Sunday prep.', 'No improvising.', 'Same hour.'];
      const els = [...document.querySelectorAll('.hero .d1 .ln i')];
      els.forEach((e, i) => { e.textContent = t[i]; });
      document.body.getBoundingClientRect();
      return els.map((e) => {
        const rg = document.createRange(); rg.selectNodeContents(e);
        const rs = [...rg.getClientRects()].filter((x) => x.height > 1);
        return e.textContent + ' = ' + Math.round((Math.max(...rs.map((x) => x.right)) - Math.min(...rs.map((x) => x.left))) * 10) / 10 + 'px/' + rs.length + 'rect';
      });
    });
    console.log('    J in place: ' + j.join('   '));
    await p.close();
  }
  await b.close();
})().catch((e) => { console.error('FAILED', e.message); process.exit(1); });
