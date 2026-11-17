import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createOnlineClient,needsLogin,GO_TEAMS,isGoTeam,goTeamName,onlineErrorMessage,ONLINE_BASE_URL,ONLINE_SESSION_KEY,ONLINE_BASE_URL_OVERRIDE_KEY} from '../public/pulse/online.js';
import {createProgression} from '../public/pulse/progression.js';

const storageStub=()=>{
  const data=new Map();
  return {data,getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,String(v)),removeItem:k=>data.delete(k)};
};
const response=(status,data)=>({ok:status>=200&&status<300,status,json:async()=>data});
const fetchStub=(handler)=>{
  const calls=[];
  const fn=async(url,options)=>{calls.push({url,options});return handler(url,options,calls);};
  fn.calls=calls;
  return fn;
};
const guestProfile={trainer_key:'ash',nick:'Bloody',team:'valor'};
const guestCreated={user_id:'u-1',provider:'guest',email:null,token:'sess.token.here',profile:{trainer_key:'ash',nick:'Bloody',team:'valor',updated_at:'2026-11-15T00:00:00.000Z'}};

test('guest sign-in cria sessão e guarda o token fora do save',async()=>{
  const storage=storageStub();
  const fetchFn=fetchStub(()=>response(201,guestCreated));
  const client=createOnlineClient({fetchFn,storage,baseUrl:'http://127.0.0.1:3099'});
  const result=await client.guestSignIn(guestProfile);
  assert.equal(result.ok,true);
  assert.equal(result.session.provider,'guest');
  assert.equal(result.session.userId,'u-1');
  assert.equal(result.profile.nick,'Bloody');
  const stored=JSON.parse(storage.getItem(ONLINE_SESSION_KEY));
  assert.equal(stored.token,'sess.token.here');
  assert.equal(fetchFn.calls.length,1);
  assert.equal(fetchFn.calls[0].url,'http://127.0.0.1:3099/api/auth/guest');
  assert.deepEqual(JSON.parse(fetchFn.calls[0].options.body),guestProfile);
  assert.equal(fetchFn.calls[0].options.headers.authorization,undefined);
  assert.equal(client.hasSession(),true);
});

test('sem servidor, o login vira offline e não guarda sessão',async()=>{
  const storage=storageStub();
  const fetchFn=fetchStub(()=>{throw new Error('fetch failed');});
  const client=createOnlineClient({fetchFn,storage,baseUrl:'http://127.0.0.1:3099'});
  const result=await client.guestSignIn(guestProfile);
  assert.deepEqual(result,{ok:false,offline:true});
  assert.equal(storage.getItem(ONLINE_SESSION_KEY),null);
  assert.equal(client.hasSession(),false);
  assert.match(onlineErrorMessage(result),/Sem conexão/);
});

test('servidor rejeitando o perfil retorna o erro sem sessão',async()=>{
  const storage=storageStub();
  const fetchFn=fetchStub(()=>response(400,{error:'invalid_profile',details:['nick inválido']}));
  const client=createOnlineClient({fetchFn,storage,baseUrl:'http://127.0.0.1:3099'});
  const result=await client.guestSignIn({trainer_key:'ash',nick:'X',team:'valor'});
  assert.equal(result.ok,false);
  assert.equal(result.status,400);
  assert.equal(result.error,'invalid_profile');
  assert.equal(storage.getItem(ONLINE_SESSION_KEY),null);
  assert.match(onlineErrorMessage(result),/Verifique o nome/);
});

test('google sign-in sem ID Token nem chama o servidor',async()=>{
  const storage=storageStub();
  const fetchFn=fetchStub(()=>response(200,guestCreated));
  const client=createOnlineClient({fetchFn,storage,baseUrl:'http://127.0.0.1:3099'});
  assert.deepEqual(await client.googleSignIn(''),{ok:false,error:'missing_id_token'});
  assert.deepEqual(await client.googleSignIn(null),{ok:false,error:'missing_id_token'});
  assert.equal(fetchFn.calls.length,0);
});

