// Does the 3D pawn still clear the headline? findings.md:23 measured this by SILHOUETTE — h1
// hidden, the pawn's left edge inside the x-height band of the headline's last line — and got
// 15px of clearance at 1440x900, which director.js:42-47 says the -4.3 look-x exists to produce.
// PITCH step 2 replaced the glyphs that measurement was taken against, so it has to be re-run,
// against all three lines and in both copies.
//
// usage: node .audit5/pawn.cjs <w> <h>
const PW = 'C:/Users/MUS/CurriculumWebsite/node_modules/playwright';
const { chromium } = require(PW);
const W = Number(process.argv[2] || 1440), H = Number(process.argv[3] || 900);
const OLD = ['Take a child', 'from a1 ', 'to promotion.'];
const LUMS = [60, 100, 140, 180];

const lines = (p) => p.evaluate(() => {
  const r1 = (n) => Math.round(n * 10) / 10;
  return [...document.querySelectorAll('.hero .d1 .ln i')].map((i) => {
    const rg = document.createRange(); rg.selectNodeContents(i);
    const rs = [...rg.getClientRects()];
    const k = rs.reduce((a, x) => ({ l: Math.min(a.l, x.left), r: Math.max(a.r, x.right),
      t: Math.min(a.t, x.top), b: Math.max(a.b, x.bottom) }), { l: 1e9, r: -1e9, t: 1e9, b: -1e9 });
    // x-height band: the middle 45% of the line box, which is where the lower-case bodies live
    const h = k.b - k.t;
    return { text: i.textContent, inkR: r1(k.r), inkL: r1(k.l),
      xT: r1(k.t + h * 0.34), xB: r1(k.t + h * 0.79) };
  });
});

const scan = async (p, L) => {
  await p.evaluate(() => { document.querySelector('.hero .d1').style.visibility = 'hidden'; });
  await p.waitForTimeout(120);
  const png = (await p.screenshot()).toString('base64');
  await p.evaluate(() => { document.querySelector('.hero .d1').style.visibility = ''; });
  return p.evaluate(async ({ png, L, LUMS }) => {
    const bin = atob(png);
    const u = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i);
    const bmp = await createImageBitmap(new Blob([u], { type: 'image/png' }));
    const c = new OffscreenCanvas(bmp.width, bmp.height);
    const cx = c.getContext('2d');
    cx.drawImage(bmp, 0, 0);
    const d = cx.getImageData(0, 0, bmp.width, bmp.height).data;
    const sx = bmp.width / innerWidth, sy = bmp.height / innerHeight;
    const out = [];
    for (const l of L) {
      const y0 = Math.max(0, Math.round(l.xT * sy)), y1 = Math.min(bmp.height - 1, Math.round(l.xB * sy));
      const cols = [];
      for (let x = 0; x < bmp.width; x++) {
        let m = 0;
        for (let y = y0; y <= y1; y++) {
          const i = (y * bmp.width + x) * 4;
          const lum = 0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2];
          if (lum > m) m = lum;
        }
        cols.push(m);
      }
      const edges = {};
      for (const t of LUMS) {
        // leftmost column at or right of the ink right edge whose max luminance clears t
        const from = Math.round(l.inkR * sx);
        let hit = -1;
        for (let x = from; x < cols.length; x++) if (cols[x] > t) { hit = x; break; }
        edges['L' + t] = hit < 0 ? null : Math.round((hit / sx) * 10) / 10;
      }
      const peak = Math.max(...cols.map((v, i) => (i >= Math.round(l.inkR * sx) ? v : 0)));
      out.push({ text: l.text, inkR: l.inkR, band: [l.xT, l.xB], edges, peakRight: Math.round(peak) });
    }
    return out;
  }, { png, L, LUMS });
};

(async () => {
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=gl', '--enable-unsafe-swiftshader'] });
  const p = await b.newPage({ viewport: { width: W, height: H } });
  await p.goto('http://127.0.0.1:4321', { waitUntil: 'load' });
  await p.waitForTimeout(2800);
  const show = (tag, rows) => {
    for (const r of rows) {
      const cl = (v) => (v === null ? 'none in band' : (Math.round((v - r.inkR) * 10) / 10) + 'px clear (edge x ' + v + ')');
      console.log(`  ${tag} "${r.text}"`.padEnd(30) + ` ink right ${r.inkR}  band y ${r.band[0]}-${r.band[1]}  peak ${r.peakRight}`);
      for (const k of Object.keys(r.edges)) console.log('      lum>' + k.slice(1) + ': ' + cl(r.edges[k]));
    }
  };
  console.log(W + 'x' + H + '  — pawn silhouette against each headline line, h1 hidden');
  show('AFTER ', await scan(p, await lines(p)));
  await p.evaluate((old) => {
    [...document.querySelectorAll('.hero .d1 .ln i')].forEach((el, i) => {
      if (old[i] !== undefined) el.textContent = old[i];
    });
  }, OLD);
  await p.waitForTimeout(150);
  show('BEFORE', await scan(p, await lines(p)));
  await b.close();
})();
