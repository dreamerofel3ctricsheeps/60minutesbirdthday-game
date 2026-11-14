/* ============================================================
   MUNDO 3D: departamento (5 ambientes), colisiones, actores
   animados y dibujo.  La lógica sigue siendo 2D (x, z); el
   render es 3D con billboards.
   ============================================================ */
(function () {
  'use strict';
  const G = (window.G = window.G || {});
  const Sp = G.Sprites, R = G.R;

  // ---------- Entrada ----------
  const keys = {}, pressed = {};
  const MAP = { ArrowUp: 'up', KeyW: 'up', ArrowDown: 'down', KeyS: 'down', ArrowLeft: 'left', KeyA: 'left', ArrowRight: 'right', KeyD: 'right', Space: 'action', KeyE: 'action', Enter: 'action' };
  window.addEventListener('keydown', (e) => {
    const k = MAP[e.code];
    if (!k) return;
    if (e.target && /INPUT|TEXTAREA/.test(e.target.tagName)) return;
    if (G.captureKeys) e.preventDefault();
    if (!keys[k]) pressed[k] = true;
    keys[k] = true;
  });
  window.addEventListener('keyup', (e) => { const k = MAP[e.code]; if (k) keys[k] = false; });
  window.addEventListener('blur', () => { for (const k in keys) keys[k] = false; });
  G.input = {
    axis() {
      let x = (keys.right ? 1 : 0) - (keys.left ? 1 : 0), y = (keys.down ? 1 : 0) - (keys.up ? 1 : 0);
      if (x && y) { x *= 0.7071; y *= 0.7071; }
      return { x, y };
    },
    held: (k) => !!keys[k],
    hit(k) { const v = !!pressed[k]; pressed[k] = false; return v; },
    flush() { for (const k in pressed) pressed[k] = false; },
  };

  // ---------- Geometría lógica (x, y≡z) ----------
  const FLOORS = {
    cocina: { x: 40, y: 40, w: 290, h: 250 },
    sala: { x: 350, y: 40, w: 610, h: 250 },
    cuarto: { x: 40, y: 310, w: 290, h: 270 },
    pasillo: { x: 350, y: 310, w: 300, h: 270 },
    xroom: { x: 670, y: 310, w: 290, h: 270 },
  };
  const OPEN = [
    { x: 324, y: 150, w: 32, h: 70 },   // cocina ↔ sala
    { x: 470, y: 284, w: 80, h: 32 },   // sala ↔ pasillo
    { x: 150, y: 284, w: 70, h: 32 },   // cocina ↔ cuarto
    { x: 324, y: 420, w: 32, h: 70 },   // cuarto ↔ pasillo
    { x: 644, y: 420, w: 32, h: 70, door: true }, // pasillo ↔ cuarto de Ximena
  ];
  const DOORS = { 'cocina-sala': [340, 185], 'sala-pasillo': [510, 300], 'cocina-cuarto': [185, 300], 'cuarto-pasillo': [340, 455], 'pasillo-xroom': [660, 455] };
  const ADJ = { cocina: ['sala', 'cuarto'], sala: ['cocina', 'pasillo'], cuarto: ['cocina', 'pasillo'], pasillo: ['sala', 'cuarto', 'xroom'], xroom: ['pasillo'] };

  // Huellas sólidas de los muebles
  const FURN = [
    { id: 'counter', x: 40, y: 40, w: 212, h: 34 }, { id: 'fridge', x: 262, y: 40, w: 56, h: 38 },
    { id: 'island', x: 112, y: 134, w: 126, h: 76 }, { id: 'trash', x: 46, y: 250, w: 26, h: 24 },
    { id: 'bookshelf', x: 366, y: 40, w: 84, h: 26 }, { id: 'tv', x: 560, y: 40, w: 140, h: 28 },
    { id: 'ctable', x: 595, y: 108, w: 80, h: 32 }, { id: 'sofa', x: 570, y: 170, w: 130, h: 44 },
    { id: 'armchair', x: 730, y: 120, w: 50, h: 46 }, { id: 'ptable', x: 800, y: 200, w: 130, h: 45 },
    { id: 'plant', x: 916, y: 46, w: 34, h: 34 }, { id: 'lamp', x: 788, y: 58, w: 20, h: 20 },
    { id: 'bunk', x: 44, y: 316, w: 68, h: 136 }, { id: 'desk', x: 236, y: 312, w: 90, h: 38 }, { id: 'chair', x: 266, y: 352, w: 28, h: 26 },
    { id: 'boxes', x: 262, y: 516, w: 60, h: 58 }, { id: 'basket', x: 50, y: 530, w: 36, h: 36 }, { id: 'beanbag', x: 152, y: 500, w: 48, h: 44 },
    { id: 'closet', x: 560, y: 310, w: 80, h: 30 }, { id: 'shoes', x: 366, y: 310, w: 74, h: 20 }, { id: 'sidetable', x: 354, y: 528, w: 32, h: 44 },
    { id: 'xbed', x: 856, y: 326, w: 98, h: 146 }, { id: 'xnight', x: 826, y: 334, w: 26, h: 26 }, { id: 'xdesk', x: 690, y: 312, w: 100, h: 36 },
    { id: 'xchair', x: 724, y: 352, w: 30, h: 26 }, { id: 'xplant', x: 680, y: 544, w: 30, h: 30 },
  ];
  const furn = (id) => FURN.find((f) => f.id === id);
  const SPAWNS = [[70, 120], [285, 125], [75, 225], [275, 255], [400, 110], [760, 95], [900, 135], [420, 255], [740, 262], [190, 400], [240, 480], [130, 565]];
  const STASH = { x: 600, y: 358 };
  const DECO_SPOTS = [
    { kind: 'guirnalda', x: 505, y: 62, wx: 462 }, { kind: 'guirnalda', x: 735, y: 84, wx: 704 },
    { kind: 'globos', x: 395, y: 170, bx: 378, by: 150 }, { kind: 'globos', x: 905, y: 175, bx: 935, by: 160 },
    { kind: 'luces', x: 470, y: 250 }, { kind: 'luces', x: 760, y: 265 },
  ];
  const WALL_H = 96, WALL_LOW = 10;

  const World = {
    FLOORS, OPEN, FURN, SPAWNS, STASH, DECO_SPOTS, furn, WALL_H,
    xDoorOpen: false, doorK: 0, midK: 1, fx: [],

    roomAt(x, y) {
      for (const k in FLOORS) { const r = FLOORS[k]; if (x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h) return k; }
      return null;
    },
    pointFree(x, y) {
      for (const k in FLOORS) { const r = FLOORS[k]; if (x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h) return true; }
      for (const o of OPEN) { if (o.door && !World.xDoorOpen) continue; if (x >= o.x && x <= o.x + o.w && y >= o.y && y <= o.y + o.h) return true; }
      return false;
    },
    canStand(x, y, room) {
      const hw = 8, hh = 6;
      const pts = [[x - hw, y - hh], [x + hw, y - hh], [x - hw, y + 2], [x + hw, y + 2]];
      for (const p of pts) if (!World.pointFree(p[0], p[1])) return false;
      if (room) { const r = FLOORS[room]; if (x - hw < r.x || x + hw > r.x + r.w || y - hh < r.y || y + 2 > r.y + r.h) return false; }
      for (const f of FURN) if (x + hw > f.x && x - hw < f.x + f.w && y + 2 > f.y && y - hh < f.y + f.h) return false;
      return true;
    },
    path(ax, ay, bx, by) {
      const ra = World.roomAt(ax, ay) || 'pasillo', rb = World.roomAt(bx, by) || 'pasillo';
      const prev = { [ra]: null }, q = [ra];
      while (q.length) { const r = q.shift(); if (r === rb) break; for (const n of ADJ[r]) if (!(n in prev)) { prev[n] = r; q.push(n); } }
      const rooms = []; for (let r = rb; r; r = prev[r]) rooms.unshift(r);
      const pts = [];
      for (let i = 0; i < rooms.length - 1; i++) { const d = DOORS[rooms[i] + '-' + rooms[i + 1]] || DOORS[rooms[i + 1] + '-' + rooms[i]]; pts.push([d[0], d[1]]); }
      pts.push([bx, by]);
      return pts;
    },
    randomFreePoint(room) {
      const r = FLOORS[room];
      for (let i = 0; i < 60; i++) { const x = r.x + 16 + Math.random() * (r.w - 32), y = r.y + 18 + Math.random() * (r.h - 30); if (World.canStand(x, y)) return [x, y]; }
      return [r.x + r.w / 2, r.y + r.h / 2];
    },
  };
  G.World = World;

  // ---------- Partículas ----------
  const puffC = document.createElement('canvas'); puffC.width = puffC.height = 16;
  (function () { const c = puffC.getContext('2d'); c.fillStyle = '#fff'; [[4, 6, 4], [9, 5, 5], [8, 10, 4], [3, 10, 3]].forEach(([x, y, r]) => { c.beginPath(); c.arc(x + 1, y, r, 0, 6.3); c.fill(); }); })();
  const starC = document.createElement('canvas'); starC.width = starC.height = 16;
  (function () { const c = starC.getContext('2d'); c.fillStyle = '#ffd23f'; c.fillRect(6, 1, 4, 14); c.fillRect(1, 6, 14, 4); c.fillRect(4, 4, 8, 8); c.fillStyle = '#fff'; c.fillRect(7, 6, 2, 4); })();
  World.puff = (x, z, n, star) => { for (let i = 0; i < (n || 1); i++) World.fx.push({ c: star ? starC : puffC, x: x + (Math.random() - 0.5) * 10, y: star ? 30 : 2, z: z + 1, vx: (Math.random() - 0.5) * (star ? 120 : 30), vy: star ? 60 + Math.random() * 80 : 14 + Math.random() * 12, t: 0, d: star ? 0.7 : 0.45, s: star ? 1 : 0.9 }); };
  World.updateFx = (dt) => { for (let i = World.fx.length - 1; i >= 0; i--) { const p = World.fx[i]; p.t += dt; p.x += p.vx * dt; p.y += p.vy * dt; if (p.c === starC) p.vy -= 260 * dt; if (p.t >= p.d) World.fx.splice(i, 1); } };

  // ---------- Actores ----------
  class Actor {
    constructor(id, x, y) {
      this.id = id; this.x = x; this.y = y; this.dir = 'down'; this.moving = false; this.t = Math.random() * 3;
      this.expr = null; this.frameOverride = null; this.bubble = null; this.route = null; this.speed = 90; this.hidden = false;
      this.vx = 0; this.vy = 0; this.step = 0; this.jy = 0; this.jv = 0; this.squash = 0; this.blink = 2 + Math.random() * 3; this.emote = null; this.spin = 0; this.flash = 0; this.scale = 1; this.lastStep = 0;
    }
    get spd() { return Math.hypot(this.vx, this.vy); }
    // jugador: aceleración suave + colisiones.  room: restringe a un ambiente
    walk(dx, dy, speed, dt, room) {
      const k = Math.min(1, dt * 13);
      this.vx += (dx * speed - this.vx) * k; this.vy += (dy * speed - this.vy) * k;
      if (dx || dy) { if (Math.abs(dx) > Math.abs(dy)) this.dir = dx > 0 ? 'right' : 'left'; else this.dir = dy > 0 ? 'down' : 'up'; }
      const nx = this.x + this.vx * dt, ny = this.y + this.vy * dt;
      if (World.canStand(nx, this.y, room)) this.x = nx; else this.vx = 0;
      if (World.canStand(this.x, ny, room)) this.y = ny; else this.vy = 0;
      this.moving = this.spd > 12;
    }
    goTo(x, y, speed, direct) { this.route = direct ? [[x, y]] : World.path(this.x, this.y, x, y); if (speed) this.speed = speed; }
    get arrived() { return !this.route || !this.route.length; }
    follow(dt) {
      if (this.arrived) { this.moving = false; this.vx = this.vy = 0; return; }
      const [tx, ty] = this.route[0];
      const dx = tx - this.x, dy = ty - this.y, d = Math.hypot(dx, dy), st = this.speed * dt;
      if (d <= st) { this.x = tx; this.y = ty; this.route.shift(); if (!this.route.length) { this.moving = false; this.vx = this.vy = 0; } return; }
      this.vx = (dx / d) * this.speed; this.vy = (dy / d) * this.speed;
      this.x += this.vx * dt; this.y += this.vy * dt; this.moving = true;
      if (Math.abs(dx) > Math.abs(dy)) this.dir = dx > 0 ? 'right' : 'left'; else this.dir = dy > 0 ? 'down' : 'up';
    }
    say(text, secs) { this.bubble = { text, t: secs || 2.5 }; }
    emo(text, secs) { this.emote = { text, t: secs || 1.2, d: secs || 1.2 }; }
    hop(v) { if (this.jy <= 0.01) this.jv = v || 150; }
    update(dt) {
      this.t += dt;
      if (this.bubble && (this.bubble.t -= dt) <= 0) this.bubble = null;
      if (this.emote && (this.emote.t -= dt) <= 0) this.emote = null;
      if (this.moving) {
        this.step += this.spd * dt * 0.1;
        const s = Math.floor(this.step / Math.PI);
        if (s !== this.lastStep) { this.lastStep = s; if (this.spd > 95 && this.jy <= 0) World.puff(this.x, this.y, 1); }
      } else this.step = 0;
      if (this.jv || this.jy > 0) { this.jy += this.jv * dt; this.jv -= 620 * dt; if (this.jy <= 0) { this.jy = 0; this.jv = 0; this.squash = 0.16; World.puff(this.x, this.y, 2); } }
      if (this.squash > 0) this.squash = Math.max(0, this.squash - dt);
      if (this.flash > 0) this.flash = Math.max(0, this.flash - dt);
      if (this.spin > 0) this.spin = Math.max(0, this.spin - dt);
      if ((this.blink -= dt) < -0.12) this.blink = 1.5 + Math.random() * 3.5;
    }
    draw3d() {
      if (this.hidden) return;
      const air = Math.min(1, this.jy / 50), sc = this.scale;
      R.shadow(this.x, this.y, (this.id === 'pollito' ? 13 : 15) * sc * (1 - air * 0.4), 0.85 - air * 0.4);
      const walkBob = this.moving ? Math.abs(Math.sin(this.step)) * 3.2 : 0;
      let roll = this.moving ? Math.sin(this.step) * 0.075 : 0;
      const sq = this.squash / 0.16, breathe = this.moving ? 0 : Math.sin(this.t * 2.6) * 0.012;
      let sy = (1 - sq * 0.16 + breathe + (this.jy > 4 ? 0.06 : 0)) * sc, sx = (1 + sq * 0.14 - breathe) * sc;
      const fl = this.flash > 0 && Math.floor(this.flash * 20) % 2 ? [0.9, 0.9, 0.9] : null;
      if (this.id === 'pollito') {
        const fast = this.spd > 130;
        const pose = this.jy > 2 ? 'run1' : this.moving ? (fast ? 'run' : 'walk') + (Math.floor(this.step * (fast ? 0.9 : 1.3)) % 2) : 'sit';
        if (this.spin > 0) roll = this.spin * 14;
        R.sprite(Sp.cat(pose, this.dir === 'left'), this.x, this.jy + (this.moving ? walkBob * 0.5 : 0), this.y, { feet: 5, roll, sx: sx * 1.15, sy: sy * 1.15, flash: fl });
        if (this.carry && this.carry.length) R.sprite(Sp.item(this.carry[0]), this.x + (this.dir === 'left' ? -14 : 14), this.jy + 16, this.y + 0.6, { feet: 4, sx: 0.8, sy: 0.8 });
        return;
      }
      let frame = this.frameOverride != null ? this.frameOverride : this.moving ? [1, 0, 2, 0][Math.floor(this.step / (Math.PI / 2)) % 4] : 0;
      if (this.jy > 6 && this.frameOverride == null) frame = 3;
      let expr = this.expr;
      if (!expr && this.blink < 0 && !LOOKS_NOBLINK[this.id]) expr = 'sleep';
      let dir = this.dir;
      if (this.spin > 0) { dir = ['down', 'left', 'up', 'right'][Math.floor(this.spin * 14) % 4]; roll = 0; }
      R.sprite(Sp.char(this.id, dir, frame, expr), this.x, this.jy + walkBob, this.y, { feet: 4, roll, sx, sy, flash: fl });
      if (this.carry && this.carry.length) {
        const top = 58 * R.stretch * sy + this.jy + walkBob, tilt = this.carryTilt || 0;
        this.carry.forEach((it, i) => R.sprite(Sp.item(it), this.x + (i ? 12 : this.carry.length > 1 ? -12 : 0) + tilt * 14, top + Math.sin(this.t * 9 + i) * (this.moving ? 1.5 : 0), this.y + 0.5, { feet: 6, roll: tilt * 0.5 + (this.moving ? Math.sin(this.step + i) * 0.06 : 0) }));
      }
    }
    // punto sobre la cabeza en coordenadas de la capa 2D
    head(extra) { return R.project(this.x, (this.id === 'pollito' ? 34 : 62) * R.stretch * this.scale + this.jy + (extra || 0), this.y); }
  }
  const LOOKS_NOBLINK = { jose: true };
  G.Actor = Actor;

  // ---------- Malla estática del departamento ----------
  function buildStatic() {
    const m = new R.MB();
    const B = (x, y, z, w, h, d, c, o) => m.box(x, y, z, w, h, d, c, o);
    const legs = (x, z, w, d, h, c, t) => { t = t || 4; [[x, z], [x + w - t, z], [x, z + d - t], [x + w - t, z + d - t]].forEach(([a, b]) => B(a, 0, b, t, h, t, c)); };
    // exterior
    m.flat(-400, -300, 1800, 1300, -2, '#17131f');
    m.flat(430, 600, 160, 110, -0.5, '#3b3547'); for (let i = 0; i < 4; i++) m.flat(430 + i * 40, 600, 20, 110, -0.4, '#443d52');

    // ===== COCINA =====
    let r = FLOORS.cocina;
    for (let j = 0; j < 10; j++) for (let i = 0; i < 12; i++) m.flat(r.x + i * 25, r.y + j * 25, Math.min(25, r.w - i * 25), 25, 0, (i + j) & 1 ? '#eef2f3' : '#cdd9de');
    m.flat(30, 284, 300, 32, 0, '#cdd9de'); // umbrales
    m.flat(95, 222, 160, 44, 0.4, '#e59a4f'); m.flat(101, 228, 148, 32, 0.5, '#f2c27d'); for (let i = 0; i < 6; i++) m.flat(108 + i * 24, 228, 8, 32, 0.6, '#e59a4f');
    B(40, 0, 40, 212, 36, 32, '#8a6a4f'); B(38, 36, 40, 216, 4, 35, '#efe9dc', { top: '#f6f1e6' });
    for (let i = 0; i < 5; i++) { if (i === 3) continue; B(45 + i * 42, 5, 72, 36, 27, 0.8, '#a07c5c'); B(60 + i * 42, 26, 72.8, 6, 2, 0.8, '#d9c7a8'); }
    m.wallQuad(40, 40, 40.5, 212, 22, '#e6f1ee'); for (let i = 0; i < 14; i++) m.wallQuad(40 + i * 15.2, 40, 40.7, 0.8, 22, '#c2d6d0');
    m.flat(62, 45, 46, 22, 40.3, '#9fb0bb'); m.flat(66, 48, 38, 16, 40.4, '#7d8f9b'); B(82, 40, 42, 5, 12, 3, '#c9d3da'); B(82, 50, 42, 5, 3, 10, '#c9d3da');
    B(171, 4, 72, 44, 28, 0.9, '#2f3138'); B(176, 12, 73, 34, 14, 0.5, '#4a4f5e'); m.flat(168, 43, 50, 28, 40.3, '#2a2c33');
    [[180, 50], [206, 50], [180, 64], [206, 64]].forEach(([x, z]) => m.cyl(x, 40.3, z, 6, 0.8, '#5d6170'));
    m.cyl(120, 40, 56, 8, 9, '#e23b4e', { top: '#b52a3a' }); B(134, 40, 48, 4, 14, 4, '#3f8f4f'); B(141, 40, 50, 4, 10, 4, '#ffd23f');
    B(40, 64, 40, 122, 26, 15, '#a88262'); for (let i = 0; i < 3; i++) B(43 + i * 40, 66, 55, 36, 22, 0.8, '#b8926f');
    B(166, 68, 40, 54, 12, 22, '#c9d3da'); B(178, 80, 40, 30, 16, 10, '#b3bec6');
    B(262, 0, 40, 56, 100, 38, '#dfe6ea', { top: '#eef3f6' }); B(262, 60, 78, 56, 1.5, 0.6, '#a9b6bd'); B(268, 66, 78, 3, 22, 1.6, '#8b98a1'); B(268, 22, 78, 3, 30, 1.6, '#8b98a1');
    [['#ffd23f', 290, 80], ['#e23b4e', 300, 74], ['#3fa0f0', 284, 70], ['#58c46a', 304, 86]].forEach(([c, x, y]) => m.wallQuad(x, y, 78.7, 6, 5, c));
    B(224, 70, 40, 18, 18, 2, '#f4f4f8'); m.wallQuad(232, 78, 42.2, 1.5, 8, '#2f3138'); m.wallQuad(232, 78, 42.2, 6, 1.5, '#2f3138');
    B(120, 30, 140, 110, 4, 52, '#c9925a', { top: '#d8a36a' }); legs(124, 144, 102, 44, 30, '#8f6238');
    m.cyl(140, 0, 201, 9, 20, '#e23b4e', { top: '#f25a6b' }); m.cyl(210, 0, 201, 9, 20, '#3fa0f0', { top: '#6fbcff' });
    m.cyl(175, 34, 164, 9, 5, '#f4f4f8', { r2: 13 }); B(170, 38, 160, 6, 5, 6, '#e23b4e'); B(177, 38, 163, 6, 5, 6, '#ffb23f'); B(172, 38, 167, 6, 4, 5, '#58c46a');
    m.cyl(59, 0, 262, 11, 26, '#6f7b85', { top: '#56616a' });

    // ===== SALA =====
    r = FLOORS.sala;
    const woods = ['#c99b66', '#c2925c', '#d0a470'];
    for (let j = 0; j < 18; j++) { let x = r.x - ((j * 37) % 60); let i = 0; while (x < r.x + r.w) { const w = 70 + ((j * 13 + i * 29) % 50), x0 = Math.max(x, r.x), x1 = Math.min(x + w, r.x + r.w); if (x1 > x0) m.flat(x0, r.y + j * 14, x1 - x0 - 0.6, 13.4, 0, woods[(i + j * 2) % 3]); x += w; i++; } }
    m.flat(350, 40, 610, 252, -0.1, '#a67c4c'); m.flat(324, 150, 32, 70, 0, '#b88a56');
    m.flat(540, 92, 190, 140, 0.4, '#a8463f'); m.flat(548, 100, 174, 124, 0.5, '#c9625a'); m.flat(560, 112, 150, 100, 0.6, '#b5524b'); m.flat(566, 118, 138, 88, 0.7, '#d27a6c');
    // librero
    B(366, 0, 40, 84, 88, 24, '#8a5f3c', { top: '#9c6f48' });
    const bk = ['#e23b4e', '#3fa0f0', '#ffd23f', '#58c46a', '#b48cf0', '#f08cc0', '#f4f4f8', '#ff9a3f'];
    [8, 34, 60].forEach((y, row) => { m.wallQuad(370, y, 64.2, 76, 22, '#4a321d'); let x = 372; let i = 0; while (x < 440) { const w = 4 + ((i * 7 + row * 3) % 4), h = 13 + ((i * 5 + row * 7) % 8); if ((i + row) % 7 !== 6) B(x, y, 58, w, h, 7, bk[(i * 3 + row * 2) % 8]); x += w + 1; i++; } });
    m.cyl(380, 88, 52, 6, 8, '#b5653a'); m.cyl(380, 96, 52, 8, 8, '#3f8f4f', { r2: 3 });
    // TV
    B(560, 0, 40, 140, 26, 26, '#5b4636', { top: '#6d5645' }); for (let i = 0; i < 3; i++) { B(566 + i * 44, 4, 66, 40, 18, 0.8, '#70594a'); B(582 + i * 44, 12, 66.8, 8, 2, 0.6, '#c9b08a'); }
    B(580, 30, 48, 100, 58, 5, '#17181d'); B(620, 26, 46, 20, 4, 9, '#17181d'); B(566, 26, 50, 12, 16, 10, '#2a2c36'); B(684, 26, 52, 12, 6, 10, '#e9eefb');
    // ventana y cuadros (pared norte)
    B(772, 34, 39, 104, 54, 2.5, '#5b4636'); B(823, 36, 40.5, 2, 50, 1.4, '#5b4636'); B(774, 60, 40.5, 100, 2, 1.4, '#5b4636');
    B(762, 28, 39, 12, 64, 5, '#c95a5a'); B(874, 28, 39, 12, 64, 5, '#c95a5a'); B(758, 90, 39, 132, 3, 6, '#3a2c22');
    B(476, 50, 39.5, 40, 30, 2, '#5b4636'); m.wallQuad(479, 53, 41.7, 34, 24, '#7fd3ff'); m.wallQuad(479, 53, 41.8, 34, 9, '#58b56a'); m.wallQuad(500, 66, 41.8, 7, 7, '#ffd23f');
    B(716, 54, 39.5, 26, 32, 2, '#3a2c22'); m.wallQuad(719, 57, 41.7, 20, 26, '#f4efe2'); m.wallQuad(724, 62, 41.8, 10, 14, '#f08cc0');
    // sofá (da la espalda a la cámara), mesa de centro, sillón
    B(570, 0, 170, 130, 20, 44, '#3d7a74'); B(570, 20, 203, 130, 24, 11, '#2f615c', { top: '#3d7a74' }); B(570, 20, 170, 12, 13, 33, '#356b66'); B(688, 20, 170, 12, 13, 33, '#356b66');
    B(584, 20, 174, 50, 6, 28, '#4b9189'); B(636, 20, 174, 50, 6, 28, '#4b9189'); B(590, 26, 192, 18, 13, 7, '#ffd23f'); B(662, 26, 192, 18, 13, 7, '#f08cc0');
    B(595, 13, 108, 80, 3, 32, '#d8b483', { top: '#e4c497' }); legs(598, 111, 74, 26, 13, '#a57f52', 3); B(604, 16, 114, 16, 2, 11, '#3fa0f0'); m.cyl(655, 16, 124, 5, 6, '#f4f4f8');
    B(730, 0, 120, 50, 18, 46, '#c9625a'); B(730, 18, 154, 50, 26, 12, '#a8463f', { top: '#c9625a' }); B(730, 18, 120, 9, 10, 34, '#b5524b'); B(771, 18, 120, 9, 10, 34, '#b5524b'); B(741, 18, 124, 28, 5, 28, '#d97a70');
    // mesa de fiesta
    B(800, 30, 200, 130, 4, 45, '#fdfdf5'); B(800, 12, 200, 130, 18, 45, '#f1ead8', { s: '#f6efdf' }); legs(804, 204, 122, 37, 12, '#8f6238');
    // planta y lámpara
    m.cyl(933, 0, 63, 13, 20, '#b5653a', { r2: 16, top: '#5a3b24' }); m.cyl(933, 20, 63, 4, 26, '#2f7a45'); m.cyl(933, 40, 63, 24, 14, '#3f8f4f', { r2: 15 }); m.cyl(933, 54, 63, 17, 13, '#58b56a', { r2: 6 }); m.cyl(921, 34, 70, 10, 9, '#58b56a', { r2: 3 });
    m.cyl(798, 0, 68, 9, 2, '#5b4636'); m.cyl(798, 2, 68, 2, 66, '#5b4636'); m.cyl(798, 64, 68, 15, 18, '#ffe9a8', { r2: 8, emit: true });

    // ===== CUARTO DE LOS ROOMIES =====
    r = FLOORS.cuarto; m.flat(r.x, r.y - 26, r.w, r.h + 26, 0, '#8ea5c8');
    for (let j = 0; j < 14; j++) for (let i = 0; i < 15; i++) if ((i + j) % 2 === 0) m.flat(r.x + 6 + i * 20, r.y + 6 + j * 20, 3, 3, 0.2, '#7d95ba');
    m.flat(128, 380, 150, 100, 0.4, '#f2c230'); m.flat(136, 388, 134, 84, 0.5, '#ffe07a'); m.flat(150, 402, 106, 56, 0.6, '#f2c230');
    [[44, 316], [107, 316], [44, 447], [107, 447]].forEach(([x, z]) => B(x, 0, z, 5, 88, 5, '#6d4a2a'));
    B(46, 12, 318, 62, 4, 130, '#6d4a2a'); B(47, 16, 320, 60, 9, 126, '#e8643c', { top: '#f27a52' }); B(51, 25, 324, 52, 5, 22, '#fdfdf5');
    B(46, 54, 318, 62, 4, 130, '#6d4a2a'); B(47, 58, 320, 60, 9, 126, '#3fa0f0', { top: '#62b5f7' }); B(51, 67, 324, 52, 5, 22, '#fdfdf5'); B(44, 68, 318, 3, 10, 130, '#6d4a2a');
    B(110, 0, 420, 3, 60, 3, '#6d4a2a'); B(110, 0, 440, 3, 60, 3, '#6d4a2a'); [14, 30, 46].forEach((y) => B(110, y, 420, 3, 3, 23, '#6d4a2a'));
    B(236, 32, 312, 90, 4, 38, '#b98a55', { top: '#c99a66' }); B(236, 0, 312, 4, 32, 38, '#8f6238'); B(322, 0, 312, 4, 32, 38, '#8f6238'); B(296, 8, 314, 26, 24, 34, '#a57a48');
    B(256, 36, 316, 44, 30, 3, '#17181d'); m.wallQuad(259, 39, 319.3, 38, 24, '#6fd3ff', true); B(274, 36, 318, 8, 3, 8, '#17181d'); B(250, 36, 334, 34, 1.5, 10, '#2f3138'); m.cyl(310, 36, 328, 4, 7, '#ffd23f');
    B(268, 0, 356, 24, 3, 20, '#2f3138'); B(277, 3, 364, 6, 14, 6, '#2f3138'); B(268, 17, 356, 24, 4, 20, '#e23b4e'); B(268, 21, 373, 24, 20, 3, '#e23b4e');
    B(262, 0, 516, 34, 30, 34, '#d3a770', { top: '#e0b983' }); B(276, 0, 515.5, 6, 30, 35, '#e8d9b8'); B(296, 0, 532, 26, 22, 30, '#c79a63', { top: '#d6ab76' }); B(268, 30, 522, 24, 18, 24, '#dcb37c', { top: '#e8c592' }); m.wallQuad(271, 36, 546.3, 18, 6, '#e23b4e');
    m.cyl(68, 0, 548, 15, 26, '#e8dcc0', { r2: 18, top: '#3fa0f0' }); B(60, 26, 542, 14, 5, 12, '#f08cc0'); B(70, 26, 548, 10, 7, 9, '#ffd23f');
    m.cyl(176, 0, 522, 24, 14, '#b48cf0', { r2: 19 }); m.cyl(176, 14, 522, 19, 9, '#c9a9f7', { r2: 9 });
    B(206, 0, 548, 30, 3, 9, '#58c46a'); m.cyl(210, 0, 552.5, 2.5, 2.5, '#2f3138'); m.cyl(232, 0, 552.5, 2.5, 2.5, '#2f3138');

    // ===== PASILLO =====
    r = FLOORS.pasillo;
    const woods2 = ['#d9b98b', '#d2b07f', '#e0c298'];
    for (let j = 0; j < 20; j++) { let x = r.x - ((j * 41) % 60), i = 0; while (x < r.x + r.w) { const w = 70 + ((j * 17 + i * 23) % 50), x0 = Math.max(x, r.x), x1 = Math.min(x + w, r.x + r.w); if (x1 > x0) m.flat(x0, r.y + j * 14 - 4, x1 - x0 - 0.6, 13.4, 0, woods2[(i + j * 2) % 3]); x += w; i++; } }
    m.flat(324, 284, 360, 300, -0.1, '#b8996c'); m.flat(470, 284, 80, 32, 0, '#d2b07f'); m.flat(470, 578, 80, 24, 0, '#d2b07f');
    m.flat(482, 336, 56, 196, 0.4, '#5f73b8'); m.flat(487, 341, 46, 186, 0.5, '#7f93d8'); for (let i = 0; i < 9; i++) m.flat(495, 350 + i * 20, 30, 6, 0.6, '#aebcf0');
    m.flat(478, 546, 64, 26, 0.5, '#8d7a5c'); m.flat(483, 550, 54, 18, 0.6, '#a8946f');
    B(560, 0, 310, 80, 98, 30, '#94694a', { top: '#a67957' }); B(564, 4, 340, 34, 88, 0.9, '#a97c58'); B(602, 4, 340, 34, 88, 0.9, '#a97c58'); B(594, 44, 341, 3, 9, 1.5, '#f2c230'); B(603, 44, 341, 3, 9, 1.5, '#f2c230');
    B(366, 0, 310, 74, 3, 20, '#b98a55'); B(366, 12, 310, 74, 3, 20, '#b98a55'); B(366, 24, 310, 74, 3, 20, '#b98a55', { top: '#c99a66' }); B(366, 0, 310, 3, 26, 20, '#8f6238'); B(437, 0, 310, 3, 26, 20, '#8f6238');
    [['#e23b4e', 372, 3], ['#f4f4f8', 392, 3], ['#3fa0f0', 414, 3], ['#c8f02a', 380, 15], ['#ff5bd1', 404, 15], ['#2f3138', 422, 15]].forEach(([c, x, y]) => { B(x, y, 314, 14, 6, 11, c); });
    B(356, 0, 530, 28, 28, 40, '#b98a55', { top: '#c99a66' }); m.cyl(370, 28, 548, 8, 10, '#d07c4c', { r2: 10 }); m.cyl(370, 38, 548, 13, 12, '#3f8f4f', { r2: 5 }); B(360, 28, 534, 12, 2, 9, '#f4f4f8');
    B(464, 0, 580, 6, 30, 20, '#5b3b2a', { top: '#74492f' }); B(550, 0, 580, 6, 30, 20, '#5b3b2a', { top: '#74492f' });

    // ===== CUARTO DE XIMENA =====
    r = FLOORS.xroom; m.flat(r.x - 26, r.y - 26, r.w + 26, r.h + 26, 0, '#bba6de');
    for (let j = 0; j < 14; j++) for (let i = 0; i < 15; i++) if ((i + j) % 2 === 0) m.flat(r.x + 6 + i * 20, r.y + 6 + j * 20, 3, 3, 0.2, '#a892cf');
    m.cyl(775, 0, 470, 62, 0.5, '#f4efe2'); m.cyl(775, 0.1, 470, 50, 0.5, '#e7d6f7'); m.cyl(775, 0.2, 470, 30, 0.5, '#f4efe2');
    B(856, 0, 326, 98, 46, 6, '#7a563a', { top: '#8d6748' }); B(856, 0, 332, 98, 14, 140, '#7a563a'); B(858, 14, 334, 94, 10, 136, '#fdfdf5');
    B(872, 24, 338, 66, 6, 26, '#fdfdf5', { top: '#ffffff' }); B(858, 24, 376, 94, 4, 94, '#b48cf0', { top: '#c29df5' }); B(858, 24, 370, 94, 5, 9, '#9a72dc'); B(858, 14, 462, 94, 12, 8, '#9a72dc');
    B(826, 0, 334, 26, 24, 26, '#94694a', { top: '#a67957' }); B(830, 8, 360, 18, 8, 0.8, '#a97c58'); m.cyl(839, 24, 346, 5, 3, '#5b4636'); m.cyl(839, 27, 346, 1.5, 9, '#5b4636'); m.cyl(839, 34, 346, 8, 10, '#ffd9a0', { r2: 5, emit: true });
    B(690, 32, 312, 100, 4, 36, '#d8c2a0', { top: '#e6d2b3' }); B(690, 0, 312, 4, 32, 36, '#a98f6a'); B(786, 0, 312, 4, 32, 36, '#a98f6a'); B(694, 8, 314, 30, 24, 32, '#bfa780');
    B(724, 36, 326, 32, 2, 18, '#c9ced8'); B(724, 38, 324, 32, 20, 2, '#2f3138'); m.wallQuad(726, 40, 326.2, 28, 16, '#b48cf0', true);
    B(766, 36, 318, 16, 4, 12, '#e23b4e'); B(767, 40, 319, 14, 3, 11, '#3fa0f0'); B(768, 43, 320, 12, 3, 10, '#ffd23f'); m.cyl(704, 36, 330, 4, 7, '#f4f4f8'); B(758, 36, 334, 2, 14, 2, '#2f3138'); m.cyl(759, 48, 338, 7, 5, '#ffd23f', { r2: 3 });
    B(726, 0, 354, 26, 3, 22, '#5b4636'); B(736, 3, 362, 6, 14, 6, '#5b4636'); B(726, 17, 354, 26, 4, 22, '#8f5fd6'); B(726, 21, 373, 26, 22, 3, '#8f5fd6');
    m.cyl(695, 0, 559, 11, 18, '#f4f4f8', { r2: 13, top: '#5a3b24' }); m.cyl(695, 18, 559, 3, 20, '#2f7a45'); m.cyl(695, 34, 559, 16, 16, '#3f8f4f', { r2: 5 });
    B(700, 0, 500, 24, 22, 14, '#3fa0f0', { top: '#62b5f7' }); B(704, 6, 514, 16, 10, 2, '#2b7fc7');
    B(940, 0, 520, 14, 3, 40, '#f4f4f8'); B(940, 3, 520, 14, 3, 40, '#e6e0f2'); // zapatos clínicos / tapete
    return m.upload();
  }

  // ---------- Paredes (dinámicas: se "cortan" si tapan la vista) ----------
  const WC = { cocina: '#bfded6', sala: '#ecd8b4', cuarto: '#c4d3ea', pasillo: '#e9dfcc', xroom: '#dccbf0', cap: '#3a3348', out: '#2c2638' };
  const shade = (c, f) => R.rgb(c).map((v) => v * f);
  // [x, z, w, d, grupo, caraSur, caraEste, caraOeste]
  const WALLS = [
    [20, 20, 320, 20, 'n', 'cocina'], [340, 20, 640, 20, 'n', 'sala'],
    [20, 40, 20, 250, 'side', null, 'cocina'], [960, 40, 20, 250, 'side', null, null, 'sala'],
    [330, 40, 20, 110, 'side', null, 'sala', 'cocina'], [330, 220, 20, 70, 'side', null, 'sala', 'cocina'],
    [20, 290, 130, 20, 'mid', 'cuarto'], [220, 290, 130, 20, 'mid', 'cuarto'], [350, 290, 120, 20, 'mid', 'pasillo'], [550, 290, 120, 20, 'mid', 'pasillo'], [670, 290, 310, 20, 'mid', 'xroom'],
    [20, 310, 20, 270, 'side', null, 'cuarto'], [960, 310, 20, 270, 'side', null, null, 'xroom'],
    [330, 310, 20, 110, 'side', null, 'pasillo', 'cuarto'], [330, 490, 20, 90, 'side', null, 'pasillo', 'cuarto'],
    [650, 310, 20, 110, 'side', null, 'xroom', 'pasillo'], [650, 490, 20, 90, 'side', null, 'xroom', 'pasillo'],
    [20, 580, 450, 20, 'low', 'out'], [550, 580, 430, 20, 'low', 'out'],
  ];
  function drawWalls(mb, dt, focusZ) {
    World.midK += ((focusZ < 296 ? 0 : 1) - World.midK) * Math.min(1, dt * 7);
    World.doorK += ((World.xDoorOpen ? 1 : 0) - World.doorK) * Math.min(1, dt * 8);
    const cap = WC.cap;
    for (const w of WALLS) {
      const [x, z, ww, d, g, cs, ce, cw] = w;
      const h = g === 'low' ? WALL_LOW : g === 'mid' ? WALL_LOW + (WALL_H - WALL_LOW) * World.midK : WALL_H;
      const S = WC[cs] || WC.out, E = WC[ce] || WC.out, Wc = WC[cw] || WC.out;
      const wain = Math.min(24, h);
      mb.box(x, 0, z, ww, wain, d, cap, { s: shade(S, 0.8), e: shade(E, 0.8), w: shade(Wc, 0.8), n: WC.out });
      if (h > wain) { mb.box(x, wain, z, ww, 2, d, cap, { s: shade(S, 0.62), e: shade(E, 0.62), w: shade(Wc, 0.62) }); mb.box(x, wain + 2, z, ww, h - wain - 2, d, cap, { s: S, e: E, w: Wc, n: WC.out }); }
    }
    // puerta del cuarto de Ximena
    const k = World.doorK;
    if (k < 0.5) mb.box(656, 0, 420, 8, 84, 70, '#8f5fd6', { w: '#9a6ee0', top: '#6d43ad' }); else mb.box(670, 0, 412, 70, 84, 8, '#8f5fd6', { s: '#9a6ee0', top: '#6d43ad' });
    mb.box(657.5, 38, 478, 1.5, 6, 4, '#f2c230');
    // decoración colgada en la pared central (sólo si la pared está alta)
    const f = World.midK; if (f < 0.6) return;
    const y = (v) => v * f;
    mb.box(60, y(46), 309.5, 34, y(40), 1.5, '#2f3138'); mb.wallQuad(63, y(49), 311.2, 28, y(34), '#e23b4e'); mb.wallQuad(70, y(58), 311.3, 14, y(14), '#ffd23f');
    mb.box(124, y(52), 309.5, 22, y(30), 1.5, '#f4f4f8'); mb.wallQuad(127, y(55), 311.2, 16, y(24), '#3fa0f0');
    mb.box(372, y(62), 309.5, 62, y(4), 4, '#5b3b2a'); [['#3fa0f0', 376], ['#e23b4e', 394], ['#ffd23f', 412]].forEach(([c, x]) => mb.box(x, y(34), 311, 14, y(28), 5, c));
    mb.box(700, y(44), 309.5, 34, y(44), 1.5, '#f4efe2'); mb.wallQuad(710, y(52), 311.2, 14, y(28), '#f08cc0'); mb.wallQuad(714, y(78), 311.2, 6, y(6), '#f08cc0');
    mb.box(880, y(48), 309.5, 26, y(20), 1.5, '#5b4636'); mb.wallQuad(882, y(50), 311.2, 22, y(16), '#fdfdf5');
    mb.box(912, y(48), 309.5, 26, y(20), 1.5, '#5b4636'); mb.wallQuad(914, y(50), 311.2, 22, y(16), '#fdfdf5');
  }

  // ---------- Elementos dinámicos del departamento ----------
  function drawDynamic(mb, t, opts) {
    const S = G.S, night = S && S.phase !== 'collect';
    mb.wallQuad(774, 36, 41.2, 100, 50, night ? '#1b2145' : '#f0a868', true);
    if (night) { mb.wallQuad(858, 70, 41.4, 8, 8, '#f4eec0', true); [[790, 72], [812, 50], [840, 64]].forEach(([x, y]) => mb.wallQuad(x, y, 41.4, 1.6, 1.6, '#fdfdf5', true)); }
    else mb.wallQuad(774, 36, 41.3, 100, 14, '#f7c98a', true);
    const tv = S && S.flags.tvOn;
    mb.wallQuad(584, 34, 53.2, 92, 50, tv ? ['#7fd3ff', '#ff8ad6', '#ffd23f'][Math.floor(t * 6) % 3] : '#23262e', tv);
    if (!S) return;
    const hid = opts.hidden;
    S.deco.forEach((d) => {
      if (!d.placed || (hid && hid.has('deco' + d.i))) return;
      const sp = DECO_SPOTS[d.i], fall = d.fall || 0;
      if (sp.kind === 'guirnalda') {
        const cols = d.improv ? ['#fdfdf5', '#f4efe2'] : ['#e23b4e', '#ffd23f', '#3fa0f0', '#58c46a', '#b48cf0'];
        for (let i = 0; i < 9; i++) { const x = sp.wx + i * 10, sag = Math.sin((i / 8) * Math.PI) * 8, sw = Math.sin(t * 2 + i) * 0.6; mb.box(x, 78 - sag, 40.6, 9, 1, 1, '#6b5a4a'); if (d.improv) mb.box(x + 2, 60 - sag - (i % 3) * 5, 41, 5, 18 + (i % 3) * 5, 0.8, cols[i % 2]); else { mb.box(x + 1 + sw, 70 - sag, 41, 7, 8, 0.8, cols[i % 5]); mb.box(x + 3 + sw, 66 - sag, 41, 3, 4, 0.8, cols[i % 5]); } }
      } else if (sp.kind === 'luces') {
        const x0 = d.i === 4 ? 352 : 660, cols = d.improv ? ['#ffe14a', '#ff8ad6', '#7fd3ff'] : ['#ff4f6a', '#ffd23f', '#4fd0ff', '#7dff8a', '#ff8ad6'];
        for (let i = 0; i < 20; i++) { const x = x0 + 6 + i * 14.6, yy = 88 + Math.sin(i * 0.9) * 3; mb.box(x - 6, yy + 3, 40.5, 14, 0.8, 0.8, '#2f5a3c'); const on = d.improv || Math.floor(t * 2.5 + i) % 3 !== 0; if (d.improv) mb.box(x, yy - 4, 41, 6, 6, 0.6, cols[i % 3]); else mb.box(x, yy - 2, 40.8, 3.4, 4.6, 3, on ? cols[i % 5] : '#5a5560', { emit: on }); }
      }
    });
  }
  function drawPartySprites(t, opts) {
    const S = G.S; if (!S || S.phase === 'collect' || S.phase === 'title') return;
    const hid = opts.hidden, on = (id, x, y, z, s) => { if (S.inv[id] && !(hid && hid.has(id))) R.sprite(Sp.item(id), x, y, z, { feet: 5, sx: s || 1.1, sy: s || 1.1, nostretch: false }); };
    on('bocaditos', 826, 34, 224); on('pastel', 866, 34, 222, 1.25); on('bebidas', 905, 34, 224);
    on('regalo', 636, 16, 126); on('parlante', 722, 0, 66, 1.3);
    S.deco.forEach((d) => {
      const sp = DECO_SPOTS[d.i];
      if (!d.placed || sp.kind !== 'globos' || (hid && hid.has('deco' + d.i))) return;
      R.shadow(sp.bx, sp.by, 12, 0.5);
      R.sprite(Sp.item(d.improv ? 'cartel' : 'globos'), sp.bx + Math.sin(t * 1.4 + d.i) * 2, 6 + Math.sin(t * 2 + d.i * 2) * 2.5, sp.by, { feet: 4, sx: 2, sy: 2 });
    });
  }

  // ---------- Iluminación ----------
  const LIGHT = {
    dia: { amb: [0.66, 0.6, 0.58], sun: [0.5, 0.44, 0.36], sky: '#231c2e', points: [] },
    noche: { amb: [0.43, 0.44, 0.6], sun: [0.2, 0.21, 0.32], sky: '#0f0d1a', points: [{ x: 798, y: 66, z: 80, r: 300, c: [0.62, 0.48, 0.24] }, { x: 839, y: 40, z: 352, r: 150, c: [0.34, 0.22, 0.4] }, { x: 185, y: 60, z: 110, r: 220, c: [0.18, 0.24, 0.3] }] },
    oscuro: { amb: [0.1, 0.1, 0.18], sun: [0.02, 0.02, 0.05], sky: '#07060c', points: [] },
    fiesta: { amb: [0.78, 0.72, 0.74], sun: [0.42, 0.38, 0.34], sky: '#231c2e', points: [{ x: 500, y: 70, z: 160, r: 260, c: [0.35, 0.1, 0.3] }, { x: 820, y: 70, z: 160, r: 260, c: [0.1, 0.25, 0.35] }] },
  };
  World.LIGHT = LIGHT;
  World.mixLight = function (a, b, k) {
    const L = (u, v) => u.map((x, i) => x + (v[i] - x) * k);
    const pts = (k < 0.5 ? a.points : b.points).map((p) => ({ ...p, c: p.c.map((v) => v * (k < 0.5 ? 1 - k * 2 : k * 2 - 1)) }));
    return { amb: L(a.amb, b.amb), sun: L(a.sun, b.sun), sky: k < 0.5 ? a.sky : b.sky, points: pts };
  };

  let staticMesh = null;
  const ov = () => G.ovCtx;

  /* Dibuja un cuadro completo.
     opts: { cam, light, actors, items:[{id,x,y}], focusZ, hidden:Set, mesh (arena propia), boxes(mb,t), sprites(t), over(ctx,t), dt } */
  World.render = function (opts) {
    const t = performance.now() / 1000, dt = opts.dt || 0.016;
    const light = opts.light || LIGHT.dia;
    R.begin(opts.cam, light);
    if (opts.mesh) R.mesh(opts.mesh);
    else {
      staticMesh = staticMesh || buildStatic();
      R.mesh(staticMesh);
      drawWalls(R.dyn, dt, opts.focusZ == null ? opts.cam.z : opts.focusZ);
      drawDynamic(R.dyn, t, opts);
      drawPartySprites(t, opts);
    }
    if (opts.boxes) opts.boxes(R.dyn, t);
    (opts.items || []).forEach((it) => { R.shadow(it.x, it.y, 11, 0.7); R.sprite(Sp.item(it.id), it.x, 5 + Math.abs(Math.sin(t * 3 + it.x)) * 5, it.y, { feet: 4, sx: 1.15, sy: 1.15, lit: 0.6 }); R.flat(R.glowTex, it.x, 0.7, it.y, 20, { alpha: 0.35 + Math.sin(t * 4 + it.x) * 0.12, tint: [1, 0.9, 0.5] }); });
    (opts.actors || []).forEach((a) => a.draw3d());
    for (const p of World.fx) R.sprite(p.c, p.x, p.y, p.z, { sx: p.s * (1 + p.t), sy: p.s * (1 + p.t), alpha: 1 - p.t / p.d, lit: p.c === starC ? 0 : 0.8, nostretch: true });
    if (opts.sprites) opts.sprites(t);
    R.end();
    // capa 2D
    const c = ov(); c.setTransform(2, 0, 0, 2, 0, 0); c.clearRect(0, 0, 640, 360);
    (opts.actors || []).forEach((a) => {
      if (a.hidden) return;
      if (a.emote) { const p = a.head(6), k = Math.min(1, (a.emote.d - a.emote.t) * 8); G.text(c, a.emote.text, p.x, p.y - 4 - k * 4, { size: 8 + k * 8, color: a.emote.color || '#ffd23f', lw: 4 }); }
      if (a.bubble) { const p = a.head(4); G.bubble(c, a.bubble.text, p.x, p.y - 4); }
    });
    if (opts.over) opts.over(c, t);
  };
  World.camLerp = function (cam, tx, tz, dt, k) { const a = Math.min(1, dt * (k || 4)); cam.x += (tx - cam.x) * a; cam.z += (tz - cam.z) * a; };

  // ---------- Texto en la capa 2D ----------
  G.FONT = '"Trebuchet MS", "Segoe UI", Verdana, sans-serif';
  G.text = function (ctx, str, x, y, o) {
    o = o || {};
    ctx.font = `${o.bold === false ? '' : 'bold '}${o.size || 9}px ${G.FONT}`;
    ctx.textAlign = o.align || 'center'; ctx.textBaseline = 'middle';
    if (o.stroke !== false) { ctx.lineWidth = o.lw || 3; ctx.strokeStyle = o.stroke || '#1c1826'; ctx.lineJoin = 'round'; ctx.strokeText(str, x, y); }
    ctx.fillStyle = o.color || '#fff'; ctx.fillText(str, x, y);
  };
  G.bubble = function (ctx, str, x, y) {
    ctx.font = `bold 8px ${G.FONT}`;
    const words = str.split(' '), lines = []; let cur = '';
    words.forEach((w) => { if (ctx.measureText(cur + ' ' + w).width > 130 && cur) { lines.push(cur); cur = w; } else cur = cur ? cur + ' ' + w : w; });
    lines.push(cur);
    const w = Math.max(...lines.map((l) => ctx.measureText(l).width)) + 12, h = lines.length * 10 + 8;
    const bx = Math.max(4, Math.min(636 - w, x - w / 2)), by = Math.max(4, y - h - 6);
    ctx.fillStyle = '#1c1826'; ctx.beginPath(); ctx.roundRect(bx - 1.5, by - 1.5, w + 3, h + 3, 6); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.roundRect(bx, by, w, h, 5); ctx.fill();
    ctx.beginPath(); ctx.moveTo(x - 4, by + h - 1); ctx.lineTo(x + 4, by + h - 1); ctx.lineTo(x, by + h + 5); ctx.fill();
    ctx.fillStyle = '#1c1826'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    lines.forEach((l, i) => ctx.fillText(l, bx + 6, by + 9 + i * 10));
  };
  G.prompt = function (ctx, label, x, y) {
    ctx.font = `bold 7.5px ${G.FONT}`;
    const w = ctx.measureText(label).width + 12;
    ctx.fillStyle = '#1c1826'; ctx.beginPath(); ctx.roundRect(x - w / 2, y - 8, w, 15, 5); ctx.fill();
    ctx.fillStyle = '#ffd23f'; ctx.beginPath(); ctx.roundRect(x - w / 2 + 1.5, y - 6.5, w - 3, 11, 3.5); ctx.fill();
    ctx.fillStyle = '#1c1826'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(label, x, y - 0.5);
  };
})();
