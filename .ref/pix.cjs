// Sample the reference image's pixels. usage: node .ref/pix.cjs "x,y,label" ...
// Also supports "x,y,w,h,label:max" to report the brightest pixel in a box (text colour).
const PW = 'C:/Users/MUS/CurriculumWebsite/node_modules/playwright';
const { chromium } = require(PW);
const fs = require('fs');
const SRC = 'C:/Users/MUS/.claude/image-cache/393ae3e3-ecc3-44a6-9dd4-76cb5e1dba44/13.png';
const b64 = fs.readFileSync(SRC).toString('base64');
const specs = process.argv.slice(2);
(async () => {
  const br = await chromium.launch();
  const p = await br.newPage({ viewport: { width: 400, height: 200 } });
  await p.setContent(`<canvas id=c width=1672 height=941></canvas><img id=i src="data:image/png;base64,${b64}">`);
  await p.waitForFunction(() => document.getElementById('i').complete);
  const out = await p.evaluate((specs) => {
    const c = document.getElementById('c'), g = c.getContext('2d');
    g.drawImage(document.getElementById('i'), 0, 0);
    const hex = (r, g2, b) => '#' + [r, g2, b].map(n => n.toString(16).padStart(2, '0')).join('');
    return specs.map((s) => {
      const parts = s.split(',');
      if (parts.length >= 5) {
        const [x, y, w, h] = parts.slice(0, 4).map(Number);
        const label = parts.slice(4).join(',');
        const d = g.getImageData(x, y, w, h).data;
        let best = 0, bi = 0;
        for (let i = 0; i < d.length; i += 4) {
          const l = d[i] * 0.3 + d[i + 1] * 0.6 + d[i + 2] * 0.11;
          if (l > best) { best = l; bi = i; }
        }
        return `${label}  brightest in ${x},${y} ${w}x${h}: ${hex(d[bi], d[bi + 1], d[bi + 2])}`;
      }
      const [x, y] = parts.slice(0, 2).map(Number);
      const label = parts.slice(2).join(',');
      const d = g.getImageData(x, y, 1, 1).data;
      return `${label}  ${x},${y}: ${hex(d[0], d[1], d[2])}`;
    });
  }, specs);
  console.log(out.join('\n'));
  await br.close();
})().catch((e) => { console.error('FAILED', e.message); process.exit(1); });
