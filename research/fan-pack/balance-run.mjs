import{writeFile}from'node:fs/promises';
import{engine,createSimulation}from'../../server/engine.mjs';
const opponents=['charizard','greninja','gengar','lucario','venusaur'],seeds=[7,31,71,151],results=[];
for(const opponent of opponents)for(const seed of seeds){
 const b=await createSimulation(seed,[{name:'Ferunoga',trainer:'red',mons:['ferunoga'],bot:true},{name:opponent,trainer:'blue',mons:[opponent],bot:true}],'stadium');
 const levels=b.fighters.map(x=>x.level);let steps=0;for(;steps<18000&&!b.done;steps++)engine.stepRanked(b);
 const result={opponent,seed,done:!!b.done,winnerSide:b.winner?.side??null,frames:b.frame,steps,levels,remaining:b.teams.map(t=>t.mons.map(m=>({key:m.rkKey,hp:m.hp,maxHp:m.maxHp,fainted:!!m.fainted}))),moves:b.useLog};results.push(result);console.log(JSON.stringify({opponent,seed,done:result.done,winnerSide:result.winnerSide,frames:result.frames}));
}
const summary=Object.fromEntries(opponents.map(opponent=>{const rows=results.filter(r=>r.opponent===opponent);return[opponent,{games:rows.length,wins:rows.filter(r=>r.winnerSide===0).length,losses:rows.filter(r=>r.winnerSide===1).length,unfinished:rows.filter(r=>!r.done).length,meanFrames:Math.round(rows.reduce((n,r)=>n+r.frames,0)/rows.length)}]}));
const report={scope:'Local native PB engine, level50 bot-vs-bot 1v1, fixed seeds, no Mega/items selected; no production service. Small nonhuman sample, not a competitive win-rate estimate.',creature:'ferunoga',stats:engine.INFO.ferunoga.stats,defaults:engine.INFO.ferunoga.defaults,summary,results};await writeFile(new URL('./balance-ferunoga.json',import.meta.url),JSON.stringify(report,null,2)+'\n');console.log('SUMMARY',JSON.stringify(summary));
