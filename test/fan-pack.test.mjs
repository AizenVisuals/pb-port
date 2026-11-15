import{test}from'node:test';import assert from'node:assert/strict';
import{engine,createSimulation}from'../server/engine.mjs';import{FAN_PACK}from'../public/custom/fan-pack-data.js';
const total=stats=>Object.values(stats).reduce((sum,n)=>sum+n,0);
test('fan final forms register canonical named move behavior and intended stat budgets',()=>{
 for(const entry of FAN_PACK){assert(engine.ROSTER.includes(entry.key),entry.key);assert.equal(total(entry.stats),entry.key==='eereon'?525:530,entry.key);assert.equal(entry.defaults.length,4);assert.deepEqual(engine.INFO[entry.key].types,entry.types);for(const move of entry.pool){const runtime=engine.moveObj(move.id),source=engine.moveObj(move.source);assert(runtime,move.id);assert(source,move.source);assert.equal(runtime.name,move.name);assert.equal(runtime.type,source.type);assert.equal(runtime.power,source.power);assert.equal(runtime.cooldown,move.cd);}}
});
test('Mega Absol Z retains canonical types, stats and Sharpness',()=>{
 const absol=engine.pulseSpeciesDefinition('absolMegaZ');assert.deepEqual(absol.types,['dark','ghost']);assert.deepEqual(absol.base,{hp:65,atk:154,def:60,spa:75,spd:60,spe:151});assert.equal(total(absol.base),565);assert.equal(absol.rkAbility,'Sharpness');assert.equal(absol.mega,undefined);assert.equal(engine.INFO.absolNM.mega,'absolMegaZ');
});
test('Ferunoga completes a local real-engine battle using its registered kit',async()=>{
 const b=await createSimulation(71,[{name:'Fan',trainer:'red',mons:['ferunoga'],bot:true},{name:'Native',trainer:'blue',mons:['charizard'],bot:true}],'stadium');for(let n=0;n<18000&&!b.done;n++)engine.stepRanked(b);assert(b.done);assert(b.useLog.Flamethrower>0);assert(b.useLog['Dark Pulse']>0);assert(b.fighters.every(m=>Number.isFinite(m.hp)));assert(b.teams[0].mons[0].sp.anims.Idle.sheet.width>0);
});
test('Mega Absol Z applies Sharpness in actual battle and preserves HP and selected moves',async()=>{
 const b=await createSimulation(2026,[{name:'Absol',trainer:'red',mons:['absolNM'],gimmick:{kind:'mega',mon:0}},{name:'Other',trainer:'blue',mons:['eereon']}],'stadium');for(const side of[0,1])engine.applyInput(b,{kind:'autoatk',on:false,side});while(b.phase!=='fight'&&b.frame<1000)engine.stepRanked(b);const a=b.fighters[0],names=a.moves.map(m=>m.name);a.hp=Math.floor(a.maxHp/2);const hp=a.hp;engine.stepRanked(b,[{kind:'mega',side:0}]);for(let n=0;n<700;n++)engine.stepRanked(b);assert.equal(a.spec.name,'MEGA ABSOL Z');assert.equal(a.spec.rkAbility,'Sharpness');assert.deepEqual(a.types,['dark','ghost']);assert.equal(a.hp,hp);assert.deepEqual(a.moves.map(m=>m.name),names);assert.equal(b.megaLog.length,1);
});