test('google sign-in troca o ID Token por sessão e guarda o provedor',async()=>{
  const storage=storageStub();
  const googleCreated={...guestCreated,provider:'google',email:'bloody@example.test'};
  const fetchFn=fetchStub(()=>response(200,googleCreated));
  const client=createOnlineClient({fetchFn,storage,baseUrl:'http://127.0.0.1:3099'});
  const result=await client.googleSignIn('fake.firebase.id.token');
  assert.equal(result.ok,true);
  assert.equal(result.session.provider,'google');
  assert.equal(JSON.parse(storage.getItem(ONLINE_SESSION_KEY)).provider,'google');
  assert.deepEqual(JSON.parse(fetchFn.calls[0].options.body),{id_token:'fake.firebase.id.token'});
});

test('perfil sem sessão não chama o servidor; 401 limpa a sessão',async()=>{
  const storage=storageStub();
  const fetchFn=fetchStub((url,options)=>{
    if(url.endsWith('/api/auth/guest'))return response(201,guestCreated);
    if(url.endsWith('/api/profile')&&options.method==='PUT')return response(401,{error:'unauthorized'});
    return response(200,{user_id:'u-1',provider:'guest',profile:guestCreated.profile});
  });
  const client=createOnlineClient({fetchFn,storage,baseUrl:'http://127.0.0.1:3099'});
  assert.deepEqual(await client.updateProfile(guestProfile),{ok:false,error:'no_session'});
  assert.deepEqual(await client.syncProfile(guestProfile),{ok:false,error:'no_session'});
  assert.equal(fetchFn.calls.length,0);
  const created=await client.guestSignIn(guestProfile);
  assert.equal(created.ok,true);
  const updated=await client.updateProfile({team:'mystic'});
  assert.equal(updated.ok,false);
  assert.equal(updated.status,401);
  assert.equal(client.hasSession(),false);
  assert.equal(storage.getItem(ONLINE_SESSION_KEY),null);
  assert.match(onlineErrorMessage(updated),/expirou/);
});

test('getProfile usa o token guardado como Bearer',async()=>{
  const storage=storageStub();
  const fetchFn=fetchStub(()=>response(200,{user_id:'u-1',provider:'guest',token:'sess.token.here',profile:guestCreated.profile}));
  const client=createOnlineClient({fetchFn,storage,baseUrl:'http://127.0.0.1:3099'});
  await client.guestSignIn(guestProfile);
  const result=await client.getProfile();
  assert.equal(result.ok,true);
  assert.equal(result.data.profile.team,'valor');
  assert.equal(fetchFn.calls[1].options.headers.authorization,'Bearer sess.token.here');
});

test('URL base é o túnel público e aceita override de desenvolvimento',()=>{
  const storage=storageStub();
  assert.equal(createOnlineClient({storage,fetchFn:async()=>response(200,{})}).baseUrl,ONLINE_BASE_URL);
  assert.match(ONLINE_BASE_URL,/trycloudflare\.com$/);
  storage.setItem(ONLINE_BASE_URL_OVERRIDE_KEY,'http://127.0.0.1:3099/');
  assert.equal(createOnlineClient({storage,fetchFn:async()=>response(200,{})}).baseUrl,'http://127.0.0.1:3099');
});

test('times do Pokémon GO: três, com nomes e cores',()=>{
  assert.deepEqual(GO_TEAMS.map(t=>t.id),['valor','instinct','mystic']);
  assert.equal(isGoTeam('valor'),true);
  assert.equal(isGoTeam('rocket'),false);
  assert.equal(goTeamName('mystic'),'Mystic');
  assert.equal(goTeamName('rocket'),null);
  assert.ok(GO_TEAMS.every(t=>t.name&&t.color&&t.leader&&t.description));
  assert.match(onlineErrorMessage({ok:false,status:429}),/Muitas tentativas/);
  assert.match(onlineErrorMessage({ok:false}),/Não foi possível falar/);
});

test('needsLogin: só pede login para quem não tem perfil salvo',()=>{
  assert.equal(needsLogin({journey:{starter:null},online:{provider:null}}),true);
  assert.equal(needsLogin({journey:{starter:null},online:{}}),true);
  assert.equal(needsLogin({journey:{starter:'bulbasaur'},online:{provider:null}}),false);
  assert.equal(needsLogin({journey:{starter:null},online:{provider:'guest'}}),false);
  assert.equal(needsLogin({journey:{starter:null},online:{provider:'local'}}),false);
  assert.equal(needsLogin(null),true);
});

