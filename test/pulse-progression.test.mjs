import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile,access} from 'node:fs/promises';
import {createProgression,ECONOMY,SAVE_KEY,STARTERS,TRAINERS,resolveTrainerKey,trainerFace,trainerLabel} from '../public/pulse/progression.js';
import {isSummonable} from '../public/pulse/banners.js';
const roster=JSON.parse(await readFile(new URL('../public/roster.json',import.meta.url),'utf8'));
const storage=()=>{const values=new Map;return {values,getItem:key=>values.get(key)??null,setItem:(key,value)=>values.set(key,value)};};
function fixture(options={}){const p=createProgression({storage:storage(),now:()=>Date.UTC(2026,10,15),...options});assert.equal(p.setCatalog(roster).ok,true);if(!p.getSave().starterTicketsClaimed)assert.equal(p.claimStarterTickets().ok,true);return p;}
const battle=(extra={})=>({id:'battle-1',won:true,reason:'win',frames:600,difficulty:3,format:'3v3',...extra});
test('starter collection includes playable 3v3 and 6v6 without spending',()=>{
 const p=fixture(),s=p.getSave();assert.equal(s.coins,600);assert.ok(STARTERS.every(k=>s.unlocked.includes(k)));assert.equal(s.team.mons.length,3);
 assert.equal(p.setTeam([...STARTERS]).ok,true);assert.equal(p.getSave().team.mons.length,6);
 assert.ok(Object.isFrozen(s));assert.throws(()=>s.unlocked.push('x'));assert.equal(p.getSave().unlocked.length,6);
});
test('local profile, teams, moves, Mega and favorites survive reloading',()=>{
 const disk=storage();const p=fixture({storage:disk});assert.equal(p.setTrainerName('Ágata').ok,true);assert.equal(p.setFavorite('lucario').ok,true);
 const moves=roster.find(m=>m.key==='marshadow').defaults;assert.equal(p.setMoves('marshadow',moves).ok,true);assert.equal(p.setMega(0).ok,true);
 const q=fixture({storage:disk});assert.equal(q.getSave().trainerName,'Ágata');assert.equal(q.getSave().favorite,'lucario');assert.deepEqual(q.getSave().team.moves.marshadow,moves);assert.deepEqual(q.getSave().team.gimmick,{kind:'mega',mon:0});
});
test('locked species, duplicate team members, invalid moves and unavailable Mega are rejected',()=>{
 const p=fixture(),locked=p.getCatalog().find(m=>!m.owned).key;assert.equal(p.setTeam(['marshadow','lucario',locked]).ok,false);assert.equal(p.setFavorite(locked).ok,false);
 assert.equal(p.setTeam(['marshadow','marshadow','gengar']).ok,false);assert.equal(p.setTeam(['marshadow']).ok,false);
 assert.equal(p.setMoves('marshadow',['missing','missing','missing','missing']).ok,false);assert.equal(p.setMega(99).ok,false);assert.equal(p.setMega(1).ok,false);
 const pool=roster.find(m=>m.key==='marshadow').pool;assert.equal(p.setMoves('marshadow',pool.slice(0,4).map(m=>m.id)).ok,true);
});
test('daily reward can be claimed once per UTC day and cannot be reclaimed by rolling clock back',()=>{
 let clock=Date.UTC(2026,10,15);const p=fixture({now:()=>clock});assert.equal(p.claimDaily().coins,150);assert.equal(p.claimDaily().ok,false);
 clock-=86400000;assert.equal(p.claimDaily().ok,false);clock+=2*86400000;assert.equal(p.claimDaily().ok,true);assert.equal(p.getSave().coins,900);
});
test('battle rewards are persistent and idempotent, exclude surrender/short runs and obey pacing',()=>{
 const disk=storage();let clock=Date.UTC(2026,10,15);const p=fixture({storage:disk,now:()=>clock});const reward=p.recordBattle(battle());assert.equal(reward.coins,90);
 assert.equal(p.recordBattle(battle()).ok,false);const q=fixture({storage:disk,now:()=>clock});assert.equal(q.recordBattle(battle()).ok,false);
 assert.equal(p.recordBattle(battle({id:'short',frames:10})).coins,0);assert.equal(p.recordBattle(battle({id:'quit',reason:'surrender',won:false})).coins,0);
 assert.equal(p.recordBattle(battle({id:'too-fast'})).coins,0);clock+=8000;assert.equal(p.recordBattle(battle({id:'loss',won:false,reason:'loss'})).coins,40);
 assert.equal(p.getSave().records.battles,5);assert.equal(p.recordBattle(battle({id:'bad',reason:'win',won:false})).ok,false);
});
test('gacha applies normal probability boundaries, charges coins and awards diamonds for duplicates',()=>{
 for(const [roll,rarity]of [[0,'C'],[.699999,'C'],[.7,'R'],[.909999,'R'],[.91,'SR'],[.987999,'SR'],[.988,'UR'],[.992999,'UR'],[.993,'SSS'],[.999999,'SSS']]){
  const values=[roll,0];const p=fixture({rng:()=>values.shift()});const before=p.getSave();const result=p.summon();assert.equal(result.ok,true);assert.equal(result.pulls[0].rarity,rarity);assert.equal(result.spentTickets,1);assert.equal(result.spentDiamonds,0);assert.equal(p.getSave().tickets,before.tickets-1);assert.equal(p.getSave().coins,before.coins);
 }
 const p=fixture({rng:()=>0});const first=p.summon(),second=p.summon();assert.equal(second.pulls[0].duplicate,true);assert.equal(second.diamonds,ECONOMY.duplicateDiamonds.C);assert.equal(p.getSave().diamonds,first.diamonds+second.diamonds);assert.equal(second.pulls[0].key,first.pulls[0].key);
});
test('tenth consecutive C pull guarantees R or better and persists pity across loads',()=>{
 const disk=storage();const p=fixture({storage:disk,rng:()=>0});const rich=JSON.parse(p.exportSave());rich.coins=3000;assert.equal(p.importSave(JSON.stringify(rich)).ok,true);
 const nine=p.summon(9);assert.equal(nine.ok,true);assert.equal(p.getSave().gacha.pity,9);assert.ok(nine.pulls.every(m=>m.rarity==='C'));
 const q=fixture({storage:disk,rng:()=>0});const tenth=q.summon();assert.equal(tenth.pulls[0].guaranteed,true);assert.equal(tenth.pulls[0].rarity,'R');assert.equal(q.getSave().gacha.pity,0);
});
test('bad RNG, insufficient balance and invalid counts are transactional',()=>{
 const p=fixture({rng:()=>1});const before=p.exportSave();assert.equal(p.summon().ok,false);assert.equal(p.exportSave(),before);assert.equal(p.summon(0).ok,false);assert.equal(p.summon(11).ok,false);assert.equal(p.summon(10).ok,false);
});
test('direct unlock is an alternative with explicit price and no duplicate charges',()=>{
 const p=fixture();const mon=p.getCatalog().find(m=>!m.owned&&m.rarity==='C'&&isSummonable(m.key));const rich=JSON.parse(p.exportSave());rich.diamonds=1000;assert.equal(p.importSave(JSON.stringify(rich)).ok,true);const before=p.getSave().diamonds;assert.equal(p.buyPokemon(mon.key).ok,true);assert.equal(p.getSave().diamonds,before-mon.price);assert.ok(p.getSave().unlocked.includes(mon.key));assert.equal(p.buyPokemon(mon.key).ok,false);assert.equal(p.getSave().diamonds,before-mon.price);
});
test('corrupt saves are backed up and recovery is visible; storage failures keep a usable session',()=>{
 const disk=storage();disk.setItem(SAVE_KEY,'broken json');const p=fixture({storage:disk});assert.equal(p.status().recovered,true);assert.match(p.status().message,/cópia/);assert.ok([...disk.values.entries()].some(([k,v])=>k.includes('.recovery.')&&v==='broken json'));
 const unavailable=fixture({storage:{getItem(){throw Error('blocked')},setItem(){throw Error('blocked')}}});assert.equal(unavailable.status().memoryOnly,true);assert.equal(unavailable.setTrainerName('Teste').ok,true);
 const denied=fixture({storage:{getItem(){return null},setItem(){throw Error('full')}}});assert.equal(denied.status().memoryOnly,true);assert.match(denied.status().message,/exporte/i);
});
test('export/import validates data and preserves old state on bad imports',()=>{
 const p=fixture();p.setTrainerName('Exportado');const exported=p.exportSave();const q=fixture();assert.equal(q.importSave(exported).ok,true);assert.equal(q.getSave().trainerName,'Exportado');const before=q.exportSave();
 for(const mutate of [s=>s.coins=-1,s=>s.team.mons=['marshadow','marshadow','gengar'],s=>s.version=999,s=>s.unlocked.push('not-a-species'),s=>s.team.moves.marshadow=['bad','bad','bad','bad'],s=>s.team.gimmick={kind:'mega',mon:1}]){
  const invalid=JSON.parse(exported);mutate(invalid);assert.equal(q.importSave(JSON.stringify(invalid)).ok,false);assert.equal(q.exportSave(),before);
 }
 assert.equal(q.importSave('{').ok,false);assert.equal(q.importSave('x'.repeat(3*1024*1024)).ok,false);
});

