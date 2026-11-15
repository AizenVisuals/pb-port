import{createRooms}from'./rooms.mjs';
import http from 'node:http';
import { readFile, writeFile, mkdir, rename } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomUUID, randomBytes } from 'node:crypto';
import { WebSocketServer } from 'ws';
import { engine, createSimulation } from './engine.mjs';
import { rankOf, score, seasonOf, seasonEnds } from '../public/ranks.js';
const root = resolve(fileURLToPath(new URL('../public/', import.meta.url)));
const dataDir = resolve(process.env.DATA_DIR || fileURLToPath(new URL('../data/', import.meta.url)));
await mkdir(dataDir, { recursive: true });
const storePath = resolve(dataDir, 'players.json');
let players = {}; try { players = JSON.parse(await readFile(storePath, 'utf8')); } catch(e) { if(e.code !== 'ENOENT') throw e; }
let saving = Promise.resolve();
const save = () => { const snapshot = JSON.stringify(players); saving = saving.then(async () => { await writeFile(storePath+'.tmp', snapshot, { mode: 0o600 }); await rename(storePath+'.tmp', storePath); }).catch(console.error); };
const clients = new Set(), queue = [], matches = new Map();
const json = (res, status, value) => { res.writeHead(status, {'content-type':'application/json; charset=utf-8'}); res.end(JSON.stringify(value)); };
const mime = {'.html':'text/html','.js':'text/javascript','.json':'application/json','.css':'text/css','.png':'image/png','.woff2':'font/woff2','.ttf':'font/ttf','.ogg':'audio/ogg','.mp3':'audio/mpeg','.wav':'audio/wav','.svg':'image/svg+xml'};
const server = http.createServer(async (req, res) => {
  try {
    const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    if (pathname === '/api/health') return json(res,200,{ok:true,online:clients.size,matches:matches.size,server:'self-hosted'});
    if (pathname === '/api/version') return json(res,200,{bundle:null,selfHosted:true});
    if (pathname === '/api/auth') return json(res,200,{providers:[],guests:true});
    if (pathname === '/api/usage') return json(res,200,{formats:{}});
    if (pathname.startsWith('/api/replay/')) return json(res,410,{gone:true});
    if (pathname === '/port-status.json') return json(res,200,{supported:['3v3','6v6'],features:['practice','pvp','leaderboard','local-profiles','saved-teams']});
    const file = resolve(root, (pathname === '/' || /^\/room\/[A-Z0-9]{6}\/?$/i.test(pathname)) ? 'index.html' : pathname.replace(/^\//,''));
    if(!file.startsWith(root+sep)) return json(res,403,{error:'Forbidden'});
    const bytes = await readFile(file);
    res.writeHead(200,{'content-type':mime[extname(file)]||'application/octet-stream','cache-control':'no-cache','x-content-type-options':'nosniff'}); res.end(req.method==='HEAD'?undefined:bytes);
  } catch(e) { json(res,e.code==='ENOENT'?404:400,{error:e.code==='ENOENT'?'File not found':'Invalid request'}); }
});
const wss = new WebSocketServer({server,maxPayload:64*1024});
const send = (c, value) => { if(c?.ws.readyState===1)c.ws.send(JSON.stringify(value)); };
const rating = (p, format) => { const s=p.ladder[format]||{pts:0,streak:0,wins:0,losses:0,games:0}; const r=rankOf(s.pts); return {...s,tier:r.tier,rank:r.rank,rankName:r.name,lo:r.lo,hi:r.hi,next:r.next,season:seasonOf(),allWins:s.wins,allLosses:s.losses}; };
const rooms=createRooms({send,validateTeam,startMatch,removeQueue});
function removeQueue(c) { const at=queue.findIndex(q=>q.c===c); if(at>=0)queue.splice(at,1); }
function validateTeam(team, count) {
  if(!team||!Array.isArray(team.mons)||team.mons.length!==count||new Set(team.mons).size!==count||team.mons.some(m=>!engine.INFO[m]))throw Error(`Escolha ${count} Pokémon diferentes.`);
  return {mons:team.mons,moves:team.mons.map((m,i)=>engine.legalMoves(m,team.moves?.[i])),gimmick:team.gimmick?.kind==='mega'&&Number.isInteger(team.gimmick.mon)&&team.gimmick.mon>=0&&team.gimmick.mon<count?{kind:'mega',mon:team.gimmick.mon}:null};
}
const randomTeam = n => { const keys=[...engine.ROSTER]; for(let i=keys.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[keys[i],keys[j]]=[keys[j],keys[i]];}return validateTeam({mons:keys.slice(0,n)},n); };
function finish(m,winner,surrender) {
  if(m.ended)return; m.ended=true; rooms.finish(m,winner); clearInterval(m.timer); clearTimeout(m.loadTimeout);
  m.clients.forEach((c,side)=>{ if(!c)return; c.match=null; const ranked=m.mode==='ranked'; let result=rating(c.player,m.format);
    if(ranked){const won=side===winner; const s=score(result,won,m.teams.some(t=>t.bot));result={...result,...s,wins:result.wins+Number(won),losses:result.losses+Number(!won),games:result.games+1};c.player.ladder[m.format]=result;result=rating(c.player,m.format);}
    c.player.played++; (c.player.history||=[]).unshift({num:m.id,opp:m.teams[1-side].name,oppTrainer:m.teams[1-side].trainer,won:side===winner,started:m.started,format:m.format,mode:m.mode,replay:false});c.player.history=c.player.history.slice(0,50);
    send(c,{t:'end',id:m.id,winner,side,mode:m.mode,surrender,played:c.player.played,...result});
  });matches.delete(m.id);save();
}
async function startMatch(entries, opts) {
  const count=opts.format==='6v6'?6:3; const id=randomUUID();
  const teams=entries.map((entry,side)=>entry?{...entry.team,name:entry.c.player.name,trainer:entry.c.player.trainer,bot:false}:{...randomTeam(count),name:'Bot local',trainer:'blue',bot:true,level:opts.level||3});
  const arena=engine.ARENAS.some(a=>(a.key||a)===opts.arena)?opts.arena:engine.DEFAULT_ARENA;
  const m={id,teams,clients:entries.map(e=>e?.c||null),format:opts.format,mode:opts.mode,arena,seed:randomBytes(4).readUInt32LE(),inputs:[],ready:new Set(),started:Date.now(),ended:false};
  for(const c of m.clients) if(c)c.match=m;
  matches.set(id,m);
  try { m.b=await createSimulation(m.seed,teams,arena); if(m.ended)return; } catch(e) { matches.delete(id);for(const c of m.clients)if(c){c.match=null;send(c,{t:'error',msg:`Não foi possível carregar os assets locais: ${e.message}`});}console.error(e);return; }
  m.clients.forEach((c,side)=>send(c,{t:'match',id,side,format:m.format,mode:m.mode,arena,seed:m.seed,teams,startIn:null,upTo:0}));
  m.loadTimeout=setTimeout(()=>{for(const c of m.clients)send(c,{t:'cut',msg:'A partida não carregou em 60 segundos. Tente novamente.'}); m.clients.forEach(c=>{if(c)c.match=null});matches.delete(id);m.ended=true;},60000);
}
function begin(m) {
  if(m.timer||m.ended||m.clients.some(c=>c&&!m.ready.has(c)))return;
  clearTimeout(m.loadTimeout);m.clients.forEach(c=>send(c,{t:'go',id:m.id,startIn:1000}));
  const startAt=performance.now()+1000;
  m.timer=setInterval(()=>{
    if(performance.now()<startAt)return;
    const target=Math.floor((performance.now()-startAt)*60/1000); if(target<=m.b.frame)return; const inputs=m.inputs.splice(0);
    const steps=Math.max(0,Math.min(12,target-m.b.frame));
    try {for(let i=0;i<steps&&!m.b.done;i++){engine.stepRanked(m.b,inputs.filter(a=>a.at===m.b.frame));}}
    catch(e){ console.error('Simulation failed',e);for(const c of m.clients){send(c,{t:'cut',msg:'Erro na simulação local; a partida não conta.'});if(c)c.match=null;}clearInterval(m.timer);matches.delete(m.id);m.ended=true;return; }
    // Preserve future commands when a tick batch has not reached their frame.
    m.inputs.push(...inputs.filter(a=>a.at>=m.b.frame));
    m.clients.forEach(c=>send(c,{t:'tick',id:m.id,inputs:inputs.filter(a=>a.at<m.b.frame),upTo:m.b.frame}));
    if(m.b.done)finish(m,engine.winnerSide(m.b));
  },50);
}
wss.on('connection',(ws,req)=>{
  const origin=req.headers.origin; if(origin&&new URL(origin).host!==req.headers.host){ws.close(1008,'Origin mismatch');return;}
  const c={ws,player:null,match:null,budget:0};clients.add(c);
  ws.on('message',async bytes=>{
    try {
      const now=Date.now();if(now-(c.budgetAt||0)>1000){c.budgetAt=now;c.budget=0;}if(++c.budget>90)throw Error('Muitos comandos. Aguarde um instante.');
      const e=JSON.parse(bytes);if(!e||typeof e.t!=='string')throw Error('Mensagem inválida.');
      if(e.t==='hello'){
        if(c.player)throw Error('Já conectado.');
        let p=typeof e.token==='string'?players[e.token]:null;
        if(!p){const name=String(e.name||'Treinador').trim();if(!/^[\p{L}\p{N} ._'-]{2,16}$/u.test(name))throw Error('Use um nome de 2 a 16 caracteres.');const token=randomBytes(24).toString('hex');p=players[token]={token,name,trainer:/^[a-z0-9_-]{1,30}$/.test(e.trainer)?e.trainer:'red',ladder:{},played:0,teams:null,history:[]};}
        for(const other of clients)if(other!==c&&other.player===p){send(other,{t:'elsewhere'});other.ws.close();}
        c.player=p;save();send(c,{t:'welcome',token:p.token,name:p.name,trainer:p.trainer,ladder:Object.fromEntries(['3v3','6v6'].map(f=>[f,rating(p,f)])),played:p.played,teams:p.teams});send(c,{t:'activity',online:clients.size,f:{}});return;
      }
      if(!c.player)throw Error('Entre com seu nome primeiro.');
      if(await rooms.handle(c,e))return;
      if(e.t==='champ')return;
      if(e.t==='teams'){c.player.teams={teams:e.teams,saved:e.saved,at:e.at};save();return;}
      if(e.t==='profile'){if(!/^[\p{L}\p{N} ._'-]{2,16}$/u.test(e.name))throw Error('Nome inválido.');c.player.name=e.name;c.player.trainer=/^[a-z0-9_-]{1,30}$/.test(e.trainer)?e.trainer:'red';save();send(c,{t:'profile',name:e.name,trainer:c.player.trainer});return;}
      if(e.t==='cancel'){removeQueue(c);send(c,{t:'unqueued'});return;}
      if(e.t==='queue'){
        if(c.match)throw Error('Você já está em uma partida.');if(!['3v3','6v6'].includes(e.format))throw Error('Este port suporta 3v3 e 6v6 por enquanto.');if(!['practice','ranked','casual'].includes(e.mode))throw Error('Modo inválido.');
        if(c.room)throw Error('Saia da sala antes de entrar na fila.');removeQueue(c);const team=e.random?randomTeam(e.format==='6v6'?6:3):validateTeam(e.team,e.format==='6v6'?6:3);const entry={c,team,format:e.format,mode:e.mode};
        if(e.mode==='practice'){await startMatch([entry,null],e);return;}
        const i=queue.findIndex(q=>q.format===e.format&&q.mode===e.mode);if(i>=0){const opp=queue.splice(i,1)[0];await startMatch([opp,entry],e);}else{queue.push(entry);send(c,{t:'queued'});}return;
      }
      if(e.t==='ready'&&c.match&&e.id===c.match.id){c.match.ready.add(c);begin(c.match);return;}
      if(e.t==='input'&&c.match&&!c.match.ended){const m=c.match;const side=m.clients.indexOf(c);const allowed=['move','switch','mega','manual','steer','dodge','guard','autoatk','autoguard'];if(!allowed.includes(e.kind))return;const cmd={...e,side,at:m.b.frame};delete cmd.t;delete cmd.slot;if(e.kind==='switch'&&(!Number.isInteger(e.to)||e.to<0||e.to>=m.teams[side].mons.length))return;if(e.kind==='move'&&(typeof e.name!=='string'||e.name.length>80))return;if(e.kind==='steer'&&(!Number.isInteger(e.dir)||e.dir<0||e.dir>8))return;m.inputs.push(cmd);return;}
      if(e.t==='surrender'&&c.match){finish(c.match,1-c.match.clients.indexOf(c),c.match.clients.indexOf(c));return;}
      if(e.t==='history'){send(c,{t:'history',list:c.player.history||[]});return;}
      if(e.t==='board'){send(c,{t:'board',format:e.format,season:seasonOf(),ends:seasonEnds(seasonOf()),rows:Object.values(players).filter(p=>p.ladder[e.format]?.games).map(p=>({name:p.name,trainer:p.trainer,...rating(p,e.format),you:p===c.player})).sort((a,b)=>b.pts-a.pts).slice(0,100)});return;}
      if(['alive','hash','net','clientError','diag','ping'].includes(e.t))return;
      send(c,{t:'error',msg:'Este recurso ainda não está implementado no servidor próprio.'});
    }catch(error){send(c,{t:'error',msg:error.message});}
  });
  ws.on('close',()=>{clients.delete(c);removeQueue(c);rooms.leave(c);if(c.match&&!c.match.ended)finish(c.match,1-c.match.clients.indexOf(c),c.match.clients.indexOf(c));});
});
const argValue = flag => { const at=process.argv.indexOf(flag); return at>=0?process.argv[at+1]:undefined; };
const port=Number(process.env.PORT ?? argValue('--port') ?? 3000);
const host=argValue('--host') || '0.0.0.0';
server.listen(port,host,()=>console.log(`PB port: http://localhost:${server.address().port}`));
