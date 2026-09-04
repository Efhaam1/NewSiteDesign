// Label contrast on a .cta in rest / hover / active, over the RENDERED plate, plus the
// plate's own luminance spread so the bevel can be seen in numbers rather than prose.
// usage: node .audit5/fb-btncx.cjs <w> <h> [act] [t]
const PW = 'C:/Users/MUS/CurriculumWebsite/node_modules/playwright';
const { chromium } = require(PW);
const [W, H, ACT, T] = [Number(process.argv[2] || 1440), Number(process.argv[3] || 900),
  process.argv[4] === undefined ? null : Number(process.argv[4]), Number(process.argv[5] || 0.02)];
const lin = (c) => { c /= 255; return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); };
const L = (r, g, b) => 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
const ratio = (a, b) => (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);

(async () => {
  const br = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=gl', '--enable-unsafe-swiftshader'] });
  const p = await br.newPage({ viewport: { width: W, height: H } });
  await p.goto('http://127.0.0.1:4321/', { waitUntil: 'load' });
  await p.waitForTimeout(2500);
  if (ACT !== null) {
    await p.evaluate(({ i, f }) => { const a = window.__w.engine.acts[i]; scrollTo({ top: Math.round(a.top + a.len * f), behavior: 'instant' }); }, { i: ACT, f: T });
    await p.waitForTimeout(1500);
  }
  const SEL = ['.hero .cta:not(.ghost)', '.hero .cta.ghost', '#nav .cta'];
  for (const sel of SEL) {
    const box = await p.evaluate((s) => {
      const e = document.querySelector(s); if (!e) return null;
      const r = e.getBoundingClientRect();
      return { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height),
        colour: getComputedStyle(e).color };
    }, sel);
    if (!box || box.w < 4) { console.log(sel, 'MISSING'); continue; }
    const rows = [];
    for (const state of ['rest', 'hover']) {
      if (state === 'hover') { await p.hover(sel); await p.waitForTimeout(650); }
      const b64 = (await p.screenshot({ clip: { x: box.x, y: box.y, width: box.w, height: box.h } })).toString('base64');
      // Decoded in the page with canvas, the way tools/contrast.cjs does it: no image
      // library on this machine, and the browser is already the reference decoder.
      const px = await p.evaluate(async (d) => {
        const img = new Image();
        await new Promise((r) => { img.onload = r; img.src = 'data:image/png;base64,' + d; });
        const c = document.createElement('canvas');
        c.width = img.width; c.height = img.height;
        c.getContext('2d').drawImage(img, 0, 0);
        return Array.from(c.getContext('2d').getImageData(0, 0, c.width, c.height).data);
      }, b64);
      const lums = [];
      for (let i = 0; i < px.length; i += 4) lums.push({ l: L(px[i], px[i + 1], px[i + 2]) });
      lums.sort((a, b) => a.l - b.l);
      // The plate is the bright majority on a filled button; the label is the dark tail.
      const q = (f) => lums[Math.floor((lums.length - 1) * f)].l;
      const ink = box.colour.match(/\d+/g).map(Number);
      const inkL = L(ink[0], ink[1], ink[2]);
      const plateLo = q(0.55), plateMid = q(0.80), plateHi = q(0.98);
      rows.push({ state, inkL: inkL.toFixed(4),
        plate: [plateLo, plateMid, plateHi].map((v) => v.toFixed(4)).join(' / '),
        worstRatio: ratio(inkL, plateLo).toFixed(2), medRatio: ratio(inkL, plateMid).toFixed(2),
        spread: (plateHi - q(0.02)).toFixed(4) });
    }
    await p.mouse.move(4, H - 4); await p.waitForTimeout(450);
    console.log('\n' + sel + '   ink ' + box.colour + '   box ' + box.w + 'x' + box.h);
    for (const r of rows) console.log('   ' + r.state.padEnd(6) +
      ' plate L p55/p80/p98 ' + r.plate + '   label vs plate: worst ' + r.worstRatio + ':1  median ' + r.medRatio + ':1   plate spread ' + r.spread);
  }
  await br.close();
})();
