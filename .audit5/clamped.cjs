// Is a clamped paragraph honestly clamped? A `-webkit-line-clamp` element always reports
// `scrollHeight > clientHeight` when its text is longer than the clamp — that is the clamp
// working, not a defect. The defect is when the element's BOX is shorter than the clamp it
// carries: then the ellipsis the clamp would draw sits below the box, the last visible line is
// sliced through the middle, and the reader sees a broken word instead of a trimmed sentence.
//
// This reports, per element: the box height, the line-height, the clamp, the lines the box can
// actually show, and whether the ellipsis lands inside it.
//
// usage: node .audit5/clamped.cjs <w> <h> <act> <frac> <selector>
//   env: INJECT=path.css
const PW = 'C:/Users/MUS/CurriculumWebsite/node_modules/playwright';
const { chromium } = require(PW);
const fs = require('fs');
const [W, H, ACT, FRAC] = process.argv.slice(2, 6).map(Number);
const SEL = process.argv[6] || 'p.c-b';
const INJECT = process.env.INJECT ? fs.readFileSync(process.env.INJECT, 'utf8') : '';

(async () => {
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=gl', '--enable-unsafe-swiftshader'] });
  const p = await b.newPage({ viewport: { width: W, height: H } });
  await p.goto('http://127.0.0.1:4321/', { waitUntil: 'load' });
  await p.waitForTimeout(2300);
  if (INJECT) await p.addStyleTag({ content: INJECT });
  await p.evaluate(({ act, frac }) => {
    const a = window.__w.engine.acts[act];
    scrollTo({ top: Math.round(a.top + a.len * frac), behavior: 'instant' });
  }, { act: ACT, frac: FRAC });
  await p.waitForTimeout(700);
  const rows = await p.evaluate((sel) => [...document.querySelectorAll(sel)].map((e) => {
    const cs = getComputedStyle(e);
    const lh = parseFloat(cs.lineHeight);
    const clamp = cs.webkitLineClamp === 'none' ? null : parseInt(cs.webkitLineClamp, 10);
    const box = e.getBoundingClientRect().height;
    // how many line boxes the text actually paints, unclamped
    const rg = document.createRange(); rg.selectNodeContents(e);
    const tops = [...new Set([...rg.getClientRects()].map((r) => Math.round(r.top)))];
    const cell = e.closest('.cell');
    return {
      cell: cell ? (cell.className.split(' ').find((c) => c.startsWith('b-')) || cell.className) : '-',
      box: Math.round(box * 100) / 100,
      lh: Math.round(lh * 100) / 100,
      clamp,
      textLines: tops.length,
      fits: Math.floor((box + 0.6) / lh),
      text: (e.textContent || '').trim().replace(/\s+/g, ' '),
    };
  }), SEL);
  console.log(`\n${W}x${H} act ${ACT} t=${FRAC}  ${SEL}${INJECT ? '  [candidate]' : ''}`);
  for (const r of rows) {
    const shown = Math.min(r.clamp || r.textLines, r.fits);
    const cut = r.textLines > shown && (r.clamp === null || r.clamp > r.fits);
    console.log(`  ${r.cell.padEnd(14)} box ${String(r.box).padStart(6)}  lh ${r.lh}  clamp ${String(r.clamp)}`
      + `  text ${r.textLines} lines  box holds ${r.fits}  -> ${cut ? 'CUT WITHOUT ELLIPSIS' : (r.textLines > shown ? 'trimmed with ellipsis' : 'whole')}`);
    if (cut || r.textLines > shown) {
      const words = r.text.split(' ');
      console.log(`      "${r.text}"`);
      console.log(`      ${words.length} words in the source`);
    }
  }
  await b.close();
})().catch((e) => { console.error('FAILED', e.message); process.exit(1); });
