import test from 'node:test';
import assert from 'node:assert/strict';
import roster from '../public/roster.json' with {type:'json'};
import {createProgression} from '../public/pulse/progression.js';
import {SPECIAL_EVOLUTIONS,STONES} from '../public/pulse/growth.js';
import {NATIONAL_BASE_KEYS,NATIONAL_LEVEL_EVOLUTIONS,NATIONAL_STONE_EVOLUTIONS} from '../public/pulse/expansion-rules.js';
import report from '../research/expansion/import-report.json' with {type:'json'};

const storage=()=>{let value=null;return {getItem:()=>value,setItem:(_k,v)=>{value=v}}};

test('todas as evoluções especiais apontam para espécies existentes',()=>{
 const keys=new Set(roster.map(mon=>mon.key));
 assert.ok(Object.keys(SPECIAL_EVOLUTIONS).length>80);
 for(const [from,routes] of Object.entries(SPECIAL_EVOLUTIONS)){
  assert.ok(keys.has(from),from);
  for(const route of routes){assert.ok(keys.has(route.target),route.target);assert.ok(route.condition.length>2);}
 }
});

test('cada uma das 676 espécies importadas tem caminho de obtenção',()=>{
 const reachable=new Set(NATIONAL_BASE_KEYS);
 let changed=true;
 while(changed){changed=false;
  for(const [from,[to]] of Object.entries(NATIONAL_LEVEL_EVOLUTIONS))if(reachable.has(from)&&!reachable.has(to)){reachable.add(to);changed=true;}
  for(const [from,targets] of Object.entries(NATIONAL_STONE_EVOLUTIONS))for(const to of Object.values(targets))if(reachable.has(from)&&!reachable.has(to)){reachable.add(to);changed=true;}
  for(const [from,routes] of Object.entries(SPECIAL_EVOLUTIONS))for(const {target} of routes)if(reachable.has(from)&&!reachable.has(target)){reachable.add(target);changed=true;}
 }
 assert.equal(report.species.length,676);
 assert.deepEqual(report.species.filter(key=>!reachable.has(key)),[]);
});

test('catalisador executa uma evolução especial e é consumido',()=>{
 const p=createProgression({storage:storage(),rng:()=>0,now:()=>1234,profileMode:'journey'});
 assert.equal(p.setCatalog(roster).ok,true);
 assert.equal(p.chooseStarter('bulbasaur').ok,true);
 const save=structuredClone(p.getSave());
 save.unlocked.push('pichu');save.growth.pokemon.pichu={xp:125,nature:'hardy',ivs:{hp:31,atk:31,def:31,spa:31,spd:31,spe:31}};
 save.coins=STONES['evolution-catalyst'].price;
 assert.equal(p.importSave(JSON.stringify(save)).ok,true);
 assert.equal(p.buyStone('evolution-catalyst').ok,true);
 const result=p.useEvolutionCatalyst('pichu','pikachu');
 assert.equal(result.ok,true);
 assert.ok(p.getSave().unlocked.includes('pikachu'));
 assert.equal(p.getSave().growth.stoneInventory['evolution-catalyst'],0);
});
