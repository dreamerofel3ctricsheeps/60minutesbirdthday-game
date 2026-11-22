/* ============================================================
   MÚSICA DEL JUEGO PRINCIPAL (pedido de Jose, 2026-11-22)
   ------------------------------------------------------------
   G.Music: reproductor de la banda sonora de «1 Minuto para
   la Fiesta» con elementos <audio> y una tabla de cues pura
   (MUSIC_CUES). Cada cue dice archivo, segmento [start, end)
   en segundos (end=null → hasta el final del archivo), si
   loopeca y a qué volumen suena.

   MAPEO PEDIDO POR JOSE (archivos en assets/audio/, SOLO
   LOCALES: el .gitignore excluye *.mp3 a propósito):
   - Menú (título):        Gold_Plated_Strut.mp3  0:00–0:16, loop.
   - Recolección (60 s):   Quarter_Slot_Swagger.mp3  0:25–1:26, loop.
   - Ximena amenaza:       Before_The_Strike.mp3  desde el inicio,
                           loop mientras ella esté presente
                           (llegada y revelación).
   - Partida ganada:       Before_The_Strike.mp3  desde 0:17,
                           sin loop (remate del final).
   - Partida perdida:      Controller_Down.mp3  completa, sin loop.
   - Gestión (la noche):   PLAYLIST en rotación — The_Last_Life.mp3
                           y Gold_Plated_Strut.mp3 completas, una
                           tras otra, en loop de playlist. (Jose
                           listó ambas bajo «gestión»: se interpretó
                           como alternancia, no como mezcla.)

   REGLAS:
   - Si un MP3 falta o falla, el juego sigue EN SILENCIO y sin
     errores (mismo patrón tolerante que la canción de date.js).
   - Autoplay: el navegador exige gesto; si play() es rechazado,
     se reintenta en la primera interacción (click/tecla/toque),
     sin bucles agresivos.
   - La pausa global (G.setPaused → G.Music.setPaused) pausa la
     música y al reanudar sigue donde iba.
   - El VOLUMEN del jugador vive en los Ajustes (game.js:
     G.settings.musicVol + el silencio general) y entra por
     G.Music.setUserGain(0..1): multiplica el volumen propio de
     cada cue y se aplica EN VIVO al deck que esté sonando.
   - El nivel AUDIBLE de cada deck NO se controla con
     el.volume: en iOS (Safari y Chrome, ambos WebKit) la
     propiedad volume de un <audio> se acepta pero NO cambia
     lo que suena — ni siquiera a cero con el silencio
     general — (bug reportado por Jose, 2026-11-22: los
     controles de los Ajustes «no funcionaban» en su
     dispositivo). Cada deck se enruta por WebAudio
     (MediaElementSource → GainNode → destino) y el nivel
     vive SOLO en su GainNode, que todos los motores
     respetan; el.volume queda fijo en 1. Sin WebAudio
     disponible se cae al control por el.volume de siempre.
   - El easter egg «La Cita» tiene SU canción en date.js: este
     módulo NO la toca. Al entrar a la cita, game.js llama a
     G.Music.stop() y ningún gancho de fase vuelve a disparar
     cues mientras S.phase === 'date'.
   - Gestión SOLO en la escena de casa/chat (corrección de Jose,
     2026-11-22): la playlist suena entre duelos, mientras se
     interactúa con el chat. TODOS los minijuegos/duelos sueltos
     — de la historia y del menú de práctica — cambian al cue
     'collect' (el audio de la recolección) al entrar, y al salir
     se repone el cue que sonaba antes (gestión en la historia;
     menú o gestión en práctica). El cableado vive en game.js
     (enterMinigameMusic/exitMinigameMusic). EXCEPCIÓN: las
     cadenas de finales alternativos (SpaceEndingScene /
     LegendsEndingScene) no son minijuegos sueltos y su música
     no se toca. Ni siquiera los duelos contra Ximena existen
     como tales (ella es amenaza en 'arrival' y en la revelación,
     que sí llevan 'threat').
   ============================================================ */
