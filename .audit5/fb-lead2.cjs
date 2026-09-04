// gate assertion 2's own condition (hero lead never clamped mid-sentence) for lead candidates.
// usage: node .audit5/fb-lead2.cjs
const PW = 'C:/Users/MUS/CurriculumWebsite/node_modules/playwright';
const { chromium } = require(PW);
const WINDOWS = [[1244, 620], [981, 620], [1440, 620]];
const LEADS = {
  shipped: null,
  graftAdd: 'Today it lives in your best coach\u2019s head. The complete five-stage curriculum for ages '
    + '5\u201314 \u2014 213 of 213 sessions written, every puzzle position checked for legality, and '
    + 'identical in every coach\u2019s hands.',
  graftSwap: 'The standard your academy sells is in one coach\u2019s head. Here it is written: 213 of 213 '
    + 'sessions, every puzzle position checked for legality, identical in every coach\u2019s hands.',
  graftSwap2: 'Your standard, written down: 213 of 213 sessions for ages 5\u201314, every puzzle position '
    + 'checked for legality, and identical in every coach\u2019s hands \u2014 not just the best one\u2019s.',
};

(async () => {
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=gl', '--enable-unsafe-swiftshader'] });
  for (const [W, H] of WINDOWS) {
    const p = await b.newPage({ viewport: { width: W, height: H } });
    await p.goto('http://127.0.0.1:4321/', { waitUntil: 'load' });
    await p.waitForTimeout(2600);
    const shipped = await p.evaluate(() => document.querySelector('.hero .lead').textContent);
    for (const [k, v] of Object.entries(LEADS)) {
      await p.evaluate((t) => { document.querySelector('.hero .lead').textContent = t; }, v === null ? shipped : v);
      await p.waitForTimeout(220);
      const r = await p.evaluate(() => {
        const l = document.querySelector('.hero .lead');
        return { over: l.scrollHeight - l.clientHeight, tail: l.textContent.trim().slice(-14),
          chars: l.textContent.trim().length };
      });
      console.log(`${W}x${H}  ${k.padEnd(10)} ${r.chars} chars  clamped ${String(r.over).padStart(3)}px  `
        + `${r.over <= 0 ? 'PASS' : 'FAIL'}  ends "${r.tail}"`);
    }
    await p.close();
  }
  await b.close();
})().catch((e) => { console.error('FAILED', e.message); process.exit(1); });
