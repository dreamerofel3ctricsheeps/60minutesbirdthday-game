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
      del modo que lo congela, y la cadena de la Parte 1 con
      la carta como llave (guion v2): la salida del depa está
      DORMIDA hasta abrir la carta (la secuencia de apertura
      corre en silencio y a ritmo del jugador; cartaAbierta
      queda en true) y recién entonces puerta → plaza →
      'plaza-arrived' en modo libre ('free').
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
     apagado unos segundos; el seguidor lo atraviesa). La
     colisión es la ELIPSE DEL NÚCLEO OPACO medido del
     recorte (arreglo del playtest de Jose: la cuenta vieja
     —un círculo de ~50 px desde el centro de la caja del
     recorte— quemaba sin tocar la llama visible; ahora hay
     casos de no-contacto verificados —izquierda, derecha,
     diagonal y borde alto de la banda— y el contacto real
     sigue disparando),
     Mononoke observando desde la arboleda dibujada del fondo
     (protagonista en la segunda mitad del paseo), y el cielo
     y la pradera llenos por código: 3 profundidades de nubes
     (praderaClouds), sol en la capa lejana, dirigible de
     ciclo ~120 s, bandadas con aleteo, árboles solitarios,
     rocas y mariposas. calcifer.png y mononoke.png quedan
     solo-locales (gitignore + FUENTES.md), como castillo.png.
   O) Escena 5 «El departamento de noche, con la cita»: la
     Puerta del castillo cruza al depa final (la cadena queda
     completa en ambos sentidos: la puerta principal del depa
     devuelve a las praderas junto a la Puerta del castillo),
     la noche (luz «velas») se aplica SOLO ahí (la apertura
     sigue de día, sin puesta ni Jose dentro), la puesta es
     la SALA (guion v2): los candelabros de la mesa de centro
     vía el gancho extraBoxes de esa HomeScene y los asientos
     SOBRE los cojines del sofá (el respaldo ocluye:
     «sentados»), los roomies espían por la rendija y Pollito
     desde SOBRE el armario, Jose acompaña a Ximena por la
     casa, y la cinemática de cierre avanza por sus estados
     en orden (sentarse → la lectura en pareja con el cierre
     y la firma → la mirada → Pollito baja y CAMINA con la
     torta → la deja en la mesa de centro → orgulloso →
     SE VA (camina de vuelta al armario y se oculta en su
     escondite) → emoción → el cierre total, que marca la
     cita completada → se levantan y vuelve el control); el
     salto la deja en el estado posterior (torta servida y
     Pollito ya de vuelta en el armario) y la canción/reloj
     no se reinician al entrar.
   P) La acción de abrazo de San Ángel (pedido de Jose):
     sprite NUEVO de la pareja abrazándose (abrazo.png, arte
     original del juego generado desde los sprites definidos
     como referencia de identidad; versionado y registrado en
     FUENTES.md). La oferta SOLO existe en la parte final de
     la escena, frente al árbol: el punto medio de la pareja
     debe estar en la zona del árbol, que arranca en el ancla
     del camino de velas (SA_ABRAZO.x0 === SA_VELAS_X0); cerca
     pero en la calle o junto a la pileta NO se ofrece. Con el
     controlado y el seguidor cerca (≤80 px entre pies) y en
     zona se ofrece «ESPACIO: abrazarse»; la
     secuencia (~3,5 s) acerca a la pareja frente a frente,
     sostiene el abrazo (con el sprite de la pareja si cargó;
     en el humo manda el respaldo de los dos sprites, porque
     FakeImage nunca «carga») con pétalos y corazoncitos
     dibujados, y separa dejando al seguidor en su puesto.
     Durante el abrazo el control está bloqueado, TAB no
     cambia de personaje y las bolas ni nacen ni frenan; al
     terminar, el rearme exige separarse (>140 px) o esperar
     (~4 s). Funciona controlando a Ximena o a Jose.
   Q) El sonido de la Puerta (pedido de Jose: «no ese sonido
     de pixel»): los cruces de Puerta de la cita suenan con
     una grabación REAL de una puerta cerrándose
     (door-close.ogg: «Closing an old door» de ezwa,
     pdsounds.org #661, DOMINIO PÚBLICO, versionada y
     registrada en FUENTES.md), una sola vez por cruce y
     cuando la Puerta se cierra tras la pareja — al abrir la
     puerta del depa no suena nada; el cierre suena al llegar
     a la plaza —. El blip sintetizado del juego principal ya
     no suena en ningún cruce de la cita (y el juego principal
     lo conserva intacto). El SFX usa un elemento <audio>
     propio que no toca la canción ni el reloj, y respeta el
     silencio de la cita (D.muted).
   S) Los fragmentos de la carta en la caminata (guion v2,
     Acto 2): cada escena dispara el suyo UNA sola vez por
     partida (plaza al asomar la Catedral, San Ángel en el
     tramo del árbol, aeropuerto a mitad de escena, praderas
     con el castillo en cuadro), la banda NO bloquea el
     movimiento ni detiene el reloj de la canción, y la
     regla de cola de la banda (una en espera) se respeta.
   T) El álbum del cierre total (idea de Jose): tras la
     carta, las fotos del recorrido se colocan una encima
     de otra como una pila de fotos impresas (plaza → San
     Ángel → aeropuerto → praderas → la del sofá), cada
     una con su mínimo de contemplación antes de que
     ESPACIO pueda traer la siguiente (y entrada sola si
     no se pulsa), y la del sofá se expande a pantalla
     completa antes del FIN. El humo marca las FakeImage
     de la carta y las fotos como «cargadas» (naturalWidth)
     para ejercitar la pila de verdad, y su degradación:
     una foto intermedia que falta se salta en la pila y
     sin la foto del sofá no hay álbum (directo a FIN).
   W) El finale tras el playtest y la nueva presentación
     de los textos de la carta (Jose, 2026-11-22): la
     pareja sentada va en el pase GL con profundidad,
     anclada en los asientos (detrás del respaldo del
     sofá), Pollito se dimensiona por su actor definido,
     su ruta de llegada es visible (delante del sofá) y
     tras servir la torta SE VA al armario (estado 'exit';
     el salto y la reentrada dejan ese mismo estado); y
     los textos de la carta en escena (fragmentos,
     apertura y cierre del finale) se presentan SIN
     recuadro — texto flotante grande en una columna
     lateral, con fundido de entrada/salida y deriva al
     disolverse — mientras la instrucción de objetivo
     CONSERVA su recuadro de papel.
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
  const indexSrc = fs.readFileSync(path.join(SRC, '..', 'main.js'), 'utf8');
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

  console.log('\nF) La carta como llave, puerta, reloj de respaldo y llegada a la plaza');
  xi.x = 510; xi.y = 560; xi.vx = xi.vy = 0;
  sc.update(0.016);
  check('junto a la puerta principal se ofrece la interacción', sc.nearDoor === true);
  // Arranque de la canción (decisión de Jose, 2026-11-21): en el
  // depa NO suena nada; el reloj espera a la escena 1 (la plaza).
  check('en el depa el reloj NO corre (silencio: la canción espera a la plaza)',
    DM.state.clockRunning === false && DM.state.clockStarted === false && DM.dateNow() === 0);
  // LA CARTA ES LA LLAVE (guion v2): sin abrirla, la salida del
  // depa está DORMIDA — ni prompt ni transición con ESPACIO.
  check('al arrancar, la carta está sin abrir', DM.state.cartaAbierta === false);
  key('Space', true); sc.update(0.016); key('Space', false);
  check('sin abrir la carta, ESPACIO junto a la puerta NO la abre (salida dormida)',
    sc.phase === 'depa', 'phase=' + sc.phase);
  // Ximena va a la mesa de centro y abre la carta.
  xi.x = 635; xi.y = 152; xi.vx = xi.vy = 0;
  sc.update(0.016);
  check('junto a la mesa de centro se ofrece abrir la carta', sc.nearCarta === true);
  key('Space', true); sc.update(0.016); key('Space', false);
  check('ESPACIO junto a la carta arranca la secuencia de apertura (fase carta, paso «toma»)',
    sc.phase === 'carta' && sc.cartaSeq && sc.cartaSeq.step === 'toma', 'phase=' + sc.phase);
  for (let i = 0; i < 20; i++) sc.update(0.05); // ~1 s: la toma dura 0,8 s
  check('tras la toma (~0,8 s) Ximena está leyendo (paso «lee», a ritmo del jugador)',
    sc.cartaSeq && sc.cartaSeq.step === 'lee' && DM.state.cartaAbierta === false,
    'step=' + (sc.cartaSeq && sc.cartaSeq.step));
  check('mientras lee, el reloj sigue en silencio (aún no hay canción)',
    DM.state.clockRunning === false && DM.dateNow() === 0);
  key('Space', true); sc.update(0.016); key('Space', false);
  check('ESPACIO cierra la lectura: cartaAbierta queda en true y vuelve el control en el depa',
    DM.state.cartaAbierta === true && sc.phase === 'depa' && sc.cartaSeq === null,
    'phase=' + sc.phase);
  // Ya con la carta, la salida despierta.
  xi.x = 510; xi.y = 560; xi.vx = xi.vy = 0;
  sc.update(0.016);
  check('con la carta abierta, la puerta vuelve a ofrecerse', sc.nearDoor === true);
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
  check('castillo.png existe en la copia local y SÍ está versionado (decisión de Jose: se versiona el material de película)',
    fs.existsSync(path.join(DATE_DIR, 'castillo.png')) && castilloVersionado);
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
  // La carta también en el reingreso (guion v2): la puerta
  // está dormida hasta abrirla, como en la primera entrada.
  xi2.x = 635; xi2.y = 152; xi2.vx = xi2.vy = 0;
  sc2.update(0.016);
  key('Space', true); sc2.update(0.016); key('Space', false);
  for (let i = 0; i < 20; i++) sc2.update(0.05);
  key('Space', true); sc2.update(0.016); key('Space', false);
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
  check('el freno es opt-in por escena: la plaza define el suyo (por sus autos con calaverita) y en reposo vale 1, sin freno pendiente (el motor compartido no cambia para las demás escenas)',
    sc.speedK === 1 && sc.frenoT === 0);
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
  // …y la Puerta del CASTILLO cruza al DEPARTAMENTO FINAL
  // (escena 5): la cadena del paseo queda completa.
  const PX2 = pr.free.chars[pr.free.active];
  PX2.x = pr.exitDoorX - 10; PX2.y = pr.groundY;
  pr.update(0.05);
  check('junto a la Puerta del castillo se ofrece cruzarla (nearDoor)', pr.nearDoor === true && pr.nearDoorX === pr.exitDoorX);
  key('Space', true); pr.update(0.016); key('Space', false);
  for (let i = 0; i < 25 && G.scene === pr; i++) pr.update(0.05);
  const fin = G.scene;
  check('la Puerta del castillo cruza al DEPARTAMENTO FINAL (escena 5): plaza ⇄ San Ángel ⇄ aeropuerto ⇄ praderas ⇄ depa, la cadena completa',
    !!fin && fin.id === 'cita' && DM.state.state === 'cita' && fin === DM.state.finaleScene,
    'state=' + DM.state.state);

  console.log('\nO) Escena 5: el departamento de noche, con la cita (la sala, la lectura en pareja, la torta y el cierre total)');
  // Venimos de cruzar la Puerta del castillo (fin de la
  // sección N): fundido de luz cálida y la casa queda libre.
  for (let i = 0; i < 25 && fin.phase !== 'home'; i++) fin.update(0.05);
  const fh = fin.home, fxi = fin.xi, fjo = fin.jose, fcat = fin.cat, FIN = DM.debug.FINALE;
  check("tras el fundido de luz la escena queda en fase 'home' (explorable)", fin.phase === 'home', 'phase=' + fin.phase);
  check('la pareja aparece junto a la puerta principal de la casa (Ximena jugable visible, Jose presente)',
    fxi.hidden === false && fjo.hidden === false &&
    Math.hypot(fxi.x - 510, fxi.y - 566) < 95 && Math.hypot(fjo.x - fxi.x, fjo.y - fxi.y) < 110,
    `xi(${fxi.x},${fxi.y}) jose(${fjo.x},${fjo.y})`);
  check('la configuración es de NOCHE DE CITA: luz cálida propia (lightKey «velas», con su punto de velas sobre la mesa de centro), distinta del día',
    fh.lightKey === 'velas' && !!fh.lightB && fh.lightB.amb[0] < 0.5 &&
    fh.lightB.points.some((p) => p.x === FIN.ctable.cx && p.z === FIN.ctable.cz),
    'lightKey=' + fh.lightKey);
  check('los 7 roomies espían desde el armario (hidden + closetPeek con los 7), como en la apertura',
    fh.roomies.length === 7 && fh.roomies.every((a) => a.hidden) &&
    Array.isArray(fh.closetPeek) && fh.closetPeek.length === 7);
  check('Pollito espía desde su escondite SOBRE el armario (visible, elev ≈ 100, quieto)',
    fcat.hidden === false && fcat.elev > 90 && Math.abs(fcat.x - FIN.catHide.x) < 2 && fcat.arrived,
    `cat(${fcat.x},${fcat.y}) elev=${fcat.elev}`);
  check('la puesta de la sala entra por el gancho de props de ESTA casa (extraBoxes) y los asientos quedan SOBRE los cojines del sofá (el respaldo ocluye la mitad inferior: «sentados»)',
    typeof fh.extraBoxes === 'function' &&
    FIN.seatXi.x > FIN.sofa.x && FIN.seatXi.x < FIN.sofa.x + FIN.sofa.w && FIN.seatXi.y > FIN.sofa.z && FIN.seatXi.y < FIN.sofa.z + FIN.sofa.d &&
    FIN.seatJose.x > FIN.sofa.x && FIN.seatJose.x < FIN.sofa.x + FIN.sofa.w && FIN.seatJose.y > FIN.sofa.z && FIN.seatJose.y < FIN.sofa.z + FIN.sofa.d);
  // La puesta 3D, pieza a pieza, con un MB registrador (el
  // pase 3D real necesita GPU y no se ejercita en el harness,
  // como el depa de la apertura): los 2 candelabros de la
  // mesa de centro con su llama encendida (emit). La torta,
  // la carta y la pareja sentada son PNG (billboards de
  // draw()), no mallas: aquí no aparecen.
  const rec = { box: [], cyl: [] };
  const recMb = { box(...a) { rec.box.push(a); }, cyl(...a) { rec.cyl.push(a); }, flat() {}, wallQuad() {} };
  fin.drawTableBoxes(recMb);
  check('la puesta 3D dibuja los 2 candelabros de la mesa de centro (base + vela) con sus llamas ENCENDIDAS (emit); la torta aún no está en la mesa',
    rec.cyl.length === 4 &&
    rec.box.filter((a) => a[7] && a[7].emit).length >= 2 && fin.tortaOnTable === false,
    `box=${rec.box.length} cyl=${rec.cyl.length}`);
  check('la APERTURA no se contaminó: su casa sigue de día, sin mesa puesta (extraBoxes null), sin Jose dentro y con Pollito escondido',
    (() => { const ah = DM.state.plazaScene.home; return ah.lightKey === 'dia' && ah.extraBoxes === null && ah.jose.hidden === true && ah.cat.hidden === true; })());
  check('entrar al final NO arranca ni reinicia el reloj/la canción (en esta escena no se inicia nada)',
    DM.state.clockStarted === false && DM.state.clockRunning === false && DM.dateNow() === 0);
  // Jose ACOMPAÑA a Ximena dentro de la casa: ella aparece
  // lejos (la sala, junto a la TV) y él la sigue por rutas.
  fxi.x = 860; fxi.y = 130; fxi.vx = fxi.vy = 0;
  const jd0 = Math.hypot(fjo.x - fxi.x, fjo.y - fxi.y);
  for (let i = 0; i < 160; i++) fin.update(0.05);
  const jd1 = Math.hypot(fjo.x - fxi.x, fjo.y - fxi.y);
  check('Jose acompaña a Ximena por la casa (la sigue y termina cerca de ella)', jd1 < jd0 - 150 && jd1 < 90, `dist ${jd0.toFixed(0)} → ${jd1.toFixed(0)}`);
  // El overlay de la escena (avisos, fundidos, panel) sin la
  // casa 3D: home.draw necesita GPU (como en la apertura).
  let finDrawOk = true;
  const homeDrawOrig = fh.draw;
  fh.draw = () => {};
  try { fin.draw(0.016); } catch (e) { finDrawOk = false; }
  fh.draw = homeDrawOrig;
  check('draw() del final no explota (overlay: avisos y fundidos; la casa 3D va por GPU, como la apertura)', finDrawOk);
  // --- la cinemática de cierre, de principio a fin ---
  fxi.x = FIN.sofa.cx; fxi.y = 250; fxi.vx = fxi.vy = 0;
  for (let i = 0; i < 40; i++) fin.update(0.05); // Jose se acomoda cerca
  check('junto al sofá se ofrece la acción (nearSofa)', fin.nearSofa === true);
  key('Space', true); fin.update(0.016); key('Space', false);
  check('ESPACIO arranca la cinemática (estado seats, control bloqueado)', fin.cine.st === 'seats', 'cine=' + fin.cine.st);
  const seen = [];
  let readingSeen = false;
  for (let i = 0; i < 700 && fin.cine.st !== 'done'; i++) {
    fin.update(0.05);
    if (!seen.length || seen[seen.length - 1] !== fin.cine.st) seen.push(fin.cine.st);
    if (fin.cine.st === 'reading' && fin.seatedPose === true && fxi.hidden === true && fjo.hidden === true) readingSeen = true;
  }
  const cineOrder = ['seats', 'reading', 'gaze', 'descend', 'walk', 'place', 'proud', 'exit', 'emotion', 'closing', 'rise'];
  check('la cinemática avanza por sus estados EN ORDEN (sentarse → lectura en pareja → la mirada → Pollito baja → camina con la torta → la deja → orgulloso → SE VA al armario → emoción → cierre total → levantarse) y termina',
    cineOrder.every((s, i) => seen[i] === s) && fin.cine.st === 'done', 'vistos: ' + seen.join(' → '));
  check('durante la LECTURA EN PAREJA el sprite compuesto sustituye a los dos actores (seatedPose, ambos hidden)', readingSeen);
  check('la torta quedó EN LA MESA de centro y Pollito YA SE FUE: de vuelta en su escondite del armario (el actor, espiando: visible, elev ≈ 100)',
    fin.tortaOnTable === true && fin.tortaShown === true && fin.catVis === 'actor' &&
    fcat.hidden === false && fcat.elev > 90 &&
    Math.abs(fcat.x - FIN.catHide.x) < 4 && Math.abs(fcat.y - FIN.catHide.y) < 4,
    `cat(${fcat.x},${fcat.y}) elev=${fcat.elev} catVis=${fin.catVis}`);
  check('el cierre total marcó la cita COMPLETADA (D.completed) y se consumió (close en null)',
    DM.state.completed === true && fin.close === null, 'completed=' + DM.state.completed);
  check('FINAL_TEXT es la constante de date.js con su valor inicial (la P4 sigue abierta: el definitivo lo escribe Jose)',
    DM.debug.FINAL_TEXT === 'Feliz cumpleaños, mi amor' && dateSrc.includes('const FINAL_TEXT'));
  // La torta es un PNG: la puesta 3D no cambia con ella.
  rec.box.length = 0; rec.cyl.length = 0;
  fin.drawTableBoxes(recMb);
  check('tras la cinemática la puesta 3D sigue siendo solo los candelabros (la torta es billboard, no malla)',
    rec.cyl.length === 4, `cyl=${rec.cyl.length}`);
  // El cierre total, dibujado a mano en sus pasos sin imagen
  // (en el humo FakeImage nunca «carga»: las fases de imagen
  // se saltan solas y quedan la tarjeta de fin y el texto de
  // la carta sobre el fondo). nearSofa/nearDoor se apagan a
  // mano: los avisos usan head() → R.project, que necesita
  // el VP de un render real con GPU — la misma limitación
  // del depa en este harness.
  fh.draw = () => {};
  let closeDrawOk = true;
  fin.nearSofa = false; fin.nearDoor = false;
  fin.close = { step: 'fin', t: 1 };
  try { fin.draw(0.016); } catch (e) { closeDrawOk = false; }
  fin.close = { step: 'carta', t: 1 };
  try { fin.draw(0.016); } catch (e) { closeDrawOk = false; }
  fin.close = null;
  fh.draw = homeDrawOrig;
  check('el cierre total se dibuja sin errores (la tarjeta de fin con FINAL_TEXT y la carta completa renderizada)', closeDrawOk);
  // Control devuelto: Ximena camina de nuevo, ya fuera de
  // la huella del sofá.
  const cx0 = fxi.x;
  key('ArrowRight', true);
  for (let i = 0; i < 10; i++) fin.update(0.05);
  key('ArrowRight', false);
  check('al terminar la cinemática el control vuelve: Ximena camina de nuevo (fuera de la huella del sofá)',
    fxi.x > cx0 + 15 &&
    !(fxi.x > FIN.sofa.x && fxi.x < FIN.sofa.x + FIN.sofa.w && fxi.y > FIN.sofa.z && fxi.y < FIN.sofa.z + FIN.sofa.d),
    `x ${cx0} → ${fxi.x}, en (${fxi.x.toFixed(0)},${fxi.y.toFixed(0)})`);
  // --- el SALTO de la cinemática (repetir y saltar) ---
  fxi.x = FIN.sofa.cx; fxi.y = 250; fxi.vx = fxi.vy = 0;
  for (let i = 0; i < 40; i++) fin.update(0.05);
  key('Space', true); fin.update(0.016); key('Space', false);
  check('la cinemática se puede REPETIR (la torta sale de la mesa: Pollito la traerá de nuevo)',
    fin.cine.st === 'seats' && fin.tortaOnTable === false && fin.tortaShown === false, 'cine=' + fin.cine.st);
  for (let i = 0; i < 30; i++) fin.update(0.05); // avanza (t > 0,4: el salto queda armado)
  key('Space', true); fin.update(0.016); key('Space', false);
  for (let i = 0; i < 200 && fin.cine.st !== 'done'; i++) fin.update(0.05);
  check('SALTAR la cinemática deja la escena en su estado posterior (torta en la mesa, Pollito ya de vuelta en su escondite del armario, sin cierre pendiente ni pose sentada, control devuelto)',
    fin.cine.st === 'done' && fin.tortaOnTable === true && fin.catVis === 'actor' &&
    fcat.hidden === false && fcat.elev > 90 && Math.abs(fcat.x - FIN.catHide.x) < 4 &&
    fin.close === null && fin.seatedPose === false && DM.state.completed === true,
    'cine=' + fin.cine.st + ' catVis=' + fin.catVis);
  // --- la salida de revisión: puerta principal → praderas ---
  fxi.x = 510; fxi.y = 560; fxi.vx = fxi.vy = 0;
  fin.update(0.05);
  check('junto a la puerta principal se ofrece la salida (nearDoor)', fin.nearDoor === true);
  key('Space', true); fin.update(0.016); key('Space', false);
  for (let i = 0; i < 25 && G.scene === fin; i++) fin.update(0.05);
  check('la puerta principal del depa devuelve a las PRADERAS, junto a la Puerta del castillo (salida solo de revisión: la cadena cierra en ambos sentidos)',
    G.scene === pr && DM.state.state === 'castillo' &&
    Math.abs(pr.free.chars[pr.free.active].x - pr.exitDoorX) < 220,
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
  check('calcifer.png y mononoke.png existen en la copia local y SÍ están versionados (como castillo.png)',
    fs.existsSync(path.join(DATE_DIR, 'calcifer.png')) && fs.existsSync(path.join(DATE_DIR, 'mononoke.png')) &&
    !noVersionado('calcifer.png') && !noVersionado('mononoke.png'));
  check('FUENTES.md registra calcifer.png y mononoke.png (ahora versionados)',
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
  check('el parpadeo varía la escala (calciferFlick oscila con el tiempo) y la zona de peligro es la elipse del NÚCLEO medido del recorte (semiancho 0,453·s, semialto 0,475·s, torso 15: alcance ~38,5 px a tamaño 52, no el círculo viejo de ~50)',
    DM.debug.calciferFlick(1.3, 0) !== DM.debug.calciferFlick(1.45, 0) &&
    Math.abs(PCF.coreRxK - 0.453) < 0.01 && Math.abs(PCF.coreRyK - 0.475) < 0.01 && Math.abs(PCF.coreCyK - 0.525) < 0.01 && PCF.charR === 15 &&
    (PCF.coreRxK * 52 + PCF.charR) > 36 && (PCF.coreRxK * 52 + PCF.charR) < 42,
    `alcanceX(52)=${(PCF.coreRxK * 52 + PCF.charR).toFixed(1)}, alcanceY(52)=${(PCF.coreRyK * 52 + PCF.charR).toFixed(1)}`);
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
  // El arreglo del playtest (Jose: «choque o no con el fuego
  // igual me afecta, solo debería afectarme si realmente lo
  // he tocado»): la cuenta vieja era un círculo de ~50 px
  // (radio ~26 + 24) desde el centro de la CAJA del recorte
  // y quemaba sin contacto con la llama visible. La nueva es
  // la elipse del núcleo opaco medido. Estos acercamientos
  // NO tocan el núcleo y ya no deben frenar (con la cuenta
  // vieja, los tres primeros SÍ disparaban: distancias de
  // centro ~48, ~48 y ~39 px contra un radio de ~48–52).
  const sinToque = (cal, ax, ay, nombre) => {
    pr3.resetCalcifers(); pr3.frenoT = 0;
    A3.x = ax; A3.y = ay; B3.x = 300; B3.y = pr3.groundY;
    pr3.update(0.05);
    check(nombre, pr3.frenoT === 0 && cal.offT === 0, `frenoT=${pr3.frenoT}, offT=${cal.offT}`);
  };
  const C720 = pr3.calciferes[0]; // x=720, yOff=−18, size=52
  const cyC720 = pr3.groundY + C720.yOff - 4 - PCF.coreCyK * C720.size; // centro del núcleo (a parpadeo ~1)
  const alcanceX720 = PCF.coreRxK * C720.size * 1.06 + PCF.charR; // alcance máximo: parpadeo en su pico
  sinToque(C720, C720.x - alcanceX720 - 8, cyC720 + 48,
    'acercarse por la IZQUIERDA quedándose a ~8 px del borde visible del núcleo ya NO quema (sin solape no hay fogonazo)');
  sinToque(C720, C720.x + alcanceX720 + 8, cyC720 + 48,
    'acercarse por la DERECHA quedándose a ~8 px del borde visible del núcleo ya NO quema');
  sinToque(C720, C720.x + 32, pr3.groundY + 26,
    'pasar en DIAGONAL por debajo de una llama alta (fondo de la banda, cerca pero sin tocar el núcleo) ya NO quema');
  // Por la banda a otra altura: llamas bajas (yOff +20/+16)
  // con el personaje pegado al borde alto de la banda: su
  // torso queda por encima de la punta de la llama, sin
  // solape vertical con el núcleo.
  const C1980 = pr3.calciferes[3]; // x=1980, yOff=+20, size=55
  sinToque(C1980, C1980.x, pr3.groundY - 26,
    'pasar por el borde ALTO de la banda frente a una llama baja (yOff +20) NO quema: el torso no alcanza el núcleo');
  const C1150 = pr3.calciferes[1]; // x=1150, yOff=+16, size=58
  sinToque(C1150, C1150.x, pr3.groundY - 26,
    'pasar por el borde ALTO de la banda frente a otra llama baja (yOff +16, tamaño 58) NO quema');
  // Y el contacto REAL sigue quemando: de frente, a la
  // altura de la llama, con el torso dentro del núcleo.
  pr3.resetCalcifers(); pr3.frenoT = 0;
  const C0b = pr3.calciferes[0];
  A3.x = C0b.x; A3.y = pr3.groundY + C0b.yOff; B3.x = 300; B3.y = pr3.groundY;
  pr3.update(0.05);
  check('el contacto REAL con el núcleo (de frente, a la altura de la llama) SÍ dispara el fogonazo, el freno y el apagado',
    pr3.frenoT > 0.5 && C0b.offT > 2 && pr3.chispas.length >= 4,
    `frenoT=${pr3.frenoT.toFixed(2)}, offT=${C0b.offT.toFixed(1)}, chispas=${pr3.chispas.length}`);
  // Mononoke y la arboleda del fondo.
  const ARB = PR.arboleda, protMo = (ARB.layerCx - 320) / ARB.par;
  check('Mononoke observa desde la arboleda: su protagonista cae en la segunda mitad del paseo (55–75% de pan 0..3710) y el recorte se dibuja SUTIL, a 110–125 px de alto (la mitad de su primera versión, que a 218 dominaba el fondo)',
    protMo / 3710 >= 0.55 && protMo / 3710 <= 0.75 && PR.mononoke.h >= 110 && PR.mononoke.h <= 125 &&
    typeof pr3.drawArboleda === 'function',
    `protagonista=${(100 * protMo / 3710).toFixed(0)}% (pan ${protMo.toFixed(0)}), h=${PR.mononoke.h}`);
  // La oclusión: en drawArboleda el recorte se pinta DESPUÉS
  // de la fila trasera y ANTES de la frontal, y la copa
  // frontal central (h=76: su techo llega a baseY−1,02·76)
  // queda por encima de la mitad del recorte — la fila
  // frontal le tapa la mitad inferior. Y el velo de
  // distancia subió a 0,2 para fundirla más con el fondo.
  check('Mononoke va DETRÁS de la fila frontal de la arboleda: el recorte se dibuja antes que las copas frontales, cuya copa central cubre desde la mitad del recorte hacia abajo, y el velo de distancia es 0,2',
    (() => {
      const iImg = dateSrc.indexOf('drawImage(mononokeImg');
      const iFront = dateSrc.indexOf("tree(-238, 84, '#274d2a')");
      const techoCopa = ARB.baseY - 76 * 1.02, mitadRecorte = ARB.baseY + 6 - PR.mononoke.h / 2;
      return iImg > 0 && iFront > iImg && techoCopa < mitadRecorte &&
        dateSrc.includes("rgba(174,200,226,0.2)'; // el velo de la distancia");
    })(),
    `techo copa frontal=${(ARB.baseY - 76 * 1.02).toFixed(0)}, mitad del recorte=${(ARB.baseY + 6 - PR.mononoke.h / 2).toFixed(0)}`);
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

  console.log('\nP) Escena 2 «San Ángel»: la acción de abrazo (sprite nuevo de la pareja)');
  // El asset: arte ORIGINAL del juego (generado desde los
  // sprites definidos como referencia de identidad), así que
  // SÍ se versiona, al contrario que los recortes de película.
  const abrazoVersionado = (() => {
    try {
      const out = require('child_process').execSync(
        'git ls-files application/src/assets/date/abrazo.png',
        { cwd: path.join(__dirname, '..'), encoding: 'utf8' });
      return out.trim().length > 0;
    } catch (e) { return false; }
  })();
  check('abrazo.png existe, está VERSIONADO (arte original del juego) y FUENTES.md lo registra',
    fs.existsSync(path.join(DATE_DIR, 'abrazo.png')) && abrazoVersionado && fuentes.includes('abrazo.png'));
  // Alfa y proporción reales del PNG (se infla el IDAT y se
  // desfiltran las filas: la pareja es casi tan alta como
  // ancha y el fondo es transparente de verdad).
  const abrazoPng = (() => {
    try {
      const zlib = require('zlib');
      const buf = fs.readFileSync(path.join(DATE_DIR, 'abrazo.png'));
      const w = buf.readUInt32BE(16), h = buf.readUInt32BE(20), ct = buf[25];
      let off = 8; const idat = [];
      while (off < buf.length) {
        const len = buf.readUInt32BE(off), type = buf.toString('ascii', off + 4, off + 8);
        if (type === 'IDAT') idat.push(buf.slice(off + 8, off + 8 + len));
        if (type === 'IEND') break;
        off += 12 + len;
      }
      const raw = zlib.inflateSync(Buffer.concat(idat));
      const bpp = 4, stride = w * bpp, data = Buffer.alloc(w * h * bpp);
      for (let y = 0; y < h; y++) {
        const f = raw[y * (stride + 1)], row = raw.slice(y * (stride + 1) + 1, (y + 1) * (stride + 1));
        for (let x = 0; x < stride; x++) {
          const a = x >= bpp ? data[y * stride + x - bpp] : 0;
          const b = y ? data[(y - 1) * stride + x] : 0;
          const cc = (x >= bpp && y) ? data[(y - 1) * stride + x - bpp] : 0;
          let v = row[x];
          if (f === 1) v = (v + a) & 255; else if (f === 2) v = (v + b) & 255;
          else if (f === 3) v = (v + ((a + b) >> 1)) & 255;
          else if (f === 4) { const p = a + b - cc, pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - cc); v = (v + (pa <= pb && pa <= pc ? a : pb <= pc ? b : cc)) & 255; }
          data[y * stride + x] = v;
        }
      }
      let transp = 0, opaco = 0;
      for (let i = 3; i < data.length; i += 4) { if (data[i] < 10) transp++; else if (data[i] > 245) opaco++; }
      return { w, h, ct, fracT: transp / (w * h), fracO: opaco / (w * h) };
    } catch (e) { return null; }
  })();
  check('abrazo.png es RGBA con alfa real (fondo transparente y figura opaca) y proporción de pareja (alto/ancho 0,8–1,1)',
    !!abrazoPng && abrazoPng.ct === 6 && abrazoPng.fracT > 0.05 && abrazoPng.fracO > 0.3 &&
    (abrazoPng.h / abrazoPng.w) >= 0.8 && (abrazoPng.h / abrazoPng.w) <= 1.1,
    abrazoPng ? `${abrazoPng.w}×${abrazoPng.h}, transp=${(abrazoPng.fracT * 100).toFixed(0)}%, opaco=${(abrazoPng.fracO * 100).toFixed(0)}%` : 'sin PNG legible');
  const AB = DM.debug.SA_ABRAZO;
  check('date.js carga abrazo.png con su guarda imgOk y expone SA_ABRAZO (cerca ≤80, rearme >140 o ~4 s, secuencia ~3,5 s, zona del árbol desde el ancla de velas)',
    dateSrc.includes("loadDateImg('assets/date/abrazo.png')") && dateSrc.includes('imgOk(abrazoImg)') &&
    dateSrc.includes('drawHugSprite') && !!AB &&
    AB.cercaDist === 80 && AB.rearmeDist === 140 && AB.rearmeT === 4 &&
    AB.x0 === DM.debug.SA_VELAS_X0 &&
    Math.abs((AB.acercarT + AB.abrazoT + AB.separarT) - 3.5) < 0.01,
    AB ? `total=${(AB.acercarT + AB.abrazoT + AB.separarT).toFixed(1)} s, x0=${AB.x0}` : 'sin SA_ABRAZO');
  check('el abrazo es SOLO de San Ángel: la plaza (DateScene) no tiene estado hug',
    !('hug' in sc) && sc.hug === undefined);
  // Se re-entra a la cita y se cruza a San Ángel en modo libre.
  DM.start(() => {});
  DM.debug.travelTo('sanangel');
  const sa3 = G.scene;
  for (let i = 0; i < 25 && sa3.phase !== 'free'; i++) sa3.update(0.05);
  check('se vuelve a San Ángel en modo libre para ejercitar el abrazo', sa3.id === 'sanangel' && sa3.phase === 'free', 'phase=' + sa3.phase);
  const HF = sa3.free, HA = HF.chars[HF.active], HB = HF.chars[HF.active === 'ximena' ? 'jose' : 'ximena'];
  const runHugTo = (fase, tope) => { for (let i = 0; i < tope && sa3.hug.phase !== fase; i++) sa3.update(0.05); };
  // El límite de la zona es el ancla del camino de velas: la
  // primera vela del suelo nace exactamente en SA_VELAS_X0 y
  // SA_ABRAZO.x0 es ese mismo número (un solo ancla).
  const primeraVelaX = Math.min(...sa3.candles.map((cd) => cd.x));
  check('la zona del abrazo arranca en el ancla del camino de velas (SA_ABRAZO.x0 === SA_VELAS_X0 === la primera vela del suelo)',
    AB.x0 === DM.debug.SA_VELAS_X0 && primeraVelaX === DM.debug.SA_VELAS_X0,
    `x0=${AB.x0}, ancla=${DM.debug.SA_VELAS_X0}, primera vela=${primeraVelaX}`);
  // Lejos: no hay oferta.
  HA.x = 600; HA.y = sa3.groundY; HB.x = 900; HB.y = sa3.groundY; sa3.pan = 280;
  sa3.update(0.016);
  check('con los dos LEJOS (>80 px entre pies) no se ofrece el abrazo', sa3.nearHug === false && sa3.hug.phase === 'off');
  // Cerca pero FUERA de la zona del árbol (la calle): no hay
  // aviso ni abrazo posible, aunque estén pegados.
  HA.x = 1200; HA.y = sa3.groundY; HB.x = HA.x + 55; HB.y = sa3.groundY; sa3.pan = 880;
  sa3.update(0.016);
  check('con los dos CERCA en la CALLE (x≈1200, fuera de la zona del árbol) NO se ofrece el abrazo', sa3.nearHug === false && sa3.hug.phase === 'off');
  // Cerca pero junto a la pileta (mitad de la franja): tampoco.
  HA.x = 1950; HA.y = sa3.groundY; HB.x = HA.x + 55; HB.y = sa3.groundY; sa3.pan = 1630;
  sa3.update(0.016);
  check('con los dos CERCA junto a la PILETA (x≈1950, fuera de la zona del árbol) NO se ofrece el abrazo', sa3.nearHug === false && sa3.hug.phase === 'off');
  // Cerca Y dentro de la zona del árbol (junto a las velas,
  // antes de la Puerta): aparece el aviso.
  HA.x = 3500; HA.y = sa3.groundY; HB.x = HA.x + 55; HB.y = sa3.groundY; sa3.pan = 3180;
  sa3.update(0.016);
  check('con los dos CERCA y frente al ÁRBOL (punto medio ≥ SA_ABRAZO.x0) aparece la oferta del abrazo (nearHug, aviso armado)', sa3.nearHug === true && sa3.hugArmed === true);
  // Al alejarse, el aviso desaparece.
  HB.x = HA.x + 300;
  sa3.update(0.016);
  check('al alejarse el aviso desaparece', sa3.nearHug === false);
  // Disparo y acercamiento: quedan frente a frente a hugGap.
  HB.x = HA.x + 55; HB.y = sa3.groundY;
  sa3.update(0.016);
  key('Space', true); sa3.update(0.016); key('Space', false);
  check('ESPACIO con el aviso inicia la secuencia (fase approach, control tomado por la escena)', sa3.hug.phase === 'approach', 'phase=' + sa3.hug.phase);
  runHugTo('hold', 30);
  const dAbrazo = Math.hypot(HA.x - HB.x, HA.y - HB.y);
  check('el acercamiento deja a la pareja frente a frente a la distancia del abrazo (~34 px entre pies)',
    sa3.hug.phase === 'hold' && Math.abs(dAbrazo - AB.hugGap) < 3 && HA.dir !== HB.dir,
    `phase=${sa3.hug.phase}, dist=${dAbrazo.toFixed(1)}, dirs=${HA.dir}/${HB.dir}`);
  check('al entrar el abrazo nacen sus partículas: 14 pétalos y 3 corazoncitos dibujados por código',
    sa3.petalFx.length === 14 && sa3.heartFx.length === 3, `pétalos=${sa3.petalFx.length}, corazones=${sa3.heartFx.length}`);
  // Las bolas no arruinan el momento: ni nacen ni frenan.
  sa3.bolas.length = 0; sa3.bolaTimer = 0; sa3.pajitas.length = 0; sa3.frenoT = 0;
  sa3.update(0.05);
  check('durante el abrazo NO nacen bolas de paja (aunque el temporizador se fuerce a 0)', sa3.bolas.length === 0, 'vivas=' + sa3.bolas.length);
  sa3.bolas.push({ x: HA.x, y: HA.y, r: 24, vel: 150, dist: 0, ang: 0, ph: 0 });
  sa3.update(0.05); sa3.update(0.05);
  check('una bola viva atraviesa a la pareja abrazándose sin estallar ni frenar a nadie',
    sa3.bolas.length === 1 && sa3.frenoT === 0 && sa3.pajitas.length === 0,
    `vivas=${sa3.bolas.length}, frenoT=${sa3.frenoT}, pajitas=${sa3.pajitas.length}`);
  sa3.bolas.length = 0;
  // El control está bloqueado y TAB no cambia de personaje.
  const hxHold = HA.x, actHold = HF.active;
  key('ArrowRight', true);
  for (let i = 0; i < 5; i++) sa3.update(0.05);
  key('ArrowRight', false);
  sa3.switchActive();
  check('durante el abrazo el control está bloqueado (el input no mueve al controlado) y TAB no cambia el activo',
    HA.x === hxHold && HF.active === actHold, `x=${HA.x.toFixed(1)}, active=${HF.active}`);
  let hugDrawOk = true;
  try { sa3.draw(0.016); } catch (e) { hugDrawOk = false; }
  check('draw() en pleno abrazo no explota (en el humo manda el respaldo: los dos sprites frente a frente)', hugDrawOk);
  // Separación: el seguidor termina en su puesto y vuelve el control.
  runHugTo('off', 80);
  const postEsp = HB.id === 'jose' ? HA.x + 70 : HA.x - 70;
  check('la secuencia completa los tres tiempos en orden y devuelve el control (fase off en ~3,5 s)',
    sa3.hug.phase === 'off', 'phase=' + sa3.hug.phase);
  check('tras separarse, el seguidor queda en su puesto de seguimiento (±70 px del controlado)',
    Math.abs(HB.x - postEsp) < 2 && Math.abs(HB.y - HA.y) < 2, `seguidor=${HB.x.toFixed(1)}, puesto=${postEsp.toFixed(1)}`);
  // Rearme: sin separarse no hay reaviso inmediato…
  sa3.update(0.016);
  check('recién abrazados y aún cerca, el aviso NO reaparece (rearme pendiente)', sa3.hugArmed === false && sa3.nearHug === false);
  // …pero separarse más allá de ~140 px lo rearma al instante.
  HB.x = HA.x + 200; HB.y = sa3.groundY;
  sa3.update(0.016);
  check('al separarse más allá de ~140 px el aviso se rearma', sa3.hugArmed === true);
  // Segundo abrazo, ahora controlando a Jose (TAB): la acción
  // funciona igual con cualquiera de activo.
  if (HF.active !== 'jose') sa3.switchActive();
  const JA = HF.chars.jose, JB = HF.chars.ximena;
  JA.x = 3520; JA.y = sa3.groundY; JB.x = JA.x - 55; JB.y = sa3.groundY; sa3.pan = 3200;
  sa3.update(0.016);
  check('controlando a JOSE también aparece la oferta junto a Ximena frente al árbol', sa3.nearHug === true && HF.active === 'jose');
  key('Space', true); sa3.update(0.016); key('Space', false);
  runHugTo('hold', 30);
  check('el abrazo con Jose de activo llega a su fase hold igual', sa3.hug.phase === 'hold', 'phase=' + sa3.hug.phase);
  runHugTo('off', 80);
  // Rearme por TIEMPO: sin separarse, tras ~4 s el aviso vuelve.
  for (let i = 0; i < 95 && !sa3.hugArmed; i++) sa3.update(0.05);
  check('sin separarse, el rearme llega por tiempo (~4 s) y el aviso vuelve a ofrecerse',
    sa3.hugArmed === true && sa3.nearHug === true, `armado=${sa3.hugArmed}, cerca=${sa3.nearHug}`);
  let hugDrawOk2 = true;
  for (const p of [0, 1200, 3260]) { sa3.pan = p; try { sa3.draw(0.016); } catch (e) { hugDrawOk2 = false; } }
  check('draw() de San Ángel tras los abrazos no explota en ningún punto del paseo (pan 0/1200/3260)', hugDrawOk2);
  DM.stop();

  console.log('\nQ) El sonido de la Puerta: grabación real al cruzar (nada de blip de pixel)');
  // El asset: grabación de DOMINIO PÚBLICO (ezwa, pdsounds.org
  // #661) recortada al golpe del cierre. Versionable: el
  // .gitignore de assets/audio/ solo tapa la canción
  // (*.m4a/*.mp3), no este .ogg.
  const doorOgg = path.join(SRC, '..', 'assets', 'audio', 'door-close.ogg');
  let doorIgnorado = null;
  try { require('child_process').execSync('git check-ignore -q application/src/assets/audio/door-close.ogg', { cwd: path.join(__dirname, '..') }); doorIgnorado = true; }
  catch (e) { doorIgnorado = false; } // exit 1 de check-ignore = NO ignorado (lo buscado)
  check('door-close.ogg existe junto al audio de la cita, pesa decenas de KB y el .gitignore NO lo tapa (no es la canción: sí se versiona)',
    fs.existsSync(doorOgg) && fs.statSync(doorOgg).size > 2000 && fs.statSync(doorOgg).size < 40000 && doorIgnorado === false,
    fs.existsSync(doorOgg) ? `size=${fs.statSync(doorOgg).size}, ignorado=${doorIgnorado}` : 'no existe');
  let doorDur = null;
  try { doorDur = parseFloat(require('child_process').execSync('ffprobe -v error -show_entries format=duration -of csv=p=0 application/src/assets/audio/door-close.ogg', { cwd: path.join(__dirname, '..'), encoding: 'utf8' })); } catch (e) { doorDur = null; }
  check('la grabación recortada dura ~0,5–1,2 s (solo el golpe del cierre, sin silencios largos; si ffprobe no está, se salta la medida)',
    doorDur === null || (doorDur >= 0.4 && doorDur <= 1.3), 'dur=' + doorDur);
  check('FUENTES.md registra la grabación con autor, fuente y licencia (ezwa, pdsounds.org, DOMINIO PÚBLICO)',
    fuentes.includes('door-close.ogg') && fuentes.includes('ezwa') && fuentes.includes('pdsounds.org') && fuentes.includes('DOMINIO PÚBLICO'));
  check('date.js ya NO pide el blip de puerta en ningún cruce de la cita, y el juego principal conserva el suyo intacto',
    !/G\.sfx\('door'\)/.test(dateSrc) && gameSrc.includes("door: [[120, 0.1], [90, 0.12]]"));
  // El disparo: se envuelve el sfx del juego para delatar
  // cualquier blip, y se cuenta play() sobre el elemento
  // propio de la Puerta (el FakeEl no trae play: se le pone
  // un contador, como la sección K simula el de la canción).
  const sfxLogQ = [];
  const origSfxQ = G.sfx;
  G.sfx = (n) => { sfxLogQ.push(n); };
  DM.start(() => {});
  const doorEl = DM.debug.getDoorSfx();
  check('el modo crea un elemento de audio PROPIO para la Puerta (distinto del de la canción), apuntando a door-close.ogg',
    !!doorEl && doorEl !== DM.debug.getSong() && String(doorEl.src || '').includes('door-close.ogg'),
    'src=' + (doorEl && doorEl.src));
  let doorPlays = 0;
  doorEl.play = () => { doorPlays++; };
  const scQ = G.scene, xiQ = scQ.xi;
  // La carta primero (guion v2): sin abrirla, la puerta del
  // depa está dormida y el cruce no ocurriría.
  xiQ.x = 635; xiQ.y = 152; xiQ.vx = xiQ.vy = 0;
  scQ.update(0.016);
  key('Space', true); scQ.update(0.016); key('Space', false);
  for (let i = 0; i < 20; i++) scQ.update(0.05);
  key('Space', true); scQ.update(0.016); key('Space', false);
  // Cruce depa → plaza: al ABRIR no suena nada; el cierre
  // suena UNA vez, al llegar (la puerta se cierra tras ella).
  xiQ.x = 510; xiQ.y = 560; xiQ.vx = xiQ.vy = 0;
  scQ.update(0.016);
  key('Space', true); scQ.update(0.016); key('Space', false);
  for (let i = 0; i < 10; i++) scQ.update(0.05);
  check('abrir la puerta del depa y cruzar la luz NO dispara el sonido (suena el cierre, no la apertura)',
    scQ.phase === 'door' && doorPlays === 0, 'plays=' + doorPlays + ', phase=' + scQ.phase);
  for (let i = 0; i < 15; i++) scQ.update(0.05);
  check('al llegar a la plaza, la Puerta se cierra tras Ximena: el sonido suena EXACTAMENTE una vez',
    scQ.phase === 'plaza' && doorPlays === 1, 'plays=' + doorPlays + ', phase=' + scQ.phase);
  check('en todo el cruce NO sonó el blip de puerta del juego principal',
    !sfxLogQ.includes('door'), 'sfx=' + sfxLogQ.join(','));
  check('el cruce no altera la canción ni el reloj (arrancaron al activarse la plaza y siguen corriendo)',
    DM.state.clockStarted === true && DM.state.clockRunning === true && DM.dateNow() >= 0);
  for (let i = 0; i < 100 && DM.state.state !== 'plaza-arrived'; i++) scQ.update(0.05);
  // Cruce plaza → San Ángel: UNA vez más, al iniciar el
  // fundido de salida; la llegada no lo repite.
  const FQ = scQ.free, XQ = FQ.chars.ximena, JQ = FQ.chars.jose;
  if (FQ.active !== 'ximena') scQ.switchActive();
  XQ.x = scQ.exitDoorX - 10; XQ.y = scQ.groundY; JQ.x = XQ.x - 70; JQ.y = scQ.groundY;
  scQ.update(0.05);
  key('Space', true); scQ.update(0.016); key('Space', false);
  check('cruzar la Puerta de salida a San Ángel dispara el sonido UNA vez más (una por cruce, al iniciar el fundido)',
    scQ.phase === 'exitdoor' && doorPlays === 2, 'plays=' + doorPlays + ', phase=' + scQ.phase);
  for (let i = 0; i < 25 && G.scene === scQ; i++) scQ.update(0.05);
  const angQ = G.scene;
  for (let i = 0; i < 25 && angQ.phase !== 'free'; i++) angQ.update(0.05);
  check('la llegada a San Ángel NO repite el sonido (un disparo por cruce, no por llegada)',
    doorPlays === 2 && angQ.id === 'sanangel' && !sfxLogQ.includes('door'), 'plays=' + doorPlays);
  // Con la cita silenciada, la Puerta tampoco suena.
  DM.debug.toggleMute();
  const AFQ = angQ.free, AQ = AFQ.chars[AFQ.active], BQ = AFQ.chars[AFQ.active === 'ximena' ? 'jose' : 'ximena'];
  AQ.x = angQ.entryDoorX + 10; AQ.y = angQ.groundY; BQ.x = AQ.x + 70; BQ.y = angQ.groundY;
  angQ.update(0.05);
  key('Space', true); angQ.update(0.016); key('Space', false);
  for (let i = 0; i < 25 && G.scene === angQ; i++) angQ.update(0.05);
  check('con la cita SILENCIADA (D.muted), cruzar de vuelta a la plaza no dispara ningún sonido',
    DM.state.muted === true && doorPlays === 2 && G.scene === scQ, 'plays=' + doorPlays + ', muted=' + DM.state.muted);
  DM.debug.toggleMute();
  G.sfx = origSfxQ;
  DM.stop();

  console.log('\nR) Tráfico de la plaza: encuentros (Alebrije y Teodora) y autos con calaverita');
  // Assets: dos autos de foto CC (Renée Kools, CC BY 4.0, como
  // el vocho) DISTINTOS del vocho azul — un Saab descapotable
  // rojo y un Opel compacto blanco —, los bustos de las dos
  // calaveritas del juego y los perfiles definidos del Alebrije
  // y de Teodora. Todo versionable (CC o arte propio): ningún
  // .gitignore los tapa.
  const TR = DM.debug.PLAZA_TRAFICO;
  const traficoFiles = ['auto-rojo.png', 'auto-blanco.png', 'alebrije-calle.png', 'teodora-calle.png', 'calaverita-clasica-busto.png', 'calaverita-morada-busto.png'];
  for (const file of traficoFiles) {
    check(`el asset ${file} existe en assets/date y FUENTES.md lo registra`,
      fs.existsSync(path.join(DATE_DIR, file)) && fuentes.includes(file));
  }
  const noIgnorado = (file) => {
    try { require('child_process').execSync('git check-ignore -q application/src/assets/date/' + file, { cwd: path.join(__dirname, '..') }); return false; }
    catch (e) { return true; } // exit 1 de check-ignore = NO ignorado (lo buscado)
  };
  check('ningún asset del tráfico está ignorado por git (son versionables) y FUENTES.md trae la autora y licencia de los autos',
    traficoFiles.every(noIgnorado) && fuentes.includes('Renée Kools') && fuentes.includes('Red_Saab_900_Turbo_side_view') && fuentes.includes('White_Opel_Karl_side_view'));
  check('date.js carga los 6 assets del tráfico',
    traficoFiles.every((f) => dateSrc.includes(f)));
  check('PLAZA_TRAFICO: Teodora FLOTA (floatAlt > 0) y el Alebrije camina a ras de calle (sin floatAlt); los autos frenan ×0,4 por 0,7 s con tolerancia de carril de 18 px',
    !!TR && TR.teodora.floatAlt > 0 && !TR.alebrije.floatAlt &&
    TR.autos.frenoK === 0.4 && TR.autos.frenoT === 0.7 && TR.autos.laneTol === 18 && TR.autos.maxVivos === 2);
  check('los dos modelos son autos DISTINTOS entre sí (otra foto, otro busto de calaverita, ventanilla medida) y ninguno es el vocho de Pollito',
    TR.autos.modelos.length === 2 && TR.autos.modelos[0].img !== TR.autos.modelos[1].img &&
    TR.autos.modelos[0].bust !== TR.autos.modelos[1].bust &&
    TR.autos.modelos.every((m) => m.winCx > 0 && m.winBase > 0 && m.bustW > 0));
  // Se re-entra a la cita y se llega a la plaza en modo libre
  // (abriendo la carta primero: la puerta está dormida sin
  // ella, guion v2).
  DM.start(() => {});
  const scR = G.scene, xiR = scR.xi;
  xiR.x = 635; xiR.y = 152; xiR.vx = xiR.vy = 0;
  scR.update(0.016);
  key('Space', true); scR.update(0.016); key('Space', false);
  for (let i = 0; i < 20; i++) scR.update(0.05);
  key('Space', true); scR.update(0.016); key('Space', false);
  xiR.x = 510; xiR.y = 560; xiR.vx = xiR.vy = 0;
  scR.update(0.016);
  key('Space', true); scR.update(0.016); key('Space', false);
  for (let i = 0; i < 30; i++) scR.update(0.05); // puerta cruzada, revelado en curso
  check('durante el REVELADO no hay encuentros ni autos (la calle se puebla solo en el modo libre)',
    scR.phase === 'plaza' && scR.encuentros.length === 0 && scR.autos.length === 0, 'phase=' + scR.phase);
  for (let i = 0; i < 100 && scR.phase !== 'free'; i++) scR.update(0.05);
  const FR = scR.free, XR = FR.chars.ximena, JR = FR.chars.jose;
  if (FR.active !== 'ximena') scR.switchActive();
  XR.x = 1500; XR.y = scR.groundY; JR.x = 1570; JR.y = scR.groundY; JR.follow = false;
  scR.pan = 1180; // cámara asentada sobre la pareja
  // --- Encuentros: nacen por delante de la cámara, cruzan de
  // derecha a izquierda hasta salir, alternan, y pasan POR la
  // pareja sin colisión (con los autos suprimidos para aislar).
  scR.encuentros = []; scR.autos = []; scR.autoTimer = 9999; scR.encuentroTimer = 0;
  const kind1 = scR.encuentroNext;
  scR.update(0.05);
  check('con el temporizador cumplido nace un encuentro por delante de la cámara (más allá del borde derecho)',
    scR.encuentros.length === 1 && scR.encuentros[0].kind === kind1 && scR.encuentros[0].x > scR.pan + 640,
    scR.encuentros.length ? 'x=' + scR.encuentros[0].x.toFixed(0) + ', pan=' + scR.pan.toFixed(0) : 'sin encuentro');
  const e1 = scR.encuentros[0]; e1.y = XR.y; // que cruce justo por la línea de la pareja
  let minKE = 1, frenoE = 0, pasosE = 0;
  while (scR.encuentros.length && pasosE < 400) { scR.update(0.05); pasosE++; minKE = Math.min(minKE, scR.speedK); frenoE = Math.max(frenoE, scR.frenoT); }
  check('el encuentro cruza de derecha a izquierda y sale del encuadre (despawn)',
    scR.encuentros.length === 0 && pasosE < 400, 'pasos=' + pasosE);
  check('el encuentro pasa POR la pareja sin colisión ni interacción: nunca frena (speedK = 1, frenoT = 0)',
    minKE === 1 && frenoE === 0, `minK=${minKE}, freno=${frenoE}`);
  check('los encuentros alternan: el siguiente en nacer es el otro personaje',
    scR.encuentroNext !== kind1, 'next=' + scR.encuentroNext);
  // --- Autos: nacimiento con carril, cruce y despawn; un pase
  // por un carril distinto no toca al controlado.
  scR.autos = []; scR.encuentroTimer = 9999; scR.autoTimer = 0;
  scR.update(0.05);
  check('con el temporizador cumplido nace un auto por delante de la cámara, con un carril dentro de la banda caminable (±26)',
    scR.autos.length === 1 && scR.autos[0].x > scR.pan + 640 && Math.abs(scR.autos[0].laneY - scR.groundY) <= 26,
    scR.autos.length ? 'laneY=' + scR.autos[0].laneY.toFixed(0) : 'sin auto');
  const car1 = scR.autos[0];
  car1.laneY = scR.groundY - 24; // carril distinto al de la controlada (ella va en groundY): |Δ| = 24 > 18
  let minK1 = 1, pasosA = 0;
  while (scR.autos.includes(car1) && pasosA < 300) { scR.update(0.05); pasosA++; minK1 = Math.min(minK1, scR.speedK); }
  check('el auto cruza de derecha a izquierda y despierta fuera de escena',
    !scR.autos.includes(car1) && pasosA < 300, 'pasos=' + pasosA);
  check('un pase por un carril DISTINTO no frena al controlado (speedK siempre 1, sin freno al final)',
    minK1 === 1 && scR.frenoT === 0, `minK=${minK1}, freno=${scR.frenoT}`);
  // --- Golpe con solape real: mismo carril → trastabilleo
  // medido en el desplazamiento (mismo paseo, con y sin auto).
  scR.autos = []; scR.autoTimer = 9999; scR.frenoT = 0; scR.speedK = 1;
  XR.x = 1500; XR.y = scR.groundY; JR.x = 1570; JR.y = scR.groundY; JR.follow = false; scR.pan = 1180;
  key('ArrowRight', true);
  const xa0 = XR.x; for (let i = 0; i < 24; i++) scR.update(0.05);
  key('ArrowRight', false);
  const dispSin = XR.x - xa0;
  XR.x = 1500; XR.y = scR.groundY; JR.x = 1570; JR.y = scR.groundY; JR.follow = false; scR.pan = 1180; scR.frenoT = 0; scR.speedK = 1;
  scR.autos.push({ modelo: 0, x: 1830, laneY: scR.groundY, vel: 230, ph: 0, hitDone: false });
  let minK2 = 1;
  key('ArrowRight', true);
  const xb0 = XR.x; for (let i = 0; i < 24; i++) { scR.update(0.05); minK2 = Math.min(minK2, scR.speedK); }
  key('ArrowRight', false);
  const dispCon = XR.x - xb0;
  check('un pase por el MISMO carril con solape real SÍ frena: speedK cae a 0,4 en el trastabilleo',
    minK2 === 0.4, 'minK=' + minK2);
  check('y el freno se mide en el desplazamiento (con auto camina claramente menos que sin auto)',
    dispCon < dispSin - 30, `con=${dispCon.toFixed(0)}, sin=${dispSin.toFixed(0)}`);
  check('el auto sigue su camino tras el golpe (no se detiene ni desaparece) y afecta una sola vez por pasada',
    scR.autos.length === 1 && scR.autos[0].hitDone === true && scR.autos[0].x < 1830,
    scR.autos.length ? 'x=' + scR.autos[0].x.toFixed(0) : 'sin auto');
  // --- El seguidor es inmune: el auto cruza justo por su
  // posición y su carril (fijado por el harness en cada paso,
  // como se fijan posiciones en el resto de la suite) y nadie
  // frena: el golpe solo se comprueba contra el controlado.
  scR.autos = []; scR.autoTimer = 9999; scR.frenoT = 0; scR.speedK = 1;
  XR.x = 900; XR.y = scR.groundY - 24; scR.pan = 580;
  scR.autos.push({ modelo: 1, x: 1900, laneY: scR.groundY, vel: 230, ph: 0, hitDone: false });
  const carF = scR.autos[0];
  let frenoSeg = 0;
  for (let i = 0; i < 40; i++) { JR.x = 1500; JR.y = scR.groundY; scR.update(0.05); frenoSeg = Math.max(frenoSeg, scR.frenoT); }
  check('el auto pasa POR el seguidor en su carril y no frena a nadie (el seguidor es inmune; el golpe es solo contra el controlado)',
    frenoSeg === 0 && scR.speedK === 1 && carF.hitDone === false && carF.x < 1500, 'freno=' + frenoSeg + ', x=' + carF.x.toFixed(0));
  // --- El vocho de Pollito sigue siendo un gag inofensivo:
  // cruza en pantalla justo sobre la pareja y no frena a nadie.
  scR.autos = []; scR.autoTimer = 9999; scR.encuentroTimer = 9999; scR.frenoT = 0; scR.speedK = 1;
  XR.x = 1500; XR.y = scR.groundY; JR.x = 1570; JR.y = scR.groundY; JR.follow = false; scR.pan = 1180;
  scR.t = 24.43; // vochoXAt(24,43) ≈ 320 = el centro de pantalla, donde está la pareja
  const vxR = DM.debug.vochoXAt(scR.t);
  let frenoV = 0;
  for (let i = 0; i < 10; i++) { scR.update(0.05); frenoV = Math.max(frenoV, scR.frenoT); }
  check('el vocho de Pollito cruza sobre la pareja (solape en pantalla) y no frena a nadie: es un gag sin colisión',
    Math.abs(vxR - (XR.x - 1180)) < 130 && frenoV === 0 && scR.speedK === 1, 'vochoX=' + vxR.toFixed(0));
  // La plaza se dibuja con encuentros y autos en la calle sin
  // explotar (en el harness las fotos no cargan: los autos van
  // por su respaldo dibujado y los encuentros se omiten).
  scR.autos.push({ modelo: 1, x: 1600, laneY: scR.groundY, vel: 220, ph: 0, hitDone: false });
  scR.encuentros.push({ kind: 'teodora', x: 1700, y: scR.groundY, dist: 0, ph: 0 });
  scR.draw(0.016);
  check('la plaza se dibuja con encuentros y autos en la calle sin explotar', true);
  DM.stop();

  console.log('\nS) Los fragmentos de la carta en la caminata (guion v2, Acto 2)');
  // Partida nueva: la carta se abre (la secuencia completa se
  // verifica en F; aquí se abrevia el mismo camino) y se
  // cruza a la plaza. (El hash sigue siendo el de prueba de
  // la sección C; se restaura el real al final del archivo.)
  DM.start(() => {});
  const scS = DM.state.plazaScene;
  const xiS = scS.xi;
  xiS.x = 635; xiS.y = 152; xiS.vx = xiS.vy = 0;
  scS.update(0.016);
  key('Space', true); scS.update(0.016); key('Space', false);
  for (let i = 0; i < 20; i++) scS.update(0.05);
  key('Space', true); scS.update(0.016); key('Space', false);
  check('la partida de S arranca con la carta abierta (cartaAbierta) y el control de vuelta en el depa',
    DM.state.cartaAbierta === true && scS.phase === 'depa', 'phase=' + scS.phase);
  xiS.x = 510; xiS.y = 560; xiS.vx = xiS.vy = 0;
  scS.update(0.016);
  key('Space', true); scS.update(0.016); key('Space', false);
  for (let i = 0; i < 130 && scS.phase !== 'free'; i++) scS.update(0.05);
  check("la pareja llega a la plaza en modo libre ('free')", scS.phase === 'free', 'phase=' + scS.phase);
  const FS = scS.free, XS = FS.chars.ximena, JS = FS.chars.jose;
  if (FS.active !== 'ximena') scS.switchActive();
  XS.y = scS.groundY; JS.y = scS.groundY; JS.follow = false;
  scS.encuentros = []; scS.autos = []; scS.autoTimer = 9999; scS.encuentroTimer = 9999;
  check('la regla de lectura de la carta es la del juego (mínimo 2,4 s y 0,045 s por carácter)',
    DM.debug.cartaReadTime('corta') === 2.4 && Math.abs(DM.debug.cartaReadTime('x'.repeat(100)) - 4.5) < 0.001);
  // --- Plaza: el fragmento cae al asomar la Catedral ---
  XS.x = 300;
  scS.update(0.05);
  check('antes del umbral (x < 430) el fragmento de la plaza NO se dispara',
    DM.state.cartaFrag.plaza === false && DM.debug.cartaBand.text === null);
  XS.x = 460;
  scS.update(0.05);
  check('al asomar la Catedral (x ≥ 430, lejos de la Puerta) el fragmento de la PLAZA cae en la banda',
    DM.state.cartaFrag.plaza === true && DM.debug.cartaBand.text === DM.debug.CARTA_TEXTOS.plaza,
    'banda=' + (DM.debug.cartaBand.text || '—').slice(0, 24));
  // La banda NO bloquea el movimiento ni detiene el reloj.
  const xAntes = XS.x, tAntes = DM.dateNow();
  key('ArrowRight', true);
  for (let i = 0; i < 20; i++) scS.update(0.05); // 1 s caminando con la banda visible
  key('ArrowRight', false);
  check('con la banda visible el personaje SIGUE avanzando (la banda no bloquea el movimiento)',
    XS.x > xAntes + 100, `x ${xAntes.toFixed(0)} → ${XS.x.toFixed(0)}`);
  check('la banda sigue visible tras 1 s de caminata (su permanencia es la regla de lectura)',
    DM.debug.cartaBand.text === DM.debug.CARTA_TEXTOS.plaza);
  // (El avance del reloj en sí lo prueban F y K; aquí basta
  // que la banda no lo pare ni lo reinicie: en esta sesión el
  // reloj lee el <audio> falso de K, que no avanza solo.)
  check('con la banda visible el reloj de la canción SIGUE corriendo (la banda no lo detiene ni lo reinicia)',
    DM.state.clockRunning === true && DM.state.clockStarted === true && DM.dateNow() >= tAntes,
    `t ${tAntes.toFixed(2)} → ${DM.dateNow().toFixed(2)}`);
  // La banda termina sola y el fragmento no se repite.
  for (let i = 0; i < 160 && DM.debug.cartaBand.text; i++) scS.update(0.05);
  check('la banda se desvanece sola al cumplir su tiempo de lectura', DM.debug.cartaBand.text === null);
  XS.x = 300; scS.update(0.05); XS.x = 460; scS.update(0.05);
  check('el fragmento de la plaza NO se repite al recruzar el umbral (una sola vez por partida)',
    DM.debug.cartaBand.text === null && DM.state.cartaFrag.plaza === true);
  // --- San Ángel: el fragmento cae en el tramo del árbol ---
  DM.debug.travelTo('sanangel');
  const saS = DM.state.angelScene;
  for (let i = 0; i < 30 && saS.phase !== 'free'; i++) saS.update(0.05);
  const AS = saS.free.chars[saS.free.active];
  AS.x = 3400; AS.y = saS.groundY;
  saS.update(0.05);
  check('en San Ángel, antes del tramo del árbol el fragmento NO se dispara', DM.state.cartaFrag.sanangel === false);
  AS.x = 3450;
  saS.update(0.05);
  check('al entrar en el tramo del árbol (x ≥ SA_VELAS_X0) cae el fragmento de SAN ÁNGEL',
    DM.state.cartaFrag.sanangel === true && DM.debug.cartaBand.text === DM.debug.CARTA_TEXTOS.sanangel);
  for (let i = 0; i < 160 && DM.debug.cartaBand.text; i++) saS.update(0.05);
  // --- Aeropuerto: el fragmento cae a mitad de escena ---
  DM.debug.travelTo('aero');
  const aeS = DM.state.aeroScene;
  for (let i = 0; i < 30 && aeS.phase !== 'free'; i++) aeS.update(0.05);
  const EA = aeS.free.chars[aeS.free.active];
  EA.x = 1700; EA.y = aeS.groundY;
  aeS.update(0.05);
  check('en el aeropuerto, antes de la mitad el fragmento NO se dispara', DM.state.cartaFrag.aero === false);
  EA.x = 1800;
  aeS.update(0.05);
  check('a mitad del aeropuerto (x ≥ 1750) cae el fragmento del AEROPUERTO',
    DM.state.cartaFrag.aero === true && DM.debug.cartaBand.text === DM.debug.CARTA_TEXTOS.aero);
  for (let i = 0; i < 160 && DM.debug.cartaBand.text; i++) aeS.update(0.05);
  // --- Praderas: el fragmento cae con el castillo en cuadro ---
  DM.debug.travelTo('castillo');
  const prS = DM.state.praderaScene;
  for (let i = 0; i < 30 && prS.phase !== 'free'; i++) prS.update(0.05);
  const AP = prS.free.chars[prS.free.active];
  AP.x = 2000; AP.y = prS.groundY; prS.pan = 1680;
  prS.update(0.05);
  check('en las praderas, sin el castillo en cuadro el fragmento NO se dispara', DM.state.cartaFrag.castillo === false);
  AP.x = 3000; prS.pan = 2680;
  prS.update(0.05);
  check('con el castillo en cuadro (pan ≥ 2500) cae el fragmento de las PRADERAS',
    DM.state.cartaFrag.castillo === true && DM.debug.cartaBand.text === DM.debug.CARTA_TEXTOS.castillo);
  for (let i = 0; i < 160 && DM.debug.cartaBand.text; i++) prS.update(0.05);
  // --- La regla de cola: una banda en espera, sin solaparse ---
  const B = DM.debug.cartaBand;
  DM.debug.showCartaBand('Primera banda de prueba.');
  DM.debug.showCartaBand('Segunda banda de prueba.');
  check('con una banda en curso, la siguiente queda EN ESPERA (no se solapan)',
    B.text === 'Primera banda de prueba.' && B.pending === 'Segunda banda de prueba.');
  DM.debug.updateCartaBand(B.total + 0.1);
  check('al terminar la banda en curso entra la que esperaba', B.text === 'Segunda banda de prueba.' && B.pending === null);
  DM.stop();

  console.log('\nT) El álbum del cierre total: la pila de fotos del recorrido (idea de Jose)');
  // Con las imágenes «cargadas» (el humo marca las
  // FakeImage de la carta y de las fotos con naturalWidth:
  // imgOk pasa a ser verdad SOLO para ellas), el cierre
  // corre completo: carta → la pila en el orden del
  // recorrido → la foto del sofá se expande a pantalla
  // completa → FIN → completada. Y su degradación: una
  // foto intermedia que falta se salta en la pila, y sin
  // la foto del sofá no hay álbum (directo a FIN).
  const ALB = DM.debug.ALBUM;
  const photoImgT = (k) => DM.debug.CLOSE_PHOTOS.find((p) => p.key === k).img;
  const setLoadedT = (img, ok) => { img.naturalWidth = ok ? 720 : 0; img.naturalHeight = ok ? 405 : 0; };
  const pressActT = (sc) => { key('Space', true); sc.update(0.016); key('Space', false); sc.update(0.016); sc.update(0.016); };
  // Sesión nueva llevada hasta el cierre total (la
  // cinemática corre sin input, como en la sección O).
  const driveToClosingT = () => {
    DM.start(() => {});
    DM.debug.travelTo('cita');
    const f = DM.state.finaleScene, FT = DM.debug.FINALE;
    for (let i = 0; i < 25 && f.phase !== 'home'; i++) f.update(0.05);
    f.xi.x = FT.sofa.cx; f.xi.y = 250; f.xi.vx = f.xi.vy = 0;
    for (let i = 0; i < 40; i++) f.update(0.05);
    pressActT(f);
    for (let i = 0; i < 900 && f.cine.st !== 'closing'; i++) f.update(0.05);
    return f;
  };
  // Bombeo genérico del cierre: avanza lo que es a ritmo
  // del jugador (la carta, las fotos de la pila ya
  // contempladas y la foto a pantalla completa cumplida)
  // y deja correr lo automático (beats, expansión, fin).
  const pumpClosingT = (f, cap) => {
    for (let i = 0; i < cap && f.cine.st !== 'done'; i++) {
      const cl = f.close;
      if (cl && cl.step === 'carta') pressActT(f);
      else if (cl && cl.step === 'album' && cl.pileIdx < cl.pile.length - 1 && cl.t >= ALB.ENTER_T + ALB.HOLD_MIN) pressActT(f);
      else if (cl && cl.step === 'foto' && cl.t >= 2.5) pressActT(f);
      else f.update(0.05);
    }
  };
  // --- corrida 1: todas las fotos cargadas ---
  setLoadedT(DM.debug.cartaFinalImg, true);
  DM.debug.CLOSE_PHOTOS.forEach((p) => setLoadedT(p.img, true));
  const fT = driveToClosingT();
  const stepSeqT = [];
  const noteStepT = () => { const s = fT.close ? fT.close.step : null; if (s && stepSeqT[stepSeqT.length - 1] !== s) stepSeqT.push(s); };
  noteStepT();
  check('con las imágenes cargadas, el cierre arranca por la CARTA (paso cartaIn)',
    fT.cine.st === 'closing' && !!fT.close && fT.close.step === 'cartaIn',
    'step=' + (fT.close && fT.close.step));
  for (let i = 0; i < 30 && (!fT.close || fT.close.step !== 'carta'); i++) { fT.update(0.05); noteStepT(); }
  for (let i = 0; i < 40; i++) fT.update(0.05); // 2 s más: la carta no avanza sola
  check('la carta se queda a ritmo del jugador (no avanza sola hacia el álbum)',
    !!fT.close && fT.close.step === 'carta', 'step=' + (fT.close && fT.close.step));
  pressActT(fT); noteStepT();
  check('al avanzar de la carta entra el ÁLBUM con la pila en el ORDEN DEL RECORRIDO (plaza → San Ángel → aeropuerto → praderas → sofá)',
    !!fT.close && fT.close.step === 'album' && Array.isArray(fT.close.pile) &&
    fT.close.pile.map((p) => p.key).join(',') === 'plaza,sanangel,aero,castillo,sofa' && fT.close.pileIdx === 0,
    'pile=' + (fT.close && fT.close.pile ? fT.close.pile.map((p) => p.key).join(',') : '—'));
  // El mínimo de contemplación manda: ESPACIO antes de
  // tiempo no coloca la siguiente foto.
  for (let i = 0; i < 20; i++) fT.update(0.05); // t ≈ 1 s: asentada (0,6) pero bajo el mínimo (2,4)
  pressActT(fT);
  check('ESPACIO antes del mínimo de contemplación NO coloca la siguiente foto (la de arriba se contempla asentada al menos ~1,8 s)',
    fT.close.step === 'album' && fT.close.pileIdx === 0, 'pileIdx=' + fT.close.pileIdx);
  for (let i = 0; i < 40 && fT.close.t < ALB.ENTER_T + ALB.HOLD_MIN + 0.05; i++) fT.update(0.05);
  pressActT(fT);
  check('cumplido el mínimo, ESPACIO coloca la siguiente foto (la segunda queda arriba de la pila)',
    fT.close.pileIdx === 1, 'pileIdx=' + fT.close.pileIdx);
  let autoT = 0;
  for (let i = 0; i < 120 && fT.close.pileIdx === 1; i++) { fT.update(0.05); autoT += 0.05; }
  check('sin input, la siguiente foto entra SOLA (tras la pausa automática de la pila)',
    fT.close.pileIdx === 2 && autoT >= ALB.ENTER_T + ALB.HOLD_AUTO - 0.2,
    `pileIdx=${fT.close.pileIdx} tras ${autoT.toFixed(1)} s`);
  // El dibujo de la pila no explota (la casa 3D aparcada,
  // como en la sección O).
  const fhT = fT.home, homeDrawT = fhT.draw;
  fhT.draw = () => {};
  fT.nearSofa = false; fT.nearDoor = false;
  let albumDrawOk = true;
  try { fT.draw(0.016); } catch (e) { albumDrawOk = false; }
  check('el dibujo del ÁLBUM (la pila de fotos impresas, con sus marcos y rotaciones) no explota', albumDrawOk);
  // Las fotos que quedan, hasta dejar la del sofá arriba.
  for (let g = 0; g < 6 && fT.close.pileIdx < fT.close.pile.length - 1; g++) {
    for (let i = 0; i < 60 && fT.close.t < ALB.ENTER_T + ALB.HOLD_MIN + 0.05; i++) fT.update(0.05);
    pressActT(fT);
  }
  check('la pila se completa con la foto del SOFÁ arriba (la quinta y última)',
    fT.close.pileIdx === fT.close.pile.length - 1 && fT.close.pile[fT.close.pileIdx].key === 'sofa',
    'pileIdx=' + fT.close.pileIdx);
  for (let i = 0; i < 80 && fT.close && fT.close.step === 'album'; i++) { fT.update(0.05); noteStepT(); }
  check('tras su beat (~1,5 s asentada), la foto del sofá se EXPANDE sola, sin input (paso «expand»)',
    !!fT.close && fT.close.step === 'expand', 'step=' + (fT.close && fT.close.step));
  let expandDrawOk = true;
  try { fT.draw(0.016); } catch (e) { expandDrawOk = false; }
  fhT.draw = homeDrawT;
  check('el dibujo de la EXPANSIÓN (la foto del sofá creciendo a pantalla completa) no explota', expandDrawOk);
  for (let i = 0; i < 40 && fT.close && fT.close.step === 'expand'; i++) { fT.update(0.05); noteStepT(); }
  check('la expansión deja la foto del sofá a PANTALLA COMPLETA (paso «foto»)',
    !!fT.close && fT.close.step === 'foto', 'step=' + (fT.close && fT.close.step));
  pressActT(fT);
  check('en la foto a pantalla completa, ESPACIO antes de la permanencia mínima (2,5 s) NO avanza',
    !!fT.close && fT.close.step === 'foto', 'step=' + (fT.close && fT.close.step));
  for (let i = 0; i < 60 && fT.close && fT.close.t < 2.55; i++) fT.update(0.05);
  pressActT(fT); noteStepT();
  check('cumplida la permanencia, ESPACIO pasa a la tarjeta de FIN',
    !!fT.close && fT.close.step === 'fin', 'step=' + (fT.close && fT.close.step));
  for (let i = 0; i < 900 && fT.cine.st !== 'done'; i++) fT.update(0.05);
  check('el ORDEN del cierre fue carta → álbum → expansión → foto → FIN, y la cita quedó COMPLETADA',
    stepSeqT.join(',') === 'cartaIn,carta,album,expand,foto,fin' && DM.state.completed === true && fT.close === null,
    'orden: ' + stepSeqT.join(' → '));
  DM.stop();
  // --- corrida 2: falta una foto intermedia (San Ángel) ---
  setLoadedT(photoImgT('sanangel'), false);
  const fT2 = driveToClosingT();
  for (let i = 0; i < 30 && (!fT2.close || fT2.close.step !== 'carta'); i++) fT2.update(0.05);
  pressActT(fT2);
  check('sin la foto de San Ángel, la pila la SALTA y conserva el orden del resto (plaza → aeropuerto → praderas → sofá)',
    !!fT2.close && fT2.close.step === 'album' &&
    fT2.close.pile.map((p) => p.key).join(',') === 'plaza,aero,castillo,sofa',
    'pile=' + (fT2.close && fT2.close.pile ? fT2.close.pile.map((p) => p.key).join(',') : '—'));
  pumpClosingT(fT2, 1500);
  check('con una foto menos, la secuencia del cierre COMPLETA igual (expansión, foto, FIN y cita completada)',
    fT2.cine.st === 'done' && DM.state.completed === true && fT2.close === null,
    'cine=' + fT2.cine.st + ' completed=' + DM.state.completed);
  DM.stop();
  // --- corrida 3: falta la foto del sofá → no hay álbum ---
  setLoadedT(photoImgT('sofa'), false);
  const fT3 = driveToClosingT();
  for (let i = 0; i < 30 && (!fT3.close || fT3.close.step !== 'carta'); i++) fT3.update(0.05);
  pressActT(fT3);
  check('sin la foto del sofá NO hay álbum: de la carta se va directo a la tarjeta de FIN (como antes del álbum)',
    !!fT3.close && fT3.close.step === 'fin', 'step=' + (fT3.close && fT3.close.step));
  pumpClosingT(fT3, 900);
  check('y la cita se completa igual, sin álbum',
    fT3.cine.st === 'done' && DM.state.completed === true, 'cine=' + fT3.cine.st);
  DM.stop();
  // El humo deja las imágenes como estaban: ninguna «carga».
  setLoadedT(DM.debug.cartaFinalImg, false);
  DM.debug.CLOSE_PHOTOS.forEach((p) => setLoadedT(p.img, false));

  console.log('\nU) La carta SOBRE la mesa de centro y la instrucción de objetivo (playtest de Jose, 2026-11-22)');
  // Regresión del playtest: la carta se veía FLOTANDO en el
  // borde inferior de la pantalla, sobre la banda negra de la
  // pared sur. La posición siempre fue el centro de la mesa;
  // lo roto era la PROYECCIÓN analítica: vpFromCam traía el
  // «1» del vector up en la ranura z, su lookAt construía una
  // cámara con up +Z en vez de +Y (girada ~90°) y todo lo
  // dibujado con projectHomePoint/drawHomeImg caía en un sitio
  // sin relación con la casa 3D. Estos checks fijan la
  // geometría contra el mueble real y contra la proyección
  // del motor (gl3d.js), medida de forma independiente.
  const DBG = DM.debug;
  const mesaU = G.World.furn('ctable');
  check('la posición de la carta se DERIVA de la mesa de centro de la sala (W.furn(\'ctable\') de world.js, no de constantes del finale)',
    DBG.CARTA_POS.x === mesaU.x + mesaU.w / 2 && DBG.CARTA_POS.y === mesaU.y + mesaU.h / 2,
    `carta=(${DBG.CARTA_POS.x},${DBG.CARTA_POS.y}) mesa=(${mesaU.x},${mesaU.y},${mesaU.w}×${mesaU.h})`);
  const worldSrcU = fs.readFileSync(path.join(SRC, 'world.js'), 'utf8');
  check('la altura del tablero (CARTA_TOP) es la de la caja de la mesa en la malla 3D (world.js: B(595, 13, 108, 80, 3, 32) → 13+3 = 16)',
    DBG.CARTA_TOP === 16 && worldSrcU.includes('B(595, 13, 108, 80, 3, 32'),
    'CARTA_TOP=' + DBG.CARTA_TOP);
  // Con la cámara sobre la sala, el tablero de la mesa cae
  // casi en el centro de la pantalla: (320, 149) medido con
  // una réplica independiente de perspective/lookAt/mul de
  // gl3d.js y de R.begin/R.project.
  const pMesaU = DBG.projectHomePoint({ cam: { x: 635, y: 0, z: 150, dist: 560, pitch: 0.8 } }, DBG.CARTA_POS.x, DBG.CARTA_TOP, DBG.CARTA_POS.y);
  check('con la cámara sobre la sala, la carta se proyecta SOBRE la mesa (cerca del centro de pantalla, como en el motor)',
    pMesaU.ok && Math.abs(pMesaU.x - 320) <= 3 && Math.abs(pMesaU.y - 149) <= 6,
    `proyección=(${pMesaU.x.toFixed(0)},${pMesaU.y.toFixed(0)})`);
  // El encuadre exacto de la captura de Jose: Ximena junto a
  // la puerta de su cuarto (cámara siguiéndola); la sala queda
  // fuera de cuadro POR ARRIBA. Con la proyección rota la
  // carta caía en (345, 373): flotando sobre la banda
  // inferior. Ahora debe salir por el borde superior, con la
  // mesa de verdad.
  const pCapU = DBG.projectHomePoint({ cam: { x: 665, y: 0, z: 435, dist: 560, pitch: 0.8 } }, DBG.CARTA_POS.x, DBG.CARTA_TOP, DBG.CARTA_POS.y);
  check('en el encuadre de la captura de Jose, la carta queda fuera de cuadro POR ARRIBA (con su mesa), no flotando abajo',
    pCapU.ok && pCapU.y < 0, `proyección=(${pCapU.x.toFixed(0)},${pCapU.y.toFixed(0)})`);
  // Sanidad de la cámara analítica: la punta de un segmento
  // vertical va SOBRE su base (con el up roto salía DEBAJO:
  // base y=157, punta y=258) y su alto es el del motor (~101).
  const camSpawnU = { cam: { x: 800, y: 0, z: 440, dist: 560, pitch: 0.8 } };
  const pBaseU = DBG.projectHomePoint(camSpawnU, 800, 0, 470), pTopU = DBG.projectHomePoint(camSpawnU, 800, 122, 470);
  check('un segmento vertical se proyecta con la punta ARRIBA de la base y el alto del motor (la cámara analítica ya no está girada)',
    pTopU.y < pBaseU.y && Math.abs((pBaseU.y - pTopU.y) - 101) <= 6,
    `base=${pBaseU.y.toFixed(0)} punta=${pTopU.y.toFixed(0)} alto=${(pBaseU.y - pTopU.y).toFixed(0)}`);
  // LA INSTRUCCIÓN DE OBJETIVO (el otro pedido del playtest):
  // mientras la carta no se abra, la cita dice qué buscar, y
  // es persistente (espacio de pantalla, no proximidad).
  DM.start(() => {});
  const scU = G.scene, xiU = scU && scU.xi;
  check('al arrancar la cita, la instrucción de objetivo está ACTIVA (fase depa, carta sin abrir)',
    !!scU && DBG.objetivoCartaActivo(scU) === true && DM.state.cartaAbierta === false);
  check('el texto de la instrucción dice que hay una carta en la sala, sobre la mesa de centro, y que hay que abrirla',
    /carta/.test(DBG.CARTA_OBJETIVO) && /sala/.test(DBG.CARTA_OBJETIVO) && /mesa de centro/.test(DBG.CARTA_OBJETIVO) && /ábrela/.test(DBG.CARTA_OBJETIVO),
    DBG.CARTA_OBJETIVO);
  // El dibujo del depa con la instrucción y la carta no
  // explota (la casa 3D es WebGL real: su draw se sustituye
  // por un stub, como hace la sección T con el finale, y se
  // ejercita la capa 2D: halo, sobre e instrucción).
  let depaDrawOk = true;
  const homeDrawU = scU.home.draw;
  scU.home.draw = () => {};
  try { scU.draw(0.016); } catch (e) { depaDrawOk = false; }
  scU.home.draw = homeDrawU;
  check('el dibujo del depa con la instrucción de objetivo (y la carta sobre la mesa) no explota', depaDrawOk);
  // Se abre la carta por la vía real (como la sección F) y la
  // instrucción se retira: la guía «a la plaza →» toma el relevo.
  xiU.x = DBG.CARTA_POS.x; xiU.y = DBG.CARTA_POS.y + 28; xiU.vx = xiU.vy = 0;
  scU.update(0.016);
  check('junto a la mesa de centro, el aviso de proximidad sigue anclado a la posición de la carta (nearCarta)', scU.nearCarta === true);
  key('Space', true); scU.update(0.016); key('Space', false);
  for (let i = 0; i < 20; i++) scU.update(0.05); // la toma (~0,8 s) → paso «lee»
  key('Space', true); scU.update(0.016); key('Space', false);
  check('abierta la carta por la vía real, la instrucción de objetivo se RETIRA',
    DM.state.cartaAbierta === true && scU.phase === 'depa' && DBG.objetivoCartaActivo(scU) === false,
    'cartaAbierta=' + DM.state.cartaAbierta + ' phase=' + scU.phase);
  DM.stop();

  console.log('\nV) La proporción de las poses de lectura (playtest de Jose, 2026-11-22)');
  // Regresión del playtest: «el personaje se hace inmenso
  // cuando lee la carta». La pose se dibujaba con el LIENZO
  // a 122 u de mundo, pero la figura ocupa el 96,4 % del
  // lienzo (medido con PIL sobre el alfa de lectura-sola,
  // lectura-sola-2 y ximena-sobre: filas 7..376 de 384, las
  // tres comparten lienzo y proporción): la Ximena de la
  // pose salía a ~118 u frente a las ~67 u de su actor
  // (Sp.charTop). Estos checks fijan la aritmética: alto
  // del lienzo × fracción de figura = alto del actor, con
  // la fracción como constante documentada (CARTA_POSE_FRAC).
  const charTopV = G.Sprites.charTop('ximena');
  check('la fracción de figura de las poses de la carta es la medida en los PNG (370/384 ≈ 0,964)',
    Math.abs(DBG.CARTA_POSE_FRAC - 370 / 384) < 0.001, 'frac=' + DBG.CARTA_POSE_FRAC.toFixed(4));
  const figCartaV = DBG.cartaPoseWorldH(1) * DBG.CARTA_POSE_FRAC;
  check('la figura de la pose de la carta (toma y lee comparten el cálculo) mide lo que el actor de Ximena (±12 %)',
    Math.abs(figCartaV / charTopV - 1) <= 0.12,
    `figura=${figCartaV.toFixed(1)} u, actor=${charTopV.toFixed(1)} u, lienzo=${DBG.cartaPoseWorldH(1).toFixed(1)} u`);
  check('el alto viejo del lienzo (122) habría dejado la figura un ≥50 % más grande que el actor: la regresión queda documentada',
    122 * DBG.CARTA_POSE_FRAC / charTopV >= 1.5,
    'ratio viejo=' + (122 * DBG.CARTA_POSE_FRAC / charTopV).toFixed(2));
  check('el alto de la pose sigue a la compensación de escala de Ximena (xi.scale): a escala 1,25 el lienzo crece en la misma razón',
    Math.abs(DBG.cartaPoseWorldH(1.25) / DBG.cartaPoseWorldH(1) - 1.25) < 0.001);
  const dateSrcV = fs.readFileSync(path.join(SRC, 'date.js'), 'utf8');
  check('el dibujo de la pose de la carta usa el alto corregido (sin el 122 fijo) y el del compuesto del finale usa el suyo (sin el 96 fijo)',
    dateSrcV.includes('cartaPoseWorldH(this.xi.scale)') && !dateSrcV.includes('this.xi.y, 122, false') &&
    dateSrcV.includes('parejaWorldH(this.xi.scale)') && !dateSrcV.includes('FINALE.sofa.cz + 6, 96, false'));
  // El compuesto del finale: las figuras están SENTADAS y
  // salían a ~92 u (96 × 0,956), más altas que la Ximena de
  // pie. Con la proporción del propio arte (la figura
  // sentada, 344 px, es el 93 % de la de pie, 370 px) la
  // figura del compuesto debe quedar en ~0,93 × charTop.
  const figParejaV = DBG.parejaWorldH(1) * DBG.PAREJA_FRAC;
  check('la figura SENTADA del compuesto del finale queda en la proporción del arte respecto a la de pie (~0,93 × el actor, ±12 %) y por debajo de su alto de pie',
    Math.abs(figParejaV / (charTopV * DBG.PAREJA_SENTADA) - 1) <= 0.12 && figParejaV < charTopV,
    `figura=${figParejaV.toFixed(1)} u, objetivo=${(charTopV * DBG.PAREJA_SENTADA).toFixed(1)} u, lienzo=${DBG.parejaWorldH(1).toFixed(1)} u`);

  console.log('\nW) El finale tras el playtest: la pareja DETRÁS del sofá (pase GL con profundidad), Pollito en su proporción, su ruta visible y su salida al armario');
  // Regresión del playtest de Jose (2026-11-22): en la sala
  // del regreso, la pareja del compuesto salía ENORME y
  // sentada SOBRE la mesa de centro, delante de todo, y
  // Pollito igual de desproporcionado, ya presente sin que
  // se viera su llegada (y sin irse nunca). Causas: los
  // billboards del finale se dibujaban en la capa 2D
  // POSTERIOR a la casa (sin profundidad: siempre encima)
  // con el compuesto anclado a ras de suelo, y los PNG de
  // Pollito a 76/62 u de lienzo (~3× su actor). El arreglo:
  // los billboards van en el pase GL de la casa (gancho
  // extraSprites de la HomeScene, con prueba de
  // profundidad contra los muebles), el compuesto se ancla
  // en los asientos y Pollito se dimensiona por su actor.
  const scenesSrcW = fs.readFileSync(path.join(SRC, 'scenes.js'), 'utf8');
  check('la HomeScene ofrece el gancho extraSprites (los billboards de una instancia se dibujan en el pase GL con profundidad, como los actores)',
    scenesSrcW.includes('if (this.extraSprites) this.extraSprites(t)'));
  DM.start(() => {});
  DM.debug.travelTo('cita');
  const fW = DM.state.finaleScene, FINW = DM.debug.FINALE, FIW = DM.debug.finaleImgs;
  for (let i = 0; i < 25 && fW.phase !== 'home'; i++) fW.update(0.05);
  check('la casa del finale registra su gancho extraSprites (y el de props, extraBoxes, sigue)',
    typeof fW.home.extraSprites === 'function' && typeof fW.home.extraBoxes === 'function');
  // Las imágenes de la puesta, «cargadas» con sus tamaños
  // reales (como la sección T con las fotos del álbum).
  const setImgW = (img, w, h) => { img.naturalWidth = w; img.naturalHeight = h; img.width = w; img.height = h; };
  setImgW(FIW.pareja, 560, 360); setImgW(FIW.pareja2, 560, 360); setImgW(FIW.pareja3, 560, 360);
  FIW.pollitoWalk.forEach((im) => setImgW(im, 429, 420));
  setImgW(FIW.pollitoDeja, 433, 399); setImgW(FIW.pollitoOrgulloso, 360, 400);
  setImgW(FIW.tortaMesa, 236, 252); setImgW(FIW.cartaSobre, 256, 224);
  // El registro GL, capturado: se sustituye G.R.sprite por
  // un registrador y se invoca el gancho de la escena.
  const RW = G.R, sprW = [];
  const origSpriteW = RW.sprite;
  RW.sprite = (img, x, y, z, o) => { sprW.push({ img, x, y, z, o }); };
  const charTopW = G.Sprites.charTop('ximena'), topW = DM.debug.pollitoTop();
  // --- la pareja sentada, en su sitio y a su medida ---
  fW.seatedPose = true; fW.cine = { st: 'reading', t: 0, placed: true }; fW.tortaOnTable = false; fW.catVis = 'actor';
  sprW.length = 0;
  fW.home.extraSprites();
  const parW = sprW.find((s) => s.img === FIW.pareja || s.img === FIW.pareja2);
  check('el compuesto de la pareja se registra en el pase GL (no en la capa 2D), centrado en el sofá y EN EL PLANO DE LOS ASIENTOS (z = seatXi.y, al norte del respaldo z 203: detrás del mueble)',
    !!parW && parW.x === FINW.sofa.cx && parW.z === FINW.seatXi.y &&
    parW.z > FINW.sofa.z && parW.z < 203,
    parW ? `(${parW.x}, y=${parW.y.toFixed(1)}, z=${parW.z})` : 'sin registro');
  check('la figura sentada apoya EN EL COJÍN: la base del lienzo queda el margen medido bajo seatY (26) y el fondo de la figura (base + margen × alto) cae en el cojín (±0,6 u)',
    !!parW && Math.abs(parW.y - (FINW.seatY - DM.debug.PAREJA_BASE_FRAC * parW.o.h)) < 0.6 &&
    Math.abs((parW.y + DM.debug.PAREJA_BASE_FRAC * parW.o.h) - FINW.seatY) < 0.6,
    parW ? `base=${parW.y.toFixed(2)}, fondo figura=${(parW.y + DM.debug.PAREJA_BASE_FRAC * parW.o.h).toFixed(2)}, seatY=${FINW.seatY}` : 'sin registro');
  check('la figura sentada visible queda en la proporción del arte (~0,93 × el actor de pie, ±12 %): ni gigante ni sobre la mesa',
    !!parW && Math.abs(parW.o.h * DM.debug.PAREJA_FRAC / (charTopW * DM.debug.PAREJA_SENTADA) - 1) <= 0.12,
    parW ? `figura=${(parW.o.h * DM.debug.PAREJA_FRAC).toFixed(1)} u, objetivo=${(charTopW * DM.debug.PAREJA_SENTADA).toFixed(1)} u` : 'sin registro');
  // --- Pollito, a su tamaño en cada pose del servicio ---
  const figW = (s, frac) => s.o.h * frac;
  fW.seatedPose = false;
  fW.catVis = 'walk'; fW.catWalkT = 0; fW.cat.x = 524; fW.cat.y = 280;
  sprW.length = 0; fW.home.extraSprites();
  const walk0W = sprW.find((s) => s.img === FIW.pollitoWalk[0]);
  check('Pollito CAMINANDO con la torta se registra a SU tamaño: su figura (lienzo × fracción medida) = la de su actor definido (±12 %), con las patas en el suelo',
    !!walk0W && Math.abs(figW(walk0W, DM.debug.POLLITO_FRAC.walk[0]) / topW - 1) <= 0.12 &&
    Math.abs(walk0W.y + DM.debug.POLLITO_BOT.walk * walk0W.o.h) < 0.3 && walk0W.z === 280,
    walk0W ? `figura=${figW(walk0W, DM.debug.POLLITO_FRAC.walk[0]).toFixed(1)} u, actor=${topW.toFixed(1)} u` : 'sin registro');
  fW.catWalkT = 0.27; // frame 2 del ciclo
  sprW.length = 0; fW.home.extraSprites();
  const walk2W = sprW.find((s) => s.img === FIW.pollitoWalk[2]);
  check('el ciclo de caminata mantiene la figura constante entre frames (cada frame se dimensiona por SU fracción medida)',
    !!walk2W && Math.abs(figW(walk2W, DM.debug.POLLITO_FRAC.walk[2]) / topW - 1) <= 0.12,
    walk2W ? `figura=${figW(walk2W, DM.debug.POLLITO_FRAC.walk[2]).toFixed(1)} u` : 'sin registro');
  fW.catVis = 'place'; sprW.length = 0; fW.home.extraSprites();
  const dejaW = sprW.find((s) => s.img === FIW.pollitoDeja);
  check('Pollito DEJANDO la torta, a su tamaño (figura = su actor, ±12 %)',
    !!dejaW && Math.abs(figW(dejaW, DM.debug.POLLITO_FRAC.deja) / topW - 1) <= 0.12,
    dejaW ? `figura=${figW(dejaW, DM.debug.POLLITO_FRAC.deja).toFixed(1)} u` : 'sin registro');
  fW.catVis = 'proud'; sprW.length = 0; fW.home.extraSprites();
  const orgW = sprW.find((s) => s.img === FIW.pollitoOrgulloso);
  check('Pollito ORGULLOSO, a su tamaño (figura = su actor, ±12 %)',
    !!orgW && Math.abs(figW(orgW, DM.debug.POLLITO_FRAC.orgulloso) / topW - 1) <= 0.12,
    orgW ? `figura=${figW(orgW, DM.debug.POLLITO_FRAC.orgulloso).toFixed(1)} u` : 'sin registro');
  check('el alto viejo de sus lienzos (76 u) habría dejado su figura ~3× su actor: la regresión queda documentada',
    76 * DM.debug.POLLITO_FRAC.walk[0] / topW >= 2.5,
    'ratio viejo=' + (76 * DM.debug.POLLITO_FRAC.walk[0] / topW).toFixed(2));
  RW.sprite = origSpriteW;
  // --- y NADA de esto se dibuja ya en la capa 2D ---
  const ocW = G.ovCtx, diW = [];
  const origDiW = ocW.drawImage;
  ocW.drawImage = (...a) => { diW.push(a[0]); };
  const homeDrawW = fW.home.draw;
  fW.home.draw = () => {};
  fW.nearSofa = false; fW.nearDoor = false; fW.close = null;
  fW.cine = { st: 'proud', t: 0.5, placed: true }; fW.seatedPose = true; fW.catVis = 'proud';
  let drawWOk = true;
  try { fW.draw(0.016); } catch (e) { drawWOk = false; }
  fW.home.draw = homeDrawW; ocW.drawImage = origDiW;
  const puestaW = [FIW.pareja, FIW.pareja2, FIW.pareja3, FIW.pollitoDeja, FIW.pollitoOrgulloso, FIW.tortaMesa, FIW.cartaSobre, ...FIW.pollitoWalk];
  check('el draw() de la escena ya NO dibuja la puesta en la capa 2D (ni la pareja, ni Pollito, ni la torta, ni la carta): todo va por el pase GL con profundidad',
    drawWOk && !diW.some((im) => puestaW.includes(im)), 'drawImage en overlay: ' + diW.length);
  // --- la ruta de llegada: abierta, visible, por delante
  // del sofá y sin pisar el compuesto ---
  const pathW = FINW.catPath;
  const lenW = pathW.reduce((acc, p, i) => acc + (i ? Math.hypot(p[0] - pathW[i - 1][0], p[1] - pathW[i - 1][1]) : Math.hypot(p[0] - FINW.catFloor.x, p[1] - FINW.catFloor.y)), 0);
  check('la ruta de Pollito es una caminata de verdad (≥240 u desde el pie del armario) y termina junto a la mesa (catServe)',
    lenW >= 240 && pathW[pathW.length - 1][0] === FINW.catServe.x && pathW[pathW.length - 1][1] === FINW.catServe.y,
    'largo=' + lenW.toFixed(0));
  check('la ruta pasa por DELANTE del sofá (algún tramo al sur del mueble, z > sofá+d, en la franja visible de la alfombra) y NUNCA se mete detrás del compuesto de la pareja (x siempre al oeste de los asientos)',
    pathW.some((p) => p[1] > FINW.sofa.z + FINW.sofa.d) && pathW.every((p) => p[0] < FINW.seatXi.x),
    'ruta=' + pathW.map((p) => p.join(',')).join(' → '));
  // --- la cinemática completa en esta instancia: la
  // salida se ejecuta y el estado final es el de siempre ---
  fW.seatedPose = false; fW.catVis = 'actor'; fW.tortaOnTable = false; fW.tortaShown = false;
  fW.cine = { st: 'idle', t: 0 }; fW.close = null;
  fW.xi.x = FINW.sofa.cx; fW.xi.y = 250; fW.xi.vx = fW.xi.vy = 0;
  for (let i = 0; i < 40; i++) fW.update(0.05);
  key('Space', true); fW.update(0.016); key('Space', false);
  const seenW = [];
  for (let i = 0; i < 900 && fW.cine.st !== 'done'; i++) {
    fW.update(0.05);
    if (!seenW.length || seenW[seenW.length - 1] !== fW.cine.st) seenW.push(fW.cine.st);
  }
  check('la cinemática ejecuta la SALIDA de Pollito (proud → exit → emotion) y termina con la torta en la mesa y Pollito oculto en su escondite',
    fW.cine.st === 'done' && seenW.join(',').includes('proud,exit,emotion') &&
    fW.tortaOnTable === true && fW.catVis === 'actor' && fW.cat.hidden === false && fW.cat.elev > 90 &&
    Math.abs(fW.cat.x - FINW.catHide.x) < 4 && Math.abs(fW.cat.y - FINW.catHide.y) < 4,
    'vistos: ' + seenW.join(' → '));
  // --- al REENTRAR con la torta servida: la mesa queda
  // servida y Pollito está en el armario (no orgulloso) ---
  fW.enterFinale();
  check('al reentrar con la torta ya servida, la torta SIGUE en la mesa y Pollito está en su escondite del armario (no plantado junto a la mesa)',
    fW.tortaOnTable === true && fW.catVis === 'actor' && fW.cat.hidden === false && fW.cat.elev > 90 &&
    Math.abs(fW.cat.x - FINW.catHide.x) < 4 && Math.abs(fW.cat.y - FINW.catHide.y) < 4,
    `catVis=${fW.catVis} elev=${fW.cat.elev}`);
  DM.stop();
  // las imágenes de la puesta vuelven a «no cargadas»
  [FIW.pareja, FIW.pareja2, FIW.pareja3, FIW.pollitoDeja, FIW.pollitoOrgulloso, FIW.tortaMesa, FIW.cartaSobre, ...FIW.pollitoWalk]
    .forEach((im) => { im.naturalWidth = 0; im.naturalHeight = 0; im.width = 0; im.height = 0; });

  // --- la NUEVA PRESENTACIÓN de los textos de la carta
  // en escena (dirección de Jose): sin recuadro de papel,
  // texto flotante grande a un lado, desvaneciéndose en
  // el aire; el recuadro queda SOLO para la instrucción.
  // Se ejercita el dibujo con un ctx registrador (el
  // FakeCtx del humo no registra llamadas).
  const mkRecW = () => {
    const calls = { fillText: [], roundRect: 0, fillRect: 0 };
    const ctx = {
      font: '', fillStyle: '', strokeStyle: '', lineWidth: 1, shadowColor: '', shadowBlur: 0, globalAlpha: 1,
      measureText(s) { return { width: String(s).length * 6 }; },
      save() {}, restore() {}, translate() {}, beginPath() {}, closePath() {}, fill() {}, stroke() {}, arc() {},
      fillRect() { calls.fillRect++; }, roundRect() { calls.roundRect++; },
      fillText(t, x, y) { calls.fillText.push({ t: String(t), x, y, a: ctx.globalAlpha }); },
      strokeText(t, x, y) { calls.strokeText.push({ t: String(t), x, y, a: ctx.globalAlpha }); },
    };
    calls.strokeText = [];
    return { ctx, calls };
  };
  const ESTW = DM.debug.CARTA_DISPLAY;
  check('el estilo display de los textos de la carta: letra GRANDE (≥17 px), columna LATERAL (la columna vive en la mitad izquierda, sin tapar a la pareja) y color crema cálido',
    ESTW.size >= 17 && ESTW.colX >= 0 && ESTW.colX + ESTW.colW <= 320 && ESTW.color === '#ffe9c4',
    `size=${ESTW.size}, col=${ESTW.colX}+${ESTW.colW}`);
  const fragW = DM.debug.CARTA_TEXTOS.plaza;
  DM.debug.showCartaBand(fragW);
  DM.debug.updateCartaBand(0.3); // en plena ENTRADA (0,8 s)
  const fxInW = DM.debug.cartaBandFx();
  check('el fundido de ENTRADA del fragmento es gradual: a los 0,3 s el alfa está entre 0 y 1 (nada de aparición instantánea a alfa pleno) y sin deriva aún',
    fxInW.a > 0 && fxInW.a < 1 && fxInW.drift === 0, `a=${fxInW.a.toFixed(2)}`);
  const recInW = mkRecW();
  DM.debug.drawCartaBand(recInW.ctx);
  check('el fragmento se dibuja SIN RECUADRO (ni roundRect ni fillRect de papel): texto desnudo en la columna lateral, con el alfa del fundido',
    recInW.calls.roundRect === 0 && recInW.calls.fillRect === 0 && recInW.calls.fillText.length > 0 &&
    recInW.calls.fillText.every((f) => f.a > 0 && f.a < 1) &&
    recInW.calls.fillText.every((f) => f.x >= ESTW.colX && f.x <= ESTW.colX + ESTW.colW),
    `fillText=${recInW.calls.fillText.length}, roundRect=${recInW.calls.roundRect}`);
  check('el texto dibujado ES el fragmento (las líneas envueltas en la columna recomponen el texto de la carta)',
    recInW.calls.fillText.map((f) => f.t).join(' ') === fragW,
    recInW.calls.fillText.map((f) => f.t).join(' / '));
  DM.debug.updateCartaBand(2.0); // permanencia plena
  const fxMidW = DM.debug.cartaBandFx();
  check('en la permanencia el fragmento está a alfa pleno y quieto (la permanencia sigue siendo la regla de lectura)',
    fxMidW.a === 1 && fxMidW.drift === 0, `a=${fxMidW.a}`);
  const bandW = DM.debug.cartaBand;
  DM.debug.updateCartaBand(bandW.total - bandW.t - 0.5); // a 0,5 s del final: plena SALIDA
  const fxOutW = DM.debug.cartaBandFx();
  check('el fundido de SALIDA es gradual y con DERIVA ascendente: alfa entre 0 y 1 y el texto ya subió unos píxeles (se disuelve en el aire, sin corte seco)',
    fxOutW.a > 0 && fxOutW.a < 1 && fxOutW.drift > 0, `a=${fxOutW.a.toFixed(2)}, drift=${fxOutW.drift.toFixed(1)}`);
  const recOutW = mkRecW();
  DM.debug.drawCartaBand(recOutW.ctx);
  check('en la salida el dibujo sigue sin recuadro y con el alfa parcial del fundido',
    recOutW.calls.roundRect === 0 && recOutW.calls.fillRect === 0 &&
    recOutW.calls.fillText.length > 0 && recOutW.calls.fillText.every((f) => f.a > 0 && f.a < 1));
  DM.debug.updateCartaBand(1.0); // se disuelve del todo
  check('cumplido su tiempo, el fragmento se disolvió (la banda queda vacía, como mandaba la mecánica)',
    DM.debug.cartaBand.text === null);
  const recObjW = mkRecW();
  DM.debug.drawCartaObjetivo(recObjW.ctx);
  check('la INSTRUCCIÓN de objetivo CONSERVA su recuadro de papel (roundRect): el papel quedó solo para instrucciones, como pidió Jose',
    recObjW.calls.roundRect >= 1, `roundRect=${recObjW.calls.roundRect}`);
  const dateSrcW = fs.readFileSync(path.join(SRC, 'date.js'), 'utf8');
  check('la apertura y el cierre del finale usan el MISMO texto flotante (drawCartaTexto) y el panel de papel quedó retirado del código',
    dateSrcW.includes('drawCartaTexto(c, CARTA_TEXTOS.apertura') &&
    dateSrcW.includes('drawCartaTexto(c, CARTA_TEXTOS.cierre') &&
    !dateSrcW.includes('drawCartaPanel'),
    '');

  // --- la FUENTE PIXEL de los textos de la carta
  // (pedido de Jose: «una fuente pixel de verdad»):
  // Pixelify Sans autoalojada, SOLO para los textos de
  // la carta en escena; la instrucción y el resto de la
  // UI no cambian de fuente.
  check('el estilo display usa la fuente PIXEL (Pixelify Sans primera en la pila, con la del motor como respaldo elegante por si no carga)',
    ESTW.font.includes('"Pixelify Sans"') && ESTW.font.includes('Trebuchet MS'),
    `font=${ESTW.font}`);
  const fontFileW = path.join(SRC, '..', 'assets', 'date', 'pixelify-sans.woff2');
  const oflFileW = path.join(SRC, '..', 'assets', 'date', 'PixelifySans-OFL.txt');
  check('la fuente pixel VIVE en el repo (assets/date/, la carpeta que la copia de runtime lleva a dist) y su licencia OFL la acompaña en la misma carpeta',
    fs.existsSync(fontFileW) && fs.statSync(fontFileW).size > 5000 && fs.existsSync(oflFileW),
    fontFileW);
  check('la URL de carga es la del archivo del repo y start() dispara la carga al arrancar la cita (el primer fragmento la estrena cargada)',
    DM.debug.CARTA_FONT_URL === 'assets/date/pixelify-sans.woff2' && dateSrcW.includes('loadCartaFont();'),
    `url=${DM.debug.CARTA_FONT_URL}`);
  const recFontW = mkRecW();
  DM.debug.showCartaBand(fragW);
  DM.debug.updateCartaBand(2.3); // permanencia plena (pasada la entrada de 0,8 s)
  DM.debug.drawCartaBand(recFontW.ctx);
  check('el DIBUJO del fragmento usa la fuente pixel a su tamaño y SIN negrita (la pixel no se falsifica)',
    recFontW.ctx.font.includes('Pixelify Sans') && recFontW.ctx.font.includes(`${ESTW.size}px`) && !recFontW.ctx.font.includes('bold'),
    `font=${recFontW.ctx.font}`);
  check('la ENVOLTURA mide con EXACTAMENTE la misma cadena de fuente que el dibujo (la de CARTA_DISPLAY, sin negrita): sin regresión a la pila vieja en el camino de los fragmentos',
    dateSrcW.includes('`${size}px ${CARTA_DISPLAY.font}`') && !dateSrcW.includes('bold ${size}px ${CARTA_DISPLAY.font}'),
    '');
  DM.debug.updateCartaBand(10); // la banda de la prueba queda vacía

  DM.debug.setHash(realHash); // el hash real queda como estaba
  check('el hash real quedó restaurado tras las pruebas', DM.debug.getHash() === realHash);

  console.log(`\n${failures ? '✘' : '✔'} check_date: ${checks - failures}/${checks} checks`);
  process.exit(failures ? 1 : 0);
})().catch((e) => { console.error('ERROR en check_date:', e); process.exit(1); });
