#!/usr/bin/env node
/* Relay LAN para el «mando móvil» (misma Wi-Fi). Node puro, sin dependencias.
   Sirve el juego (dist/) + la página /control, y retransmite el input del
   teléfono al juego por sala (SSE game<-, POST ->phone). Corre: npm run relay
   (antes: npm run build). */
const http = require('http'), fs = require('fs'), path = require('path'), os = require('os');
const PORT = Number(process.env.PORT) || 3001;
const DIST = path.join(__dirname, '..', 'dist');
const CONTROL = path.join(__dirname, 'control.html');
let QR = null; try { QR = require('qrcode'); } catch (e) {} // generador de QR (opcional)
const rooms = new Map(); // room -> Set<res> (suscriptores SSE = el juego)
const MIME = { '.html':'text/html', '.js':'text/javascript', '.css':'text/css', '.png':'image/png',
  '.svg':'image/svg+xml', '.json':'application/json', '.webmanifest':'application/manifest+json',
  '.ico':'image/x-icon', '.mp3':'audio/mpeg', '.ogg':'audio/ogg', '.webp':'image/webp', '.woff2':'font/woff2' };

function lanIP() {
  for (const ifs of Object.values(os.networkInterfaces()))
    for (const i of ifs) if (i.family === 'IPv4' && !i.internal) return i.address;
  return 'localhost';
}
function sendFile(res, file, fallback) {
  fs.readFile(file, (err, data) => {
    if (err) { if (fallback) return sendFile(res, fallback); res.writeHead(404); return res.end('not found'); }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(file)] || 'application/octet-stream' });
    res.end(data);
  });
}
http.createServer((req, res) => {
  const u = new URL(req.url, 'http://x'); const p = u.pathname;
  if (p === '/qr') { // QR del emparejamiento (SVG); degrada si qrcode no está
    if (!QR) { res.writeHead(503); return res.end('qrcode no instalado (npm install)'); }
    QR.toString(u.searchParams.get('data') || '', { type: 'svg', margin: 1, width: 240 }, (err, svg) => {
      if (err) { res.writeHead(500); return res.end('qr error'); }
      res.writeHead(200, { 'Content-Type': 'image/svg+xml', 'Cache-Control': 'no-cache' }); res.end(svg);
    });
    return;
  }
  if (p === '/lan') { res.writeHead(200, { 'Content-Type':'application/json' }); return res.end(JSON.stringify({ ip: lanIP(), port: PORT })); }
  if (p === '/control') return sendFile(res, CONTROL);
  if (p === '/events') { // el juego se suscribe a su sala
    const room = u.searchParams.get('room') || 'default';
    res.writeHead(200, { 'Content-Type':'text/event-stream', 'Cache-Control':'no-cache', 'Connection':'keep-alive' });
    res.write(': ok\n\n');
    let set = rooms.get(room) || rooms.set(room, new Set()).get(room); set.add(res);
    const ping = setInterval(() => res.write(': ping\n\n'), 20000);
    req.on('close', () => { clearInterval(ping); set.delete(res); if (!set.size) rooms.delete(room); });
    return;
  }
  if (p === '/input' && req.method === 'POST') { // el teléfono manda input
    const room = u.searchParams.get('room') || 'default'; let body = '';
    req.on('data', c => { body += c; if (body.length > 1e4) req.destroy(); });
    req.on('end', () => {
      const set = rooms.get(room); const connected = !!(set && set.size);
      if (set) for (const r of set) r.write(`data: ${body}\n\n`);
      res.writeHead(200, { 'Content-Type':'application/json' }); res.end(JSON.stringify({ connected }));
    });
    return;
  }
  // estático: dist/ (SPA fallback a index.html)
  const file = path.join(DIST, p === '/' ? 'index.html' : decodeURIComponent(p).replace(/^\/+/, ''));
  if (!file.startsWith(DIST)) { res.writeHead(403); return res.end(); }
  fs.stat(file, (err, st) => (!err && st.isFile()) ? sendFile(res, file) : sendFile(res, path.join(DIST, 'index.html')));
}).listen(PORT, '0.0.0.0', () => {
  console.log(`\n  📱 Mando LAN — relay en marcha\n  Esta máquina:   http://localhost:${PORT}\n  Misma Wi-Fi:    http://${lanIP()}:${PORT}\n  (sirve dist/ — corre 'npm run build' antes)\n`);
});
