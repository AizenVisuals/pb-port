// Validação do perfil (personagem, nick, time) — mesma regra do jogo e do PB.
import { TRAINERS, TEAMS, NICK_RE } from './config.mjs';

// Valida um corpo de perfil (guest ou PUT). Campos ausentes = não alterar.
// Retorna {ok, errors, value} com os valores normalizados (nick aparado, time minúsculo).
export function validateProfileInput(body) {
  const errors = [];
  const value = {};
  if (body == null || typeof body !== 'object' || Array.isArray(body)) {
    return { ok: false, errors: ['corpo deve ser um objeto JSON'], value };
  }
  if ('trainer_key' in body) {
    if (typeof body.trainer_key !== 'string' || !TRAINERS.includes(body.trainer_key)) {
      errors.push('trainer_key inválido');
    } else {
      value.trainer_key = body.trainer_key;
    }
  }
  if ('nick' in body) {
    if (body.nick === null) {
      value.nick = null;
    } else if (typeof body.nick !== 'string' || !NICK_RE.test(body.nick.trim())) {
      errors.push('nick inválido (2–16 caracteres: letras, números, espaço, . _ - \')');
    } else {
      value.nick = body.nick.trim();
    }
  }
  if ('team' in body) {
    if (body.team === null) {
      value.team = null;
    } else if (typeof body.team !== 'string' || !TEAMS.includes(body.team.trim().toLowerCase())) {
      errors.push('time inválido (valor, instinct ou mystic)');
    } else {
      value.team = body.team.trim().toLowerCase();
    }
  }
  return { ok: errors.length === 0, errors, value };
}

// Aproveita o nome do Google como nick só se ele passar na regra; senão, null.
export function sanitizeNick(name) {
  if (typeof name !== 'string') return null;
  const n = name.trim();
  return NICK_RE.test(n) ? n : null;
}
