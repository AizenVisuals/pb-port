// Cliente do PULSE ARENA online (fase 2a: login + perfil; fase 2b: amigos + ranking).
// Fala com o servidor pulse-online (Node + SQLite no PC do Aizen).
// Offline-first: qualquer falha de rede vira {ok:false, offline:true} —
// o jogo NUNCA trava por causa do servidor; o perfil sincroniza depois.
// Um 501 (recurso ainda não implementado no servidor) também não trava
// nada: a tela mostra que o recurso chega em breve e o jogo segue local.
// O token de sessão fica em localStorage (chave própria, fora do save:
// o save é exportável e não pode vazar credencial). O ID Token do Google
// nunca é guardado: ele é trocado na hora por um token de sessão.
export const ONLINE_BASE_URL='https://held-creative-penetration-uses.trycloudflare.com';
export const ONLINE_SESSION_KEY='pulse-arena.online-session.v1';
export const ONLINE_BASE_URL_OVERRIDE_KEY='pulse-arena.online-base-url';
export const ONLINE_REQUEST_TIMEOUT_MS=8000;
export const GO_TEAMS=Object.freeze([
  {id:'valor',name:'Valor',short:'Força e coragem',color:'#e3350d',leader:'Candela',description:'Força e coragem. O time do fogo e da batalha direta.'},
  {id:'instinct',name:'Instinct',short:'Intuição e confiança',color:'#f5c518',leader:'Spark',description:'Intuição e confiança. O time do raio e do instinto.'},
  {id:'mystic',name:'Mystic',short:'Sabedoria e calma',color:'#2a6fd6',leader:'Blanche',description:'Sabedoria e calma. O time do gelo e da análise.'},
]);
export const GO_TEAM_IDS=Object.freeze(GO_TEAMS.map(t=>t.id));
export const isGoTeam=team=>GO_TEAM_IDS.includes(team);
export const goTeamName=team=>GO_TEAMS.find(t=>t.id===team)?.name||null;

