import {LEARNSETS} from './learnsets.js';
export const EVOLUTIONS=Object.freeze({bulbasaur:['ivysaur',16],ivysaur:['venusaur',32],charmander:['charmeleon',16],charmeleon:['charizard',36],squirtle:['wartortle',16],wartortle:['blastoise',36],chikorita:['bayleef',16],bayleef:['meganium',32],cyndaquil:['quilava',14],quilava:['typhlosion',36],totodile:['croconaw',18],croconaw:['feraligatr',30]});
export const ITEMS=Object.freeze({
 oranberry:{name:'Oran Berry',price:45,description:'Uma vez: recupera 10 HP ao chegar à metade do HP.'},
 sitrusberry:{name:'Sitrus Berry',price:90,description:'Uma vez: recupera ¼ do HP máximo ao chegar à metade do HP.'},
 lumberry:{name:'Lum Berry',price:110,description:'Uma vez: cura qualquer condição de status ou congelamento.'},
 cheriberry:{name:'Cheri Berry',price:45,description:'Uma vez: cura paralisia.'},
 pechaberry:{name:'Pecha Berry',price:45,description:'Uma vez: cura envenenamento, inclusive Toxic.'},
 chestoberry:{name:'Chesto Berry',price:45,description:'Uma vez: acorda o Pokémon adormecido.'},
 leftovers:{name:'Leftovers',price:450,description:'Recupera 1/16 do HP máximo a cada 6 segundos em campo. Não é consumido.'},
});
export const initialGrowth=()=>({pokemon:{},inventory:{moveTicket:2,oranberry:3,sitrusberry:1,lumberry:1,cheriberry:0,pechaberry:0,chestoberry:0,leftovers:0},held:{},inherited:{},specialMoves:{},ticketWins:0,processedItems:[],evolutions:[]});
export const levelOf=xp=>{let level=Math.min(100,Math.max(1,Math.floor(Math.cbrt(xp))));while(level<100&&(level+1)**3<=xp)level++;return level;};
export const xpAt=level=>level**3;
export function ensureGrowth(save,catalog){
 if(!save.growth&&save.profileMode!=='journey'&&!save.journey?.starter)return;
 save.growth||=initialGrowth();save.growth.inherited||={};
 for(const key of save.unlocked){if(!catalog.has(key))continue;const level=Math.max(5,LEARNSETS[key]?.initialLevel||5);save.growth.pokemon[key]||={xp:xpAt(level)};}
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
 const g=save.growth;if(g===undefined)return;g.inherited??={};
 const integer=(n,min=0,max=Number.MAX_SAFE_INTEGER)=>Number.isSafeInteger(n)&&n>=min&&n<=max;
 const obj=x=>!!x&&typeof x==='object'&&!Array.isArray(x);
 if(!obj(g)||!obj(g.pokemon)||!obj(g.inventory)||!obj(g.held)||!obj(g.specialMoves)||!integer(g.ticketWins,0,2)||!Array.isArray(g.processedItems)||g.processedItems.some(x=>typeof x!=='string'||x.length>240)||!Array.isArray(g.evolutions)||g.evolutions.some(x=>typeof x!=='string'||x.length>160))throw Error('Progressão de níveis inválida.');
 if(Object.entries(g.pokemon).some(([key,v])=>!save.unlocked.includes(key)||!obj(v)||!integer(v.xp,1,1000000)))throw Error('XP inválida.');
 if(Object.entries(g.inventory).some(([id,n])=>!['moveTicket',...Object.keys(ITEMS)].includes(id)||!integer(n))||!integer(g.inventory.moveTicket))throw Error('Inventário inválido.');
 if(Object.entries(g.held).some(([key,id])=>!save.unlocked.includes(key)||!ITEMS[id]))throw Error('Item equipado inválido.');
 if(!obj(g.inherited)||Object.entries(g.inherited).some(([key,ids])=>!save.unlocked.includes(key)||!Array.isArray(ids)||new Set(ids).size!==ids.length||ids.some(id=>LEARNSETS[key]?.levelMoves[id]===undefined&&!LEARNSETS[key]?.specialMoves.includes(id))))throw Error('Golpes herdados inválidos.');
 if(Object.entries(g.specialMoves).some(([key,ids])=>!save.unlocked.includes(key)||!Array.isArray(ids)||new Set(ids).size!==ids.length||ids.some(id=>!LEARNSETS[key]?.specialMoves.includes(id))))throw Error('Golpe especial inválido.');
}
export const moveRequirement=(key,id)=>LEARNSETS[key]?.levelMoves[id] ? `Nível ${LEARNSETS[key].levelMoves[id]}` : LEARNSETS[key]?.specialMoves.includes(id)?'Ticket de técnica':'Indisponível nesta jornada';
export function awardTicketWin(save,eligible){
 if(!save.growth||!eligible)return 0;
 if(++save.growth.ticketWins<3)return 0;
 save.growth.ticketWins=0;save.growth.inventory.moveTicket++;return 1;
}
export const specialPool=(save,key,entry)=>(LEARNSETS[key]?.specialMoves||[]).filter(id=>entry.pool.some(m=>m.id===id)&&!save.growth.specialMoves[key]?.includes(id)&&!save.growth.inherited?.[key]?.includes(id));
