#!/usr/bin/env node
/* ============================================================
   HUMO DEL EASTER EGG «LA CITA» — Parte 1 (feat/easter-egg-cita)
   Node, sin navegador: carga los scripts REALES (incluido
   date.js) sobre el mismo DOM falso del smoke_v31 y ejercita:
   A) La tabla DATE_SCENES suma 149 s y los suckAt cuadran.
   B) El SHA-256 propio de date.js contra vectores conocidos.
   C) verify(): código falso NO activa; con un hash de PRUEBA
      inyectado (gancho debug, el hash real jamás se toca en el
      repo ni se conoce aquí), el código de prueba SÍ verifica
      y la normalización (minúsculas) funciona.
   D) La entrada «???» existe en título y pausa (fuente) y el
      panel se abre; código incorrecto = silencio y vuelta atrás.
   E) Código correcto: arranca el modo (phase 'date'), el depa
      nace con TODOS escondidos (armario con ojos, Pollito y
      Jose ocultos) y Ximena visible y controlable.
   F) Sin archivo de audio: reloj de respaldo corriendo, pausa
      del modo que lo congela, y la cadena de la Parte 1:
      puerta → plaza → 'plaza-arrived' en modo libre ('free').
   E3) Compensación de escala de Ximena en el depa: su altura
      proyectada es la misma en el spawn, arriba y abajo.
   G) Modo libre: input mueve al activo y la cámara lo sigue,
      TAB alterna con Jose, el otro sigue a su puesto, y ni el
      tiempo ni el fin de la canción disparan onDone.
   H) Correcciones del segundo playtest: la tabla CELL_FIT de
      Ximena (su walk_down/run_down venía más alto que el resto
      de la hoja y «pulsaba» al bajar), el acompañante sin
      parpadeo walk/idle al caminar juntos (histéresis), y Jose
      ya sin ramo en la plaza (sin drawBouquet en date.js).
   Uso: node tools/check_date.js   (exit 0 = todo OK)
   ============================================================ */
'use strict';
const fs = require('fs');
const vm = require('vm');
const path = require('path');
const SRC = path.join(__dirname, '..', 'application', 'src', 'js');

// ---------- DOM falso (el mismo patrón del smoke_v31) ----------
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
  getContext(kind) { if (kind === '2d') return this._ctx || (this._ctx = new FakeCtx()); return null; }
  toDataURL() { return 'data:image/png;base64,FAKE'; }
}
class FakeImage { constructor() { this.complete = true; this.naturalWidth = 0; this.naturalHeight = 0; this.width = 0; this.height = 0; } }
selectorCache.set('#cv', new FakeCanvas());
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

// ---------- Sandbox y carga (orden = index.html) ----------
const sandbox = {
  console, performance, setTimeout, clearTimeout, setInterval, clearInterval,
  document: documentFake, Image: FakeImage,
  ImageData: class { constructor(data, w, h) { this.data = data; this.width = w; this.height = h; } },
  location: { search: '', pathname: '/index.html', href: '' },
  requestAnimationFrame: () => {},
  addEventListener: (t, f) => { (handlers[t] = handlers[t] || []).push(f); },
};
sandbox.window = sandbox; sandbox.globalThis = sandbox;
vm.createContext(sandbox);
const load = (file) => vm.runInContext(fs.readFileSync(path.join(SRC, file), 'utf8'), sandbox, { filename: file });
['defined-sheets.js', 'sprites.js', 'data.js', 'gl3d.js', 'world.js', 'scenes.js', 'date.js', 'game.js'].forEach(load);

const G = sandbox.G, S = G.debug.S, DM = G.DateMode;
let failures = 0, checks = 0;
function check(name, cond, extra) {
  checks++;
  if (cond) console.log('  ✔ ' + name);
  else { failures++; console.log('  ✘ ' + name + (extra ? '  [' + extra + ']' : '')); }
}
const key = (code, down) => (handlers[down ? 'keydown' : 'keyup'] || []).forEach((h) => h({ code, target: { tagName: 'BODY' }, preventDefault() {} }));
const tick = () => new Promise((r) => setImmediate(r));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

