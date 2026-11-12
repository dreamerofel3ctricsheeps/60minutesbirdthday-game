import { EndingDefinition } from '@/types/game.types';

export const ENDINGS_DATA: Record<string, EndingDefinition> = {
  // Derrotas
  RIVAL_PARTY_DEFEAT: {
    id: 'RIVAL_PARTY_DEFEAT',
    title: 'El Cumpleaños Rival',
    description:
      'Jose entró al cuarto, despertó a Ximena con una sonrisa de villano triunfal y se la llevó a SU fiesta sorpresa, con el gato de cómplice abriendo camino. La sorpresa de los roomies quedó en sala de espera: el cumpleaños fue increíble… pero fue el de Jose.',
    priority: 110,
    isVictory: false,
  },
  WAKE_DEFEAT: {
    id: 'WAKE_DEFEAT',
    title: '¡Se despertó!',
    description:
      'Un ruido de más y Ximena abrió los ojos a mitad de la tarde, con media fiesta a medio armar frente a ella. No hubo sorpresa: solo roomies congelados con un globo en la mano.',
    priority: 100,
    isVictory: false,
  },
  WEAK_PARTY_ENDING: {
    id: 'WEAK_PARTY_ENDING',
    title: 'La Fiesta Floja',
    description:
      'Llegó la medianoche y la despertaron con todo el cariño del mundo... pero la fiesta quedó a medias: faltó comida, faltó decoración y sobró silencio incómodo. Cumpleaños celebrado, sorpresa a mitad de precio.',
    priority: 40,
    isVictory: false,
  },
  SUSPICION_DEFEAT: {
    id: 'SUSPICION_DEFEAT',
    title: 'La Ruina Total',
    description:
      'Ximena llegó de imprevisto, descubrió el departamento caótico y las mentiras. La fiesta fue cancelada y la confianza se destruyó.',
    priority: 100,
    isVictory: false,
  },
  MORALE_DEFEAT: {
    id: 'MORALE_DEFEAT',
    title: 'El Abandono',
    description:
      'La moral del grupo cayó a cero entre tanto sigilo y cansancio acumulado. Uno a uno, los roomies se fueron a dormir a sus cuartos y la fiesta sorpresa quedó abandonada antes de medianoche.',
    priority: 95,
    isVictory: false,
  },
  POLICE_RAID: {
    id: 'POLICE_RAID',
    title: 'Clausura Policial',
    description:
      'El ruido incesante y los vecinos alarmados llamaron a las autoridades. La policía desalojó el departamento antes de que Ximena llegara.',
    priority: 90,
    isVictory: false,
  },
  STARVATION_DEFEAT: {
    id: 'STARVATION_DEFEAT',
    title: 'Deserción por Inanición',
    description:
      'Sin comida ni recursos básicos, el grupo se agotó físicamente y renunció a organizar la sorpresa.',
    priority: 85,
    isVictory: false,
  },
  // Victorias
  STANDARD_VICTORY: {
    id: 'STANDARD_VICTORY',
    title: '¡Sorpresa Inolvidable!',
    description:
      '00:00 en punto. La despertaron cantando, con la sala decorada, la comida lista y el regalo envuelto: Ximena pasó de un turno de guardia eterno al mejor cumpleaños de su vida, sin haber sospechado nada entre sueños.',
    priority: 50,
    isVictory: true,
  },
  SPACE_VICTORY: {
    id: 'SPACE_VICTORY',
    title: 'Cumpleaños Espacial en WASP-103b',
    description:
      '¡El transmisor funcionó! El departamento fue transportado a la órbita de un exoplaneta y bailaron en gravedad cero junto a entidades alienígenas.',
    priority: 70,
    isVictory: true,
  },
};
