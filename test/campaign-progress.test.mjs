import {test} from 'node:test';import assert from 'node:assert/strict';import {readFile} from 'node:fs/promises';import {createProgression} from '../public/pulse/progression.js';
const roster=JSON.parse(await readFile(new URL('../public/roster.json',import.meta.url)));const disk=()=>{const d=new Map();return{getItem:k=>d.get(k)??null,setItem:(k,v)=>d.set(k,v)}};const make=(storage=disk(),profileMode='journey')=>{const p=createProgression({storage,profileMode});assert.equal(p.setCatalog(roster).ok,true);return p};
test('four- and five-member journey teams survive catalog load and reload intact',()=>{
 for(const size of [4,5]){
  const storage=disk(),p=make(storage);p.chooseStarter('bulbasaur');
  const data=JSON.parse(p.exportSave());data.unlocked=['bulbasaur','charmander','squirtle','pidgey','rattata'].slice(0,size);data.team.mons=[...data.unlocked];
  assert.equal(p.importSave(JSON.stringify(data)).ok,true);
  const q=make(storage);assert.deepEqual(q.getSave().team.mons,data.team.mons);
 }
});
test('full chapter can fail, resume and clear with exactly one badge and first-clear rewards',async()=>{
 const {CHAPTER_ONE}=await import('../public/pulse/campaign.js');const storage=disk();let p=make(storage);p.chooseStarter('squirtle');
 const initial=p.getSave().coins;
 for(const stage of CHAPTER_ONE){
  const failureId='loss-'+stage.id;p.beginStage(stage.id,failureId);
  if(stage.wild)p.resolveEncounter('fled');
  assert.equal(p.completeStage({id:failureId,won:false,frames:600}).coins,0);
  assert(!p.getSave().journey.cleared.includes(stage.id));
  const id='win-'+stage.id;assert.equal(p.beginStage(stage.id,id).ok,true);
  p=make(storage);assert.equal(p.getSave().journey.active.id,id);
  if(stage.wild)p.resolveEncounter('defeated');
  assert.equal(p.completeStage({id,won:true,frames:600}).coins,stage.firstClearCoins);
  assert.equal(p.completeStage({id,won:true,frames:600}).ok,false);
 }
 p=make(storage);assert.equal(p.getSave().journey.cleared.length,10);
 assert.deepEqual(p.getSave().journey.badges,['boulder']);
 assert.equal(p.getSave().coins,initial+CHAPTER_ONE.reduce((n,s)=>n+s.firstClearCoins,0));
 assert.equal(p.beginStage('1-10','repeat-final').ok,true);assert.equal(p.completeStage({id:'repeat-final',won:true,frames:600}).coins,0);
 assert.deepEqual(make(storage).getSave().journey.badges,['boulder']);
});
test('new journey selects one initial exactly once and reloads without bonus team',()=>{const storage=disk(),p=make(storage);assert.deepEqual(p.getSave().unlocked,[]);assert.equal(p.chooseStarter('marshadow').ok,false);assert.equal(p.chooseStarter('bulbasaur').ok,true);assert.deepEqual(p.getSave().team.mons,['bulbasaur']);assert.equal(p.chooseStarter('squirtle').ok,false);const q=make(storage);assert.equal(q.getSave().journey.starter,'bulbasaur');assert.deepEqual(q.getSave().unlocked,['bulbasaur']);assert.equal(q.importSave(p.exportSave()).ok,true)});
test('legacy profile keeps its collection, balance and team when choosing a journey starter',()=>{const p=make(disk(),'legacy'),before=p.getSave();p.chooseStarter('squirtle');assert.deepEqual(p.getSave().team,before.team);assert.equal(p.getSave().coins,before.coins);assert.ok(before.unlocked.every(k=>p.getSave().unlocked.includes(k)))});
test('chapter locks, result validation and first-clear rewards survive reloading',()=>{const storage=disk(),p=make(storage);p.chooseStarter('charmander');assert.equal(p.beginStage('1-10','x').ok,false);assert.equal(p.beginStage('1-1','battle-1').ok,true);assert.equal(p.beginStage('1-1','battle-2').ok,false);const q=make(storage);assert.equal(q.completeStage({id:'wrong',won:true,frames:600}).ok,false);assert.equal(q.completeStage({id:'battle-1',won:true,frames:2}).ok,false);assert.equal(q.completeStage({id:'battle-1',won:true,frames:600}).coins,80);assert.equal(q.completeStage({id:'battle-1',won:true,frames:600}).ok,false);q.beginStage('1-1','repeat');assert.equal(q.completeStage({id:'repeat',won:true,frames:600}).coins,0);assert.equal(q.beginStage('1-2','next').ok,true)});
test('invalid journey imports are transactional',()=>{const p=make();p.chooseStarter('squirtle');const before=p.exportSave();for(const change of [j=>j.cleared=['1-10'],j=>j.inventory.pokeball=-1,j=>j.badges=['boulder'],j=>j.starter='mewtwo']){const bad=JSON.parse(before);change(bad.journey);assert.equal(p.importSave(JSON.stringify(bad)).ok,false);assert.equal(p.exportSave(),before)}});
test('wild encounters, ball spending and capture are persistent and transactional',()=>{const storage=disk();const p=createProgression({storage,profileMode:'journey',rng:()=>0});p.setCatalog(roster);p.chooseStarter('bulbasaur');for(const stage of ['1-1','1-2']){p.beginStage(stage,stage);p.completeStage({id:stage,won:true,frames:600})}p.beginStage('1-3','wild-1');assert.equal(p.completeStage({id:'wild-1',won:true,frames:600}).ok,false);const before=p.getSave().journey.inventory.pokeball;assert.equal(p.captureWild({id:'wild-1',hpRatio:0}).ok,false);assert.equal(p.getSave().journey.inventory.pokeball,before);const result=p.captureWild({id:'wild-1',hpRatio:1});assert.equal(result.captured,true);assert.equal(p.getSave().journey.inventory.pokeball,before-1);assert.ok(p.getSave().unlocked.includes('pidgey'));assert.equal(p.captureWild({id:'wild-1'}).ok,false);const q=make(storage);assert.equal(q.getSave().journey.active.encounter.state,'captured');assert.equal(q.completeStage({id:'wild-1',won:true,frames:600}).ok,true);assert.equal(q.beginStage('1-4','wild-1').ok,false);});
test('invalid RNG never consumes a ball, and ball purchases charge once',()=>{const p=createProgression({storage:disk(),profileMode:'journey',rng:()=>1});p.setCatalog(roster);p.chooseStarter('squirtle');const balance=p.getSave().coins;assert.equal(p.buyPokeballs(5).spent,250);assert.equal(p.getSave().coins,balance-250);assert.equal(p.buyPokeballs(-1).ok,false);for(const stage of ['1-1','1-2']){p.beginStage(stage,stage);p.completeStage({id:stage,won:true,frames:600})}p.beginStage('1-3','wild');const before=p.exportSave();assert.equal(p.captureWild({id:'wild'}).ok,false);assert.equal(p.exportSave(),before)});
