// throwaway: hero geometry with the ghost CTA removed and the micro relabelled, vs shipped.
const PW = 'C:/Users/MUS/CurriculumWebsite/node_modules/playwright';
const { chromium } = require(PW);
const W = +process.argv[2], H = +process.argv[3];
const READ = () => {
  const q = (s) => { const e = document.querySelector(s); if (!e) return null; const r = e.getBoundingClientRect(); return [Math.round(r.width*100)/100, Math.round(r.height*100)/100, Math.round(r.top*100)/100, Math.round(r.bottom*100)/100]; };
  const st = document.querySelector('.act-threshold .act-stage');
  const pad = document.querySelector('.hero');
  let low = 0;
  for (const e of pad.querySelectorAll('*')) { const r = e.getBoundingClientRect(); if (r.height>0 && r.width>0 && getComputedStyle(e).visibility!=='hidden') low = Math.max(low, r.bottom); }
  return { row: q('.cta-row'), foot: q('.hero-foot'), base: q('.hero-base'), tick: q('.ticker'), micro: q('.cta-row .tiny'), cta: q('.hero .cta:not(.ghost)'), lowestInk: Math.round(low*100)/100, fold: innerHeight, stageOver: st.scrollHeight - st.clientHeight };
};
(async () => {
  const b = await chromium.launch({ args: ['--use-gl=angle','--use-angle=gl','--enable-unsafe-swiftshader'] });
  const p = await b.newPage({ viewport:{width:W,height:H} });
  await p.goto('http://127.0.0.1:4321/', { waitUntil:'load' });
  await p.waitForTimeout(2600);
  await p.evaluate(()=>{const a=window.__w.engine.acts[0];scrollTo({top:Math.round(a.top+a.len*0.15),behavior:'instant'})});
  await p.waitForTimeout(1400);
  console.log(`${W}x${H} SHIPPED  `, JSON.stringify(await p.evaluate(READ)));
  await p.evaluate(()=>{
    document.querySelector('.hero .cta.ghost').remove();
    document.querySelector('.hero .cta-row .tiny').textContent = 'no email, no signup';
    document.querySelector('.hero .cta:not(.ghost)').textContent = 'Open a free session';
  });
  await p.waitForTimeout(700);
  console.log(`${W}x${H} CANDIDATE`, JSON.stringify(await p.evaluate(READ)));
  await b.close();
})();
