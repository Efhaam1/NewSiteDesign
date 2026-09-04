const PW='C:/Users/MUS/CurriculumWebsite/node_modules/playwright';
const { chromium } = require(PW);
(async () => {
  const b = await chromium.launch({ args: ['--use-gl=angle','--use-angle=gl','--enable-unsafe-swiftshader'] });
  const p = await b.newPage({ viewport: { width: 1200, height: 800 } });
  await p.goto('http://127.0.0.1:4321/', { waitUntil: 'load' });

  await p.waitForTimeout(2800);
  const out = await p.evaluate(async () => {
    const THREE = await import('three');
    const w = window.__w;
    const res = {};
    for (const nm of ['pawn','knight','bishop','rook','queen','king']) {
      const o = w.pieces.get(nm);
      o.visible = true; o.scale.setScalar(1);
      o.updateMatrixWorld(true);
      const bb = new THREE.Box3().setFromObject(o);
      const sz = new THREE.Vector3(); bb.getSize(sz);
      res[nm] = { size: sz.toArray().map(v=>+v.toFixed(3)), min: bb.min.toArray().map(v=>+v.toFixed(2)) };
    }
    // and what the css says about the bento in paper mode
    const cell = document.querySelector('.cell');
    const cs = cell ? getComputedStyle(cell) : null;
    res.__css = cs ? { bg: cs.backgroundColor, color: cs.color, glass: getComputedStyle(document.body).getPropertyValue('--glass'), lift: getComputedStyle(document.documentElement).getPropertyValue('--lift') } : null;
    return res;
  });
  console.log(JSON.stringify(out, null, 1));
  await b.close();
})().catch(e => { console.error('FAILED', e.message); process.exit(1); });
