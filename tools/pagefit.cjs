// The supporting pages, measured. This is the stopping condition for /curriculum,
// /curriculum/<stage>, /inside-a-session, the two role pages, /about and /404 — the same
// job tools/gate.cjs does for the nine acts.
//
//   node tools/pagefit.cjs              every page, every window
//   node tools/pagefit.cjs curriculum   only routes whose path contains that
//   SHOT=1 node tools/pagefit.cjs       also write shots/pg-<route>-<w>x<h>.jpg
//
// What it asserts, per page per window:
//  - no horizontal overflow on the document (the one failure a phone always finds)
//  - no element whose own content overflows its box (the box list below)
//  - the head is complete: one h1, a canonical, a description, the four required OG
//    properties, and parseable JSON-LD
//  - every internal link resolves to a real file, with its status code
//  - no console errors
const PW = 'C:/Users/MUS/CurriculumWebsite/node_modules/playwright';
const { chromium } = require(PW);
const fs = require('fs');
const path = require('path');
const ONLY = process.argv[2] || '';
const SHOT = process.env.SHOT === '1';
const BASE = 'http://127.0.0.1:4321';

const ROUTES = ['/curriculum', '/curriculum/pawn', '/curriculum/knight', '/curriculum/bishop',
  '/curriculum/rook', '/curriculum/queen', '/inside-a-session', '/for-chess-coaches',
  '/for-chess-academies', '/about', '/404.html'];

// Wide, laptop, the founder's own window, tablet, and two phones.
const WINS = [[1920, 1080], [1440, 900], [1219, 543], [1024, 768], [390, 844], [360, 740]];

// Every box on these pages that holds words in a constrained container. A box whose own
// scrollHeight beats its clientHeight is either clipping a sentence or inking past its line.
const BOXES = ['.pg-nav', '.pg-crumbs', '.pg-figs li', '.pg-plate', '.pg-note', '.pg-chip',
  '.cu-s', '.cu-rail > ol > li > a', '.cu-bd dd', '.st-sh', '.is-hour li', '.is-legend li',
  '.is-clock li', '.pg-table td', '.pg-table th', '.ro-dn', '.ab-word p', '.pg-way',
  '.pg-foot-col li', '.cu-uh', '.cu-lh', '.st-lh'];

const results = [];
const record = (id, ok, detail) => results.push({ id, ok, detail });

