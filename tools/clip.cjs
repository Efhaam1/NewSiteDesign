// What is being cut off, and where? Walks every act at a given viewport, parks
// the scroll mid-pin, and reports every visible element whose box escapes the
// window. Bottom-clipping is the failure mode this page has had twice, so it is
// worth asserting rather than eyeballing.
// usage: node tools/clip.cjs <w> <h> [fracs]
const PW = 'C:/Users/MUS/CurriculumWebsite/node_modules/playwright';
const { chromium } = require(PW);
const W = Number(process.argv[2] || 1440), H = Number(process.argv[3] || 900);
const FRACS = (process.argv[4] || '0.5,0.8').split(',').map(Number);

(async () => {
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=gl', '--enable-unsafe-swiftshader'] });
  const p = await b.newPage({ viewport: { width: W, height: H } });
  const errs = [];
  p.on('pageerror', (e) => errs.push('PAGEERROR ' + e.message));
  p.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); });
  await p.goto('http://127.0.0.1:4321/', { waitUntil: 'load' });
  await p.waitForTimeout(2600);

  const acts = await p.evaluate(() =>
    [...document.querySelectorAll('.act')].map((a) => a.dataset.act));
  const out = [];
  for (const name of acts) {
    for (const f of FRACS) {
      await p.evaluate(([n, frac]) => {
        const a = document.querySelector(`[data-act="${n}"]`);
        const top = a.getBoundingClientRect().top + scrollY;
        const len = Math.max(1, a.offsetHeight - innerHeight);
        window.scrollTo(0, Math.round(top + len * frac));
      }, [name, f]);
      await p.waitForTimeout(1300);
      const bad = await p.evaluate((n) => {
        const act = document.querySelector(`[data-act="${n}"]`);
        const pad = act.querySelector('.pad');
        if (!pad) return { skip: 'no pad' };
        const vis = (el) => {
          const cs = getComputedStyle(el);
          if (cs.display === 'none' || cs.visibility === 'hidden') return false;
          return Number(cs.opacity) > 0.06;
        };
        if (!vis(act.querySelector('.act-stage')) || !vis(pad)) return { hidden: true };
        const hits = [];
        // leaf-ish elements only: a clipped container is reported through the
        // deepest thing that is actually cut, which is what needs the fix
        for (const el of pad.querySelectorAll('*')) {
          if (!vis(el)) continue;
          if (el.children.length && el.textContent.trim().length > 240) continue;
          const r = el.getBoundingClientRect();
          if (r.height < 3 || r.width < 3) continue;
          const overBottom = Math.round(r.bottom - innerHeight);
          const overRight = Math.round(r.right - innerWidth);
          if (overBottom > 2 || overRight > 2) {
            const id = el.tagName.toLowerCase()
              + (el.className && typeof el.className === 'string' ? '.' + el.className.trim().split(/\s+/).join('.') : '');
            hits.push({ el: id.slice(0, 64), overBottom, overRight,
              txt: el.textContent.trim().replace(/\s+/g, ' ').slice(0, 46) });
          }
        }
        // keep the worst few, deduped by selector
        const seen = new Set(), keep = [];
        hits.sort((a, b) => (b.overBottom + b.overRight) - (a.overBottom + a.overRight));
        for (const h of hits) { if (seen.has(h.el)) continue; seen.add(h.el); keep.push(h); if (keep.length >= 6) break; }
        return { count: hits.length, worst: keep };
      }, name);
      if (bad && bad.count) out.push({ act: name, frac: f, ...bad });
      else if (bad && bad.skip) out.push({ act: name, frac: f, note: bad.skip });
    }
  }
  console.log(JSON.stringify({ viewport: [W, H], clipped: out }, null, 1));
  if (errs.length) console.log('ERRORS: ' + [...new Set(errs)].slice(0, 5).join(' | '));
  await b.close();
})().catch((e) => { console.error('FAILED', e.message); process.exit(1); });
