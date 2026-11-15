// Testes do pulse-online (node:test, mesmo padrão do repo: `npm test`).
// Cobre: sessão (HS256), verificação do Firebase ID Token (RS256, com JWKS injetado),
// validação de perfil, banco (SQLite) e a API HTTP de ponta a ponta.
// O teste NÃO depende de rede: o JWKS do Google é injetado; a busca real é
// verificada manualmente no deploy (curl no endpoint do Google).
import test from 'node:test';
import assert from 'node:assert/strict';
import { generateKeyPairSync, createSign } from 'node:crypto';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { signSession, verifySession, verifyFirebaseIdToken, b64u } from '../auth.mjs';
import { validateProfileInput, sanitizeNick } from '../validate.mjs';
import { openDb, createUser, getUserByProvider, getProfile, upsertProfile, getCounts } from '../db.mjs';
import { createServer } from '../server.mjs';

const PROJECT = 'pulse-arena-pb';
const SECRET = 'segredo-de-teste-com-32-caracteres-ou-mais!!';

// ---------------------------------------------------------------- sessão HS256
test('sessão: assina e verifica; rejeita adulteração, expiração e segredo errado', () => {
  const token = signSession('user-1', SECRET);
  assert.equal(verifySession(token, SECRET), 'user-1');
  // Payload adulterado.
  const parts = token.split('.');
  const tampered = `${parts[0]}.${b64u(Buffer.from(JSON.stringify({ sub: 'user-2', iat: 1, exp: 9999999999 })))}.${parts[2]}`;
  assert.equal(verifySession(tampered, SECRET), null);
  // Assinatura adulterada.
  assert.equal(verifySession(`${parts[0]}.${parts[1]}.${b64u(Buffer.from('x'.repeat(32)))}`, SECRET), null);
  // Expirado (ttl negativo).
  assert.equal(verifySession(signSession('user-1', SECRET, -10), SECRET), null);
  // Segredo errado.
  assert.equal(verifySession(token, 'outro-segredo-com-32-caracteres!!'), null);
  // Malformado.
  assert.equal(verifySession('não-é-um-token', SECRET), null);
  assert.equal(verifySession('', SECRET), null);
});

// ------------------------------------------------- Firebase ID Token (RS256)
function makeIdToken({ key, kid, payload }) {
  const header = b64u(Buffer.from(JSON.stringify({ alg: 'RS256', kid, typ: 'JWT' })));
  const body = b64u(Buffer.from(JSON.stringify(payload)));
  const sig = createSign('RSA-SHA256').update(`${header}.${body}`).end().sign(key);
  return `${header}.${body}.${b64u(sig)}`;
}

