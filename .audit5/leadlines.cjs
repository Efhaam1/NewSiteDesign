// The hero lead's rendered line boxes — count, width, and the exact characters on each line,
// shipped and with candidate CSS injected, in the SAME page load. This is the number B2's
// reviewer used to price its own `max-width: none` (58/52/50/49/9 -> 75/68/68/9 characters),
// and P8 needs the same accounting for the band above the 820 tier.
//
// usage: INJECT=path.css node .audit5/leadlines.cjs <widths> <heights>
const PW = 'C:/Users/MUS/CurriculumWebsite/node_modules/playwright';
const { chromium } = require(PW);
const fs = require('fs');
const WIDTHS = (process.argv[2] || '1600').split(',').map(Number);
const HEIGHTS = (process.argv[3] || '821').split(',').map(Number);
const INJECT = process.env.INJECT ? fs.readFileSync(process.env.INJECT, 'utf8') : '';

const READ = ({ state, inject }) => {
  let el = null;
  if (state === 'candidate' && inject) {
    el = document.createElement('style'); el.textContent = inject; document.head.appendChild(el);
  }
  document.body.getBoundingClientRect();
  const p = document.querySelector('.hero .lead');
  const cs = getComputedStyle(p);
  // group every character into the line box it renders on, so the text is measured, not guessed
  const walk = document.createTreeWalker(p, NodeFilter.SHOW_TEXT);
  const rows = new Map();
  let n;
  while ((n = walk.nextNode())) {
    for (let i = 0; i < n.length; i++) {
      const rg = document.createRange(); rg.setStart(n, i); rg.setEnd(n, i + 1);
      const r = rg.getBoundingClientRect();
      if (!r.height) continue;
      const key = Math.round(r.top);
      if (!rows.has(key)) rows.set(key, []);
      rows.get(key).push(n.data[i]);
    }
  }
  const lines = [...rows.entries()].sort((a, b) => a[0] - b[0]).map(([, cs2]) => cs2.join(''));
  const box = p.getBoundingClientRect();
  const out = { lines: lines.length, chars: lines.map((l) => l.trim().length),
    width: Math.round(box.width * 100) / 100, height: Math.round(box.height * 100) / 100,
    fontSize: cs.fontSize, maxWidth: cs.maxWidth, lineHeight: cs.lineHeight,
    right: Math.round(box.right * 100) / 100,
    ctaRight: Math.round(document.querySelector('.hero .cta-row').getBoundingClientRect().right * 100) / 100,
    text: lines.map((l) => l.trim()) };
  if (el) el.remove();
  return out;
};

(async () => {
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=gl', '--enable-unsafe-swiftshader'] });
  for (const w of WIDTHS) {
    for (const h of HEIGHTS) {
      const p = await b.newPage({ viewport: { width: w, height: h } });
      await p.goto('http://127.0.0.1:4321/', { waitUntil: 'load' });
      await p.waitForTimeout(2400);
      for (const state of ['shipped', INJECT ? 'candidate' : null].filter(Boolean)) {
        const r = await p.evaluate(READ, { state, inject: INJECT });
        console.log(`${w}x${h} ${state}: ${r.lines} lines, chars ${r.chars.join('/')}, ` +
          `box ${r.width}x${r.height}, max-width ${r.maxWidth}, font ${r.fontSize}, ` +
          `lh ${r.lineHeight}, right ${r.right} (cta-row right ${r.ctaRight})`);
        r.text.forEach((t, i) => console.log(`    ${i + 1}| ${t}`));
      }
      await p.close();
    }
  }
  await b.close();
})().catch((e) => { console.error('FAILED', e.message); process.exit(1); });
