import { create } from 'zustand';
import { EventDefinition } from '@/types/game.types';

interface EventStoreState {
  currentEvent: EventDefinition | null;
  history: string[];
  setCurrentEvent: (event: EventDefinition | null) => void;
  recordEventCompletion: (eventId: string) => void;
  clearEvent: () => void;
}

export const useEventStore = create<EventStoreState>((set) => ({
  currentEvent: null,
  history: [],

  setCurrentEvent: (currentEvent) => set({ currentEvent }),
  recordEventCompletion: (eventId) =>
    set((state) => ({
      history: [...state.history, eventId],
      currentEvent: null,
    })),
  clearEvent: () => set({ currentEvent: null }),
}));
