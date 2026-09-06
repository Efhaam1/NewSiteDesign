// The product, photographed, and measured in the same pass.
//
// /inside-a-session is a page about the console, so the console has to be ON it — and the
// brief's own rule is a real screenshot, not a prettier fake. This writes two JPEGs into
// app/assets/product/ and prints the bounding box of every element the page annotates, as
// a percentage of the image, so the callouts on that page are positioned from a
// measurement rather than from an eyeball. Re-run it after any change to /teach and paste
// the numbers it prints into tools/pages/session.cjs's CALLS table.
//
//   node tools/shotproduct.cjs
//
// A 1.6x capture at q80: the console is fine mono type, so a 1x capture is soft
// on any modern screen, and a 2x PNG of this viewport is 1.4 MB against 210 KB for the
// same pixels at q92. These pages carry no WebGL and no video precisely so that their
// images can be the heavy thing.
const PW = 'C:/Users/MUS/CurriculumWebsite/node_modules/playwright';
const { chromium } = require(PW);
const fs = require('fs');
const path = require('path');

const W = 1360;
const H = 830;
const OUT = path.join(__dirname, '..', 'app', 'assets', 'product');

// Everything /inside-a-session points a leader at, plus the two the body text names.
const SEL = {
  crumb: '.t-id',
  flow: '.t-flow',
  board: '.t-board',
  beats: '.t-beats',
  focus: '.t-focus',
  answer: '.t-solution',
  clock: '.t-clock',
  views: '.t-views',
  pick: '.t-pick',
  notation: '.t-pos',
  caption: '.t-caption',
  seg: '.t-seg',
};

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const b = await chromium.launch({ args: ['--use-angle=d3d11', '--ignore-gpu-blocklist'] });
  const p = await b.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1.6 });
  const errs = [];
  p.on('pageerror', (e) => errs.push('PAGEERROR ' + e.message));
  p.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); });

  await p.goto('http://127.0.0.1:4321/teach?s=S115', { waitUntil: 'load' });
  await p.waitForTimeout(1800);

  const box = await p.evaluate((sel) => {
    const out = {};
    for (const [k, s] of Object.entries(sel)) {
      const el = document.querySelector(s);
      if (!el) { out[k] = null; continue; }
      const r = el.getBoundingClientRect();
      out[k] = {
        x: +(r.left / innerWidth * 100).toFixed(2),
        y: +(r.top / innerHeight * 100).toFixed(2),
        w: +(r.width / innerWidth * 100).toFixed(2),
        h: +(r.height / innerHeight * 100).toFixed(2),
      };
    }
    return out;
  }, SEL);

  // What the page is allowed to say the console shows, read off the console itself rather
  // than retyped: if /teach's strings change, this prints the new ones.
  const said = await p.evaluate(() => ({
    title: (document.querySelector('.t-title') || {}).textContent,
    crumb: (document.querySelector('.t-crumb') || {}).textContent,
    seg: (document.querySelector('.t-seg') || {}).textContent,
    beat: (document.querySelector('.t-beat-h') || {}).textContent,
    beatTitle: (document.querySelector('.t-beat-title') || {}).textContent,
    caption: (document.querySelector('.t-caption') || {}).textContent,
    hint: (document.querySelector('.t-hint') || {}).textContent,
    reveal: (document.querySelector('.t-reveal') || {}).textContent,
    flow: [...document.querySelectorAll('.t-flow button')].map((x) => x.textContent.replace(/\s+/g, ' ').trim()),
    beats: [...document.querySelectorAll('.t-beats button')].map((x) => x.textContent.replace(/\s+/g, ' ').trim()),
  }));

  await p.screenshot({ path: path.join(OUT, 'console-teach.jpg'), quality: 80, type: 'jpeg' });

  // The prep sheet: the same session as a document, which is what the coach reads before
  // the class rather than during it.
  await p.click('[data-view="prep"]');
  await p.waitForTimeout(700);
  await p.screenshot({ path: path.join(OUT, 'console-prep.jpg'), quality: 80, type: 'jpeg' });
  const prepHeads = await p.evaluate(() =>
    [...document.querySelectorAll('#t-prep h3, #t-prep h2')].map((x) => x.textContent.trim()));

  await b.close();

  console.log('viewport', W + 'x' + H, 'dpr 1.6 ->', Math.round(W * 1.6) + 'x' + Math.round(H * 1.6));
  for (const f of ['console-teach.jpg', 'console-prep.jpg']) {
    console.log('  ' + f.padEnd(20), (fs.statSync(path.join(OUT, f)).size / 1024).toFixed(0) + ' KB');
  }
  console.log('\nCALLS boxes (percent of image):');
  console.log(JSON.stringify(box, null, 1));
  console.log('\nwhat the console actually says:');
  console.log(JSON.stringify(said, null, 1));
  console.log('\nprep sheet sections:');
  console.log(JSON.stringify(prepHeads, null, 1));
  console.log(errs.length ? '\nERRORS: ' + [...new Set(errs)].slice(0, 6).join(' | ') : '\nno console errors');
})().catch((e) => { console.error('FAILED', e.message); process.exit(1); });
