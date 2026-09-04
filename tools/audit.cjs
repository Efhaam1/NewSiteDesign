// Component audit. Walks every act at one viewport and reports the defects a
// screenshot argues about but cannot prove: copy clipped inside its own card,
// line-clamped text that is actually truncated, media that is present but not
// playing, copy density per block, and links with no destination.
//
// clip.cjs asks whether a box escapes the window. This asks whether a box
// escapes its own container, which is what `overflow: hidden` hides.
//
// usage: node tools/audit.cjs <w> <h> [outDir]
const PW = 'C:/Users/MUS/CurriculumWebsite/node_modules/playwright';
const { chromium } = require(PW);
const fs = require('fs');
const path = require('path');

const W = Number(process.argv[2] || 1440);
const H = Number(process.argv[3] || 900);
const OUT = path.join(__dirname, '..', process.argv[4] || '.audit5');
const TAG = W + 'x' + H;
const FRACS = [0.25, 0.5, 0.75];

const PROBE = () => {
  const vis = (e) => {
    const b = e.getBoundingClientRect();
    const s = getComputedStyle(e);
    return b.width > 1 && b.height > 1 && s.visibility !== 'hidden' &&
      Number(s.opacity) > 0.06 && b.bottom > -40 && b.top < innerHeight + 40;
  };
  const words = (t) => {
    let n = 0, inW = false;
    for (const ch of t) {
      const sp = ch === ' ' || ch === String.fromCharCode(10) ||
        ch === String.fromCharCode(9) || ch === String.fromCharCode(13);
      if (sp) inW = false;
      else if (!inW) { n++; inW = true; }
    }
    return n;
  };
  const name = (e) => {
    const c = (e.className || '').toString().split(' ').filter(Boolean).slice(0, 2).join('.');
    return e.tagName.toLowerCase() + (c ? '.' + c : '');
  };
  const txt = (e) => (e.textContent || '').trim().slice(0, 90);
  const box = (e) => {
    const b = e.getBoundingClientRect();
    return [Math.round(b.left), Math.round(b.top), Math.round(b.right), Math.round(b.bottom)];
  };

  const innerClip = [], clamped = [], media = [], copy = [], escapes = [];

  for (const e of document.querySelectorAll('main *')) {
    if (!vis(e)) continue;
    const s = getComputedStyle(e);
    const oy = e.scrollHeight - e.clientHeight;
    const ox = e.scrollWidth - e.clientWidth;
    const hides = (p) => p === 'hidden' || p === 'clip' || p === 'auto' || p === 'scroll';
    if ((hides(s.overflowY) && oy > 2) || (hides(s.overflowX) && ox > 2)) {
      innerClip.push({ el: name(e), overY: oy, overX: ox, box: box(e), txt: txt(e) });
    }
    if (s.webkitLineClamp && s.webkitLineClamp !== 'none' && oy > 2) {
      clamped.push({ el: name(e), lines: s.webkitLineClamp, overY: oy, txt: txt(e) });
    }
    const b = e.getBoundingClientRect();
    if (b.bottom > innerHeight + 1 || b.right > innerWidth + 1 || b.left < -1) {
      if (!e.querySelector('*')) {
        escapes.push({ el: name(e), overBottom: Math.round(b.bottom - innerHeight), overRight: Math.round(b.right - innerWidth), txt: txt(e) });
      }
    }
    if (!e.querySelector('*') && e.textContent && e.textContent.trim().length > 24) {
      copy.push({ el: name(e), words: words(e.textContent.trim()), box: box(e), txt: txt(e) });
    }
  }

  for (const v of document.querySelectorAll('video')) {
    media.push({
      kind: 'video', src: (v.currentSrc || v.src || '').split('/').pop(),
      paused: v.paused, readyState: v.readyState, networkState: v.networkState,
      w: v.videoWidth, h: v.videoHeight, t: Number(v.currentTime.toFixed(2)),
      visible: vis(v), box: box(v), preload: v.preload,
      cssHeight: Math.round(v.getBoundingClientRect().height),
      objectFit: getComputedStyle(v).objectFit,
    });
  }
  for (const i of document.querySelectorAll('img')) {
    media.push({ kind: 'img', src: (i.currentSrc || i.src || '').split('/').pop(), broken: i.naturalWidth === 0, visible: vis(i), box: box(i) });
  }

  const links = [...document.querySelectorAll('a[href]')].map((a) => ({
    href: a.getAttribute('href'), txt: txt(a), visible: vis(a),
  }));

  return { innerClip, clamped, media, copy, escapes, links };
};

(async () => {
  fs.mkdirSync(path.join(OUT, 'shots'), { recursive: true });
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=gl', '--enable-unsafe-swiftshader'] });
  const p = await b.newPage({ viewport: { width: W, height: H } });
  const errs = [];
  p.on('pageerror', (e) => errs.push('pageerror: ' + e.message));
  p.on('console', (m) => { if (m.type() === 'error') errs.push(m.text().slice(0, 200)); });
  await p.goto('http://127.0.0.1:4321/', { waitUntil: 'load' });
  await p.waitForTimeout(2600);

  const acts = await p.evaluate(() => window.__w.engine.acts.map((a, i) => ({
    i, name: document.querySelectorAll('.act')[i].dataset.act, top: a.top, len: a.len,
  })));

  const report = { viewport: [W, H], acts: [], errors: errs };
  for (const a of acts) {
    const perAct = { act: a.name, i: a.i, frames: [] };
    for (const f of FRACS) {
      await p.evaluate(({ top, len, f }) => scrollTo({ top: Math.round(top + len * f) }), { top: a.top, len: a.len, f });
      await p.waitForTimeout(650);
      const r = await p.evaluate(PROBE);
      perAct.frames.push({ f, ...r });
      if (f === 0.5) {
        await p.screenshot({ path: path.join(OUT, 'shots', `${TAG}-${a.i}-${a.name}.jpg`), quality: 78, type: 'jpeg' });
      }
    }
    report.acts.push(perAct);
  }

  fs.writeFileSync(path.join(OUT, TAG + '.json'), JSON.stringify(report, null, 1));
  const n = (k) => report.acts.reduce((s, a) => s + a.frames.reduce((t, fr) => t + fr[k].length, 0), 0);
  console.log(`${TAG}: innerClip ${n('innerClip')} · clamped ${n('clamped')} · escapes ${n('escapes')} · errors ${errs.length} -> ${path.relative(process.cwd(), path.join(OUT, TAG + '.json'))}`);
  await b.close();
})();
