// Is the dust actually in the frame? A yes/no that does not depend on looking at a jpeg.
//
// Reads the downsampled canvas world.js samples the atmosphere video into, and reports
// mean luminance plus standard deviation over a grid of pixels. A blank canvas reads
// 0/0; a real video frame reads non-zero with real variance. Then reports whether the
// dust mesh is visible and what amount the director is asking for, so "present" and
// "drifting" can be told apart - which is the whole question under reduced motion.
//
// usage: node tools/dust.cjs <w> <h> <frac> [frac...]
//        REDUCED=1 node tools/dust.cjs 1440 900 0.06 0.3 0.75
const PW = 'C:/Users/MUS/CurriculumWebsite/node_modules/playwright';
const { chromium } = require(PW);
const W = Number(process.argv[2] || 1440);
const H = Number(process.argv[3] || 900);
const FR = process.argv.slice(4).map(Number);

(async () => {
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=gl', '--enable-unsafe-swiftshader'] });
  const opts = { viewport: { width: W, height: H } };
  if (process.env.REDUCED) opts.reducedMotion = 'reduce';
  const p = await b.newPage(opts);
  await p.goto('http://127.0.0.1:4321/', { waitUntil: 'load' });
  await p.waitForTimeout(2600);
  console.log(`\n${W}x${H}${process.env.REDUCED ? '  reducedMotion: reduce' : ''}`);
  for (const f of (FR.length ? FR : [0.06])) {
    await p.evaluate((f) => scrollTo({ top: Math.round((document.body.scrollHeight - innerHeight) * f), behavior: 'instant' }), f);
    await p.waitForTimeout(700);
    const r = await p.evaluate(() => {
      const w = window.__w.world;
      const c = w.dustCanvas;
      if (!c) return { err: 'no dust canvas' };
      const cx = c.getContext('2d', { willReadFrequently: true });
      const d = cx.getImageData(0, 0, c.width, c.height).data;
      let n = 0, sum = 0, sq = 0, nonzero = 0;
      for (let i = 0; i < d.length; i += 4 * 37) {          // sample every 37th pixel
        const l = 0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2];
        sum += l; sq += l * l; n++;
        if (l > 4) nonzero++;
      }
      const mean = sum / n;
      return {
        mean: Math.round(mean * 100) / 100,
        sd: Math.round(Math.sqrt(sq / n - mean * mean) * 100) / 100,
        litFraction: Math.round((nonzero / n) * 1000) / 1000,
        visible: w.dust ? w.dust.visible : null,
        uAmt: w.dustMat ? Math.round(w.dustMat.uniforms.uAmt.value * 1000) / 1000 : null,
        paused: w.dustVideo ? w.dustVideo.paused : null,
        currentTime: w.dustVideo ? Math.round(w.dustVideo.currentTime * 100) / 100 : null,
        still: w.dustStill === true, sampled: w._dustSampled === true,
        n: n,
      };
    });
    if (r.err) { console.log(`  f=${f}  ${r.err}`); continue; }
    console.log(`  f=${f}  canvas mean ${r.mean} sd ${r.sd} lit ${(r.litFraction * 100).toFixed(1)}% of ${r.n} px`
      + `   mesh visible ${r.visible} uAmt ${r.uAmt}`);
    console.log(`         video paused ${r.paused} currentTime ${r.currentTime}   stillMode ${r.still} sampledOnce ${r.sampled}`);
  }
  await b.close();
})().catch((e) => { console.error('FAILED', e.message); process.exit(1); });
