import{test}from'node:test';import assert from'node:assert/strict';import{gamepadFrame}from'../public/pulse/gamepad.js';
const pad=(axes=[0,0],down=[])=>({axes,buttons:Array.from({length:16},(_,i)=>({pressed:down.includes(i)}))});
test('left stick and face move are emitted simultaneously with standard mapping',()=>{const x=gamepadFrame(pad([.8,0],[0]));assert.deepEqual(x.commands,[{kind:'steer',dir:1},{kind:'move',index:0}]);assert.equal(gamepadFrame(pad([.8,0],[0]),x.pressed,1).commands.length,0)});
test('dead zone and release reset movement, dpad overrides axis',()=>{assert.equal(gamepadFrame(pad([.1,.1]),[],1).commands[0].dir,0);assert.equal(gamepadFrame(pad([.8,0],[14])).direction,5)});
test('DualSense shoulder, trigger and options commands have single press edges',()=>{const p=pad([0,0],[4,5,6,7,8,9]);const x=gamepadFrame(p);assert.deepEqual(x.commands.map(x=>x.kind),['guard','dodge','mega','pause','manual','reserve']);assert.equal(gamepadFrame(p,x.pressed).commands.length,0)});
