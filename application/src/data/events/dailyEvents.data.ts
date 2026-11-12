import { EventDefinition } from '@/types/game.types';

export const DAILY_EVENTS: Record<string, EventDefinition> = {
  daily_blackout: {
    id: 'daily_blackout',
    title: 'El Apagón',
    description:
      'Un cortocircuito repentino deja a oscuras el departamento. La comida en el refrigerador corre peligro y los celulares no pueden cargarse.',
    type: 'DAILY',
    weight: 50,
    choices: [
      {
        id: 'blackout_repair_panel',
        label: 'Reparar el disyuntor principal',
        description: 'Requiere Lógica o la pasiva técnica de Alan.',
        skillCheck: { attribute: 'logic', difficulty: 6 },
        consequences: [
          { type: 'ADD_RESOURCE', resource: 'energy', value: 1 },
          { type: 'MODIFY_METER', meter: 'morale', value: 10 },
        ],
      },
      {
        id: 'blackout_candles',
        label: 'Usar velas y esperar que pase',
        description: 'Aumenta el riesgo de accidentes y reduce moral.',
        consequences: [
          { type: 'MODIFY_METER', meter: 'morale', value: -15 },
          { type: 'ADD_RESOURCE', resource: 'food', value: -1 },
        ],
      },
    ],
  },
  daily_neighbor_complaint: {
    id: 'daily_neighbor_complaint',
    title: 'Queja del Vecino Iracundo',
    description:
      'El vecino del 4B golpea la puerta furioso por el arrastre de muebles y la música de prueba.',
    type: 'DAILY',
    weight: 50,
    choices: [
      {
        id: 'neighbor_bribe_food',
        label: 'Ofrecerle una porción de comida y disculparse amablemente',
        description: 'Gasta 1 de comida.',
        consequences: [
          { type: 'ADD_RESOURCE', resource: 'food', value: -1 },
          { type: 'MODIFY_METER', meter: 'suspicion', value: -10 },
          { type: 'MODIFY_METER', meter: 'noise', value: -20 },
        ],
      },
      {
        id: 'neighbor_charm',
        label: 'Usar carisma para calmarlo (Samantha / Saulo)',
        description: 'Chequeo de Carisma.',
        skillCheck: { attribute: 'charisma', difficulty: 7 },
        consequences: [
          { type: 'MODIFY_METER', meter: 'morale', value: 5 },
          { type: 'MODIFY_METER', meter: 'noise', value: -10 },
        ],
      },
    ],
  },
};
