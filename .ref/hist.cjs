// Top colours in a box, by count, ignoring near-black. usage: node .ref/hist.cjs "x,y,w,h,label" ...
const PW = 'C:/Users/MUS/CurriculumWebsite/node_modules/playwright';
const { chromium } = require(PW);
const fs = require('fs');
const SRC = 'C:/Users/MUS/.claude/image-cache/393ae3e3-ecc3-44a6-9dd4-76cb5e1dba44/13.png';
const b64 = fs.readFileSync(SRC).toString('base64');
const specs = process.argv.slice(2);
(async () => {
  const br = await chromium.launch();
  const p = await br.newPage({ viewport: { width: 300, height: 100 } });
  await p.setContent(`<canvas id=c width=1672 height=941></canvas><img id=i src="data:image/png;base64,${b64}">`);
  await p.waitForFunction(() => document.getElementById('i').complete);
  const out = await p.evaluate((specs) => {
    const g = document.getElementById('c').getContext('2d');
    g.drawImage(document.getElementById('i'), 0, 0);
    const hex = (r, gg, b) => '#' + [r, gg, b].map(n => n.toString(16).padStart(2, '0')).join('');
    return specs.map((s) => {
      const parts = s.split(',');
      const [x, y, w, h] = parts.slice(0, 4).map(Number);
      const label = parts.slice(4).join(',');
      const d = g.getImageData(x, y, w, h).data;
      const m = new Map();
      for (let i = 0; i < d.length; i += 4) {
        const lum = d[i] * 0.2126 + d[i + 1] * 0.7152 + d[i + 2] * 0.0722;
        if (lum < 42) continue;               // background / near-black
        const k = hex(d[i], d[i + 1], d[i + 2]);
        m.set(k, (m.get(k) || 0) + 1);
      }
      const top = [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6);
      return `${label}\n    ` + top.map(([c, n]) => `${c} x${n}`).join('  ');
    });
  }, specs);
  console.log(out.join('\n'));
  await br.close();
})().catch((e) => { console.error('FAILED', e.message); process.exit(1); });
