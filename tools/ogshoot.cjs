// The social cards, rendered from the same data the pages are.
//
//   node tools/ogshoot.cjs
//
// Ten 1200x630 PNGs into app/assets/og/. Open Graph names og:image as one of four required
// properties on every page, and og:title is one of the nine sources Google draws a title
// link from — so a card is search metadata as well as a share preview, and a site with none
// renders as a bare link everywhere it is pasted.
//
// The card is the field manual's own type on the film's paper ground: the mark, a Fraunces
// line, a hue rule, and a mono row of figures that are counted at render time rather than
// typed. PNG rather than JPEG because it is flat type on a flat ground, where PNG is both
// smaller and sharper.
const PW = 'C:/Users/MUS/CurriculumWebsite/node_modules/playwright';
const { chromium } = require(PW);
const fs = require('fs');
const path = require('path');
const { load, fmt } = require('./pages/data.cjs');

const OUT = path.join(__dirname, '..', 'app', 'assets', 'og');
const { D } = load();

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** One card per indexable page. `figs` is always three counts, always real. */
const CARDS = [
  { file: 'home', kick: 'The complete chess curriculum for academies',
    title: 'Your standard.<br/>Every coach.<br/>Every class.', hue: '#3fa57a',
    figs: [[fmt(D.sessions), 'sessions, ready to teach'], [fmt(D.puzzles), 'positions, graded'],
      [D.ageSpan, 'ages']] },
  { file: 'curriculum', kick: 'The curriculum',
    title: 'Every session,<br/>in the order<br/>it is taught.', hue: '#4a8bd0',
    figs: [[String(D.stages), 'stages'], [String(D.levels), 'levels'],
      [fmt(D.sessions), 'sessions']] },
  ...D.byStage.map((st) => ({
    file: `curriculum-${st.slug}`, kick: `Stage ${st.number} of ${D.stages} · ${st.themeName}`,
    title: `${st.piece}<br/>Stage`, hue: st.hue,
    figs: [[String(st.sessions.length), 'sessions'],
      [String(st.units.length), 'units'], [st.ages, 'entry age']],
  })),
  { file: 'inside-a-session', kick: 'Inside a session',
    title: 'A session is<br/>a full hour,<br/>ready to teach.', hue: '#9070ce',
    figs: [['8', 'parts, in order'], ['8', 'graded positions'], ['42', 'minutes on the clock']] },
  { file: 'for-chess-coaches', kick: 'For coaches',
    title: 'The planning<br/>is done.<br/>The hour is yours.', hue: '#3fa57a',
    figs: [[fmt(D.questions), 'questions included'], [fmt(D.activities), 'activities'],
      [fmt(D.homework.sessions), 'sessions with homework']] },
  { file: 'for-chess-academies', kick: 'For academies',
    title: 'Two good coaches.<br/>Two different<br/>courses.', hue: '#d2604b',
    figs: [[String(D.checkpoints.length), 'graded gates'], [fmt(D.segments), 'parts in total'],
      [fmt(D.outcomes), 'stated outcomes']] },
  { file: 'about', kick: 'About · said ef-HAAM',
    title: 'To cause<br/>someone to<br/>understand.', hue: '#c9a227',
    figs: [[String(D.stages), 'stages'], [fmt(D.sessions), 'sessions'],
      [fmt(D.puzzles), 'positions']] },
];

/**
 * The card, as a document. Every value below is a token from tokens.css at the paper end of
 * director.js's ramp — #f2ece0 ground, #14141c ink, rgb(20 20 28 / 0.16) rules — so the card
 * and the page it links to are the same object.
 */
const card = (c) => `<!doctype html><html lang="en"><head><meta charset="utf-8"/>
<link href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght,SOFT,WONK@0,9..144,300..800,0,0&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet"/>
<style>
  *{box-sizing:border-box;margin:0}
  body{width:1200px;height:630px;background:#f2ece0;color:#14141c;overflow:hidden;
    display:grid;grid-template-rows:auto 1fr auto;padding:62px 68px;
    font-family:'JetBrains Mono',monospace;position:relative}
  /* the 8-file lattice the whole site sits on, as the card's one texture */
  body::before{content:'';position:absolute;inset:0;
    background-image:repeating-linear-gradient(90deg,rgb(20 20 28 / 0.05) 0 1px,transparent 1px 150px);
    pointer-events:none}
  .top{display:flex;align-items:center;gap:14px;position:relative}
  .mk{width:34px;height:34px;background:#14141c;
    -webkit-mask:url('/assets/monogram.png') center/124% no-repeat;
    mask:url('/assets/monogram.png') center/124% no-repeat;
    -webkit-mask-mode:luminance;mask-mode:luminance}
  .wd{font-family:Fraunces,serif;font-size:30px;font-weight:500;
    font-variation-settings:'opsz' 40,'SOFT' 0,'WONK' 0;letter-spacing:0.005em}
  .kk{margin-left:auto;font-size:14px;letter-spacing:0.19em;text-transform:uppercase;
    color:#4e4c58;display:flex;align-items:center;gap:12px}
  .dot{width:9px;height:9px;background:${c.hue};transform:rotate(45deg)}
  h1{font-family:Fraunces,serif;font-weight:300;font-size:82px;line-height:1.04;
    letter-spacing:-0.028em;font-variation-settings:'SOFT' 0,'WONK' 0,'opsz' 144;
    align-self:center;position:relative;max-width:19ch}
  .fg{display:flex;gap:56px;border-top:2px solid ${c.hue};padding-top:20px;position:relative}
  .fg div{display:grid;gap:4px}
  .fg b{font-size:34px;font-weight:500;letter-spacing:-0.02em;font-variant-numeric:tabular-nums}
  .fg span{font-size:13px;letter-spacing:0.15em;text-transform:uppercase;color:#4e4c58}
  .url{margin-left:auto;align-self:end;font-size:14px;letter-spacing:0.16em;color:#6b6875}
</style></head><body>
<div class="top"><span class="mk"></span><span class="wd">Efhaam</span>
  <span class="kk"><span class="dot"></span>${esc(c.kick)}</span></div>
<h1>${c.title}</h1>
<div class="fg">
  ${c.figs.map(([n, l]) => `<div><b>${esc(n)}</b><span>${esc(l)}</span></div>`).join('')}
  <span class="url">efhaam.com</span>
</div>
</body></html>`;

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
  // Land on the server FIRST so the document has its origin: setContent on about:blank gives
  // an opaque origin, and the monogram mask silently resolved to nothing there — the wordmark
  // rendered without its mark and no error was raised anywhere.
  await p.goto('http://127.0.0.1:4321/404.html', { waitUntil: 'load' });
  for (const c of CARDS) {
    await p.setContent(card(c), { waitUntil: 'load' });
    // the webfonts have to be in before the shot, or Fraunces renders as Times
    await p.evaluate(() => document.fonts.ready);
    await p.waitForTimeout(320);
    const file = path.join(OUT, c.file + '.png');
    await p.screenshot({ path: file, type: 'png' });
    console.log(`  ${c.file.padEnd(24)} ${(fs.statSync(file).size / 1024).toFixed(0).padStart(4)} KB`);
  }
  await b.close();
  console.log(`\n  ${CARDS.length} cards, 1200x630, counted off bundle ${D.bundle}.\n`);
})().catch((e) => { console.error('FAILED', e.message); process.exit(1); });
