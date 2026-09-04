const PW='C:/Users/MUS/CurriculumWebsite/node_modules/playwright';
const { chromium } = require(PW);
(async () => {
  const b = await chromium.launch({ args: ['--use-gl=angle','--use-angle=gl','--enable-unsafe-swiftshader'] });
  const p = await b.newPage({ viewport: { width: 900, height: 600 } });
  const logs=[]; p.on('console',m=>logs.push(m.type()+': '+m.text().slice(0,300)));
  await p.goto('http://127.0.0.1:4321/', { waitUntil: 'load' });
  await p.waitForTimeout(3000);

  const step = async (label, fn) => {
    await p.evaluate(fn);
    await p.waitForTimeout(120);
    await p.screenshot({ path: `shots/px-${label}.jpg`, quality: 70, type: 'jpeg' });
    // sample the middle of the pawn on the FRONT canvas via readPixels
    const px = await p.evaluate(() => {
      const c = document.getElementById('gl-front');
      const g = c.getContext('webgl2') || c.getContext('webgl');
      const buf = new Uint8Array(4);
      // read near the pawn: it stands slightly left of centre, lower half
      g.readPixels(Math.round(c.width*0.46), Math.round(c.height*0.36), 1, 1, g.RGBA, g.UNSIGNED_BYTE, buf);
      return Array.from(buf);
    });
    console.log(label, JSON.stringify(px));
  };

  await step('a-asis', () => {});
  await step('b-basic', async () => {
    const THREE = await import('three');
    const w = window.__w; const pawn = w.pieces.get('pawn');
    pawn.traverse(o => { if (o.isMesh) o.material = new THREE.MeshBasicMaterial({ color: 0xff0044 }); });
    w.world.render();
  });
  await step('c-standard-in-back', async () => {
    const THREE = await import('three');
    const w = window.__w; const pawn = w.pieces.get('pawn');
    pawn.traverse(o => { if (o.isMesh) o.material = new THREE.MeshStandardMaterial({ color: 0xefe7d8, roughness: 0.35 }); });
    // move the same pawn into the BACK scene, and render the back scene with the FRONT renderer
    w.world.rFront.render(w.world.scene, w.world.camFront);
  });
  console.log(logs.slice(0,15).join('\n')||'(no logs)');
  await b.close();
})().catch(e => { console.error('FAILED', e.message); process.exit(1); });
