import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createProgression} from '../public/pulse/progression.js';
import {MISSIONS,MISSION_BY_ID} from '../public/pulse/missions.js';
import {xpAt} from '../public/pulse/growth.js';

const roster=JSON.parse(await readFile(new URL('../public/roster.json',import.meta.url),'utf8'));
const storage=()=>{const values=new Map;return {values,getItem:key=>values.get(key)??null,setItem:(key,value)=>values.set(key,value)};};
function journeyFixture(disk,options={}){const p=createProgression({storage:disk||storage(),profileMode:'journey',rng:()=>0,now:()=>Date.UTC(2026,10,15),...options});assert.equal(p.setCatalog(roster).ok,true);return p;}
function setXP(p,key,level){const fixture=JSON.parse(p.exportSave());fixture.growth.pokemon[key].xp=xpAt(level);assert.equal(p.importSave(JSON.stringify(fixture)).ok,true);}
const row=(p,id)=>p.getMissions().find(m=>m.id===id);
const battle=(extra={})=>({id:'battle-1',won:true,reason:'win',frames:600,difficulty:3,format:'3v3',...extra});

test('catalog: 50 unique missions, balanced families, 36 Pokemon spins + 14 TM spins',()=>{
 assert.equal(MISSIONS.length,50);
 assert.equal(new Set(MISSIONS.map(m=>m.id)).size,50);
 const byMetric={};
 for(const m of MISSIONS){(byMetric[m.metric]??=[]).push(m);}
 assert.deepEqual(Object.keys(byMetric).sort(),['battleWins','battles','captures','collection','dailyClaims','evolutions','knockouts','pokemonPulls','tmDraws','tmUses']);
 assert.deepEqual(Object.fromEntries(Object.entries(byMetric).map(([k,v])=>[k,v.length])),{captures:5,pokemonPulls:5,knockouts:6,battleWins:6,battles:5,tmDraws:5,tmUses:5,evolutions:4,dailyClaims:3,collection:6});
 for(const list of Object.values(byMetric)){const targets=list.map(m=>m.target);assert.deepEqual(targets,[...targets].sort((a,b)=>a-b));assert.equal(new Set(targets).size,targets.length);}
 const prefix={captures:'capture',pokemonPulls:'pokemon-gacha',knockouts:'knockout',battleWins:'win',battles:'battle',tmDraws:'tm-draw',tmUses:'tm-use',evolutions:'evolution',dailyClaims:'daily',collection:'collection'};
 for(const m of MISSIONS){
  assert.equal(m.id,`${prefix[m.metric]}-${m.target}`);
  assert.equal(MISSION_BY_ID[m.id],m);
  assert.equal(m.rewardCount,1);
  assert.ok(['pokemon','tm'].includes(m.reward));
  assert.equal(typeof m.title,'string');assert.ok(m.title.length>0);
  assert.equal(typeof m.category,'string');assert.ok(m.category.length>0);
 }
 const spins=reward=>MISSIONS.filter(m=>m.reward===reward).reduce((sum,m)=>sum+m.rewardCount,0);
 assert.equal(spins('pokemon'),36);
 assert.equal(spins('tm'),14);
});

test('claiming pays the right ticket, is idempotent and rejects unknown or incomplete missions',()=>{
 const p=journeyFixture();assert.equal(p.chooseStarter('charmander').ok,true);assert.equal(p.claimStarterTickets().ok,true);
 assert.equal(p.claimMission('missao-inexistente').ok,false);
 assert.equal(p.claimMission('capture-1').ok,false);
 const ticketsBefore=p.getSave().tickets;assert.equal(p.summon(1).ok,true);
 assert.equal(row(p,'pokemon-gacha-1').complete,true);
 assert.equal(p.claimMission('pokemon-gacha-1').ok,true);assert.equal(p.getSave().tickets,ticketsBefore);
 assert.equal(p.claimMission('pokemon-gacha-1').ok,false);assert.equal(p.getSave().tickets,ticketsBefore);
 const tmBefore=p.getSave().growth.inventory.moveTicket,draw=p.summonMove('charmander');assert.equal(draw.ok,true);
 assert.equal(row(p,'tm-draw-1').complete,true);
 assert.equal(p.claimMission('tm-draw-1').ok,true);assert.equal(p.getSave().growth.inventory.moveTicket,tmBefore);assert.equal(p.getSave().tickets,ticketsBefore);
 assert.equal(p.claimMission('tm-draw-1').ok,false);assert.equal(p.getSave().growth.inventory.moveTicket,tmBefore);
});