(async () => {
  const b = await chromium.launch();
  const routes = ROUTES.filter((r) => !ONLY || r.includes(ONLY));

  for (const route of routes) {
    // ---------------------------------------------------------------- the head, once
    {
      const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
      const errs = [];
      p.on('pageerror', (e) => errs.push('PAGEERROR ' + e.message));
      p.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); });
      const resp = await p.goto(BASE + route, { waitUntil: 'load' });
      await p.waitForTimeout(500);
      const head = await p.evaluate(() => {
        const m = (sel, a = 'content') => (document.querySelector(sel) || {}).getAttribute
          ? document.querySelector(sel).getAttribute(a) : null;
        let ld = null;
        let ldErr = null;
        const s = document.querySelector('script[type="application/ld+json"]');
        if (s) { try { ld = JSON.parse(s.textContent); } catch (e) { ldErr = e.message; } }
        return {
          title: document.title,
          desc: m('meta[name="description"]'),
          canon: m('link[rel="canonical"]', 'href'),
          robots: m('meta[name="robots"]'),
          h1: [...document.querySelectorAll('h1')].map((x) => x.textContent.trim()),
          og: ['og:title', 'og:type', 'og:image', 'og:url', 'og:description', 'og:site_name',
            'og:image:alt'].map((k) => [k, m(`meta[property="${k}"]`)]),
          tw: m('meta[name="twitter:card"]'),
          types: ld ? (ld['@graph'] || [ld]).map((n) => n['@type']) : [],
          ldErr,
          links: [...document.querySelectorAll('a[href^="/"]')].map((a) => a.getAttribute('href')),
          imgNoAlt: [...document.querySelectorAll('img')].filter((i) => !i.alt).length,
          headings: [...document.querySelectorAll('h1,h2,h3,h4')].map((x) => +x.tagName[1]),
        };
      });
      const missOg = head.og.filter(([, v]) => !v).map(([k]) => k);
      const is404 = route === '/404.html';
      const wantCanon = !is404;
      const ok = head.title && head.desc && head.h1.length === 1 && !missOg.length && !head.ldErr
        && head.types.includes('WebPage') && (wantCanon ? !!head.canon : !head.canon)
        && head.imgNoAlt === 0 && resp.status() === (is404 ? 200 : 200);
      record(`head-complete ${route}`, ok,
        `${resp.status()} · title ${head.title.length}ch · desc ${(head.desc || '').length}ch`
        + ` · h1 x${head.h1.length} · schema ${head.types.join('+')}`
        + (missOg.length ? ` · MISSING ${missOg.join(',')}` : '')
        + (head.ldErr ? ` · JSON-LD ${head.ldErr}` : '')
        + (head.imgNoAlt ? ` · ${head.imgNoAlt} img with no alt` : '')
        + (wantCanon && !head.canon ? ' · NO CANONICAL' : ''));

      // heading order: never skip a level going down
      let skip = null;
      for (let i = 1; i < head.headings.length; i++) {
        if (head.headings[i] - head.headings[i - 1] > 1) { skip = `h${head.headings[i - 1]} -> h${head.headings[i]}`; break; }
      }
      record(`headings-ordered ${route}`, !skip, skip ? `skips ${skip}` : `${head.headings.length} headings, no skipped level`);

      // ------------------------------------------------------------- every internal link
      const uniq = [...new Set(head.links)];
      const bad = [];
      for (const href of uniq) {
        const r = await p.request.get(BASE + href, { maxRedirects: 0 }).catch(() => null);
        if (!r) { bad.push(`${href} -> no response`); continue; }
        if (r.status() >= 400) bad.push(`${href} -> ${r.status()}`);
      }
      record(`links-resolve ${route}`, bad.length === 0,
        bad.length ? bad.join('; ') : `${uniq.length} internal links, all 2xx/3xx`);
      record(`no-console-errors ${route}`, errs.length === 0,
        errs.length ? [...new Set(errs)].slice(0, 4).join(' | ') : 'clean');
      await p.close();
    }

    // ------------------------------------------------------------------- fit, per window
    for (const [w, h] of WINS) {
      const p = await b.newPage({ viewport: { width: w, height: h } });
      await p.goto(BASE + route, { waitUntil: 'load' });
      await p.waitForTimeout(420);
      const r = await p.evaluate((sels) => {
        const doc = document.documentElement;
        const over = [];
        for (const sel of sels) {
          for (const el of document.querySelectorAll(sel)) {
            const cs = getComputedStyle(el);
            if (cs.display === 'none' || cs.overflowY === 'auto' || cs.overflowY === 'scroll') continue;
            const dy = el.scrollHeight - el.clientHeight;
            const dx = el.scrollWidth - el.clientWidth;
            if (dy > 1 || dx > 1) over.push(`${sel} +${dy}y+${dx}x`);
          }
        }
        return {
          hx: Math.max(0, doc.scrollWidth - doc.clientWidth),
          over: [...new Set(over)].slice(0, 6),
          height: doc.scrollHeight,
        };
      }, BOXES);
      const ok = r.hx === 0 && r.over.length === 0;
      record(`page-fits ${route}@${w}x${h}`, ok,
        `doc ${r.height}px · h-overflow ${r.hx}px`
        + (r.over.length ? ` · CLIPPED ${r.over.join(', ')}` : ' · nothing clipped'));
      if (SHOT) {
        fs.mkdirSync('shots', { recursive: true });
        const tag = route.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '') || 'root';
        await p.screenshot({ path: path.join('shots', `pg-${tag}-${w}x${h}.jpg`),
          quality: 74, type: 'jpeg', fullPage: w > 900 && h > 800 });
      }
      await p.close();
    }
  }

  await b.close();
  const pass = results.filter((x) => x.ok).length;
  console.log('');
  for (const x of results) {
    if (!x.ok || process.env.VERBOSE === '1') {
      console.log(`  ${x.ok ? 'PASS' : 'FAIL'}  ${x.id.padEnd(44)} ${x.detail}`);
    }
  }
  const fails = results.filter((x) => !x.ok);
  console.log(`\n  ${pass}/${results.length} assertions pass${fails.length ? '' : ' — all clean'}.\n`);
  process.exit(fails.length ? 1 : 0);
})().catch((e) => { console.error('FAILED', e.message); process.exit(1); });
