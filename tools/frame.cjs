// Where does the live piece land on screen at a given narrative position?
// Scrolls for real so damping, morphs and fill are all truthful.
const PW='C:/Users/MUS/CurriculumWebsite/node_modules/playwright';
const { chromium } = require(PW);
const W = Number(process.argv[2]||1440), H = Number(process.argv[3]||900);
const NS = (process.argv[4]||'0,0.6,1.2,2,2.6,3.1,3.35,3.6,3.85,4.3,4.7,5.3,6.05,6.5,6.9,7.05,7.3,7.5,7.9').split(',').map(Number);
(async () => {
  const b = await chromium.launch({ args: ['--use-gl=angle','--use-angle=gl','--enable-unsafe-swiftshader'] });
  const p = await b.newPage({ viewport: { width: W, height: H } });
  await p.goto('http://127.0.0.1:4321/', { waitUntil: 'load' });
  await p.waitForTimeout(2600);
  for (const n of NS) {
    await p.evaluate((n) => {
      const e = window.__w.engine;
      const i = Math.min(e.acts.length - 1, Math.floor(n));
      const a = e.acts[i];
      window.scrollTo(0, Math.round(a.top + (n - i) * a.len));
    }, n);
    await p.waitForTimeout(1300);
    const r = await p.evaluate(async () => {
      const THREE = await import('three');
      const w = window.__w;
      let best = null, bestR = 0;
      for (const nm of ['pawn','knight','bishop','rook','queen']) {
        const o = w.pieces.get(nm);
        const rv = o.userData.mat.userData.u.uReveal.value;
        if (o.visible && rv > bestR) { best = { nm, o }; bestR = rv; }
      }
      const out = { narr: +w.director.n.toFixed(2), stage: w.director.stageIndex,
                    fill: +w.spine.fill.toFixed(3), fov: +w.world.camBack.fov.toFixed(1),
                    cam: w.world.camBack.position.toArray().map(v=>+v.toFixed(1)) };
      if (best) {
        const box = new THREE.Box3().setFromObject(best.o);
        const pts = [];
        for (const c of [[box.min.x,box.min.y,box.min.z],[box.max.x,box.max.y,box.max.z],
                         [box.min.x,box.max.y,box.max.z],[box.max.x,box.min.y,box.min.z]]) {
          const v = new THREE.Vector3(...c).project(w.world.camBack);
          pts.push([v.x*0.5+0.5, 1-(v.y*0.5+0.5)]);
        }
        const xs = pts.map(q=>q[0]), ys = pts.map(q=>q[1]);
        out.piece = best.nm; out.rev = +bestR.toFixed(2);
        out.x = +((Math.min(...xs)+Math.max(...xs))/2).toFixed(2);
        out.top = +Math.min(...ys).toFixed(2);
        out.bot = +Math.max(...ys).toFixed(2);
        out.h = +((Math.max(...ys)-Math.min(...ys))*100).toFixed(0);
      }
      return out;
    });
    console.log(`ask=${String(n).padEnd(5)} got=${String(r.narr).padEnd(5)} st=${r.stage} fill=${String(r.fill).padEnd(5)} fov=${String(r.fov).padEnd(4)} ` +
      (r.piece ? `${r.piece.padEnd(7)} rev=${String(r.rev).padEnd(4)} x=${String(r.x).padEnd(5)} y=${r.top}..${r.bot} h=${r.h}%` : '(no piece)'));
  }
  await b.close();
})().catch(e => { console.error('FAILED', e.message); process.exit(1); });