test('save novo já nasce com a conta online vazia',()=>{
  const p=createProgression({storage:storageStub(),profileMode:'journey'});
  assert.deepEqual(p.getSave().online,{provider:null,team:null,userId:null,syncedAt:null,pendingSync:false,pendingMatches:[],ranking:null});
});

test('setGoTeam valida o time e persiste; null limpa',()=>{
  const p=createProgression({storage:storageStub(),profileMode:'journey'});
  assert.equal(p.setGoTeam('valor').ok,true);
  assert.equal(p.getSave().online.team,'valor');
  assert.equal(p.setGoTeam('rocket').ok,false);
  assert.match(p.setGoTeam('rocket').error,/Valor, Instinct ou Mystic/);
  assert.equal(p.getSave().online.team,'valor');
  assert.equal(p.setGoTeam(null).ok,true);
  assert.equal(p.getSave().online.team,null);
});

test('setOnlineAccount mescla campos e rejeita valores inválidos',()=>{
  const p=createProgression({storage:storageStub(),profileMode:'journey'});
  assert.equal(p.setOnlineAccount({provider:'guest',userId:'u-1',syncedAt:123,pendingSync:false}).ok,true);
  assert.deepEqual(p.getSave().online,{provider:'guest',team:null,userId:'u-1',syncedAt:123,pendingSync:false,pendingMatches:[],ranking:null});
  assert.equal(p.setOnlineAccount({provider:'rocket'}).ok,false);
  assert.equal(p.setOnlineAccount({team:'rocket'}).ok,false);
  assert.equal(p.setOnlineAccount({pendingSync:'sim'}).ok,false);
  assert.equal(p.getSave().online.provider,'guest');
  assert.equal(p.setOnlineAccount({pendingSync:true}).ok,true);
  assert.equal(p.getSave().online.pendingSync,true);
});

test('save antigo sem online migra com os valores padrão',()=>{
  const first=createProgression({storage:storageStub(),profileMode:'journey'});
  const raw=JSON.parse(first.exportSave());
  delete raw.online;
  const storage=storageStub();
  storage.setItem('pulse-arena.save.v1',JSON.stringify(raw));
  const p=createProgression({storage,profileMode:'journey'});
  assert.deepEqual(p.getSave().online,{provider:null,team:null,userId:null,syncedAt:null,pendingSync:false,pendingMatches:[],ranking:null});
  assert.equal(p.getSave().trainerName,raw.trainerName);
});

test('save com online parcial normaliza os campos que faltam',()=>{
  const first=createProgression({storage:storageStub(),profileMode:'journey'});
  const raw=JSON.parse(first.exportSave());
  raw.online={provider:'google'};
  const storage=storageStub();
  storage.setItem('pulse-arena.save.v1',JSON.stringify(raw));
  const p=createProgression({storage,profileMode:'journey'});
  assert.deepEqual(p.getSave().online,{provider:'google',team:null,userId:null,syncedAt:null,pendingSync:false,pendingMatches:[],ranking:null});
});

test('exportar e importar preserva a conta online',()=>{
  const p=createProgression({storage:storageStub(),profileMode:'journey'});
  p.setGoTeam('mystic');
  p.setOnlineAccount({provider:'guest',userId:'u-9',syncedAt:456,pendingSync:false});
  const json=p.exportSave();
  const other=createProgression({storage:storageStub(),profileMode:'journey'});
  other.setCatalog([{key:'bulbasaur',pool:[]}]);
  assert.equal(other.importSave(json).ok,true);
  assert.deepEqual(other.getSave().online,{provider:'guest',team:'mystic',userId:'u-9',syncedAt:456,pendingSync:false,pendingMatches:[],ranking:null});
});

test('convidado pode continuar offline quando o túnel/servidor devolve erro HTTP 5xx',async()=>{
  for(const status of [500,502,503,504]){
    const storage=storageStub();
    const fetchFn=fetchStub(()=>response(status,{error:'gateway_unavailable'}));
    const client=createOnlineClient({fetchFn,storage,baseUrl:'http://127.0.0.1:3099'});
    const result=await client.guestSignIn(guestProfile);
    assert.equal(result.ok,false);
    assert.equal(result.offline,true,`status ${status} precisa permitir fallback local`);
    assert.equal(result.status,status);
    assert.equal(client.hasSession(),false);
    assert.equal(storage.getItem(ONLINE_SESSION_KEY),null);
  }
});
