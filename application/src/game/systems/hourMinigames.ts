import { GameRun, VillainId } from '@/types/game.types';
import { MinigameOutcome } from '@/game/systems/minigames';
import { pickShowdownVillain } from '@/game/systems/villainSystem';

/**
 * Fase 4: CADA hora de gestión trae UN minijuego estilo Mario Party.
 * Qué minijuego toca es lógica pura y determinista:
 * 1. SHOWDOWN primero: si un villano activo espera en la puerta, la hora
 *    se juega interceptándolo en la puerta (ver villainSystem).
 * 2. Si no, ROTACIÓN por hora entre las zonas del mapa:
 *    cocina → sala → puerta → baño, repitiendo cada 4 horas desde las 7.
 */

export type HourMinigameKind = 'catch' | 'balloon' | 'qte' | 'timing' | 'showdown';

export type MinigameZone = 'cocina' | 'sala' | 'puerta' | 'bano';

export interface HourMinigamePlan {
  kind: HourMinigameKind;
  zone: MinigameZone;
  /** Solo en kind='showdown': el villano al que hay que interceptar. */
  villain?: VillainId;
  title: string;
  description: string;
}

/**
 * Efectos del minijuego de la hora sobre los medidores (tabla de Jose):
 * jugar bien ayuda a la fiesta y calma a Ximena; jugar mal hace ruido.
 * NO se aplica en horas de showdown (ahí manda el resultado contra el villano).
 */
export const HOUR_MINIGAME_EFFECTS: Record<MinigameOutcome, { preparacion: number; despertar: number }> = {
  perfect: { preparacion: 6, despertar: -4 },
  partial: { preparacion: 0, despertar: 0 },
  fail: { preparacion: 0, despertar: 8 },
};

/** Rotación base de minijuegos por hora (índice = (hour - 7) % 4). */
const ROTATION: HourMinigamePlan[] = [
  {
    kind: 'catch',
    zone: 'cocina',
    title: 'Atrapa la cena',
    description:
      'En la cocina vuelan los ingredientes de la cena de cumpleaños: atrapa los buenos y esquiva los que arruinarían el plato.',
  },
  {
    kind: 'balloon',
    zone: 'sala',
    title: 'Ritmo de globos',
    description:
      'Los globos de la sala se inflan siguiendo un ritmo: memoriza la secuencia y repítela sin que reviente ninguno.',
  },
  {
    kind: 'qte',
    zone: 'puerta',
    title: '¡Paquete en la puerta!',
    description:
      'Llegó un paquete ruidoso a la puerta y el repartidor no deja de tocar el timbre: recíbelo en silencio antes de que despierte a Ximena.',
  },
  {
    kind: 'timing',
    zone: 'bano',
    title: 'Sin hacer ruido',
    description:
      'Hay que cruzar el baño y el pasillo junto al cuarto de Ximena cargando cosas frágiles: muévete justo en el momento silencioso.',
  },
];

/** Plan de minijuego para la hora actual del run (estado PRE-tick). */
export function getHourMinigame(run: GameRun): HourMinigamePlan {
  const showdownVillain = pickShowdownVillain(run);
  if (showdownVillain === 'jose') {
    return {
      kind: 'showdown',
      zone: 'puerta',
      villain: 'jose',
      title: '¡Jose está en la puerta!',
      description:
        'Jose, el cerebro del plan rival, llegó a la puerta listo para despertar a Ximena y llevársela a SU fiesta. Interceptarlo es más exigente que al gato: no puede pasar.',
    };
  }
  if (showdownVillain === 'gato') {
    return {
      kind: 'showdown',
      zone: 'puerta',
      villain: 'gato',
      title: '¡El gato está en la puerta!',
      description:
        'El gato calicó de Jose, su cómplice, se coló hasta la puerta del cuarto de Ximena. Hay que atraparlo antes de que entre y la despierte.',
    };
  }

  const idx = (((run.hour - 7) % 4) + 4) % 4;
  return { ...ROTATION[idx] };
}
