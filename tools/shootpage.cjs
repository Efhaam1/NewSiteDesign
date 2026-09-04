// Screenshot an arbitrary route (the console is not scroll-driven).
const PW='C:/Users/MUS/CurriculumWebsite/node_modules/playwright';
const { chromium } = require(PW);
const path=require('path'), fs=require('fs');
// Git Bash rewrites a leading slash into a Windows path, so routes are passed
// without one and normalised here.
const raw = process.argv[2] || 'teach';
const route = raw.startsWith('/') ? raw : '/' + raw;
const tag = process.argv[3] || 'page';
const W = Number(process.argv[4]||1440), H = Number(process.argv[5]||900);
const keys = (process.argv[6]||'').split(',').filter(Boolean);
fs.mkdirSync('shots', { recursive: true });
(async () => {
  const b = await chromium.launch({ args: ['--use-angle=d3d11','--ignore-gpu-blocklist'] });
  const p = await b.newPage({ viewport: { width: W, height: H } });
  const errs=[]; p.on('pageerror',e=>errs.push('PAGEERROR '+e.message));
  p.on('console',m=>{if(m.type()==='error')errs.push(m.text())});
  await p.goto('http://127.0.0.1:4321' + route, { waitUntil: 'load' });
  await p.waitForTimeout(1800);
  await p.screenshot({ path: path.join('shots', tag + '-00.jpg'), quality: 82, type: 'jpeg' });
  let i = 1;
  for (const k of keys) {
    if (k.startsWith('click:')) await p.click(k.slice(6)).catch(e => errs.push('click ' + k + ': ' + e.message));
    else await p.keyboard.press(k);
    await p.waitForTimeout(650);
    await p.screenshot({ path: path.join('shots', tag + '-' + String(i++).padStart(2,'0') + '.jpg'), quality: 82, type: 'jpeg' });
  }
  console.log(errs.length ? 'ERRORS: ' + [...new Set(errs)].slice(0,6).join(' | ') : 'no console errors');
  await b.close();
})().catch(e => { console.error('FAILED', e.message); process.exit(1); });