test('battle, win and knockout counters advance once per recorded result',()=>{
 const p=journeyFixture();assert.equal(p.chooseStarter('charmander').ok,true);
 assert.equal(p.recordBattle(battle({id:'m-battle-1',knockouts:3})).ok,true);
 assert.equal(row(p,'battle-5').current,1);assert.equal(row(p,'win-1').current,1);assert.equal(row(p,'knockout-10').current,3);
 assert.equal(p.recordBattle(battle({id:'m-battle-1',knockouts:3})).ok,false);
 assert.equal(row(p,'battle-5').current,1);assert.equal(row(p,'knockout-10').current,3);
 assert.equal(p.recordBattle(battle({id:'m-battle-2',won:false,reason:'loss',knockouts:7})).ok,true);
 assert.equal(row(p,'battle-5').current,2);assert.equal(row(p,'win-1').current,1);assert.equal(row(p,'knockout-10').current,10);assert.equal(row(p,'knockout-10').complete,true);
});

test('daily, capture and evolution counters advance from real events',()=>{
 let clock=Date.UTC(2026,10,15);
 const p=createProgression({storage:storage(),profileMode:'journey',rng:()=>0,now:()=>clock});assert.equal(p.setCatalog(roster).ok,true);
 assert.equal(p.chooseStarter('charmander').ok,true);
 assert.equal(p.claimDaily().ok,true);assert.equal(row(p,'daily-3').current,1);
 clock+=86400000;assert.equal(p.claimDaily().ok,true);
 clock+=86400000;assert.equal(p.claimDaily().ok,true);
 assert.equal(row(p,'daily-3').current,3);assert.equal(row(p,'daily-3').complete,true);
 assert.equal(p.beginStage('1-1','cap-1-1').ok,true);assert.equal(p.completeStage({id:'cap-1-1',won:true,frames:600}).ok,true);
 assert.equal(p.beginStage('1-2','cap-1-2').ok,true);assert.equal(p.completeStage({id:'cap-1-2',won:true,frames:600}).ok,true);
 assert.equal(p.beginStage('1-3','cap-1-3').ok,true);
 assert.equal(p.buyPokeballs(1).ok,true);
 const caught=p.captureWild({id:'cap-1-3',hpRatio:0.05,status:true});assert.equal(caught.ok,true);assert.equal(caught.captured,true);
 assert.equal(row(p,'capture-1').current,1);assert.equal(row(p,'capture-1').complete,true);
 const q=journeyFixture();assert.equal(q.chooseStarter('bulbasaur').ok,true);
 assert.equal(q.previewEvolution('bulbasaur'),null);setXP(q,'bulbasaur',16);
 assert.equal(q.previewEvolution('bulbasaur').target,'ivysaur');
 assert.equal(q.evolvePokemon('bulbasaur','ivysaur').ok,true);
 assert.equal(row(q,'evolution-1').current,1);assert.equal(row(q,'evolution-1').complete,true);
});

test('collection progress tracks the unlocked roster live',()=>{
 let n=0;const rng=()=>((n=(n+1)%10)/10);
 const p=journeyFixture(storage(),{rng});assert.equal(p.chooseStarter('squirtle').ok,true);assert.equal(p.claimStarterTickets().ok,true);
 assert.equal(row(p,'collection-6').current,p.getSave().unlocked.length);
 const before=p.getSave().unlocked.length;assert.equal(p.summon(1).ok,true);
 assert.equal(row(p,'collection-6').current,p.getSave().unlocked.length);
 assert.ok(p.getSave().unlocked.length>before);
});

test('mission progress and claims survive reload; forged claims are rejected on import',()=>{
 const disk=storage(),p=journeyFixture(disk);assert.equal(p.chooseStarter('charmander').ok,true);assert.equal(p.claimStarterTickets().ok,true);
 assert.equal(p.summon(1).ok,true);assert.equal(p.claimMission('pokemon-gacha-1').ok,true);assert.equal(p.claimDaily().ok,true);
 const tickets=p.getSave().tickets;
 const q=journeyFixture(disk);
 assert.equal(row(q,'pokemon-gacha-1').claimed,true);assert.equal(row(q,'daily-3').current,1);assert.equal(q.getSave().tickets,tickets);
 assert.equal(q.claimMission('pokemon-gacha-1').ok,false);
 const forged=JSON.parse(q.exportSave());forged.missions.claimed.push('missao-falsa');
 assert.equal(q.importSave(JSON.stringify(forged)).ok,false);
 const forgedProgress=JSON.parse(q.exportSave());forgedProgress.missions.progress.metricaFalsa=1;
 assert.equal(q.importSave(JSON.stringify(forgedProgress)).ok,false);
});
