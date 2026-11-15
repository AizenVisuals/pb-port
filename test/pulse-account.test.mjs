import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mountAccount,accountError} from '../public/pulse/account.js';
const fixture=()=>{
 const elements=Object.fromEntries(['google-login','google-logout','google-status','account-summary'].map(id=>[id,{}]));
 const data=new Map([['pulse-arena.save.v1','existing-local-save']]);
 return {elements,data,document:{getElementById:id=>elements[id]},storage:{getItem:k=>data.get(k),setItem:(k,v)=>data.set(k,v),removeItem:k=>data.delete(k)}};
};
test('Google identity and logout never replace local progression',async()=>{
 const f=fixture();let emit;const user={uid:'qa-user',name:'QA',email:'qa@example.test'};
 const sdk={subscribe:fn=>{emit=fn;fn(null);},signIn:async()=>emit(user),signOut:async()=>emit(null)};
 const account=mountAccount({...f,load:async()=>sdk});await account.prepare();
 await f.elements['google-login'].onclick();assert.equal(f.elements['google-login'].hidden,true);
 assert.match(f.elements['google-status'].textContent,/QA/);assert.equal(f.data.get('pulse-arena.google-session'),'1');
 await f.elements['google-logout'].onclick();assert.equal(f.elements['google-login'].hidden,false);
 assert.equal(f.data.get('pulse-arena.save.v1'),'existing-local-save');assert.equal(f.data.has('pulse-arena.google-session'),false);
});
test('double presses cannot open two auth requests; cancelled login stays usable',async()=>{
 const f=fixture();let calls=0,reject;
 const sdk={subscribe:fn=>fn(null),signIn:()=>{calls++;return new Promise((_,no)=>reject=no);}};
 await mountAccount({...f,load:async()=>sdk}).prepare();
 const request=f.elements['google-login'].onclick();await f.elements['google-login'].onclick();assert.equal(calls,1);
 reject({code:'auth/popup-closed-by-user'});await request;
 assert.match(f.elements['google-status'].textContent,/cancelada/);assert.equal(f.elements['google-login'].disabled,false);
 assert.equal(f.data.get('pulse-arena.save.v1'),'existing-local-save');
});
test('failed SDK loading permits retry without changing save',async()=>{
 const f=fixture();let calls=0;
 const account=mountAccount({...f,load:async()=>{if(++calls===1)throw Error('offline');return {subscribe:fn=>fn(null)};}});
 assert.equal(await account.prepare(),null);assert.equal(f.elements['google-login'].disabled,false);
 assert.ok(await account.prepare());assert.equal(calls,2);assert.equal(f.data.get('pulse-arena.save.v1'),'existing-local-save');
 assert.match(accountError({code:'auth/network-request-failed'}),/Sem conexão/);
});
test('login expõe signIn, getIdToken e onAuth sem tocar no save',async()=>{
 const f=fixture();let emit;const user={uid:'qa-user',name:'QA',email:'qa@example.test'};
 const seen=[];
 const sdk={subscribe:fn=>{emit=fn;fn(null);},signIn:async()=>emit(user),signOut:async()=>emit(null),getIdToken:async()=>'fake.id.token'};
 const account=mountAccount({...f,onAuth:u=>seen.push(u?u.uid:null),load:async()=>sdk});
 await account.prepare();
 assert.equal(account.getUser(),null);
 await account.signIn();
 assert.equal(account.getUser()?.uid,'qa-user');
 assert.equal(await account.getIdToken(),'fake.id.token');
 assert.deepEqual(seen,[null,'qa-user']);
 assert.equal(f.data.get('pulse-arena.save.v1'),'existing-local-save');
});
test('getIdToken retorna null quando o SDK não expõe o método',async()=>{
 const f=fixture();
 const sdk={subscribe:fn=>fn(null),signIn:async()=>{},signOut:async()=>{}};
 const account=mountAccount({...f,load:async()=>sdk});
 await account.prepare();
 assert.equal(await account.getIdToken(),null);
});
