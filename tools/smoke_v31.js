/* ============================================================
   PRUEBA DE HUMO v3.1 — Node, sin navegador.
   Carga los scripts REALES del juego (js/*.js) sobre un DOM y
   un canvas falsos, y ejercita:
   A) Decoración Express: nº de zonas por ronda según inventario
      (bug: con 0–2 tipos de decoración recolectados, las rondas
      salían con UN SOLO ítem; deben ser varios, siempre).
   B) Decoración Express: colocación atómica (acierto coloca,
      fallo NO consume, ESPACIO lejos no hace nada, Pollito puede
      tirar lo colgado y se puede volver a colgar).
   C) Apagón: práctica directa — partida perfecta, partida con
      todo mal y partida mixta: salidas del diseño de Jose.
   D) Apagón en la historia: runEvent('apagon') completo con
      respuestas correctas: efectos y flags aplicados.
   F) Salto de repisas: escalada infinita — generación procedural
      sin fin y determinista, set dibujado acotado a cualquier
      altura, caída de una repisa al fallar (la máxima no se
      pierde) y resultado por altura máxima (win/tie/lose).
   G) Party (diseño original retomado): roster de 7 elegibles,
      reclutar partners en la recolección (cargar/entregar, tope
      3, bajar no recluta, ítems conviven), la huida al llegar
      Ximena deja la escena solo con la party, y las asignaciones
      posteriores ofrecen solo a la party.
   H) Repisas al aterrizar + iconografía propia: la repisa nueva
      de cada columna nace SOLO cuando el escalador aterriza en su
      máxima (nunca antes, nunca en banda lejana), la cámara del
      duelo está alejada, y ningún emoticono prohibido reaparece
      en el entorno del juego (escenas/HUD) fuera del chat.
   I) Huida coreografiada + selección sin scrollbars: la ruta de
      cada huido pasa AL LADO de Ximena (punto de paso calculado
      con su posición, lados alternos) y termina en la puerta
      principal (510, 706); la selección de protagonista y el
      selector de práctica usan un carrusel con botones ‹ ›,
      puntos y flechas del teclado, sin ninguna barra de scroll,
      desde el que se alcanzan los 7 roomies.
   J) Spawns seguros (bug «Atrapa a Pollito»): el jugador nacía
      SOBRE la mesa de fiesta en la ronda 2 (spawn (900, 240)
      dentro de ptable) y no podía moverse en ninguna dirección.
      Spawn corregido + validación permanente (World.nearestFree):
      en los duelos con muebles (Pollito, Decoración, Sonámbula,
      Memoria, Cactus) ningún actor nace dentro de un mueble, y
      desde el spawn de la ronda 2 se puede salir en las 4
      direcciones.
   K) Repisas en el espacio: el campo de galaxias solo existe en
      la zona espacio y su densidad crece con la altura; el cohete
      de los huidos solo pasa en el espacio, con la tripulación
      correcta (S.fled en historia; todos menos el elegido en
      práctica) y su guiño en burbuja la primera vez.
   Uso: node tools/smoke_v31.js   (exit 0 = todo OK)
   ============================================================ */
'use strict';
const fs = require('fs');
const vm = require('vm');
const path = require('path');
const SRC = path.join(__dirname, '..', 'application', 'src', 'js');

// ---------- DOM falso ----------
const idRegistry = new Map();
const selectorCache = new Map();
const handlers = { keydown: [], keyup: [] };

class FakeCtx {
  measureText() { return { width: 42 }; }
  getImageData(x, y, w, h) { return { data: new Uint8ClampedArray(Math.max(4, (w | 0) * (h | 0) * 4)), width: w, height: h }; }
  createRadialGradient() { return { addColorStop() {} }; }
  createLinearGradient() { return { addColorStop() {} }; }
}
['fillRect', 'clearRect', 'beginPath', 'closePath', 'roundRect', 'fill', 'stroke', 'fillText', 'strokeText',
  'drawImage', 'putImageData', 'save', 'restore', 'translate', 'scale', 'rotate', 'setTransform', 'arc',
  'moveTo', 'lineTo', 'rect', 'clip', 'ellipse', 'quadraticCurveTo', 'bezierCurveTo'].forEach((m) => { FakeCtx.prototype[m] = function () {}; });

