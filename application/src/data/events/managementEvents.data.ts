import { ManagementEventDefinition } from '@/types/game.types';

/**
 * Eventos de la fase de gestión (Fase 3) — framework con 3 tipos:
 *  - 'choice': decisión clásica con opciones (y chequeos de atributo).
 *  - 'minigame-qte': secuencia de teclas "¡Que no la despierten!".
 *  - 'minigame-timing': detener el marcador en la zona verde.
 *
 * Contexto: Ximena está DORMIDA. Nada de WhatsApp ni visitas: los
 * disturbios son físicos (gato, paloma, alarma, timbre) y el daño
 * siempre se mide en el medidor DESPERTAR.
 *
 * FASE 4: el pool aleatorio (RANDOM_EVENT_POOL) ya NO se sortea: cada
 * hora trae su minijuego por rotación/showdown (hourMinigames.ts) y los
 * eventos 'choice' de aquí (timbre, vecino, apagón, sonámbula) se
 * resuelven como RESPUESTAS en el grupo de WhatsApp (whatsapp.data.ts
 * los referencia por id). Los eventos minigame-qte/timing de disturbio
 * quedaron absorbidos por la rotación; sus definiciones quedan como
 * referencia de contenido.
 */
export const MANAGEMENT_EVENTS: Record<string, ManagementEventDefinition> = {
  disturbio_gato: {
    id: 'disturbio_gato',
    title: '¡El gato va a saltar!',
    description:
      'El gato del edificio está a dos pasos de la cama de Ximena, preparando el salto. Hay que atraparlo y sacarlo sin que maúlle: sigue la secuencia de movimientos en silencio.',
    kind: 'minigame-qte',
    minigameHint: 'Presiona las flechas (o WASD / botones en pantalla) en orden, antes de que se acabe el tiempo de cada una.',
  },
  disturbio_paloma: {
    id: 'disturbio_paloma',
    title: 'La paloma en la ventana',
    description:
      'Una paloma se posó en la ventana del cuarto de Ximena y está picoteando el vidrio. Hay que cerrar la ventana con un movimiento suave y preciso, sin golpe.',
    kind: 'minigame-timing',
    minigameHint: 'Detén el marcador dentro de la zona VERDE las 3 veces. Muy rápido o muy lento = golpe de ventana.',
  },
  disturbio_alarma: {
    id: 'disturbio_alarma',
    title: '¡Su celular está vibrando!',
    description:
      'La alarma del celular de Ximena vibra sobre la mesita de noche y avanza hacia el borde. Hay que llegar, tomarlo y apagarla en silencio: sigue la secuencia.',
    kind: 'minigame-qte',
    minigameHint: 'Presiona las flechas (o WASD / botones en pantalla) en orden, antes de que se acabe el tiempo de cada una.',
  },
  disturbio_timbre: {
    id: 'disturbio_timbre',
    title: '¡El timbre!',
    description:
      '¡DING DONG! El timbre sonó una vez. Es un delivery equivocado en la puerta. Ximena se revolvió en la cama...',
    kind: 'choice',
    choices: [
      {
        id: 'timbre_correr',
        label: 'Correr a abrir antes de que toque de nuevo',
        description: 'Chequeo de Velocidad: llegar en 3 segundos, sin respirar.',
        skillCheck: { attribute: 'speed', difficulty: 8 },
        consequences: [{ type: 'MODIFY_METER', meter: 'despertar', value: 2 }],
      },
      {
        id: 'timbre_ignorar',
        label: 'Ignorarlo y rezar que se vaya',
        description: 'Puede tocar otra vez... o no.',
        consequences: [{ type: 'MODIFY_METER', meter: 'despertar', value: 10 }],
      },
      {
        id: 'timbre_distraer',
        label: 'Tirar una distracción por la ventana (la caja de AliExpress)',
        description: 'Ruido lejos del cuarto: funciona, pero se pierde tiempo de fiesta.',
        consequences: [
          { type: 'MODIFY_METER', meter: 'despertar', value: 4 },
          { type: 'MODIFY_METER', meter: 'preparacion', value: -4 },
        ],
      },
    ],
  },
  disturbio_vecino: {
    id: 'disturbio_vecino',
    title: 'El vecino taladra',
    description:
      'El vecino del costado prendió un taladro contra la pared que comparte con el cuarto de Ximena. ¡A las horas que son!',
    kind: 'choice',
    choices: [
      {
        id: 'vecino_golpear_pared',
        label: 'Golpear la pared para que pare',
        description: 'Chequeo de Carisma (convencer sin gritar).',
        skillCheck: { attribute: 'charisma', difficulty: 9 },
        consequences: [{ type: 'MODIFY_METER', meter: 'despertar', value: 3 }],
      },
      {
        id: 'vecino_esperar',
        label: 'Aguantar hasta que termine solo',
        description: 'Taladro contra pared, directo a la almohada de Ximena.',
        consequences: [{ type: 'MODIFY_METER', meter: 'despertar', value: 12 }],
      },
      {
        id: 'vecino_almohadas',
        label: 'Rodear su puerta con almohadas y frazadas',
        description: 'Sigilo y textiles: el sonido se amortigua.',
        skillCheck: { attribute: 'stealth', difficulty: 8 },
        consequences: [{ type: 'MODIFY_METER', meter: 'despertar', value: 5 }],
      },
    ],
  },
  disturbio_apagon: {
    id: 'disturbio_apagon',
    title: '¡Se fue la luz!',
    description:
      'Un cortocircuito apagó el depa. El refri deja de sonar... y en el silencio total cualquier ruido propio se escucha el doble. Además, Ximena duerme con su ventilador encendido: si nota que paró, se despierta.',
    kind: 'choice',
    choices: [
      {
        id: 'apagon_reparar',
        label: 'Reparar la caja de fusibles a tientas',
        description: 'Chequeo de Lógica (Alan lo haría con los ojos cerrados).',
        skillCheck: { attribute: 'logic', difficulty: 9 },
        consequences: [
          { type: 'MODIFY_METER', meter: 'despertar', value: 2 },
          { type: 'MODIFY_METER', meter: 'preparacion', value: 4 },
        ],
      },
      {
        id: 'apagon_esperar',
        label: 'Quedarse inmóviles hasta que vuelva',
        description: 'El ventilador parado es una cuenta regresiva.',
        consequences: [{ type: 'MODIFY_METER', meter: 'despertar', value: 11 }],
      },
    ],
  },
  beat_sonambula_event: {
    id: 'beat_sonambula_event',
    title: 'Ximena sonámbula',
    description:
      'Ximena avanza dormida hacia el baño. Pasará rozando la sala donde está TODA la evidencia de la fiesta.',
    kind: 'choice',
    choices: [
      {
        id: 'sonambula_quietos',
        label: '¡Todos congelados!',
        description: 'Ni un músculo. Su paso es lento y el corazón de todos late en estéreo.',
        consequences: [{ type: 'MODIFY_METER', meter: 'despertar', value: 4 }],
      },
      {
        id: 'sonambula_esconder',
        label: 'Esconder la evidencia a las carreras',
        description: 'Chequeo de Sigilo: globos y guirnaldas fuera de su camino.',
        skillCheck: { attribute: 'stealth', difficulty: 9 },
        consequences: [{ type: 'MODIFY_METER', meter: 'despertar', value: 1 }],
      },
      {
        id: 'sonambula_guia',
        label: 'Guiarla de vuelta a su cama con cuidado',
        description: 'Chequeo de Carisma corporal: un empujoncito suave en la dirección correcta.',
        skillCheck: { attribute: 'charisma', difficulty: 10 },
        consequences: [
          { type: 'MODIFY_METER', meter: 'despertar', value: -5 },
          { type: 'MODIFY_METER', meter: 'morale', value: 5 },
        ],
      },
    ],
  },
};

/** Pool de eventos ALEATORIOS por hora (el gato queda fuera: es el tutorial de las 13:00). */
export const RANDOM_EVENT_POOL: string[] = [
  'disturbio_paloma',
  'disturbio_alarma',
  'disturbio_timbre',
  'disturbio_vecino',
  'disturbio_apagon',
];

export const getManagementEvent = (id: string): ManagementEventDefinition | undefined =>
  MANAGEMENT_EVENTS[id];
