/* ============================================================
   EASTER EGG «LA CITA» — Parte 1 (feat/easter-egg-cita)
   Modo secreto: se controla a XIMENA en el departamento con
   todos escondidos, sale por la puerta principal y llega a la
   plaza de CDMX (capas parallax + recorte de foto real).
   Especificación: goals/1-minuto-para-la-fiesta/files/
   tecnico-easter-egg-la-cita-v1.md

   - Estado propio en D: NO toca G.S salvo S.phase ('date').
   - Reloj maestro: el <audio> de la canción (assets/audio/,
     FUERA de git); si el archivo no está, reloj de respaldo
     con performance.now() y la secuencia corre en silencio.
   - En esta parte solo se ejecutan la APERTURA (depa, sin
     reloj: la cita arranca al abrir la puerta) y la LLEGADA
     a la plaza (revelado de ~4 s). El resto de la tabla se
     ejecutará en las partes siguientes.
   ============================================================ */
(function () {
  'use strict';
  const G = window.G, W = G.World, Sp = G.Sprites;
  const $ = (s) => document.querySelector(s);

  // ---------- El código: solo vive su hash SHA-256 ----------
  let CODE_HASH = 'd8e814928b57cdc2c67ad4cd654968d5c37c4bd482f3c87b600b48d11f95f42d';

  // SHA-256 (FIPS 180-4) en JS puro: la verificación no puede
  // depender de crypto.subtle (ausente en contextos no seguros
  // y en el humo de Node); esta implementación es la única vía
  // y el humo la ejercita con vectores conocidos.
  function sha256hex(ascii) {
    const rr = (v, a) => (v >>> a) | (v << (32 - a));
    const K = [
      0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
      0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
      0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
      0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
      0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
      0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
      0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
      0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
    ];
    let H = [0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19];
    const bytes = [];
    for (let i = 0; i < ascii.length; i++) {
      const c = ascii.charCodeAt(i);
      if (c < 0x80) bytes.push(c);
      else if (c < 0x800) bytes.push(0xc0 | (c >> 6), 0x80 | (c & 63));
      else bytes.push(0xe0 | (c >> 12), 0x80 | ((c >> 6) & 63), 0x80 | (c & 63));
    }
    const bitLen = bytes.length * 8;
    bytes.push(0x80);
    while (bytes.length % 64 !== 56) bytes.push(0);
    bytes.push(0, 0, 0, 0, (bitLen >>> 24) & 255, (bitLen >>> 16) & 255, (bitLen >>> 8) & 255, bitLen & 255);
    const w = new Array(64);
    for (let b = 0; b < bytes.length; b += 64) {
      for (let t = 0; t < 16; t++) w[t] = ((bytes[b + t * 4] << 24) | (bytes[b + t * 4 + 1] << 16) | (bytes[b + t * 4 + 2] << 8) | bytes[b + t * 4 + 3]) | 0;
      for (let t = 16; t < 64; t++) {
        const s0 = rr(w[t - 15], 7) ^ rr(w[t - 15], 18) ^ (w[t - 15] >>> 3);
        const s1 = rr(w[t - 2], 17) ^ rr(w[t - 2], 19) ^ (w[t - 2] >>> 10);
        w[t] = (w[t - 16] + s0 + w[t - 7] + s1) | 0;
      }
      let a = H[0], b2 = H[1], c = H[2], d = H[3], e = H[4], f = H[5], g = H[6], h = H[7];
      for (let t = 0; t < 64; t++) {
        const S1 = rr(e, 6) ^ rr(e, 11) ^ rr(e, 25);
        const ch = (e & f) ^ (~e & g);
        const t1 = (h + S1 + ch + K[t] + w[t]) | 0;
        const S0 = rr(a, 2) ^ rr(a, 13) ^ rr(a, 22);
        const maj = (a & b2) ^ (a & c) ^ (b2 & c);
        const t2 = (S0 + maj) | 0;
        h = g; g = f; f = e; e = (d + t1) | 0; d = c; c = b2; b2 = a; a = (t1 + t2) | 0;
      }
      H = [(H[0] + a) | 0, (H[1] + b2) | 0, (H[2] + c) | 0, (H[3] + d) | 0, (H[4] + e) | 0, (H[5] + f) | 0, (H[6] + g) | 0, (H[7] + h) | 0];
    }
    return H.map((x) => (x >>> 0).toString(16).padStart(8, '0')).join('');
  }
  const normalizeCode = (txt) => String(txt || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
  function verifyCode(txt) { return sha256hex(normalizeCode(txt)) === CODE_HASH; }

  // ---------- Tabla maestra de escenas (documento §11) ----------
  const DATE_SCENES = [
    { id: 'apertura', t0: 0, t1: 12 },
    { id: 'plaza', t0: 12, t1: 41, suckFx: 'polvo', suckAt: 39.2 },
    { id: 'sanangel', t0: 41, t1: 67, suckFx: 'petalos', suckAt: 65.2 },
    { id: 'aero', t0: 67, t1: 91, suckFx: 'boletos', suckAt: 89.2 },
    { id: 'castillo', t0: 91, t1: 120, suckFx: 'estrellas', suckAt: 118.2 },
    { id: 'cita', t0: 120, t1: 149, finaleAt: 137 },
  ];
  const SUCK_DUR = 1.8, DOOR_CALL_T = 5, DOOR_OPEN_T = 2, JOSE_LAG = 0.15;
  const MAIN_DOOR = { x: 510, y: 566 }; // puerta principal: borde sur del pasillo

  // ---------- Estado propio del modo ----------
  const D = {
    active: false, state: 'idle', // idle|depa|door|plaza|plaza-arrived|done
    scene: null, arrived: false, joseJoined: false,
    clockRunning: false, factor: 1, tap: false,
  };

  // ---------- Audio: la canción (fuera de git) ----------
  let song = null, songOk = false;
  let fbStart = 0, fbElapsed = 0, fbRunning = false;
  function createSong() {
    if (song) return song;
    try {
      song = document.createElement('audio');
      song.preload = 'auto';
      const s1 = document.createElement('source'); s1.src = 'assets/audio/and-i-love-her.m4a'; s1.type = 'audio/mp4';
      const s2 = document.createElement('source'); s2.src = 'assets/audio/and-i-love-her.mp3'; s2.type = 'audio/mpeg';
      song.appendChild(s1); song.appendChild(s2);
      if (song.addEventListener) {
        song.addEventListener('loadedmetadata', () => {
          if (isFinite(song.duration) && song.duration > 0) { songOk = true; D.factor = song.duration / 149; }
        });
        song.addEventListener('error', () => { songOk = false; }, true);
      }
    } catch (e) { song = null; }
    return song;
  }
  function startClock() {
    D.clockRunning = true;
    fbElapsed = 0; fbRunning = true; fbStart = performance.now();
    if (song && typeof song.play === 'function') {
      try { const p = song.play(); if (p && p.catch) p.catch(() => {}); } catch (e) { /* sin audio: manda el respaldo */ }
    }
  }
  function dateNow() {
    if (!D.clockRunning) return 0;
    if (songOk && song && isFinite(song.currentTime)) return song.currentTime;
    if (!fbRunning) return fbElapsed;
    return fbElapsed + (performance.now() - fbStart) / 1000;
  }
  function setPaused(v) {
    if (!D.active) return;
    if (v) {
      if (songOk && song && typeof song.pause === 'function') { try { song.pause(); } catch (e) {} }
      if (fbRunning) { fbElapsed = dateNow(); fbRunning = false; }
    } else {
      if (songOk && song && typeof song.play === 'function') { try { const p = song.play(); if (p && p.catch) p.catch(() => {}); } catch (e) {} }
      if (D.clockRunning && !fbRunning) { fbStart = performance.now(); fbRunning = true; }
    }
  }
  // Cambio de pestaña: la misma pausa automática del documento (§9).
  if (typeof document !== 'undefined' && document.addEventListener) {
    document.addEventListener('visibilitychange', () => {
      if (document.hidden && D.active && G.setPaused && !G.paused) G.setPaused(true);
    });
  }

  // ---------- Entrada táctil: arrastre sobre el canvas ----------
  // Un solo listener para todo el modo (registrado al cargar el
  // módulo, no por escena: no puede quedar colgado al salir).
  let touchStart = null, touchVec = null;
  try {
    const cv = $('#cv');
    if (cv && cv.addEventListener) {
      cv.addEventListener('pointerdown', (e) => { touchStart = { x: e.clientX, y: e.clientY }; touchVec = { x: 0, y: 0 }; });
      cv.addEventListener('pointermove', (e) => {
        if (!touchStart) return;
        const dx = e.clientX - touchStart.x, dy = e.clientY - touchStart.y, m = Math.hypot(dx, dy);
        touchVec = m > 8 ? { x: dx / Math.max(m, 44), y: dy / Math.max(m, 44) } : { x: 0, y: 0 };
      });
      const endTouch = () => { if (touchStart && touchVec && !touchVec.x && !touchVec.y) D.tap = true; touchStart = null; touchVec = null; };
      cv.addEventListener('pointerup', endTouch);
      cv.addEventListener('pointercancel', endTouch);
    }
  } catch (e) { /* sin canvas táctil: el teclado basta */ }

  // ---------- Asset de la plaza: la Catedral (recorte de foto) ----------
  let catedralImg = null;
  try {
    if (typeof Image !== 'undefined') { catedralImg = new Image(); catedralImg.src = 'assets/date/catedral.png'; }
  } catch (e) { catedralImg = null; }

  // =========================================================
  // ESCENA DEL EASTER EGG (Parte 1): depa → puerta → plaza
  // =========================================================
  class DateScene {
    constructor(onDone) {
      this.onDone = onDone || null;
      this.phase = 'depa'; this.t = 0; this.phaseT = 0;
      this.nearDoor = false; this.doneFired = false;
      this.pan = 0; this.joseReacted = false; this.joseExpr = null;
      // --- El depa con TODOS escondidos (staging de la llegada,
      // invertido): los 7 roomies DENTRO del armario, solo los
      // ojos en la rendija (CLOSET_PEEK); Pollito escondido con
      // ellos; Jose NO está (espera en la plaza). Ximena es la
      // protagonista y se la controla desde el primer segundo.
      const home = new G.Scenes.HomeScene(G.PLAYABLE.slice());
      home.wander = false; home.xState = 'away'; home.setLight('dia', true);
      home.roomies.forEach((a) => { a.x = 600; a.y = 346; a.dir = 'down'; a.hidden = true; });
      home.closetPeek = G.PLAYABLE.slice();
      W.closet.k = W.CLOSET_PEEK; W.closet.target = W.CLOSET_PEEK;
      home.cat.x = 600; home.cat.y = 346; home.cat.hidden = true;
      home.jose.hidden = true;
      const xi = home.xi;
      xi.hidden = false; xi.x = 800; xi.y = 470; xi.dir = 'down'; xi.expr = null; xi.speed = 130;
      W.xDoorOpen = true; // la puerta de SU cuarto (pasillo↔xroom) queda abierta
      home.follow(xi, 560);
      home.cam.x = xi.x; home.cam.z = xi.y - 30; home.cam.dist = 560;
      this.home = home; this.xi = xi;
    }
    openDoor() {
      if (this.phase !== 'depa') return;
      this.phase = 'door'; this.phaseT = 0; D.state = 'door';
      G.sfx('door');
      this.xi.route = null; this.xi.vx = this.xi.vy = 0; this.xi.moving = false;
    }
    update(dt) {
      this.t += dt;
      if (this.phase === 'depa') {
        const ax = G.input.axis();
        const ix = ax.x || (touchVec ? touchVec.x : 0), iy = ax.y || (touchVec ? touchVec.y : 0);
        this.xi.walk(ix, iy, 132, dt);
        this.home.update(dt);
        this.nearDoor = Math.hypot(this.xi.x - MAIN_DOOR.x, this.xi.y - MAIN_DOOR.y) < 52;
        if (this.nearDoor && (G.input.hit('action') || D.tap)) this.openDoor();
        D.tap = false;
        return;
      }
      if (this.phase === 'door') {
        // La puerta se abre y la LUZ se lo traga todo (~1 s): al
        // otro lado ya no está el pasillo, está la plaza. El reloj
        // de la cita arranca AQUÍ, con el primer acorde.
        this.home.update(dt);
        this.phaseT += dt;
        if (this.phaseT >= 1) {
          this.phase = 'plaza'; this.phaseT = 0; D.state = 'plaza';
          startClock();
          G.sfx('door'); // la misma puerta se cierra detrás de ella, ya en la plaza
        }
        return;
      }
      if (this.phase === 'plaza') {
        this.phaseT += dt;
        const k = Math.min(1, this.phaseT / 4);
        this.pan = k * k * (3 - 2 * k); // paneo suave (smoothstep) del revelado
        if (this.phaseT >= 1.2 && !this.joseReacted) {
          this.joseReacted = true; this.joseExpr = 'happy'; D.joseJoined = true;
        }
        if (this.phaseT >= 4) {
          this.phase = 'fadeout'; this.phaseT = 0;
          D.state = 'plaza-arrived'; D.arrived = true; // ← fin de la Parte 1
        }
        return;
      }
      if (this.phase === 'fadeout') {
        this.phaseT += dt;
        if (this.phaseT >= 1.2 && !this.doneFired) {
          this.doneFired = true; D.state = 'done';
          if (this.onDone) this.onDone();
        }
      }
    }
    draw(dt) {
      if (this.phase === 'depa' || this.phase === 'door') {
        this.home.draw(dt);
        const c = G.ovCtx; if (!c) return;
        c.setTransform(2, 0, 0, 2, 0, 0);
        if (this.phase === 'depa' && this.nearDoor) {
          const h = this.xi.head(46);
          if (h && isFinite(h.x)) G.prompt(c, 'ESPACIO: abrir la puerta', h.x, h.y);
        }
        if (this.phase === 'door') {
          const a = Math.min(1, this.phaseT / 1);
          c.fillStyle = `rgba(255,244,214,${(a * a).toFixed(3)})`;
          c.fillRect(0, 0, 640, 360);
        }
        return;
      }
      this.drawPlaza();
    }
    // ---------- La plaza en 6 capas (canvas 2D, 640×360) ----------
    drawPlaza() {
      const c = G.ovCtx; if (!c) return;
      c.setTransform(2, 0, 0, 2, 0, 0);
      c.clearRect(0, 0, 640, 360);
      const t = this.t, pan = this.pan * 90; // recorrido total del paneo (px a velocidad L4)
      const horizon = 252;
      // L0 · cielo de tarde dorada + nubes dibujadas
      const sky = c.createLinearGradient(0, 0, 0, horizon);
      sky.addColorStop(0, '#7fb2d9'); sky.addColorStop(0.55, '#c9d9e8'); sky.addColorStop(0.82, '#f6cf8e'); sky.addColorStop(1, '#ffd9a0');
      c.fillStyle = sky; c.fillRect(0, 0, 640, horizon + 2);
      c.fillStyle = 'rgba(255,252,244,0.85)';
      const cloud = (x, y, s) => { c.beginPath(); c.ellipse(x, y, 26 * s, 8 * s, 0, 0, 6.3); c.ellipse(x + 18 * s, y + 2 * s, 18 * s, 6 * s, 0, 0, 6.3); c.ellipse(x - 20 * s, y + 2 * s, 16 * s, 5.5 * s, 0, 0, 6.3); c.fill(); };
      cloud(120 - pan * 0.1 + Math.sin(t * 0.05) * 2, 46, 1.1); cloud(430 - pan * 0.1, 30, 0.8); cloud(560 - pan * 0.1, 74, 1.3); cloud(250 - pan * 0.1, 92, 0.6);
      // L1 · la Catedral (recorte de FOTO real) + asta con bandera dibujada
      const catW = 430, catX = 268 - pan * 0.25, catBase = horizon + 4;
      if (catedralImg && catedralImg.complete && catedralImg.naturalWidth) {
        const catH = catW * catedralImg.naturalHeight / catedralImg.naturalWidth;
        c.drawImage(catedralImg, catX - catW / 2, catBase - catH, catW, catH);
      } else {
        // Respaldo por código si la imagen aún no cargó: silueta simple.
        c.fillStyle = '#8d8578';
        c.fillRect(catX - 190, catBase - 170, 380, 170);
        c.fillRect(catX - 165, catBase - 225, 52, 225); c.fillRect(catX + 113, catBase - 225, 52, 225);
        c.beginPath(); c.arc(catX - 139, catBase - 225, 26, 3.14, 0); c.arc(catX + 139, catBase - 225, 26, 3.14, 0); c.fill();
      }
      // asta y bandera de México, DIBUJADA y ondeando por código
      const astaX = 96 - pan * 0.25, astaBase = horizon + 4;
      c.fillStyle = '#5a5148'; c.fillRect(astaX - 1.5, astaBase - 196, 3, 196);
      const fw = 46, fh = 27, wave = Math.sin(t * 3.2) * 3;
      const bands = ['#3a7d44', '#f4f1e6', '#b03a3a'];
      for (let i = 0; i < 3; i++) {
        c.fillStyle = bands[i];
        c.beginPath();
        const bx = astaX + 2 + (fw / 3) * i, bw = fw / 3;
        c.moveTo(bx, astaBase - 196);
        c.quadraticCurveTo(bx + bw / 2, astaBase - 196 + wave * (i + 1) * 0.4, bx + bw, astaBase - 196 + wave * (i + 1) * 0.55);
        c.lineTo(bx + bw, astaBase - 196 + fh + wave * (i + 1) * 0.55);
        c.quadraticCurveTo(bx + bw / 2, astaBase - 196 + fh + wave * (i + 1) * 0.4, bx, astaBase - 196 + fh);
        c.closePath(); c.fill();
      }
      // L2 · edificios y puestos dibujados (siluetas con la paleta)
      const off2 = -(pan * 0.5) % 320;
      const bpal = ['#c96f4a', '#d9a05a', '#a8574f', '#c9b458', '#9c6b52'];
      for (let rep = -1; rep < 3; rep++) {
        for (let i = 0; i < 4; i++) {
          const bx = rep * 320 + i * 84 + off2 + ((i * 37) % 13), bw = 62 + ((i * 29) % 18), bh = 54 + ((i * 41) % 30);
          c.fillStyle = bpal[(i + rep + 5) % bpal.length];
          c.fillRect(bx, horizon - bh + 6, bw, bh);
          c.fillStyle = 'rgba(28,20,32,0.55)';
          for (let wy = 0; wy < 3; wy++) for (let wx = 0; wx < 3; wx++) c.fillRect(bx + 8 + wx * 18, horizon - bh + 16 + wy * 16, 8, 10);
        }
      }
      // puestos con toldo (delante de los edificios, misma capa)
      const stall = (sx, col) => {
        c.fillStyle = '#6b4a35'; c.fillRect(sx, horizon - 26, 54, 30);
        c.fillStyle = col; c.beginPath(); c.moveTo(sx - 5, horizon - 26); c.lineTo(sx + 59, horizon - 26); c.lineTo(sx + 50, horizon - 38); c.lineTo(sx + 4, horizon - 38); c.closePath(); c.fill();
        c.fillStyle = '#ffd9a0'; c.fillRect(sx + 6, horizon - 18, 8, 8); c.fillRect(sx + 20, horizon - 18, 8, 8); c.fillRect(sx + 34, horizon - 18, 8, 8);
      };
      stall(430 - pan * 0.5, '#b03a3a'); stall(30 - pan * 0.5, '#3a7d44');
      // L3 · piso de baldosas de la plaza
      c.fillStyle = '#b8a88f'; c.fillRect(0, horizon, 640, 360 - horizon);
      c.fillStyle = '#a08b6d'; c.fillRect(0, horizon, 640, 3);
      c.strokeStyle = 'rgba(90,74,52,0.35)'; c.lineWidth = 1;
      const tileOff = -(pan % 32);
      for (let x = tileOff; x < 640; x += 32) { c.beginPath(); c.moveTo(x, horizon + 4); c.lineTo(x - 8, 360); c.stroke(); }
      for (let y = horizon + 16; y < 360; y += 18) { c.beginPath(); c.moveTo(0, y); c.lineTo(640, y); c.stroke(); }
      // L4 · la Puerta + Ximena + Jose (con su ramo)
      const groundY = 316;
      this.drawDoor2D(c, 84 - pan * 0.35, groundY, this.phaseT < 0.9 ? 1 - this.phaseT / 0.9 : 0);
      this.drawChar2D(c, 'ximena', 168, groundY, 96, Math.floor(t * 1.4), null, false, Math.sin(t * 2.2) * 1.2);
      const jx = 238, hop = this.joseReacted ? Math.abs(Math.sin(t * 5)) * 3 : 0;
      this.drawChar2D(c, 'jose', jx, groundY, 96, Math.floor(t * 1.4), this.joseExpr, false, -hop);
      if (this.joseReacted) this.drawBouquet(c, jx + 17, groundY - 52 - hop);
      // L5 · poste en primer plano (desenfocado por código: alpha + sombra)
      const postX = 566 - pan * 1.4;
      c.save();
      c.shadowColor = 'rgba(20,14,26,0.9)'; c.shadowBlur = 9;
      c.fillStyle = 'rgba(24,18,32,0.88)';
      c.fillRect(postX, 30, 13, 330);
      c.beginPath(); c.arc(postX + 6.5, 26, 10, 0, 6.3); c.fill();
      c.restore();
      c.fillStyle = 'rgba(255,214,140,0.5)'; c.beginPath(); c.arc(postX + 6.5, 26, 5, 0, 6.3); c.fill();
      // luz de llegada (se disipa) y fundido de salida de la Parte 1
      if (this.phase === 'plaza' && this.phaseT < 0.8) { c.fillStyle = `rgba(255,244,214,${(1 - this.phaseT / 0.8).toFixed(3)})`; c.fillRect(0, 0, 640, 360); }
      if (this.phase === 'fadeout') { c.fillStyle = `rgba(12,10,20,${Math.min(1, this.phaseT / 1.2).toFixed(3)})`; c.fillRect(0, 0, 640, 360); }
    }
    drawChar2D(c, id, x, baseY, h, idx, expr, flip, bobY) {
      const fr = Sp.frame(id, 'idle', idx, { expr, flip });
      if (!fr || !fr.width) return;
      const w = h * fr.width / fr.height;
      c.drawImage(fr, x - w / 2, baseY - h + (bobY || 0), w, h);
    }
    drawBouquet(c, x, y) {
      c.strokeStyle = '#3a7d44'; c.lineWidth = 2;
      c.beginPath(); c.moveTo(x, y + 12); c.lineTo(x - 4, y + 2); c.moveTo(x, y + 12); c.lineTo(x + 1, y); c.moveTo(x, y + 12); c.lineTo(x + 5, y + 3); c.stroke();
      const cols = ['#e56b8c', '#d94f4f', '#f2e6f0', '#e56b8c', '#d94f4f'];
      [[-4, 0], [1, -3], [6, 1], [-1, 3], [4, 5]].forEach((p, i) => { c.fillStyle = cols[i]; c.beginPath(); c.arc(x + p[0], y + p[1], 3.4, 0, 6.3); c.fill(); });
    }
    drawDoor2D(c, x, baseY, openK) {
      // LA Puerta: la misma en todas las escenas (madera, marco claro).
      const w = 46, h = 82, x0 = x - w / 2, y0 = baseY - h;
      c.fillStyle = 'rgba(20,14,26,0.30)'; c.beginPath(); c.ellipse(x, baseY + 3, w * 0.62, 5, 0, 0, 6.3); c.fill();
      c.fillStyle = '#e8ddc8'; c.fillRect(x0 - 4, y0 - 4, w + 8, h + 4);
      if (openK > 0) { c.fillStyle = `rgba(255,240,200,${0.55 + openK * 0.45})`; c.fillRect(x0, y0, w, h); }
      c.fillStyle = '#7a4a2b';
      const dw = w * (1 - openK * 0.72);
      c.fillRect(x0 + (w - dw), y0, dw, h);
      c.fillStyle = 'rgba(0,0,0,0.18)'; c.fillRect(x0 + (w - dw) + 5, y0 + 8, Math.max(0, dw - 10), 26); c.fillRect(x0 + (w - dw) + 5, y0 + 42, Math.max(0, dw - 10), 26);
      c.fillStyle = '#ffd23f'; c.beginPath(); c.arc(x0 + w - 7, y0 + h / 2, 2.6, 0, 6.3); c.fill();
    }
  }

  // ---------- API del modo ----------
  function start(onDone) {
    createSong();
    D.active = true; D.state = 'depa'; D.arrived = false; D.joseJoined = false; D.clockRunning = false;
    if (G.S) G.S.phase = 'date';
    if (typeof document !== 'undefined' && document.body && document.body.classList) document.body.classList.add('date-mode');
    D.scene = new DateScene(onDone);
    G.setScene(D.scene);
  }
  function stop() {
    D.active = false; D.state = 'idle'; D.clockRunning = false; fbRunning = false;
    if (song && typeof song.pause === 'function') { try { song.pause(); } catch (e) {} }
    if (typeof document !== 'undefined' && document.body && document.body.classList) document.body.classList.remove('date-mode');
    W.closet.target = 0; W.xDoorOpen = false;
    D.scene = null;
  }
  G.DateMode = {
    start, stop, setPaused, verify: verifyCode, dateNow,
    scenes: DATE_SCENES, state: D,
    SUCK_DUR, DOOR_CALL_T, DOOR_OPEN_T, JOSE_LAG,
    update(dt) { if (D.scene) D.scene.update(dt); },
    draw(dt) { if (D.scene) D.scene.draw(dt); },
    // Gancho SOLO para el humo (tools/check_date.js): permite
    // ejercitar verify() con un código de prueba sin conocer el
    // real, y validar el SHA-256 contra vectores conocidos.
    debug: { sha256hex, setHash(h) { CODE_HASH = h; }, getHash() { return CODE_HASH; } },
  };
})();
