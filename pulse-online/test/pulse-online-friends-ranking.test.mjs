// Testes de amizades + ranking ranqueado do pulse-online (fase 2b).
// Cobre: matemática do ranking (port de public/ranks.js), fluxo de amizade
// (pedido/aceite/recusa/expiração/cooldown/pedido mútuo/remover/presença),
// ladder, histórico, endpoint de match e 401 sem token.
import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { rankOf, score, seasonOf, seasonEnds, championCount } from '../ranks.mjs';
import { openDb, getStanding } from '../db.mjs';
import { createServer } from '../server.mjs';

const PROJECT = 'pulse-arena-pb';
const DAY = 24 * 3600 * 1000;

// ---------------------------------------------------------------- ranks (port do PB)
test('ranks: rankOf nas fronteiras de tier/divisão', () => {
  assert.deepEqual(rankOf(0), { tier: 'Beginner', rank: 4, name: 'Beginner 4', floor: 0, lo: 0, hi: 15, next: 'Beginner 3' });
  assert.equal(rankOf(14).name, 'Beginner 4');
  assert.equal(rankOf(15).name, 'Beginner 3');
  assert.equal(rankOf(34).name, 'Beginner 3');
  assert.equal(rankOf(35).name, 'Beginner 2');
  assert.equal(rankOf(59).name, 'Beginner 2');
  assert.equal(rankOf(60).name, 'Beginner 1');
  assert.equal(rankOf(89).name, 'Beginner 1');
  assert.equal(rankOf(89).next, 'Poké Ball 4');
  assert.equal(rankOf(90).name, 'Poké Ball 4');
  assert.equal(rankOf(119).name, 'Poké Ball 4');
  assert.equal(rankOf(185).name, 'Poké Ball 1');
  assert.equal(rankOf(220).name, 'Great Ball 4');
  assert.equal(rankOf(345).name, 'Great Ball 1');
  assert.equal(rankOf(390).name, 'Ultra Ball 4');
  assert.equal(rankOf(545).name, 'Ultra Ball 1');
  assert.equal(rankOf(545).next, 'Master Ball');
  assert.equal(rankOf(599).name, 'Ultra Ball 1');
  assert.deepEqual(rankOf(600), { tier: 'Master Ball', rank: null, name: 'Master Ball', floor: 600, lo: 600, hi: null, next: 'Champion' });
  assert.equal(rankOf(999).tier, 'Master Ball');
  assert.equal(rankOf(600, true).tier, 'Champion');
  assert.equal(rankOf(600, true).name, 'Champion');
  assert.equal(rankOf(600, true).next, null);
  assert.equal(rankOf(599, true).tier, 'Ultra Ball'); // Champion só a partir de 600
});

test('ranks: score — vitórias, bônus de sequência, bot, derrota e piso', () => {
  // Vitórias seguidas: +10, +13, +16, +19, +22, +22 (cap do bônus em +12).
  let s = { pts: 0, streak: 0 };
  s = score(s, true, false);
  assert.deepEqual(s, { pts: 10, streak: 1, delta: 10, bonus: 0 });
  s = score(s, true, false);
  assert.deepEqual(s, { pts: 23, streak: 2, delta: 13, bonus: 3 });
  s = score(s, true, false);
  assert.deepEqual(s, { pts: 39, streak: 3, delta: 16, bonus: 6 });
  s = score(s, true, false);
  assert.deepEqual(s, { pts: 58, streak: 4, delta: 19, bonus: 9 });
  s = score(s, true, false);
  assert.deepEqual(s, { pts: 80, streak: 5, delta: 22, bonus: 12 });
  s = score(s, true, false);
  assert.deepEqual(s, { pts: 102, streak: 6, delta: 22, bonus: 12 });
  // Derrota zera a sequência e cobra a taxa do tier (Poké Ball: 5).
  s = score(s, false, false);
  assert.deepEqual(s, { pts: 97, streak: 0, delta: -5, bonus: 0 });
  // Piso do tier: não cai abaixo de 90 em Poké Ball.
  assert.deepEqual(score({ pts: 92, streak: 2 }, false, false), { pts: 90, streak: 0, delta: -2, bonus: 0 });
  assert.deepEqual(score({ pts: 90, streak: 0 }, false, false), { pts: 90, streak: 0, delta: 0, bonus: 0 });
  // Beginner não paga taxa.
  assert.deepEqual(score({ pts: 10, streak: 1 }, false, false), { pts: 10, streak: 0, delta: 0, bonus: 0 });
  // Ultra Ball: taxa 7, piso 390.
  assert.deepEqual(score({ pts: 395, streak: 0 }, false, false), { pts: 390, streak: 0, delta: -5, bonus: 0 });
  assert.deepEqual(score({ pts: 400, streak: 0 }, false, false), { pts: 393, streak: 0, delta: -7, bonus: 0 });
  // Master: taxa 10, piso 600.
  assert.deepEqual(score({ pts: 615, streak: 3 }, false, false), { pts: 605, streak: 0, delta: -10, bonus: 0 });
  assert.deepEqual(score({ pts: 605, streak: 0 }, false, false), { pts: 600, streak: 0, delta: -5, bonus: 0 });
  // Vitória contra bot: +5, sem mexer na sequência; 0 se já for Master+.
  assert.deepEqual(score({ pts: 20, streak: 2 }, true, true), { pts: 25, streak: 2, delta: 5, bonus: 0 });
  assert.deepEqual(score({ pts: 610, streak: 3 }, true, true), { pts: 610, streak: 3, delta: 0, bonus: 0 });
});

