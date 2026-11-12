import { VillainId } from '@/types/game.types';
import { MinigameOutcome } from '@/game/systems/minigames';
import {
  MANAGEMENT_START_HOUR,
  MANAGEMENT_END_HOUR,
  CAT_ESCALATION_HOUR,
  JOSE_ESCALATION_HOUR,
} from '@/game/core/balance';

/**
 * DUELOS en escena contra los villanos (MEJORA de la Fase 4, playtest
 * de Jose). Cada minijuego de la hora es un DUELO 1 contra 1 frente a
 * Jose o frente a su gato, jugado DENTRO de la escena 2D (nada de
 * modal): el villano compite en la misma zona con su propia IA.
 *
 * Inspiración Mario Party INVESTIGADA (mariowiki.com / Mario Wiki):
 * - "Duelo de la cena" (cocina vs Jose): recolección competitiva de
 *   ítems que caen, tipo CONEY ISLAND (Mario Party 5: atrapar bolas de
 *   helado que caen sobre tu cono, gana quien apila más) cruzado con
 *   CAN TAKE PANCAKES (Super Mario Party: agarrar panqueques antes
 *   que el rival).
 * - "Alfombras de colores" (sala vs gato): MUSHROOM MIX-UP (Mario
 *   Party) / HEXAGON HEAT (Mario Party 2): se anuncia un color (la
 *   bandera de Toad) y todos corren a la plataforma de ese color; las
 *   demás se hunden y el ritmo se acelera ronda a ronda.
 * - "Carrera al timbre" (puerta vs Jose / showdowns): carrera por
 *   machaqueo de botones de MECHA-MARATHON (Mario Party 2: dar cuerda
 *   a tu juguete pulsando sin parar para que corra más lejos) y
 *   BUTTON MASHERS (Mario Party 5, minijuego de DUELO: pulsar las
 *   teclas mostradas, cada vez más rápido, sin aflojar).
 * - "Ducha silenciosa" (baño vs gato): precisión de timing bajo
 *   presión de HOT ROPE JUMP (Mario Party: saltar la cuerda de fuego
 *   en el instante exacto, cada vez más rápida), en formato duelo por
 *   rondas: cada ronda comparas tu precisión contra la del gato.
 *
 * Este módulo es LÓGICA PURA: parámetros de IA, puntuaciones y el
 * mapeo resultado → outcome de la hora. Los componentes de duelo solo
 * capturan entrada y animan; todo número vive aquí y está testeado.
 */

export type DuelKind = 'catch' | 'carpets' | 'race' | 'shower';

export type DuelResult = 'win' | 'draw' | 'loss';

/** Resultado del duelo → outcome que consume resolveHour (tabla Fase 4). */
export function duelResultToOutcome(result: DuelResult): MinigameOutcome {
  if (result === 'win') return 'perfect';
  if (result === 'draw') return 'partial';
  return 'fail';
}

/** Rampa de dificultad 0→1 a lo largo de la gestión (7:00 → 24:00). */
export function duelDifficultyRamp(hour: number): number {
  const span = MANAGEMENT_END_HOUR - MANAGEMENT_START_HOUR;
  return Math.max(0, Math.min(1, (hour - MANAGEMENT_START_HOUR) / span));
}

// ---------------------------------------------------------------------------
// Parámetros de IA del villano (por duelo), con escalado por hora.
// Verificación de ganabilidad (en papel, contra buena ejecución):
// - Cena: el jugador que persigue buenos atrapa ~85% de los 21 buenos
//   que caen (neto ≈ 17); Jose, con velocidad 0.80→0.93 y error
//   0.18→0.10, espera neto ≈ 10–13. Gana el buen juego; un jugador
//   descuidado (neto < 10) pierde.
// - Alfombras: el gato se equivoca con prob. 0.36→0.13 según ronda y
//   hora; un jugador atento gana la mayoría de rondas 3–1/3–2.
// - Carrera: el jugador acierta una tecla cada ~0.55 s → 12 pasos en
//   ≈ 8–9 s (con tropiezos); Jose tarda 1.02→0.78 s/paso con
//   acelerones y tropiezos ≈ 10–12 s. Carrera pareja, gana la
//   ejecución limpia; en showdown Jose sale con 4 pasos de ventaja y
//   la cosa se pone fea a propósito (es SU momento de villano).
// - Ducha: la precisión buena del jugador ronda 85–95; el gato detiene
//   su marcador con error de desviación σ ≈ 17→10 → su precisión
//   esperada es ≈ 72–80. Rondas ganables, no regaladas.
// ---------------------------------------------------------------------------

export interface DuelAiProfile {
  /** Cena (Jose): velocidad de desplazamiento, relativa a la del jugador (1 = igual). */
  catchSpeedRatio: number;
  /** Cena (Jose): probabilidad de juzgar mal un ítem (ir a por uno malo o quedarse). */
  catchErrorProb: number;
  /** Alfombras (gato): probabilidad base de correr a la alfombra equivocada en la ronda 1. */
  carpetsErrorProb: number;
  /** Alfombras (gato): milisegundos de reacción antes de salir corriendo. */
  carpetsReactionMs: number;
  /** Carrera: milisegundos por paso del villano. */
  raceStepMs: number;
  /** Carrera: probabilidad de acelerón en cada paso (el siguiente paso tarda la mitad). */
  raceBurstProb: number;
  /** Carrera: probabilidad de tropiezo en cada paso (el siguiente paso tarda el doble). */
  raceStumbleProb: number;
  /** Ducha (gato): desviación típica (σ) de su error al detener el marcador, en %. */
  showerErrorStd: number;
}

