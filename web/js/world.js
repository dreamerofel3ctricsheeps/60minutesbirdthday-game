/* ============================================================
   MUNDO: departamento, muebles, actores, entrada de teclado.
   Resolución lógica 640x360 (se dibuja a 2x para texto nítido).
   ============================================================ */
(function () {
  'use strict';
  const G = (window.G = window.G || {});
  const Sp = G.Sprites;

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

  // ---------- Geometría ----------
  const FLOORS = {
    cocina: { x: 12, y: 48, w: 188, h: 122 },
    sala: { x: 212, y: 48, w: 416, h: 122 },
    cuarto: { x: 12, y: 220, w: 188, h: 128 },
    pasillo: { x: 212, y: 220, w: 228, h: 128 },
    xroom: { x: 452, y: 220, w: 176, h: 128 },
  };
  const OPEN = [
    { x: 196, y: 96, w: 20, h: 44 },   // cocina ↔ sala
    { x: 300, y: 166, w: 52, h: 58 },  // sala ↔ pasillo
    { x: 84, y: 166, w: 44, h: 58 },   // cocina ↔ cuarto
    { x: 196, y: 268, w: 20, h: 44 },  // cuarto ↔ pasillo
    { x: 436, y: 268, w: 20, h: 44, door: true }, // pasillo ↔ cuarto de Ximena
  ];
  const DOORS = { 'cocina-sala': [206, 120], 'sala-pasillo': [326, 196], 'cocina-cuarto': [106, 196], 'cuarto-pasillo': [206, 292], 'pasillo-xroom': [446, 292] };
  const ADJ = { cocina: ['sala', 'cuarto'], sala: ['cocina', 'pasillo'], cuarto: ['cocina', 'pasillo'], pasillo: ['sala', 'cuarto', 'xroom'], xroom: ['pasillo'] };

  // Muebles: huella sólida (x,y,w,h) + altura visual
  const FURN = [
    { id: 'counter', x: 12, y: 48, w: 140, h: 16, tall: 20 },
    { id: 'fridge', x: 164, y: 48, w: 32, h: 16, tall: 46 },
    { id: 'ktable', x: 56, y: 112, w: 56, h: 22, tall: 14 },
    { id: 'bookshelf', x: 224, y: 48, w: 60, h: 12, tall: 40 },
    { id: 'tv', x: 392, y: 48, w: 72, h: 12, tall: 14 },
    { id: 'ctable', x: 404, y: 86, w: 48, h: 16, tall: 9 },
    { id: 'sofa', x: 384, y: 124, w: 88, h: 24, tall: 14 },
    { id: 'plant', x: 598, y: 50, w: 22, h: 12, tall: 14 },
    { id: 'ptable', x: 520, y: 98, w: 84, h: 24, tall: 14 },
    { id: 'shelf', x: 16, y: 220, w: 72, h: 12, tall: 38 },
    { id: 'bed', x: 136, y: 224, w: 56, h: 38, tall: 10 },
    { id: 'boxes', x: 150, y: 320, w: 44, h: 24, tall: 18 },
    { id: 'basket', x: 18, y: 318, w: 26, h: 18, tall: 14 },
    { id: 'closet', x: 372, y: 220, w: 60, h: 14, tall: 42 },
    { id: 'mesita', x: 224, y: 326, w: 30, h: 16, tall: 12 },
    { id: 'xdesk', x: 462, y: 220, w: 56, h: 14, tall: 16 },
    { id: 'xbed', x: 566, y: 252, w: 58, h: 78, tall: 10 },
  ];
  const furn = (id) => FURN.find((f) => f.id === id);

  // Puntos donde aparecen los objetos en el minuto de recolección (3 habitaciones)
  const SPAWNS = [[30, 152], [132, 96], [178, 156], [250, 156], [606, 160], [332, 84], [500, 74], [100, 334], [100, 268], [70, 300], [560, 150], [36, 100]];
  const STASH = { x: 402, y: 240 };

  // Escondites de Pollito (punto de acceso del jugador)
  const HIDEOUTS = [
    { f: 'sofa', x: 428, y: 158 }, { f: 'plant', x: 596, y: 76 }, { f: 'bookshelf', x: 254, y: 70 },
    { f: 'ktable', x: 84, y: 144 }, { f: 'fridge', x: 176, y: 74 }, { f: 'boxes', x: 170, y: 314 },
    { f: 'basket', x: 54, y: 332 }, { f: 'shelf', x: 52, y: 240 }, { f: 'ptable', x: 562, y: 132 }, { f: 'mesita', x: 262, y: 338 },
  ];

  // Zonas de decoración de la sala
  const DECO_SPOTS = [
    { kind: 'guirnalda', x: 334, y: 62 }, { kind: 'guirnalda', x: 506, y: 64 },
    { kind: 'globos', x: 356, y: 160 }, { kind: 'globos', x: 500, y: 160 },
    { kind: 'luces', x: 226, y: 126 }, { kind: 'luces', x: 616, y: 132 },
  ];

  const World = {
    FLOORS, OPEN, FURN, SPAWNS, STASH, HIDEOUTS, DECO_SPOTS, furn,
    xDoorOpen: false,
    wiggle: {}, // id de mueble -> tiempo restante de sacudida

    roomAt(x, y) {
      for (const k in FLOORS) { const r = FLOORS[k]; if (x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h) return k; }
      return null;
    },
    pointFree(x, y) {
      let ok = false;
      for (const k in FLOORS) { const r = FLOORS[k]; if (x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h) { ok = true; break; } }
      if (!ok) for (const o of OPEN) { if (o.door && !World.xDoorOpen) continue; if (x >= o.x && x <= o.x + o.w && y >= o.y && y <= o.y + o.h) { ok = true; break; } }
      return ok;
    },
    // ¿puede pararse un actor con los pies en (x,y)?
    canStand(x, y) {
      const hw = 6, hh = 5;
      const pts = [[x - hw, y - hh], [x + hw, y - hh], [x - hw, y], [x + hw, y]];
      for (const p of pts) if (!World.pointFree(p[0], p[1])) return false;
      for (const f of FURN) if (x + hw > f.x && x - hw < f.x + f.w && y > f.y && y - hh < f.y + f.h) return false;
      return true;
    },
    // ruta por puertas entre dos puntos (para NPCs)
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
      for (let i = 0; i < 40; i++) { const x = r.x + 12 + Math.random() * (r.w - 24), y = r.y + 14 + Math.random() * (r.h - 20); if (World.canStand(x, y)) return [x, y]; }
      return [r.x + r.w / 2, r.y + r.h / 2];
    },
  };
  G.World = World;

  // ---------- Actores ----------
  class Actor {
    constructor(id, x, y) {
      this.id = id; this.x = x; this.y = y; this.dir = 'down'; this.moving = false; this.t = Math.random() * 3;
      this.expr = null; this.frameOverride = null; this.bubble = null; this.route = null; this.speed = 60; this.hidden = false;
    }
    // movimiento con colisiones (jugador)
    walk(dx, dy, speed, dt) {
      this.moving = !!(dx || dy);
      if (!this.moving) return;
      if (Math.abs(dx) > Math.abs(dy)) this.dir = dx > 0 ? 'right' : 'left'; else this.dir = dy > 0 ? 'down' : 'up';
      const nx = this.x + dx * speed * dt, ny = this.y + dy * speed * dt;
      if (World.canStand(nx, this.y)) this.x = nx;
      if (World.canStand(this.x, ny)) this.y = ny;
    }
    // movimiento por ruta (NPC, ignora muebles)
    goTo(x, y, speed, direct) {
      this.route = direct ? [[x, y]] : World.path(this.x, this.y, x, y);
      if (speed) this.speed = speed;
    }
    get arrived() { return !this.route || !this.route.length; }
    follow(dt) {
      if (this.arrived) { this.moving = false; return; }
      const [tx, ty] = this.route[0];
      const dx = tx - this.x, dy = ty - this.y, d = Math.hypot(dx, dy), step = this.speed * dt;
      if (d <= step) { this.x = tx; this.y = ty; this.route.shift(); if (!this.route.length) this.moving = false; return; }
      this.x += (dx / d) * step; this.y += (dy / d) * step; this.moving = true;
      if (Math.abs(dx) > Math.abs(dy)) this.dir = dx > 0 ? 'right' : 'left'; else this.dir = dy > 0 ? 'down' : 'up';
    }
    say(text, secs) { this.bubble = { text, t: secs || 2.5 }; }
    update(dt) { this.t += dt; if (this.bubble && (this.bubble.t -= dt) <= 0) this.bubble = null; }
    get sortY() { return this.y; }
    draw(ctx) {
      if (this.hidden) return;
      ctx.fillStyle = 'rgba(0,0,0,.22)';
      ctx.beginPath(); ctx.ellipse(this.x, this.y, 11, 4, 0, 0, 6.3); ctx.fill();
      if (this.id === 'pollito') {
        const fast = this.speed > 120;
        const pose = this.moving ? (fast ? 'run' : 'walk') + (Math.floor(this.t * (fast ? 14 : 8)) % 2) : 'sit';
        ctx.drawImage(Sp.cat(pose, this.dir === 'left'), Math.round(this.x - 32), Math.round(this.y - 59));
        return;
      }
      const frame = this.frameOverride != null ? this.frameOverride : this.moving ? (Math.floor(this.t * 8) % 2 ? 1 : 2) : 0;
      const bob = !this.moving && this.frameOverride == null && Math.floor(this.t * 1.6) % 2 ? 1 : 0;
      ctx.drawImage(Sp.char(this.id, this.dir, frame, this.expr), Math.round(this.x - 32), Math.round(this.y - 60 + bob));
      if (this.carry && this.carry.length) this.carry.forEach((it, i) => ctx.drawImage(Sp.item(it), Math.round(this.x - 16 + (i ? 9 : this.carry.length > 1 ? -9 : 0)), Math.round(this.y - 78 - (this.moving ? Math.floor(this.t * 8) % 2 : 0))));
    }
  }
  G.Actor = Actor;

  // ---------- Dibujo ----------
  function box(ctx, f, top, front, edge) {
    ctx.fillStyle = front; ctx.fillRect(f.x, f.y + f.h - f.tall, f.w, f.tall);
    ctx.fillStyle = top; ctx.fillRect(f.x, f.y - f.tall, f.w, f.h);
    ctx.fillStyle = edge || 'rgba(0,0,0,.18)'; ctx.fillRect(f.x, f.y + f.h - 1, f.w, 1);
    ctx.fillStyle = 'rgba(255,255,255,.18)'; ctx.fillRect(f.x, f.y - f.tall, f.w, 1);
  }
  const R = (ctx, c, x, y, w, h) => { ctx.fillStyle = c; ctx.fillRect(x, y, w, h); };

  const FURN_DRAW = {
    counter(ctx, f) {
      box(ctx, f, '#e9e4d8', '#8a6a4f'); const t = f.y - f.tall;
      R(ctx, '#b9c4cc', 24, t + 3, 30, 10); R(ctx, '#8d9aa5', 27, t + 5, 24, 6); R(ctx, '#6f7b85', 38, t + 1, 3, 4);
      R(ctx, '#2f3138', 84, t + 2, 40, 12); [90, 108].forEach((x) => [t + 4, t + 9].forEach((y) => R(ctx, '#5d6170', x, y, 8, 3)));
      for (let x = 14; x < 150; x += 34) R(ctx, '#6f543d', x, f.y + f.h - f.tall + 3, 1, f.tall - 6);
    },
    fridge(ctx, f) {
      box(ctx, f, '#dfe6ea', '#c5d0d6'); const t = f.y + f.h - f.tall;
      R(ctx, '#a9b6bd', f.x, t + 16, f.w, 1); R(ctx, '#7d8a92', f.x + 4, t + 6, 2, 7); R(ctx, '#7d8a92', f.x + 4, t + 21, 2, 12);
      R(ctx, '#ffd23f', f.x + 14, t + 5, 6, 5); R(ctx, '#e23b4e', f.x + 22, t + 8, 5, 5);
    },
    ktable(ctx, f) { box(ctx, f, '#c9925a', '#8f6238'); R(ctx, '#b07d49', f.x + 4, f.y - f.tall + 4, f.w - 8, 1); R(ctx, '#6d4a2a', f.x + 2, f.y + f.h - 4, 3, 4); R(ctx, '#6d4a2a', f.x + f.w - 5, f.y + f.h - 4, 3, 4); },
    bookshelf(ctx, f) {
      box(ctx, f, '#8a5f3c', '#74502f'); const t = f.y + f.h - f.tall;
      const cols = ['#e23b4e', '#3fa0f0', '#ffd23f', '#58c46a', '#b48cf0', '#f08cc0', '#f4f4f8'];
      [t + 4, t + 16, t + 28].forEach((y, r) => { R(ctx, '#4a321d', f.x + 3, y, f.w - 6, 10); for (let i = 0; i < 12; i++) R(ctx, cols[(i * 3 + r * 2) % 7], f.x + 5 + i * 4, y + 1 + ((i + r) % 3), 3, 9 - ((i + r) % 3)); });
    },
    tv(ctx, f) {
      box(ctx, f, '#5b4636', '#44332a');
      R(ctx, '#17181d', f.x + 8, f.y - f.tall - 30, 56, 32); R(ctx, G.S && G.S.flags.tvOn ? '#7fd3ff' : '#23262e', f.x + 10, f.y - f.tall - 28, 52, 28);
      R(ctx, 'rgba(255,255,255,.12)', f.x + 12, f.y - f.tall - 26, 14, 2); R(ctx, '#17181d', f.x + 32, f.y - f.tall, 8, 3);
    },
    ctable(ctx, f) { box(ctx, f, '#d8b483', '#a57f52'); R(ctx, '#c29a66', f.x + 3, f.y - f.tall + 3, f.w - 6, 1); },
    sofa(ctx, f) {
      const t = f.y - f.tall;
      R(ctx, '#3d7a74', f.x, t - 8, f.w, 14); R(ctx, '#56a39b', f.x, t - 8, f.w, 2);
      R(ctx, '#4b9189', f.x + 6, t + 6, f.w - 12, f.h - 2); R(ctx, '#3d7a74', f.x + f.w / 2 - 1, t + 6, 1, f.h - 2);
      R(ctx, '#356b66', f.x, t + 2, 8, f.h + 6); R(ctx, '#356b66', f.x + f.w - 8, t + 2, 8, f.h + 6);
      R(ctx, '#2c5955', f.x, f.y + f.h - 6, f.w, 6);
      R(ctx, '#ffd23f', f.x + 12, t + 8, 12, 9); R(ctx, '#f08cc0', f.x + f.w - 26, t + 8, 12, 9);
    },
    plant(ctx, f) {
      R(ctx, '#b5653a', f.x + 3, f.y - 4, 16, 14); R(ctx, '#d07c4c', f.x + 2, f.y - 6, 18, 4);
      ctx.fillStyle = '#3f8f4f'; [[11, -22, 9], [4, -14, 7], [18, -15, 7], [11, -12, 8]].forEach(([dx, dy, r]) => { ctx.beginPath(); ctx.arc(f.x + dx, f.y + dy, r, 0, 6.3); ctx.fill(); });
      ctx.fillStyle = '#58b56a'; [[9, -25, 4], [3, -16, 3], [17, -18, 3]].forEach(([dx, dy, r]) => { ctx.beginPath(); ctx.arc(f.x + dx, f.y + dy, r, 0, 6.3); ctx.fill(); });
    },
    ptable(ctx, f) {
      box(ctx, f, '#f4efe2', '#d9d0bb'); const t = f.y - f.tall;
      const party = G.S && G.S.phase !== 'collect';
      if (party) { for (let x = f.x; x < f.x + f.w; x += 12) { R(ctx, '#f08cc0', x, f.y + f.h - f.tall, 6, 5); R(ctx, '#b48cf0', x + 6, f.y + f.h - f.tall, 6, 5); } }
      R(ctx, '#e6dfcd', f.x + 3, t + 3, f.w - 6, 1);
    },
    shelf(ctx, f) {
      box(ctx, f, '#9a7350', '#7f5c3c'); const t = f.y + f.h - f.tall;
      [t + 5, t + 20].forEach((y, r) => { R(ctx, '#5a3f28', f.x + 3, y, f.w - 6, 12); R(ctx, r ? '#3fa0f0' : '#ffd23f', f.x + 8, y + 3, 12, 9); R(ctx, r ? '#e23b4e' : '#58c46a', f.x + 28, y + 5, 16, 7); R(ctx, '#f4f4f8', f.x + 50, y + 2, 10, 10); });
    },
    bed(ctx, f) {
      box(ctx, f, '#e8643c', '#9a4a2c'); const t = f.y - f.tall;
      R(ctx, '#fdfdf5', f.x + 3, t + 3, f.w - 6, 11); R(ctx, '#d94f2a', f.x, t + 18, f.w, 2); R(ctx, '#6d4a2a', f.x, t - 6, f.w, 7);
    },
    boxes(ctx, f) {
      box(ctx, { ...f, w: 26 }, '#d3a770', '#b98a55'); box(ctx, { x: f.x + 22, y: f.y + 4, w: 22, h: 20, tall: 12 }, '#dcb37c', '#c79a63');
      R(ctx, '#e8d9b8', f.x + 11, f.y - f.tall, 4, f.h); R(ctx, '#7d5a33', f.x + 6, f.y + f.h - 10, 12, 1);
    },
    basket(ctx, f) {
      box(ctx, f, '#e8dcc0', '#c9a86a'); const t = f.y + f.h - f.tall;
      for (let x = f.x + 2; x < f.x + f.w; x += 4) R(ctx, '#a88848', x, t + 2, 1, f.tall - 3);
      R(ctx, '#3fa0f0', f.x + 4, f.y - f.tall + 2, 9, 6); R(ctx, '#f08cc0', f.x + 12, f.y - f.tall + 6, 9, 6);
    },
    closet(ctx, f) {
      box(ctx, f, '#7a563a', '#94694a'); const t = f.y + f.h - f.tall;
      R(ctx, '#7a563a', f.x + f.w / 2 - 1, t + 2, 2, f.tall - 4); R(ctx, '#a97c58', f.x + 4, t + 4, f.w / 2 - 8, f.tall - 10); R(ctx, '#a97c58', f.x + f.w / 2 + 4, t + 4, f.w / 2 - 8, f.tall - 10);
      R(ctx, '#f2c230', f.x + f.w / 2 - 5, t + 20, 2, 5); R(ctx, '#f2c230', f.x + f.w / 2 + 3, t + 20, 2, 5);
    },
    mesita(ctx, f) { box(ctx, f, '#b98a55', '#8f6238'); R(ctx, '#58b56a', f.x + 10, f.y - f.tall - 8, 10, 8); R(ctx, '#d07c4c', f.x + 11, f.y - f.tall - 1, 8, 5); },
    xdesk(ctx, f) { box(ctx, f, '#d8c2a0', '#a98f6a'); const t = f.y - f.tall; R(ctx, '#f4f4f8', f.x + 6, t + 2, 14, 9); R(ctx, '#8f5fd6', f.x + 26, t + 3, 10, 8); R(ctx, '#2f3138', f.x + 42, t - 8, 3, 14); R(ctx, '#ffd23f', f.x + 38, t - 12, 11, 5); },
    xbed(ctx, f) {
      box(ctx, f, '#b48cf0', '#6d43ad'); const t = f.y - f.tall;
      R(ctx, '#7a563a', f.x, t - 8, f.w, 9); R(ctx, '#fdfdf5', f.x + 8, t + 4, f.w - 16, 16); R(ctx, '#9a72dc', f.x, t + 30, f.w, 3); R(ctx, '#c9a9f7', f.x + 4, t + 36, f.w - 8, 2);
    },
  };

  function drawFloors(ctx) {
    R(ctx, '#2a2636', 0, 0, 640, 360);
    // paredes (cara visible)
    const wall = (r, c, c2) => { R(ctx, c, r.x, r.y - 34, r.w, 34); R(ctx, c2, r.x, r.y - 5, r.w, 5); R(ctx, 'rgba(255,255,255,.14)', r.x, r.y - 34, r.w, 2); };
    wall(FLOORS.cocina, '#bfded6', '#8fb5ac'); wall(FLOORS.sala, '#ecd8b4', '#c9ae82');
    wall(FLOORS.cuarto, '#c4d3ea', '#93a8c9'); wall(FLOORS.pasillo, '#e9dfcc', '#c2b497'); wall(FLOORS.xroom, '#dccbf0', '#ad96d0');
    // azulejos de cocina
    let r = FLOORS.cocina;
    for (let y = 0; y < r.h; y += 16) for (let x = 0; x < r.w; x += 16) R(ctx, ((x + y) >> 4) & 1 ? '#e9eef0' : '#cfdadf', r.x + x, r.y + y, Math.min(16, r.w - x), Math.min(16, r.h - y));
    for (let x = 0; x < r.w; x += 12) R(ctx, 'rgba(255,255,255,.25)', r.x + x, r.y - 30, 1, 24);
    // madera
    const wood = (r, a, b) => { R(ctx, a, r.x, r.y, r.w, r.h); for (let y = 0; y < r.h; y += 12) { R(ctx, b, r.x, r.y + y, r.w, 1); for (let x = (y / 12) % 2 ? 20 : 50; x < r.w; x += 64) R(ctx, b, r.x + x, r.y + y, 1, Math.min(12, r.h - y)); } };
    wood(FLOORS.sala, '#c99b66', '#b3854f'); wood(FLOORS.pasillo, '#d9b98b', '#c4a272');
    // alfombras
    const carpet = (r, a, b) => { R(ctx, a, r.x, r.y, r.w, r.h); for (let y = 4; y < r.h; y += 8) for (let x = (y % 16 ? 4 : 8); x < r.w; x += 8) R(ctx, b, r.x + x, r.y + y, 1, 1); };
    carpet(FLOORS.cuarto, '#8ea5c8', '#7d95ba'); carpet(FLOORS.xroom, '#bba6de', '#a892cf');
    // alfombra de la sala
    R(ctx, '#a8463f', 372, 78, 112, 78); R(ctx, '#c9625a', 376, 82, 104, 70); R(ctx, '#a8463f', 384, 90, 88, 54);
    // pasos entre habitaciones
    R(ctx, '#d9b98b', 196, 96, 20, 44); R(ctx, '#d9b98b', 300, 170, 52, 50); R(ctx, '#cfdadf', 84, 170, 44, 50); R(ctx, '#d9b98b', 196, 268, 20, 44); R(ctx, '#d9b98b', 436, 268, 20, 44);
    [[300, 170, 50], [351, 170, 50], [84, 170, 50], [127, 170, 50]].forEach(([x, y, h]) => R(ctx, 'rgba(0,0,0,.25)', x, y, 1, h));
    // puerta principal (pared del pasillo)
    R(ctx, '#5b3b2a', 234, 186, 36, 34); R(ctx, '#8a5a3a', 237, 189, 30, 31); R(ctx, '#74492f', 240, 192, 24, 12); R(ctx, '#f2c230', 261, 206, 3, 3);
    R(ctx, '#8d7a5c', 236, 222, 32, 8); R(ctx, '#a8946f', 238, 224, 28, 4);
    // ventana de la sala
    R(ctx, '#5b4636', 548, 18, 44, 24); R(ctx, G.S && G.S.phase !== 'collect' ? '#1b2145' : '#f0a868', 550, 20, 40, 20); R(ctx, '#5b4636', 569, 20, 2, 20);
    if (G.S && G.S.phase !== 'collect') { R(ctx, '#fdfdf5', 556, 24, 1, 1); R(ctx, '#fdfdf5', 580, 30, 1, 1); R(ctx, '#f4eec0', 582, 23, 4, 4); }
    // cuadro y reloj
    R(ctx, '#5b4636', 306, 20, 22, 18); R(ctx, '#7fd3ff', 308, 22, 18, 14); R(ctx, '#58b56a', 308, 31, 18, 5); R(ctx, '#ffd23f', 319, 24, 4, 4);
    R(ctx, '#f4f4f8', 132, 20, 14, 14); R(ctx, '#2f3138', 138, 22, 1, 6); R(ctx, '#2f3138', 138, 27, 4, 1);
    // puerta del cuarto de Ximena
    if (!World.xDoorOpen) { R(ctx, '#6d43ad', 438, 262, 14, 52); R(ctx, '#8f5fd6', 440, 264, 10, 48); R(ctx, '#f2c230', 441, 290, 2, 3); }
    else R(ctx, '#8f5fd6', 440, 256, 10, 10);
    // escondite
    R(ctx, 'rgba(255,255,255,.35)', 378, 236, 48, 14);
  }

  let floorCache = null, floorKey = '';
  function floorLayer() {
    const key = (G.S ? G.S.phase : '') + '|' + World.xDoorOpen + '|' + (G.S && G.S.flags.tvOn);
    if (!floorCache || key !== floorKey) {
      floorCache = floorCache || document.createElement('canvas'); floorCache.width = 640; floorCache.height = 360;
      drawFloors(floorCache.getContext('2d')); floorKey = key;
    }
    return floorCache;
  }

  // decoraciones colgadas (progreso visual de la fiesta)
  function drawWallDeco(ctx, t, hiddenSet) {
    const S = G.S; if (!S) return;
    S.deco.forEach((d) => {
      if (!d.placed || (hiddenSet && hiddenSet.has('deco' + d.i))) return;
      const sp = DECO_SPOTS[d.i];
      if (sp.kind === 'guirnalda') {
        const x0 = sp.x - 40, cols = d.improv ? ['#fdfdf5', '#f4efe2'] : ['#e23b4e', '#ffd23f', '#3fa0f0', '#58c46a', '#b48cf0'];
        for (let i = 0; i < 80; i++) R(ctx, '#6b5a4a', x0 + i, 20 + Math.round(Math.sin((i / 80) * Math.PI) * 6), 1, 1);
        for (let i = 0; i < 8; i++) { const x = x0 + 4 + i * 9.5, y = 21 + Math.round(Math.sin(((x - x0) / 80) * Math.PI) * 6); ctx.fillStyle = cols[i % cols.length]; if (d.improv) ctx.fillRect(x, y, 5, 12 + (i % 3) * 3); else { ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 8, y); ctx.lineTo(x + 4, y + 9); ctx.fill(); } }
      } else if (sp.kind === 'luces') {
        const x0 = d.i === 4 ? 214 : 420, cols = d.improv ? ['#ffe14a', '#ff8ad6', '#7fd3ff'] : ['#ff4f6a', '#ffd23f', '#4fd0ff', '#7dff8a', '#ff8ad6'];
        for (let i = 0; i < 206; i++) R(ctx, '#2f5a3c', x0 + i, 44 + Math.round(Math.sin(i / 11) * 2), 1, 1);
        for (let i = 0; i < 17; i++) { const on = d.improv || Math.floor(t * 2 + i) % 3 !== 0; const x = x0 + 4 + i * 12, y = 45 + Math.round(Math.sin((x - x0) / 11) * 2); R(ctx, on ? cols[i % cols.length] : '#5a5560', x, y, d.improv ? 5 : 3, d.improv ? 5 : 4); if (on && !d.improv) R(ctx, 'rgba(255,255,255,.25)', x - 1, y - 1, 5, 6); }
      }
    });
  }
  function balloonEntity(d, t) {
    const sp = DECO_SPOTS[d.i], x = sp.x - 14, y = sp.y - 4;
    return {
      sortY: y, draw(ctx) {
        const cols = d.improv ? ['#fdfdf5', '#f4efe2', '#fdfdf5'] : ['#e23b4e', '#ffd23f', '#3fa0f0'];
        R(ctx, '#6f6a78', x - 3, y - 4, 7, 4);
        [[-8, -34], [0, -42], [8, -33]].forEach(([dx, dy], i) => {
          const sw = Math.round(Math.sin(t * 1.5 + i * 2 + d.i) * 1.5);
          ctx.strokeStyle = '#8a8a99'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x + 0.5, y - 4); ctx.lineTo(x + dx + sw + 0.5, y + dy + 8); ctx.stroke();
          ctx.fillStyle = '#2b1d24'; ctx.beginPath(); ctx.ellipse(x + dx + sw, y + dy, 8, 9, 0, 0, 6.3); ctx.fill();
          ctx.fillStyle = cols[i]; ctx.beginPath(); ctx.ellipse(x + dx + sw, y + dy, 7, 8, 0, 0, 6.3); ctx.fill();
          R(ctx, 'rgba(255,255,255,.55)', x + dx + sw - 4, y + dy - 5, 2, 3);
        });
      },
    };
  }

  const dark = document.createElement('canvas'); dark.width = 640; dark.height = 360;

  /* Dibuja el mundo completo.
     opts: { actors, things:[{sortY,draw}], floorItems:[{id,x,y}], darkness:0..1, lights:[{x,y,r}],
             under(ctx), over(ctx), hidden:Set } */
  World.render = function (ctx, opts) {
    const t = performance.now() / 1000, S = G.S;
    ctx.drawImage(floorLayer(), 0, 0);
    drawWallDeco(ctx, t, opts.hidden);
    if (opts.under) opts.under(ctx, t);

    const list = [];
    FURN.forEach((f) => list.push({ sortY: f.y + f.h, draw: (c) => {
      const w = World.wiggle[f.id];
      if (w > 0) { c.save(); c.translate(Math.round(Math.sin(t * 50) * 1.5), 0); FURN_DRAW[f.id](c, f); c.restore(); }
      else FURN_DRAW[f.id](c, f);
    } }));
    // objetos de fiesta sobre los muebles
    if (S && S.phase !== 'collect' && S.phase !== 'title') {
      const pt = furn('ptable'), ct = furn('ctable'), hid = opts.hidden;
      const on = (id, x, y, sy, key) => { if (S.inv[id] && !(hid && hid.has(key || id))) list.push({ sortY: sy + 0.5, draw: (c) => c.drawImage(Sp.item(id), x, y) }); };
      on('pastel', pt.x + 26, pt.y - pt.tall - 22, pt.y + pt.h); on('bocaditos', pt.x + 2, pt.y - pt.tall - 16, pt.y + pt.h); on('bebidas', pt.x + 54, pt.y - pt.tall - 20, pt.y + pt.h);
      on('regalo', ct.x + 8, ct.y - ct.tall - 22, ct.y + ct.h); on('parlante', 468, 34, 62);
      S.deco.forEach((d) => { if (d.placed && DECO_SPOTS[d.i].kind === 'globos' && !(hid && hid.has('deco' + d.i))) list.push(balloonEntity(d, t)); });
    }
    (opts.floorItems || []).forEach((it) => list.push({ sortY: it.y, draw: (c) => {
      c.fillStyle = 'rgba(0,0,0,.2)'; c.beginPath(); c.ellipse(it.x, it.y, 10, 3, 0, 0, 6.3); c.fill();
      c.drawImage(Sp.item(it.id), Math.round(it.x - 16), Math.round(it.y - 28 + (it.bob ? Math.sin(t * 4 + it.x) * 1.5 : 0)));
    } }));
    (opts.things || []).forEach((o) => list.push(o));
    (opts.actors || []).forEach((a) => list.push(a));
    list.sort((a, b) => a.sortY - b.sortY);
    for (const o of list) o.draw(ctx);

    // oscuridad con luces
    const dk = opts.darkness || 0;
    if (dk > 0) {
      const d = dark.getContext('2d');
      d.globalCompositeOperation = 'source-over'; d.clearRect(0, 0, 640, 360);
      d.fillStyle = `rgba(14,16,48,${dk})`; d.fillRect(0, 0, 640, 360);
      d.globalCompositeOperation = 'destination-out';
      (opts.lights || []).forEach((l) => { const g = d.createRadialGradient(l.x, l.y, l.r * 0.55, l.x, l.y, l.r); g.addColorStop(0, `rgba(0,0,0,${l.a || 0.9})`); g.addColorStop(1, 'rgba(0,0,0,0)'); d.fillStyle = g; d.beginPath(); d.arc(l.x, l.y, l.r, 0, 6.3); d.fill(); });
      ctx.drawImage(dark, 0, 0);
    }
    if (opts.over) opts.over(ctx, t);
    // globos de diálogo
    (opts.actors || []).forEach((a) => { if (a.bubble && !a.hidden) G.bubble(ctx, a.bubble.text, a.x, a.y - 66); });
  };

  // ---------- Texto en canvas ----------
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
    let bx = Math.max(4, Math.min(636 - w, x - w / 2)), by = Math.max(4, y - h);
    ctx.fillStyle = '#1c1826'; ctx.beginPath(); ctx.roundRect(bx - 1, by - 1, w + 2, h + 2, 6); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.roundRect(bx, by, w, h, 5); ctx.fill();
    ctx.beginPath(); ctx.moveTo(x - 4, by + h - 1); ctx.lineTo(x + 4, by + h - 1); ctx.lineTo(x, by + h + 5); ctx.fill();
    ctx.fillStyle = '#1c1826'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    lines.forEach((l, i) => ctx.fillText(l, bx + 6, by + 9 + i * 10));
  };
  // indicador "ESPACIO" sobre un punto
  G.prompt = function (ctx, label, x, y) {
    ctx.font = `bold 7px ${G.FONT}`;
    const w = ctx.measureText(label).width + 10;
    ctx.fillStyle = '#1c1826'; ctx.beginPath(); ctx.roundRect(x - w / 2, y - 7, w, 13, 4); ctx.fill();
    ctx.fillStyle = '#ffd23f'; ctx.beginPath(); ctx.roundRect(x - w / 2 + 1, y - 6, w - 2, 10, 3); ctx.fill();
    ctx.fillStyle = '#1c1826'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(label, x, y - 0.5);
  };
})();
