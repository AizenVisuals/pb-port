/** Offline chapter definitions. Completion is applied through progression transactions. */
export const INITIAL_PARTNERS=Object.freeze(['bulbasaur','charmander','squirtle']);
export const CHAPTER_ONE=Object.freeze([
 ['Primeiro duelo','youngster',['rattata'],1],['Passos na rota','lass',['pidgey'],1],['Uma nova amizade','youngster',['rattata'],1],['Entre folhas e asas','bugcatcher',['caterpie','weedle'],2],['Uma sombra na estrada','rocketgrunt',['ekans'],2],['Travessia da mata','lass',['pidgey','rattata'],2],['O plano dos Rocket','rocketgruntf',['zubat','koffing'],3],['Um passo à frente','blue',['charmander','squirtle'],3],['Às portas do ginásio','youngster',['geodude'],3],['A primeira insígnia','brock',['geodude','onix'],3],
].map(([title,trainer,opponents,difficulty],i)=>Object.freeze({id:`1-${i+1}`,title,trainer,opponents:Object.freeze(opponents),difficulty,firstClearCoins:80+i*20,badge:i===9?'boulder':null,wild:i===2?'pidgey':i===5?'caterpie':null})));
export const newJourney=()=>({starter:null,cleared:[],active:null,inventory:{pokeball:5},badges:[],resolvedBattles:[]});
export function validateJourney(j){
 if(j&&j.resolvedBattles===undefined)j.resolvedBattles=[];
 if(!j||!Array.isArray(j.resolvedBattles)||j.resolvedBattles.some(x=>typeof x!=='string'||!x.length||x.length>160)||new Set(j.resolvedBattles).size!==j.resolvedBattles.length||!INITIAL_PARTNERS.includes(j.starter)&&j.starter!==null||!Array.isArray(j.cleared)||j.cleared.some((id,i)=>id!==CHAPTER_ONE[i]?.id)||!j.inventory||!Number.isSafeInteger(j.inventory.pokeball)||j.inventory.pokeball<0||!Array.isArray(j.badges)||j.badges.some(x=>x!=='boulder')||new Set(j.badges).size!==j.badges.length||j.badges.includes('boulder')!==j.cleared.includes('1-10'))throw Error('Progresso da jornada inválido.');
 if(j.active!==null&&(!j.active||typeof j.active.id!=='string'||!j.active.id.length||j.active.id.length>160||!CHAPTER_ONE.some((s,i)=>s.id===j.active.stage&&i<=j.cleared.length)))throw Error('Fase ativa inválida.');
 if(j.active?.encounter){const e=j.active.encounter,stage=CHAPTER_ONE.find(s=>s.id===j.active.stage);if(e.key!==stage?.wild||!['pending','captured','fled','defeated'].includes(e.state)||!Number.isSafeInteger(e.attempts)||e.attempts<0)throw Error('Encontro inválido.');}
 return j;
}
