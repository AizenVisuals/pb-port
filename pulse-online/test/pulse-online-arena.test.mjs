// Testes da arena (fase 2c): rotação, fila, bot, placar, WS (PvP) e a
// regressão do `standing` do POST /api/rankings/match (2b: o retorno é
// pós-atualização, igual ao /me).
import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import WebSocket from 'ws';
import {
  rotationForDate, botLevelForPoints, arenaDelta, validateArenaTeam,
  createArenaManager, ROTATION_QUOTAS, BOT_WAIT_MS,
} from '../arena.mjs';
import { openDb, createUser, getUserById, getProfile, upsertProfile } from '../db.mjs';
import { createServer } from '../server.mjs';
import { seasonOf } from '../ranks.mjs';

// Pool de teste: exatamente 50 chaves (12 S + 22 A + 8 B + 8 C) — a rotação
// do dia é o pool inteiro, embaralhado pela data.
function testPool() {
  const pool = [];
  for (const [band, n] of [['S', 12], ['A', 22], ['B', 8], ['C', 8]]) {
    for (let i = 1; i <= n; i++) pool.push({ key: `${band.toLowerCase()}${String(i).padStart(2, '0')}`, band, bst: 500 });
  }
  return { version: 1, source: 'teste', bands: { ...ROTATION_QUOTAS }, pool };
}
const POOL = testPool();
const ROTATION = rotationForDate(POOL, '2026-11-15');
const MOVES = [['Tackle', 'Growl', 'Quick Attack', 'Tail Whip'], ['Tackle', 'Growl', 'Quick Attack', 'Tail Whip'], ['Tackle', 'Growl', 'Quick Attack', 'Tail Whip']];
const teamOf = (keys) => ({ mons: keys, moves: MOVES, gimmick: null });

