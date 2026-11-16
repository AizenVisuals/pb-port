/** Uses visible match state and native PB effectiveness; never reads queued player inputs.
 * Damage scores power x effectiveness x attack/defense x STAB, mildly preferring
 * short-cooldown moves when damage is close. Status moves use the engine's own
 * per-move utility scorer (the same call Zh0 makes); hardcoded fallbacks cover
 * moves without one. Immune and conditional moves are skipped outright.
 * scoreMoves returns the ranked list (best first); planCPU is just its head,
 * kept for the growth-battle hook and older callers. The engine hook uses the
 * ranked list to scale the bot's move choice by difficulty (see tactical-hook.js). */
export function scoreMoves(actor,target,status,team=[]){
 if(!target||target.fainted||target.hidden)return [];
 const distance=Math.hypot(actor.x-target.x,actor.y-target.y);
 const hpRatio=actor.hp/actor.maxHp,benchAlive=team.some(m=>m!==actor&&!m.fainted);
 const scored=[];
 for(const row of status){
  if(row.locked||row.charge<1||row.left===0)continue;
  const move=actor.moves.find(m=>m.name===row.name);if(!move)continue;
  if(row.name==='Sucker Punch'&&!foeAttacking(target))continue;
  const eff=row.eff??1;
  let value;
  const power=typeof move.powerFor==='function'?safePower(move,actor,row.power):row.power;
  if(typeof move.utility==='function'){
   let u;try{u=move.utility(actor,target,distance);}catch{u=undefined;}
   if(typeof u==='number'&&Number.isFinite(u)){if(u<=0)continue;value=u;}
   else if(power)value=damageValue(row,move,actor,target,eff,power);
   else value=fallbackStatus(row,actor,target,hpRatio,benchAlive);
  }else if(power)value=damageValue(row,move,actor,target,eff,power);
  else value=fallbackStatus(row,actor,target,hpRatio,benchAlive);
  if(!(value>0))continue;
  if(!row.inRange){const [low,high]=move.range;value*=1/(1+Math.max(low-distance,distance-high,0)/100);}
  scored.push({name:row.name,score:value});
 }
 return scored.sort((a,b)=>b.score-a.score);
}
export function planCPU(actor,target,status,team=[]){
 const ranked=scoreMoves(actor,target,status,team);
 return ranked.length?ranked[0].name:null;
}
function foeAttacking(target){return !!(target.action&&target.actionIsMove&&target.lastMove&&target.lastMove.cat!=='status'&&target.lastMove.power>0);}
function safePower(move,actor,fallback){try{const p=move.powerFor(actor);return Number.isFinite(p)&&p>0?p:fallback;}catch{return fallback;}}
function damageValue(row,move,actor,target,eff,power){
 if(eff===0)return 0;
 const attack=row.cat==='phys'?actor.st.atk:actor.st.spa,defense=row.cat==='phys'?target.st.def:target.st.spd;
 const raw=power*eff*(attack/Math.max(1,defense))*(actor.types.includes(row.type)?1.5:1);
 return raw/Math.pow(Math.max(60,move.cooldown||180)/180,.25);
}
function fallbackStatus(row,actor,target,hpRatio,benchAlive){
 if(row.name==='Transform')return actor.pulseTransform?0:160;
 if(row.name==='Teleport')return hpRatio<.35&&benchAlive?100:0;
 if(['Harden','Withdraw'].includes(row.name))return (actor.stages?.def||0)<2&&hpRatio>.5?35:0;
 if(['Growl','Leer','Tail Whip'].includes(row.name))return (target.stages?.[row.name==='Growl'?'atk':'def']||0)>-2?28:0;
 if(row.heal)return hpRatio<.5?140*(1.6-hpRatio):0;
 return 18;
}
