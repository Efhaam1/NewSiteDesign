const PW='C:/Users/MUS/CurriculumWebsite/node_modules/playwright';
const { chromium }=require(PW);
(async()=>{ const b=await chromium.launch();
  const p=await b.newPage({viewport:{width:900,height:2400},deviceScaleFactor:2});
  p.on('pageerror',e=>console.log('ERR',e.message));
  await p.goto('http://127.0.0.1:4321/p-glance.html'); await p.waitForTimeout(1200);
  await p.screenshot({path:'wb-test/pglance.png',fullPage:true}); await b.close(); })();
