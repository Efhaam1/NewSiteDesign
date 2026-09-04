// Sweep act 4 (or any act) across a window grid in up to three states in the SAME page
// load: as shipped, with some of this file's own @media rules deleted from the CSSOM
// (ablation = the tree without the fix), and with candidate CSS injected as a <style> at
// the end of <head> (which wins same-specificity ties against every linked sheet).
//
// This is the honest before/after: both columns are real measurements of the same build,
// so nothing is compared against a memory. It is the technique P1b's reviewer used.
//
// usage: node .audit5/inj.cjs <act> <widths> <heights> <selector>...
//   env: FRAC=0.8            scroll fraction through the act (default 0.5)
//        TOL=2               report a box only when it overflows by more than this
//        KILL=821            delete every @media rule in annot.css whose condition
//                            contains this substring, before measuring the ABLATED column
//        INJECT=path.css     append this file as a <style> for the CANDIDATE column
//        ONLY=shipped|ablated|candidate   measure one column only
//
// Prints one line per window per state, and only the selectors over TOL.
const PW = 'C:/Users/MUS/CurriculumWebsite/node_modules/playwright';
const { chromium } = require(PW);
const fs = require('fs');
const ACT = Number(process.argv[2]);
const WIDTHS = (process.argv[3] || '1600').split(',').map(Number);
const HEIGHTS = (process.argv[4] || '860').split(',').map(Number);
const SEL = process.argv.slice(5);
const FRAC = Number(process.env.FRAC || 0.5);
const TOL = Number(process.env.TOL || 2);
const KILL = process.env.KILL || '';
const INJECT = process.env.INJECT ? fs.readFileSync(process.env.INJECT, 'utf8') : '';
const ONLY = process.env.ONLY || '';

const STATES = ['shipped', KILL ? 'ablated' : null, INJECT ? 'candidate' : null]
  .filter(Boolean).filter((s) => !ONLY || s === ONLY);

(async () => {
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=gl', '--enable-unsafe-swiftshader'] });
  for (const w of WIDTHS) {
    for (const h of HEIGHTS) {
      const p = await b.newPage({ viewport: { width: w, height: h } });
      await p.goto('http://127.0.0.1:4321/', { waitUntil: 'load' });
      await p.waitForTimeout(2300);
      await p.evaluate(({ act, frac }) => {
        const a = window.__w.engine.acts[act];
        scrollTo({ top: Math.round(a.top + a.len * frac), behavior: 'instant' });
      }, { act: ACT, frac: FRAC });
      await p.waitForTimeout(700);
      const line = [];
      for (const state of STATES) {
        const r = await p.evaluate(({ sels, tol, state, kill, inject }) => {
          // state changes are applied cumulatively in the order shipped -> ablated -> candidate,
          // and each is undone before the next so the columns stay independent.
          const sheet = [...document.styleSheets].find((s) => (s.href || '').includes('annot.css'));
          const killed = [];
          if (state === 'ablated' && kill) {
            for (let i = sheet.cssRules.length - 1; i >= 0; i--) {
              const rule = sheet.cssRules[i];
              if (rule.constructor.name === 'CSSMediaRule' && rule.conditionText.includes(kill)) {
                killed.push([i, rule.cssText]); sheet.deleteRule(i);
              }
            }
          }
          let el = null;
          if (state === 'candidate' && inject) {
            el = document.createElement('style'); el.id = '__cand'; el.textContent = inject;
            document.head.appendChild(el);
          }
          document.body.getBoundingClientRect();
          const out = [];
          for (const s of sels) {
            for (const e of document.querySelectorAll(s)) {
              const cs = getComputedStyle(e);
              const oy = e.scrollHeight - e.clientHeight;
              const ox = e.scrollWidth - e.clientWidth;
              if (oy > tol || ox > tol) {
                out.push(s + (oy > tol ? ' +' + oy + 'y' : '') + (ox > tol ? ' +' + ox + 'x' : '')
                  + (cs.overflowY === 'hidden' || cs.overflowY === 'clip' || cs.overflow === 'hidden'
                    || cs.overflow === 'clip' ? '' : '(visible)'));
              }
            }
          }
          if (el) el.remove();
          for (const [i, text] of killed.reverse()) sheet.insertRule(text, i);
          return out;
        }, { sels: SEL, tol: TOL, state, kill: KILL, inject: INJECT });
        line.push(`${state}: ${r.join(', ') || 'clean'}`);
      }
      console.log(`${w}x${h}  ${line.join('   |   ')}`);
      await p.close();
    }
  }
  await b.close();
})().catch((e) => { console.error('FAILED', e.message); process.exit(1); });
