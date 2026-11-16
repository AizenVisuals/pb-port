// Debug do WS: 1) echo puro no ws.mjs; 2) hello no servidor real.
import http from 'node:http';
import WebSocket from 'ws';
import { attachWebSocketServer } from './ws.mjs';
import { createServer } from './server.mjs';
import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

// --- 1) echo puro
{
  const srv = http.createServer((req, res) => { res.end('ok'); });
  attachWebSocketServer(srv, {
    paths: ['/ws'],
    onConnection: (ws) => {
      console.log('[echo] conexão aceita');
      ws.onMessage = (text) => { console.log('[echo] recebeu:', text); ws.send('eco:' + text); };
      ws.onClose = () => console.log('[echo] fechou');
      ws.onError = (e) => console.log('[echo] erro:', e.message);
    },
  });
  await new Promise((r) => srv.listen(0, '127.0.0.1', r));
  const port = srv.address().port;
  const c = new WebSocket(`ws://127.0.0.1:${port}/ws`);
  c.on('open', () => { console.log('[echo] cliente aberto'); c.send('ola'); });
  c.on('message', (d) => console.log('[echo] cliente recebeu:', d.toString()));
  c.on('error', (e) => console.log('[echo] cliente erro:', e.message));
  c.on('close', (code) => console.log('[echo] cliente fechou:', code));
  await wait(1500);
  c.close();
  srv.close();
}

// --- 2) hello no servidor real (pool de teste pequeno)
{
  const pool = { version: 1, source: 'debug', bands: { S: 12, A: 22, B: 8, C: 8 }, pool: [] };
  for (const [band, n] of [['S', 12], ['A', 22], ['B', 8], ['C', 8]]) {
    for (let i = 1; i <= n; i++) pool.pool.push({ key: `${band.toLowerCase()}${String(i).padStart(2, '0')}`, band, bst: 500 });
  }
  const dir = await mkdtemp(join(tmpdir(), 'pulse-ws-debug-'));
  const { server, db } = await createServer({ port: 0, dataDir: dir, firebaseProject: 'pulse-arena-pb', arenaPool: pool });
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  const base = `http://127.0.0.1:${server.address().port}`;
  const g = await (await fetch(`${base}/api/auth/guest`, {
    method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ trainer_key: 'ash', nick: 'WsDebug', team: 'valor' }),
  })).json();
  console.log('[srv] convidado criado:', !!g.token);
  const c = new WebSocket(base.replace(/^http/, 'ws') + '/api/arena/ws');
  c.on('open', () => { console.log('[srv] cliente aberto'); c.send(JSON.stringify({ t: 'hello', token: g.token })); });
  c.on('message', (d) => console.log('[srv] cliente recebeu:', d.toString()));
  c.on('error', (e) => console.log('[srv] cliente erro:', e.message));
  c.on('close', (code, reason) => console.log('[srv] cliente fechou:', code, reason.toString()));
  await wait(3000);
  c.close();
  server.close();
  db.close();
}
console.log('fim do debug');
