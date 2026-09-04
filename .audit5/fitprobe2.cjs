const PW = 'C:/Users/MUS/CurriculumWebsite/node_modules/playwright';
const { chromium } = require(PW);
const WINS = [[1244,620],[1440,900],[1920,1080],[981,620],[390,844]];
// [actIndex, t, selector, newText, label, clipAncestor]
const CASES = [
  [5, 0.6, '.b-checkpoint .c-t', 'Ten checkpoints, one per level.', 'chk title', '.b-checkpoint'],
  [5, 0.6, '.b-tracks .c-b', 'Both tracks are written into the one curriculum, not sold as two.', 'tracks body', '.b-tracks'],
  [5, 0.6, '.b-curriculum .c-b', 'Six units to a stage, and every session is written out — its minutes, its puzzles, its homework, and what has to be taught before it.', 'curric body', '.b-curriculum'],
  [1, 0.4, '#k-chaos', 'The problem · one session · three coaches · the same 50 minutes', 'chaos kicker', '.chaos-head'],
  [1, 0.75, '.cv-ft', '50-min slot, five parts', 'cv foot', '.cv-one'],
  [4, 0.5, '.pane-plan .pane-foot', '60 min planned', 'act4 foot', '.pane-plan'],
];
(async () => {
  const b = await chromium.launch({ args: ['--use-gl=angle','--use-angle=gl','--enable-unsafe-swiftshader'] });
  for (const [W,H] of WINS) {
    const p = await b.newPage({ viewport: { width: W, height: H } });
    await p.goto('http://127.0.0.1:4321/', { waitUntil: 'load' });
    await p.waitForTimeout(2500);
    for (const [act, t, sel, txt, label, anc] of CASES) {
      const r = await p.evaluate(({act, sel, txt, t, anc}) => {
        const a = window.__w.engine.acts[act];
        window.scrollTo(0, Math.round(a.top + a.len * t));
        const e = document.querySelector(sel);
        if (!e) return null;
        const A = anc ? e.closest(anc) : null;
        const cs = getComputedStyle(e);
        const lh = parseFloat(cs.lineHeight) || parseFloat(cs.fontSize) * 1.2;
        const g = () => ({ h: e.getBoundingClientRect().height, lines: +(e.getBoundingClientRect().height / lh).toFixed(1),
          ao: A ? Math.round(A.scrollHeight - A.clientHeight) : null, clamp: cs.webkitLineClamp });
        const b0 = g(); const old = e.firstChild && e.childNodes.length === 1 && e.firstChild.nodeType === 3 ? e.textContent : null;
        const keep = e.innerHTML; e.textContent = txt; const b1 = g(); e.innerHTML = keep;
        return { b0, b1, fs: cs.fontSize, clamp: cs.webkitLineClamp, textnode: old !== null };
      }, { act, sel, txt, t, anc });
      if (!r) { console.log(`${W}x${H} ${label} NOT FOUND`); continue; }
      console.log(`${W}x${H} ${label.padEnd(13)} fs ${r.fs.padEnd(8)} clamp ${String(r.clamp).padEnd(4)} h ${r.b0.h.toFixed(0)}->${r.b1.h.toFixed(0)} lines ${r.b0.lines}->${r.b1.lines} ancOverflow ${r.b0.ao}->${r.b1.ao}`);
    }
    await p.close(); console.log('');
  }
  await b.close();
})().catch((e)=>{console.error('FAILED', e.message); process.exit(1);});
