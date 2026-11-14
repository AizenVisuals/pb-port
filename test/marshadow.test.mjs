import {test} from 'node:test';
import assert from 'node:assert/strict';
import {engine,createSimulation} from '../server/engine.mjs';
import {stealBoosts} from '../public/custom/marshadow.js';
test('Marshadow registers independent sprites, canonical typing and six legal moves',async()=>{
 assert.equal(engine.INFO.marshadow.dex,'0802');assert.deepEqual(engine.INFO.marshadow.types,['fighting','ghost']);
 assert.equal(engine.INFO.marshadow.stats.spe,125);assert.equal(engine.INFO.marshadow.ability,'Technician');
 assert.ok(engine.ROSTER.includes('marshadow'));
 for(const m of engine.INFO.marshadow.pool)assert.equal(engine.moveObj(m.id).name,m.name);
 const b=await createSimulation(151,[{name:'Marshadow',trainer:'red',mons:['marshadow'],bot:true},{name:'Lucario',trainer:'blue',mons:['lucario'],bot:true}],'stadium');
 assert.equal(b.fighters[0].spec.rkAbility,'Technician');
 for(let i=0;i<16000&&!b.done;i++)engine.stepRanked(b);
 assert.ok(b.done);assert.ok(b.useLog['Spectral Thief']>0);
});
test('Spectral Thief transfers only positive boosts, capped at two stages total',()=>{
 const attacker={stages:{atk:0,def:0,spa:0,spd:0,spe:0}},target={stages:{atk:4,def:2,spa:-2,spe:3}};
 const battle={changeStage(mon,key,delta){mon.stages[key]=(mon.stages[key]||0)+delta;}};
 assert.equal(stealBoosts(battle,attacker,target),2);assert.equal(attacker.stages.atk,2);assert.equal(target.stages.atk,2);assert.equal(target.stages.spa,-2);assert.equal(target.stages.spe,3);
 attacker.stages={atk:6,def:6,spa:6,spd:6,spe:6};assert.equal(stealBoosts(battle,attacker,target),0);assert.equal(target.stages.atk,2);
});
