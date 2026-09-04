// Screenshot the prototype at a list of scroll fractions.
// usage: node tools/shoot.cjs [tag] [w] [h] [f1,f2,...]
const path = require('path');
const fs = require('fs');
const PW = 'C:/Users/MUS/CurriculumWebsite/node_modules/playwright';
const { chromium } = require(PW);

const tag = process.argv[2] || 'shot';
const W = Number(process.argv[3] || 1440);
const H = Number(process.argv[4] || 900);
const fracs = (process.argv[5] || '0,0.08,0.17,0.26,0.35,0.44,0.53,0.62,0.71,0.8,0.89,0.97')
  .split(',').map(Number);
const OUT = path.join(__dirname, '..', 'shots');
fs.mkdirSync(OUT, { recursive: true });

(async () => {
  const browser = await chromium.launch({
    args: ['--use-gl=angle', '--use-angle=gl', '--enable-unsafe-swiftshader',
           '--ignore-gpu-blocklist', '--enable-gpu-rasterization'],
  });
  const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1,
    reducedMotion: process.env.REDUCED === '1' ? 'reduce' : 'no-preference' });
  const errors = [];
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', (e) => errors.push('PAGEERROR ' + e.message));

  await page.goto('http://127.0.0.1:4321/', { waitUntil: 'load', timeout: 45000 });
  await page.waitForTimeout(2600);

  const ok = await page.evaluate(() => document.body.classList.contains('ready'));
  const h = await page.evaluate(() => document.documentElement.scrollHeight);
  console.log(JSON.stringify({ ready: ok, scrollHeight: h, viewport: [W, H] }));

  for (const f of fracs) {
    await page.evaluate((frac) => {
      const max = document.documentElement.scrollHeight - innerHeight;
      window.scrollTo(0, Math.round(max * frac));
    }, f);
    // let the damped animation values settle to the new scroll position
    await page.waitForTimeout(1500);
    const name = `${tag}-${String(Math.round(f * 100)).padStart(3, '0')}.jpg`;
    await page.screenshot({ path: path.join(OUT, name), quality: 76, type: 'jpeg' });
    process.stdout.write(name + ' ');
  }
  console.log();
  if (errors.length) console.log('CONSOLE ERRORS:\n' + [...new Set(errors)].slice(0, 25).join('\n'));
  else console.log('no console errors');
  await browser.close();
})().catch((e) => { console.error('SHOOT FAILED', e.message); process.exit(1); });