test('firebase: verifica token RS256 válido e rejeita aud/iss/expiração/assinatura', async () => {
  const { publicKey, privateKey } = generateKeyPairSync('rsa', { modulusLength: 2048 });
  const jwk = publicKey.export({ format: 'jwk' });
  jwk.kid = 'kid-teste';
  jwk.alg = 'RS256';
  jwk.use = 'sig';
  const now = Math.floor(Date.now() / 1000);
  const base = {
    aud: PROJECT,
    iss: `https://securetoken.google.com/${PROJECT}`,
    sub: 'uid-123',
    email: 'teste@exemplo.com',
    name: 'Teste',
    iat: now - 10,
    exp: now + 3600,
  };
  const ok = makeIdToken({ key: privateKey, kid: 'kid-teste', payload: base });
  const claims = await verifyFirebaseIdToken(ok, PROJECT, fetch, { jwks: { keys: [jwk] } });
  assert.equal(claims.uid, 'uid-123');
  assert.equal(claims.email, 'teste@exemplo.com');
  assert.equal(claims.name, 'Teste');

  // Aud errado.
  await assert.rejects(
    verifyFirebaseIdToken(makeIdToken({ key: privateKey, kid: 'kid-teste', payload: { ...base, aud: 'outro-projeto' } }), PROJECT, fetch, { jwks: { keys: [jwk] } }),
    /aud inválido/
  );
  // Iss errado.
  await assert.rejects(
    verifyFirebaseIdToken(makeIdToken({ key: privateKey, kid: 'kid-teste', payload: { ...base, iss: 'https://example.com' } }), PROJECT, fetch, { jwks: { keys: [jwk] } }),
    /iss inválido/
  );
  // Expirado.
  await assert.rejects(
    verifyFirebaseIdToken(makeIdToken({ key: privateKey, kid: 'kid-teste', payload: { ...base, exp: now - 10 } }), PROJECT, fetch, { jwks: { keys: [jwk] } }),
    /expirado/
  );
  // Assinatura de outra chave.
  const other = generateKeyPairSync('rsa', { modulusLength: 2048 });
  await assert.rejects(
    verifyFirebaseIdToken(makeIdToken({ key: other.privateKey, kid: 'kid-teste', payload: base }), PROJECT, fetch, { jwks: { keys: [jwk] } }),
    /assinatura inválida/
  );
  // Kid desconhecido.
  await assert.rejects(
    verifyFirebaseIdToken(makeIdToken({ key: privateKey, kid: 'kid-que-não-existe', payload: base }), PROJECT, fetch, { jwks: { keys: [jwk] } }),
    /kid desconhecido/
  );
  // Malformado.
  await assert.rejects(verifyFirebaseIdToken('abc.def', PROJECT, fetch, { jwks: { keys: [jwk] } }), /malformado/);
});

// ---------------------------------------------------------------- validação
test('validação de perfil: aceita valores válidos e rejeita os inválidos', () => {
  assert.deepEqual(validateProfileInput({ trainer_key: 'ash', nick: 'Bloody', team: 'Valor' }).value,
    { trainer_key: 'ash', nick: 'Bloody', team: 'valor' });
  assert.equal(validateProfileInput({ trainer_key: 'não-existe' }).ok, false);
  assert.equal(validateProfileInput({ nick: 'A' }).ok, false); // curto demais
  assert.equal(validateProfileInput({ nick: 'nome-muito-longo-demais-123' }).ok, false);
  assert.equal(validateProfileInput({ nick: 'nome@inválido!' }).ok, false);
  assert.equal(validateProfileInput({ team: 'rocket' }).ok, false);
  assert.equal(validateProfileInput({ team: 'mystic' }).ok, true);
  assert.equal(validateProfileInput({ nick: null, team: null }).ok, true);
  assert.equal(validateProfileInput(null).ok, false);
  assert.equal(sanitizeNick('Nome Válido 123'), 'Nome Válido 123');
  assert.equal(sanitizeNick('nome muito longo demais para nick'), null);
});

// ---------------------------------------------------------------- banco
test('banco: cria usuário, impede duplicata e persiste o perfil', () => {
  const dir = process.env.TMPDIR || '/tmp';
  const db = openDb(join(dir, `pulse-online-db-test-${Date.now()}`));
  const guest = createUser(db, { provider: 'guest', provider_id: null, email: null });
  assert.equal(guest.provider, 'guest');
  assert.equal(getUserByProvider(db, 'guest', guest.id)?.id, guest.id);
  assert.throws(() => createUser(db, { provider: 'guest', provider_id: guest.id, email: null }));
  const g = createUser(db, { provider: 'google', provider_id: 'uid-9', email: 'g@x.y' });
  assert.equal(getProfile(db, g.id).trainer_key, 'red');
  const p = upsertProfile(db, g.id, { trainer_key: 'cynthia', nick: 'Cyn', team: 'instinct' });
  assert.equal(p.trainer_key, 'cynthia');
  assert.equal(p.nick, 'Cyn');
  assert.equal(p.team, 'instinct');
  const p2 = upsertProfile(db, g.id, { nick: 'Cyn2' });
  assert.equal(p2.trainer_key, 'cynthia'); // mantém o que não foi enviado
  assert.equal(p2.nick, 'Cyn2');
  assert.equal(getCounts(db).users, 2);
  db.close();
});