function makeManager(t = Date.now()) {
  const dir = `/tmp/pulse-arena-mgr-${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
  const db = openDb(dir);
  let nowMs = t;
  const sent = new Map();
  const mgr = createArenaManager({
    db, pool: POOL, now: () => nowMs,
    getUser: (id) => getUserById(db, id),
    getProfile: (id) => getProfile(db, id),
    sendToUser: (userId, msg) => {
      if (!sent.has(userId)) sent.set(userId, []);
      sent.get(userId).push(msg);
    },
  });
  const user = (nick, team = 'valor') => {
    const u = createUser(db, { provider: 'guest', provider_id: null, email: null });
    upsertProfile(db, u.id, { trainer_key: 'ash', nick, team });
    return u.id;
  };
  return { db, dir, mgr, sent, user, setNow: (v) => { nowMs = v; }, now: () => nowMs };
}

// ------------------------------------------------------------------- puro
test('arena: rotação é determinística por data, com as quotas por banda', () => {
  const a = rotationForDate(POOL, '2026-11-15');
  const b = rotationForDate(POOL, '2026-11-15');
  assert.deepEqual(a, b);
  assert.equal(a.length, 50);
  assert.equal(new Set(a).size, 50);
  const byBand = { S: 0, A: 0, B: 0, C: 0 };
  for (const key of a) byBand[key[0].toUpperCase()]++;
  assert.deepEqual(byBand, { S: 12, A: 22, B: 8, C: 8 });
  const c = rotationForDate(POOL, '2026-11-16');
  assert.notDeepEqual(a, c);
  assert.equal(new Set(c).size, 50);
});

test('arena: nível do bot pelos pontos (0-49→2, 50-149→3, 150-299→4, 300+→5)', () => {
  assert.equal(botLevelForPoints(0), 2);
  assert.equal(botLevelForPoints(49), 2);
  assert.equal(botLevelForPoints(50), 3);
  assert.equal(botLevelForPoints(149), 3);
  assert.equal(botLevelForPoints(150), 4);
  assert.equal(botLevelForPoints(299), 4);
  assert.equal(botLevelForPoints(300), 5);
  assert.equal(botLevelForPoints(9999), 5);
});

test('arena: pontos (+20 PvP, +10 bot, -5 com piso 0)', () => {
  assert.equal(arenaDelta({ won: true, vsBot: false, points: 0 }), 20);
  assert.equal(arenaDelta({ won: true, vsBot: true, points: 0 }), 10);
  assert.equal(arenaDelta({ won: false, vsBot: false, points: 100 }), -5);
  assert.equal(arenaDelta({ won: false, vsBot: true, points: 3 }), -3);
  assert.ok(arenaDelta({ won: false, vsBot: false, points: 0 }) === 0); // -0 === 0
});

test('arena: validação do time (3 da rotação, 4 golpes, gimmick)', () => {
  assert.equal(validateArenaTeam(teamOf(ROTATION.slice(0, 3)), ROTATION).ok, true);
  assert.equal(validateArenaTeam({ mons: ROTATION.slice(0, 2), moves: MOVES.slice(0, 2) }, ROTATION).ok, false);
  assert.equal(validateArenaTeam(teamOf([ROTATION[0], ROTATION[0], ROTATION[1]]), ROTATION).ok, false);
  assert.equal(validateArenaTeam(teamOf([ROTATION[0], ROTATION[1], 'não-existe']), ROTATION).ok, false);
  assert.equal(validateArenaTeam({ mons: ROTATION.slice(0, 3), moves: MOVES.map(() => []) }, ROTATION).ok, false);
  assert.equal(validateArenaTeam({ ...teamOf(ROTATION.slice(0, 3)), gimmick: { kind: 'mega', mon: 1 } }, ROTATION).ok, true);
  assert.equal(validateArenaTeam({ ...teamOf(ROTATION.slice(0, 3)), gimmick: { kind: 'mega', mon: 3 } }, ROTATION).ok, false);
});

// ---------------------------------------------------------------- gerente
test('arena: fila casa dois jogadores (FIFO, lado 0 é quem esperou mais)', () => {
  const { db, dir, mgr, user } = makeManager();
  try {
    const a = user('ArenaA');
    const b = user('ArenaB');
    const teamA = teamOf(ROTATION.slice(0, 3));
    const teamB = teamOf(ROTATION.slice(3, 6));
    const qa = mgr.joinQueue(a, teamA);
    assert.equal(qa.ok, true);
    assert.equal(qa.queued, true);
    const qb = mgr.joinQueue(b, teamB);
    assert.equal(qb.ok, true);
    assert.equal(qb.matched, true);
    assert.equal(qb.match.side, 1);
    assert.equal(qb.match.seed, mgr._matches.get(qb.match.match_id).seed);
    assert.equal(qb.match.opponent.user_id, a);
    assert.equal(qb.match.opponent_team.mons[0], teamA.mons[0]);
    const sa = mgr.queueStatus(a);
    assert.equal(sa.match.side, 0);
    assert.equal(sa.match.match_id, qb.match.match_id);
    assert.equal(sa.match.seed, qb.match.seed);
    // Já em partida: não entra na fila de novo.
    assert.equal(mgr.joinQueue(a, teamA).error, 'already_in_match');
  } finally { db.close(); }
});

test('arena: sem adversário em 2 min, o bot entra (nível pelos pontos)', () => {
  const t0 = Date.now();
  const { db, dir, mgr, user, setNow } = makeManager(t0);
  try {
    const a = user('ArenaBot');
    mgr.joinQueue(a, teamOf(ROTATION.slice(0, 3)));
    setNow(t0 + BOT_WAIT_MS - 1000);
    assert.equal(mgr.queueStatus(a).in_queue, true);
    setNow(t0 + BOT_WAIT_MS + 1);
    const st = mgr.queueStatus(a);
    assert.equal(st.in_queue, false);
    assert.equal(st.match.vs_bot, true);
    assert.equal(st.match.bot_level, 2); // 0 pontos → nível 2
    assert.equal(st.match.bot_team.length, 3);
    assert.ok(st.match.bot_team.every((k) => ROTATION.includes(k)));
    assert.ok(!st.match.bot_team.some((k) => teamOf(ROTATION.slice(0, 3)).mons.includes(k)));
    // Com 150 pontos, o bot é nível 4.
    const { db: db2, mgr: mgr2, user: user2, setNow: setNow2 } = makeManager(t0);
    try {
      const c = user2('ArenaBot2');
      mgr2.arenaStanding(c); // cria a linha zerada no placar
      db2.prepare("UPDATE rankings SET points = 150 WHERE user_id = ? AND mode = 'arena'").run(c);
      mgr2.joinQueue(c, teamOf(ROTATION.slice(0, 3)));
      setNow2(t0 + BOT_WAIT_MS + 1);
      assert.equal(mgr2.queueStatus(c).match.bot_level, 4);
    } finally { db2.close(); }
  } finally { db.close(); }
});

test('arena: resultado aplica pontos, é idempotente e o segundo relato não duplica', () => {
  const { db, dir, mgr, user } = makeManager();
  try {
    const a = user('ArenaPts');
    const b = user('ArenaPtsB');
    mgr.joinQueue(a, teamOf(ROTATION.slice(0, 3)));
    const qb = mgr.joinQueue(b, teamOf(ROTATION.slice(3, 6)));
    const matchId = qb.match.match_id;
    // A vence B (PvP): +20 para A, -5 (piso 0) para B.
    const pending=mgr.reportResult({matchId,userId:b,result:'loss'});assert.equal(pending.pending,true);assert.equal(mgr.arenaStanding(a).points,0);
    const r1 = mgr.reportResult({ matchId, userId: a, result: 'win' });
    assert.equal(r1.ok, true);
    assert.equal(r1.delta, 20);
    assert.equal(r1.points_after, 20);
    assert.equal(r1.standing.points, 20);
    assert.equal(r1.standing.wins, 1);
    // Repetir o relato: idempotente, sem duplicar pontos.
    const r2 = mgr.reportResult({ matchId, userId: a, result: 'win' });
    assert.equal(r2.ok, true);
    assert.equal(r2.duplicate, true);
    assert.equal(mgr.arenaStanding(a).points, 20);
    // B perdeu: 0 pontos (piso), 1 derrota.
    const sb = mgr.arenaStanding(b);
    assert.equal(sb.points, 0);
    assert.equal(sb.losses, 1);
    // Ladder e histórico.
    const ladder = mgr.arenaLadder(seasonOf(), 50);
    assert.equal(ladder.rows[0].user_id, a);
    assert.equal(ladder.rows[0].points, 20);
    // Partida desconhecida / não-jogador.
    assert.equal(mgr.reportResult({ matchId: 'não-existe', userId: a, result: 'win' }).error, 'match_not_found');
  } finally { db.close(); }
});

test('arena: vitória contra bot dá +10 e derrota tira 5', () => {
  const t0 = Date.now();
  const { db, dir, mgr, user, setNow } = makeManager(t0);
  try {
    const a = user('ArenaBotPts');
    mgr.joinQueue(a, teamOf(ROTATION.slice(0, 3)));
    setNow(t0 + BOT_WAIT_MS + 1);
    const matchId = mgr.queueStatus(a).match.match_id;
    const win = mgr.reportResult({ matchId, userId: a, result: 'win' });
    assert.equal(win.delta, 10);
    assert.equal(win.points_after, 10);
    // Derrota contra bot: -5.
    mgr.joinQueue(a, teamOf(ROTATION.slice(0, 3)));
    setNow(t0 + 2 * BOT_WAIT_MS + 2);
    const matchId2 = mgr.queueStatus(a).match.match_id;
    const loss = mgr.reportResult({ matchId: matchId2, userId: a, result: 'loss' });
    assert.equal(loss.delta, -5);
    assert.equal(loss.points_after, 5);
  } finally { db.close(); }
});

// ------------------------------------------------------------------- HTTP
async function httpServer() {
  const dir = await mkdtemp(join(tmpdir(), 'pulse-arena-http-'));
  const { server, db } = await createServer({ port: 0, dataDir: dir, firebaseProject: 'pulse-arena-pb', arenaPool: POOL });
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  return { server, db, dir, base: `http://127.0.0.1:${server.address().port}` };
}
async function guest(base, nick) {
  const res = await fetch(`${base}/api/auth/guest`, {
    method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ trainer_key: 'ash', nick, team: 'valor' }),
  });
  const j = await res.json();
  return { token: j.token, userId: j.user_id, auth: { authorization: `Bearer ${j.token}` } };
}

