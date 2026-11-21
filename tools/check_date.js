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
      del modo que lo congela, y la cadena completa de la
      Parte 1: puerta → plaza → 'plaza-arrived' → 'done'.
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
  for (let i = 0; i < 40 && DM.state.state !== 'done'; i++) sc.update(0.05);
  check("la Parte 1 cierra en 'done' (vuelta al título)", DM.state.state === 'done', 'state=' + DM.state.state);

  DM.debug.setHash(realHash); // el hash real queda como estaba
  check('el hash real quedó restaurado tras las pruebas', DM.debug.getHash() === realHash);

  console.log(`\n${failures ? '✘' : '✔'} check_date: ${checks - failures}/${checks} checks`);
  process.exit(failures ? 1 : 0);
})().catch((e) => { console.error('ERROR en check_date:', e); process.exit(1); });
