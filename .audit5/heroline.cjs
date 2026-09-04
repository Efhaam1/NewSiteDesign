// Per-line ink geometry of the hero headline, in both the shipped and the OLD copy, in one page
// load. Written to answer one question: the pawn's look-x keyframe (director.js:42-47) was tuned
// so the piece passes just past the headline's final glyph, and findings.md:23 measured 15px of
// clearance at 1440x900 in the x-height band of "to promotion.". Step 2 replaced those glyphs.
//
// usage: node .audit5/heroline.cjs <w> <h>
const PW = 'C:/Users/MUS/CurriculumWebsite/node_modules/playwright';
const { chromium } = require(PW);
const W = Number(process.argv[2] || 1440), H = Number(process.argv[3] || 900);
const OLD = ['Take a child', 'from a1 ', 'to promotion.'];

(async () => {
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=gl', '--enable-unsafe-swiftshader'] });
  const p = await b.newPage({ viewport: { width: W, height: H } });
  await p.goto('http://127.0.0.1:4321', { waitUntil: 'load' });
  await p.waitForTimeout(2600);

  const read = () => p.evaluate(() => {
    const r1 = (n) => Math.round(n * 10) / 10;
    const h1 = document.querySelector('.hero .d1');
    const cs = getComputedStyle(h1);
    const out = { font: cs.fontSize, lh: cs.lineHeight, h1: r1(h1.getBoundingClientRect().height), lines: [] };
    for (const i of document.querySelectorAll('.hero .d1 .ln i')) {
      // ink, not box: a Range over the text node gives the glyph run, and the box is the block
      const rg = document.createRange(); rg.selectNodeContents(i);
      const rs = [...rg.getClientRects()];
      const box = i.getBoundingClientRect();
      const ink = rs.length ? rs.reduce((a, x) => ({
        left: Math.min(a.left, x.left), right: Math.max(a.right, x.right),
        top: Math.min(a.top, x.top), bottom: Math.max(a.bottom, x.bottom),
      }), { left: 1e9, right: -1e9, top: 1e9, bottom: -1e9 }) : null;
      out.lines.push({ text: i.textContent, boxH: r1(box.height), boxTop: r1(box.top),
        inkL: ink ? r1(ink.left) : null, inkR: ink ? r1(ink.right) : null,
        inkT: ink ? r1(ink.top) : null, inkB: ink ? r1(ink.bottom) : null, rects: rs.length });
    }
    return out;
  });

  const show = (tag, r) => {
    console.log(`  ${tag}  h1 box ${r.h1}px   font ${r.font} / line-height ${r.lh}`);
    for (const l of r.lines) {
      console.log(`    "${l.text}"`.padEnd(24)
        + ` ink x ${l.inkL}–${l.inkR} (w ${Math.round((l.inkR - l.inkL) * 10) / 10})`
        + `  y ${l.inkT}–${l.inkB}  box h ${l.boxH} top ${l.boxTop}  ${l.rects} rect`);
    }
  };

  console.log(W + 'x' + H);
  show('AFTER ', await read());
  await p.evaluate((old) => {
    [...document.querySelectorAll('.hero .d1 .ln i')].forEach((el, i) => {
      if (old[i] !== undefined) el.textContent = old[i];
    });
  }, OLD);
  await p.waitForTimeout(150);
  show('BEFORE', await read());
  await b.close();
})();