test('arena HTTP: rotação, fila, resultado, ladder e histórico', async () => {
  const { server, db, dir, base } = await httpServer();
  try {
    assert.equal((await fetch(`${base}/api/arena/rotation`)).status, 401);
    const a = await guest(base, 'ArenaHttpA');
    const b = await guest(base, 'ArenaHttpB');
    const rot = await (await fetch(`${base}/api/arena/rotation`, { headers: a.auth })).json();
    assert.equal(rot.pokemon.length, 50);
    assert.equal(new Set(rot.pokemon).size, 50);
    const rot2 = await (await fetch(`${base}/api/arena/rotation`, { headers: b.auth })).json();
    assert.deepEqual(rot2.pokemon, rot.pokemon); // mesmo dia, mesma rotação
    // Time inválido: fora da rotação.
    const bad = await fetch(`${base}/api/arena/queue`, {
      method: 'POST', headers: { ...a.auth, 'content-type': 'application/json' },
      body: JSON.stringify({ team: teamOf(['não-existe', rot.pokemon[1], rot.pokemon[2]]) }),
    });
    assert.equal(bad.status, 400);
    // A entra na fila; B entra e casa.
    const qa = await (await fetch(`${base}/api/arena/queue`, {
      method: 'POST', headers: { ...a.auth, 'content-type': 'application/json' },
      body: JSON.stringify({ team: teamOf(rot.pokemon.slice(0, 3)) }),
    })).json();
    assert.equal(qa.queued, true);
    const qb = await (await fetch(`${base}/api/arena/queue`, {
      method: 'POST', headers: { ...b.auth, 'content-type': 'application/json' },
      body: JSON.stringify({ team: teamOf(rot.pokemon.slice(3, 6)) }),
    })).json();
    assert.equal(qb.matched, true);
    const matchId = qb.match.match_id;
    // Resultado: A vence → +20; ladder e histórico refletem.
    const pending=await(await fetch(`${base}/api/arena/result`,{method:'POST',headers:{...b.auth,'content-type':'application/json'},body:JSON.stringify({match_id:matchId,result:'loss'})})).json();assert.equal(pending.pending,true);
    const res = await (await fetch(`${base}/api/arena/result`, {
      method: 'POST', headers: { ...a.auth, 'content-type': 'application/json' },
      body: JSON.stringify({ match_id: matchId, result: 'win' }),
    })).json();
    assert.equal(res.delta, 20);
    assert.equal(res.points_after, 20);
    const me = await (await fetch(`${base}/api/arena/me`, { headers: a.auth })).json();
    assert.equal(me.points, 20);
    assert.equal(me.wins, 1);
    const ladder = await (await fetch(`${base}/api/arena/ladder`, { headers: a.auth })).json();
    assert.equal(ladder.rows[0].user_id, a.userId);
    assert.equal(ladder.rows[0].points, 20);
    const hist = await (await fetch(`${base}/api/arena/history`, { headers: a.auth })).json();
    assert.equal(hist.matches.length, 1);
    assert.equal(hist.matches[0].result, 'win');
    assert.equal(hist.matches[0].delta, 20);
    // Relato repetido: idempotente.
    const again = await (await fetch(`${base}/api/arena/result`, {
      method: 'POST', headers: { ...a.auth, 'content-type': 'application/json' },
      body: JSON.stringify({ match_id: matchId, result: 'win' }),
    })).json();
    assert.equal(again.duplicate, true);
    assert.equal((await (await fetch(`${base}/api/arena/me`, { headers: a.auth })).json()).points, 20);
    // Partida desconhecida → 404.
    const nf = await fetch(`${base}/api/arena/result`, {
      method: 'POST', headers: { ...a.auth, 'content-type': 'application/json' },
      body: JSON.stringify({ match_id: 'não-existe', result: 'win' }),
    });
    assert.equal(nf.status, 404);
  } finally {
    server.close();
    db.close();
    await rm(dir, { recursive: true, force: true });
  }
});

