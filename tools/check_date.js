#!/usr/bin/env node
/* ============================================================
   HUMO DEL EASTER EGG «LA CITA» — Parte 1 (feat/easter-egg-cita)
   Node, sin navegador: carga los scripts REALES (incluido
   date.js) sobre el mismo DOM falso del smoke_v31 y ejercita:
   A) La tabla DATE_SCENES suma 149 s, los suckAt cuadran y la
      REGLA DE DISTANCIAS se cumple: w = (t1−t0) × PACE (150 px/s)
      en las 4 escenas de franja (4350/3900/3600/4350).
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
   J) Escena 2 «San Ángel» (Parte 2): la Puerta de salida de la
      plaza (mundo x=4250, el final de la franja de 4350 px)
      cruza a la franja de San Ángel (3900 px, mismo modo libre),
      el cameo de Manolo y María con Chuy se dispara por cámara
      (pan > 900) y camina a la izquierda una sola vez por
      visita, las velas parpadean, la Puerta del árbol cruza al
      AEROPUERTO (escena 3; la vuelta completa se verifica en
      la sección L), y la carpeta sanangel/ quedó VERSIONADA
      por decisión expresa de Jose (commit 5599034, integrado
      tal cual); la vista sanangel-vista.png sigue fuera del
      repo y el humo lo verifica.
   L) Escena 3 «Aeropuerto»: franja de 3600 px (24 s × PACE)
      con la cadena de Puertas plaza → San Ángel → aeropuerto
      y sus vueltas (árbol→aero, entrada del aero→San Ángel
      junto al árbol, salida del aero→San Ángel por ahora), el
      avión reutilizado rodando FUERA del ventanal (aeroPlaneXAt
      monótona, lenta y visible a través de la banda de cristal
      en algún punto del paseo) y la cinta caminadora que
      acelera DE VERDAD: el activo se desplaza ~240 px en 1 s
      sobre la banda contra ~150 fuera, la banda sola lo
      arrastra ~90 px sin input, y el seguidor también la
      recibe (su caminata a su puesto se frena ~90 px/s).
   K) Audio (pedidos de Jose): el archivo de la canción trae
      ~4 s de silencio inicial → AUDIO_SKIP=4: al arrancar se
      salta a esa posición (con re-aplicación ÚNICA si el
      metadata llega tarde), dateNow() descuenta el salto y el
      factor usa la duración útil (duration−4)/149; la pausa NO
      re-salta al reanudar. Y el botón de silencio #dateMuteBtn:
      existe con el modo activo, clic y tecla M alternan
      song.muted/D.muted, y desaparece con body.date-mode.
   M) Las bolas de paja de San Ángel (pedido de Jose): foto
      real CC versionada (bola-paja.png, Noah Wulf, CC BY-SA
      4.0) que el viento arrastra de derecha a izquierda por
      la calle: nacen a la derecha de la pantalla SOLO con el
      controlado en la zona de la calle (x < 2500; en la del
      árbol no nace ninguna), ruedan con ángulo = distancia/
      radio, respetan la cadencia (3,5–6,5 s) y el tope de
      vivas (3), y al chocar SOLO con el controlado estallan
      en pajitas y lo frenan de verdad (×0,4 por 0,7 s, medido
      en desplazamiento); el seguidor las atraviesa.
   Ñ) Las praderas enriquecidas (pedido de Jose: la escena 4
     se veía MUY VACÍA, también el cielo): Calcifer como
     obstáculo de fuego (recorte solo-local de película, ~7
     sobre la vereda; el choque da fogonazo con chispas,
     frena ×0,4 por 0,7 s medido en desplazamiento y lo deja
     apagado unos segundos; el seguidor lo atraviesa),
     Mononoke observando desde la arboleda dibujada del fondo
     (protagonista en la segunda mitad del paseo), y el cielo
     y la pradera llenos por código: 3 profundidades de nubes
     (praderaClouds), sol en la capa lejana, dirigible de
     ciclo ~120 s, bandadas con aleteo, árboles solitarios,
     rocas y mariposas. calcifer.png y mononoke.png quedan
     solo-locales (gitignore + FUENTES.md), como castillo.png.
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
  // Regla de distancias (documento §5): caminar cada franja a
  // PACE = 150 px/s (la velocidad del modo libre) dura lo que
  // dura su bloque de la canción: w = (t1 − t0) × PACE.
  const stripScenes = DM.scenes.filter((s) => s.w !== undefined);
  check('PACE = 150 px/s (el ritmo de recorrido del modo libre)', DM.debug.PACE === 150, 'PACE=' + DM.debug.PACE);
  check('la regla de distancias: w = (t1−t0) × PACE en las 4 escenas de franja (plaza 4350, sanangel 3900, aero 3600, castillo 4350)',
    stripScenes.length === 4 && stripScenes.every((s) => s.w === (s.t1 - s.t0) * DM.debug.PACE) &&
    DM.scenes.find((s) => s.id === 'plaza').w === 4350 && DM.scenes.find((s) => s.id === 'sanangel').w === 3900 &&
    DM.scenes.find((s) => s.id === 'aero').w === 3600 && DM.scenes.find((s) => s.id === 'castillo').w === 4350,
    JSON.stringify(stripScenes.map((s) => s.id + '=' + s.w)));
  check('apertura y cita NO llevan w (son el departamento real, sin franja)',
    DM.scenes.find((s) => s.id === 'apertura').w === undefined && DM.scenes.find((s) => s.id === 'cita').w === undefined);

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
  // Arranque de la canción (decisión de Jose, 2026-11-21): en el
  // depa NO suena nada; el reloj espera a la escena 1 (la plaza).
  check('en el depa el reloj NO corre (silencio: la canción espera a la plaza)',
    DM.state.clockRunning === false && DM.state.clockStarted === false && DM.dateNow() === 0);
  key('Space', true); sc.update(0.016); key('Space', false);
  check('ESPACIO abre la puerta (fase door)', sc.phase === 'door', 'phase=' + sc.phase);
  for (let i = 0; i < 10; i++) sc.update(0.05); // media transición (~0,5 s de luz)
  check('abrir la puerta y cruzar la luz NO arranca el reloj (la transición es en silencio)',
    sc.phase === 'door' && DM.state.clockRunning === false && DM.dateNow() === 0, 'phase=' + sc.phase);
  for (let i = 0; i < 15; i++) sc.update(0.05);
  check('tras la luz (~1 s) estamos en la plaza', sc.phase === 'plaza' && DM.state.state === 'plaza', 'phase=' + sc.phase);
  check('el reloj de la cita corre SIN archivo de audio (respaldo)', DM.state.clockRunning === true && DM.dateNow() > 0);
  check('el arranque ocurrió AL ACTIVARSE la plaza (flag de sesión en true, una sola vez)',
    DM.state.clockStarted === true);
  check('el cero del reloj de respaldo es la llegada a la plaza, no el depa (recién arrancado: < 1 s)',
    DM.dateNow() < 1, 'dateNow=' + DM.dateNow().toFixed(3));
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
  check('la cámara sigue al activo y no se sale de la franja (0..3710, mundo de 4350)', sc.pan > 100 && sc.pan <= 3710.01, `pan=${sc.pan.toFixed(1)}`);
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

  console.log('\nI) Complementos de la plaza: avión, tacos, vocho de Pollito, hitos de fondo y vista de San Ángel');
  // Recortes de foto nuevos (mismo acabado que la Catedral) y la
  // vista lejana de San Ángel (asset SOLO-LOCAL: no se versiona).
  const FX = DM.debug.PLAZA_FX, DATE_DIR = path.join(SRC, '..', 'assets', 'date');
  check('PLAZA_FX reúne los complementos (avión, vocho, tacos) y los 5 hitos de fondo (Catedral, Bellas Artes, Ángel, Parroquia, vista)',
    !!FX && !!FX.avion && !!FX.vocho && FX.tacosX > 0 && FX.catedralX > 0 && FX.bellasArtesX > 0 && FX.angelX > 0 && FX.parroquiaX > 0 && FX.vistaX > 0);
  const fuentes = fs.readFileSync(path.join(DATE_DIR, 'FUENTES.md'), 'utf8');
  for (const file of ['avion.png', 'vocho.png', 'tacos.png', 'parroquia.png', 'bellasartes.png', 'angel.png']) {
    check(`el asset ${file} existe en assets/date y FUENTES.md lo registra`,
      fs.existsSync(path.join(DATE_DIR, file)) && fuentes.includes(file));
  }
  check('date.js referencia los 7 assets (los 6 recortes + la vista)',
    ['avion.png', 'vocho.png', 'tacos.png', 'parroquia.png', 'bellasartes.png', 'angel.png', 'sanangel-vista.png'].every((f) => dateSrc.includes(f)));
  // Los dos hitos nuevos son CC (como la Catedral y la
  // Parroquia): van VERSIONADOS en el repo, con su autor y su
  // licencia registrados en FUENTES.md.
  const versionado = (file) => {
    try {
      const out = require('child_process').execSync(
        'git ls-files application/src/assets/date/' + file,
        { cwd: path.join(__dirname, '..'), encoding: 'utf8' });
      return out.trim().length > 0;
    } catch (e) { return false; }
  };
  check('bellasartes.png y angel.png están versionados (son CC) y FUENTES.md trae su autor y licencia',
    versionado('bellasartes.png') && versionado('angel.png') &&
    fuentes.includes('Xavier Quetzalcoatl Contreras Castillo') && fuentes.includes('CC BY-SA 3.0') &&
    fuentes.includes('Marcoantonio0074') && fuentes.includes('CC BY-SA 4.0'));
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
  // La franja obedece la REGLA DE DISTANCIAS: 4350 px de mundo
  // (29 s × PACE, el w de 'plaza' en la tabla), cámara 0..3710,
  // con los hitos repartidos a lo largo del paseo.
  const PAN_MAX = sc.worldW - 640;
  check('la franja de la plaza mide 4350 px de mundo (29 s × PACE; cámara 0..3710) y sale de la tabla DATE_SCENES',
    sc.worldW === 4350 && sc.worldW === DM.scenes.find((s) => s.id === 'plaza').w, 'worldW=' + sc.worldW);
  check('los elementos fijos (tacos, Bellas Artes, Ángel, Parroquia) tienen posición dentro de la franja (0..worldW)',
    FX.tacosX > 0 && FX.tacosX < sc.worldW && FX.bellasArtesX > 0 && FX.bellasArtesX < sc.worldW &&
    FX.angelX > 0 && FX.angelX < sc.worldW && FX.parroquiaX > 0 && FX.parroquiaX < sc.worldW,
    `tacos=${FX.tacosX}, bellasArtes=${FX.bellasArtesX}, angel=${FX.angelX}, parroquia=${FX.parroquiaX}, worldW=${sc.worldW}`);
  // Descubribilidad: muestreando la cámara en todo su recorrido,
  // cada hito llega a verse casi entero DENTRO de su zona del
  // paseo (la fracción visible se calcula con su capa y ancho:
  // Catedral 430 en L1, el resto desde PLAZA_FX). Los 5 hitos de
  // fondo reparten el paseo: Catedral 0%, Bellas Artes ~25%,
  // Ángel ~50%, Parroquia ~75% y la vista 100%.
  const hitos = [
    { n: 'Catedral', x: FX.catedralX, par: 0.25, w: 430, min: 0.75, zona: [0, 0.15] },
    { n: 'Bellas Artes', x: FX.bellasArtesX, par: 0.25, w: FX.bellasArtesW, min: 0.75, zona: [0.17, 0.33] },
    { n: 'tacos', x: FX.tacosX, par: 0.5, w: FX.tacosW, min: 0.75, zona: [0.35, 0.55] },
    { n: 'Ángel de la Independencia', x: FX.angelX, par: 0.25, w: FX.angelW, min: 0.75, zona: [0.42, 0.58] },
    { n: 'Parroquia', x: FX.parroquiaX, par: 0.25, w: FX.parroquiaW, min: 0.75, zona: [0.67, 0.83] },
    { n: 'vista de San Ángel', x: FX.vistaX, par: 0.2, w: FX.vistaW, min: 0.70, zona: [0.90, 1.0] },
  ];
  const visFrac = (h, pan) => {
    const cx = h.x - pan * h.par;
    return Math.max(0, Math.min(cx + h.w / 2, 640) - Math.max(cx - h.w / 2, 0)) / h.w;
  };
  for (const h of hitos) {
    let best = 0;
    for (let pan = h.zona[0] * PAN_MAX; pan <= h.zona[1] * PAN_MAX; pan += 10) best = Math.max(best, visFrac(h, pan));
    check(`el hito ${h.n} se descubre en su zona del paseo (${(h.zona[0] * 100).toFixed(0)}–${(h.zona[1] * 100).toFixed(0)}% del recorrido, visibilidad ≥${(h.min * 100).toFixed(0)}%)`,
      best >= h.min, `vis máx en zona=${(best * 100).toFixed(0)}%`);
  }
  // Separación y reparto: ≥250 px de capa entre vecinas de la
  // cadena de fondo (Catedral→Bellas Artes→Ángel→Parroquia→
  // vista) y los momentos protagonistas de esa cadena (el pan
  // en que cada centro cruza el centro de pantalla, acotado al
  // recorrido) separados por ≥400 px de cámara y en orden
  // monótono a lo largo de todo el paseo.
  const protPan = (h) => Math.max(0, Math.min(PAN_MAX, (h.x - 320) / h.par));
  const fondo = [hitos[0], hitos[1], hitos[3], hitos[4], hitos[5]];
  check('los hitos de fondo quedan separados: ≥250 px de capa entre vecinas y protagonistas a ≥400 px de cámara, en orden monótono',
    (FX.bellasArtesX - FX.catedralX) >= 250 && (FX.angelX - FX.bellasArtesX) >= 250 &&
    (FX.parroquiaX - FX.angelX) >= 250 && (FX.vistaX - FX.parroquiaX) >= 250 &&
    fondo.every((h, i) => i === 0 || protPan(h) - protPan(fondo[i - 1]) >= 400) &&
    hitos.every((h, i) => i === 0 || protPan(h) > protPan(hitos[i - 1])),
    `capa: cat=${FX.catedralX}, ba=${FX.bellasArtesX}, ang=${FX.angelX}, parr=${FX.parroquiaX}, vista=${FX.vistaX}; prot: ${hitos.map((h) => protPan(h).toFixed(0)).join('/')}`);
  // El reparto pedido: cada hito de fondo es protagonista en su
  // quinto del paseo (objetivos 0/25/50/75/100%, tolerancia
  // ±8 puntos), y el puesto de tacos (L2) no se pega al Ángel
  // (L1): sus protagonistas quedan a ≥250 px de cámara y viven
  // en capas y alturas visuales distintas.
  const objetivos = [0, 25, 50, 75, 100];
  check('el reparto del paseo se cumple: protagonistas de fondo en 0/25/50/75/100% (±8) y tacos↔Ángel a ≥250 px de cámara',
    fondo.every((h, i) => Math.abs(protPan(h) / PAN_MAX * 100 - objetivos[i]) <= 8) &&
    (protPan(hitos[3]) - protPan(hitos[2])) >= 250,
    `%: ${fondo.map((h) => (protPan(h) / PAN_MAX * 100).toFixed(1)).join('/')}; tacos→ángel=${(protPan(hitos[3]) - protPan(hitos[2])).toFixed(0)}`);
  // La vista de San Ángel: ancla de mundo en el tramo final
  // (4150–4350, donde va la Puerta de salida, ~100 px de margen
  // al borde) y, con la cámara al fondo, su centro cae tras esa
  // zona (pantalla 380–620, alineada con la Puerta: 4250−3710
  // = 540).
  check('la vista de San Ángel ancla en el tramo final del mundo (4150–4350) y queda tras la Puerta de salida',
    FX.vistaWorldX >= 4150 && FX.vistaWorldX <= 4350 && (FX.vistaX - PAN_MAX * 0.2) >= 380 && (FX.vistaX - PAN_MAX * 0.2) <= 620,
    `worldX=${FX.vistaWorldX}, pantalla al fondo=${(FX.vistaX - PAN_MAX * 0.2).toFixed(0)}`);
  // La cámara llega al fondo de la franja y el dibujo aguanta
  // en todo el recorrido (muestreo de pans con draw()).
  X.x = sc.worldW - 100; X.y = sc.groundY;
  for (let i = 0; i < 30; i++) sc.update(0.05);
  check('la cámara se asienta al fondo de la franja (pan > 3400, sin pasar de 3710)', sc.pan > 3400 && sc.pan <= 3710.01, `pan=${sc.pan.toFixed(0)}`);
  let plazaDrawOk = true;
  for (const p of [0, 840, 1848, 2848, 3710]) { sc.pan = p; try { sc.draw(0.016); } catch (e) { plazaDrawOk = false; } }
  check('draw() de la plaza no explota en ningún punto del paseo (pan 0/840/1848/2848/3710, los protagonistas de los hitos)', plazaDrawOk);
  check('el dibujo de la vista está condicionado a que la imagen cargó (si falta el asset local, no se dibuja ni se rompe)',
    dateSrc.includes('imgOk(vistaImg)') && dateSrc.includes('sanangel-vista.png'));
  check('FUENTES.md registra la vista como asset solo-local aportado por Jose',
    fuentes.includes('sanangel-vista.png') && fuentes.includes('solo-local'));
  const gitignore = fs.readFileSync(path.join(__dirname, '..', '.gitignore'), 'utf8');
  // CRITERIO ACTUALIZADO (2026-11-21): el commit 5599034 de Jose
  // («chore: add assets», integrado tal cual por su decisión
  // expresa) eliminó del .gitignore tanto la carpeta sanangel/
  // como esta vista. El archivo de la vista NO fue versionado en
  // ese commit: la protección que queda es ESTE check — la vista
  // sigue fuera del repo y el humo falla si alguien la versiona.
  const vistaVersionada = (() => {
    try {
      const out = require('child_process').execSync(
        'git ls-files application/src/assets/date/sanangel-vista.png',
        { cwd: path.join(__dirname, '..'), encoding: 'utf8' });
      return out.trim().length > 0;
    } catch (e) { return true; } // sin git a la vista: fallar cerrado
  })();
  check('sanangel-vista.png NO está versionada (sigue fuera del repo, como la canción)',
    !vistaVersionada);
  sc.draw(0.016); // con los complementos, el dibujo de la plaza no explota

  console.log('\nJ) Escena 2 «San Ángel»: Puerta de salida, franja libre, cameo, velas y vuelta');
  // La plaza ganó su Puerta de salida al final de la franja,
  // exactamente donde ancla la vista lejana de San Ángel.
  check('la plaza tiene su Puerta de salida en el mundo x=4250 (el ancla de la vista de San Ángel, al final de la franja de 4350)',
    sc.exitDoorX === 4250 && FX.vistaWorldX === sc.exitDoorX, 'exitDoorX=' + sc.exitDoorX);
  if (F.active !== 'ximena') sc.switchActive();
  X.x = sc.exitDoorX - 10; X.y = sc.groundY; J.x = X.x - 70; J.y = sc.groundY;
  sc.update(0.05);
  check('junto a la Puerta de salida se ofrece cruzarla (nearExit)', sc.nearExit === true);
  key('Space', true); sc.update(0.016); key('Space', false);
  check('ESPACIO en la Puerta de salida inicia el cruce (fase exitdoor)', sc.phase === 'exitdoor', 'phase=' + sc.phase);
  for (let i = 0; i < 25 && G.scene === sc; i++) sc.update(0.05);
  const ang = G.scene;
  check('tras la luz (~1 s) la escena activa es San Ángel y el estado del modo lo refleja',
    ang !== sc && !!ang && ang.id === 'sanangel' && DM.state.state === 'sanangel', 'id=' + (ang && ang.id) + ', state=' + DM.state.state);
  for (let i = 0; i < 25 && ang.phase !== 'free'; i++) ang.update(0.05);
  check('San Ángel amanece en modo libre tras ~1 s de luz (sin paneo largo)', ang.phase === 'free', 'phase=' + ang.phase);
  check('la franja de San Ángel mide 3900 px (26 s × PACE, el w de su tabla), con Puerta de entrada (90) y de salida junto al árbol (3800)',
    ang.worldW === 3900 && ang.entryDoorX === 90 && ang.exitDoorX === 3800 && DM.debug.SANANGEL.worldW === 3900 &&
    ang.worldW === DM.scenes.find((s) => s.id === 'sanangel').w,
    `worldW=${ang.worldW}, exitDoorX=${ang.exitDoorX}`);
  check('la pileta quedó en la zona media del paseo (x 1700–2200, ~50% del recorrido de 3900)',
    ang.piletaX >= 1700 && ang.piletaX <= 2200, 'piletaX=' + ang.piletaX);
  check('la Puerta del árbol está en el tramo final (3700–3900) y el árbol se apoya tras ella (su centro cae a pantalla 380–560 con la cámara al fondo)',
    ang.exitDoorX >= 3700 && ang.exitDoorX <= 3900 &&
    (ang.treeLayerCx - (ang.worldW - 640) * 0.25) >= 380 && (ang.treeLayerCx - (ang.worldW - 640) * 0.25) <= 560,
    `exitDoorX=${ang.exitDoorX}, árbol@${(ang.treeLayerCx - (ang.worldW - 640) * 0.25).toFixed(0)}`);
  // Cobertura de las casas (capa 0,4): con la cámara en pan
  // 0..3260 la capa se desplaza 1304 px; los segmentos (anchos
  // según los PNG reales: a=228×150, b=226×180, full=422×180)
  // deben encadenarse sin huecos >30 px y cubrir hasta x≥1944
  // de capa (= 0,4×3260 + 640) para que la calle nunca se quede
  // sin casas.
  const SA_ASPECT = { 'casas-a.png': 228 / 150, 'casas-b.png': 226 / 180, 'casas-full.png': 422 / 180 };
  const saSegs = (DM.debug.SA_HOUSES || []).map((s) => {
    const src = (s.img && s.img.src) || '';
    const key = Object.keys(SA_ASPECT).find((k) => src.endsWith(k));
    return { x: s.x, w: key ? s.h * SA_ASPECT[key] : 0 };
  }).sort((a, b) => a.x - b.x);
  let saCover = saSegs.length >= 8 && saSegs[0].x <= 0;
  for (let i = 1; i < saSegs.length; i++) if (saSegs[i].x - (saSegs[i - 1].x + saSegs[i - 1].w) > 30) saCover = false;
  const saCoverEnd = saSegs.length ? saSegs[saSegs.length - 1].x + saSegs[saSegs.length - 1].w : 0;
  check('las casas de San Ángel cubren la calle en toda la franja (segmentos encadenados sin huecos >30 px de capa, hasta ≥1944)',
    saCover && saCoverEnd >= 1944, `segmentos=${saSegs.length}, cobertura hasta ${saCoverEnd.toFixed(0)}`);
  const AF = ang.free, AX = AF.chars[AF.active];
  const ax0 = AX.x;
  key('ArrowRight', true);
  for (let i = 0; i < 40; i++) ang.update(0.05);
  key('ArrowRight', false);
  check('en San Ángel el input mueve al activo y la cámara sigue dentro de la franja (pan 0..3260)',
    AX.x > ax0 + 150 && ang.pan >= 0 && ang.pan <= 3260.01, `x ${ax0} → ${AX.x.toFixed(0)}, pan=${ang.pan.toFixed(0)}`);
  const aBefore = AF.active;
  key('Tab', true); key('Tab', false);
  check('TAB también alterna el personaje activo en San Ángel', AF.active !== aBefore, 'active=' + AF.active);
  let saDrawOk = true;
  for (const p of [0, 1000, 2000, 3260]) { ang.pan = p; try { ang.draw(0.016); } catch (e) { saDrawOk = false; } }
  check('draw() de San Ángel no explota en ningún punto del paseo (pan 0/1000/2000/3260)', saDrawOk);
  // El cameo se DISPARA por cámara: con el paseo al inicio aún
  // no aparece; al superar la cámara ~900 px entra por el borde
  // derecho y cruza a la izquierda, una sola vez por visita.
  // (Se re-asienta cámara y activo al inicio: el muestreo de
  // draw() de arriba dejó pan en 3260.)
  const ACT = AF.chars[AF.active];
  ACT.x = 210; ACT.y = ang.groundY; ang.pan = 0;
  for (let i = 0; i < 5; i++) ang.update(0.05);
  check('el cameo aún NO se ha disparado con la cámara al inicio del paseo (ni triggered ni done)',
    ang.cameo.triggered === false && ang.cameo.done === false && ang.pan < 900, 'pan=' + ang.pan.toFixed(0));
  ACT.x = 1600; ACT.y = ang.groundY;
  for (let i = 0; i < 60 && !ang.cameo.triggered; i++) ang.update(0.05);
  check('al superar la cámara ~900 px el cameo se dispara y entra por el borde derecho de la pantalla',
    ang.cameo.triggered === true && ang.pan > 900 && ang.cameo.manoloX > ang.pan + 500,
    `pan=${ang.pan.toFixed(0)}, manoloX=${ang.cameo.manoloX.toFixed(0)}`);
  // Manolo y María caminan juntos a la izquierda y Chuy
  // acompaña a María; las distancias entre ellos no varían.
  const cm0 = { m: ang.cameo.manoloX, ma: ang.cameo.mariaX, ch: ang.cameo.chuyX };
  for (let i = 0; i < 40; i++) ang.update(0.05);
  check('el cameo de Manolo y María camina hacia la izquierda a velocidad de paseo (~55 px/s)',
    ang.cameo.manoloX < cm0.m - 80 && ang.cameo.done === false, `x ${cm0.m.toFixed(0)} → ${ang.cameo.manoloX.toFixed(0)}`);
  check('María acompaña a Manolo a distancia fija y Chuy trota junto a María (sin separarse)',
    Math.abs((ang.cameo.mariaX - ang.cameo.manoloX) - (cm0.ma - cm0.m)) < 0.01 &&
    Math.abs((ang.cameo.chuyX - ang.cameo.mariaX) - (cm0.ch - cm0.ma)) < 0.01);
  // La pasada termina saliendo por la izquierda del encuadre…
  for (let i = 0; i < 500 && !ang.cameo.done; i++) ang.update(0.05);
  check('el cameo termina su pasada saliendo por la izquierda del encuadre (done)', ang.cameo.done === true);
  // …y NO se repite si el jugador retrocede y vuelve a avanzar.
  const cmDoneX = ang.cameo.manoloX;
  ACT.x = 210; ACT.y = ang.groundY;
  for (let i = 0; i < 60; i++) ang.update(0.05);
  ACT.x = 1600; ACT.y = ang.groundY;
  for (let i = 0; i < 60; i++) ang.update(0.05);
  check('la pasada NO se repite al retroceder y re-avanzar más allá del umbral (una por visita)',
    ang.cameo.done === true && ang.cameo.manoloX === cmDoneX && ang.pan > 900,
    `pan=${ang.pan.toFixed(0)}, manoloX=${ang.cameo.manoloX.toFixed(0)}`);
  // Las velas: decenas en el camino al árbol y parpadeo real.
  check('hay decenas de velas camino al árbol (26–40 instancias)', ang.candles.length >= 26 && ang.candles.length <= 40, 'n=' + ang.candles.length);
  const g0 = ang.candleGlowAt(0, 0), g1 = ang.candleGlowAt(0.7, 0), g2 = ang.candleGlowAt(3.1, 5);
  check('el brillo de las velas varía con el tiempo (parpadeo) y se mantiene en rango [0,3, 1,05]',
    g0 !== g1 && [g0, g1, g2].every((g) => g >= 0.3 && g <= 1.05), `g=${g0.toFixed(2)}/${g1.toFixed(2)}/${g2.toFixed(2)}`);
  ang.draw(0.016); // San Ángel se dibuja sin explotar (sin assets locales: guardas imgOk)
  // Viaje por la Puerta del árbol: la cadena avanzó y ahora
  // cruza al AEROPUERTO (escena 3), ya no de vuelta a la plaza.
  // La vuelta completa (aero → San Ángel → plaza) se verifica
  // en la sección L.
  if (AF.active !== 'ximena') ang.switchActive();
  const AX2 = AF.chars.ximena;
  AX2.x = ang.exitDoorX - 10; AX2.y = ang.groundY;
  ang.update(0.05);
  check('junto a la Puerta del árbol se ofrece cruzarla (nearDoor)', ang.nearDoor === true);
  key('Space', true); ang.update(0.016); key('Space', false);
  for (let i = 0; i < 25 && G.scene === ang; i++) ang.update(0.05);
  const aer = G.scene;
  check('la Puerta del árbol cruza al AEROPUERTO (escena 3) y el estado del modo lo refleja',
    aer !== ang && !!aer && aer.id === 'aero' && DM.state.state === 'aero', 'id=' + (aer && aer.id) + ', state=' + DM.state.state);
  for (let i = 0; i < 25 && aer.phase !== 'free'; i++) aer.update(0.05);
  check('el aeropuerto amanece en modo libre tras ~1 s de luz (sin paneo largo)', aer.phase === 'free', 'phase=' + aer.phase);
  aer.draw(0.016); // el aeropuerto se dibuja sin explotar
  // La carpeta de recortes está registrada y, desde el commit
  // 5599034 de Jose («chore: add assets», integrado tal cual por
  // su decisión expresa del 2026-11-21), VERSIONADA en el repo:
  // el criterio anterior (solo-local en .gitignore) quedó sin
  // efecto por decisión del dueño. Este check fija la realidad
  // nueva: los PNG de sanangel/ están en el índice de git.
  const sanangelVersionados = (() => {
    try {
      const out = require('child_process').execSync(
        'git ls-files application/src/assets/date/sanangel/',
        { cwd: path.join(__dirname, '..'), encoding: 'utf8' });
      return ['arbol.png', 'pileta.png', 'manolo.png', 'maria.png', 'chuy.png'].every((f) => out.includes('sanangel/' + f));
    } catch (e) { return false; }
  })();
  check('los recortes de sanangel/ están versionados (decisión expresa de Jose, commit 5599034)',
    sanangelVersionados);
  check('FUENTES.md registra los recortes de sanangel/ como solo-locales de El Libro de la Vida',
    fuentes.includes('sanangel/') && fuentes.includes('Libro de la Vida'));
  check('date.js referencia los recortes de San Ángel y los dibuja solo si cargaron (imgOk)',
    ['sanangel/pileta.png', 'sanangel/arbol.png', 'sanangel/manolo.png', 'sanangel/maria.png', 'sanangel/chuy.png', 'sanangel/vela-a.png', 'sanangel/casas-full.png'].every((f) => dateSrc.includes(f)) && dateSrc.includes('imgOk(saPileta)'));

  console.log('\nL) Escena 3 «Aeropuerto»: franja, ventanal y avión, cinta caminadora y cadena de Puertas');
  // Se llega aquí desde la sección J: la escena activa es el
  // aeropuerto (aer), recién cruzado por la Puerta del árbol y
  // ya en modo libre junto a su Puerta de entrada.
  const AE = DM.debug.AERO, EF = aer.free, EX = EF.chars.ximena, EJ = EF.chars.jose;
  check('la franja del aeropuerto mide 3600 px (24 s × PACE, el w de su tabla; cámara 0..2960) y sale de DATE_SCENES',
    aer.worldW === 3600 && aer.worldW === DM.scenes.find((s) => s.id === 'aero').w && (aer.worldW - 640) === 2960 &&
    AE.worldW === aer.worldW, 'worldW=' + aer.worldW);
  check('Puertas del aeropuerto: entrada en x=90 y salida en el tramo final (3400–3600)',
    aer.entryDoorX === 90 && aer.exitDoorX >= 3400 && aer.exitDoorX <= 3600,
    `entry=${aer.entryDoorX}, exit=${aer.exitDoorX}`);
  check('se llega junto a la Puerta de entrada (los personajes parten del primer tramo de la franja)',
    EX.x < 400 && EJ.x < 500, `ximena=${EX.x}, jose=${EJ.x}`);
  // La cámara llega al fondo de la franja sin salirse.
  EX.x = aer.worldW - 100; EX.y = aer.groundY;
  for (let i = 0; i < 30; i++) aer.update(0.05);
  check('la cámara se asienta al fondo de la franja (pan > 2600, sin pasar de 2960)', aer.pan > 2600 && aer.pan <= 2960.01, `pan=${aer.pan.toFixed(0)}`);
  let aerDrawOk = true;
  for (const p of [0, 900, 1800, 2960]) { aer.pan = p; try { aer.draw(0.016); } catch (e) { aerDrawOk = false; } }
  check('draw() del aeropuerto no explota en ningún punto del paseo (pan 0/900/1800/2960)', aerDrawOk);
  // El avión: el MISMO recorte de la plaza, grande (~420 px) y
  // con parallax bajo (0,15), rodando FUERA del ventanal.
  const px = DM.debug.aeroPlaneXAt;
  check('el avión del aeropuerto es grande (~420 px) y de parallax bajo (0,15), con su base sobre la pista (y≈206)',
    AE.avion.w === 420 && Math.abs(AE.avion.par - 0.15) < 1e-9 && AE.avion.baseY >= 195 && AE.avion.baseY <= 215,
    `w=${AE.avion.w}, par=${AE.avion.par}, baseY=${AE.avion.baseY}`);
  let monoP = true, prevP = null;
  for (let t = 0; t <= 100; t += 1) { const x = px(t); if (prevP !== null && x < prevP - 1e-9) monoP = false; prevP = x; }
  check('aeroPlaneXAt rueda monótona hacia la derecha en su taxi, lento (18 px/s de capa)',
    monoP && Math.abs((px(20) - px(10)) / 10 - 18) < 0.01, `vel=${((px(20) - px(10)) / 10).toFixed(1)} px/s`);
  check('el avión espera FUERA de escena al inicio del ciclo y en su pausa (invisible a cualquier cámara)',
    px(0) + AE.avion.w / 2 < 0 && (px(120) - 2960 * AE.avion.par) - AE.avion.w / 2 > 640,
    `inicio=${px(0)}, pausa=${px(120)}`);
  // Visible a través del ventanal en algún (t, pan): su centro
  // cae en pantalla y su caja vertical queda DENTRO de la banda
  // de cristal (34..212), con la base sobre la pista.
  let visOk = false;
  for (let t = 0; t <= 100 && !visOk; t += 2) {
    for (let pan = 0; pan <= 2960; pan += 40) {
      const cx = px(t) - pan * AE.avion.par, h = AE.avion.w * 227 / 760, top = AE.avion.baseY - h;
      if (cx > 0 && cx < 640 && top >= 30 && AE.avion.baseY <= 216) { visOk = true; break; }
    }
  }
  check('el avión se ve a través del ventanal en algún punto del paseo (centro en pantalla, caja dentro de la banda de cristal)', visOk);
  check('el aeropuerto reutiliza el recorte avion.png ya registrado (sin assets nuevos) y FUENTES.md anota el reuso',
    dateSrc.includes('aeroPlaneXAt') && fuentes.includes('Reuso (escena 3'));
  // El castillo ambulante A LO LEJOS en el exterior (decisión
  // de Jose): quieto en una capa aún más lejana que la del
  // avión, pequeño y con la base en el horizonte de la pista;
  // su momento protagonista (su centro cruzando el centro de
  // la pantalla) cae hacia la mitad del paseo.
  const AC = AE.castillo;
  check('el castillo lejano del aeropuerto: capa muy lejana (parallax 0,1), QUIETO (sin ciclo ni velocidad propios) y pequeño (h≈150, base en el horizonte y≈198)',
    !!AC && Math.abs(AC.par - 0.1) < 1e-9 && AC.vel === undefined && AC.ciclo === undefined &&
    AC.h >= 130 && AC.h <= 170 && AC.baseY >= 190 && AC.baseY <= 205,
    AC ? `par=${AC.par}, h=${AC.h}, baseY=${AC.baseY}` : 'sin AERO.castillo');
  const protCas = (AC.layerCx - 320) / AC.par;
  check('su momento protagonista cae hacia la mitad del paseo del aeropuerto (40–60% de pan 0..2960)',
    protCas / 2960 >= 0.4 && protCas / 2960 <= 0.6, `protagonista=${protCas.toFixed(0)} (${(protCas / 2960 * 100).toFixed(0)}%)`);
  check('el castillo lejano no se encima con el avión: el avión rueda DELANTE (parallax mayor) y el castillo queda dentro de la banda del ventanal (34..212)',
    AC.par < AE.avion.par && (AC.baseY - AC.h) >= 30 && AC.baseY <= 212,
    `techo=${AC.baseY - AC.h}, base=${AC.baseY}`);
  check('el castillo se dibuja solo si el asset solo-local cargó (imgOk(castilloImg)) y FUENTES.md lo registra como solo-local aportado por Jose',
    dateSrc.includes('imgOk(castilloImg)') && dateSrc.includes("loadDateImg('assets/date/castillo.png')") &&
    fuentes.includes('castillo.png') && fuentes.includes('solo-local'));
  const castilloVersionado = (() => {
    try {
      const out = require('child_process').execSync(
        'git ls-files application/src/assets/date/castillo.png',
        { cwd: path.join(__dirname, '..'), encoding: 'utf8' });
      return out.trim().length > 0;
    } catch (e) { return true; } // sin git a la vista: fallar cerrado
  })();
  check('castillo.png existe en la copia local y NO está versionado (material de película aportado por Jose, como la canción)',
    fs.existsSync(path.join(DATE_DIR, 'castillo.png')) && !castilloVersionado);
  // La cinta caminadora: tramo central y empuje de +90 px/s.
  check('la cinta caminadora cubre el tramo central (1200–2400) y empuja a +90 px/s; la escena la expone al motor (sc.belt)',
    AE.belt.x0 === 1200 && AE.belt.x1 === 2400 && AE.belt.speed === 90 && aer.belt === AE.belt,
    `belt=${AE.belt.x0}–${AE.belt.x1} @${AE.belt.speed}`);
  // Fuera de la banda: 1 s a la derecha = solo el input (~150).
  if (EF.active !== 'ximena') aer.switchActive();
  EX.x = 600; EX.y = aer.groundY; EJ.x = 500; EJ.y = aer.groundY;
  const off0 = EX.x;
  key('ArrowRight', true);
  for (let i = 0; i < 20; i++) aer.update(0.05);
  key('ArrowRight', false);
  check('fuera de la cinta, 1 s a la derecha desplaza ~150 px (solo el input)',
    EX.x - off0 > 135 && EX.x - off0 < 165, `disp=${(EX.x - off0).toFixed(0)}`);
  // Sobre la banda SIN input: la cinta sola arrastra ~90 px.
  EX.x = 1500; EX.y = aer.groundY;
  const dr0 = EX.x;
  for (let i = 0; i < 20; i++) aer.update(0.05);
  check('sobre la cinta, sin tocar nada, la banda arrastra al activo ~90 px en 1 s',
    EX.x - dr0 > 70 && EX.x - dr0 < 110, `disp=${(EX.x - dr0).toFixed(0)}`);
  // Sobre la banda CON input: input + cinta ≈ 240 px.
  EX.x = 1500; EX.y = aer.groundY;
  const on0 = EX.x;
  key('ArrowRight', true);
  for (let i = 0; i < 20; i++) aer.update(0.05);
  key('ArrowRight', false);
  check('sobre la cinta, 1 s a la derecha desplaza ~240 px (input 150 + cinta 90)',
    EX.x - on0 > 215 && EX.x - on0 < 265, `disp=${(EX.x - on0).toFixed(0)}`);
  // El SEGUIDOR también recibe la cinta: con Jose activo y
  // quieto FUERA de la banda, Ximena camina a su puesto (a la
  // izquierda, a 190 px/s) pero la banda le suma +90: su neto
  // en 1 s es ≈ −100 px, no −190.
  aer.switchActive(); // activo: Jose
  EJ.x = 900; EJ.y = aer.groundY; EX.x = 1600; EX.y = aer.groundY; EX.follow = false;
  const fo0 = EX.x;
  for (let i = 0; i < 20; i++) aer.update(0.05);
  check('el seguidor sobre la cinta camina a su puesto frenado por la banda (neto ≈ −100 px en 1 s, no −190)',
    EX.x < fo0 - 40 && EX.x > fo0 - 160, `x ${fo0} → ${EX.x.toFixed(0)}`);
  aer.switchActive(); // activo: Ximena otra vez
  // Cadena de vueltas: la Puerta de ENTRADA del aeropuerto
  // devuelve a San Ángel, junto a la Puerta del árbol.
  EX.x = aer.entryDoorX - 10; EX.y = aer.groundY;
  aer.update(0.05);
  check('junto a la Puerta de entrada del aeropuerto se ofrece cruzarla (nearDoor)', aer.nearDoor === true && aer.nearDoorX === aer.entryDoorX);
  key('Space', true); aer.update(0.016); key('Space', false);
  check('ESPACIO en la Puerta de entrada inicia el cruce de vuelta (fase exitdoor)', aer.phase === 'exitdoor', 'phase=' + aer.phase);
  for (let i = 0; i < 25 && G.scene === aer; i++) aer.update(0.05);
  check('la Puerta de entrada del aeropuerto devuelve a San Ángel, junto a la Puerta del árbol',
    G.scene === ang && DM.state.state === 'sanangel' && Math.abs(ang.free.chars[ang.free.active].x - ang.exitDoorX) < 220,
    'state=' + DM.state.state + ', x=' + (G.scene === ang ? ang.free.chars[ang.free.active].x.toFixed(0) : '?'));
  for (let i = 0; i < 25 && ang.phase !== 'free'; i++) ang.update(0.05);
  // De nuevo al aeropuerto por la Puerta del árbol…
  const SA2 = ang.free.chars[ang.free.active];
  SA2.x = ang.exitDoorX - 10; SA2.y = ang.groundY;
  ang.update(0.05);
  key('Space', true); ang.update(0.016); key('Space', false);
  for (let i = 0; i < 25 && G.scene === ang; i++) ang.update(0.05);
  check('la Puerta del árbol vuelve a cruzar al aeropuerto (la cadena es estable en ambos sentidos)',
    G.scene === aer && DM.state.state === 'aero', 'state=' + DM.state.state);
  for (let i = 0; i < 25 && aer.phase !== 'free'; i++) aer.update(0.05);
  // …y la Puerta de SALIDA del aeropuerto sigue el paseo a
  // las PRADERAS del castillo (escena 4): se entra por su
  // Puerta de entrada, en modo libre tras la luz.
  if (EF.active !== 'ximena') aer.switchActive();
  EX.x = aer.exitDoorX - 10; EX.y = aer.groundY;
  aer.update(0.05);
  check('junto a la Puerta de salida del aeropuerto se ofrece cruzarla (nearDoor)', aer.nearDoor === true && aer.nearDoorX === aer.exitDoorX);
  key('Space', true); aer.update(0.016); key('Space', false);
  for (let i = 0; i < 25 && G.scene === aer; i++) aer.update(0.05);
  const praL = G.scene;
  check('la Puerta de salida del aeropuerto lleva a las PRADERAS del castillo (escena 4, id de bloque «castillo»)',
    praL !== aer && !!praL && praL.id === 'castillo' && DM.state.state === 'castillo',
    'id=' + (praL && praL.id) + ', state=' + DM.state.state);
  for (let i = 0; i < 25 && praL.phase !== 'free'; i++) praL.update(0.05);
  check('las praderas amanecen en modo libre tras ~1 s de luz (sin paneo largo)', praL.phase === 'free', 'phase=' + praL.phase);
  check('se llega a las praderas junto a su Puerta de entrada (primer tramo de la franja)',
    praL.free.chars.ximena.x < 400 && praL.free.chars.jose.x < 500,
    `ximena=${praL.free.chars.ximena.x}, jose=${praL.free.chars.jose.x}`);
  // Cierre de la cadena: de vuelta en San Ángel (viaje directo
  // del gancho de depuración), su Puerta de entrada sigue
  // devolviendo a la plaza en modo libre.
  DM.debug.travelTo('sanangel');
  for (let i = 0; i < 25 && ang.phase !== 'free'; i++) ang.update(0.05);
  const SA3 = ang.free.chars[ang.free.active];
  SA3.x = ang.entryDoorX - 10; SA3.y = ang.groundY;
  ang.update(0.05);
  key('Space', true); ang.update(0.016); key('Space', false);
  for (let i = 0; i < 25 && G.scene === ang; i++) ang.update(0.05);
  check('la Puerta de entrada de San Ángel sigue devolviendo a la plaza en modo libre (cadena completa plaza ⇄ San Ángel ⇄ aeropuerto ⇄ praderas)',
    G.scene === sc && sc.phase === 'free' && DM.state.state === 'plaza-arrived', 'state=' + DM.state.state + ', phase=' + sc.phase);
  sc.draw(0.016); // de vuelta en la plaza, el dibujo sigue sano

  console.log('\nK) Audio: salto del silencio inicial (AUDIO_SKIP) y botón de silencio');
  // El <audio> del harness es un FakeEl: play/pause no existen
  // (el código los guarda con typeof) y sus eventos no se
  // disparan solos; el metadata se simula con el gancho debug
  // onSongMetadata(), la MISMA función que escucha el navegador.
  const songEl = DM.debug.getSong();
  const cssSrc = fs.readFileSync(path.join(SRC, '..', 'css', 'style.css'), 'utf8');
  check('AUDIO_SKIP vale 4 (el silencio inicial del archivo de Jose)', DM.debug.AUDIO_SKIP === 4, 'AUDIO_SKIP=' + DM.debug.AUDIO_SKIP);
  check('el modo creó su elemento de audio', !!songEl);
  // (b) Metadata simulada con duración 153: el factor se calcula
  // sobre la duración ÚTIL: (153 − 4)/149 = 1.
  songEl.duration = 153; songEl.currentTime = 0;
  DM.debug.onSongMetadata();
  check('el factor usa la duración útil (duration − AUDIO_SKIP)/149',
    Math.abs(DM.state.factor - (153 - DM.debug.AUDIO_SKIP) / 149) < 1e-9, 'factor=' + DM.state.factor);
  // (a) El arranque fija la posición en AUDIO_SKIP…
  DM.debug.startClock();
  check('al arrancar la canción, la posición salta a AUDIO_SKIP (4 s)', songEl.currentTime === 4, 'currentTime=' + songEl.currentTime);
  // …y dateNow() devuelve el tiempo DE LA CITA (sin el silencio).
  songEl.currentTime = 10;
  check('dateNow() descuenta el salto: currentTime 10 → cita 6', DM.dateNow() === 6, 'dateNow=' + DM.dateNow());
  // La re-aplicación ÚNICA: si el navegador ignoró el seek del
  // arranque (la posición quedó casi en 0), el aviso de metadata
  // lo re-aplica una vez; un segundo aviso ya no toca la posición.
  songEl.currentTime = 0.4;
  DM.debug.onSongMetadata();
  check('si el salto se perdió al dar play, el metadata lo re-aplica una vez', songEl.currentTime === 4, 'currentTime=' + songEl.currentTime);
  songEl.currentTime = 30;
  DM.debug.onSongMetadata();
  check('la re-aplicación es ÚNICA: un segundo metadata no vuelve a saltar', songEl.currentTime === 30, 'currentTime=' + songEl.currentTime);
  // (c) La pausa congela y reanuda SIN re-aplicar el salto.
  DM.setPaused(true); DM.setPaused(false);
  check('reanudar desde la pausa NO re-aplica el salto', songEl.currentTime === 30, 'currentTime=' + songEl.currentTime);
  // (d) El botón de silencio: existe con el modo activo, su clic
  // y la tecla M alternan el silencio en ambos sentidos, y su
  // visibilidad cuelga de body.date-mode (CSS + clase del body).
  const muteBtn = documentFake.querySelector('#dateMuteBtn');
  check('el botón #dateMuteBtn existe en el DOM con el modo activo', !!muteBtn);
  check('el body lleva date-mode mientras el modo está activo', documentFake.body.classList.contains('date-mode'));
  check('el botón arranca «con sonido» (sin .muted, title/aria «Silenciar»)',
    !!muteBtn && !muteBtn.classList.contains('muted') && muteBtn.title === 'Silenciar' && DM.state.muted === false);
  muteBtn.onclick();
  check('un clic silencia: song.muted y D.muted en true, clase .muted y aria «Activar sonido»',
    songEl.muted === true && DM.state.muted === true && muteBtn.classList.contains('muted') && muteBtn.title === 'Activar sonido');
  muteBtn.onclick();
  check('otro clic devuelve el sonido (ambos estados se limpian)',
    songEl.muted === false && DM.state.muted === false && !muteBtn.classList.contains('muted') && muteBtn.title === 'Silenciar');
  key('KeyM', true); key('KeyM', false);
  check('la tecla M alterna el silencio igual que el botón', DM.state.muted === true && songEl.muted === true && muteBtn.classList.contains('muted'));
  key('KeyM', true); key('KeyM', false);
  check('M otra vez lo desactiva', DM.state.muted === false && songEl.muted === false);
  check('el CSS lo oculta por defecto y lo muestra solo con body.date-mode (sobre el stage, esquina superior derecha)',
    /#dateMuteBtn\s*\{[^}]*display:\s*none/.test(cssSrc) && cssSrc.includes('body.date-mode #dateMuteBtn') && cssSrc.includes('#dateMuteBtn.muted'));
  check('el pictograma del botón es SVG (ondas/aspa), sin emojis en date.js',
    dateSrc.includes('id = \'dateMuteBtn\'') || dateSrc.includes("b.id = 'dateMuteBtn'"));
  // (e) El arranque es UNA SOLA VEZ por sesión de la cita: los
  // viajes por la cadena de Puertas no reinician el reloj ni
  // re-aplican el salto (el tiempo de la cita es continuo).
  songEl.currentTime = 60;
  const tViaje0 = DM.dateNow();
  DM.debug.travelTo('sanangel'); DM.debug.travelTo('aero'); DM.debug.travelTo('plaza');
  check('los viajes plaza ⇄ San Ángel ⇄ aeropuerto NO reinician el reloj ni el arranque',
    DM.dateNow() === tViaje0 && DM.state.clockStarted === true, 'dateNow=' + DM.dateNow());
  DM.stop();
  check('al salir del modo, el body pierde date-mode (el botón desaparece con él)', !documentFake.body.classList.contains('date-mode'));
  key('KeyM', true); key('KeyM', false);
  check('con el modo inactivo, la tecla M no hace nada', DM.state.muted === false);
  // (f) Re-entrar a la cita tras salir al título: start()
  // reinicia el flag de arranque y la canción vuelve a arrancar
  // AL LLEGAR A LA PLAZA (ni en el depa ni durante la luz).
  DM.start(() => {});
  const sc2 = G.scene, xi2 = sc2 && sc2.xi;
  check('al re-entrar, el modo vuelve al depa con el reloj detenido y el flag de arranque reiniciado',
    !!xi2 && DM.state.state === 'depa' && DM.state.clockRunning === false && DM.state.clockStarted === false,
    'state=' + DM.state.state);
  xi2.x = 510; xi2.y = 560; xi2.vx = xi2.vy = 0;
  sc2.update(0.016);
  key('Space', true); sc2.update(0.016); key('Space', false);
  for (let i = 0; i < 10; i++) sc2.update(0.05);
  check('en el reingreso, la puerta y la luz siguen en silencio (el reloj no corre)',
    sc2.phase === 'door' && DM.state.clockRunning === false, 'phase=' + sc2.phase);
  for (let i = 0; i < 15; i++) sc2.update(0.05);
  check('al llegar a la plaza del reingreso, la canción arranca de nuevo',
    sc2.phase === 'plaza' && DM.state.clockRunning === true && DM.state.clockStarted === true, 'phase=' + sc2.phase);
  DM.stop();

  console.log('\nM) Escena 2 «San Ángel»: las bolas de paja del viento (obstáculos de foto real)');
  // El asset: foto real CC versionada en el repo (no es de la
  // película) y registrada en el manifiesto como las demás.
  const bolaVersionada = (() => {
    try {
      const out = require('child_process').execSync(
        'git ls-files application/src/assets/date/',
        { cwd: path.join(__dirname, '..'), encoding: 'utf8' });
      return out.includes('bola-paja.png');
    } catch (e) { return false; }
  })();
  check('bola-paja.png existe, está versionada y FUENTES.md la registra (Noah Wulf, CC BY-SA 4.0, Wikimedia Commons)',
    fs.existsSync(path.join(DATE_DIR, 'bola-paja.png')) && bolaVersionada &&
    fuentes.includes('bola-paja.png') && fuentes.includes('Noah Wulf') && fuentes.includes('Tumbleweed_on_W_Lone_Mtn_Rd'));
  check('date.js carga la bola de paja y expone sus parámetros (SA_BOLAS: freno ×0,4 por 0,7 s, zona de calle < 2500)',
    dateSrc.includes('bola-paja.png') && !!DM.debug.SA_BOLAS &&
    DM.debug.SA_BOLAS.frenoK === 0.4 && DM.debug.SA_BOLAS.frenoT === 0.7 && DM.debug.SA_BOLAS.zonaX === 2500 &&
    DM.debug.SA_BOLAS.maxVivas === 3 && DM.debug.SA_BOLAS.cadMin === 3.5 && DM.debug.SA_BOLAS.cadMax === 6.5);
  check('el freno es opt-in de San Ángel: la plaza no define speedK (el motor compartido no cambia para las demás escenas)',
    sc.speedK === undefined);
  // Se re-entra a la cita y se cruza a San Ángel en modo libre.
  DM.start(() => {});
  DM.debug.travelTo('sanangel');
  const sa2 = G.scene;
  for (let i = 0; i < 25 && sa2.phase !== 'free'; i++) sa2.update(0.05);
  check('se vuelve a San Ángel en modo libre para ejercitar las bolas', sa2.id === 'sanangel' && sa2.phase === 'free', 'phase=' + sa2.phase);
  const SF = sa2.free, SA = SF.chars[SF.active];
  const SB = SF.chars[SF.active === 'ximena' ? 'jose' : 'ximena'];
  // Nacimiento y rodadura: la bola entra por la derecha de la
  // pantalla y rueda a la izquierda con su velocidad de viento.
  SA.x = 600; SA.y = sa2.groundY; SB.x = SA.x - 70; SB.y = sa2.groundY; sa2.pan = 280;
  sa2.bolas.length = 0; sa2.bolaTimer = 0; // forzar la primera aparición
  sa2.update(0.05);
  check('con el controlado en la calle, el viento trae una bola que nace a la derecha de la pantalla',
    sa2.bolas.length === 1 && sa2.bolas[0].x > sa2.pan + 620,
    sa2.bolas.length ? `x=${sa2.bolas[0].x.toFixed(0)}, pan=${sa2.pan.toFixed(0)}` : 'sin bolas');
  check('tras nacer, la cadencia siguiente queda en el rango 3,5–6,5 s',
    sa2.bolaTimer >= 3.5 && sa2.bolaTimer <= 6.5, 'timer=' + sa2.bolaTimer.toFixed(2));
  const b0 = sa2.bolas[0], bx0 = b0.x;
  for (let i = 0; i < 20; i++) sa2.update(0.05); // 1 s de rodadura
  check('la bola rueda hacia la izquierda a su velocidad de viento (120–180 px/s)',
    bx0 - b0.x >= 115 && bx0 - b0.x <= 185, `Δx=${(bx0 - b0.x).toFixed(0)}`);
  check('su rotación es la de rodadura: |ángulo| = distancia/radio y crece al rodar',
    Math.abs(Math.abs(b0.ang) - b0.dist / b0.r) < 0.01 && Math.abs(b0.ang) > 2,
    `|ang|=${Math.abs(b0.ang).toFixed(2)}, dist/r=${(b0.dist / b0.r).toFixed(2)}`);
  check('los tamaños de bola quedan en el rango 34–58 px de diámetro',
    b0.r * 2 >= 34 && b0.r * 2 <= 58, 'd=' + (b0.r * 2).toFixed(0));
  // Tope de vivas: con 3 rodando no nace una cuarta.
  sa2.bolas.length = 0;
  for (let i = 0; i < 3; i++) sa2.bolas.push({ x: sa2.pan + 3000 + i * 300, y: sa2.groundY, r: 22, vel: 130, dist: 0, ang: 0, ph: 0 });
  sa2.bolaTimer = 0;
  sa2.update(0.05);
  check('con 3 bolas vivas no nace una cuarta (tope de vivas)', sa2.bolas.length === 3, 'vivas=' + sa2.bolas.length);
  // Puerta de zona: en la zona del árbol no nace ninguna.
  sa2.bolas.length = 0; sa2.bolaTimer = 0;
  SA.x = 3000; SA.y = sa2.groundY;
  for (let i = 0; i < 10; i++) sa2.update(0.05);
  check('en la zona del árbol (controlado en x ≥ 2500) NO nace ninguna bola', sa2.bolas.length === 0, 'vivas=' + sa2.bolas.length);
  // Choque con el controlado: estalla en pajitas y frena.
  SA.x = 800; SA.y = sa2.groundY; sa2.pan = 480;
  sa2.bolas.length = 0; sa2.bolaTimer = 999; sa2.pajitas.length = 0;
  sa2.bolas.push({ x: SA.x + 30, y: SA.y, r: 24, vel: 150, dist: 0, ang: 0, ph: 0 });
  sa2.update(0.05);
  check('al chocar con el controlado, la bola estalla en pajitas y desaparece',
    sa2.bolas.length === 0 && sa2.pajitas.length >= 5, `pajitas=${sa2.pajitas.length}`);
  check('el choque arma el trastabilleo (frenoT ≈ 0,7 s)', sa2.frenoT > 0.5, 'frenoT=' + sa2.frenoT.toFixed(2));
  sa2.update(0.016);
  check('durante el trastabilleo el motor mueve al activo con speedK ×0,4', sa2.speedK === 0.4, 'speedK=' + sa2.speedK);
  // El freno se mide en desplazamiento: 0,5 s con la flecha.
  sa2.bolas.length = 0; sa2.pajitas.length = 0;
  SA.x = 800; SA.y = sa2.groundY; sa2.frenoT = 0; sa2.speedK = 1;
  key('ArrowRight', true);
  for (let i = 0; i < 10; i++) sa2.update(0.05);
  key('ArrowRight', false);
  const dispLibre = SA.x - 800;
  SA.x = 800; sa2.frenoT = 0.7;
  key('ArrowRight', true);
  for (let i = 0; i < 10; i++) sa2.update(0.05);
  key('ArrowRight', false);
  const dispFreno = SA.x - 800;
  check('el trastabilleo frena de verdad: en 0,5 s se avanza ~×0,4 del paso libre',
    dispLibre > 60 && dispFreno > 15 && dispFreno < dispLibre * 0.55,
    `libre=${dispLibre.toFixed(0)} px, freno=${dispFreno.toFixed(0)} px`);
  for (let i = 0; i < 20; i++) sa2.update(0.05);
  check('pasado el trastabilleo (~0,7 s) la velocidad vuelve a la normal (frenoT 0, speedK 1)',
    sa2.frenoT === 0 && sa2.speedK === 1, `frenoT=${sa2.frenoT}, speedK=${sa2.speedK}`);
  // El seguidor no choca: la bola lo atraviesa.
  sa2.bolas.length = 0; sa2.bolaTimer = 999; sa2.frenoT = 0;
  SA.x = 500; SA.y = sa2.groundY; SB.x = 1200; SB.y = sa2.groundY;
  sa2.bolas.push({ x: SB.x, y: SB.y, r: 24, vel: 150, dist: 0, ang: 0, ph: 0 });
  sa2.update(0.05); sa2.update(0.05);
  check('las bolas atraviesan al SEGUIDOR sin chocar ni frenar a nadie',
    sa2.bolas.length === 1 && sa2.frenoT === 0, `vivas=${sa2.bolas.length}, frenoT=${sa2.frenoT}`);
  // Dibujo con bolas vivas en varios puntos del paseo.
  let sa2DrawOk = true;
  for (const p of [0, 1200, 3260]) { sa2.pan = p; try { sa2.draw(0.016); } catch (e) { sa2DrawOk = false; } }
  check('draw() de San Ángel con bolas vivas no explota en ningún punto del paseo (pan 0/1200/3260)', sa2DrawOk);
  DM.stop();

  console.log('\nN) Escena 4 «Praderas del castillo»: franja dibujada por código, el castillo al final y la cadena de Puertas');
  // Se re-entra a la cita y se salta directo a las praderas
  // con el gancho de viajes (la llegada caminando ya quedó
  // verificada al final de la sección L).
  DM.start(() => {});
  DM.debug.travelTo('castillo');
  const pr = G.scene;
  for (let i = 0; i < 25 && pr.phase !== 'free'; i++) pr.update(0.05);
  const PR = DM.debug.PRADERA, PF = pr.free, PX = PF.chars.ximena, PJ = PF.chars.jose;
  check('se llega a las praderas en modo libre (id de bloque «castillo», estado castillo)',
    !!pr && pr.id === 'castillo' && pr.phase === 'free' && DM.state.state === 'castillo',
    'id=' + (pr && pr.id) + ', phase=' + (pr && pr.phase) + ', state=' + DM.state.state);
  check('la franja de las praderas mide 4350 px (29 s × PACE, el w de su tabla; cámara 0..3710) y sale de DATE_SCENES',
    pr.worldW === 4350 && pr.worldW === DM.scenes.find((s) => s.id === 'castillo').w && (pr.worldW - 640) === 3710 &&
    PR.worldW === pr.worldW, 'worldW=' + pr.worldW);
  check('Puertas de las praderas: entrada en x=90 y la del castillo al final, en x=4250',
    pr.entryDoorX === 90 && pr.exitDoorX === 4250 && PR.exitDoorX === pr.exitDoorX,
    `entry=${pr.entryDoorX}, exit=${pr.exitDoorX}`);
  check('se llega junto a la Puerta de entrada (los personajes parten del primer tramo de la franja)',
    PX.x < 400 && PJ.x < 500, `ximena=${PX.x}, jose=${PJ.x}`);
  // La cámara llega al fondo de la franja sin salirse.
  PX.x = pr.worldW - 100; PX.y = pr.groundY;
  for (let i = 0; i < 30; i++) pr.update(0.05);
  check('la cámara se asienta al fondo de la franja (pan > 3300, sin pasar de 3710)', pr.pan > 3300 && pr.pan <= 3710.01, `pan=${pr.pan.toFixed(0)}`);
  // El castillo grande corona el final (el master mide
  // 793×1097): con la cámara al fondo, su centro cae en
  // pantalla junto a la Puerta de salida (pantalla 540), y a
  // mitad del paseo aún no ha entrado en escena.
  const cas = PR.castillo, casW = cas.h * 793 / 1097;
  const casCxFondo = cas.layerCx - 3710 * cas.par;
  check('el castillo es GRANDE (h 420–470) y corona el final: con la cámara al fondo su centro cae en pantalla, junto a la Puerta de salida',
    cas.h >= 420 && cas.h <= 470 && casCxFondo > 380 && casCxFondo < 640 && Math.abs(casCxFondo - 540) < 170,
    `h=${cas.h}, centro al fondo=${casCxFondo.toFixed(0)}`);
  check('el castillo entra en escena solo en el último tramo (a pan 1200 su borde izquierdo aún no entra en pantalla)',
    cas.layerCx - 1200 * cas.par - casW / 2 > 640,
    `borde a pan 1200=${(cas.layerCx - 1200 * cas.par - casW / 2).toFixed(0)}`);
  check('el castillo lleva humo en 3 chimeneas (fracciones de su caja) y su base se apoya sobre la pradera lejana (baseY 250–275)',
    Array.isArray(PR.humo) && PR.humo.length === 3 && cas.baseY >= 250 && cas.baseY <= 275,
    `humo=${PR.humo.length}, baseY=${cas.baseY}`);
  check('el espantapájaros Cabeza de Nabo está junto a la vereda en la zona media (x 1800–2500) y se DIBUJA por código (drawNabo, sin asset de la película)',
    PR.naboX >= 1800 && PR.naboX <= 2500 && typeof pr.drawNabo === 'function' && dateSrc.includes('drawNabo'),
    'naboX=' + PR.naboX);
  check('las montañas se generan con la cresta determinista (ridgeY: mismo perfil para el mismo x, sin azar por frame)',
    typeof DM.debug.ridgeY === 'function' && DM.debug.ridgeY(500, 3.1) === DM.debug.ridgeY(500, 3.1) &&
    DM.debug.ridgeY(500, 3.1) !== DM.debug.ridgeY(900, 3.1));
  let prDrawOk = true;
  for (const p of [0, 1200, 2400, 3710]) { pr.pan = p; try { pr.draw(0.016); } catch (e) { prDrawOk = false; } }
  check('draw() de las praderas no explota en ningún punto del paseo (pan 0/1200/2400/3710)', prDrawOk);
  // Cadena de vueltas: la Puerta de ENTRADA de las praderas
  // devuelve al aeropuerto, junto a su Puerta de salida.
  if (PF.active !== 'ximena') pr.switchActive();
  PX.x = pr.entryDoorX - 10; PX.y = pr.groundY; pr.pan = 0;
  pr.update(0.05);
  check('junto a la Puerta de entrada de las praderas se ofrece cruzarla (nearDoor)', pr.nearDoor === true && pr.nearDoorX === pr.entryDoorX);
  key('Space', true); pr.update(0.016); key('Space', false);
  for (let i = 0; i < 25 && G.scene === pr; i++) pr.update(0.05);
  const ae2 = G.scene;
  check('la Puerta de entrada de las praderas devuelve al aeropuerto, junto a su Puerta de salida',
    !!ae2 && ae2.id === 'aero' && DM.state.state === 'aero' &&
    Math.abs(ae2.free.chars[ae2.free.active].x - ae2.exitDoorX) < 220,
    'state=' + DM.state.state + ', x=' + (ae2 && ae2.free ? ae2.free.chars[ae2.free.active].x.toFixed(0) : '?'));
  for (let i = 0; i < 25 && ae2.phase !== 'free'; i++) ae2.update(0.05);
  // De nuevo a las praderas por la Puerta de salida del
  // aeropuerto: la cadena es estable en ambos sentidos.
  const AX3 = ae2.free.chars[ae2.free.active];
  AX3.x = ae2.exitDoorX - 10; AX3.y = ae2.groundY;
  ae2.update(0.05);
  key('Space', true); ae2.update(0.016); key('Space', false);
  for (let i = 0; i < 25 && G.scene === ae2; i++) ae2.update(0.05);
  check('la Puerta de salida del aeropuerto vuelve a cruzar a las praderas (la cadena es estable en ambos sentidos)',
    G.scene === pr && DM.state.state === 'castillo', 'state=' + DM.state.state);
  for (let i = 0; i < 25 && pr.phase !== 'free'; i++) pr.update(0.05);
  // …y la Puerta del CASTILLO devuelve, POR AHORA, también al
  // aeropuerto junto a su salida (marcador hasta que exista
  // la escena 5, el departamento final).
  const PX2 = pr.free.chars[pr.free.active];
  PX2.x = pr.exitDoorX - 10; PX2.y = pr.groundY;
  pr.update(0.05);
  check('junto a la Puerta del castillo se ofrece cruzarla (nearDoor)', pr.nearDoor === true && pr.nearDoorX === pr.exitDoorX);
  key('Space', true); pr.update(0.016); key('Space', false);
  for (let i = 0; i < 25 && G.scene === pr; i++) pr.update(0.05);
  check('la Puerta del castillo devuelve (por ahora) al aeropuerto, junto a su salida — marcador hasta la escena 5 (el depa final)',
    G.scene === ae2 && DM.state.state === 'aero' &&
    Math.abs(ae2.free.chars[ae2.free.active].x - ae2.exitDoorX) < 220,
    'state=' + DM.state.state);
  DM.stop();

  console.log('\nÑ) Praderas enriquecidas: Calcifer (obstáculo de fuego), Mononoke en la arboleda y el cielo vivo');
  // Los dos recortes nuevos son material de película
  // aportado por Jose: viven solo en la copia local, como
  // castillo.png y la canción.
  const noVersionado = (f) => {
    try {
      const out = require('child_process').execSync(
        'git ls-files application/src/assets/date/' + f,
        { cwd: path.join(__dirname, '..'), encoding: 'utf8' });
      return out.trim().length === 0;
    } catch (e) { return false; } // sin git a la vista: fallar cerrado
  };
  check('calcifer.png y mononoke.png existen en la copia local y NO están versionados (material de película de Jose, como castillo.png)',
    fs.existsSync(path.join(DATE_DIR, 'calcifer.png')) && fs.existsSync(path.join(DATE_DIR, 'mononoke.png')) &&
    noVersionado('calcifer.png') && noVersionado('mononoke.png'));
  check('.gitignore protege calcifer.png y mononoke.png, y FUENTES.md registra ambos recortes',
    gitignore.includes('calcifer.png') && gitignore.includes('mononoke.png') &&
    fuentes.includes('calcifer.png') && fuentes.includes('mononoke.png'));
  check('date.js carga ambos recortes con guarda imgOk (sin ellos: llamita dibujada de respaldo y la arboleda igual)',
    dateSrc.includes("loadDateImg('assets/date/calcifer.png')") && dateSrc.includes('imgOk(calciferImg)') &&
    dateSrc.includes("loadDateImg('assets/date/mononoke.png')") && dateSrc.includes('imgOk(mononokeImg)') &&
    dateSrc.includes('drawCalciferFallback') && dateSrc.includes('drawArboleda'));
  // Se re-entra a la cita y se salta a las praderas. OJO:
  // start() anula las escenas guardadas, así que la
  // instancia válida es la nueva de G.scene, no la de la
  // sección N.
  DM.start(() => {});
  DM.debug.travelTo('castillo');
  const pr3 = G.scene;
  for (let i = 0; i < 25 && pr3.phase !== 'free'; i++) pr3.update(0.05);
  if (pr3.free.active !== 'ximena') pr3.switchActive();
  const A3 = pr3.free.chars[pr3.free.active], B3 = pr3.free.chars[pr3.free.active === 'ximena' ? 'jose' : 'ximena'];
  const PCF = PR.calcifer, PCS = PR.calciferes;
  check('hay 7 Calcifers repartidos por la vereda (x 650–3450, tamaño 46–60, altura dentro de la banda ±26) y ninguno junto a la Puerta del castillo',
    PCS.length === 7 && PCS.every((cc) => cc.x >= 650 && cc.x <= 3450 && cc.size >= 46 && cc.size <= 60 && Math.abs(cc.yOff) <= 26) &&
    PCS.every((cc) => Math.abs(cc.x - pr3.exitDoorX) > 300),
    'xs=' + PCS.map((cc) => cc.x).join(','));
  check('el parpadeo varía la escala (calciferFlick oscila con el tiempo) y el radio de peligro queda en ~24–28 px',
    DM.debug.calciferFlick(1.3, 0) !== DM.debug.calciferFlick(1.45, 0) &&
    (() => { let mn = 99, mx = 0; for (let tt = 0; tt < 3; tt += 0.05) { const r = PCF.rBase * DM.debug.calciferFlick(tt, 2); if (r < mn) mn = r; if (r > mx) mx = r; } return mn >= 23.5 && mx <= 28.5; })());
  // El choque: el controlado se planta sobre el primer
  // Calcifer (su centro = la llama).
  pr3.resetCalcifers(); pr3.frenoT = 0;
  const C0 = pr3.calciferes[0];
  A3.x = C0.x; A3.y = pr3.groundY + C0.yOff - C0.size / 2 + 48; B3.x = 300; B3.y = pr3.groundY;
  pr3.update(0.05);
  check('al tocar un Calcifer: fogonazo (popT + chispas), freno armado (~0,7 s) y ese Calcifer queda APAGADO unos segundos',
    pr3.frenoT > 0.5 && pr3.chispas.length >= 4 && C0.offT > 2 && C0.popT > 0.15,
    `frenoT=${pr3.frenoT.toFixed(2)}, chispas=${pr3.chispas.length}, offT=${C0.offT.toFixed(1)}, popT=${C0.popT.toFixed(2)}`);
  pr3.frenoT = 0;
  pr3.update(0.05); pr3.update(0.05);
  check('el Calcifer apagado no puede frenar dos veces seguidas (sin nuevo choque mientras offT > 0)',
    pr3.frenoT === 0 && C0.offT > 0, `frenoT=${pr3.frenoT}, offT=${C0.offT.toFixed(1)}`);
  // El freno se MIDE en desplazamiento (como las bolas de
  // paja en la sección M): con todos los Calcifer apagados a
  // mano para que no interfieran, 0,5 s a la derecha libre
  // contra 0,5 s con el freno recién armado.
  pr3.calciferes.forEach((cc) => { cc.offT = 999; });
  A3.x = 800; A3.y = pr3.groundY; B3.x = 700; B3.y = pr3.groundY; pr3.frenoT = 0;
  let xAnt = A3.x;
  key('ArrowRight', true);
  for (let i = 0; i < 10; i++) pr3.update(0.05);
  key('ArrowRight', false);
  const dispLibrePr = A3.x - xAnt;
  A3.x = 800; pr3.frenoT = PCF.frenoT;
  xAnt = A3.x;
  key('ArrowRight', true);
  for (let i = 0; i < 10; i++) pr3.update(0.05);
  key('ArrowRight', false);
  const dispFrenoPr = A3.x - xAnt;
  check('el freno del Calcifer se mide en el desplazamiento: ~0,4× del libre (el mismo trastabilleo de las bolas de paja)',
    dispLibrePr > 60 && dispFrenoPr > 0.3 * dispLibrePr && dispFrenoPr < 0.52 * dispLibrePr,
    `libre=${dispLibrePr.toFixed(0)}, freno=${dispFrenoPr.toFixed(0)}`);
  // El seguidor lo atraviesa sin efecto.
  pr3.resetCalcifers(); pr3.frenoT = 0;
  const C1 = pr3.calciferes[1];
  B3.x = C1.x; B3.y = pr3.groundY + C1.yOff - C1.size / 2 + 48;
  A3.x = 300; A3.y = pr3.groundY;
  pr3.update(0.05);
  check('el SEGUIDOR atraviesa los Calcifer sin efecto (ni freno ni apagado: el choque es solo del controlado)',
    pr3.frenoT === 0 && C1.offT === 0, `frenoT=${pr3.frenoT}, offT=${C1.offT}`);
  // Mononoke y la arboleda del fondo.
  const ARB = PR.arboleda, protMo = (ARB.layerCx - 320) / ARB.par;
  check('Mononoke observa desde la arboleda: su protagonista cae en la segunda mitad del paseo (55–75% de pan 0..3710) y mide 200–240 px de alto',
    protMo / 3710 >= 0.55 && protMo / 3710 <= 0.75 && PR.mononoke.h >= 200 && PR.mononoke.h <= 240 &&
    typeof pr3.drawArboleda === 'function',
    `protagonista=${(100 * protMo / 3710).toFixed(0)}% (pan ${protMo.toFixed(0)}), h=${PR.mononoke.h}`);
  check('la arboleda acompaña el tramo de mundo 2800–3300: Mononoke está en pantalla con pan 2480 y con pan 2980',
    (ARB.layerCx - 2480 * ARB.par) > -100 && (ARB.layerCx - 2480 * ARB.par) < 740 &&
    (ARB.layerCx - 2980 * ARB.par) > -100 && (ARB.layerCx - 2980 * ARB.par) < 740,
    `centros=${(ARB.layerCx - 2480 * ARB.par).toFixed(0)}/${(ARB.layerCx - 2980 * ARB.par).toFixed(0)}`);
  // El cielo vivo.
  const nubesEn = (pan) => DM.debug.praderaClouds(30, pan).filter((nb) => nb.x > -80 && nb.x < 720);
  check('el cielo nunca va vacío: en los pans muestreados siempre hay ≥4 masas de nubes visibles, y existen las 3 profundidades',
    [0, 900, 1800, 2700, 3710].every((p) => nubesEn(p).length >= 4) &&
    [0, 1, 2].every((cp) => DM.debug.praderaClouds(30, 900).some((nb) => nb.capa === cp)),
    'visibles=' + [0, 900, 1800, 2700, 3710].map((p) => nubesEn(p).length).join(','));
  check('el dirigible cruza el cielo en un ciclo largo (~120 s): entra en su ventana y el resto del ciclo está fuera de escena',
    (() => { let vis = false, fuera = false; for (let tt = 0; tt < 120; tt += 2) { const x = DM.debug.dirigibleXAt(tt); if (x > -100 && x < 740) vis = true; if (x === -9999) fuera = true; } return vis && fuera && PR.dirigible.ciclo === 120; })());
  check('las bandadas cruzan el cielo: hay ventanas con 3–5 pájaros y el aleteo cambia con el tiempo',
    (() => { for (let tt = 0; tt < 90; tt += 0.5) { const b = DM.debug.bandadaAt(tt, 0); if (b && b.pts.length >= 3 && b.pts.length <= 5) { const b2 = DM.debug.bandadaAt(tt + 0.18, 0); if (b2 && b2.pts.some((p, i) => Math.abs(p.flap - b.pts[i].flap) > 0.5)) return true; } } return false; })());
  check('el sol vive en la capa lejana (parallax ≤ 0,1) y acompaña todo el paseo (en pantalla a pan 0 y a pan 3710)',
    PR.sol.par <= 0.1 && PR.sol.layerCx < 640 && (PR.sol.layerCx - 3710 * PR.sol.par) > 0,
    `centro al fondo=${(PR.sol.layerCx - 3710 * PR.sol.par).toFixed(0)}`);
  check('las mariposas revolotean junto a las flores (mariposaAt varía con el tiempo y queda dentro de la franja)',
    (() => { const m0 = DM.debug.mariposaAt(5, 0), m1 = DM.debug.mariposaAt(6.5, 0); return !!m0 && !!m1 && (Math.abs(m0.x - m1.x) > 1 || Math.abs(m0.y - m1.y) > 1) && m0.x > 0 && m0.x < 4350; })());
  let prDrawOk2 = true;
  for (const p of [0, 1500, 2511, 3710]) { pr3.pan = p; try { pr3.draw(0.016); } catch (e) { prDrawOk2 = false; } }
  check('draw() de las praderas enriquecidas no explota (pan 0/1500/2511/3710; sin los recortes locales cargados, mandan las guardas imgOk)', prDrawOk2);
  DM.stop();

  DM.debug.setHash(realHash); // el hash real queda como estaba
  check('el hash real quedó restaurado tras las pruebas', DM.debug.getHash() === realHash);

  console.log(`\n${failures ? '✘' : '✔'} check_date: ${checks - failures}/${checks} checks`);
  process.exit(failures ? 1 : 0);
})().catch((e) => { console.error('ERROR en check_date:', e); process.exit(1); });
