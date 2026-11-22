/* Mando móvil (LAN): empareja un teléfono por bus SSE (relay tools/relay.cjs) y:
   - alimenta el input del juego (G.input.joySet + touchDown/Up('action')),
   - abre el menú de pausa desde el teléfono (G.setPaused),
   - REFLEJA al teléfono los menús/decisiones clic-only (pausa, overlays y los
     bloques .decision del chat) como botones; al elegir en el teléfono, hace
     clic en el botón real del navegador.
   Requiere: npm run build && npm run relay. */
(function (root) {
  'use strict';
  const G = (root.G = root.G || {});
  if (typeof document === 'undefined') { G.RemotePad = { open() {}, hide() {}, disconnect() {} }; return; }
  const PID = 'remote';
  function code() { const a = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; let s = ''; for (let i = 0; i < 4; i++) s += a[Math.random() * a.length | 0]; return s; }

  let es = null, room = null, panel = null, curBox = null, lastSig = null, mo = null;

  function send(obj) { if (!room) return; fetch('/send?room=' + room + '&from=game', { method: 'POST', keepalive: true, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(obj) }).catch(() => {}); }

  // ---- recibir del teléfono ----
  function fromPad(m) {
    if (!G.input) return;
    if (m.t === 'joy') G.input.joySet(+m.x || 0, +m.y || 0);
    else if (m.t === 'act') m.down ? G.input.touchDown('action', PID) : G.input.touchUp('action', PID);
    else if (m.t === 'menu') { if (G.setPaused && G.canPause && G.canPause() || (G.setPaused && G.paused)) G.setPaused(!G.paused); scheduleScan(); }
    else if (m.t === 'pick') { const bs = curBox && curBox.querySelectorAll('button'); const b = bs && bs[m.i | 0]; if (b && !b.disabled) b.click(); scheduleScan(); }
    if (m.t === 'hello' || m.t === 'joy' || m.t === 'act' || m.t === 'menu' || m.t === 'pick') setStatus(true);
  }

  // ---- reflejar UI clic-only (pausa / overlay / decisión) ----
  function pickBox() {
    const pov = document.getElementById('pauseov');
    if (pov && pov.classList.contains('show')) { const b = pov.querySelector('.modal'); if (b) return { box: b, title: 'Pausa' }; }
    const ov = document.getElementById('overlay');
    if (ov && ov.classList.contains('show')) { const b = ov.querySelector('.modal'); if (b) return { box: b, title: ((b.querySelector('h1,h2') || {}).textContent || '').trim() }; }
    const dec = document.querySelectorAll('#msgs .decision');
    if (dec.length) { const b = dec[dec.length - 1]; const ask = b.querySelector('.ask'); return { box: b, title: ask ? ask.textContent.trim() : 'Elige una opción' }; }
    return null;
  }
  function label(btn) { const b = btn.querySelector('b'); let t = b ? b.textContent : btn.textContent; return (t || '').replace(/\s+/g, ' ').trim().slice(0, 70); }
  function scan() {
    const r = pickBox();
    if (!r) { if (curBox) { curBox = null; lastSig = null; send({ t: 'ui-end' }); } return; }
    const btns = Array.from(r.box.querySelectorAll('button'));
    if (!btns.length) { if (curBox) { curBox = null; lastSig = null; send({ t: 'ui-end' }); } return; } // sin botones = no reflejar
    const data = btns.map(b => ({ label: label(b), disabled: !!b.disabled }));
    const sig = r.title + '|' + data.map(d => d.label + (d.disabled ? '*' : '')).join('|');
    if (sig === lastSig && curBox === r.box) return;
    curBox = r.box; lastSig = sig; send({ t: 'ui', title: r.title, buttons: data });
  }
  let scanPend = false;
  function scheduleScan() { if (scanPend) return; scanPend = true; requestAnimationFrame(() => { scanPend = false; try { scan(); } catch (e) {} }); }

  async function open() {
    if (panel) { panel.style.display = 'flex'; return; }
    let lan = null; try { lan = await fetch('/lan').then(r => r.json()); } catch (e) {}
    if (!lan) { alert('El mando necesita el servidor relay.\nEn tu computadora:\n  npm run build && npm run relay'); return; }
    room = code();
    build('http://' + lan.ip + ':' + lan.port + '/control?room=' + room);
    es = new EventSource('/events?room=' + room + '&role=game');
    es.onmessage = (e) => { try { fromPad(JSON.parse(e.data)); } catch (x) {} };
    mo = new MutationObserver(scheduleScan);
    for (const id of ['msgs', 'pauseov', 'overlay']) { const n = document.getElementById(id); if (n) mo.observe(n, { subtree: true, childList: true, attributes: true, attributeFilter: ['class'] }); }
    scheduleScan();
  }
  function hide() { if (panel) panel.style.display = 'none'; }   // mantiene la conexión viva
  function disconnect() { if (es) { es.close(); es = null; } if (mo) { mo.disconnect(); mo = null; } try { G.input.joySet(0, 0); G.input.touchUp('action', PID); } catch (e) {} hide(); }

  function setStatus(on) { if (panel) { const s = panel.querySelector('.rp-status'); if (s) s.textContent = on ? 'Teléfono conectado ✓' : 'Esperando teléfono…'; } }
  function build(url) {
    styles();
    panel = document.createElement('div'); panel.className = 'rp-panel';
    panel.innerHTML =
      '<div class="rp-box"><div class="rp-title">📱 Tu teléfono como mando</div>' +
      '<div class="rp-sub">Escanea con la cámara del teléfono (<b>misma Wi-Fi</b>):</div>' +
      '<img class="rp-qr" alt="QR del mando"><div class="rp-sub">o abre la dirección a mano:</div>' +
      '<div class="rp-url"></div><div class="rp-status">Esperando teléfono…</div>' +
      '<button class="rp-close">Empezar a jugar</button></div>';
    panel.querySelector('.rp-url').textContent = url;
    panel.querySelector('.rp-qr').src = '/qr?data=' + encodeURIComponent(url);
    panel.querySelector('.rp-close').onclick = hide;
    document.body.appendChild(panel);
  }
  function styles() {
    if (document.getElementById('rp-css')) return;
    const s = document.createElement('style'); s.id = 'rp-css';
    s.textContent =
      '.rp-panel{position:fixed;inset:0;background:rgba(10,8,16,.88);display:flex;align-items:center;justify-content:center;z-index:9999;font-family:system-ui,sans-serif}' +
      '.rp-box{background:#1a1626;border:1px solid #3a3350;border-radius:14px;padding:22px 26px;max-width:92vw;text-align:center;color:#e8e4f0}' +
      '.rp-title{font-size:18px;font-weight:700;margin-bottom:6px}.rp-sub{font-size:13px;color:#9a8fb8;margin-bottom:10px}' +
      '.rp-qr{width:220px;height:220px;background:#fff;border-radius:10px;padding:8px;margin:4px auto 12px;display:block}' +
      '.rp-url{font-size:14px;font-weight:700;color:#6fd3ff;background:#120f1b;border-radius:8px;padding:12px;word-break:break-all;margin-bottom:12px}' +
      '.rp-status{font-size:14px;color:#ffb86b;margin:8px 0 14px}' +
      '.rp-close{background:#6fd3ff;color:#0a1a22;font-weight:700;border:0;border-radius:8px;padding:10px 22px;font-size:15px;cursor:pointer}' +
      '.rp-open{position:fixed;left:10px;bottom:10px;z-index:9998;background:#1a1626;border:1px solid #3a3350;color:#e8e4f0;border-radius:10px;padding:8px 12px;font-size:13px;cursor:pointer;opacity:.82}';
    document.head.appendChild(s);
  }
  function addButton() { styles(); const b = document.createElement('button'); b.className = 'rp-open'; b.textContent = '📱 Mando'; b.onclick = open; document.body.appendChild(b); }
  if (document.readyState !== 'loading') addButton(); else document.addEventListener('DOMContentLoaded', addButton);

  window.addEventListener('beforeunload', disconnect);
  G.RemotePad = { open, hide, disconnect };
})(typeof window !== 'undefined' ? window : globalThis);
