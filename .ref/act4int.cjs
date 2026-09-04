// Does act 4's console actually work? Clicks and keys, and what changed.
const PW = 'C:/Users/MUS/CurriculumWebsite/node_modules/playwright';
const { chromium } = require(PW);
const W = +(process.argv[2] || 1440), H = +(process.argv[3] || 900);
const txt = (p, s) => p.evaluate((s) => {
  const e = document.querySelector(s); return e ? e.textContent.trim() : null; }, s);
(async () => {
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=gl', '--enable-unsafe-swiftshader'] });
  const p = await b.newPage({ viewport: { width: W, height: H } });
  const errs = [];
  p.on('pageerror', (e) => errs.push('PAGEERROR ' + e.message));
  await p.goto('http://127.0.0.1:4321/', { waitUntil: 'load' });
  await p.waitForTimeout(2600);
  await p.evaluate(() => { const a = window.__w.engine.acts[4];
    scrollTo({ top: Math.round(a.top + a.len * 0.30), behavior: 'instant' }); });
  await p.waitForTimeout(1400);
  const out = [];
  const snap = async (tag) => out.push(`${tag}\n    beat ${await txt(p, '.b-head')}\n    fen  ${await txt(p, '.fen-v')}\n    id   ${await txt(p, '.panel-pos .rail-h b')}\n    ans  ${await txt(p, '.panel-answer .rail-h b')}  hidden=${await p.evaluate(() => document.querySelector('.sol-body').hidden)}\n    chip ${await p.evaluate(() => [...document.querySelectorAll('.con-beats button')].findIndex((c) => c.getAttribute('aria-current') === 'true') + 1)}`);
  await snap('0 arrival');
  await p.click('.panel-step .con-go');
  await p.waitForTimeout(400); await snap('1 next position');
  await p.keyboard.press('ArrowLeft');
  await p.waitForTimeout(400); await snap('2 ArrowLeft');
  await p.click('.con-beats button:nth-child(8)');
  await p.waitForTimeout(400); await snap('3 chip 8');
  await p.keyboard.press('r');
  await p.waitForTimeout(400); await snap('4 R');
  out.push('    san  ' + await txt(p, '.sol-body .san'));
  await p.click('.panel-clock .con-go');
  await p.waitForTimeout(1300);
  out.push('5 clock  ' + await txt(p, '.clk b') + '  button=' + await txt(p, '.panel-clock .con-go'));
  await p.click('.con-views button:nth-child(2)');
  await p.waitForTimeout(400);
  out.push('6 prep   open=' + !(await p.evaluate(() => document.querySelector('.prep').hidden))
    + '  teach pressed=' + await p.evaluate(() => document.querySelector('.con-views button').getAttribute('aria-pressed'))
    + '  title=' + await txt(p, '.prep-t'));
  await p.keyboard.press('Escape');
  await p.waitForTimeout(300);
  out.push('7 escape open=' + !(await p.evaluate(() => document.querySelector('.prep').hidden)));
  const y0 = await p.evaluate(() => scrollY);
  await p.keyboard.press('ArrowRight');
  await p.waitForTimeout(300);
  out.push('8 scroll did not move: ' + (await p.evaluate(() => scrollY) === y0));
  console.log(out.join('\n'));
  if (errs.length) console.log('ERRORS:\n' + errs.join('\n')); else console.log('no page errors');
  await b.close();
})().catch((e) => { console.error('FAILED', e.message); process.exit(1); });