/** Perfil de IA del villano a una hora dada (escalado + escaladas 13/15). */
export function getDuelAiProfile(villain: VillainId, hour: number): DuelAiProfile {
  const ramp = duelDifficultyRamp(hour);
  const catEscalated = hour >= CAT_ESCALATION_HOUR;
  const joseEscalated = hour >= JOSE_ESCALATION_HOUR;

  // El gato "atrevido" desde las 13:00: se equivoca un 20% menos.
  const catErrorScale = catEscalated ? 0.8 : 1;
  // Jose "redobla" desde las 15:00: pasos un 8% más rápidos y mejor ojo.
  const joseSpeedScale = joseEscalated ? 0.92 : 1;

  if (villain === 'jose') {
    return {
      catchSpeedRatio: (0.8 + 0.13 * ramp) * (joseEscalated ? 1.04 : 1),
      catchErrorProb: Math.max(0.06, (0.18 - 0.08 * ramp) * (joseEscalated ? 0.85 : 1)),
      carpetsErrorProb: 0.3,
      carpetsReactionMs: 650,
      raceStepMs: (1020 - 240 * ramp) * joseSpeedScale,
      raceBurstProb: 0.12,
      raceStumbleProb: Math.max(0.04, 0.1 - 0.04 * ramp),
      showerErrorStd: 14,
    };
  }
  return {
    catchSpeedRatio: 0.7,
    catchErrorProb: 0.22,
    carpetsErrorProb: Math.max(0.1, (0.36 - 0.14 * ramp) * catErrorScale),
    carpetsReactionMs: 620 - 180 * ramp,
    raceStepMs: (900 - 160 * ramp) * (catEscalated ? 0.94 : 1),
    raceBurstProb: 0.1,
    raceStumbleProb: Math.max(0.08, 0.16 - 0.05 * ramp),
    showerErrorStd: Math.max(9, (17 - 5 * ramp) * (catEscalated ? 0.88 : 1)),
  };
}

/** Error del gato en alfombras en una ronda concreta (mejora con las rondas). */
export function catCarpetsErrorProb(profile: DuelAiProfile, round: number): number {
  return Math.max(0.08, profile.carpetsErrorProb - 0.035 * (round - 1));
}

/**
 * Alfombra que elige el gato: la correcta salvo que el azar caiga en su
 * probabilidad de error, en cuyo caso corre a una vecina equivocada.
 * Devuelve también si llegó "tarde" (su tiempo de llegada simulado).
 */
export function pickCatCarpet(
  rng: () => number,
  profile: DuelAiProfile,
  round: number,
  correctIndex: number,
  carpetCount: number
): number {
  if (rng() < catCarpetsErrorProb(profile, round)) {
    const wrong = Math.floor(rng() * (carpetCount - 1));
    return wrong >= correctIndex ? wrong + 1 : wrong;
  }
  return correctIndex;
}

/**
 * Posición (0–100) donde el GATO detiene el marcador en la ducha:
 * centro (50) + error gaussiano aproximado con σ del perfil (mejora
 * levemente ronda a ronda, como en Hot Rope Jump al "calentarse").
 */
export function catShowerStopPosition(rng: () => number, profile: DuelAiProfile, round: number): number {
  const std = Math.max(7, profile.showerErrorStd - 0.7 * (round - 1));
  // Gaussiana estándar por Box-Muller con el RNG inyectado (testeable).
  const u1 = Math.max(rng(), 1e-9);
  const u2 = rng();
  const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  const position = 50 + z * std;
  return Math.max(0, Math.min(100, Math.round(position)));
}

// ---------------------------------------------------------------------------
// Puntuaciones de los duelos (puras)
// ---------------------------------------------------------------------------

/** Cena: neto = buenos − malos de cada lado; gana el neto mayor. */
export function scoreCatchDuel(
  playerGood: number,
  playerBad: number,
  villainGood: number,
  villainBad: number
): DuelResult {
  const playerNet = playerGood - playerBad;
  const villainNet = villainGood - villainBad;
  if (playerNet > villainNet) return 'win';
  if (playerNet < villainNet) return 'loss';
  return 'draw';
}

/** Alfombras / Ducha: rondas ganadas por cada lado. */
export function scoreRoundsDuel(playerRounds: number, villainRounds: number): DuelResult {
  if (playerRounds > villainRounds) return 'win';
  if (playerRounds < villainRounds) return 'loss';
  return 'draw';
}

/** Carrera: quién llegó a la meta (y si no, quién va más avanzado). */
export function scoreRaceDuel(
  playerSteps: number,
  villainSteps: number,
  targetSteps: number
): DuelResult {
  const playerDone = playerSteps >= targetSteps;
  const villainDone = villainSteps >= targetSteps;
  if (playerDone && !villainDone) return 'win';
  if (villainDone && !playerDone) return 'loss';
  if (playerSteps > villainSteps) return 'win';
  if (playerSteps < villainSteps) return 'loss';
  return 'draw';
}
