// Act 6's own fit sweep. Replaces tools/bento.cjs, which measured an eight-cell lattice
// that no longer exists. Prints, per window: the stage's own overflow, every act-6 box
// that overflows its content, the plate's size, the board's square, and the lowest ink
// against the fold — at the fractions where the act is most crowded (the diagram
// complete at 0.52, and the payoff up with the ream out at 0.78).
//
// usage: node tools/sysfit.cjs [wide|phone|all] [fracs]
//        node tools/sysfit.cjs wide 0.52,0.78
const PW = 'C:/Users/MUS/CurriculumWebsite/node_modules/playwright';
const { chromium } = require(PW);
const WIDE = [[1920, 1080], [1920, 900], [1920, 700], [1600, 900], [1600, 821], [1440, 900],
  [1440, 760], [1440, 620], [1244, 620], [1219, 543], [1180, 800], [1100, 900], [981, 620],
  [901, 700], [901, 620]];
const PHONE = [[900, 780], [820, 700], [768, 1024], [600, 760], [430, 932], [390, 844],
  [390, 780], [390, 700], [390, 664], [388, 780], [375, 812], [375, 780], [360, 740],
  [360, 800], [320, 871], [320, 700]];
const SET = (process.argv[2] || 'all');
const WINDOWS = SET === 'wide' ? WIDE : SET === 'phone' ? PHONE : WIDE.concat(PHONE);
const FRACS = (process.argv[3] || '0.52,0.78').split(',').map(Number);

