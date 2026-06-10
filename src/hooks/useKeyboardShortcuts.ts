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
 * Enhanced input focus detection for accessible UI components.
 * Catches native elements and Radix-based primitives (Combobox, Select, Spinbuttons).
 */
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

/**
 * Singleton Keyboard Dispatcher
 * A single listener on window prevents memory leaks and ensures 
 * predictable shortcut execution across hundreds of components.
 */
const _registry = new Map<string, ShortcutConfig[]>();
let _listenerAttached = false;

function _globalHandler(event: KeyboardEvent) {
    const pressedKey = event.key;
    if (!pressedKey) return;

    // Iterate through registered buckets
    for (const shortcuts of Array.from(_registry.values())) {
        for (const config of shortcuts) {
            if (!config.key) continue;

            // Match keys (Alphanumeric case-insensitive, special keys exact)
            const matchKey = config.key.toLowerCase() === pressedKey.toLowerCase();
            const matchCtrl  = !!config.ctrl  === (event.ctrlKey  || event.metaKey);
            const matchShift = !!config.shift === event.shiftKey;
            const matchAlt   = !!config.alt   === event.altKey;

            if (matchKey && matchCtrl && matchShift && matchAlt) {
                const focused = isInputFocused();
                
                // Universal keys (Esc, Ctrl+Enter) always fire unless explicitly ignored
                const isUniversal =
                    pressedKey === 'Escape' ||
                    (pressedKey === 'Enter' && (event.ctrlKey || event.metaKey));

                if (!isUniversal && focused && !config.ignoreInputFocus) {
                    continue;
                }

                if (config.preventDefault !== false) {
                    event.preventDefault();
                }
                
                config.action();
                return; // Singleton execution: first matching shortcut wins
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
 * useKeyboardShortcuts
 * Registers a set of shortcuts in the global dispatcher.
 * Automatically handles registration in the Shortcut Help Overlay.
 */
export function useKeyboardShortcuts(
    shortcuts: ShortcutConfig[],
    id: string,
    active: boolean = true
): void {
    const actions = useContext(KeyboardShortcutsActionsContext);
    const shortcutsRef = useRef(shortcuts);
    shortcutsRef.current = shortcuts;

    // Update help overlay context
    useEffect(() => {
        if (active && actions) {
            actions.registerShortcuts(id, shortcutsRef.current);
            return () => actions.unregisterShortcuts(id);
        }
    }, [id, active, actions]);

    // Update singleton registry
    useEffect(() => {
        if (!active) {
            _registry.delete(id);
            return;
        }
        
        _ensureListener();
        
        // Proxy ensures registry always points to latest shortcut references
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