test('legacy saves gain diamond and shiny fields without losing progress',()=>{
 const disk=storage(),p=fixture({storage:disk});const old=JSON.parse(p.exportSave());delete old.diamonds;delete old.shinies;delete old.shinyEquipped;old.trainerName='Legado';disk.setItem(SAVE_KEY,JSON.stringify(old));const q=fixture({storage:disk});assert.equal(q.getSave().trainerName,'Legado');assert.equal(q.getSave().diamonds,0);assert.deepEqual(q.getSave().shinies,[]);assert.equal(q.status().recovered,false);
});
test('shiny purchases require ownership, supported art and diamonds; persist without modifying stats',()=>{
 const disk=storage(),p=fixture({storage:disk});p.setShinyCatalog(['marshadow']);const before=p.getCatalog().find(m=>m.key==='marshadow').stats;assert.equal(p.buyShiny('marshadow').ok,false);assert.equal(p.buyShiny('lucario').ok,false);const rich=JSON.parse(p.exportSave());rich.diamonds=600;p.importSave(JSON.stringify(rich));assert.equal(p.buyShiny('marshadow').ok,true);assert.equal(p.getSave().diamonds,300);assert.equal(p.buyShiny('marshadow').ok,false);assert.equal(p.getSave().diamonds,300);assert.equal(p.equipShiny('marshadow',false).ok,true);assert.deepEqual(p.getSave().shinyEquipped,[]);p.equipShiny('marshadow',true);const q=fixture({storage:disk});assert.deepEqual(q.getSave().shinyEquipped,['marshadow']);assert.deepEqual(q.getCatalog().find(m=>m.key==='marshadow').stats,before);
});
test('invalid diamond and shiny imports preserve previous save',()=>{
 const p=fixture(),before=p.exportSave();for(const mutate of [s=>s.diamonds=-1,s=>s.diamonds=1.5,s=>s.shinies=['unknown'],s=>s.shinyEquipped=['marshadow']]){const invalid=JSON.parse(before);mutate(invalid);assert.equal(p.importSave(JSON.stringify(invalid)).ok,false);assert.equal(p.exportSave(),before);}
});

