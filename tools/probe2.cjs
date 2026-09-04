const PW='C:/Users/MUS/CurriculumWebsite/node_modules/playwright';
const { chromium } = require(PW);
(async () => {
  const b = await chromium.launch({ args: ['--use-gl=angle','--use-angle=gl','--enable-unsafe-swiftshader'] });
  const p = await b.newPage({ viewport: { width: 1200, height: 800 } });
  const logs = [];
  p.on('console', m => logs.push(m.type()+': '+m.text().slice(0,400)));
  p.on('pageerror', e => logs.push('PAGEERROR '+e.message));
  await p.goto('http://127.0.0.1:4321/', { waitUntil: 'load' });
  await p.waitForTimeout(3000);
  const r = await p.evaluate(async () => {
    const w = window.__w;
    const THREE = await import('three');
    const pawn = w.pieces.get('pawn');
    let mesh = null; pawn.traverse(o => { if (o.isMesh && !mesh) mesh = o; });
    // 1. what does a plain unlit material do?
    const old = mesh.material;
    mesh.material = new THREE.MeshBasicMaterial({ color: 0xff0044 });
    w.world.render();
    const basic = w.world.rFront.info.render.calls;
    // 2. what does a plain lit material with no patch do?
    mesh.material = new THREE.MeshStandardMaterial({ color: 0xefe7d8, roughness: 0.35 });
    w.world.render();
    return { basic, patched: !!old.onBeforeCompile, oldCacheKey: old.customProgramCacheKey && old.customProgramCacheKey() };
  });
  await p.screenshot({ path: 'shots/probe-standard.jpg', quality: 80, type: 'jpeg' });
  console.log(JSON.stringify(r));
  console.log(logs.slice(0, 20).join('\n') || '(no logs)');
  await b.close();
})().catch(e => { console.error('FAILED', e.message); process.exit(1); });
