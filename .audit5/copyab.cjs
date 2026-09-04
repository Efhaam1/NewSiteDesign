// Honest before/after for a COPY change, in one page load. The tree already carries the new
// strings, so the "before" column is produced by writing the OLD strings back into the DOM and
// re-measuring — the same technique ab.cjs uses for CSS, adapted for text. Written for PITCH
// step 2 (act 0's five strings).
//
// usage: node .audit5/copyab.cjs <w> <h>
const PW = 'C:/Users/MUS/CurriculumWebsite/node_modules/playwright';
const { chromium } = require(PW);
const W = Number(process.argv[2] || 1440), H = Number(process.argv[3] || 900);
const URL = 'http://127.0.0.1:4321';

const OLD = {
  h1: ['Take a child', 'from a1 ', 'to promotion.'],
  lead: 'Five stages. Ten levels. One route from the first square a child ever names to the day '
      + 'they play with a clock — sequenced, scripted and machine-verified, so every coach in your '
      + 'academy teaches the same lesson the same way.',
  tick: [['213', 'sessions written'], ['1,640', 'puzzles verified'], ['30', 'units'],
         ['210', 'hours of class']],
};
const SEL = ['.hero .d1', '.hero .lead', '.hero-foot', '.ticker', '.hero-rule', '.cta-row'];

(async () => {
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=gl', '--enable-unsafe-swiftshader'] });
  const p = await b.newPage({ viewport: { width: W, height: H } });
  await p.goto(URL, { waitUntil: 'load' });
  await p.waitForTimeout(2600);

  const read = () => p.evaluate((sels) => {
    const ink = (el) => {
      if (!el || getComputedStyle(el).display === 'none') return null;
      const rg = document.createRange(); rg.selectNodeContents(el);
      const rs = [...rg.getClientRects()];
      return rs.length ? Math.max(...rs.map((x) => x.bottom)) : el.getBoundingClientRect().bottom;
    };
    const r2 = (n) => Math.round(n * 10) / 10;
    const st = document.querySelector('.act-threshold .act-stage');
    const out = { stageOver: st.scrollHeight - st.clientHeight, fold: innerHeight, box: {} };
    out.tickInk = ink(document.querySelector('.ticker'));
    out.ruleInk = ink(document.querySelector('.hero-rule'));
    for (const s of sels) {
      const el = document.querySelector(s);
      if (!el) { out.box[s] = null; continue; }
      const r = el.getBoundingClientRect();
      out.box[s] = { w: r2(r.width), h: r2(r.height), top: r2(r.top),
        ovx: el.scrollWidth - el.clientWidth, ovy: el.scrollHeight - el.clientHeight,
        lines: [...(() => { const rg = document.createRange(); rg.selectNodeContents(el);
          return rg.getClientRects(); })()].length };
    }
    out.docOver = document.documentElement.scrollWidth - innerWidth;
    return out;
  }, SEL);

  const after = await read();

  await p.evaluate((old) => {
    const spans = [...document.querySelectorAll('.hero .d1 .ln i')];
    spans.forEach((el, i) => { if (old.h1[i] !== undefined) el.textContent = old.h1[i]; });
    document.querySelector('.hero .lead').textContent = old.lead;
    [...document.querySelectorAll('.ticker li')].forEach((li, i) => {
      if (!old.tick[i]) return;
      li.querySelector('b').textContent = old.tick[i][0];
      li.querySelector('span').textContent = old.tick[i][1];
    });
  }, OLD);
  await p.waitForTimeout(150);
  const before = await read();

  const line = (k, a, bb) => {
    const f = (v) => (v === null ? 'none' : v);
    console.log('  ' + k.padEnd(14) + ' before ' + f(bb) + '   after ' + f(a));
  };
  console.log(W + 'x' + H);
  line('stage over', after.stageOver, before.stageOver);
  line('doc over x', after.docOver, before.docOver);
  line('ticker ink', Math.round(after.tickInk - after.fold), Math.round(before.tickInk - before.fold));
  line('rule ink', after.ruleInk === null ? null : Math.round(after.ruleInk - after.fold),
    before.ruleInk === null ? null : Math.round(before.ruleInk - before.fold));
  console.log('  (ink figures are px past the fold; negative is above it)');
  for (const s of SEL) {
    const a = after.box[s], bb = before.box[s];
    if (!a && !bb) { console.log('  ' + s.padEnd(14) + ' absent'); continue; }
    const fmt = (x) => x.w + 'x' + x.h + ' top ' + x.top + ' ov ' + x.ovx + '/' + x.ovy
      + ' ' + x.lines + 'L';
    console.log('  ' + s.padEnd(14) + ' before ' + fmt(bb) + '   after ' + fmt(a));
  }
  await b.close();
})();
