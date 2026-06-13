'use client';

import React, { createContext, useMemo } from 'react';

/**
 * @fileOverview Système de gestion des raccourcis clavier optimisé.
 * Le contexte est désormais purement structurel pour éviter les re-rendus globaux.
 * La logique d'exécution est déléguée au singleton dans le hook.
 */

export const KeyboardShortcutsActionsContext = createContext<any>(null);
export const KeyboardShortcutsDataContext = createContext<any>(null);

export function KeyboardShortcutsProvider({ children }: { children: React.ReactNode }) {
  // Le provider ne contient plus d'état réactif pour éviter de déclencher des re-rendus de toute l'app
  const value = useMemo(() => ({}), []);

  return (
    <KeyboardShortcutsActionsContext.Provider value={value}>
      <KeyboardShortcutsDataContext.Provider value={value}>
        {children}
      </KeyboardShortcutsDataContext.Provider>
    </KeyboardShortcutsActionsContext.Provider>
  );
}
