// The height budget of one container: its own box, and every descendant that contributes a
// row, with optional candidate CSS injected first. Written for P1b's last residual, where
// the question stopped being "does it clip" and became "what is the 21px made of".
//
// usage: node .audit5/anat.cjs <w> <h> <act> <frac> <container-selector>
//   env: INJECT=path.css   append as a <style> at the end of <head> before measuring
const PW = 'C:/Users/MUS/CurriculumWebsite/node_modules/playwright';
const { chromium } = require(PW);
const fs = require('fs');
const [W, H, ACT, FRAC] = process.argv.slice(2, 6).map(Number);
const SEL = process.argv[6];
const INJECT = process.env.INJECT ? fs.readFileSync(process.env.INJECT, 'utf8') : '';

(async () => {
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=gl', '--enable-unsafe-swiftshader'] });
  const p = await b.newPage({ viewport: { width: W, height: H } });
  await p.goto('http://127.0.0.1:4321/', { waitUntil: 'load' });
  await p.waitForTimeout(2300);
  await p.evaluate(({ act, frac }) => {
    const a = window.__w.engine.acts[act];
    scrollTo({ top: Math.round(a.top + a.len * frac), behavior: 'instant' });
  }, { act: ACT, frac: FRAC });
  await p.waitForTimeout(700);
  const out = await p.evaluate(({ sel, inject }) => {
    if (inject) {
      const el = document.createElement('style'); el.textContent = inject; document.head.appendChild(el);
    }
    const c = document.querySelector(sel);
    if (!c) return { err: 'no match' };
    const cs = getComputedStyle(c);
    const rows = [];
    for (const ch of c.children) {
      const s = getComputedStyle(ch);
      const r = ch.getBoundingClientRect();
      const kids = [...ch.children].map((k) => {
        const kr = k.getBoundingClientRect();
        return `${k.className || k.tagName}:${Math.round(kr.height)}`;
      });
      rows.push({
        cls: ch.className || ch.tagName,
        h: Math.round(r.height * 10) / 10,
        pad: s.paddingTop + '/' + s.paddingBottom,
        fs: s.fontSize,
        lh: s.lineHeight,
        kids: kids.join(' '),
        text: (ch.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 48),
      });
    }
    return {
      box: Math.round(c.getBoundingClientRect().height * 10) / 10,
      client: c.clientHeight,
      scroll: c.scrollHeight,
      over: c.scrollHeight - c.clientHeight,
      rowGap: cs.rowGap, pad: cs.paddingTop + '/' + cs.paddingBottom,
      alignContent: cs.alignContent,
      rows,
    };
  }, { sel: SEL, inject: INJECT });
  console.log(`\n${W}x${H} act ${ACT} t=${FRAC}  ${SEL}${INJECT ? '  [candidate injected]' : ''}`);
  if (out.err) { console.log('  ' + out.err); await b.close(); return; }
  console.log(`  box ${out.box}  client ${out.client}  scroll ${out.scroll}  OVER ${out.over}`);
  console.log(`  row-gap ${out.rowGap}  padding ${out.pad}  align-content ${out.alignContent}`);
  for (const r of out.rows) {
    console.log(`   ${String(r.h).padStart(6)}  ${r.cls}   pad ${r.pad}  ${r.fs}/${r.lh}`);
    if (r.kids) console.log(`           kids: ${r.kids}`);
    console.log(`           "${r.text}"`);
  }
  await b.close();
})().catch((e) => { console.error('FAILED', e.message); process.exit(1); });
