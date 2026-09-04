// Tile a set of shots into one contact sheet so a whole scroll can be judged at once.
const PW='C:/Users/MUS/CurriculumWebsite/node_modules/playwright';
const { chromium } = require(PW);
const fs = require('fs'); const path = require('path');
const tag = process.argv[2] || 'v12';
const cols = Number(process.argv[3] || 3);
const cellW = Number(process.argv[4] || 640);
const dir = path.join(__dirname, '..', 'shots');
const files = fs.readdirSync(dir).filter(f => f.startsWith(tag + '-') && f.endsWith('.jpg')).sort();
if (!files.length) { console.error('no shots for ' + tag); process.exit(1); }
const AR = Number(process.env.AR || (900/1440));
const cellH = Math.round(cellW * AR);
const rows = Math.ceil(files.length / cols);
const html = `<style>
 body{margin:0;background:#111;display:grid;grid-template-columns:repeat(${cols},${cellW}px);gap:6px;font:11px monospace;color:#8f8}
 figure{margin:0;position:relative} img{width:${cellW}px;height:${cellH}px;display:block;object-fit:contain;background:#000}
 figcaption{position:absolute;left:4px;top:4px;background:#000c;padding:2px 5px}
</style>` + files.map(f => `<figure><img src="file:///${path.join(dir,f).split(String.fromCharCode(92)).join('/')}"><figcaption>${f.replace(tag+'-','').replace('.jpg','')}%</figcaption></figure>`).join('');
const tmp = path.join(dir, `_sheet-${tag}.html`);
fs.writeFileSync(tmp, html);
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: cols * cellW + (cols+1)*6, height: rows * cellH + (rows+1)*6 } });
  await p.goto('file:///' + tmp.split(String.fromCharCode(92)).join('/'));
  await p.waitForTimeout(900);
  const out = path.join(dir, `sheet-${tag}.jpg`);
  await p.screenshot({ path: out, quality: 74, type: 'jpeg', fullPage: true });
  console.log(out, files.length + ' frames');
  await b.close();
})();
