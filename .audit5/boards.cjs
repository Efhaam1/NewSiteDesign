// Board size across a window grid: what P2 actually needs, because zero overflow is not the
// same as a board. Reports `.board2d`'s rendered square size, the pixels per chess square, and
// `.pane-board`'s overflow, with optional candidate CSS injected.
//
// usage: node .audit5/boards.cjs <widths> <heights>
//   env: FRAC=0.5  INJECT=path.css
const PW = 'C:/Users/MUS/CurriculumWebsite/node_modules/playwright';
const { chromium } = require(PW);
const fs = require('fs');
const WIDTHS = (process.argv[2] || '900').split(',').map(Number);
const HEIGHTS = (process.argv[3] || '620').split(',').map(Number);
const FRAC = Number(process.env.FRAC || 0.5);
const INJECT = process.env.INJECT ? fs.readFileSync(process.env.INJECT, 'utf8') : '';

(async () => {
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=gl', '--enable-unsafe-swiftshader'] });
  for (const w of WIDTHS) {
    for (const h of HEIGHTS) {
      const p = await b.newPage({ viewport: { width: w, height: h } });
      await p.goto('http://127.0.0.1:4321/', { waitUntil: 'load' });
      await p.waitForTimeout(2300);
      await p.evaluate(({ frac }) => {
        const a = window.__w.engine.acts[4];
        scrollTo({ top: Math.round(a.top + a.len * frac), behavior: 'instant' });
      }, { frac: FRAC });
      await p.waitForTimeout(700);
      const r = await p.evaluate((inject) => {
        if (inject) { const el = document.createElement('style'); el.textContent = inject; document.head.appendChild(el); }
        const bd = document.querySelector('.board2d');
        const pb = document.querySelector('.pane-board');
        const sq = document.querySelector('.board2d .sq');
        const box = bd ? bd.getBoundingClientRect() : null;
        return {
          w: box ? Math.round(box.width * 10) / 10 : null,
          h: box ? Math.round(box.height * 10) / 10 : null,
          sq: sq ? Math.round(sq.getBoundingClientRect().width * 10) / 10 : null,
          over: pb ? pb.scrollHeight - pb.clientHeight : null,
          pane: pb ? Math.round(pb.getBoundingClientRect().height) : null,
        };
      }, INJECT);
      console.log(`${w}x${h}  board ${r.w}x${r.h}  square ${r.sq}px  pane ${r.pane}  over ${r.over}`);
      await p.close();
    }
  }
  await b.close();
})().catch((e) => { console.error('FAILED', e.message); process.exit(1); });