// URL base efetiva: override de desenvolvimento/QA em localStorage, senão a constante.
export function resolveOnlineBaseUrl(storage){
  try{
    const override=storage?.getItem?.(ONLINE_BASE_URL_OVERRIDE_KEY);
    if(typeof override==='string'&&/^https?:\/\//.test(override.trim()))return override.trim().replace(/\/+$/,'');
  }catch{}
  return ONLINE_BASE_URL;
}

// Quem já tem perfil salvo (parceiro escolhido ou conta online) entra direto.
export const needsLogin=save=>!save?.journey?.starter&&!save?.online?.provider;

export function onlineErrorMessage(result){
  if(result?.offline)return 'Sem conexão com o servidor. Você pode jogar offline; o perfil sincroniza quando a conexão voltar.';
  if(result?.status===401)return 'Sua sessão expirou. Entre novamente para sincronizar o perfil.';
  if(result?.status===429)return 'Muitas tentativas. Aguarde um pouco e tente de novo.';
  if(result?.status===501||result?.error==='not_implemented')return 'Esse recurso ainda não está disponível no servidor. O jogo continua offline por enquanto.';
  if(result?.status===400)return 'Verifique o nome, o treinador e o time escolhidos.';
  return 'Não foi possível falar com o servidor. Tente de novo ou continue offline.';
}

// Erros de POST /api/friends/request (o servidor devolve o código em `error`
// e, no cooldown, `retry_after_ms` no corpo — o cliente só lê, nunca inventa).
export function friendRequestErrorMessage(result){
  if(!result)return 'Não foi possível enviar o convite.';
  if(result.offline||result.status===501||result.error==='not_implemented')return onlineErrorMessage(result);
  switch(result.error){
    case 'cannot_add_self':return 'Você não pode se adicionar como amigo.';
    case 'user_not_found':return 'Nenhum treinador com esse apelido.';
    case 'already_friends':return 'Vocês já são amigos.';
    case 'request_pending':return 'Já existe um convite pendente com esse treinador.';
    case 'request_cooldown':{
      const ms=result.retry_after_ms;
      const s=Number.isFinite(ms)?Math.max(1,Math.ceil(ms/1000)):null;
      return s?`Aguarde ${s}s antes de enviar outro convite para esse treinador.`:'Aguarde um pouco antes de enviar outro convite.';
    }
    default:return onlineErrorMessage(result);
  }
}

// Tiers do ranqueado (PB): lo = piso do tier, hi = piso do próximo tier
// (null no topo). Champion é top 10% dos 600+ — só o servidor decide quem
// é Champion; localmente, 600+ sempre mostra Master Ball.
export const RANKED_TIERS=Object.freeze([
  {id:'beginner-4',name:'Iniciante IV',lo:0,hi:15},
  {id:'beginner-3',name:'Iniciante III',lo:15,hi:35},
  {id:'beginner-2',name:'Iniciante II',lo:35,hi:60},
  {id:'beginner-1',name:'Iniciante I',lo:60,hi:90},
  {id:'pokeball-4',name:'Poké Ball IV',lo:90,hi:120},
  {id:'pokeball-3',name:'Poké Ball III',lo:120,hi:150},
  {id:'pokeball-2',name:'Poké Ball II',lo:150,hi:185},
  {id:'pokeball-1',name:'Poké Ball I',lo:185,hi:220},
  {id:'greatball-4',name:'Super Ball IV',lo:220,hi:260},
  {id:'greatball-3',name:'Super Ball III',lo:260,hi:300},
  {id:'greatball-2',name:'Super Ball II',lo:300,hi:345},
  {id:'greatball-1',name:'Super Ball I',lo:345,hi:390},
  {id:'ultraball-4',name:'Ultra Ball IV',lo:390,hi:440},
  {id:'ultraball-3',name:'Ultra Ball III',lo:440,hi:490},
  {id:'ultraball-2',name:'Ultra Ball II',lo:490,hi:545},
  {id:'ultraball-1',name:'Ultra Ball I',lo:545,hi:600},
  {id:'master',name:'Master Ball',lo:600,hi:null},
  {id:'champion',name:'Campeão',lo:600,hi:null},
]);
export function tierForPoints(points){
  const p=Number.isFinite(points)?Math.max(0,Math.floor(points)):0;
  let found=RANKED_TIERS[0];
  for(const tier of RANKED_TIERS){
    if(tier.id==='champion')continue;
    if(p>=tier.lo)found=tier;else break;
  }
  return found;
}
// Progresso para o próximo tier a partir do standing do servidor (ou só dos
// pontos, quando o servidor não respondeu). `next` do servidor pode ser o
// nome do próximo tier; qualquer outro formato é ignorado e derivado aqui.
export const localizeTier = value => String(value || '').replace(/Beginner/g,'Iniciante').replace(/Great Ball/g,'Super Ball').replace(/Champion/g,'Campeão');
export function rankedProgress(standing){
  const points=Number.isFinite(standing?.points)?Math.max(0,Math.floor(standing.points)):0;
  const local=tierForPoints(points);
  const lo=Number.isFinite(standing?.lo)?standing.lo:local.lo;
  const hi=Number.isFinite(standing?.hi)?standing.hi:local.hi;
  const idx=RANKED_TIERS.findIndex(t=>t.id===local.id);
  const nextTier=idx>=0&&idx+1<RANKED_TIERS.length?RANKED_TIERS[idx+1]:null;
  const tierName=standing?.tier_name||standing?.tier&&RANKED_TIERS.find(t=>t.id===standing.tier)?.name||local.name;
  const nextName=typeof standing?.next==='string'&&standing.next?standing.next:(local.id==='master'?'Champion · top 10% dos 600+':nextTier?.name||null);
  const pct=hi===null||hi<=lo?100:Math.min(100,Math.max(0,Math.round(((points-lo)/(hi-lo))*100)));
  return {tierName:localizeTier(tierName),points,lo,hi,nextName:nextName?localizeTier(nextName):null,pct,isTop:hi===null};
}

export function createOnlineClient({fetchFn,storage:providedStorage,baseUrl,timeoutMs=ONLINE_REQUEST_TIMEOUT_MS}={}){
  const fetchImpl=fetchFn||globalThis.fetch;
  let storage=providedStorage;
  if(storage===undefined)try{storage=globalThis.localStorage||null;}catch{storage=null;}
  const base=(baseUrl||resolveOnlineBaseUrl(storage)).replace(/\/+$/,'');
  const storeSession=session=>{
    if(!storage)return;
    try{if(session)storage.setItem(ONLINE_SESSION_KEY,JSON.stringify(session));else storage.removeItem(ONLINE_SESSION_KEY);}catch{}
  };
  const loadSession=()=>{
    if(!storage)return null;
    try{const raw=storage.getItem(ONLINE_SESSION_KEY);if(!raw)return null;const s=JSON.parse(raw);return s&&typeof s.token==='string'&&s.token?s:null;}catch{return null;}
  };
  const request=async(path,{method='GET',body,token}={})=>{
    if(typeof fetchImpl!=='function')return {ok:false,offline:true};
    let response;
    try{
      response=await fetchImpl(base+path,{
        method,
        headers:{'content-type':'application/json',...(token?{authorization:`Bearer ${token}`}:{})},
        body:body===undefined?undefined:JSON.stringify(body),
        signal:AbortSignal.timeout(timeoutMs),
      });
    }catch{return {ok:false,offline:true};}
    let data=null;
    try{data=await response.json();}catch{}
    if(!response.ok)return {ok:false,status:response.status,error:data?.error||'request_failed',details:data?.details,retry_after_ms:data?.retry_after_ms};
    return {ok:true,status:response.status,data};
  };
  const adoptSession=(data,provider)=>{
    if(!data?.token)return {ok:false,error:'missing_token'};
    const session={token:data.token,provider,userId:data.user_id||null};
    storeSession(session);
    return {ok:true,session,profile:data.profile||null};
  };
  // Chamadas autenticadas (fase 2b): sem sessão não chamam o servidor;
  // 401 limpa a sessão, como no login; qualquer outro erro volta intacto
  // para a tela decidir (offline, 501, 400 com código de negócio).
  const authed=async(path,{method='GET',body}={})=>{
    const session=loadSession();
    if(!session)return {ok:false,error:'no_session'};
    const result=await request(path,{method,body,token:session.token});
    if(!result.ok&&result.status===401)storeSession(null);
    return result;
  };
  return {
    arenaRotation:()=>authed('/api/arena/rotation'),
    arenaQueue:()=>authed('/api/arena/queue'),
    arenaJoin:team=>authed('/api/arena/queue',{method:'POST',body:{team}}),
    arenaLeave:()=>authed('/api/arena/queue',{method:'DELETE'}),
    arenaStanding:()=>authed('/api/arena/me'),
    arenaLadder:()=>authed('/api/arena/ladder'),
    arenaHistory:()=>authed('/api/arena/history'),
    arenaResult:(match_id,result)=>authed('/api/arena/result',{method:'POST',body:{match_id,result}}),
    async openArenaSocket({onMessage=()=>{},onClose=()=>{},WebSocketClass=globalThis.WebSocket}={}) {
      const session=loadSession();
      if(!session)throw new Error('Entre em uma conta para jogar na Arena.');
      const socket=new WebSocketClass(base.replace(/^http/,'ws')+'/api/arena/ws');
      return new Promise((resolve,reject)=>{
        let welcomed=false;
        const timer=setTimeout(()=>{socket.close();reject(new Error('Servidor da Arena não respondeu.'));},10000);
        socket.onopen=()=>socket.send(JSON.stringify({t:'hello',token:session.token}));
        socket.onmessage=event=>{
          let msg;try{msg=JSON.parse(event.data);}catch{return;}
          if(msg.t==='welcome'){welcomed=true;clearTimeout(timer);resolve(socket);}
          onMessage(msg);
        };
        socket.onerror=()=>{if(!welcomed){clearTimeout(timer);reject(new Error('Não foi possível conectar à Arena.'));}};
        socket.onclose=()=>{clearTimeout(timer);if(!welcomed)reject(new Error('A conexão com a Arena foi encerrada.'));onClose();};
      });
    },
    baseUrl:base,
    loadSession,
    hasSession:()=>!!loadSession(),
    clearSession:()=>storeSession(null),
    async guestSignIn(profile){
      const result=await request('/api/auth/guest',{method:'POST',body:profile});
      if(!result.ok)return result;
      return adoptSession(result.data,'guest');
    },
    async googleSignIn(idToken){
      if(typeof idToken!=='string'||!idToken)return {ok:false,error:'missing_id_token'};
      const result=await request('/api/auth/google',{method:'POST',body:{id_token:idToken},token:loadSession()?.token});
      if(!result.ok)return result;
      return adoptSession(result.data,'google');
    },
    async getProfile(){
      const session=loadSession();
      if(!session)return {ok:false,error:'no_session'};
      const result=await request('/api/profile',{token:session.token});
      if(!result.ok&&result.status===401)storeSession(null);
      return result;
    },
    async updateProfile(profile){
      const session=loadSession();
      if(!session)return {ok:false,error:'no_session'};
      const result=await request('/api/profile',{method:'PUT',body:profile,token:session.token});
      if(!result.ok&&result.status===401)storeSession(null);
      return result;
    },
    // Sincroniza o perfil local; sem sessão, não há o que sincronizar.
    async syncProfile(profile){
      if(!loadSession())return {ok:false,error:'no_session'};
      return this.updateProfile(profile);
    },
    // ---- Amigos (fase 2b) ----
    async getFriends(){
      return authed('/api/friends');
    },
    async sendFriendRequest(nick){
      if(typeof nick!=='string'||!nick.trim())return {ok:false,error:'invalid_nick'};
      return authed('/api/friends/request',{method:'POST',body:{nick:nick.trim()}});
    },
    async respondFriendRequest(user_id,accept){
      if(typeof user_id!=='string'||!user_id)return {ok:false,error:'invalid_user'};
      return authed('/api/friends/respond',{method:'POST',body:{user_id,accept:!!accept}});
    },
    async removeFriend(user_id){
      if(typeof user_id!=='string'||!user_id)return {ok:false,error:'invalid_user'};
      return authed(`/api/friends/${encodeURIComponent(user_id)}`,{method:'DELETE'});
    },
    // Presença: silencioso por desenho — quem chama ignora o retorno.
    async sendHeartbeat(){
      return authed('/api/friends/heartbeat',{method:'POST'});
    },
    // ---- Ranking ranqueado (fase 2b) ----
    async getRanking(){
      return authed('/api/rankings/me');
    },
    async getLadder(limit=50){
      const n=Number.isFinite(limit)?Math.min(50,Math.max(1,Math.floor(limit))):50;
      return authed(`/api/rankings/ladder?limit=${n}`);
    },
    async getRankingHistory(limit=20){
      const n=Number.isFinite(limit)?Math.min(50,Math.max(1,Math.floor(limit))):20;
      return authed(`/api/rankings/history?limit=${n}`);
    },
    async submitRankedMatch({result,opponent_id=null,vs_bot=false}={}){
      if(!['win','loss'].includes(result))return {ok:false,error:'invalid_result'};
      const body={result,vs_bot:!!vs_bot};
      if(typeof opponent_id==='string'&&opponent_id)body.opponent_id=opponent_id;
      return authed('/api/rankings/match',{method:'POST',body});
    },
  };
}
