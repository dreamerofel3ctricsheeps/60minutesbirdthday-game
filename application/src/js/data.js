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
    majo: {
      name: 'Majo', role: 'La organizadora perfeccionista', color: '#7f93d8', playable: true,
      stats: { velocidad: 6, sigilo: 6, carisma: 6, logica: 9 },
      skill: 'Plan B: siempre tiene una salida lógica; +4 en problemas de organización.',
      defect: 'Perfeccionista: si algo sale mal frente a Ximena, se estresa (+ruido).',
    },
    saulo: {
      name: 'Saulo', role: 'El poeta distraído', color: '#d98a62', playable: true,
      stats: { velocidad: 4, sigilo: 7, carisma: 9, logica: 3 },
      skill: 'Labia: puede venderle cualquier historia a Ximena; +4 al distraerla.',
      defect: 'Distraído: se queda mirando la nada en el peor momento.',
    },
    fatima: {
      name: 'Fátima', role: 'La cocinera serena', color: '#e0b77a', playable: true,
      stats: { velocidad: 5, sigilo: 6, carisma: 8, logica: 6 },
      skill: 'Manos de abuela: calma a cualquiera con comida; +4 en la cocina.',
      defect: 'Lenta bajo presión: −3 cuando hay que correr.',
    },
    samantha: {
      name: 'Samantha', role: 'La fotógrafa', color: '#e04fc4', playable: true,
      stats: { velocidad: 8, sigilo: 5, carisma: 7, logica: 4 },
      skill: 'Ojo de lince: encuentra objetos rápido y documenta TODO.',
      defect: 'Flash indiscreto: su cámara puede delatar al grupo.',
    },
    ximena: { name: 'Ximena', color: '#b48cf0' },
    jose: { name: 'José', color: '#5fae77', boss: 'El novio. Tiene su propio plan de cumpleaños.' },
    pollito: { name: 'Pollito', color: '#f0a04a', boss: 'El gato. Una fuerza del caos.' },
  };
  // Los 7 roomies son elegibles como protagonista y reclutables como
  // partners en la recolección (diseño original retomado el 2026-11-14).
  // Ximena NO es elegible (es la que duerme) ni José (es el villano).
  // G.PLAYABLE = el roster completo del departamento; la PARTY de cada
  // partida (protagonista + hasta 3 partners) vive en G.S.party.
  G.PLAYABLE = ['natalia', 'saulo', 'itzel', 'fatima', 'samantha', 'majo', 'alan'];
  G.ROOMIES = G.PLAYABLE;
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
    // ----- Siembra del final de Leyendas (pedido de Jose, 2026-11-21):
    // la claqueta y la cámara antigua entran a la recolección como
    // ítems normales (los 12 spawns del mundo alcanzan justo: 10 + 2).
    claqueta:     { name: 'Claqueta de cine', cat: 'util', slots: 1, q: 2, hint: '¿Una claqueta en una fiesta? Qué raro.' },
    camara:       { name: 'Cámara antigua', cat: 'util', slots: 1, q: 3, hint: 'Una cámara de cine viejísima. Todavía funciona.' },
  };

  // ---------- Personajes especiales (NO son G.CHARS) ----------
  // Alebrije y Teodora no tienen hoja definida: viven en un registro
  // aparte para que check_defined no les exija sprites, y se dibujan
  // POR CÓDIGO en scenes.js (sección 15). Cuando se produzcan sus
  // hojas definidas, este registro se reemplaza por G.CHARS.
  G.SPECIALS = {
    alebrije: { name: 'El Alebrije', color: '#b48cf0', role: 'Guía caótico · director invitado' },
    teodora: { name: 'Teodora', color: '#f08cc0', role: 'Boss final · protagonista invitada' },
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
            : n === 3
              ? { who: 'samantha', text: 'Tenemos material para las 6 zonas. Quiero que se vea increíble en las fotos.' }
              : { who: 'samantha', text: `Tenemos material de verdad para ${n * 2} zonas; las demás las improviso con papel y post-its. Nadie notará la diferencia. Casi.` },
          { who: 'pollito', text: '😼' },
          { who: 'fatima', text: 'Pollito ya está mirando las guirnaldas como si fueran presas. Suerte.' },
        ];
      },
      intro: 'Cuelga las decoraciones: acércate a cada zona y presiona ESPACIO cuando la barra esté en verde. Pollito va a intentar tirarlas: párate junto a él y presiona ESPACIO para espantarlo.',
      goal: 'Tres rondas, cada una con sus zonas. Gana la ronda quien termine con todo colgado.',
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
      // Antes fue «¿Fantasma o disfraz?» (minijuego de observación);
      // Jose lo reemplazó el 2026-11-14 por la adaptación de Lit
      // Potato / Candlelight: competencia de velas contra José por
      // toda la casa — ver Sc.CandleGame en scenes.js y el mapeo de
      // salidas en MG.apagon.resolve (game.js).
      title: 'Apagón: velas contra José', kind: 'Duelo', type: 'minigame', game: 'apagon', boss: 'jose', view: 'sala', dark: true,
      chat: [
        { who: 'sistema', text: '⚡ Se fue la luz en todo el departamento.' },
        { who: 'fatima', text: 'No veo nada. Acabo de abrazar el refrigerador pensando que era Saulo.' },
        { who: 'saulo', text: 'La oscuridad sólo revela lo que ya éramos.' },
        { who: 'jose', text: 'Tranquilos: traje fósforos y un paquete de velas. MI ambiente a velas va a salvar esta fiesta.', direct: true },
        { who: 'majo', text: '¿Perdón? Si alguien prende las velas de esta casa, somos nosotros. ¡A correr por toda la casa: quien tenga más velas prendidas cuando vuelva la luz, gana!' },
        { who: 'itzel', text: 'Y sin hacer ruido, que Ximena duerme en su cuarto. Las velas de ahí, con cuidado.' },
      ],
      intro: 'Al cortarse la luz, la casa se ve unos segundos: MEMORIZA dónde están las 26 velas (cambian de lugar en cada partida). Después, oscuridad total: solo te alumbra la vela que llevas en la mano y las que vayas prendiendo. Corre y mantén ESPACIO junto a una vela para prenderla (0,6 s; si te mueves, se cancela). Junto a una vela de José (llama verdosa), mantén ESPACIO para soplarla (0,9 s); su fósforo tenue lo delata en la oscuridad. José recorre la casa prendiendo las suyas… y sopla las tuyas si va perdiendo. Cada 10–15 s la luz parpadea y vuelve un instante: al cortarse, la sobretensión apaga 1 de cada 4 velas prendidas. En el cuarto de Ximena todo toma más tiempo: hay que prender en silencio.',
      goal: 'Memoriza las velas y ten más prendidas que José cuando vuelva la luz (75 s).',
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
      intro: 'Persigue a Pollito por la sala y embístelo con ESPACIO para atraparlo. Salta por encima si lo acorralas mal y va dejando ovillos: si pisas uno, te resbalas. Cada ronda corre más rápido.',
      goal: 'Atrápalo antes de que se acabe el tiempo en 2 de 3 rondas.',
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
      goal: 'El primero en ganar 3 mensajes se lleva el duelo.',
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
      goal: 'Son tres pisos. Gana el que llegue primero a la escalera en 2 de ellos.',
      results: {
        win: { effects: { quality: 6 }, reply: (who) => [{ who, text: 'Llegué primero y le cerré la puerta con el pie. Elegante.', mood: 'happy' }, { who: 'jose', text: 'Buena carrera. Me quedo en el pasillo… por ahora.', direct: true }] },
        lose: { effects: { noise: 20, sus: 3 }, reply: () => [{ who: 'sistema', text: '🔔 José toca el timbre. Tres veces.' }, { who: 'majo', text: 'ÁBRANLE antes de que toque una cuarta.', mood: 'angry' }, { who: 'jose', text: '¡Hola! ¿Y Xime?' }] },
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
      goal: 'Llega hasta Ximena antes que José en 2 de 3 rondas.',
      results: {
        win: { effects: { sus: -6, sleep: -2, quality: 4 }, reply: (who) => [{ who, text: 'La llevé de la mano hasta su cama. Ni se enteró.', mood: 'happy' }, { who: 'jose', text: '…Está bien. Ustedes ganan. ¿En qué ayudo?' }] },
        tie: { effects: { sleep: 1 }, reply: () => [{ who: 'itzel', text: 'Se dio media vuelta sola y regresó a su cuarto. Nadie ganó, nadie perdió.' }] },
        lose: { effects: { sus: 9, sleep: 2 }, reply: () => [{ who: 'jose', text: '¡Xime! ¡Amor! ¡Feliz…!' }, { who: 'ximena', text: '¿José…? ¿qué haces aquí? ¿qué hora es?', mood: 'suspicious', direct: true }, { who: 'majo', text: 'La despertó. LA DESPERTÓ.', mood: 'angry' }, { who: 'itzel', text: 'La regresé a su cama diciéndole que era un sueño. No sé si me creyó.' }] },
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

    memoria: {
      title: 'Memoria de cajas', kind: 'Duelo', type: 'minigame', game: 'memoria', boss: 'jose', view: 'sala',
      chat: [
        { who: 'fatima', text: 'Con el apagón metimos todo en cajas iguales. Ya nadie sabe qué hay en cuál.' },
        { who: 'jose', text: 'Yo las vi cuando llegué. Tengo memoria fotográfica 😎 Si acierto más que ustedes, me dejan despertar a Xime.', direct: true },
        { who: 'majo', text: 'Acepto. Pero si pierdes, cargas las cajas tú.' },
      ],
      intro: 'Por turnos, abran dos cajas. Si son pareja se la quedan y repiten turno; si no, se cierran y le toca al otro. Mueve el cursor con las flechas y abre con ESPACIO.',
      goal: 'Gana 2 de 3 rondas juntando más parejas que José.',
      results: {
        win: { effects: { quality: 5 }, reply: (who) => [{ who, text: 'Todo ordenado y etiquetado. Memoria fotográfica, decía.', mood: 'happy' }, { who: 'jose', text: 'Estaba oscuro. No cuenta.', direct: true }] },
        tie: { effects: {}, reply: () => [{ who: 'saulo', text: 'Empate. El olvido nos iguala a todos.' }] },
        lose: { effects: { quality: -4, sus: 4 }, reply: () => [{ who: 'jose', text: 'Gané. Voy calentando la voz para cantarle "Las Mañanitas".', direct: true }, { who: 'majo', text: 'Que alguien le esconda el celular.', mood: 'angry' }] },
      },
    },

    imagen: {
      title: 'La imagen distinta', kind: 'Duelo', type: 'minigame', game: 'imagen', boss: 'jose', view: 'sala',
      chat: [
        { who: 'samantha', text: 'Estoy armando el collage de fotos para Xime y se me duplicaron TODAS las imágenes. Tengo tres copias de cada una… creo.' },
        { who: 'jose', text: 'Deja eso. Yo tengo ojo de águila: apuesto a que encuentro la imagen distinta antes que cualquiera de ustedes. Si gano, despierto a Xime y le muestro el collage YO.', direct: true },
        { who: 'majo', text: 'Nadie despierta a nadie. Alguien le gana a José en su propio juego de mirar fijamente.' },
      ],
      intro: 'Tres paneles con objetos de la fiesta: dos son idénticos y uno es DISTINTO. Los paneles se van destapando poco a poco, y puedes señalarlo con ← ↓ → (o clic en el panel) EN CUANTO creas saber cuál es: arriesga temprano o espera a ver más, no hace falta esperar a que se revelen enteros. Las diferencias empiezan obvias y se van poniendo sutiles: una raya menos, una cereza de más, la imagen espejada… Si te equivocas, la cubierta cae y José tiene su oportunidad sobre la imagen ya destapada; si él falla primero, tienes un instante para rescatar el punto.',
      goal: 'Carrera a 5 puntos: el primero en señalar la imagen distinta se lleva el punto.',
      results: {
        win: { effects: { quality: 5 }, reply: (who) => [{ who, text: 'Ojo de águila, decía. El collage quedó perfecto y sin duplicados raros.', mood: 'happy' }, { who: 'jose', text: 'La última era IMPOSIBLE. Una raya. ¡UNA raya!', direct: true }] },
        tie: { effects: {}, reply: () => [{ who: 'samantha', text: 'Empate visual. El collage queda como está: artísticamente duplicado.' }] },
        lose: { effects: { quality: -4, sus: 4 }, reply: () => [{ who: 'jose', text: 'GANÉ. Mi ojo de águila merece despertar a Xime para contárselo.', direct: true }, { who: 'majo', text: 'Que alguien le esconda el collage. Y las llaves. Y a José.', mood: 'angry' }] },
      },
    },

    cactus: {
      title: 'Cactus rodantes', kind: 'Duelo', type: 'minigame', game: 'cactus', boss: 'pollito', view: 'cocina',
      chat: [
        { who: 'fatima', text: '¿Alguien ha visto mi colección de cactus bola? Estaban sobre el refrigerador.', mood: 'suspicious' },
        { who: 'pollito', text: '😼' },
        { who: 'alan', text: 'Pollito está arriba del refri empujándolos uno por uno. Están rodando por toda la cocina.', mood: 'surprised' },
        { who: 'fatima', text: 'Que alguien entre por los bocaditos SIN que lo pinchen. Y sin gritar.' },
      ],
      intro: 'Pollito empuja cactus redondos que ruedan y rebotan por la cocina. Muévete para esquivarlos hasta que se acabe el tiempo de la ronda. Cada ronda hay más cactus y más rápidos.',
      goal: 'Sobrevive 2 de 3 rondas sin que te toque ninguno.',
      results: {
        win: { effects: { quality: 3 }, reply: (who) => [{ who, text: 'Salí ileso y con los bocaditos. Pollito me mira con respeto. O con hambre.', mood: 'happy' }] },
        tie: { effects: { noise: 5 }, reply: () => [{ who: 'fatima', text: 'Medio pinchado, medio ileso. Me lo llevo.' }] },
        lose: { effects: { noise: 14 }, reply: (who) => [{ who, text: 'AY. Ay. Ay. Tengo espinas en lugares que no sabía que tenía.', mood: 'surprised' }, { who: 'majo', text: 'Grita hacia adentro.', mood: 'angry' }] },
      },
    },

    // Variante del evento cactus: NO está en G.STORY. En la historia,
    // el evento «Cactus rodantes» sortea 50/50 entre su minijuego de
    // siempre y esta carrera (ver runMinigame en game.js, que usa el
    // intro/goal de aquí para anunciar la variante). Esta entrada
    // existe para la lista de práctica, donde la carrera se juega
    // siempre, como entrada propia.
    cactus2: {
      title: 'Cactus en carrera', kind: 'Duelo', type: 'minigame', game: 'cactus2', boss: 'pollito', view: 'cocina',
      chat: [],
      intro: '¡Sorteo de cactus! Esta vez los cactus ruedan en línea recta, de izquierda a derecha, y toca CARRERA en vista lateral: corres en el mismo carril que Pollito y hay que SALTAR cada cactus con ESPACIO o ↑. Ojo: algunos cactus cambian de velocidad a mitad de camino (se inclinan un instante antes) y la gravedad cambia por tramos — LUNAR (salto alto y flotante) y PESADA (salto corto y rápido) — anunciados con su banner. Cada golpe es un tropiezo; gana quien tenga MENOS golpes en 60 segundos.',
      goal: 'Salta los cactus durante 60 s y termina con menos tropiezos que Pollito.',
      results: {
        win: { effects: { quality: 3 }, reply: (who) => [{ who, text: 'Carrera limpia: salté cactus con tres gravedades distintas y ni una espina.', mood: 'happy' }, { who: 'pollito', text: '😾' }] },
        tie: { effects: { noise: 5 }, reply: () => [{ who: 'fatima', text: 'Empate de tropiezos. Mis cactus ruedan libres y nadie ganó nada.' }] },
        lose: { effects: { noise: 14 }, reply: (who) => [{ who, text: 'Tropecé con todo. La gravedad pesada fue personal.', mood: 'surprised' }, { who: 'pollito', text: '😼' }] },
      },
    },

    repisas: {
      title: 'Salto de repisas', kind: 'Duelo', type: 'minigame', game: 'repisas', boss: 'pollito', view: 'sala',
      chat: [
        { who: 'samantha', text: 'Las velas. ¿Dónde están las velas?', mood: 'surprised' },
        { who: 'natalia', text: 'En la boca de Pollito. Y Pollito está subiendo por el librero.' },
        { who: 'saulo', text: 'Siempre quiso llegar más alto que nosotros. Emocional y literalmente.' },
      ],
      intro: 'El librero de la sala NO TIENE TECHO: sigue por la azotea, el cielo y quién sabe hasta dónde, y Pollito ya va subiendo con las velas en la boca. Presiona ← o → según el lado de la siguiente repisa. Si te equivocas, resbalas y caes a la repisa anterior (tu altura máxima no se pierde).',
      goal: 'Escalada infinita: gana quien suba más alto en 60 segundos.',
      results: {
        win: { effects: { quality: 5 }, reply: (who, res) => [{ who, text: `¡${res && res.pMeters != null ? res.pMeters : 'Un montón de'} metros! Bajé con las velas, con vértigo y con una historia que nadie va a creer.`, mood: 'happy' }, { who: 'pollito', text: '😾' }] },
        tie: { effects: { quality: 1 }, reply: (who, res) => [{ who: 'saulo', text: `Empate a ${res && res.cMeters != null ? res.cMeters : '?'} metros. El gato y tú comparten techo. O espacio.` }, { who: 'pollito', text: '😼' }] },
        lose: { effects: { quality: -3, noise: 8 }, reply: (who, res) => [{ who: 'sistema', text: `Pollito llegó a ${res && res.cMeters != null ? res.cMeters : 'lo más alto'} metros y tiró las velas desde ahí. Caen una por una.` }, { who: 'fatima', text: 'Usaremos fósforos largos. Nadie diga nada.' }] },
      },
    },

    pisoton: {
      title: 'Ojo con el pisotón', kind: 'Duelo', type: 'minigame', game: 'pisoton', boss: 'pollito', view: 'todo',
      chat: [
        { who: 'itzel', text: 'Fui al cuarto por los cojines para la sala y algo me cayó encima desde el camarote.', mood: 'angry' },
        { who: 'pollito', text: '😼' },
        { who: 'natalia', text: 'Está en modo cazador. Salta sobre todo lo que se mueve.' },
        { who: 'majo', text: 'Necesitamos esos cojines. Alguien entra, esquiva y sale.' },
      ],
      intro: 'Estás sobre nueve cojines. Antes de cada pisotón aparecen sombras: Pollito va a caer sobre esos cojines. Muévete rápido a uno sin sombra. Cada ronda hay más sombras y menos tiempo.',
      goal: 'Esquiva 5 pisotones por ronda. Gana 2 de 3 rondas.',
      results: {
        win: { effects: { quality: 3, sleep: -1 }, reply: (who) => [{ who, text: 'Cojines rescatados. Pollito se cansó y se quedó dormido encima del último.', mood: 'happy' }] },
        lose: { effects: { noise: 16 }, reply: (who) => [{ who, text: 'Me cayó encima. Dos veces. Pesa más de lo que parece.', mood: 'surprised' }, { who: 'sistema', text: 'El golpe se escuchó en todo el piso.' }] },
      },
    },

    azotea: {
      title: 'Ataque al amanecer', kind: 'Duelo', type: 'minigame', game: 'azotea', boss: 'jose', view: 'todo',
      chat: [
        { who: 'alan', text: 'José subió a la azotea. Tiene un dron con un parlante amarrado.', mood: 'surprised' },
        { who: 'jose', text: 'Plan B: serenata aérea frente a su ventana justo cuando salga el sol 🌅🎶', direct: true },
        { who: 'majo', text: 'Alguien sube y lo distrae hasta que se le acabe la batería.' },
      ],
      intro: 'En la azotea, José lanza su dron contra ti por la pista. El dron te persigue de lado mientras avanza, pero cuando se pone rojo ya no puede girar: cambia de lado a último momento con ← →.',
      goal: 'Esquiva 4 pasadas por ronda. Gana 2 de 3 rondas.',
      results: {
        win: { effects: { sus: -5 }, reply: (who) => [{ who, text: 'Batería en cero. El dron aterrizó solito en una maceta.', mood: 'happy' }, { who: 'jose', text: 'Ok, eso estuvo bueno. Bajo en son de paz.', direct: true }] },
        lose: { effects: { noise: 18, sleep: 1 }, reply: () => [{ who: 'sistema', text: '🎶 El dron pasa zumbando frente a la ventana de Ximena con un bolero a medio volumen.' }, { who: 'itzel', text: 'Le cerré la cortina. No sé si alcanzó a oír.', mood: 'angry' }] },
      },
    },

    globos: {
      title: 'Globos por las nubes', kind: 'Duelo', type: 'minigame', game: 'globos', boss: 'jose', bossLabel: 'José · dirige Pollito', view: 'todo',
      chat: [
        { who: 'alan', text: 'José infló los globos de la decoración y se los llevó a la azotea. Dice que tiene "un sistema" para colgarlos.', mood: 'surprised' },
        { who: 'jose', text: 'Sistema infalible: Pollito dirige con banderas, como en los aeropuertos. Quien levante el globo correcto, manda. Si gano yo, bajo cantando.', direct: true },
        { who: 'pollito', text: '😼' },
        { who: 'natalia', text: 'Pollito dirigiendo globos de noche. ¿Qué puede salir mal? Alguien suba y gane, por favor.' },
      ],
      intro: 'En la azotea, Pollito dirige con dos banderas desde su plataforma: levanta la del lado que toca… pero a veces hace una FINTA y la cambia antes de la señal. Cuando baja ambas banderas y suena el ¡YA!, levanta el globo del lado FINAL con ← o →. Si eliges antes de la señal, tu elección queda fijada: si luego hay finta, vuelas. Y quien elige mal sale volando con su globo, literalmente. José responde tras la señal; si ambos aciertan, gana el más rápido.',
      goal: 'Mejor de 5 rondas: gana quien se lleve 3, levantando el globo que Pollito indique tras el ¡YA!',
      results: {
        win: { effects: { quality: 5 }, reply: (who) => [{ who, text: 'Leí hasta las fintas de Pollito. Los globos quedaron colgados y José bajó de la azotea volando… en sentido figurado. Él no.', mood: 'happy' }, { who: 'jose', text: 'Ese gato cambia las banderas a propósito. ¡A PROPÓSITO!', direct: true }] },
        tie: { effects: { noise: 4 }, reply: () => [{ who: 'alan', text: 'Empate en la azotea. Los globos quedaron a medio colgar, como nuestras esperanzas.' }, { who: 'pollito', text: '😼' }] },
        lose: { effects: { quality: -4, sus: 4 }, reply: () => [{ who: 'jose', text: '¡GANÉ! Bajo cantando la serenata de globos. Es un género nuevo.', direct: true }, { who: 'itzel', text: 'Alguien baje a José de su nube. Literal y figurada.', mood: 'angry' }] },
      },
    },

    // ----- Final alternativo J1407b (SPACE_RINGS_ENDING) -----
    // Entradas de PRÁCTICA y de la cadena del final. En la HISTORIA
    // el final se habilita con G.spaceReady (ver game.js) y lo
    // dispara el clímax de main() — estas entradas NO están en
    // G.STORY: no son eventos sueltos de la noche.
    anillos: {
      title: 'Anillos de J1407b', kind: 'Duelo', type: 'minigame', game: 'anillos', boss: 'jose', bossLabel: 'José · copiloto Pollito', view: 'todo',
      chat: [
        { who: 'sistema', text: 'El cohete de los que se fueron volvió por ustedes. La pista de carrera es un anillo de J1407b.' },
        { who: 'jose', text: 'Carrera de cohetes sobre el anillo, 2 contra 2. Pollito va de copiloto conmigo y no acepta reclamos.', direct: true },
      ],
      intro: 'Carrera en cohete sobre un anillo de J1407b, el «Súper Saturno» de los 37 anillos. Tu cohete acelera solo: cambia de carril con ← → (o tocando el lado de la pantalla) para esquivar los meteoritos, que ocupan 1 o 2 de los 3 carriles y avisan con su sombra. Tu copiloto (tu primer partner) te sugiere el carril seguro: si vas al contrario, el cohete DUDA 0,3 s y cambia tarde. Chocar no elimina: frena. José corre con Pollito de copiloto, que se ríe si chocas tú y se asusta si chocan ellos.',
      goal: 'Cruza el aro de luz al final del anillo antes que el cohete de José.',
      results: {
        win: { effects: { quality: 5 }, reply: (who) => [{ who, text: '¡Les ganamos la carrera del anillo! El copiloto y yo somos un equipo de NASCAR espacial.', mood: 'happy' }, { who: 'jose', text: 'Pollito jura que él manejaba. Manejaba yo. Solo conste.', direct: true }] },
        tie: { effects: { noise: 4 }, reply: () => [{ who: 'alan', text: 'Empate en el anillo. Dos cohetes llegaron al aro a la vez a 434 años luz de la sala.' }] },
        lose: { effects: { quality: -4 }, reply: () => [{ who: 'jose', text: '¡Primer lugar en J1407b! Lo voy a poner en mi currículum.', direct: true }, { who: 'pollito', text: '😼' }] },
      },
    },

    cinturon: {
      title: 'Cinturón de asteroides', kind: 'Duelo', type: 'minigame', game: 'cinturon', boss: 'jose', view: 'todo',
      chat: [
        { who: 'sistema', text: 'Los dos cohetes quedaron averiados. El último tramo a la fiesta se hace flotando.' },
        { who: 'jose', text: 'Flotando, con inercia, entre asteroides. El primero que cruce el aro se queda con el descubrimiento del planeta.', direct: true },
      ],
      intro: 'Duelo 1 vs 1 flotando en un cinturón de asteroides: impulsa tu mochila con las flechas (o WASD). No hay freno de mano: la inercia manda y el arrastre apenas ayuda, así que impulsa en contra para frenar. Chocar con un asteroide te deja aturdido girando 1,5 s (y aparta el asteroide). Hay asteroides con formas de fiesta — pastel, globo, regalo — y Pollito flota libre empujando rocas sin querer. Si ganaste la carrera de los Anillos, sales adelantado: más cerca del aro.',
      goal: 'Cruza primero el aro a cuadros al final del cinturón.',
      results: {
        win: { effects: { quality: 5 }, reply: (who) => [{ who, text: '¡Crucé el aro primero! El cinturón de asteroides tiene dueño y no es José.', mood: 'happy' }, { who: 'jose', text: 'Ok. Pero el planeta lo nombré yo primero. Se llama José-1.', direct: true }] },
        tie: { effects: { noise: 4 }, reply: () => [{ who: 'majo', text: 'Empate en el aro. Cruzaron flotando al mismo tiempo, como dos medias sincronizadas.' }] },
        lose: { effects: { quality: -4 }, reply: () => [{ who: 'jose', text: '¡DESCUBRÍ UN PLANETA! Bueno, crucé el aro primero. Es casi lo mismo.', direct: true }, { who: 'itzel', text: 'José llegó primero flotando y ya se autonombró descubridor. Nadie lo baja de ahí.', mood: 'angry' }] },
      },
    },

    finalj1407b: {
      title: 'Final J1407b', kind: 'Final', type: 'minigame', game: 'finalj1407b', boss: 'jose', bossLabel: 'José · copiloto Pollito', view: 'todo',
      chat: [
        { who: 'sistema', text: '00:00. La fiesta está lista, pero nadie grita «sorpresa»: se escucha un cohete aterrizar en el techo.' },
        { who: 'majo', text: 'Carguen a Ximena dormida. Nos vamos… un poquito más lejos que la sala.' },
      ],
      intro: 'La cadena COMPLETA del final alternativo: despegue desde la azotea con Ximena dormida, carrera «Anillos de J1407b» (2 vs 2 en cohete), el tramo flotando del «Cinturón de asteroides» (1 vs 1 contra José) y la fiesta en gravedad baja sobre el anillo mayor, con su foto de grupo. Ganar los Anillos te da salida adelantada en el Cinturón; perder el Cinturón no te quita el final: cambia el cierre (y el estado del pastel).',
      goal: 'Llega a la fiesta sobre el anillo mayor: SPACE_RINGS_ENDING.',
      results: {
        win: { effects: { quality: 8 }, reply: (who) => [{ who, text: 'Hicimos la fiesta sobre los anillos de J1407b. No cabía en el planeta. Literal.', mood: 'happy' }] },
        tie: { effects: { quality: 4 }, reply: () => [{ who: 'majo', text: 'La fiesta espacial salió, con empate y todo. J1407b aprobó.' }] },
        lose: { effects: { quality: 2 }, reply: () => [{ who: 'jose', text: 'Llegué primero, pero admito: la fiesta en el anillo quedó mejor que mi plan.', direct: true }] },
      },
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

    // ----- Final alternativo LEYENDAS (LEYENDAS_MOVIE_ENDING) -----
    // Entradas de PRÁCTICA y de la cadena del clímax. En la historia el
    // casting NO es un evento de G.STORY: lo dispara el beat de las
    // ~18:00 de game.js (aparición del Alebrije en la sala), y el
    // clímax lo evalúa G.legendsReady antes del final estándar.
    patron: {
      title: 'El patrón del Alebrije', kind: 'Duelo', type: 'minigame', game: 'patron', boss: 'alebrije', bossLabel: 'El Alebrije · casting', view: 'todo',
      chat: [
        { who: 'sistema', text: 'Algo se movió entre la decoración de la sala. Algo con antenas.' },
        { who: 'alebrije', text: '¡Shhh! Estaba escondido entre los globos. Si quieren salir en la película, primero: mi casting.', direct: true },
      ],
      intro: 'El Alebrije es el director invitado de la nueva película de Las Leyendas, y su casting es un juego de memoria: las partes de su cuerpo se encienden en una secuencia (cabeza, crines, antenas, aleta, panza y cola) que crece de 3 a 7 pasos en 5 rondas. Mírala bien y repítela con ← → para elegir la zona y ESPACIO para marcarla, o tocando la zona. Su cuerpo nunca cambia de color: el resplandor es solo la luz del set. Un solo error y la ronda se pierde.',
      goal: 'Completa al menos 4 de las 5 secuencias para que el Alebrije te acepte en la película (dos rondas falladas y el casting se acaba).',
      results: {
        win: { effects: { quality: 4 }, reply: () => [{ who: 'alebrije', text: '¡ACEPTADO! Tienes memoria de protagonista. Nos vemos en el estreno… digo, en la fiesta.', direct: true }] },
        lose: { effects: { quality: -2 }, reply: () => [{ who: 'alebrije', text: 'Mmm, no. Sin memoria no hay película. ¡Siguiente!', direct: true }] },
      },
    },
    trazo: {
      title: 'El set se hunde / Traza la leyenda', kind: 'Duelo', type: 'minigame', game: 'trazo', boss: 'teodora', bossLabel: 'Teodora · BOSS', view: 'todo',
      chat: [
        { who: 'teodora', text: 'A ver, a ver… ¿esta es la sorpresa? Yo he visto mejores. Primera prueba: tracen mi leyenda SIN salirse.', direct: true },
      ],
      intro: 'Prueba de boss de Teodora en el patio de la casona: ella dibuja una línea luminosa con forma de leyenda (alebrije, calavera o luna) y tú la recorres con tu roomie para puntuar PRECISIÓN. Después anuncia un color con el flash de su celular: solo los hexágonos de ese color que la línea cruzó quedan firmes, y todos corren a uno seguro antes de que el resto del set se hunda. Teodora flota (llega con 1 s de gracia), pero a veces se detiene a tomarse una selfie. Caer 2 veces te deja fuera de la escena.',
      goal: 'Supera la precisión de Teodora en 3 rondas sin quedar eliminado.',
      results: {
        win: { effects: { quality: 5 }, reply: () => [{ who: 'teodora', text: '¿Cómo que trazaste MEJOR que yo? …Graba eso. Digo, bórralo.', direct: true }] },
        lose: { effects: { quality: -3 }, reply: () => [{ who: 'teodora', text: 'Mi set, mis reglas. Y mi trazo sigue siendo el mejor.', direct: true }] },
      },
    },
    soga: {
      title: 'La soga de fuego', kind: 'Duelo', type: 'minigame', game: 'soga', boss: 'teodora', bossLabel: 'Teodora · BOSS', view: 'todo',
      chat: [
        { who: 'teodora', text: 'Última prueba. La soga. Y no, no voy a saltar "suavecito" por ustedes.', direct: true },
      ],
      intro: 'Dos utileros calaverita giran una soga de fuego espectral en el patio. Saltan tú, tus partners y Teodora. Cuando el indicador «¡ESPACIO!» aparezca sobre tu cabeza, presiona ESPACIO (o el toque) en ese momento para saltar: ni antes ni después. Si la soga te alcanza en el suelo, te tropiezas y pierdes un intento: tienes 3. La soga acelera por tramos y a veces amaga; la llama lo anuncia: azul = lento, naranja = rápido. Teodora flota: aguanta más en el aire… pero cada ~10 vueltas se toma una selfie y salta tarde.',
      goal: 'Sé el último en pie, o sigue saltando cuando Teodora se queme.',
      results: {
        win: { effects: { quality: 5 }, reply: () => [{ who: 'teodora', text: '¡¿Me ganó en MI soga?! …Bueno. Igual sí lloré tantito.', direct: true }] },
        lose: { effects: { quality: -3 }, reply: () => [{ who: 'teodora', text: 'Se quemó. Como la mitad de mis ex directores.', direct: true }] },
      },
    },
    finalleyendas: {
      title: 'Final Leyendas', kind: 'Final', type: 'minigame', game: 'finalleyendas', boss: 'teodora', bossLabel: 'Teodora · BOSS FINAL', view: 'todo',
      chat: [
        { who: 'sistema', text: 'La sala era un set. Siempre fue un set.' },
        { who: 'teodora', text: '¿Quieren su final de película? Superen mis dos pruebas.', direct: true },
      ],
      intro: 'El clímax COMPLETO del final de Las Leyendas: la sala se revela como set de cine, Teodora aparece flotando y lanza sus dos pruebas de boss en orden: «El set se hunde / Traza la leyenda» y «La soga de fuego». Ganarle al menos UNA alcanza para el final de película; ganarle las DOS da la versión plena, con Teodora presentando a Ximena en los créditos. Perder las dos deja la fiesta "no apta para cine" y se cae al final normal.',
      goal: 'Supera al menos una prueba de Teodora y filma el final: LEYENDAS_MOVIE_ENDING.',
      results: {
        win: { effects: { quality: 8 }, reply: (who) => [{ who, text: 'Hicimos la fiesta… y quedó filmada. Ximena es la protagonista y ni lo sabía.', mood: 'happy' }] },
        tie: { effects: { quality: 4 }, reply: () => [{ who: 'teodora', text: 'Una de dos. Aceptable. Me quedo con el crédito de protagonista invitada.', direct: true }] },
        lose: { effects: { quality: -2 }, reply: () => [{ who: 'teodora', text: 'No apta para cine. Su fiesta, no mi película.', direct: true }] },
      },
    },
  };

  // Orden de la historia; los eventos reactivos se intercalan cuando se cumplen sus condiciones.
  G.STORY = ['cajas', 'decoracion', 'whatsapp', 'jose', 'mensajes', 'apagon', 'memoria', 'imagen', 'pollito', 'sinRegalo', 'cactus', 'sinPastel', 'pizza', 'repisas', 'pisoton', 'azotea', 'globos', 'sonambula'];
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
    espacio: {
      title: 'FIESTA EN J1407B', tone: 'good',
      text: 'La fiesta no se hizo en la sala: se hizo sobre los anillos de J1407b, el «Súper Saturno» de los 37 anillos, a 434 años luz. Ximena despertó flotando sobre un anillo, con los otros 36 detrás, y solo atinó a decir: "¿Esto… sigue siendo mi casa?". Hiciste una fiesta tan buena que no cabía en el planeta.',
    },
    caos: {
      title: 'EL CAOS PERFECTO', tone: 'mixed',
      text: 'Nada salió como estaba planeado. Falta decoración, falta comida y media sala parece la escena de un crimen. Pero cuando Ximena aparece, el "¡SORPRESA!" sale tan desafinado que se dobla de la risa. Años después, todos van a jurar que fue el mejor cumpleaños de la casa.',
    },
    // ----- Final alternativo LEYENDAS (LEYENDAS_MOVIE_ENDING) -----
    leyendas: {
      title: 'ESTRELLA DE CINE', tone: 'good',
      text: 'La sorpresa era tan buena que la filmaron. La sala era un set de pueblo colonial, el Alebrije dirigía desde la decoración y Teodora —boss final, protagonista invitada, dueña de la selfie oficial— terminó presentando a la verdadera estrella: Ximena, que despertó en medio de su escena y leyó su única línea perfecta: "¿Me hicieron una fiesta… en una película?". Toma buena. Créditos.',
    },
  };
})();
