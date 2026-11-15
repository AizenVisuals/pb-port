import{test}from'node:test';import assert from'node:assert/strict';
import{engine,createSimulation}from'../server/engine.mjs';
import{configureGrowthBattle,evolutionAssets}from'../public/pulse/growth-battle.js';
import{EVOLUTIONS}from'../public/pulse/growth.js';
async function arena(key='bulbasaur',level=16,held={},callbacks={}){
 await engine.loadRankedAssets(evolutionAssets([key,'rattata']));
 const b=await createSimulation(31,[{name:'QA',trainer:'red',mons:[key],bot:true},{name:'CPU',trainer:'blue',mons:['rattata'],bot:true}],'stadium');
 const selected={[key]:[key==='totodile'?'pulseBasics:Scratch':'gibleAT:Tackle']};
 const growth=configureGrowthBattle(b,engine,{levels:{[key]:level},opponentLevel:5,selected,held,preview:k=>EVOLUTIONS[k]&&level>=EVOLUTIONS[k][1]?{target:EVOLUTIONS[k][0],moves:selected[key]}:null,...callbacks});
 return {b,growth,actor:b.teams[0].mons[0]};
}
const step=({b,growth})=>{growth.before();engine.stepRanked(b);growth.after();};
test('six starters run the native PB evolution cinematic without Mega and keep HP proportion',async()=>{
 for(const key of ['bulbasaur','charmander','squirtle','chikorita','cyndaquil','totodile']){
  let evolved;const game=await arena(key,EVOLUTIONS[key][1],{}, {onEvolve:(from,to)=>evolved={from,to}});const {b,actor,growth}=game;
  actor.hp=actor.maxHp*.6;
  for(let i=0;i<1200&&!evolved&&!b.done;i++){if(b.phase==='fight')growth.requestEvolution();step(game);}
  assert.deepEqual(evolved,{from:key,to:EVOLUTIONS[key][0]},key);assert.equal(actor.mega,false,key);assert.equal(actor.pulseEvolving,false,key);assert.equal(b.cinematic,false,key);assert.equal(actor.level,EVOLUTIONS[key][1]);assert(actor.hp/actor.maxHp<=.600001,key);assert.equal(actor.moves.length,1,key);
 }
});
test('Sitrus triggers exactly once, heals quarter HP and calls the inventory transaction',async()=>{
 const events=[],consumed=[];const game=await arena('bulbasaur',16,{bulbasaur:'sitrusberry'},{onConsume:e=>{consumed.push(e);return true;},onEvent:e=>events.push(e)});
 for(let i=0;i<300&&game.b.phase!=='fight';i++)step(game);
 game.actor.hp=game.actor.maxHp*.4;const before=game.actor.hp;game.growth.after();assert.equal(game.actor.hp,before+Math.floor(game.actor.maxHp/4));game.actor.hp=game.actor.maxHp*.3;game.growth.after();assert.equal(consumed.length,1);assert.equal(events.filter(e=>e.kind==='item').length,1);
});
test('Oran restores ten canonical HP; berries cure only their status and failed inventory transactions cannot heal',async()=>{
 const game=await arena('bulbasaur',16,{bulbasaur:'oranberry'});for(let i=0;i<300&&game.b.phase!=='fight';i++)step(game);game.actor.hp=90;game.growth.after();assert.equal(game.actor.hp,180);
 for(const [item,status]of [['cheriberry','par'],['pechaberry','psn'],['chestoberry','slp'],['lumberry','brn']]){const g=await arena('bulbasaur',16,{bulbasaur:item});for(let i=0;i<300&&g.b.phase!=='fight';i++)step(g);g.actor.status=status;g.growth.after();assert.equal(g.actor.status,null,item);}
 const failed=await arena('bulbasaur',16,{bulbasaur:'sitrusberry'},{onConsume:()=>false});for(let i=0;i<300&&failed.b.phase!=='fight';i++)step(failed);failed.actor.hp=90;failed.growth.after();assert.equal(failed.actor.hp,90);
});
test('Leftovers stays equipped and heals once per six-second interval; fainted Pokémon cannot consume berries',async()=>{
 let consumed=0;const game=await arena('bulbasaur',16,{bulbasaur:'leftovers'},{onConsume:()=>{consumed++;return true;}});for(let i=0;i<300&&game.b.phase!=='fight';i++)step(game);game.b.tick=360;game.actor.hp=200;game.growth.after();const after=game.actor.hp;assert.equal(after,200+Math.floor(game.actor.maxHp/16));game.growth.after();assert.equal(game.actor.hp,after);game.b.tick=720;game.growth.after();assert(game.actor.hp>after);assert.equal(consumed,0);
 const dead=await arena('bulbasaur',16,{bulbasaur:'oranberry'},{onConsume:()=>{throw Error('Must not consume');}});dead.b.phase='fight';dead.actor.fainted=true;dead.actor.hp=0;dead.growth.after();assert.equal(dead.actor.hp,0);
});

test('Lum cures confusion and resets persistent ailment counters',async()=>{
 const game=await arena('bulbasaur',16,{bulbasaur:'lumberry'});for(let i=0;i<300&&game.b.phase!=='fight';i++)step(game);
 Object.assign(game.actor,{status:null,confusedT:300,statusT:120,toxic:true,toxicN:4,sleepT:80,rkStDmg:19});game.growth.after();
 for(const field of ['confusedT','statusT','toxicN','sleepT','rkStDmg'])assert.equal(game.actor[field],0,field);assert.equal(game.actor.toxic,false);
});
