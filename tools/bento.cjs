// Which bento cards clip, at which window heights, and by how much? The 8x10 lattice
// is thinned by the `(max-height: 820px) and (min-width: 901px)` tier and by nothing
// else, so between 821px of height and the height where the full lattice happens to
// fit there is a band no rule covers. This sweeps it.
//
// usage: node tools/bento.cjs [widths] [heights]
//        node tools/bento.cjs 1440 825,840,860,880,900
//        node tools/bento.cjs 1920,1600,1440,1244,981 821,840,860,880,899,900
//
// Prints, per window: every `.bento .cell` whose own box overflows by more than 2px,
// with the amount, plus the tier that is in force and the lattice row height.
const PW = 'C:/Users/MUS/CurriculumWebsite/node_modules/playwright';
const { chromium } = require(PW);
const WIDTHS = (process.argv[2] || '1920,1600,1440,1244,981').split(',').map(Number);
const HEIGHTS = (process.argv[3] || '821,840,860,880,899,900,1080').split(',').map(Number);

(async () => {
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=gl', '--enable-unsafe-swiftshader'] });
  for (const w of WIDTHS) {
    for (const h of HEIGHTS) {
      const p = await b.newPage({ viewport: { width: w, height: h } });
      await p.goto('http://127.0.0.1:4321/', { waitUntil: 'load' });
      await p.waitForTimeout(2300);
      await p.evaluate(() => {
        const a = window.__w.engine.acts[5];
        scrollTo({ top: Math.round(a.top + a.len * 0.5), behavior: 'instant' });
      });
      await p.waitForTimeout(700);
      const r = await p.evaluate(() => {
        const cells = [...document.querySelectorAll('.bento .cell')].map((c) => ({
          id: c.className.split(' ')[1], over: c.scrollHeight - c.clientHeight,
          box: Math.round(c.getBoundingClientRect().height * 10) / 10,
        }));
        const bento = document.querySelector('.bento');
        const st = document.querySelector('.act-system .act-stage');
        return { cells: cells.filter((c) => c.over > 2), n: cells.length,
          rows: getComputedStyle(bento).gridTemplateRows.split(' ').length,
          row0: Math.round(parseFloat(getComputedStyle(bento).gridTemplateRows) * 10) / 10,
          tier820: matchMedia('(max-height: 820px) and (min-width: 901px)').matches,
          stage: st ? st.scrollHeight - st.clientHeight : null };
      });
      const bad = r.cells.map((c) => `${c.id} +${c.over}`).join(', ');
      console.log(`${w}x${h}  tier820 ${r.tier820 ? 'ON ' : 'off'}  ${r.rows} rows of ${r.row0}px  stage ${r.stage}  `
        + (bad ? `CLIPPED: ${bad}` : 'clean'));
      await p.close();
    }
  }
  await b.close();
})().catch((e) => { console.error('FAILED', e.message); process.exit(1); });
