import {KANTO_LEVEL_EVOLUTIONS} from './kanto.js';
import {NATIONAL_LEVEL_EVOLUTIONS,NATIONAL_STONE_EVOLUTIONS} from './expansion-rules.js';
import {LEGACY_TECHNIQUES} from './legacy-techniques.js';
import {LEARNSETS} from './learnsets.js';
export const EVOLUTIONS=Object.freeze({...NATIONAL_LEVEL_EVOLUTIONS,...KANTO_LEVEL_EVOLUTIONS,bulbasaur:['ivysaur',16],ivysaur:['venusaur',32],charmander:['charmeleon',16],charmeleon:['charizard',36],squirtle:['wartortle',16],wartortle:['blastoise',36],chikorita:['bayleef',16],bayleef:['meganium',32],cyndaquil:['quilava',14],quilava:['typhlosion',36],totodile:['croconaw',18],croconaw:['feraligatr',30]});
export const ITEMS=Object.freeze({
 oranberry:{name:'Oran Berry',price:45,description:'Uma vez: recupera 10 HP ao chegar à metade do HP.'},
 sitrusberry:{name:'Sitrus Berry',price:90,description:'Uma vez: recupera ¼ do HP máximo ao chegar à metade do HP.'},
 lumberry:{name:'Lum Berry',price:110,description:'Uma vez: cura qualquer condição de status ou congelamento.'},
 cheriberry:{name:'Cheri Berry',price:45,description:'Uma vez: cura paralisia.'},
 pechaberry:{name:'Pecha Berry',price:45,description:'Uma vez: cura envenenamento, inclusive Toxic.'},
 chestoberry:{name:'Chesto Berry',price:45,description:'Uma vez: acorda o Pokémon adormecido.'},
 leftovers:{name:'Leftovers',price:450,description:'Recupera 1/16 do HP máximo a cada 6 segundos em campo. Não é consumido.'},
});
export const STONE_EVOLUTIONS=Object.freeze({...NATIONAL_STONE_EVOLUTIONS,vulpix:{'fire-stone':'ninetales'},eevee:{'water-stone':'vaporeon','thunder-stone':'jolteon','fire-stone':'flareon'},growlithe:{'fire-stone':'arcanine'},clefairy:{'moon-stone':'clefable'},jigglypuff:{'moon-stone':'wigglytuff'},gloom:{'leaf-stone':'vileplume'},exeggcute:{'leaf-stone':'exeggutor'},staryu:{'water-stone':'starmie'},shellder:{'water-stone':'cloyster'},poliwhirl:{'water-stone':'poliwrath'},pikachu:{'thunder-stone':'raichu'}});
const EVOLUTION_TARGETS=new Set([...Object.values(EVOLUTIONS).map(([target])=>target),...Object.values(STONE_EVOLUTIONS).flatMap(targets=>Object.values(targets))]);
export const BASE_FORM_KEYS=Object.freeze(new Set([...Object.keys(EVOLUTIONS),...Object.keys(STONE_EVOLUTIONS)].filter(key=>!EVOLUTION_TARGETS.has(key))));
export const STONES=Object.freeze({
 'fire-stone':{name:'Fire Stone',price:400,description:'Evolui Vulpix, Eevee e Growlithe.'},
 'water-stone':{name:'Water Stone',price:400,description:'Evolui Eevee, Staryu, Shellder e Poliwhirl.'},
 'thunder-stone':{name:'Thunder Stone',price:400,description:'Evolui Pikachu e Eevee.'},
 'leaf-stone':{name:'Leaf Stone',price:400,description:'Evolui Gloom e Exeggcute.'},
 'moon-stone':{name:'Moon Stone',price:600,description:'Evolui Clefairy e Jigglypuff.'},
});
// Natures (25): 20 alteram um stat em ±10%, 5 são neutras. A nature fica no
// save por Pokémon (`growth.pokemon[key].nature`); a mint não troca a nature,
// só o efeito dela — guardado em `mintNature` (ver MINTS abaixo).
export const STAT_KEYS=Object.freeze(['hp','atk','def','spa','spd','spe']);
export const NATURES=Object.freeze({
 hardy:{up:null,down:null},lonely:{up:'atk',down:'def'},brave:{up:'atk',down:'spe'},adamant:{up:'atk',down:'spa'},naughty:{up:'atk',down:'spd'},
 bold:{up:'def',down:'atk'},docile:{up:null,down:null},relaxed:{up:'def',down:'spe'},impish:{up:'def',down:'spa'},lax:{up:'def',down:'spd'},
 timid:{up:'spe',down:'atk'},hasty:{up:'spe',down:'def'},serious:{up:null,down:null},jolly:{up:'spe',down:'spa'},naive:{up:'spe',down:'spd'},
 modest:{up:'spa',down:'atk'},mild:{up:'spa',down:'def'},quiet:{up:'spa',down:'spe'},bashful:{up:null,down:null},rash:{up:'spa',down:'spd'},
 calm:{up:'spd',down:'atk'},gentle:{up:'spd',down:'def'},sassy:{up:'spd',down:'spe'},careful:{up:'spd',down:'spa'},quirky:{up:null,down:null}});
