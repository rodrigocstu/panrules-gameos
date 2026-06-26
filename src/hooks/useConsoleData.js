import { useMemo } from 'react';
import { LEVELS } from '../data/levels';

// Lee la MISMA clave que useProgress (fuente única de verdad del progreso del
// jugador) y la combina con LEVELS para producir analítica por nivel + totales.
// La consola se monta fresca al navegar a '#/console', por lo que leer una vez
// por montaje (useMemo) es suficiente.
const PROGRESS_KEY = 'panrules-gameos:progress:v2';

export function readProgress() {
  try {
    const raw = localStorage.getItem(PROGRESS_KEY);
    if (!raw) return { completed: [], attempts: {}, score: 0, bestStreak: 0 };
    const p = JSON.parse(raw);
    return {
      completed: Array.isArray(p.completed) ? p.completed : [],
      attempts: p.attempts && typeof p.attempts === 'object' ? p.attempts : {},
      score: typeof p.score === 'number' ? p.score : 0,
      bestStreak: typeof p.bestStreak === 'number' ? p.bestStreak : 0,
    };
  } catch {
    // localStorage no disponible o JSON corrupto: analítica vacía.
    return { completed: [], attempts: {}, score: 0, bestStreak: 0 };
  }
}

// Clasifica la dificultad OBSERVADA de un nivel a partir de los intentos reales:
//   - completado en 1 intento      -> 'easy'
//   - completado en 2-3 intentos    -> 'medium'
//   - completado en 4+ intentos     -> 'hard'
//   - intentado pero no completado  -> 'attempted'
//   - nunca intentado               -> 'untried'
export function difficultyOf(level, completedSet, attempts) {
  const a = attempts[level.id] ?? 0;
  if (!completedSet.has(level.id)) {
    return a > 0 ? 'attempted' : 'untried';
  }
  if (a <= 1) return 'easy';
  if (a <= 3) return 'medium';
  return 'hard';
}

export function buildConsoleData() {
  const progress = readProgress();
  const completedSet = new Set(progress.completed);

  const perLevel = LEVELS.map((level) => ({
    id: level.id,
    title: level.title,
    tier: level.tier ?? 'F',
    tracks: level.tracks ?? [],
    completed: completedSet.has(level.id),
    attempts: progress.attempts[level.id] ?? 0,
    difficulty: difficultyOf(level, completedSet, progress.attempts),
  }));

  const totals = {
    levels: LEVELS.length,
    completed: perLevel.filter((l) => l.completed).length,
    tierF: LEVELS.filter((l) => (l.tier ?? 'F') === 'F').length,
    tierN: LEVELS.filter((l) => l.tier === 'N').length,
    tierA: LEVELS.filter((l) => l.tier === 'A').length,
    totalAttempts: Object.values(progress.attempts).reduce((s, n) => s + (Number(n) || 0), 0),
    score: progress.score,
    bestStreak: progress.bestStreak,
    hasData: progress.completed.length > 0 || Object.keys(progress.attempts).length > 0,
  };

  return { perLevel, totals };
}

export function useConsoleData() {
  return useMemo(() => buildConsoleData(), []);
}
