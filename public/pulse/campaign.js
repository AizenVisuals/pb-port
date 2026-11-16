/** Offline chapter definitions. Completion is applied through progression transactions. */
export const INITIAL_PARTNERS=Object.freeze(['bulbasaur','charmander','squirtle','chikorita','cyndaquil','totodile']);
export const CHAPTER_ONE=Object.freeze([
 ['Primeiro duelo','youngster',['rattata'],1],['Passos na rota','lass',['pidgey'],1],['Uma nova amizade','youngster',['rattata'],1],['Entre folhas e asas','bugcatcher',['caterpie','weedle'],2],['Uma sombra na estrada','rocketgrunt',['ekans'],2],['Travessia da mata','lass',['pidgey','rattata'],2],['O plano dos Rocket','rocketgruntf',['zubat','koffing'],3],['Um passo à frente','blue',['charmander','squirtle'],3],['Às portas do ginásio','youngster',['geodude'],3],['A primeira insígnia','brock',['geodude','onix'],3],
].map(([title,trainer,opponents,difficulty],i)=>Object.freeze({id:`1-${i+1}`,title,trainer,opponents:Object.freeze(opponents),difficulty,firstClearCoins:80+i*20,badge:i===9?'boulder':null,wild:i===2?'pidgey':i===5?'caterpie':null})));
export const CHAPTER_TWO=Object.freeze([
 ['Margens do rio','youngster',['magikarp'],1],['Pescaria na rota','lass',['goldeen'],1],['Um brilho na água','youngster',['psyduck'],1],['Entrada do Monte Lua','bugcatcher',['zubat','paras'],2],['Eco na caverna','rocketgrunt',['zubat','geodude'],2],['Pedras da caverna','lass',['clefairy'],2],['A sombra dos Rocket','rocketgruntf',['koffing','ekans'],3],['Saída para Cerulean','blue',['wartortle','pikachu'],3],['Às portas do ginásio','youngster',['staryu'],3],['A segunda insígnia','misty',['staryu','starmie'],3],
].map(([title,trainer,opponents,difficulty],i)=>Object.freeze({id:`2-${i+1}`,title,trainer,opponents:Object.freeze(opponents),difficulty,firstClearCoins:80+(i+10)*20,badge:i===9?'cascade':null,wild:i===2?'poliwag':i===5?'tentacool':null})));
export const ALL_STAGES=Object.freeze([...CHAPTER_ONE,...CHAPTER_TWO]);
// Curva de nível do oponente nas fases da jornada (treino contra o bot):
// começa em 5 e sobe 1,5 por fase (arredondado para baixo), para acompanhar
// o ritmo de XP do jogador. 1-10 (Brock) = 18, 2-10 (Misty) = 33.
// Antes: 5 + índice*2 (Brock 23, Misty 43) — íngreme demais para o XP atual.
export function stageOpponentLevel(stage){
 const found=typeof stage==='string'?ALL_STAGES.find(s=>s.id===stage):stage;
 const index=ALL_STAGES.indexOf(found);
 return index<0?5:Math.floor(5+index*1.5);
}
export const newJourney=()=>({starter:null,cleared:[],active:null,inventory:{pokeball:5},badges:[],resolvedBattles:[]});
export function validateJourney(j){
 if(j&&j.resolvedBattles===undefined)j.resolvedBattles=[];
 if(!j||!Array.isArray(j.resolvedBattles)||j.resolvedBattles.some(x=>typeof x!=='string'||!x.length||x.length>160)||new Set(j.resolvedBattles).size!==j.resolvedBattles.length||!INITIAL_PARTNERS.includes(j.starter)&&j.starter!==null||!Array.isArray(j.cleared)||j.cleared.some((id,i)=>id!==ALL_STAGES[i]?.id)||!j.inventory||!Number.isSafeInteger(j.inventory.pokeball)||j.inventory.pokeball<0||!Array.isArray(j.badges)||j.badges.some(x=>x!=='boulder'&&x!=='cascade')||new Set(j.badges).size!==j.badges.length||j.badges.includes('boulder')!==j.cleared.includes('1-10')||j.badges.includes('cascade')!==j.cleared.includes('2-10'))throw Error('Progresso da jornada inválido.');
 if(j.active!==null&&(!j.active||typeof j.active.id!=='string'||!j.active.id.length||j.active.id.length>160||!ALL_STAGES.some((s,i)=>s.id===j.active.stage&&i<=j.cleared.length)))throw Error('Fase ativa inválida.');
 if(j.active?.encounter){const e=j.active.encounter,stage=ALL_STAGES.find(s=>s.id===j.active.stage);if(e.key!==stage?.wild||!['pending','captured','fled','defeated'].includes(e.state)||!Number.isSafeInteger(e.attempts)||e.attempts<0)throw Error('Encontro inválido.');}
 return j;
}
