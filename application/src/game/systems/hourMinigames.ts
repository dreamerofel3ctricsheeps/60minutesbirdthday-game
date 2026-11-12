import { GameRun, VillainId } from '@/types/game.types';
import { MinigameOutcome } from '@/game/systems/minigames';
import { DuelKind } from '@/game/systems/duelSystem';
import { pickShowdownVillain } from '@/game/systems/villainSystem';

/**
 * MEJORA Fase 4: CADA hora de gestión trae UN DUELO estilo Mario Party
 * contra uno de los villanos, jugado DENTRO de la escena 2D del mapa
 * (la casa de muñecas): nada de modal como campo de juego.
 * Qué duelo toca es lógica pura y determinista:
 * 1. SHOWDOWN primero: si un villano espera en la puerta, la hora se
 *    juega como "Carrera al timbre" contra él, con ventaja inicial
 *    para el villano (ver duelSystem / hourResolution).
 * 2. Si no, ROTACIÓN por hora entre las zonas del mapa:
 *    cocina → sala → puerta → baño, repitiendo cada 4 horas desde las 7.
 *    Cada zona tiene su villano: cocina y puerta son territorio de
 *    Jose; la sala y el baño, de su gato espía.
 *
 * MAPEO INSPIRACIÓN MARIO PARTY → DUELO (investigado en mariowiki):
 * - cocina · "Coney Island" (MP5) + "Can Take Pancakes" (Super Mario
 *   Party): atrapar lo que cae, en competencia directa con el rival.
 * - sala · "Mushroom Mix-Up" (MP) / "Hexagon Heat" (MP2): correr a la
 *   plataforma del color anunciado antes de que las demás se hundan.
 * - puerta · "Mecha-Marathon" (MP2) + "Button Mashers" (MP5, duelo):
 *   carrera avanzando a golpe de teclas correctas, sin aflojar.
 * - baño · "Hot Rope Jump" (MP): timing de precisión bajo presión,
 *   aquí en formato de duelo por rondas contra el gato.
 */

export type HourMinigameKind = DuelKind;

export type MinigameZone = 'cocina' | 'sala' | 'puerta' | 'bano';

export interface HourMinigamePlan {
  kind: HourMinigameKind;
  zone: MinigameZone;
  /** El villano contra el que se compite en este duelo (SIEMPRE hay uno). */
  villain: VillainId;
  /** True si es el showdown de la puerta (consecuencias especiales). */
  showdown: boolean;
  title: string;
  description: string;
  /** Minijuego real de Mario Party que lo inspira (documentado). */
  inspiration: string;
}

/**
 * Efectos del duelo de la hora sobre los medidores (tabla de Jose):
 * ganar el duelo ayuda a la fiesta y calma a Ximena; perderlo hace ruido.
 * NO se aplica en horas de showdown (ahí manda el resultado contra el villano).
 * El mapeo resultado → outcome vive en duelSystem.duelResultToOutcome:
 * win = perfect, draw = partial, loss = fail.
 */
export const HOUR_MINIGAME_EFFECTS: Record<MinigameOutcome, { preparacion: number; despertar: number }> = {
  perfect: { preparacion: 6, despertar: -4 },
  partial: { preparacion: 0, despertar: 0 },
  fail: { preparacion: 0, despertar: 8 },
};

/** Rotación base de duelos por hora (índice = (hour - 7) % 4). */
const ROTATION: HourMinigamePlan[] = [
  {
    kind: 'catch',
    zone: 'cocina',
    villain: 'jose',
    showdown: false,
    title: 'Duelo de la cena',
    description:
      'Jose se metió a la cocina a "ayudar"… a SU manera. Caen los ingredientes de la cena: atrapa más que él con tu olla y esquiva lo ruidoso antes de que despierte a Ximena.',
    inspiration: 'Coney Island (Mario Party 5) + Can Take Pancakes (Super Mario Party)',
  },
  {
    kind: 'carpets',
    zone: 'sala',
    villain: 'gato',
    showdown: false,
    title: 'Alfombras de colores',
    description:
      'El gato de Jose se pasea por la sala. Cuando suene el color, corre a esa alfombra antes que él: quien se equivoque o llegue tarde pierde la ronda. Gana quien se lleve 3 rondas.',
    inspiration: 'Mushroom Mix-Up (Mario Party) / Hexagon Heat (Mario Party 2)',
  },
  {
    kind: 'race',
    zone: 'puerta',
    villain: 'jose',
    showdown: false,
    title: 'Carrera al timbre',
    description:
      '¡El repartidor no deja de tocar el timbre y Jose corre a abrirle para armar escándalo! Corre por el pasillo pulsando las flechas correctas y llega a la puerta antes que él.',
    inspiration: 'Mecha-Marathon (Mario Party 2) + Button Mashers (Mario Party 5, duelo)',
  },
  {
    kind: 'shower',
    zone: 'bano',
    villain: 'gato',
    showdown: false,
    title: 'Ducha silenciosa',
    description:
      'El gato quiere abrir la ducha junto al cuarto de Ximena. Duelo de precisión: detén el chorro justo en el punto silencioso, ronda a ronda, mejor que él. Mejor de 5 rondas.',
    inspiration: 'Hot Rope Jump (Mario Party), en formato duelo de precisión por rondas',
  },
];

/** Plan de duelo para la hora actual del run (estado PRE-tick). */
export function getHourMinigame(run: GameRun): HourMinigamePlan {
  const showdownVillain = pickShowdownVillain(run);
  if (showdownVillain) {
    return {
      kind: 'race',
      zone: 'puerta',
      villain: showdownVillain,
      showdown: true,
      title:
        showdownVillain === 'jose'
          ? '¡SHOWDOWN! Jose está en la puerta'
          : '¡SHOWDOWN! El gato está en la puerta',
      description:
        showdownVillain === 'jose'
          ? 'Jose, el cerebro del plan rival, ya va a mitad de pasillo hacia el cuarto de Ximena. Si llega a la puerta antes que tú, la despierta y se la lleva a SU fiesta. ¡A correr!'
          : 'El gato de Jose ya va a mitad de pasillo, directo a saltar sobre la cama de Ximena. Si llega antes que tú, la despierta del susto. ¡A correr!',
      inspiration: 'Mecha-Marathon (Mario Party 2) + Button Mashers (Mario Party 5, duelo)',
    };
  }

  const idx = (((run.hour - 7) % 4) + 4) % 4;
  return { ...ROTATION[idx] };
}
