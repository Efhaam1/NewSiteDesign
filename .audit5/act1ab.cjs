// Act 1 before/after in one page load. The head's geometry depends only on its own three
// strings (kicker, h2, the two swap sentences), so restoring those gives an honest "before" for
// the head; the columns are reported after-only, against the invariant that matters — nothing
// may overflow the pinned stage or its own box.
//
// usage: node .audit5/act1ab.cjs <w> <h> [t]
const PW = 'C:/Users/MUS/CurriculumWebsite/node_modules/playwright';
const { chromium } = require(PW);
const W = Number(process.argv[2] || 1440), H = Number(process.argv[3] || 900);
const T = Number(process.argv[4] || 0.35);
const OLD = {
  kicker: 'The problem every academy owner has',
  h2: 'One standard.<br />Every coach.<br />Every table.',
  swa: 'Without a shared curriculum, every coach builds the hour differently.',
  swb: 'With Efhaam, every coach follows the same progression.',
};
const SEL = ['.act-chaos .act-stage', '.pad.chaos', '.chaos-head', '#k-chaos', '#h-chaos',
  '.lead-swap', '.converge', '.cv-who', '.cv-cost', '.cv-seq', '.coord'];

(async () => {
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=gl', '--enable-unsafe-swiftshader'] });
  const p = await b.newPage({ viewport: { width: W, height: H } });
  await p.goto('http://127.0.0.1:4321', { waitUntil: 'load' });
  await p.waitForTimeout(2600);
  await p.evaluate((t) => {
    const a = window.__w.engine.acts[1];
    scrollTo({ top: Math.round(a.top + a.len * t) });
  }, T);
  await p.waitForTimeout(1400);   // --t is smoothed; 500ms is not settled

  const read = () => p.evaluate((sels) => {
    const r1 = (n) => Math.round(n * 10) / 10;
    const out = [];
    for (const s of sels) {
      const list = [...document.querySelectorAll(s)];
      list.forEach((e, i) => {
        const r = e.getBoundingClientRect();
        const cs = getComputedStyle(e);
        out.push({ sel: s + (list.length > 1 ? '[' + i + ']' : ''),
          w: r1(r.width), h: r1(r.height), top: r1(r.top), bottom: r1(r.bottom),
          ovx: e.scrollWidth - e.clientWidth, ovy: e.scrollHeight - e.clientHeight,
          op: Math.round(Number(cs.opacity) * 100) / 100 });
      });
    }
    out.push({ sel: '--t', w: 0, h: 0, top: 0, bottom: 0, ovx: 0, ovy: 0,
      op: Math.round(Number(getComputedStyle(document.querySelector('.act-chaos'))
        .getPropertyValue('--t')) * 1000) / 1000 });
    return out;
  }, SEL);

  const after = await read();
  await p.evaluate((o) => {
    const k = document.getElementById('k-chaos');
    k.textContent = ''; const dot = document.createElement('span'); dot.className = 'dot';
    k.appendChild(dot); k.append(o.kicker);
    document.getElementById('h-chaos').innerHTML = o.h2;
    document.querySelector('.sw-a').textContent = o.swa;
    document.querySelector('.sw-b').textContent = o.swb;
  }, OLD);
  await p.waitForTimeout(600);
  const before = await read();

  console.log(`${W}x${H} act 1 at t=${T}   (head strings restored for the BEFORE column)`);
  const byKey = (rows) => Object.fromEntries(rows.map((r) => [r.sel, r]));
  const A = byKey(after), B = byKey(before);
  for (const k of Object.keys(A)) {
    const a = A[k], bb = B[k];
    const f = (x) => x ? `${x.w}x${x.h} top ${x.top} ov ${x.ovx}/${x.ovy} op ${x.op}` : 'absent';
    const same = bb && f(a) === f(bb);
    console.log('  ' + k.padEnd(24) + (same ? 'unchanged  ' + f(a)
      : 'before ' + f(bb) + '   after ' + f(a)));
  }
  await b.close();
})();
