// Graft check: does naming the exposure in the LEAD's first clause still clear gate assertion 1?
// h1 held at candidate C02, lead swapped, both states in one page load.
// usage: node .audit5/fb-lead.cjs <w>x<h>,...
const PW = 'C:/Users/MUS/CurriculumWebsite/node_modules/playwright';
const { chromium } = require(PW);
const WINDOWS = (process.argv[2] || '1440x900').split(',').map((s) => s.split('x').map(Number));
const H1 = ['Your standard.', 'Every coach.', 'Every table.'];
const LEADS = {
  shipped: null,
  graft: 'Today it lives in your best coach\u2019s head. The complete five-stage curriculum for ages '
    + '5\u201314 \u2014 213 of 213 sessions written, every puzzle position checked for legality, and '
    + 'identical in every coach\u2019s hands.',
  graftShort: 'Right now it lives in one coach\u2019s head. 213 of 213 sessions written, every puzzle '
    + 'position checked for legality, and identical in every coach\u2019s hands \u2014 the complete '
    + 'five-stage curriculum for ages 5\u201314.',
};

const gate1 = () => {
  document.body.getBoundingClientRect();
  const ink = (sel) => {
    const e = document.querySelector(sel);
    if (!e || getComputedStyle(e).display === 'none') return null;
    const rg = document.createRange(); rg.selectNodeContents(e);
    const rs = [...rg.getClientRects()];
    return rs.length ? Math.max(...rs.map((x) => x.bottom)) : e.getBoundingClientRect().bottom;
  };
  const linecount = (sel) => {
    const e = document.querySelector(sel);
    const rg = document.createRange(); rg.selectNodeContents(e);
    return [...rg.getClientRects()].filter((r) => r.height > 1).length;
  };
  const st = document.querySelector('.act-threshold .act-stage');
  const over = st.scrollHeight - st.clientHeight;
  const r = ink('.hero-rule'), t = ink('.ticker');
  const below = Math.max(r === null ? -1e4 : r - innerHeight, t === null ? -1e4 : t - innerHeight);
  return { over, below: Math.round(below * 100) / 100, pass: over === 0 && below <= 0,
    leadLines: linecount('.hero .lead'),
    leadH: Math.round(document.querySelector('.hero .lead').getBoundingClientRect().height * 10) / 10 };
};

(async () => {
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=gl', '--enable-unsafe-swiftshader'] });
  for (const [W, H] of WINDOWS) {
    const p = await b.newPage({ viewport: { width: W, height: H } });
    await p.goto('http://127.0.0.1:4321/', { waitUntil: 'load' });
    await p.waitForTimeout(2800);
    const shippedLead = await p.evaluate(() => document.querySelector('.hero .lead').textContent);
    await p.evaluate((ls) => {
      [...document.querySelectorAll('.hero .d1 .ln i')].forEach((el, i) => { el.textContent = ls[i]; });
    }, H1);
    for (const [k, v] of Object.entries(LEADS)) {
      await p.evaluate((t) => { document.querySelector('.hero .lead').textContent = t; }, v === null ? shippedLead : v);
      await p.waitForTimeout(250);
      const g = await p.evaluate(gate1);
      console.log(`${W}x${H}  ${k.padEnd(10)} over ${String(g.over).padStart(3)}  ink ${String(g.below).padStart(7)}  `
        + `${g.pass ? 'PASS' : 'FAIL'}  lead ${g.leadLines} lines / ${g.leadH}px`);
    }
    await p.close();
  }
  await b.close();
})().catch((e) => { console.error('FAILED', e.message); process.exit(1); });
