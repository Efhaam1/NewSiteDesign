const PW = 'C:/Users/MUS/CurriculumWebsite/node_modules/playwright';
const { chromium } = require(PW);
const WINS = [[1244,620],[981,620],[390,844],[1440,900]];
const CAND = ['Ten gates, one per level.','Ten checkpoints, one per level.','Ten checkpoints, one a level.','Ten checkpoints.','Ten checkpoints, one a level'];
(async () => {
  const b = await chromium.launch({ args: ['--use-gl=angle','--use-angle=gl','--enable-unsafe-swiftshader'] });
  for (const [W,H] of WINS) {
    const p = await b.newPage({ viewport: { width: W, height: H } });
    await p.goto('http://127.0.0.1:4321/', { waitUntil: 'load' });
    await p.waitForTimeout(2500);
    const out = await p.evaluate((cands) => {
      const a = window.__w.engine.acts[5];
      window.scrollTo(0, Math.round(a.top + a.len * 0.6));
      const e = document.querySelector('.b-checkpoint .c-t');
      const cell = e.closest('.b-checkpoint');
      const names = cell.querySelector('.gate-names');
      const cs = getComputedStyle(e); const lh = parseFloat(cs.lineHeight);
      const res = [];
      const keep = e.innerHTML;
      for (const c of cands) {
        e.textContent = c;
        const r = e.getBoundingClientRect(); const cr = cell.getBoundingClientRect();
        const nr = names ? names.getBoundingClientRect() : null;
        res.push({ c, lines: +(r.height/lh).toFixed(1), cellOver: Math.round(cell.scrollHeight-cell.clientHeight),
          namesBottomPastCell: nr ? Math.round(nr.bottom - cr.bottom) : null, cw: Math.round(cr.width) });
      }
      e.innerHTML = keep;
      return { res, fs: cs.fontSize, lh };
    }, CAND);
    console.log(`== ${W}x${H}  fs ${out.fs} lh ${out.lh} cellW ${out.res[0].cw}`);
    for (const r of out.res) console.log(`   "${r.c}" lines ${r.lines} cellOverflow ${r.cellOver} namesPastCell ${r.namesBottomPastCell}`);
    await p.close();
  }
  await b.close();
})().catch((e)=>{console.error('FAILED', e.message); process.exit(1);});
