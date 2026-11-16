import {LEARNSETS} from './learnsets.js';
import {NATIONAL_RARITIES} from './expansion-rules.js';
const moveRequirementAvailable=(key,id)=>LEARNSETS[key]?.levelMoves[id]!==undefined||LEARNSETS[key]?.specialMoves.includes(id);
import {initialGrowth,ensureGrowth,validateGrowth,learnedMoves,selectedMoves,levelOf,xpAt,addXP,koXpFor,ITEMS,STONES,STONE_EVOLUTIONS,EVOLUTIONS,specialPool,awardTicketWin,MINTS,rollTraits,effectiveNature} from './growth.js';
import {bannerPool,isSummonable,SUMMON_BANNERS} from './banners.js';
import {INITIAL_PARTNERS,ALL_STAGES,newJourney,validateJourney} from './campaign.js';
import {MISSIONS,MISSION_BY_ID,initialMissions,validateMissions} from './missions.js';
/** PULSE ARENA local-only progression. Acquisition rarity never modifies combat stats. */
export const SAVE_KEY='pulse-arena.save.v1';
export const ECONOMY=Object.freeze({summonDiamondCost:100,dailyCoins:150,duplicateDiamonds:Object.freeze({C:10,R:30,SR:60,UR:300,SSS:150}),prices:Object.freeze({C:60,R:180,SR:360,UR:1800,SSS:900}),shinyPrice:300,rates:Object.freeze({C:.70,R:.21,SR:.078,UR:.005,SSS:.007}),pityAt:10,ticketDropRate:.10});
export const STARTERS=Object.freeze(['marshadow','lucario','gengar','charizard','blastoise','venusaur']);
export const TRAINERS=Object.freeze([
 {key:'alain',name:'Alain'},
 {key:'archie',name:'Archie'},
 {key:'ash',name:'Ash'},
 {key:'ashjohto',name:'Ash (Johto)'},
 {key:'az',name:'AZ'},
 {key:'blue',name:'Blue'},
 {key:'brendan',name:'Brendan'},
 {key:'cynthia',name:'Cynthia'},
 {key:'cyrus',name:'Cyrus'},
 {key:'dawn',name:'Dawn'},
 {key:'diantha',name:'Diantha'},
 {key:'gold',name:'Ethan'},
 {key:'gary',name:'Gary'},
 {key:'ghetsis',name:'Ghetsis'},
 {key:'giovanni',name:'Giovanni'},
 {key:'gladion',name:'Gladion'},
 {key:'iris',name:'Iris'},
 {key:'jaiden',name:'Jaiden'},
 {key:'joey',name:'Joey'},
 {key:'jonathan',name:'Jonathan'},
 {key:'lance',name:'Lance'},
 {key:'leon',name:'Leon'},
 {key:'lillie',name:'Lillie'},
 {key:'lillie_dress',name:'Lillie (dress)'},
 {key:'lucas',name:'Lucas'},
 {key:'maxie',name:'Maxie'},
 {key:'may',name:'May'},
 {key:'mustard',name:'Mustard'},
 {key:'n',name:'N'},
 {key:'paul',name:'Paul'},
 {key:'oak',name:'Prof. Oak'},
 {key:'red',name:'Red'},
 {key:'silver',name:'Silver'},
 {key:'steven',name:'Steven'},
 {key:'wolfe',name:'Wolfe'}
]);
const TRAINER_KEYS=new Set(TRAINERS.map(t=>t.key));
export const resolveTrainerKey=key=>TRAINER_KEYS.has(key)?key:'red';
export const trainerFace=key=>'/faces/'+resolveTrainerKey(key)+'.png';
export const trainerLabel=key=>TRAINERS.find(t=>t.key===resolveTrainerKey(key))?.name||'Red';
const clone=value=>JSON.parse(JSON.stringify(value));
const freeze=value=>{if(value&&typeof value==='object'){Object.freeze(value);for(const item of Object.values(value))freeze(item);}return value;};
const integer=(value,min=0,max=Number.MAX_SAFE_INTEGER)=>Number.isSafeInteger(value)&&value>=min&&value<=max;
const key=value=>typeof value==='string'&&/^[A-Za-z0-9_-]{1,60}$/.test(value);
const unique=items=>new Set(items).size===items.length;
const utcDay=timestamp=>new Date(timestamp).toISOString().slice(0,10);
const success=(save,extra={})=>({ok:true,...extra,save:freeze(clone(save))});
const failure=error=>({ok:false,error});
// Conta online: pendingMatches = resultados ranqueados contra bot que o
// servidor ainda não recebeu (offline-first, fase 2b); ranking = último
// standing do servidor, para a tela de Ranking abrir mesmo offline.
const defaultOnline=()=>({provider:null,team:null,userId:null,syncedAt:null,pendingSync:false,pendingMatches:[],ranking:null});
const validPendingMatch=m=>m&&typeof m==='object'&&!Array.isArray(m)&&['win','loss'].includes(m.result)&&(m.opponent_id===null||typeof m.opponent_id==='string'&&m.opponent_id.length<=80)&&typeof m.vs_bot==='boolean'&&typeof m.battleId==='string'&&m.battleId.length>0&&m.battleId.length<=160&&integer(m.createdAt);
const validRanking=r=>r===null||(r&&typeof r==='object'&&!Array.isArray(r)&&typeof r.tier==='string'&&r.tier.length<=60&&integer(r.points,0)&&integer(r.cachedAt));
const defaultSave=timestamp=>({version:1,trainerName:'Treinador',trainerKey:'red',trainer:{xp:0},coins:600,diamonds:0,tickets:0,starterTicketsClaimed:false,shinies:[],shinyEquipped:[],unlocked:[...STARTERS],favorite:'marshadow',team:{mons:STARTERS.slice(0,3),moves:{},gimmick:null},records:{battles:0,wins:0,losses:0},gacha:{pulls:0,pity:0},dailyClaimedAt:null,claimedBattles:[],lastRewardAt:null,missions:initialMissions(),createdAt:timestamp,updatedAt:timestamp,online:defaultOnline()});
function validateSave(value){
 if(value?.journey)validateJourney(value.journey);
 if(value?.version===1){const priorOnline=value.online&&typeof value.online==='object'&&!Array.isArray(value.online)?value.online:{};value={...value,diamonds:value.diamonds??0,tickets:value.tickets??0,starterTicketsClaimed:value.starterTicketsClaimed??false,shinies:value.shinies??[],shinyEquipped:value.shinyEquipped??[],trainer:value.trainer??{xp:0},trainerKey:value.trainerKey??'red',online:{provider:priorOnline.provider??null,team:priorOnline.team??null,userId:priorOnline.userId??null,syncedAt:priorOnline.syncedAt??null,pendingSync:priorOnline.pendingSync??false,pendingMatches:Array.isArray(priorOnline.pendingMatches)?priorOnline.pendingMatches.filter(validPendingMatch):[],ranking:validRanking(priorOnline.ranking??null)?(priorOnline.ranking??null):null}};}
 value.missions??=initialMissions();
 validateGrowth(value);
 if(!value||value.version!==1)throw Error('Versão de progresso não suportada.');
 if(!value.online||typeof value.online!=='object'||Array.isArray(value.online)||![null,'guest','google','local'].includes(value.online.provider)||!(value.online.team===null||['valor','instinct','mystic'].includes(value.online.team))||!(value.online.userId===null||typeof value.online.userId==='string'&&value.online.userId.length<=80)||!(value.online.syncedAt===null||integer(value.online.syncedAt))||typeof value.online.pendingSync!=='boolean'||!Array.isArray(value.online.pendingMatches)||!value.online.pendingMatches.every(validPendingMatch)||!validRanking(value.online.ranking))throw Error('Conta online inválida.');
 if(typeof value.trainerName!=='string'||!validName(value.trainerName))throw Error('Nome de treinador inválido.');
 if(!TRAINER_KEYS.has(value.trainerKey))throw Error('Treinador inválido.');
 if(!value.trainer||!integer(value.trainer.xp,0,1000000))throw Error('Experiência de treinador inválida.');
 if(!integer(value.coins)||!Array.isArray(value.unlocked)||(!value.unlocked.length&&!(value.profileMode==='journey'&&value.journey?.starter===null))||!value.unlocked.every(key)||!unique(value.unlocked))throw Error('Coleção ou saldo inválido.');
 if(!(value.favorite===null&&value.profileMode==='journey'&&value.journey?.starter===null)&&(!key(value.favorite)||!value.unlocked.includes(value.favorite)))throw Error('Favorito inválido.');
 if(!integer(value.diamonds)||!Array.isArray(value.shinies)||!unique(value.shinies)||!value.shinies.every(m=>key(m)&&value.unlocked.includes(m))||!Array.isArray(value.shinyEquipped)||!unique(value.shinyEquipped)||!value.shinyEquipped.every(m=>value.shinies.includes(m)))throw Error('Diamantes ou versões shiny inválidos.');
 if(!integer(value.tickets)||typeof value.starterTicketsClaimed!=='boolean')throw Error('Tickets de invocação inválidos.');
 validateMissions(value.missions);
 const t=value.team;if(!t||!Array.isArray(t.mons)||!(value.growth||value.profileMode==='journey'?integer(t.mons.length,value.journey?.starter===null?0:1,6):[3,6].includes(t.mons.length))||!unique(t.mons)||!t.mons.every(m=>value.unlocked.includes(m)))throw Error('Equipe inválida.');
 if(!t.moves||typeof t.moves!=='object'||Array.isArray(t.moves))throw Error('Lista de golpes inválida.');
 for(const [mon,moves] of Object.entries(t.moves))if(!key(mon)||!Array.isArray(moves)||moves.length>4||!moves.every(m=>typeof m==='string'&&m.length<160)||!unique(moves))throw Error('Golpes inválidos.');
 if(t.gimmick!==null&&(!t.gimmick||t.gimmick.kind!=='mega'||!integer(t.gimmick.mon,0,t.mons.length-1)))throw Error('Mega Evolução inválida.');
 if(!value.records||!['battles','wins','losses'].every(k=>integer(value.records[k]))||value.records.battles!==value.records.wins+value.records.losses)throw Error('Resultados inválidos.');
 if(!value.gacha||!integer(value.gacha.pulls)||!integer(value.gacha.pity,0,9))throw Error('Histórico de invocações inválido.');
 if(value.gacha.banners!==undefined&&(typeof value.gacha.banners!=='object'||value.gacha.banners===null||Array.isArray(value.gacha.banners)||Object.entries(value.gacha.banners).some(([k,v])=>!SUMMON_BANNERS.some(b=>b.id===k&&k!=='route')||!v||!integer(v.pulls)||!integer(v.pity,0,9))))throw Error('Histórico de banners inválido.');
 if(value.dailyClaimedAt!==null&&(typeof value.dailyClaimedAt!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(value.dailyClaimedAt)))throw Error('Recompensa diária inválida.');
 if(!Array.isArray(value.claimedBattles)||!value.claimedBattles.every(x=>typeof x==='string'&&x.length>0&&x.length<=160)||!unique(value.claimedBattles))throw Error('Histórico de recompensas inválido.');
 if(value.lastRewardAt!==null&&!integer(value.lastRewardAt))throw Error('Data de recompensa inválida.');
 if(!integer(value.createdAt)||!integer(value.updatedAt))throw Error('Datas de progresso inválidas.');
 return clone(value);
}
function validName(name){return typeof name==='string'&&/^[\p{L}\p{N} ._'-]{2,16}$/u.test(name.trim());}
// Raridades por meta + anime (soma de duas notas 1-5; ver raridades-pulse-arena.md): SR soma >= 7, R soma 5-6, C soma <= 4. Aerodactyl/Hitmonlee/Hitmonchan são da expansão da Batalha (exceção de estágio único).
const SUMMON_SR=Object.freeze(['bulbasaur','charmander','squirtle','clefairy','vulpix','growlithe','abra','shellder','gastly','exeggcute','rhyhorn','staryu','eevee','dratini','omanyte','kabuto','spiritomb','absolNM','shedinjaNM','aerodactyl']);
// R explicito por especie: o hash antigo deixava a Batalha sem R (nenhum dos 10 C sorteava raro) e a Noite com um so.
const SUMMON_R=Object.freeze(['pikachu','sandshrew','nidoranf','nidoranm','jigglypuff','diglett','mankey','machop','ponyta','slowpoke','magnemite','doduo','seel','drowzee','voltorb','cubone','koffing','magikarp','hitmonlee','hitmonchan']);
function acquisitionRarity(mon){
 if(NATIONAL_RARITIES[mon.key])return NATIONAL_RARITIES[mon.key];
 if(['mew','marshadow'].includes(mon.key))return 'SSS';
 if(['articuno','zapdos','moltres','mewtwo'].includes(mon.key))return 'UR';
 if(SUMMON_SR.includes(mon.key))return 'SR';
 if(SUMMON_R.includes(mon.key))return 'R';
 return 'C';
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
 const progressMission=(state,metric,amount=1)=>{if(!Number.isSafeInteger(amount)||amount<1||!state.missions)return;state.missions.progress[metric]=Math.min(1000000,(state.missions.progress[metric]||0)+amount);};
 const missionRows=()=>MISSIONS.map(mission=>{const current=Math.min(mission.target,mission.metric==='collection'?Math.max(save.missions.progress.collection||0,save.unlocked.length):save.missions.progress[mission.metric]||0);return {...mission,current,complete:current>=mission.target,claimed:save.missions.claimed.includes(mission.id)};});
 const recordBattleMissions=result=>{progressMission(save,'battles');if(result.won)progressMission(save,'battleWins');if(Number.isSafeInteger(result.knockouts)&&result.knockouts>0)progressMission(save,'knockouts',Math.min(result.knockouts,1000));};
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
   const fresh=!save.unlocked.includes(mon);
   if(!save.unlocked.includes(mon))save.unlocked.push(mon);
   if(save.profileMode==='journey'){save.team={mons:[mon],moves:{},gimmick:null};save.favorite=mon;}
   ensureGrowth(save,monsters);
   // Aquisição nova: nature e IVs sorteados (só se o Pokémon ainda não era
   // da coleção — re-escolha nunca sobrescreve traits existentes).
   if(fresh&&save.growth?.pokemon[mon])Object.assign(save.growth.pokemon[mon],rollTraits(rng));
   if(save.growth&&save.profileMode==='journey')for(const key of save.team.mons)save.team.moves[key]=selectedMoves(save,entry(key));
   persist();return success(save);
  },
  beginStage(stage,id){
   const j=save.journey,s=ALL_STAGES.find(x=>x.id===stage);
   if(!j?.starter||!s||ALL_STAGES.indexOf(s)>j.cleared.length||typeof id!=='string'||!id.length||id.length>160)return failure('Fase indisponível.');
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
  const captured=roll<chance;let freshCapture=false;if(captured){e.state='captured';freshCapture=!save.unlocked.includes(e.key);if(!save.unlocked.includes(e.key))save.unlocked.push(e.key);progressMission(save,'captures');}
  ensureGrowth(save,monsters);
  // Captura nova: nature e IVs sorteados (o registro nasce no ensureGrowth
  // acima; duplicata mantém os traits que já tinha).
  if(captured&&freshCapture&&save.growth?.pokemon[e.key])Object.assign(save.growth.pokemon[e.key],rollTraits(rng));
  persist();return success(save,{captured,chance,key:e.key});
  },
  buyPokeballs(count=1){if(!integer(count,1,99)||!save.journey?.starter)return failure('Compra indisponível.');const spent=count*50;if(save.coins<spent)return failure('Moedas insuficientes.');save.coins-=spent;save.journey.inventory.pokeball+=count;persist();return success(save,{spent});},
  abandonStage(){if(!save.journey?.active)return failure('Nenhuma fase em andamento.');save.journey.resolvedBattles.push(save.journey.active.id);save.journey.active=null;persist();return success(save);},
  completeStage(result){
   const j=save.journey;
  if(!j?.active||result?.id!==j.active.id||typeof result.won!=='boolean'||!integer(result.frames,60)||result.knockouts!==undefined&&!integer(result.knockouts,0,1000))return failure('Resultado de fase inválido.');
   if(j.active.encounter?.state==='pending')return failure('Resolva o encontro selvagem primeiro.');
   const stage=ALL_STAGES.find(x=>x.id===j.active.stage);let coins=0;const first=result.won&&!j.cleared.includes(stage.id);
  const trainerXp=addTrainerXP(result.won?(first?300+ALL_STAGES.indexOf(stage)*180:150+ALL_STAGES.indexOf(stage)*30):60);let tickets=awardTicketWin(save,result.won);if(first&&save.growth){save.growth.inventory.moveTicket++;tickets++;}
   let gachaTickets=0;if(first){const dropRoll=Number(rng());if(Number.isFinite(dropRoll)&&dropRoll<ECONOMY.ticketDropRate){save.tickets=(save.tickets||0)+1;gachaTickets=1;}}
   if(result.won&&!j.cleared.includes(stage.id)){j.cleared.push(stage.id);coins=stage.firstClearCoins;save.coins+=coins;if(stage.badge)j.badges.push(stage.badge);}
  save.records.battles++;save.records[result.won?'wins':'losses']++;recordBattleMissions(result);j.resolvedBattles.push(j.active.id);j.active=null;persist();return success(save,{coins,trainerXp,tickets,gachaTickets});
  },
  getMoves(mon){const item=entry(mon);return item?clone(learnedMoves(save,item)):[];},
  getTeam(){const team=clone(save.team);if(save.growth)for(const key of team.mons)team.moves[key]=selectedMoves(save,entry(key));return team;},
  buyItem(id,count=1){if(!save.growth||!ITEMS[id]||!integer(count,1,99))return failure('Item indisponível.');const spent=ITEMS[id].price*count;if(save.coins<spent)return failure('Moedas insuficientes.');save.coins-=spent;save.growth.inventory[id]+=count;persist();return success(save,{spent});},
  buyStone(id){if(!save.growth||!STONES[id])return failure('Pedra indisponível.');const spent=STONES[id].price;if(save.coins<spent)return failure('Moedas insuficientes.');save.coins-=spent;save.growth.stoneInventory[id]=(save.growth.stoneInventory[id]||0)+1;persist();return success(save,{spent});},
  buyMint(id,count=1){if(!save.growth||!MINTS[id]||!integer(count,1,99))return failure('Mint indisponível.');const spent=MINTS[id].price*count;if(save.coins<spent)return failure('Moedas insuficientes.');save.coins-=spent;save.growth.mintInventory[id]=(save.growth.mintInventory[id]||0)+count;persist();return success(save,{spent});},
  // Mint (Sword/Shield): muda o EFEITO da nature nos stats, sem trocar a
  // nature original — guardada em `mintNature`. Outra mint substitui o
  // efeito; o cálculo (tela e batalha) usa a nature efetiva.
  useMint(mon,mintId){const g=save.growth;if(!g||!save.unlocked.includes(mon)||!MINTS[mintId]||!(g.mintInventory?.[mintId]>0))return failure('Escolha uma mint da mochila e um Pokémon obtido.');
   if(save.journey?.active)return failure('Use a mint depois de concluir a fase em andamento.');
   const record=g.pokemon[mon];if(!record)return failure('Pokémon sem progresso.');
   const nature=MINTS[mintId].nature;
   if(record.mintNature===nature)return failure('Essa mint já está em efeito neste Pokémon.');
   record.mintNature=nature;g.mintInventory[mintId]--;persist();return success(save,{mon,mint:mintId,nature,original:record.nature});
  },
  useStone(mon,stoneId){const g=save.growth;if(!g||!save.unlocked.includes(mon)||!(g.stoneInventory?.[stoneId]>0))return failure('Escolha uma pedra da mochila e um Pokémon obtido.');
   if(save.journey?.active)return failure('Use a pedra depois de concluir a fase em andamento.');
   const target=STONE_EVOLUTIONS[mon]?.[stoneId];if(!target||!entry(target))return failure('Essa pedra não evolui esse Pokémon.');
   const result=api.evolvePokemon(mon,target,stoneId);if(!result.ok)return result;
   g.stoneInventory[stoneId]--;persist();return success(save,{from:mon,target,stone:stoneId});
  },
  equipItem(mon,id){if(!save.growth||!save.unlocked.includes(mon)||id!==null&&!ITEMS[id])return failure('Escolha um item e um Pokémon da coleção.');if(save.journey?.active)return failure('Troque os itens depois de terminar a fase em andamento.');const old=save.growth.held[mon];if(old===id)return success(save);if(id&&save.growth.inventory[id]<1)return failure('Esse item não está na mochila.');if(old)save.growth.inventory[old]++;delete save.growth.held[mon];if(id){save.growth.inventory[id]--;save.growth.held[mon]=id;}persist();return success(save);},
  consumeHeld({battleId,mon,item}){const g=save.growth,event=battleId+':'+mon+':'+item;if(!g||typeof battleId!=='string'||!battleId.length||battleId.length>160||g.held[mon]!==item||!ITEMS[item]||item==='leftovers'||g.processedItems.includes(event))return failure('Item já consumido ou indisponível.');delete g.held[mon];g.processedItems.push(event);persist();return success(save);},
  summonMove(mon){const item=entry(mon),g=save.growth;if(!g||!item||!save.unlocked.includes(mon))return failure('Escolha um Pokémon da sua coleção.');const pool=specialPool(save,mon,item);if(!pool.length)return failure('Todos os golpes especiais disponíveis para esse Pokémon já foram aprendidos.');if(g.inventory.moveTicket<1)return failure('Você precisa de um ticket de técnica.');const roll=Number(rng());if(!Number.isFinite(roll)||roll<0||roll>=1)return failure('Não foi possível sortear a técnica.');const id=pool[Math.floor(roll*pool.length)];g.tmInventory||={};g.tmInventory[id]=(g.tmInventory[id]||0)+1;g.inventory.moveTicket--;progressMission(save,'tmDraws');persist();return success(save,{mon,move:clone(item.pool.find(m=>m.id===id)),spent:1});},
  teachTM(mon,id){const g=save.growth,item=entry(mon);if(!g||!item||!save.unlocked.includes(mon)||!(g.tmInventory?.[id]>0))return failure('Escolha uma TM da mochila e um Pokémon obtido.');
   if(save.journey?.active)return failure('Use a TM depois de concluir a fase em andamento.');
   const source=[...monsters.values()].flatMap(x=>x.pool).find(x=>x.id===id),target=item.pool.find(x=>x.name===source?.name&&LEARNSETS[mon]?.specialMoves.includes(x.id));
  if(!target)return failure('Esse Pokémon não é compatível com esta TM.');if(learnedMoves(save,item).some(x=>x.name===target.name))return failure('Esse Pokémon já conhece este golpe.');
  g.tmInventory[id]--;g.specialMoves[mon]||=[];g.specialMoves[mon].push(target.id);progressMission(save,'tmUses');persist();return success(save,{mon,move:clone(target)});
  },
  previewEvolution(mon,stoneId=null){
   const stoneTarget=stoneId?STONE_EVOLUTIONS[mon]?.[stoneId]:null;
   const edge=stoneTarget?[stoneTarget,1]:EVOLUTIONS[mon],record=save.growth?.pokemon[mon];if(!edge||!record||(!stoneTarget&&levelOf(record.xp)<edge[1])||!entry(edge[0]))return null;
   const target=edge[0],next=clone(save);next.growth.pokemon[target]={xp:record.xp,nature:record.nature,ivs:record.ivs,...(record.mintNature?{mintNature:record.mintNature}:{})};
   const knownNames=learnedMoves(save,entry(mon)).map(m=>m.name);
   const inherited=entry(target).pool.filter(m=>knownNames.includes(m.name)).filter(m=>moveRequirementAvailable(target,m.id));
   next.growth.inherited[target]=[...new Set([...(next.growth.inherited[target]||[]),...inherited.map(m=>m.id)])];
   const oldNames=(next.team.moves[mon]||[]).map(id=>entry(mon).pool.find(m=>m.id===id)?.name);
   next.team.moves[target]=learnedMoves(next,entry(target)).filter(m=>oldNames.includes(m.name)).map(m=>m.id).slice(0,4);
   return {from:mon,target,level:levelOf(record.xp),moves:selectedMoves(next,entry(target)),inherited:next.growth.inherited[target]};
  },
  evolvePokemon(mon,target,stoneId=null){const evolution=api.previewEvolution(mon,stoneId);if(!evolution||evolution.target!==target)return failure('Esse Pokémon ainda não pode evoluir.');const g=save.growth,xp=g.pokemon[mon].xp,source=g.pokemon[mon],hadTarget=!!g.pokemon[target];
   // A evolução mantém nature, IVs e mint do Pokémon — ou os do alvo, se a
   // forma evoluída já era da coleção (dois indivíduos, um registro).
   const traits=hadTarget?{nature:g.pokemon[target].nature,ivs:g.pokemon[target].ivs,...(g.pokemon[target].mintNature?{mintNature:g.pokemon[target].mintNature}:{})}:{nature:source?.nature??'hardy',ivs:source?.ivs,...(source?.mintNature?{mintNature:source.mintNature}:{})};
   g.pokemon[target]={xp:Math.max(xp,g.pokemon[target]?.xp||0),...traits};delete g.pokemon[mon];delete g.specialMoves[mon];g.inherited[target]=evolution.inherited;delete g.inherited[mon];save.unlocked=save.unlocked.filter(k=>k!==mon);if(!save.unlocked.includes(target))save.unlocked.push(target);g.evolutions.push(mon+'>'+target);if(g.held[mon]){if(g.held[target])g.inventory[g.held[target]]++;g.held[target]=g.held[mon];delete g.held[mon];}save.team.mons=[...new Set(save.team.mons.map(k=>k===mon?target:k))];delete save.team.moves[mon];save.team.moves[target]=evolution.moves;if(save.favorite===mon)save.favorite=target;save.shinyEquipped=save.shinyEquipped.filter(k=>k!==mon);save.shinies=save.shinies.filter(k=>k!==mon);if(save.team.gimmick&&!entry(save.team.mons[save.team.gimmick.mon])?.mega)save.team.gimmick=null;progressMission(save,'evolutions');persist();return success(save,{from:mon,target});},
  setShinyCatalog(keys){if(!Array.isArray(keys)||keys.some(k=>!entry(k)))return failure('Catálogo shiny inválido.');shinyCatalog=new Set(keys);return {ok:true};},
  getCatalog(){return freeze([...monsters.values()].map(mon=>({...clone(mon),owned:save.unlocked.includes(mon.key),level:save.growth?levelOf(save.growth.pokemon[mon.key]?.xp??125):50,xp:save.growth?.pokemon[mon.key]?.xp??null,nature:save.growth?.pokemon[mon.key]?.nature??null,ivs:save.growth?.pokemon[mon.key]?.ivs??null,mintNature:save.growth?.pokemon[mon.key]?.mintNature??null,effectiveNature:save.growth?.pokemon[mon.key]?effectiveNature(save.growth.pokemon[mon.key]):null,heldItem:save.growth?.held[mon.key]||null,learned:learnedMoves(save,mon).map(m=>m.id),price:ECONOMY.prices[mon.rarity],shinyAvailable:shinyCatalog.has(mon.key)})));},
  getMissions(){return freeze(missionRows());},
  claimMission(id){const mission=MISSION_BY_ID[id];if(!mission)return failure('Missão indisponível.');if(save.missions.claimed.includes(id))return failure('Esta missão já foi resgatada.');const row=missionRows().find(item=>item.id===id);if(!row?.complete)return failure('Conclua a missão antes de resgatar.');if(mission.reward==='tm'&&!save.growth)return failure('Inicie a jornada para resgatar tickets de TM.');if(mission.reward==='tm')save.growth.inventory.moveTicket+=mission.rewardCount;else save.tickets+=mission.rewardCount;save.missions.claimed.push(id);persist();return success(save,{mission:clone(mission),reward:mission.reward,count:mission.rewardCount});},
  recordMissionBattle(result){if(!result||typeof result.id!=='string'||!result.id.length||result.id.length>160||typeof result.won!=='boolean'||result.knockouts!==undefined&&!integer(result.knockouts,0,1000))return failure('Resultado de batalha inválido.');recordBattleMissions(result);persist();return success(save);},
  getSave(){return freeze(clone(save));},
  status(){return freeze({memoryOnly,recovered,message});},
  setTrainerName(name){if(!validName(name))return failure('Use de 2 a 16 letras, números ou espaços.');save.trainerName=name.trim();persist();return success(save);},
  setTrainerKey(key){if(!TRAINER_KEYS.has(key))return failure('Escolha um treinador da lista.');save.trainerKey=key;persist();return success(save);},
  // Time do Pokémon GO (Valor / Instinct / Mystic). null = sem time.
  setGoTeam(team){if(team!==null&&!['valor','instinct','mystic'].includes(team))return failure('Escolha um time: Valor, Instinct ou Mystic.');save.online??=defaultOnline();save.online.team=team;persist();return success(save);},
  // Conta online (provider 'guest' | 'google' | 'local', sem senha nem token aqui:
  // o token de sessão vive em localStorage, fora do save exportável).
  setOnlineAccount(patch={}){
   if(!patch||typeof patch!=='object'||Array.isArray(patch))return failure('Conta online inválida.');
   const next={...defaultOnline(),...(save.online??{})};
   if('provider' in patch){if(![null,'guest','google','local'].includes(patch.provider))return failure('Conta online inválida.');next.provider=patch.provider;}
   if('team' in patch){if(!(patch.team===null||['valor','instinct','mystic'].includes(patch.team)))return failure('Escolha um time: Valor, Instinct ou Mystic.');next.team=patch.team;}
   if('userId' in patch){if(!(patch.userId===null||typeof patch.userId==='string'&&patch.userId.length<=80))return failure('Conta online inválida.');next.userId=patch.userId;}
   if('syncedAt' in patch){if(!(patch.syncedAt===null||integer(patch.syncedAt)))return failure('Conta online inválida.');next.syncedAt=patch.syncedAt;}
   if('pendingSync' in patch){if(typeof patch.pendingSync!=='boolean')return failure('Conta online inválida.');next.pendingSync=patch.pendingSync;}
   if('ranking' in patch){if(!validRanking(patch.ranking))return failure('Conta online inválida.');next.ranking=patch.ranking;}
   save.online=next;persist();return success(save);
  },
  // Resultado ranqueado aguardando o servidor (offline-first). Deduplicado
  // por battleId; no máximo 20 na fila (o mais antigo sai primeiro).
  queuePendingMatch(match){
   if(!validPendingMatch(match))return failure('Resultado de batalha inválido.');
   save.online??=defaultOnline();
   save.online.pendingMatches??=[];
   if(save.online.pendingMatches.some(m=>m.battleId===match.battleId))return success(save,{duplicate:true});
   save.online.pendingMatches.push({...match});
   while(save.online.pendingMatches.length>20)save.online.pendingMatches.shift();
   persist();return success(save);
  },
  clearPendingMatches(battleIds){
   save.online??=defaultOnline();
   save.online.pendingMatches??=[];
   const before=save.online.pendingMatches.length;
   if(battleIds===undefined)save.online.pendingMatches=[];
   else if(Array.isArray(battleIds))save.online.pendingMatches=save.online.pendingMatches.filter(m=>!battleIds.includes(m.battleId));
   else return failure('Resultado de batalha inválido.');
   persist();return success(save,{removed:before-save.online.pendingMatches.length});
  },
  // Guarda o último standing do servidor para a tela de Ranking offline.
  // Só os campos conhecidos entram no save; o resto é exibição do servidor.
  setCachedRanking(standing){
   if(!standing||typeof standing!=='object'||Array.isArray(standing)||typeof standing.tier!=='string'||!integer(standing.points,0))return failure('Ranking inválido.');
   const num=(v,fallback=null)=>Number.isFinite(v)?v:fallback;
   const str=(v,fallback=null)=>typeof v==='string'?v:fallback;
   const ranking={tier:standing.tier,tier_name:str(standing.tier_name),rank:num(standing.rank),points:standing.points,lo:num(standing.lo),hi:num(standing.hi),next:str(standing.next),floor:num(standing.floor),wins:num(standing.wins,0),losses:num(standing.losses,0),games:num(standing.games,0),streak:num(standing.streak,0),season:str(standing.season),ladder_rank:num(standing.ladder_rank),cachedAt:time()};
   save.online??=defaultOnline();
   save.online.ranking=ranking;persist();return success(save,{ranking});
  },
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
  claimDaily(){const day=utcDay(time());if(save.dailyClaimedAt&&save.dailyClaimedAt>=day)return failure('A recompensa de hoje já foi recebida.');save.dailyClaimedAt=day;save.coins+=ECONOMY.dailyCoins;const tickets=save.growth?2:0;if(save.growth)save.growth.inventory.moveTicket+=tickets;progressMission(save,'dailyClaims');persist();return success(save,{coins:ECONOMY.dailyCoins,tickets});},
  claimStarterTickets(){if(save.starterTicketsClaimed)return failure('Recompensa inicial já resgatada.');save.starterTicketsClaimed=true;save.tickets=(save.tickets||0)+10;persist();return success(save,{tickets:10});},
  summon(count=1,bannerId='route'){
   if(!integer(count,1,10))return failure('Escolha de 1 a 10 invocações.');if(!monsters.size)return failure('A coleção ainda está carregando.');
   const selection=bannerPool([...monsters.values()],bannerId);if(!selection)return failure('Banner indisponível.');
   const banner=SUMMON_BANNERS.find(b=>b.id===bannerId);
   const premium=!!banner?.premium;
   const ticketCost=premium?(banner.ticketCost||2):1,diamondCost=premium?(banner.diamondCost||400):ECONOMY.summonDiamondCost;
   const ticketPulls=Math.min(count,Math.floor((save.tickets||0)/ticketCost)),diamondPulls=count-ticketPulls,spentTickets=ticketPulls*ticketCost,spentDiamonds=diamondPulls*diamondCost;if(save.diamonds<spentDiamonds)return failure('Tickets e diamantes insuficientes.');
   const pools={C:[],R:[],SR:[],UR:[],SSS:[]};for(const mon of selection)pools[mon.rarity].push(mon);
   if(!premium&&!pools.C.length)return failure('Catálogo de invocação incompleto.');
   if(premium&&!pools.SR.length&&!pools.SSS.length)return failure('Catálogo de invocação incompleto.');
   const tierOrder=premium?['SSS','SR']:['UR','SSS','SR','R','C'];
   const pickTier=wanted=>{let i=tierOrder.indexOf(wanted);for(;i<tierOrder.length;i++)if(pools[tierOrder[i]].length)return tierOrder[i];return null;};
   const premiumRates=banner?.rates||{SR:.85,SSS:.15};
   const rollTier=roll=>premium?(roll<premiumRates.SR?'SR':'SSS'):(roll<.70?'C':roll<.91?'R':roll<.988?'SR':roll<.993?'UR':'SSS');
   const pityTiers=['R','SR','SSS','UR'],pityWeights={R:.70,SR:.26,UR:.0167,SSS:.0233};
   const pickPityTier=roll=>{const available=pityTiers.filter(t=>pools[t].length);if(!available.length)return null;const total=available.reduce((sum,t)=>sum+pityWeights[t],0);let acc=0;const scaled=roll*total;for(const t of available){acc+=pityWeights[t];if(scaled<acc)return t;}return available[available.length-1];};
   const next=clone(save),pulls=[];let diamonds=0;next.gacha.banners||={};const meter=bannerId==='route'?{pulls:next.gacha.pulls,pity:next.gacha.pity}:(next.gacha.banners[bannerId]||{pulls:0,pity:0});
   try{for(let i=0;i<count;i++){
    const roll=Number(rng()),choice=Number(rng());if(!Number.isFinite(roll)||roll<0||roll>=1||!Number.isFinite(choice)||choice<0||choice>=1)throw Error('A invocação não pôde ser sorteada. Tente novamente.');
    const guaranteed=meter.pity>=ECONOMY.pityAt-1;
    const rarity=guaranteed?(premium?'SSS':pickPityTier(roll)):pickTier(rollTier(roll));if(!rarity)throw Error('Catálogo de invocação incompleto.');
    const mon=pools[rarity][Math.floor(choice*pools[rarity].length)],duplicate=next.unlocked.includes(mon.key),rebate=duplicate?ECONOMY.duplicateDiamonds[rarity]:0;
    if(!duplicate)next.unlocked.push(mon.key);diamonds+=rebate;meter.pulls++;meter.pity=premium?(rarity==='SSS'?0:meter.pity+1):(rarity==='C'?meter.pity+1:0);
    pulls.push({key:mon.key,name:mon.name,rarity,duplicate,diamonds:rebate,guaranteed});
   }}catch(error){return failure(error.message);}
  if(bannerId==='route'){next.gacha.pulls=meter.pulls;next.gacha.pity=meter.pity;}else next.gacha.banners[bannerId]=meter;
  progressMission(next,'pokemonPulls',pulls.length);
   next.tickets=(next.tickets||0)-spentTickets;next.diamonds+=diamonds-spentDiamonds;save=next;ensureGrowth(save,monsters);
   // Invocação nova: nature e IVs sorteados (duplicata mantém os traits).
   if(save.growth)for(const pull of pulls)if(!pull.duplicate&&save.growth.pokemon[pull.key])Object.assign(save.growth.pokemon[pull.key],rollTraits(rng));
   persist();return success(save,{pulls,spentTickets,spentDiamonds,diamonds});
  },
  buyPokemon(mon){const item=entry(mon);if(!item||!isSummonable(mon))return failure('Esse Pokémon só pode ser obtido por evolução.');if(save.unlocked.includes(mon))return failure('Esse Pokémon já está na sua coleção.');const spent=ECONOMY.prices[item.rarity];if(save.diamonds<spent)return failure('Diamantes insuficientes.');save.diamonds-=spent;save.unlocked.push(mon);ensureGrowth(save,monsters);if(save.growth?.pokemon[mon])Object.assign(save.growth.pokemon[mon],rollTraits(rng));persist();return success(save,{key:mon,spent});},
  buyShiny(mon){if(!entry(mon)||!shinyCatalog.has(mon))return failure('Versão shiny indisponível nesta edição.');if(!save.unlocked.includes(mon))return failure('Desbloqueie o Pokémon primeiro.');if(save.shinies.includes(mon))return failure('Você já possui essa versão shiny.');if(save.diamonds<ECONOMY.shinyPrice)return failure('Diamantes insuficientes.');save.diamonds-=ECONOMY.shinyPrice;save.shinies.push(mon);save.shinyEquipped.push(mon);persist();return success(save,{spent:ECONOMY.shinyPrice});},
  equipShiny(mon,on){if(!save.shinies.includes(mon))return failure('Adquira essa versão shiny primeiro.');save.shinyEquipped=save.shinyEquipped.filter(k=>k!==mon);if(on)save.shinyEquipped.push(mon);persist();return success(save);},
  recordBattle(result){
  if(!result||typeof result.id!=='string'||!result.id.length||result.id.length>160||typeof result.won!=='boolean'||!integer(result.frames,0)||result.knockouts!==undefined&&!integer(result.knockouts,0,1000)||!integer(result.difficulty,1,5)||!['3v3','6v6'].includes(result.format)||!['win','loss','surrender'].includes(result.reason)||(result.reason==='win'&&!result.won)||(result.reason!=='win'&&result.won))return failure('Resultado de batalha inválido.');
   if(save.claimedBattles.includes(result.id))return failure('Essa batalha já foi registrada.');
  save.claimedBattles.push(result.id);save.records.battles++;save.records[result.won?'wins':'losses']++;recordBattleMissions(result);
   const timestamp=time(),eligible=result.reason!=='surrender'&&result.frames>=300&&(save.lastRewardAt===null||timestamp-save.lastRewardAt>=8000);
   const coins=eligible?(result.won?60+10*result.difficulty:25+5*result.difficulty):0;
   const trainerXp=eligible?addTrainerXP(result.won?180+result.difficulty*35:60):null;const tickets=awardTicketWin(save,eligible&&result.won);if(eligible){save.coins+=coins;save.lastRewardAt=timestamp;}persist();return success(save,{coins,trainerXp,tickets,rewarded:eligible,won:result.won});
  },
  awardKnockoutXP({foeLevel=5,participants=[],killer=null}={}){const g=save.growth;if(!g)return failure('Progressão indisponível.');const total=koXpFor(foeLevel);const keys=[...new Set((participants||[]).filter(k=>g.pokemon[k]))];if(!keys.length)return failure('Nenhum participante válido.');const share=Math.floor(total/keys.length);let remainder=total-share*keys.length;const changes=[];for(const key of keys){const amount=share+(key===killer&&remainder>0?remainder:0);if(key===killer)remainder=0;changes.push(...addXP(save,[key],amount));}persist();return success(save,{total,changes,participants:keys});},
    awardDamageXP({key:mon,amount=2}={}){const g=save.growth;if(!g)return failure('Progressão indisponível.');if(!save.unlocked.includes(mon)||!g.pokemon[mon])return failure('Pokémon não participa desta jornada.');if(![.5,1,2,4].includes(amount))return failure('Quantidade de XP inválida.');const changes=addXP(save,[mon],amount);if(!changes.length)return failure('Não foi possível aplicar XP.');persist();return success(save,{total:amount,changes,key:mon});},
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
export const setTrainerKey=(...args)=>local.setTrainerKey(...args);
export const setGoTeam=(...args)=>local.setGoTeam(...args);
export const setOnlineAccount=(...args)=>local.setOnlineAccount(...args);
export const setFavorite=(...args)=>local.setFavorite(...args);
export const setTeam=(...args)=>local.setTeam(...args);
export const setMoves=(...args)=>local.setMoves(...args);
export const setMega=(...args)=>local.setMega(...args);
export const claimDaily=(...args)=>local.claimDaily(...args);
export const claimStarterTickets=(...args)=>local.claimStarterTickets(...args);
export const summon=(...args)=>local.summon(...args);
export const buyPokemon=(...args)=>local.buyPokemon(...args);
export const recordBattle=(...args)=>local.recordBattle(...args);
export const exportSave=(...args)=>local.exportSave(...args);
export const importSave=(...args)=>local.importSave(...args);
