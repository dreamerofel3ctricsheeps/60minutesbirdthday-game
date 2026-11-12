import { create } from 'zustand';
import { GamePhase } from '@/types/game.types';

interface GameState {
  phase: GamePhase;
  isPaused: boolean;
  selectedCharacterId: string;
  setPhase: (phase: GamePhase) => void;
  togglePause: () => void;
  setPause: (paused: boolean) => void;
  setSelectedCharacterId: (id: string) => void;
  resetGame: () => void;
}

export const useGameStore = create<GameState>((set) => ({
  phase: 'MENU',
  isPaused: false,
  selectedCharacterId: 'natalia',

  setPhase: (phase) => set({ phase }),
  togglePause: () => set((s) => ({ isPaused: !s.isPaused })),
  setPause: (isPaused) => set({ isPaused }),
  setSelectedCharacterId: (selectedCharacterId) => set({ selectedCharacterId }),
  resetGame: () => set({ phase: 'MENU', isPaused: false }),
}));
