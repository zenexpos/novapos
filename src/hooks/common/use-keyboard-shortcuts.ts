'use client';

import { useEffect, useContext, useRef } from 'react';
import { KeyboardShortcutsActionsContext } from '@/contexts/shortcut-context';

export interface ShortcutConfig {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  action: () => void;
  description: string;
  preventDefault?: boolean;
  ignoreInputFocus?: boolean;
}

const _registry = new Map<string, ShortcutConfig[]>();
let _listenerAttached = false;

function _globalHandler(event: KeyboardEvent) {
    const pressedKey = event.key;
    if (!pressedKey) return;

    for (const shortcuts of Array.from(_registry.values())) {
        for (const config of shortcuts) {
            const matchKey = config.key.toLowerCase() === pressedKey.toLowerCase();
            const matchCtrl  = !!config.ctrl  === (event.ctrlKey  || event.metaKey);
            const matchShift = !!config.shift === event.shiftKey;
            const matchAlt   = !!config.alt   === event.altKey;

            if (matchKey && matchCtrl && matchShift && matchAlt) {
                if (config.preventDefault !== false) event.preventDefault();
                config.action();
                return;
            }
        }
    }
}

export function useKeyboardShortcuts(shortcuts: ShortcutConfig[], id: string, active = true) {
    const actions = useContext(KeyboardShortcutsActionsContext);
    const shortcutsRef = useRef(shortcuts);
    shortcutsRef.current = shortcuts;

    useEffect(() => {
        if (active && actions) {
            actions.registerShortcuts(id, shortcutsRef.current);
            return () => actions.unregisterShortcuts(id);
        }
    }, [id, active, actions]);

    useEffect(() => {
        if (!active) {
            _registry.delete(id);
            return;
        }
        
        if (!_listenerAttached && typeof window !== 'undefined') {
            window.addEventListener('keydown', _globalHandler);
            _listenerAttached = true;
        }
        
        _registry.set(id, shortcutsRef.current);
        return () => { _registry.delete(id); };
    }, [id, active]);
}