(async () => {
  await tick(); await tick();

  console.log('\nA) Tabla de escenas y constantes');
  check('G.DateMode existe con start/stop/update/draw', !!DM && ['start', 'stop', 'update', 'draw'].every((k) => typeof DM[k] === 'function'));
  const total = DM.scenes.reduce((n, s) => n + (s.t1 - s.t0), 0);
  check('DATE_SCENES suma 149 s', total === 149, 'suma=' + total);
  check('cortes continuos (t1 de una = t0 de la siguiente)', DM.scenes.every((s, i) => i === 0 || DM.scenes[i - 1].t1 === s.t0));
  check('suckAt = t1 − 1,8 en las escenas 1–4', DM.scenes.slice(1, 5).every((s) => Math.abs(s.suckAt - (s.t1 - 1.8)) < 0.001));
  check('SUCK_DUR = 1,8 y JOSE_LAG = 0,15', DM.SUCK_DUR === 1.8 && DM.JOSE_LAG === 0.15);

  console.log('\nB) SHA-256 propio contra vectores conocidos');
  check("sha256('abc') correcto", DM.debug.sha256hex('abc') === 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
  check("sha256('') correcto", DM.debug.sha256hex('') === 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855');

  console.log('\nC) Verificación de código');
  check('un código falso NO verifica (hash real intacto)', DM.verify('XXXXXXXXXX') === false && DM.verify('') === false);
  const realHash = DM.debug.getHash();
  DM.debug.setHash(DM.debug.sha256hex('PRUEBA1234'));
  check('con hash de prueba: el código de prueba SÍ verifica', DM.verify('PRUEBA1234') === true);
  check('la normalización acepta minúsculas y espacios', DM.verify(' prueba1234 ') === true);
  check('con hash de prueba: otro código NO verifica', DM.verify('PRUEBA9999') === false);

  console.log('\nD) Entrada «???» y panel');
  const gameSrc = fs.readFileSync(path.join(SRC, 'game.js'), 'utf8');
  const indexSrc = fs.readFileSync(path.join(SRC, '..', 'index.html'), 'utf8');
  check('el título tiene su botón ??? (id tsecret)', gameSrc.includes('id="tsecret"') && gameSrc.includes('>???</button>'));
  check('el menú de pausa tiene su botón ??? (id psecret)', gameSrc.includes('id="psecret"'));
  check('la pausa avisa al modo date (DateMode.setPaused)', gameSrc.includes('G.DateMode.setPaused(v)'));
  check('index.html carga date.js ANTES de game.js', indexSrc.indexOf('js/date.js') > -1 && indexSrc.indexOf('js/date.js') < indexSrc.indexOf('js/game.js'));
  const overlay = documentFake.querySelector('#overlay');
  let cancelCalls = 0;
  G.openDateCode(() => { cancelCalls++; });
  check('el panel se abre con su input (datecode)', overlay.innerHTML.includes('id="datecode"') && overlay.classList.contains('show'));
  const input = new FakeEl('input'); input.id = 'datecode'; input.value = 'CODIGOFALSO1';
  documentFake.querySelector('#datego').onclick();
  check('código incorrecto: silencio y vuelta atrás (onCancel, sin activar)', cancelCalls === 1 && S.phase !== 'date' && !DM.state.active);

  console.log('\nE) Activación y escena inicial');
  G.openDateCode(() => { cancelCalls++; });
  input.value = 'prueba1234';
  documentFake.querySelector('#datego').onclick();
  await sleep(800); // el fundido de 0,6 s es de reloj de pared (setTimeout)
  check("S.phase === 'date' tras el código correcto", S.phase === 'date', 'phase=' + S.phase);
  check('el modo está activo en el depa', DM.state.active === true && DM.state.state === 'depa', 'state=' + DM.state.state);
  const sc = G.scene, home = sc && sc.home, xi = sc && sc.xi;
  check('la escena es la DateScene con su HomeScene', !!home && !!xi);
  check('TODOS los roomies están escondidos (hidden)', home.roomies.length === 7 && home.roomies.every((a) => a.hidden));
  check('el armario asoma los 7 pares de ojos (closetPeek)', Array.isArray(home.closetPeek) && home.closetPeek.length === 7);
  check('Pollito escondido y Jose ausente (espera en la plaza)', home.cat.hidden === true && home.jose.hidden === true);
  check('Ximena visible y en su cuarto', xi.hidden === false && xi.x > 650 && xi.y > 300);
  // (el dibujo del depa es WebGL real: no se ejercita en el harness
  // sin GPU; el de la plaza 2D sí, en la sección F)
  const x0 = xi.x;
  key('ArrowLeft', true);
  for (let i = 0; i < 20; i++) sc.update(0.05);
  key('ArrowLeft', false);
  check('Ximena se mueve con el input (← la desplaza)', xi.x < x0 - 20, `x ${x0} → ${xi.x}`);

  console.log('\nE2) Caminata de Ximena: velocidad y animación (regresión del deslizamiento)');
  // Tramo libre de la sala hacia la derecha (sin muebles): 1 s de
  // input sostenido a dt fijo. Con el bug (HomeScene.update llamaba
  // a follow() sin ruta y follow() le borraba vx/vy cada frame) el
  // desplazamiento era ≈28 u y la fase step apenas avanzaba: la
  // hoja definida SÍ tiene walk_right, pero nunca cicla → desliza.
  xi.x = 400; xi.y = 255; xi.vx = xi.vy = 0; xi.step = 0; xi.dir = 'down';
  const wx0 = xi.x;
  const wlen = G.Sprites.animLen('ximena', 'walk_right');
  const pp = (beat, n) => { if (n <= 1) return 0; const per = 2 * n - 2, k = ((beat % per) + per) % per; return k < n ? k : per - k; };
  let lastIdx = -1, idxChanges = 0;
  key('ArrowRight', true);
  for (let i = 0; i < 20; i++) {
    sc.update(0.05);
    // mismo cálculo de frame que draw3d (world.js): beat = step/(π/2),
    // ciclos de 3 frames en ping-pong
    const cyc = Math.floor(xi.step / (Math.PI / 2));
    const idx = wlen === 3 ? pp(cyc, 3) : ((cyc % wlen) + wlen) % wlen;
    if (lastIdx >= 0 && idx !== lastIdx) idxChanges++;
    lastIdx = idx;
  }
  key('ArrowRight', false);
  const disp = xi.x - wx0, stepTot = xi.step, spdFin = xi.spd;
  check('en 1 s a la derecha Ximena recorre > 120 u (con el bug eran ≈28 u)', disp > 120, `disp=${disp.toFixed(1)} u`);
  check('la fase de zancada avanzó > 20 rad en 1 s (los frames ciclan)', stepTot > 20, `step=${stepTot.toFixed(1)} rad`);
  check('el frame de caminata cambió ≥ 3 veces en 1 s', idxChanges >= 3, `cambios=${idxChanges}, walk_right de ${wlen} frames`);
  check('al moverse a la derecha la animación es walk_right (dir=right, moving, la hoja tiene el ciclo)', xi.dir === 'right' && xi.moving === true && G.Sprites.hasAnim('ximena', 'walk_right'));
  check('su velocidad efectiva es de caminata (< RUN_SPD 178, sin entrar en run_*)', spdFin > 120 && spdFin < 178, `spd=${spdFin.toFixed(1)} u/s`);
  xi.vx = xi.vy = 0;

  console.log('\nE3) Compensación de escala en el depa (tamaño en pantalla constante)');
  // La cámara se deja FIJA en el encuadre del spawn (el peor caso:
  // el retardo total al moverse) y Ximena se mide en el spawn, muy
  // abajo (cerca de la cámara: sin compensar se vería más grande)
  // y muy arriba (lejos: se vería más chica). Con la compensación
  // activa (compensateScale corre en cada update de la fase depa)
  // su altura proyectada debe ser la misma en las tres posiciones.
  home.cam.x = 800; home.cam.z = 440; home.cam.dist = 560; home.cam.pitch = 0.8;
  xi.x = 800; xi.y = 470; xi.vx = xi.vy = 0; xi.scale = 1;
  sc.update(0.001);
  const hSpawn = sc.projectedHeight(), sSpawn = xi.scale;
  xi.y = 560; xi.vx = xi.vy = 0;
  sc.update(0.001);
  const hDown = sc.projectedHeight(), sDown = xi.scale;
  xi.y = 360; xi.vx = xi.vy = 0;
  sc.update(0.001);
  const hUp = sc.projectedHeight(), sUp = xi.scale;
  check('abajo (cerca de la cámara) su altura difiere < 5% de la del spawn', Math.abs(hDown - hSpawn) / hSpawn < 0.05, `spawn=${hSpawn.toFixed(1)} abajo=${hDown.toFixed(1)} scale=${sDown.toFixed(3)}`);
  check('arriba (lejos de la cámara) su altura difiere < 5% de la del spawn', Math.abs(hUp - hSpawn) / hSpawn < 0.05, `spawn=${hSpawn.toFixed(1)} arriba=${hUp.toFixed(1)} scale=${sUp.toFixed(3)}`);
  // Nota de geometría (medida, no supuesta): con esta cámara
  // (dist 560, pitch 0,8) la altura cruda varía poco (±1,3%): al
  // acercarse, la ganancia por distancia casi se cancela con el
  // acortamiento del billboard vertical. La compensación es por
  // eso FINA: basta verificar que se activa en los extremos
  // (scale ≠ la del spawn) y que respeta el clamp [0,8, 1,25].
  check('la compensación se activa en los extremos y respeta el clamp [0,8, 1,25]', Math.abs(sDown - sSpawn) > 0.005 && Math.abs(sUp - sSpawn) > 0.005 && [sSpawn, sDown, sUp].every((s) => s >= 0.8 && s <= 1.25), `spawn=${sSpawn.toFixed(3)} abajo=${sDown.toFixed(3)} arriba=${sUp.toFixed(3)}`);
  xi.x = 800; xi.y = 470; xi.vx = xi.vy = 0;

  console.log('\nF) Puerta, reloj de respaldo y llegada a la plaza');
  xi.x = 510; xi.y = 560; xi.vx = xi.vy = 0;
  sc.update(0.016);
  check('junto a la puerta principal se ofrece la interacción', sc.nearDoor === true);
  key('Space', true); sc.update(0.016); key('Space', false);
  check('ESPACIO abre la puerta (fase door)', sc.phase === 'door', 'phase=' + sc.phase);
  for (let i = 0; i < 25; i++) sc.update(0.05);
  check('tras la luz (~1 s) estamos en la plaza', sc.phase === 'plaza' && DM.state.state === 'plaza', 'phase=' + sc.phase);
  check('el reloj de la cita corre SIN archivo de audio (respaldo)', DM.state.clockRunning === true && DM.dateNow() > 0);
  const tA = DM.dateNow();
  DM.setPaused(true); await sleep(70);
  const tB = DM.dateNow();
  DM.setPaused(false); await sleep(70);
  const tC = DM.dateNow();
  check('la pausa del modo congela el reloj de respaldo', Math.abs(tB - tA) < 0.005, `${tA.toFixed(3)} → ${tB.toFixed(3)}`);
  check('al reanudar, el reloj sigue desde ahí', tC > tB, `${tB.toFixed(3)} → ${tC.toFixed(3)}`);
  sc.draw(0.016); // la plaza en capas se dibuja sin explotar (sin foto cargada: silueta de respaldo)
  for (let i = 0; i < 100 && DM.state.state !== 'plaza-arrived'; i++) sc.update(0.05);
  check("el revelado de ~4 s alcanza el estado 'plaza-arrived'", DM.state.state === 'plaza-arrived' && DM.state.arrived === true, 'state=' + DM.state.state);
  check('Jose reaccionó y se sumó (joseJoined)', DM.state.joseJoined === true && sc.joseReacted === true);
  check("tras el revelado la escena queda en modo libre ('free'), sin cerrar sola", sc.phase === 'free' && sc.doneFired === false && sandbox.location.href === '', 'phase=' + sc.phase);

  console.log('\nG) Modo libre de la plaza: control, TAB, seguidor y sin fin automático');
  const F = sc.free, X = F.chars.ximena, J = F.chars.jose;
  check('el personaje activo inicial es Ximena', F.active === 'ximena');
  const fx0 = X.x;
  key('ArrowRight', true);
  for (let i = 0; i < 60; i++) sc.update(0.05);
  key('ArrowRight', false);
  check('input sostenido mueve al activo (Ximena) por la franja', X.x > fx0 + 200, `x ${fx0} → ${X.x.toFixed(0)}`);
  check('la cámara sigue al activo y no se sale de la franja (0..510)', sc.pan > 100 && sc.pan <= 510.01, `pan=${sc.pan.toFixed(1)}`);
  check('el activo camina con su ciclo lateral al moverse (moving + distancia acumulada)', X.dist > 200, `dist=${X.dist.toFixed(0)}`);
  sc.draw(0.016); // el modo libre se dibuja sin explotar (walk_right incluido)
  key('Tab', true); key('Tab', false);
  check('TAB alterna el personaje activo a Jose', F.active === 'jose', 'active=' + F.active);
  const jx0 = J.x;
  key('ArrowLeft', true);
  for (let i = 0; i < 20; i++) sc.update(0.05);
  key('ArrowLeft', false);
  check('con Jose activo, el input lo mueve a él', J.x < jx0 - 60, `x ${jx0.toFixed(0)} → ${J.x.toFixed(0)}`);
  // El seguidor (ahora Ximena) debe acercarse a su puesto junto a Jose:
  J.x = 1000; J.y = 316; X.x = 300; X.y = 316;
  const gap0 = Math.abs((J.x - 70) - X.x);
  for (let i = 0; i < 20; i++) sc.update(0.05);
  const gap1 = Math.abs((J.x - 70) - X.x);
  check('el seguidor se acerca a su puesto cuando el activo se aleja', gap1 < gap0 - 100, `hueco ${gap0.toFixed(0)} → ${gap1.toFixed(0)}`);
  // Ni el tiempo ni el fin nominal de la canción cierran el modo libre:
  for (let i = 0; i < 200; i++) sc.update(0.05);
  check("el modo libre NO termina solo (ni onDone ni 'done' tras 10 s más)", sc.phase === 'free' && sc.doneFired === false && DM.state.state === 'plaza-arrived' && sandbox.location.href === '', 'phase=' + sc.phase);

  console.log('\nH) CELL_FIT de Ximena, acompañante sin parpadeo y Jose sin ramo');
  // (a) La hoja definida de Ximena trae walk_down (celdas 4–7) y
  // run_down (14–17) con la figura MÁS ALTA que el resto (medido
  // con PIL: idle/walk_up/walk_right = 202–206, referencia 204;
  // walk_down = 221/202/217/223 y run_down = 202/204/216/215):
  // al caminar hacia abajo «se hacía grande» y oscilaba dentro
  // del ciclo. CELL_FIT (sprites.js) escala esas celdas a 204 al
  // construir el frame, anclado en los pies.
  const CF = G.Sprites.CELL_FIT, fitX = CF && CF.ximena;
  const medido = { 4: 221, 6: 217, 7: 223, 16: 216, 17: 215 };
  check('CELL_FIT de ximena existe con los 5 factores esperados (204/medida, ±0,005)',
    !!fitX && Object.keys(medido).every((k) => Math.abs(fitX.cells[k] - 204 / medido[k]) < 0.005),
    fitX ? JSON.stringify(fitX.cells) : 'sin tabla');
  check('las alturas efectivas (medida × factor) quedan en 204 ± 4',
    !!fitX && Object.keys(medido).every((k) => Math.abs(medido[k] * fitX.cells[k] - 204) <= 4));
  check('las celdas ya correctas (5, 14, 15) NO llevan factor ni se toca a otros personajes',
    !!fitX && fitX.cells[5] === undefined && fitX.cells[14] === undefined && fitX.cells[15] === undefined && Object.keys(CF).length === 1);
  // (c) Jose ya no lleva flores a la plaza:
  const dateSrc = fs.readFileSync(path.join(SRC, 'date.js'), 'utf8');
  check('date.js ya no dibuja el ramo de Jose (sin drawBouquet ni menciones)', !dateSrc.includes('drawBouquet') && !dateSrc.includes('ramo'));
  // (b) Caminando juntos, el acompañante no debe parpadear entre
  // caminata e idle. Escenario controlado: Ximena activa, Jose
  // en su puesto; Ximena camina a la derecha 3 s sostenidos.
  sc.switchActive(); // el activo vuelve a ser Ximena (en G quedó Jose)
  X.x = 300; X.y = 316; J.x = 370; J.y = 316; J.follow = false; J.animWalk = false; J.idleT = 0;
  for (let i = 0; i < 10; i++) sc.update(0.05); // se asientan quietos
  key('ArrowRight', true);
  let trans = 0, prevW = J.animWalk;
  for (let i = 0; i < 60; i++) { sc.update(0.05); if (J.animWalk !== prevW) trans++; prevW = J.animWalk; }
  key('ArrowRight', false);
  check('caminando juntos 3 s: el acompañante entra en caminata UNA vez y no parpadea a idle (≤1 transición)',
    trans <= 1 && J.animWalk === true, `transiciones=${trans}`);
  // Al detenerse el activo, el acompañante llega a su puesto y
  // se queda en idle ESTABLE (la gracia de 0,12 s no cuenta como
  // parpadeo: tras ella, cero transiciones).
  for (let i = 0; i < 40; i++) sc.update(0.05);
  const dPost = Math.hypot((X.x + 70) - J.x, X.y - J.y);
  check('al detenerse el activo, el acompañante llega a su puesto (< 6 px) y su animación cae a idle', dPost < 6 && J.animWalk === false, `hueco=${dPost.toFixed(1)} px`);
  let trans2 = 0; prevW = J.animWalk;
  for (let i = 0; i < 20; i++) { sc.update(0.05); if (J.animWalk !== prevW) trans2++; prevW = J.animWalk; }
  check('y se queda en idle estable (0 transiciones en 1 s más)', J.animWalk === false && trans2 === 0, `transiciones=${trans2}`);
  sc.draw(0.016); // el modo libre se sigue dibujando sin explotar

  console.log('\nI) Complementos de la plaza: avión, tacos, vocho de Pollito, Parroquia y vista de San Ángel');
  // Recortes de foto nuevos (mismo acabado que la Catedral) y la
  // vista lejana de San Ángel (asset SOLO-LOCAL: no se versiona).
  const FX = DM.debug.PLAZA_FX, DATE_DIR = path.join(SRC, '..', 'assets', 'date');
  check('PLAZA_FX reúne los 5 complementos (avión, vocho, tacos, parroquia, vista)',
    !!FX && !!FX.avion && !!FX.vocho && FX.tacosX > 0 && FX.parroquiaX > 0 && FX.vistaX > 0);
  const fuentes = fs.readFileSync(path.join(DATE_DIR, 'FUENTES.md'), 'utf8');
  for (const file of ['avion.png', 'vocho.png', 'tacos.png', 'parroquia.png']) {
    check(`el asset ${file} existe en assets/date y FUENTES.md lo registra`,
      fs.existsSync(path.join(DATE_DIR, file)) && fuentes.includes(file));
  }
  check('date.js referencia los 5 assets (los 4 recortes + la vista)',
    ['avion.png', 'vocho.png', 'tacos.png', 'parroquia.png', 'sanangel-vista.png'].every((f) => dateSrc.includes(f)));
  // El avión: monótono creciente dentro de su ventana de cruce y
  // fuera de escena (=-9999) el resto del ciclo (28 s: 14 cruzando).
  const ax = DM.debug.avionXAt;
  let monoA = true, prevA = null, dentroA = 0;
  for (let t = 0; t <= 56; t += 0.25) {
    const x = ax(t);
    if (x > -9000) { dentroA++; if (prevA !== null && x < prevA - 1e-9) monoA = false; prevA = x; }
    else prevA = null; // fuera de la ventana: el ciclo siguiente vuelve a empezar
  }
  check('avionXAt es monótona creciente dentro de la ventana de cruce', monoA && dentroA > 40, `muestras dentro=${dentroA}`);
  check('el avión espera FUERA de escena fuera de su ventana (t=10 → fase 17 ≥ cruce 14)', ax(10) === -9999, 'ax(10)=' + ax(10));
  check('el avión entra por la izquierda al inicio de su ventana (t=21,5 → fase 0,5)', ax(21.5) > -200 && ax(21.5) < -100, 'ax(21.5)=' + ax(21.5).toFixed(1));
  // El vocho: monótono DECRECIENTE (derecha → izquierda) y fuera
  // el resto del ciclo (32 s: 7 cruzando, 25 esperando).
  const vx = DM.debug.vochoXAt;
  let monoV = true, prevV = null, dentroV = 0;
  for (let t = 0; t <= 64; t += 0.25) {
    const x = vx(t);
    if (x < 9000) { dentroV++; if (prevV !== null && x > prevV + 1e-9) monoV = false; prevV = x; }
    else prevV = null; // fuera de la ventana: el ciclo siguiente vuelve a empezar
  }
  check('vochoXAt es monótona decreciente (derecha → izquierda) en su ventana', monoV && dentroV > 20, `muestras dentro=${dentroV}`);
  check('el vocho espera FUERA de escena fuera de su ventana (t=20 → fase 31 ≥ cruce 7)', vx(20) === 9999, 'vx(20)=' + vx(20));
  check('el vocho va por la calle de primer plano (base 348–354) con Pollito a la ventanilla del conductor',
    FX.vocho.base >= 348 && FX.vocho.base <= 354 && FX.winCx > 0.3 && FX.winCx < 0.5);
  // Fijos: dentro de la franja y descubribles al fondo (su centro
  // cae en pantalla con la cámara en pan máximo).
  check('tacos y parroquia tienen posición fija dentro de la franja (0..worldW)',
    FX.tacosX > 0 && FX.tacosX < sc.worldW && FX.parroquiaX > 0 && FX.parroquiaX < sc.worldW,
    `tacos=${FX.tacosX}, parroquia=${FX.parroquiaX}, worldW=${sc.worldW}`);
  check('con la cámara al fondo, tacos y parroquia caen en pantalla (se descubren explorando)',
    (FX.tacosX - 510 * 0.5) > 200 && (FX.tacosX - 510 * 0.5) < 640 && (FX.parroquiaX - 510 * 0.25) > 300 && (FX.parroquiaX - 510 * 0.25) < 640);
  // La vista de San Ángel: ancla de mundo en el tramo final
  // (1000–1120, donde irá la Puerta de salida) y, con la cámara
  // al fondo, su centro cae tras esa zona (pantalla 380–620).
  check('la vista de San Ángel ancla en el tramo final del mundo (1000–1120) y queda tras la futura Puerta de salida',
    FX.vistaWorldX >= 1000 && FX.vistaWorldX <= 1120 && (FX.vistaX - 510 * 0.2) >= 380 && (FX.vistaX - 510 * 0.2) <= 620,
    `worldX=${FX.vistaWorldX}, pantalla al fondo=${(FX.vistaX - 510 * 0.2).toFixed(0)}`);
  check('el dibujo de la vista está condicionado a que la imagen cargó (si falta el asset local, no se dibuja ni se rompe)',
    dateSrc.includes('imgOk(vistaImg)') && dateSrc.includes('sanangel-vista.png'));
  check('FUENTES.md registra la vista como asset solo-local aportado por Jose',
    fuentes.includes('sanangel-vista.png') && fuentes.includes('solo-local'));
  const gitignore = fs.readFileSync(path.join(__dirname, '..', '.gitignore'), 'utf8');
  check('sanangel-vista.png está en .gitignore (nunca se versiona, como la canción)',
    gitignore.includes('application/src/assets/date/sanangel-vista.png'));
  sc.draw(0.016); // con los complementos, el dibujo de la plaza no explota

  DM.debug.setHash(realHash); // el hash real queda como estaba
  check('el hash real quedó restaurado tras las pruebas', DM.debug.getHash() === realHash);

  console.log(`\n${failures ? '✘' : '✔'} check_date: ${checks - failures}/${checks} checks`);
  process.exit(failures ? 1 : 0);
})().catch((e) => { console.error('ERROR en check_date:', e); process.exit(1); });
