import {LEARNSETS} from './learnsets.js';
const moveRequirementAvailable=(key,id)=>LEARNSETS[key]?.levelMoves[id]!==undefined||LEARNSETS[key]?.specialMoves.includes(id);
import {initialGrowth,ensureGrowth,validateGrowth,learnedMoves,selectedMoves,levelOf,xpAt,addXP,koXpFor,ITEMS,STONES,STONE_EVOLUTIONS,EVOLUTIONS,specialPool,awardTicketWin} from './growth.js';
import {bannerPool} from './banners.js';
import {INITIAL_PARTNERS,CHAPTER_ONE,newJourney,validateJourney} from './campaign.js';
/** PULSE ARENA local-only progression. Acquisition rarity never modifies combat stats. */
export const SAVE_KEY='pulse-arena.save.v1';
export const ECONOMY=Object.freeze({summonCost:100,dailyCoins:150,duplicateDiamonds:Object.freeze({common:10,rare:30,epic:100}),prices:Object.freeze({common:60,rare:180,epic:600}),shinyPrice:300,rates:Object.freeze({common:.70,rare:.25,epic:.05}),pityAt:10});
export const STARTERS=Object.freeze(['marshadow','lucario','gengar','charizard','blastoise','venusaur']);
const clone=value=>JSON.parse(JSON.stringify(value));
const freeze=value=>{if(value&&typeof value==='object'){Object.freeze(value);for(const item of Object.values(value))freeze(item);}return value;};
const integer=(value,min=0,max=Number.MAX_SAFE_INTEGER)=>Number.isSafeInteger(value)&&value>=min&&value<=max;
const key=value=>typeof value==='string'&&/^[A-Za-z0-9_-]{1,60}$/.test(value);
const unique=items=>new Set(items).size===items.length;
const utcDay=timestamp=>new Date(timestamp).toISOString().slice(0,10);
const success=(save,extra={})=>({ok:true,...extra,save:freeze(clone(save))});
const failure=error=>({ok:false,error});
const defaultSave=timestamp=>({version:1,trainerName:'Treinador',trainer:{xp:0},coins:600,diamonds:0,shinies:[],shinyEquipped:[],unlocked:[...STARTERS],favorite:'marshadow',team:{mons:STARTERS.slice(0,3),moves:{},gimmick:null},records:{battles:0,wins:0,losses:0},gacha:{pulls:0,pity:0},dailyClaimedAt:null,claimedBattles:[],lastRewardAt:null,createdAt:timestamp,updatedAt:timestamp});
function validateSave(value){
 if(value?.journey)validateJourney(value.journey);
 if(value?.version===1){value={...value,diamonds:value.diamonds??0,shinies:value.shinies??[],shinyEquipped:value.shinyEquipped??[],trainer:value.trainer??{xp:0}};}
 validateGrowth(value);
 if(!value||value.version!==1)throw Error('Versão de progresso não suportada.');
 if(typeof value.trainerName!=='string'||!validName(value.trainerName))throw Error('Nome de treinador inválido.');
 if(!value.trainer||!integer(value.trainer.xp,0,1000000))throw Error('Experiência de treinador inválida.');
 if(!integer(value.coins)||!Array.isArray(value.unlocked)||(!value.unlocked.length&&!(value.profileMode==='journey'&&value.journey?.starter===null))||!value.unlocked.every(key)||!unique(value.unlocked))throw Error('Coleção ou saldo inválido.');
 if(!(value.favorite===null&&value.profileMode==='journey'&&value.journey?.starter===null)&&(!key(value.favorite)||!value.unlocked.includes(value.favorite)))throw Error('Favorito inválido.');
 if(!integer(value.diamonds)||!Array.isArray(value.shinies)||!unique(value.shinies)||!value.shinies.every(m=>key(m)&&value.unlocked.includes(m))||!Array.isArray(value.shinyEquipped)||!unique(value.shinyEquipped)||!value.shinyEquipped.every(m=>value.shinies.includes(m)))throw Error('Diamantes ou versões shiny inválidos.');
 const t=value.team;if(!t||!Array.isArray(t.mons)||!(value.growth||value.profileMode==='journey'?integer(t.mons.length,value.journey?.starter===null?0:1,6):[3,6].includes(t.mons.length))||!unique(t.mons)||!t.mons.every(m=>value.unlocked.includes(m)))throw Error('Equipe inválida.');
 if(!t.moves||typeof t.moves!=='object'||Array.isArray(t.moves))throw Error('Lista de golpes inválida.');
 for(const [mon,moves] of Object.entries(t.moves))if(!key(mon)||!Array.isArray(moves)||moves.length>4||!moves.every(m=>typeof m==='string'&&m.length<160)||!unique(moves))throw Error('Golpes inválidos.');
 if(t.gimmick!==null&&(!t.gimmick||t.gimmick.kind!=='mega'||!integer(t.gimmick.mon,0,t.mons.length-1)))throw Error('Mega Evolução inválida.');
 if(!value.records||!['battles','wins','losses'].every(k=>integer(value.records[k]))||value.records.battles!==value.records.wins+value.records.losses)throw Error('Resultados inválidos.');
 if(!value.gacha||!integer(value.gacha.pulls)||!integer(value.gacha.pity,0,9))throw Error('Histórico de invocações inválido.');
 if(value.gacha.banners!==undefined&&(typeof value.gacha.banners!=='object'||value.gacha.banners===null||Array.isArray(value.gacha.banners)||Object.entries(value.gacha.banners).some(([k,v])=>!['battle','night'].includes(k)||!v||!integer(v.pulls)||!integer(v.pity,0,9))))throw Error('Histórico de banners inválido.');
 if(value.dailyClaimedAt!==null&&(typeof value.dailyClaimedAt!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(value.dailyClaimedAt)))throw Error('Recompensa diária inválida.');
 if(!Array.isArray(value.claimedBattles)||!value.claimedBattles.every(x=>typeof x==='string'&&x.length>0&&x.length<=160)||!unique(value.claimedBattles))throw Error('Histórico de recompensas inválido.');
 if(value.lastRewardAt!==null&&!integer(value.lastRewardAt))throw Error('Data de recompensa inválida.');
 if(!integer(value.createdAt)||!integer(value.updatedAt))throw Error('Datas de progresso inválidas.');
 return clone(value);
}
function validName(name){return typeof name==='string'&&/^[\p{L}\p{N} ._'-]{2,16}$/u.test(name.trim());}
function acquisitionRarity(mon){
 if(['articuno','zapdos','moltres','mewtwo','mew','dragonite','marshadow','gardevoir','metagross','dragoniteL','garchomp','greninja','tyranitar','salamence'].includes(mon.key))return 'epic';
 // Stable catalog grouping, unrelated to base stats or battle modifiers.
 let hash=0;for(const c of mon.key)hash=(hash*31+c.charCodeAt(0))>>>0;
 return hash%10<3?'rare':'common';
}
function randomFloat(){
 if(globalThis.crypto?.getRandomValues){const bytes=new Uint32Array(1);globalThis.crypto.getRandomValues(bytes);return bytes[0]/4294967296;}
 return Math.random();
}
export function createProgression({storage:providedStorage,rng=randomFloat,now=Date.now,profileMode='legacy'}={}){
 let storage=providedStorage,save,monsters=new Map(),recovered=false,memoryOnly=false,message='',shinyCatalog=new Set();
 const time=()=>{const v=Number(now());if(!integer(v))throw Error('Relógio local inválido.');return v;};
 if(storage===undefined)try{storage=globalThis.localStorage||null;}catch{storage=null;}
 if(!storage){memoryOnly=true;message='O armazenamento não está disponível. O progresso fica apenas nesta sessão; exporte uma cópia antes de sair.';}
 let raw=null;
 if(storage)try{raw=storage.getItem(SAVE_KEY);}catch{memoryOnly=true;message='Não foi possível ler o armazenamento. Esta sessão usa uma cópia temporária de progresso.';storage=null;}
 if(raw!==null){try{save=validateSave(JSON.parse(raw));}catch(error){
  recovered=true;message='O progresso salvo não pôde ser lido. Uma cópia foi preservada para recuperação; um perfil inicial está sendo usado.';
  try{storage.setItem(SAVE_KEY+'.recovery.'+time(),raw);}catch{memoryOnly=true;storage=null;message='O progresso salvo não pôde ser lido nem copiado. O arquivo original foi preservado; esta sessão é temporária.';}
 }}
 if(!save){save=defaultSave(time());if(profileMode==='journey')Object.assign(save,{profileMode:'journey',journey:newJourney(),unlocked:[],favorite:null,team:{mons:[],moves:{},gimmick:null}});}
 const persist=()=>{save.updatedAt=time();if(storage)try{storage.setItem(SAVE_KEY,JSON.stringify(save));}catch{memoryOnly=true;storage=null;message='O aparelho não conseguiu salvar o progresso. Exporte uma cópia antes de sair.';}};
 const entry=mon=>monsters.get(mon);
 const addTrainerXP=amount=>{save.trainer??={xp:0};const before=levelOf(save.trainer.xp);save.trainer.xp=Math.min(1000000,save.trainer.xp+amount);return {xp:amount,from:before,to:levelOf(save.trainer.xp)};};
 const oldLegalMoves=(mon,moves)=>Array.isArray(moves)&&moves.length===Math.min(4,entry(mon)?.pool?.length||4)&&unique(moves)&&moves.every(id=>entry(mon)?.pool?.some(m=>m.id===id));
 const legalMoves=(mon,moves,state=save)=>state.growth?Array.isArray(moves)&&moves.length>=1&&moves.length<=4&&unique(moves)&&moves.every(id=>learnedMoves(state,entry(mon)).some(m=>m.id===id)):oldLegalMoves(mon,moves);
 const catalogValid=candidate=>{
  if(!monsters.size)throw Error('Carregue a coleção antes de importar progresso.');
  if(candidate.unlocked.some(m=>!entry(m)))throw Error('O arquivo contém Pokémon que não existem nesta versão.');
  for(const [mon,moves]of Object.entries(candidate.team.moves))if(!entry(mon)||!legalMoves(mon,moves,candidate))throw Error('O arquivo contém golpes inválidos.');
  if(candidate.team.gimmick&&!entry(candidate.team.mons[candidate.team.gimmick.mon])?.mega)throw Error('Essa espécie não possui Mega Evolução nesta versão.');
 };
 const api={
  setCatalog(roster){
   if(!Array.isArray(roster)||roster.some(m=>!m||!key(m.key)||!Array.isArray(m.pool)))return failure('Catálogo inválido.');
   monsters=new Map(roster.map(m=>[m.key,{...clone(m),rarity:acquisitionRarity(m)}]));
   if(!save.growth&&save.profileMode==='journey'&&storage)try{storage.setItem(SAVE_KEY+'.before-growth',JSON.stringify(save));}catch{}
   if(save.growth&&save.growth.tmSchema!==1&&storage)try{storage.setItem(SAVE_KEY+'.before-tm',JSON.stringify(save));}catch{}
   ensureGrowth(save,monsters);
   const available=save.unlocked.filter(m=>entry(m));
   if(save.profileMode==='journey'&&save.journey?.starter===null){persist();return success(save);}
   if(available.length<(save.growth||save.profileMode==='journey'?1:3))return failure('O catálogo precisa incluir ao menos três Pokémon iniciais.');
   const old=JSON.stringify(save.team);const wanted=save.team.mons.length;
   save.team.mons=save.team.mons.filter(m=>entry(m)&&save.unlocked.includes(m));
   for(const mon of available)if(save.team.mons.length<wanted&&!save.team.mons.includes(mon))save.team.mons.push(mon);
   if(!save.growth&&save.profileMode!=='journey'&&save.team.mons.length<6)save.team.mons=save.team.mons.slice(0,3);
   for(const [mon,moves]of Object.entries(save.team.moves))if(!entry(mon)||!legalMoves(mon,moves))delete save.team.moves[mon];
   if(save.team.gimmick&&!entry(save.team.mons[save.team.gimmick.mon])?.mega)save.team.gimmick=null;
   if(!entry(save.favorite))save.favorite=available[0];
   if(old!==JSON.stringify(save.team)){recovered=true;message='A equipe foi ajustada para os Pokémon e golpes disponíveis nesta versão. Sua coleção foi preservada.';}
   if(save.growth)for(const mon of save.team.mons)save.team.moves[mon]=selectedMoves(save,entry(mon));
   persist();return success(save);
  },
  chooseStarter(mon){
   if(!INITIAL_PARTNERS.includes(mon)||!entry(mon))return failure('Escolha um dos três parceiros iniciais disponíveis.');
   if(save.journey?.starter)return failure('Seu parceiro inicial já foi escolhido.');
   save.journey||=newJourney();save.journey.starter=mon;
   if(!save.unlocked.includes(mon))save.unlocked.push(mon);
   if(save.profileMode==='journey'){save.team={mons:[mon],moves:{},gimmick:null};save.favorite=mon;}
   ensureGrowth(save,monsters);
   if(save.growth&&save.profileMode==='journey')for(const key of save.team.mons)save.team.moves[key]=selectedMoves(save,entry(key));
   persist();return success(save);
  },
  beginStage(stage,id){
   const j=save.journey,s=CHAPTER_ONE.find(x=>x.id===stage);
   if(!j?.starter||!s||CHAPTER_ONE.indexOf(s)>j.cleared.length||typeof id!=='string'||!id.length||id.length>160)return failure('Fase indisponível.');
   if(j.resolvedBattles.includes(id))return failure('Essa tentativa já foi encerrada.');
   if(j.active)return failure('Conclua ou abandone a fase em andamento primeiro.');
   j.active={id,stage,encounter:s.wild?{key:s.wild,state:'pending',attempts:0}:null};persist();return success(save);
  },
  resolveEncounter(action){const e=save.journey?.active?.encounter;if(!e||e.state!=='pending'||!['fled','defeated'].includes(action))return failure('Encontro indisponível.');e.state=action;persist();return success(save);},
  captureWild({id,hpRatio=1,status=false}={}){
   const active=save.journey?.active,e=active?.encounter;
   if(!active||active.id!==id||!e||e.state!=='pending'||!entry(e.key)||!Number.isFinite(hpRatio)||hpRatio<=0||hpRatio>1||typeof status!=='boolean')return failure('Captura indisponível.');
   if(save.journey.inventory.pokeball<1)return failure('Você está sem Poké Balls.');
   const roll=Number(rng());if(!Number.isFinite(roll)||roll<0||roll>=1)return failure('Não foi possível sortear a captura.');
   const chance=Math.min(.95,.25+.6*(1-hpRatio)+(status ? .1 : 0));save.journey.inventory.pokeball--;e.attempts++;
   const captured=roll<chance;if(captured){e.state='captured';if(!save.unlocked.includes(e.key))save.unlocked.push(e.key);}
   ensureGrowth(save,monsters);persist();return success(save,{captured,chance,key:e.key});
  },
  buyPokeballs(count=1){if(!integer(count,1,99)||!save.journey?.starter)return failure('Compra indisponível.');const spent=count*50;if(save.coins<spent)return failure('Moedas insuficientes.');save.coins-=spent;save.journey.inventory.pokeball+=count;persist();return success(save,{spent});},
  abandonStage(){if(!save.journey?.active)return failure('Nenhuma fase em andamento.');save.journey.resolvedBattles.push(save.journey.active.id);save.journey.active=null;persist();return success(save);},
  completeStage(result){
   const j=save.journey;
   if(!j?.active||result?.id!==j.active.id||typeof result.won!=='boolean'||!integer(result.frames,60))return failure('Resultado de fase inválido.');
   if(j.active.encounter?.state==='pending')return failure('Resolva o encontro selvagem primeiro.');
   const stage=CHAPTER_ONE.find(x=>x.id===j.active.stage);let coins=0;const first=result.won&&!j.cleared.includes(stage.id);
   const trainerXp=addTrainerXP(result.won?(first?300+CHAPTER_ONE.indexOf(stage)*180:150+CHAPTER_ONE.indexOf(stage)*30):60);let tickets=awardTicketWin(save,result.won);if(first&&save.growth){save.growth.inventory.moveTicket++;tickets++;}
   if(result.won&&!j.cleared.includes(stage.id)){j.cleared.push(stage.id);coins=stage.firstClearCoins;save.coins+=coins;if(stage.badge)j.badges.push(stage.badge);}
   save.records.battles++;save.records[result.won?'wins':'losses']++;j.resolvedBattles.push(j.active.id);j.active=null;persist();return success(save,{coins,trainerXp,tickets});
  },
  getMoves(mon){const item=entry(mon);return item?clone(learnedMoves(save,item)):[];},
  getTeam(){const team=clone(save.team);if(save.growth)for(const key of team.mons)team.moves[key]=selectedMoves(save,entry(key));return team;},
  buyItem(id,count=1){if(!save.growth||!ITEMS[id]||!integer(count,1,99))return failure('Item indisponível.');const spent=ITEMS[id].price*count;if(save.coins<spent)return failure('Moedas insuficientes.');save.coins-=spent;save.growth.inventory[id]+=count;persist();return success(save,{spent});},
  buyStone(id){if(!save.growth||!STONES[id])return failure('Pedra indisponível.');const spent=STONES[id].price;if(save.coins<spent)return failure('Moedas insuficientes.');save.coins-=spent;save.growth.stoneInventory[id]=(save.growth.stoneInventory[id]||0)+1;persist();return success(save,{spent});},
  useStone(mon,stoneId){const g=save.growth;if(!g||!save.unlocked.includes(mon)||!(g.stoneInventory?.[stoneId]>0))return failure('Escolha uma pedra da mochila e um Pokémon obtido.');
   if(save.journey?.active)return failure('Use a pedra depois de concluir a fase em andamento.');
   const target=STONE_EVOLUTIONS[mon]?.[stoneId];if(!target||!entry(target))return failure('Essa pedra não evolui esse Pokémon.');
   const result=api.evolvePokemon(mon,target,stoneId);if(!result.ok)return result;
   g.stoneInventory[stoneId]--;persist();return success(save,{from:mon,target,stone:stoneId});
  },
  equipItem(mon,id){if(!save.growth||!save.unlocked.includes(mon)||id!==null&&!ITEMS[id])return failure('Escolha um item e um Pokémon da coleção.');if(save.journey?.active)return failure('Troque os itens depois de terminar a fase em andamento.');const old=save.growth.held[mon];if(old===id)return success(save);if(id&&save.growth.inventory[id]<1)return failure('Esse item não está na mochila.');if(old)save.growth.inventory[old]++;delete save.growth.held[mon];if(id){save.growth.inventory[id]--;save.growth.held[mon]=id;}persist();return success(save);},
  consumeHeld({battleId,mon,item}){const g=save.growth,event=battleId+':'+mon+':'+item;if(!g||typeof battleId!=='string'||!battleId.length||battleId.length>160||g.held[mon]!==item||!ITEMS[item]||item==='leftovers'||g.processedItems.includes(event))return failure('Item já consumido ou indisponível.');delete g.held[mon];g.processedItems.push(event);persist();return success(save);},
  summonMove(mon){const item=entry(mon),g=save.growth;if(!g||!item||!save.unlocked.includes(mon))return failure('Escolha um Pokémon da sua coleção.');const pool=specialPool(save,mon,item);if(!pool.length)return failure('Todos os golpes especiais disponíveis para esse Pokémon já foram aprendidos.');if(g.inventory.moveTicket<1)return failure('Você precisa de um ticket de técnica.');const roll=Number(rng());if(!Number.isFinite(roll)||roll<0||roll>=1)return failure('Não foi possível sortear a técnica.');const id=pool[Math.floor(roll*pool.length)];g.tmInventory||={};g.tmInventory[id]=(g.tmInventory[id]||0)+1;g.inventory.moveTicket--;persist();return success(save,{mon,move:clone(item.pool.find(m=>m.id===id)),spent:1});},
  teachTM(mon,id){const g=save.growth,item=entry(mon);if(!g||!item||!save.unlocked.includes(mon)||!(g.tmInventory?.[id]>0))return failure('Escolha uma TM da mochila e um Pokémon obtido.');
   if(save.journey?.active)return failure('Use a TM depois de concluir a fase em andamento.');
   const source=[...monsters.values()].flatMap(x=>x.pool).find(x=>x.id===id),target=item.pool.find(x=>x.name===source?.name&&LEARNSETS[mon]?.specialMoves.includes(x.id));
   if(!target)return failure('Esse Pokémon não é compatível com esta TM.');if(learnedMoves(save,item).some(x=>x.name===target.name))return failure('Esse Pokémon já conhece este golpe.');
   g.tmInventory[id]--;g.specialMoves[mon]||=[];g.specialMoves[mon].push(target.id);persist();return success(save,{mon,move:clone(target)});
  },
  previewEvolution(mon,stoneId=null){
   const stoneTarget=stoneId?STONE_EVOLUTIONS[mon]?.[stoneId]:null;
   const edge=stoneTarget?[stoneTarget,1]:EVOLUTIONS[mon],record=save.growth?.pokemon[mon];if(!edge||!record||(!stoneTarget&&levelOf(record.xp)<edge[1])||!entry(edge[0]))return null;
   const target=edge[0],next=clone(save);next.growth.pokemon[target]={xp:record.xp};
   const knownNames=learnedMoves(save,entry(mon)).map(m=>m.name);
   const inherited=entry(target).pool.filter(m=>knownNames.includes(m.name)).filter(m=>moveRequirementAvailable(target,m.id));
   next.growth.inherited[target]=[...new Set([...(next.growth.inherited[target]||[]),...inherited.map(m=>m.id)])];
   const oldNames=(next.team.moves[mon]||[]).map(id=>entry(mon).pool.find(m=>m.id===id)?.name);
   next.team.moves[target]=learnedMoves(next,entry(target)).filter(m=>oldNames.includes(m.name)).map(m=>m.id).slice(0,4);
   return {from:mon,target,level:levelOf(record.xp),moves:selectedMoves(next,entry(target)),inherited:next.growth.inherited[target]};
  },
  evolvePokemon(mon,target,stoneId=null){const evolution=api.previewEvolution(mon,stoneId);if(!evolution||evolution.target!==target)return failure('Esse Pokémon ainda não pode evoluir.');const g=save.growth,xp=g.pokemon[mon].xp;if(g.pendingAuto?.mon===mon)g.pendingAuto=null;if(g.suppressedAuto)delete g.suppressedAuto[mon];g.pokemon[target]={xp:Math.max(xp,g.pokemon[target]?.xp||0)};delete g.pokemon[mon];delete g.specialMoves[mon];g.inherited[target]=evolution.inherited;delete g.inherited[mon];save.unlocked=save.unlocked.filter(k=>k!==mon);if(!save.unlocked.includes(target))save.unlocked.push(target);g.evolutions.push(mon+'>'+target);if(g.held[mon]){if(g.held[target])g.inventory[g.held[target]]++;g.held[target]=g.held[mon];delete g.held[mon];}save.team.mons=[...new Set(save.team.mons.map(k=>k===mon?target:k))];delete save.team.moves[mon];save.team.moves[target]=evolution.moves;if(save.favorite===mon)save.favorite=target;save.shinyEquipped=save.shinyEquipped.filter(k=>k!==mon);save.shinies=save.shinies.filter(k=>k!==mon);if(save.team.gimmick&&!entry(save.team.mons[save.team.gimmick.mon])?.mega)save.team.gimmick=null;persist();return success(save,{from:mon,target});},
  setShinyCatalog(keys){if(!Array.isArray(keys)||keys.some(k=>!entry(k)))return failure('Catálogo shiny inválido.');shinyCatalog=new Set(keys);return {ok:true};},
  getCatalog(){return freeze([...monsters.values()].map(mon=>({...clone(mon),owned:save.unlocked.includes(mon.key),level:save.growth?levelOf(save.growth.pokemon[mon.key]?.xp??125):50,xp:save.growth?.pokemon[mon.key]?.xp??null,heldItem:save.growth?.held[mon.key]||null,learned:learnedMoves(save,mon).map(m=>m.id),price:ECONOMY.prices[mon.rarity],shinyAvailable:shinyCatalog.has(mon.key)})));},
  getSave(){return freeze(clone(save));},
  status(){return freeze({memoryOnly,recovered,message});},
  setTrainerName(name){if(!validName(name))return failure('Use de 2 a 16 letras, números ou espaços.');save.trainerName=name.trim();persist();return success(save);},
  setFavorite(mon){if(!save.unlocked.includes(mon)||!entry(mon))return failure('Desbloqueie esse Pokémon primeiro.');save.favorite=mon;persist();return success(save);},
  setTeam(team){
   const candidate=Array.isArray(team)?{mons:team,moves:save.team.moves,gimmick:null}:team;
   if(!candidate||!Array.isArray(candidate.mons)||!(save.growth||save.profileMode==='journey'?integer(candidate.mons.length,1,6):[3,6].includes(candidate.mons.length))||!unique(candidate.mons)||candidate.mons.some(m=>!entry(m)||!save.unlocked.includes(m)))return failure('Escolha 3 ou 6 Pokémon diferentes da sua coleção.');
   const moves=clone(candidate.moves||save.team.moves);
   for(const [mon,ids]of Object.entries(moves))if(!entry(mon)||!legalMoves(mon,ids))return failure('Escolha quatro golpes válidos por Pokémon.');
   const gimmick=candidate.gimmick??null;
   if(gimmick&&(!integer(gimmick.mon,0,candidate.mons.length-1)||gimmick.kind!=='mega'||!entry(candidate.mons[gimmick.mon])?.mega))return failure('Mega Evolução indisponível para essa escolha.');
   save.team={mons:[...candidate.mons],moves,gimmick:clone(gimmick)};persist();return success(save);
  },
  setMoves(mon,ids){if(!entry(mon)||!save.unlocked.includes(mon)||!legalMoves(mon,ids))return failure('Escolha quatro golpes diferentes da lista desse Pokémon.');save.team.moves[mon]=[...ids];persist();return success(save);},
  setMega(mon){if(mon===null){save.team.gimmick=null;}else{if(!integer(mon,0,save.team.mons.length-1)||!entry(save.team.mons[mon])?.mega)return failure('Esse Pokémon não possui Mega Evolução.');save.team.gimmick={kind:'mega',mon};}persist();return success(save);},
  claimDaily(){const day=utcDay(time());if(save.dailyClaimedAt&&save.dailyClaimedAt>=day)return failure('A recompensa de hoje já foi recebida.');save.dailyClaimedAt=day;save.coins+=ECONOMY.dailyCoins;const tickets=save.growth?2:0;if(save.growth)save.growth.inventory.moveTicket+=tickets;persist();return success(save,{coins:ECONOMY.dailyCoins,tickets});},
  summon(count=1,bannerId='route'){
   if(!integer(count,1,10))return failure('Escolha de 1 a 10 invocações.');if(!monsters.size)return failure('A coleção ainda está carregando.');
   const selection=bannerPool([...monsters.values()],bannerId);if(!selection)return failure('Banner indisponível.');
   const spent=count*ECONOMY.summonCost;if(save.coins<spent)return failure('Moedas insuficientes.');
   const pools={common:[],rare:[],epic:[]};for(const mon of selection)pools[mon.rarity].push(mon);
   if(!pools.common.length||!pools.rare.length||!pools.epic.length)return failure('Catálogo de invocação incompleto.');
   const next=clone(save),pulls=[];let diamonds=0;next.gacha.banners||={};const meter=bannerId==='route'?{pulls:next.gacha.pulls,pity:next.gacha.pity}:(next.gacha.banners[bannerId]||{pulls:0,pity:0});
   try{for(let i=0;i<count;i++){
    const roll=Number(rng()),choice=Number(rng());if(!Number.isFinite(roll)||roll<0||roll>=1||!Number.isFinite(choice)||choice<0||choice>=1)throw Error('A invocação não pôde ser sorteada. Tente novamente.');
    const guaranteed=meter.pity>=ECONOMY.pityAt-1;
    const rarity=guaranteed?(roll<.95?'rare':'epic'):(roll<.70?'common':roll<.95?'rare':'epic');
    const mon=pools[rarity][Math.floor(choice*pools[rarity].length)],duplicate=next.unlocked.includes(mon.key),rebate=duplicate?ECONOMY.duplicateDiamonds[rarity]:0;
    if(!duplicate)next.unlocked.push(mon.key);diamonds+=rebate;meter.pulls++;meter.pity=rarity==='common'?meter.pity+1:0;
    pulls.push({key:mon.key,name:mon.name,rarity,duplicate,diamonds:rebate,guaranteed});
   }}catch(error){return failure(error.message);}
   if(bannerId==='route'){next.gacha.pulls=meter.pulls;next.gacha.pity=meter.pity;}else next.gacha.banners[bannerId]=meter;
   next.coins-=spent;next.diamonds+=diamonds;save=next;ensureGrowth(save,monsters);persist();return success(save,{pulls,spent,diamonds});
  },
  buyPokemon(mon){const item=entry(mon);if(!item)return failure('Pokémon indisponível.');if(save.unlocked.includes(mon))return failure('Esse Pokémon já está na sua coleção.');const spent=ECONOMY.prices[item.rarity];if(save.diamonds<spent)return failure('Diamantes insuficientes.');save.diamonds-=spent;save.unlocked.push(mon);ensureGrowth(save,monsters);persist();return success(save,{key:mon,spent});},
  buyShiny(mon){if(!entry(mon)||!shinyCatalog.has(mon))return failure('Versão shiny indisponível nesta edição.');if(!save.unlocked.includes(mon))return failure('Desbloqueie o Pokémon primeiro.');if(save.shinies.includes(mon))return failure('Você já possui essa versão shiny.');if(save.diamonds<ECONOMY.shinyPrice)return failure('Diamantes insuficientes.');save.diamonds-=ECONOMY.shinyPrice;save.shinies.push(mon);save.shinyEquipped.push(mon);persist();return success(save,{spent:ECONOMY.shinyPrice});},
  equipShiny(mon,on){if(!save.shinies.includes(mon))return failure('Adquira essa versão shiny primeiro.');save.shinyEquipped=save.shinyEquipped.filter(k=>k!==mon);if(on)save.shinyEquipped.push(mon);persist();return success(save);},
  recordBattle(result){
   if(!result||typeof result.id!=='string'||!result.id.length||result.id.length>160||typeof result.won!=='boolean'||!integer(result.frames,0)||!integer(result.difficulty,1,5)||!['3v3','6v6'].includes(result.format)||!['win','loss','surrender'].includes(result.reason)||(result.reason==='win'&&!result.won)||(result.reason!=='win'&&result.won))return failure('Resultado de batalha inválido.');
   if(save.claimedBattles.includes(result.id))return failure('Essa batalha já foi registrada.');
   save.claimedBattles.push(result.id);save.records.battles++;save.records[result.won?'wins':'losses']++;
   const timestamp=time(),eligible=result.reason!=='surrender'&&result.frames>=300&&(save.lastRewardAt===null||timestamp-save.lastRewardAt>=8000);
   const coins=eligible?(result.won?60+10*result.difficulty:25+5*result.difficulty):0;
   const trainerXp=eligible?addTrainerXP(result.won?180+result.difficulty*35:60):null;const tickets=awardTicketWin(save,eligible&&result.won);if(eligible){save.coins+=coins;save.lastRewardAt=timestamp;}persist();return success(save,{coins,trainerXp,tickets,rewarded:eligible,won:result.won});
  },
  awardKnockoutXP({foeLevel=5,participants=[],killer=null}={}){const g=save.growth;if(!g)return failure('Progressão indisponível.');const total=koXpFor(foeLevel);const keys=[...new Set((participants||[]).filter(k=>g.pokemon[k]))];if(!keys.length)return failure('Nenhum participante válido.');const share=Math.floor(total/keys.length);let remainder=total-share*keys.length;const changes=[];for(const key of keys){const amount=share+(key===killer&&remainder>0?remainder:0);if(key===killer)remainder=0;changes.push(...addXP(save,[key],amount));}persist();return success(save,{total,changes,participants:keys});},
  suppressAutoEvolution(mon,level){const g=save.growth;if(!g||!save.unlocked.includes(mon)||!integer(level,1,100))return failure('Evolução indisponível.');g.suppressedAuto??={};g.suppressedAuto[mon]=level;if(g.pendingAuto?.mon===mon)g.pendingAuto=null;persist();return success(save);},
  deferAutoEvolution(mon,level){const g=save.growth;if(!g||!save.unlocked.includes(mon)||!integer(level,1,100))return failure('Evolução indisponível.');g.pendingAuto={mon,level};persist();return success(save);},
  clearPendingAuto(){const g=save.growth;if(!g)return failure('Progressão indisponível.');g.pendingAuto=null;persist();return success(save);},
  exportSave(){return JSON.stringify(save,null,2);},
  importSave(json){try{if(typeof json!=='string'||json.length>2*1024*1024)return failure('Arquivo de progresso inválido ou muito grande.');const candidate=validateSave(JSON.parse(json));const migrating=!candidate.growth;ensureGrowth(candidate,monsters);if(migrating&&candidate.growth)for(const key of candidate.team.mons)candidate.team.moves[key]=selectedMoves(candidate,entry(key));catalogValid(candidate);save=candidate;recovered=false;if(!memoryOnly)message='';persist();return success(save);}catch(error){return failure(error.message||'Arquivo de progresso inválido.');}}
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
