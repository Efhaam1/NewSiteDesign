// TIMING LENS: exact band values at grid frames, forward then reverse.
const PW = 'C:/Users/MUS/CurriculumWebsite/node_modules/playwright';
const { chromium } = require(PW);
const G = (k) => Math.round((k / 120) * 100000) / 100000;
const FRAMES = [0, 24, 48, 55, 56, 57, 65, 66, 67, 68, 69, 82, 83, 84, 85, 86, 87].map(G);
const read = () => {
  const cs = (s, p) => { const e = document.querySelector(s); return e ? getComputedStyle(e, p || null) : null; };
  const sec = document.querySelector('.act-chaos');
  const ch = document.querySelector('.chaos');
  const v = (n) => getComputedStyle(ch).getPropertyValue(n).trim();
  const op = (s, p) => { const c = cs(s, p); return c ? Number(c.opacity).toFixed(4) : 'x'; };
  const fx = [...document.querySelectorAll('.cv-fx')];
  return {
    t: sec.style.getPropertyValue('--t'),
    ha: v('--ha'), hb: v('--hb'), sa: v('--sa'), sb: v('--sb'),
    pn: v('--pn'), pt: v('--pt'), pf: v('--pf'), px: v('--px'),
    swp: op('.head-swap .sw-p'), sws: op('.head-swap .sw-s'),
    swa: op('.lead-swap .sw-a'), swb: op('.lead-swap .sw-b'),
    brand: op('.cv-brand'), title: op('.cv-title'), claim: op('.cv-claim'),
    plate: op('.cv-one', '::before'), fixbox: op('.cv-fix'),
    fixd: fx.map((e) => e.style.getPropertyValue('--d')).join('/'),
    fx: fx.map((e) => Number(getComputedStyle(e).opacity).toFixed(4)).join(' '),
    open: op('.cv-open'), ft: op('.cv-ft'),
    btop: cs('.cv-fix') ? cs('.cv-fix').borderTopColor + ' ' + cs('.cv-fix').borderTopWidth : 'x',
    brandTf: cs('.cv-brand') ? cs('.cv-brand').transform : 'x',
  };
};
(async () => {
  const b = await chromium.launch({ args: ['--use-gl=angle','--use-angle=gl','--enable-unsafe-swiftshader'] });
  const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
  await p.goto('http://127.0.0.1:4321/', { waitUntil: 'load' });
  await p.waitForTimeout(2600);
  const geo = await p.evaluate(() => { const a = window.__w.engine.acts[1];
    return { top: a.top, len: a.len, h: innerHeight, sh: document.documentElement.scrollHeight }; });
  console.log('act1 top=' + geo.top + ' len=' + geo.len + ' -> 0.001 of t = ' + (geo.len * 0.001).toFixed(2) + 'px');
  const run = async (list, tag) => {
    const out = [];
    for (const t of list) {
      await p.evaluate(({ t }) => { const a = window.__w.engine.acts[1];
        scrollTo({ top: Math.round(a.top + a.len * t), behavior: 'instant' }); }, { t });
      await p.waitForTimeout(700);
      const r = await p.evaluate(read);
      out.push([t, r]);
      console.log(tag + ' req=' + String(t).padEnd(8) + '--t=' + String(r.t).padEnd(7)
        + 'ha=' + r.ha.padEnd(7) + 'hb=' + r.hb.padEnd(7)
        + '| sw-p=' + r.swp + ' sw-s=' + r.sws + ' max=' + Math.max(+r.swp, +r.sws).toFixed(4)
        + ' | sw-a=' + r.swa + ' sw-b=' + r.swb + ' max=' + Math.max(+r.swa, +r.swb).toFixed(4));
      console.log('        '.padEnd(8) + '   pn=' + r.pn.padEnd(7) + 'pt=' + r.pt.padEnd(7) + 'pf=' + r.pf.padEnd(7)
        + 'plate=' + r.plate + ' brand=' + r.brand + ' title=' + r.title + ' claim=' + r.claim
        + ' | fixbox=' + r.fixbox + ' fx=[' + r.fx + '] d=[' + r.fixd + '] open=' + r.open + ' ft=' + r.ft);
      console.log('        '.padEnd(8) + '   .cv-fix border=' + r.btop + '  brand transform=' + r.brandTf);
    }
    return out;
  };
  const fwd = await run(FRAMES, 'F');
  await p.evaluate(() => scrollTo({ top: document.documentElement.scrollHeight, behavior: 'instant' }));
  await p.waitForTimeout(1200);
  const rev = await run([...FRAMES].reverse(), 'R');
  console.log('--- reverse equality ---');
  const keys = ['ha','hb','sa','sb','pn','pt','pf','px','swp','sws','brand','title','fx','plate','open','ft'];
  let bad = 0;
  for (const [t, a] of fwd) {
    const r = rev.find((x) => x[0] === t)[1];
    const diff = keys.filter((k) => String(a[k]) !== String(r[k]));
    if (diff.length) { bad++; console.log('  MISMATCH t=' + t + ' ' + diff.map((k) => k + ': F=' + a[k] + ' R=' + r[k]).join('  ')); }
  }
  console.log(bad ? bad + ' frames differ forward vs reverse' : 'all ' + fwd.length + ' frames identical forward and reverse');
  await b.close();
})();
