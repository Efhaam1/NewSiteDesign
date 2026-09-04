// Act 4's four annotation leaders must run level with the line they point at: annot.css's own
// comment says `.an`'s padding-top "puts the label's own line on the control's first line, so
// the leader runs level with the status line it is pointing past". Any change to `.ic`'s
// padding moves that status line, so this measures the offset — before and after, in the same
// page load, with this item's @media rules deleted from the CSSOM for the "before" column.
//
// usage: node .audit5/leaders.cjs <w> <h> [frac]
//   env: KILL=substring   (default "min-height: 821px", i.e. every rule this item adds)
const PW = 'C:/Users/MUS/CurriculumWebsite/node_modules/playwright';
const { chromium } = require(PW);
const W = Number(process.argv[2] || 1440);
const H = Number(process.argv[3] || 900);
const FRAC = Number(process.argv[4] || 0.8);
const KILL = process.env.KILL === undefined ? 'min-height: 821px' : process.env.KILL;

const read = () => {
  const rows = [];
  const ans = [...document.querySelectorAll('.pane-ctl .an')];
  const ics = [...document.querySelectorAll('.pane-ctl .ic')];
  ans.forEach((an, i) => {
    const ic = ics[i];
    if (!ic) return;
    const label = an.querySelector('.an-l');
    const rail = an.querySelector('.an-r');
    // the line the leader is meant to land on: the control's status line, or its first child
    const target = ic.querySelector('.ic-h') || ic.firstElementChild;
    const lb = label.getBoundingClientRect();
    const tb = target.getBoundingClientRect();
    const rb = rail ? rail.getBoundingClientRect() : null;
    rows.push({
      an: an.className.split(' ').pop(),
      ic: ic.className.split(' ').pop(),
      labelMid: Math.round((lb.top + lb.bottom) / 2 * 10) / 10,
      targetMid: Math.round((tb.top + tb.bottom) / 2 * 10) / 10,
      delta: Math.round(((lb.top + lb.bottom) / 2 - (tb.top + tb.bottom) / 2) * 10) / 10,
      railMid: rb ? Math.round((rb.top + rb.bottom) / 2 * 10) / 10 : null,
      railDelta: rb ? Math.round(((rb.top + rb.bottom) / 2 - (tb.top + tb.bottom) / 2) * 10) / 10 : null,
      icPadTop: getComputedStyle(ic).paddingTop,
      anPadTop: getComputedStyle(an).paddingTop,
    });
  });
  return rows;
};

(async () => {
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=gl', '--enable-unsafe-swiftshader'] });
  const p = await b.newPage({ viewport: { width: W, height: H } });
  await p.goto('http://127.0.0.1:4321/', { waitUntil: 'load' });
  await p.waitForTimeout(2400);
  await p.evaluate(({ frac }) => {
    const a = window.__w.engine.acts[4];
    scrollTo({ top: Math.round(a.top + a.len * frac), behavior: 'instant' });
  }, { frac: FRAC });
  await p.waitForTimeout(800);
  const after = await p.evaluate(read);
  const before = await p.evaluate(({ kill, src }) => {
    const sheet = [...document.styleSheets].find((s) => (s.href || '').includes('annot.css'));
    const killed = [];
    for (let i = sheet.cssRules.length - 1; i >= 0; i--) {
      const r = sheet.cssRules[i];
      if (r.constructor.name === 'CSSMediaRule' && r.conditionText.includes(kill)) {
        killed.push([i, r.cssText]); sheet.deleteRule(i);
      }
    }
    document.body.getBoundingClientRect();
    // eslint-disable-next-line no-new-func
    const rows = new Function('return (' + src + ')()')();
    for (const [i, text] of killed.reverse()) sheet.insertRule(text, i);
    return rows;
  }, { kill: KILL, src: read.toString() });
  console.log(`\n${W}x${H} act 4 t=${FRAC}   leader offset = label centre - target centre (px)`);
  console.log('  callout   control      BEFORE (this item ablated)        AFTER (as shipped)');
  after.forEach((a, i) => {
    const b0 = before[i] || {};
    console.log(`  ${a.an.padEnd(9)} ${a.ic.padEnd(11)}  ${String(b0.delta).padStart(6)} (ic pad ${String(b0.icPadTop).padEnd(4)} an pad ${b0.anPadTop})`
      + `   ${String(a.delta).padStart(6)} (ic pad ${String(a.icPadTop).padEnd(4)} an pad ${a.anPadTop})`);
    console.log(`             rail delta  ${String(b0.railDelta).padStart(6)}                            ${String(a.railDelta).padStart(6)}`);
  });
  await b.close();
})().catch((e) => { console.error('FAILED', e.message); process.exit(1); });
