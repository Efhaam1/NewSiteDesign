// Capture the opening seconds: the board assembling before anything is legible.
const PW='C:/Users/MUS/CurriculumWebsite/node_modules/playwright';
const { chromium } = require(PW);
const path=require('path');
(async () => {
  const b = await chromium.launch({ args: ['--use-gl=angle','--use-angle=gl','--enable-unsafe-swiftshader'] });
  const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
  const t0 = Date.now();
  await p.goto('http://127.0.0.1:4321/', { waitUntil: 'commit' });
  const marks = [200, 500, 900, 1400, 2000, 2700, 3600];
  for (const m of marks) {
    const wait = m - (Date.now() - t0);
    if (wait > 0) await p.waitForTimeout(wait);
    await p.screenshot({ path: path.join('shots', `boot-${String(m).padStart(4,'0')}.jpg`), quality: 74, type: 'jpeg' });
    process.stdout.write(m + 'ms ');
  }
  console.log();
  await b.close();
})().catch(e => { console.error('FAILED', e.message); process.exit(1); });
