// dump the full rendered text of one act at one scroll position, element by element
const PW = 'C:/Users/MUS/CurriculumWebsite/node_modules/playwright';
const { chromium } = require(PW);
const ACT = process.argv[2] || 'threshold';
const T = Number(process.argv[3] || 0.5);
const W = Number(process.argv[4] || 1440), H = Number(process.argv[5] || 900);
(async () => {
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=gl', '--enable-unsafe-swiftshader'] });
  const p = await b.newPage({ viewport: { width: W, height: H } });
  await p.goto('http://127.0.0.1:4321/', { waitUntil: 'load' });
  await p.waitForTimeout(2800);
  await p.evaluate(([act, frac]) => {
    const a = document.querySelector(`[data-act="${act}"]`);
    const top = a.getBoundingClientRect().top + scrollY;
    const len = Math.max(1, a.offsetHeight - innerHeight);
    window.scrollTo(0, Math.round(top + len * frac));
  }, [ACT, T]);
  await p.waitForTimeout(1600);
  const out = await p.evaluate((act) => {
    const root = document.querySelector(`[data-act="${act}"]`);
    const lines = [];
    const walk = (n, d) => {
      for (const c of n.childNodes) {
        if (c.nodeType === 3) {
          const t = c.textContent.replace(/\s+/g, ' ').trim();
          if (t) lines.push('  '.repeat(d) + '· ' + t);
        } else if (c.nodeType === 1) {
          if (c.getAttribute('aria-hidden') === 'true' && !c.textContent.trim()) continue;
          const cs = getComputedStyle(c);
          const tag = c.tagName.toLowerCase() + (c.className && typeof c.className === 'string' ? '.' + c.className.trim().split(/\s+/).join('.') : '');
          const flag = (c.hidden ? ' [hidden]' : '') + (cs.display === 'none' ? ' [display:none]' : '') + (cs.visibility === 'hidden' ? ' [vis:hidden]' : '');
          lines.push('  '.repeat(d) + '<' + tag + '>' + flag);
          walk(c, d + 1);
        }
      }
    };
    walk(root, 0);
    return lines.join('\n');
  }, ACT);
  console.log(out);
  await b.close();
})().catch((e) => { console.error('FAILED', e.message); process.exit(1); });
