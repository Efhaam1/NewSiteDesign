// Measured contrast, from the rendered pixels rather than from CSS. The page sets
// text over a lit 3D board, so a colour token tells you nothing about what a
// reader actually sees: the only honest number comes from sampling the frame.
//
// Method, per element: screenshot its box THREE times — as it renders, with that
// element's own ink made transparent, and with that ink forced white. The second
// pass is the exact backdrop under every pixel. The third gives per-pixel COVERAGE,
// alpha = (white - backdrop) / (255 - backdrop), which is what says whether a pixel
// carries the text colour or a fraction of it. The ratio is reported over the fullest
// pixels (alpha >= 0.8 of the peak), because that is the colour pair WCAG is about.
//
// It used to select those pixels by |ink - backdrop| instead, and that is wrong here
// and wrong quietly: for light ink that statistic falls as the backdrop brightens, so
// over a lit board it picks the DARKEST pixels rather than the fullest ones. On the
// act-7 footer at 390x844 it kept 207 of 6008 inked pixels, all of them on
// near-black, and read 5.62 where the coverage-selected median is 3.26. If you are
// measuring text over the board, medians and p10s are the readings to quote; a single
// min moves by ~0.4 between consecutive frames, because the grain and the atmosphere
// layer are alive even with an act parked.
//
// usage: node tools/contrast.cjs <w> <h> [actIndex] [t] <selector> [selector...]
//        node tools/contrast.cjs 1440 900 7 0.5 '.foot p'
//        node tools/contrast.cjs 1440 900 2 0.9 '.levels li' '.levels .lv-n'
//        ROUTE=/teach node tools/contrast.cjs 1244 620 '.t-focus'
//
// Prints per element: min and median contrast over glyph cores, the ink and
// background colours it sampled, and how many pixels it had to work with.
const PW = 'C:/Users/MUS/CurriculumWebsite/node_modules/playwright';
const { chromium } = require(PW);

const A = process.argv.slice(2);
const W = Number(A[0] || 1440);
const H = Number(A[1] || 900);
let i = 2;
let act = null;
let t = null;
if (A[2] !== undefined && /^\d+$/.test(A[2]) && A[3] !== undefined && /^[\d.]+$/.test(A[3])) {
  act = Number(A[2]); t = Number(A[3]); i = 4;
}
const SEL = A.slice(i);
const ROUTE = process.env.ROUTE || '/';
const MAX = Number(process.env.MAX || 16);

