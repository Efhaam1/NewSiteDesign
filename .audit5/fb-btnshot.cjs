// Crops of the chrome and the buttons, rest and hovered, at one act. Written so the
// founder can look at the thing rather than read numbers about it.
// usage: node .audit5/fb-btnshot.cjs <tag> <w> <h> [act] [t]
const PW = 'C:/Users/MUS/CurriculumWebsite/node_modules/playwright';
const { chromium } = require(PW);
const fs = require('fs');
const [TAG, W, H] = [process.argv[2] || 'fb', Number(process.argv[3] || 1440), Number(process.argv[4] || 900)];
const ACT = process.argv[5] === undefined ? null : Number(process.argv[5]);
const T = Number(process.argv[6] || 0.02);
const OUT = 'shots';
fs.mkdirSync(OUT, { recursive: true });

(async () => {
  const br = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=gl', '--enable-unsafe-swiftshader',
    '--ignore-gpu-blocklist', '--enable-gpu-rasterization'] });
  const p = await br.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 2 });
  await p.goto('http://127.0.0.1:4321/', { waitUntil: 'load' });
  await p.waitForTimeout(2600);
  if (ACT !== null) {
    await p.evaluate(({ i, f }) => { const a = window.__w.engine.acts[i]; scrollTo({ top: Math.round(a.top + a.len * f), behavior: 'instant' }); }, { i: ACT, f: T });
    await p.waitForTimeout(1600);
  }
  const shot = (name, sel, pad = 14) => p.evaluate((s) => {
    const e = document.querySelector(s); if (!e) return null;
    const r = e.getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height };
  }, sel).then(async (b) => {
    if (!b) return console.log('  missing', sel);
    const clip = { x: Math.max(0, b.x - pad), y: Math.max(0, b.y - pad),
      width: Math.min(b.w + pad * 2, W - Math.max(0, b.x - pad)),
      height: Math.min(b.h + pad * 2, H - Math.max(0, b.y - pad)) };
    await p.screenshot({ clip, path: `${OUT}/${TAG}-${name}.png` });
    console.log('  wrote', `${OUT}/${TAG}-${name}.png`, Math.round(clip.width) + 'x' + Math.round(clip.height));
  });

  await shot('nav', '#nav', 0);
  await shot('ctarow', '.hero .cta-row', 16);
  await p.hover('.hero .cta:not(.ghost)'); await p.waitForTimeout(700);
  await shot('cta-hover', '.hero .cta-row', 16);
  await p.hover('.hero .cta.ghost'); await p.waitForTimeout(700);
  await shot('ghost-hover', '.hero .cta-row', 16);
  await p.mouse.move(4, H - 4); await p.waitForTimeout(500);
  await shot('kicker', '.hero .kicker', 10);
  await br.close();
})();
