/* ============================================================
   EASTER EGG «LA CITA» — Partes 1 y 2 (feat/easter-egg-cita)
   Modo secreto: se controla a XIMENA en el departamento con
   todos escondidos, sale por la puerta principal y llega a la
   plaza de CDMX (capas parallax + recorte de foto real).
   Parte 2: la Puerta de salida de la plaza (mundo x=4250, donde
   ancla la vista lejana) cruza a la escena de SAN ÁNGEL, una
   segunda franja libre construida con recortes de las imágenes
   de El Libro de la Vida que aportó Jose (assets SOLO-LOCALES
   en assets/date/sanangel/, fuera de git; la escena se juega
   igual si la carpeta no está). Su Puerta del árbol devuelve a
   la plaza: los viajes son para revisión, sin reloj nuevo.
   Especificación: goals/1-minuto-para-la-fiesta/files/
   tecnico-easter-egg-la-cita-v1.md

   - Estado propio en D: NO toca G.S salvo S.phase ('date').
   - Reloj maestro: el <audio> de la canción (assets/audio/,
     FUERA de git); si el archivo no está, reloj de respaldo
     con performance.now() y la secuencia corre en silencio.
   - En esta parte solo se ejecutan la APERTURA (depa, sin
     reloj: la cita arranca al abrir la puerta) y la LLEGADA
     a la plaza (revelado de ~4 s). Tras el revelado la escena
     queda en MODO LIBRE ('free'): Jose pidió revisarla a
     detalle moviendo a los personajes, así que NO se acaba
     sola — se controla a Ximena (TAB alterna con Jose, el
     otro sigue) y se sale a mano desde la pausa. El resto de
     la tabla se ejecutará en las partes siguientes.
   ============================================================ */
