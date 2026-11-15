// SQLite local (node:sqlite, embutido no Node 22+) — zero setup, zero dependência.
// O banco vive em DATA_DIR/pulse-online.db (fora do repo, com modo 0600).
// Tabelas: users + profiles (em uso), friends + friend_declines + rankings +
// ranked_matches (em uso) e arena_rotations/settings (criadas já, para as
// próximas fases — as rotas de arena/admin ainda são esqueleto).
import { DatabaseSync } from 'node:sqlite';
import { mkdirSync, chmodSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';
import { championCount } from './ranks.mjs';

const SCHEMA = `
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  provider TEXT NOT NULL CHECK (provider IN ('google','guest')),
  provider_id TEXT NOT NULL,
  email TEXT,
  is_admin INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL,
  last_seen_at INTEGER NOT NULL,
  UNIQUE (provider, provider_id)
);
CREATE TABLE IF NOT EXISTS profiles (
  user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  trainer_key TEXT NOT NULL DEFAULT 'red',
  nick TEXT,
  team TEXT CHECK (team IS NULL OR team IN ('valor','instinct','mystic')),
  updated_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS friends (
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  friend_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','accepted','blocked')),
  created_at INTEGER NOT NULL,
  PRIMARY KEY (user_id, friend_id)
);
-- Recusas de convite de amizade: guardam o cooldown de 24h para re-convite.
-- from_user_id = quem recusou; to_user_id = quem tinha convidado.
CREATE TABLE IF NOT EXISTS friend_declines (
  from_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  to_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  declined_at INTEGER NOT NULL,
  PRIMARY KEY (from_user_id, to_user_id)
);
CREATE TABLE IF NOT EXISTS rankings (
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  mode TEXT NOT NULL CHECK (mode IN ('ranked','arena')),
  tier TEXT NOT NULL DEFAULT 'Beginner',
  points INTEGER NOT NULL DEFAULT 0,
  wins INTEGER NOT NULL DEFAULT 0,
  losses INTEGER NOT NULL DEFAULT 0,
  streak INTEGER NOT NULL DEFAULT 0,
  season TEXT NOT NULL DEFAULT '2026-11',
  updated_at INTEGER NOT NULL,
  PRIMARY KEY (user_id, mode)
);
-- Histórico de partidas ranqueadas (um registro por jogador por partida;
-- cada lado registra o seu próprio resultado — não há resultado autoritativo
-- do servidor para os dois lados de uma partida PvP).
CREATE TABLE IF NOT EXISTS ranked_matches (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  opponent_id TEXT,
  opponent_nick TEXT,
  result TEXT NOT NULL CHECK (result IN ('win','loss')),
  delta INTEGER NOT NULL,
  points_before INTEGER NOT NULL,
  points_after INTEGER NOT NULL,
  tier_before TEXT NOT NULL,
  tier_after TEXT NOT NULL,
  vs_bot INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_ranked_matches_user ON ranked_matches(user_id, created_at DESC);
CREATE TABLE IF NOT EXISTS arena_rotations (
  date TEXT PRIMARY KEY,
  pokemon TEXT NOT NULL
);
-- Histórico de partidas da arena (um registro por jogador por partida;
-- cada lado registra o seu próprio resultado). Separado de ranked_matches
-- porque o placar da arena é próprio (pontos diferentes, sem tiers).
CREATE TABLE IF NOT EXISTS arena_matches (
  id TEXT PRIMARY KEY,
  match_id TEXT NOT NULL,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  opponent_id TEXT,
  opponent_nick TEXT,
  result TEXT NOT NULL CHECK (result IN ('win','loss')),
  delta INTEGER NOT NULL,
  points_before INTEGER NOT NULL,
  points_after INTEGER NOT NULL,
  vs_bot INTEGER NOT NULL DEFAULT 0,
  season TEXT NOT NULL DEFAULT '2026-11',
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_arena_matches_user ON arena_matches(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_arena_matches_match ON arena_matches(match_id);
CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_users_provider ON users(provider, provider_id);
`;

// Migração leve: bancos criados pelo schema antigo ganham as colunas novas
// (streak/season em rankings). CREATE TABLE IF NOT EXISTS não altera tabelas
// que já existem, então a migração roda em todo openDb.
function ensureColumn(db, table, column, ddl) {
  const cols = db.prepare(`PRAGMA table_info(${table})`).all();
  if (!cols.some((c) => c.name === column)) {
    db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${ddl}`);
  }
}

export function openDb(dataDir) {
  mkdirSync(dataDir, { recursive: true });
  const path = join(dataDir, 'pulse-online.db');
  const isNew = !existsSync(path);
  const db = new DatabaseSync(path);
  db.exec('PRAGMA journal_mode=WAL;');
  db.exec('PRAGMA foreign_keys=ON;');
  db.exec(SCHEMA);
  ensureColumn(db, 'rankings', 'streak', "INTEGER NOT NULL DEFAULT 0");
  ensureColumn(db, 'rankings', 'season', "TEXT NOT NULL DEFAULT '2026-11'");
  if (isNew) {
    try { chmodSync(path, 0o600); } catch { /* segue sem chmod */ }
  }
  return db;
}

export function createUser(db, { provider, provider_id, email }) {
  const id = randomUUID();
  const pid = provider_id ?? id;
  const now = Date.now();
  db.prepare(
    'INSERT INTO users (id, provider, provider_id, email, created_at, last_seen_at) VALUES (?,?,?,?,?,?)'
  ).run(id, provider, pid, email ?? null, now, now);
  db.prepare(
    'INSERT INTO profiles (user_id, trainer_key, nick, team, updated_at) VALUES (?,?,?,?,?)'
  ).run(id, 'red', null, null, now);
  return getUserById(db, id);
}

export function getUserById(db, id) {
  return db.prepare('SELECT * FROM users WHERE id = ?').get(id) ?? null;
}

export function getUserByProvider(db, provider, provider_id) {
  return db.prepare('SELECT * FROM users WHERE provider = ? AND provider_id = ?').get(provider, provider_id) ?? null;
}

export function getProfile(db, userId) {
  return db.prepare(
    'SELECT user_id, trainer_key, nick, team, updated_at FROM profiles WHERE user_id = ?'
  ).get(userId) ?? null;
}

// Atualiza só os campos presentes em `fields` (nick/team aceitam null para limpar).
export function upsertProfile(db, userId, fields) {
  const cur = getProfile(db, userId);
  const next = {
    trainer_key: fields.trainer_key ?? cur?.trainer_key ?? 'red',
    nick: ('nick' in fields) ? fields.nick : (cur?.nick ?? null),
    team: ('team' in fields) ? fields.team : (cur?.team ?? null),
  };
  const now = Date.now();
  db.prepare(
    `INSERT INTO profiles (user_id, trainer_key, nick, team, updated_at) VALUES (?,?,?,?,?)
     ON CONFLICT(user_id) DO UPDATE SET
       trainer_key = excluded.trainer_key, nick = excluded.nick,
       team = excluded.team, updated_at = excluded.updated_at`
  ).run(userId, next.trainer_key, next.nick, next.team, now);
  return getProfile(db, userId);
}

export function touchUser(db, userId) {
  db.prepare('UPDATE users SET last_seen_at = ? WHERE id = ?').run(Date.now(), userId);
}

export function getCounts(db) {
  return { users: db.prepare('SELECT COUNT(*) AS n FROM users').get().n };
}

// Config do admin (tabela pronta; a rota é esqueleto até a fase do painel).
export function getSetting(db, key) {
  const row = db.prepare('SELECT value FROM settings WHERE key = ?').get(key);
  return row ? JSON.parse(row.value) : null;
}

export function setSetting(db, key, value) {
  db.prepare(
    `INSERT INTO settings (key, value, updated_at) VALUES (?,?,?)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`
  ).run(key, JSON.stringify(value), Date.now());
}

// ---------------------------------------------------------------- amizades
export const FRIEND_REQUEST_TTL_MS = 7 * 24 * 3600 * 1000; // convite expira em 7 dias
export const FRIEND_DECLINE_COOLDOWN_MS = 24 * 3600 * 1000; // re-convite bloqueado por 24h após recusa
export const ONLINE_WINDOW_MS = 5 * 60 * 1000; // online = last_seen_at dentro de 5 min

// Busca um usuário pelo nick (case-insensitive). Nicks não são únicos: em caso
// de empate, retorna o visto mais recentemente. Retorna null se não existir.
export function getUserByNick(db, nick) {
  return db.prepare(
    `SELECT u.* FROM users u JOIN profiles p ON p.user_id = u.id
     WHERE p.nick IS NOT NULL AND lower(p.nick) = lower(?)
     ORDER BY u.last_seen_at DESC, u.created_at ASC LIMIT 1`
  ).get(nick) ?? null;
}

export function getFriendRow(db, userId, friendId) {
  return db.prepare(
    'SELECT * FROM friends WHERE user_id = ? AND friend_id = ?'
  ).get(userId, friendId) ?? null;
}

// Relação entre dois usuários em qualquer direção ('pending' | 'accepted' |
// 'blocked' | null). Linhas pendentes expiradas (7 dias) contam como inexistentes.
export function getFriendRelation(db, a, b, now = Date.now()) {
  const row = getFriendRow(db, a, b) ?? getFriendRow(db, b, a);
  if (!row) return null;
  if (row.status === 'pending' && now - row.created_at > FRIEND_REQUEST_TTL_MS) return null;
  return row;
}

// Remove todos os convites pendentes expirados (limpeza preguiçosa, na listagem).
export function pruneAllExpiredRequests(db, now = Date.now()) {
  db.prepare(
    "DELETE FROM friends WHERE status = 'pending' AND created_at < ?"
  ).run(now - FRIEND_REQUEST_TTL_MS);
}

// Listas da tela de amizades: amigos aceitos (com last_seen_at, para o
// `online`), convites recebidos e enviados (só os não expirados).
export function listFriendData(db, userId, now = Date.now()) {
  const friends = db.prepare(
    `SELECT f.friend_id AS user_id, p.nick, p.trainer_key, p.team, u.last_seen_at
     FROM friends f
     JOIN profiles p ON p.user_id = f.friend_id
     JOIN users u ON u.id = f.friend_id
     WHERE f.user_id = ? AND f.status = 'accepted'`
  ).all(userId);
  const incoming = db.prepare(
    `SELECT f.user_id AS user_id, f.created_at, p.nick, p.trainer_key, p.team
     FROM friends f JOIN profiles p ON p.user_id = f.user_id
     WHERE f.friend_id = ? AND f.status = 'pending' AND f.created_at > ?`
  ).all(userId, now - FRIEND_REQUEST_TTL_MS);
  const outgoing = db.prepare(
    `SELECT f.friend_id AS user_id, f.created_at, p.nick, p.trainer_key, p.team
     FROM friends f JOIN profiles p ON p.user_id = f.friend_id
     WHERE f.user_id = ? AND f.status = 'pending' AND f.created_at > ?`
  ).all(userId, now - FRIEND_REQUEST_TTL_MS);
  return { friends, incoming, outgoing };
}
export function pruneExpiredRequests(db, a, b, now = Date.now()) {
  db.prepare(
    `DELETE FROM friends WHERE status = 'pending' AND created_at < ?
     AND ((user_id = ? AND friend_id = ?) OR (user_id = ? AND friend_id = ?))`
  ).run(now - FRIEND_REQUEST_TTL_MS, a, b, b, a);
}

// Registra um convite pendente (quem convida -> quem recebe).
export function insertFriendRequest(db, fromId, toId, now = Date.now()) {
  db.prepare(
    `INSERT INTO friends (user_id, friend_id, status, created_at) VALUES (?,?, 'pending', ?)
     ON CONFLICT(user_id, friend_id) DO UPDATE SET status = 'pending', created_at = excluded.created_at`
  ).run(fromId, toId, now);
  return getFriendRow(db, fromId, toId);
}

// Aceita um convite: apaga o pendente e cria o par aceito (duas linhas).
export function acceptFriendRequest(db, fromId, toId, now = Date.now()) {
  db.prepare('DELETE FROM friends WHERE user_id = ? AND friend_id = ?').run(fromId, toId);
  for (const [a, b] of [[fromId, toId], [toId, fromId]]) {
    db.prepare(
      `INSERT INTO friends (user_id, friend_id, status, created_at) VALUES (?,?, 'accepted', ?)
       ON CONFLICT(user_id, friend_id) DO UPDATE SET status = 'accepted', created_at = excluded.created_at`
    ).run(a, b, now);
  }
}

// Recusa um convite: apaga o pendente e registra a recusa (cooldown de 24h).
export function declineFriendRequest(db, fromId, toId, now = Date.now()) {
  db.prepare('DELETE FROM friends WHERE user_id = ? AND friend_id = ?').run(fromId, toId);
  db.prepare(
    `INSERT INTO friend_declines (from_user_id, to_user_id, declined_at) VALUES (?,?,?)
     ON CONFLICT(from_user_id, to_user_id) DO UPDATE SET declined_at = excluded.declined_at`
  ).run(toId, fromId, now);
}

// Ms restantes do cooldown de re-convite (0 = sem cooldown). O cooldown é do
// convidador recusado: `decliner` recusou um convite de `requester`.
export function declineCooldownRemainingMs(db, requester, decliner, now = Date.now()) {
  const row = db.prepare(
    'SELECT declined_at FROM friend_declines WHERE from_user_id = ? AND to_user_id = ?'
  ).get(decliner, requester);
  if (!row) return 0;
  return Math.max(0, row.declined_at + FRIEND_DECLINE_COOLDOWN_MS - now);
}

// Remove tudo entre dois usuários (amizade, pendentes e bloqueios, nas duas
// direções). Retorna quantas linhas de `friends` foram removidas.
export function deleteFriendship(db, a, b) {
  const { changes } = db.prepare(
    'DELETE FROM friends WHERE (user_id = ? AND friend_id = ?) OR (user_id = ? AND friend_id = ?)'
  ).run(a, b, b, a);
  return changes;
}

// ---------------------------------------------------------------- ranking
// Standing ranqueado da temporada atual. Cria zerado se não existir; se a
// linha for de outra temporada, zera (nova temporada = pontos zerados).
export function getStanding(db, userId, mode, season, now = Date.now()) {
  let row = db.prepare(
    'SELECT * FROM rankings WHERE user_id = ? AND mode = ?'
  ).get(userId, mode);
  if (!row) {
    db.prepare(
      `INSERT INTO rankings (user_id, mode, tier, points, wins, losses, streak, season, updated_at)
       VALUES (?,?,?,?,0,0,0,?,?)`
    ).run(userId, mode, 'Beginner', 0, season, now);
    row = db.prepare('SELECT * FROM rankings WHERE user_id = ? AND mode = ?').get(userId, mode);
  } else if (row.season !== season) {
    db.prepare(
      `UPDATE rankings SET tier = 'Beginner', points = 0, wins = 0, losses = 0,
       streak = 0, season = ?, updated_at = ? WHERE user_id = ? AND mode = ?`
    ).run(season, now, userId, mode);
    row = db.prepare('SELECT * FROM rankings WHERE user_id = ? AND mode = ?').get(userId, mode);
  }
  return row;
}

// Grava o resultado de uma partida no standing e retorna a linha atualizada.
export function applyMatchToStanding(db, userId, mode, season, { pts, streak, won, tier }, now = Date.now()) {
  const cur = getStanding(db, userId, mode, season, now);
  db.prepare(
    `UPDATE rankings SET tier = ?, points = ?, wins = ?, losses = ?, streak = ?,
     updated_at = ? WHERE user_id = ? AND mode = ?`
  ).run(tier, pts, cur.wins + (won ? 1 : 0), cur.losses + (won ? 0 : 1), streak, now, userId, mode);
  return db.prepare('SELECT * FROM rankings WHERE user_id = ? AND mode = ?').get(userId, mode);
}

export function insertRankedMatch(db, match) {
  const id = randomUUID();
  db.prepare(
    `INSERT INTO ranked_matches
     (id, user_id, opponent_id, opponent_nick, result, delta, points_before,
      points_after, tier_before, tier_after, vs_bot, created_at)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`
  ).run(
    id, match.user_id, match.opponent_id ?? null, match.opponent_nick ?? null,
    match.result, match.delta, match.points_before, match.points_after,
    match.tier_before, match.tier_after, match.vs_bot ? 1 : 0, match.created_at,
  );
  return id;
}

// Ladder da temporada: só jogadores com partidas, por pontos desc
// (desempate: mais vitórias, depois updated_at mais antigo).
export function getLadder(db, mode, season, limit) {
  return db.prepare(
    `SELECT r.user_id, r.points, r.wins, r.losses, r.updated_at,
            p.nick, p.trainer_key, p.team
     FROM rankings r JOIN profiles p ON p.user_id = r.user_id
     WHERE r.mode = ? AND r.season = ? AND (r.wins + r.losses) > 0
     ORDER BY r.points DESC, r.wins DESC, r.updated_at ASC LIMIT ?`
  ).all(mode, season, limit);
}

// Ids dos Champions da temporada: top 10% (mín. 1) dos jogadores com 600+ pts.
export function getChampionIds(db, mode, season) {
  const eligible = db.prepare(
    `SELECT user_id, points, wins, updated_at FROM rankings
     WHERE mode = ? AND season = ? AND points >= 600 AND (wins + losses) > 0
     ORDER BY points DESC, wins DESC, updated_at ASC`
  ).all(mode, season);
  const n = championCount(eligible.length);
  return new Set(eligible.slice(0, n).map((r) => r.user_id));
}

// Posição (1-based) de um jogador no ladder da temporada, ou null sem partidas.
export function getLadderRank(db, userId, mode, season) {
  const rows = db.prepare(
    `SELECT user_id FROM rankings
     WHERE mode = ? AND season = ? AND (wins + losses) > 0
     ORDER BY points DESC, wins DESC, updated_at ASC`
  ).all(mode, season);
  const i = rows.findIndex((r) => r.user_id === userId);
  return i < 0 ? null : i + 1;
}

// Histórico de partidas ranqueadas de um jogador, mais recentes primeiro.
export function getMatchHistory(db, userId, limit) {
  return db.prepare(
    `SELECT id, opponent_id, opponent_nick, result, delta, points_before,
            points_after, tier_before, tier_after, vs_bot, created_at
     FROM ranked_matches WHERE user_id = ? ORDER BY created_at DESC, rowid DESC LIMIT ?`
  ).all(userId, limit);
}

// Histórico de partidas da arena de um jogador, mais recentes primeiro.
export function getArenaMatchHistory(db, userId, limit) {
  return db.prepare(
    `SELECT id, match_id, opponent_id, opponent_nick, result, delta,
            points_before, points_after, vs_bot, season, created_at
     FROM arena_matches WHERE user_id = ? ORDER BY created_at DESC, rowid DESC LIMIT ?`
  ).all(userId, limit);
}
