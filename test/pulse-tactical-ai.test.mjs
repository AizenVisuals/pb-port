import{test}from'node:test';import assert from'node:assert/strict';import{planCPU}from'../public/pulse/tactical-ai.js';
test('CPU favors effective attacks without selecting unavailable moves and avoids already-maxed buffs',()=>{
 const actor={x:0,y:0,st:{atk:50,spa:50},types:['fire'],hp:100,maxHp:100,stages:{def:6},moves:[{name:'Ember',range:[0,100]},{name:'Tackle',range:[0,40]},{name:'Harden',range:[0,500]}]},target={x:30,y:0,st:{def:50,spd:50},stages:{}};
 const rows=[{name:'Ember',type:'fire',cat:'spec',power:40,eff:2,charge:1,inRange:true},{name:'Tackle',type:'normal',cat:'phys',power:40,eff:1,charge:1,inRange:true},{name:'Harden',power:0,charge:1,inRange:true}];assert.equal(planCPU(actor,target,rows),'Ember');rows[0].locked=true;assert.equal(planCPU(actor,target,rows),'Tackle');rows[1].charge=0;assert.equal(planCPU(actor,target,rows),null);
});
