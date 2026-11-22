/* ============================================================
   GAME MANAGER: estado, interfaz (HUD + chat), motor de eventos
   y flujo de actos.  El contenido está en data.js.
   ============================================================ */
(function () {
  'use strict';
  const G = window.G, W = G.World, Sp = G.Sprites, Sc = G.Scenes;
  const $ = (s) => document.querySelector(s);
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const el = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };

  // ---------- Estado ----------
  const S = (G.S = {
    phase: 'title', player: null, inv: {}, sus: 0, sleep: 1, noise: 0, qBonus: 0, quality: 0,
    flags: {}, deco: [], duels: [], tired: null, done: {}, log: { fallos: 0, despertares: 0 },
    // La PARTY de la partida: protagonista + partners reclutados en la
    // recolección (máx. 3). Todo lo posterior a la llegada de Ximena
    // (asignaciones, duelos, chat, casa, revelación) usa SOLO la party;
    // los no reclutados huyeron y no vuelven a aparecer en la run.
    partners: [], party: [], fled: [],
  });
  function recalc() {
    S.quality = clamp(Object.keys(S.inv).reduce((n, id) => n + (G.ITEMS[id] ? G.ITEMS[id].q : 0), 0) + S.qBonus, 0, 100);
    S.sus = clamp(Math.round(S.sus), 0, 100); S.noise = clamp(Math.round(S.noise), 0, 100); S.sleep = clamp(S.sleep, 0, 5);
    ui.refreshHUD();
  }
  G.addNoise = (n) => { S.noise += n; recalc(); ui.pulse('noise'); };
  G.addSus = (n) => { S.sus += n; recalc(); ui.pulse('sus'); };

  // aplica efectos con modificadores de personaje; devuelve texto resumen
  function apply(fx, who) {
    fx = Object.assign({}, fx || {});
    if (who === 'alan') fx.noise = (fx.noise || 0) + 6;               // defecto: ruidoso
    if (who === 'itzel' && fx.sus < 0) fx.sus = Math.round(fx.sus * 1.5); // habilidad: coartada
    const parts = [];
    const add = (k, label, good) => { if (!fx[k]) return; const v = fx[k]; parts.push(`<span class="chip ${(v > 0) === good ? 'good' : 'bad'}">${label} ${v > 0 ? '+' : ''}${v}</span>`); };
    if (fx.sus) S.sus += fx.sus; if (fx.noise) S.noise += fx.noise; if (fx.sleep) S.sleep += fx.sleep; if (fx.quality) S.qBonus += fx.quality;
    add('sus', 'Sospecha', false); add('noise', 'Ruido', false); add('quality', 'Fiesta', true);
    if (fx.sleep) parts.push(`<span class="chip ${fx.sleep < 0 ? 'good' : 'bad'}">Sueño ${fx.sleep < 0 ? 'más profundo' : 'más ligero'}</span>`);
    recalc();
    if (parts.length) ui.raw('<div class="fx">' + parts.join('') + '</div>');
  }

  // ---------- Sonido (WebAudio, sin archivos) ----------
  let actx = null;
  G.sfx = function (name) {
    try {
      actx = actx || new (window.AudioContext || window.webkitAudioContext)();
      const T = { pick: [[660, 0.06], [880, 0.08]], ok: [[523, 0.07], [659, 0.07], [784, 0.12]], bad: [[196, 0.12], [147, 0.16]], meow: [[700, 0.08], [900, 0.1], [600, 0.14]], bell: [[988, 0.15], [784, 0.3]], door: [[120, 0.1], [90, 0.12]], msg: [[1200, 0.03]], party: [[523, 0.1], [659, 0.1], [784, 0.1], [1047, 0.3]] }[name] || [[440, 0.1]];
      let t = actx.currentTime;
      T.forEach(([f, d]) => { const o = actx.createOscillator(), g = actx.createGain(); o.type = name === 'bad' || name === 'door' ? 'sawtooth' : 'square'; o.frequency.value = f; g.gain.setValueAtTime(0.05, t); g.gain.exponentialRampToValueAtTime(0.001, t + d); o.connect(g).connect(actx.destination); o.start(t); o.stop(t + d); t += d * 0.9; });
    } catch (e) { /* sin audio */ }
  };

  // ---------- Bucle principal ----------
  const cv = $('#cv'); G.ovCtx = cv.getContext('2d');
  if (/[?&]low/.test(location.search)) { $('#gl').width = 640; $('#gl').height = 360; G.R.ss = 1; } // ?low: mitad de resolución 3D para equipos lentos
  if (/[?&]nofx/.test(location.search)) G.R.noPost = true;                                          // ?nofx: sin posproceso
  const hasGL = G.R.init($('#gl'));
  const timers = [];
  G.wait = (s) => new Promise((r) => timers.push({ t: s, r }));
  G.until = (fn) => new Promise((r) => timers.push({ fn, r }));
  // Espera pausable para efectos temporizados (reset de expresiones, la TV
  // de Pollito): corre con el reloj del juego, así la PAUSA los congela
  // igual que al resto (antes eran setTimeout de pared, imposibles de pausar).
  G.after = (s, fn) => { G.wait(s).then(fn); };
  // Descarta TODOS los temporizadores pendientes sin resolverlos: al entrar
  // a un duelo de práctica desde una partida, la cadena asíncrona de la
  // historia queda detenida para siempre y no puede resucitar a mitad de
  // la práctica ni corromper su estado.
  G.dropTimers = () => { timers.length = 0; };
  G.setScene = (sc) => { G.scene = sc; G.input.flush(); const f = $('#fade'); f.classList.remove('go'); void f.offsetWidth; f.classList.add('go'); };
  let last = performance.now();
  function frame(now) {
    // `last` avanza SIEMPRE, también en pausa: al reanudar, el dt es el de
    // un frame normal y el juego continúa exactamente donde estaba.
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    if (!G.paused) {
      for (let i = timers.length - 1; i >= 0; i--) { const tm = timers[i]; if (tm.fn ? tm.fn() : (tm.t -= dt) <= 0) { timers.splice(i, 1); tm.r(); } }
      if (G.scene) { G.scene.update(dt); G.scene.draw(dt); }
    }
    updatePauseBtn();
    requestAnimationFrame(frame);
  }

  // ---------- Interfaz ----------
  const msgs = $('#msgs'), actions = $('#actions'), overlay = $('#overlay');
  const ui = (G.ui = {
    fast: false,
    refreshHUD() {
      $('#m-sus .fill').style.width = S.sus + '%'; $('#m-sus .val').textContent = S.sus + '%';
      $('#m-noise .fill').style.width = S.noise + '%'; $('#m-noise .val').textContent = S.noise + '%';
      $('#m-q .fill').style.width = S.quality + '%';
      const lvl = Math.min(4, Math.floor(S.quality / 20));
      $('#m-q .val').textContent = '★'.repeat(lvl) + '☆'.repeat(4 - lvl);
      $('#m-sleep .val').textContent = S.phase === 'collect' || S.phase === 'title' ? 'De guardia' : G.SLEEP[S.sleep];
      document.querySelectorAll('#m-sleep .seg').forEach((s, i) => s.classList.toggle('on', S.phase !== 'collect' && S.phase !== 'title' && i <= S.sleep));
      $('#m-sleep').dataset.lvl = S.sleep;
    },
    pulse(id) { const e = $('#m-' + id); e.classList.remove('pulse'); void e.offsetWidth; e.classList.add('pulse'); },
    refreshInv() {
      const box = $('#inv'); box.innerHTML = '';
      Object.keys(G.ITEMS).forEach((id) => { const d = el('div', 'slot' + (S.inv[id] ? ' have' : '')); d.title = G.ITEMS[id].name + ' — ' + G.ITEMS[id].hint; d.innerHTML = `<img src="${Sp.itemURL(id)}" alt="${G.ITEMS[id].name}">`; box.appendChild(d); });
      recalc();
    },
    scroll() { msgs.scrollTop = msgs.scrollHeight; },
    raw(html) { const d = el('div', 'row', html); msgs.appendChild(d); ui.scroll(); return d; },
    system(text) { ui.raw(`<div class="sys">${text}</div>`); },
    header(kind, title) { ui.raw(`<div class="evhead"><span>${kind}</span>${title}</div>`); },
    async post(m) {
      if (m.who === 'sistema') { await G.wait(ui.fast ? 0.05 : 0.5); ui.system(m.text); return; }
      // Los roomies que NO fueron reclutados huyeron al llegar Ximena: no
      // participan en el chat de la run (sus líneas se omiten; si el guion
      // los menciona es como ausentes). Ximena, José y Pollito no son
      // roomies reclutables y siempre pueden hablar.
      if (S.party.length && G.PLAYABLE.includes(m.who) && !S.party.includes(m.who)) return;
      // Personajes especiales (Alebrije/Teodora): no están en G.CHARS
      // ni tienen hoja definida; su nombre/color salen de G.SPECIALS y
      // su avatar es el retrato dibujado por código (G.specialURL).
      const ch = G.CHARS[m.who] || (G.SPECIALS && G.SPECIALS[m.who]);
      if (!ch) return;
      const typing = ui.raw(`<div class="typing">${ch.name} está escribiendo…</div>`);
      await G.wait(ui.fast ? 0.05 : clamp(0.45 + m.text.length * 0.013, 0.5, 1.4));
      typing.remove();
      ui.raw(`<div class="msg ${m.direct ? 'direct' : ''}"><img class="av" src="${G.CHARS[m.who] ? Sp.portrait(m.who, m.mood) : G.specialURL(m.who)}" alt=""><div class="bubble"><b style="color:${ch.color}">${ch.name}${m.direct ? ' <i>· chat directo</i>' : ''}</b>${m.text}</div></div>`);
      G.sfx('msg');
      await G.wait(ui.fast ? 0.05 : 0.35);
    },
    async postAll(list) { for (const m of list) await ui.post(m); ui.fast = false; },
    choose(options, timer) {
      return new Promise((res) => {
        actions.innerHTML = ''; let tm = null, left = timer;
        const finish = (i) => { if (G.practiceMode) return; if (tm) clearInterval(tm); actions.innerHTML = ''; ui.raw(`<div class="mine">${options[i].label}</div>`); res(i); };
        if (timer) {
          const bar = el('div', 'tbar', '<i></i>'); actions.appendChild(bar);
          // La cuenta regresiva de la decisión corre con setInterval (reloj
          // de pared): en PAUSA los ticks se saltan (la cuenta se congela y
          // la barra no se mueve) y en modo práctica el intervalo se apaga.
          tm = setInterval(() => { if (G.paused) return; if (G.practiceMode) { clearInterval(tm); return; } left -= 0.1; bar.firstChild.style.width = (left / timer) * 100 + '%'; if (left <= 0) finish(Math.max(0, options.findIndex((o) => o.timeout))); }, 100);
        }
        options.forEach((o, i) => {
          const miss = o.requires && !S.inv[o.requires];
          const b = el('button', 'opt', `<span>${'ABC'[i]}</span>${o.label}${miss ? ` <em>(falta: ${G.ITEMS[o.requires].name})</em>` : o.requires ? ` <em class="ok">(usa: ${G.ITEMS[o.requires].name})</em>` : ''}`);
          b.disabled = !!miss; b.onclick = () => finish(i); actions.appendChild(b);
        });
        ui.scroll();
      });
    },
    // tarjetas de asignación de personaje: SOLO la party (protagonista +
    // partners reclutados); antes de que exista party (práctica/?duelo=)
    // se ofrece el roster completo.
    assign(prompt, info) {
      return new Promise((res) => {
        actions.innerHTML = `<div class="ask">${prompt}</div>`;
        const wrap = el('div', 'cards');
        (S.party.length ? S.party : G.PLAYABLE).forEach((id) => {
          const c = G.CHARS[id], tired = S.tired === id, inf = info(id);
          const b = el('button', 'card', `<img src="${Sp.portrait(id, tired ? 'tired' : null)}" alt=""><b>${c.name}</b><small>${inf.stats}</small>${inf.odds != null ? `<strong class="${inf.odds >= 0.6 ? 'hi' : inf.odds >= 0.35 ? 'mid' : 'lo'}">${Math.round(inf.odds * 100)}%</strong>` : ''}<small class="note">${tired ? 'Descansando (acaba de actuar)' : inf.note || ''}</small>`);
          b.disabled = tired; b.onclick = () => { actions.innerHTML = ''; ui.raw(`<div class="mine">Va ${c.name}</div>`); res(id); };
          wrap.appendChild(b);
        });
        actions.appendChild(wrap); ui.scroll();
      });
    },
    modal(html, btn) {
      return new Promise((res) => {
        overlay.innerHTML = `<div class="modal">${html}<button class="big" id="mok">${btn}</button></div>`; overlay.classList.add('show');
        $('#mok').onclick = () => { overlay.classList.remove('show'); overlay.innerHTML = ''; G.sfx('pick'); res(); };
        $('#mok').focus();
      });
    },
  });
  msgs.addEventListener('click', () => (ui.fast = true));

  // ---------- Pausa ----------
  // La pausa se centraliza en frame() (ver arriba): con G.paused activo no
  // se procesan los temporizadores G.wait/G.until/G.after ni se llama a
  // update/draw de la escena. Como TODA la lógica del juego corre con dt
  // (recolección, duelos, animaciones, rutas, temporizadores de escena),
  // eso congela el juego entero, no solo lo visual, en cualquier fase.
  // Atajos: ESC siempre; la tecla P solo fuera de los duelos/recolección,
  // donde las teclas son del juego (p. ej. el duelo de mensajes usa letras).
  // Botón visible de pausa en el HUD. Temporizadores de pared auditados
  // (2026-11-14): cuenta regresiva de ui.choose (se salta los ticks en
  // pausa), saltos de la fiesta (guardados con el flag), resets de
  // expresión y TV (pasaron a G.after) y cierre de CollectScene (pasó a
  // dt). Único no pausable: un sfx de WebAudio ya disparado (<0.35 s)
  // termina de sonar; no afecta al estado del juego.
  G.paused = false; G.menuOpen = false; G.practiceMode = false;
  const pauseOv = $('#pauseov'), pauseBtn = $('#pausebtn');
  const pauseShown = () => pauseOv.classList.contains('show');
  G.canPause = () => !!(hasGL && G.scene && S.phase !== 'title' && !overlay.classList.contains('show') && !G.menuOpen && !pauseShown());
  G.setPaused = (v) => {
    if (v === G.paused) return;
    if (v && !G.canPause()) return;
    G.paused = v;
    document.body.classList.toggle('paused', v);
    G.input.flush(); // que no quede una tecla/acción "cargada" al reanudar
    if (v) showPauseMenu(); else { pauseOv.classList.remove('show'); pauseOv.innerHTML = ''; }
  };
  function showPauseMenu() {
    pauseOv.innerHTML = `<div class="modal"><h1><span class="pic pic-pause lg"><i></i><i></i></span>PAUSA</h1>
      <div class="pbtns">
        <button class="big" id="presume"><span class="pic pic-play"></span>Seguir jugando</button>
        <button class="big alt" id="pmg"><span class="pic pic-grid"><i></i><i></i><i></i><i></i></span>Minijuegos</button>
        <button class="big alt" id="psettings"><span class="pic pic-gear"><i></i></span>Ajustes</button>
        <button class="big alt" id="pexit"><span class="pic pic-door"></span>Salir al título</button>
      </div>
      <p class="dim">${G.practiceMode ? 'Estás en modo práctica: los duelos no afectan a ninguna partida.' : 'Ojo: lanzar un duelo de práctica abandona la partida actual, y salir al título también la pierde.'}</p></div>`;
    pauseOv.classList.add('show');
    $('#presume').onclick = () => G.setPaused(false);
    $('#pexit').onclick = () => { location.href = location.pathname; }; // mismo reinicio limpio que usa el final del juego
    $('#pmg').onclick = async () => {
      pauseOv.classList.remove('show'); pauseOv.innerHTML = '';
      await showMinigames('pause');
      if (G.paused) showPauseMenu(); // solo miró la lista y volvió: la pausa sigue puesta
    };
    $('#psettings').onclick = async () => {
      pauseOv.classList.remove('show'); pauseOv.innerHTML = '';
      await settingsScreen();
      if (G.paused) showPauseMenu();
    };
  }
  pauseBtn.onclick = () => { if (G.paused) G.setPaused(false); else G.setPaused(true); };
  let lastCan = null;
  function updatePauseBtn() { const c = !!(G.canPause() || G.paused); if (c !== lastCan) { lastCan = c; pauseBtn.classList.toggle('off', !c); settingsBtn.classList.toggle('off', !c); } }

  // ---------- Ajustes (controles táctiles y otras preferencias) ----------
  // Persistente en localStorage; el valor por defecto se adivina según si
  // el dispositivo reporta puntero "coarse" (dedo) o soporta touch, para
  // que en un celular/tablet los controles aparezcan solos la primera vez,
  // y en escritorio queden apagados salvo que el jugador los active a mano.
  const SETTINGS_KEY = '1mtp.settings';
  function detectTouch() { return !!((window.matchMedia && window.matchMedia('(pointer: coarse)').matches) || (typeof navigator !== 'undefined' && navigator.maxTouchPoints > 0)); }
  let savedSettings = {};
  try { savedSettings = JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}'); } catch (e) { savedSettings = {}; }
  G.settings = Object.assign({ touch: detectTouch() }, savedSettings);
  function saveSettings() { try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(G.settings)); } catch (e) { /* almacenamiento no disponible */ } }
  function applySettings() { document.body.classList.toggle('touch-on', !!G.settings.touch); }
  applySettings();
  function settingsScreen() {
    return new Promise((res) => {
      menuShow(`<h2><span class="pic pic-gear"><i></i></span>Ajustes</h2>
        <div class="optrow"><div><b>Controles táctiles</b><small>D-pad y botón de acción en pantalla, para jugar con el dedo en celular o tablet. El teclado sigue funcionando igual, estén activos o no.</small></div>
          <label class="switch"><input type="checkbox" id="stouch" ${G.settings.touch ? 'checked' : ''}><span class="track"></span></label></div>
        <button class="big alt" id="sback">← Volver</button>`);
      $('#stouch').onchange = (e) => {
        G.settings.touch = e.target.checked; saveSettings(); applySettings();
        if (!G.settings.touch) G.input.touchReset(); // suelta cualquier botón táctil "pegado" al desactivar
      };
      $('#sback').onclick = () => { G.sfx('pick'); menuHide(); res(); };
    });
  }
  const settingsBtn = $('#settingsbtn');
  settingsBtn.onclick = async () => {
    if (!G.canPause() && !G.paused) return; // mismo criterio que el botón de Pausa: sin partida activa no hace nada (el título tiene su propio botón de Ajustes)
    const wasPaused = G.paused;
    if (!wasPaused) G.setPaused(true);
    pauseOv.classList.remove('show'); pauseOv.innerHTML = '';
    await settingsScreen();
    if (G.paused) showPauseMenu();
  };

  // ---------- Wiring del D-pad y botón de acción táctiles ----------
  // Pointer events (no touchstart/touchend): funcionan igual con un dedo,
  // un mouse o un lápiz, y cada botón suelta su tecla lógica aunque el
  // dedo se levante fuera del botón (pointercancel/pointerleave) para que
  // nunca quede una dirección "trabada" si el dedo se resbala.
  (function initTouchpad() {
    const pad = $('#touchpad'); if (!pad) return;
    pad.querySelectorAll('.tbtn').forEach((btn) => {
      const k = btn.dataset.k;
      const down = (e) => { e.preventDefault(); btn.classList.add('on'); G.input.touchDown(k, e.pointerId); };
      const up = (e) => { e.preventDefault(); btn.classList.remove('on'); G.input.touchUp(k, e.pointerId); };
      btn.addEventListener('pointerdown', down);
      btn.addEventListener('pointerup', up);
      btn.addEventListener('pointercancel', up);
      btn.addEventListener('pointerleave', up);
      btn.addEventListener('contextmenu', (e) => e.preventDefault());
    });
  })();
  window.addEventListener('blur', () => G.input.touchReset());
  window.addEventListener('keydown', (e) => {
    if (e.repeat || G.menuOpen) return;
    if (e.key === 'Escape' || ((e.key === 'p' || e.key === 'P') && !G.captureKeys)) G.setPaused(!G.paused);
  });

  // ---------- Minijuegos: práctica directa ----------
  // Lista de los duelos jugable desde el título y desde la pausa, sin
  // pasar por la historia. La práctica es PURA: no usa runEvent ni aplica
  // efectos/inventario/duelos al estado S; corre la misma escena de duelo
  // (MG[game].Scene) que la historia. Si se lanza un duelo a mitad de una
  // partida, la partida se ABANDONA (enterPractice descarta los
  // temporizadores de la historia): al terminar se va a la lista o al
  // título, nunca de vuelta a la run.
  const DUEL_IDS = ['decoracion', 'pollito', 'mensajes', 'apagon', 'pizza', 'sonambula', 'memoria', 'imagen', 'cactus', 'cactus2', 'repisas', 'pisoton', 'globos', 'azotea', 'anillos', 'cinturon', 'finalj1407b', 'patron', 'trazo', 'soga', 'finalleyendas'];
  const DUEL_DESC = {
    decoracion: 'Cuelga la decoración en su zona antes de que Pollito la tire.',
    pollito: 'Persigue al gato por la sala y recupera lo que robó.',
    mensajes: 'Duelo de tipeo: responde los mensajes antes que José.',
    apagon: 'Juego de memoria en la oscuridad: memoriza dónde están las velas, prende más que José guiándote por la vela en tu mano; ojo con los parpadeos, apagan velas.',
    pizza: 'Baja la pizza por la escalera cuidando el equilibrio.',
    sonambula: 'Llega hasta Ximena sonámbula antes que José.',
    memoria: 'Da vuelta las cajas y junta más parejas que José.',
    imagen: 'Dos paneles iguales y uno distinto: señálalo antes que José. Carrera a 5 puntos.',
    cactus: 'Esquiva los cactus rodantes y sobrevive la ronda.',
    cactus2: 'Carrera lateral en el mismo carril que Pollito: salta los cactus que ruedan de izquierda a derecha. Ojo con los cambios de velocidad y de gravedad.',
    repisas: 'Escalada infinita por el librero sin techo: gana quien suba más alto en 60 s.',
    pisoton: 'Cambia de cojín y esquiva los pisotones de Pollito.',
    globos: 'Pollito dirige con banderas (¡y hace fintas!): espera el ¡YA! y levanta el globo indicado. Quien elige mal, sale volando.',
    azotea: 'Esquiva las pasadas del dron sobre la azotea.',
    anillos: 'Carrera 2 vs 2 en cohete sobre un anillo de J1407b: 3 carriles, meteoritos que ocupan 1 o 2, y un copiloto que sugiere carriles (si vas al contrario, el cohete duda).',
    cinturon: 'Duelo 1 vs 1 flotando con inercia entre asteroides contra José: chocar aturde 1,5 s. Pollito flota libre empujando rocas.',
    finalj1407b: 'El final alternativo COMPLETO: despegue de la azotea, carrera de anillos, cinturón de asteroides y fiesta en gravedad baja sobre J1407b.',
    patron: 'Final Leyendas · casting: repite el patrón de resplandores del Alebrije (memoria, 5 rondas).',
    trazo: 'Final Leyendas · boss 2A: traza la leyenda con precisión y corre a los hexágonos seguros contra Teodora.',
    soga: 'Final Leyendas · boss 2B: salta la soga de fuego sin quemarte; Teodora flota, pero se distrae con selfies.',
    finalleyendas: 'Final Leyendas completo: revelación del set, las dos pruebas de Teodora y los créditos de la película.',
  };
  // Jefes especiales (Alebrije/Teodora): NO están en G.CHARS (no tienen
  // hoja definida y check_defined la exigiría); sus datos salen de
  // G.SPECIALS y su imagen, del retrato dibujado por código.
  function bossChar(ev) { return G.CHARS[ev.boss] || (G.SPECIALS && G.SPECIALS[ev.boss]) || { name: ev.boss, color: '#fff' }; }
  function bossImgOf(ev) { return G.CHARS[ev.boss] ? Sp.full(ev.boss) : G.specialURL(ev.boss); }
  function menuShow(html) { G.menuOpen = true; overlay.innerHTML = `<div class="modal wide">${html}</div>`; overlay.classList.add('show'); }
  function menuHide() { G.menuOpen = false; overlay.classList.remove('show'); overlay.innerHTML = ''; }
  function enterPractice() {
    if (!G.practiceMode) { G.practiceMode = true; G.dropTimers(); actions.innerHTML = ''; }
    G.paused = false; document.body.classList.remove('paused');
    pauseOv.classList.remove('show'); pauseOv.innerHTML = '';
    S.phase = 'practice';
    G.home = new Sc.HomeScene(); G.home.xState = 'sleeping'; G.home.wander = true;
    G.setScene(G.home);
  }
  function duelListScreen(from) {
    return new Promise((res) => {
      const cards = DUEL_IDS.map((id) => { const ev = G.EVENTS[id], boss = bossChar(ev); return `<button class="duel" data-id="${id}"><b>${ev.title}</b><span style="color:${boss.color}">Jefe: ${ev.bossLabel || boss.name}</span><small>${DUEL_DESC[id]}</small></button>`; }).join('');
      menuShow(`<h2><span class="pic pic-grid"><i></i><i></i><i></i><i></i></span>Minijuegos — práctica</h2><p class="dim">Los duelos contra los jefes, directos y sin historia: ni premios ni castigos.${from === 'pause' && !G.practiceMode ? ' Si lanzas uno, la partida actual se abandona.' : ''}</p><div class="duels">${cards}</div><button class="big alt" id="mback">← Volver</button>`);
      overlay.querySelectorAll('.duel').forEach((b) => (b.onclick = () => { G.sfx('pick'); res(b.dataset.id); }));
      $('#mback').onclick = () => { G.sfx('pick'); res('back'); };
    });
  }
  // ---------- Carrusel de personajes (SIN barras de scroll) ----------
  // Pedido de Jose: la selección de personaje quedaba en un cuadro muy
  // angosto y había que mover la barra de scroll, rompiendo la estética.
  // Ahora se muestran `per` tarjetas a la vez en una ventana con overflow
  // OCULTO (ninguna barra aparece jamás en estas pantallas) y se navega
  // con los botones ‹ › de los lados, los puntos de posición o el teclado
  // (←/→, ver charKeys). Las tarjetas conservan su ancho completo, así la
  // ficha (stats/rol/habilidad) se lee entera sin apretujarse.
  function charCarousel(ids, cardHTML, slim, onPick) {
    const CW = slim ? 150 : 248, GAP = slim ? 10 : 12, iw = window.innerWidth || 9999;
    const per = iw < 2 * CW + GAP + 170 ? 1 : iw < 3 * CW + 2 * GAP + 170 ? 2 : 3;
    const node = el('div', 'car' + (slim ? ' slim' : ''));
    const view = el('div', 'cview'); view.style.width = (per * CW + (per - 1) * GAP) + 'px';
    const track = el('div', 'ctrack');
    ids.forEach((id) => { const b = el('button', 'pcard', cardHTML(id)); b.dataset.id = id; b.onclick = () => onPick(id); track.appendChild(b); });
    view.appendChild(track); node.appendChild(view);
    const prev = el('button', 'cnav prev', '<i></i>'), next = el('button', 'cnav next', '<i></i>');
    node.appendChild(prev); node.appendChild(next);
    const dots = el('div', 'cdots'), dEls = [];
    const maxPos = Math.max(0, ids.length - per);
    for (let k = 0; k <= maxPos; k++) { const d = el('button', 'cdot'); d.onclick = () => go(k); dots.appendChild(d); dEls.push(d); }
    let pos = 0;
    function paint() {
      track.style.transform = `translateX(${-pos * (CW + GAP)}px)`;
      prev.classList.toggle('off', pos === 0); next.classList.toggle('off', pos === maxPos);
      dEls.forEach((d, k) => d.classList.toggle('on', k === pos));
    }
    function go(n) { const t = Math.max(0, Math.min(maxPos, n)); if (t !== pos) { pos = t; G.sfx('pick'); } paint(); }
    prev.onclick = () => go(pos - 1); next.onclick = () => go(pos + 1);
    paint();
    return { node, dots, step: (d) => go(pos + d), get pos() { return pos; }, maxPos };
  }
  // Teclado del carrusel mientras la pantalla vive: ←/→ mueven la vista.
  // Se desactiva al resolver (flag + removeEventListener donde exista).
  function charKeys(car, off) {
    const h = (e) => { if (off()) return; if (e.code === 'ArrowLeft') car.step(-1); else if (e.code === 'ArrowRight') car.step(1); };
    window.addEventListener('keydown', h);
    return () => { if (window.removeEventListener) window.removeEventListener('keydown', h); };
  }

  function pickCharScreen(ev) {
    return new Promise((res) => {
      let done = false; const off = () => done;
      const car = charCarousel(G.PLAYABLE, (id) => { const c = G.CHARS[id]; return `<img src="${Sp.full(id)}" alt=""><h3 style="color:${c.color}">${c.name}</h3><small>${c.role}</small>`; }, true, (id) => finish(id));
      const un = charKeys(car, off);
      const modal = el('div', 'modal wide noscroll');
      modal.appendChild(el('h2', '', ev.title));
      modal.appendChild(el('p', 'dim', `¿Quién se enfrenta a ${bossChar(ev).name}?`));
      modal.appendChild(car.node); modal.appendChild(car.dots);
      const back = el('button', 'big alt', '← Lista de minijuegos');
      back.onclick = () => finish(null);
      modal.appendChild(back);
      G.menuOpen = true; overlay.innerHTML = ''; overlay.appendChild(modal); overlay.classList.add('show');
      function finish(v) { if (done) return; done = true; un(); if (v) G.sfx('ok'); res(v); }
    });
  }
  function vsScreen(ev, who) {
    return new Promise((res) => {
      const c = G.CHARS[who], boss = bossChar(ev);
      menuShow(`<div class="vs"><div><img class="hero" src="${Sp.full(who)}" alt=""><b style="color:${c.color}">${c.name}</b></div><span>VS</span><div class="boss"><img class="hero" src="${bossImgOf(ev)}" alt=""><b style="color:${boss.color}">${boss.name}</b><small>JEFE</small></div></div>
        <h2>${ev.title}</h2><p>${ev.intro}</p><p class="goal"><img class="inl-ico" src="assets/icons/trofeo.png" alt=""> ${ev.goal}</p>
        <p class="dim">${!G.practiceMode && S.phase !== 'title' ? 'Modo práctica: al empezar, la partida actual se abandona.' : 'Modo práctica: sin consecuencias en la historia.'}</p>
        <div class="pbtns"><button class="big" id="mstart">¡EMPEZAR!</button><button class="big alt" id="mback">← Volver</button></div>`);
      $('#mstart').onclick = () => { G.sfx('ok'); res(true); };
      $('#mback').onclick = () => res(false);
    });
  }
  function resultScreen(ev, r) {
    return new Promise((res) => {
      const boss = bossChar(ev);
      const ico = r.win === 'win' ? 'trofeo' : r.win === 'tie' ? 'empate' : 'derrota'; // ícono PROPIO del resultado
      const txt = r.win === 'win' ? `¡VENCISTE A ${boss.name.toUpperCase()}!` : r.win === 'tie' ? 'EMPATE' : `GANÓ ${boss.name.toUpperCase()}`;
      menuShow(`<h2>${ev.title}</h2><div class="roll ${r.win === 'win' ? 'good' : r.win === 'tie' ? 'mid' : 'bad'}"><img class="res-ico" src="assets/icons/${ico}.png" alt="">${txt}</div>
        <p class="dim">Práctica terminada: sin recompensas ni castigos.</p>
        <div class="pbtns"><button class="big" id="magain">↻ Otra vez</button><button class="big alt" id="mlist"><span class="pic pic-grid"><i></i><i></i><i></i><i></i></span>Lista de minijuegos</button><button class="big alt" id="mexit"><span class="pic pic-door"></span>Salir al título</button></div>`);
      $('#magain').onclick = () => res('again');
      $('#mlist').onclick = () => res('list');
      $('#mexit').onclick = () => res('exit');
    });
  }
  async function practiceDuel(id) {
    const ev = G.EVENTS[id], mg = MG[ev.game];
    const who = await pickCharScreen(ev);
    if (!who) return;
    for (;;) {
      if (!await vsScreen(ev, who)) return;
      enterPractice(); // ← aquí, y solo aquí, se abandona la partida en curso
      mg.setup();
      menuHide();
      G.captureKeys = true; $('#phone').classList.add('dim');
      const res = await new Promise((r) => G.setScene(new (mg.Scene())(who, r)));
      G.captureKeys = false; $('#phone').classList.remove('dim');
      G.setScene(G.home);
      const act = await resultScreen(ev, res);
      if (act === 'again') continue;
      if (act === 'exit') { location.href = location.pathname; return; }
      return; // 'list'
    }
  }
  async function showMinigames(from) {
    for (;;) {
      const pick = await duelListScreen(from);
      if (pick === 'back') break;
      await practiceDuel(pick);
    }
    menuHide();
  }

  // ---------- Pantallas iniciales ----------
  function titleScreen() {
    return new Promise((res) => {
      const show = () => {
        overlay.innerHTML = `<div class="modal"><div class="logo"><img class="logoico" src="assets/icons/pastel.png" alt=""><h1>1 MINUTO<br><span>PARA LA FIESTA</span></h1></div>
          <p>Siete roomies. Una fiesta sorpresa. Y Ximena, que vuelve de 36 horas de guardia, está por llegar.</p>
          <p class="dim">Recolecta lo que puedas en 60 segundos. Después: decide, improvisa, vence en duelo a <b>Pollito</b> y a <b>José</b> y, sobre todo, <b>no la despiertes</b>.</p>
          <div class="pbtns"><button class="big" id="tplay"><span class="pic pic-play"></span>JUGAR</button><button class="big alt" id="tmg"><span class="pic pic-grid"><i></i><i></i><i></i><i></i></span>MINIJUEGOS</button><button class="big alt" id="tsettings"><span class="pic pic-gear"><i></i></span>AJUSTES</button></div></div>`;
        overlay.classList.add('show');
        $('#tplay').onclick = () => {
          overlay.classList.remove('show'); overlay.innerHTML = ''; G.sfx('ok');
          // si estuvo practicando desde el título, se resetea el modo antes
          // de que arranque la partida de verdad
          if (G.practiceMode) { G.practiceMode = false; G.dropTimers(); S.phase = 'title'; }
          res();
        };
        $('#tmg').onclick = async () => { overlay.classList.remove('show'); overlay.innerHTML = ''; G.sfx('pick'); await showMinigames('title'); show(); };
        $('#tsettings').onclick = async () => { overlay.classList.remove('show'); overlay.innerHTML = ''; G.sfx('pick'); await settingsScreen(); show(); };
      };
      show();
    });
  }
  function selectChar() {
    return new Promise((res) => {
      let done = false; const off = () => done;
      const car = charCarousel(G.PLAYABLE, (id) => {
        const c = G.CHARS[id];
        const stats = Object.keys(c.stats).map((k) => `<div class="st"><span>${G.STAT_LABEL[k]}</span><i><u style="width:${c.stats[k] * 10}%"></u></i><em>${c.stats[k]}</em></div>`).join('');
        return `<img src="${Sp.full(id)}" alt=""><h3 style="color:${c.color}">${c.name}</h3><small>${c.role}</small>${stats}<p class="good">✔ ${c.skill}</p><p class="bad">✖ ${c.defect}</p>`;
      }, false, (id) => finish(id));
      const un = charKeys(car, off);
      const modal = el('div', 'modal wide noscroll');
      modal.appendChild(el('h2', '', '¿A quién controlas en el minuto de recolección?'));
      modal.appendChild(car.node); modal.appendChild(car.dots);
      modal.appendChild(el('p', 'dim', 'Usa los botones de los lados (o las flechas ← →) para ver a todos. En el departamento estarán los 7 roomies. Durante el minuto podrás cargar hasta <b>3 partners</b> al hombro y meterlos en el armario: ellos se quedan para toda la noche. Los demás… ya verás.'));
      overlay.innerHTML = ''; overlay.appendChild(modal); overlay.classList.add('show');
      function finish(id) { if (done) return; done = true; un(); overlay.classList.remove('show'); overlay.innerHTML = ''; G.sfx('ok'); res(id); }
    });
  }

  // ---------- Motor de eventos ----------
  function chanceFor(test, who) {
    const c = G.CHARS[who].stats;
    let score = test.stats.reduce((n, k) => n + c[k], 0) + ((test.bonus && test.bonus[who]) || 0);
    if (test.itemBonus) for (const it in test.itemBonus) if (S.inv[it]) score += test.itemBonus[it];
    return clamp(0.5 + (score - test.dc) * 0.08, 0.1, 0.95);
  }
  const statLine = (who, keys) => keys.map((k) => `${G.STAT_LABEL[k]} ${G.CHARS[who].stats[k]}`).join(' · ');

  async function runEvent(id) {
    const ev = G.EVENTS[id], home = G.home;
    S.done[id] = true;
    ui.header(ev.kind, ev.title);
    if (ev.dark) home.setLight('oscuro');
    home.setView(ev.view || 'todo');
    if (ev.pre) apply(ev.pre);
    await ui.postAll(typeof ev.chat === 'function' ? ev.chat(S) : ev.chat);

    if (ev.type === 'decision') {
      const i = await ui.choose(ev.options, ev.timer);
      const o = ev.options[i];
      if (o.set) Object.assign(S, o.set);
      Object.assign(S.flags, o.flags || {});
      await ui.postAll(o.reply || []);
      apply(o.effects);
    } else if (ev.type === 'assign') {
      const t = ev.test;
      const who = await ui.assign(t.prompt, (c) => ({ stats: statLine(c, t.stats), odds: chanceFor(t, c), note: t.itemBonus && Object.keys(t.itemBonus).some((k) => S.inv[k]) ? 'Bonus por objeto' : '' }));
      const ok = Math.random() < chanceFor(t, who);
      const br = ok ? ev.success : ev.fail;
      ui.raw(`<div class="roll ${ok ? 'good' : 'bad'}">${ok ? 'ÉXITO' : 'FALLO'}</div>`); G.sfx(ok ? 'ok' : 'bad');
      const actor = home.actor(who); if (actor) { actor.expr = ok ? 'happy' : 'surprised'; G.after(4, () => (actor.expr = null)); }
      await ui.postAll(br.reply(who));
      apply(br.effects, who);
      if (!ok) { S.log.fallos++; if (ev.kind === 'Amenaza' && who !== 'itzel') { await ui.post({ who: 'itzel', text: 'Yo le habría respondido MEJOR. Pero claro, nadie me pregunta.', mood: 'angry' }); apply({ noise: 5 }); } }
      S.tired = who;
    } else if (ev.type === 'minigame') {
      await runMinigame(ev);
    }
    if (ev.dark) home.setLight('noche');
    home.setView('todo');
  }

  // Duelos contra los jefes.  resolve() aplica consecuencias propias; el resto sale de ev.results
  const MG = {
    deco: {
      stats: ['velocidad', 'logica'], Scene: () => Sc.DecoDuel, note: (c) => (c === 'alan' ? 'Suma ruido' : ''),
      setup() {
        // SIEMPRE las 6 zonas de la sala (Sc.buildDecoSet): las de un tipo
        // recolectado van de verdad y las demás se improvisan. Antes el
        // pool salía solo de lo recolectado con un mínimo de 3 en total, y
        // como el duelo reparte en 3 rondas, con 0–2 tipos recolectados
        // había rondas de UN SOLO ítem (bug reportado por Jose; medido en
        // tools/smoke_v31.js: [1,1,1] sin inventario o con un solo tipo).
        S.deco = Sc.buildDecoSet();
      },
      async resolve(r, who) {
        const improv = S.deco.every((d) => d.improv);
        if (r.win === 'win') await ui.postAll([{ who: 'samantha', text: improv ? 'Ok, el papel higiénico tiene… ¿encanto? Digamos que sí.' : 'QUEDÓ HERMOSO. Juro que no subo nada. (Todavía.)', mood: 'happy' }, { who: 'pollito', text: '😾' }]);
        else if (r.placed > 0) await ui.postAll([{ who: 'majo', text: `Pollito tiró ${r.knocks}. Quedaron ${r.placed} de ${r.total} colgadas. Es lo que hay.` }, { who: 'pollito', text: '😼' }]);
        else await ui.postAll([{ who: 'majo', text: 'No quedó NADA colgado. Nos ganó un gato.', mood: 'angry' }, { who: 'pollito', text: '😸' }]);
        apply({ quality: S.deco.filter((d) => d.placed).reduce((n, d) => n + (d.improv ? 2 : 4), 0) + (r.win === 'win' ? 3 : 0) }, who);
      },
    },
    pollito: {
      stats: ['velocidad'], Scene: () => Sc.ChaseDuel, note: (c) => (S.inv.premios ? 'Atún: +4 s por ronda' : ''), setup() {},
      async resolve(r, who) {
        const t = r.target;
        if (r.win === 'win') { await ui.postAll([{ who, text: `Lo tengo. Recuperé ${t.article}. Sólo tiene un poquito de baba.`, mood: 'happy' }, { who: 'pollito', text: '😾' }]); apply({ quality: 3 }, who); }
        else if (t.id === 'control') { S.flags.tvOn = true; await ui.postAll([{ who: 'sistema', text: '📺 Pollito pisó el control. La tele se prende a todo volumen.' }, { who: 'alan', text: '¡APÁGUENLA!', mood: 'surprised' }]); apply({ noise: 24 }, who); G.after(6, () => (S.flags.tvOn = false)); }
        else {
          delete S.inv[t.id]; ui.refreshInv();
          if (t.id === 'regalo') S.flags.regaloRoto = true;
          await ui.postAll([{ who: 'natalia', text: `No lo alcanzamos. ${t.name}: destruido. Descansa en paz.`, mood: 'surprised' }, { who: 'pollito', text: '😸' }]);
          ui.system(`Perdiste: ${t.name}`); apply({ noise: 6 }, who);
        }
      },
    },
    memoria: { stats: ['logica'], Scene: () => Sc.MemoryDuel, note: () => 'Más lógica = José recuerda menos', setup() {} },
    imagen: { stats: ['logica', 'velocidad'], Scene: () => Sc.ImageDuel, note: () => 'Más lógica = José tarda más en verla', setup() {} },
    cactus: { stats: ['velocidad'], Scene: () => Sc.SpikeDuel, note: () => 'Velocidad para esquivar', setup() {} },
    cactus2: { stats: ['velocidad', 'sigilo'], Scene: () => Sc.CactusRaceDuel, note: () => 'Mismo carril que Pollito: salta con ESPACIO o ↑', setup() {} },
    repisas: { stats: ['velocidad'], Scene: () => Sc.ClimbDuel, note: () => 'La altura máxima manda: ← y →', setup() {},
      resolve(res) {
        // FINAL J1407b, condición (1): llegar a la zona ESPACIO y GANAR
        // la Escalada EN LA HISTORIA deja la marca que G.spaceReady
        // evalúa a las 23:00. ClimbDuel.extra() reporta `space` (la
        // altura máxima del jugador alcanzó ESPACIO_E). En práctica el
        // resolve ni se invoca (practiceDuel no lo llama); el guard
        // cubre el bucle de depuración ?duelo=.
        if (!G.practiceMode && res.win === 'win' && res.space) S.flags.escaladaEspacio = true;
      } },
    pisoton: { stats: ['velocidad'], Scene: () => Sc.StompDuel, note: () => 'Velocidad para cambiar de cojín', setup() {} },
    azotea: { stats: ['velocidad'], Scene: () => Sc.DroneDuel, note: () => 'Velocidad lateral', setup() {} },
    apagon: {
      stats: ['velocidad', 'sigilo'], Scene: () => Sc.CandleGame, note: () => 'Velocidad para recorrer la casa · Sigilo: prender más rápido junto a Ximena', setup() {},
      async resolve(r, who) {
        // Salidas del minijuego de velas → S.flags.apagon (gancho para
        // eventos/WhatsApp/finales): candlesPlayer, candlesJose,
        // blownByPlayer, blownByJose, surges. El minijuego anterior del
        // apagón («¿Fantasma o disfraz?») se eliminó por completo el
        // 2026-11-14: ya no hay fantasmas confirmados, ni ruta
        // paranormal, ni daño a la decoración desde este evento.
        S.flags.apagon = { candlesPlayer: r.candlesPlayer, candlesJose: r.candlesJose, blownByPlayer: r.blownByPlayer, blownByJose: r.blownByJose, surges: r.surges };
        const posts = [];
        if (r.win === 'win') posts.push({ who, text: `¡GANAMOS EL APAGÓN! ${r.candlesPlayer} velas prendidas contra ${r.candlesJose} de José. La casa quedó de revista, a pura vela.`, mood: 'happy' }, { who: 'jose', text: 'Ok, ok. Buen ambiente. Pero conste que la idea de las velas fue mía.', direct: true });
        else if (r.win === 'tie') posts.push({ who: 'majo', text: `Empate de velas: ${r.candlesPlayer} a ${r.candlesJose}. La casa quedó mitad romántica, mitad sospechosa.` }, { who: 'jose', text: 'Empate técnico. Mi ambiente era el bueno, pero empate al fin.', direct: true });
        else posts.push({ who: 'jose', text: `El ambiente a velas lo salvé YO: ${r.candlesJose} velas contra ${r.candlesPlayer}. De nada, equipo.`, direct: true }, { who: 'itzel', text: 'José prendió más velas que nosotros y no va a callarse en toda la noche.', mood: 'angry' });
        if (r.blownByPlayer + r.blownByJose >= 4) posts.push({ who: 'saulo', text: `Entre soplidos se apagaron ${r.blownByPlayer + r.blownByJose} velas. Hubo guerra de velas y nadie me avisó.` });
        await ui.postAll(posts);
        apply({ quality: r.win === 'win' ? 5 : r.win === 'tie' ? 2 : -4, noise: r.win === 'lose' ? 14 : r.win === 'tie' ? 6 : 0 }, who);
      },
    },
    mensajes: { stats: ['carisma'], Scene: () => Sc.MessageDuel, note: () => 'Más carisma = José escribe más lento', setup() {} },
    pizza: { stats: ['velocidad', 'sigilo'], Scene: () => Sc.PizzaRace, note: () => 'Sigilo = mejor equilibrio', setup() {} },
    sonambula: { stats: ['velocidad', 'sigilo'], Scene: () => Sc.SleepwalkDuel, note: () => 'Sigilo = más margen al frenar', setup() {} },
    globos: { stats: ['velocidad', 'sigilo'], Scene: () => Sc.BalloonDuel, note: () => 'Pollito dirige: no caigas en sus fintas', setup() {} },
    // ----- Final J1407b (práctica y cadena del clímax) -----
    anillos: { stats: ['velocidad'], Scene: () => Sc.RingRaceDuel, note: () => 'Tu copiloto es tu primer partner: hazle caso al cambiar de carril', setup() {} },
    cinturon: { stats: ['velocidad', 'sigilo'], Scene: () => Sc.AsteroidBeltDuel, note: () => 'Inercia pura: impulsa en contra para frenar', setup() {} },
    finalj1407b: { stats: ['velocidad'], Scene: () => Sc.SpaceEndingScene, note: () => 'La cadena completa del final alternativo J1407b', setup() {} },
    // ----- Final LEYENDAS (práctica y cadena del clímax) -----
    patron: { stats: ['logica', 'carisma'], Scene: () => Sc.PatronDuel, note: () => 'Casting del Alebrije: memoria de secuencias', setup() {} },
    trazo: { stats: ['velocidad', 'logica'], Scene: () => Sc.TrazoDuel, note: () => 'Boss Teodora: precisión de trazo y hexágonos seguros', setup() {} },
    soga: { stats: ['velocidad', 'sigilo'], Scene: () => Sc.SogaDuel, note: () => 'Boss Teodora: mantén y suelta para saltar la soga', setup() {} },
    finalleyendas: { stats: ['velocidad', 'carisma'], Scene: () => Sc.LegendsEndingScene, note: () => 'La cadena completa del clímax de Leyendas (sin condiciones)', setup() {} },
  };

  // SORTEO DEL EVENTO CACTUS (decisión de Jose, 2026-11-14): en la
  // historia, el evento «Cactus rodantes» sortea en cada partida cuál
  // variante se juega — las bolas que rebotan por la cocina (cactus)
  // o la carrera lateral con gravedad cambiante (cactus2) — al
  // 50/50. En práctica NO hay sorteo: cada entrada de la lista juega
  // siempre su variante. Se expone en G para la prueba de humo.
  function cactusVariant() { return Math.random() < 0.5 ? 'cactus2' : 'cactus'; }
  G.cactusVariant = cactusVariant;

  async function runMinigame(ev) {
    // Sorteo de variante del evento cactus (solo en la historia): si
    // sale la carrera, se juega con el MG, el título, el intro y la
    // meta de «Cactus en carrera», y la pantalla VS lo anuncia.
    let mg = MG[ev.game], variant = null, evShow = ev;
    if (ev.game === 'cactus' && !G.practiceMode) {
      variant = cactusVariant();
      S.flags.cactusVariant = variant;
      if (variant === 'cactus2') { mg = MG.cactus2; evShow = G.EVENTS.cactus2; }
    }
    const boss = bossChar(ev);
    const who = await ui.assign(`¿Quién se enfrenta a ${boss.name}?`, (c) => ({ stats: statLine(c, mg.stats), note: mg.note ? mg.note(c) : '' }));
    mg.setup();
    const c = G.CHARS[who];
    const bossImg = bossImgOf(ev);
    await ui.modal(`<div class="vs"><div><img class="hero" src="${Sp.full(who)}" alt=""><b style="color:${c.color}">${c.name}</b></div><span>VS</span><div class="boss"><img class="hero" src="${bossImg}" alt=""><b style="color:${boss.color}">${boss.name}</b><small>JEFE</small></div></div>
      <h2>${evShow.title}</h2>${variant ? '<p class="goal">Sorteo de cactus: esta partida toca la variante «' + (variant === 'cactus2' ? 'Cactus en carrera' : 'Cactus rodantes') + '».</p>' : ''}<p>${evShow.intro}</p><p class="goal"><img class="inl-ico" src="assets/icons/trofeo.png" alt=""> ${evShow.goal}</p>`, '¡EMPEZAR!');
    G.captureKeys = true; $('#phone').classList.add('dim');
    const res = await new Promise((r) => G.setScene(new (mg.Scene())(who, r)));
    G.captureKeys = false; $('#phone').classList.remove('dim');
    G.setScene(G.home);
    S.duels.push({ game: ev.game, boss: ev.boss, win: res.win, ...(variant ? { variant } : {}) });
    ui.raw(`<div class="roll ${res.win === 'win' ? 'good' : res.win === 'tie' ? 'mid' : 'bad'}">${`<img class="res-ico" src="assets/icons/${res.win === 'win' ? 'trofeo' : res.win === 'tie' ? 'empate' : 'derrota'}.png" alt="">`} ${res.win === 'win' ? `VENCISTE A ${boss.name.toUpperCase()}` : res.win === 'tie' ? 'EMPATE' : `GANÓ ${boss.name.toUpperCase()}`}</div>`);
    const actor = G.home.actor(who); if (actor) { actor.expr = res.win === 'win' ? 'happy' : 'surprised'; actor.hop(160); G.after(4, () => (actor.expr = null)); }
    if (res.win !== 'win') S.log.fallos++;
    if (mg.resolve) await mg.resolve(res, who);
    const br = ev.results && (ev.results[res.win] || ev.results.lose);
    if (br) { await ui.postAll(br.reply(who, res)); apply(br.effects, who); }
    S.tired = who;
  }

  // paso de tiempo entre eventos: el ruido afecta el sueño; devuelve true si hay final
  async function tick() {
    if (S.noise >= 60) S.sleep += 2; else if (S.noise >= 35) S.sleep += 1; else if (S.noise < 15) S.sleep -= 1;
    S.noise = Math.round(S.noise * 0.5); recalc();
    if (S.sleep >= 5 && S.sus < 100) {
      S.log.despertares++;
      ui.header('Sueño', '¡Ximena se despertó!');
      await ui.postAll([{ who: 'ximena', text: '¿QUÉ fue ese ruido? ¿están bien?', mood: 'angry', direct: true }, { who: 'saulo', text: 'Fui yo. Tropecé con mis sentimientos.' }, { who: 'ximena', text: '…voy a intentar dormir de nuevo. por favor.', mood: 'tired', direct: true }]);
      apply({ sus: 20 }); S.sleep = 3; recalc();
    }
    return S.sus >= 100;
  }
  async function reactive() {
    for (const id of G.REACTIVE) { const ev = G.EVENTS[id]; if (!S.done[id] && ev.when(S)) { await runEvent(id); if (await tick()) return true; } }
    return false;
  }

  // ---------- Actos ----------
  async function actCollect() {
    S.phase = 'collect'; ui.refreshHUD(); msgs.innerHTML = '';
    ui.header('Acto 0', '1 minuto para la fiesta');
    ['majo|Ximena sale de guardia y viene para acá. Tenemos UN minuto.', 'fatima|El pastel quedó en algún lado. No me miren así.', 'majo|Agarren todo lo que sirva y guárdenlo en el armario del pasillo. Lo que no esté guardado cuando llegue, lo va a ver.', 'saulo|Y cuidado con Pollito y con José. Presiento que hoy van a ser nuestros jefes finales.'].forEach((l) => { const [w, t] = l.split('|'); ui.raw(`<div class="msg"><img class="av" src="${Sp.portrait(w)}" alt=""><div class="bubble"><b style="color:${G.CHARS[w].color}">${G.CHARS[w].name}</b>${t}</div></div>`); });
    G.captureKeys = true; $('#phone').classList.add('dim');
    let scene;
    const res = await new Promise((r) => G.setScene((scene = new Sc.CollectScene(S.player, r))));
    G.captureKeys = false; $('#phone').classList.remove('dim');
    return { ...res, x: scene.p.x, y: scene.p.y };
  }

  async function actArrival(res) {
    S.phase = 'arrival'; S.sus = 5; S.sleep = 1;
    // La llegada se juega con los 7 roomies presentes; al terminar la
    // huida, la escena se queda solo con la party (removeRoomie).
    const home = (G.home = new Sc.HomeScene(G.PLAYABLE));
    home.setLight('dia', true);
    const me = home.actor(S.player); me.carry = res.inHand.slice();
    // STAGING DE LA LLEGADA: Ximena entra y se queda parada en
    // (510, 548) diciendo sus líneas; la cámara la mira desde el sur,
    // así que NADIE visible puede quedar en su línea de visión ni
    // solapar su sprite (antes un partner en (510, 556) quedaba pegado
    // DELANTE de ella y la tapaba entera — el caso reportado fue
    // Itzel). Los partners ya NO esperan en las esquinas: están
    // DENTRO DEL ARMARIO, donde quedaron guardados en la recolección
    // (pedido de Jose, 2026-11-16) — el mueble queda entreabierto
    // (W.CLOSET_PEEK) y por la rendija oscura solo asoman sus ojos
    // mirándola (home.closetPeek los dibuja). El armario está en la
    // pared norte del pasillo (560–640 × 310–340), muy lejos de la
    // caja de visión de Ximena: la rendija y los ojos no invaden su
    // silueta. El protagonista NO se guarda: espera visible en su
    // esquina SE (605, 568), con |dx| = 95 de su eje.
    me.x = 605; me.y = 568; me.dir = 'down';
    S.partners.map((id) => home.actor(id)).filter(Boolean).forEach((a) => { a.x = 600; a.y = 346; a.dir = 'down'; a.hidden = true; });
    home.closetPeek = S.partners.slice();
    if (S.partners.length) W.closet.target = W.CLOSET_PEEK; // con 0 partners el armario queda cerrado, sin ojos
    const fledSpots = [[300, 150], [700, 220], [180, 470], [820, 180], [368, 430], [240, 244]];
    const fledActors = S.fled.map((id) => home.actor(id)).filter(Boolean);
    fledActors.forEach((a, i) => { const sp = fledSpots[i % fledSpots.length]; a.x = sp[0]; a.y = sp[1]; a.dir = 'down'; });
    res.inHand.forEach((id) => (S.inv[id] = true)); ui.refreshInv();
    G.setScene(home);
    const xi = home.xi; xi.hidden = false; xi.x = 510; xi.y = 650; xi.expr = 'tired'; xi.speed = 60; G.sfx('door');
    home.cam.x = 510; home.cam.z = 470; home.cam.dist = 620; home.cam.pitch = 0.8; home.follow(xi, 560);
    ui.header('Acto 1', 'Llegada de Ximena');
    ui.system('🔑 La puerta se abre.');
    home.roomies.forEach((r) => { if (r.hidden) return; r.expr = 'surprised'; r.hop(150); r.emo('!', 1); }); // los guardados no reaccionan a la vista: están dentro del armario
    xi.route = [[510, 548]]; await G.until(() => xi.arrived); xi.dir = 'up';
    xi.say('Ya llegué… 36 horas de guardia. No siento las piernas.', 3.2); await G.wait(3.4);
    // ---- LA HUIDA: los roomies NO reclutados salen despavoridos --------
    // Pánico (expresión de sorpresa), líneas cómicas y carrera en cadena
    // con micro-retrasos: pasan AL LADO de Ximena y salen por la puerta
    // principal. Al salir, desaparecen de la escena y de la run:
    // home.roomies queda = la party.
    if (fledActors.length) {
      const lines = ['¡Nosotros ya nos íbamos! 😅', '¡Se me quema el arroz!', '¡Mañana madrugo! ¡Chau!', '¡Uy, justo salía!', '¡Nos vemos… algún día!'];
      fledActors.forEach((a, i) => { a.expr = 'surprised'; a.emo('!!', 1.3); a.hop(170); if (i < 2) a.say(lines[i], 1.9); });
      await G.wait(0.9);
      // RUTA DE HUIDA: cada huido pasa AL LADO de Ximena — rozándola, ahí
      // está la gracia y el riesgo cómico — y sale por la PUERTA PRINCIPAL
      // (510, 706: el eje sur del pasillo por el que ella misma entró). El
      // punto de paso se calcula con la posición de Ximena EN ESTE MOMENTO
      // y los lados se alternan para que la envuelvan al pasar. La ruta se
      // deja en a.fleeRoute (la cadena con micro-retrasos la activa).
      fledActors.forEach((a, i) => {
        const sx = xi.x + (i % 2 ? 38 : -38), sy = xi.y;
        a.fleeRoute = W.path(a.x, a.y, sx, sy).concat([[510, 648], [510, 706]]);
        G.after(0.15 + i * 0.3, () => { a.speed = 208 + (i % 3) * 16; a.route = a.fleeRoute; });
      });
      await G.wait(1.05); // los primeros ya la están rozando: su reacción
      xi.hop(170); xi.emo('!!', 1.2);
      await G.until(() => fledActors.every((a) => a.arrived));
      fledActors.forEach((a) => { a.hidden = true; home.removeRoomie(a.id); });
      ui.system(`🏃 Los que no se quedaron (${fledActors.map((a) => G.CHARS[a.id].name).join(', ')}) salieron corriendo.`);
      // Ximena, extrañada; alguien de la party la despista como puede.
      xi.expr = 'suspicious'; xi.emo('?', 1.4);
      xi.say('¿Y ellos? ¿Por qué se fueron corriendo? 🤔', 3); await G.wait(3.2);
      // El despiste lo dice el PROTAGONISTA: los partners están dentro
      // del armario y si hablaran se delatarían. Casi se le escapa lo
      // de «guardados»… que es literalmente donde están los demás.
      me.say('Es que… ¡tenían examen mañana! Todos. El mismo examen. Y los demás ya están guardados— ¡DURMIENDO! En sus cuartos.', 3.4); await G.wait(3.6);
      xi.say('Mmm. Qué raro. Bueno… ya fue, estoy muerta de cansancio.', 2.4); await G.wait(2.5);
      xi.expr = 'tired';
      ui.system('Ximena se quedó un poco extrañada con la estampida.');
      apply({ sus: 3 });
    }
    if (res.inHand.length) {
      const names = res.inHand.map((id) => G.ITEMS[id].name.toLowerCase()).join(' y ');
      if (S.player === 'itzel') { xi.say('¿Y eso que llevas?', 2); await G.wait(2.1); me.say('Ropa para lavar 🙂', 2); await G.wait(2.1); xi.say('Ah. Ya.', 1.5); await G.wait(1.6); ui.system(`Itzel disimuló (${names}). Sin sospechas.`); }
      else { xi.expr = 'suspicious'; xi.emo('?', 1.2); xi.say(`¿Por qué tienes ${names} en la mano?`, 2.8); await G.wait(3); me.hop(140); me.say('¡Nada! Es… reciclaje.', 2.2); await G.wait(2.4); ui.system(`Ximena vio lo que no alcanzaste a guardar (${names}).`); apply({ sus: 9 * res.inHand.length }); xi.expr = 'tired'; }
    }
    if (S.flags.pollitoJugo) { xi.say('¿Y por qué Pollito anda arrastrando cosas por la casa?', 2.8); await G.wait(3); apply({ sus: 4 }); }
    if (!res.inHand.length && !S.flags.pollitoJugo) { xi.say('Bueno… ustedes quédense despiertos si quieren. Yo no existo hasta mañana.', 2.8); await G.wait(3); }
    xi.say('Me voy a dormir. Si alguien me despierta, lo opero sin anestesia.', 3.2); await G.wait(3.3);
    me.carry = [];
    W.xDoorOpen = true; xi.route = [[510, 455], [640, 455], [720, 455], [830, 430]]; xi.speed = 66;
    await G.until(() => xi.arrived);
    xi.hidden = true; home.xState = 'sleeping'; W.xDoorOpen = false; G.sfx('door');
    home.roomies.forEach((r) => (r.expr = null));
    // SALIDA DEL ARMARIO (2026-11-16): Ximena ya duerme, así que los
    // guardados salen de su escondite — la puerta se abre, salen de
    // uno en uno con micro-retrasos y un saltito, la puerta se cierra —
    // y la noche arranca con la party completa, exactamente como
    // siempre (asignaciones, casa y chat usan S.party). La secuencia
    // completa dura ~1,5 s con 3 partners; con 0, ni se abre.
    if (S.partners.length) {
      home.closetPeek = null;
      W.closet.target = 1; G.sfx('door');
      await G.wait(0.3);
      const outs = S.partners.map((id) => home.actor(id)).filter(Boolean);
      const outSpots = [[556, 404], [600, 394], [644, 404]];
      for (let i = 0; i < outs.length; i++) {
        const a = outs[i], sp = outSpots[i % outSpots.length];
        a.hidden = false; a.x = 600; a.y = 348; a.dir = 'down'; a.expr = 'happy'; a.hop(150);
        a.goTo(sp[0], sp[1], 130, true);
        await G.wait(0.28);
      }
      await G.until(() => outs.every((a) => a.arrived));
      W.closet.target = 0; G.sfx('door');
      outs.forEach((a) => (a.expr = null));
    }
    S.phase = 'act2'; home.setLight('noche'); home.setView('todo'); home.wander = true; recalc();
    await G.wait(1.2);
    home.showTitle('ACTO 2', 'OPERACIÓN: NO LA DESPIERTEN', 3.6);
    ui.system('Ximena se durmió.');
    await G.wait(3.4);
  }

  // =========================================================
  // FINAL LEYENDAS en la HISTORIA (pedido de Jose, 2026-11-21)
  // =========================================================
  // Habilitación (las 3 condiciones del guion, evaluadas al llegar
  // el clímax de las 00:00, ANTES del final estándar):
  //  1. Casting ganado al Alebrije (S.flags.casting): aparece UNA
  //     sola vez ~18:00 en la sala (beat tras el evento «cactus»),
  //     solo si la decoración ya va bien encaminada (≥2 zonas reales
  //     colocadas); si se pierde el casting, no reaparece.
  //  2. Decoración: ≥4 de las 6 zonas de la sala colocadas con
  //     ítems REALES recolectados (S.deco: placed && !improv) — el
  //     sistema real de Decoración Express; nada de un solo ítem.
  //  3. Preparación (S.quality, el stat real del HUD) ≥ 70 a las 23:00.
  // Si se cumplen las 3, corre la cadena del set (revelación →
  // pruebas de Teodora → resolución por regla de boss: ganar ≥1 =
  // final de película; 0/2 = se cae al final normal sin derrota).
  // PRIORIDAD: los finales alternativos se evalúan ANTES que el
  // final estándar. Entre ellos NO hay prioridad fija: si J1407b y
  // Leyendas se habilitan en la misma partida, ELIGE EL JUGADOR
  // (decisión de Jose, 2026-11-21 — ver altFinalsRoute y el clímax
  // de main()).
  function legendsDecoCount(st) { return (st.deco || []).filter((d) => d.placed && !d.improv).length; }
  function legendsReady(st) { return !!(st.flags && st.flags.casting) && legendsDecoCount(st) >= 4 && st.quality >= 70; }
  G.legendsDecoCount = legendsDecoCount; G.legendsReady = legendsReady; // expuestas para la prueba de humo

  // ---------- Habilitación del final J1407b (guion §1) ----------
  // Condiciones del guion con los stats REALES de la partida:
  //  1. Haber llegado a la zona ESPACIO y haber GANADO la Escalada
  //     (Repisas) en modo historia: marca S.flags.escaladaEspacio,
  //     la pone el resolve de MG.repisas con el campo `space` que
  //     ClimbDuel.extra() reporta. (No existía flag de historia para
  //     esto: se creó ahí.)
  //  2. Preparación ≥ 80 a las 23:00: el stat real es S.quality, el
  //     mismo que usa legendsReady (Leyendas pide ≥ 70).
  //  3. «Despertar» < 50 a las 23:00: en el código NO existe S.wake;
  //     el medidor real de riesgo de despertar es la SOSPECHA
  //     (S.sus, 0–100 %: a 100 Ximena despierta y hay ruina), así
  //     que la condición se evalúa como S.sus < 50.
  function spaceReady(st) {
    return !!(st.flags && st.flags.escaladaEspacio) && st.quality >= 80 && st.sus < 50;
  }
  G.spaceReady = spaceReady; // expuesta para la prueba de humo
  // Enrutado del clímax con AMBOS finales alternativos: 'ambos' |
  // 'espacio' | 'leyendas' | null (ninguno → final normal, sin
  // cambios). Función pura, expuesta para la prueba de humo.
  function altFinalsRoute(st) {
    const sp = spaceReady(st), lg = legendsReady(st);
    return sp && lg ? 'ambos' : sp ? 'espacio' : lg ? 'leyendas' : null;
  }
  G.altFinalsRoute = altFinalsRoute;
  G.startLegendsEnding = (done) => { // equivalente a G.startSpaceEnding de J1407b: cadena sin exigir condiciones
    const sc = new Sc.LegendsEndingScene(S.protagonist || S.player || 'natalia', done);
    G.setScene(sc);
    return sc;
  };
  async function legendsBeats(id) {
    // Siembra ~15:00 (tras «La imagen distinta»): el rumor del barrio
    if (id === 'imagen' && !S.flags.leyendasRumor) {
      S.flags.leyendasRumor = true;
      await ui.postAll([{ who: 'itzel', text: 'Oigan… dicen que están grabando una película de leyendas por el barrio 👀' }, { who: 'alan', text: '¿Con el Alebrije y todo? Ese ni existe.' }, { who: 'pollito', text: '😼' }]);
    }
    // Aparición del Alebrije ~18:00 (tras «Cactus en carrera»): una
    // sola vez y solo si la decoración va bien encaminada
    if (id === 'cactus' && !S.flags.alebrijeSeen && !S.flags.casting && legendsDecoCount(S) >= 2) {
      S.flags.alebrijeSeen = true;
      G.home.setView('sala');
      await runEvent('patron');
      const d = S.duels[S.duels.length - 1];
      if (d && d.game === 'patron' && d.win === 'win') S.flags.casting = true;
      else { S.flags.alebrijeGone = true; await ui.postAll([{ who: 'sistema', text: 'El Alebrije se escondió de nuevo entre la decoración. No va a volver.' }]); }
    }
  }

  // ---------- Siembra del final J1407b (guion §1) ----------
  // ~13:00 (tras el evento del APAGÓN, el de esa franja en G.STORY;
  // mismo mecanismo que el rumor de Leyendas tras «imagen» ~15:00):
  // llega al grupo la FOTO del cohete de los roomies NO reclutados,
  // los que huyeron al llegar Ximena: «no se fueron, están
  // orbitando». Es ambiente y pista del final espacial: no toca
  // ningún stat. La otra mitad de la siembra es el TELESCOPIO,
  // prop por código en la Escalada (ver ClimbDuel en scenes.js).
  async function spaceBeats(id) {
    if (id !== 'apagon' || S.flags.espacioFoto) return;
    S.flags.espacioFoto = true;
    await ui.postAll([
      { who: 'sistema', text: '📸 Alan comparte una foto en el grupo: el cohete de juguete de los que se fueron… con la Tierra de fondo.' },
      { who: 'alan', text: 'Me la mandaron los que «se fueron» a las 7. Miren el fondo. MIREN EL FONDO.' },
      { who: 'majo', text: 'No se fueron. Están ORBITANDO. 🛰️' },
      { who: 'sistema', text: 'Dicen que con un telescopio, desde bien alto, se les ve pasar. 🔭' },
    ]);
  }
  G.spaceBeats = spaceBeats; // expuesta para la prueba de humo

  async function actNight() {
    ui.raw('<div class="group">🎂 OPERACIÓN: NO LA DESPIERTEN</div>');
    const n = Object.keys(S.inv).length;
    await ui.postAll([{ who: 'majo', text: `Inventario: ${n} de ${Object.keys(G.ITEMS).length} cosas. ${n >= 9 ? 'Mejor de lo que esperaba.' : n >= 5 ? 'Vamos a tener que improvisar.' : 'Esto va a ser un desastre hermoso.'}` }]);
    for (const id of G.STORY) {
      if (await reactive()) return true;
      const ev = G.EVENTS[id];
      if (ev.when && !ev.when(S)) continue;
      await runEvent(id);
      await legendsBeats(id);
      await spaceBeats(id);
      if (await tick()) return true;
      await G.wait(0.6);
    }
    return reactive();
  }

  async function actReveal(ruina) {
    const home = G.home, xi = home.xi; S.phase = 'reveal'; home.wander = false;
    const spots = [[470, 150], [560, 250], [420, 240], [648, 186]];
    const jw = S.duels.filter((d) => d.boss === 'jose' && d.win === 'win').length;
    if (ruina) {
      ui.header('Final', 'Demasiadas pistas');
      await ui.postAll([{ who: 'ximena', text: 'ya. voy a salir a ver qué está pasando.', mood: 'suspicious', direct: true }, { who: 'majo', text: 'Nadie se mueva.', mood: 'surprised' }]);
    } else {
      ui.header('Acto 4', 'La gran revelación');
      if (jw >= 3) { S.flags.joseUne = true; await ui.postAll([{ who: 'jose', text: 'Ok. Me ganaron limpio. El amanecer puede esperar: yo prendo las velas.' }]); apply({ quality: 8 }); }
      await ui.postAll([{ who: 'majo', text: 'Es la hora. Todos a la sala. Posiciones.' }, { who: 'saulo', text: 'Pase lo que pase, fue un honor improvisar con ustedes.' }, { who: 'itzel', text: 'Yo la despierto. Tres… dos…' }]);
    }
    home.setView('sala');
    home.roomies.forEach((r, i) => r.goTo(spots[i][0], spots[i][1], 110));
    home.cat.goTo(530, 130, 120);
    if (S.flags.joseUne) { const j = home.jose; j.hidden = false; j.x = 510; j.y = 320; j.goTo(620, 262, 110, true); }
    await G.until(() => home.roomies.every((r) => r.arrived));
    home.roomies.forEach((r) => { r.dir = 'down'; r.expr = ruina ? 'surprised' : null; });
    home.xState = 'up'; W.xDoorOpen = true; xi.hidden = false; xi.x = 690; xi.y = 455; xi.expr = ruina ? 'suspicious' : 'tired'; xi.speed = 80; G.sfx('door');
    xi.route = [[640, 455], [510, 455], [510, 300], [510, 205]];
    await G.until(() => xi.arrived);
    xi.dir = 'up';
    if (ruina) { xi.emo('?', 1.5); xi.say('…¿Qué es todo esto?', 3); await G.wait(3.2); home.cat.say('miau.', 2); await G.wait(1.6); return 'ruina'; }
    home.setLight('fiesta', true); home.startConfetti(); G.sfx('party');
    const party = [...home.roomies, ...(S.flags.joseUne ? [home.jose] : [])];
    party.forEach((r) => { r.expr = 'happy'; r.say('¡SORPRESA!', 3); });
    const jump = setInterval(() => { if (!G.paused) party.forEach((r) => r.hop(150 + Math.random() * 70)); }, 520); // en pausa los saltos se detienen (es setInterval de pared)
    xi.expr = 'surprised'; xi.hop(180); xi.emo('!!', 1.4); await G.wait(2.2);
    const good = S.quality >= 45;
    xi.expr = 'happy'; xi.dir = 'down'; xi.say(good ? '¡¿Hicieron todo esto por mí?!' : 'JAJAJA ¿qué le pasó a la sala?', 3.2);
    await G.wait(3.6); clearInterval(jump);
    return good ? 'sorpresa' : 'caos';
  }

  async function showEnding(key) {
    const e = G.ENDINGS[key], text = typeof e.text === 'function' ? e.text(S) : e.text;
    const lvl = Math.min(4, Math.floor(S.quality / 20));
    const extras = [];
    if (S.flags.joseUne) extras.push('José se unió: prendió las velas y juró que el amanecer queda para otro día.');
    else extras.push('José se quedó en una esquina, abrazando sus flores.');
    if (S.flags.pastel === 'pan') extras.push('La vela en el pan se volvió tradición de la casa.');
    if (S.flags.pastel === 'torre') extras.push('La torre de bocaditos de Fátima salió en tres historias.');
    if (S.flags.regalo === 'pollito') extras.push('Pollito, con moño, fue oficialmente el regalo.');
    if (S.flags.regalo === 'cupones') extras.push('Ximena guardó los cupones de Saulo en su billetera.');
    ui.header('Final', e.title);
    await ui.modal(`<div class="ending ${e.tone}"><small>FINAL</small><h1>${e.title}</h1><p>${text}</p>${extras.length && key !== 'ruina' ? `<p class="dim">${extras.join(' ')}</p>` : ''}
      <div class="stats"><div><b>${'★'.repeat(lvl)}${'☆'.repeat(4 - lvl)}</b><span>Calidad de la fiesta (${S.quality})</span></div><div><b>${S.sus}%</b><span>Sospecha</span></div><div><b>${Object.keys(S.inv).length}/${Object.keys(G.ITEMS).length}</b><span>Objetos</span></div><div><b>${S.duels.filter((d) => d.win === 'win').length}/${S.duels.length}</b><span>Duelos ganados</span></div></div></div>`, 'JUGAR OTRA VEZ');
    location.reload();
  }

  // ---------- Final alternativo J1407b (SPACE_RINGS_ENDING) ----------
  // INTEGRADO A LA HISTORIA (rama feat/finales-integrados): la noche
  // evalúa G.spaceReady en el clímax de main() — Escalada espacial
  // ganada (S.flags.escaladaEspacio) + Preparación S.quality ≥ 80 +
  // Sospecha S.sus < 50 a las 23:00 — con la siembra del telescopio
  // en la Escalada (prop por código en ClimbDuel, scenes.js) y la
  // foto del cohete en el WhatsApp ~13:00 (spaceBeats). Si se cumple,
  // la cadena corre con esta misma función y cierra con
  // showEnding('espacio') — el final está registrado en G.ENDINGS.
  // DECISIÓN A RESUELTA por Jose (2026-11-21): si en una partida se
  // habilitan AMBOS finales alternativos (este y Leyendas), ELIGE EL
  // JUGADOR cuál jugar — sin prioridad fija ni azar (ver el clímax
  // de main() y G.altFinalsRoute).
  // DECISIÓN D RESUELTA por Jose (2026-11-21): los finales
  // alternativos pueden habilitarse DESDE CUALQUIER MOMENTO — desde
  // la primera partida, sin NG+ ni desbloqueo previo; por eso ni
  // G.spaceReady ni G.legendsReady miran historial de partidas.
  // Sigue pendiente de Jose, SOLO como nota de guion SIN efecto en
  // el código por ahora: (B) si J1407b es viaje real o sueño. (La
  // (C), desbloqueos a práctica/galería,
  // ya está cubierta de hecho: ambos finales viven en el menú de
  // práctica desde sus ramas.)
  // El final también se juega desde el menú de práctica («Final
  // J1407b», «Anillos de J1407b», «Cinturón de asteroides») o a mano
  // con esta función, que corre la cadena sin exigir condiciones.
  G.startSpaceEnding = function (done) {
    const who = S.player || 'natalia';
    G.captureKeys = true; $('#phone').classList.add('dim');
    new Promise((r) => G.setScene(new Sc.SpaceEndingScene(who, r))).then((res) => {
      G.captureKeys = false; $('#phone').classList.remove('dim');
      if (G.home) G.setScene(G.home);
      if (done) done(res);
    });
  };

  // ---------- Clímax: finales alternativos ----------
  // Cadena de Leyendas (comportamiento histórico, sin cambios):
  // devuelve true si hubo final de película; si Teodora gana las
  // dos pruebas (movie=false), se cae al final normal.
  async function runLegendsClimax() {
    ui.header('Final', 'La casa era un set');
    G.captureKeys = true;
    const out = await new Promise((r) => G.startLegendsEnding(r));
    G.captureKeys = false;
    G.setScene(G.home);
    if (out && out.movie) { await showEnding('leyendas'); return true; }
    await ui.postAll([{ who: 'sistema', text: 'El set se desmonta en silencio. La fiesta sigue… como fiesta.' }]);
    return false;
  }
  // Cadena de J1407b, espejo de la de Leyendas: G.startSpaceEnding
  // pone y quita captureKeys/dim y restaura la escena al terminar.
  // Perder el Cinturón NO cancela este final (solo magulla el
  // pastel): una vez lanzada la cadena, siempre cierra con
  // showEnding('espacio').
  async function runSpaceClimax() {
    ui.header('Final', 'El viaje a J1407b');
    await new Promise((r) => G.startSpaceEnding(r));
    G.setScene(G.home);
    await showEnding('espacio');
    return true;
  }

  async function main() {
    await Sp.ready;
    ui.refreshInv(); ui.refreshHUD();
    if (!hasGL) { overlay.innerHTML = '<div class="modal"><h2>Tu navegador no tiene WebGL activo</h2><p>El juego necesita WebGL para dibujar el departamento en 3D. Prueba con Chrome, Edge o Firefox actualizados.</p></div>'; overlay.classList.add('show'); return; }
    const bg = new Sc.HomeScene(); bg.wander = true; G.setScene(bg);
    requestAnimationFrame(frame);
    await titleScreen();
    // modo práctica: index.html?duelo=decoracion | pollito | mensajes | apagon | pizza | sonambula | memoria | cactus | repisas | pisoton | azotea
    const pr = /[?&]duelo=(\w+)/.exec(location.search);
    if (pr && G.EVENTS[pr[1]] && G.EVENTS[pr[1]].type === 'minigame') {
      S.player = 'natalia'; S.phase = 'act2';
      Object.keys(G.ITEMS).forEach((id) => (S.inv[id] = true)); ui.refreshInv();
      G.home = new Sc.HomeScene(); G.home.xState = 'sleeping'; G.home.wander = true; G.setScene(G.home);
      for (;;) { S.tired = null; await runEvent(pr[1]); await G.wait(1); }
    }
    S.player = await selectChar();
    const res = await actCollect();
    // La party queda fijada al cerrar la recolección: protagonista +
    // partners entregados en el armario. Los demás roomies son los que
    // huirán cuando Ximena cruce la puerta.
    S.partners = res.partners || [];
    S.party = [S.player, ...S.partners];
    S.fled = G.PLAYABLE.filter((id) => !S.party.includes(id));
    await actArrival(res);
    const ruina = await actNight();
    // CLÍMAX DE FINALES ALTERNATIVOS: se evalúan AMBOS antes de la
    // revelación estándar (G.altFinalsRoute). Solo uno listo → corre
    // ese final. AMBOS listos → ELIGE EL JUGADOR (decisión de Jose,
    // 2026-11-21): la elección se presenta en el chat con ui.choose
    // SIN temporizador — no hay presión de tiempo ni default oculto;
    // la partida espera el clic. Ninguno → final normal, intacto.
    if (!ruina) {
      const route = altFinalsRoute(S);
      if (route === 'ambos') {
        ui.header('Final', 'Dos finales posibles');
        await ui.postAll([
          { who: 'sistema', text: '✨ Esta noche se abrieron DOS caminos a la vez: el cohete de los huidos espera en el techo… y el equipo de la película, en la puerta.' },
          { who: 'majo', text: 'No se puede estar en dos finales a la vez. Elijan UNO.' },
        ]);
        const pick = await ui.choose([
          { label: 'Viaje a J1407b — la fiesta sobre los anillos' },
          { label: 'La película de Las Leyendas — la casa era un set' },
        ]);
        if (pick === 0) { await runSpaceClimax(); return; }
        if (await runLegendsClimax()) return;
      } else if (route === 'espacio') { await runSpaceClimax(); return; }
      else if (route === 'leyendas') { if (await runLegendsClimax()) return; }
    }
    const key = await actReveal(ruina);
    await showEnding(key);
  }
  G.debug = { S, apply, runEvent, tick, actArrival, actCollect };
  main();
})();
