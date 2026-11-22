/* Mando móvil (LAN): empareja un teléfono por SSE y alimenta el input del
   juego (G.input.joySet + touchDown/Up('action')). Requiere el relay
   (tools/relay.cjs): npm run build && npm run relay. */
(function (root) {
  'use strict';
  const G = (root.G = root.G || {});
  if (typeof document === 'undefined') { G.RemotePad = { open() {}, close() {} }; return; }
  const PID = 'remote';

  function code() { const a = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; let s = ''; for (let i = 0; i < 4; i++) s += a[Math.random() * a.length | 0]; return s; }

  let es = null, room = null, panel = null;

  function apply(m) {
    if (!G.input) return;
    if (m.t === 'joy') G.input.joySet(+m.x || 0, +m.y || 0);
    else if (m.t === 'act') m.down ? G.input.touchDown('action', PID) : G.input.touchUp('action', PID);
    if (m.t === 'hello' || m.t === 'joy' || m.t === 'act') setStatus(true);
  }
  function release() { try { G.input.joySet(0, 0); G.input.touchUp('action', PID); } catch (e) {} }
  function setStatus(on) { if (panel) panel.querySelector('.rp-status').textContent = on ? 'Teléfono conectado ✓' : 'Esperando teléfono…'; }

  async function open() {
    if (panel) { panel.style.display = 'flex'; return; }
    let lan = null;
    try { lan = await fetch('/lan').then(r => r.json()); } catch (e) {}
    if (!lan) { alert('El mando necesita el servidor relay.\nEn tu computadora:\n  npm run build && npm run relay\nAbre la URL que muestra y reintenta.'); return; }
    room = code();
    const url = 'http://' + lan.ip + ':' + lan.port + '/control?room=' + room;
    build(url);
    es = new EventSource('/events?room=' + room);
    es.onmessage = (e) => { try { apply(JSON.parse(e.data)); } catch (x) {} };
  }
  function close() { if (es) { es.close(); es = null; } release(); if (panel) panel.style.display = 'none'; }

  function build(url) {
    styles();
    panel = document.createElement('div');
    panel.className = 'rp-panel';
    panel.innerHTML =
      '<div class="rp-box"><div class="rp-title">📱 Tu teléfono como mando</div>' +
      '<div class="rp-sub">En un teléfono en la <b>misma Wi-Fi</b>, abre esta dirección:</div>' +
      '<div class="rp-url"></div><div class="rp-status">Esperando teléfono…</div>' +
      '<button class="rp-close">Cerrar</button></div>';
    panel.querySelector('.rp-url').textContent = url;
    panel.querySelector('.rp-close').onclick = close;
    document.body.appendChild(panel);
  }
  function styles() {
    if (document.getElementById('rp-css')) return;
    const s = document.createElement('style'); s.id = 'rp-css';
    s.textContent =
      '.rp-panel{position:fixed;inset:0;background:rgba(10,8,16,.88);display:flex;align-items:center;justify-content:center;z-index:9999;font-family:system-ui,sans-serif}' +
      '.rp-box{background:#1a1626;border:1px solid #3a3350;border-radius:14px;padding:22px 26px;max-width:92vw;text-align:center;color:#e8e4f0}' +
      '.rp-title{font-size:18px;font-weight:700;margin-bottom:6px}.rp-sub{font-size:13px;color:#9a8fb8;margin-bottom:10px}' +
      '.rp-url{font-size:16px;font-weight:700;color:#6fd3ff;background:#120f1b;border-radius:8px;padding:12px;word-break:break-all;margin-bottom:12px}' +
      '.rp-status{font-size:14px;color:#ffb86b;margin:8px 0 14px}' +
      '.rp-close{background:#3a3350;color:#e8e4f0;border:0;border-radius:8px;padding:8px 18px;font-size:14px;cursor:pointer}' +
      '.rp-open{position:fixed;left:10px;bottom:10px;z-index:9998;background:#1a1626;border:1px solid #3a3350;color:#e8e4f0;border-radius:10px;padding:8px 12px;font-size:13px;cursor:pointer;opacity:.82}';
    document.head.appendChild(s);
  }
  function addButton() { styles(); const b = document.createElement('button'); b.className = 'rp-open'; b.textContent = '📱 Mando'; b.onclick = open; document.body.appendChild(b); }
  if (document.readyState !== 'loading') addButton(); else document.addEventListener('DOMContentLoaded', addButton);

  G.RemotePad = { open, close };
})(typeof window !== 'undefined' ? window : globalThis);