(async () => {
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=gl', '--enable-unsafe-swiftshader'] });
  const opts = { viewport: { width: W, height: H } };
  if (process.env.REDUCED) opts.reducedMotion = 'reduce';
  const p = await b.newPage(opts);
  await p.goto('http://127.0.0.1:4321' + ROUTE, { waitUntil: 'load' });
  await p.waitForTimeout(2400);
  if (act !== null) {
    await p.evaluate(({ act, t }) => {
      const a = window.__w.engine.acts[act];
      // `behavior: instant` on purpose: base.css:9 sets `scroll-behavior: smooth` under
      // no-preference, so a plain scrollTo animates and a flat wait can read a frame that
      // has not finished parking - which mislabelled three rows of a B7 measurement by one
      // 1/120 step of --t before this was found.
      scrollTo({ top: Math.round(a.top + a.len * t), behavior: 'instant' });
    }, { act, t });
    await p.waitForTimeout(900);
  }

  // tag every target so the page can address them after the screenshots
  const boxes = await p.evaluate(({ sels, max }) => {
    const out = [];
    let n = 0;
    for (const s of sels) {
      const els = [...document.querySelectorAll(s)];
      els.slice(0, max).forEach((e, k) => {
        e.setAttribute('data-cx', String(n));
        const r = e.getBoundingClientRect();
        const cs = getComputedStyle(e);
        // the ink box is the text, not the padding box
        const rg = document.createRange(); rg.selectNodeContents(e);
        const rs = [...rg.getClientRects()].filter((x) => x.width > 0 && x.height > 0);
        const ink = rs.length ? {
          x: Math.min(...rs.map((x) => x.left)), y: Math.min(...rs.map((x) => x.top)),
          r: Math.max(...rs.map((x) => x.right)), bo: Math.max(...rs.map((x) => x.bottom)),
        } : { x: r.left, y: r.top, r: r.right, bo: r.bottom };
        out.push({
          id: n++, sel: s + (els.length > 1 ? `[${k}]` : ''),
          x: Math.max(0, Math.floor(ink.x) - 1), y: Math.max(0, Math.floor(ink.y) - 1),
          w: Math.ceil(ink.r - ink.x) + 2, h: Math.ceil(ink.bo - ink.y) + 2,
          color: cs.color, fontSize: cs.fontSize,
          // the product of every ancestor opacity, so the DECLARED ink can be composited
          // the way the browser composites it - small text never renders its own colour at
          // full strength, so the rendered pixel is a floor and this is the number WCAG asks for
          groupOpacity: (() => { let n = 1, x = e; while (x && x !== document.documentElement) { n *= Number(getComputedStyle(x).opacity); x = x.parentElement; } return n; })(),
          text: (e.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 44),
          vis: r.width > 0 && r.height > 0 && cs.display !== 'none' && cs.visibility !== 'hidden',
        });
      });
    }
    return out;
  }, { sels: SEL, max: MAX });

  const live = boxes.filter((x) => x.vis && x.w > 1 && x.h > 1
    && x.x + x.w <= W && x.y + x.h <= H && x.y >= 0);
  const shots = {};
  for (const bx of live) {
    const clip = { x: bx.x, y: bx.y, width: Math.min(bx.w, W - bx.x), height: Math.min(bx.h, H - bx.y) };
    const a1 = (await p.screenshot({ clip })).toString('base64');
    // Repaint this element's own ink, twice: once invisible, which gives the exact
    // backdrop under every pixel, and once pure white, which gives the per-pixel
    // COVERAGE. Everything behind it keeps rendering in both passes.
    const paint = (colour) => p.evaluate(({ id, colour }) => {
      const e = document.querySelector(`[data-cx="${id}"]`);
      if (e.dataset.cxOld === undefined) {
        e.dataset.cxOld = e.style.color + '|' + e.style.textShadow;
        for (const k of e.querySelectorAll('*')) k.dataset.cxOld = k.style.color;
      }
      e.style.setProperty('color', colour, 'important');
      e.style.setProperty('text-shadow', 'none', 'important');
      for (const k of e.querySelectorAll('*')) k.style.setProperty('color', colour, 'important');
    }, { id: bx.id, colour });
    await paint('transparent');
    await p.waitForTimeout(120);
    const a2 = (await p.screenshot({ clip })).toString('base64');
    await paint('#ffffff');
    await p.waitForTimeout(120);
    const a3 = (await p.screenshot({ clip })).toString('base64');
    await p.evaluate((id) => {
      const e = document.querySelector(`[data-cx="${id}"]`);
      const [c, ts] = (e.dataset.cxOld || '|').split('|');
      e.style.color = c; e.style.textShadow = ts;
      for (const k of e.querySelectorAll('*')) k.style.color = k.dataset.cxOld || '';
    }, bx.id);
    await p.waitForTimeout(80);
    shots[bx.id] = [a1, a2, a3];
  }

  // decode and compare inside the page: no image library, and the browser already
  // has a PNG decoder
  const out = await p.evaluate(async ({ shots, meta }) => {
    const lin = (c) => { c /= 255; return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); };
    const lum = (r, g, b) => 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
    const ratio = (l1, l2) => (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
    const grab = async (b64) => {
      const bin = atob(b64);
      const u = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i);
      const bmp = await createImageBitmap(new Blob([u], { type: 'image/png' }));
      const cv = new OffscreenCanvas(bmp.width, bmp.height);
      const cx = cv.getContext('2d', { willReadFrequently: true });
      cx.drawImage(bmp, 0, 0);
      return cx.getImageData(0, 0, bmp.width, bmp.height);
    };
    const res = {};
    for (const [id, [b1, b2, b3]] of Object.entries(shots)) {
      const A = await grab(b1), B = await grab(b2), C = await grab(b3);
      const n = Math.min(A.data.length, B.data.length, C.data.length);
      // Coverage, not difference. The old filter kept pixels by |ink - backdrop|, and for
      // light ink that statistic FALLS as the backdrop brightens - so over a lit 3D board it
      // selected the darkest pixels rather than the fullest ones and read several points too
      // high. Coverage comes from the white pass and is independent of the backdrop:
      // alpha = (white - backdrop) / (255 - backdrop), per channel, averaged where the
      // denominator is big enough to mean anything.
      const cov = [];
      for (let i = 0; i < n; i += 4) {
        let sum = 0, k = 0;
        for (let c = 0; c < 3; c++) {
          const den = 255 - B.data[i + c];
          if (den > 8) { sum += (C.data[i + c] - B.data[i + c]) / den; k++; }
        }
        if (!k) continue;
        const a = sum / k;
        if (a > 0.02) cov.push([i, a]);
      }
      if (!cov.length) { res[id] = { px: 0 }; continue; }
      const maxA = Math.max(...cov.map((x) => x[1]));
      const core = cov.filter((x) => x[1] >= maxA * 0.8);
      const rows = core.map(([i, a]) => {
        const li = lum(A.data[i], A.data[i + 1], A.data[i + 2]);
        const lb = lum(B.data[i], B.data[i + 1], B.data[i + 2]);
        return { r: ratio(li, lb), a, bgL: lb,
          ink: [A.data[i], A.data[i + 1], A.data[i + 2]], bg: [B.data[i], B.data[i + 1], B.data[i + 2]] };
      }).sort((a, b) => a.r - b.r);
      const at = (q) => rows[Math.min(rows.length - 1, Math.floor(rows.length * q))];
      const bg = rows.map((x) => x.bgL).sort((a, b) => a - b);
      // The nominal reading: the element's DECLARED colour, composited at its group opacity
      // over the same backdrop. Small text never renders its own colour at full strength, so
      // the rendered pixel is a floor under the truth and this is the pair WCAG is written
      // about. Both are reported; they bracket the answer.
      const m = meta[id] || {};
      const tok = (m.color || '').match(/\d+(\.\d+)?/g);
      let nom = null;
      if (tok && tok.length >= 3) {
        const o = m.o === undefined ? 1 : m.o;
        const nr = rows.map((x) => {
          const c = [0, 1, 2].map((k) => o * Number(tok[k]) + (1 - o) * x.bg[k]);
          return ratio(lum(c[0], c[1], c[2]), x.bgL);
        }).sort((a, b) => a - b);
        const nAt = (q) => nr[Math.min(nr.length - 1, Math.floor(nr.length * q))];
        nom = { min: nr[0], p10: nAt(0.10), med: nAt(0.50), max: nr[nr.length - 1] };
      }
      res[id] = { px: core.length, all: cov.length,
        min: rows[0].r, p10: at(0.10).r, med: at(0.50).r, max: rows[rows.length - 1].r,
        nom, cov: maxA, ink: at(0.50).ink, bg: at(0.50).bg, worstBg: rows[0].bg, worstInk: rows[0].ink,
        bgMed: bg[Math.floor(bg.length / 2)], bgMax: bg[bg.length - 1] };
    }
    return res;
  }, { shots, meta: Object.fromEntries(live.map((b) => [b.id, { color: b.color, o: b.groupOpacity }])) });

  console.log(`\n${W}x${H}${act !== null ? ` act ${act} t=${t}` : ' at rest'} route=${ROUTE}   (glyph-core pixels, WCAG 2.x ratio)`);
  for (const bx of boxes) {
    if (!bx.vis) { console.log(`  ${bx.sel}  NOT VISIBLE`); continue; }
    const r = out[bx.id];
    if (!r) { console.log(`  ${bx.sel}  box off-screen (${bx.x},${bx.y} ${bx.w}x${bx.h}) — not sampled`); continue; }
    if (!r.px) { console.log(`  ${bx.sel}  no ink pixels found (${bx.w}x${bx.h})`); continue; }
    const f = (x) => x.toFixed(2);
    console.log(`  ${bx.sel}  median ${f(r.med)}:1  p10 ${f(r.p10)}:1  min ${f(r.min)}:1  max ${f(r.max)}:1`
      + `   ${r.px} core px of ${r.all} inked (peak coverage ${r.cov.toFixed(3)})   ${bx.fontSize}`);
    if (r.nom) console.log(`      NOMINAL (declared ink composited): median ${f(r.nom.med)}:1  p10 ${f(r.nom.p10)}:1  min ${f(r.nom.min)}:1`);
    console.log(`      backdrop relative luminance under the ink: median ${r.bgMed.toFixed(4)}, max ${r.bgMax.toFixed(4)}`);
    console.log(`      ink rgb(${r.ink.join(' ')}) on bg rgb(${r.bg.join(' ')});  worst: ink rgb(${r.worstInk.join(' ')}) on rgb(${r.worstBg.join(' ')})`);
    console.log(`      "${bx.text}"`);
  }
  await b.close();
})().catch((e) => { console.error('FAILED', e.message); process.exit(1); });
