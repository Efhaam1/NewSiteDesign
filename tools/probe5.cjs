const PW='C:/Users/MUS/CurriculumWebsite/node_modules/playwright';
const { chromium } = require(PW);
(async () => {
  const b = await chromium.launch({ args: ['--use-gl=angle','--use-angle=gl','--enable-unsafe-swiftshader'] });
  const p = await b.newPage({ viewport: { width: 600, height: 400 } });
  await p.goto('http://127.0.0.1:4321/', { waitUntil: 'load' });
  await p.waitForTimeout(2800);
  const out = await p.evaluate(() => {
    const w = window.__w;
    const res = {};
    for (const nm of ['pawn','knight','bishop','rook','queen','king']) {
      const o = w.pieces.get(nm);
      if (!o) { res[nm] = 'MISSING'; continue; }
      const meshes = [];
      o.traverse(m => { if (m.isMesh) meshes.push(m); });
      res[nm] = meshes.map(m => ({
        attrs: Object.keys(m.geometry.attributes),
        verts: m.geometry.attributes.position.count,
        indexed: !!m.geometry.index,
        normalCount: m.geometry.attributes.normal ? m.geometry.attributes.normal.count : 0,
      }));
    }
    return res;
  });
  console.log(JSON.stringify(out, null, 1));
  await b.close();
})().catch(e => { console.error('FAILED', e.message); process.exit(1); });
