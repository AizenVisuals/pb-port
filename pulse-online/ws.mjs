// WebSocket mínimo (RFC 6455), Node puro, zero dependências.
// Só o que a arena precisa: handshake, frames de texto (com continuação),
// ping/pong, close. Payload máximo 64 KiB (igual ao HTTP do pulse-online).
// O servidor nunca mascara (só o cliente mascara, como manda o protocolo).
import { createHash } from 'node:crypto';

const GUID = '258EAFA5-E914-47DA-95CA-C5AB0DC85B11';
export const WS_MAX_PAYLOAD = 64 * 1024;

function acceptKey(key) {
  return createHash('sha1').update(key + GUID).digest('base64');
}

// Codifica um frame de texto do servidor (sem máscara).
export function encodeFrame(text) {
  const payload = Buffer.from(text, 'utf8');
  const len = payload.length;
  let header;
  if (len < 126) {
    header = Buffer.from([0x81, len]);
  } else if (len < 65536) {
    header = Buffer.alloc(4);
    header[0] = 0x81; header[1] = 126;
    header.writeUInt16BE(len, 2);
  } else {
    header = Buffer.alloc(10);
    header[0] = 0x81; header[1] = 127;
    header.writeBigUInt64BE(BigInt(len), 2);
  }
  return Buffer.concat([header, payload]);
}

function encodeClose(code = 1000, reason = '') {
  const payload = Buffer.alloc(2 + Buffer.byteLength(reason));
  payload.writeUInt16BE(code, 0);
  payload.write(reason, 2);
  return Buffer.concat([Buffer.from([0x88, payload.length]), payload]);
}

// Parser de frames do cliente (com máscara obrigatória, como manda o RFC).
// `onMessage(text)` a cada mensagem completa; `onControl` para ping/close.
export function createFrameParser({ onMessage, onPing, onClose, onError, maxPayload = WS_MAX_PAYLOAD }) {
  let buf = Buffer.alloc(0);
  let fragments = [];
  const fail = (code, reason) => { onError(new Error(reason), code); };
  return {
    push(chunk) {
      buf = Buffer.concat([buf, chunk]);
      for (;;) {
        if (buf.length < 2) return;
        const fin = (buf[0] & 0x80) !== 0;
        const opcode = buf[0] & 0x0f;
        const masked = (buf[1] & 0x80) !== 0;
        let len = buf[1] & 0x7f;
        let off = 2;
        if (len === 126) {
          if (buf.length < 4) return;
          len = buf.readUInt16BE(2); off = 4;
        } else if (len === 127) {
          if (buf.length < 10) return;
          const big = buf.readBigUInt64BE(2);
          if (big > BigInt(maxPayload)) return fail(1009, 'payload grande demais');
          len = Number(big); off = 10;
        }
        if (len > maxPayload) return fail(1009, 'payload grande demais');
        if (!masked) return fail(1002, 'frame do cliente sem máscara');
        if (buf.length < off + 4 + len) return;
        const mask = buf.subarray(off, off + 4);
        const data = Buffer.from(buf.subarray(off + 4, off + 4 + len));
        for (let i = 0; i < data.length; i++) data[i] ^= mask[i % 4];
        buf = buf.subarray(off + 4 + len);
        if (opcode === 0x8) { onClose(data.length >= 2 ? data.readUInt16BE(0) : 1005); return; }
        if (opcode === 0x9) { onPing(data); continue; }
        if (opcode === 0xa) continue; // pong: ignora
        if (opcode === 0x2) return fail(1003, 'frame binário não aceito');
        if (opcode !== 0x1 && opcode !== 0x0) return fail(1002, 'opcode inválido');
        fragments.push(data);
        if (fin) {
          const text = Buffer.concat(fragments).toString('utf8');
          fragments = [];
          onMessage(text);
        }
      }
    },
  };
}

// Anexa o WebSocket a um http.Server. `paths` = caminhos que aceitam upgrade
// (ex.: ['/api/arena/ws']). `onConnection(socket, req)` a cada upgrade aceito.
// O socket expõe: send(text), close(code, reason), onMessage/onClose/onError
// (callbacks, não EventEmitter — o servidor não depende de nada além de Node).
export function attachWebSocketServer(httpServer, { paths = [], onConnection }) {
  httpServer.on('upgrade', (req, socket, head) => {
    const url = new URL(req.url, 'http://localhost');
    if (!paths.includes(url.pathname)) { socket.destroy(); return; }
    const key = req.headers['sec-websocket-key'];
    const version = req.headers['sec-websocket-version'];
    if (!key || version !== '13' || !/^[A-Za-z0-9+/=]{16,32}$/.test(key.trim())) {
      socket.write('HTTP/1.1 400 Bad Request\r\n\r\n');
      socket.destroy();
      return;
    }
    socket.write(
      'HTTP/1.1 101 Switching Protocols\r\n' +
      'Upgrade: websocket\r\n' +
      'Connection: Upgrade\r\n' +
      `Sec-WebSocket-Accept: ${acceptKey(key.trim())}\r\n\r\n`
    );
    if (head?.length) socket.unshift(head);
    let closed = false, notified = false;
    const finishClose=()=>{if(notified)return;notified=true;closed=true;ws.readyState=3;ws.onClose?.();};
    const ws = {
      readyState: 1,
      onMessage: null, onClose: null, onError: null,
      send(text) {
        if (closed || socket.destroyed) return false;
        try { socket.write(encodeFrame(text)); return true; } catch { return false; }
      },
      close(code = 1000, reason = '') {
        if (closed) return;
        closed = true;
        try { socket.write(encodeClose(code, reason)); } catch { /* já foi */ }
        socket.end();
        finishClose();
      },
    };
    const parser = createFrameParser({
      onMessage: (text) => ws.onMessage?.(text),
      onPing: (data) => {
        // Pong com o mesmo payload.
        try { socket.write(Buffer.concat([Buffer.from([0x8a, data.length]), data])); } catch { /* já foi */ }
      },
      onClose: (code) => { if(!closed){try{socket.write(encodeClose(code===1005?1000:code,''));}catch{}socket.end();}finishClose(); },
      onError: (err, code) => {
        ws.onError?.(err);
        try { socket.write(encodeClose(code || 1002, err.message.slice(0, 100))); } catch { /* já foi */ }
        socket.destroy();
      },
    });
    socket.on('data', (chunk) => { try { parser.push(chunk); } catch { /* parser já tratou */ } });
    socket.on('close', finishClose);
    socket.on('error', (err) => ws.onError?.(err));
    onConnection(ws, req);
  });
}
