import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createOnlineClient,ONLINE_SESSION_KEY,tierForPoints,rankedProgress,friendRequestErrorMessage,onlineErrorMessage} from '../public/pulse/online.js';
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
const guestCreated={user_id:'u-1',provider:'guest',email:null,token:'sess.token.here',profile:{trainer_key:'ash',nick:'Bloody',team:'valor',updated_at:'2026-11-15T00:00:00.000Z'}};
async function signedInClient(handler){
  const storage=storageStub();
  const fetchFn=fetchStub(handler);
  const client=createOnlineClient({fetchFn,storage,baseUrl:'http://127.0.0.1:3099'});
  const created=await client.guestSignIn({trainer_key:'ash',nick:'Bloody',team:'valor'});
  assert.equal(created.ok,true);
  return {client,fetchFn,storage};
}
const friendsPayload={friends:[{user_id:'u-2',nick:'Misty',trainer_key:'dawn',team:'mystic',online:true,last_seen_at:'2026-11-15T18:00:00.000Z'}],incoming:[{user_id:'u-3',nick:'Brock',trainer_key:'blue',team:'valor',created_at:'2026-11-15T17:00:00.000Z',expires_at:'2026-11-22T17:00:00.000Z'}],outgoing:[{user_id:'u-4',nick:'Gary',trainer_key:'gary',team:'instinct',created_at:'2026-11-15T16:00:00.000Z',expires_at:'2026-11-22T16:00:00.000Z'}]};
const standingPayload={mode:'ranked',tier:'pokeball-4',tier_name:'Poké Ball IV',rank:4,points:100,lo:90,hi:120,next:'Poké Ball III',floor:90,wins:6,losses:4,games:10,streak:2,season:'2026-11',ladder_rank:12};

test('amigos: lista separa amigos, recebidos e enviados',async()=>{
  const {client,fetchFn}=await signedInClient((url,options)=>{
    if(url.endsWith('/api/auth/guest'))return response(201,guestCreated);
    if(url.endsWith('/api/friends'))return response(200,friendsPayload);
    return response(404,{error:'not_found'});
  });
  const result=await client.getFriends();
  assert.equal(result.ok,true);
  assert.equal(result.data.friends[0].nick,'Misty');
  assert.equal(result.data.incoming[0].nick,'Brock');
  assert.equal(result.data.outgoing[0].nick,'Gary');
  assert.equal(fetchFn.calls[1].options.headers.authorization,'Bearer sess.token.here');
});

test('amigos: convite valida nick, envia e mapeia os erros do servidor',async()=>{
  const {client,fetchFn}=await signedInClient((url,options)=>{
    if(url.endsWith('/api/auth/guest'))return response(201,guestCreated);
    if(url.endsWith('/api/friends/request')){
      const body=JSON.parse(options.body);
      if(body.nick==='Eu')return response(400,{error:'cannot_add_self'});
      if(body.nick==='Fantasma')return response(400,{error:'user_not_found'});
      if(body.nick==='Spam')return response(400,{error:'request_cooldown',retry_after_ms:45000});
      return response(201,{ok:true});
    }
    return response(404,{error:'not_found'});
  });
  assert.deepEqual(await client.sendFriendRequest(''),{ok:false,error:'invalid_nick'});
  assert.deepEqual(await client.sendFriendRequest('   '),{ok:false,error:'invalid_nick'});
  const sent=await client.sendFriendRequest('  Misty ');
  assert.equal(sent.ok,true);
  assert.deepEqual(JSON.parse(fetchFn.calls[1].options.body),{nick:'Misty'});
  assert.equal(fetchFn.calls[1].options.method,'POST');
  assert.equal(friendRequestErrorMessage(await client.sendFriendRequest('Eu')),'Você não pode se adicionar como amigo.');
  assert.equal(friendRequestErrorMessage(await client.sendFriendRequest('Fantasma')),'Nenhum treinador com esse apelido.');
  assert.equal(friendRequestErrorMessage(await client.sendFriendRequest('Spam')),'Aguarde 45s antes de enviar outro convite para esse treinador.');
  assert.equal(friendRequestErrorMessage({ok:false,error:'already_friends'}),'Vocês já são amigos.');
  assert.equal(friendRequestErrorMessage({ok:false,error:'request_pending'}),'Já existe um convite pendente com esse treinador.');
});

