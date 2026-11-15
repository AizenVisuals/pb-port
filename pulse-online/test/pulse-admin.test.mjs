import test from 'node:test';import assert from 'node:assert/strict';import {generateKeyPairSync,createSign} from 'node:crypto';import {mkdtemp,rm} from 'node:fs/promises';import {tmpdir} from 'node:os';import {createServer} from '../server.mjs';import {b64u} from '../auth.mjs';
test('portal Google login, server-side admin authorization, settings validation and audit',async()=>{
 const dir=await mkdtemp(tmpdir()+'/pulse-admin-test-');const {privateKey,publicKey}=generateKeyPairSync('rsa',{modulusLength:2048});const jwk={...publicKey.export({format:'jwk'}),kid:'qa-admin'};const {server,db}=await createServer({port:0,host:'127.0.0.1',dataDir:dir,firebaseJwks:{keys:[jwk]}});await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port;
 const request=async(path,token,body,method)=>{const res=await fetch(base+path,{method:method||(body?'POST':'GET'),headers:{'content-type':'application/json',...(token?{authorization:'Bearer '+token}:{})},body:body?JSON.stringify(body):undefined});return {status:res.status,body:await res.json()};};
 try{
  assert.equal((await fetch(base)).status,200);assert.equal((await request('/api/admin/settings')).status,401);
  const guest=await request('/api/auth/guest',null,{nick:'Guest',trainer_key:'red',team:'valor'});db.prepare('UPDATE users SET is_admin=1 WHERE id=?').run(guest.body.user_id);assert.equal((await request('/api/admin/overview',guest.body.token)).status,403);
  const now=Math.floor(Date.now()/1000),h=b64u(JSON.stringify({alg:'RS256',kid:'qa-admin'})),p=b64u(JSON.stringify({sub:'qa-google',aud:'pulse-arena-pb',iss:'https://securetoken.google.com/pulse-arena-pb',iat:now,exp:now+3600,name:'QA Google',email:'qa@example.invalid',email_verified:true,firebase:{sign_in_provider:'google.com'},admin:true})),unsigned=h+'.'+p;
  const id_token=unsigned+'.'+createSign('RSA-SHA256').update(unsigned).sign(privateKey).toString('base64url');const login=await request('/api/auth/google',null,{id_token});assert.equal(login.status,200);assert.equal(login.body.is_admin,false);assert.equal((await request('/api/admin/settings',login.body.token)).status,403);
  db.prepare('UPDATE users SET is_admin=1 WHERE id=?').run(login.body.user_id);const profile=await request('/api/profile',login.body.token);assert.equal(profile.body.is_admin,true);
  assert.equal((await request('/api/admin/settings',login.body.token,{arena_enabled:'false'},'PUT')).status,400);
  assert.equal((await request('/api/admin/settings',login.body.token,{is_admin:true},'PUT')).status,400);
  const update=await request('/api/admin/settings',login.body.token,{arena_enabled:false,announcement:'Manutenção de teste'},'PUT');assert.equal(update.status,200);assert.equal(update.body.settings.arena_enabled,false);
  const join=await request('/api/arena/queue',guest.body.token,{team:{}},'POST');assert.equal(join.status,503);assert.equal(join.body.error,'arena_disabled');
  const publicSettings=await request('/api/settings');assert.equal(publicSettings.body.settings.announcement,'Manutenção de teste');
  const overview=await request('/api/admin/overview',login.body.token);assert.equal(overview.status,200);assert.equal(overview.body.users,2);assert.equal(overview.body.audit.length,1);assert(!JSON.stringify(overview.body).includes('qa@example.invalid'));
  const linkHeader=b64u(JSON.stringify({alg:'RS256',kid:'qa-admin'})),linkPayload=b64u(JSON.stringify({sub:'linked-google',aud:'pulse-arena-pb',iss:'https://securetoken.google.com/pulse-arena-pb',iat:now,exp:now+3600,name:'Linked',email:'linked@example.invalid',email_verified:true,firebase:{sign_in_provider:'google.com'}})),linkUnsigned=linkHeader+'.'+linkPayload;
  const linkedToken=linkUnsigned+'.'+createSign('RSA-SHA256').update(linkUnsigned).sign(privateKey).toString('base64url');
  const linked=await request('/api/auth/google',guest.body.token,{id_token:linkedToken});
  assert.equal(linked.status,200);assert.equal(linked.body.user_id,guest.body.user_id);assert.equal(linked.body.profile.nick,'Guest');assert.equal(linked.body.is_admin,false);
  db.prepare('UPDATE users SET is_admin=0 WHERE id=?').run(login.body.user_id);assert.equal((await request('/api/admin/settings',login.body.token)).status,403);
 }finally{await new Promise(r=>server.close(r));db.close();await rm(dir,{recursive:true,force:true});}
});
