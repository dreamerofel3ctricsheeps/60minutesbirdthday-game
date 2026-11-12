import { EventDefinition } from '@/types/game.types';

export const THREAT_EVENTS: Record<string, EventDefinition> = {
  threat_whatsapp_interrogation: {
    id: 'threat_whatsapp_interrogation',
    title: 'El Interrogatorio de WhatsApp',
    description:
      'Ximena manda un mensaje urgente al grupo: "¿Por qué hay tanto ruido en el departamento y de quién es ese cargo desconocido en la tarjeta?"',
    type: 'THREAT',
    weight: 80,
    choices: [
      {
        id: 'whatsapp_clever_lie',
        label: 'Inventar una excusa médica convincente',
        description: 'Requiere chequeo de Lógica o Carisma (Itzel / Alan).',
        skillCheck: { attribute: 'charisma', difficulty: 5 },
        consequences: [
          { type: 'MODIFY_METER', meter: 'suspicion', value: -15 },
        ],
      },
      {
        id: 'whatsapp_panic_reply',
        label: 'Responder con evasivas apresuradas',
        description: 'Sin chequeo, pero genera dudas inmediatas.',
        consequences: [
          { type: 'MODIFY_METER', meter: 'suspicion', value: 15 },
          { type: 'MODIFY_METER', meter: 'morale', value: -5 },
        ],
      },
    ],
  },
  threat_flash_visit: {
    id: 'threat_flash_visit',
    title: 'La Visita Relámpago',
    description:
      '¡Alerta roja! Ximena avisa que está a 5 minutos de llegar al edificio porque olvidó su bata clínica y las llaves.',
    type: 'THREAT',
    weight: 60,
    choices: [
      {
        id: 'flash_stealth_hide',
        label: 'Ocultar las evidencias y decoraciones en tiempo récord',
        description: 'Chequeo de Sigilo (Majo / Itzel).',
        skillCheck: { attribute: 'stealth', difficulty: 6 },
        consequences: [
          { type: 'MODIFY_METER', meter: 'suspicion', value: 5 },
        ],
      },
      {
        id: 'flash_use_distraction',
        label: 'Llamarla para fingir una emergencia médica en la facu',
        description: 'Consume energía del equipo.',
        consequences: [
          { type: 'ADD_RESOURCE', resource: 'energy', value: -1 },
          { type: 'MODIFY_METER', meter: 'suspicion', value: -10 },
        ],
      },
    ],
  },
};
