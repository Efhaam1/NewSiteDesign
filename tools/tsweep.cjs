// Act 7's short-window ladder, measured. One page load per window, both billing
// states, and it reports the two numbers the ladder is built from: how far the
// pinned stage overflows and how far the sheet's lowest ink lands past the fold.
//
// usage: node tools/tsweep.cjs [wide|phone|all] [t]
const PW = 'C:/Users/MUS/CurriculumWebsite/node_modules/playwright';
const { chromium } = require(PW);
const SET = process.argv[2] || 'all';
const T = Number(process.argv[3] || 0.5);
const WIDE = [
  [2560, 1080], [1920, 1080], [1920, 900], [1920, 821], [1920, 661], [1920, 580],
  [1440, 900], [1440, 800], [1440, 700], [1440, 620],
  [1244, 900], [1244, 800], [1244, 700], [1244, 661], [1244, 620],
  [1100, 821], [1100, 720], [1001, 850], [1001, 780], [1001, 721],
  [981, 620], [950, 861], [901, 930], [901, 891], [901, 821], [901, 745], [901, 661], [901, 620],
];
const PHONE = [
  [900, 900], [900, 834], [768, 1024], [600, 900], [412, 915], [390, 900],
  [390, 844], [390, 800], [390, 780], [390, 721], [360, 844], [320, 900], [320, 835],
];
const SIZES = SET === 'wide' ? WIDE : SET === 'phone' ? PHONE : WIDE.concat(PHONE);

(async () => {
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=gl', '--enable-unsafe-swiftshader'] });
  let bad = 0;
  console.log(`\nact 7, t=${T}   ("over" = .act-terms .act-stage scrollHeight - clientHeight;`
    + ` "ink" = lowest ink of the sheet minus the fold)\n`);
  for (const [w, h] of SIZES) {
    const p = await b.newPage({ viewport: { width: w, height: h } });
    await p.goto('http://127.0.0.1:4321/', { waitUntil: 'load', timeout: 45000 });
    await p.waitForTimeout(2400);
    await p.evaluate((t) => {
      const a = window.__w.engine.acts.find((x) => x.name === 'terms');
      scrollTo({ top: Math.round(a.top + a.len * t), behavior: 'instant' });
    }, T);
    await p.waitForTimeout(900);
    const read = () => p.evaluate(() => {
      const st = document.querySelector('.act-terms .act-stage');
      const ink = (e) => {
        if (!e) return null;
        const cs = getComputedStyle(e);
        if (cs.display === 'none' || cs.visibility === 'hidden') return null;
        const rg = document.createRange(); rg.selectNodeContents(e);
        const rs = [...rg.getClientRects()];
        return rs.length ? Math.max(...rs.map((x) => x.bottom)) : e.getBoundingClientRect().bottom;
      };
      const sel = '.rate-band, .rate-band .cta, .rate-cta, .rate-pilot, .rate-led, .rate-cap';
      const low = Math.max(...[...document.querySelectorAll(sel)].map(ink).filter((x) => x !== null), 0);
      const vis = (e) => !!e && e.getBoundingClientRect().height > 2 && getComputedStyle(e).display !== 'none';
      return {
        over: st.scrollHeight - st.clientHeight,
        ink: Math.round(low - innerHeight),
        adds: [...document.querySelectorAll('.rate-adds')].filter(vis).length,
        bands: document.querySelectorAll('.rate-band').length,
        cap: vis(document.querySelector('.rate-cap')),
        ctas: [...document.querySelectorAll('.rate-band .cta')].filter(vis).length,
        micro: vis(document.querySelector('.rate-cta .mono.tiny')),
        clip: [...document.querySelectorAll('.rate-band, .rate-adds, .rate-pilot, .rate-cap')]
          .filter((e) => e.scrollHeight - e.clientHeight > 2 || e.scrollWidth - e.clientWidth > 2)
          .map((e) => e.className.split(' ')[0]),
      };
    });
    const mo = await read();
    await p.evaluate(() => {
      const t = [...document.querySelectorAll('.rate-bill-b')][1];
      if (t && t.getBoundingClientRect().height > 2) t.click();
      else document.querySelector('.rate').classList.add('is-annual');
    });
    await p.waitForTimeout(420);
    const yr = await read();
    const worst = Math.max(mo.over, yr.over, mo.ink, yr.ink);
    const ok = worst <= 0 && mo.adds >= mo.bands && yr.adds >= yr.bands && mo.cap && yr.cap
      && mo.ctas === mo.bands && yr.ctas === yr.bands && mo.micro && yr.micro
      && !mo.clip.length && !yr.clip.length;
    if (!ok) bad++;
    console.log(`  ${String(w).padStart(4)}x${String(h).padStart(4)}  `
      + `mo over ${String(mo.over).padStart(4)} ink ${String(mo.ink).padStart(5)}  |  `
      + `yr over ${String(yr.over).padStart(4)} ink ${String(yr.ink).padStart(5)}  `
      + `adds ${mo.adds}/${mo.bands} cta ${mo.ctas} cap ${mo.cap ? 'y' : 'N'} micro ${mo.micro ? 'y' : 'N'}`
      + `${mo.clip.length || yr.clip.length ? ' CLIP ' + [...new Set(mo.clip.concat(yr.clip))].join(',') : ''}`
      + `   ${ok ? '' : '<<<'}`);
    await p.close();
  }
  console.log(`\n  ${SIZES.length - bad}/${SIZES.length} windows clean\n`);
  await b.close();
})();
