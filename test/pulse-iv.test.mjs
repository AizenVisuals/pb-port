import{test}from'node:test';import assert from'node:assert/strict';
import{readFile}from'node:fs/promises';
import{displayStats,displayMaxHp,randomIVs,normalizeIVs,defaultIVs,xpAt}from'../public/pulse/growth.js';
import{engine,createSimulation}from'../server/engine.mjs';
import{configureGrowthBattle,applyEarnedLevel}from'../public/pulse/growth-battle.js';
import{createProgression,SAVE_KEY}from'../public/pulse/progression.js';
// Base stats do roster (iguais aos do engine INFO): Bulbasaur 45/49/49/65/65/45,
// Ivysaur 60/62/63/80/80/60. Valores conferidos contra displayStats e o engine.
const BULBASAUR={hp:45,atk:49,def:49,spa:65,spd:65,spe:45};
const IVYSAUR={hp:60,atk:62,def:63,spa:80,spd:80,spe:60};
const MIXED={hp:0,atk:31,def:15,spa:20,spd:7,spe:28};
const roster=JSON.parse(await readFile(new URL('../public/roster.json',import.meta.url),'utf8'));
const disk=()=>{const m=new Map();return{getItem:k=>m.get(k)??null,setItem:(k,v)=>m.set(k,v)}};
const journeyFixture=(storage=disk(),rng=()=>0)=>{const p=createProgression({storage,profileMode:'journey',rng});assert(p.setCatalog(roster).ok);return p};
async function battleWithTraits(key,level,traits,foeKey='rattata'){
 const b=await createSimulation(11,[{name:'You',trainer:'red',mons:[key]},{name:'CPU',trainer:'blue',mons:[foeKey],bot:true}],'stadium');
 const moves=engine.INFO[key].defaults.slice(0,4);
 configureGrowthBattle(b,engine,{levels:{[key]:level},traits:{[key]:traits},selected:{[key]:moves}});
 return b;
}
test('randomIVs sorteia 0–31 por stat e é determinístico com RNG fixo',()=>{
 assert.deepEqual(randomIVs(()=>0),{hp:0,atk:0,def:0,spa:0,spd:0,spe:0});
 assert.deepEqual(randomIVs(()=>0.999),{hp:31,atk:31,def:31,spa:31,spd:31,spe:31});
 assert.deepEqual(randomIVs(()=>0.5),{hp:16,atk:16,def:16,spa:16,spd:16,spe:16});
 for(let i=0;i<200;i++){const ivs=randomIVs();for(const v of Object.values(ivs))assert(v>=0&&v<=31&&Number.isInteger(v));}
 assert.deepEqual(defaultIVs(),{hp:31,atk:31,def:31,spa:31,spd:31,spe:31});
 assert.deepEqual(normalizeIVs({hp:0}),{hp:0,atk:31,def:31,spa:31,spd:31,spe:31});
 assert.deepEqual(normalizeIVs({hp:99,atk:-1}),{hp:31,atk:31,def:31,spa:31,spd:31,spe:31});
 assert.deepEqual(normalizeIVs(undefined),defaultIVs());
});
test('displayMaxHp usa o IV sobre a base inflada do engine',()=>{
 assert.equal(displayMaxHp(45,50,31),162);
 assert.equal(displayMaxHp(45,50,0),147);
 assert.equal(displayMaxHp(45,40,31),132);
 assert.equal(displayMaxHp(45,40,0),119);
 assert.equal(displayMaxHp(45,5,0),23);
 assert.equal(displayMaxHp(45,5,31),25);
 assert.equal(displayMaxHp(39,50,0),138);
});
test('displayStats com IV 0 e IVs mistos (Bulbasaur Nv. 40)',()=>{
 assert.deepEqual(displayStats(BULBASAUR,40,{ivs:{hp:0,atk:0,def:0,spa:0,spd:0,spe:0}}),{hp:119,atk:44,def:44,spa:57,spd:57,spe:41});
 assert.deepEqual(displayStats(BULBASAUR,40,{ivs:MIXED}),{hp:119,atk:56,def:50,spa:65,spd:59,spe:52});
 assert.deepEqual(displayStats(BULBASAUR,40,{nature:'adamant',ivs:MIXED}),{hp:119,atk:61,def:50,spa:58,spd:59,spe:52});
 // IV parcial: o que falta vira 31 (mesmo que o registro completo).
 assert.deepEqual(displayStats(BULBASAUR,40,{ivs:{hp:0}}),displayStats(BULBASAUR,40,{ivs:{hp:0,atk:31,def:31,spa:31,spd:31,spe:31}}));
});
test('migração: save antigo sem nature/IV vira neutra + 31 e mantém os stats exatos',()=>{
 const storage=disk(),p=journeyFixture(storage);
 assert(p.chooseStarter('bulbasaur').ok);
 const old=JSON.parse(p.exportSave());
 for(const record of Object.values(old.growth.pokemon)){delete record.nature;delete record.ivs;delete record.mintNature;}
 storage.setItem(SAVE_KEY,JSON.stringify(old));
 const q=journeyFixture(storage);
 const record=q.getSave().growth.pokemon.bulbasaur;
 assert.equal(record.nature,'hardy');
 assert.deepEqual(record.ivs,defaultIVs());
 assert.equal(record.mintNature,undefined);
 // O Bulbasaur migrado tem exatamente os stats de antes da feature.
 const level=q.getCatalog().find(m=>m.key==='bulbasaur').level;
 assert.deepEqual(displayStats(BULBASAUR,level,{ivs:record.ivs,nature:'hardy'}),displayStats(BULBASAUR,level));
 // IV inválido no import é rejeitado e o save anterior é preservado.
 const before=q.exportSave(),bad=JSON.parse(before);bad.growth.pokemon.bulbasaur.ivs.hp=99;
 assert.equal(q.importSave(JSON.stringify(bad)).ok,false);assert.equal(q.exportSave(),before);
 const bad2=JSON.parse(before);bad2.growth.pokemon.bulbasaur.nature='inexistente';
 assert.equal(q.importSave(JSON.stringify(bad2)).ok,false);assert.equal(q.exportSave(),before);
});
test('engine == displayStats com IVs: Bulbasaur Nv. 40, IVs mistos + Adamant',async()=>{
 const traits={ivs:MIXED,nature:'adamant'};
 const b=await battleWithTraits('bulbasaur',40,traits);
 const actor=b.teams[0].mons[0];
 assert.deepEqual(actor.st,displayStats(BULBASAUR,40,traits));
 assert.equal(actor.maxHp,displayStats(BULBASAUR,40,traits).hp*9);
 assert.equal(actor.maxHp,119*9);
});
test('engine == displayStats com IVs 0 e nature neutra',async()=>{
 const traits={ivs:{hp:0,atk:0,def:0,spa:0,spd:0,spe:0},nature:'hardy'};
 const b=await battleWithTraits('bulbasaur',40,traits);
 const actor=b.teams[0].mons[0];
 assert.deepEqual(actor.st,displayStats(BULBASAUR,40,traits));
 assert.equal(actor.maxHp,119*9);
});
test('oponente da mesma espécie não herda os traits do jogador',async()=>{
 const traits={ivs:MIXED,nature:'adamant'};
 const b=await battleWithTraits('bulbasaur',40,traits,'bulbasaur');
 const player=b.teams[0].mons[0],foe=b.teams[1].mons[0];
 assert.deepEqual(player.st,displayStats(BULBASAUR,40,traits));
 assert.deepEqual(foe.st,displayStats(BULBASAUR,5));
 assert.equal(foe.maxHp,displayStats(BULBASAUR,5).hp*9);
});
test('applyEarnedLevel mantém IV/nature ao subir de nível em batalha',async()=>{
 const traits={ivs:MIXED,nature:'adamant'};
 const b=await battleWithTraits('bulbasaur',40,traits);
 const actor=b.teams[0].mons[0];
 assert.equal(applyEarnedLevel(actor,41),true);
 assert.equal(actor.level,41);
 assert.deepEqual(actor.st,displayStats(BULBASAUR,41,traits));
 assert.equal(actor.maxHp,displayStats(BULBASAUR,41,traits).hp*9);
 assert.equal(actor.hp,actor.maxHp);
});
test('evolução em batalha mantém IV/nature (Bulbasaur 16 → Ivysaur)',async()=>{
 const traits={ivs:MIXED,nature:'adamant'};
 await engine.loadRankedAssets(['ivysaur']);
 const b=await createSimulation(79,[{name:'You',trainer:'red',mons:['bulbasaur']},{name:'CPU',trainer:'blue',mons:['charmander','squirtle']}],'stadium');
 const actor=b.teams[0].mons[0],moves=engine.INFO.bulbasaur.defaults.slice(0,4);
 configureGrowthBattle(b,engine,{levels:{bulbasaur:16},traits:{bulbasaur:traits},selected:{bulbasaur:moves}});
 for(const side of[0,1]){engine.applyInput(b,{kind:'autoatk',on:false,side});engine.applyInput(b,{kind:'manual',on:true,side});}
 let guard=0;while(b.phase!=='fight'&&b.frame<2000&&guard++<3000)engine.stepRanked(b);
 assert.equal(engine.pulseEvolve(b,actor,'ivysaur',moves),true);
 guard=0;while((actor.rkKey!=='ivysaur'||b.pulseEvolving)&&guard++<6000)engine.stepRanked(b);
 assert.equal(actor.rkKey,'ivysaur');assert.equal(actor.level,16);
 assert.deepEqual(actor.st,displayStats(IVYSAUR,16,traits));
 assert.equal(actor.maxHp,displayStats(IVYSAUR,16,traits).hp*9);
});
