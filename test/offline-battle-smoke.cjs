// Serve public/ at http://127.0.0.1:3012 before running. PLAYWRIGHT_MODULE can override the installed runner.
const {chromium}=require(process.env.PLAYWRIGHT_MODULE || '/workspace/scratch/pb-smoke/node_modules/playwright-core');
(async()=>{
const browser=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox']});
const context=await browser.newContext({viewport:{width:430,height:900},serviceWorkers:'block'});
const page=await context.newPage();const outgoing=[],sockets=[],errors=[];
page.on('request',r=>{if(!r.url().startsWith('http://127.0.0.1:3012/')&&!r.url().startsWith('data:'))outgoing.push(r.url())});
page.on('websocket',w=>sockets.push(w.url()));page.on('pageerror',e=>errors.push(e.message));
await page.goto('http://127.0.0.1:3012/credits.html').catch(()=>{});
const first=await page.evaluate(async()=>{
 document.body.innerHTML='<canvas id="battle"></canvas>';
 const {OfflineBattle}=await import('/pulse/battle.js');window.ends=[];window.failures=[];
 window.ctrl=new OfflineBattle({canvas:document.querySelector('canvas'),onEnd:x=>ends.push(x),onError:e=>failures.push(e.message)});
 const e=await import('/engine.bundle.js');window.arenaInfo=e.ARENAS;
 const snap=await ctrl.start({team:{mons:['marshadow','lucario','blastoise'],gimmick:{kind:'mega',mon:0}},difficulty:3,seed:12345});
 return {snap,failures,arenas:e.ARENAS};
});
console.log('START',JSON.stringify({state:first.snap?.state,failures:first.failures}));if(!first.snap)throw Error('Start failed');
await page.waitForTimeout(250);
const paused=await page.evaluate(()=>{ctrl.command({kind:'manual',on:true});ctrl.command({kind:'steer',dir:1});ctrl.advanceFrames(1);ctrl.pause();return {frame:ctrl.snapshot().frame,dir:ctrl.debug.battle.rk.sides[0].dir}});
await page.waitForTimeout(150);
if(await page.evaluate(()=>ctrl.snapshot().frame)!==paused.frame)throw Error('Pause leaked simulation frames');
if(paused.dir!==0)throw Error('Pause left steering active');
await page.evaluate(()=>{ctrl.resume();ctrl.command({kind:'mega'});ctrl.advanceFrames(240,{render:true});ctrl.pause()});
await page.screenshot({path:'/workspace/scratch/pb-smoke/pulse-offline-battle.png'});
await context.setOffline(true);
const result=await page.evaluate(()=>{ctrl.advanceFrames(30000,{autoChoose:true});return {ends,failures,snapshot:ctrl.snapshot()}});
console.log('RESULT',JSON.stringify({ends:result.ends,failures:result.failures,megaDone:result.snapshot.megaDone}));
if(result.ends.length!==1||result.failures.length||!result.ends[0].frames||!result.snapshot.megaDone)throw Error('Incomplete match');
await page.evaluate(()=>{ctrl.surrender();ctrl.advanceFrames(10);ctrl.destroy()});
if(sockets.length||outgoing.length||errors.length)throw Error(JSON.stringify({sockets,outgoing,errors}));
console.log('PASS: completed browser-only match after network disabled; pause stable; steering reset; one result; no WebSocket/outbound requests/errors.');await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