(function () {
  'use strict';
  const G = window.G, W = G.World, Sp = G.Sprites;
  const $ = (s) => document.querySelector(s);

  // ---------- El código: solo vive su hash SHA-256 ----------
  let CODE_HASH = 'd8e814928b57cdc2c67ad4cd654968d5c37c4bd482f3c87b600b48d11f95f42d';

  // SHA-256 (FIPS 180-4) en JS puro: la verificación no puede
  // depender de crypto.subtle (ausente en contextos no seguros
  // y en el humo de Node); esta implementación es la única vía
  // y el humo la ejercita con vectores conocidos.
  function sha256hex(ascii) {
    const rr = (v, a) => (v >>> a) | (v << (32 - a));
    const K = [
      0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
      0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
      0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
      0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
      0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
      0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
      0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
      0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
    ];
    let H = [0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19];
    const bytes = [];
    for (let i = 0; i < ascii.length; i++) {
      const c = ascii.charCodeAt(i);
      if (c < 0x80) bytes.push(c);
      else if (c < 0x800) bytes.push(0xc0 | (c >> 6), 0x80 | (c & 63));
      else bytes.push(0xe0 | (c >> 12), 0x80 | ((c >> 6) & 63), 0x80 | (c & 63));
    }
    const bitLen = bytes.length * 8;
    bytes.push(0x80);
    while (bytes.length % 64 !== 56) bytes.push(0);
    bytes.push(0, 0, 0, 0, (bitLen >>> 24) & 255, (bitLen >>> 16) & 255, (bitLen >>> 8) & 255, bitLen & 255);
    const w = new Array(64);
    for (let b = 0; b < bytes.length; b += 64) {
      for (let t = 0; t < 16; t++) w[t] = ((bytes[b + t * 4] << 24) | (bytes[b + t * 4 + 1] << 16) | (bytes[b + t * 4 + 2] << 8) | bytes[b + t * 4 + 3]) | 0;
      for (let t = 16; t < 64; t++) {
        const s0 = rr(w[t - 15], 7) ^ rr(w[t - 15], 18) ^ (w[t - 15] >>> 3);
        const s1 = rr(w[t - 2], 17) ^ rr(w[t - 2], 19) ^ (w[t - 2] >>> 10);
        w[t] = (w[t - 16] + s0 + w[t - 7] + s1) | 0;
      }
      let a = H[0], b2 = H[1], c = H[2], d = H[3], e = H[4], f = H[5], g = H[6], h = H[7];
      for (let t = 0; t < 64; t++) {
        const S1 = rr(e, 6) ^ rr(e, 11) ^ rr(e, 25);
        const ch = (e & f) ^ (~e & g);
        const t1 = (h + S1 + ch + K[t] + w[t]) | 0;
        const S0 = rr(a, 2) ^ rr(a, 13) ^ rr(a, 22);
        const maj = (a & b2) ^ (a & c) ^ (b2 & c);
        const t2 = (S0 + maj) | 0;
        h = g; g = f; f = e; e = (d + t1) | 0; d = c; c = b2; b2 = a; a = (t1 + t2) | 0;
      }
      H = [(H[0] + a) | 0, (H[1] + b2) | 0, (H[2] + c) | 0, (H[3] + d) | 0, (H[4] + e) | 0, (H[5] + f) | 0, (H[6] + g) | 0, (H[7] + h) | 0];
    }
    return H.map((x) => (x >>> 0).toString(16).padStart(8, '0')).join('');
  }
  const normalizeCode = (txt) => String(txt || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
  function verifyCode(txt) { return sha256hex(normalizeCode(txt)) === CODE_HASH; }

  // ---------- Segundo código de «???»: la llave de Minijuegos ----------
  // El mismo panel acepta OTRO código (el admin) que NO abre la
  // cita: desbloquea el menú de Minijuegos (la llave vive en
  // game.js: G.unlockMinigames, persistente en localStorage).
  // Como el de la cita, del código solo vive su hash SHA-256
  // (calculado sobre la forma normalizada: mayúsculas y solo
  // caracteres alfanuméricos); el texto plano no está en el repo.
  const ADMIN_HASH = '5b40171489659251097e7790fc2f1892e2183a72546fe1df283d07865db9149c';
  function verifyAdminCode(txt) { return sha256hex(normalizeCode(txt)) === ADMIN_HASH; }

  // ---------- Tabla maestra de escenas (documento §11) ----------
  // REGLA DE DISTANCIAS (documento §5): cada franja caminable se
  // dimensiona para que recorrerla a ritmo de paseo dure lo que
  // dura su bloque de la canción. El ritmo es PACE = 150 px/s (la
  // velocidad del modo libre en las franjas), así que el ancho de
  // cada escena de franja es w = (t1 − t0) × PACE:
  //   plaza 29 s → 4350 · sanangel 26 s → 3900 · aero 24 s → 3600
  //   · castillo 29 s → 4350.
  // Apertura y cita son el departamento real (sin franja): no
  // llevan w. Las escenas existentes toman su worldW de esta
  // tabla (sceneOf) y el humo (sección A) verifica la regla, para
  // que tiempos, distancias y escenas no se desincronicen.
  const PACE = 150;
  const DATE_SCENES = [
    { id: 'apertura', t0: 0, t1: 12 },
    { id: 'plaza', t0: 12, t1: 41, w: 4350, suckFx: 'polvo', suckAt: 39.2 },
    { id: 'sanangel', t0: 41, t1: 67, w: 3900, suckFx: 'petalos', suckAt: 65.2 },
    { id: 'aero', t0: 67, t1: 91, w: 3600, suckFx: 'boletos', suckAt: 89.2 },
    // «Praderas del castillo» (decisión de Jose, 2026-11-21: la
    // escena 4 ya NO es el castillo flotante — son las praderas
    // cercanas al castillo ambulante, dibujadas por código, con
    // el castillo recortado de su imagen al final de la franja).
    // El id conserva el nombre del bloque en la tabla.
    { id: 'castillo', t0: 91, t1: 120, w: 4350, suckFx: 'estrellas', suckAt: 118.2 },
    { id: 'cita', t0: 120, t1: 149, finaleAt: 137 },
  ];
  const sceneOf = (id) => DATE_SCENES.find((s) => s.id === id);
  // Corrimiento del arranque (decisión de Jose, 2026-11-21): la
  // tabla conserva la estructura de la CANCIÓN (apertura 0–12 =
  // intro), pero la canción NO suena en el departamento: arranca
  // desde su inicio recién al activarse la plaza, y el reloj de
  // la cita (dateNow) parte de 0 en ese instante. Por eso, en
  // tiempo de RELOJ, la ventana de cada escena posterior a la
  // apertura es [t0−12, t1−12] (plaza 0–29, San Ángel 29–55,
  // aeropuerto 55–79, castillo 79–108, cita 108–137) y sobran
  // 12 s de outro al final de la cadena (el reloj sigue hasta
  // 149 con la cita ya cerrada en 137) para la cinemática de
  // cierre. Los suckAt y el finaleAt de la tabla están en
  // tiempo de canción: al construir la secuencia (absorción,
  // disparos) hay que restarles esos 12 s.
  const SUCK_DUR = 1.8, DOOR_CALL_T = 5, DOOR_OPEN_T = 2, JOSE_LAG = 0.15;
  const MAIN_DOOR = { x: 510, y: 566 }; // puerta principal: borde sur del pasillo
  // La CARTA del guion v2 espera sobre la mesa de centro de
  // la sala. Su posición se DERIVA de la huella del mueble en
  // world.js (W.furn('ctable'): x 595–675, z 108–140) para que
  // nunca vuelva a divergir de la mesa real, y CARTA_TOP es la
  // altura de su tablero en la malla 3D de la casa (world.js:
  // la caja de la mesa va de y=13 a y=16). El radio es el del
  // aviso «abrir la carta».
  const CARTA_MESA = W.furn('ctable');
  const CARTA_TOP = 16;
  const CARTA_POS = { x: CARTA_MESA.x + CARTA_MESA.w / 2, y: CARTA_MESA.y + CARTA_MESA.h / 2, r: 60 };

  // ---------- La proporción de las poses de lectura ----------
  // (playtest de Jose, 2026-11-22: «el personaje se hace
  // inmenso cuando lee la carta»). drawHomeImg dibuja el
  // LIENZO ENTERO de la imagen a worldH unidades de mundo,
  // así que lo que manda es cuánto del lienzo ocupa LA
  // FIGURA (medido con PIL sobre el canal alfa):
  //   · ximena-sobre / lectura-sola / lectura-sola-2
  //     (320×384): la figura llena las filas 7..376 → el
  //     96,4 % del alto del lienzo.
  //   · lectura-pareja / -2 / -3 (560×360): las figuras
  //     llenan las filas 8..351 → el 95,6 %.
  // La pose de la apertura se dibujaba a 122 fijos: la
  // figura salía a ~118 u de mundo frente a las ~67 u del
  // actor (Sp.charTop('ximena')) — un 75 % más grande que
  // ella, y encima sin la compensación de escala del modo
  // cita. El alto correcto del lienzo es charTop/FRAC ≈ 70,
  // multiplicado por xi.scale: la pose queda como un
  // reemplazo exacto del actor oculto (durante la fase
  // 'carta' la compensación no corre — update vuelve
  // temprano —, así que vale la última escala calculada en
  // su sitio, que es la que el actor llevaría).
  const CARTA_POSE_FRAC = 370 / 384;
  function cartaPoseWorldH(scale) {
    return (Sp.charTop('ximena') || 67) / CARTA_POSE_FRAC * (scale || 1);
  }
  // El compuesto del finale iba a 96: sus figuras salían a
  // ~92 u, MÁS ALTAS SENTADAS que la Ximena de pie (67 u).
  // En el arte, la figura sentada (344 px) mide el 93 % de
  // la de pie (370 px) — la proporción del propio artista
  // entre las dos poses —, así que el alto del lienzo es
  // charTop × (344/370) / (344/360) = charTop × 360/370
  // ≈ 65,5, por la escala viva de Ximena (en el finale la
  // compensación sí corre durante la cinemática).
  const PAREJA_FRAC = 344 / 360, PAREJA_SENTADA = 344 / 370;
  function parejaWorldH(scale) {
    return (Sp.charTop('ximena') || 67) * PAREJA_SENTADA / PAREJA_FRAC * (scale || 1);
  }
  // El margen del lienzo BAJO la figura sentada (medido:
  // el contenido llena las filas 8..351 de 360 → 8 px bajo
  // sus pies/posaderas). Al anclar el compuesto sobre los
  // cojines del sofá hay que bajar el lienzo este margen
  // para que LA FIGURA — no el lienzo — apoye en el cojín.
  const PAREJA_BASE_FRAC = 8 / 360;

  // ---------- La proporción de Pollito en el finale ----------
  // (playtest de Jose, 2026-11-22: «lo mismo ocurre con
  // Pollito… no está bien proporcionado»). Sus PNG del
  // servicio se dibujaban con el lienzo a 76 u (caminata y
  // gesto) y 62 u (orgulloso), sin referencia: su figura
  // salía ~3× su tamaño. La referencia es SU ACTOR definido:
  // charTop('pollito') = (base−top)×escala = (140−61)×0,25
  // ≈ 19,75 u de figura, y su draw3d (world.js) lo dibuja
  // con sx/sy ×1,15 → el alto EFECTIVO de su sprite en el
  // juego es ≈ 22,7 u (medido sobre su hoja: la figura del
  // idle/prowl llena 80–84 px de la celda de 150, que a
  // ×0,25 ×1,15 da 23,0–24,2 u: la misma banda).
  // Las fracciones de figura de sus PNG (medidas con PIL
  // sobre el alfa; la «figura» es el contenido completo:
  // Pollito CON su bandeja y la torta, que en la pose de
  // mesero forman una sola masa con él):
  //   · pollito-torta-walk-1..4 (429×420): filas 32..411,
  //     10..411, 32..411 y 37..411 → 380, 402, 380 y 375 px
  //     → 0,905 / 0,957 / 0,905 / 0,893 del lienzo.
  //   · pollito-deja-torta (433×399): filas 10..390 → 0,955.
  //   · pollito-orgulloso (360×400): filas 8..391 → 0,960.
  // Los tres comparten la línea de suelo: el contenido
  // termina 8 px antes del borde inferior del lienzo
  // (margen 8/420, 8/399 y 8/400), que se descuenta al
  // anclar para que sus patas apoyen en el suelo.
  function pollitoTop() { return (Sp.charTop('pollito') || 19.75) * 1.15; }
  const POLLITO_FRAC = { walk: [380 / 420, 402 / 420, 380 / 420, 375 / 420], deja: 381 / 399, orgulloso: 384 / 400 };
  const POLLITO_BOT = { walk: 8 / 420, deja: 8 / 399, orgulloso: 8 / 400 };
  function pollitoWorldH(frac) { return pollitoTop() / frac; }

  // Registra una imagen como billboard GL de la casa (el
  // pase con PRUEBA DE PROFUNDIDAD de W.render, vía el
  // gancho extraSprites de la HomeScene): los muebles la
  // ocluyen como ocluyen a los actores — la pareja queda
  // DETRÁS del respaldo del sofá y Pollito pasa por delante
  // o por detrás de cada mueble según su z, no «encima de
  // todo» como salía al dibujarla en la capa 2D posterior
  // (drawHomeImg), que fue el defecto del playtest. El
  // alto es worldH unidades de mundo (R.sprite aplica el
  // mismo estiramiento vertical que a los actores) y el
  // ancho sale de la proporción natural de la imagen.
  function spriteHomeImg(img, x, yBase, z, worldH, flip) {
    if (!imgOk(img)) return false;
    const R = G.R;
    if (!R || typeof R.sprite !== 'function') return false;
    R.sprite(img, x, yBase, z, { w: worldH * img.naturalWidth / img.naturalHeight, h: worldH, flip: !!flip });
    return true;
  }

  // ---------- Los textos de la carta (guion v2, «la carta») ----------
  // BORRADOR (2026-11-22): los fragmentos de la carta que la cita
  // muestra por entregas. La apertura se lee a ritmo del jugador
  // en el depa, en silencio; plaza, sanangel, aero y castillo
  // caen en banda inferior mientras la pareja camina, sin pausar
  // la caminata ni la canción; el cierre se lee juntos en la
  // sala, con su firma. Son textos BASE (los del guion v2)
  // puestos a pedido de Jose: su versión definitiva la escribe
  // él y se cambia SOLO aquí. La mecánica (guion v2) los
  // consume tal cual: la apertura la lee Ximena a ritmo del
  // jugador en el depa (Acto 1), los cuatro fragmentos caen en
  // la banda de la carta durante la caminata (Acto 2) y el
  // cierre se lee en pareja en la sala (Acto 3); el cierre
  // total compone la carta completa con todos ellos.
  const CARTA_TEXTOS = {
    apertura: 'Esta carta no se lee en un sillón: se lee caminando. Sal — yo voy contigo.',
    plaza: 'Primer lugar: por donde todo el mundo pasa y nadie se detiene. Nosotros sí.',
    sanangel: 'Aquí la gente se declara desde hace cien años. Yo solo te miro, y ya está declarado.',
    aero: 'Porque un día volaremos a algún lado. Y el destino va a ser lo de menos.',
    castillo: 'Y si la vida nos pone un castillo en el cielo, lo cruzamos igual: caminando, y juntos.',
    cierre: '¿Ves? La carta terminaba donde empezó: en casa, contigo.',
    firma: 'Feliz cumpleaños, mi amor.',
  };

  // ---------- Estado propio del modo ----------
  const D = {
    active: false, state: 'idle', // idle|depa|door|plaza|plaza-arrived|sanangel|aero|castillo|cita|done
    scene: null, plazaScene: null, angelScene: null, aeroScene: null, praderaScene: null, finaleScene: null,
    arrived: false, joseJoined: false,
    clockRunning: false, clockStarted: false, factor: 1, tap: false,
    // clockStarted: la canción ya arrancó en ESTA sesión de la
    // cita (al activarse la plaza); start() lo reinicia para que
    // el arranque vuelva a ocurrir al re-entrar a la cita.
    muted: false, // preferencia de silencio del botón #dateMuteBtn (persiste entre escenas y reingresos de la sesión)
    // --- La carta (guion v2): la llave de la cita y sus
    // fragmentos. start() los reinicia en cada partida.
    cartaAbierta: false, // la carta ya se abrió en el depa: la salida despierta
    cartaFrag: { plaza: false, sanangel: false, aero: false, castillo: false }, // fragmentos ya mostrados (una sola vez por partida)
    completed: false, // el cierre total (carta + foto) ya se presentó en esta partida
  };

  // ---------- Audio: la canción (fuera de git) ----------
  // El archivo de Jose (and-i-love-her.ogg) trae ~4 s de SILENCIO
  // al inicio antes de que entre la música. AUDIO_SKIP es ese
  // silencio: al arrancar la canción se salta a esa posición y
  // el reloj de la cita (dateNow, tabla DATE_SCENES 0..149 s)
  // cuenta desde ahí, alineado con el contenido musical real.
  const AUDIO_SKIP = 4;
  let song = null, songOk = false;
  let fbStart = 0, fbElapsed = 0, fbRunning = false;
  // El salto se aplica SOLO al arrancar (startClock): seekSong()
  // hace el intento inmediato y, si el navegador lo ignoró porque
  // el metadata aún no estaba listo, reapplySkip() lo re-aplica
  // UNA sola vez cuando el audio avise (loadedmetadata/canplay).
  // La pausa (setPaused) NUNCA vuelve a saltar al reanudar.
  let skipArmed = false, skipReapplied = false;
  // Salto efectivo: si el archivo durara MENOS que el silencio
  // (duration <= AUDIO_SKIP), no hay nada que saltar ni que
  // descontar del reloj (y el factor queda en 1).
  function skipOffset() {
    if (song && isFinite(song.duration) && song.duration > 0 && song.duration <= AUDIO_SKIP) return 0;
    return AUDIO_SKIP;
  }
  function seekSong() {
    if (!song || !skipOffset()) return;
    try { song.currentTime = AUDIO_SKIP; } catch (e) { /* sin metadata aún: lo cubre reapplySkip */ }
  }
  function reapplySkip() {
    if (!skipArmed || skipReapplied) return;
    skipReapplied = true; // una sola vez por arranque, pase lo que pase
    // Solo se toca la posición si la canción sigue ANTES del
    // punto de salto (si el seek del arranque sí cuajó, ya va
    // por delante y no se le mueve nada).
    if (song && isFinite(song.currentTime) && song.currentTime < AUDIO_SKIP - 0.05) seekSong();
  }
  function onSongMetadata() {
    if (!song) return;
    if (isFinite(song.duration) && song.duration > 0) {
      songOk = true;
      // El reescalado de la tabla se calcula sobre la duración
      // ÚTIL (sin el silencio inicial): (duration − SKIP) / 149.
      D.factor = song.duration > AUDIO_SKIP ? (song.duration - AUDIO_SKIP) / 149 : 1;
    }
    reapplySkip();
  }
  // ---------- Ganancias globales de los Ajustes ----------
  // La fuente de verdad del sonido es la Configuración del juego
  // (game.js: G.musicGain()/G.sfxGain(), que ya incluyen el
  // SILENCIO GENERAL). La cita las lee PEREZOSAMENTE en cada uso
  // —nunca al cargar el módulo— y game.js la empuja a resincronizar
  // por G.DateMode.applySoundSettings cuando algo cambia. Si
  // game.js no está (este archivo ejercitado en solitario), las
  // lecturas devuelven null y la cita se comporta como siempre:
  // manda su propio silencio de sesión (D.muted) a volumen pleno.
  function cfgMusicGain() { try { return (G && typeof G.musicGain === 'function') ? G.musicGain() : null; } catch (e) { return null; } }
  function cfgSfxGain() { try { return (G && typeof G.sfxGain === 'function') ? G.sfxGain() : null; } catch (e) { return null; } }
  // Aplica la configuración a la canción: su volumen ES la
  // ganancia global de música, y queda silenciada si la apaga el
  // silencio de la cita (D.muted) o el general (ganancia cero).
  function applySongSound() {
    if (!song) return;
    const g = cfgMusicGain();
    if (g == null) { song.muted = D.muted; return; }
    song.volume = Math.max(0, Math.min(1, g));
    song.muted = D.muted || g <= 0;
  }
  function createSong() {
    if (song) return song;
    try {
      song = document.createElement('audio');
      song.preload = 'auto';
      applySongSound(); // la configuración global manda desde el primer frame (incluye el silencio de la sesión)
      const s1 = document.createElement('source'); s1.src = 'assets/audio/and-i-love-her.ogg'; s1.type = 'audio/ogg';
      const s2 = document.createElement('source'); s2.src = 'assets/audio/and-i-love-her.mp3'; s2.type = 'audio/mpeg';
      song.appendChild(s1); song.appendChild(s2);
      if (song.addEventListener) {
        song.addEventListener('loadedmetadata', onSongMetadata);
        song.addEventListener('canplay', reapplySkip);
        // Solo un fallo del PROPIO <audio> (todas las fuentes caidas) invalida
        // la cancion; el 'error' del <source> .mp3 (404, no existe) se captura
        // aqui pero NO debe tumbar songOk si el ogg suena bien.
        song.addEventListener('error', (e) => { if (!e || e.target === song) songOk = false; }, true);
      }
    } catch (e) { song = null; }
    return song;
  }
  function startClock() {
    D.clockRunning = true;
    fbElapsed = 0; fbRunning = true; fbStart = performance.now();
    skipArmed = true; skipReapplied = false; // el salto es de ESTE arranque
    seekSong(); // intento inmediato: la canción parte 4 s adelante
    if (song && typeof song.play === 'function') {
      try { const p = song.play(); if (p && p.catch) p.catch(() => {}); } catch (e) { /* sin audio: manda el respaldo */ }
    }
  }
  function dateNow() {
    if (!D.clockRunning) return 0;
    // Con audio manda la canción, pero el tiempo devuelto es el
    // DE LA CITA: se descuenta el silencio saltado para que la
    // tabla DATE_SCENES siga sincronizada con la música real.
    if (songOk && song && isFinite(song.currentTime)) return Math.max(0, song.currentTime - skipOffset());
    if (!fbRunning) return fbElapsed;
    return fbElapsed + (performance.now() - fbStart) / 1000;
  }
  function setPaused(v) {
    if (!D.active) return;
    if (v) {
      // La cancion se DETIENE siempre que exista: startClock la arranca
      // sin exigir songOk (linea ~242), asi que exigirlo aqui la dejaba
      // sonando al pausar —songOk puede quedar en false por el listener
      // de 'error' en captura (el .mp3 404) aunque el ogg suene—. pause()
      // es seguro aunque no este reproduciendo.
      if (song && typeof song.pause === 'function') { try { song.pause(); } catch (e) {} }
      if (fbRunning) { fbElapsed = dateNow(); fbRunning = false; }
    } else {
      // Reanudar: la cancion vuelve donde quedo (su currentTime no se
      // toco al pausar), solo si el reloj de la cita esta corriendo.
      if (D.clockRunning && song && typeof song.play === 'function') { try { const p = song.play(); if (p && p.catch) p.catch(() => {}); } catch (e) {} }
      if (D.clockRunning && !fbRunning) { fbStart = performance.now(); fbRunning = true; }
    }
  }
  // Cambio de pestaña: la misma pausa automática del documento (§9).
  if (typeof document !== 'undefined' && document.addEventListener) {
    document.addEventListener('visibilitychange', () => {
      if (document.hidden && D.active && G.setPaused && !G.paused) G.setPaused(true);
    });
  }

  // ---------- SFX de la Puerta: grabación real (dominio público) ----------
  // Al cruzar las Puertas de la cita suena una puerta REAL
  // cerrándose, no el blip sintetizado del sistema de sonido
  // del juego principal (dos tonos de sierra a 120/90 Hz: el
  // «sonido de pixel» que Jose pidió quitar de la cita, 2026-
  // 11-21). La sustitución es SOLO de DateMode: el juego
  // principal conserva su blip intacto, y dentro de la cita
  // ningún cruce vuelve a pedirlo.
  // La grabación: «Closing an old door» de ezwa (pdsounds.org
  // #661, DOMINIO PÚBLICO), recortada al golpe del cierre
  // (0,60 s) y normalizada; assets/audio/door-close.ogg, con
  // su registro en assets/date/FUENTES.md. Es versionable (no
  // es la canción): el .gitignore de la carpeta solo tapa los
  // *.m4a/*.mp3 de la canción.
  // Elemento <audio> PROPIO, independiente de la canción: ni
  // la pausa, ni la reinicia, ni toca el reloj. Respeta el
  // silencio de la cita (D.muted: con el modo silenciado, la
  // Puerta tampoco suena). Se dispara UNA vez por cruce, en el
  // momento en que la Puerta se cierra tras la pareja: en las
  // escenas de franja y en el depa final, al iniciar el fundido
  // de salida (beginExit); en la salida del depa de apertura,
  // al llegar a la plaza (la puerta se cierra detrás de Ximena
  // tras la luz). Al ABRIR la puerta del depa no suena nada:
  // es una apertura, no un cierre.
  let doorSfx = null;
  function createDoorSfx() {
    if (doorSfx) return doorSfx;
    try {
      doorSfx = document.createElement('audio');
      doorSfx.preload = 'auto';
      doorSfx.src = 'assets/audio/door-close.ogg';
      doorSfx.volume = 0.9;
    } catch (e) { doorSfx = null; }
    return doorSfx;
  }
  function playDoorClose() {
    if (D.muted) return; // el silencio de la cita manda también sobre la Puerta
    const g = cfgSfxGain();
    if (g != null && g <= 0) return; // el silencio general (o efectos a cero) manda también
    const elx = createDoorSfx();
    if (!elx || typeof elx.play !== 'function') return;
    elx.volume = 0.9 * (g == null ? 1 : g); // su volumen de siempre × la ganancia global de efectos
    try { elx.currentTime = 0; } catch (e) { /* aún sin metadata: play() parte del inicio igual */ }
    try { const p = elx.play(); if (p && p.catch) p.catch(() => {}); } catch (e) { /* sin audio: el cruce sigue en silencio */ }
  }

  // ---------- Desbloqueo de audio (autoplay de móvil) ----------
  // song y doorSfx son <audio> planos que NACEN al entrar a la cita
  // (createSong/createDoorSfx), DESPUÉS del gesto con que music.js
  // desbloquea el audio del juego. En móvil (iOS/Safari sobre todo)
  // un <audio> creado tras ese gesto queda BLOQUEADO: su play(), que
  // ocurre dentro del bucle de animación (startClock en la fase
  // 'plaza', y playDoorClose al cruzar), lo rechaza el navegador y el
  // .catch lo oculta en silencio. Por eso la música del juego suena
  // pero la de la cita no. Aquí los CEBAMOS dentro del primer gesto
  // real posterior a su creación (play() mudo -> pause -> reinicio),
  // lo que marca el elemento como desbloqueado por el usuario; ese
  // gesto SIEMPRE llega antes de la plaza (hay que caminar a la
  // puerta y accionarla). Mismo patrón que el hook de music.js.
  let audioPrimed = false;
  function primeMediaEl(el) {
    if (!el || typeof el.play !== 'function') return;
    const wasMuted = el.muted;
    try { el.muted = true; } catch (e) { /* tolerante */ }
    const restore = () => {
      try { el.pause(); el.currentTime = 0; } catch (e) { /* aun sin metadata */ }
      try { el.muted = wasMuted; } catch (e) { /* tolerante */ }
    };
    try {
      const pr = el.play();
      if (pr && pr.then) pr.then(restore).catch(() => { try { el.muted = wasMuted; } catch (e) {} });
      else restore();
    } catch (e) { try { el.muted = wasMuted; } catch (e) {} }
  }
  function primeDateAudio() {
    if (audioPrimed) return;
    if (!song && !doorSfx) return; // aun no se ha entrado a la cita: nada que cebar
    audioPrimed = true;
    if (!D.clockStarted) primeMediaEl(song); // ya arrancada, cebarla pelearia con su reloj/pausa
    primeMediaEl(doorSfx);
    try { applySongSound(); } catch (e) { /* el estado real de la cancion lo re-fija su configuracion */ }
  }
  if (typeof window !== 'undefined' && window.addEventListener) {
    const onPrimeGesture = () => { primeDateAudio(); };
    ['pointerdown', 'keydown', 'touchstart'].forEach((t) => {
      try { window.addEventListener(t, onPrimeGesture); } catch (e) { /* tolerante */ }
    });
  }

  // ---------- Botón de silencio (#dateMuteBtn) ----------
  // Botón DOM (no canvas) en la esquina superior derecha de la
  // pantalla de las escenas de caminata, creado por el propio
  // modo y visible SOLO con body.date-mode (las reglas viven en
  // css/style.css, junto a las del HUD oculto). El pictograma es
  // SVG inline (altavoz con ondas / altavoz con aspa): la
  // guardia de iconografía del proyecto prohíbe emojis en la UI.
  // Su clic NO alimenta el input del juego: el listener táctil
  // del modo escucha sobre #cv y el botón vive fuera del canvas,
  // y además corta la propagación de sus propios eventos.
  const MUTE_SVG = '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'
    + '<path d="M11 5 6 9H3v6h3l5 4z" fill="currentColor" stroke="none"/>'
    + '<path class="wv" d="M15.5 8.5a5 5 0 0 1 0 7"/><path class="wv" d="M18.4 6a9.2 9.2 0 0 1 0 12"/>'
    + '<line class="sl" x1="16" y1="9.5" x2="21.5" y2="15"/><line class="sl" x1="21.5" y1="9.5" x2="16" y2="15"/></svg>';
  let muteBtn = null;
  function syncMuteBtn() {
    if (!muteBtn) return;
    muteBtn.classList.toggle('muted', D.muted);
    const lbl = D.muted ? 'Activar sonido' : 'Silenciar';
    muteBtn.title = lbl;
    muteBtn.ariaLabel = lbl;
    if (typeof muteBtn.setAttribute === 'function') muteBtn.setAttribute('aria-label', lbl);
  }
  function toggleMute() {
    D.muted = !D.muted;
    applySongSound(); // D.muted nuevo + la configuración global, en un solo lugar
    syncMuteBtn();
  }
  function ensureMuteBtn() {
    if (muteBtn) { syncMuteBtn(); return muteBtn; }
    try {
      const b = document.createElement('button');
      b.id = 'dateMuteBtn';
      b.type = 'button';
      b.innerHTML = MUTE_SVG;
      b.onclick = (e) => {
        if (e && e.stopPropagation) e.stopPropagation();
        toggleMute();
        if (b.blur) b.blur(); // que ESPACIO (acción del juego) no lo vuelva a disparar por foco
      };
      if (b.addEventListener) {
        const cut = (e) => { if (e && e.stopPropagation) e.stopPropagation(); };
        b.addEventListener('pointerdown', cut);
        b.addEventListener('click', cut);
      }
      const host = $('#stage') || document.body;
      if (host && host.appendChild) host.appendChild(b);
      muteBtn = b;
      syncMuteBtn();
    } catch (e) { muteBtn = null; /* sin DOM de botones: el modo sigue, solo sin botón */ }
    return muteBtn;
  }

  // ---------- Entrada táctil: arrastre sobre el canvas ----------
  // Un solo listener para todo el modo (registrado al cargar el
  // módulo, no por escena: no puede quedar colgado al salir).
  let touchStart = null, touchVec = null;
  try {
    const cv = $('#cv');
    if (cv && cv.addEventListener) {
      cv.addEventListener('pointerdown', (e) => { touchStart = { x: e.clientX, y: e.clientY }; touchVec = { x: 0, y: 0 }; });
      cv.addEventListener('pointermove', (e) => {
        if (!touchStart) return;
        const dx = e.clientX - touchStart.x, dy = e.clientY - touchStart.y, m = Math.hypot(dx, dy);
        touchVec = m > 8 ? { x: dx / Math.max(m, 44), y: dy / Math.max(m, 44) } : { x: 0, y: 0 };
      });
      const endTouch = () => { if (touchStart && touchVec && !touchVec.x && !touchVec.y) D.tap = true; touchStart = null; touchVec = null; };
      cv.addEventListener('pointerup', endTouch);
      cv.addEventListener('pointercancel', endTouch);
    }
  } catch (e) { /* sin canvas táctil: el teclado basta */ }

  // ---------- Asset de la plaza: la Catedral (recorte de foto) ----------
  let catedralImg = null;
  try {
    if (typeof Image !== 'undefined') { catedralImg = new Image(); catedralImg.src = 'assets/date/catedral.png'; }
  } catch (e) { catedralImg = null; }

  // ---------- Complementos de la plaza (pedidos por Jose) ----------
  // Más recortes de FOTO real con el mismo acabado que la Catedral
  // (tools/mkcutout.py: fondo fuera, borde blanco horneado y sombra
  // suave): un avión que cruza el cielo, un puesto de tacos de
  // fondo, los hitos de la capa lejana (la Parroquia de la
  // Purísima Concepción de Mineral del Chico, el Palacio de
  // Bellas Artes y el Ángel de la Independencia) y el vocho que
  // maneja Pollito por la calle de primer plano. Fuentes y
  // licencias: assets/date/FUENTES.md.
  // La VISTA de San Ángel es la excepción: arte de la película El
  // Libro de la Vida aportado por Jose, SOLO-LOCAL (en .gitignore,
  // como la canción); si el archivo no está, no se dibuja y ya.
  function loadDateImg(src) {
    try { if (typeof Image !== 'undefined') { const i = new Image(); i.src = src; return i; } } catch (e) { /* sin imagen: el elemento no se dibuja */ }
    return null;
  }
  const imgOk = (i) => !!(i && i.complete && i.naturalWidth);
  const avionImg = loadDateImg('assets/date/avion.png');
  const vochoImg = loadDateImg('assets/date/vocho.png');
  // El TRÁFICO de la plaza (pedido de Jose): los ENCUENTROS en
  // la calle (el Alebrije caminando y Teodora flotando, cameos
  // con sus diseños definidos del juego) y los AUTOS CON
  // CALAVERITA, los obstáculos de la escena (ver PLAZA_TRAFICO).
  // Los autos son recortes de foto CC como el vocho, pero de
  // OTROS modelos y colores (un Saab descapotable rojo y un
  // Opel blanco), y las calaveritas al volante son los diseños
  // del juego (la clásica de vestido rojo y la morada del
  // corazón en la frente), recortadas en busto de sus sprites.
  // Todo versionado; fuentes en FUENTES.md.
  const alebrijeImg = loadDateImg('assets/date/alebrije-calle.png');
  const teodoraImg = loadDateImg('assets/date/teodora-calle.png');
  const autoRojoImg = loadDateImg('assets/date/auto-rojo.png');
  const autoBlancoImg = loadDateImg('assets/date/auto-blanco.png');
  const calClasicaImg = loadDateImg('assets/date/calaverita-clasica-busto.png');
  const calMoradaImg = loadDateImg('assets/date/calaverita-morada-busto.png');
  const tacosImg = loadDateImg('assets/date/tacos.png');
  const parroquiaImg = loadDateImg('assets/date/parroquia.png');
  const bellasArtesImg = loadDateImg('assets/date/bellasartes.png');
  const angelImg = loadDateImg('assets/date/angel.png');
  const vistaImg = loadDateImg('assets/date/sanangel-vista.png');
  // El CASTILLO AMBULANTE: recorte del póster de la película
  // aportado por Jose (SOLO el castillo, sin los personajes),
  // hecho localmente desde su imagen. Como la vista de San
  // Ángel, es material de película: SOLO-LOCAL, fuera de git
  // (ver FUENTES.md), SIN borde blanco (es paisaje lejano, no
  // un sticker) y con un fundido suave en la base, porque en el
  // póster la base se pierde en la niebla. Se dibuja SOLO si
  // cargó (imgOk): sin el archivo, ni el aeropuerto ni las
  // praderas lo muestran y ambas escenas se juegan igual.
  const castilloImg = loadDateImg('assets/date/castillo.png');
  // CALCIFER y MONONOKE: dos recortes más de película
  // aportados por Jose para las praderas (pedido suyo: la
  // escena se veía muy vacía) — Calcifer es el fuego de la
  // película del castillo ambulante y hace de OBSTÁCULO de la
  // vereda; San y la loba Moro (La princesa Mononoke) observan
  // desde la arboleda del fondo. Como el castillo y la vista
  // de San Ángel: SOLO-LOCALES, fuera de git (ver
  // FUENTES.md), SIN borde blanco, y se dibujan SOLO si
  // cargaron (imgOk): Calcifer tiene respaldo dibujado por
  // código para que el obstáculo nunca sea invisible, y la
  // arboleda se dibuja igual sin el recorte de Mononoke.
  const calciferImg = loadDateImg('assets/date/calcifer.png');
  const mononokeImg = loadDateImg('assets/date/mononoke.png');
  // LA CARTA (guion v2): arte original del juego, versionado
  // (ver FUENTES.md). El sobre cerrado que espera en la mesa
  // de centro, las poses de lectura (sola y en pareja, con sus
  // frames de vida), el servicio de Pollito (el ciclo de
  // caminata con la torta, el gesto de dejarla, la torta ya en
  // la mesa y su pose de orgullo) y las dos imágenes del
  // cierre total a pantalla completa. Como todo el arte de la
  // cita, cada pieza se dibuja SOLO si cargó (imgOk): sin la
  // imagen, la mecánica corre igual con sus respaldos (la
  // pose cae al sprite normal y el cierre salta la fase).
  const cartaSobreImg = loadDateImg('assets/date/carta-sobre.png');
  const ximenaSobreImg = loadDateImg('assets/date/ximena-sobre.png');
  const lecturaSolaImg = loadDateImg('assets/date/lectura-sola.png');
  const lecturaSola2Img = loadDateImg('assets/date/lectura-sola-2.png');
  const lecturaParejaImg = loadDateImg('assets/date/lectura-pareja.png');
  const lecturaPareja2Img = loadDateImg('assets/date/lectura-pareja-2.png');
  const lecturaPareja3Img = loadDateImg('assets/date/lectura-pareja-3.png');
  const pollitoWalkImgs = [1, 2, 3, 4].map((i) => loadDateImg(`assets/date/pollito-torta-walk-${i}.png`));
  const pollitoDejaImg = loadDateImg('assets/date/pollito-deja-torta.png');
  const tortaMesaImg = loadDateImg('assets/date/torta-mesa.png');
  const pollitoOrgullosoImg = loadDateImg('assets/date/pollito-orgulloso.png');
  const cartaFinalImg = loadDateImg('assets/date/carta-final.png');
  const fotoParejaImg = loadDateImg('assets/date/foto-pareja.png');
  // EL ÁLBUM DEL CIERRE (idea de Jose): tras la carta, las
  // «fotos» del recorrido — una por escena, en el mismo
  // pixel art detallado de foto-pareja.png — se colocan
  // una encima de otra como una pila de fotos impresas, y
  // la del sofá (foto-pareja.png) cierra la pila y se
  // expande a pantalla completa. Como todo el arte de la
  // cita, cada foto se usa SOLO si cargó (imgOk): la que
  // falte se salta en la pila sin romper la secuencia, y
  // si falta la del sofá no hay álbum (directo a la
  // tarjeta de fin, como antes de que existiera el álbum).
  const fotoPlazaImg = loadDateImg('assets/date/foto-plaza.png');
  const fotoSanangelImg = loadDateImg('assets/date/foto-sanangel.png');
  const fotoAeropuertoImg = loadDateImg('assets/date/foto-aeropuerto.png');
  const fotoPraderasImg = loadDateImg('assets/date/foto-praderas.png');
  // Las fotos del cierre EN EL ORDEN DEL RECORRIDO, con
  // la del sofá como última (la de arriba de la pila).
  const CLOSE_PHOTOS = [
    { key: 'plaza', img: fotoPlazaImg },
    { key: 'sanangel', img: fotoSanangelImg },
    { key: 'aero', img: fotoAeropuertoImg },
    { key: 'castillo', img: fotoPraderasImg },
    { key: 'sofa', img: fotoParejaImg },
  ];
  // Los tiempos del álbum (s) y el tamaño de cada foto
  // impresa en la pila (la imagen; el marco blanco y la
  // sombra se dibujan por código en drawClosing).
  const ALBUM_ENTER_T = 0.6;    // la caída con la que cada foto se coloca
  const ALBUM_HOLD_MIN = 1.8;   // contemplación mínima asentada: antes, ESPACIO no avanza
  const ALBUM_HOLD_AUTO = 3.4;  // asentada tanto tiempo, la siguiente entra sola
  const ALBUM_SOFA_BEAT = 1.5;  // el beat de la foto del sofá arriba, antes de expandirse
  const ALBUM_EXPAND_T = 0.8;   // la expansión de la foto del sofá a pantalla completa
  const ALBUM_PHOTO_W = 400, ALBUM_PHOTO_H = 225;
  // La pose FIJA de cada foto en la pila, por posición en
  // la pila MOSTRADA (si una foto falta, las demás toman
  // las poses desde la base): desplazamientos de pocos px
  // y rotaciones de ±5° para que las de abajo asomen por
  // los bordes, como una pila de fotos de verdad.
  const ALBUM_POSES = [
    { dx: -12, dy: 5, rot: -4 },
    { dx: 10, dy: -4, rot: 3 },
    { dx: -5, dy: 7, rot: -2 },
    { dx: 11, dy: 1, rot: 4.5 },
    { dx: 0, dy: -3, rot: -1.5 },
  ];
  const albumPose = (i) => ALBUM_POSES[Math.min(i, ALBUM_POSES.length - 1)];

  // Geometría y ciclos de los complementos. Las x de los elementos
  // fijos viven en el espacio de SU capa (pantalla con pan=0): la
  // franja mide 4350 px de mundo (29 s × PACE, la regla de la
  // tabla maestra) y la cámara recorre pan 0..3710.
  // Reparto de los HITOS DE FONDO a lo largo del paseo (el
  // «momento protagonista» de cada hito es el pan en que su
  // centro cruza el centro de la pantalla; x de capa = 320 +
  // pan × parallax): Catedral pan 0 (0%, el recibimiento),
  // Palacio de Bellas Artes pan 840 (~23%), el Ángel de la
  // Independencia pan 1848 (~50%), la Parroquia de Mineral del
  // Chico pan 2848 (~77%) y la vista de San Ángel al fondo, pan
  // 3710 (100%), que coincide con la Puerta de salida (mundo
  // 4250 → pantalla 540): la Puerta se apoya justo delante de
  // San Ángel. Los centros en L1 quedan separados por ≥250 px
  // de capa (268 → 530 → 782 → 1032, y 1032 → 1282 de la vista)
  // y los protagonistas por ≥840 px de cámara. Ojo: la Catedral
  // (430 de ancho) y Bellas Artes (380) se solapan en la capa —
  // en el skyline se leen como edificios vecinos de la misma
  // manzana, con Bellas Artes dibujado delante. El puesto de
  // tacos (L2, protagonista a pan 1560, ~42%) va en otra capa y
  // otra altura visual que el Ángel (pan 1848): se corrió de
  // 1155 a 1100 para que al cruzarse no se encimen de forma
  // confusa (el puesto tapa apenas el arranque del pedestal).
  const PLAZA_FX = {
    avion: { w: 138, y: 54, ciclo: 28, cruce: 14, desfase: 7, par: 0.15 },
    vocho: { w: 246, base: 351, ciclo: 32, cruce: 7, desfase: 11 },
    catedralX: 268,                       // L1 (parallax 0,25), con el asta en 96
    bellasArtesX: 530, bellasArtesW: 380, // L1 (parallax 0,25)
    angelX: 782, angelW: 92,              // L1 (parallax 0,25); 92 de ancho → ~322 de alto, como la Catedral
    tacosX: 1100, tacosW: 128,            // L2 (parallax 0,5)
    parroquiaX: 1032, parroquiaW: 322,    // L1 (parallax 0,25)
    vistaX: 1282, vistaW: 352,            // capa lejana (parallax 0,2)
    vistaWorldX: 4250,                    // su ancla en el mundo L4 (el final de la franja)
    vistaSquash: 0.86,                    // aplana un pelo la vista para que las torres quepan en la banda del cielo
    // Ventanilla del conductor del vocho, en fracciones del
    // recorte (medidas sobre vocho.png: la ventana lateral
    // delantera ocupa x 0,30–0,49, y 0,24–0,44): ahí asoma
    // Pollito. Su cabeza se recorta del frame idle definido
    // (celda 158×150; la cabeza vive en x 44–114, y 59–111).
    winCx: 0.395, winBase: 0.458, winHeadW: 0.16,
    catSrc: { x: 0.278, y: 0.393, w: 0.443, h: 0.347 },
  };
  // Centro del avión (px de pantalla, SIN parallax) en el tiempo t:
  // cruza de izquierda a derecha durante `cruce` s y el resto del
  // ciclo espera fuera de escena (devuelve -9999). Monótona
  // creciente dentro de la ventana de cruce.
  function avionXAt(t) {
    const f = PLAZA_FX.avion, ph = (t + f.desfase) % f.ciclo;
    if (ph >= f.cruce) return -9999;
    return -170 + (ph / f.cruce) * 980;
  }
  // Centro del vocho (px de pantalla) en el tiempo t: cruza de
  // DERECHA a IZQUIERDA durante `cruce` s y tarda el resto del
  // ciclo en volver (fuera de la ventana devuelve 9999).
  // Monótona decreciente dentro de la ventana.
  function vochoXAt(t) {
    const f = PLAZA_FX.vocho, ph = (t + f.desfase) % f.ciclo;
    if (ph >= f.cruce) return 9999;
    return 790 - (ph / f.cruce) * 960;
  }

  // ---------- El tráfico de la plaza: encuentros y autos con calaverita ----------
  // Dos capas de vida en la calle de la escena 1 (pedido de
  // Jose), ambas SOLO en el modo libre (nada durante el
  // revelado) y en la capa de personajes ordenada por Y:
  //
  // A) ENCUENTROS: el ALEBRIJE y TEODORA cruzan la calle de
  // derecha a izquierda como transeúntes con los que la pareja
  // «se encuentra»: cameos SIN colisión ni interacción (como el
  // de Manolo y María en San Ángel). Alternan (uno por cruce,
  // con intervalos generosos) y nacen por delante de la cámara.
  // El Alebrije CAMINA: su sprite es el perfil alb_side de su
  // hoja de diseño (mirando a la derecha), así que al dibujarlo
  // se espeja SOLO el perfil para que mire a su dirección de
  // viaje — la convención del proyecto para perfiles (la del
  // propio motor de franja con la pareja); su identidad (ojos
  // negros enormes, lengua roja rizada fuera, mancha roja con
  // puntos en el flanco, aleta dorsal amarilla) va intacta.
  // Teodora FLOTA, como es su naturaleza en el juego: su sprite
  // es su pose de flotación hacia la izquierda YA dibujada así
  // en su diseño (no se espeja: su moño va en su lado izquierdo
  // y así queda), con el bob por motor y los pies a floatAlt px
  // sobre su línea de calle.
  //
  // B) AUTOS CON CALAVERITA: los obstáculos de la plaza. Como
  // el vocho de Pollito, pero en OTROS autos (un descapotable
  // rojo y un compacto blanco: nada de duplicar el vocho) y a
  // la altura de la calle DE LA PAREJA (la banda caminable, no
  // la calle de primer plano del vocho). Cada pasada lleva un
  // CARRIL (una y dentro de la banda): se esquiva moviéndose en
  // vertical dentro de la banda o dejando pasar el auto. Si el
  // auto alcanza al personaje CONTROLADO con solape real (su x
  // dentro del largo del auto y su y a ±laneTol del carril),
  // trastabillea ×frenoK durante frenoT (la regla de la cita:
  // frenar, nunca derrotar) y el auto sigue su camino, con una
  // sola afectación por pasada. El SEGUIDOR es inmune. OJO: el
  // vocho de Pollito (PLAZA_FX.vocho) NO es de esta familia: es
  // un gag de primer plano, INOFENSIVO y sin colisión alguna.
  // winCx/winBase/bustW de cada modelo: la ventanilla del
  // conductor medida sobre su recorte (fracciones), con el
  // busto de la calaverita compuesto como el de Pollito.
  const PLAZA_TRAFICO = {
    alebrije: { h: 100, vel: 62 },
    teodora: { h: 94, vel: 80, floatAlt: 30 },
    intervaloMin: 15, intervaloMax: 24,
    autos: {
      w: 232, velMin: 205, velMax: 245, cadMin: 9, cadMax: 14, maxVivos: 2,
      frenoK: 0.4, frenoT: 0.7, laneTol: 18,
      modelos: [
        { img: autoRojoImg, bust: calClasicaImg, color: '#b03a3a', winCx: 0.46, winBase: 0.385, bustW: 0.145 },
        { img: autoBlancoImg, bust: calMoradaImg, color: '#e8e4da', winCx: 0.46, winBase: 0.385, bustW: 0.145 },
      ],
    },
  };

  // ---------- Escena 2: SAN ÁNGEL (recortes de la película) ----------
  // Todo lo de esta carpeta es arte de El Libro de la Vida
  // aportado por Jose: SOLO-LOCAL (en .gitignore, como la canción
  // y la vista), y cada elemento se dibuja SOLO si su imagen
  // cargó (imgOk): sin la carpeta, la escena corre con su cielo
  // y su piso dibujados por código. Procedencia en FUENTES.md.
  const saCasasFull = loadDateImg('assets/date/sanangel/casas-full.png');
  const saCasasA = loadDateImg('assets/date/sanangel/casas-a.png');
  const saCasasB = loadDateImg('assets/date/sanangel/casas-b.png');
  const saPileta = loadDateImg('assets/date/sanangel/pileta.png');
  const saManolo = loadDateImg('assets/date/sanangel/manolo.png');
  const saMaria = loadDateImg('assets/date/sanangel/maria.png');
  const saChuy = loadDateImg('assets/date/sanangel/chuy.png');
  const saArbol = loadDateImg('assets/date/sanangel/arbol.png');
  const saVelaA = loadDateImg('assets/date/sanangel/vela-a.png');
  const saVelaB = loadDateImg('assets/date/sanangel/vela-b.png');
  // La bola de paja de San Ángel: foto real CC (NO es de la
  // película: está versionada en el repo como los demás
  // recortes CC; procedencia en FUENTES.md). Rueda por la
  // calle arrastrada por el viento como obstáculo (ver
  // SA_BOLAS y SanAngelScene.updateBolas).
  const bolaPajaImg = loadDateImg('assets/date/bola-paja.png');
  // El ABRAZO de San Ángel: sprite NUEVO de la pareja abrazándose
  // en perfil, generado para el juego desde los sprites definidos
  // de Ximena y Jose como referencia de identidad (orejas de conejo
  // moradas y bata blanca; lentes, audífonos y camisa verde a
  // rayas), con el borde blanco Paper Mario horneado como los
  // definidos. Es arte original de los personajes del juego (NO
  // es material de película): está VERSIONADO en el repo como los
  // demás assets propios. Se dibuja solo si cargó (imgOk); sin él,
  // la acción de abrazo usa el respaldo de los dos sprites
  // individuales frente a frente (ver SanAngelScene.drawHug).
  const abrazoImg = loadDateImg('assets/date/abrazo.png');
  // Geometría de la franja de San Ángel: 3900 px de mundo (el
  // w de su bloque en la tabla maestra: 26 s × PACE), la Puerta
  // de entrada a la izquierda (x=90) y la de salida junto al
  // árbol (x=3800). Las casas viven en su capa (parallax 0,4)
  // como segmentos de x/h en ese espacio: con la cámara
  // recorriendo pan 0..3260, la capa se desplaza 1304 px y los
  // segmentos deben cubrir hasta x≈1950 de capa para que la
  // calle no se quede sin casas en ningún punto del paseo; el
  // árbol ancla su centro en el espacio de la suya (0,25).
  // El camino de velas del final de la franja: las dos filas
  // del suelo arrancan en SA_VELAS_X0 (395 px antes de la
  // Puerta del árbol) y convergen hacia ella. Es EL ancla de
  // la «zona del árbol»: la comparten el dibujo de las velas
  // (SanAngelScene) y la zona donde se ofrece el abrazo
  // (SA_ABRAZO.x0) — un solo número, dos usos.
  const SA_VELAS_X0 = 3405;
  const SANANGEL = { worldW: sceneOf('sanangel').w, entryDoorX: 90, exitDoorX: 3800, groundY: 316, horizon: 246 };
  const SA_HOUSES = [
    { img: saCasasA, x: -10, h: 112 }, { img: saCasasB, x: 176, h: 126 },
    { img: saCasasFull, x: 322, h: 126 }, { img: saCasasA, x: 640, h: 116 },
    { img: saCasasB, x: 826, h: 122 }, { img: saCasasFull, x: 962, h: 122 },
    { img: saCasasA, x: 1232, h: 112 }, { img: saCasasB, x: 1418, h: 126 },
    { img: saCasasFull, x: 1552, h: 126 }, { img: saCasasA, x: 1830, h: 116 },
  ];
  // Velitas colgando de la copa del árbol: fracciones (x, y)
  // sobre la caja en que se dibuja el recorte del árbol; el
  // punto de luz y su parpadeo se dibujan por código.
  const SA_HANG = [
    [0.16, 0.50], [0.28, 0.58], [0.40, 0.48], [0.52, 0.58], [0.63, 0.50], [0.75, 0.58],
    [0.86, 0.52], [0.22, 0.66], [0.47, 0.67], [0.70, 0.67], [0.34, 0.72], [0.60, 0.74],
  ];
  // Brillo de una vela en el tiempo t (índice i = su fase): dos
  // senos de frecuencias distintas dan un parpadeo orgánico que
  // nunca se repite igual entre velas vecinas. Rango ~[0,44, 1].
  function candleGlow(t, i) {
    return 0.72 + 0.28 * Math.sin(t * 6.3 + i * 1.93) * Math.sin(t * 2.7 + i * 0.71);
  }
  // Las bolas de paja de San Ángel (pedido de Jose): obstáculos
  // de foto real que el viento arrastra de derecha a izquierda
  // por la calle. Nacen solo mientras el personaje CONTROLADO
  // está en la zona de la calle (x < zonaX: antes del velo de
  // anochecer y del árbol, donde no nace ninguna), ruedan con
  // velocidad propia por bola y, al chocar SOLO con el
  // controlado, estallan en pajitas y lo dejan trastabillando
  // (su velocidad ×frenoK durante frenoT). Sin daño ni derrota:
  // en la cita chocar solo frena, como en el resto del paseo.
  const SA_BOLAS = {
    maxVivas: 3, cadMin: 3.5, cadMax: 6.5, velMin: 120, velMax: 180,
    dMin: 34, dMax: 58, zonaX: 2500, frenoK: 0.4, frenoT: 0.7,
  };
  // La ACCIÓN DE ABRAZO de San Ángel (pedido de Jose): cuando el
  // personaje controlado y su acompañante están cerca, la escena
  // ofrece «ESPACIO: abrazarse» y corre una secuencia corta con
  // el sprite de la pareja (abrazo.png): acercamiento, abrazo
  // con balanceo, pétalos de la escena y corazoncitos dibujados
  // por código, y separación. Durante el abrazo las bolas de
  // paja no nacen ni frenan (no arruinan el momento) y, al
  // terminar, el aviso no vuelve hasta separarse más allá de
  // rearmeDist o esperar rearmeT segundos (anti-spam amable:
  // repetir el abrazo es a voluntad, separándose y volviendo).
  // La oferta SOLO existe en la parte final de la escena,
  // frente al árbol (refinamiento de Jose): el punto del
  // abrazo — el punto medio de la pareja — debe estar dentro
  // de la zona del árbol, que arranca donde arranca el camino
  // de velas (x0 = SA_VELAS_X0, el mismo ancla que dibuja las
  // filas). En la calle o junto a la pileta, por muy cerca que
  // estén, no hay aviso ni abrazo posible.
  const SA_ABRAZO = {
    cercaDist: 80, rearmeDist: 140, rearmeT: 4,
    acercarT: 0.5, abrazoT: 2.4, separarT: 0.6, hugGap: 34,
    x0: SA_VELAS_X0,
  };

  // ---------- Escena 3: AEROPUERTO (interior dibujado) ----------
  // Terminal de mañana fría, sin assets nuevos: el interior se
  // dibuja por código (paramétrico en pan) y el único recorte es
  // el avión YA registrado (assets/date/avion.png, FUENTES.md),
  // reutilizado grande FUERA del ventanal. Geometría: 3600 px de
  // mundo (el w de su bloque en la tabla maestra: 24 s × PACE),
  // Puerta de entrada a la izquierda (x=90) y de salida al final
  // (x=3500). La cinta caminadora ocupa el trecho central
  // (1200–2400) y empuja a +90 px/s a quien esté sobre ella (el
  // motor compartido la aplica vía sc.belt, ver updateStripFree).
  const AERO = {
    worldW: sceneOf('aero').w, entryDoorX: 90, exitDoorX: 3500, groundY: 316, horizon: 240,
    belt: { x0: 1200, x1: 2400, speed: 90 },
    // El avión en rodaje (taxiing) por la pista: vive en su capa
    // (parallax 0,15) y su x de capa avanza a 18 px/s durante
    // 100 s — de −500 (fuera de escena a cualquier cámara) a
    // 1300 (fuera por la derecha a cualquier cámara) — y espera
    // ahí el resto del ciclo de 140 s. El salto de vuelta al
    // inicio del ciclo ocurre con el avión invisible, así que
    // nunca se le ve teletransportarse.
    avion: { w: 420, par: 0.15, baseY: 206, ciclo: 140, taxi: 100, vel: 18, x0: -500, x1: 1300 },
    // El castillo ambulante A LO LEJOS, quieto en el horizonte
    // tras el ventanal (decisión de Jose: desde el aeropuerto
    // ya se anuncia el destino de la escena 4). Vive en una
    // capa aún más lejana que la del avión (parallax 0,1, sin
    // movimiento propio): su centro cruza el centro de la
    // pantalla a pan = (468 − 320)/0,1 = 1480, el 50% del
    // paseo. Se dibuja por ALTO (h=150): el recorte es alto y
    // esbelto (793×1097) y la banda del ventanal manda — a
    // 150–200 px de ancho mediría 207–276 de alto y las
    // torres quedarían fuera del cristal. Con velo de
    // distancia y la base sobre el horizonte de la pista.
    castillo: { par: 0.1, layerCx: 468, h: 150, baseY: 198 },
  };
  // Centro del avión del aeropuerto (px de SU capa) en el
  // tiempo t: monótono creciente durante el rodaje y quieto
  // fuera de escena durante la espera del ciclo.
  function aeroPlaneXAt(t) {
    const f = AERO.avion, ph = ((t % f.ciclo) + f.ciclo) % f.ciclo;
    if (ph >= f.taxi) return f.x1;
    return f.x0 + ph * f.vel;
  }

  // ---------- Motor de franja libre (compartido plaza ⇄ San Ángel ⇄ aeropuerto) ----------
  // Las dos escenas 2D son franjas caminables con el mismo modo
  // libre: personaje activo con el input (TAB alterna), el otro
  // siguiendo a su puesto con histéresis, cámara que sigue al
  // activo dentro de la franja y dibujo lateral por distancia.
  // Estas funciones son la ÚNICA implementación de esa lógica;
  // cada escena aporta su free/worldW/groundY/pan.
  function makeStripChars(x1, x2, groundY) {
    return {
      active: 'ximena',
      chars: {
        ximena: { id: 'ximena', x: x1, y: groundY, dist: 0, dir: 'right', moving: false, animWalk: false, idleT: 0, follow: false },
        jose: { id: 'jose', x: x2, y: groundY, dist: 0, dir: 'left', moving: false, animWalk: false, idleT: 0, follow: false },
      },
    };
  }
  // Estado de ANIMACIÓN de caminata: se enciende con el
  // movimiento real y se apaga con 0,12 s de gracia desde la
  // última vez que se movió (ver el porqué en updateStripFree).
  function animStepChar(ch, physically, dt) {
    if (physically) { ch.animWalk = true; ch.idleT = 0; }
    else if (ch.animWalk) { ch.idleT += dt; if (ch.idleT >= 0.12) ch.animWalk = false; }
  }
  // ¿Está el personaje sobre la cinta caminadora de la escena?
  // (la banda vive sobre la línea de caminata: basta la x dentro
  // del trecho y la y en la banda de pies de la franja).
  function onBelt(sc, ch) {
    return !!sc.belt && ch.x >= sc.belt.x0 && ch.x <= sc.belt.x1 && Math.abs(ch.y - sc.groundY) <= 40;
  }
  function updateStripFree(sc, dt) {
    const F = sc.free, A = F.chars[F.active], B = F.chars[F.active === 'ximena' ? 'jose' : 'ximena'];
    const clampX = (x) => Math.max(40, Math.min(sc.worldW - 40, x));
    const clampY = (y) => Math.max(sc.groundY - 26, Math.min(sc.groundY + 26, y));
    // --- el activo, con el input del jugador ---
    const ax = G.input.axis();
    const ix = ax.x || (touchVec ? touchVec.x : 0), iy = ax.y || (touchVec ? touchVec.y : 0);
    const ox = A.x, oy = A.y;
    if (ix || iy) {
      // sc.speedK (opcional): factor de velocidad del activo que
      // una escena puede imponer por un rato (San Ángel lo usa
      // para el trastabilleo al chocar con una bola de paja).
      // Sin el campo, el motor se comporta como siempre.
      const spd = 150 * (sc.speedK || 1);
      A.x = clampX(A.x + ix * spd * dt);
      A.y = clampY(A.y + iy * spd * dt);
    }
    const dA = Math.hypot(A.x - ox, A.y - oy);
    A.moving = dA > 0.01;
    if (A.moving) { A.dist += dA; if (Math.abs(A.x - ox) > 0.01) A.dir = A.x > ox ? 'right' : 'left'; }
    animStepChar(A, A.moving, dt);
    // --- el acompañante sigue a su puesto (histéresis: arranca
    // si el puesto se aleja > 12 px y no se detiene hasta quedar
    // a < 3 px, con velocidad proporcional de tope 190; con
    // umbral único y velocidad fija alcanzaba el puesto, paraba
    // un frame y volvía a arrancar: el sprite parpadeaba) ---
    const tx = clampX(B.id === 'jose' ? A.x + 70 : A.x - 70), ty = clampY(A.y);
    const bx = B.x, by = B.y, dx = tx - bx, dy = ty - by, dB = Math.hypot(dx, dy);
    if (!B.follow && dB > 12) B.follow = true;
    B.moving = false;
    if (B.follow) {
      if (dB <= 3) B.follow = false;
      else {
        const step = Math.min(dB, Math.min(190, dB * 7) * dt); // llegada suave: frena al acercarse
        B.x += (dx / dB) * step; B.y += (dy / dB) * step;
        B.dist += step; B.moving = true;
        if (Math.abs(dx) > 1) B.dir = dx > 0 ? 'right' : 'left';
      }
    }
    animStepChar(B, B.follow, dt);
    // --- cinta caminadora opcional de la escena (sc.belt, el
    // aeropuerto): quien esté SOBRE la banda recibe su deriva
    // (+x) sumada a su movimiento, sea el activo o el seguidor.
    // La deriva mueve la posición pero no cuenta como caminata
    // (ni distancia ni ciclo): sobre una cinta real se desliza
    // sin dar pasos.
    if (sc.belt) {
      if (onBelt(sc, A)) A.x = clampX(A.x + sc.belt.speed * dt);
      if (onBelt(sc, B)) B.x = clampX(B.x + sc.belt.speed * dt);
    }
    // --- la cámara sigue al activo dentro de la franja ---
    const camT = Math.max(0, Math.min(sc.worldW - 640, A.x - 320));
    sc.pan += (camT - sc.pan) * Math.min(1, dt * 6);
    if (Math.abs(camT - sc.pan) < 0.05) sc.pan = camT;
    // --- la banda de la carta (guion v2) avanza con el motor
    // libre: su reloj corre aquí para que ninguna escena de
    // franja tenga que acordarse de ella ---
    updateCartaBand(dt);
    D.tap = false;
  }
  // Índice del ciclo de caminata lateral según la distancia
  // recorrida: ~9,8 u por frame (la cadencia de world.js);
  // ciclos de 3 frames en ping-pong (0,1,2,1), otros en loop.
  function walkIdxFor(id, dist) {
    const len = Sp.animLen(id, 'walk_right') || 1;
    const beat = Math.floor(dist / 9.8);
    if (len === 3) { const per = 4, k = ((beat % per) + per) % per; return k < 3 ? k : per - k; }
    return ((beat % len) + len) % len;
  }
  function drawChar2DAt(c, id, x, baseY, h, anim, idx, expr, flip, bobY) {
    const fr = Sp.frame(id, anim, idx, { expr, flip });
    if (!fr || !fr.width) return;
    const w = h * fr.width / fr.height;
    c.drawImage(fr, x - w / 2, baseY - h + (bobY || 0), w, h);
  }
  function drawDoor2DAt(c, x, baseY, openK) {
    // LA Puerta: la misma en todas las escenas (madera, marco claro).
    const w = 46, h = 82, x0 = x - w / 2, y0 = baseY - h;
    c.fillStyle = 'rgba(20,14,26,0.30)'; c.beginPath(); c.ellipse(x, baseY + 3, w * 0.62, 5, 0, 0, 6.3); c.fill();
    c.fillStyle = '#e8ddc8'; c.fillRect(x0 - 4, y0 - 4, w + 8, h + 4);
    if (openK > 0) { c.fillStyle = `rgba(255,240,200,${0.55 + openK * 0.45})`; c.fillRect(x0, y0, w, h); }
    c.fillStyle = '#7a4a2b';
    const dw = w * (1 - openK * 0.72);
    c.fillRect(x0 + (w - dw), y0, dw, h);
    c.fillStyle = 'rgba(0,0,0,0.18)'; c.fillRect(x0 + (w - dw) + 5, y0 + 8, Math.max(0, dw - 10), 26); c.fillRect(x0 + (w - dw) + 5, y0 + 42, Math.max(0, dw - 10), 26);
    c.fillStyle = '#ffd23f'; c.beginPath(); c.arc(x0 + w - 7, y0 + h / 2, 2.6, 0, 6.3); c.fill();
  }

  // ---------- TAB en el modo libre (plaza y San Ángel) ----------
  // G.input no mapea Tab (no es tecla del juego): el modo cita
  // escucha por su cuenta y solo actúa en la fase 'free'.
  try {
    window.addEventListener('keydown', (e) => {
      // M = silencio de la canción (el mismo gesto que el botón
      // #dateMuteBtn), solo con el modo cita activo y sin robar
      // la tecla cuando se escribe en un campo (p. ej. el código).
      if (e.code === 'KeyM' && D.active) {
        if (e.target && /INPUT|TEXTAREA/.test(e.target.tagName || '')) return;
        toggleMute();
        return;
      }
      if (e.code === 'Tab' && D.active && D.scene && D.scene.phase === 'free') {
        if (e.preventDefault) e.preventDefault();
        D.scene.switchActive();
      }
    });
  } catch (e) { /* sin ventana: el modo libre igual funciona con un solo personaje */ }

  // ---------- Proyección analítica (réplica de la VP de gl3d.js) ----------
  // Para compensar la escala de Ximena en el depa necesito medir
  // alturas proyectadas en cualquier momento, también antes del
  // primer render (cuando la VP global de gl3d aún no existe o es
  // de otra escena). Estas tres funciones replican EXACTAMENTE
  // perspective/lookAt/mul de gl3d.js y el ojo que calcula R.begin
  // (D = dist × 1,324; eye sobre la esfera de pitch). El alto en
  // pantalla (coordenadas lógicas 640×360) no depende del aspecto,
  // así que la razón entre dos mediciones es robusta.
  // ⚠️ OJO con el eje x del lookAt (bug del playtest de Jose,
  // 2026-11-22): x = up × z con up = (0,1,0) da [z[2], 0, −z[0]].
  // La primera versión llevaba el «1» del up en la ranura z —
  // [−z[1], z[0], 0], el producto cruz con up = (0,0,1) — y la
  // cámara analítica quedaba GIRADA ~90°: todo lo dibujado con
  // projectHomePoint/drawHomeImg caía en un sitio sin relación
  // con la casa 3D (la carta de la apertura se veía flotando en
  // el borde inferior de la pantalla, sobre la pared sur, en vez
  // de sobre la mesa de centro). La compensación de escala no lo
  // delataba porque compara razones medidas con la MISMA matriz.
  function vpFromCam(cam) {
    const fov = (26 * Math.PI) / 180, asp = (G.R && G.R.w > 0 && G.R.h > 0) ? G.R.w / G.R.h : 16 / 9;
    const t = 1 / Math.tan(fov / 2), n = 140, f = 4200;
    const P = [t / asp, 0, 0, 0, 0, t, 0, 0, 0, 0, (f + n) / (n - f), -1, 0, 0, (2 * f * n) / (n - f), 0];
    const Dd = cam.dist * 1.324;
    const e = [cam.x, (cam.y || 0) + Math.sin(cam.pitch) * Dd, cam.z + Math.cos(cam.pitch) * Dd];
    const c = [cam.x, cam.y || 0, cam.z];
    let z = [e[0] - c[0], e[1] - c[1], e[2] - c[2]]; let l = Math.hypot(z[0], z[1], z[2]); z = z.map((v) => v / l);
    let x = [1 * z[2] - 0 * z[1], 0 * z[0] - 0 * z[2], 0 * z[1] - 1 * z[0]]; l = Math.hypot(x[0], x[1], x[2]); x = x.map((v) => v / l);
    const y = [z[1] * x[2] - z[2] * x[1], z[2] * x[0] - z[0] * x[2], z[0] * x[1] - z[1] * x[0]];
    const L = [x[0], y[0], z[0], 0, x[1], y[1], z[1], 0, x[2], y[2], z[2], 0,
      -(x[0] * e[0] + x[1] * e[1] + x[2] * e[2]), -(y[0] * e[0] + y[1] * e[1] + y[2] * e[2]), -(z[0] * e[0] + z[1] * e[1] + z[2] * e[2]), 1];
    const o = new Array(16);
    for (let cc = 0; cc < 4; cc++) for (let r = 0; r < 4; r++) o[cc * 4 + r] = P[r] * L[cc * 4] + P[4 + r] * L[cc * 4 + 1] + P[8 + r] * L[cc * 4 + 2] + P[12 + r] * L[cc * 4 + 3];
    return o;
  }
  function projectWithCam(m, x, y, z) {
    const w = m[3] * x + m[7] * y + m[11] * z + m[15];
    return { x: ((m[0] * x + m[4] * y + m[8] * z + m[12]) / w * 0.5 + 0.5) * 640, y: (1 - ((m[1] * x + m[5] * y + m[9] * z + m[13]) / w * 0.5 + 0.5)) * 360, ok: w > 0 };
  }

  // ---------- La carta: banda, panel y dibujo en la casa ----------
  // La regla de lectura es LA MISMA del juego (scenes.js, las
  // cinemáticas de Leyendas): cada texto dura como mínimo
  // 2,4 s y crece 0,045 s por carácter. Aquí se aplica a los
  // fragmentos de la caminata (la banda) y a la lectura en
  // pareja del regreso.
  const CARTA_READ_MIN = 2.4, CARTA_READ_PER_CHAR = 0.045;
  const cartaReadTime = (txt) => Math.max(CARTA_READ_MIN, CARTA_READ_PER_CHAR * (txt || '').length);
  // La BANDA de la carta (Acto 2): banda inferior estilo carta
  // (papel crema) que entra con fundido, permanece lo que
  // manda la regla de lectura y se desvanece, SIN pausar el
  // movimiento, la música ni los obstáculos (su reloj corre
  // dentro de updateStripFree, el motor libre compartido).
  // Regla de solape: si un fragmento llega con otra banda en
  // curso, queda EN ESPERA (una sola en cola) y entra cuando
  // la actual termina de desvanecerse — nunca se enciman.
  const CARTA_BAND_IN = 0.45, CARTA_BAND_OUT = 0.6;
  const cartaBand = { text: null, t: 0, total: 0, pending: null };
  function showCartaBand(text) {
    if (!text) return;
    if (cartaBand.text) { cartaBand.pending = text; return; }
    cartaBand.text = text; cartaBand.t = 0;
    cartaBand.total = CARTA_BAND_IN + cartaReadTime(text) + CARTA_BAND_OUT;
  }
  function updateCartaBand(dt) {
    if (!cartaBand.text) return;
    cartaBand.t += dt;
    if (cartaBand.t >= cartaBand.total) {
      const next = cartaBand.pending;
      cartaBand.text = null; cartaBand.pending = null; cartaBand.t = 0; cartaBand.total = 0;
      if (next) showCartaBand(next);
    }
  }
  function cartaBandAlpha() {
    if (!cartaBand.text) return 0;
    const t = cartaBand.t;
    if (t < CARTA_BAND_IN) return t / CARTA_BAND_IN;
    if (t > cartaBand.total - CARTA_BAND_OUT) return Math.max(0, (cartaBand.total - t) / CARTA_BAND_OUT);
    return 1;
  }
  // Corte de líneas para los textos de la carta, medido con la
  // misma fuente con la que G.text los dibuja (sin negrita: es
  // una carta, no un rótulo). Respeta los saltos de párrafo.
  function wrapCartaText(c, text, size, maxW) {
    c.font = `${size}px ${G.FONT}`;
    const lines = [];
    for (const para of String(text).split('\n')) {
      const words = para.split(' '); let cur = '';
      for (const w of words) {
        if (cur && c.measureText(cur + ' ' + w).width > maxW) { lines.push(cur); cur = w; }
        else cur = cur ? cur + ' ' + w : w;
      }
      lines.push(cur);
    }
    return lines;
  }
  // La banda inferior en sí: papel crema con su filete cálido,
  // centrada abajo, sin tapar los pies de la pareja más que lo
  // justo (es baja y breve).
  function drawCartaBand(c) {
    if (!cartaBand.text) return;
    const a = cartaBandAlpha();
    if (a <= 0) return;
    const lines = wrapCartaText(c, cartaBand.text, 11.5, 500);
    c.font = `${11.5}px ${G.FONT}`;
    const wLine = Math.max(...lines.map((l) => c.measureText(l).width));
    const w = Math.min(580, wLine + 46), h = lines.length * 15 + 19;
    const x = (640 - w) / 2, y = 360 - 12 - h;
    c.save();
    c.globalAlpha = a;
    c.fillStyle = '#f7efdb';
    c.beginPath(); c.roundRect(x, y, w, h, 7); c.fill();
    c.strokeStyle = '#b98d4f'; c.lineWidth = 1.4;
    c.beginPath(); c.roundRect(x, y, w, h, 7); c.stroke();
    c.fillStyle = '#a84a41'; c.fillRect(x + 10, y + 4.5, w - 20, 1.6);
    lines.forEach((l, i) => {
      G.text(c, l, 320, y + 13 + i * 15, { size: 11.5, bold: false, color: '#3a2c22', stroke: false });
    });
    c.restore();
  }
  // La INSTRUCCIÓN DE OBJETIVO de la apertura (pedido de Jose
  // en su playtest del 2026-11-22: «debería haber una
  // instrucción que me diga busca la carta o algo así, para
  // que el jugador sepa que tiene que buscar la carta»).
  // Mientras la carta no se abra, la cita dice qué hay que
  // hacer en una banda de papel ARRIBA (la banda de los
  // fragmentos va abajo), PERSISTENTE: es espacio de pantalla,
  // no del mundo, así que se ve desde cualquier rincón del
  // depa, sin depender de la proximidad a la sala. Al abrir
  // la carta se retira y la guía «a la plaza →» toma el relevo.
  const CARTA_OBJETIVO = 'Hay una carta para ti en la sala: búscala sobre la mesa de centro y ábrela';
  function objetivoCartaActivo(scene) {
    return !!scene && scene.phase === 'depa' && !D.cartaAbierta;
  }
  function drawCartaObjetivo(c) {
    const lines = wrapCartaText(c, CARTA_OBJETIVO, 11.5, 500);
    c.font = `${11.5}px ${G.FONT}`;
    const wLine = Math.max(...lines.map((l) => c.measureText(l).width));
    const w = Math.min(580, wLine + 46), h = lines.length * 15 + 19;
    const x = (640 - w) / 2, y = 10;
    c.save();
    c.fillStyle = '#f7efdb';
    c.beginPath(); c.roundRect(x, y, w, h, 7); c.fill();
    c.strokeStyle = '#b98d4f'; c.lineWidth = 1.4;
    c.beginPath(); c.roundRect(x, y, w, h, 7); c.stroke();
    c.fillStyle = '#a84a41'; c.fillRect(x + 10, y + 4.5, w - 20, 1.6);
    lines.forEach((l, i) => {
      G.text(c, l, 320, y + 13 + i * 15, { size: 11.5, bold: false, color: '#3a2c22', stroke: false });
    });
    c.restore();
  }
  // El PANEL estilo carta (la apertura a ritmo del jugador y
  // la lectura en pareja): tarjeta de papel centrada, con su
  // sello de cera, el texto envuelto y, si se pide, la firma
  // al pie y el aviso de avance.
  function drawCartaPanel(c, text, alpha, firma, hint) {
    if (alpha <= 0) return;
    const lines = wrapCartaText(c, text, 12, 420);
    const w = 478, h = lines.length * 16.5 + (firma ? 24 : 0) + (hint ? 16 : 0) + 30;
    const x = (640 - w) / 2, y = Math.max(18, (360 - h) / 2 - 6);
    c.save();
    c.globalAlpha = Math.max(0, Math.min(1, alpha));
    c.fillStyle = 'rgba(16,10,18,0.30)'; c.fillRect(0, 0, 640, 360);
    c.fillStyle = '#f7efdb';
    c.beginPath(); c.roundRect(x, y, w, h, 9); c.fill();
    c.strokeStyle = '#b98d4f'; c.lineWidth = 1.6;
    c.beginPath(); c.roundRect(x, y, w, h, 9); c.stroke();
    c.fillStyle = '#a84a41'; c.beginPath(); c.arc(x + w - 20, y + 18, 7, 0, 6.3); c.fill();
    c.fillStyle = '#c9625a'; c.beginPath(); c.arc(x + w - 20, y + 18, 4.4, 0, 6.3); c.fill();
    lines.forEach((l, i) => {
      G.text(c, l, 320, y + 24 + i * 16.5, { size: 12, bold: false, color: '#3a2c22', stroke: false });
    });
    if (firma) G.text(c, firma, x + w - 18, y + h - 16, { size: 11.5, color: '#7a4a2b', align: 'right', stroke: false });
    if (hint) G.text(c, hint, 320, y + h - 9, { size: 8.5, bold: false, color: '#97804f', stroke: false });
    c.restore();
  }
  // Un punto del mundo de la casa, proyectado a pantalla con
  // la cámara de ESA casa (la misma VP analítica de la
  // compensación de escala).
  function projectHomePoint(home, x, y, z) {
    return projectWithCam(vpFromCam(home.cam), x, y, z);
  }
  // Dibuja una imagen como billboard vertical en la casa 3D:
  // su base apoyada en (x, yBase, z) y su alto = worldH
  // unidades de mundo (con el estiramiento vertical del motor,
  // para casar con los billboards de los actores). Devuelve
  // true si dibujó (la imagen cargó y el punto se ve).
  function drawHomeImg(home, c, img, x, yBase, z, worldH, flip) {
    if (!imgOk(img)) return false;
    const vp = vpFromCam(home.cam);
    const p0 = projectWithCam(vp, x, yBase, z), p1 = projectWithCam(vp, x, yBase + worldH, z);
    if (!p0.ok) return false;
    const stretch = Math.min(1.4, 1 / Math.cos(home.cam.pitch || 0.8));
    const hPx = Math.abs(p0.y - p1.y) * stretch;
    if (!(hPx > 2)) return false;
    const wPx = hPx * img.naturalWidth / img.naturalHeight;
    c.fillStyle = 'rgba(20,14,26,0.20)';
    c.beginPath(); c.ellipse(p0.x, p0.y, wPx * 0.34, Math.max(2, hPx * 0.04), 0, 0, 6.3); c.fill();
    if (flip) {
      c.save(); c.translate(p0.x, p0.y - hPx); c.scale(-1, 1);
      c.drawImage(img, -wPx / 2, 0, wPx, hPx);
      c.restore();
    } else {
      c.drawImage(img, p0.x - wPx / 2, p0.y - hPx, wPx, hPx);
    }
    return true;
  }

  // =========================================================
  // ESCENA DEL EASTER EGG (Parte 1): depa → puerta → plaza
  // =========================================================
  class DateScene {
    constructor(onDone) {
      this.onDone = onDone || null;
      this.phase = 'depa'; this.t = 0; this.phaseT = 0;
      this.nearDoor = false; this.doneFired = false;
      this.cartaSeq = null; this.nearCarta = false; // la secuencia de apertura de la carta (guion v2)
      this.pan = 0; this.joseReacted = false; this.joseExpr = null;
      // --- El depa con TODOS escondidos (staging de la llegada,
      // invertido): los 7 roomies DENTRO del armario, solo los
      // ojos en la rendija (CLOSET_PEEK); Pollito escondido con
      // ellos; Jose NO está (espera en la plaza). Ximena es la
      // protagonista y se la controla desde el primer segundo.
      const home = new G.Scenes.HomeScene(G.PLAYABLE.slice());
      home.wander = false; home.xState = 'away'; home.setLight('dia', true);
      home.roomies.forEach((a) => { a.x = 600; a.y = 346; a.dir = 'down'; a.hidden = true; });
      home.closetPeek = G.PLAYABLE.slice();
      W.closet.k = W.CLOSET_PEEK; W.closet.target = W.CLOSET_PEEK;
      home.cat.x = 600; home.cat.y = 346; home.cat.hidden = true;
      home.jose.hidden = true;
      const xi = home.xi;
      xi.hidden = false; xi.x = 800; xi.y = 470; xi.dir = 'down'; xi.expr = null; xi.speed = 165;
      W.xDoorOpen = true; // la puerta de SU cuarto (pasillo↔xroom) queda abierta
      home.follow(xi, 560);
      home.cam.x = xi.x; home.cam.z = xi.y - 30; home.cam.dist = 560;
      this.home = home; this.xi = xi;
      // --- Compensación de escala de Ximena en el depa (SOLO modo
      // cita): el render 3D proyecta con perspectiva y al bajar
      // hacia la cámara su sprite se ve MÁS GRANDE (en el juego
      // normal es intencional; aquí Jose lo reportó como defecto).
      // Referencia: la altura proyectada de su sprite en el spawn
      // (800,470) con la cámara de seguimiento ya asentada (la que
      // fija home.follow: dist 560, pitch 0,8, centrada en ella).
      // Cada frame se mide la altura proyectada actual con la
      // cámara real (que la sigue con retardo) y se ajusta
      // xi.scale = ref/actual para cancelarla. Ver
      // compensateScale() y rawProjectedHeight().
      this.scaleRef = this.rawProjectedHeight(800, 470, { x: 800, y: 0, z: 440, dist: 560, pitch: 0.8 });
      // --- La plaza como mundo navegable (modo libre, ver
      // updateFree): la franja mide lo que manda la tabla
      // maestra (w de 'plaza' = 29 s × PACE = 4350 px de mundo);
      // la cámara (this.pan, en px de mundo a velocidad L4) se
      // desplaza 0..(4350−640) = 0..3710. La Puerta queda FIJA
      // donde quedó al llegar (mundo x=174) y los personajes
      // parten de sus posiciones de mundo del revelado (al final
      // del paneo, cámara=90: Ximena en pantalla 168 → mundo
      // 258; Jose 238 → 328). A 150 u/s (PACE), cruzar la franja
      // entera caminando toma los 29 s de su bloque de la
      // canción: esa es la regla de distancias (ver DATE_SCENES).
      this.worldW = sceneOf('plaza').w; this.doorX = 174; this.groundY = 316;
      this.free = makeStripChars(258, 328, 316);
      // La Puerta de SALIDA de la plaza: la misma Puerta de
      // siempre, al final de la franja (mundo x=4250, ~100 px de
      // margen al borde), justo donde ancla la vista lejana de
      // San Ángel que se ve en el fondo (PLAZA_FX.vistaWorldX).
      // Cruzarla lleva a la escena de San Ángel; la cadena
      // sigue desde ahí (la Puerta del árbol de San Ángel va al
      // aeropuerto y las de allá devuelven a San Ángel, cuya
      // Puerta de entrada trae de vuelta aquí).
      this.exitDoorX = PLAZA_FX.vistaWorldX; this.nearExit = false;
      // --- El tráfico de la calle (ver PLAZA_TRAFICO): los
      // encuentros (Alebrije/Teodora, alternando) y los autos
      // con calaverita viven SOLO en el modo libre. frenoT /
      // speedK son el trastabilleo de los autos, con el mismo
      // gancho del motor que usan las bolas de paja de San
      // Ángel y los Calcifers de las praderas.
      this.frenoT = 0; this.speedK = 1;
      this.encuentros = []; this.encuentroTimer = 6 + Math.random() * 4;
      this.encuentroNext = Math.random() < 0.5 ? 'alebrije' : 'teodora';
      this.autos = []; this.autoTimer = 5 + Math.random() * 3;
    }
    // Altura en pantalla (px lógicos) de un segmento vertical con
    // la altura del sprite de Ximena, plantado en (x, z), visto
    // con la cámara `cam`. Réplica analítica de R.project sobre
    // la VP de esa cámara (ver vpFromCam). El billboard se estira
    // ×R.stretch (= min(1,4, 1/cos(pitch)), como en R.end), así
    // que el segmento medido lleva ese factor, igual que el
    // sprite real al dibujarse.
    rawProjectedHeight(x, z, cam) {
      const m = vpFromCam(cam);
      const stretch = Math.min(1.4, 1 / Math.cos(cam.pitch));
      const H = (Sp.charTop('ximena') || 80) * stretch;
      const p0 = projectWithCam(m, x, 0, z), p1 = projectWithCam(m, x, H, z);
      return Math.abs(p0.y - p1.y);
    }
    // Altura proyectada ACTUAL de Ximena, ya con su scale aplicado
    // (el alto del billboard es proporcional a actor.scale).
    projectedHeight() {
      return this.rawProjectedHeight(this.xi.x, this.xi.y, this.home.cam) * this.xi.scale;
    }
    // Ajusta xi.scale para que su altura en pantalla sea la del
    // spawn, mueva donde la mueva dentro del depa. Se llama al
    // final de cada update de la fase 'depa' (con la cámara ya
    // actualizada por HomeScene). Clamp [0,8, 1,25]: si la
    // corrección pidiera más (p. ej. cámara aún muy lejos en los
    // primeros frames), se aplica lo que se puede sin deformar.
    compensateScale() {
      if (!this.scaleRef) return;
      const actual = this.rawProjectedHeight(this.xi.x, this.xi.y, this.home.cam);
      if (!(actual > 0)) return;
      const s = this.scaleRef / actual;
      this.xi.scale = Math.max(0.8, Math.min(1.25, s));
    }
    switchActive() {
      if (this.phase !== 'free') return;
      this.free.active = this.free.active === 'ximena' ? 'jose' : 'ximena';
      if (G.input && G.input.flush) G.input.flush();
    }
    openDoor() {
      if (this.phase !== 'depa') return;
      // La salida está DORMIDA hasta abrir la carta (guion
      // v2): sin la carta no hay cita, y esta puerta es su
      // cerradura — ni con ESPACIO ni con toque se abre.
      if (!D.cartaAbierta) return;
      this.phase = 'door'; this.phaseT = 0; D.state = 'door';
      // Sin sonido al ABRIR: el cierre real de la puerta suena
      // una sola vez por cruce, al llegar a la plaza.
      this.xi.route = null; this.xi.vx = this.xi.vy = 0; this.xi.moving = false;
    }
    // ---------- La carta (guion v2, Acto 1) ----------
    // La secuencia de apertura: Ximena toma el sobre (pose
    // ximena-sobre), lo abre y lee la hoja (las poses de
    // lectura en bucle lento) mientras el fragmento de
    // apertura espera en el panel, a ritmo del jugador. Al
    // avanzar, la carta queda con ella y la salida despierta.
    startCartaSeq() {
      if (this.phase !== 'depa' || D.cartaAbierta) return;
      this.phase = 'carta'; this.cartaSeq = { step: 'toma', t: 0 };
      const xi = this.xi;
      xi.route = null; xi.vx = xi.vy = 0; xi.moving = false;
      xi.dir = 'up'; // frente a la mesa de centro
      D.tap = false;
    }
    cartaPoseImg() {
      const S = this.cartaSeq; if (!S) return null;
      if (S.step === 'toma') return ximenaSobreImg;
      return Math.floor(S.t / 1.4) % 2 === 0 ? lecturaSolaImg : lecturaSola2Img;
    }
    updateCartaSeq(dt) {
      const S = this.cartaSeq;
      if (!S) { this.phase = 'depa'; return; }
      S.t += dt;
      // La pose manda sobre el actor: si su imagen cargó, el
      // actor se oculta y la pose lo reemplaza (draw); si no
      // cargó, el actor queda visible como respaldo.
      this.xi.hidden = imgOk(this.cartaPoseImg());
      if (S.step === 'toma') {
        if (S.t >= 0.8) { S.step = 'lee'; S.t = 0; }
        return;
      }
      // 'lee': el fragmento se queda lo que dure SU lectura;
      // se avanza con ESPACIO/toque, sin reloj que apure.
      if (G.input.hit('action') || D.tap) {
        D.cartaAbierta = true;
        this.xi.hidden = false;
        this.cartaSeq = null;
        this.phase = 'depa';
        D.tap = false;
      }
    }
    update(dt) {
      this.t += dt;
      if (this.phase === 'carta') {
        // Control bloqueado; la casa sigue viva detrás (los
        // ojitos del armario no se congelan por una carta).
        this.home.update(dt);
        this.updateCartaSeq(dt);
        D.tap = false;
        return;
      }
      if (this.phase === 'depa') {
        const ax = G.input.axis();
        const ix = ax.x || (touchVec ? touchVec.x : 0), iy = ax.y || (touchVec ? touchVec.y : 0);
        // 165 u/s: caminata ágil. Queda por debajo de RUN_SPD (178,
        // world.js) a propósito: usa los ciclos walk_* de su hoja
        // definida y no los run_* — va a una cita, no huyendo.
        this.xi.walk(ix, iy, 165, dt);
        this.home.update(dt);
        this.compensateScale(); // tamaño en pantalla constante (solo modo cita)
        this.nearDoor = Math.hypot(this.xi.x - MAIN_DOOR.x, this.xi.y - MAIN_DOOR.y) < 52;
        this.nearCarta = !D.cartaAbierta &&
          Math.hypot(this.xi.x - CARTA_POS.x, this.xi.y - CARTA_POS.y) < CARTA_POS.r;
        const act = G.input.hit('action') || D.tap;
        if (this.nearCarta && act) this.startCartaSeq();
        else if (this.nearDoor && act) this.openDoor(); // dormida sin la carta: openDoor lo verifica
        D.tap = false;
        return;
      }
      if (this.phase === 'door') {
        // La puerta se abre y la LUZ se lo traga todo (~1 s): al
        // otro lado ya no está el pasillo, está la plaza. La
        // transición es en SILENCIO (decisión de Jose, 2026-11-21):
        // la canción no arranca en el depa ni cruzando la puerta;
        // arranca cuando la escena de la plaza se activa (la fase
        // 'plaza', justo debajo), y desde su inicio.
        this.home.update(dt);
        this.phaseT += dt;
        if (this.phaseT >= 1) {
          this.phase = 'plaza'; this.phaseT = 0; D.state = 'plaza';
          playDoorClose(); // la misma puerta se cierra detrás de ella, ya en la plaza (grabación real)
        }
        return;
      }
      if (this.phase === 'plaza') {
        // La escena de la plaza SE ACTIVA: aquí arranca la
        // canción (desde su inicio, con el salto del silencio
        // del archivo) y el reloj de la cita parte de 0. Una
        // sola vez por sesión de la cita: D.clockStarted lo
        // garantiza, y los viajes entre escenas nunca vuelven
        // por esta fase (regresan directo a 'free').
        if (!D.clockStarted) { D.clockStarted = true; startClock(); }
        this.phaseT += dt;
        const k = Math.min(1, this.phaseT / 4);
        // El paneo del revelado ES la cámara (this.pan, en px de
        // mundo): arranca en 0 y se asienta en 90, el encuadre de
        // la llegada. En 'free' la misma variable sigue a quien
        // se controle.
        this.pan = (k * k * (3 - 2 * k)) * 90; // paneo suave (smoothstep) del revelado
        if (this.phaseT >= 1.2 && !this.joseReacted) {
          this.joseReacted = true; this.joseExpr = 'happy'; D.joseJoined = true;
        }
        if (this.phaseT >= 4) {
          // La llegada NO cierra la escena: se entra al modo
          // libre de revisión ('free'). D.state sigue siendo
          // 'plaza-arrived' y onDone NO se dispara solo jamás:
          // se sale a mano desde el menú de pausa (Esc → Salir,
          // que recarga al título como en el resto del juego).
          this.phase = 'free'; this.phaseT = 0;
          D.state = 'plaza-arrived'; D.arrived = true;
        }
        return;
      }
      if (this.phase === 'free') {
        this.phaseT += dt;
        this.updateFree(dt);
      }
      if (this.phase === 'exitdoor') {
        // Cruzando la Puerta de salida: la luz crece ~1 s y al
        // otro lado está San Ángel. El reloj de la cita NO se
        // reinicia: es el mismo paseo (y si la canción ya acabó,
        // las escenas siguen en silencio).
        this.phaseT += dt;
        if (this.phaseT >= 1) travelTo('sanangel');
      }
    }
    // Cruzar la Puerta de salida hacia San Ángel (desde el modo
    // libre, junto a ella, con ESPACIO/acción o toque).
    beginExit() {
      if (this.phase !== 'free') return;
      this.phase = 'exitdoor'; this.phaseT = 0; D.tap = false;
      // La calle queda limpia para la próxima visita: ni
      // encuentros ni autos a mitad de cruce al volver.
      this.encuentros = []; this.autos = []; this.frenoT = 0; this.speedK = 1;
      playDoorClose(); // la Puerta se cierra tras la pareja (grabación real)
    }
    // Vuelta desde San Ángel: se reaparece en modo libre junto
    // a la Puerta de salida, como se dejó la plaza.
    enterFromAngel() {
      this.phase = 'free'; this.phaseT = 0;
      const F = this.free, A = F.chars[F.active], B = F.chars[F.active === 'ximena' ? 'jose' : 'ximena'];
      A.x = this.exitDoorX - 70; A.y = this.groundY;
      B.x = this.exitDoorX - 140; B.y = this.groundY; B.follow = false;
      this.pan = Math.max(0, Math.min(this.worldW - 640, A.x - 320));
      this.nearExit = false;
    }
    // ---------- Modo libre de la plaza (revisión a detalle) ----------
    // Sin fin automático: ni el fin de la canción ni el paso del
    // tiempo cierran la escena (el reloj puede agotarse y el modo
    // sigue en silencio; la canción NO entra en loop). El motor
    // del modo (activo con input, TAB, seguidor con histéresis,
    // cámara) vive en updateStripFree, compartido con San Ángel;
    // aquí solo se vigila la Puerta de salida, ANTES de que el
    // motor consuma el toque (D.tap) del frame.
    updateFree(dt) {
      const F = this.free, A = F.chars[F.active];
      this.nearExit = Math.abs(A.x - this.exitDoorX) < 58 && Math.abs(A.y - this.groundY) < 40;
      if (this.nearExit && (G.input.hit('action') || D.tap)) { this.beginExit(); return; }
      // El trastabilleo de los autos con calaverita: el motor
      // compartido mueve al activo con speedK (×0,4) mientras
      // dure (mismo patrón que San Ángel y las praderas).
      if (this.frenoT > 0) this.frenoT = Math.max(0, this.frenoT - dt);
      this.speedK = this.frenoT > 0 ? PLAZA_TRAFICO.autos.frenoK : 1;
      this.updateEncuentros(dt);
      this.updateAutos(dt);
      updateStripFree(this, dt);
      // El fragmento de la PLAZA (guion v2): cae al asomar la
      // Catedral — unos pasos después de la llegada, ya en
      // modo libre y lejos de las Puertas (junto a la de
      // salida el disparo espera a que la pareja se aleje) —,
      // una sola vez por partida.
      if (!D.cartaFrag.plaza && !this.nearExit && A.x >= 430) {
        D.cartaFrag.plaza = true;
        showCartaBand(CARTA_TEXTOS.plaza);
      }
    }
    // Los ENCUENTROS de la calle: el Alebrije y Teodora cruzan
    // de derecha a izquierda, alternando, con intervalos
    // generosos entre cruces (la plaza es larga: cada uno puede
    // aparecer más de una vez en el paseo). Nacen por delante
    // de la cámara y cruzan hasta salir del encuadre; al salir
    // del todo se rearma el intervalo del siguiente. Sin
    // colisión ni interacción: son transeúntes.
    updateEncuentros(dt) {
      const E = PLAZA_TRAFICO;
      this.encuentroTimer -= dt;
      if (this.encuentroTimer <= 0 && !this.encuentros.length) {
        const kind = this.encuentroNext;
        this.encuentros.push({
          kind, x: this.pan + 640 + 150, y: this.groundY + (Math.random() * 36 - 16),
          dist: 0, ph: Math.random() * 6.28,
        });
        this.encuentroNext = kind === 'alebrije' ? 'teodora' : 'alebrije';
        this.encuentroTimer = E.intervaloMin + Math.random() * (E.intervaloMax - E.intervaloMin);
      }
      const keep = [];
      for (const e of this.encuentros) {
        const vel = e.kind === 'alebrije' ? E.alebrije.vel : E.teodora.vel;
        e.x -= vel * dt; e.dist += vel * dt;
        if (e.x > this.pan - 240) keep.push(e);
        else if (!keep.length) this.encuentroTimer = Math.max(this.encuentroTimer, E.intervaloMin + Math.random() * (E.intervaloMax - E.intervaloMin));
      }
      this.encuentros = keep;
    }
    // Los AUTOS CON CALAVERITA: nacen por delante de la cámara
    // con un carril (una y dentro de la banda caminable) y
    // cruzan de derecha a izquierda hasta salir. El golpe exige
    // SOLAPE REAL con el personaje CONTROLADO: su x dentro del
    // largo del auto (con un pelo de margen por el borde blanco
    // del recorte) y su y a ±laneTol del carril; el seguidor
    // nunca se comprueba (es inmune) y cada auto afecta una
    // sola vez por pasada. Cadencia prudente y nada de autos
    // pegados a la Puerta de salida (no nacen con el aviso de
    // cruce activo).
    updateAutos(dt) {
      const AU = PLAZA_TRAFICO.autos, F = this.free, A = F.chars[F.active];
      this.autoTimer -= dt;
      if (this.autoTimer <= 0) {
        if (this.autos.length < AU.maxVivos && !this.nearExit) {
          this.autos.push({
            modelo: Math.random() < 0.5 ? 0 : 1,
            x: this.pan + 640 + AU.w / 2 + 60,
            laneY: this.groundY + (Math.random() * 48 - 24),
            vel: AU.velMin + Math.random() * (AU.velMax - AU.velMin),
            ph: Math.random() * 6.28, hitDone: false,
          });
        }
        this.autoTimer = AU.cadMin + Math.random() * (AU.cadMax - AU.cadMin);
      }
      const keep = [];
      for (const car of this.autos) {
        car.x -= car.vel * dt;
        if (car.x < this.pan - AU.w - 80 || car.x + AU.w / 2 < 0) continue; // salió del encuadre o del mundo
        if (!car.hitDone && Math.abs(A.y - car.laneY) <= AU.laneTol && Math.abs(A.x - car.x) <= AU.w / 2 * 0.94) {
          car.hitDone = true;
          this.frenoT = AU.frenoT; // trastabilleo: el auto sigue su camino
        }
        keep.push(car);
      }
      this.autos = keep;
    }
    // Un encuentro en la capa de la calle: el Alebrije camina
    // (bob por distancia, como la pareja) y Teodora flota (bob
    // por tiempo y los pies por encima de su línea de calle).
    drawEncuentro(c, e) {
      const x = e.x - this.pan;
      if (x < -240 || x > 880) return;
      if (e.kind === 'alebrije') {
        if (!imgOk(alebrijeImg)) return;
        const h = PLAZA_TRAFICO.alebrije.h, w = h * alebrijeImg.naturalWidth / alebrijeImg.naturalHeight;
        const bob = Math.sin(e.dist * 0.09) * 1.6;
        c.fillStyle = 'rgba(20,14,26,0.20)'; c.beginPath(); c.ellipse(x, e.y + 3, w * 0.36, 4.5, 0, 0, 6.3); c.fill();
        // El perfil de diseño mira a la derecha y él camina a
        // la izquierda: se espeja SOLO este perfil (ver la nota
        // de identidad en PLAZA_TRAFICO).
        c.save(); c.translate(x, e.y - h + bob); c.scale(-1, 1);
        c.drawImage(alebrijeImg, -w / 2, 0, w, h);
        c.restore();
      } else {
        if (!imgOk(teodoraImg)) return;
        const cfg = PLAZA_TRAFICO.teodora, h = cfg.h, w = h * teodoraImg.naturalWidth / teodoraImg.naturalHeight;
        const bob = Math.sin(this.t * 2.1 + e.ph) * 3;
        c.fillStyle = 'rgba(20,14,26,0.16)'; c.beginPath(); c.ellipse(x, e.y + 3, w * 0.3, 4, 0, 0, 6.3); c.fill();
        c.drawImage(teodoraImg, x - w / 2, e.y - cfg.floatAlt + bob - h, w, h);
      }
    }
    // Un auto con calaverita en la capa de la calle: el recorte
    // de foto con su leve bob de suspensión y la calaverita al
    // volante asomando por la ventanilla del conductor (busto
    // compuesto como el de Pollito en el vocho). Si la foto no
    // cargó, respaldo dibujado por código del color del modelo:
    // el obstáculo nunca es invisible.
    drawAuto(c, car) {
      const AU = PLAZA_TRAFICO.autos, M = AU.modelos[car.modelo], W = AU.w;
      const x = car.x - this.pan;
      if (x < -W || x > 640 + W) return;
      const t = this.t, foto = imgOk(M.img);
      const H = foto ? W * M.img.naturalHeight / M.img.naturalWidth : W * 0.34;
      const bottom = car.laneY + 16, top = bottom - H, left = x - W / 2;
      const bob = Math.sin(t * 29 + car.ph) * 0.7;
      if (foto) {
        c.drawImage(M.img, left, top + bob, W, H);
      } else {
        c.fillStyle = M.color;
        c.fillRect(left, top + bob + H * 0.38, W, H * 0.47);
        c.fillRect(left + W * 0.27, top + bob + H * 0.1, W * 0.44, H * 0.32);
        c.fillStyle = 'rgba(24,20,32,0.85)';
        c.beginPath(); c.arc(left + W * 0.22, bottom - 5, H * 0.15, 0, 6.3); c.fill();
        c.beginPath(); c.arc(left + W * 0.78, bottom - 5, H * 0.15, 0, 6.3); c.fill();
      }
      if (imgOk(M.bust)) {
        const bw2 = W * M.bustW, bh2 = bw2 * M.bust.naturalHeight / M.bust.naturalWidth;
        c.drawImage(M.bust, left + W * M.winCx - bw2 / 2, top + bob + H * M.winBase - bh2 + Math.sin(t * 17 + car.ph) * 0.6, bw2, bh2);
      }
    }
    animStep(ch, physically, dt) { animStepChar(ch, physically, dt); }
    draw(dt) {
      if (this.phase === 'depa' || this.phase === 'door' || this.phase === 'carta') {
        this.home.draw(dt);
        const c = G.ovCtx; if (!c) return;
        c.setTransform(2, 0, 0, 2, 0, 0);
        if (this.phase === 'carta') {
          // La pose de la secuencia reemplaza a Ximena en su
          // sitio (si la imagen cargó; si no, el actor visible
          // hace de respaldo y no se dibuja nada encima).
          const img = this.cartaPoseImg();
          if (imgOk(img)) drawHomeImg(this.home, c, img, this.xi.x, 0, this.xi.y, cartaPoseWorldH(this.xi.scale), false);
          if (this.cartaSeq && this.cartaSeq.step === 'lee') {
            drawCartaPanel(c, CARTA_TEXTOS.apertura, Math.min(1, this.cartaSeq.t * 2 + 0.4), null, 'ESPACIO: seguir');
          }
          return;
        }
        // La carta sobre la mesa de centro, con su brillo
        // sutil pulsante (es un objeto íntimo: nada de cartel
        // gigante). Al abrirla desaparece de la mesa: la
        // lleva ella.
        if (!D.cartaAbierta) {
          const p = projectHomePoint(this.home, CARTA_POS.x, CARTA_TOP, CARTA_POS.y);
          if (p.ok) {
            const gl = 0.15 + 0.11 * (0.5 + 0.5 * Math.sin(this.t * 2.4));
            const grd = c.createRadialGradient(p.x, p.y, 2, p.x, p.y, 30);
            grd.addColorStop(0, `rgba(255,224,150,${gl.toFixed(3)})`);
            grd.addColorStop(1, 'rgba(255,224,150,0)');
            c.fillStyle = grd; c.beginPath(); c.arc(p.x, p.y, 30, 0, 6.3); c.fill();
          }
          drawHomeImg(this.home, c, cartaSobreImg, CARTA_POS.x, CARTA_TOP, CARTA_POS.y, 20, false);
        }
        // La instrucción de objetivo, mientras la carta no
        // se abra: persistente y visible desde todo el depa.
        if (objetivoCartaActivo(this)) drawCartaObjetivo(c);
        if (this.phase === 'depa' && this.nearCarta && !D.cartaAbierta) {
          const h = this.xi.head(46);
          if (h && isFinite(h.x)) G.prompt(c, 'ESPACIO: abrir la carta', h.x, h.y);
        } else if (this.phase === 'depa' && this.nearDoor && D.cartaAbierta) {
          const h = this.xi.head(46);
          if (h && isFinite(h.x)) G.prompt(c, 'ESPACIO: abrir la puerta', h.x, h.y);
        }
        // Ya con la carta abierta, la salida se anuncia sola:
        // la guía hacia la puerta, en el lenguaje de la cita.
        if (this.phase === 'depa' && D.cartaAbierta) {
          const dp = projectHomePoint(this.home, MAIN_DOOR.x, 80, MAIN_DOOR.y);
          if (dp.ok) {
            c.save();
            c.globalAlpha = 0.62 + 0.30 * Math.sin(this.t * 3);
            G.text(c, 'a la plaza →', dp.x, dp.y, { size: 10.5, color: '#ffe9a8' });
            c.restore();
          }
        }
        if (this.phase === 'door') {
          const a = Math.min(1, this.phaseT / 1);
          c.fillStyle = `rgba(255,244,214,${(a * a).toFixed(3)})`;
          c.fillRect(0, 0, 640, 360);
        }
        return;
      }
      this.drawPlaza();
    }
    // ---------- La plaza por capas (canvas 2D, 640×360) ----------
    // Cielo, vista lejana de San Ángel, avión, Catedral, Parroquia
    // de Mineral del Chico, bandera, edificios, puesto de tacos,
    // piso, Puerta y personajes, poste de primer plano y el vocho
    // de Pollito cruzando por delante.
    drawPlaza() {
      const c = G.ovCtx; if (!c) return;
      c.setTransform(2, 0, 0, 2, 0, 0);
      c.clearRect(0, 0, 640, 360);
      const t = this.t, pan = this.pan; // cámara en px de mundo (velocidad L4); cada capa aplica su factor
      const horizon = 252;
      // L0 · cielo de tarde dorada + nubes dibujadas
      const sky = c.createLinearGradient(0, 0, 0, horizon);
      sky.addColorStop(0, '#7fb2d9'); sky.addColorStop(0.55, '#c9d9e8'); sky.addColorStop(0.82, '#f6cf8e'); sky.addColorStop(1, '#ffd9a0');
      c.fillStyle = sky; c.fillRect(0, 0, 640, horizon + 2);
      // L0 lejos · SAN ÁNGEL a lo lejos (solo si el asset local
      // cargó): el próximo destino asomando al final de la franja,
      // DETRÁS de la zona donde irá la Puerta de salida. Sin borde
      // blanco (es un paisaje, no un sticker) y con VELO DE
      // DISTANCIA: tinte celeste encima y la base fundida en la
      // luz del horizonte, para que se lea «muy lejos».
      if (imgOk(vistaImg)) {
        const f = PLAZA_FX, vw = f.vistaW;
        const vh = vw * vistaImg.naturalHeight / vistaImg.naturalWidth * f.vistaSquash;
        const vx = f.vistaX - pan * 0.2 - vw / 2, vy = horizon + 6 - vh;
        c.drawImage(vistaImg, vx, vy, vw, vh);
        const veil = c.createLinearGradient(0, vy, 0, horizon + 6);
        veil.addColorStop(0, 'rgba(174,200,226,0.40)');
        veil.addColorStop(0.7, 'rgba(190,208,228,0.32)');
        veil.addColorStop(1, 'rgba(246,207,142,0.50)');
        c.fillStyle = veil; c.fillRect(vx, vy, vw, vh);
        const fade = c.createLinearGradient(0, horizon - 26, 0, horizon + 6);
        fade.addColorStop(0, 'rgba(255,217,160,0)');
        fade.addColorStop(1, 'rgba(255,217,160,0.85)');
        c.fillStyle = fade; c.fillRect(vx, horizon - 26, vw, 32);
      }
      c.fillStyle = 'rgba(255,252,244,0.85)';
      const cloud = (x, y, s) => { c.beginPath(); c.ellipse(x, y, 26 * s, 8 * s, 0, 0, 6.3); c.ellipse(x + 18 * s, y + 2 * s, 18 * s, 6 * s, 0, 0, 6.3); c.ellipse(x - 20 * s, y + 2 * s, 16 * s, 5.5 * s, 0, 0, 6.3); c.fill(); };
      cloud(120 - pan * 0.1 + Math.sin(t * 0.05) * 2, 46, 1.1); cloud(430 - pan * 0.1, 30, 0.8); cloud(560 - pan * 0.1, 74, 1.3); cloud(250 - pan * 0.1, 92, 0.6);
      // L0 aire · un AVIÓN real cruza el cielo (recorte de foto,
      // espejado para volar hacia la derecha): posición función
      // del tiempo (avionXAt) con el parallax del cielo encima.
      // Pequeño y lejano; sin sonido. Se ve en el revelado y en
      // el modo libre.
      if (imgOk(avionImg)) {
        const ax = avionXAt(t);
        if (ax > -9000) {
          const f = PLAZA_FX.avion, aw = f.w, ah = aw * avionImg.naturalHeight / avionImg.naturalWidth;
          c.drawImage(avionImg, ax - pan * f.par - aw / 2, f.y - ah / 2, aw, ah);
        }
      }
      // L1 · la Catedral (recorte de FOTO real) + asta con bandera dibujada
      const catW = 430, catX = PLAZA_FX.catedralX - pan * 0.25, catBase = horizon + 4;
      if (catedralImg && catedralImg.complete && catedralImg.naturalWidth) {
        const catH = catW * catedralImg.naturalHeight / catedralImg.naturalWidth;
        c.drawImage(catedralImg, catX - catW / 2, catBase - catH, catW, catH);
      } else {
        // Respaldo por código si la imagen aún no cargó: silueta simple.
        c.fillStyle = '#8d8578';
        c.fillRect(catX - 190, catBase - 170, 380, 170);
        c.fillRect(catX - 165, catBase - 225, 52, 225); c.fillRect(catX + 113, catBase - 225, 52, 225);
        c.beginPath(); c.arc(catX - 139, catBase - 225, 26, 3.14, 0); c.arc(catX + 139, catBase - 225, 26, 3.14, 0); c.fill();
      }
      // L1 · el Palacio de BELLAS ARTES (recorte de FOTO real):
      // el palacio de mármol blanco con su cúpula anaranjada,
      // segundo hito del paseo (~23%). Un poco más bajo que la
      // Catedral y dibujado delante de ella: en la capa se
      // solapan como edificios vecinos de la misma manzana. En
      // la foto (y en el recorte) quedan las dos astas con águila
      // de su explanada, delante de la fachada.
      if (imgOk(bellasArtesImg)) {
        const bw2 = PLAZA_FX.bellasArtesW, bx = PLAZA_FX.bellasArtesX - pan * 0.25;
        const bh2 = bw2 * bellasArtesImg.naturalHeight / bellasArtesImg.naturalWidth;
        c.drawImage(bellasArtesImg, bx - bw2 / 2, catBase - bh2, bw2, bh2);
      }
      // L1 · la Parroquia de la Purísima Concepción de MINERAL
      // DEL CHICO (recorte de FOTO real): vive en el lado derecho
      // de la franja y se descubre tarde en el paseo (~77%); un
      // poco más pequeña que la Catedral (es una parroquia de
      // pueblo junto a la metropolitana).
      if (imgOk(parroquiaImg)) {
        const pw = PLAZA_FX.parroquiaW, px = PLAZA_FX.parroquiaX - pan * 0.25;
        const ph2 = pw * parroquiaImg.naturalHeight / parroquiaImg.naturalWidth;
        c.drawImage(parroquiaImg, px - pw / 2, catBase - ph2, pw, ph2);
      }
      // L1 · el ÁNGEL DE LA INDEPENDENCIA (recorte de FOTO
      // real): la columna completa con su ángel dorado y el
      // pedestal escalonado, hito de la mitad del paseo (~50%).
      // Muy esbelto: con 92 px de ancho alcanza ~322 de alto,
      // como la Catedral. Se dibuja DESPUÉS de la Parroquia a
      // propósito: en la capa su pedestal (736–828) queda junto
      // al arranque de la Parroquia (871) sin tocarla, y así el
      // orden de dibujo no tapa a ningún vecino.
      if (imgOk(angelImg)) {
        const aw2 = PLAZA_FX.angelW, ax2 = PLAZA_FX.angelX - pan * 0.25;
        const ah2 = aw2 * angelImg.naturalHeight / angelImg.naturalWidth;
        c.drawImage(angelImg, ax2 - aw2 / 2, catBase - ah2, aw2, ah2);
      }
      // asta y bandera de México, DIBUJADA y ondeando por código
      const astaX = 96 - pan * 0.25, astaBase = horizon + 4;
      c.fillStyle = '#5a5148'; c.fillRect(astaX - 1.5, astaBase - 196, 3, 196);
      const fw = 46, fh = 27, wave = Math.sin(t * 3.2) * 3;
      const bands = ['#3a7d44', '#f4f1e6', '#b03a3a'];
      for (let i = 0; i < 3; i++) {
        c.fillStyle = bands[i];
        c.beginPath();
        const bx = astaX + 2 + (fw / 3) * i, bw = fw / 3;
        c.moveTo(bx, astaBase - 196);
        c.quadraticCurveTo(bx + bw / 2, astaBase - 196 + wave * (i + 1) * 0.4, bx + bw, astaBase - 196 + wave * (i + 1) * 0.55);
        c.lineTo(bx + bw, astaBase - 196 + fh + wave * (i + 1) * 0.55);
        c.quadraticCurveTo(bx + bw / 2, astaBase - 196 + fh + wave * (i + 1) * 0.4, bx, astaBase - 196 + fh);
        c.closePath(); c.fill();
      }
      // L2 · edificios y puestos dibujados (siluetas con la paleta)
      const off2 = -(pan * 0.5) % 320;
      const bpal = ['#c96f4a', '#d9a05a', '#a8574f', '#c9b458', '#9c6b52'];
      for (let rep = -1; rep < 3; rep++) {
        for (let i = 0; i < 4; i++) {
          const bx = rep * 320 + i * 84 + off2 + ((i * 37) % 13), bw = 62 + ((i * 29) % 18), bh = 54 + ((i * 41) % 30);
          c.fillStyle = bpal[(i + rep + 5) % bpal.length];
          c.fillRect(bx, horizon - bh + 6, bw, bh);
          c.fillStyle = 'rgba(28,20,32,0.55)';
          for (let wy = 0; wy < 3; wy++) for (let wx = 0; wx < 3; wx++) c.fillRect(bx + 8 + wx * 18, horizon - bh + 16 + wy * 16, 8, 10);
        }
      }
      // puestos con toldo (delante de los edificios, misma capa)
      const stall = (sx, col) => {
        c.fillStyle = '#6b4a35'; c.fillRect(sx, horizon - 26, 54, 30);
        c.fillStyle = col; c.beginPath(); c.moveTo(sx - 5, horizon - 26); c.lineTo(sx + 59, horizon - 26); c.lineTo(sx + 50, horizon - 38); c.lineTo(sx + 4, horizon - 38); c.closePath(); c.fill();
        c.fillStyle = '#ffd9a0'; c.fillRect(sx + 6, horizon - 18, 8, 8); c.fillRect(sx + 20, horizon - 18, 8, 8); c.fillRect(sx + 34, horizon - 18, 8, 8);
      };
      stall(430 - pan * 0.5, '#b03a3a'); stall(30 - pan * 0.5, '#3a7d44');
      // L2 · EL puesto de tacos (recorte de FOTO real): el puesto
      // protagonista entre los dibujados, fijo en la franja con su
      // base sobre la línea del horizonte, como los demás puestos.
      if (imgOk(tacosImg)) {
        const tw = PLAZA_FX.tacosW, tx = PLAZA_FX.tacosX - pan * 0.5;
        const th = tw * tacosImg.naturalHeight / tacosImg.naturalWidth;
        c.drawImage(tacosImg, tx - tw / 2, horizon + 6 - th, tw, th);
      }
      // L3 · piso de baldosas de la plaza
      c.fillStyle = '#b8a88f'; c.fillRect(0, horizon, 640, 360 - horizon);
      c.fillStyle = '#a08b6d'; c.fillRect(0, horizon, 640, 3);
      c.strokeStyle = 'rgba(90,74,52,0.35)'; c.lineWidth = 1;
      const tileOff = -(pan % 32);
      for (let x = tileOff; x < 640; x += 32) { c.beginPath(); c.moveTo(x, horizon + 4); c.lineTo(x - 8, 360); c.stroke(); }
      for (let y = horizon + 16; y < 360; y += 18) { c.beginPath(); c.moveTo(0, y); c.lineTo(640, y); c.stroke(); }
      // L4 · la Puerta (fija en su mundo) + Ximena + Jose
      const groundY = this.groundY;
      const openK = this.phase === 'plaza' && this.phaseT < 0.9 ? 1 - this.phaseT / 0.9 : 0;
      this.drawDoor2D(c, this.doorX - pan, groundY, openK);
      // L4 · la Puerta de SALIDA, al final de la franja: la misma
      // Puerta, apoyada justo delante de la vista lejana de San
      // Ángel (su destino). Al cruzarla (fase 'exitdoor') se abre
      // con la luz, como la del depa.
      const exitOpenK = this.phase === 'exitdoor' ? Math.min(1, this.phaseT) : 0;
      this.drawDoor2D(c, this.exitDoorX - pan, groundY, exitOpenK);
      const hop = this.joseReacted && this.phase === 'plaza' ? Math.abs(Math.sin(t * 5)) * 3 : 0;
      // La capa de la calle, ordenada por Y (de atrás hacia
      // adelante, menor y primero): la pareja, los ENCUENTROS
      // (el Alebrije y Teodora) y los AUTOS con calaverita
      // comparten la banda y se tapan unos a otros según su y,
      // como el cameo de San Ángel en su escena. En el revelado
      // la pareja está en idle; en 'free' quien se mueve usa su
      // caminata lateral (walk_right, espejo a la izquierda)
      // con el frame avanzando por DISTANCIA recorrida a la
      // cadencia del juego (~9,8 u/frame, ciclos de 3 en
      // ping-pong como en world.js); en reposo, idle.
      const calle = [];
      for (const ch of [this.free.chars.ximena, this.free.chars.jose]) {
        calle.push({ y: ch.y, fn: () => {
          let anim = 'idle', idx = Math.floor(t * 1.4), bobY = Math.sin(t * 2.2 + (ch.id === 'jose' ? 1 : 0)) * 1.2;
          if (this.phase === 'free' && ch.animWalk) { anim = 'walk_right'; idx = this.walkIdx(ch.id, ch.dist); bobY = 0; }
          if (ch.id === 'jose' && hop) bobY = -hop;
          this.drawChar2D(c, ch.id, ch.x - pan, ch.y, 96, anim, idx, ch.id === 'jose' ? this.joseExpr : null, ch.dir === 'left', bobY);
        } });
      }
      for (const e of this.encuentros) calle.push({ y: e.y, fn: () => this.drawEncuentro(c, e) });
      for (const car of this.autos) calle.push({ y: car.laneY, fn: () => this.drawAuto(c, car) });
      calle.sort((a, b) => a.y - b.y);
      for (const it of calle) it.fn();
      // L5 · poste en primer plano (desenfocado por código: alpha + sombra)
      const postX = ((566 - pan * 1.4) % 700 + 700) % 700 - 30;
      c.save();
      c.shadowColor = 'rgba(20,14,26,0.9)'; c.shadowBlur = 9;
      c.fillStyle = 'rgba(24,18,32,0.88)';
      c.fillRect(postX, 30, 13, 330);
      c.beginPath(); c.arc(postX + 6.5, 26, 10, 0, 6.3); c.fill();
      c.restore();
      c.fillStyle = 'rgba(255,214,140,0.5)'; c.beginPath(); c.arc(postX + 6.5, 26, 5, 0, 6.3); c.fill();
      // L6 · el VOCHO que maneja POLLITO (gag): cruza la calle de
      // primer plano de DERECHA a IZQUIERDA por DELANTE de los
      // personajes (posición función del tiempo, ver vochoXAt),
      // con su leve bob de suspensión. Pollito NO se baja ni
      // interactúa: solo pasa manejando, con su cabeza y hombros
      // (recorte del frame idle definido) asomando por la
      // ventanilla del conductor y su propio bob de manejo.
      // Es un gag INOFENSIVO, sin colisión de ningún tipo: NO
      // confundir con los AUTOS CON CALAVERITA (PLAZA_TRAFICO),
      // que cruzan por la banda caminable y sí frenan al
      // personaje controlado si lo alcanzan en su carril.
      if (imgOk(vochoImg)) {
        const vx = vochoXAt(t);
        if (vx < 9000) {
          const f = PLAZA_FX, cw = f.vocho.w, chh = cw * vochoImg.naturalHeight / vochoImg.naturalWidth;
          const bob = Math.sin(t * 31) * 0.8;
          const left = vx - cw / 2, top = f.vocho.base + bob - chh;
          c.drawImage(vochoImg, left, top, cw, chh);
          const cat = Sp.catAnim ? Sp.catAnim('idle', Math.floor(t * 1.4), false) : null;
          if (cat && cat.width) {
            const s = f.catSrc, hw = cw * f.winHeadW, hh = hw * (s.h / s.w);
            const hx = left + cw * f.winCx - hw / 2;
            const hy = top + chh * f.winBase - hh + Math.sin(t * 17) * 0.7;
            c.drawImage(cat, s.x * cat.width, s.y * cat.height, s.w * cat.width, s.h * cat.height, hx, hy, hw, hh);
          }
        }
      }
      // luz de llegada (se disipa al inicio del revelado)
      if (this.phase === 'plaza' && this.phaseT < 0.8) { c.fillStyle = `rgba(255,244,214,${(1 - this.phaseT / 0.8).toFixed(3)})`; c.fillRect(0, 0, 640, 360); }
      // junto a la Puerta de salida, su aviso (el mismo estilo
      // que el de la puerta del depa)
      if (this.phase === 'free' && this.nearExit) G.prompt(c, 'ESPACIO: cruzar la Puerta', this.exitDoorX - pan, groundY - 96);
      // luz del cruce hacia San Ángel (crece ~1 s)
      if (this.phase === 'exitdoor') { const a = Math.min(1, this.phaseT); c.fillStyle = `rgba(255,244,214,${(a * a).toFixed(3)})`; c.fillRect(0, 0, 640, 360); }
      // la banda de la carta, sobre el paseo (guion v2)
      drawCartaBand(c);
    }
    walkIdx(id, dist) { return walkIdxFor(id, dist); }
    drawChar2D(c, id, x, baseY, h, anim, idx, expr, flip, bobY) { drawChar2DAt(c, id, x, baseY, h, anim, idx, expr, flip, bobY); }
    drawDoor2D(c, x, baseY, openK) { drawDoor2DAt(c, x, baseY, openK); }
  }

  // =========================================================
  // ESCENA 2: SAN ÁNGEL — la franja del pueblo y el árbol
  // =========================================================
  // Misma franja libre que la plaza (updateStripFree, TAB,
  // seguidor con histéresis, cámara), con el decorado de las
  // pinturas que aportó Jose: las casas y la pileta en la zona
  // de calle, el cameo de Manolo y María con Chuy cruzando una
  // sola vez por visita, y al final el árbol gigante con su
  // camino de velas, donde espera la Puerta de salida (que por
  // ahora devuelve a la plaza: la secuencia cronometrada
  // llegará cuando existan todas las escenas). Todo recorte se
  // dibuja solo si cargó: sin la carpeta local, quedan el cielo
  // y el piso por código, las velas como puntos de luz y las
  // Puertas — la escena se juega igual.
  class SanAngelScene {
    constructor() {
      this.id = 'sanangel';
      this.phase = 'light'; this.t = 0; this.phaseT = 0;
      this.worldW = SANANGEL.worldW; this.groundY = SANANGEL.groundY; this.horizon = SANANGEL.horizon;
      this.entryDoorX = SANANGEL.entryDoorX; this.exitDoorX = SANANGEL.exitDoorX;
      this.pan = 0; this.joseExpr = 'happy';
      this.nearDoor = false; this.nearDoorX = this.entryDoorX; this.usedDoorX = this.entryDoorX;
      this.piletaX = 1950; this.piletaBaseY = 286; this.piletaW = 235;
      // Centro del árbol en el espacio de su capa (parallax
      // 0,25): con la cámara al fondo (pan 3260) su centro cae a
      // pantalla ~470, tras la Puerta de salida (540) — la misma
      // composición final que tenía la franja corta.
      this.treeLayerCx = 1285;
      this.free = makeStripChars(210, 280, this.groundY);
      // Las velas del suelo: dos filas curvas que convergen
      // hacia la Puerta del árbol formando el camino de la
      // pintura, más un arco de velas frente a la Puerta. Las
      // filas arrancan en SA_VELAS_X0 (~395 px antes de la
      // Puerta) y cierran a ~65 px de ella (las mismas
      // distancias de siempre, ancladas a la nueva posición
      // de la Puerta, x=3800).
      this.candles = [];
      for (let i = 0; i < 15; i++) {
        const s = i / 14, cx = SA_VELAS_X0 + s * 330, cy = 340 - s * 22, off = 17 - s * 7;
        this.candles.push({ x: cx, y: cy - off, size: 11 + (i % 3) * 3, v: i % 2 });
        this.candles.push({ x: cx + 9, y: cy + off, size: 12 + ((i + 1) % 3) * 3, v: (i + 1) % 2 });
      }
      for (let j = 0; j < 7; j++) {
        const a = Math.PI * (0.12 + 0.76 * (j / 6));
        this.candles.push({ x: this.exitDoorX + Math.cos(a) * 48, y: 330 + Math.sin(a) * 15, size: 10 + (j % 3) * 2, v: j % 2 });
      }
      this.resetCameo();
      this.resetBolas();
      this.resetAbrazo();
    }
    resetAbrazo() {
      // La acción de abrazo (ver SA_ABRAZO): cada llegada por
      // una Puerta empieza con la secuencia apagada, el aviso
      // armado y sin partículas en el aire.
      this.hug = { phase: 'off', t: 0, ax: 0, ay: 0, bx: 0, by: 0, atx: 0, aty: 0, btx: 0, bty: 0, mx: 0, my: 0, pax: 0, pay: 0, pbx: 0, pby: 0 };
      this.hugArmed = true; this.hugRearmT = 0; this.nearHug = false;
      this.petalFx = []; this.heartFx = [];
    }
    resetBolas() {
      // Las bolas de paja y las pajitas de los estallidos, y el
      // trastabilleo del controlado: cada llegada por una
      // Puerta empieza la calle limpia, y la primera bola
      // tarda un poco en llegar (sin ser inmediata).
      this.bolas = []; this.pajitas = [];
      this.bolaTimer = 2.2;
      this.frenoT = 0; this.speedK = 1;
    }
    resetCameo() {
      // Manolo y María vienen del lado del árbol caminando
      // juntos hacia la izquierda; Chuy trota junto a María.
      // Con la franja larga su pasada no nace en una posición
      // fija: se DISPARA por cámara (ver updateCameo) y ocurre
      // una sola vez por visita.
      this.cameo = { triggered: false, done: false, x: 0, y: 322, dist: 0, manoloX: 0, mariaX: 54, chuyX: 88 };
    }
    candleGlowAt(t, i) { return candleGlow(t, i); }
    switchActive() {
      if (this.phase !== 'free') return;
      if (this.hug && this.hug.phase !== 'off') return; // en mitad del abrazo no se cambia de personaje
      this.free.active = this.free.active === 'ximena' ? 'jose' : 'ximena';
      if (G.input && G.input.flush) G.input.flush();
    }
    // Llegada desde la plaza: fundido de luz (~1 s) y la escena
    // ya queda explorable en modo libre, sin paneo largo.
    enterFromPlaza() {
      this.phase = 'light'; this.phaseT = 0;
      const F = this.free, A = F.chars[F.active], B = F.chars[F.active === 'ximena' ? 'jose' : 'ximena'];
      A.x = this.entryDoorX + 120; A.y = this.groundY;
      B.x = this.entryDoorX + 190; B.y = this.groundY; B.follow = false;
      this.pan = 0; this.nearDoor = false;
      this.resetCameo();
      this.resetBolas();
      this.resetAbrazo();
    }
    // Llegada desde el aeropuerto: se reaparece junto a la
    // Puerta del árbol (la del fondo de la franja), tras el
    // fundido de luz de la salida de allá. El cameo NO se
    // reinicia: es la misma visita a San Ángel.
    enterFromAero() {
      this.phase = 'light'; this.phaseT = 0;
      const F = this.free, A = F.chars[F.active], B = F.chars[F.active === 'ximena' ? 'jose' : 'ximena'];
      A.x = this.exitDoorX - 70; A.y = this.groundY;
      B.x = this.exitDoorX - 140; B.y = this.groundY; B.follow = false;
      this.pan = Math.max(0, Math.min(this.worldW - 640, A.x - 320));
      this.nearDoor = false;
      this.resetBolas();
      this.resetAbrazo();
    }
    beginExit() {
      if (this.phase !== 'free') return;
      this.phase = 'exitdoor'; this.phaseT = 0; this.usedDoorX = this.nearDoorX; D.tap = false;
      playDoorClose(); // la Puerta se cierra tras la pareja (grabación real)
    }
    update(dt) {
      this.t += dt;
      if (this.phase === 'light') {
        this.phaseT += dt;
        if (this.phaseT >= 1) { this.phase = 'free'; this.phaseT = 0; }
        return;
      }
      if (this.phase === 'exitdoor') {
        // La Puerta usada manda en la cadena: la de ENTRADA
        // vuelve a la plaza; la del ÁRBOL sigue el paseo al
        // AEROPUERTO (escena 3). Sin reloj nuevo en ningún caso.
        this.phaseT += dt;
        if (this.phaseT >= 1) {
          if (this.usedDoorX === this.exitDoorX) travelTo('aero');
          else travelTo('plaza');
        }
        return;
      }
      if (this.phase === 'free') {
        this.phaseT += dt;
        this.updateFree(dt);
        this.updateCameo(dt);
      }
    }
    updateFree(dt) {
      const F = this.free, A = F.chars[F.active];
      // La secuencia del abrazo manda: el motor libre queda en
      // pausa (nadie camina por input) y las bolas siguen
      // rodando, pero sin nacer ni frenar (ver updateBolas).
      if (this.hug.phase !== 'off') {
        this.updateHug(dt);
        this.updateBolas(dt);
        return;
      }
      const dE = Math.abs(A.x - this.entryDoorX), dX = Math.abs(A.x - this.exitDoorX);
      this.nearDoor = Math.min(dE, dX) < 58 && Math.abs(A.y - this.groundY) < 40;
      this.nearDoorX = dE <= dX ? this.entryDoorX : this.exitDoorX;
      if (this.nearDoor && (G.input.hit('action') || D.tap)) { this.beginExit(); return; }
      // La oferta del abrazo: con los dos cerca (entre pies),
      // el aviso armado Y el punto del abrazo dentro de la
      // zona del árbol (el punto medio de la pareja a partir
      // de SA_ABRAZO.x0, donde arranca el camino de velas:
      // solo frente al árbol, no en cualquier parte de la
      // franja). La Puerta manda si ambas ofertas coinciden
      // (nearHug exige no estar junto a una Puerta: junto a
      // la Puerta del árbol la oferta de puerta tiene
      // prioridad por proximidad, como siempre).
      const B = F.chars[F.active === 'ximena' ? 'jose' : 'ximena'];
      const dHug = Math.hypot(A.x - B.x, A.y - B.y);
      const midHugX = (A.x + B.x) / 2;
      if (!this.hugArmed) {
        this.hugRearmT += dt;
        if (dHug > SA_ABRAZO.rearmeDist || this.hugRearmT >= SA_ABRAZO.rearmeT) this.hugArmed = true;
      }
      this.nearHug = this.hugArmed && !this.nearDoor && midHugX >= SA_ABRAZO.x0 && dHug <= SA_ABRAZO.cercaDist;
      if (this.nearHug && (G.input.hit('action') || D.tap)) { this.beginHug(); return; }
      // El trastabilleo por bola de paja: mientras dura, el
      // motor compartido mueve al activo con speedK (×0,4).
      if (this.frenoT > 0) this.frenoT = Math.max(0, this.frenoT - dt);
      this.speedK = this.frenoT > 0 ? SA_BOLAS.frenoK : 1;
      updateStripFree(this, dt);
      this.updateBolas(dt);
      // El fragmento de SAN ÁNGEL (guion v2): al entrar en
      // la zona del árbol (donde arranca el camino de velas,
      // cerca del abrazo), lejos de las Puertas, una sola vez
      // por partida.
      if (!D.cartaFrag.sanangel && !this.nearDoor && A.x >= SA_VELAS_X0) {
        D.cartaFrag.sanangel = true;
        showCartaBand(CARTA_TEXTOS.sanangel);
      }
    }
    // ---------- La acción de abrazo (solo San Ángel) ----------
    // Tres tiempos: acercamiento (ambos caminan a quedar frente
    // a frente a hugGap px, en el punto medio entre los dos),
    // abrazo (los sprites individuales se ocultan y se dibuja
    // el de la pareja, con balanceo y partículas) y separación
    // (el acompañante vuelve a su puesto de seguimiento y el
    // control regresa). El controlado se queda donde quedó el
    // abrazo: es su sitio nuevo en la calle.
    beginHug() {
      const F = this.free, A = F.chars[F.active], B = F.chars[F.active === 'ximena' ? 'jose' : 'ximena'];
      const H = this.hug, P = SA_ABRAZO;
      H.phase = 'approach'; H.t = 0;
      H.ax = A.x; H.ay = A.y; H.bx = B.x; H.by = B.y;
      H.mx = (A.x + B.x) / 2; H.my = (A.y + B.y) / 2;
      const side = B.x >= A.x ? 1 : -1; // cada uno conserva su lado
      H.atx = H.mx - side * P.hugGap / 2; H.aty = H.my;
      H.btx = H.mx + side * P.hugGap / 2; H.bty = H.my;
      A.follow = false; B.follow = false;
      A.dir = side > 0 ? 'right' : 'left'; // frente a frente
      B.dir = side > 0 ? 'left' : 'right';
      this.nearHug = false;
      D.tap = false;
    }
    updateHug(dt) {
      const F = this.free, A = F.chars[F.active], B = F.chars[F.active === 'ximena' ? 'jose' : 'ximena'];
      const H = this.hug, P = SA_ABRAZO;
      H.t += dt;
      const ease = (k) => { k = Math.max(0, Math.min(1, k)); return k * k * (3 - 2 * k); };
      const lerp = (a, b, k) => a + (b - a) * k;
      if (H.phase === 'approach') {
        const k = ease(H.t / P.acercarT);
        A.x = lerp(H.ax, H.atx, k); A.y = lerp(H.ay, H.aty, k);
        B.x = lerp(H.bx, H.btx, k); B.y = lerp(H.by, H.bty, k);
        A.animWalk = B.animWalk = H.t < P.acercarT;
        if (H.t >= P.acercarT) {
          H.phase = 'hold'; H.t = 0;
          A.animWalk = B.animWalk = false;
          this.spawnHugFx();
        }
      } else if (H.phase === 'hold') {
        if (H.t >= P.abrazoT) {
          H.phase = 'part'; H.t = 0;
          // La separación: el acompañante vuelve a su puesto de
          // seguimiento (la misma fórmula del motor compartido).
          H.pbx = B.x; H.pby = B.y;
          H.btx = Math.max(40, Math.min(this.worldW - 40, B.id === 'jose' ? A.x + 70 : A.x - 70));
          H.bty = Math.max(this.groundY - 26, Math.min(this.groundY + 26, A.y));
        }
      } else if (H.phase === 'part') {
        const k = ease(H.t / P.separarT);
        B.x = lerp(H.pbx, H.btx, k); B.y = lerp(H.pby, H.bty, k);
        B.animWalk = H.t < P.separarT;
        if (H.t >= P.separarT) {
          H.phase = 'off'; H.t = 0;
          B.animWalk = false; B.follow = false;
          this.hugArmed = false; this.hugRearmT = 0; // rearme: separarse o esperar
        }
      }
      // La cámara sigue al activo, como en el motor compartido.
      const camT = Math.max(0, Math.min(this.worldW - 640, A.x - 320));
      this.pan += (camT - this.pan) * Math.min(1, dt * 6);
      if (Math.abs(camT - this.pan) < 0.05) this.pan = camT;
      this.updateHugFx(dt);
      D.tap = false;
    }
    // Las partículas del momento: pétalos de la escena (el
    // sabor de San Ángel, como los de la absorción) flotando
    // alrededor de la pareja y 2–3 corazoncitos DIBUJADOS por
    // código (formas geométricas con curvas: jamás caracteres).
    spawnHugFx() {
      const H = this.hug;
      this.petalFx = []; this.heartFx = [];
      for (let i = 0; i < 14; i++) {
        this.petalFx.push({
          x: H.mx + (Math.random() - 0.5) * 110, y: H.my - 96 - Math.random() * 26,
          vx: (Math.random() - 0.5) * 14, vy: 13 + Math.random() * 15,
          t: -Math.random() * 0.9, life: 2.7, rot: Math.random() * 6.28, vr: (Math.random() - 0.5) * 2.4, ph: Math.random() * 6.28,
        });
      }
      for (let i = 0; i < 3; i++) {
        this.heartFx.push({ x: H.mx + (i - 1) * 17 + (Math.random() - 0.5) * 6, y: H.my - 100, t: -i * 0.45, life: 2.1, s: 5.5 + (i % 2) * 1.5, ph: Math.random() * 6.28 });
      }
    }
    updateHugFx(dt) {
      const step = (arr, fn) => {
        const keep = [];
        for (const p of arr) { p.t += dt; if (p.t >= p.life) continue; if (p.t >= 0) fn(p); keep.push(p); }
        return keep;
      };
      this.petalFx = step(this.petalFx, (p) => { p.x += (p.vx + Math.sin(p.t * 2.6 + p.ph) * 9) * dt; p.y += p.vy * dt; p.rot += p.vr * dt; });
      this.heartFx = step(this.heartFx, (p) => { p.y -= 13 * dt; p.x += Math.sin(p.t * 3.1 + p.ph) * 6 * dt; });
    }
    // Las bolas de paja: aparición por viento (solo con el
    // controlado en la zona de la calle), rodadura real hacia
    // la izquierda (ángulo = distancia/radio, con su bote) y
    // choque SOLO contra el controlado — el seguidor las
    // atraviesa sin enterarse. Al chocar, la bola estalla en
    // pajitas dibujadas por código y el controlado trastabillea.
    updateBolas(dt) {
      const F = this.free, A = F.chars[F.active];
      // Durante el abrazo las bolas no nacen ni chocan: las
      // vivas siguen rodando y pasan de largo (el momento no
      // se arruina por un trastabilleo a mitad de abrazo).
      const hugging = this.hug.phase !== 'off';
      this.bolaTimer -= dt;
      if (this.bolaTimer <= 0) {
        if (!hugging && this.bolas.length < SA_BOLAS.maxVivas && A.x < SA_BOLAS.zonaX) {
          const d = SA_BOLAS.dMin + Math.random() * (SA_BOLAS.dMax - SA_BOLAS.dMin), r = d / 2;
          this.bolas.push({
            x: this.pan + 640 + 40 + r, y: this.groundY + (Math.random() * 44 - 22),
            r, vel: SA_BOLAS.velMin + Math.random() * (SA_BOLAS.velMax - SA_BOLAS.velMin),
            dist: 0, ang: 0, ph: Math.random() * 6.28,
          });
        }
        this.bolaTimer = SA_BOLAS.cadMin + Math.random() * (SA_BOLAS.cadMax - SA_BOLAS.cadMin);
      }
      const keep = [];
      for (const b of this.bolas) {
        b.x -= b.vel * dt; b.dist += b.vel * dt;
        b.ang = -b.dist / b.r; // rodadura: al ir a la izquierda gira en sentido antihorario
        if (b.x < this.pan - 100 || b.x + b.r < 0) continue; // salió del encuadre o del mundo
        const dx = b.x - A.x, dy = (b.y - b.r) - (A.y - 44);
        if (!hugging && dx * dx + dy * dy < Math.pow(b.r * 0.85 + 26, 2)) {
          for (let i = 0; i < 9; i++) {
            const a = Math.random() * 6.28, s = 30 + Math.random() * 70;
            this.pajitas.push({ x: b.x, y: b.y - b.r, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 25, t: 0, life: 0.45 + Math.random() * 0.2, rot: Math.random() * 6.28 });
          }
          this.frenoT = SA_BOLAS.frenoT;
          continue; // la bola estalló: no sigue rodando
        }
        keep.push(b);
      }
      this.bolas = keep;
      const pk = [];
      for (const p of this.pajitas) {
        p.t += dt; if (p.t >= p.life) continue;
        p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 130 * dt; p.rot += dt * 7;
        pk.push(p);
      }
      this.pajitas = pk;
    }
    updateCameo(dt) {
      const cm = this.cameo;
      if (cm.done) return;
      if (!cm.triggered) {
        // Disparo por cámara: cuando el paseo ya avanzó (la
        // cámara supera ~900 px), la pareja aparece por el borde
        // derecho de la pantalla y cruza hacia la izquierda.
        // Una sola pasada por visita: si el jugador retrocede y
        // vuelve a avanzar, NO se repite (triggered queda puesto
        // y, al terminar, done también).
        if (this.pan > 900) { cm.triggered = true; cm.x = this.pan + 640 + 60; }
        else return;
      }
      cm.x -= 55 * dt; cm.dist += 55 * dt; // velocidad de paseo
      cm.manoloX = cm.x; cm.mariaX = cm.x + 54; cm.chuyX = cm.x + 88;
      if (cm.x < this.pan - 220) cm.done = true; // salió del encuadre por la izquierda
    }
    draw(dt) {
      const c = G.ovCtx; if (!c) return;
      c.setTransform(2, 0, 0, 2, 0, 0);
      c.clearRect(0, 0, 640, 360);
      const t = this.t, pan = this.pan, horizon = this.horizon, groundY = this.groundY;
      // cielo de tarde dorada, en la paleta de las pinturas
      // (turquesa arriba que se funde en dorado al horizonte)
      const sky = c.createLinearGradient(0, 0, 0, horizon);
      sky.addColorStop(0, '#4fb3a9'); sky.addColorStop(0.5, '#9fd3c0'); sky.addColorStop(0.8, '#f4cf8e'); sky.addColorStop(1, '#ffd9a0');
      c.fillStyle = sky; c.fillRect(0, 0, 640, horizon + 2);
      c.fillStyle = 'rgba(255,246,230,0.80)';
      const cloud = (x, y, s) => { c.beginPath(); c.ellipse(x, y, 26 * s, 8 * s, 0, 0, 6.3); c.ellipse(x + 18 * s, y + 2 * s, 18 * s, 6 * s, 0, 0, 6.3); c.ellipse(x - 20 * s, y + 2 * s, 16 * s, 5.5 * s, 0, 0, 6.3); c.fill(); };
      cloud(150 - pan * 0.1, 40, 1.0); cloud(470 - pan * 0.1, 64, 1.2); cloud(320 - pan * 0.1, 96, 0.6);
      // casas del pueblo (recortes, parallax 0,4): la calle
      for (const sgm of SA_HOUSES) {
        if (!imgOk(sgm.img)) continue;
        const w = sgm.h * sgm.img.naturalWidth / sgm.img.naturalHeight;
        const sx = sgm.x - pan * 0.4;
        if (sx + w < -20 || sx > 660) continue;
        c.drawImage(sgm.img, sx, horizon + 6 - sgm.h, w, sgm.h);
      }
      // el ÁRBOL gigante (recorte, parallax 0,25): domina el
      // fondo de la zona final, con su base en el horizonte
      let treeBox = null;
      if (imgOk(saArbol)) {
        const tw = 440, th = tw * saArbol.naturalHeight / saArbol.naturalWidth;
        const tx = this.treeLayerCx - pan * 0.25 - tw / 2, ty = horizon + 6 - th;
        c.drawImage(saArbol, tx, ty, tw, th);
        treeBox = { x: tx, y: ty, w: tw, h: th };
      }
      // piso cálido de la plaza del pueblo, dibujado
      const fl = c.createLinearGradient(0, horizon, 0, 360);
      fl.addColorStop(0, '#d9a860'); fl.addColorStop(1, '#a8743f');
      c.fillStyle = fl; c.fillRect(0, horizon, 640, 360 - horizon);
      c.strokeStyle = 'rgba(120,62,28,0.35)'; c.lineWidth = 1;
      const tileOff = -(pan % 34);
      for (let x = tileOff; x < 640; x += 34) { c.beginPath(); c.moveTo(x, horizon + 4); c.lineTo(x - 9, 360); c.stroke(); }
      for (let y = horizon + 15; y < 360; y += 17) { c.beginPath(); c.moveTo(0, y); c.lineTo(640, y); c.stroke(); }
      // velo de anochecer: el último tercio del paseo oscurece
      // de forma progresiva según x de mundo (anclado, no a la
      // pantalla): empieza a ~2600 y es pleno al llegar al árbol
      const veil = c.createLinearGradient(2600 - pan, 0, 3550 - pan, 0);
      veil.addColorStop(0, 'rgba(24,18,50,0)'); veil.addColorStop(1, 'rgba(24,18,50,0.58)');
      c.fillStyle = veil; c.fillRect(0, 0, 640, 360);
      // resplandor cálido de las velas junto a la Puerta del árbol
      const dgx = this.exitDoorX - pan;
      const glow = c.createRadialGradient(dgx, groundY - 26, 8, dgx, groundY - 26, 150);
      glow.addColorStop(0, 'rgba(255,176,92,0.30)'); glow.addColorStop(1, 'rgba(255,176,92,0)');
      c.fillStyle = glow; c.fillRect(dgx - 150, groundY - 176, 300, 300);
      // velitas colgando de la copa: puntos de luz con halo,
      // dibujados por código sobre el recorte, parpadeando
      if (treeBox) {
        SA_HANG.forEach((p, i) => {
          const gx = treeBox.x + p[0] * treeBox.w, gy = treeBox.y + p[1] * treeBox.h;
          if (gx < -20 || gx > 660) return;
          const g = candleGlow(t, 40 + i);
          c.fillStyle = `rgba(255,176,92,${(0.30 * g).toFixed(3)})`;
          c.beginPath(); c.arc(gx, gy, 6 + 3 * g, 0, 6.3); c.fill();
          c.fillStyle = `rgba(255,226,160,${(0.55 + 0.4 * g).toFixed(3)})`;
          c.beginPath(); c.arc(gx, gy, 1.8, 0, 6.3); c.fill();
        });
      }
      // velas del suelo, fila trasera (delante vendrá la otra)
      this.drawCandles(c, pan, false);
      // las dos Puertas de la franja (la misma Puerta de siempre)
      const usedOpen = this.phase === 'exitdoor' ? Math.min(1, this.phaseT) : 0;
      const entryOpen = this.phase === 'light' && this.phaseT < 0.9 ? 1 - this.phaseT / 0.9 : (this.usedDoorX === this.entryDoorX ? usedOpen : 0);
      drawDoor2DAt(c, this.entryDoorX - pan, groundY, entryOpen);
      drawDoor2DAt(c, this.exitDoorX - pan, groundY, this.usedDoorX === this.exitDoorX ? usedOpen : 0);
      // capa de personajes, ordenada por Y: la pileta (su base
      // ~30 px sobre la línea de pies deja pasar por delante y
      // por detrás), el cameo y los protagonistas
      const items = [];
      items.push({
        y: this.piletaBaseY, fn: () => {
          if (!imgOk(saPileta)) return;
          const w = this.piletaW, h = w * saPileta.naturalHeight / saPileta.naturalWidth;
          c.drawImage(saPileta, this.piletaX - pan - w / 2, this.piletaBaseY - h, w, h);
        },
      });
      if (this.cameo.triggered && !this.cameo.done) items.push({ y: this.cameo.y, fn: () => this.drawCameo(c, pan) });
      // las bolas de paja son objetos de la calle: se ordenan
      // por Y con los personajes (pasan por delante o por
      // detrás según su línea de rodadura)
      for (const b of this.bolas) items.push({ y: b.y, fn: () => this.drawBola(c, pan, b) });
      const chars = [this.free.chars.ximena, this.free.chars.jose].slice().sort((a, b) => a.y - b.y);
      // En el corazón del abrazo, los dos sprites individuales
      // se ocultan y se dibuja el de la PAREJA (abrazo.png) en
      // el punto medio. Sin el asset, el respaldo son los dos
      // sprites individuales frente a frente, muy juntos, con
      // la misma coreografía de partículas (drawHugFx).
      const hugSprite = this.hug.phase === 'hold' && imgOk(abrazoImg);
      if (hugSprite) {
        items.push({ y: this.hug.my, fn: () => this.drawHugSprite(c, pan) });
      } else {
        for (const ch of chars) {
          items.push({
            y: ch.y, fn: () => {
              let anim = 'idle', idx = Math.floor(t * 1.4), bobY = Math.sin(t * 2.2 + (ch.id === 'jose' ? 1 : 0)) * 1.2;
              if (this.phase === 'free' && ch.animWalk) { anim = 'walk_right'; idx = walkIdxFor(ch.id, ch.dist); bobY = 0; }
              drawChar2DAt(c, ch.id, ch.x - pan, ch.y, 96, anim, idx, ch.id === 'jose' ? this.joseExpr : null, ch.dir === 'left', bobY);
            },
          });
        }
      }
      items.sort((a, b) => a.y - b.y);
      for (const it of items) it.fn();
      // las pajitas de los estallidos, sobre la calle
      for (const p of this.pajitas) {
        const sx = p.x - pan;
        if (sx < -20 || sx > 660) continue;
        const k = 1 - p.t / p.life;
        c.save(); c.translate(sx, p.y); c.rotate(p.rot);
        c.strokeStyle = `rgba(190,150,80,${(0.85 * k).toFixed(3)})`; c.lineWidth = 1.6;
        c.beginPath(); c.moveTo(-4, 0); c.lineTo(4, 0); c.stroke();
        c.restore();
      }
      // las partículas del abrazo (pétalos y corazoncitos),
      // sobre los personajes
      this.drawHugFx(c, pan);
      // velas del suelo, fila delantera (sobre los pies)
      this.drawCandles(c, pan, true);
      if (this.phase === 'free' && this.nearDoor) G.prompt(c, 'ESPACIO: cruzar la Puerta', this.nearDoorX - pan, groundY - 96);
      if (this.phase === 'free' && this.nearHug && this.hug.phase === 'off') {
        const midX = (this.free.chars.ximena.x + this.free.chars.jose.x) / 2;
        G.prompt(c, 'ESPACIO: abrazarse', midX - pan, groundY - 96);
      }
      // luz de la Puerta: se disipa al llegar, crece al salir
      if (this.phase === 'light') { c.fillStyle = `rgba(255,244,214,${(1 - Math.min(1, this.phaseT)).toFixed(3)})`; c.fillRect(0, 0, 640, 360); }
      if (this.phase === 'exitdoor') { const a = Math.min(1, this.phaseT); c.fillStyle = `rgba(255,244,214,${(a * a).toFixed(3)})`; c.fillRect(0, 0, 640, 360); }
      // la banda de la carta, sobre el paseo (guion v2)
      drawCartaBand(c);
    }
    // Una bola de paja rodando: el recorte de foto gira sobre
    // el centro de la bola (en el PNG de 370×259 la bola ocupa
    // x 6–362 y su centro cae a la fracción ~0,497/0,44) con el
    // ángulo de rodadura y un bote leve por distancia. Sin la
    // imagen (no debería pasar: es un asset del repo), se
    // dibuja una bola de paja por código para que el obstáculo
    // nunca sea invisible.
    drawBola(c, pan, b) {
      const bob = -Math.abs(Math.sin(b.dist * 0.055 + b.ph)) * b.r * 0.16;
      const cx = b.x - pan, cy = b.y - b.r + bob;
      if (cx < -80 || cx > 720) return;
      c.fillStyle = 'rgba(60,32,10,0.22)';
      c.beginPath(); c.ellipse(cx, b.y + 3, b.r * 0.9, 3.5, 0, 0, 6.3); c.fill();
      if (imgOk(bolaPajaImg)) {
        const W = b.r * 2 * (370 / 356), H = W * 259 / 370;
        c.save(); c.translate(cx, cy); c.rotate(b.ang);
        c.drawImage(bolaPajaImg, -0.497 * W, -0.44 * H, W, H);
        c.restore();
      } else {
        c.save(); c.translate(cx, cy); c.rotate(b.ang);
        c.fillStyle = '#b98d4f'; c.beginPath(); c.arc(0, 0, b.r, 0, 6.3); c.fill();
        c.strokeStyle = 'rgba(90,60,20,0.55)'; c.lineWidth = 1.4;
        for (let i = 0; i < 5; i++) {
          const a = i * 1.256;
          c.beginPath(); c.moveTo(Math.cos(a) * b.r * 0.3, Math.sin(a) * b.r * 0.3);
          c.lineTo(Math.cos(a + 0.7) * b.r * 0.95, Math.sin(a + 0.7) * b.r * 0.95); c.stroke();
        }
        c.restore();
      }
    }
    // El sprite de la pareja abrazándose, en el punto medio
    // del abrazo y a la misma altura que los personajes de la
    // franja (96 px), con su sombra al suelo y un balanceo
    // suave (rotación ±1,5° y bob mínimo, por senos).
    drawHugSprite(c, pan) {
      const H = this.hug, t = this.t;
      const h = 96, w = h * abrazoImg.naturalWidth / abrazoImg.naturalHeight;
      const sway = Math.sin(t * 1.6) * 0.026, bob = Math.sin(t * 2.2) * 1.2;
      c.save(); c.translate(H.mx - pan, H.my + bob); c.rotate(sway);
      c.fillStyle = 'rgba(60,32,10,0.22)';
      c.beginPath(); c.ellipse(0, 3, w * 0.42, 4.5, 0, 0, 6.3); c.fill();
      c.drawImage(abrazoImg, -w / 2, -h, w, h);
      c.restore();
    }
    // Las partículas del abrazo: pétalos rosas cayendo con
    // vaivén alrededor de la pareja y corazoncitos que suben.
    // El corazón es una forma geométrica dibujada con curvas
    // (dos lóbulos y punta), nunca un carácter.
    drawHugFx(c, pan) {
      for (const p of this.petalFx) {
        if (p.t < 0) continue;
        const sx = p.x - pan;
        if (sx < -20 || sx > 660) continue;
        const fade = Math.min(1, p.t / 0.3, (p.life - p.t) / 0.5);
        c.save(); c.translate(sx, p.y); c.rotate(p.rot);
        c.fillStyle = `rgba(244,164,190,${(0.85 * fade).toFixed(3)})`;
        c.beginPath(); c.ellipse(0, 0, 3.4, 2, 0, 0, 6.3); c.fill();
        c.restore();
      }
      for (const p of this.heartFx) {
        if (p.t < 0) continue;
        const sx = p.x - pan;
        if (sx < -20 || sx > 660) continue;
        const fade = Math.min(1, p.t / 0.25, (p.life - p.t) / 0.5);
        c.save(); c.translate(sx, p.y); c.scale(p.s / 10, p.s / 10);
        c.beginPath();
        c.moveTo(0, 3.2);
        c.bezierCurveTo(-6.5, -2.5, -3.2, -8, 0, -3.8);
        c.bezierCurveTo(3.2, -8, 6.5, -2.5, 0, 3.2);
        c.fillStyle = `rgba(232,84,120,${(0.9 * fade).toFixed(3)})`;
        c.fill();
        c.restore();
      }
    }
    // Las velas del suelo (recortes con su halo por código):
    // `front` separa la fila trasera (y<330) de la delantera.
    // Sin los recortes locales, cada vela es su punto de luz.
    drawCandles(c, pan, front) {
      const t = this.t;
      this.candles.forEach((cd, i) => {
        if ((cd.y >= 330) !== front) return;
        const sx = cd.x - pan;
        if (sx < -30 || sx > 670) return;
        const g = candleGlow(t, i);
        c.fillStyle = `rgba(255,170,80,${(0.26 * g).toFixed(3)})`;
        c.beginPath(); c.arc(sx, cd.y - cd.size * 0.55, cd.size * (0.75 + 0.3 * g), 0, 6.3); c.fill();
        const img = cd.v ? saVelaB : saVelaA;
        if (imgOk(img)) {
          const h = cd.size * (0.92 + 0.16 * g), w = h * img.naturalWidth / img.naturalHeight;
          c.drawImage(img, sx - w / 2, cd.y - h, w, h);
        } else {
          c.fillStyle = `rgba(255,220,150,${(0.6 + 0.35 * g).toFixed(3)})`;
          c.fillRect(sx - 1, cd.y - cd.size * 0.8, 2, cd.size * 0.8);
        }
      });
    }
    // El cameo: recortes estáticos con bob de papel (balanceo
    // vertical por distancia recorrida, como el vocho de la
    // plaza). María va de espaldas (la de la imagen del árbol):
    // en la imagen lateral del pueblo las figuras miden
    // ~20–30 px, sin resolución para un cameo de ~92 px.
    drawCameo(c, pan) {
      const cm = this.cameo;
      const fig = (img, cx, h, ph) => {
        if (!imgOk(img)) return;
        const w = h * img.naturalWidth / img.naturalHeight;
        const bob = -Math.abs(Math.sin(cm.dist * 0.30 + ph)) * 2.4;
        c.drawImage(img, cx - pan - w / 2, cm.y - h + bob, w, h);
      };
      fig(saManolo, cm.manoloX, 92, 0);
      fig(saMaria, cm.mariaX, 92, 1.4);
      fig(saChuy, cm.chuyX, 30, 2.6);
    }
  }

  // =========================================================
  // ESCENA 3: EL AEROPUERTO — terminal por capas (canvas 2D)
  // El interior se dibuja por código en orden de profundidad:
  // el EXTERIOR (cielo, pista y el avión en rodaje) se pinta
  // primero y la terminal (cristal, montantes, pared, piso,
  // cinta, columnas, letreros) SOBRE él, así el avión se ve
  // «a través» del ventanal continuo. Luz fría de mañana, en
  // contraste con el dorado de la plaza y el anochecer de San
  // Ángel. Sin multitudes: solo Ximena y Jose, con el motor de
  // franja compartido (esta escena aporta además su cinta).
  // =========================================================
  class AeroScene {
    constructor() {
      this.id = 'aero';
      this.phase = 'light'; this.t = 0; this.phaseT = 0;
      this.worldW = AERO.worldW; this.groundY = AERO.groundY; this.horizon = AERO.horizon;
      this.entryDoorX = AERO.entryDoorX; this.exitDoorX = AERO.exitDoorX;
      this.belt = AERO.belt; // la cinta caminadora (el motor la aplica vía sc.belt)
      this.pan = 0; this.joseExpr = 'happy';
      this.nearDoor = false; this.nearDoorX = this.entryDoorX; this.usedDoorX = this.entryDoorX;
      this.free = makeStripChars(210, 280, this.groundY);
      // Maletas sueltas repartidas por la terminal (props
      // decorativos, sin colisión como en las demás franjas):
      // se ordenan por Y con los personajes al dibujar.
      this.bags = [
        { x: 350, y: 322, w: 26, color: '#c65b4e' },
        { x: 388, y: 330, w: 20, color: '#4e7fc6' },
        { x: 980, y: 332, w: 24, color: '#5aa469' },
        { x: 2650, y: 324, w: 27, color: '#d9a441' },
        { x: 3050, y: 332, w: 22, color: '#7a5fa8' },
        { x: 3350, y: 326, w: 25, color: '#4fa8a0' },
      ];
      // El carrito de equipaje, ya pasado el trecho de la cinta.
      this.cartX = 2780; this.cartY = 332;
      // Letreros colgantes de salidas (x de mundo).
      this.signsX = [800, 2050, 3150];
    }
    switchActive() {
      if (this.phase !== 'free') return;
      this.free.active = this.free.active === 'ximena' ? 'jose' : 'ximena';
      if (G.input && G.input.flush) G.input.flush();
    }
    // Llegada desde San Ángel (por su Puerta del árbol): fundido
    // de luz (~1 s) y la escena queda explorable en modo libre.
    enterFromSanAngel() {
      this.phase = 'light'; this.phaseT = 0;
      const F = this.free, A = F.chars[F.active], B = F.chars[F.active === 'ximena' ? 'jose' : 'ximena'];
      A.x = this.entryDoorX + 120; A.y = this.groundY;
      B.x = this.entryDoorX + 190; B.y = this.groundY; B.follow = false;
      this.pan = 0; this.nearDoor = false;
    }
    // Vuelta desde las praderas del castillo (por cualquiera
    // de sus dos Puertas): se reaparece junto a la Puerta de
    // SALIDA de la terminal, la que conecta con la escena 4.
    enterFromPradera() {
      this.phase = 'light'; this.phaseT = 0;
      const F = this.free, A = F.chars[F.active], B = F.chars[F.active === 'ximena' ? 'jose' : 'ximena'];
      A.x = this.exitDoorX - 70; A.y = this.groundY;
      B.x = this.exitDoorX - 140; B.y = this.groundY; B.follow = false;
      this.pan = Math.max(0, Math.min(this.worldW - 640, A.x - 320));
      this.nearDoor = false;
    }
    beginExit() {
      if (this.phase !== 'free') return;
      this.phase = 'exitdoor'; this.phaseT = 0; this.usedDoorX = this.nearDoorX; D.tap = false;
      playDoorClose(); // la Puerta se cierra tras la pareja (grabación real)
    }
    update(dt) {
      this.t += dt;
      if (this.phase === 'light') {
        this.phaseT += dt;
        if (this.phaseT >= 1) { this.phase = 'free'; this.phaseT = 0; }
        return;
      }
      if (this.phase === 'exitdoor') {
        // La Puerta usada manda en la cadena: la de ENTRADA
        // devuelve a San Ángel, junto a su Puerta del árbol;
        // la de SALIDA sigue el paseo a las PRADERAS del
        // castillo (escena 4). Sin reloj nuevo en ningún caso.
        this.phaseT += dt;
        if (this.phaseT >= 1) {
          if (this.usedDoorX === this.exitDoorX) travelTo('castillo');
          else travelTo('sanangel', 'tree');
        }
        return;
      }
      if (this.phase === 'free') {
        this.phaseT += dt;
        this.updateFree(dt);
      }
    }
    updateFree(dt) {
      const F = this.free, A = F.chars[F.active];
      const dE = Math.abs(A.x - this.entryDoorX), dX = Math.abs(A.x - this.exitDoorX);
      this.nearDoor = Math.min(dE, dX) < 58 && Math.abs(A.y - this.groundY) < 40;
      this.nearDoorX = dE <= dX ? this.entryDoorX : this.exitDoorX;
      if (this.nearDoor && (G.input.hit('action') || D.tap)) { this.beginExit(); return; }
      updateStripFree(this, dt);
      // El fragmento del AEROPUERTO (guion v2): a mitad de la
      // escena (x ≈ 1800 de 3600), en la parte en calma y
      // lejos de las Puertas, una sola vez por partida.
      if (!D.cartaFrag.aero && !this.nearDoor && A.x >= 1750) {
        D.cartaFrag.aero = true;
        showCartaBand(CARTA_TEXTOS.aero);
      }
    }
    draw(dt) {
      const c = G.ovCtx; if (!c) return;
      c.setTransform(2, 0, 0, 2, 0, 0);
      c.clearRect(0, 0, 640, 360);
      const t = this.t, pan = this.pan, groundY = this.groundY, horizon = this.horizon;
      const winTop = 34, winBot = 212; // la banda del ventanal continuo
      // ===== el EXTERIOR, detrás del cristal =====
      // cielo claro de mañana sobre la banda de cristal
      const sky = c.createLinearGradient(0, 0, 0, winBot);
      sky.addColorStop(0, '#a8cbe4'); sky.addColorStop(0.6, '#d9ecf5'); sky.addColorStop(1, '#f2e3c2');
      c.fillStyle = sky; c.fillRect(0, 0, 640, winBot);
      // el campo de vuelo: franja verde lejana y la pista, con
      // su línea central desfilando al parallax del exterior
      c.fillStyle = '#a9bf9a'; c.fillRect(0, 168, 640, 20);
      c.fillStyle = '#98a2a9'; c.fillRect(0, 188, 640, winBot - 188);
      c.fillStyle = 'rgba(255,255,255,0.55)';
      const dashOff = -(((pan * AERO.avion.par) % 46) + 46) % 46;
      for (let x = dashOff; x < 640; x += 46) c.fillRect(x, 198, 22, 3);
      // EL CASTILLO AMBULANTE a lo lejos (solo si el asset
      // solo-local cargó): quieto en el horizonte, en su capa
      // lejana (parallax 0,1), con VELO DE DISTANCIA (tinte
      // celeste y la base fundida en la luz del horizonte,
      // como la vista de San Ángel en la plaza). El avión
      // rueda DELANTE de él, en su primer plano exterior: el
      // castillo es el fondo del fondo y no se enciman.
      if (imgOk(castilloImg)) {
        const cf = AERO.castillo, chh = cf.h, cw2 = chh * castilloImg.naturalWidth / castilloImg.naturalHeight;
        const ccx = cf.layerCx - pan * cf.par;
        if (ccx + cw2 / 2 > -10 && ccx - cw2 / 2 < 650) {
          c.drawImage(castilloImg, ccx - cw2 / 2, cf.baseY - chh, cw2, chh);
          const veil = c.createLinearGradient(0, cf.baseY - chh, 0, cf.baseY);
          veil.addColorStop(0, 'rgba(168,203,228,0.42)');
          veil.addColorStop(0.75, 'rgba(190,214,232,0.30)');
          veil.addColorStop(1, 'rgba(242,227,194,0.55)');
          c.fillStyle = veil; c.fillRect(ccx - cw2 / 2, cf.baseY - chh, cw2, chh);
        }
      }
      // EL AVIÓN (el mismo recorte de la plaza, ya registrado),
      // grande y rodando lento por la pista, FUERA del ventanal
      if (imgOk(avionImg)) {
        const aw = AERO.avion.w, ah = aw * avionImg.naturalHeight / avionImg.naturalWidth;
        const ax = aeroPlaneXAt(t) - pan * AERO.avion.par;
        if (ax + aw / 2 > -10 && ax - aw / 2 < 650) c.drawImage(avionImg, ax - aw / 2, AERO.avion.baseY - ah, aw, ah);
      }
      // el cristal: un velo frío sobre todo el exterior
      c.fillStyle = 'rgba(190,218,238,0.16)'; c.fillRect(0, winTop, 640, winBot - winTop);
      // ===== la TERMINAL, sobre el exterior =====
      // techo con sus tiras de luz (paramétricas en pan)
      c.fillStyle = '#dde4e8'; c.fillRect(0, 0, 640, winTop);
      c.fillStyle = 'rgba(255,255,246,0.85)';
      const lightOff = -(pan % 220);
      for (let x = lightOff; x < 640; x += 220) c.fillRect(x + 30, 12, 90, 7);
      // montantes del ventanal: viven en el mundo (parallax 1),
      // se mueven con la cámara y el exterior se ve ENTRE ellos;
      // los rieles horizontales son continuos en pantalla
      c.fillStyle = '#5b6a72';
      const mull0 = Math.floor(pan / 110) * 110;
      for (let wx = mull0; wx < pan + 640 + 110; wx += 110) c.fillRect(wx - pan - 3, winTop, 6, winBot - winTop);
      c.fillRect(0, winTop - 4, 640, 6); c.fillRect(0, winBot - 2, 640, 6);
      // pared bajo el ventanal, con sus paneles
      const wall = c.createLinearGradient(0, winBot, 0, horizon);
      wall.addColorStop(0, '#ccd6db'); wall.addColorStop(1, '#aebbc2');
      c.fillStyle = wall; c.fillRect(0, winBot, 640, horizon - winBot);
      c.strokeStyle = 'rgba(90,110,120,0.35)'; c.lineWidth = 1;
      const seamOff = -(pan % 130);
      for (let x = seamOff; x < 640; x += 130) { c.beginPath(); c.moveTo(x, winBot + 4); c.lineTo(x, horizon - 3); c.stroke(); }
      // piso claro y pulido, con su retícula tenue
      const fl = c.createLinearGradient(0, horizon, 0, 360);
      fl.addColorStop(0, '#e9edee'); fl.addColorStop(1, '#bfc9ce');
      c.fillStyle = fl; c.fillRect(0, horizon, 640, 360 - horizon);
      c.strokeStyle = 'rgba(90,110,120,0.20)';
      const tileOff = -(pan % 46);
      for (let x = tileOff; x < 640; x += 46) { c.beginPath(); c.moveTo(x, horizon + 3); c.lineTo(x - 12, 360); c.stroke(); }
      for (const y of [262, 288, 318, 352]) { c.beginPath(); c.moveTo(0, y); c.lineTo(640, y); c.stroke(); }
      // la CINTA CAMINADORA sobre la línea de caminata (trecho
      // central de la franja): banda oscura con bordes de
      // seguridad y flechas que desfilan en su dirección (+x,
      // la misma de la deriva que aplica el motor)
      const bx0 = this.belt.x0 - pan, bx1 = this.belt.x1 - pan;
      if (bx1 > -10 && bx0 < 650) {
        const by0 = groundY - 15, by1 = groundY + 17;
        c.fillStyle = '#3d4a52'; c.fillRect(bx0, by0, bx1 - bx0, by1 - by0);
        c.fillStyle = '#d9a83c'; c.fillRect(bx0, by0, bx1 - bx0, 3); c.fillRect(bx0, by1 - 3, bx1 - bx0, 3);
        c.fillStyle = 'rgba(255,255,255,0.45)';
        const chOff = (t * this.belt.speed) % 46;
        for (let x = bx0 - 46 + chOff; x < bx1 - 8; x += 46) {
          if (x < bx0 + 2) continue;
          c.beginPath(); c.moveTo(x, by0 + 8); c.lineTo(x + 9, (by0 + by1) / 2); c.lineTo(x, by1 - 8); c.lineTo(x + 3.5, (by0 + by1) / 2); c.closePath(); c.fill();
        }
      }
      // columnas de la terminal (mundo, una cada 700 px)
      for (let wx = 500; wx < this.worldW; wx += 700) {
        const sx = wx - pan;
        if (sx < -50 || sx > 690) continue;
        c.fillStyle = '#d3dbdf'; c.fillRect(sx - 15, 26, 30, groundY - 20);
        c.fillStyle = 'rgba(90,110,120,0.25)'; c.fillRect(sx - 15, 26, 6, groundY - 20);
        c.fillStyle = 'rgba(255,255,255,0.5)'; c.fillRect(sx + 9, 26, 5, groundY - 20);
        c.fillStyle = '#aebbc2'; c.fillRect(sx - 18, 26, 36, 10); // capitel
      }
      // letreros colgantes de salidas (mundo)
      for (const wx of this.signsX) {
        const sx = wx - pan;
        if (sx < -90 || sx > 730) continue;
        this.drawSign(c, sx);
      }
      // las dos Puertas de la franja (la misma Puerta de siempre)
      const usedOpen = this.phase === 'exitdoor' ? Math.min(1, this.phaseT) : 0;
      const entryOpen = this.phase === 'light' && this.phaseT < 0.9 ? 1 - this.phaseT / 0.9 : (this.usedDoorX === this.entryDoorX ? usedOpen : 0);
      drawDoor2DAt(c, this.entryDoorX - pan, groundY, entryOpen);
      drawDoor2DAt(c, this.exitDoorX - pan, groundY, this.usedDoorX === this.exitDoorX ? usedOpen : 0);
      // capa ordenada por Y: las maletas, el carrito y los
      // personajes (la pileta de San Ángel manda este patrón)
      const items = [];
      for (const b of this.bags) items.push({ y: b.y, fn: () => this.drawSuitcase(c, b.x - pan, b.y, b.w, b.color) });
      items.push({ y: this.cartY, fn: () => this.drawCart(c, pan) });
      const chars = [this.free.chars.ximena, this.free.chars.jose].slice().sort((a, b) => a.y - b.y);
      for (const ch of chars) {
        items.push({
          y: ch.y, fn: () => {
            // el reflejo suave del piso pulido: la elipse tenue
            // común, acorde a interior
            c.fillStyle = 'rgba(25,35,50,0.16)';
            c.beginPath(); c.ellipse(ch.x - pan, ch.y + 3, 19, 4.5, 0, 0, 6.3); c.fill();
            let anim = 'idle', idx = Math.floor(t * 1.4), bobY = Math.sin(t * 2.2 + (ch.id === 'jose' ? 1 : 0)) * 1.2;
            if (this.phase === 'free' && ch.animWalk) { anim = 'walk_right'; idx = walkIdxFor(ch.id, ch.dist); bobY = 0; }
            drawChar2DAt(c, ch.id, ch.x - pan, ch.y, 96, anim, idx, ch.id === 'jose' ? this.joseExpr : null, ch.dir === 'left', bobY);
          },
        });
      }
      items.sort((a, b) => a.y - b.y);
      for (const it of items) it.fn();
      if (this.phase === 'free' && this.nearDoor) G.prompt(c, 'ESPACIO: cruzar la Puerta', this.nearDoorX - pan, groundY - 96);
      // luz de la Puerta: se disipa al llegar, crece al salir
      if (this.phase === 'light') { c.fillStyle = `rgba(255,244,214,${(1 - Math.min(1, this.phaseT)).toFixed(3)})`; c.fillRect(0, 0, 640, 360); }
      if (this.phase === 'exitdoor') { const a = Math.min(1, this.phaseT); c.fillStyle = `rgba(255,244,214,${(a * a).toFixed(3)})`; c.fillRect(0, 0, 640, 360); }
      // la banda de la carta, sobre el paseo (guion v2)
      drawCartaBand(c);
    }
    // Una maleta con ruedas y asa, en el lenguaje plano con
    // borde de los props dibujados del juego.
    drawSuitcase(c, cx, baseY, w, color) {
      if (cx < -40 || cx > 680) return;
      const h = w * 1.22;
      c.fillStyle = 'rgba(25,35,50,0.15)';
      c.beginPath(); c.ellipse(cx, baseY + 2, w * 0.55, 3.5, 0, 0, 6.3); c.fill();
      c.fillStyle = color;
      c.beginPath();
      if (c.roundRect) c.roundRect(cx - w / 2, baseY - h, w, h - 3, 4); else c.rect(cx - w / 2, baseY - h, w, h - 3);
      c.fill();
      c.strokeStyle = 'rgba(20,26,34,0.55)'; c.lineWidth = 1.4; c.stroke();
      c.fillStyle = 'rgba(255,255,255,0.20)'; c.fillRect(cx - 2, baseY - h + 3, 4, h - 9); // la correa central
      c.strokeStyle = 'rgba(20,26,34,0.7)'; c.lineWidth = 1.6;
      c.beginPath(); c.moveTo(cx - w * 0.18, baseY - h); c.lineTo(cx - w * 0.18, baseY - h - 5); c.lineTo(cx + w * 0.18, baseY - h - 5); c.lineTo(cx + w * 0.18, baseY - h); c.stroke(); // el asa
      c.fillStyle = '#22282e';
      c.beginPath(); c.arc(cx - w * 0.3, baseY - 1.5, 2.4, 0, 6.3); c.arc(cx + w * 0.3, baseY - 1.5, 2.4, 0, 6.3); c.fill(); // las ruedas
    }
    // El carrito de equipaje: bastidor de postes y barra, la
    // plataforma y tres maletas apiladas de mayor a menor.
    drawCart(c, pan) {
      const cx = this.cartX - pan, baseY = this.cartY;
      if (cx < -70 || cx > 710) return;
      c.fillStyle = 'rgba(25,35,50,0.15)';
      c.beginPath(); c.ellipse(cx, baseY + 2, 34, 4, 0, 0, 6.3); c.fill();
      c.strokeStyle = '#7d8890'; c.lineWidth = 3;
      c.beginPath(); c.moveTo(cx - 24, baseY); c.lineTo(cx - 24, baseY - 104); c.moveTo(cx + 24, baseY); c.lineTo(cx + 24, baseY - 104); c.stroke();
      c.fillStyle = '#7d8890'; c.fillRect(cx - 27, baseY - 3, 54, 4); // la plataforma
      this.drawSuitcase(c, cx - 3, baseY - 5, 34, '#4e7fc6');
      this.drawSuitcase(c, cx - 1, baseY - 5 - 38, 29, '#c65b4e');
      this.drawSuitcase(c, cx + 1, baseY - 5 - 38 - 32, 24, '#5aa469');
      c.strokeStyle = '#7d8890'; c.lineWidth = 3;
      c.beginPath(); c.moveTo(cx - 24, baseY - 104); c.lineTo(cx + 24, baseY - 104); c.stroke(); // la barra de empuje
    }
    // Letrero colgante de salidas: dos varillas desde el techo,
    // tablero oscuro, pictograma de avión despegando dibujado
    // por código, el texto «Salidas» y una flecha (sin emojis).
    drawSign(c, cx) {
      c.strokeStyle = 'rgba(60,72,80,0.8)'; c.lineWidth = 2;
      c.beginPath(); c.moveTo(cx - 44, 0); c.lineTo(cx - 44, 40); c.moveTo(cx + 44, 0); c.lineTo(cx + 44, 40); c.stroke();
      c.fillStyle = '#22303a';
      c.beginPath();
      if (c.roundRect) c.roundRect(cx - 66, 40, 132, 42, 6); else c.rect(cx - 66, 40, 132, 42);
      c.fill();
      c.strokeStyle = 'rgba(255,255,255,0.25)'; c.lineWidth = 1; c.stroke();
      // el pictograma: un avión en diagonal de despegue
      c.save(); c.translate(cx - 42, 61); c.rotate(-0.55);
      c.fillStyle = '#f4f8fa';
      c.beginPath(); c.ellipse(0, 0, 13, 3.4, 0, 0, 6.3); c.fill(); // fuselaje
      c.beginPath(); c.moveTo(-1, 1); c.lineTo(6, 10); c.lineTo(10, 1); c.closePath(); c.fill(); // ala
      c.beginPath(); c.moveTo(-12, -1); c.lineTo(-8, -8); c.lineTo(-6, -1); c.closePath(); c.fill(); // cola
      c.restore();
      c.fillStyle = '#f4f8fa'; c.font = 'bold 13px sans-serif'; c.textAlign = 'left';
      c.fillText('Salidas', cx - 22, 66);
      c.strokeStyle = '#ffd23f'; c.lineWidth = 2.4;
      c.beginPath(); c.moveTo(cx + 34, 61); c.lineTo(cx + 54, 61); c.moveTo(cx + 47, 54); c.lineTo(cx + 55, 61); c.lineTo(cx + 47, 68); c.stroke(); // la flecha
    }
  }

  // ---------- Escena 4: PRADERAS DEL CASTILLO (dibujada) ----------
  // Decisión de Jose (2026-11-21): la escena 4 ya NO es el
  // castillo flotante — son las PRADERAS cercanas al castillo
  // ambulante: lugares amplios con fondos de montañas, praderas
  // y nubes, todo dibujado por código (paramétrico en pan), y
  // el castillo — el recorte de su imagen, solo-local — de pie
  // al final de la franja, con la Puerta de salida frente a él.
  // Geometría: 4350 px de mundo (el w de su bloque en la tabla
  // maestra: 29 s × PACE), Puerta de entrada a la izquierda
  // (x=90) y la del castillo al final (x=4250).
  const PRADERA = {
    worldW: sceneOf('castillo').w, entryDoorX: 90, exitDoorX: 4250, groundY: 316, horizon: 252,
    naboX: 2150, // el espantapájaros Cabeza de Nabo, junto a la vereda en la zona media
    // El castillo al final: capa de paisaje (parallax 0,25,
    // como el árbol de San Ángel). Su centro de capa está
    // puesto para que, con la cámara al fondo (pan 3710), su
    // centro caiga a pantalla ≈505 — justo tras la Puerta de
    // salida (4250 → pantalla 540): la Puerta queda frente al
    // castillo, como su entrada. Entra en pantalla recién en
    // el último tercio del paseo (a pan 1200 aún no se ve) y
    // se apoya en baseY, sobre la pradera lejana.
    castillo: { par: 0.25, layerCx: 1432, h: 450, baseY: 262 },
    // Las bocas de chimenea del recorte, en fracciones de su
    // caja (x desde la izquierda, y desde arriba): de ahí
    // sale el humo dibujado por código.
    humo: [[0.448, 0.02], [0.565, 0.08], [0.615, 0.10]],
    // --- Enriquecimiento de las praderas (pedido de Jose: la
    // escena se veía MUY VACÍA, también el cielo) ---
    // Los CALCIFER de la vereda: el obstáculo de fuego de
    // esta escena (patrón de las bolas de paja: chocar solo
    // frena, ×frenoK durante frenoT). ESTÁTICOS sobre su
    // tronquito, repartidos por el trecho medio de la franja
    // (fuera del arranque y de la zona de la Puerta del
    // castillo), cada uno a una altura distinta de la banda
    // caminable (yOff sobre groundY, ±26) para obligar a
    // esquivar también en vertical. Tamaños 46–60 px de alto
    // (el recorte es ancho por los brazos: ~2,45× el alto).
    calciferes: [
      { x: 720, yOff: -18, size: 52 }, { x: 1150, yOff: 16, size: 58 },
      { x: 1560, yOff: -4, size: 48 }, { x: 1980, yOff: 20, size: 55 },
      { x: 2430, yOff: -16, size: 50 }, { x: 2890, yOff: 10, size: 60 },
      { x: 3320, yOff: -8, size: 46 },
    ],
    // frenoK/frenoT: el trastabilleo de siempre. offT: tras
    // el fogonazo el Calcifer queda «apagado» (tenue y sin
    // colisión) esos segundos y se reaviva — no puede frenar
    // dos veces seguidas al mismo paso.
    // La ZONA DE PELIGRO es una elipse ajustada al NÚCLEO
    // OPACO de la llama, MEDIDO del recorte calcifer.png
    // (800×326): las columnas con ≥45% de su alto opaco a
    // alfa ≥245 ocupan x 250–544 (el cuerpo: 0,369 del ancho
    // total, centro en 0,496) y el cuerpo llena el 95% del
    // alto. Los BRAZOS extendidos y el resplandor suave
    // quedan FUERA: no queman. (Bug del playtest de Jose:
    // «choque o no con el fuego igual me afecta» — la cuenta
    // vieja era un círculo de radio ~26+24 ≈ 50 px desde el
    // centro de la CAJA del recorte y alcanzaba al personaje
    // sin que tocara la llama visible.) Como el recorte se
    // dibuja de alto s y ancho s×800/326, el núcleo en
    // pantalla mide 0,369×(800/326)·s de ancho y 0,95·s de
    // alto, de donde:
    //   coreRxK = 0,369 × 800/326 / 2 ≈ 0,453 (semiancho, en s)
    //   coreRyK = 0,95 / 2 = 0,475 (semialto, en s)
    //   coreCyK = 0,525: el centro del núcleo cae a
    //     base − 4 − 0,525·s (la caja se dibuja desde
    //     base − 4 − s y el núcleo llena su 95% superior).
    // charR: el radio del TORSO del personaje controlado
    // (los torsos medidos de las hojas definidas, a 96 px de
    // alto, miden 37–48 px de ancho; 15 deja fuera pelo,
    // brazos y borde blanco: el fogonazo exige solape visual
    // real entre el torso y el núcleo, ni un px antes). Las
    // mismas constantes valen para la llamita de respaldo
    // dibujada (su cuerpo mide ±0,38·s de ancho y s de alto:
    // la elipse la cubre con ~4 px de margen en su punto más
    // ancho). El parpadeo entra vía s: la elipse escala con
    // el tamaño dibujado (±6% como mucho).
    calcifer: { frenoK: 0.4, frenoT: 0.7, offT: 3, coreRxK: 0.453, coreRyK: 0.475, coreCyK: 0.525, charR: 15 },
    // La ARBOLEDA del fondo (dibujada por código) y MONONOKE
    // observando desde ella: viven en una capa de fondo
    // (parallax 0,45, la de la colina lejana). Su centro de
    // capa (1450) cruza el centro de pantalla a pan 2511, el
    // ~68% del paseo (segunda mitad), y acompaña en pantalla
    // la zona de mundo 2800–3300 del caminante (pan
    // 2480–2980). baseY: las copas se apoyan tras la línea
    // de la colina y el suelo de la pradera tapa la base.
    arboleda: { par: 0.45, layerCx: 1450, baseY: 292 },
    // h: el alto del recorte al dibujarlo (ancho según su
    // aspecto 760×839). dx: su corrimiento dentro de la
    // arboleda — va pequeña y escondida (ver drawArboleda).
    mononoke: { h: 120, dx: -30 },
    // El SOL de la tarde: disco con halo en la capa más
    // lejana (parallax 0,06): acompaña todo el paseo (su
    // centro pasa de pantalla 500 a pan 0 a ~277 a pan 3710).
    sol: { par: 0.06, layerCx: 500, y: 66, r: 17 },
    // El DIRIGIBLE dibujado que cruza el cielo: ciclo largo
    // de 120 s (cruza en 75 s a ~15 px/s y espera fuera de
    // escena), como el avión de la plaza pero mucho más lento.
    dirigible: { ciclo: 120, cruce: 75, desfase: 20, y: 58, par: 0.05 },
    // Anclas de las MARIPOSAS dibujadas (vuelo errático por
    // senos junto a las flores, en la capa de personajes).
    mariposas: [{ x: 1250, dy: -54 }, { x: 2350, dy: -44 }, { x: 3050, dy: -60 }],
  };
  // Las TRES profundidades de nubes de las praderas (Jose:
  // «veo muy vacío el cielo»): bancos lejanos grandes y bajos
  // sobre las montañas (capa 0, se dibujan ENTRE las dos
  // cordilleras) y dos capas de nubes viajeras (1 y 2, la
  // media más grande que antes). praderaClouds(t, pan) da la
  // lista en pantalla para que el dibujo y el humo compartan
  // la misma verdad: en cualquier pan hay varias masas
  // visibles a la vez.
  const PR_NUBES = [
    { n: 4, paso: 460, span: 1150, off: 255, vel: 1.2, par: 0.05, y0: 176, yVar: 26, s0: 2.0, sVar: 0.6, a: 0.55 },
    { n: 6, paso: 320, span: 940, off: 150, vel: 2.2, par: 0.08, y0: 34, yVar: 44, s0: 0.75, sVar: 0.4, a: 0.75 },
    { n: 5, paso: 430, span: 980, off: 170, vel: 4.5, par: 0.18, y0: 62, yVar: 54, s0: 1.45, sVar: 0.55, a: 0.92 },
  ];
  function praderaClouds(t, pan) {
    const out = [];
    PR_NUBES.forEach((L, capa) => {
      for (let i = 0; i < L.n; i++) {
        const lx = i * L.paso + hashN(i * 3.3 + capa * 13.7) * 130;
        const x = (((lx + t * L.vel - pan * L.par) % L.span) + L.span) % L.span - L.off;
        out.push({
          x, y: L.y0 + hashN(i * 7.1 + capa * 7.9) * L.yVar,
          s: L.s0 + hashN(i * 5.7 + capa * 3.1) * L.sVar, a: L.a, capa,
        });
      }
    });
    return out;
  }
  // Centro del dirigible (px de pantalla, SIN parallax) en el
  // tiempo t: cruza de izquierda a derecha durante `cruce` s
  // y el resto del ciclo espera fuera de escena (−9999).
  function dirigibleXAt(t) {
    const f = PRADERA.dirigible, ph = (((t + f.desfase) % f.ciclo) + f.ciclo) % f.ciclo;
    if (ph >= f.cruce) return -9999;
    return -240 + (ph / f.cruce) * 1140;
  }
  // Una bandada de pájaros dibujados (3–5 por grupo): cruza
  // el cielo en ~26 s dentro de su ciclo de 71 s (cada grupo
  // k con su desfase y su altura) y fuera de la ventana no
  // existe (null). `flap` es la fase del aleteo de cada pájaro.
  function bandadaAt(t, k) {
    const ciclo = 71, cruce = 26, ph = (((t + k * 23) % ciclo) + ciclo) % ciclo;
    if (ph > cruce) return null;
    const base = [[0, 0], [24, 9], [48, -3], [70, 7]];
    return {
      x: -90 + (ph / cruce) * 820,
      y: 46 + k * 30 + Math.sin(t * 0.9 + k * 2.0) * 5,
      pts: base.map(([dx, dy], i) => ({ dx, dy, flap: Math.sin(t * 9 + i * 1.3 + k * 2.2) })),
    };
  }
  // El parpadeo de un Calcifer: dos senos desfasados por
  // instancia; escala 1 ± 0,06 como mucho. La elipse de
  // peligro se deriva del tamaño dibujado (s × flick), así
  // que pulsa con el mismo factor: ±6%, nunca más.
  function calciferFlick(t, i) {
    return 1 + 0.04 * Math.sin(t * 7 + i * 1.93) + 0.02 * Math.sin(t * 11.3 + i * 0.71);
  }
  // Posición de una mariposa en el tiempo t: vuelo errático
  // por senos alrededor de su ancla (junto a las flores).
  function mariposaAt(t, i) {
    const an = PRADERA.mariposas[i % PRADERA.mariposas.length];
    return {
      x: an.x + Math.sin(t * 0.31 + i * 2.1) * 38 + Math.sin(t * 0.83 + i) * 9,
      y: PRADERA.groundY + an.dy + Math.sin(t * 0.97 + i * 1.7) * 9,
    };
  }
  // Cresta de montaña determinista (suma de senos): el mismo
  // perfil para cualquier pan, sin memoria ni azar por frame.
  function ridgeY(x, seed) {
    return Math.sin(x * 0.008 + seed) * 22 + Math.sin(x * 0.021 + seed * 1.7) * 13 + Math.sin(x * 0.047 + seed * 0.6) * 6;
  }
  // Semilla estable por posición, para repartir matas y flores.
  function hashN(n) { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); }

  class PraderaScene {
    constructor() {
      this.id = 'castillo';
      this.phase = 'light'; this.t = 0; this.phaseT = 0;
      this.worldW = PRADERA.worldW; this.groundY = PRADERA.groundY; this.horizon = PRADERA.horizon;
      this.entryDoorX = PRADERA.entryDoorX; this.exitDoorX = PRADERA.exitDoorX;
      this.pan = 0; this.joseExpr = 'happy';
      this.nearDoor = false; this.nearDoorX = this.entryDoorX; this.usedDoorX = this.entryDoorX;
      this.free = makeStripChars(210, 280, this.groundY);
      // El freno de los Calcifer (patrón de las bolas de paja
      // de San Ángel): frenoT = segundos que le quedan y
      // speedK es el gancho que lee updateStripFree. Las
      // chispas son las brasas del último fogonazo.
      this.frenoT = 0; this.speedK = 1;
      this.resetCalcifers();
    }
    // Los Calcifer parten encendidos y sin brasas sueltas:
    // al construir la escena y en cada entrada.
    resetCalcifers() {
      this.calciferes = PRADERA.calciferes.map((d, i) => ({ x: d.x, yOff: d.yOff, size: d.size, i, offT: 0, popT: 0 }));
      this.chispas = [];
    }
    switchActive() {
      if (this.phase !== 'free') return;
      this.free.active = this.free.active === 'ximena' ? 'jose' : 'ximena';
      if (G.input && G.input.flush) G.input.flush();
    }
    // Llegada desde el aeropuerto (por su Puerta de salida):
    // fundido de luz (~1 s) y la escena queda explorable en
    // modo libre.
    enterFromAero() {
      this.phase = 'light'; this.phaseT = 0;
      const F = this.free, A = F.chars[F.active], B = F.chars[F.active === 'ximena' ? 'jose' : 'ximena'];
      A.x = this.entryDoorX + 120; A.y = this.groundY;
      B.x = this.entryDoorX + 190; B.y = this.groundY; B.follow = false;
      this.pan = 0; this.nearDoor = false;
      this.frenoT = 0; this.speedK = 1; this.resetCalcifers();
    }
    // Vuelta desde el departamento final (por su puerta
    // principal): se reaparece junto a la Puerta del castillo,
    // la de SALIDA de las praderas. La «salida» del depa es
    // solo para revisión: en la secuencia la cita es el final.
    enterFromFinale() {
      this.phase = 'light'; this.phaseT = 0;
      const F = this.free, A = F.chars[F.active], B = F.chars[F.active === 'ximena' ? 'jose' : 'ximena'];
      A.x = this.exitDoorX - 70; A.y = this.groundY;
      B.x = this.exitDoorX - 140; B.y = this.groundY; B.follow = false;
      this.pan = Math.max(0, Math.min(this.worldW - 640, A.x - 320));
      this.nearDoor = false;
      this.frenoT = 0; this.speedK = 1; this.resetCalcifers();
    }
    beginExit() {
      if (this.phase !== 'free') return;
      this.phase = 'exitdoor'; this.phaseT = 0; this.usedDoorX = this.nearDoorX; D.tap = false;
      playDoorClose(); // la Puerta se cierra tras la pareja (grabación real)
    }
    update(dt) {
      this.t += dt;
      if (this.phase === 'light') {
        this.phaseT += dt;
        if (this.phaseT >= 1) { this.phase = 'free'; this.phaseT = 0; }
        return;
      }
      if (this.phase === 'exitdoor') {
        // La Puerta usada manda en la cadena: la de ENTRADA
        // devuelve al aeropuerto, junto a su Puerta de salida;
        // la del CASTILLO sigue el paseo al DEPARTAMENTO
        // FINAL (escena 5, la cita). Sin reloj nuevo en
        // ningún caso.
        this.phaseT += dt;
        if (this.phaseT >= 1) {
          if (this.usedDoorX === this.exitDoorX) travelTo('cita');
          else travelTo('aero', 'pradera');
        }
        return;
      }
      if (this.phase === 'free') {
        this.phaseT += dt;
        this.updateFree(dt);
      }
    }
    updateFree(dt) {
      const F = this.free, A = F.chars[F.active];
      const dE = Math.abs(A.x - this.entryDoorX), dX = Math.abs(A.x - this.exitDoorX);
      this.nearDoor = Math.min(dE, dX) < 58 && Math.abs(A.y - this.groundY) < 40;
      this.nearDoorX = dE <= dX ? this.entryDoorX : this.exitDoorX;
      if (this.nearDoor && (G.input.hit('action') || D.tap)) { this.beginExit(); return; }
      // El freno de los Calcifer corre ANTES del movimiento:
      // speedK es el gancho que updateStripFree aplica a la
      // velocidad del controlado (el seguidor va a su aire).
      if (this.frenoT > 0) this.frenoT = Math.max(0, this.frenoT - dt);
      this.speedK = this.frenoT > 0 ? PRADERA.calcifer.frenoK : 1;
      updateStripFree(this, dt);
      this.updateCalcifers(dt);
      // El fragmento de las PRADERAS (guion v2): cuando el
      // castillo entra en cuadro. Su capa (PRADERA.castillo:
      // centro 1432, parallax 0,25, ancho ≈ 325) asoma por la
      // derecha cuando pan ≳ 2500; lejos de las Puertas y una
      // sola vez por partida.
      if (!D.cartaFrag.castillo && !this.nearDoor && this.pan >= 2500) {
        D.cartaFrag.castillo = true;
        showCartaBand(CARTA_TEXTOS.castillo);
      }
    }
    // Los Calcifer de la vereda: quietos sobre su tronquito,
    // parpadeando. SOLO el personaje CONTROLADO puede
    // quemarse: su torso (círculo de radio charR en su centro
    // corporal, A.y−48) contra la elipse del NÚCLEO opaco de
    // la llama (las constantes medidas de PRADERA.calcifer).
    // El fogonazo exige solape visual real entre el torso y
    // el núcleo: ni los brazos del recorte, ni su resplandor,
    // ni la caja entera de la imagen queman. El seguidor los
    // atraviesa sin efecto, como a las bolas de paja. Al
    // tocar uno: fogonazo (popT, con sus chispas) + el
    // trastabilleo de siempre (frenoT), y ese Calcifer queda
    // APAGADO offT segundos (tenue y sin colisión) antes de
    // reavivarse.
    updateCalcifers(dt) {
      const F = this.free, A = F.chars[F.active], CFG = PRADERA.calcifer;
      for (const cal of this.calciferes) {
        if (cal.offT > 0) cal.offT = Math.max(0, cal.offT - dt);
        if (cal.popT > 0) cal.popT = Math.max(0, cal.popT - dt);
        if (cal.offT > 0) continue;
        const sF = cal.size * calciferFlick(this.t, cal.i);
        const cx = cal.x, cy = this.groundY + cal.yOff - 4 - CFG.coreCyK * sF;
        const ex = (cx - A.x) / (CFG.coreRxK * sF + CFG.charR);
        const ey = (cy - (A.y - 48)) / (CFG.coreRyK * sF + CFG.charR);
        if (ex * ex + ey * ey < 1) {
          cal.offT = CFG.offT; cal.popT = 0.28;
          for (let i = 0; i < 8; i++) {
            const ang = Math.random() * 6.283, sp = 26 + Math.random() * 60;
            this.chispas.push({ x: cx, y: cy, vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp - 34, t: 0, life: 0.4 + Math.random() * 0.25, warm: Math.random() });
          }
          this.frenoT = CFG.frenoT;
          G.sfx('bump');
        }
      }
      // Las brasas del fogonazo: salen disparadas, suben un
      // poco por el calor y se apagan.
      for (const s of this.chispas) { s.t += dt; s.x += s.vx * dt; s.y += s.vy * dt; s.vy += 26 * dt; }
      this.chispas = this.chispas.filter(s => s.t < s.life);
    }
    draw(dt) {
      const c = G.ovCtx; if (!c) return;
      c.setTransform(2, 0, 0, 2, 0, 0);
      c.clearRect(0, 0, 640, 360);
      const t = this.t, pan = this.pan, groundY = this.groundY, horizon = this.horizon;
      // ===== cielo amplio de tarde clara =====
      const sky = c.createLinearGradient(0, 0, 0, horizon + 30);
      sky.addColorStop(0, '#6f9fd0'); sky.addColorStop(0.6, '#bcd9ea'); sky.addColorStop(1, '#f6e2b4');
      c.fillStyle = sky; c.fillRect(0, 0, 640, horizon + 30);
      // el SOL de la tarde en la capa más lejana: disco cálido
      // con su halo radial, fijo a su capa (parallax 0,06)
      {
        const so = PRADERA.sol, sx = so.layerCx - pan * so.par, sy = so.y;
        const halo = c.createRadialGradient(sx, sy, 4, sx, sy, 62);
        halo.addColorStop(0, 'rgba(255,238,186,0.55)'); halo.addColorStop(1, 'rgba(255,238,186,0)');
        c.fillStyle = halo; c.beginPath(); c.arc(sx, sy, 62, 0, 6.3); c.fill();
        c.fillStyle = '#fff3c4'; c.beginPath(); c.arc(sx, sy, so.r, 0, 6.3); c.fill();
      }
      // nubes algodonosas derivando con el viento (como las
      // del póster: blancas y redondas). Las da praderaClouds
      // en TRES profundidades: aquí van las dos viajeras (1 y
      // 2, la media más grande que antes); los bancos lejanos
      // (capa 0) se pintan entre las dos cordilleras, más abajo.
      const cloud = (x, y, s, a) => {
        c.fillStyle = `rgba(255,252,246,${a})`;
        c.beginPath();
        c.ellipse(x, y, 27 * s, 8.5 * s, 0, 0, 6.3);
        c.ellipse(x + 19 * s, y + 2 * s, 18 * s, 6.5 * s, 0, 0, 6.3);
        c.ellipse(x - 21 * s, y + 2 * s, 16 * s, 5.5 * s, 0, 0, 6.3);
        c.fill();
      };
      const nubes = praderaClouds(t, pan);
      for (const nb of nubes) if (nb.capa > 0) cloud(nb.x, nb.y, nb.s, nb.a);
      // el DIRIGIBLE que cruza el cielo, pequeño y lejano
      {
        const dx = dirigibleXAt(t);
        if (dx > -999) this.drawDirigible(c, dx - pan * PRADERA.dirigible.par, PRADERA.dirigible.y + Math.sin(t * 0.7) * 2);
      }
      // las BANDADAS de pájaros que cruzan de cuando en cuando
      for (let k = 0; k < 2; k++) {
        const bd = bandadaAt(t, k);
        if (!bd) continue;
        c.strokeStyle = 'rgba(40,50,60,0.8)'; c.lineWidth = 1.4; c.lineCap = 'round';
        for (const p of bd.pts) {
          const bx = bd.x + p.dx - pan * 0.07, by = bd.y + p.dy, w = p.flap * 2.6;
          c.beginPath();
          c.moveTo(bx - 5.5, by + 1.6 - w * 0.4); c.quadraticCurveTo(bx - 2.4, by - 2.6 - w, bx, by);
          c.quadraticCurveTo(bx + 2.4, by - 2.6 - w, bx + 5.5, by + 1.6 - w * 0.4);
          c.stroke();
        }
      }
      // ===== montañas al fondo, en dos capas =====
      const ridgePts = (par, baseOff, amp, seed) => {
        const pts = [];
        for (let sx = -8; sx <= 648; sx += 16) pts.push([sx, horizon + baseOff + ridgeY(sx + pan * par, seed) * amp]);
        return pts;
      };
      // la lejana (parallax 0,12): azulada y con velo, cumbres
      // nevadas en los picos altos
      let pts = ridgePts(0.12, -34, 1, 3.1);
      c.fillStyle = '#8ea6c6';
      c.beginPath(); c.moveTo(-8, horizon + 10);
      for (const [x, y] of pts) c.lineTo(x, y);
      c.lineTo(648, horizon + 10); c.closePath(); c.fill();
      c.fillStyle = 'rgba(250,252,255,0.8)';
      for (const [x, y] of pts) {
        if (y >= horizon - 52) continue;
        c.beginPath();
        c.moveTo(x - 8, y + 7); c.lineTo(x, y - 1); c.lineTo(x + 8, y + 7);
        c.lineTo(x + 3, y + 4); c.lineTo(x, y + 7); c.lineTo(x - 3, y + 4);
        c.closePath(); c.fill();
      }
      // los BANCOS de nubes lejanos (capa 0): grandes y bajos,
      // flotando sobre la cordillera lejana y detrás de la
      // cercana — el cielo nunca queda vacío sobre las montañas
      for (const nb of nubes) if (nb.capa === 0) cloud(nb.x, nb.y, nb.s, nb.a);
      // la cercana (parallax 0,22): verdosa y más baja
      pts = ridgePts(0.22, -14, 0.7, 7.3);
      c.fillStyle = '#74917c';
      c.beginPath(); c.moveTo(-8, horizon + 12);
      for (const [x, y] of pts) c.lineTo(x, y);
      c.lineTo(648, horizon + 12); c.closePath(); c.fill();
      // ===== la pradera =====
      // colina lejana ondulada (parallax 0,45), verde claro
      c.fillStyle = '#a8cf7a';
      c.beginPath(); c.moveTo(-8, horizon + 34);
      for (let sx = -8; sx <= 648; sx += 24) {
        const lx = sx + pan * 0.45;
        c.lineTo(sx, horizon + 6 + Math.sin(lx * 0.013 + 1.2) * 5 + Math.sin(lx * 0.031) * 3);
      }
      c.lineTo(648, horizon + 34); c.closePath(); c.fill();
      // la ARBOLEDA del fondo con MONONOKE observando (solo si
      // su recorte solo-local cargó): se dibuja aquí, tras la
      // colina, y el suelo de la pradera le tapa la base
      this.drawArboleda(c, pan);
      // el suelo de la pradera (la capa de la vereda)
      const gr = c.createLinearGradient(0, horizon + 20, 0, 360);
      gr.addColorStop(0, '#93c168'); gr.addColorStop(1, '#679c46');
      c.fillStyle = gr; c.fillRect(0, horizon + 20, 640, 360 - horizon - 20);
      // la vereda de tierra clara por donde caminan
      c.fillStyle = '#dcc794'; c.fillRect(0, groundY - 16, 640, 36);
      c.fillStyle = 'rgba(160,132,84,0.5)';
      c.fillRect(0, groundY - 16, 640, 2.5); c.fillRect(0, groundY + 17.5, 640, 2.5);
      // piedritas de la vereda, paramétricas en pan
      c.fillStyle = 'rgba(150,124,80,0.45)';
      for (let wx = Math.floor(pan / 34) * 34; wx < pan + 660; wx += 34) {
        const h1 = hashN(wx * 0.61);
        if (h1 < 0.4) continue;
        c.beginPath(); c.ellipse(wx - pan + h1 * 14, groundY - 10 + hashN(wx * 1.13) * 24, 2.6, 1.4, 0, 0, 6.3); c.fill();
      }
      // algunas ROCAS dibujadas repartidas por la pradera
      // (nunca sobre la vereda), con su cara iluminada
      for (let wx = Math.floor(pan / 150) * 150; wx < pan + 700; wx += 150) {
        const h1 = hashN(wx * 0.53);
        if (h1 < 0.45) continue;
        const bx = wx - pan + h1 * 30, by = groundY - 36 + hashN(wx * 0.97) * 86;
        if (by > groundY - 20 && by < groundY + 24) continue;
        const rw = 6 + h1 * 6;
        c.fillStyle = '#8d9291';
        c.beginPath();
        c.moveTo(bx - rw, by); c.lineTo(bx - rw * 0.4, by - rw * 0.62); c.lineTo(bx + rw * 0.5, by - rw * 0.7); c.lineTo(bx + rw, by);
        c.closePath(); c.fill();
        c.fillStyle = 'rgba(255,255,255,0.28)';
        c.beginPath();
        c.moveTo(bx - rw * 0.4, by - rw * 0.62); c.lineTo(bx + rw * 0.5, by - rw * 0.7); c.lineTo(bx + rw * 0.1, by - rw * 0.3); c.lineTo(bx - rw * 0.2, by - rw * 0.28);
        c.closePath(); c.fill();
      }
      // matas de pasto y florecitas, con el VIENTO recorriendo
      // la pradera: la inclinación de cada mata es un seno
      // viajero (fase = t·2,2 − x·0,02) y la mata se dobla con él
      // (paso más fino y menos huecos que antes: la pradera se
      // veía rala)
      for (let wx = Math.floor(pan / 22) * 22; wx < pan + 666; wx += 22) {
        const h1 = hashN(wx * 0.37);
        if (h1 < 0.22) continue;
        const bx = wx - pan + h1 * 12, by = groundY - 34 + hashN(wx * 0.83) * 84;
        if (by > groundY - 20 && by < groundY + 24) continue; // la vereda va pelada
        const lean = Math.sin(t * 2.2 - wx * 0.02) * 2.6, hh = 6 + h1 * 5;
        c.strokeStyle = 'rgba(52,102,38,0.75)'; c.lineWidth = 1.4;
        c.beginPath();
        c.moveTo(bx - 2.5, by); c.quadraticCurveTo(bx - 2 + lean * 0.5, by - hh * 0.6, bx - 3 + lean, by - hh);
        c.moveTo(bx, by); c.quadraticCurveTo(bx + lean * 0.5, by - hh * 0.7, bx + lean, by - hh - 1.5);
        c.moveTo(bx + 2.5, by); c.quadraticCurveTo(bx + 2 + lean * 0.5, by - hh * 0.6, bx + 3 + lean, by - hh);
        c.stroke();
        if (h1 > 0.80) { // una florecita sobre la mata
          const fc = ['#ffffff', '#ffd94d', '#f2a7c3'][Math.floor(hashN(wx * 2.9) * 3) % 3];
          const fx2 = bx + lean, fy2 = by - hh - 2;
          c.fillStyle = fc;
          c.beginPath(); c.arc(fx2 - 1.6, fy2, 1.5, 0, 6.3); c.arc(fx2 + 1.6, fy2, 1.5, 0, 6.3); c.arc(fx2, fy2 - 1.6, 1.5, 0, 6.3); c.fill();
          c.fillStyle = '#e8a13c'; c.beginPath(); c.arc(fx2, fy2 - 0.4, 1.1, 0, 6.3); c.fill();
        }
      }
      // ===== EL CASTILLO al final de la franja (solo si el
      // asset solo-local cargó): de pie sobre la pradera en su
      // capa de paisaje, con el humo de sus chimeneas dibujado
      // por código y la banda de niebla en su base, que
      // disimula el fundido del recorte =====
      if (imgOk(castilloImg)) {
        const cf = PRADERA.castillo, chh = cf.h, cw2 = chh * castilloImg.naturalWidth / castilloImg.naturalHeight;
        const ccx = cf.layerCx - pan * cf.par;
        if (ccx + cw2 / 2 > -20 && ccx - cw2 / 2 < 660) {
          c.drawImage(castilloImg, ccx - cw2 / 2, cf.baseY - chh, cw2, chh);
          c.fillStyle = 'rgba(190,208,228,0.10)'; // un velo apenas: es el destino, ya está cerca
          c.fillRect(ccx - cw2 / 2, cf.baseY - chh, cw2, chh);
          // el humo: bocanadas que suben, crecen y se disipan
          for (let s = 0; s < PRADERA.humo.length; s++) {
            const [fx, fy] = PRADERA.humo[s];
            const ox = ccx - cw2 / 2 + fx * cw2, oy = cf.baseY - chh + fy * chh;
            for (let k = 0; k < 4; k++) {
              const age = (t * 0.13 + k * 0.25 + s * 0.37) % 1;
              const px2 = ox + age * 15 + Math.sin(age * 6 + k * 2.1 + s) * 3;
              const py2 = oy - 4 - age * 46, r = 2.5 + age * 8.5;
              c.fillStyle = `rgba(246,247,243,${(0.30 * (1 - age)).toFixed(3)})`;
              c.beginPath(); c.arc(px2, py2, r, 0, 6.3); c.fill();
            }
          }
          // la niebla de la base
          const fog = c.createLinearGradient(0, cf.baseY - 15, 0, cf.baseY + 9);
          fog.addColorStop(0, 'rgba(255,255,255,0)');
          fog.addColorStop(0.62, 'rgba(255,255,255,0.55)');
          fog.addColorStop(1, 'rgba(255,255,255,0)');
          c.fillStyle = fog; c.fillRect(ccx - cw2 * 0.64, cf.baseY - 15, cw2 * 1.28, 24);
        }
      }
      // los ÁRBOLES solitarios del plano medio (dibujados,
      // distintos de la arboleda del fondo): de pie sobre el
      // pasto, justo detrás de la vereda; sin colisión
      this.drawArbolSolo(c, 1000 - pan, groundY - 24, 118, 1);
      this.drawArbolSolo(c, 1900 - pan, groundY - 24, 138, 2);
      this.drawArbolSolo(c, 3450 - pan, groundY - 24, 124, 3);
      // el espantapájaros Cabeza de Nabo, junto a la vereda
      this.drawNabo(c, PRADERA.naboX - pan, groundY - 30);
      // las dos Puertas de la franja (la misma Puerta de siempre)
      const usedOpen = this.phase === 'exitdoor' ? Math.min(1, this.phaseT) : 0;
      const entryOpen = this.phase === 'light' && this.phaseT < 0.9 ? 1 - this.phaseT / 0.9 : (this.usedDoorX === this.entryDoorX ? usedOpen : 0);
      drawDoor2DAt(c, this.entryDoorX - pan, groundY, entryOpen);
      drawDoor2DAt(c, this.exitDoorX - pan, groundY, this.usedDoorX === this.exitDoorX ? usedOpen : 0);
      // los personajes y los Calcifer, ordenados por Y (cada
      // Calcifer entra en el orden por la base de su
      // tronquito), con su sombra suave
      const items = [];
      for (const ch of [this.free.chars.ximena, this.free.chars.jose]) {
        items.push({
          y: ch.y, fn: () => {
            c.fillStyle = 'rgba(20,40,18,0.20)';
            c.beginPath(); c.ellipse(ch.x - pan, ch.y + 3, 19, 4.5, 0, 0, 6.3); c.fill();
            let anim = 'idle', idx = Math.floor(t * 1.4), bobY = Math.sin(t * 2.2 + (ch.id === 'jose' ? 1 : 0)) * 1.2;
            if (this.phase === 'free' && ch.animWalk) { anim = 'walk_right'; idx = walkIdxFor(ch.id, ch.dist); bobY = 0; }
            drawChar2DAt(c, ch.id, ch.x - pan, ch.y, 96, anim, idx, ch.id === 'jose' ? this.joseExpr : null, ch.dir === 'left', bobY);
          },
        });
      }
      for (const cal of this.calciferes) items.push({ y: groundY + cal.yOff, fn: () => this.drawCalcifer(c, cal) });
      items.sort((a, b) => a.y - b.y);
      for (const it of items) it.fn();
      // las brasas del último fogonazo, por encima de todos
      for (const s of this.chispas) {
        const k = 1 - s.t / s.life;
        c.fillStyle = s.warm > 0.5 ? `rgba(255,120,40,${(0.85 * k).toFixed(3)})` : `rgba(255,196,64,${(0.85 * k).toFixed(3)})`;
        c.beginPath(); c.arc(s.x - pan, s.y, 1.1 + s.warm * 1.1, 0, 6.3); c.fill();
      }
      // las MARIPOSAS junto a las flores, en la capa de
      // personajes: dos alitas que aletean rápido y el cuerpito
      for (let i = 0; i < PRADERA.mariposas.length; i++) {
        const mp = mariposaAt(t, i), mx2 = mp.x - pan;
        if (mx2 < -20 || mx2 > 660) continue;
        const flap = Math.sin(t * 13 + i * 2.0) * 0.65, wc = ['#ffffff', '#f2a541', '#b48ce0'][i % 3];
        c.save(); c.translate(mx2, mp.y);
        c.fillStyle = wc;
        c.save(); c.rotate(-0.5 - flap * 0.5); c.beginPath(); c.ellipse(-3.4, 0, 3.6, 2.1, 0, 0, 6.3); c.fill(); c.restore();
        c.save(); c.rotate(0.5 + flap * 0.5); c.beginPath(); c.ellipse(3.4, 0, 3.6, 2.1, 0, 0, 6.3); c.fill(); c.restore();
        c.fillStyle = '#3a3230'; c.fillRect(-0.7, -2.2, 1.4, 4.4);
        c.restore();
      }
      if (this.phase === 'free' && this.nearDoor) G.prompt(c, 'ESPACIO: cruzar la Puerta', this.nearDoorX - pan, groundY - 96);
      // luz de la Puerta: se disipa al llegar, crece al salir
      if (this.phase === 'light') { c.fillStyle = `rgba(255,244,214,${(1 - Math.min(1, this.phaseT)).toFixed(3)})`; c.fillRect(0, 0, 640, 360); }
      if (this.phase === 'exitdoor') { const a = Math.min(1, this.phaseT); c.fillStyle = `rgba(255,244,214,${(a * a).toFixed(3)})`; c.fillRect(0, 0, 640, 360); }
      // la banda de la carta, sobre el paseo (guion v2)
      drawCartaBand(c);
    }
    // El espantapájaros Cabeza de Nabo, DIBUJADO por código
    // (homenaje dibujado, sin usar la imagen de la película):
    // poste y travesaño, traje oscuro con los brazos en cruz,
    // moño azul, cabeza de nabo pálida con su sonrisa cosida y
    // el sombrero de copa con su cinta.
    drawNabo(c, x, baseY) {
      if (x < -70 || x > 710) return;
      c.fillStyle = 'rgba(20,40,18,0.20)';
      c.beginPath(); c.ellipse(x, baseY + 3, 20, 4, 0, 0, 6.3); c.fill();
      c.strokeStyle = '#6d4c2f'; c.lineWidth = 4;
      c.beginPath(); c.moveTo(x, baseY); c.lineTo(x, baseY - 80); c.stroke(); // el poste
      c.lineWidth = 3.4;
      c.beginPath(); c.moveTo(x - 30, baseY - 64); c.lineTo(x + 30, baseY - 64); c.stroke(); // el travesaño
      // el traje: un abrigo oscuro que se abre hacia abajo
      c.fillStyle = '#2e2a33';
      c.beginPath();
      c.moveTo(x - 7, baseY - 68); c.lineTo(x + 7, baseY - 68);
      c.lineTo(x + 15, baseY - 16); c.lineTo(x + 5, baseY - 20); c.lineTo(x, baseY - 14);
      c.lineTo(x - 5, baseY - 20); c.lineTo(x - 15, baseY - 16);
      c.closePath(); c.fill();
      // las mangas sobre el travesaño y las manitos pálidas
      c.strokeStyle = '#2e2a33'; c.lineWidth = 6;
      c.beginPath(); c.moveTo(x - 4, baseY - 64); c.lineTo(x - 29, baseY - 63); c.moveTo(x + 4, baseY - 64); c.lineTo(x + 29, baseY - 63); c.stroke();
      c.fillStyle = '#e8e2d2';
      c.beginPath(); c.arc(x - 31, baseY - 63, 3.4, 0, 6.3); c.arc(x + 31, baseY - 63, 3.4, 0, 6.3); c.fill();
      // el moño azul del cuello
      c.fillStyle = '#7a9cc6';
      c.beginPath(); c.moveTo(x, baseY - 66); c.lineTo(x - 6, baseY - 70); c.lineTo(x - 6, baseY - 62); c.closePath(); c.fill();
      c.beginPath(); c.moveTo(x, baseY - 66); c.lineTo(x + 6, baseY - 70); c.lineTo(x + 6, baseY - 62); c.closePath(); c.fill();
      // la cabeza de nabo: pálida, con la puntita y su sonrisa
      c.fillStyle = '#f0ead8';
      c.beginPath(); c.arc(x, baseY - 76, 10, 0, 6.3); c.fill();
      c.beginPath(); c.moveTo(x - 3.4, baseY - 68); c.lineTo(x + 3.4, baseY - 68); c.lineTo(x, baseY - 63); c.closePath(); c.fill();
      c.fillStyle = '#33302c';
      c.beginPath(); c.arc(x - 3.6, baseY - 78, 1.3, 0, 6.3); c.arc(x + 3.6, baseY - 78, 1.3, 0, 6.3); c.fill();
      c.strokeStyle = '#33302c'; c.lineWidth = 1.2;
      c.beginPath(); c.arc(x, baseY - 74.5, 5.4, 0.25, Math.PI - 0.25); c.stroke();
      // el sombrero de copa, con su cinta
      c.fillStyle = '#1d1a20';
      c.fillRect(x - 17, baseY - 86, 34, 3.6);
      c.fillRect(x - 10, baseY - 99, 20, 13.5);
      c.fillStyle = '#8a2f35'; c.fillRect(x - 10, baseY - 89.5, 20, 3);
    }
    // Un Calcifer de la vereda: el tronquito dibujado, el
    // resplandor cálido sobre el pasto y la llama encima,
    // parpadeando (su escala la da calciferFlick; el fogonazo
    // la infla con popT). Apagado (offT) se ve tenue y más
    // bajo. Sin el recorte solo-local, la llamita de respaldo
    // dibujada ocupa su lugar: el obstáculo nunca es invisible.
    drawCalcifer(c, cal) {
      const x = cal.x - this.pan; if (x < -170 || x > 810) return;
      const baseY = this.groundY + cal.yOff, t = this.t;
      const off = cal.offT > 0;
      const pop = cal.popT > 0 ? 1 + 0.45 * (cal.popT / 0.28) : 1;
      const s = cal.size * calciferFlick(t, cal.i) * pop * (off ? 0.8 : 1);
      if (!off) { // el resplandor cálido bajo la llama
        const gl = c.createRadialGradient(x, baseY - 3, 2, x, baseY - 3, s * 0.85);
        gl.addColorStop(0, 'rgba(255,150,50,0.20)'); gl.addColorStop(1, 'rgba(255,150,50,0)');
        c.fillStyle = gl; c.beginPath(); c.ellipse(x, baseY - 3, s * 0.85, s * 0.30, 0, 0, 6.3); c.fill();
      }
      // el tronquito: el leño acostado donde se sienta
      c.fillStyle = '#7a4a2b';
      c.beginPath();
      if (c.roundRect) c.roundRect(x - s * 0.34, baseY - 5.5, s * 0.68, 6, 3); else c.rect(x - s * 0.34, baseY - 5.5, s * 0.68, 6);
      c.fill();
      c.fillStyle = '#a9743f'; c.beginPath(); c.ellipse(x - s * 0.34, baseY - 2.5, 2.6, 3, 0, 0, 6.3); c.fill();
      c.fillStyle = '#5d3a20'; c.beginPath(); c.ellipse(x - s * 0.34, baseY - 2.5, 1.2, 1.6, 0, 0, 6.3); c.fill();
      if (imgOk(calciferImg)) {
        const w = s * calciferImg.naturalWidth / calciferImg.naturalHeight;
        c.save();
        c.globalAlpha = off ? 0.35 : 1;
        c.drawImage(calciferImg, x - w / 2, baseY - 4 - s, w, s);
        c.restore();
      } else {
        this.drawCalciferFallback(c, x, baseY - 4, s, off);
      }
    }
    // La llamita de respaldo (cuando calcifer.png no cargó):
    // gota de fuego naranja con su corazón amarillo y dos
    // ojitos — se lee como «fuego» a cualquier distancia.
    drawCalciferFallback(c, x, baseY, s, off) {
      c.save();
      c.globalAlpha = off ? 0.35 : 1;
      c.translate(x, baseY);
      c.fillStyle = '#e86a17';
      c.beginPath();
      c.moveTo(0, -s);
      c.bezierCurveTo(s * 0.34, -s * 0.62, s * 0.38, -s * 0.30, s * 0.30, -s * 0.14);
      c.quadraticCurveTo(s * 0.22, 0, 0, 0);
      c.quadraticCurveTo(-s * 0.22, 0, -s * 0.30, -s * 0.14);
      c.bezierCurveTo(-s * 0.38, -s * 0.30, -s * 0.34, -s * 0.62, 0, -s);
      c.fill();
      c.fillStyle = '#f7b731';
      c.beginPath();
      c.moveTo(0, -s * 0.62);
      c.bezierCurveTo(s * 0.20, -s * 0.38, s * 0.22, -s * 0.18, s * 0.15, -s * 0.08);
      c.quadraticCurveTo(s * 0.1, 0, 0, 0);
      c.quadraticCurveTo(-s * 0.1, 0, -s * 0.15, -s * 0.08);
      c.bezierCurveTo(-s * 0.22, -s * 0.18, -s * 0.20, -s * 0.38, 0, -s * 0.62);
      c.fill();
      c.fillStyle = '#fff6e8';
      c.beginPath(); c.arc(-s * 0.11, -s * 0.34, s * 0.075, 0, 6.3); c.arc(s * 0.11, -s * 0.34, s * 0.075, 0, 6.3); c.fill();
      c.fillStyle = '#40260e';
      c.beginPath(); c.arc(-s * 0.11, -s * 0.33, s * 0.038, 0, 6.3); c.arc(s * 0.11, -s * 0.33, s * 0.038, 0, 6.3); c.fill();
      c.restore();
    }
    // La ARBOLEDA del fondo y MONONOKE observando desde ella.
    // Fila trasera de árboles de copas verdes oscuras, el
    // recorte ESCONDIDO entre ellos (solo si cargó) con su
    // velo de distancia, y una fila frontal de copas y
    // arbustos que —junto con el suelo de la pradera, que se
    // pinta después— le tapa la mitad inferior: San y Moro
    // quedan «detrás de los arbustos», quietos, mirando el
    // paseo, y solo se los nota mirando con atención. Sin el
    // recorte, la arboleda se dibuja igual.
    drawArboleda(c, pan) {
      const AR = PRADERA.arboleda, cx = AR.layerCx - pan * AR.par, baseY = AR.baseY;
      if (cx + 300 < -20 || cx - 300 > 660) return;
      const tree = (lx, h, dark) => {
        const x = cx + lx;
        c.fillStyle = '#5d4128'; c.fillRect(x - 3, baseY - h * 0.30, 6, h * 0.30 + 4);
        c.fillStyle = dark;
        c.beginPath();
        c.ellipse(x, baseY - h * 0.62, h * 0.34, h * 0.40, 0, 0, 6.3);
        c.ellipse(x - h * 0.26, baseY - h * 0.48, h * 0.24, h * 0.28, 0, 0, 6.3);
        c.ellipse(x + h * 0.27, baseY - h * 0.50, h * 0.25, h * 0.30, 0, 0, 6.3);
        c.fill();
      };
      // la fila trasera
      tree(-205, 128, '#356b38'); tree(-128, 148, '#2f5d33'); tree(-48, 118, '#356b38');
      tree(58, 142, '#2f5d33'); tree(152, 124, '#356b38'); tree(228, 108, '#2f5d33');
      // MONONOKE escondida entre los árboles: SUTIL, como
      // pidió Jose tras su playtest — a 218 px se veía gigante
      // y dominaba el fondo. Ahora el recorte se dibuja a
      // ~120 px (escala de alguien escondido, no de monumento)
      // y corrido a la izquierda (dx), para que la cabeza y
      // los hombros de San y las orejas y el ojo de Moro
      // asomen entre las copas traseras, mientras la fila
      // frontal (que se pinta justo después) y el suelo le
      // tapan la mitad inferior — la oclusión además esconde
      // el borde inferior del recorte, que delataba el
      // rectángulo contra las copas.
      if (imgOk(mononokeImg)) {
        const mh = PRADERA.mononoke.h, mw = mh * mononokeImg.naturalWidth / mononokeImg.naturalHeight;
        const mx = cx + PRADERA.mononoke.dx - mw / 2;
        c.drawImage(mononokeImg, mx, baseY + 6 - mh, mw, mh);
        c.fillStyle = 'rgba(174,200,226,0.2)'; // el velo de la distancia
        c.fillRect(mx, baseY + 6 - mh, mw, mh);
      }
      // la fila frontal: copas más bajas y oscuras, que le
      // tapan los costados y el borde inferior al recorte
      // (la base misma la tapa el suelo de la pradera, que se
      // pinta justo después)
      tree(-238, 84, '#274d2a'); tree(20, 76, '#274d2a'); tree(238, 88, '#274d2a');
    }
    // Un árbol solitario del plano medio: tronco con una
    // rama y copa de tres copas verdes medias. Sin colisión.
    drawArbolSolo(c, x, baseY, h, seed) {
      if (x < -90 || x > 730) return;
      c.fillStyle = 'rgba(20,40,18,0.18)';
      c.beginPath(); c.ellipse(x, baseY + 3, h * 0.20, 4, 0, 0, 6.3); c.fill();
      c.fillStyle = '#6d4c2f';
      c.beginPath();
      c.moveTo(x - 4.5, baseY); c.lineTo(x - 2, baseY - h * 0.52); c.lineTo(x + 2, baseY - h * 0.52); c.lineTo(x + 4.5, baseY);
      c.closePath(); c.fill();
      c.strokeStyle = '#6d4c2f'; c.lineWidth = 3;
      c.beginPath(); c.moveTo(x, baseY - h * 0.44); c.quadraticCurveTo(x + h * 0.10, baseY - h * 0.55, x + h * 0.17, baseY - h * 0.60); c.stroke();
      const j = (hashN(seed * 3.7) - 0.5) * 8;
      c.fillStyle = '#4a7d3a';
      c.beginPath();
      c.ellipse(x + j, baseY - h * 0.80, h * 0.30, h * 0.27, 0, 0, 6.3);
      c.ellipse(x - h * 0.20 + j, baseY - h * 0.64, h * 0.21, h * 0.19, 0, 0, 6.3);
      c.ellipse(x + h * 0.21 + j, baseY - h * 0.65, h * 0.22, h * 0.20, 0, 0, 6.3);
      c.fill();
      c.fillStyle = '#548a41';
      c.beginPath(); c.ellipse(x - h * 0.06 + j, baseY - h * 0.86, h * 0.19, h * 0.15, 0, 0, 6.3); c.fill();
    }
    // El dirigible dibujado: globo alargado crema con franjas
    // rojas, aletas de cola y su góndola colgando. Pequeño y
    // lejano, estilo cuento.
    drawDirigible(c, x, y) {
      if (x < -90 || x > 730) return;
      c.fillStyle = '#efe0bd';
      c.beginPath(); c.ellipse(x, y, 30, 11.5, 0, 0, 6.3); c.fill();
      c.fillStyle = '#c65b4e';
      c.beginPath(); c.ellipse(x - 10, y, 4.5, 11.2, 0, 0, 6.3); c.fill();
      c.beginPath(); c.ellipse(x + 12, y, 4.5, 11.2, 0, 0, 6.3); c.fill();
      c.fillStyle = '#efe0bd';
      c.beginPath(); // las aletas de la cola
      c.moveTo(x - 28, y - 2); c.lineTo(x - 38, y - 10); c.lineTo(x - 36, y + 1); c.lineTo(x - 38, y + 9); c.lineTo(x - 28, y + 3);
      c.closePath(); c.fill();
      c.strokeStyle = 'rgba(90,70,50,0.7)'; c.lineWidth = 1;
      c.beginPath(); c.moveTo(x - 5, y + 10); c.lineTo(x - 4, y + 15); c.moveTo(x + 5, y + 10); c.lineTo(x + 4, y + 15); c.stroke();
      c.fillStyle = '#7a4a2b'; c.fillRect(x - 8, y + 14.5, 16, 5.5);
      c.fillStyle = '#a9743f'; c.fillRect(x - 8, y + 14.5, 16, 1.8);
    }
  }

  // =========================================================
  // ESCENA 5 — EL DEPARTAMENTO DE NOCHE, CON LA CITA
  // =========================================================
  // La última escena de la ruta: la MISMA casa 3D de la
  // apertura (su propia HomeScene), en configuración de noche
  // de cita. Se llega por la Puerta del castillo de las
  // praderas; Ximena sigue siendo la jugable (colisiones
  // reales) y Jose la acompaña por la casa. La canción/reloj
  // NO se tocan al entrar: si el reloj corre desde la plaza,
  // sigue; en esta escena no arranca nada.

  // EL TEXTO FINAL de la cita (pendiente P4 del documento
  // técnico): cierra la tarjeta de fin del cierre total,
  // bajo el «FIN». Este valor es SOLO el inicial, de
  // relleno: el texto definitivo lo escribe Jose — basta
  // cambiar esta línea por la suya. (La carta en sí vive en
  // CARTA_TEXTOS: su firma es otro texto, el de la carta.)
  const FINAL_TEXT = 'Feliz cumpleaños, mi amor';

  const FINALE = {
    // La puesta del regreso es la SALA (guion v2): la mesa
    // de centro (ctable en world.js: huella x 595–675,
    // z 108–140, tablero a y=16) y el sofá que tiene
    // enfrente (x 570–700, z 170–214; da la espalda a la
    // cámara y mira a la TV). Todo se monta como props de
    // ESTA escena, sin tocar la casa del juego principal:
    // la versión anterior (la mesa de fiesta con el
    // pastelito) quedó reemplazada por el guion v2.
    ctable: { x: 595, z: 108, w: 80, d: 32, top: 16, cx: 635, cz: 124 },
    sofa: { x: 570, z: 170, w: 130, d: 44, cx: 635, cz: 192 },
    // Los asientos quedan SOBRE los cojines del sofá (los
    // dos cojines de world.js: centros x 609 y 661, z
    // 174–202): el respaldo ocluye la mitad inferior de los
    // billboards y se lee «sentados», el mismo truco que la
    // mesa usaba antes. Ximena en el cojín oeste, Jose en
    // el este, como en los sprites de lectura en pareja.
    seatXi: { x: 609, y: 188 }, seatJose: { x: 661, y: 188 },
    // La altura del cojín donde apoya la figura sentada:
    // en la malla de world.js los cojines del sofá son las
    // cajas B(584,20,174,50,6,28) y B(636,20,174,50,6,28)
    // → su cara superior queda a y = 20+6 = 26. El respaldo
    // (B(570,20,203,130,24,11), hasta y=44, en z 203–214)
    // queda ENTRE la cámara y los asientos (z 188): con el
    // compuesto en el pase GL con profundidad, el respaldo
    // ocluye la parte baja de las figuras y se lee que
    // están sentadas DETRÁS del sofá, no sobre la mesa.
    seatY: 26,
    // Antes de «sentarse», cada uno llega caminando a su
    // punto de la franja libre entre la mesa de centro y el
    // sofá (z 140–170); de ahí el sprite compuesto de la
    // lectura toma el relevo. Al levantarse vuelven a esa
    // franja (out*): un actor CONTROLADO dentro de la
    // huella del sofá no podría salir caminando (walk()
    // frena contra el mueble en cada paso).
    preXi: { x: 609, y: 150 }, preJose: { x: 661, y: 150 },
    outXi: { x: 596, y: 152 }, outJose: { x: 674, y: 152 },
    promptR: 96, // distancia al centro del sofá para ofrecer «sentarse»
    // El escondite de Pollito: SOBRE el armario del pasillo
    // (el cuerpo del armario llega a y=98; elev 100 lo apoya
    // encima). Los roomies espían por la rendija (closetPeek,
    // como en la apertura); él, desde arriba del mueble.
    catHide: { x: 600, y: 330, elev: 100 }, catFloor: { x: 600, y: 354 },
    // El servicio de la torta: Pollito baja del armario y
    // CAMINA (su ciclo pollito-torta-walk) por zona ABIERTA
    // y VISIBLE (playtest de Jose: «ni siquiera se ve cómo
    // llega»): cruza la puerta del pasillo, baja por
    // DELANTE del sofá (la franja sur, sobre la alfombra,
    // a la vista de la pareja y de la cámara) y sube por el
    // costado oeste hasta junto a la mesa de centro, deja
    // la torta y se queda a un lado, orgulloso. Nunca pasa
    // detrás del compuesto de la pareja (su x queda siempre
    // al oeste de los asientos) ni fuera del encuadre.
    catPath: [[524, 304], [516, 238], [560, 200], [560, 146]],
    catServe: { x: 560, y: 146 }, // junto a la mesa, en el gesto de dejar la torta
    catProud: { x: 566, y: 162 }, // a un lado de la mesa, ya servida
    torta: { x: 635, z: 124 }, // la torta, sobre la mesa de centro
    spawnXi: { x: 478, y: 534 }, spawnJose: { x: 540, y: 534 },
  };
  // Luz cálida y tenue de la noche de cita: ambiente bajo y
  // puntos cálidos de vela/lámpara en los mismos sitios que
  // la luz «noche» de la casa. Objeto propio con la forma de
  // W.LIGHT: se asigna directo a la HomeScene del final
  // (lightKey 'velas'); la apertura sigue con su día intacto.
  const FINALE_LIGHT = {
    amb: [0.36, 0.28, 0.30], sun: [0.10, 0.08, 0.13], sky: '#17101f',
    points: [
      { x: 635, y: 46, z: 124, r: 215, c: [0.80, 0.52, 0.22] }, // las velas de la mesa de centro
      { x: 798, y: 66, z: 80, r: 265, c: [0.52, 0.38, 0.20] },  // la lámpara de la sala
      { x: 510, y: 48, z: 430, r: 205, c: [0.30, 0.22, 0.16] }, // el pasillo, tenue
      { x: 839, y: 42, z: 352, r: 140, c: [0.32, 0.22, 0.36] }, // el cuarto de Ximena
    ],
  };

  class FinaleScene {
    constructor() {
      this.id = 'cita';
      this.phase = 'light'; this.t = 0; this.phaseT = 0;
      this.nearDoor = false; this.nearSofa = false;
      this.cine = { st: 'idle', t: 0 };
      this.climbK = 0;
      // La torta de la sala (guion v2): la trae Pollito y
      // queda sobre la mesa de centro.
      this.tortaShown = false; this.tortaOnTable = false;
      // Cómo se dibuja a Pollito: 'actor' = el actor del
      // armario (sobre él o volviendo a él); 'walk' / 'place'
      // / 'proud' = los PNG del servicio de la torta.
      this.catVis = 'actor'; this.catWalkT = 0; this.catPath = null; this.catPathI = 0; this.catFlip = false;
      // La pareja «sentada»: el sprite compuesto de la
      // lectura sustituye a los dos actores.
      this.seatedPose = false;
      // El cierre total a pantalla completa (guion v2):
      // { step, t } o null; closeAct = la acción del jugador
      // en los pasos a su ritmo.
      this.close = null; this.closeAct = false;
      const home = (this.home = new G.Scenes.HomeScene(G.PLAYABLE.slice()));
      this.xi = home.xi; this.jose = home.jose; this.cat = home.cat;
      // --- la configuración «noche de cita»: la variante de
      // la apertura (misma casa, otro momento) ---
      home.wander = false; home.xState = 'away';
      home.lightA = FINALE_LIGHT; home.lightB = FINALE_LIGHT; home.lk = 1; home.lightKey = 'velas';
      // Los 7 roomies, dentro del armario: solo los ojitos
      // por la rendija, igual que en la apertura.
      for (const r of home.roomies) { r.x = 600; r.y = 346; r.dir = 'down'; r.hidden = true; }
      home.closetPeek = G.PLAYABLE.slice();
      W.closet.k = W.closet.target = W.CLOSET_PEEK;
      W.xDoorOpen = true;
      // Pollito espía desde SOBRE el armario (FINALE.catHide).
      const cat = this.cat;
      cat.x = FINALE.catHide.x; cat.y = FINALE.catHide.y; cat.elev = FINALE.catHide.elev;
      cat.dir = 'down'; cat.hidden = false; cat.route = null;
      // La puesta de la sala entra por el gancho de props de
      // la casa (extraBoxes): solo ESTA instancia lo usa, así
      // que ni el juego principal ni la apertura la ven.
      home.extraBoxes = (mb) => this.drawTableBoxes(mb);
      // Y sus billboards (la carta, la torta, la pareja
      // sentada, el servicio de Pollito) entran por el gancho
      // de sprites de la casa (extraSprites): se dibujan en
      // el pase GL CON profundidad, para que los muebles los
      // ocluyan como a los actores (la pareja DETRÁS del
      // respaldo del sofá). Dibujarlos en la capa 2D tras la
      // casa los dejaba «encima de todo» (playtest de Jose).
      home.extraSprites = () => this.drawFinaleSprites();
      // La pareja, junto a la puerta principal.
      const xi = this.xi;
      xi.hidden = false; xi.x = FINALE.spawnXi.x; xi.y = FINALE.spawnXi.y; xi.dir = 'up'; xi.speed = 165;
      const jo = this.jose;
      jo.hidden = false; jo.x = FINALE.spawnJose.x; jo.y = FINALE.spawnJose.y; jo.dir = 'up'; jo.speed = 175; jo.route = null;
      home.follow(xi, 560);
      home.cam.x = xi.x; home.cam.z = xi.y - 30; home.cam.dist = 560;
      this.scaleRef = this.rawProjectedHeight();
    }
    // Compensación de escala de Ximena: la misma de la
    // apertura (su altura en pantalla no debe depender de
    // dónde esté parada respecto de la cámara).
    rawProjectedHeight() {
      const vp = vpFromCam({ x: FINALE.spawnXi.x, y: 0, z: FINALE.spawnXi.y - 30, dist: 560, pitch: 0.8 });
      const a = projectWithCam(vp, this.xi.x, 0, this.xi.y), b = projectWithCam(vp, this.xi.x, 122, this.xi.y);
      return Math.abs(a.y - b.y);
    }
    projectedHeight() {
      const vp = vpFromCam(this.home.cam);
      const a = projectWithCam(vp, this.xi.x, 0, this.xi.y), b = projectWithCam(vp, this.xi.x, 122 * (this.xi.scale || 1), this.xi.y);
      return Math.abs(a.y - b.y);
    }
    compensateScale() {
      if (!this.scaleRef) return;
      const raw = this.projectedHeight() / (this.xi.scale || 1);
      if (raw > 0) this.xi.scale = Math.max(0.8, Math.min(1.25, this.scaleRef / raw));
    }
    // Entrada desde las praderas (por la Puerta del castillo):
    // fundido de luz cálida (~1 s) y la pareja aparece junto
    // a la puerta principal de la casa.
    enterFinale() {
      this.phase = 'light'; this.phaseT = 0;
      const xi = this.xi, jo = this.jose, cat = this.cat, home = this.home;
      xi.hidden = false; xi.x = FINALE.spawnXi.x; xi.y = FINALE.spawnXi.y; xi.dir = 'up';
      xi.vx = xi.vy = 0; xi.route = null; xi.expr = null; xi.speed = 165;
      jo.hidden = false; jo.x = FINALE.spawnJose.x; jo.y = FINALE.spawnJose.y; jo.dir = 'up';
      jo.vx = jo.vy = 0; jo.route = null; jo.expr = null;
      // Pollito vuelve a su escondite: si una visita anterior
      // lo dejó sirviendo junto a la mesa, espía de nuevo.
      cat.hidden = false; cat.x = FINALE.catHide.x; cat.y = FINALE.catHide.y; cat.elev = FINALE.catHide.elev;
      cat.route = null; cat.dir = 'down'; cat.moving = false;
      this.climbK = 0;
      // Si la torta ya se sirvió en una visita anterior, la
      // mesa queda como quedó (la cinemática, repetible);
      // Pollito, en cambio, está de vuelta en su escondite
      // del armario, espiando como al principio — tras
      // servirla SE FUE (estado 'exit' de la cinemática), no
      // se queda orgulloso junto a la mesa para siempre.
      this.catVis = 'actor';
      this.seatedPose = false; this.close = null; this.closeAct = false;
      this.cine = { st: this.tortaShown ? 'done' : 'idle', t: 0 };
      W.closet.k = W.closet.target = W.CLOSET_PEEK;
      W.xDoorOpen = true;
      home.follow(xi, 560);
      home.cam.x = xi.x; home.cam.z = xi.y - 30; home.cam.dist = 560;
      this.nearDoor = false; this.nearSofa = false;
    }
    // Salida SOLO PARA REVISIÓN: en la secuencia esta escena
    // es el final del easter egg; en modo libre, la puerta
    // principal devuelve a las praderas, junto a la Puerta
    // del castillo. La salida por pausa no se toca.
    beginExit() {
      if (this.phase !== 'home') return;
      this.phase = 'exitlight'; this.phaseT = 0; D.tap = false;
      playDoorClose(); // la Puerta se cierra tras la pareja (grabación real)
    }
    update(dt) {
      this.t += dt;
      const home = this.home;
      if (this.phase === 'light') {
        this.phaseT += dt;
        home.update(dt);
        if (this.phaseT >= 1) { this.phase = 'home'; this.phaseT = 0; }
        return;
      }
      if (this.phase === 'exitlight') {
        this.phaseT += dt;
        home.update(dt);
        if (this.phaseT >= 1) travelTo('castillo', 'finale');
        return;
      }
      // fase 'home': la casa en modo libre o en cinemática
      const cineOn = this.cine.st !== 'idle' && this.cine.st !== 'done';
      const act = G.input.hit('action') || D.tap;
      if (!cineOn) {
        const ax = G.input.axis();
        const ix = ax.x + (D.touch ? D.touch.x : 0), iy = ax.y + (D.touch ? D.touch.y : 0);
        this.xi.walk(ix, iy, 165, dt);
        this.updateCompanion();
      } else {
        this.xi.vx = this.xi.vy = 0; this.xi.moving = false;
      }
      this.updateCine(dt);
      home.update(dt);
      this.compensateScale();
      this.nearSofa = !cineOn && Math.hypot(this.xi.x - FINALE.sofa.cx, this.xi.y - FINALE.sofa.cz) < FINALE.promptR;
      this.nearDoor = Math.hypot(this.xi.x - MAIN_DOOR.x, this.xi.y - MAIN_DOOR.y) < 52;
      if (act) {
        if (cineOn) {
          // En el cierre total la acción NO salta: avanza la
          // carta y la foto a ritmo del jugador.
          if (this.cine.st === 'closing') this.closeAct = true;
          else if (this.cine.t > 0.4) this.skipCine();
        }
        else if (this.nearSofa) this.startCine();
        else if (this.nearDoor) this.beginExit();
      }
      D.tap = false;
    }
    // Jose acompaña a Ximena por la casa (en la apertura no
    // hacía falta: él esperaba en la plaza). La sigue con
    // rutas del mundo cuando se aleja y, cerca y quieto, la
    // mira. Mismo patrón que los partners del juego.
    updateCompanion() {
      const jo = this.jose, xi = this.xi;
      const d = Math.hypot(jo.x - xi.x, jo.y - xi.y);
      if (jo.arrived) {
        if (d > 54) jo.goTo(xi.x, xi.y, 175);
        else {
          const dx = xi.x - jo.x, dy = xi.y - jo.y;
          jo.dir = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up');
        }
      } else if (d < 26) { jo.route = null; jo.moving = false; jo.vx = jo.vy = 0; }
    }
    // ---------- la cinemática de cierre ----------
    // Estados (guion v2): seats → reading → gaze → descend
    // → walk → place → proud → exit → emotion → closing →
    // rise → done. (El 'exit' es del playtest de Jose: tras
    // dejar la torta y su beat de orgullo, Pollito se va —
    // camina de vuelta al armario y se oculta en su
    // escondite; no se queda plantado junto a la mesa.)
    // Saltable con la acción en cualquier estado salvo
    // 'closing' (skipCine deja la escena en su estado
    // posterior); en 'closing' la acción avanza la carta y
    // la foto a ritmo del jugador.
    startCine() {
      // (Re)arranca: la torta sale de la mesa (Pollito la
      // traerá de nuevo caminando) y la pareja va a sentarse
      // al sofá. Así la cinemática se puede repetir.
      this.cine = { st: 'seats', t: 0, placed: false };
      this.climbK = 0;
      this.tortaOnTable = false; this.tortaShown = false;
      this.seatedPose = false; this.close = null; this.closeAct = false;
      this.xi.expr = null; this.jose.expr = null;
      if (this.catVis === 'proud') { this.cat.hidden = false; this.catVis = 'actor'; }
      this.sofaRoute(this.xi, FINALE.preXi);
      this.sofaRoute(this.jose, FINALE.preJose);
    }
    sofaRoute(a, pre) {
      // La ruta sale de World.path (puertas entre cuartos,
      // como los partners). Los puntos previos están en la
      // franja libre al norte del sofá (world.js deja z
      // 140–170 sin muebles entre la mesa de centro y el
      // sofá), así que no hace falta rodeo de mueble: de ahí
      // el sprite compuesto toma el relevo de «sentados».
      a.route = W.path(a.x, a.y, pre.x, pre.y);
      a.speed = 132;
    }
    nextCine(st) { this.cine.st = st; this.cine.t = 0; }
    catIsHome() {
      const c = this.cat;
      return c.elev > 90 && Math.abs(c.x - FINALE.catHide.x) < 4 && Math.abs(c.y - FINALE.catHide.y) < 4;
    }
    // Devuelve a Pollito a su escondite (para repetir la
    // cinemática): camina al pie del armario y trepa.
    catHome(dt) {
      const c = this.cat;
      if (this.catIsHome()) return;
      if (c.elev > 1) { c.x = FINALE.catHide.x; c.y = FINALE.catHide.y; c.route = null; return; }
      if (c.arrived) {
        if (Math.hypot(c.x - FINALE.catFloor.x, c.y - FINALE.catFloor.y) > 6) { c.goTo(FINALE.catFloor.x, FINALE.catFloor.y, 140); return; }
        this.climbK = Math.min(1, this.climbK + dt / 0.8);
        const e = this.climbK * this.climbK;
        c.x = FINALE.catHide.x;
        c.y = FINALE.catFloor.y + (FINALE.catHide.y - FINALE.catFloor.y) * e;
        c.elev = FINALE.catHide.elev * e;
        if (this.climbK >= 1) { this.climbK = 0; c.elev = FINALE.catHide.elev; c.y = FINALE.catHide.y; }
      }
    }
    updateCine(dt) {
      const C = this.cine;
      if (C.st === 'idle' || C.st === 'done') return;
      C.t += dt;
      const xi = this.xi, jo = this.jose, cat = this.cat;
      switch (C.st) {
        case 'seats': {
          // La pareja camina a la franja frente al sofá y
          // Pollito vuelve a su escondite, si estaba sirviendo.
          this.catHome(dt);
          const atSofa = Math.hypot(xi.x - FINALE.preXi.x, xi.y - FINALE.preXi.y) < 4 &&
            Math.hypot(jo.x - FINALE.preJose.x, jo.y - FINALE.preJose.y) < 4;
          if ((atSofa && this.catIsHome()) || C.t > 9) {
            if (!this.catIsHome()) { cat.x = FINALE.catHide.x; cat.y = FINALE.catHide.y; cat.elev = FINALE.catHide.elev; cat.route = null; }
            // «Se sientan»: los actores dejan el paso al
            // sprite compuesto de la lectura en pareja.
            xi.x = FINALE.seatXi.x; xi.y = FINALE.seatXi.y; xi.route = null;
            jo.x = FINALE.seatJose.x; jo.y = FINALE.seatJose.y; jo.route = null;
            xi.moving = jo.moving = false; xi.vx = xi.vy = jo.vx = jo.vy = 0;
            xi.hidden = jo.hidden = true;
            this.seatedPose = true;
            this.nextCine('reading');
          }
          break;
        }
        case 'reading': {
          // Terminan de leer la carta, en pareja: el panel
          // con el cierre y la firma dura lo que manda la
          // regla de lectura (cierre + firma + un respiro).
          if (C.t > cartaReadTime(CARTA_TEXTOS.cierre) + cartaReadTime(CARTA_TEXTOS.firma) + 1.2) this.nextCine('gaze');
          break;
        }
        case 'gaze': {
          // Se miran sonriendo (el compuesto lectura-pareja-3,
          // ~2 s). Al salir, la campanita anuncia el servicio.
          if (C.t > 2.0) { G.sfx('bell'); this.nextCine('descend'); }
          break;
        }
        case 'descend': {
          // Pollito baja del armario SIN bandeja esta vez: la
          // torta la trae caminando, con su ciclo de sprites.
          const k = Math.min(1, C.t / 0.9), e = 1 - (1 - k) * (1 - k);
          cat.x = FINALE.catHide.x;
          cat.y = FINALE.catHide.y + (FINALE.catFloor.y - FINALE.catHide.y) * e;
          cat.elev = FINALE.catHide.elev * (1 - e);
          cat.dir = 'down';
          if (k >= 1) {
            cat.elev = 0; cat.y = FINALE.catFloor.y;
            cat.hidden = true; // desde aquí lo dibuja su ciclo de caminata
            this.catVis = 'walk'; this.catWalkT = 0;
            this.catPath = FINALE.catPath.map((p) => p.slice());
            this.catPathI = 0; this.catFlip = false;
            this.nextCine('walk');
          }
          break;
        }
        case 'walk': {
          // Pollito CAMINA hasta la mesa de centro con la
          // torta: movimiento manual por sus puntos de paso
          // (el corredor oeste del sofá, sin cruzar muebles),
          // los frames del ciclo rotando a cadencia de
          // caminata en draw(), espejado solo si el paso va
          // hacia la izquierda (es tres cuartos: la
          // convención de los caminantes del proyecto).
          this.catWalkT += dt;
          const target = this.catPath && this.catPath[this.catPathI];
          if (!target) { this.nextCine('place'); break; }
          const dx = target[0] - cat.x, dy = target[1] - cat.y;
          const d = Math.hypot(dx, dy);
          if (d < 3) {
            cat.x = target[0]; cat.y = target[1];
            this.catPathI++;
            if (this.catPathI >= this.catPath.length) this.nextCine('place');
          } else {
            const step = Math.min(d, 128 * dt);
            cat.x += dx / d * step; cat.y += dy / d * step;
            if (Math.abs(dx) > 6) this.catFlip = dx < 0;
          }
          break;
        }
        case 'place': {
          // El gesto de dejar la torta (pollito-deja-torta):
          // a mitad, la torta aparece sobre la mesa de
          // centro y Pollito pasa a su pose de orgullo.
          // NOTA: la vela de la torta queda ENCENDIDA y sin
          // interacción — el soplido es una decisión
          // pendiente de Jose; si se aprueba, se engancha en
          // este punto o en el estado 'proud'.
          if (C.t >= 0.1 && this.catVis !== 'place') this.catVis = 'place';
          if (!C.placed && C.t >= 0.55) {
            C.placed = true;
            this.tortaOnTable = true; this.tortaShown = true;
            W.puff(FINALE.torta.x, FINALE.torta.z, 4, true);
          }
          if (C.t >= 0.75 && this.catVis === 'place') {
            this.catVis = 'proud';
            cat.x = FINALE.catProud.x; cat.y = FINALE.catProud.y;
            xi.expr = 'happy'; jo.expr = 'happy';
            G.sfx('pop');
          }
          if (C.t > 1.1) this.nextCine('proud');
          break;
        }
        case 'proud': {
          if (C.t > 1.0) {
            // Cumplido su beat de orgullo, Pollito SE VA: el
            // actor retoma el cuerpo (sin bandeja: vuelve con
            // su caminata definida) rumbo a su escondite.
            this.catVis = 'actor';
            cat.hidden = false; cat.elev = 0; cat.route = null;
            cat.x = FINALE.catProud.x; cat.y = FINALE.catProud.y; cat.dir = 'down';
            this.climbK = 0;
            this.nextCine('exit');
          }
          break;
        }
        case 'exit': {
          // Pollito vuelve al armario: camina al pie del
          // mueble y trepa (el mismo catHome de 'seats').
          // Al llegar queda en su escondite, espiando, y la
          // cinemática sigue con la emoción de la pareja.
          this.catHome(dt);
          if (this.catIsHome()) this.nextCine('emotion');
          else if (C.t > 14) { // red de seguridad: la cinemática nunca se atasca por él
            cat.x = FINALE.catHide.x; cat.y = FINALE.catHide.y; cat.elev = FINALE.catHide.elev; cat.route = null;
            this.nextCine('emotion');
          }
          break;
        }
        case 'emotion': {
          // La pareja, ya con la torta en la mesa, se mira
          // un momento más (el compuesto de la mirada).
          if (C.t > 1.4) this.startClosing();
          break;
        }
        case 'closing': this.updateClosing(dt); break;
        case 'rise': {
          if (xi.arrived && jo.arrived) {
            xi.expr = null; jo.expr = null;
            xi.dir = 'down'; jo.dir = 'up';
            this.cine = { st: 'done', t: 0, placed: true };
          }
          break;
        }
      }
    }
    beginRise() {
      // Se levantan: el compuesto se retira y los actores
      // reaparecen en sus asientos, con rutas a la franja
      // libre; el control vuelve al llegar, ya fuera del
      // sofá.
      this.seatedPose = false;
      this.xi.hidden = false; this.jose.hidden = false;
      this.xi.x = FINALE.seatXi.x; this.xi.y = FINALE.seatXi.y;
      this.jose.x = FINALE.seatJose.x; this.jose.y = FINALE.seatJose.y;
      this.xi.route = [[FINALE.outXi.x, FINALE.outXi.y]]; this.xi.speed = 132;
      this.jose.route = [[FINALE.outJose.x, FINALE.outJose.y]]; this.jose.speed = 132;
      this.nextCine('rise');
    }
    // ---------- el cierre total (guion v2) ----------
    // Tras la cinemática y ANTES de devolver el control: la
    // carta completa a pantalla completa (el papel de
    // carta-final.png con el texto renderizado encima, ver
    // drawClosing) y luego EL ÁLBUM (idea de Jose): las
    // fotos del recorrido se colocan una encima de otra
    // como una pila de fotos impresas, la del sofá queda
    // arriba y se expande a pantalla completa — la imagen
    // que más tiempo se queda —. Cada fase se salta si su
    // imagen no cargó (el precedente del castillo).
    startClosing() {
      this.close = { step: 'cartaIn', t: 0, pile: null, pileIdx: 0 };
      this.closeAct = false;
      this.nextCine('closing');
      this.advanceClosing(); // salta de entrada las fases sin imagen
    }
    advanceClosing() {
      const cl = this.close; if (!cl) return;
      cl.t = 0;
      if (cl.step === 'cartaIn' && !imgOk(cartaFinalImg)) this.enterAlbum();
    }
    // El álbum arranca tras la carta: la pila son las
    // fotos que SÍ cargaron, en el orden del recorrido
    // (la del sofá, si cargó, siempre es la última: es la
    // condición del álbum — sin ella se va directo a la
    // tarjeta de fin, como antes de que existiera).
    enterAlbum() {
      const cl = this.close; if (!cl) return;
      cl.t = 0;
      if (!imgOk(fotoParejaImg)) { cl.step = 'fin'; cl.pile = null; return; }
      cl.pile = CLOSE_PHOTOS.filter((p) => imgOk(p.img));
      cl.pileIdx = 0;
      cl.step = 'album';
    }
    updateClosing(dt) {
      const cl = this.close;
      if (!cl) { this.beginRise(); return; }
      cl.t += dt;
      const act = this.closeAct; this.closeAct = false;
      switch (cl.step) {
        case 'cartaIn': if (cl.t >= 0.8) { cl.step = 'carta'; cl.t = 0; } break;
        case 'carta':
          // A ritmo del jugador: se queda hasta ESPACIO/clic.
          if (act) this.enterAlbum();
          break;
        case 'album': {
          // Cada foto entra (ALBUM_ENTER_T), se contempla
          // asentada un mínimo (ALBUM_HOLD_MIN) antes de
          // que ESPACIO pueda traer la siguiente, y si el
          // jugador no pulsa, la siguiente entra sola
          // (ALBUM_HOLD_AUTO). La ÚLTIMA (la del sofá) no
          // se avanza a mano: tras su beat se expande.
          const last = cl.pileIdx >= cl.pile.length - 1;
          if (last) {
            if (cl.t >= ALBUM_ENTER_T + ALBUM_SOFA_BEAT) { cl.step = 'expand'; cl.t = 0; }
          } else if (cl.t >= ALBUM_ENTER_T + ALBUM_HOLD_AUTO ||
            (act && cl.t >= ALBUM_ENTER_T + ALBUM_HOLD_MIN)) {
            cl.pileIdx++; cl.t = 0;
          }
          break;
        }
        case 'expand': if (cl.t >= ALBUM_EXPAND_T) { cl.step = 'foto'; cl.t = 0; } break;
        case 'foto':
          // Permanencia mínima breve; luego avanza el jugador.
          if (cl.t >= 2.5 && act) { cl.step = 'fin'; cl.t = 0; }
          break;
        case 'fin':
          if (cl.t >= 2.4) {
            D.completed = true; // la cita queda completada (y rejugable)
            this.close = null;
            this.beginRise();
          }
          break;
      }
    }
    skipCine() {
      // Salto de la cinemática (acción/ESPACIO, como las
      // demás del juego): la escena queda en su estado
      // posterior — la torta en la mesa, la pareja de pie,
      // el cierre ya presentado (la cita cuenta como
      // completada) y Pollito YA DE VUELTA en su escondite
      // del armario: el mismo estado final al que llega la
      // cinemática completa por su estado 'exit'.
      if (this.cine.st === 'rise') {
        this.xi.x = FINALE.outXi.x; this.xi.y = FINALE.outXi.y; this.xi.route = null;
        this.jose.x = FINALE.outJose.x; this.jose.y = FINALE.outJose.y; this.jose.route = null;
        this.xi.expr = null; this.jose.expr = null;
        this.seatedPose = false; this.xi.hidden = false; this.jose.hidden = false;
        this.cine = { st: 'done', t: 0, placed: true };
        return;
      }
      this.tortaShown = true; this.tortaOnTable = true;
      this.close = null; this.closeAct = false;
      D.completed = true;
      const cat = this.cat;
      cat.route = null; cat.moving = false;
      cat.hidden = false; // el actor, espiando desde el armario
      cat.x = FINALE.catHide.x; cat.y = FINALE.catHide.y; cat.elev = FINALE.catHide.elev; cat.dir = 'down';
      this.catVis = 'actor';
      this.climbK = 0;
      this.xi.expr = null; this.jose.expr = null;
      this.beginRise();
    }
    // ---------- la puesta de la sala (props 3D) ----------
    // Corre en el pase de props de la casa (extraBoxes) SOLO
    // en esta escena: los dos candelabros de la mesa de
    // centro, con su llama parpadeante (candleGlow) y `emit`
    // para brillar en la noche de velas. El resto de la
    // puesta (la carta, la torta, la pareja sentada, el
    // servicio de Pollito) son los PNG del guion v2 y se
    // dibujan como billboards GL en drawFinaleSprites (el
    // pase con profundidad: su estilo de recorte se conserva
    // y los muebles los ocluyen como a los actores). (La
    // puesta anterior — la mesa de fiesta con el pastelito
    // y la campana — quedó retirada por el guion v2.)
    drawTableBoxes(mb) {
      const T = FINALE.ctable, surfY = T.top + 2.5, t = this.t;
      [612, 658].forEach((cx, i) => {
        mb.cyl(cx, surfY, T.cz, 3.2, 1.2, '#8a6f3c', { top: '#a8874c' });
        mb.cyl(cx, surfY + 1.2, T.cz, 1.4, 6.5, '#e7dcc2', { top: '#f4ecd8' });
        const fh = 2.4 + candleGlow(t, i * 3 + 1) * 1.8;
        mb.box(cx - 1, surfY + 7.7, T.cz - 1, 2, fh, 2, '#ffab3d', { emit: true });
        mb.box(cx - 0.5, surfY + 8.1, T.cz - 0.5, 1, fh * 0.6, 1, '#ffe9a8', { emit: true });
      });
    }
    // Los billboards de la puesta, en el pase GL de la casa
    // (gancho extraSprites de ESTA HomeScene): con prueba de
    // profundidad, como los actores. Aquí van la carta y la
    // torta sobre la mesa, la pareja sentada y el servicio
    // de Pollito — todo lo que antes se dibujaba en la capa
    // 2D posterior y por eso salía «encima de todo»: la
    // pareja enorme SOBRE la mesa y Pollito gigante delante
    // de los muebles (playtest de Jose, 2026-11-22).
    drawFinaleSprites() {
      const R = G.R;
      // la carta ya leída, sobre la mesa de centro (si la
      // torta ya está puesta, se corre a un lado)
      spriteHomeImg(cartaSobreImg, this.tortaOnTable ? 604 : FINALE.torta.x, FINALE.ctable.top, FINALE.torta.z, 14, false);
      // la torta: la pieza central de la mesa
      if (this.tortaOnTable) spriteHomeImg(tortaMesaImg, FINALE.torta.x, FINALE.ctable.top, FINALE.torta.z, 30, false);
      // la pareja sentada: el compuesto de la lectura,
      // ANCLADO EN LOS ASIENTOS (el plano de los actores
      // ocultos, z = seatXi.y) y apoyado en los cojines
      // (seatY, menos el margen del lienzo bajo la figura):
      // el respaldo del sofá (z 203–214, hasta y=44) queda
      // entre la cámara y el compuesto y ocluye su parte
      // baja — se les ve la cabeza, los hombros y la carta
      // sobre el respaldo, como dos personas sentadas
      // DETRÁS del mueble. En 'reading' alterna los dos
      // frames de pasar la hoja; en la mirada, el orgullo y
      // la emoción, el frame de mirarse.
      if (this.seatedPose) {
        const img = this.cine.st === 'reading'
          ? (Math.floor(this.cine.t / 1.5) % 2 === 0 ? lecturaParejaImg : lecturaPareja2Img)
          : lecturaPareja3Img;
        const h = parejaWorldH(this.xi.scale);
        spriteHomeImg(img, FINALE.sofa.cx, FINALE.seatY - PAREJA_BASE_FRAC * h, FINALE.seatXi.y, h, false);
      }
      // Pollito en su servicio (el actor del armario se
      // dibuja solo; estos son sus PNG), dimensionados por
      // SU proporción (pollitoWorldH: su figura = la de su
      // actor definido, ≈22,7 u; antes iban a 76/62 u de
      // lienzo, ~3× su tamaño), con el margen bajo sus
      // patas descontado para que apoyen en el suelo.
      if (this.catVis === 'walk' || this.catVis === 'place' || this.catVis === 'proud') {
        if (R && typeof R.shadow === 'function') R.shadow(this.cat.x, this.cat.y, 13, 0.7);
        if (this.catVis === 'walk') {
          const i = Math.floor(this.catWalkT / 0.13) % 4;
          const h = pollitoWorldH(POLLITO_FRAC.walk[i]);
          spriteHomeImg(pollitoWalkImgs[i], this.cat.x, -POLLITO_BOT.walk * h, this.cat.y, h, this.catFlip);
        } else if (this.catVis === 'place') {
          const h = pollitoWorldH(POLLITO_FRAC.deja);
          spriteHomeImg(pollitoDejaImg, this.cat.x, -POLLITO_BOT.deja * h, this.cat.y, h, this.catFlip);
        } else {
          const h = pollitoWorldH(POLLITO_FRAC.orgulloso);
          spriteHomeImg(pollitoOrgullosoImg, this.cat.x, -POLLITO_BOT.orgulloso * h, this.cat.y, h, false);
        }
      }
    }
    draw(dt) {
      this.home.draw(dt);
      const c = G.ovCtx; if (!c) return;
      c.setTransform(2, 0, 0, 2, 0, 0);
      // el fundido de luz cálida de la entrada (y de la salida)
      if (this.phase === 'light' || this.phase === 'exitlight') {
        const k = this.phase === 'light' ? 1 - this.phaseT : this.phaseT;
        if (k > 0) { c.fillStyle = `rgba(255,238,196,${(k * k * 0.85).toFixed(3)})`; c.fillRect(0, 0, 640, 360); }
        return;
      }
      if (this.phase !== 'home') return;
      const cineOn = this.cine.st !== 'idle' && this.cine.st !== 'done';
      // --- la puesta de la sala (los PNG del guion v2) ---
      // Ya NO se dibujan aquí: van en el pase GL con
      // profundidad de la casa (drawFinaleSprites, por el
      // gancho extraSprites), para que los muebles los
      // ocluyan como a los actores. En esta capa 2D solo
      // quedan el panel de la lectura, los avisos y el
      // cierre total (pantalla completa).
      // el panel de la lectura en pareja: el cierre de la
      // carta y, al pie, la firma
      if (this.cine.st === 'reading') {
        drawCartaPanel(c, CARTA_TEXTOS.cierre, Math.min(1, this.cine.t * 2), CARTA_TEXTOS.firma, null);
      }
      if (!cineOn && this.nearSofa) { const p = this.xi.head(44); G.prompt(c, 'ESPACIO: sentarse', p.x, p.y); }
      else if (!cineOn && this.nearDoor) { const p = this.xi.head(46); G.prompt(c, 'ESPACIO: salir a las praderas', p.x, p.y); }
      // el cierre total, a pantalla completa, sobre todo
      if (this.close) this.drawClosing(c);
    }
    // El cierre total a pantalla completa: la carta con su
    // texto COMPLETO renderizado encima (compuesto desde
    // CARTA_TEXTOS, en la zona limpia central del papel:
    // corregir el texto no rehace el arte), el ÁLBUM de
    // fotos impresas que se apilan (las del recorrido y,
    // arriba, la del sofá, que se expande a pantalla
    // completa) y la tarjeta de fin. Sin emojis: es el
    // cierre del regalo.
    drawClosing(c) {
      const cl = this.close;
      const fade = (t, dur) => Math.max(0, Math.min(1, t / dur));
      if (cl.step === 'cartaIn' || cl.step === 'carta') {
        const a = cl.step === 'carta' ? 1 : fade(cl.t, 0.8);
        if (imgOk(cartaFinalImg)) {
          c.save(); c.globalAlpha = a;
          c.drawImage(cartaFinalImg, 0, 0, 640, 360);
          c.restore();
        } else { c.fillStyle = '#17101f'; c.fillRect(0, 0, 640, 360); }
        if (cl.step === 'carta') {
          const paras = [CARTA_TEXTOS.apertura, CARTA_TEXTOS.plaza, CARTA_TEXTOS.sanangel,
            CARTA_TEXTOS.aero, CARTA_TEXTOS.castillo, CARTA_TEXTOS.cierre];
          const lines = [];
          for (const p of paras) { lines.push(...wrapCartaText(c, p, 10.5, 292)); lines.push(''); }
          lines.pop();
          let y = 74;
          for (const l of lines) {
            if (l) G.text(c, l, 320, y, { size: 10.5, bold: false, color: '#4a3423', stroke: false });
            y += 13.5;
          }
          G.text(c, CARTA_TEXTOS.firma, 470, y + 2, { size: 11, color: '#7a4a2b', align: 'right', stroke: false });
          G.text(c, 'ESPACIO: seguir', 320, 344, { size: 9, bold: false, color: '#8a6f4d', stroke: false });
        }
        return;
      }
      // Una foto impresa de la pila: marco blanco (más
      // ancho abajo, como las instantáneas) y sombra
      // suave, rotada en su pose. (cx, cy) es el centro
      // de la imagen y padK regula el marco (1 = marco
      // completo; 0 = sin marco, la imagen a pelo).
      const drawPrint = (img, cx, cy, w, h, rotDeg, alpha, padK) => {
        c.save();
        c.globalAlpha = alpha;
        c.translate(cx, cy);
        c.rotate(rotDeg * Math.PI / 180);
        if (padK > 0) {
          const padS = 10 * padK, padB = 28 * padK;
          c.shadowColor = 'rgba(0,0,0,0.5)'; c.shadowBlur = 16; c.shadowOffsetY = 6;
          c.fillStyle = '#f8f2e4';
          c.fillRect(-w / 2 - padS, -h / 2 - padS, w + padS * 2, h + padS + padB);
          c.shadowColor = 'transparent'; c.shadowBlur = 0; c.shadowOffsetY = 0;
        }
        c.drawImage(img, -w / 2, -h / 2, w, h);
        c.restore();
      };
      if (cl.step === 'album') {
        // La pila sobre el fondo cálido oscuro: las ya
        // colocadas, quietas en su pose, y la de arriba
        // cayendo desde arriba con rotación de más,
        // asentándose con ease-out.
        c.fillStyle = '#17101f'; c.fillRect(0, 0, 640, 360);
        const pile = cl.pile || [];
        for (let i = 0; i <= cl.pileIdx && i < pile.length; i++) {
          const pose = albumPose(i);
          if (i < cl.pileIdx) {
            drawPrint(pile[i].img, 320 + pose.dx, 180 + pose.dy, ALBUM_PHOTO_W, ALBUM_PHOTO_H, pose.rot, 1, 1);
          } else {
            const k = Math.min(1, cl.t / ALBUM_ENTER_T);
            const e = 1 - (1 - k) * (1 - k);
            drawPrint(pile[i].img, 320 + pose.dx, 180 + pose.dy + (1 - e) * -330,
              ALBUM_PHOTO_W, ALBUM_PHOTO_H, pose.rot + (1 - e) * 9, Math.min(1, k * 2), 1);
          }
        }
        if (cl.pileIdx < pile.length - 1 && cl.t >= ALBUM_ENTER_T + ALBUM_HOLD_MIN) {
          G.text(c, 'ESPACIO: seguir', 320, 344, { size: 9, bold: false, color: 'rgba(255,240,214,0.75)', stroke: false });
        }
        return;
      }
      if (cl.step === 'expand') {
        // La foto del sofá crece hasta cubrir el cuadro:
        // su centro y su tamaño se interpolan a pantalla
        // completa, la rotación se endereza y el marco se
        // desvanece (padK → 0); las de abajo se apagan.
        // Al llegar a 1, el dibujo ES el de 'foto'.
        c.fillStyle = '#17101f'; c.fillRect(0, 0, 640, 360);
        const pile = cl.pile || [];
        const top = pile.length - 1;
        const k = Math.min(1, cl.t / ALBUM_EXPAND_T);
        const e = k * k * (3 - 2 * k);
        for (let i = 0; i < top; i++) {
          const pose = albumPose(i);
          drawPrint(pile[i].img, 320 + pose.dx, 180 + pose.dy, ALBUM_PHOTO_W, ALBUM_PHOTO_H, pose.rot, 1 - e, 1);
        }
        if (top >= 0) {
          const pose = albumPose(top);
          drawPrint(pile[top].img,
            320 + pose.dx * (1 - e), 180 + pose.dy * (1 - e),
            ALBUM_PHOTO_W + (640 - ALBUM_PHOTO_W) * e, ALBUM_PHOTO_H + (360 - ALBUM_PHOTO_H) * e,
            pose.rot * (1 - e), 1, 1 - e);
        }
        return;
      }
      if (cl.step === 'foto') {
        c.fillStyle = '#0d0912'; c.fillRect(0, 0, 640, 360);
        if (imgOk(fotoParejaImg)) {
          c.drawImage(fotoParejaImg, 0, 0, 640, 360);
        }
        if (cl.t >= 2.5) {
          G.text(c, 'ESPACIO: seguir', 320, 344, { size: 9, bold: false, color: 'rgba(255,240,214,0.75)', stroke: false });
        }
        return;
      }
      // 'fin': la tarjeta de fin, sencilla
      const a = fade(cl.t, 0.8);
      c.fillStyle = '#0d0912'; c.fillRect(0, 0, 640, 360);
      c.save(); c.globalAlpha = a;
      G.text(c, 'FIN', 320, 168, { size: 30, color: '#ffe9c4' });
      G.text(c, FINAL_TEXT, 320, 198, { size: 13, color: '#d8c49a', stroke: false });
      c.restore();
    }
  }

  // Viajes entre escenas por la Puerta (la cadena del paseo:
  // plaza ⇄ San Ángel ⇄ aeropuerto ⇄ praderas ⇄ el
  // departamento final). NO tocan el
  // reloj ni la canción: si el audio ya terminó, las escenas
  // siguen en silencio (nada de play() forzado). `at` distingue
  // la llegada: a San Ángel, 'plaza' = por su Puerta de entrada
  // (desde la plaza) y 'tree' = junto a su Puerta del árbol
  // (desde el aeropuerto); al aeropuerto, 'pradera' = junto a
  // su Puerta de salida (la vuelta desde las praderas) y sin
  // `at` = por su Puerta de entrada (desde San Ángel).
  function travelTo(dest, at) {
    if (dest === 'sanangel') {
      if (!D.angelScene) D.angelScene = new SanAngelScene();
      D.scene = D.angelScene;
      if (at === 'tree') D.angelScene.enterFromAero();
      else D.angelScene.enterFromPlaza();
      D.state = 'sanangel';
      G.setScene(D.scene);
    } else if (dest === 'aero') {
      if (!D.aeroScene) D.aeroScene = new AeroScene();
      D.scene = D.aeroScene;
      if (at === 'pradera') D.aeroScene.enterFromPradera();
      else D.aeroScene.enterFromSanAngel();
      D.state = 'aero';
      G.setScene(D.scene);
    } else if (dest === 'castillo') {
      if (!D.praderaScene) D.praderaScene = new PraderaScene();
      D.scene = D.praderaScene;
      if (at === 'finale') D.praderaScene.enterFromFinale();
      else D.praderaScene.enterFromAero();
      D.state = 'castillo';
      G.setScene(D.scene);
    } else if (dest === 'cita') {
      // La escena 5: el departamento de noche, con la cita.
      // Se entra por la Puerta del castillo de las praderas.
      if (!D.finaleScene) D.finaleScene = new FinaleScene();
      D.scene = D.finaleScene;
      D.finaleScene.enterFinale();
      D.state = 'cita';
      G.setScene(D.scene);
    } else {
      D.scene = D.plazaScene;
      if (D.plazaScene) D.plazaScene.enterFromAngel();
      D.state = 'plaza-arrived';
      G.setScene(D.scene);
    }
  }

  // ---------- API del modo ----------
  function start(onDone) {
    createSong();
    createDoorSfx(); // la Puerta queda precargada: el primer cruce no espera al archivo
    ensureMuteBtn(); // el botón de silencio vive con el modo (visible solo con body.date-mode)
    D.active = true; D.state = 'depa'; D.arrived = false; D.joseJoined = false; D.clockRunning = false;
    D.clockStarted = false; // re-entrar a la cita re-arma el arranque: volverá a ocurrir al llegar a la plaza
    // La carta (guion v2): cada partida empieza con la carta
    // sin abrir, ningún fragmento mostrado y la cita sin
    // completar; la banda, vacía.
    D.cartaAbierta = false;
    D.cartaFrag = { plaza: false, sanangel: false, aero: false, castillo: false };
    D.completed = false;
    cartaBand.text = null; cartaBand.pending = null; cartaBand.t = 0; cartaBand.total = 0;
    if (G.S) G.S.phase = 'date';
    if (typeof document !== 'undefined' && document.body && document.body.classList) document.body.classList.add('date-mode');
    D.scene = new DateScene(onDone);
    D.plazaScene = D.scene; D.angelScene = null; D.aeroScene = null; D.praderaScene = null; D.finaleScene = null;
    G.setScene(D.scene);
  }
  function stop() {
    D.active = false; D.state = 'idle'; D.clockRunning = false; D.clockStarted = false; fbRunning = false;
    D.cartaAbierta = false; D.completed = false;
    D.cartaFrag = { plaza: false, sanangel: false, aero: false, castillo: false };
    cartaBand.text = null; cartaBand.pending = null; cartaBand.t = 0; cartaBand.total = 0;
    skipArmed = false; // sin arranque en curso: el metadata tardío ya no debe saltar nada
    if (song && typeof song.pause === 'function') { try { song.pause(); } catch (e) {} }
    if (doorSfx && typeof doorSfx.pause === 'function') { try { doorSfx.pause(); } catch (e) {} }
    if (typeof document !== 'undefined' && document.body && document.body.classList) document.body.classList.remove('date-mode');
    W.closet.target = 0; W.xDoorOpen = false;
    D.scene = null; D.plazaScene = null; D.angelScene = null; D.aeroScene = null; D.praderaScene = null; D.finaleScene = null;
  }
  G.DateMode = {
    start, stop, setPaused, verify: verifyCode, verifyAdmin: verifyAdminCode, dateNow,
    // Resincroniza el audio de la cita con los Ajustes (game.js lo
    // llama cuando cambia cualquier control de sonido).
    applySoundSettings: applySongSound,
    scenes: DATE_SCENES, state: D,
    SUCK_DUR, DOOR_CALL_T, DOOR_OPEN_T, JOSE_LAG,
    update(dt) { if (D.scene) D.scene.update(dt); },
    draw(dt) { if (D.scene) D.scene.draw(dt); },
    // Gancho SOLO para el humo (tools/check_date.js): permite
    // ejercitar verify() con un código de prueba sin conocer el
    // real, y validar el SHA-256 contra vectores conocidos.
    debug: { sha256hex, setHash(h) { CODE_HASH = h; }, getHash() { return CODE_HASH; }, PLAZA_FX, PLAZA_TRAFICO, avionXAt, vochoXAt, SANANGEL, SA_HOUSES, SA_BOLAS, SA_ABRAZO, SA_VELAS_X0, candleGlow, travelTo, PACE, AERO, aeroPlaneXAt, PRADERA, ridgeY, praderaClouds, dirigibleXAt, bandadaAt, calciferFlick, mariposaAt, FINALE, FINAL_TEXT,
      // Ganchos del audio para el humo (sección K): permiten
      // simular el metadata del <audio> falso y ejercitar el
      // salto del silencio inicial y el botón de silencio.
      AUDIO_SKIP, getSong: () => song, onSongMetadata, startClock, toggleMute,
      // Gancho del SFX de la Puerta (sección Q): el elemento
      // propio de la grabación y su disparo, para contar
      // cuántas veces suena por cruce en el harness.
      getDoorSfx: () => doorSfx, playDoorClose,
      // Ganchos de la carta (guion v2, secciones F/O/S): los
      // textos, la regla de lectura, la banda y su disparo.
      CARTA_TEXTOS, cartaReadTime, cartaBand, showCartaBand, updateCartaBand,
      // Ganchos del playtest de la carta (sección U): la
      // posición derivada de la mesa de centro, la altura de
      // su tablero, la instrucción de objetivo con su
      // predicado, y la proyección analítica de la casa (para
      // fijar que coincide con la del motor, gl3d.js).
      CARTA_POS, CARTA_TOP, CARTA_OBJETIVO, objetivoCartaActivo, projectHomePoint, vpFromCam,
      // Ganchos de la proporción de las poses (sección V):
      // las fracciones de figura medidas en los PNG y los
      // altos de mundo corregidos de la pose de la carta y
      // del compuesto del finale.
      CARTA_POSE_FRAC, cartaPoseWorldH, PAREJA_FRAC, PAREJA_SENTADA, parejaWorldH,
      // Ganchos del playtest del finale (sección W): la
      // proporción de Pollito (su alto efectivo de actor y
      // las fracciones/márgenes medidos de sus PNG), el
      // margen bajo la figura sentada, el registro GL de
      // billboards y las imágenes de la puesta (el humo las
      // marca «cargadas» con naturalWidth/naturalHeight,
      // como hace la sección T con las fotos del álbum).
      pollitoTop, pollitoWorldH, POLLITO_FRAC, POLLITO_BOT, PAREJA_BASE_FRAC, spriteHomeImg,
      finaleImgs: { pareja: lecturaParejaImg, pareja2: lecturaPareja2Img, pareja3: lecturaPareja3Img, pollitoWalk: pollitoWalkImgs, pollitoDeja: pollitoDejaImg, pollitoOrgulloso: pollitoOrgullosoImg, tortaMesa: tortaMesaImg, cartaSobre: cartaSobreImg },
      // Ganchos del álbum del cierre (sección T): la lista
      // de fotos en orden y la imagen de la carta (el humo
      // marca sus FakeImage como «cargadas» poniendo
      // naturalWidth, para ejercitar la pila con imágenes
      // y su degradación sin ellas) y los tiempos de la
      // animación.
      CLOSE_PHOTOS, cartaFinalImg, ALBUM: { ENTER_T: ALBUM_ENTER_T, HOLD_MIN: ALBUM_HOLD_MIN, HOLD_AUTO: ALBUM_HOLD_AUTO, SOFA_BEAT: ALBUM_SOFA_BEAT, EXPAND_T: ALBUM_EXPAND_T } },
  };
})();
