import{test}from'node:test';import assert from'node:assert/strict';import{readFile,access}from'node:fs/promises';
import{createProgression,SAVE_KEY}from'../public/pulse/progression.js';import{EVOLUTIONS,levelOf,xpAt,ITEMS,STONES,STONE_EVOLUTIONS}from'../public/pulse/growth.js';import{CHAPTER_ONE}from'../public/pulse/campaign.js';
const roster=JSON.parse(await readFile(new URL('../public/roster.json',import.meta.url)));const disk=()=>{const m=new Map();return{getItem:k=>m.get(k)??null,setItem:(k,v)=>m.set(k,v)}};
const make=(storage=disk(),rng=()=>0)=>{const p=createProgression({storage,profileMode:'journey',rng});assert(p.setCatalog(roster).ok);return p};
function setXP(p,key,level){const fixture=JSON.parse(p.exportSave());fixture.growth.pokemon[key].xp=xpAt(level);assert(p.importSave(JSON.stringify(fixture)).ok);}
test('all six starters begin at level five with legal basic moves, not advanced default kits',()=>{
 for(const key of ['bulbasaur','charmander','squirtle','chikorita','cyndaquil','totodile']){const p=make();assert(p.chooseStarter(key).ok);assert.equal(p.getCatalog().find(m=>m.key===key).level,5);const known=p.getMoves(key);assert(known.length);assert(!known.some(m=>['Flamethrower','Hydro Pump','Solar Beam'].includes(m.name)));assert(p.getTeam().moves[key].length>=1);}
});
test('first-clear XP, ticket cadence and daily tickets persist without duplicate rewards',()=>{
 const storage=disk(),p=make(storage);p.chooseStarter('chikorita');let xp=0,tickets=2;
 for(const [index,stage]of CHAPTER_ONE.slice(0,3).entries()){p.beginStage(stage.id,'growth-'+stage.id);if(stage.wild)p.resolveEncounter('fled');const result=p.completeStage({id:'growth-'+stage.id,won:true,frames:600});assert(result.ok);xp+=300+index*180;tickets+=1+(index===2?1:0);assert.equal(result.trainerXp.xp,300+index*180);assert.equal(p.completeStage({id:'growth-'+stage.id,won:true,frames:600}).ok,false);}
 assert.equal(p.getSave().trainer.xp,xp);assert.equal(p.getSave().growth.pokemon.chikorita.xp,125);assert.equal(p.getSave().growth.inventory.moveTicket,tickets);
 assert.equal(p.claimDaily().tickets,2);assert.equal(p.claimDaily().ok,false);assert.equal(make(storage).getSave().growth.inventory.moveTicket,tickets+2);
});
test('special gacha consumes exactly one inventory ticket, teaches compatible unique moves and rejects bad RNG',()=>{
 const p=make();p.chooseStarter('charmander');const before=p.getSave();const first=p.summonMove('charmander');assert(first.ok);assert.equal(p.getSave().growth.inventory.moveTicket,before.growth.inventory.moveTicket-1);assert(!p.getMoves('charmander').some(x=>x.id===first.move.id));assert.equal(p.getSave().growth.tmInventory[first.move.id],1);assert(p.teachTM('charmander',first.move.id).ok);assert(p.getMoves('charmander').some(x=>x.id===first.move.id));assert(!p.teachTM('charmander',first.move.id).ok);const second=p.summonMove('charmander');assert(second.ok);assert.notEqual(first.move.id,second.move.id);const snapshot=p.exportSave();assert(!p.summonMove('charmander').ok);assert.equal(p.exportSave(),snapshot);
 const q=make(disk(),()=>1);q.chooseStarter('bulbasaur');const initial=q.exportSave();assert(!q.summonMove('bulbasaur').ok);assert.equal(q.exportSave(),initial);
});
test('level locks are enforced when selecting and importing moves',()=>{
 const p=make();p.chooseStarter('charmander');const flamethrower=roster.find(x=>x.key==='charmander').pool.find(x=>x.name==='Flamethrower');assert(!p.setMoves('charmander',[flamethrower.id]).ok);
 const bad=JSON.parse(p.exportSave());bad.team.moves.charmander=[flamethrower.id];const before=p.exportSave();assert(!p.importSave(JSON.stringify(bad)).ok);assert.equal(p.exportSave(),before);
 setXP(p,'charmander',50);assert(p.setMoves('charmander',[flamethrower.id]).ok);assert.deepEqual(p.getTeam().moves.charmander,[flamethrower.id]);
});
test('permanent evolution retains XP, compatible learned techniques, held item and selected team across reload',()=>{
 const storage=disk(),p=make(storage);p.chooseStarter('bulbasaur');const draw=p.summonMove('bulbasaur');assert(draw.ok);assert(p.teachTM('bulbasaur',draw.move.id).ok);p.equipItem('bulbasaur','sitrusberry');assert.equal(p.previewEvolution('bulbasaur'),null);setXP(p,'bulbasaur',16);const plan=p.previewEvolution('bulbasaur');assert.equal(plan.target,'ivysaur');assert(!p.evolvePokemon('bulbasaur','venusaur').ok);assert(p.evolvePokemon('bulbasaur','ivysaur').ok);const q=make(storage);assert.deepEqual(q.getSave().team.mons,['ivysaur']);assert.equal(q.getSave().favorite,'ivysaur');assert.equal(q.getSave().growth.held.ivysaur,'sitrusberry');assert.equal(q.getSave().growth.pokemon.ivysaur.xp,xpAt(16));assert(q.getMoves('ivysaur').some(x=>x.name===draw.move.name));assert(!q.getSave().unlocked.includes('bulbasaur'));
});
test('held items reserve inventory, return on unequip and consume once when activated',()=>{
 const p=make();p.chooseStarter('squirtle');const before=p.getSave().growth.inventory.oranberry;assert(p.equipItem('squirtle','oranberry').ok);assert.equal(p.getSave().growth.inventory.oranberry,before-1);assert(p.equipItem('squirtle',null).ok);assert.equal(p.getSave().growth.inventory.oranberry,before);p.equipItem('squirtle','oranberry');assert(p.consumeHeld({battleId:'item-test',mon:'squirtle',item:'oranberry'}).ok);assert(!p.consumeHeld({battleId:'item-test',mon:'squirtle',item:'oranberry'}).ok);assert.equal(p.getSave().growth.held.squirtle,undefined);
 const coins=p.getSave().coins;assert(p.buyItem('cheriberry',2).ok);assert.equal(p.getSave().coins,coins-ITEMS.cheriberry.price*2);assert(!p.buyItem('unknown').ok);
});
test('old journey saves migrate without losing collection, currencies or cleared stages, and invalid growth imports preserve save',()=>{
 const storage=disk(),p=make(storage);p.chooseStarter('totodile');const old=JSON.parse(p.exportSave());delete old.growth;storage.setItem(SAVE_KEY,JSON.stringify(old));const q=make(storage);assert.deepEqual(q.getSave().unlocked,old.unlocked);assert.equal(q.getSave().coins,old.coins);assert(storage.getItem(SAVE_KEY+'.before-growth'));
 for(const mutate of [g=>g.pokemon.totodile.xp=-1,g=>g.inventory.moveTicket=-1,g=>g.held.totodile='unknown',g=>g.specialMoves.totodile=['unknown']]){const current=q.exportSave(),bad=JSON.parse(current);mutate(bad.growth);assert(!q.importSave(JSON.stringify(bad)).ok);assert.equal(q.exportSave(),current);}
});
test('level boundaries and all evolution/icon assets are complete',async()=>{
 for(let level=1;level<=100;level++)assert.equal(levelOf(xpAt(level)),level);
 for(const [key,[target]]of Object.entries(EVOLUTIONS))for(const k of [key,target]){const m=roster.find(m=>m.key===k);assert(m,k);await access(new URL('../public/'+m.icon.file,import.meta.url));await access(new URL('../public/assets/portraits/'+m.dex+'_Normal.png',import.meta.url));}
 for(const key of Object.keys(ITEMS))await access(new URL('../public/pulse/assets/items/'+key+'.png',import.meta.url));
});
test('a TM stays in inventory for incompatible targets and legacy techniques migrate without wiping the save',()=>{
 const storage=disk(),p=make(storage);p.chooseStarter('charmander');const draw=p.summonMove('charmander');const before=p.exportSave();assert(!p.teachTM('bulbasaur',draw.move.id).ok);assert.equal(p.exportSave(),before);
 const old=JSON.parse(before);delete old.growth.tmSchema;delete old.growth.tmInventory;old.growth.specialMoves.charmander=['lucario:Aura Sphere'];
 // Deliberately use an actually recognized v0.3 legacy technique, not invented data.
 const legacy=roster.find(m=>m.key==='charmander').pool.find(m=>m.name==='Dragon Pulse');
 if(legacy){old.growth.specialMoves.charmander=[legacy.id];storage.setItem(SAVE_KEY,JSON.stringify(old));const q=make(storage);assert.equal(q.getSave().trainerName,old.trainerName);assert.deepEqual(q.getSave().unlocked,old.unlocked);assert.equal(q.getSave().growth.tmSchema,1);}
});
test('stone table covers the roster lines and stone/badge assets are present',async()=>{
 const lines={vulpix:['fire-stone','ninetales'],eevee:['water-stone','vaporeon'],growlithe:['fire-stone','arcanine'],clefairy:['moon-stone','clefable'],jigglypuff:['moon-stone','wigglytuff'],gloom:['leaf-stone','vileplume'],exeggcute:['leaf-stone','exeggutor'],staryu:['water-stone','starmie'],shellder:['water-stone','cloyster'],poliwhirl:['water-stone','poliwrath'],pikachu:['thunder-stone','raichu']};
 for(const [from,[stone,to]]of Object.entries(lines))assert.equal(STONE_EVOLUTIONS[from][stone],to,from);
 assert.equal(STONE_EVOLUTIONS.eevee['thunder-stone'],'jolteon');assert.equal(STONE_EVOLUTIONS.eevee['fire-stone'],'flareon');
 for(const [key,entry]of Object.entries(STONES)){assert(Number.isInteger(entry.price)&&entry.price>0,key);await access(new URL('../public/pulse/assets/items/'+key+'.png',import.meta.url));}
 await access(new URL('../public/pulse/assets/badges/kanto-1.png',import.meta.url));
});
