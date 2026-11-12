import { StoryBeat } from '@/types/game.types';

/**
 * Beats guionados de la historia (Fase 3).
 * La gestión es un solo día: Ximena llega de su guardia a las 7:00, se va
 * a dormir y hay que tener la fiesta lista a las 00:00 sin despertarla.
 * Los beats se disparan al LLEGAR a su hora; `eventId` referencia un
 * evento de managementEvents.data que se lanza al cerrar el diálogo.
 *
 * FASE 4 — LEGADO: la historia ya NO se muestra con estos beats ni con
 * un modal narrativo: vive en el grupo de WhatsApp (whatsapp.data.ts) y
 * en las acciones de la escena 2D. Este archivo queda como referencia
 * de contenido y por compatibilidad con tests de la Fase 3.
 */
export const STORY_BEATS: StoryBeat[] = [
  {
    id: 'beat_intro',
    hour: 7,
    title: '7:00 — Llega de la guardia',
    lines: [
      'La puerta se abre. Es Ximena, destruida después de su turno de guardia en el hospital.',
      'XIMENA: "No existo hasta nuevo aviso. Duermo hasta que sea mi cumpleaños... si el mundo me deja."',
      'Se encierra en su cuarto. En cuanto se cierra la puerta, el grupo se mira: TENEMOS HASTA LAS 00:00.',
      'OBJETIVO: sube la PREPARACIÓN a 70 o más antes de medianoche y mantén el DESPERTAR lejos del 100. Si se despierta, se acabó la sorpresa.',
    ],
  },
  {
    id: 'beat_murmura',
    hour: 10,
    title: '10:00 — Habla en sueños',
    lines: [
      'Desde su cuarto se escucha a Ximena murmurar entre sueños: "...el paciente de la cama 4... pidió torta..."',
      'El grupo contiene la risa. Buena señal: duerme profundo... por ahora.',
    ],
  },
  {
    id: 'beat_primer_disturbio',
    hour: 13,
    title: '13:00 — Un visitante peludo',
    lines: [
      'Un maullido suave. EL GATO del edificio entró por la ventana de la cocina y avanza con un objetivo claro: la cama de Ximena.',
      'Si salta sobre ella, la despierta. ¡Alguien tiene que interceptarlo SIN hacer ruido!',
    ],
    eventId: 'disturbio_gato',
  },
  {
    id: 'beat_sonambula',
    hour: 18,
    title: '18:00 — ¡Se levantó!',
    lines: [
      'La puerta del cuarto se abre. Ximena camina dormida hacia el baño, con los ojos cerrados y el cintillo de Bonnie torcido.',
      'Nadie respira. Si la despiertan ahora, todo se cae.',
    ],
    eventId: 'beat_sonambula_event',
  },
  {
    id: 'beat_recta_final',
    hour: 21,
    title: '21:00 — Recta final',
    lines: [
      'Quedan 3 horas. La casa huele a fiesta contenida: falta poco y el sueño de Ximena se hace más ligero.',
      'Es el momento de cerrar lo que falta... con el volumen en mínimo absoluto.',
    ],
  },
  {
    id: 'beat_ultima_hora',
    hour: 23,
    title: '23:00 — La última hora',
    lines: [
      '23:00. Una hora para medianoche. Ximena se revuelve más seguido: su cuerpo ya presiente el cumpleaños.',
      'Terminen lo que estén haciendo. A las 00:00 la despertamos NOSOTROS, con la sorpresa lista... o no.',
    ],
  },
];

export const getBeatAtHour = (hour: number): StoryBeat | undefined =>
  STORY_BEATS.find((b) => b.hour === hour);
