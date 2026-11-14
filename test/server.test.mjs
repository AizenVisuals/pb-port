import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import WebSocket from 'ws';
let child,base,dir; const connections=[];
before(async()=>{
 dir=await mkdtemp(join(tmpdir(),'pb-port-test-'));
 child=spawn(process.execPath,['server/index.mjs'],{env:{...process.env,PORT:'0',DATA_DIR:dir},stdio:['ignore','pipe','pipe']});
 let errors='';child.stderr.on('data',b=>errors+=b);
 base=await new Promise((resolve,reject)=>{const timeout=setTimeout(()=>reject(Error('Server startup timeout '+errors)),15000);child.stdout.on('data',b=>{const m=String(b).match(/http:\/\/localhost:(\d+)/);if(m){clearTimeout(timeout);resolve('http://127.0.0.1:'+m[1]);}});child.on('exit',code=>{clearTimeout(timeout);reject(Error(`Server exited ${code}: ${errors}`));});});
});
after(async()=>{for(const c of connections)c.ws.close();child?.kill();await new Promise(r=>child?.once('exit',r));await rm(dir,{recursive:true,force:true});});
async function connect(name){
 const ws=new WebSocket(base.replace('http','ws'));const inbox=[];const c={ws,inbox,send:e=>ws.send(JSON.stringify(e)),wait:async(type,timeout=30000)=>{const start=Date.now();while(Date.now()-start<timeout){const i=inbox.findIndex(e=>e.t===type);if(i>=0)return inbox.splice(i,1)[0];const error=inbox.find(e=>e.t==='error');if(error&&type!=='error')throw Error(error.msg);await new Promise(r=>setTimeout(r,20));}throw Error(`Timed out ${type}: ${JSON.stringify(inbox)}`);}};
 ws.on('message',b=>inbox.push(JSON.parse(b)));await new Promise((resolve,reject)=>{ws.once('open',resolve);ws.once('error',reject)});c.send({t:'hello',name,trainer:'red'});c.welcome=await c.wait('welcome');connections.push(c);return c;
}
const team={mons:['venusaur','charizard','blastoise']};
test('HTTP serves local client and disables production sign-in',async()=>{assert.equal((await fetch(base)).status,200);const auth=await(await fetch(base+'/api/auth')).json();assert.deepEqual(auth,{providers:[],guests:true});const version=await(await fetch(base+'/api/version')).json();assert.equal(version.bundle,null);assert.equal((await fetch(base+'/server/index.mjs')).status,404);});
test('profiles issue independent tokens and invalid teams are rejected',async()=>{const a=await connect('Ágata');const b=await connect('Brock');assert.notEqual(a.welcome.token,b.welcome.token);a.send({t:'queue',mode:'practice',format:'3v3',team:{mons:['charizard','charizard','blastoise']}});assert.match((await a.wait('error')).msg,/diferentes/);});
test('practice loads the actual engine, ticks, accepts input, and surrenders',async()=>{const a=await connect('Practice');a.send({t:'queue',mode:'practice',format:'3v3',team,arena:'stadium'});const m=await a.wait('match',60000);assert.equal(m.teams[1].bot,true);a.send({t:'ready',id:m.id});await a.wait('go');a.send({t:'input',kind:'manual',on:true});a.send({t:'input',kind:'steer',dir:3});const tick=await a.wait('tick');assert.ok(tick.upTo>0);assert.ok(tick.inputs.some(i=>i.kind==='manual'&&i.side===0));a.send({t:'surrender'});const end=await a.wait('end');assert.equal(end.winner,1);assert.equal(end.mode,'practice');});
test('two clients share seed, commands and ranked result; cancellation removes queue',async()=>{const a=await connect('RedPlayer');const b=await connect('BluePlayer');a.send({t:'queue',mode:'ranked',format:'3v3',team});await a.wait('queued');a.send({t:'cancel'});await a.wait('unqueued');a.send({t:'queue',mode:'ranked',format:'3v3',team});await a.wait('queued');b.send({t:'queue',mode:'ranked',format:'3v3',team});const [ma,mb]=await Promise.all([a.wait('match'),b.wait('match')]);assert.equal(ma.id,mb.id);assert.equal(ma.seed,mb.seed);a.send({t:'ready',id:ma.id});b.send({t:'ready',id:mb.id});await Promise.all([a.wait('go'),b.wait('go')]);a.send({t:'input',kind:'guard',side:1});const [ta,tb]=await Promise.all([a.wait('tick'),b.wait('tick')]);assert.deepEqual(ta,tb);assert.equal(ta.inputs.find(i=>i.kind==='guard').side,0);a.send({t:'surrender'});const [ea,eb]=await Promise.all([a.wait('end'),b.wait('end')]);assert.equal(ea.winner,1);assert.equal(eb.wins,1);b.send({t:'board',format:'3v3'});assert.equal((await b.wait('board')).rows[0].name,'BluePlayer');});
