// Zoom into a region of the reference image so exact geometry and text can be read.
// usage: node .ref/crop.cjs <tag> <x> <y> <w> <h> [zoom]
const path = require('path');
const fs = require('fs');
const PW = 'C:/Users/MUS/CurriculumWebsite/node_modules/playwright';
const { chromium } = require(PW);
const SRC = 'C:/Users/MUS/.claude/image-cache/393ae3e3-ecc3-44a6-9dd4-76cb5e1dba44/13.png';
const [TAG, X, Y, W, H, Z] = [process.argv[2], +process.argv[3], +process.argv[4],
  +process.argv[5], +process.argv[6], +(process.argv[7] || 2)];
const OUT = path.join(__dirname, 'crops');
fs.mkdirSync(OUT, { recursive: true });
const b64 = fs.readFileSync(SRC).toString('base64');
(async () => {
  const br = await chromium.launch();
  const p = await br.newPage({ viewport: { width: Math.round(W * Z), height: Math.round(H * Z) } });
  await p.setContent(`<style>html,body{margin:0;background:#000;overflow:hidden}
    img{position:absolute;left:${-X * Z}px;top:${-Y * Z}px;width:${1672 * Z}px;height:${941 * Z}px;
    image-rendering:auto}</style><img src="data:image/png;base64,${b64}">`);
  await p.waitForTimeout(400);
  const f = path.join(OUT, `${TAG}.png`);
  await p.screenshot({ path: f });
  console.log('wrote ' + f + `  (src region ${X},${Y} ${W}x${H} at ${Z}x)`);
  await br.close();
})().catch((e) => { console.error('FAILED', e.message); process.exit(1); });
