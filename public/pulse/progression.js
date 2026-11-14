/** PULSE ARENA local-only progression. Acquisition rarity never modifies combat stats. */
export const SAVE_KEY='pulse-arena.save.v1';
export const ECONOMY=Object.freeze({summonCost:100,dailyCoins:150,duplicateRefund:25,prices:Object.freeze({common:300,rare:600,epic:1200}),rates:Object.freeze({common:.70,rare:.25,epic:.05}),pityAt:10});
export const STARTERS=Object.freeze(['marshadow','lucario','gengar','charizard','blastoise','venusaur']);
const clone=value=>JSON.parse(JSON.stringify(value));
const freeze=value=>{if(value&&typeof value==='object'){Object.freeze(value);for(const item of Object.values(value))freeze(item);}return value;};
const integer=(value,min=0,max=Number.MAX_SAFE_INTEGER)=>Number.isSafeInteger(value)&&value>=min&&value<=max;
const key=value=>typeof value==='string'&&/^[A-Za-z0-9_-]{1,60}$/.test(value);
const unique=items=>new Set(items).size===items.length;
const utcDay=timestamp=>new Date(timestamp).toISOString().slice(0,10);
const success=(save,extra={})=>({ok:true,...extra,save:freeze(clone(save))});
const failure=error=>({ok:false,error});
const defaultSave=timestamp=>({version:1,trainerName:'Treinador',coins:600,unlocked:[...STARTERS],favorite:'marshadow',team:{mons:STARTERS.slice(0,3),moves:{},gimmick:null},records:{battles:0,wins:0,losses:0},gacha:{pulls:0,pity:0},dailyClaimedAt:null,claimedBattles:[],lastRewardAt:null,createdAt:timestamp,updatedAt:timestamp});
function validateSave(value){
 if(!value||value.version!==1)throw Error('Versão de progresso não suportada.');
 if(typeof value.trainerName!=='string'||!validName(value.trainerName))throw Error('Nome de treinador inválido.');
 if(!integer(value.coins)||!Array.isArray(value.unlocked)||!value.unlocked.length||!value.unlocked.every(key)||!unique(value.unlocked))throw Error('Coleção ou saldo inválido.');
 if(!key(value.favorite)||!value.unlocked.includes(value.favorite))throw Error('Favorito inválido.');
 const t=value.team;if(!t||!Array.isArray(t.mons)||![3,6].includes(t.mons.length)||!unique(t.mons)||!t.mons.every(m=>value.unlocked.includes(m)))throw Error('Equipe inválida.');
 if(!t.moves||typeof t.moves!=='object'||Array.isArray(t.moves))throw Error('Lista de golpes inválida.');
 for(const [mon,moves] of Object.entries(t.moves))if(!key(mon)||!Array.isArray(moves)||moves.length>4||!moves.every(m=>typeof m==='string'&&m.length<160)||!unique(moves))throw Error('Golpes inválidos.');
 if(t.gimmick!==null&&(!t.gimmick||t.gimmick.kind!=='mega'||!integer(t.gimmick.mon,0,t.mons.length-1)))throw Error('Mega Evolução inválida.');
 if(!value.records||!['battles','wins','losses'].every(k=>integer(value.records[k]))||value.records.battles!==value.records.wins+value.records.losses)throw Error('Resultados inválidos.');
 if(!value.gacha||!integer(value.gacha.pulls)||!integer(value.gacha.pity,0,9))throw Error('Histórico de invocações inválido.');
 if(value.dailyClaimedAt!==null&&(typeof value.dailyClaimedAt!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(value.dailyClaimedAt)))throw Error('Recompensa diária inválida.');
 if(!Array.isArray(value.claimedBattles)||!value.claimedBattles.every(x=>typeof x==='string'&&x.length>0&&x.length<=160)||!unique(value.claimedBattles))throw Error('Histórico de recompensas inválido.');
 if(value.lastRewardAt!==null&&!integer(value.lastRewardAt))throw Error('Data de recompensa inválida.');
 if(!integer(value.createdAt)||!integer(value.updatedAt))throw Error('Datas de progresso inválidas.');
 return clone(value);
}
function validName(name){return typeof name==='string'&&/^[\p{L}\p{N} ._'-]{2,16}$/u.test(name.trim());}
function acquisitionRarity(mon){
 if(['marshadow','gardevoir','metagross','dragoniteL','garchomp','greninja','tyranitar','salamence'].includes(mon.key))return 'epic';
 // Stable catalog grouping, unrelated to base stats or battle modifiers.
 let hash=0;for(const c of mon.key)hash=(hash*31+c.charCodeAt(0))>>>0;
 return hash%10<3?'rare':'common';
}
function randomFloat(){
 if(globalThis.crypto?.getRandomValues){const bytes=new Uint32Array(1);globalThis.crypto.getRandomValues(bytes);return bytes[0]/4294967296;}
 return Math.random();
}
export function createProgression({storage:providedStorage,rng=randomFloat,now=Date.now}={}){
 let storage=providedStorage,save,monsters=new Map(),recovered=false,memoryOnly=false,message='';
 const time=()=>{const v=Number(now());if(!integer(v))throw Error('Relógio local inválido.');return v;};
 if(storage===undefined)try{storage=globalThis.localStorage||null;}catch{storage=null;}
 if(!storage){memoryOnly=true;message='O armazenamento não está disponível. O progresso fica apenas nesta sessão; exporte uma cópia antes de sair.';}
 let raw=null;
 if(storage)try{raw=storage.getItem(SAVE_KEY);}catch{memoryOnly=true;message='Não foi possível ler o armazenamento. Esta sessão usa uma cópia temporária de progresso.';storage=null;}
 if(raw!==null){try{save=validateSave(JSON.parse(raw));}catch(error){
  recovered=true;message='O progresso salvo não pôde ser lido. Uma cópia foi preservada para recuperação; um perfil inicial está sendo usado.';
  try{storage.setItem(SAVE_KEY+'.recovery.'+time(),raw);}catch{memoryOnly=true;storage=null;message='O progresso salvo não pôde ser lido nem copiado. O arquivo original foi preservado; esta sessão é temporária.';}
 }}
 save||=defaultSave(time());
 const persist=()=>{save.updatedAt=time();if(storage)try{storage.setItem(SAVE_KEY,JSON.stringify(save));}catch{memoryOnly=true;storage=null;message='O aparelho não conseguiu salvar o progresso. Exporte uma cópia antes de sair.';}};
 const entry=mon=>monsters.get(mon);
 const legalMoves=(mon,moves)=>Array.isArray(moves)&&moves.length===Math.min(4,entry(mon)?.pool?.length||4)&&unique(moves)&&moves.every(id=>entry(mon)?.pool?.some(m=>m.id===id));
 const catalogValid=candidate=>{
  if(!monsters.size)throw Error('Carregue a coleção antes de importar progresso.');
  if(candidate.unlocked.some(m=>!entry(m)))throw Error('O arquivo contém Pokémon que não existem nesta versão.');
  for(const [mon,moves]of Object.entries(candidate.team.moves))if(!entry(mon)||!legalMoves(mon,moves))throw Error('O arquivo contém golpes inválidos.');
  if(candidate.team.gimmick&&!entry(candidate.team.mons[candidate.team.gimmick.mon])?.mega)throw Error('Essa espécie não possui Mega Evolução nesta versão.');
 };
 const api={
  setCatalog(roster){
   if(!Array.isArray(roster)||roster.some(m=>!m||!key(m.key)||!Array.isArray(m.pool)))return failure('Catálogo inválido.');
   monsters=new Map(roster.map(m=>[m.key,{...clone(m),rarity:acquisitionRarity(m)}]));
   const available=save.unlocked.filter(m=>entry(m));
   if(available.length<3)return failure('O catálogo precisa incluir ao menos três Pokémon iniciais.');
   const old=JSON.stringify(save.team);const wanted=save.team.mons.length;
   save.team.mons=save.team.mons.filter(m=>entry(m)&&save.unlocked.includes(m));
   for(const mon of available)if(save.team.mons.length<wanted&&!save.team.mons.includes(mon))save.team.mons.push(mon);
   if(save.team.mons.length<6)save.team.mons=save.team.mons.slice(0,3);
   for(const [mon,moves]of Object.entries(save.team.moves))if(!entry(mon)||!legalMoves(mon,moves))delete save.team.moves[mon];
   if(save.team.gimmick&&!entry(save.team.mons[save.team.gimmick.mon])?.mega)save.team.gimmick=null;
   if(!entry(save.favorite))save.favorite=available[0];
   if(old!==JSON.stringify(save.team)){recovered=true;message='A equipe foi ajustada para os Pokémon e golpes disponíveis nesta versão. Sua coleção foi preservada.';}
   persist();return success(save);
  },
  getCatalog(){return freeze([...monsters.values()].map(mon=>({...clone(mon),owned:save.unlocked.includes(mon.key),price:ECONOMY.prices[mon.rarity]})));},
  getSave(){return freeze(clone(save));},
  status(){return freeze({memoryOnly,recovered,message});},
  setTrainerName(name){if(!validName(name))return failure('Use de 2 a 16 letras, números ou espaços.');save.trainerName=name.trim();persist();return success(save);},
  setFavorite(mon){if(!save.unlocked.includes(mon)||!entry(mon))return failure('Desbloqueie esse Pokémon primeiro.');save.favorite=mon;persist();return success(save);},
  setTeam(team){
   const candidate=Array.isArray(team)?{mons:team,moves:save.team.moves,gimmick:null}:team;
   if(!candidate||!Array.isArray(candidate.mons)||![3,6].includes(candidate.mons.length)||!unique(candidate.mons)||candidate.mons.some(m=>!entry(m)||!save.unlocked.includes(m)))return failure('Escolha 3 ou 6 Pokémon diferentes da sua coleção.');
   const moves=clone(candidate.moves||save.team.moves);
   for(const [mon,ids]of Object.entries(moves))if(!entry(mon)||!legalMoves(mon,ids))return failure('Escolha quatro golpes válidos por Pokémon.');
   const gimmick=candidate.gimmick??null;
   if(gimmick&&(!integer(gimmick.mon,0,candidate.mons.length-1)||gimmick.kind!=='mega'||!entry(candidate.mons[gimmick.mon])?.mega))return failure('Mega Evolução indisponível para essa escolha.');
   save.team={mons:[...candidate.mons],moves,gimmick:clone(gimmick)};persist();return success(save);
  },
  setMoves(mon,ids){if(!entry(mon)||!save.unlocked.includes(mon)||!legalMoves(mon,ids))return failure('Escolha quatro golpes diferentes da lista desse Pokémon.');save.team.moves[mon]=[...ids];persist();return success(save);},
  setMega(mon){if(mon===null){save.team.gimmick=null;}else{if(!integer(mon,0,save.team.mons.length-1)||!entry(save.team.mons[mon])?.mega)return failure('Esse Pokémon não possui Mega Evolução.');save.team.gimmick={kind:'mega',mon};}persist();return success(save);},
  claimDaily(){const day=utcDay(time());if(save.dailyClaimedAt&&save.dailyClaimedAt>=day)return failure('A recompensa de hoje já foi recebida.');save.dailyClaimedAt=day;save.coins+=ECONOMY.dailyCoins;persist();return success(save,{coins:ECONOMY.dailyCoins});},
  summon(count=1){
   if(!integer(count,1,10))return failure('Escolha de 1 a 10 invocações.');if(!monsters.size)return failure('A coleção ainda está carregando.');
   const spent=count*ECONOMY.summonCost;if(save.coins<spent)return failure('Moedas insuficientes.');
   const pools={common:[],rare:[],epic:[]};for(const mon of monsters.values())pools[mon.rarity].push(mon);
   if(!pools.common.length||!pools.rare.length||!pools.epic.length)return failure('Catálogo de invocação incompleto.');
   const next=clone(save),pulls=[];let refund=0;
   try{for(let i=0;i<count;i++){
    const roll=Number(rng()),choice=Number(rng());if(!Number.isFinite(roll)||roll<0||roll>=1||!Number.isFinite(choice)||choice<0||choice>=1)throw Error('A invocação não pôde ser sorteada. Tente novamente.');
    const guaranteed=next.gacha.pity>=ECONOMY.pityAt-1;
    const rarity=guaranteed?(roll<.95?'rare':'epic'):(roll<.70?'common':roll<.95?'rare':'epic');
    const mon=pools[rarity][Math.floor(choice*pools[rarity].length)],duplicate=next.unlocked.includes(mon.key),rebate=duplicate?ECONOMY.duplicateRefund:0;
    if(!duplicate)next.unlocked.push(mon.key);refund+=rebate;next.gacha.pulls++;next.gacha.pity=rarity==='common'?next.gacha.pity+1:0;
    pulls.push({key:mon.key,name:mon.name,rarity,duplicate,refund:rebate,guaranteed});
   }}catch(error){return failure(error.message);}
   next.coins-=spent-refund;save=next;persist();return success(save,{pulls,spent,refund});
  },
  buyPokemon(mon){const item=entry(mon);if(!item)return failure('Pokémon indisponível.');if(save.unlocked.includes(mon))return failure('Esse Pokémon já está na sua coleção.');const spent=ECONOMY.prices[item.rarity];if(save.coins<spent)return failure('Moedas insuficientes.');save.coins-=spent;save.unlocked.push(mon);persist();return success(save,{key:mon,spent});},
  recordBattle(result){
   if(!result||typeof result.id!=='string'||!result.id.length||result.id.length>160||typeof result.won!=='boolean'||!integer(result.frames,0)||!integer(result.difficulty,1,5)||!['3v3','6v6'].includes(result.format)||!['win','loss','surrender'].includes(result.reason)||(result.reason==='win'&&!result.won)||(result.reason!=='win'&&result.won))return failure('Resultado de batalha inválido.');
   if(save.claimedBattles.includes(result.id))return failure('Essa batalha já foi registrada.');
   save.claimedBattles.push(result.id);save.records.battles++;save.records[result.won?'wins':'losses']++;
   const timestamp=time(),eligible=result.reason!=='surrender'&&result.frames>=300&&(save.lastRewardAt===null||timestamp-save.lastRewardAt>=8000);
   const coins=eligible?(result.won?60+10*result.difficulty:25+5*result.difficulty):0;
   if(eligible){save.coins+=coins;save.lastRewardAt=timestamp;}persist();return success(save,{coins,rewarded:eligible,won:result.won});
  },
  exportSave(){return JSON.stringify(save,null,2);},
  importSave(json){try{if(typeof json!=='string'||json.length>2*1024*1024)return failure('Arquivo de progresso inválido ou muito grande.');const candidate=validateSave(JSON.parse(json));catalogValid(candidate);save=candidate;recovered=false;if(!memoryOnly)message='';persist();return success(save);}catch(error){return failure(error.message||'Arquivo de progresso inválido.');}}
 };
 return api;
}
const local=createProgression();
export const setCatalog=(...args)=>local.setCatalog(...args);
export const getCatalog=(...args)=>local.getCatalog(...args);
export const getSave=(...args)=>local.getSave(...args);
export const status=(...args)=>local.status(...args);
export const setTrainerName=(...args)=>local.setTrainerName(...args);
export const setFavorite=(...args)=>local.setFavorite(...args);
export const setTeam=(...args)=>local.setTeam(...args);
export const setMoves=(...args)=>local.setMoves(...args);
export const setMega=(...args)=>local.setMega(...args);
export const claimDaily=(...args)=>local.claimDaily(...args);
export const summon=(...args)=>local.summon(...args);
export const buyPokemon=(...args)=>local.buyPokemon(...args);
export const recordBattle=(...args)=>local.recordBattle(...args);
export const exportSave=(...args)=>local.exportSave(...args);
export const importSave=(...args)=>local.importSave(...args);
