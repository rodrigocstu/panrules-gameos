// useStreak — racha diaria offline-first (EGC-10, AC#3).
//
// Sigue el patrón anti-carrera `commit()` de `useProgress.js`: re-lee el valor
// PERSISTIDO fresco de localStorage justo antes de escribir, aplica el reducer de la
// acción sobre esa base fresca, persiste y refleja el merge en memoria, con un espejo
// `lastPersistedRef` para almacenamiento bloqueado (incógnito).
//
// La hidratación en el montaje lee `egc_streak` de localStorage SIN tocar la red — por
// eso `StreakCounter` muestra el valor correcto al recargar offline (AC#3). El check-in
// es la fuente de verdad del servidor cuando hay backend (invariante 5), pero el valor
// local se mantiene como caché para el render inmediato.
import { useState, useEffect, useCallback, useRef } from 'react';
import type { Streak } from '../types/domain';
import { api, isOffline } from '../services/api';

const STREAK_KEY = 'egc_streak';

/** Fecha local YYYY-MM-DD (hora del dispositivo), base de la comparación de días. */
export function localDateKey(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function daysBetween(fromKey: string, toKey: string): number {
  const [fy, fm, fd] = fromKey.split('-').map(Number);
  const [ty, tm, td] = toKey.split('-').map(Number);
  const from = Date.UTC(fy, fm - 1, fd);
  const to = Date.UTC(ty, tm - 1, td);
  return Math.round((to - from) / 86_400_000);
}

function isStreak(value: unknown): value is Streak {
  if (typeof value !== 'object' || value === null) return false;
  const s = value as Record<string, unknown>;
  return (
    typeof s.userId === 'string' &&
    typeof s.currentStreak === 'number' &&
    typeof s.longestStreak === 'number' &&
    typeof s.lastCheckinAt === 'string' &&
    typeof s.totalDaysActive === 'number' &&
    typeof s.startedAt === 'string'
  );
}

function loadStreak(): Streak | null {
  try {
    const raw = localStorage.getItem(STREAK_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return isStreak(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function saveStreak(streak: Streak): void {
  try {
    localStorage.setItem(STREAK_KEY, JSON.stringify(streak));
  } catch {
    // Almacenamiento no disponible: la racha sigue viva en memoria esta sesión.
  }
}

/** Streak inicial tras el registro: arranca en 1 (AC#3). */
export function makeInitialStreak(userId: string, now: Date = new Date()): Streak {
  const iso = now.toISOString();
  return {
    userId,
    currentStreak: 1,
    longestStreak: 1,
    lastCheckinAt: iso,
    totalDaysActive: 1,
    startedAt: iso,
  };
}

/** ¿Ya se hizo check-in hoy (fecha local)? */
export function isCheckedInToday(streak: Streak | null, now: Date = new Date()): boolean {
  if (!streak?.lastCheckinAt) return false;
  return localDateKey(new Date(streak.lastCheckinAt)) === localDateKey(now);
}

/**
 * Próximo estado de la racha al hacer check-in. Mismo día → sin cambios. Día siguiente
 * consecutivo → +1. Hueco > 1 día → la racha se rompe y reinicia en 1. En todos los
 * casos avanza `totalDaysActive`, `lastCheckinAt` y `longestStreak`.
 */
export function nextStreakOnCheckin(streak: Streak, now: Date = new Date()): Streak {
  const todayKey = localDateKey(now);
  const lastKey = localDateKey(new Date(streak.lastCheckinAt));
  if (lastKey === todayKey) return streak;

  const gap = daysBetween(lastKey, todayKey);
  const currentStreak = gap === 1 ? streak.currentStreak + 1 : 1;
  return {
    ...streak,
    currentStreak,
    longestStreak: Math.max(streak.longestStreak, currentStreak),
    totalDaysActive: streak.totalDaysActive + 1,
    lastCheckinAt: now.toISOString(),
  };
}

export interface UseStreak {
  streak: Streak | null;
  todayCheckedIn: boolean;
  loading: boolean;
  /** Inicializa la racha en 1 (se llama tras el registro). */
  initStreak: (userId: string) => Streak;
  /** Registra actividad del día; idempotente dentro del mismo día local. */
  checkIn: () => void;
  /** Re-hidrata desde localStorage (sin red). */
  refresh: () => void;
}

export function useStreak(): UseStreak {
  const [streak, setStreak] = useState<Streak | null>(null);
  const [loading, setLoading] = useState(true);
  const lastPersistedRef = useRef<Streak | null>(null);

  // Núcleo anti-carrera: relee la racha fresca del localStorage, aplica el reducer
  // sobre esa base y persiste el resultado (idéntico a useProgress.commit).
  const commit = useCallback((reducer: (base: Streak | null) => Streak | null): Streak | null => {
    const fresh = loadStreak() ?? lastPersistedRef.current;
    const merged = reducer(fresh);
    lastPersistedRef.current = merged;
    if (merged) saveStreak(merged);
    setStreak(merged);
    return merged;
  }, []);

  const initStreak = useCallback(
    (userId: string): Streak => {
      const created = commit((base) => (base && base.userId === userId ? base : makeInitialStreak(userId)));
      // Sync best-effort cuando hay backend; el servidor es la fuente de verdad (inv. 5).
      void (async () => {
        try {
          const res = await api.checkin(new Date().toISOString());
          if (!isOffline(res)) setStreak(res);
        } catch {
          // Sin conexión: la racha local basta para el MVP.
        }
      })();
      return created as Streak;
    },
    [commit]
  );

  const checkIn = useCallback(() => {
    commit((base) => (base ? nextStreakOnCheckin(base) : base));
    void (async () => {
      try {
        const res = await api.checkin(new Date().toISOString());
        if (!isOffline(res)) setStreak(res);
      } catch {
        // Offline: el incremento local se sincronizará en una sesión futura.
      }
    })();
  }, [commit]);

  const refresh = useCallback(() => {
    const fresh = loadStreak();
    lastPersistedRef.current = fresh;
    setStreak(fresh);
  }, []);

  // Hidratación en el montaje: SOLO lee localStorage (independiente de la red), de modo
  // que StreakCounter renderiza el valor persistido al recargar offline (AC#3). No
  // auto-incrementa por abrir la app — el incremento por actividad lo dispara checkIn().
  useEffect(() => {
    const fresh = loadStreak();
    lastPersistedRef.current = fresh;
    setStreak(fresh);
    setLoading(false);
  }, []);

  return {
    streak,
    todayCheckedIn: isCheckedInToday(streak),
    loading,
    initStreak,
    checkIn,
    refresh,
  };
}