export const NATURE_KEYS=Object.freeze(Object.keys(NATURES));
export const NEUTRAL_NATURE='hardy';
const STAT_PT={hp:'HP',atk:'Atq.',def:'Def.',spa:'Atq. Esp.',spd:'Def. Esp.',spe:'Vel.'};
export const natureName=key=>key?key[0].toUpperCase()+key.slice(1):'—';
export const natureEffect=key=>{const n=NATURES[key];if(!n||!n.up)return 'Neutra';return `${STAT_PT[n.up]} ↑ · ${STAT_PT[n.down]} ↓`;};
export const natureLabel=key=>`${natureName(key)} · ${natureEffect(key)}`;
export const natureMultiplier=(key,stat)=>{const n=NATURES[key];if(!n)return 1;return n.up===stat?1.1:n.down===stat?0.9:1;};
// Nature que vale no cálculo: a da mint, se houver; senão a original.
export const effectiveNature=record=>record?.mintNature??record?.nature??NEUTRAL_NATURE;
const rollFloat=rng=>{const v=Number(rng());return Number.isFinite(v)&&v>=0&&v<1?v:Math.random();};
export const randomNature=(rng=Math.random)=>NATURE_KEYS[Math.floor(rollFloat(rng)*NATURE_KEYS.length)];
export const randomIVs=(rng=Math.random)=>Object.fromEntries(STAT_KEYS.map(stat=>[stat,Math.floor(rollFloat(rng)*32)]));
export const rollTraits=(rng=Math.random)=>({nature:randomNature(rng),ivs:randomIVs(rng)});
export const defaultIVs=()=>({hp:31,atk:31,def:31,spa:31,spd:31,spe:31});
export const normalizeIVs=ivs=>{const out=defaultIVs();if(ivs&&typeof ivs==='object')for(const stat of STAT_KEYS)if(Number.isInteger(ivs[stat])&&ivs[stat]>=0&&ivs[stat]<=31)out[stat]=ivs[stat];return out;};
// Mints (Sword/Shield): uma por nature com efeito (20) + Serious, que zera
// o efeito (21 no total — as outras 4 neutras fariam o mesmo que Serious).
// Preço 500 moedas: na faixa das pedras (400–600) e do Leftovers (450) —
// compra deliberada, alcançável com ~4–5 vitórias.
export const MINTS=Object.freeze(Object.fromEntries([...NATURE_KEYS.filter(key=>NATURES[key].up),'serious'].map(key=>[key+'-mint',{name:`${natureName(key)} Mint`,nature:key,price:500,description:`Muda o efeito da nature para ${natureLabel(key)}. A nature original é preservada.`}])));
export const initialGrowth=()=>({pokemon:{},inventory:{moveTicket:2,oranberry:3,sitrusberry:1,lumberry:1,cheriberry:0,pechaberry:0,chestoberry:0,leftovers:0},held:{},inherited:{},specialMoves:{},tmInventory:{},stoneInventory:{},mintInventory:{},tmSchema:1,retiredTechniques:[],ticketWins:0,processedItems:[],evolutions:[]});
export const levelOf=xp=>{let level=Math.min(100,Math.max(1,Math.floor(Math.cbrt(xp))));while(level<100&&(level+1)**3<=xp)level++;return level;};
export const xpAt=level=>level**3;
// HP exibido no card do parceiro da Home: o engine transforma o HP base
// (engine.bundle.js, uq0/F9a: HP clássico no Nv. 50, ×1.35) e a tela divide
// o HP do engine por 9 — o resultado é a fórmula clássica de HP no nível.
export const engineBaseHp=baseHp=>{const at50=Math.floor((2*baseHp+31)*50/100)+60;return Math.round(((at50*1.35-60)*100/50-31)/2);};
// O IV entra no HP sobre a base JÁ inflada (o engine faz o mesmo em e7a:
// floor((2*baseInflada+IV)*Nv/100)+Nv+10) — por isso display e batalha batem
// para qualquer IV, não só 31.
export const displayMaxHp=(baseHp,level,iv=31)=>Math.floor((2*engineBaseHp(baseHp)+iv)*level/100)+level+10;
// Stats no nível (os seis), iguais aos do engine em batalha: o HP usa a
// base inflada do engine (ver displayMaxHp); os demais usam a fórmula
// clássica com o IV do Pokémon e a nature efetiva (mint, se houver) — a
// mesma do engine (e7a + q7n). Sem traits, IV 31 e nature neutra: exatamente
// os valores de antes.
// Antes só existia displayMaxHp; nada calculava atk/def/spa/spd/spe no
// nível, por isso a UI exibia os base stats crus (ver app.js: detalhe).
export const displayStats=(stats,level,traits={})=>{const ivs=normalizeIVs(traits.ivs),nature=traits.nature??NEUTRAL_NATURE;const other=stat=>Math.floor((Math.floor((2*stats[stat]+ivs[stat])*level/100)+5)*natureMultiplier(nature,stat));return {hp:displayMaxHp(stats.hp,level,ivs.hp),atk:other('atk'),def:other('def'),spa:other('spa'),spd:other('spd'),spe:other('spe')};};
// XP de nocaute: 1/4 da diferença cúbica — ~4 nocautes do mesmo nível por nível.
export const koXpFor=level=>{const foe=Math.min(100,Math.max(1,Math.round(level)||5));return Math.floor(((foe+1)**3-foe**3)/4);};
export function ensureGrowth(save,catalog){
 if(!save.growth&&save.profileMode!=='journey'&&!save.journey?.starter)return;
 save.growth||=initialGrowth();save.growth.inherited||={};
 const g=save.growth;g.tmInventory||={};g.stoneInventory||={};g.mintInventory||={};g.retiredTechniques||=[];
 // Migração de nature/IV: saves antigos têm só `{xp}` por Pokémon — viram
 // nature neutra + IVs 31, que reproduzem EXATAMENTE os stats de hoje.
 // Aquisições novas rolam traits aleatórios no ato (ver progression.js);
 // aqui nada é sorteado, para a migração ser determinística.
 for(const record of Object.values(g.pokemon)){if(!record||typeof record!=='object')continue;record.nature=NATURES[record.nature]?record.nature:NEUTRAL_NATURE;record.ivs=normalizeIVs(record.ivs);if(record.mintNature!==undefined&&record.mintNature!==null&&!NATURES[record.mintNature])delete record.mintNature;}
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
 if(!save.growth||!Number.isFinite(amount)||amount<=0||!Number.isSafeInteger(amount*4))return [];
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
 const g=save.growth;if(g===undefined)return;g.inherited??={};g.suppressedAuto??={};g.stoneInventory??={};g.mintInventory??={};if(g.pendingAuto===undefined)g.pendingAuto=null;
 const integer=(n,min=0,max=Number.MAX_SAFE_INTEGER)=>Number.isSafeInteger(n)&&n>=min&&n<=max;
 const obj=x=>!!x&&typeof x==='object'&&!Array.isArray(x);
 if(!obj(g)||!obj(g.pokemon)||!obj(g.inventory)||!obj(g.held)||!obj(g.specialMoves)||!integer(g.ticketWins,0,2)||!Array.isArray(g.processedItems)||g.processedItems.some(x=>typeof x!=='string'||x.length>240)||!Array.isArray(g.evolutions)||g.evolutions.some(x=>typeof x!=='string'||x.length>160))throw Error('Progressão de níveis inválida.');
 if(!obj(g.suppressedAuto)||Object.entries(g.suppressedAuto).some(([k,v])=>!save.unlocked.includes(k)||!integer(v,1,100)))throw Error('Evolução automática suprimida inválida.');
 if(g.pendingAuto!==null&&(!obj(g.pendingAuto)||!save.unlocked.includes(g.pendingAuto.mon)||!integer(g.pendingAuto.level,1,100)))throw Error('Evolução automática pendente inválida.');
 if(!obj(g.stoneInventory)||Object.entries(g.stoneInventory).some(([k,v])=>!STONES[k]||!integer(v,0,999)))throw Error('Inventário de pedras inválido.');
 if(!obj(g.mintInventory)||Object.entries(g.mintInventory).some(([k,v])=>!MINTS[k]||!integer(v,0,999)))throw Error('Inventário de mints inválido.');
 // Nature/IVs ausentes são saves antigos (a migração em ensureGrowth
 // completa com neutra/31); presentes, têm que ser válidos.
 if(Object.entries(g.pokemon).some(([key,v])=>!save.unlocked.includes(key)||!obj(v)||!Number.isFinite(v.xp)||v.xp<1||v.xp>1000000||!Number.isSafeInteger(v.xp*4)||(v.nature!==undefined&&!NATURES[v.nature])||(v.mintNature!==undefined&&v.mintNature!==null&&!NATURES[v.mintNature])||(v.ivs!==undefined&&(!obj(v.ivs)||Object.entries(v.ivs).some(([s,n])=>!STAT_KEYS.includes(s)||!integer(n,0,31))))))throw Error('XP inválida.');
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
