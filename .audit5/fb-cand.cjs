// fb-cand.cjs — measures EVERY hero-opener candidate against gate.cjs assertion 1's own condition,
// wrap, and the pawn silhouette, at all six gate windows plus the reader's 1198x546.
// One page load per window; each candidate's three strings are swapped into `.hero .d1 .ln i`
// (the .audit5/heroline.cjs + copyab.cjs technique) and re-measured in that same load.
//
// usage: node .audit5/fb-cand.cjs            (all 7 windows)
//        WINDOWS=1440x900 node .audit5/fb-cand.cjs
const PW = 'C:/Users/MUS/CurriculumWebsite/node_modules/playwright';
const { chromium } = require(PW);

const WINDOWS = (process.env.WINDOWS || '1920x1080,1920x993,1920x945,1920x900,1600x950,1440x900,1198x546')
  .split(',').map((s) => s.split('x').map(Number));

const C = [
  ['**', 'Same session.', 'Every coach.', 'Every table.'],   // incumbent, shipped
  ['A', 'One standard.', 'Every coach.', 'Every table.'],
  ['B', 'Your standard.', 'Every coach.', 'Every table.'],
  ['C', 'One standard.', 'Every coach.', 'Every class.'],
  ['D', 'One standard.', 'Every coach.', 'Go teach.'],
  ['E', 'One standard.', 'Same session.', 'Every coach.'],
  ['F', 'Walk in ready.', 'Every coach.', 'Every table.'],
  ['G', 'Any coach.', 'Any table.', 'Same hour.'],
  ['H', 'Hire Monday.', 'Teach Tuesday.', 'Same hour.'],
  ['I', 'Ask any coach.', 'Any Tuesday.', 'One answer.'],
  ['J', 'No Sunday prep.', 'No improvising.', 'Same hour.'],
  ['K', 'Second month.', 'Twentieth year.', 'Same hour.'],
  ['L', 'Your standard.', 'Every table.', 'Every week.'],
  ['M', 'Set the roster.', 'Not the lesson.', 'Every week.'],
  ['N', 'The standard.', 'In one head.', 'Unwritten.'],
  ['O', 'Every Sunday.', 'From scratch.', 'Again.'],
  ['P', 'The hour.', 'Never written.', 'Only taught.'],
  ['Q', 'Last Tuesday.', 'Table 4.', 'No record.'],
  ['R', 'The standard.', 'In one head.', 'Not yours.'],
  ['S', 'A parent asks.', 'You improvise.', 'Every time.'],
  ['T', 'One coach.', 'Three groups.', 'One Friday.'],
];

const MEAS = () => {
  const r1 = (n) => Math.round(n * 10) / 10;
  const h1 = document.querySelector('.hero .d1');
  const lines = [...document.querySelectorAll('.hero .d1 .ln i')].map((i) => {
    const rg = document.createRange(); rg.selectNodeContents(i);
    const rs = [...rg.getClientRects()].filter((r) => r.height > 1);
    const k = rs.reduce((a, x) => ({ l: Math.min(a.l, x.left), r: Math.max(a.r, x.right),
      t: Math.min(a.t, x.top), b: Math.max(a.b, x.bottom) }), { l: 1e9, r: -1e9, t: 1e9, b: -1e9 });
    const h = k.b - k.t;
    return { text: i.textContent, rects: rs.length, inkL: r1(k.l), inkR: r1(k.r),
      w: r1(k.r - k.l), xT: r1(k.t + h * 0.34), xB: r1(k.t + h * 0.79) };
  });
  const ink = (sel) => {
    const e = document.querySelector(sel);
    if (!e || getComputedStyle(e).display === 'none') return null;
    const rg = document.createRange(); rg.selectNodeContents(e);
    const rs = [...rg.getClientRects()];
    return rs.length ? Math.max(...rs.map((x) => x.bottom)) : e.getBoundingClientRect().bottom;
  };
  const st = document.querySelector('.act-threshold .act-stage');
  const over = st.scrollHeight - st.clientHeight;
  const rr = ink('.hero-rule'), tt = ink('.ticker');
  const below = Math.max(rr === null ? -1e4 : rr - innerHeight, tt === null ? -1e4 : tt - innerHeight);
  return { h1: r1(h1.getBoundingClientRect().height), lines, over,
    below: Math.round(below * 100) / 100, pass: over === 0 && below <= 0 };
};

// column-max luminance profile inside each of the three line bands, h1 hidden
const PROFILE = async ({ png, bands }) => {
  const bin = atob(png);
  const u = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i);
  const bmp = await createImageBitmap(new Blob([u], { type: 'image/png' }));
  const c = new OffscreenCanvas(bmp.width, bmp.height);
  const cx = c.getContext('2d');
  cx.drawImage(bmp, 0, 0);
  const d = cx.getImageData(0, 0, bmp.width, bmp.height).data;
  const sx = bmp.width / innerWidth, sy = bmp.height / innerHeight;
  return bands.map((bd) => {
    const y0 = Math.max(0, Math.round(bd.xT * sy)), y1 = Math.min(bmp.height - 1, Math.round(bd.xB * sy));
    const cols = [];
    for (let x = 0; x < bmp.width; x++) {
      let m = 0;
      for (let y = y0; y <= y1; y++) {
        const i = (y * bmp.width + x) * 4;
        const lum = 0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2];
        if (lum > m) m = lum;
      }
      cols.push(Math.round(m));
    }
    // pawn's left silhouette edge: leftmost column right of the SHIPPED ink that clears each lum
    const from = Math.round(bd.inkR * sx);
    const edge = {};
    for (const t of [60, 100, 140, 180]) {
      let hit = -1;
      for (let x = from; x < cols.length; x++) if (cols[x] > t) { hit = x; break; }
      edge[t] = hit < 0 ? null : Math.round((hit / sx) * 10) / 10;
    }
    return { edge, peak: Math.max(...cols.slice(from)), scale: sx };
  });
};

