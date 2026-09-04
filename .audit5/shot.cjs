// Screenshot one act at one window and scroll fraction, optionally with this item's own
// @media rules deleted from the CSSOM first, so "before" and "after" are two frames of the
// same page load rather than one frame against a memory.
//
// usage: node .audit5/shot.cjs <tag> <w> <h> <act> <frac>
//   env: KILL=substring   delete every @media rule in annot.css whose condition contains it
// writes shots/<tag>-<w>x<h>.png
const path = require('path');
const fs = require('fs');
const PW = 'C:/Users/MUS/CurriculumWebsite/node_modules/playwright';
const { chromium } = require(PW);
const [TAG, W, H, ACT, FRAC] = [process.argv[2] || 'shot', Number(process.argv[3] || 1600),
  Number(process.argv[4] || 821), Number(process.argv[5] || 4), Number(process.argv[6] || 0.5)];
const KILL = process.env.KILL || '';
const OUT = path.join(__dirname, '..', 'shots');
fs.mkdirSync(OUT, { recursive: true });

(async () => {
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=gl', '--enable-unsafe-swiftshader',
    '--ignore-gpu-blocklist', '--enable-gpu-rasterization'] });
  const p = await b.newPage({ viewport: { width: W, height: H } });
  await p.goto('http://127.0.0.1:4321/', { waitUntil: 'load' });
  await p.waitForTimeout(2600);
  if (KILL) {
    const n = await p.evaluate((kill) => {
      const sheet = [...document.styleSheets].find((s) => (s.href || '').includes('annot.css'));
      let k = 0;
      for (let i = sheet.cssRules.length - 1; i >= 0; i--) {
        const r = sheet.cssRules[i];
        if (r.constructor.name === 'CSSMediaRule' && r.conditionText.includes(kill)) { sheet.deleteRule(i); k++; }
      }
      return k;
    }, KILL);
    console.log(`  deleted ${n} @media rules matching "${KILL}"`);
  }
  await p.evaluate(({ act, frac }) => {
    const a = window.__w.engine.acts[act];
    scrollTo({ top: Math.round(a.top + a.len * frac), behavior: 'instant' });
  }, { act: ACT, frac: FRAC });
  await p.waitForTimeout(900);
  const file = path.join(OUT, `${TAG}-${W}x${H}.png`);
  await p.screenshot({ path: file });
  console.log('  wrote ' + file);
  await b.close();
})().catch((e) => { console.error('FAILED', e.message); process.exit(1); });
