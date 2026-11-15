import{engine,createSimulation}from'/home/bloody/Projetos/pb-port/server/engine.mjs';import{configureGrowthBattle}from'/home/bloody/Projetos/pb-port/public/pulse/growth-battle.js';import assert from'node:assert/strict';
for(const key of ['abra','ditto','metapod','charmander']){
 const mons=key==='abra'?['abra','bulbasaur']:[key];const b=await createSimulation(7,[{name:'QA',trainer:'red',mons,bot:true},{name:'CPU',trainer:'blue',mons:['rattata'],bot:true}],'stadium');
 const id={abra:'Teleport',ditto:'Transform',metapod:'Harden',charmander:'Ember'}[key],selected=Object.fromEntries(mons.map(k=>[k,[k===key?'pulseBasics:'+id:'gibleAT:Tackle']]));const g=configureGrowthBattle(b,engine,{levels:Object.fromEntries(mons.map(k=>[k,8])),selected});
 for(let i=0;i<300&&b.phase!=='fight';i++){g.before();engine.stepRanked(b);g.after();}const actor=b.fighters[0];actor.action=null;const move=engine.moveObj('pulseBasics:'+id),beforeHp=actor.hp,beforeMax=actor.maxHp;b.fighters[1].x=actor.x+30;b.fighters[1].y=actor.y;const action=move.run(b,actor,b.fighters[1]);for(let t=0;t<200;t++){const r=action.next();if(r.done)break;}
 if(key==='ditto'){assert(actor.pulseTransform);assert.equal(actor.spec.dex,b.fighters[1].spec.dex);assert.equal(actor.maxHp,beforeMax);assert.equal(actor.hp,beforeHp);}
 if(key==='metapod')assert.equal(actor.stages.def,1);
 if(key==='abra'){assert.equal(actor.pulseTeleport,1);g.before();assert(b.teams[0].ctl);}
 console.log('PASS',key,id);
}
