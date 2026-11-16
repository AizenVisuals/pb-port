import{test}from'node:test';import assert from'node:assert/strict';
import{displayStats,displayMaxHp}from'../public/pulse/growth.js';
// Base stats do roster (iguais aos do engine INFO): Bulbasaur 45/49/49/65/65/45,
// Ivysaur 60/62/63/80/80/60, Venusaur 80/82/83/100/100/80, Charizard 78/84/78/109/85/100.
// Valores esperados conferidos contra o engine real em batalha (actor.st).
const BULBASAUR={hp:45,atk:49,def:49,spa:65,spd:65,spe:45};
const IVYSAUR={hp:60,atk:62,def:63,spa:80,spd:80,spe:60};
const VENUSAUR={hp:80,atk:82,def:83,spa:100,spd:100,spe:80};
const CHARIZARD={hp:78,atk:84,def:78,spa:109,spd:85,spe:100};
test('displayStats é a fórmula clássica com IV 31 (HP com a base inflada do engine)',()=>{
 assert.deepEqual(displayStats(BULBASAUR,5),{hp:25,atk:11,def:11,spa:13,spd:13,spe:11});
 assert.deepEqual(displayStats(BULBASAUR,16),{hp:58,atk:25,def:25,spa:30,spd:30,spe:24});
 assert.deepEqual(displayStats(BULBASAUR,20),{hp:71,atk:30,def:30,spa:37,spd:37,spe:29});
 assert.deepEqual(displayStats(BULBASAUR,32),{hp:107,atk:46,def:46,spa:56,spd:56,spe:43});
 assert.deepEqual(displayStats(BULBASAUR,40),{hp:132,atk:56,def:56,spa:69,spd:69,spe:53});
 assert.deepEqual(displayStats(BULBASAUR,100),{hp:315,atk:134,def:134,spa:166,spd:166,spe:126});
});
test('displayStats acompanha a evolução: Ivysaur e Venusaur nos níveis de evolução',()=>{
 assert.deepEqual(displayStats(IVYSAUR,16),{hp:65,atk:29,def:30,spa:35,spd:35,spe:29});
 assert.deepEqual(displayStats(IVYSAUR,32),{hp:120,atk:54,def:55,spa:66,spd:66,spe:53});
 assert.deepEqual(displayStats(VENUSAUR,32),{hp:137,atk:67,def:68,spa:78,spd:78,spe:66});
 assert.deepEqual(displayStats(CHARIZARD,50),{hp:206,atk:104,def:98,spa:129,spd:105,spe:120});
});
test('displayStats.hp é sempre displayMaxHp — e não o HP da fórmula oficial pura',()=>{
 for(const level of [1,5,16,40,50,100])assert.equal(displayStats(BULBASAUR,level).hp,displayMaxHp(45,level));
 // A fórmula oficial pura (base 45, IV 31) daria HP 21 no Nv. 5 e 98 no
 // Nv. 40; o jogo mostra o HP do engine (base inflada 87): 25 e 132.
 assert.equal(displayStats(BULBASAUR,5).hp,25);
 assert.equal(displayStats(BULBASAUR,40).hp,132);
});
test('displayStats bate com os stats reais do engine em batalha (Bulbasaur Nv. 40)',async()=>{
 const{engine,createSimulation}=await import('../server/engine.mjs');
 const{configureGrowthBattle}=await import('../public/pulse/growth-battle.js');
 const b=await createSimulation(11,[{name:'You',trainer:'red',mons:['bulbasaur']},{name:'CPU',trainer:'blue',mons:['rattata'],bot:true}],'stadium');
 const moves=engine.INFO.bulbasaur.defaults.slice(0,4);
 configureGrowthBattle(b,engine,{levels:{bulbasaur:40},selected:{bulbasaur:moves}});
 assert.deepEqual(b.teams[0].mons[0].st,displayStats(BULBASAUR,40));
 assert.equal(b.teams[0].mons[0].maxHp,displayStats(BULBASAUR,40).hp*9);
});
test('stats após evoluir em batalha são os da nova espécie no nível (Bulbasaur 16 → Ivysaur)',async()=>{
 const{engine,createSimulation}=await import('../server/engine.mjs');
 const{configureGrowthBattle}=await import('../public/pulse/growth-battle.js');
 await engine.loadRankedAssets(['ivysaur']);
 const b=await createSimulation(79,[{name:'You',trainer:'red',mons:['bulbasaur']},{name:'CPU',trainer:'blue',mons:['charmander','squirtle']}],'stadium');
 const actor=b.teams[0].mons[0],moves=engine.INFO.bulbasaur.defaults.slice(0,4);
 configureGrowthBattle(b,engine,{levels:{bulbasaur:16},selected:{bulbasaur:moves}});
 for(const side of[0,1]){engine.applyInput(b,{kind:'autoatk',on:false,side});engine.applyInput(b,{kind:'manual',on:true,side});}
 let guard=0;while(b.phase!=='fight'&&b.frame<2000&&guard++<3000)engine.stepRanked(b);
 assert.equal(engine.pulseEvolve(b,actor,'ivysaur',moves),true);
 guard=0;while((actor.rkKey!=='ivysaur'||b.pulseEvolving)&&guard++<6000)engine.stepRanked(b);
 assert.equal(actor.rkKey,'ivysaur');assert.equal(actor.level,16);
 assert.deepEqual(actor.st,displayStats(IVYSAUR,16));
 assert.equal(actor.maxHp,displayStats(IVYSAUR,16).hp*9);
});
