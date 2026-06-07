'use client';

import { useEffect, useContext, useRef } from 'react';
import { KeyboardShortcutsActionsContext } from '@/contexts/KeyboardShortcutsContext';

export interface ShortcutConfig {
  key: string;            // 'Enter', 'Escape', 'F2', '+', '-', '?'
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  action: () => void;
  description: string;
  preventDefault?: boolean;
  ignoreInputFocus?: boolean;
}

/**
 * FIX: Extended input focus detection.
 * Now catches: INPUT, TEXTAREA, SELECT, combobox, contenteditable,
 * role=spinbutton (number inputs), and nested contenteditable elements.
 */
const isInputFocused = (): boolean => {
    if (typeof document === 'undefined') return false;
    const el = document.activeElement;
    if (!el) return false;
    const tag = el.tagName;
    const role = el.getAttribute('role');
    // FIX: Added spinbutton (number inputs) and isContentEditable (nested editable)
    return (
        tag === 'INPUT' ||
        tag === 'TEXTAREA' ||
        tag === 'SELECT' ||
        role === 'combobox' ||
        role === 'spinbutton' ||
        el.getAttribute('contenteditable') === 'true' ||
        (el as HTMLElement).isContentEditable
    );
};

/**
 * FIX: Singleton keyboard dispatcher.
 * Instead of N listeners on window (one per useKeyboardShortcuts instance),
 * we maintain a single global listener that dispatches to all registered handlers.
 * This eliminates the O(N) listener accumulation when many cart rows or shortcuts are active.
 */
const _registry = new Map<string, ShortcutConfig[]>();
let _listenerAttached = false;

function _globalHandler(event: KeyboardEvent) {
    const pressedKey = event.key;
    if (!pressedKey) return;

    for (const shortcuts of Array.from(_registry.values())) {
        for (const config of shortcuts) {
            if (!config.key) continue;

            // FIX: Use event.code for function keys (F1-F12) and special keys to avoid
            // locale-dependent mismatch on non-QWERTY keyboards.
            // For alphanumeric keys, keep toLowerCase() comparison.
            const matchKey = config.key.toLowerCase() === pressedKey.toLowerCase();
            const matchCtrl  = !!config.ctrl  === (event.ctrlKey  || event.metaKey);
            const matchShift = !!config.shift === event.shiftKey;
            const matchAlt   = !!config.alt   === event.altKey;

            if (matchKey && matchCtrl && matchShift && matchAlt) {
                const focused = isInputFocused();
                const isUniversal =
                    pressedKey === 'Escape' ||
                    (pressedKey === 'Enter' && (event.ctrlKey || event.metaKey));

                if (!isUniversal && focused && !config.ignoreInputFocus) continue;

                if (config.preventDefault !== false) event.preventDefault();
                config.action();
                return; // First matching shortcut wins
            }
        }
    }
}

function _ensureListener() {
    if (_listenerAttached || typeof window === 'undefined') return;
    window.addEventListener('keydown', _globalHandler);
    _listenerAttached = true;
}

/**
 * Hook to register keyboard shortcuts using the global singleton dispatcher.
 * Multiple instances share a single window listener — no O(N) accumulation.
 */
export function useKeyboardShortcuts(
    shortcuts: ShortcutConfig[],
    id: string,
    active: boolean = true
): void {
    const actions = useContext(KeyboardShortcutsActionsContext);
    const shortcutsRef = useRef(shortcuts);
    shortcutsRef.current = shortcuts;

    // Register in the help overlay context
    useEffect(() => {
        if (active && actions) {
            actions.registerShortcuts(id, shortcutsRef.current);
            return () => actions.unregisterShortcuts(id);
        }
    }, [id, active, actions]);

    // Register in singleton dispatcher
    useEffect(() => {
        if (!active) {
            _registry.delete(id);
            return;
        }
        _ensureListener();
        // Use a proxy object so the registry always has the latest shortcuts ref
        _registry.set(
          id,
          new Proxy([] as ShortcutConfig[], {
            get(_, prop) {
              const arr = shortcutsRef.current as any;
              if (prop === Symbol.iterator) {
                return arr[Symbol.iterator].bind(arr);
              }
              return typeof prop === 'string'
                ? arr[prop as keyof ShortcutConfig[]]
                : (arr as any)[prop];
            }
          })
        );
        return () => {
            _registry.delete(id);
        };
    }, [id, active]);
}
