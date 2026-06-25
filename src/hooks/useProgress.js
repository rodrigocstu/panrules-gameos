import { useState, useCallback } from 'react';

// Clave con versión para poder romper compatibilidad si cambia el esquema.
// v2 añade puntuación y racha (T3.7).
const STORAGE_KEY = 'panrules-gameos:progress:v2';

const EMPTY = {
  levelIdx: 0,
  completed: new Set(),
  attempts: {},
  score: 0,
  streak: 0,
  bestStreak: 0,
  scored: new Set(), // ids ya puntuados (no volver a sumar al rejugar).
};

// Puntos por completar un nivel: 100 al primer intento, -20 por cada intento
// fallido previo en ese nivel, con un piso de 20.
function pointsFor(attemptsForId) {
  return Math.max(20, 100 - 20 * (attemptsForId - 1));
}

// Leer del localStorage con fallback gracioso.
function loadProgress() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
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
 * useProgress — gestiona y persiste el progreso del jugador (T3.2) + puntuación (T3.7).
 *
 * API:
 *   levelIdx       : number           — índice del nivel actual.
 *   setLevelIdx    : (n: number) => void
 *   completed      : Set<number>      — ids de niveles completados.
 *   markCompleted  : (id: number) => void
 *   attempts       : Record<number, number> — intentos por id de nivel.
 *   recordAttempt  : (id: number) => void
 *   recordResult   : (id: number, won: boolean) => void  — intento + puntuación + racha.
 *   score          : number           — puntuación total acumulada.
 *   streak         : number           — racha actual de aciertos seguidos.
 *   bestStreak     : number           — mejor racha alcanzada.
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
        score: saved.score ?? 0,
        streak: saved.streak ?? 0,
        bestStreak: saved.bestStreak ?? 0,
        scored: new Set(saved.scored ?? []),
      };
    }
    return { ...EMPTY, completed: new Set(), scored: new Set(), attempts: {} };
  });

  const persist = useCallback((next) => {
    saveProgress({
      levelIdx: next.levelIdx,
      completed: Array.from(next.completed),
      attempts: next.attempts,
      score: next.score,
      streak: next.streak,
      bestStreak: next.bestStreak,
      scored: Array.from(next.scored),
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
        if (prev.completed.has(id)) return prev;
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

  // Registra el resultado de un commit: cuenta el intento, y según `won` actualiza
  // completado, puntuación y racha en una sola transición de estado (T3.7).
  const recordResult = useCallback(
    (id, won) => {
      setState((prev) => {
        const attempts = { ...prev.attempts, [id]: (prev.attempts[id] ?? 0) + 1 };
        const completed = new Set(prev.completed);
        const scored = new Set(prev.scored);
        let { score, streak, bestStreak } = prev;

        if (won) {
          completed.add(id);
          if (!scored.has(id)) {
            score += pointsFor(attempts[id]);
            scored.add(id);
          }
          streak += 1;
          bestStreak = Math.max(bestStreak, streak);
        } else {
          streak = 0;
        }

        const next = { ...prev, attempts, completed, scored, score, streak, bestStreak };
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
    setState({ ...EMPTY, completed: new Set(), scored: new Set(), attempts: {} });
  }, []);

  return {
    levelIdx: state.levelIdx,
    setLevelIdx,
    completed: state.completed,
    markCompleted,
    attempts: state.attempts,
    recordAttempt,
    recordResult,
    score: state.score,
    streak: state.streak,
    bestStreak: state.bestStreak,
    reset,
  };
}