// ------------------------------------------------------- regressão 2b (6b)
test('ranking: POST /match devolve o standing pós-atualização (igual ao /me)', async () => {
  const { server, db, dir, base } = await httpServer();
  try {
    const a = await guest(base, 'RankRegA');
    const b = await guest(base, 'RankRegB');
    const m = await (await fetch(`${base}/api/rankings/match`, {
      method: 'POST', headers: { ...a.auth, 'content-type': 'application/json' },
      body: JSON.stringify({ result: 'win', opponent_id: b.userId }),
    })).json();
    assert.equal(m.standing.streak, 1);
    assert.equal(m.standing.points, 10);
    assert.equal(m.standing.wins, 1);
    const me = await (await fetch(`${base}/api/rankings/me`, { headers: a.auth })).json();
    assert.equal(me.streak, m.standing.streak);
    assert.equal(me.points, m.standing.points);
    assert.equal(me.wins, m.standing.wins);
  } finally {
    server.close();
    db.close();
    await rm(dir, { recursive: true, force: true });
  }
});

// --------------------------------------------------------------------- WS
function wsClient(base, token) {
  const url = base.replace(/^http/, 'ws') + '/api/arena/ws';
  const ws = new WebSocket(url);
  const msgs = [];
  const waiters = [];
  ws.on('message', (data) => {
    const msg = JSON.parse(data.toString());
    msgs.push(msg);
    for (let i = waiters.length - 1; i >= 0; i--) {
      if (waiters[i].pred(msg)) { waiters[i].resolve(msg); waiters.splice(i, 1); }
    }
  });
  const waitFor = (pred, timeoutMs = 8000) => new Promise((resolve, reject) => {
    const found = msgs.find(pred);
    if (found) return resolve(found);
    const w = { pred, resolve };
    waiters.push(w);
    setTimeout(() => {
      const i = waiters.indexOf(w);
      if (i >= 0) waiters.splice(i, 1);
      reject(new Error(`timeout esperando mensagem ${JSON.stringify(msgs.map((m) => m.t))}`));
    }, timeoutMs);
  });
  const send = (obj) => ws.send(JSON.stringify(obj));
  const open = new Promise((resolve, reject) => {
    ws.on('open', resolve);
    ws.on('error', reject);
  });
  return { ws, msgs, waitFor, send, open };
}

