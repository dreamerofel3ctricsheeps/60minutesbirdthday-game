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

  // Validación de spawns: ningún actor de una escena con muebles puede
  // nacer dentro de uno sólido (quedaría atrapado: ver World.nearestFree).
  // Se aplica al construir la escena y al recolocar actores por ronda.
  const fixSpawn = (a, room) => { const [nx, ny] = W.nearestFree(a.x, a.y, room); a.x = nx; a.y = ny; return a; };

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
      // 'carried' (al hombro del jugador) → 'entering' (reclutado: hace
      // cola frente al armario y se METE DENTRO cuando la puerta se
      // abre) → 'inside' (dentro del armario: invisible e intocable el
      // resto de la recolección; asomará los ojos al llegar Ximena).
      // Al bajarlo sin reclutar vuelve a 'free' donde quedó.
      const npcRooms = ['cocina', 'sala', 'cuarto', 'pasillo', 'sala', 'cuarto'];
      this.others = G.PLAYABLE.filter((c) => c !== playerId).map((id, i) => {
        const room = npcRooms[i % npcRooms.length], pt = W.randomFreePoint(room);
        const a = new Actor(id, pt[0], pt[1]);
        a.state = 'free'; a.homeRoom = room; a.wt = 1 + i * 0.9; a.sprV = 0;
        return a;
      });
      this.carrying = null;          // NPC al hombro (Actor) o null
      this.partners = [];            // ids reclutados (máx. 3)
      // Guardado en el armario: cola de entregas y secuencia en curso.
      // Las entregas se registran AL INSTANTE (el partner cuenta aunque
      // la puerta esté ocupada con el anterior) y la animación de
      // abrir → entrar → cerrar se procesa de una en una.
      this.stashQueue = [];          // Actores 'entering' esperando su turno
      this.stashBusy = null;         // Actor en plena secuencia de guardado
      this.stashT = 0;               // temporizador de la fase en curso
      // Puestos de cola frente al armario para los que esperan turno.
      this.queueSpots = [[600, 376], [558, 386], [642, 386]];
      W.closet.k = 0; W.closet.target = 0; W.closet.wobble = 0;
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
      // Nace ya a la altura del apoyo de las manos del portador (no en el
      // suelo): el resorte solo tiene que asentar unos pocos unidades.
      o.elev = p.carrySupportY();
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
      o.carriedPose = false; o.elev = 0; o.jy = 0; o.jv = 0; o.expr = 'happy';
      o.x = p.x; o.y = p.y;
      // El reclutamiento se REGISTRA ya (partner +1, hombro libre): la
      // secuencia del armario es solo la puesta en escena. El roomie se
      // pone en la cola frente al armario y updateStash lo mete dentro.
      o.state = 'entering'; o.enterPhase = 'queue';
      this.partners.push(o.id);
      this.stashQueue.push(o);
      const spot = this.queueSpots[(this.stashQueue.length - 1) % this.queueSpots.length];
      o.goTo(spot[0], spot[1], 150);
      G.after(2.5, () => { if (o.state === 'entering') o.expr = null; });
      this.msg = { text: `✔ ¡${G.CHARS[o.id].name} se metió al armario! Partners ${this.partners.length}/3`, t: 2.2 };
      G.sfx('ok'); W.puff(o.x, o.y - 10, 5, true);
    }
    // Secuencia de guardado (una entrega a la vez, ~0,85 s por partner):
    // el de la cola camina al frente del armario → la puerta se ABRE →
    // salta y se mete en la oscuridad (se encoge un pelo al entrar) →
    // la puerta se CIERRA con un toquecito del mueble y el reclutado
    // queda 'inside': oculto, sin sprite ni sombra, intocable.
    updateStash(dt) {
      const C = W.closet;
      if (!this.stashBusy && this.stashQueue.length) {
        const o = this.stashQueue.shift();
        this.stashBusy = o; o.enterPhase = 'toDoor';
        o.goTo(600, 354, 175);
      }
      const o = this.stashBusy; if (!o) return;
      if (o.enterPhase === 'toDoor') {
        if (o.arrived) { o.enterPhase = 'open'; this.stashT = 0.26; C.target = 1; G.sfx('door'); }
      } else if (o.enterPhase === 'open') {
        if ((this.stashT -= dt) <= 0) { o.enterPhase = 'enter'; this.stashT = 0.38; o.dir = 'up'; o.hop(130); }
      } else if (o.enterPhase === 'enter') {
        o.y += (346 - o.y) * Math.min(1, dt * 10);
        o.scale += (0.86 - o.scale) * Math.min(1, dt * 8);
        if ((this.stashT -= dt) <= 0) {
          o.state = 'inside'; o.hidden = true; o.scale = 1; o.enterPhase = 'close'; this.stashT = 0.24; C.target = 0;
        }
      } else if (o.enterPhase === 'close') {
        if ((this.stashT -= dt) <= 0) { C.wobble = 1; G.sfx('door'); o.enterPhase = null; this.stashBusy = null; }
      }
    }
    update(dt) {
      const p = this.p; p.update(dt); this.others.forEach((o) => o.update(dt)); this.cat.update(dt); W.updateFx(dt);
      // Vida de los NPC: el que va al hombro se acopla al portador (su
      // elev persigue con resorte el apoyo de las manos levantadas); el reclutado
      // camina a su puesto y espera; el libre deambula por SU habitación
      // con gestos (sin pathfinding: rutas por puertas de World.path).
      this.others.forEach((o) => {
        if (o.state === 'carried') {
          o.x = p.x; o.y = p.y; o.dir = p.dir; o.jy = p.jy; o.moving = false; o.vx = o.vy = 0;
          // El pasajero descansa SOBRE las manos levantadas del portador:
          // el objetivo del resorte es el apoyo del frame carrywalk que el
          // portador está mostrando (p.carrySupportY: manos medidas en la
          // metadata × stretch + bob del portador). Antes el objetivo era
          // un elev FIJO de 46 que caía a la altura de la cara: el cuerpo
          // quedaba cruzado "detrás de la cabeza", sin relación con las
          // manos. Resorte casi crítico (k=140, c=22 → ζ≈0.93) y
          // desviación máxima ±6 u: rebote contenido, el pasajero nunca se
          // despega visualmente de las manos al caminar o correr.
          // (menos el hundimiento del torso carried: la línea base de la
          // pose la marca una extremidad colgando; el que apoya es el torso)
          const target = p.carrySupportY() - Sp.carriedRest(o.id) * (R.stretch || 1);
          o.sprV += ((target - o.elev) * 140 - o.sprV * 22) * dt; o.elev += o.sprV * dt;
          const dev = o.elev - target;
          if (dev > 6) { o.elev = target + 6; if (o.sprV > 0) o.sprV = 0; }
          else if (dev < -6) { o.elev = target - 6; if (o.sprV < 0) o.sprV = 0; }
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
      this.updateStash(dt);
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
        // Solo hablan los que están a la vista: libres o en la cola del
        // armario. Los de DENTRO ('inside') callan — están escondidos.
        const pool = this.others.filter((o) => o.state === 'free' || o.state === 'entering');
        if (pool.length) {
          const o = pool[(Math.random() * pool.length) | 0];
          const lines = this.time < 15
            ? ['¡YA VIENE!', '¡Escucho el ascensor!', '¡Guarda lo que tengas!', '¡Si no me reclutaste, me voy!']
            : this.partners.length < 3
              ? ['¡Apúrate!', '¡El pastel, el pastel!', 'Yo vigilo la puerta.', '¡No te olvides de guardar!', '¿Dónde quedaron los globos?', '¡Elige a tus 3 partners!', '¡A mí, al armario, porfa!']
              : ['¡Ya estamos los que somos!', '¡El pastel, el pastel!', 'Yo vigilo la puerta.', '¡No te olvides de guardar!'];
          o.say(lines[(Math.random() * lines.length) | 0], 2.2); o.hop(130);
        }
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
            if (this.nearStash && this.carrying) { const h = p.head(40); G.prompt(c, `ESPACIO: ${G.CHARS[this.carrying.id].name} al armario ✔`, h.x, h.y); }
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
          this.others.forEach((o) => { if (o.state === 'carried' || o.state === 'inside') return; c.fillStyle = o.state === 'entering' ? '#7dff8a' : '#b9b0d6'; c.fillRect(mx + 1 + o.x * k, my + 1 + o.y * k, 3, 3); });
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
            G.text(c, 'Carga roomies (ESPACIO junto a ellos) y mételos en el ARMARIO: tus 3 partners se quedan toda la noche', 320, 244, { size: 9, bold: false });
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
      // OJOS EN EL ARMARIO: durante la llegada de Ximena, los partners
      // están DENTRO del armario (hidden) y solo asoman los ojos por la
      // rendija entreabierta. closetPeek = ids en orden de guardado
      // (se apilan de abajo arriba en la rendija); null = nadie mira.
      this.closetPeek = null;
      W.closet.k = 0; W.closet.target = 0; W.closet.wobble = 0;
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
    // Los ojos de los partners asomando por la rendija del armario:
    // para cada guardado se dibuja la BANDA DE SUS OJOS recortada de
    // su frame idle frontal (Sp.eyeBand: son SUS ojos, con su forma),
    // atenuada por la sombra del interior, apilados a distintas
    // alturas dentro de la rendija (como si se hubieran subido unos
    // sobre otros para mirar). Parpadean con el blink de su actor y
    // se mecen apenas, siguiendo a Ximena con la mirada. Fallback si
    // un personaje no tuviera ojos en su metadata: ojos por código
    // con el iris de su color.
    drawClosetEyes(c, t) {
      const ids = this.closetPeek; if (!ids || !ids.length) return;
      ids.forEach((id, i) => {
        const a = this.roomies.find((r) => r.id === id);
        const q = R.project(600, 34 + i * 21, 341);
        if (!q.ok) return;
        const sway = Math.sin(t * 0.7 + i * 1.9) * 1.3;
        const blink = !!(a && a.blink < 0);
        const band = Sp.eyeBand(id);
        if (band && band.width > 2) {
          const wpx = 30, hpx = Math.max(3, (wpx * band.height) / band.width);
          const hh = blink ? Math.max(1.6, hpx * 0.16) : hpx;
          c.globalAlpha = 0.95;
          c.drawImage(band, q.x - wpx / 2 + sway, q.y - hh / 2, wpx, hh);
          c.globalAlpha = 1;
          c.fillStyle = 'rgba(10,6,16,0.35)'; // la sombra del interior del armario
          c.fillRect(q.x - wpx / 2 + sway, q.y - hh / 2, wpx, hh);
        } else {
          const col = (G.CHARS[id] || {}).color || '#fff', ex = q.x + sway, ey = q.y;
          if (blink) { c.fillStyle = '#d8d2c4'; c.fillRect(ex - 10, ey - 0.7, 8, 1.4); c.fillRect(ex + 2, ey - 0.7, 8, 1.4); }
          else {
            [-6, 6].forEach((dx) => {
              c.fillStyle = '#f4f1ea'; c.beginPath(); c.ellipse(ex + dx, ey, 4.6, 3.4, 0, 0, 6.3); c.fill();
              c.fillStyle = col; c.beginPath(); c.ellipse(ex + dx, ey, 2.2, 2.2, 0, 0, 6.3); c.fill();
              c.fillStyle = '#14100c'; c.beginPath(); c.ellipse(ex + dx, ey, 1.1, 1.1, 0, 0, 6.3); c.fill();
            });
          }
        }
      });
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
          if (this.closetPeek) this.drawClosetEyes(c, t);
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
      fixSpawn(this.p, 'sala'); fixSpawn(this.cat, 'sala'); // spawns validados contra los muebles (ver World.nearestFree)
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
    // Spawns por ronda: pares = jugador abajo-izquierda y Pollito arriba-
    // derecha; impares = esquinas cruzadas. OJO: el spawn impar original
    // del jugador era (900, 240), que cae DENTRO de la mesa de fiesta
    // (ptable: x 800–930, y 200–245): nacía parado sobre la mesa y no
    // podía moverse en ninguna dirección (walk exige canStand en el
    // destino y desde dentro todo paso sigue dentro del mueble). El
    // punto correcto es (900, 264), justo debajo de la mesa. Y como red
    // permanente, ambos spawns pasan por fixSpawn (World.nearestFree):
    // si el layout cambia, se reubican al piso libre más cercano.
    setup(n) { const p = this.p, c = this.cat; [p.x, p.y] = n % 2 ? [900, 264] : [420, 200]; [c.x, c.y] = n % 2 ? [400, 100] : [860, 110]; fixSpawn(p, 'sala'); fixSpawn(c, 'sala'); p.vx = p.vy = c.vx = c.vy = 0; p.spin = 0; this.dashT = 0; this.cd = 0; this.dx = n % 2 ? -1 : 1; this.dy = 0; this.stun = 0; this.inv = 0; this.juke = 1.5; this.jukeT = 0; this.toys = []; this.toyT = 3; this.hd = { x: 0, y: 1 }; }
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
      fixSpawn(this.p, 'sala'); fixSpawn(this.jose, 'sala'); fixSpawn(this.xi, 'sala'); // spawns validados contra los muebles
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
      fixSpawn(this.p, 'sala'); fixSpawn(this.jose, 'sala'); // José nacía 1 u dentro de la mesa de fiesta: sin movimiento no se atascaba, pero tampoco debe nacer dentro de un mueble
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
      // el jugador se valida contra los muebles de la cocina; Pollito NO:
      // está elevado (elev=40) sentado sobre la encimera a propósito
      fixSpawn(this.p, 'cocina');
    }
    setup(n) { const p = this.p; p.x = 180; p.y = 255; fixSpawn(p, 'cocina'); p.vx = p.vy = 0; p.spin = 0; this.balls = []; for (let i = 0; i < n + 2; i++) this.spawn(i * 0.5); this.next = 3.4; }
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
  // gag físico de ingravidez). En el espacio además hay GALAXIAS
  // (espirales y una elíptica pintadas por código, en la capa más
  // lejana con parallax y densidad creciente con la altura) y cada
  // 12–18 s pasa EL COHETE DE LOS HUIDOS: los roomies NO elegidos
  // (G.S.fled; en práctica, todos menos el elegido) saludan desde las
  // ventanillas — "ya nos íbamos", y se fueron lejos de verdad (guiño
  // sin emoticones: la primera vez el protagonista lo dice en burbuja).
  // El fondo (cielo y luz) interpola suave
  // entre zonas según la altura de la cámara, y cada zona se anuncia
  // una sola vez al cruzarla con la altura máxima.
  // CÁMARA: sigue al jugador en vertical con suavidad — sube ágil
  // (4,5/s) y baja lenta (2,0/s) para no marear con las caídas — y
  // nunca baja del nivel del suelo. La altura máxima se siente
  // conquistada porque el marcador ▲ y los hitos son de la MÁXIMA.
  // POLLITO: escala en su propia columna con el ritmo de siempre
  // (cstep con jitter y distracciones; pollitoOfendido lo acelera y el
  // stat velocidad del jugador lo ajusta como antes).
  // DE ESPALDAS (ajuste de Jose, 2026-11-14): trepar un librero se ve
  // desde atrás. El jugador va SIEMPRE de espaldas (dir 'up': reposo
  // idle_up, salto walk_up en vertical y run_up en diagonal — la
  // dirección del salto la leen la posición destino y el prompt ←/→, y
  // el cuerpo se inclina un pelo hacia el lado del salto vía a.tilt).
  // Pollito igual: usa su vista TRASERA (back_idle quieto, back_jump en
  // el aire, forzada con a.backPose en world.js) — arte nuevo generado
  // para su bundle, porque solo traía frontal/perfil/pounce; de
  // espaldas la mancha del cachete no se ve (correcto) y nunca se
  // espeja. Nada de frontales ni perfiles en este duelo.
  // SALTO FLUIDO (mismo ajuste): el desplazamiento entre repisas ya no
  // es un lerp exponencial con un hop() cosmético (se sentía
  // escalonado, casi teletransporte): cada salto es una trayectoria con
  // easing (startHop/advanceClimber) — impulso, ápice sobre la línea
  // recta, asentamiento exacto con squash y polvo — y el ciclo de
  // animación trasera avanza sincronizado con la fase del salto. La
  // caída al fallar también es un arco (acelerando), no un salto de
  // posición; el spin antiguo se retiró porque rotaba al personaje por
  // sus vistas frontal/perfil y rompía el "siempre de espaldas".
  // =========================================================
  const SH = 27, U_PER_M = 25, CLIMB_TIME = 60;
  const TECHO_E = 14 * SH, AZOTEA_E = 750, CIELO_E = 2250, ESPACIO_E = 5000;
  // El cohete de los huidos tiene su PROPIO umbral (pedido de Jose,
  // 2026-11-17): aparece desde los 145 m, por debajo de la zona
  // espacio (200 m) — cruza ya en la estratósfera alta. La zona
  // espacio (galaxias, ingravidez, clave de luz) NO se mueve.
  const ROCKET_E = 145 * U_PER_M;
  // TELESCOPIO de la siembra del final J1407b (diseño aprobado por
  // Jose): prop decorativo DIBUJADO POR CÓDIGO sobre una plataforma
  // alta de la Escalada — NO es ítem de recolección (los 12 spawns del
  // mundo ya están completos con los ítems de Leyendas). Vive DENTRO
  // de la zona espacio, un poco sobre su umbral: solo se ve si la
  // escalada llega de verdad al espacio.
  const TELESCOPE_E = ESPACIO_E + 120;
  const telescopeAt = (cy) => TELESCOPE_E > cy - 270 && TELESCOPE_E < cy + 290; // misma banda que drawWorld (lo/hi)
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
  // Easings de la TRAYECTORIA del salto entre repisas (arco continuo):
  // inOut para el desplazamiento lateral, smootherstep para la subida
  // flotante en el espacio (arranque y llegada suaves en ambos extremos).
  const climbEaseInOut = (u) => u < 0.5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2;
  const climbSmoother = (u) => u * u * u * (u * (u * 6 - 15) + 10);
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
  // ---------- Galaxias del espacio profundo ----------
  // Se pintan UNA vez en canvas (3 variantes) con puntitos y brillos en
  // la paleta suave del juego (morados, rosas, azules): dos ESPIRALES de
  // dos brazos y una ELÍPTICA inclinada de núcleo cálido. En escena van
  // como billboards en la capa MÁS LEJANA (z = -470, detrás de las
  // estrellas de z = -300 y de la luna de z = -390): al moverse la
  // cámara pesan menos en pantalla que todo lo demás (parallax).
  let galaxyCvs = null;
  const galRnd = (s) => { const v = Math.sin(s * 127.1 + 311.7) * 43758.5453; return v - Math.floor(v); };
  const galRgba = (h, a) => `rgba(${parseInt(h.slice(1, 3), 16)},${parseInt(h.slice(3, 5), 16)},${parseInt(h.slice(5, 7), 16)},${a})`;
  function makeGalaxyCv(v) {
    const cv = document.createElement('canvas'); cv.width = cv.height = 168;
    const x = cv.getContext('2d'), C = 84;
    const PAL = [['#ffb7e3', '#c9a7ff', '#8fb7ff'], ['#aee9ff', '#8fb7ff', '#c9a7ff'], ['#ffd9a0', '#ffb7a0', '#a8c8ff']][v];
    let g = x.createRadialGradient(C, C, 2, C, C, 82); // halo tenue general
    g.addColorStop(0, 'rgba(255,255,255,.5)'); g.addColorStop(0.3, galRgba(PAL[1], 0.26)); g.addColorStop(1, 'rgba(0,0,0,0)');
    x.fillStyle = g; x.fillRect(0, 0, 168, 168);
    const dot = (px, py, s, col, a) => { x.globalAlpha = a; x.fillStyle = col; x.beginPath(); x.arc(px, py, s, 0, 6.3); x.fill(); };
    if (v === 2) { // ELÍPTICA: halo alargado e inclinado, sin brazos
      x.save(); x.translate(C, C); x.rotate(-0.5); x.scale(1, 0.44);
      g = x.createRadialGradient(0, 0, 2, 0, 0, 80);
      g.addColorStop(0, 'rgba(255,246,230,.95)'); g.addColorStop(0.35, galRgba(PAL[0], 0.55)); g.addColorStop(0.75, galRgba(PAL[2], 0.20)); g.addColorStop(1, 'rgba(0,0,0,0)');
      x.fillStyle = g; x.beginPath(); x.arc(0, 0, 80, 0, 6.3); x.fill();
      for (let i = 0; i < 170; i++) { const a = galRnd(i * 3.1 + 7) * 6.283, r = Math.pow(galRnd(i * 7.7 + 3), 0.6) * 74; dot(Math.cos(a) * r, Math.sin(a) * r, 0.8 + galRnd(i * 13.7) * 1.5, PAL[i % 3], 0.25 + galRnd(i * 5.3) * 0.5); }
      x.restore();
    } else { // ESPIRAL: dos brazos de puntitos que se abren desde el núcleo
      const twist = v === 0 ? 3.3 : 4.2;
      for (let a = 0; a < 2; a++) for (let i = 0; i < 150; i++) {
        const tt = i / 150, ang = a * Math.PI + tt * twist + (galRnd(v * 977 + a * 131 + i * 3) - 0.5) * 0.4;
        const r = 5 + tt * 66 + (galRnd(v * 331 + a * 57 + i * 7) - 0.5) * 10;
        dot(C + Math.cos(ang) * r, C + Math.sin(ang) * r * 0.84, 0.8 + (1 - tt) * 1.7 + galRnd(i * 11 + a) * 1.3, PAL[i % 5 === 4 ? 2 : (a + (i % 2)) % 2], 0.28 + (1 - tt) * 0.55);
      }
      g = x.createRadialGradient(C, C, 0, C, C, 17); // núcleo brillante
      g.addColorStop(0, 'rgba(255,255,255,.98)'); g.addColorStop(0.5, galRgba(PAL[0], 0.75)); g.addColorStop(1, 'rgba(0,0,0,0)');
      x.fillStyle = g; x.beginPath(); x.arc(C, C, 17, 0, 6.3); x.fill();
    }
    for (let i = 0; i < 7; i++) { // estrellitas con destello en cruz
      const px = 14 + galRnd(v * 71 + i * 17) * 140, py = 14 + galRnd(v * 43 + i * 23) * 140;
      x.globalAlpha = 0.85; x.fillStyle = '#ffffff';
      x.fillRect(px - 0.75, py - 3.5, 1.5, 7); x.fillRect(px - 3.5, py - 0.75, 7, 1.5); x.fillRect(px - 1, py - 1, 2, 2);
    }
    x.globalAlpha = 1;
    return cv;
  }
  function galaxyCv(v) { if (!galaxyCvs) galaxyCvs = [makeGalaxyCv(0), makeGalaxyCv(1), makeGalaxyCv(2)]; return galaxyCvs[v]; }
  // Campo de galaxias visible a la altura de cámara cy: colocación por
  // tramos de 620 u con el hash determinista de siempre. Solo existen
  // en el ESPACIO (y por encima de ~5000 u) y la DENSIDAD crece con la
  // altura: al entrar hay ~1 por tramo; muy arriba, hasta 2 por tramo.
  function climbGalaxies(cy) {
    const out = [], TR = 620;
    for (let g = Math.floor((cy - 430) / TR); g <= Math.floor((cy + 470) / TR); g++) {
      const gy = g * TR + 110 + climbHash(g * 3.17 + 51) * 390;
      if (gy < ESPACIO_E - 40) continue;
      const n = 1 + (climbHash(g * 7.77 + 5) < Math.min(0.75, Math.max(0, (gy - ESPACIO_E) / 5200)) ? 1 : 0);
      for (let j = 0; j < n; j++) {
        const h1 = climbHash(g * 13.3 + j * 29.7 + 8), h2 = climbHash(g * 5.9 + j * 47.1 + 23);
        out.push({ x: -440 + h1 * 880, y: gy + j * 215 + h2 * 80, v: Math.floor(h2 * 2.99), s: 128 + h1 * 105, roll: (h1 - 0.5) * 1.15 + j * 0.8, a: Math.max(0, Math.min(1, (gy - ESPACIO_E + 170) / 430)) * 0.92 });
      }
    }
    return out;
  }
  // Cara de un roomie para las ventanillas del cohete de los huidos:
  // recorte cuadrado de su frame idle frontal centrado en los ojos
  // detectados de su hoja definida (la cara que se ve en el retrato).
  const rocketFaceCache = {};
  function rocketFaceCv(id) {
    if (rocketFaceCache[id]) return rocketFaceCache[id];
    const meta = Sp.META.chars[id], src = Sp.frame(id, 'idle', 0);
    const cv = document.createElement('canvas'); cv.width = cv.height = 56; cv._scale = 0.3;
    const es = (meta.eyes || {})[meta.anims.idle[0]];
    const cx = es && es.length ? es.reduce((s, e) => s + e.x, 0) / es.length : meta.fw / 2;
    const cyy = es && es.length ? es[0].y : meta.top + 34, S = 98;
    cv.getContext('2d').drawImage(src, cx - S / 2, cyy - S * 0.44, S, S, 0, 0, 56, 56);
    rocketFaceCache[id] = cv; return cv;
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
      // EL COHETE DE LOS HUIDOS (desde los 145 m, ROCKET_E): null =
      // fuera de escena; rocketWait = cuenta atrás para el próximo
      // pase (el primero llega a los ~6 s de cruzar el umbral; luego
      // cada 12–18 s). rocketDir alterna el sentido de cada pase.
      this.rocket = null; this.rocketWait = 6; this.rocketDir = -1; this.rocketSeen = false;
      this._sb = 0; this._sv = []; // ventana de lados generados desde el índice _sb (se poda: ver pruneSides)
      this.cstep = 0.44 * (G.S.flags.pollitoOfendido ? 0.93 : 1) + (10 - stat(this.who, 'velocidad')) * -0.004;
      this.hop = { p: null, c: null }; this.bufDir = 0; // salto en curso por columna (arco) y tecla guardada en buffer
      this.place(this.p, -70, 0, true); this.place(this.cat, 70, 0, true);
      // DE ESPALDAS todo el duelo (ver la nota en la cabecera de la
      // escena): el jugador con dir 'up' permanente y Pollito con su
      // pose trasera forzada desde el primer cuadro.
      this.p.dir = 'up'; this.cat.dir = 'up'; this.cat.backPose = { anim: 'back_idle', idx: 0 };
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
    place(a, base, i, snap) {
      const q = this.shelfAt(base, i); a.tx = q.x; a.te = q.e;
      if (snap) { a.x = q.x; a.elev = q.e; return; }
      this.startHop(a === this.p ? 'p' : 'c', i); // sin snap: salto con arco continuo (ver startHop)
    }
    // SALTO CON ARCO CONTINUO (ajuste de Jose, 2026-11-14): antes el
    // escalador se movía por un lerp exponencial hacia la repisa con un
    // hop() cosmético encima — el desplazamiento se sentía escalonado,
    // casi un teletransporte corto. Ahora cada salto es una TRAYECTORIA
    // con easing de principio a fin (advanceClimber la integra): impulso
    // (easeOut), ápice por encima de la línea recta (término seno) y
    // asentamiento exacto sobre la repisa con squash y polvito. La
    // duración depende del tramo: vertical puro 0,24 s (walk_up),
    // diagonal ±56 u 0,28 s (run_up), caída al fallar 0,30 s acelerando
    // (easeIn). En el ESPACIO todo dura ×1,5 y el arco es más alto: la
    // flotación también es fluida, no un lerp lento.
    startHop(col, idx) {
      const a = col === 'p' ? this.p : this.cat, base = col === 'p' ? -70 : 70;
      const q = this.shelfAt(base, idx);
      const kind = q.e >= a.elev ? 'up' : 'fall';
      const dx = q.x - a.x, space = Math.max(q.e, a.elev) >= ESPACIO_E;
      let dur = kind === 'fall' ? 0.30 : dx === 0 ? 0.24 : 0.28;
      if (space) dur *= 1.5;
      this.hop[col] = { fx: a.x, fe: a.elev, tx: q.x, te: q.e, t: 0, dur, kind, dx, space, hopH: kind === 'fall' ? 2.5 : space ? 16 : 9, idx };
      a.moving = true; a.jy = 0; a.jv = 0; // el arco vive en elev; jy queda solo para el vaivén espacial en reposo
    }
    // Avanza el salto en curso de una columna (o su reposo). El ciclo de
    // animación trasera del jugador avanza SINCRONIZADO con la fase del
    // salto: step recorre el ciclo entero entre el impulso y el
    // aterrizaje (contacto→pase→contacto opuesto→pase en walk_up; los 4
    // frames de run_up en diagonal) y el cuerpo se inclina un pelo
    // hacia el lado del salto (a.tilt). Pollito alterna sus dos frames
    // traseros: estirado en la primera mitad del vuelo, recogido en la
    // segunda.
    advanceClimber(col, dt) {
      const a = col === 'p' ? this.p : this.cat, h = this.hop[col];
      if (!h) {
        // reposo: en el espacio, vaivén de ingravidez (jy es solo el
        // desplazamiento visual del sprite; la lógica vive en elev)
        if (a.elev >= ESPACIO_E) { a.jy = 2.4 + Math.sin(this.T * 2.2 + (col === 'c' ? 1.7 : 0)) * 2; a.jv = 0; }
        return;
      }
      h.t += dt;
      const u = Math.min(1, h.t / h.dur);
      const eu = h.kind === 'up' ? (h.space ? climbSmoother(u) : 1 - Math.pow(1 - u, 2)) : u * u;
      a.x = h.fx + (h.tx - h.fx) * climbEaseInOut(u);
      a.elev = h.fe + (h.te - h.fe) * eu + Math.sin(Math.PI * u) * h.hopH;
      if (col === 'p') {
        a.step = u * Math.PI * (h.dx ? 3 : 2); // ciclo sincronizado con la fase (ver arriba)
        a.lastStep = Math.floor(a.step / Math.PI); // sin puffs de pisada: el polvo de este duelo es el de la repisa
        a.vx = h.dx ? 200 : 0; // spd > RUN_SPD en diagonal -> run_up; vertical puro -> walk_up
        a.tilt = (h.dx ? Math.sign(h.dx) : 0) * 0.10 * Math.sin(Math.PI * u); // leve inclinación hacia el lado del salto
      } else a.backPose = { anim: 'back_jump', idx: u < 0.45 ? 0 : 1 };
      if (u < 1) return;
      // ATERRIZAJE: posición exacta sobre la repisa, squash breve y polvito
      a.x = h.tx; a.elev = h.te; a.moving = false; a.tilt = 0; a.vx = 0; a.squash = h.kind === 'fall' ? 0.16 : 0.1;
      for (let j = 0; j < 3; j++) this.puffs.push({ x: h.tx, y: h.te, t: -j * 0.03, seed: j * 2.4 + h.idx * 1.7 });
      this.hop[col] = null;
      if (col === 'c') a.backPose = { anim: 'back_idle', idx: 0 };
      // la repisa nueva nace SOLO al asentarse sobre la máxima (como siempre)
      if (h.idx === (col === 'p' ? this.pMax : this.cMax)) this.bornUp(col, h.idx);
      // la tecla guardada en pleno vuelo se ejecuta al aterrizar: el ritmo no se corta
      if (col === 'p' && this.bufDir && this.stun <= 0) { const b = this.bufDir; this.bufDir = 0; this.climbInput(b); }
    }
    // Una intención de salto del jugador (tecla directa o buffer al aterrizar).
    climbInput(k) {
      const p = this.p;
      if (k === this.sideOf(this.pi)) { this.pi++; if (this.pi > this.pMax) this.pMax = this.pi; this.place(p, -70, this.pi); G.sfx('pick'); }
      else { // resbalón: CAES a la repisa anterior con el arco de caída (la máxima queda)
        this.stun = 0.38; this.bufDir = 0; p.emo('💦', 0.7); G.sfx('bad'); G.addNoise(2);
        if (this.pi > 0) { this.pi--; this.place(p, -70, this.pi); }
      }
    }
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
    // Tripulación del cohete del espacio: los roomies que NO están en
    // la party. En la historia son los que HUYERON (G.S.fled, la lista
    // que fija la llegada de Ximena); en práctica no hay party de
    // historia, así que van todos los roomies menos el elegido para
    // practicar. Si la lista saliera vacía, el cohete no pasa.
    rocketCrew() {
      if (G.practiceMode) return G.PLAYABLE.filter((id) => id !== this.who);
      const fled = (G.S && G.S.fled) || [];
      if (fled.length) return fled.slice();
      const party = (G.S && G.S.party) || [];
      return G.PLAYABLE.filter((id) => id !== this.who && !party.includes(id));
    }
    meters(i) { return Math.round((i * SH) / U_PER_M); }
    // space: la altura máxima del JUGADOR alcanzó la zona ESPACIO en
    // esta Escalada (lo usa la historia: ver MG.repisas.resolve y
    // G.spaceReady en game.js — condición 1 del final J1407b).
    extra() { return { pMeters: this.meters(this.pMax), cMeters: this.meters(this.cMax), zone: CLIMB_ZONES[climbZone(this.pMax * SH)].name, space: this.pMax * SH >= ESPACIO_E }; }
    zoneBanner(z) {
      // cada hito lleva su ÍCONO PROPIO del juego (nada de emoticones)
      const B = [null,
        { a: '¡SALISTE DEL TECHO!', b: 'El librero sigue… ¿hasta dónde llega?', icon: 'techo' },
        { a: '¡YA SE VE TODO LIMA!', b: 'Las nubes quedan abajo', icon: 'ciudad' },
        { a: 'ESTRATÓSFERA', b: 'El cielo se oscurece…', icon: 'luna' },
        { a: '¡FUERA DEL PLANETA!', b: 'Pollito también flota. Nadie entiende nada.', icon: 'planeta' }][z];
      // d breve (~1,4 s): el anuncio se dibuja como CHIP compacto en
      // la franja superior (ver draw), no como la banda central de
      // antes, que tapaba el juego durante 3 s (pedido de Jose,
      // 2026-11-17). El subtítulo b ya no se muestra: el chip lleva
      // solo ícono + titular.
      if (B) this.banner = { a: B.a, b: B.b, icon: B.icon, t: 0, d: 1.4 };
    }
    update(dt) {
      const p = this.p, cat = this.cat;
      [p, cat].forEach((a) => a.update(dt));
      // TRAYECTORIAS: el arco continuo de cada salto en curso (o el
      // reposo, con su vaivén en el espacio). NACIMIENTO AL ATERRIZAR:
      // cuando un escalador se ASIENTA sobre su repisa más alta (recién
      // conquistada), advanceClimber dispara bornUp y nace la siguiente
      // de la siguiente en su columna. Nunca antes, nunca por banda lejana.
      this.advanceClimber('p', dt); this.advanceClimber('c', dt);
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
      // EL COHETE DE LOS HUIDOS: solo con la cámara sobre su umbral
      // propio (ROCKET_E = 145 m, bajo la zona espacio). Cruza en
      // horizontal por el FONDO (z=-182..-160, detrás de repisas y
      // actores), a la altura de la banda de la cámara como el
      // satélite, sin colisionar ni tapar el prompt. La primera vez
      // el protagonista reacciona: el chiste es que los que "ya se
      // iban"… se fueron LEJOS de verdad.
      if (this.cam.y >= ROCKET_E) {
        if (this.rocket) {
          this.rocket.x += this.rocket.dir * 135 * dt;
          if (Math.abs(this.rocket.x) > 620) { this.rocket = null; this.rocketWait = 12 + climbHash(Math.floor(this.T)) * 6; }
        } else if ((this.rocketWait -= dt) <= 0) {
          const crew = this.rocketCrew();
          if (crew.length) {
            this.rocketDir = -this.rocketDir;
            this.rocket = { x: this.rocketDir > 0 ? -580 : 580, dir: this.rocketDir, crew };
            if (!this.rocketSeen) { this.rocketSeen = true; p.say('¿¡Esos eran los que se fueron!?', 3.4); }
          } else this.rocketWait = 5; // sin tripulación posible: no pasa (y no revienta)
        }
      }
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
          // en pleno vuelo la tecla no se pierde: queda en buffer (la
          // última manda) y se ejecuta al aterrizar — escalar a ritmo
          // no castiga el timing del jugador
          if (this.hop.p) this.bufDir = k; else this.climbInput(k);
        } else if (this.bufDir && !this.hop.p) { const b = this.bufDir; this.bufDir = 0; this.climbInput(b); }
      }
      // Pollito: su reloj corre siempre, pero solo salta ASENTADO — su
      // ritmo por repisa queda ≈ max(cstep, duración del arco), el de siempre
      if ((this.ct -= dt) <= 0 && !this.hop.c) { this.ct = this.cstep + rnd(-0.08, 0.1) + (Math.random() < 0.1 ? 0.5 : 0); this.ci++; if (this.ci > this.cMax) this.cMax = this.ci; this.place(cat, 70, this.ci); }
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
      // EL COHETE DE LOS HUIDOS cruzando (desde los 145 m, ROCKET_E):
      // cuerpo por cajas (las CARAS de las ventanillas van como
      // billboards en el callback sprites de draw, a z=-160, sobre
      // estos aros). Vuela a la altura de la banda de la cámara, como
      // el satélite, y por el fondo: no tapa el prompt ni colisiona.
      if (cy >= ROCKET_E && this.rocket) {
        const rk = this.rocket, ry = cy + 135, n = rk.crew.length, L = 44 + n * 30, x0 = rk.x - L / 2, dir = rk.dir;
        mb.box(x0, ry - 12, -182, L, 24, 13, '#e9edf5', { top: '#f8fafc' }); // cuerpo
        mb.box(x0 + 4, ry - 12, -183, L - 8, 6, 15, '#e23b4e'); // franja roja
        const nx = dir > 0 ? x0 + L : x0; // morro escalonado hacia el avance
        mb.box(dir > 0 ? nx : nx - 12, ry - 9, -181, 12, 18, 11, '#dfe6f2');
        mb.box(dir > 0 ? nx + 12 : nx - 21, ry - 6, -180, 9, 12, 9, '#e23b4e');
        const tx = dir > 0 ? x0 : x0 + L; // aletas traseras
        mb.box(dir > 0 ? tx - 3 : tx - 5, ry + 10, -180, 8, 13, 9, '#e23b4e');
        mb.box(dir > 0 ? tx - 3 : tx - 5, ry - 23, -180, 8, 13, 9, '#e23b4e');
        const fl = 9 + Math.sin(t * 34) * 3.5; // llama del motor, parpadeante
        mb.box(dir > 0 ? tx - 4 - fl : tx + 4, ry - 4, -179, fl, 8, 7, '#ffb03a', { emit: true });
        mb.box(dir > 0 ? tx - 4 - fl * 0.55 : tx + 4 + fl * 0.45, ry - 2, -178, fl * 0.55, 4, 5, '#ff7847', { emit: true });
        for (let i = 0; i < n; i++) { const wx = rk.x + (i - (n - 1) / 2) * 30; mb.box(wx - 10, ry - 10, -168, 20, 20, 3, '#9fd8ff', { emit: true }); } // aros de ventanilla
      }
      // TELESCOPIO (siembra de J1407b): plataforma con telescopio de
      // latón a la derecha de las columnas; solo entra en escena en la
      // zona espacio (su elevación supera el umbral ESPACIO_E). Es un
      // prop dibujado por código, sin imágenes ni ítem asociado.
      if (TELESCOPE_E > lo && TELESCOPE_E < hi) {
        const tx = 214, tz = -30, te = TELESCOPE_E;
        mb.box(tx, te - 34, tz, 7, 60, 7, '#4a3a28'); // poste de la plataforma
        mb.box(tx, te - 5, tz, 84, 5, 36, '#5a4632'); // tablón
        mb.box(tx, te - 8, tz, 88, 2, 40, '#3c2d1e'); // borde del tablón
        mb.cyl(tx, te, tz, 5, 12, '#8a7a5c'); // montura
        for (let k = 0; k < 4; k++) mb.box(tx - 8 - k * 8, te + 12 + k * 5, tz, 13, 8, 8, k === 3 ? '#7a5c22' : '#c9a44a'); // tubo inclinado
        mb.box(tx + 4, te + 6, tz, 6, 6, 6, '#5c4a26'); // ocular
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
        sprites: (t) => {
          const z = climbZone(cy);
          if (z >= 3) R.flat(R.glowTex, 305, cy + 175, -390, 58, { tint: [0.92, 0.96, 1], alpha: 0.95 }); // la luna
          if (z >= 4) {
            // GALAXIAS: la capa más lejana (z=-470), detrás de las
            // estrellas; colocación por tramos con hash y densidad
            // creciente con la altura (ver climbGalaxies)
            for (const gx of climbGalaxies(cy)) R.sprite(galaxyCv(gx.v), gx.x, gx.y - gx.s / 2, -470, { w: gx.s, h: gx.s, roll: gx.roll, alpha: gx.a * (0.86 + 0.14 * Math.sin(t * 0.6 + gx.x * 0.05)), lit: 0, nostretch: true });
            R.flat(R.glowTex, -30, cy - 320, -280, 330, { tint: [0.30, 0.50, 1], alpha: 0.5 }); // el planeta, brillando abajo
          }
          // las CARAS de la tripulación saludando desde las
          // ventanillas del cohete (vaivén y balanceo suaves). El
          // cohete vuela desde los 145 m (ROCKET_E), antes de la zona
          // espacio: sus caras se dibujan con su mismo umbral, no con
          // el de las galaxias.
          if (this.rocket && cy >= ROCKET_E) {
            const ry = cy + 135, n = this.rocket.crew.length;
            this.rocket.crew.forEach((id, i) => {
              const wx = this.rocket.x + (i - (n - 1) / 2) * 30;
              R.sprite(rocketFaceCv(id), wx, ry - 8 + Math.sin(t * 3.1 + i * 1.35) * 1.3, -160, { nostretch: true, lit: 0, roll: Math.sin(t * 2.3 + i * 1.1) * 0.07 });
            });
          }
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
          if (this.banner) {
            // CHIP DE ZONA (pedido de Jose, 2026-11-17): pastilla
            // compacta en la FRANJA SUPERIOR, bajo el HUD del duelo
            // (paneles hasta y=48) y la línea «vas ganando» (ícono
            // y=54, texto y=74): la caja queda confinada a y 88–114 y
            // solo es tan ancha como su texto. Antes era una banda a
            // todo ancho en el centro (y 122–226, 3 s) que tapaba las
            // repisas siguientes y distraía en plena subida.
            const b = this.banner, a = Math.min(1, b.t * 4, (b.d - b.t) * 2.5);
            c.globalAlpha = Math.max(0, a);
            c.font = `bold 13px ${G.FONT}`;
            const w = c.measureText(b.a).width + 48, x = 320 - w / 2;
            c.fillStyle = 'rgba(20,16,30,.8)'; c.beginPath(); c.roundRect(x, 88, w, 26, 13); c.fill();
            if (b.icon) G.icon(c, b.icon, x + 21, 101, 17);
            G.text(c, b.a, x + 34, 101.5, { size: 13, color: '#ffd23f', align: 'left', lw: 4 });
            c.globalAlpha = 1;
          }
        },
      });
    }
  }
  ClimbDuel.SHELF_H = SH; // expuesto para la prueba de humo (los lados se piden a una instancia: sideOf)
  ClimbDuel.ROCKET_E = ROCKET_E; // ídem: el umbral propio del cohete (145 m en unidades)
  ClimbDuel.galaxiesAt = climbGalaxies; // ídem: el campo de galaxias visible a una altura de cámara
  ClimbDuel.TELESCOPE_E = TELESCOPE_E; // ídem: elevación del telescopio (siembra de J1407b)
  ClimbDuel.telescopeAt = telescopeAt; // ídem: ¿el telescopio entra en la banda de cámara cy?

  // =========================================================
  // 11. APAGÓN: VELAS CONTRA JOSÉ — adaptación de Lit Potato /
  // Candlelight (diseño aprobado por Jose, 2026-11-14). Reemplaza
  // POR COMPLETO al minijuego anterior del apagón («¿Fantasma o
  // disfraz?»): de él no queda nada — ni la escena, ni sus flags
  // (fantasmas, ruta paranormal, daño), ni sus textos.
  // LA CASA ENTERA queda a oscuras, con 26 velas apagadas repartidas
  // por las 5 habitaciones. El jugador y JOSÉ (el rival, no Pollito)
  // corren prendiendo velas: mantener ESPACIO junto a una vela la
  // prende tras ~0,6 s de canalización (anillo de progreso; moverse
  // o soltar la tecla lo cancela). Junto a una vela DE JOSÉ, ESPACIO
  // sostenido la SOPLA (~0,9 s) y queda apagada para cualquiera.
  // Llamas distinguibles de un vistazo: la del jugador es cálida
  // (ámbar) y la de José es verdosa. Cada vela prendida ilumina su
  // rincón (decal de resplandor + luces puntuales; el shader admite
  // 8 puntos en total).
  // JUEGO DE MEMORIA Y OSCURIDAD TOTAL (corrección de playtest de
  // Jose, 2026-11-14): esto no es correr a ciegas con todo visible.
  // Tras la intro hay una FASE DE MEMORIA (CANDLE_MEMO_T = 4,5 s)
  // con la casa ILUMINADA y las 26 velas de ESTA partida a la vista
  // («MEMORIZA DÓNDE ESTÁN LAS VELAS»): hay que aprenderse el mapa.
  // Al cortarse la luz, el ambiente del duelo cae a ~0 (oscuridad
  // prácticamente total) y las velas APAGADAS no se ven (su sprite
  // va casi todo a luz de escena, factor lit 0,92: sin una luz
  // cerca, son negras). Las únicas fuentes de luz en juego son:
  // (a) LA VELA QUE LLEVA EL JUGADOR en la mano — llama dibujada
  // junto a él y luz puntual cálida de radio 150 que lo acompaña:
  // se ve él y su entorno inmediato, media habitación a lo sumo;
  // (b) las velas ya prendidas, con su halo y su luz puntual;
  // (c) el FÓSFORO DE JOSÉ: luz puntual verdosa tenue (radio 95) y
  // llamita pequeña y semitransparente — se le INTUYE más que se le
  // ve. Los parpadeos quedan como el respiro que revela la casa.
  // POSICIONES ALEATORIAS: cada partida elige las 26 velas al azar
  // entre los puntos CANDIDATOS de cada habitación (CANDLE_CANDIDATES:
  // 46 puntos validados — interacción alcanzable ≤36 u, nunca sobre
  // umbrales de puerta, nunca dentro de muebles sólidos), manteniendo
  // el reparto por cuarto (cocina 6, sala 9, cuarto 5, pasillo 3,
  // cuarto de Ximena 3). Dos partidas seguidas no repiten el set
  // salvo azar remoto: memorizar sirve una sola vez.
  // PARPADEOS: cada 10–15 s la luz VUELVE 1,5–2,5 s (con aviso previo
  // de 1 s e ícono de alerta propio): la casa se ilumina entera, las
  // velas apagadas destellan como pista de dónde quedan y, al
  // cortarse, la sobretensión apaga el 25% de las velas prendidas
  // (al azar, de ambos). El parpadeo no pausa a nadie.
  // CUARTO DE XIMENA: es jugable (su puerta queda abierta durante el
  // minijuego y se restaura al terminar) y está marcado como zona
  // sensible (ícono de luna sobre su cama): prender ahí toma más
  // tiempo (multiplicador según el Sigilo del personaje), porque
  // hay que hacerlo en silencio, junto a ella dormida.
  // REGLA DE SOPLADO DE JOSÉ (justa y documentada): José solo sopla
  // velas del jugador si va PERDIENDO (menos velas prendidas que el
  // jugador), con probabilidad 0,55 por decisión; si ya no quedan
  // velas apagadas, sopla siempre que no vaya ganando. Yendo ganando
  // jamás sopla: prefiere prender las suyas. Su objetivo es siempre
  // la vela (apagada o del jugador) más cercana: "la que le queda de
  // camino". Prende en 0,85 s y sopla en 1,1 s (el jugador: 0,6/0,9).
  // DURACIÓN: 75 s. Al final vuelve la luz y gana quien tenga MÁS
  // velas prendidas en ese instante → win/tie/lose.
  // SALIDAS (done): { win, candlesPlayer, candlesJose,
  // blownByPlayer, blownByJose, surges, score } — el mapeo a los
  // efectos del evento y a S.flags.apagon vive en MG.apagon.resolve
  // (game.js). HUD sin emoticones: marcador con velas dibujadas por
  // código e íconos propios (trofeo/empate/alerta/luna).
  // =========================================================
  // Puntos CANDIDATOS por habitación (46): sobre muebles (y = altura
  // de su tapa) o en el piso (y = 0). TODOS validados contra el mundo
  // real: existe piso libre a ≤36 u de su ancla (distancia de
  // interacción), ninguno cae sobre un umbral de puerta y los de piso
  // no están dentro de muebles sólidos. En cada partida se eligen al
  // azar CANDLE_PER_ROOM de cada cuarto (ver cabecera).
  const CANDLE_CANDIDATES = [
    // cocina (11 candidatos → 6)
    { x: 80, z: 56, y: 40, room: 'cocina' }, { x: 150, z: 56, y: 40, room: 'cocina' }, { x: 200, z: 56, y: 40, room: 'cocina' }, { x: 240, z: 60, y: 40, room: 'cocina' },
    { x: 120, z: 160, y: 34, room: 'cocina' }, { x: 140, z: 202, y: 34, room: 'cocina' }, { x: 228, z: 142, y: 34, room: 'cocina' },
    { x: 70, z: 235, y: 0, room: 'cocina' }, { x: 100, z: 100, y: 0, room: 'cocina' }, { x: 290, z: 110, y: 0, room: 'cocina' }, { x: 300, z: 240, y: 0, room: 'cocina' },
    // sala (15 candidatos → 9)
    { x: 400, z: 52, y: 88, room: 'sala' }, { x: 430, z: 52, y: 88, room: 'sala' },
    { x: 590, z: 55, y: 26, room: 'sala' }, { x: 610, z: 55, y: 26, room: 'sala' }, { x: 665, z: 55, y: 26, room: 'sala' },
    { x: 600, z: 130, y: 16, room: 'sala' }, { x: 620, z: 124, y: 16, room: 'sala' }, { x: 655, z: 124, y: 16, room: 'sala' },
    { x: 840, z: 222, y: 34, room: 'sala' }, { x: 865, z: 222, y: 34, room: 'sala' }, { x: 900, z: 222, y: 34, room: 'sala' },
    { x: 734, z: 135, y: 28, room: 'sala' }, { x: 480, z: 120, y: 0, room: 'sala' }, { x: 798, z: 90, y: 0, room: 'sala' }, { x: 880, z: 130, y: 0, room: 'sala' },
    // cuarto de los roomies (9 candidatos → 5)
    { x: 238, z: 340, y: 36, room: 'cuarto' }, { x: 260, z: 330, y: 36, room: 'cuarto' }, { x: 305, z: 330, y: 36, room: 'cuarto' },
    { x: 280, z: 530, y: 48, room: 'cuarto' }, { x: 296, z: 524, y: 48, room: 'cuarto' },
    { x: 95, z: 520, y: 0, room: 'cuarto' }, { x: 150, z: 350, y: 0, room: 'cuarto' }, { x: 185, z: 470, y: 0, room: 'cuarto' }, { x: 300, z: 440, y: 0, room: 'cuarto' },
    // pasillo (6 candidatos → 3)
    { x: 395, z: 318, y: 27, room: 'pasillo' }, { x: 420, z: 318, y: 27, room: 'pasillo' }, { x: 370, z: 545, y: 28, room: 'pasillo' },
    { x: 520, z: 470, y: 0, room: 'pasillo' }, { x: 520, z: 545, y: 0, room: 'pasillo' }, { x: 610, z: 470, y: 0, room: 'pasillo' },
    // cuarto de Ximena (5 candidatos → 3): zona sensible, prender toma más tiempo
    { x: 839, z: 346, y: 24, room: 'xroom' }, { x: 720, z: 330, y: 36, room: 'xroom' }, { x: 760, z: 330, y: 36, room: 'xroom' },
    { x: 700, z: 470, y: 0, room: 'xroom' }, { x: 790, z: 500, y: 0, room: 'xroom' },
  ];
  const CANDLE_PER_ROOM = { cocina: 6, sala: 9, cuarto: 5, pasillo: 3, xroom: 3 };
  // El set de ESTA partida: por cada habitación, sus candidatos
  // barajados y los primeros N. Sin semilla fija: Math.random del
  // motor (cada construcción de la escena = una partida nueva).
  function pickCandleSpots() {
    const out = [];
    for (const room of Object.keys(CANDLE_PER_ROOM)) {
      const pool = shuffle(CANDLE_CANDIDATES.filter((s) => s.room === room));
      out.push(...pool.slice(0, CANDLE_PER_ROOM[room]));
    }
    return out;
  }
  const CANDLE_MEMO_T = 4.5;                 // fase de memoria con la casa iluminada (s)
  const CANDLE_TIME = 75;                    // duración de la ronda (s)
  const CANDLE_LIGHT_T = 0.6, CANDLE_BLOW_T = 0.9;   // canalización del jugador
  const JOSE_LIGHT_T = 0.85, JOSE_BLOW_T = 1.1;      // canalización de José
  let candleBody = null; const flameCvs = {};
  function candleBodyCv() {
    if (candleBody) return candleBody;
    const cv = document.createElement('canvas'); cv.width = 26; cv.height = 38; cv._scale = 0.42;
    const x = cv.getContext('2d');
    x.fillStyle = '#8a6a4f'; x.fillRect(2, 33, 22, 3);                       // platito
    x.fillStyle = '#a88262'; x.fillRect(4, 31.5, 18, 2);
    x.fillStyle = '#f4efe2'; x.fillRect(8, 12, 10, 20);                      // cuerpo de cera
    x.fillStyle = '#e8dfc8'; x.fillRect(8, 12, 3, 20);
    x.fillStyle = '#fbf7ec'; x.fillRect(9, 10, 8, 4); x.fillRect(15, 10, 3, 8); x.fillRect(10, 10, 2.5, 6); // cera derretida
    x.fillStyle = '#3a3230'; x.fillRect(12.2, 6.5, 1.6, 4);                  // mecha
    candleBody = cv; return cv;
  }
  function flameCv(owner) {
    if (flameCvs[owner]) return flameCvs[owner];
    const cv = document.createElement('canvas'); cv.width = 16; cv.height = 22; cv._scale = 0.42;
    const x = cv.getContext('2d');
    const col = owner === 'p' ? '#ffa03c' : '#3fe0b0', core = owner === 'p' ? '#fff3c4' : '#d8fff2';
    x.fillStyle = col;
    x.beginPath(); x.moveTo(8, 0.5);
    x.quadraticCurveTo(13.5, 9, 12, 14.5); x.quadraticCurveTo(10.8, 20, 8, 20.5);
    x.quadraticCurveTo(5.2, 20, 4, 14.5); x.quadraticCurveTo(2.5, 9, 8, 0.5);
    x.fill();
    x.fillStyle = core; x.beginPath(); x.ellipse(8, 14.5, 2.6, 4.2, 0, 0, 6.3); x.fill();
    flameCvs[owner] = cv; return cv;
  }
  // Vela miniatura 2D para el HUD (marcador): cuerpo crema y, si está
  // prendida, la llama del color de su dueño; apagada, solo la mecha.
  function candleGlyph(c, x, y, s, owner) {
    c.fillStyle = '#f4efe2'; c.fillRect(x - s * 0.16, y - s * 0.1, s * 0.32, s * 0.55);
    c.fillStyle = '#d9c9a8'; c.fillRect(x - s * 0.22, y + s * 0.42, s * 0.44, s * 0.08);
    if (owner) {
      c.fillStyle = owner === 'p' ? '#ffa03c' : '#3fe0b0';
      c.beginPath(); c.ellipse(x, y - s * 0.28, s * 0.13, s * 0.22, 0, 0, 6.3); c.fill();
      c.fillStyle = '#fff6d8'; c.beginPath(); c.ellipse(x, y - s * 0.22, s * 0.06, s * 0.1, 0, 0, 6.3); c.fill();
    } else { c.fillStyle = '#8a8296'; c.fillRect(x - 0.75, y - s * 0.2, 1.5, s * 0.12); }
  }
  class CandleGame {
    constructor(who, done) {
      this.who = who; this.done = done; this.isCandles = true;
      this.p = new Actor(who, 520, 230); fixSpawn(this.p);
      this.jose = new Actor('jose', 500, 470); fixSpawn(this.jose);
      this.speed = speedOf(who);
      const jf = G.S.flags && G.S.flags.jose;
      this.joseSpeed = 118 * (jf === 'aliado' ? 0.9 : jf === 'desconfia' ? 1.07 : 1);
      this.joseActive = true; // gancho para la prueba de humo: permite congelar a José y aislar la mecánica del jugador
      // En el cuarto de Ximena se prende con cuidado: la canalización
      // tarda más, y el Sigilo del personaje lo compensa en parte.
      this.xroomMult = Math.max(1.15, 1.7 - stat(who, 'sigilo') * 0.06);
      this.candles = pickCandleSpots().map((s, i) => ({ ...s, i, owner: null }));
      this.cam = { x: this.p.x, y: 0, z: this.p.y, dist: 560, pitch: 0.78, fov: 34 };
      this.st = 'intro'; this.stT = 3.6; this.T = 0;
      this.timeLeft = CANDLE_TIME;
      this.chan = null; this.near = null;
      this.jState = 'seek'; this.jTarget = null; this.jKind = 'light'; this.jT = 0; this.jNeed = 0; this.jThink = 0.5;
      this.blownP = 0; this.blownJ = 0; this.surges = 0;
      this.surgeState = 'idle'; this.surgeT = 0; this.surgeDur = 0; this.surgeK = 0; this.nextSurge = 11;
      this.msg = null; this.result = null; this.doneFired = false;
      // El cuarto de Ximena es jugable: su puerta queda abierta durante
      // el minijuego y se restaura a su estado anterior al terminar.
      this.prevDoor = W.xDoorOpen; W.xDoorOpen = true;
    }
    say(text, color, secs) { this.msg = { text, c: color || '#fff', t: secs || 1.4 }; }
    counts() { let p = 0, j = 0; for (const c of this.candles) { if (c.owner === 'p') p++; else if (c.owner === 'j') j++; } return { p, j }; }
    nearCandle(a, maxD, skipOwner) {
      let best = null, bd = maxD || 36;
      for (const c of this.candles) { if (skipOwner && c.owner === skipOwner) continue; const d = Math.hypot(a.x - c.x, a.y - c.z); if (d < bd) { bd = d; best = c; } }
      return best;
    }
    // --- Jugador: canalización con ESPACIO sostenido ----------------
    updatePlayer(dt) {
      const p = this.p, ax = G.input.axis();
      // objetivo = la vela ACCIONABLE más cercana (apagada o de
      // José): una vela PROPIA ya prendida NO puede tapar a otra que
      // esté al lado — con los pares sobre el mismo mueble (escritorio,
      // encimera), la prendida quedaba «más cerca» y la otra se volvía
      // imposible de prender desde ese sitio (bug cazado en la humo)
      const target = this.nearCandle(p, 36, 'p');
      // la canalización se cancela al moverse, soltar la tecla o
      // cambiar de vela objetivo (hay que observar el anillo entero)
      if (this.chan && (this.chan.c !== target || !G.input.held('action') || ax.x || ax.y)) { this.chan = null; p.frameOverride = null; }
      if (!this.chan && target && G.input.held('action') && !ax.x && !ax.y) {
        const kind = target.owner === 'j' ? 'blow' : 'light';
        this.chan = { c: target, kind, t: 0, need: kind === 'blow' ? CANDLE_BLOW_T : CANDLE_LIGHT_T * (target.room === 'xroom' ? this.xroomMult : 1) };
      }
      if (this.chan) {
        p.walk(0, 0, 0, dt); p.frameOverride = 'act';
        const dx = this.chan.c.x - p.x, dy = this.chan.c.z - p.y;
        if (Math.abs(dx) > Math.abs(dy)) p.dir = dx > 0 ? 'right' : 'left'; else p.dir = dy > 0 ? 'down' : 'up';
        if ((this.chan.t += dt) >= this.chan.need) {
          const { c, kind } = this.chan;
          if (kind === 'light') { c.owner = 'p'; G.sfx('ok'); W.puff(c.x, c.z, 3, true); p.hop(90); }
          else { c.owner = null; this.blownP++; G.sfx('pick'); W.puff(c.x, c.z, 4); this.say('¡Soplaste una vela de José!', '#7dff8a', 1.1); }
          this.chan = null; p.frameOverride = null;
        }
      } else p.walk(ax.x, ax.y, this.speed, dt);
      this.near = target;
    }
    // --- José: IA rival por las rutas de la casa --------------------
    pickJoseTarget() {
      const j = this.jose, { p: cp, j: cj } = this.counts();
      const unlit = this.candles.filter((c) => c.owner === null);
      const mine = this.candles.filter((c) => c.owner === 'p');
      let kind = 'light', pool = unlit;
      // REGLA DE SOPLADO (ver cabecera): solo si va perdiendo (55%), o
      // si ya no quedan velas apagadas y no va ganando. Ganando, jamás.
      if (mine.length && ((cp > cj && (Math.random() < 0.55 || !unlit.length)) || (!unlit.length && cp >= cj))) { kind = 'blow'; pool = mine; }
      if (!pool.length) { this.jTarget = null; return; }
      let best = null, bd = 1e9;
      for (const c of pool) { const d = Math.hypot(j.x - c.x, j.y - c.z); if (d < bd) { bd = d; best = c; } }
      this.jTarget = best; this.jKind = kind;
      // la vela puede estar SOBRE un mueble: José se para en el piso
      // libre más cercano a su ancla, no encima del mueble
      const stand = W.nearestFree(best.x, best.z + 14);
      j.goTo(stand[0], stand[1], this.joseSpeed);
    }
    updateJose(dt) {
      const j = this.jose;
      if (this.jState === 'chan') {
        j.moving = false; j.vx = j.vy = 0; j.frameOverride = 'act';
        const c = this.jTarget, valid = c && (this.jKind === 'light' ? c.owner === null : c.owner === 'p');
        if (!valid) { this.jState = 'seek'; this.jTarget = null; this.jThink = 0.2; j.frameOverride = null; return; }
        if ((this.jT += dt) >= this.jNeed) {
          if (this.jKind === 'light') { c.owner = 'j'; G.sfx('msg'); }
          else { c.owner = null; this.blownJ++; this.say('¡José sopló una de tus velas!', '#ff6b7a', 1.2); G.sfx('bad'); }
          W.puff(c.x, c.z, 3);
          this.jState = 'seek'; this.jTarget = null; this.jThink = rnd(0.2, 0.45); j.frameOverride = null;
        }
        return;
      }
      j.frameOverride = null;
      if (this.jTarget) {
        const c = this.jTarget, valid = this.jKind === 'light' ? c.owner === null : c.owner === 'p';
        if (!valid) { this.jTarget = null; j.route = null; }
        else if (Math.hypot(j.x - c.x, j.y - c.z) < 36) {
          j.route = null; j.moving = false; j.vx = j.vy = 0;
          const dx = c.x - j.x, dy = c.z - j.y;
          if (Math.abs(dx) > Math.abs(dy)) j.dir = dx > 0 ? 'right' : 'left'; else j.dir = dy > 0 ? 'down' : 'up';
          this.jState = 'chan'; this.jT = 0; this.jNeed = this.jKind === 'light' ? JOSE_LIGHT_T : JOSE_BLOW_T;
          return;
        }
      }
      if (!this.jTarget) {
        if ((this.jThink -= dt) > 0) { j.follow(dt); return; }
        this.pickJoseTarget();
        if (!this.jTarget) { this.jThink = 0.6; j.follow(dt); return; }
      }
      j.follow(dt);
    }
    // --- Parpadeos de luz -------------------------------------------
    updateSurge(dt) {
      // la fase de MEMORIA va con la casa iluminada (objetivo 1, como
      // el panel final); en juego manda el parpadeo; el resto, oscuro
      const target = (this.st === 'over' || this.st === 'memory') ? 1 : this.surgeState === 'on' ? 1 : this.surgeState === 'warn' ? 0.22 : 0;
      this.surgeK += (target - this.surgeK) * Math.min(1, dt * (this.surgeState === 'on' || this.st === 'over' ? 9 : 5));
      if (this.st !== 'play') return;
      if (this.surgeState === 'warn') { if ((this.surgeT -= dt) <= 0) { this.surgeState = 'on'; this.surgeT = this.surgeDur; G.sfx('bell'); } }
      else if (this.surgeState === 'on') { if ((this.surgeT -= dt) <= 0) { this.surgeState = 'idle'; this.blowout(); this.nextSurge = this.T + rnd(10, 15); } }
      else if (this.T >= this.nextSurge && this.timeLeft > 6) { this.surgeState = 'warn'; this.surgeT = 1.0; this.surgeDur = rnd(1.5, 2.5); G.sfx('msg'); }
    }
    forceSurge() { if (this.surgeState === 'idle') { this.surgeState = 'warn'; this.surgeT = 0.01; this.surgeDur = 1.5; } } // gancho para la prueba de humo
    blowout() {
      const lit = shuffle(this.candles.filter((c) => c.owner));
      const n = Math.round(lit.length * 0.25);
      for (let i = 0; i < n; i++) { lit[i].owner = null; W.puff(lit[i].x, lit[i].z, 3); }
      this.surges++;
      if (n) { this.say(`¡La sobretensión apagó ${n} vela${n > 1 ? 's' : ''}!`, '#ffd23f', 1.6); G.sfx('door'); }
    }
    finish() {
      const { p, j } = this.counts();
      const win = p > j ? 'win' : j > p ? 'lose' : 'tie';
      this.result = { win, candlesPlayer: p, candlesJose: j, blownByPlayer: this.blownP, blownByJose: this.blownJ, surges: this.surges, score: p * 100 + this.blownP * 40 };
      this.st = 'over'; this.stT = 3.4;
      this.chan = null; this.p.frameOverride = null; this.jose.frameOverride = null;
      W.xDoorOpen = this.prevDoor; // la puerta de Ximena vuelve a su estado
      G.sfx(win === 'win' ? 'party' : win === 'tie' ? 'ok' : 'bad');
    }
    update(dt) {
      this.T += dt; W.updateFx(dt);
      const p = this.p, j = this.jose;
      p.update(dt); j.update(dt);
      if (this.msg && (this.msg.t -= dt) <= 0) this.msg = null;
      W.camLerp(this.cam, p.x, p.y - 20, dt, 5);
      this.updateSurge(dt);
      if (this.st === 'intro') { G.input.flush(); p.walk(0, 0, 0, dt); j.moving = false; if ((this.stT -= dt) <= 0) { this.st = 'memory'; this.stT = CANDLE_MEMO_T; } return; }
      // FASE DE MEMORIA: la casa iluminada y quieta; el reloj de los
      // 75 s AÚN no corre. Al agotarse, la luz se corta (el fundido lo
      // hace surgeK al caer su objetivo a 0) y arranca la partida; el
      // primer parpadeo se reprograma desde el inicio del juego.
      if (this.st === 'memory') { G.input.flush(); p.walk(0, 0, 0, dt); j.moving = false; j.vx = j.vy = 0; if ((this.stT -= dt) <= 0) { this.st = 'play'; this.nextSurge = this.T + 11; G.sfx('door'); } return; }
      if (this.st === 'over') {
        p.walk(0, 0, 0, dt); j.moving = false; j.vx = j.vy = 0;
        if ((this.stT -= dt) <= 0 && !this.doneFired) { this.doneFired = true; this.done(this.result); }
        return;
      }
      this.timeLeft -= dt;
      this.updatePlayer(dt);
      if (this.joseActive) this.updateJose(dt); else { j.moving = false; j.vx = j.vy = 0; }
      if (this.timeLeft <= 0) this.finish();
    }
    drawCandles(t) {
      for (const cd of this.candles) {
        if (cd.y === 0) R.shadow(cd.x, cd.z, 6, 0.5);
        // APAGADA: lit 0,92 = casi toda su iluminación viene de la
        // ESCENA (en la oscuridad total es negra; solo se revela si
        // una luz —la vela en la mano, un parpadeo— la alcanza).
        // Antes iba a 0,12 y se veía siempre: el bug reportado.
        R.sprite(candleBodyCv(), cd.x, cd.y, cd.z, { feet: 0, lit: cd.owner ? 0.55 : 0.92 });
        if (cd.owner) {
          const fl = 1 + Math.sin(t * 11 + cd.i * 1.7) * 0.15;
          R.flat(R.glowTex, cd.x, cd.y + 2, cd.z, 40 * fl, { tint: cd.owner === 'p' ? [1, 0.62, 0.22] : [0.25, 0.95, 0.65], alpha: 0.34 });
          R.sprite(flameCv(cd.owner), cd.x, cd.y + 13 + Math.sin(t * 9 + cd.i) * 0.8, cd.z, { feet: 0, lit: 0.9 });
        } else if (this.surgeState === 'on') {
          // con la luz de vuelta, las velas AÚN APAGADAS destellan un
          // instante: la pista visual de dónde quedan por prender
          R.flat(R.glowTex, cd.x, cd.y + 2, cd.z, 22 + Math.sin(t * 14 + cd.i * 2.3) * 6, { tint: [0.9, 0.9, 1], alpha: 0.3 });
        }
      }
      // EN JUEGO: la vela que el jugador lleva EN LA MANO (cuerpo +
      // llama ámbar, con su vaivén) y el fósforo de José (llama
      // verdosa más chica y semitransparente: se intuye, no se ve).
      // Sus luces puntuales acompañantes se arman en draw().
      if (this.st === 'play') {
        const p = this.p, j = this.jose, bob = Math.sin(t * 9) * 0.7;
        const hx = p.x + (p.dir === 'left' ? -11 : 11), hz = p.y + 3;
        R.sprite(candleBodyCv(), hx, 15, hz, { feet: 0, lit: 0.5, sx: 0.75, sy: 0.75 });
        R.sprite(flameCv('p'), hx, 15 + 10 + bob, hz, { feet: 0, lit: 0.9, sx: 0.8, sy: 0.8 });
        const jx = j.x + (j.dir === 'left' ? -10 : 10), jz = j.y + 3;
        R.sprite(candleBodyCv(), jx, 14, jz, { feet: 0, lit: 0.75, sx: 0.6, sy: 0.6 });
        R.sprite(flameCv('j'), jx, 14 + 8 + Math.sin(t * 10 + 2) * 0.6, jz, { feet: 0, lit: 0.85, sx: 0.62, sy: 0.62, alpha: 0.6 });
      }
    }
    ringOver(c, cd, frac, color) {
      const q = R.project(cd.x, cd.y + 27, cd.z); if (!q.ok) return;
      c.strokeStyle = 'rgba(20,16,30,.85)'; c.lineWidth = 4.5;
      c.beginPath(); c.arc(q.x, q.y, 9, 0, 6.3); c.stroke();
      c.strokeStyle = color; c.lineWidth = 3;
      c.beginPath(); c.arc(q.x, q.y, 9, -Math.PI / 2, -Math.PI / 2 + Math.max(0, Math.min(1, frac)) * 6.283); c.stroke();
    }
    hudDraw(c, t) {
      const { p: cp, j: cj } = this.counts();
      // marcador: jugador a la izquierda, José a la derecha (velas
      // dibujadas por código junto a cada conteo, sin emoticones)
      panel(c, 8, 8, 168, 40);
      face(c, this.who, 12, 12, 32);
      G.text(c, G.CHARS[this.who].name.toUpperCase(), 50, 19, { size: 8, color: G.CHARS[this.who].color, align: 'left', stroke: false });
      candleGlyph(c, 58, 31, 15, 'p');
      G.text(c, 'VELAS ' + cp, 68, 35, { size: 12, align: 'left', stroke: false });
      panel(c, 464, 8, 168, 40, '#40243a');
      face(c, 'jose', 596, 12, 32);
      G.text(c, 'JEFE · JOSÉ', 590, 19, { size: 8, color: G.CHARS.jose.color, align: 'right', stroke: false });
      candleGlyph(c, 582, 31, 15, 'j');
      G.text(c, 'VELAS ' + cj, 572, 35, { size: 12, align: 'right', stroke: false });
      // centro: título, reloj y quién va ganando (ícono propio)
      panel(c, 236, 8, 168, 40);
      G.text(c, 'VELAS EN EL APAGÓN', 320, 18, { size: 8, color: '#ffd23f', stroke: false });
      if (this.st === 'play') {
        const u = this.timeLeft <= 10;
        G.text(c, Math.max(0, Math.ceil(this.timeLeft)) + 's', 320, 35, { size: 12 + (u ? Math.sin(t * 12) * 1.2 : 0), color: u ? '#ff6b7a' : '#fff', stroke: false });
        const lead = cp - cj;
        G.icon(c, lead === 0 ? 'empate' : 'trofeo', 320, 62, 17);
        G.text(c, lead > 0 ? '¡VAS GANANDO!' : lead < 0 ? 'JOSÉ VA GANANDO' : '¡EMPATE DE VELAS!', 320, 76, { size: 9.5, color: lead > 0 ? '#7dff8a' : lead < 0 ? '#ff6b7a' : '#ffd23f', stroke: false });
      }
      // aviso del parpadeo (ícono de alerta propio)
      if (this.surgeState === 'warn' && this.st === 'play') { if (Math.sin(t * 16) > -0.3) { G.icon(c, 'alerta', 320, 96, 16); G.text(c, '¡LA LUZ ESTÁ POR VOLVER UN INSTANTE!', 320, 110, { size: 9.5, color: '#ffd23f', stroke: false }); } }
      else if (this.surgeState === 'on' && this.st === 'play') { G.icon(c, 'alerta', 320, 96, 16); G.text(c, '¡VOLVIÓ LA LUZ! Al cortarse, la sobretensión apaga velas…', 320, 110, { size: 9.5, color: '#ffe9a8', stroke: false }); }
      if (this.msg && this.st === 'play') G.text(c, this.msg.text, 320, 322, { size: 12, color: this.msg.c, lw: 4 });
      // cuarto de Ximena: zona sensible marcada (luna + Zzz sobre su cama)
      const qb = R.project(905, 66, 400);
      if (qb.ok && this.st !== 'over') {
        G.icon(c, 'luna', qb.x, qb.y - 6, 15);
        G.text(c, 'Zzz', qb.x + 13, qb.y - 14 + Math.sin(t * 1.6) * 2, { size: 9, color: '#b9b0d6', stroke: false });
        G.text(c, 'Ximena duerme: prende con cuidado', qb.x, qb.y + 8, { size: 7.5, color: '#b9b0d6', stroke: false });
      }
      // prompts y anillos de canalización
      if (this.st === 'play') {
        if (this.chan) {
          this.ringOver(c, this.chan.c, this.chan.t / this.chan.need, this.chan.kind === 'light' ? '#ffa03c' : '#7fd3ff');
          const h = this.p.head(24);
          G.prompt(c, this.chan.kind === 'light' ? 'prendiendo…' : 'soplando…', h.x, h.y);
        } else if (this.near) {
          const h = this.p.head(24);
          G.prompt(c, this.near.owner === 'j' ? 'ESPACIO (mantén): soplar la de José' : 'ESPACIO (mantén): prender vela', h.x, h.y);
        }
        if (this.jState === 'chan' && this.jTarget) this.ringOver(c, this.jTarget, this.jT / this.jNeed, '#3fe0b0');
      }
      if (this.st === 'memory') {
        // banner de la fase de memoria: la casa está iluminada y las
        // velas de esta partida, a la vista — hay que aprendérselas
        panel(c, 158, 118, 324, 56);
        candleGlyph(c, 320, 134, 17, 'p');
        G.text(c, 'MEMORIZA DÓNDE ESTÁN LAS VELAS', 320, 152, { size: 12.5, color: '#ffd23f' });
        G.text(c, `La luz se corta en ${Math.max(1, Math.ceil(this.stT))} s: luego solo tu vela en la mano te alumbra`, 320, 166, { size: 8.5, color: '#ffe9a8', stroke: false });
      }
      if (this.st === 'intro') {
        c.fillStyle = 'rgba(12,10,20,.84)'; c.fillRect(66, 60, 508, 228);
        panel(c, 66, 60, 508, 228, '#221c33');
        c.drawImage(candleBodyCv(), 88, 76, 15, 22); c.drawImage(flameCv('p'), 92, 66, 9, 13);
        G.text(c, 'APAGÓN: VELAS CONTRA JOSÉ', 330, 86, { size: 16, color: '#ffd23f' });
        wrap(c, 'Se fue la luz y José apareció con fósforos: jura que SU ambiente a velas salva la fiesta. Corre por TODA la casa y prende más velas que él antes de que vuelva la luz (75 s).', 96, 112, 448, 10, '#fff');
        wrap(c, 'Al empezar, la casa se ve unos segundos: MEMORIZA dónde están las velas (cambian de lugar en cada partida). Después, oscuridad total: llevas una vela prendida en la mano que alumbra a tu alrededor, y cada vela que prendas suma su luz.', 96, 145, 448, 10, '#ffe9a8');
        wrap(c, 'Mantén ESPACIO junto a una vela para prenderla (0,6 s; si te mueves, se cancela). Junto a una vela de José (llama verdosa), mantén ESPACIO para soplarla (0,9 s). José lleva su fósforo: su llamita tenue lo delata en la oscuridad.', 96, 186, 448, 10, '#bfe0ff');
        wrap(c, 'José sopla las tuyas solo si va perdiendo. Ojo con los parpadeos: cuando la luz vuelve un instante, la sobretensión apaga 1 de cada 4 velas prendidas. En el cuarto de Ximena, prende con cuidado: toma más tiempo.', 96, 227, 448, 10, '#ffd9ec');
        G.text(c, 'Gana quien tenga más velas prendidas cuando vuelva la luz', 320, 272, { size: 10.5, color: '#7dff8a', stroke: false });
      }
      if (this.st === 'over' && this.result) {
        const r = this.result;
        c.fillStyle = 'rgba(12,10,20,.84)'; c.fillRect(86, 74, 468, 208);
        panel(c, 86, 74, 468, 208, '#221c33');
        G.icon(c, r.win === 'win' ? 'trofeo' : r.win === 'tie' ? 'empate' : 'derrota', 320, 94, 30);
        G.text(c, '¡VOLVIÓ LA LUZ!', 320, 122, { size: 19, color: '#7dff8a' });
        G.text(c, r.win === 'win' ? 'Tu ambiente a velas ganó: la casa quedó de revista.' : r.win === 'tie' ? 'Velas iguales: la casa quedó mitad y mitad.' : 'José y su ambiente ganaron. Y no para de contarlo.', 320, 144, { size: 10.5, stroke: false });
        candleGlyph(c, 238, 158, 17, 'p');
        G.text(c, `Tus velas: ${r.candlesPlayer}`, 252, 166, { size: 11.5, align: 'left', stroke: false });
        candleGlyph(c, 238, 182, 17, 'j');
        G.text(c, `Velas de José: ${r.candlesJose}`, 252, 190, { size: 11.5, align: 'left', stroke: false });
        G.text(c, `Soplaste ${r.blownByPlayer} de José · Él sopló ${r.blownByJose} tuyas · Parpadeos: ${r.surges}`, 320, 216, { size: 9.5, stroke: false });
        G.text(c, 'PUNTOS: ' + r.score, 320, 246, { size: 15, color: '#ffd23f', stroke: false });
      }
    }
    draw(dt) {
      const p = this.p, j = this.jose;
      let k = this.surgeK;
      if (this.surgeState === 'warn') k *= 0.75 + Math.random() * 0.5; // tembleque de aviso
      else if (this.surgeState === 'on') k *= 0.93 + Math.random() * 0.07;
      // OSCURIDAD TOTAL (k=0): el ambiente cae a ~0 (0,02) — fuera de
      // los halos de las luces puntuales, la casa es prácticamente
      // negra. Con k=1 (memoria, parpadeo, final) vuelve la luz plena.
      const amb = [0.02 + 0.58 * k, 0.018 + 0.55 * k, 0.03 + 0.47 * k];
      const sun = [0.01 + 0.39 * k, 0.01 + 0.37 * k, 0.02 + 0.3 * k];
      // Luces puntuales (el shader admite 8 en total), en orden de
      // importancia: (1) la vela EN LA MANO del jugador — cálida,
      // radio 150, con su parpadeo de llama —; (2) el fósforo de
      // José — verdoso y tenue, radio 95: se le intuye —; (3) fuera
      // de juego, la luna por la ventana (en juego no: la oscuridad
      // es total salvo las velas); (4) las velas prendidas más
      // cercanas a la cámara, hasta agotar el presupuesto.
      const flick = 0.92 + 0.08 * Math.sin(this.T * 13);
      const pts = [
        { x: p.x, y: 34, z: p.y, r: 150, c: [0.55 * flick, 0.36 * flick, 0.13 * flick] },
        { x: j.x, y: 30, z: j.y, r: 95, c: [0.1, 0.26, 0.18] },
      ];
      if (this.st !== 'play') pts.push({ x: 825, y: 66, z: 80, r: 260, c: [0.14 + 0.2 * k, 0.17 + 0.2 * k, 0.3 + 0.15 * k] });
      const lit = this.candles.filter((cd) => cd.owner);
      lit.sort((a, b) => Math.hypot(a.x - this.cam.x, a.z - this.cam.z) - Math.hypot(b.x - this.cam.x, b.z - this.cam.z));
      for (const cd of lit.slice(0, 8 - pts.length)) pts.push({ x: cd.x, y: cd.y + 16, z: cd.z, r: 130, c: cd.owner === 'p' ? [0.5, 0.34, 0.13] : [0.13, 0.42, 0.3] });
      W.render({
        cam: this.cam, dt, actors: [p, this.jose], focusZ: p.y,
        light: { amb, sun, sky: k > 0.5 ? '#231c2e' : '#07060c', points: pts },
        sprites: (t) => this.drawCandles(t),
        over: (c, t) => this.hudDraw(c, t),
      });
    }
  }

  // =========================================================
  // 12. CACTUS EN CARRERA — vista lateral: salta los cactus que
  // ruedan de izquierda a derecha (variante del evento cactus)
  // =========================================================
  // DECISIONES DE JOSE (2026-11-14): jugador y Pollito en el MISMO
  // carril (misma línea de suelo, con un pequeño desfase horizontal
  // para que ambos se vean; nada de carriles paralelos). Los cactus
  // ruedan desde el borde izquierdo hacia la derecha, acelerando al
  // cruzar, y ambos corredores los saltan (ESPACIO/↑; Pollito con su
  // IA de reacción). Golpe = tropiezo: animación de mareo, contador
  // de golpes y 0,75 s sin poder saltar; nadie queda eliminado.
  // Dificultad pedida: (a) ~1 de cada 3 cactus CAMBIA DE VELOCIDAD a
  // mitad de recorrido (×0,55 o ×1,5), con aviso sutil y justo:
  // medio segundo antes se inclina, echa polvo y lleva un anillo
  // tenue; (b) la GRAVEDAD cambia por tramos de ~8 s anunciados con
  // banner e ícono propio (luna / planeta del set del juego):
  // LUNAR (salto más alto y caída lenta, flotante) y PESADA (salto
  // corto y caída rápida), intercalados con la normal. Dura 60 s y
  // gana quien tenga MENOS golpes (empate si igualan). En la
  // historia, el evento «Cactus rodantes» SORTEA esta variante al
  // 50/50 contra la de siempre (ver runMinigame en game.js); en
  // práctica cada una tiene su propia entrada.
  const RACE_GRAV = {
    normal: { g: 620, v0: 252, label: 'GRAVEDAD NORMAL', icon: null },
    luna: { g: 235, v0: 240, label: '¡GRAVEDAD LUNAR!', icon: 'luna' },
    pesada: { g: 1120, v0: 288, label: '¡GRAVEDAD PESADA!', icon: 'planeta' },
  };
  // Tramos de gravedad (clave, segundos): el guion suma 57 s y el
  // tramo final normal cubre lo que reste hasta los 60.
  const RACE_SEGS = [['normal', 11], ['luna', 8], ['normal', 7], ['pesada', 8], ['normal', 7], ['luna', 8], ['pesada', 8], ['normal', 99]];
  let raceMesh = null;
  function buildRaceArena() {
    const m = new R.MB();
    m.flat(-460, -260, 920, 520, -2, '#171126'); // fondo lejano
    m.box(-460, 0, -96, 920, 150, 44, '#4b3550', { s: '#5d4263' }); // pared del fondo
    m.box(-460, 132, -96, 920, 18, 44, '#3a2a40');
    m.flat(-460, -52, 920, 150, 0, '#7a5a38'); // la pista
    m.flat(-460, -52, 920, 8, 0.3, '#96703f');
    [-300, -60, 180].forEach((x) => { m.box(x, 62, -97, 92, 62, 2, '#2c2135'); m.wallQuad(x + 6, 68, -95.8, 80, 50, '#e8a04c'); }); // ventanas cálidas
    for (let i = 0; i < 12; i++) m.wallQuad(-420 + i * 76, 118 - Math.abs(Math.sin(i * 1.2)) * 8, -95.6, 30, 16, ['#e23b4e', '#ffd23f', '#3fa0f0', '#58c46a'][i % 4]); // guirnalda
    [-392, 372].forEach((x) => { m.box(x, 0, 52, 44, 22, 40, '#8a4a3a', { top: '#a55a48' }); m.box(x + 8, 22, 60, 28, 26, 24, '#3f8f4f'); }); // macetas
    return m.upload();
  }
  class CactusRaceDuel extends Duel {
    constructor(who, done) {
      super(who, 'pollito', done, { rounds: 1, need: 1, time: 60, label: 'CARRERA', title: 'CACTUS EN CARRERA', hint: 'ESPACIO o ↑ para saltar · Gana quien reciba MENOS golpes en 60 s', rendT: 1.6 });
      this.isRace = true;
      this.p = new Actor(who, -38, 0); this.cat = new Actor('pollito', 38, 0); // MISMO carril: misma z, desfase en x
      this.cam = { x: 0, y: 0, z: 6, dist: 350, pitch: 0.3, fov: 42 };
      this.quietRend = true; // el cierre usa su propio panel con los golpes (ver endOverlay)
      this.begin();
    }
    setup(n) {
      this.cacti = []; this.spawnT = 1.1; this.elapsed = 0;
      this.run = { p: { h: 0, v: 0, stun: 0, hits: 0 }, c: { h: 0, v: 0, stun: 0, hits: 0 } };
      this.grav = 'normal'; this.gravAnn = null; this.puffT = 0;
      for (const a of [this.p, this.cat]) { a.jy = 0; a.jv = 0; a.elev = 0; a.spin = 0; a.flash = 0; a.tilt = 0; a.dir = 'right'; }
    }
    gravAt(t) { let acc = 0; for (const [k, d] of RACE_SEGS) { acc += d; if (t < acc) return k; } return 'normal'; }
    // Altura de salto con la gravedad dada (la usa también la prueba de humo)
    jumpHeight(key) { const Gv = RACE_GRAV[key || this.grav]; return (Gv.v0 * Gv.v0) / (2 * Gv.g); }
    spawnCactus() {
      const c = {
        x: -350, vx: 148 + this.elapsed * 1.15 + rnd(0, 26), rot: 0, change: null, warned: false, hitP: false, hitC: false, catAct: false,
        react: 0.3 + rnd(-0.05, 0.07) - (G.S.flags.pollitoOfendido ? 0.05 : 0), // tiempo de reacción de Pollito ante ESTE cactus
        ignore: Math.random() < 0.1, // 1 de cada 10 lo distrae una mariposa imaginaria
      };
      if (Math.random() < 0.34) c.change = { at: rnd(-50, 100), f: Math.random() < 0.5 ? 0.55 : 1.5, done: false };
      this.cacti.push(c);
    }
    tryJump(r) { if (r.h <= 0 && r.stun <= 0) { r.v = RACE_GRAV[this.grav].v0; r.h = 0.01; } }
    stepRunner(r, a, dt) {
      // Física propia del duelo (la gravedad varía por tramos): se
      // escribe en a.jy DESPUÉS de a.update() y con jv=0, para que el
      // Actor no integre su gravedad fija encima.
      if (r.stun > 0) r.stun -= dt;
      if (r.h > 0 || r.v > 0) {
        r.v -= RACE_GRAV[this.grav].g * dt; r.h += r.v * dt;
        if (r.h <= 0) { r.h = 0; r.v = 0; a.squash = 0.16; W.puff(a.x, a.y, 2); }
      }
      a.jy = r.h; a.jv = 0;
      a.moving = r.stun <= 0; // tropiezo = pierde el ritmo unos instantes
      a.step += dt * (r.stun > 0 ? 0 : 24); // cadencia de carrera en el sitio
    }
    hitCheck(c, r, a, flag, mine) {
      if (c[flag]) return;
      if (Math.abs(c.x - a.x) < 18) {
        if (r.h < 15) {
          c[flag] = true; r.hits++; r.stun = 0.75; a.flash = 0.7; a.spin = 0.7; a.emo('!!', 0.8); W.puff(a.x, a.y, 6, true);
          if (mine) { G.sfx('bad'); this.say('¡Tropiezo!', '#ff6b7a', 0.9); } else G.sfx('meow');
        }
      } else if (c.x > a.x + 26) c[flag] = true; // ya pasó (saltado): no vuelve a contar
    }
    update(dt) {
      const p = this.p, cat = this.cat; p.update(dt); cat.update(dt);
      if (!this.tick(dt)) return;
      this.elapsed += dt;
      const g = this.gravAt(this.elapsed);
      if (g !== this.grav) { // cambio de tramo: banner + ícono propio
        this.grav = g; this.gravAnn = { key: g, t: 1.8 };
        this.say(RACE_GRAV[g].label, g === 'normal' ? '#fff' : '#ffd23f', 1.6);
        if (g !== 'normal') G.sfx('msg');
      }
      if (this.gravAnn && (this.gravAnn.t -= dt) <= 0) this.gravAnn = null;
      const rp = this.run.p, rc = this.run.c;
      if (G.input.hit('action') || G.input.hit('up')) this.tryJump(rp);
      // IA de Pollito: decide UNA vez por cactus, cuando el tiempo de
      // llegada (con la velocidad ACTUAL del cactus) baja de su tiempo
      // de reacción. Si el cactus acelera o frena DESPUÉS de su salto,
      // puede caer mal: la finta de velocidad también lo engaña a él.
      const near = this.cacti.filter((c) => !c.catAct && c.x < cat.x - 4).sort((a, b) => b.x - a.x)[0];
      if (near && (cat.x - near.x) / Math.max(60, near.vx) <= near.react) { near.catAct = true; if (!near.ignore) this.tryJump(rc); }
      this.stepRunner(rp, p, dt); this.stepRunner(rc, cat, dt);
      if ((this.puffT -= dt) <= 0) { this.puffT = 0.16; if (rp.stun <= 0) W.puff(p.x - 8, p.y, 1); if (rc.stun <= 0) W.puff(cat.x - 8, cat.y, 1); }
      if ((this.spawnT -= dt) <= 0) { this.spawnCactus(); this.spawnT = rnd(1.05, 1.55) * (1 - Math.min(0.25, this.elapsed / 240)); }
      for (const c of this.cacti) {
        if (c.change && !c.change.done) {
          if (!c.warned && c.x > c.change.at - c.vx * 0.5) { c.warned = true; W.puff(c.x, 0, 2); } // aviso sutil: se inclina y echa polvo
          if (c.x >= c.change.at) { c.vx *= c.change.f; c.change.done = true; W.puff(c.x, 0, 3); }
        }
        c.vx += 24 * dt; // acelera al cruzar la pista
        c.x += c.vx * dt; c.rot -= (c.vx * dt) / 13;
        this.hitCheck(c, rp, p, 'hitP', true);
        this.hitCheck(c, rc, cat, 'hitC', false);
      }
      this.cacti = this.cacti.filter((c) => c.x < 400);
      if (this.time <= 0) this.endRound(rp.hits < rc.hits ? 'p' : rp.hits > rc.hits ? 'b' : 'tie', `Golpes — Tú: ${rp.hits} · Pollito: ${rc.hits}`);
    }
    extra() { return { hitsP: this.run.p.hits, hitsC: this.run.c.hits }; }
    endOverlay(c) {
      const w = this.result.win, rp = this.run.p, rc = this.run.c;
      c.fillStyle = 'rgba(16,12,26,.85)'; c.fillRect(0, 0, 640, 360);
      G.icon(c, w === 'win' ? 'trofeo' : w === 'tie' ? 'empate' : 'derrota', 320, 84, 48); // ícono propio del resultado
      G.text(c, w === 'win' ? '¡GANASTE!' : w === 'tie' ? 'EMPATE' : 'GANÓ POLLITO', 320, 138, { size: 40, color: w === 'win' ? '#7dff8a' : w === 'tie' ? '#ffd23f' : '#ff6b7a', lw: 9 });
      G.text(c, `Golpes — Tú: ${rp.hits} · Pollito: ${rc.hits}`, 320, 182, { size: 17, lw: 6 });
      G.text(c, w === 'win' ? 'Menos tropiezos: la carrera es tuya' : w === 'tie' ? 'Mismo número de tropiezos' : 'Habrá consecuencias…', 320, 208, { size: 11 });
    }
    draw(dt) {
      if (!raceMesh && R.gl) raceMesh = buildRaceArena(); // la malla se sube al primer draw con WebGL presente
      W.render({
        cam: this.cam, dt, mesh: raceMesh, actors: [this.p, this.cat], noApartment: true,
        light: { amb: [0.62, 0.56, 0.66], sun: [0.42, 0.38, 0.4], sky: '#171126', points: [{ x: 0, y: 90, z: -40, r: 430, c: [0.4, 0.28, 0.14] }] },
        boxes: (mb) => { // franjas de la pista corriendo hacia la izquierda: venden la velocidad de la carrera
          const off = (this.T * 150) % 64;
          for (let i = 0; i < 15; i++) mb.flat(-448 + i * 64 - off, 26, 30, 5, 0.4, '#8f6a3d');
        },
        sprites: () => this.cacti.forEach((c) => {
          R.shadow(c.x, 0, 13, 0.8);
          const lean = c.warned && c.change && !c.change.done ? Math.sin(this.T * 26) * 0.14 : 0; // la inclinación de aviso
          R.sprite(Sp.item('cactus'), c.x, 3, 0, { feet: 6, roll: c.rot + lean, sx: 1.7, sy: 1.7 });
          if (c.warned && c.change && !c.change.done) ring(c.x, 0, 20, [1, 0.8, 0.3], 0.3);
        }),
        over: (c, t) => {
          if (this.st === 'over') { this.endOverlay(c); return; }
          this.hud(c, t, `GOLPES ${this.run.p.hits}`, `GOLPES ${this.run.c.hits}`);
          // chip con la gravedad vigente (ícono propio cuando no es la normal)
          const Gv = RACE_GRAV[this.grav];
          c.fillStyle = 'rgba(28,24,38,.8)'; c.beginPath(); c.roundRect(10, 322, Gv.icon ? 168 : 138, 24, 7); c.fill();
          if (Gv.icon) G.icon(c, Gv.icon, 30, 334, 17);
          G.text(c, Gv.label.replace('¡', '').replace('!', ''), Gv.icon ? 112 : 79, 334, { size: 9.5, stroke: false });
          // banner del cambio de tramo
          if (this.gravAnn) {
            const k = Math.min(1, this.gravAnn.t * 3, (1.8 - this.gravAnn.t) * 5);
            c.globalAlpha = Math.max(0, k);
            c.fillStyle = 'rgba(20,16,30,.72)'; c.fillRect(0, 96, 640, 64);
            if (RACE_GRAV[this.gravAnn.key].icon) G.icon(c, RACE_GRAV[this.gravAnn.key].icon, 320, 116, 30);
            G.text(c, RACE_GRAV[this.gravAnn.key].label, 320, 146, { size: 21, color: '#ffd23f', lw: 6 });
            c.globalAlpha = 1;
          }
        },
      });
    }
  }

  // =========================================================
  // 13. LA IMAGEN DISTINTA — vs José: dos paneles iguales y uno
  // distinto; el primero en señalarlo gana el punto (a 5 puntos)
  // =========================================================
  // Las imágenes son objetos de fiesta DIBUJADOS POR CÓDIGO con
  // parámetros (color, cantidad n, accesorio, adorno extra y
  // orientación): la pareja idéntica y la variante con UNA sola
  // diferencia controlada salen POR CONSTRUCCIÓN — es imposible que
  // una ronda tenga cero o dos imágenes distintas. Sutileza por
  // rondas: 1-2 obvias (otro color), 3-4 medias (cantidad ±1 o
  // accesorio que aparece/desaparece), 5+ sutiles (una raya menos
  // entre 4-5, un adorno extra, o la imagen espejada). José tarda
  // más y falla más cuanto más sutil sea la diferencia.
  // REGLA DE FALLO (decisión documentada): si eliges mal, José tiene
  // su oportunidad — si acierta se lleva el punto; si también falla,
  // la ronda se ANULA. Si José falla primero, tienes 1,4 s de gracia
  // para acertar; si no, también se anula. Máximo 8 s por ronda:
  // rondas ágiles de ~4-8 s. Gana quien llegue a 5 puntos (tope de
  // 9 rondas: si se agotan, manda quien tenga más).
  const IMG_COLORS = ['#f48fb1', '#7fd3ff', '#ffd23f', '#b6f08a', '#b48cf0', '#ff9a5c'];
  const IMG_KINDS = ['pastel', 'globo', 'regalo', 'vela', 'gorro', 'corneta'];
  const IMG_PANELS = [{ x: 62, y: 122 }, { x: 245, y: 122 }, { x: 428, y: 122 }];
  const IMG_W = 150, IMG_H = 148;
  function imgBase(kind) { return { kind, color: (Math.random() * IMG_COLORS.length) | 0, n: 2 + ((Math.random() * 3) | 0), extra: Math.random() < 0.5, extra2: false, flip: false }; }
  function imgVariant(base, level) {
    const v = { ...base };
    let type;
    if (level === 0) { type = 'color'; v.color = (base.color + 1 + ((Math.random() * (IMG_COLORS.length - 1)) | 0)) % IMG_COLORS.length; }
    else if (level === 1) {
      if (Math.random() < 0.5) { type = 'cantidad'; v.n = base.n >= 4 ? base.n - 1 : base.n + 1; }
      else { type = 'accesorio'; v.extra = !base.extra; }
    } else {
      type = ['raya', 'adorno', 'espejo'][(Math.random() * 3) | 0];
      if (type === 'raya') { base.n = 4 + ((Math.random() * 2) | 0); v.n = base.n - 1; } // una raya menos entre 4-5: sutil
      else if (type === 'adorno') v.extra2 = true;
      else v.flip = true;
    }
    if (JSON.stringify(v) === JSON.stringify(base)) { v.color = (base.color + 1) % IMG_COLORS.length; type = 'color'; } // red de seguridad
    return { variant: v, type };
  }
  function imgStar(c, x, y, s, col) {
    c.save(); c.translate(x, y); c.fillStyle = col;
    c.beginPath(); c.moveTo(0, -s); c.quadraticCurveTo(0, 0, s, 0); c.quadraticCurveTo(0, 0, 0, s); c.quadraticCurveTo(0, 0, -s, 0); c.quadraticCurveTo(0, 0, 0, -s); c.fill();
    c.restore();
  }
  // Dibuja el objeto de fiesta de una spec, centrado en (cx, cy) con escala s
  function imgDraw(c, spec, cx, cy, s) {
    const col = IMG_COLORS[spec.color], col2 = IMG_COLORS[(spec.color + 2) % IMG_COLORS.length], n = spec.n;
    c.save(); c.translate(cx, cy); c.scale(spec.flip ? -s : s, s);
    if (spec.kind === 'pastel') {
      c.fillStyle = '#cfd3dc'; c.beginPath(); c.ellipse(0, 22, 27, 6, 0, 0, 6.3); c.fill();
      c.fillStyle = col; c.fillRect(-20, 4, 40, 17); c.fillStyle = 'rgba(255,255,255,.35)'; c.fillRect(-20, 4, 40, 4);
      c.fillStyle = '#fff6f9'; c.fillRect(-15, -6, 30, 11);
      for (let i = 0; i < n; i++) { const x = n === 1 ? 0 : -11 + (22 * i) / (n - 1); c.fillStyle = ['#ffd84a', '#7fd3ff', '#b6f08a'][i % 3]; c.fillRect(x - 1.5, -19, 3, 13); c.fillStyle = '#ff9a2e'; c.beginPath(); c.ellipse(x, -22, 2.4, 3.6, 0, 0, 6.3); c.fill(); }
      if (spec.extra) { c.fillStyle = '#d8404a'; c.beginPath(); c.arc(-4, -8, 3.6, 0, 6.3); c.fill(); c.fillStyle = '#5e9c4a'; c.fillRect(-4.8, -13, 1.6, 3); }
      if (spec.extra2) { c.fillStyle = '#d8404a'; c.beginPath(); c.arc(5, -7, 3.2, 0, 6.3); c.fill(); }
    } else if (spec.kind === 'globo') {
      c.strokeStyle = '#8a8a99'; c.lineWidth = 1.3; c.beginPath(); c.moveTo(0, 13); c.quadraticCurveTo(4, 21, 0, 30); c.stroke();
      c.fillStyle = col; c.beginPath(); c.ellipse(0, -7, 17, 20, 0, 0, 6.3); c.fill();
      c.strokeStyle = col2; c.lineWidth = 2;
      for (let i = 1; i < n; i++) { const x = -14 + (28 * i) / n; c.beginPath(); c.ellipse(x * 0.55, -7, Math.max(2.5, 8 - Math.abs(x) * 0.32), 18.5, 0, 0, 6.3); c.stroke(); }
      c.fillStyle = 'rgba(255,255,255,.5)'; c.beginPath(); c.ellipse(-6, -14, 4, 6.5, -0.5, 0, 6.3); c.fill();
      c.fillStyle = col; c.beginPath(); c.moveTo(-3.5, 12); c.lineTo(3.5, 12); c.lineTo(0, 16.5); c.closePath(); c.fill();
      if (spec.extra) imgStar(c, 7, -13, 5, '#fff6f9');
      if (spec.extra2) imgStar(c, -8.5, -2, 3.6, '#fff6f9');
    } else if (spec.kind === 'regalo') {
      c.fillStyle = col; c.fillRect(-19, -3, 38, 26);
      c.fillStyle = col2;
      [[-12, 6], [0, 12], [11, 5], [-5, 18], [13, 17]].slice(0, n).forEach(([x, y]) => { c.beginPath(); c.arc(x, y, 2.3, 0, 6.3); c.fill(); });
      c.fillStyle = '#ffd23f'; c.fillRect(-3, -11, 6, 34); c.fillRect(-19, 7, 38, 5);
      c.fillStyle = IMG_COLORS[(spec.color + 1) % IMG_COLORS.length]; c.fillRect(-22, -12, 44, 9);
      c.fillStyle = '#ffd23f'; c.fillRect(-3, -12, 6, 9);
      if (spec.extra) { c.fillStyle = '#ffd23f'; c.beginPath(); c.ellipse(-6, -16, 5.5, 3.4, -0.6, 0, 6.3); c.fill(); c.beginPath(); c.ellipse(6, -16, 5.5, 3.4, 0.6, 0, 6.3); c.fill(); }
      if (spec.extra2) { c.fillStyle = '#fff6f9'; c.fillRect(13, 0, 8, 11); c.fillStyle = '#d8404a'; c.fillRect(15.5, 3, 3, 3); }
    } else if (spec.kind === 'vela') {
      c.fillStyle = '#e8d9b8'; c.beginPath(); c.ellipse(0, 25, 15, 3.6, 0, 0, 6.3); c.fill();
      c.fillStyle = col; c.fillRect(-9, -6, 18, 30);
      c.fillStyle = 'rgba(255,255,255,.6)';
      for (let i = 0; i < n; i++) c.fillRect(-9, 0 + i * 6.4, 18, 2.6);
      c.strokeStyle = '#2b1d24'; c.lineWidth = 1.6; c.beginPath(); c.moveTo(0, -6); c.lineTo(0, -11); c.stroke();
      c.fillStyle = '#ff9a2e'; c.beginPath(); c.ellipse(0, -16, 4.2, 6.4, 0, 0, 6.3); c.fill();
      c.fillStyle = '#ffd23f'; c.beginPath(); c.ellipse(0, -15, 2, 3.6, 0, 0, 6.3); c.fill();
      if (spec.extra) { imgStar(c, -14, -12, 4, '#ffd23f'); imgStar(c, 14, -8, 4, '#ffd23f'); }
      if (spec.extra2) imgStar(c, 13, 4, 3.4, '#ffd23f');
    } else if (spec.kind === 'gorro') {
      c.save();
      c.beginPath(); c.moveTo(-19, 20); c.lineTo(0, -25); c.lineTo(19, 20); c.closePath(); c.clip();
      c.fillStyle = col; c.fillRect(-19, -25, 38, 45);
      c.fillStyle = col2;
      for (let i = 0; i < n; i++) c.fillRect(-19, -14 + i * 9, 38, 4.4);
      if (spec.extra2) { c.fillStyle = '#fff6f9'; [[-6, 2], [5, 9], [0, -6]].forEach(([x, y]) => { c.beginPath(); c.arc(x, y, 2.2, 0, 6.3); c.fill(); }); }
      c.restore();
      c.fillStyle = '#fff6f9'; c.fillRect(-19, 18, 38, 5);
      if (spec.extra) { c.fillStyle = '#fff6f9'; c.beginPath(); c.arc(0, -27, 6, 0, 6.3); c.fill(); c.fillStyle = 'rgba(0,0,0,.08)'; c.beginPath(); c.arc(2, -25, 4.4, 0, 6.3); c.fill(); }
    } else { // corneta
      c.fillStyle = col; c.beginPath(); c.moveTo(-19, -3.4); c.lineTo(13, -11); c.lineTo(13, 11); c.lineTo(-19, 3.4); c.closePath(); c.fill();
      c.fillStyle = '#fff6f9';
      [[-8, 0], [1, -3], [1, 4], [8, 0], [-13, 1]].slice(0, n).forEach(([x, y]) => { c.beginPath(); c.arc(x, y, 2.2, 0, 6.3); c.fill(); });
      c.fillStyle = col2; c.beginPath(); c.ellipse(14, 0, 5, 12, 0, 0, 6.3); c.fill();
      c.fillStyle = '#8a8a99'; c.fillRect(-24, -2.2, 5.5, 4.4);
      if (spec.extra) { c.strokeStyle = col2; c.lineWidth = 2; for (let i = -1; i <= 1; i++) { c.beginPath(); c.moveTo(17, i * 5); c.quadraticCurveTo(24, i * 6 - 3, 28, i * 8 + Math.sin(i * 4) * 2); c.stroke(); } }
      if (spec.extra2) { c.strokeStyle = '#ffd23f'; c.lineWidth = 2.4; c.beginPath(); c.ellipse(14, 0, 6.4, 13, 0, 0, 6.3); c.stroke(); }
    }
    c.restore();
  }
  class ImageDuel extends Duel {
    constructor(who, done) {
      super(who, 'jose', done, { rounds: 9, need: 5, label: 'PUNTO', title: 'LA IMAGEN DISTINTA', hint: '← ↓ → o clic en el panel: señala la imagen DISTINTA antes que José', rendT: 1.1 });
      this.isImage = true;
      this.p = new Actor(who, 190, 292); this.jose = new Actor('jose', 810, 292);
      this.p.dir = 'up'; this.jose.dir = 'up';
      fixSpawn(this.p, 'sala'); fixSpawn(this.jose, 'sala');
      this.cam = CAM_SALA();
      // Clic en los paneles (además del teclado): se traduce a choose(i)
      // con las mismas coordenadas de pantalla (640×360) del dibujo.
      this.clickIdx = -1;
      try {
        const cv = document.querySelector('#cv');
        if (cv && cv.addEventListener) cv.addEventListener('pointerdown', (e) => {
          if (this.st !== 'play' || this.phase !== 'show') return;
          const r = cv.getBoundingClientRect ? cv.getBoundingClientRect() : { left: 0, top: 0, width: 640, height: 360 };
          const lx = ((e.clientX - r.left) * 640) / Math.max(1, r.width), ly = ((e.clientY - r.top) * 360) / Math.max(1, r.height);
          const i = IMG_PANELS.findIndex((pn) => lx >= pn.x && lx <= pn.x + IMG_W && ly >= pn.y && ly <= pn.y + IMG_H);
          if (i >= 0) this.clickIdx = i;
        });
      } catch (e) { /* sin canvas accesible: queda el teclado */ }
      this.begin();
    }
    level() { return this.round < 2 ? 0 : this.round < 4 ? 1 : 2; }
    setup(n) {
      const lv = this.level();
      const base = imgBase(IMG_KINDS[(Math.random() * IMG_KINDS.length) | 0]);
      const { variant, type } = imgVariant(base, lv);
      this.diffIdx = (Math.random() * 3) | 0;
      this.panels = [base, base, base]; this.panels[this.diffIdx] = variant; // exactamente UNA distinta, por construcción
      this.diffType = type;
      this.phase = 'show'; this.phaseT = 0; this.pPick = null; this.josePick = null; this.graceT = 0; this.revealT = 0; this.pendingEnd = null; this.clickIdx = -1;
      // IA de José: tarda más y acierta menos cuanto más sutil; tu Lógica lo frena un poco más
      this.joseAt = [rnd(1.5, 2.3), rnd(2.4, 3.4), rnd(3.6, 5.0)][lv] * (1 + (stat(this.who, 'logica') - 5) * 0.04);
      this.joseAcc = [0.95, 0.82, 0.6][lv];
      this.p.frameOverride = null; this.jose.frameOverride = null;
    }
    choose(i) { // elección del jugador (teclado o clic)
      if (this.st !== 'play' || this.phase !== 'show' || this.pPick !== null) return;
      this.pPick = i; this.p.emo(i === this.diffIdx ? '!' : '?', 0.7);
      if (i === this.diffIdx) { this.score('p', '¡Esa era la distinta!'); return; }
      if (this.josePick !== null) { this.score(this.josePick === this.diffIdx ? 'b' : 'tie', this.josePick === this.diffIdx ? 'José la vio y tú no' : '¡Los dos fallaron! Ronda anulada'); return; }
      // elegiste mal: José apura su respuesta; si acierta se lleva el punto, si falla se anula
      this.joseAt = Math.min(this.joseAt, this.phaseT + rnd(0.5, 1.1));
      this.say('Esa no era… José busca la suya', '#ff6b7a', 1.1);
    }
    joseAnswer() {
      const ok = Math.random() < this.joseAcc;
      this.josePick = ok ? this.diffIdx : [0, 1, 2].filter((i) => i !== this.diffIdx)[(Math.random() * 2) | 0];
      this.jose.emo(ok ? '!' : '?', 0.7);
      if (ok) { this.score('b', this.pPick !== null ? 'José la vio y tú no' : 'José la vio primero'); return; }
      if (this.pPick !== null) { this.score('tie', '¡Los dos fallaron! Ronda anulada'); return; }
      this.graceT = 1.4; this.say('¡José falló! ¡Tu turno!', '#7dff8a', 1.2); // falló primero: ventana de gracia para ti
    }
    score(w, text) {
      if (this.phase !== 'show') return;
      this.phase = 'reveal'; this.revealT = 1.4; this.pendingEnd = { w, text };
      const win = w === 'p' ? this.p : w === 'b' ? this.jose : null;
      if (win) win.hop(170);
    }
    update(dt) {
      const p = this.p, j = this.jose; p.update(dt); j.update(dt);
      if (!this.tick(dt)) return;
      if (this.phase === 'reveal') { if ((this.revealT -= dt) <= 0 && this.pendingEnd) { const pe = this.pendingEnd; this.pendingEnd = null; this.endRound(pe.w, pe.text); } return; }
      this.phaseT += dt;
      if (this.clickIdx >= 0) { const i = this.clickIdx; this.clickIdx = -1; this.choose(i); if (this.phase !== 'show') return; }
      if (G.input.hit('left')) this.choose(0); else if (G.input.hit('down')) this.choose(1); else if (G.input.hit('right')) this.choose(2);
      if (this.phase !== 'show') return;
      if (this.josePick === null && this.phaseT >= this.joseAt) { this.joseAnswer(); if (this.phase !== 'show') return; }
      if (this.graceT > 0) { if ((this.graceT -= dt) <= 0 && this.pPick === null) this.score('tie', 'Nadie la encontró: ronda anulada'); }
      else if (this.phaseT >= 8) this.score('tie', 'Se acabó el tiempo: ronda anulada');
    }
    drawPanels(c, t) {
      const reveal = this.phase === 'reveal';
      IMG_PANELS.forEach((pn, i) => {
        const gold = reveal && i === this.diffIdx;
        c.fillStyle = gold ? '#ffd23f' : '#241d33'; c.beginPath(); c.roundRect(pn.x - 5, pn.y - 5, IMG_W + 10, IMG_H + 10, 10); c.fill();
        c.fillStyle = '#f7ead9'; c.beginPath(); c.roundRect(pn.x, pn.y, IMG_W, IMG_H, 7); c.fill();
        imgDraw(c, this.panels[i], pn.x + IMG_W / 2, pn.y + IMG_H / 2 + 4, 1.55);
        // marcas de elección: pestaña con el color de cada uno y su inicial
        const mark = (who, col, label) => { c.fillStyle = col; c.beginPath(); c.roundRect(pn.x + (who === 'p' ? 6 : IMG_W - 34), pn.y + 6, 28, 15, 4); c.fill(); G.text(c, label, pn.x + (who === 'p' ? 20 : IMG_W - 20), pn.y + 13.5, { size: 8.5, stroke: false }); };
        if (this.pPick === i) mark('p', '#3f8f4f', 'TÚ');
        if (this.josePick === i) mark('b', '#8a4a6b', 'JOSÉ');
        if (reveal) { // el marco dorado ya señala la distinta; cruz sobre las elecciones erradas
          const cross = (bad) => { if (!bad) return; c.strokeStyle = '#e23b4e'; c.lineWidth = 4; c.beginPath(); c.moveTo(pn.x + IMG_W - 22, pn.y + IMG_H - 22); c.lineTo(pn.x + IMG_W - 8, pn.y + IMG_H - 8); c.moveTo(pn.x + IMG_W - 8, pn.y + IMG_H - 22); c.lineTo(pn.x + IMG_W - 22, pn.y + IMG_H - 8); c.stroke(); };
          if (this.pPick === i) cross(i !== this.diffIdx);
          if (this.josePick === i) cross(i !== this.diffIdx);
        }
      });
      if (this.phase === 'show') { // barra del tiempo de la ronda (8 s)
        c.fillStyle = 'rgba(28,24,38,.8)'; c.fillRect(88, 288, 464, 5);
        c.fillStyle = this.phaseT > 6 ? '#ff6b7a' : '#ffd23f'; c.fillRect(88, 288, 464 * Math.max(0, 1 - this.phaseT / 8), 5);
      }
      if (reveal) G.text(c, '¡ESA ERA LA DISTINTA!', 320, 104, { size: 13, color: '#ffd23f', lw: 4 });
    }
    draw(dt) {
      W.render({
        cam: this.cam, dt, light: W.LIGHT.noche, actors: [this.p, this.jose], focusZ: 292,
        over: (c, t) => { this.hud(c, t, `${this.pw} PUNTOS`, `${this.bw} PUNTOS`); if (this.panels && this.st !== 'over') this.drawPanels(c, t); },
      });
    }
  }

  // =========================================================
  // 14. GLOBOS POR LAS NUBES — vs José, Pollito dirige con
  // banderas (mejor de 5: gana quien llegue a 3 rondas)
  // =========================================================
  // DECISIONES DE JOSE (2026-11-14): Pollito dirige desde el centro
  // (plataforma en la azotea, DE FRENTE — sin espejo, como siempre en
  // frontal) con dos banderas dibujadas por código. A veces hace una
  // FINTA: levanta una bandera y la cambia rápido por la otra ANTES
  // de la señal de «¡YA!» (la señal: baja ambas banderas y destella
  // el ícono de alerta propio). Solo cuenta la indicación FINAL tras
  // la señal. Si eliges ANTES de la señal, tu elección queda fijada
  // con la indicación vigente en ese instante: si luego hay finta,
  // vuelas. José responde SOLO tras la señal con su tiempo de
  // reacción (nunca cae en la finta; pero el 22% de las veces agarra
  // el globo equivocado por apurado). Quien levanta el globo
  // correcto primero gana la ronda; si ambos aciertan, gana el más
  // rápido; quien elige mal SALE VOLANDO con su globo — se eleva
  // agarrado a él, se achica hacia el cielo entre estrellitas y
  // vuelve para la ronda siguiente: es el gag central del duelo —.
  // Si ambos fallan, ambos vuelan y la ronda no da punto.
  const BALLOON_COLORS = ['#e23b4e', '#3fa0f0', '#ffd23f', '#58c46a', '#f08cc0', '#ff9a5c', '#b48cf0'];
  let balloonMesh = null;
  function buildBalloonArena() {
    const m = new R.MB();
    m.flat(-460, -300, 920, 620, -2, '#0d0b1e'); // cielo nocturno lejano
    m.box(-280, -10, -70, 560, 10, 190, '#5d4a63', { top: '#6f5a75' }); // azotea
    m.box(-280, 0, -70, 560, 30, 10, '#4a3a52', { s: '#584664' }); // baranda del fondo
    m.box(-34, 0, -34, 68, 36, 56, '#7a6248', { top: '#8f7554' }); // plataforma de Pollito
    m.box(186, 0, -62, 8, 74, 8, '#3a3348'); m.box(156, 74, -62, 68, 5, 5, '#3a3348'); // antena
    m.box(-238, 0, -62, 52, 40, 40, '#54606e', { top: '#67727f' }); // tanque
    return m.upload();
  }
  function drawBalloon2D(c, x, y, s, color) { // globo por código: cuerpo, brillo, nudo e hilo
    c.save(); c.translate(x, y); c.scale(s, s);
    c.strokeStyle = 'rgba(240,240,255,.75)'; c.lineWidth = 1.4; c.beginPath(); c.moveTo(0, 13); c.quadraticCurveTo(3, 20, 0, 27); c.stroke();
    c.fillStyle = color; c.beginPath(); c.ellipse(0, 0, 13, 15, 0, 0, 6.3); c.fill();
    c.fillStyle = 'rgba(255,255,255,.5)'; c.beginPath(); c.ellipse(-5, -6, 4, 6, -0.5, 0, 6.3); c.fill();
    c.fillStyle = color; c.beginPath(); c.moveTo(-3, 13.5); c.lineTo(3, 13.5); c.lineTo(0, 18); c.closePath(); c.fill();
    c.restore();
  }
  function drawFlag2D(c, x, y, up, color, t, side) { // mástil + banderín que ondea (o baja junto al mástil si no está levantada)
    c.save(); c.translate(x, y);
    c.strokeStyle = '#e8e2f2'; c.lineWidth = 2.4; c.beginPath(); c.moveTo(0, 10); c.lineTo(0, -16); c.stroke();
    if (up) { const w = Math.sin(t * 9 + (side ? 2 : 0)) * 2.2; c.fillStyle = color; c.beginPath(); c.moveTo(0, -16); c.lineTo(side ? -15 : 15, -11 + w * 0.4); c.lineTo(0, -6); c.closePath(); c.fill(); }
    c.restore();
  }
  class BalloonDuel extends Duel {
    constructor(who, done) {
      super(who, 'jose', done, { rounds: 5, need: 3, label: 'RONDA', title: 'GLOBOS POR LAS NUBES', hint: 'Pollito indica con las banderas · Espera el ¡YA! y pulsa ← o → para levantar ese globo', rendT: 1.3 });
      this.isBalloons = true;
      this.p = new Actor(who, -120, 8); this.jose = new Actor('jose', 120, 8); this.cat = new Actor('pollito', 0, -8);
      this.cat.elev = 38; // sobre su plataforma, DE FRENTE dirigiendo (sin espejo)
      this.p.dir = 'up'; this.jose.dir = 'up'; this.cat.dir = 'down';
      this.cam = { x: 0, y: 0, z: 0, dist: 430, pitch: 0.42, fov: 38 };
      this.begin();
    }
    setup(n) {
      this.phase = 'flags'; this.rT = 0;
      this.cur = (Math.random() * 2) | 0; // indicación vigente: 0 = izquierda, 1 = derecha
      this.feint = n > 0 && Math.random() < 0.45; this.feintT = rnd(0.95, 1.35); this.feintDone = false; // la 1ª ronda nunca trae finta
      this.feint2 = false; this.feint2T = 0; this.feint2Done = false;
      this.signalT = rnd(1.7, 2.3); this.final = null; this.flashT = 0;
      this.pPick = null; this.bPick = null; this.joseAt = null;
      this.fly = { p: 0, b: 0 }; this.flyT = 0; this.pendingEnd = null; this.stars = [];
      this.colors = { p: shuffle([...BALLOON_COLORS]).slice(0, 2), b: shuffle([...BALLOON_COLORS]).slice(0, 2) }; // colores nuevos por ronda
      for (const a of [this.p, this.jose]) { a.elev = 0; a.scale = 1; a.spin = 0; a.tilt = 0; a.jy = 0; a.jv = 0; }
      this.cat.elev = 38;
    }
    press(side, who) {
      if (who === 'p') {
        if (this.pPick || this.phase === 'fly') return;
        // Elegir ANTES de la señal fija la elección con la indicación
        // vigente: si después hay finta, esa elección queda mal.
        this.pPick = { side, t: this.rT, early: this.phase === 'flags' };
        this.p.emo('!', 0.6); G.sfx('pick');
      } else if (!this.bPick) this.bPick = { side, t: this.rT };
    }
    signal() {
      this.phase = 'go'; this.final = this.cur; this.flashT = 0.45; // ambas banderas bajan + destello de alerta
      this.joseAt = this.rT + 0.25 + rnd(0.5, 0.85) * (G.S.flags.joseEnojado ? 0.85 : 1); // José responde tras la señal
      G.sfx('ok');
    }
    resolve() {
      const pOk = !!this.pPick && this.pPick.side === this.final;
      const bOk = !!this.bPick && this.bPick.side === this.final;
      let w, text;
      if (pOk && bOk) { w = this.pPick.t <= this.bPick.t ? 'p' : 'b'; text = w === 'p' ? '¡Ambos bien, pero fuiste más rápido!' : 'Ambos bien… José fue más rápido'; }
      else if (pOk) { w = 'p'; text = '¡Globo correcto! José sale volando'; }
      else if (bOk) { w = 'b'; text = this.pPick && this.pPick.early ? 'Te adelantaste a la señal… ¡y la finta te dejó volando!' : 'Globo equivocado: ¡a volar!'; }
      else { w = 'tie'; text = '¡Los dos volaron! La ronda no da punto'; }
      if (!pOk) this.fly.p = 0.001; // el gag: quien falla se va volando con su globo
      if (!bOk) this.fly.b = 0.001;
      this.phase = 'fly'; this.flyT = 1.7; this.pendingEnd = { w, text };
      if (w === 'p') this.p.hop(150); else if (w === 'b') this.jose.hop(150);
      G.sfx(w === 'tie' ? 'msg' : 'party');
    }
    update(dt) {
      const p = this.p, j = this.jose, cat = this.cat; p.update(dt); j.update(dt); cat.update(dt);
      if (!this.tick(dt)) return;
      this.rT += dt;
      if (this.flashT > 0) this.flashT -= dt;
      // Vuelos en curso: sube agarrado al globo, se achica, estrellitas
      for (const [key, a] of [['p', p], ['b', j]]) {
        if (this.fly[key] > 0) {
          this.fly[key] += dt;
          const k = Math.min(1, this.fly[key] / 1.5), e = 1 - (1 - k) * (1 - k);
          a.elev = e * 250; a.scale = 1 - e * 0.5; a.tilt = Math.sin(this.fly[key] * 5) * 0.13;
          if (Math.random() < 0.4) this.stars.push({ x: a.x + rnd(-16, 16), y: a.elev + rnd(24, 64), z: a.y, t: 0 });
        }
      }
      this.stars.forEach((s) => (s.t += dt)); this.stars = this.stars.filter((s) => s.t < 0.8);
      if (this.phase === 'fly') { if ((this.flyT -= dt) <= 0 && this.pendingEnd) { const pe = this.pendingEnd; this.pendingEnd = null; this.endRound(pe.w, pe.text); } return; }
      if (this.phase === 'flags') {
        if (this.feint && !this.feintDone && this.rT >= this.feintT) {
          this.feintDone = true; this.cur = 1 - this.cur; cat.emo('!', 0.5); // LA FINTA: cambia la bandera antes de la señal
          if (Math.random() < 0.25) { this.feint2 = true; this.feint2T = this.rT + rnd(0.35, 0.5); } // a veces, doble finta
        }
        if (this.feint2 && !this.feint2Done && this.rT >= this.feint2T) { this.feint2Done = true; this.cur = 1 - this.cur; cat.emo('!', 0.5); }
        if (this.rT >= this.signalT) this.signal();
      }
      if (G.input.hit('left')) this.press(0, 'p'); else if (G.input.hit('right')) this.press(1, 'p');
      if (this.phase === 'go') {
        if (this.bPick === null && this.rT >= this.joseAt) { const wrong = Math.random() < 0.22; this.press(wrong ? 1 - this.final : this.final, 'b'); this.jose.emo(wrong ? '?' : '!', 0.6); }
        if ((this.pPick && this.bPick) || this.rT >= this.signalT + 1.9) { if (!this.pPick) this.pPick = { side: -1, t: 1e9, early: false }; this.resolve(); }
      }
    }
    drawStage(c, t) {
      // Pollito y sus banderas (de frente, sin espejo)
      const ch = this.cat.head(8);
      const upSide = this.flashT > 0 ? -1 : this.phase === 'flags' ? this.cur : this.final; // durante el destello, AMBAS bajan
      drawFlag2D(c, ch.x - 21, ch.y + 16, upSide === 0, '#ff6b7a', t, 0);
      drawFlag2D(c, ch.x + 21, ch.y + 16, upSide === 1, '#4db2ff', t, 1);
      if (this.flashT > 0) { G.icon(c, 'alerta', ch.x, ch.y - 30, 26); G.text(c, '¡YA!', ch.x, ch.y - 54, { size: 17, color: '#ffd23f', lw: 5 }); }
      // los globos de cada concursante (el elegido se infla y acompaña; si vuela, se lo lleva)
      for (const [a, cols, pick] of [[this.p, this.colors.p, this.pPick], [this.jose, this.colors.b, this.bPick]]) {
        const hd = a.head(4);
        for (let side = 0; side < 2; side++) {
          const chosen = pick && pick.side === side;
          // el globo ELEGIDO va en la mano (y se lo lleva si sale volando);
          // el otro se queda flotando junto a su puesto, en el suelo
          if (chosen) drawBalloon2D(c, hd.x + (side ? 30 : -30), hd.y - 20 + Math.sin(t * 3 + side * 2) * 2, 1.3, cols[side]);
          else { const g = R.project(a.x + (side ? 17 : -17), 34, a.y); if (g.ok) drawBalloon2D(c, g.x, g.y - 14 + Math.sin(t * 3 + side * 2) * 2, 0.95, cols[side]); }
        }
      }
      for (const s of this.stars) { const pr = R.project(s.x, s.y, s.z); if (pr.ok) imgStar(c, pr.x, pr.y, 6 - s.t * 5, '#ffe58a'); }
      if (this.phase === 'flags') G.text(c, this.pPick ? 'Elección fijada… a ver si no hay finta' : 'Pollito está indicando… espera el ¡YA!', 320, 318, { size: 11, color: '#b7a8e8', lw: 4 });
      if (this.phase === 'go' && !this.pPick) G.text(c, '¡YA!  ← / →', 320, 300 + Math.sin(t * 10) * 2, { size: 15, color: '#ffd23f', lw: 5 });
    }
    draw(dt) {
      if (!balloonMesh && R.gl) balloonMesh = buildBalloonArena(); // la malla se sube al primer draw con WebGL presente
      W.render({
        cam: this.cam, dt, mesh: balloonMesh, actors: [this.p, this.cat, this.jose], noApartment: true,
        light: { amb: [0.5, 0.48, 0.62], sun: [0.3, 0.3, 0.38], sky: '#0d0b1e', points: [{ x: 0, y: 80, z: -20, r: 380, c: [0.35, 0.3, 0.2] }] },
        over: (c, t) => { this.hud(c, t, `${this.pw} RONDAS`, `${this.bw} RONDAS`); if (this.st !== 'over') this.drawStage(c, t); },
      });
    }
  }

  // =========================================================
  // 14. FINAL J1407b — SPACE_RINGS_ENDING (pedido de Jose, 2026-11-21)
  // Cadena de escenas del final alternativo: cinemática de despegue
  // en la azotea → 1A «Anillos de J1407b» (carrera 2 vs 2 en cohete
  // sobre un anillo, inspirada en Cosmic Coaster) → transición con
  // los cohetes averiados → 1B «Cinturón de asteroides» (duelo 1 vs 1
  // flotando con inercia, inspirado en Mass Meteor) → fiesta en
  // gravedad baja sobre el anillo mayor y foto de grupo.
  // REGLA DE JOSE: las ESCENAS se programan en 3D con el motor WebGL
  // (geometría, materiales por código, luces y cámara) — NO se usa
  // ninguna imagen de fondo. La pista ES la geometría del anillo, el
  // cinturón son rocas en el espacio 3D y la plataforma una losa sobre
  // el anillo. Personajes, cohetes, ítems y obstáculos van como
  // billboards o lienzos DIBUJADOS POR CÓDIGO (abajo), igual que las
  // galaxias de la Escalada: ningún archivo de imagen nuevo.
  // VENTAJA CRUZADA (aprobada para esta implementación): ganar 1A da
  // SALIDA ADELANTADA en 1B = empiezas BELT_ADV unidades más cerca
  // del aro (ver AsteroidBeltDuel). Perder 1B NO es derrota de
  // partida: el final se alcanza igual; cambia el cierre (José
  // "descubrió" el planeta y el pastel sale magullado si perdiste 1B
  // o chocaste 3+ veces en el cinturón).
  // ACCESO: práctica (entradas propias «anillos», «cinturon» y la
  // cadena «finalj1407b»), G.startSpaceEnding() en game.js y la
  // HISTORIA: el clímax de main() corre la cadena si G.spaceReady
  // se cumple (Escalada espacial ganada + Preparación ≥ 80 +
  // Sospecha < 50), con la siembra del telescopio en la Escalada y
  // la foto del cohete ~13:00. Si Leyendas también se habilita,
  // ELIGE EL JUGADOR (decisión de Jose, 2026-11-21).
  // IDENTIDAD: Pollito es el gato blanco atigrado de su hoja definida
  // (Actor normal: frontal sin espejo, escala de su bundle); en 1A va
  // de copiloto del rival y en 1B flota libre como caos. José conserva
  // sus lentes: el aturdido se marca con giro + estrellitas FUERA del
  // casco, nunca repintando ojos sobre sus lentes. El casco burbuja es
  // un overlay dibujado por código sobre cualquier sprite (drawHelmet).
  // =========================================================
  const spaceHash = (n) => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };
  // Copiloto de 1A: el partner de mayor afinidad; sin sistema de
  // afinidad en la v3.1, es el PRIMER partner de la party (en
  // práctica, el primer roomie distinto del protagonista).
  function spaceCopilotOf(who) {
    const ps = (G.S && G.S.partners) || [];
    return ps.find((id) => id !== who) || G.PLAYABLE.find((id) => id !== who) || 'majo';
  }
  // Cielo profundo por código: estrellas (brillos planos lejanos) y
  // las galaxias de la Escalada, recolocadas por tramos según cx.
  function drawSpaceSky(t, cx) {
    const seg = Math.floor(cx / 700), anchor = seg * 700;
    for (let i = 0; i < 60; i++) {
      const x = anchor - 620 + spaceHash(i * 3.13 + seg * 57.7) * 1240;
      const y = 26 + spaceHash(i * 7.31 + seg * 91.3) * 400;
      R.flat(R.glowTex, x, y, -860, 1.6 + spaceHash(i * 5.7) * 2.6, { tint: [0.85, 0.9, 1], alpha: 0.35 + 0.3 * (0.5 + 0.5 * Math.sin(t * 1.7 + i * 1.3)) });
    }
    for (let j = 0; j < 2; j++) {
      const gx = anchor - 420 + spaceHash(seg * 41.7 + j * 173.3) * 900, gy = 120 + spaceHash(seg * 29.9 + j * 61.1) * 260;
      R.sprite(galaxyCv(((seg + j) % 3 + 3) % 3), gx, gy - 70, -880, { w: 140, h: 140, roll: spaceHash(j * 7 + seg) * 1.2 - 0.6, alpha: 0.75, lit: 0, nostretch: true });
    }
  }
  // J1407b por código: esfera con bandas en la paleta de la ficha y
  // sus anillos concéntricos (arcos traseros y delanteros). Es un
  // lienzo generado, no un archivo: va de billboard gigante al fondo.
  let planetCvCache = null;
  function planetCv() {
    if (planetCvCache) return planetCvCache;
    const cv = document.createElement('canvas'); cv.width = cv.height = 360;
    const x = cv.getContext('2d'), C = 180;
    x.save(); x.translate(C, C); x.scale(1, 0.3);
    for (let i = 0; i < 9; i++) { x.beginPath(); x.arc(0, 0, 128 + i * 9, 0, 6.3); x.lineWidth = i % 2 ? 3 : 5; x.strokeStyle = `rgba(217,164,91,${0.2 + (i % 3) * 0.09})`; x.stroke(); }
    x.restore();
    const bands = ['#c68f4e', '#e3b77e', '#b97f3e', '#eecfa0', '#c68f4e', '#d9a45b', '#b97f3e', '#e3b77e'];
    x.save(); x.beginPath(); x.arc(C, C, 118, 0, 6.3); x.clip();
    bands.forEach((col, i) => { x.fillStyle = col; x.fillRect(C - 118, C - 118 + i * 30, 236, 30); });
    const g = x.createRadialGradient(C - 40, C - 46, 30, C, C, 150);
    g.addColorStop(0, 'rgba(255,246,220,.38)'); g.addColorStop(0.55, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(10,8,30,.5)');
    x.fillStyle = g; x.fillRect(C - 118, C - 118, 236, 236);
    x.restore();
    x.beginPath(); x.arc(C, C, 118, 0, 6.3); x.lineWidth = 2; x.strokeStyle = 'rgba(255,240,210,.5)'; x.stroke();
    x.save(); x.translate(C, C); x.scale(1, 0.3);
    for (let i = 0; i < 9; i++) { x.beginPath(); x.arc(0, 0, 128 + i * 9, Math.PI * 0.12, Math.PI * 0.88); x.lineWidth = i % 2 ? 3 : 5; x.strokeStyle = `rgba(227,183,126,${0.35 + (i % 3) * 0.1})`; x.stroke(); }
    x.restore();
    planetCvCache = cv; return cv;
  }
  const ROCKET_PAL = {
    party: { body: '#f5e6c8', body2: '#e8d3a8', acc: '#e4573d', fin: '#2fa8a0', win: '#274b5c' },
    rival: { body: '#4a3566', body2: '#5d4780', acc: '#58c46a', fin: '#3f9e58', win: '#241a38' },
  };
  // Cohete en vista TRASERA (para 1A): en la ventanilla se ven las
  // NUCAS con casco de piloto y copiloto, nunca las caras (defecto de
  // la hoja de concepto corregido aquí, como marca la ficha).
  const rocketBackCache = {};
  function rocketBackCv(livery) {
    if (rocketBackCache[livery]) return rocketBackCache[livery];
    const P = ROCKET_PAL[livery];
    const cv = document.createElement('canvas'); cv.width = 170; cv.height = 150;
    const x = cv.getContext('2d');
    x.fillStyle = P.fin;
    x.beginPath(); x.moveTo(28, 62); x.lineTo(6, 128); x.lineTo(40, 128); x.lineTo(52, 84); x.closePath(); x.fill();
    x.beginPath(); x.moveTo(142, 62); x.lineTo(164, 128); x.lineTo(130, 128); x.lineTo(118, 84); x.closePath(); x.fill();
    x.fillStyle = P.body; x.beginPath(); x.ellipse(85, 76, 56, 62, 0, 0, 6.3); x.fill();
    x.fillStyle = P.body2; x.beginPath(); x.ellipse(85, 76, 56, 62, 0, 0, Math.PI); x.fill();
    x.fillStyle = P.acc; x.fillRect(31, 94, 108, 10);
    x.fillStyle = P.win; x.beginPath(); x.arc(85, 56, 30, 0, 6.3); x.fill();
    x.lineWidth = 4; x.strokeStyle = '#c8ccd8'; x.stroke();
    for (const hx of [70, 100]) { // dos cascos vistos desde atrás
      x.fillStyle = 'rgba(190,220,255,.92)'; x.beginPath(); x.arc(hx, 58, 12.5, 0, 6.3); x.fill();
      x.fillStyle = '#5a4030'; x.beginPath(); x.ellipse(hx, 63, 11, 7, 0, 0, Math.PI); x.fill();
      x.fillStyle = 'rgba(255,255,255,.85)'; x.beginPath(); x.arc(hx - 4, 52, 3.4, 0, 6.3); x.fill();
    }
    x.fillStyle = '#3a3348'; x.beginPath(); x.moveTo(70, 130); x.lineTo(100, 130); x.lineTo(94, 146); x.lineTo(76, 146); x.closePath(); x.fill();
    rocketBackCache[livery] = cv; return cv;
  }
  // Cohete vertical de perfil (despegue, transición y plataforma).
  const rocketSideCache = {};
  function rocketSideCv(livery, damaged) {
    const key = livery + (damaged ? 'd' : '');
    if (rocketSideCache[key]) return rocketSideCache[key];
    const P = ROCKET_PAL[livery];
    const cv = document.createElement('canvas'); cv.width = 170; cv.height = 200;
    const x = cv.getContext('2d');
    x.fillStyle = P.fin;
    x.beginPath(); x.moveTo(58, 128); x.lineTo(26, 182); x.lineTo(58, 182); x.closePath(); x.fill();
    x.beginPath(); x.moveTo(112, 128); x.lineTo(144, 182); x.lineTo(112, 182); x.closePath(); x.fill();
    x.fillStyle = P.body; x.beginPath(); x.roundRect(55, 26, 60, 138, 29); x.fill();
    x.fillStyle = P.acc; x.beginPath(); x.roundRect(55, 26, 60, 34, 16); x.fill();
    x.fillStyle = P.body2; x.fillRect(55, 118, 60, 9);
    x.fillStyle = P.win; x.beginPath(); x.arc(85, 80, 17, 0, 6.3); x.fill();
    x.lineWidth = 3.4; x.strokeStyle = '#c8ccd8'; x.stroke();
    x.fillStyle = 'rgba(190,220,255,.92)'; x.beginPath(); x.arc(85, 82, 10.5, 0, 6.3); x.fill();
    x.fillStyle = '#5a4030'; x.beginPath(); x.ellipse(85, 86, 9.5, 6, 0, 0, Math.PI); x.fill();
    x.strokeStyle = 'rgba(40,32,54,.55)'; x.lineWidth = 2; x.beginPath(); x.roundRect(67, 106, 36, 42, 8); x.stroke();
    x.fillStyle = '#3a3348'; x.beginPath(); x.moveTo(72, 164); x.lineTo(98, 164); x.lineTo(93, 178); x.lineTo(77, 178); x.closePath(); x.fill();
    if (damaged) { // averiado: manchas de hollín, abolladuras y una grieta
      x.fillStyle = 'rgba(70,66,80,.5)';
      x.beginPath(); x.ellipse(70, 120, 13, 9, 0.4, 0, 6.3); x.fill();
      x.beginPath(); x.ellipse(98, 52, 10, 7, -0.3, 0, 6.3); x.fill();
      x.strokeStyle = 'rgba(30,26,40,.7)'; x.lineWidth = 1.8;
      x.beginPath(); x.moveTo(88, 96); x.lineTo(94, 110); x.lineTo(89, 122); x.stroke();
    }
    rocketSideCache[key] = cv; return cv;
  }
  // Llama de motor por código (punta hacia abajo).
  let flameCvCache = null;
  function flameCv() {
    if (flameCvCache) return flameCvCache;
    const cv = document.createElement('canvas'); cv.width = 60; cv.height = 84;
    const x = cv.getContext('2d');
    const drop = (w, h, col) => { x.fillStyle = col; x.beginPath(); x.moveTo(30 - w, 4); x.quadraticCurveTo(30 - w * 0.7, h * 0.55, 30, h); x.quadraticCurveTo(30 + w * 0.7, h * 0.55, 30 + w, 4); x.quadraticCurveTo(30, h * 0.22, 30 - w, 4); x.fill(); };
    drop(19, 80, '#e4573d'); drop(13, 62, '#ff9a2e'); drop(7, 40, '#2fa8a0');
    flameCvCache = cv; return cv;
  }
  // Rocas por código: asteroide con cráteres y las 3 formas de fiesta
  // (pastel, globo, regalo) en roca gris, como guiño de Mass Meteor.
  const rockCache = {};
  function rockCv(kind, seed) {
    const key = kind + ':' + seed;
    if (rockCache[key]) return rockCache[key];
    const cv = document.createElement('canvas'); cv.width = cv.height = 96;
    const x = cv.getContext('2d');
    const R1 = (n) => spaceHash(seed * 31.7 + n * 7.3);
    const craters = (cx, cy, r, n) => { x.fillStyle = 'rgba(40,38,52,.35)'; for (let i = 0; i < (n || 4); i++) { x.beginPath(); x.arc(cx + (R1(i + 9) - 0.5) * r, cy + (R1(i + 13) - 0.5) * r, 3 + R1(i + 5) * 5, 0, 6.3); x.fill(); } };
    if (kind === 'pastel') {
      x.fillStyle = '#7d7a88';
      x.beginPath(); x.roundRect(18, 58, 60, 20, 6); x.fill();
      x.beginPath(); x.roundRect(26, 40, 44, 20, 6); x.fill();
      x.beginPath(); x.roundRect(34, 24, 28, 18, 6); x.fill();
      craters(48, 52, 40, 5);
      x.fillStyle = '#d8d3e0'; x.fillRect(46, 10, 4, 13);
      x.fillStyle = '#ff9a2e'; x.beginPath(); x.ellipse(48, 7, 3, 4.6, 0, 0, 6.3); x.fill();
    } else if (kind === 'globo') {
      x.strokeStyle = '#8a8a99'; x.lineWidth = 1.6; x.beginPath(); x.moveTo(48, 72); x.quadraticCurveTo(52, 80, 48, 90); x.stroke();
      x.fillStyle = '#7d7a88'; x.beginPath(); x.ellipse(48, 40, 26, 31, 0, 0, 6.3); x.fill();
      craters(48, 40, 36, 4);
      x.fillStyle = '#7d7a88'; x.beginPath(); x.moveTo(44, 70); x.lineTo(52, 70); x.lineTo(48, 76); x.closePath(); x.fill();
    } else if (kind === 'regalo') {
      x.fillStyle = '#7d7a88'; x.beginPath(); x.roundRect(22, 32, 52, 44, 5); x.fill();
      x.fillStyle = 'rgba(40,38,52,.4)'; x.fillRect(44, 32, 8, 44); x.fillRect(22, 48, 52, 7);
      x.fillStyle = '#8f8b9a';
      x.beginPath(); x.ellipse(39, 26, 9, 5.4, -0.6, 0, 6.3); x.fill();
      x.beginPath(); x.ellipse(57, 26, 9, 5.4, 0.6, 0, 6.3); x.fill();
      craters(48, 56, 34, 3);
    } else {
      x.fillStyle = '#7d7a88'; x.beginPath();
      for (let i = 0; i < 8; i++) { const a = (i / 8) * 6.283, rr = 34 * (0.82 + R1(i) * 0.3), px = 48 + Math.cos(a) * rr, py = 48 + Math.sin(a) * rr; if (i === 0) x.moveTo(px, py); else x.quadraticCurveTo(48 + Math.cos(a - 0.39) * 35, 48 + Math.sin(a - 0.39) * 35, px, py); }
      x.closePath(); x.fill();
      x.fillStyle = 'rgba(255,255,255,.13)'; x.beginPath(); x.ellipse(36, 34, 13, 9, -0.6, 0, 6.3); x.fill();
      craters(48, 48, 44, 5);
    }
    rockCache[key] = cv; return cv;
  }
  // Aros de meta por código: aro de luz (fin de 1A) y aro a cuadros (1B).
  const ringGoalCache = {};
  function ringGoalCv(kind) {
    if (ringGoalCache[kind]) return ringGoalCache[kind];
    const cv = document.createElement('canvas'); cv.width = cv.height = 180;
    const x = cv.getContext('2d');
    if (kind === 'luz') {
      const g = x.createRadialGradient(90, 90, 30, 90, 90, 88);
      g.addColorStop(0, 'rgba(255,210,63,0)'); g.addColorStop(0.72, 'rgba(255,210,63,.14)'); g.addColorStop(0.85, 'rgba(255,210,63,.4)'); g.addColorStop(1, 'rgba(255,210,63,0)');
      x.fillStyle = g; x.fillRect(0, 0, 180, 180);
      x.beginPath(); x.arc(90, 90, 66, 0, 6.3); x.lineWidth = 13; x.strokeStyle = '#ffd23f'; x.stroke();
      x.beginPath(); x.arc(90, 90, 66, 0, 6.3); x.lineWidth = 4; x.strokeStyle = '#fff3c4'; x.stroke();
      x.fillStyle = '#fff3c4';
      [[90, 12], [168, 90], [90, 168], [12, 90]].forEach(([px, py]) => { x.fillRect(px - 1.5, py - 6, 3, 12); x.fillRect(px - 6, py - 1.5, 12, 3); });
    } else {
      for (let i = 0; i < 16; i++) { x.beginPath(); x.arc(90, 90, 68, (i / 16) * 6.283, ((i + 1) / 16) * 6.283); x.lineWidth = 17; x.strokeStyle = i % 2 ? '#e8e2f2' : '#2b2540'; x.stroke(); }
      x.beginPath(); x.arc(90, 90, 59, 0, 6.3); x.lineWidth = 1.6; x.strokeStyle = '#ffd23f'; x.stroke();
    }
    ringGoalCache[kind] = cv; return cv;
  }
  // CASCO BURBUJA: overlay transparente dibujado por código sobre
  // cualquier actor (burbuja con brillo + anillo de cuello), sin tapar
  // la cara. Con thrust, la mochila de atrás echa su llamita. Las
  // estrellitas del aturdido van FUERA del casco (stunStars).
  function drawHelmet(c, a, thrust) {
    const top = (a.id === 'pollito' ? 34 : Sp.charTop(a.id) + 3) * R.stretch * a.scale;
    const pc = R.project(a.x, a.elev + top * 0.7, a.y);
    if (!pc.ok) return;
    const r = Math.max(9, top * 0.36);
    c.save();
    c.fillStyle = '#5a5470'; c.beginPath(); c.roundRect(pc.x - r - 13, pc.y - r * 0.2, 11, r * 1.15, 3); c.fill();
    c.fillStyle = '#8f8aa8'; c.beginPath(); c.roundRect(pc.x - r - 13, pc.y - r * 0.2, 11, 5, 3); c.fill();
    if (thrust) { c.fillStyle = '#ff9a2e'; c.beginPath(); c.moveTo(pc.x - r - 11, pc.y + r * 0.95); c.lineTo(pc.x - r - 4, pc.y + r * 0.95); c.lineTo(pc.x - r - 7.5, pc.y + r * 1.5); c.closePath(); c.fill(); }
    c.beginPath(); c.arc(pc.x, pc.y, r, 0, 6.3);
    c.fillStyle = 'rgba(165,205,255,.13)'; c.fill();
    c.lineWidth = 1.8; c.strokeStyle = 'rgba(215,238,255,.95)'; c.stroke();
    c.beginPath(); c.arc(pc.x, pc.y, r, Math.PI * 1.12, Math.PI * 1.52); c.lineWidth = 2.6; c.strokeStyle = 'rgba(255,255,255,.85)'; c.stroke();
    c.beginPath(); c.ellipse(pc.x, pc.y + r * 0.92, r * 0.55, r * 0.16, 0, 0, 6.3);
    c.fillStyle = '#c8ccd8'; c.fill(); c.lineWidth = 1; c.strokeStyle = '#7a7f92'; c.stroke();
    c.restore();
  }

  // ---------- 1A. ANILLOS DE J1407B (Cosmic Coaster) ----------
  const RING_LEN = 6200, RING_LANES = [-52, 0, 52];
  class RingRaceDuel extends Duel {
    constructor(who, done, o) {
      super(who, 'jose', done, { rounds: 1, need: 1, label: 'CARRERA', title: 'ANILLOS DE J1407B', hint: '← → para cambiar de carril · Si tu copiloto sugiere otro carril y vas al contrario, el cohete duda', rendT: 1.6 });
      this.isRingRace = true; this.quietRend = true;
      this.copilotId = (o && o.copilot) || spaceCopilotOf(who);
      this.cat = new Actor('pollito', RING_LANES[2] + 17, -40);
      this.cat.dir = 'down'; this.cat.elev = 30;
      this.cam = { x: 0, y: 10, z: 96, dist: 330, pitch: 0.3, fov: 42 };
      // Táctil (mismo patrón que el clic de La imagen distinta):
      // mitad izquierda/derecha de la pantalla = cambiar de carril.
      // El listener se guarda y se RETIRA en finish(): antes quedaba
      // colgado en el canvas para siempre, uno más por cada carrera
      // jugada (revisión 2026-11-21).
      this.tapDir = 0; this.tapCv = null; this.tapH = null;
      try {
        const cv = document.querySelector('#cv');
        if (cv && cv.addEventListener) {
          this.tapCv = cv;
          this.tapH = (e) => {
            if (this.st !== 'play') return;
            const r = cv.getBoundingClientRect ? cv.getBoundingClientRect() : { left: 0, width: 640 };
            this.tapDir = ((e.clientX - r.left) / Math.max(1, r.width)) < 0.5 ? -1 : 1;
          };
          cv.addEventListener('pointerdown', this.tapH);
        }
      } catch (e) { /* sin canvas accesible: queda el teclado */ }
      this.begin();
    }
    setup() {
      this.prog = 0; this.rprog = 0; this.elapsed = 0;
      this.v = 30; this.rv = 30;
      this.cruise = 97 + stat(this.who, 'velocidad') * 2.4; this.rcruise = 112;
      this.lane = 1; this.laneX = RING_LANES[1]; this.rlane = 2; this.rlaneX = RING_LANES[2];
      this.crashT = 0; this.rcrashT = 0; this.crashesP = 0; this.crashesB = 0;
      this.doubtT = 0; this.sug = null; this.sugCd = 2.5;
      this.meteors = []; this.nextMet = 520; this.finished = false;
      this.cat.x = RING_LANES[2] + 17; this.cat.y = -40; this.cat.elev = 30;
    }
    press(dir) {
      const nl = Math.max(0, Math.min(2, this.lane + dir));
      if (nl === this.lane) return;
      if (this.sug && this.sug.t > 0) { // desacuerdo con el copiloto: DUDA de 0,3 s
        const sugDir = Math.sign(this.sug.lane - this.lane);
        if (sugDir !== 0 && dir !== sugDir) { this.doubtT = 0.3; this.say('¡No coincidimos! El cohete duda…', '#ffd23f', 0.9); }
      }
      this.lane = nl; G.sfx('pick');
    }
    spawnMeteor(at) {
      const dbl = Math.random() < 0.45;
      const lanes = dbl ? (Math.random() < 0.5 ? [0, 1] : [1, 2]) : [(Math.random() * 3) | 0];
      this.meteors.push({ prog: at, lanes, hitP: false, hitB: false, rDodge: false, rot: rnd(0, 6.3), seed: (Math.random() * 3) | 0 });
    }
    crashP() {
      this.crashT = 2.3; this.crashesP++; this.v *= 0.45;
      W.puff(this.laneX, -4, 7, true); G.sfx('bad');
      this.say('¡Choque! El cohete se frena…', '#ff6b7a', 1.1);
      this.cat.hop(170); // Pollito se ríe del choque ajeno (salta en su ventanilla)
    }
    crashB() {
      this.rcrashT = 2.3; this.crashesB++; this.rv *= 0.45;
      W.puff(this.rlaneX, Math.max(-330, -(this.rprog - this.prog)), 7, true); G.sfx('meow');
      this.cat.emo('!!', 0.9); // Pollito se asusta si chocan ellos
      if (this.crashesB === 1) this.say('¡El rival chocó! Pollito se asustó', '#7dff8a', 1.1);
    }
    finish(w) {
      if (this.finished) return; this.finished = true;
      if (this.tapCv && this.tapH && this.tapCv.removeEventListener) { try { this.tapCv.removeEventListener('pointerdown', this.tapH); } catch (e) { /* noop */ } }
      this.tapH = null;
      this.endRound(w, w === 'p' ? '¡Cruzaste el aro de luz primero!' : w === 'b' ? 'José cruzó el aro de luz primero…' : '¡Llegaron al aro a la vez!');
    }
    extra() { return { spaceRace: 'anillos', crashesP: this.crashesP, crashesB: this.crashesB, copilot: this.copilotId }; }
    update(dt) {
      const cat = this.cat; cat.update(dt);
      if (!this.tick(dt)) return;
      this.elapsed += dt;
      if (this.tapDir) { this.press(this.tapDir); this.tapDir = 0; }
      if (G.input.hit('left')) this.press(-1); else if (G.input.hit('right')) this.press(1);
      if (this.doubtT > 0) this.doubtT -= dt;
      // El cohete acelera solo; chocar FRENA unos segundos, no elimina.
      const cT = this.crashT > 0 ? this.cruise * 0.34 : this.cruise;
      this.v += (cT - this.v) * Math.min(1, dt * (this.crashT > 0 ? 3.2 : 0.55));
      if (this.crashT > 0) this.crashT -= dt;
      const rcT = this.rcrashT > 0 ? this.rcruise * 0.34 : this.rcruise;
      this.rv += (rcT - this.rv) * Math.min(1, dt * (this.rcrashT > 0 ? 3.2 : 0.55));
      if (this.rcrashT > 0) this.rcrashT -= dt;
      const prevP = this.prog, prevB = this.rprog;
      this.prog += this.v * dt; this.rprog += this.rv * dt;
      // Carril real del jugador: con la duda puesta, el cambio tarda más.
      const tx = RING_LANES[this.lane], stL = (this.doubtT > 0 ? 120 : 300) * dt;
      this.laneX += Math.max(-stL, Math.min(stL, tx - this.laneX));
      // IA del rival: esquiva el meteorito que tenga delante (84%).
      const nm = this.meteors.find((mm) => mm.prog > this.rprog + 30 && mm.prog < this.rprog + 320 && mm.lanes.includes(this.rlane));
      if (nm && !nm.rDodge) {
        nm.rDodge = true;
        if (Math.random() < 0.84) { const safe = [0, 1, 2].filter((l) => !nm.lanes.includes(l)); this.rlane = safe.sort((a, b) => Math.abs(a - this.rlane) - Math.abs(b - this.rlane))[0]; }
      }
      const rtx = RING_LANES[this.rlane], rst = 240 * dt;
      this.rlaneX += Math.max(-rst, Math.min(rst, rtx - this.rlaneX));
      // Meteoritos por delante del que vaya primero.
      const lead = Math.max(this.prog, this.rprog);
      while (this.nextMet < lead + 1500) { this.spawnMeteor(this.nextMet); this.nextMet += rnd(330, 500) * Math.max(0.72, 1 - this.elapsed / 300); }
      // El copiloto sugiere el carril seguro del próximo meteorito.
      if (this.sugCd > 0) this.sugCd -= dt;
      if (this.sug) { this.sug.t -= dt; if (this.sug.t <= 0 || this.sug.mProg < this.prog - 40) this.sug = null; }
      if (!this.sug && this.sugCd <= 0) {
        const m = this.meteors.find((mm) => mm.prog > this.prog + 120 && mm.prog < this.prog + 1000);
        if (m) { const safe = [0, 1, 2].filter((l) => !m.lanes.includes(l)); const sl = safe.includes(this.lane) ? this.lane : safe[(Math.random() * safe.length) | 0]; this.sug = { lane: sl, t: 2.4, mProg: m.prog }; this.sugCd = 5.5; }
      }
      // Choques al cruzar la línea de cada meteorito.
      for (const m of this.meteors) {
        if (!m.hitP && prevP < m.prog && this.prog >= m.prog) { m.hitP = true; if (m.lanes.some((l) => Math.abs(RING_LANES[l] - this.laneX) < 34)) this.crashP(); }
        if (!m.hitB && prevB < m.prog && this.rprog >= m.prog) { m.hitB = true; if (m.lanes.some((l) => Math.abs(RING_LANES[l] - this.rlaneX) < 34)) this.crashB(); }
        m.rot += dt * 0.7;
      }
      this.meteors = this.meteors.filter((m) => m.prog > Math.min(this.prog, this.rprog) - 260);
      // Pollito acompaña al cohete rival, asomado en su ventanilla.
      const rz = Math.max(-330, Math.min(150, -(this.rprog - this.prog)));
      cat.x = this.rlaneX + 17; cat.y = rz - 3; cat.elev = 30 + Math.sin(this.T * 2.2) * 1.6;
      if (this.prog >= RING_LEN) return this.finish('p');
      if (this.rprog >= RING_LEN) return this.finish('b');
      if (this.elapsed > 115) return this.finish(this.prog > this.rprog + 30 ? 'p' : this.rprog > this.prog + 30 ? 'b' : 'tie');
    }
    endOverlay(c) {
      const w = this.result.win;
      c.fillStyle = 'rgba(16,12,26,.85)'; c.fillRect(0, 0, 640, 360);
      G.icon(c, w === 'win' ? 'trofeo' : w === 'tie' ? 'empate' : 'derrota', 320, 84, 48);
      G.text(c, w === 'win' ? '¡GANASTE!' : w === 'tie' ? 'EMPATE' : 'GANÓ JOSÉ', 320, 138, { size: 40, color: w === 'win' ? '#7dff8a' : w === 'tie' ? '#ffd23f' : '#ff6b7a', lw: 9 });
      G.text(c, `Choques — Tú: ${this.crashesP} · José y Pollito: ${this.crashesB}`, 320, 182, { size: 17, lw: 6 });
      G.text(c, w === 'win' ? 'Ventaja: en el Cinturón de asteroides sales más cerca del aro' : 'La revancha es flotando: el Cinturón de asteroides decide', 320, 208, { size: 11, color: '#b7a8e8' });
    }
    draw(dt) {
      const rz = Math.max(-330, Math.min(150, -(this.rprog - this.prog)));
      W.render({
        cam: this.cam, dt, mesh: null, actors: [this.cat], noApartment: true,
        light: { amb: [0.42, 0.44, 0.62], sun: [0.3, 0.3, 0.42], sky: '#0a1030', points: [{ x: 0, y: 120, z: -300, r: 700, c: [0.3, 0.3, 0.25] }] },
        boxes: (mb) => { // LA PISTA ES EL ANILLO: cinta 3D que avanza, con 3 carriles y divisorias teal emisivas
          const SEG = 90, off = this.prog % SEG, base = Math.floor(this.prog / SEG);
          for (let i = 0; i < 15; i++) {
            const zTop = 60 - i * SEG + off, sp = (base + i) * SEG, band = Math.floor(sp / 1500) % 3;
            mb.flat(-108, zTop - SEG, 216, SEG + 2, 0, ['#b97f3e', '#d9a45b', '#a8743a'][band]);
            mb.flat(-28, zTop - SEG, 4, SEG + 2, 0.5, '#2fa8a0', true);
            mb.flat(24, zTop - SEG, 4, SEG + 2, 0.5, '#2fa8a0', true);
            mb.flat(-112, zTop - SEG, 4, SEG + 2, 0.5, '#e4573d', true);
            mb.flat(108, zTop - SEG, 4, SEG + 2, 0.5, '#e4573d', true);
          }
        },
        sprites: (t) => {
          drawSpaceSky(t, 0);
          R.sprite(planetCv(), 190, -170, -1350, { w: 780, h: 780, nostretch: true, lit: 0 });
          for (const m of this.meteors) {
            const mz = -(m.prog - this.prog);
            if (mz < -1250 || mz > 90) continue;
            for (const l of m.lanes) {
              const mx = RING_LANES[l];
              if (mz > -430) R.flat(R.glowTex, mx, 0.9, mz, 30, { tint: [1, 0.35, 0.25], alpha: 0.35 + Math.sin(t * 10) * 0.15 }); // sombra de aviso en el carril
              R.sprite(rockCv('rock', m.seed), mx, 16, mz, { w: 74, h: 74, roll: m.rot, lit: 0.5 });
            }
          }
          const gz = -(RING_LEN - this.prog);
          if (gz > -1100) R.sprite(ringGoalCv('luz'), 0, 6, gz, { w: 240, h: 240, nostretch: true, lit: 0 });
          const rbob = Math.sin(t * 2.2) * 2;
          R.sprite(rocketBackCv('rival'), this.rlaneX, 10 + rbob, rz, { w: 132, h: 116, roll: Math.max(-0.3, Math.min(0.3, (RING_LANES[this.rlane] - this.rlaneX) * 0.004)), lit: 0.7 });
          const tilt = Math.max(-0.34, Math.min(0.34, (RING_LANES[this.lane] - this.laneX) * 0.005)) + (this.doubtT > 0 ? Math.sin(t * 42) * 0.07 : 0);
          const bob = Math.sin(t * 2.6) * 2 + (this.crashT > 0 ? Math.sin(t * 30) * 2 : 0);
          R.sprite(rocketBackCv('party'), this.laneX, 12 + bob, -6, { w: 148, h: 130, roll: tilt, lit: 0.75 });
          const fl = 0.75 + Math.sin(t * 31) * 0.18 + this.v / Math.max(40, this.cruise) * 0.35, fh = 52 * fl;
          R.sprite(flameCv(), this.laneX, 14 - fh, -6, { w: 34, h: fh, nostretch: true, lit: 0 });
          R.sprite(flameCv(), this.rlaneX, 12 - fh * 0.85, rz, { w: 30, h: fh * 0.85, nostretch: true, lit: 0 });
        },
        over: (c, t) => {
          if (this.st === 'over') { this.endOverlay(c); return; }
          const pp = Math.min(100, Math.floor((this.prog / RING_LEN) * 100)), rp = Math.min(100, Math.floor((this.rprog / RING_LEN) * 100));
          this.hud(c, t, `META ${pp}%`, `META ${rp}%`);
          c.fillStyle = 'rgba(28,24,38,.8)'; c.beginPath(); c.roundRect(190, 56, 260, 10, 5); c.fill();
          c.fillStyle = '#2fa8a0'; c.beginPath(); c.roundRect(192, 58, 256 * Math.min(1, this.prog / RING_LEN), 6, 3); c.fill();
          c.fillStyle = '#b48cf0'; c.beginPath(); c.arc(192 + 256 * Math.min(1, this.rprog / RING_LEN), 61, 4.5, 0, 6.3); c.fill();
          c.fillStyle = '#ffd23f'; c.beginPath(); c.arc(192 + 256 * Math.min(1, this.prog / RING_LEN), 61, 4.5, 0, 6.3); c.fill();
          if (this.st === 'play' && this.sug && this.sug.t > 0) {
            const pr = R.project(this.laneX, 118, -6);
            if (pr.ok) { if (this.sug.lane === this.lane) G.text(c, `${G.CHARS[this.copilotId].name}: ¡ese carril!`, pr.x, pr.y, { size: 10, color: '#7dff8a' }); else G.prompt(c, this.sug.lane < this.lane ? '←' : '→', pr.x + (this.sug.lane < this.lane ? -34 : 34), pr.y); }
          }
          if (this.st === 'play' && this.doubtT > 0) G.text(c, '¡EL COHETE DUDA!', 320, 300, { size: 13, color: '#ffd23f', lw: 5 });
        },
      });
    }
  }

  // ---------- 1B. CINTURÓN DE ASTEROIDES (Mass Meteor) ----------
  // VENTAJA CRUZADA: BELT_ADV = cuánto más cerca del aro empiezas si
  // ganaste 1A (salida adelantada, la forma simple elegida).
  const BELT_GOAL = 2500, BELT_ADV = 150, BELT_H = 196;
  class AsteroidBeltDuel extends Duel {
    constructor(who, done, o) {
      super(who, 'jose', done, { rounds: 1, need: 1, label: 'CARRERA', title: 'CINTURÓN DE ASTEROIDES', hint: 'Flechas o WASD: impulso de mochila · Chocar aturde 1,5 s · Cruza primero el aro a cuadros', rendT: 1.6 });
      this.isBelt = true; this.quietRend = true;
      this.adv = !!(o && o.adv);
      this.p = new Actor(who, 0, 0); this.jose = new Actor('jose', 0, 0); this.cat = new Actor('pollito', 0, 6);
      this.p.dir = 'right'; this.jose.dir = 'right'; this.cat.dir = 'down';
      this.cam = { x: 40, y: 66, z: 0, dist: 400, pitch: 0.3, fov: 42 };
      this.begin();
    }
    setup() {
      this.elapsed = 0; this.finished = false;
      this.P = { x: this.adv ? BELT_ADV : 0, y: 92, vx: 0, vy: 0, stun: 0, hits: 0, thrust: false };
      this.B = { x: 0, y: 128, vx: 0, vy: 0, stun: 0, hits: 0, thrust: false };
      this.C = { x: 260, y: 100 }; this.catCd = 0;
      this.rocks = [];
      const kinds = ['rock', 'rock', 'pastel', 'rock', 'globo', 'rock', 'regalo'];
      let x = 240, i = 0;
      while (x < BELT_GOAL - 140) { this.rocks.push({ x, y: rnd(18, BELT_H - 18), r: [15, 21, 28][i % 3], vx: 0, vy: 0, rot: rnd(0, 6.3), vr: rnd(-0.5, 0.5), kind: kinds[i % kinds.length], seed: i % 3, cdP: 0, cdB: 0 }); x += rnd(130, 215); i++; }
      this.syncActors();
    }
    syncActors() {
      const P = this.P, B = this.B, p = this.p, j = this.jose, cat = this.cat;
      p.x = P.x; p.elev = P.y; p.vx = P.vx; p.vy = P.vy; p.moving = Math.hypot(P.vx, P.vy) > 24; p.spin = P.stun > 0 ? P.stun : 0; p.dir = P.vx < -18 ? 'left' : 'right';
      j.x = B.x; j.elev = B.y; j.vx = B.vx; j.vy = B.vy; j.moving = Math.hypot(B.vx, B.vy) > 24; j.spin = B.stun > 0 ? B.stun : 0; j.dir = B.vx < -18 ? 'left' : 'right';
      cat.x = this.C.x; cat.elev = this.C.y;
    }
    collide(d, a, cdKey) {
      if (d.stun > 0) return;
      for (const r of this.rocks) {
        if (r[cdKey] > 0) continue;
        const dx = d.x - r.x, dy = d.y - r.y, rr = r.r + 15;
        if (dx * dx + dy * dy < rr * rr) {
          r[cdKey] = 1.2; d.stun = 1.5; d.hits++;
          const L = Math.max(12, Math.hypot(dx, dy)), ux = dx / L, uy = dy / L;
          d.vx = ux * 150; d.vy = uy * 150; r.vx = -ux * 55; r.vy = -uy * 55; // el choque APARTA el asteroide
          a.emo('!!', 0.9); a.flash = 0.6; W.puff(d.x, 0, 5, true); G.sfx('bad');
          if (a === this.p) this.say('¡Aturdido!', '#ff6b7a', 0.9);
          break;
        }
      }
    }
    finish(w) {
      if (this.finished) return; this.finished = true;
      this.endRound(w, w === 'p' ? '¡Cruzaste el aro a cuadros primero!' : w === 'b' ? 'José cruzó el aro primero y reclama el planeta…' : '¡Llegaron al aro a la vez!');
    }
    extra() { return { spaceRace: 'cinturon', hitsP: this.P.hits, hitsB: this.B.hits, adv: this.adv }; }
    update(dt) {
      const p = this.p, j = this.jose, cat = this.cat;
      p.update(dt); j.update(dt); cat.update(dt);
      if (!this.tick(dt)) { this.syncActors(); return; }
      this.elapsed += dt;
      const P = this.P, B = this.B;
      // Jugador: impulso de mochila con INERCIA (arrastre leve = freno suave).
      const ax = (G.input.held('right') ? 1 : 0) - (G.input.held('left') ? 1 : 0);
      const ay = (G.input.held('up') ? 1 : 0) - (G.input.held('down') ? 1 : 0);
      P.thrust = !!(ax || ay) && P.stun <= 0;
      if (P.stun > 0) P.stun -= dt; else { P.vx += ax * 165 * dt; P.vy += ay * 165 * dt; }
      // IA de José: empuje hacia el aro, esquivando lo que tenga delante.
      B.thrust = B.stun <= 0;
      if (B.stun > 0) B.stun -= dt;
      else {
        let ty = 104 + Math.sin(this.elapsed * 0.6) * 34;
        const danger = this.rocks.filter((r) => r.x > B.x && r.x < B.x + 190 && Math.abs(r.y - B.y) < r.r + 26).sort((a, b) => a.x - b.x)[0];
        if (danger) ty = danger.y + (B.y <= danger.y ? -1 : 1) * (danger.r + 44);
        B.vx += Math.max(-150 * dt, Math.min(150 * dt, (126 - B.vx) * dt * 3));
        const wantVy = Math.max(-92, Math.min(92, (ty - B.y) * 1.7));
        B.vy += Math.max(-175 * dt, Math.min(175 * dt, (wantVy - B.vy) * dt * 3.4));
      }
      for (const d of [P, B]) {
        const drag = Math.exp(-0.22 * dt);
        d.vx *= drag; d.vy *= drag;
        const sp = Math.hypot(d.vx, d.vy), MAX = 235;
        if (sp > MAX) { d.vx *= MAX / sp; d.vy *= MAX / sp; }
        d.x += d.vx * dt; d.y += d.vy * dt;
        if (d.x < -30) { d.x = -30; d.vx = Math.abs(d.vx) * 0.4; }
        if (d.y < 6) { d.y = 6; d.vy = Math.abs(d.vy) * 0.45; }
        if (d.y > BELT_H) { d.y = BELT_H; d.vy = -Math.abs(d.vy) * 0.45; }
      }
      // Pollito flota libre: caos que a veces empuja un asteroide.
      this.C.x += 46 * dt; this.C.y = 102 + Math.sin(this.elapsed * 0.8) * 52;
      if (this.C.x > Math.max(P.x, B.x) + 320) this.C.x = Math.min(P.x, B.x) - 160;
      if ((this.catCd -= dt) <= 0) {
        const r = this.rocks.find((rk) => Math.hypot(rk.x - this.C.x, rk.y - this.C.y) < rk.r + 26);
        if (r) { r.vx += rnd(30, 70) * (Math.random() < 0.5 ? -1 : 1); r.vy += rnd(-40, 40); this.catCd = 2.5; cat.hop(150); }
      }
      for (const r of this.rocks) {
        r.x += r.vx * dt; r.y += r.vy * dt;
        r.vx *= Math.exp(-0.8 * dt); r.vy *= Math.exp(-0.8 * dt);
        r.rot += r.vr * dt;
        if (r.cdP > 0) r.cdP -= dt; if (r.cdB > 0) r.cdB -= dt;
        if (r.y < r.r * 0.5) { r.y = r.r * 0.5; r.vy = Math.abs(r.vy); }
        if (r.y > BELT_H + 20) { r.y = BELT_H + 20; r.vy = -Math.abs(r.vy); }
      }
      this.collide(P, this.p, 'cdP');
      this.collide(B, this.jose, 'cdB');
      this.syncActors();
      this.cam.x += ((P.x + 70) - this.cam.x) * Math.min(1, dt * 3.2);
      if (P.x >= BELT_GOAL) return this.finish('p');
      if (B.x >= BELT_GOAL) return this.finish('b');
      if (this.elapsed > 110) return this.finish(P.x > B.x + 25 ? 'p' : B.x > P.x + 25 ? 'b' : 'tie');
    }
    stunStars(c, a) { const h = a.head(10); for (let i = 0; i < 3; i++) { const ang = this.T * 5 + i * 2.1; imgStar(c, h.x + Math.cos(ang) * 17, h.y - 8 + Math.sin(ang) * 5, 5, '#ffe58a'); } }
    endOverlay(c) {
      const w = this.result.win;
      c.fillStyle = 'rgba(16,12,26,.85)'; c.fillRect(0, 0, 640, 360);
      G.icon(c, w === 'win' ? 'trofeo' : w === 'tie' ? 'empate' : 'derrota', 320, 84, 48);
      G.text(c, w === 'win' ? '¡GANASTE!' : w === 'tie' ? 'EMPATE' : 'GANÓ JOSÉ', 320, 138, { size: 40, color: w === 'win' ? '#7dff8a' : w === 'tie' ? '#ffd23f' : '#ff6b7a', lw: 9 });
      G.text(c, `Aturdimientos — Tú: ${this.P.hits} · José: ${this.B.hits}`, 320, 182, { size: 17, lw: 6 });
      G.text(c, w === 'win' ? 'El aro es tuyo: la fiesta sobre el anillo te espera' : 'José llegó primero… pero la fiesta igual se hace en el anillo', 320, 208, { size: 11, color: '#b7a8e8' });
    }
    draw(dt) {
      const P = this.P, B = this.B;
      W.render({
        cam: this.cam, dt, mesh: null, actors: [this.p, this.cat, this.jose], noApartment: true,
        light: { amb: [0.42, 0.44, 0.62], sun: [0.3, 0.3, 0.42], sky: '#081026', points: [{ x: this.cam.x, y: 130, z: -200, r: 800, c: [0.3, 0.3, 0.25] }] },
        boxes: (mb) => { // la superficie del anillo mayor, muy por debajo del cinturón
          const x0 = Math.floor((this.cam.x - 800) / 200) * 200;
          for (let i = 0; i < 9; i++) mb.flat(x0 + i * 200, -300, 202, 600, -46, i % 2 ? '#8a5f2e' : '#96682f');
          mb.flat(this.cam.x - 800, -302, 1600, 5, -44, '#2fa8a0', true);
        },
        sprites: (t) => {
          drawSpaceSky(t, this.cam.x);
          R.sprite(planetCv(), this.cam.x + 460, -120, -1250, { w: 700, h: 700, nostretch: true, lit: 0 });
          for (const r of this.rocks) { if (Math.abs(r.x - this.cam.x) > 620) continue; R.sprite(rockCv(r.kind, r.seed), r.x, r.y - r.r * 1.05, 0, { w: r.r * 2.15, h: r.r * 2.15, roll: r.rot, lit: 0.55 }); }
          R.sprite(ringGoalCv('cuadros'), BELT_GOAL + 26, 22, 0, { w: 190, h: 190, nostretch: true, lit: 0 });
          R.flat(R.glowTex, BELT_GOAL + 26, 104, -6, 105, { tint: [1, 0.95, 0.6], alpha: 0.16 + Math.sin(t * 3) * 0.05 });
        },
        over: (c, t) => {
          if (this.st === 'over') { this.endOverlay(c); return; }
          const pp = Math.max(0, Math.min(100, Math.floor((P.x / BELT_GOAL) * 100))), bp = Math.max(0, Math.min(100, Math.floor((B.x / BELT_GOAL) * 100)));
          this.hud(c, t, `ARO ${pp}%`, `ARO ${bp}%`);
          c.fillStyle = 'rgba(28,24,38,.8)'; c.beginPath(); c.roundRect(190, 56, 260, 10, 5); c.fill();
          c.fillStyle = '#2fa8a0'; c.beginPath(); c.roundRect(192, 58, 256 * Math.min(1, Math.max(0, P.x) / BELT_GOAL), 6, 3); c.fill();
          c.fillStyle = '#ff6b7a'; c.beginPath(); c.arc(192 + 256 * Math.min(1, Math.max(0, B.x) / BELT_GOAL), 61, 4.5, 0, 6.3); c.fill();
          c.fillStyle = '#ffd23f'; c.beginPath(); c.arc(192 + 256 * Math.min(1, Math.max(0, P.x) / BELT_GOAL), 61, 4.5, 0, 6.3); c.fill();
          drawHelmet(c, this.p, P.thrust); drawHelmet(c, this.jose, B.thrust); drawHelmet(c, this.cat, false);
          if (P.stun > 0) this.stunStars(c, this.p);
          if (B.stun > 0) this.stunStars(c, this.jose);
          if (this.st === 'play' && this.adv && this.elapsed < 4.5) G.text(c, 'Ventaja de los Anillos: sales más cerca del aro', 320, 322, { size: 10, color: '#7dff8a' });
        },
      });
    }
  }

  // ---------- Cinemática de despegue (azotea 3D, skippable) ----------
  class SpaceLaunchScene {
    constructor(who, done) {
      this.who = who; this.done = done; this.t = 0; this.sent = false;
      this.p = new Actor(who, -210, 14); this.p.dir = 'right'; this.p.carryWalk = true;
      this.xi = new Actor('ximena', -204, 15); this.xi.carriedPose = true; this.xi.dir = 'right'; this.xi.expr = 'sleep';
      this.cat = new Actor('pollito', 176, 6); this.cat.dir = 'down';
      this.cam = { x: 0, y: 0, z: 0, dist: 430, pitch: 0.42, fov: 38 };
      this.phase = 'walk'; this.phT = 0; this.rkY = 0; this.rkV = 0;
    }
    finish() { if (!this.sent) { this.sent = true; this.done(); } }
    update(dt) {
      this.t += dt;
      const p = this.p, xi = this.xi, cat = this.cat;
      if (this.phase === 'walk') {
        p.vx = 74; p.moving = true;
        p.x += 74 * dt;
        xi.x = p.x + 4; xi.y = p.y + 1; xi.elev = p.carrySupportY(); xi.dir = p.dir;
        if (p.x >= 16) { this.phase = 'board'; this.phT = 0; G.sfx('door'); }
      } else if (this.phase === 'board') { // Ximena entra dormida; Pollito se cuela de polizón
        p.vx = 0; p.moving = false; this.phT += dt;
        if (cat.x > 62) cat.x = Math.max(62, cat.x - 120 * dt); // Pollito se acerca a la puerta del cohete
        if (this.phT > 0.5) xi.hidden = true;
        if (this.phT > 0.8) cat.hidden = true;
        if (this.phT > 1.1) { p.hidden = true; this.phase = 'ignite'; this.phT = 0; G.sfx('ok'); }
      } else if (this.phase === 'ignite') {
        this.phT += dt;
        if (Math.random() < 0.35) W.puff(110 + rnd(-8, 8), -34, 1);
        if (this.phT > 1.3) { this.phase = 'lift'; G.sfx('party'); }
      } else if (this.phase === 'lift') {
        this.rkV += 260 * dt; this.rkY += this.rkV * dt;
        if (Math.random() < 0.6) W.puff(110 + rnd(-14, 14), -34, 2);
        if (this.rkY > 330) this.finish();
      }
      p.update(dt); xi.update(dt); cat.update(dt); W.updateFx(dt);
      if (this.t > 0.5 && G.input.hit('action')) return this.finish();
      if (this.t > 14) this.finish();
    }
    draw(dt) {
      if (!balloonMesh && R.gl) balloonMesh = buildBalloonArena(); // la azotea que ya existe (la del duelo de globos)
      const shake = this.phase === 'ignite' ? Math.sin(this.t * 46) * 1.6 : 0;
      W.render({
        cam: this.cam, dt, mesh: balloonMesh, actors: [this.p, this.xi, this.cat], noApartment: true,
        light: { amb: [0.5, 0.48, 0.62], sun: [0.3, 0.3, 0.38], sky: '#0d0b1e', points: [{ x: 0, y: 80, z: -20, r: 380, c: [0.35, 0.3, 0.2] }] },
        sprites: (t) => {
          for (let i = 0; i < 46; i++) { const x = -560 + spaceHash(i * 3.1) * 1120, y = 120 + spaceHash(i * 7.7) * 300; R.flat(R.glowTex, x, y, -420, 2 + spaceHash(i) * 3, { tint: [0.9, 0.93, 1], alpha: 0.5 + 0.4 * Math.sin(t * 2 + i) }); }
          R.flat(R.glowTex, -330, 330, -430, 42, { tint: [0.92, 0.96, 1], alpha: 0.9 }); // la luna
          const fl = this.phase === 'lift' ? 1.15 + Math.sin(t * 29) * 0.2 : this.phase === 'ignite' ? 0.45 + Math.sin(t * 29) * 0.15 + this.phT * 0.3 : 0;
          if (fl > 0) R.sprite(flameCv(), 110 + shake, this.rkY - 62 * fl + 14, -34, { w: 40, h: 62 * fl, nostretch: true, lit: 0 });
          R.sprite(rocketSideCv('party', false), 110 + shake, this.rkY, -34, { w: 150, h: 190, lit: 0.7 });
        },
        over: (c, t) => {
          if (!this.xi.hidden) { // el antifaz de Ximena dormida, sobre su pose cargada
            const hp = R.project(this.xi.x - 4, this.xi.elev + 27, this.xi.y);
            if (hp.ok) { c.save(); c.translate(hp.x, hp.y); c.fillStyle = '#2b2540'; c.beginPath(); c.roundRect(-17, -5, 34, 10, 5); c.fill(); c.fillStyle = '#463c66'; c.fillRect(14, -1.5, 9, 3); c.restore(); }
          }
          G.text(c, 'LA AZOTEA — 00:00', 320, 24, { size: 11, color: '#b7a8e8' });
          if (this.phase === 'walk') G.text(c, 'Cargando a Ximena dormida hasta el cohete…', 320, 330, { size: 11 });
          if (this.phase === 'lift') G.text(c, '¡DESPEGUE!', 320, 60 + Math.sin(t * 6) * 2, { size: 20, color: '#ffd23f', lw: 6 });
          G.text(c, 'ESPACIO para saltar', 320, 348, { size: 8, color: '#8f86b8', stroke: false });
        },
      });
    }
  }

  // ---------- Transición: cohetes averiados, todos salen flotando ----------
  class SpaceTransitionScene {
    constructor(who, done) {
      this.who = who; this.done = done; this.t = 0; this.sent = false; this.said = false;
      this.p = new Actor(who, -60, 0); this.p.dir = 'right';
      this.jose = new Actor('jose', 60, -10); this.jose.dir = 'left';
      this.cat = new Actor('pollito', 0, 8); this.cat.dir = 'down';
      this.cam = { x: 0, y: 60, z: 0, dist: 430, pitch: 0.3, fov: 40 };
    }
    finish() { if (!this.sent) { this.sent = true; this.done(); } }
    update(dt) {
      this.t += dt;
      for (const a of [this.p, this.jose, this.cat]) a.update(dt);
      W.updateFx(dt);
      this.p.elev = 96 + Math.sin(this.t * 1.3) * 7; this.p.x = -60 - this.t * 6;
      this.jose.elev = 108 + Math.sin(this.t * 1.1 + 2) * 7; this.jose.x = 60 + this.t * 6;
      this.cat.elev = 70 + Math.sin(this.t * 1.7 + 1) * 9; this.cat.x = Math.sin(this.t * 0.9) * 14;
      if (Math.random() < 0.12) W.puff(-170, -60, 1);
      if (Math.random() < 0.12) W.puff(175, -60, 1);
      if (!this.said && this.t > 0.8) { this.said = true; this.jose.say('¡Mi cohete! ¡Y el tuyo también!', 2.6); }
      if (this.t > 0.5 && G.input.hit('action')) return this.finish();
      if (this.t > 5.2) this.finish();
    }
    draw(dt) {
      W.render({
        cam: this.cam, dt, mesh: null, actors: [this.p, this.cat, this.jose], noApartment: true,
        light: { amb: [0.42, 0.44, 0.62], sun: [0.3, 0.3, 0.42], sky: '#081026', points: [{ x: 0, y: 130, z: -200, r: 800, c: [0.3, 0.3, 0.25] }] },
        sprites: (t) => {
          drawSpaceSky(t, 0);
          R.sprite(rocketSideCv('party', true), -175, 56 + Math.sin(t * 0.9) * 5, -70, { w: 130, h: 165, roll: 0.5, lit: 0.6 });
          R.sprite(rocketSideCv('rival', true), 180, 80 + Math.sin(t * 0.8 + 1) * 5, -70, { w: 130, h: 165, roll: -0.42, lit: 0.6 });
        },
        over: (c, t) => {
          drawHelmet(c, this.p, false); drawHelmet(c, this.jose, false); drawHelmet(c, this.cat, false);
          G.text(c, 'Los dos cohetes quedaron averiados… el último tramo se hace flotando', 320, 330, { size: 11 });
          G.text(c, 'ESPACIO para saltar', 320, 348, { size: 8, color: '#8f86b8', stroke: false });
        },
      });
    }
  }

  // ---------- Cierre: fiesta en gravedad baja + foto (misma escena 3D) ----------
  let spacePartyMesh = null;
  function buildSpacePartyMesh() {
    const m = new R.MB();
    m.flat(-760, -340, 1520, 680, -16, '#a8743a'); // superficie del anillo mayor
    m.box(-300, -14, -60, 600, 14, 240, '#8a5a34', { top: '#b98a55' }); // la losa-plataforma (su techo es y=0)
    m.box(-120, 0, -30, 110, 26, 60, '#6b4a2f', { top: '#e8e2f2' }); // mesa de la fiesta
    for (let i = 0; i < 6; i++) { const x = -280 + i * 108; m.box(x, 0, -64, 6, 66, 6, '#5a3f28'); if (i < 5) m.wallQuad(x + 8, 50, -63, 92, 13, ['#e23b4e', '#ffd23f', '#3fa0f0', '#58c46a', '#f08cc0'][i % 5]); } // guirnalda entre postes
    return m.upload();
  }
  class SpacePartyScene {
    constructor(who, results, done) {
      this.who = who; this.results = results || {}; this.done = done;
      this.t = 0; this.sent = false; this.phase = 'fiesta'; this.phT = 0; this.woke = false; this.flash = 0;
      const belt = this.results.belt || {};
      // Pastel magullado si PERDISTE 1B o el cinturón te golpeó 3+
      // veces. Un EMPATE no es perder: antes el empate también lo
      // magullaba (revisión 2026-11-21).
      this.bruised = belt.win === 'lose' || (belt.hitsP || 0) >= 3;
      this.crew = G.PLAYABLE.map((id, i) => { const a = new Actor(id, -252 + i * 62, 40); a.dir = 'down'; a.phase = i * 0.9; return a; }); // en este final SÍ están los 7
      this.jose = new Actor('jose', 268, 40); this.jose.dir = 'down'; this.jose.phase = 2.2;
      this.cat = new Actor('pollito', -282, 58); this.cat.dir = 'down'; this.cat.phase = 1.3;
      this.xi = new Actor('ximena', 30, 66); this.xi.dir = 'down'; this.xi.expr = 'sleep'; this.xi.phase = 4;
      this.all = [...this.crew, this.jose, this.cat];
      this.cam = { x: 0, y: 26, z: 30, dist: 560, pitch: 0.42, fov: 40 };
    }
    finish() { if (!this.sent) { this.sent = true; this.done(); } }
    update(dt) {
      this.t += dt; this.phT += dt;
      for (const a of [...this.all, this.xi]) a.update(dt);
      W.updateFx(dt);
      if (this.phase === 'fiesta') {
        for (const a of this.all) a.elev = Math.abs(Math.sin(this.t * 1.15 + a.phase)) * 24; // rebote lento de gravedad baja
        this.xi.elev = Math.abs(Math.sin(this.t * 1.15 + this.xi.phase)) * 18;
        if (!this.woke && this.t > 2.6) { this.woke = true; this.xi.expr = 'surprised'; this.xi.say('¿Esto… sigue siendo mi casa?', 3.4); G.sfx('ok'); }
        if (this.woke && this.t > 5.4) this.xi.expr = 'happy';
        if ((this.t > 6 && G.input.hit('action')) || this.t > 11) {
          // LA FOTO: la misma escena 3D con cámara de grupo (no una imagen)
          this.phase = 'foto'; this.phT = 0; this.flash = 1; G.sfx('party');
          this.all.forEach((a, i) => { a.x = -252 + i * 56; a.y = 46; a.elev = 0; a.dir = 'down'; a.expr = 'happy'; });
          this.xi.x = 0; this.xi.y = 78; this.xi.elev = 0; this.xi.expr = 'happy';
        }
      } else if (this.phase === 'foto') {
        if (this.flash > 0) this.flash -= dt * 1.4;
        if ((this.phT > 1.2 && G.input.hit('action')) || this.phT > 4.5) { this.phase = 'panel'; this.phT = 0; }
      } else if (this.phase === 'panel') {
        if ((this.phT > 1 && G.input.hit('action')) || this.phT > 7) this.finish();
      }
    }
    draw(dt) {
      if (!spacePartyMesh && R.gl) spacePartyMesh = buildSpacePartyMesh();
      const fiesta = this.phase === 'fiesta';
      const cakeY = fiesta ? 34 + Math.sin(this.t * 1.15) * 9 : 40, cakeX = fiesta ? -65 : 0, cakeZ = fiesta ? 0 : 44;
      W.render({
        cam: this.cam, dt, mesh: spacePartyMesh, actors: [...this.all, this.xi], noApartment: true,
        light: { amb: [0.46, 0.46, 0.64], sun: [0.32, 0.3, 0.4], sky: '#0a1030', points: [{ x: 0, y: 120, z: -200, r: 800, c: [0.35, 0.3, 0.2] }] },
        sprites: (t) => {
          drawSpaceSky(t, 0);
          R.sprite(planetCv(), 60, -150, -950, { w: 700, h: 700, nostretch: true, lit: 0 });
          // el pastel flotante (magullado si el cinturón salió mal)
          R.sprite(Sp.item('pastel'), cakeX, cakeY, cakeZ, { feet: 4, sx: 1.5, sy: this.bruised ? 0.95 : 1.5, roll: this.bruised ? 0.24 : Math.sin(t * 1.3) * 0.05, lit: 0.7 });
          R.flat(R.glowTex, cakeX, cakeY + 16, cakeZ, 20, { tint: [1, 0.9, 0.5], alpha: 0.25 + Math.sin(t * 4) * 0.08 });
        },
        over: (c, t) => {
          for (const a of [...this.all, this.xi]) drawHelmet(c, a, false);
          if (this.flash > 0) { c.fillStyle = `rgba(255,255,255,${Math.max(0, this.flash) * 0.85})`; c.fillRect(0, 0, 640, 360); }
          if (this.phase === 'foto') G.text(c, '¡FOTO DE GRUPO SOBRE EL ANILLO!', 320, 322, { size: 13, color: '#ffd23f', lw: 5 });
          if (this.phase === 'panel') {
            const belt = this.results.belt || {};
            c.fillStyle = 'rgba(16,12,26,.88)'; c.fillRect(0, 0, 640, 360);
            G.icon(c, 'trofeo', 320, 66, 44);
            G.text(c, 'FIESTA EN J1407B', 320, 112, { size: 30, color: '#ffd23f', lw: 8 });
            G.text(c, 'SPACE_RINGS_ENDING', 320, 136, { size: 10, color: '#b7a8e8' });
            G.text(c, belt.win === 'win' ? 'Cruzaste el aro primero: la fiesta sobre el anillo es tuya.' : belt.win === 'tie' ? 'Llegaron al aro a la vez: el planeta es compartido (José no está de acuerdo).' : 'José cruzó el aro primero y juró que él "descubrió" el planeta…', 320, 168, { size: 11.5 });
            G.text(c, belt.win === 'win' ? 'Ximena despertó flotando sobre un anillo, con los otros 36 detrás.' : 'Pero la fiesta igual se hizo, con los 7 roomies sobre el anillo.', 320, 190, { size: 11.5 });
            G.text(c, this.bruised ? 'El pastel llegó magullado de tanto choque en el cinturón.' : 'Y el pastel llegó flotando, intacto.', 320, 212, { size: 11.5, color: '#ffd9a0' });
            G.text(c, 'J1407b: el «Súper Saturno», a 434 años luz, con 37 anillos.', 320, 240, { size: 10, color: '#8f86b8' });
            G.text(c, 'ESPACIO para terminar', 320, 330, { size: 9, color: '#8f86b8', stroke: false });
          }
        },
      });
    }
  }

  // ---------- La cadena completa del final ----------
  class SpaceEndingScene {
    constructor(who, done) {
      this.who = who; this.done = done; this.finished = false; this.results = {};
      this.cur = new SpaceLaunchScene(who, () => this.startRace());
    }
    startRace() { this.cur = new RingRaceDuel(this.who, (r) => { this.results.ring = r; this.cur = new SpaceTransitionScene(this.who, () => this.startBelt()); }, { copilot: spaceCopilotOf(this.who) }); }
    startBelt() {
      const adv = !!(this.results.ring && this.results.ring.win === 'win'); // ventaja cruzada 1A → 1B
      this.cur = new AsteroidBeltDuel(this.who, (r) => { this.results.belt = r; this.cur = new SpacePartyScene(this.who, this.results, () => this.finish()); }, { adv });
    }
    finish() {
      if (this.finished) return; this.finished = true;
      const ring = this.results.ring || {}, belt = this.results.belt || {};
      this.done({ win: belt.win || 'lose', spaceEnding: true, winRing: ring.win || null, winBelt: belt.win || null, cakeBruised: belt.win === 'lose' || (belt.hitsP || 0) >= 3 });
    }
    update(dt) { if (this.cur) this.cur.update(dt); }
    draw(dt) { if (this.cur) this.cur.draw(dt); }
  }


  // =========================================================
  // 15. FINAL LEYENDAS — «La nueva película de Las Leyendas»
  // (LEYENDAS_MOVIE_ENDING · pedido de Jose, 2026-11-21)
  // =========================================================
  // Segundo final alternativo, con el mismo patrón que J1407b
  // (sección 14 de la rama feat/final-j1407b): escenas PROGRAMADAS
  // EN 3D (la sala-set con la casa existente, el patio de hexágonos
  // y el patio nocturno de la soga se construyen con cajas/planos
  // por código; NADA de imágenes de fondo).
  //
  // Alebrije y Teodora NO tienen hoja definida en el repo: se
  // dibujan POR CÓDIGO (canvas) siguiendo el mapa de sprites
  // aprobado (files/diseno-leyendas/mapa-sprites-teodora-alebrije-v1.md):
  //  · Alebrije = adaptación de Jose: cabeza amarilla, hocico
  //    naranja, ojos NEGROS enormes, lengua roja rizada fuera,
  //    antenas verdes, crines rojo/naranja, cuerpo morado con panza
  //    magenta, mancha roja con puntos en SU flanco izquierdo
  //    visible en frontal, aleta dorsal amarilla, extremidades
  //    verdes, cola anillada. NUNCA ojos verdes.
  //  · Teodora: pelo naranja cobrizo, sombrero rosa con banda a
  //    cuadros y moño lila en SU lado izquierdo (derecha del
  //    observador; nunca espejar), piel pálida con pecas, vestido
  //    en capas morado/rosa, medias a rayas moradas, botas magenta;
  //    siempre FLOTA (sin contacto con el suelo).
  // HOOK: cuando se produzcan las hojas definidas de ambos, basta
  // sustituir albCv/teoCv por frames de la hoja (o moverlos a
  // G.CHARS y borrar G.SPECIALS de data.js); los duelos solo usan
  // los canvas de este bloque y G.specialFace/G.specialURL.
  const clamp15 = (v, a, b) => Math.max(a, Math.min(b, v));
  function codeCv(w, h, fn) { const cv = document.createElement('canvas'); cv.width = w; cv.height = h; fn(cv.getContext('2d')); return cv; }
  function ell(x, cx, cy, rx, ry, fill, stroke) { x.beginPath(); x.ellipse(cx, cy, rx, ry, 0, 0, 6.3); if (fill) { x.fillStyle = fill; x.fill(); } if (stroke) { x.strokeStyle = stroke; x.lineWidth = 4; x.stroke(); } }
  function circ(x, cx, cy, r, fill, stroke) { ell(x, cx, cy, r, r, fill, stroke); }

  // ----- El Alebrije (figura completa en un lienzo de 200×220) -----
  const ALB_ZONES = [
    { id: 'cabeza', label: 'Cabeza', fx: 0.50, fy: 0.26 }, { id: 'crines', label: 'Crines', fx: 0.27, fy: 0.20 },
    { id: 'antenas', label: 'Antenas', fx: 0.65, fy: 0.05 }, { id: 'aleta', label: 'Aleta', fx: 0.84, fy: 0.42 },
    { id: 'panza', label: 'Panza', fx: 0.52, fy: 0.69 }, { id: 'cola', label: 'Cola', fx: 0.16, fy: 0.58 },
  ];
  function drawAlbFigure(x, o) {
    o = o || {};
    const W2 = '#ffffff';
    // cola anillada (su lado derecho, detrás del cuerpo)
    [[40, 158, 17], [30, 134, 15], [40, 112, 13]].forEach(([cx, cy, r], i) => circ(x, cx, cy, r, i % 2 ? '#e84393' : '#8b5cf6', W2));
    // aleta dorsal amarilla (detrás, su lado izquierdo)
    x.beginPath(); x.moveTo(146, 74); x.quadraticCurveTo(182, 92, 156, 118); x.quadraticCurveTo(146, 100, 146, 74); x.fillStyle = '#ffd23f'; x.fill(); x.strokeStyle = W2; x.lineWidth = 4; x.stroke();
    // extremidades verdes
    x.strokeStyle = '#58c46a'; x.lineWidth = 9; x.lineCap = 'round';
    x.beginPath(); x.moveTo(66, 138); x.lineTo(50, 162); x.stroke(); // brazo (su derecho)
    if (o.pose === 'director') { x.beginPath(); x.moveTo(140, 132); x.lineTo(168, 84); x.stroke(); }
    else if (o.pose === 'duelo') { x.beginPath(); x.moveTo(140, 132); x.lineTo(164, 150); x.stroke(); }
    else { x.beginPath(); x.moveTo(140, 132); x.lineTo(156, 158); x.stroke(); }
    x.beginPath(); x.moveTo(88, 182); x.lineTo(84, 202); x.moveTo(122, 182); x.lineTo(128, 202); x.stroke();
    // cuerpo morado con panza magenta
    ell(x, 104, 138, 47, 53, '#7c4dbd', W2);
    ell(x, 104, 152, 28, 37, '#e84393', null);
    // mancha roja con puntos en SU flanco izquierdo (visible en frontal)
    ell(x, 141, 126, 12, 21, '#e23b4e', null);
    x.fillStyle = '#ffd7de'; [[138, 116], [145, 128], [139, 139]].forEach(([px, py]) => circ(x, px, py, 2.4, '#ffd7de'));
    // crines rojo/naranja detrás de la cabeza
    for (let i = 0; i < 6; i++) { const a = Math.PI * (0.95 + i * 0.34), cx = 100 + Math.cos(a) * 36, cy = 58 + Math.sin(a) * 34; x.beginPath(); x.moveTo(cx, cy); x.lineTo(cx + Math.cos(a) * 20, cy + Math.sin(a) * 20); x.lineTo(cx + Math.cos(a + 0.5) * 8, cy + Math.sin(a + 0.5) * 8); x.closePath(); x.fillStyle = i % 2 ? '#ff8a3c' : '#e23b4e'; x.fill(); }
    // antenas verdes con punta redonda
    x.strokeStyle = '#58c46a'; x.lineWidth = 5; x.beginPath(); x.moveTo(86, 30); x.quadraticCurveTo(76, 12, 70, 8); x.moveTo(116, 30); x.quadraticCurveTo(128, 12, 134, 10); x.stroke();
    circ(x, 69, 7, 6, '#58c46a', W2); circ(x, 135, 9, 6, '#58c46a', W2);
    // cabeza amarilla redonda
    circ(x, 100, 58, 35, '#f7c948', W2);
    // hocico naranja y lengua roja rizada fuera
    ell(x, 100, 76, 17, 12, '#ff8a3c', W2);
    x.fillStyle = '#7a4416'; circ(x, 94, 72, 2, '#7a4416'); circ(x, 106, 72, 2, '#7a4416');
    x.strokeStyle = '#e23b4e'; x.lineWidth = 6; x.beginPath(); x.moveTo(100, 86); x.quadraticCurveTo(94, 98, 104, 102); x.quadraticCurveTo(112, 105, 106, 110); x.stroke();
    x.strokeStyle = '#ff8fa3'; x.lineWidth = 2; x.beginPath(); x.moveTo(100, 88); x.quadraticCurveTo(96, 97, 103, 100); x.stroke();
    // ojos NEGROS enormes (identidad de la adaptación de Jose)
    if (o.pose === 'triste') { ell(x, 85, 54, 9, 5, '#14101c'); ell(x, 115, 54, 9, 5, '#14101c'); }
    else { ell(x, 85, 52, 9, 13, '#14101c'); ell(x, 115, 52, 9, 13, '#14101c'); circ(x, 88, 46, 2.8, '#fff'); circ(x, 118, 46, 2.8, '#fff'); }
    if (o.pose === 'director') { // claqueta en la mano levantada
      x.save(); x.translate(172, 62); x.rotate(-0.3); x.fillStyle = '#23232e'; x.fillRect(-16, -12, 32, 24); x.fillStyle = '#e9eefb'; for (let i = 0; i < 4; i++) x.fillRect(-16 + i * 8, -12, 4, 6); x.restore();
    }
    if (o.glow != null && o.glow >= 0) { // resplandor TEMPORAL del casting: la paleta base nunca cambia
      const z = ALB_ZONES[o.glow], gx = z.fx * 200, gy = z.fy * 220, t = o.t || 0;
      const gr = x.createRadialGradient(gx, gy, 2, gx, gy, 34 + Math.sin(t * 9) * 5);
      gr.addColorStop(0, o.glowColor || 'rgba(255,235,150,0.95)'); gr.addColorStop(1, 'rgba(255,235,150,0)');
      x.fillStyle = gr; x.beginPath(); x.arc(gx, gy, 42, 0, 6.3); x.fill();
      x.strokeStyle = o.glowColor || '#ffe96a'; x.lineWidth = 3; x.beginPath(); x.arc(gx, gy, 24 + Math.sin(t * 9) * 3, 0, 6.3); x.stroke();
    }
  }
  const albCvCache = {};
  function albCv(pose, glow, glowColor) {
    const key = (pose || 'idle') + '|' + (glow == null ? -1 : glow) + '|' + (glowColor || '');
    if (!albCvCache[key]) albCvCache[key] = codeCv(200, 220, (x) => drawAlbFigure(x, { pose, glow, glowColor, t: 1 }));
    return albCvCache[key];
  }
  function albFaceCv() {
    if (!albCvCache.face) albCvCache.face = codeCv(96, 96, (x) => { x.scale(2.4, 2.4); x.translate(-52, -14); drawAlbFigure(x, {}); });
    return albCvCache.face;
  }

  // ----- Teodora (figura completa en un lienzo de 170×210; flota) -----
  function drawTeoFigure(x, o) {
    o = o || {};
    const W2 = '#ffffff', tilt = o.pose === 'derrotada' ? 0.16 : 0;
    x.save(); x.translate(85, 105); x.rotate(tilt); x.translate(-85, -105);
    // pelo naranja cobrizo detrás
    ell(x, 85, 88, 53, 64, '#d96c33', W2);
    // moño grande del vestido (atrás, asoma a los lados)
    x.fillStyle = '#f08cc0'; x.beginPath(); x.moveTo(52, 118); x.lineTo(28, 104); x.lineTo(30, 132); x.closePath(); x.fill(); x.beginPath(); x.moveTo(118, 118); x.lineTo(142, 104); x.lineTo(140, 132); x.closePath(); x.fill();
    // medias a rayas moradas y botas magenta (cuelgan: ella flota)
    [70, 94].forEach((lx) => { for (let i = 0; i < 4; i++) { x.fillStyle = i % 2 ? '#8e44ad' : '#e9d8ff'; x.fillRect(lx, 168 + i * 6, 10, 6); } x.fillStyle = '#d6336c'; x.fillRect(lx - 2, 192, 14, 12); x.fillRect(lx - 2, 200, 18, 5); });
    // vestido en capas morado/rosa
    x.beginPath(); x.moveTo(58, 116); x.lineTo(112, 116); x.lineTo(124, 148); x.lineTo(46, 148); x.closePath(); x.fillStyle = '#f08cc0'; x.fill(); x.strokeStyle = W2; x.lineWidth = 3; x.stroke();
    x.beginPath(); x.moveTo(50, 140); x.lineTo(120, 140); x.lineTo(130, 170); x.lineTo(40, 170); x.closePath(); x.fillStyle = '#8e44ad'; x.fill(); x.stroke();
    x.fillStyle = '#5e2f73'; x.fillRect(60, 92, 50, 28); x.strokeStyle = W2; x.lineWidth = 3; x.beginPath(); x.rect(60, 92, 50, 28); x.stroke();
    // brazos de piel pálida según pose
    x.strokeStyle = '#ffe9dc'; x.lineWidth = 8; x.lineCap = 'round';
    if (o.pose === 'selfie') { x.beginPath(); x.moveTo(108, 98); x.lineTo(138, 62); x.stroke(); x.beginPath(); x.moveTo(62, 98); x.lineTo(48, 124); x.stroke(); x.fillStyle = '#ff5e8a'; x.fillRect(132, 34, 14, 26); x.fillStyle = '#ffe3ee'; x.fillRect(134, 37, 10, 18); }
    else if (o.pose === 'trazo') { x.beginPath(); x.moveTo(108, 98); x.lineTo(134, 116); x.stroke(); x.beginPath(); x.moveTo(62, 98); x.lineTo(48, 124); x.stroke(); x.strokeStyle = '#ffd23f'; x.lineWidth = 4; x.beginPath(); x.moveTo(134, 116); x.lineTo(148, 104); x.stroke(); circ(x, 149, 103, 4, '#ffe96a'); }
    else if (o.pose === 'altiva') { x.beginPath(); x.moveTo(108, 98); x.lineTo(122, 118); x.stroke(); x.beginPath(); x.moveTo(62, 98); x.lineTo(46, 116); x.stroke(); }
    else { x.beginPath(); x.moveTo(62, 98); x.lineTo(48, 126); x.moveTo(108, 98); x.lineTo(122, 126); x.stroke(); }
    // cara pálida con pecas
    circ(x, 85, 58, 27, '#ffe9dc', W2);
    x.fillStyle = '#e8a37c'; [[70, 66], [76, 69], [97, 67], [101, 63]].forEach(([px, py]) => circ(x, px, py, 1.3, '#e8a37c'));
    // pelo frontal (flequillo cobrizo)
    x.beginPath(); x.ellipse(85, 44, 27, 13, 0, Math.PI, 6.3); x.fillStyle = '#d96c33'; x.fill();
    // ojos grandes con pestañas (pose de derrotada: mareada)
    if (o.pose === 'derrotada') { x.strokeStyle = '#2b2130'; x.lineWidth = 2.4; [[74, 58], [96, 58]].forEach(([ex, ey]) => { x.beginPath(); x.moveTo(ex - 5, ey - 5); x.lineTo(ex + 5, ey + 5); x.moveTo(ex + 5, ey - 5); x.lineTo(ex - 5, ey + 5); x.stroke(); }); }
    else { ell(x, 74, 59, 4.6, 6.4, '#2b2130'); ell(x, 96, 59, 4.6, 6.4, '#2b2130'); circ(x, 75.5, 56.5, 1.5, '#fff'); circ(x, 97.5, 56.5, 1.5, '#fff'); x.strokeStyle = '#2b2130'; x.lineWidth = 1.8; x.beginPath(); x.moveTo(68, 51); x.lineTo(64, 48); x.moveTo(102, 51); x.lineTo(106, 48); x.stroke(); }
    // boca según pose
    x.strokeStyle = '#b04a5e'; x.lineWidth = 2.2; x.beginPath();
    if (o.pose === 'feliz' || o.pose === 'selfie') { x.arc(85, 68, 6, 0.15 * Math.PI, 0.85 * Math.PI); }
    else if (o.pose === 'derrotada') { x.arc(85, 76, 5, 1.15 * Math.PI, 1.85 * Math.PI); }
    else { x.moveTo(80, 71); x.lineTo(90, 71); }
    x.stroke();
    // sombrero rosa: ala ancha, copa, banda a cuadros y moño lila en
    // SU lado izquierdo (derecha del observador; NUNCA espejar)
    ell(x, 85, 34, 46, 10, '#f78fb3', W2);
    x.beginPath(); x.ellipse(85, 26, 24, 15, 0, Math.PI, 6.3); x.fillStyle = '#f78fb3'; x.fill(); x.strokeStyle = W2; x.lineWidth = 3; x.stroke();
    for (let i = 0; i < 8; i++) { x.fillStyle = i % 2 ? '#8e44ad' : '#ffffff'; x.fillRect(63 + i * 5.6, 29, 5.6, 6); }
    ell(x, 124, 24, 9, 6, '#b48cf0', W2); ell(x, 136, 27, 9, 6, '#b48cf0', W2); circ(x, 129, 26, 4, '#9b6fe0', W2);
    x.restore();
  }
  const teoCvCache = {};
  function teoCv(pose) { const k = pose || 'idle'; if (!teoCvCache[k]) teoCvCache[k] = codeCv(170, 210, (x) => drawTeoFigure(x, { pose })); return teoCvCache[k]; }
  function teoFaceCv() { if (!teoCvCache.face) teoCvCache.face = codeCv(96, 96, (x) => { x.scale(2.2, 2.2); x.translate(-41, -12); drawTeoFigure(x, {}); }); return teoCvCache.face; }
  // Calaverita utilera de la soga (extra simple dibujado por código;
  // NO es uno de los Hermanos Calavera, que son otro final).
  function calCv() {
    if (!teoCvCache.cal) teoCvCache.cal = codeCv(90, 110, (x) => {
      circ(x, 45, 32, 21, '#f4f1e8', '#2b2130'); ell(x, 37, 32, 5, 7, '#2b2130'); ell(x, 53, 32, 5, 7, '#2b2130');
      x.fillStyle = '#2b2130'; x.beginPath(); x.moveTo(45, 40); x.lineTo(41, 47); x.lineTo(49, 47); x.closePath(); x.fill();
      x.strokeStyle = '#2b2130'; x.lineWidth = 1.6; for (let i = 0; i < 4; i++) { x.beginPath(); x.moveTo(36 + i * 5, 52); x.lineTo(36 + i * 5, 58); x.stroke(); }
      x.fillStyle = '#e23b4e'; x.fillRect(30, 62, 30, 20); x.fillStyle = '#3a2c50'; x.fillRect(30, 82, 30, 10);
      x.strokeStyle = '#f4f1e8'; x.lineWidth = 6; x.lineCap = 'round'; x.beginPath(); x.moveTo(30, 66); x.lineTo(14, 52); x.moveTo(60, 66); x.lineTo(76, 52); x.stroke();
    });
    return teoCvCache.cal;
  }
  G.specialFace = (id) => (id === 'alebrije' ? albFaceCv() : teoFaceCv());
  const specialURLs = {};
  G.specialURL = (id) => { if (!specialURLs[id]) specialURLs[id] = G.specialFace(id).toDataURL(); return specialURLs[id]; };
  // HUD propio de los duelos de Leyendas (el hud() base usa face(),
  // que exige hoja definida; aquí el retrato sale del dibujo por código)
  function legendsHud(d, c, title, lines) {
    panel(c, 8, 8, 306, 46, 'rgba(20,16,32,.78)');
    c.drawImage(G.specialFace(d.bossId), 13, 13, 36, 36);
    G.text(c, title, 56, 22, { size: 13, align: 'left', color: '#ffd7f0', lw: 4 });
    G.text(c, lines, 56, 40, { size: 10.5, align: 'left', color: '#fff', lw: 3 });
    panel(c, 470, 8, 162, 12, '#4a4458'); c.fillStyle = '#ffd23f'; c.fillRect(472, 10, 158 * clamp15(d.time / d.timeMax, 0, 1), 8);
    if (d.bubble) { const bw = Math.min(430, 26 + d.bubble.text.length * 6.4); panel(c, 320 - bw / 2, 58, bw, 24, 'rgba(20,16,32,.85)'); G.text(c, d.bubble.text, 320, 71, { size: 12.5, color: d.bubble.color, lw: 4 }); }
  }

  // ----- Minijuego de casting: «El patrón del Alebrije» -----
  class PatronDuel extends Duel {
    constructor(who, done) {
      super(who, 'alebrije', done, { rounds: 1, need: 1, time: 300, label: 'CASTING', title: 'EL PATRÓN DEL ALEBRIJE', hint: 'Mira la secuencia · ← → elige zona · ESPACIO la marca (o toca la zona)', rendT: 1.8 });
      this.timeMax = 300;
      this.p = new Actor(who, 520, 238); this.p.dir = 'up';
      this.cam = CAM_SALA();
      this.albPos = { x: 655, y: 148 };
      this.chipRects = []; this.zonePts = [];
      try { // toques: zonas del cuerpo y chips inferiores (se retira en finish)
        const cv = document.querySelector('#cv');
        if (cv && cv.addEventListener) {
          this.tapCv = cv;
          this.tapH = (e) => {
            if (this.st !== 'play' || this.phase !== 'input') return;
            const r = cv.getBoundingClientRect ? cv.getBoundingClientRect() : { left: 0, top: 0, width: 640, height: 360 };
            const lx = ((e.clientX - r.left) * 640) / Math.max(1, r.width), ly = ((e.clientY - r.top) * 360) / Math.max(1, r.height);
            for (let i = 0; i < 6; i++) { const z = this.zonePts[i]; if (z && Math.hypot(lx - z.x, ly - z.y) < 30) return this.pickZone(i); }
            const ci = this.chipRects.findIndex((rc) => lx >= rc.x && lx <= rc.x + rc.w && ly >= rc.y && ly <= rc.y + rc.h);
            if (ci >= 0) this.pickZone(ci);
          };
          cv.addEventListener('pointerdown', this.tapH);
        }
      } catch (e) { /* sin canvas accesible: queda el teclado */ }
      this.begin();
    }
    finish(res) { if (this.tapCv && this.tapH && this.tapCv.removeEventListener) this.tapCv.removeEventListener('pointerdown', this.tapH); super.finish(res); }
    setup() { this.r = 0; this.lost = 0; this.doneR = 0; this.tOn = 0.55; this.tOff = 0.3; this.newRound(); }
    newRound() {
      this.seq = Array.from({ length: 3 + this.r }, () => (Math.random() * 6) | 0);
      this.phase = 'show'; this.showT = 0; this.prog = 0; this.sel = 0; this.flash = null;
    }
    advance() { // fin de ronda (completa o fallada): 2 fallos = casting cerrado; con 4/5 se aprueba
      if (this.lost >= 2) return this.endRound('b', 'Dos rondas falladas: el Alebrije cierra el casting.');
      if (this.r >= 4) return this.endRound(this.doneR >= 4 ? 'p' : 'b', this.doneR >= 4 ? '¡Casting superado!' : `Solo ${this.doneR} de 5 secuencias: no alcanza.`);
      this.r++; this.newRound();
    }
    pickZone(i) {
      if (this.st !== 'play' || this.phase !== 'input') return;
      if (i === this.seq[this.prog]) {
        this.prog++; this.flash = { i, ok: true, t: 0.35 }; G.sfx('ok');
        if (this.prog >= this.seq.length) { this.doneR++; this.say('¡Secuencia completa!', '#7dff8a', 1); this.phase = 'between'; this.bt = 1.0; }
      } else {
        this.flash = { i, ok: false, t: 0.5 }; G.sfx('bad'); this.lost++;
        this.say('¡Esa zona no era!', '#ff6b7a', 1.1); this.phase = 'between'; this.bt = 1.2;
      }
    }
    extra() { return { rounds: this.doneR, lost: this.lost }; }
    update(dt) {
      this.p.update(dt);
      if (!this.tick(dt)) return;
      if (this.flash && (this.flash.t -= dt) <= 0) this.flash = null;
      if (this.phase === 'show') {
        this.showT += dt;
        const per = this.tOn + this.tOff;
        if (this.showT >= this.seq.length * per + 0.35) { this.phase = 'input'; this.prog = 0; this.say('¡Tu turno!', '#ffd23f', 0.9); }
      } else if (this.phase === 'input') {
        if (G.input.hit('left')) this.sel = (this.sel + 5) % 6;
        if (G.input.hit('right')) this.sel = (this.sel + 1) % 6;
        if (G.input.hit('action')) this.pickZone(this.sel);
      } else if (this.phase === 'between') { if ((this.bt -= dt) <= 0) this.advance(); }
    }
    draw(dt) {
      const t = performance.now() / 1000;
      let glow = -1, glowColor = null;
      if (this.phase === 'show') { const per = this.tOn + this.tOff, idx = Math.floor(this.showT / per); if (idx < this.seq.length && this.showT - idx * per < this.tOn) glow = this.seq[idx]; }
      if (this.flash) { glow = this.flash.i; glowColor = this.flash.ok ? '#7dff8a' : '#ff6b7a'; }
      if (this.phase === 'input' && !this.flash) { glow = this.sel; glowColor = 'rgba(120,200,255,0.9)'; }
      const alb = { x: this.albPos.x, y: this.albPos.y };
      W.render({
        cam: this.cam, dt, light: W.LIGHT.fiesta, actors: [this.p], focusZ: 0,
        sprites: () => { R.sprite(albCv('idle', glow >= 0 ? glow : null, glowColor), alb.x, 0, alb.y, { w: 118, h: 130, feet: 0, lit: 0.25, nostretch: true }); },
        over: (c) => {
          const b = R.project(alb.x, 0, alb.y), tp = R.project(alb.x, 130, alb.y), lf = R.project(alb.x - 59, 0, alb.y), rt = R.project(alb.x + 59, 0, alb.y);
          this.zonePts = ALB_ZONES.map((z) => ({ x: lf.x + z.fx * (rt.x - lf.x), y: tp.y + z.fy * (b.y - tp.y) }));
          legendsHud(this, c, 'EL PATRÓN DEL ALEBRIJE', `Ronda ${Math.min(this.r + 1, 5)}/5 · Completas: ${this.doneR} · Fallos: ${this.lost}/2`);
          if (this.phase === 'show') G.text(c, 'MIRA LA SECUENCIA…', 320, 84, { size: 15, color: '#ffe96a', lw: 6 });
          else if (this.phase === 'input') G.text(c, `REPITE: ${this.prog}/${this.seq.length} · zona: ${ALB_ZONES[this.sel].label}`, 320, 84, { size: 15, color: '#bfe2ff', lw: 6 });
          this.chipRects = ALB_ZONES.map((z, i) => {
            const w = 98, x = 14 + i * 103, y = 322;
            panel(c, x, y, w, 26, i === this.sel && this.phase === 'input' ? '#3f6fb5' : 'rgba(20,16,32,.8)');
            G.text(c, `${i + 1} ${z.label}`, x + w / 2, y + 14, { size: 11.5, color: '#fff', lw: 3 });
            return { x, y, w, h: 26 };
          });
          if (this.st === 'rend') this.endOverlay(c);
        },
      });
    }
    endOverlay(c) {
      const w = this.result.win;
      c.fillStyle = 'rgba(16,12,26,.85)'; c.fillRect(0, 0, 640, 360);
      G.icon(c, w === 'win' ? 'trofeo' : 'derrota', 320, 84, 48);
      G.text(c, w === 'win' ? '¡CASTING SUPERADO!' : 'SIN CASTING', 320, 138, { size: 36, color: w === 'win' ? '#7dff8a' : '#ff6b7a', lw: 9 });
      G.text(c, `Secuencias completas: ${this.doneR} de 5 · Rondas falladas: ${this.lost}`, 320, 182, { size: 15, lw: 6 });
      G.text(c, w === 'win' ? 'El Alebrije te acepta en la película' : 'El Alebrije se esconde de nuevo entre la decoración', 320, 208, { size: 11.5 });
    }
  }

  // ----- Boss 2A: «El set se hunde / Traza la leyenda» -----
  // Híbrido Hexagon Heat + Trace Race en UN minijuego con rondas
  // alternas: (a) trazo de precisión sobre la línea guía que dibuja
  // Teodora; (b) anuncio de color por flash y carrera a los
  // hexágonos seguros (los de ese color que la línea cruzó); el
  // resto del suelo se hunde. Caer 2 veces = fuera de la escena.
  const HEX_COLORS = ['#ffd23f', '#4fd0ff', '#ff8ad6'], HEX_NAMES = ['ÁMBAR', 'CELESTE', 'ROSA'];
  const hexCvCache = {};
  function hexCv(ci) {
    if (!hexCvCache[ci]) hexCvCache[ci] = codeCv(64, 64, (x) => {
      x.beginPath(); for (let i = 0; i < 6; i++) { const a = (Math.PI / 3) * i + Math.PI / 6, px = 32 + Math.cos(a) * 29, py = 32 + Math.sin(a) * 29; i ? x.lineTo(px, py) : x.moveTo(px, py); } x.closePath();
      x.fillStyle = HEX_COLORS[ci]; x.globalAlpha = 0.92; x.fill(); x.globalAlpha = 1; x.strokeStyle = '#fff2cf'; x.lineWidth = 3; x.stroke();
    });
    return hexCvCache[ci];
  }
  function legendPath(kind) { // línea guía (puntos cada ~12 u) en el patio: x∈[-240,240], y∈[0,200]
    const pts = [];
    if (kind === 'luna') { for (let a = -2.4; a <= 2.4; a += 0.16) pts.push({ x: Math.sin(a) * 150, y: 100 - Math.cos(a) * 88 }); for (let a = 2.0; a >= -2.0; a -= 0.16) pts.push({ x: Math.sin(a) * 150 + 44, y: 100 - Math.cos(a) * 66 }); }
    else if (kind === 'calavera') { for (let a = 0; a <= 6.28; a += 0.2) pts.push({ x: Math.sin(a) * 105, y: 92 - Math.cos(a) * 74 }); pts.push({ x: 40, y: 168 }, { x: 40, y: 192 }, { x: -40, y: 192 }, { x: -40, y: 168 }); }
    else { for (let x = -235; x <= 190; x += 14) pts.push({ x, y: 104 + Math.sin(x / 42) * 48 }); for (let a = 0; a <= 6.28; a += 0.3) pts.push({ x: 218 + Math.sin(a) * 27, y: 96 - Math.cos(a) * 27 }); }
    return pts;
  }
  class TrazoDuel extends Duel {
    constructor(who, done) {
      super(who, 'teodora', done, { rounds: 1, need: 1, time: 300, label: 'BOSS', title: 'EL SET SE HUNDE / TRAZA LA LEYENDA', hint: 'Recorre la línea luminosa · al anuncio, corre a un hexágono del color seguro', rendT: 1.8 });
      this.timeMax = 300;
      this.p = new Actor(who, -200, 190);
      this.partners = (G.S && G.S.party ? G.S.party.filter((id) => id !== who) : []).slice(0, 2).map((id, i) => new Actor(id, -160 + i * 40, 205));
      this.cam = { x: 0, y: 96, z: 6, dist: 470, pitch: 0.66, fov: 44 };
      this.teo = { x: -235, y: 100 };
      this.begin();
    }
    setup() {
      this.r = 0; this.fallsP = 0; this.fallsT = 0; this.precP = []; this.precT = [];
      this.tTrazo = 11; this.tAviso = 1.4; this.tCorre = 3.4; this.tCae = 1.1; // duraciones (el humo las acorta)
      this.newRound();
    }
    newRound() {
      const kinds = ['alebrije', 'calavera', 'luna'];
      this.pathKind = kinds[this.r % 3]; this.pts = legendPath(this.pathKind);
      this.hexes = [];
      for (let row = 0; row < 4; row++) for (let col = 0; col < 6; col++) this.hexes.push({ x: -250 + col * 100 + (row % 2) * 50, y: 8 + row * 54, color: (Math.random() * 3) | 0, safe: false, sink: 0 });
      // color seguro: el que más hexágonos tenga CERCA de la línea (mín. 3)
      let best = 0, bestN = -1;
      for (let ci = 0; ci < 3; ci++) { const n = this.hexes.filter((h) => h.color === ci && this.distPath(h) < 36).length; if (n > bestN) { bestN = n; best = ci; } }
      this.safeColor = best;
      this.hexes.forEach((h) => { h.safe = h.color === best && this.distPath(h) < 36; });
      if (this.hexes.filter((h) => h.safe).length < 2) { const near = [...this.hexes].sort((a, b) => this.distPath(a) - this.distPath(b)).slice(0, 3); near.forEach((h) => { h.color = best; h.safe = true; }); }
      this.phase = 'trazo'; this.pt = 0; this.sampleT = 0; this.accP = 0; this.accT = 0; this.samples = 0;
      this.teoU = 0; this.teoSelfie = this.r === 1 || Math.random() < 0.35; // selfie: se detiene y se acerca a cámara (su precisión cae)
      this.p.x = -235; this.p.y = 196; this.teo.x = this.pts[0].x; this.teo.y = this.pts[0].y;
      this.partners.forEach((a, i) => { a.x = -180 + i * 46; a.y = 208; a.tx = null; });
    }
    distPath(o) { let m = 1e9; for (let i = 0; i < this.pts.length; i += 2) { const d = Math.hypot(o.x - this.pts[i].x, o.y - this.pts[i].y); if (d < m) m = d; } return m; }
    moveActor(a, dt, sp) { const ax = G.input.axis(); a.x = clamp15(a.x + ax.x * sp * dt, -268, 268); a.y = clamp15(a.y + ax.y * sp * dt, -14, 222); if (ax.x) a.dir = ax.x < 0 ? 'left' : 'right'; else if (ax.y) a.dir = ax.y < 0 ? 'up' : 'down'; a.moving = !!(ax.x || ax.y); }
    extra() { const avg = (arr) => (arr.length ? Math.round(arr.reduce((s, v) => s + v, 0) / arr.length) : 0); return { precP: avg(this.precP), precT: avg(this.precT), fallsP: this.fallsP, fallsT: this.fallsT }; }
    update(dt) {
      const p = this.p; p.update(dt); this.partners.forEach((a) => a.update(dt));
      if (!this.tick(dt)) return;
      this.pt += dt;
      if (this.phase === 'trazo') {
        this.moveActor(p, dt, 158);
        // Teodora recorre la línea con ruido lateral; en su selfie se
        // detiene a mitad de camino y deriva hacia la cámara.
        const selfieNow = this.teoSelfie && this.teoU > 0.38 && this.teoU < 0.6;
        if (!selfieNow) this.teoU = Math.min(1, this.teoU + dt / this.tTrazo);
        const idx = Math.min(this.pts.length - 1, Math.floor(this.teoU * (this.pts.length - 1))), base = this.pts[idx];
        const lat = Math.sin(this.teoU * 22 + this.r * 2) * (7 + this.r * 3.5);
        this.teo.x = base.x + lat * 0.4; this.teo.y = base.y + lat + (selfieNow ? -52 : 0);
        this.sampleT += dt;
        if (this.sampleT >= 0.12) { this.sampleT = 0; this.samples++; this.accP += clamp15(1 - this.distPath(p) / 62, 0, 1); this.accT += clamp15(1 - this.distPath(this.teo) / 62, 0, 1); }
        if (this.pt >= this.tTrazo) {
          this.precP.push(this.samples ? (this.accP / this.samples) * 100 : 0); this.precT.push(this.samples ? (this.accT / this.samples) * 100 : 0);
          this.phase = 'aviso'; this.pt = 0; G.sfx('msg'); this.say(`¡Al color ${HEX_NAMES[this.safeColor]}!`, '#ffd7f0', 1.3);
          this.partners.forEach((a) => { const pool = Math.random() < 0.62 ? this.hexes.filter((h) => h.safe) : this.hexes; a.tx = pool[(Math.random() * pool.length) | 0]; });
        }
      } else if (this.phase === 'aviso') { if (this.pt >= this.tAviso) { this.phase = 'corre'; this.pt = 0; } }
      else if (this.phase === 'corre' || this.phase === 'cae') {
        this.moveActor(p, dt, 218);
        // Teodora FLOTA: tarda ~0.9 s en "pisar" (su gracia), luego va al seguro más cercano
        if (this.pt > 0.9 || this.phase === 'cae') { const tgt = this.hexes.filter((h) => h.safe).sort((a, b) => Math.hypot(a.x - this.teo.x, a.y - this.teo.y) - Math.hypot(b.x - this.teo.x, b.y - this.teo.y))[0]; if (tgt) { const d = Math.hypot(tgt.x - this.teo.x, tgt.y - this.teo.y), step = 165 * dt; if (d > 4) { this.teo.x += ((tgt.x - this.teo.x) / d) * Math.min(step, d); this.teo.y += ((tgt.y - this.teo.y) / d) * Math.min(step, d); } } }
        this.partners.forEach((a) => { if (a.tx) { const d = Math.hypot(a.tx.x - a.x, a.tx.y - a.y); if (d > 5) { a.x += ((a.tx.x - a.x) / d) * 175 * dt; a.y += ((a.tx.y - a.y) / d) * 175 * dt; a.moving = true; a.dir = a.tx.x < a.x ? 'left' : 'right'; } else a.moving = false; } });
        if (this.phase === 'corre' && this.pt >= this.tCorre) { this.phase = 'cae'; this.pt = 0; G.sfx('bad'); }
        else if (this.phase === 'cae') {
          this.hexes.forEach((h) => { if (!h.safe && h.sink < 1) h.sink = Math.min(1, h.sink + dt / 0.55); });
          if (this.pt >= this.tCae) { // resolución de la caída (con la gracia de flotación de Teodora ya corrida)
            const onSafe = (o) => { const h = this.hexes.reduce((m, hh) => (Math.hypot(o.x - hh.x, o.y - hh.y) < Math.hypot(o.x - m.x, o.y - m.y) ? hh : m), this.hexes[0]); return Math.hypot(o.x - h.x, o.y - h.y) < 34 && h.safe; };
            if (!onSafe(p)) { this.fallsP++; p.emo('💦', 1); W.puff(p.x, p.y, 8, true); this.say('¡Te hundiste!', '#ff6b7a', 1); }
            if (!onSafe(this.teo)) { this.fallsT++; this.say('¡Teodora también cayó!', '#7dff8a', 1); }
            if (this.fallsP >= 2) return this.endRound('b', 'Caíste dos veces: fuera de la escena.');
            if (this.fallsT >= 2) return this.endRound('p', 'Teodora cayó dos veces: ¡prueba superada!');
            if (this.r >= 2) { const e = this.extra(); return this.endRound(e.precP > e.precT ? 'p' : e.precP < e.precT ? 'b' : 'tie', `Precisión — Tú: ${e.precP}% · Teodora: ${e.precT}%`); }
            this.r++; this.newRound();
          }
        }
      }
    }
    draw(dt) {
      const t = performance.now() / 1000, p = this.p;
      W.render({
        cam: this.cam, dt, light: W.LIGHT.fiesta, noApartment: true, actors: [p, ...this.partners], focusZ: 0,
        boxes: (mb) => {
          mb.box(0, -5, 96, 620, 10, 330, '#5d4037'); // piso del patio de la casona
          mb.box(0, 55, -64, 640, 130, 12, '#7a4a3a'); mb.box(0, 118, -64, 640, 16, 14, '#5d3427'); // fachada con cornisas
          [-220, 0, 220].forEach((ax) => mb.box(ax, 42, -56, 64, 84, 6, '#4a2e22')); // arcos oscuros
        },
        sprites: () => {
          for (const h of this.hexes) R.flat(hexCv(h.color), h.x, 1 - h.sink * 26, h.y, 60, 60, { lit: 0.25, alpha: h.safe && this.phase !== 'trazo' ? 1 : 0.55 + 0.2 * Math.sin(t * 3 + h.x) });
          if (this.phase === 'trazo' || this.phase === 'aviso') for (let i = 0; i < this.pts.length; i += 2) R.flat(R.glowTex, this.pts[i].x, 1.6, this.pts[i].y, 15, 15, { color: [1, 0.85, 0.35], alpha: 0.5 + 0.3 * Math.sin(t * 5 + i) });
          R.flat(R.glowTex, this.teo.x, 0.8, this.teo.y, 44, 30, { color: [0.1, 0.05, 0.16], alpha: 0.5 }); // sombra suave de fantasma
          R.sprite(teoCv(this.phase === 'aviso' ? 'selfie' : 'trazo'), this.teo.x, 13 + Math.sin(t * 2.2) * 3, this.teo.y, { w: 56, h: 70, feet: 0, lit: 0.2, nostretch: true });
        },
        over: (c) => {
          const e = this.extra();
          legendsHud(this, c, 'EL SET SE HUNDE / TRAZA LA LEYENDA', `Ronda ${Math.min(this.r + 1, 3)}/3 · Precisión tú ${e.precP}% · Teodora ${e.precT}% · Caídas ${this.fallsP}/2`);
          if (this.phase === 'trazo') G.text(c, `TRAZA LA LEYENDA (${this.pathKind.toUpperCase()}) — ${Math.max(0, this.tTrazo - this.pt).toFixed(0)}s`, 320, 84, { size: 14, color: '#ffe96a', lw: 6 });
          else if (this.phase === 'aviso' || this.phase === 'corre') { panel(c, 190, 66, 260, 34, HEX_COLORS[this.safeColor]); G.text(c, `¡AL ${HEX_NAMES[this.safeColor]}!`, 320, 84, { size: 19, color: '#241a10', lw: 2, stroke: false }); if (this.phase === 'corre') G.text(c, `El set se hunde en ${Math.max(0, this.tCorre - this.pt).toFixed(1)}…`, 320, 116, { size: 13, color: '#ff6b7a', lw: 5 }); }
          else if (this.phase === 'cae') G.text(c, '¡SE HUNDE!', 320, 84, { size: 19, color: '#ff6b7a', lw: 7 });
          if (this.st === 'rend') this.endOverlay(c);
        },
      });
    }
    endOverlay(c) {
      const w = this.result.win, e = this.extra();
      c.fillStyle = 'rgba(16,12,26,.85)'; c.fillRect(0, 0, 640, 360);
      G.icon(c, w === 'win' ? 'trofeo' : w === 'tie' ? 'empate' : 'derrota', 320, 84, 48);
      G.text(c, w === 'win' ? '¡SUPERASTE A TEODORA!' : w === 'tie' ? 'EMPATE' : 'TEODORA SE QUEDA CON LA ESCENA', 320, 138, { size: 30, color: w === 'win' ? '#7dff8a' : w === 'tie' ? '#ffd23f' : '#ff6b7a', lw: 9 });
      G.text(c, `Precisión — Tú: ${e.precP}% · Teodora: ${e.precT}% · Caídas tú ${this.fallsP} · ella ${this.fallsT}`, 320, 182, { size: 14.5, lw: 6 });
      G.text(c, 'Prueba 2A de la boss final de Leyendas', 320, 208, { size: 11.5 });
    }
  }

  // ----- Boss 2B: «La soga de fuego» (Hot Rope Jump) -----
  class SogaDuel extends Duel {
    constructor(who, done) {
      super(who, 'teodora', done, { rounds: 1, need: 1, time: 240, label: 'BOSS', title: 'LA SOGA DE FUEGO', hint: 'Mantén ESPACIO para cargar el salto y SUELTA para saltar · la llama azul va lento, la naranja rápido', rendT: 1.8 });
      this.timeMax = 240;
      this.p = new Actor(who, -32, 0);
      this.partners = (G.S && G.S.party ? G.S.party.filter((id) => id !== who) : []).slice(0, 2).map((id, i) => new Actor(id, i ? 118 : -112, 0));
      this.cam = { x: 0, y: 0, z: 6, dist: 350, pitch: 0.3, fov: 42 };
      this.begin();
    }
    setup() {
      this.a = -Math.PI / 2; this.passes = 0; this.maxPasses = 40;
      this.mk = (x) => ({ x, h: 0, v: 0, out: false, roces: 0, charge: 0, react: rnd(0.3, 0.48), smoke: 0 });
      this.J = { p: this.mk(-32), t: this.mk(46), n: this.partners.map((a) => this.mk(a.x)) };
      this.teoSelfieT = 0;
      for (const a of [this.p, ...this.partners]) { a.dir = 'right'; }
    }
    period() { return Math.max(0.8, 1.5 - this.passes * 0.018); } // la soga acelera por tramos
    omega() { // con amagues: algunos tramos parten lento y aprietan al final
      const base = (Math.PI * 2) / this.period();
      const ph = ((this.a + Math.PI / 2) % (Math.PI * 2)) / (Math.PI * 2);
      const feint = this.passes % 6 === 4;
      return base * (feint ? (ph < 0.45 ? 0.7 : 1.4) : 1);
    }
    timeToBottom() { const twoPi = Math.PI * 2, d = (Math.PI / 2 - (this.a % twoPi) + twoPi) % twoPi; return d / this.omega(); }
    jumpP(charge) { const j = this.J.p; if (!j.out && j.h <= 0) { j.v = 335 + clamp15(charge, 0, 0.5) * 430; j.h = 0.01; } }
    stepJumper(j, a, dt, grav, mine) {
      if (j.out) { if (j.smoke > 0) j.smoke -= dt; if (a) { a.jy = 0; a.jv = 0; } return; }
      if (j.h > 0 || j.v > 0) { j.v -= grav * dt; j.h += j.v * dt; if (j.h <= 0) { j.h = 0; j.v = 0; if (a) a.squash = 0.14; } }
      if (a) { a.jy = j.h; a.jv = 0; }
    }
    extra() { return { passes: this.passes, rocesP: this.J.p.roces, rocesT: this.J.t.roces }; }
    update(dt) {
      const p = this.p; p.update(dt); this.partners.forEach((a) => a.update(dt));
      if (!this.tick(dt)) return;
      const J = this.J, prev = this.a;
      this.a += this.omega() * dt;
      const twoPi = Math.PI * 2, crossed = Math.floor((prev - Math.PI / 2) / twoPi) !== Math.floor((this.a - Math.PI / 2) / twoPi);
      if (crossed) { // la soga pasa BAJO los pies: quien esté bajo, se quema
        this.passes++;
        for (const j of [J.p, J.t, ...J.n]) { if (j.out) continue; if (j.h < 20) { j.out = true; j.smoke = 1.6; j.v = 0; j.h = 0; } else if (j.h < 38) j.roces++; }
        if (J.p.out) { G.sfx('bad'); this.say('¡Quemado cómico!', '#ff6b7a', 1.2); }
        if (J.t.out) { G.sfx('ok'); this.say('¡Teodora se quemó!', '#7dff8a', 1.2); }
      }
      // jugador: mantener carga, soltar salta (tecla o toque vía 'action')
      if (!J.p.out) {
        if (G.input.held('action') && J.p.h <= 0) { J.p.charge = Math.min(0.5, J.p.charge + dt); if (J.p.charge >= 0.5) { this.jumpP(0.5); J.p.charge = 0; } }
        else if (J.p.charge > 0) { this.jumpP(J.p.charge); J.p.charge = 0; }
      }
      // Teodora: flota (gravedad baja, aguanta más) pero cada ~10
      // vueltas se toma una selfie y salta TARDE a propósito de guion.
      if (!J.t.out && J.t.h <= 0) {
        const selfiePass = (this.passes + 1) % 10 === 0, ttb = this.timeToBottom();
        if (selfiePass) { this.teoSelfieT = 0.8; if (ttb < 0.05) { J.t.v = 430; J.t.h = 0.01; } }
        else if (ttb < 0.4) { J.t.v = 430; J.t.h = 0.01; }
      }
      if (this.teoSelfieT > 0) this.teoSelfieT -= dt;
      for (const j of J.n) if (!j.out && j.h <= 0 && this.timeToBottom() < j.react) { j.v = 560; j.h = 0.01; }
      this.stepJumper(J.p, p, dt, 1050, true);
      this.stepJumper(J.t, null, dt, 600, false);
      J.n.forEach((j, i) => this.stepJumper(j, this.partners[i], dt, 1050, false));
      if (J.p.out) return this.endRound(J.t.out ? 'p' : 'b', J.t.out ? 'Teodora también se quemó… ¡pero tú duraste más!' : 'Te quemaste: Teodora se queda con la escena.');
      if (J.t.out) return this.endRound('p', '¡Teodora se quemó con su propia soga!');
      if (this.passes >= this.maxPasses) return this.endRound(J.p.roces < J.t.roces ? 'p' : J.p.roces > J.t.roces ? 'b' : 'tie', `Tope de vueltas — Roces tú: ${J.p.roces} · Teodora: ${J.t.roces}`);
    }
    draw(dt) {
      const t = performance.now() / 1000, J = this.J;
      W.render({
        cam: this.cam, dt, light: W.LIGHT.noche, noApartment: true, actors: [this.p, ...this.partners], focusZ: 0,
        boxes: (mb) => {
          mb.box(0, -5, 0, 560, 10, 130, '#4a3049'); // piso del patio nocturno
          mb.box(0, 60, -78, 620, 140, 10, '#2c2138'); mb.box(0, 128, -78, 620, 14, 12, '#1d1626'); // pared de la casona
          mb.box(-185, 26, 0, 12, 52, 12, '#6b4a2f'); mb.box(185, 26, 0, 12, 52, 12, '#6b4a2f'); // postes de la soga
        },
        sprites: () => {
          R.sprite(calCv(), -185, 40, 0, { w: 40, h: 49, feet: 0, lit: 0.3, nostretch: true });
          R.sprite(calCv(), 185, 40, 0, { w: 40, h: 49, feet: 0, lit: 0.3, nostretch: true });
          R.flat(R.glowTex, J.t.x, 0.8, 0, 42, 28, { color: [0.1, 0.05, 0.16], alpha: 0.5 });
          R.sprite(teoCv(this.teoSelfieT > 0 ? 'selfie' : 'idle'), J.t.x, 10 + J.t.h + Math.sin(t * 2.2) * 2.5, 0, { w: 54, h: 67, feet: 0, lit: 0.25, nostretch: true, alpha: J.t.out ? 0.45 : 1 });
          for (const j of [J.p, J.t, ...J.n]) if (j.out && j.smoke > 0) R.sprite(R.glowTex, j.x, 26, 0, { w: 30, h: 30, feet: 0, lit: 0, nostretch: true, alpha: 0.4 });
        },
        over: (c) => {
          // la soga de fuego: curva entre los postes; su punto medio
          // baja hasta el suelo cuando sin(a) = 1 (el paso peligroso)
          const pl = R.project(-185, 52, 0), pr = R.project(185, 52, 0), mid = R.project(0, 62 - Math.sin(this.a) * 60, 0);
          const slow = this.period() > 1.15, col = slow ? '#4fd0ff' : '#ff8a3c';
          c.strokeStyle = col; c.globalAlpha = 0.35; c.lineWidth = 11; c.beginPath(); c.moveTo(pl.x, pl.y); c.quadraticCurveTo(mid.x, mid.y, pr.x, pr.y); c.stroke();
          c.globalAlpha = 1; c.lineWidth = 4.5; c.beginPath(); c.moveTo(pl.x, pl.y); c.quadraticCurveTo(mid.x, mid.y, pr.x, pr.y); c.stroke();
          for (let i = 1; i < 8; i++) { const u = i / 8, qx = (1 - u) * (1 - u) * pl.x + 2 * (1 - u) * u * mid.x + u * u * pr.x, qy = (1 - u) * (1 - u) * pl.y + 2 * (1 - u) * u * mid.y + u * u * pr.y; imgStar(c, qx, qy, 5 + Math.sin(t * 17 + i * 2) * 1.6, col); }
          legendsHud(this, c, 'LA SOGA DE FUEGO', `Vuelta ${Math.min(this.passes + 1, this.maxPasses)}/${this.maxPasses} · ${slow ? 'LLAMA AZUL: lento' : 'LLAMA NARANJA: ¡rápido!'} · Roces tú ${J.p.roces} · ella ${J.t.roces}`);
          if (J.p.charge > 0) { const h = this.p.head(30); panel(c, h.x - 26, h.y, 52, 8, '#4a4458'); c.fillStyle = '#ffd23f'; c.fillRect(h.x - 24, h.y + 2, 48 * (J.p.charge / 0.5), 4); }
          if (this.teoSelfieT > 0) { const q = R.project(J.t.x, 96 + J.t.h, 0); if (q.ok) G.text(c, '¡SELFIE!', q.x, q.y, { size: 12, color: '#ffd7f0', lw: 5 }); }
          if (this.st === 'rend') this.endOverlay(c);
        },
      });
    }
    endOverlay(c) {
      const w = this.result.win, e = this.extra();
      c.fillStyle = 'rgba(16,12,26,.85)'; c.fillRect(0, 0, 640, 360);
      G.icon(c, w === 'win' ? 'trofeo' : w === 'tie' ? 'empate' : 'derrota', 320, 84, 48);
      G.text(c, w === 'win' ? '¡ÚLTIMO EN PIE!' : w === 'tie' ? 'EMPATE' : 'TE QUEMASTE', 320, 138, { size: 34, color: w === 'win' ? '#7dff8a' : w === 'tie' ? '#ffd23f' : '#ff6b7a', lw: 9 });
      G.text(c, `Vueltas: ${e.passes} · Roces — Tú: ${e.rocesP} · Teodora: ${e.rocesT}`, 320, 182, { size: 15, lw: 6 });
      G.text(c, 'Prueba 2B de la boss final de Leyendas', 320, 208, { size: 11.5 });
    }
  }

  // ----- Cadena del clímax de Leyendas -----
  // Revelación del set → 2A Trazo → 2B Soga → resolución por la
  // regla de boss (ganar ≥1 = película; 2/2 = versión plena;
  // 0/2 = "no apta para cine" y la partida sigue a su final normal).
  function legendsSubtitle(c, text, color) {
    if (!text) return;
    panel(c, 70, 294, 500, 54, 'rgba(14,10,24,.88)');
    wrap(c, text, 84, 308, 472, 13, color || '#fff');
  }
  class LegendsRevealScene {
    constructor(done) { this.done = done; this.t = 0; this.who = (G.S && G.S.protagonist) || 'natalia'; G.captureKeys = true; }
    cast() {
      if (!this._cast) {
        this._cast = {
          p: new Actor(this.who, 520, 235),
          party: (G.S && G.S.party ? G.S.party.filter((id) => id !== this.who) : []).slice(0, 3).map((id, i) => new Actor(id, 452 + i * 44, 252)),
          xim: new Actor('ximena', 636, 196), jose: new Actor('jose', 838, 238), cat: new Actor('pollito', 806, 252),
        };
        this._cast.xim.dir = 'down'; this._cast.jose.dir = 'left';
      }
      return this._cast;
    }
    update(dt) {
      const cs = this.cast(); cs.p.update(dt); cs.party.forEach((a) => a.update(dt)); cs.xim.update(dt); cs.jose.update(dt); cs.cat.update(dt);
      this.t += dt;
      if (this.t > 1 && G.input.hit('action')) this.t = Math.max(this.t, 8.2); // skippable
      if (this.t >= 8.4) { const d = this.done; this.done = null; if (d) d(); }
    }
    draw(dt) {
      const t = this.t, cs = this.cast();
      const albX = t < 3.4 ? 380 : 380 + Math.min(1, (t - 3.4) / 1.2) * 120; // el Alebrije sale de su escondite entre la decoración
      const teoElev = t < 4.6 ? 150 : Math.max(24, 150 - (t - 4.6) * 62); // Teodora desciende flotando
      W.render({
        cam: CAM_SALA(), dt, light: t < 1.6 && (t % 0.3) < 0.15 ? W.LIGHT.oscuro : W.LIGHT.fiesta, actors: [cs.p, ...cs.party, cs.xim, cs.jose, cs.cat], focusZ: 0,
        sprites: () => {
          if (t > 3.2) R.sprite(albCv('director'), albX, 0, 168, { w: 104, h: 115, feet: 0, lit: 0.25, nostretch: true });
          if (t > 4.4) { R.flat(R.glowTex, 772, 0.8, 168, 46, 30, { color: [0.1, 0.05, 0.16], alpha: 0.5 }); R.sprite(teoCv('altiva'), 772, teoElev, 168, { w: 62, h: 77, feet: 0, lit: 0.2, nostretch: true }); }
        },
        over: (c) => {
          if (t > 1.8) { // reflectores del set apuntando a la sala
            for (const sx of [70, 570]) { const grd = c.createLinearGradient(sx, 0, 320, 300); grd.addColorStop(0, 'rgba(255,240,180,0.30)'); grd.addColorStop(1, 'rgba(255,240,180,0)'); c.fillStyle = grd; c.beginPath(); c.moveTo(sx, 0); c.lineTo(sx + 26, 0); c.lineTo(400, 310); c.lineTo(240, 310); c.closePath(); c.fill(); }
            G.text(c, 'SET DE FILMACIÓN · ESCENA 1 · TOMA 1', 320, 26, { size: 13, color: '#ffe96a', lw: 6 });
          }
          const line = t < 1.8 ? 'La sala se apaga un segundo…' : t < 3.4 ? '…y se enciende COMO UN SET DE CINE. Las paredes eran utilería.' : t < 5.4 ? 'EL ALEBRIJE: «¡Sorpresa! ¡Su casa era mi set! ¿O mi set era su casa?»' : t < 7 ? 'TEODORA: «A ver, a ver… ¿esta es la sorpresa? Yo he visto mejores.»' : 'TEODORA: «Si quieren su final de película, superen mis dos pruebas.»';
          legendsSubtitle(c, line, t >= 5.4 ? '#ffd7f0' : '#fff');
          if (t > 1) G.prompt(c, 'ESPACIO: saltar', 590, 344);
        },
      });
    }
  }
  class LegendsFinaleScene {
    constructor(results, who, done) { this.results = results; this.who = who; this.done = done; this.t = 0; G.captureKeys = true; }
    wins() { return (this.results.trazo && this.results.trazo.win === 'win' ? 1 : 0) + (this.results.soga && this.results.soga.win === 'win' ? 1 : 0); }
    cast() {
      if (!this._cast) {
        this._cast = {
          p: new Actor(this.who, 520, 235),
          party: (G.S && G.S.party ? G.S.party.filter((id) => id !== this.who) : []).slice(0, 3).map((id, i) => new Actor(id, 452 + i * 44, 252)),
          xim: new Actor('ximena', 636, 196), jose: new Actor('jose', 838, 238), cat: new Actor('pollito', 806, 252),
        };
        this._cast.xim.dir = 'down'; this._cast.jose.dir = 'left';
      }
      return this._cast;
    }
    update(dt) {
      const cs = this.cast(); cs.p.update(dt); cs.party.forEach((a) => a.update(dt)); cs.xim.update(dt); cs.jose.update(dt); cs.cat.update(dt);
      this.t += dt;
      const w = this.wins(), dur = w === 0 ? 5 : 13.5;
      if (this.t > 4.5 && this.t < 6.5 && w > 0) cs.xim.goTo(655, 208, 90); // Ximena despierta y camina al centro del set
      if (this.t > 1 && G.input.hit('action')) this.t = Math.max(this.t, dur - 0.05);
      if (this.t >= dur) { const d = this.done; this.done = null; if (d) d({ movie: w >= 1, full: w === 2, wins: w }); }
    }
    draw(dt) {
      const t = this.t, cs = this.cast(), w = this.wins();
      W.render({
        cam: CAM_SALA(), dt, light: W.LIGHT.fiesta, actors: [cs.p, ...cs.party, cs.xim, cs.jose, cs.cat], focusZ: 0,
        sprites: () => {
          R.sprite(albCv('feliz'), 500, 0, 168, { w: 104, h: 115, feet: 0, lit: 0.25, nostretch: true });
          R.flat(R.glowTex, 772, 0.8, 168, 46, 30, { color: [0.1, 0.05, 0.16], alpha: 0.5 });
          R.sprite(teoCv(w === 2 ? 'selfie' : w === 1 ? 'altiva' : 'idle'), 772, 24 + Math.sin(t * 2.2) * 3, 168, { w: 62, h: 77, feet: 0, lit: 0.2, nostretch: true });
        },
        over: (c) => {
          if (w === 0) { legendsSubtitle(c, t < 2.6 ? 'TEODORA: «No apta para cine. Su fiesta, no mi película.»' : 'El set se apaga. La fiesta sigue… como fiesta.', '#ffd7f0'); return; }
          if (t < 4.5) legendsSubtitle(c, 'El set entero contiene la respiración…', '#fff');
          else if (t < 6.5) legendsSubtitle(c, 'XIMENA: «¿Me hicieron una fiesta… en una película?»', '#ffd7f0');
          else if (t < 8 && w === 1) legendsSubtitle(c, 'TEODORA: «Esa línea era MÍA en el guion. Pero bueno: protagonista invitada.»', '#ffd7f0');
          else {
            // créditos ridículos del guion, rodando sobre el set
            const credits = [
              '«1 MINUTO PARA LA FIESTA: LA PELÍCULA»',
              'Ximena … como Ximena · PROTAGONISTA SORPRESA',
              `${G.CHARS[this.who].name} … Dirección de fiesta`,
              'El Alebrije … Director invitado',
              'José … Villano invitado',
              'Pollito … como Pollito',
              w === 2 ? 'Teodora … Presentadora' : 'Teodora … Protagonista invitada',
              'La casa … como el set',
            ];
            const shown = Math.min(credits.length, 1 + Math.floor((t - 8) / 0.62));
            panel(c, 120, 44, 400, 20 + shown * 19, 'rgba(14,10,24,.88)');
            G.text(c, 'CRÉDITOS', 320, 58, { size: 12, color: '#ffe96a', lw: 4 });
            credits.slice(0, shown).forEach((ln, i) => G.text(c, ln, 320, 78 + i * 19, { size: 12.5, color: '#fff', lw: 4 }));
            if (t > 12.6) { c.fillStyle = `rgba(255,255,255,${Math.max(0, 0.85 - (t - 12.6) * 2)})`; c.fillRect(0, 0, 640, 360); G.text(c, '¡SELFIE OFICIAL DEL ELENCO!', 320, 330, { size: 13, color: '#ffd7f0', lw: 6 }); }
          }
          if (t > 1) G.prompt(c, 'ESPACIO: saltar', 590, 344);
        },
      });
    }
  }
  class LegendsEndingScene {
    // Escena-orquesta (mismo patrón que SpaceEndingScene de J1407b):
    // ES una escena que delega update/draw en la subescena actual y
    // la va cambiando en los callbacks, sin tocar G.setScene.
    // Compatible con el patrón de práctica: new LegendsEndingScene(who, done).
    constructor(who, done) { if (typeof who === 'function') { done = who; who = null; } this.doneAll = done; this.who = who || (G.S && G.S.protagonist) || 'natalia'; this.results = {}; this.finished = false; this.cur = new LegendsRevealScene(() => this.toTrazo()); }
    toTrazo() { this.cur = new TrazoDuel(this.who, (r) => { this.results.trazo = r; this.toSoga(); }); }
    toSoga() { this.cur = new SogaDuel(this.who, (r) => { this.results.soga = r; this.toFinale(); }); }
    toFinale() {
      this.cur = new LegendsFinaleScene(this.results, this.who, (fin) => {
        if (this.finished) return; this.finished = true;
        if (this.doneAll) this.doneAll({ win: fin.movie ? (fin.full ? 'win' : 'tie') : 'lose', detail: fin.full ? '¡Final de película COMPLETO!' : fin.movie ? 'Final de película (Teodora, protagonista invitada)' : 'Sin película: Teodora ganó las dos pruebas', movie: fin.movie, full: fin.full, wins: fin.wins, trazo: this.results.trazo, soga: this.results.soga });
      });
    }
    update(dt) { if (this.cur) this.cur.update(dt); }
    draw(dt) { if (this.cur) this.cur.draw(dt); }
  }

  G.Scenes = { CollectScene, HomeScene, DecoDuel, ChaseDuel, MessageDuel, PizzaRace, SleepwalkDuel, MemoryDuel, SpikeDuel, StompDuel, DroneDuel, ClimbDuel, CactusRaceDuel, ImageDuel, BalloonDuel, RingRaceDuel, AsteroidBeltDuel, SpaceLaunchScene, SpaceTransitionScene, SpacePartyScene, SpaceEndingScene, buildDecoSet, CandleGame, PatronDuel, TrazoDuel, SogaDuel, LegendsEndingScene };
})();
