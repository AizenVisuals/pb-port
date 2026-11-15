import {installAdmin,readSettings,changeSettings,adminOverview} from './admin.mjs';
// pulse-online — servidor de contas, perfis, amizades e ranking do PULSE ARENA.
// Node puro, zero dependências externas. HTTP + JSON. SQLite local.
// Padrão seguido do servidor PB (server/index.mjs): http.createServer, helper
// json(), validação de nome igual à do PB, payload máx. 64 KiB, porta por env.
import http from 'node:http';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { randomBytes } from 'node:crypto';
import { pathToFileURL } from 'node:url';
import { openDb, createUser, getUserById, getUserByProvider, getProfile, upsertProfile, touchUser, getCounts, getUserByNick, getFriendRow, getFriendRelation, pruneExpiredRequests, pruneAllExpiredRequests, listFriendData, insertFriendRequest, acceptFriendRequest, declineFriendRequest, declineCooldownRemainingMs, deleteFriendship, getStanding, applyMatchToStanding, insertRankedMatch, getMatchHistory, getLadder, getChampionIds, getLadderRank, getArenaMatchHistory, FRIEND_REQUEST_TTL_MS, ONLINE_WINDOW_MS } from './db.mjs';
import { rankOf, score, seasonOf } from './ranks.mjs';
import { createArenaManager, BOT_WAIT_MS } from './arena.mjs';
import { attachWebSocketServer } from './ws.mjs';
import { signSession, verifySession, verifyFirebaseIdToken } from './auth.mjs';
import { validateProfileInput, sanitizeNick } from './validate.mjs';
import { VERSION, FIREBASE_PROJECT, MAX_BODY_BYTES } from './config.mjs';

const startedAt = Date.now();

// Segredo de assinatura das sessões: arquivo em DATA_DIR/secret, gerado uma vez.
// Nunca vai para o repo, nunca é exibido em log.
async function loadSecret(dataDir) {
  await mkdir(dataDir, { recursive: true });
  const path = `${dataDir}/secret`;
  try {
    const s = (await readFile(path, 'utf8')).trim();
    if (s.length >= 32) return s;
  } catch (e) {
    if (e.code !== 'ENOENT') throw e;
  }
  const s = randomBytes(32).toString('hex');
  await writeFile(path, s, { mode: 0o600 });
  return s;
}

const json = (res, status, value) => {
  res.writeHead(status, { 'content-type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(value));
};

function fail(status, code) {
  const e = new Error(code);
  e.status = status;
  e.code = code;
  return e;
}

function setCors(res) {
  res.setHeader('access-control-allow-origin', '*');
  res.setHeader('access-control-allow-headers', 'authorization, content-type');
  res.setHeader('access-control-allow-methods', 'GET, POST, PUT, DELETE, OPTIONS');
}

async function readJson(req) {
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > MAX_BODY_BYTES) throw fail(413, 'payload_too_large');
    chunks.push(chunk);
  }
  if (size === 0) return {};
  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8'));
  } catch {
    throw fail(400, 'invalid_json');
  }
}

// Limite simples por IP (só nos POSTs de auth e no PUT de perfil).
function createRateLimiter({ windowMs, max }) {
  const hits = new Map();
  return (ip) => {
    const now = Date.now();
    const arr = (hits.get(ip) ?? []).filter((t) => now - t < windowMs);
    arr.push(now);
    hits.set(ip, arr);
    if (hits.size > 1000) {
      for (const [k, v] of hits) if (v.every((t) => now - t >= windowMs)) hits.delete(k);
    }
    return arr.length <= max;
  };
}

function publicAccount(user, profile) {
  return {
    user_id: user.id,
    provider: user.provider,
    email: user.email,
    is_admin: user.provider === 'google' && !!user.is_admin,
    profile: {
      trainer_key: profile.trainer_key,
      nick: profile.nick,
      team: profile.team,
      updated_at: profile.updated_at,
    },
  };
}

