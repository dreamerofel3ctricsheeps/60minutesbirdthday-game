/* Relay del «mando móvil» como Worker independiente (modo online).
   La vía de Durable Objects dentro del proyecto de Pages no permite
   registrar la clase por la API de subida (la migración se ignora), así
   que el relay vive en su propio Worker, donde la clase RelayRoom y su
   migración se declaran en la misma subida del script.
   Protocolo idéntico a tools/relay.cjs (que SIGUE siendo el relay LAN):
     GET  /events?room=R&role=game|pad → SSE («: ok» al conectar, ping 20 s)
     POST /send?room=R&from=game|pad   → reenvía al otro rol; {"peers": n}
     GET  /control → la página del mando (módulo de texto control.html)
     GET  /qr?data= → QR en SVG (librería qrcode.js concatenada antes)
     GET  /lan     → {"ip","port","url"} del origen del relay
   El juego (otro origen) lo consume con CORS abierto: la única llave es
   el código de sala, como en LAN. */
import CONTROL_HTML from './control.html';

const SSE_HEADERS = {
  'Content-Type': 'text/event-stream',
  'Cache-Control': 'no-cache',
  'Connection': 'keep-alive',
};
const CORS = { 'Access-Control-Allow-Origin': '*' };

export class RelayRoom {
  constructor(state, env) {
    this.state = state;
    this.peers = { game: new Set(), pad: new Set() };
    this.timer = null;
  }

  _armPing() {
    if (this.timer) return;
    this.timer = setInterval(() => {
      for (const role of ['game', 'pad']) {
        for (const w of [...this.peers[role]]) this._write(w, ': ping\n\n', role);
      }
      if (!this.peers.game.size && !this.peers.pad.size) {
        clearInterval(this.timer);
        this.timer = null;
      }
    }, 20000);
  }

  _write(writer, text, role) {
    try {
      const p = writer.write(new TextEncoder().encode(text));
      if (p && p.catch) p.catch(() => this.peers[role].delete(writer));
    } catch (e) {
      this.peers[role].delete(writer);
    }
  }

  async fetch(request) {
    const url = new URL(request.url);
    if (url.pathname === '/events') {
      const role = url.searchParams.get('role') === 'game' ? 'game' : 'pad';
      const ts = new TransformStream();
      const writer = ts.writable.getWriter();
      this.peers[role].add(writer);
      this._armPing();
      this._write(writer, ': ok\n\n', role);
      if (request.signal) {
        request.signal.addEventListener('abort', () => {
          this.peers[role].delete(writer);
          try { writer.close(); } catch (e) {}
        });
      }
      return new Response(ts.readable, { headers: SSE_HEADERS });
    }
    if (url.pathname === '/send' && request.method === 'POST') {
      const from = url.searchParams.get('from') === 'game' ? 'game' : 'pad';
      const dest = from === 'game' ? 'pad' : 'game';
      const body = await request.text();
      if (body.length > 200000) return new Response('payload too large', { status: 413 });
      let n = 0;
      for (const w of [...this.peers[dest]]) {
        this._write(w, `data: ${body}\n\n`, dest);
        n++;
      }
      return new Response(JSON.stringify({ peers: n }),
        { headers: { 'Content-Type': 'application/json' } });
    }
    return new Response('not found', { status: 404 });
  }
}

function qrSvg(text) {
  const qr = qrcode(0, 'M');
  qr.addData(text || '');
  qr.make();
  const total = qr.getModuleCount() + 2;
  const cell = Math.max(1, Math.floor(240 / total));
  return qr.createSvgTag(cell, cell);
}

function withCors(res) {
  const headers = new Headers(res.headers);
  for (const [k, v] of Object.entries(CORS)) headers.set(k, v);
  return new Response(res.body, { status: res.status, headers });
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const p = url.pathname;

    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: {
          ...CORS,
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
          'Access-Control-Max-Age': '86400',
        },
      });
    }
    if (p === '/events' || p === '/send') {
      if (!env.RELAY_ROOM) {
        return new Response(
          JSON.stringify({ error: 'relay no configurado: falta el binding RELAY_ROOM' }),
          { status: 503, headers: { 'Content-Type': 'application/json', ...CORS } });
      }
      const room = url.searchParams.get('room') || 'default';
      const stub = env.RELAY_ROOM.get(env.RELAY_ROOM.idFromName(room));
      return withCors(await stub.fetch(request));
    }
    if (p === '/lan') {
      return new Response(
        JSON.stringify({ ip: url.hostname, port: 443, url: url.origin }),
        { headers: { 'Content-Type': 'application/json', ...CORS } });
    }
    if (p === '/qr') {
      try {
        return new Response(qrSvg(url.searchParams.get('data') || ''), {
          headers: { 'Content-Type': 'image/svg+xml', 'Cache-Control': 'no-cache', ...CORS },
        });
      } catch (e) {
        return new Response('qr error', { status: 500, headers: CORS });
      }
    }
    if (p === '/control') {
      return new Response(CONTROL_HTML, {
        headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-cache', ...CORS },
      });
    }
    return new Response('not found', { status: 404, headers: CORS });
  },
};