test('duplicate diamond amounts follow rarity and never refund coins',()=>{
 for(const [roll,rarity]of [[0,'C'],[.7,'R'],[.91,'SR'],[.988,'UR'],[.993,'SSS']]){const values=[roll,0],disk=storage(),p=fixture({storage:disk,rng:()=>values.shift()});const rich=JSON.parse(p.exportSave());rich.unlocked=roster.map(m=>m.key);p.importSave(JSON.stringify(rich));const result=p.summon();assert.equal(result.pulls[0].duplicate,true);assert.equal(result.diamonds,ECONOMY.duplicateDiamonds[rarity]);assert.equal(p.getSave().coins,600);assert.equal(p.getSave().tickets,9);const q=fixture({storage:disk});assert.equal(q.getSave().diamonds,result.diamonds);}
});

function journeyFixture(disk){const p=createProgression({storage:disk||storage(),profileMode:'journey',now:()=>Date.UTC(2026,10,15)});assert.equal(p.setCatalog(roster).ok,true);return p;}
test('trade evolutions unlock at level 36 and manual evolution clears suppression',()=>{
 const p=journeyFixture();assert.equal(p.chooseStarter('charmander').ok,true);
 const rich=JSON.parse(p.exportSave());
 for(const key of ['haunter','kadabra','machoke','graveler'])rich.unlocked.push(key);
 rich.growth.pokemon={...rich.growth.pokemon,haunter:{xp:42875},kadabra:{xp:42875},machoke:{xp:42875},graveler:{xp:42875}};
 assert.equal(p.importSave(JSON.stringify(rich)).ok,true);
 assert.equal(p.previewEvolution('haunter'),null);assert.equal(p.previewEvolution('kadabra'),null);
 for(const key of ['haunter','kadabra','machoke','graveler'])rich.growth.pokemon[key]={xp:46656};
 assert.equal(p.importSave(JSON.stringify(rich)).ok,true);
 assert.equal(p.previewEvolution('haunter')?.target,'gengar');
 assert.equal(p.previewEvolution('kadabra')?.target,'alakazam');
 assert.equal(p.previewEvolution('machoke')?.target,'machamp');
 assert.equal(p.previewEvolution('graveler')?.target,'golem');
 assert.equal(p.suppressAutoEvolution('haunter',36).ok,true);
 assert.equal(p.evolvePokemon('haunter','gengar').ok,true);
 assert.ok(p.getSave().unlocked.includes('gengar'));assert.ok(!p.getSave().unlocked.includes('haunter'));
 assert.equal(p.getSave().growth.suppressedAuto.haunter,undefined);
});
test('knockout XP splits among participants and the killer takes the remainder',()=>{
 const p=journeyFixture();assert.equal(p.chooseStarter('charmander').ok,true);
 const rich=JSON.parse(p.exportSave());
 rich.unlocked.push('bulbasaur');
 assert.equal(p.importSave(JSON.stringify(rich)).ok,true);
 const before=p.getSave().growth.pokemon;
 const result=p.awardKnockoutXP({foeLevel:5,participants:['charmander','bulbasaur'],killer:'bulbasaur'});
 assert.equal(result.ok,true);assert.equal(result.total,91);
 assert.equal(result.changes.find(c=>c.key==='charmander').xp,45);
 assert.equal(result.changes.find(c=>c.key==='bulbasaur').xp,46);
 assert.equal(p.getSave().growth.pokemon.charmander.xp,before.charmander.xp+45);
 assert.equal(p.getSave().growth.pokemon.bulbasaur.xp,before.bulbasaur.xp+46);
 assert.equal(p.awardKnockoutXP({foeLevel:5,participants:[],killer:null}).ok,false);
 assert.equal(p.awardKnockoutXP({foeLevel:5,participants:['charmander'],killer:'charmander'}).total,91);
});
test('battle-end XP goes to the trainer, not the Pokémon',()=>{
 const p=journeyFixture();assert.equal(p.chooseStarter('charmander').ok,true);
 const before=p.getSave();
 const reward=p.recordBattle(battle());
 assert.equal(reward.trainerXp.xp,285);assert.equal(reward.trainerXp.from,1);assert.equal(reward.trainerXp.to,6);
 assert.equal(p.getSave().trainer.xp,285);assert.equal(reward.growth,undefined);
 assert.equal(p.getSave().growth.pokemon.charmander.xp,before.growth.pokemon.charmander.xp);
 const q=journeyFixture();assert.equal(q.chooseStarter('charmander').ok,true);
 const defeat=q.recordBattle(battle({won:false,reason:'loss'}));
 assert.equal(defeat.trainerXp.xp,60);assert.equal(q.getSave().trainer.xp,60);
 assert.equal(q.getSave().growth.pokemon.charmander.xp,125);
});
test('legacy saves gain trainer XP without losing progress',()=>{
 const disk=storage(),p=fixture({storage:disk});const old=JSON.parse(p.exportSave());delete old.trainer;old.trainerName='Legado';disk.setItem(SAVE_KEY,JSON.stringify(old));const q=fixture({storage:disk});assert.equal(q.getSave().trainerName,'Legado');assert.deepEqual(q.getSave().trainer,{xp:0});assert.equal(q.status().recovered,false);
});
test('auto-evolution suppression and deferral persist across loads',()=>{
 const disk=storage(),p=journeyFixture(disk);assert.equal(p.chooseStarter('charmander').ok,true);
 const rich=JSON.parse(p.exportSave());rich.unlocked.push('haunter');assert.equal(p.importSave(JSON.stringify(rich)).ok,true);
 assert.equal(p.deferAutoEvolution('haunter',36).ok,true);
 assert.deepEqual(p.getSave().growth.pendingAuto,{mon:'haunter',level:36});
 assert.equal(p.suppressAutoEvolution('haunter',36).ok,true);
 assert.deepEqual(p.getSave().growth.suppressedAuto,{haunter:36});
 assert.equal(p.getSave().growth.pendingAuto,null);
 const q=journeyFixture(disk);assert.deepEqual(q.getSave().growth.suppressedAuto,{haunter:36});assert.equal(q.getSave().growth.pendingAuto,null);
 assert.equal(q.clearPendingAuto().ok,true);
 const bad=JSON.parse(q.exportSave());bad.growth.suppressedAuto={unknown:36};assert.equal(q.importSave(JSON.stringify(bad)).ok,false);
 const badPending=JSON.parse(q.exportSave());badPending.growth.pendingAuto={mon:'unknown',level:36};assert.equal(q.importSave(JSON.stringify(badPending)).ok,false);
});

