import { VillainId } from '@/types/game.types';
import { DuelResult } from '@/game/systems/duelSystem';

/**
 * Contrato compartido de los DUELOS en escena (mejora Fase 4).
 * Los duelos se renderizan como una capa DENTRO de la escena 2D de
 * gestión (ManagementView posiciona cada arena sobre su zona); no hay
 * modal: la casa sigue visible y los demás roomies miran de fondo.
 */
export interface DuelComponentProps {
  /** Roomie que compite por el jugador (protagonista o interceptor). */
  playerId: string;
  playerName: string;
  /** Villano rival del duelo (su IA sale de duelSystem). */
  villain: VillainId;
  /** Hora actual: la IA de los villanos escala con la hora. */
  hour: number;
  /** Señal para que Ximena se revuelva en la escena (errores ruidosos). */
  onStir?: () => void;
  /** Se invoca UNA vez al terminar el duelo. */
  onFinish: (result: DuelResult) => void;
}

export const DUEL_RESULT_LABEL: Record<DuelResult, string> = {
  win: '🏆 ¡Ganaste el duelo!',
  draw: '🤝 Empate en el duelo',
  loss: '💥 El villano ganó el duelo…',
};
