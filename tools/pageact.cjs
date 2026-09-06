// The supporting pages' interactions, driven. Sibling of tools/interact.cjs, which does the
// same job for the film's console.
//
//   node tools/pageact.cjs
//
// Everything here is an ENHANCEMENT over markup that is already complete — the track control
// swaps between two readouts that are both in the DOM, the filter hides rows that are all
// present, the rail marks a section that is already linked. So each step checks the
// enhancement AND that nothing was destroyed: the row count never changes, only visibility.
const PW = 'C:/Users/MUS/CurriculumWebsite/node_modules/playwright';
const { chromium } = require(PW);
const URL = 'http://127.0.0.1:4321';
const out = [];
const step = (id, ok, detail) => out.push({ id, ok, detail });

(async () => {
  const b = await chromium.launch();

  // 1 — the two delivery tracks
  {
    const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
    await p.goto(URL + '/curriculum', { waitUntil: 'load' });
    await p.waitForTimeout(400);
    const read = () => p.evaluate(() => {
      const on = [...document.querySelectorAll('.pg-track-note > [data-track]')]
        .filter((x) => getComputedStyle(x).display !== 'none');
      return {
        shown: on.length,
        who: on.length ? on[0].dataset.track : null,
        text: on.length ? on[0].textContent.replace(/\s+/g, ' ').trim().slice(0, 60) : '',
        pressed: [...document.querySelectorAll('.pg-way[data-track]')]
          .filter((x) => x.getAttribute('aria-pressed') === 'true').map((x) => x.dataset.track),
      };
    });
    const a = await read();
    await p.click('.pg-way[data-track="explorer"]');
    await p.waitForTimeout(220);
    const c = await read();
    await p.click('.pg-way[data-track="challenger"]');
    await p.waitForTimeout(220);
    const d = await read();
    const ok = a.who === 'challenger' && c.who === 'explorer' && d.who === 'challenger'
      && a.shown === 1 && c.shown === 1 && a.text !== c.text
      && a.pressed.length === 1 && c.pressed.length === 1 && c.pressed[0] === 'explorer';
    step('track-control', ok,
      `default ${a.who}, press Explorer -> ${c.who}, press back -> ${d.who};`
      + ` one readout at a time: ${a.shown === 1 && c.shown === 1}; readouts differ:`
      + ` ${a.text !== c.text}`);

    // 2 — the filter hides rows and collapses whatever is left empty
    const count = () => p.evaluate(() => ({
      rows: document.querySelectorAll('.cu-s').length,
      shown: [...document.querySelectorAll('.cu-s')].filter((x) => !x.hidden).length,
      units: [...document.querySelectorAll('.cu-u')].filter((x) => !x.hidden).length,
      empty: [...document.querySelectorAll('.cu-u')]
        .filter((x) => !x.hidden && !x.querySelector('.cu-s:not([hidden])')).length,
      status: (document.querySelector('.cu-count') || {}).textContent || '',
    }));
    const all = await count();
    await p.click('[data-filter="gate"]');
    await p.waitForTimeout(220);
    const gate = await count();
    await p.click('[data-filter="free"]');
    await p.waitForTimeout(220);
    const free = await count();
    await p.click('[data-filter="all"]');
    await p.waitForTimeout(220);
    const back = await count();
    const fOk = all.shown === 213 && gate.shown === 10 && free.shown === 3
      && back.shown === 213 && gate.rows === 213 && gate.empty === 0 && free.empty === 0
      && /10 of 213/.test(gate.status);
    step('map-filter', fOk,
      `all ${all.shown} -> graded ${gate.shown} (${gate.units} units left, ${gate.empty} of them`
      + ` empty) -> free ${free.shown} -> all ${back.shown}; nothing removed from the DOM:`
      + ` ${gate.rows === 213}; status "${gate.status.trim()}"`);

    // 3 — the rail marks the stage a reader is in, and never goes backwards on the way down
    const at = async (y) => {
      await p.evaluate((v) => scrollTo(0, v), y);
      await p.waitForTimeout(450);
      return p.evaluate(() => {
        const on = document.querySelector('.cu-rail li.is-on a[data-stage]');
        return on ? Number(on.dataset.stage) : null;
      });
    };
    const h = await p.evaluate(() => document.documentElement.scrollHeight);
    const walk = [];
    for (const f of [0.16, 0.28, 0.4, 0.52, 0.64, 0.76, 0.86]) walk.push(await at(Math.round(h * f)));
    const monotonic = walk.every((v, i) => v !== null && (i === 0 || v >= walk[i - 1]));
    const spread = new Set(walk).size;
    step('map-rail-follows', monotonic && spread >= 4 && walk[0] === 1 && walk[walk.length - 1] >= 4,
      `stages down the page: ${walk.join(' -> ')} (${spread} distinct,`
      + ` ${monotonic ? 'never goes backwards' : 'WENT BACKWARDS'})`);
    await p.close();
  }

  // 4 — the annotated screenshot's pin lift
  {
    const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
    await p.goto(URL + '/inside-a-session', { waitUntil: 'load' });
    await p.waitForTimeout(400);
    const before = await p.evaluate(() => document.querySelectorAll('.is-pins li.is-lit').length);
    await p.hover('.is-legend > li:nth-child(4)');
    await p.waitForTimeout(260);
    const after = await p.evaluate(() => {
      const lit = [...document.querySelectorAll('.is-pins li')].findIndex((x) => x.classList.contains('is-lit'));
      const dim = getComputedStyle(document.querySelector('.is-pins li:nth-child(1) span')).opacity;
      return { lit, dim: Number(dim), on: document.querySelector('.is-shot').classList.contains('is-lit') };
    });
    step('session-pin-lift', before === 0 && after.lit === 3 && after.on && after.dim < 0.6,
      `hovering legend 4 lights pin ${after.lit + 1} and quiets the rest to ${after.dim}`);
    await p.close();
  }

  // 5 — the keyboard reaches everything, and the skip link works
  {
    const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
    await p.goto(URL + '/curriculum', { waitUntil: 'load' });
    await p.waitForTimeout(400);
    await p.keyboard.press('Tab');
    const first = await p.evaluate(() => {
      const a = document.activeElement;
      return { tag: a.tagName, text: (a.textContent || '').trim().slice(0, 40),
        vis: getComputedStyle(a).clipPath };
    });
    // walk far enough to reach the filter and the track control
    const seen = new Set();
    for (let i = 0; i < 60; i++) {
      await p.keyboard.press('Tab');
      const s = await p.evaluate(() => {
        const a = document.activeElement;
        return (a.dataset && (a.dataset.filter || a.dataset.track)) || '';
      });
      if (s) seen.add(s);
    }
    const ok = /Skip to/.test(first.text) && first.vis === 'none'
      && seen.has('all') && seen.has('challenger');
    step('keyboard-reaches-controls', ok,
      `first tab stop "${first.text}" (visible: ${first.vis === 'none'});`
      + ` reached ${[...seen].length} controls by Tab: ${[...seen].join(',')}`);
    await p.close();
  }

  await b.close();
  console.log('');
  for (const s of out) console.log(`  ${s.ok ? 'OK  ' : 'FAIL'}  ${s.id.padEnd(24)} ${s.detail}`);
  const bad = out.filter((s) => !s.ok).length;
  console.log(`\n  ${out.length - bad}/${out.length} interactions behave.\n`);
  process.exit(bad ? 1 : 0);
})().catch((e) => { console.error('FAILED', e.message); process.exit(1); });
