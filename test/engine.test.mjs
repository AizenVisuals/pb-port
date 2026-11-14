import { test } from 'node:test';
import assert from 'node:assert/strict';
import { engine, createSimulation } from '../server/engine.mjs';
const starters=['venusaur','charizard','blastoise'];
const teams=mons=>[{name:'Red',trainer:'red',mons,bot:true,level:2},{name:'Blue',trainer:'blue',mons,bot:true,level:2}];
test('local canvas adapter produces deterministic battle state',async()=>{
 const a=await createSimulation(314159,teams(starters),'stadium');
 for(let i=0;i<600;i++)engine.stepRanked(a);
 const hash=engine.stateHash(a);
 const b=await createSimulation(314159,teams(starters),'stadium');
 for(let i=0;i<600;i++)engine.stepRanked(b);
 assert.equal(engine.stateHash(b),hash);
});
test('complete 3v3 and 6v6 simulations end with valid winners',async()=>{
 for(const mons of [starters,[...starters,'pikachu','alakazam','gengar']]){
  const b=await createSimulation(4321,teams(mons),'stadium');
  for(let i=0;i<30000&&!b.done;i++)engine.stepRanked(b);
  assert.equal(b.done,true);assert.ok([0,1].includes(engine.winnerSide(b)));
  assert.equal(b.teams[0].mons.length,mons.length);
  for(const t of b.teams)for(const mon of t.mons)assert.ok(Number.isFinite(mon.hp));
 }
});
