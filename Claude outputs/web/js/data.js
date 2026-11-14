/* ============================================================
   DATOS DEL JUEGO (contenido basado en datos, GDD §28)
   Personajes, objetos, eventos y finales viven aquí;
   la lógica en game.js sólo los interpreta.
   ============================================================ */
(function () {
  'use strict';
  const G = (window.G = window.G || {});

  // ---------- Personajes ----------
  G.CHARS = {
    natalia: {
      name: 'Natalia', role: 'La atleta impaciente', color: '#3d8bff', playable: true,
      stats: { velocidad: 9, sigilo: 3, carisma: 5, logica: 5 },
      skill: 'Sprint: es la más rápida recolectando y en eventos físicos.',
      defect: 'Impaciente: −3 en pruebas de paciencia y discreción.',
    },
    itzel: {
      name: 'Itzel', role: 'La confidente celosa', color: '#f08cc0', playable: true,
      stats: { velocidad: 5, sigilo: 8, carisma: 7, logica: 4 },
      skill: 'Coartada: +4 al calmar a Ximena y esconde evidencias al doble de velocidad.',
      defect: 'Celosa: si alguien más falla frente a Ximena, lo toma personal (+ruido).',
    },
    alan: {
      name: 'Alan', role: 'El DJ / técnico', color: '#b7e02a', playable: true,
      stats: { velocidad: 7, sigilo: 3, carisma: 8, logica: 5 },
      skill: 'Técnico: +4 en problemas eléctricos y carga objetos pesados sin frenarse.',
      defect: 'Ruidoso: todo lo que hace suma ruido.',
    },
    // Roomies que por ahora sólo participan en el chat
    majo: { name: 'Majo', color: '#7f93d8' },
    saulo: { name: 'Saulo', color: '#d98a62' },
    fatima: { name: 'Fátima', color: '#e0b77a' },
    samantha: { name: 'Samantha', color: '#e04fc4' },
    ximena: { name: 'Ximena', color: '#b48cf0' },
    jose: { name: 'José', color: '#5fae77', boss: 'El novio. Tiene su propio plan de cumpleaños.' },
    pollito: { name: 'Pollito', color: '#f0a04a', boss: 'El gato. Una fuerza del caos.' },
  };
  G.PLAYABLE = ['natalia', 'itzel', 'alan'];
  G.STAT_LABEL = { velocidad: 'Velocidad', sigilo: 'Sigilo', carisma: 'Carisma', logica: 'Lógica' };

  // ---------- Objetos del minuto de recolección ----------
  // slots: espacio que ocupa en las manos (máx. 2).  q: aporte a la Calidad de la fiesta.
  G.ITEMS = {
    pastel:       { name: 'Pastel', cat: 'comida', slots: 2, q: 15, hint: 'Sin pastel tocará improvisar.' },
    bocaditos:    { name: 'Bocaditos', cat: 'comida', slots: 1, q: 8, hint: 'Comida para la fiesta.' },
    bebidas:      { name: 'Bebidas', cat: 'comida', slots: 2, q: 8, hint: 'Pesan, pero suben la fiesta.' },
    globos:       { name: 'Globos', cat: 'deco', slots: 1, q: 5, hint: 'Decoración: +2 zonas.' },
    guirnalda:    { name: 'Guirnalda', cat: 'deco', slots: 1, q: 5, hint: 'Decoración: +2 zonas.' },
    luces:        { name: 'Luces', cat: 'deco', slots: 1, q: 5, hint: 'Decoración: +2 zonas.' },
    herramientas: { name: 'Herramientas', cat: 'util', slots: 2, q: 0, hint: 'Facilita eventos técnicos.' },
    premios:      { name: 'Atún de Pollito', cat: 'util', slots: 1, q: 0, hint: 'Soborno felino.' },
    regalo:       { name: 'Regalo', cat: 'regalo', slots: 1, q: 12, hint: 'El regalo de Ximena.' },
    parlante:     { name: 'Parlante', cat: 'util', slots: 2, q: 6, hint: 'Música… o ruido blanco.' },
  };

  G.SLEEP = ['Dormida profundamente', 'Dormida', 'Sueño ligero', 'Inquieta', 'Casi despierta', '¡DESPIERTA!'];

  const has = (s, id) => !!s.inv[id];

  // ---------- Eventos ----------
  // type: 'decision' | 'assign' | 'minigame'
  // chat: lista de mensajes {who, text, mood} — o función (s) => lista
  // effects: { sus, noise, sleep, quality }   flags: { nombre: valor }
  G.EVENTS = {
    cajas: {
      title: 'Las cajas del pasillo', kind: 'Gestión', type: 'decision', view: 'pasillo',
      chat: [
        { who: 'majo', text: '¿Quién dejó las cajas en el pasillo?' },
        { who: 'natalia', text: 'Yo no fui.' },
        { who: 'alan', text: 'Hay literalmente una caja que dice "FIESTA SORPRESA".', mood: 'surprised' },
        { who: 'saulo', text: 'Artísticamente, representa nuestra fragilidad como grupo.' },
        { who: 'majo', text: 'SAULO.', mood: 'angry' },
      ],
      options: [
        { label: 'Esconder las cajas en el cuarto', effects: { noise: 8 }, flags: { cajas: 'ocultas' },
          reply: [{ who: 'itzel', text: 'Listo. Debajo de la cama de Natalia. Nadie mira ahí por decisión propia.' }] },
        { label: 'Culpar al gato y dejarlas ahí', effects: {}, flags: { cajas: 'pasillo', pollitoOfendido: true },
          reply: [{ who: 'pollito', text: '…' }, { who: 'fatima', text: 'Pollito nos está mirando feo. Esto va a traer consecuencias.' }] },
        { label: 'Llevarlas al balcón', effects: { noise: 16, quality: 3 }, flags: { cajas: 'ocultas' },
          reply: [{ who: 'alan', text: 'Ya están afuera. Sólo se cayó una. Dos. Bueno, casi no sonó.' }] },
      ],
    },

    decoracion: {
      title: 'Decoración Express', kind: 'Duelo', type: 'minigame', game: 'deco', boss: 'pollito', view: 'sala',
      chat: (s) => {
        const n = ['globos', 'guirnalda', 'luces'].filter((i) => has(s, i)).length;
        return [
          { who: 'majo', text: 'Fase uno: decorar la sala. Rápido, preciso y en SILENCIO.' },
          n === 0
            ? { who: 'samantha', text: 'Chicos… no conseguimos ni una sola decoración. Tengo papel higiénico y post-its. Es "minimalista".', mood: 'surprised' }
            : { who: 'samantha', text: `Tenemos material para ${n * 2} zonas. Quiero que se vea increíble en las fotos.` },
          { who: 'pollito', text: '😼' },
          { who: 'fatima', text: 'Pollito ya está mirando las guirnaldas como si fueran presas. Suerte.' },
        ];
      },
      intro: 'Cuelga las decoraciones: acércate a cada zona y presiona ESPACIO cuando la barra esté en verde. Pollito va a intentar tirarlas: párate junto a él y presiona ESPACIO para espantarlo.',
      goal: 'Termina con más decoraciones colgadas que caídas.',
    },

    whatsapp: {
      title: 'El interrogatorio de WhatsApp', kind: 'Amenaza', type: 'assign', view: 'xroom',
      chat: [
        { who: 'ximena', text: 'oigan', mood: 'tired', direct: true },
        { who: 'ximena', text: 'me despertó una notificación del banco. ¿quién gastó S/ 85 en "Globos & Más" con la tarjeta de la casa?', mood: 'suspicious', direct: true },
        { who: 'saulo', text: 'NOS ESCRIBIÓ. ESTÁ DESPIERTA.', mood: 'surprised' },
        { who: 'majo', text: 'Que responda UNA sola persona. Con calma.' },
      ],
      pre: { sleep: 1 },
      test: { stats: ['carisma', 'logica'], dc: 12, bonus: { itzel: 4, natalia: -3 }, prompt: '¿Quién le responde a Ximena?' },
      success: { effects: { sus: -10, sleep: -1 }, reply: (who) => [
        { who, text: 'Fue para el cumple del sobrino de Majo. Te devolvemos la plata mañana, duerme tranqui 💜' },
        { who: 'ximena', text: 'ah ya. ok. buenas noches zzz', mood: 'tired', direct: true },
      ] },
      fail: { effects: { sus: 16 }, reply: (who) => [
        { who, text: '¿Qué globos? Nadie compró globos. ¿Quién dijo globos? Tú dijiste globos.' },
        { who: 'ximena', text: '…yo sólo pregunté por la tarjeta.', mood: 'suspicious', direct: true },
        { who: 'majo', text: 'Excelente. Impecable. Nos descubre en diez minutos.', mood: 'angry' },
      ] },
    },

    apagon: {
      title: 'El apagón', kind: 'Gestión', type: 'assign', dark: true,
      chat: [
        { who: 'sistema', text: '⚡ Se fue la luz en todo el departamento.' },
        { who: 'fatima', text: 'No veo nada. Acabo de abrazar el refrigerador pensando que era Saulo.' },
        { who: 'saulo', text: 'La oscuridad sólo revela lo que ya éramos.' },
        { who: 'alan', text: 'Es la llave general. Alguien tiene que ir a la caja de luz.' },
      ],
      test: { stats: ['logica', 'velocidad'], dc: 11, bonus: { alan: 4 }, itemBonus: { herramientas: 3 }, prompt: '¿Quién arregla la luz?' },
      success: { effects: { quality: 4 }, reply: (who) => [
        { who, text: 'Listo, volvió la luz. Era un fusible.' },
        { who: 'fatima', text: 'Perdón, refrigerador. Fue lindo mientras duró.' },
      ] },
      fail: { effects: { noise: 22, quality: -5, sleep: 1 }, reply: (who) => [
        { who, text: 'Me tropecé con algo. Con varios algos. Uno era de vidrio.', mood: 'surprised' },
        { who: 'majo', text: 'Eso sonó hasta en el primer piso.', mood: 'angry' },
        { who: 'sistema', text: 'La luz vuelve sola un rato después. El daño ya está hecho.' },
      ] },
    },

    pollito: {
      title: 'Pollito robó algo', kind: 'Duelo', type: 'minigame', game: 'pollito', boss: 'pollito', view: 'sala',
      chat: (s) => {
        const t = G.pollitoTarget(s);
        return [
          { who: 'itzel', text: `¿Alguien movió ${t.article}?`, mood: 'suspicious' },
          { who: 'natalia', text: 'Yo no.' },
          { who: 'pollito', text: '😼' },
          { who: 'alan', text: 'Pollito se lo llevó en el hocico. Lo acabo de ver cruzar la sala.', mood: 'surprised' },
          s.flags.pollitoOfendido ? { who: 'fatima', text: 'Les dije que lo de culparlo iba a traer consecuencias.' } : { who: 'majo', text: 'Atrápenlo. Sin gritar.' },
        ];
      },
      intro: 'Persigue a Pollito por la sala y embístelo con ESPACIO para quitarle un corazón. Salta por encima si lo acorralas mal y va dejando ovillos: si pisas uno, te resbalas.',
      goal: 'Déjalo sin corazones antes de que se acabe el tiempo.',
    },

    jose: {
      title: 'José escribe', kind: 'Amenaza', type: 'decision',
      chat: [
        { who: 'jose', text: 'Hola chicos. ¿Xime ya llegó? No me contesta.', direct: true },
        { who: 'jose', text: 'Tengo un plan: despertarla a las 4 am y llevarla a ver el amanecer por su cumple 🌅 Ya estoy saliendo.', direct: true },
        { who: 'samantha', text: 'NO. Ni se te ocurra despertarla.', mood: 'surprised' },
        { who: 'saulo', text: 'El novio. El eterno tercer acto.' },
      ],
      options: [
        { label: 'Contarle lo de la fiesta', effects: {}, flags: { jose: 'aliado' },
          reply: [{ who: 'jose', text: '¿Una fiesta? ¿Y nadie me avisó? Ok… pero mi plan del amanecer es mejor. Que gane el mejor 😎', direct: true }, { who: 'majo', text: 'Genial. Ahora es una competencia.' }] },
        { label: '"Está dormida, mejor ven mañana"', effects: { sus: 3 }, flags: { jose: 'no_sabe' },
          reply: [{ who: 'jose', text: 'Por eso mismo. Le escribo ahorita para despertarla suavecito.', direct: true }, { who: 'itzel', text: 'Le va a reventar el celular a mensajes.', mood: 'angry' }] },
        { label: 'Dejarlo en visto', effects: { sus: 6 }, flags: { jose: 'desconfia' },
          reply: [{ who: 'jose', text: 'Me dejaron en visto. Sospechoso. Voy para allá YA.', direct: true }, { who: 'saulo', text: 'Lo hemos vuelto más fuerte.' }] },
      ],
    },

    mensajes: {
      title: 'Batalla de mensajes', kind: 'Duelo', type: 'minigame', game: 'mensajes', boss: 'jose', view: 'xroom',
      chat: [
        { who: 'itzel', text: 'José le está escribiendo a Xime sin parar. Si le vibra el celular diez veces más, se despierta.', mood: 'angry' },
        { who: 'ximena', text: 'mmm… ¿quién escribe tanto?', mood: 'tired', direct: true },
        { who: 'majo', text: 'Alguien respóndale desde el chat de la casa ANTES de que lleguen los mensajes de José. Con calma. Para que se duerma.' },
      ],
      intro: 'Ximena escribe medio dormida. Elige con ← ↑ → la respuesta que la tranquiliza, antes de que José termine de escribir la suya. Una respuesta equivocada le da el punto a José.',
      goal: 'Gana la mayoría de las 5 rondas.',
      results: {
        win: { effects: { sus: -8, sleep: -1 }, reply: () => [{ who: 'ximena', text: 'ya, silencié el cel. buenas noches zzz', mood: 'tired', direct: true }, { who: 'jose', text: 'Ok, ok. Está dormida. Pero igual voy para allá.', direct: true }] },
        lose: { effects: { sus: 6, sleep: 1, noise: 10 }, reply: () => [{ who: 'ximena', text: '¿por qué me vibra tanto el celular? ¿pasa algo?', mood: 'suspicious', direct: true }, { who: 'majo', text: 'José: 1. Nosotros: 0.', mood: 'angry' }] },
      },
    },

    pizza: {
      title: 'Pizza silenciosa', kind: 'Duelo', type: 'minigame', game: 'pizza', boss: 'jose',
      chat: [
        { who: 'fatima', text: 'Llegó el delivery. Está abajo, en la entrada del edificio.' },
        { who: 'alan', text: '…y José acaba de bajar de un taxi con flores. Va directo a nuestro timbre.', mood: 'surprised' },
        { who: 'majo', text: 'Alguien sube con la comida y llega a la puerta ANTES que él. Y sin botar nada: ese pasillo tiene eco.' },
      ],
      intro: 'Carrera por el pasillo del edificio. Mantén → para avanzar y usa ↑ ↓ para mantener la pizza en la zona verde. Mientras más rápido corras, más se tambalea. Si se cae, pierdes tiempo y haces ruido.',
      goal: 'Llega a la puerta 3B antes que José.',
      results: {
        win: { effects: { quality: 6 }, reply: (who) => [{ who, text: 'Llegué primero y le cerré la puerta con el pie. Elegante.', mood: 'happy' }, { who: 'jose', text: 'Buena carrera. Me quedo en el pasillo… por ahora.', direct: true }] },
        lose: { effects: { noise: 24, sus: 4 }, reply: () => [{ who: 'sistema', text: '🔔 José toca el timbre. Tres veces.' }, { who: 'majo', text: 'ÁBRANLE antes de que toque una cuarta.', mood: 'angry' }, { who: 'jose', text: '¡Hola! ¿Y Xime?' }] },
      },
    },

    sonambula: {
      title: 'Sonámbula', kind: 'Duelo', type: 'minigame', game: 'sonambula', boss: 'jose', view: 'sala',
      chat: [
        { who: 'sistema', text: '🚪 La puerta de Ximena se abre sola.' },
        { who: 'itzel', text: 'Está sonámbula. Camina dormida hacia la sala.', mood: 'surprised' },
        { who: 'jose', text: 'Es mi oportunidad. Si llego a ella primero, me la llevo a ver el amanecer.' },
        { who: 'natalia', text: 'Sobre mi cadáver. Bueno, sobre el de quien vaya.' },
      ],
      intro: 'Ximena está de espaldas, dormida. Mantén → para avanzar hacia ella, pero cuando murmure y voltee, ¡suelta todo y quédate quieto! Si te ve moverte, retrocedes y sube la sospecha. José juega con las mismas reglas.',
      goal: 'Llega hasta Ximena antes que José.',
      results: {
        win: { effects: { sus: -6, sleep: -2, quality: 4 }, reply: (who) => [{ who, text: 'La llevé de la mano hasta su cama. Ni se enteró.', mood: 'happy' }, { who: 'jose', text: '…Está bien. Ustedes ganan. ¿En qué ayudo?' }] },
        tie: { effects: { sleep: 1 }, reply: () => [{ who: 'itzel', text: 'Se dio media vuelta sola y regresó a su cuarto. Nadie ganó, nadie perdió.' }] },
        lose: { effects: { sus: 12, sleep: 2 }, reply: () => [{ who: 'jose', text: '¡Xime! ¡Amor! ¡Feliz…!' }, { who: 'ximena', text: '¿José…? ¿qué haces aquí? ¿qué hora es?', mood: 'suspicious', direct: true }, { who: 'majo', text: 'La despertó. LA DESPERTÓ.', mood: 'angry' }, { who: 'itzel', text: 'La regresé a su cama diciéndole que era un sueño. No sé si me creyó.' }] },
      },
    },

    sinPastel: {
      title: 'No hay pastel', kind: 'Gestión', type: 'decision',
      when: (s) => !has(s, 'pastel'),
      chat: [
        { who: 'fatima', text: 'Pregunta incómoda: ¿y el pastel?' },
        { who: 'natalia', text: '…' },
        { who: 'alan', text: 'No hay pastel.' },
        { who: 'saulo', text: 'Un cumpleaños sin pastel es sólo un martes con testigos.' },
      ],
      options: [
        { label: 'Torre de bocaditos con una vela', requires: 'bocaditos', effects: { quality: 9 }, flags: { pastel: 'torre' },
          reply: [{ who: 'fatima', text: 'Denme diez minutos y una vela. Esto va a ser arquitectura.' }] },
        { label: 'Sumar un pastel al delivery', effects: { quality: 12, noise: 5 }, flags: { pastel: 'delivery' },
          reply: [{ who: 'samantha', text: 'Agregado al pedido. Le puse "NO TOCAR TIMBRE" en mayúsculas.' }] },
        { label: 'Una vela clavada en un pan', effects: { quality: 3 }, flags: { pastel: 'pan', caos: true },
          reply: [{ who: 'saulo', text: 'Humilde. Honesto. Devastador. Me encanta.' }] },
      ],
    },

    sinRegalo: {
      title: 'El regalo no sobrevivió', kind: 'Gestión', type: 'decision',
      when: (s) => !!s.flags.regaloRoto,
      chat: [
        { who: 'itzel', text: 'Encontré el regalo. Bueno. Encontré partes del regalo.', mood: 'angry' },
        { who: 'pollito', text: '😼' },
        { who: 'samantha', text: 'No podemos llegar sin regalo. Piensen.' },
      ],
      options: [
        { label: 'Cupones hechos a mano ("vale por un desayuno")', effects: { quality: 7 }, flags: { regalo: 'cupones' },
          reply: [{ who: 'saulo', text: 'Yo los ilustro. Van a llorar. Yo ya estoy llorando.' }] },
        { label: 'Ponerle un moño a Pollito', effects: { quality: 4, noise: 8 }, flags: { regalo: 'pollito', caos: true },
          reply: [{ who: 'pollito', text: '🙀' }, { who: 'natalia', text: 'Me arañó tres veces, pero el moño está puesto.' }] },
        { label: 'Sin regalo: "tu regalo somos nosotros"', effects: { quality: 1 }, flags: { regalo: 'nada' },
          reply: [{ who: 'majo', text: 'Eso es lo más triste que he escuchado. Aprobado.' }] },
      ],
    },

    // ----- eventos reactivos -----
    vuelta: {
      title: 'La vuelta', kind: 'Sueño', type: 'decision', reactive: true, timer: 9, view: 'xroom',
      when: (s) => s.sleep >= 3,
      chat: [
        { who: 'sistema', text: '🛏️ Ximena se da vuelta en la cama. Se escucha el colchón.' },
        { who: 'itzel', text: 'Nadie respire.', mood: 'surprised' },
      ],
      options: [
        { label: 'Todos congelados', effects: { sleep: -2, quality: -3 }, set: { noise: 0 },
          reply: [{ who: 'natalia', text: 'Llevo dos minutos en un pie. Se me durmió el otro.' }] },
        { label: 'Poner ruido de lluvia en el parlante', requires: 'parlante', effects: { sleep: -3 },
          reply: [{ who: 'alan', text: 'Lluvia suave, 40 hz. Esto duerme hasta a Majo.' }] },
        { label: 'Seguir trabajando despacito', effects: { sleep: 1, quality: 2 }, timeout: true,
          reply: [{ who: 'majo', text: 'Sigan. Pero si alguien bota algo, renuncio.' }] },
      ],
    },

    sexto: {
      title: 'El sexto sentido', kind: 'Amenaza', type: 'assign', reactive: true,
      when: (s) => s.sus >= 55,
      chat: [
        { who: 'ximena', text: 'una pregunta', mood: 'suspicious', direct: true },
        { who: 'ximena', text: 'gasto raro, ruidos, todos conectados a las 3 am. ¿qué están haciendo?', mood: 'suspicious', direct: true },
        { who: 'samantha', text: 'Está atando cabos. Alguien tiene que convencerla ahorita.', mood: 'surprised' },
      ],
      test: { stats: ['carisma', 'sigilo'], dc: 13, bonus: { itzel: 2, natalia: -3 }, prompt: '¿Quién la convence?' },
      success: { effects: { sus: -18 }, reply: (who) => [
        { who, text: 'Maratón de películas de terror. No te invitamos porque te duermes a los cinco minutos.' },
        { who: 'ximena', text: 'verdad. ok. bajen el volumen.', mood: 'tired', direct: true },
      ] },
      fail: { effects: { sus: 14 }, reply: (who) => [
        { who, text: 'Nada. Absolutamente nada. ¿Por qué estaríamos haciendo algo? Qué pregunta tan rara.' },
        { who: 'ximena', text: 'ajá.', mood: 'suspicious', direct: true },
      ] },
    },
  };

  // Orden de la historia; los eventos reactivos se intercalan cuando se cumplen sus condiciones.
  G.STORY = ['cajas', 'decoracion', 'whatsapp', 'jose', 'mensajes', 'apagon', 'pollito', 'sinRegalo', 'sinPastel', 'pizza', 'sonambula'];
  G.REACTIVE = ['vuelta', 'sexto'];

  // Rondas de la Batalla de Mensajes: x = lo que escribe Ximena, ok = respuesta que la calma
  G.MESSAGES = [
    { x: 'mmm… ¿qué hora es?', ok: 'Las 3 am. Sigue durmiendo 💜', bad: ['¡Hora de levantarse!', '¿Por qué preguntas? ¿Escuchaste algo?'], jose: '¡AMOR! ¿Estás despierta? ¡Te llamo ahorita!' },
    { x: 'escuché un ruido en la sala…', ok: 'Fue Pollito con sus juguetes. Todo bien.', bad: ['¿Qué ruido? Aquí NADIE está haciendo nada.', 'Sí, se nos cayó algo grande. Ven a ver.'], jose: '¿Ruido? ¡Voy para allá a revisar!' },
    { x: '¿por qué están todos conectados?', ok: 'Maratón de series. Ya nos vamos a dormir.', bad: ['Estamos organizando algo secreto.', 'No estamos conectados. Estás soñando. ¿O no?'], jose: '¡Yo también estoy conectado! ¿Videollamada?' },
    { x: 'tengo sed pero no quiero pararme', ok: 'Tienes tu botella en el velador. Duerme.', bad: ['¡Ven a la cocina, hay de todo!', 'Yo te llevo agua, ya abro tu puerta.'], jose: '¡Te llevo un jugo! Llego en 5 minutos.' },
    { x: '¿mañana alguien me despierta a las 10?', ok: 'Yo te despierto. Descansa tranquila.', bad: ['Mejor quédate despierta de una vez.', '¿Mañana? Mañana es tu… nada. Olvídalo.'], jose: '¡Mejor te despierto YO a las 4 para ver el amanecer!' },
    { x: 'soñé que me hacían una fiesta jaja', ok: 'Jaja qué loco. Sigue soñando 😴', bad: ['¿QUIÉN TE DIJO?', 'No fue un sueño.'], jose: '¿Fiesta? ¿Cuál fiesta? ¿Hay fiesta?' },
    { x: '¿apagaron la cocina? huele a algo', ok: 'Todo apagado. Es el vecino cocinando.', bad: ['Es el pastel. Digo, no. No hay pastel.', 'No sé, ¿vienes a oler?'], jose: '¿Huele a quemado? ¡Llamo a los bomberos!' },
    { x: 'José me está escribiendo mucho…', ok: 'Silencia el cel y duerme. Mañana le respondes.', bad: ['Contéstale, parece urgente.', 'Sí, dice que viene para acá ahora.'], jose: '¡Xime! ¡Xime! ¡Xime! ¿Viste mis 14 mensajes?' },
  ];

  // Qué se roba Pollito según el inventario
  G.pollitoTarget = function (s) {
    const order = ['regalo', 'guirnalda', 'bocaditos', 'globos', 'luces', 'pastel'];
    const id = order.find((i) => has(s, i));
    if (id) return { id, name: G.ITEMS[id].name, article: { regalo: 'el regalo', guirnalda: 'la guirnalda', bocaditos: 'los bocaditos', globos: 'los globos', luces: 'las luces', pastel: 'EL PASTEL' }[id] };
    return { id: 'control', name: 'Control de la tele', article: 'el control de la tele' };
  };

  // ---------- Finales ----------
  G.ENDINGS = {
    ruina: {
      title: 'LA RUINA', tone: 'bad',
      text: 'Ximena ató todos los cabos antes de tiempo. Entra a la sala, mira los preparativos a medio hacer y a sus roomies congelados con cinta adhesiva en la mano. "…¿Era una sorpresa?". Nadie sabe qué responder. Pollito sí: tira un vaso.',
    },
    sorpresa: {
      title: '¡SORPRESA!', tone: 'good',
      text: (s) => s.quality >= 75 && s.sus < 35
        ? 'Ximena abre la puerta de su cuarto y la sala entera estalla. Luces, comida, su gente. Tarda un segundo en entender, y otro en ponerse a llorar de la risa. Por una noche, son sus amigos quienes cuidan de ella.'
        : 'Ximena sale de su cuarto y todos gritan a la vez. No es la fiesta más elegante del mundo, pero es para ella, y lo sabe. Se queda mirando un rato largo antes de decir: "No puedo creer que hicieran todo esto".',
    },
    caos: {
      title: 'EL CAOS PERFECTO', tone: 'mixed',
      text: 'Nada salió como estaba planeado. Falta decoración, falta comida y media sala parece la escena de un crimen. Pero cuando Ximena aparece, el "¡SORPRESA!" sale tan desafinado que se dobla de la risa. Años después, todos van a jurar que fue el mejor cumpleaños de la casa.',
    },
  };
})();