test('stone evolutions are manual, cost coins and consume exactly one stone',()=>{
 const disk=storage(),p=journeyFixture(disk);assert.equal(p.chooseStarter('charmander').ok,true);
 const rich=JSON.parse(p.exportSave());rich.unlocked.push('vulpix','eevee','pikachu');rich.coins=2000;
 assert.equal(p.importSave(JSON.stringify(rich)).ok,true);
 assert.equal(p.useStone('vulpix','fire-stone').ok,false);
 const bought=p.buyStone('fire-stone');assert.equal(bought.ok,true);assert.equal(bought.spent,400);assert.equal(p.getSave().coins,1600);assert.equal(p.getSave().growth.stoneInventory['fire-stone'],1);
 assert.equal(p.useStone('pikachu','fire-stone').ok,false);
 assert.equal(p.getSave().growth.stoneInventory['fire-stone'],1);
 const r=p.useStone('vulpix','fire-stone');assert.equal(r.ok,true);assert.equal(r.target,'ninetales');
 assert.equal(p.getSave().growth.stoneInventory['fire-stone'],0);
 assert.ok(p.getSave().unlocked.includes('ninetales'));assert.ok(!p.getSave().unlocked.includes('vulpix'));
 assert.equal(p.buyStone('thunder-stone').ok,true);
 assert.equal(p.useStone('eevee','thunder-stone').target,'jolteon');
 assert.equal(p.buyStone('moon-stone').spent,600);
 assert.equal(p.buyStone('unknown').ok,false);
 const poor=JSON.parse(p.exportSave());poor.coins=10;assert.equal(p.importSave(JSON.stringify(poor)).ok,true);
 assert.equal(p.buyStone('fire-stone').ok,false);
 const bad=JSON.parse(p.exportSave());bad.growth.stoneInventory={unknown:1};assert.equal(p.importSave(JSON.stringify(bad)).ok,false);
});

