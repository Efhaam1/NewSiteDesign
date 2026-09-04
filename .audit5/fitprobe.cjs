// Swap candidate copy into the live DOM and report fit at the five gate windows.
// usage: node .audit5/fitprobe.cjs
const PW = 'C:/Users/MUS/CurriculumWebsite/node_modules/playwright';
const { chromium } = require(PW);
const WINS = [[1244,620],[1440,900],[1920,1080],[981,620],[390,844]];
// [act index, selector, html-to-set, label]
const CASES = [
  [1, '#h-chaos', 'Every coach teaches<br />a different hour.', 'chaos h2'],
  [5, '#h-system', 'One curriculum.<br />Everything comes from it.', 'system h2'],
  [7, '#h-end',    '<span class="ln"><i>Go teach.</i></span>', 'promo h2'],
  [7, '.promo-lead', 'All five stages are written. Three of the 213 sessions are free to teach right now &mdash; no email, no signup. The six-week pilot is $199, credited in full.', 'promo lead'],
  [7, '.promo-lead', 'CONTROL '.repeat(40), 'CONTROL'],
];
(async () => {
  const b = await chromium.launch({ args: ['--use-gl=angle','--use-angle=gl','--enable-unsafe-swiftshader'] });
  for (const [W,H] of WINS) {
    const p = await b.newPage({ viewport: { width: W, height: H } });
    await p.goto('http://127.0.0.1:4321/', { waitUntil: 'load' });
    await p.waitForTimeout(2500);
    for (const [act, sel, html, label] of CASES) {
      const r = await p.evaluate(({act, sel, html, t}) => {
        const a = window.__w.engine.acts[act];
        window.scrollTo(0, Math.round(a.top + a.len * t));
        const e = document.querySelector(sel);
        const cs = getComputedStyle(e);
        const lh = parseFloat(cs.lineHeight) || parseFloat(cs.fontSize) * 1.2;
        const before = { h: e.getBoundingClientRect().height, lines: Math.round(e.getBoundingClientRect().height / lh) };
        const old = e.innerHTML;
        e.innerHTML = html;
        const after = { h: e.getBoundingClientRect().height, lines: Math.round(e.getBoundingClientRect().height / lh) };
        // does the act's pad overflow now?
        const pad = e.closest('.pad');
        const over = pad ? Math.round(pad.scrollHeight - pad.clientHeight) : null;
        e.innerHTML = old;
        const over0 = pad ? Math.round(pad.scrollHeight - pad.clientHeight) : null;
        return { before, after, over, over0, fs: cs.fontSize };
      }, { act, sel, html, t: 0.4 });
      console.log(`${W}x${H} ${label.padEnd(11)} fs ${r.fs.padEnd(7)} h ${r.before.h.toFixed(0)}->${r.after.h.toFixed(0)} lines ${r.before.lines}->${r.after.lines} padOverflow ${r.over0}->${r.over}`);
    }
    await p.close();
    console.log('');
  }
  await b.close();
})().catch((e)=>{console.error('FAILED', e.message); process.exit(1);});
