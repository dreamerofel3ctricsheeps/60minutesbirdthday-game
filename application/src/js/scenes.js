/* ============================================================
   ESCENAS: recolección (Acto 0), casa (cinemáticas / ambiente)
   y los 5 minijuegos-duelo contra los jefes: Pollito y José.
   Cada escena expone update(dt) y draw(dt).
   ============================================================ */
(function () {
  'use strict';
  const G = window.G, W = G.World, Actor = G.Actor, Sp = G.Sprites, R = G.R;
  const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
  const stat = (id, k) => G.CHARS[id].stats[k];
  const speedOf = (id) => 72 + stat(id, 'velocidad') * 9;
  const rnd = (a, b) => a + Math.random() * (b - a);
  const shuffle = (a) => { for (let i = a.length - 1; i > 0; i--) { const j = (Math.random() * (i + 1)) | 0; [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const CAM_SALA = () => ({ x: 655, y: 0, z: 150, dist: 700, pitch: 0.88, fov: 34 });

  function panel(c, x, y, w, h, col) { c.fillStyle = '#1c1826'; c.beginPath(); c.roundRect(x - 2, y - 2, w + 4, h + 4, 9); c.fill(); c.fillStyle = col || '#2b2540'; c.beginPath(); c.roundRect(x, y, w, h, 7); c.fill(); }
  function face(c, id, x, y, s, expr) { c.imageSmoothingEnabled = false; c.fillStyle = '#463c66'; c.beginPath(); c.roundRect(x, y, s, s, 6); c.fill(); c.drawImage(Sp.portraitC(id, expr), x, y, s, s); }
  function ring(x, z, r, tint, a) { R.flat(R.glowTex, x, 0.8, z, r, { tint, alpha: a }); }
  function wrap(c, str, x, y, maxW, size, color) {
    c.font = `bold ${size}px ${G.FONT}`; c.textAlign = 'left'; c.textBaseline = 'middle'; c.fillStyle = color;
    const words = str.split(' '); let cur = '', ly = y;
    words.forEach((w) => { if (c.measureText(cur + ' ' + w).width > maxW && cur) { c.fillText(cur, x, ly); ly += size + 2.5; cur = w; } else cur = cur ? cur + ' ' + w : w; });
    c.fillText(cur, x, ly);
  }

  // =========================================================
  // ACTO 0 — 1 MINUTO PARA LA FIESTA
  // =========================================================
  class CollectScene {
    constructor(playerId, done) {
      this.done = done; this.time = 60; this.count = 3.4; this.over = false;
      this.p = new Actor(playerId, 510, 450); this.p.carry = [];
      this.speed = speedOf(playerId);
      const spots = shuffle(W.SPAWNS.slice());
      this.items = Object.keys(G.ITEMS).map((id, i) => ({ id, x: spots[i][0], y: spots[i][1] }));
      this.others = G.PLAYABLE.filter((c) => c !== playerId).map((id, i) => new Actor(id, 420 + i * 170, 520 - i * 10));
      this.cat = new Actor('pollito', 880, 150); this.cat.speed = 110; this.catWait = 7; this.catMoves = 0; this.catItem = null;
      this.cheer = 4; this.stashed = 0; this.msg = null;
      this.cam = { x: 510, y: 0, z: 440, dist: 560, pitch: 0.78, fov: 34 };
    }
    slotsUsed() { return this.p.carry.reduce((n, id) => n + G.ITEMS[id].slots, 0); }
    update(dt) {
      const p = this.p; p.update(dt); this.others.forEach((o) => o.update(dt)); this.cat.update(dt); W.updateFx(dt);
      W.camLerp(this.cam, p.x, p.y - 20, dt, 5);
      if (this.msg && (this.msg.t -= dt) <= 0) this.msg = null;
      if (this.count > 0) { this.count -= dt; G.input.flush(); return; }
      if (this.over) { p.walk(0, 0, 0, dt); return; }
      this.time -= dt;
      const ax = G.input.axis();
      let sp = this.speed;
      const heavy = p.carry.some((id) => G.ITEMS[id].slots === 2);
      if (heavy && p.id !== 'alan') sp *= 0.62; else if (p.carry.length === 2) sp *= 0.86;
      p.walk(ax.x, ax.y, sp, dt);
      this.near = null; this.nearStash = dist(p, W.STASH) < 48 && p.carry.length > 0;
      if (!this.nearStash) { let best = 36; this.items.forEach((it) => { const d = dist(p, it); if (d < best) { best = d; this.near = it; } }); }
      if (G.input.hit('action')) {
        if (this.nearStash) {
          p.carry.forEach((id) => { G.S.inv[id] = true; this.stashed++; });
          this.msg = { text: '¡Guardado! ' + p.carry.map((id) => G.ITEMS[id].name).join(' + '), t: 1.6 };
          p.carry = []; p.hop(140); W.puff(W.STASH.x, W.STASH.y - 14, 5, true); G.sfx('ok'); G.ui.refreshInv();
        } else if (this.near) {
          const need = G.ITEMS[this.near.id].slots;
          if (this.slotsUsed() + need <= 2) {
            p.carry.push(this.near.id); this.items.splice(this.items.indexOf(this.near), 1);
            if (this.catItem === this.near) this.catItem = null;
            this.msg = { text: G.ITEMS[this.near.id].name + (need === 2 ? ' (pesado)' : ''), t: 1.2 }; p.hop(110); G.sfx('pick');
          } else { this.msg = { text: '¡Manos llenas! Guarda en el armario del pasillo', t: 1.6 }; p.emo('✖', 0.8); G.sfx('bad'); }
        }
      }
      // Pollito: fuerza del caos
      const cat = this.cat; cat.follow(dt);
      if (this.catItem && cat.arrived) {
        const it = this.catItem; this.catItem = null;
        if (this.items.includes(it)) {
          const free = W.SPAWNS.filter((s) => !this.items.some((o) => Math.hypot(o.x - s[0], o.y - s[1]) < 30) && Math.hypot(p.x - s[0], p.y - s[1]) > 180);
          if (free.length) { const s = free[(Math.random() * free.length) | 0]; it.x = s[0]; it.y = s[1]; G.S.flags.pollitoJugo = it.id; this.msg = { text: `¡Pollito se llevó ${G.ITEMS[it.id].name.toLowerCase()} a otro lado!`, t: 2.2 }; G.sfx('meow'); cat.hop(160); cat.goTo(s[0] + 18, s[1], 210); }
        }
      }
      if ((this.catWait -= dt) <= 0 && cat.arrived && !this.catItem) {
        this.catWait = 9 + Math.random() * 5;
        if (this.catMoves < 3 && this.items.length) { this.catItem = this.items[(Math.random() * this.items.length) | 0]; cat.goTo(this.catItem.x + 10, this.catItem.y, 135); this.catMoves++; }
        else { const pt = W.randomFreePoint(['sala', 'cocina', 'cuarto'][(Math.random() * 3) | 0]); cat.goTo(pt[0], pt[1], 100); }
      }
      if ((this.cheer -= dt) <= 0) {
        this.cheer = 5 + Math.random() * 4;
        const o = this.others[(Math.random() * 2) | 0];
        const lines = this.time < 15 ? ['¡YA VIENE!', '¡Escucho el ascensor!', '¡Guarda lo que tengas!'] : ['¡Apúrate!', '¡El pastel, el pastel!', 'Yo vigilo la puerta.', '¡No te olvides de guardar!', '¿Dónde quedaron los globos?'];
        o.say(lines[(Math.random() * lines.length) | 0], 2.2); o.hop(130);
      }
      if (this.time <= 0) { this.over = true; G.sfx('bell'); this.others.forEach((o) => o.emo('!', 1.5)); p.emo('!', 1.5); setTimeout(() => this.done({ inHand: p.carry.slice(), stashed: this.stashed }), 1100); }
    }
    draw(dt) {
      const p = this.p;
      W.render({
        cam: this.cam, dt, light: W.LIGHT.dia, actors: [p, this.cat, ...this.others], items: this.items, focusZ: p.y,
        sprites: (t) => { ring(W.STASH.x, W.STASH.y, 40 + Math.sin(t * 5) * 3, p.carry.length ? [0.4, 1, 0.5] : [1, 1, 1], p.carry.length ? 0.75 : 0.3); },
        over: (c, t) => {
          if (this.count <= 0 && !this.over) {
            if (this.nearStash) { const h = p.head(34); G.prompt(c, 'ESPACIO: guardar', h.x, h.y); }
            else if (this.near) { const q = R.project(this.near.x, 46, this.near.y); G.prompt(c, 'ESPACIO: ' + G.ITEMS[this.near.id].name, q.x, q.y); }
          }
          // indicador del armario
          const s = R.project(W.STASH.x, 110, W.STASH.y), on = s.x > 20 && s.x < 620 && s.y > 50 && s.y < 340;
          const sx = Math.max(60, Math.min(580, s.x)), sy = Math.max(62, Math.min(330, s.y));
          G.text(c, on ? '▼ ARMARIO' : 'ARMARIO ➜', sx, sy + (on ? Math.sin(t * 5) * 2 : 0), { size: 9, color: p.carry.length ? '#7dff8a' : '#fff' });
          // minimapa
          const mx = 10, my = 276, k = 0.115;
          panel(c, mx, my, 1000 * k + 4, 620 * k + 4, 'rgba(28,24,38,.85)');
          Object.values(W.FLOORS).forEach((r) => { c.fillStyle = '#463c66'; c.fillRect(mx + 2 + r.x * k, my + 2 + r.y * k, r.w * k, r.h * k); });
          c.fillStyle = '#7dff8a'; c.fillRect(mx + W.STASH.x * k - 1, my + W.STASH.y * k - 3, 6, 4);
          this.items.forEach((it) => { c.fillStyle = '#ffd23f'; c.fillRect(mx + 1 + it.x * k, my + 1 + it.y * k, 3, 3); });
          c.fillStyle = '#f0a04a'; c.fillRect(mx + 1 + this.cat.x * k, my + 1 + this.cat.y * k, 3, 3);
          c.fillStyle = '#fff'; c.beginPath(); c.arc(mx + 2 + p.x * k, my + 2 + p.y * k, 2.6, 0, 6.3); c.fill();
          if (this.msg) G.text(c, this.msg.text, 320, 338, { size: 11, color: '#fff' });
          // reloj
          const urgent = this.time <= 10;
          panel(c, 250, 6, 140, 40);
          G.text(c, 'XIMENA LLEGA EN', 320, 16, { size: 7, color: '#b9b0d6', stroke: false });
          G.text(c, Math.max(0, Math.ceil(this.time)) + 's', 320, 32, { size: 18 + (urgent ? Math.sin(t * 12) * 2 : 0), color: urgent ? '#ff6b7a' : '#ffd23f', stroke: false });
          panel(c, 396, 6, 92, 40); G.text(c, 'MANOS', 442, 16, { size: 7, color: '#b9b0d6', stroke: false });
          for (let i = 0; i < 2; i++) { c.fillStyle = i < this.slotsUsed() ? '#ffd23f' : '#463c66'; c.beginPath(); c.roundRect(416 + i * 28, 24, 24, 16, 4); c.fill(); }
          panel(c, 152, 6, 92, 40); G.text(c, 'GUARDADOS', 198, 16, { size: 7, color: '#b9b0d6', stroke: false }); G.text(c, this.stashed + '/10', 198, 32, { size: 15, color: '#7dff8a', stroke: false });
          if (this.count > 0) {
            c.fillStyle = 'rgba(20,16,30,.55)'; c.fillRect(0, 0, 640, 360);
            const n = Math.ceil(this.count - 0.3);
            G.text(c, n > 0 ? String(n) : '¡YA!', 320, 160, { size: 70, color: '#ffd23f', lw: 9 });
            G.text(c, 'Recoge objetos (ESPACIO) y guárdalos en el ARMARIO del pasillo', 320, 226, { size: 11 });
            G.text(c, 'Moverse: WASD o flechas  ·  Sólo puedes cargar 2 espacios a la vez', 320, 244, { size: 9, bold: false });
          }
          if (this.over) { c.fillStyle = 'rgba(20,16,30,.5)'; c.fillRect(0, 0, 640, 360); G.text(c, '¡LLEGÓ XIMENA!', 320, 170, { size: 42, color: '#ff6b7a', lw: 8 }); }
        },
      });
    }
  }

  // =========================================================
  // CASA — ambiente del chat, llegada de Ximena y revelación
  // =========================================================
  const VIEWS = { todo: { x: 500, z: 318, dist: 1080, pitch: 0.98 }, sala: { x: 655, z: 170, dist: 640, pitch: 0.84 }, pasillo: { x: 520, z: 440, dist: 560, pitch: 0.8 }, xroom: { x: 800, z: 430, dist: 500, pitch: 0.8 }, cocina: { x: 190, z: 170, dist: 520, pitch: 0.82 } };
  class HomeScene {
    constructor() {
      this.roomies = G.PLAYABLE.map((id, i) => new Actor(id, 450 + i * 120, 215 + (i % 2) * 40));
      this.cat = new Actor('pollito', 890, 150); this.cat.speed = 80;
      this.xi = new Actor('ximena', 510, 640); this.xi.hidden = true; this.xi.speed = 62;
      this.jose = new Actor('jose', 510, 640); this.jose.hidden = true;
      this.xState = 'away'; this.wander = false; this.confetti = null; this.wt = [1, 2.5, 4]; this.catT = 3; this.title = null;
      this.cam = { ...VIEWS.todo, y: 0, fov: 34 }; this.view = VIEWS.todo; this.followA = null; this.T = Math.random() * 9;
      this.lightA = W.LIGHT.noche; this.lightB = W.LIGHT.noche; this.lk = 1; this.lightKey = 'noche';
    }
    actor(id) { return id === 'ximena' ? this.xi : id === 'pollito' ? this.cat : id === 'jose' ? this.jose : this.roomies.find((r) => r.id === id); }
    setView(v) { this.view = VIEWS[v] || v; this.followA = null; }
    follow(actor, d) { this.followA = actor; this.view = { dist: d || 520, pitch: 0.8 }; }
    setLight(key, instant) { const L = W.LIGHT[key]; if (L === this.lightB) return; const m = W.mixLight(this.lightA, this.lightB, this.lk); m.points = this.lightB.points; this.lightA = m; this.lightB = L; this.lk = instant ? 1 : 0; this.lightKey = key; }
    update(dt) {
      this.T += dt; W.updateFx(dt); this.lk = Math.min(1, this.lk + dt * 1.2);
      const v = this.view, a = Math.min(1, dt * 2.2), c = this.cam;
      const tx = this.followA ? this.followA.x : v.x + Math.sin(this.T * 0.25) * 14, tz = this.followA ? this.followA.y - 30 : v.z;
      c.x += (tx - c.x) * a; c.z += (tz - c.z) * a; c.dist += (v.dist - c.dist) * a; c.pitch += (v.pitch - c.pitch) * a;
      this.roomies.forEach((r, i) => {
        r.update(dt);
        if (r.route && r.route.length) { r.follow(dt); return; }
        r.moving = false; r.vx = r.vy = 0;
        if (!this.wander) return;
        if ((this.wt[i] -= dt) <= 0) {
          this.wt[i] = 3 + Math.random() * 5;
          const k = Math.random();
          if (k < 0.55) { const pt = W.randomFreePoint(Math.random() < 0.75 ? 'sala' : 'cocina'); r.goTo(pt[0], pt[1], 58); }
          else if (k < 0.75) r.hop(120); else r.dir = ['down', 'left', 'right'][(Math.random() * 3) | 0];
        }
      });
      this.cat.update(dt); this.cat.follow(dt);
      if (this.wander && (this.catT -= dt) <= 0 && this.cat.arrived) { this.catT = 4 + Math.random() * 6; const pt = W.randomFreePoint(['sala', 'cocina', 'pasillo'][(Math.random() * 3) | 0]); this.cat.goTo(pt[0], pt[1], 85); }
      this.xi.update(dt); this.xi.follow(dt); this.jose.update(dt); this.jose.follow(dt);
      if (this.confetti) this.confetti.forEach((p) => { p.vy += 60 * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.r += dt * 6; if (p.y > 370) { p.y = -10; p.vy = 20 + Math.random() * 40; p.x = Math.random() * 640; } });
      if (this.title && (this.title.t -= dt) <= 0) this.title = null;
    }
    startConfetti() {
      const cols = ['#e23b4e', '#ffd23f', '#3fa0f0', '#58c46a', '#b48cf0', '#f08cc0'];
      this.confetti = Array.from({ length: 170 }, () => ({ x: Math.random() * 640, y: Math.random() * 200 - 60, vx: -30 + Math.random() * 60, vy: -60 + Math.random() * 120, c: cols[(Math.random() * 6) | 0], s: 3 + ((Math.random() * 4) | 0), r: Math.random() * 6 }));
    }
    showTitle(a, b, d) { this.title = { a, b, t: d || 3.5, d: d || 3.5 }; }
    draw(dt) {
      let light = W.mixLight(this.lightA, this.lightB, this.lk);
      if (this.lightKey === 'oscuro') light = { ...light, points: this.roomies.map((r) => ({ x: r.x, y: 40, z: r.y + 10, r: 120, c: [0.5 * this.lk, 0.55 * this.lk, 0.7 * this.lk] })) };
      const sleeping = this.xState === 'sleeping';
      W.render({
        cam: this.cam, dt, light, actors: [...this.roomies, this.cat, this.xi, this.jose], focusZ: this.followA ? this.followA.y : this.view.z < 300 || this.view === VIEWS.todo ? 0 : 400,
        boxes: (mb) => { if (sleeping) { mb.box(876, 27, 384, 58, 7, 72, '#b48cf0', { top: '#c9a9f7' }); mb.box(884, 33, 392, 42, 4, 54, '#c9a9f7'); } },
        sprites: () => { if (sleeping) R.sprite(Sp.headC('ximena', 'sleep'), 905, 20, 366, { roll: 0.16 }); },
        over: (c, t) => {
          if (sleeping) { const q = R.project(915, 60, 356), sl = G.S ? G.S.sleep : 0; for (let i = 0; i < 3; i++) { const k = (t * 0.6 + i / 3) % 1; G.text(c, sl >= 4 ? '!' : sl >= 3 ? '~' : 'z', q.x + 6 + k * 16, q.y - k * 30, { size: 7 + k * 7, color: sl >= 3 ? '#ffb86b' : '#fff' }); } }
          if (this.confetti) this.confetti.forEach((p) => { c.fillStyle = p.c; c.fillRect(p.x | 0, p.y | 0, p.s, Math.max(1, p.s * Math.abs(Math.sin(p.r)))); });
          if (this.title) { const a = Math.min(1, this.title.t, (this.title.d - this.title.t) * 2); c.globalAlpha = Math.max(0, a); c.fillStyle = 'rgba(20,16,30,.75)'; c.fillRect(0, 135, 640, 90); G.text(c, this.title.a, 320, 164, { size: 13, color: '#ffd23f' }); G.text(c, this.title.b, 320, 192, { size: 26, lw: 6 }); c.globalAlpha = 1; }
        },
      });
    }
  }

  // =========================================================
  // BASE DE LOS DUELOS: al mejor de varias rondas contra un jefe
  // Las subclases implementan setup(n) y play(dt) y llaman a endRound('p' | 'b' | 'tie').
  // =========================================================
  class Duel {
    constructor(who, boss, done, o) {
      this.who = who; this.bossId = boss; this.done = done; this.title = o.title; this.hint = o.hint;
      this.maxR = o.rounds || 3; this.need = o.need || 2; this.roundTime = o.time == null ? null : o.time; this.label = o.label || 'RONDA'; this.rendT = o.rendT || 2;
      this.round = 0; this.pw = 0; this.bw = 0; this.st = 'count'; this.stT = 3.6; this.endT = 0; this.result = null; this.msg = null; this.T = 0; this.last = null; this.time = null;
      this.speed = speedOf(who);
    }
    get count() { return this.st === 'count' ? this.stT : 0; }
    get over() { return this.st === 'over'; }
    begin() { this.setup(0); this.time = this.roundTime; }
    say(text, color, secs) { this.msg = { text, c: color || '#fff', t: secs || 1.4 }; }
    extra() { return {}; }
    // true mientras la ronda está en juego
    tick(dt) {
      this.T += dt; W.updateFx(dt);
      if (this.msg && (this.msg.t -= dt) <= 0) this.msg = null;
      if (this.st === 'count') { const b = Math.ceil(this.stT - 0.4); this.stT -= dt; if (Math.ceil(this.stT - 0.4) !== b) G.sfx(this.stT < 0.5 ? 'ok' : 'msg'); G.input.flush(); if (this.stT <= 0) this.st = 'play'; return false; }
      if (this.st === 'play') { if (this.time != null) this.time -= dt; return true; }
      if (this.st === 'rend') {
        if ((this.stT -= dt) <= 0) {
          if (this.pw >= this.need || this.bw >= this.need || this.round >= this.maxR - 1) { this.st = 'over'; const win = this.pw > this.bw ? 'win' : this.bw > this.pw ? 'lose' : 'tie'; this.result = Object.assign({ win, ps: this.pw, bs: this.bw }, this.extra()); G.sfx(win === 'win' ? 'party' : win === 'tie' ? 'ok' : 'bad'); }
          else { this.round++; this.setup(this.round); this.time = this.roundTime; this.st = 'count'; this.stT = 2; G.input.flush(); }
        }
        return false;
      }
      this.endT += dt; if (this.endT > 2.7 && !this.sent) { this.sent = true; this.done(this.result); }
      return false;
    }
    endRound(w, text) {
      if (this.st !== 'play') return;
      if (w === 'p') this.pw++; else if (w === 'b') this.bw++;
      this.last = { w, text }; this.st = 'rend'; this.stT = this.rendT; G.sfx(w === 'p' ? 'ok' : w === 'b' ? 'bad' : 'msg');
    }
    hud(c, t, pl, bl) {
      const P = G.CHARS[this.who], Bo = G.CHARS[this.bossId], ov = this.st === 'over';
      const pips = (x, n, col, dir) => { for (let i = 0; i < this.need; i++) { c.fillStyle = '#1c1826'; c.beginPath(); c.arc(x + dir * i * 13, 53, 5.5, 0, 6.3); c.fill(); c.fillStyle = i < n ? col : '#463c66'; c.beginPath(); c.arc(x + dir * i * 13, 53, 4, 0, 6.3); c.fill(); } };
      panel(c, 8, 8, 168, 40); face(c, this.who, 12, 12, 32, ov ? (this.result.win === 'win' ? 'happy' : 'surprised') : null);
      G.text(c, P.name.toUpperCase(), 50, 19, { size: 8, color: P.color, align: 'left', stroke: false }); G.text(c, pl, 50, 35, { size: 12, align: 'left', stroke: false });
      panel(c, 464, 8, 168, 40, '#40243a'); face(c, this.bossId, 596, 12, 32);
      G.text(c, 'JEFE · ' + Bo.name.toUpperCase(), 590, 19, { size: 8, color: Bo.color, align: 'right', stroke: false }); G.text(c, bl, 590, 35, { size: 12, align: 'right', stroke: false });
      pips(20, this.pw, '#7dff8a', 1); pips(620, this.bw, '#ff6b7a', -1);
      panel(c, 236, 8, 168, 40);
      G.text(c, this.title, 320, 18, { size: 8, color: '#ffd23f', stroke: false });
      const rl = `${this.label} ${Math.min(this.round + 1, this.maxR)}/${this.maxR}`;
      if (this.time != null && this.st === 'play') { const u = this.time <= 5; G.text(c, rl + '  ·  ' + Math.max(0, Math.ceil(this.time)) + 's', 320, 35, { size: 12 + (u ? Math.sin(t * 12) * 1.2 : 0), color: u ? '#ff6b7a' : '#fff', stroke: false }); }
      else G.text(c, rl, 320, 35, { size: 12, stroke: false });
      if (this.hint && this.st === 'play') { c.font = `bold 8px ${G.FONT}`; const w = c.measureText(this.hint).width + 16; c.fillStyle = 'rgba(28,24,38,.8)'; c.beginPath(); c.roundRect(320 - w / 2, 340, w, 15, 6); c.fill(); G.text(c, this.hint, 320, 348, { size: 8, stroke: false, bold: false }); }
      if (this.msg && this.st === 'play') G.text(c, this.msg.text, 320, 322, { size: 12, color: this.msg.c, lw: 4 });
      if (this.st === 'count') {
        c.fillStyle = 'rgba(20,16,30,.45)'; c.fillRect(0, 62, 640, 298);
        if (this.round === 0) { const n = Math.ceil(this.stT - 0.4), k = (this.stT - 0.4) % 1; G.text(c, n > 0 ? String(n) : '¡YA!', 320, 180, { size: 60 + k * 26, color: '#ffd23f', lw: 9 }); }
        else G.text(c, this.stT > 0.55 ? `${this.label} ${this.round + 1}` : '¡YA!', 320, 180, { size: 52, color: '#ffd23f', lw: 9 });
      }
      if (this.st === 'rend' && !this.quietRend) {
        const w = this.last.w, k = Math.min(1, (this.rendT - this.stT) * 5);
        c.fillStyle = `rgba(20,16,30,${0.5 * k})`; c.fillRect(0, 140, 640, 84);
        G.text(c, w === 'p' ? `¡RONDA PARA ${P.name.toUpperCase()}!` : w === 'b' ? `RONDA PARA ${Bo.name.toUpperCase()}` : 'RONDA EMPATADA', 320, 172, { size: 22 + k * 8, color: w === 'p' ? '#7dff8a' : w === 'b' ? '#ff6b7a' : '#ffd23f', lw: 7 });
        if (this.last.text) G.text(c, this.last.text, 320, 204, { size: 11 });
      }
      if (ov) {
        const k = Math.min(1, this.endT * 4), w = this.result.win;
        c.fillStyle = `rgba(20,16,30,${0.6 * k})`; c.fillRect(0, 0, 640, 360);
        G.text(c, w === 'win' ? '¡GANASTE!' : w === 'tie' ? 'EMPATE' : `GANÓ ${Bo.name.toUpperCase()}`, 320, 160, { size: 30 + k * 18, color: w === 'win' ? '#7dff8a' : w === 'tie' ? '#ffd23f' : '#ff6b7a', lw: 9 });
        G.text(c, `${this.pw} – ${this.bw}`, 320, 202, { size: 22, lw: 6 });
        G.text(c, w === 'win' ? `${Bo.name} fue derrotado` : w === 'tie' ? 'Nadie cede terreno' : 'Habrá consecuencias…', 320, 230, { size: 11 });
      }
    }
  }

  // =========================================================
  // 1. DECORACIÓN EXPRESS — vs Pollito
  // =========================================================
  class DecoDuel extends Duel {
    constructor(who, done) {
      super(who, 'pollito', done, { time: 13, title: 'DECORACIÓN EXPRESS', hint: 'ESPACIO en verde para colgar · ESPACIO junto a Pollito para espantarlo' });
      this.p = new Actor(who, 520, 230); this.cat = new Actor('pollito', 880, 120);
      this.zone = 0.2 + stat(who, 'logica') * 0.013 + (G.S.inv.herramientas ? 0.07 : 0);
      this.chunks = [0, 1, 2].map((i) => G.S.deco.filter((_, k) => k % 3 === i)); this.knocks = 0; this.cam = CAM_SALA(); this.begin();
    }
    setup(n) { this.cur = this.chunks[n]; this.q = null; this.cool = 0; this.cs = 'wait'; this.ct = (n ? 2.6 : 3.6) - (G.S.flags.pollitoOfendido ? 0.8 : 0); this.target = null; this.p.frameOverride = null; }
    extra() { return { placed: G.S.deco.filter((d) => d.placed).length, total: G.S.deco.length, knocks: this.knocks }; }
    update(dt) {
      const p = this.p, cat = this.cat; p.update(dt); cat.update(dt);
      if (!this.tick(dt)) { p.walk(0, 0, 0, dt); cat.follow(dt); return; }
      this.cool -= dt;
      const todo = this.cur.filter((d) => !d.placed), busy = this.cs === 'go' || this.cs === 'scratch';
      if (this.q) {
        p.walk(0, 0, 0, dt);
        this.q.t += dt; this.q.pos = 0.5 + 0.5 * Math.sin(this.q.t * this.q.sp);
        if (G.input.hit('action')) {
          if (Math.abs(this.q.pos - this.q.c) <= this.zone / 2) { this.q.d.placed = true; this.say('¡Colgado!', '#7dff8a', 0.9); p.hop(150); W.puff(p.x, p.y - 6, 4, true); G.sfx('ok'); }
          else { this.say('¡Se cayó! (+ruido)', '#ff6b7a', 1.1); p.emo('💦', 0.9); G.sfx('bad'); G.addNoise(4); }
          this.q = null; this.cool = 0.3; p.frameOverride = null;
        }
      } else {
        const ax = G.input.axis(); p.walk(ax.x, ax.y, this.speed, dt, 'sala');
        this.near = todo.find((d) => dist(p, W.DECO_SPOTS[d.i]) < 30);
        if (G.input.hit('action') && this.cool <= 0) {
          if (busy && dist(p, cat) < 46) { this.cs = 'flee'; cat.hop(200); cat.emo('!', 0.7); cat.goTo(cat.x < 655 ? 920 : 390, cat.y < 165 ? 262 : 96, 250, true); G.sfx('meow'); this.say('¡Fuera, Pollito!', '#ffd23f', 0.9); this.cool = 0.3; }
          else if (this.near) { this.q = { d: this.near, t: Math.random() * 3, sp: 4.2 + Math.random() * 1.8 + this.round * 0.5, c: 0.25 + Math.random() * 0.5, pos: 0 }; p.frameOverride = 3; p.dir = 'up'; }
        }
      }
      cat.follow(dt);
      if (this.cs === 'wait') {
        if ((this.ct -= dt) <= 0) { const up = this.cur.filter((d) => d.placed); if (up.length) { this.target = up[(Math.random() * up.length) | 0]; const s = W.DECO_SPOTS[this.target.i]; cat.goTo(s.x + 16, s.y + 6, 118 + this.round * 14 + (G.S.flags.pollitoOfendido ? 18 : 0), true); this.cs = 'go'; } else this.ct = 0.6; }
      } else if (this.cs === 'go') { if (!this.target.placed) { this.cs = 'wait'; this.ct = 0.5; } else if (cat.arrived) { this.cs = 'scratch'; this.ct = 1.6; cat.emo('😼', 1.5); } }
      else if (this.cs === 'scratch') {
        cat.hop(70);
        if ((this.ct -= dt) <= 0) { if (this.target.placed) { this.target.placed = false; this.knocks++; const s = W.DECO_SPOTS[this.target.i]; W.puff(s.x, s.y, 6, true); G.sfx('bad'); G.addNoise(3); this.say('¡Pollito tiró una decoración!', '#ff6b7a', 1.2); } this.cs = 'wait'; this.ct = rnd(1, 1.8); }
      } else if (this.cs === 'flee' && cat.arrived) { this.cs = 'wait'; this.ct = rnd(1.6, 2.4); }
      if (this.time <= 0) { const n = this.cur.filter((d) => d.placed).length; this.endRound(n === this.cur.length ? 'p' : n === 0 ? 'b' : 'tie', `${n} de ${this.cur.length} quedaron colgadas`); }
    }
    draw(dt) {
      const p = this.p, cat = this.cat;
      W.render({
        cam: this.cam, dt, light: W.LIGHT.noche, actors: [p, cat], focusZ: 0,
        sprites: (t) => {
          this.cur.forEach((d) => { if (d.placed) return; const s = W.DECO_SPOTS[d.i]; ring(s.x, s.y, 26 + Math.sin(t * 5 + d.i) * 3, [1, 0.85, 0.3], 0.8); R.sprite(Sp.item(d.improv ? 'cartel' : s.kind), s.x, 40 + Math.sin(t * 3 + d.i) * 4, s.y - 4, { feet: 4, sx: 1.2, sy: 1.2, lit: 0.3, alpha: 0.9 }); });
          if (this.cs === 'scratch' || this.cs === 'go') ring(cat.x, cat.y, 30, [1, 0.3, 0.3], 0.5);
        },
        over: (c, t) => {
          if (this.q) { const h = p.head(26), x = h.x - 45, y = h.y; panel(c, x, y, 90, 12, '#4a4458'); c.fillStyle = '#58c46a'; c.fillRect(x + (this.q.c - this.zone / 2) * 90, y, this.zone * 90, 12); c.fillStyle = '#fff'; c.fillRect(x + this.q.pos * 87, y - 3, 3, 18); }
          else if (this.st === 'play') {
            if (dist(p, cat) < 46 && (this.cs === 'go' || this.cs === 'scratch')) { const h = cat.head(18); G.prompt(c, 'ESPACIO: ¡espantar!', h.x, h.y); }
            else if (this.near) { const h = p.head(24); G.prompt(c, 'ESPACIO: colgar', h.x, h.y); }
          }
          if (this.cs === 'scratch' && this.st === 'play') { const h = cat.head(30); panel(c, h.x - 16, h.y, 32, 5, '#4a4458'); c.fillStyle = '#ff6b7a'; c.fillRect(h.x - 16, h.y, 32 * (1 - this.ct / 1.6), 5); }
          this.hud(c, t, `${this.cur.filter((d) => d.placed).length}/${this.cur.length} colgadas`, `${this.knocks} tiradas`);
        },
      });
    }
  }

  // =========================================================
  // 2. POLLITO ROBÓ EL REGALO — persecución
  // =========================================================
  class ChaseDuel extends Duel {
    constructor(who, done) {
      super(who, 'pollito', done, { time: G.S.inv.premios ? 18 : 14, title: 'ATRAPA A POLLITO', hint: 'ESPACIO: embestida · Acorrálalo y embiste · Cuidado con los ovillos' });
      this.target = G.pollitoTarget(G.S);
      this.p = new Actor(who, 420, 200); this.cat = new Actor('pollito', 860, 110); this.cat.carry = [this.target.id]; this.cam = CAM_SALA(); this.begin();
    }
    setup(n) { const p = this.p, c = this.cat; [p.x, p.y] = n % 2 ? [900, 240] : [420, 200]; [c.x, c.y] = n % 2 ? [400, 100] : [860, 110]; p.vx = p.vy = c.vx = c.vy = 0; p.spin = 0; this.dashT = 0; this.cd = 0; this.dx = n % 2 ? -1 : 1; this.dy = 0; this.stun = 0; this.inv = 0; this.juke = 1.5; this.jukeT = 0; this.toys = []; this.toyT = 3; this.hd = { x: 0, y: 1 }; }
    extra() { return { target: this.target }; }
    update(dt) {
      const p = this.p, cat = this.cat; p.update(dt); cat.update(dt);
      if (!this.tick(dt)) { p.walk(0, 0, 0, dt); cat.moving = false; cat.vx = cat.vy = 0; return; }
      this.cd -= dt; this.inv -= dt; this.juke -= dt;
      const ax = G.input.axis();
      if (ax.x || ax.y) { const l = Math.hypot(ax.x, ax.y); this.dx = ax.x / l; this.dy = ax.y / l; }
      if (this.stun > 0) { this.stun -= dt; p.walk(0, 0, 0, dt, 'sala'); }
      else if (this.dashT > 0) { this.dashT -= dt; p.vx = this.dx * this.speed * 3.3; p.vy = this.dy * this.speed * 3.3; p.walk(this.dx, this.dy, this.speed * 3.3, dt, 'sala'); if (Math.random() < 0.6) W.puff(p.x, p.y, 1); }
      else { p.walk(ax.x, ax.y, this.speed, dt, 'sala'); if (G.input.hit('action') && this.cd <= 0) { this.dashT = 0.2; this.cd = 0.8; p.hop(90); G.sfx('pick'); } }
      if (this.dashT > 0 && this.inv <= 0 && dist(p, cat) < 30) { cat.flash = 1.1; cat.hop(230); cat.emo('!!', 0.8); W.puff(cat.x, cat.y, 8, true); G.sfx('meow'); this.dashT = 0; this.endRound('p', '¡Lo atrapaste!'); return; }
      if ((this.toyT -= dt) <= 0 && this.toys.length < 6) { this.toyT = G.S.flags.pollitoOfendido ? 2.4 : 3.2; this.toys.push({ x: cat.x, y: cat.y, t: 0 }); }
      for (let i = this.toys.length - 1; i >= 0; i--) { const o = this.toys[i]; o.t += dt; if (o.t > 0.6 && this.stun <= 0 && dist(o, p) < 17) { this.toys.splice(i, 1); this.stun = 0.85; p.spin = 0.85; p.vx = p.vy = 0; this.dashT = 0; p.emo('💫', 0.9); G.sfx('bad'); G.addNoise(3); this.say('¡Pisaste un ovillo!', '#ff6b7a', 1); } }
      const d = dist(p, cat), sp = (150 + this.round * 20) * (d > 260 ? 0.45 : 1);
      if (this.jukeT > 0) { this.jukeT -= dt; cat.vx = this.hd.x * 400; cat.vy = this.hd.y * 400; cat.walk(this.hd.x, this.hd.y, 400, dt, 'sala'); }
      else {
        let best = -1e9, bd = this.hd;
        for (let i = 0; i < 16; i++) {
          const a = (i / 16) * 6.2832, vx = Math.cos(a), vy = Math.sin(a), nx = cat.x + vx * 70, ny = cat.y + vy * 70; let s = 0;
          if (!W.canStand(cat.x + vx * 26, cat.y + vy * 26, 'sala')) s -= 6; if (!W.canStand(nx, ny, 'sala')) s -= 2.5;
          s += Math.hypot(nx - p.x, ny - p.y) * 0.02 + (vx * this.hd.x + vy * this.hd.y) * 0.5 - Math.hypot(nx - 655, ny - 165) * 0.0035;
          if (s > best) { best = s; bd = { x: vx, y: vy }; }
        }
        this.hd = bd;
        if (d > 300) { cat.walk(0, 0, 0, dt, 'sala'); if (Math.random() < dt * 0.8) cat.emo('😼', 1); } else cat.walk(bd.x, bd.y, sp, dt, 'sala');
        if (d < 62 && this.juke <= 0 && this.inv <= 0) { this.juke = (G.S.flags.pollitoOfendido ? 2.6 : 3.4) - this.round * 0.3; this.jukeT = 0.42; this.inv = 0.45; const l = d || 1, side = Math.random() < 0.5 ? 0.5 : -0.5; this.hd = { x: ((p.x - cat.x) / l) * 0.9 + ((p.y - cat.y) / l) * side, y: ((p.y - cat.y) / l) * 0.9 - ((p.x - cat.x) / l) * side }; cat.hop(210); G.sfx('meow'); this.say('¡Saltó por encima!', '#ffb86b', 0.8); }
      }
      if (this.time <= 0) this.endRound('b', 'Se te escapó');
    }
    draw(dt) {
      const p = this.p, cat = this.cat;
      W.render({
        cam: this.cam, dt, light: W.LIGHT.noche, actors: [p, cat], focusZ: 0,
        sprites: () => { this.toys.forEach((o) => { R.shadow(o.x, o.y, 8, 0.6); R.sprite(Sp.item('ovillo'), o.x, Math.max(0, 30 - o.t * 90), o.y, { feet: 6, sx: 0.8, sy: 0.8 }); }); if (this.cd <= 0 && this.st === 'play') ring(p.x, p.y, 22, [0.5, 1, 0.6], 0.5); },
        over: (c, t) => { this.hud(c, t, 'Atrápalo', this.target.name); if (this.cd > 0 && this.st === 'play') { const h = p.head(8); panel(c, h.x - 14, h.y, 28, 4, '#4a4458'); c.fillStyle = '#7dff8a'; c.fillRect(h.x - 14, h.y, 28 * (1 - this.cd / 0.8), 4); } },
      });
    }
  }

  // =========================================================
  // 3. BATALLA DE MENSAJES — vs José (5 mensajes, gana quien llegue a 3)
  // =========================================================
  let msgMesh = null;
  function buildMsgArena() {
    const m = new R.MB();
    m.flat(-600, -400, 1200, 900, -1, '#100d18');
    for (let j = 0; j < 12; j++) m.flat(-300, -90 + j * 14, 296, 13.4, 0, ['#c99b66', '#c2925c', '#d0a470'][j % 3]);
    m.box(-300, 0, -110, 300, 130, 20, '#3a3348', { s: '#ecd8b4' }); m.box(-300, 0, -90.5, 300, 22, 1, '#c9ae82');
    m.box(-250, 54, -91, 44, 34, 2, '#5b4636'); m.wallQuad(-246, 58, -88.8, 36, 26, '#7fd3ff'); m.wallQuad(-246, 58, -88.7, 36, 9, '#58b56a');
    m.box(-190, 0, -40, 110, 20, 44, '#3d7a74'); m.box(-190, 20, -40, 110, 26, 12, '#2f615c'); m.box(-190, 20, -28, 12, 12, 32, '#356b66'); m.box(-92, 20, -28, 12, 12, 32, '#356b66');
    m.cyl(-40, 0, -50, 9, 2, '#5b4636'); m.cyl(-40, 2, -50, 2, 70, '#5b4636'); m.cyl(-40, 68, -50, 15, 18, '#ffe9a8', { r2: 8, emit: true });
    m.flat(-230, -10, 190, 80, 0.4, '#a8463f'); m.flat(-222, -2, 174, 64, 0.5, '#c9625a');
    m.box(-4, 0, -110, 8, 130, 190, '#3a3348', { w: '#ecd8b4', e: '#4a4660' });
    m.flat(4, -90, 296, 170, 0, '#3b3a4a'); for (let i = 0; i < 6; i++) m.flat(20 + i * 50, 30, 26, 5, 0.3, '#d9d4a0');
    m.flat(4, -90, 296, 50, 2, '#565468'); m.box(4, 0, -41, 296, 2, 3, '#6a6880');
    m.box(4, 0, -110, 296, 150, 20, '#2c2638', { s: '#4a3f5c' });
    for (let i = 0; i < 4; i++) for (let j = 0; j < 2; j++) { const on = (i + j * 3) % 3 !== 1; m.box(30 + i * 68, 40 + j * 54, -90.5, 34, 36, 1, '#2a2438'); m.wallQuad(33 + i * 68, 43 + j * 54, -89.3, 28, 30, on ? '#ffd88a' : '#1b1930', on); }
    m.cyl(240, 0, -50, 5, 4, '#2a2438'); m.cyl(240, 4, -50, 2.5, 96, '#2a2438'); m.box(222, 98, -53, 22, 4, 6, '#2a2438'); m.box(220, 92, -54, 12, 6, 8, '#fff2b0', { emit: true });
    m.box(40, 0, -70, 60, 26, 24, '#2f5a3c'); m.box(40, 26, -70, 60, 6, 24, '#3f7a4f');
    return m.upload();
  }
  class MessageDuel extends Duel {
    constructor(who, done) {
      super(who, 'jose', done, { rounds: 5, need: 3, rendT: 1.8, label: 'MENSAJE', title: 'BATALLA DE MENSAJES', hint: 'Elige con ←  ↑  → la respuesta que la deja dormir, antes de que José envíe la suya' });
      msgMesh = msgMesh || buildMsgArena(); this.quietRend = true;
      this.p = new Actor(who, -175, 30); this.p.dir = 'right'; this.jose = new Actor('jose', 175, 24); this.jose.dir = 'left';
      this.qs = shuffle(G.MESSAGES.slice()).slice(0, 5); this.cam = { x: 0, y: 80, z: 0, dist: 520, pitch: 0.42, fov: 34 };
      this.base = 3.3 + stat(who, 'carisma') * 0.13 + (G.S.flags.jose === 'aliado' ? 0.5 : G.S.flags.jose === 'desconfia' ? -0.35 : 0); this.begin();
    }
    setup(n) { const r = (this.q = this.qs[n]); this.opts = shuffle([{ t: r.ok, ok: true }, { t: r.bad[0] }, { t: r.bad[1] }]); this.read = 0.9; this.jt = 0; this.jmax = this.base - n * 0.18 + rnd(-0.3, 0.3); this.pick = -1; this.p.expr = null; }
    res(pw, why) { if (pw) { this.p.hop(190); this.p.expr = 'happy'; this.jose.emo('💢', 1.2); G.addSus(-2); } else { this.jose.hop(190); this.p.expr = 'surprised'; this.p.emo('💦', 1.2); G.addSus(3); } this.endRound(pw ? 'p' : 'b', why); }
    update(dt) {
      this.p.update(dt); this.jose.update(dt);
      if (!this.tick(dt)) return;
      if (this.read > 0) { this.read -= dt; if (this.read <= 0) G.input.flush(); return; }
      this.jt += dt;
      const k = G.input.hit('left') ? 0 : G.input.hit('up') ? 1 : G.input.hit('right') ? 2 : -1;
      if (k >= 0) { this.pick = k; this.res(!!this.opts[k].ok, this.opts[k].ok ? 'Respondiste primero' : 'Esa respuesta la despertó más'); }
      else if (this.jt >= this.jmax) this.res(false, 'José envió su mensaje primero');
    }
    draw(dt) {
      const r = this.q;
      W.render({
        cam: this.cam, dt, mesh: msgMesh, actors: [this.p, this.jose],
        light: { amb: [0.5, 0.48, 0.58], sun: [0.25, 0.24, 0.3], sky: '#100d18', points: [{ x: -40, y: 70, z: -30, r: 260, c: [0.7, 0.55, 0.3] }, { x: 225, y: 90, z: -40, r: 240, c: [0.55, 0.5, 0.3] }] },
        sprites: () => { R.sprite(Sp.item('flores'), 157, 26, 25, { sx: 0.8, sy: 0.8, feet: 4 }); },
        over: (c, t) => {
          this.hud(c, t, `${this.pw} punto${this.pw === 1 ? '' : 's'}`, `${this.bw} punto${this.bw === 1 ? '' : 's'}`);
          if (this.st === 'count' || this.st === 'over') return;
          const x = 210, y = 64, w = 220, h = 252, show = this.st === 'rend';
          panel(c, x, y, w, h, '#221c33'); c.fillStyle = '#3a2f57'; c.beginPath(); c.roundRect(x, y, w, 30, [7, 7, 0, 0]); c.fill();
          face(c, 'ximena', x + 6, y + 3, 24, 'tired'); G.text(c, 'Ximena', x + 36, y + 11, { size: 9, align: 'left', stroke: false }); G.text(c, 'medio dormida…', x + 36, y + 22, { size: 7, align: 'left', color: '#b9b0d6', stroke: false, bold: false });
          c.fillStyle = '#43305f'; c.beginPath(); c.roundRect(x + 10, y + 38, w - 40, 34, 8); c.fill(); wrap(c, r.x, x + 18, y + 49, w - 56, 8.5, '#fff');
          if (this.read <= 0) this.opts.forEach((o, i) => {
            const oy = y + 82 + i * 42, sel = this.pick === i;
            c.fillStyle = !show ? '#322a47' : o.ok ? '#1f4a35' : sel ? '#55222c' : '#2a2438'; c.beginPath(); c.roundRect(x + 30, oy, w - 40, 36, 8); c.fill();
            if (show && (o.ok || sel)) { c.strokeStyle = o.ok ? '#7dff8a' : '#ff6b7a'; c.lineWidth = 1.5; c.stroke(); }
            c.fillStyle = '#ffd23f'; c.beginPath(); c.roundRect(x + 8, oy + 8, 20, 20, 5); c.fill(); G.text(c, '←↑→'[i], x + 18, oy + 18, { size: 12, color: '#1c1826', stroke: false });
            wrap(c, o.t, x + 38, oy + 12, w - 56, 8, '#fff');
          });
          const jy = y + h - 34; c.fillStyle = '#40243a'; c.beginPath(); c.roundRect(x + 10, jy, w - 20, 26, 8); c.fill(); face(c, 'jose', x + 14, jy + 3, 20);
          if (show) { const pwin = this.last.w === 'p'; if (!pwin) wrap(c, 'José: ' + r.jose, x + 40, jy + 9, w - 56, 7.5, '#ffb0b8'); else G.text(c, 'José borró su mensaje.', x + 40, jy + 13, { size: 7.5, align: 'left', color: '#b9b0d6', stroke: false }); G.text(c, (pwin ? '✔ ' : '✖ ') + this.last.text, 320, y + h + 12, { size: 11, color: pwin ? '#7dff8a' : '#ff6b7a', lw: 4 }); }
          else if (this.read <= 0) { G.text(c, 'José está escribiendo…', x + 40, jy + 8, { size: 7, align: 'left', color: '#ffb0b8', stroke: false }); c.fillStyle = '#1c1826'; c.fillRect(x + 40, jy + 15, w - 60, 6); c.fillStyle = this.jt / this.jmax > 0.7 ? '#ff6b7a' : '#ffb86b'; c.fillRect(x + 40, jy + 15, (w - 60) * Math.min(1, this.jt / this.jmax), 6); }
          else G.text(c, 'Lee con calma…', x + 40, jy + 13, { size: 7.5, align: 'left', color: '#b9b0d6', stroke: false });
        },
      });
    }
  }

  // =========================================================
  // 4. PIZZA SILENCIOSA — tres pisos de carrera de equilibrio vs José
  // =========================================================
  let hallMesh = null; const GOAL = 560;
  function buildHall() {
    const m = new R.MB();
    m.flat(-700, -500, 2200, 1200, -2, '#0e0c15');
    for (let i = 0; i < 30; i++) for (let j = 0; j < 5; j++) m.flat(-120 + i * 30, j * 30, 29.4, 29.4, 0, (i + j) & 1 ? '#7d7692' : '#6c6580');
    m.flat(-120, 68, 900, 14, 0.3, '#8f2f3e'); m.flat(-120, 70, 900, 10, 0.4, '#b5434f');
    m.box(-120, 0, -20, 900, 120, 20, '#2c2638', { s: '#d9cdb8' }); m.box(-120, 0, -0.5, 900, 26, 1, '#8f7f6a'); m.box(-120, 26, -0.4, 900, 3, 1, '#5b4636');
    for (let i = 0; i < 4; i++) {
      const x = -60 + i * 200, last = i === 3;
      m.box(x - 4, 0, -1, 58, 90, 2, '#5b3b2a'); m.box(x, 0, 0.2, 50, 86, 1.6, last ? '#8f5fd6' : ['#7a563a', '#3f6fb5', '#2f5a3c'][i % 3]); m.box(x + 40, 40, 1.8, 4, 4, 2, '#f2c230');
      m.box(x + 17, 62, 1.9, 16, 10, 0.6, '#f4efe2'); m.flat(x + 2, 4, 46, 20, 0.5, last ? '#f08cc0' : '#8d7a5c');
      m.box(x + 100, 96, -1, 20, 5, 8, '#2a2438'); m.box(x + 103, 92, 0, 14, 4, 8, '#fff2b0', { emit: true });
      if (i % 2 === 0) { m.cyl(x + 140, 0, 14, 10, 18, '#b5653a', { r2: 12 }); m.cyl(x + 140, 18, 14, 16, 22, '#3f8f4f', { r2: 5 }); } else m.box(x + 132, 30, 0, 12, 26, 8, '#d6402f');
    }
    m.box(-120, 0, 150, 900, 18, 6, '#3a3348'); for (let i = 0; i < 23; i++) m.box(-120 + i * 40, 18, 151, 4, 16, 4, '#3a3348'); m.box(-120, 34, 150, 900, 3, 6, '#57506b');
    for (let i = 0; i < 10; i++) { m.flat(GOAL + (i % 2) * 8, i * 15, 8, 15, 0.6, '#f4f4f8'); m.flat(GOAL + ((i + 1) % 2) * 8, i * 15, 8, 15, 0.6, '#1c1826'); }
    m.flat(-6, 0, 6, 150, 0.6, '#f4f4f8');
    return m.upload();
  }
  class PizzaRace extends Duel {
    constructor(who, done) {
      super(who, 'jose', done, { label: 'PISO', title: 'PIZZA SILENCIOSA', hint: '→ para avanzar · ↑ ↓ para equilibrar la pizza · Más rápido = más tambaleo' });
      hallMesh = hallMesh || buildHall();
      this.p = new Actor(who, 0, 124); this.jose = new Actor('jose', -26, 26); this.drops = 0;
      this.vmax = 96 + stat(who, 'velocidad') * 9; this.driftK = 1.22 - stat(who, 'sigilo') * 0.035;
      this.cam = { x: 60, y: 30, z: 80, dist: 500, pitch: 0.66, fov: 34 }; this.begin();
    }
    setup(n) {
      const p = this.p, j = this.jose, f = G.S.flags.jose; p.x = 0; j.x = -26; p.dir = j.dir = 'right'; p.carry = ['bocaditos']; j.carry = ['flores']; p.spin = j.spin = 0;
      this.v = 0; this.b = 0; this.drift = 0; this.driftT = 0; this.stun = 0; this.pz = null; this.jv = 0; this.jtarget = 150 * (f === 'aliado' ? 0.7 : f === 'desconfia' ? 0.82 : 0.76) * (1 + n * 0.07); this.jst = rnd(1.4, 2.6); this.jstun = 0; this.cam.x = 60;
    }
    extra() { return { drops: this.drops }; }
    update(dt) {
      const p = this.p, j = this.jose; p.update(dt); j.update(dt);
      W.camLerp(this.cam, Math.min(GOAL - 60, p.x + 90), 80, dt, 5);
      if (!this.tick(dt)) { p.moving = j.moving = false; p.vx = j.vx = 0; return; }
      if (this.stun > 0) { this.stun -= dt; this.v = 0; if (this.stun <= 0) { p.carry = ['bocaditos']; this.b = 0; } }
      else {
        this.v += (G.input.held('right') ? 150 : -240) * dt; this.v = Math.max(0, Math.min(this.vmax, this.v));
        if ((this.driftT -= dt) <= 0) { this.driftT = rnd(0.35, 0.8); this.drift = (Math.random() < 0.5 ? -1 : 1) * rnd(0.6, 1); if (Math.abs(this.b) > 0.5 && Math.random() < 0.65) this.drift = Math.sign(this.b) * Math.abs(this.drift); }
        const f = this.v / this.vmax;
        this.b += (this.drift * (0.12 + 1.75 * Math.pow(f, 1.6)) * this.driftK * (1 + this.round * 0.12) + ((G.input.held('down') ? 1 : 0) - (G.input.held('up') ? 1 : 0)) * 2.1) * dt;
        if (Math.abs(this.b) > 1) { this.drops++; this.stun = 1.2; this.v = 0; p.carry = []; p.emo('💦', 1.2); p.spin = 0.4; this.pz = { x: p.x + 20, y: p.y + this.b * 14, t: 0 }; G.sfx('bad'); G.addNoise(4); this.say('¡Se cayó la pizza! (+ruido)', '#ff6b7a', 1.2); }
      }
      p.x += this.v * dt; p.vx = this.v; p.vy = 0; p.moving = this.v > 10; p.carryTilt = this.b;
      if (this.pz) this.pz.t += dt;
      if (this.jstun > 0) { this.jstun -= dt; this.jv = 0; }
      else { this.jv = Math.min(this.jtarget, this.jv + 130 * dt); if ((this.jst -= dt) <= 0) { this.jst = rnd(2, 3.6); if (Math.random() < 0.5) { this.jstun = 1.05; j.emo('💦', 1); j.spin = 0.35; G.sfx('msg'); } } }
      j.x += this.jv * dt; j.vx = this.jv; j.vy = 0; j.moving = this.jv > 10; j.carryTilt = Math.sin(this.T * 5) * 0.25;
      if (p.x >= GOAL || j.x >= GOAL) { const w = p.x >= GOAL; (w ? p : j).hop(200); this.endRound(w ? 'p' : 'b', w ? 'Llegaste primero a la escalera' : 'José subió antes'); }
    }
    draw(dt) {
      const p = this.p, j = this.jose;
      W.render({
        cam: this.cam, dt, mesh: hallMesh, actors: [j, p],
        light: { amb: [0.5, 0.48, 0.56], sun: [0.3, 0.28, 0.3], sky: '#0e0c15', points: [0, 1, 2].map((i) => ({ x: Math.round((this.cam.x - 50) / 200) * 200 + 50 + (i - 1) * 200, y: 90, z: 40, r: 230, c: [0.5, 0.44, 0.26] })) },
        sprites: () => { if (this.pz && this.stun > 0) R.sprite(Sp.item('bocaditos'), this.pz.x, Math.max(0, 50 - this.pz.t * 160), this.pz.y, { feet: 5, roll: Math.min(1.4, this.pz.t * 6) }); },
        over: (c, t) => {
          this.hud(c, t, `${Math.max(0, Math.min(100, Math.round((p.x / GOAL) * 100)))}%`, `${Math.max(0, Math.min(100, Math.round((j.x / GOAL) * 100)))}%`);
          panel(c, 180, 62, 280, 12, '#322a47'); c.fillStyle = '#f08cc0'; c.fillRect(452, 62, 6, 12);
          face(c, 'jose', 180 + Math.max(0, Math.min(1, j.x / GOAL)) * 262, 58, 16); face(c, this.who, 180 + Math.max(0, Math.min(1, p.x / GOAL)) * 262, 66, 16);
          if (this.st === 'play' && this.stun <= 0) {
            const h = p.head(0), bx = h.x + 34, by = h.y - 8, bh = 56;
            panel(c, bx, by, 10, bh, '#4a4458'); c.fillStyle = '#ff6b7a'; c.fillRect(bx, by, 10, 7); c.fillRect(bx, by + bh - 7, 10, 7); c.fillStyle = '#58c46a'; c.fillRect(bx, by + bh * 0.3, 10, bh * 0.4);
            c.fillStyle = '#fff'; c.fillRect(bx - 3, by + (this.b * 0.5 + 0.5) * (bh - 3), 16, 3); G.text(c, '↑', bx + 5, by - 7, { size: 9 }); G.text(c, '↓', bx + 5, by + bh + 8, { size: 9 });
          }
        },
      });
    }
  }

  // =========================================================
  // 5. SONÁMBULA — luz roja / luz verde vs José
  // =========================================================
  class SleepwalkDuel extends Duel {
    constructor(who, done) {
      super(who, 'jose', done, { time: 24, title: 'SONÁMBULA', hint: '→ para avanzar · ¡Quieto cuando Ximena voltea! · Llega a ella antes que José' });
      this.x0 = 388; this.goal = 872; this.p = new Actor(who, this.x0, 266); this.jose = new Actor('jose', this.x0, 92); this.xi = new Actor('ximena', 936, 160);
      this.grace = 0.17 + stat(who, 'sigilo') * 0.013; this.caught = 0; const f = G.S.flags.jose; this.jbase = (f === 'aliado' ? 80 : f === 'desconfia' ? 94 : 87) * 1.45; this.pspeed = (64 + stat(who, 'velocidad') * 7) * 1.5; this.cam = CAM_SALA(); this.begin();
    }
    setup(n) { const p = this.p, j = this.jose, xi = this.xi; p.x = j.x = this.x0; p.vx = j.vx = 0; p.dir = j.dir = 'right'; p.spin = j.spin = 0; xi.dir = 'right'; xi.expr = 'sleep'; this.ph = 'green'; this.pt = rnd(1.4, 2.4); this.redT = 0; this.jsp = this.jbase * (1 + n * 0.06); this.jmove = true; this.jwait = 0; }
    extra() { return { caught: this.caught }; }
    back(a, isP) { a.x = Math.max(this.x0, a.x - 135); a.vx = 0; a.spin = 0.6; a.flash = 0.6; a.emo('😱', 1); W.puff(a.x, a.y, 5); if (isP) { this.caught++; G.addSus(4); G.sfx('bad'); } else G.sfx('msg'); }
    update(dt) {
      const p = this.p, j = this.jose, xi = this.xi; p.update(dt); j.update(dt); xi.update(dt);
      if (!this.tick(dt)) { p.walk(0, 0, 0, dt); j.moving = false; return; }
      this.pt -= dt;
      if (this.ph === 'green' && this.pt <= 0) { this.ph = 'cue'; this.cue = this.pt = rnd(0.5, 0.85) - this.round * 0.05; xi.say('…mmm…', this.cue); xi.hop(50); G.sfx('msg'); this.jreact = rnd(0.22, this.cue + (G.S.flags.jose === 'desconfia' ? 0.2 : 0.3)); }
      else if (this.ph === 'cue' && this.pt <= 0) { this.ph = 'red'; this.pt = rnd(1, 1.9); this.redT = 0; xi.dir = 'left'; xi.expr = 'tired'; xi.hop(60); G.sfx('door'); }
      else if (this.ph === 'red' && this.pt <= 0) { this.ph = 'green'; this.pt = rnd(1.3, 2.6); xi.dir = 'right'; xi.expr = 'sleep'; this.jwait = rnd(0.35, 0.8); }
      p.walk(G.input.held('right') ? 1 : 0, 0, this.pspeed, dt, 'sala');
      if (this.ph === 'cue') { if (this.cue - this.pt >= this.jreact) this.jmove = false; } else if (this.ph === 'green') { if ((this.jwait -= dt) <= 0) this.jmove = true; }
      j.vx += ((this.jmove ? this.jsp : 0) - j.vx) * Math.min(1, dt * 12); j.x += j.vx * dt; j.moving = j.vx > 10;
      if (this.ph === 'red') {
        this.redT += dt;
        if (this.redT > this.grace && p.spd > 16) { this.back(p, true); xi.say(`¿…${G.CHARS[p.id].name}?`, 1.2); this.say('¡Te vio moverte! (+sospecha)', '#ff6b7a', 1.2); this.pt = Math.max(this.pt, 0.9); }
        if (this.redT > 0.17 && j.vx > 16) { this.back(j, false); this.jmove = false; xi.say('¿…José?', 1.2); this.say('¡Ximena vio a José!', '#7dff8a', 1.1); }
      }
      if (p.x >= this.goal || j.x >= this.goal) { const w = p.x >= this.goal && p.x >= j.x; (w ? p : j).hop(190); this.endRound(w ? 'p' : 'b', w ? 'Llegaste a ella primero' : 'José llegó antes'); }
      else if (this.time <= 0) this.endRound(p.x > j.x + 4 ? 'p' : j.x > p.x + 4 ? 'b' : 'tie', 'Se acabó el tiempo');
    }
    draw(dt) {
      const red = this.ph === 'red' && this.st === 'play', cue = this.ph === 'cue', xi = this.xi, L = W.LIGHT.noche, pr = (a) => Math.max(0, Math.min(100, Math.round(((a.x - this.x0) / (this.goal - this.x0)) * 100)));
      W.render({
        cam: this.cam, dt, actors: [this.p, this.jose, xi], focusZ: 0,
        light: { amb: red ? [0.42, 0.24, 0.3] : L.amb, sun: L.sun, sky: L.sky, points: [L.points[0], { x: xi.x - (red ? 60 : -10), y: 50, z: xi.y, r: red ? 420 : 150, c: red ? [0.9, 0.25, 0.2] : [0.3, 0.6, 0.35] }] },
        sprites: () => { for (const z of [92, 266]) { for (let x = this.x0; x < this.goal; x += 40) R.flat(R.glowTex, x + 20, 0.8, z + 6, 7, { tint: red ? [1, 0.3, 0.3] : [0.5, 1, 0.6], alpha: 0.35 }); R.flat(R.glowTex, this.goal + 6, 0.8, z, 26, { tint: [1, 0.85, 0.3], alpha: 0.6 }); } },
        over: (c, t) => {
          this.hud(c, t, pr(this.p) + '%', pr(this.jose) + '%');
          if (this.st !== 'play') return;
          const h = xi.head(30); panel(c, h.x - 46, h.y - 8, 92, 18, red ? '#7a1f2b' : cue ? '#7a5a1f' : '#1f4a35');
          G.text(c, red ? '✋ ¡QUIETO!' : cue ? '⚠ ¡VA A VOLTEAR!' : '▶ AVANZA', h.x, h.y + 1, { size: 9, color: red ? '#ffb0b8' : cue ? '#ffd23f' : '#7dff8a', stroke: false });
          if (red) { c.strokeStyle = 'rgba(255,80,90,.55)'; c.lineWidth = 6; c.strokeRect(3, 65, 634, 292); }
        },
      });
    }
  }

  // =========================================================
  // 6. MEMORIA DE CAJAS — vs José (parejas por turnos)
  // =========================================================
  class MemoryDuel extends Duel {
    constructor(who, done) {
      super(who, 'jose', done, { title: 'MEMORIA DE CAJAS', hint: '← → ↑ ↓ para elegir caja · ESPACIO para abrirla · Si aciertas, repites turno' });
      this.p = new Actor(who, 470, 250); this.p.dir = 'up'; this.jose = new Actor('jose', 840, 250); this.jose.dir = 'up';
      const f = G.S.flags.jose; this.recall = (f === 'aliado' ? 0.5 : f === 'desconfia' ? 0.72 : 0.6) - stat(who, 'logica') * 0.012; this.cam = CAM_SALA(); this.begin();
    }
    setup(n) {
      const pool = shuffle(['pastel', 'globos', 'regalo', 'luces', 'bocaditos', 'bebidas', 'guirnalda', 'parlante', 'velas', 'flores', 'herramientas', 'premios']).slice(0, 4);
      this.cards = shuffle(pool.concat(pool)).map((id) => ({ id, up: false, own: null, fl: 0 }));
      this.turn = n % 2 ? 'b' : 'p'; this.cur = 0; this.open = []; this.wait = 0; this.pp = 0; this.bp = 0; this.seen = {}; this.think = 1;
    }
    flip(i) { const c = this.cards[i]; c.up = true; c.fl = 0.25; this.seen[i] = c.id; this.open.push(i); G.sfx('pick'); if (this.open.length === 2) this.wait = 0.9; }
    update(dt) {
      this.p.update(dt); this.jose.update(dt); this.cards.forEach((c) => (c.fl = Math.max(0, c.fl - dt)));
      if (!this.tick(dt)) return;
      if (this.wait > 0) {
        if ((this.wait -= dt) > 0) return;
        const [a, b] = this.open.map((i) => this.cards[i]), who = this.turn === 'p' ? this.p : this.jose;
        if (a.id === b.id) { a.own = b.own = this.turn; if (this.turn === 'p') this.pp++; else this.bp++; who.hop(170); who.expr = 'happy'; G.sfx('ok'); this.say(this.turn === 'p' ? '¡Pareja! Repites turno' : 'José encontró una pareja', this.turn === 'p' ? '#7dff8a' : '#ff6b7a', 1); }
        else { a.up = b.up = false; this.turn = this.turn === 'p' ? 'b' : 'p'; who.expr = null; G.sfx('msg'); }
        this.open = []; this.think = rnd(0.7, 1.1);
        if (this.cards.every((c) => c.own)) this.endRound(this.pp > this.bp ? 'p' : this.bp > this.pp ? 'b' : 'tie', `${this.pp} parejas contra ${this.bp}`);
        return;
      }
      const down = this.cards.map((c, i) => i).filter((i) => !this.cards[i].up);
      if (this.turn === 'p') {
        const mv = G.input.hit('left') ? -1 : G.input.hit('right') ? 1 : G.input.hit('up') ? -4 : G.input.hit('down') ? 4 : 0;
        if (mv) { const n = this.cur + mv; if (n >= 0 && n < 8 && !(Math.abs(mv) === 1 && Math.floor(n / 4) !== Math.floor(this.cur / 4))) this.cur = n; }
        if (G.input.hit('action') && !this.cards[this.cur].up) this.flip(this.cur);
      } else if ((this.think -= dt) <= 0) {
        this.think = rnd(0.6, 0.9);
        let pick = -1; const known = down.filter((i) => this.seen[i]);
        if (!this.open.length) { for (const i of known) { const j = known.find((k) => k !== i && this.seen[k] === this.seen[i]); if (j != null && Math.random() < this.recall) { pick = i; break; } } if (pick < 0) { const unk = down.filter((i) => !this.seen[i]); pick = (unk.length ? unk : down)[(Math.random() * (unk.length || down.length)) | 0]; } }
        else { const id = this.cards[this.open[0]].id, m = known.find((i) => this.seen[i] === id); if (m != null && Math.random() < this.recall + 0.15) pick = m; else pick = down[(Math.random() * down.length) | 0]; }
        this.flip(pick); this.cur = pick;
      }
    }
    draw(dt) {
      W.render({
        cam: this.cam, dt, light: W.LIGHT.noche, actors: [this.p, this.jose], focusZ: 0,
        over: (c, t) => {
          this.hud(c, t, `${this.pp} parejas`, `${this.bp} parejas`);
          if (this.st === 'over') return;
          const cw = 74, ch = 84, gx = 12, x0 = 320 - (cw * 4 + gx * 3) / 2, y0 = 78;
          panel(c, x0 - 14, y0 - 12, cw * 4 + gx * 3 + 28, ch * 2 + gx + 44, 'rgba(34,28,51,.92)');
          this.cards.forEach((cd, i) => {
            const x = x0 + (i % 4) * (cw + gx), y = y0 + Math.floor(i / 4) * (ch + gx), k = cd.fl > 0 ? Math.abs(Math.cos((cd.fl / 0.25) * Math.PI)) : 1, w = cw * Math.max(0.08, k);
            c.fillStyle = '#1c1826'; c.beginPath(); c.roundRect(x + (cw - w) / 2 - 2, y - 2, w + 4, ch + 4, 8); c.fill();
            const face_ = cd.up && cd.fl < 0.125;
            c.fillStyle = face_ ? (cd.own === 'p' ? '#d8f7dd' : cd.own === 'b' ? '#f7d8dc' : '#fdfdf5') : '#b98a55'; c.beginPath(); c.roundRect(x + (cw - w) / 2, y, w, ch, 6); c.fill();
            if (face_) { c.imageSmoothingEnabled = false; c.drawImage(Sp.item(cd.id), x + (cw - 56 * k) / 2, y + 14, 56 * k, 56); }
            else if (k > 0.5) { c.fillStyle = '#e8d9b8'; c.fillRect(x + cw / 2 - 5, y, 10, ch); c.fillStyle = '#8f6238'; c.fillRect(x + (cw - w) / 2, y + ch - 8, w, 8); G.text(c, '?', x + cw / 2, y + ch / 2, { size: 22, color: '#5b3b2a', stroke: false }); }
            if (i === this.cur && this.st === 'play') { c.strokeStyle = this.turn === 'p' ? '#ffd23f' : '#ff6b7a'; c.lineWidth = 3; c.beginPath(); c.roundRect(x - 4, y - 4 + Math.sin(t * 8) * 1, cw + 8, ch + 8, 9); c.stroke(); }
          });
          if (this.st === 'play') G.text(c, this.turn === 'p' ? '▶ TU TURNO' : 'Turno de José…', 320, y0 + ch * 2 + gx + 16, { size: 12, color: this.turn === 'p' ? '#7dff8a' : '#ffb0b8' });
        },
      });
    }
  }

  // =========================================================
  // 7. CACTUS RODANTES — sobrevive a las bolas con púas de Pollito
  // =========================================================
  class SpikeDuel extends Duel {
    constructor(who, done) {
      super(who, 'pollito', done, { time: 12, title: 'CACTUS RODANTES', hint: 'Muévete con WASD o flechas · Esquiva los cactus hasta que se acabe el tiempo' });
      this.p = new Actor(who, 180, 250); this.cat = new Actor('pollito', 150, 58); this.cat.elev = 40; this.cam = { x: 185, y: 0, z: 150, dist: 430, pitch: 0.92, fov: 34 }; this.begin();
    }
    setup(n) { const p = this.p; p.x = 180; p.y = 255; p.vx = p.vy = 0; p.spin = 0; this.balls = []; for (let i = 0; i < n + 2; i++) this.spawn(i * 0.5); this.next = 3.4; }
    spawn(delay) { const a = rnd(0.5, 2.6), sp = 118 + this.round * 16 + (G.S.flags.pollitoOfendido ? 12 : 0); this.balls.push({ x: rnd(70, 230), y: 96, vx: Math.cos(a) * sp, vy: Math.abs(Math.sin(a)) * sp, t: -delay, r: rnd(0, 6) }); this.cat.hop(90); }
    update(dt) {
      const p = this.p; p.update(dt); this.cat.update(dt);
      if (!this.tick(dt)) { p.walk(0, 0, 0, dt); return; }
      const ax = G.input.axis(); p.walk(ax.x, ax.y, this.speed, dt, 'cocina');
      if ((this.next -= dt) <= 0 && this.balls.length < 5 + this.round) { this.next = 3; this.spawn(0); this.cat.emo('😼', 0.8); G.sfx('meow'); }
      for (const b of this.balls) {
        b.t += dt; if (b.t < 0) continue;
        const nx = b.x + b.vx * dt, ny = b.y + b.vy * dt;
        if (W.canStand(nx, b.y, 'cocina')) b.x = nx; else b.vx = -b.vx;
        if (W.canStand(b.x, ny, 'cocina')) b.y = ny; else b.vy = -b.vy;
        b.r += (b.vx > 0 ? 1 : -1) * dt * 7;
        if (b.t > 0.5 && dist(b, p) < 17) { p.spin = 0.8; p.flash = 0.8; p.emo('💥', 1); W.puff(p.x, p.y, 8, true); G.addNoise(4); this.endRound('b', '¡Te pinchó un cactus!'); return; }
      }
      if (this.time <= 0) { p.hop(180); this.endRound('p', 'Ni una espina'); }
    }
    draw(dt) {
      W.render({
        cam: this.cam, dt, light: W.LIGHT.noche, actors: [this.p, this.cat], focusZ: 0,
        sprites: () => this.balls.forEach((b) => { if (b.t < 0) return; R.shadow(b.x, b.y, 12, 0.8); R.sprite(Sp.item('cactus'), b.x, 2 + Math.abs(Math.sin(b.r * 1.5)) * 5, b.y, { feet: 5, flip: Math.sin(b.r * 3) > 0, sx: 1.35, sy: 1.35 }); ring(b.x, b.y, 18, [1, 0.35, 0.3], 0.35); }),
        over: (c, t) => this.hud(c, t, 'Sobrevive', `${this.balls.length} cactus`),
      });
    }
  }

  // =========================================================
  // 8. OJO CON EL PISOTÓN — Pollito cae sobre los cojines marcados
  // =========================================================
  let stompMesh = null;
  function buildStompArena() {
    const m = new R.MB();
    m.flat(-500, -400, 1000, 800, -1, '#0f0d1a'); m.flat(-150, -150, 300, 300, 0, '#8ea5c8');
    for (let j = 0; j < 15; j++) for (let i = 0; i < 15; i++) if ((i + j) % 2 === 0) m.flat(-146 + i * 20, -146 + j * 20, 3, 3, 0.2, '#7d95ba');
    m.box(-170, 0, -170, 340, 110, 20, '#3a3348', { s: '#c4d3ea' }); m.box(-170, 0, -150.5, 340, 24, 1, '#93a8c9');
    m.box(-170, 0, -150, 20, 110, 300, '#3a3348', { e: '#c4d3ea' }); m.box(150, 0, -150, 20, 110, 300, '#3a3348', { w: '#c4d3ea' });
    m.box(-120, 46, -151, 40, 44, 2, '#2f3138'); m.wallQuad(-116, 50, -148.8, 32, 36, '#e23b4e'); m.wallQuad(-108, 60, -148.7, 16, 16, '#ffd23f');
    m.box(60, 50, -151, 60, 34, 2, '#5b4636'); m.wallQuad(64, 54, -148.8, 52, 26, '#3fa0f0');
    m.box(-150, 0, -150, 300, 6, 300, '#7f93c0', { top: '#8ea5c8' });
    return m.upload();
  }
  const TILE = (i) => ({ x: ((i % 3) - 1) * 82, y: (Math.floor(i / 3) - 1) * 82 });
  class StompDuel extends Duel {
    constructor(who, done) {
      super(who, 'pollito', done, { title: 'OJO CON EL PISOTÓN', hint: 'Fíjate en las sombras · Párate en un cojín SIN sombra antes de que caiga Pollito' });
      stompMesh = stompMesh || buildStompArena(); this.p = new Actor(who, 0, 0); this.p.elev = 14; this.cam = { x: 0, y: 10, z: 26, dist: 540, pitch: 0.95, fov: 34 }; this.begin();
    }
    setup(n) { this.p.x = 0; this.p.y = 0; this.p.vx = this.p.vy = 0; this.p.spin = 0; this.slams = 0; this.ph = 'rest'; this.pt = 0.9; this.set = []; this.needS = 5; }
    tileOf(a) { return Math.max(0, Math.min(2, Math.round(a.x / 82) + 1)) + Math.max(0, Math.min(2, Math.round(a.y / 82) + 1)) * 3; }
    update(dt) {
      const p = this.p; p.update(dt);
      if (!this.tick(dt)) { p.walkFree(0, 0, 0, dt, { x0: -110, x1: 110, y0: -110, y1: 110 }); return; }
      const ax = G.input.axis(); p.walkFree(ax.x, ax.y, this.speed, dt, { x0: -110, x1: 110, y0: -104, y1: 112 });
      this.pt -= dt;
      if (this.ph === 'rest' && this.pt <= 0) { const k = Math.min(7, 4 + this.round + (this.slams > 2 ? 1 : 0)); this.set = shuffle([0, 1, 2, 3, 4, 5, 6, 7, 8]).slice(0, k); this.ph = 'warn'; this.warn = this.pt = Math.max(0.7, 1.2 - this.round * 0.15 - this.slams * 0.03 - (G.S.flags.pollitoOfendido ? 0.08 : 0)); G.sfx('msg'); }
      else if (this.ph === 'warn' && this.pt <= 0) {
        this.ph = 'slam'; this.pt = 0.45; G.sfx('door'); this.set.forEach((i) => { const tl = TILE(i); W.puff(tl.x, tl.y, 3); });
        if (this.set.includes(this.tileOf(p))) { p.spin = 0.7; p.flash = 0.7; p.emo('💥', 1); G.addNoise(5); this.endRound('b', '¡Pollito te cayó encima!'); return; }
        this.slams++; p.hop(120);
      } else if (this.ph === 'slam' && this.pt <= 0) { if (this.slams >= this.needS) { this.endRound('p', 'Esquivaste todos los pisotones'); return; } this.ph = 'rest'; this.pt = 0.45; }
    }
    draw(dt) {
      const pt = this.tileOf(this.p);
      W.render({
        cam: this.cam, dt, mesh: stompMesh, actors: [this.p],
        light: { amb: [0.5, 0.5, 0.62], sun: [0.3, 0.3, 0.36], sky: '#0f0d1a', points: [{ x: 0, y: 120, z: 0, r: 330, c: [0.5, 0.42, 0.3] }] },
        boxes: (mb) => { for (let i = 0; i < 9; i++) { const tl = TILE(i), hot = this.set.includes(i) && this.ph !== 'rest', dn = hot && this.ph === 'slam' ? 5 : 0; const col = [['#f08cc0', '#ffb3d9'], ['#ffd23f', '#ffe58a'], ['#7fd3ff', '#b5e6ff']][(i + Math.floor(i / 3)) % 3]; mb.box(tl.x - 34, 6, tl.y - 34, 68, 8 - dn, 68, col[0], { top: i === pt && this.st === 'play' ? '#ffffff' : col[1] }); mb.box(tl.x - 26, 14 - dn, tl.y - 26, 52, 1, 52, col[1]); } },
        sprites: () => {
          if (this.ph === 'rest') return;
          this.set.forEach((i) => {
            const tl = TILE(i);
            if (this.ph === 'warn') { const k = 1 - this.pt / this.warn; R.flat(R.shadowTex, tl.x, 15.5, tl.y, 14 + k * 26, { alpha: 0.5 + k * 0.5, tint: [0, 0, 0] }); R.sprite(Sp.cat('run1'), tl.x, 150 - k * k * 60, tl.y, { sx: 2.3, sy: 2.3, alpha: 0.35 + k * 0.4, feet: 5 }); }
            else R.sprite(Sp.cat('sit'), tl.x, 9, tl.y, { sx: 2.5, sy: 2.5 * (0.8 + 0.2 * (1 - this.pt / 0.45)), feet: 5 });
          });
        },
        over: (c, t) => this.hud(c, t, `${this.slams}/${this.needS} esquivados`, 'Pisotón'),
      });
    }
  }

  // =========================================================
  // 9. ATAQUE AL AMANECER — esquiva el dron de José en la azotea
  // =========================================================
  let roofMesh = null;
  function buildRoof() {
    const m = new R.MB();
    m.flat(-900, -1400, 1800, 1700, -60, '#3a2440');
    for (let i = 0; i < 9; i++) { const x = -640 + i * 150, h = 40 + ((i * 53) % 110); m.box(x, -60, -760 - (i % 3) * 40, 110, h + 60, 60, '#2a1c36', { s: '#33223f' }); for (let k = 0; k < 4; k++) for (let j = 0; j < Math.floor(h / 26); j++) if ((i + k + j) % 3 === 0) m.wallQuad(x + 12 + k * 24, 6 + j * 26, -699 - (i % 3) * 40, 12, 14, '#ffd88a', true); }
    for (let k = 0; k < 6; k++) m.wallQuad(-58 + k * 2, 60 + k * 9, -690, 116 - k * 4, 10, ['#ff7a3d', '#ff8f47', '#ffa552', '#ffbb62', '#ffcf78', '#ffe08f'][k], true);
    for (let k = 0; k < 5; k++) m.wallQuad(-900, 20 + k * 22, -900, 1800, 22, ['#f2845a', '#f0996a', '#eeae82', '#e8bfa0', '#c9a9c9'][k], true);
    for (let j = 0; j < 17; j++) for (let i = 0; i < 9; i++) m.flat(-162 + i * 36, -470 + j * 32, 35.4, 31.4, 0, (i + j) & 1 ? '#8b7f96' : '#7b6f88');
    m.box(-176, 0, -484, 14, 26, 568, '#5a4f66', { e: '#6d6079' }); m.box(162, 0, -484, 14, 26, 568, '#5a4f66', { w: '#6d6079' }); m.box(-176, 0, -484, 352, 26, 14, '#5a4f66', { s: '#6d6079' }); m.box(-176, 0, 70, 352, 12, 14, '#5a4f66');
    m.cyl(-110, 0, -420, 30, 54, '#4a6a8a', { top: '#5b7d9e' }); [[-128, -438], [-92, -438], [-128, -402], [-92, -402]].forEach(([x, z]) => m.box(x - 2, 0, z - 2, 4, 14, 4, '#3a3348'));
    m.box(90, 0, -440, 50, 30, 36, '#6d6079', { top: '#8b7f96' }); m.box(100, 30, -430, 12, 22, 12, '#4a4458');
    for (let i = 0; i < 7; i++) m.flat(-4, -440 + i * 66, 8, 34, 0.4, '#f4efe2');
    m.flat(-150, 6, 300, 30, 0.4, '#7dd37a');
    return m.upload();
  }
  class DroneDuel extends Duel {
    constructor(who, done) {
      super(who, 'jose', done, { title: 'ATAQUE AL AMANECER', hint: '← → para esquivar · El dron te sigue: cambia de lado a último momento' });
      roofMesh = roofMesh || buildRoof(); this.p = new Actor(who, 0, 20); this.p.dir = 'up'; this.jose = new Actor('jose', 115, -400); this.cam = { x: 0, y: 40, z: -150, dist: 540, pitch: 0.44, fov: 34 };
      this.diff = G.S.flags.jose === 'aliado' ? 0.9 : G.S.flags.jose === 'desconfia' ? 1.08 : 1; this.begin();
    }
    setup(n) { this.p.x = 0; this.p.vx = 0; this.p.spin = 0; this.pass = 0; this.needP = 4; this.launch(0.6); }
    launch(d) { this.dr = { x: rnd(-100, 100), z: -400, wait: d, lock: false }; this.jose.hop(110); }
    update(dt) {
      const p = this.p, d = this.dr; p.update(dt); this.jose.update(dt);
      if (!this.tick(dt)) { p.walkFree(0, 0, 0, dt, { x0: -140, x1: 140, y0: 20, y1: 20 }); return; }
      p.walkFree((G.input.held('right') ? 1 : 0) - (G.input.held('left') ? 1 : 0), 0, this.speed * 1.05, dt, { x0: -140, x1: 140, y0: 20, y1: 20 }); if (!p.moving) p.dir = 'up';
      if (d.wait > 0) { d.wait -= dt; return; }
      const vz = (250 + this.round * 38 + this.pass * 12) * this.diff; d.z += vz * dt;
      if (d.z > -80 - this.round * 6) d.lock = true;
      if (!d.lock) { const lead = [0, 0.3, 0.55][this.round] * ((20 - d.z) / vz), tx = Math.max(-140, Math.min(140, p.x + p.vx * lead)), ms = (92 + this.round * 22) * this.diff; d.x += Math.max(-ms * dt, Math.min(ms * dt, tx - d.x)); }
      if (d.z >= 20) {
        if (Math.abs(d.x - p.x) < 21) { p.spin = 0.8; p.flash = 0.8; p.emo('💥', 1); W.puff(p.x, p.y, 8, true); G.addNoise(5); this.endRound('b', '¡El dron te dio de lleno!'); return; }
        this.pass++; G.sfx('pick'); p.hop(130); this.say(`¡Esquivado! ${this.pass}/${this.needP}`, '#7dff8a', 0.8);
        if (this.pass >= this.needP) { this.jose.emo('💢', 1.2); this.endRound('p', 'El dron se quedó sin batería'); return; }
        this.launch(0.55);
      }
    }
    draw(dt) {
      const d = this.dr, on = this.st === 'play' && d.wait <= 0;
      W.render({
        cam: this.cam, dt, mesh: roofMesh, actors: [this.jose, this.p],
        light: { amb: [0.72, 0.56, 0.52], sun: [0.55, 0.36, 0.22], sky: '#c9a9c9', points: [{ x: 0, y: 80, z: -600, r: 700, c: [0.5, 0.25, 0.1] }] },
        sprites: (t) => { if (!on) return; R.flat(R.glowTex, d.x, 0.7, (d.z + 20) / 2 + 10, 11, { ry: Math.max(1, (20 - d.z) / 22), tint: d.lock ? [1, 0.25, 0.2] : [1, 0.8, 0.3], alpha: 0.5 }); R.shadow(d.x, d.z, 14, 0.9); R.sprite(Sp.item('dron'), d.x, 30 + Math.sin(t * 20) * 1.5, d.z, { sx: 1.5, sy: 1.5, roll: Math.sin(t * 9) * 0.1, lit: 0.6 }); },
        over: (c, t) => { this.hud(c, t, `${this.pass}/${this.needP} esquivados`, 'Dron'); if (on && d.lock) { const h = this.p.head(10); G.text(c, '¡AHORA!', h.x, h.y, { size: 10, color: '#ff6b7a' }); } },
      });
    }
  }

  // =========================================================
  // 10. SALTO DE REPISAS — carrera hacia arriba vs Pollito
  // =========================================================
  const STEPS = 14, SH = 27;
  class ClimbDuel extends Duel {
    constructor(who, done) {
      super(who, 'pollito', done, { title: 'SALTO DE REPISAS', hint: 'Presiona ← o → según el lado de la siguiente repisa · Si fallas, resbalas' });
      this.p = new Actor(who, -70, 12); this.cat = new Actor('pollito', 70, 12); this.cam = { x: 0, y: 50, z: 0, dist: 380, pitch: 0.3, fov: 34 }; this.begin();
    }
    setup(n) { this.seq = Array.from({ length: STEPS }, () => (Math.random() < 0.5 ? -1 : 1)); this.pi = 0; this.ci = 0; this.stun = 0; this.ct = 1; this.cstep = (0.56 - n * 0.055) * (G.S.flags.pollitoOfendido ? 0.93 : 1) + (10 - stat(this.who, 'velocidad')) * -0.004; this.place(this.p, -70, 0, true); this.place(this.cat, 70, 0, true); }
    pos(base, i) { return i === 0 ? { x: base, e: 0 } : { x: base + this.seq[i - 1] * 28, e: i * SH }; }
    place(a, base, i, snap) { const q = this.pos(base, i); a.tx = q.x; a.te = q.e; if (snap) { a.x = q.x; a.elev = q.e; } else a.hop(120); a.dir = i && this.seq[i - 1] < 0 ? 'left' : 'right'; }
    update(dt) {
      const p = this.p, cat = this.cat;
      [p, cat].forEach((a) => { a.update(dt); const k = Math.min(1, dt * 16); a.x += (a.tx - a.x) * k; a.elev += (a.te - a.elev) * k; });
      this.cam.y += (Math.max(50, p.elev + 40) - this.cam.y) * Math.min(1, dt * 5);
      if (!this.tick(dt)) return;
      if (this.stun > 0) this.stun -= dt;
      else { const k = G.input.hit('left') ? -1 : G.input.hit('right') ? 1 : 0; if (k) { if (k === this.seq[this.pi]) { this.pi++; this.place(p, -70, this.pi); G.sfx('pick'); } else { this.stun = 0.6; p.spin = 0.5; p.emo('💦', 0.7); G.sfx('bad'); G.addNoise(2); } } }
      if ((this.ct -= dt) <= 0) { this.ct = this.cstep + rnd(-0.1, 0.12) + (Math.random() < 0.1 ? 0.5 : 0); this.ci++; this.place(cat, 70, this.ci); }
      if (this.pi >= STEPS || this.ci >= STEPS) { const w = this.pi >= STEPS; (w ? p : cat).emo(w ? '🕯' : '😼', 1.5); this.endRound(w ? 'p' : 'b', w ? '¡Llegaste a las velas!' : 'Pollito llegó primero'); }
    }
    draw(dt) {
      W.render({
        cam: this.cam, dt, mesh: null, actors: [this.p, this.cat], noApartment: true,
        light: { amb: [0.56, 0.52, 0.6], sun: [0.34, 0.3, 0.3], sky: '#15121f', points: [{ x: 0, y: this.cam.y + 30, z: 80, r: 320, c: [0.45, 0.36, 0.22] }] },
        boxes: (mb) => {
          mb.flat(-400, -200, 800, 500, 0, '#c99b66'); mb.box(-260, 0, -40, 520, STEPS * SH + 140, 20, '#3a3348', { s: '#ecd8b4' }); mb.box(-260, 0, -20.5, 520, 24, 1, '#c9ae82');
          [-70, 70].forEach((bx, t) => {
            mb.box(bx - 52, 0, -20, 4, STEPS * SH + 40, 20, '#74502f'); mb.box(bx + 48, 0, -20, 4, STEPS * SH + 40, 20, '#74502f'); mb.box(bx - 52, 0, -20, 104, STEPS * SH + 40, 2, '#5a3f28');
            const idx = t ? this.ci : this.pi;
            for (let i = 1; i <= STEPS; i++) { const sx = bx + this.seq[i - 1] * 28, next = i === idx + 1 && this.st === 'play'; mb.box(sx - 22, i * SH - 4, -18, 44, 4, 26, i === STEPS ? '#ffd23f' : next ? (t ? '#ffb0b8' : '#b5f5bd') : '#b98a55', { top: i === STEPS ? '#ffe58a' : next ? (t ? '#ffd0d6' : '#d9ffe0') : '#c99a66', emit: next && !t }); if (i % 3 === 0 && i < STEPS) mb.box(sx + this.seq[i - 1] * -8 - 5, i * SH, -14, 10, 12, 6, ['#e23b4e', '#3fa0f0', '#58c46a'][i % 3]); }
          });
        },
        sprites: (t) => { R.sprite(Sp.item('velas'), -70 + this.seq[STEPS - 1] * 28, STEPS * SH + 2 + Math.sin(t * 4) * 2, -6, { feet: 5, lit: 0.3 }); },
        over: (c, t) => {
          this.hud(c, t, `${this.pi}/${STEPS}`, `${this.ci}/${STEPS}`);
          if (this.st !== 'play') return;
          const h = this.p.head(22), dir = this.seq[this.pi];
          if (this.stun > 0) G.text(c, '¡Resbalaste!', h.x, h.y, { size: 10, color: '#ff6b7a' }); else G.prompt(c, dir < 0 ? '←' : '→', h.x + dir * 30, h.y);
        },
      });
    }
  }

  G.Scenes = { CollectScene, HomeScene, DecoDuel, ChaseDuel, MessageDuel, PizzaRace, SleepwalkDuel, MemoryDuel, SpikeDuel, StompDuel, DroneDuel, ClimbDuel };
})();
