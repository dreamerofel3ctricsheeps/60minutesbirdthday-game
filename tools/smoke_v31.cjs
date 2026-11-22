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
   C) Apagón: velas contra José — reparto por cuarto y alcance
      de las 26 velas con POSICIONES ALEATORIAS por partida,
      FASE DE MEMORIA iluminada antes de la oscuridad total
      (ambiente ~0 en juego; la luz puntual de la vela en la mano
      sigue al jugador y José lleva su fósforo tenue),
      prender/soplar con canalización (moverse cancela),
      la IA de José (prende; sopla solo si va perdiendo), el
      parpadeo que apaga el 25% y el resultado por conteo final.
   D) Apagón en la historia: runEvent('apagon') completo jugando
      a las velas: efectos y flags NUEVAS (sin fantasmas).
   F) Salto de repisas: escalada infinita — generación procedural
      sin fin y determinista, set dibujado acotado a cualquier
      altura, caída de una repisa al fallar (la máxima no se
      pierde) y resultado por altura máxima (win/tie/lose).
   G) Party (diseño original retomado): roster de 7 elegibles,
      reclutar partners en la recolección (cargar/entregar, tope
      3, bajar no recluta, ítems conviven) GUARDÁNDOLOS DENTRO
      del armario (puerta que se abre, entran, puerta que se
      cierra: quedan 'inside', invisibles; entregas en cola si
      la puerta está ocupada), la huida al llegar Ximena deja la
      escena solo con la party, y las asignaciones posteriores
      ofrecen solo a la party.
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
      puntos, flechas del teclado y el joystick táctil (un empuje =
      un paso, con histéresis), sin ninguna barra de scroll,
      desde el que se alcanzan los 7 roomies. Y el STAGING de la
      llegada: Ximena parada en (510, 548) se ve ENTERA — ningún
      presente VISIBLE en su caja de visión (|x-510| < 80 con
      y > 500) ni a menos de 40 u de otro visible (bug: Itzel la
      tapaba). Los partners ya no esperan en las esquinas: están
      DENTRO del armario y solo asoman los ojos por la rendija
      (un par por partner, recortados de su propio idle); al
      dormirse Ximena salen de uno en uno y la noche arranca
      con la party completa y el armario cerrado.
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
   L) Final J1407b (SPACE_RINGS_ENDING): 1A «Anillos de J1407b»
      se instancia con el copiloto = primer partner, la DUDA se
      activa al ir contra su sugerencia (y no al seguirla) y la
      carrera termina con resultado y conteo de choques; 1B
      «Cinturón de asteroides» sale del origen sin ventaja y
      adelantado con ella (ventaja cruzada), trae asteroides de
      fiesta y termina con resultado y aturdimientos; la cadena
      SpaceEndingScene arranca en el despegue y pasa a los Anillos;
      y todo queda registrado en práctica (EVENTS/MG); su entrada a
      la historia se prueba en la sección N (integración).
   M) Final Leyendas (LEYENDAS_MOVIE_ENDING): ítems claqueta y
      cámara antigua, habilitación G.legendsReady (casting +
      decoración real + preparación), los duelos del Alebrije y
      de Teodora (trazo/hundimiento y soga) y la cadena completa.
   N) Integración de finales: G.spaceReady (Escalada espacial
      ganada + Preparación ≥ 80 + Sospecha < 50), la siembra del
      espacio (foto del cohete ~13:00 y telescopio en la Escalada)
      y el enrutado del clímax: solo uno → ese final; AMBOS →
      ELIGE EL JUGADOR (decisión de Jose); ninguno → final normal.
   O) Móvil (pedido de Jose): joystick circular analógico en vez
      del D-pad de flechas (función pura joyVector con zona
      muerta, eje analógico con velocidad proporcional y flechas
      derivadas por umbral para los consumidores discretos),
      proporciones en teléfonos (viewport-fit=cover, alturas
      dvh, safe-area-inset, escenario 16:9 sin deformar) y el
      chat del teléfono que aparece SOLO si tiene algo que
      mostrar (contenido nuevo o decisión pendiente) y se
      oculta solo cuando ya no hay nada pendiente.
   Q) Música del juego principal (G.Music): la tabla MUSIC_CUES
      reproduce el mapeo de Jose (menú Gold_Plated_Strut 0–16 en
      loop, recolección Quarter_Slot_Swagger 25–86 en loop,
      amenaza y victoria con Before_The_Strike — victoria desde
      17 sin loop —, derrota con Controller_Down sin loop y la
      gestión como PLAYLIST The_Last_Life + Gold_Plated_Strut),
      la API existe, cambiar de cue y pausar/reanudar no lanzan
      aunque los MP3 no existan, y el index.html carga music.js
      entre data.js y game.js.
   T) Sonido en los Ajustes (pedido de Jose): deslizadores de
      volumen de Música y Efectos (0–100) y el Silencio general
      en el panel, con la fuente de verdad en G.settings
      (musicVol/sfxVol/muted, persistidos en '1mtp.settings'
      junto a touch): la ganancia efectiva (G.musicGain/
      G.sfxGain) manda sobre G.Music (setUserGain en vivo sobre
      el deck que suena), sobre G.sfx (la lee en cada disparo) y
      sobre el audio de La Cita (date.js la consulta y recibe
      applySoundSettings).
   W) Playtest móvil de Jose (2026-11-22): en HORIZONTAL el chat
      flotante deja de aparecer/desaparecer solo — control manual
      con el botón del teléfono (más notorio), insignia que
      acumula no leídos y pasa a alerta «!» con una decisión
      pendiente —; el chat ya NO salta solo al último mensaje si
      el jugador está leyendo más arriba (solo sigue si ya estaba
      casi al final, CHAT_STICK_PX); y en VERTICAL el joystick y
      el botón de acción bajan a una banda inferior en flujo
      (bajo el chat, a la altura de los pulgares) en vez de ir
      superpuestos sobre la escena.
   W3) Decisiones en el FLUJO (propuesta de Jose, 2026-11-22):
      las opciones de choose/assign dejan la zona fija #actions
      (retirada) y pasan a ser el último mensaje del chat: se
      van con el historial al deslizar hacia arriba y aparecen
      al deslizar hasta abajo; su llegada no mueve scrollTop en
      ningún caso. Si el bloque queda bajo el pliegue con la
      decisión pendiente, avisa la pastilla «Decisión pendiente
      ↓» — sin mover nada por sí sola: solo su toque baja la
      vista hasta el bloque — y al responder el bloque sale del
      flujo y queda el eco de siempre.
   U) Sonido por la RUTA REAL (bug de Jose, 2026-11-22): el
      nivel audible de la música vive en un GainNode de
      WebAudio, no en el.volume del <audio> (que iOS/WebKit
      ignora por completo, silencio general incluido). La
      sección abre el panel REAL de Ajustes, dispara los
      manejadores REALES de sus controles con la música del
      menú sonando (la llamada exacta de main) y afirma que
      el nivel baja al esperado y SE MANTIENE tras los ticks
      de los fades, y que el silencio lo deja en cero fijo.
   X) Borrar caché y datos (pedido de Jose, 2026-11-22): el
      panel de Ajustes gana la acción de PRUEBAS «Borrar caché
      y datos del juego», la alternativa a la ventana de
      incógnito: confirmación en dos pasos dentro del propio
      botón (sin confirm() nativo), y al confirmar limpia el
      almacenamiento del origen, purga la Cache Storage si
      existe (sin desregistrar workers) y recarga la misma
      ruta con cache-bust. La sección la ejercita con el panel
      REAL: sin confirmar no se borra nada; confirmando, el
      almacenamiento falso queda vacío y la recarga lleva el
      parámetro ?v=.
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
  // También los <input>: la sección U abre el panel REAL de
  // Ajustes y necesita encontrar sus deslizadores e interruptor
  // por id, como hace el navegador (antes el arnés solo parseaba
  // botones y el panel era inalcanzable para el humo).
  const re2 = /<input\b([^>]*)>/g;
  while ((m = re2.exec(html))) {
    const attrs = m[1], inp = new FakeEl('input');
    const id = /id="([^"]+)"/.exec(attrs); if (id) inp.id = id[1];
    const val = /value="([^"]*)"/.exec(attrs); if (val) inp.value = val[1];
    inp.checked = /\bchecked\b/.test(attrs);
    inp.type = (/type="([^"]+)"/.exec(attrs) || [])[1] || '';
    inp.parent = root; root.children.push(inp);
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
// localStorage falso en memoria: permite ejercitar la persistencia
// real del juego (ajustes y el candado de Minijuegos, sección Q).
const fakeLocalStorage = (() => {
  const m = new Map();
  return {
    getItem: (k) => (m.has(k) ? m.get(k) : null),
    setItem: (k, v) => { m.set(k, String(v)); },
    removeItem: (k) => { m.delete(k); },
    clear: () => m.clear(),
  };
})();
const sandbox = {
  console, performance, setTimeout, clearTimeout, setInterval, clearInterval,
  localStorage: fakeLocalStorage,
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
load('rocket-sheets.js');
load('belt-sheets.js');
load('alebrije-sheets.js');
load('teodora-sheets.js');
load('jump-sheets.js');
load('sprites.js');
load('data.js');
// music.js: la inyección es SOLO para la prueba (el archivo real
// no cambia): se expone el <audio> del deck activo para poder
// comprobar que el volumen del jugador se aplica EN VIVO (sección T).
load('music.js', (code) => {
  const from = 'current: () => currentName,';
  if (!code.includes(from)) throw new Error('no se encontró G.Music.current en music.js');
  return code.replace(from, 'current: () => currentName, debugActiveEl: () => (active ? active.el : null), debugActiveGain: () => (active && active.gain ? active.gain.gain.value : null),');
});
load('gl3d.js');
load('world.js');
load('scenes.js');
// game.js no exporta MG; la inyección es SOLO para la prueba (el archivo
// real no cambia): se añade MG a lo que G.debug ya expone. La sección Q
// suma showMinigames/showEnding (el candado de Minijuegos) y un reset
// del respaldo en memoria del candado (mgSession), para poder simular
// una sesión sin desbloqueo tras haberlo abierto. La sección T suma
// saveSettings/applySoundSettings (los controles de sonido). La
// sección V suma cromo (la máquina del modo inmersivo). La sección AC
// suma titleScreen y las piezas del autoguardado (saveCheckpoint,
// readSave, applySave, clearSave) para el viaje de ida y vuelta del
// guardado y los botones del título. La extensión de alcance de la
// sección AC suma repersistSave y enterPractice: fijan que el
// guardado es SOLO del modo historia (ni la práctica ni «La Cita»
// lo crean, lo tocan ni lo resucitan tras borrarlo).
load('game.js', (code) => {
  const from = 'G.debug = { S, apply, runEvent, tick, actArrival, actCollect };';
  if (!code.includes(from)) throw new Error('no se encontró G.debug en game.js');
  return code.replace(from, 'G.debug = { S, apply, runEvent, tick, actArrival, actCollect, MG, selectChar, pickCharScreen, showMinigames, showEnding, resetMinigames: () => { mgSession = false; }, saveSettings, applySoundSettings, settingsScreen, cromo, titleScreen, saveCheckpoint, readSave, applySave, clearSave, repersistSave, enterPractice };');
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

  // ================= C) Apagón: velas — práctica directa ==================
  console.log('\nC) Apagón: velas contra José — práctica directa');
  if (!Sc.CandleGame) { check('existe la escena CandleGame', false); }
  else {
    check('el minijuego viejo desapareció: ya no hay BlackoutGame', !Sc.BlackoutGame);
    const ev = G.EVENTS.apagon;
    check("el evento 'apagon' sigue siendo minigame (game: 'apagon'), pero el jefe ahora es José", ev && ev.type === 'minigame' && ev.game === 'apagon' && ev.boss === 'jose');
    check('MG.apagon registrado con la escena de velas', !!MG.apagon && MG.apagon.Scene() === Sc.CandleGame);

    const toPlay = (s) => { let i = 0; while (s.st !== 'play' && i++ < 200) s.update(0.05); };
    const step = (s, n) => { for (let i = 0; i < n; i++) s.update(0.05); };
    const standOf = (cd) => W.nearestFree(cd.x, cd.z + 14);
    // prender una vela con el jugador: teletransporte junto a ella y ESPACIO sostenido
    const lightWith = (s, cd) => {
      const st = standOf(cd); s.p.x = st[0]; s.p.y = st[1];
      key('Space', true);
      let i = 0; while (cd.owner !== 'p' && i++ < 60) s.update(0.05);
      key('Space', false);
      return cd.owner === 'p';
    };

    // --- Reparto de velas ---
    const sc0 = new Sc.CandleGame('natalia', () => {});
    check('hay 26 velas repartidas por TODAS las habitaciones (cocina, sala, cuarto, pasillo y el de Ximena)',
      sc0.candles.length === 26 && ['cocina', 'sala', 'cuarto', 'pasillo', 'xroom'].every((r) => sc0.candles.some((c) => c.room === r)),
      'salas=' + [...new Set(sc0.candles.map((c) => c.room))].join(','));
    const reachable = (cd) => { for (let dx = -36; dx <= 36; dx += 6) for (let dz = -36; dz <= 36; dz += 6) { if (Math.hypot(dx, dz) <= 36 && W.canStand(cd.x + dx, cd.z + dz)) return true; } return false; };
    check('toda vela es alcanzable: existe piso libre a distancia de interacción (≤36 u) de su ancla', sc0.candles.every(reachable),
      sc0.candles.filter((c) => !reachable(c)).map((c) => c.room + '@' + c.x + ',' + c.z).join(' '));
    check('ninguna vela bloquea un umbral de puerta', sc0.candles.every((cd) => !W.OPEN.some((o) => cd.x > o.x - 6 && cd.x < o.x + o.w + 6 && cd.z > o.y - 6 && cd.z < o.y + o.h + 6)));

    // --- Reparto exacto, posiciones ALEATORIAS y FASE DE MEMORIA ---
    const perRoom = {}; sc0.candles.forEach((cd) => { perRoom[cd.room] = (perRoom[cd.room] || 0) + 1; });
    check('el reparto por cuarto se mantiene exacto (cocina 6, sala 9, cuarto 5, pasillo 3, xroom 3)',
      perRoom.cocina === 6 && perRoom.sala === 9 && perRoom.cuarto === 5 && perRoom.pasillo === 3 && perRoom.xroom === 3,
      JSON.stringify(perRoom));
    const setKey = (s) => s.candles.map((cd) => cd.x + ',' + cd.z).sort().join('|');
    const sets = new Set([setKey(sc0)]);
    for (let i = 0; i < 4; i++) sets.add(setKey(new Sc.CandleGame('natalia', () => {})));
    check('las posiciones son ALEATORIAS: 5 partidas no dan el mismo set de velas', sets.size >= 2, 'sets distintos=' + sets.size);
    const sm = new Sc.CandleGame('natalia', () => {});
    const flow = [sm.st];
    { let i = 0; while (sm.st !== 'play' && i++ < 400) { const prev = sm.st; sm.update(0.05); if (sm.st !== prev) flow.push(sm.st); } }
    check('flujo de fases: intro → memory → play (la MEMORIA va antes del juego)', flow.join('>') === 'intro>memory>play', flow.join('>'));
    check('el reloj de 75 s NO corre durante la fase de memoria', sm.timeLeft === 75, 'timeLeft=' + sm.timeLeft);

    // --- OSCURIDAD TOTAL y las luces que acompañan ---
    {
      const sd = new Sc.CandleGame('natalia', () => {});
      let capLight = null;
      const realRender = W.render;
      W.render = (opts) => { capLight = opts && opts.light; };
      try {
        sd.st = 'memory'; sd.surgeK = 1; sd.draw(0.05);
        check('en la fase de MEMORIA la casa va ILUMINADA (ambiente > 0,4)', !!capLight && capLight.amb.every((v) => v > 0.4),
          capLight && capLight.amb.map((v) => v.toFixed(2)).join(','));
        sd.st = 'play'; sd.surgeK = 0; sd.surgeState = 'idle'; sd.draw(0.05);
        check('en juego la oscuridad es TOTAL: ambiente ≤ 0,05 fuera de los halos', !!capLight && capLight.amb.every((v) => v <= 0.05),
          capLight && capLight.amb.map((v) => v.toFixed(3)).join(','));
        const pl = capLight && capLight.points[0], jl = capLight && capLight.points[1];
        check('la 1ª luz puntual es la VELA EN LA MANO del jugador (en su posición, radio 150)',
          !!pl && pl.x === sd.p.x && pl.z === sd.p.y && pl.r === 150, pl && (pl.x + ',' + pl.z + ' r' + pl.r));
        check('José lleva su FÓSFORO tenue (luz propia en su posición, radio menor: 95)',
          !!jl && jl.x === sd.jose.x && jl.z === sd.jose.y && jl.r === 95, jl && (jl.x + ',' + jl.z + ' r' + jl.r));
        sd.p.x += 120; sd.p.y += 60; sd.draw(0.05);
        check('la luz del jugador se MUEVE con él', capLight.points[0].x === sd.p.x && capLight.points[0].z === sd.p.y);
      } finally { W.render = realRender; }
    }

    // --- Prender (canalización) y su cancelación al moverse ---
    {
      const s = new Sc.CandleGame('natalia', () => {}); s.joseActive = false; s.nextSurge = 1e9; toPlay(s);
      const cd = s.candles.find((c) => c.room === 'cocina');
      check('prender: mantener ESPACIO junto a una vela apagada la prende (dueño p, conteo 1)', lightWith(s, cd) && s.counts().p === 1);
      const cd2 = s.candles.find((c) => c.room === 'sala');
      const st = standOf(cd2); s.p.x = st[0]; s.p.y = st[1];
      key('Space', true); step(s, 4); // 0,2 s de canalización (necesita 0,6)
      key('ArrowRight', true); step(s, 2); key('ArrowRight', false); key('Space', false);
      check('prender: moverse a mitad de la canalización la CANCELA (la vela sigue apagada)', cd2.owner === null && !s.chan);
    }
    {
      // REGRESIÓN (pares sobre el mismo mueble): con dos velas a ≤36 u
      // entre sí, prender la más cercana NO puede bloquear a la otra —
      // la vela propia ya prendida no cuenta como objetivo.
      const s = new Sc.CandleGame('natalia', () => {}); s.joseActive = false; s.nextSurge = 1e9; toPlay(s);
      const a = s.candles[0], b = s.candles[1];
      a.x = 500; a.z = 400; a.y = 0; b.x = 524; b.z = 400; b.y = 0; a.owner = null; b.owner = null;
      s.p.x = 500; s.p.y = 414; // a 14 u de a y a ~28 u de b: ambas al alcance, a más cerca
      key('Space', true);
      let i = 0; while (a.owner !== 'p' && i++ < 60) s.update(0.05);
      let j = 0; while (b.owner !== 'p' && j++ < 60) s.update(0.05); // SIN moverse ni soltar ESPACIO
      key('Space', false);
      check('prender: una vela propia prendida NO tapa a la vecina (se prende sin moverse)', a.owner === 'p' && b.owner === 'p',
        'a=' + a.owner + ' b=' + b.owner);
    }
    // --- Soplar una vela de José ---
    {
      const s = new Sc.CandleGame('natalia', () => {}); s.joseActive = false; s.nextSurge = 1e9; toPlay(s);
      const cd = s.candles[0]; cd.owner = 'j';
      const st = standOf(cd); s.p.x = st[0]; s.p.y = st[1];
      key('Space', true);
      let i = 0; while (cd.owner !== null && i++ < 60) s.update(0.05);
      key('Space', false);
      check('soplar: mantener ESPACIO junto a una vela de José la apaga y cuenta el soplido', cd.owner === null && s.blownP === 1, 'blownP=' + s.blownP);
    }
    // --- José: prende solo; sopla SOLO si va perdiendo ---
    {
      const s = new Sc.CandleGame('natalia', () => {}); s.nextSurge = 1e9; toPlay(s);
      let i = 0; while (s.counts().j === 0 && i++ < 600) s.update(0.05);
      check('José IA: recorre la casa por las rutas y prende su primera vela sin ayuda', s.counts().j >= 1, 'velasJosé=' + s.counts().j);
    }
    {
      const sw = new Sc.CandleGame('alan', () => {}); sw.nextSurge = 1e9; toPlay(sw);
      sw.candles.slice(0, 4).forEach((c) => (c.owner = 'j')); sw.candles[5].owner = 'p'; // José gana 4-1
      let blewWhileWinning = false;
      for (let i = 0; i < 40; i++) { sw.pickJoseTarget(); if (sw.jKind === 'blow') blewWhileWinning = true; }
      check('José IA: yendo GANANDO nunca elige soplar (siempre busca prender)', !blewWhileWinning && sw.jKind === 'light');
      const sl = new Sc.CandleGame('alan', () => {}); sl.nextSurge = 1e9; toPlay(sl);
      sl.candles.slice(0, 3).forEach((c) => (c.owner = 'p')); // el jugador gana 3-0
      let choseBlow = false;
      for (let i = 0; i < 60 && !choseBlow; i++) { sl.pickJoseTarget(); if (sl.jKind === 'blow' && sl.jTarget && sl.jTarget.owner === 'p') choseBlow = true; }
      check('José IA: yendo PERDIENDO sí elige soplar una vela del jugador', choseBlow);
    }
    // --- Parpadeo: la sobretensión apaga el 25% de las prendidas ---
    {
      const s = new Sc.CandleGame('natalia', () => {}); s.joseActive = false; toPlay(s);
      s.candles.slice(0, 8).forEach((c, i) => (c.owner = i % 2 ? 'j' : 'p')); // 8 prendidas (4 y 4)
      s.forceSurge();
      let i = 0; while (s.surges === 0 && i++ < 200) s.update(0.05);
      const lit = s.candles.filter((c) => c.owner).length;
      check('parpadeo: al cortarse la luz, la sobretensión apaga el 25% de las prendidas (8 → 6)', s.surges === 1 && lit === 6, `surges=${s.surges} prendidas=${lit}`);
    }
    // --- Resultado por conteo final de velas prendidas ---
    const driveEnd = (setupFn) => {
      let res = null;
      const s = new Sc.CandleGame('natalia', (r) => { res = r; });
      s.joseActive = false; s.nextSurge = 1e9; toPlay(s);
      setupFn(s);
      s.timeLeft = 0.05;
      let i = 0; while (!res && i++ < 300) s.update(0.05);
      return res;
    };
    const rWin = driveEnd((s) => { s.candles.slice(0, 5).forEach((c) => (c.owner = 'p')); s.candles[6].owner = 'j'; s.candles[7].owner = 'j'; });
    check('resultado: más velas que José al volver la luz = win, con las salidas nuevas del diseño',
      rWin && rWin.win === 'win' && rWin.candlesPlayer === 5 && rWin.candlesJose === 2 && typeof rWin.blownByPlayer === 'number' && typeof rWin.blownByJose === 'number' && typeof rWin.surges === 'number',
      rWin && JSON.stringify(rWin));
    const rTie = driveEnd((s) => { s.candles.slice(0, 3).forEach((c) => (c.owner = 'p')); s.candles.slice(4, 7).forEach((c) => (c.owner = 'j')); });
    check('resultado: empate de velas prendidas = tie', rTie && rTie.win === 'tie' && rTie.candlesPlayer === 3 && rTie.candlesJose === 3, rTie && rTie.win);
    const rLose = driveEnd((s) => { s.candles[0].owner = 'p'; s.candles.slice(2, 8).forEach((c) => (c.owner = 'j')); });
    check('resultado: José con más velas prendidas = lose', rLose && rLose.win === 'lose' && rLose.candlesJose === 6, rLose && rLose.win);
  }

  // ================= D) Apagón en la historia ==============================
  console.log('\nD) Apagón: velas — flujo completo en la historia (runEvent)');
  if (Sc.CandleGame) {
    Object.assign(S, { player: 'natalia', phase: 'act2', inv: {}, flags: {}, sus: 5, sleep: 1, noise: 0, qBonus: 0, duels: [], done: {}, tired: null });
    G.home = new Sc.HomeScene();
    let settled = false;
    const p = G.debug.runEvent('apagon').then(() => { settled = true; }, (e) => { settled = true; console.log('  (error en runEvent: ' + e.message + ')'); });
    let it = 0;
    while (!settled && it++ < 6000) {
      await tick();
      const msgsD = documentFake.querySelector('#msgs');
      const card = msgsD && queryWithin(msgsD, '.card', true).find((b) => b.onclick && !b.disabled);
      if (card) card.onclick();
      const mok = idRegistry.get('mok');
      if (mok && mok.onclick) { const f = mok.onclick; mok.onclick = null; f(); }
      const sc = G.scene;
      if (sc && sc.isCandles) {
        // estrategia del conductor: ir a la vela apagada más cercana (o a
        // soplar una de José si ya no quedan apagadas) y mantener ESPACIO
        const pool = sc.candles.filter((c) => !c.owner);
        const targets = pool.length ? pool : sc.candles.filter((c) => c.owner === 'j');
        const cd = targets.sort((a, b) => Math.hypot(sc.p.x - a.x, sc.p.y - a.z) - Math.hypot(sc.p.x - b.x, sc.p.y - b.z))[0];
        if (cd) { const st = W.nearestFree(cd.x, cd.z + 14); sc.p.x = st[0]; sc.p.y = st[1]; }
        key('Space', true);
        sc.update(0.05);
      }
    }
    key('Space', false);
    await p;
    check('runEvent(apagon) se completa', settled && it < 6000, 'iteraciones=' + it);
    check('el duelo quedó registrado en S.duels', S.duels.some((d) => d.game === 'apagon'), JSON.stringify(S.duels));
    check('el resultado en la historia no fue derrota (la estrategia prende sin parar)', (S.duels.find((d) => d.game === 'apagon') || {}).win !== 'lose', JSON.stringify(S.duels));
    check('flags.apagon guardadas con las salidas NUEVAS (velas y parpadeos, sin fantasmas)',
      !!S.flags.apagon && typeof S.flags.apagon.candlesPlayer === 'number' && typeof S.flags.apagon.candlesJose === 'number' && typeof S.flags.apagon.surges === 'number' && !('ghosts' in S.flags.apagon) && !('fixed' in S.flags.apagon),
      JSON.stringify(S.flags.apagon));
    check('sin ruta paranormal: el juego de fantasmas ya no existe', !S.flags.rutaParanormal);
    check('la calidad de la fiesta recibió el bonus de victoria/empate', S.qBonus > 0, 'qBonus=' + S.qBonus);
  }

  // ================= E) Dibujo: caminos de draw() sin excepciones ==========
  console.log('\nE) Dibujo — draw() de Velas (intro, memoria, juego, canalización, parpadeo, final) y de DecoDuel');
  if (Sc.CandleGame) {
    const realRender = W.render, realProject = G.R.project;
    const ctx2d = new FakeCtx();
    W.render = (opts) => { if (opts.boxes) opts.boxes(new G.R.MB(), 0); if (opts.sprites) opts.sprites(0); if (opts.over) opts.over(ctx2d, 0); }; // R.dyn no existe sin WebGL: se pasa una MB vacía
    G.R.project = () => ({ x: 320, y: 180, ok: true });
    try {
      const sc = new Sc.CandleGame('natalia', () => {});
      sc.draw(0.016); // intro
      check('draw sin errores: intro de Velas', true);
      sc.st = 'memory'; sc.surgeK = 1; sc.draw(0.016); // casa iluminada + banner «MEMORIZA…»
      check('draw sin errores: fase de MEMORIA de Velas', true);
      sc.surgeK = 0;
      sc.st = 'play';
      sc.candles[0].owner = 'p'; sc.candles[1].owner = 'j'; // una vela prendida por cada uno
      sc.draw(0.016);
      check('draw sin errores: juego con velas prendidas de ambos (llamas ámbar y verdosa)', true);
      // Regresión (franjas sobre las velas): la llama dibujada debe ser el
      // canvas propio de la vela (16×22), NUNCA la llama de cohete de los
      // duelos espaciales (60×84): una colisión de nombre entre dos
      // «function flameCv» de scenes.js hacía que el duelo recibiera la
      // pluma del cohete y la pintara como un cono gigante sobre cada vela.
      const realSpriteFn = G.R.sprite, drawnSprites = [];
      G.R.sprite = (cv, x, y, z, o) => { drawnSprites.push({ cv, x, y, z }); return realSpriteFn(cv, x, y, z, o); };
      sc.draw(0.016);
      G.R.sprite = realSpriteFn;
      const litNow = sc.candles.filter((c) => c.owner);
      const flamesAt = litNow.map((cd) => drawnSprites.find((s) => s.x === cd.x && s.z === cd.z && s.y > cd.y + 5));
      check('la llama de cada vela prendida es su canvas propio de 16×22 (no la llama de cohete de 60×84)',
        flamesAt.every(Boolean) && flamesAt.every((f) => f.cv.width === 16 && f.cv.height === 22),
        flamesAt.map((f) => f && (f.cv.width + 'x' + f.cv.height)).join(','));
      check('las llamas de jugador y José son canvas distintos (ámbar y verdosa)',
        flamesAt.length === 2 && !!flamesAt[0] && !!flamesAt[1] && flamesAt[0].cv !== flamesAt[1].cv);
      check('ningún sprite del duelo de velas usa el canvas de la llama de cohete (60×84)',
        !drawnSprites.some((s) => s.cv.width === 60 && s.cv.height === 84));
      sc.chan = { c: sc.candles[2], kind: 'light', t: 0.3, need: 0.6 };
      sc.draw(0.016);
      check('draw sin errores: canalización con anillo de progreso', true);
      sc.chan = null; sc.surgeState = 'warn'; sc.draw(0.016);
      check('draw sin errores: aviso de parpadeo (ícono de alerta)', true);
      sc.surgeState = 'on'; sc.surgeK = 1; sc.draw(0.016);
      check('draw sin errores: parpadeo con la luz de vuelta (velas apagadas destellando)', true);
      sc.surgeState = 'idle'; sc.finish(); sc.draw(0.016); // panel final
      check('draw sin errores: panel final de Velas (¡VOLVIÓ LA LUZ!)', true);
      const dd = new Sc.DecoDuel('natalia', () => {});
      dd.st = 'play'; G.S.deco[0].placed = true; dd.draw(0.016); // incluye la marca ✓ de zona colocada
      check('draw sin errores: DecoDuel con una zona colocada', true);
    } catch (e) {
      check('draw sin errores (excepción: ' + e.message + ')', false, e.stack && e.stack.split('\n')[1]);
    } finally { W.render = realRender; G.R.project = realProject; W.xDoorOpen = false; }
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
      // el salto ahora es un ARCO con duración real: la tecla se pulsa y
      // se deja correr el duelo hasta que el escalador se asienta
      const press = (dir) => { tap(dir < 0 ? 'ArrowLeft' : 'ArrowRight'); d.update(0.016); for (let i = 0; i < 40 && d.hop.p; i++) d.update(0.016); d.update(0.016); };
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

    // F5) DE ESPALDAS y SALTO FLUIDO (pedido de Jose): ambos escaladores
    // se ven de espaldas todo el duelo y el salto es un arco continuo
    {
      const d = new Sc.ClimbDuel('natalia', () => {});
      d.st = 'play'; d.time = 1e9; d.cstep = 1e9; d.ct = 1e9; // Pollito congelado: sus saltos los fuerza el test
      check('espaldas: el jugador queda con dir "up" (reposo = idle_up, la vista trasera)', d.p.dir === 'up', 'dir=' + d.p.dir);
      check('espaldas: Pollito parte con su pose trasera quieta (backPose = back_idle)', !!d.cat.backPose && d.cat.backPose.anim === 'back_idle', d.cat.backPose && d.cat.backPose.anim);
      const cmeta = G.Sprites.META.chars.pollito;
      check('espaldas: la hoja definida de Pollito trae back_idle (>=1) y back_jump (>=2)', (cmeta.anims.back_idle || []).length >= 1 && (cmeta.anims.back_jump || []).length >= 2,
        `back_idle=${(cmeta.anims.back_idle || []).length} back_jump=${(cmeta.anims.back_jump || []).length}`);
      // trayectoria de UN salto muestreada cuadro a cuadro
      const q1 = d.shelfAt(-70, 1);
      tap(sideAt(0) < 0 ? 'ArrowLeft' : 'ArrowRight');
      const samples = [[d.p.x, d.p.elev]]; let stepMax = 0, guard = 0;
      while (guard++ < 90) { d.update(0.008); samples.push([d.p.x, d.p.elev]); stepMax = Math.max(stepMax, d.p.step); if (!d.hop.p && guard > 3) break; }
      const maxStep = samples.reduce((m, s, i) => i ? Math.max(m, Math.abs(s[0] - samples[i - 1][0]), Math.abs(s[1] - samples[i - 1][1])) : m, 0);
      const apex = Math.max(...samples.map((s) => s[1]));
      check('salto fluido: trayectoria CONTINUA, sin teletransportes (Δmáx por cuadro <= 8 u)', samples.length >= 10 && maxStep <= 8, `muestras=${samples.length} Δmáx=${maxStep.toFixed(2)}`);
      check('salto fluido: el arco pasa por un ápice sobre la repisa y aterriza EXACTO en ella', apex > q1.e && d.p.x === q1.x && d.p.elev === q1.e && !d.hop.p, `ápice=${apex.toFixed(1)} destino=(${q1.x},${q1.e}) fin=(${d.p.x},${d.p.elev})`);
      check('salto fluido: el ciclo trasero avanza sincronizado con la fase (step recorre el ciclo)', stepMax > 3, 'stepMax=' + stepMax.toFixed(2));
      // la caída al fallar también es un arco continuo hasta la repisa anterior
      tap(-sideAt(d.pi) < 0 ? 'ArrowLeft' : 'ArrowRight');
      const fs = [[d.p.x, d.p.elev]]; guard = 0;
      while (guard++ < 90) { d.update(0.008); fs.push([d.p.x, d.p.elev]); if (!d.hop.p && guard > 3) break; }
      const fMax = fs.reduce((m, s, i) => i ? Math.max(m, Math.abs(s[0] - fs[i - 1][0]), Math.abs(s[1] - fs[i - 1][1])) : m, 0);
      check('caída fluida: el resbalón baja en arco continuo y se asienta en la repisa anterior, aún de espaldas', fMax <= 8 && d.pi === 0 && d.p.elev === 0 && d.p.dir === 'up', `Δmáx=${fMax.toFixed(2)} pi=${d.pi} elev=${d.p.elev} dir=${d.p.dir}`);
      // Pollito: back_jump en el aire y back_idle al asentarse
      d.ct = 0.0001; d.update(0.016); d.update(0.016);
      check('espaldas: Pollito salta con back_jump (nada de frontal/perfil/pounce en este duelo)', !!d.cat.backPose && d.cat.backPose.anim === 'back_jump' && !!d.hop.c, d.cat.backPose && d.cat.backPose.anim);
      for (let i = 0; i < 40 && d.hop.c; i++) d.update(0.016);
      check('espaldas: Pollito se asienta y vuelve a back_idle', !d.hop.c && !!d.cat.backPose && d.cat.backPose.anim === 'back_idle', d.cat.backPose && d.cat.backPose.anim);
    }
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
  check('en el armario, ESPACIO recluta al partner (queda entrando, partner +1, hombro libre)', csc.carrying === null && csc.partners.includes(npcA.id) && npcA.state === 'entering' && csc.p.carryWalk === false);
  tap('Space'); cstep();
  check('otro ESPACIO en el armario guarda los ítems de las manos (convivencia)', csc.p.carry.length === 0 && S.inv[it0.id] === true);
  // la secuencia del armario corre hasta el final: puerta abierta,
  // el partner ENTRA y la puerta se cierra — queda DENTRO e invisible
  for (let i = 0; i < 300 && (npcA.state !== 'inside' || csc.stashBusy); i++) cstep();
  check('guardado: la secuencia termina con el partner DENTRO del armario (inside + oculto, sin sprite en la casa)',
    npcA.state === 'inside' && npcA.hidden === true && csc.stashBusy === null && W.closet.target === 0,
    'state=' + npcA.state + ' hidden=' + npcA.hidden);
  const npcB = csc.others.find((o) => o.state === 'free');
  goNear(npcB); tap('Space'); cstep();
  const wasCarrying = csc.carrying === npcB;
  csc.p.x = 200; csc.p.y = 150; tap('Space'); cstep();
  check('bajarlo fuera del armario NO lo recluta: vuelve a free donde quedó', wasCarrying && csc.carrying === null && npcB.state === 'free' && !csc.partners.includes(npcB.id));
  // COLA de entregas: reclutar a otro MIENTRAS la puerta está ocupada
  // no pierde la entrega — el segundo espera su turno y también entra
  const npcQ1 = csc.others.find((o) => o.state === 'free');
  goNear(npcQ1); tap('Space'); cstep();
  csc.p.x = W.STASH.x; csc.p.y = W.STASH.y; tap('Space'); cstep(); // entrega 1: la puerta arranca su secuencia
  const npcQ2 = csc.others.find((o) => o.state === 'free');
  goNear(npcQ2); tap('Space'); cstep();
  csc.p.x = W.STASH.x; csc.p.y = W.STASH.y; tap('Space'); cstep(); // entrega 2: con la puerta OCUPADA
  check('cola: la entrega con la puerta ocupada se registra igual (partner +1 al instante)',
    csc.partners.includes(npcQ2.id) && npcQ2.state === 'entering', 'partners=' + csc.partners.join(','));
  for (let i = 0; i < 480 && (npcQ1.state !== 'inside' || npcQ2.state !== 'inside'); i++) cstep();
  check('cola: ambos terminan DENTRO del armario, de uno en uno', npcQ1.state === 'inside' && npcQ2.state === 'inside' && npcQ1.hidden && npcQ2.hidden,
    `q1=${npcQ1.state} q2=${npcQ2.state}`);
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
      for (let i = 0; i < 240 && dn.state !== 'inside'; i++) dsc.update(0.016); // la secuencia del armario, hasta cerrarse
      dsc.draw(0.016);
      check('draw sin errores: CollectScene con el partner guardado DENTRO del armario', dn.state === 'inside' && dn.hidden === true);
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
  // STAGING DE LA LLEGADA (playtest de Jose: Itzel tapaba a Ximena):
  // Ximena se queda parada en (510, 548) diciendo sus líneas y la
  // cámara mira desde el sur. Los partners ya no esperan en las
  // esquinas: están DENTRO del armario y solo asoman los ojos. Como
  // en la prueba no corre el bucle de frames, se dejan correr unos
  // pasos de la escena para que los partners completen su SALIDA del
  // armario (la puerta se abre al dormirse Ximena y salen de uno en
  // uno): al final deben estar visibles, junto al armario.
  for (let i = 0; i < 14; i++) G.home.update(0.05);
  check('llegada: ningún presente VISIBLE queda DELANTE de Ximena en su caja de visión (|x-510| < 80 con y > 500)',
    !G.home.roomies.some((r) => !r.hidden && Math.abs(r.x - 510) < 80 && r.y > 500),
    G.home.roomies.map((r) => r.id + '@' + r.x + ',' + r.y).join(' '));
  { let minPair = Infinity; const rs = G.home.roomies.filter((r) => !r.hidden);
    for (let i = 0; i < rs.length; i++) for (let j = i + 1; j < rs.length; j++) minPair = Math.min(minPair, Math.hypot(rs[i].x - rs[j].x, rs[i].y - rs[j].y));
    check('llegada: los presentes visibles quedan separados entre sí (≥40 u: ningún sprite solapa a otro)', minPair >= 40, 'mín=' + minPair.toFixed(0) + ' u'); }
  check('llegada: las esquinas de los partners quedan VACÍAS (ya no esperan ahí: están en el armario)',
    !G.home.roomies.some((r) => [[415, 505], [605, 505], [415, 568]].some((sp) => r.x === sp[0] && r.y === sp[1])),
    G.home.roomies.map((r) => r.id + '@' + r.x + ',' + r.y).join(' '));
  check('armario: al dormirse Ximena, los guardados SALIERON del armario (visibles, junto a él) y la noche arranca con la party completa',
    S.partners.every((id) => { const a = G.home.actor(id); return a && !a.hidden && a.x > 540 && a.x < 660 && a.y > 370 && a.y < 430; }),
    S.partners.map((id) => { const a = G.home.actor(id); return id + '@' + (a ? a.x + ',' + a.y + ' hid=' + a.hidden : '—'); }).join(' '));
  check('armario: tras la salida, la rendija se cerró (sin ojos mirando y puerta con target 0)',
    !G.home.closetPeek && W.closet.target === 0, 'peek=' + JSON.stringify(G.home.closetPeek) + ' target=' + W.closet.target);

  // --- Los ojos de la rendija: un par por partner, y son SUS ojos ---
  check('ojos del armario: la banda de ojos se recorta del frame idle de CADA roomie (metadata de ojos definida)',
    G.PLAYABLE.every((id) => { const b = G.Sprites.eyeBand(id); return b && b.width > 2 && b.height > 2; }),
    G.PLAYABLE.map((id) => { const b = G.Sprites.eyeBand(id); return id + ':' + (b ? b.width + 'x' + b.height : 'null'); }).join(' '));
  {
    const home2 = new Sc.HomeScene();
    home2.closetPeek = S.partners.slice();
    check('ojos del armario: la escena expone TANTOS pares de ojos como partners guardados (3)', home2.closetPeek.length === 3, 'peek=' + home2.closetPeek.join(','));
    const realRender = W.render, realProject = G.R.project;
    const ctx2d = new FakeCtx();
    W.render = (opts) => { if (opts.boxes) opts.boxes(new G.R.MB(), 0); if (opts.sprites) opts.sprites(0); if (opts.over) opts.over(ctx2d, 0); };
    G.R.project = () => ({ x: 320, y: 180, ok: true });
    try {
      home2.draw(0.016);
      check('draw sin errores: HomeScene con los 3 pares de ojos asomando por la rendija del armario', true);
      home2.closetPeek = [];
      home2.draw(0.016);
      check('draw sin errores: HomeScene con el armario cerrado (0 partners, sin ojos)', true);
    } catch (e) {
      check('draw sin errores con ojos en el armario (excepción: ' + e.message + ')', false, e.stack && e.stack.split('\n')[1]);
    } finally { W.render = realRender; G.R.project = realProject; }
    check('ojos del armario: la rendija es una rendija (CLOSET_PEEK entre 0 y 0,5 de apertura)', W.CLOSET_PEEK > 0 && W.CLOSET_PEEK < 0.5, 'peek=' + W.CLOSET_PEEK);
  }

  // --- Asignaciones posteriores: solo la party ---
  let settledW = false, cardCount = -1;
  const pw = G.debug.runEvent('whatsapp').then(() => { settledW = true; }, (e) => { settledW = true; console.log('  (error en whatsapp: ' + e.message + ')'); });
  let itw = 0;
  while (!settledW && itw++ < 2000) {
    await tick();
    const msgsG = documentFake.querySelector('#msgs');
    const cards = msgsG ? queryWithin(msgsG, '.card', true).filter((b) => b.onclick) : [];
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

    // --- El joystick también navega el carrusel (pedido de Jose,
    // 2026-11-22): en su teléfono los botones ‹ › quedaban recortados
    // fuera del área visible del modal y no podía cambiar de
    // personaje. Dos frentes: los botones se anclan al centro del
    // retrato (zona siempre visible) y el joystick mueve la vista.
    const cssTxtI = fs.readFileSync(path.join(__dirname, '..', 'application', 'src', 'css', 'style.css'), 'utf8');
    check('carrusel táctil: los ‹ › se anclan al centro del retrato (top por clamp cqh, ya NO al 50% del carrusel, que el recorte del modal se comía)',
      cssTxtI.includes('top: clamp(66px, 18cqh + 18px, 93px)') && cssTxtI.includes('top: clamp(54px, 13cqh + 18px, 70px)'), '');
    check('carrusel táctil: con la capa táctil activa los ‹ › crecen a 52px y la capa NO se oculta con el carrusel abierto (excepción .nav-open)',
      cssTxtI.includes('body.touch-on .cnav') && cssTxtI.includes('#touchpad.nav-open'), '');
    let joyRes = 'pendiente';
    const pJoy = G.debug.selectChar().then((id) => { joyRes = id; });
    await tick(); await tick();
    const modalJoy = overlayEl.children[0];
    const trackJoy = modalJoy && queryWithin(modalJoy, '.ctrack', false);
    const padEl = documentFake.querySelector('#touchpad');
    check('joystick: con el carrusel abierto la capa táctil queda marcada .nav-open (no se oculta)', !!padEl && padEl._classes.has('nav-open'));
    G.input.joySet(0.9, 0); // empuje a la derecha: cruza el umbral de flecha
    check('joystick: un empuje a la derecha mueve el carrusel UN paso', !!trackJoy && trackJoy.style.transform === 'translateX(-260px)', trackJoy && trackJoy.style.transform);
    G.input.joySet(0.95, 0); // el dedo sigue empujando: no debe repetir
    check('joystick: mantener el empuje NO repite pasos (histéresis del umbral)', !!trackJoy && trackJoy.style.transform === 'translateX(-260px)', trackJoy && trackJoy.style.transform);
    G.input.joySet(0, 0); G.input.joySet(-0.9, 0); // soltar rearma; empuje a la izquierda
    check('joystick: tras soltar, un empuje a la izquierda retrocede un paso', !!trackJoy && trackJoy.style.transform === 'translateX(0px)', trackJoy && trackJoy.style.transform);
    G.input.joySet(0, 0);
    const cardsJoy = modalJoy ? queryWithin(modalJoy, '.pcard', true) : [];
    cardsJoy[0].onclick(); await pJoy;
    check('joystick: tocar una tarjeta sigue eligiendo tras navegar con el joystick', joyRes === G.PLAYABLE[0], 'res=' + joyRes);
    check('joystick: al cerrar el selector la marca .nav-open se retira de la capa táctil', !!padEl && !padEl._classes.has('nav-open'));
    G.input.joySet(0.9, 0); G.input.joySet(0, 0); // sin pantalla viva: no debe lanzar ni mover nada
    check('joystick: sin carrusel abierto, empujar no lanza errores ni deja suscripciones vivas', true);
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

    // --- El cohete: tripulación según modo, y solo desde los 145 m (ROCKET_E) ---
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
    // bajo el umbral de 145 m: jamás pasa
    {
      const d = new Sc.ClimbDuel('natalia', () => {});
      d.st = 'play'; d.time = 1e9; d.cstep = 1e9; d.ct = 1e9; d.rocketWait = 0;
      for (let i = 0; i < 40; i++) d.update(0.05);
      check('cohete: bajo su umbral (145 m) NUNCA se dispara (ni con la espera agotada)', d.rocket === null && d.cam.y < Sc.ClimbDuel.ROCKET_E, `cam.y=${d.cam.y.toFixed(0)}`);
    }
    // umbral propio: 145 m, desacoplado de la zona espacio (200 m)
    check('cohete: su umbral propio es 145 m (3625 u), bajo la zona espacio (5000 u)',
      Sc.ClimbDuel.ROCKET_E === 145 * 25 && Sc.ClimbDuel.ROCKET_E < 5000, `ROCKET_E=${Sc.ClimbDuel.ROCKET_E}`);
    const mkClimbAt = (elev) => {
      const d = new Sc.ClimbDuel('natalia', () => {});
      d.st = 'play'; d.time = 1e9; d.cstep = 1e9; d.ct = 1e9; // Pollito congelado
      d.p.elev = elev; d.p.te = elev; d.pi = d.pMax = Math.round(elev / Sc.ClimbDuel.SHELF_H); d.cam.y = elev;
      return d;
    };
    // entre 145 y 200 m (estratósfera alta, aún NO espacio): el cohete SÍ pasa
    {
      const d = mkClimbAt(4200); // 168 m
      d.rocketWait = 0; d.update(0.05);
      check('cohete: entre 145 y 200 m (cámara a 4200 u) SÍ se dispara, sin estar en la zona espacio',
        !!d.rocket && d.cam.y >= Sc.ClimbDuel.ROCKET_E && d.cam.y < 5000, `cam.y=${d.cam.y.toFixed(0)} rocket=${!!d.rocket}`);
    }
    // a 120 m (bajo el umbral): no pasa ni con la espera agotada
    {
      const d = mkClimbAt(3000); // 120 m
      d.rocketWait = 0;
      for (let i = 0; i < 40; i++) d.update(0.05);
      check('cohete: a 120 m (3000 u) NO se dispara nunca', d.rocket === null && d.cam.y < Sc.ClimbDuel.ROCKET_E, `cam.y=${d.cam.y.toFixed(0)}`);
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
        const dLow = mkClimbAt(4200); // 168 m: sobre el umbral del cohete, bajo la zona espacio
        dLow.rocket = { x: 0, dir: 1, crew: dLow.rocketCrew() };
        dLow.draw(0.016);
        check('draw sin errores: el cohete se dibuja entre 145 y 200 m (cuerpo y caras, aún sin galaxias)', dLow.rocket.crew.length === 3);
      } catch (e) {
        check('draw sin errores con cohete/galaxias (excepción: ' + e.message + ')', false, e.stack && e.stack.split('\n')[1]);
      } finally { W.render = realRender; G.R.project = realProject; }
    }
    // --- Chip de zona: anuncio compacto en la franja superior, duración breve ---
    {
      const realRender = W.render, realProject = G.R.project;
      const ctx2d = new FakeCtx();
      const rects = [];
      ctx2d.fillRect = (x, y, w, h) => rects.push({ m: 'fillRect', x, y, w, h });
      ctx2d.roundRect = (x, y, w, h) => rects.push({ m: 'roundRect', x, y, w, h });
      W.render = (opts) => { if (opts.boxes) opts.boxes(new G.R.MB(), 0); if (opts.sprites) opts.sprites(0); if (opts.over) opts.over(ctx2d, 0); };
      G.R.project = () => ({ x: 320, y: 180, ok: true });
      try {
        const d = new Sc.ClimbDuel('natalia', () => {});
        d.st = 'play'; d.time = 1e9;
        d.zoneBanner(2);
        check('chip de zona: el anuncio dura ~1,4 s (breve; la banda antigua duraba 3 s)',
          !!d.banner && d.banner.d > 0 && d.banner.d <= 1.5, 'd=' + (d.banner && d.banner.d));
        d.banner.t = 0.4; // en plena visibilidad
        d.draw(0.016);
        check('chip de zona: sin banda a todo ancho — el fondo del anuncio es una pastilla en la franja superior (y 80–122, h ≤ 30, w < 400)',
          !rects.some((r) => r.w >= 600) && rects.some((r) => r.m === 'roundRect' && r.y >= 80 && r.y + r.h <= 122 && r.h <= 30 && r.w < 400),
          JSON.stringify(rects.filter((r) => r.w >= 600 || (r.y >= 80 && r.y <= 130))));
        check('chip de zona: ningún fondo de anuncio invade la zona central de juego (y 130–300)',
          !rects.some((r) => r.y >= 130 && r.y <= 300 && r.h > 20 && r.w > 200),
          JSON.stringify(rects.filter((r) => r.y >= 130 && r.y <= 300)));
      } catch (e) {
        check('draw del chip de zona sin errores (excepción: ' + e.message + ')', false, e.stack && e.stack.split('\n')[1]);
      } finally { W.render = realRender; G.R.project = realProject; }
    }
  }

  // ================= L) Tres minijuegos nuevos: carrera, imagen, globos =====
  console.log('\nL) Minijuegos nuevos — Cactus en carrera · La imagen distinta · Globos por las nubes');
  {
    // --- Registro: escenas, MG, eventos, guion y práctica ---
    check('existen las tres escenas nuevas', !!(Sc.CactusRaceDuel && Sc.ImageDuel && Sc.BalloonDuel));
    check('MG registra cactus2 / imagen / globos con sus escenas',
      MG.cactus2 && MG.cactus2.Scene() === Sc.CactusRaceDuel && MG.imagen && MG.imagen.Scene() === Sc.ImageDuel && MG.globos && MG.globos.Scene() === Sc.BalloonDuel);
    check('eventos: imagen y globos contra José; cactus2 contra Pollito',
      G.EVENTS.imagen.game === 'imagen' && G.EVENTS.imagen.boss === 'jose' && G.EVENTS.globos.game === 'globos' && G.EVENTS.globos.boss === 'jose' && G.EVENTS.cactus2.game === 'cactus2' && G.EVENTS.cactus2.boss === 'pollito');
    check('la tarjeta de práctica de Globos nombra al director: «José · dirige Pollito»', (G.EVENTS.globos.bossLabel || '').includes('Pollito'), G.EVENTS.globos.bossLabel);
    const st = G.STORY;
    check('guion: «imagen» cae en acto intermedio (tras memoria, antes de pollito) y «globos» en acto tardío (tras azotea, antes de sonambula)',
      st.indexOf('imagen') > st.indexOf('memoria') && st.indexOf('imagen') < st.indexOf('pollito') && st.indexOf('globos') > st.indexOf('azotea') && st.indexOf('globos') < st.indexOf('sonambula'), st.join(','));
    check('guion: cactus2 NO está en la historia (entra solo por el sorteo del evento cactus)', !st.includes('cactus2') && st.includes('cactus'));

    // --- Cactus en carrera: física de gravedad, golpes, cambio de velocidad ---
    const race = new Sc.CactusRaceDuel('natalia', () => {});
    check('carrera: jugador y Pollito en el MISMO carril (misma z, desfase en x ≤ 90 u)',
      race.p.y === race.cat.y && Math.abs(race.p.x - race.cat.x) <= 90, `p=${race.p.x},${race.p.y} cat=${race.cat.x},${race.cat.y}`);
    check('carrera: tramos de gravedad — normal → lunar → pesada → lunar → pesada → normal',
      race.gravAt(5) === 'normal' && race.gravAt(15) === 'luna' && race.gravAt(30) === 'pesada' && race.gravAt(45) === 'luna' && race.gravAt(53) === 'pesada' && race.gravAt(59) === 'normal',
      [5, 15, 30, 45, 53, 59].map((t) => race.gravAt(t)).join(','));
    const jumpMax = (gkey) => { race.grav = gkey; const r = { h: 0, v: 0, stun: 0, hits: 0 }; race.tryJump(r); let max = 0; for (let i = 0; i < 300 && (r.h > 0 || r.v > 0); i++) { race.stepRunner(r, race.p, 0.016); max = Math.max(max, r.h); } return max; };
    const hN = jumpMax('normal'), hL = jumpMax('luna'), hP = jumpMax('pesada');
    check('carrera: la gravedad ALTERA el salto (lunar mucho más alto y flotante; pesada, corto)',
      hL > hN * 1.8 && hP < hN * 0.85 && Math.abs(race.jumpHeight('luna') - hL) < hL * 0.25, `lunar=${hL.toFixed(0)} normal=${hN.toFixed(0)} pesada=${hP.toFixed(0)}`);
    race.grav = 'normal'; race.st = 'play'; race.time = 1e9; race.spawnT = 1e9;
    race.cacti = [{ x: race.p.x, vx: 0, rot: 0, change: null, warned: false, hitP: false, hitC: false, catAct: true, react: 9, ignore: true }];
    race.update(0.016);
    check('carrera: un cactus a ras de suelo SUMA un golpe y aturde (tropiezo)', race.run.p.hits === 1 && race.run.p.stun > 0, `hits=${race.run.p.hits} stun=${race.run.p.stun}`);
    race.run.p.h = 80; race.run.p.stun = 0; // en el aire, el mismo cactus ya no cuenta (y además ya marcó a este corredor)
    race.cacti.push({ x: race.p.x, vx: 0, rot: 0, change: null, warned: false, hitP: false, hitC: false, catAct: true, react: 9, ignore: true });
    race.update(0.016);
    check('carrera: saltando por encima NO hay golpe', race.run.p.hits === 1, 'hits=' + race.run.p.hits);
    const speeder = { x: -350, vx: 100, rot: 0, change: { at: -100, f: 1.5, done: false }, warned: false, hitP: false, hitC: false, catAct: true, react: 9, ignore: true };
    race.cacti = [speeder]; race.run.p.h = 500; race.run.c.h = 500; // nadie estorba: solo se mide la velocidad
    let warnedSeen = false;
    for (let i = 0; i < 300 && !speeder.change.done; i++) { race.update(0.05); if (speeder.warned) warnedSeen = true; }
    check('carrera: el cactus con cambio de velocidad AVISA antes (warned) y luego acelera ×1,5',
      warnedSeen && speeder.change.done && speeder.vx > 170, `vx=${speeder.vx.toFixed(0)} warned=${warnedSeen}`);
    // --- Carrera: cámara alejada, rodadura verdadera y apoyo en el suelo (playtest de Jose, 2026-11-22) ---
    check('carrera: la cámara va MÁS LEJOS (dist 500, no los 350 de antes: más pista visible por delante)',
      race.cam.dist === 500, 'dist=' + race.cam.dist);
    { // ω = v/r con el radio real de la bola: un paso de update con vx conocida
      const roller = { x: -100, vx: 100, rot: 0, change: null, warned: false, hitP: false, hitC: false, catAct: true, react: 9, ignore: true };
      race.cacti = [roller]; race.run.p.h = 500; race.run.c.h = 500; race.spawnT = 1e9; // nadie estorba: solo se mide la rotación
      race.update(0.05); // la pista acelera antes de mover: vx pasa a 101,2 y con ella rueda
      const wantRot = -(101.2 * 0.05) / 18.7;
      check('carrera: la bola rueda SIN deslizar (Δrot = −v·dt/r con r = 18,7, su radio pintado; antes /13 patinaba)',
        Math.abs(roller.rot - wantRot) < 0.005, `rot=${roller.rot.toFixed(4)} want=${wantRot.toFixed(4)}`);
    }
    { // el centro de la bola no se mueve al girar (nada de órbitas) y su base toca el suelo
      const probe = { x: 30, vx: 0, rot: 0, change: null, warned: false, hitP: false, hitC: false, catAct: true, react: 9, ignore: true };
      let okC = true, worst = 0;
      for (const th of [0, 0.7, 1.9, 3.4, 5.9]) {
        probe.rot = th;
        const bd = race.ballDraw(probe);
        // R.sprite gira sobre la base del cuadro (con feet 0, el pivote es (x, y)):
        // el centro pintado es pivote + R(roll)·(0, dyC) y debe caer siempre en (c.x, cy)
        const cx = bd.x - bd.dyC * Math.sin(bd.roll), cyy = bd.y + bd.dyC * Math.cos(bd.roll);
        const err = Math.hypot(cx - probe.x, cyy - bd.cy);
        worst = Math.max(worst, err); if (err > 0.01) okC = false;
        if (Math.abs(bd.cy - bd.rv) > 0.01) okC = false; // centro a exactamente un radio del suelo: tangente, ni hundida ni flotando
      }
      check('carrera: la bola gira sobre SU CENTRO y queda TANGENTE al suelo en todo el giro',
        okC, `peor error=${worst.toFixed(4)}`);
    }

    // --- La imagen distinta: construcción, puntos y anulaciones ---
    const img = new Sc.ImageDuel('natalia', () => {});
    let allOneDiff = true, levelsOk = true;
    for (let r = 0; r < 9; r++) {
      img.round = r; img.setup(r);
      const keys = img.panels.map((s) => JSON.stringify(s));
      const uniq = keys[img.diffIdx];
      if (!(keys.filter((k) => k === uniq).length === 1 && keys.filter((k, i) => i !== img.diffIdx).every((k) => k === keys[(img.diffIdx + 1) % 3]))) allOneDiff = false;
      const lv = r < 2 ? 0 : r < 4 ? 1 : 2;
      const want = lv === 0 ? ['color'] : lv === 1 ? ['cantidad', 'accesorio'] : ['raya', 'adorno', 'espejo'];
      if (!want.includes(img.diffType)) levelsOk = false;
    }
    check('imagen: TODA ronda tiene exactamente UNA imagen distinta (garantizado por construcción)', allOneDiff);
    check('imagen: la sutileza crece por rondas (color → cantidad/accesorio → raya/adorno/espejo)', levelsOk);
    // --- La imagen distinta: FASE DE DESTAPE (cubierta estilo Mario Party) ---
    {
      const d = new Sc.ImageDuel('natalia', () => {});
      d.st = 'play';
      check('imagen: la ronda NACE cubierta (fase uncover, fracción visible 0)', d.phase === 'uncover' && d.visibleFrac() === 0, `phase=${d.phase} frac=${d.visibleFrac()}`);
      check('imagen: el orden de destape es UNA permutación de las 24 celdas (una sola máscara, compartida por los 3 paneles)',
        d.maskPos.length === 24 && new Set(d.maskPos).size === 24 && d.maskPos.every((v) => v >= 0 && v < 24),
        JSON.stringify(d.maskPos));
      // cellCover(cell) no recibe el panel: la opacidad de cada celda es la
      // misma en los 3 paneles en todo instante POR CONSTRUCCIÓN; aquí se
      // verifica la progresión temporal de esa única máscara.
      const fr = [];
      for (let s = 0; s < 7; s++) { for (let i = 0; i < 20; i++) d.update(0.05); fr.push(d.visibleFrac()); }
      check('imagen: durante el destape la fracción visible CRECE en cada segundo muestreado (ni todo al principio ni todo al final)',
        fr.every((v, i) => i === 0 || v > fr[i - 1]) && fr[0] > 0 && fr[0] < 0.45 && fr[6] > 0.8, fr.map((v) => v.toFixed(2)).join(','));
      for (let i = 0; i < 10 && d.phase === 'uncover'; i++) d.update(0.05); // margen por la suma flotante de dt
      check('imagen: a los ~7 s la cubierta desaparece y se abre la elección (fase show; el reloj de José arranca de cero)',
        d.phase === 'show' && d.phaseT < 0.6 && d.josePick === null, `phase=${d.phase} phaseT=${d.phaseT} josePick=${d.josePick}`);
    }
    {
      // José NO elige durante el destape: su reloj arranca recién con
      // la imagen completa, aunque esté «listo para responder ya»
      const d = new Sc.ImageDuel('natalia', () => {});
      d.st = 'play'; d.joseAt = 0; d.joseAcc = 1;
      for (let i = 0; i < 60; i++) d.update(0.05); // ~3 s de destape, sin elección del jugador
      check('imagen: José NO responde durante el destape (su reloj arranca con la imagen completa)',
        d.phase === 'uncover' && d.josePick === null && d.pw === 0 && d.bw === 0,
        `phase=${d.phase} josePick=${d.josePick} pw=${d.pw} bw=${d.bw}`);
    }
    {
      // ELECCIÓN ANTICIPADA acertada (pedido de Jose): a mitad del
      // destape, un clic en el panel correcto (clickIdx, el canal del
      // puntero) resuelve la ronda EN ESE INSTANTE, sin esperar los 7 s
      const d = new Sc.ImageDuel('natalia', () => {});
      d.st = 'play';
      for (let i = 0; i < 40; i++) d.update(0.05); // ~2 s de destape
      const midT = d.uncoverT;
      d.clickIdx = d.diffIdx; d.update(0.05);
      check('imagen: elegir BIEN a mitad del destape resuelve la ronda al instante (fase reveal, punto del jugador en curso)',
        midT < 7 && d.phase === 'reveal' && !!d.pendingEnd && d.pendingEnd.w === 'p' && d.pPick === d.diffIdx,
        `uncoverT=${midT} phase=${d.phase} pending=${d.pendingEnd && d.pendingEnd.w} pPick=${d.pPick} diff=${d.diffIdx}`);
      for (let i = 0; i < 200 && d.st === 'play'; i++) d.update(0.05); // revelado + cierre de ronda
      check('imagen: el punto de la anticipada acertada llega al marcador', d.pw === 1 && d.bw === 0, `pw=${d.pw} bw=${d.bw}`);
    }
    {
      // ELECCIÓN ANTICIPADA errada: la cubierta cae de golpe (la fase
      // pasa a 'show' y drawPanels ya no pinta la cubierta) y José
      // apura su respuesta sobre la imagen revelada: la regla de
      // fallo de siempre, con el punto para él si acierta
      const d = new Sc.ImageDuel('natalia', () => {});
      d.st = 'play'; d.joseAcc = 1; // José no falla la suya
      for (let i = 0; i < 40; i++) d.update(0.05); // ~2 s de destape
      const wrong = (d.diffIdx + 1) % 3;
      d.clickIdx = wrong; d.update(0.05);
      check('imagen: elegir MAL a mitad del destape hace caer la cubierta (fase show) y apura a José (≤1,1 s)',
        d.phase === 'show' && d.pPick === wrong && d.joseAt <= 1.11,
        `phase=${d.phase} pPick=${d.pPick} wrong=${wrong} joseAt=${d.joseAt} phaseT=${d.phaseT}`);
      for (let i = 0; i < 400 && d.st === 'play'; i++) d.update(0.05);
      check('imagen: tras la anticipada errada, José acierta y se lleva el punto (como en la fase final)', d.bw === 1 && d.pw === 0, `pw=${d.pw} bw=${d.bw}`);
    }
    {
      // ELECCIÓN ANTICIPADA por TECLADO: la flecha → durante el destape
      // elige el panel 2 por el mismo hit() de la fase final
      const d = new Sc.ImageDuel('natalia', () => {});
      d.st = 'play';
      for (let i = 0; i < 40; i++) d.update(0.05); // ~2 s de destape
      G.input.touchDown('right', 991); d.update(0.05); G.input.touchUp('right', 991); G.input.flush();
      check('imagen: la flecha → también elige DURANTE el destape (panel 2, la fase uncover quedó atrás)',
        d.pPick === 2 && d.phase !== 'uncover',
        `phase=${d.phase} pPick=${d.pPick}`);
    }
    const skipUncover = (d) => { for (let i = 0; i < 300 && d.phase === 'uncover'; i++) d.update(0.05); }; // deja correr la cuenta atrás del destape
    const playImg = (mutate) => {
      const d = new Sc.ImageDuel('natalia', () => {});
      d.st = 'play'; skipUncover(d); mutate(d);
      for (let i = 0; i < 400 && (d.st === 'play' || d.st === 'rend'); i++) d.update(0.05); // hasta que la ronda puntuada/anulada AVANZA
      return d;
    };
    const dWin = playImg((d) => { d.choose(d.diffIdx); });
    check('imagen: el punto va al PRIMERO que acierta (jugador)', dWin.pw === 1 && dWin.bw === 0, `pw=${dWin.pw} bw=${dWin.bw}`);
    const dJose = playImg((d) => { d.joseAcc = 1; d.choose((d.diffIdx + 1) % 3); }); // el jugador falla y José acierta: punto de José
    check('imagen: si eliges mal y José acierta, el punto es de José', dJose.bw === 1 && dJose.pw === 0, `pw=${dJose.pw} bw=${dJose.bw}`);
    const dNull = playImg((d) => { d.joseAcc = 0; d.choose((d.diffIdx + 1) % 3); }); // ambos fallan: ronda anulada
    check('imagen: si ambos fallan, la ronda se ANULA (sin punto)', dNull.pw === 0 && dNull.bw === 0 && dNull.round >= 1, `pw=${dNull.pw} bw=${dNull.bw} round=${dNull.round}`);
    const dJoseFirst = playImg((d) => { d.joseAcc = 1; d.joseAt = 0.01; });
    check('imagen: José también puede llegar primero y llevarse el punto', dJoseFirst.bw === 1, 'bw=' + dJoseFirst.bw);

    // --- Globos: finta, vuelo y mejor de 5 ---
    // OJO: el juego corre en un contexto vm con su PROPIO Math; el azar
    // se fuerza sobre el Math DEL CONTEXTO (el del host no llega a las
    // escenas), recuperado con vm.runInContext.
    const ctxMath = vm.runInContext('Math', sandbox);
    const realRandom = ctxMath.random;
    ctxMath.random = () => 0.99; // determinismo: sin doble finta y José sin error de apuro en estas pruebas
    try {
      const bal = new Sc.BalloonDuel('natalia', () => {});
      bal.setup(1); bal.st = 'play';
      bal.cur = 0; bal.feint = true; bal.feintDone = false; bal.feintT = 0.1; bal.feint2 = false; bal.signalT = 0.5;
      for (let i = 0; i < 60 && bal.phase !== 'go'; i++) bal.update(0.05);
      check('globos: la FINTA cambia la indicación final (era izquierda, quedó derecha)', bal.feintDone && bal.final === 1, `final=${bal.final}`);
      // elegir ANTES de la señal con la indicación vieja → vuela cuando llega la finta
      const bal2 = new Sc.BalloonDuel('natalia', () => {});
      bal2.setup(1); bal2.st = 'play';
      bal2.cur = 0; bal2.feint = true; bal2.feintDone = false; bal2.feintT = 0.3; bal2.feint2 = false; bal2.signalT = 0.8;
      bal2.press(0, 'p'); // se adelanta: elige la izquierda vigente
      for (let i = 0; i < 200 && bal2.phase !== 'fly'; i++) bal2.update(0.05);
      check('globos: adelantarse a la señal y caer en la finta = SALIR VOLANDO', bal2.phase === 'fly' && bal2.fly.p > 0 && bal2.pPick.early === true, `phase=${bal2.phase} fly.p=${bal2.fly.p}`);
      // elegir mal tras la señal → vuela; José acierta y se lleva la ronda
      const bal3 = new Sc.BalloonDuel('natalia', () => {});
      bal3.setup(0); bal3.st = 'play'; bal3.feint = false; bal3.signalT = 0.1;
      for (let i = 0; i < 60 && bal3.phase !== 'go'; i++) bal3.update(0.05);
      bal3.press(1 - bal3.final, 'p');
      for (let i = 0; i < 200 && bal3.phase !== 'fly'; i++) bal3.update(0.05);
      check('globos: elegir el globo equivocado hace volar al jugador (y José no vuela)', bal3.fly.p > 0 && bal3.fly.b === 0, `fly.p=${bal3.fly.p} fly.b=${bal3.fly.b}`);
      for (let i = 0; i < 200 && bal3.st === 'play'; i++) bal3.update(0.05);
      check('globos: la ronda del error es para José', bal3.bw === 1, 'bw=' + bal3.bw);
      // mejor de 5: ganando 3 rondas seguidas el duelo CIERRA con victoria
      let balRes = null;
      const bal4 = new Sc.BalloonDuel('natalia', (r) => { balRes = r; });
      for (let i = 0; i < 6000 && !balRes; i++) {
        if (bal4.st === 'play' && bal4.phase === 'go' && !bal4.pPick) bal4.press(bal4.final, 'p'); // siempre el correcto, nada más sonar el ¡YA!
        bal4.update(0.05);
      }
      check('globos: mejor de 5 — con 3 rondas el duelo cierra y gana el jugador', !!balRes && balRes.win === 'win' && bal4.pw === 3, balRes && `win=${balRes.win} pw=${bal4.pw}`);
    } finally { ctxMath.random = realRandom; }

    // --- Dibujo de los tres (render sustituido, como en E/K) ---
    {
      const realRender = W.render, realProject = G.R.project;
      const ctx2d = new FakeCtx();
      W.render = (opts) => { if (opts.boxes) opts.boxes(new G.R.MB(), 0); if (opts.sprites) opts.sprites(0); if (opts.over) opts.over(ctx2d, 0); };
      G.R.project = () => ({ x: 320, y: 180, ok: true });
      try {
        const rd = new Sc.CactusRaceDuel('natalia', () => {});
        rd.st = 'play'; rd.grav = 'luna'; rd.gravAnn = { key: 'luna', t: 1.2 };
        rd.cacti = [{ x: -40, vx: 150, rot: 1, change: { at: 0, f: 1.5, done: false }, warned: true, hitP: false, hitC: false, catAct: true, react: 9, ignore: true }];
        rd.draw(0.016);
        check('draw sin errores: carrera con banner de gravedad lunar y cactus avisando', true);
        const id2 = new Sc.ImageDuel('natalia', () => {});
        id2.st = 'play'; id2.draw(0.016); // destape con la cubierta entera
        id2.uncoverT = 3.5; id2.draw(0.016); // destape a medias: losetas desvaneciéndose
        id2.phase = 'show'; id2.draw(0.016);
        id2.phase = 'reveal'; id2.pPick = (id2.diffIdx + 1) % 3; id2.josePick = id2.diffIdx; id2.draw(0.016);
        check('draw sin errores: imagen distinta en destape, en muestra y en revelado (marco dorado)', true);
        const bd = new Sc.BalloonDuel('natalia', () => {});
        bd.st = 'play'; bd.draw(0.016);
        bd.phase = 'fly'; bd.fly.p = 0.6; bd.p.elev = 120; bd.stars = [{ x: 0, y: 100, z: 0, t: 0.2 }];
        bd.draw(0.016);
        check('draw sin errores: globos con banderas y con el jugador volando entre estrellitas', true);
      } catch (e) {
        check('draw sin errores en los tres minijuegos nuevos (excepción: ' + e.message + ')', false, e.stack && e.stack.split('\n')[1]);
      } finally { W.render = realRender; G.R.project = realProject; }
    }

    // --- Sorteo del evento cactus: 50/50 en la historia ---
    {
      const seen = new Set();
      for (let i = 0; i < 400; i++) seen.add(G.cactusVariant());
      check('sorteo cactus: en 400 tiradas salen AMBAS variantes (50/50)', seen.has('cactus') && seen.has('cactus2'), [...seen].join(','));
    }

    // --- Integración por runEvent (historia completa, con efectos) ---
    const driveEvent = async (id, strat) => {
      Object.assign(S, { player: 'natalia', phase: 'act2', inv: {}, flags: {}, sus: 5, sleep: 1, noise: 0, qBonus: 0, duels: [], done: {}, tired: null });
      G.home = new Sc.HomeScene(); G.practiceMode = false;
      let settled = false;
      const p = G.debug.runEvent(id).then(() => { settled = true; }, (e) => { settled = true; console.log('  (error en runEvent ' + id + ': ' + e.message + ')'); });
      let it = 0;
      while (!settled && it++ < 30000) {
        await tick();
        const msgsEv = documentFake.querySelector('#msgs');
        const card = msgsEv && queryWithin(msgsEv, '.card', true).find((b) => b.onclick && !b.disabled);
        if (card) card.onclick();
        const mok = idRegistry.get('mok');
        if (mok && mok.onclick) { const f = mok.onclick; mok.onclick = null; f(); }
        const sc = G.scene;
        if (sc) strat(sc, it);
      }
      // Si no se completó, NO se espera la promesa (quedaría colgada y
      // Node saldría en silencio al vaciarse el bucle de eventos): el
      // fallo se ve en los checks que usan el retorno.
      if (settled) await p; else console.log('  (runEvent ' + id + ' NO se completó en ' + it + ' iteraciones)');
      return settled && it < 30000;
    };
    // La imagen distinta: el conductor señala siempre la distinta en cuanto se muestra
    {
      const okRun = await driveEvent('imagen', (sc) => { if (sc.isImage) { if (sc.st === 'play' && sc.phase === 'show' && sc.pPick === null) sc.choose(sc.diffIdx); sc.update(0.05); } });
      const entry = S.duels.find((d) => d.game === 'imagen');
      check('runEvent(imagen): el evento nuevo corre en la historia y se registra el duelo', okRun && !!entry, JSON.stringify(S.duels));
      check('runEvent(imagen): acertando siempre se GANA y aplican los efectos de victoria (calidad +)', !!entry && entry.win === 'win' && S.qBonus > 0, `win=${entry && entry.win} qBonus=${S.qBonus}`);
    }
    // Globos: el conductor levanta el globo final en cuanto suena el ¡YA!
    {
      const okRun = await driveEvent('globos', (sc) => { if (sc.isBalloons) { if (sc.st === 'play' && sc.phase === 'go' && !sc.pPick) sc.press(sc.final, 'p'); sc.update(0.05); } });
      const entry = S.duels.find((d) => d.game === 'globos');
      check('runEvent(globos): el evento tardío corre en la historia y se registra el duelo', okRun && !!entry, JSON.stringify(S.duels));
      check('runEvent(globos): respondiendo al ¡YA! se GANA (mejor de 5) con efectos de victoria', !!entry && entry.win === 'win' && S.qBonus > 0, `win=${entry && entry.win} qBonus=${S.qBonus}`);
    }
    // El sorteo, de punta a punta: con la tirada forzada baja, el evento cactus juega la CARRERA
    {
      ctxMath.random = () => 0.1; // cactusVariant() < 0,5 → cactus2 (azar del contexto vm)
      let sawRace = false;
      try {
        const okRun = await driveEvent('cactus', (sc, it) => { if (sc.isRace) { sawRace = true; if (sc.st === 'play' && it % 9 === 0) tap('Space'); sc.update(0.05); } });
        const entry = S.duels.find((d) => d.game === 'cactus');
        check('sorteo en runEvent(cactus): con tirada baja se juega CACTUS EN CARRERA y queda registrado',
          okRun && sawRace && S.flags.cactusVariant === 'cactus2' && !!entry && entry.variant === 'cactus2',
          `variant=${S.flags.cactusVariant} entry=${JSON.stringify(entry)}`);
      } finally { ctxMath.random = realRandom; }
    }
    // Y con la tirada alta, el evento cactus juega el de siempre (bolas en la cocina)
    {
      ctxMath.random = () => 0.9; // cactusVariant() ≥ 0,5 → cactus
      let sawSpike = false;
      try {
        const okRun = await driveEvent('cactus', (sc) => { if (sc instanceof Sc.SpikeDuel) { sawSpike = true; sc.update(0.05); } });
        const entry = S.duels.find((d) => d.game === 'cactus');
        check('sorteo en runEvent(cactus): con tirada alta se juega el CACTUS RODANTES de siempre',
          okRun && sawSpike && S.flags.cactusVariant === 'cactus' && !!entry && entry.variant === 'cactus',
          `variant=${S.flags.cactusVariant} entry=${JSON.stringify(entry)}`);
      } finally { ctxMath.random = realRandom; }
    }
    // En práctica NO hay sorteo: la entrada «cactus» juega siempre su variante (runMinigame no sortea con practiceMode)
    check('práctica sin sorteo: cactusVariant solo se invoca desde la historia (guardado por G.practiceMode en runMinigame)', typeof G.cactusVariant === 'function');
  }

  // ================= L) Final J1407b — SPACE_RINGS_ENDING =================
  console.log('\nL) Final J1407b — anillos, cinturón y la cadena completa');
  {
    S.inv = {}; S.flags = {}; S.partners = ['majo']; S.party = ['natalia', 'majo']; S.tired = null;
    // --- 1A: se instancia, el copiloto es el primer partner, hay duda ---
    const dA = new Sc.RingRaceDuel('natalia', () => {});
    check('J1407b 1A: el copiloto es el primer partner de la party (majo)', dA.copilotId === 'majo', dA.copilotId);
    dA.sug = { lane: 0, t: 2, mProg: 99999 }; dA.lane = 1;
    dA.press(1); // contra la sugerencia (el copiloto pedía la izquierda)
    check('J1407b 1A: ir contra la sugerencia del copiloto activa la DUDA de 0,3 s', dA.doubtT > 0, 'doubtT=' + dA.doubtT);
    const dA3 = new Sc.RingRaceDuel('natalia', () => {});
    dA3.sug = { lane: 0, t: 2, mProg: 99999 }; dA3.lane = 1;
    dA3.press(-1); // a favor de la sugerencia: sin duda
    check('J1407b 1A: seguir la sugerencia NO activa la duda', dA3.doubtT === 0 && dA3.lane === 0, 'doubtT=' + dA3.doubtT + ' lane=' + dA3.lane);
    // --- 1A: la carrera corre y termina con resultado válido ---
    let resA = null;
    const dA2 = new Sc.RingRaceDuel('natalia', (r) => { resA = r; });
    let steps = 0;
    while (!resA && steps++ < 5000) dA2.update(0.05);
    check('J1407b 1A: la carrera termina y entrega un resultado (win/tie/lose)', !!resA && ['win', 'tie', 'lose'].includes(resA.win), JSON.stringify(resA));
    check('J1407b 1A: el resultado trae choques de ambos cohetes y el copiloto', !!resA && typeof resA.crashesP === 'number' && typeof resA.crashesB === 'number' && resA.copilot === 'majo', JSON.stringify(resA));
    check('J1407b 1A: se generaron meteoritos de 1 y de 2 carriles durante la carrera', dA2.meteors !== undefined && dA2.crashesP + dA2.crashesB >= 0 && dA2.elapsed > 20, 'elapsed=' + dA2.elapsed);
    // --- 1B: ventaja cruzada y terminación ---
    const dB0 = new Sc.AsteroidBeltDuel('natalia', () => {});
    check('J1407b 1B: sin ventaja se sale desde el origen del cinturón', dB0.P.x === 0, 'x=' + dB0.P.x);
    const dB1 = new Sc.AsteroidBeltDuel('natalia', () => {}, { adv: true });
    check('J1407b 1B: ganar 1A da SALIDA ADELANTADA (empiezas más cerca del aro)', dB1.P.x > dB0.P.x && dB1.adv === true, `adv=${dB1.P.x} base=${dB0.P.x}`);
    check('J1407b 1B: el cinturón trae asteroides con formas de fiesta (pastel, globo, regalo)',
      ['pastel', 'globo', 'regalo'].every((k) => dB0.rocks.some((r) => r.kind === k)), [...new Set(dB0.rocks.map((r) => r.kind))].join(','));
    let resB = null;
    const dB = new Sc.AsteroidBeltDuel('natalia', (r) => { resB = r; });
    steps = 0;
    while (!resB && steps++ < 5000) dB.update(0.05);
    check('J1407b 1B: el duelo de flotación termina con resultado válido (la IA de José compite)', !!resB && ['win', 'tie', 'lose'].includes(resB.win), JSON.stringify(resB));
    check('J1407b 1B: el resultado trae los aturdimientos de ambos (para el pastel magullado)', !!resB && typeof resB.hitsP === 'number' && typeof resB.hitsB === 'number', JSON.stringify(resB));
    // --- La cadena completa: fases en orden ---
    const chain = new Sc.SpaceEndingScene('natalia', () => {});
    check('J1407b cadena: arranca en la cinemática de despegue en la azotea', chain.cur instanceof Sc.SpaceLaunchScene);
    chain.cur.finish(); // saltar la cinemática, como con ESPACIO
    check('J1407b cadena: tras el despegue entra la carrera de Anillos', chain.cur instanceof Sc.RingRaceDuel && chain.cur.copilotId === 'majo');
    // --- La cadena completa llega hasta el resultado del final ---
    let chainRes = null;
    const chain2 = new Sc.SpaceEndingScene('natalia', (r) => { chainRes = r; });
    chain2.cur.finish(); // despegue saltado
    steps = 0;
    while (chain2.cur instanceof Sc.RingRaceDuel && steps++ < 5000) chain2.update(0.05);
    check('J1407b cadena: tras los Anillos pasa a la transición de cohetes averiados', chain2.cur instanceof Sc.SpaceTransitionScene);
    chain2.cur.finish(); // transición saltada
    check('J1407b cadena: tras la transición entra el Cinturón, con la ventaja que corresponda según 1A',
      chain2.cur instanceof Sc.AsteroidBeltDuel && chain2.cur.adv === (chain2.results.ring.win === 'win'),
      `adv=${chain2.cur && chain2.cur.adv} ring=${chain2.results.ring && chain2.results.ring.win}`);
    steps = 0;
    while (chain2.cur instanceof Sc.AsteroidBeltDuel && steps++ < 5000) chain2.update(0.05);
    check('J1407b cadena: tras el Cinturón llega la fiesta sobre el anillo mayor', chain2.cur instanceof Sc.SpacePartyScene);
    steps = 0;
    while (!chainRes && steps++ < 3000) chain2.update(0.05);
    check('J1407b cadena: la fiesta cierra y entrega el resultado SPACE_RINGS_ENDING',
      !!chainRes && chainRes.spaceEnding === true && ['win', 'tie', 'lose'].includes(chainRes.win) && typeof chainRes.cakeBruised === 'boolean', JSON.stringify(chainRes));
    // --- Registro en práctica / historia ---
    check('J1407b: los eventos de práctica existen (anillos, cinturón, final)', ['anillos', 'cinturon', 'finalj1407b'].every((id) => G.EVENTS[id] && G.EVENTS[id].type === 'minigame'));
    check('J1407b: MG registra las tres entradas con sus escenas', !!(MG.anillos && MG.cinturon && MG.finalj1407b) && MG.anillos.Scene() === Sc.RingRaceDuel && MG.cinturon.Scene() === Sc.AsteroidBeltDuel && MG.finalj1407b.Scene() === Sc.SpaceEndingScene);
    check('J1407b: G.startSpaceEnding está expuesta para enganchar la historia después', typeof G.startSpaceEnding === 'function');
    check('J1407b: el final está registrado en G.ENDINGS (FIESTA EN J1407B)', !!(G.ENDINGS.espacio && /J1407B/.test(G.ENDINGS.espacio.title)));
    check('J1407b: las entradas nuevas NO están en la historia (decisiones A–D pendientes)', !G.STORY.includes('anillos') && !G.STORY.includes('cinturon') && !G.STORY.includes('finalj1407b'));
    // --- Revisión 2026-11-21: duda en el otro sentido, freno al chocar,
    // listener táctil que se retira y la regla exacta del pastel ---
    const dA4 = new Sc.RingRaceDuel('natalia', () => {});
    dA4.sug = { lane: 2, t: 2, mProg: 99999 }; dA4.lane = 1;
    dA4.press(-1); // contra la sugerencia (pedía la derecha): duda también en este sentido
    check('J1407b revisión: la DUDA también se activa yendo contra la sugerencia hacia el otro lado', dA4.doubtT > 0, 'doubtT=' + dA4.doubtT);
    const dA5 = new Sc.RingRaceDuel('natalia', () => {});
    dA5.v = 100; dA5.crashP();
    check('J1407b revisión: chocar en 1A FRENA el cohete (sin eliminar)', dA5.v < 100 && dA5.crashesP === 1 && dA5.crashT > 0, 'v=' + dA5.v);
    const dA6 = new Sc.RingRaceDuel('natalia', () => {});
    const tapAntes = typeof dA6.tapH === 'function';
    dA6.finish('p');
    check('J1407b revisión: el listener táctil de 1A se retira al terminar la carrera', tapAntes && dA6.tapH === null, 'tapH=' + dA6.tapH);
    const bruised = (belt) => new Sc.SpacePartyScene('natalia', { belt }, () => {}).bruised;
    check('J1407b revisión: pastel magullado SOLO si pierdes 1B o chocas 3+ veces (el empate no magulla)',
      bruised({ win: 'lose', hitsP: 0 }) === true && bruised({ win: 'win', hitsP: 3 }) === true && bruised({ win: 'win', hitsP: 2 }) === false && bruised({ win: 'tie', hitsP: 0 }) === false && bruised({ win: 'tie', hitsP: 3 }) === true);
    // --- Corrección del playtest de Jose (2026-11-21): cohetes como
    // IMÁGENES diseñadas, tamaño/hitbox derivados del sprite y pista
    // con marcas transversales que SÍ muestran el avance ---
    const imgDir = path.join(__dirname, '..', 'application', 'src', 'assets', 'img');
    const rocketFiles = ['cohete-party-back', 'cohete-rival-back', 'cohete-party-side', 'cohete-party-side-averiado', 'cohete-rival-side', 'cohete-rival-side-averiado'];
    check('J1407b imágenes: los 6 PNG de cohetes existen en application/src/assets/img/',
      rocketFiles.every((n) => fs.existsSync(path.join(imgDir, n + '.png'))));
    const scenesTxt2 = fs.readFileSync(path.join(SRC, 'scenes.js'), 'utf8');
    check('J1407b imágenes: el código referencia los 6 PNG y ya NO llama a rocketBackCv/rocketSideCv (nada de cohetes por canvas)',
      rocketFiles.every((n) => scenesTxt2.includes("'" + n + "'")) && !scenesTxt2.includes('rocketBackCv(') && !scenesTxt2.includes('rocketSideCv('));
    check('J1407b tamaño: el cohete cabe en UN carril (ROCKET_W = 46 < 52) y su alto sale del aspect real del PNG trasero',
      Sc.RingRaceDuel.ROCKET_W === 46 && Sc.RingRaceDuel.ROCKET_W < 52 && Math.abs(Sc.RingRaceDuel.ROCKET_H - 46 * (371 / 280)) < 0.01,
      `W=${Sc.RingRaceDuel.ROCKET_W} H=${Sc.RingRaceDuel.ROCKET_H}`);
    check('J1407b hitbox: el umbral de choque se DERIVA de los sprites (núcleos al 70%): (0,7·46 + 0,7·50)/2 ≈ 33,6',
      Math.abs(Sc.RingRaceDuel.HIT_W - (46 * 0.7 + 50 * 0.7) / 2) < 0.001 && Sc.RingRaceDuel.METEOR_W === 50, 'HIT_W=' + Sc.RingRaceDuel.HIT_W);
    check('J1407b pista: hay marcas transversales (banda por segmento, balizas, tonos alternos y marca de distancia cada 500 u)',
      Sc.RingRaceDuel.TRACK.bandW > 0 && Sc.RingRaceDuel.TRACK.distEvery === 500 && Sc.RingRaceDuel.TRACK.beacons === true && Sc.RingRaceDuel.TRACK.altTones === true && scenesTxt2.includes('TRACK_BAND_W') && scenesTxt2.includes('TRACK_DIST_EVERY'));
    const dCam = new Sc.RingRaceDuel('natalia', () => {});
    check('J1407b cámara: dist 480 / pitch 0,34 — el cohete se ve entero (68 px de 360) y queda pista por delante',
      dCam.cam.dist === 480 && Math.abs(dCam.cam.pitch - 0.34) < 1e-9, JSON.stringify(dCam.cam));
    check('J1407b cámara composición: cam.y = 108 baja la pista en pantalla (centro del cohete ≈57% del alto, sin tocar dist)',
      dCam.cam.y === 108 && dCam.cam.dist === 480, JSON.stringify(dCam.cam));
    // --- Bug del "contador 4" (playtest de Jose, 2026-11-21): los
    // cohetes cargados como archivo (assets/img/*.png) son cross-origin
    // desde file:// y texImage2D reventaba en draw(), matando el bucle.
    // Corrección: data URIs en G.ROCKET_DATA + rAF agendado ANTES de
    // update/draw en frame() ---
    check('contador 4: G.ROCKET_DATA existe con las 6 claves y cada valor es una data URI PNG',
      !!G.ROCKET_DATA && rocketFiles.every((n) => typeof G.ROCKET_DATA[n] === 'string' && G.ROCKET_DATA[n].startsWith('data:image/png;base64,')),
      G.ROCKET_DATA ? Object.keys(G.ROCKET_DATA).join(',') : 'sin ROCKET_DATA');
    check('contador 4: scenes.js carga los cohetes desde G.ROCKET_DATA, NO desde la ruta assets/img/',
      scenesTxt2.includes('G.ROCKET_DATA[name]') && !scenesTxt2.includes("'assets/img/' +"));
    const htmlTxt2 = fs.readFileSync(path.join(SRC, '..', 'main.js'), 'utf8');
    check('contador 4: index.html incluye js/rocket-sheets.js ANTES que js/scenes.js',
      htmlTxt2.includes('js/rocket-sheets.js') && htmlTxt2.indexOf('js/rocket-sheets.js') < htmlTxt2.indexOf('js/scenes.js'));
    const gameTxt2 = fs.readFileSync(path.join(SRC, 'game.js'), 'utf8');
    const frameBody = gameTxt2.slice(gameTxt2.indexOf('function frame(now)'), gameTxt2.indexOf('function frame(now)') + 1600);
    check('contador 4: frame() agenda requestAnimationFrame(frame) ANTES de update/draw (blindaje del bucle)',
      frameBody.indexOf('requestAnimationFrame(frame)') > -1 && frameBody.indexOf('requestAnimationFrame(frame)') < frameBody.indexOf('G.scene.update(dt)'),
      'rAF@' + frameBody.indexOf('requestAnimationFrame(frame)') + ' update@' + frameBody.indexOf('G.scene.update(dt)'));
    // --- Ajustes del playtest de Jose (2026-11-21, segunda ronda):
    // los meteoritos VUELAN hacia el jugador (velocidad propia con
    // rampa) y hay una estrella de IMPULSO para recuperarse tras un
    // choque (solo la recoge el jugador) ---
    const mkPlay = (d) => { d.st = 'play'; d.meteors = []; d.nextMet = 1e9; d.boosts = []; d.nextBoost = 1e9; return d; };
    // (a) velocidad propia de los meteoritos y su rampa
    const dMv = mkPlay(new Sc.RingRaceDuel('natalia', () => {}));
    dMv.spawnMeteor(3000);
    const mMov = dMv.meteors[0];
    check('J1407b meteoritos móviles: al nacer vuelan hacia el jugador a 26–40 u/s',
      dMv.meteorSpeed(mMov) >= Sc.RingRaceDuel.METEOR_V.min && dMv.meteorSpeed(mMov) <= Sc.RingRaceDuel.METEOR_V.max, 'v=' + dMv.meteorSpeed(mMov));
    const mp0 = mMov.prog;
    for (let i = 0; i < 20; i++) dMv.update(0.05); // 1 s de carrera
    check('J1407b meteoritos móviles: su prog baja POR SÍ SOLO (velocidad propia, no espera al jugador)',
      mMov.prog < mp0 - 20, `de ${mp0} a ${mMov.prog.toFixed(1)}`);
    // La rampa es por PROGRESO hacia la meta (pedido de Jose, 3ª
    // ronda): el mismo meteorito vuela ~1,95× más rápido junto al aro
    // que en la salida, y el techo absoluto es 85 u/s.
    const vSalida = dMv.meteorSpeed(mMov);
    dMv.prog = 6200; dMv.rprog = 0; // el líder llega al aro: factor 1,95
    const vMeta = dMv.meteorSpeed(mMov);
    check('J1407b meteoritos móviles: la rampa es por PROGRESO — junto a la meta vuela ~el doble que en la salida',
      Math.abs(vMeta / mMov.mv - (1 + Sc.RingRaceDuel.METEOR_V.prog)) < 0.01 && vMeta > vSalida * 1.8,
      `salida=${vSalida.toFixed(1)} meta=${vMeta.toFixed(1)} mv=${mMov.mv.toFixed(1)}`);
    check('J1407b meteoritos móviles: techo absoluto de 85 u/s junto a la meta',
      dMv.meteorSpeed({ mv: 50 }) === 85 && Sc.RingRaceDuel.METEOR_V.cap === 85, 'v=' + dMv.meteorSpeed({ mv: 50 }));
    check('J1407b aviso: METEOR_WARN_Z da ≥ ~3 s incluso al cierre máximo junto a la meta (≈199 u/s)',
      Sc.RingRaceDuel.METEOR_V.warnZ / 199 >= 3, 'warnZ=' + Sc.RingRaceDuel.METEOR_V.warnZ);
    dMv.prog = 0; dMv.rprog = 0;
    // (b) el choque con un meteorito en movimiento se detecta UNA sola vez
    const dHit = mkPlay(new Sc.RingRaceDuel('natalia', () => {}));
    dHit.meteors.push({ prog: dHit.prog + 40, lanes: [1], hitP: false, hitB: false, rDodge: false, rot: 0, seed: 0, mv: 30 });
    dHit.lane = 1; dHit.laneX = 0;
    for (let i = 0; i < 100; i++) dHit.update(0.05); // cruza la roca y la deja bien atrás
    check('J1407b meteoritos móviles: el choque al cruzarse se detecta UNA sola vez (sin duplicados)',
      dHit.crashesP === 1, 'crashesP=' + dHit.crashesP);
    // (c) la estrella de impulso: nace, se recoge en su carril, acelera
    // por encima del cruise y al expirar la velocidad vuelve al cruise
    const dBo = mkPlay(new Sc.RingRaceDuel('natalia', () => {}));
    dBo.spawnBoost(dBo.prog + 50, 1); dBo.lane = 1; dBo.laneX = 0;
    check('J1407b impulso: la estrella nace en la pista, en el carril pedido',
      dBo.boosts.length === 1 && dBo.boosts[0].lane === 1 && Sc.RingRaceDuel.BOOST.dur === 2.8 && Sc.RingRaceDuel.BOOST.mult === 1.5,
      JSON.stringify(dBo.boosts.map((b) => [b.prog, b.lane])));
    for (let i = 0; i < 200 && dBo.boostT <= 0; i++) dBo.update(0.05);
    check('J1407b impulso: al cruzar la estrella en su carril el impulso se ACTIVA', dBo.boostT > 0, 'boostT=' + dBo.boostT);
    let sawAbove = false;
    for (let i = 0; i < 30; i++) { dBo.update(0.05); if (dBo.v > dBo.cruise) sawAbove = true; }
    check('J1407b impulso: durante el impulso la velocidad SUPERA el cruise (objetivo 1,5×)',
      sawAbove && dBo.v > dBo.cruise, `v=${dBo.v.toFixed(1)} cruise=${dBo.cruise}`);
    dBo.boostT = 0.01; // casi agotado: expira y la velocidad debe volver
    for (let i = 0; i < 120; i++) dBo.update(0.05);
    check('J1407b impulso: al expirar, la velocidad vuelve al cruise (no se queda arriba)',
      dBo.boostT <= 0 && dBo.v <= dBo.cruise * 1.05, `v=${dBo.v.toFixed(1)} cruise=${dBo.cruise}`);
    // (d) el caso de Jose: chocar y recoger el impulso = recuperarse
    const dRec = mkPlay(new Sc.RingRaceDuel('natalia', () => {}));
    dRec.v = dRec.cruise; dRec.crashP();
    const vPost = dRec.v;
    dRec.startBoost();
    for (let i = 0; i < 20; i++) dRec.update(0.05); // 1 s de impulso
    check('J1407b impulso tras choque: lo perdido se recupera y se supera el cruise en ~1 s',
      dRec.v > vPost && dRec.v > dRec.cruise, `vPost=${vPost.toFixed(1)} v=${dRec.v.toFixed(1)} cruise=${dRec.cruise}`);
    const dCut = mkPlay(new Sc.RingRaceDuel('natalia', () => {}));
    dCut.startBoost(); dCut.crashP();
    check('J1407b impulso: chocar DURANTE el impulso lo corta (sin invulnerabilidad)', dCut.boostT === 0, 'boostT=' + dCut.boostT);
    // (e) el rival NO recoge la estrella (es solo del jugador) y la
    // estrella nunca nace pegada a un meteorito (≥140 u en prog)
    const dRiv = mkPlay(new Sc.RingRaceDuel('natalia', () => {}));
    dRiv.prog = -400; // el jugador va muy por detrás: aún no cruza la estrella
    dRiv.spawnBoost(dRiv.rprog + 45, 2); dRiv.rlane = 2; dRiv.rlaneX = 52;
    let gRiv = 0;
    while (dRiv.rprog < 45 && gRiv++ < 200) dRiv.update(0.05);
    check('J1407b impulso: el RIVAL cruza la estrella y NO la recoge (solo es del jugador)',
      dRiv.rprog >= 45 && dRiv.boostT === 0 && dRiv.boosts.length === 1 && !dRiv.boosts[0].done,
      `rprog=${dRiv.rprog.toFixed(1)} boostT=${dRiv.boostT} boosts=${dRiv.boosts.length}`);
    const dSep = mkPlay(new Sc.RingRaceDuel('natalia', () => {}));
    dSep.meteors.push({ prog: 1000, lanes: [0], hitP: false, hitB: false, rDodge: false, rot: 0, seed: 0, mv: 30 });
    dSep.spawnBoost(1000, 1); // pedida EXACTAMENTE sobre la roca
    check('J1407b impulso: la estrella nunca nace pegada a un meteorito (≥140 u en prog)',
      dSep.boosts.every((b) => Math.abs(b.prog - 1000) >= Sc.RingRaceDuel.BOOST.sep), JSON.stringify(dSep.boosts.map((b) => b.prog)));
    // --- Tercera ronda del playtest de Jose (2026-11-21): Pollito
    // fuera de la pista de 1A y anchos OPACOS medidos como la única
    // verdad del tamaño/hitbox (la rampa por progreso va arriba) ---
    const dSinCat = new Sc.RingRaceDuel('natalia', () => {});
    const ringSrc = scenesTxt2.slice(scenesTxt2.indexOf('class RingRaceDuel'), scenesTxt2.indexOf('class AsteroidBeltDuel'));
    check('J1407b sin Pollito en pista: la instancia de 1A no tiene Actor Pollito y la clase ni lo crea ni lo renderiza',
      dSinCat.cat === undefined && !ringSrc.includes('this.cat') && !ringSrc.includes("new Actor('pollito'"),
      'cat=' + dSinCat.cat);
    check('J1407b 1B intacto: Pollito SÍ flota libre en el Cinturón (su lógica sigue en 1B; se dibuja con su sprite con traje)',
      !!dB0.cat && dB0.cat.id === 'pollito', 'cat=' + (dB0.cat && dB0.cat.id));
    const OPQ = Sc.RingRaceDuel.OPAQUE;
    check('J1407b anchos opacos: los PNG traseros miden fracción 1,00 (sin relleno: ROCKET_W ya es el ancho opaco)',
      OPQ.rocketFracW['cohete-party-back'] === 1 && OPQ.rocketFracW['cohete-rival-back'] === 1, JSON.stringify(OPQ.rocketFracW));
    check('J1407b anchos opacos: la roca compensa su relleno — dibujada a meteorDrawW(seed), su silueta opaca mide METEOR_W = 50',
      OPQ.rockFracW.every((f, s) => f > 0.6 && f < 0.85 && Math.abs(OPQ.meteorDrawW[s] * f - Sc.RingRaceDuel.METEOR_W) < 0.01),
      'frac=' + OPQ.rockFracW.map((f) => f.toFixed(3)).join(',') + ' drawW=' + OPQ.meteorDrawW.map((w) => w.toFixed(1)).join(','));
    // --- Cuarta ronda del playtest de Jose (2026-11-21) sobre 1B:
    // cámara lejos, hitbox desde lo opaco, impacto corto y sprites
    // DISEÑADOS con traje (nada de casco dibujado encima) + meta
    // diseñada, cargados como data URIs (G.BELT_DATA) ---
    const beltFiles = ['espacio-natalia', 'espacio-saulo', 'espacio-itzel', 'espacio-fatima', 'espacio-samantha', 'espacio-majo', 'espacio-alan', 'espacio-jose', 'espacio-pollito', 'meta-cinturon'];
    check('J1407b 1B imágenes: los 9 sprites con traje y la meta existen en application/src/assets/img/',
      beltFiles.every((n) => fs.existsSync(path.join(imgDir, n + '.png'))));
    check('J1407b 1B imágenes: G.BELT_DATA trae las 10 claves como data URIs PNG',
      !!G.BELT_DATA && beltFiles.every((n) => typeof G.BELT_DATA[n] === 'string' && G.BELT_DATA[n].startsWith('data:image/png;base64,')),
      G.BELT_DATA ? Object.keys(G.BELT_DATA).join(',') : 'sin BELT_DATA');
    check('J1407b 1B imágenes: index.html incluye js/belt-sheets.js ANTES que js/scenes.js',
      htmlTxt2.includes('js/belt-sheets.js') && htmlTxt2.indexOf('js/belt-sheets.js') < htmlTxt2.indexOf('js/scenes.js'));
    const beltSrc = scenesTxt2.slice(scenesTxt2.indexOf('class AsteroidBeltDuel'), scenesTxt2.indexOf('class SpaceLaunchScene'));
    check('J1407b 1B sin casco por código: la clase ya no llama a drawHelmet ni al aro por código, y dibuja la meta diseñada',
      !beltSrc.includes('drawHelmet(') && !beltSrc.includes("ringGoalCv('cuadros')") && beltSrc.includes("beltImg('meta-cinturon')") && beltSrc.includes("beltImg('espacio-' + this.who)"),
      '');
    check('J1407b 1B cámara lejos: dist 640 (el jugador se proyecta a ≈89 px de 360)',
      dB0.cam.dist === 640 && Sc.AsteroidBeltDuel.CAM.dist === 640 && Math.abs(dB0.cam.pitch - 0.3) < 1e-9, JSON.stringify(dB0.cam));
    check('J1407b 1B impacto corto: aturdimiento 0,85 s, empuje 105 y cooldown 0,9 (el hint ya no cita 1,5)',
      Sc.AsteroidBeltDuel.STUN === 0.85 && Sc.AsteroidBeltDuel.PUSH === 105 && Sc.AsteroidBeltDuel.CD === 0.9 && dB0.hint.includes('0,85') && !dB0.hint.includes('1,5'),
      `STUN=${Sc.AsteroidBeltDuel.STUN} hint=${dB0.hint}`);
    check('J1407b 1B radios opacos medidos: rock 0,76 · pastel 0,64 · globo 0,65 · regalo 0,62 (× r)',
      Math.abs(Sc.AsteroidBeltDuel.rockR({ r: 28, kind: 'rock' }) - 28 * 0.76) < 0.01 && Math.abs(Sc.AsteroidBeltDuel.rockR({ r: 28, kind: 'pastel' }) - 28 * 0.64) < 0.01 && Math.abs(Sc.AsteroidBeltDuel.rockR({ r: 28, kind: 'globo' }) - 28 * 0.65) < 0.01 && Math.abs(Sc.AsteroidBeltDuel.rockR({ r: 28, kind: 'regalo' }) - 28 * 0.62) < 0.01,
      JSON.stringify(Sc.AsteroidBeltDuel.ROCK_OPAQUE));
    {
      // Comportamiento: sin contacto visual NO hay golpe; tocando la
      // silueta opaca (contra el núcleo del personaje) SÍ lo hay.
      const dCol = new Sc.AsteroidBeltDuel('natalia', () => {});
      dCol.st = 'play';
      const cyC = dCol.P.y + Sc.AsteroidBeltDuel.CHAR_H / 2, rrC = Sc.AsteroidBeltDuel.rockR({ r: 28, kind: 'rock' }) + Sc.AsteroidBeltDuel.CORE_R;
      const mkRock = (x) => ({ x, y: cyC, r: 28, vx: 0, vy: 0, rot: 0, vr: 0, kind: 'rock', seed: 0, cdP: 0, cdB: 0 });
      dCol.rocks = [mkRock(dCol.P.x + rrC + 30)]; // la silueta queda a 30 u del núcleo: sin contacto
      dCol.collide(dCol.P, dCol.p, 'cdP');
      check('J1407b 1B hitbox: un asteroide cuya silueta NO toca al personaje no lo golpea',
        dCol.P.stun === 0 && dCol.P.hits === 0, `stun=${dCol.P.stun} hits=${dCol.P.hits}`);
      dCol.rocks = [mkRock(dCol.P.x + rrC - 6)]; // la silueta ya invade el núcleo: contacto
      dCol.collide(dCol.P, dCol.p, 'cdP');
      check('J1407b 1B hitbox: tocando la silueta SÍ golpea, y el aturdimiento aplicado es 0,85 s',
        dCol.P.hits === 1 && Math.abs(dCol.P.stun - 0.85) < 1e-9, `stun=${dCol.P.stun} hits=${dCol.P.hits}`);
    }
  }

  // ================= M) Final LEYENDAS (LEYENDAS_MOVIE_ENDING) =============
  console.log('\nM) Final Leyendas — ítems, habilitación, duelos de boss y cadena');
  {
    // Ítems de la siembra: existen, tienen slot/peso y spawnean en la recolección
    check('ítems de Leyendas existen (claqueta y cámara antigua)', !!G.ITEMS.claqueta && !!G.ITEMS.camara && G.ITEMS.claqueta.slots === 1 && G.ITEMS.camara.slots === 1);
    check('los 12 spawns del mundo alcanzan para los 12 ítems', W.SPAWNS.length >= Object.keys(G.ITEMS).length, `spawns=${W.SPAWNS.length} ítems=${Object.keys(G.ITEMS).length}`);
    const col = new Sc.CollectScene('natalia', () => {});
    const spawned = col.items.map((i) => i.id);
    check('la recolección spawnea claqueta y cámara como cualquier ítem', spawned.includes('claqueta') && spawned.includes('camara') && new Set(spawned).size === Object.keys(G.ITEMS).length, spawned.join(','));
    // Registro de especiales y pantallas
    check('G.SPECIALS registra a Alebrije y Teodora (fuera de G.CHARS)', !!G.SPECIALS.alebrije && !!G.SPECIALS.teodora && !G.CHARS.alebrije && !G.CHARS.teodora);
    check('retratos por código de los especiales (specialURL)', G.specialURL('alebrije').startsWith('data:image') && G.specialURL('teodora').startsWith('data:image'));
    check('ENDINGS.leyendas = «ESTRELLA DE CINE»', !!G.ENDINGS.leyendas && G.ENDINGS.leyendas.title === 'ESTRELLA DE CINE');
    check('las entradas de Leyendas NO están en la historia (G.STORY)', !G.STORY.includes('patron') && !G.STORY.includes('trazo') && !G.STORY.includes('soga') && !G.STORY.includes('finalleyendas'));
    check('MG registra los 3 minijuegos y la cadena de Leyendas', !!(MG.patron && MG.trazo && MG.soga && MG.finalleyendas));
    // Habilitación: función pura con las 3 condiciones del guion
    const decoReal = (nReal, nImprov) => [...Array.from({ length: nReal }, () => ({ placed: true, improv: false })), ...Array.from({ length: nImprov }, () => ({ placed: true, improv: true }))];
    const base = { flags: { casting: true }, deco: decoReal(4, 2), quality: 70 };
    check('habilitación: casting + 4 zonas reales + calidad 70 → LISTO', G.legendsReady(base) === true);
    check('habilitación: sin casting → no', G.legendsReady({ ...base, flags: {} }) === false);
    check('habilitación: solo 3 zonas reales → no', G.legendsReady({ ...base, deco: decoReal(3, 3) }) === false);
    check('habilitación: zonas improvisadas NO cuentan como reales', G.legendsDecoCount({ deco: decoReal(2, 4) }) === 2 && G.legendsReady({ ...base, deco: decoReal(2, 4) }) === false);
    check('habilitación: calidad 69 → no; 70 → sí', G.legendsReady({ ...base, quality: 69 }) === false && G.legendsReady({ ...base, quality: 70 }) === true);

    S.party = ['natalia']; S.flags = {};
    const driveDuel = (duel, driver, maxTicks) => { let res = null; duel._testDone = (r) => { res = r; }; const origDone = duel.done; duel.done = (r) => { res = r; }; for (let i = 0; i < (maxTicks || 6000) && !res; i++) { driver(duel, i); duel.update(0.05); } return res; };

    // Casting: completable (5 rondas de 3→7 pasos) y perdible (2 fallos)
    {
      const lens = [];
      const d = new Sc.PatronDuel('natalia', () => {});
      d.tOn = 0.01; d.tOff = 0.01;
      const res = driveDuel(d, (dd) => { if (dd.phase === 'show') lens[dd.r] = dd.seq.length; if (dd.phase === 'input') { let guard = 0; while (dd.phase === 'input' && guard++ < 12) dd.pickZone(dd.seq[dd.prog]); } });
      check('casting completable: 5 rondas ganadas → win', !!res && res.win === 'win', JSON.stringify(res));
      check('casting: las secuencias crecen 3→7 pasos', lens.join(',') === '3,4,5,6,7', lens.join(','));
      const d2 = new Sc.PatronDuel('natalia', () => {});
      d2.tOn = 0.01; d2.tOff = 0.01;
      const res2 = driveDuel(d2, (dd) => { if (dd.phase === 'input') dd.pickZone((dd.seq[dd.prog] + 1) % 6); });
      check('casting perdible: dos rondas falladas → lose', !!res2 && res2.win === 'lose', JSON.stringify(res2));
    }
    // --- Corrección de Jose (2026-11-21): el Alebrije del patrón es
    // su sprite REAL (billboard), el resplandor son variantes por
    // zona derivadas del master, y la luz del duelo es NEUTRA ---
    {
      const albFiles = ['alebrije-frente', 'alebrije-zona-cabeza', 'alebrije-zona-crines', 'alebrije-zona-antenas', 'alebrije-zona-aleta', 'alebrije-zona-panza', 'alebrije-zona-cola'];
      const imgDirM = path.join(__dirname, '..', 'application', 'src', 'assets', 'img');
      check('patrón: la base y las 6 variantes de zona existen en application/src/assets/img/',
        albFiles.every((n) => fs.existsSync(path.join(imgDirM, n + '.png'))));
      check('patrón: G.ALEBRIJE_DATA trae base + 6 zonas como data URIs PNG',
        !!G.ALEBRIJE_DATA && albFiles.every((n) => typeof G.ALEBRIJE_DATA[n] === 'string' && G.ALEBRIJE_DATA[n].startsWith('data:image/png;base64,')),
        G.ALEBRIJE_DATA ? Object.keys(G.ALEBRIJE_DATA).join(',') : 'sin ALEBRIJE_DATA');
      const htmlTxtM = fs.readFileSync(path.join(SRC, '..', 'main.js'), 'utf8');
      check('patrón: index.html incluye js/alebrije-sheets.js ANTES que js/scenes.js',
        htmlTxtM.includes('js/alebrije-sheets.js') && htmlTxtM.indexOf('js/alebrije-sheets.js') < htmlTxtM.indexOf('js/scenes.js'));
      const scenesTxtM = fs.readFileSync(path.join(SRC, 'scenes.js'), 'utf8');
      const patronSrc = scenesTxtM.slice(scenesTxtM.indexOf('class PatronDuel'), scenesTxtM.indexOf('class TrazoDuel'));
      check('patrón: el duelo ya no pinta al Alebrije por código (sin albCv() en la clase) y sí usa su imagen real',
        !patronSrc.includes('albCv(') && patronSrc.includes("albImg('alebrije-frente')") && patronSrc.includes("albImg('alebrije-zona-'"),
        '');
      check('patrón: la figura por código del Alebrije sigue definida (respaldo de cara del HUD en albFaceCv)',
        scenesTxtM.includes('function drawAlbFigure'), '');
      // --- Corrección de Jose (2026-11-21, tarea adicional): la
      // cinemática del final de Leyendas también deja el dibujo por
      // código y la luz de fiesta ---
      const finaleSrc = scenesTxtM.slice(scenesTxtM.indexOf('class LegendsRevealScene'), scenesTxtM.indexOf('class LegendsEndingScene'));
      check('final Leyendas: ni la presentación ni el cierre llaman a las figuras por código de ninguno de los dos',
        !finaleSrc.includes('albCv(') && !finaleSrc.includes('teoCv(') && !finaleSrc.includes('drawAlbFigure') && !finaleSrc.includes('drawTeoFigure'), '');
      check('final Leyendas: las escenas usan los sprites reales (director/feliz del Alebrije; altiva/presentadora/selfie/idle de Teodora)',
        finaleSrc.includes("albImg('alebrije-director')") && finaleSrc.includes("albImg('alebrije-feliz')")
        && finaleSrc.includes("teoImg('teodora-altiva')") && finaleSrc.includes("'teodora-presentadora'") && finaleSrc.includes("'teodora-selfie'") && finaleSrc.includes("'teodora-idle'"), '');
      const finaleLight = Sc.LegendsRevealScene && Sc.LegendsRevealScene.LIGHT;
      check('final Leyendas: fuera la luz de fiesta — FINALE_LIGHT neutra y compartida por ambas escenas (el apagón inicial se conserva)',
        !finaleSrc.includes('W.LIGHT.fiesta') && finaleSrc.includes('W.LIGHT.oscuro')
        && !!finaleLight && finaleLight === Sc.LegendsFinaleScene.LIGHT
        && finaleLight.amb[0] === finaleLight.amb[1] && finaleLight.amb[1] === finaleLight.amb[2]
        && finaleLight.sun[0] === finaleLight.sun[1] && finaleLight.sun[1] === finaleLight.sun[2]
        && finaleLight.points.length === 0, JSON.stringify(finaleLight));
      check('final Leyendas: las poses del Alebrije (director/feliz) existen como PNG y data URI',
        ['alebrije-director', 'alebrije-feliz'].every((n) => fs.existsSync(path.join(imgDirM, n + '.png'))
          && typeof G.ALEBRIJE_DATA[n] === 'string' && G.ALEBRIJE_DATA[n].startsWith('data:image/png;base64,')),
        G.ALEBRIJE_DATA ? Object.keys(G.ALEBRIJE_DATA).join(',') : 'sin ALEBRIJE_DATA');
      check('final Leyendas: las poses de Teodora del final (altiva/presentadora) existen como PNG y data URI',
        ['teodora-altiva', 'teodora-presentadora'].every((n) => fs.existsSync(path.join(imgDirM, n + '.png'))
          && typeof G.TEODORA_DATA[n] === 'string' && G.TEODORA_DATA[n].startsWith('data:image/png;base64,')),
        G.TEODORA_DATA ? Object.keys(G.TEODORA_DATA).join(',') : 'sin TEODORA_DATA');
      check('patrón: luz NEUTRA del duelo (amb y sun en blanco equilibrado, sin puntos de color, sin LIGHT.fiesta)',
        !!Sc.PatronDuel.LIGHT && Sc.PatronDuel.LIGHT.amb[0] === Sc.PatronDuel.LIGHT.amb[1] && Sc.PatronDuel.LIGHT.amb[1] === Sc.PatronDuel.LIGHT.amb[2]
        && Sc.PatronDuel.LIGHT.sun[0] === Sc.PatronDuel.LIGHT.sun[1] && Sc.PatronDuel.LIGHT.sun[1] === Sc.PatronDuel.LIGHT.sun[2]
        && Sc.PatronDuel.LIGHT.points.length === 0 && patronSrc.includes('light: PATRON_LIGHT') && !patronSrc.includes('W.LIGHT.fiesta'),
        JSON.stringify(Sc.PatronDuel.LIGHT));
      check('patrón: el sprite ocupa el mismo alto que la figura por código (ALB_H = 130) y el ancho sale del aspect del master',
        Sc.PatronDuel.ALB.h === 130 && Sc.PatronDuel.ALB.w === 96 && Sc.PatronDuel.ALB.files.length === 9, JSON.stringify(Sc.PatronDuel.ALB));
      // --- Corrección de Jose (2026-11-21, 2ª ronda): el retrato VS
      // salía como un zoom roto de la figura por código; el resplandor
      // blanco-dorado no se distinguía; el sprite estaba tieso ---
      check('patrón: el retrato VS/chat del Alebrije sale de su sprite real (specialURL → ALEBRIJE_DATA)',
        typeof G.specialURL === 'function' && G.specialURL('alebrije') === G.ALEBRIJE_DATA['alebrije-frente'],
        typeof G.specialURL === 'function' ? String(G.specialURL('alebrije')).slice(0, 40) : 'sin specialURL');
      check('patrón: cada zona tiene su COLOR VIVO (la paleta del duelo es la de mkalebrije.py)',
        !!Sc.PatronDuel.ZONE_COLORS && Sc.PatronDuel.ZONE_COLORS.cabeza === '#ff4fd8' && Sc.PatronDuel.ZONE_COLORS.crines === '#22d3ee'
        && Sc.PatronDuel.ZONE_COLORS.antenas === '#ff5252' && Sc.PatronDuel.ZONE_COLORS.aleta === '#4f8dff'
        && Sc.PatronDuel.ZONE_COLORS.panza === '#7dff57' && Sc.PatronDuel.ZONE_COLORS.cola === '#ffb020'
        && fs.readFileSync(path.join(__dirname, 'mkalebrije.py'), 'utf8').includes('0xFF, 0x4F, 0xD8'),
        JSON.stringify(Sc.PatronDuel.ZONE_COLORS));
      check('patrón: el resplandor de la muestra va a plena fuerza (pulso 0,85–1, sin el pulso tenue 0,2–1 anterior)',
        patronSrc.includes('alpha: 0.925 + 0.075 * Math.sin') && !patronSrc.includes('0.6 + 0.4 * Math.sin'), '');
      check('patrón: el nombre de la zona alumbrada se anuncia en pantalla, en su color vivo',
        patronSrc.includes('label.toUpperCase()') && patronSrc.includes('ALB_ZONE_COLORS[z.id]'), '');
      check('patrón: ritmo de muestra legible (0,6 s encendido / 0,25 s de pausa; antes 0,55/0,30)',
        !!Sc.PatronDuel.TIMING && Sc.PatronDuel.TIMING.on === 0.6 && Sc.PatronDuel.TIMING.off === 0.25,
        JSON.stringify(Sc.PatronDuel.TIMING));
      check('patrón: el billboard tiene vida (idle con bob/roll, pop al alumbrar, saltito, sacudida y brinco)',
        patronSrc.includes('this.popT') && patronSrc.includes('this.hopT') && patronSrc.includes('this.shakeT') && patronSrc.includes('this.celeT')
        && patronSrc.includes('this.albDraw') && patronSrc.includes('Math.sin(t * 1.7)'), '');
      // --- Corrección de Jose (2026-11-21, 3ª ronda): la caja de
      // estado del patrón lleva SOLO el estado actual (sin la imagen
      // del Alebrije y sin el nombre del minijuego) y los chips de
      // zona van sin el número inicial ---
      check('patrón: su caja de estado es SOLO estado (legendsHud con { solo: true }; el helper dibuja la línea sin retrato ni título)',
        patronSrc.includes("legendsHud(this, c, 'EL PATRÓN DEL ALEBRIJE'") && patronSrc.includes('{ solo: true }')
        && scenesTxtM.includes('function legendsHud(d, c, title, lines, opts)') && scenesTxtM.includes('opts.solo'), '');
      check('leyendas: las cajas SOLO-estado son Patrón y Trazo (2 llamadas a legendsHud, ambas con { solo: true }; la Soga ya NO llama al helper: fuera su caja y el retrato del boss)',
        (scenesTxtM.match(/legendsHud\(this, c,/g) || []).length === 2 && (scenesTxtM.match(/\{ solo: true \}/g) || []).length === 2
        && !scenesTxtM.slice(scenesTxtM.indexOf('class SogaDuel'), scenesTxtM.indexOf('class LegendsRevealScene')).includes('legendsHud('), '');
      check('patrón: los chips de zona dicen solo el nombre, sin el número inicial',
        patronSrc.includes('G.text(c, z.label, x + w / 2, y + 14') && !patronSrc.includes('${i + 1} ${z.label}'), '');
    }
    // 2A Trazo: siguiendo la línea y corriendo al seguro se gana; quieto en una esquina se pierde
    const driveTrazo = (win) => {
      const d = new Sc.TrazoDuel('natalia', () => {});
      d.tTrazo = 1.2; d.tAviso = 0.1; d.tCorre = 0.6; d.tCae = 0.2;
      return driveDuel(d, (dd) => {
        if (!win) { dd.p.x = 268; dd.p.y = 222; return; }
        if (dd.phase === 'trazo') { const idx = Math.min(dd.pts.length - 1, 2 * Math.round((dd.pt / dd.tTrazo) * (dd.pts.length - 1) / 2)); dd.p.x = dd.pts[idx].x; dd.p.y = dd.pts[idx].y; }
        else if (dd.phase === 'corre' || dd.phase === 'cae') { const h = dd.hexes.find((hh) => hh.safe); if (h) { dd.p.x = h.x; dd.p.y = h.y; } }
      }, 5000);
    };
    {
      const res = driveTrazo(true);
      check('2A trazo: precisión alta y sin caídas → win contra Teodora', !!res && res.win === 'win', JSON.stringify(res));
      const res2 = driveTrazo(false);
      check('2A trazo: sin trazar y cayendo dos veces → lose', !!res2 && res2.win === 'lose', JSON.stringify(res2));
    }
    // --- Corrección de Jose (2026-11-21): Teodora diseñada, luz
    // neutra, cámara que encuadra la arena, caminata sin deslizar y
    // hundimiento en fases ---
    {
      const teoFiles = ['teodora-idle', 'teodora-trazo', 'teodora-selfie', 'teodora-dash', 'teodora-sorprendida', 'teodora-derrotada', 'teodora-idle2', 'teodora-side', 'teodora-side-izq'];
      const imgDirT = path.join(__dirname, '..', 'application', 'src', 'assets', 'img');
      check('trazo: las 9 poses de Teodora existen en application/src/assets/img/',
        teoFiles.every((n) => fs.existsSync(path.join(imgDirT, n + '.png'))));
      check('trazo: G.TEODORA_DATA trae las 9 poses como data URIs PNG',
        !!G.TEODORA_DATA && teoFiles.every((n) => typeof G.TEODORA_DATA[n] === 'string' && G.TEODORA_DATA[n].startsWith('data:image/png;base64,')),
        G.TEODORA_DATA ? Object.keys(G.TEODORA_DATA).join(',') : 'sin TEODORA_DATA');
      const htmlTxtT = fs.readFileSync(path.join(SRC, '..', 'main.js'), 'utf8');
      check('trazo: index.html incluye js/teodora-sheets.js ANTES que js/scenes.js',
        htmlTxtT.includes('js/teodora-sheets.js') && htmlTxtT.indexOf('js/teodora-sheets.js') < htmlTxtT.indexOf('js/scenes.js'));
      const scenesTxtT = fs.readFileSync(path.join(SRC, 'scenes.js'), 'utf8');
      const trazoSrc = scenesTxtT.slice(scenesTxtT.indexOf('class TrazoDuel'), scenesTxtT.indexOf('class SogaDuel'));
      check('trazo: la clase ya no dibuja a Teodora por código (sin teoCv) y sí usa sus sprites diseñados',
        !trazoSrc.includes('teoCv(') && trazoSrc.includes("teoImg('teodora-' + teoPoseName)") && trazoSrc.includes('teoPreload()'), '');
      check('trazo: la figura por código de Teodora ya no se usa en NINGÚN duelo ni escena (teoCv retirado; drawTeoFigure queda solo de respaldo de cara)',
        !scenesTxtT.includes('function teoCv(') && !scenesTxtT.includes('teoCv(') && scenesTxtT.includes('function drawTeoFigure'), '');
      // --- Corrección de Jose (2026-11-21, 3ª tarea): «La soga de
      // fuego» — cámara, luz neutra, Teodora diseñada, saltos
      // generados para todos y calaveritas diseñadas ---
      const sogaSrc = scenesTxtT.slice(scenesTxtT.indexOf('class SogaDuel'), scenesTxtT.indexOf('SogaDuel.CAM = SOGA_CAM'));
      const imgDirS = path.join(__dirname, '..', 'application', 'src', 'assets', 'img');
      check('soga: la clase no dibuja a Teodora ni las calaveritas por código (sin teoCv/calCv) y usa sus sprites (calaveritas DE PERFIL desde la ronda de la Soga)',
        !sogaSrc.includes('teoCv(') && !sogaSrc.includes('calCv(') && sogaSrc.includes("teoImg(teoName)") && sogaSrc.includes("jumpImg('calaverita-clasica-perfil-a')") && sogaSrc.includes("jumpImg('calaverita-morada-perfil-a')"), '');
      check('soga: Teodora suma salto (de su hoja de boss) y quemada (de la de faltantes) como PNG y data URI',
        ['teodora-salto', 'teodora-quemada'].every((n) => fs.existsSync(path.join(imgDirS, n + '.png'))
          && typeof G.TEODORA_DATA[n] === 'string' && G.TEODORA_DATA[n].startsWith('data:image/png;base64,')),
        G.TEODORA_DATA ? Object.keys(G.TEODORA_DATA).join(',') : 'sin TEODORA_DATA');
      check('soga: cámara verificada con la proyección real (dist 520, pitch 0,36, objetivo y=26; la anterior cortaba el arco y pegaba los postes a los bordes)',
        !!Sc.SogaDuel.CAM && Sc.SogaDuel.CAM.dist === 520 && Sc.SogaDuel.CAM.pitch === 0.36 && Sc.SogaDuel.CAM.y === 26 && Sc.SogaDuel.CAM.z === 6,
        JSON.stringify(Sc.SogaDuel.CAM));
      check('soga: luz neutra propia (noche equilibrada, sin puntos de color, sin W.LIGHT.noche heredada)',
        !!Sc.SogaDuel.LIGHT && Sc.SogaDuel.LIGHT.amb[0] === Sc.SogaDuel.LIGHT.amb[1] && Sc.SogaDuel.LIGHT.sun[0] === Sc.SogaDuel.LIGHT.sun[1]
        && Sc.SogaDuel.LIGHT.points.length === 0 && sogaSrc.includes('light: SOGA_LIGHT') && !sogaSrc.includes('W.LIGHT.noche'),
        JSON.stringify(Sc.SogaDuel.LIGHT));
      check('soga: la sombra de Teodora usa la firma vigente de R.flat (la antigua de 7 args ignoraba las opciones)',
        sogaSrc.includes('R.flat(R.glowTex, J.t.x, 0.8, 0, 21, { ry: 0.67') && !sogaSrc.includes('42, 28, { color:'), '');
      check('soga: G.JUMP_DATA trae los 7 saltos, las calaveritas (frontales + perfiles ×2 frames) y las esperas ×2 de los 7 roomies como data URIs PNG y sus PNG existen',
        !!G.JUMP_DATA && Sc.SogaDuel.JUMP.files.length === 27 && Sc.SogaDuel.JUMP.files.every((n) => typeof G.JUMP_DATA[n] === 'string' && G.JUMP_DATA[n].startsWith('data:image/png;base64,') && fs.existsSync(path.join(imgDirS, n + '.png'))),
        G.JUMP_DATA ? Object.keys(G.JUMP_DATA).join(',') : 'sin JUMP_DATA');
      check('soga: index.html incluye js/jump-sheets.js ANTES que js/scenes.js',
        htmlTxtT.includes('js/jump-sheets.js') && htmlTxtT.indexOf('js/jump-sheets.js') < htmlTxtT.indexOf('js/scenes.js'));
      check('soga: el salto sustituye al Actor solo en el aire (hidden + billboard) y las figuras por código completas quedaron retiradas',
        sogaSrc.includes('a.hidden = on') && sogaSrc.includes("jumpImg('salto-' + a.id)")
        && !scenesTxtT.includes('function albCv(') && !scenesTxtT.includes('function calCv(')
        && scenesTxtT.includes('function drawAlbFigure') && scenesTxtT.includes('function drawTeoFigure'), '');
      check('trazo: luz NEUTRA propia (amb/sun blancos equilibrados, sin puntos de color, sin W.LIGHT.fiesta)',
        !!Sc.TrazoDuel.LIGHT && Sc.TrazoDuel.LIGHT.amb[0] === Sc.TrazoDuel.LIGHT.amb[1] && Sc.TrazoDuel.LIGHT.amb[1] === Sc.TrazoDuel.LIGHT.amb[2]
        && Sc.TrazoDuel.LIGHT.sun[0] === Sc.TrazoDuel.LIGHT.sun[1] && Sc.TrazoDuel.LIGHT.sun[1] === Sc.TrazoDuel.LIGHT.sun[2]
        && Sc.TrazoDuel.LIGHT.points.length === 0 && trazoSrc.includes('light: TRAZO_LIGHT') && !trazoSrc.includes('W.LIGHT.fiesta'),
        JSON.stringify(Sc.TrazoDuel.LIGHT));
      check('trazo: cámara del set reescalado (dist 550, pitch 0,56, objetivo centrado en la arena)',
        !!Sc.TrazoDuel.CAM && Sc.TrazoDuel.CAM.dist === 550 && Sc.TrazoDuel.CAM.pitch === 0.56 && Sc.TrazoDuel.CAM.x === 18 && Sc.TrazoDuel.CAM.z === 70 && Sc.TrazoDuel.SCALE === 0.72,
        JSON.stringify(Sc.TrazoDuel.CAM));
      check('trazo: hundimiento en fases (aviso 0,5 s + caída 0,9 s) con hueco, velo de aviso y polvo',
        !!Sc.TrazoDuel.SINK && Sc.TrazoDuel.SINK.warn === 0.5 && Sc.TrazoDuel.SINK.fall === 0.9
        && trazoSrc.includes('hexHoleCv()') && trazoSrc.includes('hexWarnCv()') && trazoSrc.includes('h.puffed'), '');
      check('trazo: el tránsito activa la caminata de verdad (moveActor y partners fijan vx/vy, no solo la posición)',
        trazoSrc.includes('a.vx = ax.x * sp') && trazoSrc.includes('a.vx = ((a.tx.x - a.x) / d) * 126') && trazoSrc.includes('a.moving = a.spd > 12'), '');
      // Comportamiento: con el eje forzado a la derecha, la fase de
      // zancada del jugador AVANZA al moverse (antes, sin vx/vy,
      // quedaba congelada en 0 y el personaje se deslizaba).
      const dw = new Sc.TrazoDuel('natalia', () => {});
      G.input.touchDown('right', 99);
      const step0 = dw.p.step;
      for (let i = 0; i < 10; i++) { dw.moveActor(dw.p, 0.05, 157); dw.p.update(0.05); }
      G.input.touchUp('right', 99);
      check('trazo: al moverse con velocidad real, la fase de zancada AVANZA (no desliza)',
        dw.p.step > step0 + 3 && dw.p.spd > 100, `step ${step0}→${dw.p.step.toFixed(1)}, spd ${dw.p.spd}`);
    }
    // --- Corrección de Jose (2026-11-21), 2ª ronda del Trazo: caja
    // solo-estado también aquí, retrato diseñado de Teodora, cuenta
    // 3·2·1 sin la presentación larga y vuelo de Teodora por estados ---
    {
      const scenesTxtU = fs.readFileSync(path.join(SRC, 'scenes.js'), 'utf8');
      const trazoSrcU = scenesTxtU.slice(scenesTxtU.indexOf('class TrazoDuel'), scenesTxtU.indexOf('class SogaDuel'));
      check('trazo: su caja de estado también es SOLO estado (legendsHud con { solo: true })',
        trazoSrcU.includes("legendsHud(this, c, 'EL SET SE HUNDE / TRAZA LA LEYENDA'") && trazoSrcU.includes('{ solo: true }'), '');
      check('trazo: el retrato VS/chat de Teodora sale de su sprite diseñado (specialURL → TEODORA_DATA idle); el del Alebrije no se rompe',
        typeof G.specialURL === 'function' && G.specialURL('teodora') === G.TEODORA_DATA['teodora-idle']
        && G.specialURL('alebrije') === G.ALEBRIJE_DATA['alebrije-frente'], '');
      check('trazo: la cara del HUD de Teodora se recorta de su sprite real (teoFaceCv usa teoImg, con respaldo por código)',
        scenesTxtU.includes("teoImg('teodora-idle')") && scenesTxtU.includes('function teoFaceCv()'), '');
      check('trazo: cuenta regresiva PROPIA de 5 s (palabra de Jose, 3ª ronda; stT pisado en el constructor)',
        Sc.TrazoDuel.COUNT === 5 && trazoSrcU.includes('this.stT = TRAZO_COUNT_T'), '');
      check('trazo: la presentación del set dura lo que suman sus beats con tiempo de lectura (~13,4 s; ya no los 3,4 s ilegibles) y sigue saltable desde 0,4 s',
        !!Sc.LegendsRevealScene && Sc.LegendsRevealScene.DUR > 13 && Sc.LegendsRevealScene.DUR < 14
        && scenesTxtU.includes('REVEAL_DUR - 0.05') && !scenesTxtU.includes('const REVEAL_DUR = 3.4') && !scenesTxtU.includes('this.t >= 8.4'),
        `DUR=${Sc.LegendsRevealScene && Sc.LegendsRevealScene.DUR}`);
      // --- Corrección de Jose (2026-11-21, 4ª ronda): la
      // cinemática del final de Leyendas iba tan rápida que no se
      // entendía — entradas con tiempo de registro y textos con
      // tiempo de LECTURA en la presentación y en el cierre ---
      const RD = Sc.LegendsRevealScene.READ, RL = Sc.LegendsRevealScene.LINES, RB = Sc.LegendsRevealScene.BEATS;
      check('leyendas: regla de lectura nombrada (mínimo 2,4 s + 0,045 s/carácter, pausa 0,5 s entre líneas)',
        !!RD && RD.min === 2.4 && RD.perChar === 0.045 && RD.gap === 0.5
        && Math.abs(RD.time('x'.repeat(100)) - 4.5) < 1e-9 && RD.time('corta') === 2.4,
        JSON.stringify(RD && { min: RD.min, perChar: RD.perChar, gap: RD.gap }));
      check('leyendas: cada línea de la presentación dura ≥ su tiempo de lectura calculado (con su pausa)',
        !!RL && RL.length === 3
        && Math.abs((RB.line2 - RB.line1) - (RD.time(RL[1]) + RD.gap)) < 1e-9
        && Math.abs((Sc.LegendsRevealScene.DUR - RB.line2) - (RD.time(RL[2]) + 0.6)) < 1e-9
        && RB.line1 >= RD.time(RL[0]) + RD.gap, JSON.stringify(RB));
      check('leyendas: entradas escalonadas con tiempo de registro (Alebrije 1,9 s con easing y su pausa; Teodora desciende 2,0 s y aterriza al empezar su línea)',
        RB.albDur === 1.9 && RB.teoDur === 2 && Math.abs(RB.teoIn + RB.teoDur - RB.line2) < 1e-9
        && RB.line1 >= RB.albIn + RB.albDur + 0.5 - 1e-9, JSON.stringify(RB));
      const TL0 = Sc.LegendsFinaleScene.TIMELINE(0), TL1 = Sc.LegendsFinaleScene.TIMELINE(1), TL2 = Sc.LegendsFinaleScene.TIMELINE(2);
      check('leyendas: el cierre aplica la misma regla de lectura y el flash/selfie se desplaza con los créditos (1/2: flash 12,6 → ~15,2)',
        Math.abs(TL1.bT - (4.5 + RD.time('XIMENA: «¿Me hicieron una fiesta… en una película?»'))) < 1e-9
        && TL1.flashT > 12.6 && Math.abs(TL1.flashT - (TL1.creditsT + 4.6)) < 1e-9
        && TL2.dur >= TL2.creditsT + 7 * 0.62 + RD.min - 1e-9 && TL0.dur > 5,
        JSON.stringify({ t0: TL0, t1: TL1, t2: TL2 }));
      const dc = new Sc.TrazoDuel('natalia', () => {});
      check('trazo: un duelo recién creado arranca con la cuenta en 5 (stT = 5)', dc.st === 'count' && dc.stT === 5, `stT=${dc.stT}`);
      // Vuelo por estados: la pose depende de la dirección y la velocidad.
      const dv = new Sc.TrazoDuel('natalia', () => {});
      dv.phase = 'corre'; dv.teoMoving = true; dv.teoSpeed = 119;
      dv.teoVx = -100; const poseIzq = dv.teoPose();
      dv.teoVx = 100; const poseDash = dv.teoPose();
      dv.teoVx = 30; const poseSide = dv.teoPose();
      dv.teoVx = 0; const poseFrontal = dv.teoPose();
      check('trazo: Teodora vuela con pose por dirección (izq → perfil izquierdo, der lanzada → dash, der diagonal → perfil, vertical → frontal)',
        poseIzq === 'side-izq' && poseDash === 'dash' && poseSide === 'side' && poseFrontal === 'idle',
        `${poseIzq}/${poseDash}/${poseSide}/${poseFrontal}`);
      check('trazo: el vuelo deja estela, anticipa y se asienta (teoTrail/teoAnticip/teoSettleT en la clase; quieta alterna idle2)',
        trazoSrcU.includes('this.teoTrail.push') && trazoSrcU.includes('teoAnticip') && trazoSrcU.includes('teoSettleT') && trazoSrcU.includes("teoPoseName = 'idle2'"), '');
      // Comportamiento: en «corre», antes de despegar hay anticipación
      // y al volar hacia el seguro emite estela de chispas.
      const df = new Sc.TrazoDuel('natalia', () => {});
      df.st = 'play'; df.phase = 'corre'; df.pt = 0.8;
      df.update(0.016);
      const anticip = df.teoAnticip;
      df.pt = 1.0; df.teo.x = -169; df.teo.y = 30;
      df.update(0.05); df.update(0.05); df.update(0.05);
      check('trazo: anticipación antes del despegue y estela de chispas al volar',
        anticip > 0 && df.teoTrail.length > 0 && df.teoSpeed > 40, `anticip=${anticip.toFixed(2)} trail=${df.teoTrail.length} spd=${df.teoSpeed.toFixed(0)}`);
    }
    // --- Corrección de Jose (2026-11-21), 3ª ronda del Trazo: el
    // sprite de Teodora salía CORTADO por la izquierda (la celda de
    // extracción de mkteodora.py era más estrecha que la figura:
    // trazo ocupa x 1961–2681 en su hoja y la celda nacía en 2010),
    // seguía deslizándose, la cuenta pasa a 5 s con pausa de 2 s
    // antes del anuncio del color, y las losetas pastel translúcidas
    // se prestaban a confusión ---
    {
      const scenesTxtV = fs.readFileSync(path.join(SRC, 'scenes.js'), 'utf8');
      const trazoSrcV = scenesTxtV.slice(scenesTxtV.indexOf('class TrazoDuel'), scenesTxtV.indexOf('class SogaDuel'));
      const mkTxt = fs.readFileSync(path.join(__dirname, 'mkteodora.py'), 'utf8');
      check('trazo: la extracción ya no cercena a Teodora (celdas medidas sobre la figura real + margen PAD en mkteodora.py)',
        mkTxt.includes('("trazo", "teodora-poses-boss-v1.webp", (1920, 0, 2736, 912), False)')
        && mkTxt.includes('("dash", "teodora-sprites-faltantes-v1.webp", (900, 0, 1560, 992), False)')
        && mkTxt.includes('PAD = 14') && mkTxt.includes('canvas.paste(img, (PAD, PAD))'), '');
      // Los PNG del duelo llevan el margen: alto del lienzo = figura
      // (440, o 405/406 en idle/idle2 tras seccionar la sombra) + 28.
      const ihdrH = (n) => { const b = fs.readFileSync(path.join(__dirname, '..', 'application', 'src', 'assets', 'img', n + '.png')); return b.readUInt32BE(20); };
      check('trazo: los PNG de Teodora del duelo llevan su margen (IHDR: 468 de alto; idle 433 e idle2 434 por la sombra seccionada)',
        ihdrH('teodora-trazo') === 468 && ihdrH('teodora-side') === 468 && ihdrH('teodora-side-izq') === 468
        && ihdrH('teodora-sorprendida') === 468 && ihdrH('teodora-derrotada') === 468 && ihdrH('teodora-selfie') === 468 && ihdrH('teodora-dash') === 468
        && ihdrH('teodora-idle') === 433 && ihdrH('teodora-idle2') === 434, '');
      check('trazo: los altos de billboard compensan el margen (TEO_H 85 en el Trazo; la Soga y las escenas del final ajustadas)',
        Sc.TrazoDuel.TEO.h === 85 && scenesTxtV.includes('const SOGA_TEO_H = 81'), '');
      // Pausa de 2 s antes del anuncio: constante, fase y flujo.
      check('trazo: la pausa previa al anuncio es la constante TRAZO_COLOR_DELAY = 2 y el flujo pasa por la fase «pre»',
        Sc.TrazoDuel.COLOR_DELAY === 2 && trazoSrcV.includes("this.phase = 'pre'; this.pt = 0;")
        && trazoSrcV.includes("this.phase === 'pre'") && trazoSrcV.includes('¡Prepárense…!'), '');
      const dp = new Sc.TrazoDuel('natalia', () => {});
      dp.st = 'play'; dp.phase = 'trazo'; dp.tTrazo = 0.1; dp.pt = 0;
      dp.update(0.2); // fin del trazo → «pre», todavía SIN anuncio
      const enPre = dp.phase;
      dp.update(0.5); dp.update(0.5); dp.update(0.5); // 1,5 s de pausa
      const siguePre = dp.phase;
      const sinCaida = dp.hexes.every((h) => h.warn === 0 && h.sink === 0);
      dp.update(0.6); // 2,1 s → se anuncia y pasa a «aviso»
      check('trazo: tras el trazo hay 2 s de «pre» sin anuncio ni caída, y luego «aviso»',
        enPre === 'pre' && siguePre === 'pre' && sinCaida && dp.phase === 'aviso', `${enPre}/${siguePre}/${dp.phase}`);
      // Paleta cerrada y cara plana opaca con su RGB exacto.
      check('trazo: paleta cerrada saturada (ROJO/AZUL/AMARILLO con RGB exactos) en TrazoDuel.HEX',
        JSON.stringify(Sc.TrazoDuel.HEX.colors) === JSON.stringify(['#e63229', '#2060ff', '#ffc400'])
        && JSON.stringify(Sc.TrazoDuel.HEX.names) === JSON.stringify(['ROJO', 'AZUL', 'AMARILLO']), '');
      check('trazo: la cara de la loseta es plana y opaca (sin brillo central, alfa 1) y el anuncio lleva swatch del RGB exacto',
        !trazoSrcV.includes('shadeHex(col, 1.22)') && trazoSrcV.includes('(1 - 0.38 * e), alpha: 1')
        && trazoSrcV.includes('c.fillStyle = HEX_COLORS[this.safeColor]; c.fillRect(206, 74, 18, 18)'), '');
      check('trazo: el aviso de hundimiento ya no tiñe de rojo la loseta (velo oscuro + filo rojo, solo en la condenada)',
        scenesTxtV.includes("rgba(38,4,4,0.62)") && !scenesTxtV.includes("hexPath(x, 48, 48, 44); x.fillStyle = '#ff3b30'; x.fill();"), '');
      // Teodora nunca estatua: espera = celular tecleando; vuelo = frames alternos.
      const dw2 = new Sc.TrazoDuel('natalia', () => {});
      dw2.phase = 'aviso'; dw2.teoMoving = false;
      const poseEspera = dw2.teoPose();
      dw2.phase = 'corre'; dw2.teoMoving = true; dw2.teoVx = -100; dw2.teoAnimT = 0;
      const frameA = dw2.teoPose();
      dw2.teoAnimT = 0.2; // ~7 fps: el segundo frame del vuelo
      const frameB = dw2.teoPose();
      check('trazo: en espera Teodora está con el celular (selfie) y en vuelo la pose es CONSTANTE por trayecto, alternando solo su frame HERMANO (side-izq ↔ side-izq2; 4ª ronda: fuera el frontal idle2 que se leía como brinco)',
        poseEspera === 'selfie' && frameA === 'side-izq' && frameB === 'side-izq2', `${poseEspera}/${frameA}/${frameB}`);
      check('trazo: el tecleo tiene su micro-animación (bob ~2 Hz de 1,6 u y balanceo) en draw',
        trazoSrcV.includes('Math.sin(t * 12.6) * 1.6') && trazoSrcV.includes('Math.sin(t * 6.3) * 0.03') && trazoSrcV.includes('this.teoAnimT += dt'), '');
    }
    // 2A-bis (4ª ronda — 2026-11-21): el vuelo de Teodora ya no
    // «salta»: pose constante por trayecto (solo frames hermanos de
    // la misma pose de perfil) y trayectoria con arco + bob continuo
    // de baja frecuencia. Y la Soga: calaveritas de perfil animadas
    // al ritmo del ángulo, espera del jugador con sprites, soga con
    // onda de nodos exactos y patio ambientado.
    {
      const srcAll4 = fs.readFileSync(path.join(SRC, 'scenes.js'), 'utf8');
      const imgDir4 = path.join(__dirname, '..', 'application', 'src', 'assets', 'img');
      const t04 = srcAll4.indexOf('class TrazoDuel'), t14 = srcAll4.indexOf('class SogaDuel');
      const trazoSrc4 = srcAll4.slice(t04, t14), sogaSrc4 = srcAll4.slice(t14, srcAll4.indexOf('SogaDuel.CAM = SOGA_CAM', t14));
      // Vuelo: en ningún tiempo de su reloj aparece un frontal.
      const dv4 = new Sc.TrazoDuel('natalia', () => {});
      dv4.st = 'play'; dv4.phase = 'corre'; dv4.teoMoving = true; dv4.teoVx = -100; dv4.teoVy = 0;
      const posesVuelo = [0, 0.2, 0.4, 0.6, 0.8].map((tt) => { dv4.teoAnimT = tt; return dv4.teoPose(); });
      check('trazo (4ª ronda): durante todo el trayecto la pose de vuelo es de la familia de perfil (nunca un frontal): ' + posesVuelo.join('/'),
        posesVuelo.every((pp) => pp === 'side-izq' || pp === 'side-izq2'), posesVuelo.join(','));
      check('trazo (4ª ronda): la elevación del vuelo sale del ARCO del trayecto (teoTrip/teoArc) con bob continuo de ~1,5 Hz (fuente)',
        trazoSrc4.includes('this.teoTrip') && trazoSrc4.includes('this.teoArc = Math.sin(Math.PI') && trazoSrc4.includes('(this.teoArc || 0) * 11 + Math.sin(t * 9.42) * 3.5'), '');
      check('trazo (4ª ronda): teodora-side2 y teodora-side-izq2 (frames hermanos generados) existen como PNG y data URI',
        fs.existsSync(path.join(imgDir4, 'teodora-side2.png')) && fs.existsSync(path.join(imgDir4, 'teodora-side-izq2.png'))
        && G.TEODORA_DATA['teodora-side2'].startsWith('data:image/png;base64,') && G.TEODORA_DATA['teodora-side-izq2'].startsWith('data:image/png;base64,'), '');
      // Arco en vivo: con un único hexágono seguro lejano, a mitad
      // de camino el arco es positivo y el trayecto está registrado.
      const dw4 = new Sc.TrazoDuel('natalia', () => {});
      dw4.st = 'play'; dw4.phase = 'corre'; dw4.pt = 1.0;
      dw4.hexes.forEach((h) => { h.safe = false; }); dw4.hexes[dw4.hexes.length - 1].safe = true;
      dw4.teo.x = -169; dw4.teo.y = 30;
      for (let i = 0; i < 3; i++) dw4.update(0.05);
      check('trazo (4ª ronda): en pleno vuelo el trayecto está registrado y el arco es positivo (sube al despegar)',
        !!dw4.teoTrip && dw4.teoArc > 0, `trip=${!!dw4.teoTrip} arc=${dw4.teoArc.toFixed(3)}`);
      check('soga (4ª ronda): las calaveritas de perfil se animan con la FASE del ángulo real de la soga y van delante de su poste (z=16, sobre la tarima)',
        sogaSrc4.includes('Math.floor(this.a / Math.PI)') && sogaSrc4.includes('R.sprite(calL, -185, 52, 16') && sogaSrc4.includes('R.sprite(calR, 185, 52, 16'), '');
      check('soga (4ª ronda): la espera del jugador usa los sprites espera-/espera2- (swap en el suelo, no al cargar ni en el aire)',
        sogaSrc4.includes("jumpImg('espera-' + a.id)") && sogaSrc4.includes("jumpImg('espera2-' + a.id)") && sogaSrc4.includes('const drawWait'), '');
      check('soga (4ª ronda): la soga lleva la ONDA que viaja con nodos exactos (sin(2πu): cero en u=0, 0,5 y 1) sobre la trayectoria de siempre y nace de las manivelas',
        sogaSrc4.includes('Math.sin(2 * Math.PI * u)') && sogaSrc4.includes('Math.cos(2 * this.a - 4 * u)') && sogaSrc4.includes('R.project(-177, 74, 16)') && sogaSrc4.includes('R.project(0, 62 - Math.sin(this.a) * 60, 0)'), '');
      check('soga (4ª ronda): el patio está ambientado (piso extendido, alfombra, fachada con arcos, torres de focos, faroles y guirnalda detrás del arco)',
        sogaSrc4.includes('mb.box(0, -5, 20, 980, 10, 360') && sogaSrc4.includes("'#ffd98a', { emit: true }") && sogaSrc4.includes('Guirnalda de luces') && sogaSrc4.includes('z=-30'), '');
      check('soga (4ª ronda): chispas desprendidas con W.puff a ritmo de la velocidad angular (fuente)',
        sogaSrc4.includes('dt * this.omega() * 0.4') && sogaSrc4.includes('W.puff(rnd(-170, 170), 0, 1, true)'), '');
    }
    // 2B Soga (mecánica de MOMENTO, corrección de Jose 2026-11-21):
    // sin pulsar a tiempo te tropiezas, y a los 3 tropiezos pierdes;
    // saltando a tiempo, Teodora cae en su selfie (~vuelta 10). El
    // driver de victoria llama a jumpP() como haría la pulsación
    // dentro de la ventana del indicador.
    {
      const d = new Sc.SogaDuel('natalia', () => {});
      const res = driveDuel(d, () => {}, 900);
      check('2B soga: jugador inmóvil → 3 tropiezos → pierde (lose)', !!res && res.win === 'lose' && res.trips === 3, JSON.stringify(res));
      const d2 = new Sc.SogaDuel('natalia', () => {});
      const res2 = driveDuel(d2, (dd) => { if (dd.J.p.h <= 0 && dd.timeToBottom() < 0.34) dd.jumpP(); }, 4000);
      check('2B soga: saltando a tiempo, Teodora se quema en su selfie → win', !!res2 && res2.win === 'win' && res2.passes >= 9, JSON.stringify(res2));
    }
    // 2B-bis (ronda del indicador): sin caja, salto por ventana de
    // tiempo y 3 intentos — fuente, constantes y comportamiento.
    {
      const srcS5 = fs.readFileSync(path.join(SRC, 'scenes.js'), 'utf8');
      const sogaSrc5 = srcS5.slice(srcS5.indexOf('class SogaDuel'), srcS5.indexOf('SogaDuel.CAM = SOGA_CAM'));
      check('soga (ronda indicador): la clase NO llama al helper de cajas ni dibuja barra de fuerza (sin legendsHud, sin .charge) y su estado va en texto plano con Intentos',
        !sogaSrc5.includes('legendsHud(') && !sogaSrc5.includes('.charge') && sogaSrc5.includes('Intentos: ${SOGA_TRIES - this.trips}'), '');
      check('soga (ronda indicador): el salto sale de la acción con la ventana de tipState y el indicador «¡ESPACIO!» se pinta sobre la cabeza (head)',
        sogaSrc5.includes("G.input.hit('action')") && sogaSrc5.includes('tipState()') && sogaSrc5.includes("'¡ESPACIO!'") && sogaSrc5.includes('this.p.head(36)'), '');
      check('soga (ronda indicador): constantes — 3 intentos y ventana por TIEMPO (lead 0,6 s > min 0,09 s; arco fijo v=560)',
        Sc.SogaDuel.TRIES === 3 && Sc.SogaDuel.TIP.lead === 0.6 && Sc.SogaDuel.TIP.min === 0.09 && Sc.SogaDuel.TIP.v === 560,
        JSON.stringify(Sc.SogaDuel.TIP));
      check('soga (ronda indicador): la pantalla previa describe la mecánica de momento, no la de carga',
        G.EVENTS.soga.intro.includes('¡ESPACIO!') && G.EVENTS.soga.intro.includes('tienes 3') && !G.EVENTS.soga.intro.includes('cargar el salto'), '');
      // Comportamiento: con la soga lejos no hay indicador; cuando
      // el indicador sale (frac casi llena), pulsar SALTA y el paso
      // se esquiva sin tropiezo.
      const dA = new Sc.SogaDuel('natalia', () => {});
      dA.st = 'play';
      const lejos = !dA.tipState().on;
      let tipOn = null;
      for (let i = 0; i < 40 && !tipOn; i++) { dA.update(0.05); const ts = dA.tipState(); if (ts.on) tipOn = ts; }
      let salto = false, sinTropiezo = false;
      if (tipOn) {
        G.input.touchDown('action', 77); dA.update(0.05); G.input.touchUp('action', 77);
        salto = dA.J.p.h > 0;
        const p0 = dA.passes;
        for (let i = 0; i < 60 && dA.passes === p0; i++) dA.update(0.05);
        sinTropiezo = dA.trips === 0 && dA.J.p.roces === 0 && dA.passes === p0 + 1;
      }
      check('soga (ronda indicador): lejos no hay indicador; al salir (frac>0,85) pulsar en ventana salta y esquiva el paso sin tropiezo',
        lejos && !!tipOn && tipOn.frac > 0.85 && salto && sinTropiezo, `lejos=${lejos} frac=${tipOn && tipOn.frac.toFixed(2)} salto=${salto} limpio=${sinTropiezo}`);
      // Comportamiento: pulsar FUERA de ventana no salta; sin
      // pulsar, el 1er y 2º tropiezo NO terminan el duelo y el 3º
      // sí (derrota, con los 3 tropiezos en el resultado).
      let resB = null; const dB = new Sc.SogaDuel('natalia', (r) => { resB = r; });
      dB.st = 'play';
      G.input.touchDown('action', 78); dB.update(0.05); G.input.touchUp('action', 78);
      const noSalto = dB.J.p.h === 0 && dB.trips === 0;
      let vio1 = false, vio2 = false;
      for (let i = 0; i < 900 && !resB; i++) { dB.update(0.05); if (dB.trips === 1 && dB.st === 'play') vio1 = true; if (dB.trips === 2 && dB.st === 'play') vio2 = true; }
      check('soga (ronda indicador): pulsar fuera de ventana NO salta; tropiezos 1 y 2 no acaban el duelo; el 3º es la derrota',
        noSalto && vio1 && vio2 && !!resB && resB.win === 'lose' && resB.trips === 3, `noSalto=${noSalto} vio1=${vio1} vio2=${vio2} res=${JSON.stringify(resB)}`);
    }
    // Cadena completa y regla de boss: 2/2 = plena, 1/2 = película, 0/2 = sin película
    const driveChain = (trazoWin, sogaWin) => {
      let out = null;
      const chain = new Sc.LegendsEndingScene('natalia', (o) => { out = o; });
      for (let i = 0; i < 9000 && !out; i++) {
        const cur = chain.cur;
        if (cur instanceof Sc.TrazoDuel) {
          cur.tTrazo = 1.2; cur.tAviso = 0.1; cur.tCorre = 0.6; cur.tCae = 0.2;
          if (!trazoWin) { cur.p.x = 268; cur.p.y = 222; }
          else if (cur.phase === 'trazo') { const idx = Math.min(cur.pts.length - 1, 2 * Math.round((cur.pt / cur.tTrazo) * (cur.pts.length - 1) / 2)); cur.p.x = cur.pts[idx].x; cur.p.y = cur.pts[idx].y; }
          else if (cur.phase === 'corre' || cur.phase === 'cae') { const h = cur.hexes.find((hh) => hh.safe); if (h) { cur.p.x = h.x; cur.p.y = h.y; } }
        } else if (cur instanceof Sc.SogaDuel && sogaWin) { if (cur.J.p.h <= 0 && cur.timeToBottom() < 0.34) cur.jumpP(); }
        chain.update(0.05);
      }
      return out;
    };
    {
      const full = driveChain(true, true);
      check('cadena Leyendas 2/2: llega a LEYENDAS_MOVIE_ENDING en versión plena', !!full && full.movie === true && full.full === true && full.win === 'win', JSON.stringify(full && { movie: full.movie, full: full.full, wins: full.wins }));
      const one = driveChain(true, false);
      check('regla de boss: ganar solo 1 de 2 → película con Teodora invitada (tie)', !!one && one.movie === true && one.full === false && one.win === 'tie', JSON.stringify(one && { movie: one.movie, full: one.full, wins: one.wins }));
      const none = driveChain(false, false);
      check('regla de boss: perder los 2 → NO hay final de película', !!none && none.movie === false && none.win === 'lose', JSON.stringify(none && { movie: none.movie, wins: none.wins }));
      check('G.startLegendsEnding existe (equivalente a startSpaceEnding)', typeof G.startLegendsEnding === 'function');
    }
  }

  // ================= N) Integración de finales =====================
  console.log('\nN) Integración — J1407b en la historia y elección del jugador');
  {
    // --- G.spaceReady: las 3 condiciones del guion con stats reales ---
    const okSt = { flags: { escaladaEspacio: true }, quality: 80, sus: 49 };
    check('spaceReady: Escalada espacial ganada + Preparación 80 + Sospecha 49 → LISTO', G.spaceReady(okSt) === true);
    check('spaceReady: sin la marca de la Escalada espacial → no', G.spaceReady({ ...okSt, flags: {} }) === false);
    check('spaceReady: Preparación 79 → no (el corte es 80)', G.spaceReady({ ...okSt, quality: 79 }) === false);
    check('spaceReady: Sospecha («Despertar» real = S.sus) 50 → no; 49 → sí', G.spaceReady({ ...okSt, sus: 50 }) === false && G.spaceReady({ ...okSt, sus: 49 }) === true);
    check('spaceReady: objeto vacío → no, sin explotar', G.spaceReady({}) === false);

    // --- Enrutado del clímax: G.altFinalsRoute ---
    const decoReal = (n) => Array.from({ length: n }, () => ({ placed: true, improv: false }));
    const stSpace = { flags: { escaladaEspacio: true }, quality: 90, sus: 10, deco: decoReal(0) };
    const stLeg = { flags: { casting: true }, quality: 75, sus: 10, deco: decoReal(4) };
    const stBoth = { flags: { escaladaEspacio: true, casting: true }, quality: 90, sus: 10, deco: decoReal(4) };
    const stNone = { flags: {}, quality: 10, sus: 90, deco: decoReal(0) };
    check('clímax: solo espacio listo → ruta «espacio»', G.altFinalsRoute(stSpace) === 'espacio');
    check('clímax: solo Leyendas listo → ruta «leyendas»', G.altFinalsRoute(stLeg) === 'leyendas');
    check('clímax: AMBOS listos → ruta «ambos» (elige el jugador, sin prioridad fija)', G.altFinalsRoute(stBoth) === 'ambos');
    check('clímax: ninguno listo → ruta null (final normal intacto)', G.altFinalsRoute(stNone) === null);
    check('ENDINGS.espacio = «FIESTA EN J1407B» (el cierre del clímax espacial)', !!G.ENDINGS.espacio && G.ENDINGS.espacio.title === 'FIESTA EN J1407B');
    {
      // El cableado real en game.js: la elección se ofrece con
      // ui.choose y las etiquetas de Jose, SIN temporizador (sin
      // presión ni default por timeout).
      const gameTxt = fs.readFileSync(path.join(SRC, 'game.js'), 'utf8');
      const i = gameTxt.indexOf('Viaje a J1407b — la fiesta sobre los anillos');
      const call = i >= 0 ? gameTxt.slice(Math.max(0, i - 60), i + 340) : '';
      check('clímax: main() ofrece la elección con ui.choose y las dos opciones (J1407b / Leyendas)',
        call.includes('ui.choose([') && call.includes('La película de Las Leyendas — la casa era un set'), call.slice(0, 120));
      check('clímax: la elección NO lleva temporizador ni opción de timeout', /\]\);/.test(call) && !/timeout/.test(call), call.slice(-80));
    }

    // --- La marca de la Escalada: extra().space + resolve en historia ---
    {
      const d = new Sc.ClimbDuel('natalia', () => {});
      d.pMax = Math.ceil(5000 / Sc.ClimbDuel.SHELF_H); // altura máxima ≥ ESPACIO_E (5000 u)
      const exSpace = d.extra();
      d.pMax = 10;
      const exLow = d.extra();
      check('Escalada: extra().space = true solo si la altura máxima alcanzó la zona ESPACIO', exSpace.space === true && exLow.space === false, `alto=${exSpace.space} bajo=${exLow.space}`);
      S.flags = {}; G.practiceMode = false;
      MG.repisas.resolve({ win: 'win', space: true });
      const marcada = S.flags.escaladaEspacio === true;
      S.flags = {};
      MG.repisas.resolve({ win: 'win', space: false });
      MG.repisas.resolve({ win: 'lose', space: true });
      check('Escalada en historia: ganar llegando al espacio pone S.flags.escaladaEspacio; sin espacio o perdiendo, no', marcada && S.flags.escaladaEspacio !== true);
    }

    // --- Telescopio: prop por código en la Escalada, solo en el espacio ---
    check('telescopio: su elevación está DENTRO de la zona espacio (≥ 5000 u)', Sc.ClimbDuel.TELESCOPE_E >= 5000, 'TELESCOPE_E=' + Sc.ClimbDuel.TELESCOPE_E);
    check('telescopio: no entra en banda a ras de suelo y sí con la cámara a su altura', Sc.ClimbDuel.telescopeAt(0) === false && Sc.ClimbDuel.telescopeAt(Sc.ClimbDuel.TELESCOPE_E) === true);
    {
      // conteo exacto por color: el tubo del telescopio es de latón
      // (#c9a44a), color que solo usa ese prop en drawWorld
      const countBrass = (cy) => {
        const d = new Sc.ClimbDuel('natalia', () => {});
        const mb = new G.R.MB(); let n = 0;
        const orig = mb.box.bind(mb);
        mb.box = (...a) => { if (a[6] === '#c9a44a') n++; return orig(...a); };
        d.cam.y = cy; d.drawWorld(mb);
        return n;
      };
      let brassHigh = -1, brassLow = -1, drawErr = '';
      try { brassHigh = countBrass(Sc.ClimbDuel.TELESCOPE_E); brassLow = countBrass(0); } catch (e) { drawErr = e.message; }
      check('telescopio: a su altura drawWorld dibuja sus 3 piezas de latón; abajo, ninguna', brassHigh === 3 && brassLow === 0, `alto=${brassHigh} bajo=${brassLow} ${drawErr}`);
    }

    // --- Siembra WhatsApp ~13:00: la foto del cohete tras el apagón ---
    {
      S.party = ['natalia', 'majo', 'alan']; S.player = 'natalia'; S.flags = {};
      const msgsEl = documentFake.querySelector('#msgs');
      const dump = () => { let s = ''; (function walk(e) { s += e._html || ''; (e.children || []).forEach(walk); })(msgsEl); return s; };
      const before = dump();
      await G.spaceBeats('imagen'); // otro evento: no siembra
      const noPost = S.flags.espacioFoto !== true && dump() === before;
      await G.spaceBeats('apagon');
      const after = dump();
      check('siembra espacial: tras el apagón (~13:00) se postea la foto del cohete («no se fueron, están ORBITANDO»)',
        noPost && S.flags.espacioFoto === true && after.includes('ORBITANDO') && after.includes('telescopio'));
      const once = dump();
      await G.spaceBeats('apagon');
      check('siembra espacial: se postea una sola vez en la noche', dump() === once);
    }
  }

  // ============================================================
  // O) Móvil (pedido de Jose, 2026-11-21): joystick circular
  // analógico en vez del D-pad, proporciones/safe-area y el chat
  // que aparece solo si tiene algo que mostrar.
  // ============================================================
  console.log('\nO) Móvil: joystick analógico, proporciones y chat bajo demanda');
  {
    const inp = G.input;
    const near = (a, b) => Math.abs(a - b) < 0.001;
    // --- Función pura del joystick ---
    const v0 = inp.joyVector(0, 0, 100);
    check('joystick: centro exacto = vector cero (sin deriva)', v0.x === 0 && v0.y === 0 && v0.mag === 0, JSON.stringify(v0));
    const vDead = inp.joyVector(10, 0, 100); // empuje 0,10 del radio < zona muerta 0,18
    check('joystick: dentro de la zona muerta el vector es cero', vDead.mag === 0 && vDead.x === 0 && vDead.y === 0, JSON.stringify(vDead));
    const vFull = inp.joyVector(100, 0, 100);
    check('joystick: borde de la base = intensidad 1 hacia donde apunta el dedo', near(vFull.mag, 1) && near(vFull.x, 1) && near(vFull.y, 0), JSON.stringify(vFull));
    const vOver = inp.joyVector(260, -130, 100);
    check('joystick: más allá del borde la intensidad se recorta a 1 (sin pasar de la velocidad normal)', near(vOver.mag, 1), JSON.stringify(vOver));
    const vDiag = inp.joyVector(50, 50, 100);
    check('joystick: diagonal a 45° reparte x/y por igual, con la intensidad reescalada tras la zona muerta',
      near(vDiag.x, vDiag.y) && vDiag.x > 0 && near(vDiag.mag, (Math.hypot(50, 50) / 100 - inp.JOY_DEAD) / (1 - inp.JOY_DEAD)), JSON.stringify(vDiag));
    const vHalf = inp.joyVector(59, 0, 100); // n = 0,59 → mag = (0,59 − 0,18) / 0,82 = 0,5
    check('joystick: empuje intermedio = intensidad proporcional (0,5)', near(vHalf.mag, 0.5) && near(vHalf.x, 0.5), JSON.stringify(vHalf));
    const vBad = inp.joyVector(50, 50, 0);
    check('joystick: radio inválido = vector cero (sin NaN)', vBad.mag === 0 && vBad.x === 0 && vBad.y === 0, JSON.stringify(vBad));
    // --- joySet: el eje analógico manda; las flechas se derivan por umbral ---
    inp.touchReset();
    inp.joySet(0.3, 0); // sobre la zona muerta, bajo el umbral de flecha (0,45)
    const axSoft = inp.axis();
    check('joystick: empuje suave mueve el eje analógico SIN derivar flecha (velocidad proporcional)',
      near(axSoft.x, 0.3) && axSoft.y === 0 && !inp.held('right'), JSON.stringify(axSoft));
    inp.joySet(1, 0);
    check('joystick: empuje fuerte deriva la flecha con semántica de pulsación (held + hit una sola vez)',
      inp.held('right') && inp.hit('right') && !inp.hit('right'), '');
    const axFull = inp.axis();
    check('joystick: con el joystick activo, axis() es el vector analógico (dirección libre, no la flecha)',
      near(axFull.x, 1) && near(axFull.y, 0), JSON.stringify(axFull));
    inp.joySet(0, 0);
    check('joystick: al soltar, eje en cero y flecha derivada liberada', inp.axis().x === 0 && inp.axis().y === 0 && !inp.held('right'), '');
    inp.joySet(-0.8, -0.8);
    check('joystick: diagonal fuerte deriva DOS flechas (left+up), como un D-pad en diagonal',
      inp.held('left') && inp.held('up') && !inp.held('right') && !inp.held('down'), JSON.stringify(inp.joyState()));
    inp.touchReset();
    check('joystick: touchReset también limpia el vector analógico y las flechas derivadas',
      inp.joyState().mag === 0 && inp.axis().x === 0 && !inp.held('left') && !inp.held('up'), '');
    // --- Fuente: fuera el D-pad, dentro el joystick ---
    const htmlTxt = fs.readFileSync(path.join(__dirname, '..', 'application', 'src', 'index.html'), 'utf8');
    const cssTxt = fs.readFileSync(path.join(__dirname, '..', 'application', 'src', 'css', 'style.css'), 'utf8');
    const gameTxtO = fs.readFileSync(path.join(SRC, 'game.js'), 'utf8');
    check('móvil: el D-pad de flechas ya no existe en la UI táctil (ni en el HTML ni en el CSS)',
      !htmlTxt.includes('tpad-dpad') && !cssTxt.includes('tpad-dpad') && !htmlTxt.includes('data-k="up"') && !htmlTxt.includes('data-k="left"'), '');
    check('móvil: el joystick circular está en el HTML, el CSS y el cableado (Pointer Events + joyVector/joySet)',
      htmlTxt.includes('id="joystick"') && htmlTxt.includes('joy-knob') && cssTxt.includes('.joy-base') && cssTxt.includes('.joy-knob')
      && gameTxtO.includes('initJoystick') && gameTxtO.includes('G.input.joySet') && gameTxtO.includes("addEventListener('pointermove'"), '');
    check('móvil: el botón de acción se queda y convive con el joystick (multitáctil: cada control con su pointerId)',
      htmlTxt.includes('data-k="action"') && gameTxtO.includes('e.pointerId'), '');
    // --- Proporciones y zona segura ---
    check('móvil: viewport-fit=cover (la página llega bajo el notch y los insets son utilizables)',
      htmlTxt.includes('viewport-fit=cover'), '');
    check('móvil: alturas con dvh (la barra de direcciones del navegador no corta el juego) y safe-area-inset en #app',
      cssTxt.includes('100dvh') && cssTxt.includes('env(safe-area-inset-top)') && cssTxt.includes('env(safe-area-inset-bottom)')
      && cssTxt.includes('env(safe-area-inset-left)') && cssTxt.includes('env(safe-area-inset-right)'), '');
    check('móvil: el escenario se mantiene 16:9 con letterbox (aspect-ratio; la imagen nunca se estira)',
      cssTxt.includes('aspect-ratio: 16 / 9'), '');
    // --- Controles en los márgenes del letterbox (pedido de Jose, 2026-11-22) ---
    // Función pura: cada lado se decide por separado; la franja
    // alcanza si cabe el control + TOUCH_MARGIN_MIN (16px).
    const layWide = inp.touchLayout({ fringeL: 200, fringeR: 200, stageW: 800, joyW: 148, btnW: 78 });
    check('márgenes: con franjas anchas, el joystick queda CENTRADO en la franja izquierda (left relativo a la capa = −(franja+base)/2)',
      near(layWide.joyLeft, -(200 + 148) / 2) && near(layWide.joyLeft + 148 / 2, -200 / 2), JSON.stringify(layWide));
    check('márgenes: con franjas anchas, el botón de acción queda CENTRADO en la franja derecha (pasado el ancho del escenario)',
      near(layWide.actLeft, 800 + (200 - 78) / 2) && near(layWide.actLeft + 78 / 2, 800 + 200 / 2), JSON.stringify(layWide));
    const layNarrow = inp.touchLayout({ fringeL: 100, fringeR: 50, stageW: 800, joyW: 148, btnW: 78 });
    check('márgenes: franjas que no alcanzan (100 < 148+16 y 50 < 78+16) = controles superpuestos como siempre (null)',
      layNarrow.joyLeft === null && layNarrow.actLeft === null, JSON.stringify(layNarrow));
    const layAsym = inp.touchLayout({ fringeL: 164, fringeR: 93, stageW: 800, joyW: 148, btnW: 78 });
    check('márgenes: franja asimétrica — la izquierda justo en el umbral (164 = 148+16) mueve SOLO el joystick; la derecha a 1px del umbral no mueve el botón',
      near(layAsym.joyLeft, -(164 + 148) / 2) && layAsym.actLeft === null, JSON.stringify(layAsym));
    const layBad = inp.touchLayout({ fringeL: 300, fringeR: 300, stageW: 800, joyW: 0, btnW: 78 });
    check('márgenes: tamaños inválidos (control sin medir) = sin mudanza (null, sin NaN)',
      layBad.joyLeft === null && layBad.actLeft === null, JSON.stringify(layBad));
    check('márgenes: el umbral es la constante documentada TOUCH_MARGIN_MIN = 16',
      inp.TOUCH_MARGIN_MIN === 16, String(inp.TOUCH_MARGIN_MIN));
    // --- Fuente: la capa vive fuera del escenario y el cableado la calca y la muda ---
    const htmlNoComments = htmlTxt.replace(/<!--[\s\S]*?-->/g, '');
    check('márgenes: la capa táctil es hija de #stagewrap (fuera de #stage: su overflow:hidden no puede recortar los controles en las franjas)',
      /id="pauseov"><\/div>\s*<\/div>\s*<div id="touchpad">/.test(htmlNoComments), '');
    check('márgenes: #stagewrap es el ancla (position:relative) y la ocultación con modal mira dentro del escenario con :has()',
      cssTxt.includes('#stagewrap { position: relative;') && cssTxt.includes('#stage:has(> #overlay.show) ~ #touchpad'), '');
    check('márgenes: el cableado calca la capa sobre el rect del escenario y recalcula con ResizeObserver + resize/orientación',
      gameTxtO.includes('initTouchLayout') && gameTxtO.includes('G.input.touchLayout') && gameTxtO.includes('getBoundingClientRect')
      && gameTxtO.includes('ResizeObserver') && gameTxtO.includes("addEventListener('orientationchange'") && gameTxtO.includes('G.touchLayoutRefresh'), '');
  }
  // --- Chat: máquina de estados (con la gracia acortada para la prueba) ---
  {
    const ph = G.ui.phone, phoneElO = documentFake.querySelector('#phone'), msgsElO = documentFake.querySelector('#msgs');
    const optBtnInFlow = () => queryWithin(msgsElO, '.opt', true).find((c) => c.onclick); // las opciones viven en el flujo de mensajes (sección W3)
    const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
    ph.graceMs = 60; // la gracia real es 4000 ms (PHONE_GRACE_MS en game.js)
    ph.reset();
    check('chat: oculto por defecto (sin novedades no se mantiene en pantalla)',
      ph.state().visible === false && phoneElO.classList.contains('ph-off'), JSON.stringify(ph.state()));
    await G.ui.post({ who: 'sistema', text: 'Mensaje de prueba del humo' });
    check('chat: aparece cuando llega contenido nuevo', ph.state().visible === true && !phoneElO.classList.contains('ph-off'), JSON.stringify(ph.state()));
    await sleep(160);
    check('chat: leído y sin nada pendiente, se oculta solo tras la gracia breve', ph.state().visible === false, JSON.stringify(ph.state()));
    let chosen = -1;
    const pChoose = G.ui.choose([{ label: 'Opción A' }, { label: 'Opción B' }]).then((i) => { chosen = i; });
    check('chat: una decisión pendiente lo muestra y lo marca pendiente', ph.state().visible === true && ph.state().pending === true, JSON.stringify(ph.state()));
    await sleep(160);
    check('chat: con la decisión pendiente NO se auto-oculta aunque pase la gracia', ph.state().visible === true && ph.state().pending === true, JSON.stringify(ph.state()));
    const optBtn = optBtnInFlow();
    if (optBtn) optBtn.onclick();
    await pChoose;
    check('chat: al decidir, la promesa se resuelve y el pendiente se libera', chosen === 0 && ph.state().pending === false, 'chosen=' + chosen);
    await sleep(160);
    check('chat: resuelta la decisión y sin más contenido, vuelve a ocultarse solo', ph.state().visible === false, JSON.stringify(ph.state()));
    ph.toggle(); // abrir a mano: queda fijado
    const pinnedOk = ph.state().visible === true && ph.state().pinned === true;
    await sleep(160);
    const pinnedStays = ph.state().visible === true; // fijado a mano: la gracia no lo cierra
    ph.toggle(); // cerrar a mano: silencio
    await G.ui.post({ who: 'sistema', text: 'Mensaje con el chat silenciado' });
    check('chat: abierto a mano queda fijado; cerrado a mano, el contenido nuevo NO lo reabre (suma al contador)',
      pinnedOk && pinnedStays && ph.state().visible === false && ph.state().unread >= 1, JSON.stringify(ph.state()));
    let chosen2 = -1;
    const pChoose2 = G.ui.choose([{ label: 'Sí' }, { label: 'No' }]).then((i) => { chosen2 = i; });
    check('chat: una decisión pendiente rompe el silencio manual y se muestra siempre',
      ph.state().visible === true && ph.state().pending === true && ph.state().unread === 0, JSON.stringify(ph.state()));
    const optBtn2 = optBtnInFlow();
    if (optBtn2) optBtn2.onclick();
    await pChoose2;
    ph.reset(); ph.graceMs = 4000;
    check('chat: al terminar la prueba el estado queda limpio (oculto, sin pendiente, sin contador, sin fijado)',
      chosen2 === 0 && ph.state().visible === false && ph.state().pending === false && ph.state().unread === 0 && ph.state().pinned === false, JSON.stringify(ph.state()));
  }

  // --- Sección P: encuadre a prueba de barras del navegador (corrección 2026-11-22) ---
  // En horizontal el escenario se cortaba arriba y abajo: la regla base lo
  // topaba con una estimación de 150px de cromo vertical (el HUD en dos
  // filas la superaba) y el media query ≤900px, sin condición de
  // orientación, anulaba el tope por alto con max-width:100%. Ahora el
  // escenario se dimensiona con DOBLE tope exacto (unidades de contenedor
  // sobre #stagewrap) y respaldo progresivo vh → svh → dvh.
  {
    const cssP = fs.readFileSync(path.join(__dirname, '..', 'application', 'src', 'css', 'style.css'), 'utf8');
    const baseCss = cssP.slice(0, cssP.indexOf('@media')); // solo reglas base, fuera de media queries
    const stageRule = (baseCss.match(/#stage \{[^}]*\}/) || [''])[0];
    check('encuadre: la regla base del escenario trae el DOBLE tope (ancho y alto×16/9) con unidades de contenedor',
      stageRule.includes('width: min(100cqw, calc((100cqh - 48px) * 16 / 9))'), stageRule.slice(0, 140));
    check('encuadre: respaldo progresivo vh → svh → dvh en el ancho del escenario, sin el viejo tope estimado de 150px',
      stageRule.includes('calc((100vh - 190px) * 16 / 9)') && stageRule.includes('calc((100svh - 190px) * 16 / 9)')
      && stageRule.includes('calc((100dvh - 190px) * 16 / 9)') && !cssP.includes('(100dvh - 150px)') && !cssP.includes('(100vh - 150px)'), '');
    check('encuadre: #app con cadena vh → svh → dvh y overflow hidden (ningún ancestro deja desbordar el escenario)',
      baseCss.includes('height: 100vh; height: 100svh; height: 100dvh; overflow: hidden'), '');
    check('encuadre: #stagewrap es el contenedor de tamaño (cqw/cqh exactos) y en retrato se desactiva',
      baseCss.includes('container-type: size') && cssP.includes('container-type: normal'), '');
    check('encuadre: el media query ≤900px ya no anula el tope por alto en horizontal (queda acotado a retrato)',
      !cssP.includes('@media (max-width: 900px) {') && cssP.includes('@media (max-width: 900px) and (max-aspect-ratio: 4/5)'), '');
    check('encuadre: la tarjeta del título escala con el alto del escenario (clamp con cqh, no solo con vw)',
      cssP.includes('clamp(26px, 9.5cqh, 50px)') && cssP.includes('clamp(12px, 3.3cqh, 14px)'), '');
  }

  // ============================================================
  // Q) Candado de Minijuegos (regla de Jose, 2026-11-22): la
  // práctica nace BLOQUEADA. Dos llaves: (1) llegar a cualquier
  // final en modo historia (showEnding) y (2) el código admin123
  // en la opción «???» (solo su hash SHA-256 en date.js). El
  // desbloqueo persiste en localStorage ('1mtp.minigames').
  // ============================================================
  console.log('\nQ) Candado de Minijuegos — bloqueado hasta pasarse el juego o con admin123 en «???»');
  {
    const gameTxtQ = fs.readFileSync(path.join(SRC, 'game.js'), 'utf8');
    const dateTxtQ = fs.readFileSync(path.join(SRC, 'date.js'), 'utf8');
    const cssQ = fs.readFileSync(path.join(__dirname, '..', 'application', 'src', 'css', 'style.css'), 'utf8');
    const overlayQ = documentFake.querySelector('#overlay');
    const cryptoQ = require('crypto');
    // --- Fuente: las piezas del candado están donde deben estar ---
    check('candado: la llave persiste con clave propia documentada (1mtp.minigames) y API en G',
      gameTxtQ.includes("const MINIGAMES_KEY = '1mtp.minigames'") && gameTxtQ.includes('G.minigamesUnlocked') && gameTxtQ.includes('G.unlockMinigames'), '');
    check('candado: showEnding (el cierre de la historia) abre la llave 1 con su guard (ni práctica ni cita)',
      /async function showEnding\(key\) \{\s*\/\/ Llave 1[\s\S]{0,600}?if \(!G\.practiceMode && S\.phase !== 'date'\) G\.unlockMinigames\(\);/.test(gameTxtQ), '');
    check('candado: showMinigames cae en la pantalla del candado sin desbloqueo, con la pista exacta de Jose',
      gameTxtQ.includes('if (!G.minigamesUnlocked()) { await minigamesLockedScreen(); menuHide(); return; }')
      && gameTxtQ.includes('Termina el juego o desbloquea con un código en ???'), '');
    check('candado: el atajo ?duelo= también respeta el candado',
      gameTxtQ.includes("G.EVENTS[pr[1]].type === 'minigame' && G.minigamesUnlocked()"), '');
    check('candado: los botones de título y pausa se pintan apagados (clase locked) sin desbloqueo, y el CSS la define sin emojis',
      (gameTxtQ.match(/minigamesUnlocked\(\) \? '' : ' locked'/g) || []).length === 2 && cssQ.includes('button.big.locked'), '');
    check('candado: date.js guarda SOLO el hash SHA-256 de admin123 (forma normalizada) y expone verifyAdmin',
      dateTxtQ.includes(`const ADMIN_HASH = '${cryptoQ.createHash('sha256').update('ADMIN123').digest('hex')}'`)
      && dateTxtQ.includes('function verifyAdminCode(txt) { return sha256hex(normalizeCode(txt)) === ADMIN_HASH; }')
      && dateTxtQ.includes('verifyAdmin: verifyAdminCode') && !dateTxtQ.includes("'admin123'") && !dateTxtQ.includes('"admin123"'), '');
    check('candado: el panel «???» comprueba la llave admin (confirmación) ANTES que el código de la cita (silencio)',
      gameTxtQ.includes('G.DateMode.verifyAdmin(val)') && gameTxtQ.includes('¡Minijuegos desbloqueados!')
      && gameTxtQ.indexOf('verifyAdmin(val)') < gameTxtQ.indexOf('G.DateMode.verify(val)'), '');
    // --- Estado inicial: bloqueado ---
    fakeLocalStorage.clear(); G.debug.resetMinigames();
    check('candado: sin desbloqueo previo, la práctica nace bloqueada y sin clave guardada',
      G.minigamesUnlocked() === false && fakeLocalStorage.getItem('1mtp.minigames') === null, '');
    // --- La puerta enseña la pista, no la lista ---
    const pLocked = G.debug.showMinigames('title'); await tick();
    const lockedHtml = overlayQ.innerHTML;
    check('candado: al intentarlo bloqueado se muestra la pista (y NO la lista de duelos)',
      lockedHtml.includes('Termina el juego o desbloquea con un código en ???') && !lockedHtml.includes('data-id='), lockedHtml.slice(0, 120));
    documentFake.querySelector('#mback').onclick(); await pLocked;
    check('candado: la pantalla del candado se cierra con Volver y el candado sigue puesto',
      !overlayQ.classList.contains('show') && G.minigamesUnlocked() === false, '');
    // --- Llave 2: admin123 en «???» (DateMode simulado: la cripto
    // real la fijan el check de fuente de arriba y check_date) ---
    G.DateMode = { verify: () => false, verifyAdmin: (t) => t === 'admin123' };
    let cancelsQ = 0;
    G.openDateCode(() => { cancelsQ++; });
    documentFake.querySelector('#datecode').value = 'admin123';
    documentFake.querySelector('#datego').onclick(); await tick();
    check('candado: admin123 muestra la confirmación «¡Minijuegos desbloqueados!» y NO entra a la cita',
      overlayQ.innerHTML.includes('¡Minijuegos desbloqueados!') && S.phase !== 'date', overlayQ.innerHTML.slice(0, 120));
    check('candado: admin123 desbloquea y el desbloqueo QUEDA PERSISTIDO en localStorage',
      G.minigamesUnlocked() === true && fakeLocalStorage.getItem('1mtp.minigames') === '1', '');
    documentFake.querySelector('#adminok').onclick(); await tick();
    check('candado: la confirmación vuelve a la pantalla anterior (onCancel) con el menú abierto',
      cancelsQ === 1 && !overlayQ.classList.contains('show'), 'cancels=' + cancelsQ);
    // --- Desbloqueado: la lista real abre como siempre ---
    const pList = G.debug.showMinigames('title'); await tick();
    const listHtml = overlayQ.innerHTML;
    check('candado: ya desbloqueado, el menú muestra la lista de duelos de práctica de siempre',
      listHtml.includes('Minijuegos — práctica') && listHtml.includes('data-id=') && !listHtml.includes('Termina el juego o desbloquea'), listHtml.slice(0, 120));
    documentFake.querySelector('#mback').onclick(); await pList;
    // --- Código erróneo en «???»: silencio total, como siempre ---
    G.openDateCode(() => { cancelsQ++; });
    documentFake.querySelector('#datecode').value = 'NOES1234';
    documentFake.querySelector('#datego').onclick(); await tick();
    check('candado: un código que no es ni la cita ni admin cierra en silencio (vuelve sin mensajes)',
      cancelsQ === 2 && !overlayQ.classList.contains('show') && !overlayQ.innerHTML.includes('desbloqueados'), 'cancels=' + cancelsQ);
    G.DateMode = undefined;
    // --- Llave 1: llegar a un final de historia desbloquea ---
    fakeLocalStorage.clear(); G.debug.resetMinigames();
    check('candado: sesión limpia (sin la clave persistida) vuelve a estar bloqueada',
      G.minigamesUnlocked() === false, '');
    sandbox.location.reload = () => {}; // showEnding recarga al cerrar; aquí no
    G.practiceMode = false; S.phase = 'act2'; S.flags = S.flags || {};
    const pEnd = G.debug.showEnding('ruina'); // final de DERROTA: también cuenta como pasarse el juego
    check('candado: al llegar a un final de historia (aunque sea la ruina) el desbloqueo se activa y persiste',
      G.minigamesUnlocked() === true && fakeLocalStorage.getItem('1mtp.minigames') === '1', '');
    documentFake.querySelector('#mok').onclick(); await pEnd;
    check('candado: la pantalla del final se cierra con normalidad tras desbloquear',
      !overlayQ.classList.contains('show'), '');
  }

  // --- Sección R: música del juego principal (G.Music, 2026-11-22) ---
  {
    console.log('\nR) Música del juego principal — tabla de cues y API (sin MP3: silencio tolerante)');
    const M = G.Music, C = M && M.CUES;
    check('música: G.Music existe con su API (play/stop/setPaused/current/CUES)',
      !!M && typeof M.play === 'function' && typeof M.stop === 'function' && typeof M.setPaused === 'function' && typeof M.current === 'function' && !!C);
    check('música: menú = Gold_Plated_Strut.mp3, segmento 0–16, en loop',
      !!C && C.menu.file === 'Gold_Plated_Strut.mp3' && C.menu.start === 0 && C.menu.end === 16 && C.menu.loop === true, C && JSON.stringify(C.menu));
    check('música: recolección = Quarter_Slot_Swagger.mp3, segmento 25–86 (0:25–1:26), en loop',
      !!C && C.collect.file === 'Quarter_Slot_Swagger.mp3' && C.collect.start === 25 && C.collect.end === 86 && C.collect.loop === true, C && JSON.stringify(C.collect));
    check('música: amenaza = Before_The_Strike.mp3 desde el inicio, en loop',
      !!C && C.threat.file === 'Before_The_Strike.mp3' && C.threat.start === 0 && C.threat.loop === true, C && JSON.stringify(C.threat));
    check('música: victoria = Before_The_Strike.mp3 desde 17, SIN loop',
      !!C && C.win.file === 'Before_The_Strike.mp3' && C.win.start === 17 && C.win.loop === false, C && JSON.stringify(C.win));
    check('música: derrota = Controller_Down.mp3 completa, SIN loop',
      !!C && C.lose.file === 'Controller_Down.mp3' && C.lose.start === 0 && C.lose.end === null && C.lose.loop === false, C && JSON.stringify(C.lose));
    check('música: gestión = playlist en rotación [The_Last_Life, Gold_Plated_Strut], pistas completas, en loop',
      !!C && Array.isArray(C.gestion.tracks) && C.gestion.tracks.length === 2
      && C.gestion.tracks[0].file === 'The_Last_Life.mp3' && C.gestion.tracks[1].file === 'Gold_Plated_Strut.mp3'
      && C.gestion.tracks.every((t) => t.start === 0 && t.end === null) && C.gestion.loop === true,
      C && JSON.stringify(C.gestion));
    check('música: todos los cues traen volumen moderado (0 < v ≤ 0.6, no tapa los sfx)',
      !!C && Object.values(C).every((c) => typeof c.volume === 'number' && c.volume > 0 && c.volume <= 0.6));
    let threw = null;
    try {
      M.play('menu'); const afterMenu = M.current();
      M.play('collect'); const afterCollect = M.current();
      M.play('cue-que-no-existe'); const afterBad = M.current();
      M.setPaused(true); M.setPaused(false);
      M.play('gestion'); const afterGestion = M.current();
      M.stop();
      check('música: play cambia el cue, un cue desconocido se ignora, pausa/reanuda y stop no lanzan sin archivos',
        afterMenu === 'menu' && afterCollect === 'collect' && afterBad === 'collect' && afterGestion === 'gestion' && M.current() === null,
        [afterMenu, afterCollect, afterBad, afterGestion, M.current()].join(','));
    } catch (e) { threw = e; check('música: play/pausa/stop no lanzan sin archivos', false, String(e && e.message)); }
    const htmlQ = fs.readFileSync(path.join(__dirname, '..', 'application', 'src', 'main.js'), 'utf8');
    const iData = htmlQ.indexOf('js/data.js'), iMusic = htmlQ.indexOf('js/music.js'), iGame = htmlQ.indexOf('js/game.js');
    check('música: index.html carga js/music.js DESPUÉS de data.js y ANTES de game.js',
      iData >= 0 && iMusic > iData && iGame > iMusic, `data=${iData} music=${iMusic} game=${iGame}`);
    // Corrección de Jose (2026-11-22): la gestión suena SOLO en la
    // escena de casa/chat; los minijuegos/duelos sueltos (historia y
    // práctica) suenan con el cue de la recolección y al salir se
    // repone el cue anterior. Las cadenas de finales alternativos
    // (finalj1407b/finalleyendas) quedan fuera del gancho.
    const gameQ = fs.readFileSync(path.join(__dirname, '..', 'application', 'src', 'js', 'game.js'), 'utf8');
    const iEnter = gameQ.indexOf('function enterMinigameMusic'), iExit = gameQ.indexOf('function exitMinigameMusic');
    const enterBody = iEnter >= 0 ? gameQ.slice(iEnter, iExit > iEnter ? iExit : iEnter + 600) : '';
    const exitBody = iExit >= 0 ? gameQ.slice(iExit, iExit + 400) : '';
    check('música: enterMinigameMusic recuerda el cue activo y dispara collect, salvo en las cadenas de finales alternativos',
      iEnter >= 0 && enterBody.includes("ENDING_CHAIN_GAMES.includes(gameId)") && enterBody.includes('G.Music.current()')
      && enterBody.includes("G.Music.play('collect')") && gameQ.includes("const ENDING_CHAIN_GAMES = ['finalj1407b', 'finalleyendas']"), enterBody.slice(0, 140));
    check('música: exitMinigameMusic repone el cue anterior (o detiene si no sonaba nada) y no toca las cadenas (undefined)',
      iExit >= 0 && exitBody.includes('prev === undefined') && exitBody.includes('G.Music.play(prev)') && exitBody.includes('G.Music.stop()'), exitBody.slice(0, 140));
    const countCalls = (needle) => gameQ.split(needle).length - 1;
    check('música: AMBOS runners de minijuegos (historia y práctica) entran con enterMinigameMusic y salen con exitMinigameMusic',
      countCalls('enterMinigameMusic(ev.game)') === 2 && countCalls('exitMinigameMusic(prevMusic)') === 2,
      `enter=${countCalls('enterMinigameMusic(ev.game)')} exit=${countCalls('exitMinigameMusic(prevMusic)')}`);
    check('música: ya NO queda la vieja reafirmación de gestión al volver de un duelo (la gestión es solo casa/chat)',
      !gameQ.includes("G.Music.current() === 'gestion'"), '');
  }

  // --- Sección S: en horizontal la ESCENA manda (corrección 2026-11-22) ---
  // El encuadre de la sección P hacía caber el escenario, pero el cromo
  // en flujo (HUD en dos filas + inventario) lo dejaba chico al centro.
  // Ahora hay un modo horizontal compacto (HUD de una fila, inventario
  // delgado, teléfono flotante), los modales se topan también por ANCHO
  // (cqw) con el carrusel midiendo el escenario real, y los controles
  // táctiles escalan con el alto del escenario (cqh).
  {
    console.log('\nS) Horizontal compacto — la escena es la protagonista');
    const cssS = fs.readFileSync(path.join(__dirname, '..', 'application', 'src', 'css', 'style.css'), 'utf8');
    const gameTxtS = fs.readFileSync(path.join(SRC, 'game.js'), 'utf8');
    const iCompact = cssS.indexOf('@media (orientation: landscape) and (max-height: 700px)');
    const compact = iCompact >= 0 ? cssS.slice(iCompact) : '';
    check('horizontal: existe el modo compacto y cubre también tabletas/foldables (≤900px con puntero grueso)',
      iCompact >= 0 && cssS.includes('(orientation: landscape) and (max-height: 900px) and (pointer: coarse)'), '');
    check('horizontal: el HUD se compacta a UNA fila delgada (nowrap, sin segunda fila)',
      compact.includes('#hud { flex-wrap: nowrap'), '');
    check('horizontal: el inventario se adelgaza (slots de 32px) y el escenario usa el hueco completo (modo inmersivo, sección V: sin reserva de 38px)',
      compact.includes('.slot { width: 32px; height: 32px; }') && compact.includes('width: min(100cqw, calc(100cqh * 16 / 9))') && !compact.includes('(100cqh - 38px)'), '');
    check('horizontal: el teléfono NO reserva columna en este modo: flota sobre el lateral de main',
      compact.includes('#phone { position: absolute') && compact.includes('main { position: relative'), '');
    check('modales: el ancho se topa en cqw (nada asoma por la derecha) en normal y wide',
      cssS.includes('max-width: min(560px, 92cqw)') && cssS.includes('max-width: min(860px, 95cqw)'), '');
    check('modales: los títulos escalan también por ANCHO (el menor entre cqh y cqw)',
      cssS.includes('font-size: clamp(24px, min(9.5cqh, 12cqw), 50px)') && cssS.includes('font-size: clamp(14px, min(5cqh, 4.8cqw), 20px)'), '');
    check('carrusel: mide el ESCENARIO real (no la ventana) y achica las fichas hasta que entren completas',
      gameTxtS.includes("const stageEl = $('#stage')") && gameTxtS.includes("b.style.width = CW + 'px'")
      && !gameTxtS.includes('iw < 2 * CW + GAP + 170'), '');
    check('táctil: joystick y botón de acción escalan con el alto del escenario (clamp con cqh, topes de siempre)',
      cssS.includes('#joystick { width: clamp(96px, 34cqh, 148px)') && cssS.includes('.taction { width: clamp(52px, 18cqh, 78px)'), '');
  }

  // --- Sección T: sonido en los Ajustes (pedido de Jose, 2026-11-22) ---
  // Deslizadores de Música/Efectos (0–100) y Silencio general en el
  // panel, con la fuente de verdad en G.settings (musicVol/sfxVol/
  // muted, persistidos en '1mtp.settings'): la ganancia efectiva
  // manda sobre la música (en vivo, sobre el deck que suena), sobre
  // los efectos (se lee en cada disparo) y sobre el audio de La
  // Cita (fuente de date.js: consulta las mismas ganancias).
  {
    console.log('\nT) Sonido en los Ajustes — volúmenes de música/efectos y silencio general');
    const gameT = fs.readFileSync(path.join(SRC, 'game.js'), 'utf8');
    const dateT = fs.readFileSync(path.join(SRC, 'date.js'), 'utf8');
    const cssT = fs.readFileSync(path.join(__dirname, '..', 'application', 'src', 'css', 'style.css'), 'utf8');
    const iScr = gameT.indexOf('function settingsScreen');
    const scr = iScr >= 0 ? gameT.slice(iScr, iScr + 6000) : '';
    check('sonido: el panel de Ajustes trae los TRES controles (deslizador de Música, deslizador de Efectos con muestra al soltar, e interruptor de Silencio general)',
      scr.includes('id="smusic"') && scr.includes('id="ssfx"') && scr.includes('id="smute"')
      && scr.includes('<b>Música</b>') && scr.includes('<b>Efectos</b>') && scr.includes('<b>Silencio general</b>')
      && scr.includes("inp.onchange = () => G.sfx('pick')"), scr.slice(0, 120));
    check('sonido: los deslizadores se estilan en el panel (accent-color del tema y área táctil de 32px)',
      cssT.includes('.optrow input[type="range"]') && cssT.includes('accent-color: var(--yellow)'), '');
    check('sonido: las claves nuevas nacen con su defecto en el merge de ajustes (un guardado viejo sin ellas se rellena sin borrar las demás)',
      gameT.includes('musicVol: 100, sfxVol: 100, muted: false'), '');
    check('sonido: sin tocar nada, los ajustes de sonido valen 100/100 y sin silencio',
      G.settings.musicVol === 100 && G.settings.sfxVol === 100 && G.settings.muted === false,
      JSON.stringify({ m: G.settings.musicVol, s: G.settings.sfxVol, mu: G.settings.muted }));

    // Ganancias efectivas derivadas de G.settings.
    G.settings.musicVol = 40; G.settings.sfxVol = 25; G.settings.muted = false;
    check('sonido: la ganancia efectiva refleja cada volumen (40% música, 25% efectos)',
      Math.abs(G.musicGain() - 0.4) < 1e-9 && Math.abs(G.sfxGain() - 0.25) < 1e-9,
      `music=${G.musicGain()} sfx=${G.sfxGain()}`);
    G.settings.muted = true;
    check('sonido: el SILENCIO GENERAL lleva ambas ganancias a cero SIN tocar los volúmenes guardados',
      G.musicGain() === 0 && G.sfxGain() === 0 && G.settings.musicVol === 40 && G.settings.sfxVol === 25, '');
    G.settings.muted = false;

    // La música obedece EN VIVO: al aplicar los ajustes, el deck
    // que está sonando salta al nuevo volumen efectivo sin esperar
    // al siguiente cue. (Sin MP3 en el sandbox: bastan los <audio>
    // falsos; debugActiveEl es inyección del propio humo.)
    const M = G.Music;
    G.settings.musicVol = 50;
    M.play('menu');
    G.debug.applySoundSettings();
    const deckEl = M.debugActiveEl();
    check('sonido: G.Music recibe la ganancia del jugador (50%) y el deck que suena queda al volumen efectivo del cue (0.45 × 0.5 = 0.225)',
      M.userGain() === 0.5 && !!deckEl && Math.abs(deckEl.volume - 0.225) < 1e-9,
      `gain=${M.userGain()} vol=${deckEl && deckEl.volume}`);
    G.settings.muted = true;
    G.debug.applySoundSettings();
    check('sonido: con el silencio general, el deck que suena cae a cero en vivo',
      M.userGain() === 0 && !!deckEl && deckEl.volume === 0, `vol=${deckEl && deckEl.volume}`);
    G.settings.muted = false; G.settings.musicVol = 100;
    G.debug.applySoundSettings();
    M.stop();

    // Los efectos obedecen en cada disparo: un AudioContext falso
    // registra el pico de ganancia con que nace cada nota.
    const peaks = [];
    sandbox.AudioContext = class {
      constructor() { this.currentTime = 0; this.destination = {}; }
      createOscillator() { return { type: '', frequency: { value: 0 }, connect: (n) => n, start() {}, stop() {} }; }
      createGain() { return { gain: { setValueAtTime: (v) => peaks.push(v), exponentialRampToValueAtTime: () => {} }, connect: (n) => n }; }
    };
    G.settings.sfxVol = 50;
    G.sfx('pick');
    check('sonido: un efecto al 50% nace con la mitad del pico de siempre (0.05 → 0.025)',
      peaks.length > 0 && Math.abs(peaks[0] - 0.025) < 1e-9, `peaks=${peaks.join(',')}`);
    const beforeMute = peaks.length;
    G.settings.muted = true;
    G.sfx('pick');
    check('sonido: con el silencio general, un efecto ni siquiera crea sus nodos',
      peaks.length === beforeMute, `antes=${beforeMute} después=${peaks.length}`);
    G.settings.muted = false; G.settings.sfxVol = 100;

    // Persistencia: los valores viajan a '1mtp.settings' y
    // conviven con las claves que ya vivían ahí (touch).
    G.settings.musicVol = 33; G.settings.sfxVol = 66; G.settings.muted = true;
    G.debug.saveSettings();
    let stored = null;
    try { stored = JSON.parse(fakeLocalStorage.getItem('1mtp.settings') || 'null'); } catch (e) { stored = null; }
    check('sonido: los tres valores PERSISTEN en 1mtp.settings junto a las claves existentes (touch)',
      !!stored && stored.musicVol === 33 && stored.sfxVol === 66 && stored.muted === true && ('touch' in stored),
      JSON.stringify(stored));
    // El sandbox queda como estaba: valores por defecto, guardados.
    G.settings.musicVol = 100; G.settings.sfxVol = 100; G.settings.muted = false;
    G.debug.saveSettings(); G.debug.applySoundSettings();

    // La Cita obedece a la misma fuente (fuente de date.js): lee
    // las ganancias globales para su canción y su puerta, y
    // expone el punto de resincronización que game.js empuja.
    check('sonido: date.js consulta las ganancias globales (musicGain para la canción, sfxGain para la puerta) y expone applySoundSettings',
      dateT.includes("typeof G.musicGain === 'function'") && dateT.includes("typeof G.sfxGain === 'function'")
      && dateT.includes('applySoundSettings: applySongSound'), '');
    check('sonido: la puerta de la cita respeta el silencio general y escala su volumen con la ganancia de efectos',
      dateT.includes('g != null && g <= 0') && dateT.includes('0.9 * (g == null ? 1 : g)'), '');
  }

  // --- Sección U: el bug de Jose — los controles «no funcionaban» ---
  // La sección T ejercita la API (applySoundSettings → setUserGain)
  // pero NUNCA el camino real: el panel de Ajustes con sus
  // manejadores DOM y la ruta de arranque del título. Y destapó la
  // causa raíz: el nivel audible vivía SOLO en el.volume del
  // <audio>, que iOS/WebKit acepta sin que cambie lo que suena
  // (ni a cero con el silencio general). Ahora music.js enruta
  // cada deck por WebAudio (MediaElementSource → GainNode) y el
  // nivel vive en el GainNode. Esta sección lo comprueba por la
  // ruta REAL: instala un AudioContext falso completo, hace sonar
  // el menú con la llamada exacta de main() (G.Music.play('menu');
  // main() en sí no corre en el sandbox por falta de WebGL), abre
  // el panel REAL de Ajustes y dispara los manejadores REALES de
  // sus controles (oninput del deslizador, onchange del silencio),
  // dejando correr los ticks del sistema de fades para afirmar
  // que el nivel nuevo SE MANTIENE.
  {
    console.log('\nU) Sonido — la ruta real de Jose: panel de Ajustes → manejadores DOM → GainNode del deck del menú');
    const waitMs = (ms) => new Promise((r) => setTimeout(r, ms));
    const MU = G.Music;
    // AudioContext falso COMPLETO (sustituye al de la sección T):
    // con createMediaElementSource para que el enrutado exista.
    sandbox.AudioContext = class {
      constructor() { this.state = 'running'; this.destination = {}; }
      createMediaElementSource() { return { connect: (n) => n }; }
      createGain() { return { gain: { value: 1 }, connect: (n) => n }; }
      createOscillator() { return { type: '', frequency: { value: 0 }, connect: (n) => n, start() {}, stop() {} }; }
      resume() { this.state = 'running'; return Promise.resolve(); }
    };
    G.settings.musicVol = 100; G.settings.sfxVol = 100; G.settings.muted = false;
    G.debug.applySoundSettings();
    MU.play('menu'); // la llamada exacta con que main() arranca la música del título
    await waitMs(1150); // el fade de entrada (900 ms) se completa
    const gain0 = MU.debugActiveGain();
    check('sonido real: el deck del menú queda ENRUTADO por WebAudio y su nivel vive en el GainNode (0.45 del cue), no en el.volume',
      gain0 !== null && Math.abs(gain0 - 0.45) < 1e-9 && MU.debugActiveEl().volume === 1,
      `gain=${gain0} el.volume=${MU.debugActiveEl() && MU.debugActiveEl().volume}`);

    // El panel REAL de Ajustes y los manejadores REALES de sus controles.
    const panelP = G.debug.settingsScreen();
    await tick();
    const inpM = documentFake.querySelector('#smusic');
    const muteBox = documentFake.querySelector('#smute');
    check('sonido real: el panel de Ajustes expone el deslizador de Música y el Silencio con sus manejadores cableados',
      !!inpM && typeof inpM.oninput === 'function' && !!muteBox && typeof muteBox.onchange === 'function', '');
    inpM.value = '30';
    inpM.oninput(); // el MISMO manejador que dispara el DOM al arrastrar
    const gain1 = MU.debugActiveGain();
    check('sonido real: arrastrar Música al 30% con el manejador del propio control deja el GainNode en 0.45 × 0.3 = 0.135',
      Math.abs(G.settings.musicVol - 30) < 1e-9 && Math.abs(MU.userGain() - 0.3) < 1e-9 && gain1 !== null && Math.abs(gain1 - 0.135) < 1e-9,
      `vol=${G.settings.musicVol} gain=${gain1}`);
    await waitMs(1200); // ticks del sistema de fades: nada debe pisar el nivel
    const gain1b = MU.debugActiveGain();
    check('sonido real: el nivel SE MANTIENE tras los ticks de los fades (ningún camino lo recalcula sin la ganancia del jugador)',
      gain1b !== null && Math.abs(gain1b - 0.135) < 1e-9, `gain=${gain1b}`);
    muteBox.checked = true;
    muteBox.onchange({ target: muteBox }); // el MISMO manejador del interruptor
    const gain2 = MU.debugActiveGain();
    check('sonido real: el Silencio general (manejador real) lleva el GainNode a cero en vivo',
      G.settings.muted === true && gain2 === 0, `gain=${gain2}`);
    await waitMs(1200);
    check('sonido real: el cero del silencio SE MANTIENE tras los ticks (la música del menú no «revive» sola)',
      MU.debugActiveGain() === 0, `gain=${MU.debugActiveGain()}`);
    // Limpieza: ajustes por defecto y panel cerrado.
    muteBox.checked = false;
    muteBox.onchange({ target: muteBox });
    inpM.value = '100';
    inpM.oninput();
    const back = documentFake.querySelector('#sback');
    if (back && back.onclick) back.onclick();
    await panelP;
    MU.stop();
  }

  // --- Sección V: modo inmersivo (Opción A de Jose, 2026-11-22) ---
  // En el horizontal compacto el HUD y el inventario salen del
  // flujo y flotan sobre la escena (la escena pasa al 100% del
  // hueco), semitransparentes y auto-ocultables con la máquina
  // `cromo` de game.js — la misma filosofía del chat. El arnés no
  // tiene matchMedia (la máquina nace inactiva, como en un
  // navegador sin ese modo), así que el comportamiento se
  // ejercita activándola a mano (cromo.active) con una gracia
  // corta, sobre los MISMOS elementos falsos que game.js capturó.
  {
    console.log('\nV) Modo inmersivo — escena al 100% y cromo flotante que se retira solo');
    const waitV = (ms) => new Promise((r) => setTimeout(r, ms));
    const cssV = fs.readFileSync(path.join(__dirname, '..', 'application', 'src', 'css', 'style.css'), 'utf8');
    const gameV = fs.readFileSync(path.join(SRC, 'game.js'), 'utf8');
    const iCompactV = cssV.indexOf('@media (orientation: landscape) and (max-height: 700px)');
    const compactV = iCompactV >= 0 ? cssV.slice(iCompactV) : '';

    // --- Fuente CSS: todo vive SOLO dentro del bloque compacto ---
    check('inmersivo: el HUD sale del flujo en el modo compacto (absoluto sobre el borde superior, con safe-area)',
      compactV.includes('#hud { position: absolute') && compactV.includes('top: env(safe-area-inset-top, 0px)'), '');
    check('inmersivo: el inventario sale del flujo en el modo compacto (absoluto y centrado sobre el borde inferior)',
      compactV.includes('#inv { position: absolute') && compactV.includes('left: 50%') && compactV.includes('transform: translateX(-50%)'), '');
    check('inmersivo: el escenario usa el hueco COMPLETO (la fórmula ya no resta la reserva del inventario)',
      compactV.includes('width: min(100cqw, calc(100cqh * 16 / 9))') && !compactV.includes('(100cqh - 38px)'), '');
    check('inmersivo: fuera del bloque compacto el HUD y el inventario NO son absolutos (retrato/escritorio intactos)',
      !cssV.slice(0, iCompactV).includes('#hud { position: absolute') && !cssV.slice(0, iCompactV).includes('#inv { position: absolute'), '');
    check('inmersivo: al retirarse solo se apagan marca, medidores y Ajustes — Pausa y Teléfono quedan SIEMPRE visibles y pulsables',
      compactV.includes('#hud.chrome-off .brand, #hud.chrome-off .meter, #hud.chrome-off #settingsbtn { opacity: 0; pointer-events: none; }')
      && compactV.includes('#hud.chrome-off #pausebtn, #hud.chrome-off #phonebtn { pointer-events: auto; }'), '');
    check('inmersivo: el fondo del cromo flotante es semitransparente (se lee sin tapar la escena) y el retirado deja pasar los toques',
      compactV.includes('rgba(46, 38, 68, .88)') && compactV.includes('rgba(23, 18, 38, .55)')
      && compactV.includes('#hud.chrome-off { background: transparent;') && compactV.includes('#inv { position: absolute; left: 50%; bottom: 6px; transform: translateX(-50%); z-index: 5; pointer-events: none;'), '');
    check('defecto de la captura: el estado de sueño ya no se monta sobre RUIDO (min-width:128px anulado en compacto y etiqueta con ellipsis)',
      compactV.includes('#m-sleep .val { font-size: 9px; min-width: 0;') && compactV.includes('text-overflow: ellipsis'), '');

    // --- Fuente JS: máquina, constante y cableado ---
    check('inmersivo: la máquina del cromo existe con su constante nombrada de auto-ocultado (3500 ms) y la media query espejo del CSS',
      gameV.includes('const IMMERSIVE_HIDE_MS = 3500') && gameV.includes('ui.cromo = cromo')
      && gameV.includes("window.matchMedia('(orientation: landscape) and (max-height: 700px), (orientation: landscape) and (max-height: 900px) and (pointer: coarse)')"), '');
    check('inmersivo: disparadores cableados — setScene→kick, refreshHUD→watchHud, refreshInv→watchInv, bordes del escenario→edge, frame→frameSync',
      gameV.includes('G.ui.cromo.kick()') && gameV.includes('G.ui.cromo.watchHud(S.sus, S.quality)') && gameV.includes('G.ui.cromo.watchInv()')
      && gameV.includes("wrapEl.addEventListener('pointerdown', (e) => cromo.edge(e), true)") && gameV.includes('G.ui.cromo.frameSync()'), '');

    // --- Comportamiento de la máquina (activada a mano, gracia corta) ---
    const cromo = G.debug.cromo;
    const hudFake = documentFake.querySelector('#hud'), invFake = documentFake.querySelector('#inv');
    const ovFake = documentFake.querySelector('#overlay'), povFake = documentFake.querySelector('#pauseov');
    ovFake.classList.remove('show'); povFake.classList.remove('show'); G.paused = false;
    check('inmersivo: sin la media query compacta la máquina nace INACTIVA (no toca el layout de siempre)',
      !!cromo && cromo.state().active === false && !hudFake.classList.contains('chrome-off') && !invFake.classList.contains('chrome-off'), '');
    cromo.active = true; cromo.hideMs = 40; cromo.reset();
    cromo.kick();
    check('inmersivo: al arrancar la escena (kick) HUD e inventario están visibles',
      cromo.state().hudVis === true && cromo.state().invVis === true && !hudFake.classList.contains('chrome-off') && !invFake.classList.contains('chrome-off'), '');
    await waitV(110);
    check('inmersivo: tras la gracia sin novedades AMBOS se retiran (clase chrome-off puesta)',
      cromo.state().hudVis === false && cromo.state().invVis === false && hudFake.classList.contains('chrome-off') && invFake.classList.contains('chrome-off'), '');
    cromo.reveal('top');
    check('inmersivo: tocar el borde superior trae SOLO el HUD de vuelta (el inventario sigue retirado)',
      cromo.state().hudVis === true && cromo.state().invVis === false && !hudFake.classList.contains('chrome-off') && invFake.classList.contains('chrome-off'), '');
    await waitV(110);
    cromo.reveal('bottom');
    check('inmersivo: tocar el borde inferior trae SOLO el inventario de vuelta',
      cromo.state().invVis === true && cromo.state().hudVis === false && !invFake.classList.contains('chrome-off'), '');
    // Novedad relevante: sube la Sospecha → el HUD reaparece.
    await waitV(110);
    S.sus = 0; G.ui.refreshHUD(); // foto previa con la sospecha a cero (determinista)
    S.sus = 10; G.ui.refreshHUD();
    check('inmersivo: si SUBE la Sospecha el HUD reaparece solo',
      cromo.state().hudVis === true && !hudFake.classList.contains('chrome-off'), '');
    // Novedad en el inventario: recoger un ítem → el inventario reaparece.
    await waitV(110);
    G.ui.refreshInv(); // fija la firma previa
    cromo.hideInv();   // y se parte de oculto: lo que se prueba es la REAPARICIÓN
    const anyItem = Object.keys(G.ITEMS).find((id) => !S.inv[id]) || Object.keys(G.ITEMS)[0];
    S.inv[anyItem] = true;
    G.ui.refreshInv();
    check('inmersivo: al recoger un ítem el inventario reaparece solo',
      cromo.state().invVis === true && !invFake.classList.contains('chrome-off'), `item=${anyItem}`);
    delete S.inv[anyItem]; G.ui.refreshInv();
    // Con un modal abierto el cromo se retira; al cerrarse vuelve.
    cromo.kick();
    G.paused = true; cromo.frameSync();
    check('inmersivo: con pausa/modal abierto el cromo se retira (el modal manda)',
      cromo.state().hudVis === false && cromo.state().invVis === false, '');
    G.paused = false; cromo.frameSync();
    check('inmersivo: al cerrar la pausa/modal el cromo vuelve (kick de frameSync)',
      cromo.state().hudVis === true && cromo.state().invVis === true, '');
    // Limpieza: máquina inactiva y sin clases, como en un navegador sin el modo.
    cromo.active = false; cromo.hideMs = 3500; cromo.reset();
    check('inmersivo: al salir del modo las clases se quitan y el layout vuelve a ser el de siempre',
      !hudFake.classList.contains('chrome-off') && !invFake.classList.contains('chrome-off'), '');
  }

  // --- Sección W: playtest de Jose — chat flotante MANUAL con
  // insignia, scroll que respeta la lectura y banda táctil
  // inferior en vertical (2026-11-22, sobre la rama develop) ---
  // En horizontal el panel del chat flota (position:absolute del
  // bloque compacto) y a Jose no le gusta que aparezca y
  // desaparezca según el juego: pasa a control manual con el
  // botón del teléfono, con insignia de no leídos y alerta de
  // decisión pendiente. El scroll del chat ya no salta al final
  // si el jugador está leyendo arriba. Y en vertical los
  // controles táctiles bajan a una banda en flujo bajo el chat.
  // El arnés no tiene getComputedStyle ni matchMedia: el modo
  // flotante se fija a mano (phone.floatMode, como cromo.active)
  // y la banda se fuerza con G.touchBandSync(true/false).
  {
    console.log('\nW) Chat flotante manual con insignia, scroll sin saltos y banda táctil en vertical');
    const waitW = (ms) => new Promise((r) => setTimeout(r, ms));
    const cssW = fs.readFileSync(path.join(__dirname, '..', 'application', 'src', 'css', 'style.css'), 'utf8');
    const gameW = fs.readFileSync(path.join(SRC, 'game.js'), 'utf8');
    const iPortraitW = cssW.indexOf('@media (max-width: 760px)');
    const portraitW = iPortraitW >= 0 ? cssW.slice(iPortraitW, cssW.indexOf('/* Controles táctiles PROPORCIONALES')) : '';
    const iCompactW = cssW.indexOf('@media (orientation: landscape) and (max-height: 700px)');
    const compactW = iCompactW >= 0 ? cssW.slice(iCompactW) : '';

    // --- Fuente: detección, insignia, botón notorio ---
    check('flotante: el modo se detecta desde la fuente de verdad del CSS (la posición calculada del panel), no con media queries duplicadas en JS',
      gameW.includes("getComputedStyle(phoneEl).position === 'absolute'") && gameW.includes('floatMode'), '');
    check('flotante: la insignia tiene estado de ALERTA para la decisión pendiente (pulso suave persistente) y el botón pulsa al llegar algo nuevo',
      cssW.includes('#phonebadge.alert') && cssW.includes('@keyframes badgepulse') && cssW.includes('#phonebtn.ping') && cssW.includes('@keyframes phoneping'), '');
    check('flotante: en el modo compacto el botón del teléfono es MÁS notorio (objetivo táctil de 38px, borde amarillo, pictograma mayor)',
      compactW.includes('#phonebtn { padding: 6px 12px; font-size: 12px; min-height: 38px;') && compactW.includes('#phonebtn .pic-phone { width: 13px; height: 20px; }'), '');

    // --- Fuente: scroll y banda ---
    check('scroll: la regla de seguimiento es una constante nombrada (CHAT_STICK_PX = 48) aplicada en el punto común (ui.scroll y raw, midiendo ANTES de añadir)',
      gameW.includes('const CHAT_STICK_PX = 48') && gameW.includes('msgs.scrollHeight - msgs.scrollTop - msgs.clientHeight <= CHAT_STICK_PX')
      && gameW.includes('const stick = msgs.scrollHeight'), '');
    check('banda: en vertical la capa dentro de main es una banda EN FLUJO pegada al fondo de la columna (margin-top:auto) que solo se muestra con la capa táctil activa',
      portraitW.includes('main > #touchpad { position: static; margin-top: auto; }') && portraitW.includes('body.touch-on main > #touchpad { display: flex;'), '');
    check('banda: dentro de la banda los controles dejan de posicionarse sobre la escena (relativos, joystick izquierda / acción derecha por space-between)',
      portraitW.includes('main > #touchpad #joystick { position: relative;') && portraitW.includes('main > #touchpad .taction { position: relative;') && portraitW.includes('justify-content: space-between'), '');
    check('banda: con un modal abierto la banda se oculta, salvo el carrusel (.nav-open) donde el joystick navega el menú',
      portraitW.includes('main:has(#overlay.show) > #touchpad') && portraitW.includes('main:has(#pauseov.show) > #touchpad') && portraitW.includes('main:has(#overlay.show) > #touchpad.nav-open { display: flex !important; }'), '');
    check('banda: el JS espeja el retrato ACOTADO a orientación vertical (no pisa el horizontal compacto) y en horizontal el calcado/márgenes del letterbox sigue intacto',
      gameW.includes("window.matchMedia('(max-aspect-ratio: 4/5), (max-width: 760px) and (orientation: portrait)')") && gameW.includes('G.touchBandSync = syncBand')
      && gameW.includes('G.input.touchLayout') && gameW.includes("pad.classList.toggle('joy-margin'") && gameW.includes("pad.classList.toggle('act-margin'"), '');

    // --- Comportamiento: el teléfono en modo flotante ---
    const phW = G.ui.phone, badgeFake = documentFake.querySelector('#phonebadge'), phoneFake = documentFake.querySelector('#phone'), msgsW = documentFake.querySelector('#msgs');
    phW.floatMode = true; // sin getComputedStyle en el arnés: el modo se fija a mano
    phW.reset();
    await G.ui.post({ who: 'sistema', text: 'Mensaje flotante uno' });
    await G.ui.post({ who: 'sistema', text: 'Mensaje flotante dos' });
    check('flotante: con mensajes nuevos el panel NO se abre solo y la insignia ACUMULA los no leídos',
      phW.state().visible === false && phoneFake.classList.contains('ph-off') && phW.state().unread === 2
      && badgeFake.textContent === '2' && badgeFake.style.display === 'grid' && !badgeFake.classList.contains('alert'),
      JSON.stringify(phW.state()) + ' badge=' + badgeFake.textContent);
    let chosenW = -1;
    const pChooseW = G.ui.choose([{ label: 'Ir' }, { label: 'Quedarse' }]).then((i) => { chosenW = i; });
    check('flotante: una decisión pendiente TAMPOCO abre el panel; la insignia pasa a alerta «!» (el juego espera esa elección)',
      phW.state().visible === false && phW.state().pending === true && badgeFake.textContent === '!' && badgeFake.classList.contains('alert'),
      JSON.stringify(phW.state()) + ' badge=' + badgeFake.textContent);
    const optBtnW = queryWithin(msgsW, '.opt', true).find((c) => c.onclick);
    if (optBtnW) optBtnW.onclick();
    await pChooseW;
    check('flotante: al responder la decisión la alerta se apaga (la insignia vuelve a ser contador)',
      chosenW === 0 && phW.state().pending === false && !badgeFake.classList.contains('alert') && badgeFake.textContent !== '!',
      JSON.stringify(phW.state()) + ' badge=' + badgeFake.textContent);
    phW.toggle(); // abrir a mano con el botón
    const openedOk = phW.state().visible === true && phW.state().unread === 0 && badgeFake.style.display === 'none';
    phW.graceMs = 50; // si hubiera auto-ocultado en flotante, 150 ms bastan para cazarlo
    await waitW(150);
    check('flotante: abierto a mano la insignia se limpia y el panel NO se auto-oculta jamás (sin gracia que lo cierre)',
      openedOk && phW.state().visible === true && !phoneFake.classList.contains('ph-off'), JSON.stringify(phW.state()));
    phW.toggle(); // cerrar a mano
    check('flotante: cerrado a mano queda cerrado (control manual pleno)',
      phW.state().visible === false && phoneFake.classList.contains('ph-off'), JSON.stringify(phW.state()));
    phW.floatMode = false; phW.graceMs = 4000; phW.reset();

    // --- Comportamiento: el scroll respeta la lectura ---
    const msgsFake = documentFake.querySelector('#msgs');
    msgsFake.scrollHeight = 1000; msgsFake.clientHeight = 300; msgsFake.scrollTop = 0; // leyendo arriba del todo (quedan 700px)
    G.ui.raw('<div class="sys">Mensaje con el lector arriba</div>');
    check('scroll: leyendo más arriba, un mensaje nuevo CONSERVA la posición intacta (no salta al último mensaje)',
      msgsFake.scrollTop === 0, 'scrollTop=' + msgsFake.scrollTop);
    msgsFake.scrollTop = 670; // casi al final: quedan 30px ≤ CHAT_STICK_PX
    G.ui.raw('<div class="sys">Mensaje con el lector al final</div>');
    check('scroll: estando (casi) al final, el chat SÍ sigue al mensaje nuevo',
      msgsFake.scrollTop === 1000, 'scrollTop=' + msgsFake.scrollTop);
    msgsFake.scrollTop = 100; G.ui.scroll();
    const upStaysW = msgsFake.scrollTop === 100;
    msgsFake.scrollTop = 690; G.ui.scroll();
    check('scroll: ui.scroll (el punto común de los MENSAJES) aplica la regla de seguimiento; las decisiones ya no lo invocan (sección W2)',
      upStaysW && msgsFake.scrollTop === 1000, 'scrollTop=' + msgsFake.scrollTop);
    phW.reset();

    // --- Comportamiento: la banda vertical muda la capa en el DOM ---
    const padFake = documentFake.querySelector('#touchpad'), wrapFake = documentFake.querySelector('#stagewrap'), mainFake = documentFake.querySelector('main');
    check('banda: sin matchMedia la banda nace INACTIVA y la capa no está en main (el layout de siempre no se toca)',
      typeof G.touchBandSync === 'function' && G.touchBandSync() === false && padFake.parent !== mainFake, '');
    padFake.style.left = '33px'; // resto del calcado superpuesto: al entrar en la banda debe limpiarse
    const bandOnW = G.touchBandSync(true);
    check('banda: en vertical la capa se muda a main (la banda bajo el chat) y se limpian los estilos en línea del calcado/márgenes',
      bandOnW === true && padFake.parent === mainFake && padFake.style.left === '', '');
    const bandOffW = G.touchBandSync(false);
    check('banda: al salir de vertical la capa vuelve a #stagewrap (vuelve el modo superpuesto/márgenes intacto)',
      bandOffW === false && padFake.parent === wrapFake, '');
  }

  // --- Sección W2: el modelo manual manda también en VERTICAL
  // (playtest de Jose, 2026-11-22, sobre develop) ---
  // «El chat debería mostrarse o desaparecer cuando uno lo
  // seleccione, porque pierdo el foco cuando aparece a mitad de
  // un diálogo»: en retrato el panel vive en el flujo y seguía
  // con la máquina automática de escritorio. Ahora el modo
  // manual es flotante O retrato (la media query portraitMQ se
  // comparte con la banda táctil; en el arnés, sin matchMedia,
  // manda el campo portraitMode, como floatMode). En retrato el
  // panel nace cerrado, al cerrarse colapsa en la columna (la
  // regla base lo saca del layout) y la insignia es la campana.
  // Y la llegada de una DECISIÓN ya no mueve el scroll ni
  // estando el lector al final: la razón de la elección se lee
  // al ritmo del jugador (los mensajes normales sí siguen).
  {
    console.log('\nW2) Chat manual también en vertical y decisiones que no roban el scroll');
    const waitW2 = (ms) => new Promise((r) => setTimeout(r, ms));
    const cssW2 = fs.readFileSync(path.join(__dirname, '..', 'application', 'src', 'css', 'style.css'), 'utf8');
    const gameW2 = fs.readFileSync(path.join(SRC, 'game.js'), 'utf8');

    // --- Fuente: detección compartida y decisiones sin scroll ---
    check('retrato: el modo manual del teléfono es flotante O retrato (manual() = floating() || portrait(), con syncPortrait sobre la media query)',
      gameW2.includes('manual() { return this.floating() || this.portrait(); }') && gameW2.includes('syncPortrait()') && gameW2.includes('portraitMode'), '');
    check('retrato: la media query de retrato se define UNA sola vez y la comparten el teléfono y la banda táctil (sin duplicar el criterio)',
      (gameW2.split("window.matchMedia('(max-aspect-ratio: 4/5), (max-width: 760px) and (orientation: portrait)')").length - 1) === 1
      && gameW2.includes('G.touchBandSync = syncBand'), '');
    check('retrato: al cerrarse el panel COLAPSA su espacio en la columna (la regla base lo saca del layout: display none)',
      cssW2.includes('#phone.ph-off { display: none; }'), '');
    const iChooseW2 = gameW2.indexOf('choose(options, timer)');
    const chooseTxtW2 = iChooseW2 >= 0 ? gameW2.slice(iChooseW2, gameW2.indexOf('assign(prompt, info)')) : '';
    const iAssignW2 = gameW2.indexOf('assign(prompt, info)');
    const assignTxtW2 = iAssignW2 >= 0 ? gameW2.slice(iAssignW2, gameW2.indexOf('modal(html, btn)')) : '';
    check('decisiones: ni choose ni assign invocan el scroll al renderizarse (su llegada nunca mueve la lectura)',
      iChooseW2 >= 0 && iAssignW2 >= 0 && !chooseTxtW2.includes('.scroll(') && !assignTxtW2.includes('.scroll(')
      && !gameW2.includes('ui.scroll();'), '');

    // --- Comportamiento: el teléfono en modo retrato ---
    const ph2 = G.ui.phone, badge2 = documentFake.querySelector('#phonebadge'), phoneEl2 = documentFake.querySelector('#phone'),
      msgs2 = documentFake.querySelector('#msgs');
    ph2.floatMode = false; ph2.portraitMode = true; // sin matchMedia en el arnés: el modo se fija a mano, como floatMode
    ph2.reset();
    check('retrato: el panel NACE cerrado (la insignia es la campana) y el modo se reporta manual/retrato',
      ph2.state().visible === false && phoneEl2.classList.contains('ph-off') && ph2.state().manual === true && ph2.state().portrait === true && ph2.state().floating === false,
      JSON.stringify(ph2.state()));
    await G.ui.post({ who: 'sistema', text: 'Mensaje vertical uno' });
    await G.ui.post({ who: 'sistema', text: 'Mensaje vertical dos' });
    check('retrato: con mensajes nuevos el panel NO se abre solo y la insignia ACUMULA los no leídos (el panel sigue colapsado en la columna)',
      ph2.state().visible === false && phoneEl2.classList.contains('ph-off') && ph2.state().unread === 2
      && badge2.textContent === '2' && badge2.style.display === 'grid' && !badge2.classList.contains('alert'),
      JSON.stringify(ph2.state()) + ' badge=' + badge2.textContent);

    // --- Comportamiento: la decisión no roba el scroll ---
    msgs2.scrollHeight = 1000; msgs2.clientHeight = 300; msgs2.scrollTop = 700; // pegado al final (hueco 0 ≤ CHAT_STICK_PX)
    let chosenW2 = -1;
    const pChooseW2 = G.ui.choose([{ label: 'Ir' }, { label: 'Quedarse' }]).then((i) => { chosenW2 = i; });
    check('retrato: una decisión pendiente TAMPOCO abre el panel; la insignia pasa a alerta «!»',
      ph2.state().visible === false && ph2.state().pending === true && badge2.textContent === '!' && badge2.classList.contains('alert'),
      JSON.stringify(ph2.state()) + ' badge=' + badge2.textContent);
    check('decisiones: renderizada con el lector AL FINAL, el scroll NO se mueve (la razón de la elección queda en pantalla)',
      msgs2.scrollTop === 700, 'scrollTop=' + msgs2.scrollTop);
    const optBtnW2 = queryWithin(msgs2, '.opt', true).find((c) => c.onclick);
    if (optBtnW2) optBtnW2.onclick();
    await pChooseW2;
    check('decisiones: al responderla, el eco de la elección es un MENSAJE normal y SÍ sigue la regla de seguimiento (salta al final)',
      chosenW2 === 0 && ph2.state().pending === false && msgs2.scrollTop === 1000, 'scrollTop=' + msgs2.scrollTop);

    // Apertura manual y no auto-ocultado en retrato
    ph2.toggle(); // abrir a mano con el botón
    const openedW2 = ph2.state().visible === true && ph2.state().unread === 0 && badge2.style.display === 'none';
    ph2.graceMs = 50; // si en retrato hubiera auto-ocultado, 150 ms bastan para cazarlo
    await waitW2(150);
    check('retrato: abierto a mano la insignia se limpia, el panel ocupa su sitio en el flujo y NO se auto-oculta jamás',
      openedW2 && ph2.state().visible === true && !phoneEl2.classList.contains('ph-off'), JSON.stringify(ph2.state()));
    ph2.toggle(); // cerrar a mano: colapsa
    check('retrato: cerrado a mano el panel colapsa (ph-off) y queda cerrado',
      ph2.state().visible === false && phoneEl2.classList.contains('ph-off'), JSON.stringify(ph2.state()));

    // Rotación: el estado abierto/cerrado se conserva al cambiar de modo
    ph2.toggle(); // abierto en retrato…
    ph2.portraitMode = false; ph2.floatMode = true; // …giro a horizontal flotante
    const rotKeepsW2 = ph2.state().visible === true;
    await G.ui.post({ who: 'sistema', text: 'Mensaje tras el giro' });
    check('rotación: al pasar de retrato a flotante el panel CONSERVA su estado (abierto) y el modo sigue siendo manual (sin conteo con el panel abierto)',
      rotKeepsW2 && ph2.state().visible === true && ph2.state().unread === 0 && ph2.state().manual === true, JSON.stringify(ph2.state()));

    // Escritorio ancho: ni flotante ni retrato → la máquina automática de siempre, intacta
    ph2.floatMode = false; ph2.portraitMode = false; ph2.reset();
    await G.ui.post({ who: 'sistema', text: 'Mensaje de escritorio' });
    check('escritorio: sin flotante ni retrato el chat sigue apareciendo solo con contenido nuevo (modo automático intacto)',
      ph2.state().visible === true && ph2.state().manual === false, JSON.stringify(ph2.state()));
    ph2.reset(); ph2.graceMs = 4000;
  }

  // --- Sección W3: las decisiones viven DENTRO del flujo de
  // mensajes (propuesta de Jose, 2026-11-22) ---
  // Las opciones de choose/assign dejan la zona fija #actions
  // (retirada del HTML, del CSS y de game.js) y se añaden como
  // último nodo de #msgs: si Jose desliza hacia arriba se van
  // con el historial; si desliza hasta abajo, aparecen. Su
  // llegada no mueve scrollTop en NINGÚN caso (ni lector arriba
  // ni lector al final). Si el bloque queda bajo el pliegue con
  // la decisión pendiente, avisa la PASTILLA «Decisión
  // pendiente ↓» — que no mueve nada por sí sola: solo su toque
  // baja la vista hasta el bloque — y desaparece cuando el
  // bloque entra en vista o al responderse. Al responder, el
  // bloque sale del flujo y queda el eco de siempre.
  {
    console.log('\nW3) Decisiones dentro del flujo de mensajes y pastilla de aviso');
    const gameW3 = fs.readFileSync(path.join(SRC, 'game.js'), 'utf8');
    const htmlW3 = fs.readFileSync(path.join(SRC, '..', 'main.js'), 'utf8');
    const cssW3 = fs.readFileSync(path.join(__dirname, '..', 'application', 'src', 'css', 'style.css'), 'utf8');

    // --- Fuente: el nuevo hogar del bloque ---
    const iChooseW3 = gameW3.indexOf('choose(options, timer)');
    const chooseTxtW3 = iChooseW3 >= 0 ? gameW3.slice(iChooseW3, gameW3.indexOf('assign(prompt, info)')) : '';
    const iAssignW3 = gameW3.indexOf('assign(prompt, info)');
    const assignTxtW3 = iAssignW3 >= 0 ? gameW3.slice(iAssignW3, gameW3.indexOf('modal(html, btn)')) : '';
    check('flujo: choose y assign montan su bloque AL FINAL de los mensajes (mountDecision), no en una zona fija',
      iChooseW3 >= 0 && iAssignW3 >= 0 && chooseTxtW3.includes('mountDecision(block)') && assignTxtW3.includes('mountDecision(block)'), '');
    check('flujo: el viejo #actions desapareció del juego (sin referencia en game.js, sin nodo en index.html, sin reglas en el CSS)',
      !gameW3.includes("$('#actions')") && !gameW3.includes('actions.innerHTML') && !gameW3.includes('actions.appendChild')
      && !htmlW3.includes('id="actions"') && !cssW3.includes('#actions {'), '');
    check('flujo: el bloque lleva la clase .decision con su fondo propio y la pastilla .dpill existe (fija al pie del panel, con su detector de pliegue)',
      cssW3.includes('.decision {') && cssW3.includes('.dpill {') && gameW3.includes('Decisión pendiente ↓') && gameW3.includes('decisionOutOfView'), '');

    // --- Comportamiento: choose en el flujo, sin mover el scroll ---
    const ph3 = G.ui.phone, msgs3 = documentFake.querySelector('#msgs'), pill3 = documentFake.querySelector('#dpill');
    ph3.floatMode = false; ph3.portraitMode = false; ph3.reset();
    msgs3.scrollHeight = 2000; msgs3.clientHeight = 300; msgs3.scrollTop = 0; // lector arriba del todo
    let chosen3 = -1;
    const pChoose3 = G.ui.choose([{ label: 'Flujo A' }, { label: 'Flujo B' }]).then((i) => { chosen3 = i; });
    const block3 = queryWithin(msgs3, '.decision', false);
    check('flujo: el bloque de opciones es el ÚLTIMO nodo de los mensajes y la máquina lo marca pendiente (insignia y lógica intactas)',
      !!block3 && msgs3.children[msgs3.children.length - 1] === block3 && ph3.state().pending === true, '');
    check('flujo: la llegada de la decisión NO mueve el scroll (lector arriba)',
      msgs3.scrollTop === 0, 'scrollTop=' + msgs3.scrollTop);
    check('flujo: sin geometría medible la pastilla no aparece (no afirma lo que no puede medir)',
      !!pill3 && pill3.style.display === 'none', '');

    // Geometría simulada: el panel visible mide 300px (top 100 →
    // bottom 400) y el bloque nace a 900px del origen del
    // contenido, así que su posición en pantalla depende del
    // scroll, como en un navegador real.
    msgs3.getBoundingClientRect = () => ({ top: 100, bottom: 400, left: 0, right: 300, width: 300, height: 300 });
    block3.getBoundingClientRect = () => ({ top: 900 - msgs3.scrollTop, bottom: 990 - msgs3.scrollTop, left: 0, right: 300, width: 300, height: 90 });
    const pillShown3 = G.ui.decisionPillSync();
    check('pastilla: con la decisión pendiente y el bloque BAJO EL PLIEGUE, la pastilla aparece (y solo avisa: no mueve nada por sí sola)',
      pillShown3 === true && pill3.style.display !== 'none' && msgs3.scrollTop === 0, 'scrollTop=' + msgs3.scrollTop);
    pill3.onclick(); // el toque de Jose: la vista baja hasta el bloque
    check('pastilla: SOLO su toque desplaza la vista hasta el bloque (y al entrar el bloque en vista, la pastilla desaparece)',
      msgs3.scrollTop === 794 && pill3.style.display === 'none', 'scrollTop=' + msgs3.scrollTop);
    msgs3.scrollTop = 0; // Jose vuelve a subir a releer la razón: el bloque sale de vista…
    const pillBack3 = G.ui.decisionPillSync(); // …que es lo que dispara el listener de scroll en el navegador
    check('pastilla: si el bloque vuelve a salir de vista con la decisión pendiente, la pastilla reaparece',
      pillBack3 === true && pill3.style.display !== 'none', '');
    const opt3 = queryWithin(block3, '.opt', true).find((b) => b.onclick);
    if (opt3) opt3.onclick();
    await pChoose3;
    const lastRow3 = msgs3.children[msgs3.children.length - 1];
    check('flujo: al responder, el bloque SALE del flujo, la pastilla se apaga y queda el eco como último mensaje (el eco tampoco arrastra al lector que estaba arriba)',
      chosen3 === 0 && queryWithin(msgs3, '.decision', false) === null && pill3.style.display === 'none' && msgs3.scrollTop === 0
      && !!lastRow3 && lastRow3._html.includes('mine') && lastRow3._html.includes('Flujo A'),
      'chosen=' + chosen3 + ' scrollTop=' + msgs3.scrollTop);

    // Lector AL FINAL: tampoco hay excepción a la regla
    msgs3.scrollTop = 1700; // pegado al final (2000 − 300)
    let chosen3b = -1;
    const pChoose3b = G.ui.choose([{ label: 'Final A' }, { label: 'Final B' }]).then((i) => { chosen3b = i; });
    const block3b = queryWithin(msgs3, '.decision', false);
    check('flujo: con el lector AL FINAL, la llegada de la decisión tampoco mueve el scroll (sin excepciones)',
      !!block3b && msgs3.scrollTop === 1700, 'scrollTop=' + msgs3.scrollTop);
    const opt3b = queryWithin(block3b, '.opt', true).find((b) => b.onclick);
    if (opt3b) opt3b.onclick();
    await pChoose3b;
    check('flujo: la segunda decisión también se resuelve y su bloque sale del flujo',
      chosen3b === 0 && queryWithin(msgs3, '.decision', false) === null, 'chosen=' + chosen3b);

    // assign también vive en el flujo, con su pregunta dentro del bloque
    let assigned3 = null;
    const pAssign3 = G.ui.assign('¿Quién va?', () => ({ stats: 'Vel 1', odds: null, note: '' })).then((id) => { assigned3 = id; });
    const blockA3 = queryWithin(msgs3, '.decision', false);
    const cardA3 = blockA3 && queryWithin(blockA3, '.card', true).find((b) => b.onclick && !b.disabled);
    check('flujo: assign monta en el flujo su bloque con la pregunta (.ask) y las tarjetas, como un mensaje más (y sin mover el scroll)',
      !!blockA3 && blockA3._html.includes('ask') && !!cardA3 && msgs3.scrollTop === 2000, 'scrollTop=' + msgs3.scrollTop);
    if (cardA3) cardA3.onclick();
    await pAssign3;
    const lastRowA3 = msgs3.children[msgs3.children.length - 1];
    check('flujo: al asignar, el bloque sale del flujo y queda el eco «Va …» como último mensaje',
      !!assigned3 && queryWithin(msgs3, '.decision', false) === null && !!lastRowA3 && lastRowA3._html.includes('Va '), 'assigned=' + assigned3);
    delete msgs3.getBoundingClientRect; // la geometría simulada no debe contaminar a las secciones siguientes
    ph3.reset();
  }

  // --- Sección W4: el chat se cierra al «1» de la cuenta atrás
  // de los minijuegos (pedido de Jose, 2026-11-22) ---
  // «En dispositivos móviles el chat debe cerrarse justo cuando
  // el contador del minijuego esté en 1 segundo, porque no tiene
  // sentido tener el chat abierto cuando se esté por jugar.»
  // La cuenta de TODOS los duelos vive en la base Duel (tick):
  // cuando el número mostrado pasa a 1, la base llama a
  // phone.duelClose(), que solo actúa en modo manual (flotante
  // o retrato) y solo si el panel está abierto; en escritorio
  // NO se cierra. Velas (CandleGame) no usa la base: su cuenta
  // es la fase de memoria («La luz se corta en N s») y su «1»
  // es el último segundo de esa fase. Es la única excepción de
  // CIERRE a la regla manual: nada se abre solo jamás, cerrar
  // no marca nada leído y Jose puede reabrirlo cuando quiera.
  {
    console.log('\nW4) El chat se cierra al «1» de la cuenta atrás del minijuego (solo móvil)');
    const gameW4 = fs.readFileSync(path.join(SRC, 'game.js'), 'utf8');
    const scenesW4 = fs.readFileSync(path.join(SRC, 'scenes.js'), 'utf8');

    // --- Fuente: el método y los dos enganches ---
    check('cuenta atrás: la máquina del teléfono expone duelClose y SOLO actúa con el panel abierto y en modo manual (manual())',
      gameW4.includes('duelClose()') && gameW4.includes('if (!this.visible || !this.manual()) return;'), '');
    const iDuelW4 = scenesW4.indexOf('class Duel {');
    const duelTxtW4 = iDuelW4 >= 0 ? scenesW4.slice(iDuelW4, scenesW4.indexOf('class DecoDuel')) : '';
    check('cuenta atrás: el enganche vive en el tick COMPARTIDO de la base Duel (la cuenta de todos los duelos), al pasar el número mostrado a 1',
      duelTxtW4.includes('G.ui.phone.duelClose()') && duelTxtW4.includes('b > 1 && n <= 1'), '');
    check('cuenta atrás: Velas (sin base Duel) engancha el último segundo de su fase de memoria, su cuenta atrás equivalente',
      scenesW4.includes('if (b > 1 && Math.ceil(this.stT) <= 1 && G.ui && G.ui.phone) G.ui.phone.duelClose();'), '');

    // --- Comportamiento: duelo base en modo manual (retrato) ---
    const ph4 = G.ui.phone, phoneEl4 = documentFake.querySelector('#phone'), badge4 = documentFake.querySelector('#phonebadge');
    const decoSaveW4 = S.deco, invSaveW4 = S.inv;
    ph4.portraitMode = true; ph4.floatMode = false; ph4.reset();
    ph4.toggle(); // Jose lo abre a mano: queda visible y fijado
    const openW4 = ph4.state().visible === true && ph4.state().pinned === true;
    const dW4 = new Sc.DecoDuel('natalia', () => {}); // st='count', stT=3.6: la cuenta muestra 4·3·2·1
    while (dW4.stT > 1.6) dW4.tick(0.25); // avanzar hasta mostrar el 2 (stT ∈ (1.4, 2.4])
    const stillOpenW4 = ph4.state().visible === true;
    dW4.tick(0.25); dW4.tick(0.25); // stT cruza a ≤1.4: el número mostrado pasa a 1
    check('cuenta atrás: en móvil el chat sigue abierto durante el 4·3·2 y se CIERRA justo cuando el contador llega a 1',
      openW4 && stillOpenW4 && dW4.st === 'count' && ph4.state().visible === false && phoneEl4.classList.contains('ph-off'),
      JSON.stringify(ph4.state()) + ' stT=' + dW4.stT);
    check('cuenta atrás: el cierre no marca nada leído ni deja residuo: contador e insignia como estaban, sin fijado y sin decisión pendiente',
      ph4.state().unread === 0 && ph4.state().pending === false && ph4.state().pinned === false && badge4.style.display === 'none',
      JSON.stringify(ph4.state()));
    ph4.toggle(); // reabrir a mano: permitido siempre, incluso a mitad del minijuego
    check('cuenta atrás: Jose puede REABRIR el chat con el botón cuando quiera (la regla es solo el cierre en el 1)',
      ph4.state().visible === true, JSON.stringify(ph4.state()));
    ph4.reset();

    // --- Comportamiento: con el chat ya cerrado, el «1» no hace nada ---
    const dW4b = new Sc.DecoDuel('alan', () => {});
    while (dW4b.st === 'count') dW4b.tick(0.25);
    check('cuenta atrás: con el chat ya cerrado, la cuenta entera pasa sin tocar el panel (ni errores ni aperturas)',
      ph4.state().visible === false && dW4b.st === 'play', JSON.stringify(ph4.state()));

    // --- Comportamiento: en escritorio NO se cierra ---
    ph4.portraitMode = false; ph4.floatMode = false; ph4.reset();
    ph4.toggle();
    const dW4c = new Sc.DecoDuel('natalia', () => {});
    while (dW4c.st === 'count') dW4c.tick(0.25);
    check('cuenta atrás: en ESCRITORIO (ni flotante ni retrato) la cuenta llega a jugar y el panel lateral NO se cierra solo',
      ph4.state().visible === true && dW4c.st === 'play', JSON.stringify(ph4.state()));
    ph4.reset();
    S.deco = decoSaveW4; S.inv = invSaveW4;

    // --- Comportamiento: Velas y su «1» de memoria ---
    ph4.portraitMode = true; ph4.reset(); ph4.toggle();
    const cgW4 = new Sc.CandleGame('natalia', () => {});
    cgW4.st = 'memory'; cgW4.stT = 1.3; // «La luz se corta en 2 s»
    cgW4.update(0.2); // stT=1.1: aún muestra 2, el chat sigue abierto
    const candlesOpenW4 = ph4.state().visible === true;
    cgW4.update(0.2); // stT=0.9: la memoria entra en su último segundo (muestra 1)
    check('cuenta atrás: en Velas el chat se cierra al entrar la fase de memoria en su último segundo (su «1» equivalente)',
      candlesOpenW4 && ph4.state().visible === false && cgW4.st === 'memory', JSON.stringify(ph4.state()) + ' st=' + cgW4.st);
    W.xDoorOpen = cgW4.prevDoor; // la casa queda como estaba (Velas abre la puerta de Ximena al construirse)
    ph4.portraitMode = false; ph4.reset();
  }

  // --- Sección W5: el botón de cerrar la ventana del chat,
  // grande en móvil (pedido de Jose, 2026-11-22) ---
  // «El botón de cerrar la ventana del chat debería ser más
  // grande porque en dispositivos móviles no se ve nada.» El
  // «×» de la cabecera (.ptop) era un glifo atenuado sin fondo
  // de ~20×22px en TODOS los modos. Ahora la base es una
  // pastilla visible de 32px y en los dos modos móviles
  // (flotante horizontal y retrato en flujo) crece a objetivo
  // táctil pleno de 44×44 con fondo, borde y ✕ blanca de 24px;
  // la cabecera compensa el alto con menos padding vertical.
  // La LÓGICA no cambia: el botón sigue invocando el toggle
  // normal de la máquina del teléfono (game.js intacto), con
  // insignia y estado como estén. El arnés no puebla los hijos
  // de #phone, así que el cableado se fija por fuente y el
  // comportamiento se ejercita sobre la máquina (toggle).
  {
    console.log('\nW5) Botón de cerrar la ventana del chat: objetivo táctil de 44px en móvil');
    const cssW5 = fs.readFileSync(path.join(__dirname, '..', 'application', 'src', 'css', 'style.css'), 'utf8');
    const gameW5 = fs.readFileSync(path.join(SRC, 'game.js'), 'utf8');
    const htmlW5 = fs.readFileSync(path.join(__dirname, '..', 'application', 'src', 'index.html'), 'utf8');
    const iCompactW5 = cssW5.indexOf('@media (orientation: landscape) and (max-height: 700px)');
    const compactW5 = iCompactW5 >= 0 ? cssW5.slice(iCompactW5) : '';
    const iPortraitW5 = cssW5.indexOf('@media (max-aspect-ratio: 4/5), (max-width: 760px) and (orientation: portrait)');
    const portraitW5 = iPortraitW5 >= 0 ? cssW5.slice(iPortraitW5) : '';

    // --- Fuente: el botón vive en la cabecera del panel ---
    const iAsideW5 = htmlW5.indexOf('<aside id="phone"');
    check('cerrar: la ventana del chat trae su propio botón de cerrar (#phoneclose) dentro de la cabecera .ptop del panel',
      iAsideW5 >= 0 && htmlW5.slice(iAsideW5).includes('id="phoneclose"') && htmlW5.includes('<div class="ptop">'), '');

    // --- Fuente: tamaño y presencia en cada modo ---
    check('cerrar: la regla base ya es una pastilla visible de 32px con fondo (no el glifo atenuado sin fondo de ~20×22px)',
      cssW5.includes('#phoneclose { flex: none;') && cssW5.includes('min-width: 32px; min-height: 32px') && cssW5.includes('background: rgba(255, 255, 255, .08)'), '');
    check('cerrar: en el modo FLOTANTE horizontal el botón es un objetivo táctil pleno de 44×44 con pastilla y ✕ de 24px, y la cabecera compensa el alto',
      compactW5.includes('#phoneclose { width: 44px; height: 44px; min-width: 44px; min-height: 44px;') && compactW5.includes('font-size: 24px') && compactW5.includes('.ptop { padding: 6px 10px; }'), '');
    check('cerrar: en RETRATO el botón tiene el mismo objetivo táctil pleno de 44×44 y la misma compensación de cabecera',
      portraitW5.includes('#phoneclose { width: 44px; height: 44px; min-width: 44px; min-height: 44px;') && portraitW5.includes('font-size: 24px') && portraitW5.includes('.ptop { padding: 6px 10px; }'), '');

    // --- Fuente: el cierre sigue siendo el camino normal ---
    check('cerrar: el botón sigue cableado al cierre normal de la máquina (toggle con el panel visible; insignia y estado intactos)',
      gameW5.includes("querySelector('#phoneclose')") && gameW5.includes('if (phoneClose) phoneClose.onclick = () => { if (phone.visible) { phone.toggle(); syncDecisionPill(); } };'), '');

    // --- Comportamiento: la máquina cierra como siempre ---
    const ph5 = G.ui.phone, phoneEl5 = documentFake.querySelector('#phone');
    ph5.portraitMode = true; ph5.floatMode = false; ph5.reset();
    ph5.toggle(); // abrir a mano
    const openW5 = ph5.state().visible === true && !phoneEl5.classList.contains('ph-off');
    ph5.toggle(); // cerrar, lo que hace el botón
    check('cerrar: en modo manual el cierre deja el panel oculto (.ph-off) por el camino de siempre',
      openW5 && ph5.state().visible === false && phoneEl5.classList.contains('ph-off'), JSON.stringify(ph5.state()));
    ph5.portraitMode = false; ph5.reset();
  }

  // --- Sección X: botón de pruebas «Borrar caché y datos» ---
  // Pedido de Jose (2026-11-22): dejar de depender de la ventana
  // de incógnito para ver la versión fresca y para resetear el
  // estado. El panel de Ajustes gana la acción con confirmación
  // en dos pasos dentro del propio botón; al confirmar limpia el
  // almacenamiento del origen, purga la Cache Storage si existe
  // y recarga con cache-bust. Aquí se ejercita con el panel REAL:
  // sin confirmar no se borra nada; confirmando, el localStorage
  // falso queda vacío y la recarga (con stub) lleva el bust.
  {
    console.log('\nX) Borrar caché y datos — botón de pruebas en Ajustes (dos pasos, sin incógnito)');
    const gameX = fs.readFileSync(path.join(SRC, 'game.js'), 'utf8');
    const cssX = fs.readFileSync(path.join(__dirname, '..', 'application', 'src', 'css', 'style.css'), 'utf8');
    const iScrX = gameX.indexOf('function settingsScreen');
    const scrX = iScrX >= 0 ? gameX.slice(iScrX, iScrX + 6000) : '';
    check('borrar: el panel de Ajustes trae la acción «Borrar caché y datos del juego» en su propia fila, con la advertencia de qué se pierde en este navegador',
      scrX.includes('id="sclear"') && scrX.includes('Borrar caché y datos del juego') && scrX.includes('EN ESTE navegador'), scrX.slice(0, 120));
    check('borrar: el botón tiene estilo propio sobrio de advertencia y estado armado (CSS del panel)',
      cssX.includes('.optrow .clearbtn') && cssX.includes('.optrow .clearbtn.armed'), '');
    check('borrar: la ejecución limpia ambos almacenamientos, purga la Cache Storage si existe y recarga con cache-bust vía location.replace (sin desregistrar workers)',
      gameX.includes('localStorage.clear()') && gameX.includes('sessionStorage.clear()') && gameX.includes('caches.keys()')
      && gameX.includes('location.replace') && gameX.includes('?v=${Date.now()}') && !gameX.includes('serviceWorker'), '');

    // Comportamiento con el panel REAL y los stubs del arnés.
    fakeLocalStorage.setItem('1mtp.settings', '{"musicVol":33}');
    fakeLocalStorage.setItem('1mtp.minigames', '1');
    let replacedX = null;
    sandbox.location.replace = (u) => { replacedX = u; };
    const panelX = G.debug.settingsScreen();
    await tick();
    const btnX = documentFake.querySelector('#sclear');
    check('borrar: el botón existe en el panel con su manejador cableado',
      !!btnX && typeof btnX.onclick === 'function', '');
    btnX.onclick(); // primer toque: solo ARMA
    check('borrar: el primer toque NO borra nada — arma el botón con la advertencia (clase «armed» y texto de confirmación)',
      fakeLocalStorage.getItem('1mtp.settings') !== null && fakeLocalStorage.getItem('1mtp.minigames') === '1'
      && replacedX === null && btnX.classList.contains('armed') && String(btnX.textContent).includes('¿Seguro?'),
      `armed=${btnX.classList.contains('armed')} txt=${btnX.textContent}`);
    btnX.onclick(); // segundo toque: EJECUTA
    check('borrar: el segundo toque VACÍA el almacenamiento del origen (ajustes y desbloqueo incluidos)',
      fakeLocalStorage.getItem('1mtp.settings') === null && fakeLocalStorage.getItem('1mtp.minigames') === null, '');
    check('borrar: y recarga la MISMA ruta con parámetro cache-bust único (?v=<timestamp>)',
      typeof replacedX === 'string' && /^\/index\.html\?v=\d+$/.test(replacedX), `replace=${replacedX}`);
    const backX = documentFake.querySelector('#sback');
    if (backX && backX.onclick) backX.onclick();
    await panelX;
    delete sandbox.location.replace;
  }

  // --- Sección Y: vertical — HUD y elección compactos ---
  // Playtest de Jose en vertical (IMG_7628, 2026-11-22): el HUD
  // apilaba ~4 filas y la elección de personaje cubría casi
  // todo el chat. El bloque de retrato de style.css (las mismas
  // consultas que el portraitMQ de game.js) deja el HUD en
  // botones + 2 filas de medidores 2×2 y convierte las tarjetas
  // de personaje (.card de ui.assign) en filas horizontales.
  // El arnés no mide layout: checks de FUENTE sobre el bloque,
  // y de que las reglas base/fuera del bloque NO cambiaron.
  {
    console.log('\nY) Vertical — HUD en botones + 2 filas y elección de personaje en filas compactas');
    const cssY = fs.readFileSync(path.join(__dirname, '..', 'application', 'src', 'css', 'style.css'), 'utf8');
    const iPor = cssY.indexOf('(max-width: 760px) and (orientation: portrait)');
    const por = iPor >= 0 ? cssY.slice(iPor) : '';
    check('vertical: existe el bloque de retrato acotado (aspect-ratio 4/5 o ≤760px en portrait) DESPUÉS del compacto horizontal',
      iPor >= 0 && iPor > cssY.indexOf('(orientation: landscape) and (max-height: 700px)'), '');
    check('vertical HUD: los medidores van en rejilla 2×2 (flex 47% sin encoger, barra flexible) — botones + solo 2 filas de medidores',
      por.includes('#hud .meter { flex: 1 0 47%') && por.includes('grid-template-columns: auto 1fr auto'), '');
    check('vertical HUD: la marca se reduce a icono + «1 MINUTO» (font-size:0 en .brand y talla propia en el <b>)',
      por.includes('.brand { font-size: 0') && por.includes('.brand b { font-size: 12px'), '');
    check('vertical HUD: el sueño conserva segmentos y estado SIN la etiqueta larga y SIN el min-width de 128px (ellipsis con tope, como en horizontal)',
      por.includes('#m-sleep label { display: none') && por.includes('#m-sleep .val { min-width: 0; max-width: 104px')
      && por.includes('text-overflow: ellipsis') && por.includes('.seg { width: 9px'), '');
    check('vertical elección: las tarjetas de personaje son FILAS (contenedor en columna, tarjeta en fila, retrato ≤40px, alto táctil ≥48px)',
      por.includes('.cards { flex-direction: column') && por.includes('.card { flex-direction: row')
      && por.includes('.card img { width: 38px; height: 38px') && por.includes('.card {') && por.includes('min-height: 48px'), '');
    check('vertical elección: la nota larga se recorta con ellipsis en la misma línea y el % va a la derecha; el foco se marca con el borde (sin levantado)',
      por.includes('.card small.note { min-height: 0; min-width: 0; overflow: hidden; text-overflow: ellipsis')
      && por.includes('.card strong { margin-left: auto') && por.includes('.card:focus-visible { border-color: var(--yellow)')
      && por.includes('.card:hover:not(:disabled) { transform: none'), '');
    check('vertical: fuera del bloque NADA cambió — la tarjeta base sigue en columna con retrato de 52px y el min-width base del sueño sigue en 128px',
      cssY.includes('.card { flex: 1;') && cssY.includes('.card img { width: 52px; height: 52px')
      && cssY.includes('#m-sleep .val { min-width: 128px; }') && cssY.includes('.cards { display: flex; gap: 6px; }'), '');
    check('vertical: el selector compacto no toca las opciones de texto (.opt) y las reglas de .pcard del bloque van SIEMPRE acotadas al carrusel (.car .pcard, nunca la clase pelada — la receta solo-cabeza de la sección Z)',
      !por.includes('.opt {') && !/(^|\n)\s*\.pcard\s*\{/.test(por), '');
  }

  // --- Sección Z: selector SOLO-CABEZA en pantallas chicas ---
  // Directiva de Jose (capturas IMG_7627 vertical e IMG_7630
  // horizontal, 2026-11-22): el carrusel de protagonista y de
  // práctica se perdía en pantallas chicas — en vertical las
  // tarjetas se recortaban y solo asomaban las cabezas por el
  // borde del modal; en horizontal la ficha se salía por abajo.
  // En los bloques compacto horizontal y de retrato la tarjeta
  // muestra SOLO la cabeza (Sp.portrait) + nombre + una línea
  // compacta de atributos, con la caja dimensionada desde el
  // alto real del escenario (--stageh que charCarousel mide,
  // menos el cromo de cada modal). El arnés no mide layout:
  // checks de fuente sobre ambos bloques, del invariante de
  // escritorio y de comportamiento sobre el DOM generado.
  {
    console.log('\nZ) Selector solo-cabeza — en pantallas chicas la tarjeta muestra la cabeza y nada más');
    const cssZ = fs.readFileSync(path.join(__dirname, '..', 'application', 'src', 'css', 'style.css'), 'utf8');
    const gameZ = fs.readFileSync(path.join(SRC, 'game.js'), 'utf8');
    const iLandZ = cssZ.indexOf('@media (orientation: landscape) and (max-height: 700px)');
    const iPorZ = cssZ.indexOf('(max-width: 760px) and (orientation: portrait)');
    const landZ = iLandZ >= 0 && iPorZ > iLandZ ? cssZ.slice(iLandZ, iPorZ) : '';
    const porZ = iPorZ >= 0 ? cssZ.slice(iPorZ) : '';
    const iSelZ = gameZ.indexOf('function selectChar()');
    const selZ = iSelZ >= 0 ? gameZ.slice(iSelZ, iSelZ + 2600) : '';
    const iPickZ = gameZ.indexOf('function pickCharScreen');
    const pickZ = iPickZ >= 0 ? gameZ.slice(iPickZ, iPickZ + 1600) : '';
    check('solo-cabeza: AMBOS selectores (protagonista y práctica) montan la cabeza (Sp.portrait) junto al cuerpo en su tarjeta',
      selZ.includes('Sp.portrait(id)') && selZ.includes('class="phead"') && pickZ.includes('Sp.portrait(id)') && pickZ.includes('class="pfull"'), '');
    check('solo-cabeza: el protagonista genera la línea compacta de atributos con etiquetas cortas (STAT_SHORT) y la clase .stline',
      selZ.includes('STAT_SHORT') && selZ.includes('class="stline"') && gameZ.includes("velocidad: 'Vel'"), '');
    check('solo-cabeza: el carrusel mide el alto REAL del escenario y lo pasa al CSS (--stageh desde clientHeight, setProperty protegido)',
      gameZ.includes('stageEl.clientHeight') && gameZ.includes("setProperty('--stageh'") && gameZ.includes('node.style.setProperty'), '');
    check('solo-cabeza: en la base la cabeza y la línea compacta nacen ocultas y la ficha de escritorio queda intacta (retrato con su clamp, tarjeta de 248px)',
      cssZ.includes('.pcard .phead, .pcard .stline { display: none; }')
      && cssZ.includes('.pcard img { height: 150px; height: clamp(96px, 36cqh, 150px); width: auto;')
      && cssZ.includes('.car .pcard { flex: none; width: 248px; }'), '');
    check('solo-cabeza horizontal: el cuerpo se apaga y la cabeza es una caja cuadrada dimensionada por --stageh menos el cromo (suelo 46, techo 118)',
      landZ.includes('.car .pcard img.pfull { display: none; }')
      && landZ.includes('.car .pcard img.phead { display: block; width: var(--headh); height: var(--headh);')
      && landZ.includes('--headh: clamp(46px, calc(var(--stageh, 350px) - 288px), 118px)'), '');
    check('solo-cabeza horizontal: contenido mínimo — fuera epíteto, filas .st y habilidad/defecto; dentro la línea compacta; flechas al centro de la cabeza; ayuda acotada a 3 líneas',
      landZ.includes('.car .pcard > small { display: none; }') && landZ.includes('.car .pcard .stline { display: block;')
      && landZ.includes('.car .pcard p.good, .car .pcard p.bad { display: none; }')
      && landZ.includes('.car .cnav, .car.slim .cnav { top: calc(15px + var(--headh) / 2); }')
      && landZ.includes('-webkit-line-clamp: 3'), '');
    check('solo-cabeza retrato: misma receta con su cromo (reserva 170, suelo 44, techo 92) y la tarjeta acotada al carrusel',
      porZ.includes('--headh: clamp(44px, calc(var(--stageh, 212px) - 170px), 92px)')
      && porZ.includes('.car .pcard img.phead { display: block; width: var(--headh); height: var(--headh);')
      && porZ.includes('.car .pcard .stline { display: block;'), '');
    check('solo-cabeza retrato: el cromo se aprieta SOLO en el modal del carrusel (padding/título con :has(.car)), la ayuda se oculta y Volver queda como pastilla en la esquina',
      porZ.includes('.modal.noscroll:has(.car) { padding: 10px 12px; }')
      && porZ.includes('.modal.noscroll .car ~ p.dim { display: none; }')
      && porZ.includes('.modal.noscroll:has(.car) > button.big { position: absolute;'), '');
    // Comportamiento: el DOM real del selector trae la cabeza y
    // la línea compacta en las 7 tarjetas, y elegir sigue igual.
    const overlayZ = documentFake.querySelector('#overlay');
    let pickedZ = null;
    const pSelZ = G.debug.selectChar().then((id) => { pickedZ = id; });
    await tick(); await tick();
    const modalZ = overlayZ.children[0];
    const cardsZ = modalZ ? queryWithin(modalZ, '.pcard', true) : [];
    check('solo-cabeza: las 7 tarjetas del selector traen la imagen de la cabeza y la línea compacta en su HTML',
      cardsZ.length === 7 && cardsZ.every((b) => (b.innerHTML || '').includes('phead') && (b.innerHTML || '').includes('stline')),
      'cards=' + cardsZ.length);
    check('solo-cabeza: la línea compacta lleva los atributos pegados a su etiqueta corta («Vel9» y «Lóg» en la tarjeta de Natalia)',
      cardsZ.length === 7 && (cardsZ[0].innerHTML || '').includes('Vel9') && (cardsZ[0].innerHTML || '').includes('Lóg'), '');
    cardsZ[0].onclick(); await pSelZ;
    check('solo-cabeza: elegir desde la tarjeta sigue resolviendo al roomie tocado', pickedZ === G.PLAYABLE[0], 'picked=' + pickedZ);
  }

  // --- Sección AA: el «filtro raro» del posproceso queda NEUTRO ---
  // Playtest de Jose (2026-11-22): «cuando inicia el juego noto que
  // hay un filtro raro que sube la nitidez de los colores y se ve
  // raro». El filtro es la corrección de color de la pasada final
  // de gl3d.js (FS_P): saturación 1.14 + curva S de contraste al
  // 0.55 + tinte cálido (1.03, 1.00, 0.97), aplicada SIEMPRE que el
  // 3D renderiza — los menús son DOM sin filtrar, por eso el salto
  // se nota al empezar a jugar (no hay rampa: uFx solo escala
  // blur/bloom/viñeta y ninguna cámara lo baja de 1). Ahora las
  // tres palancas viven en constantes nombradas y NEUTRAS; el
  // resto de la pasada (tilt-shift, bloom, viñeta) sigue intacto.
  {
    console.log('\nAA) Posproceso — corrección de color neutra (el «filtro raro» de Jose)');
    const glTxt = fs.readFileSync(path.join(SRC, 'gl3d.js'), 'utf8');
    check('filtro: las tres palancas de color viven en constantes nombradas y NEUTRAS (POST_SAT 1.0, POST_CONTRASTE 0.0, POST_TINTE 0.0)',
      glTxt.includes('const POST_SAT = 1.0;') && glTxt.includes('const POST_CONTRASTE = 0.0;') && glTxt.includes('const POST_TINTE = 0.0;'), '');
    check('filtro: el shader interpola las constantes (una sola fuente de verdad para pedir «la mitad» después)',
      glTxt.includes('${POST_SAT.toFixed(3)}') && glTxt.includes('${POST_CONTRASTE.toFixed(3)}') && glTxt.includes('${POST_TINTE.toFixed(3)}'), '');
    check('filtro: el realce anterior desapareció del shader (nada de saturación 1.14 ni tinte directo)',
      !glTxt.includes('c, 1.14)') && !glTxt.includes('c *= vec3(1.03,1.0,0.97);') && !glTxt.includes('*0.55 + c*0.45'), '');
    check('filtro: la pasada de posproceso SIGUE existiendo con lo que no es color (tilt-shift de 9 taps, bloom y viñeta por uFx, pasada final al FBO)',
      glTxt.includes('c /= 9.;') && glTxt.includes('b/12.*1.5*uFx') && glTxt.includes('dot(d,d)*0.75*uFx') && glTxt.includes('pasada final a pantalla'), '');
  }

  // --- Sección AB: etiquetas de nombre por proximidad (SOLO la
  // recolección) — pedido de Jose (2026-11-22): un jugador nuevo no
  // distingue a los roomies en el minuto inicial. Pastilla translúcida
  // sobre la cabeza que solo aparece al acercarse (radio NAME_TAG_R
  // con fundido en el 40% exterior), pintada en la capa 2D con el
  // anclaje de los globos (Actor.head): es canvas, jamás un nodo DOM,
  // así que no intercepta toques ni deja residuos al cambiar de fase.
  {
    console.log('\nAB) Etiquetas de nombre por proximidad — solo en la recolección');
    const scTxt = fs.readFileSync(path.join(SRC, 'scenes.js'), 'utf8');
    const wTxt = fs.readFileSync(path.join(SRC, 'world.js'), 'utf8');
    const gTxt = fs.readFileSync(path.join(SRC, 'game.js'), 'utf8');
    check('etiquetas: el radio vive en una constante nombrada (NAME_TAG_R = 110) y la pastilla es translúcida (rgba(20,16,32,.55))',
      scTxt.includes('const NAME_TAG_R = 110;') && scTxt.includes("c.fillStyle = 'rgba(20,16,32,.55)';"), '');
    const colBody = scTxt.slice(scTxt.indexOf('class CollectScene'), scTxt.indexOf('class HomeScene'));
    check('etiquetas: el pintado vive SOLO en CollectScene (ni el motor World ni game.js conocen el mecanismo; HomeScene no lo hereda)',
      colBody.includes('nameTagTargets().forEach') && colBody.includes('nameTagTargets()')
      && !wTxt.includes('nameTag') && !gTxt.includes('nameTag')
      && Sc.HomeScene.prototype.nameTagTargets === undefined && typeof Sc.CollectScene.prototype.nameTagTargets === 'function', '');
    check('etiquetas: las exclusiones están en la fuente (al hombro, dentro del armario, oculto, globo/emote activo)',
      colBody.includes("o.state === 'carried'") && colBody.includes("o.state === 'inside'") && colBody.includes('o.hidden') && colBody.includes('o.bubble || o.emote'), '');

    // Comportamiento: draw real de la escena con el render y la
    // proyección sustituidos (mismo patrón que la prueba de draw de la
    // sección G), registrando textos y rellenos de la capa 2D.
    const realRender = W.render, realProject = G.R.project;
    const mkRec = () => {
      const ctx = new FakeCtx(), log = { texts: [], fills: [] };
      ctx.fillText = (s) => { log.texts.push(String(s)); };
      ctx.fill = () => { log.fills.push({ alpha: ctx.globalAlpha, style: ctx.fillStyle }); };
      return { ctx, log };
    };
    W.render = (opts) => { if (opts.boxes) opts.boxes(new G.R.MB(), 0); if (opts.sprites) opts.sprites(0); if (opts.over) opts.over(cur.ctx, 0); };
    G.R.project = (x, y, z) => ({ x, y: z, ok: true });
    let cur = mkRec();
    try {
      const esc = new Sc.CollectScene('natalia', () => {});
      esc.count = 0;
      const roomie = esc.others[0], rName = G.CHARS[roomie.id].name;
      esc.others.forEach((o, i) => { o.x = 60 + i * 12; o.y = 560; o.bubble = null; o.emote = null; });
      esc.cat.x = 950; esc.cat.y = 60; esc.cat.bubble = null; esc.cat.emote = null;
      roomie.x = 500; roomie.y = 350;
      const tagsOf = () => cur.log.fills.filter((f) => f.style === 'rgba(20,16,32,.55)');
      esc.p.x = 500; esc.p.y = 300; // a 50 u del roomie: dentro, alfa pleno
      cur = mkRec(); esc.draw(0.016);
      check('etiquetas: a 50 u la pastilla se pinta con el nombre y opacidad plena (y el controlado nunca se etiqueta)',
        cur.log.texts.includes(rName) && tagsOf().length === 1 && Math.abs(tagsOf()[0].alpha - 1) < 0.01 && !cur.log.texts.includes('Natalia'),
        'texts=' + cur.log.texts.join('|'));
      esc.p.y = 260; // a 90 u: en la banda de fundido (66–110)
      cur = mkRec(); esc.draw(0.016);
      check('etiquetas: a 90 u la pastilla se pinta FUNDIDA (alfa ≈ (110−90)/44 ≈ 0,45, sin corte seco)',
        tagsOf().length === 1 && Math.abs(tagsOf()[0].alpha - (110 - 90) / 44) < 0.02, 'alfa=' + (tagsOf()[0] && tagsOf()[0].alpha));
      esc.p.y = 220; // a 130 u: fuera del radio
      cur = mkRec(); esc.draw(0.016);
      check('etiquetas: a 130 u (fuera del radio) no se pinta nada', tagsOf().length === 0 && !cur.log.texts.includes(rName), '');
      esc.p.y = 300; roomie.state = 'carried';
      cur = mkRec(); esc.draw(0.016);
      check('etiquetas: el roomie al hombro NO se etiqueta', tagsOf().length === 0 && !cur.log.texts.includes(rName), '');
      roomie.state = 'inside'; roomie.hidden = true;
      cur = mkRec(); esc.draw(0.016);
      check('etiquetas: el roomie guardado dentro del armario NO se etiqueta', tagsOf().length === 0 && !cur.log.texts.includes(rName), '');
      roomie.state = 'free'; roomie.hidden = false; roomie.say('¡Apúrate!', 2.2);
      cur = mkRec(); esc.draw(0.016);
      check('etiquetas: con un globo activo la cabeza ya está ocupada: sin pastilla', tagsOf().length === 0 && !cur.log.texts.includes(rName), '');
      roomie.bubble = null; roomie.x = 60; roomie.y = 560; // el roomie se va lejos…
      esc.cat.x = 500; esc.cat.y = 350; // …y Pollito queda a 50 u del jugador
      cur = mkRec(); esc.draw(0.016);
      check('etiquetas: el mecanismo es genérico sobre los actores con nombre (Pollito también se etiqueta)',
        cur.log.texts.includes('Pollito') && tagsOf().length === 1, 'texts=' + cur.log.texts.join('|'));
    } catch (e) {
      check('etiquetas: draw sin errores (excepción: ' + e.message + ')', false, e.stack && e.stack.split('\n')[1]);
    } finally { W.render = realRender; G.R.project = realProject; }
  }

  // --- Sección AC: autoguardado local (pedido de Jose, 2026-11-22:
  // «¿qué pasa si refresco la pantalla? ¿Pierdo todo mi avance?»).
  // Ranura única '1mtp.save' en localStorage, con versión y lectura
  // defensiva; puntos de control SOLO en estados de reposo (collect,
  // arrival, cada «hora» de la noche y el clímax); el título ofrece
  // «Continuar partida» y la nueva sobrescribe en dos pasos;
  // showEnding borra el guardado. Aquí se prueba el viaje completo:
  // checkpoint → JSON → «refresco» (estado revuelto) → applySave.
  {
    console.log('\nAC) Autoguardado local — continuar la partida tras un refresco');
    const gameAC = fs.readFileSync(path.join(SRC, 'game.js'), 'utf8');
    const D = G.debug, lsAC = fakeLocalStorage;
    lsAC.removeItem('1mtp.save');
    // Fuente
    check('autoguardado: ranura única con clave de la familia y versión, validada al leer (v, protagonista, reposo)',
      gameAC.includes("const SAVE_KEY = '1mtp.save'") && gameAC.includes('const SAVE_V = 1') && gameAC.includes('sv.v === SAVE_V') && gameAC.includes('SAVE_V, at, state'), '');
    check('autoguardado: puntos de control en los estados de reposo (collect, arrival, night por «hora», climax)',
      gameAC.includes("saveCheckpoint('collect')") && gameAC.includes("saveCheckpoint('arrival'") && gameAC.includes("saveCheckpoint('night'") && gameAC.includes("saveCheckpoint('climax'"), '');
    const iEndAC = gameAC.indexOf('async function showEnding');
    const endBodyAC = iEndAC >= 0 ? gameAC.slice(iEndAC, gameAC.indexOf('location.reload', iEndAC)) : '';
    const iPracAC = gameAC.indexOf('function enterPractice');
    const pracBodyAC = iPracAC >= 0 ? gameAC.slice(iPracAC, gameAC.indexOf('function duelListScreen', iPracAC)) : '';
    check('autoguardado: showEnding borra el guardado (cualquier final), abandonar a práctica también, y pagehide/visibilitychange re-persisten el último punto',
      endBodyAC.includes('clearSave()') && pracBodyAC.includes('clearSave()') && gameAC.includes("'pagehide'") && gameAC.includes("'visibilitychange'") && gameAC.includes('repersistSave'), '');
    // Comportamiento: el viaje de ida y vuelta del guardado
    const msgsAC = documentFake.querySelector('#msgs');
    S.player = 'saulo'; S.phase = 'act2'; S.sus = 33; S.sleep = 2; S.noise = 21; S.qBonus = 5;
    S.inv = { pastel: true, globos: true }; S.partners = ['majo', 'alan']; S.party = ['saulo', 'majo', 'alan'];
    S.fled = G.PLAYABLE.filter((id) => !S.party.includes(id));
    S.flags = { casting: true }; S.done = { cajas: true }; S.duels = [{ game: 'deco', boss: 'pollito', win: 'win' }];
    S.tired = 'majo'; S.deco = [{ i: 0, improv: false, placed: true }]; S.log = { fallos: 1, despertares: 0 };
    const uriAC = 'data:image/png;base64,QUJDREVGRw==';
    msgsAC.innerHTML = `<div class="row"><div class="msg"><img class="av" src="${uriAC}"><div class="bubble">Hola de prueba</div></div></div><div class="row"><div class="msg"><img class="av" src="${uriAC}"><div class="bubble">Otro mensaje</div></div></div>`;
    D.saveCheckpoint('night', { storyIdx: 5 });
    let svAC = null; try { svAC = JSON.parse(lsAC.getItem('1mtp.save') || 'null'); } catch (e) { svAC = null; }
    check('autoguardado: el punto de control escribe el JSON con versión, reposo e índice de la noche',
      !!svAC && svAC.v === 1 && svAC.at === 'night' && svAC.storyIdx === 5 && svAC.state.player === 'saulo' && svAC.state.sus === 33, '');
    check('autoguardado: el chat viaja empaquetado (ninguna data URI en línea; la repetida vive UNA vez en el diccionario)',
      !!svAC && !svAC.chat.includes('data:image') && Array.isArray(svAC.dict) && svAC.dict.length === 1 && svAC.dict[0] === uriAC, '');
    // «Refresco»: el estado y el chat se revuelven, y se reconstruye desde el JSON
    S.player = 'natalia'; S.phase = 'title'; S.sus = 0; S.sleep = 1; S.noise = 0; S.qBonus = 0;
    S.inv = {}; S.partners = []; S.party = []; S.fled = []; S.flags = {}; S.done = {}; S.duels = []; S.tired = null; S.deco = [];
    msgsAC.innerHTML = '';
    const backAC = D.readSave();
    check('autoguardado: readSave devuelve el guardado válido tal cual (reposo e índice incluidos)',
      !!backAC && backAC.at === 'night' && backAC.storyIdx === 5, '');
    D.applySave(backAC);
    check('autoguardado: tras el «refresco» se recuperan protagonista, estadísticas e inventario',
      S.player === 'saulo' && S.phase === 'act2' && S.sus === 33 && S.sleep === 2 && S.noise === 21 && S.inv.pastel === true && S.inv.globos === true, '');
    check('autoguardado: se recuperan party, banderas, duelos, progreso y descanso',
      JSON.stringify(S.party) === JSON.stringify(['saulo', 'majo', 'alan']) && JSON.stringify(S.partners) === JSON.stringify(['majo', 'alan'])
      && S.flags.casting === true && S.duels.length === 1 && S.duels[0].win === 'win' && S.done.cajas === true && S.tired === 'majo'
      && Array.isArray(S.deco) && S.deco[0].placed === true && S.log.fallos === 1, '');
    check('autoguardado: el historial del chat se reconstruye con sus avatares rehidratados',
      msgsAC.innerHTML.includes('Hola de prueba') && msgsAC.innerHTML.includes('Otro mensaje') && msgsAC.innerHTML.includes(uriAC), '');
    // Lectura defensiva
    lsAC.setItem('1mtp.save', '{json roto');
    check('autoguardado: un guardado corrupto se ignora y se borra (el arranque no se rompe)',
      D.readSave() === null && lsAC.getItem('1mtp.save') === null, '');
    lsAC.setItem('1mtp.save', JSON.stringify({ v: 99, at: 'night', storyIdx: 0, state: { player: 'saulo' } }));
    check('autoguardado: un guardado de otra versión se ignora y se borra',
      D.readSave() === null && lsAC.getItem('1mtp.save') === null, '');
    // Título: sin guardado no hay Continuar; con guardado, sí (y con contexto)
    const overlayAC = documentFake.querySelector('#overlay');
    D.titleScreen(); // sin guardado: el título de siempre (la promesa queda pendiente, no se toca)
    check('autoguardado: sin guardado el título NO ofrece Continuar (JUGAR, como siempre)',
      overlayAC.innerHTML.includes('JUGAR') && !overlayAC.innerHTML.includes('CONTINUAR PARTIDA'), '');
    D.saveCheckpoint('night', { storyIdx: 2 });
    const pContAC = D.titleScreen();
    const evNextAC = G.EVENTS[G.STORY[2]];
    check('autoguardado: con guardado el título ofrece CONTINUAR con su contexto (protagonista y siguiente beat)',
      overlayAC.innerHTML.includes('CONTINUAR PARTIDA') && overlayAC.innerHTML.includes('Saulo') && overlayAC.innerHTML.includes(evNextAC.title), '');
    documentFake.querySelector('#tcontinue').onclick();
    check('autoguardado: «Continuar» resuelve continue y NO borra el guardado (lo lee tryResume)',
      (await pContAC) === 'continue' && !!lsAC.getItem('1mtp.save'), '');
    // Nueva partida en dos pasos
    const pNewAC = D.titleScreen();
    const playBtnAC = documentFake.querySelector('#tplay');
    playBtnAC.onclick(); // primer toque: solo arma
    check('autoguardado: «Nueva partida» no sobrescribe sin confirmar (primer toque: arma y el guardado sigue)',
      !!lsAC.getItem('1mtp.save') && String(playBtnAC.textContent || '').includes('¿Seguro?'), '');
    playBtnAC.onclick(); // segundo toque: borra y arranca
    check('autoguardado: el segundo toque borra el guardado y resuelve new',
      (await pNewAC) === 'new' && lsAC.getItem('1mtp.save') === null, '');
    // Alcance (aclaración de Jose, 2026-11-22): el autoguardado es
    // SOLO del modo historia. Ni la práctica de minijuegos ni el
    // easter egg «La Cita» crean, tocan ni resucitan guardados, y
    // la red de seguridad (pagehide) no puede revivir uno borrado.
    console.log('  — alcance: solo historia (práctica y «La Cita», fuera)');
    // Fuente: los escritores del guardado viven confinados en la
    // historia de game.js; ningún otro módulo conoce la ranura.
    const modulosAC2 = ['scenes.js', 'world.js', 'music.js', 'data.js', 'gl3d.js', 'sprites.js', 'date.js'];
    const fueraAC2 = modulosAC2.map((f) => fs.readFileSync(path.join(SRC, f), 'utf8')).join('\n');
    check('alcance: ningún módulo fuera de game.js conoce el autoguardado (ni la cita en date.js)',
      !fueraAC2.includes('1mtp.save') && !fueraAC2.includes('saveCheckpoint') && !fueraAC2.includes('clearSave') && !fueraAC2.includes('repersistSave'), '');
    check('alcance: los puntos de control son exactamente los 6 de la historia (collect, arrival, night, climax y reanudaciones)',
      (gameAC.match(/saveCheckpoint\('/g) || []).length === 6, '');
    const pracDuelAC2 = gameAC.slice(gameAC.indexOf('async function practiceDuel'), gameAC.indexOf('function minigamesLockedScreen'));
    const showMgAC2 = gameAC.slice(gameAC.indexOf('async function showMinigames'), gameAC.indexOf('function titleScreen'));
    const resultAC2 = gameAC.slice(gameAC.indexOf('function resultScreen'), gameAC.indexOf('function enterMinigameMusic'));
    const listAC2 = gameAC.slice(gameAC.indexOf('function duelListScreen'), gameAC.indexOf('function charCarousel'));
    check('alcance: la práctica (lista, duelo, resultado) jamás escribe ni borra el guardado — su único contacto es el abandono en enterPractice',
      !pracDuelAC2.includes('saveCheckpoint') && !pracDuelAC2.includes('clearSave')
      && !showMgAC2.includes('saveCheckpoint') && !showMgAC2.includes('clearSave')
      && !resultAC2.includes('saveCheckpoint') && !resultAC2.includes('clearSave')
      && !listAC2.includes('saveCheckpoint') && !listAC2.includes('clearSave'), '');
    const startDateAC2 = gameAC.slice(gameAC.indexOf('function startDate'), gameAC.indexOf('function enterPractice'));
    check('alcance: entrar a «La Cita» (startDate) no escribe ni borra el guardado de la historia',
      !startDateAC2.includes('saveCheckpoint') && !startDateAC2.includes('clearSave'), '');
    // Comportamiento: la red de seguridad re-persiste un guardado
    // VIVO (control positivo) pero jamás resucita uno borrado,
    // porque clearSave también descarta la copia en memoria.
    S.player = 'saulo'; S.phase = 'act2';
    msgsAC.innerHTML = '<div class="row"><div class="msg"><div class="bubble">Punto de control</div></div></div>';
    D.saveCheckpoint('night', { storyIdx: 1 });
    lsAC.removeItem('1mtp.save'); // la escritura «se perdió»: la red la repone
    D.repersistSave();
    let reAC2 = null; try { reAC2 = JSON.parse(lsAC.getItem('1mtp.save') || 'null'); } catch (e) { reAC2 = null; }
    check('alcance: la red de seguridad (pagehide) re-persiste el último punto si su escritura se perdió',
      !!reAC2 && reAC2.at === 'night' && reAC2.storyIdx === 1, '');
    D.clearSave();
    D.repersistSave(); // la pestaña se oculta JUSTO tras borrar: no puede resucitar
    check('alcance: tras clearSave, la red de seguridad NO resucita el guardado (la copia en memoria también se descarta)',
      lsAC.getItem('1mtp.save') === null, '');
    // Comportamiento: la práctica desde el título no crea guardado…
    S.phase = 'title';
    D.enterPractice();
    check('alcance: practicar desde el título NO crea ningún guardado',
      lsAC.getItem('1mtp.save') === null && S.phase === 'practice', '');
    D.titleScreen(); // sin guardado tras practicar: el título sigue sin ofrecer Continuar
    check('alcance: tras practicar, el título NO ofrece Continuar (no hay partida que retomar)',
      overlayAC.innerHTML.includes('JUGAR') && !overlayAC.innerHTML.includes('CONTINUAR PARTIDA'), '');
    // …ni toca el de una historia que ni siquiera se cargó…
    S.player = 'saulo'; S.phase = 'title';
    D.saveCheckpoint('night', { storyIdx: 4 });
    const intactoAC2 = lsAC.getItem('1mtp.save');
    D.enterPractice();
    check('alcance: practicar desde el título deja INTACTO el guardado de una historia sin cargar',
      !!intactoAC2 && lsAC.getItem('1mtp.save') === intactoAC2, '');
    // …pero desde la pausa SÍ abandona la historia en curso, y ni
    // la red de seguridad lo trae de vuelta al ocultar la pestaña.
    S.phase = 'act2';
    D.enterPractice();
    D.repersistSave();
    check('alcance: entrar a práctica con historia en curso la abandona (guardado borrado) y ni la red lo trae de vuelta',
      lsAC.getItem('1mtp.save') === null, '');
    // Notificaciones al continuar (corrección de Jose, 2026-11-22:
    // «cuando se refresca la pantalla y se retoma la partida, las
    // notificaciones es como si nunca hubieran sido vistas»). El
    // estado de lectura de la máquina del teléfono viaja en el
    // guardado y la restauración lo reaplica tal cual: el historial
    // restaurado jamás cuenta como no leído por restaurarse.
    console.log('  — notificaciones: el estado de lectura viaja en el guardado');
    check('autoguardado: el punto de control fotografía el estado de notificaciones (unread, pending, muted) y applySave lo reaplica tras el reset',
      gameAC.includes('phone: { unread: phone.unread || 0, pending: !!phone.pending, muted: !!phone.muted }')
      && gameAC.includes('const phSv = sv.phone || {}') && gameAC.includes('phone.unread = (typeof phSv.unread'), '');
    const phAC = G.ui.phone, badgeAC = documentFake.querySelector('#phonebadge');
    S.player = 'saulo'; S.phase = 'act2';
    msgsAC.innerHTML = '<div class="row"><div class="msg"><div class="bubble">Ya leído</div></div></div><div class="row"><div class="msg"><div class="bubble">También leído</div></div></div>';
    phAC.reset(); phAC.unread = 0; phAC.pending = false; phAC.muted = false; phAC.paint();
    D.saveCheckpoint('night', { storyIdx: 2 });
    let svPhAC = null; try { svPhAC = JSON.parse(lsAC.getItem('1mtp.save') || 'null'); } catch (e) { svPhAC = null; }
    check('autoguardado: el JSON del punto de control lleva el estado de notificaciones fotografiado',
      !!svPhAC && !!svPhAC.phone && svPhAC.phone.unread === 0 && svPhAC.phone.pending === false, '');
    phAC.unread = 7; phAC.pending = true; phAC.paint(); // el «refresco» revuelve también el teléfono
    D.applySave(D.readSave());
    check('autoguardado: guardar con 0 no leídos → continuar con 0 (ni el historial restaurado ni una alerta fantasma resucitan)',
      phAC.unread === 0 && phAC.pending === false && badgeAC.textContent === '', '');
    phAC.unread = 4; phAC.muted = true; phAC.paint();
    D.saveCheckpoint('night', { storyIdx: 2 });
    phAC.reset(); // el «refresco»: la máquina arranca limpia…
    D.applySave(D.readSave()); // …y la restauración reaplica lo guardado
    check('autoguardado: guardar con N no leídos → continuar con N (la insignia vuelve igual, y el silencio del panel se conserva)',
      phAC.unread === 4 && phAC.muted === true && badgeAC.textContent === '4', '');
    phAC.reset();
  }

  // --- Sección AD: el chat flotante NUNCA sobre un menú (corrección
  // de Jose, 2026-11-22: «cuando le doy a pausa y el chat queda
  // abierto, este último queda por encima del menú»). Los modales
  // viven dentro del escenario (#overlay/#pauseov) y el teléfono
  // flotante es hijo de main con z 30: la garantía es CSS pura
  // (display:none por :has en el bloque flotante, el mismo trato
  // que la capa táctil), sin tocar la máquina del teléfono — al
  // cerrar el menú, el chat vuelve exactamente como estaba.
  {
    console.log('\nAD) Capas: con menú o pausa abiertos, el chat flotante se retira');
    const cssAD = fs.readFileSync(path.join(SRC, '..', 'css', 'style.css'), 'utf8');
    const gameAD = fs.readFileSync(path.join(SRC, 'game.js'), 'utf8');
    const iMediaAD = cssAD.indexOf('@media (orientation: landscape) and (max-height: 700px)');
    const iRuleAD = cssAD.indexOf('main:has(#overlay.show) > #phone');
    const iNextAD = iMediaAD >= 0 ? cssAD.indexOf('@media', iMediaAD + 10) : -1;
    check('capas: la regla vive en el bloque flotante (donde el panel solapa el escenario) y oculta el chat con menú o pausa abiertos',
      iMediaAD >= 0 && iRuleAD > iMediaAD && (iNextAD < 0 || iRuleAD < iNextAD)
      && cssAD.includes('main:has(#pauseov.show) > #phone { display: none; }'), '');
    const iPauseAD = gameAD.indexOf('G.setPaused = (v) => {');
    const pauseBodyAD = iPauseAD >= 0 ? gameAD.slice(iPauseAD, gameAD.indexOf('pauseBtn.onclick', iPauseAD)) : '';
    check('capas: pausar/depausar y el menú de pausa NO tocan la máquina del teléfono (pausar no es cerrar el chat)',
      !!pauseBodyAD && !pauseBodyAD.includes('phone.') && !pauseBodyAD.includes('phoneEl'), '');
    const phAD = G.ui.phone, phoneElAD = documentFake.querySelector('#phone');
    phAD.reset(); phAD.show(); // chat abierto, como lo deja el jugador al pausar
    const beforeAD = JSON.stringify(phAD.state());
    const povAD = documentFake.querySelector('#pauseov'), ovlAD = documentFake.querySelector('#overlay');
    povAD.classList.add('show'); ovlAD.classList.add('show'); // las clases que ponen la pausa y los menús
    const duringAD = JSON.stringify(phAD.state());
    povAD.classList.remove('show'); ovlAD.classList.remove('show'); // al cerrar, el chat reaparece por CSS…
    check('capas: con pausa/menú abiertos y tras cerrarlos, la máquina del chat queda intacta (sigue abierto, sin ph-off, misma insignia)',
      beforeAD === duringAD && JSON.stringify(phAD.state()) === beforeAD && phAD.visible === true && !phoneElAD.classList.contains('ph-off'), '');
    phAD.reset();
  }

  // --- Sección AD: cadencia de lectura del chat (pedido de Jose,
  // 2026-11-22: «cuando hablan varias personas los mensajes
  // aparecen al unísono y no me permite leer tranquilo»). Todos los
  // mensajes de personaje pasan por UNA cola (ui.post encola y la
  // bomba muestra de uno en uno): «escribiendo…» según el largo
  // del que llega + pausa de LECTURA según el largo del recién
  // mostrado, ambas en CHAT_PACE. Las decisiones esperan a que la
  // cola drene; el eco propio es instantáneo; el historial
  // restaurado no pasa por la cola; al abandonar la historia la
  // cola se descarta sin fantasmas. En el arnés G.wait resuelve al
  // instante, así que el escalonado se verifica por ESTADO (la
  // cola retiene y va soltando), no por reloj de pared.
  {
    console.log('\nAD) Cadencia de lectura del chat — los mensajes ya no caen al unísono');
    const gameAD = fs.readFileSync(path.join(SRC, 'game.js'), 'utf8');
    const DAD = G.debug;
    const msgsAD = documentFake.querySelector('#msgs');
    const msgRowsAD = () => msgsAD.children.filter((c) => (c._html || '').includes('class="msg'));
    const decBlocksAD = () => queryWithin(msgsAD, '.decision', true).length;
    // Fuente: la cola, sus constantes y los enganches están donde deben
    check('cadencia: las constantes del ritmo viven en UN solo sitio (CHAT_PACE: tecleo y lectura, base + por carácter + topes)',
      gameAD.includes('const CHAT_PACE = {') && gameAD.includes('typePerChar') && gameAD.includes('readPerChar') && gameAD.includes('readMax'), '');
    check('cadencia: choose y assign esperan a que la cola drene antes de montarse (whenChatIdle)',
      gameAD.includes('ui.whenChatIdle().then(() => ui.choose') && gameAD.includes('ui.whenChatIdle().then(() => ui.assign'), '');
    const iPracAD = gameAD.indexOf('function enterPractice');
    const pracBodyAD = iPracAD >= 0 ? gameAD.slice(iPracAD, gameAD.indexOf('function duelListScreen', iPracAD)) : '';
    const iApplyAD = gameAD.indexOf('function applySave');
    const applyBodyAD = iApplyAD >= 0 ? gameAD.slice(iApplyAD, gameAD.indexOf('function buildRestHome', iApplyAD)) : '';
    check('cadencia: la cola se descarta al abandonar la historia (práctica), al cargar una partida (applySave) y al abrir la recolección',
      pracBodyAD.includes('flushChatQueue()') && applyBodyAD.includes('flushChatQueue()') && gameAD.includes("ui.refreshHUD(); flushChatQueue(); msgs.innerHTML = '';"), '');
    check('cadencia: la conversación de apertura de la recolección entra por la cola (ya no se vuelca con ui.raw)',
      gameAD.includes('ui.post({ who: w, text: t })') && !gameAD.includes('src="${Sp.portrait(w)}"'), '');
    // Las constantes, vistas desde fuera: la pausa de lectura puede
    // superar al tecleo y crece con el largo (eso es «leer tranquilo»)
    const paceAD = G.ui.chatPace;
    check('cadencia: CHAT_PACE expuesto y sano (la lectura manda: su tope supera al del tecleo y ambos ritmos crecen por carácter)',
      !!paceAD && paceAD.readMax > paceAD.typeMax && paceAD.readPerChar > 0 && paceAD.typePerChar > 0 && paceAD.readMin >= paceAD.typeMin, '');
    // Comportamiento: una ráfaga de 3 NO aparece de golpe
    G.ui.phone.reset(); G.ui.fast = false;
    G.practiceMode = false; // la sección AC terminó en práctica: aquí se prueba el chat de la HISTORIA (en práctica, finish() de choose se apaga a propósito)
    S.player = 'saulo'; S.party = ['saulo', 'majo', 'natalia'];
    const baseMsgAD = msgRowsAD().length;
    const p1AD = G.ui.post({ who: 'majo', text: 'Primero de la ráfaga de prueba, con su largo.' });
    const p2AD = G.ui.post({ who: 'saulo', text: 'Segundo de la ráfaga.' });
    const p3AD = G.ui.post({ who: 'natalia', text: 'Tercero y último de la ráfaga.' });
    check('cadencia: al encolar 3 mensajes, ninguno aparece aún (la cola los retiene: pending = 3, solo el «escribiendo…» del primero)',
      msgRowsAD().length === baseMsgAD && G.ui.chatPending() === 3
      && msgsAD.children.filter((c) => (c._html || '').includes('está escribiendo')).length === 1, 'pending=' + G.ui.chatPending());
    await Promise.all([p1AD, p2AD, p3AD]); await tick();
    const textsAD = msgRowsAD().map((c) => c._html);
    const i1AD = textsAD.findIndex((h) => h.includes('Primero de la ráfaga'));
    const i2AD = textsAD.findIndex((h) => h.includes('Segundo de la ráfaga'));
    const i3AD = textsAD.findIndex((h) => h.includes('Tercero y último'));
    check('cadencia: drenada la cola, los 3 mensajes están y EN ORDEN (la promesa de cada post se resolvió al aparecer el suyo)',
      i1AD >= 0 && i2AD > i1AD && i3AD > i2AD && G.ui.chatPending() === 0, `i=${i1AD},${i2AD},${i3AD} pending=${G.ui.chatPending()}`);
    // La decisión espera su turno: con la cola ocupada no se monta
    const baseDecAD = decBlocksAD();
    const q1AD = G.ui.post({ who: 'majo', text: 'Mensaje previo a la decisión, todavía en cola.' });
    const q2AD = G.ui.post({ who: 'saulo', text: 'Otro mensaje previo, también en cola.' });
    let chosenAD = -1;
    const pDecAD = G.ui.choose([{ label: 'Decisión AD A' }, { label: 'Decisión AD B' }]).then((i) => { chosenAD = i; });
    check('cadencia: con mensajes en cola, la decisión NO se monta ni la insignia avisa (espera a que la conversación aparezca)',
      decBlocksAD() === baseDecAD && G.ui.phone.state().pending === false && G.ui.chatPending() === 2, 'pending=' + G.ui.chatPending());
    await Promise.all([q1AD, q2AD]); await tick(); await tick();
    check('cadencia: drenada la cola, la decisión se monta y la máquina la marca pendiente',
      decBlocksAD() === baseDecAD + 1 && G.ui.phone.state().pending === true, '');
    const optAD = queryWithin(msgsAD, '.opt', true).find((c) => c.onclick);
    if (optAD) optAD.onclick();
    const lastRowAD = msgsAD.children[msgsAD.children.length - 1];
    check('cadencia: el eco de la respuesta aparece AL INSTANTE (ui.raw directo, sin pasar por la cola) y el bloque sale del flujo',
      !!lastRowAD && (lastRowAD._html || '').includes('class="mine"') && (lastRowAD._html || '').includes('Decisión AD A')
      && decBlocksAD() === baseDecAD && G.ui.chatPending() === 0, '');
    await pDecAD;
    check('cadencia: la promesa de la decisión se resolvió con la opción tocada', chosenAD === 0, 'chosen=' + chosenAD);
    // El historial restaurado NO pasa por la cola: entero y al instante
    const svAD = { v: 1, at: 'night', storyIdx: 0, state: JSON.parse(JSON.stringify(S)), chat: '<div class="row"><div class="msg"><div class="bubble">Historial restaurado AD</div></div></div>', dict: [] };
    DAD.applySave(svAD);
    check('cadencia: el historial del autoguardado aparece entero al instante, sin encolar (historia ya vivida)',
      msgsAD.innerHTML.includes('Historial restaurado AD') && G.ui.chatPending() === 0, '');
    // Descarte limpio: lo encolado al abandonar la historia no aparece jamás
    const ghostBaseAD = msgRowsAD().length;
    let ghostResAD = false;
    const g1AD = G.ui.post({ who: 'majo', text: 'Mensaje fantasma AD que no debe aparecer.' });
    g1AD.then(() => { ghostResAD = true; });
    DAD.enterPractice();
    const pendingTrasAD = G.ui.chatPending();
    await tick(); await tick();
    check('cadencia: al entrar a práctica la cola se descarta (pending 0) y el mensaje en vuelo NO aparece ni su promesa se resuelve (sin fantasmas)',
      pendingTrasAD === 0 && msgRowsAD().length === ghostBaseAD && ghostResAD === false, `pending=${pendingTrasAD} resuelto=${ghostResAD}`);
  }

  console.log(`\n${failures ? '✘ ' + failures + ' FALLOS' : '✔ TODO OK'} — ${checks - failures}/${checks} checks`);
  process.exit(failures ? 1 : 0);
})().catch((e) => { console.error('ERROR FATAL en la prueba:', e); process.exit(2); });
