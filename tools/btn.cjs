// Close-ups of one control in its three real states, because a button is a
// material and a material has to be looked at. Parks the act, shoots the
// element's own box padded out, then dispatches a real pointer at its centre
// and shoots again, then presses and shoots again.
//
// usage: node tools/btn.cjs <selector> [tag] [act] [t] [w] [h] [pad]
//        node tools/btn.cjs '.hero .cta' hero threshold 0 1440 900
//        node tools/btn.cjs '.rate-cta .cta' rate terms 0.5
//        ROUTE=/teach node tools/btn.cjs '.t-next' tnext - -
const PW = 'C:/Users/MUS/CurriculumWebsite/node_modules/playwright';
const { chromium } = require(PW);
const path = require('path'), fs = require('fs');

const SEL = process.argv[2] || '.hero .cta';
const TAG = process.argv[3] || 'btn';
const ACT = process.argv[4] && process.argv[4] !== '-' ? process.argv[4] : '';
const T = Number(process.argv[5] === '-' || process.argv[5] === undefined ? 0.5 : process.argv[5]);
const W = Number(process.argv[6] || 1440), H = Number(process.argv[7] || 900);
const PAD = Number(process.argv[8] || 26);
// Git Bash rewrites a leading slash into a Windows path (shootpage.cjs:6), so the
// route is passed WITHOUT one — ROUTE=teach — and normalised here.
const RAW = process.env.ROUTE || '/';
const ROUTE = RAW.startsWith('/') ? RAW : '/' + RAW;
const OUT = path.join(__dirname, '..', 'shots');
fs.mkdirSync(OUT, { recursive: true });

(async () => {
  const b = await chromium.launch({
    args: ['--use-gl=angle', '--use-angle=gl', '--enable-unsafe-swiftshader'],
  });
  const p = await b.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 2 });
  const errs = [];
  p.on('pageerror', (e) => errs.push('PAGEERROR ' + e.message));
  p.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); });
  await p.goto('http://127.0.0.1:4321' + ROUTE, { waitUntil: 'load' });
  await p.waitForTimeout(2600);

  if (ACT) {
    await p.evaluate(({ name, f }) => {
      const a = window.__w.engine.acts.find((x) => x.name === name);
      scrollTo({ top: Math.round(a.top + a.len * f), behavior: 'instant' });
    }, { name: ACT, f: T });
    // the engine is damped: a park is not where it says it is for ~600ms
    await p.waitForTimeout(1100);
  }

  const box = async () => p.evaluate((s) => {
    const e = document.querySelector(s);
    if (!e) return null;
    const r = e.getBoundingClientRect();
    return { x: r.x, y: r.y, w: r.width, h: r.height };
  }, SEL);

  const r = await box();
  if (!r) { console.log('NO MATCH for', SEL); await b.close(); return; }
  console.log(`${SEL}  ${r.w.toFixed(2)}x${r.h.toFixed(2)} at ${r.x.toFixed(1)},${r.y.toFixed(1)}`);

  const clip = () => {
    const c = {
      x: Math.max(0, r.x - PAD), y: Math.max(0, r.y - PAD),
      width: Math.min(W - Math.max(0, r.x - PAD), r.w + PAD * 2),
      height: Math.min(H - Math.max(0, r.y - PAD), r.h + PAD * 2),
    };
    return c;
  };

  const shoot = async (state) => {
    const f = path.join(OUT, `${TAG}-${state}.png`);
    // `animations: 'allow'`, and it is not optional: Playwright's default DISABLES
    // animations for a screenshot — finite ones are fast-forwarded to their end
    // frame and infinite ones are cancelled to their initial state. The plate's
    // press wave is finite and its sheen is infinite, so the default shot proved
    // both of them absent while getComputedStyle proved both running.
    await p.screenshot({ path: f, clip: clip(), animations: 'allow' });
    console.log('  ' + path.relative(process.cwd(), f));
  };

  await shoot('rest');

  // a real pointer, at the centre, so pointerenter/pointermove both fire
  const cx = r.x + r.w * 0.5, cy = r.y + r.h * 0.5;
  await p.mouse.move(cx - r.w * 0.3, cy);
  await p.mouse.move(cx, cy);
  await p.waitForTimeout(520);
  await shoot('hover');

  // mid-transit: the gesture sampled on its way in, from a cold start each time
  for (const ms of [70, 140, 230]) {
    await p.mouse.move(0, 0);
    await p.waitForTimeout(560);
    await p.mouse.move(cx, cy);
    await p.waitForTimeout(ms);
    await shoot('hover-' + ms);
  }

  await p.mouse.move(cx, cy);
  await p.mouse.down();
  await p.waitForTimeout(90);
  await shoot('press');
  await p.mouse.up();

  if (errs.length) console.log('ERRORS:', errs.slice(0, 6).join(' | '));
  await b.close();
})();