function requireAuth(req, ctx) {
  const m = /^Bearer\s+(.+)$/.exec(req.headers.authorization ?? '');
  if (!m) throw fail(401, 'unauthorized');
  const userId = verifySession(m[1], ctx.secret);
  if (!userId) throw fail(401, 'unauthorized');
  const user = getUserById(ctx.db, userId);
  if (!user) throw fail(401, 'unauthorized');
  return user;
}

const SKELETONS = {};

// `limit` de query (?limit=): padrão `def`, teto `max`, mínimo 1.
function parseLimit(raw, def, max) {
  const n = Number.parseInt(raw ?? '', 10);
  if (!Number.isFinite(n) || n < 1) return def;
  return Math.min(n, max);
}

const HOME_HTML = `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>PULSE ARENA online</title>
<style>body{font-family:system-ui,sans-serif;background:#0f1c26;color:#f6f3ea;margin:0;padding:32px}h1{margin:0 0 8px}a{color:#7de5e0}code{background:#16283a;padding:2px 6px;border-radius:4px}</style>
</head><body><h1>PULSE ARENA online</h1><p>Servidor de contas e perfis — fundação do online. Versão ${VERSION}.</p>
<p>Saúde: <a href="/api/health">/api/health</a> · Endpoints: <code>POST /api/auth/guest</code> <code>POST /api/auth/google</code> <code>GET/PUT /api/profile</code> <code>GET/POST/DELETE /api/friends</code> <code>GET/POST /api/rankings</code> <code>GET /api/arena/rotation</code> <code>POST/GET/DELETE /api/arena/queue</code> <code>POST /api/arena/result</code> <code>GET /api/arena/me</code> <code>GET /api/arena/ladder</code> · PvP: <code>WS /api/arena/ws</code></p>
<p>Arena Lv100 (rotação diária de 50, fila com bot após 2 min, ranking próprio) e admin chegam nas próximas fases.</p></body></html>`;

