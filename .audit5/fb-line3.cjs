// fb-line3.cjs — every string in the candidate set, placed on LINE 3, against the pawn.
// Line 3 is the only band with the pawn in it, so this is the eligibility test: which strings
// may legally close the headline, and which overlap the piece. Verifies the candidates' own
// rejected-ordering numbers too.
const PW = 'C:/Users/MUS/CurriculumWebsite/node_modules/playwright';
const { chromium } = require(PW);
const WINDOWS = [[1440, 900], [1600, 950]];
const S = [
  'Every table.', 'Every class.', 'Every coach.', 'Every week.', 'Every time.', 'Same hour.',
  'Go teach.', 'One answer.', 'Unwritten.', 'Again.', 'Only taught.', 'No record.', 'Not yours.',
  'One Friday.', 'In one head.', 'Same session.', 'One standard.', 'Your standard.',
  'Walk in ready.', 'Any coach.', 'Any table.', 'Hire Monday.', 'Teach Tuesday.', 'Ask any coach.',
  'Any Tuesday.', 'No Sunday prep.', 'No improvising.', 'Second month.', 'Twentieth year.',
  'Set the roster.', 'Not the lesson.', 'The standard.', 'Every Sunday.', 'From scratch.',
  'The hour.', 'Never written.', 'Last Tuesday.', 'Table 4.', 'A parent asks.', 'You improvise.',
  'One coach.', 'Three groups.', 'The lesson.', 'Not any more.', 'Now on paper.', 'Now written.',
  'to promotion.',
];
(async () => {
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=gl', '--enable-unsafe-swiftshader'] });
  for (const [W, H] of WINDOWS) {
    const p = await b.newPage({ viewport: { width: W, height: H } });
    await p.goto('http://127.0.0.1:4321/', { waitUntil: 'load' });
    await p.waitForTimeout(2600);
    // pawn's left silhouette edge in the line-3 band (lum>100), h1 hidden — the pawn.cjs method
    const band = await p.evaluate(() => {
      const e = [...document.querySelectorAll('.hero .d1 .ln i')][2];
      const rg = document.createRange(); rg.selectNodeContents(e);
      const rs = [...rg.getClientRects()];
      const k = rs.reduce((a, x) => ({ t: Math.min(a.t, x.top), b: Math.max(a.b, x.bottom),
        r: Math.max(a.r, x.right) }), { t: 1e9, b: -1e9, r: -1e9 });
      const h = k.b - k.t;
      return { xT: k.t + h * 0.34, xB: k.t + h * 0.79, inkR: k.r };
    });
    await p.evaluate(() => { document.querySelector('.hero .d1').style.visibility = 'hidden'; });
    await p.waitForTimeout(150);
    const png = (await p.screenshot()).toString('base64');
    await p.evaluate(() => { document.querySelector('.hero .d1').style.visibility = ''; });
    const edge = await p.evaluate(async ({ png, band }) => {
      const bin = atob(png); const u = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i);
      const bmp = await createImageBitmap(new Blob([u], { type: 'image/png' }));
      const c = new OffscreenCanvas(bmp.width, bmp.height); const cx = c.getContext('2d');
      cx.drawImage(bmp, 0, 0);
      const d = cx.getImageData(0, 0, bmp.width, bmp.height).data;
      const sx = bmp.width / innerWidth, sy = bmp.height / innerHeight;
      const y0 = Math.round(band.xT * sy), y1 = Math.round(band.xB * sy);
      for (let x = Math.round(band.inkR * sx); x < bmp.width; x++) {
        for (let y = y0; y <= y1; y++) {
          const i = (y * bmp.width + x) * 4;
          if (0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2] > 100) return Math.round((x / sx) * 10) / 10;
        }
      }
      return null;
    }, { png, band });
    const rows = [];
    for (const s of S) {
      const r = await p.evaluate((t) => {
        const e = [...document.querySelectorAll('.hero .d1 .ln i')][2];
        e.textContent = t;
        document.body.getBoundingClientRect();
        const rg = document.createRange(); rg.selectNodeContents(e);
        const rs = [...rg.getClientRects()].filter((x) => x.height > 1);
        return { rects: rs.length, inkR: Math.round(Math.max(...rs.map((x) => x.right)) * 10) / 10,
          w: Math.round((Math.max(...rs.map((x) => x.right)) - Math.min(...rs.map((x) => x.left))) * 10) / 10 };
      }, s);
      rows.push([s, [...s].length, r.w, r.inkR, Math.round((edge - r.inkR) * 10) / 10]);
    }
    rows.sort((a, b2) => b2[4] - a[4]);
    console.log(`\n=== ${W}x${H}   pawn left edge (lum>100) in the line-3 band: x ${edge}`);
    console.log('    clearance  chars  ink w    inkR    string');
    for (const [s, n, w, r, c] of rows) {
      console.log(`    ${String(c).padStart(8)}px ${String(n).padStart(5)}  ${String(w).padStart(7)}  ${String(r).padStart(7)}  "${s}"${c < 0 ? '   <-- OVERLAPS THE PAWN' : (c < 20 ? '   <-- under 20px' : '')}`);
    }
    await p.close();
  }
  await b.close();
})().catch((e) => { console.error('FAILED', e.message); process.exit(1); });
