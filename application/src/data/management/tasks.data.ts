import { TaskDefinition } from '@/types/game.types';

/**
 * Catálogo de tareas de la fase de gestión (Fase 3).
 *
 * Reglas (definidas junto al sistema en game/systems/managementSystem.ts):
 * - Una tarea ocupa a UN roomie durante `durationHours` horas completas.
 * - Al COMPLETARSE suma `preparationGain` a Preparación y `noise` a
 *   Despertar (el ruido "golpea" al terminar el trabajo).
 * - Personaje afín (affinityCharacterIds): +50% de Preparación (redondeado
 *   hacia arriba) y -2 de ruido, porque trabaja con más cuidado.
 * - La zona indica dónde se VE al roomie en la escena 2D mientras trabaja.
 */
export const TASKS_DATA: Record<string, TaskDefinition> = {
  decorar_sala: {
    id: 'decorar_sala',
    name: 'Decorar la sala',
    zone: 'sala',
    durationHours: 2,
    noise: 4,
    preparationGain: 14,
    attribute: 'charisma',
    affinityCharacterIds: ['samantha', 'saulo'],
    description: 'Guirnaldas, mesa de fiesta y el letrero de cumpleaños.',
    icon: '🎉',
  },
  cocinar: {
    id: 'cocinar',
    name: 'Cocinar',
    zone: 'cocina',
    durationHours: 3,
    noise: 5,
    preparationGain: 18,
    attribute: 'logic',
    affinityCharacterIds: ['fatima'],
    description: 'La comida de la fiesta, con la cocina como campo de batalla.',
    icon: '🍳',
  },
  envolver_regalo: {
    id: 'envolver_regalo',
    name: 'Envolver el regalo',
    zone: 'sala',
    durationHours: 1,
    noise: 1,
    preparationGain: 8,
    attribute: 'logic',
    affinityCharacterIds: ['majo'],
    description: 'Papel, cinta y un moño decente. Corto y casi silencioso.',
    icon: '🎁',
  },
  inflar_globos: {
    id: 'inflar_globos',
    name: 'Inflar globos',
    zone: 'sala',
    durationHours: 1,
    noise: 10,
    preparationGain: 10,
    attribute: 'speed',
    affinityCharacterIds: ['natalia'],
    description: 'Rápido, pero cada globo que revienta es un infarto grupal.',
    icon: '🎈',
  },
  ordenar_limpiar: {
    id: 'ordenar_limpiar',
    name: 'Ordenar y limpiar',
    zone: 'sala',
    durationHours: 2,
    noise: 3,
    preparationGain: 10,
    attribute: 'stealth',
    affinityCharacterIds: ['majo'],
    description: 'Que el depa se vea "normal" si Ximena se asoma entre sueños.',
    icon: '🧹',
  },
  esconder_evidencia: {
    id: 'esconder_evidencia',
    name: 'Esconder evidencia',
    zone: 'sala',
    durationHours: 2,
    noise: 2,
    preparationGain: 8,
    despertarDelta: -6,
    attribute: 'stealth',
    affinityCharacterIds: ['itzel'],
    description: 'Boletas, bolsas y restos de la recolección: que no quede rastro. Además calma el ambiente (-6 Despertar).',
    icon: '🙈',
  },
  vigia: {
    id: 'vigia',
    name: 'Vigía en la puerta',
    zone: 'puerta',
    durationHours: 2,
    noise: 0,
    preparationGain: 0,
    attribute: 'stealth',
    affinityCharacterIds: ['itzel', 'majo'],
    description: 'Guardia junto a la puerta de Ximena. Mientras haya vigía, los disturbios se interceptan con ventaja.',
    icon: '👀',
  },
  preparar_musica: {
    id: 'preparar_musica',
    name: 'Preparar la música',
    zone: 'cocina',
    durationHours: 2,
    noise: 6,
    preparationGain: 12,
    attribute: 'logic',
    affinityCharacterIds: ['alan'],
    description: 'Playlist, parlante y la prueba de sonido a volumen mínimo... casi mínimo.',
    icon: '🎧',
  },
  descansar: {
    id: 'descansar',
    name: 'Descansar',
    zone: 'sala',
    durationHours: 1,
    noise: 0,
    preparationGain: 0,
    moraleDelta: 15,
    attribute: 'logic',
    description: 'Una siesta corta en el sillón. Recupera Moral del grupo (+15).',
    icon: '😴',
  },
};

export const getTaskById = (id: string): TaskDefinition | undefined => TASKS_DATA[id];

export const ALL_TASKS: TaskDefinition[] = Object.values(TASKS_DATA);
