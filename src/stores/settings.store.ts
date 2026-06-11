'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SettingsState {
  theme: 'light' | 'dark' | 'system';
  autoPrint: boolean;
  language: 'fr' | 'ar';
  actions: {
    setTheme: (theme: 'light' | 'dark' | 'system') => void;
    toggleAutoPrint: (enabled: boolean) => void;
    setLanguage: (lang: 'fr' | 'ar') => void;
  };
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      theme: 'system',
      autoPrint: false,
      language: 'fr',
      actions: {
        setTheme: (theme) => set({ theme }),
        toggleAutoPrint: (autoPrint) => {
          set({ autoPrint });
          localStorage.setItem('ipos-autoprint-enabled', String(autoPrint));
        },
        setLanguage: (language) => set({ language }),
      }
    }),
    { name: 'ipos-settings-storage' }
  )
);

export const useSettings = () => useSettingsStore();
export const useSettingsActions = () => useSettingsStore(state => state.actions);
