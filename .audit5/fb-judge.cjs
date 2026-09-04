// Independent re-measurement of hero-opener candidates, read-only.
// One page load per window; each candidate's three lines are written into the shipped
// .hero .d1 .ln i nodes, measured, and the shipped strings restored.
//
// Measures, per candidate:
//   - gate.cjs assertion 1's OWN condition: `.act-threshold .act-stage` scroll overflow at rest,
//     and the lowest ink of .hero-rule / .ticker against the fold  (pass = over 0 && below <= 0)
//   - h1 box height, per-line client-rect count (rect > 1 per line == no wrap)
//   - line-3 ink right edge, and clearance to the 3D pawn's silhouette in line 3's x-height band
//     (pawn edge found ONCE per window with the h1 hidden, as pawn.cjs does, then reused —
//      the silhouette does not move when the copy changes)
//
// usage: node .audit5/fb-judge.cjs <w>x<h>[,<w>x<h>...] <candidates.json>
const PW = 'C:/Users/MUS/CurriculumWebsite/node_modules/playwright';
const { chromium } = require(PW);
const fs = require('fs');
const WINDOWS = (process.argv[2] || '1440x900').split(',').map((s) => s.split('x').map(Number));
const CANDS = JSON.parse(fs.readFileSync(process.argv[3], 'utf8'));
const LUM = 100; // pawn.cjs's middle threshold

const readLines = () => {
  const r1 = (n) => Math.round(n * 10) / 10;
  return [...document.querySelectorAll('.hero .d1 .ln i')].map((i) => {
    const rg = document.createRange(); rg.selectNodeContents(i);
    const rs = [...rg.getClientRects()].filter((r) => r.height > 1);
    const k = rs.reduce((a, x) => ({ l: Math.min(a.l, x.left), r: Math.max(a.r, x.right),
      t: Math.min(a.t, x.top), b: Math.max(a.b, x.bottom) }), { l: 1e9, r: -1e9, t: 1e9, b: -1e9 });
    const h = k.b - k.t;
    return { text: i.textContent, rects: rs.length, inkL: r1(k.l), inkR: r1(k.r),
      xT: r1(k.t + h * 0.34), xB: r1(k.t + h * 0.79) };
  });
};

const gate1 = () => {
  document.body.getBoundingClientRect();
  const ink = (sel) => {
    const e = document.querySelector(sel);
    if (!e || getComputedStyle(e).display === 'none') return null;
    const rg = document.createRange(); rg.selectNodeContents(e);
    const rs = [...rg.getClientRects()];
    return rs.length ? Math.max(...rs.map((x) => x.bottom)) : e.getBoundingClientRect().bottom;
  };
  const st = document.querySelector('.act-threshold .act-stage');
  const over = st.scrollHeight - st.clientHeight;
  const r = ink('.hero-rule'), t = ink('.ticker');
  const below = Math.max(r === null ? -1e4 : r - innerHeight, t === null ? -1e4 : t - innerHeight);
  return { over, below: Math.round(below * 100) / 100, pass: over === 0 && below <= 0,
    h1: Math.round(document.querySelector('.hero .d1').getBoundingClientRect().height * 10) / 10 };
};

(async () => {
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=gl', '--enable-unsafe-swiftshader'] });
  for (const [W, H] of WINDOWS) {
    const p = await b.newPage({ viewport: { width: W, height: H } });
    await p.goto('http://127.0.0.1:4321/', { waitUntil: 'load' });
    await p.waitForTimeout(2800);
    const SHIPPED = await p.evaluate(() => [...document.querySelectorAll('.hero .d1 .ln i')].map((i) => i.textContent));

    // pawn silhouette: leftmost lit column right of x=0 inside each line's x-height band
    const bands = await p.evaluate(readLines);
    await p.evaluate(() => { document.querySelector('.hero .d1').style.visibility = 'hidden'; });
    await p.waitForTimeout(150);
    const png = (await p.screenshot()).toString('base64');
    await p.evaluate(() => { document.querySelector('.hero .d1').style.visibility = ''; });
    const pawn = await p.evaluate(async ({ png, bands, LUM }) => {
      const bin = atob(png); const u = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i);
      const bmp = await createImageBitmap(new Blob([u], { type: 'image/png' }));
      const c = new OffscreenCanvas(bmp.width, bmp.height); const cx = c.getContext('2d');
      cx.drawImage(bmp, 0, 0);
      const d = cx.getImageData(0, 0, bmp.width, bmp.height).data;
      const sx = bmp.width / innerWidth, sy = bmp.height / innerHeight;
      return bands.map((l) => {
        const y0 = Math.max(0, Math.round(l.xT * sy)), y1 = Math.min(bmp.height - 1, Math.round(l.xB * sy));
        // scan from mid-viewport rightwards: the pawn lives right of the text column
        const from = Math.round((innerWidth * 0.42) * sx);
        for (let x = from; x < bmp.width; x++) {
          for (let y = y0; y <= y1; y++) {
            const i = (y * bmp.width + x) * 4;
            const lum = 0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2];
            if (lum > LUM) return Math.round((x / sx) * 10) / 10;
          }
        }
        return null;
      });
    }, { png, bands, LUM });

    console.log(`\n===== ${W}x${H}   pawn silhouette left edge per line band: ${JSON.stringify(pawn)}`);
    console.log('  over  below   PASS  h1box  rects  L3 inkR  L3 pawn clear   candidate');
    for (const c of [{ id: 'INCUMBENT', l: SHIPPED }, ...CANDS]) {
      await p.evaluate((ls) => {
        [...document.querySelectorAll('.hero .d1 .ln i')].forEach((el, i) => { el.textContent = ls[i]; });
      }, c.l);
      await p.waitForTimeout(220);
      const g = await p.evaluate(gate1);
      const L = await p.evaluate(readLines);
      const clear3 = pawn[2] === null ? null : Math.round((pawn[2] - L[2].inkR) * 10) / 10;
      const wrap = L.map((x) => x.rects).join('');
      console.log(`  ${String(g.over).padStart(4)}  ${String(g.below).padStart(6)}  ${g.pass ? 'PASS' : 'FAIL'}  `
        + `${String(g.h1).padStart(6)}  ${wrap.padEnd(5)}  ${String(L[2].inkR).padStart(7)}  `
        + `${String(clear3).padStart(13)}   ${c.id}  [${c.l.join(' / ')}]`);
    }
    await p.evaluate((ls) => {
      [...document.querySelectorAll('.hero .d1 .ln i')].forEach((el, i) => { el.textContent = ls[i]; });
    }, SHIPPED);
    await p.close();
  }
  await b.close();
})().catch((e) => { console.error('FAILED', e.message); process.exit(1); });