function parseButtons(root, html) {
  const re = /<button\b([^>]*)>/g; let m;
  while ((m = re.exec(html))) {
    const attrs = m[1], b = new FakeEl('button');
    const id = /id="([^"]+)"/.exec(attrs); if (id) b.id = id[1];
    const cls = /class="([^"]+)"/.exec(attrs); if (cls) b.className = cls[1];
    const did = /data-id="([^"]+)"/.exec(attrs); if (did) b.dataset.id = did[1];
    b.parent = root; root.children.push(b);
  }
}
function queryWithin(root, sel, all) {
  const out = [];
  const match = (e) => sel.startsWith('.') ? e._classes.has(sel.slice(1)) : sel.startsWith('#') ? e._id === sel.slice(1) : false;
  (function walk(e) { e.children.forEach((ch) => { if (match(ch)) out.push(ch); walk(ch); }); })(root);
  return all ? out : out[0] || null;
}
class FakeEl {
  constructor(tag) {
    this.tagName = (tag || 'div').toUpperCase(); this.children = []; this.parent = null;
    this._classes = new Set(); this.style = {}; this.dataset = {}; this._html = '';
    this.disabled = false; this.onclick = null; this._id = ''; this.value = '';
  }
  get classList() { const s = this._classes; return { add: (...c) => c.forEach((x) => s.add(x)), remove: (...c) => c.forEach((x) => s.delete(x)), toggle: (c, f) => { if (f === undefined) f = !s.has(c); if (f) s.add(c); else s.delete(c); return f; }, contains: (c) => s.has(c) }; }
  set className(v) { this._classes = new Set(String(v).split(/\s+/).filter(Boolean)); }
  get className() { return [...this._classes].join(' '); }
  set id(v) { this._id = v; if (v) idRegistry.set(v, this); }
  get id() { return this._id; }
  set innerHTML(v) { this._html = String(v); this.children.length = 0; parseButtons(this, this._html); }
  get innerHTML() { return this._html; }
  appendChild(ch) { ch.parent = this; this.children.push(ch); return ch; }
  remove() { if (this.parent) { const i = this.parent.children.indexOf(this); if (i >= 0) this.parent.children.splice(i, 1); this.parent = null; } }
  addEventListener() {}
  focus() {}
  querySelector(sel) { return queryWithin(this, sel, false); }
  querySelectorAll(sel) { return queryWithin(this, sel, true); }
}
class FakeCanvas extends FakeEl {
  constructor() { super('canvas'); this.width = 300; this.height = 150; this._ctx = null; }
  getContext(kind) { if (kind === '2d') return this._ctx || (this._ctx = new FakeCtx()); return null; } // sin WebGL: hasGL=false, como un navegador sin soporte
  toDataURL() { return 'data:image/png;base64,FAKE'; }
}
selectorCache.set('#cv', new FakeCanvas()); // los dos canvas del index.html
selectorCache.set('#gl', new FakeCanvas());
const documentFake = {
  createElement(tag) { return tag === 'canvas' ? new FakeCanvas() : new FakeEl(tag); },
  querySelector(sel) {
    if (/^#[\w-]+$/.test(sel) && idRegistry.has(sel.slice(1))) return idRegistry.get(sel.slice(1));
    if (!selectorCache.has(sel)) selectorCache.set(sel, new FakeEl('div'));
    return selectorCache.get(sel);
  },
  querySelectorAll() { return []; },
  body: new FakeEl('body'),
};

// ---------- Sandbox y carga de scripts reales ----------
const sandbox = {
  console, performance, setTimeout, clearTimeout, setInterval, clearInterval,
  document: documentFake,
  ImageData: class { constructor(data, w, h) { this.data = data; this.width = w; this.height = h; } },
  location: { search: '', pathname: '/index.html', href: '' },
  requestAnimationFrame: () => {},
  addEventListener: (t, f) => { (handlers[t] = handlers[t] || []).push(f); },
};
sandbox.window = sandbox; sandbox.globalThis = sandbox;
vm.createContext(sandbox);
const load = (file, patch) => {
  let code = fs.readFileSync(path.join(SRC, file), 'utf8');
  if (patch) code = patch(code);
  vm.runInContext(code, sandbox, { filename: file });
};
load('defined-sheets.js');
load('sprites.js');
load('data.js');
load('gl3d.js');
load('world.js');
load('scenes.js');
// game.js no exporta MG; la inyección es SOLO para la prueba (el archivo
// real no cambia): se añade MG a lo que G.debug ya expone.
load('game.js', (code) => {
  const from = 'G.debug = { S, apply, runEvent, tick, actArrival, actCollect };';
  if (!code.includes(from)) throw new Error('no se encontró G.debug en game.js');
  return code.replace(from, 'G.debug = { S, apply, runEvent, tick, actArrival, actCollect, MG, selectChar, pickCharScreen };');
});

const G = sandbox.G, Sc = G.Scenes, W = G.World;
const S = G.debug.S, MG = G.debug.MG;

// los timers del chat (G.wait/G.until) corren en el bucle del juego, que
// aquí no gira: se sustituyen por promesas inmediatas tras la carga
G.wait = () => Promise.resolve();
G.until = () => Promise.resolve();

let failures = 0, checks = 0;
function check(name, cond, extra) { checks++; if (cond) console.log('  ✔ ' + name); else { failures++; console.log('  ✘ ' + name + (extra ? '  [' + extra + ']' : '')); } }
const key = (code, down) => (handlers[down ? 'keydown' : 'keyup'] || []).forEach((h) => h({ code, target: { tagName: 'BODY' }, preventDefault() {} }));
const tap = (code) => { key(code, true); key(code, false); };
const tick = () => new Promise((r) => setImmediate(r));

(async () => {
  await tick(); await tick(); // deja asentarse main() (sin WebGL se detiene en el aviso)

  // ================= A) DecoDuel: zonas por ronda según inventario =========
  console.log('\nA) Decoración Express — zonas por ronda según lo recolectado');
  const scenarios = [
    ['sin nada (práctica desde el título)', {}],
    ['solo globos', { globos: true }],
    ['globos + luces', { globos: true, luces: true }],
    ['las 3 decoraciones', { globos: true, guirnalda: true, luces: true }],
  ];
  for (const [name, inv] of scenarios) {
    S.inv = { ...inv }; S.flags = {};
    MG.deco.setup();
    const duel = new Sc.DecoDuel('natalia', () => {});
    const sizes = duel.chunks.map((c) => c.length);
    console.log(`  · ${name}: zonas=${S.deco.length}, ítems por ronda=[${sizes.join(', ')}]`);
    check(`${name}: el set tiene las 6 zonas`, S.deco.length === 6, 'zonas=' + S.deco.length);
    check(`${name}: TODAS las rondas tienen varios ítems (≥2)`, sizes.every((n) => n >= 2), sizes.join(','));
    check(`${name}: zonas únicas y válidas`, new Set(S.deco.map((d) => d.i)).size === 6 && S.deco.every((d) => W.DECO_SPOTS[d.i]));
  }
  // y sin pasar por setup() (construcción directa): la red de seguridad
  S.inv = {}; S.deco = [{ i: 0, improv: true, placed: false }];
  const bare = new Sc.DecoDuel('alan', () => {});
  check('sin setup previo: el duelo reconstruye las 6 zonas', S.deco.length === 6 && bare.chunks.every((c) => c.length >= 2), 'zonas=' + S.deco.length);

  // ================= B) DecoDuel: colocación atómica =======================
  console.log('\nB) Decoración Express — colocación atómica');
  S.inv = { globos: true, guirnalda: true, luces: true, herramientas: true }; S.flags = {};
  MG.deco.setup();
  const duel = new Sc.DecoDuel('natalia', () => {});
  duel.st = 'play'; duel.time = 1e9;
  const dt = 0.016;
  const hang = (d, good) => {
    const s = W.DECO_SPOTS[d.i]; duel.p.x = s.x; duel.p.y = s.y;
    tap('Space'); duel.update(dt);
    if (!duel.q) return false;
    duel.update(dt); // el QTE calcula su posición
    duel.q.c = good ? duel.q.pos : (duel.q.pos + 0.5) % 1; // apuntar al verde / fallar a propósito
    tap('Space'); duel.update(dt);
    return true;
  };
  const d0 = duel.cur[0], d1 = duel.cur[1];
  check('ESPACIO junto a la zona abre el QTE', hang(d0, true) !== false && true);
  check('acierto en verde: el ítem QUEDA colocado', d0.placed === true);
  check('tras colocar, el QTE se cierra (nada queda a medias)', duel.q === null);
  hang(d1, false);
  check('fallo de timing: el ítem NO se consume (sigue sin colocar)', d1.placed === false && duel.q === null);
  duel.p.x = 655; duel.p.y = 282; tap('Space'); duel.update(dt);
  check('ESPACIO lejos de las zonas no abre QTE ni consume nada', duel.q === null && duel.cur.filter((d) => d.placed).length === 1);
  duel.cs = 'wait'; duel.ct = 0.01;
  let knocked = false;
  for (let i = 0; i < 500 && !knocked; i++) { duel.update(0.05); knocked = !d0.placed && duel.knocks >= 1; }
  check('Pollito puede tirar lo colgado (la rivalidad sigue viva)', knocked);
  hang(d0, true);
  check('lo tirado se puede volver a colgar', d0.placed === true);

  // ================= C) Apagón: práctica directa ===========================
  console.log('\nC) Apagón: ¿fantasma o disfraz? — práctica');
  if (!Sc.BlackoutGame) { check('existe la escena BlackoutGame', false); }
  else {
    const drive = (scene, strategy) => {
      let it = 0;
      while (!scene.doneFired && it++ < 8000) {
        scene.update(0.05);
        if (scene.st === 'observe') { const k = strategy(scene); if (k) scene.answer(k); }
      }
      return scene.result;
    };
    const mk = () => new Sc.BlackoutGame('natalia', () => {});
    const probe = mk();
    const kinds = probe.lineup.map((f) => f.kind);
    check('lineup: 10 apariciones (4 fantasmas, 4 disfraces, 2 especiales)',
      probe.lineup.length === 10 && kinds.filter((k) => k === 'ghost').length === 4 && kinds.filter((k) => k === 'person').length === 4 && kinds.filter((k) => k === 'ximena' || k === 'pollito').length === 2, kinds.join(','));
    check('los especiales no salen en la fase 1 (rondas 1–3)', kinds.slice(0, 3).every((k) => k === 'ghost' || k === 'person'), kinds.join(','));

    let lineupOk = true;
    for (let i = 0; i < 200 && lineupOk; i++) {
      const ks = mk().lineup.map((f) => f.kind);
      lineupOk = ks.length === 10 && ks.filter((k) => k === 'ghost').length === 4 && ks.filter((k) => k === 'person').length === 4
        && ks.slice(0, 3).every((k) => k === 'ghost' || k === 'person')
        && ks.findIndex((k) => k === 'ximena') >= 3 && ks.findIndex((k) => k === 'pollito') >= 4;
    }
    check('200 alineaciones aleatorias: composición y especiales siempre válidos', lineupOk);

    const perfect = drive(mk(), (sc) => sc.fig.answerKey);
    check('partida perfecta: vuelve la luz (blackoutFixed)', perfect && perfect.blackoutFixed === true);
    check('partida perfecta: resultado "win" (victoria perfecta)', perfect && perfect.win === 'win', perfect && perfect.win);
    check('partida perfecta: salidas del diseño completas',
      perfect && perfect.ghostsConfirmed === 4 && perfect.fakeGhostsFound === 4 && perfect.pollitoEvent === true && perfect.sleepwalkerFound === true && perfect.decoDamage === 0 && perfect.errors === 0 && typeof perfect.score === 'number' && typeof perfect.awakeRisk === 'number',
      perfect && JSON.stringify(perfect));
    check('partida perfecta: el riesgo de despertar no sube (awakeRisk ≤ 0)', perfect && perfect.awakeRisk <= 0, perfect && 'awakeRisk=' + perfect.awakeRisk);

    const wrong = drive(mk(), (sc) => (sc.fig.answerKey === 'ghost' ? 'person' : 'ghost'));
    check('todo mal: NO hay game over, pero la luz no se repara (lose, fixed=false)', wrong && wrong.win === 'lose' && wrong.blackoutFixed === false, wrong && wrong.win);
    check('todo mal: reparación 0 y riesgo de despertar alto (awakeRisk ≥ 1)', wrong && wrong.repair === 0 && wrong.awakeRisk >= 1, wrong && `repair=${wrong.repair} risk=${wrong.awakeRisk}`);

    const mixed = drive(mk(), (sc) => (sc.round % 2 === 0 ? sc.fig.answerKey : sc.fig.answerKey === 'ghost' ? 'person' : 'ghost'));
    check('partida mixta: termina con resultado válido y score > 0', mixed && ['win', 'tie', 'lose'].includes(mixed.win) && mixed.score > 0, mixed && mixed.win);

    const ev = G.EVENTS.apagon;
    check("el evento 'apagon' ahora es un minijuego (game: 'apagon')", ev && ev.type === 'minigame' && ev.game === 'apagon');
    check('MG.apagon registrado con su escena', !!MG.apagon && MG.apagon.Scene() === Sc.BlackoutGame);
  }

  // ================= D) Apagón en la historia ==============================
  console.log('\nD) Apagón — flujo completo en la historia (runEvent)');
  if (Sc.BlackoutGame) {
    Object.assign(S, { player: 'natalia', phase: 'act2', inv: {}, flags: {}, sus: 5, sleep: 1, noise: 0, qBonus: 0, duels: [], done: {}, tired: null });
    G.home = new Sc.HomeScene();
    let settled = false;
    const p = G.debug.runEvent('apagon').then(() => { settled = true; }, (e) => { settled = true; console.log('  (error en runEvent: ' + e.message + ')'); });
    let it = 0;
    while (!settled && it++ < 4000) {
      await tick();
      const actions = documentFake.querySelector('#actions');
      const card = actions && queryWithin(actions, '.card', true).find((b) => b.onclick && !b.disabled);
      if (card) card.onclick();
      const mok = idRegistry.get('mok');
      if (mok && mok.onclick) { const f = mok.onclick; mok.onclick = null; f(); }
      const sc = G.scene;
      if (sc && sc.isBlackout) { sc.update(0.05); if (sc.st === 'observe') sc.answer(sc.fig.answerKey); }
    }
    await p;
    check('runEvent(apagon) se completa', settled && it < 4000, 'iteraciones=' + it);
    check('el duelo quedó registrado en S.duels', S.duels.some((d) => d.game === 'apagon'), JSON.stringify(S.duels));
    check('flags.apagon guardadas con el mapeo del diseño', !!S.flags.apagon && S.flags.apagon.fixed === true && S.flags.apagon.ghosts === 4 && S.flags.apagon.fakes === 4 && S.flags.apagon.sleepwalker === true, JSON.stringify(S.flags.apagon));
    check('fantasmas confirmados → ruta paranormal abierta', S.flags.rutaParanormal === true);
    check('la calidad de la fiesta recibió el bonus de victoria', S.qBonus > 0, 'qBonus=' + S.qBonus);
  }

  // ================= E) Dibujo: caminos de draw() sin excepciones ==========
  console.log('\nE) Dibujo — draw() de Apagón (todas las figuras) y de DecoDuel');
  if (Sc.BlackoutGame) {
    const realRender = W.render, realProject = G.R.project;
    const ctx2d = new FakeCtx();
    W.render = (opts) => { if (opts.boxes) opts.boxes(new G.R.MB(), 0); if (opts.sprites) opts.sprites(0); if (opts.over) opts.over(ctx2d, 0); }; // R.dyn no existe sin WebGL: se pasa una MB vacía
    G.R.project = () => ({ x: 320, y: 180, ok: true });
    try {
      const sc = new Sc.BlackoutGame('natalia', () => {});
      sc.draw(0.016); // intro
      const cases = [
        [{ kind: 'ghost' }, 'ghost'],
        [{ kind: 'person', charId: 'jose' }, 'persona disfrazada (José)'],
        [{ kind: 'person', charId: 'natalia' }, 'persona disfrazada (Natalia)'],
        [{ kind: 'ximena' }, 'Ximena sonámbula'],
        [{ kind: 'pollito' }, 'Pollito con sábana'],
      ];
      for (const [figDef, label] of cases) {
        sc.lineup = [figDef, ...sc.lineup.slice(1)];
        sc.startRound(0); sc.st = 'observe'; sc.obsT = 2; sc.specReady = true;
        sc.fig.clues.forEach((cl) => { cl.fired = true; if (cl.type === 'drop') { sc.fig.dropped = true; sc.fig.dropItem = 'control'; } if (cl.type === 'phase') sc.fig.phaseT = 0.5; });
        sc.draw(0.016); // observación con pistas activas
        sc.answer(sc.fig.answerKey); sc.draw(0.016); // reveal
        check('draw sin errores: ' + label, true);
      }
      sc.repair = 100; sc.finish(); sc.draw(0.016); // resumen final
      check('draw sin errores: resumen del apagón', true);
      const dd = new Sc.DecoDuel('natalia', () => {});
      dd.st = 'play'; G.S.deco[0].placed = true; dd.draw(0.016); // incluye la marca ✓ de zona colocada
      check('draw sin errores: DecoDuel con una zona colocada', true);
    } catch (e) {
      check('draw sin errores (excepción: ' + e.message + ')', false, e.stack && e.stack.split('\n')[1]);
    } finally { W.render = realRender; G.R.project = realProject; }
  }

  // ================= F) Repisas: escalada infinita ========================
  console.log('\nF) Salto de repisas — escalada infinita');
  if (!Sc.ClimbDuel) { check('existe la escena ClimbDuel', false); }
  else {
    const gen1 = new Sc.ClimbDuel('natalia', () => {}), gen2 = new Sc.ClimbDuel('alan', () => {});
    const sideAt = (k) => gen1.sideOf(k), SHF = Sc.ClimbDuel.SHELF_H;
    // F1) generación procedural: determinista entre instancias, sin fin, sin rachas de 4
    let genOk = true, runLen = 1, prevSide = 0;
    for (let k = 0; k <= 20000 && genOk; k++) {
      const s = sideAt(k);
      if (s !== -1 && s !== 1) genOk = false;
      runLen = s === prevSide ? runLen + 1 : 1; prevSide = s;
      if (runLen > 3) genOk = false; // nunca 4 seguidas del mismo lado
    }
    for (const k of [0, 1, 2, 3, 10, 999, 20000]) if (gen2.sideOf(k) !== sideAt(k)) genOk = false; // otra instancia, misma secuencia
    check('generación: lados válidos y deterministas hasta k=20000, sin rachas de 4', genOk);
    const probe = new Sc.ClimbDuel('natalia', () => {});
    let shelfOk = true;
    for (const i of [1, 2, 3, 50, 1000, 100000]) {
      const q = probe.shelfAt(-70, i);
      if (q.e !== i * SHF || Math.abs(q.x + 70) !== 28) shelfOk = false;
    }
    check('generación: la repisa i existe a i·27 u para cualquier i (hasta 100 000)', shelfOk);

    // F2) set activo acotado: dibujar a 300 u o a 135 000 u cuesta lo mismo
    {
      const realRender = W.render, realProject = G.R.project;
      const ctx2d = new FakeCtx();
      let verts = 0;
      W.render = (opts) => { if (opts.boxes) { const mb = new G.R.MB(); opts.boxes(mb); verts = mb.a.length; } if (opts.sprites) opts.sprites(0); if (opts.over) opts.over(ctx2d, 0); };
      G.R.project = () => ({ x: 320, y: 180, ok: true });
      try {
        const d = new Sc.ClimbDuel('natalia', () => {});
        d.cam.y = 300; d.draw(0.016); const vLow = verts;
        d.cam.y = 135000; d.draw(0.016); const vHigh = verts; // 5000 repisas arriba: espacio profundo
        console.log(`  · vértices dibujados: a 300 u = ${vLow}, a 135 000 u = ${vHigh}`);
        check('el set dibujado NO crece con la altura (reciclaje por banda visible)', vHigh < vLow * 1.6 && vHigh < 90000, `bajo=${vLow} alto=${vHigh}`);
        d.st = 'play'; d.time = 42; d.draw(0.016);
        check('draw sin errores: HUD de escalada en juego', true);
        d.st = 'over'; d.result = { win: 'win' }; d.draw(0.016);
        check('draw sin errores: panel final con alturas', true);
      } catch (e) {
        check('draw sin errores en ClimbDuel (excepción: ' + e.message + ')', false, e.stack && e.stack.split('\n')[1]);
      } finally { W.render = realRender; G.R.project = realProject; }
    }

    // F3) caes una repisa al fallar, pero la altura MÁXIMA no se pierde
    {
      const d = new Sc.ClimbDuel('natalia', () => {});
      d.st = 'play'; d.time = 1e9; d.cstep = 1e9; d.ct = 1e9; // Pollito congelado
      const press = (dir) => { tap(dir < 0 ? 'ArrowLeft' : 'ArrowRight'); d.update(0.05); };
      for (let i = 0; i < 5; i++) press(sideAt(d.pi));
      const upOk = d.pi === 5 && d.pMax === 5;
      press(-sideAt(d.pi)); // tecla equivocada a propósito
      check('subir 5 y fallar: caes a la anterior (pi=4) y la máxima queda (pMax=5)', upOk && d.pi === 4 && d.pMax === 5, `pi=${d.pi} pMax=${d.pMax}`);
    }

    // F4) el resultado lo decide la ALTURA MÁXIMA al agotarse el tiempo
    const driveClimb = (setupFn, pressOk) => {
      let result = null;
      const d = new Sc.ClimbDuel('natalia', (r) => { result = r; });
      if (setupFn) setupFn(d);
      let it = 0;
      while (!result && it++ < 6000) {
        if (pressOk && d.st === 'play') tap(sideAt(d.pi) < 0 ? 'ArrowLeft' : 'ArrowRight');
        d.update(0.05);
      }
      return { d, result };
    };
    const winRun = driveClimb((d) => { d.cstep = 1e9; d.ct = 1e9; }, true);
    check('victoria: jugador escalando sin parar le gana a Pollito quieto', winRun.result && winRun.result.win === 'win', winRun.result && winRun.result.win);
    // la ventana de lados se poda por debajo del escalador más bajo y de
    // la cámara: NO depende de la altura absoluta, sino de la distancia
    // entre ambos (con Pollito congelado en el 0, como en la victoria de
    // arriba, la ventana cubre legítimamente todo el trayecto hasta él)
    {
      let result = null;
      const d = new Sc.ClimbDuel('natalia', (r) => { result = r; });
      let it = 0;
      while (!result && it++ < 6000) { if (d.st === 'play' && it % 4 === 0) tap(sideAt(d.pi) < 0 ? 'ArrowLeft' : 'ArrowRight'); d.update(0.05); }
      check('ventana de lados acotada con ambos escalando (se poda desde abajo)', d.pMax > 200 && d._sb > 50 && d._sv.length < 300, `pMax=${d.pMax} base=${d._sb} ventana=${d._sv.length}`);
    }
    check('victoria: extra() trae las alturas y el jugador llegó AL ESPACIO (>200 m, zonas 0→4)', winRun.result && winRun.result.pMeters > winRun.result.cMeters && winRun.result.pMeters > 200 && winRun.d.zoneSeen === 4,
      winRun.result && `p=${winRun.result.pMeters} m c=${winRun.result.cMeters} m zona=${winRun.d.zoneSeen}`);
    const loseRun = driveClimb((d) => { d.cstep = 0.05; d.ct = 0.01; }, false);
    check('derrota: Pollito escalando sin parar gana por altura', loseRun.result && loseRun.result.win === 'lose' && loseRun.result.cMeters > loseRun.result.pMeters, loseRun.result && loseRun.result.win);
    const tieRun = driveClimb((d) => { d.cstep = 1e9; d.ct = 1e9; }, false);
    check('empate: nadie se mueve, misma altura máxima (0 m)', tieRun.result && tieRun.result.win === 'tie' && tieRun.result.pMeters === 0 && tieRun.result.cMeters === 0, tieRun.result && tieRun.result.win);
  }

  // ================= G) Party: roster, partners y huida ===================
  console.log('\nG) Party — protagonista entre los 7, partners reclutables y huida');
  check('roster: los 7 roomies son elegibles, todos con stats/rol/habilidad/defecto',
    G.PLAYABLE.length === 7 && G.PLAYABLE.every((id) => { const c = G.CHARS[id]; return c.stats && c.role && c.skill && c.defect && c.playable; }), G.PLAYABLE.join(','));
  check('ni Ximena (duerme) ni José (villano) son elegibles', !G.PLAYABLE.includes('ximena') && !G.PLAYABLE.includes('jose'));
  check('metadata: los 7 roomies exponen carried y carrywalk_down/up/right',
    G.PLAYABLE.every((id) => { const m = G.Sprites.META.chars[id]; return ['carried', 'carrywalk_down', 'carrywalk_up', 'carrywalk_right'].every((a) => m.anims[a] && m.anims[a].length >= 1); }));

  // --- Recolección: cargar, convivir con ítems, bajar y reclutar ---
  Object.assign(S, { inv: {}, flags: {}, partners: [], party: [], fled: [] });
  let collectRes = null;
  const csc = new Sc.CollectScene('natalia', (r) => { collectRes = r; });
  csc.count = 0; // sin cuenta regresiva: directo al minuto
  const cstep = () => csc.update(0.016);
  const goNear = (o) => { csc.p.x = o.x; csc.p.y = o.y; };
  check('en el departamento están los otros 6 roomies como NPC libres', csc.others.length === 6 && csc.others.every((o) => o.state === 'free'), 'npcs=' + csc.others.length);
  const npcA = csc.others[0];
  goNear(npcA); tap('Space'); cstep();
  check('ESPACIO junto a un roomie lo carga al hombro (carried + carryWalk)', csc.carrying === npcA && npcA.state === 'carried' && npcA.carriedPose === true && csc.p.carryWalk === true);
  const it0 = csc.items[0];
  csc.p.x = it0.x; csc.p.y = it0.y; tap('Space'); cstep();
  check('cargando un roomie, las manos siguen libres: se puede recoger un ítem', csc.p.carry.includes(it0.id) && csc.carrying === npcA, 'manos=' + csc.p.carry.join(','));
  csc.p.x = W.STASH.x; csc.p.y = W.STASH.y; tap('Space'); cstep();
  check('en el armario, ESPACIO recluta al partner (queda waiting, partner +1)', csc.carrying === null && csc.partners.includes(npcA.id) && npcA.state === 'waiting' && csc.p.carryWalk === false);
  tap('Space'); cstep();
  check('otro ESPACIO en el armario guarda los ítems de las manos (convivencia)', csc.p.carry.length === 0 && S.inv[it0.id] === true);
  const npcB = csc.others.find((o) => o.state === 'free');
  goNear(npcB); tap('Space'); cstep();
  const wasCarrying = csc.carrying === npcB;
  csc.p.x = 200; csc.p.y = 150; tap('Space'); cstep();
  check('bajarlo fuera del armario NO lo recluta: vuelve a free donde quedó', wasCarrying && csc.carrying === null && npcB.state === 'free' && !csc.partners.includes(npcB.id));
  for (const o of csc.others.filter((x) => x.state === 'free')) {
    if (csc.partners.length >= 3) break;
    goNear(o); tap('Space'); cstep();
    if (csc.carrying !== o) break;
    csc.p.x = W.STASH.x; csc.p.y = W.STASH.y; tap('Space'); cstep();
  }
  // --- Anclaje del pasajero: descansa sobre las MANOS del portador ---
  check('metadata: todo roomie registra el apoyo de manos por frame carrywalk',
    G.PLAYABLE.every((id) => { const m = G.Sprites.META.chars[id]; return ['carrywalk_down', 'carrywalk_up', 'carrywalk_right'].every((a) => Array.isArray((m.hands || {})[a]) && m.hands[a].length === m.anims[a].length && m.hands[a].every((v) => v >= 140 && v <= 220)); }));
  check('Sp.carryHands devuelve alturas de mundo plausibles (55–75 u; no el elev fijo 46 de antes)',
    G.PLAYABLE.every((id) => ['carrywalk_down', 'carrywalk_up', 'carrywalk_right'].every((a) => { const v = G.Sprites.carryHands(id, a, 0); return v >= 55 && v <= 75; })));
  check('metadata: todo roomie registra carriedRest (hundimiento del torso carried, 0–18 u)',
    G.PLAYABLE.every((id) => { const v = G.Sprites.carriedRest(id); return v >= 0 && v <= 18; }));
  {
    const asc = new Sc.CollectScene('saulo', () => {});
    asc.count = 0;
    const an = asc.others[0];
    asc.p.x = an.x; asc.p.y = an.y; tap('Space'); asc.update(0.016);
    check('al cargar, el pasajero nace ya a la altura de las manos (sin viaje desde el suelo)', asc.carrying === an && an.elev > 55, 'elev=' + an.elev.toFixed(1));
    asc.p._cw = { anim: 'carrywalk_down', idx: 0 }; // lo que draw3d registra al mostrar ese frame
    const target = asc.p.carrySupportY() - G.Sprites.carriedRest(an.id) * (G.R.stretch || 1); // la fórmula exacta de la escena
    an.elev = target - 30; an.sprV = 0; asc.update(0.016);
    check('tras una perturbación, la desviación del pasajero queda clampada (±6 u)', Math.abs(an.elev - target) <= 6.5, 'dev=' + (an.elev - target).toFixed(1));
    let maxDev = 0;
    for (let i = 0; i < 150; i++) { asc.update(0.016); maxDev = Math.max(maxDev, Math.abs(an.elev - target)); }
    check('el resorte asienta al pasajero sobre las manos (|desv| final < 2 u)', Math.abs(an.elev - target) < 2, 'elev=' + an.elev.toFixed(1) + ' target=' + target.toFixed(1));
    check('el rebote del acople queda contenido (desviación máxima < 8 u en el asentamiento)', maxDev < 8, 'maxDev=' + maxDev.toFixed(1));
  }

  check('se reclutan exactamente 3 partners', csc.partners.length === 3, 'partners=' + csc.partners.join(','));
  const npcExtra = csc.others.find((o) => o.state === 'free');
  goNear(npcExtra); tap('Space'); cstep();
  check('con 3 partners, un cuarto roomie es rechazado (mensaje, sin cargar)', csc.carrying === null && csc.partners.length === 3 && npcExtra.state === 'free');
  csc.time = 0;
  for (let i = 0; i < 90 && !collectRes; i++) cstep();
  check('el resultado de la recolección entrega los partners reclutados', !!collectRes && collectRes.partners.length === 3, collectRes && collectRes.partners.join(','));

  // --- Dibujo de la recolección con partners (caminos de draw nuevos) ---
  {
    const realRender = W.render, realProject = G.R.project;
    const ctx2d = new FakeCtx();
    W.render = (opts) => { if (opts.boxes) opts.boxes(new G.R.MB(), 0); if (opts.sprites) opts.sprites(0); if (opts.over) opts.over(ctx2d, 0); };
    G.R.project = () => ({ x: 320, y: 180, ok: true });
    try {
      const dsc = new Sc.CollectScene('alan', () => {});
      dsc.count = 0;
      const dn = dsc.others[0];
      dsc.p.x = dn.x; dsc.p.y = dn.y; tap('Space'); dsc.update(0.016);
      dsc.draw(0.016);
      check('draw sin errores: CollectScene cargando un partner al hombro', dsc.carrying === dn);
      dsc.p.x = W.STASH.x; dsc.p.y = W.STASH.y; tap('Space'); dsc.update(0.016);
      dsc.draw(0.016);
      check('draw sin errores: CollectScene con el partner reclutado esperando', dn.state === 'waiting');
    } catch (e) {
      check('draw sin errores en CollectScene (excepción: ' + e.message + ')', false, e.stack && e.stack.split('\n')[1]);
    } finally { W.render = realRender; G.R.project = realProject; }
  }

  // --- Llegada: la huida deja la escena solo con la party ---
  Object.assign(S, { player: 'natalia', partners: ['itzel', 'alan', 'saulo'], inv: {}, flags: {}, sus: 0, sleep: 1, noise: 0, qBonus: 0, duels: [], done: {}, tired: null });
  S.party = ['natalia', ...S.partners];
  S.fled = G.PLAYABLE.filter((id) => !S.party.includes(id));
  // Captura de los actores huidos: actArrival los retira de la escena al
  // terminar, pero sus objetos quedan con la fleeRoute calculada (en la
  // prueba no hay bucle de frames: la ruta es lo que se verifica).
  const fledById = {};
  const origActorFn = Sc.HomeScene.prototype.actor;
  Sc.HomeScene.prototype.actor = function (id) { const a = origActorFn.call(this, id); if (a && S.fled.includes(id)) fledById[id] = a; return a; };
  await G.debug.actArrival({ inHand: [], stashed: 0, x: 510, y: 450 });
  Sc.HomeScene.prototype.actor = origActorFn;
  check('huida: huyeron exactamente los no reclutados', S.fled.length === 3 && S.fled.every((id) => !G.home.actor(id)), 'fled=' + S.fled.join(','));
  const xiP = [G.home.xi.x, G.home.xi.y];
  const sideOf = (id) => { const r = fledById[id] && fledById[id].fleeRoute; const p = r && r.find((pt) => Math.abs(pt[1] - xiP[1]) <= 12 && Math.abs(pt[0] - xiP[0]) >= 25 && Math.abs(pt[0] - xiP[0]) <= 55); return p ? Math.sign(p[0] - xiP[0]) : 0; };
  check('huida: la ruta de cada huido pasa AL LADO de Ximena (a su misma altura, a 25–55 u de su eje)',
    S.fled.every((id) => sideOf(id) !== 0), S.fled.map((id) => id + ':' + sideOf(id)).join(','));
  check('huida: los huidos la envuelven — pasan por AMBOS lados de Ximena',
    S.fled.some((id) => sideOf(id) < 0) && S.fled.some((id) => sideOf(id) > 0), S.fled.map((id) => sideOf(id)).join(','));
  check('huida: toda ruta termina en la PUERTA PRINCIPAL (510, 706)',
    S.fled.every((id) => { const r = fledById[id] && fledById[id].fleeRoute; return r && r[r.length - 1][0] === 510 && r[r.length - 1][1] === 706; }),
    S.fled.map((id) => { const r = fledById[id] && fledById[id].fleeRoute; return r ? r[r.length - 1].join(',') : 'sin ruta'; }).join(' | '));
  check('huida: la escena queda SOLO con la party (4 actores)', G.home.roomies.length === 4 && G.home.roomies.every((r) => S.party.includes(r.id)), G.home.roomies.map((r) => r.id).join(','));

  // --- Asignaciones posteriores: solo la party ---
  let settledW = false, cardCount = -1;
  const pw = G.debug.runEvent('whatsapp').then(() => { settledW = true; }, (e) => { settledW = true; console.log('  (error en whatsapp: ' + e.message + ')'); });
  let itw = 0;
  while (!settledW && itw++ < 2000) {
    await tick();
    const actions = documentFake.querySelector('#actions');
    const cards = actions ? queryWithin(actions, '.card', true).filter((b) => b.onclick) : [];
    if (cards.length) { if (cardCount < 0) cardCount = cards.length; const b = cards.find((x) => !x.disabled); if (b) b.onclick(); }
  }
  await pw;
  check('asignación de evento: se ofrecen SOLO los 4 de la party (ningún huido)', cardCount === 4, 'tarjetas=' + cardCount);

  // ================= H) Repisas: spawn AL ATERRIZAR + iconografía propia ====
  console.log('\nH) Salto de repisas — la repisa nueva nace al aterrizar · iconografía propia');
  if (!Sc.ClimbDuel) { check('existe la escena ClimbDuel', false); }
  else {
    const d = new Sc.ClimbDuel('natalia', () => {});
    d.st = 'play'; d.time = 1e9; d.cstep = 1e9; d.ct = 1e9; // Pollito congelado: su columna no debe generar nada
    check('al inicio existen SOLO el objetivo (1) y la siguiente (2) en cada columna',
      d.shelfBorn('p', 1) && d.shelfBorn('p', 2) && !d.shelfBorn('p', 3) && d.shelfBorn('c', 2) && !d.shelfBorn('c', 3),
      `born p=${d.born.p} c=${d.born.c}`);
    const jump = () => { tap(d.sideOf(d.pi) < 0 ? 'ArrowLeft' : 'ArrowRight'); d.update(0.016); };
    jump(); // salto hacia la repisa 1: en pleno vuelo NO puede nacer la 3
    check('en pleno salto aún NO nace la repisa 3', !d.shelfBorn('p', 3), 'born=' + d.born.p);
    let fxAtLanding = null;
    for (let i = 0; i < 80 && !d.shelfBorn('p', 3); i++) { d.update(0.05); if (d.shelfBorn('p', 3)) fxAtLanding = d.spawnFx.p[3]; }
    check('al ATERRIZAR en la repisa 1 nace la 3, con su pop registrado en ese instante',
      d.shelfBorn('p', 3) && fxAtLanding != null && d.puffs !== undefined, 'born=' + d.born.p);
    check('y sigue sin existir la 4 (nada de banda lejana pre-generada)', !d.shelfBorn('p', 4));
    const bornBefore = d.born.p;
    jump(); // a la repisa 2 (nueva máxima): al aterrizar nace exactamente una más
    for (let i = 0; i < 80 && d.born.p === bornBefore; i++) d.update(0.05);
    check('al aterrizar en la 2 nace exactamente la 4 (ni una más)',
      d.born.p === bornBefore + 1 && d.shelfBorn('p', 4) && !d.shelfBorn('p', 5), 'born=' + d.born.p);
    check('la columna de Pollito NO genera repisas sin que él aterrice', d.born.c === 2, 'born.c=' + d.born.c);
    check('la cámara del duelo está ALEJADA (dist ≥ 560 y fov ≥ 36; antes 380/34)',
      d.cam.dist >= 560 && d.cam.fov >= 36, `dist=${d.cam.dist} fov=${d.cam.fov}`);
  }
  // --- Inventario de iconografía: los emoticones prohibidos no vuelven ---
  {
    const SRCROOT = path.join(__dirname, '..', 'application', 'src');
    const FORBIDDEN = ['🏆', '🤝', '😱', '🌃', '🌌', '🚀', '🌑', '🧩', '⏸', '🚪', '🎂', '💡', '🔌', '🔋', '🔦', '🪛', '⏱', '⚡', '💔', '🎀', '🐱', '✋', '⚠', '👻', '🎭', '😴'];
    const scenesTxt = fs.readFileSync(path.join(SRCROOT, 'js', 'scenes.js'), 'utf8');
    const foundScenes = FORBIDDEN.filter((e) => scenesTxt.includes(e));
    check('scenes.js: ningún emoticono prohibido en escenas/HUD de duelos', foundScenes.length === 0, foundScenes.join(' '));
    // en game.js solo se toleran dentro de líneas del CHAT/teléfono (posts, ui.system, cabecera del grupo)
    const chatLine = /(who:|postAll|posts\.push|ui\.system|ui\.post\(|group)/;
    const badLines = fs.readFileSync(path.join(SRCROOT, 'js', 'game.js'), 'utf8').split('\n')
      .filter((l) => !chatLine.test(l) && FORBIDDEN.some((e) => l.includes(e)));
    check('game.js: ningún emoticono prohibido fuera del chat/teléfono', badLines.length === 0, badLines.join(' | ').slice(0, 140));
    const htmlTxt = fs.readFileSync(path.join(SRCROOT, 'index.html'), 'utf8');
    check('index.html: el HUD va sin emoticones (marca y botón de pausa)', !['🎂', '⏸', '🧩'].some((e) => htmlTxt.includes(e)));
    const ICONS = ['trofeo', 'derrota', 'empate', 'alerta', 'techo', 'ciudad', 'luna', 'planeta', 'pastel'];
    check('el set de íconos propios existe completo en assets/icons/',
      ICONS.every((n) => fs.existsSync(path.join(SRCROOT, 'assets', 'icons', n + '.png'))), ICONS.join(','));
    const worldTxt = fs.readFileSync(path.join(SRCROOT, 'js', 'world.js'), 'utf8');
    check('el motor dibuja los íconos con G.icon (world) y las escenas lo usan',
      worldTxt.includes('G.icon =') && scenesTxt.includes('G.icon(c,'));
  }

  // ================= I) Selección sin scrollbars: carrusel ================
  console.log('\nI) Selección de personaje — carrusel con botones, sin barras de scroll');
  {
    const overlayEl = documentFake.querySelector('#overlay');
    // --- Pantalla principal: protagonista entre los 7 ---
    let pickedId = null;
    const pSel = G.debug.selectChar().then((id) => { pickedId = id; });
    await tick(); await tick();
    const modalSel = overlayEl.children[0];
    const cardsSel = modalSel ? queryWithin(modalSel, '.pcard', true) : [];
    check('selección: el carrusel contiene las 7 tarjetas (una por roomie)', cardsSel.length === 7, 'cards=' + cardsSel.length);
    check('selección: el modal va SIN scroll (clase noscroll = overflow oculto)', !!modalSel && modalSel._classes.has('noscroll'));
    const trackSel = modalSel && queryWithin(modalSel, '.ctrack', false);
    const navSel = modalSel ? queryWithin(modalSel, '.cnav', true) : [];
    const nextSel = navSel.find((b) => b._classes.has('next'));
    check('selección: hay botones de navegación a ambos lados (‹ ›)', navSel.length === 2 && !!nextSel);
    check('selección: hay un punto de posición por parada (7 − 3 visibles + 1 = 5)',
      !!modalSel && queryWithin(modalSel, '.cdot', true).length === 5, modalSel && queryWithin(modalSel, '.cdot', true).length);
    nextSel.onclick(); nextSel.onclick();
    check('selección: el botón › desplaza la vista 2 posiciones (−520 px)', !!trackSel && trackSel.style.transform === 'translateX(-520px)', trackSel && trackSel.style.transform);
    key('ArrowRight', true); key('ArrowRight', false);
    check('selección: la flecha → del teclado también navega (3 posiciones)', !!trackSel && trackSel.style.transform === 'translateX(-780px)', trackSel && trackSel.style.transform);
    nextSel.onclick(); nextSel.onclick(); nextSel.onclick();
    check('selección: la vista se detiene en la última parada (máx. 4: se ven los 3 últimos)', !!trackSel && trackSel.style.transform === 'translateX(-1040px)', trackSel && trackSel.style.transform);
    const lastCard = cardsSel.find((b) => b.dataset.id === G.PLAYABLE[6]);
    lastCard.onclick(); await pSel;
    check('selección: navegando se alcanza y se elige al 7.º roomie', pickedId === G.PLAYABLE[6], 'picked=' + pickedId);

    // --- Selector de práctica: el mismo carrusel ---
    let pickRes = 'pendiente';
    const pPick = G.debug.pickCharScreen(G.EVENTS.decoracion).then((v) => { pickRes = v; });
    await tick(); await tick();
    const modalPick = overlayEl.children[0];
    const cardsPick = modalPick ? queryWithin(modalPick, '.pcard', true) : [];
    check('práctica: su selector usa el mismo carrusel sin scroll (7 tarjetas)', cardsPick.length === 7 && !!modalPick && modalPick._classes.has('noscroll'), 'cards=' + cardsPick.length);
    const nextPick = modalPick && queryWithin(modalPick, '.cnav', true).find((b) => b._classes.has('next'));
    nextPick.onclick();
    cardsPick[0].onclick(); await pPick;
    check('práctica: navegar con › y tocar una tarjeta elige al personaje', pickRes === G.PLAYABLE[0], 'res=' + pickRes);
    let backRes = 'pendiente';
    const pBack = G.debug.pickCharScreen(G.EVENTS.decoracion).then((v) => { backRes = v; });
    await tick(); await tick();
    const backBtn = overlayEl.children[0] && queryWithin(overlayEl.children[0], '.big', true)[0];
    backBtn.onclick(); await pBack;
    check('práctica: el botón Volver del carrusel resuelve null (vuelve a la lista)', backRes === null, 'res=' + backRes);
    G.menuOpen = false;
  }

  // ================= J) Spawns seguros: nadie nace dentro de un mueble =====
  console.log('\nJ) Spawns — ningún actor de duelo nace dentro de un mueble (bug Atrapa a Pollito)');
  {
    // la defensa en sí: nearestFree no toca un punto libre y rescata uno atrapado
    check('nearestFree: un punto libre queda intacto', JSON.stringify(W.nearestFree(420, 200, 'sala')) === '[420,200]');
    const rescued = W.nearestFree(900, 240, 'sala'); // el spawn original del bug: dentro de la mesa de fiesta (ptable)
    check('nearestFree: rescata (900, 240), que caía dentro de la mesa de fiesta, al piso libre cercano',
      W.canStand(rescued[0], rescued[1], 'sala') && Math.hypot(rescued[0] - 900, rescued[1] - 240) <= 60, rescued.join(','));

    // Atrapa a Pollito: spawns de TODAS las rondas (jugador y Pollito)
    S.inv = {}; S.flags = {};
    const chase = new Sc.ChaseDuel('natalia', () => {});
    for (let n = 0; n < 3; n++) {
      chase.setup(n);
      check(`ronda ${n + 1}: el jugador nace en piso libre (no sobre la mesa)`, W.canStand(chase.p.x, chase.p.y, 'sala'), `${chase.p.x},${chase.p.y}`);
      check(`ronda ${n + 1}: Pollito nace en piso libre`, W.canStand(chase.cat.x, chase.cat.y, 'sala'), `${chase.cat.x},${chase.cat.y}`);
    }
    // y desde el spawn de la ronda 2 (el del bug) se puede salir en las 4 direcciones
    const dirs = [['ArrowRight', 'x', 1], ['ArrowLeft', 'x', -1], ['ArrowDown', 'y', 1], ['ArrowUp', 'y', -1]];
    for (const [code, axis, sign] of dirs) {
      chase.setup(1); chase.st = 'play'; chase.time = 1e9;
      const before = chase.p[axis];
      key(code, true);
      for (let i = 0; i < 10; i++) chase.update(0.05);
      key(code, false);
      const moved = (chase.p[axis] - before) * sign;
      check(`desde el spawn de la ronda 2 se puede mover hacia ${code.replace('Arrow', '').toLowerCase()} (no está atrapado)`, moved > 8, `desplazamiento=${moved.toFixed(1)}`);
    }

    // los demás duelos que comparten el sistema de salas/muebles
    const decoJ = new Sc.DecoDuel('natalia', () => {});
    check('Decoración Express: jugador y Pollito nacen en piso libre',
      W.canStand(decoJ.p.x, decoJ.p.y, 'sala') && W.canStand(decoJ.cat.x, decoJ.cat.y, 'sala'), `${decoJ.p.x},${decoJ.p.y} / ${decoJ.cat.x},${decoJ.cat.y}`);
    const sleepJ = new Sc.SleepwalkDuel('natalia', () => {});
    check('Sonámbula: jugador, José y Ximena nacen en piso libre',
      W.canStand(sleepJ.p.x, sleepJ.p.y, 'sala') && W.canStand(sleepJ.jose.x, sleepJ.jose.y, 'sala') && W.canStand(sleepJ.xi.x, sleepJ.xi.y, 'sala'),
      `${sleepJ.p.x},${sleepJ.p.y} / ${sleepJ.jose.x},${sleepJ.jose.y} / ${sleepJ.xi.x},${sleepJ.xi.y}`);
    const memJ = new Sc.MemoryDuel('natalia', () => {});
    check('Memoria de cajas: jugador y José nacen en piso libre (José ya no nace dentro de la mesa)',
      W.canStand(memJ.p.x, memJ.p.y, 'sala') && W.canStand(memJ.jose.x, memJ.jose.y, 'sala'), `${memJ.p.x},${memJ.p.y} / ${memJ.jose.x},${memJ.jose.y}`);
    const spikeJ = new Sc.SpikeDuel('natalia', () => {});
    spikeJ.setup(0);
    check('Cactus rodantes: el jugador nace en piso libre de la cocina', W.canStand(spikeJ.p.x, spikeJ.p.y, 'cocina'), `${spikeJ.p.x},${spikeJ.p.y}`);
  }

  // ================= K) Repisas en el espacio: galaxias y el cohete de los huidos =====
  console.log('\nK) Salto de repisas — galaxias en el espacio y el cohete de los roomies no elegidos');
  if (!Sc.ClimbDuel || !Sc.ClimbDuel.galaxiesAt) { check('existe ClimbDuel.galaxiesAt', false); }
  else {
    // --- Galaxias: solo en el espacio, con densidad creciente ---
    check('galaxias: bajo el espacio (cámara a 300 u y a 4400 u) NO hay ninguna',
      Sc.ClimbDuel.galaxiesAt(300).length === 0 && Sc.ClimbDuel.galaxiesAt(4400).length === 0,
      `300u=${Sc.ClimbDuel.galaxiesAt(300).length} 4400u=${Sc.ClimbDuel.galaxiesAt(4400).length}`);
    const gSpace = Sc.ClimbDuel.galaxiesAt(5600), gDeep = Sc.ClimbDuel.galaxiesAt(30000);
    check('galaxias: en el espacio (5600 u) hay galaxias visibles, todas sobre el borde de la zona y con variante válida',
      gSpace.length >= 1 && gSpace.every((g) => g.y > 4900 && g.v >= 0 && g.v <= 2 && g.s > 100 && g.a > 0), JSON.stringify(gSpace));
    // densidad: suma de galaxias visibles en muestreos de dos bandas
    const perTramo = (cy) => Sc.ClimbDuel.galaxiesAt(cy).length;
    let densLow = 0, densHigh = 0;
    for (let cy = 5200; cy <= 8200; cy += 310) densLow += perTramo(cy);
    for (let cy = 24000; cy <= 27000; cy += 310) densHigh += perTramo(cy);
    check('galaxias: la densidad CRECE con la altura (más por tramo muy arriba que al entrar)',
      densHigh > densLow, `recién entrado=${densLow} muy arriba=${densHigh}`);
    check('galaxias: el campo es determinista (misma altura, mismo campo)',
      JSON.stringify(Sc.ClimbDuel.galaxiesAt(12345)) === JSON.stringify(Sc.ClimbDuel.galaxiesAt(12345)));

    // --- El cohete: tripulación según modo, y solo en el espacio ---
    const mkClimbAtSpace = (who) => {
      const d = new Sc.ClimbDuel(who, () => {});
      d.st = 'play'; d.time = 1e9; d.cstep = 1e9; d.ct = 1e9; // Pollito congelado
      d.p.elev = 6000; d.p.te = 6000; d.pi = d.pMax = 222; d.cam.y = 6000; // cámara y jugador en el espacio
      return d;
    };
    // historia: la tripulación son los HUIDOS (S.fled)
    G.practiceMode = false;
    S.party = ['natalia', 'itzel', 'alan', 'saulo'];
    S.fled = G.PLAYABLE.filter((id) => !S.party.includes(id));
    {
      const d = mkClimbAtSpace('natalia');
      check('cohete (historia): la tripulación son exactamente los no elegidos (S.fled)',
        JSON.stringify(d.rocketCrew()) === JSON.stringify(S.fled), d.rocketCrew().join(','));
      d.rocketWait = 0;
      d.update(0.05);
      check('cohete (historia): en el espacio se dispara el pase, con la tripulación de huidos a bordo',
        !!d.rocket && JSON.stringify(d.rocket.crew) === JSON.stringify(S.fled) && d.rocketSeen === true, d.rocket && d.rocket.crew.join(','));
      check('cohete: el guiño de la primera vez es la burbuja del protagonista (sin emoticones)',
        !!d.p.bubble && d.p.bubble.text.includes('se fueron'), d.p.bubble && d.p.bubble.text);
      const x0 = d.rocket.x;
      d.update(0.05);
      check('cohete: cruza en horizontal (x avanza en su sentido)', (d.rocket.x - x0) * d.rocket.dir > 3, `dx=${(d.rocket.x - x0).toFixed(1)}`);
      for (let i = 0; i < 200 && d.rocket; i++) d.update(0.05);
      check('cohete: al salir de pantalla se retira y reprograma el próximo pase (12–18 s)',
        d.rocket === null && d.rocketWait >= 12 && d.rocketWait <= 18, `wait=${d.rocketWait}`);
    }
    // práctica: todos los roomies menos el elegido para practicar
    G.practiceMode = true;
    {
      const d = mkClimbAtSpace('saulo');
      const expect = G.PLAYABLE.filter((id) => id !== 'saulo');
      check('cohete (práctica): la tripulación son todos los roomies menos el elegido',
        JSON.stringify(d.rocketCrew()) === JSON.stringify(expect), d.rocketCrew().join(','));
      d.rocketWait = 0; d.update(0.05);
      check('cohete (práctica): el pase se dispara con esa tripulación (6 ventanillas)',
        !!d.rocket && d.rocket.crew.length === 6, d.rocket && d.rocket.crew.join(','));
    }
    G.practiceMode = false;
    // fuera del espacio: jamás pasa
    {
      const d = new Sc.ClimbDuel('natalia', () => {});
      d.st = 'play'; d.time = 1e9; d.cstep = 1e9; d.ct = 1e9; d.rocketWait = 0;
      for (let i = 0; i < 40; i++) d.update(0.05);
      check('cohete: fuera de la zona espacio NUNCA se dispara (ni con la espera agotada)', d.rocket === null && d.cam.y < 5000, `cam.y=${d.cam.y.toFixed(0)}`);
    }
    // draw con el cohete en pantalla y galaxias: sin excepciones
    {
      const realRender = W.render, realProject = G.R.project;
      const ctx2d = new FakeCtx();
      W.render = (opts) => { if (opts.boxes) opts.boxes(new G.R.MB(), 0); if (opts.sprites) opts.sprites(0); if (opts.over) opts.over(ctx2d, 0); };
      G.R.project = () => ({ x: 320, y: 180, ok: true });
      try {
        const d = mkClimbAtSpace('natalia');
        d.rocket = { x: -40, dir: 1, crew: d.rocketCrew() };
        d.draw(0.016);
        check('draw sin errores: espacio con galaxias y el cohete en pantalla (caras en las ventanillas)', d.rocket.crew.length === 3);
        d.rocket = { x: 120, dir: -1, crew: G.PLAYABLE.filter((id) => id !== 'natalia') };
        d.draw(0.016);
        check('draw sin errores: cohete en sentido contrario y con 6 tripulantes', true);
      } catch (e) {
        check('draw sin errores con cohete/galaxias (excepción: ' + e.message + ')', false, e.stack && e.stack.split('\n')[1]);
      } finally { W.render = realRender; G.R.project = realProject; }
    }
  }

  console.log(`\n${failures ? '✘ ' + failures + ' FALLOS' : '✔ TODO OK'} — ${checks - failures}/${checks} checks`);
  process.exit(failures ? 1 : 0);
})().catch((e) => { console.error('ERROR FATAL en la prueba:', e); process.exit(2); });
