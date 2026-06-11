'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface SettingsState {
    theme: 'light' | 'dark' | 'system';
    autoPrint: boolean;
    language: 'fr' | 'ar';
    sidebarCollapsed: boolean;
    
    actions: {
        setTheme: (theme: 'light' | 'dark' | 'system') => void;
        toggleAutoPrint: () => void;
        setLanguage: (lang: 'fr' | 'ar') => void;
        toggleSidebar: () => void;
    };
}

/**
 * متجر الإعدادات - منفصل عن منطق الأعمال لتقليل الـ Re-renders.
 */
export const useSettingsStore = create<SettingsState>()(
    persist(
        (set) => ({
            theme: 'system',
            autoPrint: false,
            language: 'fr',
            sidebarCollapsed: false,

            actions: {
                setTheme: (theme) => set({ theme }),
                toggleAutoPrint: () => set((s) => ({ autoPrint: !s.autoPrint })),
                setLanguage: (language) => set({ language }),
                toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
            },
        }),
        {
            name: 'ipos-zen-settings',
            storage: createJSONStorage(() => localStorage),
        }
    )
);

export const useSettings = () => useSettingsStore();
export const useSettingsActions = () => useSettingsStore((s) => s.actions);
