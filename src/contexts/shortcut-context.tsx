'use client';

import React, { createContext, useState, useCallback, useMemo } from 'react';
import type { ShortcutConfig } from '@/hooks/common/use-keyboard-shortcuts';

interface KeyboardShortcutsActions {
  registerShortcuts: (id: string, shortcuts: ShortcutConfig[]) => void;
  unregisterShortcuts: (id: string) => void;
}

export const KeyboardShortcutsActionsContext = createContext<KeyboardShortcutsActions | undefined>(undefined);
export const KeyboardShortcutsDataContext = createContext<Record<string, ShortcutConfig[]>>({});

export function KeyboardShortcutsProvider({ children }: { children: React.ReactNode }) {
  const [allShortcuts, setAllShortcuts] = useState<Record<string, ShortcutConfig[]>>({});

  const registerShortcuts = useCallback((id: string, shortcuts: ShortcutConfig[]) => {
    setAllShortcuts(prev => ({ ...prev, [id]: shortcuts }));
  }, []);

  const unregisterShortcuts = useCallback((id: string) => {
    setAllShortcuts(prev => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  }, []);

  const actions = useMemo(() => ({ registerShortcuts, unregisterShortcuts }), [registerShortcuts, unregisterShortcuts]);

  return (
    <KeyboardShortcutsActionsContext.Provider value={actions}>
      <KeyboardShortcutsDataContext.Provider value={allShortcuts}>
        {children}
      </KeyboardShortcutsDataContext.Provider>
    </KeyboardShortcutsActionsContext.Provider>
  );
}
