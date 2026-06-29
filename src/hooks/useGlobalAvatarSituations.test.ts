import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import type { Streak } from '../types/domain';
import {
  selectGlobalSituation,
  useGlobalAvatarSituations,
  type GlobalAvatarSituationSignals,
} from './useGlobalAvatarSituations';
import { GLOBAL_INTERVENTIONS } from '../lib/avatar-copy';

// Construye un Streak determinista. `lastCheckinAt` se deriva de una fecha LOCAL (sin
// dependencia de zona horaria: `new Date(y, mIdx, d)` es medianoche local).
function makeStreak(overrides: Partial<Streak> = {}): Streak {
  return {
    userId: 'u1',
    currentStreak: 4,
    longestStreak: 10,
    lastCheckinAt: new Date(2026, 5, 29).toISOString(),
    totalDaysActive: 10,
    startedAt: new Date(2026, 4, 1).toISOString(),
    freezeTokens: 0,
    ...overrides,
  };
}

/** ISO local de un día concreto (mes 1-indexado). */
function isoLocal(y: number, m: number, d: number): string {
  return new Date(y, m - 1, d).toISOString();
}

const NOW = new Date(2026, 5, 29); // 29-jun-2026 local

describe('selectGlobalSituation (árbol de precedencia §5, puro y determinista)', () => {
  it('§4.1 welcome cuando no hay streak', () => {
    const r = selectGlobalSituation(null, false, false, NOW);
    expect(r?.message).toBe(GLOBAL_INTERVENTIONS.welcome_day1);
    expect(r?.guardKey).toBe('welcome');
  });

  it('§4.1 welcome cuando totalDaysActive <= 1', () => {
    const r = selectGlobalSituation(makeStreak({ totalDaysActive: 1, currentStreak: 1 }), false, false, NOW);
    expect(r?.message).toBe(GLOBAL_INTERVENTIONS.welcome_day1);
  });

  it('§4.4 broken_short cuando gap === 2', () => {
    const streak = makeStreak({ lastCheckinAt: isoLocal(2026, 6, 27), currentStreak: 3 });
    const r = selectGlobalSituation(streak, false, true, NOW);
    expect(r?.message).toBe(GLOBAL_INTERVENTIONS.broken_short);
    expect(r?.guardKey).toBe('return:2026-06-27');
  });

  it('§4.4 broken_long (gap 3-6 y racha > 5) sustituye {n} por currentStreak', () => {
    const streak = makeStreak({ lastCheckinAt: isoLocal(2026, 6, 24), currentStreak: 8 });
    const r = selectGlobalSituation(streak, false, true, NOW); // gap = 5
    expect(r?.message).toBe(
      GLOBAL_INTERVENTIONS.broken_long.replace('{n}', '8')
    );
    expect(r?.message).toContain('racha de 8 días');
  });

  it('§4.6 pause_long (gap > 7) sustituye {n} por el gap', () => {
    const streak = makeStreak({ lastCheckinAt: isoLocal(2026, 6, 18), currentStreak: 4 });
    const r = selectGlobalSituation(streak, false, false, NOW); // gap = 11
    expect(r?.message).toBe(GLOBAL_INTERVENTIONS.pause_long.replace('{n}', '11'));
    expect(r?.message).toContain('después de 11 días');
  });

  it('§4.6 pause_medium (gap 4-7 sin sub-variante §4.4)', () => {
    // gap 5 pero racha <= 5: no cae en broken_long → pausa media.
    const streak = makeStreak({ lastCheckinAt: isoLocal(2026, 6, 24), currentStreak: 3 });
    const r = selectGlobalSituation(streak, false, true, NOW);
    expect(r?.message).toBe(GLOBAL_INTERVENTIONS.pause_medium);
  });

  it('§4.3 milestone 3/7/14 con check-in hecho hoy', () => {
    const base = { lastCheckinAt: isoLocal(2026, 6, 29), totalDaysActive: 20 };
    expect(selectGlobalSituation(makeStreak({ ...base, currentStreak: 3 }), true, false, NOW)?.message).toBe(
      GLOBAL_INTERVENTIONS.streak_3
    );
    expect(selectGlobalSituation(makeStreak({ ...base, currentStreak: 7 }), true, false, NOW)?.message).toBe(
      GLOBAL_INTERVENTIONS.streak_7
    );
    expect(selectGlobalSituation(makeStreak({ ...base, currentStreak: 14 }), true, false, NOW)?.message).toBe(
      GLOBAL_INTERVENTIONS.streak_14
    );
  });

  it('precedencia: una pausa que rompe racha resuelve UNA sola situación (no welcome + roto)', () => {
    const streak = makeStreak({ lastCheckinAt: isoLocal(2026, 6, 24), currentStreak: 8, totalDaysActive: 12 });
    const r = selectGlobalSituation(streak, false, true, NOW);
    // gap 5 + racha 8 → broken_long, no pause_medium ni welcome.
    expect(r?.message).toBe(GLOBAL_INTERVENTIONS.broken_long.replace('{n}', '8'));
  });

  it('sin situación aplicable devuelve null (racha normal, check-in hoy, no hito)', () => {
    const streak = makeStreak({ lastCheckinAt: isoLocal(2026, 6, 29), currentStreak: 4, totalDaysActive: 12 });
    expect(selectGlobalSituation(streak, true, false, NOW)).toBeNull();
  });
});

