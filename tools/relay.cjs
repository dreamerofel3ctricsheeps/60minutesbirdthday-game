#!/usr/bin/env node
/* Relay LAN para el «mando móvil» (misma Wi-Fi). Node puro, sin dependencias.
   Bus por salas con DOS roles (game / pad): cada POST /send se reenvía al OTRO
   rol de la sala. Sirve el juego (dist/) + /control + QR. Corre: npm run relay
   (antes: npm run build). */
const http = require('http'), fs = require('fs'), path = require('path'), os = require('os');
let QR = null; try { QR = require('qrcode'); } catch (e) {}
const PORT = Number(process.env.PORT) || 3001;
const DIST = path.join(__dirname, '..', 'dist');
const CONTROL = path.join(__dirname, 'control.html');
const rooms = new Map(); // room -> { game:Set<res>, pad:Set<res> }
function room(r) { let o = rooms.get(r); if (!o) rooms.set(r, o = { game: new Set(), pad: new Set() }); return o; }
const MIME = { '.html':'text/html', '.js':'text/javascript', '.css':'text/css', '.png':'image/png',
  '.svg':'image/svg+xml', '.json':'application/json', '.webmanifest':'application/manifest+json',
  '.ico':'image/x-icon', '.mp3':'audio/mpeg', '.ogg':'audio/ogg', '.webp':'image/webp', '.woff2':'font/woff2' };
function lanIP() { for (const ifs of Object.values(os.networkInterfaces())) for (const i of ifs) if (i.family === 'IPv4' && !i.internal) return i.address; return 'localhost'; }
function sendFile(res, file) { fs.readFile(file, (e, d) => { if (e) { res.writeHead(404); return res.end('not found'); } res.writeHead(200, { 'Content-Type': MIME[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-cache' }); res.end(d); }); }

http.createServer((req, res) => {
  const u = new URL(req.url, 'http://x'); const p = u.pathname;
  if (p === '/lan') { res.writeHead(200, { 'Content-Type':'application/json' }); return res.end(JSON.stringify({ ip: lanIP(), port: PORT })); }
  if (p === '/qr') {
    if (!QR) { res.writeHead(503); return res.end('qrcode no instalado'); }
    QR.toString(u.searchParams.get('data') || '', { type:'svg', margin:1, width:240 }, (e, svg) => {
      if (e) { res.writeHead(500); return res.end('qr error'); }
      res.writeHead(200, { 'Content-Type':'image/svg+xml', 'Cache-Control':'no-cache' }); res.end(svg);
    }); return;
  }
  if (p === '/control') return sendFile(res, CONTROL);
  if (p === '/events') { // SSE: el juego (role=game) o el teléfono (role=pad) se suscriben
    const rm = u.searchParams.get('room') || 'default', role = u.searchParams.get('role') === 'game' ? 'game' : 'pad';
    res.writeHead(200, { 'Content-Type':'text/event-stream', 'Cache-Control':'no-cache', 'Connection':'keep-alive' });
    res.write(': ok\n\n');
    const o = room(rm); o[role].add(res);
    const ping = setInterval(() => res.write(': ping\n\n'), 20000);
    req.on('close', () => { clearInterval(ping); o[role].delete(res); if (!o.game.size && !o.pad.size) rooms.delete(rm); });
    return;
  }
  if (p === '/send' && req.method === 'POST') { // reenvía al OTRO rol de la sala
    const rm = u.searchParams.get('room') || 'default', from = u.searchParams.get('from') === 'game' ? 'game' : 'pad';
    let body = ''; req.on('data', c => { body += c; if (body.length > 2e5) req.destroy(); });
    req.on('end', () => {
      const o = rooms.get(rm); const dest = o && (from === 'game' ? o.pad : o.game);
      const peers = dest ? dest.size : 0;
      if (dest) for (const r of dest) r.write(`data: ${body}\n\n`);
      res.writeHead(200, { 'Content-Type':'application/json' }); res.end(JSON.stringify({ peers }));
    });
    return;
  }
  const file = path.join(DIST, p === '/' ? 'index.html' : decodeURIComponent(p).replace(/^\/+/, ''));
  if (!file.startsWith(DIST)) { res.writeHead(403); return res.end(); }
  fs.stat(file, (e, st) => (!e && st.isFile()) ? sendFile(res, file) : sendFile(res, path.join(DIST, 'index.html')));
}).listen(PORT, '0.0.0.0', () => {
  console.log(`\n  📱 Mando LAN — relay en marcha\n  Esta máquina: http://localhost:${PORT}\n  Misma Wi-Fi:  http://${lanIP()}:${PORT}\n  (sirve dist/ — corre 'npm run build' antes)\n`);
});