(async () => {
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=gl', '--enable-unsafe-swiftshader'] });
  const rows = [];
  for (const [W, H] of WINDOWS) {
    const p = await b.newPage({ viewport: { width: W, height: H } });
    await p.goto('http://127.0.0.1:4321/', { waitUntil: 'load' });
    await p.waitForTimeout(2600);
    const ship = await p.evaluate(MEAS);
    // pawn profile, once per window, from the shipped bands (bands are copy-invariant: the range
    // client rect is the line box, so 3 lines of the same font always give the same three bands)
    await p.evaluate(() => { document.querySelector('.hero .d1').style.visibility = 'hidden'; });
    await p.waitForTimeout(150);
    const png = (await p.screenshot()).toString('base64');
    await p.evaluate(() => { document.querySelector('.hero .d1').style.visibility = ''; });
    const prof = await p.evaluate(PROFILE, { png, bands: ship.lines });
    console.log(`\n=== ${W}x${H}  shipped h1 box ${ship.h1}px  over ${ship.over}  below ${ship.below} ${ship.pass ? 'PASS' : 'FAIL'}`);
    prof.forEach((pr, i) => console.log(`    band L${i + 1} y ${ship.lines[i].xT}-${ship.lines[i].xB}  pawn edge lum>100 ${pr.edge[100]}  (60:${pr.edge[60]} 140:${pr.edge[140]} 180:${pr.edge[180]})  peak ${pr.peak}`));
    const edge3 = prof[2].edge[100];
    for (const [id, ...ls] of C) {
      await p.evaluate((t) => {
        [...document.querySelectorAll('.hero .d1 .ln i')].forEach((el, i) => { el.textContent = t[i]; });
      }, ls);
      await p.waitForTimeout(160);
      const m = await p.evaluate(MEAS);
      const wrap = m.lines.some((l) => l.rects !== 1);
      const bandShift = m.lines.some((l, i) => Math.abs(l.xT - ship.lines[i].xT) > 0.6);
      const clr3 = edge3 === null ? null : Math.round((edge3 - m.lines[2].inkR) * 10) / 10;
      // lines 1 and 2 against their own bands' pawn edges
      const clr = [0, 1].map((i) => (prof[i].edge[100] === null ? null
        : Math.round((prof[i].edge[100] - m.lines[i].inkR) * 10) / 10));
      rows.push({ W, H, id, h1: m.h1, over: m.over, below: m.below, pass: m.pass, wrap,
        bandShift, rects: m.lines.map((l) => l.rects).join(''), inkR: m.lines.map((l) => l.inkR),
        w: m.lines.map((l) => l.w), clr3, clr1: clr[0], clr2: clr[1] });
      const flag = [
        m.pass ? '' : 'GATE1-FAIL',
        wrap ? 'WRAP' : '',
        m.h1 !== ship.h1 ? 'H1BOX' + m.h1 : '',
        bandShift ? 'BANDSHIFT' : '',
        clr3 !== null && clr3 < 0 ? 'PAWN-OVERLAP' : '',
      ].filter(Boolean).join(' ');
      console.log(`  ${id.padEnd(3)} rects ${m.lines.map((l) => l.rects).join('')}  h1 ${String(m.h1).padEnd(6)} over ${String(m.over).padEnd(3)} below ${String(m.below).padEnd(7)} ${m.pass ? 'PASS' : 'FAIL'}  L3 ink ${String(m.lines[2].inkR).padEnd(7)} clear ${String(clr3).padEnd(7)} L1clr ${String(clr[0]).padEnd(7)} L2clr ${String(clr[1]).padEnd(7)} ${flag}`);
    }
    await p.close();
  }
  await b.close();

  // ---- summary: worst case per candidate across all windows
  console.log('\n\n==== WORST CASE PER CANDIDATE ACROSS ALL WINDOWS ====');
  console.log('id\tgate1\twrap\th1box\tminL3clear\t@window\tminL1clr\tminL2clr');
  for (const [id] of C) {
    const rs = rows.filter((r) => r.id === id);
    const fails = rs.filter((r) => !r.pass).map((r) => `${r.W}x${r.H}`);
    const wraps = rs.filter((r) => r.wrap).map((r) => `${r.W}x${r.H}(${r.rects})`);
    const worst = rs.reduce((a, r) => (a === null || (r.clr3 !== null && r.clr3 < a.clr3) ? r : a), null);
    const m1 = Math.min(...rs.map((r) => (r.clr1 === null ? Infinity : r.clr1)));
    const m2 = Math.min(...rs.map((r) => (r.clr2 === null ? Infinity : r.clr2)));
    console.log([id, fails.length ? 'FAIL ' + fails.join(',') : 'pass 7/7',
      wraps.length ? 'WRAP ' + wraps.join(',') : 'no wrap',
      [...new Set(rs.map((r) => r.h1))].join('|'),
      worst.clr3, `${worst.W}x${worst.H}`,
      m1 === Infinity ? 'no pawn' : m1, m2 === Infinity ? 'no pawn' : m2].join('\t'));
  }
})().catch((e) => { console.error('FAILED', e.message, e.stack); process.exit(1); });
