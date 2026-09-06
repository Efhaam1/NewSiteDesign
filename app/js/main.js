import { World, detectQuality } from './gl/world.js';
import { Board } from './gl/board.js';
import { Spine } from './gl/spine.js';
import { Pieces } from './gl/pieces.js';
import { Debris } from './gl/debris.js';
import { Load } from './gl/load.js';
import { Director, ACTS } from './gl/director.js';
import { ScrollEngine } from './scroll.js';
import { buildConsole } from './ui/console.js';
import { buildStages } from './ui/stages.js';
import { buildSystem } from './ui/system.js';
import { buildLadder, buildScrub, buildProof, buildReadout, buildLevels, bindPlates } from './ui/chrome.js';
import { buildCompare } from './ui/compare.js';
import { buildSunday } from './ui/sunday.js';
import { buildRate } from './ui/rate.js';
import { clamp } from './util.js';

const STAGE_NAMES = ['pawn stage', 'knight stage', 'bishop stage', 'rook stage', 'queen stage'];

const json = (p) => fetch(p).then((r) => r.json());

async function boot() {
  const [stages, catalog, showcase, variance, pricing, inventory, pathways, tracks] = await Promise.all([
    json('/data/stages.json'), json('/data/catalog.json'),
    json('/data/showcase.json'), json('/data/variance.json'),
    json('/data/pricing.json'),
    // act 6's two: the roll-up tools/inventory.cjs counts off the curriculum repo's 213
    // authored session files, and the delivery pathways, copied from the same bundle.
    json('/data/inventory.json'), json('/data/pathways.json'), json('/data/tracks.json'),
  ]);

  // ------------------------------------------------------------------- DOM first
  const engine = new ScrollEngine();
  for (const name of ACTS) {
    const el = document.querySelector(`[data-act="${name}"]`);
    if (el) engine.register(el);
  }

  const showStage = buildStages(
    document.getElementById('stage-panels'), document.getElementById('gates'), stages, catalog,
    document.querySelector('.stage-line'), document.querySelector('.stage-sub'));
  // S115 — the stage-3 session act 4 is a diagram of. The console reads its own keys
  // (left, right, R) only while this act is live, which is why it is handed a getter
  // rather than the act: `aSession` is not resolved until the engine has measured.
  let sessionAct = null;
  const playPuzzle = buildConsole(document.getElementById('console'), showcase.data.S115,
    { active: () => !!(sessionAct && sessionAct.active) });
  // Act 6. Same session as acts 1 and 5 on purpose: the reader opens S115 in act 1,
  // teaches it in act 5, and here learns that everything they were just shown exists
  // 213 times. Nothing in it is written per frame - see the note at the top of system.js.
  buildSystem(document.getElementById('sysfield'),
    { lesson: showcase.data.S115, inventory, pathways, tracks, stages, catalog });
  buildCompare(document.getElementById('compare'), variance, catalog, stages);
  const sunSegs = buildSunday(document.getElementById('sun-rail'), showcase.data.S115, catalog);
  buildRate(document.getElementById('rate'), pricing);
  const updateLadder = buildLadder(document.getElementById('ladder'), engine);
  const updateScrub = buildScrub(document.getElementById('scrub'), catalog);
  const updateLevels = buildLevels(document.getElementById('levels'), stages, catalog);
  const updateReadout = buildReadout(document.getElementById('readout'));
  buildProof(document.getElementById('proof'));
  bindPlates();
  engine._measure();
  // The words must not wait on a GLB. The type reveal starts as soon as the DOM
  // and the bundle data are in; the board runs its own assembly clock.
  document.documentElement.classList.add('ready');

  // -------------------------------------------------------------------- the world
  const q = detectQuality();
  const world = new World(
    document.getElementById('gl-back'), document.getElementById('gl-front'), q);
  const board = new Board(world);
  const spine = new Spine(world, catalog, stages, q);
  const debris = new Debris(world, q.debris, variance);
  // Act 1's own material. Scaled off the same quality knob the paper uses, so the
  // two acts give up instances together rather than one starving the other.
  const load = new Load(world, Math.min(1, q.debris / 88));
  // one pile per segment: the 3D and the strip must agree about how many there are
  load.setSegments(sunSegs);
  const pieces = await new Pieces(world).load(3.9);
  const director = new Director({ world, board, spine, pieces, debris, load });
  // Warm the things whose first touch is expensive: the spine's four instanced
  // buffers (252 instances) and the console's board (64 cells and up to 32 SVG
  // decodes). Both showed up as 100-150ms hitches the first time the reader
  // scrolled into them.
  spine.visible = 1;
  spine.fill = 1;
  spine.update(1 / 60, 0);
  spine.visible = 0;
  spine.fill = 0;
  playPuzzle(0.99);
  playPuzzle(0);
  const warmed = await world.warm(Object.values(pieces.byName));
  director.onStage.push((idx) => showStage(idx));
  showStage(0);

  // ------------------------------------------------------------------- act wiring
  const act = (name) => engine.acts.find((a) => a.name === name);
  const aSession = act('session');
  sessionAct = aSession;
  const aSpine = act('spine');

  // ------------------------------------------------------------ adaptive quality
  // Pixel count is what costs. A 1920x1080 panel at devicePixelRatio 2 is 8.3M
  // pixels a frame — six times the viewport this was authored against — so the
  // ladder measures real frame times and gives up resolution first, then the
  // shadow map, then the dust.
  // Budgets in back-buffer pixels, not pixel ratios — see world.setBudget.
  const LADDER = [
    { px: q.budget, dust: true },
    { px: Math.round(q.budget * 0.72), dust: true },
    { px: Math.round(q.budget * 0.52), dust: true },
    { px: Math.round(q.budget * 0.38), dust: false },
  ];
  let tier = 0;
  let acc = 0, accFrames = 0, badMs = 0, goodMs = 0, cooldown = 0;
  const hud = new URLSearchParams(location.search).has('debug')
    ? document.body.appendChild(Object.assign(document.createElement('div'), { id: 'hud' }))
    : null;

  function applyTier() {
    const t = LADDER[tier];
    world.setBudget(t.px);
    world.dustAllowed = t.dust;
    // Changing the pixel ratio reallocates both framebuffers, which is itself a
    // ~100ms hitch. Without a cooldown the ladder demotes on its own resize and
    // walks itself to the bottom — measured at 35fps adaptive vs 46fps fixed.
    cooldown = 2600;
    badMs = 0;
    goodMs = 0;
  }

  const prof = { gl: 0, js: 0, n: 0 };
  window.__prof = prof;

  function loop(now) {
    const t0 = performance.now();
    const dt = engine.frame(now);
    director.update(engine, dt);
    const t1 = performance.now();
    world.render();
    const t2 = performance.now();
    prof.js += t1 - t0; prof.gl += t2 - t1; prof.n++;

    const n = director.n;
    updateLadder(n);
    // The stage segment tracks the 3D camera's piece, not the content, so before act 3 it
    // printed a curriculum stage on screens that are not about one: acts 0, 1 and 2 all read
    // "pawn stage", and at act 2 the rail said "d3 · pawn stage" while the scrub card beside
    // it said "stage 3 Bishop". Suppressed until act 3, where the panels name stages.
    updateReadout(n, aSession?.active ? 'bishop stage'
      : n > 5.7 || n < 4 ? '' : STAGE_NAMES[director.stageIndex]);
    // D4 — the ladder walks the file, so it runs off the ACT's own progress, not off the
    // director's fill. `spine.fill` is the 3D light head's position and director.js:155 only ever
    // sweeps it 0.03 → 0.13 inside act 2 (the 0.13 → 0.97 sweep belongs to act 3, where this
    // callback is not reached because aSpine.active is false by then), so the ten-row ledger only
    // ever lit 1A and 1B and printed 13% directly under "213 of 213 sessions written". `aSpine.t`
    // is 0 → 1 across the pin (scroll.js:58) and updateLevels lights level i at fill × 10, so all
    // ten rows now light and go `past` in order and the card walks S001 → S213. The cost, accepted:
    // the "now passing" card no longer names the exact tile the light head is standing on.
    if (aSpine?.active) { updateScrub(aSpine.t); updateLevels(aSpine.t); }
    if (aSession?.active) playPuzzle(aSession.t);
    // A long frame counts against the tier; a run of short ones earns it back.
    // Weighting by the overrun stops one 200ms hitch from demoting the whole page.
    const ms = dt * 1000;
    acc += ms; accFrames++;
    // A single long frame is a hitch, not a verdict: only sustained overrun counts,
    // and any good frame pays some of it back.
    if (ms > 26) badMs += Math.min(ms, 60); else badMs = Math.max(0, badMs - ms * 0.8);
    if (ms < 17) goodMs += ms; else goodMs = 0;
    if (cooldown > 0) cooldown -= ms;
    else if (!window.__frozen) {
      if (badMs > 2400 && tier < LADDER.length - 1) { tier++; applyTier(); }
      else if (goodMs > 9000 && tier > 0) { tier--; applyTier(); }
    }

    if (hud && accFrames >= 30) {
      const info = world.rBack.info.render;
      hud.textContent =
        `${(1000 / (acc / accFrames)).toFixed(0)} fps · tier ${tier}` +
        ` · dpr ${world.rBack.getPixelRatio().toFixed(2)}` +
        ` · ${(innerWidth * innerHeight * world.rBack.getPixelRatio() ** 2 / 1e6).toFixed(1)}Mpx` +
        ` · ${info.calls} calls · ${(info.triangles / 1000).toFixed(0)}k tris` +
        ` · n ${n.toFixed(2)}`;
      acc = 0; accFrames = 0;
    }
    requestAnimationFrame(loop);
  }
  applyTier();
  requestAnimationFrame(loop);

  window.__w = { world, board, spine, pieces, debris, director, engine, warmed };
  document.body.classList.add('ready');

}

boot().catch((e) => {
  console.error(e);
  document.body.classList.add('gl-failed');
});
