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
 * Singleton registry outside of React lifecycle for maximum performance.
 * OPTIMIZATION: Uses direct iterators to avoid massive Array.from() calls.
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

    // Use a direct for...of iterator for speed over registry values
    for (const shortcuts of _registry.values()) {
        const len = shortcuts.length;
        for (let i = 0; i < len; i++) {
            const config = shortcuts[i];
            if (!config.key) continue;

            const matchKey = config.key.toLowerCase() === pressedKey.toLowerCase();
            const matchCtrl  = !!config.ctrl  === (event.ctrlKey  || event.metaKey);
            const matchShift = !!config.shift === event.shiftKey;
            const matchAlt   = !!config.alt   === event.altKey;

            if (matchKey && matchCtrl && matchShift && matchAlt) {
                const focused = isInputFocused();
                const isUniversal = pressedKey === 'Escape' || (pressedKey === 'Enter' && (event.ctrlKey || event.metaKey));

                // Blocker local context shortcuts if input is focused, unless Universal
                if (!isUniversal && focused && !config.ignoreInputFocus) continue;

                if (config.preventDefault !== false) event.preventDefault();
                config.action();
                return;
            }
        }
    }
}

/**
 * Expose registry for help dialog without React state overhead.
 */
export const getShortcutRegistry = () => Object.fromEntries(_registry);

export function useKeyboardShortcuts(
    shortcuts: ShortcutConfig[],
    id: string,
    active: boolean = true
): void {
    // Keep a stable reference to shortcuts to avoid map thrashing
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