test('arena WS: PvP entre dois clientes (hello, ready, go, tick, input, result, end)', async () => {
  const { server, db, dir, base } = await httpServer();
  const clients = [];
  try {
    const a = await guest(base, 'ArenaWsA');
    const b = await guest(base, 'ArenaWsB');
    const rot = await (await fetch(`${base}/api/arena/rotation`, { headers: a.auth })).json();
    await fetch(`${base}/api/arena/queue`, {
      method: 'POST', headers: { ...a.auth, 'content-type': 'application/json' },
      body: JSON.stringify({ team: teamOf(rot.pokemon.slice(0, 3)) }),
    });
    const qb = await (await fetch(`${base}/api/arena/queue`, {
      method: 'POST', headers: { ...b.auth, 'content-type': 'application/json' },
      body: JSON.stringify({ team: teamOf(rot.pokemon.slice(3, 6)) }),
    })).json();
    const matchId = qb.match.match_id;
    const ca = wsClient(base, a.token);
    const cb = wsClient(base, b.token);
    clients.push(ca, cb);
    await Promise.all([ca.open, cb.open]);
    ca.send({ t: 'hello', token: a.token });
    cb.send({ t: 'hello', token: b.token });
    await Promise.all([ca.waitFor((m) => m.t === 'welcome'), cb.waitFor((m) => m.t === 'welcome')]);
    ca.send({ t: 'join', match_id: matchId });
    cb.send({ t: 'join', match_id: matchId });
    const ma = await ca.waitFor((m) => m.t === 'match');
    const mb = await cb.waitFor((m) => m.t === 'match');
    assert.equal(ma.side, 0);
    assert.equal(mb.side, 1);
    assert.equal(ma.seed, mb.seed);
    ca.send({ t: 'ready', match_id: matchId });
    cb.send({ t: 'ready', match_id: matchId });
    await Promise.all([ca.waitFor((m) => m.t === 'go'), cb.waitFor((m) => m.t === 'go')]);
    // O tick chega após o start (1 s) — os dois recebem o mesmo frame.
    const ta = await ca.waitFor((m) => m.t === 'tick');
    const tb = await cb.waitFor((m) => m.t === 'tick' && m.upTo === ta.upTo);
    assert.ok(ta.upTo > 0);
    assert.equal(tb.upTo, ta.upTo);
    // Input de A aparece no tick de B.
    ca.send({ t: 'input', match_id: matchId, kind: 'move', name: 'Tackle' });
    const relay = await cb.waitFor((m) => m.t === 'tick' && m.inputs.some((i) => i.kind === 'move' && i.side === 0));
    assert.equal(relay.inputs.find((i) => i.kind === 'move').name, 'Tackle');
    // Os dois relatam o vencedor (lado 0) → os dois recebem `end` com o delta.
    ca.send({ t: 'result', match_id: matchId, winner: 0 });
    cb.send({ t: 'result', match_id: matchId, winner: 0 });
    const ea = await ca.waitFor((m) => m.t === 'end');
    const eb = await cb.waitFor((m) => m.t === 'end');
    assert.equal(ea.winner, 0);
    assert.equal(eb.winner, 0);
    assert.equal(ea.delta, 20); // A venceu PvP: +20
    assert.equal(eb.delta, 0); // B já tinha0 pontos: perda real0 por causa do piso.
    const meA = await (await fetch(`${base}/api/arena/me`, { headers: a.auth })).json();
    assert.equal(meA.points, 20);
    const meB = await (await fetch(`${base}/api/arena/me`, { headers: b.auth })).json();
    assert.equal(meB.points, 0);
  } finally {
    for (const c of clients) { try { c.ws.close(); } catch { /* já foi */ } }
    server.close();
    db.close();
    await rm(dir, { recursive: true, force: true });
  }
});