test('ranks: temporada e Champion', () => {
  assert.equal(seasonOf(Date.UTC(2026, 0, 15)), '2026-11'); // antes da 1ª: trava em 2026-11
  assert.equal(seasonOf(Date.UTC(2026, 10, 15)), '2026-11');
  assert.match(seasonOf(), /^\d{4}-\d{2}$/);
  assert.equal(seasonEnds('2026-11'), Date.UTC(2026, 11, 1)); // 1º de dezembro
  assert.equal(championCount(0), 0);
  assert.equal(championCount(1), 1);
  assert.equal(championCount(10), 1);
  assert.equal(championCount(11), 2);
  assert.equal(championCount(100), 10);
});

test('banco: standing zera quando a temporada muda', () => {
  const dir = process.env.TMPDIR || '/tmp';
  const db = openDb(join(dir, `pulse-online-season-test-${Date.now()}`));
  const guest = db.prepare(
    "INSERT INTO users (id, provider, provider_id, created_at, last_seen_at) VALUES ('u1','guest','u1',?,?)"
  ).run(Date.now(), Date.now());
  assert.ok(guest);
  db.prepare(
    `INSERT INTO rankings (user_id, mode, tier, points, wins, losses, streak, season, updated_at)
     VALUES ('u1','ranked','Great Ball',250,5,2,3,'2026-10',?)`
  ).run(Date.now());
  const row = getStanding(db, 'u1', 'ranked', '2026-11');
  assert.equal(row.points, 0);
  assert.equal(row.wins, 0);
  assert.equal(row.season, '2026-11');
  db.close();
});

// ---------------------------------------------------------------- helpers HTTP
async function startServer() {
  const dir = await mkdtemp(join(tmpdir(), 'pulse-online-fr-'));
  const { server, db } = await createServer({ port: 0, dataDir: dir, firebaseProject: PROJECT });
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  return { base: `http://127.0.0.1:${server.address().port}`, server, db, dir };
}

async function stopServer({ server, db, dir }) {
  server.close();
  db.close();
  await rm(dir, { recursive: true, force: true });
}

async function makeGuest(base, nick) {
  const res = await fetch(`${base}/api/auth/guest`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ trainer_key: 'ash', nick, team: 'valor' }),
  });
  assert.equal(res.status, 201, `criar convidado ${nick}`);
  const j = await res.json();
  return { user_id: j.user_id, token: j.token, auth: { authorization: `Bearer ${j.token}` } };
}

async function call(base, method, path, auth, body) {
  const res = await fetch(`${base}${path}`, {
    method,
    headers: { ...(auth ?? {}), 'content-type': 'application/json' },
    ...(method === 'GET' || method === 'HEAD' ? {} : { body: body === undefined ? undefined : JSON.stringify(body) }),
  });
  return { status: res.status, json: await res.json() };
}

