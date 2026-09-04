// The same plate on the paper ground (act 6) and through the tonal crossover, where
// --fg and --fg-inv meet and the shipped chip had no shape at all.
const PW = 'C:/Users/MUS/CurriculumWebsite/node_modules/playwright';
const { chromium } = require(PW);
const fs = require('fs'); fs.mkdirSync('shots', { recursive: true });
const lin = (c) => { c /= 255; return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); };
const L = (r, g, b) => 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
const ratio = (a, b) => (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
const JOBS = [['paper', 6, 0.55, '.rate-cta .cta:not(.ghost)'], ['paper-ghost', 6, 0.55, '.rate-cta .cta.ghost'],
  ['cross', 6, 0.925, '#nav .cta'], ['promo', 7, 0.45, '.promo-cta .cta:not(.ghost)']];
(async () => {
  const br = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=gl', '--enable-unsafe-swiftshader'] });
  for (const [tag, act, t, sel] of JOBS) {
    const p = await br.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 3 });
    await p.goto('http://127.0.0.1:4321/', { waitUntil: 'load' });
    await p.waitForTimeout(2600);
    await p.evaluate(({ i, f }) => { const a = window.__w.engine.acts[i]; scrollTo({ top: Math.round(a.top + a.len * f), behavior: 'instant' }); }, { i: act, f: t });
    await p.waitForTimeout(1700);
    const b = await p.evaluate((s) => { const e = document.querySelector(s); if (!e) return null;
      const r = e.getBoundingClientRect(); const cs = getComputedStyle(e);
      return { x: r.x, y: r.y, w: r.width, h: r.height, colour: cs.color, vis: cs.visibility,
        paper: document.body.classList.contains('is-paper') }; }, sel);
    if (!b || b.w < 4) { console.log(tag, sel, 'MISSING/HIDDEN'); await p.close(); continue; }
    const b64 = (await p.screenshot({ clip: { x: b.x + 1, y: b.y + 1, width: b.w - 2, height: b.h - 2 } })).toString('base64');
    const st = await p.evaluate(async (d) => {
      const img = new Image(); await new Promise((r) => { img.onload = r; img.src = 'data:image/png;base64,' + d; });
      const c = document.createElement('canvas'); c.width = img.width; c.height = img.height;
      const g = c.getContext('2d'); g.drawImage(img, 0, 0);
      const px = g.getImageData(0, 0, c.width, c.height).data; const out = [];
      for (let i = 0; i < px.length; i += 4) out.push([px[i], px[i + 1], px[i + 2]]);
      return out;
    }, b64);
    const lums = st.map((c) => L(c[0], c[1], c[2])).sort((a, z) => a - z);
    const q = (f) => lums[Math.floor((lums.length - 1) * f)];
    const ink = b.colour.match(/\d+/g).map(Number); const inkL = L(ink[0], ink[1], ink[2]);
    console.log(tag.padEnd(12) + ' act' + act + ' t' + t + ' paper=' + b.paper + '  ' + sel);
    console.log('   plate L p02/p55/p98 ' + [q(0.02), q(0.55), q(0.98)].map((v) => v.toFixed(4)).join(' / ') +
      '   spread ' + (q(0.98) - q(0.02)).toFixed(4) + '   label ' + b.colour + ' vs plate p55: ' + ratio(inkL, q(0.55)).toFixed(2) + ':1');
    await p.screenshot({ clip: { x: Math.max(0, b.x - 12), y: Math.max(0, b.y - 12), width: b.w + 24, height: b.h + 24 },
      path: 'shots/fb-' + tag + '.png' });
    await p.close();
  }
  await br.close();
})();
