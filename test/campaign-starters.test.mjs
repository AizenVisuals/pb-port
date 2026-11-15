import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {engine,createSimulation} from '../server/engine.mjs';
import {CAMPAIGN_STARTERS} from '../public/custom/starters-data.js';
test('campaign starters have independent species, sprites and four PB moves',async()=>{
 const roster=JSON.parse(await readFile(new URL('../public/roster.json',import.meta.url)));
 for(const mon of CAMPAIGN_STARTERS){assert.ok(engine.ROSTER.includes(mon.key));assert.equal(engine.INFO[mon.key].dex,mon.dex);assert.notEqual(mon.dex,engine.INFO[mon.template].dex);assert.equal(mon.defaults.length,4);assert.deepEqual(engine.INFO[mon.key].stats,mon.stats);assert.ok(roster.some(m=>m.key===mon.key));for(const id of mon.defaults)assert.ok(engine.moveObj(id));}
});
for(const key of ['bulbasaur','charmander','squirtle'])test(`${key} completes a real local PB battle and uses its moves`,async()=>{
 const b=await createSimulation(17,[{name:'Inicial',trainer:'red',mons:[key],bot:true},{name:'Rival',trainer:'blue',mons:['marshadow'],bot:true}],'stadium');
 for(let i=0;i<20000&&!b.done;i++)engine.stepRanked(b);
 assert.ok(b.done);assert.ok(b.frame>300);const actor=b.teams[0].mons[0];assert.equal(actor.spec.dex,engine.INFO[key].dex);assert.ok(actor.sp.anims.Idle.sheet.width>0);assert.ok(actor.sp.anims.Attack.sheet.width>0);assert.ok(engine.INFO[key].pool.some(m=>b.useLog[m.name]>0));
});
test('all chapter opponents are registered with usable PB animations and moves',async()=>{
 const {CHAPTER_ONE}=await import('../public/pulse/campaign.js');
 for(const key of new Set(CHAPTER_ONE.flatMap(s=>[...s.opponents,...(s.wild?[s.wild]:[])]))){assert.ok(engine.INFO[key],key);assert.ok(engine.legalMoves(key).length>0,key);await engine.loadRankedAssets([key]);const assets=await engine.loadRankedAssets([]);assert.ok(assets.species[engine.INFO[key].dex].anims.Idle.sheet.width>0,key);}
});