// ---------------------------------------------------------------- amizades
test('HTTP amizades: pedido, aceite, recusa, cooldown, expiração, pedido mútuo, remover, presença', async () => {
  const ctx = await startServer();
  const { base, db } = ctx;
  try {
    const a = await makeGuest(base, 'Ash');
    const b = await makeGuest(base, 'Misty');
    const c = await makeGuest(base, 'Brock');
    const d = await makeGuest(base, 'Gary');
    const e = await makeGuest(base, 'Dawn');
    const f = await makeGuest(base, 'Iris');

    // 401 sem token em todos os endpoints de amizade.
    for (const [m, p] of [['GET', '/api/friends'], ['POST', '/api/friends/request'], ['POST', '/api/friends/respond'], ['DELETE', '/api/friends/x'], ['POST', '/api/friends/heartbeat']]) {
      assert.equal((await call(base, m, p, null, {})).status, 401);
    }

    // Lista vazia no início.
    let list = await call(base, 'GET', '/api/friends', a.auth);
    assert.deepEqual(list.json, { friends: [], incoming: [], outgoing: [] });

    // Erros do pedido: a si mesmo, nick inexistente, corpo vazio.
    assert.equal((await call(base, 'POST', '/api/friends/request', a.auth, { nick: 'Ash' })).json.error, 'cannot_add_self');
    assert.equal((await call(base, 'POST', '/api/friends/request', a.auth, { nick: 'NaoExiste' })).json.error, 'user_not_found');
    assert.equal((await call(base, 'POST', '/api/friends/request', a.auth, {})).status, 400);

    // A convida B (busca case-insensitive) → 201 com expiração de 7 dias.
    let req = await call(base, 'POST', '/api/friends/request', a.auth, { nick: 'misty' });
    assert.equal(req.status, 201);
    assert.equal(req.json.ok, true);
    assert.equal(req.json.request.to_user_id, b.user_id);
    assert.equal(req.json.request.nick, 'Misty');
    assert.equal(req.json.request.expires_at - req.json.request.created_at, 7 * DAY);

    // B vê o convite recebido; A vê o enviado; pedido duplicado → request_pending.
    list = await call(base, 'GET', '/api/friends', b.auth);
    assert.equal(list.json.incoming.length, 1);
    assert.equal(list.json.incoming[0].user_id, a.user_id);
    list = await call(base, 'GET', '/api/friends', a.auth);
    assert.equal(list.json.outgoing.length, 1);
    assert.equal((await call(base, 'POST', '/api/friends/request', a.auth, { nick: 'Misty' })).json.error, 'request_pending');

    // Responder sem convite → 404; aceitar → amigos nos dois lados.
    assert.equal((await call(base, 'POST', '/api/friends/respond', c.auth, { user_id: a.user_id, accept: true })).status, 404);
    const acc = await call(base, 'POST', '/api/friends/respond', b.auth, { user_id: a.user_id, accept: true });
    assert.deepEqual(acc.json, { ok: true, status: 'accepted' });
    for (const me of [a, b]) {
      list = await call(base, 'GET', '/api/friends', me.auth);
      assert.equal(list.json.friends.length, 1);
      assert.equal(list.json.incoming.length, 0);
      assert.equal(list.json.outgoing.length, 0);
    }
    assert.equal(list.json.friends[0].trainer_key, 'ash');
    assert.equal(list.json.friends[0].team, 'valor');
    // Já amigos → already_friends.
    assert.equal((await call(base, 'POST', '/api/friends/request', a.auth, { nick: 'Misty' })).json.error, 'already_friends');

    // Presença: heartbeat marca online; last_seen antigo marca offline.
    const hb = await call(base, 'POST', '/api/friends/heartbeat', a.auth, {});
    assert.deepEqual(hb.json, { ok: true, online: true });
    list = await call(base, 'GET', '/api/friends', a.auth);
    assert.equal(list.json.friends[0].online, true);
    db.prepare('UPDATE users SET last_seen_at = ? WHERE id = ?').run(Date.now() - 10 * 60 * 1000, b.user_id);
    list = await call(base, 'GET', '/api/friends', a.auth);
    assert.equal(list.json.friends[0].online, false);

    // Recusa + cooldown de 24h: C convida A, A recusa, C tenta de novo → 400.
    await call(base, 'POST', '/api/friends/request', c.auth, { nick: 'Ash' });
    const dec = await call(base, 'POST', '/api/friends/respond', a.auth, { user_id: c.user_id, accept: false });
    assert.deepEqual(dec.json, { ok: true, status: 'declined' });
    list = await call(base, 'GET', '/api/friends', a.auth);
    assert.equal(list.json.incoming.length, 0);
    const cool = await call(base, 'POST', '/api/friends/request', c.auth, { nick: 'Ash' });
    assert.equal(cool.status, 400);
    assert.equal(cool.json.error, 'request_cooldown');
    assert.ok(cool.json.retry_after_ms > 0 && cool.json.retry_after_ms <= 24 * 3600 * 1000);

    // Expiração: D convida E; convite com 8 dias some da lista e não responde.
    await call(base, 'POST', '/api/friends/request', d.auth, { nick: 'Dawn' });
    db.prepare("UPDATE friends SET created_at = ? WHERE user_id = ? AND friend_id = ? AND status = 'pending'")
      .run(Date.now() - 8 * DAY, d.user_id, e.user_id);
    list = await call(base, 'GET', '/api/friends', e.auth);
    assert.equal(list.json.incoming.length, 0);
    assert.equal((await call(base, 'POST', '/api/friends/respond', e.auth, { user_id: d.user_id, accept: true })).status, 404);
    // Expirado não bloqueia: D convida de novo.
    assert.equal((await call(base, 'POST', '/api/friends/request', d.auth, { nick: 'Dawn' })).status, 201);

    // Pedido mútuo vira amizade na hora: E convida D (que já o convidou).
    const mutual = await call(base, 'POST', '/api/friends/request', e.auth, { nick: 'Gary' });
    assert.equal(mutual.status, 201);
    assert.equal(mutual.json.accepted, true);
    list = await call(base, 'GET', '/api/friends', d.auth);
    assert.equal(list.json.friends.length, 1);
    assert.equal(list.json.friends[0].user_id, e.user_id);

    // Bloqueio: F bloqueia A (linha direta no banco); A não consegue convidar.
    db.prepare("INSERT INTO friends (user_id, friend_id, status, created_at) VALUES (?,?, 'blocked', ?)")
      .run(f.user_id, a.user_id, Date.now());
    assert.equal((await call(base, 'POST', '/api/friends/request', a.auth, { nick: 'Iris' })).json.error, 'blocked');
    // Remover desfaz o bloqueio; o convite volta a funcionar.
    assert.equal((await call(base, 'DELETE', `/api/friends/${f.user_id}`, a.auth)).status, 200);
    assert.equal((await call(base, 'POST', '/api/friends/request', a.auth, { nick: 'Iris' })).status, 201);

    // Remover amizade: some nos dois lados; remover de novo → 404.
    const del = await call(base, 'DELETE', `/api/friends/${b.user_id}`, a.auth);
    assert.deepEqual(del.json, { ok: true });
    for (const me of [a, b]) {
      list = await call(base, 'GET', '/api/friends', me.auth);
      assert.equal(list.json.friends.length, 0);
    }
    assert.equal((await call(base, 'DELETE', `/api/friends/${b.user_id}`, a.auth)).status, 404);
    assert.equal((await call(base, 'DELETE', '/api/friends/usuario-inexistente', a.auth)).status, 404);
  } finally {
    await stopServer(ctx);
  }
});

