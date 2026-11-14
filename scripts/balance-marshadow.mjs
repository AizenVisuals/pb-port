import {engine,createSimulation} from '../server/engine.mjs';
import {writeFile} from 'node:fs/promises';
const opponents=['lucario','metagross','dragonite','greninja','gardevoir','togekiss','gengar','scizor'];const results=[];
for(const opponent of opponents){if(!engine.INFO[opponent])continue;
 for(const seed of [17,41,83,127])for(const side of [0,1]){
  const keys=side===0?['marshadow',opponent]:[opponent,'marshadow'];
  const b=await createSimulation(seed,keys.map((key,i)=>({name:key,trainer:i?'blue':'red',mons:[key],bot:true,level:3})),'stadium');
  for(let i=0;i<16000&&!b.done;i++)engine.stepRanked(b);
  results.push({opponent,seed,side,winner:engine.winnerSide(b),won:engine.winnerSide(b)===side,frames:b.frame,moves:b.useLog});
  global.gc?.();
 }
 console.log(opponent,results.filter(r=>r.opponent===opponent&&r.won).length+'/8');
}
await writeFile('research/marshadow-balance.json',JSON.stringify({description:'Initial bot 1v1 smoke balance; equal level, 4 seeds, both sides, stadium. Not a ranked meta prediction.',wins:results.filter(r=>r.won).length,games:results.length,results},null,2));
console.log('TOTAL',results.filter(r=>r.won).length,results.length);
