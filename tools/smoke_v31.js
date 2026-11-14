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
  const from = 'G.debug = { S, apply, runEvent, tick };';
  if (!code.includes(from)) throw new Error('no se encontró G.debug en game.js');
  return code.replace(from, 'G.debug = { S, apply, runEvent, tick, MG };');
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

  console.log(`\n${failures ? '✘ ' + failures + ' FALLOS' : '✔ TODO OK'} — ${checks - failures}/${checks} checks`);
  process.exit(failures ? 1 : 0);
})().catch((e) => { console.error('ERROR FATAL en la prueba:', e); process.exit(2); });
