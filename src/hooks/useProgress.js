import { useState, useCallback, useRef } from 'react';

// Clave con versión para poder romper compatibilidad si cambia el esquema.
// v2 añade puntuación y racha (T3.7).
const STORAGE_KEY = 'panrules-gameos:progress:v2';

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

// Forma SERIALIZADA del progreso (Sets como arrays) con todos los campos
// normalizados a valores por defecto. Es la base sobre la que aplicamos el
// delta de cada acción antes de persistir.
function normalize(raw) {
  const p = raw ?? {};
  return {
    levelIdx: typeof p.levelIdx === 'number' ? p.levelIdx : 0,
    completed: Array.isArray(p.completed) ? p.completed : [],
    attempts: p.attempts && typeof p.attempts === 'object' ? p.attempts : {},
    score: typeof p.score === 'number' ? p.score : 0,
    streak: typeof p.streak === 'number' ? p.streak : 0,
    bestStreak: typeof p.bestStreak === 'number' ? p.bestStreak : 0,
    scored: Array.isArray(p.scored) ? p.scored : [],
  };
}

// Convierte la forma serializada (arrays) en el estado en memoria (Sets).
function toState(serialized) {
  return {
    levelIdx: serialized.levelIdx,
    completed: new Set(serialized.completed),
    attempts: serialized.attempts,
    score: serialized.score,
    streak: serialized.streak,
    bestStreak: serialized.bestStreak,
    scored: new Set(serialized.scored),
  };
}

const EMPTY_SERIALIZED = {
  levelIdx: 0,
  completed: [],
  attempts: {},
  score: 0,
  streak: 0,
  bestStreak: 0,
  scored: [],
};

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
  const [state, setState] = useState(() => toState(normalize(loadProgress())));

  // Espejo serializado del último valor que intentamos persistir. Sólo se usa
  // como base de respaldo cuando localStorage NO está disponible (modo incógnito
  // bloqueado): permite encadenar incrementos en memoria entre llamadas síncronas
  // sin depender del estado de React (que aún no se ha re-renderizado).
  const lastPersistedRef = useRef(normalize(loadProgress()));

  // Núcleo anti-carrera: re-lee el valor PERSISTIDO fresco desde localStorage
  // justo antes de escribir, aplica el reducer de ESTA acción sobre esa base
  // fresca, persiste el resultado y refleja el merge en el estado en memoria.
  //
  // Si otra pestaña escribió entre nuestro montaje y esta acción, `loadProgress()`
  // devuelve SU valor y le aplicamos nuestro delta encima (en vez de pisar su
  // escritura con nuestro snapshot viejo). Si localStorage no está disponible,
  // caemos al espejo en memoria para no perder el progreso de la sesión.
  //
  // `commit` corre EXACTAMENTE una vez por acción del usuario (fuera del updater
  // de setState), de modo que el doble render de StrictMode no re-aplica el delta.
  const commit = useCallback((reducer) => {
    const fresh = loadProgress();
    const base = normalize(fresh ?? lastPersistedRef.current);
    const merged = normalize(reducer(base));
    lastPersistedRef.current = merged;
    saveProgress(merged);
    setState(toState(merged));
  }, []);

  const setLevelIdx = useCallback(
    (n) => {
      commit((base) => ({ ...base, levelIdx: n }));
    },
    [commit]
  );

  const markCompleted = useCallback(
    (id) => {
      commit((base) =>
        base.completed.includes(id)
          ? base
          : { ...base, completed: [...base.completed, id] }
      );
    },
    [commit]
  );

  const recordAttempt = useCallback(
    (id) => {
      commit((base) => ({
        ...base,
        attempts: { ...base.attempts, [id]: (base.attempts[id] ?? 0) + 1 },
      }));
    },
    [commit]
  );

  // Registra el resultado de un commit: cuenta el intento, y según `won` actualiza
  // completado, puntuación y racha (T3.7). El reducer opera sobre la base FRESCA
  // del localStorage: los intentos se suman (contador aditivo), `completed` y
  // `scored` se unen por inclusión, y el guard `scored` evita re-sumar puntos.
  const recordResult = useCallback(
    (id, won) => {
      commit((base) => {
        const attempts = { ...base.attempts, [id]: (base.attempts[id] ?? 0) + 1 };
        const completed = new Set(base.completed);
        const scored = new Set(base.scored);
        let { score, streak, bestStreak } = base;

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

        return {
          ...base,
          attempts,
          completed: [...completed],
          scored: [...scored],
          score,
          streak,
          bestStreak,
        };
      });
    },
    [commit]
  );

  const reset = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Silencioso.
    }
    lastPersistedRef.current = { ...EMPTY_SERIALIZED };
    setState(toState(EMPTY_SERIALIZED));
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
