import { EndingDefinition } from '@/types/game.types';

export const ENDINGS_DATA: Record<string, EndingDefinition> = {
  // Derrotas
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
    title: 'El Abandono Frío',
    description:
      'La moral cayó por el suelo. Ximena se sintió olvidada y prefirió pasar su cumpleaños sola fuera de la ciudad.',
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
      '¡Ximena abrió la puerta y todos gritaron ¡SORPRESA! La fiesta de sus 60 cumpleaños fue todo un éxito y la alegría inundó el lugar.',
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