test('arena WS: desistência dá a vitória ao outro lado; sem hello, fecha', async () => {
  const { server, db, dir, base } = await httpServer();
  const clients = [];
  try {
    const a = await guest(base, 'ArenaWsC');
    const b = await guest(base, 'ArenaWsD');
    const rot = await (await fetch(`${base}/api/arena/rotation`, { headers: a.auth })).json();
    await fetch(`${base}/api/arena/queue`, {
      method: 'POST', headers: { ...a.auth, 'content-type': 'application/json' },
      body: JSON.stringify({ team: teamOf(rot.pokemon.slice(0, 3)) }),
    });
    const qb = await (await fetch(`${base}/api/arena/queue`, {
      method: 'POST', headers: { ...b.auth, 'content-type': 'application/json' },
      body: JSON.stringify({ team: teamOf(rot.pokemon.slice(3, 6)) }),
    })).json();
    const matchId = qb.match.match_id;
    const ca = wsClient(base, a.token);
    const cb = wsClient(base, b.token);
    clients.push(ca, cb);
    await Promise.all([ca.open, cb.open]);
    ca.send({ t: 'hello', token: a.token });
    cb.send({ t: 'hello', token: b.token });
    await Promise.all([ca.waitFor((m) => m.t === 'welcome'), cb.waitFor((m) => m.t === 'welcome')]);
    ca.send({ t: 'join', match_id: matchId });
    cb.send({ t: 'join', match_id: matchId });
    await Promise.all([ca.waitFor((m) => m.t === 'match'), cb.waitFor((m) => m.t === 'match')]);
    ca.send({ t: 'ready', match_id: matchId });
    cb.send({ t: 'ready', match_id: matchId });
    await Promise.all([ca.waitFor((m) => m.t === 'go'), cb.waitFor((m) => m.t === 'go')]);
    // A desiste → B vence por WO (+20) e recebe o `end`.
    ca.send({ t: 'surrender', match_id: matchId });
    const eb = await cb.waitFor((m) => m.t === 'end');
    assert.equal(eb.winner, 1);
    assert.equal(eb.forfeit, true);
    assert.equal(eb.delta, 20);
    // Sem hello: o servidor fecha em até 10 s (aqui só verifica que o erro chega).
    const cc = wsClient(base, a.token);
    clients.push(cc);
    await cc.open;
    cc.send({ t: 'join', match_id: matchId });
    const err = await cc.waitFor((m) => m.t === 'error');
    assert.match(err.msg, /hello/i);
  } finally {
    for (const c of clients) { try { c.ws.close(); } catch { /* já foi */ } }
    server.close();
    db.close();
    await rm(dir, { recursive: true, force: true });
  }
});

test('arena: conflicting reports cancel a match without awarding points',()=>{
 const {db,dir,mgr,user}=makeManager();try{const a=user('Report A'),b=user('Report B');mgr.joinQueue(a,teamOf(ROTATION.slice(0,3)));const joined=mgr.joinQueue(b,teamOf(ROTATION.slice(3,6)));const id=joined.match.match_id;assert.equal(mgr.reportResult({matchId:id,userId:a,result:'win'}).pending,true);assert.equal(mgr.arenaStanding(a).points,0);assert.equal(mgr.reportResult({matchId:id,userId:b,result:'win'}).error,'result_mismatch');assert.equal(mgr.arenaStanding(a).points,0);assert.equal(mgr.arenaStanding(b).points,0);assert.equal(db.prepare('SELECT COUNT(*) AS n FROM arena_matches WHERE match_id=?').get(id).n,0);}finally{db.close();}
});

test('arena: roster legality rejects incompatible moves and illegal Mega; low-move Pokémon are playable',()=>{
 const keys=['a','b','c'];const rows=keys.map(key=>({key,moves:['legal'],can_mega:false}));const team={mons:keys,moves:keys.map(()=>['legal']),gimmick:null};assert.equal(validateArenaTeam(team,keys,rows).ok,true);assert.equal(validateArenaTeam({...team,moves:[['wrong'],['legal'],['legal']]},keys,rows).ok,false);assert.equal(validateArenaTeam({...team,gimmick:{kind:'mega',mon:0}},keys,rows).ok,false);
});
