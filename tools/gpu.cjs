const PW='C:/Users/MUS/CurriculumWebsite/node_modules/playwright';
const { chromium } = require(PW);
const args = (process.env.GLARGS || '--use-gl=angle,--use-angle=gl,--enable-unsafe-swiftshader').split(',');
(async () => {
  const b = await chromium.launch({ args, headless: process.env.HEADFUL ? false : true });
  const p = await b.newPage({ viewport: { width: 800, height: 600 } });
  await p.goto('about:blank');
  const info = await p.evaluate(() => {
    const c = document.createElement('canvas');
    const g = c.getContext('webgl2') || c.getContext('webgl');
    if (!g) return { err: 'no webgl' };
    const d = g.getExtension('WEBGL_debug_renderer_info');
    return {
      vendor: d ? g.getParameter(d.UNMASKED_VENDOR_WEBGL) : g.getParameter(g.VENDOR),
      renderer: d ? g.getParameter(d.UNMASKED_RENDERER_WEBGL) : g.getParameter(g.RENDERER),
      version: g.getParameter(g.VERSION),
      maxTex: g.getParameter(g.MAX_TEXTURE_SIZE),
    };
  });
  console.log(JSON.stringify(info));
  await b.close();
})();
