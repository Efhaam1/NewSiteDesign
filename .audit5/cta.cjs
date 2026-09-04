// P3: act 6's licence sheet, its stage and its one filled CTA, in BOTH billing states, across a
// window grid. Mirrors the logic of gate.cjs block 6b (which is phone-only) so the desktop bands
// can be mapped the same way: park act 6 with `behavior: instant`, read the CTA and the micro line
// against the fold and the stage's own overflow, then switch to annual (clicking the toggle when it
// is on screen, forcing `.is-annual` when the short tier has hidden it) and read again.
//
// usage: node .audit5/cta.cjs <widths> <heights>
//   env: FRAC=0.5   INJECT=path.css   KILL=substring (deletes matching @media rules in terms.css)
const PW = 'C:/Users/MUS/CurriculumWebsite/node_modules/playwright';
const { chromium } = require(PW);
const fs = require('fs');
const WIDTHS = (process.argv[2] || '1244').split(',').map(Number);
const HEIGHTS = (process.argv[3] || '661').split(',').map(Number);
const FRAC = Number(process.env.FRAC || 0.5);
const INJECT = process.env.INJECT ? fs.readFileSync(process.env.INJECT, 'utf8') : '';
const KILL = process.env.KILL || '';

const READ = () => {
  const st = document.querySelector('.act-terms .act-stage');
  const c = document.querySelector('.rate-cta .cta');
  const m = document.querySelector('.rate-cta .mono.tiny');
  const ink = (el) => {
    if (!el || getComputedStyle(el).display === 'none') return null;
    const rg = document.createRange(); rg.selectNodeContents(el);
    const rs = [...rg.getClientRects()];
    return rs.length ? Math.round(Math.max(...rs.map((x) => x.bottom))) : Math.round(el.getBoundingClientRect().bottom);
  };
  const r = c ? c.getBoundingClientRect() : null;
  return {
    stageOver: st ? st.scrollHeight - st.clientHeight : null,
    ctaBottom: r ? Math.round(r.bottom) : null,
    ctaTop: r ? Math.round(r.top) : null,
    ctaVis: !!r && r.height > 2 && getComputedStyle(c).display !== 'none',
    micro: ink(m),
    fold: innerHeight,
  };
};

(async () => {
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=gl', '--enable-unsafe-swiftshader'] });
  for (const w of WIDTHS) {
    for (const h of HEIGHTS) {
      const p = await b.newPage({ viewport: { width: w, height: h } });
      await p.goto('http://127.0.0.1:4321/', { waitUntil: 'load' });
      await p.waitForTimeout(2300);
      if (KILL) {
        await p.evaluate((kill) => {
          for (const s of document.styleSheets) {
            if (!(s.href || '').includes('terms.css') && !(s.href || '').includes('annot.css')) continue;
            for (let i = s.cssRules.length - 1; i >= 0; i--) {
              const r = s.cssRules[i];
              if (r.constructor.name === 'CSSMediaRule' && r.conditionText.includes(kill)) s.deleteRule(i);
            }
          }
        }, KILL);
      }
      if (INJECT) await p.addStyleTag({ content: INJECT });
      await p.evaluate(({ frac }) => {
        const a = window.__w.engine.acts[6];
        scrollTo({ top: Math.round(a.top + a.len * frac), behavior: 'instant' });
      }, { frac: FRAC });
      await p.waitForTimeout(700);
      const mo = await p.evaluate(READ);
      const how = await p.evaluate(() => {
        const t = [...document.querySelectorAll('.rate-bill-b')][1];
        if (t && t.getBoundingClientRect().height > 2) { t.click(); return 'clicked'; }
        const rate = document.querySelector('.rate');
        if (rate) rate.classList.add('is-annual');
        return 'forced';
      });
      await p.waitForTimeout(500);
      const yr = await p.evaluate(READ);
      const fmt = (x) => `stage +${x.stageOver} cta ${x.ctaBottom}/${x.fold}${x.ctaVis ? '' : ' HIDDEN'}`
        + (x.micro !== null ? ` micro ${x.micro}` : ' micro -')
        + (x.ctaBottom > x.fold || (x.micro !== null && x.micro > x.fold) || x.stageOver > 2 ? '  <<' : '');
      console.log(`${w}x${h}  monthly: ${fmt(mo)}   |   annual(${how}): ${fmt(yr)}`);
      await p.close();
    }
  }
  await b.close();
})().catch((e) => { console.error('FAILED', e.message); process.exit(1); });
