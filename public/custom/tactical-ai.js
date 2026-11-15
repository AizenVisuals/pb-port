/** Uses visible match state and native PB effectiveness; never reads queued player inputs. */
export function planCPU(actor,target,status,team=[]){
 if(!target||target.fainted||target.hidden)return null;
 const distance=Math.hypot(actor.x-target.x,actor.y-target.y);
 let best=null,score=-Infinity;
 for(const row of status){
  if(row.locked||row.charge<1||row.left===0)continue;
  const move=actor.moves.find(m=>m.name===row.name);if(!move)continue;
  let value;
  if(row.power){const attack=row.cat==='phys'?actor.st.atk:actor.st.spa,defense=row.cat==='phys'?target.st.def:target.st.spd;value=row.power*(row.eff??1)*(attack/Math.max(1,defense))*(actor.types.includes(row.type)?1.5:1);}
  else if(row.name==='Transform')value=actor.pulseTransform?0:160;
  else if(row.name==='Teleport')value=actor.hp/actor.maxHp<.35&&team.some(m=>m!==actor&&!m.fainted)?100:0;
  else if(['Harden','Withdraw'].includes(row.name))value=(actor.stages?.def||0)<2&&actor.hp/actor.maxHp>.5?35:0;
  else if(['Growl','Leer','Tail Whip'].includes(row.name))value=(target.stages?.[row.name==='Growl'?'atk':'def']||0)>-2?28:0;
  else if(row.heal)value=actor.hp/actor.maxHp<.5?140:0;
  else value=18;
  if(!row.inRange){const [low,high]=move.range;value*=1/(1+Math.max(low-distance,distance-high,0)/100);}
  if(value>score){score=value;best=row.name;}
 }
 return score>0?best:null;
}
