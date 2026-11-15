const {chromium}=require('playwright-core');
const assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({executablePath:'/home/bloody/.cache/ms-playwright/chromium-1248/chrome-linux64/chrome',headless:true,args:['--no-sandbox']});
 const page=await browser.newPage({viewport:{width:844,height:390},hasTouch:true,isMobile:true});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:3012/pulse.html');
 await page.locator('.starter-option').first().click();await page.locator('.starter-dialog .primary-button').click();
 await page.waitForSelector('#app:not([hidden])');
 await page.evaluate(async()=>{
  const {OfflineBattle}=await import('/pulse/battle.js');const original=OfflineBattle.prototype.start;
  OfflineBattle.prototype.start=function(...args){window.qaBattle=this;const command=this.command.bind(this);window.qaCommands=[];this.command=input=>{window.qaCommands.push({...input});return command(input)};return original.apply(this,args)};
 });
 await page.locator('#home-journey').click();await page.locator('[data-stage="1-1"]').click();
 await page.waitForFunction(()=>window.qaBattle?.state==='running',null,{timeout:60000});
 await page.locator('#battle-auto').click();await page.waitForFunction(()=>qaBattle.snapshot().manual);
 const stick=await page.locator('#joystick').boundingBox();const move=await page.locator('[data-move="0"]').boundingBox();const guard=await page.locator('#battle-guard').boundingBox();
 const cdp=await page.context().newCDPSession(page);
 const finger=(id,x,y)=>({id,x,y,radiusX:5,radiusY:5,force:1});
 const a=finger(1,stick.x+stick.width/2+27,stick.y+stick.height/2),b=finger(2,move.x+move.width/2,move.y+move.height/2),c=finger(3,guard.x+guard.width/2,guard.y+guard.height/2);
 const touch=(type,touchPoints)=>cdp.send('Input.dispatchTouchEvent',{type,touchPoints});
 await page.evaluate(()=>{qaCommands.length=0;window.qaEvents=[];for(const n of ['pointerdown','pointerup','pointercancel','lostpointercapture'])document.addEventListener(n,e=>qaEvents.push([n,e.pointerId,e.target.id,e.target.className]));});
 await touch('touchStart',[a]);await touch('touchStart',[a,b]);
 assert.equal(await page.locator('[data-move="0"]').evaluate(e=>e.classList.contains('is-pressed')),true);
 await touch('touchEnd',[b]);
 const afterMove=await page.evaluate(()=>({commands:qaCommands,knob:document.querySelector('#joystick-knob').style.transform}));
 console.log(JSON.stringify({afterMove,events:await page.evaluate(()=>qaEvents)}));assert.equal(afterMove.commands.filter(x=>x.kind==='move').length,1);assert(!afterMove.commands.some(x=>x.kind==='steer'&&x.dir===0));assert(afterMove.knob);
 await touch('touchStart',[a,c]);await touch('touchEnd',[c]);
 assert.equal(await page.evaluate(()=>qaCommands.filter(x=>x.kind==='guard').length),1);
 await touch('touchMove',[{...a,x:a.x-54}]);
 assert.equal(await page.evaluate(()=>qaCommands.filter(x=>x.kind==='steer').at(-1).dir),5);
 await touch('touchEnd',[]);
 assert.equal(await page.evaluate(()=>qaCommands.filter(x=>x.kind==='steer').at(-1).dir),0);
 // A second finger on the stick cannot steal it or reset it when lifted.
 await page.evaluate(()=>qaCommands.length=0);
 await touch('touchStart',[a]);const d=finger(4,a.x-50,a.y);await touch('touchStart',[a,d]);await touch('touchEnd',[d]);
 assert(!await page.evaluate(()=>qaCommands.some(x=>x.kind==='steer'&&x.dir===0)));
 await touch('touchCancel',[]);assert.equal(await page.locator('#joystick-knob').evaluate(e=>e.style.transform),'');
 // Next gesture still works after cancellation, and keyboard click remains supported.
 await touch('touchStart',[a]);await touch('touchEnd',[]);
 await page.locator('[data-move="0"]').focus();await page.keyboard.press('Enter');
 assert.equal(await page.evaluate(()=>qaCommands.filter(x=>x.kind==='move').length),1);
 assert.deepEqual(errors,[]);
 await page.screenshot({path:'/tmp/pulse-qa/multitouch-phone.png'});
 console.log(JSON.stringify({pass:true,environment:'Chromium touch emulation / CDP',checks:['stick + move simultaneously','stick + guard','one command per touch','secondary stick finger ignored','cancel resets movement','gesture after cancel','keyboard activation'],errors}));
 await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
