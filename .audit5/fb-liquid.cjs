// Does the plate's light actually follow the pointer? Hover the SAME button at five
// x-offsets and report the rendered luminance profile across its face, plus a crop each.
const PW = 'C:/Users/MUS/CurriculumWebsite/node_modules/playwright';
const { chromium } = require(PW);
const fs = require('fs'); fs.mkdirSync('shots', { recursive: true });
const lin = (c) => { c /= 255; return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); };
const L = (r, g, b) => 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
const SEL = process.argv[2] || '.hero .cta:not(.ghost)';
(async () => {
  const br = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=gl', '--enable-unsafe-swiftshader'] });
  const p = await br.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
  await p.goto('http://127.0.0.1:4321/', { waitUntil: 'load' });
  await p.waitForTimeout(2600);
  const b = await p.evaluate((s) => { const e = document.querySelector(s); const r = e.getBoundingClientRect();
    return { x: r.x, y: r.y, w: r.width, h: r.height }; }, SEL);
  console.log(SEL, Math.round(b.w) + 'x' + Math.round(b.h));
  for (const f of [0.08, 0.3, 0.5, 0.7, 0.92]) {
    await p.mouse.move(b.x + b.w * f, b.y + b.h * 0.5);
    await p.waitForTimeout(560);
    const vars = await p.evaluate((s) => { const e = document.querySelector(s);
      return [e.style.getPropertyValue('--mx'), e.style.getPropertyValue('--my')]; }, SEL);
    const b64 = (await p.screenshot({ clip: { x: b.x + 2, y: b.y + 2, width: b.w - 4, height: b.h - 4 } })).toString('base64');
    const prof = await p.evaluate(async (d) => {
      const img = new Image();
      await new Promise((r) => { img.onload = r; img.src = 'data:image/png;base64,' + d; });
      const c = document.createElement('canvas'); c.width = img.width; c.height = img.height;
      const g = c.getContext('2d'); g.drawImage(img, 0, 0);
      const px = g.getImageData(0, 0, c.width, c.height).data;
      // one band across the top eighth of the plate, above the label's x-height
      const y = Math.round(c.height * 0.12);
      const out = [];
      for (const fx of [0.06, 0.2, 0.35, 0.5, 0.65, 0.8, 0.94]) {
        const x = Math.round(c.width * fx); const i = (c.width * y + x) << 2;
        out.push([px[i], px[i + 1], px[i + 2]]);
      }
      return out;
    }, b64);
    console.log('  pointer x=' + (f * 100).toFixed(0) + '%  --mx ' + (vars[0] || '(unset)') + ' --my ' + (vars[1] || '(unset)') +
      '   top-band L: ' + prof.map((c) => L(c[0], c[1], c[2]).toFixed(4)).join(' '));
    await p.screenshot({ clip: { x: b.x - 8, y: b.y - 8, width: b.w + 16, height: b.h + 16 },
      path: 'shots/fb-liquid-' + Math.round(f * 100) + '.png' });
  }
  await br.close();
})();
