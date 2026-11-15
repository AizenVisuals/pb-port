// Arena Lv100 do PULSE ARENA — rotação diária, fila, bot, ranking próprio e
// batalha PvP em tempo real (relay + relógio de frames do servidor, sem sim
// no servidor: a simulação determinística roda nos dois clientes, como no PB).
//
// Regras decididas nesta fase (documentadas aqui e no README):
// - Rotação: 50 Pokémon por dia, determinísticos pela data (UTC). Todo mundo
//   vê os mesmos 50. Bandas por BST total: S (≥540) 12, A (470–539) 22,
//   B (400–469) 8, C (<400) 8. A rotação do dia é calculada uma vez e guardada
//   em `arena_rotations` (o dia não muda se o pool mudar no meio do dia).
// - Time: o jogador monta o time com 3 dos 50 da rotação. A arena FORNECE os
//   Pokémon no Lv100 — não precisa ter na coleção. É o time da rotação do
//   dia, não o time da coleção. (Decisão: arena acessível a todos e justa —
//   todo mundo escolhe dos mesmos 50.)
// - Formato: 3v3, arena 'stadium', Lv100 (o cliente aplica o nível e os
//   golpes; o servidor só valida a forma do time).
// - Fila: entrar com o time; dois na fila formam a partida (o que esperou
//   mais é o lado 0). Sem adversário em 2 min, o jogador batalha contra um
//   bot balanceado para o nível dele (ver botLevelForPoints).
// - Bot: time de 3 da rotação (semente da partida, sem repetir os do
//   jogador), nível pelo placar de arena do jogador (questão de habilidade).
// - Ranking da arena: placar PRÓPRIO, separado do ladder ranqueado.
//   Vitória contra jogador +20, contra bot +10, derrota -5 (piso 0).
//   Sem tiers, sem bônus de sequência — só pontos, vitórias e derrotas.
//   Temporada mensal, igual à do ranqueado (YYYY-MM, UTC).
// - PvP: o servidor repassa inputs e marca o ritmo (tick de 50 ms, relógio
//   de frames autoritativo). Cada input carrega `at` = frame do servidor na
//   chegada; os dois clientes aplicam os mesmos inputs nos mesmos frames —
//   por isso concordam no vencedor sem o servidor simular. Desistência e
//   desconexão no meio da partida = derrota por WO.
import { getStanding, applyMatchToStanding, getLadder, getLadderRank, getChampionIds } from './db.mjs';
import { seasonOf } from './ranks.mjs';

export const ARENA_FORMAT = '3v3';
export const ARENA_SIZE = 3;
export const ROTATION_SIZE = 50;
export const ROTATION_QUOTAS = Object.freeze({ S: 12, A: 22, B: 8, C: 8 });
export const BOT_WAIT_MS = 120_000; // 2 min na fila → bot
export const QUEUE_TTL_MS = 10 * 60_000; // fila abandonada some em 10 min
export const MATCH_WAIT_TIMEOUT_MS = 15 * 60_000; // partida sem começar expira
export const MATCH_PLAY_TIMEOUT_MS = 20 * 60_000; // partida sem resultado expira
export const READY_TIMEOUT_MS = 60_000; // sem `ready` dos dois em 60 s, corta
export const TICK_MS = 50; // ritmo do relógio de frames (igual ao PB)
export const ARENA_WIN_PVP = 20;
export const ARENA_WIN_BOT = 10;
export const ARENA_LOSS = -5;
export const ARENA_SEASON = seasonOf;

