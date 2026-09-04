// The neighbours, both ways in one page load. The reviewer's gate 2 asks whether a height change
// in one act landed in another: this page is one scroll engine with eight pinned acts sharing
// `.pad`, `.act-stage` and the short-window tiers. Reports every act's stage overflow at rest, the
// document height, and every engine act offset/length — as shipped, and with one @media rule
// deleted from the CSSOM (the ablation = the tree without the fix), so both columns are real.
//
// usage: KILL=1400px node .audit5/neigh.cjs <widths> <heights> [sheet-substring]
const PW = 'C:/Users/MUS/CurriculumWebsite/node_modules/playwright';
const { chromium } = require(PW);
const WIDTHS = (process.argv[2] || '1600').split(',').map(Number);
const HEIGHTS = (process.argv[3] || '821').split(',').map(Number);
const SHEET = process.argv[4] || 'product.css';
const KILL = process.env.KILL || '';

const READ = ({ state, kill, sheetName }) => {
  const sheet = [...document.styleSheets].find((s) => (s.href || '').includes(sheetName));
  const killed = [];
  if (state === 'ablated' && kill) {
    for (let i = sheet.cssRules.length - 1; i >= 0; i--) {
      const r = sheet.cssRules[i];
      if (r.constructor.name === 'CSSMediaRule' && r.conditionText.includes(kill)) {
        killed.push([i, r.cssText]); sheet.deleteRule(i);
      }
    }
  }
  document.body.getBoundingClientRect();
  const acts = [...document.querySelectorAll('.act')].map((a, i) => {
    const st = a.querySelector('.act-stage');
    return `${i}:${st.scrollHeight - st.clientHeight}`;
  });
  const eng = (window.__w && window.__w.engine ? window.__w.engine.acts : [])
    .map((a, i) => `${i}:${Math.round(a.top)}/${Math.round(a.len)}`);
  const doc = document.documentElement.scrollHeight;
  const out = { acts: acts.join(' '), eng: eng.join(' '), doc, killed: killed.length };
  for (const [i, text] of killed.reverse()) sheet.insertRule(text, i);
  return out;
};

(async () => {
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=gl', '--enable-unsafe-swiftshader'] });
  for (const w of WIDTHS) {
    for (const h of HEIGHTS) {
      const p = await b.newPage({ viewport: { width: w, height: h } });
      await p.goto('http://127.0.0.1:4321/', { waitUntil: 'load' });
      await p.waitForTimeout(2400);
      const rows = [];
      for (const state of ['shipped', KILL ? 'ablated' : null].filter(Boolean)) {
        const r = await p.evaluate(READ, { state, kill: KILL, sheetName: SHEET });
        rows.push(`  ${state.padEnd(8)} stageOver[${r.acts}]  doc ${r.doc}  killed ${r.killed}\n` +
          `           engine[${r.eng}]`);
      }
      console.log(`${w}x${h}\n${rows.join('\n')}`);
      if (rows.length === 2) {
        // compare acts 1-7 only: act 0 is the one the fix is supposed to change
        const tail = (r) => r.slice(r.indexOf('1:'), r.indexOf(']'));
        const same = tail(rows[0]) === tail(rows[1]);
        console.log(`           acts 1-7 ${same ? 'IDENTICAL' : 'DIFFER - inspect'}`);
      }
      await p.close();
    }
  }
  await b.close();
})().catch((e) => { console.error('FAILED', e.message); process.exit(1); });