test('amigos: responder aceita/recusa e remover usa DELETE com o id',async()=>{
  const {client,fetchFn}=await signedInClient((url,options)=>{
    if(url.endsWith('/api/auth/guest'))return response(201,guestCreated);
    if(url.endsWith('/api/friends/respond'))return response(200,{status:JSON.parse(options.body).accept?'accepted':'declined'});
    if(url.endsWith('/api/friends/u-3')&&options.method==='DELETE')return response(200,{ok:true});
    return response(404,{error:'not_found'});
  });
  assert.deepEqual(await client.respondFriendRequest('','x'),{ok:false,error:'invalid_user'});
  assert.deepEqual((await client.respondFriendRequest('u-3',true)).data,{status:'accepted'});
  assert.deepEqual(JSON.parse(fetchFn.calls[1].options.body),{user_id:'u-3',accept:true});
  assert.deepEqual((await client.respondFriendRequest('u-3',false)).data,{status:'declined'});
  assert.equal((await client.removeFriend('u-3')).ok,true);
  assert.equal(fetchFn.calls[3].url,'http://127.0.0.1:3099/api/friends/u-3');
  assert.equal(fetchFn.calls[3].options.method,'DELETE');
});

test('amigos: heartbeat é POST autenticado e falha silenciosa vira offline',async()=>{
  const {client,fetchFn}=await signedInClient((url,options)=>{
    if(url.endsWith('/api/auth/guest'))return response(201,guestCreated);
    if(url.endsWith('/api/friends/heartbeat'))return response(200,{ok:true});
    return response(404,{error:'not_found'});
  });
  const beat=await client.sendHeartbeat();
  assert.equal(beat.ok,true);
  assert.equal(fetchFn.calls[1].url,'http://127.0.0.1:3099/api/friends/heartbeat');
  assert.equal(fetchFn.calls[1].options.method,'POST');
  assert.equal(fetchFn.calls[1].options.headers.authorization,'Bearer sess.token.here');
  const offlineStorage=storageStub();
  offlineStorage.setItem(ONLINE_SESSION_KEY,JSON.stringify({token:'sess.token.here',provider:'guest',userId:'u-1'}));
  const offlineClient=createOnlineClient({fetchFn:fetchStub(()=>{throw new Error('down');}),storage:offlineStorage,baseUrl:'http://127.0.0.1:3099'});
  assert.deepEqual(await offlineClient.sendHeartbeat(),{ok:false,offline:true});
  assert.equal(offlineClient.hasSession(),true);
});

test('amigos e ranking sem sessão não chamam o servidor; 401 limpa a sessão',async()=>{
  const storage=storageStub();
  const fetchFn=fetchStub((url)=>{
    if(url.endsWith('/api/auth/guest'))return response(201,guestCreated);
    return response(401,{error:'unauthorized'});
  });
  const client=createOnlineClient({fetchFn,storage,baseUrl:'http://127.0.0.1:3099'});
  assert.deepEqual(await client.getFriends(),{ok:false,error:'no_session'});
  assert.deepEqual(await client.getRanking(),{ok:false,error:'no_session'});
  assert.equal(fetchFn.calls.length,0);
  await client.guestSignIn({trainer_key:'ash',nick:'Bloody',team:'valor'});
  const denied=await client.getFriends();
  assert.equal(denied.ok,false);
  assert.equal(denied.status,401);
  assert.equal(client.hasSession(),false);
  assert.equal(storage.getItem(ONLINE_SESSION_KEY),null);
});

test('servidor sem a fase (501) volta como não implementado e não trava',async()=>{
  const {client}=await signedInClient((url)=>{
    if(url.endsWith('/api/auth/guest'))return response(201,guestCreated);
    return response(501,{error:'not_implemented',phase:'next',resource:'friends'});
  });
  const friends=await client.getFriends();
  assert.equal(friends.ok,false);
  assert.equal(friends.status,501);
  assert.equal(friends.error,'not_implemented');
  assert.match(onlineErrorMessage(friends),/ainda não está disponível/);
  const ranking=await client.getRanking();
  assert.equal(ranking.status,501);
  assert.equal(client.hasSession(),true);
});