// ------------------------------------------------------------------- puro
// Hash FNV-1a (32 bits) — semente determinística a partir da data.
export function fnv1a(str) {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

// PRNG mulberry32 — o mesmo gerador do cliente (battle.js `seeded`).
export function mulberry32(seed) {
  let n = seed >>> 0 || 1;
  return () => {
    n ^= n << 13; n ^= n >>> 17; n ^= n << 5;
    return (n >>> 0) / 4294967296;
  };
}

// Dia (UTC) de um instante, "YYYY-MM-DD".
export function dateKey(now = Date.now()) {
  return new Date(now).toISOString().slice(0, 10);
}

// Fim do dia (UTC) em ms: 00:00 do dia seguinte.
export function dayEnds(dateStr) {
  return Date.parse(`${dateStr}T00:00:00Z`) + 24 * 3600 * 1000;
}

// Embaralha com o PRNG dado (Fisher-Yates, sem mutar o original).
export function shuffled(list, rand) {
  const arr = [...list];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// Rotação do dia: 50 chaves, determinística pela data. `pool` = o conteúdo
// de arena-pool.json ({bands:{S,A,B,C}, pool:[{key,band}]}). A ordem é por
// banda (S, A, B, C) para a tela agrupar os mais fortes primeiro.
export function rotationForDate(pool, dateStr) {
  const seed = fnv1a(`pulse-arena:${dateStr}`);
  const out = [];
  for (const band of ['S', 'A', 'B', 'C']) {
    const quota = ROTATION_QUOTAS[band];
    const keys = pool.pool.filter((p) => p.band === band).map((p) => p.key);
    const rand = mulberry32(seed ^ fnv1a(band));
    out.push(...shuffled(keys, rand).slice(0, quota));
  }
  return out;
}

// Nível do bot pelo placar de arena do jogador (habilidade): 0–49 → 2,
// 50–149 → 3, 150–299 → 4, 300+ → 5. (O motor usa `level` para a IA do bot;
// nível 1 é fácil demais para a arena, nível 5 é o teto.)
export function botLevelForPoints(points = 0) {
  const p = Number.isFinite(points) ? Math.max(0, Math.floor(points)) : 0;
  if (p >= 300) return 5;
  if (p >= 150) return 4;
  if (p >= 50) return 3;
  return 2;
}

// Pontos da arena: vitória contra jogador +20, contra bot +10, derrota -5
// (piso 0). Sem bônus de sequência, sem tiers.
export function arenaDelta({ won, vsBot, points = 0 }) {
  if (won) return vsBot ? ARENA_WIN_BOT : ARENA_WIN_PVP;
  return Math.max(-points, ARENA_LOSS);
}

// Time do bot: 3 da rotação (semente da partida), sem repetir os do jogador.
export function botTeamForMatch(rotation, seed, excludeMons = []) {
  const exclude = new Set(excludeMons);
  const eligible = rotation.filter((k) => !exclude.has(k));
  return shuffled(eligible, mulberry32(seed ^ 0x9e3779b9)).slice(0, ARENA_SIZE);
}

// Valida o time da arena: 3 chaves distintas, todas na rotação do dia;
// golpes = 4 strings por Pokémon (a legalidade é do motor, no cliente —
// `normalizeTeam` filtra para os golpes legais de forma determinística nos
// dois lados); gimmick só Mega num dos 3 (o motor anula se não puder).
export function validateArenaTeam(team, rotationKeys, poolRows = []) {
  const errors = [];
  const rotation = new Set(rotationKeys);
  if (team == null || typeof team !== 'object' || Array.isArray(team)) {
    return { ok: false, errors: ['time deve ser um objeto'], value: null };
  }
  const mons = team.mons;
  if (!Array.isArray(mons) || mons.length !== ARENA_SIZE || new Set(mons).size !== ARENA_SIZE) {
    errors.push(`escolha ${ARENA_SIZE} Pokémon diferentes`);
  } else {
    for (const key of mons) {
      if (typeof key !== 'string' || !rotation.has(key)) errors.push(`Pokémon fora da rotação do dia: ${String(key).slice(0, 40)}`);
    }
  }
  const moves = team.moves;
  if (!Array.isArray(moves) || moves.length !== ARENA_SIZE) {
    errors.push(`envie de 1 a 4 golpes por Pokémon (${ARENA_SIZE} listas)`);
  } else {
    for (let i = 0; i < ARENA_SIZE; i++) {
      const list = moves[i];
      if (!Array.isArray(list) || list.length < 1 || list.length > 4 || list.some((m) => typeof m !== 'string' || !m)) {
        errors.push(`Pokémon ${i + 1}: envie de 1 a 4 golpes`);
      }
    }
  }
  let gimmick = null;
  if (team.gimmick != null) {
    if (team.gimmick.kind === 'mega' && Number.isInteger(team.gimmick.mon) && team.gimmick.mon >= 0 && team.gimmick.mon < ARENA_SIZE) {
      gimmick = { kind: 'mega', mon: team.gimmick.mon };
    } else {
      errors.push('gimmick inválido (só Mega em um dos 3)');
    }
  }
  const byKey=new Map(poolRows.map(row=>[row.key,row]));
  if(Array.isArray(mons)&&Array.isArray(moves))for(let i=0;i<mons.length;i++){
    const row=byKey.get(mons[i]);
    if(row?.moves&&Array.isArray(moves[i])&&(moves[i].length!==Math.min(4,row.moves.length)||new Set(moves[i]).size!==moves[i].length||moves[i].some(id=>!row.moves.includes(id))))errors.push('Golpe incompatível com o Pokémon.');
  }
  if(gimmick&&byKey.get(mons?.[gimmick.mon])?.can_mega===false)errors.push('Este Pokémon não possui Mega.');
  if (errors.length) return { ok: false, errors, value: null };
  return { ok: true, errors: [], value: { mons: [...mons], moves: moves.map((m) => [...m]), gimmick } };
}

// ------------------------------------------------------------------- gerente
// Estado em memória (fila e partidas): some se o servidor reiniciar — a
// fila é efêmera por desenho e o cliente rebusca; o resultado e o placar
// vivem no SQLite e sobrevivem ao reinício.
export function createArenaManager({ db, pool, randomSeed, getUser, getProfile, sendToUser, now = Date.now }) {
  const queue = new Map(); // userId -> {team, joinedAt}
  const matches = new Map(); // matchId -> match
  const userMatch = new Map(); // userId -> matchId (só partidas ativas)
  const sockets = new Map(); // userId -> socket (WS da arena)
  const seedOf = randomSeed || (() => Math.floor(Math.random() * 0x100000000));

  function rotationRow(dateStr) {
    const row = db.prepare('SELECT pokemon FROM arena_rotations WHERE date = ?').get(dateStr);
    if (row) return JSON.parse(row.pokemon);
    const pokemon = rotationForDate(pool, dateStr);
    db.prepare('INSERT INTO arena_rotations (date, pokemon) VALUES (?,?)').run(dateStr, JSON.stringify(pokemon));
    return pokemon;
  }

  function getRotation(dateStr = dateKey(now())) {
    const pokemon = rotationRow(dateStr);
    return { date: dateStr, pokemon, ends_at: dayEnds(dateStr), season: seasonOf(now()) };
  }

  function publicOpponent(match, side) {
    if (match.vsBot) return { user_id: null, nick: 'Bot Arena', trainer_key: 'blue', bot: true };
    const otherId = match.players[1 - side];
    const p = getProfile(otherId);
    return { user_id: otherId, nick: p?.nick ?? 'Treinador', trainer_key: p?.trainer_key ?? 'red', bot: false };
  }

  function matchView(match, side) {
    return {
      match_id: match.id,
      side,
      seed: match.seed,
      arena: match.arena,
      format: match.format,
      status: match.status,
      created_at: match.createdAt,
      vs_bot: match.vsBot,
      bot_level: match.botLevel,
      opponent: publicOpponent(match, side),
      team: match.teams[side],
      opponent_team: match.vsBot ? null : match.teams[1 - side],
      bot_team: match.vsBot ? match.botTeam : null,
    };
  }

  function activeMatchOf(userId) {
    const id = userMatch.get(userId);
    if (!id) return null;
    const m = matches.get(id);
    if (!m || m.status === 'done' || m.status === 'cancelled') return null;
    return m;
  }

  function cancelMatch(match, reason) {
    if (match.status === 'done' || match.status === 'cancelled') return;
    match.status = 'cancelled';
    stopTick(match);
    clearTimeout(match.loadTimeout);
    for (const userId of match.players) {
      if (!userId) continue;
      userMatch.delete(userId);
      sendToUser(userId, { t: 'cancelled', match_id: match.id, reason });
    }
    matches.delete(match.id);
  }

  function makeMatch(a, b) {
    // a = quem esperava mais (lado 0); b = quem entrou agora (lado 1) ou null (bot).
    const id = `arena-${Date.now().toString(36)}-${Math.floor(Math.random() * 0x10000).toString(16)}`;
    const seed = seedOf();
    const match = {
      id, seed, arena: 'stadium', format: ARENA_FORMAT,
      players: [a.userId, b ? b.userId : null],
      teams: [a.team, b ? b.team : null],
      vsBot: !b,
      botTeam: null, botLevel: null,
      status: 'waiting', createdAt: now(), startedAt: null,
      frame: 0, inputs: [], ready: new Set(), reports: new Map(),
      winner: null, decidedBy: null, timer: null, loadTimeout: null,
    };
    if (!b) {
      const standing = getStanding(db, a.userId, 'arena', seasonOf(now()));
      match.botLevel = botLevelForPoints(standing.points);
      match.botTeam = botTeamForMatch(getRotation().pokemon, seed, a.team.mons);
    }
    match.loadTimeout=setTimeout(()=>{if(match.status==='waiting'||match.status==='ready')cancelMatch(match,'load_timeout');},READY_TIMEOUT_MS);
    match.loadTimeout.unref?.();
    matches.set(id, match);
    userMatch.set(a.userId, id);
    if (b) userMatch.set(b.userId, id);
    queue.delete(a.userId);
    if (b) queue.delete(b.userId);
    return match;
  }

  // Varre a fila: quem esperou 2 min sem adversário ganha o bot.
  function sweepBot(nowMs = now()) {
    for (const [userId, entry] of [...queue.entries()]) {
      if (nowMs - entry.joinedAt >= BOT_WAIT_MS) {
        const match = makeMatch({ userId, team: entry.team });
        sendToUser(userId, { t: 'match', ...matchView(match, 0) });
      }
    }
  }

  // Limpeza: fila abandonada (10 min sem o cliente consultar) e partidas
  // paradas (15 min esperando, 20 min jogando sem resultado).
  function sweep(nowMs = now()) {
    sweepBot(nowMs);
    for (const [userId, entry] of [...queue.entries()]) {
      if (nowMs - (entry.lastSeenAt ?? entry.joinedAt) >= QUEUE_TTL_MS) queue.delete(userId);
    }
    for (const match of [...matches.values()]) {
      if (match.status === 'waiting' && nowMs - match.createdAt >= MATCH_WAIT_TIMEOUT_MS) {
        cancelMatch(match, 'timeout');
      } else if (match.status === 'playing' && match.startedAt && nowMs - match.startedAt >= MATCH_PLAY_TIMEOUT_MS) {
        cancelMatch(match, 'timeout');
      }
    }
  }

  function joinQueue(userId, team, nowMs = now()) {
    if (activeMatchOf(userId)) return { ok: false, error: 'already_in_match' };
    const rotation = getRotation();
    const v = validateArenaTeam(team, rotation.pokemon, pool.pool);
    if (!v.ok) return { ok: false, error: 'invalid_team', details: v.errors };
    const existing = queue.get(userId);
    if (existing) {
      existing.team = v.value;
      existing.lastSeenAt = nowMs;
      return { ok: true, queued: true, position: queuePosition(userId), waited_ms: nowMs - existing.joinedAt };
    }
    // Adversário: quem espera há mais tempo (FIFO). Entradas sem consulta
    // há mais de 30 s são de clientes que fecharam o jogo — não casam.
    let oldest = null;
    for (const [otherId, entry] of [...queue.entries()]) {
      if (otherId === userId) continue;
      if (nowMs - (entry.lastSeenAt ?? entry.joinedAt) > 30_000) { queue.delete(otherId); continue; }
      if (!oldest || entry.joinedAt < oldest.entry.joinedAt) oldest = { userId: otherId, entry };
    }
    if (oldest) {
      const match = makeMatch({ userId: oldest.userId, team: oldest.entry.team }, { userId, team: v.value });
      sendToUser(oldest.userId, { t: 'match', ...matchView(match, 0) });
      return { ok: true, matched: true, match: matchView(match, 1) };
    }
    queue.set(userId, { team: v.value, joinedAt: nowMs, lastSeenAt: nowMs });
    return { ok: true, queued: true, position: 1, waited_ms: 0 };
  }

  function queuePosition(userId) {
    const entries = [...queue.entries()].sort((a, b) => a[1].joinedAt - b[1].joinedAt);
    const i = entries.findIndex(([id]) => id === userId);
    return i < 0 ? null : i + 1;
  }

  function queueStatus(userId, nowMs = now()) {
    const match = activeMatchOf(userId);
    if (match) {
      const side = match.players.indexOf(userId);
      return { ok: true, in_queue: false, match: matchView(match, side) };
    }
    const entry = queue.get(userId);
    if (!entry) return { ok: true, in_queue: false, match: null };
    entry.lastSeenAt = nowMs; // o cliente consulta a cada ~2 s enquanto espera
    // Quem esperou 2 min ganha o bot na hora da consulta.
    if (nowMs - entry.joinedAt >= BOT_WAIT_MS) {
      const m = makeMatch({ userId, team: entry.team });
      sendToUser(userId, { t: 'match', ...matchView(m, 0) });
      return { ok: true, in_queue: false, match: matchView(m, 0) };
    }
    return {
      ok: true, in_queue: true, match: null,
      position: queuePosition(userId), waited_ms: nowMs - entry.joinedAt,
      bot_in_ms: BOT_WAIT_MS - (nowMs - entry.joinedAt),
    };
  }

  function leaveQueue(userId) {
    const match = activeMatchOf(userId);
    if (match && match.status === 'waiting') {
      cancelMatch(match, 'left');
      return { ok: true, left: true };
    }
    if (match) return { ok: false, error: 'match_in_progress' };
    const had = queue.delete(userId);
    return { ok: true, left: had };
  }

  // ---------------------------------------------------------- placar
  function standingView(row, season) {
    return {
      mode: 'arena', points: row.points, wins: row.wins, losses: row.losses,
      games: row.wins + row.losses, streak: row.streak, season,
      ladder_rank: getLadderRank(db, row.user_id, 'arena', season),
    };
  }

  function arenaStanding(userId, season = seasonOf(now())) {
    return standingView(getStanding(db, userId, 'arena', season), season);
  }

  function arenaLadder(season = seasonOf(now()), limit = 50) {
    const rows = getLadder(db, 'arena', season, limit);
    return {
      season,
      rows: rows.map((r, i) => ({
        rank: i + 1, user_id: r.user_id, nick: r.nick, trainer_key: r.trainer_key,
        team: r.team, points: r.points, wins: r.wins, losses: r.losses, games: r.wins + r.losses,
      })),
    };
  }

  // PvP exige relatos coincidentes dos dois jogadores; divergência anula sem pontos.
  // Idempotente: se a partida já foi decidida (e saiu da memória), o relato
  // repetido devolve o resultado registrado em vez de erro — o cliente pode
  // tentar de novo sem medo de duplicar pontos.
  function reportResult({ matchId, userId, result }) {
    const match = matches.get(matchId);
    if (!match) {
      const recorded = db.prepare(
        `SELECT result, delta, points_before, points_after FROM arena_matches
         WHERE match_id = ? AND user_id = ? ORDER BY created_at DESC LIMIT 1`
      ).get(matchId, userId);
      if (recorded) {
        return {
          ok: true, duplicate: true, match_id: matchId,
          delta: recorded.delta, points_before: recorded.points_before,
          points_after: recorded.points_after, standing: arenaStanding(userId),
        };
      }
      return { ok: false, error: 'match_not_found' };
    }
    if (!match.players.includes(userId)) return { ok: false, error: 'not_a_player' };
    if (match.status === 'done') return { ok: false, error: 'match_decided' };
    if (match.status === 'cancelled') return { ok: false, error: 'match_cancelled' };
    if (result !== 'win' && result !== 'loss') return { ok: false, error: 'invalid_result' };
    const side = match.players.indexOf(userId);
    const won = result === 'win';
    const winner = won ? side : 1 - side;
    const prior=match.reports.get(userId);
    if(prior)return {ok:true,duplicate:true,pending:true,match_id:matchId};
    match.reports.set(userId,{winner});
    if(!match.vsBot){
      if(match.reports.size<2)return {ok:true,pending:true,match_id:matchId};
      const reports=[...match.reports.values()];
      if(reports.some(r=>r.winner!==winner)){cancelMatch(match,'result_mismatch');return {ok:false,error:'result_mismatch'};}
    }
    return finalizeMatch(match,winner,userId,{decidedBy:match.vsBot?'bot_report':'matching_reports'});
  }

  function finalizeMatch(match, winner, reporterId, { decidedBy = 'report', forfeit = false } = {}) {
    if (match.status === 'done') return { ok: true, duplicate: true, match_id: match.id, winner: match.winner };
    match.status = 'done';
    match.winner = winner;
    match.decidedBy = decidedBy;
    stopTick(match);
    clearTimeout(match.loadTimeout);
    const season = seasonOf(now());
    const nowMs = now();
    const outcomes = [];
    for (let side = 0; side < 2; side++) {
      const userId = match.players[side];
      if (!userId) continue; // lado do bot não tem conta
      const won = side === winner;
      const vsBot = match.vsBot;
      const before = getStanding(db, userId, 'arena', season, nowMs);
      const delta = arenaDelta({ won, vsBot, points: before.points });
      const after = applyMatchToStanding(db, userId, 'arena', season, {
        pts: Math.max(0, before.points + delta), streak: won ? before.streak + 1 : 0, won, tier: 'Arena',
      }, nowMs);
      const opponentId = match.vsBot ? null : match.players[1 - side];
      const opponentNick = match.vsBot ? 'Bot Arena' : (getProfile(opponentId)?.nick ?? null);
      db.prepare(
        `INSERT INTO arena_matches
         (id, match_id, user_id, opponent_id, opponent_nick, result, delta,
          points_before, points_after, vs_bot, season, created_at)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`
      ).run(
        `am-${match.id}-${side}`, match.id, userId, opponentId, opponentNick,
        won ? 'win' : 'loss', delta, before.points, after.points, vsBot ? 1 : 0, season, nowMs,
      );
      outcomes.push({ user_id: userId, side, won, delta, points_before: before.points, points_after: after.points, standing: standingView(after, season) });
      userMatch.delete(userId);
    }
    matches.delete(match.id);
    const mine = outcomes.find((o) => o.user_id === reporterId);
    for (const userId of match.players) {
      if (!userId) continue;
      const o = outcomes.find((x) => x.user_id === userId);
      sendToUser(userId, {
        t: 'end', match_id: match.id, winner, forfeit,
        delta: o?.delta ?? 0, points_after: o?.points_after ?? null, standing: o?.standing ?? null,
      });
    }
    return {
      ok: true, match_id: match.id, winner, forfeit,
      delta: mine?.delta ?? 0, points_before: mine?.points_before ?? 0,
      points_after: mine?.points_after ?? 0, standing: mine?.standing ?? null,
    };
  }

  // ---------------------------------------------------------- WS (PvP)
  function attachSocket(userId, socket) {
    sockets.set(userId, socket);
  }

  function detachSocket(userId) {
    if (sockets.get(userId)) sockets.delete(userId);
    const match = activeMatchOf(userId);
    if (match && (match.status === 'playing' || match.status === 'ready')) {
      // Desconexão no meio da partida = derrota por WO.
      const side = match.players.indexOf(userId);
      finalizeMatch(match, 1 - side, userId, { decidedBy: 'disconnect', forfeit: true });
    }
  }

  function handleSocketMessage(userId, msg) {
    if (!msg || typeof msg !== 'object') return;
    switch (msg.t) {
      case 'hello': {
        sendToUser(userId, { t: 'welcome', user_id: userId });
        return;
      }
      case 'join': {
        const match = matches.get(msg.match_id);
        if (!match || !match.players.includes(userId)) {
          sendToUser(userId, { t: 'error', match_id: msg.match_id, msg: 'Partida não encontrada.' });
          return;
        }
        const side = match.players.indexOf(userId);
        sendToUser(userId, { t: 'match', ...matchView(match, side) });
        return;
      }
      case 'ready': {
        const match = matches.get(msg.match_id);
        if (!match || !match.players.includes(userId)) return;
        if (match.vsBot) {
          // Bot não precisa de `ready`: a partida já pode começar.
          match.ready.add(userId);
          beginMatch(match);
          return;
        }
        match.ready.add(userId);
        if (match.players.every((p) => p && match.ready.has(p))) beginMatch(match);
        return;
      }
      case 'input': {
        const match = matches.get(msg.match_id);
        if (!match || match.status !== 'playing' || !match.players.includes(userId)) return;
        const side = match.players.indexOf(userId);
        const allowed = ['move', 'switch', 'mega', 'manual', 'steer', 'dodge', 'guard', 'autoatk', 'autoguard'];
        if (!allowed.includes(msg.kind)) return;
        if (msg.kind === 'switch' && (!Number.isInteger(msg.to) || msg.to < 0 || msg.to >= ARENA_SIZE)) return;
        if (msg.kind === 'move' && (typeof msg.name !== 'string' || !msg.name || msg.name.length > 80)) return;
        if (msg.kind === 'steer' && (!Number.isInteger(msg.dir) || msg.dir < 0 || msg.dir > 8)) return;
        if (['manual','autoatk','autoguard'].includes(msg.kind) && typeof msg.on !== 'boolean') return;
        if (match.inputs.filter(input=>input.side===side).length >= 32) return;
        const input={kind:msg.kind,side,at:match.frame};
        for(const key of ['name','to','dir','on'])if(msg[key]!==undefined)input[key]=msg[key];
        match.inputs.push(input);
        return;
      }
      case 'result': {
        const match = matches.get(msg.match_id);
        if (!match || !match.players.includes(userId)) return;
        const side = match.players.indexOf(userId);
        const winner = Number.isInteger(msg.winner) && (msg.winner === 0 || msg.winner === 1) ? msg.winner : null;
        if (winner === null) return;
        const result=reportResult({matchId:match.id,userId,result:winner===side?'win':'loss'});
        if(!result.ok)sendToUser(userId,{t:'error',msg:result.error});
        return;
      }
      case 'surrender': {
        const match = matches.get(msg.match_id);
        if (!match || !match.players.includes(userId)) return;
        const side = match.players.indexOf(userId);
        finalizeMatch(match, 1 - side, userId, { decidedBy: 'surrender', forfeit: true });
        return;
      }
      case 'ping': {
        sendToUser(userId, { t: 'pong' });
        return;
      }
      default:
        return;
    }
  }

  function beginMatch(match) {
    if (match.status !== 'waiting' && match.status !== 'ready') return;
    match.status = 'ready';
    clearTimeout(match.loadTimeout);
    match.loadTimeout = setTimeout(() => {
      if (match.status === 'ready') cancelMatch(match, 'load_timeout');
    }, READY_TIMEOUT_MS);
    // A partida só começa de fato quando os dois mandam `ready` (PvP) ou
    // quando o jogador manda `ready` (bot). O `go` marca o relógio.
    if (match.vsBot || match.players.every((p) => p && match.ready.has(p))) {
      clearTimeout(match.loadTimeout);
      match.status = 'playing';
      match.startedAt = now() + 1000;
      match.frame = 0;
      for (const userId of match.players) {
        if (userId) sendToUser(userId, { t: 'go', match_id: match.id, start_in_ms: 1000 });
      }
      match.timer = setInterval(() => tickMatch(match), TICK_MS);
      if (match.timer.unref) match.timer.unref();
    }
  }

  function tickMatch(match) {
    if (match.status !== 'playing') return;
    const target = Math.floor((now() - match.startedAt) * 60 / 1000);
    if (target <= match.frame) return;
    const inputs = match.inputs.splice(0);
    match.frame = target;
    for (const userId of match.players) {
      if (userId) sendToUser(userId, { t: 'tick', match_id: match.id, upTo: target, inputs });
    }
  }

  function stopTick(match) {
    if (match.timer) { clearInterval(match.timer); match.timer = null; }
  }

  return {
    getRotation, joinQueue, queueStatus, leaveQueue, sweep,
    arenaStanding, arenaLadder, reportResult, finalizeMatch,
    attachSocket, detachSocket, handleSocketMessage, beginMatch,
    // Expostos para os testes:
    _queue: queue, _matches: matches, _rotationForDate: rotationForDate,
  };
}
