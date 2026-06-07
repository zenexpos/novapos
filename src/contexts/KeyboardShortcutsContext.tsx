'use client';

import React, { createContext, useState, useCallback, useMemo } from 'react';
import type { ShortcutConfig } from '@/hooks/useKeyboardShortcuts';

/**
 * @fileOverview Système de gestion des raccourcis clavier avancé.
 * Contexte divisé pour éviter les boucles de rendu inutiles.
 */

interface KeyboardShortcutsActions {
  registerShortcuts: (id: string, shortcuts: ShortcutConfig[]) => void;
  unregisterShortcuts: (id: string) => void;
}

// Contexte d'actions stable : ne change jamais pour éviter les re-rendus des consommateurs
export const KeyboardShortcutsActionsContext = createContext<KeyboardShortcutsActions | undefined>(undefined);

// Contexte de données : consommé uniquement par la fenêtre d'aide
export const KeyboardShortcutsDataContext = createContext<Record<string, ShortcutConfig[]>>({});

export function KeyboardShortcutsProvider({ children }: { children: React.ReactNode }) {
  const [allShortcuts, setAllShortcuts] = useState<Record<string, ShortcutConfig[]>>({});

  const registerShortcuts = useCallback((id: string, shortcuts: ShortcutConfig[]) => {
    setAllShortcuts(prev => {
      // Éviter les mises à jour si les données sont identiques
      if (prev[id] === shortcuts) return prev;
      return { ...prev, [id]: shortcuts };
    });
  }, []);

  const unregisterShortcuts = useCallback((id: string) => {
    setAllShortcuts(prev => {
      if (!prev[id]) return prev;
      const next = { ...prev };
      delete next[id];
      return next;
    });
  }, []);

  // Mémoïsation pour la stabilité des fonctions de registre
  const actions = useMemo(() => ({ registerShortcuts, unregisterShortcuts }), [registerShortcuts, unregisterShortcuts]);

  return (
    <KeyboardShortcutsActionsContext.Provider value={actions}>
      <KeyboardShortcutsDataContext.Provider value={allShortcuts}>
        {children}
      </KeyboardShortcutsDataContext.Provider>
    </KeyboardShortcutsActionsContext.Provider>
  );
}
