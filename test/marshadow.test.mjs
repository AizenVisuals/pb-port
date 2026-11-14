import {test} from 'node:test';
import assert from 'node:assert/strict';
import {engine,createSimulation} from '../server/engine.mjs';
import {stealBoosts} from '../public/custom/marshadow.js';
test('Marshadow registers independent sprites, canonical typing and expanded legal moves',async()=>{
 assert.equal(engine.INFO.marshadow.dex,'0802');assert.deepEqual(engine.INFO.marshadow.types,['fighting','ghost']);
 assert.equal(engine.INFO.marshadow.stats.spe,125);assert.equal(engine.INFO.marshadow.ability,'Technician');
 assert.ok(engine.ROSTER.includes('marshadow'));assert.ok(engine.INFO.marshadow.pool.length>=28);for(const name of ['Fire Punch','Thunder Punch','Drain Punch','Hex','Will-O-Wisp','Bulk Up'])assert.ok(engine.INFO.marshadow.pool.some(m=>m.name===name));assert.equal(engine.usesPerStay('Bulk Up'),2);
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

test('fan-made Mega transforms once, retains four selected moves and does not heal',async()=>{
 const b=await createSimulation(2026,[{name:'Mega',trainer:'red',mons:['marshadow'],gimmick:{kind:'mega',mon:0}},{name:'Target',trainer:'blue',mons:['blastoise']}],'stadium');
 for(const side of [0,1])engine.applyInput(b,{kind:'autoatk',on:false,side});
 while(b.phase!=='fight'&&b.frame<1000)engine.stepRanked(b);
 const actor=b.fighters[0];actor.hp=Math.floor(actor.maxHp*.5);const hp=actor.hp;
 engine.stepRanked(b,[{kind:'mega',side:0}]);
 for(let i=0;i<700;i++)engine.stepRanked(b);
 assert.equal(actor.spec.dex,'0802mega');assert.equal(actor.spec.base.atk,145);assert.equal(actor.spec.base.spe,125);
 assert.equal(actor.hp,hp);assert.equal(actor.moves.length,4);assert.equal(b.megaLog.length,1);
 engine.stepRanked(b,[{kind:'mega',side:0}]);for(let i=0;i<100;i++)engine.stepRanked(b);
 assert.equal(b.megaLog.length,1);assert.ok(actor.sp.anims.Idle.sheet.width>0);assert.ok(actor.sp.anims.Attack.sheet.width>0);
});
