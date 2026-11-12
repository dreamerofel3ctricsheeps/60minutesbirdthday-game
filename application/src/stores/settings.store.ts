import { create } from 'zustand';

interface SettingsState {
  masterVolume: number;
  sfxVolume: number;
  musicVolume: number;
  retroShadersEnabled: boolean;
  setMasterVolume: (volume: number) => void;
  setSfxVolume: (volume: number) => void;
  setMusicVolume: (volume: number) => void;
  toggleRetroShaders: () => void;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  masterVolume: 0.8,
  sfxVolume: 0.8,
  musicVolume: 0.6,
  retroShadersEnabled: true,

  setMasterVolume: (masterVolume) => set({ masterVolume }),
  setSfxVolume: (sfxVolume) => set({ sfxVolume }),
  setMusicVolume: (musicVolume) => set({ musicVolume }),
  toggleRetroShaders: () =>
    set((state) => ({ retroShadersEnabled: !state.retroShadersEnabled })),
}));