test('gacha economy uses C/R/SR/UR/SSS rates, prices and refunds',()=>{assert.deepEqual(ECONOMY.rates,{C:.70,R:.21,SR:.078,UR:.005,SSS:.007});assert.deepEqual(ECONOMY.prices,{C:60,R:180,SR:360,UR:1800,SSS:900});assert.deepEqual(ECONOMY.duplicateDiamonds,{C:10,R:30,SR:60,UR:300,SSS:150});assert.equal(ECONOMY.pityAt,10);});
test('empty tiers fall back instead of failing the summon',()=>{const values=[.5,0];const p=fixture({rng:()=>values.shift()});const r=p.summon(1,'night');assert.equal(r.ok,true);assert.equal(r.pulls[0].rarity,'SR');assert.equal(r.pulls[0].key,'shedinjaNM');const values2=[.99,0];const q=fixture({rng:()=>values2.shift()});const r2=q.summon(1,'battle');assert.equal(r2.ok,true);assert.equal(r2.pulls[0].rarity,'SSS');assert.equal(r2.pulls[0].key,'marshadow');});

test('pity renormalizes over the available R-or-better tiers',()=>{
  for(const [roll,key]of [[.5,'sandshrew'],[.9,'rhyhorn'],[.99,'marshadow']]){
    const disk=storage();
    const seed=fixture({storage:disk,rng:()=>0});
    const s=JSON.parse(seed.exportSave());s.gacha.banners={battle:{pulls:0,pity:9}};assert.equal(seed.importSave(JSON.stringify(s)).ok,true);
    const values=[roll,0];const q=fixture({storage:disk,rng:()=>values.shift()});
    const r=q.summon(1,'battle');assert.equal(r.ok,true);assert.equal(r.pulls[0].guaranteed,true);assert.equal(r.pulls[0].key,key);
  }
});
test('premium night pity guarantees SSS after nine pulls without one',()=>{
  const disk=storage();
  const seed=fixture({storage:disk,rng:()=>0});
  const s=JSON.parse(seed.exportSave());s.gacha.banners={night:{pulls:9,pity:9}};assert.equal(seed.importSave(JSON.stringify(s)).ok,true);
  const values=[.5,0];const q=fixture({storage:disk,rng:()=>values.shift()});
  const r=q.summon(1,'night');assert.equal(r.ok,true);assert.equal(r.pulls[0].guaranteed,true);assert.equal(r.pulls[0].rarity,'SSS');assert.equal(r.pulls[0].key,'marshadow');
  assert.equal(q.getSave().gacha.banners.night.pity,0);
});

