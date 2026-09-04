const PW='C:/Users/MUS/CurriculumWebsite/node_modules/playwright';
const { chromium } = require(PW);
(async () => {
  const b = await chromium.launch({ args: ['--use-gl=angle','--use-angle=gl','--enable-unsafe-swiftshader'] });
  const p = await b.newPage({ viewport: { width: 1200, height: 800 } });
  p.on('pageerror', e => console.log('PAGEERROR', e.message));
  p.on('console', m => { if (m.type()==='error') console.log('CONSOLE', m.text()); });
  await p.goto('http://127.0.0.1:4321/', { waitUntil: 'load' });
  await p.waitForTimeout(3000);
  const out = await p.evaluate(() => {
    const w = window.__w;
    if (!w) return { err: 'no window.__w' };
    const pawn = w.pieces.get('pawn');
    let mesh = null;
    pawn.traverse(o => { if (o.isMesh && !mesh) mesh = o; });
    const m = mesh.material;
    return {
      pawnParentIsFront: pawn.parent === w.world.front,
      pawnVisible: pawn.visible,
      pawnScale: pawn.scale.x,
      pawnPos: pawn.position.toArray(),
      reveal: m.userData.u.uReveal.value,
      matType: m.type,
      color: m.color.getHexString(),
      envInt: m.envMapIntensity,
      frontEnv: !!w.world.front.environment,
      frontChildren: w.world.front.children.map(c => c.type),
      frontLightIntensities: w.world.front.children.filter(c=>c.isLight).map(c=>[c.type,c.intensity]),
      sceneEnv: !!w.world.scene.environment,
      programCount: w.world.rFront.info.programs ? w.world.rFront.info.programs.length : -1,
      renderCalls: w.world.rFront.info.render.calls,
      narr: w.director.n,
      boot: w.director.boot,
    };
  });
  console.log(JSON.stringify(out, null, 1));
  await b.close();
})().catch(e => { console.error('PROBE FAILED', e.message); process.exit(1); });
