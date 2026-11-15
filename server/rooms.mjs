import{randomBytes}from'node:crypto';
export function createRooms({send,validateTeam,startMatch,removeQueue}){
 const rooms=new Map();
 const broadcast=r=>r.seats.forEach((c,you)=>{if(c)send(c,{t:'room',room:{code:r.code,format:r.format,arena:r.arena,you,isHost:you===r.host,seats:r.seats.map(x=>x?{name:x.player.name,trainer:x.player.trainer,online:true,ready:!!x.roomReady,hasTeam:!!x.roomTeam}:null),score:r.score,wins:r.wins,battle:r.battle,watchers:0}})});
 function leave(c){const r=c.room;if(!r)return;c.room=null;c.roomReady=false;c.roomTeam=null;const at=r.seats.indexOf(c);if(at>=0)r.seats[at]=null;send(c,{t:'room',room:null});if(r.seats.every(x=>!x))rooms.delete(r.code);else{if(!r.seats[r.host])r.host=r.seats.findIndex(Boolean);broadcast(r);}}
 async function handle(c,e){if(!e.t.startsWith('room'))return false;
 try{if(c.match)throw Error('Termine a partida antes de alterar a sala.');
 if(e.t==='roomCreate'){if(!['3v3','6v6'].includes(e.format))throw Error('Formato indisponível.');leave(c);removeQueue(c);let code;do{code=randomBytes(3).toString('hex').toUpperCase()}while(rooms.has(code));const r={code,format:e.format,arena:e.arena,seats:[c,null],host:0,score:[0,0],wins:[],battle:false};rooms.set(code,r);c.room=r;broadcast(r);return true;}
 if(e.t==='roomJoin'){const r=rooms.get(String(e.code).toUpperCase());if(!r)throw Error('Sala não encontrada.');if(c.room===r){broadcast(r);return true;}if(r.battle||r.seats.every(Boolean))throw Error('Sala cheia: esta versão aceita dois jogadores.');leave(c);removeQueue(c);c.room=r;r.seats[r.seats.findIndex(x=>!x)]=c;broadcast(r);return true;}
 if(e.t==='roomLeave'){leave(c);return true;}const r=c.room;if(!r)throw Error('Entre em uma sala primeiro.');
 if(e.t==='roomFormat'||e.t==='roomArena'){if(r.seats[r.host]!==c)throw Error('Só o anfitrião pode alterar a sala.');if(e.t==='roomFormat'){if(!['3v3','6v6'].includes(e.format))throw Error('Formato indisponível.');r.format=e.format;}else r.arena=e.arena;for(const x of r.seats)if(x){x.roomReady=false;x.roomTeam=null;}}
 else if(e.t==='roomTeam'){c.roomTeam=validateTeam(e.team,r.format==='6v6'?6:3);c.roomReady=false;}
 else if(e.t==='roomReady'){if(e.ready&&!c.roomTeam)throw Error('Escolha sua equipe.');c.roomReady=!!e.ready;if(r.seats.every(x=>x?.roomReady)&&!r.battle){r.battle=true;broadcast(r);await startMatch(r.seats.map(c=>({c,team:c.roomTeam})),{format:r.format,arena:r.arena,mode:'friendly'});const m=r.seats[0]?.match;if(!m){r.battle=false;for(const x of r.seats)if(x)x.roomReady=false;broadcast(r);}else m.room=r;return true;}}
 else throw Error('Ação de sala indisponível.');broadcast(r);
 }catch(error){send(c,{t:'roomError',msg:error.message});}return true;}
 function finish(m,winner){const r=m.room;if(!r)return;r.battle=false;r.score[winner]++;r.wins.unshift({winner:m.teams[winner].name});r.wins.length=Math.min(r.wins.length,5);for(const c of r.seats)if(c)c.roomReady=false;broadcast(r);}
 return{handle,leave,finish};
}