export async function createServer(opts = {}) {
  const port = Number(opts.port ?? process.env.PORT ?? 3016);
  const host = opts.host ?? process.env.HOST ?? '0.0.0.0';
  const dataDir = opts.dataDir ?? process.env.DATA_DIR ?? './data';
  const projectId = opts.firebaseProject ?? process.env.FIREBASE_PROJECT ?? FIREBASE_PROJECT;
  const secret = await loadSecret(dataDir);
  const db = openDb(dataDir);
  installAdmin(db);
  const authLimit = createRateLimiter({ windowMs: 60_000, max: 30 });
  const writeLimit = createRateLimiter({ windowMs: 60_000, max: 60 });
  const ipOf = (req) => req.socket.remoteAddress ?? 'unknown';

  // Arena: pool de espécies de arena-pool.json (gerado de public/roster.json).
  // `opts.arenaPool` injeta um pool menor nos testes. Sem o arquivo, a arena
  // responde 500 — o resto do servidor (login, amigos, ranking) segue no ar.
  let arenaPool = opts.arenaPool ?? null;
  if (!arenaPool) {
    try {
      const here = new URL('.', import.meta.url).pathname;
      arenaPool = JSON.parse(await readFile(`${here}arena-pool.json`, 'utf8'));
    } catch (e) {
      console.error('pulse-online: arena-pool.json indisponível — a arena fica fora do ar:', e.message);
      arenaPool = null;
    }
  }
  // Sockets WS da arena por usuário (o gerente só conhece `sendToUser`).
  const arenaSockets = new Map();
  const arena = arenaPool ? createArenaManager({
    db, pool: arenaPool, now:opts.arenaNow || Date.now,
    getUser: (id) => getUserById(db, id),
    getProfile: (id) => getProfile(db, id),
    sendToUser: (userId, msg) => { const s = arenaSockets.get(userId); if (s) s.send(JSON.stringify(msg)); },
  }) : null;
  // A varredura da arena (bot após 2 min, fila abandonada) é preguiçosa:
  // roda a cada requisição da arena e a cada mensagem WS — sem timer em
  // segundo plano, para não tocar no banco depois do close() nos testes.
  const sweepArena = () => { try { arena?.sweep(); } catch (e) { console.error('pulse-online arena sweep falhou:', e.message); } };

  // Formato do /api/rankings/me (e do `standing` do POST /match).
  // `tier` = tier ("Poké Ball"); `tier_name` = nome da divisão ("Poké Ball 4").
  function standingView(row, season, champions) {
    const r = rankOf(row.points, champions.has(row.user_id));
    return {
      mode: row.mode,
      tier: r.tier,
      tier_name: r.name,
      rank: r.rank,
      points: row.points,
      lo: r.lo,
      hi: r.hi,
      next: r.next,
      floor: r.floor,
      wins: row.wins,
      losses: row.losses,
      games: row.wins + row.losses,
      streak: row.streak,
      season,
      ladder_rank: getLadderRank(db, row.user_id, row.mode, season),
    };
  }

  async function handle(req, res) {
    const t0 = Date.now();
    const url = new URL(req.url, 'http://localhost');
    const pathname = decodeURIComponent(url.pathname);
    const method = req.method;
    setCors(res);
    let status = 200;
    try {
      if (method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
      }
      const staticFiles={
        '/':['site/index.html','text/html; charset=utf-8'],
        '/portal.js':['site/portal.js','text/javascript; charset=utf-8'],
        '/portal.css':['site/portal.css','text/css; charset=utf-8'],
        '/pulse/vendor/account-sdk.js':['site/account-sdk.js','text/javascript; charset=utf-8'],
        '/pulse/firebase-config.json':['site/firebase-config.json','application/json; charset=utf-8'],
      };
      if(method==='GET'&&staticFiles[pathname]){
        const [file,type]=staticFiles[pathname];
        let bytes;
        try{bytes=await readFile(new URL(file,import.meta.url));}catch(error){
          const sourceFallback={'/pulse/vendor/account-sdk.js':'../public/pulse/vendor/account-sdk.js','/pulse/firebase-config.json':'../public/pulse/firebase-config.json'}[pathname];
          if(error.code!=='ENOENT'||!sourceFallback)throw error;
          bytes=await readFile(new URL(sourceFallback,import.meta.url));
        }
        res.writeHead(200,{'content-type':type,'x-content-type-options':'nosniff','cache-control':'no-cache','referrer-policy':'same-origin'});res.end(bytes);return;
      }
      if(method==='GET'&&pathname==='/api/settings')return json(res,200,{settings:readSettings(db)});
      if(pathname.startsWith('/api/admin/')){
        const user=requireAuth(req,{db,secret});
        if(user.provider!=='google'||!user.is_admin)throw fail(403,'forbidden');
        res.setHeader('cache-control','no-store');
        if(method==='GET'&&pathname==='/api/admin/overview')return json(res,200,adminOverview(db));
        if(method==='GET'&&pathname==='/api/admin/settings')return json(res,200,{settings:readSettings(db)});
        if(method==='PUT'&&pathname==='/api/admin/settings'){
          if(!writeLimit(ipOf(req)))throw fail(429,'rate_limited');
          const result=changeSettings(db,user.id,await readJson(req));
          return json(res,result.ok?200:400,result);
        }
        throw fail(404,'not_found');
      }
      if (method === 'GET' && pathname === '/api/health') {
        return json(res, 200, {
          ok: true,
          service: 'pulse-online',
          version: VERSION,
          uptime: Math.floor((Date.now() - startedAt) / 1000),
          users: getCounts(db).users,
          time: new Date().toISOString(),
        });
      }
      if (method === 'GET' && pathname === '/api/version') {
        return json(res, 200, { service: 'pulse-online', version: VERSION });
      }
      if (method === 'GET' && pathname === '/api/auth') {
        return json(res, 200, { providers: ['google', 'guest'], guests: true });
      }
      if (method === 'POST' && pathname === '/api/auth/guest') {
        if (!authLimit(ipOf(req))) throw fail(429, 'rate_limited');
        const body = await readJson(req);
        const v = validateProfileInput(body);
        if (!v.ok) {
          status = 400;
          return json(res, 400, { error: 'invalid_profile', details: v.errors });
        }
        const user = createUser(db, { provider: 'guest', provider_id: null, email: null });
        const profile = upsertProfile(db, user.id, v.value);
        const token = signSession(user.id, secret);
        status = 201;
        return json(res, 201, { ...publicAccount(user, profile), token });
      }
      if (method === 'POST' && pathname === '/api/auth/google') {
        if (!authLimit(ipOf(req))) throw fail(429, 'rate_limited');
        const body = await readJson(req);
        const idToken = body?.id_token;
        if (typeof idToken !== 'string' || !idToken) throw fail(400, 'missing_id_token');
        let claims;
        try {
          claims = await verifyFirebaseIdToken(idToken, projectId, fetch, opts.firebaseJwks?{jwks:opts.firebaseJwks}:{});
        } catch (e) {
          console.error('pulse-online: google auth falhou:', e.message);
          throw fail(401, 'invalid_id_token');
        }
        if(claims.provider!=='google.com'||!claims.emailVerified)throw fail(401,'google_identity_required');
        let user = getUserByProvider(db, 'google', claims.uid);
        if (!user) {
          // Link a verified Google identity to the current guest without losing friends/rankings.
          let guest=null;
          if(req.headers.authorization)guest=requireAuth(req,{db,secret});
          if(guest?.provider==='guest'){
            db.prepare("UPDATE users SET provider='google',provider_id=?,email=?,is_admin=0 WHERE id=?").run(claims.uid,claims.email,guest.id);
            user=getUserById(db,guest.id);
          }else{
            user = createUser(db, { provider: 'google', provider_id: claims.uid, email: claims.email });
            upsertProfile(db, user.id, { trainer_key: 'red', nick: sanitizeNick(claims.name), team: null });
          }
        }
        touchUser(db, user.id);
        const profile = getProfile(db, user.id);
        const token = signSession(user.id, secret);
        return json(res, 200, { ...publicAccount(user, profile), token });
      }
      if (pathname === '/api/profile' && (method === 'GET' || method === 'PUT')) {
        const user = requireAuth(req, { db, secret });
        if (method === 'GET') {
          touchUser(db, user.id);
          return json(res, 200, publicAccount(user, getProfile(db, user.id)));
        }
        if (!writeLimit(ipOf(req))) throw fail(429, 'rate_limited');
        const body = await readJson(req);
        const v = validateProfileInput(body);
        if (!v.ok) {
          status = 400;
          return json(res, 400, { error: 'invalid_profile', details: v.errors });
        }
        if (Object.keys(v.value).length === 0) throw fail(400, 'nothing_to_update');
        const profile = upsertProfile(db, user.id, v.value);
        touchUser(db, user.id);
        return json(res, 200, publicAccount(user, profile));
      }
      // ------------------------------------------------------------ amizades
      if (method === 'GET' && pathname === '/api/friends') {
        const user = requireAuth(req, { db, secret });
        pruneAllExpiredRequests(db);
        const now = Date.now();
        const { friends, incoming, outgoing } = listFriendData(db, user.id, now);
        const pendingView = (r) => ({
          user_id: r.user_id,
          nick: r.nick,
          trainer_key: r.trainer_key,
          team: r.team,
          created_at: r.created_at,
          expires_at: r.created_at + FRIEND_REQUEST_TTL_MS,
        });
        return json(res, 200, {
          friends: friends.map((f) => ({
            user_id: f.user_id,
            nick: f.nick,
            trainer_key: f.trainer_key,
            team: f.team,
            online: now - f.last_seen_at <= ONLINE_WINDOW_MS,
            last_seen_at: f.last_seen_at,
          })),
          incoming: incoming.map(pendingView),
          outgoing: outgoing.map(pendingView),
        });
      }
      if (method === 'POST' && pathname === '/api/friends/request') {
        const user = requireAuth(req, { db, secret });
        if (!writeLimit(ipOf(req))) throw fail(429, 'rate_limited');
        const body = await readJson(req);
        const nick = typeof body?.nick === 'string' ? body.nick.trim() : '';
        if (!nick) throw fail(400, 'invalid_input');
        const target = getUserByNick(db, nick);
        if (!target) throw fail(400, 'user_not_found');
        if (target.id === user.id) throw fail(400, 'cannot_add_self');
        const now = Date.now();
        pruneExpiredRequests(db, user.id, target.id, now);
        const rel = getFriendRelation(db, user.id, target.id, now);
        if (rel?.status === 'blocked') throw fail(400, 'blocked');
        if (rel?.status === 'accepted') throw fail(400, 'already_friends');
        const targetProfile = getProfile(db, target.id);
        if (rel?.status === 'pending') {
          if (getFriendRow(db, user.id, target.id)) throw fail(400, 'request_pending');
          // Pedido mútuo: ele já tinha te convidado — vira amizade na hora.
          const incoming = getFriendRow(db, target.id, user.id);
          acceptFriendRequest(db, target.id, user.id, now);
          status = 201;
          return json(res, 201, {
            ok: true,
            accepted: true,
            request: {
              to_user_id: target.id,
              nick: targetProfile?.nick ?? null,
              created_at: incoming.created_at,
              expires_at: incoming.created_at + FRIEND_REQUEST_TTL_MS,
            },
          });
        }
        const retryAfterMs = declineCooldownRemainingMs(db, user.id, target.id, now);
        if (retryAfterMs > 0) {
          status = 400;
          return json(res, 400, { error: 'request_cooldown', retry_after_ms: retryAfterMs });
        }
        const row = insertFriendRequest(db, user.id, target.id, now);
        status = 201;
        return json(res, 201, {
          ok: true,
          request: {
            to_user_id: target.id,
            nick: targetProfile?.nick ?? null,
            created_at: row.created_at,
            expires_at: row.created_at + FRIEND_REQUEST_TTL_MS,
          },
        });
      }
      if (method === 'POST' && pathname === '/api/friends/respond') {
        const user = requireAuth(req, { db, secret });
        if (!writeLimit(ipOf(req))) throw fail(429, 'rate_limited');
        const body = await readJson(req);
        const otherId = body?.user_id;
        if (typeof otherId !== 'string' || !otherId || typeof body?.accept !== 'boolean') {
          throw fail(400, 'invalid_input');
        }
        const now = Date.now();
        pruneExpiredRequests(db, otherId, user.id, now);
        const row = getFriendRow(db, otherId, user.id);
        if (!row || row.status !== 'pending') throw fail(404, 'request_not_found');
        if (body.accept) {
          acceptFriendRequest(db, otherId, user.id, now);
          return json(res, 200, { ok: true, status: 'accepted' });
        }
        declineFriendRequest(db, otherId, user.id, now);
        return json(res, 200, { ok: true, status: 'declined' });
      }
      if (method === 'DELETE' && pathname.startsWith('/api/friends/')) {
        const user = requireAuth(req, { db, secret });
        if (!writeLimit(ipOf(req))) throw fail(429, 'rate_limited');
        const otherId = pathname.slice('/api/friends/'.length);
        if (!otherId || otherId.includes('/')) throw fail(400, 'invalid_input');
        const removed = deleteFriendship(db, user.id, decodeURIComponent(otherId));
        if (removed === 0) throw fail(404, 'not_found');
        return json(res, 200, { ok: true });
      }
      if (method === 'POST' && pathname === '/api/friends/heartbeat') {
        const user = requireAuth(req, { db, secret });
        if (!writeLimit(ipOf(req))) throw fail(429, 'rate_limited');
        touchUser(db, user.id);
        return json(res, 200, { ok: true, online: true });
      }
      // ------------------------------------------------------------- ranking
      if (method === 'GET' && pathname === '/api/rankings/me') {
        const user = requireAuth(req, { db, secret });
        const season = seasonOf();
        const row = getStanding(db, user.id, 'ranked', season);
        return json(res, 200, standingView(row, season, getChampionIds(db, 'ranked', season)));
      }
      if (method === 'GET' && pathname === '/api/rankings/ladder') {
        requireAuth(req, { db, secret });
        const season = seasonOf();
        const limit = parseLimit(url.searchParams.get('limit'), 50, 100);
        const champions = getChampionIds(db, 'ranked', season);
        const rows = getLadder(db, 'ranked', season, limit);
        return json(res, 200, {
          season,
          rows: rows.map((r, i) => {
            const rank = rankOf(r.points, champions.has(r.user_id));
            return {
              rank: i + 1,
              user_id: r.user_id,
              nick: r.nick,
              trainer_key: r.trainer_key,
              team: r.team,
              tier: rank.tier,
              tier_name: rank.name,
              points: r.points,
              wins: r.wins,
              losses: r.losses,
              games: r.wins + r.losses,
            };
          }),
        });
      }
      if (method === 'GET' && pathname === '/api/rankings/history') {
        const user = requireAuth(req, { db, secret });
        const limit = parseLimit(url.searchParams.get('limit'), 20, 50);
        const rows = getMatchHistory(db, user.id, limit);
        return json(res, 200, {
          matches: rows.map((m) => ({
            id: m.id,
            opponent_id: m.opponent_id,
            opponent_nick: m.opponent_nick,
            result: m.result,
            delta: m.delta,
            points_before: m.points_before,
            points_after: m.points_after,
            tier_before: m.tier_before,
            tier_after: m.tier_after,
            vs_bot: m.vs_bot === 1,
            created_at: m.created_at,
          })),
        });
      }
      if (method === 'POST' && pathname === '/api/rankings/match') {
        const user = requireAuth(req, { db, secret });
        if (!writeLimit(ipOf(req))) throw fail(429, 'rate_limited');
        const body = await readJson(req);
        if (body?.result !== 'win' && body?.result !== 'loss') throw fail(400, 'invalid_result');
        const won = body.result === 'win';
        const vsBot = body?.vs_bot === true;
        let opponentId = null;
        let opponentNick = null;
        if (!vsBot && typeof body?.opponent_id === 'string' && body.opponent_id) {
          if (body.opponent_id === user.id) throw fail(400, 'invalid_opponent');
          const opp = getUserById(db, body.opponent_id);
          if (!opp) throw fail(404, 'opponent_not_found');
          opponentId = opp.id;
          opponentNick = getProfile(db, opp.id)?.nick ?? null;
        }
        const now = Date.now();
        const season = seasonOf(now);
        const before = getStanding(db, user.id, 'ranked', season, now);
        const championsBefore = getChampionIds(db, 'ranked', season);
        const tierBefore = rankOf(before.points, championsBefore.has(user.id)).name;
        const sc = score({ pts: before.points, streak: before.streak }, won, vsBot);
        const after = applyMatchToStanding(db, user.id, 'ranked', season, {
          pts: sc.pts, streak: sc.streak, won, tier: rankOf(sc.pts).tier,
        }, now);
        const championsAfter = getChampionIds(db, 'ranked', season);
        const tierAfter = rankOf(sc.pts, championsAfter.has(user.id)).name;
        const matchId = insertRankedMatch(db, {
          user_id: user.id,
          opponent_id: opponentId,
          opponent_nick: opponentNick,
          result: body.result,
          delta: sc.delta,
          points_before: before.points,
          points_after: sc.pts,
          tier_before: tierBefore,
          tier_after: tierAfter,
          vs_bot: vsBot,
          created_at: now,
        });
        return json(res, 200, {
          ok: true,
          standing: standingView(after, season, championsAfter),
          match: {
            id: matchId,
            delta: sc.delta,
            points_before: before.points,
            points_after: sc.pts,
            tier_before: tierBefore,
            tier_after: tierAfter,
            bonus: sc.bonus,
          },
        });
      }
      // -------------------------------------------------------------- arena
      // A arena precisa do pool; sem ele, 500 com o motivo (o resto segue).
      const requireArena = () => { if (!arena) throw fail(500, 'arena_unavailable'); };
      if (method === 'GET' && pathname === '/api/arena') {
        requireArena();
        const user = requireAuth(req, { db, secret });
        const rotation = arena.getRotation();
        return json(res, 200, { ok: true, mode: 'arena', season: seasonOf(), rotation_date: rotation.date, rotation_size: rotation.pokemon.length });
      }
      if (method === 'GET' && pathname === '/api/arena/rotation') {
        requireArena();
        requireAuth(req, { db, secret });
        sweepArena();
        return json(res, 200, arena.getRotation());
      }
      if (method === 'POST' && pathname === '/api/arena/queue') {
        requireArena();
        const user = requireAuth(req, { db, secret });
        if(!readSettings(db).arena_enabled)throw fail(503,'arena_disabled');
        if (!writeLimit(ipOf(req))) throw fail(429, 'rate_limited');
        const body = await readJson(req);
        sweepArena();
        const out = arena.joinQueue(user.id, body?.team);
        if (!out.ok) {
          status = 400;
          return json(res, 400, { error: out.error, details: out.details });
        }
        return json(res, 200, { ...out, bot_wait_ms: BOT_WAIT_MS });
      }
      if (method === 'GET' && pathname === '/api/arena/queue') {
        requireArena();
        const user = requireAuth(req, { db, secret });
        sweepArena();
        return json(res, 200, arena.queueStatus(user.id));
      }
      if (method === 'DELETE' && pathname === '/api/arena/queue') {
        requireArena();
        const user = requireAuth(req, { db, secret });
        const out = arena.leaveQueue(user.id);
        if (!out.ok) {
          status = 400;
          return json(res, 400, { error: out.error });
        }
        return json(res, 200, { ok: true, left: out.left });
      }
      if (method === 'POST' && pathname === '/api/arena/result') {
        requireArena();
        const user = requireAuth(req, { db, secret });
        if (!writeLimit(ipOf(req))) throw fail(429, 'rate_limited');
        const body = await readJson(req);
        const out = arena.reportResult({ matchId: body?.match_id, userId: user.id, result: body?.result });
        if (!out.ok) {
          status = out.error === 'match_not_found' ? 404 : 400;
          return json(res, status, { error: out.error });
        }
        return json(res, 200, out);
      }
      if (method === 'GET' && pathname === '/api/arena/me') {
        requireArena();
        const user = requireAuth(req, { db, secret });
        return json(res, 200, arena.arenaStanding(user.id));
      }
      if (method === 'GET' && pathname === '/api/arena/ladder') {
        requireArena();
        requireAuth(req, { db, secret });
        const limit = parseLimit(url.searchParams.get('limit'), 50, 100);
        return json(res, 200, arena.arenaLadder(seasonOf(), limit));
      }
      if (method === 'GET' && pathname === '/api/arena/history') {
        requireArena();
        const user = requireAuth(req, { db, secret });
        const limit = parseLimit(url.searchParams.get('limit'), 20, 50);
        const rows = getArenaMatchHistory(db, user.id, limit);
        return json(res, 200, {
          matches: rows.map((m) => ({
            id: m.id, match_id: m.match_id, opponent_id: m.opponent_id,
            opponent_nick: m.opponent_nick, result: m.result, delta: m.delta,
            points_before: m.points_before, points_after: m.points_after,
            vs_bot: m.vs_bot === 1, season: m.season, created_at: m.created_at,
          })),
        });
      }
      if (method === 'GET' && SKELETONS[pathname]) {
        status = 501;
        return json(res, 501, {
          error: 'not_implemented',
          phase: 'next',
          resource: SKELETONS[pathname],
          message: 'Este recurso chega nas próximas fases (arena, admin).',
        });
      }
      status = 404;
      return json(res, 404, { error: 'not_found' });
    } catch (e) {
      status = e.status ?? 500;
      if (status >= 500) console.error('pulse-online: erro interno', e);
      return json(res, status, { error: status === 500 ? 'internal' : (e.code ?? 'error') });
    } finally {
      const ms = Date.now() - t0;
      console.log(new Date().toISOString(), method, pathname, status, `${ms}ms`);
    }
  }

  const server = http.createServer((req, res) => {
    handle(req, res).catch((e) => {
      console.error('pulse-online: erro não tratado', e);
      try { json(res, 500, { error: 'internal' }); } catch { /* conexão já fechada */ }
    });
  });

  // WebSocket da arena (PvP em tempo real). O socket começa sem autenticação:
  // a primeira mensagem tem que ser {t:'hello', token} (sessão do jogo).
  // Sem o `hello` em 10 s, ou com token inválido, a conexão fecha.
  // Limite: 90 mensagens/s por socket (igual ao PB).
  if (arena) {
    attachWebSocketServer(server, {
      paths: ['/api/arena/ws'],
      onConnection: (ws) => {
        let userId = null;
        let budget = 0;
        let budgetAt = 0;
        const helloTimer = setTimeout(() => {
          if (!userId) { try { ws.send(JSON.stringify({ t: 'error', msg: 'Autentique com {t:"hello", token} primeiro.' })); } catch { /* já foi */ } ws.close(1008, 'hello timeout'); }
        }, 10_000);
        if (helloTimer.unref) helloTimer.unref();
        ws.onMessage = (text) => {
          const nowMs = Date.now();
          if (nowMs - budgetAt > 1000) { budgetAt = nowMs; budget = 0; }
          if (++budget > 90) { ws.send(JSON.stringify({ t: 'error', msg: 'Muitas mensagens. Aguarde um instante.' })); return; }
          let msg;
          try { msg = JSON.parse(text); } catch { ws.send(JSON.stringify({ t: 'error', msg: 'Mensagem inválida.' })); return; }
          if (!userId) {
            if (msg?.t !== 'hello' || typeof msg.token !== 'string') {
              ws.send(JSON.stringify({ t: 'error', msg: 'Autentique com {t:"hello", token} primeiro.' }));
              return;
            }
            const id = verifySession(msg.token, secret);
            const user = id ? getUserById(db, id) : null;
            if (!user) {
              ws.send(JSON.stringify({ t: 'error', msg: 'Sessão inválida.' }));
              ws.close(1008, 'unauthorized');
              return;
            }
            if(arenaSockets.has(user.id)){
              ws.send(JSON.stringify({t:'error',msg:'Sua conta já está conectada à Arena em outra tela.'}));ws.close(1008,'already connected');return;
            }
            userId = user.id;
            clearTimeout(helloTimer);
            arenaSockets.set(userId, ws);
            arena.attachSocket(userId, ws);
            touchUser(db, userId);
            ws.send(JSON.stringify({ t: 'welcome', user_id: userId }));
            sweepArena();
            return;
          }
          sweepArena();
          try { arena.handleSocketMessage(userId, msg); } catch (e) {
            console.error('pulse-online arena WS erro:', e.message);
            ws.send(JSON.stringify({ t: 'error', msg: 'Erro interno.' }));
          }
        };
        ws.onClose = () => {
          clearTimeout(helloTimer);
          if (userId && arenaSockets.get(userId) === ws) {
            arenaSockets.delete(userId);
            arena.detachSocket(userId);
          }
        };
        ws.onError = (err) => console.error('pulse-online arena WS socket erro:', err.message);
      },
    });
  }
  return { server, db, port, host };
}

const isMain = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isMain) {
  const { server, port, host } = await createServer();
  server.listen(port, host, () => {
    console.log(`pulse-online ${VERSION}: http://${host}:${port}`);
  });
}
