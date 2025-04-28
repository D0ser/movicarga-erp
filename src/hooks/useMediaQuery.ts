import { useState, useEffect } from 'react';

/**
 * Hook personalizado para detectar si un media query coincide.
 * @param query La media query a evaluar (ej. '(max-width: 768px)')
 * @returns boolean indicando si el media query coincide
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState<boolean>(false);

  useEffect(() => {
    // Verificar si estamos en el cliente (browser)
    if (typeof window === 'undefined') {
      return;
    }

    const mediaQuery = window.matchMedia(query);

    // Establecer el valor inicial
    setMatches(mediaQuery.matches);

    // Función para actualizar el estado cuando cambia la media query
    const listener = (event: MediaQueryListEvent) => {
      setMatches(event.matches);
    };

    // Agregar el listener
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', listener);
    } else {
      // Soporte para navegadores antiguos
      mediaQuery.addListener(listener);
    }

    // Limpiar el listener cuando el componente se desmonta
    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', listener);
      } else {
        // Soporte para navegadores antiguos
        mediaQuery.removeListener(listener);
      }
    };
  }, [query]);

  return matches;
}
