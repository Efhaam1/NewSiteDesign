// ACCESSIBILITY harness for the .cta liquid-metal candidates. Read-only.
//
// What it measures, per variant (shipped / injected candidate) in ONE page load:
//   - label contrast in REST, HOVER (real mouse) and FOCUS-VISIBLE (keyboard modality),
//     by the coverage method tools/contrast.cjs uses: three screenshots per element
//     (as-rendered, ink transparent = exact backdrop, ink white = per-pixel coverage),
//     ratio over the fullest pixels, plus the NOMINAL declared-ink-over-real-backdrop pair.
//   - the PLATE alone (label painted transparent): median / min / max luminance, so the
//     filled and ghost variants can be compared as luminance, not hue.
//   - the FOCUS RING: pixels that change between unfocused and focused, their luminance,
//     and the luminance of the pixels immediately adjacent to them -> SC 1.4.11 ratio.
//   - the hit target rect and the computed styles that matter.
//
// usage: node .audit5/a11y-btn.cjs <w> <h> <act|-> <t|-> <sel>...
//   env: CANDS=shipped,.audit5/fb-btn-1.css,.audit5/fb-btn-3.css   (comma list, 'shipped' = none)
//        STATES=rest,hover,focus     REDUCED=1     PTR=1 (inject candidate 1's 8 lines)
//        MX=0.9 (pointer x fraction inside the box for the hover probe; default 0.5)
const PW = 'C:/Users/MUS/CurriculumWebsite/node_modules/playwright';
const { chromium } = require(PW);
const fs = require('fs');

const A = process.argv.slice(2);
const W = Number(A[0] || 1440), H = Number(A[1] || 900);
const act = A[2] === '-' ? null : Number(A[2]);
const t = A[3] === '-' ? null : Number(A[3]);
const SEL = A.slice(4);
const CANDS = (process.env.CANDS || 'shipped,.audit5/fb-btn-1.css,.audit5/fb-btn-3.css').split(',');
const STATES = (process.env.STATES || 'rest,hover,focus').split(',');
const MX = Number(process.env.MX || 0.5), MY = Number(process.env.MY || 0.5);

const PTR_JS = `let __b=null,__r=null;
addEventListener('pointerover',(e)=>{const x=e.target.closest&&e.target.closest('.cta');
  if(x!==__b){__b=x;__r=x&&x.getBoundingClientRect();}},{passive:true});
addEventListener('pointermove',(e)=>{if(!__b||!__r)return;
  __b.style.setProperty('--mx',((e.clientX-__r.left)/__r.width*100).toFixed(1)+'%');
  __b.style.setProperty('--my',((e.clientY-__r.top)/__r.height*100).toFixed(1)+'%');},{passive:true});`;

