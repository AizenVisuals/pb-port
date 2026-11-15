import {KANTO_LEVEL_EVOLUTIONS} from './kanto.js';
import {LEGACY_TECHNIQUES} from './legacy-techniques.js';
import {LEARNSETS} from './learnsets.js';
export const EVOLUTIONS=Object.freeze({...KANTO_LEVEL_EVOLUTIONS,bulbasaur:['ivysaur',16],ivysaur:['venusaur',32],charmander:['charmeleon',16],charmeleon:['charizard',36],squirtle:['wartortle',16],wartortle:['blastoise',36],chikorita:['bayleef',16],bayleef:['meganium',32],cyndaquil:['quilava',14],quilava:['typhlosion',36],totodile:['croconaw',18],croconaw:['feraligatr',30]});
export const ITEMS=Object.freeze({
 oranberry:{name:'Oran Berry',price:45,description:'Uma vez: recupera 10 HP ao chegar à metade do HP.'},
 sitrusberry:{name:'Sitrus Berry',price:90,description:'Uma vez: recupera ¼ do HP máximo ao chegar à metade do HP.'},
 lumberry:{name:'Lum Berry',price:110,description:'Uma vez: cura qualquer condição de status ou congelamento.'},
 cheriberry:{name:'Cheri Berry',price:45,description:'Uma vez: cura paralisia.'},
 pechaberry:{name:'Pecha Berry',price:45,description:'Uma vez: cura envenenamento, inclusive Toxic.'},
 chestoberry:{name:'Chesto Berry',price:45,description:'Uma vez: acorda o Pokémon adormecido.'},
 leftovers:{name:'Leftovers',price:450,description:'Recupera 1/16 do HP máximo a cada 6 segundos em campo. Não é consumido.'},
});
export const STONE_EVOLUTIONS=Object.freeze({vulpix:{'fire-stone':'ninetales'},eevee:{'water-stone':'vaporeon','thunder-stone':'jolteon','fire-stone':'flareon'},growlithe:{'fire-stone':'arcanine'},clefairy:{'moon-stone':'clefable'},jigglypuff:{'moon-stone':'wigglytuff'},gloom:{'leaf-stone':'vileplume'},exeggcute:{'leaf-stone':'exeggutor'},staryu:{'water-stone':'starmie'},shellder:{'water-stone':'cloyster'},poliwhirl:{'water-stone':'poliwrath'},pikachu:{'thunder-stone':'raichu'}});
const EVOLUTION_TARGETS=new Set([...Object.values(EVOLUTIONS).map(([target])=>target),...Object.values(STONE_EVOLUTIONS).flatMap(targets=>Object.values(targets))]);
export const BASE_FORM_KEYS=Object.freeze(new Set([...Object.keys(EVOLUTIONS),...Object.keys(STONE_EVOLUTIONS)].filter(key=>!EVOLUTION_TARGETS.has(key))));
export const STONES=Object.freeze({
 'fire-stone':{name:'Fire Stone',price:400,description:'Evolui Vulpix, Eevee e Growlithe.'},
 'water-stone':{name:'Water Stone',price:400,description:'Evolui Eevee, Staryu, Shellder e Poliwhirl.'},
 'thunder-stone':{name:'Thunder Stone',price:400,description:'Evolui Pikachu e Eevee.'},
 'leaf-stone':{name:'Leaf Stone',price:400,description:'Evolui Gloom e Exeggcute.'},
 'moon-stone':{name:'Moon Stone',price:600,description:'Evolui Clefairy e Jigglypuff.'},
});
export const initialGrowth=()=>({pokemon:{},inventory:{moveTicket:2,oranberry:3,sitrusberry:1,lumberry:1,cheriberry:0,pechaberry:0,chestoberry:0,leftovers:0},held:{},inherited:{},specialMoves:{},tmInventory:{},stoneInventory:{},tmSchema:1,retiredTechniques:[],ticketWins:0,processedItems:[],suppressedAuto:{},pendingAuto:null,evolutions:[]});
export const levelOf=xp=>{let level=Math.min(100,Math.max(1,Math.floor(Math.cbrt(xp))));while(level<100&&(level+1)**3<=xp)level++;return level;};
export const xpAt=level=>level**3;
export const koXpFor=level=>{const foe=Math.min(100,Math.max(1,Math.round(level)||5));return (foe+1)**3-foe**3;};
export function ensureGrowth(save,catalog){
 if(!save.growth&&save.profileMode!=='journey'&&!save.journey?.starter)return;
 save.growth||=initialGrowth();save.growth.inherited||={};
 const g=save.growth;g.tmInventory||={};g.stoneInventory||={};g.retiredTechniques||=[];g.suppressedAuto||={};if(g.pendingAuto===undefined)g.pendingAuto=null;
 if(g.tmSchema!==1){
  for(const [key,ids]of Object.entries(g.specialMoves)){const allowed=new Set(LEARNSETS[key]?.specialMoves||[]);g.specialMoves[key]=ids.filter(id=>{if(allowed.has(id))return true;g.retiredTechniques.push({mon:key,id});g.inventory.moveTicket++;return false;});}
  for(const [key,ids]of Object.entries(g.inherited)){g.inherited[key]=ids.filter(id=>{if(LEARNSETS[key]?.levelMoves[id]!==undefined||LEARNSETS[key]?.specialMoves.includes(id))return true;g.retiredTechniques.push({mon:key,id});g.inventory.moveTicket++;return false;});}
  g.tmSchema=1;
 }

 for(const key of save.unlocked){if(!catalog.has(key))continue;const level=Math.max(5,LEARNSETS[key]?.initialLevel||5);save.growth.pokemon[key]||={xp:xpAt(level)};save.growth.pokemon[key].xp=Math.max(save.growth.pokemon[key].xp,xpAt(level));}
}
export function learnedMoves(save,entry){
 if(!save.growth)return entry.pool;
 const rule=LEARNSETS[entry.key];if(!rule)return [];
 const level=levelOf(save.growth.pokemon[entry.key]?.xp??125),special=save.growth.specialMoves[entry.key]||[];
 return entry.pool.filter(move=>rule.levelMoves[move.id]<=level||special.includes(move.id)||save.growth.inherited?.[entry.key]?.includes(move.id));
}
export function selectedMoves(save,entry){
 if(!save.growth)return save.team.moves[entry.key]||entry.defaults;
 const learned=learnedMoves(save,entry),ids=new Set(learned.map(x=>x.id));
 const existing=save.team.moves[entry.key],selected=(existing||entry.defaults).filter(id=>ids.has(id));
 if(existing&&selected.length)return selected.slice(0,4);
 for(const move of learned)if(selected.length<4&&!selected.includes(move.id))selected.push(move.id);
 return selected.slice(0,4);
}
export function addXP(save,keys,amount){
 if(!save.growth)return [];
 const changes=[];
 for(const key of new Set(keys)){
  const record=save.growth.pokemon[key];if(!record)continue;
  const before=levelOf(record.xp);record.xp=Math.min(1000000,record.xp+amount);
  const to=levelOf(record.xp),learned=Object.entries(LEARNSETS[key]?.levelMoves||{}).filter(([,level])=>level>before&&level<=to).sort((a,b)=>a[1]-b[1]).map(([id])=>id);
  const equipped=save.team.moves[key];if(equipped)for(const id of learned)if(equipped.length<4&&!equipped.includes(id))equipped.push(id);
  changes.push({key,xp:amount,from:before,to,learned});
 }
 return changes;
}
export function validateGrowth(save){
 const g=save.growth;if(g===undefined)return;g.inherited??={};g.suppressedAuto??={};g.stoneInventory??={};if(g.pendingAuto===undefined)g.pendingAuto=null;
 const integer=(n,min=0,max=Number.MAX_SAFE_INTEGER)=>Number.isSafeInteger(n)&&n>=min&&n<=max;
 const obj=x=>!!x&&typeof x==='object'&&!Array.isArray(x);
 if(!obj(g)||!obj(g.pokemon)||!obj(g.inventory)||!obj(g.held)||!obj(g.specialMoves)||!integer(g.ticketWins,0,2)||!Array.isArray(g.processedItems)||g.processedItems.some(x=>typeof x!=='string'||x.length>240)||!Array.isArray(g.evolutions)||g.evolutions.some(x=>typeof x!=='string'||x.length>160))throw Error('Progressão de níveis inválida.');
 if(!obj(g.suppressedAuto)||Object.entries(g.suppressedAuto).some(([k,v])=>!save.unlocked.includes(k)||!integer(v,1,100)))throw Error('Evolução automática suprimida inválida.');
 if(g.pendingAuto!==null&&(!obj(g.pendingAuto)||!save.unlocked.includes(g.pendingAuto.mon)||!integer(g.pendingAuto.level,1,100)))throw Error('Evolução automática pendente inválida.');
 if(!obj(g.stoneInventory)||Object.entries(g.stoneInventory).some(([k,v])=>!STONES[k]||!integer(v,0,999)))throw Error('Inventário de pedras inválido.');
 if(Object.entries(g.pokemon).some(([key,v])=>!save.unlocked.includes(key)||!obj(v)||!integer(v.xp,1,1000000)))throw Error('XP inválida.');
 if(Object.entries(g.inventory).some(([id,n])=>!['moveTicket',...Object.keys(ITEMS)].includes(id)||!integer(n))||!integer(g.inventory.moveTicket))throw Error('Inventário inválido.');
 if(Object.entries(g.held).some(([key,id])=>!save.unlocked.includes(key)||!ITEMS[id]))throw Error('Item equipado inválido.');
 if(!obj(g.inherited)||Object.entries(g.inherited).some(([key,ids])=>!save.unlocked.includes(key)||!Array.isArray(ids)||new Set(ids).size!==ids.length||ids.some(id=>LEARNSETS[key]?.levelMoves[id]===undefined&&!LEARNSETS[key]?.specialMoves.includes(id)&&!(g.tmSchema!==1&&LEGACY_TECHNIQUES[key]?.includes(id)))))throw Error('Golpes herdados inválidos.');
 if(Object.entries(g.specialMoves).some(([key,ids])=>!save.unlocked.includes(key)||!Array.isArray(ids)||new Set(ids).size!==ids.length||ids.some(id=>!LEARNSETS[key]?.specialMoves.includes(id)&&!(g.tmSchema!==1&&LEGACY_TECHNIQUES[key]?.includes(id)))))throw Error('Golpe especial inválido.');
 if(g.tmSchema!==undefined&&g.tmSchema!==1)throw Error('Versão de TMs inválida.');
 const tmIds=new Set(Object.values(LEARNSETS).flatMap(x=>x.specialMoves));if(g.tmInventory!==undefined&&(!obj(g.tmInventory)||Object.entries(g.tmInventory).some(([id,n])=>!tmIds.has(id)||!integer(n))))throw Error('Inventário de TMs inválido.');
}
export const moveRequirement=(key,id)=>LEARNSETS[key]?.levelMoves[id] ? `Nível ${LEARNSETS[key].levelMoves[id]}` : LEARNSETS[key]?.specialMoves.includes(id)?'TM compatível':'Indisponível nesta jornada';
export function awardTicketWin(save,eligible){
 if(!save.growth||!eligible)return 0;
 if(++save.growth.ticketWins<3)return 0;
 save.growth.ticketWins=0;save.growth.inventory.moveTicket++;return 1;
}
export const specialPool=(save,key,entry)=>(LEARNSETS[key]?.specialMoves||[]).filter(id=>entry.pool.some(m=>m.id===id)&&!learnedMoves(save,entry).some(m=>m.id===id)&&!save.growth.specialMoves[key]?.includes(id)&&!save.growth.inherited?.[key]?.includes(id)&&!(save.growth.tmInventory?.[id]>0));
