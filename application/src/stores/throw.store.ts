import { create } from 'zustand';

export interface ThrownItemData {
  id: string;
  itemId: string;
  startX: number;
  startY: number;
  startZ: number;
  targetX: number;
  targetY: number;
  targetZ: number;
  startTime: number;
  duration: number;
  apexHeight: number;
}

export interface LandedItem {
  id: string;
  itemId: string;
  position: [number, number, number];
}

interface ThrowState {
  activeThrows: ThrownItemData[];
  landedItems: LandedItem[];
  launchThrows: (
    items: string[],
    playerPos: [number, number, number],
    dropCenter: [number, number],
    timeNow: number
  ) => void;
  onLanded: (throwId: string) => void;
  resetThrows: () => void;
}

let throwSeq = 0;

export const useThrowStore = create<ThrowState>((set, get) => ({
  activeThrows: [],
  landedItems: [],

  launchThrows: (items, playerPos, dropCenter, timeNow) => {
    if (items.length === 0) return;

    const newThrows: ThrownItemData[] = items.map((itemId, idx) => {
      throwSeq += 1;
      // Stagger slightly if throwing multiple items
      const delay = idx * 0.12;
      // Scatter target landing spot inside the elevator
      const angle = (idx / Math.max(1, items.length)) * Math.PI * 2 + Math.random() * 0.5;
      const radius = 0.4 + Math.random() * 0.8;
      const targetX = dropCenter[0] + Math.cos(angle) * radius;
      const targetZ = dropCenter[1] + Math.sin(angle) * radius;

      return {
        id: `throw_${throwSeq}_${itemId}`,
        itemId,
        startX: playerPos[0],
        startY: playerPos[1] + 0.85,
        startZ: playerPos[2],
        targetX,
        targetY: 0.18,
        targetZ,
        startTime: timeNow + delay,
        duration: 0.55 + idx * 0.08,
        apexHeight: 1.25 + Math.random() * 0.3,
      };
    });

    set({ activeThrows: [...get().activeThrows, ...newThrows] });
  },

  onLanded: (throwId) => {
    const { activeThrows, landedItems } = get();
    const landing = activeThrows.find((t) => t.id === throwId);
    if (!landing) return;

    const newLanded: LandedItem = {
      id: `landed_${landing.id}`,
      itemId: landing.itemId,
      position: [landing.targetX, landing.targetY, landing.targetZ],
    };

    set({
      activeThrows: activeThrows.filter((t) => t.id !== throwId),
      landedItems: [...landedItems, newLanded],
    });
  },

  resetThrows: () => {
    set({ activeThrows: [], landedItems: [] });
  },
}));