test('battle pity draws rare and super rare before the mythical and UR stays rarer than SSS',()=>{
  assert.ok(ECONOMY.rates.UR<ECONOMY.rates.SSS);
  assert.ok(ECONOMY.prices.UR>ECONOMY.prices.SSS);
  assert.ok(ECONOMY.duplicateDiamonds.UR>ECONOMY.duplicateDiamonds.SSS);
  for(const [roll,key]of [[.5,'sandshrew'],[.9,'rhyhorn'],[.99,'marshadow']]){
    const disk=storage();
    const seed=fixture({storage:disk,rng:()=>0});
    const s=JSON.parse(seed.exportSave());s.gacha.banners={battle:{pulls:0,pity:9}};assert.equal(seed.importSave(JSON.stringify(s)).ok,true);
    const values=[roll,0];const q=fixture({storage:disk,rng:()=>values.shift()});
    const r=q.summon(1,'battle');assert.equal(r.ok,true);assert.equal(r.pulls[0].guaranteed,true);assert.equal(r.pulls[0].key,key);
  }
});

test('summon costs tickets first and diamonds as fallback, mixing on ten pulls',()=>{
  const p=fixture();
  const before=p.getSave();
  const r1=p.summon();
  assert.equal(r1.ok,true);assert.equal(r1.spentTickets,1);assert.equal(r1.spentDiamonds,0);
  assert.equal(p.getSave().tickets,before.tickets-1);assert.equal(p.getSave().coins,before.coins);
  assert.equal(p.getSave().diamonds,before.diamonds+r1.diamonds);
  const s=JSON.parse(p.exportSave());s.tickets=0;s.diamonds=500;p.importSave(JSON.stringify(s));
  const r2=p.summon();
  assert.equal(r2.ok,true);assert.equal(r2.spentTickets,0);assert.equal(r2.spentDiamonds,100);
  assert.equal(p.getSave().diamonds,500-100+r2.diamonds);
  const s2=JSON.parse(p.exportSave());s2.tickets=3;s2.diamonds=1000;p.importSave(JSON.stringify(s2));
  const r3=p.summon(10);
  assert.equal(r3.ok,true);assert.equal(r3.spentTickets,3);assert.equal(r3.spentDiamonds,700);
  assert.equal(p.getSave().tickets,0);assert.equal(p.getSave().diamonds,1000-700+r3.diamonds);
  const s3=JSON.parse(p.exportSave());s3.tickets=5;s3.diamonds=400;p.importSave(JSON.stringify(s3));
  const before3=p.exportSave();
  assert.equal(p.summon(10).ok,false);assert.equal(p.exportSave(),before3);
  const s4=JSON.parse(p.exportSave());s4.tickets=0;s4.diamonds=50;p.importSave(JSON.stringify(s4));
  assert.equal(p.summon().ok,false);
});
test('premium night costs 2 tickets per pull with a 400-diamond fallback',()=>{
  const p=fixture();
  const before=p.getSave();
  const r1=p.summon(1,'night');
  assert.equal(r1.ok,true);assert.equal(r1.spentTickets,2);assert.equal(r1.spentDiamonds,0);
  assert.equal(p.getSave().tickets,before.tickets-2);
  const s=JSON.parse(p.exportSave());s.tickets=0;s.diamonds=1000;p.importSave(JSON.stringify(s));
  const r2=p.summon(1,'night');
  assert.equal(r2.ok,true);assert.equal(r2.spentTickets,0);assert.equal(r2.spentDiamonds,400);
  const s2=JSON.parse(p.exportSave());s2.tickets=3;s2.diamonds=1000;p.importSave(JSON.stringify(s2));
  const r3=p.summon(2,'night');
  assert.equal(r3.ok,true);assert.equal(r3.spentTickets,2);assert.equal(r3.spentDiamonds,400);
  const s3=JSON.parse(p.exportSave());s3.tickets=1;s3.diamonds=100;p.importSave(JSON.stringify(s3));
  assert.equal(p.summon(1,'night').ok,false);
});
test('pity counts diamond-paid summons the same way',()=>{
  const p=fixture({rng:()=>0});
  const s=JSON.parse(p.exportSave());s.tickets=0;s.diamonds=1000;p.importSave(JSON.stringify(s));
  const nine=p.summon(9);
  assert.equal(nine.ok,true);assert.ok(nine.pulls.every(m=>m.rarity==='C'));assert.equal(p.getSave().gacha.pity,9);
  const tenth=p.summon();
  assert.equal(tenth.pulls[0].guaranteed,true);assert.notEqual(tenth.pulls[0].rarity,'C');
  assert.equal(p.getSave().gacha.pity,0);
});
test('starter tickets are claimed once from rewards and persist',()=>{
  const disk=storage();
  const p=createProgression({storage:disk,now:()=>Date.UTC(2026,10,15)});
  assert.equal(p.setCatalog(roster).ok,true);
  assert.equal(p.getSave().tickets,0);
  assert.equal(p.getSave().starterTicketsClaimed,false);
  assert.equal(p.claimStarterTickets().ok,true);
  assert.equal(p.getSave().tickets,10);
  assert.equal(p.getSave().starterTicketsClaimed,true);
  assert.equal(p.claimStarterTickets().ok,false);
  assert.equal(p.getSave().tickets,10);
  const q=createProgression({storage:disk,now:()=>Date.UTC(2026,10,15)});
  assert.equal(q.setCatalog(roster).ok,true);
  assert.equal(q.getSave().tickets,10);
  assert.equal(q.getSave().starterTicketsClaimed,true);
  assert.equal(q.claimStarterTickets().ok,false);
});
test('legacy saves gain gacha tickets without losing progress',()=>{
  const disk=storage(),p=fixture({storage:disk});
  const old=JSON.parse(p.exportSave());delete old.tickets;delete old.starterTicketsClaimed;old.trainerName='Legado';disk.setItem(SAVE_KEY,JSON.stringify(old));
  const q=createProgression({storage:disk,now:()=>Date.UTC(2026,10,15)});
  assert.equal(q.setCatalog(roster).ok,true);
  assert.equal(q.getSave().trainerName,'Legado');assert.equal(q.getSave().tickets,0);assert.equal(q.getSave().starterTicketsClaimed,false);assert.equal(q.status().recovered,false);
});
test('campaign first wins can drop a gacha ticket and repeats never do',()=>{
  const mk=(rng)=>{const p=createProgression({storage:storage(),profileMode:'journey',now:()=>Date.UTC(2026,10,15),rng});assert.equal(p.setCatalog(roster).ok,true);assert.equal(p.chooseStarter('charmander').ok,true);return p;};
  const p=mk(()=>0.05);
  assert.equal(p.beginStage('1-1','drop-1').ok,true);
  const r=p.completeStage({id:'drop-1',won:true,frames:600});
  assert.equal(r.ok,true);assert.equal(r.gachaTickets,1);assert.equal(p.getSave().tickets,1);
  assert.equal(p.beginStage('1-1','drop-2').ok,true);
  const r2=p.completeStage({id:'drop-2',won:true,frames:600});
  assert.equal(r2.ok,true);assert.equal(r2.gachaTickets,0);assert.equal(p.getSave().tickets,1);
  const q=mk(()=>0.5);
  assert.equal(q.beginStage('1-1','nodrop-1').ok,true);
  const r3=q.completeStage({id:'nodrop-1',won:true,frames:600});
  assert.equal(r3.ok,true);assert.equal(r3.gachaTickets,0);assert.equal(q.getSave().tickets,0);
  const z=mk(()=>0.01);
  assert.equal(z.beginStage('1-1','loss-1').ok,true);
  const r4=z.completeStage({id:'loss-1',won:false,frames:600});
  assert.equal(r4.ok,true);assert.equal(r4.gachaTickets,0);assert.equal(z.getSave().tickets,0);
});

