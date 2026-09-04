const PW='C:/Users/MUS/CurriculumWebsite/node_modules/playwright';
const { chromium } = require(PW);
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1200, height: 420 } });
  await p.setContent(`<body style="margin:0;background:#000;display:flex">
    <video src="http://127.0.0.1:4321/assets/video/dust-shaft.mp4" width="400" muted></video>
    <video src="http://127.0.0.1:4321/assets/video/ink-bloom.mp4" width="400" muted></video>
    <video src="http://127.0.0.1:4321/assets/video/light-sweep.mp4" width="400" muted></video>
  </body>`);
  await p.waitForTimeout(1500);
  await p.evaluate(async () => {
    const vs = [...document.querySelectorAll('video')];
    for (const v of vs) { await new Promise(r => { v.onloadeddata = r; setTimeout(r, 4000); }); v.currentTime = Math.min(1.2, (v.duration||2)/2); }
    await new Promise(r => setTimeout(r, 1200));
  });
  await p.screenshot({ path: 'shots/videos.jpg', quality: 78, type: 'jpeg' });
  const info = await p.evaluate(() => [...document.querySelectorAll('video')].map(v => ({ w: v.videoWidth, h: v.videoHeight, d: +(v.duration||0).toFixed(1) })));
  console.log(JSON.stringify(info));
  await b.close();
})().catch(e => { console.error('FAILED', e.message); process.exit(1); });