test('ranking: meu standing, ladder com limite e histórico',async()=>{
  const ladderPayload={season:'2026-11',rows:[{rank:1,user_id:'u-9',nick:'Top',trainer_key:'leon',team:'valor',tier:'master',tier_name:'Master Ball',points:640,wins:20,losses:2,games:22},{rank:12,user_id:'u-1',nick:'Bloody',trainer_key:'ash',team:'valor',tier:'pokeball-4',tier_name:'Poké Ball IV',points:100,wins:6,losses:4,games:10}]};
  const historyPayload={matches:[{id:'m-1',opponent_id:null,opponent_nick:'Bot',result:'win',delta:5,points_before:95,points_after:100,tier_before:'Poké Ball IV',tier_after:'Poké Ball IV',vs_bot:true,created_at:'2026-11-15T18:00:00.000Z'}]};
  const {client,fetchFn}=await signedInClient((url)=>{
    if(url.endsWith('/api/auth/guest'))return response(201,guestCreated);
    if(url.endsWith('/api/rankings/me'))return response(200,standingPayload);
    if(url.includes('/api/rankings/ladder'))return response(200,ladderPayload);
    if(url.includes('/api/rankings/history'))return response(200,historyPayload);
    return response(404,{error:'not_found'});
  });
  const me=await client.getRanking();
  assert.equal(me.ok,true);
  assert.equal(me.data.tier_name,'Poké Ball IV');
  assert.equal(me.data.points,100);
  const ladder=await client.getLadder(50);
  assert.equal(ladder.data.rows[0].nick,'Top');
  assert.equal(fetchFn.calls[2].url,'http://127.0.0.1:3099/api/rankings/ladder?limit=50');
  const history=await client.getRankingHistory(20);
  assert.equal(history.data.matches[0].delta,5);
  assert.equal(fetchFn.calls[3].url,'http://127.0.0.1:3099/api/rankings/history?limit=20');
});

test('ranking: enviar resultado de partida ranqueada contra bot',async()=>{
  const {client,fetchFn}=await signedInClient((url,options)=>{
    if(url.endsWith('/api/auth/guest'))return response(201,guestCreated);
    if(url.endsWith('/api/rankings/match'))return response(200,{standing:standingPayload,match:{id:'m-2',delta:5,points_before:95,points_after:100,tier_before:'Poké Ball IV',tier_after:'Poké Ball IV',bonus:0}});
    return response(404,{error:'not_found'});
  });
  assert.deepEqual(await client.submitRankedMatch({result:'draw'}),{ok:false,error:'invalid_result'});
  const win=await client.submitRankedMatch({result:'win',vs_bot:true});
  assert.equal(win.ok,true);
  assert.equal(win.data.match.delta,5);
  assert.deepEqual(JSON.parse(fetchFn.calls[1].options.body),{result:'win',vs_bot:true});
  const loss=await client.submitRankedMatch({result:'loss',opponent_id:'u-2',vs_bot:false});
  assert.deepEqual(JSON.parse(fetchFn.calls[2].options.body),{result:'loss',vs_bot:false,opponent_id:'u-2'});
});

test('tiers locais seguem os pisos do PB em todos os limites',()=>{
  const cases=[[0,'Iniciante IV'],[14,'Iniciante IV'],[15,'Iniciante III'],[34,'Iniciante III'],[35,'Iniciante II'],[59,'Iniciante II'],[60,'Iniciante I'],[89,'Iniciante I'],[90,'Poké Ball IV'],[119,'Poké Ball IV'],[120,'Poké Ball III'],[185,'Poké Ball I'],[219,'Poké Ball I'],[220,'Super Ball IV'],[345,'Super Ball I'],[389,'Super Ball I'],[390,'Ultra Ball IV'],[545,'Ultra Ball I'],[599,'Ultra Ball I'],[600,'Master Ball'],[9999,'Master Ball']];
  for(const [points,name]of cases)assert.equal(tierForPoints(points).name,name,`pontos ${points}`);
  assert.equal(tierForPoints(-5).name,'Iniciante IV');
  assert.equal(tierForPoints(100).hi,120);
  assert.equal(tierForPoints(600).hi,null);
});

test('progresso do ranking usa o standing do servidor e cai para os pontos locais',()=>{
  const prog=rankedProgress(standingPayload);
  assert.deepEqual(prog,{tierName:'Poké Ball IV',points:100,lo:90,hi:120,nextName:'Poké Ball III',pct:33,isTop:false});
  const local=rankedProgress({points:595});
  assert.equal(local.tierName,'Ultra Ball I');
  assert.equal(local.nextName,'Master Ball');
  assert.equal(local.pct,91);
  const top=rankedProgress({points:640,tier_name:'Master Ball'});
  assert.equal(top.isTop,true);
  assert.equal(top.pct,100);
  assert.match(top.nextName,/Campeão/);
  assert.equal(rankedProgress(null).tierName,'Iniciante IV');
});