describe('useGlobalAvatarSituations (one-shot, freeze imperativo, cleanup)', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
    localStorage.clear();
  });

  const welcomeSignals: GlobalAvatarSituationSignals = {
    streak: makeStreak({ totalDaysActive: 1, currentStreak: 1 }),
    todayCheckedIn: false,
    isStreakBroken: false,
    freezeTokens: 0,
    loading: false,
  };

  const neutralSignals: GlobalAvatarSituationSignals = {
    streak: makeStreak({ lastCheckinAt: new Date().toISOString(), currentStreak: 4, totalDaysActive: 12 }),
    todayCheckedIn: true,
    isStreakBroken: false,
    freezeTokens: 1,
    loading: false,
  };

  it('dispara welcome al montar con señales de día 1', () => {
    const { result } = renderHook(() => useGlobalAvatarSituations(welcomeSignals));
    expect(result.current.currentMessage).toBe(GLOBAL_INTERVENTIONS.welcome_day1);
    expect(result.current.isVisible).toBe(true);
  });

  it('no decide mientras useStreak está hidratando (loading=true)', () => {
    const { result } = renderHook(() =>
      useGlobalAvatarSituations({ ...welcomeSignals, loading: true })
    );
    expect(result.current.isVisible).toBe(false);
    expect(result.current.currentMessage).toBeNull();
  });

  it('one-shot: re-render con las mismas señales no re-dispara tras descartar', () => {
    const { result, rerender } = renderHook((props: GlobalAvatarSituationSignals) =>
      useGlobalAvatarSituations(props), { initialProps: welcomeSignals });
    expect(result.current.isVisible).toBe(true);
    act(() => result.current.dismiss());
    expect(result.current.isVisible).toBe(false);
    rerender({ ...welcomeSignals });
    expect(result.current.isVisible).toBe(false);
  });

  it('guard persistido: remontar no re-anuncia welcome', () => {
    const first = renderHook(() => useGlobalAvatarSituations(welcomeSignals));
    expect(first.result.current.isVisible).toBe(true);
    first.unmount();
    const second = renderHook(() => useGlobalAvatarSituations(welcomeSignals));
    expect(second.result.current.isVisible).toBe(false);
    expect(second.result.current.currentMessage).toBeNull();
  });

  it('onFreezeConsumed dispara la línea §4.4 freeze', () => {
    const { result } = renderHook(() => useGlobalAvatarSituations(neutralSignals));
    expect(result.current.currentMessage).toBeNull();
    act(() => result.current.onFreezeConsumed());
    expect(result.current.currentMessage).toBe(GLOBAL_INTERVENTIONS.broken_freeze);
    expect(result.current.isVisible).toBe(true);
  });

  it('limpia el timer de auto-ocultado al desmontar (invariante #7)', () => {
    // welcome dispara showMessage → un setTimeout de auto-ocultado pendiente. El desmontaje
    // debe limpiarlo. `getTimerCount` también cuenta un timer interno del scheduler de React
    // (persistente, ajeno al hook), así que se verifica que el conteo DECRECE al desmontar
    // (nuestro timer se fue), no que llegue a cero.
    const { unmount } = renderHook(() => useGlobalAvatarSituations(welcomeSignals));
    const mounted = vi.getTimerCount();
    expect(mounted).toBeGreaterThan(0);
    unmount();
    expect(vi.getTimerCount()).toBeLessThan(mounted);
  });
});
