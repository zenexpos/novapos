'use client';

import { useEffect, useRef } from 'react';

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

/**
 * Registre Singleton hors du cycle de vie React pour une performance maximale.
 * OPTIMISATION FORENSIC : Utilise une itération directe sur les listes pour éviter Array.from() 
 * et les ralentissements sur keydown.
 */
const _registry = new Map<string, ShortcutConfig[]>();
let _listenerAttached = false;

const isInputFocused = (): boolean => {
    if (typeof document === 'undefined') return false;
    const el = document.activeElement;
    if (!el) return false;
    
    const tag = el.tagName;
    const role = el.getAttribute('role');
    const type = el.getAttribute('type');
    
    return (
        tag === 'INPUT' ||
        tag === 'TEXTAREA' ||
        tag === 'SELECT' ||
        role === 'combobox' ||
        role === 'searchbox' ||
        role === 'spinbutton' ||
        role === 'textbox' ||
        type === 'number' ||
        el.getAttribute('contenteditable') === 'true' ||
        (el as HTMLElement).isContentEditable
    );
};

function _globalHandler(event: KeyboardEvent) {
    const pressedKey = event.key;
    if (!pressedKey) return;

    // OPTIMISATION : Itération directe sur les valeurs de la Map (évite les allocations mémoire inutiles)
    for (const shortcuts of _registry.values()) {
        for (let i = 0; i < shortcuts.length; i++) {
            const config = shortcuts[i];
            if (!config.key) continue;

            const matchKey = config.key.toLowerCase() === pressedKey.toLowerCase();
            const matchCtrl  = !!config.ctrl  === (event.ctrlKey  || event.metaKey);
            const matchShift = !!config.shift === event.shiftKey;
            const matchAlt   = !!config.alt   === event.altKey;

            if (matchKey && matchCtrl && matchShift && matchAlt) {
                const focused = isInputFocused();
                const isUniversal = pressedKey === 'Escape' || (pressedKey === 'Enter' && (event.ctrlKey || event.metaKey));

                // Bloquer les raccourcis locaux si un input est focus, sauf pour Escape/Enter
                if (!isUniversal && focused && !config.ignoreInputFocus) continue;

                if (config.preventDefault !== false) event.preventDefault();
                config.action();
                return;
            }
        }
    }
}

/**
 * Expose le registre pour le dialogue d'aide sans passer par l'état React.
 */
export const getShortcutRegistry = () => Object.fromEntries(_registry);

export function useKeyboardShortcuts(
    shortcuts: ShortcutConfig[],
    id: string,
    active: boolean = true
): void {
    // Utilisation d'une ref pour stabiliser les actions sans re-render
    const shortcutsRef = useRef(shortcuts);
    shortcutsRef.current = shortcuts;

    useEffect(() => {
        if (typeof window === 'undefined') return;

        if (!_listenerAttached) {
            window.addEventListener('keydown', _globalHandler, { passive: false });
            _listenerAttached = true;
        }

        if (active) {
            _registry.set(id, shortcuts);
        } else {
            _registry.delete(id);
        }

        return () => {
            _registry.delete(id);
        };
    }, [id, active, shortcuts]); 
}