(function () {
  'use strict';
  const G = window.G;

  // ---------- Tabla de cues (pura y comprobable por el humo) ----------
  const MUSIC_CUES = {
    menu:    { file: 'Gold_Plated_Strut.mp3',    start: 0,  end: 16,   loop: true,  volume: 0.45 },
    collect: { file: 'Quarter_Slot_Swagger.mp3', start: 25, end: 86,   loop: true,  volume: 0.50 },
    threat:  { file: 'Before_The_Strike.mp3',    start: 0,  end: null, loop: true,  volume: 0.45 },
    win:     { file: 'Before_The_Strike.mp3',    start: 17, end: null, loop: false, volume: 0.50 },
    lose:    { file: 'Controller_Down.mp3',      start: 0,  end: null, loop: false, volume: 0.50 },
    // Gestión = playlist: `tracks` se reproducen en orden y al
    // terminar la última se vuelve a la primera (loop de playlist).
    gestion: {
      tracks: [
        { file: 'The_Last_Life.mp3',     start: 0, end: null },
        { file: 'Gold_Plated_Strut.mp3', start: 0, end: null },
      ],
      start: 0, end: null, loop: true, volume: 0.32,
    },
  };
  const AUDIO_DIR = 'assets/audio/';
  const FADE_MS = 900, FADE_STEP = 45;

  // ---------- Estado ----------
  const broken = new Set();       // archivos que ya fallaron: no se reintentan
  let decks = [];                 // dos <audio> que se alternan (crossfade)
  let active = null;              // deck que suena (o debería sonar)
  let currentName = null;         // cue activo ('menu', 'collect', …)
  let pausedByGame = false;       // pausa global del juego
  let needGesture = false;        // play() rechazado por autoplay
  let userGain = 1;               // volumen del jugador (Ajustes): multiplica el de cada cue

  function tracksOf(cue) {
    return cue.tracks || [{ file: cue.file, start: cue.start, end: cue.end }];
  }

  // Volumen efectivo de un cue: el suyo propio × el del jugador.
  function targetFor(cue) { return Math.max(0, Math.min(1, cue.volume * userGain)); }

  // ---------- Enrutado WebAudio (el nivel vive en un GainNode) ----------
  // Ver la nota del encabezado: el.volume no es fiable en iOS.
  // El contexto es compartido y perezoso; si algo falla, cada
  // deck queda sin enrutar y setLevel cae a el.volume (el
  // comportamiento anterior, correcto en escritorio).
  let actx = null;        // AudioContext compartido
  let actxFailed = false; // WebAudio presente pero inútil para enrutar: no reintentar
  function ensureCtx() {
    if (actx || actxFailed) return actx;
    const AC = (typeof window !== 'undefined' && (window.AudioContext || window.webkitAudioContext)) || null;
    if (!AC) return null; // aún no disponible: se reintenta en el próximo play, sin sellar
    let ctx = null;
    try { ctx = new AC(); } catch (e) { actxFailed = true; return null; }
    if (!ctx || typeof ctx.createMediaElementSource !== 'function' || typeof ctx.createGain !== 'function') { actxFailed = true; return null; }
    actx = ctx;
    return actx;
  }
  function resumeCtx() {
    const ctx = ensureCtx();
    if (ctx && ctx.state === 'suspended' && typeof ctx.resume === 'function') {
      try { const p = ctx.resume(); if (p && p.catch) p.catch(() => {}); } catch (e) { /* tolerante */ }
    }
  }
  // Enruta el elemento de un deck: source → gain → destino.
  // Idempotente (un elemento solo admite UN MediaElementSource):
  // si ya tiene gain, no hace nada. Al enrutar, el.volume del
  // elemento queda fijo en 1 para no aplicar el nivel dos veces
  // (la salida del elemento alimenta la fuente ya escalada).
  function routeDeck(d) {
    if (d.gain) return;
    const ctx = ensureCtx();
    if (!ctx) return;
    try {
      const src = ctx.createMediaElementSource(d.el);
      const g = ctx.createGain();
      g.gain.value = d.level;
      src.connect(g); g.connect(ctx.destination);
      d.gain = g;
      try { d.el.volume = 1; } catch (e) { /* tolerante */ }
    } catch (e) { d.gain = null; /* sin enrutar: manda el.volume */ }
  }
  // ÚNICO punto donde se fija el nivel audible de un deck:
  // el GainNode si está enrutado; si no, el.volume de siempre.
  function setLevel(d, v) {
    d.level = Math.min(1, Math.max(0, isFinite(v) ? v : 0));
    if (d.gain) { try { d.gain.gain.value = d.level; } catch (e) { /* tolerante */ } }
    else { try { d.el.volume = d.level; } catch (e) { /* tolerante */ } }
  }

  function makeDeck() {
    let el = null;
    try { el = document.createElement('audio'); } catch (e) { el = null; }
    if (!el) return null;
    el.preload = 'auto';
    el.volume = 0;
    const d = { el, cue: null, name: null, track: 0, fade: null, wantStart: false, level: 0, gain: null };
    routeDeck(d);
    if (el.addEventListener) {
      // Error de carga/reproducción (p. ej. el MP3 no está en la
      // copia local): se marca el archivo y el juego sigue mudo.
      el.addEventListener('error', () => {
        const t = d.cue && tracksOf(d.cue)[d.track];
        if (t) broken.add(t.file);
        if (d === active) { /* queda en silencio; sin reintentos */ }
      }, true);
      // El seek al inicio del segmento puede ser ignorado si el
      // metadata aún no estaba: se reaplica UNA vez al cargar.
      el.addEventListener('loadedmetadata', () => {
        if (d !== active || !d.wantStart) return;
        d.wantStart = false;
        const t = tracksOf(d.cue)[d.track];
        if (t.start && isFinite(el.currentTime) && el.currentTime < t.start - 0.05) {
          try { el.currentTime = t.start; } catch (e) { /* tolerante */ }
        }
      });
      // Fin del segmento: loop del segmento o corte limpio.
      el.addEventListener('timeupdate', () => {
        if (d !== active || !d.cue) return;
        const t = tracksOf(d.cue)[d.track];
        if (t.end == null || !isFinite(el.currentTime)) return;
        if (el.currentTime >= t.end - 0.05) {
          if (d.cue.loop) { try { el.currentTime = t.start; } catch (e) { /* tolerante */ } }
          else if (typeof el.pause === 'function') { try { el.pause(); } catch (e) { /* tolerante */ } }
        }
      });
      // Fin del archivo: playlist → siguiente pista; loop de
      // pista completa → otra vez; sin loop → se acabó el cue.
      el.addEventListener('ended', () => {
        if (d !== active || !d.cue) return;
        const list = tracksOf(d.cue);
        if (list.length > 1) {
          d.track = (d.track + 1) % list.length;
          if (d.track === 0 && !d.cue.loop) return;
          loadTrack(d, d.cue);
          tryPlay(d);
        } else if (d.cue.loop && list[0].end == null) {
          try { el.currentTime = list[0].start; } catch (e) { /* tolerante */ }
          tryPlay(d);
        }
      });
    }
    decks.push(d);
    return d;
  }

  function loadTrack(d, cue) {
    const t = tracksOf(cue)[d.track];
    d.el.loop = !!(cue.loop && tracksOf(cue).length === 1 && t.end == null);
    const src = AUDIO_DIR + t.file;
    if (d.el.getAttribute ? d.el.getAttribute('src') !== src : d.el.src !== src) {
      try { d.el.src = src; } catch (e) { /* tolerante */ }
    }
    d.wantStart = true;
    if (t.start) { try { d.el.currentTime = t.start; } catch (e) { /* lo reaplica loadedmetadata */ } }
  }

  function tryPlay(d) {
    if (!d || !d.el || typeof d.el.play !== 'function') return;
    if (pausedByGame) return;
    resumeCtx(); // un contexto suspendido dejaría el enrutado en silencio
    const t = d.cue && tracksOf(d.cue)[d.track];
    if (t && broken.has(t.file)) return; // archivo ausente: silencio, sin insistir
    try {
      const p = d.el.play();
      if (p && p.catch) p.catch(() => { needGesture = true; });
    } catch (e) { needGesture = true; }
  }

  function fadeTo(d, target, done) {
    if (d.fade) { clearInterval(d.fade); d.fade = null; }
    const steps = Math.max(1, Math.round(FADE_MS / FADE_STEP));
    const from = d.level, delta = (target - from) / steps;
    let i = 0;
    d.fade = setInterval(() => {
      i++;
      setLevel(d, from + delta * i);
      if (i >= steps) {
        clearInterval(d.fade); d.fade = null;
        if (done) done();
      }
    }, FADE_STEP);
  }

  // ---------- API ----------
  function play(name) {
    const cue = MUSIC_CUES[name];
    if (!cue) return;
    if (name === currentName && active) { // ya suena ese cue: no reiniciar
      if (!pausedByGame) tryPlay(active);
      return;
    }
    if (!decks.length) { makeDeck(); makeDeck(); }
    const next = decks.find((d) => d !== active) || decks[0];
    if (!next) { currentName = name; return; } // sin <audio>: silencio tolerante
    const prev = active;
    next.cue = cue; next.name = name; next.track = 0;
    active = next; currentName = name;
    routeDeck(next); // por si WebAudio apareció después de crear los decks
    loadTrack(next, cue);
    setLevel(next, 0);
    tryPlay(next);
    fadeTo(next, targetFor(cue));
    if (prev && prev !== next) {
      fadeTo(prev, 0, () => { if (typeof prev.el.pause === 'function') { try { prev.el.pause(); } catch (e) { /* tolerante */ } } prev.cue = null; prev.name = null; });
    }
  }

  function stop() {
    currentName = null;
    const d = active; active = null;
    if (d) fadeTo(d, 0, () => { if (typeof d.el.pause === 'function') { try { d.el.pause(); } catch (e) { /* tolerante */ } } d.cue = null; d.name = null; });
  }

  function setPaused(v) {
    pausedByGame = !!v;
    if (!active) return;
    if (v) {
      if (active.fade) { clearInterval(active.fade); active.fade = null; }
      if (typeof active.el.pause === 'function') { try { active.el.pause(); } catch (e) { /* tolerante */ } }
    } else {
      tryPlay(active);
      if (active.cue) fadeTo(active, targetFor(active.cue));
    }
  }

  // Volumen del jugador (0..1) desde los Ajustes: queda guardado
  // para los próximos play() y se aplica EN VIVO al deck que esté
  // sonando — se corta su fade en curso y el volumen salta al
  // nuevo efectivo, para que mover el deslizador se oiga al momento.
  function setUserGain(g) {
    userGain = isFinite(g) ? Math.max(0, Math.min(1, g)) : 1;
    if (!active || !active.cue || pausedByGame) return;
    if (active.fade) { clearInterval(active.fade); active.fade = null; }
    setLevel(active, targetFor(active.cue));
  }

  // Autoplay: el primer gesto del usuario reintenta el cue activo
  // SOLO si un play() fue rechazado (nada de reintentos agresivos).
  if (typeof window !== 'undefined' && window.addEventListener) {
    const onGesture = () => {
      resumeCtx(); // el gesto también despierta el contexto de WebAudio
      if (!needGesture) return;
      needGesture = false;
      if (active && !pausedByGame) tryPlay(active);
    };
    ['pointerdown', 'keydown', 'touchstart'].forEach((t) => {
      try { window.addEventListener(t, onGesture); } catch (e) { /* tolerante */ }
    });
  }

  G.Music = {
    CUES: MUSIC_CUES,
    play, stop, setPaused, setUserGain,
    userGain: () => userGain,
    current: () => currentName,
  };
})();
