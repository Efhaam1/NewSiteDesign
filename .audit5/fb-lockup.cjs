// The monogram bakes ~51% dead margin into each axis of its 1254px canvas, so a 36px
// box renders ~17px of ink. This ladders mask-size (which changes NO box, NO layout)
// and shoots the lockup at each step so the choice is made by looking.
const PW = 'C:/Users/MUS/CurriculumWebsite/node_modules/playwright';
const { chromium } = require(PW);
const fs = require('fs'); fs.mkdirSync('shots', { recursive: true });
const SIZES = (process.argv[2] || 'contain,112%,124%,136%,150%').split(',');
(async () => {
  const br = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=gl', '--enable-unsafe-swiftshader'] });
  const p = await br.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 3 });
  await p.goto('http://127.0.0.1:4321/', { waitUntil: 'load' });
  await p.waitForTimeout(2600);
  for (const s of SIZES) {
    await p.evaluate((v) => {
      let st = document.getElementById('fb-lockup');
      if (!st) { st = document.createElement('style'); st.id = 'fb-lockup'; document.head.appendChild(st); }
      st.textContent = `#nav .mark { -webkit-mask-size: ${v}; mask-size: ${v};` +
        ` -webkit-mask-position: 50% 48%; mask-position: 50% 48%; }`;
    }, s);
    await p.waitForTimeout(320);
    // ink bbox of the mark, by alpha, from a 3x crop
    const b = await p.evaluate(() => { const r = document.querySelector('#nav .mark').getBoundingClientRect();
      return { x: r.x, y: r.y, w: r.width, h: r.height }; });
    const b64 = (await p.screenshot({ clip: { x: b.x, y: b.y, width: b.w, height: b.h } })).toString('base64');
    const ink = await p.evaluate(async (d) => {
      const img = new Image(); await new Promise((r) => { img.onload = r; img.src = 'data:image/png;base64,' + d; });
      const c = document.createElement('canvas'); c.width = img.width; c.height = img.height;
      const g = c.getContext('2d'); g.drawImage(img, 0, 0);
      const px = g.getImageData(0, 0, c.width, c.height).data;
      let x0 = 1e9, y0 = 1e9, x1 = -1, y1 = -1, lit = 0;
      for (let y = 0; y < c.height; y++) for (let x = 0; x < c.width; x++) {
        const i = (c.width * y + x) << 2;
        // the bar is near-black; the mark is cream. Threshold on green.
        if (px[i + 1] > 90) { lit++; if (x < x0) x0 = x; if (y < y0) y0 = y; if (x > x1) x1 = x; if (y > y1) y1 = y; }
      }
      return { w: (x1 - x0 + 1) / 3, h: (y1 - y0 + 1) / 3, lit, scale: c.width / 3 };
    }, b64);
    console.log('mask-size ' + s.padEnd(9) + ' ink ' + ink.w.toFixed(1) + 'x' + ink.h.toFixed(1) +
      ' CSS px in a ' + ink.scale.toFixed(0) + 'px box   lit device px ' + ink.lit);
    await p.screenshot({ clip: { x: b.x - 10, y: b.y - 12, width: 290, height: b.h + 24 },
      path: 'shots/fb-lockup-' + s.replace('%', 'pc') + '.png' });
  }
  await br.close();
})();
