// QA only: isolated temporary database and controlled clock; never production accounts.
import {createRequire} from 'node:module';import {mkdtemp,readFile,rm} from 'node:fs/promises';import {tmpdir} from 'node:os';
import {createServer} from '../pulse-online/server.mjs';
const require=createRequire(import.meta.url),{chromium}=require(process.env.PULSE_PLAYWRIGHT_MODULE||'playwright-core');
const clock={base:Date.now(),origin:Date.now(),speed:1};const now=()=>clock.base+(Date.now()-clock.origin)*clock.speed;
const data=await mkdtemp(tmpdir()+'/pulse-pvp-e2e-'),{server,db}=await createServer({port:0,host:'127.0.0.1',dataDir:data,arenaNow:now});await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port;
const browser=await chromium.launch({executablePath:process.env.PULSE_CHROMIUM||chromium.executablePath(),headless:true,args:['--no-sandbox']});
try{
const roster=JSON.parse(await readFile(new URL('../public/roster.json',import.meta.url)));
const pages=await Promise.all([browser.newPage({viewport:{width:844,height:390}}),browser.newPage({viewport:{width:844,height:390}})]);
for(const [i,p] of pages.entries()){p.on('pageerror',e=>console.error('PAGE',i,e.message));await p.goto((process.env.PULSE_WEB_URL||'http://127.0.0.1:3012')+'/credits.html');await p.evaluate(async({base,i})=>{const {createOnlineClient}=await import('/pulse/online.js');window.client=createOnlineClient({baseUrl:base});const res=await client.guestSignIn({nick:'Arena QA '+i,trainer_key:i?'blue':'red',team:'valor'});if(!res.ok)throw Error(JSON.stringify(res));}, {base,i});}
const rotation=await pages[0].evaluate(async()=> (await client.arenaRotation()).data);
const keys=rotation.pokemon.filter(k=>roster.find(m=>m.key===k)?.defaults.length===4).slice(0,6);if(keys.length<6)throw Error('Not enough playable rotation');
const teams=[keys.slice(0,3),keys.slice(3,6)].map(mons=>({mons,moves:mons.map(k=>roster.find(m=>m.key===k).defaults),gimmick:null}));
await pages[0].evaluate(async team=>{const r=await client.arenaJoin(team);if(!r.ok)throw Error(JSON.stringify(r));},teams[0]);await pages[1].evaluate(async team=>{const r=await client.arenaJoin(team);if(!r.ok)throw Error(JSON.stringify(r));},teams[1]);
await Promise.all(pages.map((p,i)=>p.evaluate(async i=>{
 const match=(await client.arenaQueue()).data.match;window.match=match;window.states={};window.netErrors=[];window.final=null;
 const {ArenaBattle}=await import('/pulse/arena-battle.js');const canvas=document.createElement('canvas');canvas.width=640;canvas.height=360;document.body.replaceChildren(canvas);
 const runtime=window.runtime=new ArenaBattle({canvas,send:msg=>window.ws?.send(JSON.stringify(msg)),onError:e=>netErrors.push(e.message),onEnd:r=>window.final=r});
 window.ws=await client.openArenaSocket({onMessage:msg=>{runtime.receive(msg);if(msg.t==='tick'&&runtime.battle){const b=runtime.battle;states[msg.upTo]=JSON.stringify({hash:runtime.engine.stateHash(b),frame:b.frame,phase:b.phase,teams:b.teams.map(t=>t.mons.map(m=>({key:m.rkKey,hp:m.hp,x:m.x,y:m.y,level:m.level,fainted:m.fainted,stages:m.stages}))),done:b.done});}},onClose:()=>runtime.disconnected()});
 await runtime.connectMatch(match,'QA '+i,i?'blue':'red');ws.send(JSON.stringify({t:'ready',match_id:match.match_id}));
 },i)));
await pages[0].waitForFunction(()=>runtime.battle?.frame>130,{timeout:20000});
await pages[1].evaluate(()=>{runtime.command({kind:'manual',on:true});runtime.command({kind:'steer',dir:5});runtime.command({kind:'move',index:0});});
await pages[0].evaluate(()=>runtime.command({kind:'move',index:1}));
await pages[0].waitForFunction(()=>runtime.battle?.frame>260,{timeout:20000});
const snapshots=await Promise.all(pages.map(p=>p.evaluate(()=>({side:runtime.playerSide,states,errors:netErrors,level:runtime.snapshot().player.level}))));
const common=Object.keys(snapshots[0].states).filter(k=>snapshots[1].states[k]&&Number(k)>150);if(!common.length)throw Error('No common frames');for(const key of common)if(snapshots[0].states[key]!==snapshots[1].states[key])throw Error('Desync frame '+key+'\n'+snapshots[0].states[key]+'\n'+snapshots[1].states[key]);if(snapshots.some(s=>s.errors.length||s.level!==100))throw Error('Invalid level/runtime errors');
console.log('PASS two browsers: canonical sides',snapshots.map(s=>s.side),'Lv100; synchronized frames',common.length);
clock.base=now();clock.origin=Date.now();clock.speed=30;
await Promise.all(pages.map(p=>p.waitForFunction(()=>window.final,{timeout:40000})));
const outcomes=await Promise.all(pages.map(p=>p.evaluate(async()=>({won:final.won,points:(await client.arenaStanding()).data.points,reason:final.reason,errors:netErrors}))));
if(outcomes[0].won===outcomes[1].won||outcomes.filter(o=>o.points===20).length!==1||outcomes.some(o=>o.errors.length))throw Error(JSON.stringify(outcomes));
console.log('PASS complete natural PvP with two matching reports',outcomes);
}finally{await browser.close();await new Promise(r=>server.close(r));db.close();await rm(data,{recursive:true,force:true});}
