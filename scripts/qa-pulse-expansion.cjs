const {chromium}=require('/tmp/pulse-qa/node_modules/playwright-core');
const fs=require('fs');
(async()=>{
 const browser=await chromium.launch({executablePath:'/home/bloody/.cache/ms-playwright/chromium-1248/chrome-linux64/chrome',headless:true,args:['--no-sandbox']});
 try{
  const page=await browser.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:3012/credits.html');
  const result=await page.evaluate(async()=>{
   const e=await import('/engine.bundle.js');const {EXPANSION_SPECIES:mons}=await import('/custom/expansion-data.js');
   for(const m of mons){if(!e.INFO[m.key])throw Error('Not installed '+m.key);for(const d of m.pool)if(!e.moveObj(d.id))throw Error('Move not installed '+d.id);const s=e.pulseSpeciesDefinition(m.key);if(s.dex!==m.dex)throw Error('Wrong species '+m.key);}
   const sample=mons.filter((m,i)=>i%Math.ceil(mons.length/24)===0).map(m=>m.key);
   const assets=await e.loadRankedAssets(sample);let animated=0;
   for(const key of sample){const m=e.INFO[key];const a=assets.species[m.dex];if(!a?.anims?.Walk)throw Error('Walk missing '+key);animated++;}
   const canvas=document.createElement('canvas');document.body.append(canvas);
   const {OfflineBattle}=await import('/pulse/battle.js');const runtime=new OfflineBattle({canvas});
   const a=mons.find(m=>m.key==='riolu')||mons[0];const b=mons.find(m=>m.key==='larvitar')||mons[1];
   await runtime.start({team:{mons:[a.key],moves:[a.defaults]},botTeam:{mons:[b.key],moves:[b.defaults]},format:'1v1',seed:177});
   runtime._stopLoop();for(let i=0;i<600&&!runtime.result;i++)runtime.advanceFrames(1,{render:i%60===0});
   const snapshot=runtime.snapshot();runtime.destroy?.();
   return {installed:mons.length,animatedSamples:animated,battle:[a.key,b.key],state:snapshot.state,frames:600};
  });
  if(errors.length)throw Error(errors.join('\n'));fs.writeFileSync('research/expansion/runtime-result.json',JSON.stringify(result,null,2));console.log(result);
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1)});
