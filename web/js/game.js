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
    flags: {}, deco: [], tired: null, done: {}, log: { fallos: 0, despertares: 0 },
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
  const cv = $('#cv'), ctx = cv.getContext('2d');
  const timers = [];
  G.wait = (s) => new Promise((r) => timers.push({ t: s, r }));
  G.until = (fn) => new Promise((r) => timers.push({ fn, r }));
  G.setScene = (sc) => { G.scene = sc; G.input.flush(); };
  let last = performance.now();
  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    for (let i = timers.length - 1; i >= 0; i--) { const tm = timers[i]; if (tm.fn ? tm.fn() : (tm.t -= dt) <= 0) { timers.splice(i, 1); tm.r(); } }
    if (G.scene) {
      G.scene.update(dt);
      ctx.setTransform(2, 0, 0, 2, 0, 0); ctx.imageSmoothingEnabled = false;
      G.scene.draw(ctx);
    }
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
      const ch = G.CHARS[m.who];
      const typing = ui.raw(`<div class="typing">${ch.name} está escribiendo…</div>`);
      await G.wait(ui.fast ? 0.05 : clamp(0.45 + m.text.length * 0.013, 0.5, 1.4));
      typing.remove();
      ui.raw(`<div class="msg ${m.direct ? 'direct' : ''}"><img class="av" src="${Sp.portrait(m.who, m.mood)}" alt=""><div class="bubble"><b style="color:${ch.color}">${ch.name}${m.direct ? ' <i>· chat directo</i>' : ''}</b>${m.text}</div></div>`);
      G.sfx('msg');
      await G.wait(ui.fast ? 0.05 : 0.35);
    },
    async postAll(list) { for (const m of list) await ui.post(m); ui.fast = false; },
    choose(options, timer) {
      return new Promise((res) => {
        actions.innerHTML = ''; let tm = null, left = timer;
        const finish = (i) => { if (tm) clearInterval(tm); actions.innerHTML = ''; ui.raw(`<div class="mine">${options[i].label}</div>`); res(i); };
        if (timer) {
          const bar = el('div', 'tbar', '<i></i>'); actions.appendChild(bar);
          tm = setInterval(() => { left -= 0.1; bar.firstChild.style.width = (left / timer) * 100 + '%'; if (left <= 0) finish(Math.max(0, options.findIndex((o) => o.timeout))); }, 100);
        }
        options.forEach((o, i) => {
          const miss = o.requires && !S.inv[o.requires];
          const b = el('button', 'opt', `<span>${'ABC'[i]}</span>${o.label}${miss ? ` <em>(falta: ${G.ITEMS[o.requires].name})</em>` : o.requires ? ` <em class="ok">(usa: ${G.ITEMS[o.requires].name})</em>` : ''}`);
          b.disabled = !!miss; b.onclick = () => finish(i); actions.appendChild(b);
        });
        ui.scroll();
      });
    },
    // tarjetas de asignación de personaje
    assign(prompt, info) {
      return new Promise((res) => {
        actions.innerHTML = `<div class="ask">${prompt}</div>`;
        const wrap = el('div', 'cards');
        G.PLAYABLE.forEach((id) => {
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

  // ---------- Pantallas iniciales ----------
  function titleScreen() {
    return ui.modal(`<div class="logo"><small>🎂</small><h1>1 MINUTO<br><span>PARA LA FIESTA</span></h1></div>
      <p>Siete roomies. Una fiesta sorpresa. Y Ximena, que vuelve de 36 horas de guardia, está por llegar.</p>
      <p class="dim">Recolecta lo que puedas en 60 segundos. Después: decide, improvisa y, sobre todo, <b>no la despiertes</b>.</p>`, 'JUGAR');
  }
  function selectChar() {
    return new Promise((res) => {
      overlay.innerHTML = `<div class="modal wide"><h2>¿A quién controlas en el minuto de recolección?</h2><div class="pick"></div><p class="dim">Los otros dos seguirán disponibles para los eventos de la noche.</p></div>`;
      overlay.classList.add('show');
      G.PLAYABLE.forEach((id) => {
        const c = G.CHARS[id];
        const stats = Object.keys(c.stats).map((k) => `<div class="st"><span>${G.STAT_LABEL[k]}</span><i><u style="width:${c.stats[k] * 10}%"></u></i><em>${c.stats[k]}</em></div>`).join('');
        const b = el('button', 'pcard', `<img src="${Sp.char(id, 'down', 0).toDataURL()}" alt=""><h3 style="color:${c.color}">${c.name}</h3><small>${c.role}</small>${stats}<p class="good">✔ ${c.skill}</p><p class="bad">✖ ${c.defect}</p>`);
        b.onclick = () => { overlay.classList.remove('show'); overlay.innerHTML = ''; G.sfx('ok'); res(id); };
        overlay.querySelector('.pick').appendChild(b);
      });
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
    if (ev.dark) home.targetDark = 0.8;
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
      ui.raw(`<div class="roll ${ok ? 'good' : 'bad'}">${ok ? '✔ ÉXITO' : '✖ FALLO'}</div>`); G.sfx(ok ? 'ok' : 'bad');
      const actor = home.actor(who); if (actor) { actor.expr = ok ? 'happy' : 'surprised'; setTimeout(() => (actor.expr = null), 4000); }
      await ui.postAll(br.reply(who));
      apply(br.effects, who);
      if (!ok) { S.log.fallos++; if (ev.kind === 'Amenaza' && who !== 'itzel') { await ui.post({ who: 'itzel', text: 'Yo le habría respondido MEJOR. Pero claro, nadie me pregunta.', mood: 'angry' }); apply({ noise: 5 }); } }
      S.tired = who;
    } else if (ev.type === 'minigame') {
      await runMinigame(ev);
    }
    if (ev.dark) home.targetDark = 0.3;
  }

  const MG = {
    deco: {
      stats: ['velocidad', 'logica'], Scene: () => Sc.DecoScene,
      setup() {
        const kinds = ['guirnalda', 'globos', 'luces'].filter((k) => S.inv[k]);
        S.deco = kinds.length ? W.DECO_SPOTS.map((s, i) => ({ i, kind: s.kind })).filter((d) => kinds.includes(d.kind)).map((d) => ({ i: d.i, improv: false, placed: false }))
          : [0, 2, 4].map((i) => ({ i, improv: true, placed: false }));
      },
      async resolve(r, who) {
        const improv = S.deco[0] && S.deco[0].improv;
        if (r.placed === r.total) await ui.postAll([{ who: 'samantha', text: improv ? 'Ok, el papel higiénico tiene… ¿encanto? Digamos que sí.' : 'QUEDÓ HERMOSO. Juro que no subo nada. (Todavía.)', mood: 'happy' }]);
        else if (r.placed > 0) await ui.postAll([{ who: 'majo', text: `Quedaron ${r.total - r.placed} zonas sin decorar. Es lo que hay.` }]);
        else { await ui.postAll([{ who: 'majo', text: 'No se colgó NADA. ¿Qué estuvieron haciendo?', mood: 'angry' }]); S.log.fallos++; }
        apply({ quality: r.placed * (improv ? 2 : 4) }, who);
      },
    },
    hide: {
      stats: ['velocidad', 'sigilo'], Scene: () => Sc.HideScene, setup() {},
      async resolve(r, who) {
        if (r.seen === 0 && !r.seenPlayer) { await ui.postAll([{ who: 'itzel', text: 'Pasó, tomó agua y volvió. Ni cuenta se dio.', mood: 'happy' }]); apply({ sus: -6, sleep: -1 }, who); }
        else if (r.seen === 0) { await ui.postAll([{ who: 'natalia', text: 'Te vio a ti, pero no vio nada más. Aceptable.' }]); apply({}, who); }
        else { await ui.postAll([{ who: 'ximena', text: 'creo que estoy soñando. vi cosas raras en la sala.', mood: 'suspicious', direct: true }, { who: 'majo', text: `Vio ${r.seen} cosa${r.seen > 1 ? 's' : ''}. Recemos para que crea que fue un sueño.`, mood: 'angry' }]); S.log.fallos++; apply({ sleep: 1 }, who); }
      },
    },
    pollito: {
      stats: ['velocidad'], Scene: () => Sc.PollitoScene, setup() {},
      async resolve(r, who) {
        const t = r.target;
        if (r.caught) { await ui.postAll([{ who, text: `Lo tengo. Recuperé ${t.article}. Sólo tiene un poquito de baba.`, mood: 'happy' }, { who: 'pollito', text: '😾' }]); apply({ quality: 3 }, who); }
        else if (t.id === 'control') { S.flags.tvOn = true; await ui.postAll([{ who: 'sistema', text: '📺 Pollito pisó el control. La tele se prende a todo volumen.' }, { who: 'alan', text: '¡APÁGUENLA!', mood: 'surprised' }]); S.log.fallos++; apply({ noise: 24 }, who); setTimeout(() => (S.flags.tvOn = false), 6000); }
        else {
          delete S.inv[t.id]; ui.refreshInv(); S.log.fallos++;
          if (t.id === 'regalo') S.flags.regaloRoto = true;
          await ui.postAll([{ who: 'natalia', text: `No lo alcanzamos. ${t.name}: destruido. Descansa en paz.`, mood: 'surprised' }, { who: 'pollito', text: '😸' }]);
          ui.system(`Perdiste: ${t.name}`); apply({ noise: 6 }, who);
        }
      },
    },
  };

  async function runMinigame(ev) {
    const mg = MG[ev.game];
    const who = await ui.assign('¿Quién va?', (c) => ({ stats: statLine(c, mg.stats), note: c === 'alan' ? 'Suma ruido' : c === 'itzel' && ev.game === 'hide' ? 'Esconde el doble de rápido' : '' }));
    mg.setup();
    const c = G.CHARS[who];
    await ui.modal(`<h2>${ev.title}</h2><img class="hero" src="${Sp.char(who, 'down', 0).toDataURL()}" alt=""><p>${ev.intro}</p><p class="dim">Juega <b style="color:${c.color}">${c.name}</b> · WASD/flechas para moverte · ESPACIO para actuar</p>`, '¡EMPEZAR!');
    G.captureKeys = true; $('#phone').classList.add('dim');
    const res = await new Promise((r) => G.setScene(new (mg.Scene())(who, r)));
    G.captureKeys = false; $('#phone').classList.remove('dim');
    G.setScene(G.home);
    await mg.resolve(res, who);
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
    ['majo|Ximena sale de guardia y viene para acá. Tenemos UN minuto.', 'fatima|El pastel quedó en algún lado. No me miren así.', 'majo|Agarren todo lo que sirva y guárdenlo en el armario del pasillo. Lo que no esté guardado cuando llegue, lo va a ver.'].forEach((l) => { const [w, t] = l.split('|'); ui.raw(`<div class="msg"><img class="av" src="${Sp.portrait(w)}" alt=""><div class="bubble"><b style="color:${G.CHARS[w].color}">${G.CHARS[w].name}</b>${t}</div></div>`); });
    G.captureKeys = true; $('#phone').classList.add('dim');
    let scene;
    const res = await new Promise((r) => G.setScene((scene = new Sc.CollectScene(S.player, r))));
    G.captureKeys = false; $('#phone').classList.remove('dim');
    return { ...res, x: scene.p.x, y: scene.p.y };
  }

  async function actArrival(res) {
    S.phase = 'arrival'; S.sus = 5; S.sleep = 1;
    const home = (G.home = new Sc.HomeScene());
    const me = home.actor(S.player); me.x = res.x; me.y = res.y; me.carry = res.inHand.slice();
    home.roomies.filter((r) => r !== me).forEach((r, i) => { r.x = 290 + i * 84; r.y = 330 + i * 6; r.dir = "up"; });
    res.inHand.forEach((id) => (S.inv[id] = true)); ui.refreshInv();
    G.setScene(home);
    const xi = home.xi; xi.hidden = false; xi.expr = 'tired'; G.sfx('door');
    ui.header('Acto 1', 'Llegada de Ximena');
    ui.system('🔑 La puerta se abre.');
    home.roomies.forEach((r) => (r.expr = 'surprised'));
    await G.wait(0.8);
    xi.say('Ya llegué… 36 horas de guardia. No siento las piernas.', 3.2); await G.wait(3.4);
    if (res.inHand.length) {
      const names = res.inHand.map((id) => G.ITEMS[id].name.toLowerCase()).join(' y ');
      if (S.player === 'itzel') { xi.say('¿Y eso que llevas?', 2); await G.wait(2.1); me.say('Ropa para lavar 🙂', 2); await G.wait(2.1); xi.say('Ah. Ya.', 1.5); await G.wait(1.6); ui.system(`Itzel disimuló (${names}). Sin sospechas.`); }
      else { xi.expr = 'suspicious'; xi.say(`¿Por qué tienes ${names} en la mano?`, 2.8); await G.wait(3); me.say('¡Nada! Es… reciclaje.', 2.2); await G.wait(2.4); ui.system(`Ximena vio lo que no alcanzaste a guardar (${names}).`); apply({ sus: 9 * res.inHand.length }); xi.expr = 'tired'; }
    }
    if (S.flags.pollitoJugo) { xi.say('¿Y por qué Pollito anda arrastrando cosas por la casa?', 2.8); await G.wait(3); apply({ sus: 4 }); }
    if (!res.inHand.length && !S.flags.pollitoJugo) { xi.say('Qué raro verlos a todos despiertos y… parados.', 2.6); await G.wait(2.8); }
    xi.say('Me voy a dormir. Si alguien me despierta, lo opero sin anestesia.', 3.2); await G.wait(3.3);
    me.carry = [];
    W.xDoorOpen = true; xi.route = [[253, 292], [446, 292], [560, 296]]; xi.speed = 46;
    await G.until(() => xi.arrived);
    xi.hidden = true; home.xState = 'sleeping'; W.xDoorOpen = false; G.sfx('door');
    home.roomies.forEach((r) => (r.expr = null));
    S.phase = 'act2'; home.targetDark = 0.3; home.wander = true; recalc();
    home.showTitle('ACTO 2', 'OPERACIÓN: NO LA DESPIERTEN', 3.6);
    ui.system('Ximena se durmió.');
    await G.wait(3.4);
  }

  async function actNight() {
    ui.raw('<div class="group">🎂 OPERACIÓN: NO LA DESPIERTEN</div>');
    const n = Object.keys(S.inv).length;
    await ui.postAll([{ who: 'majo', text: `Inventario: ${n} de 10 cosas. ${n >= 7 ? 'Mejor de lo que esperaba.' : n >= 4 ? 'Vamos a tener que improvisar.' : 'Esto va a ser un desastre hermoso.'}` }]);
    for (const id of G.STORY) {
      if (await reactive()) return true;
      const ev = G.EVENTS[id];
      if (ev.when && !ev.when(S)) continue;
      await runEvent(id);
      if (await tick()) return true;
      await G.wait(0.6);
    }
    return reactive();
  }

  async function actReveal(ruina) {
    const home = G.home, xi = home.xi; S.phase = 'reveal'; home.wander = false;
    const spots = [[290, 140], [360, 160], [250, 110]];
    if (ruina) {
      ui.header('Final', 'Demasiadas pistas');
      await ui.postAll([{ who: 'ximena', text: 'ya. voy a salir a ver qué está pasando.', mood: 'suspicious', direct: true }, { who: 'majo', text: 'Nadie se mueva.', mood: 'surprised' }]);
    } else {
      ui.header('Acto 4', 'La gran revelación');
      await ui.postAll([{ who: 'majo', text: 'Es la hora. Todos a la sala. Posiciones.' }, { who: 'saulo', text: 'Pase lo que pase, fue un honor improvisar con ustedes.' }, { who: 'itzel', text: 'Yo la despierto. Tres… dos…' }]);
    }
    home.roomies.forEach((r, i) => r.goTo(spots[i][0], spots[i][1], 70));
    home.cat.goTo(330, 130, 80);
    await G.until(() => home.roomies.every((r) => r.arrived));
    home.roomies.forEach((r) => { r.dir = 'down'; r.expr = ruina ? 'surprised' : null; });
    home.xState = 'up'; W.xDoorOpen = true; xi.hidden = false; xi.x = 458; xi.y = 292; xi.expr = ruina ? 'suspicious' : 'tired'; xi.speed = 52; G.sfx('door');
    xi.route = [[326, 292], [326, 196], [326, 132]];
    await G.until(() => xi.arrived);
    xi.dir = 'up';
    if (ruina) { xi.say('…¿Qué es todo esto?', 3); await G.wait(3.2); home.cat.say('miau.', 2); await G.wait(1.6); return 'ruina'; }
    home.targetDark = 0; home.darkness = 0; home.startConfetti(); G.sfx('party');
    home.roomies.forEach((r) => { r.frameOverride = 3; r.expr = 'happy'; r.say('¡SORPRESA!', 3); });
    xi.expr = 'surprised'; await G.wait(2.2);
    const good = S.quality >= 45;
    xi.expr = 'happy'; xi.dir = 'down'; xi.say(good ? '¡¿Hicieron todo esto por mí?!' : 'JAJAJA ¿qué le pasó a la sala?', 3.2);
    await G.wait(3.4);
    return good ? 'sorpresa' : 'caos';
  }

  async function showEnding(key) {
    const e = G.ENDINGS[key], text = typeof e.text === 'function' ? e.text(S) : e.text;
    const lvl = Math.min(4, Math.floor(S.quality / 20));
    const extras = [];
    if (S.flags.jose === 'aliado') extras.push('José llegó con hielo y no tocó el timbre.');
    if (S.flags.pastel === 'pan') extras.push('La vela en el pan se volvió tradición de la casa.');
    if (S.flags.pastel === 'torre') extras.push('La torre de bocaditos de Fátima salió en tres historias.');
    if (S.flags.regalo === 'pollito') extras.push('Pollito, con moño, fue oficialmente el regalo.');
    if (S.flags.regalo === 'cupones') extras.push('Ximena guardó los cupones de Saulo en su billetera.');
    ui.header('Final', e.title);
    await ui.modal(`<div class="ending ${e.tone}"><small>FINAL</small><h1>${e.title}</h1><p>${text}</p>${extras.length && key !== 'ruina' ? `<p class="dim">${extras.join(' ')}</p>` : ''}
      <div class="stats"><div><b>${'★'.repeat(lvl)}${'☆'.repeat(4 - lvl)}</b><span>Calidad de la fiesta (${S.quality})</span></div><div><b>${S.sus}%</b><span>Sospecha</span></div><div><b>${Object.keys(S.inv).length}/10</b><span>Objetos</span></div><div><b>${S.log.fallos}</b><span>Tropiezos</span></div></div></div>`, 'JUGAR OTRA VEZ');
    location.reload();
  }

  async function main() {
    ui.refreshInv(); ui.refreshHUD();
    const bg = new Sc.HomeScene(); bg.wander = true; G.setScene(bg);
    requestAnimationFrame(frame);
    await titleScreen();
    S.player = await selectChar();
    const res = await actCollect();
    await actArrival(res);
    const ruina = await actNight();
    const key = await actReveal(ruina);
    await showEnding(key);
  }
  G.debug = { S, apply, runEvent, tick };
  main();
})();