test('trainer defaults to Red, selection persists and unknown trainers are rejected',()=>{
 const disk=storage();const p=fixture({storage:disk});assert.equal(p.getSave().trainerKey,'red');
 assert.equal(resolveTrainerKey('ash'),'ash');assert.equal(resolveTrainerKey('nope'),'red');assert.equal(resolveTrainerKey(),'red');assert.equal(resolveTrainerKey(42),'red');
 assert.equal(trainerFace('ash'),'/faces/ash.png');assert.equal(trainerFace('nope'),'/faces/red.png');assert.equal(trainerLabel('ash'),'Ash');assert.equal(trainerLabel('nope'),'Red');
 assert.equal(p.setTrainerKey('ash').ok,true);assert.equal(p.getSave().trainerKey,'ash');
 const q=fixture({storage:disk});assert.equal(q.getSave().trainerKey,'ash');
 for(const bad of ['missing','','RED','ash ',42,null])assert.equal(p.setTrainerKey(bad).ok,false);
 assert.equal(p.getSave().trainerKey,'ash');
});
test('legacy saves without a trainer key migrate to Red; forged keys are rejected on import',()=>{
 const disk=storage(),p=fixture({storage:disk});const old=JSON.parse(p.exportSave());delete old.trainerKey;old.trainerName='Legado';disk.setItem(SAVE_KEY,JSON.stringify(old));const q=fixture({storage:disk});assert.equal(q.getSave().trainerName,'Legado');assert.equal(q.getSave().trainerKey,'red');assert.equal(q.status().recovered,false);
 const forged=JSON.parse(p.exportSave());forged.trainerKey='nope';assert.equal(p.importSave(JSON.stringify(forged)).ok,false);assert.equal(p.getSave().trainerKey,'red');
});
test('trainer roster matches trainers.json and every trainer has face and battle sprites',async()=>{
 const listed=JSON.parse(await readFile(new URL('../public/trainers.json',import.meta.url),'utf8'));
 assert.deepEqual(TRAINERS,listed);
 for(const t of TRAINERS){
  await access(new URL(`../public/faces/${t.key}.png`,import.meta.url));
  await access(new URL(`../public/assets/trainers/${t.key}.png`,import.meta.url));
  await access(new URL(`../public/assets/trainers/${t.key}_face.png`,import.meta.url));
 }
});
