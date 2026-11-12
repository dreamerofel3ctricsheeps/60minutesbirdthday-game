import { EventDefinition } from '@/types/game.types';

export const CHAIN_EVENTS: Record<string, EventDefinition> = {
  chain_space_day1: {
    id: 'chain_space_day1',
    title: 'La Transmisión Cósmica (Día 1)',
    description:
      'A las 3:00 AM, el televisor sintoniza solo el Canal 94. Emite patrones matemáticos hipnóticos y frecuencias inauditas.',
    type: 'CHAIN',
    weight: 20,
    choices: [
      {
        id: 'space_decode',
        label: 'Descifrar el algoritmo con papel y lápiz (Lógica)',
        skillCheck: { attribute: 'logic', difficulty: 6 },
        consequences: [
          { type: 'MODIFY_METER', meter: 'morale', value: 10 },
        ],
        nextEventId: 'chain_space_day2',
      },
      {
        id: 'space_abort',
        label: 'Desconectar la TV asustados',
        consequences: [
          { type: 'MODIFY_METER', meter: 'morale', value: -5 },
        ],
      },
    ],
  },
  chain_space_day2: {
    id: 'chain_space_day2',
    title: 'El Transmisor Interdimensional (Día 2)',
    description:
      'Los planos revelan cómo construir una antena de salto con la torta, cables y papel aluminio.',
    type: 'CHAIN',
    weight: 0, // Activated directly by step
    choices: [
      {
        id: 'space_build',
        label: 'Ensamblar el transmisor (Gasta 1 Energía y 1 Comida)',
        consequences: [
          { type: 'ADD_RESOURCE', resource: 'energy', value: -1 },
          { type: 'ADD_RESOURCE', resource: 'food', value: -1 },
        ],
        nextEventId: 'chain_space_day3',
      },
    ],
  },
  chain_space_day3: {
    id: 'chain_space_day3',
    title: 'La Señal hacia WASP-103b (Día 3)',
    description:
      'Un haz de taquiones atraviesa el techo. Las luces titilan y una nave de exploración se posiciona sobre el edificio.',
    type: 'CHAIN',
    weight: 0,
    choices: [
      {
        id: 'space_activate_portal',
        label: '¡Activar el portal y celebrar la fiesta en gravedad cero!',
        consequences: [
          { type: 'MODIFY_METER', meter: 'morale', value: 100 },
        ],
        nextEventId: 'ending_space',
      },
    ],
  },
};
