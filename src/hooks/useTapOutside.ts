import { useEffect, useRef } from 'react';

/**
 * Llama a `onOutside` cuando se toca o se hace clic fuera del elemento.
 * Sirve para cerrar el detalle de una gráfica tocando cualquier otra parte de la pantalla.
 */
export function useTapOutside<T extends HTMLElement>(active: boolean, onOutside: () => void) {
  const ref = useRef<T>(null);
  const cb = useRef(onOutside);
  cb.current = onOutside;

  useEffect(() => {
    if (!active) return;
    function onDown(e: PointerEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) cb.current();
    }
    document.addEventListener('pointerdown', onDown);
    return () => document.removeEventListener('pointerdown', onDown);
  }, [active]);

  return ref;
}
