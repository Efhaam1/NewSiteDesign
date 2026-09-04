// fb-wrap.cjs — what the 15-character cap is actually protecting.
// Measures the .hero .d1 box (max-width: 15ch, acts.css:134) in px, the widest ink in the
// candidate set, and the real wrap threshold; then prices ONE wrapped line against gate
// assertion 1's fold margin, at the tightest windows.
// usage: node .audit5/fb-wrap.cjs
const PW = 'C:/Users/MUS/CurriculumWebsite/node_modules/playwright';
const { chromium } = require(PW);
const WINDOWS = [[1198, 546], [1440, 900], [1920, 1080]];
const PROBES = [
  'Same session.', 'Every table.', 'No Sunday prep.', 'No improvising.', 'Twentieth year.',
  'Set the roster.', 'Every Wednesday.', 'Stop rebuilding.', 'One standard now.',
  'The whole standard.', 'Every coach, every table.',
];
(async () => {
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=gl', '--enable-unsafe-swiftshader'] });
  for (const [W, H] of WINDOWS) {
    const p = await b.newPage({ viewport: { width: W, height: H } });
    await p.goto('http://127.0.0.1:4321/', { waitUntil: 'load' });
    await p.waitForTimeout(2600);
    const base = await p.evaluate(() => {
      const d1 = document.querySelector('.hero .d1');
      const cs = getComputedStyle(d1);
      const pr = document.createElement('span');
      pr.style.cssText = 'position:absolute;visibility:hidden;white-space:pre;font:inherit';
      pr.textContent = '0'.repeat(15); d1.appendChild(pr);
      const ch15 = pr.getBoundingClientRect().width; pr.remove();
      const st = document.querySelector('.act-threshold .act-stage');
      const ink = (s) => { const e = document.querySelector(s); const r = document.createRange();
        r.selectNodeContents(e); return Math.max(...[...r.getClientRects()].map((x) => x.bottom)); };
      return { font: cs.fontSize, lh: cs.lineHeight, maxw: cs.maxWidth,
        boxW: Math.round(d1.getBoundingClientRect().width * 100) / 100,
        ch15: Math.round(ch15 * 100) / 100,
        h1: Math.round(d1.getBoundingClientRect().height * 100) / 100,
        over: st.scrollHeight - st.clientHeight,
        below: Math.round(Math.max(ink('.hero-rule'), ink('.ticker')) - innerHeight) };
    });
    console.log(`\n=== ${W}x${H}  font ${base.font} / lh ${base.lh}  max-width ${base.maxw} = ${base.ch15}px for 15 zeros`);
    console.log(`    h1 box ${base.h1}px wide-box ${base.boxW}px   shipped: over ${base.over}, below ${base.below} (fold slack ${-base.below}px)`);
    for (const s of PROBES) {
      const r = await p.evaluate((t) => {
        const el = document.querySelector('.hero .d1 .ln i');
        const old = el.textContent; el.textContent = t;
        document.body.getBoundingClientRect();
        const rg = document.createRange(); rg.selectNodeContents(el);
        const rs = [...rg.getClientRects()].filter((x) => x.height > 1);
        const d1 = document.querySelector('.hero .d1');
        const st = document.querySelector('.act-threshold .act-stage');
        const ink = (s2) => { const e = document.querySelector(s2); const g = document.createRange();
          g.selectNodeContents(e); return Math.max(...[...g.getClientRects()].map((x) => x.bottom)); };
        const out = { rects: rs.length,
          w: Math.round(Math.max(...rs.map((x) => x.right)) * 10) / 10 - Math.round(Math.min(...rs.map((x) => x.left)) * 10) / 10,
          h1: Math.round(d1.getBoundingClientRect().height * 100) / 100,
          over: st.scrollHeight - st.clientHeight,
          below: Math.round((Math.max(ink('.hero-rule'), ink('.ticker')) - innerHeight) * 100) / 100 };
        el.textContent = old;
        return out;
      }, s);
      const pass = r.over === 0 && r.below <= 0;
      console.log(`    ${String([...s].length).padStart(2)}ch "${s}"`.padEnd(38)
        + ` ink ${String(Math.round(r.w * 10) / 10).padEnd(7)} rects ${r.rects}  h1 ${String(r.h1).padEnd(7)} over ${String(r.over).padEnd(4)} below ${String(r.below).padEnd(8)} ${pass ? 'PASS' : 'GATE1 FAIL'}`);
    }
    await p.close();
  }
  await b.close();
})().catch((e) => { console.error('FAILED', e.message); process.exit(1); });
