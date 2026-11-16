const milestones=(prefix,metric,targets,category,reward='pokemon')=>targets.map((target,index)=>({
 id:`${prefix}-${target}`,
 metric,
 target,
 category,
 reward,
 title:(()=>{
  const plural=(one,many)=>target===1?one:many;
  return ({
   captures:`Capture ${target} Pokémon`,
   pokemonPulls:`Faça ${plural('1 giro',''+target+' giros')} de Pokémon`,
   knockouts:`Derrote ${target} Pokémon em batalha`,
   battleWins:`Vença ${plural('1 batalha',`${target} batalhas`)}`,
   battles:`Participe de ${plural('1 batalha',`${target} batalhas`)}`,
   tmDraws:`Obtenha ${plural('1 TM',`${target} TMs`)}`,
   tmUses:`Ensine ${plural('1 TM',`${target} TMs`)}`,
   evolutions:`Evolua ${target} Pokémon`,
   dailyClaims:`Resgate ${target} bônus ${target===1?'diário':'diários'}`,
   collection:`Tenha ${target} Pokémon na coleção`,
  })[metric];
 })(),
 rewardCount:1,
}));

export const MISSIONS=Object.freeze([
 ...milestones('capture','captures',[1,3,5,10,20],'Capturas'),
 ...milestones('pokemon-gacha','pokemonPulls',[1,5,10,25,50],'Gacha Pokémon'),
 ...milestones('knockout','knockouts',[10,25,50,100,250,500],'Batalhas'),
 ...milestones('win','battleWins',[1,3,5,10,20,35],'Vitórias'),
 ...milestones('battle','battles',[5,10,20,35,60],'Batalhas'),
 ...milestones('tm-draw','tmDraws',[1,3,5,10,20],'Máquina de TMs','tm'),
 ...milestones('tm-use','tmUses',[1,3,5,10,20],'TMs ensinadas','tm'),
 ...milestones('evolution','evolutions',[1,3,5,10],'Evoluções','tm'),
 ...milestones('daily','dailyClaims',[3,7,14],'Bônus diários'),
 ...milestones('collection','collection',[6,12,25,50,100,150],'Coleção'),
]);

export const MISSION_BY_ID=Object.freeze(Object.fromEntries(MISSIONS.map(mission=>[mission.id,mission])));
export const initialMissions=()=>({progress:{},claimed:[]});

export function validateMissions(missions){
 const object=value=>!!value&&typeof value==='object'&&!Array.isArray(value);
 if(!object(missions)||!object(missions.progress)||!Array.isArray(missions.claimed)||new Set(missions.claimed).size!==missions.claimed.length)throw Error('Missões inválidas.');
 if(Object.entries(missions.progress).some(([metric,value])=>!['captures','pokemonPulls','knockouts','battleWins','battles','tmDraws','tmUses','evolutions','dailyClaims','collection'].includes(metric)||!Number.isSafeInteger(value)||value<0||value>1000000))throw Error('Progresso de missões inválido.');
 if(missions.claimed.some(id=>typeof id!=='string'||!MISSION_BY_ID[id]))throw Error('Resgate de missão inválido.');
}