const lin = (c) => { c /= 255; return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); };
const lum = (r, g, b) => 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
const ratio = (a, b) => (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
const f2 = (x) => (x === null || x === undefined || Number.isNaN(x) ? '  -  ' : x.toFixed(2));

(async () => {
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=gl', '--enable-unsafe-swiftshader'] });
  const opts = { viewport: { width: W, height: H } };
  if (process.env.REDUCED) opts.reducedMotion = 'reduce';
  if (process.env.FORCED) opts.forcedColors = 'active';
  const p = await b.newPage(opts);
  await p.goto('http://127.0.0.1:4321/', { waitUntil: 'load' });
  await p.waitForTimeout(2500);
  if (process.env.PTR) await p.evaluate(PTR_JS);
  if (act !== null) {
    await p.evaluate(({ act, t }) => {
      const a = window.__w.engine.acts[act];
      scrollTo({ top: Math.round(a.top + a.len * t), behavior: 'instant' });
    }, { act, t });
    await p.waitForTimeout(1200);
  }
  const nCta = await p.evaluate(() => document.querySelectorAll('.cta').length);
  console.log(`\n=== ${W}x${H} ${act === null ? 'at rest' : `act ${act} t=${t}`}`
    + `${process.env.REDUCED ? ' REDUCED-MOTION' : ''}${process.env.PTR ? ' +pointerJS' : ''}`
    + `   .cta in DOM: ${nCta}   pointer probe at ${MX}/${MY} of the box`);

  // ---- helpers that run in the page -------------------------------------
  const grabFns = () => {
    window.__a11y = {
      lin: (c) => { c /= 255; return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); },
    };
  };
  await p.evaluate(grabFns);

  const shot = async (clip) => (await p.screenshot({ clip })).toString('base64');
  const paint = (sel, colour) => p.evaluate(({ sel, colour }) => {
    const e = document.querySelector(sel);
    e.style.setProperty('color', colour, 'important');
    e.style.setProperty('text-shadow', 'none', 'important');
    for (const k of e.querySelectorAll('*')) k.style.setProperty('color', colour, 'important');
  }, { sel, colour });
  const unpaint = (sel) => p.evaluate((sel) => {
    const e = document.querySelector(sel);
    e.style.removeProperty('color'); e.style.removeProperty('text-shadow');
    for (const k of e.querySelectorAll('*')) k.style.removeProperty('color');
  }, sel);

  // decode three base64 pngs in the page and return the contrast stats + plate stats
  const analyse = (a1, a2, a3, declaredColor, gOpacity) => p.evaluate(async ({ a1, a2, a3, dc, go }) => {
    const lin = (c) => { c /= 255; return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); };
    const lum = (r, g, bl) => 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(bl);
    const rat = (x, y) => (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
    const grab = async (b64) => {
      const bin = atob(b64); const u = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i);
      const bmp = await createImageBitmap(new Blob([u], { type: 'image/png' }));
      const cv = new OffscreenCanvas(bmp.width, bmp.height);
      const cx = cv.getContext('2d', { willReadFrequently: true });
      cx.drawImage(bmp, 0, 0);
      return cx.getImageData(0, 0, bmp.width, bmp.height);
    };
    const A = await grab(a1), B = await grab(a2), C = await grab(a3);
    const n = Math.min(A.data.length, B.data.length, C.data.length);
    const cov = [];
    for (let i = 0; i < n; i += 4) {
      let s = 0, k = 0;
      for (let c = 0; c < 3; c++) { const d = 255 - B.data[i + c]; if (d > 8) { s += (C.data[i + c] - B.data[i + c]) / d; k++; } }
      if (!k) continue;
      const a = s / k; if (a > 0.02) cov.push([i, a]);
    }
    // PLATE: pass B is the element with its own ink transparent = the plate as painted
    const pl = [];
    for (let i = 0; i < n; i += 4) pl.push(lum(B.data[i], B.data[i + 1], B.data[i + 2]));
    pl.sort((x, y) => x - y);
    const plate = { med: pl[Math.floor(pl.length / 2)], min: pl[0], max: pl[pl.length - 1],
      p05: pl[Math.floor(pl.length * 0.05)], p95: pl[Math.floor(pl.length * 0.95)], px: pl.length };
    if (!cov.length) return { px: 0, plate };
    const maxA = Math.max(...cov.map((x) => x[1]));
    const core = cov.filter((x) => x[1] >= maxA * 0.8);
    const rows = core.map(([i, a]) => {
      const li = lum(A.data[i], A.data[i + 1], A.data[i + 2]);
      const lb = lum(B.data[i], B.data[i + 1], B.data[i + 2]);
      return { r: rat(li, lb), bgL: lb, bg: [B.data[i], B.data[i + 1], B.data[i + 2]],
        ink: [A.data[i], A.data[i + 1], A.data[i + 2]] };
    }).sort((x, y) => x.r - y.r);
    const at = (q) => rows[Math.min(rows.length - 1, Math.floor(rows.length * q))];
    const tok = (dc || '').match(/[\d.]+/g);
    let nom = null;
    if (tok && tok.length >= 3) {
      const o = go === undefined ? 1 : go;
      const nr = rows.map((x) => {
        const c = [0, 1, 2].map((k) => o * Number(tok[k]) + (1 - o) * x.bg[k]);
        return rat(lum(c[0], c[1], c[2]), x.bgL);
      }).sort((x, y) => x - y);
      const nAt = (q) => nr[Math.min(nr.length - 1, Math.floor(nr.length * q))];
      nom = { min: nr[0], p10: nAt(0.10), med: nAt(0.50) };
    }
    const bgs = rows.map((x) => x.bgL).sort((x, y) => x - y);
    return { px: core.length, min: rows[0].r, p10: at(0.10).r, med: at(0.50).r,
      nom, plate, bgMed: bgs[Math.floor(bgs.length / 2)],
      worstBg: rows[0].bg, worstInk: rows[0].ink, medBg: at(0.5).bg, medInk: at(0.5).ink };
  }, { a1, a2, a3, dc: declaredColor, go: gOpacity });
  // ---- ring diff: which pixels the focus outline actually paints -------
  // Only pixels OUTSIDE the element's border box are counted, so a treatment that also
  // repaints the plate or the border on :focus-visible cannot contaminate the reading.
  const ringStats = async (sel, pad) => {
    const r = await p.evaluate((s) => { const e = document.querySelector(s); const x = e.getBoundingClientRect();
      return { x: x.left, y: x.top, w: x.width, h: x.height }; }, sel);
    const ox = Math.max(0, Math.floor(r.x - pad)), oy = Math.max(0, Math.floor(r.y - pad));
    const clip = { x: ox, y: oy, width: Math.min(Math.ceil(r.w + pad * 2), W - ox), height: Math.min(Math.ceil(r.h + pad * 2), H - oy) };
    if (clip.width < 4 || clip.height < 4 || oy < 0 || oy + clip.height > H) return null;
    await clear();
    const off = await shot(clip);
    await p.keyboard.press('Tab');
    const fv = await p.evaluate((s) => {
      const e = document.querySelector(s); e.focus({ preventScroll: true }); const c = getComputedStyle(e);
      return { fv: e.matches(':focus-visible'), o: `${c.outlineColor} ${c.outlineWidth} ${c.outlineStyle} off ${c.outlineOffset}` };
    }, sel);
    await p.waitForTimeout(700);
    const on = await shot(clip);
    const st = await p.evaluate(async ({ off, on, bb }) => {
      const lin = (c) => { c /= 255; return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); };
      const lum = (r, g, b) => 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
      const rat = (x, y) => (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
      const grab = async (b64) => { const bin = atob(b64); const u = new Uint8Array(bin.length);
        for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i);
        const bmp = await createImageBitmap(new Blob([u], { type: 'image/png' }));
        const cv = new OffscreenCanvas(bmp.width, bmp.height);
        const cx = cv.getContext('2d', { willReadFrequently: true });
        cx.drawImage(bmp, 0, 0); return cx.getImageData(0, 0, bmp.width, bmp.height); };
      const O = await grab(off), N = await grab(on);
      const w = O.width, h = O.height;
      const inside = (x, y) => x >= bb.l && x < bb.r && y >= bb.t && y < bb.b;   // border box, in clip coords
      const isRing = new Uint8Array(w * h);
      let nR = 0, nInside = 0;
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
        const i = (y * w + x) * 4;
        const d = Math.abs(N.data[i] - O.data[i]) + Math.abs(N.data[i + 1] - O.data[i + 1]) + Math.abs(N.data[i + 2] - O.data[i + 2]);
        if (d <= 24) continue;
        if (inside(x, y)) { nInside++; continue; }
        isRing[y * w + x] = 1; nR++;
      }
      if (!nR) return { nR: 0, nInside, w, h };
      const ringL = [], adjL = [];
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
        const i = (y * w + x) * 4;
        if (isRing[y * w + x]) { ringL.push(lum(N.data[i], N.data[i + 1], N.data[i + 2])); continue; }
        if (inside(x, y)) continue;                         // the plate is not "adjacent surround"
        let near = false;
        for (let dy = -3; dy <= 3 && !near; dy++) for (let dx = -3; dx <= 3; dx++) {
          const yy = y + dy, xx = x + dx;
          if (yy < 0 || xx < 0 || yy >= h || xx >= w) continue;
          if (isRing[yy * w + xx]) { near = true; break; }
        }
        if (near) adjL.push(lum(N.data[i], N.data[i + 1], N.data[i + 2]));
      }
      ringL.sort((a, b2) => a - b2); adjL.sort((a, b2) => a - b2);
      const rl = ringL[Math.floor(ringL.length / 2)];
      const al = adjL.length ? adjL[Math.floor(adjL.length / 2)] : null;
      const ratios = adjL.map((v) => rat(rl, v)).sort((a, b2) => a - b2);
      const below3 = ratios.filter((v) => v < 3).length;
      return { nR, nInside, ringL: rl, ringMin: ringL[0], ringMax: ringL[ringL.length - 1],
        adjL: al, adjP10: adjL.length ? adjL[Math.floor(adjL.length * 0.1)] : null,
        adjP90: adjL.length ? adjL[Math.floor(adjL.length * 0.9)] : null,
        ratio: al !== null ? rat(rl, al) : null,
        rP10: ratios.length ? ratios[Math.floor(ratios.length * 0.1)] : null,
        pctBelow3: adjL.length ? below3 / adjL.length : null, nAdj: adjL.length, w, h };
    }, { off, on, bb: { l: r.x - ox - 0.5, r: r.x - ox + r.w + 0.5, t: r.y - oy - 0.5, b: r.y - oy + r.h + 0.5 } });
    return { ...st, ...fv };
  };

  // ---- boundary bands: is the component's extent perceivable at all? ----
  // Samples three concentric bands around the border box and reports median luminance:
  // interior (3-7px in), the 1px border itself, exterior (3-7px out). SC 1.4.11 is
  // satisfied if EITHER the border contrasts its neighbours 3:1 or interior-vs-exterior does.
  const bands = async (sel) => {
    const r = await p.evaluate((s) => { const e = document.querySelector(s); const x = e.getBoundingClientRect();
      return { x: x.left, y: x.top, w: x.width, h: x.height }; }, sel);
    const pad = 8;
    const ox = Math.max(0, Math.floor(r.x - pad)), oy = Math.max(0, Math.floor(r.y - pad));
    const clip = { x: ox, y: oy, width: Math.min(Math.ceil(r.w + pad * 2), W - ox), height: Math.min(Math.ceil(r.h + pad * 2), H - oy) };
    if (clip.width < 8 || clip.height < 8 || oy < 0 || oy + clip.height > H) return null;
    await clear();
    const img = await shot(clip);
    return p.evaluate(async ({ img, bb }) => {
      const lin = (c) => { c /= 255; return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); };
      const lum = (r2, g, b2) => 0.2126 * lin(r2) + 0.7152 * lin(g) + 0.0722 * lin(b2);
      const rat = (x, y) => (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
      const bin = atob(img); const u = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i);
      const bmp = await createImageBitmap(new Blob([u], { type: 'image/png' }));
      const cv = new OffscreenCanvas(bmp.width, bmp.height);
      const cx = cv.getContext('2d', { willReadFrequently: true });
      cx.drawImage(bmp, 0, 0);
      const D = cx.getImageData(0, 0, bmp.width, bmp.height), w = bmp.width, h = bmp.height;
      const IN = [], BO = [], EX = [];
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
        // signed distance to the border box edge, negative inside
        const dx = Math.max(bb.l - x, x - (bb.r - 1), 0), dy = Math.max(bb.t - y, y - (bb.b - 1), 0);
        const outD = Math.max(dx, dy);
        const inD = Math.min(x - bb.l, bb.r - 1 - x, y - bb.t, bb.b - 1 - y);
        const i = (y * w + x) * 4, L = lum(D.data[i], D.data[i + 1], D.data[i + 2]);
        if (outD === 0 && inD >= 3 && inD <= 7) IN.push(L);
        else if (outD === 0 && inD >= 0 && inD < 1) BO.push(L);
        else if (outD >= 3 && outD <= 7) EX.push(L);
      }
      const md = (a) => { a.sort((x, y) => x - y); return a.length ? a[Math.floor(a.length / 2)] : null; };
      const iL = md(IN), bL = md(BO), eL = md(EX);
      return { iL, bL, eL, nIn: IN.length, nBo: BO.length, nEx: EX.length,
        borderVsIn: iL !== null && bL !== null ? rat(bL, iL) : null,
        borderVsEx: eL !== null && bL !== null ? rat(bL, eL) : null,
        inVsEx: iL !== null && eL !== null ? rat(iL, eL) : null };
    }, { img, bb: { l: Math.round(r.x - ox), r: Math.round(r.x - ox + r.w), t: Math.round(r.y - oy), b: Math.round(r.y - oy + r.h) } });
  };

  // ---- one measurement of one selector in one state ----------------------
  const READ = (s) => {
    const e = document.querySelector(s); if (!e) return null;
    const cs = getComputedStyle(e);
    const rg = document.createRange(); rg.selectNodeContents(e);
    const rs = [...rg.getClientRects()].filter((x) => x.width > 0 && x.height > 0);
    const r = e.getBoundingClientRect();
    const ink = rs.length ? { x: Math.min(...rs.map((q) => q.left)), y: Math.min(...rs.map((q) => q.top)),
      r: Math.max(...rs.map((q) => q.right)), bo: Math.max(...rs.map((q) => q.bottom)) }
      : { x: r.left, y: r.top, r: r.right, bo: r.bottom };
    let go = 1, x = e; while (x && x !== document.documentElement) { go *= Number(getComputedStyle(x).opacity); x = x.parentElement; }
    const pb = getComputedStyle(e, '::before'), pa = getComputedStyle(e, '::after');
    return { rect: { x: r.left, y: r.top, w: r.width, h: r.height },
      ink: { x: Math.max(0, Math.floor(ink.x) - 2), y: Math.max(0, Math.floor(ink.y) - 2),
        w: Math.ceil(ink.r - ink.x) + 4, h: Math.ceil(ink.bo - ink.y) + 4 },
      color: cs.color, bg: cs.backgroundColor, bgi: (cs.backgroundImage || '').slice(0, 46),
      fs: cs.fontSize, fw: cs.fontWeight, minH: cs.minHeight, pad: cs.padding,
      bt: cs.borderTopColor, bb: cs.borderBottomColor, tr: cs.transform, bsh: (cs.boxShadow || 'none').slice(0, 60),
      go, hov: e.matches(':hover'), fv: e.matches(':focus-visible'),
      before: pb.opacity + '|' + pb.animationName + '|' + (pb.content !== 'none' ? 'on' : 'off'),
      after: pa.opacity + '|' + pa.animationName + '|' + (pa.content !== 'none' ? 'on' : 'off'),
      vis: r.width > 1 && cs.visibility !== 'hidden' && cs.display !== 'none' && go > 0.01 };
  };
  const clear = async () => {
    await p.mouse.move(4, H - 4);
    await p.evaluate(() => document.activeElement && document.activeElement.blur && document.activeElement.blur());
    await p.waitForTimeout(520);
  };
  const measure = async (sel, state) => {
    const pre = await p.evaluate(READ, sel);
    if (!pre) return { skip: 'NO MATCH' };
    if (!pre.vis) return { meta: pre, skip: 'not visible' };
    await clear();
    if (state === 'hover') { await p.mouse.move(pre.rect.x + pre.rect.w * MX, pre.rect.y + pre.rect.h * MY); await p.waitForTimeout(1250); }
    else if (state === 'focus') {
      await p.keyboard.press('Tab');
      await p.evaluate((s) => document.querySelector(s).focus({ preventScroll: true }), sel);
      await p.waitForTimeout(700);
    }
    // computed style is read AFTER the state has settled: this IS the browser's cascade winner
    const meta = await p.evaluate(READ, sel);
    const box = meta.ink;
    const clip = { x: box.x, y: box.y, width: Math.min(box.w, W - box.x), height: Math.min(box.h, H - box.y) };
    if (clip.width < 2 || clip.height < 2 || box.y < 0 || box.y + box.h > H) return { meta, skip: 'ink box off screen' };
    const a1 = await shot(clip);
    await paint(sel, 'transparent'); await p.waitForTimeout(150);
    const a2 = await shot(clip);
    await paint(sel, '#ffffff'); await p.waitForTimeout(150);
    const a3 = await shot(clip);
    await unpaint(sel);
    const r = await analyse(a1, a2, a3, meta.color, meta.go);
    return { meta, r };
  };

  // ---- variant loop ------------------------------------------------------
  for (const cand of CANDS) {
    await p.evaluate(() => { const s = document.getElementById('cand-css'); if (s) s.remove(); });
    if (cand !== 'shipped') {
      const css = fs.readFileSync(cand, 'utf8');
      await p.evaluate((c) => { const s = document.createElement('style'); s.id = 'cand-css'; s.textContent = c; document.head.appendChild(s); }, css);
    }
    await p.waitForTimeout(700);
    console.log(`\n--- ${cand === 'shipped' ? 'SHIPPED' : cand} ---`);
    for (const sel of SEL) {
      for (const state of STATES) {
        const { meta, r, skip } = await measure(sel, state);
        if (!meta) { console.log(`  ${sel} ${state}: ${skip || 'NO MATCH'}`); continue; }
        if (skip) { console.log(`  ${sel} ${state}: ${skip}`); continue; }
        const tag = `${sel} [${state}]`.padEnd(42);
        const g = meta.rect;
        console.log(`  ${tag} rendered med ${f2(r.med)} p10 ${f2(r.p10)} min ${f2(r.min)}`
          + `   NOMINAL med ${f2(r.nom && r.nom.med)} p10 ${f2(r.nom && r.nom.p10)} min ${f2(r.nom && r.nom.min)}   ${r.px}px`);
        console.log(`     plate-under-label L med ${r.plate.med.toFixed(4)} p05 ${r.plate.p05.toFixed(4)} p95 ${r.plate.p95.toFixed(4)}`
          + ` spread ${(r.plate.p95 - r.plate.p05).toFixed(4)}   ink ${meta.color}  bg ${meta.bg}  bgi ${meta.bgi}`
          + `   box ${g.w.toFixed(1)}x${g.h.toFixed(1)}`);
        if (!r.px) { console.log(`     (no ink coverage found - contrast unreadable by this method here)`); continue; }
        console.log(`     med ink rgb(${r.medInk.join(' ')}) on rgb(${r.medBg.join(' ')})`
          + `  worst ink rgb(${r.worstInk.join(' ')}) on rgb(${r.worstBg.join(' ')})`
          + `   ::before ${meta.before}  ::after ${meta.after}  tr ${meta.tr}`
          + `   hov=${meta.hov} fv=${meta.fv}  bt ${meta.bt} bb ${meta.bb}`);
      }
      if (STATES.includes('focus')) {
        const rs = await ringStats(sel, 9);
        if (rs && rs.nR) {
          console.log(`     FOCUS OUTLINE (pixels outside the border box only): ${rs.nR}px changed outside, ${rs.nInside}px changed inside`);
          console.log(`        outline L med ${rs.ringL.toFixed(4)} (min ${rs.ringMin.toFixed(4)} max ${rs.ringMax.toFixed(4)})`
            + `  surround L med ${rs.adjL.toFixed(4)} p10 ${rs.adjP10.toFixed(4)} p90 ${rs.adjP90.toFixed(4)}`);
          console.log(`        SC 1.4.11 vs median surround ${f2(rs.ratio)}:1   p10 of per-pixel ratios ${f2(rs.rP10)}:1`
            + `   surround pixels under 3:1 = ${(rs.pctBelow3 * 100).toFixed(1)}% of ${rs.nAdj}`
            + `   ${rs.o}  :focus-visible=${rs.fv}`);
        } else if (rs) console.log(`     FOCUS OUTLINE: NO PIXELS CHANGED OUTSIDE THE BORDER BOX (${rs.nInside} changed inside)  :focus-visible=${rs.fv}  ${rs.o}`);
      }
      if (process.env.BANDS) {
        const bd = await bands(sel);
        if (bd) console.log(`     BOUNDARY: interior L ${bd.iL.toFixed(4)}  border L ${bd.bL.toFixed(4)}  exterior L ${bd.eL.toFixed(4)}`
          + `   border-vs-interior ${f2(bd.borderVsIn)}:1  border-vs-exterior ${f2(bd.borderVsEx)}:1  interior-vs-exterior ${f2(bd.inVsEx)}:1`);
      }
    }
  }
  await b.close();
})().catch((e) => { console.error('FAILED', e.message); process.exit(1); });
