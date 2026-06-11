'use client';

import { useState, useEffect, useMemo } from 'react';

/**
 * useDebounce - Retarde la mise à jour d'une valeur pour réduire les traitements.
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

/**
 * useDebouncedAbortSignal - Optimisé pour React 19 pour assurer la stabilité des références.
 * Résout le problème de gel de l'interface en évitant les boucles infinies dans les tableaux de dépendances.
 * Retourne un objet stable qui ne change que lorsque la valeur d'entrée se stabilise.
 */
export function useDebouncedAbortSignal<T>(value: T, delay: number): {
  debouncedValue: T;
  signal: AbortSignal;
} {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  const [controller, setController] = useState(() => new AbortController());

  useEffect(() => {
    // Créer un nouveau contrôleur pour chaque nouvelle recherche
    const newController = new AbortController();
    
    const handler = setTimeout(() => {
      setDebouncedValue(value);
      setController(newController);
    }, delay);

    return () => {
      clearTimeout(handler);
      // Annuler l'opération précédente immédiatement lors de la saisie d'un nouveau caractère
      newController.abort();
    };
  }, [value, delay]);

  // L'encapsulation dans useMemo est la clé pour éviter les boucles de rendu infinies
  return useMemo(() => ({
    debouncedValue,
    signal: controller.signal,
  }), [debouncedValue, controller]);
}
