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
      // TODOS los roomies están en el departamento durante la recolección
      // (diseño original retomado el 2026-11-14): los otros 6 son NPC
      // repartidos por las habitaciones, cada uno en la suya ('free').
      // Estados de un NPC: 'free' (vive el depa, se le puede cargar) →
      // 'carried' (al hombro del jugador) → 'waiting' (reclutado: espera
      // junto al armario y se queda para TODO el juego). Al bajarlo sin
      // reclutar vuelve a 'free' donde quedó.
      const npcRooms = ['cocina', 'sala', 'cuarto', 'pasillo', 'sala', 'cuarto'];
      this.others = G.PLAYABLE.filter((c) => c !== playerId).map((id, i) => {
        const room = npcRooms[i % npcRooms.length], pt = W.randomFreePoint(room);
        const a = new Actor(id, pt[0], pt[1]);
        a.state = 'free'; a.homeRoom = room; a.wt = 1 + i * 0.9; a.sprV = 0;
        return a;
      });
      this.carrying = null;          // NPC al hombro (Actor) o null
      this.partners = [];            // ids reclutados (máx. 3)
      // Puestos de espera junto al armario (la zona segura) para los ya
      // reclutados: visibles, en idle, viendo cómo crece el equipo.
      this.waitSpots = [[566, 398], [634, 398], [600, 434]];
      this.cat = new Actor('pollito', 880, 150); this.cat.speed = 110; this.catWait = 7; this.catMoves = 0; this.catItem = null;
      this.cheer = 4; this.stashed = 0; this.msg = null;
      this.cam = { x: 510, y: 0, z: 440, dist: 560, pitch: 0.78, fov: 34 };
    }
    slotsUsed() { return this.p.carry.reduce((n, id) => n + G.ITEMS[id].slots, 0); }
    // --- Partners: cargar al hombro, bajar y reclutar -------------------
    // CONVIVENCIA CARGA DE ROOMIE / ÍTEMS (regla original adaptada a la
    // v3.1): la capacidad total es 5 espacios = 3 del roomie al hombro +
    // 2 de las manos. Las manos siguen EXACTAMENTE como ya funcionaban
    // para ítems (máx. 2 espacios entre los dos, lo pesado frena); el
    // roomie al hombro NO frena (regla original) y NO bloquea las manos:
    // puedes recoger ítems mientras cargas a alguien y guardarlos en el
    // armario en viajes separados. Un solo roomie a la vez.
    pickUp(o) {
      const p = this.p;
      if (this.partners.length >= 3) { this.msg = { text: '¡Ya tienes a tus 3 partners! Los demás se quedan.', t: 1.6 }; p.emo('✖', 0.8); G.sfx('bad'); return; }
      this.carrying = o; o.state = 'carried'; o.carriedPose = true; o.route = null; o.expr = 'surprised'; o.sprV = 0;
      p.carryWalk = true;
      this.msg = { text: `¡${G.CHARS[o.id].name} al hombro! Llévalo al ARMARIO`, t: 1.8 }; p.hop(120); G.sfx('pick');
    }
    dropCarried() {
      const o = this.carrying, p = this.p; if (!o) return;
      this.carrying = null; p.carryWalk = false;
      o.state = 'free'; o.carriedPose = false; o.elev = 0; o.expr = null; o.jy = 0; o.jv = 0;
      const cands = [[p.x + 28, p.y], [p.x - 28, p.y], [p.x, p.y + 28], [p.x, p.y - 28], [p.x, p.y]];
      const spot = cands.find(([x, y]) => W.canStand(x, y)) || [p.x, p.y];
      o.x = spot[0]; o.y = spot[1]; o.homeRoom = W.roomAt(o.x, o.y) || o.homeRoom; o.wt = 1.5;
      this.msg = { text: `Bajaste a ${G.CHARS[o.id].name}`, t: 1.2 }; G.sfx('pick');
    }
    recruit(o) {
      const p = this.p; this.carrying = null; p.carryWalk = false;
      o.state = 'waiting'; o.carriedPose = false; o.elev = 0; o.jy = 0; o.jv = 0; o.expr = 'happy';
      o.x = p.x; o.y = p.y;
      const spot = this.waitSpots[this.partners.length];
      this.partners.push(o.id);
      if (spot) o.goTo(spot[0], spot[1], 130);
      G.after(2.5, () => { if (o.state === 'waiting') o.expr = null; });
      this.msg = { text: `✔ ¡${G.CHARS[o.id].name} se queda para la fiesta! Partners ${this.partners.length}/3`, t: 2.2 };
      G.sfx('ok'); W.puff(o.x, o.y - 10, 5, true);
    }
    update(dt) {
      const p = this.p; p.update(dt); this.others.forEach((o) => o.update(dt)); this.cat.update(dt); W.updateFx(dt);
      // Vida de los NPC: el que va al hombro se acopla al portador (con un
      // resorte suave que le da rebote y desfase al caminar); el reclutado
      // camina a su puesto y espera; el libre deambula por SU habitación
      // con gestos (sin pathfinding: rutas por puertas de World.path).
      this.others.forEach((o) => {
        if (o.state === 'carried') {
          o.x = p.x; o.y = p.y; o.dir = p.dir; o.jy = p.jy; o.moving = false; o.vx = o.vy = 0;
          o.sprV += ((46 - o.elev) * 90 - o.sprV * 11) * dt; o.elev += o.sprV * dt;
          return;
        }
        if (o.route && o.route.length) { o.follow(dt); return; }
        o.moving = false; o.vx = o.vy = 0;
        if (o.state === 'free' && this.count <= 0 && !this.over && (o.wt -= dt) <= 0) {
          o.wt = 2.5 + Math.random() * 4;
          const k = Math.random();
          if (k < 0.5) { const pt = W.randomFreePoint(o.homeRoom); o.goTo(pt[0], pt[1], 46); }
          else if (k < 0.68) o.hop(110);
          else o.dir = ['down', 'left', 'right', 'up'][(Math.random() * 4) | 0];
        }
      });
      W.camLerp(this.cam, p.x, p.y - 20, dt, 5);
      if (this.msg && (this.msg.t -= dt) <= 0) this.msg = null;
      if (this.count > 0) { this.count -= dt; G.input.flush(); return; }
      if (this.over) {
        p.walk(0, 0, 0, dt);
        // el cierre llega a los 1.1 s con el reloj del JUEGO (dt), no con
        // setTimeout: así la PAUSA también congela esta transición.
        this.endT = (this.endT || 0) + dt;
        if (this.endT >= 1.1 && !this.doneFired) { this.doneFired = true; this.done({ inHand: p.carry.slice(), stashed: this.stashed, partners: this.partners.slice() }); }
        return;
      }
      this.time -= dt;
      const ax = G.input.axis();
      let sp = this.speed;
      const heavy = p.carry.some((id) => G.ITEMS[id].slots === 2);
      if (heavy && p.id !== 'alan') sp *= 0.62; else if (p.carry.length === 2) sp *= 0.86;
      p.walk(ax.x, ax.y, sp, dt);
      this.near = null; this.nearStash = dist(p, W.STASH) < 48;
      this.nearRoomie = null;
      if (!this.carrying) { let best = 42; this.others.forEach((o) => { if (o.state !== 'free') return; const d = dist(p, o); if (d < best) { best = d; this.nearRoomie = o; } }); }
      if (!this.nearStash) { let best = 36; this.items.forEach((it) => { const d = dist(p, it); if (d < best) { best = d; this.near = it; } }); }
      if (G.input.hit('action')) {
        if (this.nearStash && this.carrying) {
          this.recruit(this.carrying);
        } else if (this.nearStash && p.carry.length) {
          p.carry.forEach((id) => { G.S.inv[id] = true; this.stashed++; });
          this.msg = { text: '¡Guardado! ' + p.carry.map((id) => G.ITEMS[id].name).join(' + '), t: 1.6 };
          p.carry = []; p.hop(140); W.puff(W.STASH.x, W.STASH.y - 14, 5, true); G.sfx('ok'); G.ui.refreshInv();
        } else if (this.near && (!this.nearRoomie || dist(p, this.near) <= dist(p, this.nearRoomie))) {
          // Ítem vs roomie cuando ambos están cerca: gana el MÁS cercano
          // (pararte sobre un roomie junto a un spawn no debe robarle el
          // interact a recoger el objeto, ni al revés).
          const need = G.ITEMS[this.near.id].slots;
          if (this.slotsUsed() + need <= 2) {
            p.carry.push(this.near.id); this.items.splice(this.items.indexOf(this.near), 1);
            if (this.catItem === this.near) this.catItem = null;
            this.msg = { text: G.ITEMS[this.near.id].name + (need === 2 ? ' (pesado)' : ''), t: 1.2 }; p.hop(110); G.sfx('pick');
          } else { this.msg = { text: '¡Manos llenas! Guarda en el armario del pasillo', t: 1.6 }; p.emo('✖', 0.8); G.sfx('bad'); }
        } else if (this.carrying) {
          this.dropCarried();
        } else if (this.nearRoomie) {
          this.pickUp(this.nearRoomie);
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
        const free = this.others.filter((o) => o.state === 'free');
        const o = (free.length ? free : this.others)[(Math.random() * (free.length ? free.length : this.others.length)) | 0];
        const lines = this.time < 15
          ? ['¡YA VIENE!', '¡Escucho el ascensor!', '¡Guarda lo que tengas!', '¡Si no me reclutaste, me voy!']
          : this.partners.length < 3
            ? ['¡Apúrate!', '¡El pastel, el pastel!', 'Yo vigilo la puerta.', '¡No te olvides de guardar!', '¿Dónde quedaron los globos?', '¡Elige a tus 3 partners!', '¡A mí, al armario, porfa!']
            : ['¡Ya estamos los que somos!', '¡El pastel, el pastel!', 'Yo vigilo la puerta.', '¡No te olvides de guardar!'];
        if (o.state !== 'carried') { o.say(lines[(Math.random() * lines.length) | 0], 2.2); o.hop(130); }
      }
      if (this.time <= 0) {
        this.over = true; G.sfx('bell'); this.others.forEach((o) => o.emo('!', 1.5)); p.emo('!', 1.5);
        // Si el minuto muere con alguien al hombro SIN entregar, no cuenta
        // como partner: se baja solo y queda entre los que huirán.
        if (this.carrying) { const o = this.carrying; this.carrying = null; p.carryWalk = false; o.state = 'free'; o.carriedPose = false; o.elev = 0; o.expr = 'surprised'; o.x = p.x + 28; o.y = p.y; }
      }
    }
    draw(dt) {
      const p = this.p;
      W.render({
        cam: this.cam, dt, light: W.LIGHT.dia, actors: [p, this.cat, ...this.others], items: this.items, focusZ: p.y,
        sprites: (t) => { ring(W.STASH.x, W.STASH.y, 40 + Math.sin(t * 5) * 3, p.carry.length ? [0.4, 1, 0.5] : [1, 1, 1], p.carry.length ? 0.75 : 0.3); },
        over: (c, t) => {
          if (this.count <= 0 && !this.over) {
            if (this.nearStash && this.carrying) { const h = p.head(40); G.prompt(c, `ESPACIO: ${G.CHARS[this.carrying.id].name} se queda ✔`, h.x, h.y); }
            else if (this.nearStash && p.carry.length) { const h = p.head(34); G.prompt(c, 'ESPACIO: guardar', h.x, h.y); }
            else if (this.near && (!this.nearRoomie || dist(p, this.near) <= dist(p, this.nearRoomie))) { const q = R.project(this.near.x, 46, this.near.y); G.prompt(c, 'ESPACIO: ' + G.ITEMS[this.near.id].name, q.x, q.y); }
            else if (this.carrying) { const h = p.head(40); G.prompt(c, 'Al ARMARIO con tu partner · ESPACIO: bajarlo', h.x, h.y); }
            else if (this.nearRoomie) { const h = this.nearRoomie.head(6); G.prompt(c, this.partners.length >= 3 ? 'Ya tienes 3 partners' : `ESPACIO: cargar a ${G.CHARS[this.nearRoomie.id].name}`, h.x, h.y); }
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
          this.others.forEach((o) => { if (o.state === 'carried') return; c.fillStyle = o.state === 'waiting' ? '#7dff8a' : '#b9b0d6'; c.fillRect(mx + 1 + o.x * k, my + 1 + o.y * k, 3, 3); });
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
          panel(c, 54, 6, 92, 40); G.text(c, 'PARTNERS', 100, 16, { size: 7, color: '#b9b0d6', stroke: false }); G.text(c, this.partners.length + '/3' + (this.carrying ? ' +1🏋' : ''), 100, 32, { size: 15, color: this.carrying ? '#ffb86b' : '#7dff8a', stroke: false });
          if (this.count > 0) {
            c.fillStyle = 'rgba(20,16,30,.55)'; c.fillRect(0, 0, 640, 360);
            const n = Math.ceil(this.count - 0.3);
            G.text(c, n > 0 ? String(n) : '¡YA!', 320, 160, { size: 70, color: '#ffd23f', lw: 9 });
            G.text(c, 'Recoge objetos (ESPACIO) y guárdalos en el ARMARIO del pasillo', 320, 226, { size: 11 });
            G.text(c, 'Carga roomies (ESPACIO junto a ellos) y déjalos en el ARMARIO: tus 3 partners se quedan toda la noche', 320, 244, { size: 9, bold: false });
            G.text(c, 'Moverse: WASD o flechas  ·  Manos: 2 espacios  ·  Hombro: 1 roomie', 320, 260, { size: 9, bold: false });
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
    // ids = quiénes están EN el departamento en esta escena. Por defecto:
    // la party de la partida si ya existe (G.S.party); si no, los 7 roomies
    // (fondo del título y práctica: el depa lleno). La llegada de Ximena se
    // construye con los 7 y, tras la huida de los no reclutados, la escena
    // se queda solo con la party vía removeRoomie().
    constructor(ids) {
      const list = ids || (G.S && G.S.party && G.S.party.length ? G.S.party : G.PLAYABLE);
      this.roomies = list.map((id, i) => new Actor(id, 450 + i * 120, 215 + (i % 2) * 40));
      this.cat = new Actor('pollito', 890, 150); this.cat.speed = 80;
      this.xi = new Actor('ximena', 510, 640); this.xi.hidden = true; this.xi.speed = 62;
      this.jose = new Actor('jose', 510, 640); this.jose.hidden = true;
      this.xState = 'away'; this.wander = false; this.confetti = null; this.wt = this.roomies.map((_, i) => 1 + i * 1.3); this.catT = 3; this.title = null;
      this.cam = { ...VIEWS.todo, y: 0, fov: 34 }; this.view = VIEWS.todo; this.followA = null; this.T = Math.random() * 9;
      this.lightA = W.LIGHT.noche; this.lightB = W.LIGHT.noche; this.lk = 1; this.lightKey = 'noche';
    }
    actor(id) { return id === 'ximena' ? this.xi : id === 'pollito' ? this.cat : id === 'jose' ? this.jose : this.roomies.find((r) => r.id === id); }
    // Saca a un roomie de la escena (los que huyen al llegar Ximena): deja
    // de dibujarse, de deambular y de contar para actor()/revelación.
    removeRoomie(id) { const i = this.roomies.findIndex((r) => r.id === id); if (i >= 0) { this.roomies.splice(i, 1); this.wt.splice(i, 1); } }
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
          else { const bo = this.jose || this.cat; if (bo) bo.frameOverride = null; this.round++; this.setup(this.round); this.time = this.roundTime; this.st = 'count'; this.stT = 2; G.input.flush(); }
        }
        return false;
      }
      this.endT += dt; if (this.endT > 2.7 && !this.sent) { this.sent = true; this.done(this.result); }
      return false;
    }
    endRound(w, text) {
      if (this.st !== 'play') return;
      if (w === 'p') this.pw++; else if (w === 'b') this.bw++;
      // Jose celebra con su animación de jefe cuando gana la ronda (se limpia al montar la siguiente)
      if (this.jose) this.jose.frameOverride = w === 'b' ? 'celebrate' : null;
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
        // resultado con el ícono PROPIO del juego (trofeo/empate/derrota), nunca un emoticono
        if (k > 0.5) G.icon(c, w === 'win' ? 'trofeo' : w === 'tie' ? 'empate' : 'derrota', 320, 100, 42);
        G.text(c, w === 'win' ? '¡GANASTE!' : w === 'tie' ? 'EMPATE' : `GANÓ ${Bo.name.toUpperCase()}`, 320, 160, { size: 30 + k * 18, color: w === 'win' ? '#7dff8a' : w === 'tie' ? '#ffd23f' : '#ff6b7a', lw: 9 });
        G.text(c, `${this.pw} – ${this.bw}`, 320, 202, { size: 22, lw: 6 });
        G.text(c, w === 'win' ? `${Bo.name} fue derrotado` : w === 'tie' ? 'Nadie cede terreno' : 'Habrá consecuencias…', 320, 230, { size: 11 });
      }
    }
  }

  // =========================================================
  // 1. DECORACIÓN EXPRESS — vs Pollito
  // =========================================================
  // Set de zonas del duelo: SIEMPRE las 6 zonas de la sala. Las de un tipo
  // conseguido en la recolección van "de verdad"; las demás las improvisa
  // Samantha (papel higiénico y post-its). CAUSA DEL BUG "a veces solo me
  // da a decorar un ítem": antes el pool salía solo de lo recolectado (2
  // zonas por tipo) con un mínimo de 3 en TOTAL, y el duelo reparte el
  // pool en 3 rondas (k % 3): con 0–1 tipos cada ronda quedaba con UNA
  // zona, y con 2 tipos dos rondas quedaban con una. Medido con la prueba
  // de humo (tools/smoke_v31.js): sin inventario [1,1,1], solo globos
  // [1,1,1], globos+luces [2,1,1], los 3 tipos [2,2,2]. Con las 6 zonas
  // siempre, cada ronda tiene 2 ítems, en historia y en práctica.
  function buildDecoSet() {
    return W.DECO_SPOTS.map((s, i) => ({ i, improv: !G.S.inv[s.kind], placed: false }));
  }
  class DecoDuel extends Duel {
    constructor(who, done) {
      super(who, 'pollito', done, { time: 13, title: 'DECORACIÓN EXPRESS', hint: 'ESPACIO en verde para colgar · ESPACIO junto a Pollito para espantarlo' });
      this.p = new Actor(who, 520, 230); this.cat = new Actor('pollito', 880, 120);
      this.zone = 0.2 + stat(who, 'logica') * 0.013 + (G.S.inv.herramientas ? 0.07 : 0);
      // Red de seguridad: si el duelo se construye sin pasar por
      // MG.deco.setup() o con un set incompleto/corrupto, se reconstruye
      // el set completo de 6 zonas (nunca una ronda de un solo ítem).
      if (!Array.isArray(G.S.deco) || G.S.deco.length < W.DECO_SPOTS.length || G.S.deco.some((d) => !W.DECO_SPOTS[d.i])) G.S.deco = buildDecoSet();
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
          else if (this.near) { this.q = { d: this.near, t: Math.random() * 3, sp: 4.2 + Math.random() * 1.8 + this.round * 0.5, c: 0.25 + Math.random() * 0.5, pos: 0 }; p.frameOverride = 'act'; p.dir = 'up'; }
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
          // Marca ✓ sobre cada zona ya colgada (de cualquier ronda). La
          // decoración colocada la dibuja world.js en su sitio real (la
          // guirnalda y las luces van a la pared del fondo; los globos, al
          // piso junto a la zona) y el sprite flotante de la zona se apaga
          // al colgarla: sin esta marca, en la zona misma parecía que el
          // ítem "desaparecía y no se colocaba" (bug reportado por Jose).
          // La marca deja constancia EN LA ZONA de que quedó colocada y
          // cuenta; si Pollito la tira, la marca se apaga y vuelve el
          // sprite flotante para reintentarlo.
          G.S.deco.forEach((d) => { if (!d.placed) return; const s = W.DECO_SPOTS[d.i], q = R.project(s.x, 54, s.y); if (!q.ok) return; c.fillStyle = '#1f4a35'; c.beginPath(); c.arc(q.x, q.y, 7.5, 0, 6.3); c.fill(); c.strokeStyle = '#7dff8a'; c.lineWidth = 1.4; c.stroke(); G.text(c, '✓', q.x, q.y + 0.5, { size: 10, color: '#7dff8a', stroke: false }); });
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
          if (show) { const pwin = this.last.w === 'p'; if (!pwin) wrap(c, 'José: ' + r.jose, x + 40, jy + 9, w - 56, 7.5, '#ffb0b8'); else G.text(c, 'José borró su mensaje.', x + 40, jy + 13, { size: 7.5, align: 'left', color: '#b9b0d6', stroke: false }); G.text(c, this.last.text, 320, y + h + 12, { size: 11, color: pwin ? '#7dff8a' : '#ff6b7a', lw: 4 }); }
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
      this.x0 = 388; this.goal = 872; this.p = new Actor(who, this.x0, 266); this.jose = new Actor('jose', this.x0, 92); this.jose.animSet = 'sneak'; this.xi = new Actor('ximena', 936, 160);
      this.grace = 0.17 + stat(who, 'sigilo') * 0.013; this.caught = 0; const f = G.S.flags.jose; this.jbase = (f === 'aliado' ? 80 : f === 'desconfia' ? 94 : 87) * 1.45; this.pspeed = (64 + stat(who, 'velocidad') * 7) * 1.5; this.cam = CAM_SALA(); this.begin();
    }
    setup(n) { const p = this.p, j = this.jose, xi = this.xi; p.x = j.x = this.x0; p.vx = j.vx = 0; p.dir = j.dir = 'right'; p.spin = j.spin = 0; xi.dir = 'right'; xi.expr = 'sleep'; this.ph = 'green'; this.pt = rnd(1.4, 2.4); this.redT = 0; this.jsp = this.jbase * (1 + n * 0.06); this.jmove = true; this.jwait = 0; }
    extra() { return { caught: this.caught }; }
    back(a, isP) { a.x = Math.max(this.x0, a.x - 135); a.vx = 0; a.spin = 0.6; a.flash = 0.6; a.emo('!!', 1); W.puff(a.x, a.y, 5); if (isP) { this.caught++; G.addSus(4); G.sfx('bad'); } else G.sfx('msg'); }
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
          // la alerta de "va a voltear" lleva el ícono PROPIO de alerta; nada de emoticones/manitas
          if (cue) { G.icon(c, 'alerta', h.x - 38, h.y + 1, 13); G.text(c, '¡VA A VOLTEAR!', h.x + 5, h.y + 1, { size: 9, color: '#ffd23f', stroke: false }); }
          else G.text(c, red ? '¡QUIETO!' : '¡AVANZA!', h.x, h.y + 1, { size: 9, color: red ? '#ffb0b8' : '#7dff8a', stroke: false });
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
  // 10. SALTO DE REPISAS — ESCALADA INFINITA vs Pollito
  // Rediseño (2026-11-14, pedido de Jose): antes era una carrera a una
  // meta fija de 14 repisas y la pared terminaba en la meta, así que la
  // "siguiente" repisa recién aparecía al saltar la anterior. Ahora NO
  // HAY TECHO: las repisas se generan de forma procedural y
  // determinista hacia arriba, sin fin — el lado de cada repisa sale
  // de un hash del índice (sideOf, con ventana cacheada y podada).
  // RITMO DE GENERACIÓN (ajuste de Jose, 2026-11-14): las repisas NO se
  // pre-generan en una banda lejana. Por columna existen solo el
  // objetivo actual y la siguiente (born = máxima alcanzada + 2), y la
  // repisa NUEVA nace — con un pop elástico y su puff de polvo — en el
  // momento en que el escalador ATERRIZA sobre la repisa más alta que
  // ha alcanzado (bornUp, al asentarse el actor). Las de muy abajo
  // dejan de dibujarse al salir de la banda visible: el set dibujado
  // es acotado suba el jugador a 10 m o a 10 000 m.
  // CÁMARA LEJANA (mismo ajuste): dist 600 / fov 36 (antes 380/34): se
  // ve ~el doble de escena en vertical, el departamento y el techo se
  // empequeñecen abajo al salir y la altura se MIDE contra el edificio.
  // ICONOGRAFÍA: los hitos, el "vas ganando" y el panel final usan los
  // íconos propios del juego (G.icon), nunca emoticones.
  // GANA EL QUE MÁS ESCALÓ: una sola ronda de 60 s y cuenta la ALTURA
  // MÁXIMA alcanzada. Conversión: 25 unidades de mundo = 1 m (cada
  // repisa está a 27 u ≈ 1,1 m). Equivocarse de lado = resbalar y CAER
  // a la repisa anterior (sin muerte ni fin del duelo: la altura
  // máxima no se pierde). Al agotarse el tiempo: más alto gana (win),
  // empate (tie), Pollito más alto (lose) — el mismo mapeo win/tie/lose
  // de siempre vía endRound, con extra() = las alturas en metros para
  // los textos de data.js.
  // ZONAS por altura (elev en unidades de mundo): el librero interior
  // → EL TECHO (378 u ≈ 15 m: el librero lo ATRAVIESA, con escombros,
  // antena/chimenea/tanque en la azotea y el banner "¡SALISTE DEL
  // TECHO!" con el ícono propio de techo) → cielo con nubes y pájaros → estratósfera (estrellas
  // tenues, la luna) → ESPACIO (≥5000 u ≈ 200 m: estrellas, un satélite
  // que cruza, el planeta brillando abajo y FLOTACIÓN: subir y bajar
  // se vuelve lento y los actores quedan suspendidos con un vaivén —
  // gag físico de ingravidez). El fondo (cielo y luz) interpola suave
  // entre zonas según la altura de la cámara, y cada zona se anuncia
  // una sola vez al cruzarla con la altura máxima.
  // CÁMARA: sigue al jugador en vertical con suavidad — sube ágil
  // (4,5/s) y baja lenta (2,0/s) para no marear con las caídas — y
  // nunca baja del nivel del suelo. La altura máxima se siente
  // conquistada porque el marcador ▲ y los hitos son de la MÁXIMA.
  // POLLITO: escala en su propia columna con el ritmo de siempre
  // (cstep con jitter y distracciones; pollitoOfendido lo acelera y el
  // stat velocidad del jugador lo ajusta como antes). Su salto se ve
  // con pounce (jy > 2 en Actor.draw3d, automático al place()) y
  // jamás se espeja en vistas frontales: place() solo le pone dir de
  // perfil al saltar, como en el resto del juego.
  // =========================================================
  const SH = 27, U_PER_M = 25, CLIMB_TIME = 60;
  const TECHO_E = 14 * SH, AZOTEA_E = 750, CIELO_E = 2250, ESPACIO_E = 5000;
  // Lado CRUDO de la repisa k-ésima (k = saltos dados): hash
  // determinista del índice, O(1) y sin memoria para cualquier k. El
  // lado JUGABLE lo deriva ClimbDuel.sideOf con una regla
  // anti-monotonía sobre la secuencia de SALIDA (nunca 4 seguidas del
  // mismo lado: la 4.ª se voltea) — ojo, la regla debe mirar la
  // salida y no el crudo: un crudo volteado seguido de crudos del
  // signo volteado armaría igual una racha de 4 (lo cazó la humo).
  function climbHash(k) { const s = Math.sin(k * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); }
  // Easing del nacimiento de una repisa: pop elástico (sobrepasa un
  // poco el tamaño final y se asienta) para que el spawn se LEA.
  function climbPop(k) { const u = Math.max(0, Math.min(1, k)), c = 1.70158; return 1 + (c + 1) * Math.pow(u - 1, 3) + c * Math.pow(u - 1, 2); }
  function climbRaw(k) { return climbHash(k) < 0.5 ? -1 : 1; }
  const CLIMB_ZONES = [
    { e: 0, name: 'El librero' },
    { e: TECHO_E, name: '¡La azotea!' },
    { e: AZOTEA_E, name: 'El cielo' },
    { e: CIELO_E, name: 'La estratósfera' },
    { e: ESPACIO_E, name: '¡El espacio!' },
  ];
  function climbZone(e) { let z = 0; for (let i = 1; i < CLIMB_ZONES.length; i++) if (e >= CLIMB_ZONES[i].e) z = i; return z; }
  const hexRgb = (h) => [parseInt(h.slice(1, 3), 16) / 255, parseInt(h.slice(3, 5), 16) / 255, parseInt(h.slice(5, 7), 16) / 255];
  const rgbHex = (v) => '#' + v.map((x) => Math.round(Math.max(0, Math.min(1, x)) * 255).toString(16).padStart(2, '0')).join('');
  // Claves de luz/cielo por altura de cámara: [elev, sky, amb, sun].
  // El fondo transiciona SUAVE entre zonas (interpolación por tramo).
  const CLIMB_LIGHT = [
    [0, '#15121f', [0.56, 0.52, 0.60], [0.34, 0.30, 0.30]],
    [TECHO_E, '#2b2140', [0.58, 0.52, 0.62], [0.40, 0.33, 0.30]],
    [AZOTEA_E, '#1d2c50', [0.55, 0.58, 0.72], [0.30, 0.34, 0.45]],
    [CIELO_E, '#0e1734', [0.44, 0.48, 0.64], [0.22, 0.26, 0.40]],
    [ESPACIO_E, '#030309', [0.36, 0.40, 0.56], [0.18, 0.22, 0.38]],
  ];
  function climbLight(y) {
    let i = 0; while (i < CLIMB_LIGHT.length - 2 && y >= CLIMB_LIGHT[i + 1][0]) i++;
    const a = CLIMB_LIGHT[i], b = CLIMB_LIGHT[i + 1], k = Math.max(0, Math.min(1, (y - a[0]) / (b[0] - a[0])));
    const L = (u, v) => u.map((x, j) => x + (v[j] - x) * k);
    return { amb: L(a[2], b[2]), sun: L(a[3], b[3]), sky: rgbHex(L(hexRgb(a[1]), hexRgb(b[1]))), points: [{ x: 0, y: y + 40, z: 80, r: 340, c: [0.45, 0.36, 0.22] }] };
  }
  class ClimbDuel extends Duel {
    constructor(who, done) {
      super(who, 'pollito', done, { rounds: 1, need: 1, time: CLIMB_TIME, label: 'ESCALADA', title: 'SALTO DE REPISAS', hint: '← o → según la siguiente repisa · Si fallas, caes una repisa · Gana la mayor altura en 60 s' });
      this.quietRend = true; // el cierre usa su propio panel con las alturas (ver endOverlay)
      this.p = new Actor(who, -70, 12); this.cat = new Actor('pollito', 70, 12); this.cam = { x: 0, y: 50, z: 0, dist: 600, pitch: 0.3, fov: 36 }; this.begin();
    }
    setup(n) {
      this.pi = 0; this.ci = 0; this.pMax = 0; this.cMax = 0; // repisa actual y MÁXIMA de cada uno
      // GENERACIÓN AL ATERRIZAR: por columna existen las repisas 1..born
      // (1 = objetivo actual, 2 = la siguiente). La nueva nace SOLO al
      // aterrizar en una altura máxima nueva (ver bornUp en update).
      this.born = { p: 2, c: 2 };
      this.spawnFx = { p: { 1: 0, 2: 0.18 }, c: { 1: 0, 2: 0.18 } }; // nº de repisa -> instante de nacimiento (pop)
      this.puffs = []; // polvo del nacimiento de cada repisa
      this.stun = 0; this.ct = 1; this.banner = null; this.debris = []; this.zoneSeen = 0; this.catZone = 0;
      this._sb = 0; this._sv = []; // ventana de lados generados desde el índice _sb (se poda: ver pruneSides)
      this.cstep = 0.44 * (G.S.flags.pollitoOfendido ? 0.93 : 1) + (10 - stat(this.who, 'velocidad')) * -0.004;
      this.place(this.p, -70, 0, true); this.place(this.cat, 70, 0, true);
    }
    // Lado jugable de la repisa k-ésima: determinista (misma secuencia
    // en toda instancia) y sin rachas de 4. Se genera hacia adelante y
    // se cachea SOLO una ventana alrededor de la zona de juego.
    sideOf(k) {
      while (this._sb + this._sv.length <= k) {
        const r = climbRaw(this._sb + this._sv.length), n = this._sv.length;
        const flip = n >= 3 && this._sv[n - 1] === r && this._sv[n - 2] === r && this._sv[n - 3] === r;
        this._sv.push(flip ? -r : r);
      }
      return this._sv[k - this._sb];
    }
    // Descarta los lados muy por debajo de lo visible/jugable: la
    // ventana queda acotada por la distancia entre escaladores y la
    // banda visible, nunca por la altura absoluta alcanzada.
    pruneSides(minK) { const cut = Math.max(0, minK - 3 - this._sb); if (cut > 0) { this._sv.splice(0, cut); this._sb += cut; } }
    // Generador procedural: la repisa i (i ≥ 1) existe para CUALQUIER i.
    shelfAt(base, i) { return i === 0 ? { x: base, e: 0 } : { x: base + this.sideOf(i - 1) * 28, e: i * SH }; }
    place(a, base, i, snap) { const q = this.shelfAt(base, i); a.tx = q.x; a.te = q.e; if (snap) { a.x = q.x; a.elev = q.e; } else a.hop(120); a.dir = i && this.sideOf(i - 1) < 0 ? 'left' : 'right'; }
    // ¿La repisa i de la columna col ('p' | 'c') ya NACIÓ? Solo existen
    // 1..born: el objetivo (actual+1) y la siguiente (actual+2).
    shelfBorn(col, i) { return i >= 1 && i <= this.born[col]; }
    // Nace la repisa nueva de una columna: se llama cuando el escalador
    // se ASIENTA sobre su repisa más alta (máxima recién conquistada).
    // Registra el pop y suelta el puff de polvo en el sitio exacto.
    bornUp(col, idx) {
      const target = idx + 2;
      if (target <= this.born[col]) return;
      this.born[col] = target;
      this.spawnFx[col][target] = this.T;
      const q = this.shelfAt(col === 'p' ? -70 : 70, target);
      for (let j = 0; j < 5; j++) this.puffs.push({ x: q.x, y: q.e, t: -j * 0.035, seed: j * 2.4 + target });
    }
    meters(i) { return Math.round((i * SH) / U_PER_M); }
    extra() { return { pMeters: this.meters(this.pMax), cMeters: this.meters(this.cMax), zone: CLIMB_ZONES[climbZone(this.pMax * SH)].name }; }
    zoneBanner(z) {
      // cada hito lleva su ÍCONO PROPIO del juego (nada de emoticones)
      const B = [null,
        { a: '¡SALISTE DEL TECHO!', b: 'El librero sigue… ¿hasta dónde llega?', icon: 'techo' },
        { a: '¡YA SE VE TODO LIMA!', b: 'Las nubes quedan abajo', icon: 'ciudad' },
        { a: 'ESTRATÓSFERA', b: 'El cielo se oscurece…', icon: 'luna' },
        { a: '¡FUERA DEL PLANETA!', b: 'Pollito también flota. Nadie entiende nada.', icon: 'planeta' }][z];
      if (B) this.banner = { a: B.a, b: B.b, icon: B.icon, t: 0, d: 3 };
    }
    update(dt) {
      const p = this.p, cat = this.cat;
      [p, cat].forEach((a) => {
        a.update(dt);
        const rising = a.te > a.elev + 0.5, space = a.elev >= ESPACIO_E;
        // en el espacio todo flota: subir y bajar se vuelve leeeento
        const k = Math.min(1, dt * (space ? (rising ? 6.5 : 5) : (rising ? 17 : 13)));
        a.x += (a.tx - a.x) * Math.min(1, dt * 16); a.elev += (a.te - a.elev) * k;
        if (space && Math.abs(a.elev - a.te) < 1.5 && a.jy <= 0.01) a.jy = 2.2 + Math.sin(this.T * 2.2 + (a === cat ? 1.7 : 0)) * 2.2; // vaivén de ingravidez
      });
      // NACIMIENTO AL ATERRIZAR: cuando un escalador se asienta sobre su
      // repisa más alta (recién conquistada), nace la siguiente de la
      // siguiente en su columna. Nunca antes, nunca por banda lejana.
      const settled = (a) => Math.abs(a.elev - a.te) < 1.2 && Math.abs(a.x - a.tx) < 4;
      if (settled(p) && this.pi === this.pMax) this.bornUp('p', this.pi);
      if (settled(cat) && this.ci === this.cMax) this.bornUp('c', this.ci);
      // polvo de los nacimientos + limpieza de pops ya asentados
      this.puffs = this.puffs.filter((u) => (u.t += dt) < 0.5);
      for (const col of ['p', 'c']) for (const k in this.spawnFx[col]) if (this.T - this.spawnFx[col][k] > 1) delete this.spawnFx[col][k];
      if (this.banner && (this.banner.t += dt) > this.banner.d) this.banner = null;
      this.debris = this.debris.filter((d) => { d.vy -= 500 * dt; d.y += d.vy * dt; return d.y > TECHO_E - 190; });
      // cámara vertical suave: sube ágil, baja lenta (no marear), nunca bajo el suelo
      const ty = Math.max(50, p.elev + 40);
      this.cam.y += (ty - this.cam.y) * Math.min(1, dt * (ty > this.cam.y ? 4.5 : 2));
      this.pruneSides(Math.min(this.pi, this.ci, Math.max(0, Math.floor((this.cam.y - 300) / SH)))); // la ventana de lados no crece con la altura
      if (!this.tick(dt)) return;
      // hitos de zona según la altura MÁXIMA del jugador (una vez por zona)
      const pz = climbZone(this.pMax * SH);
      if (pz > this.zoneSeen) {
        this.zoneSeen = pz; this.zoneBanner(pz);
        if (pz === 1) { p.emo('!!', 1.4); for (let i = 0; i < 7; i++) this.debris.push({ x: p.x + rnd(-46, 46), y: TECHO_E + rnd(0, 10), z: -14 + rnd(-6, 6), vy: rnd(-30, 10), s: rnd(4, 9) }); }
      }
      const cz = climbZone(this.cMax * SH);
      if (cz > this.catZone) { this.catZone = cz; if (cz === 1) cat.emo('😼', 1.2); }
      if (this.stun > 0) this.stun -= dt;
      else {
        const k = G.input.hit('left') ? -1 : G.input.hit('right') ? 1 : 0;
        if (k) {
          if (k === this.sideOf(this.pi)) { this.pi++; if (this.pi > this.pMax) this.pMax = this.pi; this.place(p, -70, this.pi); G.sfx('pick'); }
          else { // resbalón: CAES a la repisa anterior (la máxima queda)
            this.stun = 0.38; p.spin = 0.5; p.emo('💦', 0.7); G.sfx('bad'); G.addNoise(2);
            if (this.pi > 0) { this.pi--; this.place(p, -70, this.pi); }
          }
        }
      }
      if ((this.ct -= dt) <= 0) { this.ct = this.cstep + rnd(-0.08, 0.1) + (Math.random() < 0.1 ? 0.5 : 0); this.ci++; if (this.ci > this.cMax) this.cMax = this.ci; this.place(cat, 70, this.ci); }
      if (this.time <= 0) { // se acabó el tiempo: decide la ALTURA MÁXIMA
        const w = this.pMax > this.cMax ? 'p' : this.cMax > this.pMax ? 'b' : 'tie';
        // el resultado se anuncia con el panel final y su ícono propio;
        // sobre la cabeza solo va la reacción de texto ('!!' / '!?')
        if (w === 'tie') { p.emo('!?', 1.5); cat.emo('!?', 1.5); } else (w === 'p' ? p : cat).emo('!!', 1.5);
        this.endRound(w, `Altura final: tú ${this.meters(this.pMax)} m · Pollito ${this.meters(this.cMax)} m`);
      }
    }
    // Mundo procedural por BANDA VISIBLE: solo se construye lo que la
    // cámara (lejana: dist 600 / fov 36) puede ver, de cam.y-270 a
    // cam.y+290. Las repisas existen como función (shelfAt) pero solo
    // se materializan las que ya NACIERON en cada columna (shelfBorn)
    // y están en la ventana; el nº de cajas es ~constante a cualquier
    // altura (reciclaje total).
    drawWorld(mb) {
      const cy = this.cam.y, lo = cy - 270, hi = cy + 290, t = this.T, zone = climbZone(cy);
      if (lo < 30) mb.flat(-400, -200, 800, 500, 0, '#c99b66'); // suelo del departamento
      // pared del librero (interior): paneles por tramos, SOLO bajo el techo
      for (let y = Math.max(0, Math.floor(lo / 54) * 54); y < Math.min(hi, TECHO_E); y += 54) mb.box(-262, y, -40, 524, 54, 20, '#3a3348', { s: '#4a405c' });
      if (lo < TECHO_E + 200 && hi > TECHO_E - 60) {
        // EL TECHO: dos losas con un hueco sobre las columnas y el borde
        // roto con escombros colgando: el librero lo atravesó.
        mb.box(-460, TECHO_E, -46, 300, 10, 56, '#6b5a4a', { top: '#8a755c' }); mb.box(160, TECHO_E, -46, 300, 10, 56, '#6b5a4a', { top: '#8a755c' });
        mb.box(-160, TECHO_E - 3, -46, 26, 7, 56, '#5a4c3e'); mb.box(134, TECHO_E - 5, -46, 26, 9, 56, '#5a4c3e');
        mb.box(-96, TECHO_E - 12, -30, 10, 12, 8, '#6b5a4a'); mb.box(60, TECHO_E - 16, -36, 8, 16, 6, '#5a4c3e');
        // utilería de AZOTEA anclada al techo: antena con luz, chimenea, tanque
        mb.cyl(-308, TECHO_E + 10, -70, 3, 120, '#8b93a8'); mb.box(-338, TECHO_E + 104, -72, 60, 4, 4, '#8b93a8'); mb.box(-326, TECHO_E + 84, -72, 36, 4, 4, '#8b93a8');
        if (Math.sin(t * 3) > 0) mb.box(-311, TECHO_E + 126, -73, 6, 6, 2, '#ff5f6b', { emit: true });
        mb.box(268, TECHO_E + 10, -64, 34, 52, 30, '#9a5a48', { top: '#b06a54' }); mb.box(262, TECHO_E + 62, -68, 46, 8, 38, '#7c4636');
        mb.cyl(330, TECHO_E + 10, -110, 30, 44, '#5f7d99', { top: '#7492ad' });
      }
      // NUBES (sobre el techo): terrones nocturnos por tramo de 150 u, con deriva
      for (let c0 = Math.floor(lo / 150); c0 * 150 < hi; c0++) {
        const h1 = climbHash(c0 * 3.7 + 40), h2 = climbHash(c0 * 9.13 + 7), cyy = c0 * 150 + h1 * 80;
        if (h1 < 0.45 || cyy < TECHO_E + 30) continue;
        const cx = -360 + h2 * 720 + Math.sin(t * 0.13 + c0) * 14, cz = -150 - h2 * 60;
        mb.box(cx - 70, cyy, cz, 140, 7, 34, '#54648c'); mb.box(cx - 40, cyy + 6, cz + 4, 76, 6, 28, '#61719c');
      }
      // PÁJAROS nocturnos cruzando la banda del cielo
      if (zone === 2) for (let k = 0; k < 3; k++) {
        const bx = -470 + ((t * 26 + k * 310) % 940), by = cy + 55 + k * 47;
        mb.box(bx, by, -120, 13, 2.5, 4, '#0c0e18'); mb.box(bx + (k % 2 ? 10 : -10), by + 2.5, -120, 10, 2.5, 4, '#0c0e18');
      }
      // ESTRELLAS (estratósfera tenues, espacio densas): por tramo de 90 u
      if (zone >= 3) for (let c0 = Math.floor(lo / 90); c0 * 90 < hi; c0++) {
        const n = zone === 3 ? 3 : 6;
        for (let k = 0; k < n; k++) {
          if (Math.sin(t * 2 + k * 2.4 + c0 * 1.3) < -0.8) continue; // titileo
          mb.box(-390 + climbHash(c0 * 31 + k * 7.7) * 780, c0 * 90 + climbHash(c0 * 17 + k * 3.3) * 90, -300, 2.4, 2.4, 1, ['#8fa3e8', '#e8ecff', '#5a6ca6'][k % 3], { emit: true });
        }
      }
      // SATÉLITE cruzando el espacio, con su luz roja parpadeante
      if (zone >= 4) {
        const sx = -430 + ((t * 30) % 860), sy = cy + 150;
        mb.box(sx, sy, -160, 26, 9, 9, '#c9cedd'); mb.box(sx - 34, sy + 2, -160, 30, 1.5, 13, '#3f6fd8'); mb.box(sx + 30, sy + 2, -160, 30, 1.5, 13, '#3f6fd8');
        if (Math.sin(t * 6) > 0) mb.box(sx + 11, sy + 9, -160, 3, 3, 3, '#ff5f6b', { emit: true });
      }
      // escombros del momento del techo, cayendo
      this.debris.forEach((d) => mb.box(d.x, d.y, d.z, d.s, d.s * 0.7, d.s, '#7a6752'));
      // columnas: rieles por tramos + repisas de la ventana visible
      [-70, 70].forEach((bx, cix) => {
        const idx = cix ? this.ci : this.pi;
        for (let y = Math.max(0, Math.floor(lo / 90) * 90); y < hi; y += 90) {
          mb.box(bx - 52, y, -20, 4, 90, 20, '#74502f'); mb.box(bx + 48, y, -20, 4, 90, 20, '#74502f'); mb.box(bx - 52, y, -20, 104, 90, 2, '#5a3f28');
        }
        const col = cix ? 'c' : 'p', i0 = Math.max(1, Math.floor(lo / SH)), i1 = Math.min(Math.ceil(hi / SH), this.born[col]);
        for (let i = i0; i <= i1; i++) {
          const sx = bx + this.sideOf(i - 1) * 28, next = i === idx + 1 && this.st === 'play';
          // POP de nacimiento: la repisa recién nacida entra con escala
          // elástica (0,38 s) para que se entienda que nace de tu avance
          const st = this.spawnFx[col][i]; let sc = 1;
          if (st != null) { const k = (t - st) / 0.38; if (k < 1) sc = Math.max(0.03, climbPop(k)); }
          mb.box(sx - 22 * sc, i * SH - 4 * sc, -18, 44 * sc, 4 * Math.max(0.35, sc), 26, next ? (cix ? '#ffb0b8' : '#b5f5bd') : '#b98a55', { top: next ? (cix ? '#ffd0d6' : '#d9ffe0') : '#c99a66', emit: next && !cix });
          if (i % 3 === 0 && sc > 0.55) mb.box(sx - this.sideOf(i - 1) * 8 - 5 * sc, i * SH, -14, 10 * sc, 12 * sc, 6, ['#e23b4e', '#3fa0f0', '#58c46a'][i % 3]); // un libro cada 3 repisas
        }
      });
      // polvo del nacimiento de las repisas: anillo de motas que se abre
      this.puffs.forEach((u) => {
        if (u.t < 0) return;
        for (let j = 0; j < 5; j++) {
          const ang = u.seed + j * 1.2566, r = 5 + u.t * 30, s = Math.max(1.2, 4.2 - u.t * 6);
          mb.box(u.x + Math.cos(ang) * r, u.y + Math.sin(ang) * r * 0.55 + u.t * 7, -16, s, s, s, '#e6d7ae');
        }
      });
    }
    endOverlay(c) {
      const w = this.result.win, pM = this.meters(this.pMax), cM = this.meters(this.cMax);
      c.fillStyle = 'rgba(16,12,26,.85)'; c.fillRect(0, 0, 640, 360);
      G.icon(c, w === 'win' ? 'trofeo' : w === 'tie' ? 'empate' : 'derrota', 320, 84, 48); // ícono propio del resultado
      G.text(c, w === 'win' ? '¡GANASTE!' : w === 'tie' ? 'EMPATE' : 'GANÓ POLLITO', 320, 138, { size: 40, color: w === 'win' ? '#7dff8a' : w === 'tie' ? '#ffd23f' : '#ff6b7a', lw: 9 });
      G.text(c, `Tú: ${pM} m   ·   Pollito: ${cM} m`, 320, 182, { size: 17, lw: 6 });
      G.text(c, `Llegaste hasta: ${CLIMB_ZONES[climbZone(this.pMax * SH)].name}`, 320, 208, { size: 11, color: '#b7a8e8' });
      G.text(c, w === 'win' ? 'Pollito fue derrotado' : w === 'tie' ? 'Mismo techo. O mismo espacio.' : 'Habrá consecuencias…', 320, 232, { size: 11 });
    }
    draw(dt) {
      const pM = this.meters(this.pMax), cM = this.meters(this.cMax), cy = this.cam.y;
      W.render({
        cam: this.cam, dt, mesh: null, actors: [this.p, this.cat], noApartment: true,
        light: climbLight(cy),
        boxes: (mb) => this.drawWorld(mb),
        sprites: () => {
          const z = climbZone(cy);
          if (z >= 3) R.flat(R.glowTex, 305, cy + 175, -390, 58, { tint: [0.92, 0.96, 1], alpha: 0.95 }); // la luna
          if (z >= 4) R.flat(R.glowTex, -30, cy - 320, -280, 330, { tint: [0.30, 0.50, 1], alpha: 0.5 }); // el planeta, brillando abajo
        },
        over: (c, t) => {
          if (this.st === 'over') { this.endOverlay(c); return; }
          this.hud(c, t, `▲ ${pM} m`, `▲ ${cM} m`);
          if (this.st === 'play') {
            const d = pM - cM;
            // indicador de quién va ganando con el ícono propio (trofeo /
            // derrota / empate), nunca un emoticono
            G.icon(c, d > 0 ? 'trofeo' : d < 0 ? 'derrota' : 'empate', 320, 54, 21);
            G.text(c, d > 0 ? `VAS GANANDO POR ${d} m` : d < 0 ? `Pollito va ${-d} m más alto` : '¡EMPATADOS EN ALTURA!', 320, 74, { size: 10, color: d > 0 ? '#7dff8a' : d < 0 ? '#ff9db0' : '#ffd23f' });
            const h = this.p.head(22);
            if (this.stun > 0) G.text(c, '¡Resbalaste!', h.x, h.y, { size: 10, color: '#ff6b7a' });
            else { const dir = this.sideOf(this.pi); G.prompt(c, dir < 0 ? '←' : '→', h.x + dir * 30, h.y); }
          }
          if (this.banner) { const b = this.banner, a = Math.min(1, b.t * 3, (b.d - b.t) * 1.5); c.globalAlpha = Math.max(0, a); c.fillStyle = 'rgba(20,16,30,.78)'; c.fillRect(0, 122, 640, 104); if (b.icon) G.icon(c, b.icon, 320, 146, 34); G.text(c, b.a, 320, 178, { size: 24, color: '#ffd23f', lw: 7 }); G.text(c, b.b, 320, 208, { size: 11 }); c.globalAlpha = 1; }
        },
      });
    }
  }
  ClimbDuel.SHELF_H = SH; // expuesto para la prueba de humo (los lados se piden a una instancia: sideOf)

  // =========================================================
  // 11. APAGÓN: ¿FANTASMA O DISFRAZ? — minijuego de observación
  // (diseño de Jose, 2026-11-14: diseno-minijuego-apagon.md).
  // Reemplaza la resolución del evento del apagón (antes: mandar a un
  // roomie a arreglarlo con una tirada de dados). No es un duelo contra
  // un jefe: el "jefe" nominal del evento es Pollito por sus falsas
  // alarmas. 10 apariciones en la sala a oscuras; en cada una el jugador
  // OBSERVA las pistas y responde:
  //   ← FANTASMA · → PERSONA DISFRAZADA · ↑ PERSONAJE ESPECIAL
  // (los botones se dibujan con el arte propio del juego — el fantasma
  // y la sábana en miniatura y el ícono de luna —, sin emoticones.)
  // La opción ESPECIAL solo aparece (tras 1,2 s de observación) en las
  // apariciones especiales: Ximena sonámbula y Pollito con una sábana.
  // PISTAS — fantasma real: flota sobre el piso, NO proyecta sombra,
  // brilla de forma antinatural, atraviesa la maceta, se desvanece un
  // instante y reaparece más alto. Persona disfrazada: sprite definido
  // bajo una sábana dibujada por código (con agujeros para los ojos a la
  // altura de los ojos detectados de su frame idle): se le ven los
  // ZAPATOS bajo el dobladillo, tiene sombra, tropieza con la maceta,
  // se le cae un accesorio y en fase 2+ la sábana RESPIRA. Ximena: su
  // frame de sonámbula (act), murmura de su guardia. Pollito: el gato
  // real bajo una sábana mini, le quedan las patas y la cola fuera y
  // maúlla. En fase 1 las pistas traen caption de aprendizaje.
  // ACIERTO: +16% de REPARACIÓN ELÉCTRICA (+12% en especiales) con
  // justificación rotando (fusible, batería, tablero…). ERROR: sube el
  // RIESGO de despertar (medidor propio 0–10), hace ruido y en fase 2+
  // puede dañar la decoración. Sin respuesta a tiempo: la figura se
  // esfuma (error leve, ambigüedad intacta). NUNCA hay game over.
  // FASES: 1 (rondas 1–3, ventana 6 s, pistas claras con caption) ·
  // 2 (4–7, 5 s, pistas tardías, especiales) · 3 (8–10, 3,5 s, luz que
  // parpadea y una sombra pasajera de ambiente que NO se responde).
  // Si la reparación llega a 100% la luz vuelve, pero se juegan las 10
  // apariciones igual: hay que asegurar la casa entera.
  // SALIDAS (done): { win, blackoutFixed, score, repair, awakeRisk,
  // ghostsConfirmed, fakeGhostsFound, pollitoEvent, sleepwalkerFound,
  // decoDamage, correct, errors } — el mapeo a los efectos reales del
  // evento vive en MG.apagon.resolve (game.js). Duración ≈ 2 min.
  // REGLA DEL GATO: Pollito se dibuja con Sp.catAnim('idle') frontal,
  // jamás espejado; su sábana tampoco.
  // =========================================================
  const BO_STAGES = [{ x: 468, z: 118 }, { x: 655, z: 102 }, { x: 850, z: 130 }, { x: 540, z: 230 }, { x: 782, z: 220 }];
  const BO_WINDOWS = [6, 5, 3.5];
  const BO_ENTER = 1.15, BO_REVEAL = 1.7;
  const BO_REPAIR = ['Recuperaron un fusible', 'Apareció una batería', 'Ubicaron el tablero eléctrico', 'Salió la linterna buena', 'Recuperaron el destornillador perdido', 'Falsa alarma descartada: tiempo ganado'];
  const BO_DROPS = ['control', 'flores', 'velas', 'ovillo', 'bolsas'];
  let boGhostCv = null; const boSheetCache = {}; let boMiniSheetCv = null;
  function ghostCanvasArt() {
    if (boGhostCv) return boGhostCv;
    const cv = document.createElement('canvas'); cv.width = 96; cv.height = 112; cv._scale = 0.42;
    const x = cv.getContext('2d');
    const grd = x.createLinearGradient(0, 6, 0, 106);
    grd.addColorStop(0, 'rgba(235,242,255,.96)'); grd.addColorStop(1, 'rgba(168,186,255,.88)');
    x.beginPath();
    x.moveTo(16, 104);
    x.quadraticCurveTo(10, 40, 30, 18); x.quadraticCurveTo(48, 2, 66, 18); x.quadraticCurveTo(86, 40, 80, 104);
    for (let i = 1; i <= 4; i++) { const px = 80 - i * 16; x.quadraticCurveTo(px + 8, 96 + (i % 2 ? 10 : 2), px, 104); }
    x.closePath(); x.fillStyle = grd; x.fill();
    x.strokeStyle = 'rgba(255,255,255,.85)'; x.lineWidth = 2; x.stroke();
    x.fillStyle = '#2c2a4a'; // ojos huecos y boca "o": terror de utilería, más tierno que miedo
    x.beginPath(); x.ellipse(36, 46, 5.5, 8, 0, 0, 6.3); x.fill();
    x.beginPath(); x.ellipse(60, 46, 5.5, 8, 0, 0, 6.3); x.fill();
    x.beginPath(); x.ellipse(48, 62, 4, 5.5, 0, 0, 6.3); x.fill();
    x.fillStyle = 'rgba(240,140,190,.4)';
    x.beginPath(); x.ellipse(26, 60, 6, 4, 0, 0, 6.3); x.fill();
    x.beginPath(); x.ellipse(70, 60, 6, 4, 0, 0, 6.3); x.fill();
    boGhostCv = cv; return cv;
  }
  // Sábana de disfraz para un personaje: cúpula que sigue su silueta con
  // el dobladillo SOBRE los zapatos (los zapatos visibles son LA pista) y
  // agujeros para los ojos recortados a la altura de los ojos detectados
  // del frame idle de su hoja definida.
  function sheetCanvasFor(id) {
    if (boSheetCache[id]) return boSheetCache[id];
    const meta = Sp.META.chars[id];
    const cv = document.createElement('canvas'); cv.width = meta.fw; cv.height = meta.fh; cv._scale = meta.scale;
    const x = cv.getContext('2d');
    const cx = meta.fw / 2, top = Math.max(4, meta.top - 10), hem = meta.base - 14, wT = meta.fw * 0.26, wB = meta.fw * 0.40;
    x.beginPath();
    x.moveTo(cx - wB, hem);
    x.quadraticCurveTo(cx - wB - 4, top + (hem - top) * 0.45, cx - wT, top + 16);
    x.quadraticCurveTo(cx - wT, top - 6, cx, top - 6);
    x.quadraticCurveTo(cx + wT, top - 6, cx + wT, top + 16);
    x.quadraticCurveTo(cx + wB + 4, top + (hem - top) * 0.45, cx + wB, hem);
    for (let i = 1; i <= 6; i++) { const px = cx + wB - (i * 2 * wB) / 6, mx = cx + wB - ((i - 0.5) * 2 * wB) / 6; x.quadraticCurveTo(mx, hem + (i % 2 ? 7 : -2), px, hem); }
    x.closePath(); x.fillStyle = '#f3efe3'; x.fill();
    x.strokeStyle = 'rgba(110,100,80,.5)'; x.lineWidth = 2; x.stroke();
    x.fillStyle = 'rgba(120,110,90,.18)'; x.fillRect(cx - wB * 0.7, hem - 16, wB * 1.4, 10); // desgaste inferior
    const es = (meta.eyes || {})[meta.anims.idle[0]];
    if (es && es.length) {
      x.globalCompositeOperation = 'destination-out';
      es.forEach((e) => { x.beginPath(); x.ellipse(e.x, e.y + 3, Math.max(5, e.r * 0.72), Math.max(4, e.r * 0.55), 0, 0, 6.3); x.fill(); });
      x.globalCompositeOperation = 'source-over';
    }
    boSheetCache[id] = cv; return cv;
  }
  function miniSheetCanvas() {
    if (boMiniSheetCv) return boMiniSheetCv;
    const cv = document.createElement('canvas'); cv.width = 150; cv.height = 150; cv._scale = 0.25;
    const x = cv.getContext('2d');
    x.beginPath();
    x.moveTo(28, 112);
    x.quadraticCurveTo(24, 52, 48, 30); x.quadraticCurveTo(75, 12, 102, 30); x.quadraticCurveTo(126, 52, 122, 112);
    for (let i = 1; i <= 4; i++) { const px = 122 - i * 23.5; x.quadraticCurveTo(px + 11.75, 112 + (i % 2 ? 6 : -2), px, 112); }
    x.closePath(); x.fillStyle = '#f3efe3'; x.fill();
    x.strokeStyle = 'rgba(110,100,80,.5)'; x.lineWidth = 2.5; x.stroke();
    boMiniSheetCv = cv; return cv;
  }
  function buildBoLineup() {
    const chars = shuffle(['natalia', 'itzel', 'alan', 'majo', 'saulo', 'fatima', 'samantha', 'jose'].slice());
    const kinds = shuffle(['ghost', 'ghost', 'ghost', 'ghost', 'person', 'person', 'person', 'person']);
    const lineup = kinds.map((k, i) => (k === 'person' ? { kind: 'person', charId: chars[i] } : { kind: 'ghost' }));
    if (lineup[0].kind !== 'person') { const j = lineup.findIndex((f) => f.kind === 'person'); [lineup[0], lineup[j]] = [lineup[j], lineup[0]]; } // la 1ª aparición es un disfraz: la lectura más fácil
    const xiAt = 3 + ((Math.random() * 3) | 0); // 3..5: nunca en la fase 1
    lineup.splice(xiAt, 0, { kind: 'ximena' });
    const cand = [4, 5, 6, 7].filter((i) => Math.abs(i - xiAt) >= 2);
    lineup.splice(cand[(Math.random() * cand.length) | 0], 0, { kind: 'pollito' });
    return lineup;
  }
  class BlackoutGame {
    constructor(who, done) {
      this.who = who; this.done = done; this.isBlackout = true;
      this.p = new Actor(who, 655, 258); this.p.dir = 'up';
      this.cam = { x: 655, y: 0, z: 165, dist: 700, pitch: 0.88, fov: 34 };
      this.lineup = buildBoLineup();
      this.round = 0; this.phase = 1; this.st = 'intro'; this.stT = 3.4; this.T = 0;
      this.repair = 0; this.risk = 0; this.score = 0; this.correct = 0; this.errors = 0;
      this.ghosts = 0; this.fakes = 0; this.decoDamage = 0;
      this.pollitoEvt = false; this.sleepwalkerFound = false; this.lightsBack = false;
      this.fig = null; this.lastRes = null; this.repLine = ''; this.banner = null; this.decoy = null;
      this.obsT = 0; this.obsWin = BO_WINDOWS[0]; this.specReady = false;
      this.result = null; this.doneFired = false;
    }
    startRound(n) {
      this.round = n; this.phase = n <= 2 ? 1 : n <= 6 ? 2 : 3;
      const stage = BO_STAGES[n % BO_STAGES.length], fromLeft = Math.random() < 0.5;
      const f = (this.fig = { ...this.lineup[n], stageX: stage.x + rnd(-14, 14), stageZ: stage.z + rnd(-8, 8), x: 0, z: 0, bubble: null, caption: null, stumbleT: 0, dropped: false, dropItem: null, vanishOff: 0, vanishT: 0, phaseT: 0, clues: [] });
      f.z = f.stageZ; f.fromX = fromLeft ? 358 : 952; f.x = f.fromX;
      f.answerKey = f.kind === 'ghost' ? 'ghost' : f.kind === 'person' ? 'person' : 'special';
      f.clues = this.buildClues(f);
      this.st = 'enter'; this.stT = BO_ENTER; this.obsT = 0; this.specReady = false;
      G.input.flush();
    }
    buildClues(f) {
      const P = this.phase, C = [];
      if (f.kind === 'ghost') {
        C.push({ at: P === 1 ? 0.45 : P === 2 ? 0.55 : 0.6, type: 'phase' });
        if (P >= 2) C.push({ at: 0.82, type: 'vanish' });
      } else if (f.kind === 'person') {
        if (P === 1) { C.push({ at: 0.3, type: 'stumble' }); C.push({ at: 0.62, type: 'drop' }); }
        else C.push({ at: P === 2 ? 0.5 : 0.65, type: Math.random() < 0.5 ? 'stumble' : 'drop' });
      } else if (f.kind === 'ximena') { C.push({ at: 0.18, type: 'murmur', text: '…mi guardia…' }); C.push({ at: 0.55, type: 'murmur', text: '…zzz… anatomía…' }); }
      else if (f.kind === 'pollito') C.push({ at: 0.5, type: 'meow' });
      return C;
    }
    passiveCaption() {
      const f = this.fig; if (!f || this.phase !== 1) return;
      if (f.kind === 'ghost') f.caption = { text: 'Flota sobre el piso… y no proyecta sombra.', t: 2.6 };
      else if (f.kind === 'person') f.caption = { text: 'Se le ven los zapatos bajo la sábana. Y tiene sombra.', t: 2.6 };
    }
    answer(kind) {
      if (this.st !== 'observe' || !this.fig) return;
      if (kind === 'special' && !this.specReady) return; // la opción especial aparece a los 1,2 s en las apariciones especiales
      this.resolveRound(kind);
    }
    resolveRound(kind) {
      const f = this.fig, ok = kind !== null && kind === f.answerKey;
      let gain = 0;
      if (ok) {
        this.correct++; gain = f.answerKey === 'special' ? 12 : 16;
        this.repair = Math.min(100, this.repair + gain);
        this.score += 100 + (this.phase === 3 ? 25 : 0);
        if (f.kind === 'ghost') this.ghosts++;
        else if (f.kind === 'person') this.fakes++;
        else if (f.kind === 'ximena') { this.sleepwalkerFound = true; this.risk = Math.max(0, this.risk - 3); }
        else if (f.kind === 'pollito') this.pollitoEvt = true;
        this.repLine = BO_REPAIR[(this.correct - 1) % BO_REPAIR.length];
        G.sfx('ok');
        if (f.kind === 'ghost') W.puff(f.x, f.z, 6, true);
      } else {
        this.errors++; this.score = Math.max(0, this.score - 30);
        this.risk = Math.min(10, this.risk + (kind === null ? 1 : f.kind === 'ximena' ? 4 : 2));
        if (kind !== null) G.addNoise(f.kind === 'ximena' ? 5 : 3);
        if (this.phase >= 2 && kind !== null && f.kind !== 'ximena' && this.decoDamage < 3 && Math.random() < 0.5) this.decoDamage++;
        G.sfx('bad');
      }
      if (!this.lightsBack && this.repair >= 100) { this.lightsBack = true; this.banner = { text: '¡LA LUZ VOLVIÓ! …pero siguen apareciendo figuras. A asegurar la casa.', t: 2.6 }; G.sfx('party'); }
      this.lastRes = { ok, kind, gain, line: this.revealLine(f, kind, ok) };
      this.st = 'reveal'; this.stT = BO_REVEAL;
    }
    revealLine(f, kind, ok) {
      if (kind === null) return 'La figura se esfumó antes del veredicto. ¿Fantasma? ¿Roomie veloz? Nadie lo sabrá nunca.';
      if (f.kind === 'ghost') return ok ? 'Atravesó la maceta, la pared y dos leyes de la física. El grupo decide no hablar nunca de esto.' : 'Dijiste "persona"… y la figura se desvaneció ATRAVESANDO el piso. Silencio incómodo en la sala.';
      if (f.kind === 'person') return ok ? (f.charId === 'jose' ? '¡Era JOSÉ con una sábana! Dice que "venía a ayudar". Nadie le cree.' : `¡Era ${G.CHARS[f.charId].name} bajo la sábana! Disfraz de emergencia nivel: tendedero.`) : `No era un fantasma: era ${G.CHARS[f.charId].name}, que ahora exige disculpas formales por escrito.`;
      if (f.kind === 'ximena') return ok ? '¡Es Ximena, SONÁMBULA! La guían de vuelta a su cama en silencio total. Uf.' : '¡Era Ximena sonámbula! Casi la despiertan del susto: solo murmuró algo y siguió, con el sueño más ligero.';
      return ok ? '¡Era POLLITO bajo una sábana! El caos tiene cuatro patas, bigotes y cero vergüenza.' : 'No era eso: era Pollito. Se va ofendido, arrastrando la sábana como una capa.';
    }
    finish() {
      const fixed = this.repair >= 100;
      const win = fixed && this.errors === 0 ? 'win' : fixed ? 'tie' : 'lose';
      const awakeRisk = Math.max(-1, Math.min(2, (this.risk >= 7 ? 2 : this.risk >= 4 ? 1 : 0) - (this.sleepwalkerFound ? 1 : 0)));
      this.result = { win, blackoutFixed: fixed, score: this.score + this.repair + (win === 'win' ? 200 : 0), repair: this.repair, awakeRisk, ghostsConfirmed: this.ghosts, fakeGhostsFound: this.fakes, pollitoEvent: this.pollitoEvt, sleepwalkerFound: this.sleepwalkerFound, decoDamage: this.decoDamage, correct: this.correct, errors: this.errors };
      this.st = 'over'; this.stT = 3.2;
      G.sfx(fixed ? 'party' : 'bad');
    }
    update(dt) {
      this.T += dt; W.updateFx(dt); this.p.update(dt);
      if (this.banner && (this.banner.t -= dt) <= 0) this.banner = null;
      if (this.decoy) { this.decoy.x += 62 * dt; if (this.decoy.x > 950) this.decoy = null; }
      const f = this.fig;
      if (f) {
        if (f.bubble && (f.bubble.t -= dt) <= 0) f.bubble = null;
        if (f.caption && (f.caption.t -= dt) <= 0) f.caption = null;
        if (f.stumbleT > 0) f.stumbleT -= dt;
        if (f.phaseT) f.phaseT += dt;
        if (f.vanishT > 0) { f.vanishT -= dt; if (f.vanishT <= 0) f.vanishOff = 9; }
      }
      if (this.st === 'intro') { G.input.flush(); if ((this.stT -= dt) <= 0) this.startRound(0); }
      else if (this.st === 'enter') {
        G.input.flush();
        const prog = 1 - this.stT / BO_ENTER, e = 1 - Math.pow(1 - prog, 2);
        f.x = f.fromX + (f.stageX - f.fromX) * e;
        if ((this.stT -= dt) <= 0) { f.x = f.stageX; this.st = 'observe'; this.obsT = 0; this.obsWin = BO_WINDOWS[this.phase - 1]; this.passiveCaption(); }
      } else if (this.st === 'observe') {
        this.obsT += dt;
        this.specReady = (f.kind === 'ximena' || f.kind === 'pollito') && this.obsT >= 1.2;
        for (const cl of f.clues) {
          if (cl.fired || this.obsT < cl.at * this.obsWin) continue;
          cl.fired = true;
          if (cl.type === 'stumble') { f.stumbleT = 0.5; f.bubble = { text: '¡ay!', t: 0.9 }; W.puff(f.x, f.z, 2); G.sfx('door'); if (this.phase === 1) f.caption = { text: '¡Tropezó con la maceta! Los fantasmas no tropiezan.', t: 2.4 }; }
          else if (cl.type === 'drop') { f.dropped = true; f.dropItem = BO_DROPS[(Math.random() * BO_DROPS.length) | 0]; G.sfx('pick'); if (this.phase === 1) f.caption = { text: 'Se le cayó algo al piso. Muy poco fantasmal.', t: 2.4 }; }
          else if (cl.type === 'phase') { f.phaseT = 0.0001; if (this.phase === 1) f.caption = { text: '¡Atravesó la maceta como si no existiera!', t: 2.4 }; }
          else if (cl.type === 'vanish') { f.vanishT = 0.42; G.sfx('msg'); }
          else if (cl.type === 'murmur') f.bubble = { text: cl.text, t: 1.6 };
          else if (cl.type === 'meow') { f.bubble = { text: '¡miau!', t: 1.2 }; G.sfx('meow'); }
        }
        if (this.phase === 3 && !this.decoy && Math.random() < dt * 0.22) this.decoy = { x: 366, z: 96 };
        if (G.input.hit('left')) this.answer('ghost');
        else if (G.input.hit('right')) this.answer('person');
        else if (G.input.hit('up')) this.answer('special');
        if (this.st === 'observe' && this.obsT >= this.obsWin) this.resolveRound(null);
      } else if (this.st === 'reveal') {
        if (f && f.kind === 'ximena') f.x += 10 * dt; // sigue su camino, dormida
        if ((this.stT -= dt) <= 0) { const n = this.round + 1; if (n >= this.lineup.length) this.finish(); else this.startRound(n); }
      } else if (this.st === 'over') {
        if ((this.stT -= dt) <= 0 && !this.doneFired) { this.doneFired = true; this.done(this.result); }
      }
    }
    drawFigure(t) {
      const f = this.fig; if (!f || this.st === 'intro' || this.st === 'over') return;
      const T = this.T, reveal = this.st === 'reveal', pr = reveal ? 1 - this.stT / BO_REVEAL : 0;
      let rx = f.x, elev = 0, alpha = 1;
      if (f.stumbleT > 0) rx += Math.sin(T * 70) * 2 * f.stumbleT;
      if (f.kind !== 'ghost') R.shadow(rx, f.z, f.kind === 'pollito' ? 9 : 13, 0.72); // el fantasma NO tiene sombra: es LA pista
      if (f.kind === 'ghost') {
        if (f.vanishT > 0) return; // se desvaneció por un instante (pista de fase 2+)
        elev = 13 + Math.sin(T * 2.2) * 3.5 + f.vanishOff;
        alpha = 0.86 + Math.sin(T * 7) * 0.09; // brillo antinatural
        if (f.phaseT) { const p = Math.min(1, f.phaseT / 1.15), s = Math.sin(p * Math.PI); rx += s * (f.stageX + 48 - f.x); alpha *= 1 - 0.5 * s; } // atraviesa la maceta y vuelve
        if (reveal) { elev += pr * 30; alpha *= 1 - pr * 0.75; }
        R.sprite(ghostCanvasArt(), rx, elev, f.z, { feet: 0, alpha, lit: 0.15 });
      } else if (f.kind === 'person') {
        if (reveal) {
          R.sprite(Sp.frame(f.charId, 'idle', 0, { expr: this.lastRes && this.lastRes.ok ? 'surprised' : 'angry' }), rx, 0, f.z, { feet: 2.6 });
          R.sprite(sheetCanvasFor(f.charId), rx, 0.5 - 30 * pr, f.z + 0.3, { feet: 2.6, alpha: 0.94 * (1 - pr * 0.85) }); // la sábana cae
        } else {
          R.sprite(Sp.frame(f.charId, 'walk_down', Math.floor(T * 2.4)), rx, 0, f.z, { feet: 2.6 });
          const breath = this.phase >= 2 ? 1 + Math.sin(T * 2.9) * 0.018 : 1; // la sábana respira (pista de fase 2+)
          R.sprite(sheetCanvasFor(f.charId), rx, 0.5, f.z + 0.3, { feet: 2.6, alpha: 0.94, sy: breath });
        }
      } else if (f.kind === 'ximena') {
        R.sprite(Sp.frame('ximena', 'act', Math.floor(T * 1.7) % 2, { expr: 'sleep' }), rx, 0, f.z, { feet: 2.6, roll: Math.sin(T * 1.3) * 0.03 });
      } else if (f.kind === 'pollito') {
        if (reveal) {
          R.sprite(Sp.catAnim('pounce', pr < 0.5 ? 0 : 1), rx, Math.sin(pr * Math.PI) * 9, f.z, { feet: 2.5 });
          R.sprite(miniSheetCanvas(), rx, 3 - 26 * pr, f.z + 0.3, { feet: 2, alpha: 0.95 * (1 - pr * 0.8) });
        } else {
          R.sprite(Sp.catAnim('idle', Math.floor(T * 0.9) % 2), rx, 0, f.z, { feet: 2.5 }); // frontal, jamás espejado
          R.sprite(miniSheetCanvas(), rx, 3, f.z + 0.3, { feet: 2, alpha: 0.95 });
        }
      }
      if (f.dropped) R.sprite(Sp.item(f.dropItem), f.x + 12, 1.5, f.z + 9, { feet: 4, sx: 0.9, sy: 0.9 });
      if (this.decoy) R.sprite(Sp.frame('saulo', 'walk_right', Math.floor(T * 6) % 4), this.decoy.x, 0, this.decoy.z, { feet: 2.6, alpha: 0.32, lit: 0.1 }); // sombra de ambiente (fase 3): no se responde
    }
    hudDraw(c, t) {
      const f = this.fig;
      panel(c, 8, 8, 150, 40);
      G.text(c, `APARICIÓN ${Math.min(this.round + 1, 10)}/10`, 83, 20, { size: 10, stroke: false });
      G.text(c, ['FASE 1 · APRENDIENDO', 'FASE 2 · CONFUSIÓN', 'FASE 3 · CAOS'][this.phase - 1], 83, 36, { size: 7.5, color: '#b9b0d6', stroke: false });
      panel(c, 196, 8, 248, 40);
      G.text(c, 'REPARACIÓN ELÉCTRICA', 320, 18, { size: 8, color: '#ffd23f', stroke: false });
      c.fillStyle = '#1c1826'; c.fillRect(226, 26, 188, 10);
      c.fillStyle = this.repair >= 100 ? '#7dff8a' : '#ffd23f'; c.fillRect(226, 26, 188 * (this.repair / 100), 10);
      G.text(c, this.repair + '%', 320, 31, { size: 9, color: '#1c1826', stroke: false });
      panel(c, 482, 8, 150, 40, '#40243a');
      G.icon(c, 'luna', 499, 18, 13); // el riesgo de despertar lleva el ícono propio de luna
      G.text(c, 'RIESGO DE DESPERTAR', 566, 18, { size: 7.5, color: '#ffb0b8', stroke: false });
      c.fillStyle = '#1c1826'; c.fillRect(497, 25, 120, 8);
      c.fillStyle = '#ff6b7a'; c.fillRect(497, 25, 120 * (this.risk / 10), 8);
      G.text(c, 'Puntos: ' + this.score, 557, 41, { size: 8, stroke: false });
      if (this.banner) G.text(c, this.banner.text, 320, 66, { size: 10.5, color: '#7dff8a' });
      if (this.st === 'observe') {
        c.fillStyle = '#1c1826'; c.fillRect(196, 52, 248, 4);
        c.fillStyle = this.obsWin - this.obsT < 1.2 ? '#ff6b7a' : '#7fd3ff'; c.fillRect(196, 52, 248 * Math.max(0, 1 - this.obsT / this.obsWin), 4);
        const by = 320, btn = (x, w, label, col) => { panel(c, x, by, w, 30, col); G.text(c, label, x + w / 2 + 12, by + 15, { size: 11, stroke: false }); };
        btn(56, 190, '← FANTASMA', '#2c3a5e');
        c.drawImage(ghostCanvasArt(), 66, by + 2, 24, 26); // el fantasma PROPIO del juego junto a su botón
        btn(394, 190, 'DISFRAZADO →', '#3a2c50');
        c.drawImage(miniSheetCanvas(), 404, by + 3, 24, 24); // la sábana en miniatura junto al suyo
        if (this.specReady) { btn(248, 144, '↑ ESPECIAL', '#5e2c46'); G.icon(c, 'luna', 266, by + 15, 17); }
        else if (f && (f.kind === 'ximena' || f.kind === 'pollito')) G.text(c, '…algo no cuadra con esta figura…', 320, by + 15, { size: 9, color: '#ffd23f' });
      }
      if (f && this.st !== 'over' && this.st !== 'intro') {
        if (f.bubble) { const q = R.project(f.x, 104, f.z); if (q.ok) G.bubble(c, f.bubble.text, q.x, q.y - 4); }
        if (f.caption) { const q = R.project(f.x, -4, f.z + 16); if (q.ok) G.text(c, f.caption.text, q.x, q.y + 14, { size: 9, color: '#ffe9a8' }); }
      }
      if (this.st === 'reveal' && this.lastRes) {
        const r = this.lastRes, k = Math.min(1, (BO_REVEAL - this.stT) * 5);
        c.fillStyle = `rgba(20,16,30,${0.55 * k})`; c.fillRect(0, 124, 640, 96);
        G.text(c, r.kind === null ? 'SE ESFUMÓ…' : r.ok ? '¡CORRECTO!' : '¡UPS!', 320, 152, { size: 24 + k * 6, color: r.ok ? '#7dff8a' : '#ff6b7a', lw: 7 });
        wrap(c, r.line, 150, 180, 340, 9.5, '#fff');
        if (r.ok) G.text(c, `REPARACIÓN +${r.gain}% — ${this.repLine}`, 320, 208, { size: 9.5, color: '#ffd23f', stroke: false });
      }
      if (this.st === 'intro') {
        c.fillStyle = 'rgba(12,10,20,.82)'; c.fillRect(66, 66, 508, 216);
        panel(c, 66, 66, 508, 216, '#221c33');
        G.icon(c, 'luna', 96, 92, 26);
        G.text(c, 'APAGÓN: ¿FANTASMA O DISFRAZ?', 330, 92, { size: 16, color: '#ffd23f' });
        wrap(c, 'Aparecen figuras en la oscuridad. OBSERVA sus pistas antes de responder:', 96, 122, 448, 10, '#fff');
        c.drawImage(ghostCanvasArt(), 68, 140, 20, 22);
        wrap(c, 'Fantasma de verdad: FLOTA, no tiene sombra y atraviesa las cosas.', 96, 150, 448, 10, '#bfe0ff');
        c.drawImage(miniSheetCanvas(), 68, 168, 20, 20);
        wrap(c, 'Persona disfrazada: se le ven los zapatos bajo la sábana, tropieza y se le caen cosas.', 96, 178, 448, 10, '#ffd9ec');
        G.icon(c, 'luna', 78, 206, 17);
        wrap(c, 'Y ojo: no todo es fantasma ni disfraz… Ximena sonámbula y Pollito andan sueltos.', 96, 214, 448, 10, '#ffe9a8');
        G.text(c, '← FANTASMA · → DISFRAZADO · ↑ ESPECIAL', 320, 252, { size: 11.5, color: '#7dff8a', stroke: false });
        G.text(c, 'Cada acierto repara la luz. Cada error… hace ruido al lado de Ximena.', 320, 268, { size: 8.5, color: '#b9b0d6', stroke: false });
      }
      if (this.st === 'over' && this.result) {
        const r = this.result;
        c.fillStyle = 'rgba(12,10,20,.82)'; c.fillRect(86, 78, 468, 204);
        panel(c, 86, 78, 468, 204, '#221c33');
        G.icon(c, r.win === 'win' ? 'trofeo' : r.win === 'tie' ? 'empate' : 'derrota', 320, 96, 30); // ícono propio del resultado
        G.text(c, r.blackoutFixed ? '¡VOLVIÓ LA LUZ!' : 'LA LUZ VOLVIÓ TITILANDO…', 320, 122, { size: 18, color: r.blackoutFixed ? '#7dff8a' : '#ffd23f' });
        G.text(c, r.win === 'win' ? 'Reparación perfecta: ni un grito, ni un rasguño.' : r.win === 'tie' ? 'La luz volvió, con alguna historia que contar.' : 'No se reparó del todo… pero la noche sigue.', 320, 142, { size: 10, stroke: false });
        G.text(c, `Reparación ${r.repair}% · Aciertos ${r.correct}/10 · Errores ${r.errors}`, 320, 162, { size: 10.5, stroke: false });
        G.text(c, `Fantasmas confirmados: ${r.ghostsConfirmed} · Disfraces descubiertos: ${r.fakeGhostsFound}`, 320, 180, { size: 10, stroke: false });
        G.text(c, `${r.sleepwalkerFound ? 'Ximena sonámbula: encontrada y devuelta a su cama' : 'Ximena siguió durmiendo (eso creemos)'}`, 320, 198, { size: 9.5, stroke: false });
        G.text(c, `${r.decoDamage ? `Decoración dañada en el caos: ${r.decoDamage}` : 'Decoración intacta'}${r.pollitoEvent ? ' · Pollito apareció con una sábana' : ''}`, 320, 216, { size: 9.5, stroke: false });
        G.text(c, 'PUNTOS: ' + r.score, 320, 248, { size: 15, color: '#ffd23f', stroke: false });
      }
    }
    draw(dt) {
      const f = this.fig, P = this.p;
      const flick = this.phase === 3 && !this.lightsBack && this.st !== 'over' ? 0.82 + Math.random() * 0.36 : 1;
      const pts = [
        { x: P.x, y: 54, z: P.y, r: 205, c: [0.52, 0.48, 0.36] },   // la luz del celular del jugador
        { x: 655, y: 66, z: 120, r: 175 * flick, c: [0.15, 0.19, 0.33] }, // luna por la ventana (parpadea en fase 3)
      ];
      if (f && this.st !== 'over' && this.st !== 'intro') pts.push({ x: f.x, y: 52, z: f.z, r: 150, c: this.lightsBack ? [0.42, 0.4, 0.34] : [0.3, 0.33, 0.48] });
      W.render({
        cam: this.cam, dt, actors: [P], focusZ: 0,
        light: { amb: this.lightsBack ? [0.3, 0.29, 0.36] : [0.11, 0.11, 0.19], sun: [0.03, 0.03, 0.06], sky: '#07060c', points: pts },
        boxes: (mb) => { if (f && this.st !== 'over' && this.st !== 'intro') { mb.cyl(f.stageX + 48, 0, f.stageZ + 4, 9, 17, '#b5653a', { r2: 12 }); mb.cyl(f.stageX + 48, 17, f.stageZ + 4, 15, 13, '#3f8f4f', { r2: 5 }); } }, // la maceta con la que tropiezan (y que los fantasmas atraviesan)
        sprites: (t) => this.drawFigure(t),
        over: (c, t) => this.hudDraw(c, t),
      });
    }
  }

  G.Scenes = { CollectScene, HomeScene, DecoDuel, ChaseDuel, MessageDuel, PizzaRace, SleepwalkDuel, MemoryDuel, SpikeDuel, StompDuel, DroneDuel, ClimbDuel, buildDecoSet, BlackoutGame };
})();
