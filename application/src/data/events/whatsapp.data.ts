/**
 * Historia por WhatsApp (Fase 4).
 *
 * Reemplaza al modal narrativo de la Fase 3 (storyBeats.data.ts): la
 * historia se cuenta en el GRUPO DE WHATSAPP de los amigos. El
 * protagonista (el personaje elegido por el jugador) comenta lo que
 * pasa en la casa y LAS DECISIONES se eligen como respuestas suyas en
 * el chat: `choiceEventId` referencia un evento kind 'choice' de
 * MANAGEMENT_EVENTS (managementEvents.data.ts) y sus choices se
 * ofrecen como respuestas en el panel.
 *
 * `fromId`:
 *  - 'protagonist': quien narra (el panel lo resuelve al personaje
 *    elegido por el jugador).
 *  - 'amigo': reacción genérica de otro roomie del grupo (el panel lo
 *    resuelve a un roomie de la partida distinto del protagonista).
 *  - un id concreto de CHARACTERS_DATA cuando el chiste pide un
 *    personaje específico (p. ej. samantha con el celular).
 *  - 'jose': SOLO en el mensaje filtrado de las 20:00. Jose NO está en
 *    el grupo: llega como captura que reenvía un roomie.
 *
 * `sceneAction`: señal opcional para que la escena 2D reaccione al
 * hilo (el gato merodeando, Jose espiando, Ximena revolviéndose).
 */

export type SceneAction = 'cat-prowl' | 'jose-peek' | 'ximena-stir';

export interface WhatsappMessage {
  fromId: string;
  text: string;
}

export interface WhatsappThread {
  id: string;
  hour: number;
  messages: WhatsappMessage[];
  /** Id en MANAGEMENT_EVENTS (kind 'choice'): sus choices se ofrecen como respuestas. */
  choiceEventId?: string;
  sceneAction?: SceneAction;
}

