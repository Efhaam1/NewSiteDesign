// WCAG 2.2 SC 2.5.8 Target Size (Minimum), evaluated on the rendered page rather than argued from
// a stylesheet. Enumerates every pointer target in a subtree, then for each undersized one applies
// the normative spacing exception: a 24 CSS px DIAMETER circle centred on the target's bounding box
// must not intersect another target's bounding box, nor the circle of another undersized target.
//
// usage: node .audit5/targets.cjs <w> <h> [act t] <root-selector>
//   env: INJECT=path.css   measure the candidate in the same page load
const PW = 'C:/Users/MUS/CurriculumWebsite/node_modules/playwright';
const { chromium } = require(PW);
const fs = require('fs');
const A = process.argv.slice(2);
const W = Number(A[0]); const H = Number(A[1]);
let i = 2, act = null, t = null;
if (/^\d+$/.test(A[2] || '') && /^[\d.]+$/.test(A[3] || '')) { act = Number(A[2]); t = Number(A[3]); i = 4; }
const ROOT = A[i] || 'body';
const INJECT = process.env.INJECT ? fs.readFileSync(process.env.INJECT, 'utf8') : '';

const EVAL = ({ root, state, inject }) => {
  let el = null;
  if (state === 'candidate' && inject) {
    el = document.createElement('style'); el.textContent = inject; document.head.appendChild(el);
  }
  document.body.getBoundingClientRect();
  const SEL = 'button, a[href], input, select, textarea, summary, [role="button"], [role="link"],'
    + ' [role="checkbox"], [role="tab"], [tabindex]:not([tabindex="-1"])';
  const host = document.querySelector(root);
  const targets = [...host.querySelectorAll(SEL)].filter((e) => {
    const cs = getComputedStyle(e);
    if (cs.display === 'none' || cs.visibility === 'hidden' || cs.pointerEvents === 'none') return false;
    const r = e.getBoundingClientRect();
    return r.width > 0 && r.height > 0;
  }).map((e) => {
    // the target is the element's own box UNION any absolutely-positioned pseudo it owns, which is
    // how a hit-area extension is measured: read ::before/::after boxes off the CSSOM
    const r = e.getBoundingClientRect();
    let top = r.top, bottom = r.bottom, left = r.left, right = r.right;
    for (const pe of ['::before', '::after']) {
      const cs = getComputedStyle(e, pe);
      if (cs.content === 'none' || cs.position !== 'absolute') continue;
      const h = parseFloat(cs.height) || 0; const w = parseFloat(cs.width) || 0;
      if (!h && !w) continue;
      // centred vertically on the element by top:50% + translateY(-50%), the pattern used here
      const cy = (r.top + r.bottom) / 2; const cx = (r.left + r.right) / 2;
      if (h) { top = Math.min(top, cy - h / 2); bottom = Math.max(bottom, cy + h / 2); }
      if (w) { left = Math.min(left, cx - w / 2); right = Math.max(right, cx + w / 2); }
    }
    return { label: (e.textContent || e.getAttribute('aria-label') || e.tagName).trim().slice(0, 22),
      x: left, y: top, w: right - left, h: bottom - top,
      cx: (left + right) / 2, cy: (top + bottom) / 2,
      box: `${Math.round(r.width * 100) / 100}x${Math.round(r.height * 100) / 100}`,
      target: `${Math.round((right - left) * 100) / 100}x${Math.round((bottom - top) * 100) / 100}` };
  });
  const R = 12; // 24px diameter
  const rows = targets.map((a2) => {
    const big = a2.w >= 24 && a2.h >= 24;
    const clashes = [];
    if (!big) {
      for (const b2 of targets) {
        if (b2 === a2) continue;
        // circle(a) vs box(b): distance from a's centre to b's rect
        const dx = Math.max(b2.x - a2.cx, 0, a2.cx - (b2.x + b2.w));
        const dy = Math.max(b2.y - a2.cy, 0, a2.cy - (b2.y + b2.h));
        if (Math.hypot(dx, dy) < R) clashes.push(`box:${b2.label}@${Math.round(Math.hypot(dx, dy) * 100) / 100}`);
        else if (!(b2.w >= 24 && b2.h >= 24)) {
          const d = Math.hypot(a2.cx - b2.cx, a2.cy - b2.cy);
          if (d < 2 * R) clashes.push(`circle:${b2.label}@${Math.round(d * 100) / 100}`);
        }
      }
    }
    return { ...a2, big, clashes, pass: big || clashes.length === 0 };
  });
  if (el) el.remove();
  return rows;
};

(async () => {
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=gl', '--enable-unsafe-swiftshader'] });
  const p = await b.newPage({ viewport: { width: W, height: H } });
  await p.goto('http://127.0.0.1:4321' + (process.env.ROUTE || '/'), { waitUntil: 'load' });
  await p.waitForTimeout(2400);
  if (act !== null) {
    await p.evaluate(({ a, f }) => { const x = window.__w.engine.acts[a];
      scrollTo({ top: Math.round(x.top + x.len * f), behavior: 'instant' }); }, { a: act, f: t });
    await p.waitForTimeout(700);
  }
  for (const state of ['shipped', INJECT ? 'candidate' : null].filter(Boolean)) {
    const rows = await p.evaluate(EVAL, { root: ROOT, state, inject: INJECT });
    const bad = rows.filter((r) => !r.pass);
    console.log(`--- ${state}: ${rows.length} targets, ${rows.filter((r) => !r.big).length} undersized, ${bad.length} FAIL`);
    for (const r of rows) {
      console.log(`  ${r.pass ? 'PASS' : 'FAIL'} ${r.big ? '24+ ' : 'small'} box ${r.box} target ${r.target}` +
        ` at ${Math.round(r.x)},${Math.round(r.y)}  "${r.label}"` +
        (r.clashes.length ? `  clashes ${r.clashes.join(', ')}` : ''));
    }
  }
  await b.close();
})().catch((e) => { console.error('FAILED', e.message); process.exit(1); });
