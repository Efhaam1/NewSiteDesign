const PW='C:/Users/MUS/CurriculumWebsite/node_modules/playwright';
const { chromium } = require(PW);
(async () => {
  const b = await chromium.launch({ args: ['--use-gl=angle','--use-angle=gl','--enable-unsafe-swiftshader'] });
  const p = await b.newPage({ viewport: { width: 900, height: 600 } });
  const logs=[]; p.on('console',m=>logs.push(m.type()+': '+m.text().slice(0,300)));
  await p.goto('http://127.0.0.1:4321/', { waitUntil: 'load' });
  await p.waitForTimeout(3000);
  const info = await p.evaluate(async () => {
    const THREE = await import('three');
    const w = window.__w;
    const pawn = w.pieces.get('pawn');
    pawn.traverse(o => { if (o.isMesh) o.material = new THREE.MeshStandardMaterial({ color: 0xefe7d8, roughness: 0.35 }); });
    // render the FRONT scene using the BACK renderer, into the back canvas
    w.world.rBack.render(w.world.front, w.world.camBack);
    const st = w.world.rBack.properties ? 'n/a' : 'n/a';
    // inspect what three thinks the front scene's lights are
    const rs = w.world.rBack.info;
    let mesh=null; pawn.traverse(o=>{ if(o.isMesh && !mesh) mesh=o; });
    const prog = mesh.material.program;
    return {
      renderCalls: rs.render.calls,
      hasProgram: !!prog,
      progDefines: prog ? Object.keys(prog.getUniforms().map).filter(k=>/Light|envMap|ambient/i.test(k)).slice(0,20) : null,
      frontLights: w.world.front.children.filter(c=>c.isLight).map(c=>({t:c.type,i:c.intensity,vis:c.visible,layers:c.layers.mask})),
      meshLayers: mesh.layers.mask,
      camLayers: w.world.camBack.layers.mask,
      matNeedsUpdate: mesh.material.needsUpdate,
      envMapOnScene: !!w.world.front.environment,
    };
  });
  await p.waitForTimeout(80);
  await p.screenshot({ path: 'shots/px-front-in-back.jpg', quality: 72, type: 'jpeg' });
  console.log(JSON.stringify(info, null, 1));
  console.log(logs.slice(0,12).join('\n')||'(no logs)');
  await b.close();
})().catch(e => { console.error('FAILED', e.message); process.exit(1); });