export const WHATSAPP_THREADS: WhatsappThread[] = [
  {
    id: 'whatsapp_intro_7',
    hour: 7,
    messages: [
      {
        fromId: 'protagonist',
        text: 'Ya entró 😴 Ximena llegó destruida de su guardia en el hospital y se encerró a dormir',
      },
      {
        fromId: 'protagonist',
        text: 'Textual: "No existo hasta nuevo aviso. Duermo hasta que sea mi cumpleaños... si el mundo me deja"',
      },
      { fromId: 'amigo', text: 'Perfecto, entonces tenemos hasta las 00:00 👀' },
      {
        fromId: 'samantha',
        text: 'Operación sorpresa ACTIVADA 🎂 Yo documento todo (en silencio)',
      },
      {
        fromId: 'protagonist',
        text: 'Meta clara: Preparación 70 antes de medianoche y el Despertar LEJOS de 100. Si se despierta, se acabó la sorpresa',
      },
    ],
  },
  {
    id: 'whatsapp_timbre_9',
    hour: 9,
    choiceEventId: 'disturbio_timbre',
    messages: [
      { fromId: 'protagonist', text: '¡DING DONG! 🔔 Sonó el timbre' },
      { fromId: 'amigo', text: '¿Quién pidió algo? Nadie pidió nada' },
      {
        fromId: 'protagonist',
        text: 'Es un delivery EQUIVOCADO, está parado en la puerta',
      },
      {
        fromId: 'protagonist',
        text: 'Xime se revolvió en la cama… ¿qué hago?',
      },
    ],
  },
  {
    id: 'whatsapp_murmura_10',
    hour: 10,
    messages: [
      { fromId: 'protagonist', text: 'Shhh, Xime está hablando dormida 🤫' },
      {
        fromId: 'amigo',
        text: '"…el paciente de la cama 4… pidió torta…" JAJA no puede ser',
      },
      { fromId: 'samantha', text: 'Está soñando con torta, es una SEÑAL 🎂' },
      {
        fromId: 'protagonist',
        text: 'Contengan la risa. Duerme profundo… por ahora',
      },
    ],
  },
  {
    id: 'whatsapp_vecino_12',
    hour: 12,
    choiceEventId: 'disturbio_vecino',
    messages: [
      { fromId: 'protagonist', text: 'No, no, no. El vecino prendió el TALADRO 🛠️' },
      {
        fromId: 'amigo',
        text: '¿Contra la pared del cuarto de Xime? ¿A esta hora?',
      },
      {
        fromId: 'protagonist',
        text: 'Directo a su almohada, la va a despertar',
      },
      {
        fromId: 'protagonist',
        text: '¿Cómo lo paramos sin hacer MÁS ruido?',
      },
    ],
  },
  {
    id: 'whatsapp_gato_jose_13',
    hour: 13,
    sceneAction: 'cat-prowl',
    messages: [
      {
        fromId: 'protagonist',
        text: 'Hay un GATO en la cocina 🐱 Entró por la ventana y va directo al cuarto de Xime',
      },
      {
        fromId: 'majo',
        text: 'Esperen. Ese no es un gato cualquiera: es EL GATO DE JOSE, ¡lo conozco!',
      },
      {
        fromId: 'amigo',
        text: 'Trae algo en el cuello… viene en modo misión 👀',
      },
      {
        fromId: 'protagonist',
        text: 'Si salta sobre Xime, la despierta. Esto no es casualidad…',
      },
    ],
  },
  {
    id: 'whatsapp_jose_revela_15',
    hour: 15,
    sceneAction: 'jose-peek',
    messages: [
      {
        fromId: 'amigo',
        text: 'Chicos… acabo de ver a JOSE espiando desde el balcón de enfrente',
      },
      {
        fromId: 'natalia',
        text: 'Confirmo: binoculares, una corneta y cara de villano de película 📡',
      },
      {
        fromId: 'saulo',
        text: '¡TIENE UN PLAN RIVAL! Quiere despertarla y llevarla a SU cumpleaños sorpresa',
      },
      {
        fromId: 'protagonist',
        text: 'Y el gato era su avanzada. No nos va a robar el cumpleaños de Xime 😤',
      },
    ],
  },
  {
    id: 'whatsapp_sonambula_18',
    hour: 18,
    choiceEventId: 'beat_sonambula_event',
    sceneAction: 'ximena-stir',
    messages: [
      { fromId: 'protagonist', text: '🚨 La puerta del cuarto se abrió' },
      {
        fromId: 'protagonist',
        text: 'Xime viene SONÁMBULA hacia el baño, ojos cerrados y el cintillo de Bonnie todo torcido',
      },
      { fromId: 'amigo', text: 'Nadie respira. NADIE. RESPIRA.' },
      {
        fromId: 'protagonist',
        text: 'Va a pasar rozando TODA la evidencia de la fiesta… ¿qué hacemos?',
      },
    ],
  },
  {
    id: 'whatsapp_apagon_20',
    hour: 20,
    choiceEventId: 'disturbio_apagon',
    messages: [
      { fromId: 'protagonist', text: 'Se fue la LUZ 💡 Todo el depa apagado' },
      {
        fromId: 'alan',
        text: 'Fue un cortocircuito, la caja de fusibles está muerta',
      },
      {
        fromId: 'amigo',
        text: 'Ojo: su ventilador se paró. Si nota el silencio, se despierta',
      },
      {
        fromId: 'protagonist',
        text: 'Y en este silencio cualquier ruido se escucha el doble… ¿qué hacemos?',
      },
    ],
  },
  {
    id: 'whatsapp_jose_filtrado_20',
    hour: 20,
    messages: [
      {
        fromId: 'samantha',
        text: 'Paren todo. Me reenviaron una captura del otro chat… 📱',
      },
      { fromId: 'samantha', text: 'Miren lo que escribió Jose en su grupo 👀' },
      { fromId: 'jose', text: 'disfruten su fiestita 👀 a las 12 Xime celebra conmigo' },
      { fromId: 'amigo', text: '¿¿QUÉ DIJO?? 😤' },
      {
        fromId: 'protagonist',
        text: 'Eso no va a pasar. A seguir, en silencio',
      },
    ],
  },
  {
    id: 'whatsapp_recta_final_21',
    hour: 21,
    messages: [
      { fromId: 'protagonist', text: 'Quedan 3 horas ⏰ Recta final' },
      { fromId: 'amigo', text: 'La casa ya huele a fiesta contenida…' },
      {
        fromId: 'fatima',
        text: 'La torta casi lista, todo en mínimo volumen 🤫',
      },
      {
        fromId: 'protagonist',
        text: 'El sueño de Xime está más ligero: cierren lo que falta sin hacer ruido',
      },
    ],
  },
  {
    id: 'whatsapp_ultima_hora_23',
    hour: 23,
    messages: [
      { fromId: 'protagonist', text: '23:00. Última hora 😬' },
      { fromId: 'amigo', text: 'Xime se revuelve cada vez más seguido…' },
      { fromId: 'samantha', text: 'Su cuerpo ya presiente el cumpleaños 🎂' },
      {
        fromId: 'protagonist',
        text: 'Terminen lo que estén haciendo. A las 00:00 la despertamos NOSOTROS, con la sorpresa lista',
      },
    ],
  },
];

export const getThreadsAtHour = (hour: number): WhatsappThread[] =>
  WHATSAPP_THREADS.filter((t) => t.hour === hour);
