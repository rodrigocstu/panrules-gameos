import { useState, useEffect, useCallback, useRef } from 'react';

const PREFIX = 'panrules-gameos:layout:v1:';

function clamp(value, min, max) {
  let v = value;
  if (min != null) v = Math.max(min, v);
  if (max != null) v = Math.min(max, v);
  return v;
}

function readStorage(key, min, max, fallback) {
  try {
    const stored = localStorage.getItem(PREFIX + key);
    if (stored !== null) {
      const n = Number(stored);
      if (!isNaN(n) && n === clamp(n, min, max)) return n;
    }
  } catch (_) {
    // localStorage no disponible (p.ej. modo privado con restricción de escritura)
  }
  return fallback;
}

// Gestiona el redimensionado arrastrable de un panel del dashboard.
// Retorna [size, onMouseDown, setSize].
// size es null cuando defaultSize es null y no hay valor almacenado.
export function useDragResize({ axis, defaultSize, minSize, maxSize, storageKey }) {
  const [size, setSize] = useState(() =>
    readStorage(storageKey, minSize, maxSize, defaultSize)
  );

  // Ref siempre sincronizado con el último render (patrón concurrent-safe).
  // Permite que onMouseDown capture el tamaño actual sin estar en sus deps.
  const sizeRef = useRef(size);
  sizeRef.current = size;

  // Limpia listeners si el componente se desmonta durante un drag (Invariante #7).
  const cleanupRef = useRef(null);
  useEffect(() => () => cleanupRef.current?.(), []);

  const onMouseDown = useCallback(
    (e) => {
      e.preventDefault();
      const startPos = axis === 'horizontal' ? e.clientX : e.clientY;
      const startSize = sizeRef.current ?? 0; // valor exacto al iniciar el drag

      const onMove = (me) => {
        const delta = (axis === 'horizontal' ? me.clientX : me.clientY) - startPos;
        setSize(clamp(startSize + delta, minSize, maxSize));
      };

      const cleanup = () => {
        document.removeEventListener('mousemove', onMove);
        document.removeEventListener('mouseup', onUp);
        cleanupRef.current = null;
      };

      // Calcula el tamaño final directamente del evento (no desde sizeRef)
      // para evitar race condition si React no re-renderizó aún entre mousemove y mouseup.
      const onUp = (upEvent) => {
        const finalDelta = (axis === 'horizontal' ? upEvent.clientX : upEvent.clientY) - startPos;
        const finalSize = clamp(startSize + finalDelta, minSize, maxSize);
        cleanup();
        try {
          localStorage.setItem(PREFIX + storageKey, String(finalSize));
        } catch (_) {
          // localStorage no disponible
        }
      };

      cleanupRef.current = cleanup;
      document.addEventListener('mousemove', onMove);
      document.addEventListener('mouseup', onUp);
    },
    [axis, minSize, maxSize, storageKey]
  );

  return [size, onMouseDown, setSize];
}
