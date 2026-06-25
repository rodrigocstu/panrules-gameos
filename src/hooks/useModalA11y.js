import { useEffect, useRef } from 'react';

/**
 * useModalA11y — foco trap, cierre con Esc y restauración de foco.
 *
 * @param {boolean} isOpen   — si el modal está abierto
 * @param {Function} onClose — función para cerrarlo
 * @returns {{ containerRef }} — ref que debe colocarse en el nodo contenedor del modal
 *
 * Comportamiento:
 * - Al abrir: mueve el foco al primer elemento focusable dentro del contenedor.
 * - Tecla Esc: llama a onClose().
 * - Tab / Shift+Tab: cicla el foco dentro del contenedor (no escapa al documento).
 * - Al cerrar: restaura el foco al elemento que lo tenía antes de abrir.
 */
export function useModalA11y(isOpen, onClose) {
  const containerRef = useRef(null);
  // Guardamos el elemento que tenía el foco antes de abrir el modal.
  const previousFocusRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;

    // Guardar foco actual para restaurarlo al cerrar.
    previousFocusRef.current = document.activeElement;

    const container = containerRef.current;
    if (!container) return;

    // Selectores estándar de elementos focusables.
    const FOCUSABLE =
      'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

    const getFocusable = () => Array.from(container.querySelectorAll(FOCUSABLE));

    // Mover foco al primer elemento focusable.
    const focusables = getFocusable();
    if (focusables.length > 0) {
      focusables[0].focus();
    } else {
      container.focus();
    }

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        return;
      }

      if (e.key === 'Tab') {
        const items = getFocusable();
        if (items.length === 0) {
          e.preventDefault();
          return;
        }
        const first = items[0];
        const last = items[items.length - 1];

        if (e.shiftKey) {
          // Shift+Tab: si estamos en el primero, saltar al último.
          if (document.activeElement === first) {
            e.preventDefault();
            last.focus();
          }
        } else {
          // Tab: si estamos en el último, saltar al primero.
          if (document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      // Restaurar foco al cerrar.
      if (previousFocusRef.current && typeof previousFocusRef.current.focus === 'function') {
        previousFocusRef.current.focus();
      }
    };
  }, [isOpen, onClose]);

  return { containerRef };
}
