// useGlobalAvatarSituations — selección one-shot de las situaciones GLOBALES de NORA (EGC-17).
//
// A diferencia de useAvatarInterventions (in-level, disparado por el motor de un módulo),
// este hook decide qué burbuja global mostrar a partir de las señales de racha que AppShell
// ya consume de useStreak (§4.1 bienvenida, §4.3 milestone, §4.4 streak roto, §4.6 pausa
// larga). NO llama a useStreak: recibe las señales por parámetro para preservar la única
// suscripción de AppShell (requisito de performance). Reutiliza la máquina de auto-ocultado
// + cleanup de timer de useAvatarInterventions (invariante #7); no introduce un segundo timer.
//
// One-shot: un guard persistido en localStorage (`egc_avatar_seen`) garantiza que cada
// situación se anuncie una sola vez (welcome y cada milestone para siempre; las situaciones
// de retorno una vez por evento de vuelta, vía `return:<lastCheckinKey>`). Un Set en memoria
// (useRef) evita el doble-disparo dentro de un re-render storm aun con storage bloqueado.

import { useCallback, useEffect, useRef } from 'react';
import type { Streak } from '../types/domain';
import { localDateKey, daysBetween } from './useStreak';
import { useAvatarInterventions } from './useAvatarInterventions';
import { GLOBAL_INTERVENTIONS, STREAK_DAYS_TOKEN } from '../lib/avatar-copy';

/** Auto-ocultado de las burbujas globales (ms). Más largo que el in-level (4 s) porque las
 * líneas globales son de 2-3 frases y necesitan más tiempo de lectura. */
export const GLOBAL_AUTO_HIDE_MS = 8000;

const SEEN_KEY = 'egc_avatar_seen';

/** Señales de racha que AppShell ya desestructura de useStreak. */
export interface GlobalAvatarSituationSignals {
  streak: Streak | null;
  todayCheckedIn: boolean;
  isStreakBroken: boolean;
  freezeTokens: number;
  /** useStreak aún hidratando desde localStorage: no decidir hasta que `streak` sea real
   * (evita disparar `welcome` en la ventana de carga, cuando `streak` es null transitorio). */
  loading: boolean;
}

export interface UseGlobalAvatarSituations {
  currentMessage: string | null;
  isVisible: boolean;
  dismiss: () => void;
  /** Dispara §4.4 "con Streak-Freeze consumido". Imperativo: lo invoca AppShell justo tras
   * `applyFreeze`, el único instante determinista en que "freeze consumido" es verdadero. */
  onFreezeConsumed: () => void;
}

interface ResolvedSituation {
  message: string;
  guardKey: string;
}

function loadSeen(): Set<string> {
  try {
    const raw = localStorage.getItem(SEEN_KEY);
    if (!raw) return new Set();
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return new Set();
    return new Set(parsed.filter((k): k is string => typeof k === 'string'));
  } catch {
    return new Set();
  }
}

function saveSeen(seen: Set<string>): void {
  try {
    localStorage.setItem(SEEN_KEY, JSON.stringify([...seen]));
  } catch {
    // Storage bloqueado (incógnito): el Set en memoria mantiene el one-shot esta sesión.
  }
}

/**
 * Árbol de precedencia (plan §5): una sola burbuja. Primer match gana.
 * 1. §4.1 welcome (sin historial). 2. §4.4 streak roto (por gap). 3. §4.6 pausa larga.
 * 4. §4.3 milestone (3/7/14). La variante freeze (§4.4) NO entra aquí: es imperativa.
 */
export function selectGlobalSituation(
  streak: Streak | null,
  todayCheckedIn: boolean,
  isStreakBroken: boolean,
  now: Date = new Date()
): ResolvedSituation | null {
  // 1. §4.1 bienvenida día 1 — sin historial. No depende de gap.
  if (streak === null || streak.totalDaysActive <= 1) {
    return { message: GLOBAL_INTERVENTIONS.welcome_day1, guardKey: 'welcome' };
  }

  const lastKey = localDateKey(new Date(streak.lastCheckinAt));
  const todayKey = localDateKey(now);
  const gap = daysBetween(lastKey, todayKey);
  const returnGuard = `return:${lastKey}`;

  // 2 y 3 sólo aplican al volver (sin check-in hoy).
  if (!todayCheckedIn) {
    // 2. §4.4 streak roto (gap >= 2). La variante freeze se dispara aparte.
    if (isStreakBroken) {
      if (gap === 2) {
        return { message: GLOBAL_INTERVENTIONS.broken_short, guardKey: returnGuard };
      }
      if (gap >= 3 && gap <= 6 && streak.currentStreak > 5) {
        return {
          message: GLOBAL_INTERVENTIONS.broken_long.replace(STREAK_DAYS_TOKEN, String(streak.currentStreak)),
          guardKey: returnGuard,
        };
      }
    }
    // 3. §4.6 pausa larga.
    if (gap > 7) {
      return {
        message: GLOBAL_INTERVENTIONS.pause_long.replace(STREAK_DAYS_TOKEN, String(gap)),
        guardKey: returnGuard,
      };
    }
    if (gap >= 4 && gap <= 7) {
      return { message: GLOBAL_INTERVENTIONS.pause_medium, guardKey: returnGuard };
    }
  }

  // 4. §4.3 milestone — aplica también cuando el check-in de hoy subió la racha a un hito.
  const milestone = streak.currentStreak;
  if (milestone === 3) return { message: GLOBAL_INTERVENTIONS.streak_3, guardKey: 'streak:3' };
  if (milestone === 7) return { message: GLOBAL_INTERVENTIONS.streak_7, guardKey: 'streak:7' };
  if (milestone === 14) return { message: GLOBAL_INTERVENTIONS.streak_14, guardKey: 'streak:14' };

  return null;
}

export function useGlobalAvatarSituations(
  signals: GlobalAvatarSituationSignals
): UseGlobalAvatarSituations {
  const { currentMessage, isVisible, showMessage, dismiss } = useAvatarInterventions(GLOBAL_AUTO_HIDE_MS);

  // Guard one-shot: se carga una vez al montar y se mantiene en memoria (espejo del persistido).
  const seenRef = useRef<Set<string> | null>(null);
  if (seenRef.current === null) seenRef.current = loadSeen();

  const markSeen = useCallback((key: string) => {
    const seen = seenRef.current;
    if (!seen) return;
    seen.add(key);
    saveSeen(seen);
  }, []);

  const { streak, todayCheckedIn, isStreakBroken, loading } = signals;

  useEffect(() => {
    if (loading) return;
    const resolved = selectGlobalSituation(streak, todayCheckedIn, isStreakBroken);
    if (!resolved) return;
    const seen = seenRef.current;
    if (!seen || seen.has(resolved.guardKey)) return;
    markSeen(resolved.guardKey);
    showMessage(resolved.message);
  }, [loading, streak, todayCheckedIn, isStreakBroken, markSeen, showMessage]);

  const onFreezeConsumed = useCallback(() => {
    showMessage(GLOBAL_INTERVENTIONS.broken_freeze);
  }, [showMessage]);

  return { currentMessage, isVisible, dismiss, onFreezeConsumed };
}
