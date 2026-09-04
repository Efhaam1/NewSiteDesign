// (1) does anything in act 1 still MOVE after t = 0.70?  (2) is the .cv-fix hairline real ink?
const PW = 'C:/Users/MUS/CurriculumWebsite/node_modules/playwright';
const { chromium } = require(PW);
const G = (k) => Math.round((k / 120) * 100000) / 100000;
(async () => {
  const b = await chromium.launch({ args: ['--use-gl=angle','--use-angle=gl','--enable-unsafe-swiftshader'] });
  const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
  await p.goto('http://127.0.0.1:4321/', { waitUntil: 'load' });
  await p.waitForTimeout(2600);
  const snap = () => {
    const out = {};
    for (const e of document.querySelectorAll('.act-chaos .chaos, .act-chaos .chaos *')) {
      const cs = getComputedStyle(e);
      const key = (e.className && String(e.className).trim().replace(/\s+/g, '.')) || e.tagName;
      let i = 0, k = key; while (out[k]) k = key + '#' + (++i);
      out[k] = [Number(cs.opacity).toFixed(4), cs.transform,
        Number(getComputedStyle(e, '::before').opacity).toFixed(4),
        getComputedStyle(e, '::before').transform,
        Number(getComputedStyle(e, '::after').opacity).toFixed(4),
        getComputedStyle(e, '::after').transform].join('|');
    }
    return out;
  };
  const at = async (t) => {
    await p.evaluate(({ t }) => { const a = window.__w.engine.acts[1];
      scrollTo({ top: Math.round(a.top + a.len * t), behavior: 'instant' }); }, { t });
    await p.waitForTimeout(650);
    return p.evaluate(snap);
  };
  console.log('=== what changes between consecutive 1/120 frames from t=0.6917 to 0.7583 ===');
  let prev = null, pt = null;
  for (let k = 83; k <= 91; k++) {
    const t = G(k); const s = await at(t);
    if (prev) {
      const d = Object.keys(s).filter((x) => s[x] !== prev[x]);
      console.log(`  ${pt} -> ${t}: ` + (d.length ? d.map((x) => x + ' [' + prev[x] + '] -> [' + s[x] + ']').join('  ;  ') : 'IDENTICAL'));
    }
    prev = s; pt = t;
  }
  // ---- the hairline: A/B the border-top colour and diff the pixels of its own row
  console.log('=== .cv-fix border-top at t=0.42, is it ink over the coach cards? ===');
  await p.evaluate(() => { const a = window.__w.engine.acts[1];
    scrollTo({ top: Math.round(a.top + a.len * 0.42), behavior: 'instant' }); });
  await p.waitForTimeout(1200);
  const box = await p.evaluate(() => { const r = document.querySelector('.cv-fix').getBoundingClientRect();
    return { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width) }; });
  const clip = { x: box.x + 40, y: box.y - 4, width: 400, height: 9 };
  const rowMeans = async (tag) => {
    const buf = await p.screenshot({ clip });
    const png = buf;
    // decode with playwright's own zlib-free path: use sharp-free manual PNG parse via canvas in page
    const b64 = png.toString('base64');
    return p.evaluate(async ({ b64, h, w }) => {
      const img = new Image(); img.src = 'data:image/png;base64,' + b64;
      await img.decode();
      const c = document.createElement('canvas'); c.width = w; c.height = h;
      const g = c.getContext('2d'); g.drawImage(img, 0, 0);
      const d = g.getImageData(0, 0, w, h).data; const rows = [];
      for (let y = 0; y < h; y++) { let s = 0;
        for (let x = 0; x < w; x++) { const i = (y * w + x) * 4; s += 0.2126*d[i] + 0.7152*d[i+1] + 0.0722*d[i+2]; }
        rows.push(+(s / w).toFixed(3)); }
      return rows;
    }, { b64, h: clip.height, w: clip.width });
  };
  const on = await rowMeans('on');
  await p.addStyleTag({ content: '.cv-fix { border-top-color: transparent !important; }' });
  await p.waitForTimeout(500);
  const off = await rowMeans('off');
  console.log('  row luminance means, y = ' + clip.y + '..' + (clip.y + clip.height - 1) + ' (border row is y=' + box.y + ')');
  console.log('  border ON : ' + on.join(' '));
  console.log('  border OFF: ' + off.join(' '));
  console.log('  delta     : ' + on.map((v, i) => (v - off[i]).toFixed(3)).join(' '));
  await b.close();
})();
