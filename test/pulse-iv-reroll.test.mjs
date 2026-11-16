import{test}from'node:test';import assert from'node:assert/strict';
import{readFile}from'node:fs/promises';
import{displayStats,normalizeIVs,rerollIVs,normalizeLocks,countLockedIVs,xpAt}from'../public/pulse/growth.js';
import{engine,createSimulation}from'../server/engine.mjs';
import{configureGrowthBattle}from'../public/pulse/growth-battle.js';
import{createProgression,SAVE_KEY,ECONOMY,ivRerollCost}from'../public/pulse/progression.js';
// Re-roll de IVs com trava (não é Hyper Training): cada IV pode ser travado
// e só os destravados são sorteados de novo (0–31); o travado mantém o
// valor. Custo: 100 diamantes de base + 50 por IV travado.
const BULBASAUR={hp:45,atk:49,def:49,spa:65,spd:65,spe:45};
const roster=JSON.parse(await readFile(new URL('../public/roster.json',import.meta.url),'utf8'));
const disk=()=>{const m=new Map();return{getItem:k=>m.get(k)??null,setItem:(k,v)=>m.set(k,v)}};
const journeyFixture=(storage=disk(),rng=()=>0)=>{const p=createProgression({storage,profileMode:'journey',rng});assert(p.setCatalog(roster).ok);return p};
function setXP(p,key,level){const save=JSON.parse(p.exportSave());save.growth.pokemon[key].xp=xpAt(level);assert(p.importSave(JSON.stringify(save)).ok);}
function setDiamonds(p,n){const save=JSON.parse(p.exportSave());save.diamonds=n;assert(p.importSave(JSON.stringify(save)).ok);}
async function battleWithTraits(key,level,traits,foeKey='rattata'){
 const b=await createSimulation(11,[{name:'You',trainer:'red',mons:[key]},{name:'CPU',trainer:'blue',mons:[foeKey],bot:true}],'stadium');
 const moves=engine.INFO[key].defaults.slice(0,4);
 configureGrowthBattle(b,engine,{levels:{[key]:level},traits:{[key]:traits},selected:{[key]:moves}});
 return b;
}
test('rerollIVs puro: travados intactos, destravados sorteados 0–31',()=>{
 const before={hp:31,atk:17,def:5,spa:28,spd:0,spe:12};
 assert.deepEqual(rerollIVs(before,{hp:true,atk:true},()=>0.5),{hp:31,atk:17,def:16,spa:16,spd:16,spe:16});
 assert.deepEqual(rerollIVs(before,{hp:true,atk:true},()=>0),{hp:31,atk:17,def:0,spa:0,spd:0,spe:0});
 assert.deepEqual(rerollIVs(before,{hp:true,atk:true},()=>0.999),{hp:31,atk:17,def:31,spa:31,spd:31,spe:31});
 // Sem trava sorteia os 6; com 5 travas sorteia só o que falta.
 assert.deepEqual(rerollIVs(before,{},()=>0.5),{hp:16,atk:16,def:16,spa:16,spd:16,spe:16});
 assert.deepEqual(rerollIVs(before,{hp:true,atk:true,def:true,spa:true,spd:true},()=>0.5),{hp:31,atk:17,def:5,spa:28,spd:0,spe:16});
 // Trava aceita objeto, array e Set; chave inválida é ignorada.
 assert.deepEqual(normalizeLocks(['hp','atk']),{hp:true,atk:true,def:false,spa:false,spd:false,spe:false});
 assert.deepEqual(normalizeLocks(new Set(['spe'])),{hp:false,atk:false,def:false,spa:false,spd:false,spe:true});
 assert.deepEqual(normalizeLocks({hp:true,inexistente:true}),{hp:true,atk:false,def:false,spa:false,spd:false,spe:false});
 assert.deepEqual(normalizeLocks(undefined),{hp:false,atk:false,def:false,spa:false,spd:false,spe:false});
 assert.equal(countLockedIVs({hp:true,atk:true}),2);
 assert.equal(countLockedIVs(['def','spe']),2);
 assert.equal(countLockedIVs({}),0);
 // RNG inválido não quebra: cai para Math.random e o valor segue 0–31.
 for(let i=0;i<50;i++){const ivs=rerollIVs(before,{},()=>NaN);for(const v of Object.values(ivs))assert(v>=0&&v<=31&&Number.isInteger(v));}
});
test('custo do re-roll: 100 diamantes de base + 50 por IV travado',()=>{
 assert.deepEqual(ECONOMY.ivReroll,{base:100,perLock:50});
 assert.equal(ivRerollCost(0),100);
 assert.equal(ivRerollCost(1),150);
 assert.equal(ivRerollCost(2),200);
 assert.equal(ivRerollCost(5),350);
 assert.equal(ivRerollCost(),100);
});
test('re-roll via progressão: cobra o custo, trava os IVs certos e muda os demais',()=>{
 // Fila de RNG: 7 zeros do inicial (nature + 6 IVs) e depois os sorteios
 // do re-roll na ordem hp,atk,def,spa,spd,spe (só os destravados consomem).
 const queue=[0,0,0,0,0,0,0,0.5,0,0.999,0.25];
 const p=journeyFixture(disk(),()=>queue.length?queue.shift():0.5);
 assert(p.chooseStarter('bulbasaur').ok);
 const before=p.getSave().growth.pokemon.bulbasaur.ivs;
 assert.deepEqual(before,{hp:0,atk:0,def:0,spa:0,spd:0,spe:0});
 setDiamonds(p,1000);
 const result=p.rerollIVs('bulbasaur',{hp:true,atk:true});
 assert.equal(result.ok,true);
 assert.equal(result.cost,200);
 assert.deepEqual(result.before,before);
 assert.deepEqual(result.after,{hp:0,atk:0,def:16,spa:0,spd:31,spe:8});
 assert.deepEqual(result.locked,['hp','atk']);
 assert.deepEqual(p.getSave().growth.pokemon.bulbasaur.ivs,result.after);
 assert.equal(p.getSave().diamonds,800);
 // A nature não muda com o re-roll.
 assert.equal(p.getSave().growth.pokemon.bulbasaur.nature,'hardy');
});
test('saldo insuficiente e 6 travas recusam sem cobrar e sem mudar os IVs',()=>{
 const p=journeyFixture();
 assert(p.chooseStarter('bulbasaur').ok);
 const before=p.getSave().growth.pokemon.bulbasaur.ivs;
 setDiamonds(p,50);
 const poor=p.rerollIVs('bulbasaur',{});
 assert.equal(poor.ok,false);
 assert.match(poor.error,/Diamantes insuficientes/);
 assert.match(poor.error,/100/);
 assert.equal(p.getSave().diamonds,50);
 assert.deepEqual(p.getSave().growth.pokemon.bulbasaur.ivs,before);
 setDiamonds(p,1000);
 const allLocked=p.rerollIVs('bulbasaur',{hp:true,atk:true,def:true,spa:true,spd:true,spe:true});
 assert.equal(allLocked.ok,false);
 assert.match(allLocked.error,/no máximo 5 IVs/);
 assert.equal(p.getSave().diamonds,1000);
 assert.deepEqual(p.getSave().growth.pokemon.bulbasaur.ivs,before);
 // Pokémon fora da coleção e sem progresso também recusam.
 assert.equal(p.rerollIVs('charmander',{}).ok,false);
 assert.equal(p.rerollIVs('inexistente',{}).ok,false);
});
test('stats recalculados após o re-roll: displayStats e engine na próxima batalha',async()=>{
 const queue=[0,0,0,0,0,0,0,0.999,0.999,0.999,0.999,0.999,0.999];
 const p=journeyFixture(disk(),()=>queue.length?queue.shift():0.5);
 assert(p.chooseStarter('bulbasaur').ok);
 setXP(p,'bulbasaur',40);
 setDiamonds(p,1000);
 const level=40,record=p.getSave().growth.pokemon.bulbasaur;
 const beforeStats=displayStats(BULBASAUR,level,{ivs:record.ivs,nature:record.nature});
 assert.deepEqual(beforeStats,{hp:119,atk:44,def:44,spa:57,spd:57,spe:41});
 const result=p.rerollIVs('bulbasaur',{});
 assert.equal(result.ok,true);
 assert.deepEqual(result.after,{hp:31,atk:31,def:31,spa:31,spd:31,spe:31});
 const after=p.getSave().growth.pokemon.bulbasaur;
 const afterStats=displayStats(BULBASAUR,level,{ivs:after.ivs,nature:after.nature});
 assert.deepEqual(afterStats,displayStats(BULBASAUR,level,{ivs:{hp:31,atk:31,def:31,spa:31,spd:31,spe:31},nature:'hardy'}));
 assert.notDeepEqual(afterStats,beforeStats);
 // O engine da próxima batalha usa os IVs novos, não os antigos.
 const b=await battleWithTraits('bulbasaur',level,{ivs:after.ivs,nature:after.nature});
 const actor=b.teams[0].mons[0];
 assert.deepEqual(actor.st,afterStats);
 assert.equal(actor.maxHp,afterStats.hp*9);
});
test('evolução mantém os IVs re-rolados (Bulbasaur 16 → Ivysaur)',()=>{
 const queue=[0,0,0,0,0,0,0,0.5,0.5,0.5,0.5,0.5,0.5];
 const p=journeyFixture(disk(),()=>queue.length?queue.shift():0.5);
 assert(p.chooseStarter('bulbasaur').ok);
 setXP(p,'bulbasaur',16);
 setDiamonds(p,1000);
 const result=p.rerollIVs('bulbasaur',{hp:true,spa:true});
 assert.equal(result.ok,true);
 assert.deepEqual(result.after,{hp:0,atk:16,def:16,spa:0,spd:16,spe:16});
 assert(p.evolvePokemon('bulbasaur','ivysaur').ok);
 const evolved=p.getSave().growth.pokemon.ivysaur;
 assert.deepEqual(evolved.ivs,result.after);
 assert.equal(evolved.nature,'hardy');
 assert.equal(p.getSave().growth.pokemon.bulbasaur,undefined);
 assert(p.getSave().unlocked.includes('ivysaur'));
});