// ---------------------------------------------------------------- ranking
test('HTTP ranking: /me, match, ladder, histórico, Champion e erros', async () => {
  const ctx = await startServer();
  const { base, db } = ctx;
  try {
    const a = await makeGuest(base, 'Red');
    const b = await makeGuest(base, 'Blue');

    // 401 sem token.
    for (const p of ['/api/rankings/me', '/api/rankings/ladder', '/api/rankings/history']) {
      assert.equal((await fetch(`${base}${p}`)).status, 401);
    }
    assert.equal((await call(base, 'POST', '/api/rankings/match', null, { result: 'win' })).status, 401);

    // /me zerado: Beginner 4, sem posição no ladder.
    let me = await call(base, 'GET', '/api/rankings/me', a.auth);
    assert.equal(me.status, 200);
    assert.deepEqual(me.json, {
      mode: 'ranked', tier: 'Beginner', tier_name: 'Beginner 4', rank: 4,
      points: 0, lo: 0, hi: 15, next: 'Beginner 3', floor: 0,
      wins: 0, losses: 0, games: 0, streak: 0,
      season: seasonOf(), ladder_rank: null,
    });

    // Vitória 1: +10, streak 1, sem bônus.
    let m = await call(base, 'POST', '/api/rankings/match', a.auth, { result: 'win', opponent_id: b.user_id });
    assert.equal(m.status, 200);
    assert.equal(m.json.ok, true);
    assert.deepEqual(m.json.match, {
      id: m.json.match.id, delta: 10, points_before: 0, points_after: 10,
      tier_before: 'Beginner 4', tier_after: 'Beginner 4', bonus: 0,
    });
    assert.equal(m.json.standing.points, 10);
    assert.equal(m.json.standing.streak, 1);
    assert.equal(m.json.standing.ladder_rank, 1);

    // Vitória 2: +13 (bônus de sequência +3) → 23 pts, Beginner 3.
    m = await call(base, 'POST', '/api/rankings/match', a.auth, { result: 'win', opponent_id: b.user_id });
    assert.equal(m.json.match.delta, 13);
    assert.equal(m.json.match.bonus, 3);
    assert.equal(m.json.match.points_after, 23);
    assert.equal(m.json.match.tier_after, 'Beginner 3');
    assert.equal(m.json.standing.tier_name, 'Beginner 3');

    // Vitória contra bot: +5, sequência intacta.
    m = await call(base, 'POST', '/api/rankings/match', a.auth, { result: 'win', vs_bot: true });
    assert.equal(m.json.match.delta, 5);
    assert.equal(m.json.match.points_after, 28);
    assert.equal(m.json.standing.streak, 2);

    // Derrota em Beginner: taxa 0, sequência zera.
    m = await call(base, 'POST', '/api/rankings/match', a.auth, { result: 'loss', opponent_id: b.user_id });
    assert.equal(m.json.match.delta, 0);
    assert.equal(m.json.match.points_after, 28);
    assert.equal(m.json.standing.streak, 0);
    assert.equal(m.json.standing.wins, 3);
    assert.equal(m.json.standing.losses, 1);

    // Piso do tier via banco: 95 pts → derrota cobra 5 e para em 90; depois trava.
    db.prepare("UPDATE rankings SET points = 95, wins = 3, losses = 1, streak = 0 WHERE user_id = ? AND mode = 'ranked'").run(a.user_id);
    m = await call(base, 'POST', '/api/rankings/match', a.auth, { result: 'loss' });
    assert.equal(m.json.match.delta, -5);
    assert.equal(m.json.match.points_after, 90);
    assert.equal(m.json.match.tier_after, 'Poké Ball 4');
    m = await call(base, 'POST', '/api/rankings/match', a.auth, { result: 'loss' });
    assert.equal(m.json.match.delta, 0);
    assert.equal(m.json.match.points_after, 90);

    // Master: bot não pontua; derrota cobra 10 com piso em 600.
    db.prepare("UPDATE rankings SET points = 610, streak = 3 WHERE user_id = ? AND mode = 'ranked'").run(a.user_id);
    m = await call(base, 'POST', '/api/rankings/match', a.auth, { result: 'win', vs_bot: true });
    assert.equal(m.json.match.delta, 0);
    assert.equal(m.json.standing.streak, 3);
    m = await call(base, 'POST', '/api/rankings/match', a.auth, { result: 'loss' });
    assert.equal(m.json.match.delta, -10);
    assert.equal(m.json.match.points_after, 600);
    // Único jogador com 600+ pts = top 10% (mín. 1) → Champion, como no PB.
    assert.equal(m.json.standing.tier, 'Champion');
    assert.equal(m.json.standing.tier_name, 'Champion');
    assert.equal(m.json.standing.next, null);

    // Erros do match: resultado inválido, oponente = si mesmo, oponente inexistente.
    assert.equal((await call(base, 'POST', '/api/rankings/match', a.auth, { result: 'draw' })).status, 400);
    assert.equal((await call(base, 'POST', '/api/rankings/match', a.auth, {})).status, 400);
    assert.equal((await call(base, 'POST', '/api/rankings/match', a.auth, { result: 'win', opponent_id: a.user_id })).status, 400);
    assert.equal((await call(base, 'POST', '/api/rankings/match', a.auth, { result: 'win', opponent_id: 'ninguem' })).status, 404);

    // Ladder: A (600 pts) na frente de B (ainda sem partidas → fora do ladder).
    let ladder = await call(base, 'GET', '/api/rankings/ladder', a.auth);
    assert.equal(ladder.json.season, seasonOf());
    assert.equal(ladder.json.rows.length, 1);
    assert.equal(ladder.json.rows[0].user_id, a.user_id);
    assert.equal(ladder.json.rows[0].tier, 'Champion'); // único 600+ = Champion
    assert.equal(ladder.json.rows[0].games, 8);

    // B joga e entra no ladder; ?limit=1 corta.
    await call(base, 'POST', '/api/rankings/match', b.auth, { result: 'win', opponent_id: a.user_id });
    ladder = await call(base, 'GET', '/api/rankings/ladder?limit=1', a.auth);
    assert.equal(ladder.json.rows.length, 1);
    assert.equal(ladder.json.rows[0].user_id, a.user_id);
    ladder = await call(base, 'GET', '/api/rankings/ladder', a.auth);
    assert.equal(ladder.json.rows.length, 2);
    assert.equal(ladder.json.rows[1].user_id, b.user_id);
    assert.equal(ladder.json.rows[1].points, 10);

    // Histórico: mais recente primeiro, com delta e tiers; limit respeitado.
    const hist = await call(base, 'GET', '/api/rankings/history', a.auth);
    assert.ok(hist.json.matches.length >= 8);
    assert.equal(hist.json.matches[0].result, 'loss');
    assert.equal(hist.json.matches[0].delta, -10);
    assert.equal(hist.json.matches[0].tier_after, 'Champion'); // 600 pts, único 600+
    assert.equal(hist.json.matches[0].vs_bot, false);
    const botMatch = hist.json.matches.find((x) => x.vs_bot && x.delta === 0);
    assert.ok(botMatch, 'vitória contra bot em Master registrada com delta 0');
    const hist1 = await call(base, 'GET', '/api/rankings/history?limit=1', a.auth);
    assert.equal(hist1.json.matches.length, 1);
  } finally {
    await stopServer(ctx);
  }
});

