/* ============================================================
   ESCENAS: recolección (Acto 0), casa (cinemáticas y ambiente)
   y los tres minijuegos del vertical slice.
   Cada escena expone update(dt) y draw(ctx).
   ============================================================ */
(function () {
  'use strict';
  const G = window.G, W = G.World, Actor = G.Actor, Sp = G.Sprites;
  const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
  const speedOf = (id) => 50 + G.CHARS[id].stats.velocidad * 6;
  const shuffle = (a) => { for (let i = a.length - 1; i > 0; i--) { const j = (Math.random() * (i + 1)) | 0; [a[i], a[j]] = [a[j], a[i]]; } return a; };

  function topBanner(ctx, title, timeLeft, sub) {
    ctx.fillStyle = 'rgba(28,24,38,.82)'; ctx.beginPath(); ctx.roundRect(220, 4, 200, sub ? 34 : 24, 8); ctx.fill();
    const urgent = timeLeft != null && timeLeft <= 10;
    G.text(ctx, title + (timeLeft != null ? '  ' + Math.max(0, Math.ceil(timeLeft)) + 's' : ''), 320, 16, { size: 12, color: urgent && Math.floor(timeLeft * 4) % 2 ? '#ff6b7a' : '#ffd23f', stroke: false });
    if (sub) G.text(ctx, sub, 320, 30, { size: 8, color: '#fff', stroke: false, bold: false });
  }
  function ring(ctx, x, y, r, color, t) {
    ctx.strokeStyle = color; ctx.lineWidth = 1.5; ctx.setLineDash([4, 3]); ctx.lineDashOffset = -t * 12;
    ctx.beginPath(); ctx.ellipse(x, y, r, r * 0.45, 0, 0, 6.3); ctx.stroke(); ctx.setLineDash([]);
  }

  // =========================================================
  // ACTO 0 — 1 MINUTO PARA LA FIESTA
  // =========================================================
  class CollectScene {
    constructor(playerId, done) {
      this.done = done; this.time = 60; this.count = 3.2; this.over = false;
      this.p = new Actor(playerId, 326, 300); this.p.carry = [];
      this.speed = 46 + G.CHARS[playerId].stats.velocidad * 6;
      const spots = shuffle(W.SPAWNS.slice());
      this.items = Object.keys(G.ITEMS).map((id, i) => ({ id, x: spots[i][0], y: spots[i][1], bob: true }));
      this.others = G.PLAYABLE.filter((c) => c !== playerId).map((id, i) => { const a = new Actor(id, 270 + i * 110, 262 + i * 6); a.dir = 'down'; return a; });
      this.cat = new Actor('pollito', 560, 140); this.cat.speed = 80; this.catWait = 7; this.catMoves = 0; this.catItem = null;
      this.cheer = 4; this.stashed = 0; this.msg = null;
    }
    slotsUsed() { return this.p.carry.reduce((n, id) => n + G.ITEMS[id].slots, 0); }
    update(dt) {
      const p = this.p; p.update(dt); this.others.forEach((o) => o.update(dt)); this.cat.update(dt);
      if (this.msg && (this.msg.t -= dt) <= 0) this.msg = null;
      if (this.count > 0) { this.count -= dt; G.input.flush(); return; }
      if (this.over) return;
      this.time -= dt;
      // movimiento
      const ax = G.input.axis();
      let sp = this.speed;
      const heavy = p.carry.some((id) => G.ITEMS[id].slots === 2);
      if (heavy && p.id !== 'alan') sp *= 0.62; else if (p.carry.length === 2) sp *= 0.85;
      p.walk(ax.x, ax.y, sp, dt);
      // interacción
      this.near = null; this.nearStash = dist(p, W.STASH) < 34 && p.carry.length > 0;
      if (!this.nearStash) { let best = 28; this.items.forEach((it) => { const d = dist(p, it); if (d < best) { best = d; this.near = it; } }); }
      if (G.input.hit('action')) {
        if (this.nearStash) {
          p.carry.forEach((id) => { G.S.inv[id] = true; this.stashed++; });
          this.msg = { text: '¡Guardado! ' + p.carry.map((id) => G.ITEMS[id].name).join(' + '), t: 1.6 };
          p.carry = []; G.sfx('ok'); G.ui.refreshInv();
        } else if (this.near) {
          const need = G.ITEMS[this.near.id].slots;
          if (this.slotsUsed() + need <= 2) {
            p.carry.push(this.near.id); this.items.splice(this.items.indexOf(this.near), 1);
            if (this.catItem === this.near) this.catItem = null;
            this.msg = { text: G.ITEMS[this.near.id].name + (need === 2 ? ' (pesado)' : ''), t: 1.2 }; G.sfx('pick');
          } else { this.msg = { text: '¡Manos llenas! Guarda en el armario del pasillo', t: 1.6 }; G.sfx('bad'); }
        }
      }
      // Pollito: fuerza del caos, cambia objetos de lugar
      const cat = this.cat; cat.follow(dt);
      if (this.catItem && cat.arrived) {
        const it = this.catItem; this.catItem = null;
        if (this.items.includes(it)) {
          const free = W.SPAWNS.filter((s) => !this.items.some((o) => Math.hypot(o.x - s[0], o.y - s[1]) < 20) && Math.hypot(p.x - s[0], p.y - s[1]) > 120);
          if (free.length) { const s = free[(Math.random() * free.length) | 0]; it.x = s[0]; it.y = s[1]; G.S.flags.pollitoJugo = it.id; this.msg = { text: `¡Pollito se llevó ${G.ITEMS[it.id].name.toLowerCase()} a otro lado!`, t: 2.2 }; G.sfx('meow'); cat.goTo(s[0] + 14, s[1], 150); }
        }
      }
      if ((this.catWait -= dt) <= 0 && cat.arrived && !this.catItem) {
        this.catWait = 9 + Math.random() * 5;
        if (this.catMoves < 3 && this.items.length) { this.catItem = this.items[(Math.random() * this.items.length) | 0]; cat.goTo(this.catItem.x + 8, this.catItem.y, 95); this.catMoves++; }
        else { const r = ['sala', 'cocina', 'cuarto'][(Math.random() * 3) | 0]; const pt = W.randomFreePoint(r); cat.goTo(pt[0], pt[1], 70); }
      }
      if ((this.cheer -= dt) <= 0) {
        this.cheer = 6 + Math.random() * 4;
        const o = this.others[(Math.random() * 2) | 0];
        const lines = this.time < 15 ? ['¡YA VIENE!', '¡Escucho el ascensor!', '¡Guarda lo que tengas!'] : ['¡Apúrate!', '¡El pastel, el pastel!', 'Yo vigilo la puerta.', '¡No te olvides de guardar!', '¿Dónde quedaron los globos?'];
        o.say(lines[(Math.random() * lines.length) | 0], 2.2);
      }
      if (this.time <= 0) { this.over = true; p.moving = false; G.sfx('bell'); setTimeout(() => this.done({ inHand: p.carry.slice(), stashed: this.stashed }), 900); }
    }
    draw(ctx) {
      const p = this.p, t = performance.now() / 1000;
      W.render(ctx, {
        actors: [p, this.cat, ...this.others], floorItems: this.items,
        under: (c) => { ring(c, W.STASH.x, W.STASH.y + 2, 26, p.carry.length ? '#7dff8a' : 'rgba(255,255,255,.5)', t); },
        over: (c) => {
          G.text(c, 'ARMARIO', W.STASH.x, 172, { size: 8, color: '#7dff8a' });
          if (this.count <= 0 && !this.over) {
            if (this.nearStash) G.prompt(c, 'ESPACIO: guardar', p.x, p.y - 84);
            else if (this.near) G.prompt(c, 'ESPACIO: ' + G.ITEMS[this.near.id].name, this.near.x, this.near.y - 34);
          }
          if (this.msg) G.text(c, this.msg.text, 320, 338, { size: 10, color: '#fff' });
          topBanner(c, '⏱ XIMENA LLEGA EN', this.time, `Manos: ${this.slotsUsed()}/2  ·  Guardados: ${this.stashed}/10`);
          if (this.count > 0) {
            c.fillStyle = 'rgba(20,16,30,.55)'; c.fillRect(0, 0, 640, 360);
            const n = Math.ceil(this.count - 0.2);
            G.text(c, n > 0 ? String(n) : '¡YA!', 320, 170, { size: 64, color: '#ffd23f', lw: 8 });
            G.text(c, 'Recoge objetos (ESPACIO) y guárdalos en el ARMARIO del pasillo', 320, 230, { size: 11 });
            G.text(c, 'Moverse: WASD o flechas  ·  Sólo puedes cargar 2 espacios a la vez', 320, 248, { size: 9, bold: false });
          }
          if (this.over) { c.fillStyle = 'rgba(20,16,30,.5)'; c.fillRect(0, 0, 640, 360); G.text(c, '¡LLEGÓ XIMENA!', 320, 170, { size: 40, color: '#ff6b7a', lw: 7 }); }
        },
      });
    }
  }

  // =========================================================
  // CASA — ambiente del chat, llegada de Ximena y revelación
  // =========================================================
  class HomeScene {
    constructor() {
      this.roomies = G.PLAYABLE.map((id, i) => new Actor(id, 300 + i * 90, 150 + (i % 2) * 14));
      this.cat = new Actor('pollito', 590, 150); this.cat.speed = 60;
      this.xi = new Actor('ximena', 253, 232); this.xi.hidden = true; this.xi.speed = 42;
      this.xState = 'away'; // away | up | sleeping
      this.darkness = 0; this.targetDark = 0; this.wander = false; this.confetti = null; this.wt = [1, 2.5, 4]; this.catT = 3; this.title = null;
    }
    actor(id) { return id === 'ximena' ? this.xi : id === 'pollito' ? this.cat : this.roomies.find((r) => r.id === id); }
    update(dt) {
      this.darkness += Math.sign(this.targetDark - this.darkness) * Math.min(Math.abs(this.targetDark - this.darkness), dt * 0.9);
      this.roomies.forEach((r, i) => {
        r.update(dt);
        if (r.route && r.route.length) { r.follow(dt); return; }
        if (!this.wander) return;
        if ((this.wt[i] -= dt) <= 0) { this.wt[i] = 3 + Math.random() * 5; const pt = W.randomFreePoint(Math.random() < 0.75 ? 'sala' : 'cocina'); r.goTo(pt[0], pt[1], 38); }
      });
      this.cat.update(dt); this.cat.follow(dt);
      if (this.wander && (this.catT -= dt) <= 0 && this.cat.arrived) { this.catT = 4 + Math.random() * 6; const pt = W.randomFreePoint(['sala', 'cocina', 'pasillo'][(Math.random() * 3) | 0]); this.cat.goTo(pt[0], pt[1], 55); }
      this.xi.update(dt); this.xi.follow(dt);
      if (this.confetti) this.confetti.forEach((p) => { p.vy += 60 * dt; p.x += p.vx * dt; p.y += p.vy * dt; if (p.y > 370) { p.y = -10; p.vy = 20 + Math.random() * 40; p.x = Math.random() * 640; } });
      if (this.title && (this.title.t -= dt) <= 0) this.title = null;
    }
    startConfetti() {
      const cols = ['#e23b4e', '#ffd23f', '#3fa0f0', '#58c46a', '#b48cf0', '#f08cc0'];
      this.confetti = Array.from({ length: 140 }, () => ({ x: 212 + Math.random() * 416, y: Math.random() * 160, vx: -30 + Math.random() * 60, vy: -80 + Math.random() * 120, c: cols[(Math.random() * 6) | 0], s: 2 + ((Math.random() * 3) | 0) }));
    }
    draw(ctx) {
      const t = performance.now() / 1000, bed = W.furn('xbed');
      const things = [];
      if (this.xState === 'sleeping') things.push({ sortY: bed.y + bed.h + 1, draw: (c) => {
        const bx = bed.x + 29, by = bed.y - bed.tall;
        c.save(); c.beginPath(); c.rect(bx - 32, by - 22, 64, 40); c.clip();
        c.drawImage(Sp.char('ximena', 'down', 0, 'sleep'), bx - 32, by - 20); c.restore();
        c.fillStyle = '#9a72dc'; c.fillRect(bed.x, by + 18, bed.w, 3); c.fillStyle = '#b48cf0'; c.fillRect(bed.x, by + 21, bed.w, 50);
        c.fillStyle = '#c9a9f7'; c.beginPath(); c.ellipse(bx, by + 40, 18, 16, 0, 0, 6.3); c.fill();
        const sl = G.S ? G.S.sleep : 0;
        for (let i = 0; i < 3; i++) { const k = (t * 0.6 + i / 3) % 1; G.text(c, sl >= 4 ? '!' : sl >= 3 ? '~' : 'z', bx + 16 + k * 14, by - 8 - k * 26, { size: 7 + k * 6, color: sl >= 3 ? '#ffb86b' : '#fff' }); }
      } });
      const lights = [];
      if (this.darkness > 0.4) this.roomies.forEach((r) => lights.push({ x: r.x, y: r.y - 24, r: 46, a: 0.75 }));
      W.render(ctx, {
        actors: [...this.roomies, this.cat, this.xi], things, darkness: this.darkness, lights,
        over: (c) => {
          if (this.confetti) this.confetti.forEach((p) => { c.fillStyle = p.c; c.fillRect(p.x | 0, p.y | 0, p.s, p.s); });
          if (this.title) { const a = Math.min(1, this.title.t, (this.title.d - this.title.t) * 2); c.globalAlpha = Math.max(0, a); c.fillStyle = 'rgba(20,16,30,.7)'; c.fillRect(0, 140, 640, 80); G.text(c, this.title.a, 320, 168, { size: 12, color: '#ffd23f' }); G.text(c, this.title.b, 320, 192, { size: 24, lw: 5 }); c.globalAlpha = 1; }
        },
      });
    }
    showTitle(a, b, d) { this.title = { a, b, t: d || 3.5, d: d || 3.5 }; }
  }

  // =========================================================
  // MINIJUEGO — DECORACIÓN EXPRESS
  // =========================================================
  class DecoScene {
    constructor(who, done) {
      this.done = done; this.time = 28; this.over = false; this.misses = 0; this.placed = 0;
      this.p = new Actor(who, 300, 150); this.speed = speedOf(who);
      this.zone = 0.17 + G.CHARS[who].stats.logica * 0.012 + (G.S.inv.herramientas ? 0.07 : 0);
      this.q = null; this.cool = 0; this.msg = null;
      this.cat = new Actor('pollito', 590, 150);
    }
    update(dt) {
      const p = this.p; p.update(dt); this.cat.update(dt);
      if (this.msg && (this.msg.t -= dt) <= 0) this.msg = null;
      if (this.over) return;
      this.time -= dt; this.cool -= dt;
      const todo = G.S.deco.filter((d) => !d.placed);
      if (this.q) {
        this.q.t += dt; this.q.pos = 0.5 + 0.5 * Math.sin(this.q.t * this.q.sp);
        if (G.input.hit('action')) {
          if (Math.abs(this.q.pos - this.q.c) <= this.zone / 2) { this.q.d.placed = true; this.placed++; this.msg = { text: '¡Perfecto!', t: 1, c: '#7dff8a' }; G.sfx('ok'); }
          else { this.misses++; this.msg = { text: '¡Se cayó! (+ruido)', t: 1.2, c: '#ff6b7a' }; G.sfx('bad'); G.addNoise(6); }
          this.q = null; this.cool = 0.35; p.frameOverride = null;
        }
      } else {
        const ax = G.input.axis(); p.walk(ax.x, ax.y, this.speed, dt);
        this.near = todo.find((d) => dist(p, W.DECO_SPOTS[d.i]) < 24);
        if (G.input.hit('action') && this.near && this.cool <= 0) { this.q = { d: this.near, t: Math.random() * 3, sp: 4.2 + Math.random() * 1.6, c: 0.25 + Math.random() * 0.5, pos: 0 }; p.frameOverride = 3; p.dir = 'up'; p.moving = false; }
      }
      if (this.time <= 0 || !todo.length) { this.over = true; p.frameOverride = null; setTimeout(() => this.done({ placed: this.placed, misses: this.misses, total: G.S.deco.length }), 1100); }
    }
    draw(ctx) {
      const p = this.p, t = performance.now() / 1000;
      W.render(ctx, {
        actors: [p, this.cat],
        under: (c) => G.S.deco.forEach((d) => { if (!d.placed) { const s = W.DECO_SPOTS[d.i]; ring(c, s.x, s.y, 16, '#ffd23f', t); } }),
        over: (c) => {
          G.S.deco.forEach((d) => { if (!d.placed) { const s = W.DECO_SPOTS[d.i]; c.globalAlpha = 0.9; c.drawImage(Sp.item(d.improv ? 'cartel' : s.kind), s.x - 16, s.y - 52 + Math.sin(t * 4 + d.i) * 2); c.globalAlpha = 1; } });
          if (this.q) {
            const x = p.x - 40, y = p.y - 84;
            c.fillStyle = '#1c1826'; c.beginPath(); c.roundRect(x - 2, y - 2, 84, 14, 4); c.fill();
            c.fillStyle = '#4a4458'; c.fillRect(x, y, 80, 10);
            c.fillStyle = '#58c46a'; c.fillRect(x + (this.q.c - this.zone / 2) * 80, y, this.zone * 80, 10);
            c.fillStyle = '#fff'; c.fillRect(x + this.q.pos * 78, y - 2, 3, 14);
            G.prompt(c, 'ESPACIO en verde', p.x, y - 10);
          } else if (this.near && !this.over) G.prompt(c, 'ESPACIO: colgar', p.x, p.y - 70);
          if (this.msg) G.text(c, this.msg.text, 320, 338, { size: 11, color: this.msg.c });
          topBanner(c, 'DECORACIÓN EXPRESS', this.time, `Zonas: ${G.S.deco.filter((d) => d.placed).length}/${G.S.deco.length}`);
        },
      });
    }
  }

  // =========================================================
  // MINIJUEGO — ESCONDE TODO (El vaso de agua)
  // =========================================================
  class HideScene {
    constructor(who, done) {
      this.done = done; this.over = false; this.count = 4.5;
      this.p = new Actor(who, 300, 150); this.speed = speedOf(who);
      this.hideTime = who === 'itzel' ? 0.35 : 0.75;
      const S = G.S, ev = [{ key: 'bolsas', icon: 'bolsas', x: 150, y: 152 }, { key: 'cartel', icon: 'cartel', x: 262, y: 152 }];
      if (S.flags.cajas === 'pasillo') ev.push({ key: 'cajas', icon: 'cajas', x: 300, y: 306 });
      S.deco.forEach((d) => { if (d.placed) { const s = W.DECO_SPOTS[d.i]; ev.push({ key: 'deco' + d.i, icon: d.improv ? 'cartel' : s.kind, x: s.x, y: s.y, deco: true }); } });
      if (S.inv.regalo) ev.push({ key: 'regalo', icon: 'regalo', x: 428, y: 108, deco: true });
      this.ev = ev.map((e) => ({ ...e, hidden: false, seen: false, prog: 0 }));
      this.xi = new Actor('ximena', 590, 290); this.xi.hidden = true; this.xi.speed = 40; this.xi.expr = 'tired';
      this.stage = 0; this.pause = 0; this.seenPlayer = false; this.msg = null; this.hiddenSet = new Set();
      W.xDoorOpen = false;
    }
    update(dt) {
      const p = this.p, xi = this.xi; p.update(dt); xi.update(dt);
      if (this.msg && (this.msg.t -= dt) <= 0) this.msg = null;
      if (this.over) return;
      // jugador
      const ax = G.input.axis(); p.walk(ax.x, ax.y, this.speed, dt);
      this.near = null; let best = 26;
      this.ev.forEach((e) => { if (!e.hidden && !e.seen) { const d = dist(p, e); if (d < best) { best = d; this.near = e; } } });
      this.ev.forEach((e) => { if (e !== this.near) e.prog = 0; });
      if (this.near && G.input.held('action')) {
        this.near.prog += dt / this.hideTime; p.frameOverride = 3;
        if (this.near.prog >= 1) { this.near.hidden = true; this.hiddenSet.add(this.near.key); G.sfx('pick'); this.near = null; }
      } else p.frameOverride = null;
      // Ximena
      if (this.count > 0) {
        this.count -= dt;
        if (this.count <= 0) { W.xDoorOpen = true; xi.hidden = false; xi.x = 458; xi.y = 292; this.route = [[326, 292], [326, 196], [326, 108], [216, 118], [130, 86]]; xi.route = this.route.map((r) => r.slice()); xi.speed = 40; this.stage = 1; G.sfx('door'); }
        return;
      }
      if (this.pause > 0) { this.pause -= dt; xi.moving = false; }
      else xi.follow(dt);
      if (this.stage === 1 && xi.arrived) { this.stage = 2; this.pause = 2.6; xi.dir = 'up'; xi.say('*glu glu glu*', 2.2); }
      else if (this.stage === 2 && this.pause <= 0) { this.stage = 3; xi.route = [[216, 118], [326, 108], [326, 196], [326, 292], [458, 292]]; }
      else if (this.stage === 3 && xi.arrived) { this.finish(); return; }
      const xr = W.roomAt(xi.x, xi.y);
      this.ev.forEach((e) => {
        if (e.hidden || e.seen) return;
        if (Math.hypot(xi.x - e.x, xi.y - 4 - e.y) < 76 && (W.roomAt(e.x, e.y) === xr)) { e.seen = true; this.pause = 1.3; xi.expr = 'suspicious'; xi.say('¿…mm? ¿Y eso?', 1.6); G.sfx('bad'); G.addSus(10); setTimeout(() => (xi.expr = 'tired'), 1500); }
      });
      if (!this.seenPlayer && dist(xi, p) < 54 && W.roomAt(p.x, p.y) === xr) { this.seenPlayer = true; this.pause = 1.2; xi.say(`¿${G.CHARS[p.id].name}? ¿Qué haces despierto…?`, 1.8); G.addSus(4); G.sfx('bad'); }
    }
    finish() {
      this.over = true; this.xi.hidden = true; W.xDoorOpen = false; G.sfx('door');
      const seen = this.ev.filter((e) => e.seen).length;
      setTimeout(() => this.done({ seen, total: this.ev.length, seenPlayer: this.seenPlayer }), 900);
    }
    draw(ctx) {
      const p = this.p, xi = this.xi, t = performance.now() / 1000;
      const things = this.ev.filter((e) => !e.deco || e.hidden).map((e) => ({ sortY: e.y - 1, draw: (c) => c.drawImage(Sp.item(e.hidden ? 'manta' : e.icon), e.x - 16, e.y - 26) }));
      const lights = [{ x: p.x, y: p.y - 20, r: 60, a: 0.7 }];
      if (!xi.hidden) lights.push({ x: xi.x, y: xi.y - 10, r: 84, a: 0.95 });
      W.render(ctx, {
        actors: [p, xi], things, hidden: this.hiddenSet, darkness: 0.5, lights,
        under: (c) => { if (!xi.hidden) { c.fillStyle = 'rgba(255,240,170,.16)'; c.beginPath(); c.arc(xi.x, xi.y - 4, 76, 0, 6.3); c.fill(); c.beginPath(); c.lineWidth = 1.5; c.setLineDash([5, 4]); c.lineDashOffset = -t * 10; c.strokeStyle = 'rgba(255,230,120,.9)'; c.arc(xi.x, xi.y - 4, 76, 0, 6.3); c.stroke(); c.setLineDash([]); } },
        over: (c) => {
          this.ev.forEach((e) => {
            if (e.hidden) return;
            const col = e.seen ? '#ff6b7a' : '#ffd23f';
            ring(c, e.x, e.y, 14, col, t);
            G.text(c, e.seen ? '✖' : '!', e.x, e.y - (e.deco ? 34 : 36) + Math.sin(t * 6) * 1.5, { size: 11, color: col });
            if (e.prog > 0) { c.fillStyle = '#1c1826'; c.fillRect(e.x - 15, e.y + 6, 30, 5); c.fillStyle = '#7dff8a'; c.fillRect(e.x - 14, e.y + 7, 28 * Math.min(1, e.prog), 3); }
          });
          if (this.near && !this.over && this.near.prog === 0) G.prompt(c, 'Mantén ESPACIO', this.near.x, this.near.y - 48);
          const left = this.ev.filter((e) => !e.hidden && !e.seen).length;
          topBanner(c, this.count > 0 ? '🚪 XIMENA SE LEVANTA EN' : 'ESCONDE TODO', this.count > 0 ? this.count : null, `Evidencias a la vista: ${left}  ·  Vistas: ${this.ev.filter((e) => e.seen).length}`);
        },
      });
    }
  }

  // =========================================================
  // MINIJUEGO — POLLITO ROBÓ EL REGALO
  // =========================================================
  class PollitoScene {
    constructor(who, done) {
      this.done = done; this.over = false; this.time = 40; this.misses = 0; this.catches = 0;
      this.need = G.S.inv.premios ? 1 : 3;
      this.p = new Actor(who, 326, 290); this.speed = speedOf(who);
      this.cat = new Actor('pollito', 0, 0); this.cat.hidden = true; this.cat.carry = null;
      this.target = G.pollitoTarget(G.S);
      this.spot = this.pickSpot(); this.wig = 1.2; this.move = G.S.flags.pollitoOfendido ? 7 : 10; this.cool = 0; this.msg = null; this.running = false;
    }
    pickSpot(far) {
      const c = W.HIDEOUTS.filter((h) => h !== this.spot && dist(h, this.p) > (far ? 170 : 110));
      return c[(Math.random() * c.length) | 0];
    }
    update(dt) {
      const p = this.p, cat = this.cat; p.update(dt); cat.update(dt);
      for (const k in W.wiggle) if (W.wiggle[k] > 0) W.wiggle[k] -= dt;
      if (this.msg && (this.msg.t -= dt) <= 0) this.msg = null;
      if (this.over) return;
      this.time -= dt; this.cool -= dt;
      const ax = G.input.axis(); p.walk(ax.x, ax.y, this.speed, dt);
      if (this.running) {
        cat.follow(dt);
        if ((this.grace -= dt) <= 0 && dist(cat, p) < 18) { this.catch(true); return; }
        if (cat.arrived) { this.running = false; cat.hidden = true; W.wiggle[this.spot.f] = 0.5; this.wig = 2; this.move = G.S.flags.pollitoOfendido ? 7 : 10; }
      } else {
        if ((this.wig -= dt) <= 0) { this.wig = 2.1 + Math.random(); W.wiggle[this.spot.f] = 0.45; }
        if ((this.move -= dt) <= 0) { this.move = G.S.flags.pollitoOfendido ? 7 : 10; this.spot = this.pickSpot(); this.msg = { text: '…se escucha un "miau" en otro lado', t: 1.8, c: '#ffb86b' }; G.sfx('meow'); this.wig = 0.8; }
      }
      this.near = null; let best = 30;
      W.HIDEOUTS.forEach((h) => { const d = dist(p, h); if (d < best) { best = d; this.near = h; } });
      if (G.input.hit('action') && this.near && this.cool <= 0 && !this.running) {
        this.cool = 0.5;
        if (this.near === this.spot) this.catch(false);
        else { this.misses++; W.wiggle[this.near.f] = 0.3; this.msg = { text: 'Aquí no está… (+ruido)', t: 1.2, c: '#ff6b7a' }; G.sfx('bad'); G.addNoise(5); }
      }
      if (this.time <= 0) this.end(false);
    }
    catch(tackle) {
      this.catches++; G.sfx('meow');
      if (this.catches >= this.need) { this.cat.hidden = false; this.cat.x = this.p.x + 14; this.cat.y = this.p.y; this.cat.route = null; this.cat.moving = false; this.msg = { text: G.S.inv.premios && !tackle ? '¡Cambió el botín por atún!' : '¡ATRAPADO!', t: 2, c: '#7dff8a' }; G.sfx('ok'); this.end(true); return; }
      const f = W.furn(this.spot.f), from = tackle ? this.cat : { x: f.x + f.w / 2, y: f.y + f.h };
      this.spot = this.pickSpot(true); this.grace = 0.7;
      this.cat.hidden = false; this.cat.x = from.x; this.cat.y = from.y; this.cat.goTo(this.spot.x, this.spot.y, 185); this.running = true;
      this.msg = { text: `¡Ahí está! Se escapó (${this.catches}/${this.need})`, t: 1.6, c: '#ffd23f' };
    }
    end(win) { if (this.over) return; this.over = true; setTimeout(() => this.done({ caught: win, misses: this.misses, target: this.target }), 1300); }
    draw(ctx) {
      const p = this.p, t = performance.now() / 1000, cat = this.cat;
      W.render(ctx, {
        actors: [p, cat], darkness: 0.2,
        over: (c) => {
          if (!cat.hidden && this.running) c.drawImage(Sp.item(this.target.id), cat.x - 16, cat.y - 44);
          if (this.near && !this.over && !this.running) G.prompt(c, 'ESPACIO: revisar', this.near.x, this.near.y - 72);
          if (this.msg) G.text(c, this.msg.text, 320, 338, { size: 11, color: this.msg.c });
          topBanner(c, 'ATRAPA A POLLITO', this.time, `Atrapadas: ${this.catches}/${this.need}  ·  Fíjate qué mueble se mueve`);
        },
      });
    }
  }

  G.Scenes = { CollectScene, HomeScene, DecoScene, HideScene, PollitoScene };
})();