// ---------------------------------------------------------------- HTTP (ponta a ponta)
test('HTTP: saúde, convidado, perfil, erros e esqueletos', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'pulse-online-http-'));
  const { server, db } = await createServer({ port: 0, dataDir: dir, firebaseProject: PROJECT });
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  const base = `http://127.0.0.1:${server.address().port}`;
  try {
    const health = await (await fetch(`${base}/api/health`)).json();
    assert.equal(health.ok, true);
    assert.equal(health.service, 'pulse-online');

    // Convidado cria conta + perfil num só passo.
    const guestRes = await fetch(`${base}/api/auth/guest`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ trainer_key: 'ash', nick: 'Bloody', team: 'valor' }),
    });
    assert.equal(guestRes.status, 201);
    const guest = await guestRes.json();
    assert.ok(guest.token);
    assert.equal(guest.profile.trainer_key, 'ash');
    assert.equal(guest.profile.team, 'valor');
    const auth = { authorization: `Bearer ${guest.token}` };

    // Perfil: lê, atualiza, lê de novo.
    const p1 = await (await fetch(`${base}/api/profile`, { headers: auth })).json();
    assert.equal(p1.profile.nick, 'Bloody');
    const put = await fetch(`${base}/api/profile`, {
      method: 'PUT',
      headers: { ...auth, 'content-type': 'application/json' },
      body: JSON.stringify({ team: 'mystic', nick: 'Bloody2' }),
    });
    assert.equal(put.status, 200);
    const p2 = await (await fetch(`${base}/api/profile`, { headers: auth })).json();
    assert.equal(p2.profile.team, 'mystic');
    assert.equal(p2.profile.nick, 'Bloody2');
    assert.equal(p2.profile.trainer_key, 'ash'); // não enviado = mantido

    // Erros: sem token, treinador inválido, nick inválido, nada para atualizar.
    assert.equal((await fetch(`${base}/api/profile`)).status, 401);
    assert.equal((await fetch(`${base}/api/profile`, { headers: { authorization: 'Bearer token-ruim' } })).status, 401);
    const badTrainer = await fetch(`${base}/api/profile`, {
      method: 'PUT', headers: { ...auth, 'content-type': 'application/json' },
      body: JSON.stringify({ trainer_key: 'não-existe' }),
    });
    assert.equal(badTrainer.status, 400);
    const badNick = await fetch(`${base}/api/profile`, {
      method: 'PUT', headers: { ...auth, 'content-type': 'application/json' },
      body: JSON.stringify({ nick: 'x' }),
    });
    assert.equal(badNick.status, 400);
    const empty = await fetch(`${base}/api/profile`, {
      method: 'PUT', headers: { ...auth, 'content-type': 'application/json' },
      body: JSON.stringify({}),
    });
    assert.equal(empty.status, 400);

    // Google com token inválido → 401 (o caminho positivo precisa de um ID Token real).
    const g = await fetch(`${base}/api/auth/google`, {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ id_token: 'não-é-um-token' }),
    });
    assert.equal(g.status, 401);

    // Amizades e ranking saíram do esqueleto: sem token dão 401 (não 501).
    for (const path of ['/api/friends', '/api/rankings/me', '/api/rankings/ladder', '/api/rankings/history']) {
      assert.equal((await fetch(`${base}${path}`)).status, 401);
    }
    // A arena saiu do esqueleto: sem token dá 401 (não 501).
    assert.equal((await fetch(`${base}/api/arena`)).status, 401);
    // Administração agora exige autenticação e autorização (sem esqueleto).
    assert.equal((await fetch(`${base}/api/admin/settings`)).status,401);
    assert.equal((await fetch(`${base}/api/não-existe`)).status, 404);
    // O banco registrou o convidado.
    assert.equal(getCounts(db).users, 1);
  } finally {
    server.close();
    db.close();
    await rm(dir, { recursive: true, force: true });
  }
});
