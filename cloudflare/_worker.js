/* Relay en Cloudflare para el «mando móvil» (modo online): Pages en modo
   avanzado (_worker.js) + un Durable Object por sala.
   Espejo fiel de tools/relay.cjs, que SIGUE siendo el relay de LAN:
     GET  /events?room=R&role=game|pad → SSE; al conectar manda «: ok» y un
          «: ping» cada 20 s; cada mensaje llega como «data: <cuerpo>».
     POST /send?room=R&from=game|pad   → reenvía el cuerpo TAL CUAL al otro
          rol de la sala y responde {"peers": n} (n = destinatarios).
     GET  /control → la página del mando (asset control.html).
     GET  /qr?data= → QR en SVG del texto pedido (librería qrcode.js).
     GET  /lan     → {"ip","port","url"} del origen público.
     Todo lo demás → assets estáticos del juego (env.ASSETS), con caída a
          index.html en rutas sin extensión, como el relay local.
   El cliente (remote-pad.js y control.html) no cambia de protocolo: usa
   rutas relativas al mismo origen, así que el mismo build sirve en LAN
   (relay.cjs) y en internet (este worker).
   El archivo desplegado concatena ANTES de este código la librería
   qrcode.js (Kazuhiko Arase, MIT); ver cloudflare/README.md. */

const SSE_HEADERS = {
  'Content-Type': 'text/event-stream',
  'Cache-Control': 'no-cache',
  'Connection': 'keep-alive',
};

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
  const qr = qrcode(0, 'M'); // tipo 0 = autodetectar tamaño; nivel M, como el paquete qrcode
  qr.addData(text || '');
  qr.make();
  const total = qr.getModuleCount() + 2; // margen de 1 módulo, igual que relay.cjs
  const cell = Math.max(1, Math.floor(240 / total));
  return qr.createSvgTag(cell, cell);
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const p = url.pathname;

    if (p === '/events' || p === '/send') {
      if (!env.RELAY_ROOM) {
        return new Response(
          JSON.stringify({ error: 'relay no configurado: falta el binding RELAY_ROOM' }),
          { status: 503, headers: { 'Content-Type': 'application/json' } });
      }
      const room = url.searchParams.get('room') || 'default';
      const stub = env.RELAY_ROOM.get(env.RELAY_ROOM.idFromName(room));
      return stub.fetch(request);
    }
    if (p === '/lan') {
      return new Response(
        JSON.stringify({ ip: url.hostname, port: 443, url: url.origin }),
        { headers: { 'Content-Type': 'application/json' } });
    }
    if (p === '/qr') {
      try {
        return new Response(qrSvg(url.searchParams.get('data') || ''), {
          headers: { 'Content-Type': 'image/svg+xml', 'Cache-Control': 'no-cache' },
        });
      } catch (e) {
        return new Response('qr error', { status: 500 });
      }
    }
    if (p === '/control') {
      const res = await env.ASSETS.fetch(new URL('/control.html', url.origin));
      if (res.status === 200) {
        return new Response(res.body, {
          headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-cache' },
        });
      }
      return new Response('control no encontrado', { status: 404 });
    }
    // Estáticos del juego; caída a index.html como el relay local.
    const res = await env.ASSETS.fetch(request);
    if (res.status === 404 && request.method === 'GET' && !/\.[a-z0-9]+$/i.test(p)) {
      return env.ASSETS.fetch(new URL('/index.html', url.origin));
    }
    return res;
  },
};
