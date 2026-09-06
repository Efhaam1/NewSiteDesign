const PW='C:/Users/MUS/CurriculumWebsite/node_modules/playwright';
const { chromium } = require(PW);
(async () => {
  const b = await chromium.launch({ args: ['--use-gl=angle','--use-angle=gl','--enable-unsafe-swiftshader'] });
  const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
  const errs=[]; p.on('pageerror',e=>errs.push(e.message)); p.on('console',m=>{if(m.type()==='error')errs.push(m.text())});
  await p.goto('http://127.0.0.1:4321/', { waitUntil: 'load' });
  await p.waitForTimeout(2600);

  // 1. rank ladder navigation
  const before = await p.evaluate(() => scrollY);
  await p.click('#ladder .rungs li[data-rank="5"] .rung-hit');
  await p.waitForTimeout(1400);
  const after = await p.evaluate(() => scrollY);
  console.log('ladder d5:', before, '->', after, after > before ? 'OK' : 'FAIL');

  // 2. the coach dial actually swaps the improvised half and not the session
  // BY NAME, not by index. `acts[1]` was `chaos` until 2026-09-05, when `sunday` was
  // inserted at index 1 and this line silently started parking one act early - the dial
  // is not on that stage, so `.improv-cost` came back null and the whole script died
  // before it reached anything below. Same fix gate.cjs took, for the same reason.
  await p.evaluate(() => { const a = window.__w.engine.acts.find(x => x.name === 'chaos');
    window.scrollTo(0, Math.round(a.top + a.len * 0.75)); });
  await p.waitForTimeout(1500);
  // STALE, AND NULL-SAFE SO IT SAYS SO INSTEAD OF KILLING THE SCRIPT. `.improv-cost`,
  // `.dial-card`, `.dial-seg` and `.beats .beat` are not in the DOM any more - act 2 was
  // rebuilt and `compare.js` contains none of those class names. Before this guard the
  // read threw on a null and took steps 3, 4 and 5 with it, so the act-7 checks below
  // were unreachable. Whoever re-points this at act 2's current instrument should replace
  // the whole block; it is left in place rather than deleted so the gap stays visible.
  const read = () => p.evaluate(() => {
    const t = (sel) => { const e = document.querySelector(sel); return e ? e.textContent : null; };
    return {
      beats: [...document.querySelectorAll('.beats .beat')].map(b => b.textContent).join('/'),
      cost: (t('.improv-cost') || '').slice(0, 40),
      session: t('.dial-card .dc-title'),
      segs: [...document.querySelectorAll('.dial-seg div .num')].map(n => n.textContent).join(','),
      present: !!document.querySelector('.dial-row button:nth-child(3)'),
    };
  });
  const a1 = await read();
  if (!a1.present) {
    console.log('dial: SKIPPED - .dial-row / .improv-cost / .dial-card are not in the DOM;'
      + ' this check has been pointing at a rebuilt act 2 and needs re-writing');
  } else {
    await p.click('.dial-row button:nth-child(3)');
    await p.waitForTimeout(500);
    const a2 = await read();
    console.log('dial improv changed:', a1.beats !== a2.beats ? 'OK' : 'FAIL');
    console.log('dial session unchanged:', a1.session === a2.session && a1.segs === a2.segs ? 'OK' : 'FAIL');
    console.log('  ', a1.cost, '=>', a2.cost);
  }

  // 3. keyboard: focus ring reachable
  await p.keyboard.press('Tab'); await p.keyboard.press('Tab');
  const focus = await p.evaluate(() => { const a = document.activeElement; return a.tagName + '.' + (a.className||'') + ' "' + (a.textContent||'').trim().slice(0,24) + '"'; });
  console.log('second tab stop:', focus);

  // 4. nav anchor
  await p.click('.nav-links a[href="#system"]');
  await p.waitForTimeout(1600);
  const at = await p.evaluate(() => Math.round(scrollY / (document.documentElement.scrollHeight - innerHeight) * 100));
  console.log('nav #system ->', at + '% of page', at > 60 && at < 95 ? 'OK' : 'CHECK');

  // 5. act 6's track control — Explorer / Challenger. The only control on the session
  // plate, and what it has to do is re-grade the eight positions by the pressed track's
  // own rule WITHOUT changing the
  // plate's height under the reader's hand - the reserved line on `.sy-rule` is the only
  // thing holding that, and without it the plate grew 3.2px on the first press.
  await p.evaluate(() => { const a = window.__w.engine.acts.find(x => x.name === 'system');
    window.scrollTo(0, Math.round(a.top + a.len * 0.52)); });
  await p.waitForTimeout(1500);
  const way = async (k) => {
    await p.click(`.sy-way[data-track="${k}"]`);
    await p.waitForTimeout(420);
    return p.evaluate(() => ({
      grade: [...document.querySelectorAll('.sy-chips li')].map(l => l.dataset.state).join(','),
      note: document.querySelector('.sy-note').textContent.trim().slice(0, 46),
      pressed: [...document.querySelectorAll('.sy-way')].map(x => x.getAttribute('aria-pressed')).join(','),
      h: Math.round(document.querySelector('.sy-core').getBoundingClientRect().height * 10) / 10,
    }));
  };
  const wC = await way('challenger'); const wE = await way('explorer');
  console.log('track regrades the eight positions:', wE.grade !== wC.grade ? 'OK' : 'FAIL');
  console.log('  Challenger', wC.grade);
  console.log('  Explorer  ', wE.grade);
  console.log('track readout changes:', wC.note !== wE.note ? 'OK' : 'FAIL', '|', wE.note);
  console.log('track moves aria-pressed:',
    wC.pressed === 'false,true' && wE.pressed === 'true,false' ? 'OK' : 'FAIL',
    wC.pressed, '->', wE.pressed);
  console.log('session plate holds its height:',
    Math.abs(wC.h - wE.h) <= 0.6 ? 'OK' : 'FAIL', wC.h + '/' + wE.h);
  // and the pointer link between a figure and the block it names
  const lit = await p.evaluate(async () => {
    const sat = [...document.querySelectorAll('.sy-sat')].find(s => s.dataset.lit === 'hour');
    sat.dispatchEvent(new PointerEvent('pointerenter', { bubbles: true }));
    await new Promise(r => setTimeout(r, 120));
    const on = document.querySelector('.sy-field').dataset.lit;
    sat.dispatchEvent(new PointerEvent('pointerleave', { bubbles: true }));
    await new Promise(r => setTimeout(r, 120));
    return { on, off: document.querySelector('.sy-field').dataset.lit };
  });
  console.log('pointing at a figure lights the block it names:',
    lit.on === 'hour' && !lit.off ? 'OK' : 'CHECK (hover-only, coarse pointers see nothing)',
    lit.on, '->', lit.off);

  // 6. act 7's billing pill. The only control on the licence sheet, and what it has to
  // do is move the emphasis between two figures WITHOUT hiding either of them - so this
  // checks the promoted figure changes, the demoted one is still on the page, aria-pressed
  // follows the press, and the card row does not change height under the reader.
  await p.evaluate(() => { const a = window.__w.engine.acts.find(x => x.name === 'terms');
    window.scrollTo(0, Math.round(a.top + a.len * 0.5)); });
  await p.waitForTimeout(1600);
  const bill = () => p.evaluate(() => {
    const px = (e) => Math.round(parseFloat(getComputedStyle(e).fontSize));
    const b0 = document.querySelector('.rate-band');
    const vis = (e) => !!e && e.getBoundingClientRect().height > 2 && getComputedStyle(e).display !== 'none';
    // the two figures the card is SHOWING, biggest first, in DOM-independent order
    const shown = [...b0.querySelectorAll('.rate-mo, .rate-yr, .rate-eff')].filter(vis)
      .map((e) => ({ px: px(e), text: e.textContent.replace(/\s+/g, ' ').trim() }))
      .sort((a, z) => z.px - a.px);
    return {
      shown,
      pressed: [...document.querySelectorAll('.rate-bill-b')].map(x => x.getAttribute('aria-pressed')).join(','),
      rowH: Math.round(document.querySelector('.rate-list').getBoundingClientRect().height),
      // the inverted card's annual slot is a sentence, so its monthly figure must stay big
      invMo: px(document.querySelector('.rate-band.is-invert .rate-mo')),
    };
  });
  const m1 = await bill();
  await p.click('.rate-bill-b:nth-of-type(2)');
  await p.waitForTimeout(600);
  const m2 = await bill();
  const big = (m) => (m.shown[0] || {}).text || '';
  const small = (m) => (m.shown[1] || {}).text || '';
  console.log('rate toggle swaps which basis is priced:',
    /month/.test(big(m1)) && /year/.test(big(m2)) ? 'OK' : 'FAIL',
    `("${big(m1)}" -> "${big(m2)}")`);
  console.log('rate toggle shows two figures either way:',
    m1.shown.length === 2 && m2.shown.length === 2 && m1.shown[0].px > m1.shown[1].px
      && m2.shown[0].px > m2.shown[1].px ? 'OK' : 'FAIL',
    `(${m1.shown.length} then ${m2.shown.length}: "${small(m1)}" -> "${small(m2)}")`);
  console.log('rate toggle never shows two `a month` figures at once:',
    m1.shown.filter(x => /a month/.test(x.text)).length <= 1
      && m2.shown.filter(x => /a month/.test(x.text)).length <= 1 ? 'OK' : 'FAIL');
  console.log('rate toggle moves aria-pressed:',
    m1.pressed === 'true,false' && m2.pressed === 'false,true' ? 'OK' : 'FAIL', m1.pressed, '->', m2.pressed);
  console.log('rate card row holds its height:', Math.abs(m1.rowH - m2.rowH) <= 2 ? 'OK' : 'FAIL',
    m1.rowH + ' -> ' + m2.rowH);
  console.log('inverted card keeps its figure promoted:', m2.invMo === m1.invMo ? 'OK' : 'FAIL',
    m1.invMo + ' -> ' + m2.invMo);

  console.log(errs.length ? 'ERRORS: ' + errs.slice(0,5).join(' | ') : 'no runtime errors');
  await b.close();
})().catch(e => { console.error('FAILED', e.message); process.exit(1); });
