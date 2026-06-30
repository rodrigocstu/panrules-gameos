// streak-freeze — lógica pura de los tokens de congelación de racha (EGC-12, AC#3).
//
// Sin React, sin red, sin localStorage: reductores puros sobre el dominio `Streak`, de modo
// que `useStreak` los aplique dentro de su `commit()` anti-carrera y los tests los verifiquen
// con fixtures conocidos. El servidor valida lo mismo autoritativamente (ZT §4.5); estas
// funciones son la caché de cliente y la fuente de verdad de los tests.
//
// NOTA: no se importa nada de `useStreak.ts` (arrastraría React y crearía un ciclo
// hook→lib→hook); las micro-utilidades de fecha se replican aquí, idénticas en semántica.

import type { Streak } from '../types/domain';

/** Tope de tokens acumulables. El grant autoritativo (cada 7 días) vive en el Worker. */
export const MAX_FREEZE_TOKENS = 3;

/** Fecha local YYYY-MM-DD (hora del dispositivo), base de la comparación de días civiles. */
function dateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Días civiles enteros entre el día local de `fromIso` y el día local de `now`. */
function dayGap(fromIso: string, now: Date): number {
  const from = new Date(fromIso);
  const [fy, fm, fd] = dateKey(from).split('-').map(Number);
  const [ty, tm, td] = dateKey(now).split('-').map(Number);
  return Math.round((Date.UTC(ty, tm - 1, td) - Date.UTC(fy, fm - 1, fd)) / 86_400_000);
}

/** ¿El último check-in es de hoy (día local)? */
function checkedInToday(streak: Streak, now: Date): boolean {
  return !!streak.lastCheckinAt && dateKey(new Date(streak.lastCheckinAt)) === dateKey(now);
}

/**
 * La racha está "rota": se perdió al menos un día completo (`gap >= 2` desde el último
 * check-in) y aún no hay check-in hoy. Es la condición para OFRECER un freeze; no exige
 * tener tokens.
 */
export function isStreakBroken(streak: Streak | null, now: Date = new Date()): boolean {
  if (!streak) return false;
  if (checkedInToday(streak, now)) return false;
  return dayGap(streak.lastCheckinAt, now) >= 2;
}

/** ¿Procede ofrecer un freeze? Racha rota Y al menos un token disponible. */
export function canFreeze(streak: Streak | null, now: Date = new Date()): boolean {
  if (!streak || streak.freezeTokens <= 0) return false;
  return isStreakBroken(streak, now);
}

/**
 * Gasta un token para proteger una racha rota. Precondición: `canFreeze`. Efecto:
 * `freezeTokens - 1`, **`currentStreak` PRESERVADO** (es lo que el freeze protege),
 * `lastCheckinAt` puenteado a `now` (cubre el día perdido, de modo que el próximo check-in
 * sea consecutivo) y `totalDaysActive + 1`. Si no se puede congelar (sin tokens, sin racha
 * rota, o ya hay check-in hoy) devuelve el MISMO objeto: un doble-gasto concurrente es no-op.
 */
export function freezeStreak(streak: Streak, now: Date = new Date()): Streak {
  if (!canFreeze(streak, now)) return streak;
  return {
    ...streak,
    freezeTokens: streak.freezeTokens - 1,
    lastCheckinAt: now.toISOString(),
    totalDaysActive: streak.totalDaysActive + 1,
  };
}

/** Otorga un token, acotado a `MAX_FREEZE_TOKENS`. Espejo offline del grant del servidor. */
export function earnFreeze(streak: Streak): Streak {
  return { ...streak, freezeTokens: Math.min(streak.freezeTokens + 1, MAX_FREEZE_TOKENS) };
}
