import{planCPU}from'./tactical-ai.js';
export function adviseBots(b,moveStatus){
 if(b.phase!=='fight'||b.cinematic||b.done||b.tick%36!==0)return;
 for(const actor of b.fighters){if(!b.teams[actor.side]?.bot||!actor.ai||actor.action||actor.fainted||actor.hidden)continue;const target=b.fighters.find(x=>x.side!==actor.side&&!x.fainted&&!x.hidden);if(!target)continue;const move=planCPU(actor,target,moveStatus(b,actor.side),b.teams[actor.side].mons);if(move)actor.ai.plan=actor.moves.find(x=>x.name===move);}
}