const roster=JSON.parse(await readFile(new URL('../public/roster.json',import.meta.url),'utf8'));
function progressionFixture(){
  const p=createProgression({storage:storageStub(),now:()=>Date.UTC(2026,10,15),profileMode:'journey'});
  assert.equal(p.setCatalog(roster).ok,true);
  return p;
}
const pendingMatch={battleId:'b-1',result:'win',opponent_id:null,vs_bot:true,createdAt:Date.UTC(2026,10,15)};

test('resultados pendentes enfileiram, deduplicam por batalha e limpam por id',()=>{
  const p=progressionFixture();
  assert.deepEqual(p.getSave().online.pendingMatches,[]);
  assert.equal(p.getSave().online.ranking,null);
  assert.equal(p.queuePendingMatch(pendingMatch).ok,true);
  assert.equal(p.queuePendingMatch(pendingMatch).duplicate,true);
  assert.equal(p.getSave().online.pendingMatches.length,1);
  assert.equal(p.queuePendingMatch({...pendingMatch,battleId:'b-2',result:'loss'}).ok,true);
  assert.equal(p.getSave().online.pendingMatches.length,2);
  assert.equal(p.queuePendingMatch({battleId:'b-3',result:'draw',opponent_id:null,vs_bot:true,createdAt:1}).ok,false);
  assert.equal(p.queuePendingMatch({battleId:'b-3',result:'win',opponent_id:null,vs_bot:true}).ok,false);
  assert.equal(p.clearPendingMatches(['b-1']).removed,1);
  assert.deepEqual(p.getSave().online.pendingMatches.map(m=>m.battleId),['b-2']);
  assert.equal(p.clearPendingMatches().removed,1);
  assert.deepEqual(p.getSave().online.pendingMatches,[]);
});

test('fila de pendentes limita a 20 e descarta o mais antigo',()=>{
  const p=progressionFixture();
  for(let i=0;i<22;i++)assert.equal(p.queuePendingMatch({...pendingMatch,battleId:`b-${i}`}).ok,true);
  const ids=p.getSave().online.pendingMatches.map(m=>m.battleId);
  assert.equal(ids.length,20);
  assert.equal(ids[0],'b-2');
  assert.equal(ids[19],'b-21');
});

test('standing em cache persiste no save e sobrevive a exportar/importar',()=>{
  const disk=storageStub();
  const p=createProgression({storage:disk,now:()=>Date.UTC(2026,10,15),profileMode:'journey'});
  assert.equal(p.setCatalog(roster).ok,true);
  assert.equal(p.setCachedRanking({tier:'x'}).ok,false);
  assert.equal(p.setCachedRanking(standingPayload).ok,true);
  assert.equal(p.queuePendingMatch(pendingMatch).ok,true);
  const saved=p.getSave().online.ranking;
  assert.equal(saved.tier,'pokeball-4');
  assert.equal(saved.points,100);
  assert.equal(saved.cachedAt,Date.UTC(2026,10,15));
  const json=p.exportSave();
  const other=createProgression({storage:storageStub(),now:()=>Date.UTC(2026,10,15),profileMode:'journey'});
  assert.equal(other.setCatalog(roster).ok,true);
  assert.equal(other.importSave(json).ok,true);
  assert.equal(other.getSave().online.ranking.points,100);
  assert.equal(other.getSave().online.pendingMatches.length,1);
  assert.equal(other.getSave().online.pendingMatches[0].battleId,'b-1');
});

test('save antigo sem os campos novos migra para fila vazia e ranking nulo',()=>{
  const first=progressionFixture();
  const raw=JSON.parse(first.exportSave());
  delete raw.online.pendingMatches;
  delete raw.online.ranking;
  const storage=storageStub();
  storage.setItem('pulse-arena.save.v1',JSON.stringify(raw));
  const p=createProgression({storage,now:()=>Date.UTC(2026,10,15),profileMode:'journey'});
  assert.deepEqual(p.getSave().online.pendingMatches,[]);
  assert.equal(p.getSave().online.ranking,null);
});
