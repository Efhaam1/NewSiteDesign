// Press every control the plate work touched, for real, and say what happened.
// tools/interact.cjs still drives the coach dial, which act 1 stopped being on
// 2026-09-05, so it dies at its second assertion; this covers the buttons.
//
// usage: node tools/press.cjs
const PW = 'C:/Users/MUS/CurriculumWebsite/node_modules/playwright';
const { chromium } = require(PW);
const out = [];
const say = (id, ok, detail) => out.push([ok, id, detail]);

(async () => {
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=gl', '--enable-unsafe-swiftshader'] });

  // ---------------------------------------------------------------- the landing page
  const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
  const errs = [];
  p.on('pageerror', (e) => errs.push('PAGEERROR ' + e.message));
  p.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); });
  await p.goto('http://127.0.0.1:4321/', { waitUntil: 'load' });
  await p.waitForTimeout(2600);

  // 1 — the duplicate label in .cta-go must not reach the accessibility tree
  const named = await p.getByRole('link', { name: 'See the ten levels', exact: true }).count();
  say('ghost-has-one-name', named === 1, `${named} link(s) named "See the ten levels"`);

  // 2 — the secondary still goes where it says
  const before = await p.evaluate(() => scrollY);
  await p.click('.hero .cta.ghost');
  await p.waitForTimeout(1600);
  const after = await p.evaluate(() => scrollY);
  const spine = await p.evaluate(() => {
    const a = window.__w.engine.acts.find((x) => x.name === 'spine');
    return a ? Math.round(a.top) : -1;
  });
  say('ghost-navigates', after > before && Math.abs(after - spine) < window_slack(spine),
    `scrollY ${before} -> ${after}, spine act starts ${spine}`);

  // 3 — the press wave is created, does not eat the click, and removes itself.
  // The plate is an <a href="/teach">, and a real press on it navigates — which
  // took the rest of this file's assertions with it the first time. Clicks are
  // swallowed from here on; everything below asserts state, not navigation.
  await p.evaluate(() => document.addEventListener('click', (e) => e.preventDefault(), true));
  await p.evaluate(() => scrollTo({ top: 0, behavior: 'instant' }));
  await p.waitForTimeout(900);
  const r = await p.evaluate(() => {
    const e = document.querySelector('.hero .cta:not(.ghost)');
    const b = e.getBoundingClientRect();
    return { x: b.x + b.width * 0.3, y: b.y + b.height * 0.6 };
  });
  await p.mouse.move(r.x, r.y);
  await p.mouse.down();
  await p.waitForTimeout(60);
  const mid = await p.evaluate(() => {
    const rip = document.querySelector('.hero .cta .cta-rip');
    if (!rip) return { n: 0 };
    const cs = getComputedStyle(rip);
    return { n: 1, pe: cs.pointerEvents, z: cs.zIndex, op: cs.opacity };
  });
  await p.mouse.up();
  await p.waitForTimeout(900);
  const left = await p.evaluate(() => document.querySelectorAll('.cta-rip').length);
  say('press-wave', mid.n === 1 && mid.pe === 'none' && left === 0,
    `on press ${mid.n} wave (pointer-events ${mid.pe}, z ${mid.z}, opacity ${mid.op}); ${left} left after 900ms`);

  // 4 — the ring still draws on a plate that now clips its own children. It has to
  // be a REAL tab: `.focus()` from script leaves :focus-visible off when the last
  // input was the press above, and the assertion then reads `none` on a button whose
  // ring is fine.
  await p.evaluate(() => { document.activeElement.blur(); scrollTo({ top: 0, behavior: 'instant' }); });
  let ring = { who: 'nothing', outline: '-', hops: 0 };
  for (let i = 0; i < 12; i++) {
    await p.keyboard.press('Tab');
    ring = await p.evaluate((n) => {
      const a = document.activeElement;
      const cs = getComputedStyle(a);
      return { who: (a.className || a.tagName), outline: cs.outlineWidth + ' ' + cs.outlineStyle,
        colour: cs.outlineColor, hops: n, isCta: a.classList.contains('cta') };
    }, i + 1);
    if (ring.isCta) break;
  }
  say('focus-ring-survives-overflow', ring.isCta && ring.outline.startsWith('2px solid'),
    `${ring.hops} tabs to .${ring.who}, outline ${ring.outline} ${ring.colour}`);

  // 5 — act 5's console primary still advances the position it names
  await p.evaluate(() => {
    const a = window.__w.engine.acts.find((x) => x.name === 'session');
    scrollTo({ top: Math.round(a.top + a.len * 0.6), behavior: 'instant' });
  });
  await p.waitForTimeout(1400);
  const pos = () => p.evaluate(() => {
    const el = [...document.querySelectorAll('.con-b')].find((x) => /next position/i.test(x.textContent));
    return { label: document.querySelector('.pane-board .con-meta, .con-pos')?.textContent
      || document.querySelector('.pane-board')?.textContent.slice(0, 60), can: !!el };
  });
  const c1 = await pos();
  await p.evaluate(() => {
    const el = [...document.querySelectorAll('.con-b')].find((x) => /next position/i.test(x.textContent));
    if (el) el.click();
  });
  await p.waitForTimeout(700);
  const c2 = await pos();
  say('console-next-still-works', c1.can && c1.label !== c2.label,
    c1.can ? 'the board pane changed on click' : 'no Next position button found');

  say('landing-console-clean', errs.length === 0, errs.length ? errs.slice(0, 3).join(' | ') : 'no console errors');
  await p.close();

  // ------------------------------------------------------------------------- /teach
  const t = await b.newPage({ viewport: { width: 1440, height: 900 } });
  const terrs = [];
  t.on('pageerror', (e) => terrs.push('PAGEERROR ' + e.message));
  t.on('console', (m) => { if (m.type() === 'error') terrs.push(m.text()); });
  await t.goto('http://127.0.0.1:4321/teach', { waitUntil: 'load' });
  await t.waitForTimeout(1800);
  const t1 = await t.evaluate(() => document.querySelector('.t-beat-title')?.textContent
    + '|' + document.querySelector('.t-pos-h')?.textContent);
  await t.click('.t-next');
  await t.waitForTimeout(600);
  const t2 = await t.evaluate(() => document.querySelector('.t-beat-title')?.textContent
    + '|' + document.querySelector('.t-pos-h')?.textContent);
  say('teach-next-still-works', t1 !== t2, `"${t1}" -> "${t2}"`);
  const rev = await t.evaluate(() => {
    const r = document.querySelector('.t-reveal');
    const before = r.getAttribute('aria-expanded');
    r.click();
    return before + ' -> ' + r.getAttribute('aria-expanded');
  });
  say('teach-reveal-still-works', /false -> true/.test(rev), rev);
  say('teach-console-clean', terrs.length === 0, terrs.length ? terrs.slice(0, 3).join(' | ') : 'no console errors');
  await t.close();

  await b.close();
  let bad = 0;
  for (const [ok, id, detail] of out) {
    if (!ok) bad++;
    console.log(`  ${ok ? 'PASS' : 'FAIL'}  ${id.padEnd(30)} ${detail}`);
  }
  console.log(`\n  ${out.length - bad}/${out.length} pressed controls behave.`);
  process.exit(bad ? 1 : 0);
})();

function window_slack() { return 4000; }
