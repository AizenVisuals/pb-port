// Autenticação do pulse-online.
// - Sessão do jogador: JWT HS256 assinado com o segredo do servidor (arquivo em
//   DATA_DIR/secret, gerado uma vez, modo 0600). Sem dependência externa.
// - Login Google: verifica o Firebase ID Token (RS256) contra as chaves públicas
//   do Google (JWKS), sem precisar de chave de service account — só o projectId.
//   Checa aud, iss, exp, iat e sub, como o Firebase Admin faria.
import { createHmac, createPublicKey, createVerify, timingSafeEqual } from 'node:crypto';
import { SESSION_TTL_SECONDS } from './config.mjs';

export const b64u = (buf) => Buffer.from(buf).toString('base64url');
export const unb64u = (s) => Buffer.from(s, 'base64url');
const b64uJson = (obj) => b64u(Buffer.from(JSON.stringify(obj), 'utf8'));

// ---------------------------------------------------------------- sessão (HS256)
export function signSession(userId, secret, ttlSeconds = SESSION_TTL_SECONDS) {
  const now = Math.floor(Date.now() / 1000);
  const header = b64uJson({ alg: 'HS256', typ: 'JWT' });
  const payload = b64uJson({ sub: userId, iat: now, exp: now + ttlSeconds });
  const sig = createHmac('sha256', secret).update(`${header}.${payload}`).digest();
  return `${header}.${payload}.${b64u(sig)}`;
}

// Retorna o userId ou null (assinatura inválida, expirado ou malformado).
export function verifySession(token, secret) {
  try {
    const parts = String(token).split('.');
    if (parts.length !== 3) return null;
    const [h, p, s] = parts;
    const expected = createHmac('sha256', secret).update(`${h}.${p}`).digest();
    const got = unb64u(s);
    if (got.length !== expected.length || !timingSafeEqual(got, expected)) return null;
    const payload = JSON.parse(unb64u(p).toString('utf8'));
    if (typeof payload.exp !== 'number' || payload.exp * 1000 < Date.now()) return null;
    if (typeof payload.sub !== 'string' || !payload.sub) return null;
    return payload.sub;
  } catch {
    return null;
  }
}

// ------------------------------------------------------- Firebase ID Token (RS256)
const JWKS_URL = 'https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com';
const JWKS_TTL_MS = 3600 * 1000;
let jwksCache = null; // { at, keys }

async function getJwks(fetchFn, force = false) {
  if (!force && jwksCache && Date.now() - jwksCache.at < JWKS_TTL_MS) return jwksCache;
  const res = await fetchFn(JWKS_URL);
  if (!res.ok) throw new Error(`JWKS fetch falhou: HTTP ${res.status}`);
  const data = await res.json();
  if (!Array.isArray(data.keys) || data.keys.length === 0) throw new Error('JWKS vazio');
  jwksCache = { at: Date.now(), keys: data.keys };
  return jwksCache;
}

// Verifica um Firebase ID Token e retorna {uid, email, name, picture}.
// `opts.jwks` permite injetar as chaves (usado nos testes; em produção busca do Google).
// Lança Error com mensagem curta em qualquer falha (o servidor responde 401 genérico).
export async function verifyFirebaseIdToken(idToken, projectId, fetchFn = fetch, opts = {}) {
  const parts = String(idToken).split('.');
  if (parts.length !== 3) throw new Error('token malformado');
  let header;
  let payload;
  try {
    header = JSON.parse(unb64u(parts[0]).toString('utf8'));
    payload = JSON.parse(unb64u(parts[1]).toString('utf8'));
  } catch {
    throw new Error('token malformado');
  }
  if (header.alg !== 'RS256' || typeof header.kid !== 'string' || !header.kid) {
    throw new Error('alg/kid inválido');
  }
  if (payload.aud !== projectId) throw new Error('aud inválido');
  if (payload.iss !== `https://securetoken.google.com/${projectId}`) throw new Error('iss inválido');
  const now = Math.floor(Date.now() / 1000);
  if (typeof payload.exp !== 'number' || payload.exp <= now) throw new Error('token expirado');
  if (typeof payload.iat !== 'number' || payload.iat > now + 60) throw new Error('iat inválido');
  if (typeof payload.sub !== 'string' || !payload.sub) throw new Error('sub inválido');

  let jwks = opts.jwks ?? await getJwks(fetchFn);
  let jwk = jwks.keys.find((k) => k.kid === header.kid);
  if (!jwk && !opts.jwks) {
    // Chave nova (rotação do Google): busca de novo antes de desistir.
    jwks = await getJwks(fetchFn, true);
    jwk = jwks.keys.find((k) => k.kid === header.kid);
  }
  if (!jwk) throw new Error('kid desconhecido');
  const key = createPublicKey({ key: jwk, format: 'jwk' });
  const ok = createVerify('RSA-SHA256')
    .update(`${parts[0]}.${parts[1]}`)
    .verify(key, unb64u(parts[2]));
  if (!ok) throw new Error('assinatura inválida');
  return {
    uid: payload.sub,
    provider: payload.firebase?.sign_in_provider || null,
    emailVerified: payload.email_verified === true,
    email: typeof payload.email === 'string' ? payload.email : null,
    name: typeof payload.name === 'string' ? payload.name : null,
    picture: typeof payload.picture === 'string' ? payload.picture : null,
  };
}
