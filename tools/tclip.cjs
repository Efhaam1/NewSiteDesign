// Does every cut panel on /teach say so, and does it stop saying so when it is no longer
// cut? The route caps three boxes and fades the foot of whichever one is genuinely
// overflowing (teach.css:215-218, driven by markScrollers). This checks the verdict
// against the geometry, and - the part that needed a tool - checks it after a resize with
// no interaction in between, which is where it used to go stale.
//
// usage: node tools/tclip.cjs [session]
//        node tools/tclip.cjs            three sizes, default session
//        node tools/tclip.cjs S115       the 185-word core explanation
//
// Prints per panel: client/scroll height, the overflow, whether `.clipped` is on, whether
// a mask is actually painted, and MISMATCH if the class disagrees with the geometry.
const PW = 'C:/Users/MUS/CurriculumWebsite/node_modules/playwright';
const { chromium } = require(PW);
const SESSION = process.argv[2] || '';
const BEAT = Number(process.argv[3] || 0);   // how many times to press t-next first
const SIZES = [[1440, 900], [1244, 620], [1440, 900], [1920, 1080], [390, 844]];

(async () => {
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=gl', '--enable-unsafe-swiftshader'] });
  const p = await b.newPage({ viewport: { width: SIZES[0][0], height: SIZES[0][1] } });
  const errs = [];
  p.on('pageerror', (e) => errs.push('PAGEERROR ' + e.message));
  await p.goto('http://127.0.0.1:4321/teach' + (SESSION ? '?s=' + SESSION : ''), { waitUntil: 'load' });
  await p.waitForTimeout(1200);
  for (let i = 0; i < BEAT; i++) { await p.click('.t-next'); await p.waitForTimeout(240); }
  console.log(`\n/teach${SESSION ? '?s=' + SESSION : ''}   (one page load; every size after the first is a resize with no interaction)`);
  for (const [w, h] of SIZES) {
    await p.setViewportSize({ width: w, height: h });
    await p.waitForTimeout(700);
    const rows = await p.evaluate(() => ['.t-focus', '.t-sol-body', '.t-caption'].map((sel) => {
      const e = document.querySelector(sel);
      if (!e) return { sel, missing: true };
      const cs = getComputedStyle(e);
      const over = e.scrollHeight - e.clientHeight;
      const masked = (cs.maskImage && cs.maskImage !== 'none')
        || (cs.webkitMaskImage && cs.webkitMaskImage !== 'none');
      return { sel, ch: e.clientHeight, sh: e.scrollHeight, over,
        cut: over > 1, clipped: e.classList.contains('clipped'), masked: !!masked,
        hidden: e.hidden || cs.display === 'none' || e.clientHeight === 0,
        words: (e.textContent || '').trim().split(/\s+/).filter(Boolean).length };
    }));
    console.log(`  ${w}x${h}`);
    for (const r of rows) {
      if (r.missing) { console.log(`    ${r.sel.padEnd(13)} NOT IN DOM`); continue; }
      if (r.hidden) { console.log(`    ${r.sel.padEnd(13)} not rendered (hidden / 0px)`); continue; }
      const bad = r.cut !== r.clipped || r.clipped !== r.masked;
      console.log(`    ${r.sel.padEnd(13)} ${String(r.ch).padStart(4)}/${String(r.sh).padStart(4)}px`
        + ` over ${String(r.over).padStart(3)}  cut ${r.cut ? 'YES' : 'no '}  .clipped ${r.clipped ? 'YES' : 'no '}`
        + `  mask ${r.masked ? 'YES' : 'no '}  ${r.words}w   ${bad ? '<<< MISMATCH' : 'ok'}`);
    }
  }
  if (errs.length) console.log('  ERRORS: ' + [...new Set(errs)].join(' | '));
  await b.close();
})().catch((e) => { console.error('FAILED', e.message); process.exit(1); });