(async () => {
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=gl', '--enable-unsafe-swiftshader'] });
  let bad = 0;
  for (const [w, h] of WINDOWS) {
    const p = await b.newPage({ viewport: { width: w, height: h } });
    await p.goto('http://127.0.0.1:4321/', { waitUntil: 'load' });
    await p.waitForTimeout(2400);
    const lines = [];
    for (const f of FRACS) {
      await p.evaluate((f) => {
        const a = window.__w.engine.acts.find((x) => x.name === 'system');
        scrollTo({ top: Math.round(a.top + a.len * f), behavior: 'instant' });
      }, f);
      // the engine is damped: a reveal band read too early reports a position it has
      // not arrived at (STATE.md). 1400ms is the settle every act-6 number is taken at.
      await p.waitForTimeout(1400);
      const r = await p.evaluate(() => {
        const st = document.querySelector('.act-system .act-stage');
        const q = (s) => document.querySelector(s);
        const vis = (e) => e && getComputedStyle(e).display !== 'none'
          && e.getBoundingClientRect().width > 1;
        const over = [];
        // `.sy-field` and the two sides are deliberately NOT here: the washes bleed 14px
        // into the gutter and the sheet hangs below the plate, both by design, and neither
        // is clipped by anything. What must not clip is the STAGE and the boxes that hold
        // words.
        for (const sel of ['.sy-core', '.sy-sheet', '.sy-ways', '.sy-note', '.sy-close',
          '.system-head', '.sy-rail', '.sy-chips', '.sy-head2', '.sy-hour', '.sy-pos',
          '.sy-sat', '.sy-bcap']) {
          for (const e of document.querySelectorAll(sel)) {
            if (!vis(e)) continue;
            const oy = e.scrollHeight - e.clientHeight;
            // a satellite's own leader hangs --sy-lead past its edge on purpose - but only
            // while there IS a leader. Below 1180 they are display:none and a figure whose
            // unit does not fit its column is a real defect, so the excuse is conditional.
            const lead = e.querySelector && e.querySelector('.sy-r');
            const hasLead = lead && getComputedStyle(lead).display !== 'none';
            const ox = (sel === '.sy-sat' && hasLead) ? 0 : e.scrollWidth - e.clientWidth;
            if (oy > 2 || ox > 2) over.push(`${sel}+${oy}y/${ox}x`);
          }
        }
        // lowest ink on the stage against the fold
        const ink = (e) => {
          if (!vis(e)) return -1e9;
          const rg = document.createRange(); rg.selectNodeContents(e);
          const rs = [...rg.getClientRects()];
          return rs.length ? Math.max(...rs.map((x) => x.bottom)) : e.getBoundingClientRect().bottom;
        };
        let low = -1e9, who = '';
        for (const e of document.querySelectorAll('.pad.system p, .pad.system h2, .pad.system h3, .pad.system li, .pad.system button')) {
          const v = ink(e);
          if (v > low) { low = v; who = (e.className || e.tagName).toString().split(' ')[0]; }
        }
        // SIBLINGS MUST NOT LAND ON EACH OTHER. `.pad.system`'s middle row is
        // `minmax(0, 1fr)`, so when the stack wants more than the row it does not clip — it
        // spills, and at 390x844 six figures sat on top of two lines of the payoff while
        // every per-box check read clean. This is the check that would have caught it.
        // Ink, not boxes, for any pair involving the coordinate. `.coord` is absolutely
        // positioned inside `.pad`'s own bottom padding, so on this act — whose last grid row
        // is a full-width centred sentence — its BOX intersects the close's box at every
        // window by construction, while the two pieces of type only actually collide on a
        // phone. Boxes for everything else; ink for this pair.
        const inkRects = (e) => {
          const rg = document.createRange(); rg.selectNodeContents(e);
          const rs = [...rg.getClientRects()].filter((r) => r.width > 0 && r.height > 0);
          return rs.length ? rs : [e.getBoundingClientRect()];
        };
        const hits = (a, b, useInk) => {
          const A = useInk ? inkRects(a) : [a.getBoundingClientRect()];
          const B = useInk ? inkRects(b) : [b.getBoundingClientRect()];
          for (const x of A) for (const y of B) {
            const dy = Math.min(x.bottom, y.bottom) - Math.max(x.top, y.top);
            const dx = Math.min(x.right, y.right) - Math.max(x.left, y.left);
            if (dy > 2 && dx > 2) return Math.round(dy);
          }
          return 0;
        };
        const els = [...document.querySelectorAll('.sy-sat, .sy-core, .sy-close, .system-head,'
          + ' .act-system .coord')].filter(vis)
          .map((e) => ({ n: (e.className || '').split(' ')[0], e }));
        const overlaps = [];
        for (let i = 0; i < els.length; i++) {
          for (let j = i + 1; j < els.length; j++) {
            // two figures in one column cannot cross
            if (els[i].n === els[j].n && els[i].n === 'sy-sat') continue;
            const useInk = els[i].n === 'coord' || els[j].n === 'coord';
            const d = hits(els[i].e, els[j].e, useInk);
            if (d) overlaps.push(`${els[i].n}/${els[j].n}+${d}px`);
          }
        }
        const bdEl = q('.sy-board .board2d');
        const bd = bdEl ? bdEl.getBoundingClientRect() : null;
        const core = q('.sy-core').getBoundingClientRect();
        return {
          stage: st.scrollHeight - st.clientHeight, over, overlaps,
          core: `${Math.round(core.width)}x${Math.round(core.height)}`,
          board: bd ? Math.round(bd.width) : 0,
          sq: bd ? Math.round((bd.width / 8) * 10) / 10 : 0,
          past: Math.round(low - innerHeight), who,
          sats: [...document.querySelectorAll('.sy-sat')].filter(vis).length,
          leaders: [...document.querySelectorAll('.sy-r')].filter(vis).length,
        };
      });
      const okBoard = r.board === 0 || (r.board >= 64 && r.sq >= 8);
      const fail = r.stage > 0 || r.over.length || r.past > 0 || !okBoard;
      if (fail) bad++;
      lines.push(`  t=${f}  stage ${r.stage}  plate ${r.core}  board ${r.board}(${r.sq}/sq)`
        + `  sats ${r.sats} leaders ${r.leaders}  lowest ink ${r.past > 0 ? '+' + r.past + 'px PAST FOLD (' + r.who + ')' : r.past + 'px'}`
        + (r.over.length ? `  CLIPPED: ${r.over.join(', ')}` : '')
        + (r.overlaps.length ? `  OVERLAP: ${[...new Set(r.overlaps)].join(', ')}` : '')
        + (!r.over.length && !r.overlaps.length ? '  clean' : ''));
    }
    console.log(`${w}x${h}`);
    for (const l of lines) console.log(l);
    await p.close();
  }
  console.log(bad ? `\n${bad} frame(s) with a problem` : '\nall frames clean');
  await b.close();
})().catch((e) => { console.error('FAILED', e.message); process.exit(1); });