test('HTTP ranking: Champion é o top 10% dos 600+ pts', async () => {
  const ctx = await startServer();
  const { base, db } = ctx;
  try {
    // 11 jogadores com 600+ pts e partidas: top 2 (ceil(11*0.1)) são Champion.
    const players = [];
    for (let i = 0; i < 11; i++) {
      const g = await makeGuest(base, `Player${i}`);
      players.push(g);
      db.prepare(
        `INSERT INTO rankings (user_id, mode, tier, points, wins, losses, streak, season, updated_at)
         VALUES (?, 'ranked', 'Master Ball', ?, 5, 0, 0, ?, ?)`
      ).run(g.user_id, 660 - i * 5, seasonOf(), Date.now());
    }
    const ladder = await call(base, 'GET', '/api/rankings/ladder', players[0].auth);
    assert.equal(ladder.json.rows.length, 11);
    assert.equal(ladder.json.rows[0].tier_name, 'Champion');
    assert.equal(ladder.json.rows[1].tier_name, 'Champion');
    assert.equal(ladder.json.rows[2].tier_name, 'Master Ball');
    assert.equal(ladder.json.rows[2].tier, 'Master Ball');
    // /me do 3º mostra Master Ball (não Champion), com posição 3.
    const me = await call(base, 'GET', '/api/rankings/me', players[2].auth);
    assert.equal(me.json.tier, 'Master Ball');
    assert.equal(me.json.tier_name, 'Master Ball');
    assert.equal(me.json.ladder_rank, 3);
    // /me do 1º mostra Champion.
    const champ = await call(base, 'GET', '/api/rankings/me', players[0].auth);
    assert.equal(champ.json.tier, 'Champion');
    assert.equal(champ.json.tier_name, 'Champion');
    assert.equal(champ.json.next, null);
  } finally {
    await stopServer(ctx);
  }
});
