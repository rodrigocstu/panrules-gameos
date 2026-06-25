import { useState, useCallback } from 'react';

// Clave con versión para poder romper compatibilidad si cambia el esquema.
const STORAGE_KEY = 'palo-rules-game:progress:v1';

// Leer del localStorage con fallback gracioso.
function loadProgress() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    // Validación mínima: el objeto debe tener las claves esperadas.
    if (
      typeof parsed !== 'object' ||
      parsed === null ||
      typeof parsed.levelIdx !== 'number' ||
      !Array.isArray(parsed.completed) ||
      typeof parsed.attempts !== 'object'
    ) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

// Persistir al localStorage con fallback gracioso (p.ej. modo incógnito bloqueado).
function saveProgress(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // Si el almacenamiento no está disponible, el juego sigue funcionando en memoria.
  }
}

/**
 * useProgress — gestiona y persiste el progreso del jugador.
 *
 * API:
 *   levelIdx       : number           — índice del nivel actual.
 *   setLevelIdx    : (n: number) => void
 *   completed      : Set<number>      — ids de niveles completados.
 *   markCompleted  : (id: number) => void
 *   attempts       : Record<number, number> — intentos por id de nivel.
 *   recordAttempt  : (id: number) => void
 *   reset          : () => void       — borra el progreso y reinicia.
 */
export function useProgress() {
  const [state, setState] = useState(() => {
    const saved = loadProgress();
    if (saved) {
      return {
        levelIdx: saved.levelIdx,
        completed: new Set(saved.completed),
        attempts: saved.attempts,
      };
    }
    return {
      levelIdx: 0,
      completed: new Set(),
      attempts: {},
    };
  });

  // Persiste cada vez que se actualiza el estado.
  const persist = useCallback((next) => {
    saveProgress({
      levelIdx: next.levelIdx,
      completed: Array.from(next.completed),
      attempts: next.attempts,
    });
  }, []);

  const setLevelIdx = useCallback(
    (n) => {
      setState((prev) => {
        const next = { ...prev, levelIdx: n };
        persist(next);
        return next;
      });
    },
    [persist]
  );

  const markCompleted = useCallback(
    (id) => {
      setState((prev) => {
        if (prev.completed.has(id)) return prev; // ya está; evitar re-renders.
        const next = { ...prev, completed: new Set(prev.completed).add(id) };
        persist(next);
        return next;
      });
    },
    [persist]
  );

  const recordAttempt = useCallback(
    (id) => {
      setState((prev) => {
        const next = {
          ...prev,
          attempts: { ...prev.attempts, [id]: (prev.attempts[id] ?? 0) + 1 },
        };
        persist(next);
        return next;
      });
    },
    [persist]
  );

  const reset = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Silencioso.
    }
    setState({ levelIdx: 0, completed: new Set(), attempts: {} });
  }, []);

  return {
    levelIdx: state.levelIdx,
    setLevelIdx,
    completed: state.completed,
    markCompleted,
    attempts: state.attempts,
    recordAttempt,
    reset,
  };
}
